import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
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
import { analyzeBootstrap, analyzeClusterAnalysis, analyzeCompareMeans, analyzeComplexSamples, analyzeCorrelation, analyzeCrosstab, analyzeDecisionTree, analyzeExactTest, analyzeFactorAnalysis, analyzeForecast, analyzeGeneralLinearModel, analyzeMissingValues, analyzeNeuralNetwork, analyzeNonparametricComparison, analyzePairedTTest, analyzeRegression, analyzeReliability, analyzeRepeatedMeasures, analyzeSurvivalAnalysis, analyzeTTest, buildCaseDataset, buildCustomTable, buildImputationPlan, describeDataset, transformDataset } from '@mu/quant-engine';
import { fail, ok } from '@mu/shared-types';
import { deleteProjectArtifacts, ensureDirectory, listProjectArtifacts, pruneProjectArtifacts, readStoredArtifact, resolveStorageRoot, writeProjectArtifact, writeProjectArtifactBytes } from '@mu/storage';
import { formatAuditActionLabel } from '@mu/ui';
import {
  buildAppendixReport,
  buildChatHistoryReport,
  buildCodeCodeMatrixReport,
  buildCodeCooccurrenceReport,
  buildEvidenceReport,
  buildMatrixCodingReport,
  buildCaseSummariesReport,
  buildCodingComparisonReport,
  buildProjectCodebookReport,
  buildQualitativeQuerySummaryReport,
  buildFrameworkMatrixSummaryReport,
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
  listExternalSqlProfiles, insertExternalSqlProfile, deleteExternalSqlProfile,
  listExternalSqlImportJobs, insertExternalSqlImportJob, deleteExternalSqlImportJob, deleteCasesImportedBySqlJob,
  listDueExternalSqlImportJobs, updateExternalSqlImportJobRunState, updateExternalSqlImportJobSchedule,
  listSavedTransforms, insertSavedTransform, deleteSavedTransform,
  listSavedQualitativeQueries, insertSavedQualitativeQuery, deleteSavedQualitativeQuery,
  insertSource, listSources, updateSourceContent,
  insertCode, listCodes,
  insertVariable, listVariables,
  insertCase, listCases,
  insertMemo, listMemos,
  insertAttribute, listAttributes,
  insertAnnotation, listAnnotations,
  insertRelationship, listRelationships,
  insertProjectReference, listProjectReferences, deleteProjectReference,
  insertTranscriptSyncLink, listTranscriptSyncLinks, deleteTranscriptSyncLinksByMediaSource,
  insertTranscriptionJob, listTranscriptionJobs, updateTranscriptionJob,
  insertSegment, listSegments,
  insertCodeApplication, listCodeApplications,
  listTraceLinks, deriveTraceLinks,
  getProjectSummary, getProjectActivity
} from './db.js';
import { parseImportedFile } from './imports.js';
import { parseBibtexReferences, parseRisReferences } from './references.js';

const apiModuleDir = path.dirname(fileURLToPath(import.meta.url));
const runtimeRoot = process.cwd();

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
    oidcState?: string;
    oidcCodeVerifier?: string;
  }
}

const server = Fastify({ logger: true });
const isPortableMode = process.env.MU_PORTABLE === '1' || process.env.MU_PORTABLE === 'true';
const shouldServeWeb = isPortableMode || process.env.MU_SERVE_WEB === '1' || process.env.MU_SERVE_WEB === 'true';
let IDLE_TIMEOUT_MS = 90 * 60 * 1000;
const ACCOUNT_CLEANUP_INTERVAL_MS = 12 * 60 * 60 * 1000;
const SQL_IMPORT_SCHEDULER_INTERVAL_MS = 60 * 1000;
let LOGIN_THROTTLE_WINDOW_MS = 15 * 60 * 1000;
let LOGIN_THROTTLE_MAX_FAILURES = 5;
let AUDIT_EXPORT_MAX_ROWS = 2000;
let BACKUP_RETENTION_DAYS = 30;
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
await server.register(fastifyMultipart, {
  limits: {
    fileSize: 25 * 1024 * 1024,
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
LOGIN_THROTTLE_WINDOW_MS = initialGovernancePolicy.loginThrottleWindowMinutes * 60 * 1000;
LOGIN_THROTTLE_MAX_FAILURES = initialGovernancePolicy.loginThrottleMaxFailures;
AUDIT_EXPORT_MAX_ROWS = initialGovernancePolicy.auditExportMaxRows;
BACKUP_RETENTION_DAYS = initialGovernancePolicy.backupRetentionDays;

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

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function assertAuth(request: FastifyRequest, reply: FastifyReply): Promise<string | null> {
  const userId = request.session.userId;
  if (!userId) {
    await reply.status(401).send(fail('UNAUTHORIZED', 'Login required.'));
    return null;
  }
  await deleteExpiredUsers();
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

function validateDeploymentEnvironment(): Array<{ severity: 'error' | 'warning'; key: string; message: string }> {
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
      try {
        const { imported, profileLabel } = await executeExternalSqlImportJob(job);
        const successMessage = `Imported ${imported.casesCreated} case rows and replaced ${imported.removedPriorCases} prior rows.`;
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
            ...imported
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to refresh the SQL import job.';
        await settleExternalSqlImportJobRun({
          job,
          status: 'error',
          message
        });
        await recordSystemAuditEvent({
          projectId: job.projectId,
          action: 'sql_import_job.run_scheduled_failed',
          entityType: 'external_sql_import_job',
          entityId: job.id,
          details: { label: job.label, message }
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

async function buildQualitativeProjectPayload(projectId: string) {
  const [summary, sources, segments, codes, cases, memos, attributes, annotations, relationships, references, transcriptSyncLinks, transcriptionJobs, codeApplications] = await Promise.all([
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
    transcriptSyncLinks,
    transcriptionJobs,
    codeApplications
  };
}

async function buildProjectBackupSnapshot(projectId: string) {
  const [qualitative, variables, traceLinks, members, savedTransforms, savedAnalysisJobs, savedQualQueries, auditEvents, projectMessages] = await Promise.all([
    buildQualitativeProjectPayload(projectId),
    listVariables(projectId),
    listTraceLinks(projectId),
    listProjectMembers(projectId),
    listSavedTransforms(projectId),
    listSavedAnalysisJobs(projectId),
    listSavedQualitativeQueries(projectId),
    listAuditEvents(projectId, { limit: AUDIT_EXPORT_MAX_ROWS }),
    listProjectMessages(projectId, 1000)
  ]);

  return {
    version: 1,
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
    transcriptSyncLinks: qualitative.transcriptSyncLinks,
    transcriptionJobs: qualitative.transcriptionJobs,
    segments: qualitative.segments,
    codeApplications: qualitative.codeApplications,
    traceLinks,
    savedTransforms,
    savedAnalysisJobs,
    savedQualitativeQueries: savedQualQueries,
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
    await insertMemo(createMemo({
      id: `memo-${randomUUID()}`,
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
    await insertAnnotation(createAnnotation({
      id: `annotation-${randomUUID()}`,
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
      await insertProjectReference({
        id: `reference-${randomUUID()}`,
        projectId: restoredProjectId,
        sourceFormat: reference.sourceFormat === 'ris' || reference.sourceFormat === 'bibtex' ? reference.sourceFormat : 'manual',
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
      mode: 'segment_assembly',
      note: typeof job.note === 'string' ? job.note : '',
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

function parseTextSearchMode(value: unknown): 'contains' | 'phrase' | 'whole_word' {
  return value === 'phrase' || value === 'whole_word' ? value : 'contains';
}

function parseCompoundQueryClauses(value: unknown): Array<{
  field: 'text' | 'code' | 'case' | 'source' | 'coder' | 'memo' | 'source_kind' | 'segment_kind';
  operator: 'contains' | 'equals' | 'whole_word' | 'phrase' | 'present';
  value?: string;
}> {
  if (!Array.isArray(value)) return [];
  const validFields = new Set(['text', 'code', 'case', 'source', 'coder', 'memo', 'source_kind', 'segment_kind']);
  const validOperators = new Set(['contains', 'equals', 'whole_word', 'phrase', 'present']);
  return value.flatMap((item) => {
    const field = typeof item?.field === 'string' && validFields.has(item.field) ? item.field as 'text' | 'code' | 'case' | 'source' | 'coder' | 'memo' | 'source_kind' | 'segment_kind' : null;
    const operator = typeof item?.operator === 'string' && validOperators.has(item.operator) ? item.operator as 'contains' | 'equals' | 'whole_word' | 'phrase' | 'present' : null;
    if (!field || !operator) return [];
    return [{
      field,
      operator,
      value: typeof item?.value === 'string' && item.value.trim() ? item.value.trim() : undefined
    }];
  });
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

function buildMediaTimeline(params: {
  sourceId: string;
  segments: Array<{ id: string; sourceId: string; kind: string; anchor: any; text: string }>;
  syncLinks: Array<{ mediaSourceId: string; transcriptSourceId: string; segmentId: string | null; startMs: number; endMs: number; transcriptText: string }>;
}) {
  const timeSegments = params.segments
    .filter((segment) => segment.sourceId === params.sourceId && segment.kind === 'time_range')
    .map((segment) => ({
      segmentId: segment.id,
      startMs: typeof segment.anchor?.startMs === 'number' ? segment.anchor.startMs : 0,
      endMs: typeof segment.anchor?.endMs === 'number' ? segment.anchor.endMs : 0,
      text: segment.text
    }))
    .sort((left, right) => left.startMs - right.startMs);
  const syncLinks = params.syncLinks
    .filter((link) => link.mediaSourceId === params.sourceId)
    .sort((left, right) => left.startMs - right.startMs);
  const durationMs = Math.max(
    0,
    ...timeSegments.map((segment) => segment.endMs),
    ...syncLinks.map((link) => link.endMs)
  );
  return {
    durationMs,
    timeSegments,
    syncLinks
  };
}

function buildMergeReview(params: {
  projectId: string;
  sourceId?: string;
  codeId?: string;
  segments: Array<{ id: string; sourceId: string; text: string }>;
  sources: Array<{ id: string; title: string }>;
  applications: Array<{ id: string; projectId: string; segmentId: string; codeId: string; coderId: string; caseId: string | null; confidence: number }>;
  codes: Array<{ id: string; name: string }>;
}) {
  const segmentMap = new Map(params.segments.map((segment) => [segment.id, segment]));
  const sourceMap = new Map(params.sources.map((source) => [source.id, source]));
  const codeMap = new Map(params.codes.map((code) => [code.id, code]));
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
      return {
        segmentId,
        sourceId: segment?.sourceId ?? '',
        sourceTitle: sourceMap.get(segment?.sourceId ?? '')?.title ?? null,
        codeId,
        codeName: codeMap.get(codeId)?.name ?? codeId,
        coderIds,
        applicationCount: apps.length,
        confidenceSpread,
        excerpt: segment?.text ?? '',
        needsReview: coderIds.length > 1 || confidenceSpread >= 0.2
      };
    })
    .filter((row) => row.needsReview)
    .sort((left, right) => right.coderIds.length - left.coderIds.length || right.confidenceSpread - left.confidenceSpread);
  return {
    candidateCount: rows.length,
    rows
  };
}

async function buildProjectDatasetPayload(projectId: string, analysis?: ReturnType<typeof parseDatasetAnalysisOptions>) {
  const [cases, attributes, variables, traceLinks] = await Promise.all([
    listCases(projectId),
    listAttributes(projectId),
    listVariables(projectId),
    listTraceLinks(projectId)
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

  return {
    dataset,
    report: describeDataset(dataset, analysis)
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
    missingValues,
    missingStrategy: entry.missingStrategy === 'listwise' ? 'listwise' as const : 'available' as const
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
  return ok({ status: 'ok' as const, db: { host: getDbHost() } });
});

server.get('/integrations/status', async () => {
  return ok({
    sql: resolveSqlIntegrationStatus(),
    office: resolveOfficeIntegrationStatus()
  });
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
  try {
    const { imported } = await executeExternalSqlImportJob({
      ...job,
      maxRows
    });
    const successMessage = `Imported ${imported.casesCreated} cases and replaced ${imported.removedPriorCases} prior case rows.`;
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
      details: { label: job.label, maxRows, ...imported }
    });
    return ok({ imported });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to refresh the SQL import job.';
    await settleExternalSqlImportJobRun({
      job,
      status: 'error',
      message
    });
    return reply.status(400).send(fail('INVALID', message));
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

server.get('/governance/status', async () => {
  const policy = await getGovernancePolicy();
  const deploymentIssues = validateDeploymentEnvironment();
  return ok({
    auditTrailEnabled: true,
    oidcEnabled: oidcConfig.enabled,
    sessionIdleTimeoutMinutes: policy.idleTimeoutMinutes,
    loginThrottle: {
      enabled: true,
      windowMinutes: policy.loginThrottleWindowMinutes,
      maxFailures: policy.loginThrottleMaxFailures
    },
    auditExportMaxRows: policy.auditExportMaxRows,
    backupRetentionDays: policy.backupRetentionDays,
    exportStorageEnabled: true,
    securityHeadersEnabled: true,
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
    loginThrottleWindowMinutes: number;
    loginThrottleMaxFailures: number;
    auditExportMaxRows: number;
    backupRetentionDays: number;
  }>;
  const idleTimeoutMinutes = Math.max(15, Math.min(720, Number(body.idleTimeoutMinutes) || 90));
  const loginThrottleWindowMinutes = Math.max(1, Math.min(240, Number(body.loginThrottleWindowMinutes) || 15));
  const loginThrottleMaxFailures = Math.max(1, Math.min(20, Number(body.loginThrottleMaxFailures) || 5));
  const auditExportMaxRows = Math.max(100, Math.min(100000, Number(body.auditExportMaxRows) || 2000));
  const backupRetentionDays = Math.max(1, Math.min(3650, Number(body.backupRetentionDays) || 30));
  const policy = await updateGovernancePolicy({
    idleTimeoutMinutes,
    loginThrottleWindowMinutes,
    loginThrottleMaxFailures,
    auditExportMaxRows,
    backupRetentionDays,
    updatedByUserId: userId
  });
  IDLE_TIMEOUT_MS = policy.idleTimeoutMinutes * 60 * 1000;
  LOGIN_THROTTLE_WINDOW_MS = policy.loginThrottleWindowMinutes * 60 * 1000;
  LOGIN_THROTTLE_MAX_FAILURES = policy.loginThrottleMaxFailures;
  AUDIT_EXPORT_MAX_ROWS = policy.auditExportMaxRows;
  BACKUP_RETENTION_DAYS = policy.backupRetentionDays;
  return ok({ policy });
});

server.get('/deployment/validate', async (request, reply) => {
  const userId = await assertProfessor(request, reply);
  if (!userId) return;
  const issues = validateDeploymentEnvironment();
  const storageRoot = resolveStorageRoot();
  await ensureDirectory(storageRoot);
  return ok({
    storageRoot,
    issues,
    ready: issues.every((issue) => issue.severity !== 'error')
  });
});

server.get('/auth/oidc/config', async () => {
  return ok({
    enabled: oidcConfig.enabled,
    providerName: oidcConfig.providerName
  });
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
  const body = (request.body ?? {}) as Partial<{ username: string; password: string; role: string }>;
  const username = typeof body.username === 'string' ? normalizeMuUsername(body.username) : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role = resolveMuRole(body.role);

  if (!username || username.length < 3) return reply.status(400).send(fail('INVALID', 'Username must be at least 3 characters.'));
  if (!password || password.length < 6) return reply.status(400).send(fail('INVALID', 'Password must be at least 6 characters.'));

  const existing = await findUserByUsername(username);
  if (existing) return reply.status(409).send(fail('CONFLICT', 'Account already exists for that MU username. Use Sign in.'));

  const user = await createUserRecord(`user-${randomUUID()}`, username, password, role);
  setSessionUser(request, user);
  reply.code(201);
  return ok({ user: { id: user.id, username: user.username, role: user.role, expiresAt: user.expiresAt } });
});

server.post('/auth/login', async (request, reply) => {
  await deleteExpiredUsers();
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
    coderA: string;
    coderB: string;
    searchText: string;
    memoOnly: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const payload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
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
    evidenceCoverage: scoreEvidenceCoverage(retrieval.length)
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
    caseSensitive: string;
    contextWindow: string;
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  if (!(typeof query.searchText === 'string' && query.searchText.trim())) {
    return reply.status(400).send(fail('INVALID', 'searchText is required.'));
  }

  const payload = await buildQualitativeProjectPayload(projectId);
  return ok({
    textSearch: buildTextSearch({
      query: parseEvidenceQuery(query),
      searchText: query.searchText.trim(),
      matchMode: parseTextSearchMode(query.matchMode),
      caseSensitive: query.caseSensitive === 'true',
      contextWindow: typeof query.contextWindow === 'string' ? Number(query.contextWindow) : undefined,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos
    })
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

  const payload = await buildQualitativeProjectPayload(projectId);
  return ok({
    wordFrequency: buildWordFrequency({
      query: parseEvidenceQuery(query),
      topN: typeof query.topN === 'string' ? Number(query.topN) : undefined,
      minLength: typeof query.minLength === 'string' ? Number(query.minLength) : undefined,
      excludeStopWords: query.excludeStopWords === undefined ? undefined : query.excludeStopWords === 'true',
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos
    })
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

  const payload = await buildQualitativeProjectPayload(projectId);
  return ok({
    wordCloud: buildWordCloud({
      query: parseEvidenceQuery(query),
      topN: typeof query.topN === 'string' ? Number(query.topN) : undefined,
      minLength: typeof query.minLength === 'string' ? Number(query.minLength) : undefined,
      excludeStopWords: query.excludeStopWords === undefined ? undefined : query.excludeStopWords === 'true',
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos
    })
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
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const payload = await buildQualitativeProjectPayload(projectId);
  return ok({
    mapVisualization: buildMapVisualization({
      query: parseEvidenceQuery(query),
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      attributes: payload.attributes
    })
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
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const payload = await buildQualitativeProjectPayload(projectId);
  return ok({
    codeHierarchy: buildCodeHierarchy({
      query: parseEvidenceQuery(query),
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    })
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
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const payload = await buildQualitativeProjectPayload(projectId);
  const conceptMap = buildConceptMap({
    query: parseEvidenceQuery(query),
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos,
    codes: payload.codes,
    relationships: payload.relationships
  });
  return ok({
    conceptMap,
    codeClusters: buildCodeClusters({
      conceptMap,
      codes: payload.codes
    })
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

  const payload = await buildQualitativeProjectPayload(projectId);
  const sentiment = buildSentimentAnalysis({
    query: parseEvidenceQuery(query),
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos
  });

  return ok({ sentiment });
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
    clauses: unknown[];
  }>;
  const projectId = requireProjectId(reply, body.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const clauses = parseCompoundQueryClauses(body.clauses);
  if (clauses.length === 0) {
    return reply.status(400).send(fail('INVALID', 'At least one valid compound query clause is required.'));
  }
  const operator = body.operator === 'all' || body.operator === 'none' ? body.operator : 'any';
  const payload = await buildQualitativeProjectPayload(projectId);
  const compoundQuery = buildCompoundQuery({
    scopeQuery: parseEvidenceQuery(body.scope ?? {}),
    operator,
    clauses,
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
    details: { operator, clauseCount: clauses.length, matchCount: compoundQuery.matchCount }
  });
  return ok({ compoundQuery });
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

  const payload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  return ok({
    matrix: buildMatrixCoding({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    })
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

  const payload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  return ok({
    view: buildCodeByCaseView({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    })
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

  const payload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  return ok({
    cooccurrence: buildCodeCooccurrence({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    })
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

  const payload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  return ok({
    matrix: buildCodeCodeMatrix({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    })
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
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const payload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  return ok({
    report: buildQualitativeQueryReport({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    })
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

  const payload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  return ok({
    frameworkMatrix: buildFrameworkMatrix({
      query: evidenceQuery,
      sources: payload.sources,
      segments: payload.segments,
      applications: payload.codeApplications,
      cases: payload.cases,
      memos: payload.memos,
      codes: payload.codes
    })
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
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  if (!(typeof query.codeId === 'string' && query.codeId.trim())) {
    return reply.status(400).send(fail('INVALID', 'codeId is required.'));
  }

  const payload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery({
    sourceId: query.sourceId,
    sourceKind: query.sourceKind,
    segmentKind: query.segmentKind,
    caseId: query.caseId,
    searchText: query.searchText,
    memoOnly: query.memoOnly
  });
  try {
    return ok({
      comparison: buildCodingComparison({
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
      })
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
  }>;
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;

  const payload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery({
    sourceId: query.sourceId,
    sourceKind: query.sourceKind,
    segmentKind: query.segmentKind,
    caseId: query.caseId,
    searchText: query.searchText,
    memoOnly: query.memoOnly
  });
  try {
    return ok({
      summary: buildInterRaterSummary({
        query: evidenceQuery,
        coderA: typeof query.coderA === 'string' ? query.coderA : undefined,
        coderB: typeof query.coderB === 'string' ? query.coderB : undefined,
        sources: payload.sources,
        segments: payload.segments,
        applications: payload.codeApplications,
        cases: payload.cases,
        memos: payload.memos,
        codes: payload.codes
      })
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

  const payload = await buildQualitativeProjectPayload(projectId);
  const scopeQuery = parseEvidenceQuery({
    sourceId: body.sourceId,
    sourceKind: body.sourceKind,
    segmentKind: body.segmentKind,
    caseId: body.caseId,
    searchText: body.searchText,
    memoOnly: typeof body.memoOnly === 'boolean' ? String(body.memoOnly) : body.memoOnly
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

  let createdCount = 0;
  let skippedCount = 0;
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

  return ok({
    autocode: {
      method: 'keyword',
      codeId,
      keywords,
      scopeCount: matches.length,
      matchedCount: matchedSegments.length,
      createdCount,
      skippedCount,
      matches: matchedSegments.slice(0, 50)
    }
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

  const payload = await buildQualitativeProjectPayload(projectId);
  const scopeQuery = parseEvidenceQuery({
    sourceId: body.sourceId,
    sourceKind: body.sourceKind,
    segmentKind: body.segmentKind,
    caseId: body.caseId,
    searchText: body.searchText,
    memoOnly: typeof body.memoOnly === 'boolean' ? String(body.memoOnly) : body.memoOnly
  });
  const autocode = buildPatternAutocode({
    query: scopeQuery,
    patterns,
    expandSynonyms: body.expandSynonyms === true,
    matchMode: parseTextSearchMode(body.matchMode),
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

  let createdCount = 0;
  let skippedCount = 0;
  for (const hit of autocode.hits) {
    const dedupeKey = `${hit.segmentId}::${codeId}::${request.session.username ?? 'system'}`;
    if (existingKeys.has(dedupeKey)) {
      skippedCount += 1;
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

  return ok({
    autocode: {
      method: 'pattern',
      codeId,
      patterns: autocode.patterns,
      expandedPatterns: autocode.expandedPatterns,
      matchMode: autocode.matchMode,
      scopeCount: autocode.scopeCount,
      matchedCount: autocode.matchedCount,
      createdCount,
      skippedCount,
      matches: autocode.hits.slice(0, 50)
    }
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

    items.push({
      filename: upload.filename,
      importedAs: 'tabular',
      caseLabelField: parsed.caseLabelField,
      sheetName: parsed.sheetName,
      casesCreated,
      attributesCreated
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
  const query = (request.query ?? {}) as Partial<{ projectId: string; format: string }>;
  const projectId = typeof query.projectId === 'string' && query.projectId.trim() ? query.projectId : undefined;
  const format = query.format === 'json' || query.format === 'xlsx' ? query.format : 'csv';
  if (!projectId) return reply.status(400).send(fail('INVALID', 'projectId is required.'));
  if (!await assertProjectExportAccess(request, userId, projectId, reply)) return;

  const payload = await buildProjectDatasetPayload(projectId);
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

  const payload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const retrieval = retrieveEvidence({
    query: evidenceQuery,
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos
  });
  const evidenceBundle = buildEvidenceExport({
    project: { id: payload.project.id, name: payload.project.name },
    retrieval,
    codes: payload.codes
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
      details: { matches: retrieval.length, file: artifact.relativePath, format: 'docx' }
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
      details: { matches: retrieval.length, file: artifact.relativePath, format: 'pdf' }
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
      details: { matches: retrieval.length, file: artifact.relativePath, format: 'xlsx' }
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
      details: { matches: retrieval.length, file: artifact.relativePath, format: 'txt' }
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
    details: { matches: retrieval.length, file: artifact.relativePath, format: 'json' }
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
    sourceId: string;
    sourceKind: string;
    segmentKind: string;
    codeId: string;
    coCodeId: string;
    caseId: string;
    coderId: string;
    coderA: string;
    coderB: string;
    searchText: string;
    memoOnly: string;
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
    || query.kind === 'query-report'
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
  const payload = await buildQualitativeProjectPayload(projectId);
  const evidenceQuery = parseEvidenceQuery(query);
  const retrieval = retrieveEvidence({
    query: evidenceQuery,
    sources: payload.sources,
    segments: payload.segments,
    applications: payload.codeApplications,
    cases: payload.cases,
    memos: payload.memos
  });
  const evidenceBundle = buildEvidenceExport({
    project: {
      id: payload.project.id,
      name: payload.project.name
    },
    retrieval,
    codes: payload.codes
  });
  const queryLabels = formatEvidenceFilterLabels(evidenceQuery);
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
                comparison: buildCodingComparison({
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
                })
              })
              : kind === 'inter-rater-summary'
                ? buildInterRaterSummaryReport({
                  project: payload.project,
                  queryLabels,
                  summary: buildInterRaterSummary({
                    query: evidenceQuery,
                    coderA: typeof query.coderA === 'string' ? query.coderA : undefined,
                    coderB: typeof query.coderB === 'string' ? query.coderB : undefined,
                    sources: payload.sources,
                    segments: payload.segments,
                    applications: payload.codeApplications,
                    cases: payload.cases,
                    memos: payload.memos,
                    codes: payload.codes
                  })
                })
              : kind === 'query-report'
                ? buildQualitativeQuerySummaryReport({
                  project: payload.project,
                  queryLabels,
                  report: buildQualitativeQueryReport({
                    query: evidenceQuery,
                    sources: payload.sources,
                    segments: payload.segments,
                    applications: payload.codeApplications,
                    cases: payload.cases,
                    memos: payload.memos,
                    codes: payload.codes
                  })
                })
                : buildChatHistoryReport({
                  project: payload.project,
                  messages: await listProjectMessages(projectId, 1000)
                });

  const baseFileName = `${projectId}-${kind}`;

  if (format === 'docx') {
    const docxPayload = await renderStructuredReportDocx(report);
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
      details: { kind, format: 'docx', file: artifact.relativePath }
    });
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    reply.header('Content-Disposition', `attachment; filename="${baseFileName}.docx"`);
    return reply.send(Buffer.from(docxPayload));
  }

  if (format === 'pdf') {
    const pdfPayload = await renderStructuredReportPdf(report);
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
      details: { kind, format: 'pdf', file: artifact.relativePath }
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
      details: { kind, format: 'xlsx', file: artifact.relativePath }
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
      details: { kind, format: 'txt', file: artifact.relativePath }
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
    details: { kind, format: 'json', file: artifact.relativePath }
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

server.get('/references', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const items = await listProjectReferences(projectId);
  return ok({ items, total: items.length });
});

server.post('/references/import', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    format: string;
    text: string;
    relatedSourceId: string;
  }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const rawText = typeof body.text === 'string' ? body.text.trim() : '';
  if (!rawText) {
    return reply.status(400).send(fail('INVALID', 'Reference text is required.'));
  }
  const format = body.format === 'bibtex' ? 'bibtex' : 'ris';
  const drafts = format === 'bibtex' ? parseBibtexReferences(rawText) : parseRisReferences(rawText);
  if (drafts.length === 0) {
    return reply.status(400).send(fail('INVALID', 'No references could be parsed from the supplied text.'));
  }
  const timestamp = new Date().toISOString();
  const items = [];
  for (const draft of drafts) {
    const reference = await insertProjectReference({
      id: `reference-${randomUUID()}`,
      projectId,
      sourceFormat: format,
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
  }
  await recordAuditEvent({
    request,
    projectId,
    action: 'reference.import',
    entityType: 'project_reference_batch',
    entityId: `reference-import-${randomUUID()}`,
    details: { format, importedCount: items.length }
  });
  reply.code(201);
  return ok({ items, total: items.length });
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
  const link = await insertTranscriptSyncLink({
    id: `sync-${randomUUID()}`,
    projectId,
    mediaSourceId,
    transcriptSourceId,
    segmentId: typeof body.segmentId === 'string' && body.segmentId.trim() ? body.segmentId.trim() : null,
    startMs,
    endMs,
    transcriptText: typeof body.transcriptText === 'string' ? body.transcriptText : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'transcript_sync.create',
    entityType: 'transcript_sync_link',
    entityId: link.id,
    details: { mediaSourceId, transcriptSourceId, segmentId: link.segmentId, startMs, endMs }
  });
  return ok({ link });
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
      syncLinks: payload.transcriptSyncLinks
    })
  });
});

server.get('/merge-review', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const query = request.query as { projectId?: string; sourceId?: string; codeId?: string };
  const projectId = requireProjectId(reply, query.projectId);
  if (!projectId) return;
  if (!await assertProjectAccess(userId, projectId, reply)) return;
  const payload = await buildQualitativeProjectPayload(projectId);
  return ok({
    review: buildMergeReview({
      projectId,
      sourceId: typeof query.sourceId === 'string' && query.sourceId.trim() ? query.sourceId.trim() : undefined,
      codeId: typeof query.codeId === 'string' && query.codeId.trim() ? query.codeId.trim() : undefined,
      segments: payload.segments,
      sources: payload.sources,
      applications: payload.codeApplications,
      codes: payload.codes
    })
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
  const body = (request.body ?? {}) as Partial<{ projectId: string; mediaSourceId: string; note: string }>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || !await assertProjectAccess(userId, projectId, reply)) return;
  const mediaSourceId = typeof body.mediaSourceId === 'string' ? body.mediaSourceId.trim() : '';
  if (!mediaSourceId) {
    return reply.status(400).send(fail('INVALID', 'mediaSourceId is required.'));
  }
  const now = new Date().toISOString();
  const job = await insertTranscriptionJob({
    id: `transcription-${randomUUID()}`,
    projectId,
    mediaSourceId,
    outputSourceId: null,
    status: 'queued',
    mode: 'segment_assembly',
    note: typeof body.note === 'string' ? body.note : '',
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
    details: { mediaSourceId }
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
  const payload = await buildQualitativeProjectPayload(projectId);
  const mediaSource = payload.sources.find((source) => source.id === job.mediaSourceId);
  if (!mediaSource) {
    return reply.status(404).send(fail('NOT_FOUND', 'Media source not found.'));
  }
  const timeSegments = payload.segments
    .filter((segment) => segment.sourceId === mediaSource.id && segment.kind === 'time_range')
    .sort((left, right) => (left.anchor as any).startMs - (right.anchor as any).startMs);
  const transcriptBody = timeSegments.length > 0
    ? timeSegments.map((segment) => {
      const anchor = segment.anchor as { startMs: number; endMs: number };
      return `[${(anchor.startMs / 1000).toFixed(1)}s - ${(anchor.endMs / 1000).toFixed(1)}s] ${segment.text}`;
    }).join('\n')
    : `Transcript placeholder for ${mediaSource.title}.\nNo time-range segments were present, so no transcript excerpts could be assembled yet.`;
  const now = new Date().toISOString();
  let outputSourceId = job.outputSourceId;
  if (!outputSourceId) {
    outputSourceId = `source-${randomUUID()}`;
    await insertSource(createSource({
      id: outputSourceId,
      projectId,
      kind: 'transcript',
      title: `${mediaSource.title} transcript`,
      language: mediaSource.language,
      contentType: 'text/plain',
      contentUrl: null,
      contentText: transcriptBody,
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
      contentText: transcriptBody,
      updatedAt: now
    });
  }
  await deleteTranscriptSyncLinksByMediaSource(projectId, mediaSource.id);
  for (const segment of timeSegments) {
    const anchor = segment.anchor as { startMs: number; endMs: number };
    await insertTranscriptSyncLink({
      id: `sync-${randomUUID()}`,
      projectId,
      mediaSourceId: mediaSource.id,
      transcriptSourceId: outputSourceId,
      segmentId: segment.id,
      startMs: anchor.startMs,
      endMs: anchor.endMs,
      transcriptText: segment.text,
      createdAt: now,
      updatedAt: now
    });
  }
  const updatedJob = await updateTranscriptionJob({
    ...job,
    outputSourceId,
    status: 'completed',
    updatedAt: now,
    completedAt: now
  });
  await recordAuditEvent({
    request,
    projectId,
    action: 'transcription_job.run',
    entityType: 'transcription_job',
    entityId: updatedJob.id,
    details: { mediaSourceId: mediaSource.id, outputSourceId, segmentCount: timeSegments.length }
  });
  return ok({
    job: updatedJob,
    transcriptSourceId: outputSourceId,
    segmentCount: timeSegments.length
  });
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
      nonparametric: analyzeNonparametricComparison(dataset, outcomeField, groupField, analysis)
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
          : []
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
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const fields = Array.isArray(body.fields) ? body.fields.map((field) => String(field ?? '').trim()).filter(Boolean) : [];
  const factorCount = typeof body.factorCount === 'number' ? body.factorCount : undefined;
  const rotation = body.rotation === 'varimax' ? 'varimax' : 'none';
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
      factorAnalysis: analyzeFactorAnalysis(dataset, fields, factorCount, analysis, rotation)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run factor analysis.';
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
    rowField: string;
    columnField: string;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const rowField = typeof body.rowField === 'string' && body.rowField.trim() ? body.rowField.trim() : undefined;
  const columnField = typeof body.columnField === 'string' && body.columnField.trim() ? body.columnField.trim() : undefined;
  if (!projectId || !rowField || !columnField) {
    return reply.status(400).send(fail('INVALID', 'projectId, rowField, and columnField are required.'));
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
      exactTest: analyzeExactTest(dataset, rowField, columnField, analysis)
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

server.post('/imputation-plan', async (request, reply) => {
  const userId = await assertAuth(request, reply);
  if (!userId) return;
  const body = (request.body ?? {}) as Partial<{
    projectId: string;
    filters: unknown[];
    recodes: unknown[];
    analysis: unknown;
    strategies: Array<{ field?: string; method?: string; value?: string | number | boolean | null }>;
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const strategies = Array.isArray(body.strategies)
    ? body.strategies
      .map((strategy) => ({
        field: typeof strategy?.field === 'string' ? strategy.field.trim() : '',
        method: strategy?.method === 'mean' ? 'mean' as const : strategy?.method === 'constant' ? 'constant' as const : 'mode' as const,
        value: strategy?.value ?? null
      }))
      .filter((strategy) => strategy.field)
    : [];
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
      forecast: analyzeForecast(dataset, timeField, valueField, typeof body.horizon === 'number' ? body.horizon : 3, analysis)
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
      decisionTree: analyzeDecisionTree(dataset, targetField, predictorFields, typeof body.maxDepth === 'number' ? body.maxDepth : 3, analysis)
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
      generalLinearModel: analyzeGeneralLinearModel(dataset, dependentField, factorFields, covariateFields, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run GLM.';
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
  }>;
  const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : undefined;
  const timeField = typeof body.timeField === 'string' && body.timeField.trim() ? body.timeField.trim() : undefined;
  const eventField = typeof body.eventField === 'string' && body.eventField.trim() ? body.eventField.trim() : undefined;
  const groupField = typeof body.groupField === 'string' && body.groupField.trim() ? body.groupField.trim() : undefined;
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
      survivalAnalysis: analyzeSurvivalAnalysis(dataset, timeField, eventField, groupField, analysis)
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
        groupField
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
      neuralNetwork: analyzeNeuralNetwork(dataset, targetField, predictorFields, task, typeof body.hiddenUnits === 'number' ? body.hiddenUnits : 5, analysis)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run neural network.';
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
