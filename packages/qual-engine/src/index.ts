import type { Attribute, CaseEntity, Code, CodeApplication, Memo, Relationship, Segment, Source } from '@mu/core-domain';

export type RetrievalMatch = {
  segment: Segment;
  applications: CodeApplication[];
};

export type EvidenceMatch = {
  segment: Segment;
  source: Source | null;
  cases: CaseEntity[];
  applications: CodeApplication[];
  memos: Memo[];
};

export type EvidenceQuery = {
  sourceId?: string;
  sourceKind?: Source['kind'];
  segmentKind?: Segment['kind'];
  codeId?: string;
  coCodeId?: string;
  caseId?: string;
  coderId?: string;
  searchText?: string;
  memoOnly?: boolean;
};

export type MatrixCodingCell = {
  codeId: string;
  caseId: string;
  count: number;
  segmentIds: string[];
};

export type MatrixCodingResult = {
  rows: Array<{ codeId: string; codeName: string; count: number }>;
  columns: Array<{ caseId: string; caseLabel: string; count: number }>;
  cells: MatrixCodingCell[];
  totalCount: number;
};

export type CodeByCaseView = {
  cases: Array<{
    caseId: string;
    caseLabel: string;
    totalCount: number;
    codes: Array<{
      codeId: string;
      codeName: string;
      count: number;
      excerpts: Array<{
        segmentId: string;
        sourceId: string;
        sourceTitle: string | null;
        text: string;
        memoCount: number;
      }>;
    }>;
  }>;
  totalCount: number;
};

export type CodeCooccurrencePair = {
  primaryCodeId: string;
  primaryCodeName: string;
  secondaryCodeId: string;
  secondaryCodeName: string;
  segmentCount: number;
  sourceCount: number;
  caseCount: number;
  segmentIds: string[];
};

export type CodeCooccurrenceResult = {
  pairs: CodeCooccurrencePair[];
  totalSegments: number;
};

export type CodeCodeMatrixCell = {
  rowCodeId: string;
  columnCodeId: string;
  count: number;
  segmentIds: string[];
};

export type CodeCodeMatrixResult = {
  rows: Array<{ codeId: string; codeName: string; count: number }>;
  columns: Array<{ codeId: string; codeName: string; count: number }>;
  cells: CodeCodeMatrixCell[];
  totalSegments: number;
};

export type QualitativeQueryReport = {
  summary: {
    matchCount: number;
    sourceCount: number;
    caseCount: number;
    memoCount: number;
  };
  sources: Array<{
    sourceId: string;
    sourceTitle: string | null;
    matchCount: number;
    caseCount: number;
    memoCount: number;
    topCodes: Array<{ codeId: string; codeName: string; count: number }>;
  }>;
  cases: Array<{
    caseId: string;
    caseLabel: string;
    matchCount: number;
    sourceCount: number;
    memoCount: number;
    topCodes: Array<{ codeId: string; codeName: string; count: number }>;
  }>;
};

export type FrameworkMatrixCell = {
  caseId: string;
  codeId: string;
  count: number;
  memoCount: number;
  summary: string;
  segmentIds: string[];
};

export type FrameworkMatrixResult = {
  rows: Array<{ caseId: string; caseLabel: string; count: number }>;
  columns: Array<{ codeId: string; codeName: string; count: number }>;
  cells: FrameworkMatrixCell[];
  totalCount: number;
};

export type CodingComparisonResult = {
  codeId: string;
  codeName: string;
  coderA: string;
  coderB: string;
  universeSegmentCount: number;
  agreementCount: number;
  disagreementCount: number;
  percentAgreement: number | null;
  cohensKappa: number | null;
  bothAppliedCount: number;
  neitherAppliedCount: number;
  coderAOnlyCount: number;
  coderBOnlyCount: number;
  disagreements: Array<{
    segmentId: string;
    sourceId: string;
    sourceTitle: string | null;
    text: string;
    coderAApplied: boolean;
    coderBApplied: boolean;
  }>;
};

export type InterRaterSummaryResult = {
  coderA: string;
  coderB: string;
  rows: Array<{
    codeId: string;
    codeName: string;
    universeSegmentCount: number;
    agreementCount: number;
    disagreementCount: number;
    percentAgreement: number | null;
    cohensKappa: number | null;
  }>;
  averageAgreement: number | null;
  averageKappa: number | null;
};

export type TextSearchMatchMode = 'contains' | 'phrase' | 'whole_word';

export type TextSearchHit = {
  segmentId: string;
  sourceId: string;
  sourceTitle: string | null;
  caseIds: string[];
  codeIds: string[];
  coderIds: string[];
  hitCount: number;
  snippets: string[];
};

export type TextSearchResult = {
  searchText: string;
  matchMode: TextSearchMatchMode;
  caseSensitive: boolean;
  contextWindow: number;
  totalSegments: number;
  totalHits: number;
  hits: TextSearchHit[];
};

export type WordFrequencyToken = {
  token: string;
  count: number;
  sourceCount: number;
  segmentCount: number;
};

export type WordFrequencyResult = {
  totalTokens: number;
  uniqueTokenCount: number;
  excludedStopWordCount: number;
  tokens: WordFrequencyToken[];
};

export type WordCloudItem = {
  text: string;
  value: number;
  sourceCount: number;
  segmentCount: number;
};

export type WordCloudResult = {
  totalTokens: number;
  maxValue: number;
  items: WordCloudItem[];
};

export type MapVisualizationPoint = {
  label: string;
  field: string;
  count: number;
  caseCount: number;
  segmentCount: number;
  latitude: number | null;
  longitude: number | null;
};

export type MapVisualizationResult = {
  locationField: string | null;
  coordinateMode: boolean;
  points: MapVisualizationPoint[];
};

export type CodeHierarchyNode = {
  codeId: string;
  codeName: string;
  parentCodeId: string | null;
  depth: number;
  directCount: number;
  totalCount: number;
  childCount: number;
  children: CodeHierarchyNode[];
};

export type CodeHierarchyResult = {
  totalCodes: number;
  totalApplications: number;
  roots: CodeHierarchyNode[];
};

export type ConceptMapNode = {
  id: string;
  label: string;
  size: number;
  group: string;
};

export type ConceptMapLink = {
  sourceId: string;
  targetId: string;
  weight: number;
  kind: 'cooccurrence' | 'relationship';
};

export type ConceptMapResult = {
  nodes: ConceptMapNode[];
  links: ConceptMapLink[];
};

export type CodeCluster = {
  id: string;
  label: string;
  codeIds: string[];
  totalWeight: number;
};

export type CodeClusterResult = {
  clusters: CodeCluster[];
};

export type CompoundQueryClauseField =
  | 'text'
  | 'code'
  | 'case'
  | 'source'
  | 'coder'
  | 'memo'
  | 'source_kind'
  | 'segment_kind';

export type CompoundQueryClauseOperator =
  | 'contains'
  | 'equals'
  | 'whole_word'
  | 'phrase'
  | 'present';

export type CompoundQueryClause = {
  field: CompoundQueryClauseField;
  operator: CompoundQueryClauseOperator;
  value?: string;
};

export type CompoundQueryResult = {
  operator: 'all' | 'any' | 'none';
  clauseCount: number;
  matchCount: number;
  sourceCount: number;
  caseCount: number;
  items: EvidenceMatch[];
};

export type SentimentLabel = 'positive' | 'negative' | 'mixed' | 'neutral';

export type SentimentHit = {
  segmentId: string;
  sourceId: string;
  sourceTitle: string | null;
  label: SentimentLabel;
  score: number;
  positiveTerms: string[];
  negativeTerms: string[];
  text: string;
};

export type SentimentAnalysisResult = {
  totalSegments: number;
  averageScore: number | null;
  counts: Record<SentimentLabel, number>;
  hits: SentimentHit[];
};

export type PatternAutocodeMatchMode = 'contains' | 'phrase' | 'whole_word';

export type PatternAutocodeResult = {
  patterns: string[];
  expandedPatterns: string[];
  matchMode: PatternAutocodeMatchMode;
  scopeCount: number;
  matchedCount: number;
  hits: Array<{
    segmentId: string;
    sourceId: string;
    sourceTitle: string | null;
    pattern: string;
    text: string;
  }>;
};

export function findSegmentsByCode(
  code: Code,
  segments: Segment[],
  applications: CodeApplication[]
): RetrievalMatch[] {
  const matches = applications.filter((item) => item.codeId === code.id);
  const segmentMap = new Map(segments.map((segment) => [segment.id, segment]));

  return matches.flatMap((application) => {
    const segment = segmentMap.get(application.segmentId);
    if (!segment) return [];

    return [{
      segment,
      applications: matches.filter((item) => item.segmentId === segment.id)
    }];
  });
}

export function retrieveEvidence(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
}): EvidenceMatch[] {
  const { query, sources, segments, applications, cases, memos } = params;
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const caseMap = new Map(cases.map((caseEntity) => [caseEntity.id, caseEntity]));
  const caseIdsBySourceId = new Map<string, CaseEntity[]>();

  for (const caseEntity of cases) {
    for (const sourceId of caseEntity.sourceIds) {
      const items = caseIdsBySourceId.get(sourceId) ?? [];
      items.push(caseEntity);
      caseIdsBySourceId.set(sourceId, items);
    }
  }

  const filteredApplications = applications.filter((application) => {
    if (query.codeId && application.codeId !== query.codeId) return false;
    if (query.caseId && application.caseId !== query.caseId) return false;
    if (query.coderId && application.coderId !== query.coderId) return false;
    return true;
  });

  const applicationsBySegmentId = new Map<string, CodeApplication[]>();
  for (const application of filteredApplications) {
    const items = applicationsBySegmentId.get(application.segmentId) ?? [];
    items.push(application);
    applicationsBySegmentId.set(application.segmentId, items);
  }

  const normalizedSearch = query.searchText?.trim().toLowerCase() ?? '';

  return segments
    .filter((segment) => {
      if (query.sourceId && segment.sourceId !== query.sourceId) return false;
      if (query.segmentKind && segment.kind !== query.segmentKind) return false;
      if (query.sourceKind && sourceMap.get(segment.sourceId)?.kind !== query.sourceKind) return false;
      if (query.codeId || query.caseId || query.coderId) {
        if (!applicationsBySegmentId.has(segment.id)) return false;
      }
      if (query.coCodeId) {
        const coCoded = applications.some((application) => application.segmentId === segment.id && application.codeId === query.coCodeId);
        if (!coCoded) return false;
      }
      if (normalizedSearch && !segment.text.toLowerCase().includes(normalizedSearch)) return false;
      if (query.memoOnly) {
        const hasMemo = memos.some((memo) =>
          (memo.targetType === 'segment' && memo.targetId === segment.id)
          || (memo.targetType === 'source' && memo.targetId === segment.sourceId)
        );
        if (!hasMemo) return false;
      }
      return true;
    })
    .map((segment) => {
      const segmentApplications = applicationsBySegmentId.get(segment.id) ?? [];
      const relatedCaseIds = new Set<string>();

      for (const application of segmentApplications) {
        if (application.caseId) relatedCaseIds.add(application.caseId);
      }

      for (const caseEntity of caseIdsBySourceId.get(segment.sourceId) ?? []) {
        relatedCaseIds.add(caseEntity.id);
      }

      return {
        segment,
        source: sourceMap.get(segment.sourceId) ?? null,
        cases: [...relatedCaseIds]
          .map((caseId) => caseMap.get(caseId))
          .filter((caseEntity): caseEntity is CaseEntity => Boolean(caseEntity)),
        applications: segmentApplications,
        memos: memos.filter((memo) =>
          (memo.targetType === 'segment' && memo.targetId === segment.id)
          || (memo.targetType === 'source' && memo.targetId === segment.sourceId)
        )
      };
    })
    .sort((left, right) => left.segment.createdAt.localeCompare(right.segment.createdAt));
}

function buildFilteredSegmentApplications(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  memos: Memo[];
}): Array<{ segment: Segment; source: Source | null; applications: CodeApplication[] }> {
  const { query, sources, segments, applications, memos } = params;
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const filteredApplications = applications.filter((application) => {
    if (query.caseId && application.caseId !== query.caseId) return false;
    if (query.coderId && application.coderId !== query.coderId) return false;
    return true;
  });
  const applicationsBySegmentId = new Map<string, CodeApplication[]>();
  for (const application of filteredApplications) {
    const items = applicationsBySegmentId.get(application.segmentId) ?? [];
    items.push(application);
    applicationsBySegmentId.set(application.segmentId, items);
  }
  const normalizedSearch = query.searchText?.trim().toLowerCase() ?? '';

  return segments
    .filter((segment) => {
      if (query.sourceId && segment.sourceId !== query.sourceId) return false;
      if (query.segmentKind && segment.kind !== query.segmentKind) return false;
      if (query.sourceKind && sourceMap.get(segment.sourceId)?.kind !== query.sourceKind) return false;
      const segmentApplications = applicationsBySegmentId.get(segment.id) ?? [];
      if ((query.caseId || query.coderId || query.codeId || query.coCodeId) && segmentApplications.length === 0) return false;
      if (query.codeId && !segmentApplications.some((application) => application.codeId === query.codeId)) return false;
      if (query.coCodeId && !segmentApplications.some((application) => application.codeId === query.coCodeId)) return false;
      if (normalizedSearch && !segment.text.toLowerCase().includes(normalizedSearch)) return false;
      if (query.memoOnly) {
        const hasMemo = memos.some((memo) =>
          (memo.targetType === 'segment' && memo.targetId === segment.id)
          || (memo.targetType === 'source' && memo.targetId === segment.sourceId)
        );
        if (!hasMemo) return false;
      }
      return true;
    })
    .map((segment) => ({
      segment,
      source: sourceMap.get(segment.sourceId) ?? null,
      applications: applicationsBySegmentId.get(segment.id) ?? []
    }));
}

const DEFAULT_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by', 'for',
  'from', 'had', 'has', 'have', 'he', 'her', 'hers', 'him', 'his', 'i', 'if', 'in',
  'into', 'is', 'it', 'its', 'itself', 'me', 'my', 'of', 'on', 'or', 'our', 'ours',
  'she', 'so', 'than', 'that', 'the', 'their', 'theirs', 'them', 'then', 'there',
  'these', 'they', 'this', 'those', 'to', 'too', 'us', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'who', 'why', 'with', 'you', 'your', 'yours'
]);

const POSITIVE_SENTIMENT_TERMS = new Set([
  'admire', 'appreciate', 'benefit', 'clear', 'confident', 'consistent', 'encouraging', 'equitable',
  'fair', 'fairness', 'good', 'helpful', 'improve', 'improved', 'inclusive', 'positive', 'reassuring',
  'respect', 'responsive', 'safe', 'satisfied', 'smooth', 'strong', 'support', 'supported', 'supportive',
  'timely', 'transparent', 'trust', 'trusted', 'trustworthy', 'useful', 'welcome'
]);

const NEGATIVE_SENTIMENT_TERMS = new Set([
  'angry', 'anxious', 'arbitrary', 'bad', 'bias', 'biased', 'confusing', 'concern', 'concerns', 'delay',
  'difficult', 'disappointed', 'disappointing', 'discouraging', 'distrust', 'error', 'errors', 'frustrated',
  'frustrating', 'harm', 'hostile', 'inconsistent', 'inequitable', 'issue', 'issues', 'negative', 'opaque',
  'problem', 'problems', 'risk', 'slow', 'stress', 'stressed', 'uncertain', 'unclear', 'unfair', 'unsafe',
  'unsupported', 'worry', 'worried'
]);

const AUTOCODE_SYNONYMS = new Map<string, string[]>([
  ['trust', ['trusted', 'trustworthy', 'confidence', 'confident']],
  ['fairness', ['fair', 'equitable', 'equity', 'justice']],
  ['bias', ['biased', 'prejudice', 'discrimination']],
  ['support', ['supported', 'supportive', 'help', 'helpful']],
  ['delay', ['delays', 'slow', 'slowly', 'waiting']],
  ['anxiety', ['anxious', 'stress', 'stressed', 'worry', 'worried']],
  ['transparency', ['transparent', 'clarity', 'clear', 'openness']]
]);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeForSearch(value: string, caseSensitive: boolean): string {
  return caseSensitive ? value : value.toLowerCase();
}

function findTextRanges(params: {
  text: string;
  searchText: string;
  matchMode: TextSearchMatchMode;
  caseSensitive?: boolean;
}): Array<{ start: number; end: number }> {
  const { text, searchText, matchMode } = params;
  const caseSensitive = params.caseSensitive ?? false;
  const normalizedNeedle = normalizeForSearch(searchText.trim(), caseSensitive);
  if (!normalizedNeedle) return [];

  const haystack = normalizeForSearch(text, caseSensitive);
  if (!haystack) return [];

  if (matchMode === 'whole_word') {
    const regex = new RegExp(`\\b${escapeRegex(normalizedNeedle)}\\b`, 'g');
    return [...haystack.matchAll(regex)].map((match) => ({
      start: match.index ?? 0,
      end: (match.index ?? 0) + normalizedNeedle.length
    }));
  }

  const ranges: Array<{ start: number; end: number }> = [];
  let searchFrom = 0;
  while (searchFrom < haystack.length) {
    const index = haystack.indexOf(normalizedNeedle, searchFrom);
    if (index === -1) break;
    ranges.push({ start: index, end: index + normalizedNeedle.length });
    searchFrom = index + Math.max(1, normalizedNeedle.length);
  }
  return ranges;
}

function buildSnippet(text: string, start: number, end: number, contextWindow: number): string {
  const snippetStart = Math.max(0, start - contextWindow);
  const snippetEnd = Math.min(text.length, end + contextWindow);
  const prefix = snippetStart > 0 ? '...' : '';
  const suffix = snippetEnd < text.length ? '...' : '';
  return `${prefix}${text.slice(snippetStart, snippetEnd).trim()}${suffix}`;
}

function tokenMatchesClause(value: string, operator: CompoundQueryClauseOperator, target: string): boolean {
  const normalizedValue = value.trim().toLowerCase();
  const normalizedTarget = target.trim().toLowerCase();
  if (operator === 'present') return normalizedTarget.length > 0;
  if (!normalizedValue) return false;
  if (operator === 'equals') return normalizedTarget === normalizedValue;
  if (operator === 'whole_word') return new RegExp(`\\b${escapeRegex(normalizedValue)}\\b`, 'i').test(target);
  return normalizedTarget.includes(normalizedValue);
}

function matchCompoundClause(match: EvidenceMatch, clause: CompoundQueryClause): boolean {
  const value = String(clause.value ?? '').trim();
  switch (clause.field) {
    case 'text':
      if (clause.operator === 'phrase') {
        return match.segment.text.toLowerCase().includes(value.toLowerCase());
      }
      return tokenMatchesClause(value, clause.operator, match.segment.text);
    case 'code':
      return match.applications.some((application) => tokenMatchesClause(value, clause.operator, application.codeId));
    case 'case':
      return match.cases.some((caseEntity) =>
        tokenMatchesClause(value, clause.operator, caseEntity.id)
        || tokenMatchesClause(value, clause.operator, caseEntity.label)
      );
    case 'source':
      return tokenMatchesClause(value, clause.operator, match.segment.sourceId)
        || tokenMatchesClause(value, clause.operator, match.source?.title ?? '');
    case 'coder':
      return match.applications.some((application) => tokenMatchesClause(value, clause.operator, application.coderId));
    case 'memo':
      if (clause.operator === 'present') return match.memos.length > 0;
      return match.memos.some((memo) =>
        tokenMatchesClause(value, clause.operator, memo.title)
        || tokenMatchesClause(value, clause.operator, memo.body)
      );
    case 'source_kind':
      return tokenMatchesClause(value, clause.operator, match.source?.kind ?? '');
    case 'segment_kind':
      return tokenMatchesClause(value, clause.operator, match.segment.kind);
    default:
      return false;
  }
}

function tokenizeSentimentTerms(text: string): string[] {
  return text.toLowerCase().match(/[a-z][a-z'-]+/g) ?? [];
}

function expandAutocodePatterns(patterns: string[], expandSynonyms = false): string[] {
  const normalized = patterns
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (!expandSynonyms) {
    return [...new Set(normalized)];
  }
  const expanded = new Set<string>(normalized);
  for (const pattern of normalized) {
    for (const synonym of AUTOCODE_SYNONYMS.get(pattern) ?? []) {
      expanded.add(synonym.toLowerCase());
    }
  }
  return [...expanded];
}

function matchAutocodePattern(text: string, pattern: string, matchMode: PatternAutocodeMatchMode): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern) return false;
  if (matchMode === 'whole_word') {
    return new RegExp(`\\b${escapeRegex(normalizedPattern)}\\b`, 'i').test(text);
  }
  return normalizedText.includes(normalizedPattern);
}

export function buildTextSearch(params: {
  query: EvidenceQuery;
  searchText: string;
  matchMode?: TextSearchMatchMode;
  caseSensitive?: boolean;
  contextWindow?: number;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
}): TextSearchResult {
  const searchText = params.searchText.trim();
  if (!searchText) {
    throw new Error('searchText is required for text search.');
  }
  const matchMode = params.matchMode ?? 'contains';
  const caseSensitive = params.caseSensitive ?? false;
  const contextWindow = Math.max(10, Math.min(200, params.contextWindow ?? 40));
  const scopedMatches = retrieveEvidence({
    query: {
      ...params.query,
      searchText: undefined
    },
    sources: params.sources,
    segments: params.segments,
    applications: params.applications,
    cases: params.cases,
    memos: params.memos
  });

  const hits = scopedMatches.flatMap((match) => {
    const ranges = findTextRanges({
      text: match.segment.text,
      searchText,
      matchMode,
      caseSensitive
    });
    if (ranges.length === 0) return [];
    return [{
      segmentId: match.segment.id,
      sourceId: match.segment.sourceId,
      sourceTitle: match.source?.title ?? null,
      caseIds: [...new Set(match.cases.map((caseEntity) => caseEntity.id))],
      codeIds: [...new Set(match.applications.map((application) => application.codeId))],
      coderIds: [...new Set(match.applications.map((application) => application.coderId))],
      hitCount: ranges.length,
      snippets: ranges.slice(0, 5).map((range) => buildSnippet(match.segment.text, range.start, range.end, contextWindow))
    }];
  });

  return {
    searchText,
    matchMode,
    caseSensitive,
    contextWindow,
    totalSegments: hits.length,
    totalHits: hits.reduce((total, hit) => total + hit.hitCount, 0),
    hits: hits.sort((left, right) => right.hitCount - left.hitCount || left.sourceId.localeCompare(right.sourceId))
  };
}

export function buildWordFrequency(params: {
  query: EvidenceQuery;
  topN?: number;
  minLength?: number;
  excludeStopWords?: boolean;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
}): WordFrequencyResult {
  const topN = Math.max(5, Math.min(200, params.topN ?? 50));
  const minLength = Math.max(2, Math.min(20, params.minLength ?? 4));
  const excludeStopWords = params.excludeStopWords ?? true;
  const scopedMatches = retrieveEvidence(params);
  const tokenMap = new Map<string, { count: number; sourceIds: Set<string>; segmentIds: Set<string> }>();
  let totalTokens = 0;
  let excludedStopWordCount = 0;

  for (const match of scopedMatches) {
    const tokens = match.segment.text.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? [];
    for (const token of tokens) {
      if (token.length < minLength) continue;
      if (excludeStopWords && DEFAULT_STOP_WORDS.has(token)) {
        excludedStopWordCount += 1;
        continue;
    }
    totalTokens += 1;
      const entry = tokenMap.get(token) ?? {
        count: 0,
        sourceIds: new Set<string>(),
        segmentIds: new Set<string>()
      };
      entry.count += 1;
      entry.sourceIds.add(match.segment.sourceId);
      entry.segmentIds.add(match.segment.id);
      tokenMap.set(token, entry);
    }
  }

  return {
    totalTokens,
    uniqueTokenCount: tokenMap.size,
    excludedStopWordCount,
    tokens: [...tokenMap.entries()]
      .map(([token, entry]) => ({
        token,
        count: entry.count,
        sourceCount: entry.sourceIds.size,
        segmentCount: entry.segmentIds.size
      }))
      .sort((left, right) => right.count - left.count || left.token.localeCompare(right.token))
      .slice(0, topN)
    };
  }

export function buildWordCloud(params: {
  query: EvidenceQuery;
  topN?: number;
  minLength?: number;
  excludeStopWords?: boolean;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
}): WordCloudResult {
  const frequency = buildWordFrequency(params);
  return {
    totalTokens: frequency.totalTokens,
    maxValue: Math.max(0, ...frequency.tokens.map((token) => token.count)),
    items: frequency.tokens.map((token) => ({
      text: token.token,
      value: token.count,
      sourceCount: token.sourceCount,
      segmentCount: token.segmentCount
    }))
  };
}

function isLocationField(name: string): boolean {
  return /(^|_)(location|city|state|province|country|region|campus|site|county|district)($|_)/i.test(name);
}

function isLatitudeField(name: string): boolean {
  return /(^|_)(lat|latitude)($|_)/i.test(name);
}

function isLongitudeField(name: string): boolean {
  return /(^|_)(lon|lng|longitude)($|_)/i.test(name);
}

function parseCoordinateValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildMapVisualization(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
  attributes: Attribute[];
}): MapVisualizationResult {
  const matches = retrieveEvidence(params);
  const caseIds = new Set(matches.flatMap((match) => match.cases.map((item) => item.id)));
  const caseAttributes = params.attributes.filter((attribute) => attribute.targetType === 'case' && caseIds.has(attribute.targetId));
  const fieldCounts = new Map<string, number>();
  for (const attribute of caseAttributes) {
    if (isLocationField(attribute.name)) {
      fieldCounts.set(attribute.name, (fieldCounts.get(attribute.name) ?? 0) + 1);
    }
  }
  const locationField = [...fieldCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? null;
  if (!locationField) {
    return { locationField: null, coordinateMode: false, points: [] };
  }

  const latitudeField = caseAttributes.find((attribute) => isLatitudeField(attribute.name))?.name ?? null;
  const longitudeField = caseAttributes.find((attribute) => isLongitudeField(attribute.name))?.name ?? null;
  const byCase = new Map<string, Map<string, Attribute>>();
  for (const attribute of caseAttributes) {
    const bucket = byCase.get(attribute.targetId) ?? new Map<string, Attribute>();
    bucket.set(attribute.name, attribute);
    byCase.set(attribute.targetId, bucket);
  }

  const pointMap = new Map<string, {
    label: string;
    field: string;
    count: number;
    caseIds: Set<string>;
    segmentIds: Set<string>;
    latitude: number | null;
    longitude: number | null;
  }>();

  for (const match of matches) {
    for (const caseEntity of match.cases) {
      const attributes = byCase.get(caseEntity.id);
      const rawLabel = attributes?.get(locationField)?.value;
      const label = typeof rawLabel === 'string' || typeof rawLabel === 'number' ? String(rawLabel).trim() : '';
      if (!label) continue;
      const key = label.toLowerCase();
      const latitudeRaw = latitudeField ? attributes?.get(latitudeField)?.value : null;
      const longitudeRaw = longitudeField ? attributes?.get(longitudeField)?.value : null;
      const latitude = parseCoordinateValue(latitudeRaw);
      const longitude = parseCoordinateValue(longitudeRaw);
      const entry = pointMap.get(key) ?? {
        label,
        field: locationField,
        count: 0,
        caseIds: new Set<string>(),
        segmentIds: new Set<string>(),
        latitude,
        longitude
      };
      entry.count += 1;
      entry.caseIds.add(caseEntity.id);
      entry.segmentIds.add(match.segment.id);
      if (entry.latitude === null) entry.latitude = latitude;
      if (entry.longitude === null) entry.longitude = longitude;
      pointMap.set(key, entry);
    }
  }

  return {
    locationField,
    coordinateMode: Boolean(latitudeField && longitudeField),
    points: [...pointMap.values()]
      .map((entry) => ({
        label: entry.label,
        field: entry.field,
        count: entry.count,
        caseCount: entry.caseIds.size,
        segmentCount: entry.segmentIds.size,
        latitude: entry.latitude,
        longitude: entry.longitude
      }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
  };
}

export function buildCodeHierarchy(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
  codes: Pick<Code, 'id' | 'name' | 'parentCodeId'>[];
}): CodeHierarchyResult {
  const matches = retrieveEvidence(params);
  const scopedSegmentIds = new Set(matches.map((match) => match.segment.id));
  const directCounts = new Map<string, number>();
  for (const application of params.applications) {
    if (!scopedSegmentIds.has(application.segmentId)) continue;
    directCounts.set(application.codeId, (directCounts.get(application.codeId) ?? 0) + 1);
  }
  const childrenByParent = new Map<string | null, Array<Pick<Code, 'id' | 'name' | 'parentCodeId'>>>();
  for (const code of params.codes) {
    const key = code.parentCodeId ?? null;
    const items = childrenByParent.get(key) ?? [];
    items.push(code);
    childrenByParent.set(key, items);
  }

  const buildNode = (code: Pick<Code, 'id' | 'name' | 'parentCodeId'>, depth: number): CodeHierarchyNode => {
    const children = (childrenByParent.get(code.id) ?? [])
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((child) => buildNode(child, depth + 1));
    const totalCount = (directCounts.get(code.id) ?? 0) + children.reduce((sum, child) => sum + child.totalCount, 0);
    return {
      codeId: code.id,
      codeName: code.name,
      parentCodeId: code.parentCodeId ?? null,
      depth,
      directCount: directCounts.get(code.id) ?? 0,
      totalCount,
      childCount: children.length,
      children
    };
  };

  const roots = (childrenByParent.get(null) ?? [])
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((code) => buildNode(code, 0));

  return {
    totalCodes: params.codes.length,
    totalApplications: [...directCounts.values()].reduce((sum, value) => sum + value, 0),
    roots
  };
}

export function buildConceptMap(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
  codes: Pick<Code, 'id' | 'name' | 'colorToken'>[];
  relationships: Pick<Relationship, 'leftTargetType' | 'leftTargetId' | 'rightTargetType' | 'rightTargetId' | 'relationshipType'>[];
}): ConceptMapResult {
  const cooccurrence = buildCodeCooccurrence({
    query: params.query,
    sources: params.sources,
    segments: params.segments,
    applications: params.applications,
    cases: params.cases,
    memos: params.memos,
    codes: params.codes
  });
  const scopedMatches = retrieveEvidence(params);
  const scopedSegmentIds = new Set(scopedMatches.map((match) => match.segment.id));
  const sizeByCode = new Map<string, number>();
  for (const application of params.applications) {
    if (!scopedSegmentIds.has(application.segmentId)) continue;
    sizeByCode.set(application.codeId, (sizeByCode.get(application.codeId) ?? 0) + 1);
  }

  const linkMap = new Map<string, ConceptMapLink>();
  for (const pair of cooccurrence.pairs) {
    const key = [pair.primaryCodeId, pair.secondaryCodeId].sort().join('::');
    linkMap.set(key, {
      sourceId: pair.primaryCodeId,
      targetId: pair.secondaryCodeId,
      weight: pair.segmentCount,
      kind: 'cooccurrence'
    });
  }
  for (const relationship of params.relationships) {
    if (relationship.leftTargetType !== 'code' || relationship.rightTargetType !== 'code') continue;
    const key = [relationship.leftTargetId, relationship.rightTargetId].sort().join('::');
    const existing = linkMap.get(key);
    if (existing) {
      existing.weight += 1;
    } else {
      linkMap.set(key, {
        sourceId: relationship.leftTargetId,
        targetId: relationship.rightTargetId,
        weight: 1,
        kind: 'relationship'
      });
    }
  }

  const connectedCodeIds = new Set([...linkMap.values()].flatMap((link) => [link.sourceId, link.targetId]));
  const nodes = params.codes
    .filter((code) => connectedCodeIds.has(code.id) || (sizeByCode.get(code.id) ?? 0) > 0)
    .map((code) => ({
      id: code.id,
      label: code.name,
      size: sizeByCode.get(code.id) ?? 0,
      group: `${code.colorToken || 'neutral'}`
    }))
    .sort((left, right) => right.size - left.size || left.label.localeCompare(right.label));

  return {
    nodes,
    links: [...linkMap.values()].sort((left, right) => right.weight - left.weight || left.sourceId.localeCompare(right.sourceId))
  };
}

export function buildCodeClusters(params: {
  conceptMap: ConceptMapResult;
  codes: Pick<Code, 'id' | 'name'>[];
}): CodeClusterResult {
  const adjacency = new Map<string, Set<string>>();
  for (const node of params.conceptMap.nodes) {
    adjacency.set(node.id, adjacency.get(node.id) ?? new Set<string>());
  }
  for (const link of params.conceptMap.links) {
    const left = adjacency.get(link.sourceId) ?? new Set<string>();
    left.add(link.targetId);
    adjacency.set(link.sourceId, left);
    const right = adjacency.get(link.targetId) ?? new Set<string>();
    right.add(link.sourceId);
    adjacency.set(link.targetId, right);
  }
  const labelById = new Map(params.codes.map((code) => [code.id, code.name]));
  const visited = new Set<string>();
  const clusters: CodeCluster[] = [];

  for (const codeId of adjacency.keys()) {
    if (visited.has(codeId)) continue;
    const stack = [codeId];
    const ids: string[] = [];
    visited.add(codeId);
    while (stack.length > 0) {
      const current = stack.pop()!;
      ids.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }
    const sortedIds = ids.sort((left, right) => (labelById.get(left) ?? left).localeCompare(labelById.get(right) ?? right));
    const totalWeight = params.conceptMap.links
      .filter((link) => sortedIds.includes(link.sourceId) && sortedIds.includes(link.targetId))
      .reduce((sum, link) => sum + link.weight, 0);
    clusters.push({
      id: `cluster-${clusters.length + 1}`,
      label: sortedIds.length === 1 ? (labelById.get(sortedIds[0]) ?? sortedIds[0]) : `${labelById.get(sortedIds[0]) ?? sortedIds[0]} cluster`,
      codeIds: sortedIds,
      totalWeight
    });
  }

  return {
    clusters: clusters.sort((left, right) => right.totalWeight - left.totalWeight || right.codeIds.length - left.codeIds.length || left.label.localeCompare(right.label))
  };
}

export function buildCompoundQuery(params: {
  scopeQuery: EvidenceQuery;
  operator: 'all' | 'any' | 'none';
  clauses: CompoundQueryClause[];
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
}): CompoundQueryResult {
  const clauses = params.clauses.filter((clause) => clause.operator === 'present' || String(clause.value ?? '').trim());
  if (clauses.length === 0) {
    throw new Error('At least one compound query clause is required.');
  }
  const scopedMatches = retrieveEvidence({
    query: {
      ...params.scopeQuery,
      searchText: undefined
    },
    sources: params.sources,
    segments: params.segments,
    applications: params.applications,
    cases: params.cases,
    memos: params.memos
  });

  const items = scopedMatches.filter((match) => {
    const results = clauses.map((clause) => matchCompoundClause(match, clause));
    if (params.operator === 'all') return results.every(Boolean);
    if (params.operator === 'none') return results.every((result) => !result);
    return results.some(Boolean);
  });

  return {
    operator: params.operator,
    clauseCount: clauses.length,
    matchCount: items.length,
    sourceCount: new Set(items.map((item) => item.segment.sourceId)).size,
    caseCount: new Set(items.flatMap((item) => item.cases.map((caseEntity) => caseEntity.id))).size,
    items
  };
}

export function buildSentimentAnalysis(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
}): SentimentAnalysisResult {
  const matches = retrieveEvidence({
    query: params.query,
    sources: params.sources,
    segments: params.segments,
    applications: params.applications,
    cases: params.cases,
    memos: params.memos
  });
  const hits: SentimentHit[] = matches
    .map((match) => {
      const tokens = tokenizeSentimentTerms(match.segment.text);
      const positiveTerms = [...new Set(tokens.filter((token) => POSITIVE_SENTIMENT_TERMS.has(token)))];
      const negativeTerms = [...new Set(tokens.filter((token) => NEGATIVE_SENTIMENT_TERMS.has(token)))];
      const totalTerms = positiveTerms.length + negativeTerms.length;
      const score = totalTerms > 0 ? (positiveTerms.length - negativeTerms.length) / totalTerms : 0;
      const label: SentimentLabel = totalTerms === 0
        ? 'neutral'
        : positiveTerms.length > 0 && negativeTerms.length > 0 && Math.abs(positiveTerms.length - negativeTerms.length) <= 1
          ? 'mixed'
          : score > 0
            ? 'positive'
            : 'negative';
      return {
        segmentId: match.segment.id,
        sourceId: match.segment.sourceId,
        sourceTitle: match.source?.title ?? null,
        label,
        score,
        positiveTerms,
        negativeTerms,
        text: match.segment.text
      };
    })
    .sort((left, right) => Math.abs(right.score) - Math.abs(left.score) || left.segmentId.localeCompare(right.segmentId));

  const scoredHits = hits.filter((hit) => hit.label !== 'neutral');
  const counts: Record<SentimentLabel, number> = {
    positive: hits.filter((hit) => hit.label === 'positive').length,
    negative: hits.filter((hit) => hit.label === 'negative').length,
    mixed: hits.filter((hit) => hit.label === 'mixed').length,
    neutral: hits.filter((hit) => hit.label === 'neutral').length
  };

  return {
    totalSegments: hits.length,
    averageScore: scoredHits.length > 0 ? scoredHits.reduce((total, hit) => total + hit.score, 0) / scoredHits.length : null,
    counts,
    hits
  };
}

export function buildPatternAutocode(params: {
  query: EvidenceQuery;
  patterns: string[];
  matchMode?: PatternAutocodeMatchMode;
  expandSynonyms?: boolean;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
}): PatternAutocodeResult {
  const patterns = params.patterns.map((item) => item.trim()).filter(Boolean);
  if (patterns.length === 0) {
    throw new Error('At least one autocode pattern is required.');
  }
  const matchMode = params.matchMode ?? 'phrase';
  const expandedPatterns = expandAutocodePatterns(patterns, params.expandSynonyms ?? false);
  const matches = retrieveEvidence({
    query: {
      ...params.query,
      codeId: undefined,
      coCodeId: undefined,
      coderId: undefined
    },
    sources: params.sources,
    segments: params.segments,
    applications: params.applications,
    cases: params.cases,
    memos: params.memos
  });
  const hits = matches.flatMap((match) => {
    const pattern = expandedPatterns.find((entry) => matchAutocodePattern(match.segment.text, entry, matchMode));
    if (!pattern) return [];
    return [{
      segmentId: match.segment.id,
      sourceId: match.segment.sourceId,
      sourceTitle: match.source?.title ?? null,
      pattern,
      text: match.segment.text
    }];
  });

  return {
    patterns,
    expandedPatterns,
    matchMode,
    scopeCount: matches.length,
    matchedCount: hits.length,
    hits
  };
}

export function buildMatrixCoding(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
  codes: Pick<Code, 'id' | 'name'>[];
}): MatrixCodingResult {
  const matches = retrieveEvidence({
    query: params.query,
    sources: params.sources,
    segments: params.segments,
    applications: params.applications,
    cases: params.cases,
    memos: params.memos
  });

  const caseNameById = new Map(params.cases.map((item) => [item.id, item.label]));
  const codeNameById = new Map(params.codes.map((item) => [item.id, item.name]));
  const rowCounts = new Map<string, number>();
  const columnCounts = new Map<string, number>();
  const cellMap = new Map<string, MatrixCodingCell>();

  for (const match of matches) {
    for (const application of match.applications) {
      if (!application.caseId) continue;
      const cellKey = `${application.codeId}::${application.caseId}`;
      const cell = cellMap.get(cellKey) ?? {
        codeId: application.codeId,
        caseId: application.caseId,
        count: 0,
        segmentIds: []
      };
      cell.count += 1;
      if (!cell.segmentIds.includes(match.segment.id)) {
        cell.segmentIds.push(match.segment.id);
      }
      cellMap.set(cellKey, cell);
      rowCounts.set(application.codeId, (rowCounts.get(application.codeId) ?? 0) + 1);
      columnCounts.set(application.caseId, (columnCounts.get(application.caseId) ?? 0) + 1);
    }
  }

  return {
    rows: [...rowCounts.entries()]
      .map(([codeId, count]) => ({ codeId, codeName: codeNameById.get(codeId) ?? codeId, count }))
      .sort((left, right) => right.count - left.count || left.codeName.localeCompare(right.codeName)),
    columns: [...columnCounts.entries()]
      .map(([caseId, count]) => ({ caseId, caseLabel: caseNameById.get(caseId) ?? caseId, count }))
      .sort((left, right) => right.count - left.count || left.caseLabel.localeCompare(right.caseLabel)),
    cells: [...cellMap.values()],
    totalCount: [...cellMap.values()].reduce((total, cell) => total + cell.count, 0)
  };
}

export function buildCodeByCaseView(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
  codes: Pick<Code, 'id' | 'name'>[];
}): CodeByCaseView {
  type Excerpt = {
    segmentId: string;
    sourceId: string;
    sourceTitle: string | null;
    text: string;
    memoCount: number;
  };
  type CodeEntry = {
    codeId: string;
    codeName: string;
    count: number;
    excerpts: Excerpt[];
  };
  type CaseEntry = {
    caseId: string;
    caseLabel: string;
    totalCount: number;
    codes: Map<string, CodeEntry>;
  };

  const matches = retrieveEvidence({
    query: params.query,
    sources: params.sources,
    segments: params.segments,
    applications: params.applications,
    cases: params.cases,
    memos: params.memos
  });

  const caseMap = new Map<string, CaseEntry>();
  const codeNameById = new Map(params.codes.map((item) => [item.id, item.name]));

  for (const match of matches) {
    for (const application of match.applications) {
      if (!application.caseId) continue;
      const caseEntity = params.cases.find((item) => item.id === application.caseId);
      const caseEntry: CaseEntry = caseMap.get(application.caseId) ?? {
        caseId: application.caseId,
        caseLabel: caseEntity?.label ?? application.caseId,
        totalCount: 0,
        codes: new Map<string, CodeEntry>()
      };
      const codeEntry: CodeEntry = caseEntry.codes.get(application.codeId) ?? {
        codeId: application.codeId,
        codeName: codeNameById.get(application.codeId) ?? application.codeId,
        count: 0,
        excerpts: []
      };
      codeEntry.count += 1;
      caseEntry.totalCount += 1;
      if (!codeEntry.excerpts.some((item) => item.segmentId === match.segment.id)) {
        codeEntry.excerpts.push({
          segmentId: match.segment.id,
          sourceId: match.segment.sourceId,
          sourceTitle: match.source?.title ?? null,
          text: match.segment.text,
          memoCount: match.memos.length
        });
      }
      caseEntry.codes.set(application.codeId, codeEntry);
      caseMap.set(application.caseId, caseEntry);
    }
  }

  const cases = [...caseMap.values()]
    .map((caseEntry) => ({
      caseId: caseEntry.caseId,
      caseLabel: caseEntry.caseLabel,
      totalCount: caseEntry.totalCount,
      codes: [...caseEntry.codes.values()]
        .map((codeEntry) => ({
          ...codeEntry,
          excerpts: codeEntry.excerpts.slice(0, 5)
        }))
        .sort((left, right) => right.count - left.count || left.codeName.localeCompare(right.codeName))
    }))
    .sort((left, right) => right.totalCount - left.totalCount || left.caseLabel.localeCompare(right.caseLabel));

  return {
    cases,
    totalCount: cases.reduce((total, item) => total + item.totalCount, 0)
  };
}

export function buildCodeCooccurrence(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
  codes: Pick<Code, 'id' | 'name'>[];
}): CodeCooccurrenceResult {
  const items = buildFilteredSegmentApplications(params);
  const codeNameById = new Map(params.codes.map((code) => [code.id, code.name]));
  const pairMap = new Map<string, {
    primaryCodeId: string;
    secondaryCodeId: string;
    segmentIds: Set<string>;
    sourceIds: Set<string>;
    caseIds: Set<string>;
  }>();

  for (const item of items) {
    const codeIds = [...new Set(item.applications.map((application) => application.codeId))].sort((left, right) => left.localeCompare(right));
    for (let leftIndex = 0; leftIndex < codeIds.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < codeIds.length; rightIndex += 1) {
        const primaryCodeId = codeIds[leftIndex]!;
        const secondaryCodeId = codeIds[rightIndex]!;
        if (params.query.codeId && primaryCodeId !== params.query.codeId && secondaryCodeId !== params.query.codeId) continue;
        if (params.query.coCodeId && primaryCodeId !== params.query.coCodeId && secondaryCodeId !== params.query.coCodeId) continue;
        const key = `${primaryCodeId}::${secondaryCodeId}`;
        const entry = pairMap.get(key) ?? {
          primaryCodeId,
          secondaryCodeId,
          segmentIds: new Set<string>(),
          sourceIds: new Set<string>(),
          caseIds: new Set<string>()
        };
        entry.segmentIds.add(item.segment.id);
        entry.sourceIds.add(item.segment.sourceId);
        for (const application of item.applications) {
          if ((application.codeId === primaryCodeId || application.codeId === secondaryCodeId) && application.caseId) {
            entry.caseIds.add(application.caseId);
          }
        }
        pairMap.set(key, entry);
      }
    }
  }

  return {
    pairs: [...pairMap.values()]
      .map((pair) => ({
        primaryCodeId: pair.primaryCodeId,
        primaryCodeName: codeNameById.get(pair.primaryCodeId) ?? pair.primaryCodeId,
        secondaryCodeId: pair.secondaryCodeId,
        secondaryCodeName: codeNameById.get(pair.secondaryCodeId) ?? pair.secondaryCodeId,
        segmentCount: pair.segmentIds.size,
        sourceCount: pair.sourceIds.size,
        caseCount: pair.caseIds.size,
        segmentIds: [...pair.segmentIds]
      }))
      .sort((left, right) => right.segmentCount - left.segmentCount || left.primaryCodeName.localeCompare(right.primaryCodeName) || left.secondaryCodeName.localeCompare(right.secondaryCodeName)),
    totalSegments: new Set(items.map((item) => item.segment.id)).size
  };
}

export function buildCodeCodeMatrix(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
  codes: Pick<Code, 'id' | 'name'>[];
}): CodeCodeMatrixResult {
  const items = buildFilteredSegmentApplications(params);
  const codeNameById = new Map(params.codes.map((code) => [code.id, code.name]));
  const rowCounts = new Map<string, Set<string>>();
  const cellMap = new Map<string, Set<string>>();

  for (const item of items) {
    const codeIds = [...new Set(item.applications.map((application) => application.codeId))].sort((left, right) => left.localeCompare(right));
    for (const codeId of codeIds) {
      const segmentsForCode = rowCounts.get(codeId) ?? new Set<string>();
      segmentsForCode.add(item.segment.id);
      rowCounts.set(codeId, segmentsForCode);
    }
    for (const rowCodeId of codeIds) {
      for (const columnCodeId of codeIds) {
        const key = `${rowCodeId}::${columnCodeId}`;
        const segmentsForCell = cellMap.get(key) ?? new Set<string>();
        segmentsForCell.add(item.segment.id);
        cellMap.set(key, segmentsForCell);
      }
    }
  }

  const rows = [...rowCounts.entries()]
    .map(([codeId, segmentIds]) => ({
      codeId,
      codeName: codeNameById.get(codeId) ?? codeId,
      count: segmentIds.size
    }))
    .sort((left, right) => right.count - left.count || left.codeName.localeCompare(right.codeName));

  return {
    rows,
    columns: rows,
    cells: [...cellMap.entries()]
      .map(([key, segmentIds]) => {
        const [rowCodeId, columnCodeId] = key.split('::');
        return {
          rowCodeId,
          columnCodeId,
          count: segmentIds.size,
          segmentIds: [...segmentIds]
        };
      })
      .sort((left, right) => right.count - left.count || left.rowCodeId.localeCompare(right.rowCodeId) || left.columnCodeId.localeCompare(right.columnCodeId)),
    totalSegments: new Set(items.map((item) => item.segment.id)).size
  };
}

export function buildQualitativeQueryReport(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
  codes: Pick<Code, 'id' | 'name'>[];
}): QualitativeQueryReport {
  const matches = retrieveEvidence(params);
  const codeNameById = new Map(params.codes.map((code) => [code.id, code.name]));
  const sourceMap = new Map<string, {
    sourceId: string;
    sourceTitle: string | null;
    matchCount: number;
    caseIds: Set<string>;
    memoIds: Set<string>;
    codeCounts: Map<string, number>;
  }>();
  const caseMap = new Map<string, {
    caseId: string;
    caseLabel: string;
    matchCount: number;
    sourceIds: Set<string>;
    memoIds: Set<string>;
    codeCounts: Map<string, number>;
  }>();
  const memoIds = new Set<string>();

  for (const match of matches) {
    const sourceEntry = sourceMap.get(match.segment.sourceId) ?? {
      sourceId: match.segment.sourceId,
      sourceTitle: match.source?.title ?? null,
      matchCount: 0,
      caseIds: new Set<string>(),
      memoIds: new Set<string>(),
      codeCounts: new Map<string, number>()
    };
    sourceEntry.matchCount += 1;
    for (const memo of match.memos) {
      sourceEntry.memoIds.add(memo.id);
      memoIds.add(memo.id);
    }
    for (const application of match.applications) {
      sourceEntry.codeCounts.set(application.codeId, (sourceEntry.codeCounts.get(application.codeId) ?? 0) + 1);
    }
    for (const caseEntity of match.cases) {
      sourceEntry.caseIds.add(caseEntity.id);
      const caseEntry = caseMap.get(caseEntity.id) ?? {
        caseId: caseEntity.id,
        caseLabel: caseEntity.label,
        matchCount: 0,
        sourceIds: new Set<string>(),
        memoIds: new Set<string>(),
        codeCounts: new Map<string, number>()
      };
      caseEntry.matchCount += 1;
      caseEntry.sourceIds.add(match.segment.sourceId);
      for (const memo of match.memos) {
        caseEntry.memoIds.add(memo.id);
      }
      for (const application of match.applications) {
        caseEntry.codeCounts.set(application.codeId, (caseEntry.codeCounts.get(application.codeId) ?? 0) + 1);
      }
      caseMap.set(caseEntity.id, caseEntry);
    }
    sourceMap.set(match.segment.sourceId, sourceEntry);
  }

  const topCodes = (counts: Map<string, number>) => [...counts.entries()]
    .map(([codeId, count]) => ({ codeId, codeName: codeNameById.get(codeId) ?? codeId, count }))
    .sort((left, right) => right.count - left.count || left.codeName.localeCompare(right.codeName))
    .slice(0, 5);

  return {
    summary: {
      matchCount: matches.length,
      sourceCount: sourceMap.size,
      caseCount: caseMap.size,
      memoCount: memoIds.size
    },
    sources: [...sourceMap.values()]
      .map((sourceEntry) => ({
        sourceId: sourceEntry.sourceId,
        sourceTitle: sourceEntry.sourceTitle,
        matchCount: sourceEntry.matchCount,
        caseCount: sourceEntry.caseIds.size,
        memoCount: sourceEntry.memoIds.size,
        topCodes: topCodes(sourceEntry.codeCounts)
      }))
      .sort((left, right) => right.matchCount - left.matchCount || (left.sourceTitle ?? left.sourceId).localeCompare(right.sourceTitle ?? right.sourceId)),
    cases: [...caseMap.values()]
      .map((caseEntry) => ({
        caseId: caseEntry.caseId,
        caseLabel: caseEntry.caseLabel,
        matchCount: caseEntry.matchCount,
        sourceCount: caseEntry.sourceIds.size,
        memoCount: caseEntry.memoIds.size,
        topCodes: topCodes(caseEntry.codeCounts)
      }))
      .sort((left, right) => right.matchCount - left.matchCount || left.caseLabel.localeCompare(right.caseLabel))
  };
}

export function buildFrameworkMatrix(params: {
  query: EvidenceQuery;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
  codes: Pick<Code, 'id' | 'name'>[];
}): FrameworkMatrixResult {
  const matches = retrieveEvidence(params);
  const cellMap = new Map<string, {
    caseId: string;
    codeId: string;
    count: number;
    memoCount: number;
    segmentIds: string[];
    excerpts: string[];
  }>();
  const rowCounts = new Map<string, number>();
  const columnCounts = new Map<string, number>();
  const caseLabelById = new Map(params.cases.map((item) => [item.id, item.label]));
  const codeNameById = new Map(params.codes.map((item) => [item.id, item.name]));

  for (const match of matches) {
    const relatedCaseIds = new Set<string>(match.cases.map((item) => item.id));
    for (const application of match.applications) {
      const targetCaseIds = application.caseId ? [application.caseId] : [...relatedCaseIds];
      for (const caseId of targetCaseIds) {
        const key = `${caseId}::${application.codeId}`;
        const entry = cellMap.get(key) ?? {
          caseId,
          codeId: application.codeId,
          count: 0,
          memoCount: 0,
          segmentIds: [],
          excerpts: []
        };
        entry.count += 1;
        entry.memoCount += match.memos.length;
        if (!entry.segmentIds.includes(match.segment.id)) {
          entry.segmentIds.push(match.segment.id);
        }
        if (entry.excerpts.length < 3 && !entry.excerpts.includes(match.segment.text)) {
          entry.excerpts.push(match.segment.text);
        }
        cellMap.set(key, entry);
        rowCounts.set(caseId, (rowCounts.get(caseId) ?? 0) + 1);
        columnCounts.set(application.codeId, (columnCounts.get(application.codeId) ?? 0) + 1);
      }
    }
  }

  const cells: FrameworkMatrixCell[] = [...cellMap.values()]
    .map((entry) => ({
      caseId: entry.caseId,
      codeId: entry.codeId,
      count: entry.count,
      memoCount: entry.memoCount,
      summary: entry.excerpts.length > 0 ? entry.excerpts.map((excerpt) => excerpt.trim()).join(' / ') : '',
      segmentIds: entry.segmentIds
    }))
    .sort((left, right) => right.count - left.count || left.caseId.localeCompare(right.caseId) || left.codeId.localeCompare(right.codeId));

  return {
    rows: [...rowCounts.entries()]
      .map(([caseId, count]) => ({
        caseId,
        caseLabel: caseLabelById.get(caseId) ?? caseId,
        count
      }))
      .sort((left, right) => right.count - left.count || left.caseLabel.localeCompare(right.caseLabel)),
    columns: [...columnCounts.entries()]
      .map(([codeId, count]) => ({
        codeId,
        codeName: codeNameById.get(codeId) ?? codeId,
        count
      }))
      .sort((left, right) => right.count - left.count || left.codeName.localeCompare(right.codeName)),
    cells,
    totalCount: cells.reduce((total, cell) => total + cell.count, 0)
  };
}

export function buildCodingComparison(params: {
  query: EvidenceQuery;
  codeId: string;
  coderA?: string;
  coderB?: string;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
  codes: Pick<Code, 'id' | 'name'>[];
}): CodingComparisonResult {
  if (!params.codeId) {
    throw new Error('codeId is required for coding comparison.');
  }

  const universe = buildFilteredSegmentApplications({
    query: {
      ...params.query,
      codeId: undefined,
      coCodeId: undefined,
      coderId: undefined
    },
    sources: params.sources,
    segments: params.segments,
    applications: params.applications,
    memos: params.memos
  });
  const codeApplications = params.applications.filter((application) => application.codeId === params.codeId);
  const coderCounts = new Map<string, number>();
  for (const application of codeApplications) {
    coderCounts.set(application.coderId, (coderCounts.get(application.coderId) ?? 0) + 1);
  }
  const rankedCoders = [...coderCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([coderId]) => coderId);
  const coderA = params.coderA && params.coderA.trim() ? params.coderA.trim() : rankedCoders[0];
  const coderB = params.coderB && params.coderB.trim() ? params.coderB.trim() : rankedCoders.find((coderId) => coderId !== coderA);
  if (!coderA || !coderB) {
    throw new Error('At least two coders with applications for the selected code are required.');
  }

  let bothAppliedCount = 0;
  let neitherAppliedCount = 0;
  let coderAOnlyCount = 0;
  let coderBOnlyCount = 0;
  const disagreements: CodingComparisonResult['disagreements'] = [];
  const codeName = params.codes.find((item) => item.id === params.codeId)?.name ?? params.codeId;

  for (const item of universe) {
    const matchingApplications = item.applications.filter((application) => application.codeId === params.codeId);
    const coderAApplied = matchingApplications.some((application) => application.coderId === coderA);
    const coderBApplied = matchingApplications.some((application) => application.coderId === coderB);
    if (coderAApplied && coderBApplied) {
      bothAppliedCount += 1;
    } else if (coderAApplied) {
      coderAOnlyCount += 1;
    } else if (coderBApplied) {
      coderBOnlyCount += 1;
    } else {
      neitherAppliedCount += 1;
    }

    if (coderAApplied !== coderBApplied && disagreements.length < 25) {
      disagreements.push({
        segmentId: item.segment.id,
        sourceId: item.segment.sourceId,
        sourceTitle: item.source?.title ?? null,
        text: item.segment.text,
        coderAApplied,
        coderBApplied
      });
    }
  }

  const universeSegmentCount = universe.length;
  const agreementCount = bothAppliedCount + neitherAppliedCount;
  const disagreementCount = coderAOnlyCount + coderBOnlyCount;
  const percentAgreement = universeSegmentCount > 0 ? agreementCount / universeSegmentCount : null;
  const observed = percentAgreement;
  const pYesA = universeSegmentCount > 0 ? (bothAppliedCount + coderAOnlyCount) / universeSegmentCount : 0;
  const pYesB = universeSegmentCount > 0 ? (bothAppliedCount + coderBOnlyCount) / universeSegmentCount : 0;
  const pNoA = 1 - pYesA;
  const pNoB = 1 - pYesB;
  const expected = (pYesA * pYesB) + (pNoA * pNoB);
  const cohensKappa = observed === null || expected >= 1 ? null : (observed - expected) / (1 - expected);

  return {
    codeId: params.codeId,
    codeName,
    coderA,
    coderB,
    universeSegmentCount,
    agreementCount,
    disagreementCount,
    percentAgreement,
    cohensKappa,
    bothAppliedCount,
    neitherAppliedCount,
    coderAOnlyCount,
    coderBOnlyCount,
    disagreements
  };
}

export function buildInterRaterSummary(params: {
  query: EvidenceQuery;
  coderA?: string;
  coderB?: string;
  sources: Source[];
  segments: Segment[];
  applications: CodeApplication[];
  cases: CaseEntity[];
  memos: Memo[];
  codes: Pick<Code, 'id' | 'name'>[];
}): InterRaterSummaryResult {
  const universe = buildFilteredSegmentApplications({
    query: {
      ...params.query,
      codeId: undefined,
      coCodeId: undefined,
      coderId: undefined
    },
    sources: params.sources,
    segments: params.segments,
    applications: params.applications,
    memos: params.memos
  });
  const segmentIds = new Set(universe.map((item) => item.segment.id));
  const coderCounts = new Map<string, number>();
  for (const application of params.applications) {
    if (!segmentIds.has(application.segmentId)) continue;
    coderCounts.set(application.coderId, (coderCounts.get(application.coderId) ?? 0) + 1);
  }
  const rankedCoders = [...coderCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([coderId]) => coderId);
  const coderA = params.coderA && params.coderA.trim() ? params.coderA.trim() : rankedCoders[0];
  const coderB = params.coderB && params.coderB.trim() ? params.coderB.trim() : rankedCoders.find((coderId) => coderId !== coderA);
  if (!coderA || !coderB) {
    throw new Error('At least two coders with applications in the current scope are required.');
  }

  const codeIds = [...new Set(
    params.applications
      .filter((application) => segmentIds.has(application.segmentId))
      .map((application) => application.codeId)
  )];
  const rows = codeIds.map((codeId) => {
    const comparison = buildCodingComparison({
      ...params,
      query: {
        ...params.query,
        codeId: undefined,
        coCodeId: undefined,
        coderId: undefined
      },
      codeId,
      coderA,
      coderB
    });
    return {
      codeId: comparison.codeId,
      codeName: comparison.codeName,
      universeSegmentCount: comparison.universeSegmentCount,
      agreementCount: comparison.agreementCount,
      disagreementCount: comparison.disagreementCount,
      percentAgreement: comparison.percentAgreement,
      cohensKappa: comparison.cohensKappa
    };
  })
    .sort((left, right) => {
      const kappaLeft = left.cohensKappa ?? -Infinity;
      const kappaRight = right.cohensKappa ?? -Infinity;
      return kappaLeft - kappaRight
        || right.disagreementCount - left.disagreementCount
        || left.codeName.localeCompare(right.codeName);
    });

  const agreements = rows.map((row) => row.percentAgreement).filter((value): value is number => value !== null);
  const kappas = rows.map((row) => row.cohensKappa).filter((value): value is number => value !== null);
  return {
    coderA,
    coderB,
    rows,
    averageAgreement: agreements.length > 0 ? agreements.reduce((total, value) => total + value, 0) / agreements.length : null,
    averageKappa: kappas.length > 0 ? kappas.reduce((total, value) => total + value, 0) / kappas.length : null
  };
}

export function buildEvidenceExport(params: {
  project: { id: string; name: string };
  retrieval: EvidenceMatch[];
  codes: Code[];
}): {
  project: { id: string; name: string };
  exportedAt: string;
  codebook: Array<Pick<Code, 'id' | 'name' | 'description' | 'colorToken'>>;
  matches: Array<{
    segmentId: string;
    sourceId: string;
    sourceTitle: string | null;
    text: string;
    codes: Array<{ codeId: string; coderId: string; caseId: string | null; confidence: number }>;
    cases: Array<{ caseId: string; label: string }>;
    memos: Array<{ memoId: string; title: string; body: string }>;
  }>;
} {
  return {
    project: params.project,
    exportedAt: new Date().toISOString(),
    codebook: params.codes.map((code) => ({
      id: code.id,
      name: code.name,
      description: code.description,
      colorToken: code.colorToken
    })),
    matches: params.retrieval.map((item) => ({
      segmentId: item.segment.id,
      sourceId: item.segment.sourceId,
      sourceTitle: item.source?.title ?? null,
      text: item.segment.text,
      codes: item.applications.map((application) => ({
        codeId: application.codeId,
        coderId: application.coderId,
        caseId: application.caseId,
        confidence: application.confidence
      })),
      cases: item.cases.map((caseEntity) => ({
        caseId: caseEntity.id,
        label: caseEntity.label
      })),
      memos: item.memos.map((memo) => ({
        memoId: memo.id,
        title: memo.title,
        body: memo.body
      }))
    }))
  };
}
