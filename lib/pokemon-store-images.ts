/** Parse comma-separated image URLs from DB text fields. */
export function parseCommaSeparatedImages(
  value: string | string[] | (string | null)[] | null | undefined,
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((img) => (typeof img === 'string' ? img.trim() : ''))
      .filter((img) => img.length > 0);
  }
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
    }
  } catch {
    // comma-separated plain text
  }
  return trimmed
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Main image first, then additional URLs (no duplicates). */
export function buildProductImageGallery(
  imageUrl: string | null | undefined,
  additionalImages: string | string[] | (string | null)[] | null | undefined,
): string[] {
  const extras = parseCommaSeparatedImages(additionalImages);
  const main = imageUrl?.trim();
  if (!main) return extras;
  return [main, ...extras.filter((url) => url !== main)];
}

export function joinCommaSeparatedImages(urls: string[]): string | null {
  const cleaned = urls.map((url) => url.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(',') : null;
}

/** First upload = main; remaining = additional (comma-separated string). */
export function splitImageUrlsForStorage(urls: string[]) {
  const cleaned = urls.map((url) => url.trim()).filter(Boolean);
  return {
    imageUrl: cleaned[0] ?? null,
    additionalImages: joinCommaSeparatedImages(cleaned.slice(1)),
  };
}
