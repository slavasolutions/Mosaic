/**
 * Build the JSON-LD subset of a Mosaic-resolved record.
 *
 * Per mosaic-web profile §6, a record opts in to JSON-LD emission by
 * declaring an `@type` field. The schema.org payload is the record minus
 * Mosaic-internal fields (`slug`, `url`, `modifiers`, `theme`), with
 * `@context` filled in from the record or defaulted to `https://schema.org`.
 *
 * Returns `null` when the record has no `@type` (no JSON-LD to surface).
 */

export interface MosaicLikeRecord {
  [k: string]: unknown;
}

const INTERNAL_FIELDS = ['slug', 'url', 'modifiers', 'theme', 'sources', 'opaque'];

export function buildJsonLd(record: MosaicLikeRecord): MosaicLikeRecord | null {
  const data = (record.data && typeof record.data === 'object'
    ? (record.data as MosaicLikeRecord)
    : record) as MosaicLikeRecord;
  if (typeof data['@type'] !== 'string') return null;
  const out: MosaicLikeRecord = {
    '@context': typeof data['@context'] === 'string' ? data['@context'] : 'https://schema.org',
  };
  for (const k of Object.keys(data)) {
    if (k === '@context') continue;
    if (INTERNAL_FIELDS.includes(k)) continue;
    out[k] = data[k];
  }
  return out;
}
