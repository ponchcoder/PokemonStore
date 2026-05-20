import type { Category } from "@/app/PokemonStore/client-components/ssr/advanced-filter";
import type { CardItem, SealedProduct } from "@/app/PokemonStore/client-components/ssr/items-data";
import { catalogNamesEqual, normalizeCatalogNameForMatch } from "@/lib/catalog-name";
import { getRarityAbbreviation } from "@/lib/rarity-display";
import { isValidStoreItem, type PokemonStoreItem } from "@/lib/pokemon-store-items";

export type SortField = "price" | "psa_grade" | "uploadDate";
export type SortDirection = "asc" | "desc" | null;

function normalizeSearchChunk(raw: string | null | undefined): string {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/,/g, " ")
    .trim();
}

function appendRaritySearchParts(parts: string[], dbRarity: string | null | undefined) {
  if (dbRarity == null || String(dbRarity).trim() === "") return;
  const rarity = String(dbRarity);
  parts.push(normalizeCatalogNameForMatch(rarity));
  const abbreviation = getRarityAbbreviation(rarity);
  if (abbreviation) parts.push(normalizeCatalogNameForMatch(abbreviation));
}

function cardSearchBlob(card: CardItem): string {
  const rarityParts: string[] = [];
  appendRaritySearchParts(rarityParts, card.rarity);

  if (Array.isArray(card.other_rarities)) {
    for (const rarity of card.other_rarities) {
      appendRaritySearchParts(rarityParts, rarity == null ? undefined : String(rarity));
    }
  }

  return [
    normalizeSearchChunk(card.card),
    normalizeSearchChunk(card.card_id),
    normalizeCatalogNameForMatch(card.series),
    normalizeCatalogNameForMatch(card.set),
    ...rarityParts,
  ]
    .filter(Boolean)
    .join(" ");
}

function sealedSearchBlob(product: SealedProduct): string {
  return [
    normalizeSearchChunk(product.product_name),
    normalizeSearchChunk(product.product_id),
    normalizeCatalogNameForMatch(product.sealed_series),
    normalizeCatalogNameForMatch(product.sealed_set),
    normalizeCatalogNameForMatch(product.product_type),
  ]
    .filter(Boolean)
    .join(" ");
}

function cardMatchesSetSelection(card: CardItem, selectedSetId: string): boolean {
  if (selectedSetId.endsWith(":AllSets")) {
    const series = selectedSetId.slice(0, -":AllSets".length);
    return catalogNamesEqual(series, card.series);
  }

  const dividerIndex = selectedSetId.indexOf(":");
  if (dividerIndex === -1) return false;

  return (
    catalogNamesEqual(selectedSetId.slice(0, dividerIndex), card.series) &&
    catalogNamesEqual(selectedSetId.slice(dividerIndex + 1), card.set)
  );
}

function cardMatchesRaritySelection(card: CardItem, rarityId: string): boolean {
  if (rarityId.endsWith(":AllRarities")) {
    const prefix = rarityId.slice(0, -":AllRarities".length);
    const dividerIndex = prefix.indexOf(":");
    if (dividerIndex === -1) return false;

    return (
      catalogNamesEqual(prefix.slice(0, dividerIndex), card.series) &&
      catalogNamesEqual(prefix.slice(dividerIndex + 1), card.set)
    );
  }

  const lastDividerIndex = rarityId.lastIndexOf(":");
  if (lastDividerIndex === -1) return false;

  const rarity = rarityId.slice(lastDividerIndex + 1);
  const prefix = rarityId.slice(0, lastDividerIndex);
  const dividerIndex = prefix.indexOf(":");
  if (dividerIndex === -1) return false;

  return (
    catalogNamesEqual(prefix.slice(0, dividerIndex), card.series) &&
    catalogNamesEqual(prefix.slice(dividerIndex + 1), card.set) &&
    normalizeCatalogNameForMatch(rarity) === normalizeCatalogNameForMatch(card.rarity)
  );
}

function matchesSelectedFilters(item: PokemonStoreItem, selectedCategories: Category[]): boolean {
  const isAllProductsSelected = selectedCategories.some((cat) => cat.id === "all");
  const isCardsSelected = selectedCategories.some((cat) => cat.id === "cards");
  const isSealedSelected = selectedCategories.some((cat) => cat.id === "sealed");

  if (!isAllProductsSelected) {
    if (!isCardsSelected && !isSealedSelected) return false;
    if (isCardsSelected && !isSealedSelected && item.type !== "card") return false;
    if (isSealedSelected && !isCardsSelected && item.type !== "sealed") return false;
  }

  const specificFilters = selectedCategories.filter(
    (cat) => !cat.id.startsWith("All") && cat.id !== "all" && cat.type !== "product"
  );

  if (specificFilters.length === 0) return true;

  const rarityFilters = specificFilters.filter((cat) => cat.type === "rarity");
  const nonRarityFilters = specificFilters.filter((cat) => cat.type !== "rarity");

  if (item.type === "card") {
    const selectedSeries = nonRarityFilters.filter((filter) => filter.type === "series").map((filter) => filter.id);
    const selectedSets = nonRarityFilters.filter((filter) => filter.type === "set").map((filter) => filter.id);
    const selectedRarities = rarityFilters.map((filter) => filter.id);
    const selectedExtraRarities = nonRarityFilters.filter((filter) => filter.type === "extra").map((filter) => filter.id);
    const selectedPSAGrades = nonRarityFilters.filter((filter) => filter.type === "psa_grade").map((filter) => filter.id);
    const selectedEnergyTypes = nonRarityFilters.filter((filter) => filter.type === "energy").map((filter) => filter.id);

    if (
      selectedSeries.length > 0 &&
      !selectedSeries.some((id) => id === "AllSeries" || catalogNamesEqual(id, item.series))
    ) {
      return false;
    }

    if (selectedSets.length > 0 && !selectedSets.some((id) => cardMatchesSetSelection(item, id))) {
      return false;
    }

    if (selectedRarities.length > 0 && !selectedRarities.some((id) => cardMatchesRaritySelection(item, id))) {
      return false;
    }

    if (
      selectedExtraRarities.length > 0 &&
      !selectedExtraRarities.some((rarityId) => Array.isArray(item.other_rarities) && item.other_rarities.includes(rarityId))
    ) {
      return false;
    }

    if (selectedPSAGrades.length > 0 && !selectedPSAGrades.includes(item.psa_grade)) {
      return false;
    }

    if (selectedEnergyTypes.length > 0 && !selectedEnergyTypes.includes(item.energy_type)) {
      return false;
    }

    return true;
  }

  return nonRarityFilters.every((filter) => {
    if (filter.type === "sealed_type") return item.product_type === filter.id;
    if (filter.type === "sealed_series") {
      return filter.id.startsWith("sealed_") && catalogNamesEqual(item.sealed_series, filter.id.substring(7));
    }
    return false;
  });
}

function matchesSearch(item: PokemonStoreItem, searchTerm: string): boolean {
  const searchKeywords = normalizeCatalogNameForMatch(searchTerm)
    .split(/\s+/)
    .filter(Boolean);

  if (searchKeywords.length === 0) return true;

  const itemText = item.type === "card" ? cardSearchBlob(item) : sealedSearchBlob(item);

  return searchKeywords.every((keyword) => {
    const words = itemText.split(/\s+/).filter(Boolean);
    return words.some((word) => word.startsWith(keyword));
  });
}

function sortItems(items: PokemonStoreItem[], sortField: SortField | null, sortDirection: SortDirection): PokemonStoreItem[] {
  if (!sortField || !sortDirection) {
    return [...items].sort((a, b) => Number(a.id) - Number(b.id));
  }

  return [...items].sort((a, b) => {
    if (sortField === "uploadDate") {
      const dateA = new Date(a.uploadDate).getTime();
      const dateB = new Date(b.uploadDate).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }

    if (sortField === "price") {
      return sortDirection === "asc" ? a.price - b.price : b.price - a.price;
    }

    if (sortField === "psa_grade" && a.type === "card" && b.type === "card") {
      const gradeA = a.psa_grade === "Ungraded" ? 0 : Number.parseInt(a.psa_grade, 10);
      const gradeB = b.psa_grade === "Ungraded" ? 0 : Number.parseInt(b.psa_grade, 10);

      if (sortDirection === "asc") {
        if (gradeA === 0 && gradeB !== 0) return -1;
        if (gradeA !== 0 && gradeB === 0) return 1;
        return gradeA - gradeB;
      }

      if (gradeA === 0 && gradeB !== 0) return 1;
      if (gradeA !== 0 && gradeB === 0) return -1;
      return gradeB - gradeA;
    }

    return 0;
  });
}

export function filterPokemonStoreItems(
  items: PokemonStoreItem[],
  selectedCategories: Category[],
  searchTerm: string,
  sortField: SortField | null,
  sortDirection: SortDirection
): PokemonStoreItem[] {
  const filtered = items
    .filter(isValidStoreItem)
    .filter((item) => matchesSelectedFilters(item, selectedCategories))
    .filter((item) => matchesSearch(item, searchTerm));

  return sortItems(filtered, sortField, sortDirection);
}

