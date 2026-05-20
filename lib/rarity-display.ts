import { normalizeCatalogNameForMatch } from "./catalog-name";

/**
 * Map canonical (normalized) full rarity strings from your DB → short filter label.
 * Keys must match `normalizeCatalogNameForMatch(fullName)`; grid/detail still use raw DB text.
 */
const RARITY_ABBREV_BY_NORMALIZED_FULL: Readonly<Record<string, string>> = {
  "mega attack rare": "MAR",
};

/** Filter / sidebar checkbox label; falls back to the DB string if unmapped */
export function getRarityFilterLabel(dbRarity: string): string {
  const key = normalizeCatalogNameForMatch(dbRarity);
  return RARITY_ABBREV_BY_NORMALIZED_FULL[key] ?? dbRarity;
}

/** Abbreviation for search indexing (e.g. MAR); undefined if none */
export function getRarityAbbreviation(dbRarity: string): string | undefined {
  const key = normalizeCatalogNameForMatch(dbRarity);
  return RARITY_ABBREV_BY_NORMALIZED_FULL[key];
}
