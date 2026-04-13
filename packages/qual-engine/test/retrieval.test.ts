import { describe, expect, it } from 'vitest';
import {
  createCase,
  createCodeApplication,
  createMemo,
  createSegment,
  createSource
} from '@mu/core-domain';
import { buildCodeByCaseView, buildCodingComparison, buildCompoundQuery, buildFrameworkMatrix, buildInterRaterSummary, buildMatrixCoding, buildTextSearch, buildWordFrequency, retrieveEvidence } from '../src/index';
import { buildPatternAutocode, buildSentimentAnalysis } from '../src/index';

describe('retrieveEvidence', () => {
  it('filters coded evidence by code, case, and search text', () => {
    const source = createSource({
      id: 'source-1',
      projectId: 'project-1',
      kind: 'transcript',
      title: 'Interview 1',
      contentType: 'text/plain',
      contentText: 'Trust in the process is low.'
    });
    const segment = createSegment({
      id: 'segment-1',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 0, end: 20 },
      text: 'Trust in the process'
    });
    const caseEntity = createCase({
      id: 'case-1',
      projectId: 'project-1',
      label: 'Participant 1',
      sourceIds: [source.id]
    });
    const application = createCodeApplication({
      id: 'ca-1',
      projectId: 'project-1',
      segmentId: segment.id,
      codeId: 'code-1',
      caseId: caseEntity.id,
      coderId: 'student1'
    });
    const memo = createMemo({
      id: 'memo-1',
      projectId: 'project-1',
      targetType: 'segment',
      targetId: segment.id,
      title: 'Memo'
    });

    const matches = retrieveEvidence({
      query: { codeId: 'code-1', caseId: caseEntity.id, searchText: 'trust' },
      sources: [source],
      segments: [segment],
      applications: [application],
      cases: [caseEntity],
      memos: [memo]
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]?.segment.id).toBe(segment.id);
    expect(matches[0]?.cases[0]?.id).toBe(caseEntity.id);
    expect(matches[0]?.memos[0]?.id).toBe(memo.id);
  });

  it('supports source kind, co-code, and memo-only retrieval filters', () => {
    const source = createSource({
      id: 'source-2',
      projectId: 'project-1',
      kind: 'pdf',
      title: 'Policy memo',
      contentType: 'application/pdf',
      contentText: 'Trust and process concerns were raised.'
    });
    const segment = createSegment({
      id: 'segment-2',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'page_region',
      anchor: { kind: 'page_region', page: 1, x: 0, y: 0, width: 100, height: 100 },
      text: 'Trust and process concerns were raised.'
    });
    const caseEntity = createCase({
      id: 'case-2',
      projectId: 'project-1',
      label: 'Participant 2',
      sourceIds: [source.id]
    });
    const primary = createCodeApplication({
      id: 'ca-2',
      projectId: 'project-1',
      segmentId: segment.id,
      codeId: 'code-trust',
      caseId: caseEntity.id,
      coderId: 'student1'
    });
    const secondary = createCodeApplication({
      id: 'ca-3',
      projectId: 'project-1',
      segmentId: segment.id,
      codeId: 'code-process',
      caseId: caseEntity.id,
      coderId: 'student1'
    });
    const memo = createMemo({
      id: 'memo-2',
      projectId: 'project-1',
      targetType: 'source',
      targetId: source.id,
      title: 'Linked source memo'
    });

    const matches = retrieveEvidence({
      query: {
        sourceKind: 'pdf',
        codeId: 'code-trust',
        coCodeId: 'code-process',
        memoOnly: true
      },
      sources: [source],
      segments: [segment],
      applications: [primary, secondary],
      cases: [caseEntity],
      memos: [memo]
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]?.source?.kind).toBe('pdf');
    expect(matches[0]?.applications).toHaveLength(1);
    expect(matches[0]?.memos[0]?.id).toBe(memo.id);
  });

  it('builds matrix coding and code-by-case views from evidence matches', () => {
    const source = createSource({
      id: 'source-3',
      projectId: 'project-1',
      kind: 'transcript',
      title: 'Interview 3',
      contentType: 'text/plain',
      contentText: 'Trust and fairness concerns'
    });
    const segment = createSegment({
      id: 'segment-3',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 0, end: 27 },
      text: 'Trust and fairness concerns'
    });
    const caseEntity = createCase({
      id: 'case-3',
      projectId: 'project-1',
      label: 'Participant 3',
      sourceIds: [source.id]
    });
    const trustApp = createCodeApplication({
      id: 'ca-4',
      projectId: 'project-1',
      segmentId: segment.id,
      codeId: 'code-trust',
      caseId: caseEntity.id,
      coderId: 'student1'
    });
    const fairnessApp = createCodeApplication({
      id: 'ca-5',
      projectId: 'project-1',
      segmentId: segment.id,
      codeId: 'code-fairness',
      caseId: caseEntity.id,
      coderId: 'student1'
    });

    const matrix = buildMatrixCoding({
      query: {},
      sources: [source],
      segments: [segment],
      applications: [trustApp, fairnessApp],
      cases: [caseEntity],
      memos: [],
      codes: [
        { id: 'code-trust', name: 'Trust' },
        { id: 'code-fairness', name: 'Fairness' }
      ]
    });
    expect(matrix.rows).toHaveLength(2);
    expect(matrix.columns).toHaveLength(1);
    expect(matrix.totalCount).toBe(2);

    const view = buildCodeByCaseView({
      query: {},
      sources: [source],
      segments: [segment],
      applications: [trustApp, fairnessApp],
      cases: [caseEntity],
      memos: [],
      codes: [
        { id: 'code-trust', name: 'Trust' },
        { id: 'code-fairness', name: 'Fairness' }
      ]
    });
    expect(view.cases).toHaveLength(1);
    expect(view.cases[0]?.codes).toHaveLength(2);
    expect(view.cases[0]?.codes[0]?.excerpts[0]?.segmentId).toBe(segment.id);
  });

  it('builds framework matrices and coding comparison results', () => {
    const source = createSource({
      id: 'source-4',
      projectId: 'project-1',
      kind: 'transcript',
      title: 'Interview 4',
      contentType: 'text/plain',
      contentText: 'Trust issue. Fairness issue.'
    });
    const segmentA = createSegment({
      id: 'segment-4a',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 0, end: 11 },
      text: 'Trust issue'
    });
    const segmentB = createSegment({
      id: 'segment-4b',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 13, end: 27 },
      text: 'Fairness issue'
    });
    const caseEntity = createCase({
      id: 'case-4',
      projectId: 'project-1',
      label: 'Participant 4',
      sourceIds: [source.id]
    });
    const trustAStudent = createCodeApplication({
      id: 'ca-6',
      projectId: 'project-1',
      segmentId: segmentA.id,
      codeId: 'code-trust',
      caseId: caseEntity.id,
      coderId: 'student1'
    });
    const trustAProfessor = createCodeApplication({
      id: 'ca-7',
      projectId: 'project-1',
      segmentId: segmentA.id,
      codeId: 'code-trust',
      caseId: caseEntity.id,
      coderId: 'professor1'
    });
    const trustBStudent = createCodeApplication({
      id: 'ca-8',
      projectId: 'project-1',
      segmentId: segmentB.id,
      codeId: 'code-trust',
      caseId: caseEntity.id,
      coderId: 'student1'
    });
    const fairnessBProfessor = createCodeApplication({
      id: 'ca-9',
      projectId: 'project-1',
      segmentId: segmentB.id,
      codeId: 'code-fairness',
      caseId: caseEntity.id,
      coderId: 'professor1'
    });
    const memo = createMemo({
      id: 'memo-4',
      projectId: 'project-1',
      targetType: 'segment',
      targetId: segmentA.id,
      title: 'Trust memo'
    });

    const framework = buildFrameworkMatrix({
      query: {},
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [trustAStudent, trustAProfessor, trustBStudent, fairnessBProfessor],
      cases: [caseEntity],
      memos: [memo],
      codes: [
        { id: 'code-trust', name: 'Trust' },
        { id: 'code-fairness', name: 'Fairness' }
      ]
    });
    expect(framework.rows).toHaveLength(1);
    expect(framework.columns).toHaveLength(2);
    expect(framework.totalCount).toBeGreaterThan(0);
    expect(framework.cells.some((cell) => cell.codeId === 'code-trust' && cell.caseId === caseEntity.id)).toBe(true);

    const comparison = buildCodingComparison({
      query: {},
      codeId: 'code-trust',
      coderA: 'student1',
      coderB: 'professor1',
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [trustAStudent, trustAProfessor, trustBStudent, fairnessBProfessor],
      cases: [caseEntity],
      memos: [memo],
      codes: [
        { id: 'code-trust', name: 'Trust' },
        { id: 'code-fairness', name: 'Fairness' }
      ]
    });
    expect(comparison.codeName).toBe('Trust');
    expect(comparison.universeSegmentCount).toBe(2);
    expect(comparison.bothAppliedCount).toBe(1);
    expect(comparison.coderAOnlyCount).toBe(1);
    expect(comparison.disagreements).toHaveLength(1);

    const summary = buildInterRaterSummary({
      query: {},
      coderA: 'student1',
      coderB: 'professor1',
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [trustAStudent, trustAProfessor, trustBStudent, fairnessBProfessor],
      cases: [caseEntity],
      memos: [memo],
      codes: [
        { id: 'code-trust', name: 'Trust' },
        { id: 'code-fairness', name: 'Fairness' }
      ]
    });
    expect(summary.rows).toHaveLength(2);
    expect(summary.averageAgreement).not.toBeNull();
  });

  it('builds word frequency and text search results inside a scoped retrieval', () => {
    const source = createSource({
      id: 'source-5',
      projectId: 'project-1',
      kind: 'transcript',
      title: 'Interview 5',
      contentType: 'text/plain',
      contentText: 'Trust in trust and fairness is important.'
    });
    const segmentA = createSegment({
      id: 'segment-5a',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 0, end: 18 },
      text: 'Trust in trust'
    });
    const segmentB = createSegment({
      id: 'segment-5b',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 19, end: 43 },
      text: 'and fairness is important'
    });
    const caseEntity = createCase({
      id: 'case-5',
      projectId: 'project-1',
      label: 'Participant 5',
      sourceIds: [source.id]
    });
    const trustApp = createCodeApplication({
      id: 'ca-10',
      projectId: 'project-1',
      segmentId: segmentA.id,
      codeId: 'code-trust',
      caseId: caseEntity.id,
      coderId: 'student1'
    });

    const textSearch = buildTextSearch({
      query: {},
      searchText: 'trust',
      matchMode: 'whole_word',
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [trustApp],
      cases: [caseEntity],
      memos: []
    });
    expect(textSearch.totalSegments).toBe(1);
    expect(textSearch.totalHits).toBe(2);
    expect(textSearch.hits[0]?.snippets[0]).toContain('Trust');

    const wordFrequency = buildWordFrequency({
      query: {},
      topN: 10,
      minLength: 4,
      excludeStopWords: true,
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [trustApp],
      cases: [caseEntity],
      memos: []
    });
    expect(wordFrequency.tokens[0]?.token).toBe('trust');
    expect(wordFrequency.tokens[0]?.count).toBe(2);
    expect(wordFrequency.uniqueTokenCount).toBeGreaterThan(1);
  });

  it('builds compound queries with all/any clause logic', () => {
    const source = createSource({
      id: 'source-6',
      projectId: 'project-1',
      kind: 'transcript',
      title: 'Interview 6',
      contentType: 'text/plain',
      contentText: 'Trust issue and fairness concern.'
    });
    const segmentA = createSegment({
      id: 'segment-6a',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 0, end: 11 },
      text: 'Trust issue'
    });
    const segmentB = createSegment({
      id: 'segment-6b',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 12, end: 29 },
      text: 'fairness concern'
    });
    const caseEntity = createCase({
      id: 'case-6',
      projectId: 'project-1',
      label: 'Participant 6',
      sourceIds: [source.id]
    });
    const trustApp = createCodeApplication({
      id: 'ca-11',
      projectId: 'project-1',
      segmentId: segmentA.id,
      codeId: 'code-trust',
      caseId: caseEntity.id,
      coderId: 'student1'
    });
    const fairnessApp = createCodeApplication({
      id: 'ca-12',
      projectId: 'project-1',
      segmentId: segmentB.id,
      codeId: 'code-fairness',
      caseId: caseEntity.id,
      coderId: 'student1'
    });
    const memo = createMemo({
      id: 'memo-6',
      projectId: 'project-1',
      targetType: 'segment',
      targetId: segmentB.id,
      title: 'Fairness memo'
    });

    const allQuery = buildCompoundQuery({
      scopeQuery: {},
      operator: 'all',
      clauses: [
        { field: 'case', operator: 'equals', value: caseEntity.id },
        { field: 'code', operator: 'equals', value: 'code-fairness' }
      ],
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [trustApp, fairnessApp],
      cases: [caseEntity],
      memos: [memo]
    });
    expect(allQuery.matchCount).toBe(1);
    expect(allQuery.items[0]?.segment.id).toBe(segmentB.id);

    const anyQuery = buildCompoundQuery({
      scopeQuery: {},
      operator: 'any',
      clauses: [
        { field: 'text', operator: 'contains', value: 'trust' },
        { field: 'memo', operator: 'present' }
      ],
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [trustApp, fairnessApp],
      cases: [caseEntity],
      memos: [memo]
    });
    expect(anyQuery.matchCount).toBe(2);
  });

  it('builds sentiment summaries and pattern autocode matches', () => {
    const source = createSource({
      id: 'source-7',
      projectId: 'project-1',
      kind: 'transcript',
      title: 'Interview 7',
      contentType: 'text/plain',
      contentText: 'The review felt fair and transparent. The delay was frustrating.'
    });
    const positiveSegment = createSegment({
      id: 'segment-7a',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 0, end: 37 },
      text: 'The review felt fair and transparent.'
    });
    const negativeSegment = createSegment({
      id: 'segment-7b',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 38, end: 66 },
      text: 'The delay was frustrating.'
    });

    const sentiment = buildSentimentAnalysis({
      query: {},
      sources: [source],
      segments: [positiveSegment, negativeSegment],
      applications: [],
      cases: [],
      memos: []
    });
    expect(sentiment.counts.positive).toBe(1);
    expect(sentiment.counts.negative).toBe(1);

    const autocode = buildPatternAutocode({
      query: {},
      patterns: ['fairness', 'delay'],
      expandSynonyms: true,
      matchMode: 'phrase',
      sources: [source],
      segments: [positiveSegment, negativeSegment],
      applications: [],
      cases: [],
      memos: []
    });
    expect(autocode.matchedCount).toBe(2);
    expect(autocode.expandedPatterns).toContain('fair');
    expect(autocode.expandedPatterns).toContain('slow');
  });
});
