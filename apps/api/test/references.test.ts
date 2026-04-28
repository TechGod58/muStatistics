import { describe, expect, it } from 'vitest';
import {
  parseBibtexReferences,
  parseCslJsonReferences,
  parseRisReferences,
  serializeBibtexReferences,
  serializeCslJsonReferences,
  serializeRisReferences
} from '../src/references';

describe('reference parsing and serialization', () => {
  it('parses RIS records', () => {
    const ris = `TY  - JOUR
TI  - Trust in admissions workflows
AU  - Smith, Jane
PY  - 2025
DO  - 10.1000/example
ER  -`;
    const items = parseRisReferences(ris);
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toContain('Trust in admissions workflows');
    expect(items[0]?.authors).toEqual(['Smith, Jane']);
    expect(items[0]?.year).toBe(2025);
  });

  it('parses BibTeX records', () => {
    const bib = `@article{smith2025,
      title={Trust in admissions workflows},
      author={Smith, Jane and Doe, Alex},
      year={2025},
      doi={10.1000/example}
    }`;
    const items = parseBibtexReferences(bib);
    expect(items).toHaveLength(1);
    expect(items[0]?.authors).toEqual(['Smith, Jane', 'Doe, Alex']);
    expect(items[0]?.doi).toBe('10.1000/example');
  });

  it('parses CSL-JSON records', () => {
    const csl = JSON.stringify([
      {
        type: 'article-journal',
        title: 'Trust in admissions workflows',
        author: [{ family: 'Smith', given: 'Jane' }],
        issued: { 'date-parts': [[2025, 3, 1]] },
        DOI: '10.1000/example',
        URL: 'https://example.org/paper'
      }
    ]);
    const items = parseCslJsonReferences(csl);
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Trust in admissions workflows');
    expect(items[0]?.authors).toEqual(['Jane Smith']);
    expect(items[0]?.year).toBe(2025);
  });

  it('serializes records to RIS, BibTeX, and CSL-JSON', () => {
    const references = [{
      id: 'reference-1',
      referenceType: 'article',
      title: 'Trust in admissions workflows',
      authors: ['Jane Smith', 'Alex Doe'],
      year: 2025,
      containerTitle: 'Journal of Admissions',
      publisher: 'MU Press',
      doi: '10.1000/example',
      url: 'https://example.org/paper',
      abstractText: 'Study of trust and workflow outcomes.',
      keywords: ['trust', 'workflow'],
      rawText: ''
    }];
    const ris = serializeRisReferences(references);
    const bib = serializeBibtexReferences(references);
    const csl = serializeCslJsonReferences(references);
    expect(ris).toContain('TY  - JOUR');
    expect(ris).toContain('DO  - 10.1000/example');
    expect(bib).toContain('@article{');
    expect(bib).toContain('title = {Trust in admissions workflows}');
    expect(csl).toContain('"id": "reference-1"');
    expect(csl).toContain('"type": "article-journal"');
    expect(csl).toContain('"DOI": "10.1000/example"');
  });
});
