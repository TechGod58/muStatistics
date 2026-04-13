export type ParsedReferenceDraft = {
  referenceType: string;
  title: string;
  authors: string[];
  year: number | null;
  containerTitle: string;
  publisher: string;
  doi: string;
  url: string;
  abstractText: string;
  keywords: string[];
  rawText: string;
};

function normalizeAuthors(value: string[]): string[] {
  return value
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function normalizeKeywords(value: string[]): string[] {
  return [...new Set(
    value
      .flatMap((item) => item.split(/[;,]/))
      .map((item) => item.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  )];
}

function parseYear(value: string): number | null {
  const match = value.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

export function parseRisReferences(text: string): ParsedReferenceDraft[] {
  const blocks = text
    .split(/\r?\nER\s+-\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);
  const items: ParsedReferenceDraft[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const fields = new Map<string, string[]>();
    for (const line of lines) {
      const match = line.match(/^([A-Z0-9]{2})\s+-\s*(.*)$/);
      if (!match) continue;
      const key = match[1];
      const value = match[2].trim();
      const bucket = fields.get(key) ?? [];
      bucket.push(value);
      fields.set(key, bucket);
    }
    if (fields.size === 0) continue;
    items.push({
      referenceType: fields.get('TY')?.[0]?.toLowerCase() || 'article',
      title: fields.get('TI')?.[0] || fields.get('T1')?.[0] || '',
      authors: normalizeAuthors([...(fields.get('AU') ?? []), ...(fields.get('A1') ?? [])]),
      year: parseYear(fields.get('PY')?.[0] || fields.get('Y1')?.[0] || ''),
      containerTitle: fields.get('JO')?.[0] || fields.get('JF')?.[0] || fields.get('T2')?.[0] || '',
      publisher: fields.get('PB')?.[0] || '',
      doi: fields.get('DO')?.[0] || '',
      url: fields.get('UR')?.[0] || '',
      abstractText: fields.get('AB')?.[0] || '',
      keywords: normalizeKeywords(fields.get('KW') ?? []),
      rawText: block
    });
  }

  return items;
}

export function parseBibtexReferences(text: string): ParsedReferenceDraft[] {
  const items: ParsedReferenceDraft[] = [];
  const entryRegex = /@(\w+)\s*\{\s*([^,]+),([\s\S]*?)\}\s*(?=@|$)/g;
  for (const match of text.matchAll(entryRegex)) {
    const [, type, , body] = match;
    const fields = new Map<string, string>();
    for (const fieldMatch of body.matchAll(/(\w+)\s*=\s*(\{[\s\S]*?\}|\"[\s\S]*?\"|[^,\n]+)\s*,?/g)) {
      const key = fieldMatch[1].toLowerCase();
      const raw = fieldMatch[2].trim().replace(/^\{|\}$/g, '').replace(/^"|"$/g, '');
      fields.set(key, raw.replace(/\s+/g, ' ').trim());
    }
    items.push({
      referenceType: type.toLowerCase(),
      title: fields.get('title') || '',
      authors: normalizeAuthors((fields.get('author') || '').split(/\sand\s/i)),
      year: parseYear(fields.get('year') || ''),
      containerTitle: fields.get('journal') || fields.get('booktitle') || '',
      publisher: fields.get('publisher') || '',
      doi: fields.get('doi') || '',
      url: fields.get('url') || '',
      abstractText: fields.get('abstract') || '',
      keywords: normalizeKeywords((fields.get('keywords') || '').split(/[;,]/)),
      rawText: match[0]
    });
  }
  return items;
}
