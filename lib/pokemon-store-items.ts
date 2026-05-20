import type { CardItem, SealedProduct } from "@/app/PokemonStore/client-components/ssr/items-data";

export type PokemonStoreItem = CardItem | SealedProduct;

export function getItemKey(item: PokemonStoreItem): string {
  return `${item.type}-${item.id}`;
}

export function getItemTitle(item: PokemonStoreItem): string {
  return item.type === "card"
    ? item.card || "Unknown Card"
    : item.product_name || "Unknown Product";
}

export function getItemSubtitle(item: PokemonStoreItem): string {
  return item.type === "card"
    ? item.set || item.series || "Unknown Set"
    : item.sealed_series || item.sealed_set || "Unknown Series";
}

export function getItemMetaRows(item: PokemonStoreItem): string[] {
  if (item.type === "card") {
    return [
      `Set: ${item.set || "Unknown"}`,
      `Rarity: ${item.rarity || "Unknown"}`,
      `PSA Grade: ${item.psa_grade || "Ungraded"}`,
    ];
  }

  return [
    `Type: ${item.product_type || "Unknown"}`,
    `Series: ${item.sealed_series || "Unknown"}`,
    `Packs: ${item.packs || 0}`,
  ];
}

export function isValidStoreItem(item: PokemonStoreItem | null | undefined): item is PokemonStoreItem {
  if (!item || !item.id || !item.type || item.price === undefined) return false;
  return item.type === "card" ? Boolean(item.card) : Boolean(item.product_name);
}

