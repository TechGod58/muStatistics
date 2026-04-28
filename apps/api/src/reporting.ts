import PDFDocument from 'pdfkit';
import type {
  Attribute,
  CaseEntity,
  Code,
  CodeApplication,
  Memo,
  Segment,
  Source
} from '@mu/core-domain';
import type {
  CodingComparisonResult,
  CodeCodeMatrixResult,
  CodeCooccurrenceResult,
  FrameworkMatrixResult,
  InterRaterSummaryResult,
  MatrixCodingResult,
  QualitativeQueryReport
} from '@mu/qual-engine';
import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from 'docx';
import * as XLSX from 'xlsx';

export type EvidenceReportBundle = {
  project: { id: string; name: string; description?: string };
  exportedAt: string;
  codebook: Array<{ id: string; name: string; description: string; colorToken: string }>;
  evidenceContext?: {
    mediaMatchCount: number;
    transcriptLinkedMatchCount: number;
    transcriptLinkCount: number;
    sourceKindCoverage: Array<{ sourceKind: string; count: number }>;
  };
  matches: Array<{
    segmentId: string;
    sourceId: string;
    sourceTitle: string | null;
    sourceKind?: string | null;
    segmentKind?: string | null;
    anchorSummary?: string | null;
    text: string;
    transcriptSyncCount?: number;
    transcriptSyncLinks?: Array<{
      id: string;
      transcriptSourceId: string;
      transcriptSourceTitle: string | null;
      startMs: number;
      endMs: number;
      transcriptText: string;
    }>;
    codes: Array<{ codeId: string; coderId: string; caseId: string | null; confidence: number }>;
    cases: Array<{ caseId: string; label: string }>;
    memos: Array<{ memoId: string; title: string; body: string }>;
  }>;
};

export type EvidenceReport = {
  title: string;
  exportedAt: string;
  filters: string[];
  summary: {
    totalMatches: number;
    uniqueSources: number;
    uniqueCases: number;
    uniqueCodes: number;
    mediaMatches: number;
    transcriptLinkedMatches: number;
    transcriptLinkCount: number;
  };
  sourceKindCoverage: Array<{ sourceKind: string; count: number }>;
  sourceCoverage: Array<{ sourceId: string; sourceTitle: string; count: number }>;
  caseCoverage: Array<{ caseId: string; label: string; count: number }>;
  codeCoverage: Array<{ codeId: string; codeName: string; count: number }>;
  codebook: EvidenceReportBundle['codebook'];
  matches: EvidenceReportBundle['matches'];
};

export type StructuredReportTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

export type StructuredReportSection = {
  heading: string;
  paragraphs?: string[];
  tables?: StructuredReportTable[];
};

export type StructuredReport = {
  title: string;
  exportedAt: string;
  subtitleLines: string[];
  sections: StructuredReportSection[];
  styleTemplate?: StructuredReportStyleTemplate;
};

export type StructuredReportStyleTemplate = 'standard' | 'committee' | 'review_board';

type StructuredReportStyle = {
  template: StructuredReportStyleTemplate;
  docxFont: string;
  titleColor: string;
  headingColor: string;
  subtitleColor: string;
  bodyColor: string;
  tableHeaderFillColor: string;
  tableHeaderTextColor: string;
  tableBorderColor: string;
  pdfCoverFillColor: string;
  pdfCoverTextColor: string;
  pdfShowCoverPage: boolean;
  footerNote: string;
};

type ProjectCodebookInput = {
  project: { id: string; name: string; description?: string };
  codes: Code[];
  applications: CodeApplication[];
  memos: Memo[];
};

type CaseSummariesInput = {
  project: { id: string; name: string; description?: string };
  cases: CaseEntity[];
  attributes: Attribute[];
  sources: Source[];
  segments: Segment[];
  codes: Code[];
  applications: CodeApplication[];
  memos: Memo[];
};

type AppendixReportInput = {
  report: EvidenceReport;
};

type ChatHistoryInput = {
  project: { id: string; name: string; description?: string };
  messages: Array<{ username: string; body: string; createdAt: string }>;
};

type CommitteeReviewPackInput = {
  project: { id: string; name: string; description?: string };
  bundleLabel?: string;
  styleTemplate: StructuredReportStyleTemplate;
  appendixMode: 'standard' | 'expanded';
  appendixRowLimit: number;
  queryBundles: Array<{
    queryId: string;
    label: string;
    mode: string;
    queryLabels: string[];
    queryReport: QualitativeQueryReport;
    evidenceReport: EvidenceReport;
  }>;
};

function summarizeText(value: string, maxLength = 500): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return '(no text)';
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a';
  return `${(value * 100).toFixed(1)}%`;
}

function sortCoverage(left: { label: string; count: number }, right: { label: string; count: number }): number {
  return right.count - left.count || left.label.localeCompare(right.label);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function formatAnchor(segment: Segment): string {
  if (segment.anchor.kind === 'text_range') {
    return `chars ${segment.anchor.start}-${segment.anchor.end}`;
  }
  if (segment.anchor.kind === 'time_range') {
    return `${Math.round(segment.anchor.startMs / 1000)}s-${Math.round(segment.anchor.endMs / 1000)}s`;
  }
  return `page ${segment.anchor.page}`;
}

function truncateCell(value: string, maxLength = 90): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}

function sanitizeSheetName(value: string, usedNames: Set<string>): string {
  const base = value.replace(/[:\\/?*\[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || 'Sheet';
  let candidate = base;
  let counter = 2;
  while (usedNames.has(candidate)) {
    const suffix = ` ${counter}`;
    candidate = `${base.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`;
    counter += 1;
  }
  usedNames.add(candidate);
  return candidate;
}

function buildWorkbookBytes(sheets: Array<{ name: string; rows: Array<Array<string | number | boolean | null>> }>): Uint8Array {
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();
  for (const sheet of sheets) {
    const sheetName = sanitizeSheetName(sheet.name, usedNames);
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows.length > 0 ? sheet.rows : [['No rows']]);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function resolveStructuredReportStyle(template?: StructuredReportStyleTemplate): StructuredReportStyle {
  if (template === 'committee') {
    return {
      template: 'committee',
      docxFont: 'Cambria',
      titleColor: '1B365D',
      headingColor: '1B365D',
      subtitleColor: '345E88',
      bodyColor: '1A1A1A',
      tableHeaderFillColor: 'E8E0CF',
      tableHeaderTextColor: '1B365D',
      tableBorderColor: '9DAFC2',
      pdfCoverFillColor: '1B365D',
      pdfCoverTextColor: 'FFFFFF',
      pdfShowCoverPage: true,
      footerNote: 'Committee review package - generated by muStatistics'
    };
  }
  if (template === 'review_board') {
    return {
      template: 'review_board',
      docxFont: 'Calibri',
      titleColor: '2D2A4A',
      headingColor: '2D2A4A',
      subtitleColor: '4C4877',
      bodyColor: '1A1A1A',
      tableHeaderFillColor: 'E7E6F4',
      tableHeaderTextColor: '2D2A4A',
      tableBorderColor: 'ABA8C9',
      pdfCoverFillColor: '2D2A4A',
      pdfCoverTextColor: 'FFFFFF',
      pdfShowCoverPage: true,
      footerNote: 'Research review-board package - generated by muStatistics'
    };
  }
  return {
    template: 'standard',
    docxFont: 'Calibri',
    titleColor: '23344E',
    headingColor: '23344E',
    subtitleColor: '3F5678',
    bodyColor: '1A1A1A',
    tableHeaderFillColor: 'ECF1F7',
    tableHeaderTextColor: '23344E',
    tableBorderColor: 'C8D3E3',
    pdfCoverFillColor: '23344E',
    pdfCoverTextColor: 'FFFFFF',
    pdfShowCoverPage: false,
    footerNote: 'Generated by muStatistics'
  };
}

function buildDocxTable(table: StructuredReportTable, style: StructuredReportStyle): Table {
  const rows = [
    new TableRow({
      tableHeader: true,
      children: table.headers.map((header) => new TableCell({
        shading: { fill: style.tableHeaderFillColor, color: 'auto' },
        children: [
          new Paragraph({
            children: [new TextRun({ text: header, bold: true, color: style.tableHeaderTextColor, font: style.docxFont })]
          })
        ]
      }))
    }),
    ...(table.rows.length > 0
      ? table.rows.map((row) => new TableRow({
        children: table.headers.map((_, index) => new TableCell({
          children: [new Paragraph({ text: row[index] ?? '—' })]
        }))
      }))
      : [new TableRow({
        children: [
          new TableCell({
            columnSpan: Math.max(1, table.headers.length),
            children: [new Paragraph({ text: 'No rows.' })]
          })
        ]
      })])
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: style.tableBorderColor },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: style.tableBorderColor },
      left: { style: BorderStyle.SINGLE, size: 1, color: style.tableBorderColor },
      right: { style: BorderStyle.SINGLE, size: 1, color: style.tableBorderColor },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: style.tableBorderColor },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: style.tableBorderColor }
    }
  });
}

function drawPdfTable(doc: PDFKit.PDFDocument, table: StructuredReportTable, style: StructuredReportStyle): void {
  const columnCount = Math.max(1, table.headers.length);
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / columnCount;
  const startX = doc.page.margins.left;
  const cellPadding = 4;

  const drawRow = (cells: string[], bold = false): void => {
    const texts = table.headers.map((_, index) => truncateCell(cells[index] ?? '—', bold ? 40 : 110));
    const heights = texts.map((text) => doc.heightOfString(text, {
      width: colWidth - (cellPadding * 2),
      align: 'left'
    }));
    const rowHeight = Math.max(20, ...heights.map((height) => height + (cellPadding * 2)));
    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      drawRow(table.headers, true);
    }
    const y = doc.y;
    texts.forEach((text, index) => {
      const x = startX + (index * colWidth);
      if (bold) {
        doc.rect(x, y, colWidth, rowHeight).fillAndStroke(`#${style.tableHeaderFillColor}`, `#${style.tableBorderColor}`);
      } else {
        doc.rect(x, y, colWidth, rowHeight).stroke(`#${style.tableBorderColor}`);
      }
      doc.fillColor(bold ? `#${style.tableHeaderTextColor}` : `#${style.bodyColor}`);
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).text(text, x + cellPadding, y + cellPadding, {
        width: colWidth - (cellPadding * 2),
        align: 'left'
      });
      doc.fillColor(`#${style.bodyColor}`);
    });
    doc.y = y + rowHeight;
  };

  doc.fillColor(`#${style.headingColor}`).font('Helvetica-Bold').fontSize(11).text(table.title);
  doc.fillColor(`#${style.bodyColor}`);
  doc.moveDown(0.3);
  drawRow(table.headers, true);
  table.rows.forEach((row) => drawRow(row));
  doc.moveDown();
}

export function renderStructuredReportText(report: StructuredReport): string {
  const lines: string[] = [
    report.title,
    `Exported at: ${report.exportedAt}`,
    ...report.subtitleLines,
    ''
  ];

  for (const section of report.sections) {
    lines.push(section.heading);
    lines.push('-'.repeat(section.heading.length));
    for (const paragraph of section.paragraphs ?? []) {
      lines.push(paragraph);
    }
    for (const table of section.tables ?? []) {
      lines.push('');
      lines.push(table.title);
      lines.push(table.headers.join(' | '));
      if (table.rows.length === 0) {
        lines.push('No rows.');
      } else {
        table.rows.forEach((row) => lines.push(row.join(' | ')));
      }
    }
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

export async function renderStructuredReportDocx(
  report: StructuredReport,
  options: { styleTemplate?: StructuredReportStyleTemplate } = {}
): Promise<Uint8Array> {
  const style = resolveStructuredReportStyle(options.styleTemplate ?? report.styleTemplate);
  const children: Array<Paragraph | Table> = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: report.title, color: style.titleColor, font: style.docxFont, bold: true })]
    }),
    new Paragraph({
      children: [new TextRun({ text: `Exported at: ${report.exportedAt}`, color: style.subtitleColor, font: style.docxFont })]
    }),
    ...report.subtitleLines.map((line) => new Paragraph({
      children: [new TextRun({ text: line, color: style.subtitleColor, font: style.docxFont })]
    }))
  ];

  if (style.pdfShowCoverPage) {
    children.push(new Paragraph({
      children: [new TextRun({ text: style.footerNote, color: style.subtitleColor, font: style.docxFont, italics: true })]
    }));
    children.push(new Paragraph({ text: '', pageBreakBefore: true }));
  }

  report.sections.forEach((section) => {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: section.heading, color: style.headingColor, font: style.docxFont, bold: true })]
    }));
    (section.paragraphs ?? []).forEach((paragraph) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: paragraph, color: style.bodyColor, font: style.docxFont })]
      }));
    });
    (section.tables ?? []).forEach((table) => {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: table.title, color: style.headingColor, font: style.docxFont, bold: true })]
      }));
      children.push(buildDocxTable(table, style));
    });
  });

  children.push(new Paragraph({
    children: [new TextRun({ text: style.footerNote, color: style.subtitleColor, font: style.docxFont, italics: true })]
  }));

  const doc = new Document({
    sections: [{ properties: {}, children }]
  });

  return Packer.toBuffer(doc);
}

export async function renderStructuredReportPdf(
  report: StructuredReport,
  options: { styleTemplate?: StructuredReportStyleTemplate } = {}
): Promise<Buffer> {
  const style = resolveStructuredReportStyle(options.styleTemplate ?? report.styleTemplate);
  return await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    if (style.pdfShowCoverPage) {
      const coverHeight = 170;
      doc.rect(0, 0, doc.page.width, coverHeight).fill(`#${style.pdfCoverFillColor}`);
      doc
        .fillColor(`#${style.pdfCoverTextColor}`)
        .font('Helvetica-Bold')
        .fontSize(24)
        .text(report.title, doc.page.margins.left, 52, {
          width: doc.page.width - (doc.page.margins.left * 2)
        });
      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`Exported at: ${report.exportedAt}`, doc.page.margins.left, 102);
      doc
        .font('Helvetica-Oblique')
        .fontSize(10)
        .text(style.footerNote, doc.page.margins.left, 122, {
          width: doc.page.width - (doc.page.margins.left * 2)
        });
      doc.addPage();
    }

    doc.fillColor(`#${style.titleColor}`).font('Helvetica-Bold').fontSize(20).text(report.title);
    doc.moveDown(0.5);
    doc.fillColor(`#${style.subtitleColor}`).font('Helvetica').fontSize(10).text(`Exported at: ${report.exportedAt}`);
    report.subtitleLines.forEach((line) => doc.text(line));
    doc.moveDown();

    report.sections.forEach((section) => {
      if (doc.y > doc.page.height - 180) {
        doc.addPage();
      }
      doc.fillColor(`#${style.headingColor}`).font('Helvetica-Bold').fontSize(14).text(section.heading);
      doc.moveDown(0.3);
      doc.fillColor(`#${style.bodyColor}`).font('Helvetica').fontSize(10);
      (section.paragraphs ?? []).forEach((paragraph) => {
        doc.text(paragraph);
        doc.moveDown(0.2);
      });
      (section.tables ?? []).forEach((table) => {
        drawPdfTable(doc, table, style);
      });
      doc.moveDown(0.6);
    });

    doc.fillColor(`#${style.subtitleColor}`).font('Helvetica-Oblique').fontSize(9).text(style.footerNote);
    doc.end();
  });
}

export function renderStructuredReportXlsx(report: StructuredReport): Uint8Array {
  const overviewRows: Array<Array<string | number | boolean | null>> = [
    ['Title', report.title],
    ['Exported at', report.exportedAt],
    []
  ];
  report.subtitleLines.forEach((line) => {
    overviewRows.push(['Subtitle', line]);
  });

  const sheets: Array<{ name: string; rows: Array<Array<string | number | boolean | null>> }> = [
    { name: 'Overview', rows: overviewRows }
  ];

  report.sections.forEach((section, sectionIndex) => {
    if ((section.paragraphs ?? []).length > 0) {
      sheets.push({
        name: `${sectionIndex + 1} ${section.heading} Notes`,
        rows: [
          ['Section', section.heading],
          [],
          ...section.paragraphs!.map((paragraph, index) => [`Paragraph ${index + 1}`, paragraph])
        ]
      });
    }
    (section.tables ?? []).forEach((table, tableIndex) => {
      sheets.push({
        name: `${sectionIndex + 1}.${tableIndex + 1} ${table.title}`,
        rows: [
          [table.title],
          [],
          table.headers,
          ...table.rows
        ]
      });
    });
  });

  return buildWorkbookBytes(sheets);
}

export function buildEvidenceReport(bundle: EvidenceReportBundle, filters: string[]): EvidenceReport {
  const uniqueSources = new Set(bundle.matches.map((match) => match.sourceId)).size;
  const uniqueCases = new Set(bundle.matches.flatMap((match) => match.cases.map((caseItem) => caseItem.caseId))).size;
  const uniqueCodes = new Set(bundle.matches.flatMap((match) => match.codes.map((code) => code.codeId))).size;
  const codeNameById = new Map(bundle.codebook.map((code) => [code.id, code.name]));
  const sourceCoverage = new Map<string, { label: string; count: number }>();
  const caseCoverage = new Map<string, { label: string; count: number }>();
  const codeCoverage = new Map<string, { label: string; count: number }>();
  const sourceKindCoverage = new Map<string, number>();
  let inferredMediaMatches = 0;
  let inferredTranscriptLinkedMatches = 0;
  let inferredTranscriptLinkCount = 0;

  for (const match of bundle.matches) {
    const sourceEntry = sourceCoverage.get(match.sourceId) ?? {
      label: match.sourceTitle ?? match.sourceId,
      count: 0
    };
    sourceEntry.count += 1;
    sourceCoverage.set(match.sourceId, sourceEntry);

    for (const caseItem of match.cases) {
      const caseEntry = caseCoverage.get(caseItem.caseId) ?? { label: caseItem.label, count: 0 };
      caseEntry.count += 1;
      caseCoverage.set(caseItem.caseId, caseEntry);
    }

    for (const code of match.codes) {
      const codeEntry = codeCoverage.get(code.codeId) ?? {
        label: codeNameById.get(code.codeId) ?? code.codeId,
        count: 0
      };
      codeEntry.count += 1;
      codeCoverage.set(code.codeId, codeEntry);
    }

    const sourceKind = typeof match.sourceKind === 'string' && match.sourceKind.trim()
      ? match.sourceKind.trim()
      : 'unknown';
    sourceKindCoverage.set(sourceKind, (sourceKindCoverage.get(sourceKind) ?? 0) + 1);
    if (sourceKind === 'audio' || sourceKind === 'video') {
      inferredMediaMatches += 1;
    }
    const transcriptSyncCount = typeof match.transcriptSyncCount === 'number'
      ? Math.max(0, Math.round(match.transcriptSyncCount))
      : Array.isArray(match.transcriptSyncLinks) ? match.transcriptSyncLinks.length : 0;
    if (transcriptSyncCount > 0) {
      inferredTranscriptLinkedMatches += 1;
      inferredTranscriptLinkCount += transcriptSyncCount;
    }
  }

  const mediaMatches = typeof bundle.evidenceContext?.mediaMatchCount === 'number'
    ? bundle.evidenceContext.mediaMatchCount
    : inferredMediaMatches;
  const transcriptLinkedMatches = typeof bundle.evidenceContext?.transcriptLinkedMatchCount === 'number'
    ? bundle.evidenceContext.transcriptLinkedMatchCount
    : inferredTranscriptLinkedMatches;
  const transcriptLinkCount = typeof bundle.evidenceContext?.transcriptLinkCount === 'number'
    ? bundle.evidenceContext.transcriptLinkCount
    : inferredTranscriptLinkCount;
  const sourceKindRows = Array.isArray(bundle.evidenceContext?.sourceKindCoverage) && bundle.evidenceContext.sourceKindCoverage.length > 0
    ? bundle.evidenceContext.sourceKindCoverage
    : [...sourceKindCoverage.entries()]
      .map(([sourceKind, count]) => ({ sourceKind, count }))
      .sort((left, right) => right.count - left.count || left.sourceKind.localeCompare(right.sourceKind));

  return {
    title: `${bundle.project.name} Evidence Report`,
    exportedAt: bundle.exportedAt,
    filters,
    summary: {
      totalMatches: bundle.matches.length,
      uniqueSources,
      uniqueCases,
      uniqueCodes,
      mediaMatches,
      transcriptLinkedMatches,
      transcriptLinkCount
    },
    sourceKindCoverage: sourceKindRows,
    sourceCoverage: [...sourceCoverage.entries()]
      .map(([sourceId, item]) => ({ sourceId, sourceTitle: item.label, count: item.count }))
      .sort((left, right) => sortCoverage({ label: left.sourceTitle, count: left.count }, { label: right.sourceTitle, count: right.count }))
      .slice(0, 20),
    caseCoverage: [...caseCoverage.entries()]
      .map(([caseId, item]) => ({ caseId, label: item.label, count: item.count }))
      .sort((left, right) => sortCoverage(left, right))
      .slice(0, 20),
    codeCoverage: [...codeCoverage.entries()]
      .map(([codeId, item]) => ({ codeId, codeName: item.label, count: item.count }))
      .sort((left, right) => sortCoverage({ label: left.codeName, count: left.count }, { label: right.codeName, count: right.count }))
      .slice(0, 20),
    codebook: bundle.codebook,
    matches: bundle.matches
  };
}

function buildEvidenceStructuredReport(report: EvidenceReport): StructuredReport {
  return {
    title: report.title,
    exportedAt: report.exportedAt,
    subtitleLines: [
      `Filters: ${report.filters.length > 0 ? report.filters.join(' | ') : 'none'}`,
      `Matches: ${report.summary.totalMatches} | Sources: ${report.summary.uniqueSources} | Cases: ${report.summary.uniqueCases} | Codes: ${report.summary.uniqueCodes}`,
      `Media matches: ${report.summary.mediaMatches} | Transcript-linked matches: ${report.summary.transcriptLinkedMatches} | Transcript links: ${report.summary.transcriptLinkCount}`
    ],
    sections: [
      {
        heading: 'Coverage',
        tables: [
          {
            title: 'Source kind coverage',
            headers: ['Source kind', 'Matches'],
            rows: report.sourceKindCoverage.map((entry) => [
              entry.sourceKind,
              String(entry.count)
            ])
          },
          {
            title: 'Source coverage',
            headers: ['Source', 'Source ID', 'Matches'],
            rows: report.sourceCoverage.map((source) => [
              source.sourceTitle,
              source.sourceId,
              String(source.count)
            ])
          },
          {
            title: 'Case coverage',
            headers: ['Case', 'Case ID', 'Matches'],
            rows: report.caseCoverage.map((caseItem) => [
              caseItem.label,
              caseItem.caseId,
              String(caseItem.count)
            ])
          },
          {
            title: 'Code coverage',
            headers: ['Code', 'Code ID', 'Applications'],
            rows: report.codeCoverage.map((code) => [
              code.codeName,
              code.codeId,
              String(code.count)
            ])
          }
        ]
      },
      {
        heading: 'Project codebook',
        tables: [
          {
            title: 'Code definitions',
            headers: ['Code', 'Code ID', 'Color', 'Description'],
            rows: report.codebook.map((code) => [
              code.name,
              code.id,
              code.colorToken,
              truncateCell(code.description || 'No description', 140)
            ])
          }
        ]
      },
      {
        heading: 'Evidence appendix',
        paragraphs: ['Each row captures source/anchor context, linked coding, transcript sync depth, and the first attached memo when present.'],
        tables: [
          {
            title: 'Evidence bundle',
            headers: ['Source', 'Kind', 'Anchor', 'Segment', 'Codes', 'Cases', 'Transcript links', 'Excerpt', 'Memo'],
            rows: report.matches.map((match) => [
              match.sourceTitle ?? match.sourceId,
              match.sourceKind ?? match.segmentKind ?? 'unknown',
              match.anchorSummary ?? 'n/a',
              match.segmentId,
              match.codes.map((code) => code.codeId).join(', ') || 'none',
              match.cases.map((caseItem) => caseItem.label).join(', ') || 'none',
              String(match.transcriptSyncCount ?? match.transcriptSyncLinks?.length ?? 0),
              truncateCell(summarizeText(match.text, 220), 220),
              truncateCell(match.memos[0] ? summarizeText(match.memos[0].body || match.memos[0].title, 120) : 'none', 120)
            ])
          }
        ]
      }
    ]
  };
}

export function renderEvidenceReportText(report: EvidenceReport): string {
  return renderStructuredReportText(buildEvidenceStructuredReport(report));
}

export async function renderEvidenceReportDocx(report: EvidenceReport): Promise<Uint8Array> {
  return renderStructuredReportDocx(buildEvidenceStructuredReport(report));
}

export async function renderEvidenceReportPdf(report: EvidenceReport): Promise<Buffer> {
  return renderStructuredReportPdf(buildEvidenceStructuredReport(report));
}

export function renderEvidenceReportXlsx(report: EvidenceReport): Uint8Array {
  return renderStructuredReportXlsx(buildEvidenceStructuredReport(report));
}

export function renderDatasetXlsx(params: {
  projectId: string;
  rows: Array<Record<string, string | number | boolean | null>>;
  report: {
    caseCount: number;
    fieldCount: number;
    summaries: Array<{
      key: string;
      label: string;
      source: string;
      valueType: string;
      validCount: number;
      missingCount: number;
      distinctCount: number;
      numeric: { mean: number; min: number; max: number; stdDev?: number | null } | null;
    }>;
  };
}): Uint8Array {
  const datasetHeaders = [...new Set(params.rows.flatMap((row) => Object.keys(row)))];
  const datasetRows: Array<Array<string | number | boolean | null>> = [
    datasetHeaders,
    ...params.rows.map((row) => datasetHeaders.map((header) => row[header] ?? null))
  ];

  const summaryRows: Array<Array<string | number | boolean | null>> = [
    ['Project ID', params.projectId],
    ['Case count', params.report.caseCount],
    ['Field count', params.report.fieldCount],
    [],
    ['Field', 'Label', 'Source', 'Type', 'Valid', 'Missing', 'Distinct', 'Mean', 'Min', 'Max', 'Std Dev'],
    ...params.report.summaries.map((summary) => [
      summary.key,
      summary.label,
      summary.source,
      summary.valueType,
      summary.validCount,
      summary.missingCount,
      summary.distinctCount,
      summary.numeric?.mean ?? null,
      summary.numeric?.min ?? null,
      summary.numeric?.max ?? null,
      summary.numeric?.stdDev ?? null
    ])
  ];

  return buildWorkbookBytes([
    { name: 'Dataset', rows: datasetRows },
    { name: 'Field Summary', rows: summaryRows }
  ]);
}

export function renderAuditEventsXlsx(items: Array<Record<string, unknown>>): Uint8Array {
  const headers = ['createdAt', 'actorUsername', 'actorRole', 'action', 'actionLabel', 'entityType', 'entityId', 'details'];
  const rows: Array<Array<string | number | boolean | null>> = [
    headers,
    ...items.map((item) => headers.map((header) => {
      const value = item[header];
      if (header === 'details') return JSON.stringify(value ?? {});
      if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') return value;
      if (value === null || value === undefined) return null;
      return JSON.stringify(value);
    }))
  ];
  return buildWorkbookBytes([{ name: 'Audit Events', rows }]);
}

export function buildProjectCodebookReport(input: ProjectCodebookInput): StructuredReport {
  const parentNameById = new Map(input.codes.map((code) => [code.id, code.name]));
  const applicationCountByCode = new Map<string, number>();
  const caseSetByCode = new Map<string, Set<string>>();
  const memoCountByCode = new Map<string, number>();

  input.applications.forEach((application) => {
    applicationCountByCode.set(application.codeId, (applicationCountByCode.get(application.codeId) ?? 0) + 1);
    if (application.caseId) {
      const caseSet = caseSetByCode.get(application.codeId) ?? new Set<string>();
      caseSet.add(application.caseId);
      caseSetByCode.set(application.codeId, caseSet);
    }
  });
  input.memos
    .filter((memo) => memo.targetType === 'code')
    .forEach((memo) => {
      memoCountByCode.set(memo.targetId, (memoCountByCode.get(memo.targetId) ?? 0) + 1);
    });

  const sortedCodes = [...input.codes].sort((left, right) => left.name.localeCompare(right.name));
  const totalApplications = [...applicationCountByCode.values()].reduce((total, count) => total + count, 0);

  return {
    title: `${input.project.name} Project Codebook`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Codes: ${sortedCodes.length} | Code applications: ${totalApplications}`,
      input.project.description ? `Project description: ${input.project.description}` : 'Project description: none'
    ],
    sections: [
      {
        heading: 'Codebook overview',
        paragraphs: [
          'This export packages the operational codebook for project review, onboarding, and committee reporting.'
        ],
        tables: [
          {
            title: 'Codebook table',
            headers: ['Code', 'Code ID', 'Parent', 'Applications', 'Cases', 'Memos', 'Color', 'Description'],
            rows: sortedCodes.map((code) => [
              code.name,
              code.id,
              code.parentCodeId ? (parentNameById.get(code.parentCodeId) ?? code.parentCodeId) : 'root',
              String(applicationCountByCode.get(code.id) ?? 0),
              String(caseSetByCode.get(code.id)?.size ?? 0),
              String(memoCountByCode.get(code.id) ?? 0),
              code.colorToken,
              truncateCell(code.description || 'No description', 180)
            ])
          }
        ]
      }
    ]
  };
}

export function buildCaseSummariesReport(input: CaseSummariesInput): StructuredReport {
  const sourceById = new Map(input.sources.map((source) => [source.id, source]));
  const segmentById = new Map(input.segments.map((segment) => [segment.id, segment]));
  const codeById = new Map(input.codes.map((code) => [code.id, code]));
  const caseAttributes = input.attributes.filter((attribute) => attribute.targetType === 'case');
  const sortedCases = [...input.cases].sort((left, right) => left.label.localeCompare(right.label));

  const sections: StructuredReportSection[] = [
    {
      heading: 'Summary',
      paragraphs: [
        'This export packages case-level qualitative summaries for project review and committee reporting.',
        `Cases: ${sortedCases.length} | Sources: ${input.sources.length} | Segments: ${input.segments.length} | Code applications: ${input.applications.length}`
      ]
    }
  ];

  if (sortedCases.length === 0) {
    sections.push({
      heading: 'Case summaries',
      paragraphs: ['No cases are available in this project yet.']
    });
  }

  sortedCases.forEach((caseItem) => {
    const attributes = caseAttributes
      .filter((attribute) => attribute.targetId === caseItem.id)
      .sort((left, right) => left.name.localeCompare(right.name));
    const caseApplications = input.applications.filter((application) => application.caseId === caseItem.id);
    const caseSegments = caseApplications
      .map((application) => segmentById.get(application.segmentId))
      .filter((segment): segment is Segment => Boolean(segment));
    const uniqueSegmentIds = new Set(caseSegments.map((segment) => segment.id));
    const uniqueSourceIds = new Set<string>([
      ...caseItem.sourceIds,
      ...caseSegments.map((segment) => segment.sourceId)
    ]);
    const directCaseMemos = input.memos.filter((memo) => memo.targetType === 'case' && memo.targetId === caseItem.id);
    const segmentMemos = input.memos.filter((memo) => memo.targetType === 'segment' && uniqueSegmentIds.has(memo.targetId));

    const topCodes = [...caseApplications.reduce((map, application) => {
      map.set(application.codeId, (map.get(application.codeId) ?? 0) + 1);
      return map;
    }, new Map<string, number>()).entries()]
      .map(([codeId, count]) => ({
        codeId,
        codeName: codeById.get(codeId)?.name ?? codeId,
        count
      }))
      .sort((left, right) => right.count - left.count || left.codeName.localeCompare(right.codeName))
      .slice(0, 12);

    const evidenceRows = caseApplications
      .map((application) => {
        const segment = segmentById.get(application.segmentId);
        if (!segment) return null;
        const source = sourceById.get(segment.sourceId);
        const code = codeById.get(application.codeId);
        return [
          source?.title ?? segment.sourceId,
          code?.name ?? application.codeId,
          formatAnchor(segment),
          truncateCell(summarizeText(segment.text, 180), 180)
        ];
      })
      .filter((row): row is string[] => Boolean(row))
      .slice(0, 15);

    sections.push({
      heading: `Case: ${caseItem.label}`,
      paragraphs: [
        `Case ID: ${caseItem.id}`,
        `Linked sources: ${uniqueSourceIds.size} | Coded excerpts: ${caseApplications.length} | Distinct codes: ${topCodes.length}`,
        `Direct case memos: ${directCaseMemos.length} | Segment memos: ${segmentMemos.length}`
      ],
      tables: [
        {
          title: 'Case attributes',
          headers: ['Attribute', 'Value'],
          rows: attributes.map((attribute) => [attribute.name, formatValue(attribute.value)])
        },
        {
          title: 'Top codes',
          headers: ['Code', 'Code ID', 'Applications'],
          rows: topCodes.map((code) => [code.codeName, code.codeId, String(code.count)])
        },
        {
          title: 'Evidence excerpts',
          headers: ['Source', 'Code', 'Location', 'Excerpt'],
          rows: evidenceRows
        }
      ]
    });
  });

  return {
    title: `${input.project.name} Case Summaries`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      input.project.description ? `Project description: ${input.project.description}` : 'Project description: none'
    ],
    sections
  };
}

export function buildAppendixReport(input: AppendixReportInput): StructuredReport {
  const evidenceRows = input.report.matches.map((match) => [
    match.sourceTitle ?? match.sourceId,
    match.sourceKind ?? match.segmentKind ?? 'unknown',
    match.anchorSummary ?? 'n/a',
    match.segmentId,
    match.codes.map((code) => code.codeId).join(', ') || 'none',
    match.cases.map((caseItem) => caseItem.label).join(', ') || 'none',
    String(match.transcriptSyncCount ?? match.transcriptSyncLinks?.length ?? 0),
    truncateCell(summarizeText(match.text, 220), 220),
    truncateCell(match.memos[0] ? summarizeText(match.memos[0].body || match.memos[0].title, 100) : 'none', 100)
  ]);

  return {
    title: input.report.title.replace(/Evidence Report$/, 'Committee Appendix'),
    exportedAt: input.report.exportedAt,
    subtitleLines: [
      `Filters: ${input.report.filters.length > 0 ? input.report.filters.join(' | ') : 'none'}`,
      `Matches: ${input.report.summary.totalMatches} | Sources: ${input.report.summary.uniqueSources} | Cases: ${input.report.summary.uniqueCases} | Codes: ${input.report.summary.uniqueCodes}`,
      `Media matches: ${input.report.summary.mediaMatches} | Transcript-linked matches: ${input.report.summary.transcriptLinkedMatches} | Transcript links: ${input.report.summary.transcriptLinkCount}`
    ],
    sections: [
      {
        heading: 'Review note',
        paragraphs: [
          'This appendix-style bundle is formatted for committees and research review packets.',
          'It includes coverage tables, a code reference, and the supporting evidence excerpts captured by the current qualitative filters.'
        ]
      },
      {
        heading: 'Coverage tables',
        tables: [
          {
            title: 'Source coverage',
            headers: ['Source', 'Source ID', 'Matches'],
            rows: input.report.sourceCoverage.map((source) => [
              source.sourceTitle,
              source.sourceId,
              String(source.count)
            ])
          },
          {
            title: 'Case coverage',
            headers: ['Case', 'Case ID', 'Matches'],
            rows: input.report.caseCoverage.map((caseItem) => [
              caseItem.label,
              caseItem.caseId,
              String(caseItem.count)
            ])
          },
          {
            title: 'Code coverage',
            headers: ['Code', 'Code ID', 'Applications'],
            rows: input.report.codeCoverage.map((code) => [
              code.codeName,
              code.codeId,
              String(code.count)
            ])
          },
          {
            title: 'Source kind coverage',
            headers: ['Source kind', 'Matches'],
            rows: input.report.sourceKindCoverage.map((entry) => [
              entry.sourceKind,
              String(entry.count)
            ])
          }
        ]
      },
      {
        heading: 'Code reference',
        tables: [
          {
            title: 'Project codebook',
            headers: ['Code', 'Code ID', 'Color', 'Description'],
            rows: input.report.codebook.map((code) => [
              code.name,
              code.id,
              code.colorToken,
              truncateCell(code.description || 'No description', 180)
            ])
          }
        ]
      },
      {
        heading: 'Evidence appendix',
        tables: [
          {
            title: 'Evidence review table',
            headers: ['Source', 'Kind', 'Anchor', 'Segment', 'Codes', 'Cases', 'Transcript links', 'Excerpt', 'Memo'],
            rows: evidenceRows
          }
        ]
      }
    ]
  };
}

export function buildCommitteeReviewPackReport(input: CommitteeReviewPackInput): StructuredReport {
  const queryCount = input.queryBundles.length;
  const sourceTotals = new Map<string, { label: string; count: number }>();
  const caseTotals = new Map<string, { label: string; count: number }>();
  const codeTotals = new Map<string, { label: string; count: number }>();
  const appendixRows: string[][] = [];
  const rowLimit = Math.max(25, Math.min(2000, Math.floor(input.appendixRowLimit || 250)));

  for (const queryBundle of input.queryBundles) {
    for (const source of queryBundle.evidenceReport.sourceCoverage) {
      const entry = sourceTotals.get(source.sourceId) ?? { label: source.sourceTitle, count: 0 };
      entry.count += source.count;
      sourceTotals.set(source.sourceId, entry);
    }
    for (const caseItem of queryBundle.evidenceReport.caseCoverage) {
      const entry = caseTotals.get(caseItem.caseId) ?? { label: caseItem.label, count: 0 };
      entry.count += caseItem.count;
      caseTotals.set(caseItem.caseId, entry);
    }
    for (const code of queryBundle.evidenceReport.codeCoverage) {
      const entry = codeTotals.get(code.codeId) ?? { label: code.codeName, count: 0 };
      entry.count += code.count;
      codeTotals.set(code.codeId, entry);
    }

    for (const match of queryBundle.evidenceReport.matches) {
      if (appendixRows.length >= rowLimit) break;
      const coderSummary = [...new Set(match.codes.map((code) => code.coderId))].join(', ') || 'none';
      const codeSummary = [...new Set(match.codes.map((code) => code.codeId))].join(', ') || 'none';
      const memoSummary = match.memos.map((memo) => memo.title).filter(Boolean).slice(0, 4).join(' | ') || 'none';
      appendixRows.push([
        queryBundle.label,
        match.sourceTitle ?? match.sourceId,
        match.sourceKind ?? match.segmentKind ?? 'unknown',
        match.anchorSummary ?? 'n/a',
        match.segmentId,
        codeSummary,
        coderSummary,
        match.cases.map((caseItem) => caseItem.label).join(', ') || 'none',
        String(match.transcriptSyncCount ?? match.transcriptSyncLinks?.length ?? 0),
        memoSummary,
        truncateCell(summarizeText(match.text, input.appendixMode === 'expanded' ? 260 : 180), input.appendixMode === 'expanded' ? 260 : 180)
      ]);
    }
  }

  const sortedSources = [...sourceTotals.entries()]
    .map(([sourceId, entry]) => ({ sourceId, label: entry.label, count: entry.count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 40);
  const sortedCases = [...caseTotals.entries()]
    .map(([caseId, entry]) => ({ caseId, label: entry.label, count: entry.count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 40);
  const sortedCodes = [...codeTotals.entries()]
    .map(([codeId, entry]) => ({ codeId, label: entry.label, count: entry.count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 40);

  const queryIndexRows = input.queryBundles.map((queryBundle) => [
    queryBundle.label,
    queryBundle.queryId,
    queryBundle.mode,
    String(queryBundle.queryReport.summary.matchCount),
    String(queryBundle.queryReport.summary.sourceCount),
    String(queryBundle.queryReport.summary.caseCount),
    String(queryBundle.queryReport.summary.memoCount),
    queryBundle.queryLabels.length > 0 ? queryBundle.queryLabels.join(' | ') : 'none'
  ]);

  const querySections: StructuredReportSection[] = input.queryBundles.flatMap((queryBundle, index) => {
    const topSourceRows = queryBundle.queryReport.sources.slice(0, 12).map((source) => [
      source.sourceTitle ?? source.sourceId,
      String(source.matchCount),
      String(source.caseCount),
      String(source.memoCount),
      source.topCodes.map((code) => `${code.codeName} (${code.count})`).join(', ') || 'none'
    ]);
    const topCaseRows = queryBundle.queryReport.cases.slice(0, 12).map((caseItem) => [
      caseItem.caseLabel,
      String(caseItem.matchCount),
      String(caseItem.sourceCount),
      String(caseItem.memoCount),
      caseItem.topCodes.map((code) => `${code.codeName} (${code.count})`).join(', ') || 'none'
    ]);
    const excerptRows = queryBundle.queryReport.excerpts.slice(0, input.appendixMode === 'expanded' ? 30 : 15).map((excerpt) => [
      excerpt.sourceTitle ?? excerpt.sourceId,
      excerpt.segmentId,
      excerpt.caseLabels.join(', ') || 'none',
      excerpt.codeNames.join(', ') || 'none',
      String(excerpt.memoCount),
      truncateCell(summarizeText(excerpt.text, 220), 220)
    ]);

    return [{
      heading: `Query ${index + 1}: ${queryBundle.label}`,
      paragraphs: [
        `Saved query ID: ${queryBundle.queryId} | Mode: ${queryBundle.mode}`,
        `Filters: ${queryBundle.queryLabels.length > 0 ? queryBundle.queryLabels.join(' | ') : 'none'}`,
        `Matches: ${queryBundle.queryReport.summary.matchCount} | Sources: ${queryBundle.queryReport.summary.sourceCount} | Cases: ${queryBundle.queryReport.summary.caseCount} | Memos: ${queryBundle.queryReport.summary.memoCount}`
      ],
      tables: [
        {
          title: 'Source highlights',
          headers: ['Source', 'Matches', 'Cases', 'Memos', 'Top codes'],
          rows: topSourceRows
        },
        {
          title: 'Case highlights',
          headers: ['Case', 'Matches', 'Sources', 'Memos', 'Top codes'],
          rows: topCaseRows
        },
        {
          title: 'Excerpt highlights',
          headers: ['Source', 'Segment', 'Cases', 'Codes', 'Memos', 'Excerpt'],
          rows: excerptRows
        }
      ]
    }];
  });

  return {
    title: `${input.project.name} Committee Review Pack${input.bundleLabel ? ` - ${input.bundleLabel}` : ''}`,
    exportedAt: new Date().toISOString(),
    styleTemplate: input.styleTemplate,
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Bundle label: ${input.bundleLabel?.trim() || 'default'}`,
      `Style template: ${input.styleTemplate}`,
      `Queries included: ${queryCount} | Appendix mode: ${input.appendixMode} | Appendix row limit: ${rowLimit}`,
      input.project.description ? `Project description: ${input.project.description}` : 'Project description: none'
    ],
    sections: [
      {
        heading: 'Committee cover note',
        paragraphs: [
          'This report package compiles multiple saved qualitative queries into one committee/review workflow document.',
          'Each query contributes summary rollups and excerpt-level evidence, followed by a combined appendix for review packet assembly.'
        ]
      },
      {
        heading: 'Bundle index',
        tables: [
          {
            title: 'Included saved queries',
            headers: ['Label', 'Query ID', 'Mode', 'Matches', 'Sources', 'Cases', 'Memos', 'Filters'],
            rows: queryIndexRows
          }
        ]
      },
      {
        heading: 'Cross-query coverage',
        tables: [
          {
            title: 'Top sources across all included queries',
            headers: ['Source', 'Source ID', 'Matches'],
            rows: sortedSources.map((source) => [source.label, source.sourceId, String(source.count)])
          },
          {
            title: 'Top cases across all included queries',
            headers: ['Case', 'Case ID', 'Matches'],
            rows: sortedCases.map((caseItem) => [caseItem.label, caseItem.caseId, String(caseItem.count)])
          },
          {
            title: 'Top codes across all included queries',
            headers: ['Code', 'Code ID', 'Applications'],
            rows: sortedCodes.map((code) => [code.label, code.codeId, String(code.count)])
          }
        ]
      },
      ...querySections,
      {
        heading: 'Combined evidence appendix',
        paragraphs: [
          `The appendix is capped at ${rowLimit} rows for document review performance.`,
          input.appendixMode === 'expanded'
            ? 'Expanded mode keeps longer excerpts and denser evidence context.'
            : 'Standard mode focuses on concise evidence rows for rapid committee review.'
        ],
        tables: [
          {
            title: 'Evidence bundle',
            headers: ['Query', 'Source', 'Kind', 'Anchor', 'Segment', 'Codes', 'Coders', 'Cases', 'Transcript links', 'Memo titles', 'Excerpt'],
            rows: appendixRows
          }
        ]
      }
    ]
  };
}

export function buildMatrixCodingReport(input: {
  project: { id: string; name: string; description?: string };
  queryLabels: string[];
  matrix: MatrixCodingResult;
}): StructuredReport {
  const cellLookup = new Map(input.matrix.cells.map((cell) => [`${cell.codeId}::${cell.caseId}`, cell]));
  return {
    title: `${input.project.name} Matrix Coding Report`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Filters: ${input.queryLabels.length > 0 ? input.queryLabels.join(' | ') : 'none'}`,
      `Code rows: ${input.matrix.rows.length} | Case columns: ${input.matrix.columns.length} | Coded links: ${input.matrix.totalCount}`
    ],
    sections: [
      {
        heading: 'Matrix overview',
        paragraphs: [
          'This export summarizes code-by-case coverage from the active qualitative query.'
        ]
      },
      {
        heading: 'Matrix totals',
        tables: [
          {
            title: 'Code by case matrix',
            headers: ['Code \\ Case', ...input.matrix.columns.map((column) => column.caseLabel), 'Total'],
            rows: input.matrix.rows.map((row) => [
              row.codeName,
              ...input.matrix.columns.map((column) => String(cellLookup.get(`${row.codeId}::${column.caseId}`)?.count ?? 0)),
              String(row.count)
            ])
          }
        ]
      }
    ]
  };
}

export function buildCodeCodeMatrixReport(input: {
  project: { id: string; name: string; description?: string };
  queryLabels: string[];
  matrix: CodeCodeMatrixResult;
}): StructuredReport {
  const cellLookup = new Map(input.matrix.cells.map((cell) => [`${cell.rowCodeId}::${cell.columnCodeId}`, cell]));
  return {
    title: `${input.project.name} Code Co-Coding Matrix`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Filters: ${input.queryLabels.length > 0 ? input.queryLabels.join(' | ') : 'none'}`,
      `Code rows: ${input.matrix.rows.length} | Segments: ${input.matrix.totalSegments}`
    ],
    sections: [
      {
        heading: 'Code x code matrix',
        paragraphs: [
          'This export summarizes code co-coding across the filtered evidence set.'
        ],
        tables: [
          {
            title: 'Code x code totals',
            headers: ['Code \\ Code', ...input.matrix.columns.map((column) => column.codeName)],
            rows: input.matrix.rows.map((row) => [
              row.codeName,
              ...input.matrix.columns.map((column) => String(cellLookup.get(`${row.codeId}::${column.codeId}`)?.count ?? 0))
            ])
          }
        ]
      }
    ]
  };
}

export function buildCodeCooccurrenceReport(input: {
  project: { id: string; name: string; description?: string };
  queryLabels: string[];
  cooccurrence: CodeCooccurrenceResult;
}): StructuredReport {
  return {
    title: `${input.project.name} Code Co-Occurrence Report`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Filters: ${input.queryLabels.length > 0 ? input.queryLabels.join(' | ') : 'none'}`,
      `Pairs: ${input.cooccurrence.pairs.length} | Segments: ${input.cooccurrence.totalSegments}`
    ],
    sections: [
      {
        heading: 'Co-occurrence pairs',
        tables: [
          {
            title: 'Code pairs',
            headers: ['Primary code', 'Secondary code', 'Segments', 'Sources', 'Cases'],
            rows: input.cooccurrence.pairs.map((pair) => [
              pair.primaryCodeName,
              pair.secondaryCodeName,
              String(pair.segmentCount),
              String(pair.sourceCount),
              String(pair.caseCount)
            ])
          }
        ]
      }
    ]
  };
}

export function buildQualitativeQuerySummaryReport(input: {
  project: { id: string; name: string; description?: string };
  queryLabels: string[];
  report: QualitativeQueryReport;
}): StructuredReport {
  const sections: StructuredReportSection[] = [];
  if (input.report.options.includeSourceCoverage) {
    sections.push({
      heading: 'Source coverage',
      tables: [
        {
          title: 'Source summary',
          headers: ['Source', 'Matches', 'Cases', 'Memos', 'Top codes'],
          rows: input.report.sources.map((source) => [
            source.sourceTitle ?? source.sourceId,
            String(source.matchCount),
            String(source.caseCount),
            String(source.memoCount),
            source.topCodes.map((code) => `${code.codeName} (${code.count})`).join(', ') || 'none'
          ])
        }
      ]
    });
  }
  if (input.report.options.includeCaseCoverage) {
    sections.push({
      heading: 'Case coverage',
      tables: [
        {
          title: 'Case summary',
          headers: ['Case', 'Matches', 'Sources', 'Memos', 'Top codes'],
          rows: input.report.cases.map((caseEntry) => [
            caseEntry.caseLabel,
            String(caseEntry.matchCount),
            String(caseEntry.sourceCount),
            String(caseEntry.memoCount),
            caseEntry.topCodes.map((code) => `${code.codeName} (${code.count})`).join(', ') || 'none'
          ])
        }
      ]
    });
  }
  if (input.report.options.includeExcerptRows) {
    sections.push({
      heading: 'Evidence excerpts',
      tables: [
        {
          title: 'Excerpt rows',
          headers: ['Source', 'Segment', 'Cases', 'Codes', 'Memos', 'Excerpt'],
          rows: input.report.excerpts.map((entry) => [
            entry.sourceTitle ?? entry.sourceId,
            entry.segmentId,
            entry.caseLabels.join(', ') || 'none',
            entry.codeNames.join(', ') || 'none',
            String(entry.memoCount),
            truncateCell(summarizeText(entry.text, 220), 220)
          ])
        }
      ]
    });
  }

  return {
    title: `${input.project.name} Qualitative Query Summary`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Filters: ${input.queryLabels.length > 0 ? input.queryLabels.join(' | ') : 'none'}`,
      `Matches: ${input.report.summary.matchCount} | Sources: ${input.report.summary.sourceCount} | Cases: ${input.report.summary.caseCount} | Memos: ${input.report.summary.memoCount}`,
      `Report profile: sources ${input.report.options.includeSourceCoverage ? `yes (${input.report.options.topSources})` : 'no'}, cases ${input.report.options.includeCaseCoverage ? `yes (${input.report.options.topCases})` : 'no'}, excerpts ${input.report.options.includeExcerptRows ? `yes (${input.report.options.excerptLimit})` : 'no'}, sort ${input.report.options.sortBy}`
    ],
    sections
  };
}

export function buildCompoundWorkbenchReport(input: {
  project: { id: string; name: string; description?: string };
  queryLabels: string[];
  result: {
    operator: 'all' | 'any' | 'none';
    minGroupsMatched: number | null;
    caseSensitive: boolean;
    scopedCount: number;
    matchCount: number;
    returnedCount: number;
    sourceCount: number;
    caseCount: number;
    groupCount: number;
    clauseCount: number;
    groupBreakdown: Array<{
      id: string;
      label: string;
      operator: 'all' | 'any' | 'none';
      minClausesMatched: number | null;
      clauseCount: number;
      operatorMatchCount: number;
      matchCount: number;
      avgMatchedClauses: number;
      maxMatchedClauses: number;
    }>;
    itemGroupMatches?: Record<string, boolean[]>;
    itemGroupClauseMatches?: Record<string, number[]>;
    itemGroupClauseTotals?: Record<string, number[]>;
    items: Array<{
      segment: { id: string; sourceId: string; text: string };
      source: { title: string | null } | null;
      cases: Array<{ label: string }>;
      applications: Array<{ codeId: string; coderId: string }>;
      memos: Array<{ title: string }>;
    }>;
  };
}): StructuredReport {
  const topRows = input.result.items.slice(0, 75).map((item) => {
    const groupClauseMatches = input.result.itemGroupClauseMatches?.[item.segment.id] ?? [];
    const groupClauseTotals = input.result.itemGroupClauseTotals?.[item.segment.id] ?? [];
    const groupMatches = (input.result.itemGroupMatches?.[item.segment.id] ?? [])
      .map((matched, index) => {
        const label = input.result.groupBreakdown[index]?.label ?? `Group ${index + 1}`;
        const clauseCount = groupClauseTotals[index];
        const matchedClauseCount = groupClauseMatches[index];
        const clauseDetail = typeof clauseCount === 'number' && clauseCount > 0
          ? ` (${matchedClauseCount ?? 0}/${clauseCount} clauses)`
          : '';
        return `${label}: ${matched ? 'yes' : 'no'}${clauseDetail}`;
      })
      .join(' | ');
    const codeSummary = item.applications
      .map((application) => `${application.codeId} (${application.coderId})`)
      .slice(0, 5)
      .join(', ');
    return [
      item.source?.title ?? item.segment.sourceId,
      item.segment.id,
      item.cases.map((caseItem) => caseItem.label).join(', ') || 'none',
      codeSummary || 'none',
      String(item.memos.length),
      groupMatches || 'n/a',
      truncateCell(summarizeText(item.segment.text, 220), 220)
    ];
  });

  return {
    title: `${input.project.name} Compound Workbench Report`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Filters: ${input.queryLabels.length > 0 ? input.queryLabels.join(' | ') : 'none'}`,
      `Group operator: ${input.result.operator} | Case-sensitive: ${input.result.caseSensitive ? 'yes' : 'no'}`,
      `Group threshold: ${input.result.minGroupsMatched === null ? 'none' : `>= ${input.result.minGroupsMatched} group(s)`}`,
      `Scoped: ${input.result.scopedCount} | Matched: ${input.result.matchCount} | Returned: ${input.result.returnedCount}`
    ],
    sections: [
      {
        heading: 'Workbench summary',
        tables: [
          {
            title: 'Query totals',
            headers: ['Metric', 'Value'],
            rows: [
              ['Groups', String(input.result.groupCount)],
              ['Clauses', String(input.result.clauseCount)],
              ['Min groups matched', input.result.minGroupsMatched === null ? 'none' : String(input.result.minGroupsMatched)],
              ['Sources matched', String(input.result.sourceCount)],
              ['Cases matched', String(input.result.caseCount)]
            ]
          },
          {
            title: 'Group breakdown',
            headers: ['Group', 'Operator', 'Min clauses', 'Clauses', 'Operator matches', 'Matches', 'Avg matched clauses', 'Max matched clauses'],
            rows: input.result.groupBreakdown.map((group) => [
              group.label,
              group.operator,
              group.minClausesMatched === null ? 'none' : String(group.minClausesMatched),
              String(group.clauseCount),
              String(group.operatorMatchCount),
              String(group.matchCount),
              group.avgMatchedClauses.toFixed(2),
              String(group.maxMatchedClauses)
            ])
          }
        ]
      },
      {
        heading: 'Matched excerpts',
        tables: [
          {
            title: 'Evidence rows',
            headers: ['Source', 'Segment', 'Cases', 'Codes (coder)', 'Memos', 'Group matches', 'Excerpt'],
            rows: topRows
          }
        ]
      }
    ]
  };
}

export function buildFrameworkMatrixSummaryReport(input: {
  project: { id: string; name: string; description?: string };
  queryLabels: string[];
  matrix: FrameworkMatrixResult;
  annotations?: Array<{ targetType: string; targetId: string; note: string; colorToken?: string }>;
}): StructuredReport {
  const cellLookup = new Map(input.matrix.cells.map((cell) => [`${cell.caseId}::${cell.codeId}`, cell]));
  const densestCells = [...input.matrix.cells]
    .sort((left, right) => right.count - left.count || right.memoCount - left.memoCount)
    .slice(0, 10);
  const caseCoverageRows = input.matrix.caseSummaries.map((entry) => [
    entry.caseLabel,
    String(entry.totalLinks),
    String(entry.memoCount),
    String(entry.populatedCodes)
  ]);
  const codeCoverageRows = input.matrix.codeSummaries.map((entry) => [
    entry.codeName,
    String(entry.totalLinks),
    String(entry.caseCount),
    String(entry.memoCount)
  ]);
  const sourceCoverageRows = input.matrix.sourceSummaries.map((entry) => [
    entry.sourceTitle ?? entry.sourceId,
    String(entry.totalLinks),
    String(entry.caseCount),
    String(entry.codeCount),
    String(entry.memoCount)
  ]);
  const caseSummaryRows = input.matrix.caseSummaries.map((entry) => [
    entry.caseLabel,
    entry.topCodes.map((code) => `${code.codeName} (${code.count})`).join(', ') || 'none',
    entry.topSources.map((source) => `${source.sourceTitle ?? source.sourceId} (${source.count})`).join(', ') || 'none',
    summarizeText(entry.summary || 'No excerpt summary.', 140),
    summarizeText((entry.memoHighlights ?? []).join(' | ') || 'No memo highlights.', 160)
  ]);
  const codeSummaryRows = input.matrix.codeSummaries.map((entry) => [
    entry.codeName,
    entry.topCases.map((caseEntry) => `${caseEntry.caseLabel} (${caseEntry.count})`).join(', ') || 'none',
    entry.topSources.map((source) => `${source.sourceTitle ?? source.sourceId} (${source.count})`).join(', ') || 'none',
    summarizeText(entry.summary || 'No excerpt summary.', 140),
    summarizeText((entry.memoHighlights ?? []).join(' | ') || 'No memo highlights.', 160)
  ]);
  const annotationSummary = Array.isArray(input.annotations) ? input.annotations : [];
  const annotationRows = ['project', 'source', 'segment', 'code', 'case'].map((targetType) => {
    const items = annotationSummary.filter((annotation) => annotation.targetType === targetType);
    const colors = [...new Set(items.map((annotation) => annotation.colorToken || 'default'))];
    return [targetType, String(items.length), colors.join(', ') || 'none'];
  });
  return {
    title: `${input.project.name} Framework Matrix Summary`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Filters: ${input.queryLabels.length > 0 ? input.queryLabels.join(' | ') : 'none'}`,
      `Cases: ${input.matrix.rows.length} | Codes: ${input.matrix.columns.length} | Links: ${input.matrix.totalCount}`,
      `Populated cells: ${input.matrix.populatedCellCount} | Density: ${formatPercent(input.matrix.cellDensity)}`
    ],
    sections: [
      {
        heading: 'Framework matrix',
        paragraphs: [
          'This report organizes case-by-code evidence with counts, memo density, and a short excerpt summary for each populated cell.'
        ],
        tables: [
          {
            title: 'Case x code matrix',
            headers: ['Case \\ Code', ...input.matrix.columns.map((column) => column.codeName)],
            rows: input.matrix.rows.map((row) => [
              row.caseLabel,
              ...input.matrix.columns.map((column) => {
                const cell = cellLookup.get(`${row.caseId}::${column.codeId}`);
                if (!cell) return '0';
                const summary = cell.summary ? summarizeText(cell.summary, 90) : 'no excerpt';
                const memoHighlights = Array.isArray(cell.memoHighlights) && cell.memoHighlights.length > 0
                  ? summarizeText(cell.memoHighlights.join(' | '), 90)
                  : 'no memo highlight';
                return `${cell.count} | memos ${cell.memoCount} | ${summary} | ${memoHighlights}`;
              })
            ])
          }
        ]
      },
      {
        heading: 'Coverage rollups',
        tables: [
          {
            title: 'Case coverage',
            headers: ['Case', 'Links', 'Memo references', 'Populated codes'],
            rows: caseCoverageRows
          },
          {
            title: 'Code coverage',
            headers: ['Code', 'Links', 'Cases', 'Memo references'],
            rows: codeCoverageRows
          },
          {
            title: 'Source coverage',
            headers: ['Source', 'Links', 'Cases', 'Codes', 'Memo references'],
            rows: sourceCoverageRows
          }
        ]
      },
      {
        heading: 'Framework summaries',
        paragraphs: [
          'Case and code summaries provide quick narrative anchors for committee review and qualitative synthesis.'
        ],
        tables: [
          {
            title: 'Case summaries',
            headers: ['Case', 'Top codes', 'Top sources', 'Narrative summary', 'Memo highlights'],
            rows: caseSummaryRows
          },
          {
            title: 'Code summaries',
            headers: ['Code', 'Top cases', 'Top sources', 'Narrative summary', 'Memo highlights'],
            rows: codeSummaryRows
          }
        ]
      },
      {
        heading: 'High-density cells',
        tables: [
          {
            title: 'Top populated framework cells',
            headers: ['Case ID', 'Code ID', 'Links', 'Memos', 'Sources', 'Segment IDs', 'Summary', 'Memo highlights'],
            rows: densestCells.map((cell) => [
              cell.caseId,
              cell.codeId,
              String(cell.count),
              String(cell.memoCount),
              cell.sourceIds.join(', ') || 'none',
              cell.segmentIds.slice(0, 5).join(', ') || 'none',
              summarizeText(cell.summary || 'No excerpt summary.', 120),
              summarizeText((cell.memoHighlights ?? []).join(' | ') || 'none', 120)
            ])
          }
        ]
      },
      {
        heading: 'Annotation summary',
        paragraphs: [
          'Annotations are reported as first-class review notes alongside framework outputs.'
        ],
        tables: [
          {
            title: 'Annotations by target type',
            headers: ['Target type', 'Count', 'Color tokens'],
            rows: annotationRows
          }
        ]
      }
    ]
  };
}

export function buildCodingComparisonReport(input: {
  project: { id: string; name: string; description?: string };
  queryLabels: string[];
  comparison: CodingComparisonResult;
}): StructuredReport {
  return {
    title: `${input.project.name} Coding Comparison`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Filters: ${input.queryLabels.length > 0 ? input.queryLabels.join(' | ') : 'none'}`,
      `Code: ${input.comparison.codeName}`,
      `Coders: ${input.comparison.coderA} vs ${input.comparison.coderB}`
    ],
    sections: [
      {
        heading: 'Agreement summary',
        tables: [
          {
            title: 'Comparison metrics',
            headers: ['Metric', 'Value'],
            rows: [
              ['Universe segments', String(input.comparison.universeSegmentCount)],
              ['Agreement count', String(input.comparison.agreementCount)],
              ['Disagreement count', String(input.comparison.disagreementCount)],
              ['Percent agreement', formatValue(input.comparison.percentAgreement)],
              ["Cohen's kappa", formatValue(input.comparison.cohensKappa)],
              ['Both applied', String(input.comparison.bothAppliedCount)],
              ['Neither applied', String(input.comparison.neitherAppliedCount)],
              [`${input.comparison.coderA} only`, String(input.comparison.coderAOnlyCount)],
              [`${input.comparison.coderB} only`, String(input.comparison.coderBOnlyCount)]
            ]
          }
        ]
      },
      {
        heading: 'Disagreement examples',
        tables: [
          {
            title: 'Mismatched segments',
            headers: ['Source', 'Segment', input.comparison.coderA, input.comparison.coderB, 'Excerpt'],
            rows: input.comparison.disagreements.map((item) => [
              item.sourceTitle ?? item.sourceId,
              item.segmentId,
              item.coderAApplied ? 'yes' : 'no',
              item.coderBApplied ? 'yes' : 'no',
              summarizeText(item.text, 180)
            ])
          }
        ]
      }
    ]
  };
}

export function buildInterRaterSummaryReport(input: {
  project: { id: string; name: string; description?: string };
  queryLabels: string[];
  summary: InterRaterSummaryResult;
}): StructuredReport {
  return {
    title: `${input.project.name} Inter-Rater Summary`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Filters: ${input.queryLabels.length > 0 ? input.queryLabels.join(' | ') : 'none'}`,
      `Coders: ${input.summary.coderA} vs ${input.summary.coderB}`,
      `Average agreement: ${formatValue(input.summary.averageAgreement)} | Average kappa: ${formatValue(input.summary.averageKappa)}`
    ],
    sections: [
      {
        heading: 'Code-level agreement',
        tables: [
          {
            title: 'Inter-rater summary',
            headers: ['Code', 'Universe', 'Agreement', 'Disagreement', 'Percent agreement', "Cohen's kappa"],
            rows: input.summary.rows.map((row) => [
              row.codeName,
              String(row.universeSegmentCount),
              String(row.agreementCount),
              String(row.disagreementCount),
              formatValue(row.percentAgreement),
              formatValue(row.cohensKappa)
            ])
          }
        ]
      }
    ]
  };
}

export function buildMergeReviewReport(input: {
  project: { id: string; name: string; description?: string };
  queryLabels: string[];
  review: {
    candidateCount: number;
    returnedCount?: number;
    hasMore?: boolean;
    filters?: {
      minCoderCount?: number;
      minConfidenceSpread?: number;
      maxRows?: number;
    };
    rows: Array<{
      codeName: string;
      sourceTitle: string | null;
      sourceId: string;
      segmentId: string;
      coderIds: string[];
      applicationCount: number;
      confidenceSpread: number;
      excerpt: string;
      applications?: Array<{
        id: string;
        coderId: string;
        caseId: string | null;
        confidence: number;
      }>;
    }>;
  };
}): StructuredReport {
  const returnedCount = input.review.returnedCount ?? input.review.rows.length;
  const filters = input.review.filters ?? {};
  return {
    title: `${input.project.name} Merge Review`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Filters: ${input.queryLabels.length > 0 ? input.queryLabels.join(' | ') : 'none'}`,
      `Candidates: ${input.review.candidateCount} | Returned: ${returnedCount}${input.review.hasMore ? ' (truncated)' : ''}`
    ],
    sections: [
      {
        heading: 'Merge review summary',
        tables: [
          {
            title: 'Threshold settings',
            headers: ['Setting', 'Value'],
            rows: [
              ['Minimum coder count', String(filters.minCoderCount ?? 2)],
              ['Minimum confidence spread', String(filters.minConfidenceSpread ?? 0.2)],
              ['Maximum rows', String(filters.maxRows ?? returnedCount)],
              ['More candidates available', input.review.hasMore ? 'yes' : 'no']
            ]
          }
        ]
      },
      {
        heading: 'Merge candidates',
        tables: [
          {
            title: 'Candidate rows',
            headers: ['Code', 'Source', 'Segment', 'Coders', 'Applications', 'Confidence spread', 'Application details', 'Excerpt'],
            rows: input.review.rows.map((row) => [
              row.codeName,
              row.sourceTitle ?? row.sourceId,
              row.segmentId,
              row.coderIds.join(', '),
              String(row.applicationCount),
              String(row.confidenceSpread.toFixed(3)),
              (row.applications ?? [])
                .map((application) => `${application.coderId} (${application.confidence.toFixed(2)})`)
                .join(', ') || 'none',
              summarizeText(row.excerpt, 220)
            ])
          }
        ]
      }
    ]
  };
}

export function buildChatHistoryReport(input: ChatHistoryInput): StructuredReport {
  return {
    title: `${input.project.name} Chat History`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Messages: ${input.messages.length}`,
      input.project.description ? `Project description: ${input.project.description}` : 'Project description: none'
    ],
    sections: [
      {
        heading: 'Conversation log',
        paragraphs: [
          'This export captures the stored project chat history.'
        ],
        tables: [
          {
            title: 'Project messages',
            headers: ['Timestamp', 'User', 'Message'],
            rows: input.messages.map((message) => [
              message.createdAt,
              message.username,
              truncateCell(summarizeText(message.body, 400), 400)
            ])
          }
        ]
      }
    ]
  };
}
