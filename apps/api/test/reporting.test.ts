import { describe, expect, it } from 'vitest';
import {
  buildAppendixReport,
  buildCaseSummariesReport,
  buildEvidenceReport,
  buildProjectCodebookReport,
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
});
