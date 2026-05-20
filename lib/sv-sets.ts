/**
 * Scarlet & Violet era set metadata (three-letter codes + display names).
 * Use for UI chips and for resolving inventory `set` strings to codes when series is SV.
 */

import { normalizeCatalogNameForMatch } from "./catalog-name";

export type SvSetMeta = {
  readonly code: string;
  readonly name: string;
  /** Alternate spellings as stored in your DB */
  readonly aliases?: readonly string[];
};

/** Release order — useful for sorted filter lists */
export const SV_SETS: readonly SvSetMeta[] = [
  { code: "SVI", name: "Scarlet & Violet", aliases: ["SV Base"] },
  { code: "SVE", name: "Basic Energies", aliases: ["Basic Energy"] },
  { code: "PAL", name: "Paldea Evolved" },
  { code: "OBF", name: "Obsidian Flames" },
  { code: "MEW", name: "151", aliases: ["Pokémon 151", "Pokemon 151", "MEW 151"] },
  { code: "PAR", name: "Paradox Rift" },
  { code: "PAF", name: "Paldean Fates" },
  { code: "TEF", name: "Temporal Forces" },
  { code: "TWM", name: "Twilight Masquerade" },
  { code: "SFA", name: "Shrouded Fable" },
  { code: "SCR", name: "Stellar Crown" },
  { code: "SSP", name: "Surging Sparks" },
  { code: "PRE", name: "Prismatic Evolutions" },
  { code: "JTG", name: "Journey Together" },
  { code: "DRI", name: "Destined Rivals" },
  { code: "BLK", name: "Black Bolt" },
  { code: "WHT", name: "White Flare" },
] as const;

function normalizeKey(value: string): string {
  return normalizeCatalogNameForMatch(value);
}

function buildLookup(): Map<string, SvSetMeta> {
  const map = new Map<string, SvSetMeta>();
  for (const entry of SV_SETS) {
    map.set(normalizeKey(entry.name), entry);
    for (const alias of entry.aliases ?? []) {
      const key = normalizeKey(alias);
      if (!map.has(key)) map.set(key, entry);
    }
  }
  return map;
}

const byNormalizedName = buildLookup();

/** True if `series` from inventory should be treated as the Scarlet & Violet block */
export function matchesScarletVioletSeries(
  series: string | null | undefined
): boolean {
  if (!series) return false;
  const n = normalizeKey(series);
  return (
    n === "scarlet and violet" ||
    n === "sv" ||
    n === "scarlet/violet" ||
    n === "pokemon sv" ||
    n === "pokémon sv"
  );
}

/** Resolve a card/set label from your DB to SV set metadata, if it matches known SV sets */
export function findSvSetBySetName(
  setName: string | null | undefined
): SvSetMeta | undefined {
  if (!setName) return undefined;
  return byNormalizedName.get(normalizeKey(setName));
}

/** Code for filters/UI when both series + set indicate an SV expansion; otherwise null */
export function getSvSetCodeForFilter(
  seriesName: string | null | undefined,
  setName: string | null | undefined
): string | null {
  if (!matchesScarletVioletSeries(seriesName)) return null;
  const meta = findSvSetBySetName(setName);
  return meta?.code ?? null;
}

export const SV_SET_BY_CODE: Readonly<Record<string, SvSetMeta>> = Object.fromEntries(
  SV_SETS.map((s) => [s.code, s])
) as Readonly<Record<string, SvSetMeta>>;
