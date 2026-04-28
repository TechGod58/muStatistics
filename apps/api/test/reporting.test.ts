import { describe, expect, it } from 'vitest';
import {
  buildAppendixReport,
  buildCaseSummariesReport,
  buildCommitteeReviewPackReport,
  buildCompoundWorkbenchReport,
  buildEvidenceReport,
  buildMergeReviewReport,
  buildProjectCodebookReport,
  renderStructuredReportDocx,
  renderStructuredReportPdf,
  renderAuditEventsXlsx,
  renderDatasetXlsx,
  renderEvidenceReportXlsx,
  renderStructuredReportXlsx
} from '../src/reporting';

describe('reporting exports', () => {
  it('builds a project codebook report with usage counts', () => {
    const report = buildProjectCodebookReport({
      project: { id: 'project-1', name: 'Demo project', description: 'Demo' },
      codes: [
        {
          id: 'code-1',
          projectId: 'project-1',
          parentCodeId: null,
          name: 'Trust concern',
          description: 'Flags concern about trust',
          colorToken: 'blue',
          createdAt: '2026-03-27T00:00:00.000Z',
          updatedAt: '2026-03-27T00:00:00.000Z'
        }
      ],
      applications: [
        {
          id: 'ca-1',
          projectId: 'project-1',
          segmentId: 'segment-1',
          codeId: 'code-1',
          caseId: 'case-1',
          coderId: 'student1',
          confidence: 1,
          createdAt: '2026-03-27T00:00:00.000Z'
        }
      ],
      memos: [
        {
          id: 'memo-1',
          projectId: 'project-1',
          targetType: 'code',
          targetId: 'code-1',
          title: 'Definition memo',
          body: 'Used when trust is discussed as a problem.',
          createdAt: '2026-03-27T00:00:00.000Z',
          updatedAt: '2026-03-27T00:00:00.000Z'
        }
      ]
    });

    expect(report.title).toContain('Project Codebook');
    expect(report.sections[0]?.tables?.[0]?.rows[0]).toContain('1');
  });

  it('builds case summaries and appendix reports', () => {
    const caseSummaries = buildCaseSummariesReport({
      project: { id: 'project-1', name: 'Demo project', description: 'Demo' },
      cases: [
        {
          id: 'case-1',
          projectId: 'project-1',
          label: 'Participant A',
          sourceIds: ['source-1'],
          createdAt: '2026-03-27T00:00:00.000Z',
          updatedAt: '2026-03-27T00:00:00.000Z'
        }
      ],
      attributes: [
        {
          id: 'attr-1',
          projectId: 'project-1',
          targetType: 'case',
          targetId: 'case-1',
          name: 'Department',
          value: 'Admissions',
          createdAt: '2026-03-27T00:00:00.000Z',
          updatedAt: '2026-03-27T00:00:00.000Z'
        }
      ],
      sources: [
        {
          id: 'source-1',
          projectId: 'project-1',
          kind: 'transcript',
          title: 'Interview 1',
          language: 'en',
          contentType: 'text/plain',
          contentUrl: null,
          contentText: 'Trust was a recurring concern.',
          createdAt: '2026-03-27T00:00:00.000Z',
          updatedAt: '2026-03-27T00:00:00.000Z'
        }
      ],
      segments: [
        {
          id: 'segment-1',
          projectId: 'project-1',
          sourceId: 'source-1',
          kind: 'text_range',
          anchor: { kind: 'text_range', start: 0, end: 24 },
          text: 'Trust was a recurring concern.',
          createdAt: '2026-03-27T00:00:00.000Z',
          updatedAt: '2026-03-27T00:00:00.000Z'
        }
      ],
      codes: [
        {
          id: 'code-1',
          projectId: 'project-1',
          parentCodeId: null,
          name: 'Trust concern',
          description: 'Flags concern about trust',
          colorToken: 'blue',
          createdAt: '2026-03-27T00:00:00.000Z',
          updatedAt: '2026-03-27T00:00:00.000Z'
        }
      ],
      applications: [
        {
          id: 'ca-1',
          projectId: 'project-1',
          segmentId: 'segment-1',
          codeId: 'code-1',
          caseId: 'case-1',
          coderId: 'student1',
          confidence: 1,
          createdAt: '2026-03-27T00:00:00.000Z'
        }
      ],
      memos: [
        {
          id: 'memo-1',
          projectId: 'project-1',
          targetType: 'case',
          targetId: 'case-1',
          title: 'Case memo',
          body: 'Participant links trust to process opacity.',
          createdAt: '2026-03-27T00:00:00.000Z',
          updatedAt: '2026-03-27T00:00:00.000Z'
        }
      ]
    });

    expect(caseSummaries.sections.some((section) => section.heading.includes('Participant A'))).toBe(true);

    const appendix = buildAppendixReport({
      report: buildEvidenceReport({
        project: { id: 'project-1', name: 'Demo project', description: 'Demo' },
        exportedAt: '2026-03-27T00:00:00.000Z',
        codebook: [
          { id: 'code-1', name: 'Trust concern', description: 'Flags concern about trust', colorToken: 'blue' }
        ],
        matches: [
          {
            segmentId: 'segment-1',
            sourceId: 'source-1',
            sourceTitle: 'Interview 1',
            text: 'Trust was a recurring concern.',
            codes: [{ codeId: 'code-1', coderId: 'student1', caseId: 'case-1', confidence: 1 }],
            cases: [{ caseId: 'case-1', label: 'Participant A' }],
            memos: [{ memoId: 'memo-1', title: 'Case memo', body: 'Participant links trust to process opacity.' }]
          }
        ]
      }, ['Code: code-1'])
    });

    expect(appendix.title).toContain('Committee Appendix');
    expect(appendix.sections.at(-1)?.tables?.[0]?.rows).toHaveLength(1);
  });

  it('renders excel workbooks for datasets, evidence, and structured reports', () => {
    const codebook = buildProjectCodebookReport({
      project: { id: 'project-1', name: 'Demo project', description: 'Demo' },
      codes: [
        {
          id: 'code-1',
          projectId: 'project-1',
          parentCodeId: null,
          name: 'Trust concern',
          description: 'Flags concern about trust',
          colorToken: 'blue',
          createdAt: '2026-03-27T00:00:00.000Z',
          updatedAt: '2026-03-27T00:00:00.000Z'
        }
      ],
      applications: [],
      memos: []
    });

    const evidenceReport = buildEvidenceReport({
      project: { id: 'project-1', name: 'Demo project', description: 'Demo' },
      exportedAt: '2026-03-27T00:00:00.000Z',
      codebook: [
        { id: 'code-1', name: 'Trust concern', description: 'Flags concern about trust', colorToken: 'blue' }
      ],
      matches: [
        {
          segmentId: 'segment-1',
          sourceId: 'source-1',
          sourceTitle: 'Interview 1',
          text: 'Trust was a recurring concern.',
          codes: [{ codeId: 'code-1', coderId: 'student1', caseId: 'case-1', confidence: 1 }],
          cases: [{ caseId: 'case-1', label: 'Participant A' }],
          memos: [{ memoId: 'memo-1', title: 'Case memo', body: 'Participant links trust to process opacity.' }]
        }
      ]
    }, ['Code: code-1']);

    const datasetXlsx = renderDatasetXlsx({
      projectId: 'project-1',
      rows: [{ case_id: 'case-1', trust_score: 4, trust_flag: true }],
      report: {
        caseCount: 1,
        fieldCount: 3,
        summaries: [
          {
            key: 'trust_score',
            label: 'Trust score',
            source: 'attribute',
            valueType: 'number',
            validCount: 1,
            missingCount: 0,
            distinctCount: 1,
            numeric: { mean: 4, min: 4, max: 4, stdDev: 0 }
          }
        ]
      }
    });

    const structuredXlsx = renderStructuredReportXlsx(codebook);
    const evidenceXlsx = renderEvidenceReportXlsx(evidenceReport);
    const auditXlsx = renderAuditEventsXlsx([{
      createdAt: '2026-03-27T00:00:00.000Z',
      actorUsername: 'student1',
      actorRole: 'student',
      action: 'export.dataset',
      actionLabel: 'Export dataset',
      entityType: 'export',
      entityId: 'project-1:dataset:xlsx',
      details: { format: 'xlsx' }
    }]);

    expect(datasetXlsx.byteLength).toBeGreaterThan(0);
    expect(structuredXlsx.byteLength).toBeGreaterThan(0);
    expect(evidenceXlsx.byteLength).toBeGreaterThan(0);
    expect(auditXlsx.byteLength).toBeGreaterThan(0);
  });

  it('builds a merge review report with candidate rows', () => {
    const report = buildMergeReviewReport({
      project: { id: 'project-1', name: 'Demo project' },
      queryLabels: ['Source kind: transcript'],
      review: {
        candidateCount: 1,
        returnedCount: 1,
        hasMore: false,
        filters: {
          minCoderCount: 2,
          minConfidenceSpread: 0.2,
          maxRows: 100
        },
        rows: [
          {
            codeName: 'Trust concern',
            sourceTitle: 'Interview 1',
            sourceId: 'source-1',
            segmentId: 'segment-1',
            coderIds: ['student1', 'student2'],
            applicationCount: 2,
            confidenceSpread: 0.35,
            excerpt: 'Trust was inconsistent in the process.',
            applications: [
              { id: 'ca-1', coderId: 'student1', caseId: 'case-1', confidence: 0.9 },
              { id: 'ca-2', coderId: 'student2', caseId: 'case-1', confidence: 0.55 }
            ]
          }
        ]
      }
    });

    expect(report.title).toContain('Merge Review');
    expect(report.sections[1]?.tables?.[0]?.rows[0]?.[0]).toBe('Trust concern');
  });

  it('builds a compound workbench report with group breakdown and evidence rows', () => {
    const report = buildCompoundWorkbenchReport({
      project: { id: 'project-1', name: 'Demo project' },
      queryLabels: ['Source kind: transcript', 'Workbench groups: 2'],
      result: {
        operator: 'all',
        minGroupsMatched: 2,
        caseSensitive: false,
        scopedCount: 18,
        matchCount: 6,
        returnedCount: 6,
        sourceCount: 2,
        caseCount: 3,
        groupCount: 2,
        clauseCount: 4,
        groupBreakdown: [
          { id: 'group_1', label: 'Trust mention', operator: 'any', minClausesMatched: 1, clauseCount: 2, operatorMatchCount: 9, matchCount: 8, avgMatchedClauses: 1.2, maxMatchedClauses: 2 },
          { id: 'group_2', label: 'Admissions context', operator: 'all', minClausesMatched: 2, clauseCount: 2, operatorMatchCount: 6, matchCount: 6, avgMatchedClauses: 1.0, maxMatchedClauses: 2 }
        ],
        itemGroupMatches: {
          'segment-1': [true, true]
        },
        itemGroupClauseMatches: {
          'segment-1': [2, 2]
        },
        itemGroupClauseTotals: {
          'segment-1': [2, 2]
        },
        items: [
          {
            segment: { id: 'segment-1', sourceId: 'source-1', text: 'Trust concerns came up in admissions meetings.' },
            source: { title: 'Interview 1' },
            cases: [{ label: 'Participant A' }],
            applications: [{ codeId: 'code-trust', coderId: 'student1' }],
            memos: [{ title: 'Memo 1' }]
          }
        ]
      }
    });

    expect(report.title).toContain('Compound Workbench');
    expect(report.sections[0]?.tables?.[1]?.rows[0]?.[0]).toBe('Trust mention');
    expect(report.sections[1]?.tables?.[0]?.rows[0]?.[1]).toBe('segment-1');
  });

  it('builds committee review packs and renders style-governed Word/PDF output', async () => {
    const evidenceReport = buildEvidenceReport({
      project: { id: 'project-1', name: 'Demo project' },
      exportedAt: '2026-03-27T00:00:00.000Z',
      codebook: [
        { id: 'code-1', name: 'Trust concern', description: 'Flags concern about trust', colorToken: 'blue' }
      ],
      matches: [
        {
          segmentId: 'segment-1',
          sourceId: 'source-1',
          sourceTitle: 'Interview 1',
          sourceKind: 'transcript',
          anchorSummary: 'chars 0-24',
          text: 'Trust was a recurring concern.',
          transcriptSyncCount: 1,
          codes: [{ codeId: 'code-1', coderId: 'student1', caseId: 'case-1', confidence: 1 }],
          cases: [{ caseId: 'case-1', label: 'Participant A' }],
          memos: [{ memoId: 'memo-1', title: 'Case memo', body: 'Participant links trust to process opacity.' }]
        }
      ]
    }, ['Code: code-1']);

    const committeePack = buildCommitteeReviewPackReport({
      project: { id: 'project-1', name: 'Demo project' },
      bundleLabel: 'Committee cycle A',
      styleTemplate: 'committee',
      appendixMode: 'expanded',
      appendixRowLimit: 250,
      queryBundles: [
        {
          queryId: 'qual-query-1',
          label: 'Trust concern review',
          mode: 'query_report',
          queryLabels: ['Code: code-1'],
          queryReport: {
            summary: { matchCount: 1, sourceCount: 1, caseCount: 1, memoCount: 1 },
            options: {
              topSources: 20,
              topCases: 20,
              topCodes: 5,
              excerptLimit: 60,
              includeSourceCoverage: true,
              includeCaseCoverage: true,
              includeExcerptRows: true,
              sortBy: 'match_count'
            },
            sources: [
              {
                sourceId: 'source-1',
                sourceTitle: 'Interview 1',
                matchCount: 1,
                caseCount: 1,
                memoCount: 1,
                topCodes: [{ codeId: 'code-1', codeName: 'Trust concern', count: 1 }]
              }
            ],
            cases: [
              {
                caseId: 'case-1',
                caseLabel: 'Participant A',
                matchCount: 1,
                sourceCount: 1,
                memoCount: 1,
                topCodes: [{ codeId: 'code-1', codeName: 'Trust concern', count: 1 }]
              }
            ],
            excerpts: [
              {
                sourceId: 'source-1',
                sourceTitle: 'Interview 1',
                segmentId: 'segment-1',
                text: 'Trust was a recurring concern.',
                caseLabels: ['Participant A'],
                codeNames: ['Trust concern'],
                memoCount: 1
              }
            ]
          },
          evidenceReport
        }
      ]
    });

    expect(committeePack.title).toContain('Committee Review Pack');
    expect(committeePack.sections.some((section) => section.heading.includes('Combined evidence appendix'))).toBe(true);

    const docxBytes = await renderStructuredReportDocx(committeePack, { styleTemplate: 'committee' });
    const pdfBytes = await renderStructuredReportPdf(committeePack, { styleTemplate: 'committee' });
    expect(docxBytes.byteLength).toBeGreaterThan(0);
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
  });
});
