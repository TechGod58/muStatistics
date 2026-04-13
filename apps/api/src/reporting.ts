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
  matches: Array<{
    segmentId: string;
    sourceId: string;
    sourceTitle: string | null;
    text: string;
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
  };
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

function summarizeText(value: string, maxLength = 500): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return '(no text)';
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
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

function buildDocxTable(table: StructuredReportTable): Table {
  const rows = [
    new TableRow({
      tableHeader: true,
      children: table.headers.map((header) => new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: header, bold: true })]
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
      top: { style: BorderStyle.SINGLE, size: 1, color: 'C8D3E3' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'C8D3E3' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'C8D3E3' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'C8D3E3' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E1E7F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E1E7F0' }
    }
  });
}

function drawPdfTable(doc: PDFKit.PDFDocument, table: StructuredReportTable): void {
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
      doc.rect(x, y, colWidth, rowHeight).stroke('#C8D3E3');
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).text(text, x + cellPadding, y + cellPadding, {
        width: colWidth - (cellPadding * 2),
        align: 'left'
      });
    });
    doc.y = y + rowHeight;
  };

  doc.font('Helvetica-Bold').fontSize(11).text(table.title);
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

export async function renderStructuredReportDocx(report: StructuredReport): Promise<Uint8Array> {
  const children: Array<Paragraph | Table> = [
    new Paragraph({ text: report.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun(`Exported at: ${report.exportedAt}`)] }),
    ...report.subtitleLines.map((line) => new Paragraph({ children: [new TextRun(line)] }))
  ];

  report.sections.forEach((section) => {
    children.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1 }));
    (section.paragraphs ?? []).forEach((paragraph) => {
      children.push(new Paragraph({ text: paragraph }));
    });
    (section.tables ?? []).forEach((table) => {
      children.push(new Paragraph({ text: table.title, heading: HeadingLevel.HEADING_2 }));
      children.push(buildDocxTable(table));
    });
  });

  const doc = new Document({
    sections: [{ properties: {}, children }]
  });

  return Packer.toBuffer(doc);
}

export async function renderStructuredReportPdf(report: StructuredReport): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(20).text(report.title);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).text(`Exported at: ${report.exportedAt}`);
    report.subtitleLines.forEach((line) => doc.text(line));
    doc.moveDown();

    report.sections.forEach((section) => {
      if (doc.y > doc.page.height - 180) {
        doc.addPage();
      }
      doc.font('Helvetica-Bold').fontSize(14).text(section.heading);
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10);
      (section.paragraphs ?? []).forEach((paragraph) => {
        doc.text(paragraph);
        doc.moveDown(0.2);
      });
      (section.tables ?? []).forEach((table) => {
        drawPdfTable(doc, table);
      });
      doc.moveDown(0.6);
    });

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
  }

  return {
    title: `${bundle.project.name} Evidence Report`,
    exportedAt: bundle.exportedAt,
    filters,
    summary: {
      totalMatches: bundle.matches.length,
      uniqueSources,
      uniqueCases,
      uniqueCodes
    },
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
      `Matches: ${report.summary.totalMatches} | Sources: ${report.summary.uniqueSources} | Cases: ${report.summary.uniqueCases} | Codes: ${report.summary.uniqueCodes}`
    ],
    sections: [
      {
        heading: 'Coverage',
        tables: [
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
        paragraphs: ['Each row captures the excerpt, linked codes, linked cases, and the first attached memo when present.'],
        tables: [
          {
            title: 'Evidence bundle',
            headers: ['Source', 'Segment', 'Codes', 'Cases', 'Excerpt', 'Memo'],
            rows: report.matches.map((match) => [
              match.sourceTitle ?? match.sourceId,
              match.segmentId,
              match.codes.map((code) => code.codeId).join(', ') || 'none',
              match.cases.map((caseItem) => caseItem.label).join(', ') || 'none',
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
    match.segmentId,
    match.codes.map((code) => code.codeId).join(', ') || 'none',
    match.cases.map((caseItem) => caseItem.label).join(', ') || 'none',
    truncateCell(summarizeText(match.text, 220), 220),
    truncateCell(match.memos[0] ? summarizeText(match.memos[0].body || match.memos[0].title, 100) : 'none', 100)
  ]);

  return {
    title: input.report.title.replace(/Evidence Report$/, 'Committee Appendix'),
    exportedAt: input.report.exportedAt,
    subtitleLines: [
      `Filters: ${input.report.filters.length > 0 ? input.report.filters.join(' | ') : 'none'}`,
      `Matches: ${input.report.summary.totalMatches} | Sources: ${input.report.summary.uniqueSources} | Cases: ${input.report.summary.uniqueCases} | Codes: ${input.report.summary.uniqueCodes}`
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
            headers: ['Source', 'Segment', 'Codes', 'Cases', 'Excerpt', 'Memo'],
            rows: evidenceRows
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
  return {
    title: `${input.project.name} Qualitative Query Summary`,
    exportedAt: new Date().toISOString(),
    subtitleLines: [
      `Project ID: ${input.project.id}`,
      `Filters: ${input.queryLabels.length > 0 ? input.queryLabels.join(' | ') : 'none'}`,
      `Matches: ${input.report.summary.matchCount} | Sources: ${input.report.summary.sourceCount} | Cases: ${input.report.summary.caseCount} | Memos: ${input.report.summary.memoCount}`
    ],
    sections: [
      {
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
      },
      {
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
  const caseCoverageRows = input.matrix.rows.map((row) => {
    const rowCells = input.matrix.cells.filter((cell) => cell.caseId === row.caseId);
    const memoCount = rowCells.reduce((total, cell) => total + cell.memoCount, 0);
    const excerptCount = rowCells.filter((cell) => cell.summary).length;
    return [row.caseLabel, String(row.count), String(memoCount), String(excerptCount)];
  });
  const codeCoverageRows = input.matrix.columns.map((column) => {
    const columnCells = input.matrix.cells.filter((cell) => cell.codeId === column.codeId);
    const caseCount = new Set(columnCells.map((cell) => cell.caseId)).size;
    const memoCount = columnCells.reduce((total, cell) => total + cell.memoCount, 0);
    return [column.codeName, String(column.count), String(caseCount), String(memoCount)];
  });
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
      `Cases: ${input.matrix.rows.length} | Codes: ${input.matrix.columns.length} | Links: ${input.matrix.totalCount}`
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
                return `${cell.count} | memos ${cell.memoCount} | ${summary}`;
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
            headers: ['Case', 'Links', 'Memo references', 'Cells with summaries'],
            rows: caseCoverageRows
          },
          {
            title: 'Code coverage',
            headers: ['Code', 'Links', 'Cases', 'Memo references'],
            rows: codeCoverageRows
          }
        ]
      },
      {
        heading: 'High-density cells',
        tables: [
          {
            title: 'Top populated framework cells',
            headers: ['Case ID', 'Code ID', 'Links', 'Memos', 'Summary'],
            rows: densestCells.map((cell) => [
              cell.caseId,
              cell.codeId,
              String(cell.count),
              String(cell.memoCount),
              summarizeText(cell.summary || 'No excerpt summary.', 120)
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
