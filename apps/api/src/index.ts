import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import dotenv from 'dotenv';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { Client as PgClient } from 'pg';
import mssql from 'mssql';
import {
  createAuditEvent,
  createAnnotation,
  createAttribute, createCase, createCode, createCodeApplication,
  createMemo, createProject, createRelationship, createSegment, createSource, createVariable
} from '@mu/core-domain';
import {
  buildOidcAuthorizationUrl,
  buildPkcePair,
  createOidcState,
  exchangeOidcCode,
  fetchOidcProviderMetadata,
  normalizeMuUsername,
  resolveMuRole,
  resolveOidcConfig,
  resolveOidcIdentity
} from '@mu/auth';
import { buildEvidenceSummaryPrompt, scoreEvidenceCoverage } from '@mu/ai';
import { buildCodeByCaseView, buildCodeClusters, buildCodeCodeMatrix, buildCodeCooccurrence, buildCodeHierarchy, buildCodingComparison, buildCompoundQuery, buildConceptMap, buildFrameworkMatrix, buildInterRaterSummary, buildMapVisualization, buildMatrixCoding, buildPatternAutocode, buildQualitativeQueryReport, buildSentimentAnalysis, buildTextSearch, buildWordCloud, buildWordFrequency, retrieveEvidence, buildEvidenceExport } from '@mu/qual-engine';
import { analyzeBootstrap, analyzeClusterAnalysis, analyzeCompareMeans, analyzeComplexSamples, analyzeConjoint, analyzeCorrelation, analyzeCrosstab, analyzeDecisionTree, analyzeDirectMarketing, analyzeExactTest, analyzeFactorAnalysis, analyzeForecast, analyzeGeneralizedEstimatingEquation, analyzeGeneralLinearModel, analyzeMissingValues, analyzeMixedModel, analyzeNeuralNetwork, analyzeNonparametricComparison, analyzeOptimalScaling, analyzePairedTTest, analyzeRegression, analyzeReliability, analyzeRepeatedMeasures, analyzeSurvivalAnalysis, analyzeTTest, analyzeWithMultipleImputation, buildCaseDataset, buildCustomTable, buildImputationPlan, buildMultipleImputationPlan, describeDataset, runSyntax, transformDataset } from '@mu/quant-engine';
import { fail, ok } from '@mu/shared-types';
import { deleteProjectArtifacts, ensureDirectory, listProjectArtifacts, pruneProjectArtifacts, readStoredArtifact, resolveStorageRoot, writeProjectArtifact, writeProjectArtifactBytes } from '@mu/storage';
import { formatAuditActionLabel } from '@mu/ui';
import {
  buildAppendixReport,
  buildChatHistoryReport,
  buildCommitteeReviewPackReport,
  buildCodeCodeMatrixReport,
  buildCodeCooccurrenceReport,
  buildEvidenceReport,
  buildMatrixCodingReport,
  buildCaseSummariesReport,
  buildCodingComparisonReport,
  buildProjectCodebookReport,
  buildQualitativeQuerySummaryReport,
  buildCompoundWorkbenchReport,
  buildFrameworkMatrixSummaryReport,
  buildMergeReviewReport,
  buildInterRaterSummaryReport,
  renderAuditEventsXlsx,
  renderDatasetXlsx,
  renderStructuredReportDocx,
  renderStructuredReportPdf,
  renderStructuredReportXlsx,
  renderStructuredReportText,
  renderEvidenceReportDocx,
  renderEvidenceReportPdf,
  renderEvidenceReportXlsx,
  renderEvidenceReportText
} from './reporting.js';
import {
  initDatabase, getDbHost,
  createUserRecord, findUserByUsername, findUserById, verifyPassword, deleteExpiredUsers,
  addMembership, checkProjectAccess, listProjectMembers, removeMembership,
  touchProjectPresence, listProjectPresence, clearUserPresence,
  getProjectMembership, countProjectOwners,
  deleteProject, insertProject, listProjects, updateProjectWorkspaceMode,
  insertAuditEvent, listAuditEvents, getGovernancePolicy, updateGovernancePolicy,
  listProjectMessages, insertProjectMessage,
  listSavedAnalysisJobs, insertSavedAnalysisJob, deleteSavedAnalysisJob,
  listDatasetFieldMetadata, replaceDatasetFieldMetadata, getProjectDatasetSettings, upsertProjectDatasetSettings,
  listExternalSqlProfiles, insertExternalSqlProfile, deleteExternalSqlProfile,
  listExternalSqlImportJobs, insertExternalSqlImportJob, deleteExternalSqlImportJob, deleteCasesImportedBySqlJob, deleteCasesImportedByOfficeFile,
  listDueExternalSqlImportJobs, updateExternalSqlImportJobRunState, updateExternalSqlImportJobSchedule,
  listOfficeConnectorProfiles, insertOfficeConnectorProfile, deleteOfficeConnectorProfile,
  listOfficeConnectorJobs, insertOfficeConnectorJob, deleteOfficeConnectorJob,
  listDueOfficeConnectorJobs, updateOfficeConnectorJobSchedule, updateOfficeConnectorJobRunState,
  listReferenceConnectorProfiles, insertReferenceConnectorProfile, deleteReferenceConnectorProfile,
  listReferenceConnectorJobs, insertReferenceConnectorJob, deleteReferenceConnectorJob,
  listDueReferenceConnectorJobs, updateReferenceConnectorJobSchedule, updateReferenceConnectorJobRunState,
  listSavedTransforms, insertSavedTransform, deleteSavedTransform,
  listSavedQualitativeQueries, insertSavedQualitativeQuery, deleteSavedQualitativeQuery,
  listCodingAssignments, getCodingAssignment, insertCodingAssignment, updateCodingAssignment, deleteCodingAssignment,
  listCodingCalibrationSessions, getCodingCalibrationSession, insertCodingCalibrationSession, updateCodingCalibrationSession,
  getCodingConflictTriage, listCodingConflictTriages, upsertCodingConflictTriage,
  getCodingMergeGovernancePolicy, upsertCodingMergeGovernancePolicy,
  upsertCodingMergeApproval, listCodingMergeApprovals, markCodingMergeApprovalsUsed, revokeCodingMergeApproval,
  insertCodingConflictResolution, listCodingConflictResolutions, listLatestCodingConflictResolutions, getCodingConflictResolution,
  archiveCodeApplications, listArchivedCodeApplicationsByResolution, restoreArchivedCodeApplications,
  insertSource, listSources, updateSourceContent,
  insertCode, listCodes,
  insertVariable, listVariables,
  insertCase, listCases,
  insertMemo, listMemos,
  insertAttribute, listAttributes,
  insertAnnotation, listAnnotations, updateAnnotation, deleteAnnotation,
  insertRelationship, listRelationships, updateRelationship, deleteRelationship,
  insertProjectReference, listProjectReferences, getProjectReference, updateProjectReference, deleteProjectReference,
  listProjectReferenceLinks, insertProjectReferenceLink, updateProjectReferenceLink, deleteProjectReferenceLink,
  listProjectReferenceCollections, insertProjectReferenceCollection, updateProjectReferenceCollection, deleteProjectReferenceCollection,
  listProjectReferenceCollectionItems, insertProjectReferenceCollectionItem, deleteProjectReferenceCollectionItem, removeReferenceFromCollection,
  listProjectReferenceMergeEvents, insertProjectReferenceMergeEvent, mergeProjectReferences, listProjectReferenceDuplicateCandidates,
  insertTranscriptSyncLink, listTranscriptSyncLinks, updateTranscriptSyncLink, deleteTranscriptSyncLink, deleteTranscriptSyncLinksByMediaSource,
  insertTranscriptionJob, listTranscriptionJobs, updateTranscriptionJob,
  insertSegment, listSegments, updateSegment, deleteSegment,
  insertCodeApplication, listCodeApplications, deleteCodeApplication,
  listTraceLinks, deriveTraceLinks,
  getProjectSummary, getProjectActivity
} from './db.js';
import { parseImportedFile, type ImportedFileDraft, type ImportedSpssMetadataDraft } from './imports.js';
import { writeSpssBuffer } from './spss-bridge.js';
import { parseBibtexReferences, parseCslJsonReferences, parseRisReferences, serializeBibtexReferences, serializeCslJsonReferences, serializeRisReferences } from './references.js';

const apiModuleDir = path.dirname(fileURLToPath(import.meta.url));
const runtimeRoot = process.cwd();
const workspaceRoot = path.resolve(apiModuleDir, '../../..');

for (const envPath of [
  path.resolve(runtimeRoot, '.env'),
  path.resolve(runtimeRoot, 'apps/api/.env'),
  path.resolve(apiModuleDir, '..', '.env'),
  path.resolve(apiModuleDir, '../../.env')
]) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

declare module '@fastify/session' {
  interface FastifySessionObject {
    userId?: string;
    username?: string;
    role?: 'student' | 'professor';
    lastActivityAt?: number;
    sessionIssuedAt?: number;
    oidcState?: string;
    oidcCodeVerifier?: string;
  }
}

const server = Fastify({ logger: true });
const isPortableMode = process.env.MU_PORTABLE === '1' || process.env.MU_PORTABLE === 'true';
const shouldServeWeb = isPortableMode || process.env.MU_SERVE_WEB === '1' || process.env.MU_SERVE_WEB === 'true';
let IDLE_TIMEOUT_MS = 90 * 60 * 1000;
let SESSION_ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000;
const ACCOUNT_CLEANUP_INTERVAL_MS = 12 * 60 * 60 * 1000;
const SQL_IMPORT_SCHEDULER_INTERVAL_MS = 60 * 1000;
const OFFICE_CONNECTOR_SCHEDULER_INTERVAL_MS = 60 * 1000;
const REFERENCE_CONNECTOR_SCHEDULER_INTERVAL_MS = 60 * 1000;
let LOGIN_THROTTLE_WINDOW_MS = 15 * 60 * 1000;
let LOGIN_THROTTLE_MAX_FAILURES = 5;
let AUDIT_EXPORT_MAX_ROWS = 2000;
let BACKUP_RETENTION_DAYS = 30;
let LOCAL_AUTH_ENABLED = true;
let PASSWORD_MIN_LENGTH = 10;
let PASSWORD_REQUIRE_UPPERCASE = false;
let PASSWORD_REQUIRE_NUMBER = false;
let PASSWORD_REQUIRE_SYMBOL = false;
const AXION_SIDECAR_DEFAULT_URL = 'http://127.0.0.1:8765';
const AXION_SIDECAR_STARTUP_TIMEOUT_MS = 8000;
const AXION_SIDECAR_REQUEST_TIMEOUT_MS = 6000;
const isAxionSidecarEnabled = ['1', 'true'].includes(String(process.env.MU_AXION_SIDECAR_ENABLED ?? '').toLowerCase());
const isAxionSidecarAutostartEnabled = isAxionSidecarEnabled && !['0', 'false'].includes(String(process.env.MU_AXION_SIDECAR_AUTOSTART ?? '1').toLowerCase());
const isAxionPrefilterEnabled = isAxionSidecarEnabled && !['0', 'false'].includes(String(process.env.MU_AXION_PREFILTER_ENABLED ?? '1').toLowerCase());
const isAxionQeccGuardEnabled = isAxionSidecarEnabled && !['0', 'false'].includes(String(process.env.MU_AXION_QECC_GUARD_ENABLED ?? '1').toLowerCase());
let axionSidecarChild: ChildProcess | null = null;
let axionSidecarManagedByApi = false;
let axionSidecarStartedAt: string | null = null;
const isProduction = process.env.NODE_ENV === 'production';
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number; windowStartedAt: number }>();

const SOURCE_KINDS = new Set(['document', 'transcript', 'audio', 'video', 'pdf', 'dataset', 'survey'] as const);
const PROJECT_WORKSPACE_MODES = new Set(['solo', 'collaborative'] as const);
const VARIABLE_KINDS = new Set(['binary', 'categorical', 'continuous', 'text'] as const);
const ANALYSIS_KINDS = new Set(['manual', 'derived_code', 'imported', 'statistical_model', 'dataset_derivation'] as const);
const SEGMENT_KINDS = new Set(['text_range', 'time_range', 'page_region'] as const);
const MEMO_TARGET_TYPES = new Set(['project', 'source', 'segment', 'code', 'case', 'analysis_run'] as const);
const ATTRIBUTE_TARGET_TYPES = new Set(['case', 'source'] as const);
const ANNOTATION_TARGET_TYPES = new Set(['project', 'source', 'segment', 'code', 'case'] as const);
const RELATIONSHIP_TARGET_TYPES = new Set(['source', 'segment', 'code', 'case'] as const);
const RELATIONSHIP_TYPES = new Set(['see_also', 'supports', 'contradicts', 'follows_up'] as const);
const REFERENCE_TARGET_TYPES = new Set(['source', 'segment', 'memo', 'code', 'case', 'annotation'] as const);
const REFERENCE_SOURCE_FORMATS = new Set(['manual', 'ris', 'bibtex', 'csljson'] as const);
const REFERENCE_COLLECTION_COLOR_TOKENS = new Set([
  'blue', 'teal', 'green', 'amber', 'red', 'violet', 'slate'
] as const);

function parseSourceKind(value: unknown): 'document' | 'transcript' | 'audio' | 'video' | 'pdf' | 'dataset' | 'survey' {
  return typeof value === 'string' && SOURCE_KINDS.has(value as (typeof SOURCE_KINDS extends Set<infer T> ? T : never))
    ? value as 'document' | 'transcript' | 'audio' | 'video' | 'pdf' | 'dataset' | 'survey'
    : 'document';
}

function parseProjectWorkspaceMode(value: unknown): 'solo' | 'collaborative' {
  return typeof value === 'string' && PROJECT_WORKSPACE_MODES.has(value as (typeof PROJECT_WORKSPACE_MODES extends Set<infer T> ? T : never))
    ? value as 'solo' | 'collaborative'
    : 'solo';
}

function parseVariableKind(value: unknown): 'binary' | 'categorical' | 'continuous' | 'text' {
  return typeof value === 'string' && VARIABLE_KINDS.has(value as (typeof VARIABLE_KINDS extends Set<infer T> ? T : never))
    ? value as 'binary' | 'categorical' | 'continuous' | 'text'
    : 'binary';
}

function parseAnalysisKind(value: unknown): 'manual' | 'derived_code' | 'imported' | 'statistical_model' | 'dataset_derivation' {
  return typeof value === 'string' && ANALYSIS_KINDS.has(value as (typeof ANALYSIS_KINDS extends Set<infer T> ? T : never))
    ? value as 'manual' | 'derived_code' | 'imported' | 'statistical_model' | 'dataset_derivation'
    : 'derived_code';
}

function parseSegmentKind(value: unknown): 'text_range' | 'time_range' | 'page_region' {
  return typeof value === 'string' && SEGMENT_KINDS.has(value as (typeof SEGMENT_KINDS extends Set<infer T> ? T : never))
    ? value as 'text_range' | 'time_range' | 'page_region'
    : 'text_range';
}

function parseMemoTargetType(value: unknown): 'project' | 'source' | 'segment' | 'code' | 'case' | 'analysis_run' {
  return typeof value === 'string' && MEMO_TARGET_TYPES.has(value as (typeof MEMO_TARGET_TYPES extends Set<infer T> ? T : never))
    ? value as 'project' | 'source' | 'segment' | 'code' | 'case' | 'analysis_run'
    : 'project';
}

function parseAttributeTargetType(value: unknown): 'case' | 'source' {
  return typeof value === 'string' && ATTRIBUTE_TARGET_TYPES.has(value as (typeof ATTRIBUTE_TARGET_TYPES extends Set<infer T> ? T : never))
    ? value as 'case' | 'source'
    : 'case';
}

function parseAnnotationTargetType(value: unknown): 'project' | 'source' | 'segment' | 'code' | 'case' {
  return typeof value === 'string' && ANNOTATION_TARGET_TYPES.has(value as (typeof ANNOTATION_TARGET_TYPES extends Set<infer T> ? T : never))
    ? value as 'project' | 'source' | 'segment' | 'code' | 'case'
    : 'segment';
}

function parseRelationshipTargetType(value: unknown): 'source' | 'segment' | 'code' | 'case' {
  return typeof value === 'string' && RELATIONSHIP_TARGET_TYPES.has(value as (typeof RELATIONSHIP_TARGET_TYPES extends Set<infer T> ? T : never))
    ? value as 'source' | 'segment' | 'code' | 'case'
    : 'segment';
}

function parseRelationshipType(value: unknown): 'see_also' | 'supports' | 'contradicts' | 'follows_up' {
  return typeof value === 'string' && RELATIONSHIP_TYPES.has(value as (typeof RELATIONSHIP_TYPES extends Set<infer T> ? T : never))
    ? value as 'see_also' | 'supports' | 'contradicts' | 'follows_up'
    : 'see_also';
}

function parseReferenceTargetType(value: unknown): 'source' | 'segment' | 'memo' | 'code' | 'case' | 'annotation' {
  return typeof value === 'string' && REFERENCE_TARGET_TYPES.has(value as (typeof REFERENCE_TARGET_TYPES extends Set<infer T> ? T : never))
    ? value as 'source' | 'segment' | 'memo' | 'code' | 'case' | 'annotation'
    : 'source';
}

function parseReferenceSourceFormat(value: unknown): 'manual' | 'ris' | 'bibtex' | 'csljson' {
  return typeof value === 'string' && REFERENCE_SOURCE_FORMATS.has(value as (typeof REFERENCE_SOURCE_FORMATS extends Set<infer T> ? T : never))
    ? value as 'manual' | 'ris' | 'bibtex' | 'csljson'
    : 'manual';
}

function parseReferenceCollectionColorToken(value: unknown): 'blue' | 'teal' | 'green' | 'amber' | 'red' | 'violet' | 'slate' {
  return typeof value === 'string' && REFERENCE_COLLECTION_COLOR_TOKENS.has(value as (typeof REFERENCE_COLLECTION_COLOR_TOKENS extends Set<infer T> ? T : never))
    ? value as 'blue' | 'teal' | 'green' | 'amber' | 'red' | 'violet' | 'slate'
    : 'blue';
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseOptionalYear(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const year = Math.trunc(parsed);
  if (year < 1000 || year > 3000) return null;
  return year;
}

function parseCodingAssignmentStatus(value: unknown): 'todo' | 'in_progress' | 'blocked' | 'done' {
  return value === 'in_progress' || value === 'blocked' || value === 'done'
    ? value
    : 'todo';
}

function parseCodingAssignmentPriority(value: unknown): 'low' | 'normal' | 'high' {
  return value === 'low' || value === 'high'
    ? value
    : 'normal';
}

function parseOptionalIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function parseProvidedIsoDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function assertOptimisticTimestamp(
  reply: FastifyReply,
  options: {
    expectedValue: unknown;
    currentValue: string;
    label: string;
  }
): boolean {
  const expected = parseProvidedIsoDate(options.expectedValue);
  if (expected === undefined) return true;
  if (expected === null) {
    reply.status(400).send(fail('INVALID', `${options.label} expected timestamp must be a valid ISO date when provided.`));
    return false;
  }
  if (expected !== options.currentValue) {
    reply.status(409).send(fail('CONFLICT', `${options.label} was updated by another user. Refresh and retry.`));
    return false;
  }
  return true;
}

function parseMergeConflictStatusFilter(value: unknown): 'open' | 'resolved' | 'deferred' | 'reopened' | 'restored' | 'all' {
  return value === 'resolved' || value === 'deferred' || value === 'reopened' || value === 'restored' || value === 'all'
    ? value
    : 'open';
}

function parseCodingCalibrationStatus(value: unknown): 'draft' | 'running' | 'completed' | 'archived' {
  return value === 'running' || value === 'completed' || value === 'archived'
    ? value
    : 'draft';
}

function parseCodingConflictTriageStatus(value: unknown): 'open' | 'in_review' | 'ready_to_merge' | 'deferred' | 'escalated' | 'resolved' {
  return value === 'in_review' || value === 'ready_to_merge' || value === 'deferred' || value === 'escalated' || value === 'resolved'
    ? value
    : 'open';
}

function parseCodingConflictTriageSeverity(value: unknown): 'low' | 'medium' | 'high' | 'critical' {
  return value === 'low' || value === 'high' || value === 'critical'
    ? value
    : 'medium';
}

const AUDIO_UPLOAD_EXTENSIONS = new Set([
  '.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.opus', '.webm'
]);
const VIDEO_UPLOAD_EXTENSIONS = new Set([
  '.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm'
]);

const EXTENSION_CONTENT_TYPE_OVERRIDES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/opus',
  '.webm': 'audio/webm',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska'
};

const OFFICE_CONNECTOR_DEFAULT_EXTENSIONS = ['.docx', '.xlsx', '.xls', '.csv', '.pdf', '.txt', '.md', '.sav', '.zsav'];
const OFFICE_CONNECTOR_SUPPORTED_EXTENSIONS = new Set(OFFICE_CONNECTOR_DEFAULT_EXTENSIONS);
const OFFICE_CONNECTOR_MAX_FILES = 5000;
const REFERENCE_CONNECTOR_MAX_ROWS = 500;

function inferContentTypeFromFilename(filename: string, fallback = 'application/octet-stream'): string {
  const extension = path.extname(filename).toLowerCase();
  return EXTENSION_CONTENT_TYPE_OVERRIDES[extension] ?? fallback;
}

function inferMediaUploadSpec(filename: string, mimetype: string): {
  sourceKind: 'audio' | 'video';
  contentType: string;
  extension: string;
} | null {
  const extension = path.extname(filename).toLowerCase();
  const normalizedMime = String(mimetype || '').toLowerCase();
  const looksAudio = AUDIO_UPLOAD_EXTENSIONS.has(extension) || normalizedMime.startsWith('audio/');
  const looksVideo = VIDEO_UPLOAD_EXTENSIONS.has(extension) || normalizedMime.startsWith('video/');
  if (!looksAudio && !looksVideo) return null;
  const sourceKind: 'audio' | 'video' = looksVideo ? 'video' : 'audio';
  const contentType = inferContentTypeFromFilename(filename, normalizedMime || (sourceKind === 'video' ? 'video/mp4' : 'audio/mpeg'));
  const normalizedExtension = extension.replace(/^\./, '') || (sourceKind === 'video' ? 'mp4' : 'mp3');
  return { sourceKind, contentType, extension: normalizedExtension };
}

function parseArtifactReference(contentUrl: string | null | undefined): string | null {
  const raw = typeof contentUrl === 'string' ? contentUrl.trim() : '';
  if (!raw) return null;
  const prefixes = ['artifact://', 'storage://'];
  for (const prefix of prefixes) {
    if (raw.toLowerCase().startsWith(prefix)) {
      return raw.slice(prefix.length).replace(/^\/+/, '').replaceAll('\\', '/');
    }
  }
  return null;
}

function inferFilenameFromSource(source: { id: string; title: string; contentType: string; contentUrl: string | null }): string {
  const artifactPath = parseArtifactReference(source.contentUrl);
  if (artifactPath) {
    const base = path.basename(artifactPath).trim();
    if (base) return base;
  }
  const fromUrl = typeof source.contentUrl === 'string'
    ? (() => {
      try {
        const parsed = new URL(source.contentUrl);
        return path.basename(parsed.pathname || '').trim();
      } catch {
        return '';
      }
    })()
    : '';
  if (fromUrl) return fromUrl;
  const titleStem = source.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || source.id;
  const extensionEntry = Object.entries(EXTENSION_CONTENT_TYPE_OVERRIDES)
    .find(([, contentType]) => contentType.toLowerCase() === source.contentType.toLowerCase());
  const extension = extensionEntry?.[0] ?? '.bin';
  return `${titleStem}${extension}`;
}

async function resolveMediaSourceBytes(source: {
  id: string;
  contentType: string;
  contentUrl: string | null;
  title: string;
}): Promise<{ bytes: Buffer; contentType: string; filename: string; origin: 'artifact' | 'remote' | 'local_file' }> {
  const filename = inferFilenameFromSource(source);
  const contentType = source.contentType || inferContentTypeFromFilename(filename);
  const artifactPath = parseArtifactReference(source.contentUrl);
  if (artifactPath) {
    const bytes = await readStoredArtifact(artifactPath);
    return { bytes, contentType, filename, origin: 'artifact' };
  }

  const urlValue = typeof source.contentUrl === 'string' ? source.contentUrl.trim() : '';
  if (!urlValue) {
    throw new Error('The selected media source does not include a media URL or artifact reference.');
  }

  if (/^https?:\/\//i.test(urlValue)) {
    const response = await fetch(urlValue);
    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      throw new Error(`Unable to fetch media source URL (${response.status}). ${bodyText.slice(0, 240)}`.trim());
    }
    const remoteType = (response.headers.get('content-type') ?? '').split(';')[0]?.trim();
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0) {
      throw new Error('Fetched media source is empty.');
    }
    return {
      bytes,
      contentType: remoteType || contentType,
      filename,
      origin: 'remote'
    };
  }

  if (/^[a-zA-Z]:[\\/]/.test(urlValue) || urlValue.startsWith('\\\\')) {
    if (!existsSync(urlValue)) {
      throw new Error('Local media file path was not found on disk.');
    }
    const bytes = await readFile(urlValue);
    return {
      bytes: Buffer.from(bytes),
      contentType: inferContentTypeFromFilename(urlValue, contentType),
      filename: path.basename(urlValue) || filename,
      origin: 'local_file'
    };
  }

  throw new Error('Unsupported media source URL. Use http(s), an artifact:// path, or a local file path.');
}

function resolveAllowedOrigins(): string[] {
  const configured = (process.env.CORS_ORIGINS ?? process.env.APP_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  if (isProduction) {
    throw new Error('CORS_ORIGINS or APP_ORIGIN must be configured in production.');
  }

  if (shouldServeWeb) {
    return ['http://localhost:4000', 'http://127.0.0.1:4000'];
  }

  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
}

function resolveSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured) {
    return configured;
  }

  if (isProduction) {
    throw new Error('SESSION_SECRET must be configured in production.');
  }

  const generated = randomBytes(32).toString('hex');
  server.log.warn('SESSION_SECRET is not set. Using an ephemeral development secret for this process.');
  return generated;
}

function requireProjectId(reply: FastifyReply, projectId: unknown): string | null {
  const normalized = typeof projectId === 'string' && projectId.trim() ? projectId.trim() : '';
  if (!normalized) {
    void reply.status(400).send(fail('INVALID', 'projectId is required.'));
    return null;
  }
  return normalized;
}

const allowedOrigins = new Set(resolveAllowedOrigins());
const sessionSecret = resolveSessionSecret();
const oidcConfig = resolveOidcConfig(process.env);
const appOrigin = process.env.APP_ORIGIN?.trim() || [...allowedOrigins][0] || (shouldServeWeb ? 'http://localhost:4000' : 'http://localhost:3000');

await server.register(cors, {
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  }
});
await server.register(fastifyCookie);
const multipartFileSizeLimitBytes = Math.max(
  25 * 1024 * 1024,
  Number.parseInt(String(process.env.MU_UPLOAD_FILE_SIZE_LIMIT_MB ?? '250'), 10) * 1024 * 1024 || (250 * 1024 * 1024)
);
await server.register(fastifyMultipart, {
  limits: {
    fileSize: multipartFileSizeLimitBytes,
    files: 10
  }
});
await server.register(fastifySession, {
  secret: sessionSecret,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000
  }
});

server.addHook('onSend', async (_request, reply, payload) => {
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Referrer-Policy', 'same-origin');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  reply.header('Cross-Origin-Opener-Policy', 'same-origin');
  return payload;
});

if (shouldServeWeb) {
  const webDistCandidates = [
    path.resolve(runtimeRoot, 'apps/web/dist'),
    path.resolve(apiModuleDir, '../../web/dist')
  ];
  const webDistRoot = webDistCandidates.find((candidate) => existsSync(candidate));
  if (webDistRoot) {
    await server.register(fastifyStatic, {
      root: webDistRoot,
      prefix: '/'
    });
    server.get('/', async (_request, reply) => reply.sendFile('index.html'));
  } else {
    server.log.warn('MU_SERVE_WEB is enabled but no built web dist directory was found.');
  }
}

await initDatabase();
const initialGovernancePolicy = await getGovernancePolicy();
IDLE_TIMEOUT_MS = initialGovernancePolicy.idleTimeoutMinutes * 60 * 1000;
SESSION_ABSOLUTE_TIMEOUT_MS = initialGovernancePolicy.sessionAbsoluteTimeoutMinutes * 60 * 1000;
LOGIN_THROTTLE_WINDOW_MS = initialGovernancePolicy.loginThrottleWindowMinutes * 60 * 1000;
LOGIN_THROTTLE_MAX_FAILURES = initialGovernancePolicy.loginThrottleMaxFailures;
AUDIT_EXPORT_MAX_ROWS = initialGovernancePolicy.auditExportMaxRows;
BACKUP_RETENTION_DAYS = initialGovernancePolicy.backupRetentionDays;
LOCAL_AUTH_ENABLED = initialGovernancePolicy.localAuthEnabled;
PASSWORD_MIN_LENGTH = initialGovernancePolicy.passwordMinLength;
PASSWORD_REQUIRE_UPPERCASE = initialGovernancePolicy.passwordRequireUppercase;
PASSWORD_REQUIRE_NUMBER = initialGovernancePolicy.passwordRequireNumber;
PASSWORD_REQUIRE_SYMBOL = initialGovernancePolicy.passwordRequireSymbol;
await ensureAxionSidecarStarted();

server.addHook('onClose', async () => {
  shutdownAxionSidecar();
});

function scheduleExpiredAccountCleanup(): void {
  const timer = setInterval(async () => {
    try {
      const deleted = await deleteExpiredUsers();
      if (deleted > 0) {
        server.log.info({ deleted }, 'Deleted expired user accounts.');
      }
    } catch (error) {
      server.log.error(error, 'Failed to delete expired user accounts.');
    }
  }, ACCOUNT_CLEANUP_INTERVAL_MS);

  timer.unref();
}

scheduleExpiredAccountCleanup();

let sqlImportSchedulerRunning = false;
let officeConnectorSchedulerRunning = false;
let referenceConnectorSchedulerRunning = false;

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function assertAuth(request: FastifyRequest, reply: FastifyReply): Promise<string | null> {
  const userId = request.session.userId;
  if (!userId) {
    await reply.status(401).send(fail('UNAUTHORIZED', 'Login required.'));
    return null;
  }
  await deleteExpiredUsers();
  const sessionIssuedAt = request.session.sessionIssuedAt ?? request.session.lastActivityAt ?? Date.now();
  if (Date.now() - sessionIssuedAt > SESSION_ABSOLUTE_TIMEOUT_MS) {
    await request.session.destroy();
    await reply.status(401).send(fail('SESSION_EXPIRED', `Session expired after ${Math.round(SESSION_ABSOLUTE_TIMEOUT_MS / 60000)} minutes total duration.`));
    return null;
  }
  const lastActivityAt = request.session.lastActivityAt ?? Date.now();
  if (Date.now() - lastActivityAt > IDLE_TIMEOUT_MS) {
    await request.session.destroy();
    await reply.status(401).send(fail('SESSION_EXPIRED', `Session expired after ${Math.round(IDLE_TIMEOUT_MS / 60000)} minutes of inactivity.`));
    return null;
  }
  const user = await findUserById(userId);
  if (!user) {
    await request.session.destroy();
    await reply.status(401).send(fail('UNAUTHORIZED', 'Account not found or expired.'));
    return null;
  }
  return userId;
}

function setSessionUser(request: FastifyRequest, user: { id: string; username: string; role: 'student' | 'professor' }): void {
  request.session.userId = user.id;
  request.session.username = user.username;
  request.session.role = user.role;
  request.session.sessionIssuedAt = Date.now();
  request.session.lastActivityAt = Date.now();
}

async function assertProjectAccess(userId: string, projectId: string, reply: FastifyReply): Promise<boolean> {
  const hasAccess = await checkProjectAccess(userId, projectId);
  if (!hasAccess) {
    await reply.status(403).send(fail('FORBIDDEN', 'You do not have access to this project.'));
    return false;
  }
  return true;
}

async function assertProjectOwner(userId: string, projectId: string, reply: FastifyReply): Promise<boolean> {
  const membership = await getProjectMembership(userId, projectId);
  if (!membership) {
    await reply.status(403).send(fail('FORBIDDEN', 'You do not have access to this project.'));
    return false;
  }
  if (membership.role !== 'owner') {
    await reply.status(403).send(fail('FORBIDDEN', 'Only project owners can manage this project.'));
    return false;
  }
  return true;
}

async function assertProjectOwnerOrProfessor(request: FastifyRequest, userId: string, projectId: string, reply: FastifyReply): Promise<boolean> {
  const membership = await getProjectMembership(userId, projectId);
  if (!membership) {
    await reply.status(403).send(fail('FORBIDDEN', 'You do not have access to this project.'));
    return false;
  }
  if (membership.role === 'owner' || request.session.role === 'professor') {
    return true;
  }
  await reply.status(403).send(fail('FORBIDDEN', 'Owner or professor access is required.'));
  return false;
}

async function assertProjectExportAccess(request: FastifyRequest, userId: string, projectId: string, reply: FastifyReply): Promise<boolean> {
  const membership = await getProjectMembership(userId, projectId);
  if (!membership) {
    await reply.status(403).send(fail('FORBIDDEN', 'You do not have access to this project.'));
    return false;
  }
  if (membership.role === 'owner' || request.session.role === 'professor') {
    return true;
  }
  await reply.status(403).send(fail('FORBIDDEN', 'Only project owners and professor accounts can export project data or audit records.'));
  return false;
}

async function assertProfessor(request: FastifyRequest, reply: FastifyReply): Promise<string | null> {
  const userId = await assertAuth(request, reply);
  if (!userId) return null;
  if (request.session.role !== 'professor') {
    await reply.status(403).send(fail('FORBIDDEN', 'Professor access required.'));
    return null;
  }
  return userId;
}

function parseIsoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed).toISOString();
}

function validatePasswordAgainstPolicy(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (PASSWORD_REQUIRE_NUMBER && !/\d/.test(password)) {
    return 'Password must include at least one number.';
  }
  if (PASSWORD_REQUIRE_SYMBOL && !/[^\w\s]/.test(password)) {
    return 'Password must include at least one symbol.';
  }
  return null;
}

type OidcReadinessSnapshot = {
  enabled: boolean;
  providerName: string;
  issuerConfigured: boolean;
  clientIdConfigured: boolean;
  redirectUriConfigured: boolean;
  expectedAudienceConfigured: boolean;
  allowUserInfoFallback: boolean;
  missingFields: string[];
  redirectUriCheck: {
    valid: boolean;
    redirectOrigin: string | null;
    appOrigin: string | null;
    hostMatchesAppOrigin: boolean | null;
    callbackPath: string | null;
    message: string;
  };
  audienceCheck: {
    mode: 'missing' | 'client_id_default' | 'explicit';
    status: 'pass' | 'warn' | 'fail';
    expectedAudience: string | null;
    message: string;
  };
  discovery?: {
    ok: boolean;
    issuer?: string;
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    userInfoEndpoint?: string | null;
    jwksUri?: string | null;
    issuerMatchesConfig?: boolean;
    secureEndpoints?: boolean | null;
    probeElapsedMs?: number;
    errorCode?: 'timeout' | 'network' | 'response';
    error?: string;
  };
};

function normalizeOidcIssuer(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function classifyOidcProbeError(message: string): 'timeout' | 'network' | 'response' {
  const lowered = message.toLowerCase();
  if (lowered.includes('timeout') || lowered.includes('aborted')) {
    return 'timeout';
  }
  if (lowered.includes('status') || lowered.includes('missing required endpoints')) {
    return 'response';
  }
  return 'network';
}

async function buildOidcReadiness(probe = false): Promise<OidcReadinessSnapshot> {
  const missingFields: string[] = [];
  if (!oidcConfig.issuer) missingFields.push('OIDC_ISSUER');
  if (!oidcConfig.clientId) missingFields.push('OIDC_CLIENT_ID');
  if (!oidcConfig.redirectUri) missingFields.push('OIDC_REDIRECT_URI');
  if (!oidcConfig.expectedAudience) missingFields.push('OIDC_EXPECTED_AUDIENCE');
  const configuredAppOrigin = (process.env.APP_ORIGIN ?? '').trim();
  let redirectOrigin: string | null = null;
  let callbackPath: string | null = null;
  let redirectUriValid = true;
  let hostMatchesAppOrigin: boolean | null = null;
  let redirectMessage = 'Redirect URI not configured.';
  if (oidcConfig.redirectUri) {
    try {
      const redirectUrl = new URL(oidcConfig.redirectUri);
      redirectOrigin = redirectUrl.origin;
      callbackPath = redirectUrl.pathname;
      redirectMessage = `Redirect URI parses (${redirectUrl.origin}${redirectUrl.pathname}).`;
      if (configuredAppOrigin) {
        try {
          const appOriginUrl = new URL(configuredAppOrigin);
          hostMatchesAppOrigin = appOriginUrl.origin === redirectUrl.origin;
          if (!hostMatchesAppOrigin) {
            redirectMessage = `Redirect origin ${redirectUrl.origin} differs from APP_ORIGIN ${appOriginUrl.origin}.`;
          }
        } catch {
          hostMatchesAppOrigin = null;
          redirectMessage = 'APP_ORIGIN is invalid, so redirect host alignment cannot be verified.';
        }
      }
    } catch {
      redirectUriValid = false;
      redirectMessage = 'OIDC_REDIRECT_URI is not a valid absolute URL.';
    }
  }

  const explicitAudience = (process.env.OIDC_EXPECTED_AUDIENCE ?? '').trim();
  const audienceValue = oidcConfig.expectedAudience?.trim() || '';
  const audienceCheck: OidcReadinessSnapshot['audienceCheck'] = !audienceValue
    ? {
        mode: 'missing',
        status: 'fail',
        expectedAudience: null,
        message: 'Expected audience is missing; set OIDC_EXPECTED_AUDIENCE for strict ID token checks.'
      }
    : explicitAudience
      ? {
          mode: 'explicit',
          status: 'pass',
          expectedAudience: audienceValue,
          message: `Expected audience is explicitly configured as ${audienceValue}.`
        }
      : {
          mode: 'client_id_default',
          status: 'warn',
          expectedAudience: audienceValue,
          message: 'Expected audience currently defaults to OIDC_CLIENT_ID; set OIDC_EXPECTED_AUDIENCE explicitly for cutover.'
        };

  const readiness: OidcReadinessSnapshot = {
    enabled: oidcConfig.enabled,
    providerName: oidcConfig.providerName,
    issuerConfigured: Boolean(oidcConfig.issuer),
    clientIdConfigured: Boolean(oidcConfig.clientId),
    redirectUriConfigured: Boolean(oidcConfig.redirectUri),
    expectedAudienceConfigured: Boolean(oidcConfig.expectedAudience),
    allowUserInfoFallback: oidcConfig.allowUserInfoFallback,
    missingFields,
    redirectUriCheck: {
      valid: redirectUriValid,
      redirectOrigin,
      appOrigin: configuredAppOrigin || null,
      hostMatchesAppOrigin,
      callbackPath,
      message: redirectMessage
    },
    audienceCheck
  };
  if (!probe || !oidcConfig.enabled) return readiness;
  const probeStartedAt = Date.now();
  try {
    const metadata = await fetchOidcProviderMetadata(oidcConfig);
    const endpointList = [
      metadata.authorization_endpoint,
      metadata.token_endpoint,
      metadata.userinfo_endpoint,
      metadata.jwks_uri
    ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    const secureEndpoints = endpointList.length > 0
      ? endpointList.every((value) => {
          try {
            return new URL(value).protocol === 'https:';
          } catch {
            return false;
          }
        })
      : null;
    readiness.discovery = {
      ok: true,
      issuer: metadata.issuer,
      authorizationEndpoint: metadata.authorization_endpoint,
      tokenEndpoint: metadata.token_endpoint,
      userInfoEndpoint: metadata.userinfo_endpoint ?? null,
      jwksUri: metadata.jwks_uri ?? null,
      issuerMatchesConfig: normalizeOidcIssuer(metadata.issuer) === normalizeOidcIssuer(oidcConfig.issuer),
      secureEndpoints,
      probeElapsedMs: Math.max(0, Date.now() - probeStartedAt)
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OIDC discovery probe failed.';
    readiness.discovery = {
      ok: false,
      error: message,
      errorCode: classifyOidcProbeError(message),
      probeElapsedMs: Math.max(0, Date.now() - probeStartedAt)
    };
  }
  return readiness;
}

function validateDeploymentEnvironment(policy: {
  localAuthEnabled: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  sessionAbsoluteTimeoutMinutes: number;
}): Array<{ severity: 'error' | 'warning'; key: string; message: string }> {
  const issues: Array<{ severity: 'error' | 'warning'; key: string; message: string }> = [];
  const sessionSecret = process.env.SESSION_SECRET ?? '';
  if (sessionSecret.length < 32 || sessionSecret.includes('change-this-secret-key')) {
    issues.push({ severity: isProduction ? 'error' : 'warning', key: 'SESSION_SECRET', message: 'SESSION_SECRET should be a long random value and not the default placeholder.' });
  }
  const appOriginValue = process.env.APP_ORIGIN ?? '';
  try {
    new URL(appOriginValue);
  } catch {
    issues.push({ severity: 'error', key: 'APP_ORIGIN', message: 'APP_ORIGIN must be a valid absolute URL.' });
  }
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!isPortableMode && !databaseUrl.startsWith('postgresql://')) {
    issues.push({ severity: 'error', key: 'DATABASE_URL', message: 'DATABASE_URL must use a PostgreSQL connection string unless portable mode is enabled.' });
  }
  if (isPortableMode) {
    issues.push({ severity: 'warning', key: 'MU_PORTABLE', message: 'Portable mode uses an embedded local database. This is suitable for single-user portability, not multi-user shared deployment.' });
  }
  if (oidcConfig.enabled && !process.env.OIDC_REDIRECT_URI) {
    issues.push({ severity: 'error', key: 'OIDC_REDIRECT_URI', message: 'OIDC redirect URI is required when OIDC is enabled.' });
  }
  if (oidcConfig.enabled && !oidcConfig.expectedAudience) {
    issues.push({ severity: 'error', key: 'OIDC_EXPECTED_AUDIENCE', message: 'OIDC_EXPECTED_AUDIENCE (or OIDC_CLIENT_ID) is required for verified ID token audience checks.' });
  }
  if (oidcConfig.enabled && oidcConfig.redirectUri) {
    try {
      const redirectUrl = new URL(oidcConfig.redirectUri);
      if ((process.env.APP_ORIGIN ?? '').trim()) {
        try {
          const appOriginUrl = new URL(String(process.env.APP_ORIGIN));
          if (appOriginUrl.origin !== redirectUrl.origin) {
            issues.push({
              severity: isProduction ? 'error' : 'warning',
              key: 'OIDC_REDIRECT_URI_ORIGIN',
              message: `OIDC redirect origin (${redirectUrl.origin}) does not match APP_ORIGIN (${appOriginUrl.origin}).`
            });
          }
        } catch {
          issues.push({
            severity: 'warning',
            key: 'OIDC_REDIRECT_URI_ORIGIN',
            message: 'APP_ORIGIN is invalid, so OIDC redirect host alignment could not be checked.'
          });
        }
      }
      if (redirectUrl.pathname !== '/auth/oidc/callback') {
        issues.push({
          severity: 'warning',
          key: 'OIDC_REDIRECT_URI_PATH',
          message: `OIDC redirect path is ${redirectUrl.pathname}; expected /auth/oidc/callback for standard MU deployment.`
        });
      }
    } catch {
      issues.push({
        severity: 'error',
        key: 'OIDC_REDIRECT_URI_FORMAT',
        message: 'OIDC_REDIRECT_URI must be a valid absolute URL.'
      });
    }
  }
  if (oidcConfig.enabled && !(process.env.OIDC_EXPECTED_AUDIENCE ?? '').trim()) {
    issues.push({
      severity: 'warning',
      key: 'OIDC_EXPECTED_AUDIENCE_EXPLICIT',
      message: 'OIDC_EXPECTED_AUDIENCE is not explicitly set; it currently defaults to OIDC_CLIENT_ID.'
    });
  }
  if (!policy.localAuthEnabled && !oidcConfig.enabled) {
    issues.push({ severity: 'error', key: 'AUTH_MODE', message: 'Local auth is disabled by policy but OIDC is not configured. Users would be locked out.' });
  }
  if (policy.passwordMinLength < 10) {
    issues.push({ severity: 'warning', key: 'PASSWORD_MIN_LENGTH', message: 'Password minimum length below 10 is weaker than recommended for production deployments.' });
  }
  if (!policy.passwordRequireUppercase || !policy.passwordRequireNumber || !policy.passwordRequireSymbol) {
    issues.push({ severity: 'warning', key: 'PASSWORD_COMPLEXITY', message: 'Password complexity requirements are not fully enabled (uppercase, number, symbol).' });
  }
  if (policy.sessionAbsoluteTimeoutMinutes > 24 * 60) {
    issues.push({ severity: 'warning', key: 'SESSION_ABSOLUTE_TIMEOUT', message: 'Absolute session timeout exceeds 24 hours. Consider shorter sessions for deployment security.' });
  }
  const storageRoot = resolveStorageRoot();
  if (!existsSync(storageRoot)) {
    issues.push({ severity: 'warning', key: 'MU_STORAGE_ROOT', message: `Storage root does not exist yet: ${storageRoot}` });
  }
  return issues;
}

function findFirstExistingPath(paths: string[]): string | null {
  for (const candidate of paths) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolveOfficeExecutablePaths() {
  const configuredWordPath = process.env.MU_OFFICE_WORD_PATH?.trim() || '';
  const configuredExcelPath = process.env.MU_OFFICE_EXCEL_PATH?.trim() || '';
  return {
    configuredWordPath,
    configuredExcelPath,
    wordPath: findFirstExistingPath([
      configuredWordPath,
      'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
      'C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE'
    ]),
    excelPath: findFirstExistingPath([
      configuredExcelPath,
      'C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE',
      'C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\EXCEL.EXE'
    ])
  };
}

function resolveOfficeIntegrationStatus() {
  const { configuredWordPath, configuredExcelPath, wordPath, excelPath } = resolveOfficeExecutablePaths();
  const hookEnabled = ['1', 'true'].includes(String(process.env.MU_OFFICE_HOOK_ENABLED ?? '').toLowerCase());
  return {
    hookEnabled,
    searchPerformed: true,
    docxExport: true,
    xlsxExport: true,
    wordLaunchAvailable: Boolean(wordPath),
    excelLaunchAvailable: Boolean(excelPath),
    configuredWordPath: Boolean(configuredWordPath),
    configuredExcelPath: Boolean(configuredExcelPath)
  };
}

function resolveSqlIntegrationStatus() {
  const externalUrl = process.env.MU_SQL_EXTERNAL_URL?.trim() || '';
  return {
    embeddedPortable: isPortableMode,
    searchPerformed: true,
    localPostgresConfigured: Boolean(process.env.DATABASE_URL?.trim()),
    externalSqlHookEnabled: ['1', 'true'].includes(String(process.env.MU_SQL_HOOK_ENABLED ?? '').toLowerCase()),
    externalSqlConfigured: Boolean(externalUrl),
    activeMode: isPortableMode ? 'embedded-portable' : 'postgres-runtime'
  };
}

function resolveTranscriptionIntegrationStatus() {
  const openAiKey = process.env.OPENAI_API_KEY?.trim() || '';
  const openAiBaseUrl = process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1';
  const openAiModel = process.env.MU_TRANSCRIPTION_OPENAI_MODEL?.trim() || 'gpt-4o-mini-transcribe';
  return {
    providerReady: Boolean(openAiKey),
    provider: 'openai',
    model: openAiModel,
    baseUrlConfigured: Boolean(openAiBaseUrl),
    fallbackProvider: 'internal'
  };
}

type SemParityStrategy = 'integration_boundary' | 'native';

function resolveSemIntegrationStatus() {
  const rawStrategy = String(process.env.MU_SEM_PARITY_STRATEGY ?? 'integration_boundary').trim().toLowerCase();
  const strategy: SemParityStrategy = rawStrategy === 'native' ? 'native' : 'integration_boundary';
  const provider = String(process.env.MU_SEM_PROVIDER ?? 'amos').trim().toLowerCase() || 'amos';
  const bridgeEnabled = ['1', 'true'].includes(String(process.env.MU_SEM_HOOK_ENABLED ?? '').toLowerCase());
  const configuredAmosPath = process.env.MU_AMOS_EXECUTABLE_PATH?.trim() || '';
  const configuredBridgeScriptPath = process.env.MU_SEM_BRIDGE_SCRIPT_PATH?.trim() || 'services/spss/sem_bridge.py';
  const amosExecutablePath = findFirstExistingPath([
    configuredAmosPath,
    'C:\\Program Files\\IBM\\SPSS\\Amos\\Amos.exe',
    'C:\\Program Files (x86)\\IBM\\SPSS\\Amos\\Amos.exe'
  ]);
  const bridgeScriptPath = findFirstExistingPath([
    path.resolve(runtimeRoot, configuredBridgeScriptPath),
    path.resolve(workspaceRoot, configuredBridgeScriptPath)
  ]);
  return {
    strategy,
    provider,
    nativeSemImplemented: false,
    integrationBoundaryEnabled: strategy === 'integration_boundary',
    bridgeEnabled,
    amosExecutableConfigured: Boolean(configuredAmosPath),
    amosExecutableFound: Boolean(amosExecutablePath),
    bridgeScriptConfigured: Boolean(configuredBridgeScriptPath),
    bridgeScriptFound: Boolean(bridgeScriptPath),
    executionReady: bridgeEnabled && (Boolean(amosExecutablePath) || Boolean(bridgeScriptPath)),
    note: strategy === 'native'
      ? 'Native SEM execution is selected but not implemented yet; switch to integration_boundary for production today.'
      : 'SEM/AMOS parity is handled through an explicit integration boundary so provider execution can be governed separately from the quant engine.'
  };
}

function resolveAxionSidecarConfig() {
  const sidecarUrl = process.env.MU_AXION_SIDECAR_URL?.trim() || AXION_SIDECAR_DEFAULT_URL;
  const configuredScriptPath = process.env.MU_AXION_SIDECAR_SCRIPT_PATH?.trim() || 'services/axion/axion_sidecar.py';
  const configuredGenomePath = process.env.MU_AXION_PARALLEL_CUBED_GENOME?.trim() || 'services/axion/parallel_cubed_region_genome.json';
  const sidecarScriptPath = findFirstExistingPath([
    path.resolve(runtimeRoot, configuredScriptPath),
    path.resolve(workspaceRoot, configuredScriptPath)
  ]) ?? path.resolve(workspaceRoot, configuredScriptPath);
  const sidecarGenomePath = findFirstExistingPath([
    path.resolve(runtimeRoot, configuredGenomePath),
    path.resolve(workspaceRoot, configuredGenomePath)
  ]) ?? path.resolve(workspaceRoot, configuredGenomePath);
  const pythonCommand = process.env.MU_AXION_PYTHON_COMMAND?.trim() || 'py';
  const pythonArgs = (process.env.MU_AXION_PYTHON_ARGS?.trim() || '-3.11')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return {
    sidecarUrl,
    sidecarScriptPath,
    sidecarGenomePath,
    pythonCommand,
    pythonArgs
  };
}

function resolveAxionIntegrationStatusBase() {
  const config = resolveAxionSidecarConfig();
  return {
    enabled: isAxionSidecarEnabled,
    sidecarAutostart: isAxionSidecarAutostartEnabled,
    prefilterEnabled: isAxionPrefilterEnabled,
    qeccGuardEnabled: isAxionQeccGuardEnabled,
    configuredSidecarUrl: config.sidecarUrl,
    scriptFound: existsSync(config.sidecarScriptPath),
    genomeFound: existsSync(config.sidecarGenomePath),
    pythonCommand: config.pythonCommand,
    managedProcessRunning: Boolean(axionSidecarChild && !axionSidecarChild.killed),
    managedProcessStartedAt: axionSidecarStartedAt
  };
}

async function axionSidecarRequest<T>(method: 'GET' | 'POST', endpointPath: string, payload?: unknown, timeoutMs = AXION_SIDECAR_REQUEST_TIMEOUT_MS): Promise<T | null> {
  if (!isAxionSidecarEnabled) return null;
  const { sidecarUrl } = resolveAxionSidecarConfig();
  try {
    const target = new URL(endpointPath, sidecarUrl).toString();
    const response = await fetch(target, {
      method,
      headers: payload === undefined ? undefined : {
        'Content-Type': 'application/json'
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

async function waitForAxionSidecarReady(timeoutMs = AXION_SIDECAR_STARTUP_TIMEOUT_MS): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const health = await axionSidecarRequest<{ ok?: boolean }>('GET', '/health');
    if (health?.ok) return true;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

async function ensureAxionSidecarStarted(): Promise<void> {
  if (!isAxionSidecarEnabled || !isAxionSidecarAutostartEnabled) return;
  const alreadyReachable = await waitForAxionSidecarReady(1500);
  if (alreadyReachable) return;
  if (axionSidecarChild && !axionSidecarChild.killed) return;

  const config = resolveAxionSidecarConfig();
  if (!existsSync(config.sidecarScriptPath)) {
    server.log.warn({ path: config.sidecarScriptPath }, 'Axion sidecar script not found; sidecar was not started.');
    return;
  }
  if (!existsSync(config.sidecarGenomePath)) {
    server.log.warn({ path: config.sidecarGenomePath }, 'Axion genome file not found; sidecar was not started.');
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(config.sidecarUrl);
  } catch {
    server.log.warn({ sidecarUrl: config.sidecarUrl }, 'Invalid MU_AXION_SIDECAR_URL; sidecar was not started.');
    return;
  }
  const host = parsedUrl.hostname || '127.0.0.1';
  const port = Number(parsedUrl.port || 8765);
  if (!Number.isFinite(port) || port <= 0) {
    server.log.warn({ sidecarUrl: config.sidecarUrl }, 'Invalid Axion sidecar port; sidecar was not started.');
    return;
  }

  const child = spawn(config.pythonCommand, [
    ...config.pythonArgs,
    config.sidecarScriptPath,
    '--host',
    host,
    '--port',
    String(port),
    '--genome',
    config.sidecarGenomePath
  ], {
    cwd: runtimeRoot,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  axionSidecarChild = child;
  axionSidecarManagedByApi = true;
  axionSidecarStartedAt = new Date().toISOString();
  child.stdout?.on('data', (buffer) => {
    server.log.info({ output: buffer.toString().trim() }, 'Axion sidecar');
  });
  child.stderr?.on('data', (buffer) => {
    server.log.warn({ output: buffer.toString().trim() }, 'Axion sidecar stderr');
  });
  child.on('error', (error) => {
    server.log.error({ error }, 'Axion sidecar process failed to start.');
  });
  child.on('exit', (code, signal) => {
    server.log.warn({ code, signal }, 'Axion sidecar exited.');
    axionSidecarChild = null;
    axionSidecarManagedByApi = false;
  });

  const becameReady = await waitForAxionSidecarReady();
  if (!becameReady) {
    server.log.warn('Axion sidecar did not become ready within startup timeout.');
  }
}

async function getAxionIntegrationStatus() {
  const base = resolveAxionIntegrationStatusBase();
  const health = await axionSidecarRequest<{ ok?: boolean; health?: unknown }>('GET', '/health', undefined, 2000);
  const status = await axionSidecarRequest<{ ok?: boolean; status?: unknown }>('GET', '/status', undefined, 2000);
  return {
    ...base,
    reachable: Boolean(health?.ok),
    health: health?.health ?? null,
    sidecarStatus: status?.status ?? null
  };
}

function shutdownAxionSidecar(): void {
  if (!axionSidecarManagedByApi) return;
  if (!axionSidecarChild || axionSidecarChild.killed) return;
  try {
    axionSidecarChild.kill();
  } catch {
    // no-op
  }
  axionSidecarChild = null;
}

async function evaluateAxionQeccGuard(params: {
  jobType: 'sql-import' | 'transcription' | 'report-export';
  stage: string;
  projectId: string;
  retryCount?: number;
  errorRate?: number;
  durationSeconds?: number;
  load?: number;
  failedStage?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<{
  action: 'continue' | 'checkpoint' | 'rollback' | 'halt';
  reason: string;
  risk: number;
  level: string;
  recoveryState: string;
  qecc: {
    syndrome: number[];
    pLogical: number;
    pLogicalLimit: number;
  } | null;
}> {
  if (!isAxionQeccGuardEnabled) {
    return {
      action: 'continue',
      reason: 'axion qecc guard disabled',
      risk: 0,
      level: 'normal',
      recoveryState: 'steady',
      qecc: null
    };
  }
  const result = await axionSidecarRequest<{
    ok?: boolean;
    result?: {
      decision?: {
        action?: 'continue' | 'checkpoint' | 'rollback' | 'halt';
        reason?: string;
        risk?: number;
        level?: string;
        recovery_state?: string;
      };
      qecc?: {
        syndrome?: number[];
        p_logical?: number;
        p_logical_limit?: number;
      };
    };
  }>('POST', '/qecc/guard', {
    telemetry: {
      jobType: params.jobType,
      stage: params.stage,
      projectId: params.projectId,
      retryCount: params.retryCount ?? 0,
      errorRate: params.errorRate ?? 0,
      durationSeconds: params.durationSeconds ?? 0,
      load: params.load ?? 0,
      failedStage: params.failedStage === true,
      ...(params.metadata ?? {})
    }
  }, 2500);
  const decision = result?.result?.decision;
  const qecc = result?.result?.qecc;
  return {
    action: decision?.action ?? 'continue',
    reason: decision?.reason ?? 'qecc guard unavailable',
    risk: typeof decision?.risk === 'number' ? decision.risk : 0,
    level: decision?.level ?? 'normal',
    recoveryState: decision?.recovery_state ?? 'steady',
    qecc: qecc
      ? {
        syndrome: Array.isArray(qecc.syndrome) ? qecc.syndrome.map((bit) => Number(bit)).filter((bit) => Number.isFinite(bit)) : [],
        pLogical: typeof qecc.p_logical === 'number' ? qecc.p_logical : 0,
        pLogicalLimit: typeof qecc.p_logical_limit === 'number' ? qecc.p_logical_limit : 0
      }
      : null
  };
}

type ExternalSqlClientType = 'postgres' | 'sqlserver';

type ExternalSqlConnectionInput = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
};

function sanitizeExternalSqlProfile(profile: {
  id: string;
  projectId: string;
  label: string;
  clientType: ExternalSqlClientType;
  connectionJson: string;
  createdAt: string;
  updatedAt: string;
}) {
  const connection = JSON.parse(profile.connectionJson) as ExternalSqlConnectionInput;
  return {
    id: profile.id,
    projectId: profile.projectId,
    label: profile.label,
    clientType: profile.clientType,
    connection: {
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.user,
      ssl: Boolean(connection.ssl)
    },
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

function parseExternalSqlConnectionInput(value: unknown, clientType: ExternalSqlClientType): ExternalSqlConnectionInput {
  const body = (value ?? {}) as Partial<{
    host: string;
    port: number | string;
    database: string;
    user: string;
    password: string;
    ssl: boolean | string;
  }>;
  const host = typeof body.host === 'string' ? body.host.trim() : '';
  const database = typeof body.database === 'string' ? body.database.trim() : '';
  const user = typeof body.user === 'string' ? body.user.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const portNumber = Number(body.port ?? (clientType === 'sqlserver' ? 1433 : 5432));
  const ssl = body.ssl === true || body.ssl === 'true' || body.ssl === '1';
  if (!host || !database || !user || !password || !Number.isFinite(portNumber)) {
    throw new Error('Host, port, database, username, and password are required for the SQL profile.');
  }
  return {
    host,
    port: portNumber,
    database,
    user,
    password,
    ssl
  };
}

function quotePgIdentifier(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('SQL identifier is required.');
  return `"${trimmed.replaceAll('"', '""')}"`;
}

function quoteSqlServerIdentifier(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('SQL identifier is required.');
  return `[${trimmed.replaceAll(']', ']]')}]`;
}

function quoteExternalSqlIdentifier(clientType: ExternalSqlClientType, value: string): string {
  return clientType === 'sqlserver' ? quoteSqlServerIdentifier(value) : quotePgIdentifier(value);
}

function getExternalSqlDataType(clientType: ExternalSqlClientType, values: unknown[]): string {
  const nonNull = values.filter((value) => value !== null && value !== undefined);
  if (nonNull.length === 0) return 'TEXT';
  if (nonNull.every((value) => typeof value === 'boolean')) {
    return clientType === 'sqlserver' ? 'BIT' : 'BOOLEAN';
  }
  if (nonNull.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    const isInteger = nonNull.every((value) => Number.isInteger(value));
    if (clientType === 'sqlserver') {
      return isInteger ? 'BIGINT' : 'FLOAT';
    }
    return isInteger ? 'BIGINT' : 'DOUBLE PRECISION';
  }
  if (clientType === 'sqlserver') return 'NVARCHAR(MAX)';
  return 'TEXT';
}

function coerceSqlImportValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

function inferVariableKindFromSqlColumn(dataType: string): 'binary' | 'categorical' | 'continuous' | 'text' {
  const normalized = String(dataType ?? '').toLowerCase();
  if (['boolean'].includes(normalized)) return 'binary';
  if (/(int|numeric|decimal|double|real|float)/.test(normalized)) return 'continuous';
  if (/(char|text|uuid|json|jsonb)/.test(normalized)) return 'text';
  return 'categorical';
}

function normalizeSqlImportColumns(columns: unknown, fallback: string[] = []): string[] {
  const list = Array.isArray(columns) ? columns : fallback;
  return [...new Set(list.map((item) => String(item ?? '').trim()).filter(Boolean))];
}

function normalizeImportedVariableName(value: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeSqlExportMode(value: unknown): 'replace' | 'append' {
  return value === 'append' ? 'append' : 'replace';
}

function normalizeSqlWriteMode(value: unknown): 'replace' | 'append' | 'upsert' {
  if (value === 'append' || value === 'upsert') return value;
  return 'replace';
}

function inferExternalSqlExportColumnType(values: unknown[]): string {
  return getExternalSqlDataType('postgres', values);
}

function coerceExternalSqlExportValue(value: unknown, columnType: string): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (columnType === 'BOOLEAN' || columnType === 'BIT') return typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';
  if (columnType === 'BIGINT' || columnType === 'DOUBLE PRECISION' || columnType === 'FLOAT') return Number(value);
  return String(value);
}

function validateReadOnlySqlQuery(queryText: string): string {
  const trimmed = queryText.trim();
  if (!trimmed) {
    throw new Error('SQL query is required.');
  }
  const normalized = trimmed.replace(/\s+/g, ' ').toLowerCase();
  if (!(normalized.startsWith('select ') || normalized.startsWith('with '))) {
    throw new Error('Only single read-only SELECT or WITH queries are allowed.');
  }
  const forbiddenPatterns = [
    /\binsert\b/,
    /\bupdate\b/,
    /\bdelete\b/,
    /\bdrop\b/,
    /\balter\b/,
    /\bcreate\b/,
    /\btruncate\b/,
    /\bgrant\b/,
    /\brevoke\b/,
    /\bcopy\b/,
    /\bdo\b/,
    /\bcall\b/,
    /\bexecute\b/
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(normalized)) {
      throw new Error('Only read-only SELECT or WITH queries are allowed.');
    }
  }
  if (trimmed.includes(';')) {
    throw new Error('Only one SQL statement is allowed.');
  }
  return trimmed;
}

function normalizeSqlVariableColumns(value: unknown): Array<{ column: string; kind: 'binary' | 'categorical' | 'continuous' | 'text' }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      column: String((item as { column?: unknown })?.column ?? '').trim(),
      kind: parseVariableKind((item as { kind?: unknown })?.kind)
    }))
    .filter((item) => item.column);
}

function buildExternalSqlPreviewSelect(clientType: ExternalSqlClientType, schemaName: string, tableName: string, limit: number): string {
  const schemaIdent = quoteExternalSqlIdentifier(clientType, schemaName);
  const tableIdent = quoteExternalSqlIdentifier(clientType, tableName);
  if (clientType === 'sqlserver') {
    return `SELECT TOP (${limit}) * FROM ${schemaIdent}.${tableIdent}`;
  }
  return `SELECT * FROM ${schemaIdent}.${tableIdent} LIMIT ${limit}`;
}

function buildExternalSqlWrappedPreviewQuery(clientType: ExternalSqlClientType, sql: string, limit: number): string {
  if (clientType === 'sqlserver') {
    return `SELECT TOP (${limit}) * FROM (${sql}) AS mu_query_preview`;
  }
  return `SELECT * FROM (${sql}) AS mu_query_preview LIMIT ${limit}`;
}

function serializeExternalSqlImportJob(job: {
  id: string;
  projectId: string;
  profileId: string;
  label: string;
  schemaName: string;
  tableName: string;
  caseLabelColumn: string;
  selectedColumnsJson: string;
  variableColumnsJson: string;
  maxRows: number;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
  scheduleNextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunMessage: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    ...job,
    selectedColumns: JSON.parse(job.selectedColumnsJson),
    variableColumns: JSON.parse(job.variableColumnsJson)
  };
}

async function withPostgresClient<T>(connection: ExternalSqlConnectionInput, fn: (client: PgClient) => Promise<T>): Promise<T> {
  const client = new PgClient({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.user,
    password: connection.password,
    ssl: connection.ssl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 5000
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function withSqlServerPool<T>(connection: ExternalSqlConnectionInput, fn: (pool: mssql.ConnectionPool) => Promise<T>): Promise<T> {
  const pool = await new mssql.ConnectionPool({
    server: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.user,
    password: connection.password,
    options: {
      encrypt: connection.ssl,
      trustServerCertificate: true
    },
    pool: {
      max: 4,
      min: 0,
      idleTimeoutMillis: 5000
    }
  }).connect();
  try {
    return await fn(pool);
  } finally {
    await pool.close().catch(() => undefined);
  }
}

async function testExternalSqlConnection(clientType: ExternalSqlClientType, connection: ExternalSqlConnectionInput): Promise<void> {
  if (clientType === 'sqlserver') {
    await withSqlServerPool(connection, async (pool) => {
      await pool.request().query('SELECT 1');
    });
    return;
  }
  await withPostgresClient(connection, async (client) => {
    await client.query('SELECT 1');
  });
}

async function importExternalSqlTable(params: {
  projectId: string;
  profileId: string;
  profileLabel: string;
  clientType: ExternalSqlClientType;
  connection: ExternalSqlConnectionInput;
  schemaName: string;
  tableName: string;
  caseLabelColumn: string;
  maxRows: number;
  selectedColumns: string[];
  variableColumns: Array<{ column: string; kind: 'binary' | 'categorical' | 'continuous' | 'text' }>;
  refreshJobId?: string | null;
}): Promise<{ casesCreated: number; attributesCreated: number; rowCount: number; labelColumn: string; variablesCreated: number; removedPriorCases: number; }> {
  const existingVariables = await listVariables(params.projectId);
  const variableByName = new Set(existingVariables.map((item) => item.name));
  const variableColumnsMap = new Map(params.variableColumns.map((item) => [item.column, item.kind]));
  const removedPriorCases = params.refreshJobId ? await deleteCasesImportedBySqlJob(params.projectId, params.refreshJobId) : 0;

  const processRows = async (rows: Array<Record<string, unknown>>) => {
    let casesCreated = 0;
    let attributesCreated = 0;
    let variablesCreated = 0;

    for (const row of rows) {
      const caseLabel = String(row[params.caseLabelColumn] ?? '').trim();
      if (!caseLabel) continue;
      const createdAt = new Date().toISOString();
      const caseEntity = createCase({
        id: `case-${randomUUID()}`,
        projectId: params.projectId,
        label: caseLabel,
        sourceIds: [],
        createdAt,
        updatedAt: createdAt
      });
      await insertCase(caseEntity);
      casesCreated += 1;

      if (params.refreshJobId) {
        const marker = createAttribute({
          id: `attribute-${randomUUID()}`,
          projectId: params.projectId,
          targetType: 'case',
          targetId: caseEntity.id,
          name: '_sql_import_job_id',
          value: params.refreshJobId,
          createdAt
        });
        await insertAttribute(marker);
        attributesCreated += 1;
      }

      for (const column of params.selectedColumns) {
        if (column === params.caseLabelColumn) continue;
        const value = coerceSqlImportValue((row as Record<string, unknown>)[column]);
        if (value === null) continue;
        const attribute = createAttribute({
          id: `attribute-${randomUUID()}`,
          projectId: params.projectId,
          targetType: 'case',
          targetId: caseEntity.id,
          name: column,
          value,
          createdAt
        });
        await insertAttribute(attribute);
        attributesCreated += 1;
      }
    }

    for (const [column, kind] of variableColumnsMap.entries()) {
      const variableName = normalizeImportedVariableName(column);
      if (!variableName || variableByName.has(variableName)) continue;
      const timestamp = new Date().toISOString();
      await insertVariable(createVariable({
        id: `variable-${randomUUID()}`,
        projectId: params.projectId,
        name: variableName,
        label: column,
        kind,
        sourceKind: 'imported',
        derivedFromCodeId: null,
        derivationRule: 'presence',
        createdAt: timestamp,
        updatedAt: timestamp
      }));
      variableByName.add(variableName);
      variablesCreated += 1;
    }

    return {
      casesCreated,
      attributesCreated,
      rowCount: rows.length,
      labelColumn: params.caseLabelColumn,
      variablesCreated,
      removedPriorCases
    };
  };

  if (params.clientType === 'sqlserver') {
    return withSqlServerPool(params.connection, async (pool) => {
      const env = await pool.request().query(buildExternalSqlPreviewSelect('sqlserver', params.schemaName, params.tableName, params.maxRows));
      return processRows((env.recordset ?? []) as Array<Record<string, unknown>>);
    });
  }

  return withPostgresClient(params.connection, async (client) => {
    const { rows } = await client.query(buildExternalSqlPreviewSelect('postgres', params.schemaName, params.tableName, params.maxRows));
    return processRows(rows as Array<Record<string, unknown>>);
  });
}

async function exportDatasetToExternalSqlTable(params: {
  projectId: string;
  profileId: string;
  profileLabel: string;
  clientType: ExternalSqlClientType;
  connection: ExternalSqlConnectionInput;
  schemaName: string;
  tableName: string;
  mode: 'replace' | 'append' | 'upsert';
  keyField?: string | null;
  targetKeyColumn?: string | null;
  rows: Array<Record<string, string | number | boolean | null>>;
}): Promise<{
  rowsExported: number;
  columnsExported: number;
  tableCreated: boolean;
  tableReplaced: boolean;
  mode: 'replace' | 'append' | 'upsert';
}> {
  const rows = params.rows ?? [];
  const columnNames = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (columnNames.length === 0) {
    throw new Error('The dataset has no rows to export.');
  }
  if (params.mode === 'upsert' && (!params.keyField || !params.targetKeyColumn)) {
    throw new Error('keyField and targetKeyColumn are required for upsert exports.');
  }
  if (params.mode === 'upsert' && !columnNames.includes(params.keyField!)) {
    throw new Error(`Dataset key field "${params.keyField}" was not found in the export dataset.`);
  }

  const columnTypes = new Map(
    columnNames.map((columnName) => [
      columnName,
      getExternalSqlDataType(params.clientType, rows.map((row) => row[columnName]))
    ])
  );

  if (params.clientType === 'sqlserver') {
    return withSqlServerPool(params.connection, async (pool) => {
      const schemaIdent = quoteExternalSqlIdentifier('sqlserver', params.schemaName);
      const tableIdent = quoteExternalSqlIdentifier('sqlserver', params.tableName);
      const tx = new mssql.Transaction(pool);
      let tableCreated = false;
      let tableReplaced = false;
      await tx.begin();
      try {
        await new mssql.Request(tx).query(`IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'${params.schemaName.replaceAll("'", "''")}') EXEC('CREATE SCHEMA ${schemaIdent}')`);
        if (params.mode === 'replace') {
          await new mssql.Request(tx).query(`IF OBJECT_ID(N'${params.schemaName.replaceAll("'", "''")}.${params.tableName.replaceAll("'", "''")}', 'U') IS NOT NULL DROP TABLE ${schemaIdent}.${tableIdent}`);
          tableReplaced = true;
        }
        const tableExistsEnv = await new mssql.Request(tx)
          .input('schemaName', mssql.NVarChar, params.schemaName)
          .input('tableName', mssql.NVarChar, params.tableName)
          .query(`SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @tableName`);
        const tableExists = Number(tableExistsEnv.recordset?.[0]?.count ?? 0) > 0;
        if (!tableExists) {
          const columnSql = columnNames.map((columnName) => `${quoteExternalSqlIdentifier('sqlserver', columnName)} ${columnTypes.get(columnName) ?? 'NVARCHAR(MAX)'}`).join(', ');
          await new mssql.Request(tx).query(`CREATE TABLE ${schemaIdent}.${tableIdent} (${columnSql})`);
          tableCreated = true;
        } else {
          const existingColumnsEnv = await new mssql.Request(tx)
            .input('schemaName', mssql.NVarChar, params.schemaName)
            .input('tableName', mssql.NVarChar, params.tableName)
            .query(`SELECT COLUMN_NAME AS column_name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @tableName`);
          const existingColumnNames = new Set((existingColumnsEnv.recordset ?? []).map((row: { column_name?: unknown }) => String(row.column_name ?? '')));
          const missingColumns = columnNames.filter((columnName) => !existingColumnNames.has(columnName));
          if (missingColumns.length > 0) {
            throw new Error(`Target table is missing export columns: ${missingColumns.join(', ')}`);
          }
        }
        if (params.mode === 'upsert') {
          const keyValues = [...new Set(rows.map((row) => row[params.keyField!]).filter((value) => value !== null && value !== undefined))];
          if (keyValues.length > 0) {
            const deleteRequest = new mssql.Request(tx);
            const keyParams = keyValues.map((value, index) => {
              const paramName = `key${index}`;
              deleteRequest.input(paramName, coerceExternalSqlExportValue(value, columnTypes.get(params.keyField!) ?? 'NVARCHAR(MAX)') as mssql.ISqlTypeFactoryWithNoParams | any);
              return `@${paramName}`;
            });
            await deleteRequest.query(`DELETE FROM ${schemaIdent}.${tableIdent} WHERE ${quoteExternalSqlIdentifier('sqlserver', params.targetKeyColumn!)} IN (${keyParams.join(', ')})`);
          }
        }
        for (const row of rows) {
          const request = new mssql.Request(tx);
          const placeholders = columnNames.map((columnName, index) => {
            const paramName = `p${index}`;
            request.input(paramName, coerceExternalSqlExportValue(row[columnName], columnTypes.get(columnName) ?? 'NVARCHAR(MAX)') as any);
            return `@${paramName}`;
          });
          await request.query(`INSERT INTO ${schemaIdent}.${tableIdent} (${columnNames.map((columnName) => quoteExternalSqlIdentifier('sqlserver', columnName)).join(', ')}) VALUES (${placeholders.join(', ')})`);
        }
        await tx.commit();
        return { rowsExported: rows.length, columnsExported: columnNames.length, tableCreated, tableReplaced, mode: params.mode };
      } catch (error) {
        await tx.rollback().catch(() => undefined);
        throw error;
      }
    });
  }

  return withPostgresClient(params.connection, async (client) => {
    const schemaIdent = quoteExternalSqlIdentifier('postgres', params.schemaName);
    const tableIdent = quoteExternalSqlIdentifier('postgres', params.tableName);
    let tableCreated = false;
    let tableReplaced = false;

    await client.query('BEGIN');
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaIdent}`);

      if (params.mode === 'replace') {
        await client.query(`DROP TABLE IF EXISTS ${schemaIdent}.${tableIdent}`);
        tableReplaced = true;
      }

      const existingTableEnv = await client.query(
        `SELECT EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = $1 AND table_name = $2
         ) AS exists`,
        [params.schemaName, params.tableName]
      );
      const tableExists = Boolean(existingTableEnv.rows[0]?.exists);

      if (!tableExists) {
        const columnSql = columnNames
          .map((columnName) => `${quoteExternalSqlIdentifier('postgres', columnName)} ${columnTypes.get(columnName) ?? 'TEXT'}`)
          .join(', ');
        await client.query(`CREATE TABLE ${schemaIdent}.${tableIdent} (${columnSql})`);
        tableCreated = true;
      } else {
        const existingColumnsEnv = await client.query(
          `SELECT column_name
           FROM information_schema.columns
           WHERE table_schema = $1 AND table_name = $2`,
          [params.schemaName, params.tableName]
        );
        const existingColumnNames = new Set(existingColumnsEnv.rows.map((row) => String(row.column_name ?? '')));
        const missingColumns = columnNames.filter((columnName) => !existingColumnNames.has(columnName));
        if (missingColumns.length > 0) {
          throw new Error(`Target table is missing export columns: ${missingColumns.join(', ')}`);
        }
      }

      if (params.mode === 'upsert') {
        const keyValues = [...new Set(rows.map((row) => row[params.keyField!]).filter((value) => value !== null && value !== undefined))];
        if (keyValues.length > 0) {
          await client.query(
            `DELETE FROM ${schemaIdent}.${tableIdent} WHERE ${quoteExternalSqlIdentifier('postgres', params.targetKeyColumn!)} = ANY($1::text[])`,
            [keyValues.map((value) => String(value))]
          );
        }
      }

      const batchSize = 200;
      for (let index = 0; index < rows.length; index += batchSize) {
        const batch = rows.slice(index, index + batchSize);
        const values: Array<string | number | boolean | null> = [];
        const tupleSql = batch.map((row, rowIndex) => {
          const placeholders = columnNames.map((columnName, columnIndex) => {
            const parameterIndex = rowIndex * columnNames.length + columnIndex + 1;
            values.push(coerceExternalSqlExportValue(row[columnName], columnTypes.get(columnName) ?? 'TEXT'));
            return `$${parameterIndex}`;
          });
          return `(${placeholders.join(', ')})`;
        }).join(', ');
        const insertSql = `INSERT INTO ${schemaIdent}.${tableIdent} (${columnNames.map((columnName) => quoteExternalSqlIdentifier('postgres', columnName)).join(', ')}) VALUES ${tupleSql}`;
        await client.query(insertSql, values);
      }

      await client.query('COMMIT');
      return { rowsExported: rows.length, columnsExported: columnNames.length, tableCreated, tableReplaced, mode: params.mode };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    }
  });
}

function resolveOfficeLauncherApp(targetApp: 'word' | 'excel' | 'default'): string | null {
  const officePaths = resolveOfficeExecutablePaths();
  if (targetApp === 'word') return officePaths.wordPath;
  if (targetApp === 'excel') return officePaths.excelPath;
  return null;
}

function escapePowerShellArgument(value: string): string {
  return value.replaceAll("'", "''");
}

function launchOfficeFile(params: {
  targetApp: 'word' | 'excel' | 'default';
  absolutePath: string;
}): void {
  if (process.platform !== 'win32') {
    throw new Error('Office launch integration currently supports Windows only.');
  }
  const appPath = resolveOfficeLauncherApp(params.targetApp);
  const filePath = escapePowerShellArgument(params.absolutePath);
  const command = appPath
    ? `Start-Process -FilePath '${escapePowerShellArgument(appPath)}' -ArgumentList '${filePath}'`
    : `Start-Process -FilePath '${filePath}'`;
  const child = spawn('powershell.exe', ['-NoProfile', '-Command', command], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
}

function resolveManagedArtifactPath(relativePath: string): string {
  const root = resolveStorageRoot(process.env);
  const normalized = path.normalize(relativePath);
  const absolutePath = path.resolve(root, normalized);
  if (!absolutePath.startsWith(path.resolve(root))) {
    throw new Error('Artifact path is outside the storage root.');
  }
  return absolutePath;
}

function clampSqlImportMaxRows(value: unknown, fallback = 500): number {
  return Math.min(5000, Math.max(1, Number(value ?? fallback) || fallback));
}

function clampSqlScheduleIntervalMinutes(value: unknown): number {
  return Math.min(7 * 24 * 60, Math.max(15, Number(value ?? 60) || 60));
}

function computeSqlImportScheduleNextRunAt(scheduleEnabled: boolean, scheduleIntervalMinutes: number | null, baseIso = new Date().toISOString()): string | null {
  if (!scheduleEnabled || !scheduleIntervalMinutes) return null;
  const next = new Date(baseIso);
  next.setUTCMinutes(next.getUTCMinutes() + scheduleIntervalMinutes);
  return next.toISOString();
}

function parseJsonObject(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function parseJsonArray(value: string | null | undefined): unknown[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeOfficeConnectorExtensions(value: unknown): string[] {
  const extensions = parseStringArray(value)
    .map((item) => item.toLowerCase())
    .map((item) => item.startsWith('.') ? item : `.${item}`)
    .filter((item) => OFFICE_CONNECTOR_SUPPORTED_EXTENSIONS.has(item));
  return extensions.length > 0 ? [...new Set(extensions)] : [...OFFICE_CONNECTOR_DEFAULT_EXTENSIONS];
}

function clampOfficeConnectorMaxFiles(value: unknown, fallback = 500): number {
  return Math.min(OFFICE_CONNECTOR_MAX_FILES, Math.max(1, Number(value ?? fallback) || fallback));
}

function clampReferenceConnectorMaxRows(value: unknown, fallback = 50): number {
  return Math.min(REFERENCE_CONNECTOR_MAX_ROWS, Math.max(1, Number(value ?? fallback) || fallback));
}

function parseReferenceConnectorProvider(value: unknown): 'crossref' | 'openalex' {
  return value === 'openalex' ? 'openalex' : 'crossref';
}

function serializeOfficeConnectorProfile(profile: {
  id: string;
  projectId: string;
  label: string;
  rootPath: string;
  includeSubdirectories: boolean;
  allowedExtensionsJson: string;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    ...profile,
    allowedExtensions: normalizeOfficeConnectorExtensions(parseJsonArray(profile.allowedExtensionsJson))
  };
}

function serializeOfficeConnectorJob(job: {
  id: string;
  projectId: string;
  profileId: string;
  label: string;
  syncOptionsJson: string;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
  scheduleNextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunMessage: string | null;
  lastRunStatsJson: string;
  createdAt: string;
  updatedAt: string;
}) {
  const syncOptionsRaw = parseJsonObject(job.syncOptionsJson);
  const lastRunStats = parseJsonObject(job.lastRunStatsJson);
  return {
    ...job,
    syncOptions: {
      maxFiles: clampOfficeConnectorMaxFiles(syncOptionsRaw.maxFiles, 500),
      forceResync: syncOptionsRaw.forceResync === true
    },
    lastRunStats
  };
}

function serializeReferenceConnectorProfile(profile: {
  id: string;
  projectId: string;
  label: string;
  provider: 'crossref' | 'openalex';
  settingsJson: string;
  createdAt: string;
  updatedAt: string;
}) {
  const settings = parseJsonObject(profile.settingsJson);
  return {
    ...profile,
    settings: {
      mailto: typeof settings.mailto === 'string' ? settings.mailto : '',
      hasApiKey: typeof settings.apiKey === 'string' && settings.apiKey.trim().length > 0
    }
  };
}

function serializeReferenceConnectorJob(job: {
  id: string;
  projectId: string;
  profileId: string;
  label: string;
  queryJson: string;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
  scheduleNextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunMessage: string | null;
  lastRunStatsJson: string;
  createdAt: string;
  updatedAt: string;
}) {
  const query = parseJsonObject(job.queryJson);
  const lastRunStats = parseJsonObject(job.lastRunStatsJson);
  return {
    ...job,
    query: {
      text: typeof query.text === 'string' ? query.text : '',
      maxRows: clampReferenceConnectorMaxRows(query.maxRows, 50),
      skipDuplicates: query.skipDuplicates !== false
    },
    lastRunStats
  };
}

type OfficeConnectorDiscoveredFile = {
  absolutePath: string;
  relativePath: string;
  filename: string;
  extension: string;
  size: number;
  mtimeMs: number;
  modifiedAt: string;
};

async function collectOfficeConnectorFiles(params: {
  rootPath: string;
  includeSubdirectories: boolean;
  allowedExtensions: string[];
  maxFiles: number;
}): Promise<OfficeConnectorDiscoveredFile[]> {
  const resolvedRoot = path.resolve(params.rootPath);
  let rootStats;
  try {
    rootStats = await stat(resolvedRoot);
  } catch {
    throw new Error(`Office connector root path was not found: ${resolvedRoot}`);
  }
  if (!rootStats.isDirectory()) {
    throw new Error('Office connector root path must be a directory.');
  }
  const allowed = new Set(params.allowedExtensions.map((item) => item.toLowerCase()));
  const queue = [resolvedRoot];
  const files: OfficeConnectorDiscoveredFile[] = [];
  while (queue.length > 0 && files.length < params.maxFiles) {
    const currentDir = queue.shift();
    if (!currentDir) continue;
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= params.maxFiles) break;
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (params.includeSubdirectories) queue.push(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      if (!allowed.has(extension)) continue;
      const fileStats = await stat(absolutePath);
      const relativePath = path.relative(resolvedRoot, absolutePath).replaceAll('\\', '/');
      files.push({
        absolutePath,
        relativePath,
        filename: entry.name,
        extension,
        size: Number(fileStats.size ?? 0),
        mtimeMs: Number(fileStats.mtimeMs ?? 0),
        modifiedAt: fileStats.mtime.toISOString()
      });
    }
  }
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return files;
}

function makeOfficeConnectorFileMarker(profileId: string, relativePath: string): string {
  const normalizedPath = relativePath.replaceAll('\\', '/').replace(/^\/+/, '');
  return `office-connector://${encodeURIComponent(profileId)}/${normalizedPath}`;
}

function makeOfficeConnectorCaseFileKey(profileId: string, relativePath: string): string {
  const normalizedPath = relativePath.replaceAll('\\', '/').replace(/^\/+/, '');
  return `${profileId}:${normalizedPath}`;
}

type ReferenceConnectorCandidate = {
  provider: 'crossref' | 'openalex';
  externalId: string;
  title: string;
  authors: string[];
  year: number | null;
  containerTitle: string;
  publisher: string;
  doi: string;
  url: string;
  abstractText: string;
  keywords: string[];
  referenceType: string;
  raw: Record<string, unknown>;
};

function stripMarkup(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeOpenAlexAbstract(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  const invertedIndex = value as Record<string, unknown>;
  const positionedWords: Array<{ index: number; word: string }> = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (!Array.isArray(positions)) continue;
    for (const position of positions) {
      const index = Number(position);
      if (!Number.isFinite(index)) continue;
      positionedWords.push({ index, word });
    }
  }
  positionedWords.sort((a, b) => a.index - b.index);
  return positionedWords.map((item) => item.word).join(' ').trim();
}

async function searchReferenceProvider(params: {
  provider: 'crossref' | 'openalex';
  queryText: string;
  maxRows: number;
  settings: Record<string, unknown>;
}): Promise<ReferenceConnectorCandidate[]> {
  const queryText = params.queryText.trim();
  if (!queryText) {
    throw new Error('Reference connector query text is required.');
  }
  if (params.provider === 'openalex') {
    const query = new URLSearchParams({
      search: queryText,
      'per-page': String(params.maxRows)
    });
    if (typeof params.settings.mailto === 'string' && params.settings.mailto.trim()) {
      query.set('mailto', params.settings.mailto.trim());
    }
    const response = await fetch(`https://api.openalex.org/works?${query.toString()}`, {
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      throw new Error(`OpenAlex request failed (${response.status}).`);
    }
    const payload = await response.json() as {
      results?: Array<Record<string, unknown>>;
    };
    const items = Array.isArray(payload.results) ? payload.results : [];
    return items.map((item, index) => {
      const authorships = Array.isArray(item.authorships) ? item.authorships : [];
      const authors = authorships
        .map((entry) => {
          const author = (entry as { author?: { display_name?: unknown } }).author;
          return typeof author?.display_name === 'string' ? author.display_name.trim() : '';
        })
        .filter(Boolean);
      const concepts = Array.isArray(item.concepts) ? item.concepts : [];
      const keywords = concepts
        .slice(0, 8)
        .map((concept) => typeof (concept as { display_name?: unknown }).display_name === 'string'
          ? String((concept as { display_name?: unknown }).display_name).trim()
          : '')
        .filter(Boolean);
      const ids = item.ids && typeof item.ids === 'object' && !Array.isArray(item.ids)
        ? item.ids as Record<string, unknown>
        : {};
      const doiRaw = typeof ids.doi === 'string' ? ids.doi : '';
      const doi = doiRaw.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
      const primaryLocation = item.primary_location && typeof item.primary_location === 'object' && !Array.isArray(item.primary_location)
        ? item.primary_location as Record<string, unknown>
        : {};
      const source = primaryLocation.source && typeof primaryLocation.source === 'object' && !Array.isArray(primaryLocation.source)
        ? primaryLocation.source as Record<string, unknown>
        : {};
      const externalId = typeof item.id === 'string' && item.id.trim()
        ? item.id.trim()
        : `openalex-${index + 1}`;
      return {
        provider: 'openalex' as const,
        externalId,
        title: typeof item.title === 'string' ? item.title.trim() : 'Untitled reference',
        authors,
        year: Number.isFinite(Number(item.publication_year)) ? Number(item.publication_year) : null,
        containerTitle: typeof source.display_name === 'string' ? source.display_name.trim() : '',
        publisher: typeof source.host_organization_name === 'string' ? source.host_organization_name.trim() : '',
        doi,
        url: typeof primaryLocation.landing_page_url === 'string' && primaryLocation.landing_page_url.trim()
          ? primaryLocation.landing_page_url.trim()
          : (typeof ids.openalex === 'string' ? ids.openalex.trim() : ''),
        abstractText: decodeOpenAlexAbstract(item.abstract_inverted_index),
        keywords,
        referenceType: typeof item.type === 'string' && item.type.trim() ? item.type.trim() : 'article',
        raw: item
      };
    });
  }

  const query = new URLSearchParams({
    'query.bibliographic': queryText,
    rows: String(params.maxRows),
    select: 'DOI,title,author,issued,container-title,publisher,URL,abstract,type,subject'
  });
  if (typeof params.settings.mailto === 'string' && params.settings.mailto.trim()) {
    query.set('mailto', params.settings.mailto.trim());
  }
  const response = await fetch(`https://api.crossref.org/works?${query.toString()}`, {
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    throw new Error(`Crossref request failed (${response.status}).`);
  }
  const payload = await response.json() as {
    message?: { items?: Array<Record<string, unknown>> };
  };
  const items = Array.isArray(payload.message?.items) ? payload.message.items : [];
  return items.map((item, index) => {
    const authors = Array.isArray(item.author)
      ? item.author
        .map((entry) => {
          const given = typeof (entry as { given?: unknown }).given === 'string'
            ? String((entry as { given?: unknown }).given).trim()
            : '';
          const family = typeof (entry as { family?: unknown }).family === 'string'
            ? String((entry as { family?: unknown }).family).trim()
            : '';
          return `${given} ${family}`.trim();
        })
        .filter(Boolean)
      : [];
    const issued = item.issued && typeof item.issued === 'object' && !Array.isArray(item.issued)
      ? item.issued as { 'date-parts'?: unknown }
      : {};
    const dateParts = Array.isArray(issued['date-parts']) && Array.isArray(issued['date-parts'][0])
      ? issued['date-parts'][0] as unknown[]
      : [];
    const year = Number.isFinite(Number(dateParts[0])) ? Number(dateParts[0]) : null;
    const containerTitle = Array.isArray(item['container-title'])
      ? String(item['container-title'][0] ?? '').trim()
      : '';
    const keywords = Array.isArray(item.subject)
      ? item.subject.map((entry) => String(entry ?? '').trim()).filter(Boolean)
      : [];
    const doi = typeof item.DOI === 'string' ? item.DOI.trim() : '';
    const url = typeof item.URL === 'string' ? item.URL.trim() : '';
    const externalId = doi || url || `crossref-${index + 1}`;
    return {
      provider: 'crossref' as const,
      externalId,
      title: Array.isArray(item.title) ? String(item.title[0] ?? '').trim() || 'Untitled reference' : 'Untitled reference',
      authors,
      year,
      containerTitle,
      publisher: typeof item.publisher === 'string' ? item.publisher.trim() : '',
      doi,
      url,
      abstractText: typeof item.abstract === 'string' ? stripMarkup(item.abstract) : '',
      keywords,
      referenceType: typeof item.type === 'string' && item.type.trim() ? item.type.trim() : 'article',
      raw: item
    };
  });
}

async function recordAuditEvent(params: {
  request: FastifyRequest;
  projectId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const actorUserId = params.request.session.userId ?? 'system';
  const actorUsername = params.request.session.username ?? 'system';
  const actorRole = params.request.session.role ?? 'student';
  await insertAuditEvent(createAuditEvent({
    id: `audit-${randomUUID()}`,
    projectId: params.projectId,
    actorUserId,
    actorUsername,
    actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details ?? {}
  }));
}

async function recordSystemAuditEvent(params: {
  projectId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await insertAuditEvent(createAuditEvent({
    id: `audit-${randomUUID()}`,
    projectId: params.projectId,
    actorUserId: 'system',
    actorUsername: 'system',
    actorRole: 'system',
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details ?? {}
  }));
}

async function executeExternalSqlImportJob(job: {
  id: string;
  projectId: string;
  profileId: string;
  label: string;
  schemaName: string;
  tableName: string;
  caseLabelColumn: string;
  selectedColumnsJson: string;
  variableColumnsJson: string;
  maxRows: number;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
}): Promise<{ imported: Awaited<ReturnType<typeof importExternalSqlTable>>; profileLabel: string; }> {
  const profile = (await listExternalSqlProfiles(job.projectId)).find((item) => item.id === job.profileId);
  if (!profile) {
    throw new Error('SQL profile for this import job was not found.');
  }
  const connection = JSON.parse(profile.connectionJson) as ExternalSqlConnectionInput;
  const imported = await importExternalSqlTable({
    projectId: job.projectId,
    profileId: profile.id,
    profileLabel: profile.label,
    clientType: profile.clientType,
    connection,
    schemaName: job.schemaName,
    tableName: job.tableName,
    caseLabelColumn: job.caseLabelColumn,
    maxRows: clampSqlImportMaxRows(job.maxRows, 500),
    selectedColumns: normalizeSqlImportColumns(JSON.parse(job.selectedColumnsJson), [job.caseLabelColumn]),
    variableColumns: normalizeSqlVariableColumns(JSON.parse(job.variableColumnsJson)),
    refreshJobId: job.id
  });
  return { imported, profileLabel: profile.label };
}

async function settleExternalSqlImportJobRun(params: {
  job: {
    id: string;
    projectId: string;
    scheduleEnabled: boolean;
    scheduleIntervalMinutes: number | null;
  };
  status: 'success' | 'error';
  message: string;
  ranAt?: string;
}): Promise<void> {
  const ranAt = params.ranAt ?? new Date().toISOString();
  await updateExternalSqlImportJobRunState({
    id: params.job.id,
    projectId: params.job.projectId,
    updatedAt: ranAt,
    lastRunAt: ranAt,
    lastRunStatus: params.status,
    lastRunMessage: params.message,
    scheduleNextRunAt: computeSqlImportScheduleNextRunAt(
      params.job.scheduleEnabled,
      params.job.scheduleIntervalMinutes,
      ranAt
    )
  });
}

async function runDueExternalSqlImportJobs(): Promise<void> {
  if (sqlImportSchedulerRunning) return;
  sqlImportSchedulerRunning = true;
  try {
    const dueJobs = await listDueExternalSqlImportJobs(new Date().toISOString(), 10);
    for (const job of dueJobs) {
      const startedAtMs = Date.now();
      const preGuard = await evaluateAxionQeccGuard({
        jobType: 'sql-import',
        stage: 'scheduled_pre_run',
        projectId: job.projectId,
        retryCount: job.lastRunStatus === 'error' ? 1 : 0,
        load: Math.min(1, dueJobs.length / 10),
        metadata: {
          scheduled: true,
          jobId: job.id
        }
      });
      if (preGuard.action === 'halt') {
        const message = `QECC guard blocked scheduled SQL import (${preGuard.reason}).`;
        await settleExternalSqlImportJobRun({
          job,
          status: 'error',
          message
        });
        await recordSystemAuditEvent({
          projectId: job.projectId,
          action: 'sql_import_job.qecc_guard_halt',
          entityType: 'external_sql_import_job',
          entityId: job.id,
          details: {
            stage: 'scheduled_pre_run',
            decision: preGuard
          }
        });
        continue;
      }
      try {
        const { imported, profileLabel } = await executeExternalSqlImportJob(job);
        const successMessage = `Imported ${imported.casesCreated} case rows and replaced ${imported.removedPriorCases} prior rows.`;
        const durationSeconds = Math.max(0, (Date.now() - startedAtMs) / 1000);
        const postGuard = await evaluateAxionQeccGuard({
          jobType: 'sql-import',
          stage: 'scheduled_post_run',
          projectId: job.projectId,
          durationSeconds,
          load: Math.min(1, dueJobs.length / 10),
          metadata: {
            scheduled: true,
            jobId: job.id
          }
        });
        await settleExternalSqlImportJobRun({
          job,
          status: 'success',
          message: successMessage
        });
        await recordSystemAuditEvent({
          projectId: job.projectId,
          action: 'sql_import_job.run_scheduled',
          entityType: 'external_sql_import_job',
          entityId: job.id,
          details: {
            label: job.label,
            profileLabel,
            maxRows: job.maxRows,
            qeccGuard: postGuard,
            ...imported
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to refresh the SQL import job.';
        const durationSeconds = Math.max(0, (Date.now() - startedAtMs) / 1000);
        const failGuard = await evaluateAxionQeccGuard({
          jobType: 'sql-import',
          stage: 'scheduled_failed',
          projectId: job.projectId,
          durationSeconds,
          errorRate: 1,
          failedStage: true,
          load: Math.min(1, dueJobs.length / 10),
          metadata: {
            scheduled: true,
            jobId: job.id
          }
        });
        await settleExternalSqlImportJobRun({
          job,
          status: 'error',
          message: failGuard.action === 'halt' ? `${message} (QECC halt: ${failGuard.reason})` : message
        });
        await recordSystemAuditEvent({
          projectId: job.projectId,
          action: 'sql_import_job.run_scheduled_failed',
          entityType: 'external_sql_import_job',
          entityId: job.id,
          details: { label: job.label, message, qeccGuard: failGuard }
        });
        server.log.error({ jobId: job.id, error }, 'Scheduled SQL import refresh failed.');
      }
    }
  } finally {
    sqlImportSchedulerRunning = false;
  }
}

function scheduleExternalSqlImportJobRunner(): void {
  const timer = setInterval(async () => {
    try {
      await runDueExternalSqlImportJobs();
    } catch (error) {
      server.log.error(error, 'Scheduled SQL import runner failed.');
    }
  }, SQL_IMPORT_SCHEDULER_INTERVAL_MS);
  timer.unref();
}

scheduleExternalSqlImportJobRunner();

type OfficeConnectorRunStats = {
  scannedCount: number;
  changedCount: number;
  skippedUnchangedCount: number;
  importedCount: number;
  updatedSourceCount: number;
  tabularFilesImported: number;
  caseRowsImported: number;
  removedPriorCases: number;
  errorCount: number;
  snapshot: Record<string, string>;
  importedItems: Array<Record<string, unknown>>;
  errors: Array<Record<string, unknown>>;
};

function defaultOfficeConnectorRunStats(): OfficeConnectorRunStats {
  return {
    scannedCount: 0,
    changedCount: 0,
    skippedUnchangedCount: 0,
    importedCount: 0,
    updatedSourceCount: 0,
    tabularFilesImported: 0,
    caseRowsImported: 0,
    removedPriorCases: 0,
    errorCount: 0,
    snapshot: {},
    importedItems: [],
    errors: []
  };
}

function parseOfficeConnectorRunStats(value: string | null | undefined): OfficeConnectorRunStats {
  const parsed = parseJsonObject(value);
  return {
    scannedCount: Number(parsed.scannedCount ?? 0) || 0,
    changedCount: Number(parsed.changedCount ?? 0) || 0,
    skippedUnchangedCount: Number(parsed.skippedUnchangedCount ?? 0) || 0,
    importedCount: Number(parsed.importedCount ?? 0) || 0,
    updatedSourceCount: Number(parsed.updatedSourceCount ?? 0) || 0,
    tabularFilesImported: Number(parsed.tabularFilesImported ?? 0) || 0,
    caseRowsImported: Number(parsed.caseRowsImported ?? 0) || 0,
    removedPriorCases: Number(parsed.removedPriorCases ?? 0) || 0,
    errorCount: Number(parsed.errorCount ?? 0) || 0,
    snapshot: parsed.snapshot && typeof parsed.snapshot === 'object' && !Array.isArray(parsed.snapshot)
      ? Object.fromEntries(Object.entries(parsed.snapshot as Record<string, unknown>).map(([key, item]) => [key, String(item ?? '')]))
      : {},
    importedItems: Array.isArray(parsed.importedItems) ? parsed.importedItems.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>> : [],
    errors: Array.isArray(parsed.errors) ? parsed.errors.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>> : []
  };
}

async function importParsedOfficeConnectorDraft(params: {
  projectId: string;
  profileId: string;
  relativePath: string;
  parsed: ImportedFileDraft;
  sourceByMarker: Map<string, { id: string; contentUrl: string | null }>;
}): Promise<Record<string, unknown>> {
  const marker = makeOfficeConnectorFileMarker(params.profileId, params.relativePath);
  if (params.parsed.kind === 'source') {
    const timestamp = new Date().toISOString();
    const existing = params.sourceByMarker.get(marker);
    if (existing) {
      await updateSourceContent({
        id: existing.id,
        projectId: params.projectId,
        title: params.parsed.title,
        contentType: params.parsed.contentType,
        contentUrl: marker,
        contentText: params.parsed.contentText,
        updatedAt: timestamp
      });
      const priorSegments = await listSegments(params.projectId, existing.id);
      for (const segment of priorSegments) {
        await deleteSegment(segment.id, params.projectId);
      }
      let segmentsCreated = 0;
      for (const segmentDraft of params.parsed.segments ?? []) {
        const segment = createSegment({
          id: `segment-${randomUUID()}`,
          projectId: params.projectId,
          sourceId: existing.id,
          kind: segmentDraft.kind,
          anchor: segmentDraft.anchor,
          text: segmentDraft.text
        });
        await insertSegment(segment);
        segmentsCreated += 1;
      }
      return {
        importedAs: 'source_updated',
        sourceId: existing.id,
        title: params.parsed.title,
        sourceKind: params.parsed.sourceKind,
        segmentsCreated,
        relativePath: params.relativePath
      };
    }

    const source = createSource({
      id: `source-${randomUUID()}`,
      projectId: params.projectId,
      kind: params.parsed.sourceKind,
      title: params.parsed.title,
      language: 'en',
      contentType: params.parsed.contentType,
      contentUrl: marker,
      contentText: params.parsed.contentText
    });
    await insertSource(source);
    params.sourceByMarker.set(marker, { id: source.id, contentUrl: marker });
    let segmentsCreated = 0;
    for (const segmentDraft of params.parsed.segments ?? []) {
      const segment = createSegment({
        id: `segment-${randomUUID()}`,
        projectId: params.projectId,
        sourceId: source.id,
        kind: segmentDraft.kind,
        anchor: segmentDraft.anchor,
        text: segmentDraft.text
      });
      await insertSegment(segment);
      segmentsCreated += 1;
    }
    return {
      importedAs: 'source_created',
      sourceId: source.id,
      title: source.title,
      sourceKind: source.kind,
      segmentsCreated,
      relativePath: params.relativePath
    };
  }

  const fileKey = makeOfficeConnectorCaseFileKey(params.profileId, params.relativePath);
  const removedPriorCases = await deleteCasesImportedByOfficeFile(params.projectId, fileKey);
  let casesCreated = 0;
  let attributesCreated = 0;
  for (const row of params.parsed.rows) {
    const caseEntity = createCase({
      id: `case-${randomUUID()}`,
      projectId: params.projectId,
      label: row.caseLabel,
      sourceIds: []
    });
    await insertCase(caseEntity);
    casesCreated += 1;
    for (const attributeDraft of row.attributes) {
      const attribute = createAttribute({
        id: `attribute-${randomUUID()}`,
        projectId: params.projectId,
        targetType: 'case',
        targetId: caseEntity.id,
        name: attributeDraft.name,
        value: attributeDraft.value
      });
      await insertAttribute(attribute);
      attributesCreated += 1;
    }
    const markerAttributes: Array<{ name: string; value: string }> = [
      { name: '_office_connector_file_key', value: fileKey },
      { name: '_office_connector_profile_id', value: params.profileId },
      { name: '_office_connector_relative_path', value: params.relativePath.replaceAll('\\', '/') }
    ];
    for (const markerAttribute of markerAttributes) {
      const attribute = createAttribute({
        id: `attribute-${randomUUID()}`,
        projectId: params.projectId,
        targetType: 'case',
        targetId: caseEntity.id,
        name: markerAttribute.name,
        value: markerAttribute.value
      });
      await insertAttribute(attribute);
      attributesCreated += 1;
    }
  }

  if (params.parsed.spssMetadata) {
    await persistImportedSpssMetadata(params.projectId, params.parsed.spssMetadata);
  }

  return {
    importedAs: 'tabular',
    relativePath: params.relativePath,
    caseLabelField: params.parsed.caseLabelField,
    sheetName: params.parsed.sheetName,
    casesCreated,
    attributesCreated,
    removedPriorCases
  };
}

async function executeOfficeConnectorJob(job: {
  id: string;
  projectId: string;
  profileId: string;
  label: string;
  syncOptionsJson: string;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
  lastRunStatsJson?: string;
}, overrides?: {
  maxFiles?: number;
  forceResync?: boolean;
}): Promise<{ profileLabel: string; stats: OfficeConnectorRunStats; }> {
  const profile = (await listOfficeConnectorProfiles(job.projectId)).find((item) => item.id === job.profileId);
  if (!profile) {
    throw new Error('Office connector profile for this job was not found.');
  }
  const syncOptionsRaw = parseJsonObject(job.syncOptionsJson);
  const maxFiles = clampOfficeConnectorMaxFiles(overrides?.maxFiles ?? syncOptionsRaw.maxFiles, 500);
  const forceResync = overrides?.forceResync === true || syncOptionsRaw.forceResync === true;
  const allowedExtensions = normalizeOfficeConnectorExtensions(parseJsonArray(profile.allowedExtensionsJson));
  const discoveredFiles = await collectOfficeConnectorFiles({
    rootPath: profile.rootPath,
    includeSubdirectories: profile.includeSubdirectories,
    allowedExtensions,
    maxFiles
  });
  const previousStats = parseOfficeConnectorRunStats(job.lastRunStatsJson);
  const previousSnapshot = forceResync ? {} : previousStats.snapshot;
  const nextSnapshot: Record<string, string> = {};
  const stats = defaultOfficeConnectorRunStats();
  stats.scannedCount = discoveredFiles.length;
  const sources = await listSources(job.projectId);
  const sourceByMarker = new Map(
    sources
      .filter((source) => typeof source.contentUrl === 'string' && source.contentUrl.startsWith('office-connector://'))
      .map((source) => [source.contentUrl as string, { id: source.id, contentUrl: source.contentUrl }])
  );
  for (const file of discoveredFiles) {
    const fileSignature = `${Math.round(file.mtimeMs)}:${file.size}`;
    nextSnapshot[file.relativePath] = fileSignature;
    if (!forceResync && previousSnapshot[file.relativePath] === fileSignature) {
      stats.skippedUnchangedCount += 1;
      continue;
    }
    stats.changedCount += 1;
    try {
      const buffer = await readFile(file.absolutePath);
      const parsed = await parseImportedFile(file.filename, '', buffer);
      const imported = await importParsedOfficeConnectorDraft({
        projectId: job.projectId,
        profileId: profile.id,
        relativePath: file.relativePath,
        parsed,
        sourceByMarker
      });
      stats.importedItems.push({
        filename: file.filename,
        relativePath: file.relativePath,
        ...imported
      });
      stats.importedCount += 1;
      if (imported.importedAs === 'source_updated') {
        stats.updatedSourceCount += 1;
      }
      if (imported.importedAs === 'tabular') {
        stats.tabularFilesImported += 1;
        stats.caseRowsImported += Number(imported.casesCreated ?? 0) || 0;
        stats.removedPriorCases += Number(imported.removedPriorCases ?? 0) || 0;
      }
    } catch (error) {
      stats.errorCount += 1;
      stats.errors.push({
        filename: file.filename,
        relativePath: file.relativePath,
        message: error instanceof Error ? error.message : 'Office connector import failed.'
      });
    }
  }
  stats.snapshot = nextSnapshot;
  return { profileLabel: profile.label, stats };
}

async function settleOfficeConnectorJobRun(params: {
  job: {
    id: string;
    projectId: string;
    scheduleEnabled: boolean;
    scheduleIntervalMinutes: number | null;
  };
  status: 'success' | 'error';
  message: string;
  stats: OfficeConnectorRunStats;
  ranAt?: string;
}): Promise<void> {
  const ranAt = params.ranAt ?? new Date().toISOString();
  await updateOfficeConnectorJobRunState({
    id: params.job.id,
    projectId: params.job.projectId,
    updatedAt: ranAt,
    lastRunAt: ranAt,
    lastRunStatus: params.status,
    lastRunMessage: params.message,
    lastRunStatsJson: JSON.stringify(params.stats),
    scheduleNextRunAt: computeSqlImportScheduleNextRunAt(
      params.job.scheduleEnabled,
      params.job.scheduleIntervalMinutes,
      ranAt
    )
  });
}

async function runDueOfficeConnectorJobs(): Promise<void> {
  if (officeConnectorSchedulerRunning) return;
  officeConnectorSchedulerRunning = true;
  try {
    const dueJobs = await listDueOfficeConnectorJobs(new Date().toISOString(), 8);
    for (const job of dueJobs) {
      try {
        const { profileLabel, stats } = await executeOfficeConnectorJob(job);
        const message = `Synced ${stats.importedCount} file(s); ${stats.skippedUnchangedCount} unchanged; ${stats.errorCount} error(s).`;
        await settleOfficeConnectorJobRun({
          job,
          status: stats.errorCount > 0 ? 'error' : 'success',
          message,
          stats
        });
        await recordSystemAuditEvent({
          projectId: job.projectId,
          action: 'office_connector_job.run_scheduled',
          entityType: 'office_connector_job',
          entityId: job.id,
          details: {
            label: job.label,
            profileLabel,
            ...stats
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to run the Office connector sync job.';
        const stats = defaultOfficeConnectorRunStats();
        stats.errorCount = 1;
        stats.errors.push({ message });
        await settleOfficeConnectorJobRun({
          job,
          status: 'error',
          message,
          stats
        });
        await recordSystemAuditEvent({
          projectId: job.projectId,
          action: 'office_connector_job.run_scheduled_failed',
          entityType: 'office_connector_job',
          entityId: job.id,
          details: { label: job.label, message }
        });
        server.log.error({ jobId: job.id, error }, 'Scheduled Office connector sync failed.');
      }
    }
  } finally {
    officeConnectorSchedulerRunning = false;
  }
}

function scheduleOfficeConnectorJobRunner(): void {
  const timer = setInterval(async () => {
    try {
      await runDueOfficeConnectorJobs();
    } catch (error) {
      server.log.error(error, 'Scheduled Office connector runner failed.');
    }
  }, OFFICE_CONNECTOR_SCHEDULER_INTERVAL_MS);
  timer.unref();
}

async function importReferenceConnectorCandidates(params: {
  projectId: string;
  provider: 'crossref' | 'openalex';
  candidates: ReferenceConnectorCandidate[];
  skipDuplicates: boolean;
}): Promise<{
  imported: Array<{ id: string; title: string; externalId: string }>;
  skipped: Array<{ title: string; reason: string; externalId: string }>;
}> {
  const existing = params.skipDuplicates ? await listProjectReferences(params.projectId) : [];
  const imported: Array<{ id: string; title: string; externalId: string }> = [];
  const skipped: Array<{ title: string; reason: string; externalId: string }> = [];
  const timestamp = new Date().toISOString();
  for (const candidate of params.candidates) {
    const title = candidate.title.trim() || 'Untitled reference';
    const draft = {
      title,
      authors: candidate.authors,
      year: candidate.year,
      doi: candidate.doi
    };
    if (params.skipDuplicates) {
      const duplicate = existing.find((row) => referencesLikelyDuplicate(row, draft));
      if (duplicate) {
        skipped.push({
          title,
          externalId: candidate.externalId,
          reason: `Duplicate of ${duplicate.id}`
        });
        continue;
      }
    }
    const reference = await insertProjectReference({
      id: `reference-${randomUUID()}`,
      projectId: params.projectId,
      sourceFormat: 'manual',
      referenceType: candidate.referenceType || 'article',
      title,
      authors: candidate.authors,
      year: candidate.year,
      containerTitle: candidate.containerTitle,
      publisher: candidate.publisher,
      doi: candidate.doi,
      url: candidate.url,
      abstractText: candidate.abstractText,
      keywords: candidate.keywords,
      rawText: JSON.stringify({
        provider: params.provider,
        externalId: candidate.externalId,
        raw: candidate.raw
      }),
      relatedSourceId: null,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    existing.push(reference);
    imported.push({
      id: reference.id,
      title: reference.title,
      externalId: candidate.externalId
    });
  }
  return { imported, skipped };
}

async function executeReferenceConnectorJob(job: {
  id: string;
  projectId: string;
  profileId: string;
  label: string;
  queryJson: string;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number | null;
}): Promise<{
  profileLabel: string;
  provider: 'crossref' | 'openalex';
  queryText: string;
  maxRows: number;
  skipDuplicates: boolean;
  fetchedCount: number;
  importedCount: number;
  skippedCount: number;
  imported: Array<{ id: string; title: string; externalId: string }>;
  skipped: Array<{ title: string; reason: string; externalId: string }>;
}> {
  const profile = (await listReferenceConnectorProfiles(job.projectId)).find((item) => item.id === job.profileId);
  if (!profile) {
    throw new Error('Reference connector profile for this job was not found.');
  }
  const query = parseJsonObject(job.queryJson);
  const queryText = typeof query.text === 'string' ? query.text.trim() : '';
  const maxRows = clampReferenceConnectorMaxRows(query.maxRows, 50);
  const skipDuplicates = query.skipDuplicates !== false;
  if (!queryText) {
    throw new Error('Reference connector query text is required.');
  }
  const settings = parseJsonObject(profile.settingsJson);
  const candidates = await searchReferenceProvider({
    provider: profile.provider,
    queryText,
    maxRows,
    settings
  });
  const result = await importReferenceConnectorCandidates({
    projectId: job.projectId,
    provider: profile.provider,
    candidates,
    skipDuplicates
  });
  return {
    profileLabel: profile.label,
    provider: profile.provider,
    queryText,
    maxRows,
    skipDuplicates,
    fetchedCount: candidates.length,
    importedCount: result.imported.length,
    skippedCount: result.skipped.length,
    imported: result.imported,
    skipped: result.skipped
  };
}

async function settleReferenceConnectorJobRun(params: {
  job: {
    id: string;
    projectId: string;
    scheduleEnabled: boolean;
    scheduleIntervalMinutes: number | null;
  };
  status: 'success' | 'error';
  message: string;
  stats: Record<string, unknown>;
  ranAt?: string;
}): Promise<void> {
  const ranAt = params.ranAt ?? new Date().toISOString();
  await updateReferenceConnectorJobRunState({
    id: params.job.id,
    projectId: params.job.projectId,
    updatedAt: ranAt,
    lastRunAt: ranAt,
    lastRunStatus: params.status,
    lastRunMessage: params.message,
    lastRunStatsJson: JSON.stringify(params.stats),
    scheduleNextRunAt: computeSqlImportScheduleNextRunAt(
      params.job.scheduleEnabled,
      params.job.scheduleIntervalMinutes,
      ranAt
    )
  });
}

async function runDueReferenceConnectorJobs(): Promise<void> {
  if (referenceConnectorSchedulerRunning) return;
  referenceConnectorSchedulerRunning = true;
  try {
    const dueJobs = await listDueReferenceConnectorJobs(new Date().toISOString(), 8);
    for (const job of dueJobs) {
      try {
        const result = await executeReferenceConnectorJob(job);
        const status: 'success' | 'error' = result.importedCount > 0 || result.skippedCount >= 0 ? 'success' : 'error';
        const message = `Fetched ${result.fetchedCount} record(s), imported ${result.importedCount}, skipped ${result.skippedCount}.`;
        await settleReferenceConnectorJobRun({
          job,
          status,
          message,
          stats: result
        });
        await recordSystemAuditEvent({
          projectId: job.projectId,
          action: 'reference_connector_job.run_scheduled',
          entityType: 'reference_connector_job',
          entityId: job.id,
          details: result
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to run the reference connector sync job.';
        await settleReferenceConnectorJobRun({
          job,
          status: 'error',
          message,
          stats: { error: message }
        });
        await recordSystemAuditEvent({
          projectId: job.projectId,
          action: 'reference_connector_job.run_scheduled_failed',
          entityType: 'reference_connector_job',
          entityId: job.id,
          details: { label: job.label, message }
        });
        server.log.error({ jobId: job.id, error }, 'Scheduled reference connector sync failed.');
      }
    }
  } finally {
    referenceConnectorSchedulerRunning = false;
  }
}

function scheduleReferenceConnectorJobRunner(): void {
  const timer = setInterval(async () => {
    try {
      await runDueReferenceConnectorJobs();
    } catch (error) {
      server.log.error(error, 'Scheduled reference connector runner failed.');
    }
  }, REFERENCE_CONNECTOR_SCHEDULER_INTERVAL_MS);
  timer.unref();
}

scheduleOfficeConnectorJobRunner();
scheduleReferenceConnectorJobRunner();

async function buildQualitativeProjectPayload(projectId: string) {
  const [
    summary,
    sources,
    segments,
    codes,
    cases,
    memos,
    attributes,
    annotations,
    relationships,
    references,
    referenceLinks,
    referenceCollections,
    referenceCollectionItems,
    referenceMergeEvents,
    transcriptSyncLinks,
    transcriptionJobs,
    codeApplications
  ] = await Promise.all([
      getProjectSummary(projectId),
      listSources(projectId),
      listSegments(projectId),
    listCodes(projectId),
    listCases(projectId),
      listMemos(projectId),
      listAttributes(projectId),
      listAnnotations(projectId),
      listRelationships(projectId),
      listProjectReferences(projectId),
      listProjectReferenceLinks(projectId),
      listProjectReferenceCollections(projectId),
      listProjectReferenceCollectionItems(projectId),
      listProjectReferenceMergeEvents(projectId),
      listTranscriptSyncLinks(projectId),
      listTranscriptionJobs(projectId),
      listCodeApplications(projectId)
  ]);

  return {
    project: summary.project,
    sources,
    segments,
    codes,
    cases,
    memos,
    attributes,
    annotations,
    relationships,
    references,
    referenceLinks,
    referenceCollections,
    referenceCollectionItems,
    referenceMergeEvents,
    transcriptSyncLinks,
    transcriptionJobs,
    codeApplications
  };
}

async function buildProjectBackupSnapshot(projectId: string) {
  const [
    qualitative,
    variables,
    traceLinks,
    members,
    savedTransforms,
    savedAnalysisJobs,
    savedQualQueries,
    codingAssignments,
    codingConflictResolutions,
    codingConflictTriages,
    codingCalibrationSessions,
    mergeGovernancePolicy,
    mergeApprovals,
    auditEvents,
    projectMessages
  ] = await Promise.all([
    buildQualitativeProjectPayload(projectId),
    listVariables(projectId),
    listTraceLinks(projectId),
    listProjectMembers(projectId),
    listSavedTransforms(projectId),
    listSavedAnalysisJobs(projectId),
    listSavedQualitativeQueries(projectId),
    listCodingAssignments(projectId),
    listCodingConflictResolutions(projectId, { limit: 5000 }),
    listCodingConflictTriages(projectId, { limit: 5000 }),
    listCodingCalibrationSessions(projectId, { limit: 2000 }),
    getCodingMergeGovernancePolicy(projectId),
    listCodingMergeApprovals(projectId, { limit: 5000, includeUsed: true, includeRevoked: true }),
    listAuditEvents(projectId, { limit: AUDIT_EXPORT_MAX_ROWS }),
    listProjectMessages(projectId, 1000)
  ]);

  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    project: qualitative.project,
    members,
    sources: qualitative.sources,
    codes: qualitative.codes,
    variables,
    cases: qualitative.cases,
    memos: qualitative.memos,
    attributes: qualitative.attributes,
    annotations: qualitative.annotations,
    relationships: qualitative.relationships,
    references: qualitative.references,
    referenceLinks: qualitative.referenceLinks,
    referenceCollections: qualitative.referenceCollections,
    referenceCollectionItems: qualitative.referenceCollectionItems,
    referenceMergeEvents: qualitative.referenceMergeEvents,
    transcriptSyncLinks: qualitative.transcriptSyncLinks,
    transcriptionJobs: qualitative.transcriptionJobs,
    segments: qualitative.segments,
    codeApplications: qualitative.codeApplications,
    traceLinks,
    savedTransforms,
    savedAnalysisJobs,
    savedQualitativeQueries: savedQualQueries,
    codingAssignments,
    codingConflictResolutions,
    codingConflictTriages,
    codingCalibrationSessions,
    mergeGovernancePolicy,
    mergeApprovals,
    auditEvents,
    projectMessages
  };
}

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function serializeAuditEventsCsv(items: Array<Record<string, unknown>>): string {
  const headers = ['createdAt', 'actorUsername', 'actorRole', 'action', 'entityType', 'entityId', 'details'];
  const rows = items.map((item) => [
    item.createdAt,
    item.actorUsername,
    item.actorRole,
    item.action,
    item.entityType,
    item.entityId,
    JSON.stringify(item.details ?? {})
  ]);
  return `${headers.join(',')}\n${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')}\n`;
}

async function restoreBackupSnapshot(params: {
  snapshot: any;
  restoringUserId: string;
  username: string;
  requestedName?: string;
}): Promise<{ projectId: string; projectName: string }> {
  const snapshot = params.snapshot ?? {};
  const sourceProject = snapshot.project ?? {};
  const timestamp = new Date().toISOString();
  const restoredProjectId = `project-${randomUUID()}`;
  const restoredProjectName = params.requestedName?.trim()
    || `${typeof sourceProject.name === 'string' && sourceProject.name.trim() ? sourceProject.name.trim() : 'Restored project'} (Restored)`;

  const project = createProject({
    id: restoredProjectId,
    name: restoredProjectName,
    workspaceMode: parseProjectWorkspaceMode(sourceProject.workspaceMode),
    description: typeof sourceProject.description === 'string' ? sourceProject.description : '',
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await insertProject(project);
  await addMembership(params.restoringUserId, restoredProjectId, 'owner');

  const sourceIdMap = new Map<string, string>();
  const codeIdMap = new Map<string, string>();
  const caseIdMap = new Map<string, string>();
  const segmentIdMap = new Map<string, string>();
  const variableIdMap = new Map<string, string>();
  const memoIdMap = new Map<string, string>();
  const annotationIdMap = new Map<string, string>();
  const referenceIdMap = new Map<string, string>();
  const referenceCollectionIdMap = new Map<string, string>();
  const resolveUserIdByUsername = async (usernameRaw: unknown): Promise<string | null> => {
    if (!(typeof usernameRaw === 'string' && usernameRaw.trim())) return null;
    const found = await findUserByUsername(normalizeMuUsername(usernameRaw));
    return found?.user.id ?? null;
  };

  for (const source of Array.isArray(snapshot.sources) ? snapshot.sources : []) {
    const id = `source-${randomUUID()}`;
    sourceIdMap.set(String(source.id), id);
    await insertSource(createSource({
      id,
      projectId: restoredProjectId,
      kind: parseSourceKind(source.kind),
      title: typeof source.title === 'string' ? source.title : 'Restored source',
      language: typeof source.language === 'string' ? source.language : 'en',
      contentType: typeof source.contentType === 'string' ? source.contentType : 'text/plain',
      contentUrl: typeof source.contentUrl === 'string' ? source.contentUrl : null,
      contentText: typeof source.contentText === 'string' ? source.contentText : '',
      createdAt: timestamp,
      updatedAt: timestamp
    }));
  }

  for (const code of Array.isArray(snapshot.codes) ? snapshot.codes : []) {
    codeIdMap.set(String(code.id), `code-${randomUUID()}`);
  }
  for (const code of Array.isArray(snapshot.codes) ? snapshot.codes : []) {
    const mappedId = codeIdMap.get(String(code.id));
    if (!mappedId) continue;
    await insertCode(createCode({
      id: mappedId,
      projectId: restoredProjectId,
      parentCodeId: code.parentCodeId ? (codeIdMap.get(String(code.parentCodeId)) ?? null) : null,
      name: typeof code.name === 'string' ? code.name : 'Restored code',
      description: typeof code.description === 'string' ? code.description : '',
      colorToken: typeof code.colorToken === 'string' ? code.colorToken : 'blue',
      createdAt: timestamp,
      updatedAt: timestamp
    }));
  }

  for (const caseItem of Array.isArray(snapshot.cases) ? snapshot.cases : []) {
    const id = `case-${randomUUID()}`;
    caseIdMap.set(String(caseItem.id), id);
    await insertCase(createCase({
      id,
      projectId: restoredProjectId,
      label: typeof caseItem.label === 'string' ? caseItem.label : 'Restored case',
      sourceIds: Array.isArray(caseItem.sourceIds)
        ? caseItem.sourceIds.map((sourceId: string) => sourceIdMap.get(String(sourceId)) ?? String(sourceId))
        : [],
      createdAt: timestamp,
      updatedAt: timestamp
    }));
  }

  for (const variable of Array.isArray(snapshot.variables) ? snapshot.variables : []) {
    const id = `variable-${randomUUID()}`;
    variableIdMap.set(String(variable.id), id);
    await insertVariable(createVariable({
      id,
      projectId: restoredProjectId,
      name: typeof variable.name === 'string' ? variable.name : `restored_${randomUUID().slice(0, 8)}`,
      label: typeof variable.label === 'string' ? variable.label : 'Restored variable',
      kind: parseVariableKind(variable.kind),
      sourceKind: parseAnalysisKind(variable.sourceKind),
      derivedFromCodeId: null,
      derivationRule: typeof variable.derivationRule === 'string' ? variable.derivationRule : 'presence',
      createdAt: timestamp,
      updatedAt: timestamp
    }), variable.derivedFromCodeId ? (codeIdMap.get(String(variable.derivedFromCodeId)) ?? null) : null);
  }

  for (const attribute of Array.isArray(snapshot.attributes) ? snapshot.attributes : []) {
    const targetId = attribute.targetType === 'source'
      ? sourceIdMap.get(String(attribute.targetId))
      : caseIdMap.get(String(attribute.targetId));
    if (!targetId) continue;
    await insertAttribute(createAttribute({
      id: `attribute-${randomUUID()}`,
      projectId: restoredProjectId,
      targetType: attribute.targetType === 'source' ? 'source' : 'case',
      targetId,
      name: typeof attribute.name === 'string' ? attribute.name : 'Restored attribute',
      value: attribute.value ?? null,
      createdAt: timestamp,
      updatedAt: timestamp
    }));
  }

  for (const segment of Array.isArray(snapshot.segments) ? snapshot.segments : []) {
    const id = `segment-${randomUUID()}`;
    const mappedSourceId = sourceIdMap.get(String(segment.sourceId));
    if (!mappedSourceId) continue;
    segmentIdMap.set(String(segment.id), id);
    await insertSegment(createSegment({
      id,
      projectId: restoredProjectId,
      sourceId: mappedSourceId,
      kind: parseSegmentKind(segment.kind),
      anchor: typeof segment.anchor === 'object' && segment.anchor ? segment.anchor : { kind: 'text_range', start: 0, end: 0 },
      text: typeof segment.text === 'string' ? segment.text : '',
      createdAt: timestamp,
      updatedAt: timestamp
    }));
  }

  for (const application of Array.isArray(snapshot.codeApplications) ? snapshot.codeApplications : []) {
    const mappedSegmentId = segmentIdMap.get(String(application.segmentId));
    const mappedCodeId = codeIdMap.get(String(application.codeId));
    if (!mappedSegmentId || !mappedCodeId) continue;
    await insertCodeApplication(createCodeApplication({
      id: `ca-${randomUUID()}`,
      projectId: restoredProjectId,
      segmentId: mappedSegmentId,
      codeId: mappedCodeId,
      caseId: application.caseId ? (caseIdMap.get(String(application.caseId)) ?? null) : null,
      coderId: typeof application.coderId === 'string' ? application.coderId : params.username,
      confidence: typeof application.confidence === 'number' ? application.confidence : 1,
      createdAt: timestamp
    }));
  }

  for (const memo of Array.isArray(snapshot.memos) ? snapshot.memos : []) {
    const mappedTargetId = memo.targetType === 'source'
      ? sourceIdMap.get(String(memo.targetId))
      : memo.targetType === 'segment'
        ? segmentIdMap.get(String(memo.targetId))
        : memo.targetType === 'code'
          ? codeIdMap.get(String(memo.targetId))
          : memo.targetType === 'case'
            ? caseIdMap.get(String(memo.targetId))
            : memo.targetType === 'project'
              ? restoredProjectId
              : String(memo.targetId);
    if (!mappedTargetId) continue;
    const memoId = `memo-${randomUUID()}`;
    memoIdMap.set(String(memo.id), memoId);
    await insertMemo(createMemo({
      id: memoId,
      projectId: restoredProjectId,
      targetType: memo.targetType,
      targetId: mappedTargetId,
      title: typeof memo.title === 'string' ? memo.title : 'Restored memo',
      body: typeof memo.body === 'string' ? memo.body : '',
      createdAt: timestamp,
      updatedAt: timestamp
    }));
  }

  for (const annotation of Array.isArray(snapshot.annotations) ? snapshot.annotations : []) {
    const mappedTargetId = annotation.targetType === 'source'
      ? sourceIdMap.get(String(annotation.targetId))
      : annotation.targetType === 'segment'
        ? segmentIdMap.get(String(annotation.targetId))
        : annotation.targetType === 'code'
          ? codeIdMap.get(String(annotation.targetId))
          : annotation.targetType === 'case'
            ? caseIdMap.get(String(annotation.targetId))
            : restoredProjectId;
    if (!mappedTargetId) continue;
    const annotationId = `annotation-${randomUUID()}`;
    annotationIdMap.set(String(annotation.id), annotationId);
    await insertAnnotation(createAnnotation({
      id: annotationId,
      projectId: restoredProjectId,
      targetType: parseAnnotationTargetType(annotation.targetType),
      targetId: mappedTargetId,
      quoteText: typeof annotation.quoteText === 'string' ? annotation.quoteText : '',
      note: typeof annotation.note === 'string' ? annotation.note : 'Restored annotation',
      startOffset: typeof annotation.startOffset === 'number' ? annotation.startOffset : null,
      endOffset: typeof annotation.endOffset === 'number' ? annotation.endOffset : null,
      colorToken: typeof annotation.colorToken === 'string' ? annotation.colorToken : 'amber',
      createdAt: timestamp,
      updatedAt: timestamp
    }));
  }

    for (const relationship of Array.isArray(snapshot.relationships) ? snapshot.relationships : []) {
    const leftTargetId = relationship.leftTargetType === 'source'
      ? sourceIdMap.get(String(relationship.leftTargetId))
      : relationship.leftTargetType === 'segment'
        ? segmentIdMap.get(String(relationship.leftTargetId))
        : relationship.leftTargetType === 'code'
          ? codeIdMap.get(String(relationship.leftTargetId))
          : caseIdMap.get(String(relationship.leftTargetId));
    const rightTargetId = relationship.rightTargetType === 'source'
      ? sourceIdMap.get(String(relationship.rightTargetId))
      : relationship.rightTargetType === 'segment'
        ? segmentIdMap.get(String(relationship.rightTargetId))
        : relationship.rightTargetType === 'code'
          ? codeIdMap.get(String(relationship.rightTargetId))
          : caseIdMap.get(String(relationship.rightTargetId));
    if (!leftTargetId || !rightTargetId) continue;
    await insertRelationship(createRelationship({
      id: `relationship-${randomUUID()}`,
      projectId: restoredProjectId,
      relationshipType: parseRelationshipType(relationship.relationshipType),
      leftTargetType: parseRelationshipTargetType(relationship.leftTargetType),
      leftTargetId,
      rightTargetType: parseRelationshipTargetType(relationship.rightTargetType),
      rightTargetId,
      note: typeof relationship.note === 'string' ? relationship.note : '',
      createdAt: timestamp,
      updatedAt: timestamp
      }));
    }

    for (const reference of Array.isArray(snapshot.references) ? snapshot.references : []) {
      const referenceId = `reference-${randomUUID()}`;
      referenceIdMap.set(String(reference.id), referenceId);
      await insertProjectReference({
        id: referenceId,
        projectId: restoredProjectId,
        sourceFormat: parseReferenceSourceFormat(reference.sourceFormat),
        referenceType: typeof reference.referenceType === 'string' ? reference.referenceType : 'article',
        title: typeof reference.title === 'string' ? reference.title : '',
        authors: Array.isArray(reference.authors) ? reference.authors.map((item: unknown) => String(item)) : [],
        year: typeof reference.year === 'number' && Number.isFinite(reference.year) ? reference.year : null,
        containerTitle: typeof reference.containerTitle === 'string' ? reference.containerTitle : '',
        publisher: typeof reference.publisher === 'string' ? reference.publisher : '',
        doi: typeof reference.doi === 'string' ? reference.doi : '',
        url: typeof reference.url === 'string' ? reference.url : '',
        abstractText: typeof reference.abstractText === 'string' ? reference.abstractText : '',
        keywords: Array.isArray(reference.keywords) ? reference.keywords.map((item: unknown) => String(item)) : [],
        rawText: typeof reference.rawText === 'string' ? reference.rawText : '',
        relatedSourceId: reference.relatedSourceId ? (sourceIdMap.get(String(reference.relatedSourceId)) ?? null) : null,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    for (const collection of Array.isArray(snapshot.referenceCollections) ? snapshot.referenceCollections : []) {
      const collectionId = `reference-collection-${randomUUID()}`;
      referenceCollectionIdMap.set(String(collection.id), collectionId);
      await insertProjectReferenceCollection({
        id: collectionId,
        projectId: restoredProjectId,
        name: typeof collection.name === 'string' ? collection.name : 'Restored collection',
        description: typeof collection.description === 'string' ? collection.description : '',
        colorToken: parseReferenceCollectionColorToken(collection.colorToken),
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    for (const item of Array.isArray(snapshot.referenceCollectionItems) ? snapshot.referenceCollectionItems : []) {
      const collectionId = referenceCollectionIdMap.get(String(item.collectionId));
      const referenceId = referenceIdMap.get(String(item.referenceId));
      if (!collectionId || !referenceId) continue;
      await insertProjectReferenceCollectionItem({
        id: `reference-collection-item-${randomUUID()}`,
        projectId: restoredProjectId,
        collectionId,
        referenceId,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    for (const link of Array.isArray(snapshot.referenceLinks) ? snapshot.referenceLinks : []) {
      const referenceId = referenceIdMap.get(String(link.referenceId));
      if (!referenceId) continue;
      const targetType = parseReferenceTargetType(link.targetType);
      const mappedTargetId = targetType === 'source'
        ? sourceIdMap.get(String(link.targetId))
        : targetType === 'segment'
          ? segmentIdMap.get(String(link.targetId))
          : targetType === 'memo'
            ? memoIdMap.get(String(link.targetId))
            : targetType === 'code'
              ? codeIdMap.get(String(link.targetId))
              : targetType === 'case'
                ? caseIdMap.get(String(link.targetId))
                : annotationIdMap.get(String(link.targetId));
      if (!mappedTargetId) continue;
      await insertProjectReferenceLink({
        id: `reference-link-${randomUUID()}`,
        projectId: restoredProjectId,
        referenceId,
        targetType,
        targetId: mappedTargetId,
        note: typeof link.note === 'string' ? link.note : '',
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    for (const event of Array.isArray(snapshot.referenceMergeEvents) ? snapshot.referenceMergeEvents : []) {
      const primaryReferenceId = referenceIdMap.get(String(event.primaryReferenceId)) ?? String(event.primaryReferenceId ?? '').trim();
      const mergedReferenceId = referenceIdMap.get(String(event.mergedReferenceId)) ?? String(event.mergedReferenceId ?? '').trim();
      if (!primaryReferenceId || !mergedReferenceId) continue;
      await insertProjectReferenceMergeEvent({
        id: `reference-merge-${randomUUID()}`,
        projectId: restoredProjectId,
        primaryReferenceId,
        mergedReferenceId,
        reason: typeof event.reason === 'string' ? event.reason : '',
        mergedSnapshotJson: typeof event.mergedSnapshotJson === 'string' ? event.mergedSnapshotJson : '{}',
        createdByUserId: null,
        createdByUsername: typeof event.createdByUsername === 'string' ? event.createdByUsername : params.username,
        createdAt: timestamp
      });
    }

    for (const syncLink of Array.isArray(snapshot.transcriptSyncLinks) ? snapshot.transcriptSyncLinks : []) {
      const mediaSourceId = sourceIdMap.get(String(syncLink.mediaSourceId));
      const transcriptSourceId = sourceIdMap.get(String(syncLink.transcriptSourceId));
      const segmentId = syncLink.segmentId ? (segmentIdMap.get(String(syncLink.segmentId)) ?? null) : null;
      if (!mediaSourceId || !transcriptSourceId) continue;
      await insertTranscriptSyncLink({
        id: `sync-${randomUUID()}`,
        projectId: restoredProjectId,
        mediaSourceId,
        transcriptSourceId,
        segmentId,
        startMs: typeof syncLink.startMs === 'number' ? syncLink.startMs : 0,
        endMs: typeof syncLink.endMs === 'number' ? syncLink.endMs : 0,
        transcriptText: typeof syncLink.transcriptText === 'string' ? syncLink.transcriptText : '',
        speakerLabel: typeof syncLink.speakerLabel === 'string' ? syncLink.speakerLabel : '',
        confidence: typeof syncLink.confidence === 'number' && Number.isFinite(syncLink.confidence) ? syncLink.confidence : null,
        syncScore: typeof syncLink.syncScore === 'number' && Number.isFinite(syncLink.syncScore) ? syncLink.syncScore : null,
        tokenTimelineJson: typeof syncLink.tokenTimelineJson === 'string' ? syncLink.tokenTimelineJson : '[]',
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    for (const job of Array.isArray(snapshot.transcriptionJobs) ? snapshot.transcriptionJobs : []) {
      const mediaSourceId = sourceIdMap.get(String(job.mediaSourceId));
      const outputSourceId = job.outputSourceId ? (sourceIdMap.get(String(job.outputSourceId)) ?? null) : null;
      if (!mediaSourceId) continue;
      await insertTranscriptionJob({
        id: `transcription-${randomUUID()}`,
        projectId: restoredProjectId,
        mediaSourceId,
        outputSourceId,
        status: job.status === 'running' || job.status === 'completed' || job.status === 'failed' ? job.status : 'queued',
        mode: job.mode === 'timeline_chunked' || job.mode === 'hybrid' ? job.mode : 'segment_assembly',
        note: typeof job.note === 'string' ? job.note : '',
        pipelineJson: typeof job.pipelineJson === 'string' ? job.pipelineJson : '{}',
        progressPercent: typeof job.progressPercent === 'number' && Number.isFinite(job.progressPercent) ? Math.max(0, Math.min(100, Math.round(job.progressPercent))) : 100,
        startedAt: typeof job.startedAt === 'string' ? job.startedAt : null,
        errorMessage: typeof job.errorMessage === 'string' ? job.errorMessage : null,
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: typeof job.completedAt === 'string' ? job.completedAt : null
      });
    }

  for (const transform of Array.isArray(snapshot.savedTransforms) ? snapshot.savedTransforms : []) {
    await insertSavedTransform({
      id: `transform-${randomUUID()}`,
      projectId: restoredProjectId,
      label: typeof transform.label === 'string' ? transform.label : 'Restored transform',
      filtersJson: typeof transform.filtersJson === 'string' ? transform.filtersJson : '[]',
      recodesJson: typeof transform.recodesJson === 'string' ? transform.recodesJson : '[]',
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  for (const analysisJob of Array.isArray(snapshot.savedAnalysisJobs) ? snapshot.savedAnalysisJobs : []) {
    await insertSavedAnalysisJob({
      id: `analysis-${randomUUID()}`,
      projectId: restoredProjectId,
      label: typeof analysisJob.label === 'string' ? analysisJob.label : 'Restored analysis',
      analysisKind: typeof analysisJob.analysisKind === 'string' ? analysisJob.analysisKind : 'regression',
      analysisJson: typeof analysisJob.analysisJson === 'string'
        ? analysisJob.analysisJson
        : JSON.stringify(analysisJob.analysis ?? {}),
      createdAt: parseIsoDate(analysisJob.createdAt) ?? timestamp,
      updatedAt: parseIsoDate(analysisJob.updatedAt) ?? timestamp
    });
  }

  for (const query of Array.isArray(snapshot.savedQualitativeQueries) ? snapshot.savedQualitativeQueries : []) {
    await insertSavedQualitativeQuery({
      id: `qual-query-${randomUUID()}`,
      projectId: restoredProjectId,
      label: typeof query.label === 'string' ? query.label : 'Restored query',
      mode: typeof query.mode === 'string' ? query.mode : 'retrieval',
      queryJson: typeof query.queryJson === 'string' ? query.queryJson : '{}',
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  for (const assignment of Array.isArray(snapshot.codingAssignments) ? snapshot.codingAssignments : []) {
    const sourceId = assignment.sourceId ? (sourceIdMap.get(String(assignment.sourceId)) ?? null) : null;
    const codeId = assignment.codeId ? (codeIdMap.get(String(assignment.codeId)) ?? null) : null;
    const caseId = assignment.caseId ? (caseIdMap.get(String(assignment.caseId)) ?? null) : null;
    const assigneeUserId = await resolveUserIdByUsername(assignment.assigneeUsername);
    await insertCodingAssignment({
      id: `assignment-${randomUUID()}`,
      projectId: restoredProjectId,
      title: typeof assignment.title === 'string' ? assignment.title : 'Restored assignment',
      description: typeof assignment.description === 'string' ? assignment.description : '',
      sourceId,
      codeId,
      caseId,
      assigneeUserId,
      assigneeUsername: typeof assignment.assigneeUsername === 'string' ? assignment.assigneeUsername : null,
      status: parseCodingAssignmentStatus(assignment.status),
      priority: parseCodingAssignmentPriority(assignment.priority),
      dueAt: parseOptionalIsoDate(assignment.dueAt),
      createdByUserId: null,
      createdByUsername: typeof assignment.createdByUsername === 'string' ? assignment.createdByUsername : params.username,
      createdAt: parseIsoDate(assignment.createdAt) ?? timestamp,
      updatedAt: parseIsoDate(assignment.updatedAt) ?? timestamp,
      completedAt: parseOptionalIsoDate(assignment.completedAt)
    });
  }

  for (const entry of Array.isArray(snapshot.codingConflictResolutions) ? snapshot.codingConflictResolutions : []) {
    const segmentId = segmentIdMap.get(String(entry.segmentId));
    const codeId = codeIdMap.get(String(entry.codeId));
    if (!segmentId || !codeId) continue;
    await insertCodingConflictResolution({
      id: `merge-resolution-${randomUUID()}`,
      projectId: restoredProjectId,
      segmentId,
      codeId,
      status: entry.status === 'deferred' || entry.status === 'reopened' || entry.status === 'restored' ? entry.status : 'resolved',
      keepMode: typeof entry.keepMode === 'string' ? entry.keepMode : null,
      keepApplicationId: null,
      keepCoderId: typeof entry.keepCoderId === 'string' ? entry.keepCoderId : null,
      removedApplicationIdsJson: typeof entry.removedApplicationIdsJson === 'string' ? entry.removedApplicationIdsJson : '[]',
      removedCount: typeof entry.removedCount === 'number' ? entry.removedCount : 0,
      resolutionNote: typeof entry.resolutionNote === 'string' ? entry.resolutionNote : '',
      actorUserId: null,
      actorUsername: typeof entry.actorUsername === 'string' ? entry.actorUsername : params.username,
      metadataJson: typeof entry.metadataJson === 'string' ? entry.metadataJson : '{}',
      createdAt: parseIsoDate(entry.createdAt) ?? timestamp
    });
  }

  for (const triage of Array.isArray(snapshot.codingConflictTriages) ? snapshot.codingConflictTriages : []) {
    const segmentId = segmentIdMap.get(String(triage.segmentId));
    const codeId = codeIdMap.get(String(triage.codeId));
    if (!segmentId || !codeId) continue;
    const assigneeUserId = await resolveUserIdByUsername(triage.assigneeUsername);
    const reviewerUserId = await resolveUserIdByUsername(triage.reviewerUsername);
    await upsertCodingConflictTriage({
      id: `triage-${randomUUID()}`,
      projectId: restoredProjectId,
      segmentId,
      codeId,
      status: parseCodingConflictTriageStatus(triage.status),
      severity: parseCodingConflictTriageSeverity(triage.severity),
      assigneeUserId,
      assigneeUsername: typeof triage.assigneeUsername === 'string' ? triage.assigneeUsername : null,
      reviewerUserId,
      reviewerUsername: typeof triage.reviewerUsername === 'string' ? triage.reviewerUsername : null,
      dueAt: parseOptionalIsoDate(triage.dueAt),
      triageNote: typeof triage.triageNote === 'string' ? triage.triageNote : '',
      labelsJson: typeof triage.labelsJson === 'string' ? triage.labelsJson : '[]',
      metadataJson: typeof triage.metadataJson === 'string' ? triage.metadataJson : '{}',
      createdByUserId: null,
      createdByUsername: typeof triage.createdByUsername === 'string' ? triage.createdByUsername : params.username,
      createdAt: parseIsoDate(triage.createdAt) ?? timestamp,
      updatedAt: parseIsoDate(triage.updatedAt) ?? timestamp
    });
  }

  for (const calibration of Array.isArray(snapshot.codingCalibrationSessions) ? snapshot.codingCalibrationSessions : []) {
    const targetCodeId = calibration.targetCodeId ? (codeIdMap.get(String(calibration.targetCodeId)) ?? null) : null;
    const mappedSampleSegments = Array.isArray(calibration.sampleSegmentIds)
      ? calibration.sampleSegmentIds
        .map((segmentId: unknown) => segmentIdMap.get(String(segmentId)))
        .filter((value: unknown): value is string => Boolean(value))
      : (() => {
        if (typeof calibration.sampleSegmentIdsJson !== 'string') return [];
        try {
          const parsed = JSON.parse(calibration.sampleSegmentIdsJson);
          return Array.isArray(parsed)
            ? parsed.map((segmentId: unknown) => segmentIdMap.get(String(segmentId))).filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
            : [];
        } catch {
          return [];
        }
      })();
    await insertCodingCalibrationSession({
      id: `calibration-${randomUUID()}`,
      projectId: restoredProjectId,
      label: typeof calibration.label === 'string' ? calibration.label : 'Restored calibration session',
      scopeJson: typeof calibration.scopeJson === 'string'
        ? calibration.scopeJson
        : JSON.stringify(typeof calibration.scope === 'object' && calibration.scope ? calibration.scope : {}),
      targetCodeId,
      coderAId: typeof calibration.coderAId === 'string' ? calibration.coderAId : null,
      coderBId: typeof calibration.coderBId === 'string' ? calibration.coderBId : null,
      sampleSegmentIdsJson: JSON.stringify(mappedSampleSegments),
      status: parseCodingCalibrationStatus(calibration.status),
      targetAgreement: parseOptionalBoundedNumber(calibration.targetAgreement, 0, 1) ?? 0.8,
      targetKappa: parseOptionalBoundedNumber(calibration.targetKappa, -1, 1) ?? 0.7,
      minSamples: parsePositiveInteger(calibration.minSamples, 25, 5, 500),
      latestResultJson: typeof calibration.latestResultJson === 'string'
        ? calibration.latestResultJson
        : JSON.stringify(typeof calibration.latestResult === 'object' && calibration.latestResult ? calibration.latestResult : {}),
      createdByUserId: null,
      createdByUsername: typeof calibration.createdByUsername === 'string' ? calibration.createdByUsername : params.username,
      createdAt: parseIsoDate(calibration.createdAt) ?? timestamp,
      updatedAt: parseIsoDate(calibration.updatedAt) ?? timestamp,
      completedAt: parseOptionalIsoDate(calibration.completedAt)
    });
  }

  const snapshotMergePolicy = typeof snapshot.mergeGovernancePolicy === 'object' && snapshot.mergeGovernancePolicy
    ? snapshot.mergeGovernancePolicy
    : null;
  if (snapshotMergePolicy) {
    await upsertCodingMergeGovernancePolicy({
      projectId: restoredProjectId,
      requireResolutionNote: parseBooleanFlag((snapshotMergePolicy as Record<string, unknown>).requireResolutionNote, true),
      restrictResolutionToOwnerOrProfessor: parseBooleanFlag((snapshotMergePolicy as Record<string, unknown>).restrictResolutionToOwnerOrProfessor, true),
      requireSecondReviewerForHighRisk: parseBooleanFlag((snapshotMergePolicy as Record<string, unknown>).requireSecondReviewerForHighRisk, true),
      highRiskMinCoderCount: parsePositiveInteger((snapshotMergePolicy as Record<string, unknown>).highRiskMinCoderCount, 3, 1, 20),
      highRiskMinConfidenceSpread: parseOptionalBoundedNumber((snapshotMergePolicy as Record<string, unknown>).highRiskMinConfidenceSpread, 0, 1) ?? 0.35,
      requiredApprovalCountForHighRisk: parsePositiveInteger((snapshotMergePolicy as Record<string, unknown>).requiredApprovalCountForHighRisk, 1, 1, 5),
      approvalExpiryHours: parsePositiveInteger((snapshotMergePolicy as Record<string, unknown>).approvalExpiryHours, 168, 1, 720),
      defaultTriageSlaHours: parsePositiveInteger((snapshotMergePolicy as Record<string, unknown>).defaultTriageSlaHours, 72, 1, 720),
      updatedAt: timestamp,
      updatedByUserId: null
    });
  }

  for (const approval of Array.isArray(snapshot.mergeApprovals) ? snapshot.mergeApprovals : []) {
    const segmentId = segmentIdMap.get(String(approval.segmentId));
    const codeId = codeIdMap.get(String(approval.codeId));
    if (!segmentId || !codeId) continue;
    const approverUserId = await resolveUserIdByUsername(approval.approvedByUsername);
    await upsertCodingMergeApproval({
      id: `approval-${randomUUID()}`,
      projectId: restoredProjectId,
      segmentId,
      codeId,
      approvedByUserId: approverUserId,
      approvedByUsername: typeof approval.approvedByUsername === 'string' ? approval.approvedByUsername : params.username,
      note: typeof approval.note === 'string' ? approval.note : '',
      createdAt: parseIsoDate(approval.createdAt) ?? timestamp,
      usedAt: parseOptionalIsoDate(approval.usedAt),
      revokedAt: parseOptionalIsoDate(approval.revokedAt)
    });
  }

  for (const message of Array.isArray(snapshot.projectMessages) ? snapshot.projectMessages : []) {
    const username = typeof message.username === 'string' ? message.username : '';
    const author = username ? await findUserByUsername(username) : null;
    await insertProjectMessage({
      id: `message-${randomUUID()}`,
      projectId: restoredProjectId,
      userId: author?.user.id ?? params.restoringUserId,
      body: typeof message.body === 'string' ? message.body : '',
      createdAt: parseIsoDate(message.createdAt) ?? timestamp
    });
  }

  await deriveTraceLinks(restoredProjectId);
  return { projectId: restoredProjectId, projectName: restoredProjectName };
}

function getLoginThrottleKey(request: FastifyRequest, username: string): string {
  const ip = request.ip || 'unknown';
  return `${username}:${ip}`;
}

function assertLoginAllowed(request: FastifyRequest, reply: FastifyReply, username: string): boolean {
  const entry = failedLoginAttempts.get(getLoginThrottleKey(request, username));
  if (!entry) return true;
  if (entry.lockedUntil <= Date.now() && Date.now() - entry.windowStartedAt > LOGIN_THROTTLE_WINDOW_MS) {
    failedLoginAttempts.delete(getLoginThrottleKey(request, username));
    return true;
  }
  if (entry.lockedUntil > Date.now()) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.lockedUntil - Date.now()) / 1000));
    const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    void reply
      .header('Retry-After', String(retryAfterSeconds))
      .status(429)
      .send(fail('THROTTLED', `Too many failed sign-in attempts. Try again in about ${retryAfterMinutes} minute${retryAfterMinutes === 1 ? '' : 's'}.`));
    return false;
  }
  return true;
}

function recordFailedLogin(request: FastifyRequest, username: string): void {
  const key = getLoginThrottleKey(request, username);
  const current = failedLoginAttempts.get(key) ?? { count: 0, lockedUntil: 0, windowStartedAt: Date.now() };
  const windowExpired = Date.now() - current.windowStartedAt > LOGIN_THROTTLE_WINDOW_MS;
  const baseCount = windowExpired || (current.lockedUntil <= Date.now() && current.count >= LOGIN_THROTTLE_MAX_FAILURES) ? 0 : current.count;
  const nextCount = baseCount + 1;
  failedLoginAttempts.set(key, {
    count: nextCount,
    lockedUntil: nextCount >= LOGIN_THROTTLE_MAX_FAILURES ? Date.now() + LOGIN_THROTTLE_WINDOW_MS : 0,
    windowStartedAt: windowExpired ? Date.now() : current.windowStartedAt
  });
}

function clearFailedLogin(request: FastifyRequest, username: string): void {
  failedLoginAttempts.delete(getLoginThrottleKey(request, username));
}

function parseEvidenceQuery(query: Partial<{
  sourceId: string;
  sourceKind: string;
  segmentKind: string;
  codeId: string;
  coCodeId: string;
  caseId: string;
  coderId: string;
  searchText: string;
  memoOnly: string;
}>): {
  sourceId?: string;
  sourceKind?: 'document' | 'transcript' | 'audio' | 'video' | 'pdf' | 'dataset' | 'survey';
  segmentKind?: 'text_range' | 'time_range' | 'page_region';
  codeId?: string;
  coCodeId?: string;
  caseId?: string;
  coderId?: string;
  searchText?: string;
  memoOnly?: boolean;
} {
  return {
    sourceId: typeof query.sourceId === 'string' && query.sourceId.trim() ? query.sourceId.trim() : undefined,
    sourceKind: typeof query.sourceKind === 'string' && query.sourceKind.trim()
      ? parseSourceKind(query.sourceKind)
      : undefined,
    segmentKind: typeof query.segmentKind === 'string' && query.segmentKind.trim()
      ? parseSegmentKind(query.segmentKind)
      : undefined,
    codeId: typeof query.codeId === 'string' && query.codeId.trim() ? query.codeId.trim() : undefined,
    coCodeId: typeof query.coCodeId === 'string' && query.coCodeId.trim() ? query.coCodeId.trim() : undefined,
    caseId: typeof query.caseId === 'string' && query.caseId.trim() ? query.caseId.trim() : undefined,
    coderId: typeof query.coderId === 'string' && query.coderId.trim() ? query.coderId.trim() : undefined,
    searchText: typeof query.searchText === 'string' && query.searchText.trim() ? query.searchText.trim() : undefined,
    memoOnly: query.memoOnly === 'true'
  };
}

type ParsedEvidenceQuery = ReturnType<typeof parseEvidenceQuery>;
type QualitativeProjectPayload = Awaited<ReturnType<typeof buildQualitativeProjectPayload>>;

function chooseAxionPrefilterSeedRegion(query: ParsedEvidenceQuery): 'logic' | 'memory' | 'emotion' {
  if (query.codeId || query.coCodeId || query.coderId) return 'logic';
  if (query.memoOnly) return 'emotion';
  return 'memory';
}

function shouldRunAxionPrefilter(query: ParsedEvidenceQuery, segmentCount: number): boolean {
  if (!isAxionPrefilterEnabled || !isAxionSidecarEnabled) return false;
  if (segmentCount < 120) return false;
  return Boolean(
    query.searchText
    || query.codeId
    || query.coCodeId
    || query.sourceId
    || query.sourceKind
    || query.segmentKind
    || query.caseId
    || query.coderId
    || query.memoOnly
  );
}

async function applyAxionPrefilterToQualitativePayload(
  payload: QualitativeProjectPayload,
  query: ParsedEvidenceQuery,
  options?: {
    searchTextHint?: string;
    preferredMaxRows?: number;
  }
): Promise<{
  payload: QualitativeProjectPayload;
  prefilter: {
    applied: boolean;
    enabled: boolean;
    candidateCount: number;
    totalSegments: number;
    seedRegion: string;
    reason?: string;
    durationMs?: number;
  };
}> {
  const totalSegments = payload.segments.length;
  const seedRegion = chooseAxionPrefilterSeedRegion(query);
  if (!shouldRunAxionPrefilter(query, totalSegments)) {
    return {
      payload,
      prefilter: {
        applied: false,
        enabled: isAxionPrefilterEnabled,
        candidateCount: totalSegments,
        totalSegments,
        seedRegion,
        reason: 'prefilter_not_required'
      }
    };
  }

  const codeCountsBySegmentId = new Map<string, number>();
  for (const item of payload.codeApplications) {
    codeCountsBySegmentId.set(item.segmentId, (codeCountsBySegmentId.get(item.segmentId) ?? 0) + 1);
  }
  const queryText = query.searchText
    ?? options?.searchTextHint
    ?? query.codeId
    ?? query.coCodeId
    ?? query.sourceId
    ?? query.caseId
    ?? '';
  const preferredMaxRows = Math.max(50, Math.min(5000, Number(options?.preferredMaxRows ?? 400)));
  const topK = Math.min(
    totalSegments,
    Math.max(preferredMaxRows * 3, Math.round(totalSegments * (query.searchText ? 0.45 : 0.7)))
  );
  const prefilterResponse = await axionSidecarRequest<{
    ok?: boolean;
    result?: {
      candidateSegmentIds?: string[];
      durationMs?: number;
    };
  }>('POST', '/parallel-cubed/prefilter', {
    query: queryText,
    seedRegion,
    topK,
    minScore: Number(process.env.MU_AXION_PREFILTER_MIN_SCORE ?? 0.08),
    feedback: 0.0,
    entropy: query.memoOnly ? 0.2 : 0.08,
    confidence: 0.82,
    segments: payload.segments.map((segment) => ({
      id: segment.id,
      sourceId: segment.sourceId,
      kind: segment.kind,
      text: segment.text,
      codeCount: codeCountsBySegmentId.get(segment.id) ?? 0
    }))
  });

  const candidateIds = prefilterResponse?.result?.candidateSegmentIds
    ?.map((item) => String(item ?? '').trim())
    .filter(Boolean) ?? [];
  if (candidateIds.length === 0 || candidateIds.length >= totalSegments) {
    return {
      payload,
      prefilter: {
        applied: false,
        enabled: isAxionPrefilterEnabled,
        candidateCount: totalSegments,
        totalSegments,
        seedRegion,
        reason: candidateIds.length === 0 ? 'no_candidates' : 'no_reduction',
        durationMs: prefilterResponse?.result?.durationMs
      }
    };
  }

  const candidateSet = new Set(candidateIds);
  const filteredSegments = payload.segments.filter((segment) => candidateSet.has(segment.id));
  const segmentIdSet = new Set(filteredSegments.map((segment) => segment.id));
  const filteredCodeApplications = payload.codeApplications.filter((application) => segmentIdSet.has(application.segmentId));
  const sourceIdSet = new Set(filteredSegments.map((segment) => segment.sourceId));
  const filteredSources = payload.sources.filter((source) => sourceIdSet.has(source.id));

  const caseIdFromCodeApplicationSet = new Set(filteredCodeApplications.map((application) => application.caseId).filter((value): value is string => Boolean(value)));
  const filteredCases = payload.cases.filter((caseEntity) => {
    if (caseIdFromCodeApplicationSet.has(caseEntity.id)) return true;
    return caseEntity.sourceIds.some((sourceId) => sourceIdSet.has(sourceId));
  });
  const caseIdSet = new Set(filteredCases.map((caseEntity) => caseEntity.id));
  const filteredAttributes = payload.attributes.filter((attribute) => {
    if (attribute.targetType === 'source') return sourceIdSet.has(attribute.targetId);
    if (attribute.targetType === 'case') return caseIdSet.has(attribute.targetId);
    return true;
  });
  const filteredMemos = payload.memos.filter((memo) => {
    if (memo.targetType === 'segment') return segmentIdSet.has(memo.targetId);
    if (memo.targetType === 'source') return sourceIdSet.has(memo.targetId);
    if (memo.targetType === 'case') return caseIdSet.has(memo.targetId);
    return true;
  });
  const filteredAnnotations = payload.annotations.filter((annotation) => {
    if (annotation.targetType === 'segment') return segmentIdSet.has(annotation.targetId);
    if (annotation.targetType === 'source') return sourceIdSet.has(annotation.targetId);
    if (annotation.targetType === 'case') return caseIdSet.has(annotation.targetId);
    return true;
  });
  const filteredRelationships = payload.relationships.filter((relationship) => {
    if (relationship.leftTargetType === 'segment' && !segmentIdSet.has(relationship.leftTargetId)) return false;
    if (relationship.rightTargetType === 'segment' && !segmentIdSet.has(relationship.rightTargetId)) return false;
    if (relationship.leftTargetType === 'source' && !sourceIdSet.has(relationship.leftTargetId)) return false;
    if (relationship.rightTargetType === 'source' && !sourceIdSet.has(relationship.rightTargetId)) return false;
    if (relationship.leftTargetType === 'case' && !caseIdSet.has(relationship.leftTargetId)) return false;
    if (relationship.rightTargetType === 'case' && !caseIdSet.has(relationship.rightTargetId)) return false;
    return true;
  });
  const filteredTranscriptSyncLinks = payload.transcriptSyncLinks.filter((link) => {
    if (link.segmentId && !segmentIdSet.has(link.segmentId)) return false;
    if (!sourceIdSet.has(link.mediaSourceId)) return false;
    if (!sourceIdSet.has(link.transcriptSourceId)) return false;
    return true;
  });

  return {
    payload: {
      ...payload,
      sources: filteredSources,
      segments: filteredSegments,
      codeApplications: filteredCodeApplications,
      cases: filteredCases,
      memos: filteredMemos,
      attributes: filteredAttributes,
      annotations: filteredAnnotations,
      relationships: filteredRelationships,
      transcriptSyncLinks: filteredTranscriptSyncLinks
    },
    prefilter: {
      applied: true,
      enabled: isAxionPrefilterEnabled,
      candidateCount: filteredSegments.length,
      totalSegments,
      seedRegion,
      durationMs: prefilterResponse?.result?.durationMs
    }
  };
}

function parseTextSearchMode(value: unknown): 'contains' | 'phrase' | 'whole_word' | 'wildcard' | 'regex' | 'fuzzy' {
  return value === 'phrase'
    || value === 'whole_word'
    || value === 'wildcard'
    || value === 'regex'
    || value === 'fuzzy'
    ? value
    : 'contains';
}

function parseTextSearchLinguisticMode(value: unknown): 'none' | 'stem' | 'lemma' {
  return value === 'stem' || value === 'lemma' ? value : 'none';
}

function parsePatternAutocodeMatchMode(value: unknown): 'contains' | 'phrase' | 'whole_word' {
  return value === 'contains' || value === 'whole_word' ? value : 'phrase';
}

function parseTextSearchCodingScope(value: unknown): 'all' | 'coded_only' | 'uncoded_only' {
  return value === 'coded_only' || value === 'uncoded_only' ? value : 'all';
}

function parseTextSearchSortBy(value: unknown): 'hits_desc' | 'source' | 'segment' {
  return value === 'source' || value === 'segment' ? value : 'hits_desc';
}

function parseCompoundQueryClauses(value: unknown): Array<{
  field: 'text' | 'code' | 'case' | 'source' | 'coder' | 'memo' | 'source_kind' | 'segment_kind';
  operator: 'contains' | 'equals' | 'whole_word' | 'phrase' | 'present' | 'starts_with' | 'ends_with' | 'wildcard' | 'regex' | 'fuzzy' | 'near';
  value?: string;
  enabled?: boolean;
  negate?: boolean;
  linguisticMode?: 'none' | 'stem' | 'lemma';
  fuzzyDistance?: number;
  proximityWithin?: number;
  proximityOrdered?: boolean;
}> {
  if (!Array.isArray(value)) return [];
  const validFields = new Set(['text', 'code', 'case', 'source', 'coder', 'memo', 'source_kind', 'segment_kind']);
  const validOperators = new Set(['contains', 'equals', 'whole_word', 'phrase', 'present', 'starts_with', 'ends_with', 'wildcard', 'regex', 'fuzzy', 'near']);
  return value.flatMap((item) => {
    const field = typeof item?.field === 'string' && validFields.has(item.field) ? item.field as 'text' | 'code' | 'case' | 'source' | 'coder' | 'memo' | 'source_kind' | 'segment_kind' : null;
    const operator = typeof item?.operator === 'string' && validOperators.has(item.operator) ? item.operator as 'contains' | 'equals' | 'whole_word' | 'phrase' | 'present' | 'starts_with' | 'ends_with' | 'wildcard' | 'regex' | 'fuzzy' | 'near' : null;
    if (!field || !operator) return [];
    return [{
      field,
      operator,
      value: typeof item?.value === 'string' && item.value.trim() ? item.value.trim() : undefined,
      enabled: item?.enabled === false || item?.enabled === 'false' ? false : true,
      negate: item?.negate === true || item?.negate === 'true',
      linguisticMode: parseTextSearchLinguisticMode(item?.linguisticMode),
      fuzzyDistance: parsePositiveInteger(item?.fuzzyDistance, 1, 1, 3),
      proximityWithin: parsePositiveInteger(item?.proximityWithin, 6, 0, 60),
      proximityOrdered: item?.proximityOrdered === true || item?.proximityOrdered === 'true'
    }];
  });
}

type ParsedCompoundClause = ReturnType<typeof parseCompoundQueryClauses>[number];

function parseCompoundOperator(value: unknown): 'all' | 'any' | 'none' {
  return value === 'all' || value === 'none' ? value : 'any';
}

function parseCompoundWorkbenchDefinition(value: unknown): {
  groupOperator: 'all' | 'any' | 'none';
  minGroupsMatched: number | null;
  groups: Array<{
    id: string;
    label: string;
    enabled: boolean;
    operator: 'all' | 'any' | 'none';
    minClausesMatched: number | null;
    clauses: ParsedCompoundClause[];
  }>;
} {
  const body = typeof value === 'object' && value ? value as Record<string, unknown> : {};
  const rawMinGroupsMatched = body.minGroupsMatched === null || body.minGroupsMatched === undefined || body.minGroupsMatched === ''
    ? null
    : parsePositiveInteger(body.minGroupsMatched, 1, 1, 25);
  const groupsRaw = Array.isArray(body.groups) ? body.groups : [];
  const groups = groupsRaw.flatMap((group, index) => {
    if (!group || typeof group !== 'object') return [];
    const mapped = group as Record<string, unknown>;
    const clauses = parseCompoundQueryClauses(mapped.clauses)
      .filter((clause) => clause.enabled !== false);
    if (clauses.length === 0) return [];
    const minClausesMatched = mapped.minClausesMatched === null || mapped.minClausesMatched === undefined || mapped.minClausesMatched === ''
      ? null
      : Math.min(clauses.length, parsePositiveInteger(mapped.minClausesMatched, 1, 1, 25));
    return [{
      id: typeof mapped.id === 'string' && mapped.id.trim() ? mapped.id.trim() : `group_${index + 1}`,
      label: typeof mapped.label === 'string' && mapped.label.trim() ? mapped.label.trim() : `Group ${index + 1}`,
      enabled: mapped.enabled !== false && mapped.enabled !== 'false',
      operator: parseCompoundOperator(mapped.operator),
      minClausesMatched,
      clauses
    }];
  });
  const groupOperator = parseCompoundOperator(body.groupOperator);
  const minGroupsMatched = groupOperator === 'none' || groups.length === 0 || rawMinGroupsMatched === null
    ? null
    : Math.min(groups.length, rawMinGroupsMatched);
  return {
    groupOperator,
    minGroupsMatched,
    groups
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stemToken(value: string): string {
  const token = value.toLowerCase();
  if (token.length <= 3) return token;
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith('ing') && token.length > 5) return token.slice(0, -3);
  if (token.endsWith('ed') && token.length > 4) return token.slice(0, -2);
  if (token.endsWith('ly') && token.length > 4) return token.slice(0, -2);
  if (token.endsWith('es') && token.length > 4) return token.slice(0, -2);
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
  return token;
}

const LEMMA_LOOKUP = new Map<string, string>([
  ['children', 'child'],
  ['men', 'man'],
  ['women', 'woman'],
  ['better', 'good'],
  ['best', 'good'],
  ['worse', 'bad'],
  ['worst', 'bad'],
  ['went', 'go'],
  ['gone', 'go'],
  ['did', 'do'],
  ['done', 'do'],
  ['was', 'be'],
  ['were', 'be'],
  ['has', 'have'],
  ['had', 'have']
]);

function normalizeSearchToken(token: string, linguisticMode: 'none' | 'stem' | 'lemma'): string {
  const lower = token.toLowerCase();
  if (linguisticMode === 'lemma') return LEMMA_LOOKUP.get(lower) ?? stemToken(lower);
  if (linguisticMode === 'stem') return stemToken(lower);
  return lower;
}

function tokenizeForSearch(
  text: string,
  caseSensitive: boolean,
  linguisticMode: 'none' | 'stem' | 'lemma'
): Array<{ token: string; start: number; end: number }> {
  const regex = /[A-Za-z0-9][A-Za-z0-9'_-]*/g;
  const results: Array<{ token: string; start: number; end: number }> = [];
  for (const match of text.matchAll(regex)) {
    const raw = match[0];
    const start = match.index ?? 0;
    const baseToken = caseSensitive ? raw : raw.toLowerCase();
    results.push({
      token: linguisticMode === 'none' ? baseToken : normalizeSearchToken(baseToken, linguisticMode),
      start,
      end: start + raw.length
    });
  }
  return results;
}

function findTokenSequenceRanges(
  targetTokens: Array<{ token: string; start: number; end: number }>,
  needleTokens: string[]
): Array<{ start: number; end: number }> {
  if (needleTokens.length === 0 || targetTokens.length < needleTokens.length) return [];
  const ranges: Array<{ start: number; end: number }> = [];
  for (let index = 0; index <= targetTokens.length - needleTokens.length; index += 1) {
    let matches = true;
    for (let offset = 0; offset < needleTokens.length; offset += 1) {
      if (targetTokens[index + offset]?.token !== needleTokens[offset]) {
        matches = false;
        break;
      }
    }
    if (!matches) continue;
    ranges.push({
      start: targetTokens[index]!.start,
      end: targetTokens[index + needleTokens.length - 1]!.end
    });
  }
  return ranges;
}

function findTokenSequenceIndexes(
  targetTokens: string[],
  needleTokens: string[]
): Array<{ start: number; end: number }> {
  if (needleTokens.length === 0 || targetTokens.length < needleTokens.length) return [];
  const indexes: Array<{ start: number; end: number }> = [];
  for (let index = 0; index <= targetTokens.length - needleTokens.length; index += 1) {
    let matches = true;
    for (let offset = 0; offset < needleTokens.length; offset += 1) {
      if (targetTokens[index + offset] !== needleTokens[offset]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      indexes.push({ start: index, end: index + needleTokens.length - 1 });
    }
  }
  return indexes;
}

function buildWildcardRegex(pattern: string, caseSensitive: boolean): RegExp {
  const escaped = pattern
    .split('')
    .map((char) => {
      if (char === '*') return '.*';
      if (char === '?') return '.';
      return escapeRegex(char);
    })
    .join('');
  return new RegExp(escaped, caseSensitive ? 'g' : 'gi');
}

function levenshteinDistance(left: string, right: string, maxDistance: number): number {
  if (left === right) return 0;
  if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1;
  const previous = new Array(right.length + 1).fill(0).map((_, index) => index);
  const current = new Array(right.length + 1).fill(0);
  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row;
    let minRowValue = current[0];
    for (let column = 1; column <= right.length; column += 1) {
      const substitution = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + substitution
      );
      minRowValue = Math.min(minRowValue, current[column]!);
    }
    if (minRowValue > maxDistance) return maxDistance + 1;
    for (let column = 0; column <= right.length; column += 1) {
      previous[column] = current[column]!;
    }
  }
  return previous[right.length] ?? maxDistance + 1;
}

function findFuzzyRanges(params: {
  text: string;
  searchText: string;
  caseSensitive: boolean;
  linguisticMode: 'none' | 'stem' | 'lemma';
  fuzzyDistance: number;
}): Array<{ start: number; end: number }> {
  const fuzzyDistance = parsePositiveInteger(params.fuzzyDistance, 1, 1, 3);
  const targetTokens = tokenizeForSearch(params.text, params.caseSensitive, params.linguisticMode);
  const needleTokens = tokenizeForSearch(params.searchText, params.caseSensitive, params.linguisticMode)
    .map((token) => token.token);
  if (needleTokens.length === 0 || targetTokens.length === 0) return [];
  return targetTokens
    .filter((token) => needleTokens.some((needle) => levenshteinDistance(token.token, needle, fuzzyDistance) <= fuzzyDistance))
    .map((token) => ({ start: token.start, end: token.end }));
}

function parseProximityPair(value: string): { left: string; right: string } | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const splitByPipe = normalized.split(/\s*\|\s*/);
  if (splitByPipe.length === 2 && splitByPipe.every(Boolean)) {
    return { left: splitByPipe[0]!, right: splitByPipe[1]! };
  }
  const splitByDoubleColon = normalized.split(/\s*::\s*/);
  if (splitByDoubleColon.length === 2 && splitByDoubleColon.every(Boolean)) {
    return { left: splitByDoubleColon[0]!, right: splitByDoubleColon[1]! };
  }
  const nearMatch = normalized.match(/^(.+?)\s+(?:near|~)\s+(.+)$/i);
  if (nearMatch?.[1] && nearMatch?.[2]) {
    return { left: nearMatch[1].trim(), right: nearMatch[2].trim() };
  }
  return null;
}

function matchesProximity(params: {
  target: string;
  value: string;
  caseSensitive: boolean;
  linguisticMode: 'none' | 'stem' | 'lemma';
  proximityWithin: number;
  proximityOrdered: boolean;
}): boolean {
  const pair = parseProximityPair(params.value);
  if (!pair) return false;
  const targetTokens = tokenizeForSearch(params.target, params.caseSensitive, params.linguisticMode).map((token) => token.token);
  const leftNeedles = tokenizeForSearch(pair.left, params.caseSensitive, params.linguisticMode).map((token) => token.token);
  const rightNeedles = tokenizeForSearch(pair.right, params.caseSensitive, params.linguisticMode).map((token) => token.token);
  if (targetTokens.length === 0 || leftNeedles.length === 0 || rightNeedles.length === 0) return false;
  const within = parsePositiveInteger(params.proximityWithin, 6, 0, 60);
  const leftIndexes = findTokenSequenceIndexes(targetTokens, leftNeedles);
  const rightIndexes = findTokenSequenceIndexes(targetTokens, rightNeedles);
  for (const left of leftIndexes) {
    for (const right of rightIndexes) {
      if (params.proximityOrdered && right.start <= left.end) continue;
      const gap = right.start > left.end
        ? right.start - left.end - 1
        : left.start - right.end - 1;
      if (gap <= within) return true;
    }
  }
  return false;
}

function matchesCompoundToken(
  value: string,
  operator: ParsedCompoundClause['operator'],
  target: string,
  caseSensitive: boolean,
  options?: {
    linguisticMode?: 'none' | 'stem' | 'lemma';
    fuzzyDistance?: number;
    proximityWithin?: number;
    proximityOrdered?: boolean;
  }
): boolean {
  const linguisticMode = options?.linguisticMode ?? 'none';
  const fuzzyDistance = parsePositiveInteger(options?.fuzzyDistance, 1, 1, 3);
  const proximityWithin = parsePositiveInteger(options?.proximityWithin, 6, 0, 60);
  const proximityOrdered = options?.proximityOrdered === true;
  const normalizedValue = caseSensitive ? value.trim() : value.trim().toLowerCase();
  const normalizedTarget = caseSensitive ? target.trim() : target.trim().toLowerCase();
  if (operator === 'present') return normalizedTarget.length > 0;
  if (!normalizedValue) return false;
  if (operator === 'equals') return normalizedTarget === normalizedValue;
  if (operator === 'starts_with') return normalizedTarget.startsWith(normalizedValue);
  if (operator === 'ends_with') return normalizedTarget.endsWith(normalizedValue);
  if (operator === 'whole_word') {
    if (linguisticMode !== 'none') {
      const targetTokens = tokenizeForSearch(target, caseSensitive, linguisticMode).map((token) => token.token);
      const needleTokens = tokenizeForSearch(value, caseSensitive, linguisticMode).map((token) => token.token);
      return needleTokens.length > 0 && findTokenSequenceIndexes(targetTokens, needleTokens).length > 0;
    }
    return new RegExp(`\\b${escapeRegex(normalizedValue)}\\b`, caseSensitive ? '' : 'i').test(target);
  }
  if (operator === 'wildcard') {
    return buildWildcardRegex(normalizedValue, caseSensitive).test(normalizedTarget);
  }
  if (operator === 'regex') {
    try {
      return new RegExp(value, caseSensitive ? '' : 'i').test(target);
    } catch {
      return false;
    }
  }
  if (operator === 'fuzzy') {
    return findFuzzyRanges({
      text: target,
      searchText: value,
      caseSensitive,
      linguisticMode,
      fuzzyDistance
    }).length > 0;
  }
  if (operator === 'near') {
    return matchesProximity({
      target,
      value,
      caseSensitive,
      linguisticMode,
      proximityWithin,
      proximityOrdered
    });
  }
  if (linguisticMode !== 'none') {
    const targetTokens = tokenizeForSearch(target, caseSensitive, linguisticMode);
    const needleTokens = tokenizeForSearch(value, caseSensitive, linguisticMode).map((token) => token.token);
    return findTokenSequenceRanges(targetTokens, needleTokens).length > 0;
  }
  return normalizedTarget.includes(normalizedValue);
}

function matchesCompoundClause(
  match: {
    segment: { id: string; sourceId: string; kind: string; text: string };
    source: { id: string; title: string | null; kind: string } | null;
    applications: Array<{ codeId: string; coderId: string }>;
    cases: Array<{ id: string; label: string }>;
    memos: Array<{ title: string; body: string }>;
  },
  clause: ParsedCompoundClause,
  caseSensitive: boolean
): boolean {
  const value = String(clause.value ?? '').trim();
  const matchOptions = {
    linguisticMode: clause.linguisticMode ?? 'none',
    fuzzyDistance: clause.fuzzyDistance,
    proximityWithin: clause.proximityWithin,
    proximityOrdered: clause.proximityOrdered
  };
  const normalizedOperator: ParsedCompoundClause['operator'] = clause.operator === 'phrase' ? 'contains' : clause.operator;
  switch (clause.field) {
    case 'text':
      return matchesCompoundToken(value, normalizedOperator, match.segment.text, caseSensitive, matchOptions);
    case 'code':
      return match.applications.some((application) => matchesCompoundToken(value, normalizedOperator, application.codeId, caseSensitive, matchOptions));
    case 'case':
      return match.cases.some((caseEntity) =>
        matchesCompoundToken(value, normalizedOperator, caseEntity.id, caseSensitive, matchOptions)
        || matchesCompoundToken(value, normalizedOperator, caseEntity.label, caseSensitive, matchOptions)
      );
    case 'source':
      return matchesCompoundToken(value, normalizedOperator, match.segment.sourceId, caseSensitive, matchOptions)
        || matchesCompoundToken(value, normalizedOperator, match.source?.title ?? '', caseSensitive, matchOptions);
    case 'coder':
      return match.applications.some((application) => matchesCompoundToken(value, normalizedOperator, application.coderId, caseSensitive, matchOptions));
    case 'memo':
      if (clause.operator === 'present') return match.memos.length > 0;
      return match.memos.some((memo) =>
        matchesCompoundToken(value, normalizedOperator, memo.title, caseSensitive, matchOptions)
        || matchesCompoundToken(value, normalizedOperator, memo.body, caseSensitive, matchOptions)
      );
    case 'source_kind':
      return matchesCompoundToken(value, normalizedOperator, match.source?.kind ?? '', caseSensitive, matchOptions);
    case 'segment_kind':
      return matchesCompoundToken(value, normalizedOperator, match.segment.kind, caseSensitive, matchOptions);
    default:
      return false;
  }
}

function evaluateCompoundClauseGroup(
  match: {
    segment: { id: string; sourceId: string; kind: string; text: string };
    source: { id: string; title: string | null; kind: string } | null;
    applications: Array<{ codeId: string; coderId: string }>;
    cases: Array<{ id: string; label: string }>;
    memos: Array<{ title: string; body: string }>;
  },
  group: {
    operator: 'all' | 'any' | 'none';
    minClausesMatched: number | null;
    clauses: ParsedCompoundClause[];
  },
  caseSensitive: boolean
): {
  passed: boolean;
  operatorMatched: boolean;
  thresholdMatched: boolean;
  matchedClauses: number;
  totalClauses: number;
  clauseMatches: boolean[];
} {
  const checks = group.clauses.map((clause) => {
    const matched = matchesCompoundClause(match, clause, caseSensitive);
    return clause.negate ? !matched : matched;
  });
  const operatorMatched = group.operator === 'all'
    ? checks.every(Boolean)
    : group.operator === 'none'
      ? checks.every((entry) => !entry)
      : checks.some(Boolean);
  const matchedClauses = checks.filter(Boolean).length;
  const totalClauses = checks.length;
  const threshold = group.minClausesMatched === null
    ? null
    : Math.min(totalClauses, Math.max(1, group.minClausesMatched));
  const thresholdMatched = threshold === null ? true : matchedClauses >= threshold;
  return {
    passed: operatorMatched && thresholdMatched,
    operatorMatched,
    thresholdMatched,
    matchedClauses,
    totalClauses,
    clauseMatches: checks
  };
}

function buildCompoundWorkbenchQuery(params: {
  scopeQuery: ReturnType<typeof parseEvidenceQuery>;
  groupOperator: 'all' | 'any' | 'none';
  minGroupsMatched: number | null;
  groups: Array<{
    id: string;
    label: string;
    enabled: boolean;
    operator: 'all' | 'any' | 'none';
    minClausesMatched: number | null;
    clauses: ParsedCompoundClause[];
  }>;
  caseSensitive: boolean;
  maxRows: number;
  sources: Awaited<ReturnType<typeof buildQualitativeProjectPayload>>['sources'];
  segments: Awaited<ReturnType<typeof buildQualitativeProjectPayload>>['segments'];
  applications: Awaited<ReturnType<typeof buildQualitativeProjectPayload>>['codeApplications'];
  cases: Awaited<ReturnType<typeof buildQualitativeProjectPayload>>['cases'];
  memos: Awaited<ReturnType<typeof buildQualitativeProjectPayload>>['memos'];
}) {
  const activeGroups = params.groups.filter((group) => group.enabled !== false && group.clauses.length > 0);
  if (activeGroups.length === 0) {
    throw new Error('At least one enabled workbench group with valid clauses is required.');
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

  const matchGroupMap = new Map<string, boolean[]>();
  const matchGroupClauseMap = new Map<string, number[]>();
  const matchGroupClauseTotalMap = new Map<string, number[]>();
  const groupBreakdown = activeGroups.map((group) => ({
    id: group.id,
    label: group.label,
    operator: group.operator,
    minClausesMatched: group.minClausesMatched,
    clauseCount: group.clauses.length,
    operatorMatchCount: 0,
    matchCount: 0,
    matchedClausesTotal: 0,
    maxMatchedClauses: 0
  }));
  const matchedItems = scopedMatches.filter((match) => {
    const groupEvaluations = activeGroups.map((group, index) => {
      const evaluation = evaluateCompoundClauseGroup(match as any, group, params.caseSensitive);
      if (evaluation.operatorMatched) groupBreakdown[index]!.operatorMatchCount += 1;
      if (evaluation.passed) groupBreakdown[index]!.matchCount += 1;
      groupBreakdown[index]!.matchedClausesTotal += evaluation.matchedClauses;
      groupBreakdown[index]!.maxMatchedClauses = Math.max(groupBreakdown[index]!.maxMatchedClauses, evaluation.matchedClauses);
      return evaluation;
    });
    const groupPasses = groupEvaluations.map((evaluation) => evaluation.passed);
    const groupMatchedCount = groupPasses.filter(Boolean).length;
    matchGroupMap.set(match.segment.id, groupPasses);
    matchGroupClauseMap.set(match.segment.id, groupEvaluations.map((evaluation) => evaluation.matchedClauses));
    matchGroupClauseTotalMap.set(match.segment.id, groupEvaluations.map((evaluation) => evaluation.totalClauses));
    const operatorPass = params.groupOperator === 'all'
      ? groupPasses.every(Boolean)
      : params.groupOperator === 'none'
        ? groupPasses.every((entry) => !entry)
        : groupPasses.some(Boolean);
    const thresholdPass = params.minGroupsMatched === null
      ? true
      : groupMatchedCount >= params.minGroupsMatched;
    return operatorPass && thresholdPass;
  });
  const items = matchedItems.slice(0, params.maxRows);
  return {
    mode: 'workbench',
    operator: params.groupOperator,
    minGroupsMatched: params.minGroupsMatched,
    caseSensitive: params.caseSensitive,
    maxRows: params.maxRows,
    scopedCount: scopedMatches.length,
    matchCount: matchedItems.length,
    returnedCount: items.length,
    sourceCount: new Set(matchedItems.map((item) => item.segment.sourceId)).size,
    caseCount: new Set(matchedItems.flatMap((item) => item.cases.map((caseEntity) => caseEntity.id))).size,
    groupCount: activeGroups.length,
    clauseCount: activeGroups.reduce((total, group) => total + group.clauses.length, 0),
    groupBreakdown: groupBreakdown.map((group) => ({
      id: group.id,
      label: group.label,
      operator: group.operator,
      minClausesMatched: group.minClausesMatched,
      clauseCount: group.clauseCount,
      operatorMatchCount: group.operatorMatchCount,
      matchCount: group.matchCount,
      avgMatchedClauses: scopedMatches.length > 0 ? group.matchedClausesTotal / scopedMatches.length : 0,
      maxMatchedClauses: group.maxMatchedClauses
    })),
    items,
    itemGroupMatches: Object.fromEntries(
      items.map((item) => [item.segment.id, (matchGroupMap.get(item.segment.id) ?? []).map((entry) => Boolean(entry))])
    ),
    itemGroupClauseMatches: Object.fromEntries(
      items.map((item) => [item.segment.id, (matchGroupClauseMap.get(item.segment.id) ?? []).map((entry) => Number(entry))])
    ),
    itemGroupClauseTotals: Object.fromEntries(
      items.map((item) => [item.segment.id, (matchGroupClauseTotalMap.get(item.segment.id) ?? []).map((entry) => Number(entry))])
    )
  };
}

function formatEvidenceFilterLabels(query: ReturnType<typeof parseEvidenceQuery>): string[] {
  return [
    query.sourceId ? `Source: ${query.sourceId}` : null,
    query.sourceKind ? `Source kind: ${query.sourceKind}` : null,
    query.segmentKind ? `Segment kind: ${query.segmentKind}` : null,
    query.codeId ? `Code: ${query.codeId}` : null,
    query.coCodeId ? `Co-coded with: ${query.coCodeId}` : null,
    query.caseId ? `Case: ${query.caseId}` : null,
    query.coderId ? `Coder: ${query.coderId}` : null,
    query.searchText ? `Search: ${query.searchText}` : null,
    query.memoOnly ? 'Memo-backed only' : null
  ].filter((value): value is string => Boolean(value));
}

type CodingDisagreementMode = 'all' | 'coder_a_only' | 'coder_b_only' | 'either_only';

function parseCodingDisagreementMode(value: unknown): CodingDisagreementMode {
  return value === 'coder_a_only' || value === 'coder_b_only' || value === 'either_only'
    ? value
    : 'all';
}

function parsePositiveInteger(value: unknown, fallback: number, min = 1, max = 500): number {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number.parseInt(value, 10)
      : Number.NaN;
  if (!Number.isFinite(parsed)) return fallback;
  const bounded = Math.floor(parsed);
  if (bounded < min) return min;
  if (bounded > max) return max;
  return bounded;
}

function parseOptionalPositiveInteger(value: unknown, min = 1, max = 500): number | null {
  if (!(typeof value === 'number' || (typeof value === 'string' && value.trim()))) return null;
  return parsePositiveInteger(value, min, min, max);
}

function parseOptionalBoundedNumber(value: unknown, min: number, max: number): number | null {
  if (!(typeof value === 'number' || (typeof value === 'string' && value.trim()))) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
}

function parseBooleanFlag(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return fallback;
}

function parseQualitativeReportOptions(value: Partial<{
  reportTopSources: string | number;
  reportTopCases: string | number;
  reportTopCodes: string | number;
  reportExcerptLimit: string | number;
  reportIncludeSources: string | boolean;
  reportIncludeCases: string | boolean;
  reportIncludeExcerpts: string | boolean;
  reportSortBy: string;
}>): {
  topSources: number;
  topCases: number;
  topCodes: number;
  excerptLimit: number;
  includeSourceCoverage: boolean;
  includeCaseCoverage: boolean;
  includeExcerptRows: boolean;
  sortBy: 'match_count' | 'memo_count';
} {
  return {
    topSources: parsePositiveInteger(value.reportTopSources, 20, 1, 500),
    topCases: parsePositiveInteger(value.reportTopCases, 20, 1, 500),
    topCodes: parsePositiveInteger(value.reportTopCodes, 5, 1, 25),
    excerptLimit: parsePositiveInteger(value.reportExcerptLimit, 60, 1, 500),
    includeSourceCoverage: parseBooleanFlag(value.reportIncludeSources, true),
    includeCaseCoverage: parseBooleanFlag(value.reportIncludeCases, true),
    includeExcerptRows: parseBooleanFlag(value.reportIncludeExcerpts, true),
    sortBy: value.reportSortBy === 'memo_count' ? 'memo_count' : 'match_count'
  };
}

function parseMapVisualizationMetric(value: unknown): 'evidence_count' | 'case_count' | 'segment_count' {
  return value === 'case_count' || value === 'segment_count'
    ? value
    : 'evidence_count';
}

function parseMapVisualizationNormalization(value: unknown): 'raw' | 'within_scope_pct' | 'log_scaled' {
  return value === 'within_scope_pct' || value === 'log_scaled'
    ? value
    : 'raw';
}

function parseMapVisualizationOptions(value: Partial<{
  mapLocationField: unknown;
  mapMetric: unknown;
  mapNormalization: unknown;
  mapMinCount: unknown;
  mapMaxPoints: unknown;
}>): {
  locationField?: string;
  metric: 'evidence_count' | 'case_count' | 'segment_count';
  normalization: 'raw' | 'within_scope_pct' | 'log_scaled';
  minCount: number;
  maxPoints: number;
} {
  return {
    locationField: typeof value.mapLocationField === 'string' && value.mapLocationField.trim()
      ? value.mapLocationField.trim()
      : undefined,
    metric: parseMapVisualizationMetric(value.mapMetric),
    normalization: parseMapVisualizationNormalization(value.mapNormalization),
    minCount: parsePositiveInteger(value.mapMinCount, 1, 1, 100000),
    maxPoints: parsePositiveInteger(value.mapMaxPoints, 150, 1, 500)
  };
}

function parseConceptNodeSizeMode(value: unknown): 'applications' | 'weighted_degree' | 'degree' {
  return value === 'weighted_degree' || value === 'degree'
    ? value
    : 'applications';
}

function parseConceptMapOptions(value: Partial<{
  conceptMinLinkWeight: unknown;
  conceptMaxLinks: unknown;
  conceptMinNodeSize: unknown;
  conceptIncludeCooccurrence: unknown;
  conceptIncludeRelationships: unknown;
  conceptNodeSizeMode: unknown;
}>): {
  minLinkWeight: number;
  maxLinks: number;
  minNodeSize: number;
  includeCooccurrenceLinks: boolean;
  includeRelationshipLinks: boolean;
  nodeSizeMode: 'applications' | 'weighted_degree' | 'degree';
} {
  return {
    minLinkWeight: parseOptionalBoundedNumber(value.conceptMinLinkWeight, 0, 100000) ?? 1,
    maxLinks: parsePositiveInteger(value.conceptMaxLinks, 250, 1, 1000),
    minNodeSize: parseOptionalBoundedNumber(value.conceptMinNodeSize, 0, 100000) ?? 0,
    includeCooccurrenceLinks: parseBooleanFlag(value.conceptIncludeCooccurrence, true),
    includeRelationshipLinks: parseBooleanFlag(value.conceptIncludeRelationships, true),
    nodeSizeMode: parseConceptNodeSizeMode(value.conceptNodeSizeMode)
  };
}

type StructuredReportStyleTemplate = 'standard' | 'committee' | 'review_board';

function parseStructuredReportStyleTemplate(value: unknown): StructuredReportStyleTemplate {
  return value === 'committee' || value === 'review_board'
    ? value
    : 'standard';
}

function parseCommitteeAppendixMode(value: unknown): 'standard' | 'expanded' {
  return value === 'expanded' ? 'expanded' : 'standard';
}

function parseSavedQueryJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function averageNullable(values: Array<number | null | undefined>): number | null {
  const usable = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!usable.length) return null;
  return usable.reduce((total, value) => total + value, 0) / usable.length;
}

function normalizeTokenTimeline(value: unknown): Array<{
  token: string;
  startMs: number;
  endMs: number;
  confidence: number | null;
  speakerLabel: string | null;
}> {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const token = typeof entry?.token === 'string' ? entry.token.trim() : '';
      if (!token) return null;
      const startMs = parsePositiveInteger(entry?.startMs, 0, 0, Number.MAX_SAFE_INTEGER);
      const endMs = parsePositiveInteger(entry?.endMs, startMs, 0, Number.MAX_SAFE_INTEGER);
      const confidence = parseOptionalBoundedNumber(entry?.confidence, 0, 1);
      const speakerLabel = typeof entry?.speakerLabel === 'string' && entry.speakerLabel.trim() ? entry.speakerLabel.trim() : null;
      return {
        token,
        startMs,
        endMs: Math.max(startMs, endMs),
        confidence,
        speakerLabel
      };
    })
    .filter((entry): entry is { token: string; startMs: number; endMs: number; confidence: number | null; speakerLabel: string | null } => Boolean(entry));
}

type TranscriptionProvider = 'internal' | 'openai';

type ParsedTranscriptionPipelineConfig = {
  language: string;
  diarization: boolean;
  punctuation: boolean;
  chunkSeconds: number;
  confidenceThreshold: number;
  speakerStrategy: 'single' | 'alternating' | 'content_based';
  provider: TranscriptionProvider;
  providerModel: string;
  providerPrompt: string;
};

type TranscriptionSyncEntry = {
  segmentId: string | null;
  startMs: number;
  endMs: number;
  transcriptText: string;
  speakerLabel: string;
  confidence: number;
  syncScore: number;
  tokenTimeline: Array<{ token: string; startMs: number; endMs: number; confidence: number; speakerLabel: string }>;
};

type TranscriptionDraftResult = {
  transcriptBody: string;
  syncEntries: TranscriptionSyncEntry[];
  modeStats: Record<string, unknown>;
};

function parseTranscriptionPipelineConfig(value: unknown): ParsedTranscriptionPipelineConfig {
  const config = typeof value === 'object' && value ? value as Record<string, unknown> : {};
  const language = typeof config.language === 'string' && config.language.trim() ? config.language.trim() : 'en';
  const diarization = config.diarization !== false;
  const punctuation = config.punctuation !== false;
  const chunkSeconds = parsePositiveInteger(config.chunkSeconds, 12, 3, 120);
  const confidenceThreshold = parseOptionalBoundedNumber(config.confidenceThreshold, 0, 1) ?? 0.55;
  const speakerStrategy = config.speakerStrategy === 'single' || config.speakerStrategy === 'content_based'
    ? config.speakerStrategy
    : 'alternating';
  const provider = config.provider === 'openai' ? 'openai' : 'internal';
  const providerModel = typeof config.providerModel === 'string' && config.providerModel.trim()
    ? config.providerModel.trim()
    : (process.env.MU_TRANSCRIPTION_OPENAI_MODEL?.trim() || 'gpt-4o-mini-transcribe');
  const providerPrompt = typeof config.providerPrompt === 'string' ? config.providerPrompt.trim() : '';
  return {
    language,
    diarization,
    punctuation,
    chunkSeconds,
    confidenceThreshold,
    speakerStrategy,
    provider,
    providerModel,
    providerPrompt
  };
}

function normalizeConfidence(value: unknown, fallback = 0.75): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed)) return Math.max(0, Math.min(1, fallback));
  return Math.max(0, Math.min(1, parsed));
}

function resolveOpenAiTranscriptionEndpoint(): string {
  const base = process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1';
  return `${base.replace(/\/+$/, '')}/audio/transcriptions`;
}

function findBestSegmentIdForTranscriptionWindow(
  entry: { startMs: number; endMs: number },
  segments: Array<{ id: string; anchor: { startMs: number; endMs: number } }>
): string | null {
  const startMs = Math.max(0, entry.startMs);
  const endMs = Math.max(startMs, entry.endMs);
  let bestId: string | null = null;
  let bestOverlap = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  const midpoint = startMs + Math.floor((endMs - startMs) / 2);
  for (const segment of segments) {
    const segmentStart = Math.max(0, Math.round(segment.anchor.startMs));
    const segmentEnd = Math.max(segmentStart, Math.round(segment.anchor.endMs));
    const overlap = Math.max(0, Math.min(endMs, segmentEnd) - Math.max(startMs, segmentStart));
    const distance = midpoint < segmentStart ? (segmentStart - midpoint) : midpoint > segmentEnd ? (midpoint - segmentEnd) : 0;
    if (overlap > bestOverlap || (overlap === bestOverlap && distance < bestDistance)) {
      bestId = segment.id;
      bestOverlap = overlap;
      bestDistance = distance;
    }
  }
  return bestId;
}

async function runOpenAiTranscription(params: {
  media: { bytes: Buffer; contentType: string; filename: string; origin: 'artifact' | 'remote' | 'local_file' };
  mediaTitle: string;
  mode: 'segment_assembly' | 'timeline_chunked' | 'hybrid';
  pipeline: ParsedTranscriptionPipelineConfig;
  timeSegments: Array<{ id: string; anchor: { startMs: number; endMs: number }; text: string }>;
}): Promise<TranscriptionDraftResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for provider-grade transcription.');
  }
  const endpoint = resolveOpenAiTranscriptionEndpoint();
  const mediaType = params.media.contentType || inferContentTypeFromFilename(params.media.filename);
  const form = new FormData();
  const mediaBlob = new Blob([Uint8Array.from(params.media.bytes)], { type: mediaType });
  form.set('file', mediaBlob, params.media.filename);
  form.set('model', params.pipeline.providerModel || 'gpt-4o-mini-transcribe');
  form.set('response_format', 'verbose_json');
  if (params.pipeline.language) form.set('language', params.pipeline.language);
  if (params.pipeline.providerPrompt) form.set('prompt', params.pipeline.providerPrompt);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI transcription failed (${response.status}). ${errorText.slice(0, 300)}`.trim());
  }

  const payload = await response.json() as Record<string, unknown>;
  const toMs = (value: unknown, fallback = 0): number => {
    const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0, Math.round(numeric * 1000));
  };

  const parsedWords = (Array.isArray(payload.words) ? payload.words : [])
    .map((wordEntry) => {
      const token = typeof wordEntry?.word === 'string'
        ? wordEntry.word.trim()
        : typeof wordEntry?.token === 'string'
          ? wordEntry.token.trim()
          : '';
      if (!token) return null;
      const startMs = toMs(wordEntry?.start, 0);
      const endMs = Math.max(startMs, toMs(wordEntry?.end, startMs));
      const confidence = normalizeConfidence(
        wordEntry?.confidence ?? wordEntry?.probability ?? wordEntry?.score,
        0.74
      );
      return {
        token,
        startMs,
        endMs,
        confidence
      };
    })
    .filter((entry): entry is { token: string; startMs: number; endMs: number; confidence: number } => Boolean(entry));

  const parsedSegments = (Array.isArray(payload.segments) ? payload.segments : [])
    .map((segmentEntry, index) => {
      const startMs = toMs(segmentEntry?.start, index * (params.pipeline.chunkSeconds * 1000));
      const endMs = Math.max(startMs + 250, toMs(segmentEntry?.end, startMs + (params.pipeline.chunkSeconds * 1000)));
      const text = typeof segmentEntry?.text === 'string' ? segmentEntry.text.trim() : '';
      if (!text) return null;
      const segmentWords = parsedWords.filter((word) => word.startMs >= startMs && word.endMs <= endMs);
      const wordConfidence = segmentWords.length > 0
        ? segmentWords.reduce((total, word) => total + word.confidence, 0) / segmentWords.length
        : null;
      const segmentConfidence = normalizeConfidence(
        segmentEntry?.confidence ?? segmentEntry?.score ?? (typeof segmentEntry?.no_speech_prob === 'number' ? 1 - segmentEntry.no_speech_prob : null),
        wordConfidence ?? 0.8
      );
      const speakerLabel = params.pipeline.diarization
        ? chooseSpeakerLabel(params.pipeline.speakerStrategy, index, text)
        : 'Speaker 1';
      const tokenTimeline = segmentWords.length > 0
        ? segmentWords.map((word) => ({
          token: word.token,
          startMs: word.startMs,
          endMs: word.endMs,
          confidence: word.confidence,
          speakerLabel
        }))
        : buildTokenTimeline({ text, startMs, endMs, speakerLabel, confidence: segmentConfidence });
      return {
        startMs,
        endMs,
        transcriptText: text,
        confidence: segmentConfidence,
        speakerLabel,
        tokenTimeline
      };
    })
    .filter((entry): entry is {
      startMs: number;
      endMs: number;
      transcriptText: string;
      confidence: number;
      speakerLabel: string;
      tokenTimeline: Array<{ token: string; startMs: number; endMs: number; confidence: number; speakerLabel: string }>;
    } => Boolean(entry));

  const chunkMs = Math.max(3000, params.pipeline.chunkSeconds * 1000);
  const entriesFromWords = () => {
    if (parsedWords.length === 0) return [];
    const grouped = new Map<number, typeof parsedWords>();
    for (const word of parsedWords) {
      const bucket = Math.floor(word.startMs / chunkMs);
      if (!grouped.has(bucket)) grouped.set(bucket, []);
      grouped.get(bucket)?.push(word);
    }
    return [...grouped.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([bucket, words], index) => {
        const startMs = bucket * chunkMs;
        const endMs = Math.max(startMs + 250, words[words.length - 1]?.endMs ?? (startMs + chunkMs));
        const transcriptText = words.map((word) => word.token).join(' ').trim();
        const confidence = words.length > 0
          ? words.reduce((total, word) => total + word.confidence, 0) / words.length
          : 0.7;
        const speakerLabel = params.pipeline.diarization
          ? chooseSpeakerLabel(params.pipeline.speakerStrategy, index, transcriptText)
          : 'Speaker 1';
        return {
          startMs,
          endMs,
          transcriptText,
          confidence,
          speakerLabel,
          tokenTimeline: words.map((word) => ({
            token: word.token,
            startMs: word.startMs,
            endMs: word.endMs,
            confidence: word.confidence,
            speakerLabel
          }))
        };
      });
  };

  let entries = parsedSegments.length > 0 ? parsedSegments : entriesFromWords();
  if (entries.length === 0) {
    const text = typeof payload.text === 'string' ? payload.text.trim() : '';
    if (text) {
      const fallbackDurationMs = Math.max(chunkMs, Math.round((text.split(/\s+/).length / 2.5) * 1000));
      const speakerLabel = params.pipeline.diarization
        ? chooseSpeakerLabel(params.pipeline.speakerStrategy, 0, text)
        : 'Speaker 1';
      const confidence = 0.7;
      entries = [{
        startMs: 0,
        endMs: fallbackDurationMs,
        transcriptText: text,
        confidence,
        speakerLabel,
        tokenTimeline: buildTokenTimeline({ text, startMs: 0, endMs: fallbackDurationMs, speakerLabel, confidence })
      }];
    }
  }
  if (entries.length === 0) {
    throw new Error('The transcription provider returned no transcript text for this media source.');
  }

  const sortedTimeSegments = [...params.timeSegments]
    .map((segment) => ({
      id: segment.id,
      anchor: {
        startMs: Number(segment.anchor.startMs ?? 0),
        endMs: Number(segment.anchor.endMs ?? 0)
      },
      text: segment.text
    }))
    .filter((segment) => segment.anchor.endMs > segment.anchor.startMs)
    .sort((left, right) => left.anchor.startMs - right.anchor.startMs);

  const acceptedEntries: TranscriptionSyncEntry[] = entries
    .map((entry) => {
      const confidence = normalizeConfidence(entry.confidence, 0.75);
      const linkedSegmentId = sortedTimeSegments.length > 0
        ? findBestSegmentIdForTranscriptionWindow(entry, sortedTimeSegments)
        : null;
      if (confidence < params.pipeline.confidenceThreshold && !linkedSegmentId) {
        return null;
      }
      return {
        segmentId: linkedSegmentId,
        startMs: Math.max(0, Math.round(entry.startMs)),
        endMs: Math.max(Math.round(entry.startMs), Math.round(entry.endMs)),
        transcriptText: entry.transcriptText.trim(),
        speakerLabel: entry.speakerLabel,
        confidence,
        syncScore: linkedSegmentId ? 0.95 : 0.7,
        tokenTimeline: entry.tokenTimeline
      };
    })
    .filter((entry): entry is TranscriptionSyncEntry => Boolean(entry))
    .sort((left, right) => left.startMs - right.startMs);

  if (acceptedEntries.length === 0) {
    throw new Error('All provider transcript segments were filtered out by the confidence threshold.');
  }

  const transcriptBody = acceptedEntries
    .map((entry) => `[${(entry.startMs / 1000).toFixed(1)}s - ${(entry.endMs / 1000).toFixed(1)}s] ${entry.speakerLabel}: ${entry.transcriptText}`)
    .join('\n');
  const generatedCoverageMs = acceptedEntries.reduce((total, entry) => total + Math.max(0, entry.endMs - entry.startMs), 0);
  const tokenCount = acceptedEntries.reduce((total, entry) => total + entry.tokenTimeline.length, 0);
  return {
    transcriptBody,
    syncEntries: acceptedEntries,
    modeStats: {
      mode: params.mode,
      provider: 'openai',
      providerModel: params.pipeline.providerModel || null,
      language: params.pipeline.language,
      sourceOrigin: params.media.origin,
      generatedEntryCount: acceptedEntries.length,
      generatedCoverageMs,
      tokenCount
    }
  };
}

function applyCodingComparisonFilters(
  comparison: ReturnType<typeof buildCodingComparison>,
  options: {
    disagreementMode: CodingDisagreementMode;
    disagreementLimit: number;
  }
) {
  const filtered = comparison.disagreements.filter((item) => {
    if (options.disagreementMode === 'coder_a_only') return item.coderAApplied && !item.coderBApplied;
    if (options.disagreementMode === 'coder_b_only') return !item.coderAApplied && item.coderBApplied;
    if (options.disagreementMode === 'either_only') return item.coderAApplied !== item.coderBApplied;
    return true;
  });
  const limited = filtered.slice(0, options.disagreementLimit);
  return {
    ...comparison,
    disagreements: limited,
    disagreementMode: options.disagreementMode,
    disagreementLimit: options.disagreementLimit,
    disagreementTotalCount: comparison.disagreements.length,
    disagreementFilteredCount: limited.length
  };
}

function applyInterRaterSummaryFilters(
  summary: ReturnType<typeof buildInterRaterSummary>,
  options: {
    minKappa: number | null;
    maxRows: number | null;
  }
) {
  const sortedRows = [...summary.rows].sort((left, right) => {
    const leftKappa = typeof left.cohensKappa === 'number' ? left.cohensKappa : Number.POSITIVE_INFINITY;
    const rightKappa = typeof right.cohensKappa === 'number' ? right.cohensKappa : Number.POSITIVE_INFINITY;
    return leftKappa - rightKappa;
  });
  const filteredRows = options.minKappa === null
    ? sortedRows
    : sortedRows.filter((row) => typeof row.cohensKappa === 'number' && row.cohensKappa <= options.minKappa!);
  const visibleRows = options.maxRows === null
    ? filteredRows
    : filteredRows.slice(0, options.maxRows);
  return {
    ...summary,
    rows: visibleRows,
    rowTotalCount: summary.rows.length,
    rowFilteredCount: filteredRows.length,
    minKappaFilter: options.minKappa,
    maxRowsFilter: options.maxRows,
    averageAgreement: averageNullable(visibleRows.map((row) => row.percentAgreement)),
    averageKappa: averageNullable(visibleRows.map((row) => row.cohensKappa))
  };
}

function formatSegmentAnchorForEvidence(segment: { kind: string; anchor: any }): string {
  if (segment.kind === 'text_range') {
    const start = typeof segment.anchor?.start === 'number' ? Math.max(0, Math.round(segment.anchor.start)) : 0;
    const end = typeof segment.anchor?.end === 'number' ? Math.max(start, Math.round(segment.anchor.end)) : start;
    return `Chars ${start}-${end}`;
  }
  if (segment.kind === 'time_range') {
    const startMs = typeof segment.anchor?.startMs === 'number' ? Math.max(0, Math.round(segment.anchor.startMs)) : 0;
    const endMs = typeof segment.anchor?.endMs === 'number' ? Math.max(startMs, Math.round(segment.anchor.endMs)) : startMs;
    return `${(startMs / 1000).toFixed(1)}s-${(endMs / 1000).toFixed(1)}s`;
  }
  if (segment.kind === 'page_region') {
    const page = typeof segment.anchor?.page === 'number' ? Math.max(1, Math.round(segment.anchor.page)) : 1;
    const hasBox = ['x', 'y', 'w', 'h'].every((key) => typeof segment.anchor?.[key] === 'number' && Number.isFinite(segment.anchor?.[key]));
    if (hasBox) {
      const x = Math.round(segment.anchor.x);
      const y = Math.round(segment.anchor.y);
      const w = Math.round(segment.anchor.w);
      const h = Math.round(segment.anchor.h);
      return `Page ${page} [${x},${y},${w},${h}]`;
    }
    return `Page ${page}`;
  }
  return 'Unspecified anchor';
}

function summarizeText(value: unknown, maxLength = 180): string {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length > maxLength
    ? `${normalized.slice(0, Math.max(1, maxLength - 1))}…`
    : normalized;
}

function enrichEvidenceBundleWithContext(params: {
  bundle: ReturnType<typeof buildEvidenceExport>;
  segments: Array<{ id: string; kind: string; anchor: any }>;
  sources: Array<{ id: string; kind: string; title: string }>;
  transcriptSyncLinks: Array<{
    id: string;
    segmentId: string | null;
    transcriptSourceId: string;
    startMs: number;
    endMs: number;
    transcriptText: string;
  }>;
}) {
  const segmentById = new Map(params.segments.map((segment) => [segment.id, segment]));
  const sourceById = new Map(params.sources.map((source) => [source.id, source]));
  const sourceTitleById = new Map(params.sources.map((source) => [source.id, source.title]));
  const syncLinksBySegmentId = new Map<string, typeof params.transcriptSyncLinks>();
  for (const link of params.transcriptSyncLinks) {
    if (!link.segmentId) continue;
    const list = syncLinksBySegmentId.get(link.segmentId) ?? [];
    list.push(link);
    syncLinksBySegmentId.set(link.segmentId, list);
  }

  const matches = params.bundle.matches.map((match) => {
    const segment = segmentById.get(match.segmentId) ?? null;
    const source = sourceById.get(match.sourceId) ?? null;
    const syncLinks = syncLinksBySegmentId.get(match.segmentId) ?? [];
    return {
      ...match,
      segmentKind: segment?.kind ?? null,
      sourceKind: source?.kind ?? null,
      anchorSummary: segment ? formatSegmentAnchorForEvidence(segment) : null,
      transcriptSyncCount: syncLinks.length,
      transcriptSyncLinks: syncLinks.map((link) => ({
        id: link.id,
        transcriptSourceId: link.transcriptSourceId,
        transcriptSourceTitle: sourceTitleById.get(link.transcriptSourceId) ?? null,
        startMs: link.startMs,
        endMs: link.endMs,
        transcriptText: link.transcriptText
      }))
    };
  });

  const sourceKindCounts = new Map<string, number>();
  let mediaMatchCount = 0;
  let transcriptLinkedMatchCount = 0;
  let transcriptLinkCount = 0;
  for (const match of matches) {
    const sourceKind = typeof match.sourceKind === 'string' && match.sourceKind.trim()
      ? match.sourceKind
      : 'unknown';
    sourceKindCounts.set(sourceKind, (sourceKindCounts.get(sourceKind) ?? 0) + 1);
    if (sourceKind === 'audio' || sourceKind === 'video') {
      mediaMatchCount += 1;
    }
    if (match.transcriptSyncCount > 0) {
      transcriptLinkedMatchCount += 1;
      transcriptLinkCount += match.transcriptSyncCount;
    }
  }

  return {
    ...params.bundle,
    matches,
    evidenceContext: {
      mediaMatchCount,
      transcriptLinkedMatchCount,
      transcriptLinkCount,
      sourceKindCoverage: [...sourceKindCounts.entries()]
        .map(([sourceKind, count]) => ({ sourceKind, count }))
        .sort((left, right) => right.count - left.count || left.sourceKind.localeCompare(right.sourceKind))
    }
  };
}

function buildMediaTimeline(params: {
  sourceId: string;
  segments: Array<{ id: string; sourceId: string; kind: string; anchor: any; text: string }>;
  syncLinks: Array<{
    id: string;
    mediaSourceId: string;
    transcriptSourceId: string;
    segmentId: string | null;
    startMs: number;
    endMs: number;
    transcriptText: string;
    speakerLabel: string;
    confidence: number | null;
    syncScore: number | null;
    tokenTimelineJson: string;
  }>;
  sources: Array<{ id: string; title: string; kind: string }>;
  applications: Array<{ segmentId: string; codeId: string; coderId: string }>;
}) {
  const sourceTitleById = new Map(params.sources.map((source) => [source.id, source.title]));
  const sourceKindById = new Map(params.sources.map((source) => [source.id, source.kind]));
  const normalizeMs = (value: unknown): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.round(value));
  };
  const parseTokenTimeline = (rawValue: unknown): Array<{ token: string; startMs: number; endMs: number; confidence: number | null; speakerLabel: string | null }> => {
    if (typeof rawValue !== 'string' || !rawValue.trim()) return [];
    try {
      const parsed = JSON.parse(rawValue);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => {
          const token = typeof item?.token === 'string' ? item.token.trim() : '';
          if (!token) return null;
          const startMs = normalizeMs(item?.startMs);
          const endMs = Math.max(startMs, normalizeMs(item?.endMs));
          const confidence = typeof item?.confidence === 'number' && Number.isFinite(item.confidence)
            ? Math.max(0, Math.min(1, item.confidence))
            : null;
          const speakerLabel = typeof item?.speakerLabel === 'string' && item.speakerLabel.trim()
            ? item.speakerLabel.trim()
            : null;
          return { token, startMs, endMs, confidence, speakerLabel };
        })
        .filter((item): item is { token: string; startMs: number; endMs: number; confidence: number | null; speakerLabel: string | null } => Boolean(item));
    } catch {
      return [];
    }
  };
  const computeUnionDuration = (intervals: Array<{ startMs: number; endMs: number }>): number => {
    if (intervals.length === 0) return 0;
    const normalized = intervals
      .map((interval) => ({
        startMs: Math.min(interval.startMs, interval.endMs),
        endMs: Math.max(interval.startMs, interval.endMs)
      }))
      .sort((left, right) => left.startMs - right.startMs);
    let total = 0;
    let cursorStart = normalized[0]!.startMs;
    let cursorEnd = normalized[0]!.endMs;
    for (let index = 1; index < normalized.length; index += 1) {
      const interval = normalized[index]!;
      if (interval.startMs <= cursorEnd) {
        cursorEnd = Math.max(cursorEnd, interval.endMs);
        continue;
      }
      total += Math.max(0, cursorEnd - cursorStart);
      cursorStart = interval.startMs;
      cursorEnd = interval.endMs;
    }
    total += Math.max(0, cursorEnd - cursorStart);
    return total;
  };
  const countWords = (text: string): number => {
    return (String(text ?? '').match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? []).length;
  };
  const segmentById = new Map(
    params.segments
      .filter((segment) => segment.sourceId === params.sourceId && segment.kind === 'time_range')
      .map((segment) => [segment.id, segment])
  );
  const applicationsBySegment = new Map<string, Array<{ codeId: string; coderId: string }>>();
  for (const application of params.applications) {
    const bucket = applicationsBySegment.get(application.segmentId) ?? [];
    bucket.push({ codeId: application.codeId, coderId: application.coderId });
    applicationsBySegment.set(application.segmentId, bucket);
  }
  const timeSegments = params.segments
    .filter((segment) => segment.sourceId === params.sourceId && segment.kind === 'time_range')
    .map((segment) => ({
      segmentId: segment.id,
      startMs: normalizeMs(segment.anchor?.startMs),
      endMs: normalizeMs(segment.anchor?.endMs),
      text: segment.text,
      codeCount: applicationsBySegment.get(segment.id)?.length ?? 0,
      coderCount: new Set((applicationsBySegment.get(segment.id) ?? []).map((item) => item.coderId)).size
    }))
    .sort((left, right) => left.startMs - right.startMs);
  const timeSegmentIdSet = new Set(timeSegments.map((segment) => segment.segmentId));
  const rawSyncLinks = params.syncLinks
    .filter((link) => link.mediaSourceId === params.sourceId)
    .map((link) => ({
      ...link,
      startMs: normalizeMs(link.startMs),
      endMs: normalizeMs(link.endMs)
    }))
    .sort((left, right) => left.startMs - right.startMs);
  const syncLinkCountBySegmentId = new Map<string, number>();
  for (const link of rawSyncLinks) {
    if (!link.segmentId) continue;
    syncLinkCountBySegmentId.set(link.segmentId, (syncLinkCountBySegmentId.get(link.segmentId) ?? 0) + 1);
  }
  const enrichedTimeSegments = timeSegments.map((segment) => {
    const syncLinkCount = syncLinkCountBySegmentId.get(segment.segmentId) ?? 0;
    const linkedSyncLinks = rawSyncLinks.filter((link) => link.segmentId === segment.segmentId);
    const averageDriftMs = linkedSyncLinks.length > 0
      ? linkedSyncLinks.reduce((total, link) => {
        const startDelta = Math.abs(link.startMs - segment.startMs);
        const endDelta = Math.abs(link.endMs - segment.endMs);
        return total + ((startDelta + endDelta) / 2);
      }, 0) / linkedSyncLinks.length
      : null;
    return {
      ...segment,
      syncLinkCount,
      isSynced: syncLinkCount > 0,
      isCoded: segment.codeCount > 0,
      syncDriftMs: averageDriftMs
    };
  });
  const syncedSegmentCount = enrichedTimeSegments.filter((segment) => segment.isSynced).length;
  const unsyncedSegmentCount = Math.max(0, enrichedTimeSegments.length - syncedSegmentCount);
  const syncLinks = rawSyncLinks.map((link, index) => {
    const linkedSegment = link.segmentId ? segmentById.get(link.segmentId) : null;
    const linkedSegmentStartMs = linkedSegment ? normalizeMs(linkedSegment.anchor?.startMs) : null;
    const linkedSegmentEndMs = linkedSegment ? normalizeMs(linkedSegment.anchor?.endMs) : null;
    const averageDriftMs = linkedSegmentStartMs === null || linkedSegmentEndMs === null
      ? null
      : (
        (Math.abs(link.startMs - linkedSegmentStartMs) + Math.abs(link.endMs - linkedSegmentEndMs)) / 2
      );
    const tokenTimeline = parseTokenTimeline(link.tokenTimelineJson);
    const previous = index > 0 ? rawSyncLinks[index - 1]! : null;
    const overlapPrevMs = previous ? Math.max(0, previous.endMs - link.startMs) : 0;
    const gapFromPreviousMs = previous ? Math.max(0, link.startMs - previous.endMs) : null;
    return {
      id: link.id,
      segmentId: link.segmentId,
      transcriptSourceId: link.transcriptSourceId,
      transcriptSourceTitle: sourceTitleById.get(link.transcriptSourceId) ?? null,
      transcriptSourceKind: sourceKindById.get(link.transcriptSourceId) ?? null,
      startMs: link.startMs,
      endMs: link.endMs,
      durationMs: Math.max(0, link.endMs - link.startMs),
      transcriptText: link.transcriptText,
      transcriptWordCount: countWords(link.transcriptText),
      speakerLabel: typeof link.speakerLabel === 'string' && link.speakerLabel.trim() ? link.speakerLabel.trim() : null,
      confidence: typeof link.confidence === 'number' && Number.isFinite(link.confidence) ? Math.max(0, Math.min(1, link.confidence)) : null,
      syncScore: typeof link.syncScore === 'number' && Number.isFinite(link.syncScore) ? Math.max(0, Math.min(1, link.syncScore)) : null,
      tokenCount: tokenTimeline.length,
      tokenTimeline,
      hasSegmentAnchor: Boolean(link.segmentId && timeSegmentIdSet.has(link.segmentId)),
      linkedSegmentStartMs,
      linkedSegmentEndMs,
      averageDriftMs,
      overlapPrevMs,
      gapFromPreviousMs,
      qaFlags: [] as string[]
    };
  });
  const qaLowConfidenceThreshold = 0.62;
  const qaRapidSwitchWindowMs = 1500;
  const addQaFlag = (target: { qaFlags: string[] }, flag: string) => {
    if (!target.qaFlags.includes(flag)) target.qaFlags.push(flag);
  };
  for (let index = 0; index < syncLinks.length; index += 1) {
    const link = syncLinks[index]!;
    const previous = index > 0 ? syncLinks[index - 1]! : null;
    if (!link.speakerLabel) addQaFlag(link, 'unlabeled_speaker');
    if (typeof link.confidence === 'number' && Number.isFinite(link.confidence) && link.confidence < qaLowConfidenceThreshold) {
      addQaFlag(link, 'low_confidence');
    }
    if (link.durationMs < 900 && typeof link.confidence === 'number' && link.confidence < 0.72) {
      addQaFlag(link, 'short_low_confidence');
    }
    if (previous && previous.speakerLabel && link.speakerLabel && previous.speakerLabel !== link.speakerLabel) {
      const transitionGapMs = Math.max(0, link.startMs - previous.endMs);
      if (transitionGapMs <= qaRapidSwitchWindowMs) {
        addQaFlag(link, 'rapid_speaker_switch');
        addQaFlag(previous, 'rapid_speaker_switch');
      }
      if ((link.overlapPrevMs ?? 0) > 0) {
        addQaFlag(link, 'overlap_speaker_conflict');
        addQaFlag(previous, 'overlap_speaker_conflict');
      }
    }
  }
  const lowConfidenceCount = syncLinks.filter((link) => link.qaFlags.includes('low_confidence')).length;
  const unlabeledSpeakerCount = syncLinks.filter((link) => link.qaFlags.includes('unlabeled_speaker')).length;
  const rapidSwitchCount = syncLinks.filter((link) => link.qaFlags.includes('rapid_speaker_switch')).length;
  const overlapSpeakerConflictCount = syncLinks.filter((link) => link.qaFlags.includes('overlap_speaker_conflict')).length;
  const shortLowConfidenceCount = syncLinks.filter((link) => link.qaFlags.includes('short_low_confidence')).length;
  const flaggedSyncLinkCount = syncLinks.filter((link) => link.qaFlags.length > 0).length;
  const orphanSyncLinkCount = syncLinks.filter((link) => !link.hasSegmentAnchor).length;
  const linkedDurationMs = computeUnionDuration(syncLinks.map((link) => ({ startMs: link.startMs, endMs: link.endMs })));
  const codedDurationMs = computeUnionDuration(
    enrichedTimeSegments
      .filter((segment) => segment.codeCount > 0)
      .map((segment) => ({ startMs: segment.startMs, endMs: segment.endMs }))
  );
  const durationMs = Math.max(
    0,
    ...timeSegments.map((segment) => segment.endMs),
    ...syncLinks.map((link) => link.endMs)
  );
  const coverageRatio = durationMs > 0 ? Math.min(1, linkedDurationMs / durationMs) : 0;
  const codedCoverageRatio = durationMs > 0 ? Math.min(1, codedDurationMs / durationMs) : 0;
  const overlapSyncLinkCount = syncLinks.filter((link) => (link.overlapPrevMs ?? 0) > 0).length;
  const syncGapValues = syncLinks
    .map((link) => link.gapFromPreviousMs)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const maxSyncGapMs = syncGapValues.length > 0 ? Math.max(...syncGapValues) : 0;
  const largeGapCount = syncGapValues.filter((value) => value >= 10000).length;
  const driftValues = syncLinks
    .map((link) => link.averageDriftMs)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const averageDriftMs = driftValues.length > 0 ? driftValues.reduce((total, value) => total + value, 0) / driftValues.length : null;
  const maxDriftMs = driftValues.length > 0 ? Math.max(...driftValues) : null;
  const driftWarningCount = driftValues.filter((value) => value > 1200).length;
  const tokenCount = syncLinks.reduce((total, link) => total + link.tokenCount, 0);
  const transcriptWordCount = syncLinks.reduce((total, link) => total + link.transcriptWordCount, 0);
  const averageSyncScore = averageNullable(syncLinks.map((link) => link.syncScore));
  const averageConfidence = averageNullable(syncLinks.map((link) => link.confidence));

  const binCount = durationMs <= 0 ? 0 : Math.max(24, Math.min(160, Math.round(durationMs / 3000)));
  const waveformBins = Array.from({ length: binCount }, (_unused, index) => {
    const startMs = Math.round((index * durationMs) / binCount);
    const endMs = Math.round(((index + 1) * durationMs) / binCount);
    const segmentTouches = enrichedTimeSegments.filter((segment) => segment.endMs > startMs && segment.startMs < endMs);
    const syncTouches = syncLinks.filter((link) => link.endMs > startMs && link.startMs < endMs);
    const segmentDensity = Math.min(1, segmentTouches.length / 4);
    const syncDensity = Math.min(1, syncTouches.length / 5);
    const codedDensity = Math.min(1, segmentTouches.filter((segment) => segment.codeCount > 0).length / 4);
    const tokenDensity = Math.min(1, syncTouches.reduce((total, link) => total + link.tokenCount, 0) / 40);
    const amplitude = Math.min(1, (0.12 + (segmentDensity * 0.25) + (syncDensity * 0.28) + (codedDensity * 0.22) + (tokenDensity * 0.13)));
    return {
      index,
      startMs,
      endMs,
      amplitude: Number(amplitude.toFixed(4)),
      segmentCount: segmentTouches.length,
      syncLinkCount: syncTouches.length,
      codedSegmentCount: segmentTouches.filter((segment) => segment.codeCount > 0).length
    };
  });

  const chapterMarkers = enrichedTimeSegments
    .filter((segment) => segment.text.trim())
    .slice(0, 60)
    .map((segment) => ({
      segmentId: segment.segmentId,
      timeMs: segment.startMs,
      label: summarizeText(segment.text, 64),
      isSynced: segment.isSynced,
      isCoded: segment.isCoded
    }));

  const transcriptIndex = syncLinks.map((link) => ({
    linkId: link.id,
    segmentId: link.segmentId,
    transcriptSourceId: link.transcriptSourceId,
    startMs: link.startMs,
    endMs: link.endMs,
    speakerLabel: link.speakerLabel,
    confidence: link.confidence,
    syncScore: link.syncScore,
    tokenCount: link.tokenCount,
    excerpt: summarizeText(link.transcriptText, 220)
  }));

  return {
    durationMs,
    linkedDurationMs,
    codedDurationMs,
    coverageRatio,
    codedCoverageRatio,
    summary: {
      timeSegmentCount: enrichedTimeSegments.length,
      syncLinkCount: syncLinks.length,
      syncedSegmentCount,
      unsyncedSegmentCount,
      orphanSyncLinkCount,
      overlapSyncLinkCount,
      gapCount: syncGapValues.length,
      largeGapCount,
      maxSyncGapMs,
      transcriptWordCount,
      transcriptTokenCount: tokenCount,
      waveformBinCount: waveformBins.length,
      averageSyncScore,
      averageConfidence,
      averageDriftMs,
      maxDriftMs,
      driftWarningCount,
      diarizationLowConfidenceCount: lowConfidenceCount,
      diarizationUnlabeledCount: unlabeledSpeakerCount,
      diarizationRapidSwitchCount: rapidSwitchCount,
      diarizationOverlapConflictCount: overlapSpeakerConflictCount,
      diarizationShortLowConfidenceCount: shortLowConfidenceCount,
      diarizationFlaggedCount: flaggedSyncLinkCount
    },
    alignmentDiagnostics: {
      overlapSyncLinkCount,
      gapCount: syncGapValues.length,
      largeGapCount,
      maxSyncGapMs,
      averageDriftMs,
      maxDriftMs,
      driftWarningCount,
      averageSyncScore,
      averageConfidence,
      diarizationLowConfidenceCount: lowConfidenceCount,
      diarizationUnlabeledCount: unlabeledSpeakerCount,
      diarizationRapidSwitchCount: rapidSwitchCount,
      diarizationOverlapConflictCount: overlapSpeakerConflictCount,
      diarizationShortLowConfidenceCount: shortLowConfidenceCount,
      diarizationFlaggedCount: flaggedSyncLinkCount
    },
    diarizationDiagnostics: {
      lowConfidenceCount,
      unlabeledSpeakerCount,
      rapidSwitchCount,
      overlapSpeakerConflictCount,
      shortLowConfidenceCount,
      flaggedSyncLinkCount,
      lowConfidenceThreshold: qaLowConfidenceThreshold,
      rapidSwitchWindowMs: qaRapidSwitchWindowMs
    },
    timeSegments: enrichedTimeSegments,
    syncLinks,
    waveformBins,
    chapterMarkers,
    transcriptIndex,
    tracks: {
      segments: enrichedTimeSegments.map((segment) => ({
        segmentId: segment.segmentId,
        startMs: segment.startMs,
        endMs: segment.endMs,
        label: summarizeText(segment.text, 120),
        syncLinkCount: segment.syncLinkCount,
        codeCount: segment.codeCount,
        coderCount: segment.coderCount,
        isSynced: segment.isSynced,
        isCoded: segment.isCoded
      })),
      transcript: syncLinks.map((link) => ({
        linkId: link.id,
        segmentId: link.segmentId,
        transcriptSourceId: link.transcriptSourceId,
        startMs: link.startMs,
        endMs: link.endMs,
        speakerLabel: link.speakerLabel,
        transcriptText: summarizeText(link.transcriptText, 140),
        tokenCount: link.tokenCount,
        confidence: link.confidence,
        syncScore: link.syncScore,
        qaFlags: link.qaFlags,
        qaFlagCount: link.qaFlags.length
      })),
      codedCoverage: enrichedTimeSegments
        .filter((segment) => segment.isCoded)
        .map((segment) => ({
          segmentId: segment.segmentId,
          startMs: segment.startMs,
          endMs: segment.endMs,
          codeCount: segment.codeCount
        }))
    }
  };
}

function buildDiarizationQaReview(params: {
  timeline: ReturnType<typeof buildMediaTimeline>;
  maxRows: number;
  maxConfidence: number;
  switchWindowMs: number;
}) {
  const links = [...(params.timeline.syncLinks ?? [])]
    .sort((left, right) => left.startMs - right.startMs || left.endMs - right.endMs);
  const flagsById = new Map<string, Set<string>>();
  const addFlag = (linkId: string, flag: string) => {
    const bucket = flagsById.get(linkId) ?? new Set<string>();
    bucket.add(flag);
    flagsById.set(linkId, bucket);
  };

  for (let index = 0; index < links.length; index += 1) {
    const link = links[index]!;
    const previous = index > 0 ? links[index - 1]! : null;
    if (!link.speakerLabel) addFlag(link.id, 'unlabeled_speaker');
    if (typeof link.confidence === 'number' && Number.isFinite(link.confidence) && link.confidence <= params.maxConfidence) {
      addFlag(link.id, 'low_confidence');
    }
    if (link.durationMs < 900 && typeof link.confidence === 'number' && link.confidence <= Math.max(params.maxConfidence, 0.72)) {
      addFlag(link.id, 'short_low_confidence');
    }
    if (previous && previous.speakerLabel && link.speakerLabel && previous.speakerLabel !== link.speakerLabel) {
      const gapMs = Math.max(0, link.startMs - previous.endMs);
      if (gapMs <= params.switchWindowMs) {
        addFlag(link.id, 'rapid_speaker_switch');
        addFlag(previous.id, 'rapid_speaker_switch');
      }
      if ((link.overlapPrevMs ?? 0) > 0) {
        addFlag(link.id, 'overlap_speaker_conflict');
        addFlag(previous.id, 'overlap_speaker_conflict');
      }
    }
  }

  const flagWeight: Record<string, number> = {
    overlap_speaker_conflict: 6,
    rapid_speaker_switch: 4,
    low_confidence: 3,
    short_low_confidence: 2,
    unlabeled_speaker: 1
  };

  const candidates = links
    .map((link) => {
      const flags = [...(flagsById.get(link.id) ?? new Set<string>())];
      if (flags.length === 0) return null;
      const severityScore = flags.reduce((total, flag) => total + (flagWeight[flag] ?? 1), 0);
      return {
        linkId: link.id,
        segmentId: link.segmentId,
        startMs: link.startMs,
        endMs: link.endMs,
        speakerLabel: link.speakerLabel,
        confidence: link.confidence,
        syncScore: link.syncScore,
        flags,
        severityScore,
        excerpt: summarizeText(link.transcriptText, 180)
      };
    })
    .filter((entry): entry is {
      linkId: string;
      segmentId: string | null;
      startMs: number;
      endMs: number;
      speakerLabel: string | null;
      confidence: number | null;
      syncScore: number | null;
      flags: string[];
      severityScore: number;
      excerpt: string;
    } => Boolean(entry))
    .sort((left, right) => right.severityScore - left.severityScore || left.startMs - right.startMs);

  return {
    summary: {
      maxConfidence: params.maxConfidence,
      switchWindowMs: params.switchWindowMs,
      candidateCount: candidates.length,
      lowConfidenceCount: candidates.filter((entry) => entry.flags.includes('low_confidence')).length,
      unlabeledSpeakerCount: candidates.filter((entry) => entry.flags.includes('unlabeled_speaker')).length,
      rapidSwitchCount: candidates.filter((entry) => entry.flags.includes('rapid_speaker_switch')).length,
      overlapSpeakerConflictCount: candidates.filter((entry) => entry.flags.includes('overlap_speaker_conflict')).length,
      shortLowConfidenceCount: candidates.filter((entry) => entry.flags.includes('short_low_confidence')).length
    },
    candidates: candidates.slice(0, params.maxRows)
  };
}

function chooseSpeakerLabel(
  strategy: 'single' | 'alternating' | 'content_based',
  index: number,
  text: string
): string {
  if (strategy === 'single') return 'Speaker 1';
  if (strategy === 'alternating') return index % 2 === 0 ? 'Speaker 1' : 'Speaker 2';
  const lowered = text.toLowerCase();
  if (/\b(interviewer|question|asked)\b/.test(lowered)) return 'Interviewer';
  if (/\b(student|participant|responded|answer)\b/.test(lowered)) return 'Participant';
  return index % 2 === 0 ? 'Speaker 1' : 'Speaker 2';
}

function buildTokenTimeline(params: {
  text: string;
  startMs: number;
  endMs: number;
  speakerLabel: string;
  confidence: number;
}) {
  const tokenMatches = params.text.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? [];
  if (tokenMatches.length === 0) return [];
  const durationMs = Math.max(1, params.endMs - params.startMs);
  return tokenMatches.map((token, index) => {
    const tokenStartMs = params.startMs + Math.floor((index / tokenMatches.length) * durationMs);
    const tokenEndMs = index === tokenMatches.length - 1
      ? params.endMs
      : params.startMs + Math.floor(((index + 1) / tokenMatches.length) * durationMs);
    return {
      token,
      startMs: tokenStartMs,
      endMs: Math.max(tokenStartMs, tokenEndMs),
      confidence: params.confidence,
      speakerLabel: params.speakerLabel
    };
  });
}

function buildTranscriptionDraft(params: {
  mediaTitle: string;
  mode: 'segment_assembly' | 'timeline_chunked' | 'hybrid';
  pipeline: ReturnType<typeof parseTranscriptionPipelineConfig>;
  timeSegments: Array<{ id: string; anchor: { startMs: number; endMs: number }; text: string }>;
}) {
  const chunkMs = Math.max(3000, params.pipeline.chunkSeconds * 1000);
  const sourceSegments = [...params.timeSegments]
    .map((segment) => ({
      id: segment.id,
      startMs: Math.max(0, Math.round(segment.anchor.startMs)),
      endMs: Math.max(0, Math.round(segment.anchor.endMs)),
      text: String(segment.text ?? '').trim()
    }))
    .filter((segment) => segment.endMs > segment.startMs)
    .sort((left, right) => left.startMs - right.startMs);
  const estimatedDurationMs = Math.max(0, ...sourceSegments.map((segment) => segment.endMs));
  const punctuationize = (text: string): string => {
    const trimmed = text.trim();
    if (!trimmed) return trimmed;
    if (!params.pipeline.punctuation) return trimmed;
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  };

  const makeEntry = (
    startMs: number,
    endMs: number,
    text: string,
    entryIndex: number,
    segmentId: string | null,
    baseConfidence: number,
    syncScore: number
  ) => {
    const speakerLabel = params.pipeline.diarization
      ? chooseSpeakerLabel(params.pipeline.speakerStrategy, entryIndex, text)
      : 'Speaker 1';
    const confidence = Math.max(0, Math.min(1, baseConfidence));
    const transcriptText = punctuationize(text) || `Unclear utterance around ${(startMs / 1000).toFixed(1)}s`;
    const tokenTimeline = buildTokenTimeline({
      text: transcriptText,
      startMs,
      endMs,
      speakerLabel,
      confidence
    });
    return {
      segmentId,
      startMs,
      endMs,
      transcriptText,
      speakerLabel,
      confidence,
      syncScore: Math.max(0, Math.min(1, syncScore)),
      tokenTimeline
    };
  };

  const entries: Array<{
    segmentId: string | null;
    startMs: number;
    endMs: number;
    transcriptText: string;
    speakerLabel: string;
    confidence: number;
    syncScore: number;
    tokenTimeline: Array<{ token: string; startMs: number; endMs: number; confidence: number; speakerLabel: string }>;
  }> = [];

  if (params.mode === 'segment_assembly') {
    if (sourceSegments.length > 0) {
      sourceSegments.forEach((segment, index) => {
        entries.push(makeEntry(
          segment.startMs,
          segment.endMs,
          segment.text || `Segment ${index + 1}`,
          index,
          segment.id,
          0.9,
          0.92
        ));
      });
    } else {
      const endMs = Math.max(chunkMs, 12000);
      entries.push(makeEntry(0, endMs, `Transcript placeholder for ${params.mediaTitle}`, 0, null, 0.5, 0.4));
    }
  } else if (params.mode === 'timeline_chunked') {
    const duration = Math.max(chunkMs, estimatedDurationMs);
    const chunkCount = Math.max(1, Math.ceil(duration / chunkMs));
    for (let index = 0; index < chunkCount; index += 1) {
      const startMs = index * chunkMs;
      const endMs = Math.min(duration, startMs + chunkMs);
      const overlaps = sourceSegments.filter((segment) => segment.endMs > startMs && segment.startMs < endMs);
      const seedText = overlaps.map((segment) => segment.text).filter(Boolean).join(' ').trim();
      const text = seedText || `Auto transcript chunk ${index + 1}`;
      const segmentId = overlaps.length === 1 ? overlaps[0]!.id : null;
      const confidence = overlaps.length > 0 ? 0.82 : 0.58;
      const syncScore = overlaps.length > 0 ? 0.78 : 0.5;
      entries.push(makeEntry(startMs, Math.max(startMs + 500, endMs), text, index, segmentId, confidence, syncScore));
    }
  } else {
    sourceSegments.forEach((segment, index) => {
      entries.push(makeEntry(
        segment.startMs,
        segment.endMs,
        segment.text || `Segment ${index + 1}`,
        entries.length,
        segment.id,
        0.9,
        0.9
      ));
      const next = sourceSegments[index + 1];
      if (!next) return;
      const gapMs = Math.max(0, next.startMs - segment.endMs);
      if (gapMs < Math.round(chunkMs * 1.25)) return;
      const syntheticStart = segment.endMs;
      const syntheticEnd = Math.min(next.startMs, syntheticStart + chunkMs);
      entries.push(makeEntry(
        syntheticStart,
        syntheticEnd,
        `Gap fill between ${(segment.endMs / 1000).toFixed(1)}s and ${(next.startMs / 1000).toFixed(1)}s`,
        entries.length,
        null,
        0.55,
        0.48
      ));
    });
    if (entries.length === 0) {
      const endMs = Math.max(chunkMs, 12000);
      entries.push(makeEntry(0, endMs, `Transcript placeholder for ${params.mediaTitle}`, 0, null, 0.5, 0.4));
    }
  }

  const filteredEntries = entries
    .filter((entry) => entry.confidence >= params.pipeline.confidenceThreshold || entry.segmentId !== null)
    .sort((left, right) => left.startMs - right.startMs);

  const transcriptBody = filteredEntries
    .map((entry) => `[${(entry.startMs / 1000).toFixed(1)}s - ${(entry.endMs / 1000).toFixed(1)}s] ${entry.speakerLabel}: ${entry.transcriptText}`)
    .join('\n');

  const generatedCoverageMs = filteredEntries.reduce((total, entry) => total + Math.max(0, entry.endMs - entry.startMs), 0);
  const modeStats = {
    mode: params.mode,
    chunkMs,
    sourceSegmentCount: sourceSegments.length,
    generatedEntryCount: filteredEntries.length,
    generatedCoverageMs,
    estimatedDurationMs
  };

  return {
    transcriptBody: transcriptBody || `Transcript placeholder for ${params.mediaTitle}.`,
    syncEntries: filteredEntries,
    modeStats
  };
}

function buildMergeReview(params: {
  projectId: string;
  sourceId?: string;
  codeId?: string;
  minCoderCount?: number;
  minConfidenceSpread?: number;
  maxRows?: number;
  segments: Array<{ id: string; sourceId: string; text: string }>;
  sources: Array<{ id: string; title: string }>;
  applications: Array<{ id: string; projectId: string; segmentId: string; codeId: string; coderId: string; caseId: string | null; confidence: number; createdAt?: string }>;
  codes: Array<{ id: string; name: string }>;
}) {
  const minCoderCount = Math.max(1, Math.floor(params.minCoderCount ?? 2));
  const minConfidenceSpread = Math.max(0, Math.min(1, params.minConfidenceSpread ?? 0.2));
  const maxRows = Math.max(1, Math.floor(params.maxRows ?? 100));
  const segmentMap = new Map(params.segments.map((segment) => [segment.id, segment]));
  const sourceMap = new Map(params.sources.map((source) => [source.id, source]));
  const codeMap = new Map(params.codes.map((code) => [code.id, code]));
  const deriveSeverity = (coderCount: number, spread: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (coderCount >= 4 || spread >= 0.5) return 'critical';
    if (coderCount >= 3 || spread >= 0.35) return 'high';
    if (coderCount >= 2 || spread >= 0.2) return 'medium';
    return 'low';
  };
  const scopedApplications = params.applications.filter((application) => {
    if (application.projectId !== params.projectId) return false;
    if (params.codeId && application.codeId !== params.codeId) return false;
    if (params.sourceId) {
      const segment = segmentMap.get(application.segmentId);
      if (!segment || segment.sourceId !== params.sourceId) return false;
    }
    return true;
  });
  const grouped = new Map<string, typeof scopedApplications>();
  for (const application of scopedApplications) {
    const key = `${application.segmentId}::${application.codeId}`;
    const items = grouped.get(key) ?? [];
    items.push(application);
    grouped.set(key, items);
  }
  const rows = [...grouped.entries()]
    .map(([key, apps]) => {
      const [segmentId, codeId] = key.split('::');
      const segment = segmentMap.get(segmentId);
      const coderIds = [...new Set(apps.map((app) => app.coderId))];
      const confidenceSpread = apps.length > 0
        ? Math.max(...apps.map((app) => app.confidence)) - Math.min(...apps.map((app) => app.confidence))
        : 0;
      const sortedApplications = [...apps].sort((left, right) => {
        if (right.confidence !== left.confidence) return right.confidence - left.confidence;
        return String(left.createdAt ?? '').localeCompare(String(right.createdAt ?? ''));
      });
      const needsReview = coderIds.length >= minCoderCount || confidenceSpread >= minConfidenceSpread;
      const triagePriorityScore = Number((coderIds.length * 1.5 + apps.length * 0.5 + confidenceSpread * 4).toFixed(4));
      return {
        segmentId,
        sourceId: segment?.sourceId ?? '',
        sourceTitle: sourceMap.get(segment?.sourceId ?? '')?.title ?? null,
        codeId,
        codeName: codeMap.get(codeId)?.name ?? codeId,
        coderIds,
        applicationCount: apps.length,
        confidenceSpread,
        defaultSeverity: deriveSeverity(coderIds.length, confidenceSpread),
        triagePriorityScore,
        excerpt: segment?.text ?? '',
        needsReview,
        applications: sortedApplications.map((application) => ({
          id: application.id,
          coderId: application.coderId,
          caseId: application.caseId,
          confidence: application.confidence
        }))
      };
    })
    .filter((row) => row.needsReview)
    .sort((left, right) =>
      right.triagePriorityScore - left.triagePriorityScore
      || right.coderIds.length - left.coderIds.length
      || right.confidenceSpread - left.confidenceSpread
      || right.applicationCount - left.applicationCount
    );
  const limitedRows = rows.slice(0, maxRows);
  return {
    candidateCount: rows.length,
    returnedCount: limitedRows.length,
    hasMore: rows.length > limitedRows.length,
    filters: {
      minCoderCount,
      minConfidenceSpread,
      maxRows
    },
    rows: limitedRows
  };
}

async function buildCommitteeReviewPack(params: {
  projectId: string;
  payload: QualitativeProjectPayload;
  bundleLabel?: string;
  bundleQueryIds: string[];
  styleTemplate: StructuredReportStyleTemplate;
  appendixMode: 'standard' | 'expanded';
  appendixRowLimit: number;
}) {
  const savedQueries = await listSavedQualitativeQueries(params.projectId);
  const savedQueryById = new Map(savedQueries.map((query) => [query.id, query]));
  const pinnedQueries = savedQueries.filter((query) => {
    const payload = parseSavedQueryJsonObject(query.queryJson);
    return payload.qualQueryPinned === true;
  });
  const requestedQueryIds = params.bundleQueryIds.filter((item, index, items) => item && items.indexOf(item) === index);
  const selectedQueries = requestedQueryIds.length > 0
    ? requestedQueryIds
      .map((queryId) => savedQueryById.get(queryId))
      .filter((query): query is NonNullable<typeof query> => Boolean(query))
    : (pinnedQueries.length > 0 ? pinnedQueries : savedQueries).slice(0, 10);

  if (selectedQueries.length === 0) {
    throw new Error('No saved qualitative queries are available for committee pack export.');
  }

  const queryBundles = selectedQueries.map((savedQuery) => {
    const queryPayload = parseSavedQueryJsonObject(savedQuery.queryJson);
    const evidenceQuery = parseEvidenceQuery(queryPayload);
    const queryLabels = formatEvidenceFilterLabels(evidenceQuery);
    queryLabels.push(`Saved mode: ${savedQuery.mode}`);

    const retrieval = retrieveEvidence({
      query: evidenceQuery,
      sources: params.payload.sources,
      segments: params.payload.segments,
      applications: params.payload.codeApplications,
      cases: params.payload.cases,
      memos: params.payload.memos
    });
    const evidenceBundleBase = buildEvidenceExport({
      project: {
        id: params.payload.project.id,
        name: params.payload.project.name
      },
      retrieval,
      codes: params.payload.codes
    });
    const evidenceBundle = enrichEvidenceBundleWithContext({
      bundle: evidenceBundleBase,
      segments: params.payload.segments,
      sources: params.payload.sources,
      transcriptSyncLinks: params.payload.transcriptSyncLinks
    });
    const evidenceReport = buildEvidenceReport(evidenceBundle, queryLabels);
    const queryReport = buildQualitativeQueryReport({
      query: evidenceQuery,
      options: parseQualitativeReportOptions({
        reportTopSources: queryPayload.queryReportTopSources as string | number | undefined,
        reportTopCases: queryPayload.queryReportTopCases as string | number | undefined,
        reportTopCodes: queryPayload.queryReportTopCodes as string | number | undefined,
        reportExcerptLimit: queryPayload.queryReportExcerptLimit as string | number | undefined,
        reportIncludeSources: queryPayload.queryReportIncludeSources as string | boolean | undefined,
        reportIncludeCases: queryPayload.queryReportIncludeCases as string | boolean | undefined,
        reportIncludeExcerpts: queryPayload.queryReportIncludeExcerpts as string | boolean | undefined,
        reportSortBy: queryPayload.queryReportSortBy as string | undefined
      }),
      sources: params.payload.sources,
      segments: params.payload.segments,
      applications: params.payload.codeApplications,
      cases: params.payload.cases,
      memos: params.payload.memos,
      codes: params.payload.codes
    });

    return {
      queryId: savedQuery.id,
      label: savedQuery.label,
      mode: savedQuery.mode,
      queryLabels,
      queryReport,
      evidenceReport
    };
  });

  return buildCommitteeReviewPackReport({
    project: params.payload.project,
    bundleLabel: params.bundleLabel,
    styleTemplate: params.styleTemplate,
    appendixMode: params.appendixMode,
    appendixRowLimit: params.appendixRowLimit,
    queryBundles
  });
}

function deriveMergeConflictSeverity(params: { coderCount: number; confidenceSpread: number }): 'low' | 'medium' | 'high' | 'critical' {
  if (params.coderCount >= 4 || params.confidenceSpread >= 0.5) return 'critical';
  if (params.coderCount >= 3 || params.confidenceSpread >= 0.35) return 'high';
  if (params.coderCount >= 2 || params.confidenceSpread >= 0.2) return 'medium';
  return 'low';
}

function isHighRiskMergeConflict(params: {
  coderCount: number;
  confidenceSpread: number;
  highRiskMinCoderCount: number;
  highRiskMinConfidenceSpread: number;
}): boolean {
  return params.coderCount >= params.highRiskMinCoderCount
    || params.confidenceSpread >= params.highRiskMinConfidenceSpread;
}

type ProjectDatasetSpssFieldMetadata = {
  fieldKey: string;
  fieldLabel: string;
  measure: 'nominal' | 'ordinal' | 'scale' | 'unknown' | null;
  valueLabels: Array<{ value: string | number | boolean | null; label: string }>;
  missingValues: Array<string | number | boolean | null>;
  missingRanges: Array<{ lo: string | number | boolean | null; hi: string | number | boolean | null }>;
};

function parseJsonArrayFallback<T>(value: string, fallback: T[]): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

async function buildProjectDatasetPayload(projectId: string, analysis?: ReturnType<typeof parseDatasetAnalysisOptions>) {
  const [cases, attributes, variables, traceLinks, fieldMetadataRows, datasetSettings] = await Promise.all([
    listCases(projectId),
    listAttributes(projectId),
    listVariables(projectId),
    listTraceLinks(projectId),
    listDatasetFieldMetadata(projectId),
    getProjectDatasetSettings(projectId)
  ]);

  const dataset = buildCaseDataset({
    cases,
    attributes,
    variables,
    traceLinks: traceLinks.map((traceLink) => ({
      variableId: traceLink.variableId,
      caseId: traceLink.caseId,
      supportingCodeApplicationIds: traceLink.supportingCodeApplicationIds
    }))
  });

  const fieldMetadata: ProjectDatasetSpssFieldMetadata[] = fieldMetadataRows.map((entry) => ({
    fieldKey: entry.fieldKey,
    fieldLabel: entry.fieldLabel,
    measure: entry.measure,
    valueLabels: parseJsonArrayFallback<{ value: string | number | boolean | null; label: string }>(entry.valueLabelsJson, [])
      .filter((item) => typeof item?.label === 'string' && item.label.trim().length > 0)
      .map((item) => ({
        value: item.value === undefined ? null : item.value,
        label: item.label.trim()
      })),
    missingValues: parseJsonArrayFallback<string | number | boolean | null>(entry.missingValuesJson, [])
      .map((item) => item === undefined ? null : item),
    missingRanges: parseJsonArrayFallback<{ lo: string | number | boolean | null; hi: string | number | boolean | null }>(entry.missingRangesJson, [])
      .map((item) => ({
        lo: item?.lo === undefined ? null : item.lo,
        hi: item?.hi === undefined ? null : item.hi
      }))
  }));

  return {
    dataset,
    report: describeDataset(dataset, analysis),
    spssMetadata: {
      settings: {
        weightField: datasetSettings?.weightField ?? null,
        splitFields: parseJsonArrayFallback<string>(datasetSettings?.splitFieldsJson ?? '[]', [])
          .map((item) => String(item ?? '').trim())
          .filter(Boolean),
        updatedAt: datasetSettings?.updatedAt ?? null
      },
      fields: fieldMetadata
    }
  };
}

function parseDatasetFilters(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const entry = item as Partial<{ fieldKey: string; operator: string; value: string | number | boolean | null }>;
      const fieldKey = typeof entry.fieldKey === 'string' ? entry.fieldKey.trim() : '';
      const operator = typeof entry.operator === 'string' ? entry.operator.trim() : '';
      if (!fieldKey || !operator) return null;
      return {
        fieldKey,
        operator: operator as 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_missing' | 'not_missing',
        value: entry.value === undefined ? null : entry.value
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function parseDatasetRecodes(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const entry = item as Partial<{
        sourceFieldKey: string;
        outputFieldKey: string;
        outputLabel: string;
        rules: Array<{ from: string; to: string | number | boolean | null }>;
        defaultValue: string | number | boolean | null;
      }>;
      const sourceFieldKey = typeof entry.sourceFieldKey === 'string' ? entry.sourceFieldKey.trim() : '';
      const outputLabel = typeof entry.outputLabel === 'string' ? entry.outputLabel.trim() : '';
      if (!sourceFieldKey || !outputLabel) return null;
      const rules = Array.isArray(entry.rules)
        ? entry.rules
          .map((rule) => ({
            from: typeof rule?.from === 'string' ? rule.from : '',
            to: rule?.to === undefined ? null : rule.to
          }))
          .filter((rule) => rule.from.length > 0)
        : [];

      return {
        sourceFieldKey,
        outputFieldKey: typeof entry.outputFieldKey === 'string' && entry.outputFieldKey.trim() ? entry.outputFieldKey.trim() : undefined,
        outputLabel,
        rules,
        defaultValue: entry.defaultValue === undefined ? null : entry.defaultValue
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function parseDatasetAnalysisOptions(value: unknown) {
  const entry = (value ?? {}) as Partial<{
    weightField: string;
    missingValues: string[] | string;
    missingStrategy: string;
    splitFields: string[] | string;
  }>;
  const missingValues = Array.isArray(entry.missingValues)
    ? entry.missingValues.map((item) => String(item ?? '').trim()).filter(Boolean)
    : typeof entry.missingValues === 'string'
      ? entry.missingValues.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

  return {
    weightField: typeof entry.weightField === 'string' && entry.weightField.trim()
      ? entry.weightField.trim()
      : undefined,
    splitFields: parseStringArray(entry.splitFields),
    missingValues,
    missingStrategy: entry.missingStrategy === 'listwise' ? 'listwise' as const : 'available' as const
  };
}

async function persistImportedSpssMetadata(projectId: string, metadata: ImportedSpssMetadataDraft): Promise<void> {
  const timestamp = new Date().toISOString();
  const entries = metadata.fields.map((field) => ({
    projectId,
    fieldKey: field.mappedFieldKey,
    fieldLabel: field.fieldLabel || field.sourceFieldKey,
    measure: field.measure,
    valueLabelsJson: JSON.stringify(field.valueLabels ?? []),
    missingValuesJson: JSON.stringify(field.missingValues ?? []),
    missingRangesJson: JSON.stringify(field.missingRanges ?? []),
    createdAt: timestamp,
    updatedAt: timestamp
  }));
  await replaceDatasetFieldMetadata(projectId, entries);
  await upsertProjectDatasetSettings({
    projectId,
    weightField: typeof metadata.weightField === 'string' && metadata.weightField.trim()
      ? metadata.weightField.trim()
      : null,
    splitFieldsJson: JSON.stringify((metadata.splitFields ?? []).map((item) => String(item ?? '').trim()).filter(Boolean)),
    updatedAt: timestamp
  });
}

function normalizeSpssExportScalar(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  return String(value);
}

function buildSpssExportInput(
  payload: Awaited<ReturnType<typeof buildProjectDatasetPayload>>,
  format: 'sav' | 'zsav',
  override: { weightField: string | null; splitFields: string[] }
) {
  const fieldOrder = payload.dataset.fields.map((field) => field.key);
  const fieldMetadataMap = new Map(payload.spssMetadata.fields.map((field) => [field.fieldKey, field]));
  const columnLabels = Object.fromEntries(
    payload.dataset.fields.map((field) => [field.key, fieldMetadataMap.get(field.key)?.fieldLabel || field.label || field.key])
  );
  const valueLabels = Object.fromEntries(
    payload.dataset.fields.map((field) => [field.key, fieldMetadataMap.get(field.key)?.valueLabels ?? []])
  );
  const missingValues = Object.fromEntries(
    payload.dataset.fields.map((field) => [field.key, fieldMetadataMap.get(field.key)?.missingValues ?? []])
  );
  const missingRanges = Object.fromEntries(
    payload.dataset.fields.map((field) => [field.key, fieldMetadataMap.get(field.key)?.missingRanges ?? []])
  );
  const variableMeasure = Object.fromEntries(
    payload.dataset.fields
      .map((field) => [field.key, fieldMetadataMap.get(field.key)?.measure ?? 'unknown'])
      .filter((entry): entry is [string, 'nominal' | 'ordinal' | 'scale' | 'unknown'] =>
        entry[1] === 'nominal' || entry[1] === 'ordinal' || entry[1] === 'scale' || entry[1] === 'unknown'
      )
  );
  const rows = payload.dataset.rows.map((row) => Object.fromEntries(
    fieldOrder.map((field) => [field, normalizeSpssExportScalar(row[field])])
  ));
  return {
    format,
    rows,
    fieldOrder,
    columnLabels,
    valueLabels,
    missingValues,
    missingRanges,
    variableMeasure,
    weightField: override.weightField,
    splitFields: override.splitFields,
    fileLabel: `muStatistics ${payload.dataset.caseCount} cases`,
    notes: []
  };
}

function serializeDatasetToCsv(rows: Array<Record<string, string | number | boolean | null>>): string {
  if (rows.length === 0) return 'case_id,case_label\r\n';
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escapeCsv = (value: string | number | boolean | null | undefined): string => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(','))
  ];
  return `${lines.join('\r\n')}\r\n`;
}

// ── Health ────────────────────────────────────────────────────────────────────

server.get('/health', async () => {
  const axion = await getAxionIntegrationStatus();
  return ok({ status: 'ok' as const, db: { host: getDbHost() }, axion });
});

server.get('/integrations/status', async () => {
  const axion = await getAxionIntegrationStatus();
  return ok({
    sql: resolveSqlIntegrationStatus(),
    office: resolveOfficeIntegrationStatus(),
    transcription: resolveTranscriptionIntegrationStatus(),
    sem: resolveSemIntegrationStatus(),
    axion
  });
});

server.get('/integrations/sem/status', async () => {
  return ok({ sem: resolveSemIntegrationStatus() });
});

server.get('/integrations/axion/status', async () => {
  return ok({ axion: await getAxionIntegrationStatus() });
});

server.get('/integrations/office/recent', async (request, reply) => {
  const userId = request.session.userId;
  if (!userId) return reply.status(401).send(fail('UNAUTHENTICATED', 'Sign in required.'));

  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;

  const items = await listProjectArtifacts({ projectId, area: 'exports' });
  const officeItems = items
    .filter((item) => /\.(docx|xlsx)$/i.test(item.filename))
    .map((item) => {
      const extension = item.filename.toLowerCase().endsWith('.docx') ? 'docx' : 'xlsx';
      return {
        relativePath: item.relativePath,
        filename: item.filename,
        modifiedAt: item.modifiedAt,
        size: item.size,
        extension,
        app: extension === 'docx' ? 'word' : 'excel'
      };
    });

  return ok({
    items: officeItems,
    latest: {
      word: officeItems.find((item) => item.extension === 'docx') ?? null,
      excel: officeItems.find((item) => item.extension === 'xlsx') ?? null
    },
    office: resolveOfficeIntegrationStatus()
  });
});

server.post('/integrations/office/open', async (request, reply) => {
  const userId = request.session.userId;
  if (!userId) return reply.status(401).send(fail('UNAUTHENTICATED', 'Sign in required.'));

  const body = request.body as {
    projectId?: string;
    relativePath?: string;
    app?: 'word' | 'excel' | 'default';
  };
  const projectId = requireProjectId(reply, body?.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;

  const relativePath = typeof body?.relativePath === 'string' ? body.relativePath.trim() : '';
  if (!relativePath) {
    return reply.status(400).send(fail('INVALID', 'relativePath is required.'));
  }

  const normalizedRelativePath = path.normalize(relativePath).replaceAll('\\', '/');
  const projectPrefix = `exports/${projectId}/`;
  if (!normalizedRelativePath.startsWith(projectPrefix)) {
    return reply.status(400).send(fail('INVALID', 'Artifact path must be under the selected project export folder.'));
  }

  const lowerPath = normalizedRelativePath.toLowerCase();
  const targetApp = body?.app === 'word' || body?.app === 'excel' || body?.app === 'default'
    ? body.app
    : 'default';
  if (targetApp === 'word' && !lowerPath.endsWith('.docx')) {
    return reply.status(400).send(fail('INVALID', 'Word launch expects a .docx export.'));
  }
  if (targetApp === 'excel' && !lowerPath.endsWith('.xlsx')) {
    return reply.status(400).send(fail('INVALID', 'Excel launch expects a .xlsx export.'));
  }

  let absolutePath: string;
  try {
    absolutePath = resolveManagedArtifactPath(normalizedRelativePath);
  } catch {
    return reply.status(400).send(fail('INVALID', 'Artifact path is outside the storage root.'));
  }
  if (!existsSync(absolutePath)) {
    return reply.status(404).send(fail('NOT_FOUND', 'Export artifact not found.'));
  }

  const officeStatus = resolveOfficeIntegrationStatus();
  if (targetApp === 'word' && !officeStatus.wordLaunchAvailable) {
    return reply.status(400).send(fail('INTEGRATION_UNAVAILABLE', 'Microsoft Word was not found on this device.'));
  }
  if (targetApp === 'excel' && !officeStatus.excelLaunchAvailable) {
    return reply.status(400).send(fail('INTEGRATION_UNAVAILABLE', 'Microsoft Excel was not found on this device.'));
  }

  try {
    launchOfficeFile({ targetApp, absolutePath });
  } catch (error) {
    return reply.status(500).send(fail('INTEGRATION_FAILED', error instanceof Error ? error.message : 'Failed to open Office export.'));
  }

  await recordAuditEvent({
    request,
    projectId,
    action: 'integration.office.open',
    entityType: 'artifact',
    entityId: normalizedRelativePath,
    details: { app: targetApp, relativePath: normalizedRelativePath }
  });

  return ok({ launched: true, app: targetApp, relativePath: normalizedRelativePath });
});

server.get('/sql-profiles', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const items = await listExternalSqlProfiles(projectId);
  return ok({
    items: items.map(sanitizeExternalSqlProfile),
    total: items.length
  });
});

server.post('/sql-profiles', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    label: string;
    clientType: string;
    connection: unknown;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label) return reply.status(400).send(fail('INVALID', 'Profile label is required.'));
  const clientType: ExternalSqlClientType = body.clientType === 'sqlserver' ? 'sqlserver' : 'postgres';

  let connection: ExternalSqlConnectionInput;
  try {
    connection = parseExternalSqlConnectionInput(body.connection, clientType);
    await testExternalSqlConnection(clientType, connection);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to connect to the external SQL database.';
    return reply.status(400).send(fail('INVALID', message));
  }

  const timestamp = new Date().toISOString();
  const saved = await insertExternalSqlProfile({
    id: `sql-profile-${randomUUID()}`,
    projectId,
    label,
    clientType,
    connectionJson: JSON.stringify(connection),
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'sql_profile.save',
    entityType: 'external_sql_profile',
    entityId: saved.id,
    details: { label: saved.label, clientType: saved.clientType, host: connection.host, database: connection.database }
  });
  reply.code(201);
  return ok({ profile: sanitizeExternalSqlProfile(saved) });
});

server.delete('/sql-profiles/:profileId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { profileId } = request.params as { profileId: string };
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const removed = await deleteExternalSqlProfile(profileId, projectId);
  if (!removed) return reply.status(404).send(fail('NOT_FOUND', 'SQL profile not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'sql_profile.delete',
    entityType: 'external_sql_profile',
    entityId: profileId,
    details: {}
  });
  return ok({ removed: true });
});

server.get('/sql-profiles/:profileId/tables', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { profileId } = request.params as { profileId: string };
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;

  const profile = (await listExternalSqlProfiles(projectId)).find((item) => item.id === profileId);
  if (!profile) return reply.status(404).send(fail('NOT_FOUND', 'SQL profile not found.'));

  try {
    const connection = JSON.parse(profile.connectionJson) as ExternalSqlConnectionInput;
    const tables = profile.clientType === 'sqlserver'
      ? await withSqlServerPool(connection, async (pool) => {
        const env = await pool.request().query(`
          SELECT
            c.TABLE_SCHEMA AS table_schema,
            c.TABLE_NAME AS table_name,
            c.COLUMN_NAME AS column_name,
            c.DATA_TYPE AS data_type,
            c.ORDINAL_POSITION AS ordinal_position
          FROM INFORMATION_SCHEMA.COLUMNS c
          JOIN INFORMATION_SCHEMA.TABLES t
            ON t.TABLE_SCHEMA = c.TABLE_SCHEMA
           AND t.TABLE_NAME = c.TABLE_NAME
          WHERE t.TABLE_TYPE = 'BASE TABLE'
            AND c.TABLE_SCHEMA NOT IN ('INFORMATION_SCHEMA')
          ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION
        `);
        const byTable = new Map<string, { schema: string; table: string; columns: Array<{ name: string; dataType: string }> }>();
        for (const row of env.recordset ?? []) {
          const key = `${row.table_schema}.${row.table_name}`;
          if (!byTable.has(key)) {
            byTable.set(key, { schema: row.table_schema, table: row.table_name, columns: [] });
          }
          byTable.get(key)?.columns.push({ name: row.column_name, dataType: row.data_type });
        }
        return [...byTable.values()];
      })
      : await withPostgresClient(connection, async (client) => {
        const { rows } = await client.query(`
          SELECT
            c.table_schema,
            c.table_name,
            c.column_name,
            c.data_type,
            c.ordinal_position
          FROM information_schema.columns c
          JOIN information_schema.tables t
            ON t.table_schema = c.table_schema
           AND t.table_name = c.table_name
          WHERE t.table_type = 'BASE TABLE'
            AND c.table_schema NOT IN ('pg_catalog', 'information_schema')
          ORDER BY c.table_schema, c.table_name, c.ordinal_position
        `);
        const byTable = new Map<string, { schema: string; table: string; columns: Array<{ name: string; dataType: string }> }>();
        for (const row of rows) {
          const key = `${row.table_schema}.${row.table_name}`;
          if (!byTable.has(key)) {
            byTable.set(key, { schema: row.table_schema, table: row.table_name, columns: [] });
          }
          byTable.get(key)?.columns.push({ name: row.column_name, dataType: row.data_type });
        }
        return [...byTable.values()];
      });
    return ok({ items: tables, total: tables.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to read SQL tables.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.get('/sql-profiles/:profileId/preview', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { profileId } = request.params as { profileId: string };
  const query = request.query as {
    projectId?: string;
    schemaName?: string;
    tableName?: string;
    limit?: string;
  };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const schemaName = typeof query.schemaName === 'string' ? query.schemaName.trim() : '';
  const tableName = typeof query.tableName === 'string' ? query.tableName.trim() : '';
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit ?? '10', 10) || 10));
  if (!schemaName || !tableName) {
    return reply.status(400).send(fail('INVALID', 'schemaName and tableName are required.'));
  }
  const profile = (await listExternalSqlProfiles(projectId)).find((item) => item.id === profileId);
  if (!profile) return reply.status(404).send(fail('NOT_FOUND', 'SQL profile not found.'));

  try {
    const connection = JSON.parse(profile.connectionJson) as ExternalSqlConnectionInput;
    const preview = profile.clientType === 'sqlserver'
      ? await withSqlServerPool(connection, async (pool) => {
        const columnsEnv = await pool.request()
          .input('schemaName', mssql.NVarChar, schemaName)
          .input('tableName', mssql.NVarChar, tableName)
          .query(`
            SELECT COLUMN_NAME AS column_name, DATA_TYPE AS data_type, ORDINAL_POSITION AS ordinal_position
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @tableName
            ORDER BY ORDINAL_POSITION
          `);
        const rowsEnv = await pool.request().query(buildExternalSqlPreviewSelect('sqlserver', schemaName, tableName, limit));
        const columns = (columnsEnv.recordset ?? []).map((row: { column_name?: string; data_type?: string }) => ({
          name: row.column_name,
          dataType: row.data_type,
          inferredVariableKind: inferVariableKindFromSqlColumn(row.data_type ?? '')
        }));
        const rows = (rowsEnv.recordset ?? []).map((row: Record<string, unknown>) => Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key, coerceSqlImportValue(value)])
        ));
        return { columns, rows };
      })
      : await withPostgresClient(connection, async (client) => {
        const columnsEnv = await client.query(`
          SELECT column_name, data_type, ordinal_position
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [schemaName, tableName]);
        const rowsEnv = await client.query(buildExternalSqlPreviewSelect('postgres', schemaName, tableName, limit));
        const columns = columnsEnv.rows.map((row) => ({
          name: row.column_name,
          dataType: row.data_type,
          inferredVariableKind: inferVariableKindFromSqlColumn(row.data_type)
        }));
        const rows = rowsEnv.rows.map((row) => Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key, coerceSqlImportValue(value)])
        ));
        return { columns, rows };
      });
    return ok(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to preview the SQL table.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/sql-profiles/:profileId/query-preview', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { profileId } = request.params as { profileId: string };
  const body = (request.body ?? {}) as Partial<{ projectId: string; sql: string; limit: number }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const profile = (await listExternalSqlProfiles(projectId)).find((item) => item.id === profileId);
  if (!profile) return reply.status(404).send(fail('NOT_FOUND', 'SQL profile not found.'));

  let sql: string;
  try {
    sql = validateReadOnlySqlQuery(typeof body.sql === 'string' ? body.sql : '');
  } catch (error) {
    return reply.status(400).send(fail('INVALID', error instanceof Error ? error.message : 'Invalid SQL query.'));
  }
  const limit = Math.min(100, Math.max(1, Number(body.limit ?? 25)));

  try {
    const connection = JSON.parse(profile.connectionJson) as ExternalSqlConnectionInput;
    const preview = profile.clientType === 'sqlserver'
      ? await withSqlServerPool(connection, async (pool) => {
        const env = await pool.request().query(buildExternalSqlWrappedPreviewQuery('sqlserver', sql, limit));
        const rows = (env.recordset ?? []).map((row: Record<string, unknown>) => Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key, coerceSqlImportValue(value)])
        ));
        return {
          columns: Object.keys((env.recordset ?? [])[0] ?? {}).map((name) => ({ name, dataType: 'unknown' })),
          rows,
          rowCount: rows.length,
          limitedTo: limit
        };
      })
      : await withPostgresClient(connection, async (client) => {
        const env = await client.query(buildExternalSqlWrappedPreviewQuery('postgres', sql, limit));
        const columns = env.fields?.map((field) => ({
          name: field.name,
          dataType: String(field.dataTypeID ?? '')
        })) ?? Object.keys(env.rows[0] ?? {}).map((name) => ({ name, dataType: 'unknown' }));
        const rows = env.rows.map((row) => Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key, coerceSqlImportValue(value)])
        ));
        return {
          columns,
          rows,
          rowCount: rows.length,
          limitedTo: limit
        };
      });
    await recordAuditEvent({
      request,
      projectId,
      action: 'sql_query.preview',
      entityType: 'external_sql_profile',
      entityId: profileId,
      details: { label: profile.label, limit }
    });
    return ok(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run the SQL preview query.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/sql-profiles/:profileId/export-table', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { profileId } = request.params as { profileId: string };
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    schemaName: string;
    tableName: string;
    mode: string;
    keyField: string;
    targetKeyColumn: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const schemaName = typeof body.schemaName === 'string' ? body.schemaName.trim() : '';
  const tableName = typeof body.tableName === 'string' ? body.tableName.trim() : '';
  if (!schemaName || !tableName) {
    return reply.status(400).send(fail('INVALID', 'schemaName and tableName are required.'));
  }
  const profile = (await listExternalSqlProfiles(projectId)).find((item) => item.id === profileId);
  if (!profile) return reply.status(404).send(fail('NOT_FOUND', 'SQL profile not found.'));

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    const connection = JSON.parse(profile.connectionJson) as ExternalSqlConnectionInput;
    const exported = await exportDatasetToExternalSqlTable({
      projectId,
      profileId,
      profileLabel: profile.label,
      connection,
      schemaName,
      tableName,
      clientType: profile.clientType,
      mode: normalizeSqlWriteMode(body.mode),
      keyField: typeof body.keyField === 'string' && body.keyField.trim() ? body.keyField.trim() : null,
      targetKeyColumn: typeof body.targetKeyColumn === 'string' && body.targetKeyColumn.trim() ? body.targetKeyColumn.trim() : null,
      rows: dataset.rows
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'sql_export.table',
      entityType: 'external_sql_profile',
      entityId: profileId,
      details: {
        label: profile.label,
        schemaName,
        tableName,
        mode: normalizeSqlWriteMode(body.mode),
        rowsExported: exported.rowsExported,
        columnsExported: exported.columnsExported,
        tableCreated: exported.tableCreated,
        tableReplaced: exported.tableReplaced
      }
    });
    return ok({ exported });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to export the dataset to PostgreSQL.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/sql-import/table', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    profileId: string;
    schemaName: string;
    tableName: string;
    caseLabelColumn: string;
    maxRows: number;
    selectedColumns: unknown[];
    variableColumns: unknown[];
    refreshJobId: string;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const profileId = typeof body.profileId === 'string' ? body.profileId.trim() : '';
  const schemaName = typeof body.schemaName === 'string' ? body.schemaName.trim() : '';
  const tableName = typeof body.tableName === 'string' ? body.tableName.trim() : '';
  const caseLabelColumn = typeof body.caseLabelColumn === 'string' ? body.caseLabelColumn.trim() : '';
  const maxRows = Math.min(5000, Math.max(1, Number(body.maxRows ?? 500)));
  const selectedColumns = normalizeSqlImportColumns(body.selectedColumns, [caseLabelColumn]);
  const variableColumns = normalizeSqlVariableColumns(body.variableColumns);
  const refreshJobId = typeof body.refreshJobId === 'string' && body.refreshJobId.trim() ? body.refreshJobId.trim() : null;
  if (!profileId || !schemaName || !tableName || !caseLabelColumn) {
    return reply.status(400).send(fail('INVALID', 'Profile, schema, table, and case label column are required.'));
  }

  const profile = (await listExternalSqlProfiles(projectId)).find((item) => item.id === profileId);
  if (!profile) return reply.status(404).send(fail('NOT_FOUND', 'SQL profile not found.'));

  try {
    const connection = JSON.parse(profile.connectionJson) as ExternalSqlConnectionInput;
    const imported = await importExternalSqlTable({
      projectId,
      profileId,
      profileLabel: profile.label,
      clientType: profile.clientType,
      connection,
      schemaName,
      tableName,
      caseLabelColumn,
      maxRows,
      selectedColumns,
      variableColumns,
      refreshJobId
    });

    await recordAuditEvent({
      request,
      projectId,
      action: 'sql_import.table',
      entityType: 'external_sql_profile',
      entityId: profileId,
      details: {
        label: profile.label,
        schemaName,
        tableName,
        caseLabelColumn,
        maxRows,
        selectedColumns,
        variableColumns,
        refreshJobId,
        ...imported
      }
    });
    reply.code(201);
    return ok({ imported });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to import from the external SQL table.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.get('/sql-import/jobs', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const items = await listExternalSqlImportJobs(projectId);
  return ok({
    items: items.map(serializeExternalSqlImportJob),
    total: items.length
  });
});

server.post('/sql-import/jobs', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    profileId: string;
    label: string;
    schemaName: string;
    tableName: string;
    caseLabelColumn: string;
    selectedColumns: unknown[];
    variableColumns: unknown[];
    maxRows: number;
    scheduleEnabled: boolean;
    scheduleIntervalMinutes: number;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const profileId = typeof body.profileId === 'string' ? body.profileId.trim() : '';
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const schemaName = typeof body.schemaName === 'string' ? body.schemaName.trim() : '';
  const tableName = typeof body.tableName === 'string' ? body.tableName.trim() : '';
  const caseLabelColumn = typeof body.caseLabelColumn === 'string' ? body.caseLabelColumn.trim() : '';
  const maxRows = clampSqlImportMaxRows(body.maxRows, 500);
  const scheduleEnabled = body.scheduleEnabled === true;
  const scheduleIntervalMinutes = scheduleEnabled ? clampSqlScheduleIntervalMinutes(body.scheduleIntervalMinutes) : null;
  if (!profileId || !label || !schemaName || !tableName || !caseLabelColumn) {
    return reply.status(400).send(fail('INVALID', 'Profile, label, schema, table, and case label column are required.'));
  }
  const selectedColumns = normalizeSqlImportColumns(body.selectedColumns, [caseLabelColumn]);
  const variableColumns = normalizeSqlVariableColumns(body.variableColumns);
  const timestamp = new Date().toISOString();
  const saved = await insertExternalSqlImportJob({
    id: `sql-import-job-${randomUUID()}`,
    projectId,
    profileId,
    label,
    schemaName,
    tableName,
    caseLabelColumn,
    selectedColumnsJson: JSON.stringify(selectedColumns),
    variableColumnsJson: JSON.stringify(variableColumns),
    maxRows,
    scheduleEnabled,
    scheduleIntervalMinutes,
    scheduleNextRunAt: computeSqlImportScheduleNextRunAt(scheduleEnabled, scheduleIntervalMinutes, timestamp),
    lastRunAt: null,
    lastRunStatus: null,
    lastRunMessage: null,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'sql_import_job.save',
    entityType: 'external_sql_import_job',
    entityId: saved.id,
    details: { label, schemaName, tableName, caseLabelColumn, selectedColumns, variableColumns, maxRows, scheduleEnabled, scheduleIntervalMinutes }
  });
  reply.code(201);
  return ok({
    job: serializeExternalSqlImportJob(saved)
  });
});

server.post('/sql-import/jobs/:jobId/run', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { jobId } = request.params as { jobId: string };
  const body = (request.body ?? {}) as Partial<{ projectId: string; maxRows: number }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const job = (await listExternalSqlImportJobs(projectId)).find((item) => item.id === jobId);
  if (!job) return reply.status(404).send(fail('NOT_FOUND', 'SQL import job not found.'));
  const maxRows = clampSqlImportMaxRows(body.maxRows, job.maxRows);
  const startedAtMs = Date.now();
  const preGuard = await evaluateAxionQeccGuard({
    jobType: 'sql-import',
    stage: 'manual_pre_run',
    projectId,
    retryCount: job.lastRunStatus === 'error' ? 1 : 0,
    load: 0.45,
    metadata: {
      scheduled: false,
      jobId: job.id
    }
  });
  if (preGuard.action === 'halt') {
    const message = `QECC guard blocked SQL import (${preGuard.reason}).`;
    await settleExternalSqlImportJobRun({
      job,
      status: 'error',
      message
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'sql_import_job.qecc_guard_halt',
      entityType: 'external_sql_import_job',
      entityId: job.id,
      details: { decision: preGuard, maxRows }
    });
    return reply.status(409).send(fail('QECC_HALT', message));
  }
  try {
    const { imported } = await executeExternalSqlImportJob({
      ...job,
      maxRows
    });
    const successMessage = `Imported ${imported.casesCreated} cases and replaced ${imported.removedPriorCases} prior case rows.`;
    const postGuard = await evaluateAxionQeccGuard({
      jobType: 'sql-import',
      stage: 'manual_post_run',
      projectId,
      durationSeconds: Math.max(0, (Date.now() - startedAtMs) / 1000),
      load: 0.55,
      metadata: {
        scheduled: false,
        jobId: job.id
      }
    });
    await settleExternalSqlImportJobRun({
      job,
      status: 'success',
      message: successMessage
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'sql_import_job.run',
      entityType: 'external_sql_import_job',
      entityId: job.id,
      details: { label: job.label, maxRows, qeccGuard: postGuard, ...imported }
    });
    return ok({ imported });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to refresh the SQL import job.';
    const failGuard = await evaluateAxionQeccGuard({
      jobType: 'sql-import',
      stage: 'manual_failed',
      projectId,
      durationSeconds: Math.max(0, (Date.now() - startedAtMs) / 1000),
      errorRate: 1,
      failedStage: true,
      load: 0.7,
      metadata: {
        scheduled: false,
        jobId: job.id
      }
    });
    await settleExternalSqlImportJobRun({
      job,
      status: 'error',
      message: failGuard.action === 'halt' ? `${message} (QECC halt: ${failGuard.reason})` : message
    });
    return reply.status(400).send(fail('INVALID', failGuard.action === 'halt' ? `${message} (QECC halt: ${failGuard.reason})` : message));
  }
});

server.patch('/sql-import/jobs/:jobId/schedule', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { jobId } = request.params as { jobId: string };
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    enabled: boolean;
    intervalMinutes: number;
    maxRows: number;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const job = (await listExternalSqlImportJobs(projectId)).find((item) => item.id === jobId);
  if (!job) return reply.status(404).send(fail('NOT_FOUND', 'SQL import job not found.'));
  const enabled = body.enabled === true;
  const intervalMinutes = enabled ? clampSqlScheduleIntervalMinutes(body.intervalMinutes ?? job.scheduleIntervalMinutes ?? 60) : null;
  const maxRows = clampSqlImportMaxRows(body.maxRows, job.maxRows);
  const updatedAt = new Date().toISOString();
  const updated = await updateExternalSqlImportJobSchedule({
    id: job.id,
    projectId,
    maxRows,
    scheduleEnabled: enabled,
    scheduleIntervalMinutes: intervalMinutes,
    scheduleNextRunAt: computeSqlImportScheduleNextRunAt(enabled, intervalMinutes, updatedAt),
    updatedAt
  });
  if (!updated) return reply.status(404).send(fail('NOT_FOUND', 'SQL import job not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'sql_import_job.schedule',
    entityType: 'external_sql_import_job',
    entityId: job.id,
    details: { enabled, intervalMinutes, maxRows }
  });
  const refreshedJob = (await listExternalSqlImportJobs(projectId)).find((item) => item.id === jobId);
  return ok({ job: refreshedJob ? serializeExternalSqlImportJob(refreshedJob) : null });
});

server.delete('/sql-import/jobs/:jobId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { jobId } = request.params as { jobId: string };
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const removed = await deleteExternalSqlImportJob(jobId, projectId);
  if (!removed) return reply.status(404).send(fail('NOT_FOUND', 'SQL import job not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'sql_import_job.delete',
    entityType: 'external_sql_import_job',
    entityId: jobId,
    details: {}
  });
  return ok({ removed: true });
});

server.get('/office-connectors/profiles', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const items = await listOfficeConnectorProfiles(projectId);
  return ok({
    items: items.map(serializeOfficeConnectorProfile),
    total: items.length
  });
});

server.post('/office-connectors/profiles', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    label: string;
    rootPath: string;
    includeSubdirectories: boolean;
    allowedExtensions: unknown;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const rootPathInput = typeof body.rootPath === 'string' ? body.rootPath.trim() : '';
  if (!label || !rootPathInput) {
    return reply.status(400).send(fail('INVALID', 'Profile label and root path are required.'));
  }
  const normalizedRootPath = path.resolve(rootPathInput);
  const includeSubdirectories = body.includeSubdirectories !== false;
  const rawAllowedExtensions = typeof body.allowedExtensions === 'string'
    ? body.allowedExtensions.split(',').map((item) => item.trim())
    : body.allowedExtensions;
  const allowedExtensions = normalizeOfficeConnectorExtensions(rawAllowedExtensions);
  const timestamp = new Date().toISOString();
  const saved = await insertOfficeConnectorProfile({
    id: `office-connector-profile-${randomUUID()}`,
    projectId,
    label,
    rootPath: normalizedRootPath,
    includeSubdirectories,
    allowedExtensionsJson: JSON.stringify(allowedExtensions),
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'office_connector_profile.save',
    entityType: 'office_connector_profile',
    entityId: saved.id,
    details: {
      label: saved.label,
      rootPath: saved.rootPath,
      includeSubdirectories: saved.includeSubdirectories,
      allowedExtensions
    }
  });
  reply.code(201);
  return ok({ profile: serializeOfficeConnectorProfile(saved) });
});

server.delete('/office-connectors/profiles/:profileId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { profileId } = request.params as { profileId: string };
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const removed = await deleteOfficeConnectorProfile(profileId, projectId);
  if (!removed) return reply.status(404).send(fail('NOT_FOUND', 'Office connector profile not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'office_connector_profile.delete',
    entityType: 'office_connector_profile',
    entityId: profileId,
    details: {}
  });
  return ok({ removed: true });
});

server.post('/office-connectors/profiles/:profileId/discover', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { profileId } = request.params as { profileId: string };
  const body = (request.body ?? {}) as Partial<{ projectId: string; maxFiles: number }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const profile = (await listOfficeConnectorProfiles(projectId)).find((item) => item.id === profileId);
  if (!profile) return reply.status(404).send(fail('NOT_FOUND', 'Office connector profile not found.'));
  const maxFiles = clampOfficeConnectorMaxFiles(body.maxFiles, 200);
  try {
    const files = await collectOfficeConnectorFiles({
      rootPath: profile.rootPath,
      includeSubdirectories: profile.includeSubdirectories,
      allowedExtensions: normalizeOfficeConnectorExtensions(parseJsonArray(profile.allowedExtensionsJson)),
      maxFiles
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'office_connector_profile.discover',
      entityType: 'office_connector_profile',
      entityId: profile.id,
      details: { label: profile.label, maxFiles, discoveredCount: files.length }
    });
    return ok({ items: files, total: files.length });
  } catch (error) {
    return reply.status(400).send(fail('INVALID', error instanceof Error ? error.message : 'Unable to discover Office files.'));
  }
});

server.get('/office-connectors/jobs', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const items = await listOfficeConnectorJobs(projectId);
  return ok({
    items: items.map(serializeOfficeConnectorJob),
    total: items.length
  });
});

server.post('/office-connectors/jobs', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    profileId: string;
    label: string;
    maxFiles: number;
    forceResync: boolean;
    scheduleEnabled: boolean;
    scheduleIntervalMinutes: number;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const profileId = typeof body.profileId === 'string' ? body.profileId.trim() : '';
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!profileId || !label) {
    return reply.status(400).send(fail('INVALID', 'Profile and label are required.'));
  }
  const profile = (await listOfficeConnectorProfiles(projectId)).find((item) => item.id === profileId);
  if (!profile) return reply.status(404).send(fail('NOT_FOUND', 'Office connector profile not found.'));
  const maxFiles = clampOfficeConnectorMaxFiles(body.maxFiles, 500);
  const forceResync = body.forceResync === true;
  const scheduleEnabled = body.scheduleEnabled === true;
  const scheduleIntervalMinutes = scheduleEnabled ? clampSqlScheduleIntervalMinutes(body.scheduleIntervalMinutes) : null;
  const timestamp = new Date().toISOString();
  const saved = await insertOfficeConnectorJob({
    id: `office-connector-job-${randomUUID()}`,
    projectId,
    profileId,
    label,
    syncOptionsJson: JSON.stringify({ maxFiles, forceResync }),
    scheduleEnabled,
    scheduleIntervalMinutes,
    scheduleNextRunAt: computeSqlImportScheduleNextRunAt(scheduleEnabled, scheduleIntervalMinutes, timestamp),
    lastRunAt: null,
    lastRunStatus: null,
    lastRunMessage: null,
    lastRunStatsJson: JSON.stringify(defaultOfficeConnectorRunStats()),
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'office_connector_job.save',
    entityType: 'office_connector_job',
    entityId: saved.id,
    details: { label, profileLabel: profile.label, maxFiles, forceResync, scheduleEnabled, scheduleIntervalMinutes }
  });
  reply.code(201);
  return ok({ job: serializeOfficeConnectorJob(saved) });
});

server.post('/office-connectors/jobs/:jobId/run', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { jobId } = request.params as { jobId: string };
  const body = (request.body ?? {}) as Partial<{ projectId: string; maxFiles: number; forceResync: boolean }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const job = (await listOfficeConnectorJobs(projectId)).find((item) => item.id === jobId);
  if (!job) return reply.status(404).send(fail('NOT_FOUND', 'Office connector job not found.'));
  const parsedSync = parseJsonObject(job.syncOptionsJson);
  const maxFiles = clampOfficeConnectorMaxFiles(body.maxFiles, clampOfficeConnectorMaxFiles(parsedSync.maxFiles, 500));
  const forceResync = body.forceResync === true;
  try {
    const { profileLabel, stats } = await executeOfficeConnectorJob(job, { maxFiles, forceResync });
    const message = `Synced ${stats.importedCount} file(s); ${stats.skippedUnchangedCount} unchanged; ${stats.errorCount} error(s).`;
    await settleOfficeConnectorJobRun({
      job,
      status: stats.errorCount > 0 ? 'error' : 'success',
      message,
      stats
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'office_connector_job.run',
      entityType: 'office_connector_job',
      entityId: job.id,
      details: { label: job.label, profileLabel, maxFiles, forceResync, ...stats }
    });
    return ok({ profileLabel, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run the Office connector sync job.';
    const stats = defaultOfficeConnectorRunStats();
    stats.errorCount = 1;
    stats.errors.push({ message });
    await settleOfficeConnectorJobRun({
      job,
      status: 'error',
      message,
      stats
    });
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.patch('/office-connectors/jobs/:jobId/schedule', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { jobId } = request.params as { jobId: string };
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    enabled: boolean;
    intervalMinutes: number;
    maxFiles: number;
    forceResync: boolean;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const job = (await listOfficeConnectorJobs(projectId)).find((item) => item.id === jobId);
  if (!job) return reply.status(404).send(fail('NOT_FOUND', 'Office connector job not found.'));
  const priorOptions = parseJsonObject(job.syncOptionsJson);
  const maxFiles = clampOfficeConnectorMaxFiles(body.maxFiles, clampOfficeConnectorMaxFiles(priorOptions.maxFiles, 500));
  const forceResync = body.forceResync === true || priorOptions.forceResync === true;
  const enabled = body.enabled === true;
  const intervalMinutes = enabled ? clampSqlScheduleIntervalMinutes(body.intervalMinutes ?? job.scheduleIntervalMinutes ?? 60) : null;
  const updatedAt = new Date().toISOString();
  const updated = await updateOfficeConnectorJobSchedule({
    id: job.id,
    projectId,
    scheduleEnabled: enabled,
    scheduleIntervalMinutes: intervalMinutes,
    scheduleNextRunAt: computeSqlImportScheduleNextRunAt(enabled, intervalMinutes, updatedAt),
    syncOptionsJson: JSON.stringify({ maxFiles, forceResync }),
    updatedAt
  });
  if (!updated) return reply.status(404).send(fail('NOT_FOUND', 'Office connector job not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'office_connector_job.schedule',
    entityType: 'office_connector_job',
    entityId: job.id,
    details: { enabled, intervalMinutes, maxFiles, forceResync }
  });
  const refreshed = (await listOfficeConnectorJobs(projectId)).find((item) => item.id === jobId);
  return ok({ job: refreshed ? serializeOfficeConnectorJob(refreshed) : null });
});

server.delete('/office-connectors/jobs/:jobId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { jobId } = request.params as { jobId: string };
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const removed = await deleteOfficeConnectorJob(jobId, projectId);
  if (!removed) return reply.status(404).send(fail('NOT_FOUND', 'Office connector job not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'office_connector_job.delete',
    entityType: 'office_connector_job',
    entityId: jobId,
    details: {}
  });
  return ok({ removed: true });
});

server.get('/reference-connectors/profiles', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const items = await listReferenceConnectorProfiles(projectId);
  return ok({
    items: items.map(serializeReferenceConnectorProfile),
    total: items.length
  });
});

server.post('/reference-connectors/profiles', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    label: string;
    provider: string;
    settings: unknown;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label) return reply.status(400).send(fail('INVALID', 'Profile label is required.'));
  const provider = parseReferenceConnectorProvider(body.provider);
  const settingsRaw = body.settings && typeof body.settings === 'object' && !Array.isArray(body.settings)
    ? body.settings as Record<string, unknown>
    : {};
  const settings = {
    mailto: typeof settingsRaw.mailto === 'string' ? settingsRaw.mailto.trim() : '',
    apiKey: typeof settingsRaw.apiKey === 'string' ? settingsRaw.apiKey.trim() : ''
  };
  const timestamp = new Date().toISOString();
  const saved = await insertReferenceConnectorProfile({
    id: `reference-connector-profile-${randomUUID()}`,
    projectId,
    label,
    provider,
    settingsJson: JSON.stringify(settings),
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference_connector_profile.save',
    entityType: 'reference_connector_profile',
    entityId: saved.id,
    details: { label, provider, hasMailto: Boolean(settings.mailto), hasApiKey: Boolean(settings.apiKey) }
  });
  reply.code(201);
  return ok({ profile: serializeReferenceConnectorProfile(saved) });
});

server.delete('/reference-connectors/profiles/:profileId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { profileId } = request.params as { profileId: string };
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const removed = await deleteReferenceConnectorProfile(profileId, projectId);
  if (!removed) return reply.status(404).send(fail('NOT_FOUND', 'Reference connector profile not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference_connector_profile.delete',
    entityType: 'reference_connector_profile',
    entityId: profileId,
    details: {}
  });
  return ok({ removed: true });
});

server.post('/reference-connectors/profiles/:profileId/search', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { profileId } = request.params as { profileId: string };
  const body = (request.body ?? {}) as Partial<{ projectId: string; queryText: string; maxRows: number }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const profile = (await listReferenceConnectorProfiles(projectId)).find((item) => item.id === profileId);
  if (!profile) return reply.status(404).send(fail('NOT_FOUND', 'Reference connector profile not found.'));
  const queryText = typeof body.queryText === 'string' ? body.queryText.trim() : '';
  if (!queryText) return reply.status(400).send(fail('INVALID', 'Query text is required.'));
  const maxRows = clampReferenceConnectorMaxRows(body.maxRows, 50);
  try {
    const candidates = await searchReferenceProvider({
      provider: profile.provider,
      queryText,
      maxRows,
      settings: parseJsonObject(profile.settingsJson)
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'reference_connector.search',
      entityType: 'reference_connector_profile',
      entityId: profile.id,
      details: { label: profile.label, provider: profile.provider, queryText, maxRows, fetchedCount: candidates.length }
    });
    return ok({ items: candidates, total: candidates.length });
  } catch (error) {
    return reply.status(400).send(fail('INVALID', error instanceof Error ? error.message : 'Reference connector search failed.'));
  }
});

server.post('/reference-connectors/profiles/:profileId/import', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { profileId } = request.params as { profileId: string };
  const body = (request.body ?? {}) as Partial<{ projectId: string; queryText: string; maxRows: number; skipDuplicates: boolean }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const profile = (await listReferenceConnectorProfiles(projectId)).find((item) => item.id === profileId);
  if (!profile) return reply.status(404).send(fail('NOT_FOUND', 'Reference connector profile not found.'));
  const queryText = typeof body.queryText === 'string' ? body.queryText.trim() : '';
  if (!queryText) return reply.status(400).send(fail('INVALID', 'Query text is required.'));
  const maxRows = clampReferenceConnectorMaxRows(body.maxRows, 50);
  const skipDuplicates = body.skipDuplicates !== false;
  try {
    const candidates = await searchReferenceProvider({
      provider: profile.provider,
      queryText,
      maxRows,
      settings: parseJsonObject(profile.settingsJson)
    });
    const imported = await importReferenceConnectorCandidates({
      projectId,
      provider: profile.provider,
      candidates,
      skipDuplicates
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'reference_connector.import',
      entityType: 'reference_connector_profile',
      entityId: profile.id,
      details: {
        label: profile.label,
        provider: profile.provider,
        queryText,
        maxRows,
        skipDuplicates,
        fetchedCount: candidates.length,
        importedCount: imported.imported.length,
        skippedCount: imported.skipped.length
      }
    });
    return ok({
      fetchedCount: candidates.length,
      importedCount: imported.imported.length,
      skippedCount: imported.skipped.length,
      imported: imported.imported,
      skipped: imported.skipped
    });
  } catch (error) {
    return reply.status(400).send(fail('INVALID', error instanceof Error ? error.message : 'Reference connector import failed.'));
  }
});

server.get('/reference-connectors/jobs', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const items = await listReferenceConnectorJobs(projectId);
  return ok({
    items: items.map(serializeReferenceConnectorJob),
    total: items.length
  });
});

server.post('/reference-connectors/jobs', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    profileId: string;
    label: string;
    queryText: string;
    maxRows: number;
    skipDuplicates: boolean;
    scheduleEnabled: boolean;
    scheduleIntervalMinutes: number;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const profileId = typeof body.profileId === 'string' ? body.profileId.trim() : '';
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const queryText = typeof body.queryText === 'string' ? body.queryText.trim() : '';
  if (!profileId || !label || !queryText) {
    return reply.status(400).send(fail('INVALID', 'Profile, label, and query text are required.'));
  }
  const profile = (await listReferenceConnectorProfiles(projectId)).find((item) => item.id === profileId);
  if (!profile) return reply.status(404).send(fail('NOT_FOUND', 'Reference connector profile not found.'));
  const maxRows = clampReferenceConnectorMaxRows(body.maxRows, 50);
  const skipDuplicates = body.skipDuplicates !== false;
  const scheduleEnabled = body.scheduleEnabled === true;
  const scheduleIntervalMinutes = scheduleEnabled ? clampSqlScheduleIntervalMinutes(body.scheduleIntervalMinutes) : null;
  const timestamp = new Date().toISOString();
  const saved = await insertReferenceConnectorJob({
    id: `reference-connector-job-${randomUUID()}`,
    projectId,
    profileId,
    label,
    queryJson: JSON.stringify({ text: queryText, maxRows, skipDuplicates }),
    scheduleEnabled,
    scheduleIntervalMinutes,
    scheduleNextRunAt: computeSqlImportScheduleNextRunAt(scheduleEnabled, scheduleIntervalMinutes, timestamp),
    lastRunAt: null,
    lastRunStatus: null,
    lastRunMessage: null,
    lastRunStatsJson: '{}',
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference_connector_job.save',
    entityType: 'reference_connector_job',
    entityId: saved.id,
    details: { label, provider: profile.provider, queryText, maxRows, skipDuplicates, scheduleEnabled, scheduleIntervalMinutes }
  });
  reply.code(201);
  return ok({ job: serializeReferenceConnectorJob(saved) });
});

server.post('/reference-connectors/jobs/:jobId/run', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { jobId } = request.params as { jobId: string };
  const body = (request.body ?? {}) as Partial<{ projectId: string; queryText: string; maxRows: number; skipDuplicates: boolean }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const job = (await listReferenceConnectorJobs(projectId)).find((item) => item.id === jobId);
  if (!job) return reply.status(404).send(fail('NOT_FOUND', 'Reference connector job not found.'));
  const priorQuery = parseJsonObject(job.queryJson);
  const queryText = typeof body.queryText === 'string' && body.queryText.trim()
    ? body.queryText.trim()
    : (typeof priorQuery.text === 'string' ? priorQuery.text.trim() : '');
  if (!queryText) return reply.status(400).send(fail('INVALID', 'Query text is required.'));
  const maxRows = clampReferenceConnectorMaxRows(body.maxRows ?? priorQuery.maxRows, 50);
  const skipDuplicates = typeof body.skipDuplicates === 'boolean'
    ? body.skipDuplicates
    : priorQuery.skipDuplicates !== false;
  const effectiveJob = { ...job, queryJson: JSON.stringify({ text: queryText, maxRows, skipDuplicates }) };
  try {
    const result = await executeReferenceConnectorJob(effectiveJob);
    const message = `Fetched ${result.fetchedCount} record(s), imported ${result.importedCount}, skipped ${result.skippedCount}.`;
    await settleReferenceConnectorJobRun({
      job,
      status: 'success',
      message,
      stats: result
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'reference_connector_job.run',
      entityType: 'reference_connector_job',
      entityId: job.id,
      details: result
    });
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run the reference connector sync job.';
    await settleReferenceConnectorJobRun({
      job,
      status: 'error',
      message,
      stats: { error: message }
    });
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.patch('/reference-connectors/jobs/:jobId/schedule', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { jobId } = request.params as { jobId: string };
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    enabled: boolean;
    intervalMinutes: number;
    queryText: string;
    maxRows: number;
    skipDuplicates: boolean;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const job = (await listReferenceConnectorJobs(projectId)).find((item) => item.id === jobId);
  if (!job) return reply.status(404).send(fail('NOT_FOUND', 'Reference connector job not found.'));
  const priorQuery = parseJsonObject(job.queryJson);
  const queryText = typeof body.queryText === 'string' && body.queryText.trim()
    ? body.queryText.trim()
    : (typeof priorQuery.text === 'string' ? priorQuery.text.trim() : '');
  if (!queryText) return reply.status(400).send(fail('INVALID', 'Query text is required.'));
  const maxRows = clampReferenceConnectorMaxRows(body.maxRows ?? priorQuery.maxRows, 50);
  const skipDuplicates = typeof body.skipDuplicates === 'boolean'
    ? body.skipDuplicates
    : priorQuery.skipDuplicates !== false;
  const enabled = body.enabled === true;
  const intervalMinutes = enabled ? clampSqlScheduleIntervalMinutes(body.intervalMinutes ?? job.scheduleIntervalMinutes ?? 60) : null;
  const updatedAt = new Date().toISOString();
  const updated = await updateReferenceConnectorJobSchedule({
    id: job.id,
    projectId,
    scheduleEnabled: enabled,
    scheduleIntervalMinutes: intervalMinutes,
    scheduleNextRunAt: computeSqlImportScheduleNextRunAt(enabled, intervalMinutes, updatedAt),
    queryJson: JSON.stringify({ text: queryText, maxRows, skipDuplicates }),
    updatedAt
  });
  if (!updated) return reply.status(404).send(fail('NOT_FOUND', 'Reference connector job not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference_connector_job.schedule',
    entityType: 'reference_connector_job',
    entityId: job.id,
    details: { enabled, intervalMinutes, queryText, maxRows, skipDuplicates }
  });
  const refreshed = (await listReferenceConnectorJobs(projectId)).find((item) => item.id === job.id);
  return ok({ job: refreshed ? serializeReferenceConnectorJob(refreshed) : null });
});

server.delete('/reference-connectors/jobs/:jobId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { jobId } = request.params as { jobId: string };
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const removed = await deleteReferenceConnectorJob(jobId, projectId);
  if (!removed) return reply.status(404).send(fail('NOT_FOUND', 'Reference connector job not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference_connector_job.delete',
    entityType: 'reference_connector_job',
    entityId: jobId,
    details: {}
  });
  return ok({ removed: true });
});

server.get('/governance/status', async () => {
  const policy = await getGovernancePolicy();
  const deploymentIssues = validateDeploymentEnvironment(policy);
  const oidcReadiness = await buildOidcReadiness(false);
  return ok({
    auditTrailEnabled: true,
    oidcEnabled: oidcConfig.enabled,
    sessionIdleTimeoutMinutes: policy.idleTimeoutMinutes,
    sessionAbsoluteTimeoutMinutes: policy.sessionAbsoluteTimeoutMinutes,
    loginThrottle: {
      enabled: true,
      windowMinutes: policy.loginThrottleWindowMinutes,
      maxFailures: policy.loginThrottleMaxFailures
    },
    localAuthEnabled: policy.localAuthEnabled,
    passwordPolicy: {
      minLength: policy.passwordMinLength,
      requireUppercase: policy.passwordRequireUppercase,
      requireNumber: policy.passwordRequireNumber,
      requireSymbol: policy.passwordRequireSymbol
    },
    auditExportMaxRows: policy.auditExportMaxRows,
    backupRetentionDays: policy.backupRetentionDays,
    exportStorageEnabled: true,
    securityHeadersEnabled: true,
    oidcReadiness,
    deploymentReady: deploymentIssues.every((issue) => issue.severity !== 'error'),
    deploymentIssues
  });
});

server.get('/governance/policies', async (request, reply) => {
  const userId = await assertProfessor(request, reply);
  if (!userId) return;
  return ok({ policy: await getGovernancePolicy() });
});

server.put('/governance/policies', async (request, reply) => {
  const userId = await assertProfessor(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    idleTimeoutMinutes: number;
    sessionAbsoluteTimeoutMinutes: number;
    loginThrottleWindowMinutes: number;
    loginThrottleMaxFailures: number;
    localAuthEnabled: boolean;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumber: boolean;
    passwordRequireSymbol: boolean;
    auditExportMaxRows: number;
    backupRetentionDays: number;
  }>;
  const idleTimeoutMinutes = Math.max(15, Math.min(720, Number(body.idleTimeoutMinutes) || 90));
  const sessionAbsoluteTimeoutMinutes = Math.max(30, Math.min(7 * 24 * 60, Number(body.sessionAbsoluteTimeoutMinutes) || 720));
  const loginThrottleWindowMinutes = Math.max(1, Math.min(240, Number(body.loginThrottleWindowMinutes) || 15));
  const loginThrottleMaxFailures = Math.max(1, Math.min(20, Number(body.loginThrottleMaxFailures) || 5));
  const localAuthEnabled = body.localAuthEnabled !== false;
  const passwordMinLength = Math.max(8, Math.min(128, Number(body.passwordMinLength) || 10));
  const passwordRequireUppercase = body.passwordRequireUppercase === true;
  const passwordRequireNumber = body.passwordRequireNumber === true;
  const passwordRequireSymbol = body.passwordRequireSymbol === true;
  const auditExportMaxRows = Math.max(100, Math.min(100000, Number(body.auditExportMaxRows) || 2000));
  const backupRetentionDays = Math.max(1, Math.min(3650, Number(body.backupRetentionDays) || 30));
  if (!localAuthEnabled && !oidcConfig.enabled) {
    return reply.status(400).send(fail('INVALID', 'Cannot disable local auth until OIDC is configured.'));
  }
  const policy = await updateGovernancePolicy({
    idleTimeoutMinutes,
    sessionAbsoluteTimeoutMinutes,
    loginThrottleWindowMinutes,
    loginThrottleMaxFailures,
    localAuthEnabled,
    passwordMinLength,
    passwordRequireUppercase,
    passwordRequireNumber,
    passwordRequireSymbol,
    auditExportMaxRows,
    backupRetentionDays,
    updatedByUserId: userId
  });
  IDLE_TIMEOUT_MS = policy.idleTimeoutMinutes * 60 * 1000;
  SESSION_ABSOLUTE_TIMEOUT_MS = policy.sessionAbsoluteTimeoutMinutes * 60 * 1000;
  LOGIN_THROTTLE_WINDOW_MS = policy.loginThrottleWindowMinutes * 60 * 1000;
  LOGIN_THROTTLE_MAX_FAILURES = policy.loginThrottleMaxFailures;
  LOCAL_AUTH_ENABLED = policy.localAuthEnabled;
  PASSWORD_MIN_LENGTH = policy.passwordMinLength;
  PASSWORD_REQUIRE_UPPERCASE = policy.passwordRequireUppercase;
  PASSWORD_REQUIRE_NUMBER = policy.passwordRequireNumber;
  PASSWORD_REQUIRE_SYMBOL = policy.passwordRequireSymbol;
  AUDIT_EXPORT_MAX_ROWS = policy.auditExportMaxRows;
  BACKUP_RETENTION_DAYS = policy.backupRetentionDays;
  return ok({ policy });
});

server.get('/deployment/validate', async (request, reply) => {
  const userId = await assertProfessor(request, reply);
  if (!userId) return;
  const policy = await getGovernancePolicy();
  const issues = validateDeploymentEnvironment(policy);
  const addIssue = (issue: { severity: 'error' | 'warning'; key: string; message: string }) => {
    if (!issues.some((entry) => entry.severity === issue.severity && entry.key === issue.key && entry.message === issue.message)) {
      issues.push(issue);
    }
  };
  const oidcReadiness = await buildOidcReadiness(true);
  if (oidcReadiness.discovery && !oidcReadiness.discovery.ok) {
    addIssue({
      severity: 'error',
      key: 'OIDC_DISCOVERY',
      message: `OIDC discovery probe failed: ${oidcReadiness.discovery.error}`
    });
  }
  if (oidcConfig.enabled && !oidcReadiness.redirectUriCheck.valid) {
    addIssue({
      severity: 'error',
      key: 'OIDC_REDIRECT_URI_FORMAT',
      message: oidcReadiness.redirectUriCheck.message
    });
  }
  if (oidcConfig.enabled && oidcReadiness.redirectUriCheck.hostMatchesAppOrigin === false) {
    addIssue({
      severity: isProduction ? 'error' : 'warning',
      key: 'OIDC_REDIRECT_URI_ORIGIN',
      message: oidcReadiness.redirectUriCheck.message
    });
  }
  if (oidcConfig.enabled && oidcReadiness.audienceCheck.status === 'fail') {
    addIssue({
      severity: 'error',
      key: 'OIDC_AUDIENCE',
      message: oidcReadiness.audienceCheck.message
    });
  } else if (oidcConfig.enabled && oidcReadiness.audienceCheck.status === 'warn') {
    addIssue({
      severity: 'warning',
      key: 'OIDC_AUDIENCE',
      message: oidcReadiness.audienceCheck.message
    });
  }
  if (oidcReadiness.discovery?.ok && oidcReadiness.discovery.issuerMatchesConfig === false) {
    addIssue({
      severity: 'error',
      key: 'OIDC_ISSUER_MISMATCH',
      message: `OIDC discovery issuer (${oidcReadiness.discovery.issuer ?? 'unknown'}) does not match configured issuer (${oidcConfig.issuer}).`
    });
  }
  if (oidcReadiness.discovery?.ok && oidcReadiness.discovery.secureEndpoints === false) {
    addIssue({
      severity: isProduction ? 'error' : 'warning',
      key: 'OIDC_ENDPOINT_SECURITY',
      message: 'OIDC discovery returned non-HTTPS endpoints. Use HTTPS endpoints before deployment cutover.'
    });
  }
  const storageRoot = resolveStorageRoot();
  await ensureDirectory(storageRoot);
  const blockingIssues = issues.filter((issue) => issue.severity === 'error');
  const warningIssues = issues.filter((issue) => issue.severity === 'warning');
  return ok({
    storageRoot,
    oidcReadiness,
    policySnapshot: policy,
    issues,
    ready: blockingIssues.length === 0,
    summary: {
      generatedAt: new Date().toISOString(),
      blockingCount: blockingIssues.length,
      warningCount: warningIssues.length,
      blockingKeys: [...new Set(blockingIssues.map((issue) => issue.key))],
      warningKeys: [...new Set(warningIssues.map((issue) => issue.key))]
    }
  });
});

server.get('/deployment/cutover-check', async (request, reply) => {
  const userId = await assertProfessor(request, reply);
  if (!userId) return;
  const policy = await getGovernancePolicy();
  const issues = validateDeploymentEnvironment(policy);
  const addIssue = (issue: { severity: 'error' | 'warning'; key: string; message: string }) => {
    if (!issues.some((entry) => entry.severity === issue.severity && entry.key === issue.key && entry.message === issue.message)) {
      issues.push(issue);
    }
  };
  const oidcReadiness = await buildOidcReadiness(true);
  if (oidcReadiness.discovery && !oidcReadiness.discovery.ok) {
    addIssue({
      severity: 'error',
      key: 'OIDC_DISCOVERY',
      message: `OIDC discovery probe failed: ${oidcReadiness.discovery.error}`
    });
  }
  if (oidcConfig.enabled && !oidcReadiness.redirectUriCheck.valid) {
    addIssue({
      severity: 'error',
      key: 'OIDC_REDIRECT_URI_FORMAT',
      message: oidcReadiness.redirectUriCheck.message
    });
  }
  if (oidcConfig.enabled && oidcReadiness.redirectUriCheck.hostMatchesAppOrigin === false) {
    addIssue({
      severity: isProduction ? 'error' : 'warning',
      key: 'OIDC_REDIRECT_URI_ORIGIN',
      message: oidcReadiness.redirectUriCheck.message
    });
  }
  if (oidcConfig.enabled && oidcReadiness.audienceCheck.status === 'fail') {
    addIssue({
      severity: 'error',
      key: 'OIDC_AUDIENCE',
      message: oidcReadiness.audienceCheck.message
    });
  } else if (oidcConfig.enabled && oidcReadiness.audienceCheck.status === 'warn') {
    addIssue({
      severity: 'warning',
      key: 'OIDC_AUDIENCE',
      message: oidcReadiness.audienceCheck.message
    });
  }
  if (oidcReadiness.discovery?.ok && oidcReadiness.discovery.issuerMatchesConfig === false) {
    addIssue({
      severity: 'error',
      key: 'OIDC_ISSUER_MISMATCH',
      message: `OIDC discovery issuer (${oidcReadiness.discovery.issuer ?? 'unknown'}) does not match configured issuer (${oidcConfig.issuer}).`
    });
  }
  if (oidcReadiness.discovery?.ok && oidcReadiness.discovery.secureEndpoints === false) {
    addIssue({
      severity: isProduction ? 'error' : 'warning',
      key: 'OIDC_ENDPOINT_SECURITY',
      message: 'OIDC discovery returned non-HTTPS endpoints. Use HTTPS endpoints before deployment cutover.'
    });
  }
  const storageRoot = resolveStorageRoot();
  await ensureDirectory(storageRoot);
  const hasError = (key: string) => issues.some((issue) => issue.key === key && issue.severity === 'error');
  const hasWarning = (key: string) => issues.some((issue) => issue.key === key && issue.severity === 'warning');
  const checks: Array<{
    key: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
  }> = [
      {
        key: 'OIDC_ENABLED',
        label: 'OIDC enabled',
        status: oidcConfig.enabled ? 'pass' : 'fail',
        message: oidcConfig.enabled ? 'OIDC is enabled.' : 'Enable OIDC before MU deployment cutover.'
      },
      {
        key: 'OIDC_FIELDS',
        label: 'OIDC required fields',
        status: oidcReadiness.missingFields.length === 0 ? 'pass' : 'fail',
        message: oidcReadiness.missingFields.length === 0
          ? 'Issuer, client, redirect, and audience fields are configured.'
          : `Missing fields: ${oidcReadiness.missingFields.join(', ')}`
      },
      {
        key: 'OIDC_DISCOVERY',
        label: 'OIDC discovery probe',
        status: !oidcConfig.enabled
          ? 'fail'
          : oidcReadiness.discovery?.ok
            ? 'pass'
            : 'fail',
        message: !oidcConfig.enabled
          ? 'OIDC is disabled.'
          : oidcReadiness.discovery?.ok
            ? 'Provider metadata endpoint is reachable.'
            : (oidcReadiness.discovery?.error || 'OIDC discovery probe failed.')
      },
      {
        key: 'OIDC_DISCOVERY_LATENCY',
        label: 'OIDC discovery latency',
        status: !oidcConfig.enabled
          ? 'fail'
          : !oidcReadiness.discovery?.ok
            ? 'fail'
            : (oidcReadiness.discovery.probeElapsedMs ?? 0) > 4000
              ? 'warn'
              : 'pass',
        message: !oidcConfig.enabled
          ? 'OIDC is disabled.'
          : !oidcReadiness.discovery?.ok
            ? 'Discovery metadata unavailable.'
            : `Discovery probe completed in ${oidcReadiness.discovery.probeElapsedMs ?? 0} ms.`
      },
      {
        key: 'OIDC_REDIRECT_ALIGNMENT',
        label: 'OIDC redirect URI alignment',
        status: !oidcConfig.enabled
          ? 'fail'
          : !oidcReadiness.redirectUriCheck.valid
            ? 'fail'
            : oidcReadiness.redirectUriCheck.hostMatchesAppOrigin === false
              ? (isProduction ? 'fail' : 'warn')
              : 'pass',
        message: !oidcConfig.enabled
          ? 'OIDC is disabled.'
          : oidcReadiness.redirectUriCheck.message
      },
      {
        key: 'OIDC_AUDIENCE',
        label: 'OIDC audience strictness',
        status: !oidcConfig.enabled
          ? 'fail'
          : oidcReadiness.audienceCheck.status === 'pass'
            ? 'pass'
            : oidcReadiness.audienceCheck.status === 'warn'
              ? 'warn'
              : 'fail',
        message: !oidcConfig.enabled
          ? 'OIDC is disabled.'
          : oidcReadiness.audienceCheck.message
      },
      {
        key: 'OIDC_ISSUER_MATCH',
        label: 'OIDC issuer consistency',
        status: !oidcConfig.enabled
          ? 'fail'
          : !oidcReadiness.discovery?.ok
            ? 'fail'
            : oidcReadiness.discovery.issuerMatchesConfig === false
              ? 'fail'
              : 'pass',
        message: !oidcConfig.enabled
          ? 'OIDC is disabled.'
          : !oidcReadiness.discovery?.ok
            ? 'Discovery metadata unavailable.'
            : oidcReadiness.discovery.issuerMatchesConfig === false
              ? `Discovery issuer ${oidcReadiness.discovery.issuer ?? '(unknown)'} does not match configured issuer ${oidcConfig.issuer}.`
              : 'Discovery issuer matches configured issuer.'
      },
      {
        key: 'OIDC_ENDPOINT_SECURITY',
        label: 'OIDC endpoint transport',
        status: !oidcConfig.enabled
          ? 'fail'
          : !oidcReadiness.discovery?.ok
            ? 'fail'
            : oidcReadiness.discovery.secureEndpoints === false
              ? (isProduction ? 'fail' : 'warn')
              : 'pass',
        message: !oidcConfig.enabled
          ? 'OIDC is disabled.'
          : !oidcReadiness.discovery?.ok
            ? 'Discovery metadata unavailable.'
            : oidcReadiness.discovery.secureEndpoints === false
              ? 'Discovery metadata includes non-HTTPS endpoints.'
              : 'All discovered OIDC endpoints use HTTPS.'
      },
      {
        key: 'LOCAL_AUTH_MODE',
        label: 'Local auth cutover mode',
        status: policy.localAuthEnabled ? 'warn' : 'pass',
        message: policy.localAuthEnabled
          ? 'Local auth still enabled. For campus SSO cutover, disable local auth after validation.'
          : 'Local auth disabled (SSO-only mode).'
      },
      {
        key: 'DEPLOYMENT_ERRORS',
        label: 'Deployment validation errors',
        status: issues.some((issue) => issue.severity === 'error') ? 'fail' : 'pass',
        message: issues.some((issue) => issue.severity === 'error')
          ? `Found ${issues.filter((issue) => issue.severity === 'error').length} blocking deployment issue(s).`
          : 'No blocking deployment issues.'
      },
      {
        key: 'SESSION_SECRET',
        label: 'Session secret hardening',
        status: hasError('SESSION_SECRET') ? 'fail' : hasWarning('SESSION_SECRET') ? 'warn' : 'pass',
        message: hasError('SESSION_SECRET')
          ? 'SESSION_SECRET is not deployment-safe.'
          : hasWarning('SESSION_SECRET')
            ? 'SESSION_SECRET is weak for production; replace before campus cutover.'
            : 'SESSION_SECRET is configured with deployment-safe strength.'
      },
      {
        key: 'STORAGE_ROOT',
        label: 'Storage root availability',
        status: hasError('MU_STORAGE_ROOT') ? 'fail' : hasWarning('MU_STORAGE_ROOT') ? 'warn' : 'pass',
        message: hasError('MU_STORAGE_ROOT')
          ? 'Storage root check failed.'
          : hasWarning('MU_STORAGE_ROOT')
            ? `Storage root exists but needs review: ${storageRoot}`
            : `Storage root is available: ${storageRoot}`
      }
    ];
  const blockers = checks.filter((check) => check.status === 'fail');
  const warnings = checks.filter((check) => check.status === 'warn');
  const checkStatusByKey = Object.fromEntries(checks.map((check) => [check.key, check.status]));
  return ok({
    readyForCutover: blockers.length === 0,
    blockerCount: blockers.length,
    warningCount: warnings.length,
    checks,
    summary: {
      generatedAt: new Date().toISOString(),
      readyForCutover: blockers.length === 0,
      blockers: blockers.map((check) => ({ key: check.key, label: check.label, message: check.message })),
      warnings: warnings.map((check) => ({ key: check.key, label: check.label, message: check.message })),
      checkStatusByKey
    },
    issues,
    oidcReadiness,
    policySnapshot: policy,
    storageRoot
  });
});

server.get('/auth/oidc/config', async () => {
  return ok({
    enabled: oidcConfig.enabled,
    providerName: oidcConfig.providerName,
    expectedAudienceConfigured: Boolean(oidcConfig.expectedAudience),
    allowUserInfoFallback: oidcConfig.allowUserInfoFallback
  });
});

server.get('/auth/oidc/readiness', async (request, reply) => {
  const userId = await assertProfessor(request, reply);
  if (!userId) return;
  const query = request.query as { probe?: string };
  const probe = query.probe === '1' || query.probe === 'true';
  const readiness = await buildOidcReadiness(probe);
  return ok({ readiness });
});

server.get('/auth/oidc/start', async (request, reply) => {
  if (!oidcConfig.enabled) {
    return reply.status(404).send(fail('NOT_FOUND', 'MU single sign-on is not configured.'));
  }

  const metadata = await fetchOidcProviderMetadata(oidcConfig);
  const { verifier, challenge } = buildPkcePair();
  const state = createOidcState();
  request.session.oidcState = state;
  request.session.oidcCodeVerifier = verifier;
  return reply.redirect(buildOidcAuthorizationUrl({
    config: oidcConfig,
    metadata,
    state,
    codeChallenge: challenge
  }));
});

server.get('/auth/oidc/callback', async (request, reply) => {
  if (!oidcConfig.enabled) {
    return reply.status(404).send(fail('NOT_FOUND', 'MU single sign-on is not configured.'));
  }

  const query = (request.query ?? {}) as Partial<{ code: string; state: string; error: string }>;
  if (query.error) {
    return reply.status(400).send(fail('INVALID', `MU single sign-on failed: ${query.error}`));
  }
  if (!query.code || !query.state) {
    return reply.status(400).send(fail('INVALID', 'Missing OIDC callback parameters.'));
  }
  if (!request.session.oidcState || query.state !== request.session.oidcState || !request.session.oidcCodeVerifier) {
    return reply.status(400).send(fail('INVALID', 'OIDC state verification failed.'));
  }

  const metadata = await fetchOidcProviderMetadata(oidcConfig);
  const tokenResponse = await exchangeOidcCode({
    config: oidcConfig,
    metadata,
    code: query.code,
    codeVerifier: request.session.oidcCodeVerifier
  });
  const identity = await resolveOidcIdentity({
    config: oidcConfig,
    metadata,
    tokenResponse
  });

  request.session.oidcState = undefined;
  request.session.oidcCodeVerifier = undefined;

  let found = await findUserByUsername(identity.username);
  if (!found) {
    const role = identity.username.includes('prof') ? 'professor' : 'student';
    const user = await createUserRecord(`user-${randomUUID()}`, identity.username, randomUUID(), role);
    found = { user, passwordHash: '' };
  }

  setSessionUser(request, found.user);
  return reply.redirect(appOrigin);
});

// ── Auth ──────────────────────────────────────────────────────────────────────

server.post('/auth/register', async (request, reply) => {
  await deleteExpiredUsers();
  if (!LOCAL_AUTH_ENABLED) {
    return reply.status(403).send(fail('FORBIDDEN', 'Local account registration is disabled by governance policy. Use MU single sign-on.'));
  }
  const body = (request.body ?? {}) as Partial<{ username: string; password: string; role: string }>;
  const username = typeof body.username === 'string' ? normalizeMuUsername(body.username) : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role = resolveMuRole(body.role);

  if (!username || username.length < 3) return reply.status(400).send(fail('INVALID', 'Username must be at least 3 characters.'));
  const passwordPolicyError = validatePasswordAgainstPolicy(password);
  if (passwordPolicyError) return reply.status(400).send(fail('INVALID', passwordPolicyError));

  const existing = await findUserByUsername(username);
  if (existing) return reply.status(409).send(fail('CONFLICT', 'Account already exists for that MU username. Use Sign in.'));

  const user = await createUserRecord(`user-${randomUUID()}`, username, password, role);
  setSessionUser(request, user);
  reply.code(201);
  return ok({ user: { id: user.id, username: user.username, role: user.role, expiresAt: user.expiresAt } });
});

server.post('/auth/login', async (request, reply) => {
  await deleteExpiredUsers();
  if (!LOCAL_AUTH_ENABLED) {
    return reply.status(403).send(fail('FORBIDDEN', 'Local username/password sign-in is disabled by governance policy. Use MU single sign-on.'));
  }
  const body = (request.body ?? {}) as Partial<{ username: string; password: string }>;
  const username = typeof body.username === 'string' ? normalizeMuUsername(body.username) : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) return reply.status(400).send(fail('INVALID', 'Username and password are required.'));
  if (!assertLoginAllowed(request, reply, username)) return;

  const found = await findUserByUsername(username);
  if (!found) {
    recordFailedLogin(request, username);
    return reply.status(401).send(fail('UNAUTHORIZED', 'Invalid username or password.'));
  }

  const valid = await verifyPassword(password, found.passwordHash);
  if (!valid) {
    recordFailedLogin(request, username);
    return reply.status(401).send(fail('UNAUTHORIZED', 'Invalid username or password.'));
  }

  clearFailedLogin(request, username);
  setSessionUser(request, found.user);
  return ok({ user: { id: found.user.id, username: found.user.username, role: found.user.role, expiresAt: found.user.expiresAt } });
});

server.post('/auth/logout', async (request) => {
  if (request.session.userId) {
    await clearUserPresence(request.session.userId);
  }
  await request.session.destroy();
  return ok({ loggedOut: true });
});

server.post('/auth/ping', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  request.session.lastActivityAt = Date.now();
  return ok({ active: true });
});

server.get('/auth/me', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const user = await findUserById(userId);
  if (!user) return reply.status(401).send(fail('UNAUTHORIZED', 'User not found.'));
  return ok({ user: { id: user.id, username: user.username, role: user.role, expiresAt: user.expiresAt } });
});

// ── Projects ──────────────────────────────────────────────────────────────────

server.get('/projects', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const items = await listProjects(userId);
  return ok({ items, total: items.length });
});

server.post('/projects', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{ id: string; name: string; description: string; workspaceMode: string }>;
  const project = createProject({
    id: typeof body.id === 'string' && body.id.trim() ? body.id : `project-${randomUUID()}`,
    name: typeof body.name === 'string' ? body.name : '',
    workspaceMode: parseProjectWorkspaceMode(body.workspaceMode),
    description: typeof body.description === 'string' ? body.description : ''
  });
  await insertProject(project);
  await addMembership(userId, project.id, 'owner');
  await recordAuditEvent({
    request,
    projectId: project.id,
    action: 'project.create',
    entityType: 'project',
    entityId: project.id,
    details: { name: project.name, workspaceMode: project.workspaceMode }
  });
  reply.code(201);
  return ok({ project });
});

server.delete('/projects/:projectId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { projectId } = request.params as { projectId: string };
  if (!await assertProjectOwner(userId, projectId, reply)) return;

  await recordAuditEvent({
    request,
    projectId,
    action: 'project.delete',
    entityType: 'project',
    entityId: projectId,
    details: { deleted: true }
  });
  const deleted = await deleteProject(projectId);
  if (!deleted) {
    return reply.status(404).send(fail('NOT_FOUND', 'Project not found.'));
  }

  await deleteProjectArtifacts({ projectId });
  return ok({ deleted: true, projectId });
});

server.post('/projects/:projectId/workspace-mode', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { projectId } = request.params as { projectId: string };
  if (!await assertProjectOwner(userId, projectId, reply)) return;
  const body = (request.body ?? {}) as Partial<{ workspaceMode: string }>;
  const project = await updateProjectWorkspaceMode(projectId, parseProjectWorkspaceMode(body.workspaceMode));
  await recordAuditEvent({
    request,
    projectId,
    action: 'project.workspace_mode.update',
    entityType: 'project',
    entityId: projectId,
    details: { workspaceMode: project.workspaceMode }
  });
  return ok({ project });
});

server.get('/projects/:projectId/members', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { projectId } = request.params as { projectId: string };
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  return ok({ members: await listProjectMembers(projectId) });
});

server.post('/projects/:projectId/members', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { projectId } = request.params as { projectId: string };
  if (!await assertProjectOwner(userId, projectId, reply)) return;
  const body = (request.body ?? {}) as Partial<{ username: string; role: string }>;
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!username) return reply.status(400).send(fail('INVALID', 'Username is required.'));
  const found = await findUserByUsername(username);
  if (!found) return reply.status(404).send(fail('NOT_FOUND', 'User not found.'));
  const role: 'collaborator' | 'owner' = body.role === 'owner' ? 'owner' : 'collaborator';
  await addMembership(found.user.id, projectId, role);
  await recordAuditEvent({
    request,
    projectId,
    action: 'membership.add',
    entityType: 'membership',
    entityId: `${projectId}:${found.user.id}`,
    details: { username: found.user.username, role }
  });
  reply.code(201);
  return ok({ added: { userId: found.user.id, username: found.user.username, role } });
});

server.delete('/projects/:projectId/members/:memberId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { projectId, memberId } = request.params as { projectId: string; memberId: string };
  if (!await assertProjectOwner(userId, projectId, reply)) return;

  const membership = await getProjectMembership(memberId, projectId);
  if (!membership) return reply.status(404).send(fail('NOT_FOUND', 'Project member not found.'));
  if (membership.role === 'owner' && await countProjectOwners(projectId) <= 1) {
    return reply.status(400).send(fail('INVALID', 'Cannot remove the last project owner.'));
  }

  await removeMembership(memberId, projectId);
  await recordAuditEvent({
    request,
    projectId,
    action: 'membership.remove',
    entityType: 'membership',
    entityId: `${projectId}:${memberId}`,
    details: { memberId }
  });
  return ok({ removed: true });
});

server.get('/presence', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listProjectPresence(projectId);
  return ok({ items, total: items.length });
});

server.post('/presence/ping', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const role = request.session.role ?? 'student';
  await touchProjectPresence(userId, projectId, role);
  return ok({ active: true });
});

server.get('/project-messages', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string; limit: string }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const limit = Math.min(1000, Math.max(1, Number.parseInt(query.limit ?? '250', 10) || 250));
  const items = await listProjectMessages(projectId, limit);
  return ok({ items, total: items.length });
});

server.post('/project-messages', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{ projectId: string; body: string }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const messageBody = typeof body.body === 'string' ? body.body.trim() : '';
  if (!messageBody) return reply.status(400).send(fail('INVALID', 'Message body is required.'));
  const message = await insertProjectMessage({
    id: `message-${randomUUID()}`,
    projectId,
    userId,
    body: messageBody,
    createdAt: new Date().toISOString()
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'message.create',
    entityType: 'project_message',
    entityId: message.id,
    details: { bodyLength: message.body.length }
  });
  reply.code(201);
  return ok({ message });
});

server.get('/projects/:projectId/activity', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { projectId } = request.params as { projectId: string };
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  return ok({ projectId, updatedAt: await getProjectActivity(projectId) });
});

server.get('/project-summary', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  return ok(await getProjectSummary(projectId));
});

server.get('/audit-events', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    limit: string;
    actorUsername: string;
    actorRole: string;
    actionPrefix: string;
    entityType: string;
    from: string;
    to: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const limit = Math.min(AUDIT_EXPORT_MAX_ROWS, Math.max(1, Number.parseInt(query.limit ?? '200', 10) || 200));
  const items = await listAuditEvents(projectId, {
    limit,
    actorUsername: typeof query.actorUsername === 'string' && query.actorUsername.trim() ? query.actorUsername.trim() : undefined,
    actorRole: query.actorRole === 'student' || query.actorRole === 'professor' || query.actorRole === 'system'
      ? query.actorRole
      : undefined,
    actionPrefix: typeof query.actionPrefix === 'string' && query.actionPrefix.trim() ? query.actionPrefix.trim() : undefined,
    entityType: typeof query.entityType === 'string' && query.entityType.trim() ? query.entityType.trim() : undefined,
    from: parseIsoDate(query.from),
    to: parseIsoDate(query.to)
  });
  return ok({
    items: items.map((item) => ({
      ...item,
      actionLabel: formatAuditActionLabel(item.action)
    })),
    total: items.length
  });
});

server.get('/exports/audit', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    format: string;
    actorUsername: string;
    actorRole: string;
    actionPrefix: string;
    entityType: string;
    from: string;
    to: string;
    limit: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;
  const limit = Math.min(AUDIT_EXPORT_MAX_ROWS, Math.max(1, Number.parseInt(query.limit ?? String(AUDIT_EXPORT_MAX_ROWS), 10) || AUDIT_EXPORT_MAX_ROWS));
  const items = (await listAuditEvents(projectId, {
    limit,
    actorUsername: typeof query.actorUsername === 'string' && query.actorUsername.trim() ? query.actorUsername.trim() : undefined,
    actorRole: query.actorRole === 'student' || query.actorRole === 'professor' || query.actorRole === 'system'
      ? query.actorRole
      : undefined,
    actionPrefix: typeof query.actionPrefix === 'string' && query.actionPrefix.trim() ? query.actionPrefix.trim() : undefined,
    entityType: typeof query.entityType === 'string' && query.entityType.trim() ? query.entityType.trim() : undefined,
    from: parseIsoDate(query.from),
    to: parseIsoDate(query.to)
  })).map((item) => ({
    ...item,
    actionLabel: formatAuditActionLabel(item.action)
  }));
  const format = query.format === 'csv' || query.format === 'txt' || query.format === 'xlsx' ? query.format : 'json';

  if (format === 'csv') {
    const csv = serializeAuditEventsCsv(items);
    const artifact = await writeProjectArtifact({
      projectId,
      area: 'audit',
      label: 'audit-events',
      extension: 'csv',
      contents: csv
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.audit',
      entityType: 'export',
      entityId: `${projectId}:audit:csv`,
      details: { count: items.length, file: artifact.relativePath }
    });
    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-audit-events.csv"`);
    return reply.send(csv);
  }

  if (format === 'txt') {
    const text = items.map((item) => [
      `${item.createdAt} | ${item.actorUsername} (${item.actorRole})`,
      `${item.action} -> ${item.entityType} ${item.entityId}`,
      JSON.stringify(item.details)
    ].join('\n')).join('\n\n');
    const artifact = await writeProjectArtifact({
      projectId,
      area: 'audit',
      label: 'audit-events',
      extension: 'txt',
      contents: `${text}\n`
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.audit',
      entityType: 'export',
      entityId: `${projectId}:audit:txt`,
      details: { count: items.length, file: artifact.relativePath }
    });
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-audit-events.txt"`);
    return reply.send(`${text}\n`);
  }

  if (format === 'xlsx') {
    const xlsxPayload = renderAuditEventsXlsx(items);
    const artifact = await writeProjectArtifactBytes({
      projectId,
      area: 'audit',
      label: 'audit-events',
      extension: 'xlsx',
      contents: xlsxPayload
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.audit',
      entityType: 'export',
      entityId: `${projectId}:audit:xlsx`,
      details: { count: items.length, file: artifact.relativePath }
    });
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-audit-events.xlsx"`);
    return reply.send(Buffer.from(xlsxPayload));
  }

  const json = JSON.stringify({ items, total: items.length }, null, 2);
  const artifact = await writeProjectArtifact({
    projectId,
    area: 'audit',
    label: 'audit-events',
    extension: 'json',
    contents: json
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'export.audit',
    entityType: 'export',
    entityId: `${projectId}:audit:json`,
    details: { count: items.length, file: artifact.relativePath }
  });
  reply.header('Content-Type', 'application/json; charset=utf-8');
  reply.header('Content-Disposition', `attachment; filename="${projectId}-audit-events.json"`);
  return reply.send(json);
});

server.get('/backups/project', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectOwner(userId, projectId, reply)) return;
  return ok({ items: await listProjectArtifacts({ projectId, area: 'backups' }) });
});

server.post('/backups/project', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectOwner(userId, projectId, reply)) return;
  const snapshot = await buildProjectBackupSnapshot(projectId);
  const contents = JSON.stringify(snapshot, null, 2);
  const artifact = await writeProjectArtifact({
    projectId,
    area: 'backups',
    label: 'project-backup',
    extension: 'json',
    contents
  });
  const pruned = await pruneProjectArtifacts({ projectId, area: 'backups', maxAgeDays: BACKUP_RETENTION_DAYS });
  await recordAuditEvent({
    request,
    projectId,
    action: 'backup.create',
    entityType: 'backup',
    entityId: artifact.relativePath,
    details: { file: artifact.relativePath, pruned }
  });
  reply.code(201);
  return ok({ backup: artifact, pruned });
});

server.post('/backups/project/restore', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{ projectId: string; relativePath: string; newProjectName: string }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const relativePath = typeof body.relativePath === 'string' ? body.relativePath.trim() : '';
  if (!projectId || !relativePath) {
    return reply.status(400).send(fail('INVALID', 'projectId and relativePath are required.'));
  }
  if (!await assertProjectOwner(userId, projectId, reply)) return;
  const expectedPrefix = `backups/${projectId}/`;
  if (!relativePath.replaceAll('\\', '/').startsWith(expectedPrefix)) {
    return reply.status(400).send(fail('INVALID', 'Backup path must belong to the selected project.'));
  }
  const raw = await readStoredArtifact(relativePath);
  const snapshot = JSON.parse(raw.toString('utf8'));
  const restored = await restoreBackupSnapshot({
    snapshot,
    restoringUserId: userId,
    username: request.session.username ?? 'system',
    requestedName: typeof body.newProjectName === 'string' ? body.newProjectName : undefined
  });
  await recordAuditEvent({
    request,
    projectId: restored.projectId,
    action: 'backup.restore',
    entityType: 'backup',
    entityId: relativePath,
    details: { sourceProjectId: projectId, restoredProjectId: restored.projectId }
  });
  reply.code(201);
  return ok({ restored });
});

server.get('/retrieval', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
    reportTopSources: string;
    reportTopCases: string;
    reportTopCodes: string;
    reportExcerptLimit: string;
    reportIncludeSources: string;
    reportIncludeCases: string;
    reportIncludeExcerpts: string;
    reportSortBy: string;
    styleTemplate: string;
    bundleQueryIds: string;
    bundleLabel: string;
    bundleStyleTemplate: string;
    bundleAppendixMode: string;
    bundleAppendixRowLimit: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined,
    preferredMaxRows: 400
  });
  const retrieval = retrieveEvidence({
    query: evidenceQuery,
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos
  });

  return ok({
    items: retrieval,
    total: retrieval.length,
    aiSummaryPrompt: buildEvidenceSummaryPrompt({
      projectName: payload.project.name,
      retrievalCount: retrieval.length,
      codes: payload.codes.map((code) => code.name),
      analyticQuestion: 'Summarize the coded evidence for this retrieval set.'
    }),
    evidenceCoverage: scoreEvidenceCoverage(retrieval.length),
    axionPrefilter: prefilter
  });
});

server.get('/text-search', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    memoOnly: string;
    searchText: string;
    matchMode: string;
    linguisticMode: string;
    fuzzyDistance: string;
    caseSensitive: string;
    contextWindow: string;
    minHitCount: string;
    maxRows: string;
    codingScope: string;
    snippetLimit: string;
    sortBy: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  if (!(typeof query.searchText === 'string' && query.searchText.trim())) {
    return reply.status(400).send(fail('INVALID', 'searchText is required.'));
  }

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: query.searchText.trim(),
    preferredMaxRows: typeof query.maxRows === 'string' ? Number(query.maxRows) : undefined
  });
  return ok({
    textSearch: buildTextSearch({
      query: evidenceQuery,
      searchText: query.searchText.trim(),
      matchMode: parseTextSearchMode(query.matchMode),
      linguisticMode: parseTextSearchLinguisticMode(query.linguisticMode),
      fuzzyDistance: parsePositiveInteger(query.fuzzyDistance, 1, 1, 3),
      caseSensitive: query.caseSensitive === 'true',
      contextWindow: typeof query.contextWindow === 'string' ? Number(query.contextWindow) : undefined,
      minHitCount: typeof query.minHitCount === 'string' ? Number(query.minHitCount) : undefined,
      maxRows: typeof query.maxRows === 'string' ? Number(query.maxRows) : undefined,
      codingScope: parseTextSearchCodingScope(query.codingScope),
      snippetLimit: typeof query.snippetLimit === 'string' ? Number(query.snippetLimit) : undefined,
      sortBy: parseTextSearchSortBy(query.sortBy),
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos
    }),
    axionPrefilter: prefilter
  });
});

server.get('/word-frequency', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
    topN: string;
    minLength: string;
    excludeStopWords: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined,
    preferredMaxRows: typeof query.topN === 'string' ? Number(query.topN) : undefined
  });
  return ok({
    wordFrequency: buildWordFrequency({
      query: evidenceQuery,
      topN: typeof query.topN === 'string' ? Number(query.topN) : undefined,
      minLength: typeof query.minLength === 'string' ? Number(query.minLength) : undefined,
      excludeStopWords: query.excludeStopWords === undefined ? undefined : query.excludeStopWords === 'true',
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos
    }),
    axionPrefilter: prefilter
  });
});

server.get('/word-cloud', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
    topN: string;
    minLength: string;
    excludeStopWords: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined,
    preferredMaxRows: typeof query.topN === 'string' ? Number(query.topN) : undefined
  });
  return ok({
    wordCloud: buildWordCloud({
      query: evidenceQuery,
      topN: typeof query.topN === 'string' ? Number(query.topN) : undefined,
      minLength: typeof query.minLength === 'string' ? Number(query.minLength) : undefined,
      excludeStopWords: query.excludeStopWords === undefined ? undefined : query.excludeStopWords === 'true',
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos
    }),
    axionPrefilter: prefilter
  });
});

server.get('/map-visualization', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
    mapLocationField: string;
    mapMetric: string;
    mapNormalization: string;
    mapMinCount: string;
    mapMaxPoints: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined
  });
  return ok({
    mapVisualization: buildMapVisualization({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      attributes: payload.attributes,
      options: parseMapVisualizationOptions(query)
    }),
    axionPrefilter: prefilter
  });
});

server.get('/code-hierarchy', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
    reportTopSources: string;
    reportTopCases: string;
    reportTopCodes: string;
    reportExcerptLimit: string;
    reportIncludeSources: string;
    reportIncludeCases: string;
    reportIncludeExcerpts: string;
    reportSortBy: string;
    styleTemplate: string;
    bundleQueryIds: string;
    bundleLabel: string;
    bundleStyleTemplate: string;
    bundleAppendixMode: string;
    bundleAppendixRowLimit: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined
  });
  return ok({
    codeHierarchy: buildCodeHierarchy({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    }),
    axionPrefilter: prefilter
  });
});

server.get('/concept-map', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
    conceptMinLinkWeight: string;
    conceptMaxLinks: string;
    conceptMinNodeSize: string;
    conceptIncludeCooccurrence: string;
    conceptIncludeRelationships: string;
    conceptNodeSizeMode: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined
  });
  const conceptMap = buildConceptMap({
    query: evidenceQuery,
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos,
    codes: payload.codes,
    relationships: payload.relationships,
    options: parseConceptMapOptions(query)
  });
  return ok({
    conceptMap,
    codeClusters: buildCodeClusters({
      conceptMap,
      codes: payload.codes
    }),
    axionPrefilter: prefilter
  });
});

server.get('/sentiment-analysis', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined
  });
  const sentiment = buildSentimentAnalysis({
    query: evidenceQuery,
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos
  });

  return ok({ sentiment, axionPrefilter: prefilter });
});

server.post('/compound-query', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    scope: Partial<{
      sourceId: string;
      sourceKind: string;
      segmentKind: string;
      codeId: string;
      coCodeId: string;
      caseId: string;
      coderId: string;
      searchText: string;
      memoOnly: string;
    }>;
    operator: string;
    caseSensitive: boolean | string;
    maxRows: number | string;
    clauses: unknown[];
    workbench: {
      groupOperator?: 'all' | 'any' | 'none';
      minGroupsMatched?: number | string | null;
      groups?: Array<{
        id?: string;
        label?: string;
        enabled?: boolean;
        operator?: 'all' | 'any' | 'none';
        minClausesMatched?: number | string | null;
        clauses?: unknown[];
      }>;
    };
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const scopeQuery = parseEvidenceQuery(body.scope ?? {});
  const basePayload = await buildQualitativeProjectPayload(projectId);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, scopeQuery, {
    searchTextHint: scopeQuery.searchText
  });
  const caseSensitive = body.caseSensitive === true || body.caseSensitive === 'true';
  const maxRows = parsePositiveInteger(body.maxRows, 200, 1, 1000);
  const workbench = parseCompoundWorkbenchDefinition(body.workbench);
  const flatClauses = parseCompoundQueryClauses(body.clauses);
  if (workbench.groups.length === 0 && flatClauses.length === 0) {
    return reply.status(400).send(fail('INVALID', 'At least one valid compound query clause is required.'));
  }
  const compoundQuery = workbench.groups.length > 0
    ? buildCompoundWorkbenchQuery({
      scopeQuery,
      groupOperator: workbench.groupOperator,
      minGroupsMatched: workbench.minGroupsMatched,
      groups: workbench.groups,
      caseSensitive,
      maxRows,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos
    })
    : buildCompoundQuery({
      scopeQuery,
      operator: parseCompoundOperator(body.operator),
      caseSensitive,
      maxRows,
      clauses: flatClauses,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos
    });
  await recordAuditEvent({
    request,
    projectId,
    action: 'qual_query.compound',
    entityType: 'compound_query',
    entityId: `compound-${randomUUID()}`,
    details: {
      operator: 'operator' in compoundQuery ? (compoundQuery as any).operator : parseCompoundOperator(body.operator),
      clauseCount: Number((compoundQuery as any).clauseCount ?? 0),
      groupCount: Number((compoundQuery as any).groupCount ?? 0),
      minGroupsMatched: (compoundQuery as any).minGroupsMatched ?? null,
      mode: (compoundQuery as any).mode ?? 'flat',
      matchCount: Number((compoundQuery as any).matchCount ?? 0)
    }
  });
  return ok({ compoundQuery, axionPrefilter: prefilter });
});

server.get('/matrix-coding', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined
  });
  return ok({
    matrix: buildMatrixCoding({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    }),
    axionPrefilter: prefilter
  });
});

server.get('/code-by-case', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined
  });
  return ok({
    view: buildCodeByCaseView({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    }),
    axionPrefilter: prefilter
  });
});

server.get('/code-cooccurrence', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined
  });
  return ok({
    cooccurrence: buildCodeCooccurrence({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    }),
    axionPrefilter: prefilter
  });
});

server.get('/matrix-coding-codes', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined
  });
  return ok({
    matrix: buildCodeCodeMatrix({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    }),
    axionPrefilter: prefilter
  });
});

server.get('/query-report', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
    reportTopSources: string;
    reportTopCases: string;
    reportTopCodes: string;
    reportExcerptLimit: string;
    reportIncludeSources: string;
    reportIncludeCases: string;
    reportIncludeExcerpts: string;
    reportSortBy: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined
  });
  return ok({
    report: buildQualitativeQueryReport({
      query: evidenceQuery,
      options: parseQualitativeReportOptions(query),
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    }),
    axionPrefilter: prefilter
  });
});

server.get('/framework-matrix', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined
  });
  return ok({
    frameworkMatrix: buildFrameworkMatrix({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    }),
    axionPrefilter: prefilter
  });
});

server.get('/coding-comparison', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    caseId: string;
    searchText: string;
    memoOnly: string;
    codeId: string;
    coderA: string;
    coderB: string;
    disagreementMode: string;
    disagreementLimit: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  if (!(typeof query.codeId === 'string' && query.codeId.trim())) {
    return reply.status(400).send(fail('INVALID', 'codeId is required.'));
  }

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery({
    sourceId: query.sourceId,
    sourceKind: query.sourceKind,
    segmentKind: query.segmentKind,
    caseId: query.caseId,
    searchText: query.searchText,
    memoOnly: query.memoOnly
  });
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined,
    preferredMaxRows: typeof query.disagreementLimit === 'string' ? Number(query.disagreementLimit) : undefined
  });
  try {
    const disagreementMode = parseCodingDisagreementMode(query.disagreementMode);
    const disagreementLimit = parsePositiveInteger(query.disagreementLimit, 100, 1, 500);
    return ok({
      comparison: applyCodingComparisonFilters(
        buildCodingComparison({
          query: evidenceQuery,
          codeId: query.codeId.trim(),
          coderA: typeof query.coderA === 'string' ? query.coderA : undefined,
          coderB: typeof query.coderB === 'string' ? query.coderB : undefined,
          sources: payload.sources,
          segments: payload.segments,
          applications: payload.codeApplications,
          cases: payload.cases,
          memos: payload.memos,
          codes: payload.codes
        }),
        { disagreementMode, disagreementLimit }
      ),
      axionPrefilter: prefilter
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to compare coding agreement.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.get('/inter-rater-summary', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    caseId: string;
    searchText: string;
    memoOnly: string;
    coderA: string;
    coderB: string;
    minKappa: string;
    maxRows: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery({
    sourceId: query.sourceId,
    sourceKind: query.sourceKind,
    segmentKind: query.segmentKind,
    caseId: query.caseId,
    searchText: query.searchText,
    memoOnly: query.memoOnly
  });
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined,
    preferredMaxRows: typeof query.maxRows === 'string' ? Number(query.maxRows) : undefined
  });
  try {
    const minKappa = parseOptionalBoundedNumber(query.minKappa, -1, 1);
    const maxRows = parseOptionalPositiveInteger(query.maxRows, 1, 500);
    return ok({
      summary: applyInterRaterSummaryFilters(
        buildInterRaterSummary({
          query: evidenceQuery,
          coderA: typeof query.coderA === 'string' ? query.coderA : undefined,
          coderB: typeof query.coderB === 'string' ? query.coderB : undefined,
          sources: payload.sources,
          segments: payload.segments,
          applications: payload.codeApplications,
          cases: payload.cases,
          memos: payload.memos,
          codes: payload.codes
        }),
        { minKappa, maxRows }
      ),
      axionPrefilter: prefilter
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to build the inter-rater summary.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/autocode/keywords', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    codeId: string;
    keywords: string[] | string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    caseId: string;
    searchText: string;
    memoOnly: string | boolean;
    dryRun: boolean;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const codeId = typeof body.codeId === 'string' ? body.codeId.trim() : '';
  if (!codeId) {
    return reply.status(400).send(fail('INVALID', 'codeId is required.'));
  }
  const keywords = Array.isArray(body.keywords)
    ? body.keywords.map((item) => String(item).trim()).filter(Boolean)
    : String(body.keywords ?? '')
      .split(/[\r\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  if (keywords.length === 0) {
    return reply.status(400).send(fail('INVALID', 'At least one keyword is required.'));
  }

  const scopeQuery = parseEvidenceQuery({
    sourceId: body.sourceId,
    sourceKind: body.sourceKind,
    segmentKind: body.segmentKind,
    caseId: body.caseId,
    searchText: body.searchText,
    memoOnly: typeof body.memoOnly === 'boolean' ? String(body.memoOnly) : body.memoOnly
  });
  const basePayload = await buildQualitativeProjectPayload(projectId);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, scopeQuery, {
    searchTextHint: scopeQuery.searchText
  });
  const matches = retrieveEvidence({
    query: {
      ...scopeQuery,
      codeId: undefined,
      coCodeId: undefined,
      coderId: undefined
    },
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos
  });
  const loweredKeywords = keywords.map((item) => item.toLowerCase());
  const existingKeys = new Set(
    payload.codeApplications
      .filter((item) => item.codeId === codeId && item.coderId === (request.session.username ?? 'system'))
      .map((item) => `${item.segmentId}::${item.codeId}::${item.coderId}`)
  );
  const dryRun = body.dryRun === true;

  let createdCount = 0;
  let skippedCount = 0;
  let wouldCreateCount = 0;
  let wouldSkipCount = 0;
  const matchedSegments: Array<{ segmentId: string; sourceId: string; keyword: string; text: string }> = [];
  for (const match of matches) {
    const haystack = match.segment.text.toLowerCase();
    const keyword = loweredKeywords.find((entry) => haystack.includes(entry));
    if (!keyword) continue;
    matchedSegments.push({
      segmentId: match.segment.id,
      sourceId: match.segment.sourceId,
      keyword,
      text: match.segment.text
    });
    const dedupeKey = `${match.segment.id}::${codeId}::${request.session.username ?? 'system'}`;
    if (existingKeys.has(dedupeKey)) {
      skippedCount += 1;
      wouldSkipCount += 1;
      continue;
    }
    wouldCreateCount += 1;
    if (dryRun) {
      continue;
    }
    const created = await insertCodeApplication(createCodeApplication({
      id: `application-${randomUUID()}`,
      projectId,
      segmentId: match.segment.id,
      codeId,
      caseId: null,
      coderId: request.session.username ?? 'system',
      confidence: 0.8
    }));
    existingKeys.add(dedupeKey);
    createdCount += 1;
    await recordAuditEvent({
      request,
      projectId,
      action: 'autocode.keyword',
      entityType: 'code_application',
      entityId: created.id,
      details: { codeId, keyword, segmentId: match.segment.id }
    });
  }
  if (dryRun) {
    await recordAuditEvent({
      request,
      projectId,
      action: 'autocode.keyword.preview',
      entityType: 'autocode_preview',
      entityId: `autocode-preview-${randomUUID()}`,
      details: { codeId, keywordCount: keywords.length, matchedCount: matchedSegments.length, wouldCreateCount, wouldSkipCount }
    });
  }

  return ok({
    autocode: {
      method: 'keyword',
      dryRun,
      codeId,
      keywords,
      scopeCount: matches.length,
      matchedCount: matchedSegments.length,
      createdCount,
      skippedCount,
      wouldCreateCount,
      wouldSkipCount,
      matches: matchedSegments.slice(0, 50)
    },
    axionPrefilter: prefilter
  });
});

server.post('/autocode/patterns', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    codeId: string;
    patterns: string[] | string;
    expandSynonyms: boolean;
    matchMode: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    caseId: string;
    searchText: string;
    memoOnly: string | boolean;
    dryRun: boolean;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const codeId = typeof body.codeId === 'string' ? body.codeId.trim() : '';
  if (!codeId) {
    return reply.status(400).send(fail('INVALID', 'codeId is required.'));
  }

  const patterns = Array.isArray(body.patterns)
    ? body.patterns.map((item) => String(item).trim()).filter(Boolean)
    : String(body.patterns ?? '')
      .split(/[\r\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  if (patterns.length === 0) {
    return reply.status(400).send(fail('INVALID', 'At least one pattern is required.'));
  }

  const scopeQuery = parseEvidenceQuery({
    sourceId: body.sourceId,
    sourceKind: body.sourceKind,
    segmentKind: body.segmentKind,
    caseId: body.caseId,
    searchText: body.searchText,
    memoOnly: typeof body.memoOnly === 'boolean' ? String(body.memoOnly) : body.memoOnly
  });
  const basePayload = await buildQualitativeProjectPayload(projectId);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, scopeQuery, {
    searchTextHint: scopeQuery.searchText
  });
  const autocode = buildPatternAutocode({
    query: scopeQuery,
    patterns,
    expandSynonyms: body.expandSynonyms === true,
    matchMode: parsePatternAutocodeMatchMode(body.matchMode),
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos
  });
  const existingKeys = new Set(
    payload.codeApplications
      .filter((item) => item.codeId === codeId && item.coderId === (request.session.username ?? 'system'))
      .map((item) => `${item.segmentId}::${item.codeId}::${item.coderId}`)
  );
  const dryRun = body.dryRun === true;

  let createdCount = 0;
  let skippedCount = 0;
  let wouldCreateCount = 0;
  let wouldSkipCount = 0;
  for (const hit of autocode.hits) {
    const dedupeKey = `${hit.segmentId}::${codeId}::${request.session.username ?? 'system'}`;
    if (existingKeys.has(dedupeKey)) {
      skippedCount += 1;
      wouldSkipCount += 1;
      continue;
    }
    wouldCreateCount += 1;
    if (dryRun) {
      continue;
    }
    const created = await insertCodeApplication(createCodeApplication({
      id: `application-${randomUUID()}`,
      projectId,
      segmentId: hit.segmentId,
      codeId,
      caseId: null,
      coderId: request.session.username ?? 'system',
      confidence: 0.82
    }));
    existingKeys.add(dedupeKey);
    createdCount += 1;
    await recordAuditEvent({
      request,
      projectId,
      action: 'autocode.pattern',
      entityType: 'code_application',
      entityId: created.id,
      details: {
        codeId,
        pattern: hit.pattern,
        matchMode: autocode.matchMode,
        segmentId: hit.segmentId,
        expandSynonyms: body.expandSynonyms === true
      }
    });
  }
  if (dryRun) {
    await recordAuditEvent({
      request,
      projectId,
      action: 'autocode.pattern.preview',
      entityType: 'autocode_preview',
      entityId: `autocode-preview-${randomUUID()}`,
      details: {
        codeId,
        patternCount: autocode.patterns.length,
        matchedCount: autocode.matchedCount,
        wouldCreateCount,
        wouldSkipCount,
        matchMode: autocode.matchMode
      }
    });
  }

  return ok({
    autocode: {
      method: 'pattern',
      dryRun,
      codeId,
      patterns: autocode.patterns,
      expandedPatterns: autocode.expandedPatterns,
      matchMode: autocode.matchMode,
      scopeCount: autocode.scopeCount,
      matchedCount: autocode.matchedCount,
      createdCount,
      skippedCount,
      wouldCreateCount,
      wouldSkipCount,
      matches: autocode.hits.slice(0, 50)
    },
    axionPrefilter: prefilter
  });
});

server.post('/imports/files', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;

  let projectId = '';
  const uploads: Array<{ filename: string; mimetype: string; buffer: Buffer }> = [];

  for await (const part of request.parts()) {
    if (part.type === 'field' && part.fieldname === 'projectId') {
      projectId = String(part.value ?? '').trim();
      continue;
    }

    if (part.type === 'file') {
      uploads.push({
        filename: part.filename ?? 'upload.bin',
        mimetype: part.mimetype,
        buffer: await part.toBuffer()
      });
    }
  }

  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  if (uploads.length === 0) return reply.status(400).send(fail('INVALID', 'At least one file is required.'));

  const items: Array<Record<string, unknown>> = [];
  const errors: Array<Record<string, unknown>> = [];

  for (const upload of uploads) {
    const mediaUpload = inferMediaUploadSpec(upload.filename, upload.mimetype);
    if (mediaUpload) {
      try {
        const title = path.basename(upload.filename, path.extname(upload.filename)).trim() || 'Imported media';
        const mediaArtifact = await writeProjectArtifactBytes({
          projectId,
          area: 'worker',
          label: `${title}-media`,
          extension: mediaUpload.extension,
          contents: upload.buffer
        });
        const source = createSource({
          id: `source-${randomUUID()}`,
          projectId,
          kind: mediaUpload.sourceKind,
          title,
          language: 'en',
          contentType: mediaUpload.contentType,
          contentUrl: `artifact://${mediaArtifact.relativePath}`,
          contentText: ''
        });
        await insertSource(source);
        items.push({
          filename: upload.filename,
          importedAs: 'media_source',
          sourceId: source.id,
          title: source.title,
          sourceKind: source.kind,
          contentType: source.contentType,
          artifactPath: mediaArtifact.relativePath
        });
      } catch (error) {
        errors.push({
          filename: upload.filename,
          importedAs: 'error',
          message: error instanceof Error ? error.message : 'Unable to import media file.'
        });
      }
      continue;
    }

    let parsed;
    try {
      parsed = await parseImportedFile(upload.filename, upload.mimetype, upload.buffer);
    } catch (error) {
      errors.push({
        filename: upload.filename,
        importedAs: 'error',
        message: error instanceof Error ? error.message : 'Unable to import file.'
      });
      continue;
    }

    if (parsed.kind === 'source') {
      const source = createSource({
        id: `source-${randomUUID()}`,
        projectId,
        kind: parsed.sourceKind,
        title: parsed.title,
        language: 'en',
        contentType: parsed.contentType,
        contentText: parsed.contentText
      });
      await insertSource(source);
      let segmentsCreated = 0;
      for (const segmentDraft of parsed.segments ?? []) {
        const segment = createSegment({
          id: `segment-${randomUUID()}`,
          projectId,
          sourceId: source.id,
          kind: segmentDraft.kind,
          anchor: segmentDraft.anchor,
          text: segmentDraft.text
        });
        await insertSegment(segment);
        segmentsCreated++;
      }
      items.push({
        filename: upload.filename,
        importedAs: 'source',
        sourceId: source.id,
        title: source.title,
        sourceKind: source.kind,
        segmentsCreated
      });
      continue;
    }

    let casesCreated = 0;
    let attributesCreated = 0;

    for (const row of parsed.rows) {
      const caseEntity = createCase({
        id: `case-${randomUUID()}`,
        projectId,
        label: row.caseLabel,
        sourceIds: []
      });
      await insertCase(caseEntity);
      casesCreated++;

      for (const attributeDraft of row.attributes) {
        const attribute = createAttribute({
          id: `attribute-${randomUUID()}`,
          projectId,
          targetType: 'case',
          targetId: caseEntity.id,
          name: attributeDraft.name,
          value: attributeDraft.value
        });
        await insertAttribute(attribute);
        attributesCreated++;
      }
    }

    if (parsed.spssMetadata) {
      await persistImportedSpssMetadata(projectId, parsed.spssMetadata);
    }

    items.push({
      filename: upload.filename,
      importedAs: 'tabular',
      caseLabelField: parsed.caseLabelField,
      sheetName: parsed.sheetName,
      casesCreated,
      attributesCreated,
      spssFormat: parsed.spssMetadata?.format ?? null,
      spssWeightField: parsed.spssMetadata?.weightField ?? null,
      spssSplitFields: parsed.spssMetadata?.splitFields ?? []
    });
  }

  await recordAuditEvent({
    request,
    projectId,
    action: 'import.files',
    entityType: 'import_batch',
    entityId: `import-${randomUUID()}`,
    details: {
      fileCount: uploads.length,
      errorCount: errors.length,
      importedItems: items.map((item) => ({
        filename: item.filename,
        importedAs: item.importedAs
      })),
      failedItems: errors
    }
  });
  if (items.length === 0 && errors.length > 0) {
    return ok({ items: [], errors, importedCount: 0, errorCount: errors.length, total: errors.length });
  }
  reply.code(errors.length > 0 ? 207 : 201);
  return ok({
    items,
    errors,
    importedCount: items.length,
    errorCount: errors.length,
    total: items.length + errors.length
  });
});

server.get('/exports/dataset', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    format: string;
    weightField: string;
    splitFields: string | string[];
  }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId.trim() : undefined;
  const format = query.format === 'json' || query.format === 'xlsx' || query.format === 'sav' || query.format === 'zsav'
    ? query.format
    : 'csv';
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;

  const payload = await buildProjectDatasetPayload(projectId);
  const hasWeightOverride = Object.prototype.hasOwnProperty.call(query, 'weightField');
  const hasSplitOverride = Object.prototype.hasOwnProperty.call(query, 'splitFields');
  const resolvedWeightField = hasWeightOverride
    ? (typeof query.weightField === 'string' && query.weightField.trim() ? query.weightField.trim() : null)
    : payload.spssMetadata.settings.weightField;
  const resolvedSplitFields = hasSplitOverride
    ? parseStringArray(query.splitFields)
    : payload.spssMetadata.settings.splitFields;
  if (format === 'json') {
    const jsonPayload = JSON.stringify(payload, null, 2);
    await writeProjectArtifact({
      projectId,
      area: 'exports',
      label: 'dataset-export',
      extension: 'json',
      contents: jsonPayload
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.dataset',
      entityType: 'export',
      entityId: `${projectId}:dataset:json`,
      details: { format: 'json', caseCount: payload.report.caseCount }
    });
    reply.header('Content-Type', 'application/json; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-dataset.json"`);
    return reply.send(jsonPayload);
  }

  if (format === 'xlsx') {
    const xlsxPayload = renderDatasetXlsx({
      projectId,
      rows: payload.dataset.rows,
      report: payload.report
    });
    await writeProjectArtifactBytes({
      projectId,
      area: 'exports',
      label: 'dataset-export',
      extension: 'xlsx',
      contents: xlsxPayload
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.dataset',
      entityType: 'export',
      entityId: `${projectId}:dataset:xlsx`,
      details: { format: 'xlsx', caseCount: payload.report.caseCount }
    });
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-dataset.xlsx"`);
    return reply.send(Buffer.from(xlsxPayload));
  }

  if (format === 'sav' || format === 'zsav') {
    const spssPayload = await writeSpssBuffer(buildSpssExportInput(payload, format, {
      weightField: resolvedWeightField,
      splitFields: resolvedSplitFields
    }));
    await writeProjectArtifactBytes({
      projectId,
      area: 'exports',
      label: 'dataset-export',
      extension: format,
      contents: spssPayload
    });
    if (hasWeightOverride || hasSplitOverride) {
      await upsertProjectDatasetSettings({
        projectId,
        weightField: resolvedWeightField,
        splitFieldsJson: JSON.stringify(resolvedSplitFields),
        updatedAt: new Date().toISOString()
      });
    }
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.dataset',
      entityType: 'export',
      entityId: `${projectId}:dataset:${format}`,
      details: {
        format,
        caseCount: payload.report.caseCount,
        weightField: resolvedWeightField,
        splitFields: resolvedSplitFields
      }
    });
    reply.header('Content-Type', format === 'zsav' ? 'application/x-spss-zsav' : 'application/x-spss-sav');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-dataset.${format}"`);
    return reply.send(spssPayload);
  }

  const csvPayload = serializeDatasetToCsv(payload.dataset.rows);
  await writeProjectArtifact({
    projectId,
    area: 'exports',
    label: 'dataset-export',
    extension: 'csv',
    contents: csvPayload
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'export.dataset',
    entityType: 'export',
    entityId: `${projectId}:dataset:csv`,
    details: { format: 'csv', caseCount: payload.report.caseCount }
  });
  reply.header('Content-Type', 'text/csv; charset=utf-8');
  reply.header('Content-Disposition', `attachment; filename="${projectId}-dataset.csv"`);
  return reply.send(csvPayload);
});

server.get('/exports/evidence', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    format: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    searchText: string;
    memoOnly: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;

  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined,
    preferredMaxRows: 1200
  });
  const retrieval = retrieveEvidence({
    query: evidenceQuery,
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos
  });
  const evidenceBundleBase = buildEvidenceExport({
    project: { id: payload.project.id, name: payload.project.name },
    retrieval,
    codes: payload.codes
  });
  const evidenceBundle = enrichEvidenceBundleWithContext({
    bundle: evidenceBundleBase,
    segments: payload.segments,
    sources: payload.sources,
    transcriptSyncLinks: payload.transcriptSyncLinks
  });
  const filters = formatEvidenceFilterLabels(evidenceQuery);
  const report = buildEvidenceReport(evidenceBundle, filters);
  const format = query.format === 'docx' || query.format === 'pdf' || query.format === 'txt' || query.format === 'xlsx' ? query.format : 'json';

  if (format === 'docx') {
    const docxPayload = await renderEvidenceReportDocx(report);
    const artifact = await writeProjectArtifactBytes({
      projectId,
      area: 'exports',
      label: 'evidence-report',
      extension: 'docx',
      contents: docxPayload
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.evidence',
      entityType: 'export',
      entityId: `${projectId}:evidence:docx`,
      details: { matches: retrieval.length, file: artifact.relativePath, format: 'docx', axionPrefilter: prefilter }
    });
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-evidence-report.docx"`);
    return reply.send(Buffer.from(docxPayload));
  }

  if (format === 'pdf') {
    const pdfPayload = await renderEvidenceReportPdf(report);
    const artifact = await writeProjectArtifactBytes({
      projectId,
      area: 'exports',
      label: 'evidence-report',
      extension: 'pdf',
      contents: pdfPayload
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.evidence',
      entityType: 'export',
      entityId: `${projectId}:evidence:pdf`,
      details: { matches: retrieval.length, file: artifact.relativePath, format: 'pdf', axionPrefilter: prefilter }
    });
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-evidence-report.pdf"`);
    return reply.send(pdfPayload);
  }

  if (format === 'xlsx') {
    const xlsxPayload = renderEvidenceReportXlsx(report);
    const artifact = await writeProjectArtifactBytes({
      projectId,
      area: 'exports',
      label: 'evidence-report',
      extension: 'xlsx',
      contents: xlsxPayload
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.evidence',
      entityType: 'export',
      entityId: `${projectId}:evidence:xlsx`,
      details: { matches: retrieval.length, file: artifact.relativePath, format: 'xlsx', axionPrefilter: prefilter }
    });
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-evidence-report.xlsx"`);
    return reply.send(Buffer.from(xlsxPayload));
  }

  if (format === 'txt') {
    const textPayload = renderEvidenceReportText(report);
    const artifact = await writeProjectArtifact({
      projectId,
      area: 'exports',
      label: 'evidence-report',
      extension: 'txt',
      contents: textPayload
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.evidence',
      entityType: 'export',
      entityId: `${projectId}:evidence:txt`,
      details: { matches: retrieval.length, file: artifact.relativePath, format: 'txt', axionPrefilter: prefilter }
    });
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-evidence-report.txt"`);
    return reply.send(textPayload);
  }

  const jsonPayload = JSON.stringify({ bundle: evidenceBundle, report }, null, 2);
  const artifact = await writeProjectArtifact({
    projectId,
    area: 'exports',
    label: 'evidence-export',
    extension: 'json',
    contents: jsonPayload
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'export.evidence',
    entityType: 'export',
    entityId: `${projectId}:evidence:json`,
    details: { matches: retrieval.length, file: artifact.relativePath, format: 'json', axionPrefilter: prefilter }
  });
  reply.header('Content-Type', 'application/json; charset=utf-8');
  reply.header('Content-Disposition', `attachment; filename="${projectId}-evidence.json"`);
  return reply.send(jsonPayload);
});

// ── Sources ───────────────────────────────────────────────────────────────────

server.get('/exports/reports', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    kind: string;
    format: string;
    compoundWorkbench: string;
    compoundCaseSensitive: string;
    compoundMaxRows: string;
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    coderA: string;
    coderB: string;
    disagreementMode: string;
    disagreementLimit: string;
    minKappa: string;
    maxRows: string;
    minCoderCount: string;
    minConfidenceSpread: string;
    searchText: string;
    memoOnly: string;
    reportTopSources: string;
    reportTopCases: string;
    reportTopCodes: string;
    reportExcerptLimit: string;
    reportIncludeSources: string;
    reportIncludeCases: string;
    reportIncludeExcerpts: string;
    reportSortBy: string;
    styleTemplate: string;
    bundleQueryIds: string;
    bundleLabel: string;
    bundleStyleTemplate: string;
    bundleAppendixMode: string;
    bundleAppendixRowLimit: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;

  const kind = query.kind === 'codebook'
    || query.kind === 'case-summaries'
    || query.kind === 'appendix'
    || query.kind === 'matrix-code-case'
    || query.kind === 'framework-matrix'
    || query.kind === 'matrix-code-code'
    || query.kind === 'cooccurrence'
    || query.kind === 'coding-comparison'
    || query.kind === 'inter-rater-summary'
    || query.kind === 'merge-review'
    || query.kind === 'query-report'
    || query.kind === 'compound-workbench'
    || query.kind === 'committee-review-pack'
    || query.kind === 'chat-history'
    ? query.kind
    : null;
  if (!kind) {
    return reply.status(400).send(fail('INVALID', 'Unsupported report kind.'));
  }
  if (kind === 'coding-comparison' && !(typeof query.codeId === 'string' && query.codeId.trim())) {
    return reply.status(400).send(fail('INVALID', 'codeId is required for coding comparison reports.'));
  }

  const format = query.format === 'docx' || query.format === 'pdf' || query.format === 'txt' || query.format === 'xlsx' ? query.format : 'json';
  const basePayload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const { payload, prefilter } = await applyAxionPrefilterToQualitativePayload(basePayload, evidenceQuery, {
    searchTextHint: typeof query.searchText === 'string' ? query.searchText : undefined,
    preferredMaxRows: typeof query.maxRows === 'string' ? Number(query.maxRows) : 1400
  });
  const retrieval = retrieveEvidence({
    query: evidenceQuery,
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos
  });
  const evidenceBundleBase = buildEvidenceExport({
    project: {
      id: payload.project.id,
      name: payload.project.name
    },
    retrieval,
    codes: payload.codes
  });
  const evidenceBundle = enrichEvidenceBundleWithContext({
    bundle: evidenceBundleBase,
    segments: payload.segments,
    sources: payload.sources,
    transcriptSyncLinks: payload.transcriptSyncLinks
  });
  const disagreementMode = parseCodingDisagreementMode(query.disagreementMode);
  const disagreementLimit = parsePositiveInteger(query.disagreementLimit, 100, 1, 500);
  const minKappa = parseOptionalBoundedNumber(query.minKappa, -1, 1);
  const maxRows = parseOptionalPositiveInteger(query.maxRows, 1, 500);
  const mergeMinCoderCount = parsePositiveInteger(query.minCoderCount, 2, 1, 20);
  const mergeMinConfidenceSpread = parseOptionalBoundedNumber(query.minConfidenceSpread, 0, 1) ?? 0.2;
  const mergeMaxRows = parsePositiveInteger(query.maxRows, 100, 1, 500);
  const reportOptions = parseQualitativeReportOptions(query);
  const reportStyleTemplate = parseStructuredReportStyleTemplate(query.styleTemplate);
  const committeeBundleStyleTemplate = parseStructuredReportStyleTemplate(query.bundleStyleTemplate);
  const committeeBundleAppendixMode = parseCommitteeAppendixMode(query.bundleAppendixMode);
  const committeeBundleAppendixRowLimit = parsePositiveInteger(query.bundleAppendixRowLimit, 250, 25, 2000);
  const committeeBundleQueryIds = parseStringArray(query.bundleQueryIds).slice(0, 50);
  const committeeBundleLabel = typeof query.bundleLabel === 'string' && query.bundleLabel.trim()
    ? query.bundleLabel.trim()
    : undefined;
  const queryLabels = formatEvidenceFilterLabels(evidenceQuery);
  if (kind === 'coding-comparison') {
    if (disagreementMode !== 'all') queryLabels.push(`Disagreement mode: ${disagreementMode}`);
    if (disagreementLimit > 0) queryLabels.push(`Disagreement limit: ${disagreementLimit}`);
  }
  if (kind === 'inter-rater-summary') {
    if (minKappa !== null) queryLabels.push(`Kappa threshold <= ${minKappa.toFixed(4)}`);
    if (maxRows !== null) queryLabels.push(`Max rows: ${maxRows}`);
  }
  if (kind === 'merge-review') {
    queryLabels.push(`Merge min coder count: ${mergeMinCoderCount}`);
    queryLabels.push(`Merge min confidence spread: ${mergeMinConfidenceSpread.toFixed(3)}`);
    queryLabels.push(`Merge max rows: ${mergeMaxRows}`);
  }
  if (kind === 'query-report') {
    queryLabels.push(`Report sort: ${reportOptions.sortBy}`);
    queryLabels.push(`Top sources: ${reportOptions.topSources}`);
    queryLabels.push(`Top cases: ${reportOptions.topCases}`);
    queryLabels.push(`Top codes: ${reportOptions.topCodes}`);
    queryLabels.push(`Excerpts: ${reportOptions.includeExcerptRows ? `yes (${reportOptions.excerptLimit})` : 'no'}`);
  }
  const compoundCaseSensitive = query.compoundCaseSensitive === 'true';
  const compoundMaxRows = parsePositiveInteger(query.compoundMaxRows, 250, 1, 1000);
  let compoundWorkbenchResult: ReturnType<typeof buildCompoundWorkbenchQuery> | null = null;
  if (kind === 'compound-workbench') {
    const rawWorkbench = typeof query.compoundWorkbench === 'string' ? query.compoundWorkbench.trim() : '';
    if (!rawWorkbench) {
      return reply.status(400).send(fail('INVALID', 'compoundWorkbench is required for compound-workbench exports.'));
    }
    let workbenchParsed: ReturnType<typeof parseCompoundWorkbenchDefinition>;
    try {
      workbenchParsed = parseCompoundWorkbenchDefinition(JSON.parse(rawWorkbench));
    } catch (error) {
      return reply.status(400).send(fail('INVALID', `compoundWorkbench must be valid JSON (${error instanceof Error ? error.message : 'parse failed'}).`));
    }
    if (workbenchParsed.groups.length === 0) {
      return reply.status(400).send(fail('INVALID', 'compoundWorkbench must include at least one enabled group with valid clauses.'));
    }
    compoundWorkbenchResult = buildCompoundWorkbenchQuery({
      scopeQuery: evidenceQuery,
      groupOperator: workbenchParsed.groupOperator,
      minGroupsMatched: workbenchParsed.minGroupsMatched,
      groups: workbenchParsed.groups,
      caseSensitive: compoundCaseSensitive,
      maxRows: compoundMaxRows,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos
    });
    queryLabels.push(`Workbench group operator: ${workbenchParsed.groupOperator}`);
    if (workbenchParsed.minGroupsMatched !== null) {
      queryLabels.push(`Workbench min groups matched: ${workbenchParsed.minGroupsMatched}`);
    }
    const perGroupThresholds = workbenchParsed.groups
      .filter((group) => group.minClausesMatched !== null)
      .map((group) => `${group.label}>=${group.minClausesMatched}`);
    if (perGroupThresholds.length > 0) {
      queryLabels.push(`Workbench clause thresholds: ${perGroupThresholds.join(', ')}`);
    }
    queryLabels.push(`Workbench groups: ${compoundWorkbenchResult.groupCount}`);
    queryLabels.push(`Workbench clauses: ${compoundWorkbenchResult.clauseCount}`);
    queryLabels.push(`Workbench case-sensitive: ${compoundCaseSensitive ? 'yes' : 'no'}`);
    queryLabels.push(`Workbench max rows: ${compoundMaxRows}`);
  }
  const evidenceReport = buildEvidenceReport(evidenceBundle, queryLabels);
  const report = kind === 'codebook'
    ? buildProjectCodebookReport({
      project: payload.project,
      codes: payload.codes,
      applications: payload.codeApplications,
      memos: payload.memos
    })
    : kind === 'case-summaries'
      ? buildCaseSummariesReport({
        project: payload.project,
        cases: payload.cases,
        attributes: payload.attributes,
        sources: payload.sources,
        segments: payload.segments,
        codes: payload.codes,
        applications: payload.codeApplications,
        memos: payload.memos
      })
      : kind === 'appendix'
        ? buildAppendixReport({ report: evidenceReport })
        : kind === 'matrix-code-case'
          ? buildMatrixCodingReport({
            project: payload.project,
            queryLabels,
            matrix: buildMatrixCoding({
              query: evidenceQuery,
              sources: payload.sources,
              segments: payload.segments,
              applications: payload.codeApplications,
              cases: payload.cases,
              memos: payload.memos,
              codes: payload.codes
            })
          })
          : kind === 'framework-matrix'
            ? buildFrameworkMatrixSummaryReport({
              project: payload.project,
              queryLabels,
              annotations: payload.annotations,
              matrix: buildFrameworkMatrix({
                query: evidenceQuery,
                sources: payload.sources,
                segments: payload.segments,
                applications: payload.codeApplications,
                cases: payload.cases,
                memos: payload.memos,
                codes: payload.codes
              })
            })
          : kind === 'matrix-code-code'
            ? buildCodeCodeMatrixReport({
              project: payload.project,
              queryLabels,
              matrix: buildCodeCodeMatrix({
                query: evidenceQuery,
                sources: payload.sources,
                segments: payload.segments,
                applications: payload.codeApplications,
                cases: payload.cases,
                memos: payload.memos,
                codes: payload.codes
              })
            })
            : kind === 'cooccurrence'
              ? buildCodeCooccurrenceReport({
                project: payload.project,
                queryLabels,
                cooccurrence: buildCodeCooccurrence({
                  query: evidenceQuery,
                  sources: payload.sources,
                  segments: payload.segments,
                  applications: payload.codeApplications,
                  cases: payload.cases,
                  memos: payload.memos,
                  codes: payload.codes
                })
              })
            : kind === 'coding-comparison'
              ? buildCodingComparisonReport({
                project: payload.project,
                queryLabels,
                comparison: applyCodingComparisonFilters(
                  buildCodingComparison({
                    query: evidenceQuery,
                    codeId: typeof query.codeId === 'string' ? query.codeId.trim() : '',
                    coderA: typeof query.coderA === 'string' ? query.coderA : undefined,
                    coderB: typeof query.coderB === 'string' ? query.coderB : undefined,
                    sources: payload.sources,
                    segments: payload.segments,
                    applications: payload.codeApplications,
                    cases: payload.cases,
                    memos: payload.memos,
                    codes: payload.codes
                  }),
                  { disagreementMode, disagreementLimit }
                )
              })
              : kind === 'inter-rater-summary'
                ? buildInterRaterSummaryReport({
                  project: payload.project,
                  queryLabels,
                  summary: applyInterRaterSummaryFilters(
                    buildInterRaterSummary({
                      query: evidenceQuery,
                      coderA: typeof query.coderA === 'string' ? query.coderA : undefined,
                      coderB: typeof query.coderB === 'string' ? query.coderB : undefined,
                      sources: payload.sources,
                      segments: payload.segments,
                      applications: payload.codeApplications,
                      cases: payload.cases,
                      memos: payload.memos,
                      codes: payload.codes
                    }),
                    { minKappa, maxRows }
                  )
                })
              : kind === 'query-report'
                ? buildQualitativeQuerySummaryReport({
                  project: payload.project,
                  queryLabels,
                  report: buildQualitativeQueryReport({
                    query: evidenceQuery,
                    options: reportOptions,
                    sources: payload.sources,
                    segments: payload.segments,
                    applications: payload.codeApplications,
                    cases: payload.cases,
                    memos: payload.memos,
                    codes: payload.codes
                  })
                })
                : kind === 'compound-workbench'
                  ? buildCompoundWorkbenchReport({
                    project: payload.project,
                    queryLabels,
                    result: compoundWorkbenchResult!
                  })
                : kind === 'merge-review'
                  ? buildMergeReviewReport({
                    project: payload.project,
                    queryLabels,
                    review: buildMergeReview({
                      projectId,
                      sourceId: evidenceQuery.sourceId,
                      codeId: evidenceQuery.codeId,
                      minCoderCount: mergeMinCoderCount,
                      minConfidenceSpread: mergeMinConfidenceSpread,
                      maxRows: mergeMaxRows,
                      segments: payload.segments,
                      sources: payload.sources,
                      applications: payload.codeApplications,
                      codes: payload.codes
                    })
                  })
                : kind === 'committee-review-pack'
                  ? await buildCommitteeReviewPack({
                    projectId,
                    payload,
                    bundleLabel: committeeBundleLabel,
                    bundleQueryIds: committeeBundleQueryIds,
                    styleTemplate: committeeBundleStyleTemplate,
                    appendixMode: committeeBundleAppendixMode,
                    appendixRowLimit: committeeBundleAppendixRowLimit
                  })
                : buildChatHistoryReport({
                  project: payload.project,
                  messages: await listProjectMessages(projectId, 1000)
                });

  const baseFileName = `${projectId}-${kind}`;
  const effectiveStyleTemplate = kind === 'committee-review-pack'
    ? committeeBundleStyleTemplate
    : reportStyleTemplate;

  if (format === 'docx') {
    const docxPayload = await renderStructuredReportDocx(report, { styleTemplate: effectiveStyleTemplate });
    const artifact = await writeProjectArtifactBytes({
      projectId,
      area: 'exports',
      label: kind,
      extension: 'docx',
      contents: docxPayload
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.report',
      entityType: 'export',
      entityId: `${projectId}:${kind}:docx`,
      details: { kind, format: 'docx', file: artifact.relativePath, axionPrefilter: prefilter }
    });
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    reply.header('Content-Disposition', `attachment; filename="${baseFileName}.docx"`);
    return reply.send(Buffer.from(docxPayload));
  }

  if (format === 'pdf') {
    const pdfPayload = await renderStructuredReportPdf(report, { styleTemplate: effectiveStyleTemplate });
    const artifact = await writeProjectArtifactBytes({
      projectId,
      area: 'exports',
      label: kind,
      extension: 'pdf',
      contents: pdfPayload
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.report',
      entityType: 'export',
      entityId: `${projectId}:${kind}:pdf`,
      details: { kind, format: 'pdf', file: artifact.relativePath, axionPrefilter: prefilter }
    });
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="${baseFileName}.pdf"`);
    return reply.send(pdfPayload);
  }

  if (format === 'xlsx') {
    const xlsxPayload = renderStructuredReportXlsx(report);
    const artifact = await writeProjectArtifactBytes({
      projectId,
      area: 'exports',
      label: kind,
      extension: 'xlsx',
      contents: xlsxPayload
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.report',
      entityType: 'export',
      entityId: `${projectId}:${kind}:xlsx`,
      details: { kind, format: 'xlsx', file: artifact.relativePath, axionPrefilter: prefilter }
    });
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', `attachment; filename="${baseFileName}.xlsx"`);
    return reply.send(Buffer.from(xlsxPayload));
  }

  if (format === 'txt') {
    const textPayload = renderStructuredReportText(report);
    const artifact = await writeProjectArtifact({
      projectId,
      area: 'exports',
      label: kind,
      extension: 'txt',
      contents: textPayload
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'export.report',
      entityType: 'export',
      entityId: `${projectId}:${kind}:txt`,
      details: { kind, format: 'txt', file: artifact.relativePath, axionPrefilter: prefilter }
    });
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${baseFileName}.txt"`);
    return reply.send(textPayload);
  }

  const jsonPayload = JSON.stringify({ kind, report }, null, 2);
  const artifact = await writeProjectArtifact({
    projectId,
    area: 'exports',
    label: kind,
    extension: 'json',
    contents: jsonPayload
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'export.report',
    entityType: 'export',
    entityId: `${projectId}:${kind}:json`,
    details: { kind, format: 'json', file: artifact.relativePath, axionPrefilter: prefilter }
  });
  reply.header('Content-Type', 'application/json; charset=utf-8');
  reply.header('Content-Disposition', `attachment; filename="${baseFileName}.json"`);
  return reply.send(jsonPayload);
});

server.get('/sources', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listSources(projectId);
  return ok({ items, total: items.length });
});

server.get('/sources/:sourceId/media', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { sourceId } = request.params as { sourceId: string };
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const source = (await listSources(projectId)).find((entry) => entry.id === sourceId);
  if (!source) {
    return reply.status(404).send(fail('NOT_FOUND', 'Source not found.'));
  }
  if (!(source.kind === 'audio' || source.kind === 'video')) {
    return reply.status(400).send(fail('INVALID', 'The selected source is not an audio/video source.'));
  }
  const contentUrl = source.contentUrl?.trim() || '';
  if (!contentUrl) {
    return reply.status(404).send(fail('NOT_FOUND', 'This media source does not have a file URL.'));
  }
  if (/^https?:\/\//i.test(contentUrl)) {
    reply.redirect(contentUrl);
    return;
  }

  const media = await resolveMediaSourceBytes({
    id: source.id,
    title: source.title,
    contentType: source.contentType,
    contentUrl: source.contentUrl
  });
  const totalBytes = media.bytes.length;
  const rangeHeader = typeof request.headers.range === 'string' ? request.headers.range : '';
  const rangeMatch = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  const filename = inferFilenameFromSource(source);
  reply.header('Accept-Ranges', 'bytes');
  reply.header('Content-Type', media.contentType || inferContentTypeFromFilename(filename));
  reply.header('Content-Disposition', `inline; filename="${filename.replace(/"/g, '')}"`);

  if (rangeMatch) {
    const start = rangeMatch[1] ? Number.parseInt(rangeMatch[1], 10) : 0;
    const end = rangeMatch[2] ? Number.parseInt(rangeMatch[2], 10) : (totalBytes - 1);
    const safeStart = Math.max(0, Math.min(totalBytes - 1, Number.isFinite(start) ? start : 0));
    const safeEnd = Math.max(safeStart, Math.min(totalBytes - 1, Number.isFinite(end) ? end : totalBytes - 1));
    const chunk = media.bytes.subarray(safeStart, safeEnd + 1);
    reply.code(206);
    reply.header('Content-Range', `bytes ${safeStart}-${safeEnd}/${totalBytes}`);
    reply.header('Content-Length', String(chunk.length));
    return reply.send(chunk);
  }

  reply.header('Content-Length', String(totalBytes));
  return reply.send(media.bytes);
});

server.post('/sources', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    id: string;
    projectId: string;
    kind: string;
    title: string;
    language: string;
    contentType: string;
    contentUrl: string | null;
    contentText: string;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const source = createSource({
    id: typeof body.id === 'string' && body.id.trim() ? body.id : `source-${randomUUID()}`,
    projectId, kind: parseSourceKind(body.kind),
    title: typeof body.title === 'string' ? body.title : '',
    language: typeof body.language === 'string' ? body.language : 'en',
    contentType: typeof body.contentType === 'string' ? body.contentType : 'text/plain',
    contentUrl: typeof body.contentUrl === 'string' && body.contentUrl.trim() ? body.contentUrl.trim() : null,
    contentText: typeof body.contentText === 'string' ? body.contentText : ''
  });
  const created = await insertSource(source);
  await recordAuditEvent({
    request,
    projectId,
    action: 'source.create',
    entityType: 'source',
    entityId: created.id,
    details: { kind: created.kind, title: created.title }
  });
  reply.code(201);
  return ok({ source: created });
});

// ── Codes ─────────────────────────────────────────────────────────────────────

server.get('/codes', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listCodes(projectId);
  return ok({ items, total: items.length });
});

server.post('/codes', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{ id: string; projectId: string; name: string; description: string; parentCodeId: string | null; colorToken: string }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const code = createCode({
    id: typeof body.id === 'string' && body.id.trim() ? body.id : `code-${randomUUID()}`,
    projectId, name: typeof body.name === 'string' ? body.name : '',
    description: typeof body.description === 'string' ? body.description : '',
    parentCodeId: typeof body.parentCodeId === 'string' && body.parentCodeId.trim() ? body.parentCodeId : null,
    colorToken: typeof body.colorToken === 'string' && body.colorToken.trim() ? body.colorToken : 'blue'
  });
  const created = await insertCode(code);
  await recordAuditEvent({
    request,
    projectId,
    action: 'code.create',
    entityType: 'code',
    entityId: created.id,
    details: { name: created.name, parentCodeId: created.parentCodeId }
  });
  reply.code(201);
  return ok({ code: created });
});

// ── Variables ─────────────────────────────────────────────────────────────────

server.get('/variables', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listVariables(projectId);
  return ok({ items, total: items.length });
});

server.post('/variables', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{ id: string; projectId: string; name: string; label: string; kind: string; sourceKind: string; derivedFromCodeId: string | null; derivationRule: string }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const variable = createVariable({
    id: typeof body.id === 'string' && body.id.trim() ? body.id : `variable-${randomUUID()}`,
    projectId, name: typeof body.name === 'string' ? body.name : '',
    label: typeof body.label === 'string' ? body.label : '',
    kind: parseVariableKind(body.kind),
    sourceKind: parseAnalysisKind(body.sourceKind),
    derivedFromCodeId: typeof body.derivedFromCodeId === 'string' && body.derivedFromCodeId.trim() ? body.derivedFromCodeId : null,
    derivationRule: body.derivationRule === 'count' || body.derivationRule === 'intensity' ? body.derivationRule : 'presence'
  });
  const derivedFromCodeId = typeof body.derivedFromCodeId === 'string' && body.derivedFromCodeId.trim()
    ? body.derivedFromCodeId : null;
  const created = await insertVariable(variable, derivedFromCodeId);
  await recordAuditEvent({
    request,
    projectId,
    action: 'variable.create',
    entityType: 'variable',
    entityId: created.id,
    details: {
      name: created.name,
      kind: created.kind,
      sourceKind: created.sourceKind,
      derivedFromCodeId: created.derivedFromCodeId,
      derivationRule: created.derivationRule
    }
  });
  reply.code(201);
  return ok({ variable: created });
});

// ── Cases ─────────────────────────────────────────────────────────────────────

server.get('/cases', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listCases(projectId);
  return ok({ items, total: items.length });
});

server.post('/cases', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{ id: string; projectId: string; label: string; sourceIds: string[] }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const c = createCase({
    id: typeof body.id === 'string' && body.id.trim() ? body.id : `case-${randomUUID()}`,
    projectId, label: typeof body.label === 'string' ? body.label : '',
    sourceIds: Array.isArray(body.sourceIds) ? body.sourceIds.filter((s) => typeof s === 'string') : []
  });
  const created = await insertCase(c);
  await recordAuditEvent({
    request,
    projectId,
    action: 'case.create',
    entityType: 'case',
    entityId: created.id,
    details: { label: created.label, sourceIds: created.sourceIds }
  });
  reply.code(201);
  return ok({ case: created });
});

// ── Memos ─────────────────────────────────────────────────────────────────────

server.get('/memos', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listMemos(projectId);
  return ok({ items, total: items.length });
});

server.post('/memos', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    id: string;
    projectId: string;
    targetType: string;
    targetId: string;
    title: string;
    body: string;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const memo = createMemo({
    id: typeof body.id === 'string' && body.id.trim() ? body.id : `memo-${randomUUID()}`,
    projectId,
    targetType: parseMemoTargetType(body.targetType),
    targetId: typeof body.targetId === 'string' && body.targetId.trim() ? body.targetId : projectId,
    title: typeof body.title === 'string' ? body.title : '',
    body: typeof body.body === 'string' ? body.body : ''
  });
  const created = await insertMemo(memo);
  await recordAuditEvent({
    request,
    projectId,
    action: 'memo.create',
    entityType: 'memo',
    entityId: created.id,
    details: { targetType: created.targetType, targetId: created.targetId, title: created.title }
  });
  reply.code(201);
  return ok({ memo: created });
});

// ── Annotations ───────────────────────────────────────────────────────────────

server.get('/annotations', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listAnnotations(projectId);
  return ok({ items, total: items.length });
});

server.post('/annotations', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    id: string;
    projectId: string;
    targetType: string;
    targetId: string;
    quoteText: string;
    note: string;
    startOffset: number | null;
    endOffset: number | null;
    colorToken: string;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const annotation = createAnnotation({
    id: typeof body.id === 'string' && body.id.trim() ? body.id : `annotation-${randomUUID()}`,
    projectId,
    targetType: parseAnnotationTargetType(body.targetType),
    targetId: typeof body.targetId === 'string' && body.targetId.trim() ? body.targetId : projectId,
    quoteText: typeof body.quoteText === 'string' ? body.quoteText : '',
    note: typeof body.note === 'string' ? body.note : '',
    startOffset: typeof body.startOffset === 'number' ? body.startOffset : null,
    endOffset: typeof body.endOffset === 'number' ? body.endOffset : null,
    colorToken: typeof body.colorToken === 'string' && body.colorToken.trim() ? body.colorToken : 'amber'
  });
  const created = await insertAnnotation(annotation);
  await recordAuditEvent({
    request,
    projectId,
    action: 'annotation.create',
    entityType: 'annotation',
    entityId: created.id,
    details: {
      targetType: created.targetType,
      targetId: created.targetId,
      colorToken: created.colorToken,
      startOffset: created.startOffset,
      endOffset: created.endOffset
    }
  });
  reply.code(201);
  return ok({ annotation: created });
});

server.put('/annotations/:annotationId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ annotationId: string }>;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    targetType: string;
    targetId: string;
    quoteText: string;
    note: string;
    startOffset: number | null;
    endOffset: number | null;
    colorToken: string;
  }>;
  const annotationId = typeof params.annotationId === 'string' ? params.annotationId.trim() : '';
  if (!annotationId) return reply.status(400).send(fail('INVALID', 'annotationId is required.'));
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const existing = (await listAnnotations(projectId)).find((item) => item.id === annotationId);
  if (!existing) return reply.status(404).send(fail('NOT_FOUND', 'Annotation not found.'));

  const updated = createAnnotation({
    ...existing,
    targetType: body.targetType === undefined ? existing.targetType : parseAnnotationTargetType(body.targetType),
    targetId: typeof body.targetId === 'string' && body.targetId.trim() ? body.targetId.trim() : existing.targetId,
    quoteText: body.quoteText === undefined ? existing.quoteText : String(body.quoteText ?? ''),
    note: body.note === undefined ? existing.note : String(body.note ?? ''),
    startOffset: body.startOffset === undefined
      ? existing.startOffset
      : (typeof body.startOffset === 'number' ? Math.max(0, Math.floor(body.startOffset)) : null),
    endOffset: body.endOffset === undefined
      ? existing.endOffset
      : (typeof body.endOffset === 'number' ? Math.max(0, Math.floor(body.endOffset)) : null),
    colorToken: typeof body.colorToken === 'string' && body.colorToken.trim() ? body.colorToken.trim() : existing.colorToken,
    updatedAt: new Date().toISOString()
  });
  const saved = await updateAnnotation(updated);
  if (!saved) return reply.status(404).send(fail('NOT_FOUND', 'Annotation not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'annotation.update',
    entityType: 'annotation',
    entityId: saved.id,
    details: {
      targetType: saved.targetType,
      targetId: saved.targetId,
      colorToken: saved.colorToken,
      startOffset: saved.startOffset,
      endOffset: saved.endOffset
    }
  });
  return ok({ annotation: saved });
});

server.delete('/annotations/:annotationId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ annotationId: string }>;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const annotationId = typeof params.annotationId === 'string' ? params.annotationId.trim() : '';
  if (!annotationId) return reply.status(400).send(fail('INVALID', 'annotationId is required.'));
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const removed = await deleteAnnotation(annotationId, projectId);
  if (!removed) return reply.status(404).send(fail('NOT_FOUND', 'Annotation not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'annotation.delete',
    entityType: 'annotation',
    entityId: annotationId,
    details: {}
  });
  return ok({ removed: true });
});

// ── Relationships ─────────────────────────────────────────────────────────────

server.get('/relationships', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listRelationships(projectId);
  return ok({ items });
});

server.post('/relationships', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    id: string;
    projectId: string;
    relationshipType: string;
    leftTargetType: string;
    leftTargetId: string;
    rightTargetType: string;
    rightTargetId: string;
    note: string;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const leftTargetId = typeof body.leftTargetId === 'string' ? body.leftTargetId.trim() : '';
  const rightTargetId = typeof body.rightTargetId === 'string' ? body.rightTargetId.trim() : '';
  if (!leftTargetId || !rightTargetId) {
    return reply.status(400).send(fail('INVALID', 'Both relationship targets are required.'));
  }
  const relationship = createRelationship({
    id: typeof body.id === 'string' && body.id.trim() ? body.id : `relationship-${randomUUID()}`,
    projectId,
    relationshipType: parseRelationshipType(body.relationshipType),
    leftTargetType: parseRelationshipTargetType(body.leftTargetType),
    leftTargetId,
    rightTargetType: parseRelationshipTargetType(body.rightTargetType),
    rightTargetId,
    note: typeof body.note === 'string' ? body.note : ''
  });
  const created = await insertRelationship(relationship);
  await recordAuditEvent({
    request,
    projectId,
    action: 'relationship.create',
    entityType: 'relationship',
    entityId: created.id,
    details: {
      relationshipType: created.relationshipType,
      leftTargetType: created.leftTargetType,
      leftTargetId: created.leftTargetId,
      rightTargetType: created.rightTargetType,
      rightTargetId: created.rightTargetId
    }
  });
  return ok({ relationship: created });
});

server.put('/relationships/:relationshipId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ relationshipId: string }>;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    relationshipType: string;
    leftTargetType: string;
    leftTargetId: string;
    rightTargetType: string;
    rightTargetId: string;
    note: string;
  }>;
  const relationshipId = typeof params.relationshipId === 'string' ? params.relationshipId.trim() : '';
  if (!relationshipId) return reply.status(400).send(fail('INVALID', 'relationshipId is required.'));
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const existing = (await listRelationships(projectId)).find((item) => item.id === relationshipId);
  if (!existing) return reply.status(404).send(fail('NOT_FOUND', 'Relationship not found.'));

  const leftTargetId = body.leftTargetId === undefined ? existing.leftTargetId : String(body.leftTargetId ?? '').trim();
  const rightTargetId = body.rightTargetId === undefined ? existing.rightTargetId : String(body.rightTargetId ?? '').trim();
  if (!leftTargetId || !rightTargetId) {
    return reply.status(400).send(fail('INVALID', 'Both relationship targets are required.'));
  }
  const updated = createRelationship({
    ...existing,
    relationshipType: body.relationshipType === undefined ? existing.relationshipType : parseRelationshipType(body.relationshipType),
    leftTargetType: body.leftTargetType === undefined ? existing.leftTargetType : parseRelationshipTargetType(body.leftTargetType),
    leftTargetId,
    rightTargetType: body.rightTargetType === undefined ? existing.rightTargetType : parseRelationshipTargetType(body.rightTargetType),
    rightTargetId,
    note: body.note === undefined ? existing.note : String(body.note ?? ''),
    updatedAt: new Date().toISOString()
  });
  const saved = await updateRelationship(updated);
  if (!saved) return reply.status(404).send(fail('NOT_FOUND', 'Relationship not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'relationship.update',
    entityType: 'relationship',
    entityId: saved.id,
    details: {
      relationshipType: saved.relationshipType,
      leftTargetType: saved.leftTargetType,
      leftTargetId: saved.leftTargetId,
      rightTargetType: saved.rightTargetType,
      rightTargetId: saved.rightTargetId
    }
  });
  return ok({ relationship: saved });
});

server.delete('/relationships/:relationshipId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ relationshipId: string }>;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const relationshipId = typeof params.relationshipId === 'string' ? params.relationshipId.trim() : '';
  if (!relationshipId) return reply.status(400).send(fail('INVALID', 'relationshipId is required.'));
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const removed = await deleteRelationship(relationshipId, projectId);
  if (!removed) return reply.status(404).send(fail('NOT_FOUND', 'Relationship not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'relationship.delete',
    entityType: 'relationship',
    entityId: relationshipId,
    details: {}
  });
  return ok({ removed: true });
});

type ReferenceSearchRecord = {
  id: string;
  sourceFormat: 'ris' | 'bibtex' | 'manual' | 'csljson';
  referenceType: string;
  title: string;
  authors: string[];
  year: number | null;
  containerTitle: string;
  publisher: string;
  doi: string;
  url: string;
  abstractText: string;
  keywords: string[];
};

function normalizeReferenceLookupToken(value: string): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeReferenceDoi(value: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/^doi:/, '');
}

function referenceMatchesSearch(reference: ReferenceSearchRecord, searchText: string): boolean {
  const token = normalizeReferenceLookupToken(searchText);
  if (!token) return true;
  const haystack = normalizeReferenceLookupToken([
    reference.title,
    reference.referenceType,
    reference.authors.join(' '),
    reference.containerTitle,
    reference.publisher,
    reference.doi,
    reference.url,
    reference.abstractText,
    reference.keywords.join(' ')
  ].join(' '));
  return haystack.includes(token);
}

function referencesLikelyDuplicate(existing: ReferenceSearchRecord, draft: {
  title: string;
  authors: string[];
  year: number | null;
  doi: string;
}): boolean {
  const existingDoi = normalizeReferenceDoi(existing.doi);
  const draftDoi = normalizeReferenceDoi(draft.doi);
  if (existingDoi && draftDoi && existingDoi === draftDoi) return true;
  const existingTitle = normalizeReferenceLookupToken(existing.title);
  const draftTitle = normalizeReferenceLookupToken(draft.title);
  const existingAuthor = normalizeReferenceLookupToken(existing.authors[0] ?? '');
  const draftAuthor = normalizeReferenceLookupToken(draft.authors[0] ?? '');
  if (!existingTitle || !draftTitle || existingTitle !== draftTitle) return false;
  if (existing.year && draft.year && existing.year !== draft.year) return false;
  if (existingAuthor && draftAuthor && existingAuthor !== draftAuthor) return false;
  return true;
}

function filterReferences(
  items: ReferenceSearchRecord[],
  options: {
    searchText: string;
    sourceFormat: 'manual' | 'ris' | 'bibtex' | 'csljson' | 'all';
    allowedReferenceIds?: Set<string> | null;
  }
): ReferenceSearchRecord[] {
  const allowedReferenceIds = options.allowedReferenceIds ?? null;
  return items.filter((reference) => {
    if (allowedReferenceIds && !allowedReferenceIds.has(reference.id)) return false;
    if (options.sourceFormat !== 'all' && reference.sourceFormat !== options.sourceFormat) return false;
    return referenceMatchesSearch(reference, options.searchText);
  });
}

server.get('/references', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as {
    projectId?: string;
    q?: string;
    sourceFormat?: string;
    collectionId?: string;
  };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const allReferences = await listProjectReferences(projectId);
  const sourceFormat = query.sourceFormat === 'manual' || query.sourceFormat === 'ris' || query.sourceFormat === 'bibtex'
    || query.sourceFormat === 'csljson'
    ? query.sourceFormat
    : 'all';
  const allowedReferenceIds = typeof query.collectionId === 'string' && query.collectionId.trim()
    ? new Set((await listProjectReferenceCollectionItems(projectId, query.collectionId.trim())).map((item) => item.referenceId))
    : null;
  const items = filterReferences(allReferences, {
    searchText: typeof query.q === 'string' ? query.q : '',
    sourceFormat,
    allowedReferenceIds
  });
  return ok({
    items,
    total: items.length,
    overallTotal: allReferences.length
  });
});

server.post('/references', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    sourceFormat: string;
    referenceType: string;
    title: string;
    authors: string[] | string;
    year: number | string | null;
    containerTitle: string;
    publisher: string;
    doi: string;
    url: string;
    abstractText: string;
    keywords: string[] | string;
    rawText: string;
    relatedSourceId: string | null;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return reply.status(400).send(fail('INVALID', 'Reference title is required.'));
  }
  const timestamp = new Date().toISOString();
  const reference = await insertProjectReference({
    id: `reference-${randomUUID()}`,
    projectId,
    sourceFormat: parseReferenceSourceFormat(body.sourceFormat),
    referenceType: typeof body.referenceType === 'string' && body.referenceType.trim() ? body.referenceType.trim() : 'article',
    title,
    authors: parseStringArray(body.authors),
    year: parseOptionalYear(body.year),
    containerTitle: typeof body.containerTitle === 'string' ? body.containerTitle.trim() : '',
    publisher: typeof body.publisher === 'string' ? body.publisher.trim() : '',
    doi: typeof body.doi === 'string' ? body.doi.trim() : '',
    url: typeof body.url === 'string' ? body.url.trim() : '',
    abstractText: typeof body.abstractText === 'string' ? body.abstractText.trim() : '',
    keywords: parseStringArray(body.keywords),
    rawText: typeof body.rawText === 'string' ? body.rawText : '',
    relatedSourceId: typeof body.relatedSourceId === 'string' && body.relatedSourceId.trim() ? body.relatedSourceId.trim() : null,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.create',
    entityType: 'project_reference',
    entityId: reference.id,
    details: { sourceFormat: reference.sourceFormat, referenceType: reference.referenceType, title: reference.title }
  });
  reply.code(201);
  return ok({ reference });
});

server.patch('/references/:referenceId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ referenceId: string }>;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    sourceFormat: string;
    referenceType: string;
    title: string;
    authors: string[] | string;
    year: number | string | null;
    containerTitle: string;
    publisher: string;
    doi: string;
    url: string;
    abstractText: string;
    keywords: string[] | string;
    rawText: string;
    relatedSourceId: string | null;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const referenceId = typeof params.referenceId === 'string' ? params.referenceId.trim() : '';
  if (!referenceId) {
    return reply.status(400).send(fail('INVALID', 'referenceId is required.'));
  }
  const existing = await getProjectReference(referenceId, projectId);
  if (!existing) {
    return reply.status(404).send(fail('NOT_FOUND', 'Reference not found.'));
  }
  const updated = await updateProjectReference({
    ...existing,
    sourceFormat: body.sourceFormat === undefined ? existing.sourceFormat : parseReferenceSourceFormat(body.sourceFormat),
    referenceType: body.referenceType === undefined ? existing.referenceType : String(body.referenceType ?? '').trim() || existing.referenceType,
    title: body.title === undefined ? existing.title : String(body.title ?? '').trim(),
    authors: body.authors === undefined ? existing.authors : parseStringArray(body.authors),
    year: body.year === undefined ? existing.year : parseOptionalYear(body.year),
    containerTitle: body.containerTitle === undefined ? existing.containerTitle : String(body.containerTitle ?? '').trim(),
    publisher: body.publisher === undefined ? existing.publisher : String(body.publisher ?? '').trim(),
    doi: body.doi === undefined ? existing.doi : String(body.doi ?? '').trim(),
    url: body.url === undefined ? existing.url : String(body.url ?? '').trim(),
    abstractText: body.abstractText === undefined ? existing.abstractText : String(body.abstractText ?? '').trim(),
    keywords: body.keywords === undefined ? existing.keywords : parseStringArray(body.keywords),
    rawText: body.rawText === undefined ? existing.rawText : String(body.rawText ?? ''),
    relatedSourceId: body.relatedSourceId === undefined
      ? existing.relatedSourceId
      : typeof body.relatedSourceId === 'string' && body.relatedSourceId.trim()
        ? body.relatedSourceId.trim()
        : null,
    updatedAt: new Date().toISOString()
  });
  if (!updated) {
    return reply.status(404).send(fail('NOT_FOUND', 'Reference not found.'));
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.update',
    entityType: 'project_reference',
    entityId: updated.id,
    details: { sourceFormat: updated.sourceFormat, referenceType: updated.referenceType, title: updated.title }
  });
  return ok({ reference: updated });
});

server.post('/references/import', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    format: string;
    text: string;
    relatedSourceId: string;
    skipDuplicates: boolean;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const rawText = typeof body.text === 'string' ? body.text.trim() : '';
  if (!rawText) {
    return reply.status(400).send(fail('INVALID', 'Reference text is required.'));
  }
  const format = body.format === 'bibtex' || body.format === 'csljson' ? body.format : 'ris';
  const drafts = format === 'bibtex'
    ? parseBibtexReferences(rawText)
    : format === 'csljson'
      ? parseCslJsonReferences(rawText)
      : parseRisReferences(rawText);
  if (drafts.length === 0) {
    return reply.status(400).send(fail('INVALID', 'No references could be parsed from the supplied text.'));
  }
  const skipDuplicates = body.skipDuplicates !== false;
  const existing = skipDuplicates ? await listProjectReferences(projectId) : [];
  const timestamp = new Date().toISOString();
  const items = [];
  const skipped: Array<{ title: string; reason: string }> = [];
  for (const draft of drafts) {
    if (skipDuplicates) {
      const duplicate = existing.find((row) => referencesLikelyDuplicate(row, draft));
      if (duplicate) {
        skipped.push({ title: draft.title || 'Untitled reference', reason: `Duplicate of ${duplicate.id}` });
        continue;
      }
    }
    const reference = await insertProjectReference({
      id: `reference-${randomUUID()}`,
      projectId,
      sourceFormat: format === 'csljson' ? 'csljson' : format,
      referenceType: draft.referenceType || 'article',
      title: draft.title || 'Untitled reference',
      authors: draft.authors,
      year: draft.year,
      containerTitle: draft.containerTitle,
      publisher: draft.publisher,
      doi: draft.doi,
      url: draft.url,
      abstractText: draft.abstractText,
      keywords: draft.keywords,
      rawText: draft.rawText,
      relatedSourceId: typeof body.relatedSourceId === 'string' && body.relatedSourceId.trim() ? body.relatedSourceId.trim() : null,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    items.push(reference);
    existing.push(reference);
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.import',
    entityType: 'project_reference_batch',
    entityId: `reference-import-${randomUUID()}`,
    details: { format, importedCount: items.length, skippedCount: skipped.length }
  });
  reply.code(201);
  return ok({ items, total: items.length, skippedCount: skipped.length, skipped });
});

server.delete('/references/:referenceId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ referenceId: string }>;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const referenceId = typeof params.referenceId === 'string' ? params.referenceId.trim() : '';
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!referenceId) return reply.status(400).send(fail('INVALID', 'referenceId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const removed = await deleteProjectReference(referenceId, projectId);
  if (!removed) return reply.status(404).send(fail('NOT_FOUND', 'Reference not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.delete',
    entityType: 'project_reference',
    entityId: referenceId,
    details: {}
  });
  return ok({ removed: true });
});

server.get('/references/export', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    format: string;
    q: string;
    sourceFormat: string;
    collectionId: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const format = query.format === 'ris' || query.format === 'bibtex' || query.format === 'csljson' ? query.format : 'json';
  const sourceFormat = query.sourceFormat === 'manual' || query.sourceFormat === 'ris' || query.sourceFormat === 'bibtex' || query.sourceFormat === 'csljson'
    ? query.sourceFormat
    : 'all';
  const allReferences = await listProjectReferences(projectId);
  const allowedReferenceIds = typeof query.collectionId === 'string' && query.collectionId.trim()
    ? new Set((await listProjectReferenceCollectionItems(projectId, query.collectionId.trim())).map((item) => item.referenceId))
    : null;
  const items = filterReferences(allReferences, {
    searchText: typeof query.q === 'string' ? query.q : '',
    sourceFormat,
    allowedReferenceIds
  });
  const payload = format === 'bibtex'
    ? serializeBibtexReferences(items)
    : format === 'ris'
      ? serializeRisReferences(items)
      : format === 'csljson'
        ? serializeCslJsonReferences(items)
      : JSON.stringify({ exportedAt: new Date().toISOString(), total: items.length, items }, null, 2);
  const artifact = format === 'json'
    ? await writeProjectArtifact({
      projectId,
      area: 'exports',
      label: 'references',
      extension: 'json',
      contents: payload
    })
    : await writeProjectArtifactBytes({
      projectId,
      area: 'exports',
      label: 'references',
      extension: format === 'bibtex' ? 'bib' : format === 'ris' ? 'ris' : 'csl.json',
      contents: Buffer.from(payload, 'utf8')
    });
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.export',
    entityType: 'export',
    entityId: `${projectId}:references:${format}`,
    details: { format, count: items.length, file: artifact.relativePath }
  });
  if (format === 'bibtex') {
    reply.header('Content-Type', 'text/x-bibtex; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-references.bib"`);
  } else if (format === 'ris') {
    reply.header('Content-Type', 'application/x-research-info-systems; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-references.ris"`);
  } else if (format === 'csljson') {
    reply.header('Content-Type', 'application/vnd.citationstyles.csl+json; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-references.csl.json"`);
  } else {
    reply.header('Content-Type', 'application/json; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${projectId}-references.json"`);
  }
  return reply.send(payload);
});

server.get('/references/duplicates', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string; minScore: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const minScoreRaw = Number(query.minScore ?? 0.74);
  const minScore = Number.isFinite(minScoreRaw) ? Math.max(0, Math.min(1, minScoreRaw)) : 0.74;
  const [references, candidates] = await Promise.all([
    listProjectReferences(projectId),
    listProjectReferenceDuplicateCandidates(projectId)
  ]);
  const byId = new Map(references.map((reference) => [reference.id, reference]));
  const items = candidates
    .filter((candidate) => candidate.score >= minScore)
    .map((candidate) => ({
      ...candidate,
      primary: byId.get(candidate.primaryReferenceId) ?? null,
      duplicate: byId.get(candidate.duplicateReferenceId) ?? null
    }))
    .filter((candidate) => candidate.primary && candidate.duplicate);
  return ok({ items, total: items.length });
});

server.post('/references/merge', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    primaryReferenceId: string;
    mergedReferenceId: string;
    reason: string;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const primaryReferenceId = typeof body.primaryReferenceId === 'string' ? body.primaryReferenceId.trim() : '';
  const mergedReferenceId = typeof body.mergedReferenceId === 'string' ? body.mergedReferenceId.trim() : '';
  if (!primaryReferenceId || !mergedReferenceId || primaryReferenceId === mergedReferenceId) {
    return reply.status(400).send(fail('INVALID', 'primaryReferenceId and mergedReferenceId must be different and non-empty.'));
  }
  const timestamp = new Date().toISOString();
  const mergeResult = await mergeProjectReferences({
    projectId,
    primaryReferenceId,
    mergedReferenceId,
    reason: typeof body.reason === 'string' ? body.reason.trim() : '',
    eventId: `reference-merge-${randomUUID()}`,
    createdAt: timestamp,
    createdByUserId: userId,
    createdByUsername: request.session.username ?? 'system'
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.merge',
    entityType: 'project_reference',
    entityId: mergeResult.primary.id,
    details: {
      mergedReferenceId,
      reason: mergeResult.event.reason,
      mergeEventId: mergeResult.event.id
    }
  });
  return ok(mergeResult);
});

server.get('/reference-links', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string; referenceId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const referenceId = typeof query.referenceId === 'string' && query.referenceId.trim() ? query.referenceId.trim() : undefined;
  const items = await listProjectReferenceLinks(projectId, referenceId);
  return ok({ items, total: items.length });
});

server.post('/reference-links', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    referenceId: string;
    targetType: string;
    targetId: string;
    note: string;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const referenceId = typeof body.referenceId === 'string' ? body.referenceId.trim() : '';
  const targetId = typeof body.targetId === 'string' ? body.targetId.trim() : '';
  if (!referenceId || !targetId) {
    return reply.status(400).send(fail('INVALID', 'referenceId and targetId are required.'));
  }
  const timestamp = new Date().toISOString();
  const link = await insertProjectReferenceLink({
    id: `reference-link-${randomUUID()}`,
    projectId,
    referenceId,
    targetType: parseReferenceTargetType(body.targetType),
    targetId,
    note: typeof body.note === 'string' ? body.note.trim() : '',
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.link.create',
    entityType: 'project_reference_link',
    entityId: link.id,
    details: { referenceId: link.referenceId, targetType: link.targetType, targetId: link.targetId }
  });
  reply.code(201);
  return ok({ link });
});

server.patch('/reference-links/:linkId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ linkId: string }>;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    referenceId: string;
    targetType: string;
    targetId: string;
    note: string;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const linkId = typeof params.linkId === 'string' ? params.linkId.trim() : '';
  if (!linkId) {
    return reply.status(400).send(fail('INVALID', 'linkId is required.'));
  }
  const existing = (await listProjectReferenceLinks(projectId)).find((item) => item.id === linkId);
  if (!existing) {
    return reply.status(404).send(fail('NOT_FOUND', 'Reference link not found.'));
  }
  const updated = await updateProjectReferenceLink({
    ...existing,
    referenceId: body.referenceId === undefined ? existing.referenceId : String(body.referenceId ?? '').trim(),
    targetType: body.targetType === undefined ? existing.targetType : parseReferenceTargetType(body.targetType),
    targetId: body.targetId === undefined ? existing.targetId : String(body.targetId ?? '').trim(),
    note: body.note === undefined ? existing.note : String(body.note ?? '').trim(),
    updatedAt: new Date().toISOString()
  });
  if (!updated) {
    return reply.status(404).send(fail('NOT_FOUND', 'Reference link not found.'));
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.link.update',
    entityType: 'project_reference_link',
    entityId: updated.id,
    details: { referenceId: updated.referenceId, targetType: updated.targetType, targetId: updated.targetId }
  });
  return ok({ link: updated });
});

server.delete('/reference-links/:linkId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ linkId: string }>;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const linkId = typeof params.linkId === 'string' ? params.linkId.trim() : '';
  if (!linkId) {
    return reply.status(400).send(fail('INVALID', 'linkId is required.'));
  }
  const removed = await deleteProjectReferenceLink(linkId, projectId);
  if (!removed) {
    return reply.status(404).send(fail('NOT_FOUND', 'Reference link not found.'));
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.link.delete',
    entityType: 'project_reference_link',
    entityId: linkId,
    details: {}
  });
  return ok({ removed: true });
});

server.get('/reference-collections', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listProjectReferenceCollections(projectId);
  return ok({ items, total: items.length });
});

server.post('/reference-collections', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    name: string;
    description: string;
    colorToken: string;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return reply.status(400).send(fail('INVALID', 'Collection name is required.'));
  }
  const timestamp = new Date().toISOString();
  const collection = await insertProjectReferenceCollection({
    id: `reference-collection-${randomUUID()}`,
    projectId,
    name,
    description: typeof body.description === 'string' ? body.description.trim() : '',
    colorToken: parseReferenceCollectionColorToken(body.colorToken),
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.collection.create',
    entityType: 'project_reference_collection',
    entityId: collection.id,
    details: { name: collection.name, colorToken: collection.colorToken }
  });
  reply.code(201);
  return ok({ collection });
});

server.patch('/reference-collections/:collectionId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ collectionId: string }>;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    name: string;
    description: string;
    colorToken: string;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const collectionId = typeof params.collectionId === 'string' ? params.collectionId.trim() : '';
  if (!collectionId) {
    return reply.status(400).send(fail('INVALID', 'collectionId is required.'));
  }
  const existing = (await listProjectReferenceCollections(projectId)).find((item) => item.id === collectionId);
  if (!existing) {
    return reply.status(404).send(fail('NOT_FOUND', 'Reference collection not found.'));
  }
  const updated = await updateProjectReferenceCollection({
    ...existing,
    name: body.name === undefined ? existing.name : String(body.name ?? '').trim(),
    description: body.description === undefined ? existing.description : String(body.description ?? '').trim(),
    colorToken: body.colorToken === undefined ? existing.colorToken : parseReferenceCollectionColorToken(body.colorToken),
    updatedAt: new Date().toISOString()
  });
  if (!updated) {
    return reply.status(404).send(fail('NOT_FOUND', 'Reference collection not found.'));
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.collection.update',
    entityType: 'project_reference_collection',
    entityId: updated.id,
    details: { name: updated.name, colorToken: updated.colorToken }
  });
  return ok({ collection: updated });
});

server.delete('/reference-collections/:collectionId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ collectionId: string }>;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const collectionId = typeof params.collectionId === 'string' ? params.collectionId.trim() : '';
  if (!collectionId) {
    return reply.status(400).send(fail('INVALID', 'collectionId is required.'));
  }
  const removed = await deleteProjectReferenceCollection(collectionId, projectId);
  if (!removed) {
    return reply.status(404).send(fail('NOT_FOUND', 'Reference collection not found.'));
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.collection.delete',
    entityType: 'project_reference_collection',
    entityId: collectionId,
    details: {}
  });
  return ok({ removed: true });
});

server.get('/reference-collection-items', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string; collectionId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const collectionId = typeof query.collectionId === 'string' && query.collectionId.trim() ? query.collectionId.trim() : undefined;
  const items = await listProjectReferenceCollectionItems(projectId, collectionId);
  return ok({ items, total: items.length });
});

server.post('/reference-collections/:collectionId/items', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ collectionId: string }>;
  const body = (request.body ?? {}) as Partial<{ projectId: string; referenceId: string }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const collectionId = typeof params.collectionId === 'string' ? params.collectionId.trim() : '';
  const referenceId = typeof body.referenceId === 'string' ? body.referenceId.trim() : '';
  if (!collectionId || !referenceId) {
    return reply.status(400).send(fail('INVALID', 'collectionId and referenceId are required.'));
  }
  const timestamp = new Date().toISOString();
  const item = await insertProjectReferenceCollectionItem({
    id: `reference-collection-item-${randomUUID()}`,
    projectId,
    collectionId,
    referenceId,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.collection.add_item',
    entityType: 'project_reference_collection_item',
    entityId: item.id,
    details: { collectionId, referenceId }
  });
  reply.code(201);
  return ok({ item });
});

server.delete('/reference-collections/:collectionId/items/:itemId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ collectionId: string; itemId: string }>;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const itemId = typeof params.itemId === 'string' ? params.itemId.trim() : '';
  if (!itemId) {
    return reply.status(400).send(fail('INVALID', 'itemId is required.'));
  }
  const removed = await deleteProjectReferenceCollectionItem(itemId, projectId);
  if (!removed) {
    return reply.status(404).send(fail('NOT_FOUND', 'Collection item not found.'));
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.collection.remove_item',
    entityType: 'project_reference_collection_item',
    entityId: itemId,
    details: { collectionId: params.collectionId ?? null }
  });
  return ok({ removed: true });
});

server.delete('/reference-collections/:collectionId/references/:referenceId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ collectionId: string; referenceId: string }>;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const collectionId = typeof params.collectionId === 'string' ? params.collectionId.trim() : '';
  const referenceId = typeof params.referenceId === 'string' ? params.referenceId.trim() : '';
  if (!collectionId || !referenceId) {
    return reply.status(400).send(fail('INVALID', 'collectionId and referenceId are required.'));
  }
  const removed = await removeReferenceFromCollection(projectId, collectionId, referenceId);
  if (!removed) {
    return reply.status(404).send(fail('NOT_FOUND', 'Reference not found in collection.'));
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.collection.remove_reference',
    entityType: 'project_reference_collection',
    entityId: collectionId,
    details: { referenceId }
  });
  return ok({ removed: true });
});

server.get('/reference-merge-events', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string; referenceId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const referenceId = typeof query.referenceId === 'string' && query.referenceId.trim() ? query.referenceId.trim() : undefined;
  const items = await listProjectReferenceMergeEvents(projectId, referenceId);
  return ok({ items, total: items.length });
});

server.get('/transcript-sync-links', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string; mediaSourceId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listTranscriptSyncLinks(projectId);
  return ok({
    items: typeof query.mediaSourceId === 'string' && query.mediaSourceId.trim()
      ? items.filter((item) => item.mediaSourceId === query.mediaSourceId?.trim())
      : items
  });
});

server.post('/transcript-sync-links', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    mediaSourceId: string;
    transcriptSourceId: string;
    segmentId: string;
    startMs: number;
    endMs: number;
    transcriptText: string;
    speakerLabel: string;
    confidence: number;
    syncScore: number;
    tokenTimeline: Array<{ token: string; startMs: number; endMs: number; confidence?: number; speakerLabel?: string }>;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const mediaSourceId = typeof body.mediaSourceId === 'string' ? body.mediaSourceId.trim() : '';
  const transcriptSourceId = typeof body.transcriptSourceId === 'string' ? body.transcriptSourceId.trim() : '';
  if (!mediaSourceId || !transcriptSourceId) {
    return reply.status(400).send(fail('INVALID', 'mediaSourceId and transcriptSourceId are required.'));
  }
  const startMs = typeof body.startMs === 'number' ? Math.max(0, Math.round(body.startMs)) : 0;
  const endMs = typeof body.endMs === 'number' ? Math.max(startMs, Math.round(body.endMs)) : startMs;
  const speakerLabel = typeof body.speakerLabel === 'string' ? body.speakerLabel.trim() : '';
  const confidence = parseOptionalBoundedNumber(body.confidence, 0, 1);
  const syncScore = parseOptionalBoundedNumber(body.syncScore, 0, 1);
  const tokenTimeline = normalizeTokenTimeline(body.tokenTimeline);
  const link = await insertTranscriptSyncLink({
    id: `sync-${randomUUID()}`,
    projectId,
    mediaSourceId,
    transcriptSourceId,
    segmentId: typeof body.segmentId === 'string' && body.segmentId.trim() ? body.segmentId.trim() : null,
    startMs,
    endMs,
    transcriptText: typeof body.transcriptText === 'string' ? body.transcriptText : '',
    speakerLabel,
    confidence,
    syncScore,
    tokenTimelineJson: JSON.stringify(tokenTimeline),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'transcript_sync.create',
    entityType: 'transcript_sync_link',
    entityId: link.id,
    details: { mediaSourceId, transcriptSourceId, segmentId: link.segmentId, startMs, endMs, tokenCount: tokenTimeline.length, confidence, syncScore }
  });
  return ok({ link });
});

server.put('/transcript-sync-links/:linkId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ linkId: string }>;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    mediaSourceId: string;
    transcriptSourceId: string;
    segmentId: string | null;
    startMs: number;
    endMs: number;
    transcriptText: string;
    speakerLabel: string;
    confidence: number;
    syncScore: number;
    tokenTimeline: Array<{ token: string; startMs: number; endMs: number; confidence?: number; speakerLabel?: string }>;
  }>;
  const linkId = typeof params.linkId === 'string' ? params.linkId.trim() : '';
  if (!linkId) {
    return reply.status(400).send(fail('INVALID', 'linkId is required.'));
  }
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;

  const existingLinks = await listTranscriptSyncLinks(projectId);
  const existing = existingLinks.find((entry) => entry.id === linkId);
  if (!existing) {
    return reply.status(404).send(fail('NOT_FOUND', 'Transcript sync link not found.'));
  }

  const mediaSourceId = typeof body.mediaSourceId === 'string' && body.mediaSourceId.trim()
    ? body.mediaSourceId.trim()
    : existing.mediaSourceId;
  const transcriptSourceId = typeof body.transcriptSourceId === 'string' && body.transcriptSourceId.trim()
    ? body.transcriptSourceId.trim()
    : existing.transcriptSourceId;
  if (!mediaSourceId || !transcriptSourceId) {
    return reply.status(400).send(fail('INVALID', 'mediaSourceId and transcriptSourceId are required.'));
  }
  const startMs = typeof body.startMs === 'number'
    ? Math.max(0, Math.round(body.startMs))
    : existing.startMs;
  const requestedEndMs = typeof body.endMs === 'number'
    ? Math.max(0, Math.round(body.endMs))
    : existing.endMs;
  const endMs = Math.max(startMs, requestedEndMs);
  const segmentId = body.segmentId === null
    ? null
    : typeof body.segmentId === 'string' && body.segmentId.trim()
      ? body.segmentId.trim()
      : existing.segmentId;
  const transcriptText = typeof body.transcriptText === 'string'
    ? body.transcriptText
    : existing.transcriptText;
  const speakerLabel = typeof body.speakerLabel === 'string'
    ? body.speakerLabel.trim()
    : existing.speakerLabel;
  const confidence = body.confidence === null
    ? null
    : body.confidence === undefined
      ? existing.confidence
      : parseOptionalBoundedNumber(body.confidence, 0, 1);
  const syncScore = body.syncScore === null
    ? null
    : body.syncScore === undefined
      ? existing.syncScore
      : parseOptionalBoundedNumber(body.syncScore, 0, 1);
  const existingTokenTimeline = (() => {
    try {
      return normalizeTokenTimeline(JSON.parse(existing.tokenTimelineJson || '[]'));
    } catch {
      return [];
    }
  })();
  const tokenTimeline = body.tokenTimeline === undefined
    ? existingTokenTimeline
    : normalizeTokenTimeline(body.tokenTimeline);
  const updatedAt = new Date().toISOString();
  const link = await updateTranscriptSyncLink({
    ...existing,
    mediaSourceId,
    transcriptSourceId,
    segmentId,
    startMs,
    endMs,
    transcriptText,
    speakerLabel,
    confidence,
    syncScore,
    tokenTimelineJson: JSON.stringify(tokenTimeline),
    updatedAt
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'transcript_sync.update',
    entityType: 'transcript_sync_link',
    entityId: link.id,
    details: {
      mediaSourceId,
      transcriptSourceId,
      segmentId,
      startMs,
      endMs,
      replacedSegmentId: existing.segmentId,
      tokenCount: tokenTimeline.length,
      confidence,
      syncScore
    }
  });
  return ok({ link });
});

server.post('/transcript-sync-links/batch-update', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    mediaSourceId: string;
    linkIds: string[];
    speakerLabel: string;
    fromSpeakerLabel: string;
    confidenceFloor: number;
    syncScoreFloor: number;
    maxConfidence: number;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const rawLinkIds = Array.isArray(body.linkIds) ? body.linkIds : [];
  const linkIds = [...new Set(rawLinkIds
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean))];
  if (linkIds.length === 0) {
    return reply.status(400).send(fail('INVALID', 'At least one transcript sync link id is required.'));
  }
  if (linkIds.length > 2000) {
    return reply.status(400).send(fail('INVALID', 'Batch updates are limited to 2000 rows per request.'));
  }

  const mediaSourceId = typeof body.mediaSourceId === 'string' && body.mediaSourceId.trim()
    ? body.mediaSourceId.trim()
    : null;
  const hasSpeakerUpdate = body.speakerLabel !== undefined;
  const speakerLabel = typeof body.speakerLabel === 'string' ? body.speakerLabel.trim() : '';
  if (hasSpeakerUpdate && !speakerLabel) {
    return reply.status(400).send(fail('INVALID', 'speakerLabel must be a non-empty string when provided.'));
  }
  const fromSpeakerLabel = typeof body.fromSpeakerLabel === 'string'
    ? body.fromSpeakerLabel.trim()
    : null;
  const confidenceFloor = parseOptionalBoundedNumber(body.confidenceFloor, 0, 1);
  const syncScoreFloor = parseOptionalBoundedNumber(body.syncScoreFloor, 0, 1);
  const maxConfidence = parseOptionalBoundedNumber(body.maxConfidence, 0, 1);
  if (!hasSpeakerUpdate && confidenceFloor === null && syncScoreFloor === null) {
    return reply.status(400).send(fail('INVALID', 'Provide speakerLabel, confidenceFloor, or syncScoreFloor for batch update.'));
  }

  const normalizeSpeakerKey = (value: string): string => {
    const normalized = value.trim().toLowerCase();
    return normalized ? normalized : '__unlabeled__';
  };
  const normalizedFromSpeaker = fromSpeakerLabel === null
    ? null
    : normalizeSpeakerKey(fromSpeakerLabel);
  const now = new Date().toISOString();
  const linkById = new Map((await listTranscriptSyncLinks(projectId)).map((link) => [link.id, link]));
  let updatedCount = 0;
  let skippedCount = 0;
  let skippedByFilter = 0;
  let missingCount = 0;
  const sample: Array<{
    id: string;
    speakerLabel: string;
    confidence: number | null;
    syncScore: number | null;
  }> = [];

  for (const linkId of linkIds) {
    const existing = linkById.get(linkId);
    if (!existing) {
      missingCount += 1;
      continue;
    }
    if (mediaSourceId && existing.mediaSourceId !== mediaSourceId) {
      skippedByFilter += 1;
      continue;
    }
    const currentSpeakerLabel = typeof existing.speakerLabel === 'string' ? existing.speakerLabel.trim() : '';
    if (normalizedFromSpeaker !== null && normalizeSpeakerKey(currentSpeakerLabel) !== normalizedFromSpeaker) {
      skippedByFilter += 1;
      continue;
    }
    if (
      maxConfidence !== null &&
      typeof existing.confidence === 'number' &&
      Number.isFinite(existing.confidence) &&
      existing.confidence > maxConfidence
    ) {
      skippedByFilter += 1;
      continue;
    }

    const nextSpeakerLabel = hasSpeakerUpdate ? speakerLabel : currentSpeakerLabel;
    const nextConfidence = confidenceFloor === null
      ? existing.confidence
      : Math.max(
          typeof existing.confidence === 'number' && Number.isFinite(existing.confidence) ? existing.confidence : 0,
          confidenceFloor
        );
    const nextSyncScore = syncScoreFloor === null
      ? existing.syncScore
      : Math.max(
          typeof existing.syncScore === 'number' && Number.isFinite(existing.syncScore) ? existing.syncScore : 0,
          syncScoreFloor
        );

    const tokenTimeline = (() => {
      try {
        return normalizeTokenTimeline(JSON.parse(existing.tokenTimelineJson || '[]'));
      } catch {
        return [];
      }
    })();
    const remappedTokenTimeline = hasSpeakerUpdate && nextSpeakerLabel !== currentSpeakerLabel
      ? tokenTimeline.map((token) => {
          const tokenSpeaker = typeof token.speakerLabel === 'string' ? token.speakerLabel.trim() : '';
          if (tokenSpeaker && normalizeSpeakerKey(tokenSpeaker) !== normalizeSpeakerKey(currentSpeakerLabel)) {
            return token;
          }
          return {
            ...token,
            speakerLabel: nextSpeakerLabel
          };
        })
      : tokenTimeline;

    const changed = nextSpeakerLabel !== currentSpeakerLabel
      || nextConfidence !== existing.confidence
      || nextSyncScore !== existing.syncScore;
    if (!changed) {
      skippedCount += 1;
      continue;
    }

    const updated = await updateTranscriptSyncLink({
      ...existing,
      speakerLabel: nextSpeakerLabel,
      confidence: nextConfidence,
      syncScore: nextSyncScore,
      tokenTimelineJson: JSON.stringify(remappedTokenTimeline),
      updatedAt: now
    });
    updatedCount += 1;
    sample.push({
      id: updated.id,
      speakerLabel: updated.speakerLabel,
      confidence: updated.confidence,
      syncScore: updated.syncScore
    });
  }

  await recordAuditEvent({
    request,
    projectId,
    action: 'transcript_sync.batch_update',
    entityType: 'transcript_sync_link',
    entityId: mediaSourceId ?? linkIds[0],
    details: {
      mediaSourceId,
      requestedCount: linkIds.length,
      updatedCount,
      skippedCount,
      skippedByFilter,
      missingCount,
      hasSpeakerUpdate,
      fromSpeakerLabel,
      speakerLabel: hasSpeakerUpdate ? speakerLabel : null,
      confidenceFloor,
      syncScoreFloor,
      maxConfidence
    }
  });

  return ok({
    batch: {
      requestedCount: linkIds.length,
      updatedCount,
      skippedCount,
      skippedByFilter,
      missingCount,
      sample: sample.slice(0, 120)
    }
  });
});

server.delete('/transcript-sync-links/:linkId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ linkId: string }>;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const linkId = typeof params.linkId === 'string' ? params.linkId.trim() : '';
  if (!linkId) {
    return reply.status(400).send(fail('INVALID', 'linkId is required.'));
  }
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const removed = await deleteTranscriptSyncLink(linkId, projectId);
  if (!removed) {
    return reply.status(404).send(fail('NOT_FOUND', 'Transcript sync link not found.'));
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'transcript_sync.delete',
    entityType: 'transcript_sync_link',
    entityId: linkId,
    details: {}
  });
  return ok({ removed: true });
});

server.get('/media-timeline', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string; sourceId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const sourceId = typeof query.sourceId === 'string' ? query.sourceId.trim() : '';
  if (!sourceId) {
    return reply.status(400).send(fail('INVALID', 'sourceId is required.'));
  }
  const payload = await buildQualitativeProjectPayload(projectId);
  return ok({
    timeline: buildMediaTimeline({
      sourceId,
      segments: payload.segments,
      syncLinks: payload.transcriptSyncLinks,
      sources: payload.sources,
      applications: payload.codeApplications
    })
  });
});

server.get('/transcript-sync-links/diarization-qa', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as {
    projectId?: string;
    mediaSourceId?: string;
    maxRows?: string;
    maxConfidence?: string;
    switchWindowMs?: string;
  };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const mediaSourceId = typeof query.mediaSourceId === 'string' ? query.mediaSourceId.trim() : '';
  if (!mediaSourceId) {
    return reply.status(400).send(fail('INVALID', 'mediaSourceId is required.'));
  }
  const maxRows = parsePositiveInteger(query.maxRows, 120, 1, 2000);
  const maxConfidence = parseOptionalBoundedNumber(query.maxConfidence, 0, 1) ?? 0.62;
  const switchWindowMs = parsePositiveInteger(query.switchWindowMs, 1500, 100, 120000);
  const payload = await buildQualitativeProjectPayload(projectId);
  const timeline = buildMediaTimeline({
    sourceId: mediaSourceId,
    segments: payload.segments,
    syncLinks: payload.transcriptSyncLinks,
    sources: payload.sources,
    applications: payload.codeApplications
  });
  const qa = buildDiarizationQaReview({
    timeline,
    maxRows,
    maxConfidence,
    switchWindowMs
  });
  return ok({
    qa,
    timelineSummary: timeline.summary
  });
});

server.post('/transcript-sync-links/auto-align', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    mediaSourceId: string;
    maxDriftMs: number;
    mode: 'snap_to_segment' | 'fit_to_segment';
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const mediaSourceId = typeof body.mediaSourceId === 'string' && body.mediaSourceId.trim() ? body.mediaSourceId.trim() : '';
  if (!mediaSourceId) {
    return reply.status(400).send(fail('INVALID', 'mediaSourceId is required.'));
  }
  const maxDriftMs = parsePositiveInteger(body.maxDriftMs, 1200, 100, 120000);
  const mode = body.mode === 'fit_to_segment' ? 'fit_to_segment' : 'snap_to_segment';

  const payload = await buildQualitativeProjectPayload(projectId);
  const segmentById = new Map(
    payload.segments
      .filter((segment) => segment.sourceId === mediaSourceId && segment.kind === 'time_range')
      .map((segment) => [segment.id, segment])
  );
  const scopedLinks = payload.transcriptSyncLinks
    .filter((link) => link.mediaSourceId === mediaSourceId && Boolean(link.segmentId))
    .filter((link) => link.segmentId && segmentById.has(link.segmentId));

  let updatedCount = 0;
  let skippedCount = 0;
  let measuredCount = 0;
  let measuredDriftBeforeMs = 0;
  let measuredDriftAfterMs = 0;
  const now = new Date().toISOString();
  const changes: Array<{ linkId: string; segmentId: string | null; startMsBefore: number; endMsBefore: number; startMsAfter: number; endMsAfter: number; driftBeforeMs: number; driftAfterMs: number }> = [];

  for (const link of scopedLinks) {
    const segmentId = link.segmentId as string;
    const segment = segmentById.get(segmentId);
    if (!segment) {
      skippedCount += 1;
      continue;
    }
    const anchor = segment.anchor as { startMs: number; endMs: number };
    const targetStartMs = Math.max(0, Math.round(anchor.startMs));
    const targetEndMs = Math.max(targetStartMs, Math.round(anchor.endMs));
    const driftBeforeMs = (Math.abs(link.startMs - targetStartMs) + Math.abs(link.endMs - targetEndMs)) / 2;
    if (driftBeforeMs <= maxDriftMs) {
      skippedCount += 1;
      continue;
    }
    const nextStart = mode === 'fit_to_segment'
      ? targetStartMs
      : (Math.round((link.startMs + targetStartMs) / 2));
    const nextEnd = mode === 'fit_to_segment'
      ? targetEndMs
      : Math.max(nextStart, Math.round((link.endMs + targetEndMs) / 2));
    const driftAfterMs = (Math.abs(nextStart - targetStartMs) + Math.abs(nextEnd - targetEndMs)) / 2;
    measuredCount += 1;
    measuredDriftBeforeMs += driftBeforeMs;
    measuredDriftAfterMs += driftAfterMs;

    const existingTokenTimeline = (() => {
      try {
        return normalizeTokenTimeline(JSON.parse(link.tokenTimelineJson || '[]'));
      } catch {
        return [];
      }
    })();
    const syncScore = driftAfterMs <= 250 ? 0.95 : driftAfterMs <= 750 ? 0.82 : driftAfterMs <= 1200 ? 0.7 : 0.55;
    await updateTranscriptSyncLink({
      ...link,
      startMs: nextStart,
      endMs: nextEnd,
      syncScore,
      tokenTimelineJson: JSON.stringify(existingTokenTimeline),
      updatedAt: now
    });
    updatedCount += 1;
    changes.push({
      linkId: link.id,
      segmentId,
      startMsBefore: link.startMs,
      endMsBefore: link.endMs,
      startMsAfter: nextStart,
      endMsAfter: nextEnd,
      driftBeforeMs,
      driftAfterMs
    });
  }

  await recordAuditEvent({
    request,
    projectId,
    action: 'transcript_sync.auto_align',
    entityType: 'transcript_sync_link',
    entityId: mediaSourceId,
    details: {
      mediaSourceId,
      mode,
      maxDriftMs,
      updatedCount,
      skippedCount
    }
  });

  return ok({
    alignment: {
      mediaSourceId,
      mode,
      maxDriftMs,
      updatedCount,
      skippedCount,
      avgDriftBeforeMs: measuredCount > 0 ? measuredDriftBeforeMs / measuredCount : null,
      avgDriftAfterMs: measuredCount > 0 ? measuredDriftAfterMs / measuredCount : null,
      changes: changes.slice(0, 120)
    }
  });
});

server.post('/transcript-sync-links/diarization-corrections', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    mediaSourceId: string;
    replacements: Array<{ fromLabel: string; toLabel: string }>;
    linkIds: string[];
    maxConfidence: number;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const mediaSourceId = typeof body.mediaSourceId === 'string' && body.mediaSourceId.trim() ? body.mediaSourceId.trim() : '';
  if (!mediaSourceId) {
    return reply.status(400).send(fail('INVALID', 'mediaSourceId is required.'));
  }
  const replacements = Array.isArray(body.replacements)
    ? body.replacements
      .map((item) => ({
        fromLabel: typeof item?.fromLabel === 'string' ? item.fromLabel.trim() : '',
        toLabel: typeof item?.toLabel === 'string' ? item.toLabel.trim() : ''
      }))
      .filter((item) => item.toLabel)
    : [];
  if (replacements.length === 0) {
    return reply.status(400).send(fail('INVALID', 'At least one speaker replacement is required.'));
  }
  const normalizeSpeakerKey = (value: string): string => {
    const normalized = value.trim().toLowerCase();
    return normalized ? normalized : '__unlabeled__';
  };
  const replacementMap = new Map<string, string>();
  for (const replacement of replacements) {
    replacementMap.set(normalizeSpeakerKey(replacement.fromLabel), replacement.toLabel);
  }
  const linkIdSet = Array.isArray(body.linkIds)
    ? new Set(body.linkIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim()))
    : null;
  const maxConfidence = parseOptionalBoundedNumber(body.maxConfidence, 0, 1);
  const now = new Date().toISOString();
  const links = (await listTranscriptSyncLinks(projectId))
    .filter((link) => link.mediaSourceId === mediaSourceId);
  const updatedLinks: Array<{ id: string; speakerLabel: string; confidence: number | null }> = [];
  let skippedByConfidence = 0;
  let unmatchedLabelCount = 0;

  for (const link of links) {
    if (linkIdSet && linkIdSet.size > 0 && !linkIdSet.has(link.id)) continue;
    if (maxConfidence !== null && typeof link.confidence === 'number' && Number.isFinite(link.confidence) && link.confidence > maxConfidence) {
      skippedByConfidence += 1;
      continue;
    }
    const currentSpeakerLabel = typeof link.speakerLabel === 'string' ? link.speakerLabel.trim() : '';
    const targetSpeakerLabel = replacementMap.get(normalizeSpeakerKey(currentSpeakerLabel));
    if (!targetSpeakerLabel) {
      unmatchedLabelCount += 1;
      continue;
    }
    if (targetSpeakerLabel === currentSpeakerLabel) continue;
    const existingTokenTimeline = (() => {
      try {
        return normalizeTokenTimeline(JSON.parse(link.tokenTimelineJson || '[]'));
      } catch {
        return [];
      }
    })();
    const remappedTokenTimeline = existingTokenTimeline.map((token) => {
      const tokenSpeaker = typeof token.speakerLabel === 'string' ? token.speakerLabel.trim() : '';
      const mappedSpeaker = replacementMap.get(normalizeSpeakerKey(tokenSpeaker));
      if (!mappedSpeaker) return token;
      return {
        ...token,
        speakerLabel: mappedSpeaker
      };
    });
    await updateTranscriptSyncLink({
      ...link,
      speakerLabel: targetSpeakerLabel,
      tokenTimelineJson: JSON.stringify(remappedTokenTimeline),
      updatedAt: now
    });
    updatedLinks.push({
      id: link.id,
      speakerLabel: targetSpeakerLabel,
      confidence: link.confidence
    });
  }

  await recordAuditEvent({
    request,
    projectId,
    action: 'transcript_sync.diarization_correction',
    entityType: 'transcript_sync_link',
    entityId: mediaSourceId,
    details: {
      mediaSourceId,
      replacementCount: replacements.length,
      updatedCount: updatedLinks.length,
      skippedByConfidence,
      unmatchedLabelCount,
      maxConfidence
    }
  });

  return ok({
    correction: {
      mediaSourceId,
      replacementCount: replacements.length,
      updatedCount: updatedLinks.length,
      skippedByConfidence,
      unmatchedLabelCount,
      maxConfidence,
      sample: updatedLinks.slice(0, 120)
    }
  });
});

server.get('/coding-assignments', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as {
    projectId?: string;
    status?: string;
    assigneeUsername?: string;
  };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const status = query.status === 'todo' || query.status === 'in_progress' || query.status === 'blocked' || query.status === 'done'
    ? query.status
    : undefined;
  let assigneeUserId: string | undefined;
  if (typeof query.assigneeUsername === 'string' && query.assigneeUsername.trim()) {
    const assignee = await findUserByUsername(normalizeMuUsername(query.assigneeUsername));
    if (!assignee) {
      return ok({ items: [], total: 0 });
    }
    assigneeUserId = assignee.user.id;
  }
  const items = await listCodingAssignments(projectId, { status, assigneeUserId });
  return ok({ items, total: items.length });
});

server.post('/coding-assignments', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    title: string;
    description: string;
    sourceId: string | null;
    codeId: string | null;
    caseId: string | null;
    assigneeUsername: string | null;
    status: string;
    priority: string;
    dueAt: string | null;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return reply.status(400).send(fail('INVALID', 'title is required.'));
  }

  let assigneeUserId: string | null = null;
  let assigneeUsername: string | null = null;
  if (typeof body.assigneeUsername === 'string' && body.assigneeUsername.trim()) {
    const assignee = await findUserByUsername(normalizeMuUsername(body.assigneeUsername));
    if (!assignee) {
      return reply.status(400).send(fail('INVALID', 'assigneeUsername was not found.'));
    }
    assigneeUserId = assignee.user.id;
    assigneeUsername = assignee.user.username;
  }
  const timestamp = new Date().toISOString();
  const createdByUsername = request.session.username ?? 'system';
  const status = parseCodingAssignmentStatus(body.status);
  const task = await insertCodingAssignment({
    id: `assignment-${randomUUID()}`,
    projectId,
    title,
    description: typeof body.description === 'string' ? body.description : '',
    sourceId: typeof body.sourceId === 'string' && body.sourceId.trim() ? body.sourceId.trim() : null,
    codeId: typeof body.codeId === 'string' && body.codeId.trim() ? body.codeId.trim() : null,
    caseId: typeof body.caseId === 'string' && body.caseId.trim() ? body.caseId.trim() : null,
    assigneeUserId,
    assigneeUsername,
    status,
    priority: parseCodingAssignmentPriority(body.priority),
    dueAt: parseOptionalIsoDate(body.dueAt),
    createdByUserId: userId,
    createdByUsername,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: status === 'done' ? timestamp : null
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'coding_assignment.create',
    entityType: 'coding_assignment',
    entityId: task.id,
    details: {
      title: task.title,
      status: task.status,
      priority: task.priority,
      assigneeUsername: task.assigneeUsername
    }
  });
  reply.code(201);
  return ok({ task });
});

server.patch('/coding-assignments/:taskId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = request.params as { taskId: string };
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    title: string;
    description: string;
    sourceId: string | null;
    codeId: string | null;
    caseId: string | null;
    assigneeUsername: string | null;
    status: string;
    priority: string;
    dueAt: string | null;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const taskId = typeof params.taskId === 'string' ? params.taskId.trim() : '';
  if (!taskId) {
    return reply.status(400).send(fail('INVALID', 'taskId is required.'));
  }
  const existing = await getCodingAssignment(taskId, projectId);
  if (!existing) {
    return reply.status(404).send(fail('NOT_FOUND', 'Coding assignment not found.'));
  }

  let assigneeUserId = existing.assigneeUserId;
  let assigneeUsername = existing.assigneeUsername;
  if (body.assigneeUsername !== undefined) {
    if (typeof body.assigneeUsername === 'string' && body.assigneeUsername.trim()) {
      const assignee = await findUserByUsername(normalizeMuUsername(body.assigneeUsername));
      if (!assignee) {
        return reply.status(400).send(fail('INVALID', 'assigneeUsername was not found.'));
      }
      assigneeUserId = assignee.user.id;
      assigneeUsername = assignee.user.username;
    } else {
      assigneeUserId = null;
      assigneeUsername = null;
    }
  }

  const status = body.status !== undefined
    ? parseCodingAssignmentStatus(body.status)
    : existing.status;
  const now = new Date().toISOString();
  const task = await updateCodingAssignment({
    ...existing,
    title: body.title !== undefined ? String(body.title).trim() || existing.title : existing.title,
    description: body.description !== undefined ? String(body.description) : existing.description,
    sourceId: body.sourceId !== undefined
      ? (typeof body.sourceId === 'string' && body.sourceId.trim() ? body.sourceId.trim() : null)
      : existing.sourceId,
    codeId: body.codeId !== undefined
      ? (typeof body.codeId === 'string' && body.codeId.trim() ? body.codeId.trim() : null)
      : existing.codeId,
    caseId: body.caseId !== undefined
      ? (typeof body.caseId === 'string' && body.caseId.trim() ? body.caseId.trim() : null)
      : existing.caseId,
    assigneeUserId,
    assigneeUsername,
    status,
    priority: body.priority !== undefined ? parseCodingAssignmentPriority(body.priority) : existing.priority,
    dueAt: body.dueAt !== undefined ? parseOptionalIsoDate(body.dueAt) : existing.dueAt,
    updatedAt: now,
    completedAt: status === 'done' ? (existing.completedAt ?? now) : null
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'coding_assignment.update',
    entityType: 'coding_assignment',
    entityId: task.id,
    details: {
      status: task.status,
      priority: task.priority,
      assigneeUsername: task.assigneeUsername
    }
  });
  return ok({ task });
});

server.delete('/coding-assignments/:taskId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = request.params as { taskId: string };
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const taskId = typeof params.taskId === 'string' ? params.taskId.trim() : '';
  if (!taskId) return reply.status(400).send(fail('INVALID', 'taskId is required.'));
  const removed = await deleteCodingAssignment(taskId, projectId);
  if (!removed) return reply.status(404).send(fail('NOT_FOUND', 'Coding assignment not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'coding_assignment.delete',
    entityType: 'coding_assignment',
    entityId: taskId,
    details: {}
  });
  return ok({ removed: true });
});

server.get('/coding-calibration-sessions', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    status: string;
    limit: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const status = query.status ? parseCodingCalibrationStatus(query.status) : undefined;
  const limit = parsePositiveInteger(query.limit, 200, 1, 2000);
  const items = await listCodingCalibrationSessions(projectId, { status, limit });
  return ok({
    items: items.map((item) => ({
      ...item,
      scope: (() => {
        try {
          return JSON.parse(item.scopeJson);
        } catch {
          return {};
        }
      })(),
      sampleSegmentIds: (() => {
        try {
          const parsed = JSON.parse(item.sampleSegmentIdsJson);
          return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
        } catch {
          return [];
        }
      })(),
      latestResult: (() => {
        try {
          const parsed = JSON.parse(item.latestResultJson);
          return typeof parsed === 'object' && parsed ? parsed : {};
        } catch {
          return {};
        }
      })()
    })),
    total: items.length
  });
});

server.post('/coding-calibration-sessions', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    label: string;
    scope: unknown;
    targetCodeId: string | null;
    coderAId: string | null;
    coderBId: string | null;
    sampleSize: number;
    targetAgreement: number;
    targetKappa: number;
    minSamples: number;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : '';
  if (!label) {
    return reply.status(400).send(fail('INVALID', 'label is required.'));
  }

  const scope = typeof body.scope === 'object' && body.scope ? body.scope : {};
  const sampleSize = parsePositiveInteger(body.sampleSize, 40, 5, 500);
  const targetAgreement = parseOptionalBoundedNumber(body.targetAgreement, 0, 1) ?? 0.8;
  const targetKappa = parseOptionalBoundedNumber(body.targetKappa, -1, 1) ?? 0.7;
  const minSamples = parsePositiveInteger(body.minSamples, 25, 5, 500);
  const timestamp = new Date().toISOString();

  const session = await insertCodingCalibrationSession({
    id: `calibration-${randomUUID()}`,
    projectId,
    label,
    scopeJson: JSON.stringify({ ...scope, sampleSize }),
    targetCodeId: typeof body.targetCodeId === 'string' && body.targetCodeId.trim() ? body.targetCodeId.trim() : null,
    coderAId: typeof body.coderAId === 'string' && body.coderAId.trim() ? body.coderAId.trim() : null,
    coderBId: typeof body.coderBId === 'string' && body.coderBId.trim() ? body.coderBId.trim() : null,
    sampleSegmentIdsJson: '[]',
    status: 'draft',
    targetAgreement,
    targetKappa,
    minSamples,
    latestResultJson: '{}',
    createdByUserId: userId,
    createdByUsername: request.session.username ?? 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'coding_calibration.create',
    entityType: 'coding_calibration',
    entityId: session.id,
    details: {
      label: session.label,
      targetCodeId: session.targetCodeId,
      targetAgreement: session.targetAgreement,
      targetKappa: session.targetKappa,
      minSamples: session.minSamples
    }
  });
  reply.code(201);
  return ok({
    session: {
      ...session,
      scope: JSON.parse(session.scopeJson),
      sampleSegmentIds: [],
      latestResult: {}
    }
  });
});

server.post('/coding-calibration-sessions/:sessionId/run', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = request.params as { sessionId: string };
  const body = (request.body ?? {}) as Partial<{ projectId: string; sampleSize: number }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId.trim() : '';
  if (!sessionId) {
    return reply.status(400).send(fail('INVALID', 'sessionId is required.'));
  }
  const session = await getCodingCalibrationSession(sessionId, projectId);
  if (!session) {
    return reply.status(404).send(fail('NOT_FOUND', 'Coding calibration session not found.'));
  }

  let scope: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(session.scopeJson || '{}');
    if (parsed && typeof parsed === 'object') scope = parsed as Record<string, unknown>;
  } catch {
    scope = {};
  }
  const evidenceQuery = parseEvidenceQuery(scope as Record<string, unknown>);
  const payload = await buildQualitativeProjectPayload(projectId);
  const retrieval = retrieveEvidence({
    query: evidenceQuery,
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos
  });
  const sampleSize = parsePositiveInteger(
    body.sampleSize ?? (scope.sampleSize as string | number | undefined) ?? session.minSamples,
    session.minSamples,
    5,
    500
  );
  const sampledSegmentIds = [...new Set(retrieval.map((match) => match.segment.id))].slice(0, sampleSize);
  const fallbackSegmentIds = payload.segments.slice(0, sampleSize).map((segment) => segment.id);
  const scopedSegmentIds = sampledSegmentIds.length > 0 ? sampledSegmentIds : fallbackSegmentIds;
  const scopedSegmentIdSet = new Set(scopedSegmentIds);
  const scopedSegments = payload.segments.filter((segment) => scopedSegmentIdSet.has(segment.id));
  const scopedApplications = payload.codeApplications.filter((application) => scopedSegmentIdSet.has(application.segmentId));

  const coderCounts = new Map<string, number>();
  for (const application of scopedApplications) {
    coderCounts.set(application.coderId, (coderCounts.get(application.coderId) ?? 0) + 1);
  }
  const rankedCoders = [...coderCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([coderId]) => coderId);
  const coderA = session.coderAId ?? rankedCoders[0] ?? null;
  const coderB = session.coderBId ?? rankedCoders.find((coderId) => coderId !== coderA) ?? null;

  const targetCodeId = session.targetCodeId
    ?? (typeof evidenceQuery.codeId === 'string' && evidenceQuery.codeId.trim() ? evidenceQuery.codeId.trim() : null)
    ?? (() => {
      const codeCounts = new Map<string, number>();
      for (const application of scopedApplications) {
        codeCounts.set(application.codeId, (codeCounts.get(application.codeId) ?? 0) + 1);
      }
      return [...codeCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
    })();
  if (!targetCodeId) {
    return reply.status(400).send(fail('INVALID', 'Calibration run requires at least one coded segment in scope.'));
  }
  if (!coderA || !coderB || coderA === coderB) {
    return reply.status(400).send(fail('INVALID', 'Calibration run requires at least two coders in scope.'));
  }

  const scopedComparisonQuery = {
    ...evidenceQuery,
    sourceId: undefined,
    caseId: evidenceQuery.caseId
  };
  const comparison = buildCodingComparison({
    query: scopedComparisonQuery,
    codeId: targetCodeId,
    coderA,
    coderB,
    sources: payload.sources,
    segments: scopedSegments,
    applications: scopedApplications,
    cases: payload.cases,
    memos: payload.memos,
    codes: payload.codes
  });
  const summary = buildInterRaterSummary({
    query: scopedComparisonQuery,
    coderA,
    coderB,
    sources: payload.sources,
    segments: scopedSegments,
    applications: scopedApplications,
    cases: payload.cases,
    memos: payload.memos,
    codes: payload.codes
  });

  const agreementPass = (comparison.percentAgreement ?? 0) >= session.targetAgreement;
  const kappaPass = (comparison.cohensKappa ?? -1) >= session.targetKappa;
  const samplePass = comparison.universeSegmentCount >= session.minSamples;
  const overallPass = agreementPass && kappaPass && samplePass;
  const recommendations: string[] = [];
  if (!samplePass) {
    recommendations.push(`Increase coded overlap to at least ${session.minSamples} shared segments.`);
  }
  if (!agreementPass) {
    recommendations.push('Review and tighten the codebook definitions before final merge.');
  }
  if (!kappaPass) {
    recommendations.push('Run disagreement adjudication on the top diverging codes, then re-run calibration.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Calibration thresholds met. Proceed to broader coding rollout.');
  }

  const timestamp = new Date().toISOString();
  const latestResult = {
    sampleSizeRequested: sampleSize,
    sampledSegmentCount: scopedSegmentIds.length,
    sampledSegmentIds: scopedSegmentIds,
    targetCodeId,
    coderA,
    coderB,
    thresholds: {
      targetAgreement: session.targetAgreement,
      targetKappa: session.targetKappa,
      minSamples: session.minSamples
    },
    checks: {
      agreementPass,
      kappaPass,
      samplePass,
      overallPass
    },
    comparison,
    summary,
    recommendations
  };
  const updatedSession = await updateCodingCalibrationSession({
    ...session,
    targetCodeId,
    coderAId: coderA,
    coderBId: coderB,
    sampleSegmentIdsJson: JSON.stringify(scopedSegmentIds),
    status: 'completed',
    latestResultJson: JSON.stringify(latestResult),
    updatedAt: timestamp,
    completedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'coding_calibration.run',
    entityType: 'coding_calibration',
    entityId: updatedSession.id,
    details: {
      sampledSegmentCount: scopedSegmentIds.length,
      targetCodeId,
      coderA,
      coderB,
      overallPass
    }
  });
  return ok({
    session: {
      ...updatedSession,
      scope,
      sampleSegmentIds: scopedSegmentIds,
      latestResult
    }
  });
});

server.patch('/coding-calibration-sessions/:sessionId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = request.params as { sessionId: string };
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    label: string;
    status: string;
    scope: unknown;
    targetCodeId: string | null;
    coderAId: string | null;
    coderBId: string | null;
    targetAgreement: number;
    targetKappa: number;
    minSamples: number;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId.trim() : '';
  if (!sessionId) return reply.status(400).send(fail('INVALID', 'sessionId is required.'));
  const existing = await getCodingCalibrationSession(sessionId, projectId);
  if (!existing) {
    return reply.status(404).send(fail('NOT_FOUND', 'Coding calibration session not found.'));
  }
  const status = body.status !== undefined ? parseCodingCalibrationStatus(body.status) : existing.status;
  const updatedAt = new Date().toISOString();
  const updated = await updateCodingCalibrationSession({
    ...existing,
    label: body.label !== undefined && String(body.label).trim() ? String(body.label).trim() : existing.label,
    scopeJson: body.scope !== undefined
      ? JSON.stringify(typeof body.scope === 'object' && body.scope ? body.scope : {})
      : existing.scopeJson,
    targetCodeId: body.targetCodeId !== undefined
      ? (typeof body.targetCodeId === 'string' && body.targetCodeId.trim() ? body.targetCodeId.trim() : null)
      : existing.targetCodeId,
    coderAId: body.coderAId !== undefined
      ? (typeof body.coderAId === 'string' && body.coderAId.trim() ? body.coderAId.trim() : null)
      : existing.coderAId,
    coderBId: body.coderBId !== undefined
      ? (typeof body.coderBId === 'string' && body.coderBId.trim() ? body.coderBId.trim() : null)
      : existing.coderBId,
    status,
    targetAgreement: body.targetAgreement !== undefined
      ? (parseOptionalBoundedNumber(body.targetAgreement, 0, 1) ?? existing.targetAgreement)
      : existing.targetAgreement,
    targetKappa: body.targetKappa !== undefined
      ? (parseOptionalBoundedNumber(body.targetKappa, -1, 1) ?? existing.targetKappa)
      : existing.targetKappa,
    minSamples: body.minSamples !== undefined
      ? parsePositiveInteger(body.minSamples, existing.minSamples, 5, 500)
      : existing.minSamples,
    updatedAt,
    completedAt: status === 'completed' ? (existing.completedAt ?? updatedAt) : status === 'draft' || status === 'running' ? null : existing.completedAt
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'coding_calibration.update',
    entityType: 'coding_calibration',
    entityId: updated.id,
    details: {
      status: updated.status,
      targetCodeId: updated.targetCodeId
    }
  });
  return ok({
    session: {
      ...updated,
      scope: JSON.parse(updated.scopeJson),
      sampleSegmentIds: JSON.parse(updated.sampleSegmentIdsJson || '[]'),
      latestResult: JSON.parse(updated.latestResultJson || '{}')
    }
  });
});

server.get('/merge-review/governance-policy', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const policy = await getCodingMergeGovernancePolicy(projectId);
  return ok({ policy });
});

server.put('/merge-review/governance-policy', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    expectedUpdatedAt: string;
    requireResolutionNote: boolean | string;
    restrictResolutionToOwnerOrProfessor: boolean | string;
    requireSecondReviewerForHighRisk: boolean | string;
    highRiskMinCoderCount: number | string;
    highRiskMinConfidenceSpread: number | string;
    requiredApprovalCountForHighRisk: number | string;
    approvalExpiryHours: number | string;
    defaultTriageSlaHours: number | string;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectOwnerOrProfessor(request, userId, projectId, reply)) return;
  const existing = await getCodingMergeGovernancePolicy(projectId);
  if (!assertOptimisticTimestamp(reply, {
    expectedValue: body.expectedUpdatedAt,
    currentValue: existing.updatedAt,
    label: 'Merge governance policy'
  })) return;
  const updated = await upsertCodingMergeGovernancePolicy({
    projectId,
    requireResolutionNote: parseBooleanFlag(body.requireResolutionNote, existing.requireResolutionNote),
    restrictResolutionToOwnerOrProfessor: parseBooleanFlag(body.restrictResolutionToOwnerOrProfessor, existing.restrictResolutionToOwnerOrProfessor),
    requireSecondReviewerForHighRisk: parseBooleanFlag(body.requireSecondReviewerForHighRisk, existing.requireSecondReviewerForHighRisk),
    highRiskMinCoderCount: parsePositiveInteger(body.highRiskMinCoderCount, existing.highRiskMinCoderCount, 1, 20),
    highRiskMinConfidenceSpread: parseOptionalBoundedNumber(body.highRiskMinConfidenceSpread, 0, 1) ?? existing.highRiskMinConfidenceSpread,
    requiredApprovalCountForHighRisk: parsePositiveInteger(body.requiredApprovalCountForHighRisk, existing.requiredApprovalCountForHighRisk, 1, 5),
    approvalExpiryHours: parsePositiveInteger(body.approvalExpiryHours, existing.approvalExpiryHours, 1, 720),
    defaultTriageSlaHours: parsePositiveInteger(body.defaultTriageSlaHours, existing.defaultTriageSlaHours, 1, 720),
    updatedAt: new Date().toISOString(),
    updatedByUserId: userId
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'merge_review.policy_update',
    entityType: 'merge_review_policy',
    entityId: projectId,
    details: updated
  });
  return ok({ policy: updated });
});

server.get('/merge-review/triage', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    status: string;
    severity: string;
    assigneeUsername: string;
    limit: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  let assigneeUserId: string | undefined;
  if (typeof query.assigneeUsername === 'string' && query.assigneeUsername.trim()) {
    const found = await findUserByUsername(normalizeMuUsername(query.assigneeUsername));
    if (!found) return ok({ items: [], total: 0 });
    assigneeUserId = found.user.id;
  }
  const status = typeof query.status === 'string' && query.status.trim()
    ? parseCodingConflictTriageStatus(query.status)
    : undefined;
  const severity = typeof query.severity === 'string' && query.severity.trim()
    ? parseCodingConflictTriageSeverity(query.severity)
    : undefined;
  const limit = parsePositiveInteger(query.limit, 500, 1, 5000);
  const items = await listCodingConflictTriages(projectId, { status, severity, assigneeUserId, limit });
  return ok({
    items: items.map((item) => ({
      ...item,
      labels: (() => {
        try {
          const parsed = JSON.parse(item.labelsJson);
          return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
        } catch {
          return [];
        }
      })(),
      metadata: (() => {
        try {
          const parsed = JSON.parse(item.metadataJson);
          return typeof parsed === 'object' && parsed ? parsed : {};
        } catch {
          return {};
        }
      })()
    })),
    total: items.length
  });
});

server.post('/merge-review/triage', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    segmentId: string;
    codeId: string;
    expectedUpdatedAt: string;
    status: string;
    severity: string;
    assigneeUsername: string | null;
    reviewerUsername: string | null;
    dueAt: string | null;
    triageNote: string;
    labels: string[] | string;
    metadata: unknown;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const segmentId = typeof body.segmentId === 'string' && body.segmentId.trim() ? body.segmentId.trim() : '';
  const codeId = typeof body.codeId === 'string' && body.codeId.trim() ? body.codeId.trim() : '';
  if (!segmentId || !codeId) {
    return reply.status(400).send(fail('INVALID', 'segmentId and codeId are required.'));
  }

  const existing = await getCodingConflictTriage(projectId, segmentId, codeId);
  const expectedUpdatedAt = parseProvidedIsoDate(body.expectedUpdatedAt);
  if (expectedUpdatedAt === null) {
    return reply.status(400).send(fail('INVALID', 'merge triage expectedUpdatedAt must be a valid ISO date when provided.'));
  }
  if (expectedUpdatedAt && !existing) {
    return reply.status(409).send(fail('CONFLICT', 'Merge triage row no longer exists. Refresh and retry.'));
  }
  if (existing && !assertOptimisticTimestamp(reply, {
    expectedValue: body.expectedUpdatedAt,
    currentValue: existing.updatedAt,
    label: 'Merge triage'
  })) return;
  const assigneeUsernameRaw = body.assigneeUsername === null ? '' : (typeof body.assigneeUsername === 'string' ? body.assigneeUsername.trim() : '');
  const reviewerUsernameRaw = body.reviewerUsername === null ? '' : (typeof body.reviewerUsername === 'string' ? body.reviewerUsername.trim() : '');

  let assigneeUserId: string | null = existing?.assigneeUserId ?? null;
  if (body.assigneeUsername !== undefined) {
    if (!assigneeUsernameRaw) {
      assigneeUserId = null;
    } else {
      const assignee = await findUserByUsername(normalizeMuUsername(assigneeUsernameRaw));
      if (!assignee) {
        return reply.status(400).send(fail('INVALID', 'assigneeUsername was not found.'));
      }
      assigneeUserId = assignee.user.id;
    }
  }

  let reviewerUserId: string | null = existing?.reviewerUserId ?? null;
  if (body.reviewerUsername !== undefined) {
    if (!reviewerUsernameRaw) {
      reviewerUserId = null;
    } else {
      const reviewer = await findUserByUsername(normalizeMuUsername(reviewerUsernameRaw));
      if (!reviewer) {
        return reply.status(400).send(fail('INVALID', 'reviewerUsername was not found.'));
      }
      reviewerUserId = reviewer.user.id;
    }
  }

  const timestamp = new Date().toISOString();
  const item = await upsertCodingConflictTriage({
    id: existing?.id ?? `triage-${randomUUID()}`,
    projectId,
    segmentId,
    codeId,
    status: body.status !== undefined ? parseCodingConflictTriageStatus(body.status) : (existing?.status ?? 'open'),
    severity: body.severity !== undefined ? parseCodingConflictTriageSeverity(body.severity) : (existing?.severity ?? 'medium'),
    assigneeUserId,
    assigneeUsername: null,
    reviewerUserId,
    reviewerUsername: null,
    dueAt: body.dueAt !== undefined ? parseOptionalIsoDate(body.dueAt) : (existing?.dueAt ?? null),
    triageNote: body.triageNote !== undefined ? String(body.triageNote ?? '') : (existing?.triageNote ?? ''),
    labelsJson: body.labels !== undefined
      ? JSON.stringify(parseStringArray(body.labels))
      : (existing?.labelsJson ?? '[]'),
    metadataJson: body.metadata !== undefined
      ? JSON.stringify(typeof body.metadata === 'object' && body.metadata ? body.metadata : {})
      : (existing?.metadataJson ?? '{}'),
    createdByUserId: existing?.createdByUserId ?? userId,
    createdByUsername: existing?.createdByUsername ?? (request.session.username ?? 'system'),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'merge_review.triage',
    entityType: 'merge_review_triage',
    entityId: `${segmentId}:${codeId}`,
    details: {
      status: item.status,
      severity: item.severity,
      assigneeUserId: item.assigneeUserId,
      reviewerUserId: item.reviewerUserId,
      dueAt: item.dueAt
    }
  });
  return ok({
    triage: {
      ...item,
      labels: (() => {
        try {
          const parsed = JSON.parse(item.labelsJson);
          return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
        } catch {
          return [];
        }
      })(),
      metadata: (() => {
        try {
          const parsed = JSON.parse(item.metadataJson);
          return typeof parsed === 'object' && parsed ? parsed : {};
        } catch {
          return {};
        }
      })()
    }
  });
});

server.get('/merge-review/approvals', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    segmentId: string;
    codeId: string;
    includeUsed: string;
    includeRevoked: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const segmentId = typeof query.segmentId === 'string' && query.segmentId.trim() ? query.segmentId.trim() : undefined;
  const codeId = typeof query.codeId === 'string' && query.codeId.trim() ? query.codeId.trim() : undefined;
  const items = await listCodingMergeApprovals(projectId, {
    segmentId,
    codeId,
    includeUsed: query.includeUsed === 'true',
    includeRevoked: query.includeRevoked === 'true',
    limit: 2000
  });
  return ok({ items, total: items.length });
});

server.post('/merge-review/approve', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    segmentId: string;
    codeId: string;
    note: string;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const segmentId = typeof body.segmentId === 'string' && body.segmentId.trim() ? body.segmentId.trim() : '';
  const codeId = typeof body.codeId === 'string' && body.codeId.trim() ? body.codeId.trim() : '';
  if (!segmentId || !codeId) {
    return reply.status(400).send(fail('INVALID', 'segmentId and codeId are required.'));
  }
  const timestamp = new Date().toISOString();
  const approval = await upsertCodingMergeApproval({
    id: `approval-${randomUUID()}`,
    projectId,
    segmentId,
    codeId,
    approvedByUserId: userId,
    approvedByUsername: request.session.username ?? 'system',
    note: typeof body.note === 'string' ? body.note.trim() : '',
    createdAt: timestamp,
    usedAt: null,
    revokedAt: null
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'merge_review.approve',
    entityType: 'merge_review_approval',
    entityId: `${segmentId}:${codeId}:${approval.approvedByUsername}`,
    details: { note: approval.note }
  });
  return ok({ approval });
});

server.post('/merge-review/revoke-approval', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    segmentId: string;
    codeId: string;
    approvedByUsername: string;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const segmentId = typeof body.segmentId === 'string' && body.segmentId.trim() ? body.segmentId.trim() : '';
  const codeId = typeof body.codeId === 'string' && body.codeId.trim() ? body.codeId.trim() : '';
  const approvedByUsername = typeof body.approvedByUsername === 'string' && body.approvedByUsername.trim()
    ? body.approvedByUsername.trim()
    : '';
  if (!segmentId || !codeId || !approvedByUsername) {
    return reply.status(400).send(fail('INVALID', 'projectId, segmentId, codeId, and approvedByUsername are required.'));
  }

  const isSelf = approvedByUsername === (request.session.username ?? 'system');
  if (!isSelf && !await assertProjectOwnerOrProfessor(request, userId, projectId, reply)) return;
  const revoked = await revokeCodingMergeApproval({
    projectId,
    segmentId,
    codeId,
    approvedByUsername,
    revokedAt: new Date().toISOString()
  });
  if (!revoked) return reply.status(404).send(fail('NOT_FOUND', 'Approval was not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'merge_review.approval_revoke',
    entityType: 'merge_review_approval',
    entityId: `${segmentId}:${codeId}:${approvedByUsername}`,
    details: {}
  });
  return ok({ revoked: true });
});

server.get('/merge-review/history', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as {
    projectId?: string;
    segmentId?: string;
    codeId?: string;
    limit?: string;
  };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listCodingConflictResolutions(projectId, {
    segmentId: typeof query.segmentId === 'string' && query.segmentId.trim() ? query.segmentId.trim() : undefined,
    codeId: typeof query.codeId === 'string' && query.codeId.trim() ? query.codeId.trim() : undefined,
    limit: parsePositiveInteger(query.limit, 100, 1, 1000)
  });
  return ok({
    items: items.map((item) => ({
      ...item,
      removedApplicationIds: (() => {
        try {
          const parsed = JSON.parse(item.removedApplicationIdsJson);
          return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
        } catch {
          return [];
        }
      })(),
      metadata: (() => {
        try {
          const parsed = JSON.parse(item.metadataJson);
          return typeof parsed === 'object' && parsed ? parsed : {};
        } catch {
          return {};
        }
      })()
    })),
    total: items.length
  });
});

server.get('/merge-review', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as {
    projectId?: string;
    sourceId?: string;
    codeId?: string;
    minCoderCount?: string;
    minConfidenceSpread?: string;
    maxRows?: string;
    status?: string;
  };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const minCoderCount = parsePositiveInteger(query.minCoderCount, 2, 1, 20);
  const minConfidenceSpread = parseOptionalBoundedNumber(query.minConfidenceSpread, 0, 1) ?? 0.2;
  const maxRows = parsePositiveInteger(query.maxRows, 100, 1, 500);
  const statusFilter = parseMergeConflictStatusFilter(query.status);
  const payload = await buildQualitativeProjectPayload(projectId);
  const baseReview = buildMergeReview({
    projectId,
    sourceId: typeof query.sourceId === 'string' && query.sourceId.trim() ? query.sourceId.trim() : undefined,
    codeId: typeof query.codeId === 'string' && query.codeId.trim() ? query.codeId.trim() : undefined,
    minCoderCount,
    minConfidenceSpread,
    maxRows,
    segments: payload.segments,
    sources: payload.sources,
    applications: payload.codeApplications,
    codes: payload.codes
  });
  const governancePolicy = await getCodingMergeGovernancePolicy(projectId);
  const latestResolutions = await listLatestCodingConflictResolutions(projectId);
  const resolutionByKey = new Map(latestResolutions.map((item) => [`${item.segmentId}::${item.codeId}`, item]));
  const triageItems = await listCodingConflictTriages(projectId, { limit: 5000 });
  const triageByKey = new Map(triageItems.map((item) => [`${item.segmentId}::${item.codeId}`, item]));
  const approvals = await listCodingMergeApprovals(projectId, { limit: 5000 });
  const nowMs = Date.now();
  const approvalExpiryMs = Math.max(1, governancePolicy.approvalExpiryHours) * 60 * 60 * 1000;
  const approvalCountByKey = new Map<string, number>();
  for (const approval of approvals) {
    const createdAtMs = Date.parse(approval.createdAt);
    const isExpired = Number.isFinite(createdAtMs) && (nowMs - createdAtMs) > approvalExpiryMs;
    if (isExpired) continue;
    const key = `${approval.segmentId}::${approval.codeId}`;
    approvalCountByKey.set(key, (approvalCountByKey.get(key) ?? 0) + 1);
  }
  const withResolution = (baseReview.rows ?? []).map((row) => {
    const key = `${row.segmentId}::${row.codeId}`;
    const resolution = resolutionByKey.get(key) ?? null;
    const triage = triageByKey.get(key) ?? null;
    const coderCount = (row.coderIds ?? []).length;
    const isHighRisk = isHighRiskMergeConflict({
      coderCount,
      confidenceSpread: row.confidenceSpread,
      highRiskMinCoderCount: governancePolicy.highRiskMinCoderCount,
      highRiskMinConfidenceSpread: governancePolicy.highRiskMinConfidenceSpread
    });
    const activeApprovalCount = approvalCountByKey.get(key) ?? 0;
    const requiresSecondReviewer = governancePolicy.requireSecondReviewerForHighRisk && isHighRisk;
    const requiredApprovalCount = isHighRisk
      ? Math.max(
        requiresSecondReviewer ? 1 : 0,
        Math.max(1, governancePolicy.requiredApprovalCountForHighRisk)
      )
      : 0;
    return {
      ...row,
      triage: triage
        ? {
          id: triage.id,
          status: triage.status,
          severity: triage.severity,
          assigneeUserId: triage.assigneeUserId,
          assigneeUsername: triage.assigneeUsername,
          reviewerUserId: triage.reviewerUserId,
          reviewerUsername: triage.reviewerUsername,
          dueAt: triage.dueAt,
          triageNote: triage.triageNote,
          labels: (() => {
            try {
              const parsed = JSON.parse(triage.labelsJson);
              return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
            } catch {
              return [];
            }
          })(),
          updatedAt: triage.updatedAt
        }
        : null,
      resolution: resolution
        ? {
          id: resolution.id,
          status: resolution.status,
          keepMode: resolution.keepMode,
          keepApplicationId: resolution.keepApplicationId,
          keepCoderId: resolution.keepCoderId,
          removedCount: resolution.removedCount,
          note: resolution.resolutionNote,
          actorUsername: resolution.actorUsername,
          createdAt: resolution.createdAt,
          canRestore: resolution.status === 'resolved' && resolution.removedCount > 0
        }
        : null,
      risk: {
        defaultSeverity: row.defaultSeverity ?? deriveMergeConflictSeverity({ coderCount, confidenceSpread: row.confidenceSpread }),
        isHighRisk,
        requiresSecondReviewer,
        requiredApprovalCount,
        approvalExpiryHours: governancePolicy.approvalExpiryHours,
        activeApprovalCount,
        blockedByMissingApproval: requiredApprovalCount > 0 && activeApprovalCount < requiredApprovalCount
      }
    };
  });
  const filteredRows = withResolution.filter((row) => {
    const status = row.resolution?.status ?? 'open';
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return !row.resolution || status === 'reopened';
    return status === statusFilter;
  });
  const rows = filteredRows.slice(0, maxRows);
  return ok({
    review: {
      ...baseReview,
      statusFilter,
      filteredCount: filteredRows.length,
      availableRowsBeforeStatus: withResolution.length,
      governancePolicy,
      rows,
      returnedCount: rows.length
    }
  });
});

server.post('/merge-review/resolve', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    segmentId: string;
    codeId: string;
    keepMode: 'highest_confidence' | 'coder' | 'application';
    keepCoderId: string;
    keepApplicationId: string;
    resolutionNote: string;
    expectedTriageUpdatedAt: string;
    expectedPolicyUpdatedAt: string;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const segmentId = typeof body.segmentId === 'string' && body.segmentId.trim() ? body.segmentId.trim() : '';
  const codeId = typeof body.codeId === 'string' && body.codeId.trim() ? body.codeId.trim() : '';
  if (!segmentId || !codeId) {
    return reply.status(400).send(fail('INVALID', 'segmentId and codeId are required.'));
  }
  const keepMode = body.keepMode === 'coder' || body.keepMode === 'application' ? body.keepMode : 'highest_confidence';
  const keepCoderId = typeof body.keepCoderId === 'string' && body.keepCoderId.trim() ? body.keepCoderId.trim() : '';
  const keepApplicationId = typeof body.keepApplicationId === 'string' && body.keepApplicationId.trim() ? body.keepApplicationId.trim() : '';
  const resolutionNote = typeof body.resolutionNote === 'string' ? body.resolutionNote.trim() : '';
  const governancePolicy = await getCodingMergeGovernancePolicy(projectId);
  if (!assertOptimisticTimestamp(reply, {
    expectedValue: body.expectedPolicyUpdatedAt,
    currentValue: governancePolicy.updatedAt,
    label: 'Merge governance policy'
  })) return;
  const existingTriage = await getCodingConflictTriage(projectId, segmentId, codeId);
  const expectedTriageUpdatedAt = parseProvidedIsoDate(body.expectedTriageUpdatedAt);
  if (expectedTriageUpdatedAt === null) {
    return reply.status(400).send(fail('INVALID', 'merge triage expectedUpdatedAt must be a valid ISO date when provided.'));
  }
  if (expectedTriageUpdatedAt && !existingTriage) {
    return reply.status(409).send(fail('CONFLICT', 'Merge triage row no longer exists. Refresh and retry.'));
  }
  if (existingTriage && !assertOptimisticTimestamp(reply, {
    expectedValue: body.expectedTriageUpdatedAt,
    currentValue: existingTriage.updatedAt,
    label: 'Merge triage'
  })) return;
  if (governancePolicy.restrictResolutionToOwnerOrProfessor && !await assertProjectOwnerOrProfessor(request, userId, projectId, reply)) return;
  if (governancePolicy.requireResolutionNote && !resolutionNote) {
    return reply.status(400).send(fail('INVALID', 'resolutionNote is required by the merge governance policy.'));
  }
  const applications = await listCodeApplications(projectId, segmentId, codeId);
  if (applications.length < 2) {
    return reply.status(400).send(fail('INVALID', 'At least two code applications are required for merge resolution.'));
  }
  const coderCount = new Set(applications.map((application) => application.coderId)).size;
  const confidenceSpread = applications.length > 0
    ? Math.max(...applications.map((application) => application.confidence)) - Math.min(...applications.map((application) => application.confidence))
    : 0;
  const highRisk = isHighRiskMergeConflict({
    coderCount,
    confidenceSpread,
    highRiskMinCoderCount: governancePolicy.highRiskMinCoderCount,
    highRiskMinConfidenceSpread: governancePolicy.highRiskMinConfidenceSpread
  });
  const requiredApprovalCount = highRisk
    ? Math.max(
      governancePolicy.requireSecondReviewerForHighRisk ? 1 : 0,
      Math.max(1, governancePolicy.requiredApprovalCountForHighRisk)
    )
    : 0;
  if (requiredApprovalCount > 0) {
    const activeApprovals = await listCodingMergeApprovals(projectId, { segmentId, codeId, limit: 100 });
    const resolverUsername = request.session.username ?? 'system';
    const nowMs = Date.now();
    const expiryMs = Math.max(1, governancePolicy.approvalExpiryHours) * 60 * 60 * 1000;
    const validIndependentApprovals = activeApprovals.filter((approval) => {
      if (approval.approvedByUsername === resolverUsername) return false;
      const createdAtMs = Date.parse(approval.createdAt);
      if (!Number.isFinite(createdAtMs)) return true;
      return (nowMs - createdAtMs) <= expiryMs;
    });
    if (validIndependentApprovals.length < requiredApprovalCount) {
      return reply.status(400).send(fail('INVALID', `High-risk merge conflicts require ${requiredApprovalCount} independent approval(s) within ${governancePolicy.approvalExpiryHours} hour(s) before resolution.`));
    }
  }
  const sorted = [...applications].sort((left, right) => {
    if (right.confidence !== left.confidence) return right.confidence - left.confidence;
    return left.createdAt.localeCompare(right.createdAt);
  });

  let keep = sorted[0];
  if (keepMode === 'application') {
    const selected = sorted.find((application) => application.id === keepApplicationId);
    if (!selected) {
      return reply.status(400).send(fail('INVALID', 'keepApplicationId did not match a scoped code application.'));
    }
    keep = selected;
  } else if (keepMode === 'coder') {
    const byCoder = sorted.filter((application) => application.coderId === keepCoderId);
    if (!byCoder.length) {
      return reply.status(400).send(fail('INVALID', 'keepCoderId did not match a scoped coder for this segment/code pair.'));
    }
    keep = byCoder[0];
  }

  const toRemove = sorted.filter((application) => application.id !== keep.id);
  const timestamp = new Date().toISOString();
  const resolutionId = `merge-resolution-${randomUUID()}`;
  if (toRemove.length > 0) {
    await archiveCodeApplications({
      resolutionId,
      projectId,
      applications: toRemove,
      archivedAt: timestamp,
      archivedByUserId: userId,
      archivedByUsername: request.session.username ?? 'system'
    });
  }

  let removedCount = 0;
  for (const candidate of toRemove) {
    if (await deleteCodeApplication(candidate.id, projectId)) {
      removedCount += 1;
    }
  }

  await insertCodingConflictResolution({
    id: resolutionId,
    projectId,
    segmentId,
    codeId,
    status: 'resolved',
    keepMode,
    keepApplicationId: keep.id,
    keepCoderId: keep.coderId,
    removedApplicationIdsJson: JSON.stringify(toRemove.map((application) => application.id)),
    removedCount,
    resolutionNote,
    actorUserId: userId,
    actorUsername: request.session.username ?? 'system',
    metadataJson: JSON.stringify({
      applicationCountBefore: applications.length,
      applicationCountAfter: applications.length - removedCount,
      governance: {
        highRisk,
        coderCount,
        confidenceSpread,
        requireSecondReviewerForHighRisk: governancePolicy.requireSecondReviewerForHighRisk,
        requiredApprovalCountForHighRisk: governancePolicy.requiredApprovalCountForHighRisk,
        requiredApprovalCount,
        approvalExpiryHours: governancePolicy.approvalExpiryHours
      }
    }),
    createdAt: timestamp
  });
  if (requiredApprovalCount > 0 && highRisk) {
    await markCodingMergeApprovalsUsed({ projectId, segmentId, codeId, usedAt: timestamp });
  }
  await upsertCodingConflictTriage({
    id: existingTriage?.id ?? `triage-${randomUUID()}`,
    projectId,
    segmentId,
    codeId,
    status: 'resolved',
    severity: existingTriage?.severity ?? deriveMergeConflictSeverity({ coderCount, confidenceSpread }),
    assigneeUserId: existingTriage?.assigneeUserId ?? null,
    assigneeUsername: existingTriage?.assigneeUsername ?? null,
    reviewerUserId: existingTriage?.reviewerUserId ?? null,
    reviewerUsername: existingTriage?.reviewerUsername ?? null,
    dueAt: existingTriage?.dueAt ?? null,
    triageNote: resolutionNote || existingTriage?.triageNote || '',
    labelsJson: existingTriage?.labelsJson ?? '[]',
    metadataJson: JSON.stringify({
      ...(existingTriage ? (() => {
        try {
          const parsed = JSON.parse(existingTriage.metadataJson);
          return typeof parsed === 'object' && parsed ? parsed : {};
        } catch {
          return {};
        }
      })() : {}),
      lastResolutionId: resolutionId
    }),
    createdByUserId: existingTriage?.createdByUserId ?? userId,
    createdByUsername: existingTriage?.createdByUsername ?? (request.session.username ?? 'system'),
    createdAt: existingTriage?.createdAt ?? timestamp,
    updatedAt: timestamp
  });

  await recordAuditEvent({
    request,
    projectId,
    action: 'merge_review.resolve',
    entityType: 'merge_review',
    entityId: `${segmentId}:${codeId}`,
    details: {
      resolutionId,
      segmentId,
      codeId,
      keepMode,
      keepApplicationId: keep.id,
      keepCoderId: keep.coderId,
      removedCount,
      resolutionNote,
      highRisk,
      coderCount,
      confidenceSpread
    }
  });

  return ok({
    resolution: {
      id: resolutionId,
      status: 'resolved',
      segmentId,
      codeId,
      keptApplication: {
        id: keep.id,
        coderId: keep.coderId,
        confidence: keep.confidence
      },
      highRisk,
      removedApplicationIds: toRemove.map((application) => application.id),
      removedCount,
      resolutionNote
    }
  });
});

server.post('/merge-review/defer', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    segmentId: string;
    codeId: string;
    resolutionNote: string;
    expectedTriageUpdatedAt: string;
    expectedPolicyUpdatedAt: string;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const segmentId = typeof body.segmentId === 'string' && body.segmentId.trim() ? body.segmentId.trim() : '';
  const codeId = typeof body.codeId === 'string' && body.codeId.trim() ? body.codeId.trim() : '';
  if (!segmentId || !codeId) {
    return reply.status(400).send(fail('INVALID', 'segmentId and codeId are required.'));
  }
  const governancePolicy = await getCodingMergeGovernancePolicy(projectId);
  if (!assertOptimisticTimestamp(reply, {
    expectedValue: body.expectedPolicyUpdatedAt,
    currentValue: governancePolicy.updatedAt,
    label: 'Merge governance policy'
  })) return;
  const existingTriage = await getCodingConflictTriage(projectId, segmentId, codeId);
  const expectedTriageUpdatedAt = parseProvidedIsoDate(body.expectedTriageUpdatedAt);
  if (expectedTriageUpdatedAt === null) {
    return reply.status(400).send(fail('INVALID', 'merge triage expectedUpdatedAt must be a valid ISO date when provided.'));
  }
  if (expectedTriageUpdatedAt && !existingTriage) {
    return reply.status(409).send(fail('CONFLICT', 'Merge triage row no longer exists. Refresh and retry.'));
  }
  if (existingTriage && !assertOptimisticTimestamp(reply, {
    expectedValue: body.expectedTriageUpdatedAt,
    currentValue: existingTriage.updatedAt,
    label: 'Merge triage'
  })) return;
  const resolutionId = `merge-resolution-${randomUUID()}`;
  const resolutionNote = typeof body.resolutionNote === 'string' ? body.resolutionNote.trim() : '';
  const timestamp = new Date().toISOString();
  await insertCodingConflictResolution({
    id: resolutionId,
    projectId,
    segmentId,
    codeId,
    status: 'deferred',
    keepMode: null,
    keepApplicationId: null,
    keepCoderId: null,
    removedApplicationIdsJson: '[]',
    removedCount: 0,
    resolutionNote,
    actorUserId: userId,
    actorUsername: request.session.username ?? 'system',
    metadataJson: '{}',
    createdAt: timestamp
  });
  await upsertCodingConflictTriage({
    id: existingTriage?.id ?? `triage-${randomUUID()}`,
    projectId,
    segmentId,
    codeId,
    status: 'deferred',
    severity: existingTriage?.severity ?? 'medium',
    assigneeUserId: existingTriage?.assigneeUserId ?? null,
    assigneeUsername: existingTriage?.assigneeUsername ?? null,
    reviewerUserId: existingTriage?.reviewerUserId ?? null,
    reviewerUsername: existingTriage?.reviewerUsername ?? null,
    dueAt: existingTriage?.dueAt
      ?? new Date(Date.now() + governancePolicy.defaultTriageSlaHours * 60 * 60 * 1000).toISOString(),
    triageNote: resolutionNote || existingTriage?.triageNote || '',
    labelsJson: existingTriage?.labelsJson ?? '[]',
    metadataJson: existingTriage?.metadataJson ?? '{}',
    createdByUserId: existingTriage?.createdByUserId ?? userId,
    createdByUsername: existingTriage?.createdByUsername ?? (request.session.username ?? 'system'),
    createdAt: existingTriage?.createdAt ?? timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'merge_review.defer',
    entityType: 'merge_review',
    entityId: `${segmentId}:${codeId}`,
    details: { resolutionId, resolutionNote }
  });
  return ok({
    resolution: {
      id: resolutionId,
      status: 'deferred',
      segmentId,
      codeId,
      resolutionNote
    }
  });
});

server.post('/merge-review/reopen', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    segmentId: string;
    codeId: string;
    resolutionNote: string;
    expectedTriageUpdatedAt: string;
    expectedPolicyUpdatedAt: string;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const segmentId = typeof body.segmentId === 'string' && body.segmentId.trim() ? body.segmentId.trim() : '';
  const codeId = typeof body.codeId === 'string' && body.codeId.trim() ? body.codeId.trim() : '';
  if (!segmentId || !codeId) {
    return reply.status(400).send(fail('INVALID', 'segmentId and codeId are required.'));
  }
  const governancePolicy = await getCodingMergeGovernancePolicy(projectId);
  if (!assertOptimisticTimestamp(reply, {
    expectedValue: body.expectedPolicyUpdatedAt,
    currentValue: governancePolicy.updatedAt,
    label: 'Merge governance policy'
  })) return;
  const existingTriage = await getCodingConflictTriage(projectId, segmentId, codeId);
  const expectedTriageUpdatedAt = parseProvidedIsoDate(body.expectedTriageUpdatedAt);
  if (expectedTriageUpdatedAt === null) {
    return reply.status(400).send(fail('INVALID', 'merge triage expectedUpdatedAt must be a valid ISO date when provided.'));
  }
  if (expectedTriageUpdatedAt && !existingTriage) {
    return reply.status(409).send(fail('CONFLICT', 'Merge triage row no longer exists. Refresh and retry.'));
  }
  if (existingTriage && !assertOptimisticTimestamp(reply, {
    expectedValue: body.expectedTriageUpdatedAt,
    currentValue: existingTriage.updatedAt,
    label: 'Merge triage'
  })) return;
  const resolutionId = `merge-resolution-${randomUUID()}`;
  const resolutionNote = typeof body.resolutionNote === 'string' ? body.resolutionNote.trim() : '';
  const timestamp = new Date().toISOString();
  await insertCodingConflictResolution({
    id: resolutionId,
    projectId,
    segmentId,
    codeId,
    status: 'reopened',
    keepMode: null,
    keepApplicationId: null,
    keepCoderId: null,
    removedApplicationIdsJson: '[]',
    removedCount: 0,
    resolutionNote,
    actorUserId: userId,
    actorUsername: request.session.username ?? 'system',
    metadataJson: '{}',
    createdAt: timestamp
  });
  await upsertCodingConflictTriage({
    id: existingTriage?.id ?? `triage-${randomUUID()}`,
    projectId,
    segmentId,
    codeId,
    status: 'in_review',
    severity: existingTriage?.severity ?? 'high',
    assigneeUserId: existingTriage?.assigneeUserId ?? null,
    assigneeUsername: existingTriage?.assigneeUsername ?? null,
    reviewerUserId: existingTriage?.reviewerUserId ?? null,
    reviewerUsername: existingTriage?.reviewerUsername ?? null,
    dueAt: existingTriage?.dueAt
      ?? new Date(Date.now() + governancePolicy.defaultTriageSlaHours * 60 * 60 * 1000).toISOString(),
    triageNote: resolutionNote || existingTriage?.triageNote || '',
    labelsJson: existingTriage?.labelsJson ?? '[]',
    metadataJson: existingTriage?.metadataJson ?? '{}',
    createdByUserId: existingTriage?.createdByUserId ?? userId,
    createdByUsername: existingTriage?.createdByUsername ?? (request.session.username ?? 'system'),
    createdAt: existingTriage?.createdAt ?? timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'merge_review.reopen',
    entityType: 'merge_review',
    entityId: `${segmentId}:${codeId}`,
    details: { resolutionId, resolutionNote }
  });
  return ok({
    resolution: {
      id: resolutionId,
      status: 'reopened',
      segmentId,
      codeId,
      resolutionNote
    }
  });
});

server.post('/merge-review/restore', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    resolutionId: string;
    resolutionNote: string;
    expectedTriageUpdatedAt: string;
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const resolutionId = typeof body.resolutionId === 'string' && body.resolutionId.trim() ? body.resolutionId.trim() : '';
  if (!resolutionId) return reply.status(400).send(fail('INVALID', 'resolutionId is required.'));

  const original = await getCodingConflictResolution(resolutionId, projectId);
  if (!original) {
    return reply.status(404).send(fail('NOT_FOUND', 'Merge resolution was not found.'));
  }
  if (original.removedCount < 1) {
    return reply.status(400).send(fail('INVALID', 'Selected merge resolution has no archived code applications to restore.'));
  }
  const existingTriage = await getCodingConflictTriage(projectId, original.segmentId, original.codeId);
  const expectedTriageUpdatedAt = parseProvidedIsoDate(body.expectedTriageUpdatedAt);
  if (expectedTriageUpdatedAt === null) {
    return reply.status(400).send(fail('INVALID', 'merge triage expectedUpdatedAt must be a valid ISO date when provided.'));
  }
  if (expectedTriageUpdatedAt && !existingTriage) {
    return reply.status(409).send(fail('CONFLICT', 'Merge triage row no longer exists. Refresh and retry.'));
  }
  if (existingTriage && !assertOptimisticTimestamp(reply, {
    expectedValue: body.expectedTriageUpdatedAt,
    currentValue: existingTriage.updatedAt,
    label: 'Merge triage'
  })) return;
  const archivedRows = await listArchivedCodeApplicationsByResolution(resolutionId, projectId, false);
  if (archivedRows.length === 0) {
    return reply.status(400).send(fail('INVALID', 'Archived code applications were already restored or are unavailable.'));
  }
  const timestamp = new Date().toISOString();
  const restored = await restoreArchivedCodeApplications({
    resolutionId,
    projectId,
    restoredAt: timestamp,
    restoredByUserId: userId,
    restoredByUsername: request.session.username ?? 'system'
  });
  const restoreResolutionId = `merge-resolution-${randomUUID()}`;
  const resolutionNote = typeof body.resolutionNote === 'string' && body.resolutionNote.trim()
    ? body.resolutionNote.trim()
    : `Restored ${restored.restoredCount} archived applications from ${resolutionId}.`;
  await insertCodingConflictResolution({
    id: restoreResolutionId,
    projectId,
    segmentId: original.segmentId,
    codeId: original.codeId,
    status: 'restored',
    keepMode: original.keepMode,
    keepApplicationId: original.keepApplicationId,
    keepCoderId: original.keepCoderId,
    removedApplicationIdsJson: JSON.stringify(restored.restoredApplicationIds),
    removedCount: restored.restoredCount,
    resolutionNote,
    actorUserId: userId,
    actorUsername: request.session.username ?? 'system',
    metadataJson: JSON.stringify({ sourceResolutionId: resolutionId }),
    createdAt: timestamp
  });
  await upsertCodingConflictTriage({
    id: existingTriage?.id ?? `triage-${randomUUID()}`,
    projectId,
    segmentId: original.segmentId,
    codeId: original.codeId,
    status: 'in_review',
    severity: existingTriage?.severity ?? 'high',
    assigneeUserId: existingTriage?.assigneeUserId ?? null,
    assigneeUsername: existingTriage?.assigneeUsername ?? null,
    reviewerUserId: existingTriage?.reviewerUserId ?? null,
    reviewerUsername: existingTriage?.reviewerUsername ?? null,
    dueAt: existingTriage?.dueAt ?? null,
    triageNote: resolutionNote || existingTriage?.triageNote || '',
    labelsJson: existingTriage?.labelsJson ?? '[]',
    metadataJson: JSON.stringify({
      ...(existingTriage ? (() => {
        try {
          const parsed = JSON.parse(existingTriage.metadataJson);
          return typeof parsed === 'object' && parsed ? parsed : {};
        } catch {
          return {};
        }
      })() : {}),
      sourceResolutionId: resolutionId,
      restoreResolutionId
    }),
    createdByUserId: existingTriage?.createdByUserId ?? userId,
    createdByUsername: existingTriage?.createdByUsername ?? (request.session.username ?? 'system'),
    createdAt: existingTriage?.createdAt ?? timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'merge_review.restore',
    entityType: 'merge_review',
    entityId: `${original.segmentId}:${original.codeId}`,
    details: {
      sourceResolutionId: resolutionId,
      restoreResolutionId,
      restoredCount: restored.restoredCount
    }
  });
  return ok({
    restoration: {
      sourceResolutionId: resolutionId,
      restoreResolutionId,
      segmentId: original.segmentId,
      codeId: original.codeId,
      restoredCount: restored.restoredCount,
      restoredApplicationIds: restored.restoredApplicationIds
    }
  });
});

server.get('/transcription-jobs', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  return ok({ items: await listTranscriptionJobs(projectId) });
});

server.post('/transcription-jobs', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    mediaSourceId: string;
    note: string;
    mode: 'segment_assembly' | 'timeline_chunked' | 'hybrid';
    pipelineConfig: {
      language?: string;
      diarization?: boolean;
      punctuation?: boolean;
      chunkSeconds?: number;
      confidenceThreshold?: number;
      speakerStrategy?: 'single' | 'alternating' | 'content_based';
      provider?: 'internal' | 'openai';
      providerModel?: string;
      providerPrompt?: string;
    };
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const mediaSourceId = typeof body.mediaSourceId === 'string' ? body.mediaSourceId.trim() : '';
  if (!mediaSourceId) {
    return reply.status(400).send(fail('INVALID', 'mediaSourceId is required.'));
  }
  const mode = body.mode === 'timeline_chunked' || body.mode === 'hybrid' ? body.mode : 'segment_assembly';
  const pipelineConfig = parseTranscriptionPipelineConfig(body.pipelineConfig);
  const now = new Date().toISOString();
  const job = await insertTranscriptionJob({
    id: `transcription-${randomUUID()}`,
    projectId,
    mediaSourceId,
    outputSourceId: null,
    status: 'queued',
    mode,
    note: typeof body.note === 'string' ? body.note : '',
    pipelineJson: JSON.stringify({
      requestedAt: now,
      requestedBy: request.session.username ?? 'unknown',
      mode,
      config: pipelineConfig,
      stages: [
        { stage: 'queued', at: now, status: 'completed' }
      ]
    }),
    progressPercent: 0,
    startedAt: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'transcription_job.create',
    entityType: 'transcription_job',
    entityId: job.id,
    details: { mediaSourceId, mode, pipelineConfig }
  });
  return ok({ job });
});

server.post('/transcription-jobs/:jobId/run', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = request.params as { jobId: string };
  const body = (request.body ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const jobId = typeof params.jobId === 'string' ? params.jobId.trim() : '';
  if (!jobId) {
    return reply.status(400).send(fail('INVALID', 'jobId is required.'));
  }
  const jobs = await listTranscriptionJobs(projectId);
  const job = jobs.find((entry) => entry.id === jobId);
  if (!job) {
    return reply.status(404).send(fail('NOT_FOUND', 'Transcription job not found.'));
  }
  const startedAtMs = Date.now();
  const preGuard = await evaluateAxionQeccGuard({
    jobType: 'transcription',
    stage: 'manual_pre_run',
    projectId,
    retryCount: job.status === 'failed' ? 1 : 0,
    load: 0.6,
    metadata: {
      jobId: job.id,
      provider: (() => {
        try {
          return JSON.parse(job.pipelineJson || '{}')?.config?.provider ?? 'internal';
        } catch {
          return 'internal';
        }
      })()
    }
  });
  if (preGuard.action === 'halt') {
    const haltedAt = new Date().toISOString();
    await updateTranscriptionJob({
      ...job,
      status: 'failed',
      mode: job.mode === 'timeline_chunked' || job.mode === 'hybrid' ? job.mode : 'segment_assembly',
      pipelineJson: JSON.stringify({
        guard: preGuard,
        failedAt: haltedAt,
        stages: [
          { stage: 'qecc_guard', status: 'failed', at: haltedAt, reason: preGuard.reason }
        ]
      }),
      progressPercent: 100,
      startedAt: haltedAt,
      errorMessage: `QECC guard blocked transcription run (${preGuard.reason}).`,
      updatedAt: haltedAt,
      completedAt: haltedAt
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'transcription_job.qecc_guard_halt',
      entityType: 'transcription_job',
      entityId: job.id,
      details: { decision: preGuard }
    });
    return reply.status(409).send(fail('QECC_HALT', `QECC guard blocked transcription run (${preGuard.reason}).`));
  }
  const runningAt = new Date().toISOString();
  const parsedPipelineConfig = (() => {
    try {
      const parsed = JSON.parse(job.pipelineJson || '{}');
      return parseTranscriptionPipelineConfig(parsed?.config);
    } catch {
      return parseTranscriptionPipelineConfig({});
    }
  })();
  const mode = job.mode === 'timeline_chunked' || job.mode === 'hybrid' ? job.mode : 'segment_assembly';
  const runningPipeline = {
    mode,
    config: parsedPipelineConfig,
    startedAt: runningAt,
    stages: [
      { stage: 'ingest', status: 'running', at: runningAt, provider: parsedPipelineConfig.provider }
    ]
  };
  await updateTranscriptionJob({
    ...job,
    status: 'running',
    mode,
    pipelineJson: JSON.stringify(runningPipeline),
    progressPercent: 5,
    startedAt: runningAt,
    errorMessage: null,
    completedAt: null,
    updatedAt: runningAt
  });

  try {
    const payload = await buildQualitativeProjectPayload(projectId);
    const mediaSource = payload.sources.find((source) => source.id === job.mediaSourceId);
    if (!mediaSource) {
      throw new Error('Media source not found.');
    }

    const timeSegments = payload.segments
      .filter((segment) => segment.sourceId === mediaSource.id && segment.kind === 'time_range')
      .sort((left, right) => (left.anchor as any).startMs - (right.anchor as any).startMs)
      .map((segment) => ({
        id: segment.id,
        anchor: {
          startMs: Number((segment.anchor as any).startMs ?? 0),
          endMs: Number((segment.anchor as any).endMs ?? 0)
        },
        text: segment.text
      }));

    const draft = parsedPipelineConfig.provider === 'openai'
      ? await runOpenAiTranscription({
        media: await resolveMediaSourceBytes({
          id: mediaSource.id,
          title: mediaSource.title,
          contentType: mediaSource.contentType,
          contentUrl: mediaSource.contentUrl
        }),
        mediaTitle: mediaSource.title,
        mode,
        pipeline: parsedPipelineConfig,
        timeSegments
      })
      : buildTranscriptionDraft({
        mediaTitle: mediaSource.title,
        mode,
        pipeline: parsedPipelineConfig,
        timeSegments
      });

    const now = new Date().toISOString();
    let outputSourceId = job.outputSourceId;
    if (!outputSourceId) {
      outputSourceId = `source-${randomUUID()}`;
      await insertSource(createSource({
        id: outputSourceId,
        projectId,
        kind: 'transcript',
        title: `${mediaSource.title} transcript`,
        language: parsedPipelineConfig.language || mediaSource.language,
        contentType: 'text/plain',
        contentUrl: null,
        contentText: draft.transcriptBody,
        createdAt: now,
        updatedAt: now
      }));
    } else {
      await updateSourceContent({
        id: outputSourceId,
        projectId,
        title: `${mediaSource.title} transcript`,
        contentType: 'text/plain',
        contentUrl: null,
        contentText: draft.transcriptBody,
        updatedAt: now
      });
    }

    await updateTranscriptionJob({
      ...job,
      outputSourceId,
      status: 'running',
      mode,
      pipelineJson: JSON.stringify({
        ...runningPipeline,
        outputSourceId,
        stages: [
          ...runningPipeline.stages,
          {
            stage: 'decode',
            status: 'completed',
            at: now,
            generatedEntryCount: draft.syncEntries.length,
            provider: parsedPipelineConfig.provider
          }
        ]
      }),
      progressPercent: 55,
      startedAt: runningAt,
      errorMessage: null,
      completedAt: null,
      updatedAt: now
    });

    await deleteTranscriptSyncLinksByMediaSource(projectId, mediaSource.id);
    for (const entry of draft.syncEntries) {
      await insertTranscriptSyncLink({
        id: `sync-${randomUUID()}`,
        projectId,
        mediaSourceId: mediaSource.id,
        transcriptSourceId: outputSourceId,
        segmentId: entry.segmentId,
        startMs: entry.startMs,
        endMs: entry.endMs,
        transcriptText: entry.transcriptText,
        speakerLabel: entry.speakerLabel,
        confidence: entry.confidence,
        syncScore: entry.syncScore,
        tokenTimelineJson: JSON.stringify(entry.tokenTimeline),
        createdAt: now,
        updatedAt: now
      });
    }

    const completedAt = new Date().toISOString();
    const postGuard = await evaluateAxionQeccGuard({
      jobType: 'transcription',
      stage: 'manual_post_run',
      projectId,
      durationSeconds: Math.max(0, (Date.now() - startedAtMs) / 1000),
      load: 0.7,
      metadata: {
        jobId: job.id,
        provider: parsedPipelineConfig.provider
      }
    });
    const updatedJob = await updateTranscriptionJob({
      ...job,
      outputSourceId,
      status: 'completed',
      mode,
      pipelineJson: JSON.stringify({
        mode,
        config: parsedPipelineConfig,
        startedAt: runningAt,
        completedAt,
        mediaSourceId: mediaSource.id,
        outputSourceId,
        modeStats: draft.modeStats,
        stages: [
          { stage: 'ingest', status: 'completed', at: runningAt, timeSegmentCount: timeSegments.length, provider: parsedPipelineConfig.provider },
          { stage: 'decode', status: 'completed', at: now, generatedEntryCount: draft.syncEntries.length, provider: parsedPipelineConfig.provider },
          { stage: 'align', status: 'completed', at: completedAt, linkedSegmentCount: draft.syncEntries.filter((entry) => Boolean(entry.segmentId)).length, provider: parsedPipelineConfig.provider },
          { stage: 'publish', status: 'completed', at: completedAt, outputSourceId }
        ]
      }),
      progressPercent: 100,
      startedAt: runningAt,
      errorMessage: null,
      updatedAt: completedAt,
      completedAt
    });

    await recordAuditEvent({
      request,
      projectId,
      action: 'transcription_job.run',
      entityType: 'transcription_job',
      entityId: updatedJob.id,
      details: {
        mediaSourceId: mediaSource.id,
        outputSourceId,
        mode,
        provider: parsedPipelineConfig.provider,
        providerModel: parsedPipelineConfig.providerModel || null,
        qeccGuard: postGuard,
        generatedEntryCount: draft.syncEntries.length,
        linkedSegmentCount: draft.syncEntries.filter((entry) => Boolean(entry.segmentId)).length,
        tokenCount: draft.syncEntries.reduce((total, entry) => total + entry.tokenTimeline.length, 0)
      }
    });
    return ok({
      job: updatedJob,
      transcriptSourceId: outputSourceId,
      segmentCount: draft.syncEntries.length
    });
  } catch (error) {
    const failedAt = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : 'Unknown transcription pipeline error.';
    const failGuard = await evaluateAxionQeccGuard({
      jobType: 'transcription',
      stage: 'manual_failed',
      projectId,
      durationSeconds: Math.max(0, (Date.now() - startedAtMs) / 1000),
      errorRate: 1,
      failedStage: true,
      load: 0.85,
      metadata: {
        jobId: job.id
      }
    });
    const failedJob = await updateTranscriptionJob({
      ...job,
      status: 'failed',
      mode,
      pipelineJson: JSON.stringify({
        mode,
        config: parsedPipelineConfig,
        startedAt: runningAt,
        failedAt,
        stages: [
          { stage: 'ingest', status: 'completed', at: runningAt, provider: parsedPipelineConfig.provider },
          { stage: 'decode', status: 'failed', at: failedAt, error: errorMessage, provider: parsedPipelineConfig.provider, qeccGuard: failGuard }
        ]
      }),
      progressPercent: 100,
      startedAt: runningAt,
      errorMessage: failGuard.action === 'halt' ? `${errorMessage} (QECC halt: ${failGuard.reason})` : errorMessage,
      updatedAt: failedAt,
      completedAt: failedAt
    });
    await recordAuditEvent({
      request,
      projectId,
      action: 'transcription_job.fail',
      entityType: 'transcription_job',
      entityId: failedJob.id,
      details: { error: errorMessage, qeccGuard: failGuard }
    });
    return reply.status(500).send(fail('INTERNAL', failGuard.action === 'halt' ? `${errorMessage} (QECC halt: ${failGuard.reason})` : errorMessage));
  }
});

// ── Attributes ────────────────────────────────────────────────────────────────

server.get('/attributes', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listAttributes(projectId);
  return ok({ items, total: items.length });
});

server.post('/attributes', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    id: string;
    projectId: string;
    targetType: string;
    targetId: string;
    name: string;
    value: string | number | boolean | null;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const attribute = createAttribute({
    id: typeof body.id === 'string' && body.id.trim() ? body.id : `attribute-${randomUUID()}`,
    projectId,
    targetType: parseAttributeTargetType(body.targetType),
    targetId: typeof body.targetId === 'string' ? body.targetId : '',
    name: typeof body.name === 'string' ? body.name : '',
    value: body.value === undefined ? null : body.value
  });
  const created = await insertAttribute(attribute);
  await recordAuditEvent({
    request,
    projectId,
    action: 'attribute.create',
    entityType: 'attribute',
    entityId: created.id,
    details: { targetType: created.targetType, targetId: created.targetId, name: created.name }
  });
  reply.code(201);
  return ok({ attribute: created });
});

// ── Segments ──────────────────────────────────────────────────────────────────

server.get('/segments', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string; sourceId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  const sourceId = typeof query.sourceId === 'string' && query.sourceId.trim() ? query.sourceId : undefined;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listSegments(projectId, sourceId);
  return ok({ items, total: items.length });
});

server.post('/segments', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{ id: string; projectId: string; sourceId: string; kind: string; anchor: Record<string, unknown>; text: string }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  let anchor = body.anchor;
  if (!anchor) anchor = { kind: body.kind ?? 'text_range', ...(body as Record<string, unknown>) };
  const segment = createSegment({
    id: typeof body.id === 'string' && body.id.trim() ? body.id : `segment-${randomUUID()}`,
    projectId, sourceId: typeof body.sourceId === 'string' ? body.sourceId : '',
    kind: parseSegmentKind((anchor as Record<string, unknown>).kind),
    anchor: anchor as Parameters<typeof createSegment>[0]['anchor'],
    text: typeof body.text === 'string' ? body.text : ''
  });
  const created = await insertSegment(segment);
  await recordAuditEvent({
    request,
    projectId,
    action: 'segment.create',
    entityType: 'segment',
    entityId: created.id,
    details: { sourceId: created.sourceId, kind: created.kind }
  });
  reply.code(201);
  return ok({ segment: created });
});

server.put('/segments/:segmentId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ segmentId: string }>;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    sourceId: string;
    kind: string;
    anchor: Record<string, unknown>;
    text: string;
  }>;
  const segmentId = typeof params.segmentId === 'string' ? params.segmentId.trim() : '';
  if (!segmentId) {
    return reply.status(400).send(fail('INVALID', 'segmentId is required.'));
  }
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const existing = (await listSegments(projectId)).find((segment) => segment.id === segmentId);
  if (!existing) {
    return reply.status(404).send(fail('NOT_FOUND', 'Segment not found.'));
  }

  const anchorInput = (() => {
    if (body.anchor && typeof body.anchor === 'object') {
      const incomingKind = parseSegmentKind((body.anchor as Record<string, unknown>).kind ?? body.kind ?? existing.kind);
      return {
        ...(body.anchor as Record<string, unknown>),
        kind: incomingKind
      } as Parameters<typeof createSegment>[0]['anchor'];
    }
    if (typeof body.kind === 'string' && body.kind.trim()) {
      return {
        ...(existing.anchor as Record<string, unknown>),
        kind: parseSegmentKind(body.kind)
      } as Parameters<typeof createSegment>[0]['anchor'];
    }
    return existing.anchor;
  })();

  let updated;
  try {
    updated = createSegment({
      ...existing,
      sourceId: typeof body.sourceId === 'string' && body.sourceId.trim() ? body.sourceId.trim() : existing.sourceId,
      kind: parseSegmentKind((anchorInput as Record<string, unknown>).kind ?? existing.kind),
      anchor: anchorInput,
      text: typeof body.text === 'string' ? body.text : existing.text,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return reply.status(400).send(fail('INVALID', error instanceof Error ? error.message : 'Invalid segment update.'));
  }

  const saved = await updateSegment(updated);
  if (!saved) {
    return reply.status(404).send(fail('NOT_FOUND', 'Segment not found.'));
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'segment.update',
    entityType: 'segment',
    entityId: saved.id,
    details: { sourceId: saved.sourceId, kind: saved.kind }
  });
  return ok({ segment: saved });
});

server.delete('/segments/:segmentId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ segmentId: string }>;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const segmentId = typeof params.segmentId === 'string' ? params.segmentId.trim() : '';
  if (!segmentId) {
    return reply.status(400).send(fail('INVALID', 'segmentId is required.'));
  }
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const removed = await deleteSegment(segmentId, projectId);
  if (!removed) {
    return reply.status(404).send(fail('NOT_FOUND', 'Segment not found.'));
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'segment.delete',
    entityType: 'segment',
    entityId: segmentId,
    details: {}
  });
  return ok({ removed: true });
});

// ── Code Applications ─────────────────────────────────────────────────────────

server.get('/code-applications', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string; segmentId: string; codeId: string }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  const segmentId = typeof query.segmentId === 'string' && query.segmentId.trim() ? query.segmentId : undefined;
  const codeId = typeof query.codeId === 'string' && query.codeId.trim() ? query.codeId : undefined;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listCodeApplications(projectId, segmentId, codeId);
  return ok({ items, total: items.length });
});

server.post('/code-applications', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{ id: string; projectId: string; segmentId: string; codeId: string; caseId: string | null; coderId: string; confidence: number }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const ca = createCodeApplication({
    id: typeof body.id === 'string' && body.id.trim() ? body.id : `application-${randomUUID()}`,
    projectId, segmentId: typeof body.segmentId === 'string' ? body.segmentId : '',
    codeId: typeof body.codeId === 'string' ? body.codeId : '',
    caseId: typeof body.caseId === 'string' && body.caseId.trim() ? body.caseId : null,
    coderId: request.session.username ?? 'system',
    confidence: typeof body.confidence === 'number' ? Math.min(1, Math.max(0, body.confidence)) : 1
  });
  const created = await insertCodeApplication(ca);
  await recordAuditEvent({
    request,
    projectId,
    action: 'code_application.create',
    entityType: 'code_application',
    entityId: created.id,
    details: { segmentId: created.segmentId, codeId: created.codeId, caseId: created.caseId }
  });
  reply.code(201);
  return ok({ codeApplication: created });
});

// ── Trace Links ───────────────────────────────────────────────────────────────

server.get('/trace-links', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listTraceLinks(projectId);
  return ok({ items, total: items.length });
});

server.post('/trace-links/derive', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const result = await deriveTraceLinks(projectId);
  await recordAuditEvent({
    request,
    projectId,
    action: 'trace_links.derive',
    entityType: 'trace_link_batch',
    entityId: `trace-${randomUUID()}`,
    details: result
  });
  return ok({ result });
});

server.get('/descriptives', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    weightField: string;
    missingValues: string;
    missingStrategy: string;
  }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  return ok(await buildProjectDatasetPayload(projectId, parseDatasetAnalysisOptions(query)));
});

server.get('/crosstabs', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{
    projectId: string;
    rowField: string;
    columnField: string;
    weightField: string;
    missingValues: string;
    missingStrategy: string;
  }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId : undefined;
  const rowField = typeof query.rowField === 'string' && query.rowField.trim() ? query.rowField : undefined;
  const columnField = typeof query.columnField === 'string' && query.columnField.trim() ? query.columnField : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!rowField || !columnField) {
    return reply.status(400).send(fail('INVALID', 'rowField and columnField are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const analysis = parseDatasetAnalysisOptions(query);
  const payload = await buildProjectDatasetPayload(projectId, analysis);
  try {
    return ok({ crosstab: analyzeCrosstab(payload.dataset, rowField, columnField, analysis) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to build crosstab.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/dataset-analysis', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    crosstab: { rowField?: string; columnField?: string };
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    const response: Record<string, unknown> = {
      dataset,
      report: describeDataset(dataset, analysis)
    };

    const rowField = typeof body.crosstab?.rowField === 'string' ? body.crosstab.rowField.trim() : '';
    const columnField = typeof body.crosstab?.columnField === 'string' ? body.crosstab.columnField.trim() : '';
    if (rowField && columnField) {
      response.crosstab = analyzeCrosstab(dataset, rowField, columnField, analysis);
    }

    return ok(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run dataset analysis.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/compare-means', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    outcomeField: string;
    groupField: string;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId : undefined;
  const outcomeField = typeof body.outcomeField === 'string' && body.outcomeField.trim() ? body.outcomeField.trim() : undefined;
  const groupField = typeof body.groupField === 'string' && body.groupField.trim() ? body.groupField.trim() : undefined;
  if (!projectId || !outcomeField || !groupField) {
    return reply.status(400).send(fail('INVALID', 'projectId, outcomeField, and groupField are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      compareMeans: analyzeCompareMeans(dataset, outcomeField, groupField, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run compare-means.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/regression', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    dependentField: string;
    predictorField: string;
    predictorFields: string[];
    model: string;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId : undefined;
  const dependentField = typeof body.dependentField === 'string' && body.dependentField.trim() ? body.dependentField.trim() : undefined;
  const predictorField = typeof body.predictorField === 'string' && body.predictorField.trim() ? body.predictorField.trim() : undefined;
  const predictorFields = Array.isArray(body.predictorFields)
    ? body.predictorFields.map((field) => String(field ?? '').trim()).filter(Boolean)
    : [];
  const model = body.model === 'logistic' ? 'logistic' : 'linear';
  if (!projectId || !dependentField || (predictorFields.length === 0 && !predictorField)) {
    return reply.status(400).send(fail('INVALID', 'projectId, dependentField, and at least one predictor field are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      regression: analyzeRegression(dataset, dependentField, predictorFields.length > 0 ? predictorFields : predictorField!, model, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run regression.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/correlation', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    xField: string;
    yField: string;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId : undefined;
  const xField = typeof body.xField === 'string' && body.xField.trim() ? body.xField.trim() : undefined;
  const yField = typeof body.yField === 'string' && body.yField.trim() ? body.yField.trim() : undefined;
  if (!projectId || !xField || !yField) {
    return reply.status(400).send(fail('INVALID', 'projectId, xField, and yField are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      correlation: analyzeCorrelation(dataset, xField, yField, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run correlation.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/t-tests', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    outcomeField: string;
    groupField: string;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const outcomeField = typeof body.outcomeField === 'string' && body.outcomeField.trim() ? body.outcomeField.trim() : undefined;
  const groupField = typeof body.groupField === 'string' && body.groupField.trim() ? body.groupField.trim() : undefined;
  if (!projectId || !outcomeField || !groupField) {
    return reply.status(400).send(fail('INVALID', 'projectId, outcomeField, and groupField are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      tTest: analyzeTTest(dataset, outcomeField, groupField, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run t-test.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/paired-t-tests', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    beforeField: string;
    afterField: string;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const beforeField = typeof body.beforeField === 'string' && body.beforeField.trim() ? body.beforeField.trim() : undefined;
  const afterField = typeof body.afterField === 'string' && body.afterField.trim() ? body.afterField.trim() : undefined;
  if (!projectId || !beforeField || !afterField) {
    return reply.status(400).send(fail('INVALID', 'projectId, beforeField, and afterField are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      pairedTTest: analyzePairedTTest(dataset, beforeField, afterField, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run paired t-test.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/nonparametric-tests', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    outcomeField: string;
    groupField: string;
    method: string;
    beforeField: string;
    relatedFields: string[];
    exact: boolean;
    continuityCorrection: boolean;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const outcomeField = typeof body.outcomeField === 'string' && body.outcomeField.trim() ? body.outcomeField.trim() : undefined;
  const groupField = typeof body.groupField === 'string' && body.groupField.trim() ? body.groupField.trim() : undefined;
  const method = body.method === 'mann_whitney_u'
    || body.method === 'kruskal_wallis'
    || body.method === 'wilcoxon_signed_rank'
    || body.method === 'friedman'
    || body.method === 'median_test'
    || body.method === 'runs_test'
    ? body.method
    : undefined;
  const beforeField = typeof body.beforeField === 'string' && body.beforeField.trim() ? body.beforeField.trim() : undefined;
  const relatedFields = Array.isArray(body.relatedFields)
    ? body.relatedFields.map((field) => String(field ?? '').trim()).filter(Boolean)
    : undefined;
  const requiresGroupField = !method || method === 'mann_whitney_u' || method === 'kruskal_wallis' || method === 'median_test';
  if (!projectId || !outcomeField || (requiresGroupField && !groupField)) {
    return reply.status(400).send(fail('INVALID', requiresGroupField
      ? 'projectId, outcomeField, and groupField are required.'
      : 'projectId and outcomeField are required.'));
  }
  if (method === 'wilcoxon_signed_rank' && (!beforeField || beforeField === outcomeField)) {
    return reply.status(400).send(fail('INVALID', 'Wilcoxon signed-rank requires beforeField different from outcomeField.'));
  }
  if (method === 'friedman' && (!relatedFields || relatedFields.length < 3)) {
    return reply.status(400).send(fail('INVALID', 'Friedman requires relatedFields with at least three repeated fields.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      nonparametric: analyzeNonparametricComparison(dataset, outcomeField, groupField ?? '__sequence__', {
        ...analysis,
        method,
        beforeField,
        relatedFields,
        exact: typeof body.exact === 'boolean' ? body.exact : undefined,
        continuityCorrection: typeof body.continuityCorrection === 'boolean' ? body.continuityCorrection : undefined
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run nonparametric test.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/reliability', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    fields: string[];
    subscales: Array<{ label?: string; fields?: string[] }>;
    stratifyField: string;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const fields = Array.isArray(body.fields) ? body.fields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  if (!projectId || fields.length < 2) {
    return reply.status(400).send(fail('INVALID', 'projectId and at least two fields are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      reliability: analyzeReliability(
        dataset,
        fields,
        analysis,
        Array.isArray(body.subscales)
          ? body.subscales.map((subscale) => ({
            label: typeof subscale?.label === 'string' ? subscale.label : '',
            fields: Array.isArray(subscale?.fields) ? subscale.fields.map((field) => String(field ?? '')) : []
          }))
          : [],
        typeof body.stratifyField === 'string' && body.stratifyField.trim()
          ? body.stratifyField.trim()
          : undefined
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run reliability analysis.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/factor-analysis', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    fields: string[];
    factorCount: number;
    rotation: string;
    extraction: string;
    maxIterations: number;
    convergenceTolerance: number;
    parallelAnalysisSamples: number;
    confidenceLevel: number;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const fields = Array.isArray(body.fields) ? body.fields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  const factorCount = typeof body.factorCount === 'number' ? body.factorCount : undefined;
  const rotation = body.rotation === 'varimax'
    ? 'varimax'
    : body.rotation === 'quartimax'
      ? 'quartimax'
    : body.rotation === 'promax'
      ? 'promax'
      : 'none';
  const extraction = body.extraction === 'principal_axis'
    ? 'principal_axis'
    : 'principal_components';
  if (!projectId || fields.length < 2) {
    return reply.status(400).send(fail('INVALID', 'projectId and at least two fields are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      factorAnalysis: analyzeFactorAnalysis(dataset, fields, factorCount, analysis, rotation as never, extraction as never, {
        maxIterations: typeof body.maxIterations === 'number' ? body.maxIterations : undefined,
        convergenceTolerance: typeof body.convergenceTolerance === 'number' ? body.convergenceTolerance : undefined,
        parallelAnalysisSamples: typeof body.parallelAnalysisSamples === 'number' ? body.parallelAnalysisSamples : undefined,
        confidenceLevel: typeof body.confidenceLevel === 'number' ? body.confidenceLevel : undefined
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run factor analysis.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/conjoint-analysis', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    profileField: string;
    ratingField: string;
    attributeFields: string[];
    holdoutFraction: number;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const profileField = typeof body.profileField === 'string' && body.profileField.trim() ? body.profileField.trim() : null;
  const ratingField = typeof body.ratingField === 'string' && body.ratingField.trim() ? body.ratingField.trim() : '';
  const attributeFields = Array.isArray(body.attributeFields)
    ? body.attributeFields.map((field) => String(field ?? '').trim()).filter(Boolean)
    : [];
  const holdoutFraction = typeof body.holdoutFraction === 'number' && Number.isFinite(body.holdoutFraction)
    ? body.holdoutFraction
    : 0.2;
  if (!projectId || !ratingField || attributeFields.length === 0) {
    return reply.status(400).send(fail('INVALID', 'projectId, ratingField, and at least one attribute field are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      conjointAnalysis: analyzeConjoint(
        dataset,
        profileField,
        ratingField,
        attributeFields,
        analysis,
        holdoutFraction
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run conjoint analysis.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/optimal-scaling', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    fields: string[];
    anchorField: string;
    maxIterations: number;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const fields = Array.isArray(body.fields)
    ? body.fields.map((field) => String(field ?? '').trim()).filter(Boolean)
    : [];
  const anchorField = typeof body.anchorField === 'string' && body.anchorField.trim() ? body.anchorField.trim() : null;
  const maxIterations = typeof body.maxIterations === 'number' && Number.isFinite(body.maxIterations)
    ? body.maxIterations
    : 20;
  if (!projectId || fields.length < 2) {
    return reply.status(400).send(fail('INVALID', 'projectId and at least two fields are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      optimalScaling: analyzeOptimalScaling(
        dataset,
        fields,
        anchorField,
        analysis,
        maxIterations
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run optimal scaling.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/direct-marketing', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    customerField: string;
    responseField: string;
    recencyField: string;
    frequencyField: string;
    monetaryField: string;
    scoringWeights: Partial<{ recency: number; frequency: number; monetary: number; response: number }>;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const customerField = typeof body.customerField === 'string' && body.customerField.trim() ? body.customerField.trim() : null;
  const responseField = typeof body.responseField === 'string' && body.responseField.trim() ? body.responseField.trim() : null;
  const recencyField = typeof body.recencyField === 'string' && body.recencyField.trim() ? body.recencyField.trim() : null;
  const frequencyField = typeof body.frequencyField === 'string' && body.frequencyField.trim() ? body.frequencyField.trim() : null;
  const monetaryField = typeof body.monetaryField === 'string' && body.monetaryField.trim() ? body.monetaryField.trim() : null;
  const hasScoringField = Boolean(responseField || recencyField || frequencyField || monetaryField);
  if (!projectId || !hasScoringField) {
    return reply.status(400).send(fail('INVALID', 'projectId and at least one response/RFM field are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      directMarketing: analyzeDirectMarketing(dataset, {
        customerField,
        responseField,
        recencyField,
        frequencyField,
        monetaryField,
        scoringWeights: body.scoringWeights && typeof body.scoringWeights === 'object' ? body.scoringWeights : undefined
      }, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run direct marketing analysis.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/custom-tables', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    rowFields: string[];
    columnField: string;
    measureFields: string[];
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const rowFields = Array.isArray(body.rowFields) ? body.rowFields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  const columnField = typeof body.columnField === 'string' && body.columnField.trim() ? body.columnField.trim() : null;
  const measureFields = Array.isArray(body.measureFields) ? body.measureFields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  if (!projectId || rowFields.length === 0) {
    return reply.status(400).send(fail('INVALID', 'projectId and at least one row field are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      customTable: buildCustomTable(dataset, rowFields, columnField, measureFields, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to build custom table.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/exact-tests', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    testType: string;
    rowField: string;
    columnField: string;
    binaryField: string;
    successValue: string | number | boolean | null;
    nullProportion: number;
    beforeField: string;
    afterField: string;
    positiveValue: string | number | boolean | null;
    continuityCorrection: boolean;
    exactThreshold: number;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const normalizeFieldKey = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value.trim() : null;
  const normalizeExactValue = (value: unknown): string | number | boolean | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    return String(value);
  };
  const testType = body.testType === 'binomial'
    ? 'binomial'
    : body.testType === 'mcnemar'
      ? 'mcnemar'
      : body.testType === 'sign'
        ? 'sign'
        : body.testType === 'wilcoxon_signed_rank'
          ? 'wilcoxon_signed_rank'
          : body.testType === 'runs'
            ? 'runs'
        : 'fisher_2x2';
  const rowField = normalizeFieldKey(body.rowField);
  const columnField = normalizeFieldKey(body.columnField);
  const binaryField = normalizeFieldKey(body.binaryField);
  const beforeField = normalizeFieldKey(body.beforeField);
  const afterField = normalizeFieldKey(body.afterField);
  const nullProportion = typeof body.nullProportion === 'number' && Number.isFinite(body.nullProportion)
    ? body.nullProportion
    : undefined;
  if (!projectId) {
    return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  }
  if (testType === 'fisher_2x2' && (!rowField || !columnField || rowField === columnField)) {
    return reply.status(400).send(fail('INVALID', 'Fisher exact test requires two different categorical fields.'));
  }
  if (testType === 'binomial' && !binaryField) {
    return reply.status(400).send(fail('INVALID', 'Binomial exact test requires a binaryField.'));
  }
  if ((testType === 'mcnemar' || testType === 'sign') && (!beforeField || !afterField || beforeField === afterField)) {
    return reply.status(400).send(fail('INVALID', `${testType === 'mcnemar' ? 'McNemar' : 'Sign'} test requires two different paired fields.`));
  }
  if (testType === 'wilcoxon_signed_rank' && (!beforeField || !afterField || beforeField === afterField)) {
    return reply.status(400).send(fail('INVALID', 'Wilcoxon signed-rank requires two different paired fields.'));
  }
  if (testType === 'runs' && !binaryField && !rowField) {
    return reply.status(400).send(fail('INVALID', 'Runs test requires binaryField or rowField.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      exactTest: analyzeExactTest(dataset, {
        testType,
        rowField,
        columnField,
        binaryField,
        successValue: normalizeExactValue(body.successValue),
        nullProportion,
        beforeField,
        afterField,
        positiveValue: normalizeExactValue(body.positiveValue),
        continuityCorrection: typeof body.continuityCorrection === 'boolean' ? body.continuityCorrection : undefined,
        exactThreshold: typeof body.exactThreshold === 'number' && Number.isFinite(body.exactThreshold)
          ? body.exactThreshold
          : undefined
      }, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run exact test.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/bootstrap', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    procedure: string;
    targetFields: string[];
    iterations: number;
    confidenceLevel: number;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const procedure = body.procedure === 'correlation' ? 'correlation' : 'mean';
  const targetFields = Array.isArray(body.targetFields) ? body.targetFields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  if (!projectId || targetFields.length === 0) {
    return reply.status(400).send(fail('INVALID', 'projectId and targetFields are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      bootstrap: analyzeBootstrap(
        dataset,
        procedure,
        targetFields,
        typeof body.iterations === 'number' ? body.iterations : 1000,
        typeof body.confidenceLevel === 'number' ? body.confidenceLevel : 0.95,
        analysis
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run bootstrap.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/missing-values', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      missingValues: analyzeMissingValues(dataset, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to analyze missing values.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

function parseImputationStrategies(
  input: unknown
): Array<{
  field: string;
  method: 'mean' | 'median' | 'mode' | 'constant' | 'random_hot_deck' | 'predictive_mean_matching' | 'logistic_binary';
  value?: string | number | boolean | null;
  predictorFields?: string[];
  nearestNeighbors?: number;
  donorField?: string;
}> {
  if (!Array.isArray(input)) return [];
  return input
    .map((strategy) => {
      const candidate = strategy as {
        field?: unknown;
        method?: unknown;
        value?: unknown;
        predictorFields?: unknown;
        nearestNeighbors?: unknown;
        donorField?: unknown;
      };
      const field = typeof candidate.field === 'string' ? candidate.field.trim() : '';
      const method: 'mean' | 'median' | 'mode' | 'constant' | 'random_hot_deck' | 'predictive_mean_matching' | 'logistic_binary' =
        candidate.method === 'mean'
        || candidate.method === 'median'
        || candidate.method === 'mode'
        || candidate.method === 'constant'
        || candidate.method === 'random_hot_deck'
        || candidate.method === 'predictive_mean_matching'
        || candidate.method === 'logistic_binary'
        ? candidate.method
        : 'mode';
      const predictorFields = Array.isArray(candidate.predictorFields)
        ? candidate.predictorFields.map((item) => String(item ?? '').trim()).filter(Boolean)
        : undefined;
      const nearestNeighbors = typeof candidate.nearestNeighbors === 'number' && Number.isFinite(candidate.nearestNeighbors)
        ? candidate.nearestNeighbors
        : undefined;
      const donorField = typeof candidate.donorField === 'string' && candidate.donorField.trim()
        ? candidate.donorField.trim()
        : undefined;
      return {
        field,
        method,
        value: candidate.value as string | number | boolean | null | undefined,
        predictorFields,
        nearestNeighbors,
        donorField
      };
    })
    .filter((strategy) => strategy.field);
}

function parseMultipleImputationConfig(input: unknown): {
  imputations?: number;
  randomSeed?: number;
  chainIterations?: number;
  includeOriginalDataset?: boolean;
  confidenceLevel?: number;
} {
  const config = (input ?? {}) as Partial<{
    imputations: number;
    randomSeed: number;
    chainIterations: number;
    includeOriginalDataset: boolean;
    confidenceLevel: number;
  }>;
  return {
    imputations: typeof config.imputations === 'number' && Number.isFinite(config.imputations) ? config.imputations : undefined,
    randomSeed: typeof config.randomSeed === 'number' && Number.isFinite(config.randomSeed) ? config.randomSeed : undefined,
    chainIterations: typeof config.chainIterations === 'number' && Number.isFinite(config.chainIterations) ? config.chainIterations : undefined,
    includeOriginalDataset: typeof config.includeOriginalDataset === 'boolean' ? config.includeOriginalDataset : undefined,
    confidenceLevel: typeof config.confidenceLevel === 'number' && Number.isFinite(config.confidenceLevel) ? config.confidenceLevel : undefined
  };
}

function parseMultipleImputationTarget(input: unknown): (
  | { procedure: 'regression'; dependentField: string; predictorFields: string[]; model?: 'linear' | 'logistic' }
  | { procedure: 't_test'; outcomeField: string; groupField: string }
  | { procedure: 'paired_t_test'; beforeField: string; afterField: string }
  | { procedure: 'compare_means'; outcomeField: string; groupField: string }
  | { procedure: 'correlation'; xField: string; yField: string }
) | null {
  const target = (input ?? {}) as Partial<{
    procedure: string;
    dependentField: string;
    predictorFields: string[];
    model: string;
    outcomeField: string;
    groupField: string;
    beforeField: string;
    afterField: string;
    xField: string;
    yField: string;
  }>;
  const procedure = typeof target.procedure === 'string' ? target.procedure.trim() : '';
  if (procedure === 'regression') {
    const dependentField = typeof target.dependentField === 'string' ? target.dependentField.trim() : '';
    const predictorFields = Array.isArray(target.predictorFields)
      ? target.predictorFields.map((field) => String(field ?? '').trim()).filter(Boolean)
      : [];
    if (!dependentField || predictorFields.length === 0) return null;
    return {
      procedure: 'regression',
      dependentField,
      predictorFields,
      model: target.model === 'logistic' ? 'logistic' : 'linear'
    };
  }
  if (procedure === 't_test') {
    const outcomeField = typeof target.outcomeField === 'string' ? target.outcomeField.trim() : '';
    const groupField = typeof target.groupField === 'string' ? target.groupField.trim() : '';
    if (!outcomeField || !groupField) return null;
    return { procedure: 't_test', outcomeField, groupField };
  }
  if (procedure === 'paired_t_test') {
    const beforeField = typeof target.beforeField === 'string' ? target.beforeField.trim() : '';
    const afterField = typeof target.afterField === 'string' ? target.afterField.trim() : '';
    if (!beforeField || !afterField || beforeField === afterField) return null;
    return { procedure: 'paired_t_test', beforeField, afterField };
  }
  if (procedure === 'compare_means') {
    const outcomeField = typeof target.outcomeField === 'string' ? target.outcomeField.trim() : '';
    const groupField = typeof target.groupField === 'string' ? target.groupField.trim() : '';
    if (!outcomeField || !groupField) return null;
    return { procedure: 'compare_means', outcomeField, groupField };
  }
  if (procedure === 'correlation') {
    const xField = typeof target.xField === 'string' ? target.xField.trim() : '';
    const yField = typeof target.yField === 'string' ? target.yField.trim() : '';
    if (!xField || !yField || xField === yField) return null;
    return { procedure: 'correlation', xField, yField };
  }
  return null;
}

server.post('/imputation-plan', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    strategies: Array<{
      field?: string;
      method?: string;
      value?: string | number | boolean | null;
      predictorFields?: string[];
      nearestNeighbors?: number;
      donorField?: string;
    }>;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const strategies = parseImputationStrategies(body.strategies);
  if (!projectId || strategies.length === 0) {
    return reply.status(400).send(fail('INVALID', 'projectId and at least one imputation strategy are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      imputationPlan: buildImputationPlan(dataset, strategies, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to build imputation plan.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/multiple-imputation-plan', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    strategies: unknown[];
    config: unknown;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const strategies = parseImputationStrategies(body.strategies);
  if (!projectId || strategies.length === 0) {
    return reply.status(400).send(fail('INVALID', 'projectId and at least one imputation strategy are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const config = parseMultipleImputationConfig(body.config);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      multipleImputationPlan: buildMultipleImputationPlan(dataset, strategies, analysis, config)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to build multiple-imputation plan.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/multiple-imputation-analysis', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    strategies: unknown[];
    config: unknown;
    target: unknown;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const strategies = parseImputationStrategies(body.strategies);
  const target = parseMultipleImputationTarget(body.target);
  if (!projectId || strategies.length === 0 || !target) {
    return reply.status(400).send(fail('INVALID', 'projectId, strategies, and a valid target definition are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const config = parseMultipleImputationConfig(body.config);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      multipleImputationAnalysis: analyzeWithMultipleImputation(dataset, target, strategies, analysis, config)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run multiple-imputation analysis.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/forecasting', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    timeField: string;
    valueField: string;
    horizon: number;
    method: string;
    movingAverageWindow: number;
    smoothingAlpha: number;
    smoothingBeta: number;
    dampingPhi: number;
    holdoutFraction: number;
    confidenceLevel: number;
    ljungBoxLags: number;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const timeField = typeof body.timeField === 'string' && body.timeField.trim() ? body.timeField.trim() : undefined;
  const valueField = typeof body.valueField === 'string' && body.valueField.trim() ? body.valueField.trim() : undefined;
  if (!projectId || !timeField || !valueField) {
    return reply.status(400).send(fail('INVALID', 'projectId, timeField, and valueField are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      forecast: analyzeForecast(
        dataset,
        timeField,
        valueField,
        typeof body.horizon === 'number' ? body.horizon : 3,
        analysis,
        {
          method: body.method === 'moving_average'
            || body.method === 'exponential_smoothing'
            || body.method === 'auto'
            || body.method === 'arima_auto'
            || body.method === 'ets_auto'
            || body.method === 'linear_trend'
            ? body.method
            : 'auto',
          movingAverageWindow: typeof body.movingAverageWindow === 'number' ? body.movingAverageWindow : undefined,
          smoothingAlpha: typeof body.smoothingAlpha === 'number' ? body.smoothingAlpha : undefined,
          smoothingBeta: typeof body.smoothingBeta === 'number' ? body.smoothingBeta : undefined,
          dampingPhi: typeof body.dampingPhi === 'number' ? body.dampingPhi : undefined,
          holdoutFraction: typeof body.holdoutFraction === 'number' ? body.holdoutFraction : undefined,
          confidenceLevel: typeof body.confidenceLevel === 'number' ? body.confidenceLevel : undefined,
          ljungBoxLags: typeof body.ljungBoxLags === 'number' ? body.ljungBoxLags : undefined
        }
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run forecast.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/cluster-analysis', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    fields: string[];
    clusterCount: number;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const fields = Array.isArray(body.fields) ? body.fields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  if (!projectId || fields.length < 2) {
    return reply.status(400).send(fail('INVALID', 'projectId and at least two numeric fields are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      clusterAnalysis: analyzeClusterAnalysis(dataset, fields, typeof body.clusterCount === 'number' ? body.clusterCount : 3, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run cluster analysis.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/decision-tree', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    targetField: string;
    predictorFields: string[];
    maxDepth: number;
    method: string;
    criterion: string;
    treeCount: number;
    minSamplesLeaf: number;
    minGain: number;
    featureSubsetCount: number;
    seed: number;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const targetField = typeof body.targetField === 'string' && body.targetField.trim() ? body.targetField.trim() : undefined;
  const predictorFields = Array.isArray(body.predictorFields) ? body.predictorFields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  if (!projectId || !targetField || predictorFields.length === 0) {
    return reply.status(400).send(fail('INVALID', 'projectId, targetField, and at least one predictor field are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      decisionTree: analyzeDecisionTree(
        dataset,
        targetField,
        predictorFields,
        typeof body.maxDepth === 'number' ? body.maxDepth : 3,
        analysis,
        {
          method: body.method === 'random_forest' ? 'random_forest' : 'cart',
          criterion: body.criterion === 'entropy' ? 'entropy' : 'gini',
          treeCount: typeof body.treeCount === 'number' ? body.treeCount : undefined,
          minSamplesLeaf: typeof body.minSamplesLeaf === 'number' ? body.minSamplesLeaf : undefined,
          minGain: typeof body.minGain === 'number' ? body.minGain : undefined,
          featureSubsetCount: typeof body.featureSubsetCount === 'number' ? body.featureSubsetCount : undefined,
          seed: typeof body.seed === 'number' ? body.seed : undefined
        }
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run decision tree.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/general-linear-model', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    dependentField: string;
    factorFields: string[];
    covariateFields: string[];
    family: string;
    link: string;
    maxIterations: number;
    tolerance: number;
    confidenceLevel: number;
    covarianceEstimator: string;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const dependentField = typeof body.dependentField === 'string' && body.dependentField.trim() ? body.dependentField.trim() : undefined;
  const factorFields = Array.isArray(body.factorFields) ? body.factorFields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  const covariateFields = Array.isArray(body.covariateFields) ? body.covariateFields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  if (!projectId || !dependentField || (factorFields.length === 0 && covariateFields.length === 0)) {
    return reply.status(400).send(fail('INVALID', 'projectId, dependentField, and at least one factor or covariate are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      generalLinearModel: analyzeGeneralLinearModel(
        dataset,
        dependentField,
        factorFields,
        covariateFields,
        analysis,
        {
          family: body.family === 'binomial' || body.family === 'poisson' ? body.family : 'gaussian',
          link: body.link === 'logit'
            || body.link === 'log'
            || body.link === 'identity'
            || body.link === 'probit'
            || body.link === 'cloglog'
            || body.link === 'sqrt'
            ? body.link
            : undefined,
          maxIterations: typeof body.maxIterations === 'number' ? body.maxIterations : undefined,
          tolerance: typeof body.tolerance === 'number' ? body.tolerance : undefined,
          confidenceLevel: typeof body.confidenceLevel === 'number' ? body.confidenceLevel : undefined,
          covarianceEstimator: body.covarianceEstimator === 'model' ? 'model' : undefined
        }
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run GLM.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/mixed-model', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    dependentField: string;
    predictorFields: string[];
    groupField: string;
    randomSlopeFields: string[];
    covarianceStructure: string;
    estimationMethod: string;
    confidenceLevel: number;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const dependentField = typeof body.dependentField === 'string' && body.dependentField.trim() ? body.dependentField.trim() : undefined;
  const groupField = typeof body.groupField === 'string' && body.groupField.trim() ? body.groupField.trim() : undefined;
  const predictorFields = Array.isArray(body.predictorFields) ? body.predictorFields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  if (!projectId || !dependentField || !groupField || predictorFields.length === 0) {
    return reply.status(400).send(fail('INVALID', 'projectId, dependentField, groupField, and at least one predictor field are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      mixedModel: analyzeMixedModel(dataset, dependentField, predictorFields, groupField, analysis, {
        randomSlopeFields: Array.isArray(body.randomSlopeFields)
          ? body.randomSlopeFields.map((field) => String(field ?? '').trim()).filter(Boolean)
          : undefined,
        covarianceStructure: body.covarianceStructure === 'independent' ? 'independent' : undefined,
        estimationMethod: body.estimationMethod === 'ml' ? 'ml' : body.estimationMethod === 'reml' ? 'reml' : undefined,
        confidenceLevel: typeof body.confidenceLevel === 'number' ? body.confidenceLevel : undefined
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run mixed model.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/gee-model', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    dependentField: string;
    predictorFields: string[];
    clusterField: string;
    family: string;
    correlation: string;
    link: string;
    maxIterations: number;
    tolerance: number;
    confidenceLevel: number;
    smallSampleCorrection: boolean;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const dependentField = typeof body.dependentField === 'string' && body.dependentField.trim() ? body.dependentField.trim() : undefined;
  const clusterField = typeof body.clusterField === 'string' && body.clusterField.trim() ? body.clusterField.trim() : undefined;
  const predictorFields = Array.isArray(body.predictorFields) ? body.predictorFields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  const family = body.family === 'binomial'
    ? 'binomial'
    : body.family === 'poisson'
      ? 'poisson'
      : 'gaussian';
  const correlation = body.correlation === 'exchangeable'
    ? 'exchangeable'
    : body.correlation === 'ar1'
      ? 'ar1'
      : 'independence';
  if (!projectId || !dependentField || !clusterField || predictorFields.length === 0) {
    return reply.status(400).send(fail('INVALID', 'projectId, dependentField, clusterField, and at least one predictor field are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      geeModel: analyzeGeneralizedEstimatingEquation(dataset, dependentField, predictorFields, clusterField, family, correlation, analysis, {
        link: body.link === 'identity'
          || body.link === 'log'
          || body.link === 'sqrt'
          || body.link === 'logit'
          || body.link === 'probit'
          || body.link === 'cloglog'
          ? body.link
          : undefined,
        maxIterations: typeof body.maxIterations === 'number' ? body.maxIterations : undefined,
        tolerance: typeof body.tolerance === 'number' ? body.tolerance : undefined,
        confidenceLevel: typeof body.confidenceLevel === 'number' ? body.confidenceLevel : undefined,
        smallSampleCorrection: typeof body.smallSampleCorrection === 'boolean' ? body.smallSampleCorrection : undefined
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run GEE model.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/repeated-measures', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    fields: string[];
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const fields = Array.isArray(body.fields) ? body.fields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  if (!projectId || fields.length < 2) {
    return reply.status(400).send(fail('INVALID', 'projectId and at least two repeated measure fields are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      repeatedMeasures: analyzeRepeatedMeasures(dataset, fields, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run repeated-measures analysis.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/survival-analysis', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    timeField: string;
    eventField: string;
    groupField: string;
    predictorFields: string[];
    confidenceLevel: number;
    tieMethod: string;
    landmarkTimes: number[];
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const timeField = typeof body.timeField === 'string' && body.timeField.trim() ? body.timeField.trim() : undefined;
  const eventField = typeof body.eventField === 'string' && body.eventField.trim() ? body.eventField.trim() : undefined;
  const groupField = typeof body.groupField === 'string' && body.groupField.trim() ? body.groupField.trim() : undefined;
  const predictorFields = Array.isArray(body.predictorFields) ? body.predictorFields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  const landmarkTimes = Array.isArray(body.landmarkTimes)
    ? body.landmarkTimes.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : undefined;
  if (!projectId || !timeField || !eventField) {
    return reply.status(400).send(fail('INVALID', 'projectId, timeField, and eventField are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      survivalAnalysis: analyzeSurvivalAnalysis(
        dataset,
        timeField,
        eventField,
        groupField,
        analysis,
        predictorFields,
        {
          confidenceLevel: typeof body.confidenceLevel === 'number' ? body.confidenceLevel : undefined,
          tieMethod: body.tieMethod === 'efron' ? 'efron' : body.tieMethod === 'breslow' ? 'breslow' : undefined,
          landmarkTimes
        }
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run survival analysis.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/complex-samples', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    targetField: string;
    strataField: string;
    clusterField: string;
    groupField: string;
    varianceEstimator: string;
    replicateWeightFields: string[];
    finitePopulationCorrectionField: string;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const targetField = typeof body.targetField === 'string' && body.targetField.trim() ? body.targetField.trim() : undefined;
  const strataField = typeof body.strataField === 'string' && body.strataField.trim() ? body.strataField.trim() : undefined;
  const clusterField = typeof body.clusterField === 'string' && body.clusterField.trim() ? body.clusterField.trim() : undefined;
  const groupField = typeof body.groupField === 'string' && body.groupField.trim() ? body.groupField.trim() : undefined;
  if (!projectId || !targetField) {
    return reply.status(400).send(fail('INVALID', 'projectId and targetField are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      complexSamples: analyzeComplexSamples(dataset, targetField, {
        ...analysis,
        strataField,
        clusterField,
        groupField,
        varianceEstimator: body.varianceEstimator === 'replicate' ? 'replicate' : undefined,
        replicateWeightFields: Array.isArray(body.replicateWeightFields)
          ? body.replicateWeightFields.map((field) => String(field ?? '').trim()).filter(Boolean)
          : undefined,
        finitePopulationCorrectionField: typeof body.finitePopulationCorrectionField === 'string'
          ? body.finitePopulationCorrectionField.trim() || undefined
          : undefined
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run complex samples analysis.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/neural-network', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    targetField: string;
    predictorFields: string[];
    task: string;
    hiddenUnits: number;
    learningRate: number;
    epochs: number;
    l2Penalty: number;
    validationSplit: number;
    seed: number;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const targetField = typeof body.targetField === 'string' && body.targetField.trim() ? body.targetField.trim() : undefined;
  const predictorFields = Array.isArray(body.predictorFields) ? body.predictorFields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  const task = body.task === 'classification' ? 'classification' : 'regression';
  if (!projectId || !targetField || predictorFields.length === 0) {
    return reply.status(400).send(fail('INVALID', 'projectId, targetField, and at least one predictor field are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      neuralNetwork: analyzeNeuralNetwork(
        dataset,
        targetField,
        predictorFields,
        task,
        typeof body.hiddenUnits === 'number' ? body.hiddenUnits : 5,
        analysis,
        {
          hiddenUnits: typeof body.hiddenUnits === 'number' ? body.hiddenUnits : undefined,
          learningRate: typeof body.learningRate === 'number' ? body.learningRate : undefined,
          epochs: typeof body.epochs === 'number' ? body.epochs : undefined,
          l2Penalty: typeof body.l2Penalty === 'number' ? body.l2Penalty : undefined,
          validationSplit: typeof body.validationSplit === 'number' ? body.validationSplit : undefined,
          seed: typeof body.seed === 'number' ? body.seed : undefined
        }
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run neural network.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.post('/syntax-run', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    syntax: string;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const syntax = typeof body.syntax === 'string' && body.syntax.trim() ? body.syntax : undefined;
  if (!projectId || !syntax) {
    return reply.status(400).send(fail('INVALID', 'projectId and syntax are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  try {
    const analysis = parseDatasetAnalysisOptions(body.analysis);
    const base = await buildProjectDatasetPayload(projectId);
    const dataset = transformDataset(base.dataset, {
      filters: parseDatasetFilters(body.filters),
      recodes: parseDatasetRecodes(body.recodes),
      analysis
    });
    return ok({
      syntaxRun: runSyntax(dataset, syntax, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run syntax.';
    return reply.status(400).send(fail('INVALID', message));
  }
});

server.get('/saved-transforms', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId.trim() : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listSavedTransforms(projectId);
  return ok({
    items: items.map((item) => ({
      ...item,
      filters: JSON.parse(item.filtersJson),
      recodes: JSON.parse(item.recodesJson)
    })),
    total: items.length
  });
});

server.post('/saved-transforms', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    label: string;
    filters: unknown[];
    recodes: unknown[];
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : undefined;
  if (!projectId || !label) return reply.status(400).send(fail('INVALID', 'projectId and label are required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const timestamp = new Date().toISOString();
  const saved = await insertSavedTransform({
    id: `transform-${randomUUID()}`,
    projectId,
    label,
    filtersJson: JSON.stringify(parseDatasetFilters(body.filters)),
    recodesJson: JSON.stringify(parseDatasetRecodes(body.recodes)),
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'transform.save',
    entityType: 'saved_transform',
    entityId: saved.id,
    details: { label: saved.label }
  });
  reply.code(201);
  return ok({
    transform: {
      ...saved,
      filters: JSON.parse(saved.filtersJson),
      recodes: JSON.parse(saved.recodesJson)
    }
  });
});

server.delete('/saved-transforms/:transformId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { transformId } = request.params as { transformId: string };
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId.trim() : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  await deleteSavedTransform(transformId, projectId);
  await recordAuditEvent({
    request,
    projectId,
    action: 'transform.delete',
    entityType: 'saved_transform',
    entityId: transformId,
    details: {}
  });
  return ok({ removed: true });
});

server.get('/saved-analysis-jobs', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId.trim() : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listSavedAnalysisJobs(projectId);
  return ok({
    items: items.map((item) => ({
      ...item,
      analysis: JSON.parse(item.analysisJson)
    })),
    total: items.length
  });
});

server.post('/saved-analysis-jobs', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    label: string;
    analysisKind: string;
    analysis: Record<string, unknown>;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : undefined;
  const analysisKind = typeof body.analysisKind === 'string' && body.analysisKind.trim() ? body.analysisKind.trim() : undefined;
  if (!projectId || !label || !analysisKind) {
    return reply.status(400).send(fail('INVALID', 'projectId, label, and analysisKind are required.'));
  }
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const timestamp = new Date().toISOString();
  const saved = await insertSavedAnalysisJob({
    id: `analysis-${randomUUID()}`,
    projectId,
    label,
    analysisKind,
    analysisJson: JSON.stringify(body.analysis ?? {}),
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'analysis.save',
    entityType: 'saved_analysis_job',
    entityId: saved.id,
    details: { label: saved.label, analysisKind: saved.analysisKind }
  });
  reply.code(201);
  return ok({
    analysisJob: {
      ...saved,
      analysis: JSON.parse(saved.analysisJson)
    }
  });
});

server.delete('/saved-analysis-jobs/:analysisJobId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const { analysisJobId } = request.params as { analysisJobId: string };
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId.trim() : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const removed = await deleteSavedAnalysisJob(analysisJobId, projectId);
  await recordAuditEvent({
    request,
    projectId,
    action: 'analysis.delete',
    entityType: 'saved_analysis_job',
    entityId: analysisJobId,
    details: {}
  });
  return ok({ removed });
});

server.get('/saved-qualitative-queries', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId.trim() : undefined;
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listSavedQualitativeQueries(projectId);
  return ok({
    items: items.map((item) => ({
      ...item,
      query: JSON.parse(item.queryJson)
    })),
    total: items.length
  });
});

server.post('/saved-qualitative-queries', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    label: string;
    mode: string;
    query: unknown;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : undefined;
  const mode = typeof body.mode === 'string' && body.mode.trim() ? body.mode.trim() : undefined;
  if (!projectId || !label || !mode) return reply.status(400).send(fail('INVALID', 'projectId, label, and mode are required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const timestamp = new Date().toISOString();
  const saved = await insertSavedQualitativeQuery({
    id: `qual-query-${randomUUID()}`,
    projectId,
    label,
    mode,
    queryJson: JSON.stringify(body.query ?? {}),
    createdAt: timestamp,
    updatedAt: timestamp
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'qual_query.save',
    entityType: 'saved_qualitative_query',
    entityId: saved.id,
    details: { label, mode }
  });
  reply.code(201);
  return ok({
    query: {
      ...saved,
      query: JSON.parse(saved.queryJson)
    }
  });
});

server.delete('/saved-qualitative-queries/:queryId', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const params = (request.params ?? {}) as Partial<{ queryId: string }>;
  const queryId = typeof params.queryId === 'string' ? params.queryId.trim() : '';
  const query = (request.query ?? {}) as Partial<{ projectId: string }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId.trim() : undefined;
  if (!queryId) return reply.status(400).send(fail('INVALID', 'queryId is required.'));
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const removed = await deleteSavedQualitativeQuery(queryId, projectId);
  if (!removed) return reply.status(404).send(fail('NOT_FOUND', 'Saved qualitative query not found.'));
  await recordAuditEvent({
    request,
    projectId,
    action: 'qual_query.delete',
    entityType: 'saved_qualitative_query',
    entityId: queryId,
    details: {}
  });
  return ok({ removed: true });
});

// ── Error handler ─────────────────────────────────────────────────────────────

server.setErrorHandler((error, _request, reply) => {
  server.log.error(error);
  const message = error instanceof Error ? error.message : 'Unknown API error.';
  const statusCode =
    message.includes('FOREIGN KEY') || message.includes('foreign key') ? 400
    : message.includes('duplicate key') || message.includes('unique') ? 409
    : 500;
  reply.status(statusCode).send(fail('API_ERROR', message));
});

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

server.listen({ port, host }).catch((error) => {
  server.log.error(error);
  process.exit(1);
});
