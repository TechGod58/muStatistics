import { describe, expect, it } from 'vitest';
import XLSX from 'xlsx';
import { parseImportedFile } from '../src/imports';

const MINIMAL_PDF = `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 24 Tf
72 72 Td
(Hello PDF) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000062 00000 n 
0000000117 00000 n 
0000000243 00000 n 
0000000337 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
407
%%EOF`;

describe('parseImportedFile', () => {
  it('parses a PDF into a source draft', async () => {
    const draft = await parseImportedFile('interview.pdf', 'application/pdf', Buffer.from(MINIMAL_PDF, 'utf8'));

    expect(draft.kind).toBe('source');
    if (draft.kind !== 'source') return;

    expect(draft.sourceKind).toBe('pdf');
    expect(draft.contentType).toBe('application/pdf');
    expect(draft.contentText).toContain('Hello PDF');
    expect(draft.segments).toEqual([
      {
        kind: 'page_region',
        anchor: {
          kind: 'page_region',
          page: 1,
          x: 0,
          y: 0,
          width: 1,
          height: 1
        },
        text: 'Hello PDF'
      }
    ]);
  });

  it('parses a CSV into case rows and attributes', async () => {
    const csv = Buffer.from('label,department,score\nParticipant A,Admissions,5\nParticipant B,Financial Aid,3\n', 'utf8');
    const draft = await parseImportedFile('participants.csv', 'text/csv', csv);

    expect(draft.kind).toBe('tabular');
    if (draft.kind !== 'tabular') return;

    expect(draft.caseLabelField).toBe('label');
    expect(draft.rows).toHaveLength(2);
    expect(draft.rows[0]).toEqual({
      caseLabel: 'Participant A',
      attributes: [
        { name: 'department', value: 'Admissions' },
        { name: 'score', value: 5 }
      ]
    });
  });

  it('parses an xls workbook into case rows and attributes', async () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([
      { participant: 'Participant C', campus: 'Main', age: 21 },
      { participant: 'Participant D', campus: 'North', age: 22 }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xls' }) as Buffer;

    const draft = await parseImportedFile('participants.xls', 'application/vnd.ms-excel', buffer);
    expect(draft.kind).toBe('tabular');
    if (draft.kind !== 'tabular') return;

    expect(draft.caseLabelField).toBe('participant');
    expect(draft.rows[1]).toEqual({
      caseLabel: 'Participant D',
      attributes: [
        { name: 'campus', value: 'North' },
        { name: 'age', value: 22 }
      ]
    });
  });
});
