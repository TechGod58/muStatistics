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

export type ReferenceRecordLike = {
  id?: string;
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
  rawText?: string;
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

function normalizeWhitespace(value: string): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function extractCslYear(value: unknown): number | null {
  if (!value || typeof value !== 'object') return null;
  const issued = value as { 'date-parts'?: unknown };
  if (!Array.isArray(issued['date-parts'])) return null;
  const first = issued['date-parts'][0];
  if (!Array.isArray(first) || first.length === 0) return null;
  const year = Number(first[0]);
  return Number.isFinite(year) ? year : null;
}

function normalizeCslAuthors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return normalizeAuthors(value.map((item) => {
    if (!item || typeof item !== 'object') return '';
    const author = item as { family?: unknown; given?: unknown; literal?: unknown };
    if (typeof author.literal === 'string' && author.literal.trim()) {
      return normalizeWhitespace(author.literal);
    }
    const family = typeof author.family === 'string' ? normalizeWhitespace(author.family) : '';
    const given = typeof author.given === 'string' ? normalizeWhitespace(author.given) : '';
    return [given, family].filter(Boolean).join(' ').trim();
  }));
}

function normalizeCslKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return normalizeKeywords(value.map((item) => normalizeWhitespace(String(item ?? ''))));
  }
  if (typeof value === 'string') {
    return normalizeKeywords([value]);
  }
  return [];
}

function toCslType(referenceType: string): string {
  const type = normalizeWhitespace(referenceType).toLowerCase();
  if (!type) return 'article-journal';
  if (type.includes('book')) return 'book';
  if (type.includes('thesis')) return 'thesis';
  if (type.includes('report')) return 'report';
  if (type.includes('conference') || type.includes('proceeding')) return 'paper-conference';
  if (type.includes('chapter')) return 'chapter';
  return 'article-journal';
}

function toCslAuthors(authors: string[]): Array<{ family?: string; given?: string; literal?: string }> {
  return normalizeAuthors(authors).map((name) => {
    const value = normalizeWhitespace(name);
    if (!value) return { literal: '' };
    const commaParts = value.split(',').map((item) => item.trim()).filter(Boolean);
    if (commaParts.length >= 2) {
      return {
        family: commaParts[0],
        given: commaParts.slice(1).join(' ')
      };
    }
    const words = value.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return {
        family: words[words.length - 1],
        given: words.slice(0, -1).join(' ')
      };
    }
    return { literal: value };
  }).filter((author) => Boolean(author.literal || author.family || author.given));
}

function parseRawReferenceObject(rawText: string | undefined): Record<string, unknown> {
  if (!(typeof rawText === 'string' && rawText.trim())) return {};
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const typed = parsed as Record<string, unknown>;
    if (typed.raw && typeof typed.raw === 'object' && !Array.isArray(typed.raw)) {
      return { ...(typed.raw as Record<string, unknown>) };
    }
    return { ...typed };
  } catch {
    return {};
  }
}

function setCslFieldIfPresent(target: Record<string, unknown>, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (typeof value === 'string' && !value.trim()) return;
  if (Array.isArray(value) && value.length === 0) return;
  target[key] = value;
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

export function parseCslJsonReferences(text: string): ParsedReferenceDraft[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  const payload = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { items?: unknown }).items)
      ? (parsed as { items: unknown[] }).items
      : [];

  const items: ParsedReferenceDraft[] = [];
  for (const item of payload) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const title = typeof row.title === 'string' ? normalizeWhitespace(row.title) : '';
    const referenceType = typeof row.type === 'string' && row.type.trim() ? normalizeWhitespace(row.type).toLowerCase() : 'article';
    const containerTitleRaw = Array.isArray(row['container-title'])
      ? row['container-title'].find((entry) => typeof entry === 'string')
      : row['container-title'];
    const doiRaw = typeof row.DOI === 'string' ? row.DOI : (typeof row.doi === 'string' ? row.doi : '');
    const urlRaw = typeof row.URL === 'string' ? row.URL : (typeof row.url === 'string' ? row.url : '');
    items.push({
      referenceType,
      title,
      authors: normalizeCslAuthors(row.author),
      year: extractCslYear(row.issued),
      containerTitle: typeof containerTitleRaw === 'string' ? normalizeWhitespace(containerTitleRaw) : '',
      publisher: typeof row.publisher === 'string' ? normalizeWhitespace(row.publisher) : '',
      doi: typeof doiRaw === 'string' ? normalizeWhitespace(doiRaw) : '',
      url: typeof urlRaw === 'string' ? normalizeWhitespace(urlRaw) : '',
      abstractText: typeof row.abstract === 'string' ? normalizeWhitespace(row.abstract) : '',
      keywords: normalizeCslKeywords(row.keyword),
      rawText: JSON.stringify(item)
    });
  }
  return items.filter((item) => item.title || item.authors.length || item.doi || item.url);
}

function toBibtexType(referenceType: string): string {
  const type = normalizeWhitespace(referenceType).toLowerCase();
  if (!type) return 'article';
  if (type.includes('book')) return 'book';
  if (type.includes('thesis')) return 'phdthesis';
  if (type.includes('report')) return 'techreport';
  if (type.includes('conference') || type.includes('proceeding')) return 'inproceedings';
  return 'article';
}

function toBibtexKey(reference: ReferenceRecordLike): string {
  const firstAuthor = normalizeWhitespace(reference.authors[0] ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const year = reference.year ? String(reference.year) : 'noyear';
  const titleToken = normalizeWhitespace(reference.title).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'untitled';
  return `${firstAuthor || 'ref'}${year}${titleToken}`;
}

function escapeBibtexValue(value: string): string {
  return String(value ?? '').replace(/[{}]/g, '').trim();
}

export function serializeBibtexReferences(references: ReferenceRecordLike[]): string {
  const lines: string[] = [];
  for (const reference of references) {
    const key = toBibtexKey(reference);
    const type = toBibtexType(reference.referenceType);
    const candidateFields: Array<[string, string]> = [
      ['title', reference.title],
      ['author', reference.authors.join(' and ')],
      ['year', reference.year ? String(reference.year) : ''],
      ['journal', reference.containerTitle],
      ['publisher', reference.publisher],
      ['doi', reference.doi],
      ['url', reference.url],
      ['keywords', reference.keywords.join('; ')],
      ['abstract', reference.abstractText]
    ];
    const fields: Array<[string, string]> = [];
    for (const field of candidateFields) {
      if (normalizeWhitespace(field[1])) {
        fields.push(field);
      }
    }
    lines.push(`@${type}{${key},`);
    for (let index = 0; index < fields.length; index += 1) {
      const [name, value] = fields[index];
      const suffix = index === fields.length - 1 ? '' : ',';
      lines.push(`  ${name} = {${escapeBibtexValue(value)}}${suffix}`);
    }
    lines.push('}');
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}

function toRisType(referenceType: string): string {
  const type = normalizeWhitespace(referenceType).toLowerCase();
  if (!type) return 'JOUR';
  if (type.includes('book')) return 'BOOK';
  if (type.includes('thesis')) return 'THES';
  if (type.includes('report')) return 'RPRT';
  if (type.includes('conference') || type.includes('proceeding')) return 'CONF';
  return 'JOUR';
}

function pushRisField(lines: string[], tag: string, value: string): void {
  const text = normalizeWhitespace(value);
  if (!text) return;
  lines.push(`${tag}  - ${text}`);
}

export function serializeRisReferences(references: ReferenceRecordLike[]): string {
  const blocks: string[] = [];
  for (const reference of references) {
    const lines: string[] = [];
    lines.push(`TY  - ${toRisType(reference.referenceType)}`);
    pushRisField(lines, 'TI', reference.title);
    for (const author of reference.authors) {
      pushRisField(lines, 'AU', author);
    }
    if (reference.year) {
      pushRisField(lines, 'PY', String(reference.year));
    }
    pushRisField(lines, 'JO', reference.containerTitle);
    pushRisField(lines, 'PB', reference.publisher);
    pushRisField(lines, 'DO', reference.doi);
    pushRisField(lines, 'UR', reference.url);
    pushRisField(lines, 'AB', reference.abstractText);
    for (const keyword of reference.keywords) {
      pushRisField(lines, 'KW', keyword);
    }
    lines.push('ER  -');
    blocks.push(lines.join('\n'));
  }
  return `${blocks.join('\n\n').trim()}\n`;
}

export function serializeCslJsonReferences(references: ReferenceRecordLike[]): string {
  const items = references.map((reference, index) => {
    const base = parseRawReferenceObject(reference.rawText);
    const item: Record<string, unknown> = {
      ...base
    };
    setCslFieldIfPresent(item, 'id', reference.id || item.id || `ref-${index + 1}`);
    setCslFieldIfPresent(item, 'type', toCslType(reference.referenceType || String(item.type ?? '')));
    setCslFieldIfPresent(item, 'title', normalizeWhitespace(reference.title || String(item.title ?? '')));
    const authors = toCslAuthors(reference.authors ?? []);
    if (authors.length > 0) {
      item.author = authors;
    } else if (!Array.isArray(item.author)) {
      item.author = [];
    }
    if (reference.year) {
      item.issued = { 'date-parts': [[reference.year]] };
    } else if (!item.issued) {
      item.issued = { 'date-parts': [] };
    }
    setCslFieldIfPresent(item, 'container-title', normalizeWhitespace(reference.containerTitle || String(item['container-title'] ?? '')));
    setCslFieldIfPresent(item, 'publisher', normalizeWhitespace(reference.publisher || String(item.publisher ?? '')));
    setCslFieldIfPresent(item, 'DOI', normalizeWhitespace(reference.doi || String(item.DOI ?? '')));
    setCslFieldIfPresent(item, 'URL', normalizeWhitespace(reference.url || String(item.URL ?? '')));
    setCslFieldIfPresent(item, 'abstract', normalizeWhitespace(reference.abstractText || String(item.abstract ?? '')));
    const keywords = normalizeKeywords(reference.keywords ?? []);
    if (keywords.length > 0) {
      item.keyword = keywords;
    } else if (!item.keyword) {
      item.keyword = [];
    }
    return item;
  });
  return `${JSON.stringify(items, null, 2)}\n`;
}
