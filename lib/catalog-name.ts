/**
 * Normalize catalog strings so `&` and `and` (and spacing) match the same
 * for series names, set names, sealed series/set, etc.
 */
export function normalizeCatalogNameForMatch(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/,/g, " ")
    .replace(/\s*&\s*/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

export function catalogNamesEqual(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  return normalizeCatalogNameForMatch(a) === normalizeCatalogNameForMatch(b);
}
