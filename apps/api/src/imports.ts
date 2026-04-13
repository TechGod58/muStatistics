import { basename, extname } from 'node:path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import XLSX from 'xlsx';

export type ImportedSourceDraft = {
  kind: 'source';
  title: string;
  sourceKind: 'document' | 'transcript' | 'dataset' | 'survey' | 'pdf';
  contentType: string;
  contentText: string;
  segments?: ImportedSegmentDraft[];
};

export type ImportedSegmentDraft = {
  kind: 'page_region';
  anchor: {
    kind: 'page_region';
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text: string;
};

export type ImportedCaseRowDraft = {
  caseLabel: string;
  attributes: Array<{ name: string; value: string | number | boolean | null }>;
};

export type ImportedTabularDraft = {
  kind: 'tabular';
  title: string;
  sourceKind: 'dataset' | 'survey';
  contentType: string;
  caseLabelField: string;
  sheetName: string | null;
  rows: ImportedCaseRowDraft[];
};

export type ImportedFileDraft = ImportedSourceDraft | ImportedTabularDraft;

function inferContentType(filename: string, fallback: string): string {
  const extension = extname(filename).toLowerCase();
  if (extension === '.txt') return 'text/plain';
  if (extension === '.md') return 'text/markdown';
  if (extension === '.csv') return 'text/csv';
  if (extension === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (extension === '.xls') return 'application/vnd.ms-excel';
  if (extension === '.xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (extension === '.pdf') return 'application/pdf';
  return fallback || 'application/octet-stream';
}

function inferCaseLabelField(headers: string[]): string {
  const preferred = ['case_label', 'label', 'participant', 'participant_id', 'respondent', 'respondent_id', 'id'];
  const normalizedHeaders = new Map(headers.map((header) => [header.toLowerCase().replace(/\s+/g, '_'), header]));
  for (const name of preferred) {
    const match = normalizedHeaders.get(name);
    if (match) return match;
  }
  return headers[0] ?? 'label';
}

function coerceCellValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  const text = String(value).trim();
  if (!text) return null;

  const lowered = text.toLowerCase();
  if (['true', 'yes', 'y'].includes(lowered)) return true;
  if (['false', 'no', 'n'].includes(lowered)) return false;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text;
}

function parseWorkbook(buffer: Buffer): { sheetName: string; rows: Record<string, unknown>[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
  const firstSheetName = workbook.SheetNames.find((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return false;
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
    return rows.length > 0;
  });

  if (!firstSheetName) {
    throw new Error('The spreadsheet does not contain any rows.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  return { sheetName: firstSheetName, rows };
}

function buildTabularDraft(
  filename: string,
  contentType: string,
  rows: Record<string, unknown>[],
  sheetName: string | null
): ImportedTabularDraft {
  if (rows.length === 0) {
    throw new Error('The uploaded table does not contain any rows.');
  }

  const headers = Object.keys(rows[0] ?? {}).map((header) => header.trim()).filter(Boolean);
  if (headers.length === 0) {
    throw new Error('The uploaded table does not contain any usable columns.');
  }

  const caseLabelField = inferCaseLabelField(headers);
  const dataRows = rows.map((row, index) => {
    const caseLabelRaw = row[caseLabelField];
    const caseLabel = String(caseLabelRaw ?? '').trim() || `${basename(filename, extname(filename))} Row ${index + 1}`;
    const attributes = headers
      .filter((header) => header !== caseLabelField)
      .map((header) => ({ name: header, value: coerceCellValue(row[header]) }))
      .filter((attribute) => attribute.value !== null);

    return { caseLabel, attributes };
  });

  return {
    kind: 'tabular',
    title: basename(filename, extname(filename)),
    sourceKind: 'dataset',
    contentType,
    caseLabelField,
    sheetName,
    rows: dataRows
  };
}

export async function parseImportedFile(
  filename: string,
  mimetype: string,
  buffer: Buffer
): Promise<ImportedFileDraft> {
  const extension = extname(filename).toLowerCase();
  const title = basename(filename, extension);
  const contentType = inferContentType(filename, mimetype);

  if (extension === '.txt' || extension === '.md') {
    return {
      kind: 'source',
      title,
      sourceKind: 'document',
      contentType,
      contentText: buffer.toString('utf8')
    };
  }

  if (extension === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return {
      kind: 'source',
      title,
      sourceKind: 'document',
      contentType,
      contentText: result.value.trim()
    };
  }

  if (extension === '.pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      const segments = (result.pages ?? [])
        .map((page) => ({
          kind: 'page_region' as const,
          anchor: {
            kind: 'page_region' as const,
            page: page.num,
            x: 0,
            y: 0,
            width: 1,
            height: 1
          },
          text: page.text.trim()
        }))
        .filter((segment) => segment.text.length > 0);
      return {
        kind: 'source',
        title,
        sourceKind: 'pdf',
        contentType,
        contentText: result.text.trim(),
        segments
      };
    } finally {
      await parser.destroy();
    }
  }

  if (extension === '.csv') {
    const workbookRows = parseWorkbook(buffer);
    return buildTabularDraft(filename, contentType, workbookRows.rows, workbookRows.sheetName);
  }

  if (extension === '.xls' || extension === '.xlsx') {
    const workbookRows = parseWorkbook(buffer);
    return buildTabularDraft(filename, contentType, workbookRows.rows, workbookRows.sheetName);
  }

  throw new Error(`Unsupported file type "${extension || 'unknown'}". Accepted files: .txt, .md, .docx, .pdf, .csv, .xls, .xlsx.`);
}
