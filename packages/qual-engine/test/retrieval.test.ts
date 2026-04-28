import { describe, expect, it } from 'vitest';
import {
  createCase,
  createCodeApplication,
  createMemo,
  createSegment,
  createSource
} from '@mu/core-domain';
import { buildCodeByCaseView, buildCodingComparison, buildCompoundQuery, buildConceptMap, buildFrameworkMatrix, buildInterRaterSummary, buildMapVisualization, buildMatrixCoding, buildTextSearch, buildWordFrequency, retrieveEvidence } from '../src/index';
import { buildPatternAutocode, buildSentimentAnalysis } from '../src/index';
import { buildQualitativeQueryReport } from '../src/index';

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
      codingScope: 'coded_only',
      minHitCount: 2,
      snippetLimit: 1,
      maxRows: 1,
      sortBy: 'hits_desc',
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [trustApp],
      cases: [caseEntity],
      memos: []
    });
    expect(textSearch.totalSegments).toBe(1);
    expect(textSearch.returnedSegments).toBe(1);
    expect(textSearch.totalHits).toBe(2);
    expect(textSearch.codingScope).toBe('coded_only');
    expect(textSearch.minHitCount).toBe(2);
    expect(textSearch.hits[0]?.snippets).toHaveLength(1);
    expect(textSearch.hits[0]?.snippets[0]).toContain('Trust');

    const uncodedOnlySearch = buildTextSearch({
      query: {},
      searchText: 'trust',
      matchMode: 'whole_word',
      codingScope: 'uncoded_only',
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [trustApp],
      cases: [caseEntity],
      memos: []
    });
    expect(uncodedOnlySearch.totalSegments).toBe(0);
    expect(uncodedOnlySearch.totalHits).toBe(0);

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
    expect(anyQuery.returnedCount).toBe(2);

    const polishedQuery = buildCompoundQuery({
      scopeQuery: {},
      operator: 'all',
      caseSensitive: true,
      maxRows: 1,
      clauses: [
        { field: 'text', operator: 'contains', value: 'Trust', enabled: true },
        { field: 'code', operator: 'equals', value: 'code-fairness', negate: true, enabled: true },
        { field: 'memo', operator: 'present', enabled: false }
      ],
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [trustApp, fairnessApp],
      cases: [caseEntity],
      memos: [memo]
    });
    expect(polishedQuery.matchCount).toBe(1);
    expect(polishedQuery.returnedCount).toBe(1);
    expect(polishedQuery.scopedCount).toBe(2);
    expect(polishedQuery.clauseCount).toBe(2);
    expect(polishedQuery.caseSensitive).toBe(true);
    expect(polishedQuery.items[0]?.segment.id).toBe(segmentA.id);
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

  it('supports wildcard, regex, fuzzy, and linguistic text-search modes', () => {
    const source = createSource({
      id: 'source-8',
      projectId: 'project-1',
      kind: 'transcript',
      title: 'Interview 8',
      contentType: 'text/plain',
      contentText: 'Trusted reviewers discussed fairness. Trust and equity improved. Trst concerns remain.'
    });
    const segmentA = createSegment({
      id: 'segment-8a',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 0, end: 36 },
      text: 'Trusted reviewers discussed fairness.'
    });
    const segmentB = createSegment({
      id: 'segment-8b',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 37, end: 67 },
      text: 'Trust and equity improved.'
    });
    const segmentC = createSegment({
      id: 'segment-8c',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 68, end: 89 },
      text: 'Trst concerns remain.'
    });

    const wildcard = buildTextSearch({
      query: {},
      searchText: 'trust*',
      matchMode: 'wildcard',
      sources: [source],
      segments: [segmentA, segmentB, segmentC],
      applications: [],
      cases: [],
      memos: []
    });
    expect(wildcard.totalSegments).toBe(2);

    const regex = buildTextSearch({
      query: {},
      searchText: 'fair(ness)?',
      matchMode: 'regex',
      sources: [source],
      segments: [segmentA, segmentB, segmentC],
      applications: [],
      cases: [],
      memos: []
    });
    expect(regex.totalSegments).toBe(1);
    expect(regex.hits[0]?.segmentId).toBe(segmentA.id);

    const fuzzy = buildTextSearch({
      query: {},
      searchText: 'trst',
      matchMode: 'fuzzy',
      fuzzyDistance: 1,
      sources: [source],
      segments: [segmentA, segmentB, segmentC],
      applications: [],
      cases: [],
      memos: []
    });
    expect(fuzzy.totalSegments).toBeGreaterThanOrEqual(2);

    const wholeWordNoLinguistic = buildTextSearch({
      query: {},
      searchText: 'trust',
      matchMode: 'whole_word',
      linguisticMode: 'none',
      sources: [source],
      segments: [segmentA, segmentB, segmentC],
      applications: [],
      cases: [],
      memos: []
    });
    const wholeWordStem = buildTextSearch({
      query: {},
      searchText: 'trust',
      matchMode: 'whole_word',
      linguisticMode: 'stem',
      sources: [source],
      segments: [segmentA, segmentB, segmentC],
      applications: [],
      cases: [],
      memos: []
    });
    expect(wholeWordStem.totalSegments).toBeGreaterThan(wholeWordNoLinguistic.totalSegments);
  });

  it('supports proximity/fuzzy compound clauses and query-report profile options', () => {
    const sourceA = createSource({
      id: 'source-9a',
      projectId: 'project-1',
      kind: 'transcript',
      title: 'Interview 9A',
      contentType: 'text/plain',
      contentText: 'Trust in fair process today.'
    });
    const sourceB = createSource({
      id: 'source-9b',
      projectId: 'project-1',
      kind: 'transcript',
      title: 'Interview 9B',
      contentType: 'text/plain',
      contentText: 'Trust appears with many unrelated tokens before fair outcome eventually.'
    });
    const segmentA = createSegment({
      id: 'segment-9a',
      projectId: 'project-1',
      sourceId: sourceA.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 0, end: 28 },
      text: 'Trust in fair process today.'
    });
    const segmentB = createSegment({
      id: 'segment-9b',
      projectId: 'project-1',
      sourceId: sourceB.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 0, end: 72 },
      text: 'Trust appears with many unrelated tokens before fair outcome eventually.'
    });
    const caseA = createCase({
      id: 'case-9a',
      projectId: 'project-1',
      label: 'Participant 9A',
      sourceIds: [sourceA.id]
    });
    const caseB = createCase({
      id: 'case-9b',
      projectId: 'project-1',
      label: 'Participant 9B',
      sourceIds: [sourceB.id]
    });
    const appA = createCodeApplication({
      id: 'ca-9a',
      projectId: 'project-1',
      segmentId: segmentA.id,
      codeId: 'code-trust',
      caseId: caseA.id,
      coderId: 'student1'
    });
    const appB = createCodeApplication({
      id: 'ca-9b',
      projectId: 'project-1',
      segmentId: segmentB.id,
      codeId: 'code-fairness',
      caseId: caseB.id,
      coderId: 'student1'
    });
    const memoA = createMemo({
      id: 'memo-9a',
      projectId: 'project-1',
      targetType: 'segment',
      targetId: segmentA.id,
      title: 'Near note'
    });
    const memoB = createMemo({
      id: 'memo-9b',
      projectId: 'project-1',
      targetType: 'segment',
      targetId: segmentB.id,
      title: 'Far note'
    });
    const memoB2 = createMemo({
      id: 'memo-9c',
      projectId: 'project-1',
      targetType: 'segment',
      targetId: segmentB.id,
      title: 'Additional far note'
    });

    const compound = buildCompoundQuery({
      scopeQuery: {},
      operator: 'all',
      clauses: [
        { field: 'text', operator: 'near', value: 'trust|fair', proximityWithin: 2, proximityOrdered: true },
        { field: 'text', operator: 'fuzzy', value: 'trst', fuzzyDistance: 1 }
      ],
      sources: [sourceA, sourceB],
      segments: [segmentA, segmentB],
      applications: [appA, appB],
      cases: [caseA, caseB],
      memos: [memoA, memoB, memoB2]
    });
    expect(compound.matchCount).toBe(1);
    expect(compound.items[0]?.segment.id).toBe(segmentA.id);

    const report = buildQualitativeQueryReport({
      query: {},
      options: {
        topSources: 1,
        topCases: 1,
        topCodes: 1,
        excerptLimit: 1,
        includeSourceCoverage: true,
        includeCaseCoverage: false,
        includeExcerptRows: true,
        sortBy: 'memo_count'
      },
      sources: [sourceA, sourceB],
      segments: [segmentA, segmentB],
      applications: [appA, appB],
      cases: [caseA, caseB],
      memos: [memoA, memoB, memoB2],
      codes: [
        { id: 'code-trust', name: 'Trust' },
        { id: 'code-fairness', name: 'Fairness' }
      ]
    });
    expect(report.options.sortBy).toBe('memo_count');
    expect(report.sources).toHaveLength(1);
    expect(report.cases).toHaveLength(0);
    expect(report.excerpts).toHaveLength(1);
    expect(report.excerpts[0]?.segmentId).toBe(segmentB.id);
  });

  it('supports map/concept option filters for visualization outputs', () => {
    const source = createSource({
      id: 'source-viz-1',
      projectId: 'project-1',
      kind: 'transcript',
      title: 'Visualization interview',
      contentType: 'text/plain',
      contentText: 'Trust concern in campus A and campus B.'
    });
    const segmentA = createSegment({
      id: 'segment-viz-a',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 0, end: 22 },
      text: 'Trust concern campus A'
    });
    const segmentB = createSegment({
      id: 'segment-viz-b',
      projectId: 'project-1',
      sourceId: source.id,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: 23, end: 46 },
      text: 'Trust concern campus B'
    });
    const caseA = createCase({
      id: 'case-viz-a',
      projectId: 'project-1',
      label: 'Participant A',
      sourceIds: [source.id]
    });
    const caseB = createCase({
      id: 'case-viz-b',
      projectId: 'project-1',
      label: 'Participant B',
      sourceIds: [source.id]
    });
    const appA = createCodeApplication({
      id: 'ca-viz-a',
      projectId: 'project-1',
      segmentId: segmentA.id,
      codeId: 'code-trust',
      caseId: caseA.id,
      coderId: 'student1'
    });
    const appB = createCodeApplication({
      id: 'ca-viz-b',
      projectId: 'project-1',
      segmentId: segmentB.id,
      codeId: 'code-trust',
      caseId: caseB.id,
      coderId: 'student1'
    });

    const map = buildMapVisualization({
      query: {},
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [appA, appB],
      cases: [caseA, caseB],
      memos: [],
      attributes: [
        { id: 'attr-viz-a1', projectId: 'project-1', targetType: 'case', targetId: caseA.id, name: 'campus', value: 'North', createdAt: '', updatedAt: '' },
        { id: 'attr-viz-a2', projectId: 'project-1', targetType: 'case', targetId: caseA.id, name: 'latitude', value: 39.1, createdAt: '', updatedAt: '' },
        { id: 'attr-viz-a3', projectId: 'project-1', targetType: 'case', targetId: caseA.id, name: 'longitude', value: -84.5, createdAt: '', updatedAt: '' },
        { id: 'attr-viz-b1', projectId: 'project-1', targetType: 'case', targetId: caseB.id, name: 'campus', value: 'South', createdAt: '', updatedAt: '' },
        { id: 'attr-viz-b2', projectId: 'project-1', targetType: 'case', targetId: caseB.id, name: 'latitude', value: 38.6, createdAt: '', updatedAt: '' },
        { id: 'attr-viz-b3', projectId: 'project-1', targetType: 'case', targetId: caseB.id, name: 'longitude', value: -84.7, createdAt: '', updatedAt: '' }
      ],
      options: {
        metric: 'case_count',
        normalization: 'within_scope_pct',
        minCount: 1,
        maxPoints: 5
      }
    });
    expect(map.metric).toBe('case_count');
    expect(map.normalization).toBe('within_scope_pct');
    expect(map.pointsReturned).toBeLessThanOrEqual(5);
    expect(map.points.some((point) => point.latitude !== null && point.longitude !== null)).toBe(true);

    const concept = buildConceptMap({
      query: {},
      sources: [source],
      segments: [segmentA, segmentB],
      applications: [
        appA,
        appB,
        createCodeApplication({
          id: 'ca-viz-c',
          projectId: 'project-1',
          segmentId: segmentA.id,
          codeId: 'code-fairness',
          caseId: caseA.id,
          coderId: 'student1'
        })
      ],
      cases: [caseA, caseB],
      memos: [],
      codes: [
        { id: 'code-trust', name: 'Trust', colorToken: 'blue' },
        { id: 'code-fairness', name: 'Fairness', colorToken: 'green' }
      ],
      relationships: [
        { leftTargetType: 'code', leftTargetId: 'code-trust', rightTargetType: 'code', rightTargetId: 'code-fairness', relationshipType: 'see_also' }
      ],
      options: {
        includeCooccurrenceLinks: true,
        includeRelationshipLinks: true,
        minLinkWeight: 1,
        maxLinks: 20,
        nodeSizeMode: 'weighted_degree'
      }
    });
    expect(concept.options.nodeSizeMode).toBe('weighted_degree');
    expect(concept.links.length).toBeGreaterThan(0);
    expect(concept.nodes.some((node) => node.weightedDegree > 0)).toBe(true);
  });
});
