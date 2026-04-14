const API_BASE = /:(4000)$/.test(window.location.origin) ? window.location.origin : 'http://localhost:4000';
const POLL_INTERVAL_MS = 5000;
const IDLE_TIMEOUT_MS = 90 * 60 * 1000;
const ACTIVITY_PING_INTERVAL_MS = 5 * 60 * 1000;
const LOGIN_MODE_STORAGE_KEY = 'muStatistics.loginMode';
const COMPILED_REPORT_PRESETS_STORAGE_KEY = 'muStatistics.compiledReportPresets';

const state = {
  currentUser: null,
  oidcEnabled: false,
  oidcProviderName: 'MU Single Sign-On',
  integrationStatus: null,
  recentOfficeArtifacts: [],
  activeTab: 'collaboration',
  qualitativeView: 'library',
  qualitativeSubViews: {
    library: 'sources',
    coding: 'reader',
    capture: 'setup',
    evidence: 'record'
  },
  quantitativeView: 'data',
  quantitativeSubViews: {
    data: 'import',
    transform: 'derive',
    describe: 'summary',
    test: 'compare',
    model: 'correlation'
  },
  projects: [],
  selectedProjectId: null,
  governanceStatus: null,
  governancePolicy: null,
  deploymentValidation: null,
  selectedSummary: null,
  selectedMembers: [],
  selectedSources: [],
  selectedCodes: [],
  selectedVariables: [],
  selectedVariableId: null,
  selectedCases: [],
  selectedMemos: [],
  selectedAnnotations: [],
  selectedRelationships: [],
  selectedReferences: [],
  selectedTranscriptSyncLinks: [],
  selectedAttributes: [],
  selectedPresence: [],
  selectedMessages: [],
  selectedSegments: [],
  selectedCodeApplications: [],
  selectedTraceLinks: [],
  transcriptionJobs: [],
  externalSqlProfiles: [],
  externalSqlTables: [],
  externalSqlPreview: null,
  externalSqlImportJobs: [],
  externalSqlQueryPreview: null,
  selectedSqlProfileId: null,
  selectedSqlTableKey: '',
  selectedAuditEvents: [],
  backupItems: [],
  savedTransforms: [],
  savedAnalysisJobs: [],
  savedQualitativeQueries: [],
  retrievalResults: [],
  retrievalCoverage: '',
  retrievalPrompt: '',
  cooccurrenceResult: null,
  matrixCodingResult: null,
  codeCodeMatrixResult: null,
  codeByCaseView: null,
  qualitativeQueryReport: null,
  frameworkMatrixResult: null,
  codingComparisonResult: null,
  interRaterSummaryResult: null,
  autocodeResult: null,
  sentimentResult: null,
  mergeReviewResult: null,
  textSearchResult: null,
  wordFrequencyResult: null,
  wordCloudResult: null,
  compoundQueryResult: null,
  mapVisualizationResult: null,
  codeHierarchyResult: null,
  conceptMapResult: null,
  codeClusterResult: null,
  referenceImportResult: null,
  activeSourceId: null,
  workspaceSelectedCodeId: null,
  workspaceSelectedCaseId: null,
  workspaceSelectedItemKey: null,
  workspaceFocusedSegmentId: null,
  selectedDescriptivesBase: null,
  selectedDescriptives: null,
  selectedCrosstab: null,
  selectedCrosstabError: '',
  selectedCrosstabRowField: null,
  selectedCrosstabColumnField: null,
  selectedFrequencyField: null,
  selectedDatasetFilters: [],
  selectedDatasetRecodes: [],
  selectedAnalysisWeightField: '',
  selectedMissingStrategy: 'available',
  selectedMissingCodes: '',
  compareMeansResult: null,
  tTestResult: null,
  pairedTTestResult: null,
  nonparametricResult: null,
  customTableResult: null,
  exactTestResult: null,
  bootstrapResult: null,
  missingValuesResult: null,
  imputationPlanResult: null,
  correlationResult: null,
  regressionResult: null,
  reliabilityResult: null,
  factorAnalysisResult: null,
  forecastingResult: null,
  clusterAnalysisResult: null,
  decisionTreeResult: null,
  generalLinearModelResult: null,
  repeatedMeasuresResult: null,
  survivalAnalysisResult: null,
  complexSamplesResult: null,
  neuralNetworkResult: null,
  syntaxRunResult: null,
  quantOutputView: 'descriptives',
  quantOutputHistory: [],
  compiledReportIncludedViews: [],
  compiledReportPresets: [],
  mediaTimeline: null,
  lastQuantAnalysis: null,
  lastActivityTs: null,
  pollTimer: null,
  idleTimer: null,
  lastUserActivityAt: Date.now(),
  lastActivityPingAt: 0,
  professorPresenceUserIds: []
};

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function getJson(url, options = {}) {
  const response = await fetch(url, { credentials: 'include', ...options });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  if (!response.ok || payload.ok === false) {
    const message = payload?.error?.message ?? text ?? `Request failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.error?.code ?? null;
    if (
      response.status === 401 &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/register') &&
      !url.includes('/auth/me')
    ) {
      void performLogout(message);
    }
    throw error;
  }
  return payload;
}

async function postJson(url, body) {
  return getJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function putJson(url, body) {
  return getJson(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function deleteJson(url) {
  return getJson(url, {
    method: 'DELETE'
  });
}

async function patchJson(url, body) {
  return getJson(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function postForm(url, formData) {
  return getJson(url, {
    method: 'POST',
    body: formData
  });
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function setHtml(id, html) {
  const node = document.getElementById(id);
  if (node) node.innerHTML = html;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function summarizeText(value, maxLength = 180) {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return 'No source text stored yet.';
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function setProjectInputs(project) {
  const val = project ? project.name : 'No project selected';
  ['source', 'code', 'variable', 'case', 'memo', 'attribute', 'collaboration'].forEach((key) => {
    const el = document.getElementById(`selected-project-${key}`);
    if (el) el.value = val;
  });
  const share = document.getElementById('share-project-name');
  if (share) share.value = val;
  const modeEl = document.getElementById('collaboration-workspace-mode');
  if (modeEl && project?.workspaceMode) modeEl.value = project.workspaceMode;

  if (project) {
    const memoType = document.getElementById('memo-target-type');
    const memoTarget = document.getElementById('memo-target-id');
    if (memoTarget && (!memoTarget.value.trim() || memoType?.value === 'project')) memoTarget.value = project.id;
  }
}

function setMemoTarget(targetType, targetId) {
  const typeEl = document.getElementById('memo-target-type');
  const idEl = document.getElementById('memo-target-id');
  if (typeEl) typeEl.value = targetType;
  if (idEl) idEl.value = targetId;
}

function setAttributeTarget(targetType, targetId) {
  const typeEl = document.getElementById('attribute-target-type');
  const idEl = document.getElementById('attribute-target-id');
  if (typeEl) typeEl.value = targetType;
  if (idEl) idEl.value = targetId;
}

function setAnnotationTarget(targetType, targetId) {
  const typeEl = document.getElementById('annotation-target-type');
  const idEl = document.getElementById('annotation-target-id');
  if (typeEl) typeEl.value = targetType;
  if (idEl) idEl.value = targetId;
}

function formatAttributeValue(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function parseReliabilitySubscales(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, fieldsPart = ''] = line.split(':');
      return {
        label: (labelPart ?? '').trim(),
        fields: fieldsPart.split(',').map((field) => field.trim()).filter(Boolean)
      };
    })
    .filter((item) => item.label && item.fields.length >= 2);
}

function formatDecimal(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function formatStatValue(value, digits = 4) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  if (typeof value === 'number') return formatDecimal(value, digits);
  return String(value);
}

function formatConfidenceInterval(interval, digits = 4) {
  if (!interval || interval.lower === null || interval.lower === undefined || interval.upper === null || interval.upper === undefined) {
    return 'n/a';
  }
  return `${formatDecimal(interval.lower, digits)} to ${formatDecimal(interval.upper, digits)}`;
}

function getSelectedValues(selectEl) {
  if (!selectEl) return [];
  return [...selectEl.selectedOptions].map((option) => option.value).filter(Boolean);
}

function buildOutputMetrics(items = []) {
  if (!items.length) return '';
  return `
    <div class="output-metric-grid">
      ${items.map((item) => `
        <div class="output-metric${item.tone ? ` ${escapeHtml(item.tone)}` : ''}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(String(item.value))}</strong>
        </div>
      `).join('')}
    </div>
  `;
}

function buildOutputList(items = []) {
  if (!items.length) return '';
  return `<ul class="output-list">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

function buildOutputSection(title, body) {
  return `
    <section class="output-section">
      <div class="output-section-head">
        <span class="output-section-kicker">Section</span>
        <h4>${escapeHtml(title)}</h4>
      </div>
      ${body}
    </section>
  `;
}

function buildOutputTable(headers = [], rows = []) {
  if (!headers.length) return '';
  return `
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            ${headers.map((header) => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              ${row.map((cell) => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function buildAssumptionsSection(assumptions = []) {
  if (!assumptions.length) return '';
  return buildOutputSection(
    'Assumption checks',
    buildOutputList(
      assumptions.map((item) => `${escapeHtml(item.label)}: <strong>${escapeHtml(item.status)}</strong>${item.value !== null && item.value !== undefined ? ` (${escapeHtml(String(item.value))})` : ''}`)
    )
  );
}

function buildOutputViewer({ eyebrow = '', title = '', summary = '', metrics = [], sections = [] }) {
  const projectName = state.selectedSummary?.project?.name ?? 'Project';
  const generatedAt = new Date().toLocaleString();
  const indexedSections = sections.map((section, index) => ({
    id: `output-section-${index + 1}`,
    html: String(section ?? '')
  }));
  return `
    <div class="output-viewer output-document">
      <div class="output-document-bar">
        <span>muStatistics output</span>
        <span>${escapeHtml(projectName)}</span>
      </div>
      <div class="output-header">
        <div class="output-header-main">
          ${eyebrow ? `<span class="output-kicker">${escapeHtml(eyebrow)}</span>` : ''}
          ${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
          ${summary ? `<p class="output-summary">${escapeHtml(summary)}</p>` : ''}
          <div class="output-header-strip">
            <span class="source-meta">Project: ${escapeHtml(projectName)}</span>
            <span class="source-meta">Sections: ${sections.length}</span>
            <span class="source-meta">Review copy</span>
          </div>
        </div>
        <div class="output-document-meta">
          <span class="workspace-label">Generated</span>
          <strong>${escapeHtml(generatedAt)}</strong>
        </div>
      </div>
      ${buildOutputMetrics(metrics)}
      ${indexedSections.length > 1 ? `
        <div class="output-toc">
          <span class="workspace-label">Jump to section</span>
          <div class="output-toc-links">
            ${indexedSections.map((section, index) => `<a href="#${section.id}">0${index + 1}</a>`).join('')}
          </div>
        </div>
      ` : ''}
      <div class="output-sections">
        ${indexedSections.map((section) => section.html.replace('<section class="output-section">', `<section id="${section.id}" class="output-section">`)).join('')}
      </div>
      <div class="output-footer">Prepared in muStatistics for review, export, and print.</div>
    </div>
  `;
}

function buildSvgBarChart(items, { width = 760, height = 240, color = '#d2b27a', formatter = (value) => String(value) } = {}) {
  const values = items.map((item) => Number(item.value) || 0);
  const maxValue = Math.max(1, ...values);
  const leftPad = 44;
  const rightPad = 16;
  const topPad = 16;
  const bottomPad = 56;
  const innerWidth = width - leftPad - rightPad;
  const innerHeight = height - topPad - bottomPad;
  const barWidth = innerWidth / Math.max(1, items.length);
  const bars = items.map((item, index) => {
    const value = Number(item.value) || 0;
    const scaledHeight = (value / maxValue) * innerHeight;
    const x = leftPad + (index * barWidth) + 8;
    const y = topPad + (innerHeight - scaledHeight);
    const labelX = leftPad + (index * barWidth) + (barWidth / 2);
    return `
      <rect x="${x}" y="${y}" width="${Math.max(12, barWidth - 16)}" height="${scaledHeight}" rx="6" fill="${color}" opacity="0.82"></rect>
      <text x="${labelX}" y="${height - 34}" text-anchor="middle" font-size="11" fill="#aab6d3">${escapeHtml(String(item.label).slice(0, 14))}</text>
      <text x="${labelX}" y="${Math.max(14, y - 6)}" text-anchor="middle" font-size="11" fill="#edf2ff">${escapeHtml(formatter(value))}</text>
    `;
  }).join('');
  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Bar chart">
      <line x1="${leftPad}" y1="${topPad + innerHeight}" x2="${width - rightPad}" y2="${topPad + innerHeight}" stroke="rgba(170,182,211,0.35)"></line>
      <line x1="${leftPad}" y1="${topPad}" x2="${leftPad}" y2="${topPad + innerHeight}" stroke="rgba(170,182,211,0.35)"></line>
      ${bars}
    </svg>
  `;
}

function buildSvgLineChart(items, { width = 760, height = 240, color = '#8fb3ff' } = {}) {
  if (!items.length) return '<p>No chart data.</p>';
  const values = items.map((item) => Number(item.value) || 0);
  const maxValue = Math.max(1, ...values);
  const minValue = Math.min(...values);
  const leftPad = 44;
  const rightPad = 16;
  const topPad = 16;
  const bottomPad = 48;
  const innerWidth = width - leftPad - rightPad;
  const innerHeight = height - topPad - bottomPad;
  const xStep = items.length === 1 ? 0 : innerWidth / (items.length - 1);
  const scaleY = (value) => {
    if (maxValue === minValue) return topPad + (innerHeight / 2);
    return topPad + ((maxValue - value) / (maxValue - minValue)) * innerHeight;
  };
  const points = items.map((item, index) => `${leftPad + (index * xStep)},${scaleY(Number(item.value) || 0)}`).join(' ');
  const dots = items.map((item, index) => {
    const x = leftPad + (index * xStep);
    const y = scaleY(Number(item.value) || 0);
    return `
      <circle cx="${x}" cy="${y}" r="4.5" fill="${color}"></circle>
      <text x="${x}" y="${height - 22}" text-anchor="middle" font-size="11" fill="#aab6d3">${escapeHtml(String(item.label))}</text>
    `;
  }).join('');
  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Line chart">
      <line x1="${leftPad}" y1="${topPad + innerHeight}" x2="${width - rightPad}" y2="${topPad + innerHeight}" stroke="rgba(170,182,211,0.35)"></line>
      <line x1="${leftPad}" y1="${topPad}" x2="${leftPad}" y2="${topPad + innerHeight}" stroke="rgba(170,182,211,0.35)"></line>
      <polyline fill="none" stroke="${color}" stroke-width="3" points="${points}"></polyline>
      ${dots}
    </svg>
  `;
}

function buildSvgScatterPlot(points, { width = 760, height = 260, color = '#8fb3ff', xLabel = 'X', yLabel = 'Y' } = {}) {
  if (!points.length) return '<p>No plot data.</p>';
  const xValues = points.map((point) => Number(point.x)).filter(Number.isFinite);
  const yValues = points.map((point) => Number(point.y)).filter(Number.isFinite);
  if (!xValues.length || !yValues.length) return '<p>No plot data.</p>';
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const leftPad = 56;
  const rightPad = 16;
  const topPad = 16;
  const bottomPad = 52;
  const innerWidth = width - leftPad - rightPad;
  const innerHeight = height - topPad - bottomPad;
  const scaleX = (value) => leftPad + ((value - minX) / Math.max(1e-9, maxX - minX || 1)) * innerWidth;
  const scaleY = (value) => topPad + ((maxY - value) / Math.max(1e-9, maxY - minY || 1)) * innerHeight;
  const circles = points.map((point) => {
    const x = scaleX(Number(point.x));
    const y = scaleY(Number(point.y));
    return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" opacity="0.74"></circle>`;
  }).join('');
  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Scatter plot">
      <line x1="${leftPad}" y1="${topPad + innerHeight}" x2="${width - rightPad}" y2="${topPad + innerHeight}" stroke="rgba(170,182,211,0.35)"></line>
      <line x1="${leftPad}" y1="${topPad}" x2="${leftPad}" y2="${topPad + innerHeight}" stroke="rgba(170,182,211,0.35)"></line>
      ${circles}
      <text x="${leftPad + (innerWidth / 2)}" y="${height - 16}" text-anchor="middle" font-size="11" fill="#aab6d3">${escapeHtml(xLabel)}</text>
      <text x="16" y="${topPad + (innerHeight / 2)}" text-anchor="middle" font-size="11" fill="#aab6d3" transform="rotate(-90 16 ${topPad + (innerHeight / 2)})">${escapeHtml(yLabel)}</text>
    </svg>
  `;
}

function inverseNormalCdf(probability) {
  const p = Number(probability);
  if (!(p > 0 && p < 1)) {
    if (p === 0) return Number.NEGATIVE_INFINITY;
    if (p === 1) return Number.POSITIVE_INFINITY;
    return NaN;
  }
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  const high = 1 - low;
  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > high) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
    / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function buildQqPlotPoints(values) {
  const numericValues = values.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)).sort((left, right) => left - right);
  if (numericValues.length < 3) return [];
  return numericValues.map((value, index) => {
    const probability = (index + 0.5) / numericValues.length;
    return { x: inverseNormalCdf(probability), y: value };
  }).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function buildChartCard(title, body, caption = '') {
  return `
    <div class="chart-card">
      <h5>${escapeHtml(title)}</h5>
      ${body}
      ${caption ? `<div class="chart-caption">${escapeHtml(caption)}</div>` : ''}
    </div>
  `;
}

function buildChartBuilderList(items) {
  return `
    <ul class="chart-builder-list">
      ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
    </ul>
  `;
}

function buildChartSuggestionsSection(items) {
  return buildOutputSection('Chart builder direction', buildChartBuilderList(items));
}

function getAvailableQuantOutputPages() {
  return [
    { view: 'descriptives', title: 'Descriptives', ready: Boolean(state.selectedDescriptives) },
    { view: 'frequency', title: 'Frequency', ready: Boolean(state.selectedFrequencyField) },
    { view: 'compare-means', title: 'Compare means', ready: Boolean(state.compareMeansResult) },
    { view: 'ttest', title: 'T-test', ready: Boolean(state.tTestResult) },
    { view: 'paired-ttest', title: 'Paired t-test', ready: Boolean(state.pairedTTestResult) },
    { view: 'nonparametric', title: 'Nonparametric', ready: Boolean(state.nonparametricResult) },
    { view: 'crosstab', title: 'Crosstab', ready: Boolean(state.selectedCrosstab) },
    { view: 'custom-table', title: 'Custom table', ready: Boolean(state.customTableResult) },
    { view: 'exact-test', title: 'Exact test', ready: Boolean(state.exactTestResult) },
    { view: 'bootstrap', title: 'Bootstrap', ready: Boolean(state.bootstrapResult) },
    { view: 'missing-values', title: 'Missing values', ready: Boolean(state.missingValuesResult || state.imputationPlanResult) },
    { view: 'correlation', title: 'Correlation', ready: Boolean(state.correlationResult) },
    { view: 'regression', title: 'Regression', ready: Boolean(state.regressionResult) },
    { view: 'reliability', title: 'Reliability', ready: Boolean(state.reliabilityResult) },
    { view: 'factor-analysis', title: 'Factor analysis', ready: Boolean(state.factorAnalysisResult) },
    { view: 'forecasting', title: 'Forecasting', ready: Boolean(state.forecastingResult) },
    { view: 'cluster-analysis', title: 'Cluster analysis', ready: Boolean(state.clusterAnalysisResult) },
    { view: 'decision-tree', title: 'Decision tree', ready: Boolean(state.decisionTreeResult) },
    { view: 'general-linear-model', title: 'GLM/ANCOVA', ready: Boolean(state.generalLinearModelResult) },
    { view: 'repeated-measures', title: 'Repeated measures', ready: Boolean(state.repeatedMeasuresResult) },
    { view: 'survival-analysis', title: 'Survival analysis', ready: Boolean(state.survivalAnalysisResult) },
    { view: 'complex-samples', title: 'Complex samples', ready: Boolean(state.complexSamplesResult) },
    { view: 'neural-network', title: 'Neural network', ready: Boolean(state.neuralNetworkResult) },
    { view: 'syntax-run', title: 'Syntax run', ready: Boolean(state.syntaxRunResult) },
    { view: 'saved-analyses', title: 'Saved analyses', ready: state.savedAnalysisJobs.length > 0 }
  ];
}

function renderQuantOutputTree() {
  const node = document.getElementById('quant-output-tree-list');
  if (!node) return;
  const openPages = getAvailableQuantOutputPages().filter((item) => item.ready);
  const groups = [];
  if (openPages.length > 0) {
    groups.push({
      label: 'Open pages',
      items: openPages.map((item) => ({
        title: item.title,
        detail: 'Current output page',
        active: item.view === state.quantOutputView,
        onClick: () => {
          state.quantOutputView = item.view;
          syncWorkspaceMenus();
        }
      }))
    });
  }
  if (state.quantOutputHistory.length > 0) {
    groups.push({
      label: 'Recent output',
      items: state.quantOutputHistory.slice(0, 6).map((entry) => ({
        title: entry.title,
        detail: `${entry.detail || 'Recent result'} · ${entry.stamp}`,
        active: entry.view === state.quantOutputView,
        onClick: () => {
          state.quantOutputView = entry.view;
          syncWorkspaceMenus();
        }
      }))
    });
  }
  if (state.savedAnalysisJobs.length > 0) {
    groups.push({
      label: 'Saved procedures',
      items: state.savedAnalysisJobs.slice(0, 8).map((job) => ({
        title: job.label,
        detail: formatAnalysisKindLabel(job.analysisKind),
        active: false,
        onClick: async () => {
          try {
            await runSavedAnalysisJob(job);
          } catch (err) {
            window.alert(`Saved analysis failed: ${err.message}`);
          }
        }
      }))
    });
  }
  if (groups.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">Run a procedure and the output tree will populate here.</li>';
    return;
  }
  node.innerHTML = '';
  for (const group of groups) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item quant-output-tree-group';
    li.innerHTML = `
      <div class="quant-output-tree-title">${escapeHtml(group.label)}</div>
      ${group.items.map((item, index) => `
        <div class="interactive-list-item quant-output-tree-item${item.active ? ' active' : ''}" data-tree-index="${index}">
          <button type="button" class="quant-output-tree-button">
            <span class="project-title">${escapeHtml(item.title)}</span>
            <span class="source-meta">${escapeHtml(item.detail)}</span>
          </button>
        </div>
      `).join('')}
    `;
    li.querySelectorAll('.quant-output-tree-item').forEach((itemNode) => {
      itemNode.addEventListener('click', () => {
        const idx = Number(itemNode.getAttribute('data-tree-index'));
        void group.items[idx]?.onClick();
      });
    });
    node.appendChild(li);
  }
}

function normalizeAnalysisFieldKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function defaultSqlPortForClientType(clientType) {
  return clientType === 'sqlserver' ? '1433' : '5432';
}

function coerceAnalysisValue(rawValue) {
  const text = String(rawValue ?? '').trim();
  if (!text) return null;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  const lowered = text.toLowerCase();
  if (['true', 'yes', 'y'].includes(lowered)) return true;
  if (['false', 'no', 'n'].includes(lowered)) return false;
  return text;
}

function roleLabel(role) {
  return role === 'professor' ? 'Professor' : 'Student';
}

function getCurrentProjectMembership() {
  if (!state.currentUser) return null;
  return state.selectedMembers.find((member) =>
    member.userId === state.currentUser.id || member.username === state.currentUser.username
  ) ?? null;
}

function getProjectPermissionState() {
  const membership = getCurrentProjectMembership();
  const hasProject = Boolean(state.selectedProjectId);
  const isProfessor = state.currentUser?.role === 'professor';
  const isOwner = membership?.role === 'owner';
  return {
    hasProject,
    isProfessor,
    isOwner,
    canManageProject: Boolean(hasProject && isOwner),
    canExportProject: Boolean(hasProject && membership && (isOwner || isProfessor))
  };
}

function setButtonAccessState(id, enabled, title) {
  const button = document.getElementById(id);
  if (!button) return;
  button.disabled = !enabled;
  button.title = title;
}

function requireProjectManagementPermission() {
  if (!state.selectedProjectId) {
    throw new Error('Select a project first.');
  }
  if (!getProjectPermissionState().canManageProject) {
    throw new Error('Only project owners can manage members, workspace settings, backups, restore, or deletion.');
  }
}

function requireProjectExportPermission() {
  if (!state.selectedProjectId) {
    throw new Error('Select a project first.');
  }
  if (!getProjectPermissionState().canExportProject) {
    throw new Error('Only project owners and Professor accounts can export project outputs or audit records.');
  }
}

async function readResponseError(response) {
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  const message = payload?.error?.message ?? text ?? `Request failed: ${response.status}`;
  const error = new Error(message);
  error.status = response.status;
  error.code = payload?.error?.code ?? null;
  if (response.status === 401) {
    void performLogout(message);
  }
  return error;
}

function getCodeTone(token) {
  const palette = {
    blue: { fill: '#4f86ff', soft: 'rgba(79, 134, 255, 0.16)', line: 'rgba(79, 134, 255, 0.4)' },
    green: { fill: '#3fb67a', soft: 'rgba(63, 182, 122, 0.16)', line: 'rgba(63, 182, 122, 0.4)' },
    red: { fill: '#e05a5a', soft: 'rgba(224, 90, 90, 0.16)', line: 'rgba(224, 90, 90, 0.4)' },
    orange: { fill: '#d88a36', soft: 'rgba(216, 138, 54, 0.16)', line: 'rgba(216, 138, 54, 0.4)' },
    amber: { fill: '#d2b27a', soft: 'rgba(210, 178, 122, 0.18)', line: 'rgba(210, 178, 122, 0.42)' },
    teal: { fill: '#56b5b3', soft: 'rgba(86, 181, 179, 0.16)', line: 'rgba(86, 181, 179, 0.4)' },
    purple: { fill: '#8d72d6', soft: 'rgba(141, 114, 214, 0.16)', line: 'rgba(141, 114, 214, 0.4)' },
    pink: { fill: '#d86ca5', soft: 'rgba(216, 108, 165, 0.16)', line: 'rgba(216, 108, 165, 0.4)' },
    gray: { fill: '#8c96a8', soft: 'rgba(140, 150, 168, 0.16)', line: 'rgba(140, 150, 168, 0.34)' }
  };
  return palette[String(token ?? '').trim().toLowerCase()] ?? palette.blue;
}

function getCodeToneStyle(token) {
  const tone = getCodeTone(token);
  return `--code-fill:${tone.fill};--code-soft:${tone.soft};--code-line:${tone.line};`;
}

function sessionExpiryMessage() {
  return `Session expired after ${state.governanceStatus?.sessionIdleTimeoutMinutes ?? 90} minutes of inactivity.`;
}

function isCollaborativeProject() {
  return state.selectedSummary?.project?.workspaceMode === 'collaborative';
}

function updateGlobalChatButton() {
  const canOpenChat = Boolean(state.selectedProjectId);
  const button = document.getElementById('global-chat-btn');
  if (button) {
    button.style.display = state.activeTab === 'status' ? 'none' : '';
    button.title = canOpenChat ? 'Open popup chat for the selected project.' : 'Select a project first.';
  }
  const collaborationChat = document.getElementById('collaboration-chat-btn');
  if (collaborationChat) collaborationChat.title = canOpenChat ? 'Open popup chat for the selected project.' : 'Select a project first.';
  const projectChat = document.getElementById('project-chat-popup-btn');
  if (projectChat) projectChat.title = canOpenChat ? 'Open popup chat for the selected project.' : 'Select a project first.';
}

function workspaceItemKey(item) {
  if (item.existingSegment?.id) return item.existingSegment.id;
  const anchor = item.kind === 'page_region'
    ? `page-${item.anchor.page}`
    : item.kind === 'time_range'
      ? `time-${item.anchor.startMs ?? 0}-${item.anchor.endMs ?? 0}`
      : `text-${item.anchor.start ?? 0}-${item.anchor.end ?? 0}`;
  return `${item.kind}:${anchor}:${String(item.text ?? '').slice(0, 40)}`;
}

function formatInteractionLabel(value) {
  return String(value ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function renderInteractionStatus() {
  const project = state.selectedSummary?.project
    ?? state.projects.find((item) => item.id === state.selectedProjectId)
    ?? null;
  const popupEligible = Boolean(state.selectedProjectId && project);
  const sqlStatus = state.integrationStatus?.sql ?? null;
  const officeStatus = state.integrationStatus?.office ?? null;
  let activeMenu = formatInteractionLabel(state.activeTab);
  let activeSubtab = 'None';

  if (state.activeTab === 'qualitative') {
    activeMenu = `Qualitative / ${formatInteractionLabel(state.qualitativeView)}`;
    activeSubtab = formatInteractionLabel(state.qualitativeSubViews[state.qualitativeView] ?? 'none');
  } else if (state.activeTab === 'quantitative') {
    activeMenu = `Quantitative / ${formatInteractionLabel(state.quantitativeView)}`;
    activeSubtab = formatInteractionLabel(state.quantitativeSubViews[state.quantitativeView] ?? 'none');
  }

  setText('interaction-selected-project', project?.name ?? 'None');
  setText('interaction-popup-eligibility', popupEligible ? 'Ready' : 'Select a project');
  setText('interaction-active-menu', activeMenu);
  setText('interaction-active-subtab', activeSubtab);
  setText(
    'interaction-sql-mode',
    sqlStatus
      ? (sqlStatus.activeMode === 'embedded-portable' ? 'Embedded portable' : 'Postgres runtime')
      : 'Unavailable'
  );
  setText(
    'interaction-office-launch',
    officeStatus
      ? [officeStatus.wordLaunchAvailable ? 'Word' : null, officeStatus.excelLaunchAvailable ? 'Excel' : null]
        .filter(Boolean)
        .join(' / ') || 'Not found'
      : 'Unavailable'
  );
}

function mapAnalysisKindToOutputView(kind) {
  switch (kind) {
    case 'compare_means': return 'compare-means';
    case 't_test': return 'ttest';
    case 'paired_t_test': return 'paired-ttest';
    case 'nonparametric': return 'nonparametric';
    case 'crosstab': return 'crosstab';
    case 'custom_table': return 'custom-table';
    case 'exact_test': return 'exact-test';
    case 'bootstrap': return 'bootstrap';
    case 'missing_values': return 'missing-values';
    case 'imputation_plan': return 'missing-values';
    case 'correlation': return 'correlation';
    case 'regression': return 'regression';
    case 'reliability': return 'reliability';
    case 'factor_analysis': return 'factor-analysis';
    case 'forecasting': return 'forecasting';
    case 'cluster_analysis': return 'cluster-analysis';
    case 'decision_tree': return 'decision-tree';
    case 'general_linear_model': return 'general-linear-model';
    case 'repeated_measures': return 'repeated-measures';
    case 'survival_analysis': return 'survival-analysis';
    case 'complex_samples': return 'complex-samples';
    case 'neural_network': return 'neural-network';
    case 'syntax_run': return 'syntax-run';
    default: return state.quantOutputView;
  }
}

function describeQuantAnalysis(analysisKind, analysis = {}) {
  switch (analysisKind) {
    case 'compare_means':
      return {
        title: 'Compare means',
        detail: `${analysis.outcomeField ?? 'outcome'} by ${analysis.groupField ?? 'group'}`
      };
    case 't_test':
      return {
        title: 'T-test',
        detail: `${analysis.outcomeField ?? 'outcome'} by ${analysis.groupField ?? 'group'}`
      };
    case 'paired_t_test':
      return {
        title: 'Paired t-test',
        detail: `${analysis.beforeField ?? 'before'} vs ${analysis.afterField ?? 'after'}`
      };
    case 'nonparametric':
      return {
        title: 'Nonparametric',
        detail: `${analysis.outcomeField ?? 'outcome'} by ${analysis.groupField ?? 'group'}`
      };
    case 'crosstab':
      return {
        title: 'Crosstab',
        detail: `${analysis.rowField ?? 'row'} by ${analysis.columnField ?? 'column'}`
      };
    case 'custom_table':
      return {
        title: 'Custom table',
        detail: `${(analysis.rowFields ?? []).join(', ') || 'row fields'}${analysis.columnField ? ` by ${analysis.columnField}` : ''}`
      };
    case 'exact_test':
      return {
        title: 'Exact test',
        detail: `${analysis.rowField ?? 'row'} by ${analysis.columnField ?? 'column'}`
      };
    case 'bootstrap':
      return {
        title: 'Bootstrap',
        detail: `${analysis.procedure ?? 'procedure'} on ${(analysis.targetFields ?? []).join(', ') || 'target fields'}`
      };
    case 'missing_values':
      return {
        title: 'Missing values',
        detail: 'Missingness and imputation recommendations'
      };
    case 'imputation_plan':
      return {
        title: 'Imputation plan',
        detail: `${(analysis.strategies ?? []).length || 0} imputation strategy item(s)`
      };
    case 'correlation':
      return {
        title: 'Correlation',
        detail: `${analysis.xField ?? 'x'} vs ${analysis.yField ?? 'y'}`
      };
    case 'regression':
      return {
        title: 'Regression',
        detail: `${analysis.dependentField ?? 'dependent'} from ${(analysis.predictorFields ?? []).join(', ') || 'predictors'}`
      };
    case 'reliability':
      return {
        title: 'Reliability',
        detail: `${(analysis.fields ?? []).join(', ') || 'selected scale fields'}`
      };
    case 'factor_analysis':
      return {
        title: 'Factor analysis',
        detail: `${(analysis.fields ?? []).join(', ') || 'selected factor fields'}`
      };
    case 'forecasting':
      return {
        title: 'Forecasting',
        detail: `${analysis.valueField ?? 'value'} over ${analysis.timeField ?? 'time'} (${analysis.method ?? 'linear_trend'})`
      };
    case 'cluster_analysis':
      return {
        title: 'Cluster analysis',
        detail: `${(analysis.fields ?? []).join(', ') || 'selected cluster fields'}`
      };
    case 'decision_tree':
      return {
        title: 'Decision tree',
        detail: `${analysis.targetField ?? 'target'} from ${(analysis.predictorFields ?? []).join(', ') || 'predictors'}`
      };
    case 'general_linear_model':
      return {
        title: 'GLM/ANCOVA',
        detail: `${analysis.dependentField ?? 'dependent'} by ${(analysis.factorFields ?? []).join(', ') || 'factors'} ${(analysis.covariateFields ?? []).join(', ') || ''}`.trim()
      };
    case 'repeated_measures':
      return {
        title: 'Repeated measures',
        detail: `${(analysis.fields ?? []).join(', ') || 'selected measures'}`
      };
    case 'survival_analysis':
      return {
        title: 'Survival analysis',
        detail: `${analysis.timeField ?? 'time'} / ${analysis.eventField ?? 'event'}`
      };
    case 'complex_samples':
      return {
        title: 'Complex samples',
        detail: `${analysis.targetField ?? 'target'}${analysis.groupField ? ` by ${analysis.groupField}` : ''}`
      };
    case 'neural_network':
      return {
        title: 'Neural network',
        detail: `${analysis.targetField ?? 'target'} from ${(analysis.predictorFields ?? []).join(', ') || 'predictors'}`
      };
    case 'syntax_run':
      return {
        title: 'Syntax run',
        detail: `${String(analysis.syntax ?? '').split(/\s+/).slice(0, 6).join(' ') || 'SPSS-like syntax'}`
      };
    default:
      return {
        title: formatAnalysisKindLabel(analysisKind),
        detail: 'Saved analysis output'
      };
  }
}

function rememberQuantOutput(view, title, detail = '') {
  const stamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const next = [{
    id: `${view}-${Date.now()}`,
    view,
    title,
    detail,
    stamp
  }, ...state.quantOutputHistory.filter((entry) => !(entry.view === view && entry.title === title && entry.detail === detail))];
  state.quantOutputHistory = next.slice(0, 10);
}

async function copyTextToClipboard(text, successMessage) {
  await navigator.clipboard.writeText(text);
  return successMessage;
}

function quantOutputTitle(view) {
  const labels = {
    descriptives: 'Descriptive output',
    frequency: 'Frequency output',
    'compare-means': 'Compare means',
    ttest: 'T-test',
    'paired-ttest': 'Paired t-test',
    nonparametric: 'Nonparametric',
    crosstab: 'Crosstab',
    'custom-table': 'Custom table',
    'exact-test': 'Exact test',
    bootstrap: 'Bootstrap',
    'missing-values': 'Missing values',
    correlation: 'Correlation',
    regression: 'Regression',
    reliability: 'Reliability',
    'factor-analysis': 'Factor analysis',
    forecasting: 'Forecasting',
    'cluster-analysis': 'Cluster analysis',
    'decision-tree': 'Decision tree',
    'general-linear-model': 'GLM/ANCOVA',
    'repeated-measures': 'Repeated measures',
    'survival-analysis': 'Survival analysis',
    'complex-samples': 'Complex samples',
    'neural-network': 'Neural network',
    'syntax-run': 'Syntax run',
    'saved-analyses': 'Saved analyses'
  };
  return labels[view] ?? view;
}

function getAllCompiledReportViews() {
  return [
    'descriptives',
    'frequency',
    'compare-means',
    'ttest',
    'paired-ttest',
    'nonparametric',
    'crosstab',
    'custom-table',
    'exact-test',
    'bootstrap',
    'missing-values',
    'correlation',
    'regression',
    'reliability',
    'factor-analysis',
    'forecasting',
    'cluster-analysis',
    'decision-tree',
    'general-linear-model',
    'repeated-measures',
    'survival-analysis',
    'complex-samples',
    'neural-network',
    'syntax-run',
    'saved-analyses'
  ];
}

function getDefaultCommitteePackViews() {
  return [
    'saved-analyses',
    'descriptives',
    'missing-values',
    'crosstab',
    'custom-table',
    'compare-means',
    'ttest',
    'paired-ttest',
    'nonparametric',
    'exact-test',
    'bootstrap',
    'correlation',
    'regression',
    'forecasting',
    'cluster-analysis',
    'decision-tree',
    'general-linear-model',
    'repeated-measures',
    'survival-analysis',
    'complex-samples',
    'neural-network',
    'syntax-run',
    'frequency'
  ].filter((view) => getAllCompiledReportViews().includes(view));
}

function ensureCompiledReportViews() {
  const allowed = new Set(getAllCompiledReportViews());
  const current = Array.isArray(state.compiledReportIncludedViews) ? state.compiledReportIncludedViews.filter((view) => allowed.has(view)) : [];
  state.compiledReportIncludedViews = current.length > 0 ? current : getAllCompiledReportViews();
}

function loadCompiledReportPresets() {
  try {
    const raw = window.localStorage.getItem(COMPILED_REPORT_PRESETS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const items = Array.isArray(parsed?.[state.selectedProjectId]) ? parsed[state.selectedProjectId] : [];
    state.compiledReportPresets = items.map((item) => ({
      ...item,
      favorite: Boolean(item?.favorite),
      views: Array.isArray(item?.views) ? item.views : getAllCompiledReportViews()
    }));
  } catch {
    state.compiledReportPresets = [];
  }
}

function persistCompiledReportPresets() {
  try {
    const raw = window.localStorage.getItem(COMPILED_REPORT_PRESETS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[state.selectedProjectId] = state.compiledReportPresets;
    window.localStorage.setItem(COMPILED_REPORT_PRESETS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore localStorage failures in the browser shell.
  }
}

function getCompiledReportSections() {
  ensureCompiledReportViews();
  const sections = [];
  const seen = new Set();
  const orderedViews = state.compiledReportIncludedViews.filter((view) => {
    if (seen.has(view)) return false;
    seen.add(view);
    return state.compiledReportIncludedViews.includes(view);
  });

  for (const view of orderedViews) {
    const panel = document.querySelector(`[data-quant-output="${view}"]`);
    if (!panel) continue;
    const html = panel.innerHTML.trim();
    if (!html) continue;
    sections.push({
      view,
      title: quantOutputTitle(view),
      html
    });
  }

  return sections;
}

function buildCompiledReportHtml() {
  const projectName = state.selectedSummary?.project?.name ?? 'muStatistics project';
  const generatedAt = new Date().toLocaleString();
  const sections = getCompiledReportSections();
  const historyItems = state.quantOutputHistory.map((entry) => `
    <li><span>${escapeHtml(entry.title)}</span><span>${escapeHtml(entry.stamp)}</span></li>
  `).join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(projectName)} report stack</title>
    <style>
      :root {
        color-scheme: light;
        --paper:#fcfaf5;
        --ink:#1e1e1e;
        --muted:#666;
        --line:#d8d0c0;
        --accent:#8b6d3b;
      }
      * { box-sizing:border-box; }
      body {
        margin:0;
        padding:32px;
        font-family: "Segoe UI", Arial, sans-serif;
        color:var(--ink);
        background:var(--paper);
      }
      .report-shell { display:grid; gap:28px; }
      .cover, .index, .section {
        background:#fff;
        border:1px solid var(--line);
        border-radius:18px;
        padding:28px;
        page-break-inside: avoid;
      }
      .cover h1, .section h2 {
        margin:6px 0 0;
        font-family: Georgia, "Times New Roman", serif;
      }
      .kicker {
        color:var(--accent);
        text-transform:uppercase;
        letter-spacing:.08em;
        font-size:12px;
      }
      .meta {
        display:flex;
        justify-content:space-between;
        gap:16px;
        flex-wrap:wrap;
        color:var(--muted);
        font-size:13px;
        margin-top:18px;
        padding-top:14px;
        border-top:1px solid var(--line);
      }
      .index ol, .history ol { margin:14px 0 0; padding-left:18px; }
      .index li, .history li {
        display:flex;
        justify-content:space-between;
        gap:12px;
        padding:8px 0;
        border-bottom:1px solid #eee;
      }
      .section-head {
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:20px;
        margin-bottom:18px;
        padding-bottom:14px;
        border-bottom:1px solid var(--line);
      }
      .section-body { display:grid; gap:16px; }
      .section-body .inline-actions, .section-body button { display:none !important; }
      .section-body .output-viewer, .section-body .saved-analysis-cover-sheet, .section-body .saved-analysis-index, .section-body .saved-analysis-entry {
        border:none !important;
        background:transparent !important;
        box-shadow:none !important;
        padding-left:0 !important;
        padding-right:0 !important;
      }
      .section-body .output-document-bar, .section-body .output-footer { display:none !important; }
      .section-body .matrix-table-wrap { border-color:var(--line) !important; background:transparent !important; }
      .section-body .matrix-table th { background:#f5f1e8 !important; color:var(--ink) !important; }
      @media print {
        body { padding:0; background:#fff; }
        .cover, .index, .section { border:none; border-radius:0; page-break-after:always; }
      }
    </style>
  </head>
  <body>
    <div class="report-shell">
      <section class="cover">
        <span class="kicker">Compiled report</span>
        <h1>${escapeHtml(projectName)}</h1>
        <p>Saved analysis stack, current output pages, and recent viewer history assembled into one report document.</p>
        <div class="meta">
          <span>Generated ${escapeHtml(generatedAt)}</span>
          <span>Sections ${sections.length}</span>
        </div>
      </section>
      <section class="index">
        <span class="kicker">Index</span>
        <h2>Report sections</h2>
        <ol>
          ${sections.map((section, index) => `<li><span>${index + 1}. ${escapeHtml(section.title)}</span><span>${escapeHtml(section.view)}</span></li>`).join('')}
        </ol>
      </section>
      <section class="index history">
        <span class="kicker">Appendix</span>
        <h2>Recent output history</h2>
        <ol>
          ${historyItems || '<li><span>No recent output</span><span></span></li>'}
        </ol>
      </section>
      ${sections.map((section, index) => `
        <section class="section">
          <div class="section-head">
            <div>
              <span class="kicker">Section ${index + 1}</span>
              <h2>${escapeHtml(section.title)}</h2>
            </div>
            <span class="kicker">${escapeHtml(section.view)}</span>
          </div>
          <div class="section-body">${section.html}</div>
        </section>
      `).join('')}
    </div>
  </body>
</html>`;
}

function openCompiledReportWindow() {
  requireProjectExportPermission();
  const reportWindow = window.open('', 'muStatisticsCompiledReport', 'width=1200,height=900');
  if (!reportWindow) throw new Error('Popup blocked while opening compiled report.');
  reportWindow.document.open();
  reportWindow.document.write(buildCompiledReportHtml());
  reportWindow.document.close();
  reportWindow.focus();
}

function exportCompiledReportHtml() {
  requireProjectExportPermission();
  const blob = new Blob([buildCompiledReportHtml()], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${state.selectedProjectId ?? 'muStatistics'}-compiled-report.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function renderCompiledReportControls() {
  const node = document.getElementById('compiled-report-controls');
  if (!node) return;
  ensureCompiledReportViews();
  const included = [...state.compiledReportIncludedViews];
  const excluded = getAllCompiledReportViews().filter((view) => !included.includes(view));
  const orderedViews = [...included, ...excluded];
  node.innerHTML = orderedViews.map((view) => {
    const includedIndex = included.indexOf(view);
    const isIncluded = includedIndex >= 0;
    return `
      <label class="report-include-option${isIncluded ? ' included' : ''}" ${isIncluded ? `draggable="true" data-report-draggable="${escapeHtml(view)}"` : ''}>
        <span class="report-include-main">
          <input type="checkbox" data-report-include="${escapeHtml(view)}" ${isIncluded ? 'checked' : ''} />
          <span>${escapeHtml(quantOutputTitle(view))}</span>
        </span>
        ${isIncluded ? `
          <span class="report-order-controls">
            <button type="button" class="small" data-report-move="${escapeHtml(view)}" data-report-direction="up" ${includedIndex === 0 ? 'disabled' : ''}>Up</button>
            <button type="button" class="small" data-report-move="${escapeHtml(view)}" data-report-direction="down" ${includedIndex === included.length - 1 ? 'disabled' : ''}>Down</button>
          </span>
        ` : '<span class="small-muted">Excluded</span>'}
      </label>
    `;
  }).join('');
  node.querySelectorAll('[data-report-include]').forEach((input) => {
    input.addEventListener('change', () => {
      const checked = [...node.querySelectorAll('[data-report-include]:checked')].map((entry) => entry.dataset.reportInclude);
      state.compiledReportIncludedViews = checked.length > 0 ? checked : getAllCompiledReportViews();
      renderCompiledReportControls();
    });
  });
  node.querySelectorAll('[data-report-move]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.reportMove;
      const direction = button.dataset.reportDirection;
      const index = state.compiledReportIncludedViews.indexOf(view);
      if (index < 0) return;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= state.compiledReportIncludedViews.length) return;
      const reordered = [...state.compiledReportIncludedViews];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      state.compiledReportIncludedViews = reordered;
      renderCompiledReportControls();
    });
  });
  node.querySelectorAll('[data-report-draggable]').forEach((row) => {
    row.addEventListener('dragstart', (event) => {
      event.dataTransfer?.setData('text/plain', row.dataset.reportDraggable ?? '');
      event.dataTransfer.effectAllowed = 'move';
      row.classList.add('dragging');
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
    });
    row.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    });
    row.addEventListener('drop', (event) => {
      event.preventDefault();
      const draggedView = event.dataTransfer?.getData('text/plain');
      const targetView = row.dataset.reportDraggable;
      if (!draggedView || !targetView || draggedView === targetView) return;
      const reordered = state.compiledReportIncludedViews.filter((view) => view !== draggedView);
      const targetIndex = reordered.indexOf(targetView);
      if (targetIndex < 0) return;
      reordered.splice(targetIndex, 0, draggedView);
      state.compiledReportIncludedViews = reordered;
      renderCompiledReportControls();
    });
  });
}

function renderCompiledReportPresets() {
  const node = document.getElementById('compiled-report-presets-list');
  if (!node) return;
  node.classList.add('compiled-report-presets');
  if (!state.selectedProjectId || state.compiledReportPresets.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No report presets saved for this project yet.</li>';
    return;
  }

  node.innerHTML = '';
  const orderedPresets = [...state.compiledReportPresets].sort((left, right) => {
    if (Boolean(left.favorite) !== Boolean(right.favorite)) return left.favorite ? -1 : 1;
    return String(left.label ?? '').localeCompare(String(right.label ?? ''));
  });
  let currentGroup = '';
  for (const preset of orderedPresets) {
    const group = preset.favorite ? 'Pinned packs' : 'Other presets';
    if (group !== currentGroup) {
      currentGroup = group;
      const groupRow = document.createElement('li');
      groupRow.className = 'interactive-list-item compiled-report-group';
      groupRow.innerHTML = `<strong>${escapeHtml(group)}</strong>`;
      node.appendChild(groupRow);
    }
    const li = document.createElement('li');
    li.className = `interactive-list-item${preset.favorite ? ' is-favorite' : ''}`;
    li.innerHTML = `
      <div class="compiled-report-preset-row">
        <div class="compiled-report-preset-meta">
          <span class="workspace-meta">${preset.favorite ? 'Pinned pack' : 'Reusable preset'}</span>
          <span class="project-title">${escapeHtml(preset.label)}</span>
          <span class="source-meta">${preset.views.map((view) => escapeHtml(quantOutputTitle(view))).join(' | ')}</span>
        </div>
        <div class="compiled-report-preset-actions">
          <button type="button" class="small report-preset-favorite-btn">${preset.favorite ? 'Unpin' : 'Pin'}</button>
          <button type="button" class="small report-preset-apply-btn">Apply</button>
          <button type="button" class="small report-preset-open-btn">Open</button>
          <button type="button" class="small report-preset-export-btn">HTML</button>
          <button type="button" class="small report-preset-rename-btn">Rename</button>
          <button type="button" class="small report-preset-duplicate-btn">Duplicate</button>
          <button type="button" class="small danger report-preset-delete-btn">Delete</button>
        </div>
      </div>
    `;
    const applyPreset = () => {
      state.compiledReportIncludedViews = Array.isArray(preset.views) && preset.views.length > 0 ? preset.views : getAllCompiledReportViews();
      renderCompiledReportControls();
    };
    li.querySelector('.report-preset-favorite-btn')?.addEventListener('click', () => {
      state.compiledReportPresets = state.compiledReportPresets.map((entry) =>
        entry.id === preset.id ? { ...entry, favorite: !entry.favorite } : entry
      );
      persistCompiledReportPresets();
      renderCompiledReportPresets();
    });
    li.querySelector('.report-preset-apply-btn')?.addEventListener('click', applyPreset);
    li.querySelector('.report-preset-open-btn')?.addEventListener('click', () => {
      applyPreset();
      openCompiledReportWindow();
    });
    li.querySelector('.report-preset-export-btn')?.addEventListener('click', () => {
      applyPreset();
      exportCompiledReportHtml();
    });
    li.querySelector('.report-preset-rename-btn')?.addEventListener('click', () => {
      const nextLabel = window.prompt('Rename report preset', preset.label)?.trim();
      if (!nextLabel) return;
      state.compiledReportPresets = state.compiledReportPresets.map((entry) =>
        entry.id === preset.id ? { ...entry, label: nextLabel } : entry
      );
      persistCompiledReportPresets();
      renderCompiledReportPresets();
    });
    li.querySelector('.report-preset-duplicate-btn')?.addEventListener('click', () => {
      const duplicateLabel = window.prompt('Duplicate report preset as', `${preset.label} copy`)?.trim();
      if (!duplicateLabel) return;
      state.compiledReportPresets = [
        {
          id: `preset-${Date.now()}`,
          label: duplicateLabel,
          views: [...(preset.views ?? [])],
          favorite: Boolean(preset.favorite)
        },
        ...state.compiledReportPresets
      ].slice(0, 20);
      persistCompiledReportPresets();
      renderCompiledReportPresets();
    });
    li.querySelector('.report-preset-delete-btn')?.addEventListener('click', () => {
      state.compiledReportPresets = state.compiledReportPresets.filter((entry) => entry.id !== preset.id);
      persistCompiledReportPresets();
      renderCompiledReportPresets();
    });
    node.appendChild(li);
  }
}

function getWorkspaceSelection(container, baseStart = 0) {
  if (!container) return null;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return null;
  const startRange = range.cloneRange();
  startRange.selectNodeContents(container);
  startRange.setEnd(range.startContainer, range.startOffset);
  const endRange = range.cloneRange();
  endRange.selectNodeContents(container);
  endRange.setEnd(range.endContainer, range.endOffset);
  const start = startRange.toString().length;
  const end = endRange.toString().length;
  const text = range.toString();
  if (!text.trim() || end <= start) return null;
  return {
    start,
    end,
    absoluteStart: baseStart + start,
    absoluteEnd: baseStart + end,
    text
  };
}

function syncWorkspaceMenus() {
  const activeQualSubView = state.qualitativeSubViews[state.qualitativeView];
  document.querySelectorAll('[data-qual-menu]').forEach((button) => {
    button.classList.toggle('active', button.dataset.qualMenu === state.qualitativeView);
  });
  document.querySelectorAll('[data-qual-section]').forEach((section) => {
    section.hidden = section.dataset.qualSection !== state.qualitativeView;
  });
  document.querySelectorAll('[data-qual-submenu]').forEach((menu) => {
    menu.hidden = menu.dataset.qualSubmenu !== state.qualitativeView;
  });
  document.querySelectorAll('[data-qual-subtab]').forEach((button) => {
    button.classList.toggle(
      'active',
      button.dataset.qualParent === state.qualitativeView && button.dataset.qualSubtab === activeQualSubView
    );
  });
  document.querySelectorAll('[data-qual-subsection]').forEach((section) => {
    const matchesParent = section.dataset.qualParent === state.qualitativeView;
    const visibleSubViews = (section.dataset.qualSubsection ?? '')
      .split(/\s+/)
      .filter(Boolean);
    section.hidden = !(matchesParent && visibleSubViews.includes(activeQualSubView));
  });

  const activeQuantSubView = state.quantitativeSubViews[state.quantitativeView];
  document.querySelectorAll('[data-quant-menu]').forEach((button) => {
    button.classList.toggle('active', button.dataset.quantMenu === state.quantitativeView);
  });
  document.querySelectorAll('[data-quant-section]').forEach((section) => {
    section.hidden = section.dataset.quantSection !== state.quantitativeView;
  });
  document.querySelectorAll('[data-quant-submenu]').forEach((menu) => {
    menu.hidden = menu.dataset.quantSubmenu !== state.quantitativeView;
  });
  document.querySelectorAll('[data-quant-subtab]').forEach((button) => {
    button.classList.toggle(
      'active',
      button.dataset.quantParent === state.quantitativeView && button.dataset.quantSubtab === activeQuantSubView
    );
  });
  document.querySelectorAll('[data-quant-subsection]').forEach((section) => {
    const matchesParent = section.dataset.quantParent === state.quantitativeView;
    const visibleSubViews = (section.dataset.quantSubsection ?? '')
      .split(/\s+/)
      .filter(Boolean);
    section.hidden = !(matchesParent && visibleSubViews.includes(activeQuantSubView));
  });
  document.querySelectorAll('[data-quant-output-nav]').forEach((button) => {
    button.classList.toggle('active', button.dataset.quantOutputNav === state.quantOutputView);
  });
  document.querySelectorAll('[data-quant-output]').forEach((panel) => {
    panel.hidden = panel.dataset.quantOutput !== state.quantOutputView;
  });
  renderInteractionStatus();
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function activateTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `tab-${tab}`);
  });
  syncWorkspaceMenus();
  updateGlobalChatButton();
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activateTab(btn.dataset.tab);
    });
  });
  document.querySelectorAll('[data-qual-menu]').forEach((button) => {
    button.addEventListener('click', () => {
      state.qualitativeView = button.dataset.qualMenu;
      syncWorkspaceMenus();
    });
  });
  document.querySelectorAll('[data-qual-subtab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.qualitativeSubViews[button.dataset.qualParent] = button.dataset.qualSubtab;
      syncWorkspaceMenus();
    });
  });
  document.querySelectorAll('[data-quant-menu]').forEach((button) => {
    button.addEventListener('click', () => {
      state.quantitativeView = button.dataset.quantMenu;
      syncWorkspaceMenus();
    });
  });
  document.querySelectorAll('[data-quant-subtab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.quantitativeSubViews[button.dataset.quantParent] = button.dataset.quantSubtab;
      syncWorkspaceMenus();
    });
  });
  document.querySelectorAll('[data-quant-output-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      state.quantOutputView = button.dataset.quantOutputNav;
      syncWorkspaceMenus();
    });
  });
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-qual-subtab],[data-quant-subtab]') : null;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.qualSubtab && target.dataset.qualParent) {
      state.qualitativeSubViews[target.dataset.qualParent] = target.dataset.qualSubtab;
      syncWorkspaceMenus();
      return;
    }
    if (target.dataset.quantSubtab && target.dataset.quantParent) {
      state.quantitativeSubViews[target.dataset.quantParent] = target.dataset.quantSubtab;
      syncWorkspaceMenus();
    }
  });
  syncWorkspaceMenus();
  updateGlobalChatButton();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

let loginMode = 'login';

function formatExpiryDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function buildIntegrationSummaryText() {
  const sql = state.integrationStatus?.sql ?? null;
  const office = state.integrationStatus?.office ?? null;
  const sqlText = sql
    ? sql.activeMode === 'embedded-portable'
      ? 'Embedded SQL ready'
      : sql.localPostgresConfigured
        ? 'SQL runtime configured'
        : 'SQL runtime not configured'
    : 'SQL status unavailable';
  const officeParts = [];
  if (office?.wordLaunchAvailable) officeParts.push('Word found');
  if (office?.excelLaunchAvailable) officeParts.push('Excel found');
  if (office && officeParts.length === 0) officeParts.push('Word/Excel not found');
  if (!office) officeParts.push('Office status unavailable');
  return `${sqlText}. ${officeParts.join(', ')}.`;
}

function setCurrentUserUi() {
  setText('current-username', state.currentUser?.username ?? '—');
  setText('current-role-badge', state.currentUser ? roleLabel(state.currentUser.role) : '—');
  setText(
    'current-account-expiry',
    state.currentUser
      ? state.currentUser.expiresAt
        ? `Account active until ${formatExpiryDate(state.currentUser.expiresAt)}`
        : 'Professor accounts do not auto-delete'
      : ''
  );
}

function applyLoginMode(mode = loginMode) {
  loginMode = mode;
  window.localStorage.setItem(LOGIN_MODE_STORAGE_KEY, loginMode);
  const titleEl = document.getElementById('login-title');
  const submitBtn = document.getElementById('login-submit-btn');
  const roleRow = document.getElementById('login-role-row');
  const helpEl = document.getElementById('login-help');
  const passwordLabel = document.getElementById('login-password-label');
  const passwordEl = document.getElementById('login-password');
  const signInBtn = document.getElementById('login-mode-signin');
  const setupBtn = document.getElementById('login-mode-setup');
  const oidcBtn = document.getElementById('login-oidc-btn');

  signInBtn?.classList.toggle('active', loginMode === 'login');
  setupBtn?.classList.toggle('active', loginMode === 'setup');
  if (oidcBtn) {
    oidcBtn.style.display = state.oidcEnabled ? '' : 'none';
    oidcBtn.textContent = `Use ${state.oidcProviderName}`;
  }

  if (loginMode === 'setup') {
    titleEl.textContent = 'Set Up Your MU Account';
    submitBtn.textContent = 'Set up account';
    roleRow.style.display = '';
    helpEl.textContent = `Use your MU username and create your own password. Student accounts stay active for five years. Professor accounts do not auto-delete. ${buildIntegrationSummaryText()}`;
    passwordLabel.textContent = 'Create Password';
    passwordEl.placeholder = 'Create a private password';
  } else {
    titleEl.textContent = 'Sign In';
    submitBtn.textContent = 'Sign in';
    roleRow.style.display = 'none';
    helpEl.textContent = `Sign in with your MU username and the password you created during account setup. Student accounts remain available for five years. Professor accounts do not auto-delete. ${buildIntegrationSummaryText()}`;
    passwordLabel.textContent = 'Password';
    passwordEl.placeholder = 'Enter your password';
  }
}

async function loadAuthConfig() {
  try {
    const env = await getJson(`${API_BASE}/auth/oidc/config`);
    state.oidcEnabled = Boolean(env.data.enabled);
    state.oidcProviderName = env.data.providerName || 'MU Single Sign-On';
  } catch {
    state.oidcEnabled = false;
    state.oidcProviderName = 'MU Single Sign-On';
  }
}

async function loadIntegrationStatus() {
  try {
    const env = await getJson(`${API_BASE}/integrations/status`);
    state.integrationStatus = env.data ?? null;
  } catch {
    state.integrationStatus = null;
  }
  applyLoginMode(loginMode);
}

function initLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  const form = document.getElementById('login-form');
  const signInBtn = document.getElementById('login-mode-signin');
  const setupBtn = document.getElementById('login-mode-setup');
  const oidcBtn = document.getElementById('login-oidc-btn');
  const errorEl = document.getElementById('login-error');

  signInBtn.addEventListener('click', () => {
    applyLoginMode('login');
    errorEl.textContent = '';
  });
  setupBtn.addEventListener('click', () => {
    applyLoginMode('setup');
    errorEl.textContent = '';
  });

  const savedMode = window.localStorage.getItem(LOGIN_MODE_STORAGE_KEY);
  applyLoginMode(savedMode === 'setup' ? 'setup' : 'login');

  oidcBtn?.addEventListener('click', () => {
    window.location.href = `${API_BASE}/auth/oidc/start`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.textContent = '';
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;

    try {
      const url = loginMode === 'login' ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
      const body = loginMode === 'login' ? { username, password } : { username, password, role };
      const env = await postJson(url, body);
      state.currentUser = env.data.user;
      overlay.classList.add('hidden');
      setCurrentUserUi();
      registerUserActivity(false);
      await refreshPage();
      startPolling();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}

async function checkSession() {
  try {
    const env = await getJson(`${API_BASE}/auth/me`);
    state.currentUser = env.data.user;
    document.getElementById('login-overlay').classList.add('hidden');
    setCurrentUserUi();
    registerUserActivity(false);
    return true;
  } catch {
    return false;
  }
}

async function performLogout(message = '') {
  try {
    await postJson(`${API_BASE}/auth/logout`, {});
  } catch { /* ignore */ }
  state.currentUser = null;
  state.selectedPresence = [];
  state.professorPresenceUserIds = [];
  stopPolling();
  if (state.idleTimer) {
    clearTimeout(state.idleTimer);
    state.idleTimer = null;
  }
  setCurrentUserUi();
  renderPresenceBanner();
  applyLoginMode('login');
  document.getElementById('login-error').textContent = message;
  document.getElementById('login-overlay').classList.remove('hidden');
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  await performLogout('');
});

// ── Polling ───────────────────────────────────────────────────────────────────

function startPolling() {
  stopPolling();
  state.pollTimer = setInterval(async () => {
    if (!state.selectedProjectId || !state.currentUser) return;
    try {
      await syncPresence({ announce: true, heartbeat: true });
      const env = await getJson(`${API_BASE}/projects/${state.selectedProjectId}/activity`);
      const ts = env.data.updatedAt;
      if (state.lastActivityTs && ts !== state.lastActivityTs) {
        await loadSelectedProjectData();
        renderAll();
      }
      state.lastActivityTs = ts;
    } catch (err) {
      if (err.message?.includes('Session expired')) {
        await performLogout(sessionExpiryMessage());
      }
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
}

function renderPresenceBanner() {
  const banner = document.getElementById('presence-banner');
  if (!banner) return;

  if (!state.currentUser || state.currentUser.role !== 'student' || !isCollaborativeProject()) {
    banner.style.display = 'none';
    banner.textContent = '';
    return;
  }

  const activeProfessors = state.selectedPresence.filter((person) => person.role === 'professor' && person.userId !== state.currentUser.id);
  if (activeProfessors.length === 0) {
    banner.style.display = 'none';
    banner.textContent = '';
    return;
  }

  const names = activeProfessors.map((person) => person.username).join(', ');
  banner.style.display = '';
  banner.textContent = activeProfessors.length === 1
    ? `Professor ${names} is currently in this collaborative workspace.`
    : `Professors ${names} are currently in this collaborative workspace.`;
}

async function syncPresence({ announce = false, heartbeat = false } = {}) {
  if (!state.currentUser || !state.selectedProjectId) {
    state.selectedPresence = [];
    state.professorPresenceUserIds = [];
    renderPresenceBanner();
    return;
  }

  if (heartbeat) {
    try {
      await postJson(`${API_BASE}/presence/ping`, { projectId: state.selectedProjectId });
    } catch { /* ignore */ }
  }

  try {
    const pid = encodeURIComponent(state.selectedProjectId);
    const env = await getJson(`${API_BASE}/presence?projectId=${pid}`);
    state.selectedPresence = env.data.items ?? [];
    const activeProfessorIds = state.selectedPresence
      .filter((person) => person.role === 'professor' && person.userId !== state.currentUser.id)
      .map((person) => person.userId);

    if (
      announce &&
      state.currentUser.role === 'student' &&
      isCollaborativeProject() &&
      activeProfessorIds.some((id) => !state.professorPresenceUserIds.includes(id))
    ) {
      window.alert('A Professor has joined this collaborative workspace.');
    }

    state.professorPresenceUserIds = activeProfessorIds;
    renderPresenceBanner();
  } catch (err) {
    if (err.message?.includes('Session expired')) {
      await performLogout(sessionExpiryMessage());
    }
  }
}

function scheduleIdleTimeout() {
  if (state.idleTimer) clearTimeout(state.idleTimer);
  if (!state.currentUser) return;
  const idleTimeoutMs = (state.governanceStatus?.sessionIdleTimeoutMinutes ?? (IDLE_TIMEOUT_MS / 60000)) * 60 * 1000;
  const remainingMs = Math.max(0, idleTimeoutMs - (Date.now() - state.lastUserActivityAt));
  state.idleTimer = setTimeout(async () => {
    await performLogout(sessionExpiryMessage());
  }, remainingMs);
}

async function registerUserActivity(shouldPing = true) {
  state.lastUserActivityAt = Date.now();
  scheduleIdleTimeout();
  if (!shouldPing || !state.currentUser) return;
  if (Date.now() - state.lastActivityPingAt < ACTIVITY_PING_INTERVAL_MS) return;
  state.lastActivityPingAt = Date.now();
  try {
    await postJson(`${API_BASE}/auth/ping`, {});
  } catch (err) {
    if (err.message?.includes('Session expired')) {
      await performLogout(sessionExpiryMessage());
    }
  }
}

function initActivityTracking() {
  const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
  for (const eventName of events) {
    window.addEventListener(eventName, () => {
      void registerUserActivity(true);
    }, { passive: true });
  }
}

// ── Health ────────────────────────────────────────────────────────────────────

async function loadHealth() {
  const pill = document.getElementById('health-pill');
  try {
    const env = await getJson(`${API_BASE}/health`);
    pill.textContent = env.data.status === 'ok' ? 'API online' : 'API unknown';
    pill.classList.remove('offline');
    pill.classList.add('online');
  } catch {
    pill.textContent = 'API offline';
    pill.classList.add('offline');
    pill.classList.remove('online');
  }
}

async function loadGovernanceStatus() {
  try {
    const env = await getJson(`${API_BASE}/governance/status`);
    state.governanceStatus = env.data;
  } catch {
    state.governanceStatus = null;
  }

  if (state.currentUser?.role === 'professor') {
    try {
      const env = await getJson(`${API_BASE}/governance/policies`);
      state.governancePolicy = env.data.policy;
    } catch {
      state.governancePolicy = null;
    }

    try {
      const env = await getJson(`${API_BASE}/deployment/validate`);
      state.deploymentValidation = env.data;
    } catch {
      state.deploymentValidation = null;
    }
  } else {
    state.governancePolicy = null;
    state.deploymentValidation = null;
  }
}

// ── Load functions ────────────────────────────────────────────────────────────

async function loadProjectsAndSelection() {
  const env = await getJson(`${API_BASE}/projects`);
  state.projects = env.data.items ?? [];
  setText('project-count', `${state.projects.length} total`);
  if (state.selectedProjectId && !state.projects.some((project) => project.id === state.selectedProjectId)) {
    state.selectedProjectId = null;
  }
  if (!state.selectedProjectId && state.projects.length > 0) {
    state.selectedProjectId = state.projects[0].id;
  }
  const selected = state.projects.find((p) => p.id === state.selectedProjectId) ?? null;
  setProjectInputs(selected);
}

async function loadSelectedProjectData() {
  if (!state.selectedProjectId) {
    state.selectedSummary = null;
    state.selectedMembers = [];
    state.selectedSources = [];
    state.selectedCodes = [];
    state.selectedVariables = [];
    state.selectedVariableId = null;
    state.selectedCases = [];
      state.selectedMemos = [];
      state.selectedAnnotations = [];
      state.selectedRelationships = [];
      state.selectedReferences = [];
      state.selectedTranscriptSyncLinks = [];
    state.selectedAttributes = [];
    state.selectedPresence = [];
    state.selectedMessages = [];
    state.selectedSegments = [];
    state.selectedCodeApplications = [];
    state.selectedTraceLinks = [];
    state.externalSqlProfiles = [];
    state.externalSqlTables = [];
    state.externalSqlPreview = null;
    state.externalSqlImportJobs = [];
    state.externalSqlQueryPreview = null;
    state.selectedSqlProfileId = null;
    state.selectedSqlTableKey = '';
    state.selectedAuditEvents = [];
    state.backupItems = [];
    state.recentOfficeArtifacts = [];
    state.savedTransforms = [];
    state.savedAnalysisJobs = [];
    state.savedQualitativeQueries = [];
    state.retrievalResults = [];
    state.retrievalCoverage = '';
    state.retrievalPrompt = '';
    state.cooccurrenceResult = null;
    state.matrixCodingResult = null;
    state.codeCodeMatrixResult = null;
    state.codeByCaseView = null;
    state.qualitativeQueryReport = null;
    state.frameworkMatrixResult = null;
    state.codingComparisonResult = null;
    state.interRaterSummaryResult = null;
    state.autocodeResult = null;
      state.sentimentResult = null;
      state.mergeReviewResult = null;
      state.textSearchResult = null;
      state.wordFrequencyResult = null;
      state.wordCloudResult = null;
      state.compoundQueryResult = null;
      state.mapVisualizationResult = null;
      state.codeHierarchyResult = null;
      state.conceptMapResult = null;
      state.codeClusterResult = null;
      state.referenceImportResult = null;
      state.activeSourceId = null;
    state.workspaceSelectedCodeId = null;
    state.workspaceSelectedCaseId = null;
    state.workspaceFocusedSegmentId = null;
    state.selectedDescriptivesBase = null;
    state.selectedDescriptives = null;
    state.selectedCrosstab = null;
    state.selectedCrosstabError = '';
    state.compareMeansResult = null;
    state.tTestResult = null;
    state.pairedTTestResult = null;
    state.nonparametricResult = null;
    state.customTableResult = null;
    state.exactTestResult = null;
    state.bootstrapResult = null;
    state.missingValuesResult = null;
    state.imputationPlanResult = null;
    state.correlationResult = null;
    state.regressionResult = null;
    state.reliabilityResult = null;
    state.factorAnalysisResult = null;
    state.forecastingResult = null;
    state.clusterAnalysisResult = null;
    state.decisionTreeResult = null;
    state.generalLinearModelResult = null;
    state.repeatedMeasuresResult = null;
    state.survivalAnalysisResult = null;
    state.complexSamplesResult = null;
    state.neuralNetworkResult = null;
    state.syntaxRunResult = null;
    state.lastQuantAnalysis = null;
    state.selectedAnalysisWeightField = '';
    state.selectedMissingStrategy = 'available';
    state.selectedMissingCodes = '';
    state.selectedCrosstabRowField = null;
    state.selectedCrosstabColumnField = null;
    state.compiledReportPresets = [];
    state.mediaTimeline = null;
    state.transcriptionJobs = [];
    renderPresenceBanner();
    return;
  }

  const pid = encodeURIComponent(state.selectedProjectId);

  const [summaryEnv, membersEnv, sourcesEnv, codesEnv, variablesEnv, casesEnv, memosEnv, annotationsEnv, relationshipsEnv, referencesEnv, transcriptSyncEnv, transcriptionJobsEnv, attributesEnv, messagesEnv, segmentsEnv, caEnv, tlEnv, descriptivesEnv, transformsEnv, analysisJobsEnv, qualQueriesEnv] = await Promise.all([
      getJson(`${API_BASE}/project-summary?projectId=${pid}`),
      getJson(`${API_BASE}/projects/${state.selectedProjectId}/members`),
      getJson(`${API_BASE}/sources?projectId=${pid}`),
    getJson(`${API_BASE}/codes?projectId=${pid}`),
    getJson(`${API_BASE}/variables?projectId=${pid}`),
    getJson(`${API_BASE}/cases?projectId=${pid}`),
      getJson(`${API_BASE}/memos?projectId=${pid}`),
      getJson(`${API_BASE}/annotations?projectId=${pid}`),
      getJson(`${API_BASE}/relationships?projectId=${pid}`),
      getJson(`${API_BASE}/references?projectId=${pid}`),
      getJson(`${API_BASE}/transcript-sync-links?projectId=${pid}`),
    getJson(`${API_BASE}/transcription-jobs?projectId=${pid}`),
    getJson(`${API_BASE}/attributes?projectId=${pid}`),
    getJson(`${API_BASE}/project-messages?projectId=${pid}&limit=250`),
    getJson(`${API_BASE}/segments?projectId=${pid}`),
    getJson(`${API_BASE}/code-applications?projectId=${pid}`),
    getJson(`${API_BASE}/trace-links?projectId=${pid}`),
    getJson(`${API_BASE}/descriptives?projectId=${pid}`),
    getJson(`${API_BASE}/saved-transforms?projectId=${pid}`),
    getJson(`${API_BASE}/saved-analysis-jobs?projectId=${pid}`),
    getJson(`${API_BASE}/saved-qualitative-queries?projectId=${pid}`)
  ]);

  state.selectedSummary = summaryEnv.data;
  state.selectedMembers = membersEnv.data.members ?? [];
  state.selectedSources = sourcesEnv.data.items ?? [];
  state.selectedCodes = codesEnv.data.items ?? [];
  state.selectedVariables = variablesEnv.data.items ?? [];
  state.selectedVariableId = state.selectedVariables.some((variable) => variable.id === state.selectedVariableId)
    ? state.selectedVariableId
    : state.selectedVariables[0]?.id ?? null;
  state.selectedCases = casesEnv.data.items ?? [];
    state.selectedMemos = memosEnv.data.items ?? [];
    state.selectedAnnotations = annotationsEnv.data.items ?? [];
    state.selectedRelationships = relationshipsEnv.data.items ?? [];
    state.selectedReferences = referencesEnv.data.items ?? [];
    state.selectedTranscriptSyncLinks = transcriptSyncEnv.data.items ?? [];
  state.transcriptionJobs = transcriptionJobsEnv.data.items ?? [];
  state.selectedAttributes = attributesEnv.data.items ?? [];
  state.selectedMessages = messagesEnv.data.items ?? [];
  state.selectedSegments = segmentsEnv.data.items ?? [];
  state.selectedCodeApplications = caEnv.data.items ?? [];
  state.selectedTraceLinks = tlEnv.data.items ?? [];
  state.externalSqlProfiles = [];
  state.externalSqlTables = [];
  state.externalSqlPreview = null;
  state.externalSqlImportJobs = [];
  state.externalSqlQueryPreview = null;
  state.selectedSqlProfileId = null;
  state.selectedSqlTableKey = '';
  state.savedTransforms = transformsEnv.data.items ?? [];
  state.savedAnalysisJobs = analysisJobsEnv.data.items ?? [];
  state.savedQualitativeQueries = qualQueriesEnv.data.items ?? [];
  state.retrievalResults = [];
  state.retrievalCoverage = '';
  state.retrievalPrompt = '';
  state.cooccurrenceResult = null;
  state.matrixCodingResult = null;
  state.codeCodeMatrixResult = null;
  state.codeByCaseView = null;
  state.qualitativeQueryReport = null;
  state.frameworkMatrixResult = null;
  state.codingComparisonResult = null;
  state.interRaterSummaryResult = null;
  state.autocodeResult = null;
    state.sentimentResult = null;
    state.mergeReviewResult = null;
    state.textSearchResult = null;
    state.wordFrequencyResult = null;
    state.wordCloudResult = null;
    state.compoundQueryResult = null;
    state.mapVisualizationResult = null;
    state.codeHierarchyResult = null;
    state.conceptMapResult = null;
    state.codeClusterResult = null;
    state.referenceImportResult = null;
    state.compareMeansResult = null;
  state.tTestResult = null;
  state.pairedTTestResult = null;
  state.nonparametricResult = null;
  state.customTableResult = null;
  state.exactTestResult = null;
  state.bootstrapResult = null;
  state.missingValuesResult = null;
  state.imputationPlanResult = null;
  state.correlationResult = null;
  state.regressionResult = null;
  state.reliabilityResult = null;
  state.factorAnalysisResult = null;
  state.forecastingResult = null;
  state.clusterAnalysisResult = null;
  state.decisionTreeResult = null;
  state.generalLinearModelResult = null;
  state.repeatedMeasuresResult = null;
  state.survivalAnalysisResult = null;
  state.complexSamplesResult = null;
  state.neuralNetworkResult = null;
  state.syntaxRunResult = null;
  state.cooccurrenceResult = null;
  state.matrixCodingResult = null;
  state.codeCodeMatrixResult = null;
  state.codeByCaseView = null;
  state.qualitativeQueryReport = null;
  state.selectedDescriptivesBase = descriptivesEnv.data ?? null;
  state.selectedDescriptives = state.selectedDescriptivesBase;
  state.compareMeansResult = null;
  state.tTestResult = null;
  state.pairedTTestResult = null;
  state.nonparametricResult = null;
  state.customTableResult = null;
  state.exactTestResult = null;
  state.bootstrapResult = null;
  state.missingValuesResult = null;
  state.imputationPlanResult = null;
  state.correlationResult = null;
  state.regressionResult = null;
  state.reliabilityResult = null;
  state.factorAnalysisResult = null;
  state.forecastingResult = null;
  state.clusterAnalysisResult = null;
  state.decisionTreeResult = null;
  state.generalLinearModelResult = null;
  state.repeatedMeasuresResult = null;
  state.survivalAnalysisResult = null;
  state.complexSamplesResult = null;
  state.neuralNetworkResult = null;
  state.syntaxRunResult = null;
  state.lastQuantAnalysis = null;
  state.activeSourceId = state.selectedSources.some((source) => source.id === state.activeSourceId)
    ? state.activeSourceId
    : state.selectedSources[0]?.id ?? null;
  state.workspaceSelectedCodeId = state.selectedCodes.some((code) => code.id === state.workspaceSelectedCodeId)
    ? state.workspaceSelectedCodeId
    : state.selectedCodes[0]?.id ?? null;
  state.workspaceSelectedCaseId = state.selectedCases.some((caseEntity) => caseEntity.id === state.workspaceSelectedCaseId)
    ? state.workspaceSelectedCaseId
    : '';
  state.workspaceSelectedItemKey = null;
  state.workspaceFocusedSegmentId = null;
  state.selectedCrosstab = null;
  state.selectedCrosstabError = '';
  state.quantOutputView = 'descriptives';
  state.mediaTimeline = null;
  state.quantOutputHistory = [{
    id: `descriptives-${Date.now()}`,
    view: 'descriptives',
    title: 'Descriptives',
    detail: 'Current project dataset overview',
    stamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }];
  state.compiledReportIncludedViews = getAllCompiledReportViews();
  loadCompiledReportPresets();
  if (state.selectedDatasetFilters.length > 0 || state.selectedDatasetRecodes.length > 0) {
    await refreshDatasetAnalysis({ includeCrosstab: false });
  } else {
    ensureCrosstabSelection();
  }
  state.lastActivityTs = state.selectedSummary?.project?.updatedAt ?? null;

  setText('source-count', `${state.selectedSources.length}`);
  setText('code-count', `${state.selectedCodes.length}`);
  setText('variable-count', `${state.selectedVariables.length}`);
  setText('case-count', `${state.selectedCases.length}`);
  setText('memo-count', `${state.selectedMemos.length}`);
    setText('annotation-count', `${state.selectedAnnotations.length}`);
    setText('reference-count', `${state.selectedReferences.length}`);
    setText('attribute-count', `${state.selectedAttributes.length}`);
  setText('message-count', `${state.selectedMessages.length}`);
  setText('segment-count', `${state.selectedSegments.length}`);
  setText('ca-count', `${state.selectedCodeApplications.length}`);
  setText('trace-link-count', `${state.selectedTraceLinks.length}`);
  await loadAuditEvents();
  await loadBackupItems();
}

function getCrosstabFieldOptions() {
  const summaries = state.selectedDescriptives?.report?.summaries ?? [];
  return summaries
    .filter((summary) => summary.source !== 'system')
    .map((summary) => ({
      key: summary.key,
      label: summary.label,
      validCount: summary.validCount
    }));
}

function getDatasetAnalysisFieldOptions() {
  const summaries = state.selectedDescriptives?.report?.summaries
    ?? state.selectedDescriptivesBase?.report?.summaries
    ?? [];
  return summaries
    .filter((summary) => summary.source !== 'system')
    .map((summary) => ({
      key: summary.key,
      label: summary.label,
      valueType: summary.valueType,
      validCount: summary.validCount
    }));
}

function parseMissingCodesInput(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAnalysisOptionsPayload() {
  return {
    weightField: state.selectedAnalysisWeightField || undefined,
    missingStrategy: state.selectedMissingStrategy || 'available',
    missingValues: parseMissingCodesInput(state.selectedMissingCodes)
  };
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function formatAnalysisKindLabel(kind) {
  switch (kind) {
    case 'compare_means': return 'compare means';
    case 't_test': return 't-test';
    case 'paired_t_test': return 'paired t-test';
    case 'nonparametric': return 'nonparametric test';
    case 'correlation': return 'correlation';
    case 'regression': return 'regression';
    case 'reliability': return 'reliability analysis';
    case 'factor_analysis': return 'factor analysis';
    case 'forecasting': return 'forecasting';
    case 'cluster_analysis': return 'cluster analysis';
    case 'decision_tree': return 'decision tree';
    case 'general_linear_model': return 'GLM/ANCOVA';
    case 'repeated_measures': return 'repeated measures';
    case 'survival_analysis': return 'survival analysis';
    case 'complex_samples': return 'complex samples';
    case 'neural_network': return 'neural network';
    case 'syntax_run': return 'syntax run';
    case 'crosstab': return 'crosstab';
    case 'custom_table': return 'custom table';
    case 'exact_test': return 'exact test';
    case 'bootstrap': return 'bootstrap';
    case 'missing_values': return 'missing-values analysis';
    case 'imputation_plan': return 'imputation plan';
    default: return String(kind ?? 'analysis');
  }
}

function updateAnalysisJobHelp(message = 'Run a statistical procedure first, then save it here.') {
  setText('analysis-job-help', message);
}

function clearQuantResults() {
  state.compareMeansResult = null;
  state.tTestResult = null;
  state.pairedTTestResult = null;
  state.nonparametricResult = null;
  state.correlationResult = null;
  state.regressionResult = null;
  state.reliabilityResult = null;
  state.factorAnalysisResult = null;
  state.forecastingResult = null;
  state.clusterAnalysisResult = null;
  state.decisionTreeResult = null;
  state.generalLinearModelResult = null;
  state.repeatedMeasuresResult = null;
  state.survivalAnalysisResult = null;
  state.complexSamplesResult = null;
  state.neuralNetworkResult = null;
  state.syntaxRunResult = null;
  state.selectedCrosstab = null;
  state.selectedCrosstabError = '';
}

function setLastQuantAnalysis(analysisKind, analysis) {
  state.lastQuantAnalysis = {
    analysisKind,
    analysis: cloneJson(analysis ?? {})
  };
  state.quantOutputView = mapAnalysisKindToOutputView(analysisKind);
  {
    const descriptor = describeQuantAnalysis(analysisKind, analysis);
    rememberQuantOutput(state.quantOutputView, descriptor.title, descriptor.detail);
  }
  updateAnalysisJobHelp(`Ready to save ${formatAnalysisKindLabel(analysisKind)}.`);
}

function applySavedAnalysisConfig(analysis) {
  const config = analysis ?? {};
  const analysisOptions = config.analysisOptions ?? {};
  state.selectedDatasetFilters = Array.isArray(config.filters) ? cloneJson(config.filters) : [];
  state.selectedDatasetRecodes = Array.isArray(config.recodes) ? cloneJson(config.recodes) : [];
  state.selectedAnalysisWeightField = typeof analysisOptions.weightField === 'string' ? analysisOptions.weightField : '';
  state.selectedMissingStrategy = typeof analysisOptions.missingStrategy === 'string' ? analysisOptions.missingStrategy : 'available';
  state.selectedMissingCodes = Array.isArray(analysisOptions.missingValues) ? analysisOptions.missingValues.join(', ') : '';
  state.selectedCrosstabRowField = typeof config.rowField === 'string' ? config.rowField : state.selectedCrosstabRowField;
  state.selectedCrosstabColumnField = typeof config.columnField === 'string' ? config.columnField : state.selectedCrosstabColumnField;
}

async function runSavedAnalysisJob(savedJob) {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }

  const analysis = savedJob?.analysis ?? {};
  applySavedAnalysisConfig(analysis);
  clearQuantResults();
  await refreshDatasetAnalysis({ includeCrosstab: false });

  switch (savedJob.analysisKind) {
    case 'compare_means': {
      const env = await postJson(`${API_BASE}/compare-means`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        outcomeField: analysis.outcomeField,
        groupField: analysis.groupField
      });
      state.compareMeansResult = env.data.compareMeans;
      break;
    }
    case 't_test': {
      const env = await postJson(`${API_BASE}/t-tests`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        outcomeField: analysis.outcomeField,
        groupField: analysis.groupField
      });
      state.tTestResult = env.data.tTest;
      break;
    }
    case 'paired_t_test': {
      const env = await postJson(`${API_BASE}/paired-t-tests`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        beforeField: analysis.beforeField,
        afterField: analysis.afterField
      });
      state.pairedTTestResult = env.data.pairedTTest;
      break;
    }
    case 'nonparametric': {
      const env = await postJson(`${API_BASE}/nonparametric-tests`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        outcomeField: analysis.outcomeField,
        groupField: analysis.groupField
      });
      state.nonparametricResult = env.data.nonparametric;
      break;
    }
    case 'correlation': {
      const env = await postJson(`${API_BASE}/correlation`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        xField: analysis.xField,
        yField: analysis.yField
      });
      state.correlationResult = env.data.correlation;
      break;
    }
    case 'regression': {
      const predictorFields = Array.isArray(analysis.predictorFields)
        ? analysis.predictorFields.filter((item) => typeof item === 'string' && item)
        : [];
      const env = await postJson(`${API_BASE}/regression`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        dependentField: analysis.dependentField,
        predictorField: predictorFields[0],
        predictorFields,
        model: analysis.model
      });
      state.regressionResult = env.data.regression;
      break;
    }
    case 'reliability': {
      const fields = Array.isArray(analysis.fields)
        ? analysis.fields.filter((item) => typeof item === 'string' && item)
        : [];
      const subscales = Array.isArray(analysis.subscales)
        ? analysis.subscales.map((item) => ({
          label: typeof item?.label === 'string' ? item.label : '',
          fields: Array.isArray(item?.fields) ? item.fields.filter((field) => typeof field === 'string' && field) : []
        }))
        : [];
      const env = await postJson(`${API_BASE}/reliability`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        fields,
        subscales
      });
      state.reliabilityResult = env.data.reliability;
      break;
    }
    case 'factor_analysis': {
      const fields = Array.isArray(analysis.fields)
        ? analysis.fields.filter((item) => typeof item === 'string' && item)
        : [];
      const env = await postJson(`${API_BASE}/factor-analysis`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        fields,
        factorCount: analysis.factorCount,
        rotation: analysis.rotation
      });
      state.factorAnalysisResult = env.data.factorAnalysis;
      break;
    }
    case 'crosstab': {
      state.selectedCrosstabRowField = typeof analysis.rowField === 'string' ? analysis.rowField : null;
      state.selectedCrosstabColumnField = typeof analysis.columnField === 'string' ? analysis.columnField : null;
      await loadSelectedCrosstab();
      break;
    }
    case 'custom_table': {
      const env = await postJson(`${API_BASE}/custom-tables`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        rowFields: Array.isArray(analysis.rowFields) ? analysis.rowFields : [],
        columnField: analysis.columnField,
        measureFields: Array.isArray(analysis.measureFields) ? analysis.measureFields : []
      });
      state.customTableResult = env.data.customTable;
      break;
    }
    case 'exact_test': {
      const env = await postJson(`${API_BASE}/exact-tests`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        rowField: analysis.rowField,
        columnField: analysis.columnField
      });
      state.exactTestResult = env.data.exactTest;
      break;
    }
    case 'bootstrap': {
      const env = await postJson(`${API_BASE}/bootstrap`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        procedure: analysis.procedure,
        targetFields: Array.isArray(analysis.targetFields) ? analysis.targetFields : [],
        iterations: analysis.iterations,
        confidenceLevel: analysis.confidenceLevel
      });
      state.bootstrapResult = env.data.bootstrap;
      break;
    }
    case 'missing_values': {
      const env = await postJson(`${API_BASE}/missing-values`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload()
      });
      state.missingValuesResult = env.data.missingValues;
      break;
    }
    case 'imputation_plan': {
      const env = await postJson(`${API_BASE}/imputation-plan`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        strategies: Array.isArray(analysis.strategies) ? analysis.strategies : []
      });
      state.imputationPlanResult = env.data.imputationPlan;
      break;
    }
    case 'forecasting': {
      const env = await postJson(`${API_BASE}/forecasting`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        timeField: analysis.timeField,
        valueField: analysis.valueField,
        horizon: analysis.horizon,
        method: analysis.method,
        movingAverageWindow: analysis.movingAverageWindow,
        smoothingAlpha: analysis.smoothingAlpha
      });
      state.forecastingResult = env.data.forecast;
      break;
    }
    case 'cluster_analysis': {
      const env = await postJson(`${API_BASE}/cluster-analysis`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        fields: Array.isArray(analysis.fields) ? analysis.fields : [],
        clusterCount: analysis.clusterCount
      });
      state.clusterAnalysisResult = env.data.clusterAnalysis;
      break;
    }
    case 'decision_tree': {
      const env = await postJson(`${API_BASE}/decision-tree`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        targetField: analysis.targetField,
        predictorFields: Array.isArray(analysis.predictorFields) ? analysis.predictorFields : [],
        maxDepth: analysis.maxDepth
      });
      state.decisionTreeResult = env.data.decisionTree;
      break;
    }
    case 'general_linear_model': {
      const env = await postJson(`${API_BASE}/general-linear-model`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        dependentField: analysis.dependentField,
        factorFields: Array.isArray(analysis.factorFields) ? analysis.factorFields : [],
        covariateFields: Array.isArray(analysis.covariateFields) ? analysis.covariateFields : []
      });
      state.generalLinearModelResult = env.data.generalLinearModel;
      break;
    }
    case 'repeated_measures': {
      const env = await postJson(`${API_BASE}/repeated-measures`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        fields: Array.isArray(analysis.fields) ? analysis.fields : []
      });
      state.repeatedMeasuresResult = env.data.repeatedMeasures;
      break;
    }
    case 'survival_analysis': {
      const env = await postJson(`${API_BASE}/survival-analysis`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        timeField: analysis.timeField,
        eventField: analysis.eventField,
        groupField: analysis.groupField
      });
      state.survivalAnalysisResult = env.data.survivalAnalysis;
      break;
    }
    case 'complex_samples': {
      const env = await postJson(`${API_BASE}/complex-samples`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        targetField: analysis.targetField,
        strataField: analysis.strataField,
        clusterField: analysis.clusterField,
        groupField: analysis.groupField
      });
      state.complexSamplesResult = env.data.complexSamples;
      break;
    }
    case 'neural_network': {
      const env = await postJson(`${API_BASE}/neural-network`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        targetField: analysis.targetField,
        predictorFields: Array.isArray(analysis.predictorFields) ? analysis.predictorFields : [],
        task: analysis.task,
        hiddenUnits: analysis.hiddenUnits
      });
      state.neuralNetworkResult = env.data.neuralNetwork;
      break;
    }
    case 'syntax_run': {
      const env = await postJson(`${API_BASE}/syntax-run`, {
        projectId: state.selectedProjectId,
        filters: state.selectedDatasetFilters,
        recodes: state.selectedDatasetRecodes,
        analysis: getAnalysisOptionsPayload(),
        syntax: analysis.syntax
      });
      state.syntaxRunResult = env.data.syntaxRun;
      break;
    }
    default:
      throw new Error(`Unsupported saved analysis type: ${savedJob.analysisKind}`);
  }

  setLastQuantAnalysis(savedJob.analysisKind, analysis);
  renderAll();
}

function hasActiveAnalysisOptions() {
  return Boolean(
    state.selectedAnalysisWeightField
    || state.selectedMissingStrategy !== 'available'
    || parseMissingCodesInput(state.selectedMissingCodes).length > 0
  );
}

function ensureCrosstabSelection() {
  const options = getCrosstabFieldOptions();
  const validKeys = new Set(options.map((option) => option.key));

  if (!validKeys.has(state.selectedCrosstabRowField)) {
    state.selectedCrosstabRowField = options[0]?.key ?? null;
  }

  if (
    !validKeys.has(state.selectedCrosstabColumnField) ||
    state.selectedCrosstabColumnField === state.selectedCrosstabRowField
  ) {
    state.selectedCrosstabColumnField = options.find((option) => option.key !== state.selectedCrosstabRowField)?.key ?? null;
  }
}

async function loadSelectedCrosstab() {
  await refreshDatasetAnalysis({ includeCrosstab: true });
}

async function refreshDatasetAnalysis({ includeCrosstab = false } = {}) {
  if (!state.selectedProjectId || !state.selectedDescriptivesBase) return;

  ensureCrosstabSelection();
  state.selectedCrosstab = null;
  state.selectedCrosstabError = '';
  const analysis = getAnalysisOptionsPayload();

  if (state.selectedDatasetFilters.length === 0 && state.selectedDatasetRecodes.length === 0 && !hasActiveAnalysisOptions() && !includeCrosstab) {
    state.selectedDescriptives = state.selectedDescriptivesBase;
    return;
  }

  try {
    const env = await postJson(`${API_BASE}/dataset-analysis`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis,
      crosstab: includeCrosstab && state.selectedCrosstabRowField && state.selectedCrosstabColumnField
        ? { rowField: state.selectedCrosstabRowField, columnField: state.selectedCrosstabColumnField }
        : undefined
    });
    state.selectedDescriptives = {
      dataset: env.data.dataset,
      report: env.data.report
    };
    state.selectedCrosstab = env.data.crosstab ?? null;
    if (!includeCrosstab) ensureCrosstabSelection();
  } catch (err) {
    if (!includeCrosstab) {
      state.selectedDescriptives = state.selectedDescriptivesBase;
    }
    state.selectedCrosstabError = err.message;
  }
}

// ── Render functions ──────────────────────────────────────────────────────────

function renderProjects() {
  const node = document.getElementById('projects-list');
  node.innerHTML = '';
  if (state.projects.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No projects yet.</li>';
    return;
  }
  for (const project of state.projects) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    const btn = document.createElement('button');
    btn.className = 'project-button';
    if (project.id === state.selectedProjectId) btn.classList.add('selected');
    btn.innerHTML = `
      <span class="project-title">${escapeHtml(project.name)}</span>
      <span class="project-meta">${escapeHtml(project.id)}</span>
      <span class="source-meta">Mode: ${escapeHtml(project.workspaceMode ?? 'solo')}</span>
      <span class="project-meta">${escapeHtml(project.description || 'No description')}</span>
    `;
    btn.addEventListener('click', async () => {
      state.selectedProjectId = project.id;
      state.lastActivityTs = null;
      await refreshPage();
    });
    li.appendChild(btn);
    node.appendChild(li);
  }
}

function renderProjectActions() {
  if (jobsEl) {
    const formatRunStamp = (value) => {
      if (!value) return 'Never';
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleString();
    };
    jobsEl.innerHTML = state.externalSqlImportJobs.length === 0
      ? '<li class="interactive-list-item empty">No saved SQL import jobs yet.</li>'
      : state.externalSqlImportJobs.map((job) => `
          <li class="interactive-list-item">
            <div>
              <strong>${escapeHtml(job.label)}</strong>
              <div class="small-muted">${escapeHtml(job.schemaName)}.${escapeHtml(job.tableName)} -> ${escapeHtml(job.caseLabelColumn)}</div>
              <div class="small-muted">Rows ${escapeHtml(String(job.maxRows ?? 500))} · ${job.scheduleEnabled ? `Every ${escapeHtml(String(job.scheduleIntervalMinutes ?? 60))} min · Next ${escapeHtml(formatRunStamp(job.scheduleNextRunAt))}` : 'Manual refresh only'}</div>
              <div class="small-muted">Last run ${escapeHtml(formatRunStamp(job.lastRunAt))}${job.lastRunStatus ? ` · ${escapeHtml(job.lastRunStatus)}` : ''}${job.lastRunMessage ? ` · ${escapeHtml(job.lastRunMessage)}` : ''}</div>
            </div>
            <div class="button-row">
              <button type="button" class="small sql-job-run-btn" data-job-id="${escapeHtml(job.id)}">Refresh</button>
              <button type="button" class="small ${job.scheduleEnabled ? 'sql-job-reschedule-btn' : 'sql-job-enable-schedule-btn'}" data-job-id="${escapeHtml(job.id)}" data-current-interval="${escapeHtml(String(job.scheduleIntervalMinutes ?? 60))}">${job.scheduleEnabled ? 'Reschedule' : 'Enable schedule'}</button>
              ${job.scheduleEnabled ? `<button type="button" class="small sql-job-pause-schedule-btn" data-job-id="${escapeHtml(job.id)}">Pause</button>` : ''}
              <button type="button" class="small sql-job-delete-btn" data-job-id="${escapeHtml(job.id)}">Delete</button>
            </div>
          </li>
        `).join('');
  }

  if (scheduleIntervalEl && !scheduleIntervalEl.value) {
    scheduleIntervalEl.value = '60';
  }
  if (jobMaxRowsEl && !jobMaxRowsEl.value) {
    jobMaxRowsEl.value = '500';
  }

  const permissions = getProjectPermissionState();
  const manageTitle = !permissions.hasProject
    ? 'Select a project first.'
    : permissions.canManageProject
      ? 'Project owner access is available.'
      : 'Only project owners can manage this project.';
  const exportTitle = !permissions.hasProject
    ? 'Select a project first.'
    : permissions.canExportProject
      ? 'Export access is available.'
      : 'Only project owners and Professor accounts can export project outputs.';

  setButtonAccessState('delete-project-btn', permissions.canManageProject, manageTitle);
  setButtonAccessState('save-workspace-mode-btn', permissions.canManageProject, manageTitle);
  setButtonAccessState('share-project-btn', permissions.canManageProject, manageTitle);
  setButtonAccessState('create-backup-btn', permissions.canManageProject, manageTitle);
  setButtonAccessState('refresh-backups-btn', permissions.canManageProject, manageTitle);
  setButtonAccessState('open-compiled-report-btn', permissions.canExportProject, exportTitle);

  ['member-username', 'member-role', 'collaboration-workspace-mode'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.disabled = id === 'collaboration-workspace-mode'
        ? !permissions.canManageProject
        : !permissions.canManageProject;
      input.title = manageTitle;
    }
  });

  [
    'export-csv-btn', 'export-xlsx-btn', 'export-json-btn',
    'export-evidence-btn', 'export-evidence-docx-btn', 'export-evidence-xlsx-btn', 'export-evidence-pdf-btn',
    'export-codebook-docx-btn', 'export-codebook-xlsx-btn', 'export-codebook-pdf-btn',
    'export-case-summaries-docx-btn', 'export-case-summaries-xlsx-btn', 'export-case-summaries-pdf-btn',
    'export-appendix-docx-btn', 'export-appendix-xlsx-btn', 'export-appendix-pdf-btn',
    'export-chat-history-word-btn', 'export-chat-history-excel-btn', 'export-chat-history-json-btn',
    'export-framework-word-btn', 'export-framework-excel-btn', 'export-matrix-word-btn', 'export-matrix-excel-btn',
    'export-code-code-word-btn', 'export-code-code-excel-btn', 'export-cooccurrence-word-btn',
    'export-query-report-word-btn', 'export-coding-comparison-word-btn', 'export-inter-rater-word-btn',
    'export-audit-json-btn', 'export-audit-csv-btn', 'export-audit-xlsx-btn', 'export-audit-txt-btn',
    'export-compiled-report-btn'
  ].forEach((id) => setButtonAccessState(id, permissions.canExportProject, exportTitle));

  setText(
    'import-result',
    !permissions.hasProject
      ? 'Select a project to enable import and export actions.'
      : permissions.canExportProject
        ? 'Import files or export project outputs from this workspace.'
        : 'Project data is available for analysis, but exports are limited to project owners and Professor accounts.'
  );
  setText(
    'backup-result',
    !permissions.hasProject
      ? 'Select a project to review backup and audit access.'
      : permissions.canManageProject
        ? 'Project owners can create and restore backup snapshots here.'
        : 'Backup, restore, workspace settings, and deletion are limited to project owners.'
  );
}

function renderMembers() {
  const node = document.getElementById('members-list');
  node.innerHTML = '';
  setText('member-count', `${state.selectedMembers.length}`);
  if (state.selectedMembers.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No project selected.</li>';
    return;
  }
  for (const m of state.selectedMembers) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="member-row">
        <div>
          <span class="project-title">${escapeHtml(m.username)}</span>
          <span class="source-meta">${escapeHtml(m.userId)}</span>
          <span class="source-meta">${escapeHtml(roleLabel(m.userRole))}</span>
        </div>
        <span class="badge ${m.role === 'owner' ? 'green' : ''}">${escapeHtml(m.role)}</span>
      </div>
    `;
    node.appendChild(li);
  }
}

function renderActiveUsers() {
  const node = document.getElementById('active-users-list');
  if (!node) return;
  node.innerHTML = '';
  setText('active-user-count', `${state.selectedPresence.length}`);
  if (state.selectedPresence.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No one is active right now.</li>';
    return;
  }
  for (const person of state.selectedPresence) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="member-row">
        <div>
          <span class="project-title">${escapeHtml(person.username)}</span>
          <span class="source-meta">${escapeHtml(roleLabel(person.role))}</span>
        </div>
        <span class="badge ${person.role === 'professor' ? 'green' : ''}">active</span>
      </div>
    `;
    node.appendChild(li);
  }
}

function renderMessagesPreview() {
  setText('message-preview-count', `${state.selectedMessages.length}`);
}

function renderProjectChatHistory() {
  setText('project-chat-history-count', `${state.selectedMessages.length}`);
  const toolsCount = document.getElementById('project-chat-tools-count');
  if (toolsCount) {
    toolsCount.textContent = `${state.selectedMessages.length} saved messages`;
  }
}

function renderProjectsSecondary() {
  const node = document.getElementById('projects-secondary-list');
  if (!node) return;
  node.innerHTML = '';
  setText('project-secondary-count', `${state.projects.length}`);
  if (state.projects.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No projects yet.</li>';
    return;
  }
  for (const project of state.projects) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <button class="project-button ${project.id === state.selectedProjectId ? 'selected' : ''}">
        <span class="project-title">${escapeHtml(project.name)}</span>
        <span class="project-meta">${escapeHtml(project.id)}</span>
        <span class="source-meta">Mode: ${escapeHtml(project.workspaceMode ?? 'solo')}</span>
      </button>
    `;
    li.querySelector('button')?.addEventListener('click', async () => {
      state.selectedProjectId = project.id;
      state.lastActivityTs = null;
      await refreshPage();
    });
    node.appendChild(li);
  }
}

function renderSources() {
  const node = document.getElementById('sources-list');
  node.innerHTML = '';
  if (state.selectedSources.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No sources yet.</li>';
    return;
  }
  for (const s of state.selectedSources) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(s.title)}</span>
          <span class="source-meta">${escapeHtml(s.id)}</span>
          <span class="source-meta">${escapeHtml(s.contentType)} · ${escapeHtml(s.language)}</span>
          <span class="source-meta">${escapeHtml(summarizeText(s.contentText))}</span>
        </div>
        <span class="badge">${escapeHtml(s.kind)}</span>
      </div>
    `;
    li.style.cursor = 'pointer';
    li.title = 'Click to use this source ID in the segment form';
    li.addEventListener('click', () => {
      state.activeSourceId = s.id;
      const el = document.getElementById('segment-source-id');
      if (el) el.value = s.id;
      setMemoTarget('source', s.id);
      setAttributeTarget('source', s.id);
      setAnnotationTarget('source', s.id);
      renderSourceWorkspace();
    });
    node.appendChild(li);
  }
}

function renderCodes() {
  const node = document.getElementById('codes-list');
  node.innerHTML = '';
  if (state.selectedCodes.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No codes yet.</li>';
    return;
  }
  for (const c of state.selectedCodes) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(c.name)}</span>
          <span class="source-meta">${escapeHtml(c.id)}</span>
          <span class="source-meta">${escapeHtml(c.description || 'No description')}</span>
        </div>
        <span class="badge">${escapeHtml(c.colorToken)}</span>
      </div>
    `;
    li.style.cursor = 'pointer';
    li.title = 'Click to use this code ID';
    li.addEventListener('click', () => {
      state.workspaceSelectedCodeId = c.id;
      const caEl = document.getElementById('ca-code-id');
      if (caEl) caEl.value = c.id;
      const varEl = document.getElementById('variable-derived-code-id');
      if (varEl) varEl.value = c.id;
      setMemoTarget('code', c.id);
      setAnnotationTarget('code', c.id);
      renderSourceWorkspace();
    });
    node.appendChild(li);
  }
}

function renderVariables() {
  const node = document.getElementById('variables-list');
  node.innerHTML = '';
  if (state.selectedVariables.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No variables yet.</li>';
    return;
  }
  for (const v of state.selectedVariables) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    if (v.id === state.selectedVariableId) li.classList.add('selected-card');
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(v.name)}</span>
          <span class="source-meta">${escapeHtml(v.label)}</span>
          <span class="source-meta">${escapeHtml(v.id)}</span>
          ${v.derivedFromCodeId ? `<span class="source-meta">→ code: ${escapeHtml(v.derivedFromCodeId)}</span>` : ''}
        </div>
        <div class="inline-actions">
          <span class="badge">${escapeHtml(v.kind)}</span>
          <span class="badge">${escapeHtml(v.sourceKind)}</span>
        </div>
      </div>
    `;
    const metaHost = li.querySelector('.source-row > div');
    if (metaHost) {
      const ruleMeta = document.createElement('span');
      ruleMeta.className = 'source-meta';
      ruleMeta.textContent = `Rule: ${v.derivationRule ?? 'presence'}${v.sourceKind === 'derived_code' && v.derivedFromCodeId ? ` | Code: ${v.derivedFromCodeId}` : ''}`;
      metaHost.appendChild(ruleMeta);
    }
    li.style.cursor = 'pointer';
    li.title = 'Click to inspect this variable';
    li.addEventListener('click', () => {
      state.selectedVariableId = v.id;
      renderVariables();
      renderVariableInspector();
    });
    node.appendChild(li);
  }
}

function getSelectedVariableDetails() {
  const variable = state.selectedVariables.find((item) => item.id === state.selectedVariableId) ?? null;
  if (!variable) return null;

  const report = state.selectedDescriptives?.report ?? state.selectedDescriptivesBase?.report ?? null;
  const dataset = state.selectedDescriptives?.dataset ?? state.selectedDescriptivesBase?.dataset ?? null;
  const summary = report?.summaries?.find((item) =>
    item.source === 'variable' && (item.label === variable.label || item.key === normalizeAnalysisFieldKey(variable.name))
  ) ?? null;
  const code = variable.derivedFromCodeId
    ? state.selectedCodes.find((item) => item.id === variable.derivedFromCodeId) ?? null
    : null;
  const traceCount = state.selectedTraceLinks.filter((item) => item.variableId === variable.id).length;
  const previewRows = summary && dataset
    ? dataset.rows
      .filter((row) => row[summary.key] !== undefined)
      .slice(0, 5)
      .map((row) => ({
        caseLabel: row.case_label ?? row.case_id ?? 'Unknown case',
        value: row[summary.key]
      }))
    : [];

  return {
    variable,
    summary,
    code,
    traceCount,
    previewRows
  };
}

function renderVariableInspector() {
  const summaryEl = document.getElementById('variable-inspector-summary');
  const previewEl = document.getElementById('variable-inspector-preview');
  if (!summaryEl || !previewEl) return;

  const details = getSelectedVariableDetails();
  if (!details) {
    summaryEl.innerHTML = '<p>Select a variable to inspect it.</p>';
    previewEl.innerHTML = '<p>No variable selected.</p>';
    return;
  }

  const { variable, summary, code, traceCount, previewRows } = details;
  summaryEl.innerHTML = `
    <p><strong>${escapeHtml(variable.label)}</strong></p>
    <p class="small-muted">${escapeHtml(variable.name)} (${escapeHtml(variable.id)})</p>
    <div class="stat-grid">
      <div class="stat-box">
        <strong>${escapeHtml(variable.kind)}</strong>
        <span class="small-muted">Variable kind</span>
      </div>
      <div class="stat-box">
        <strong>${escapeHtml(variable.sourceKind)}</strong>
        <span class="small-muted">Source kind</span>
      </div>
      <div class="stat-box">
        <strong>${escapeHtml(variable.derivationRule ?? 'presence')}</strong>
        <span class="small-muted">Derivation rule</span>
      </div>
      <div class="stat-box">
        <strong>${traceCount}</strong>
        <span class="small-muted">Trace-linked cases</span>
      </div>
    </div>
    <p class="small-muted" style="margin-top:12px">
      ${code ? `Derived from code: ${escapeHtml(code.name)} (${escapeHtml(code.id)}). ` : ''}
      ${summary ? `Dataset field: ${escapeHtml(summary.key)}.` : 'This variable is not materialized into the active dataset yet.'}
    </p>
  `;

  if (!summary) {
    previewEl.innerHTML = '<p>No active dataset summary is available for this variable yet.</p>';
    return;
  }

  const numericPreview = summary.numeric
    ? `<p class="small-muted">Mean ${formatDecimal(summary.numeric.mean, 2)} | Min ${formatDecimal(summary.numeric.min, 2)} | Max ${formatDecimal(summary.numeric.max, 2)}</p>`
    : '';
  const distribution = summary.frequencies.length > 0
    ? `<div class="matrix-table-wrap" style="margin-top:12px">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Value</th>
              <th>Count</th>
              <th>Percent</th>
            </tr>
          </thead>
          <tbody>
            ${summary.frequencies.slice(0, 8).map((frequency) => `
              <tr>
                <td>${escapeHtml(frequency.value)}</td>
                <td>${frequency.count}</td>
                <td>${formatDecimal(frequency.proportion * 100, 1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`
    : '<p>No non-missing values in the active dataset.</p>';

  previewEl.innerHTML = `
    <p>
      Valid <strong>${summary.validCount}</strong>
      · Missing <strong>${summary.missingCount}</strong>
      · Distinct <strong>${summary.distinctCount}</strong>
    </p>
    ${numericPreview}
    ${distribution}
    <div style="margin-top:12px">
      <strong>Example case values</strong>
      <ul class="interactive-list" style="margin-top:12px">
        ${previewRows.length > 0
          ? previewRows.map((row) => `
            <li class="interactive-list-item">
              <span class="project-title">${escapeHtml(String(row.caseLabel))}</span>
              <span class="source-meta">${escapeHtml(formatAttributeValue(row.value ?? null))}</span>
            </li>
          `).join('')
          : '<li class="interactive-list-item empty">No example values available.</li>'}
      </ul>
    </div>
  `;
}

function renderCases() {
  const node = document.getElementById('cases-list');
  node.innerHTML = '';
  if (state.selectedCases.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No cases yet.</li>';
    return;
  }
  for (const c of state.selectedCases) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(c.label)}</span>
          <span class="source-meta">${escapeHtml(c.id)}</span>
          <span class="source-meta">Sources: ${c.sourceIds.length > 0 ? c.sourceIds.map(escapeHtml).join(', ') : 'none'}</span>
        </div>
        <span class="badge">case</span>
      </div>
    `;
    li.style.cursor = 'pointer';
    li.title = 'Click to use this case ID';
    li.addEventListener('click', () => {
      state.workspaceSelectedCaseId = c.id;
      const el = document.getElementById('ca-case-id');
      if (el) el.value = c.id;
      setMemoTarget('case', c.id);
      setAttributeTarget('case', c.id);
      setAnnotationTarget('case', c.id);
      renderSourceWorkspace();
    });
    node.appendChild(li);
  }
}

function renderSegments() {
  const node = document.getElementById('segments-list');
  node.innerHTML = '';
  if (state.selectedSegments.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No segments yet.</li>';
    return;
  }
  for (const seg of state.selectedSegments) {
    const anchor = seg.anchor ?? {};
    let anchorLabel = seg.kind;
    if (anchor.kind === 'text_range') anchorLabel = `${anchor.start}–${anchor.end}`;
    else if (anchor.kind === 'time_range') anchorLabel = `${anchor.startMs}–${anchor.endMs}ms`;
    else if (anchor.kind === 'page_region') anchorLabel = `p${anchor.page}`;

    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(seg.text || '(no text)')}</span>
          <span class="source-meta">${escapeHtml(seg.id)} · ${escapeHtml(seg.sourceId)}</span>
        </div>
        <span class="badge">${escapeHtml(anchorLabel)}</span>
      </div>
    `;
    li.style.cursor = 'pointer';
    li.title = 'Click to use this segment ID';
    li.addEventListener('click', () => {
      const el = document.getElementById('ca-segment-id');
      if (el) el.value = seg.id;
      setMemoTarget('segment', seg.id);
      setAnnotationTarget('segment', seg.id);
    });
    node.appendChild(li);
  }
}

function renderMemos() {
  const node = document.getElementById('memos-list');
  node.innerHTML = '';
  if (state.selectedMemos.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No memos yet.</li>';
    return;
  }
  for (const memo of state.selectedMemos) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(memo.title)}</span>
          <span class="source-meta">${escapeHtml(memo.id)}</span>
          <span class="source-meta">${escapeHtml(memo.targetType)} · ${escapeHtml(memo.targetId)}</span>
          <span class="source-meta">${escapeHtml(summarizeText(memo.body, 120))}</span>
        </div>
        <span class="badge">memo</span>
      </div>
    `;
    li.style.cursor = 'pointer';
    li.title = 'Click to reuse this target in the memo form';
    li.addEventListener('click', () => {
      setMemoTarget(memo.targetType, memo.targetId);
    });
    node.appendChild(li);
  }
}

function renderAnnotations() {
  const node = document.getElementById('annotations-list');
  if (!node) return;
  node.innerHTML = '';
  if (state.selectedAnnotations.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No annotations yet.</li>';
    return;
  }
  for (const annotation of state.selectedAnnotations) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(annotation.note)}</span>
          <span class="source-meta">${escapeHtml(annotation.id)}</span>
          <span class="source-meta">${escapeHtml(annotation.targetType)} · ${escapeHtml(annotation.targetId)}</span>
          <span class="source-meta">${escapeHtml(summarizeText(annotation.quoteText || '', 120))}</span>
        </div>
        <span class="badge" style="${getCodeToneStyle(annotation.colorToken)}">annot</span>
      </div>
    `;
    li.style.cursor = 'pointer';
    li.title = 'Click to reuse this target in the annotation form';
    li.addEventListener('click', () => {
      setAnnotationTarget(annotation.targetType, annotation.targetId);
    });
    node.appendChild(li);
  }
}

function renderRelationships() {
  const node = document.getElementById('relationships-list');
  if (!node) return;
  node.innerHTML = '';
  if (state.selectedRelationships.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No see-also links yet.</li>';
    return;
  }
  for (const relationship of state.selectedRelationships) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(relationship.relationshipType)}</span>
          <span class="source-meta">${escapeHtml(relationship.leftTargetType)} · ${escapeHtml(relationship.leftTargetId)}</span>
          <span class="source-meta">${escapeHtml(relationship.rightTargetType)} · ${escapeHtml(relationship.rightTargetId)}</span>
          <span class="source-meta">${escapeHtml(relationship.note || 'No note')}</span>
        </div>
        <div class="inline-actions">
          <button type="button" class="small relationship-open-left-btn">Open left</button>
          <button type="button" class="small relationship-open-right-btn">Open right</button>
        </div>
      </div>
    `;
    li.querySelector('.relationship-open-left-btn')?.addEventListener('click', () => {
      focusRelationshipTarget(relationship.leftTargetType, relationship.leftTargetId);
    });
    li.querySelector('.relationship-open-right-btn')?.addEventListener('click', () => {
      focusRelationshipTarget(relationship.rightTargetType, relationship.rightTargetId);
    });
    node.appendChild(li);
  }
}

function renderMediaTimeline() {
  const node = document.getElementById('workspace-media-timeline');
  const jobsNode = document.getElementById('workspace-transcription-jobs');
  if (jobsNode) {
    jobsNode.innerHTML = state.transcriptionJobs.length === 0
      ? '<div class="small-muted">No transcription jobs yet.</div>'
      : state.transcriptionJobs
        .map((job) => `
          <div class="interactive-list-item">
            <div class="source-row">
              <div>
                <span class="project-title">${escapeHtml(job.id)}</span>
                <span class="source-meta">${escapeHtml(job.status)} · ${escapeHtml(job.mode)}</span>
                <span class="source-meta">${escapeHtml(job.note || 'No note')}</span>
              </div>
              <div class="inline-actions">
                <button type="button" class="small transcription-run-btn" data-job-id="${escapeHtml(job.id)}">Run</button>
              </div>
            </div>
          </div>
        `).join('');
    jobsNode.querySelectorAll('.transcription-run-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        await runTranscriptionJob(button.dataset.jobId);
      });
    });
  }
  if (!node) return;
  const timeline = state.mediaTimeline;
  if (!timeline || !timeline.durationMs) {
    node.innerHTML = '<div class="small-muted">No media timeline yet. Save time-range segments or run transcription first.</div>';
    return;
  }
  const durationMs = Math.max(1, timeline.durationMs);
  node.innerHTML = `
    <div class="small-muted">Estimated duration ${(durationMs / 1000).toFixed(1)}s</div>
    <div class="timeline-track" style="margin-top:10px; position:relative; height:24px; border-radius:999px; background:rgba(255,255,255,0.08); overflow:hidden;">
      ${(timeline.timeSegments ?? []).map((segment) => {
        const left = (segment.startMs / durationMs) * 100;
        const width = Math.max(2, ((segment.endMs - segment.startMs) / durationMs) * 100);
        return `<button type="button" class="timeline-segment-btn" data-segment-id="${escapeHtml(segment.segmentId)}" style="position:absolute; left:${left}%; width:${width}%; top:3px; bottom:3px; border:none; border-radius:999px; background:rgba(209,178,111,0.9);" title="${escapeHtml(segment.text)}"></button>`;
      }).join('')}
    </div>
    <div class="interactive-list" style="margin-top:12px">
      ${(timeline.syncLinks ?? []).length === 0
        ? '<div class="interactive-list-item empty">No transcript sync links yet.</div>'
        : timeline.syncLinks.map((link) => `
          <div class="interactive-list-item">
            <span class="project-title">${escapeHtml((link.startMs / 1000).toFixed(1))}s - ${escapeHtml((link.endMs / 1000).toFixed(1))}s</span>
            <span class="source-meta">${escapeHtml(summarizeText(link.transcriptText, 120))}</span>
          </div>
        `).join('')}
    </div>
  `;
  node.querySelectorAll('.timeline-segment-btn').forEach((button) => {
    button.addEventListener('click', () => {
      jumpToWorkspaceSegment(button.dataset.segmentId);
    });
  });
}

function renderMergeReview() {
  const summaryEl = document.getElementById('merge-review-summary');
  const resultEl = document.getElementById('merge-review-result');
  if (!summaryEl || !resultEl) return;
  if (!state.mergeReviewResult) {
    summaryEl.textContent = 'Run merge review to identify coder overlap and high-spread coding that should be merged deliberately.';
    resultEl.innerHTML = '<p>No merge review yet.</p>';
    return;
  }
  summaryEl.textContent = `${state.mergeReviewResult.candidateCount} merge review candidate(s).`;
  resultEl.innerHTML = buildOutputTable(
    ['Code', 'Source', 'Segment', 'Coders', 'Confidence spread', 'Excerpt'],
    (state.mergeReviewResult.rows ?? []).map((row) => [
      escapeHtml(row.codeName),
      escapeHtml(row.sourceTitle ?? row.sourceId),
      escapeHtml(row.segmentId),
      escapeHtml((row.coderIds ?? []).join(', ')),
      escapeHtml(formatStatValue(row.confidenceSpread, 2)),
      escapeHtml(summarizeText(row.excerpt, 120))
    ])
  );
}

function renderAttributes() {
  const node = document.getElementById('attributes-list');
  node.innerHTML = '';
  if (state.selectedAttributes.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No attributes yet.</li>';
    return;
  }
  for (const attribute of state.selectedAttributes) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(attribute.name)}</span>
          <span class="source-meta">${escapeHtml(attribute.id)}</span>
          <span class="source-meta">${escapeHtml(attribute.targetType)} · ${escapeHtml(attribute.targetId)}</span>
          <span class="source-meta">${escapeHtml(formatAttributeValue(attribute.value))}</span>
        </div>
        <span class="badge">attr</span>
      </div>
    `;
    li.style.cursor = 'pointer';
    li.title = 'Click to reuse this target in the attribute form';
    li.addEventListener('click', () => {
      setAttributeTarget(attribute.targetType, attribute.targetId);
    });
    node.appendChild(li);
  }
}

function renderCodeApplications() {
  const node = document.getElementById('ca-list');
  node.innerHTML = '';
  if (state.selectedCodeApplications.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No code applications yet.</li>';
    return;
  }
  for (const ca of state.selectedCodeApplications) {
    const code = state.selectedCodes.find((c) => c.id === ca.codeId);
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(code?.name ?? ca.codeId)}</span>
          <span class="source-meta">Segment: ${escapeHtml(ca.segmentId)}</span>
          ${ca.caseId ? `<span class="source-meta">Case: ${escapeHtml(ca.caseId)}</span>` : ''}
          <span class="source-meta">By: ${escapeHtml(ca.coderId)}</span>
        </div>
        <span class="badge">conf: ${ca.confidence}</span>
      </div>
    `;
    node.appendChild(li);
  }
}

function renderTraceLinks() {
  const node = document.getElementById('trace-links-list');
  node.innerHTML = '';
  if (state.selectedTraceLinks.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No trace links yet. Apply codes to segments, then click "Run derivation".</li>';
    return;
  }
  for (const tl of state.selectedTraceLinks) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(tl.variableName)} = true</span>
          <span class="source-meta">Case: <strong>${escapeHtml(tl.caseLabel)}</strong> (${escapeHtml(tl.caseId)})</span>
          <span class="source-meta">Variable: ${escapeHtml(tl.variableId)}</span>
          <span class="source-meta">Supporting applications: ${tl.supportingCodeApplicationIds.length}</span>
        </div>
        <span class="badge green">derived</span>
      </div>
    `;
    node.appendChild(li);
  }
}

function renderDescriptives() {
  const overview = document.getElementById('descriptive-overview');
  const list = document.getElementById('descriptives-list');
  if (!overview || !list) return;

  if (!state.selectedDescriptives) {
    setText('descriptive-case-count', '0 cases');
    setText('descriptive-field-count', '0 fields');
    overview.innerHTML = '<p>Select a project to build a case-level dataset.</p>';
    list.innerHTML = '<li class="interactive-list-item empty">No dataset available yet.</li>';
    return;
  }

  {
    const { dataset, report } = state.selectedDescriptives;
    setText('descriptive-case-count', `${report.caseCount} cases`);
    setText('descriptive-field-count', `${report.fieldCount} fields`);

      const notes = dataset.notes ?? [];
      const completenessItems = report.summaries
        .filter((summary) => summary.source !== 'system')
        .slice(0, 8)
        .map((summary) => ({ label: summary.label, value: summary.validCount }));
      const numericMeanItems = report.summaries
        .filter((summary) => summary.numeric)
        .slice(0, 8)
        .map((summary) => ({ label: summary.label, value: summary.numeric.mean }));
      overview.innerHTML = buildOutputViewer({
        eyebrow: 'Dataset overview',
        title: 'Case-level descriptives',
        summary: `${report.analysis?.weightField ? `Weighted by ${report.analysis.weightField}. ` : ''}${report.analysis?.missingStrategy === 'listwise' ? 'Listwise missing-data handling is active. ' : ''}${notes.length > 0 ? notes[0].message : 'Case attributes, source attributes, and derived variables are shown in one analysis surface.'}`,
        metrics: [
          { label: 'Rows', value: report.caseCount },
          { label: 'Fields', value: report.fieldCount },
          { label: 'Weighted total', value: report.weightedCaseCount === null || report.weightedCaseCount === undefined ? 'n/a' : formatDecimal(report.weightedCaseCount, 3) },
          { label: 'Derived variables', value: report.summaries.filter((summary) => summary.source === 'variable').length },
          { label: 'Attributes', value: report.summaries.filter((summary) => summary.source === 'attribute').length }
        ],
        sections: [
          completenessItems.length > 0
            ? buildOutputSection(
              'Field completeness',
              `<div class="chart-grid">${buildChartCard('Valid rows by field', buildSvgBarChart(completenessItems, { formatter: (value) => String(Math.round(value)) }), 'Top fields by non-missing rows.')}</div>`
            )
            : '',
          numericMeanItems.length > 0
            ? buildOutputSection(
              'Numeric snapshot',
              `<div class="chart-grid">${buildChartCard('Field means', buildSvgBarChart(numericMeanItems, { color: '#8fb3ff', formatter: (value) => formatDecimal(value, 2) }), 'Quick comparison of numeric field means.')}</div>`
            )
            : '',
          buildChartSuggestionsSection([
            'Histogram for the selected numeric field',
            'Bar chart for the highest-frequency categorical field',
            'Completeness chart for missing-data review'
          ])
        ].filter(Boolean)
      });

    list.innerHTML = '';
    const visibleSummaries = report.summaries.filter((summary) => summary.source !== 'system');
    if (visibleSummaries.length === 0) {
      list.innerHTML = '<li class="interactive-list-item empty">No analyzable fields yet. Add case attributes or derive a binary variable from coded evidence.</li>';
      return;
    }

    for (const summary of visibleSummaries) {
      const li = document.createElement('li');
      li.className = 'interactive-list-item descriptive-field-card';
      const frequencyText = summary.frequencies.length > 0
        ? summary.frequencies
          .slice(0, 4)
          .map((frequency) => `${escapeHtml(frequency.value)}: ${frequency.count} (${formatDecimal(frequency.proportion * 100, 1)}%)`)
          .join(' | ')
        : 'No non-missing values yet.';
      const numericText = summary.numeric
        ? `Mean ${formatDecimal(summary.numeric.mean)}, min ${formatDecimal(summary.numeric.min)}, max ${formatDecimal(summary.numeric.max)}`
        : '';

      li.innerHTML = `
        <div class="descriptive-field-head">
          <div>
            <span class="project-title">${escapeHtml(summary.label)}</span>
            <span class="source-meta">${escapeHtml(summary.key)} | ${escapeHtml(summary.source)} | ${escapeHtml(summary.valueType)}</span>
          </div>
          <span class="badge">${escapeHtml(summary.valueType)}</span>
        </div>
        <div class="descriptive-field-metrics">
          <span>Valid <strong>${summary.validCount}</strong></span>
          <span>Missing <strong>${summary.missingCount}</strong></span>
          <span>Distinct <strong>${summary.distinctCount}</strong></span>
        </div>
        <p class="source-meta">${frequencyText}</p>
        ${numericText ? `<p class="source-meta">${numericText}</p>` : ''}
      `;
      list.appendChild(li);
    }
    return;
  }

  const { dataset, report } = state.selectedDescriptives;
  setText('descriptive-case-count', `${report.caseCount} cases`);
  setText('descriptive-field-count', `${report.fieldCount} fields`);

  const notes = dataset.notes ?? [];
  overview.innerHTML = `
    <p>Case-level rows: <strong>${report.caseCount}</strong></p>
    <p>Dataset fields: <strong>${report.fieldCount}</strong></p>
    <p>Weighted case total: <strong>${report.weightedCaseCount === null || report.weightedCaseCount === undefined ? 'n/a' : formatDecimal(report.weightedCaseCount, 3)}</strong></p>
    <p>Derived binary variables with values: <strong>${report.summaries.filter((summary) => summary.source === 'variable').length}</strong></p>
    <p>Attributes contributing values: <strong>${report.summaries.filter((summary) => summary.source === 'attribute').length}</strong></p>
    <p>${report.analysis?.weightField ? `Weighted by ${escapeHtml(report.analysis.weightField)}. ` : ''}${report.analysis?.missingStrategy === 'listwise' ? 'Listwise missing-data handling is active. ' : ''}${notes.length > 0 ? escapeHtml(notes[0].message) : 'Case attributes, source attributes, and derived binary variables now flow into one SPSS-style descriptive layer.'}</p>
  `;

  list.innerHTML = '';
  const visibleSummaries = report.summaries.filter((summary) => summary.source !== 'system');
  if (visibleSummaries.length === 0) {
    list.innerHTML = '<li class="interactive-list-item empty">No analyzable fields yet. Add case attributes or derive a binary variable from coded evidence.</li>';
    return;
  }

  for (const summary of visibleSummaries) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    const frequencyText = summary.frequencies.length > 0
      ? summary.frequencies
        .slice(0, 4)
        .map((frequency) => `${escapeHtml(frequency.value)}: ${frequency.count} (${formatDecimal(frequency.proportion * 100, 1)}%)`)
        .join(' · ')
      : 'No non-missing values yet.';
    const numericText = summary.numeric
      ? `Mean ${formatDecimal(summary.numeric.mean)}, min ${formatDecimal(summary.numeric.min)}, max ${formatDecimal(summary.numeric.max)}`
      : '';

    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(summary.label)}</span>
          <span class="source-meta">${escapeHtml(summary.key)} · ${escapeHtml(summary.source)} · ${escapeHtml(summary.valueType)}</span>
          <span class="source-meta">Valid: ${summary.validCount} · Missing: ${summary.missingCount} · Distinct: ${summary.distinctCount}</span>
          <span class="source-meta">${frequencyText}</span>
          ${numericText ? `<span class="source-meta">${numericText}</span>` : ''}
        </div>
        <span class="badge">${escapeHtml(summary.valueType)}</span>
      </div>
    `;
    list.appendChild(li);
  }
}

function renderFrequencyTable() {
  const fieldEl = document.getElementById('frequency-field');
  const summaryEl = document.getElementById('frequency-summary');
  const resultEl = document.getElementById('frequency-table-result');
  if (!fieldEl || !summaryEl || !resultEl) return;

  {
    const summaries = state.selectedDescriptives?.report?.summaries?.filter((summary) => summary.source !== 'system') ?? [];
    fieldEl.innerHTML = summaries.map((summary) => `
      <option value="${escapeHtml(summary.key)}">${escapeHtml(summary.label)} (${escapeHtml(summary.valueType)})</option>
    `).join('');

    if (summaries.length === 0) {
      fieldEl.disabled = true;
      summaryEl.textContent = 'Choose a field to inspect its frequency table.';
      resultEl.innerHTML = '<p>No frequency table available yet.</p>';
      return;
    }

    if (!summaries.some((summary) => summary.key === state.selectedFrequencyField)) {
      state.selectedFrequencyField = summaries[0].key;
    }

    fieldEl.disabled = false;
    fieldEl.value = state.selectedFrequencyField;
    const selected = summaries.find((summary) => summary.key === state.selectedFrequencyField) ?? summaries[0];
    summaryEl.textContent = `Valid ${selected.validCount} | Missing ${selected.missingCount} | Distinct ${selected.distinctCount}`;

    if (selected.frequencies.length === 0) {
      resultEl.innerHTML = '<p>No non-missing values for this field.</p>';
      return;
    }

      let cumulative = 0;
      const frequencyChartItems = selected.frequencies.slice(0, 12).map((frequency) => ({
        label: frequency.value,
        value: frequency.count
      }));
      resultEl.innerHTML = buildOutputViewer({
      eyebrow: 'Frequency table',
      title: selected.label,
      summary: `Distribution for ${selected.label}.`,
      metrics: [
        { label: 'Valid', value: selected.validCount },
        { label: 'Missing', value: selected.missingCount },
        { label: 'Distinct', value: selected.distinctCount }
      ],
        sections: [
          buildOutputSection(
            'Observed values',
          buildOutputTable(
            ['Value', 'Count', 'Percent', 'Cumulative'],
            selected.frequencies.map((frequency) => {
              cumulative += frequency.proportion;
              return [
                escapeHtml(frequency.value),
                String(frequency.count),
                `${formatDecimal(frequency.proportion * 100, 1)}%`,
                `${formatDecimal(cumulative * 100, 1)}%`
              ];
              })
            )
          ),
          frequencyChartItems.length > 0
            ? buildOutputSection(
              'Distribution chart',
              `<div class="chart-grid">${buildChartCard('Top values', buildSvgBarChart(frequencyChartItems, { color: '#7ea7a1', formatter: (value) => String(Math.round(value)) }), 'Highest-frequency values for the selected field.')}</div>`
            )
            : '',
          buildChartSuggestionsSection([
            'Bar chart for the highest-frequency values',
            'Pareto-style cumulative chart',
            'Histogram when the selected field is numeric'
          ])
        ]
      });
    return;
  }

  const summaries = state.selectedDescriptives?.report?.summaries?.filter((summary) => summary.source !== 'system') ?? [];
  fieldEl.innerHTML = summaries.map((summary) => `
    <option value="${escapeHtml(summary.key)}">${escapeHtml(summary.label)} (${escapeHtml(summary.valueType)})</option>
  `).join('');

  if (summaries.length === 0) {
    fieldEl.disabled = true;
    summaryEl.textContent = 'Choose a field to inspect its frequency table.';
    resultEl.innerHTML = '<p>No frequency table available yet.</p>';
    return;
  }

  if (!summaries.some((summary) => summary.key === state.selectedFrequencyField)) {
    state.selectedFrequencyField = summaries[0].key;
  }

  fieldEl.disabled = false;
  fieldEl.value = state.selectedFrequencyField;
  const selected = summaries.find((summary) => summary.key === state.selectedFrequencyField) ?? summaries[0];
  summaryEl.textContent = `Valid ${selected.validCount} | Missing ${selected.missingCount} | Distinct ${selected.distinctCount}`;

  if (selected.frequencies.length === 0) {
    resultEl.innerHTML = '<p>No non-missing values for this field.</p>';
    return;
  }

  let cumulative = 0;
  resultEl.innerHTML = `
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Value</th>
            <th>Count</th>
            <th>Percent</th>
            <th>Cumulative</th>
          </tr>
        </thead>
        <tbody>
          ${selected.frequencies.map((frequency) => {
            cumulative += frequency.proportion;
            return `
              <tr>
                <td>${escapeHtml(frequency.value)}</td>
                <td>${frequency.count}</td>
                <td>${formatDecimal(frequency.proportion * 100, 1)}%</td>
                <td>${formatDecimal(cumulative * 100, 1)}%</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderGovernanceStatus() {
  const node = document.getElementById('governance-status-list');
  const deploymentNode = document.getElementById('deployment-issues-list');
  if (!node) return;
  node.innerHTML = '';
  setText('governance-ready', state.governanceStatus ? 'configured' : 'unavailable');
  if (!state.governanceStatus) {
    node.innerHTML = '<li class="interactive-list-item empty">Governance status is not available.</li>';
    setText('deployment-issue-count', '0');
    if (deploymentNode) {
      deploymentNode.innerHTML = '<li class="interactive-list-item empty">Deployment validation is not available.</li>';
    }
    return;
  }

  const items = [
    ['Audit trail', state.governanceStatus.auditTrailEnabled ? 'enabled' : 'disabled'],
    ['OIDC / SSO', state.governanceStatus.oidcEnabled ? 'configured' : 'waiting for MU config'],
    ['Idle session timeout', `${state.governanceStatus.sessionIdleTimeoutMinutes} minutes`],
    ['Login throttling', `${state.governanceStatus.loginThrottle.maxFailures} failures / ${state.governanceStatus.loginThrottle.windowMinutes} minutes`],
    ['Audit export limit', `${state.governanceStatus.auditExportMaxRows} rows`],
    ['Backup retention', `${state.governanceStatus.backupRetentionDays} days`],
    ['Export storage', state.governanceStatus.exportStorageEnabled ? 'enabled' : 'disabled'],
    ['Security headers', state.governanceStatus.securityHeadersEnabled ? 'enabled' : 'disabled'],
    ['Deployment readiness', state.governanceStatus.deploymentReady ? 'ready' : 'needs attention']
  ];

  for (const [label, value] of items) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(label)}</span>
        </div>
        <span class="badge">${escapeHtml(String(value))}</span>
      </div>
    `;
    node.appendChild(li);
  }

  if (state.governancePolicy) {
    document.getElementById('policy-idle-timeout').value = String(state.governancePolicy.idleTimeoutMinutes);
    document.getElementById('policy-login-window').value = String(state.governancePolicy.loginThrottleWindowMinutes);
    document.getElementById('policy-login-failures').value = String(state.governancePolicy.loginThrottleMaxFailures);
    document.getElementById('policy-audit-max-rows').value = String(state.governancePolicy.auditExportMaxRows);
    document.getElementById('policy-backup-retention').value = String(state.governancePolicy.backupRetentionDays);
  }
  const canManagePolicy = state.currentUser?.role === 'professor';
  ['policy-idle-timeout', 'policy-login-window', 'policy-login-failures', 'policy-audit-max-rows', 'policy-backup-retention']
    .forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.disabled = !canManagePolicy;
    });
  const saveButton = document.querySelector('#governance-policy-form button[type="submit"]');
  if (saveButton) saveButton.disabled = !canManagePolicy;
  setText('policy-save-result', canManagePolicy
    ? 'Professor accounts can update deployment policy here.'
    : 'Only Professor accounts can update governance policy settings.');

  if (deploymentNode) {
    deploymentNode.innerHTML = '';
    const issues = state.deploymentValidation?.issues ?? state.governanceStatus.deploymentIssues ?? [];
    setText('deployment-issue-count', `${issues.length}`);
    if (issues.length === 0) {
      deploymentNode.innerHTML = '<li class="interactive-list-item">No deployment issues detected.</li>';
    } else {
      for (const issue of issues) {
        const li = document.createElement('li');
        li.className = 'interactive-list-item';
        li.innerHTML = `
          <div class="source-row">
            <div>
              <span class="project-title">${escapeHtml(issue.key)}</span>
              <span class="source-meta">${escapeHtml(issue.message)}</span>
            </div>
            <span class="badge">${escapeHtml(issue.severity)}</span>
          </div>
        `;
        deploymentNode.appendChild(li);
      }
    }
  }
}

function renderAnalysisControls() {
  const filterFieldEl = document.getElementById('filter-field');
  const filterOperatorEl = document.getElementById('filter-operator');
  const filterValueEl = document.getElementById('filter-value');
  const recodeSourceFieldEl = document.getElementById('recode-source-field');
  const recodeOutputKeyEl = document.getElementById('recode-output-key');
  const recodeOutputLabelEl = document.getElementById('recode-output-label');
  const recodeRulesEl = document.getElementById('recode-rules');
  const weightFieldEl = document.getElementById('analysis-weight-field');
  const missingStrategyEl = document.getElementById('missing-strategy');
  const missingCodesEl = document.getElementById('missing-codes');
  const summaryEl = document.getElementById('analysis-summary');
  if (
    !filterFieldEl || !filterOperatorEl || !filterValueEl ||
    !recodeSourceFieldEl || !recodeOutputKeyEl || !recodeOutputLabelEl || !recodeRulesEl ||
    !weightFieldEl || !missingStrategyEl || !missingCodesEl ||
    !summaryEl
  ) {
    return;
  }

  const options = getDatasetAnalysisFieldOptions();
  filterFieldEl.innerHTML = options.map((option) => `
    <option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.valueType})</option>
  `).join('');
  recodeSourceFieldEl.innerHTML = options.map((option) => `
    <option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.valueType})</option>
  `).join('');
  weightFieldEl.innerHTML = [
    '<option value="">No weights</option>',
    ...options
      .filter((option) => option.valueType === 'number')
      .map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`)
  ].join('');

  const currentFilterField = state.selectedDatasetFilters[0]?.fieldKey ?? options[0]?.key ?? '';
  const currentFilterOperator = state.selectedDatasetFilters[0]?.operator ?? 'equals';
  const currentFilterValue = state.selectedDatasetFilters[0]?.value;
  const currentRecodeField = state.selectedDatasetRecodes[0]?.sourceFieldKey ?? options[0]?.key ?? '';
  const currentRecode = state.selectedDatasetRecodes[0] ?? null;
  filterFieldEl.value = currentFilterField;
  recodeSourceFieldEl.value = currentRecodeField;
  weightFieldEl.value = state.selectedAnalysisWeightField || '';
  filterFieldEl.disabled = options.length === 0;
  recodeSourceFieldEl.disabled = options.length === 0;
  weightFieldEl.disabled = options.filter((option) => option.valueType === 'number').length === 0;
  filterOperatorEl.value = currentFilterOperator;
  filterValueEl.value = currentFilterValue === undefined || currentFilterValue === null ? '' : String(currentFilterValue);
  filterValueEl.disabled = currentFilterOperator === 'is_missing' || currentFilterOperator === 'not_missing';
  missingStrategyEl.value = state.selectedMissingStrategy || 'available';
  missingCodesEl.value = state.selectedMissingCodes || '';
  recodeOutputKeyEl.value = currentRecode?.outputFieldKey ?? '';
  recodeOutputLabelEl.value = currentRecode?.outputLabel ?? '';
  recodeRulesEl.value = currentRecode
    ? [
      ...currentRecode.rules.map((rule) => `${rule.from}=${formatAttributeValue(rule.to)}`),
      currentRecode.defaultValue !== undefined && currentRecode.defaultValue !== null
        ? `*=${formatAttributeValue(currentRecode.defaultValue)}`
        : null
    ].filter(Boolean).join('\n')
    : '';

  const filterSummary = state.selectedDatasetFilters.length > 0
    ? state.selectedDatasetFilters
      .map((filter) => `${filter.fieldKey} ${filter.operator}${filter.value !== null && filter.value !== undefined ? ` ${formatAttributeValue(filter.value)}` : ''}`)
      .join(' | ')
    : 'none';
  const recodeSummary = state.selectedDatasetRecodes.length > 0
    ? state.selectedDatasetRecodes
      .map((recode) => `${recode.sourceFieldKey} -> ${recode.outputFieldKey ?? normalizeAnalysisFieldKey(recode.outputLabel)}`)
      .join(' | ')
    : 'none';
  const weightSummary = state.selectedAnalysisWeightField || 'none';
  const missingCodes = parseMissingCodesInput(state.selectedMissingCodes);
  summaryEl.textContent = `Filters: ${filterSummary}. Recodes: ${recodeSummary}. Weight: ${weightSummary}. Missing: ${state.selectedMissingStrategy}${missingCodes.length > 0 ? ` (${missingCodes.join(', ')})` : ''}.`;
}

function renderCrosstab() {
  const rowFieldEl = document.getElementById('crosstab-row-field');
  const columnFieldEl = document.getElementById('crosstab-column-field');
  const resultEl = document.getElementById('crosstab-result');
  const runBtn = document.getElementById('run-crosstab-btn');
  if (!rowFieldEl || !columnFieldEl || !resultEl || !runBtn) return;

  {
    const options = getCrosstabFieldOptions();
    ensureCrosstabSelection();

    rowFieldEl.innerHTML = options.map((option) => `
      <option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.validCount} valid)</option>
    `).join('');
    columnFieldEl.innerHTML = options.map((option) => `
      <option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.validCount} valid)</option>
    `).join('');

    rowFieldEl.value = state.selectedCrosstabRowField ?? '';
    columnFieldEl.value = state.selectedCrosstabColumnField ?? '';
    rowFieldEl.disabled = options.length < 2;
    columnFieldEl.disabled = options.length < 2;
    runBtn.disabled = options.length < 2;

    if (options.length < 2) {
      resultEl.innerHTML = '<p>Add at least two analyzable fields before running a crosstab.</p>';
      return;
    }

    if (state.selectedCrosstabError) {
      resultEl.innerHTML = `<p>${escapeHtml(state.selectedCrosstabError)}</p>`;
      return;
    }

    if (!state.selectedCrosstab) {
      resultEl.innerHTML = '<p>Select two fields to build a crosstab.</p>';
      return;
    }

      const table = state.selectedCrosstab;
      const cellLookup = new Map(table.cells.map((cell) => [`${cell.rowValue}::${cell.columnValue}`, cell]));
      const heatmapItems = table.cells.map((cell) => ({
        label: `${cell.rowValue} / ${cell.columnValue}`,
        value: cell.count
      })).sort((left, right) => right.value - left.value).slice(0, 10);
      resultEl.innerHTML = buildOutputViewer({
        eyebrow: 'Cross-tabulation',
        title: `${table.rowLabel} by ${table.columnLabel}`,
      summary: table.chiSquare
        ? `Chi-square ${formatStatValue(table.chiSquare.statistic, 3)} with p ${formatStatValue(table.chiSquare.pValue, 4)}.`
        : 'Chi-square is not available for this table yet.',
      metrics: [
        { label: 'Valid pairs', value: table.validCaseCount },
        { label: 'Missing pairs', value: table.missingCaseCount },
        { label: 'df', value: table.chiSquare?.degreesOfFreedom ?? 'n/a' },
        { label: "Cramer's V", value: formatStatValue(table.chiSquare?.cramersV, 4) }
      ],
      sections: [
          buildOutputSection(
            'Cell counts and percentages',
            buildOutputTable(
            [
              `${escapeHtml(table.rowLabel)} \\ ${escapeHtml(table.columnLabel)}`,
              ...table.columnCategories.map((column) => `${escapeHtml(column.value)}<br><span class="small-muted">${column.count}</span>`),
              'Total'
            ],
            [
              ...table.rowCategories.map((row) => [
                escapeHtml(row.value),
                ...table.columnCategories.map((column) => {
                  const cell = cellLookup.get(`${row.value}::${column.value}`) ?? {
                    count: 0,
                    totalProportion: 0,
                    rowProportion: 0,
                    columnProportion: 0
                  };
                  return `<strong>${cell.count}</strong><br><span class="small-muted">Total ${formatDecimal(cell.totalProportion * 100, 1)}%</span><br><span class="small-muted">Row ${formatDecimal(cell.rowProportion * 100, 1)}%</span><br><span class="small-muted">Column ${formatDecimal(cell.columnProportion * 100, 1)}%</span>`;
                }),
                `<strong>${row.count}</strong><br><span class="small-muted">${formatDecimal(row.proportion * 100, 1)}%</span>`
              ]),
              [
                '<strong>Total</strong>',
                ...table.columnCategories.map((column) => `<strong>${column.count}</strong><br><span class="small-muted">${formatDecimal(column.proportion * 100, 1)}%</span>`),
                `<strong>${table.validCaseCount}</strong><br><span class="small-muted">100.0%</span>`
                ]
              ]
            )
          ),
          heatmapItems.length > 0
            ? buildOutputSection(
              'Cell intensity',
              `<div class="chart-grid">${buildChartCard('Largest cells', buildSvgBarChart(heatmapItems, { color: '#cfbc9a', formatter: (value) => String(Math.round(value)) }), 'Largest contingency cells by weighted count.')}</div>`
            )
            : '',
          buildChartSuggestionsSection([
            'Clustered bar chart comparing row categories',
            'Heatmap for crosstab cell intensity',
            '100% stacked bar chart for row percentages'
          ])
        ]
      });
    return;
  }

  const options = getCrosstabFieldOptions();
  ensureCrosstabSelection();

  rowFieldEl.innerHTML = options.map((option) => `
    <option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.validCount} valid)</option>
  `).join('');
  columnFieldEl.innerHTML = options.map((option) => `
    <option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.validCount} valid)</option>
  `).join('');

  rowFieldEl.value = state.selectedCrosstabRowField ?? '';
  columnFieldEl.value = state.selectedCrosstabColumnField ?? '';
  rowFieldEl.disabled = options.length < 2;
  columnFieldEl.disabled = options.length < 2;
  runBtn.disabled = options.length < 2;

  if (options.length < 2) {
    resultEl.innerHTML = '<p>Add at least two analyzable fields before running a crosstab.</p>';
    return;
  }

  if (state.selectedCrosstabError) {
    resultEl.innerHTML = `<p>${escapeHtml(state.selectedCrosstabError)}</p>`;
    return;
  }

  if (!state.selectedCrosstab) {
    resultEl.innerHTML = '<p>Select two fields to build a crosstab.</p>';
    return;
  }

  const table = state.selectedCrosstab;
  const cellLookup = new Map(table.cells.map((cell) => [`${cell.rowValue}::${cell.columnValue}`, cell]));
  const chiSquareSummary = table.chiSquare
    ? `<p>
      Chi-square: <strong>${formatDecimal(table.chiSquare.statistic, 3)}</strong>
      · df: <strong>${table.chiSquare.degreesOfFreedom}</strong>
      · p: <strong>${table.chiSquare.pValue === null ? 'n/a' : formatDecimal(table.chiSquare.pValue, 4)}</strong>
      · Cramer's V: <strong>${table.chiSquare.cramersV === null ? 'n/a' : formatDecimal(table.chiSquare.cramersV, 4)}</strong>
    </p>`
    : '<p>Chi-square is not available for this table yet.</p>';

  resultEl.innerHTML = `
    <p>
      Valid pairs: <strong>${table.validCaseCount}</strong> of <strong>${table.caseCount}</strong>
      · Missing pairs: <strong>${table.missingCaseCount}</strong>
    </p>
    ${chiSquareSummary}
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>${escapeHtml(table.rowLabel)} \\ ${escapeHtml(table.columnLabel)}</th>
            ${table.columnCategories.map((column) => `<th>${escapeHtml(column.value)}<br><span class="small-muted">${column.count}</span></th>`).join('')}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${table.rowCategories.map((row) => `
            <tr>
              <td>${escapeHtml(row.value)}</td>
              ${table.columnCategories.map((column) => {
                const cell = cellLookup.get(`${row.value}::${column.value}`) ?? {
                  count: 0,
                  totalProportion: 0,
                  rowProportion: 0,
                  columnProportion: 0
                };
                return `<td>
                  <strong>${cell.count}</strong><br>
                  <span class="small-muted">Total ${formatDecimal(cell.totalProportion * 100, 1)}%</span><br>
                  <span class="small-muted">Row ${formatDecimal(cell.rowProportion * 100, 1)}%</span><br>
                  <span class="small-muted">Column ${formatDecimal(cell.columnProportion * 100, 1)}%</span>
                </td>`;
              }).join('')}
              <td><strong>${row.count}</strong><br><span class="small-muted">${formatDecimal(row.proportion * 100, 1)}%</span></td>
            </tr>
          `).join('')}
          <tr>
            <td><strong>Total</strong></td>
            ${table.columnCategories.map((column) => `<td><strong>${column.count}</strong><br><span class="small-muted">${formatDecimal(column.proportion * 100, 1)}%</span></td>`).join('')}
            <td><strong>${table.validCaseCount}</strong><br><span class="small-muted">100.0%</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  return;

  resultEl.innerHTML = `
    <p>
      Valid pairs: <strong>${table.validCaseCount}</strong> of <strong>${table.caseCount}</strong>
      · Missing pairs: <strong>${table.missingCaseCount}</strong>
    </p>
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>${escapeHtml(table.rowLabel)} \\ ${escapeHtml(table.columnLabel)}</th>
            ${table.columnCategories.map((column) => `<th>${escapeHtml(column.value)}<br><span class="small-muted">${column.count}</span></th>`).join('')}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${table.rowCategories.map((row) => `
            <tr>
              <td>${escapeHtml(row.value)}</td>
              ${table.columnCategories.map((column) => {
                const cell = cellLookup.get(`${row.value}::${column.value}`) ?? { count: 0, totalProportion: 0 };
                return `<td><strong>${cell.count}</strong><br><span class="small-muted">${formatDecimal(cell.totalProportion * 100, 1)}%</span></td>`;
              }).join('')}
              <td><strong>${row.count}</strong><br><span class="small-muted">${formatDecimal(row.proportion * 100, 1)}%</span></td>
            </tr>
          `).join('')}
          <tr>
            <td><strong>Total</strong></td>
            ${table.columnCategories.map((column) => `<td><strong>${column.count}</strong><br><span class="small-muted">${formatDecimal(column.proportion * 100, 1)}%</span></td>`).join('')}
            <td><strong>${table.validCaseCount}</strong><br><span class="small-muted">100.0%</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderCustomTable() {
  const rowFieldsEl = document.getElementById('custom-table-row-fields');
  const columnFieldEl = document.getElementById('custom-table-column-field');
  const measureFieldsEl = document.getElementById('custom-table-measure-fields');
  const runBtn = document.getElementById('run-custom-table-btn');
  const resultEl = document.getElementById('custom-table-result');
  if (!rowFieldsEl || !columnFieldEl || !measureFieldsEl || !runBtn || !resultEl) return;

  const options = getDatasetAnalysisFieldOptions();
  const numericOptions = options.filter((option) => option.valueType === 'number');
  const previousRows = getSelectedValues(rowFieldsEl);
  const previousColumn = columnFieldEl.value;
  const previousMeasures = getSelectedValues(measureFieldsEl);
  rowFieldsEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.valueType})</option>`).join('');
  columnFieldEl.innerHTML = [
    '<option value="">No column grouping</option>',
    ...options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.valueType})</option>`)
  ].join('');
  measureFieldsEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');

  for (const option of rowFieldsEl.options) {
    option.selected = previousRows.includes(option.value);
  }
  if (getSelectedValues(rowFieldsEl).length === 0 && options.length > 0) {
    rowFieldsEl.options[0].selected = true;
  }
  columnFieldEl.value = options.some((option) => option.key === previousColumn) ? previousColumn : '';
  for (const option of measureFieldsEl.options) {
    option.selected = previousMeasures.includes(option.value);
  }
  if (getSelectedValues(measureFieldsEl).length === 0 && numericOptions.length > 0) {
    measureFieldsEl.options[0].selected = true;
  }
  runBtn.disabled = options.length === 0;

  if (!state.customTableResult) {
    resultEl.innerHTML = '<p>Choose row fields, an optional column field, and optional numeric measures.</p>';
    return;
  }

  const result = state.customTableResult;
  const cellLookup = new Map(result.cells.map((cell) => [`${JSON.stringify(cell.rowValues)}::${cell.columnValue ?? '(total)'}`, cell]));
  const tableBody = result.columnCategories.length > 0
    ? buildOutputTable(
      [
        result.rowLabels.map(escapeHtml).join(' / '),
        ...result.columnCategories.map((column) => escapeHtml(column.value)),
        'Total'
      ],
      result.rowCategories.map((row) => [
        row.values.map(escapeHtml).join(' / '),
        ...result.columnCategories.map((column) => {
          const cell = cellLookup.get(`${JSON.stringify(row.values)}::${column.value}`);
          return cell ? `<strong>${formatStatValue(cell.count, 3)}</strong><br><span class="small-muted">${formatDecimal(cell.rowProportion * 100, 1)}% row</span>` : '0';
        }),
        `<strong>${formatStatValue(row.count, 3)}</strong><br><span class="small-muted">${formatDecimal(row.proportion * 100, 1)}%</span>`
      ])
    )
    : buildOutputTable(
      [result.rowLabels.map(escapeHtml).join(' / '), 'Count', 'Percent'],
      result.rowCategories.map((row) => [
        row.values.map(escapeHtml).join(' / '),
        formatStatValue(row.count, 3),
        `${formatDecimal(row.proportion * 100, 1)}%`
      ])
    );
  const measureRows = result.cells.flatMap((cell) =>
    cell.measures.map((measure) => [
      cell.rowValues.map(escapeHtml).join(' / '),
      escapeHtml(cell.columnValue ?? 'Total'),
      escapeHtml(measure.label),
      escapeHtml(measure.operation),
      formatStatValue(measure.value, 4),
      String(measure.validCount)
    ])
  );

  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Custom table',
    title: `${result.rowLabels.join(' / ')}${result.columnLabel ? ` by ${result.columnLabel}` : ''}`,
    summary: `${result.validCaseCount} valid case row(s), ${result.missingCaseCount} missing row(s).`,
    metrics: [
      { label: 'Rows', value: result.rowCategories.length },
      { label: 'Columns', value: result.columnCategories.length || 'none' },
      { label: 'Cells', value: result.cells.length },
      { label: 'Weighted total', value: result.weightedValidCaseCount ? formatDecimal(result.weightedValidCaseCount, 3) : 'n/a' }
    ],
    sections: [
      buildOutputSection('Table counts', tableBody),
      measureRows.length > 0
        ? buildOutputSection('Numeric measures', buildOutputTable(['Row', 'Column', 'Measure', 'Statistic', 'Value', 'Valid N'], measureRows))
        : '',
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function renderExactTest() {
  const rowFieldEl = document.getElementById('exact-row-field');
  const columnFieldEl = document.getElementById('exact-column-field');
  const runBtn = document.getElementById('run-exact-test-btn');
  const resultEl = document.getElementById('exact-test-result');
  if (!rowFieldEl || !columnFieldEl || !runBtn || !resultEl) return;

  const options = getCrosstabFieldOptions();
  const previousRow = rowFieldEl.value || state.selectedCrosstabRowField;
  const previousColumn = columnFieldEl.value || state.selectedCrosstabColumnField;
  rowFieldEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.validCount} valid)</option>`).join('');
  columnFieldEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.validCount} valid)</option>`).join('');
  rowFieldEl.value = options.some((option) => option.key === previousRow) ? previousRow : options[0]?.key ?? '';
  columnFieldEl.value = options.some((option) => option.key === previousColumn && option.key !== rowFieldEl.value)
    ? previousColumn
    : options.find((option) => option.key !== rowFieldEl.value)?.key ?? '';
  runBtn.disabled = options.length < 2;

  if (!state.exactTestResult) {
    resultEl.innerHTML = '<p>Choose two categorical fields. Fisher exact is produced for 2x2 integer-like tables.</p>';
    return;
  }

  const result = state.exactTestResult;
  const cellLookup = new Map(result.table.cells.map((cell) => [`${cell.rowValue}::${cell.columnValue}`, cell.count]));
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Exact test',
    title: `${result.rowLabel} by ${result.columnLabel}`,
    summary: result.method === 'fisher_exact_2x2'
      ? `Fisher two-sided p ${formatStatValue(result.fisherExact?.pValueTwoSided, 4)}.`
      : 'Exact output unavailable for this table shape; chi-square output is shown.',
    metrics: [
      { label: 'Method', value: result.method === 'fisher_exact_2x2' ? 'Fisher 2x2' : 'Chi-square only' },
      { label: 'Valid pairs', value: result.validCaseCount },
      { label: 'Fisher p', value: formatStatValue(result.fisherExact?.pValueTwoSided, 4) },
      { label: 'Odds ratio', value: formatStatValue(result.fisherExact?.oddsRatio, 4) }
    ],
    sections: [
      buildOutputSection(
        'Contingency table',
        buildOutputTable(
          [`${escapeHtml(result.rowLabel)} \\ ${escapeHtml(result.columnLabel)}`, ...result.table.columnValues.map(escapeHtml)],
          result.table.rowValues.map((rowValue) => [
            escapeHtml(rowValue),
            ...result.table.columnValues.map((columnValue) => formatStatValue(cellLookup.get(`${rowValue}::${columnValue}`) ?? 0, 3))
          ])
        )
      ),
      result.fisherExact
        ? buildOutputSection(
          'Fisher exact',
          buildOutputTable(
            ['Two-sided p', 'Left p', 'Right p', 'Odds ratio'],
            [[
              formatStatValue(result.fisherExact.pValueTwoSided, 5),
              formatStatValue(result.fisherExact.pValueLeft, 5),
              formatStatValue(result.fisherExact.pValueRight, 5),
              formatStatValue(result.fisherExact.oddsRatio, 5)
            ]]
          )
        )
        : '',
      result.chiSquare
        ? buildOutputSection(
          'Chi-square fallback',
          buildOutputTable(
            ['Statistic', 'df', 'p', "Cramer's V"],
            [[
              formatStatValue(result.chiSquare.statistic, 4),
              String(result.chiSquare.degreesOfFreedom),
              formatStatValue(result.chiSquare.pValue, 4),
              formatStatValue(result.chiSquare.cramersV, 4)
            ]]
          )
        )
        : '',
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function renderBootstrap() {
  const procedureEl = document.getElementById('bootstrap-procedure');
  const fieldsEl = document.getElementById('bootstrap-target-fields');
  const iterationsEl = document.getElementById('bootstrap-iterations');
  const confidenceEl = document.getElementById('bootstrap-confidence');
  const runBtn = document.getElementById('run-bootstrap-btn');
  const resultEl = document.getElementById('bootstrap-result');
  if (!procedureEl || !fieldsEl || !iterationsEl || !confidenceEl || !runBtn || !resultEl) return;

  const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
  const previousSelections = getSelectedValues(fieldsEl);
  fieldsEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  for (const option of fieldsEl.options) {
    option.selected = previousSelections.includes(option.value);
  }
  const requiredCount = procedureEl.value === 'correlation' ? 2 : 1;
  if (getSelectedValues(fieldsEl).length < requiredCount) {
    [...fieldsEl.options].slice(0, requiredCount).forEach((option) => {
      option.selected = true;
    });
  }
  runBtn.disabled = numericOptions.length < requiredCount;

  if (!state.bootstrapResult) {
    resultEl.innerHTML = '<p>Choose mean or correlation, select numeric target field(s), then run bootstrap.</p>';
    return;
  }

  const result = state.bootstrapResult;
  const estimateItems = (result.estimates ?? []).slice(0, 40).map((value, index) => ({ label: String(index + 1), value }));
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Bootstrap',
    title: `${result.procedure} bootstrap`,
    summary: `Observed ${formatStatValue(result.observed, 5)} with ${formatStatValue(result.confidenceInterval?.level ? result.confidenceInterval.level * 100 : null, 1)}% CI ${formatConfidenceInterval(result.confidenceInterval, 5)}.`,
    metrics: [
      { label: 'Rows', value: result.caseCount },
      { label: 'Iterations used', value: result.iterationsUsed },
      { label: 'Observed', value: formatStatValue(result.observed, 5) },
      { label: 'SE', value: formatStatValue(result.standardError, 5) }
    ],
    sections: [
      buildOutputSection(
        'Bootstrap interval',
        buildOutputTable(
          ['Procedure', 'Target fields', 'Observed', 'SE', 'CI'],
          [[
            escapeHtml(result.procedure),
            escapeHtml(result.targetFields.join(', ')),
            formatStatValue(result.observed, 5),
            formatStatValue(result.standardError, 5),
            formatConfidenceInterval(result.confidenceInterval, 5)
          ]]
        )
      ),
      estimateItems.length > 0
        ? buildOutputSection('Estimate trace sample', `<div class="chart-grid">${buildChartCard('First bootstrap estimates', buildSvgLineChart(estimateItems, { color: '#8fb3ff' }), 'First stored bootstrap estimates from the reproducible run.')}</div>`)
        : '',
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function parseImputationConstant(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (text.toLowerCase() === 'true') return true;
  if (text.toLowerCase() === 'false') return false;
  const numeric = Number(text);
  return Number.isFinite(numeric) && text !== '' ? numeric : text;
}

function renderMissingValues() {
  const fieldEl = document.getElementById('imputation-field');
  const methodEl = document.getElementById('imputation-method');
  const resultEl = document.getElementById('missing-values-result');
  if (!fieldEl || !methodEl || !resultEl) return;
  const options = getDatasetAnalysisFieldOptions();
  const previousField = fieldEl.value;
  fieldEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.valueType})</option>`).join('');
  fieldEl.value = options.some((option) => option.key === previousField) ? previousField : options[0]?.key ?? '';
  fieldEl.disabled = options.length === 0;
  const runMissingBtn = document.getElementById('run-missing-values-btn');
  const runImputeBtn = document.getElementById('run-imputation-plan-btn');
  if (runMissingBtn) runMissingBtn.disabled = options.length === 0;
  if (runImputeBtn) runImputeBtn.disabled = options.length === 0;

  if (!state.missingValuesResult && !state.imputationPlanResult) {
    resultEl.innerHTML = '<p>Run missing-values analysis to review missingness and imputation recommendations.</p>';
    return;
  }

  const sections = [];
  const metrics = [];
  if (state.missingValuesResult) {
    const result = state.missingValuesResult;
    metrics.push(
      { label: 'Cases', value: result.caseCount },
      { label: 'Fields', value: result.fieldCount },
      { label: 'Missing cells', value: result.totalMissingValues },
      { label: 'Missing %', value: `${formatDecimal(result.missingCellsPercent * 100, 1)}%` }
    );
    sections.push(
      buildOutputSection(
        'Field missingness',
        buildOutputTable(
          ['Field', 'Type', 'Valid', 'Missing', 'Missing %', 'Recommended imputation'],
          result.fields.map((field) => [
            escapeHtml(field.label),
            escapeHtml(field.valueType),
            String(field.validCount),
            String(field.missingCount),
            `${formatDecimal(field.missingPercent * 100, 1)}%`,
            escapeHtml(String(field.recommendedImputation ?? 'n/a'))
          ])
        )
      ),
      buildOutputSection(
        'Row missingness patterns',
        buildOutputTable(
          ['Missing field count', 'Cases', 'Percent'],
          result.rowPatterns.map((pattern) => [
            String(pattern.missingFieldCount),
            String(pattern.caseCount),
            `${formatDecimal(pattern.proportion * 100, 1)}%`
          ])
        )
      )
    );
    if (result.notes?.length) sections.push(buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))));
  }
  if (state.imputationPlanResult) {
    const plan = state.imputationPlanResult;
    sections.push(
      buildOutputSection(
        'Imputation preview',
        buildOutputTable(
          ['Field', 'Method', 'Value', 'Replacements'],
          plan.strategies.map((strategy) => [
            escapeHtml(strategy.label),
            escapeHtml(strategy.method),
            escapeHtml(String(strategy.value ?? 'null')),
            String(strategy.replacements)
          ])
        )
      )
    );
    if (plan.notes?.length) sections.push(buildOutputSection('Imputation notes', buildOutputList(plan.notes.map(escapeHtml))));
  }

  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Missing values',
    title: 'Missing-data diagnostics',
    summary: 'Field-level missingness, row patterns, and simple imputation preview output.',
    metrics,
    sections
  });
}

function renderSummary() {
  if (!state.selectedSummary) {
    setText('shell-project-name', 'No project selected');
    setText('shell-project-description', 'Create a project or select one to unlock the workspace.');
    setText('shell-project-mode', 'No workspace');
    setText('shell-source-count', '0');
    setText('shell-code-count', '0');
    setText('shell-case-count', '0');
    setText('shell-variable-count', '0');
    setText('project-selection-status', 'None');
    setText('qual-library-source-count', '0');
    setText('qual-library-code-count', '0');
    setHtml('project-hub-card', '<p>Select a project.</p>');
    setHtml('project-card', '<p>Select a project.</p>');
    setHtml('qual-card', '<p>Select a project.</p>');
    setHtml('quant-card', '<p>Select a project.</p>');
    renderDescriptives();
    setText('dataset-output', 'No project selected.');
    document.getElementById('trace-list').innerHTML = '<li>No project selected.</li>';
    renderProjectActions();
    return;
  }

  const s = state.selectedSummary;
  const report = state.selectedDescriptives?.report ?? { caseCount: 0, fieldCount: 0, summaries: [] };
  const dataset = state.selectedDescriptives?.dataset ?? { rows: [], notes: [] };

  setText('shell-project-name', s.project.name);
  setText('shell-project-description', s.project.description || 'Mixed-methods workspace ready.');
  setText('shell-project-mode', `Mode: ${s.project.workspaceMode ?? 'solo'}`);
  setText('shell-source-count', `${s.counts.projectSources}`);
  setText('shell-code-count', `${s.counts.projectCodes}`);
  setText('shell-case-count', `${s.counts.projectCases}`);
  setText('shell-variable-count', `${s.counts.projectVariables}`);
  setText('project-selection-status', s.project.name);
  setText('qual-library-source-count', `${s.counts.projectSources}`);
  setText('qual-library-code-count', `${s.counts.projectCodes}`);

  setHtml('project-card', `
    <p><strong>${escapeHtml(s.project.name)}</strong></p>
    <p>Workspace mode: <strong>${escapeHtml(s.project.workspaceMode ?? 'solo')}</strong></p>
    <p>${escapeHtml(s.project.description || 'No description')}</p>
    <p>ID: <strong>${escapeHtml(s.project.id)}</strong></p>
    <p>Total projects: <strong>${s.counts.projects}</strong></p>
  `);

  setHtml('project-hub-card', `
    <p><strong>${escapeHtml(s.project.name)}</strong></p>
    <p>Mode: <strong>${escapeHtml(s.project.workspaceMode ?? 'solo')}</strong></p>
    <p>Members: <strong>${state.selectedMembers.length}</strong></p>
    <p>Active users: <strong>${state.selectedPresence.length}</strong></p>
    <p>Recent chat messages: <strong>${state.selectedMessages.length}</strong></p>
  `);
  renderProjectActions();

  setHtml('qual-card', `
    <p>Latest source: <strong>${escapeHtml(s.source?.title ?? 'None yet')}</strong></p>
    <p>Source preview: <strong>${escapeHtml(summarizeText(s.source?.contentText ?? '', 80))}</strong></p>
    <p>Latest code: <strong>${escapeHtml(s.code?.name ?? 'None yet')}</strong></p>
    <p>Sources: <strong>${s.counts.projectSources}</strong></p>
    <p>Codes: <strong>${s.counts.projectCodes}</strong></p>
    <p>Memos: <strong>${state.selectedMemos.length}</strong></p>
    <p>Segments: <strong>${s.counts.projectSegments}</strong></p>
    <p>Code applications: <strong>${s.counts.projectCodeApplications}</strong></p>
  `);

  setHtml('quant-card', `
    <p>Latest variable: <strong>${escapeHtml(s.variable?.name ?? 'None yet')}</strong></p>
    <p>Kind: <strong>${escapeHtml(s.variable?.kind ?? 'n/a')}</strong></p>
    <p>Variables: <strong>${s.counts.projectVariables}</strong></p>
    <p>Cases: <strong>${s.counts.projectCases}</strong></p>
    <p>Attributes: <strong>${state.selectedAttributes.length}</strong></p>
    <p>Trace links: <strong>${s.counts.traceLinks}</strong></p>
    <p>Descriptive fields: <strong>${report.fieldCount}</strong></p>
  `);

  setText('dataset-output', JSON.stringify({
    projectId: s.project.id,
    dataset,
    report
  }, null, 2));

  document.getElementById('trace-list').innerHTML = [
    `DB host: ${escapeHtml(s.db?.host ?? '—')}`,
    `User: ${escapeHtml(state.currentUser?.username ?? '—')}`,
    `Role: ${escapeHtml(roleLabel(state.currentUser?.role))}`,
    `Project: ${escapeHtml(s.project.id)}`,
    `Workspace mode: ${escapeHtml(s.project.workspaceMode ?? 'solo')}`,
    `Members: ${state.selectedMembers.length}`,
    `Active users: ${state.selectedPresence.length}`,
    `Sources: ${state.selectedSources.length}`,
    `Codes: ${state.selectedCodes.length}`,
    `Memos: ${state.selectedMemos.length}`,
    `Annotations: ${state.selectedAnnotations.length}`,
    `Segments: ${state.selectedSegments.length}`,
    `Code applications: ${state.selectedCodeApplications.length}`,
    `Variables: ${state.selectedVariables.length}`,
    `Cases: ${state.selectedCases.length}`,
    `Attributes: ${state.selectedAttributes.length}`,
    `Trace links: ${state.selectedTraceLinks.length}`,
    `Descriptive fields: ${report.fieldCount}`,
    `Dataset rows: ${dataset.rows.length}`,
    `Collaborative polling: every ${POLL_INTERVAL_MS / 1000}s`
  ].map((item) => `<li>${item}</li>`).join('');
}

function formatImportResult(item) {
  if (item.importedAs === 'error') {
    return `Could not import ${item.filename}: ${item.message}`;
  }
  if (item.importedAs === 'source') {
    const sourceKind = item.sourceKind ? `${item.sourceKind} ` : '';
    const segmentSummary = item.segmentsCreated ? ` Created ${item.segmentsCreated} page segment${item.segmentsCreated === 1 ? '' : 's'} for coding.` : '';
    return `Imported ${sourceKind}source "${item.title}" (${item.filename}).${segmentSummary}`;
  }
  const sheetSummary = item.sheetName ? ` Sheet: ${item.sheetName}.` : '';
  return `Imported ${item.filename}: ${item.casesCreated} cases and ${item.attributesCreated} attributes using "${item.caseLabelField}" as the case label field.${sheetSummary}`;
}

async function importFiles(files) {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }

  const resultEl = document.getElementById('import-result');
  if (resultEl) resultEl.textContent = `Importing ${files.length} file(s)…`;

  try {
    const formData = new FormData();
    formData.append('projectId', state.selectedProjectId);
    for (const file of files) {
      formData.append('file', file, file.name);
    }

    const env = await postForm(`${API_BASE}/imports/files`, formData);
    await loadSelectedProjectData();
    renderAll();
    if (resultEl) {
      const summary = `${env.data.importedCount ?? env.data.items?.length ?? 0} imported, ${env.data.errorCount ?? env.data.errors?.length ?? 0} failed.`;
      resultEl.innerHTML = [
        `<div><strong>${escapeHtml(summary)}</strong></div>`,
        ...((env.data.items ?? []).map((item) => `<div>${escapeHtml(formatImportResult(item))}</div>`)),
        ...((env.data.errors ?? []).map((item) => `<div>${escapeHtml(formatImportResult(item))}</div>`))
      ].join('') || 'Import finished.';
    }
  } catch (err) {
    if (resultEl) resultEl.textContent = `Import failed: ${err.message}`;
  }
}

async function loadRecentOfficeArtifacts() {
  if (!state.selectedProjectId || !state.currentUser) {
    state.recentOfficeArtifacts = [];
    return;
  }
  if (!getProjectPermissionState().canExportProject) {
    state.recentOfficeArtifacts = [];
    return;
  }
  try {
    const env = await getJson(`${API_BASE}/integrations/office/recent?projectId=${encodeURIComponent(state.selectedProjectId)}`);
    state.recentOfficeArtifacts = env.data?.items ?? [];
  } catch {
    state.recentOfficeArtifacts = [];
  }
}

function getRecentOfficeArtifact(app) {
  const extension = app === 'word' ? 'docx' : 'xlsx';
  return state.recentOfficeArtifacts.find((item) => item.extension === extension) ?? null;
}

function getSelectedSqlImportColumns() {
  return [...document.querySelectorAll('.sql-import-column-checkbox:checked')]
    .map((node) => node.value)
    .filter(Boolean);
}

function getSelectedSqlVariableColumns() {
  const select = document.getElementById('sql-variable-columns');
  return [...(select?.selectedOptions ?? [])].map((option) => {
    const table = state.externalSqlTables.find((item) => `${item.schema}.${item.table}` === state.selectedSqlTableKey) ?? null;
    const column = table?.columns?.find((item) => item.name === option.value) ?? null;
    return {
      column: option.value,
      kind: column?.inferredVariableKind ?? 'categorical'
    };
  }).filter((item) => item.column);
}

function renderOfficeLaunchStatus() {
  const statusEl = document.getElementById('office-launch-status');
  const wordBtn = document.getElementById('open-recent-word-btn');
  const excelBtn = document.getElementById('open-recent-excel-btn');
  const canExport = Boolean(state.selectedProjectId && getProjectPermissionState().canExportProject);
  const office = state.integrationStatus?.office ?? null;
  const recentWord = getRecentOfficeArtifact('word');
  const recentExcel = getRecentOfficeArtifact('excel');

  if (wordBtn) {
    wordBtn.disabled = !(canExport && office?.wordLaunchAvailable && recentWord);
    wordBtn.title = !state.selectedProjectId
      ? 'Select a project first.'
      : !getProjectPermissionState().canExportProject
        ? 'Only project owners and Professor accounts can open exported files.'
        : !office?.wordLaunchAvailable
          ? 'Microsoft Word was not found on this device.'
          : recentWord
            ? `Open ${recentWord.filename}`
            : 'Export a Word file first.';
  }
  if (excelBtn) {
    excelBtn.disabled = !(canExport && office?.excelLaunchAvailable && recentExcel);
    excelBtn.title = !state.selectedProjectId
      ? 'Select a project first.'
      : !getProjectPermissionState().canExportProject
        ? 'Only project owners and Professor accounts can open exported files.'
        : !office?.excelLaunchAvailable
          ? 'Microsoft Excel was not found on this device.'
          : recentExcel
            ? `Open ${recentExcel.filename}`
            : 'Export an Excel file first.';
  }
  if (!statusEl) return;

  const sqlText = state.integrationStatus?.sql?.activeMode === 'embedded-portable'
    ? 'Embedded SQL is active.'
    : state.integrationStatus?.sql?.localPostgresConfigured
      ? 'Postgres runtime is configured.'
      : 'SQL runtime is not configured.';
  const officeText = [
    office?.wordLaunchAvailable ? `Word ready${recentWord ? ` (${recentWord.filename})` : ''}` : 'Word not found',
    office?.excelLaunchAvailable ? `Excel ready${recentExcel ? ` (${recentExcel.filename})` : ''}` : 'Excel not found'
  ].join(' ');
  statusEl.textContent = `${sqlText} ${officeText}`;
}

async function openRecentOfficeArtifact(app) {
  requireProjectExportPermission();
  const artifact = getRecentOfficeArtifact(app);
  if (!artifact) {
    throw new Error(`No recent ${app === 'word' ? 'Word' : 'Excel'} export was found for this project.`);
  }
  await postJson(`${API_BASE}/integrations/office/open`, {
    projectId: state.selectedProjectId,
    relativePath: artifact.relativePath,
    app
  });
}

async function loadExternalSqlProfiles() {
  if (!state.selectedProjectId || !state.currentUser || !getProjectPermissionState().canExportProject) {
    state.externalSqlProfiles = [];
    state.externalSqlTables = [];
    state.externalSqlPreview = null;
    state.externalSqlImportJobs = [];
    state.externalSqlQueryPreview = null;
    state.selectedSqlProfileId = null;
    state.selectedSqlTableKey = '';
    return;
  }
  try {
    const env = await getJson(`${API_BASE}/sql-profiles?projectId=${encodeURIComponent(state.selectedProjectId)}`);
    state.externalSqlProfiles = env.data?.items ?? [];
    if (!state.externalSqlProfiles.some((item) => item.id === state.selectedSqlProfileId)) {
      state.selectedSqlProfileId = state.externalSqlProfiles[0]?.id ?? null;
      state.externalSqlTables = [];
      state.externalSqlQueryPreview = null;
    }
  } catch {
    state.externalSqlProfiles = [];
    state.externalSqlTables = [];
    state.externalSqlPreview = null;
    state.externalSqlImportJobs = [];
    state.externalSqlQueryPreview = null;
    state.selectedSqlProfileId = null;
    state.selectedSqlTableKey = '';
  }
}

async function loadExternalSqlTables(profileId = state.selectedSqlProfileId) {
  if (!state.selectedProjectId || !profileId) {
    state.externalSqlTables = [];
    state.externalSqlPreview = null;
    state.externalSqlQueryPreview = null;
    state.selectedSqlTableKey = '';
    return;
  }
  try {
    const env = await getJson(`${API_BASE}/sql-profiles/${encodeURIComponent(profileId)}/tables?projectId=${encodeURIComponent(state.selectedProjectId)}`);
    state.externalSqlTables = env.data?.items ?? [];
  } catch {
    state.externalSqlTables = [];
    state.externalSqlPreview = null;
    state.externalSqlQueryPreview = null;
    state.selectedSqlTableKey = '';
  }
}

async function loadExternalSqlPreview(profileId = state.selectedSqlProfileId, tableKey = state.selectedSqlTableKey) {
  if (!state.selectedProjectId || !profileId || !tableKey) {
    state.externalSqlPreview = null;
    return;
  }
  const separatorIndex = tableKey.indexOf('.');
  if (separatorIndex < 0) {
    state.externalSqlPreview = null;
    return;
  }
  const schemaName = tableKey.slice(0, separatorIndex);
  const tableName = tableKey.slice(separatorIndex + 1);
  try {
    const env = await getJson(`${API_BASE}/sql-profiles/${encodeURIComponent(profileId)}/preview?projectId=${encodeURIComponent(state.selectedProjectId)}&schemaName=${encodeURIComponent(schemaName)}&tableName=${encodeURIComponent(tableName)}&limit=10`);
    state.externalSqlPreview = env.data ?? null;
  } catch {
    state.externalSqlPreview = null;
  }
}

async function loadExternalSqlImportJobs() {
  if (!state.selectedProjectId || !state.currentUser || !getProjectPermissionState().canExportProject) {
    state.externalSqlImportJobs = [];
    return;
  }
  try {
    const env = await getJson(`${API_BASE}/sql-import/jobs?projectId=${encodeURIComponent(state.selectedProjectId)}`);
    state.externalSqlImportJobs = env.data?.items ?? [];
  } catch {
    state.externalSqlImportJobs = [];
  }
}

async function runExternalSqlQueryPreview() {
  if (!state.selectedProjectId || !state.selectedSqlProfileId) {
    state.externalSqlQueryPreview = null;
    return;
  }
  const sql = document.getElementById('sql-query-text')?.value ?? '';
  const env = await postJson(`${API_BASE}/sql-profiles/${encodeURIComponent(state.selectedSqlProfileId)}/query-preview`, {
    projectId: state.selectedProjectId,
    sql,
    limit: 25
  });
  state.externalSqlQueryPreview = env.data ?? null;
}

async function exportDatasetToExternalSql() {
  if (!state.selectedProjectId || !state.selectedSqlProfileId) {
    throw new Error('Select a project and SQL profile first.');
  }
  const schemaName = document.getElementById('sql-export-schema')?.value?.trim() || 'public';
  const tableName = document.getElementById('sql-export-table')?.value?.trim() || '';
  const mode = document.getElementById('sql-export-mode')?.value === 'append' ? 'append' : 'replace';
  const rawMode = document.getElementById('sql-export-mode')?.value;
  const resolvedMode = rawMode === 'append' || rawMode === 'upsert' ? rawMode : 'replace';
  const keyField = document.getElementById('sql-export-key-field')?.value?.trim() || '';
  const targetKeyColumn = document.getElementById('sql-export-key-column')?.value?.trim() || '';
  if (!tableName) {
    throw new Error('Enter a target table name.');
  }
  if (resolvedMode === 'upsert' && (!keyField || !targetKeyColumn)) {
    throw new Error('Enter both the dataset key field and target key column for upsert.');
  }
  const env = await postJson(`${API_BASE}/sql-profiles/${encodeURIComponent(state.selectedSqlProfileId)}/export-table`, {
    projectId: state.selectedProjectId,
    schemaName,
    tableName,
    mode: resolvedMode,
    keyField,
    targetKeyColumn,
    filters: state.selectedDatasetFilters,
    recodes: state.selectedDatasetRecodes,
    analysis: getAnalysisOptionsPayload()
  });
  return env.data?.exported ?? null;
}

function renderExternalSqlPanel() {
  const profileSelect = document.getElementById('sql-profile-select');
  const tableSelect = document.getElementById('sql-table-select');
  const caseLabelSelect = document.getElementById('sql-case-label-column');
  const statusEl = document.getElementById('sql-import-status');
  const previewEl = document.getElementById('sql-preview');
  const jobsEl = document.getElementById('sql-import-jobs');
  const queryResultEl = document.getElementById('sql-query-result');
  const scheduleEnabledEl = document.getElementById('sql-job-schedule-enabled');
  const scheduleIntervalEl = document.getElementById('sql-job-schedule-interval');
  const jobMaxRowsEl = document.getElementById('sql-job-max-rows');
  const exportSchemaEl = document.getElementById('sql-export-schema');
  const exportTableEl = document.getElementById('sql-export-table');
  if (!profileSelect || !tableSelect || !caseLabelSelect || !statusEl) return;

  profileSelect.innerHTML = [
    '<option value="">Select a SQL profile</option>',
    ...state.externalSqlProfiles.map((profile) => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.label)} (${escapeHtml(profile.connection.host)}/${escapeHtml(profile.connection.database)})</option>`)
  ].join('');
  profileSelect.value = state.selectedSqlProfileId ?? '';
  const selectedProfile = state.externalSqlProfiles.find((item) => item.id === state.selectedSqlProfileId) ?? null;
  const fieldAssignments = [
    ['sql-profile-label', selectedProfile?.label ?? ''],
    ['sql-host', selectedProfile?.connection?.host ?? ''],
    ['sql-port', selectedProfile?.connection?.port ?? defaultSqlPortForClientType(selectedProfile?.clientType ?? 'postgres')],
    ['sql-database', selectedProfile?.connection?.database ?? ''],
    ['sql-username', selectedProfile?.connection?.user ?? '']
  ];
  for (const [id, value] of fieldAssignments) {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) el.value = String(value ?? '');
  }
  const sslEl = document.getElementById('sql-ssl');
  if (sslEl && document.activeElement !== sslEl) sslEl.checked = Boolean(selectedProfile?.connection?.ssl);
  const clientTypeEl = document.getElementById('sql-client-type');
  if (clientTypeEl && document.activeElement !== clientTypeEl) {
    clientTypeEl.value = selectedProfile?.clientType ?? 'postgres';
  }

  const tableOptions = state.externalSqlTables.map((table) => ({
    key: `${table.schema}.${table.table}`,
    label: `${table.schema}.${table.table}`
  }));
  tableSelect.innerHTML = [
    '<option value="">Select a table</option>',
    ...tableOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`)
  ].join('');
  tableSelect.value = state.selectedSqlTableKey || '';
  const selectedTableKey = state.selectedSqlTableKey || tableSelect.value;
  const fallbackTable = state.externalSqlTables[0] ?? null;
  const selectedTable = state.externalSqlTables.find((item) => `${item.schema}.${item.table}` === selectedTableKey)
    ?? fallbackTable;
  if (selectedTable && !selectedTableKey) {
    state.selectedSqlTableKey = `${selectedTable.schema}.${selectedTable.table}`;
    tableSelect.value = state.selectedSqlTableKey;
  }

  const columns = selectedTable?.columns ?? [];
  caseLabelSelect.innerHTML = [
    '<option value="">Choose a case label column</option>',
    ...columns.map((column) => `<option value="${escapeHtml(column.name)}">${escapeHtml(column.name)} (${escapeHtml(column.dataType)})</option>`)
  ].join('');
  if (!caseLabelSelect.value && columns.length > 0) {
    caseLabelSelect.value = columns[0].name;
  }
  const queryTextEl = document.getElementById('sql-query-text');
  if (queryTextEl && selectedTable && !queryTextEl.value.trim()) {
    queryTextEl.value = `SELECT * FROM ${selectedTable.schema}.${selectedTable.table}`;
  }
  if (exportSchemaEl && !exportSchemaEl.value.trim()) {
    exportSchemaEl.value = 'public';
  }
  if (exportTableEl && document.activeElement !== exportTableEl && !exportTableEl.value.trim() && state.selectedProjectId) {
    exportTableEl.value = `${normalizeAnalysisFieldKey(state.selectedProjectId)}_dataset`;
  }

  const variableSelect = document.getElementById('sql-variable-columns');
  const importColumnsEl = document.getElementById('sql-import-columns');
  if (variableSelect) {
    variableSelect.innerHTML = columns.map((column) => `<option value="${escapeHtml(column.name)}">${escapeHtml(column.name)} (${escapeHtml(column.dataType)})</option>`).join('');
  }
  if (importColumnsEl) {
    importColumnsEl.innerHTML = columns.length === 0
      ? '<div class="small-muted">Load a table to choose columns.</div>'
      : columns.map((column) => `
          <label class="checkbox" style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" class="sql-import-column-checkbox" value="${escapeHtml(column.name)}" checked />
            <span>${escapeHtml(column.name)} <span class="small-muted">(${escapeHtml(column.dataType)})</span></span>
          </label>
        `).join('');
  }

  if (previewEl) {
    if (!state.externalSqlPreview || !Array.isArray(state.externalSqlPreview.columns) || state.externalSqlPreview.columns.length === 0) {
      previewEl.innerHTML = '<div class="small-muted">Load a table preview to inspect columns and sample rows.</div>';
    } else {
      const headers = state.externalSqlPreview.columns.map((column) => `<th>${escapeHtml(column.name)}</th>`).join('');
      const rows = (state.externalSqlPreview.rows ?? []).map((row) => `
        <tr>${state.externalSqlPreview.columns.map((column) => `<td>${escapeHtml(String(row[column.name] ?? ''))}</td>`).join('')}</tr>
      `).join('');
      previewEl.innerHTML = `
        <div class="small-muted" style="margin-bottom:8px">Previewing ${state.externalSqlPreview.rows?.length ?? 0} sample rows.</div>
        <div class="matrix-table-wrap">
          <table class="matrix-table">
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows || '<tr><td colspan="99">No preview rows.</td></tr>'}</tbody>
          </table>
        </div>
      `;
    }
  }

  if (queryResultEl) {
    if (!state.externalSqlQueryPreview || !Array.isArray(state.externalSqlQueryPreview.columns) || state.externalSqlQueryPreview.columns.length === 0) {
      queryResultEl.innerHTML = '<div class="small-muted">Run a read-only SQL query to preview rows from the selected profile.</div>';
    } else {
      const headers = state.externalSqlQueryPreview.columns.map((column) => `<th>${escapeHtml(column.name)}</th>`).join('');
      const rows = (state.externalSqlQueryPreview.rows ?? []).map((row) => `
        <tr>${state.externalSqlQueryPreview.columns.map((column) => `<td>${escapeHtml(String(row[column.name] ?? ''))}</td>`).join('')}</tr>
      `).join('');
      queryResultEl.innerHTML = `
        <div class="small-muted" style="margin-bottom:8px">Returned ${state.externalSqlQueryPreview.rowCount ?? 0} row(s), limited to ${state.externalSqlQueryPreview.limitedTo ?? 25}.</div>
        <div class="matrix-table-wrap">
          <table class="matrix-table">
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows || '<tr><td colspan="99">No query rows returned.</td></tr>'}</tbody>
          </table>
        </div>
      `;
    }
  }

  if (jobsEl) {
    jobsEl.innerHTML = state.externalSqlImportJobs.length === 0
      ? '<li class="interactive-list-item empty">No saved SQL import jobs yet.</li>'
      : state.externalSqlImportJobs.map((job) => `
          <li class="interactive-list-item">
            <div>
              <strong>${escapeHtml(job.label)}</strong>
              <div class="small-muted">${escapeHtml(job.schemaName)}.${escapeHtml(job.tableName)} → ${escapeHtml(job.caseLabelColumn)}</div>
            </div>
            <div class="button-row">
              <button type="button" class="small sql-job-run-btn" data-job-id="${escapeHtml(job.id)}">Refresh</button>
              <button type="button" class="small sql-job-delete-btn" data-job-id="${escapeHtml(job.id)}">Delete</button>
            </div>
          </li>
        `).join('');
  }

  if (jobsEl) {
    const formatRunStamp = (value) => {
      if (!value) return 'Never';
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleString();
    };
    jobsEl.innerHTML = state.externalSqlImportJobs.length === 0
      ? '<li class="interactive-list-item empty">No saved SQL import jobs yet.</li>'
      : state.externalSqlImportJobs.map((job) => `
          <li class="interactive-list-item">
            <div>
              <strong>${escapeHtml(job.label)}</strong>
              <div class="small-muted">${escapeHtml(job.schemaName)}.${escapeHtml(job.tableName)} -> ${escapeHtml(job.caseLabelColumn)}</div>
              <div class="small-muted">Rows ${escapeHtml(String(job.maxRows ?? 500))} · ${job.scheduleEnabled ? `Every ${escapeHtml(String(job.scheduleIntervalMinutes ?? 60))} min · Next ${escapeHtml(formatRunStamp(job.scheduleNextRunAt))}` : 'Manual refresh only'}</div>
              <div class="small-muted">Last run ${escapeHtml(formatRunStamp(job.lastRunAt))}${job.lastRunStatus ? ` · ${escapeHtml(job.lastRunStatus)}` : ''}${job.lastRunMessage ? ` · ${escapeHtml(job.lastRunMessage)}` : ''}</div>
            </div>
            <div class="button-row">
              <button type="button" class="small sql-job-run-btn" data-job-id="${escapeHtml(job.id)}">Refresh</button>
              <button type="button" class="small ${job.scheduleEnabled ? 'sql-job-reschedule-btn' : 'sql-job-enable-schedule-btn'}" data-job-id="${escapeHtml(job.id)}" data-current-interval="${escapeHtml(String(job.scheduleIntervalMinutes ?? 60))}">${job.scheduleEnabled ? 'Reschedule' : 'Enable schedule'}</button>
              ${job.scheduleEnabled ? `<button type="button" class="small sql-job-pause-schedule-btn" data-job-id="${escapeHtml(job.id)}">Pause</button>` : ''}
              <button type="button" class="small sql-job-delete-btn" data-job-id="${escapeHtml(job.id)}">Delete</button>
            </div>
          </li>
        `).join('');
  }

  if (scheduleIntervalEl && !scheduleIntervalEl.value) {
    scheduleIntervalEl.value = '60';
  }
  if (jobMaxRowsEl && !jobMaxRowsEl.value) {
    jobMaxRowsEl.value = '500';
  }

  const permissions = getProjectPermissionState();
  const disabled = !permissions.canExportProject;
  for (const id of [
    'sql-profile-label',
    'sql-client-type',
    'sql-host',
    'sql-port',
    'sql-database',
    'sql-username',
    'sql-password',
    'sql-ssl',
    'sql-query-text',
    'save-sql-profile-btn',
    'delete-sql-profile-btn',
    'load-sql-tables-btn',
    'sql-table-select',
    'sql-case-label-column',
    'sql-variable-columns',
    'sql-max-rows',
    'sql-job-max-rows',
    'sql-job-schedule-interval',
    'sql-job-schedule-enabled',
    'sql-export-schema',
    'sql-export-table',
    'sql-export-mode',
    'import-sql-table-btn',
    'save-sql-import-job-btn',
    'preview-sql-table-btn',
    'run-sql-query-btn',
    'export-sql-table-btn'
  ]) {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  }

  if (!state.selectedProjectId) {
    statusEl.textContent = 'Select a project to use external SQL profiles.';
  } else if (!permissions.canExportProject) {
    statusEl.textContent = 'Only project owners and Professor accounts can manage SQL profiles and imports.';
  } else if (state.externalSqlProfiles.length === 0) {
    statusEl.textContent = 'Save an external SQL connection profile, then load tables for import.';
  } else if (state.externalSqlTables.length === 0) {
    statusEl.textContent = 'Profile ready. Load tables to inspect available imports.';
  } else {
    statusEl.textContent = `Loaded ${state.externalSqlTables.length} table${state.externalSqlTables.length === 1 ? '' : 's'} from the selected SQL profile.`;
  }
}

async function downloadProjectDataset(format) {
  requireProjectExportPermission();

  const response = await fetch(`${API_BASE}/exports/dataset?projectId=${encodeURIComponent(state.selectedProjectId)}&format=${encodeURIComponent(format)}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw await readResponseError(response);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${state.selectedProjectId}-dataset.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  if (format === 'docx' || format === 'xlsx') {
    await loadRecentOfficeArtifacts();
    renderOfficeLaunchStatus();
  }
}

function buildEvidenceQueryParams(format = null) {
  const params = new URLSearchParams({ projectId: state.selectedProjectId });
  if (format) params.set('format', format);
  for (const [key, value] of [
    ['sourceId', document.getElementById('retrieval-source-id')?.value?.trim()],
    ['sourceKind', document.getElementById('retrieval-source-kind')?.value],
    ['segmentKind', document.getElementById('retrieval-segment-kind')?.value],
    ['codeId', document.getElementById('retrieval-code-id')?.value?.trim()],
    ['coCodeId', document.getElementById('retrieval-cocode-id')?.value?.trim()],
    ['caseId', document.getElementById('retrieval-case-id')?.value?.trim()],
    ['coderId', document.getElementById('retrieval-coder-id')?.value?.trim()],
    ['searchText', document.getElementById('retrieval-search-text')?.value?.trim()],
    ['memoOnly', document.getElementById('retrieval-memo-only')?.value]
  ]) {
    if (value && value !== 'false') params.set(key, value);
  }
  return params;
}

function buildAuditQueryParams(format = null) {
  const params = new URLSearchParams({ projectId: state.selectedProjectId });
  if (format) params.set('format', format);
  for (const [key, value] of [
    ['actorUsername', document.getElementById('audit-filter-actor')?.value?.trim()],
    ['actionPrefix', document.getElementById('audit-filter-action')?.value?.trim()],
    ['entityType', document.getElementById('audit-filter-entity')?.value?.trim()],
    ['actorRole', document.getElementById('audit-filter-role')?.value]
  ]) {
    if (value) params.set(key, value);
  }
  params.set('limit', String(state.governanceStatus?.auditExportMaxRows ?? 1000));
  return params;
}

function readQualitativeQueryInputs() {
  return {
    sourceId: document.getElementById('retrieval-source-id')?.value?.trim() || '',
    sourceKind: document.getElementById('retrieval-source-kind')?.value || '',
    segmentKind: document.getElementById('retrieval-segment-kind')?.value || '',
    codeId: document.getElementById('retrieval-code-id')?.value?.trim() || '',
    coCodeId: document.getElementById('retrieval-cocode-id')?.value?.trim() || '',
    caseId: document.getElementById('retrieval-case-id')?.value?.trim() || '',
    coderId: document.getElementById('retrieval-coder-id')?.value?.trim() || '',
    searchText: document.getElementById('retrieval-search-text')?.value?.trim() || '',
    memoOnly: document.getElementById('retrieval-memo-only')?.value === 'true',
    textSearchMode: document.getElementById('text-search-mode')?.value || 'contains',
    textSearchCaseSensitive: document.getElementById('text-search-case-sensitive')?.value === 'true',
    textSearchContextWindow: Number(document.getElementById('text-search-context-window')?.value || 40),
    wordFrequencyTopN: Number(document.getElementById('word-frequency-top-n')?.value || 30),
    wordFrequencyMinLength: Number(document.getElementById('word-frequency-min-length')?.value || 4),
    wordFrequencyExcludeStopWords: document.getElementById('word-frequency-exclude-stop-words')?.value !== 'false',
    compoundQueryOperator: document.getElementById('compound-query-operator')?.value || 'all',
    compoundClauses: [
      1, 2, 3
    ].map((index) => ({
      field: document.getElementById(`compound-clause-${index}-field`)?.value || 'text',
      operator: document.getElementById(`compound-clause-${index}-operator`)?.value || 'contains',
      value: document.getElementById(`compound-clause-${index}-value`)?.value?.trim() || ''
    })),
    comparisonCodeId: document.getElementById('comparison-code-id')?.value?.trim() || '',
    comparisonCoderA: document.getElementById('comparison-coder-a')?.value?.trim() || '',
    comparisonCoderB: document.getElementById('comparison-coder-b')?.value?.trim() || '',
    autocodeKeywords: document.getElementById('autocode-keywords')?.value?.trim() || '',
    autocodePatterns: document.getElementById('autocode-patterns')?.value?.trim() || '',
    autocodeExpandSynonyms: document.getElementById('autocode-expand-synonyms')?.value !== 'false',
    autocodeMatchMode: document.getElementById('autocode-match-mode')?.value || 'phrase'
  };
}

function applyQualitativeQueryInputs(query = {}) {
  const assignments = [
    ['retrieval-source-id', query.sourceId ?? ''],
    ['retrieval-source-kind', query.sourceKind ?? ''],
    ['retrieval-segment-kind', query.segmentKind ?? ''],
    ['retrieval-code-id', query.codeId ?? ''],
    ['retrieval-cocode-id', query.coCodeId ?? ''],
    ['retrieval-case-id', query.caseId ?? ''],
    ['retrieval-coder-id', query.coderId ?? ''],
    ['retrieval-search-text', query.searchText ?? ''],
    ['retrieval-memo-only', query.memoOnly ? 'true' : 'false'],
    ['text-search-mode', query.textSearchMode ?? 'contains'],
    ['text-search-case-sensitive', query.textSearchCaseSensitive ? 'true' : 'false'],
    ['text-search-context-window', query.textSearchContextWindow ?? 40],
    ['word-frequency-top-n', query.wordFrequencyTopN ?? 30],
    ['word-frequency-min-length', query.wordFrequencyMinLength ?? 4],
    ['word-frequency-exclude-stop-words', query.wordFrequencyExcludeStopWords === false ? 'false' : 'true'],
    ['compound-query-operator', query.compoundQueryOperator ?? 'all'],
    ['comparison-code-id', query.comparisonCodeId ?? ''],
    ['comparison-coder-a', query.comparisonCoderA ?? ''],
    ['comparison-coder-b', query.comparisonCoderB ?? ''],
    ['autocode-keywords', query.autocodeKeywords ?? ''],
    ['autocode-patterns', query.autocodePatterns ?? ''],
    ['autocode-expand-synonyms', query.autocodeExpandSynonyms === false ? 'false' : 'true'],
    ['autocode-match-mode', query.autocodeMatchMode ?? 'phrase']
  ];
  for (const [id, value] of assignments) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }
  const compoundClauses = Array.isArray(query.compoundClauses) ? query.compoundClauses : [];
  for (const clauseIndex of [1, 2, 3]) {
    const fieldEl = document.getElementById(`compound-clause-${clauseIndex}-field`);
    const operatorEl = document.getElementById(`compound-clause-${clauseIndex}-operator`);
    const valueEl = document.getElementById(`compound-clause-${clauseIndex}-value`);
    const clause = compoundClauses[clauseIndex - 1] ?? {};
    if (fieldEl) fieldEl.value = clause.field ?? 'text';
    if (operatorEl) operatorEl.value = clause.operator ?? 'contains';
    if (valueEl) valueEl.value = clause.value ?? '';
  }
}

async function downloadEvidenceExport(format = 'json') {
  requireProjectExportPermission();

  const params = buildEvidenceQueryParams(format);

  const response = await fetch(`${API_BASE}/exports/evidence?${params.toString()}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw await readResponseError(response);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${state.selectedProjectId}-evidence-report.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  if (format === 'docx' || format === 'xlsx') {
    await loadRecentOfficeArtifacts();
    renderOfficeLaunchStatus();
  }
}

async function downloadReportPackage(kind, format = 'json', extraParams = {}) {
  requireProjectExportPermission();

  const params = buildEvidenceQueryParams(format);
  params.set('kind', kind);
  for (const [key, value] of Object.entries(extraParams)) {
    if (value !== null && value !== undefined && String(value).trim()) {
      params.set(key, String(value).trim());
    }
  }

  const response = await fetch(`${API_BASE}/exports/reports?${params.toString()}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw await readResponseError(response);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${state.selectedProjectId}-${kind}.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function loadAuditEvents() {
  if (!state.selectedProjectId) {
    state.selectedAuditEvents = [];
    return;
  }
  if (!getProjectPermissionState().canExportProject) {
    state.selectedAuditEvents = [];
    return;
  }
  try {
    const env = await getJson(`${API_BASE}/audit-events?${buildAuditQueryParams().toString()}`);
    state.selectedAuditEvents = env.data.items ?? [];
  } catch {
    state.selectedAuditEvents = [];
  }
}

async function downloadAuditExport(format = 'json') {
  requireProjectExportPermission();
  const response = await fetch(`${API_BASE}/exports/audit?${buildAuditQueryParams(format).toString()}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw await readResponseError(response);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${state.selectedProjectId}-audit.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function loadBackupItems() {
  if (!state.selectedProjectId) {
    state.backupItems = [];
    return;
  }
  if (!getProjectPermissionState().canManageProject) {
    state.backupItems = [];
    return;
  }
  try {
    const env = await getJson(`${API_BASE}/backups/project?projectId=${encodeURIComponent(state.selectedProjectId)}`);
    state.backupItems = env.data.items ?? [];
  } catch {
    state.backupItems = [];
  }
}

async function createProjectBackup() {
  requireProjectManagementPermission();
  const env = await postJson(`${API_BASE}/backups/project`, { projectId: state.selectedProjectId });
  await loadBackupItems();
  document.getElementById('backup-result').textContent = `Backup created: ${env.data.backup.relativePath}`;
}

async function restoreProjectBackup(relativePath) {
  requireProjectManagementPermission();
  const requestedName = window.prompt('Name for restored project', `${state.selectedSummary?.project?.name ?? 'Project'} (Restored)`);
  if (requestedName === null) return;
  const env = await postJson(`${API_BASE}/backups/project/restore`, {
    projectId: state.selectedProjectId,
    relativePath,
    newProjectName: requestedName
  });
  document.getElementById('backup-result').textContent = `Restored project created: ${env.data.restored.projectName}`;
  state.selectedProjectId = env.data.restored.projectId;
  await refreshPage();
}

async function runRetrieval() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }

  const params = buildEvidenceQueryParams();

  const env = await getJson(`${API_BASE}/retrieval?${params.toString()}`);
  state.retrievalResults = env.data.items ?? [];
  state.retrievalCoverage = env.data.evidenceCoverage ?? '';
  state.retrievalPrompt = env.data.aiSummaryPrompt ?? '';
  renderRetrieval();
}

async function runTextSearch() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const params = buildEvidenceQueryParams();
  params.set('matchMode', document.getElementById('text-search-mode')?.value || 'contains');
  params.set('caseSensitive', document.getElementById('text-search-case-sensitive')?.value || 'false');
  params.set('contextWindow', document.getElementById('text-search-context-window')?.value || '40');
  const env = await getJson(`${API_BASE}/text-search?${params.toString()}`);
  state.textSearchResult = env.data.textSearch ?? null;
  renderTextSearch();
}

async function runWordFrequency() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const params = buildEvidenceQueryParams();
  params.set('topN', document.getElementById('word-frequency-top-n')?.value || '30');
  params.set('minLength', document.getElementById('word-frequency-min-length')?.value || '4');
  params.set('excludeStopWords', document.getElementById('word-frequency-exclude-stop-words')?.value || 'true');
  const env = await getJson(`${API_BASE}/word-frequency?${params.toString()}`);
  state.wordFrequencyResult = env.data.wordFrequency ?? null;
  renderWordFrequency();
}

async function runWordCloud() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const params = buildEvidenceQueryParams();
  params.set('topN', document.getElementById('word-frequency-top-n')?.value || '30');
  params.set('minLength', document.getElementById('word-frequency-min-length')?.value || '4');
  params.set('excludeStopWords', document.getElementById('word-frequency-exclude-stop-words')?.value || 'true');
  const env = await getJson(`${API_BASE}/word-cloud?${params.toString()}`);
  state.wordCloudResult = env.data.wordCloud ?? null;
  renderWordCloud();
}

async function runCompoundQuery() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const query = readQualitativeQueryInputs();
  const env = await postJson(`${API_BASE}/compound-query`, {
    projectId: state.selectedProjectId,
    scope: {
      sourceId: query.sourceId,
      sourceKind: query.sourceKind,
      segmentKind: query.segmentKind,
      codeId: query.codeId,
      coCodeId: query.coCodeId,
      caseId: query.caseId,
      coderId: query.coderId,
      memoOnly: query.memoOnly ? 'true' : 'false'
    },
    operator: query.compoundQueryOperator,
    clauses: query.compoundClauses
  });
  state.compoundQueryResult = env.data.compoundQuery ?? null;
  renderCompoundQuery();
}

async function runMatrixCoding() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const env = await getJson(`${API_BASE}/matrix-coding?${buildEvidenceQueryParams().toString()}`);
  state.matrixCodingResult = env.data.matrix ?? null;
  renderMatrixCoding();
}

async function runCodeByCaseView() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const env = await getJson(`${API_BASE}/code-by-case?${buildEvidenceQueryParams().toString()}`);
  state.codeByCaseView = env.data.view ?? null;
  renderCodeByCaseView();
}

async function runCodeCooccurrence() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const env = await getJson(`${API_BASE}/code-cooccurrence?${buildEvidenceQueryParams().toString()}`);
  state.cooccurrenceResult = env.data.cooccurrence ?? null;
  renderCodeCooccurrence();
}

async function runCodeCodeMatrix() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const env = await getJson(`${API_BASE}/matrix-coding-codes?${buildEvidenceQueryParams().toString()}`);
  state.codeCodeMatrixResult = env.data.matrix ?? null;
  renderCodeCodeMatrix();
}

async function runQualitativeQueryReport() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const env = await getJson(`${API_BASE}/query-report?${buildEvidenceQueryParams().toString()}`);
  state.qualitativeQueryReport = env.data.report ?? null;
  renderQualitativeQueryReport();
}

async function runFrameworkMatrix() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const env = await getJson(`${API_BASE}/framework-matrix?${buildEvidenceQueryParams().toString()}`);
  state.frameworkMatrixResult = env.data.frameworkMatrix ?? null;
  renderFrameworkMatrix();
}

async function runMapVisualization() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const env = await getJson(`${API_BASE}/map-visualization?${buildEvidenceQueryParams().toString()}`);
  state.mapVisualizationResult = env.data.mapVisualization ?? null;
  renderMapVisualization();
}

async function runCodeHierarchy() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const env = await getJson(`${API_BASE}/code-hierarchy?${buildEvidenceQueryParams().toString()}`);
  state.codeHierarchyResult = env.data.codeHierarchy ?? null;
  renderCodeHierarchy();
}

async function runConceptMap() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const env = await getJson(`${API_BASE}/concept-map?${buildEvidenceQueryParams().toString()}`);
  state.conceptMapResult = env.data.conceptMap ?? null;
  state.codeClusterResult = env.data.codeClusters ?? null;
  renderConceptMap();
  renderCodeClusters();
}

async function importReferences() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const format = document.getElementById('reference-import-format')?.value || 'ris';
  const text = document.getElementById('reference-import-text')?.value || '';
  const relatedSourceId = document.getElementById('reference-related-source-id')?.value?.trim() || '';
  const env = await postJson(`${API_BASE}/references/import`, {
    projectId: state.selectedProjectId,
    format,
    text,
    relatedSourceId: relatedSourceId || undefined
  });
  state.referenceImportResult = env.data ?? null;
  document.getElementById('reference-import-text').value = '';
  await loadSelectedProjectData();
  renderReferences();
}

async function deleteReference(referenceId) {
  if (!state.selectedProjectId) return;
  await getJson(`${API_BASE}/references/${encodeURIComponent(referenceId)}?projectId=${encodeURIComponent(state.selectedProjectId)}`, {
    method: 'DELETE'
  });
  await loadSelectedProjectData();
  renderReferences();
}

async function runCodingComparison() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const codeId = document.getElementById('comparison-code-id')?.value?.trim()
    || document.getElementById('retrieval-code-id')?.value?.trim()
    || '';
  if (!codeId) {
    throw new Error('Enter a code ID for coding comparison.');
  }
  const params = buildEvidenceQueryParams();
  params.set('codeId', codeId);
  const coderA = document.getElementById('comparison-coder-a')?.value?.trim() || '';
  const coderB = document.getElementById('comparison-coder-b')?.value?.trim() || '';
  if (coderA) params.set('coderA', coderA);
  if (coderB) params.set('coderB', coderB);
  const env = await getJson(`${API_BASE}/coding-comparison?${params.toString()}`);
  state.codingComparisonResult = env.data.comparison ?? null;
  renderCodingComparison();
}

async function runInterRaterSummary() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const params = buildEvidenceQueryParams();
  const coderA = document.getElementById('comparison-coder-a')?.value?.trim() || '';
  const coderB = document.getElementById('comparison-coder-b')?.value?.trim() || '';
  if (coderA) params.set('coderA', coderA);
  if (coderB) params.set('coderB', coderB);
  const env = await getJson(`${API_BASE}/inter-rater-summary?${params.toString()}`);
  state.interRaterSummaryResult = env.data.summary ?? null;
  renderInterRaterSummary();
}

async function runSentimentAnalysis() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const params = buildEvidenceQueryParams();
  const env = await getJson(`${API_BASE}/sentiment-analysis?${params.toString()}`);
  state.sentimentResult = env.data.sentiment ?? null;
  renderSentimentResult();
}

async function runKeywordAutocode() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const codeId = document.getElementById('comparison-code-id')?.value?.trim()
    || document.getElementById('retrieval-code-id')?.value?.trim()
    || '';
  const keywords = document.getElementById('autocode-keywords')?.value?.trim() || '';
  if (!codeId) {
    throw new Error('Enter a code ID before running keyword autocoding.');
  }
  if (!keywords) {
    throw new Error('Enter at least one keyword for autocoding.');
  }
  const query = readQualitativeQueryInputs();
  const env = await postJson(`${API_BASE}/autocode/keywords`, {
    projectId: state.selectedProjectId,
    codeId,
    keywords,
    sourceId: query.sourceId,
    sourceKind: query.sourceKind,
    segmentKind: query.segmentKind,
    caseId: query.caseId,
    searchText: query.searchText,
    memoOnly: query.memoOnly
  });
  await loadSelectedProjectData();
  state.autocodeResult = env.data.autocode ?? null;
  renderAll();
}

async function runPatternAutocode() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const codeId = document.getElementById('comparison-code-id')?.value?.trim()
    || document.getElementById('retrieval-code-id')?.value?.trim()
    || '';
  const patterns = document.getElementById('autocode-patterns')?.value?.trim() || '';
  if (!codeId) {
    throw new Error('Enter a code ID before running pattern autocoding.');
  }
  if (!patterns) {
    throw new Error('Enter at least one phrase or concept pattern.');
  }
  const query = readQualitativeQueryInputs();
  const env = await postJson(`${API_BASE}/autocode/patterns`, {
    projectId: state.selectedProjectId,
    codeId,
    patterns,
    expandSynonyms: query.autocodeExpandSynonyms,
    matchMode: query.autocodeMatchMode,
    sourceId: query.sourceId,
    sourceKind: query.sourceKind,
    segmentKind: query.segmentKind,
    caseId: query.caseId,
    searchText: query.searchText,
    memoOnly: query.memoOnly
  });
  await loadSelectedProjectData();
  state.autocodeResult = env.data.autocode ?? null;
  renderAll();
}

async function loadMediaTimelineForActiveSource() {
  if (!state.selectedProjectId || !state.activeSourceId) return;
  const source = getActiveSource();
  if (!source || (source.kind !== 'audio' && source.kind !== 'video')) {
    state.mediaTimeline = null;
    return;
  }
  const env = await getJson(`${API_BASE}/media-timeline?projectId=${encodeURIComponent(state.selectedProjectId)}&sourceId=${encodeURIComponent(source.id)}`);
  state.mediaTimeline = env.data.timeline ?? null;
}

async function queueTranscriptionJob() {
  if (!state.selectedProjectId || !state.activeSourceId) {
    window.alert('Select a media source first.');
    return;
  }
  const source = getActiveSource();
  if (!source || (source.kind !== 'audio' && source.kind !== 'video')) {
    window.alert('Choose an audio or video source first.');
    return;
  }
  const note = document.getElementById('workspace-transcription-note')?.value?.trim() || '';
  await postJson(`${API_BASE}/transcription-jobs`, {
    projectId: state.selectedProjectId,
    mediaSourceId: source.id,
    note
  });
  await loadSelectedProjectData();
  renderAll();
}

async function runTranscriptionJob(jobId) {
  if (!state.selectedProjectId || !jobId) return;
  const env = await postJson(`${API_BASE}/transcription-jobs/${encodeURIComponent(jobId)}/run`, {
    projectId: state.selectedProjectId
  });
  await loadSelectedProjectData();
  const transcriptSourceId = env.data.transcriptSourceId ?? null;
  if (transcriptSourceId) {
    const transcriptInput = document.getElementById('workspace-transcript-source-id');
    if (transcriptInput) transcriptInput.value = transcriptSourceId;
  }
  await loadMediaTimelineForActiveSource();
  renderAll();
}

async function runMergeReview() {
  if (!state.selectedProjectId) {
    window.alert('Select a project first.');
    return;
  }
  const params = buildEvidenceQueryParams();
  const env = await getJson(`${API_BASE}/merge-review?${params.toString()}`);
  state.mergeReviewResult = env.data.review ?? null;
  renderMergeReview();
}

function parseRecodeRules(text) {
  const rules = [];
  let defaultValue;
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 0) continue;
    const from = trimmed.slice(0, separatorIndex).trim();
    const to = coerceAnalysisValue(trimmed.slice(separatorIndex + 1).trim());
    if (from === '*') {
      defaultValue = to;
      continue;
    }
    rules.push({ from, to });
  }
  return { rules, defaultValue };
}

async function createAndCodeSegment({ sourceId, kind, anchor, text }) {
  const segmentEnv = await postJson(`${API_BASE}/segments`, {
    projectId: state.selectedProjectId,
    sourceId,
    kind,
    anchor,
    text
  });
  const segment = segmentEnv.data.segment;
  await postJson(`${API_BASE}/code-applications`, {
    projectId: state.selectedProjectId,
    segmentId: segment.id,
    codeId: state.workspaceSelectedCodeId,
    caseId: state.workspaceSelectedCaseId || null,
    confidence: 1
  });
  return segment;
}

function getActiveSource() {
  return state.selectedSources.find((source) => source.id === state.activeSourceId) ?? null;
}

function getSourceCodeApplications(segmentId) {
  return state.selectedCodeApplications.filter((application) => application.segmentId === segmentId);
}

function countSegmentMemos(segmentId) {
  return state.selectedMemos.filter((memo) => memo.targetType === 'segment' && memo.targetId === segmentId).length;
}

function getOverlappingTextSegments(sourceId, start, end) {
  return state.selectedSegments
    .filter((segment) =>
      segment.sourceId === sourceId &&
      segment.kind === 'text_range' &&
      typeof segment.anchor?.start === 'number' &&
      typeof segment.anchor?.end === 'number' &&
      segment.anchor.start < end &&
      segment.anchor.end > start
    )
    .sort((left, right) => (left.anchor.start - right.anchor.start) || (left.anchor.end - right.anchor.end));
}

function renderAnnotatedExcerpt(text, absoluteStart, overlappingSegments) {
  const sourceText = String(text ?? '');
  if (!sourceText) return '<span class="small-muted">(no text)</span>';
  if (!Array.isArray(overlappingSegments) || overlappingSegments.length === 0) return escapeHtml(sourceText);

  let cursor = 0;
  let html = '';
  for (const segment of overlappingSegments) {
    const relativeStart = Math.max(0, (segment.anchor?.start ?? absoluteStart) - absoluteStart);
    const relativeEnd = Math.min(sourceText.length, (segment.anchor?.end ?? absoluteStart) - absoluteStart);
    if (relativeEnd <= relativeStart || relativeStart >= sourceText.length) continue;
    if (relativeStart > cursor) {
      html += escapeHtml(sourceText.slice(cursor, relativeStart));
    }
    const applications = getSourceCodeApplications(segment.id);
    const leadCode = applications.length > 0
      ? state.selectedCodes.find((entry) => entry.id === applications[0].codeId)
      : null;
    const codeSummary = applications.length > 0
      ? applications.map((application) => {
        const code = state.selectedCodes.find((entry) => entry.id === application.codeId);
        return code?.name ?? application.codeId;
      }).join(' | ')
      : 'No codes';
    const anchorSummary = typeof segment.anchor?.start === 'number' && typeof segment.anchor?.end === 'number'
      ? `${segment.anchor.start}-${segment.anchor.end}`
      : segment.id;
    const activeClass = state.workspaceFocusedSegmentId === segment.id ? ' active' : '';
    html += `<mark class="coding-inline-range${activeClass}" data-workspace-segment-id="${escapeHtml(segment.id)}" data-workspace-segment-anchor="${escapeHtml(anchorSummary)}" data-workspace-segment-codes="${escapeHtml(codeSummary)}" data-workspace-segment-text="${escapeHtml(summarizeText(segment.text || sourceText.slice(relativeStart, relativeEnd), 120))}" tabindex="0" role="button" aria-label="Focus coded slice ${escapeHtml(segment.id)}" style="${getCodeToneStyle(leadCode?.colorToken)}">${escapeHtml(sourceText.slice(relativeStart, relativeEnd))}</mark>`;
    cursor = Math.max(cursor, relativeEnd);
  }
  if (cursor < sourceText.length) {
    html += escapeHtml(sourceText.slice(cursor));
  }
  return html;
}

function buildTextPassages(source) {
  const text = String(source?.contentText ?? '');
  if (!text.trim()) return [];
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const passages = [];
  let searchStart = 0;
  const items = blocks.length > 0 ? blocks : [text.trim()];
  for (const block of items) {
    const start = text.indexOf(block, searchStart);
    const safeStart = start >= 0 ? start : searchStart;
    const end = safeStart + block.length;
    searchStart = end;
    const existingSegment = state.selectedSegments.find((segment) =>
      segment.sourceId === source.id &&
      segment.kind === 'text_range' &&
      segment.anchor?.start === safeStart &&
      segment.anchor?.end === end
    );
    passages.push({
      id: existingSegment?.id ?? `draft-${source.id}-${safeStart}-${end}`,
      sourceId: source.id,
      text: block,
      kind: 'text_range',
      anchor: { kind: 'text_range', start: safeStart, end },
      existingSegment
    });
  }
  return passages;
}

function getWorkspaceItems(source) {
  if (!source) return [];
  const sourceSegments = state.selectedSegments.filter((segment) => segment.sourceId === source.id);
  if (source.kind === 'pdf') {
    return sourceSegments
      .filter((segment) => segment.kind === 'page_region')
      .sort((left, right) => (left.anchor?.page ?? 0) - (right.anchor?.page ?? 0))
      .map((segment) => ({ ...segment, existingSegment: segment }));
  }
  if (source.kind === 'audio' || source.kind === 'video') {
    return sourceSegments
      .filter((segment) => segment.kind === 'time_range')
      .sort((left, right) => (left.anchor?.startMs ?? 0) - (right.anchor?.startMs ?? 0))
      .map((segment) => ({ ...segment, existingSegment: segment }));
  }
  return buildTextPassages(source);
}

function jumpToWorkspaceSegment(segmentId, sourceId = null) {
  const segment = state.selectedSegments.find((entry) => entry.id === segmentId) ?? null;
  const resolvedSourceId = sourceId ?? segment?.sourceId ?? null;
  if (!resolvedSourceId) return;
  state.qualitativeView = 'coding';
  state.activeSourceId = resolvedSourceId;
  state.workspaceFocusedSegmentId = segmentId;
  state.workspaceSelectedItemKey = segmentId;
  setActiveTab('qualitative');
  renderAll();
}

function focusRelationshipTarget(targetType, targetId) {
  if (targetType === 'segment') {
    jumpToWorkspaceSegment(targetId);
    return;
  }
  if (targetType === 'source') {
    state.qualitativeView = 'coding';
    state.activeSourceId = targetId;
    state.workspaceFocusedSegmentId = null;
    state.workspaceSelectedItemKey = null;
    setActiveTab('qualitative');
    renderAll();
    return;
  }
  if (targetType === 'code') {
    state.workspaceSelectedCodeId = targetId;
    setActiveTab('qualitative');
    renderAll();
    return;
  }
  if (targetType === 'case') {
    state.workspaceSelectedCaseId = targetId;
    setActiveTab('qualitative');
    renderAll();
  }
}

async function createSegmentFromWorkspaceItem(item) {
  if (item.existingSegment?.id) return item.existingSegment;
  const env = await postJson(`${API_BASE}/segments`, {
    projectId: state.selectedProjectId,
    sourceId: item.sourceId,
    kind: item.kind,
    anchor: item.anchor,
    text: item.text
  });
  return env.data.segment;
}

async function applyWorkspaceCode(item, codeId = state.workspaceSelectedCodeId) {
  if (!state.selectedProjectId) return;
  if (!codeId) {
    window.alert('Choose an active code first.');
    return;
  }

  const statusEl = document.getElementById('workspace-status');
  if (statusEl) statusEl.textContent = 'Saving coded passage…';

  try {
    const segment = await createSegmentFromWorkspaceItem(item);
    const existing = state.selectedCodeApplications.find((application) =>
      application.segmentId === segment.id &&
      application.codeId === codeId
    );
    if (!existing) {
      await postJson(`${API_BASE}/code-applications`, {
        projectId: state.selectedProjectId,
        segmentId: segment.id,
        codeId,
        caseId: state.workspaceSelectedCaseId || null,
        confidence: 1
      });
    }
    await loadSelectedProjectData();
    renderAll();
    if (statusEl) statusEl.textContent = existing
      ? 'That code is already applied to this segment.'
      : 'Code applied in the source workspace.';
  } catch (err) {
    if (statusEl) statusEl.textContent = `Workspace error: ${err.message}`;
  }
}

function captureWorkspaceMediaTime(targetId) {
  const mediaEl = document.getElementById('workspace-media-element');
  const input = document.getElementById(targetId);
  if (!mediaEl || !input) return;
  input.value = Number(mediaEl.currentTime ?? 0).toFixed(1);
}

async function saveWorkspaceMediaSegment() {
  if (!state.selectedProjectId) return;
  const source = getActiveSource();
  const activeCode = state.selectedCodes.find((code) => code.id === state.workspaceSelectedCodeId) ?? null;
  const activeCase = state.selectedCases.find((caseEntity) => caseEntity.id === state.workspaceSelectedCaseId) ?? null;
  if (!source || (source.kind !== 'audio' && source.kind !== 'video')) {
    window.alert('Choose an audio or video source first.');
    return;
  }
  if (!state.workspaceSelectedCodeId) {
    window.alert('Choose an active code first.');
    return;
  }

  const startEl = document.getElementById('workspace-media-start');
  const endEl = document.getElementById('workspace-media-end');
  const textEl = document.getElementById('workspace-media-text');
  const transcriptSourceEl = document.getElementById('workspace-transcript-source-id');
  const statusEl = document.getElementById('workspace-status');
  const startSeconds = Number(startEl?.value ?? 0);
  const endSeconds = Number(endEl?.value ?? 0);
  const transcript = textEl?.value.trim() ?? '';

  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds) || endSeconds <= startSeconds) {
    window.alert('Enter a valid media range where end is greater than start.');
    return;
  }
  if (!transcript) {
    window.alert('Enter a transcript excerpt or media note for the saved segment.');
    return;
  }

  if (statusEl) statusEl.textContent = 'Saving media segment…';

  try {
    const segment = await createAndCodeSegment({
      sourceId: source.id,
      kind: 'time_range',
      anchor: {
        kind: 'time_range',
        startMs: Math.round(startSeconds * 1000),
        endMs: Math.round(endSeconds * 1000)
      },
      text: transcript
    });
    const transcriptSourceId = transcriptSourceEl?.value?.trim() || '';
    if (transcriptSourceId) {
      await postJson(`${API_BASE}/transcript-sync-links`, {
        projectId: state.selectedProjectId,
        mediaSourceId: source.id,
        transcriptSourceId,
        segmentId: segment.id,
        startMs: Math.round(startSeconds * 1000),
        endMs: Math.round(endSeconds * 1000),
        transcriptText: transcript
      });
    }
    if (textEl) textEl.value = '';
    await loadSelectedProjectData();
    await loadMediaTimelineForActiveSource();
    renderAll();
    if (statusEl) statusEl.textContent = transcriptSourceId
      ? 'Media segment saved, coded, and synced to the transcript.'
      : 'Media segment saved and coded.';
  } catch (err) {
    if (statusEl) statusEl.textContent = `Workspace error: ${err.message}`;
  }
}

function renderSourceWorkspaceLegacy() {
  const sourceSelect = document.getElementById('workspace-source-select');
  const codeSelect = document.getElementById('workspace-code-select');
  const caseSelect = document.getElementById('workspace-case-select');
  const view = document.getElementById('source-workspace-view');
  const statusEl = document.getElementById('workspace-status');
  const mediaPanel = document.getElementById('workspace-media-panel');
  const mediaPlayer = document.getElementById('workspace-media-player');
  if (!sourceSelect || !codeSelect || !caseSelect || !view || !statusEl || !mediaPanel || !mediaPlayer) return;

  sourceSelect.innerHTML = state.selectedSources.map((source) => `
    <option value="${escapeHtml(source.id)}">${escapeHtml(source.title)} (${escapeHtml(source.kind)})</option>
  `).join('');
  codeSelect.innerHTML = state.selectedCodes.map((code) => `
    <option value="${escapeHtml(code.id)}">${escapeHtml(code.name)}</option>
  `).join('');
  caseSelect.innerHTML = ['<option value="">No case link</option>'].concat(
    state.selectedCases.map((caseEntity) => `<option value="${escapeHtml(caseEntity.id)}">${escapeHtml(caseEntity.label)}</option>`)
  ).join('');

  sourceSelect.value = state.activeSourceId ?? '';
  codeSelect.value = state.workspaceSelectedCodeId ?? '';
  caseSelect.value = state.workspaceSelectedCaseId ?? '';
  const segmentSourceEl = document.getElementById('segment-source-id');
  const codeInputEl = document.getElementById('ca-code-id');
  const caseInputEl = document.getElementById('ca-case-id');
  const transcriptSourceInput = document.getElementById('workspace-transcript-source-id');
  if (segmentSourceEl) segmentSourceEl.value = state.activeSourceId ?? '';
  if (codeInputEl) codeInputEl.value = state.workspaceSelectedCodeId ?? '';
  if (caseInputEl) caseInputEl.value = state.workspaceSelectedCaseId ?? '';

  const source = getActiveSource();
  if (!source) {
    view.innerHTML = '<div class="coding-empty">No source selected.</div>';
    statusEl.textContent = 'Select a source to start coding.';
    mediaPanel.style.display = 'none';
    mediaPlayer.innerHTML = '';
    return;
  }

  const isMediaSource = (source.kind === 'audio' || source.kind === 'video') && !!source.contentUrl;
  mediaPanel.style.display = isMediaSource ? '' : 'none';
  if (isMediaSource) {
    mediaPlayer.innerHTML = source.kind === 'video'
      ? `<div class="media-shell"><video id="workspace-media-element" controls src="${escapeHtml(source.contentUrl)}"></video></div>`
      : `<div class="media-shell"><audio id="workspace-media-element" controls src="${escapeHtml(source.contentUrl)}"></audio></div>`;
    if (transcriptSourceInput && !transcriptSourceInput.value.trim()) {
      const linkedTranscriptId = state.selectedTranscriptSyncLinks.find((link) => link.mediaSourceId === source.id)?.transcriptSourceId
        ?? state.transcriptionJobs.find((job) => job.mediaSourceId === source.id && job.outputSourceId)?.outputSourceId
        ?? state.selectedSources.find((entry) => entry.kind === 'transcript' && entry.id !== source.id)?.id
        ?? '';
      transcriptSourceInput.value = linkedTranscriptId;
    }
  } else {
    mediaPlayer.innerHTML = '';
    if (transcriptSourceInput) transcriptSourceInput.value = '';
  }

  const items = getWorkspaceItems(source);
  if (items.length === 0) {
    view.innerHTML = `
      <div class="coding-source-sheet">
        <div class="coding-source-head">
          <div>
            <span class="output-kicker">Active source</span>
            <h3>${escapeHtml(source.title)}</h3>
          </div>
          <span class="badge">${escapeHtml(source.kind)}</span>
        </div>
        <div class="coding-context-grid">
          <div class="coding-context-card">
            <span class="workspace-label">Active code</span>
            <strong>${escapeHtml(activeCode?.name ?? 'No code selected')}</strong>
          </div>
          <div class="coding-context-card">
            <span class="workspace-label">Linked case</span>
            <strong>${escapeHtml(activeCase?.label ?? 'No case link')}</strong>
          </div>
          <div class="coding-context-card">
            <span class="workspace-label">Material type</span>
            <strong>${escapeHtml(source.contentType ?? source.kind)}</strong>
          </div>
        </div>
        <div class="coding-empty">No codable passages yet. Add source text, import a PDF, or save a media time range.</div>
      </div>
    `;
    statusEl.textContent = `Viewing ${source.title}.`;
    return;
  }

  view.innerHTML = `
    <div class="coding-source-sheet">
      <div class="coding-source-head">
        <div>
          <span class="output-kicker">Active source</span>
          <h3>${escapeHtml(source.title)}</h3>
          <p class="output-summary">${escapeHtml(summarizeText(source.contentText || '', 220))}</p>
        </div>
        <span class="badge">${escapeHtml(source.kind)}</span>
      </div>
      <div class="coding-context-grid">
        <div class="coding-context-card">
          <span class="workspace-label">Codable items</span>
          <strong>${items.length}</strong>
        </div>
        <div class="coding-context-card">
          <span class="workspace-label">Active code</span>
          <strong>${escapeHtml(activeCode?.name ?? 'No code selected')}</strong>
        </div>
        <div class="coding-context-card">
          <span class="workspace-label">Linked case</span>
          <strong>${escapeHtml(activeCase?.label ?? 'No case link')}</strong>
        </div>
      </div>
    </div>
  `;
  statusEl.textContent = `Viewing ${source.title}. ${items.length} codable item(s).`;
  for (const item of items) {
    const applications = item.existingSegment?.id ? getSourceCodeApplications(item.existingSegment.id) : [];
    let anchorLabel = item.kind;
    if (item.kind === 'text_range') anchorLabel = `${item.anchor.start}-${item.anchor.end}`;
    else if (item.kind === 'time_range') anchorLabel = `${formatDecimal((item.anchor.startMs ?? 0) / 1000, 1)}s-${formatDecimal((item.anchor.endMs ?? 0) / 1000, 1)}s`;
    else if (item.kind === 'page_region') anchorLabel = `Page ${item.anchor.page}`;

    const wrapper = document.createElement('div');
    wrapper.className = 'workspace-item coding-passage-card';
    wrapper.innerHTML = `
      <div class="coding-passage-head">
      <span class="workspace-meta">${escapeHtml(anchorLabel)}${item.existingSegment?.id ? ` · ${escapeHtml(item.existingSegment.id)}` : ' · unsaved passage'}</span>
        <span class="badge">${applications.length} code${applications.length === 1 ? '' : 's'}</span>
      </div>
      <blockquote class="coding-quote">${escapeHtml(item.text || '(no text)')}</blockquote>
      <div class="inline-actions coding-actions">
        <button type="button" class="small workspace-code-btn">Code with active code</button>
        ${item.existingSegment?.id ? `<button type="button" class="small workspace-use-segment-btn">Use segment ID</button>` : ''}
      </div>
      <div class="code-chip-row coding-badges">
        ${applications.length > 0
          ? applications.map((application) => {
            const code = state.selectedCodes.find((entry) => entry.id === application.codeId);
            return `<span class="badge">${escapeHtml(code?.name ?? application.codeId)}</span>`;
          }).join('')
          : '<span class="small-muted">No codes applied yet.</span>'}
      </div>
    `;
    wrapper.querySelector('.workspace-code-btn')?.addEventListener('click', () => {
      void applyWorkspaceCode(item);
    });
    wrapper.querySelector('.workspace-use-segment-btn')?.addEventListener('click', () => {
      const segmentInput = document.getElementById('ca-segment-id');
      if (segmentInput && item.existingSegment?.id) segmentInput.value = item.existingSegment.id;
    });
    view.appendChild(wrapper);
  }
}

function renderSourceWorkspace() {
  const sourceSelect = document.getElementById('workspace-source-select');
  const codeSelect = document.getElementById('workspace-code-select');
  const caseSelect = document.getElementById('workspace-case-select');
  const view = document.getElementById('source-workspace-view');
  const outline = document.getElementById('workspace-document-outline');
  const inspector = document.getElementById('workspace-inspector-view');
  const statusEl = document.getElementById('workspace-status');
  const mediaPanel = document.getElementById('workspace-media-panel');
  const mediaPlayer = document.getElementById('workspace-media-player');
  if (!sourceSelect || !codeSelect || !caseSelect || !view || !outline || !inspector || !statusEl || !mediaPanel || !mediaPlayer) return;

  sourceSelect.innerHTML = state.selectedSources.map((source) => `
    <option value="${escapeHtml(source.id)}">${escapeHtml(source.title)} (${escapeHtml(source.kind)})</option>
  `).join('');
  codeSelect.innerHTML = state.selectedCodes.map((code) => `
    <option value="${escapeHtml(code.id)}">${escapeHtml(code.name)}</option>
  `).join('');
  caseSelect.innerHTML = ['<option value="">No case link</option>'].concat(
    state.selectedCases.map((caseEntity) => `<option value="${escapeHtml(caseEntity.id)}">${escapeHtml(caseEntity.label)}</option>`)
  ).join('');

  sourceSelect.value = state.activeSourceId ?? '';
  codeSelect.value = state.workspaceSelectedCodeId ?? '';
  caseSelect.value = state.workspaceSelectedCaseId ?? '';
  const segmentSourceEl = document.getElementById('segment-source-id');
  const codeInputEl = document.getElementById('ca-code-id');
  const caseInputEl = document.getElementById('ca-case-id');
  if (segmentSourceEl) segmentSourceEl.value = state.activeSourceId ?? '';
  if (codeInputEl) codeInputEl.value = state.workspaceSelectedCodeId ?? '';
  if (caseInputEl) caseInputEl.value = state.workspaceSelectedCaseId ?? '';

  const source = getActiveSource();
  const activeCode = state.selectedCodes.find((entry) => entry.id === state.workspaceSelectedCodeId) ?? null;
  const activeCase = state.selectedCases.find((entry) => entry.id === state.workspaceSelectedCaseId) ?? null;
  if (!source) {
    view.innerHTML = '<div class="coding-empty">No source selected.</div>';
    outline.innerHTML = '<div class="coding-empty">Passages will appear here after you choose a source.</div>';
    inspector.innerHTML = '<div class="coding-empty">Inspector details appear when a passage is selected.</div>';
    statusEl.textContent = 'Select a source to start coding.';
    mediaPanel.style.display = 'none';
    mediaPlayer.innerHTML = '';
    return;
  }

  const isMediaSource = (source.kind === 'audio' || source.kind === 'video') && !!source.contentUrl;
  mediaPanel.style.display = isMediaSource ? '' : 'none';
  if (isMediaSource) {
    mediaPlayer.innerHTML = source.kind === 'video'
      ? `<div class="media-shell"><video id="workspace-media-element" controls src="${escapeHtml(source.contentUrl)}"></video></div>`
      : `<div class="media-shell"><audio id="workspace-media-element" controls src="${escapeHtml(source.contentUrl)}"></audio></div>`;
  } else {
    mediaPlayer.innerHTML = '';
  }

  const items = getWorkspaceItems(source);
  const sourceSummary = source.contentText
    ? summarizeText(source.contentText, 240)
    : 'This source is ready for direct passage coding, PDF page review, or media segment capture.';

  if (items.length === 0) {
    outline.innerHTML = '<div class="coding-empty">No passage map yet for this source.</div>';
    inspector.innerHTML = `
      <div class="coding-context-grid coding-context-grid-single">
        <div class="coding-context-card">
          <span class="workspace-label">Active code</span>
          <strong>${escapeHtml(activeCode?.name ?? 'No code selected')}</strong>
        </div>
        <div class="coding-context-card">
          <span class="workspace-label">Linked case</span>
          <strong>${escapeHtml(activeCase?.label ?? 'No case link')}</strong>
        </div>
        <div class="coding-context-card">
          <span class="workspace-label">Material type</span>
          <strong>${escapeHtml(source.contentType ?? source.kind)}</strong>
        </div>
      </div>
    `;
    view.innerHTML = `
      <div class="coding-source-sheet">
        <div class="coding-source-head">
          <div>
            <span class="output-kicker">Active source</span>
            <h3>${escapeHtml(source.title)}</h3>
          </div>
          <span class="badge">${escapeHtml(source.kind)}</span>
        </div>
        <p class="coding-source-summary">${escapeHtml(sourceSummary)}</p>
        <div class="coding-empty">No codable passages yet. Add source text, import a PDF, or save a media time range.</div>
      </div>
    `;
    statusEl.textContent = `Viewing ${source.title}.`;
    return;
  }

  const validItemKeys = new Set(items.map((item) => workspaceItemKey(item)));
  if (!validItemKeys.has(state.workspaceSelectedItemKey)) {
    state.workspaceSelectedItemKey = workspaceItemKey(items[0]);
  }
  const selectedItem = items.find((item) => workspaceItemKey(item) === state.workspaceSelectedItemKey) ?? items[0];
  const selectedIndex = items.findIndex((item) => workspaceItemKey(item) === workspaceItemKey(selectedItem));
  const selectedApplications = selectedItem.existingSegment?.id ? getSourceCodeApplications(selectedItem.existingSegment.id) : [];
  let selectedAnchorLabel = selectedItem.kind;
  if (selectedItem.kind === 'text_range') selectedAnchorLabel = `${selectedItem.anchor.start}-${selectedItem.anchor.end}`;
  else if (selectedItem.kind === 'time_range') selectedAnchorLabel = `${formatDecimal((selectedItem.anchor.startMs ?? 0) / 1000, 1)}s-${formatDecimal((selectedItem.anchor.endMs ?? 0) / 1000, 1)}s`;
  else if (selectedItem.kind === 'page_region') selectedAnchorLabel = `Page ${selectedItem.anchor.page}`;
  const selectedSegmentLabel = selectedItem.existingSegment?.id ?? 'Unsaved passage';
  const selectedHasActiveCode = Boolean(activeCode && selectedApplications.some((application) => application.codeId === activeCode.id));
  const previousItem = selectedIndex > 0 ? items[selectedIndex - 1] : null;
  const nextItem = selectedIndex >= 0 && selectedIndex < items.length - 1 ? items[selectedIndex + 1] : null;
  const activeCodeStyle = getCodeToneStyle(activeCode?.colorToken);
  const contextBefore = selectedItem.kind === 'text_range' && source.contentText
    ? summarizeText(source.contentText.slice(Math.max(0, (selectedItem.anchor.start ?? 0) - 180), selectedItem.anchor.start ?? 0), 180)
    : (previousItem ? summarizeText(previousItem.text || '(no text)', 180) : 'No earlier passage in view.');
  const contextAfter = selectedItem.kind === 'text_range' && source.contentText
    ? summarizeText(source.contentText.slice(selectedItem.anchor.end ?? 0, Math.min(source.contentText.length, (selectedItem.anchor.end ?? 0) + 180)), 180)
    : (nextItem ? summarizeText(nextItem.text || '(no text)', 180) : 'No later passage in view.');
  const overlappingSegments = selectedItem.kind === 'text_range'
    ? getOverlappingTextSegments(source.id, selectedItem.anchor.start ?? 0, selectedItem.anchor.end ?? 0)
    : [];
  if (
    state.workspaceFocusedSegmentId
    && !overlappingSegments.some((segment) => segment.id === state.workspaceFocusedSegmentId)
    && selectedItem.existingSegment?.id !== state.workspaceFocusedSegmentId
  ) {
    state.workspaceFocusedSegmentId = null;
  }
  const focusedInlineSegment = overlappingSegments.find((segment) => segment.id === state.workspaceFocusedSegmentId)
    ?? (selectedItem.existingSegment?.id === state.workspaceFocusedSegmentId ? selectedItem.existingSegment : null);
  const inspectorSegment = focusedInlineSegment ?? selectedItem.existingSegment ?? null;
  const inspectorApplications = inspectorSegment?.id ? getSourceCodeApplications(inspectorSegment.id) : selectedApplications;
  const inspectorHasActiveCode = Boolean(activeCode && inspectorApplications.some((application) => application.codeId === activeCode.id));
  const inspectorAnchorLabel = inspectorSegment?.anchor?.kind === 'text_range'
    ? `${inspectorSegment.anchor.start}-${inspectorSegment.anchor.end}`
    : selectedAnchorLabel;
  const inspectorSegmentLabel = inspectorSegment?.id ?? selectedSegmentLabel;
  const actionableItem = inspectorSegment
    ? {
      ...selectedItem,
      kind: inspectorSegment.kind ?? selectedItem.kind,
      anchor: inspectorSegment.anchor ?? selectedItem.anchor,
      text: inspectorSegment.text ?? selectedItem.text,
      existingSegment: inspectorSegment
    }
    : selectedItem;
  const getActionableSegmentItem = (segmentId) => {
    const segment = overlappingSegments.find((entry) => entry.id === segmentId)
      ?? state.selectedSegments.find((entry) => entry.id === segmentId)
      ?? null;
    if (!segment) return null;
    return {
      ...selectedItem,
      kind: segment.kind ?? selectedItem.kind,
      anchor: segment.anchor ?? selectedItem.anchor,
      text: segment.text ?? selectedItem.text,
      existingSegment: segment
    };
  };
  const appliedCodeMarkup = inspectorApplications.length > 0
    ? inspectorApplications.map((application) => {
      const code = state.selectedCodes.find((entry) => entry.id === application.codeId);
      return `<span class="badge coding-code-pill" style="${getCodeToneStyle(code?.colorToken)}">${escapeHtml(code?.name ?? application.codeId)}</span>`;
    }).join('')
    : '<span class="small-muted">No codes applied yet.</span>';
  const boundaryMarkup = selectedItem.kind === 'text_range'
    ? `
      <div class="coding-boundary-bar">
        <span class="badge">Start ${selectedItem.anchor.start ?? 0}</span>
        <span class="badge">End ${selectedItem.anchor.end ?? 0}</span>
        <span class="badge">Span ${Math.max(0, (selectedItem.anchor.end ?? 0) - (selectedItem.anchor.start ?? 0))} chars</span>
        <span class="badge">${overlappingSegments.length} anchored range${overlappingSegments.length === 1 ? '' : 's'}</span>
      </div>
    `
    : '';
  const readingMarkup = selectedItem.kind === 'text_range' && source.contentText
    ? (() => {
      const start = Math.max(0, selectedItem.anchor.start ?? 0);
      const end = Math.max(start, selectedItem.anchor.end ?? start);
      const before = source.contentText.slice(Math.max(0, start - 220), start);
      const focus = source.contentText.slice(start, end) || selectedItem.text || '(no text)';
      const after = source.contentText.slice(end, Math.min(source.contentText.length, end + 220));
      return `
        <div class="coding-reading-page" style="${activeCodeStyle}">
          <p class="coding-reading-context">${escapeHtml(before) || '<span class="small-muted">No earlier document context.</span>'}</p>
          <div class="coding-evidence-strip">
            <span class="workspace-label">Evidence markers</span>
            <div class="code-chip-row coding-badges">
              ${appliedCodeMarkup}
            </div>
          </div>
          <p class="coding-reading-focus"><mark class="coding-highlight"><span id="workspace-focus-text">${renderAnnotatedExcerpt(focus, start, overlappingSegments)}</span></mark></p>
          <div id="workspace-inline-inspector" class="coding-inline-mini-inspector" hidden></div>
          <p class="coding-reading-context">${escapeHtml(after) || '<span class="small-muted">No later document context.</span>'}</p>
        </div>
      `;
    })()
    : `<blockquote class="coding-quote coding-quote-plain">${escapeHtml(selectedItem.text || '(no text)')}</blockquote>`;

  outline.innerHTML = '';
  const codedItemCount = items.filter((item) => (item.existingSegment?.id ? getSourceCodeApplications(item.existingSegment.id).length : 0) > 0).length;
  const outlineSummary = document.createElement('div');
  outlineSummary.className = 'coding-outline-summary';
  outlineSummary.innerHTML = `
    <span class="workspace-label">Passage navigator</span>
    <div class="coding-outline-summary-grid">
      <span class="badge">${items.length} passages</span>
      <span class="badge">${codedItemCount} coded</span>
      <span class="badge">${overlappingSegments.length} anchored here</span>
    </div>
  `;
  outline.appendChild(outlineSummary);
  for (const item of items) {
    const itemKey = workspaceItemKey(item);
    const applications = item.existingSegment?.id ? getSourceCodeApplications(item.existingSegment.id) : [];
    const memoCount = item.existingSegment?.id ? countSegmentMemos(item.existingSegment.id) : 0;
    const leadCode = applications.length > 0
      ? state.selectedCodes.find((entry) => entry.id === applications[0].codeId)
      : activeCode;
    const previewCodes = applications
      .map((application) => state.selectedCodes.find((entry) => entry.id === application.codeId))
      .filter(Boolean)
      .slice(0, 2);
    const evidenceScore = Math.min(100, applications.length * 28 + memoCount * 14);
    let anchorLabel = item.kind;
    if (item.kind === 'text_range') anchorLabel = `${item.anchor.start}-${item.anchor.end}`;
    else if (item.kind === 'time_range') anchorLabel = `${formatDecimal((item.anchor.startMs ?? 0) / 1000, 1)}s-${formatDecimal((item.anchor.endMs ?? 0) / 1000, 1)}s`;
    else if (item.kind === 'page_region') anchorLabel = `Page ${item.anchor.page}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `coding-outline-item${itemKey === state.workspaceSelectedItemKey ? ' active' : ''}${applications.length > 0 ? ' has-evidence' : ''}`;
    button.style.cssText = getCodeToneStyle(leadCode?.colorToken);
    button.innerHTML = `
      <span class="coding-outline-meta">${escapeHtml(anchorLabel)}</span>
      <strong>${escapeHtml(summarizeText(item.text || '(no text)', 76))}</strong>
      <div class="coding-outline-evidence">
        <span class="small-muted">${applications.length} code${applications.length === 1 ? '' : 's'}${memoCount ? ` · ${memoCount} memo${memoCount === 1 ? '' : 's'}` : ''}</span>
        <span class="coding-outline-meter" aria-hidden="true"><span style="width:${evidenceScore}%"></span></span>
      </div>
      ${previewCodes.length > 0 ? `
        <div class="code-chip-row coding-outline-chips">
          ${previewCodes.map((code) => `<span class="badge coding-code-pill" style="${getCodeToneStyle(code?.colorToken)}">${escapeHtml(code?.name ?? '')}</span>`).join('')}
        </div>
      ` : ''}
    `;
    button.addEventListener('click', () => {
      state.workspaceFocusedSegmentId = null;
      state.workspaceSelectedItemKey = itemKey;
      renderSourceWorkspace();
    });
    outline.appendChild(button);
  }

  view.innerHTML = `
    <div class="coding-source-sheet">
      <div class="coding-source-head">
        <div>
          <span class="output-kicker">Active source</span>
          <h3>${escapeHtml(source.title)}</h3>
          <p class="coding-source-summary">${escapeHtml(sourceSummary)}</p>
        </div>
        <span class="badge">${escapeHtml(source.kind)}</span>
      </div>
      <div class="coding-context-grid">
        <div class="coding-context-card">
          <span class="workspace-label">Codable items</span>
          <strong>${items.length}</strong>
        </div>
        <div class="coding-context-card">
          <span class="workspace-label">Active code</span>
          <strong>${escapeHtml(activeCode?.name ?? 'No code selected')}</strong>
        </div>
        <div class="coding-context-card">
          <span class="workspace-label">Linked case</span>
          <strong>${escapeHtml(activeCase?.label ?? 'No case link')}</strong>
        </div>
      </div>
      <div class="coding-status-row">
        <span class="badge coding-code-pill${inspectorHasActiveCode ? ' green' : ''}" style="${activeCodeStyle}">${inspectorHasActiveCode ? 'Active code already applied' : 'Active code not yet applied'}</span>
        <span class="small-muted">Selected passage ${selectedIndex + 1} of ${items.length}</span>
      </div>
      <div class="workspace-item coding-passage-card coding-passage-focus">
        <div class="coding-passage-head">
          <div>
            <span class="workspace-meta">${escapeHtml(inspectorAnchorLabel)}</span>
            <strong>${escapeHtml(inspectorSegmentLabel)}</strong>
          </div>
          <span class="badge">${inspectorApplications.length} code${inspectorApplications.length === 1 ? '' : 's'}</span>
        </div>
        ${readingMarkup}
        <div class="coding-inline-toolbar">
          <div class="coding-inline-toolbar-status">
            ${activeCode
              ? `<span class="badge coding-code-pill" style="${activeCodeStyle}">Active code: ${escapeHtml(activeCode.name)}</span>`
              : '<span class="small-muted">Select an active code to apply directly in the reader.</span>'}
            <span class="small-muted">${inspectorSegment?.id ? `Inspector focused on ${escapeHtml(inspectorSegment.id)}.` : (selectedItem.existingSegment?.id ? 'Segment memo can target this passage directly.' : 'This passage is not yet saved as its own segment.')}</span>
          </div>
          ${boundaryMarkup}
          <div class="coding-selection-strip">
            <span id="workspace-selection-status" class="small-muted">Drag-select text inside the highlighted excerpt to create a tighter coded range.</span>
            <div class="inline-actions">
              <button type="button" class="small workspace-code-selection-btn">Code selection</button>
              <button type="button" class="small workspace-save-selection-btn">Save selection as segment</button>
              <button type="button" class="small workspace-clear-selection-btn">Clear selection</button>
            </div>
          </div>
          <div class="inline-actions coding-actions">
            <button type="button" class="small workspace-prev-btn"${previousItem ? '' : ' disabled'}>Previous</button>
            <button type="button" class="small workspace-next-btn"${nextItem ? '' : ' disabled'}>Next</button>
            <button type="button" class="small workspace-copy-excerpt-btn">Copy excerpt</button>
            <button type="button" class="small workspace-copy-context-btn">Copy with context</button>
            <button type="button" class="small workspace-memo-btn">Target memo</button>
            <button type="button" class="small workspace-code-btn">Code with active code</button>
            ${inspectorSegment?.id ? '<button type="button" class="small workspace-use-segment-btn">Use segment ID</button>' : ''}
          </div>
        </div>
        <div class="code-chip-row coding-badges">
          ${appliedCodeMarkup}
        </div>
        <div class="coding-context-panels">
          <div class="coding-context-fragment">
            <span class="workspace-label">Before</span>
            <p>${escapeHtml(contextBefore)}</p>
          </div>
          <div class="coding-context-fragment">
            <span class="workspace-label">After</span>
            <p>${escapeHtml(contextAfter)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
  statusEl.textContent = `Viewing ${source.title}. ${items.length} codable item(s).`;
  inspector.innerHTML = `
    <div class="coding-context-grid coding-context-grid-single">
      <div class="coding-context-card">
        <span class="workspace-label">Passage anchor</span>
        <strong>${escapeHtml(inspectorAnchorLabel)}</strong>
      </div>
      <div class="coding-context-card">
        <span class="workspace-label">Segment ID</span>
        <strong>${escapeHtml(inspectorSegmentLabel)}</strong>
      </div>
      <div class="coding-context-card">
        <span class="workspace-label">Code count</span>
        <strong>${inspectorApplications.length}</strong>
      </div>
    </div>
    <div class="coding-inspector-block">
      <span class="workspace-label">Coding status</span>
      <p class="coding-source-summary">${inspectorHasActiveCode ? 'The active code is already attached to the current focused slice.' : 'The active code has not been attached to the current focused slice yet.'}</p>
    </div>
    <div class="coding-inspector-block">
      <span class="workspace-label">Source summary</span>
      <p class="coding-source-summary">${escapeHtml(sourceSummary)}</p>
    </div>
    <div class="coding-inspector-block">
      <span class="workspace-label">Passage context</span>
      <div class="coding-context-fragment">
        <span class="workspace-meta">Before</span>
        <p>${escapeHtml(contextBefore)}</p>
      </div>
      <div class="coding-context-fragment">
        <span class="workspace-meta">After</span>
        <p>${escapeHtml(contextAfter)}</p>
      </div>
    </div>
    <div class="coding-inspector-block">
      <span class="workspace-label">Applied codes</span>
      <div class="code-chip-row coding-badges">
        ${appliedCodeMarkup}
      </div>
    </div>
    <div class="coding-inspector-block">
      <span class="workspace-label">Quick actions</span>
      <div class="inline-actions">
        <button type="button" class="small workspace-code-btn">Code with active code</button>
        ${inspectorSegment?.id ? '<button type="button" class="small workspace-use-segment-btn">Use segment ID</button>' : ''}
      </div>
    </div>
  `;
  view.querySelector('.workspace-code-btn')?.addEventListener('click', () => {
    void applyWorkspaceCode(actionableItem);
  });
  view.querySelector('.workspace-prev-btn')?.addEventListener('click', () => {
    if (!previousItem) return;
    state.workspaceFocusedSegmentId = null;
    state.workspaceSelectedItemKey = workspaceItemKey(previousItem);
    renderSourceWorkspace();
  });
  view.querySelector('.workspace-next-btn')?.addEventListener('click', () => {
    if (!nextItem) return;
    state.workspaceFocusedSegmentId = null;
    state.workspaceSelectedItemKey = workspaceItemKey(nextItem);
    renderSourceWorkspace();
  });
  view.querySelector('.workspace-copy-excerpt-btn')?.addEventListener('click', async () => {
    try {
      statusEl.textContent = await copyTextToClipboard(selectedItem.text || '', 'Excerpt copied to clipboard.');
    } catch (err) {
      statusEl.textContent = `Clipboard error: ${err.message}`;
    }
  });
  view.querySelector('.workspace-copy-context-btn')?.addEventListener('click', async () => {
    const payload = `Before:\n${contextBefore}\n\nExcerpt:\n${selectedItem.text || ''}\n\nAfter:\n${contextAfter}`;
    try {
      statusEl.textContent = await copyTextToClipboard(payload, 'Excerpt with context copied to clipboard.');
    } catch (err) {
      statusEl.textContent = `Clipboard error: ${err.message}`;
    }
  });
  const focusTextEl = document.getElementById('workspace-focus-text');
  const selectionStatusEl = document.getElementById('workspace-selection-status');
  const inlineInspectorEl = document.getElementById('workspace-inline-inspector');
  const hideInlineInspector = () => {
    if (!inlineInspectorEl) return;
    inlineInspectorEl.hidden = true;
    inlineInspectorEl.innerHTML = '';
  };
  const maybeHideInlineInspector = () => {
    window.setTimeout(() => {
      if (!inlineInspectorEl?.matches(':hover') && !state.workspaceFocusedSegmentId) hideInlineInspector();
    }, 120);
  };
  const showInlineInspector = (segmentEl) => {
    if (!inlineInspectorEl) return;
    const parentRect = inlineInspectorEl.parentElement?.getBoundingClientRect();
    const rect = segmentEl.getBoundingClientRect();
    if (!parentRect) return;
    const segmentId = segmentEl.dataset.workspaceSegmentId ?? '';
    const miniItem = getActionableSegmentItem(segmentId);
    const miniSegment = miniItem?.existingSegment ?? null;
    const miniApplications = miniSegment?.id ? getSourceCodeApplications(miniSegment.id) : [];
    const miniCodeMarkup = miniApplications.length > 0
      ? miniApplications.map((application) => {
        const code = state.selectedCodes.find((entry) => entry.id === application.codeId);
        return `<span class="badge coding-code-pill" style="${getCodeToneStyle(code?.colorToken)}">${escapeHtml(code?.name ?? application.codeId)}</span>`;
      }).join('')
      : '<span class="small-muted">No codes yet.</span>';
    const appliedCodeIds = new Set(miniApplications.map((application) => application.codeId));
    const quickCodes = [
      ...state.selectedCodes.filter((code) => code.id === state.workspaceSelectedCodeId),
      ...state.selectedCodes.filter((code) => appliedCodeIds.has(code.id) && code.id !== state.workspaceSelectedCodeId),
      ...state.selectedCodes.filter((code) => !appliedCodeIds.has(code.id) && code.id !== state.workspaceSelectedCodeId)
    ].slice(0, 6);
    inlineInspectorEl.innerHTML = `
      <span class="workspace-label">Anchored slice</span>
      <strong>${escapeHtml(segmentId || 'segment')}</strong>
      <span class="workspace-meta">${escapeHtml(segmentEl.dataset.workspaceSegmentAnchor ?? '')}</span>
      <p>${escapeHtml(segmentEl.dataset.workspaceSegmentText ?? '')}</p>
      <div class="code-chip-row coding-badges">
        ${miniCodeMarkup}
      </div>
      <div class="coding-mini-quick-codes">
        ${quickCodes.map((code) => `
          <button
            type="button"
            class="small coding-mini-code-btn${appliedCodeIds.has(code.id) ? ' applied' : ''}"
            data-mini-code-id="${escapeHtml(code.id)}"
            style="${getCodeToneStyle(code.colorToken)}"
          >${escapeHtml(code.name)}</button>
        `).join('')}
      </div>
      <div class="inline-actions coding-mini-actions">
        <button type="button" class="small mini-focus-segment-btn">Focus</button>
        <button type="button" class="small mini-code-segment-btn"${state.workspaceSelectedCodeId ? '' : ' disabled'}>Code active</button>
        <button type="button" class="small mini-memo-segment-btn"${miniSegment?.id ? '' : ' disabled'}>Target memo</button>
        <button type="button" class="small mini-use-segment-btn"${miniSegment?.id ? '' : ' disabled'}>Use ID</button>
      </div>
    `;
    inlineInspectorEl.hidden = false;
    inlineInspectorEl.style.left = `${Math.max(0, rect.left - parentRect.left)}px`;
    inlineInspectorEl.style.top = `${Math.max(0, rect.bottom - parentRect.top + 10)}px`;
    inlineInspectorEl.querySelector('.mini-focus-segment-btn')?.addEventListener('click', () => {
      if (!segmentId) return;
      state.workspaceFocusedSegmentId = segmentId;
      renderSourceWorkspace();
    });
    inlineInspectorEl.querySelector('.mini-code-segment-btn')?.addEventListener('click', () => {
      if (!miniItem || !state.workspaceSelectedCodeId) return;
      void applyWorkspaceCode(miniItem);
    });
    inlineInspectorEl.querySelectorAll('[data-mini-code-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const codeId = button.dataset.miniCodeId;
        if (!miniItem || !codeId) return;
        state.workspaceSelectedCodeId = codeId;
        const codeEl = document.getElementById('ca-code-id');
        if (codeEl) codeEl.value = codeId;
        void applyWorkspaceCode(miniItem, codeId);
      });
    });
    inlineInspectorEl.querySelector('.mini-memo-segment-btn')?.addEventListener('click', () => {
      if (!miniSegment?.id) return;
      setMemoTarget('segment', miniSegment.id);
      statusEl.textContent = `Memo target set to ${miniSegment.id}.`;
    });
    inlineInspectorEl.querySelector('.mini-use-segment-btn')?.addEventListener('click', () => {
      if (!miniSegment?.id) return;
      const segmentInput = document.getElementById('ca-segment-id');
      if (segmentInput) segmentInput.value = miniSegment.id;
      statusEl.textContent = `Segment ID ${miniSegment.id} loaded into coding form.`;
    });
  };
  inlineInspectorEl?.addEventListener('mouseleave', () => {
    if (!state.workspaceFocusedSegmentId) hideInlineInspector();
  });
  focusTextEl?.querySelectorAll('[data-workspace-segment-id]').forEach((segmentEl) => {
    const focusSegment = () => {
      if (window.getSelection()?.toString()) return;
      const segmentId = segmentEl.dataset.workspaceSegmentId;
      if (!segmentId) return;
      state.workspaceFocusedSegmentId = segmentId;
      renderSourceWorkspace();
    };
    segmentEl.addEventListener('mouseenter', () => showInlineInspector(segmentEl));
    segmentEl.addEventListener('focus', () => showInlineInspector(segmentEl));
    segmentEl.addEventListener('mouseleave', () => {
      if (state.workspaceFocusedSegmentId !== segmentEl.dataset.workspaceSegmentId) maybeHideInlineInspector();
    });
    segmentEl.addEventListener('blur', () => {
      if (state.workspaceFocusedSegmentId !== segmentEl.dataset.workspaceSegmentId) maybeHideInlineInspector();
    });
    segmentEl.addEventListener('click', focusSegment);
    segmentEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        focusSegment();
      }
    });
  });
  if (state.workspaceFocusedSegmentId) {
    const activeSegmentEl = focusTextEl?.querySelector(`[data-workspace-segment-id="${CSS.escape(state.workspaceFocusedSegmentId)}"]`);
    if (activeSegmentEl) showInlineInspector(activeSegmentEl);
  }
  const readSelection = () => {
    if (!focusTextEl || selectedItem.kind !== 'text_range') return null;
    return getWorkspaceSelection(focusTextEl, selectedItem.anchor.start ?? 0);
  };
  const syncSelectionStatus = () => {
    if (!selectionStatusEl) return;
    const selection = readSelection();
    selectionStatusEl.textContent = selection
      ? `Selection ${selection.absoluteStart}-${selection.absoluteEnd} (${selection.end - selection.start} chars).`
      : 'Drag-select text inside the highlighted excerpt to create a tighter coded range.';
  };
  focusTextEl?.addEventListener('mouseup', syncSelectionStatus);
  focusTextEl?.addEventListener('keyup', syncSelectionStatus);
  view.querySelector('.workspace-code-selection-btn')?.addEventListener('click', async () => {
    const selection = readSelection();
    if (!selection) {
      statusEl.textContent = 'Select text inside the highlighted excerpt first.';
      return;
    }
    if (!state.workspaceSelectedCodeId) {
      statusEl.textContent = 'Choose an active code first.';
      return;
    }
    statusEl.textContent = 'Saving coded selection...';
    try {
      const segment = await createAndCodeSegment({
        sourceId: source.id,
        kind: 'text_range',
        anchor: { kind: 'text_range', start: selection.absoluteStart, end: selection.absoluteEnd },
        text: selection.text
      });
      await loadSelectedProjectData();
      state.workspaceFocusedSegmentId = segment.id;
      renderAll();
      statusEl.textContent = 'Selection saved and coded.';
    } catch (err) {
      statusEl.textContent = `Workspace error: ${err.message}`;
    }
  });
  view.querySelector('.workspace-save-selection-btn')?.addEventListener('click', async () => {
    const selection = readSelection();
    if (!selection) {
      statusEl.textContent = 'Select text inside the highlighted excerpt first.';
      return;
    }
    statusEl.textContent = 'Saving selection as segment...';
    try {
      const env = await postJson(`${API_BASE}/segments`, {
        projectId: state.selectedProjectId,
        sourceId: source.id,
        kind: 'text_range',
        anchor: { kind: 'text_range', start: selection.absoluteStart, end: selection.absoluteEnd },
        text: selection.text
      });
      const segment = env.data.segment;
      const segmentInput = document.getElementById('ca-segment-id');
      if (segmentInput) segmentInput.value = segment.id;
      await loadSelectedProjectData();
      state.workspaceFocusedSegmentId = segment.id;
      renderAll();
      statusEl.textContent = `Selection saved as ${segment.id}.`;
    } catch (err) {
      statusEl.textContent = `Workspace error: ${err.message}`;
    }
  });
  view.querySelector('.workspace-clear-selection-btn')?.addEventListener('click', () => {
    window.getSelection()?.removeAllRanges();
    syncSelectionStatus();
  });
  view.querySelector('.workspace-memo-btn')?.addEventListener('click', () => {
    if (inspectorSegment?.id) {
      setMemoTarget('segment', inspectorSegment.id);
      statusEl.textContent = `Memo target set to ${inspectorSegment.id}.`;
    } else {
      setMemoTarget('source', source.id);
      statusEl.textContent = `Memo target set to source ${source.title}.`;
    }
  });
  view.querySelector('.workspace-use-segment-btn')?.addEventListener('click', () => {
    const segmentInput = document.getElementById('ca-segment-id');
    if (segmentInput && inspectorSegment?.id) segmentInput.value = inspectorSegment.id;
  });
  inspector.querySelector('.workspace-code-btn')?.addEventListener('click', () => {
    void applyWorkspaceCode(actionableItem);
  });
  inspector.querySelector('.workspace-use-segment-btn')?.addEventListener('click', () => {
    const segmentInput = document.getElementById('ca-segment-id');
    if (segmentInput && inspectorSegment?.id) segmentInput.value = inspectorSegment.id;
  });
}

function renderSavedTransforms() {
  const node = document.getElementById('saved-transforms-list');
  if (!node) return;
  if (state.savedTransforms.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No saved transforms yet.</li>';
    return;
  }

  node.innerHTML = '';
  for (const transform of state.savedTransforms) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(transform.label)}</span>
          <span class="source-meta">${escapeHtml(transform.id)}</span>
          <span class="source-meta">Filters: ${(transform.filters ?? []).length} · Recodes: ${(transform.recodes ?? []).length}</span>
        </div>
        <div class="inline-actions">
          <button type="button" class="small transform-load-btn">Load</button>
          <button type="button" class="small danger transform-delete-btn">Delete</button>
        </div>
      </div>
    `;
    li.querySelector('.transform-load-btn')?.addEventListener('click', async () => {
      state.selectedDatasetFilters = transform.filters ?? [];
      state.selectedDatasetRecodes = transform.recodes ?? [];
      state.compareMeansResult = null;
      state.tTestResult = null;
      state.pairedTTestResult = null;
      state.nonparametricResult = null;
      state.correlationResult = null;
      state.regressionResult = null;
      await refreshDatasetAnalysis({ includeCrosstab: false });
      renderAll();
    });
    li.querySelector('.transform-delete-btn')?.addEventListener('click', async () => {
      await getJson(`${API_BASE}/saved-transforms/${encodeURIComponent(transform.id)}?projectId=${encodeURIComponent(state.selectedProjectId)}`, {
        method: 'DELETE',
      });
      await loadSelectedProjectData();
      renderAll();
    });
    node.appendChild(li);
  }
}

function renderSavedAnalysisJobs() {
  const node = document.getElementById('saved-analysis-jobs-list');
  if (!node) return;
  if (state.lastQuantAnalysis) {
    updateAnalysisJobHelp(`Ready to save ${formatAnalysisKindLabel(state.lastQuantAnalysis.analysisKind)}.`);
  } else {
    updateAnalysisJobHelp();
  }
  if (state.savedAnalysisJobs.length === 0) {
    node.innerHTML = `
      <li class="interactive-list-item saved-analysis-cover">
        <div class="saved-analysis-cover-sheet">
          <span class="output-kicker">Analysis stack</span>
          <h3>${escapeHtml(state.selectedSummary?.project?.name ?? 'Current project')}</h3>
          <p class="output-summary">Saved procedures will appear here as a reusable output stack.</p>
        </div>
      </li>
      <li class="interactive-list-item empty">No saved analyses yet.</li>
    `;
    return;
  }

  const indexMarkup = state.savedAnalysisJobs.map((analysisJob, index) => `
    <li>
      <span>${index + 1}. ${escapeHtml(analysisJob.label)}</span>
      <span class="small-muted">${escapeHtml(formatAnalysisKindLabel(analysisJob.analysisKind))}</span>
    </li>
  `).join('');
  node.innerHTML = `
    <li class="interactive-list-item saved-analysis-cover">
      <div class="saved-analysis-cover-sheet">
        <span class="output-kicker">Analysis stack</span>
        <h3>${escapeHtml(state.selectedSummary?.project?.name ?? 'Current project')}</h3>
        <p class="output-summary">${state.savedAnalysisJobs.length} saved procedure${state.savedAnalysisJobs.length === 1 ? '' : 's'} are available for rerun and review.</p>
      </div>
    </li>
    <li class="interactive-list-item saved-analysis-index">
      <div class="saved-analysis-index-head">
        <h4>Index</h4>
        <span class="small-muted">Saved procedures</span>
      </div>
      <ol class="saved-analysis-index-list">${indexMarkup}</ol>
    </li>
  `;
  for (const analysisJob of state.savedAnalysisJobs) {
    const li = document.createElement('li');
    const descriptor = describeQuantAnalysis(analysisJob.analysisKind, analysisJob.analysis ?? {});
    li.className = 'interactive-list-item saved-analysis-entry';
    li.innerHTML = `
      <div class="saved-analysis-entry-head">
        <div>
          <span class="output-kicker">Saved analysis</span>
          <h4>${escapeHtml(analysisJob.label)}</h4>
          <p class="source-meta">${escapeHtml(formatAnalysisKindLabel(analysisJob.analysisKind))} | ${escapeHtml(analysisJob.updatedAt ?? analysisJob.createdAt ?? '')}</p>
        </div>
        <div class="inline-actions">
          <button type="button" class="small analysis-job-run-btn">Run</button>
          <button type="button" class="small danger analysis-job-delete-btn">Delete</button>
        </div>
      </div>
      <div class="saved-analysis-entry-body">
        <p class="source-meta">${escapeHtml(descriptor.detail)}</p>
      </div>
    `;
    li.querySelector('.analysis-job-run-btn')?.addEventListener('click', async () => {
      try {
        await runSavedAnalysisJob(analysisJob);
      } catch (err) {
        window.alert(`Saved analysis failed: ${err.message}`);
      }
    });
    li.querySelector('.analysis-job-delete-btn')?.addEventListener('click', async () => {
      await getJson(`${API_BASE}/saved-analysis-jobs/${encodeURIComponent(analysisJob.id)}?projectId=${encodeURIComponent(state.selectedProjectId)}`, {
        method: 'DELETE'
      });
      await loadSelectedProjectData();
      renderAll();
    });
    node.appendChild(li);
  }

  if (state.quantOutputHistory.length > 0) {
    const appendix = document.createElement('li');
    appendix.className = 'interactive-list-item saved-analysis-entry saved-analysis-appendix';
    appendix.innerHTML = `
      <div class="saved-analysis-entry-head">
        <div>
          <span class="output-kicker">Appendix</span>
          <h4>Recent output history</h4>
          <p class="source-meta">Pages recently opened in the quantitative output viewer.</p>
        </div>
      </div>
      <div class="saved-analysis-entry-body">
        <ol class="saved-analysis-index-list">
          ${state.quantOutputHistory.map((entry) => `
            <li>
              <span>${escapeHtml(entry.title)}</span>
              <span class="small-muted">${escapeHtml(entry.stamp)}</span>
            </li>
          `).join('')}
        </ol>
      </div>
    `;
    node.appendChild(appendix);
  }
}

function renderQuantOutputHistory() {
  const node = document.getElementById('quant-output-history-list');
  if (!node) return;
  if (state.quantOutputHistory.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">Recent outputs will appear here after you run a procedure.</li>';
    return;
  }

  node.innerHTML = '';
  for (const entry of state.quantOutputHistory) {
    const li = document.createElement('li');
    li.className = `interactive-list-item quant-history-item${entry.view === state.quantOutputView ? ' active' : ''}`;
    li.innerHTML = `
      <button type="button" class="quant-history-button">
        <span class="project-title">${escapeHtml(entry.title)}</span>
        <span class="source-meta">${escapeHtml(entry.detail)}</span>
        <span class="source-meta">${escapeHtml(entry.stamp)}</span>
      </button>
    `;
    li.querySelector('.quant-history-button')?.addEventListener('click', () => {
      state.quantOutputView = entry.view;
      syncWorkspaceMenus();
    });
    node.appendChild(li);
  }
}

function renderCompareMeans() {
  const outcomeEl = document.getElementById('compare-means-outcome-field');
  const groupEl = document.getElementById('compare-means-group-field');
  const runBtn = document.getElementById('run-compare-means-btn');
  const resultEl = document.getElementById('compare-means-result');
  if (!outcomeEl || !groupEl || !runBtn || !resultEl) return;

  {
    const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
    const groupOptions = getDatasetAnalysisFieldOptions();
    const previousOutcome = outcomeEl.value;
    const previousGroup = groupEl.value;
    outcomeEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    groupEl.innerHTML = groupOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    if (numericOptions.length > 0) {
      outcomeEl.value = numericOptions.some((option) => option.key === previousOutcome) ? previousOutcome : numericOptions[0].key;
    }
    if (groupOptions.length > 0) {
      groupEl.value = groupOptions.some((option) => option.key === previousGroup && option.key !== outcomeEl.value)
        ? previousGroup
        : (groupOptions.find((option) => option.key !== outcomeEl.value)?.key ?? groupOptions[0].key);
    }
    runBtn.disabled = numericOptions.length === 0 || groupOptions.length < 2;

    if (numericOptions.length === 0 || groupOptions.length < 2) {
      resultEl.innerHTML = '<p>Add at least one numeric field and one grouping field before running compare means.</p>';
      return;
    }

    if (!state.compareMeansResult) {
      resultEl.innerHTML = '<p>Choose a numeric outcome and a grouping field.</p>';
      return;
    }

      const result = state.compareMeansResult;
      const postHocComparisons = Array.isArray(result.postHocComparisons) ? result.postHocComparisons : [];
      const meanChartItems = result.groups.map((group) => ({ label: group.groupValue, value: group.mean }));
      resultEl.innerHTML = buildOutputViewer({
      eyebrow: 'Compare means',
      title: `${result.outcomeLabel} by ${result.groupLabel}`,
      summary: result.anova
        ? `ANOVA F ${formatStatValue(result.anova.fStatistic, 4)} with p ${formatStatValue(result.anova.pValue, 4)}.`
        : 'ANOVA summary requires at least two groups with variation.',
      metrics: [
        { label: 'Valid rows', value: result.validCaseCount },
        { label: 'Missing rows', value: result.missingCaseCount },
        { label: 'Weighted total', value: result.weightedValidCaseCount ? formatDecimal(result.weightedValidCaseCount, 3) : 'n/a' },
        { label: 'Omega squared', value: formatStatValue(result.anova?.omegaSquared, 4) }
      ],
      sections: [
        buildOutputSection(
          'Group summaries',
          buildOutputTable(
            [escapeHtml(result.groupLabel), 'N', 'Mean', 'Std dev', 'Min', 'Max'],
            result.groups.map((group) => [
              escapeHtml(group.groupValue),
              String(group.count),
              formatDecimal(group.mean, 3),
              formatStatValue(group.stdDev, 3),
              formatDecimal(group.min, 3),
              formatDecimal(group.max, 3)
            ])
          )
        ),
          postHocComparisons.length > 0
            ? buildOutputSection(
              'Post-hoc comparisons',
            buildOutputTable(
              ['Comparison', 'Mean diff', 'SE', 'Statistic', 'df', 'p', 'Adj p', '95% CI', 'Effect size'],
              postHocComparisons.map((comparison) => [
                `${escapeHtml(comparison.groupA)} vs ${escapeHtml(comparison.groupB)}`,
                formatStatValue(comparison.meanDifference, 4),
                formatStatValue(comparison.standardError, 4),
                formatStatValue(comparison.statistic, 4),
                formatStatValue(comparison.degreesOfFreedom, 3),
                formatStatValue(comparison.pValue, 4),
                formatStatValue(comparison.adjustedPValue, 4),
                formatConfidenceInterval(comparison.confidenceInterval, 4),
                formatStatValue(comparison.effectSize, 4)
              ])
            )
              )
            : '',
          meanChartItems.length > 0
            ? buildOutputSection(
              'Group mean profile',
              `<div class="chart-grid">${buildChartCard('Group means', buildSvgBarChart(meanChartItems, { color: '#8fb3ff', formatter: (value) => formatDecimal(value, 2) }), 'Mean outcome value by group.')}</div>`
            )
            : '',
          buildChartSuggestionsSection([
            'Mean profile bar chart by group',
            'Confidence-interval plot for post-hoc comparisons',
            'Box plot by group for distribution review'
          ]),
          buildAssumptionsSection(result.assumptions)
        ].filter(Boolean)
      });
    return;
  }

  const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
  const groupOptions = getDatasetAnalysisFieldOptions();
  const previousOutcome = outcomeEl.value;
  const previousGroup = groupEl.value;
  outcomeEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  groupEl.innerHTML = groupOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  if (numericOptions.length > 0) {
    outcomeEl.value = numericOptions.some((option) => option.key === previousOutcome) ? previousOutcome : numericOptions[0].key;
  }
  if (groupOptions.length > 0) {
    groupEl.value = groupOptions.some((option) => option.key === previousGroup && option.key !== outcomeEl.value)
      ? previousGroup
      : (groupOptions.find((option) => option.key !== outcomeEl.value)?.key ?? groupOptions[0].key);
  }
  runBtn.disabled = numericOptions.length === 0 || groupOptions.length < 2;

  if (numericOptions.length === 0 || groupOptions.length < 2) {
    resultEl.innerHTML = '<p>Add at least one numeric field and one grouping field before running compare means.</p>';
    return;
  }

  if (!state.compareMeansResult) {
    resultEl.innerHTML = '<p>Choose a numeric outcome and a grouping field.</p>';
    return;
  }

  const anova = state.compareMeansResult.anova;
  const postHocComparisons = Array.isArray(state.compareMeansResult.postHocComparisons)
    ? state.compareMeansResult.postHocComparisons
    : [];
  resultEl.innerHTML = `
    <p>
      Valid grouped rows: <strong>${state.compareMeansResult.validCaseCount}</strong> of <strong>${state.compareMeansResult.caseCount}</strong>
      | Missing: <strong>${state.compareMeansResult.missingCaseCount}</strong>${state.compareMeansResult.weightedValidCaseCount ? ` | Weighted valid total: <strong>${formatDecimal(state.compareMeansResult.weightedValidCaseCount, 3)}</strong>` : ''}
    </p>
    ${anova ? `<p>
      F: <strong>${anova.fStatistic === null ? 'n/a' : formatDecimal(anova.fStatistic, 4)}</strong>
      | df: <strong>${anova.dfBetween}, ${anova.dfWithin}</strong>
      | p: <strong>${anova.pValue === null ? 'n/a' : formatDecimal(anova.pValue, 4)}</strong>
      | eta^2: <strong>${anova.etaSquared === null ? 'n/a' : formatDecimal(anova.etaSquared, 4)}</strong>
      | omega^2: <strong>${anova.omegaSquared === null ? 'n/a' : formatDecimal(anova.omegaSquared, 4)}</strong>
    </p>` : '<p>ANOVA summary requires at least two groups with variation.</p>'}
    ${state.compareMeansResult.assumptions?.length ? `<ul>${state.compareMeansResult.assumptions.map((item) => `<li>${escapeHtml(item.label)}: <strong>${escapeHtml(item.status)}</strong>${item.value !== null ? ` (${escapeHtml(String(item.value))})` : ''}</li>`).join('')}</ul>` : ''}
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>${escapeHtml(state.compareMeansResult.groupLabel)}</th>
            <th>N</th>
            <th>Mean</th>
            <th>Std dev</th>
            <th>Min</th>
            <th>Max</th>
          </tr>
        </thead>
        <tbody>
          ${state.compareMeansResult.groups.map((group) => `
            <tr>
              <td>${escapeHtml(group.groupValue)}</td>
              <td>${group.count}</td>
              <td>${formatDecimal(group.mean, 3)}</td>
              <td>${group.stdDev === null ? 'n/a' : formatDecimal(group.stdDev, 3)}</td>
              <td>${formatDecimal(group.min, 3)}</td>
              <td>${formatDecimal(group.max, 3)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ${postHocComparisons.length > 0 ? `
      <div class="matrix-table-wrap" style="margin-top:16px">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Post-hoc comparison</th>
              <th>Mean diff</th>
              <th>SE</th>
              <th>Statistic</th>
              <th>df</th>
              <th>p</th>
              <th>Adj p</th>
              <th>95% CI</th>
              <th>Effect size</th>
            </tr>
          </thead>
          <tbody>
            ${postHocComparisons.map((comparison) => `
              <tr>
                <td>${escapeHtml(comparison.groupA)} vs ${escapeHtml(comparison.groupB)}</td>
                <td>${formatDecimal(comparison.meanDifference, 4)}</td>
                <td>${formatDecimal(comparison.standardError, 4)}</td>
                <td>${comparison.statistic === null ? 'n/a' : formatDecimal(comparison.statistic, 4)}</td>
                <td>${comparison.degreesOfFreedom === null ? 'n/a' : formatDecimal(comparison.degreesOfFreedom, 3)}</td>
                <td>${comparison.pValue === null ? 'n/a' : formatDecimal(comparison.pValue, 4)}</td>
                <td>${comparison.adjustedPValue === null ? 'n/a' : formatDecimal(comparison.adjustedPValue, 4)}</td>
                <td>${comparison.confidenceInterval?.lower === null || comparison.confidenceInterval?.lower === undefined ? 'n/a' : `${formatDecimal(comparison.confidenceInterval.lower, 4)} to ${formatDecimal(comparison.confidenceInterval.upper, 4)}`}</td>
                <td>${comparison.effectSize === null || comparison.effectSize === undefined ? 'n/a' : formatDecimal(comparison.effectSize, 4)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
  `;
}

function renderTTest() {
  const outcomeEl = document.getElementById('ttest-outcome-field');
  const groupEl = document.getElementById('ttest-group-field');
  const runBtn = document.getElementById('run-ttest-btn');
  const resultEl = document.getElementById('ttest-result');
  if (!outcomeEl || !groupEl || !runBtn || !resultEl) return;

  {
    const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
    const groupOptions = getDatasetAnalysisFieldOptions();
    const previousOutcome = outcomeEl.value;
    const previousGroup = groupEl.value;
    outcomeEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    groupEl.innerHTML = groupOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    if (numericOptions.length > 0) {
      outcomeEl.value = numericOptions.some((option) => option.key === previousOutcome) ? previousOutcome : numericOptions[0].key;
    }
    if (groupOptions.length > 0) {
      groupEl.value = groupOptions.some((option) => option.key === previousGroup && option.key !== outcomeEl.value)
        ? previousGroup
        : (groupOptions.find((option) => option.key !== outcomeEl.value)?.key ?? groupOptions[0].key);
    }
    runBtn.disabled = numericOptions.length === 0 || groupOptions.length < 2;

    if (!state.tTestResult) {
      resultEl.innerHTML = '<p>Choose a numeric outcome and a two-group field, then run a t-test.</p>';
      return;
    }

    const result = state.tTestResult;
    resultEl.innerHTML = buildOutputViewer({
      eyebrow: 'Independent t-test',
      title: `${result.outcomeLabel} by ${result.groupLabel}`,
      summary: `t ${formatStatValue(result.statistic, 4)} with p ${formatStatValue(result.pValue, 4)} and 95% CI ${formatConfidenceInterval(result.confidenceInterval, 4)}.`,
      metrics: [
        { label: 'Valid rows', value: result.validCaseCount },
        { label: 'Weighted total', value: result.weightedValidCaseCount ? formatDecimal(result.weightedValidCaseCount, 3) : 'n/a' },
        { label: 'df', value: formatStatValue(result.degreesOfFreedom, 3) },
        { label: "Cohen's d", value: formatStatValue(result.cohensD, 4) }
      ],
      sections: [
        buildOutputSection(
          'Group statistics',
          buildOutputTable(
            [escapeHtml(result.groupLabel), 'N', 'Weighted N', 'Mean', 'Std dev'],
            result.groups.map((group) => [
              escapeHtml(group.groupValue),
              String(group.count),
              formatStatValue(group.weightedCount, 3),
              formatDecimal(group.mean, 3),
              formatStatValue(group.stdDev, 3)
            ])
          )
        ),
        buildAssumptionsSection(result.assumptions)
      ]
    });
    return;
  }

  const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
  const groupOptions = getDatasetAnalysisFieldOptions();
  const previousOutcome = outcomeEl.value;
  const previousGroup = groupEl.value;
  outcomeEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  groupEl.innerHTML = groupOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  if (numericOptions.length > 0) {
    outcomeEl.value = numericOptions.some((option) => option.key === previousOutcome) ? previousOutcome : numericOptions[0].key;
  }
  if (groupOptions.length > 0) {
    groupEl.value = groupOptions.some((option) => option.key === previousGroup && option.key !== outcomeEl.value)
      ? previousGroup
      : (groupOptions.find((option) => option.key !== outcomeEl.value)?.key ?? groupOptions[0].key);
  }
  runBtn.disabled = numericOptions.length === 0 || groupOptions.length < 2;

  if (!state.tTestResult) {
    resultEl.innerHTML = '<p>Choose a numeric outcome and a two-group field, then run a t-test.</p>';
    return;
  }

  resultEl.innerHTML = `
    <p>
      Valid rows: <strong>${state.tTestResult.validCaseCount}</strong>${state.tTestResult.weightedValidCaseCount ? ` | Weighted valid total: <strong>${formatDecimal(state.tTestResult.weightedValidCaseCount, 3)}</strong>` : ''}
    </p>
    <p>
      t: <strong>${state.tTestResult.statistic === null ? 'n/a' : formatDecimal(state.tTestResult.statistic, 4)}</strong>
      | df: <strong>${state.tTestResult.degreesOfFreedom === null ? 'n/a' : formatDecimal(state.tTestResult.degreesOfFreedom, 3)}</strong>
      | p: <strong>${state.tTestResult.pValue === null ? 'n/a' : formatDecimal(state.tTestResult.pValue, 4)}</strong>
      | d: <strong>${state.tTestResult.cohensD === null ? 'n/a' : formatDecimal(state.tTestResult.cohensD, 4)}</strong>
    </p>
    <p>95% CI: <strong>${state.tTestResult.confidenceInterval?.lower === null || state.tTestResult.confidenceInterval?.lower === undefined ? 'n/a' : `${formatDecimal(state.tTestResult.confidenceInterval.lower, 4)} to ${formatDecimal(state.tTestResult.confidenceInterval.upper, 4)}`}</strong></p>
    ${state.tTestResult.assumptions?.length ? `<ul>${state.tTestResult.assumptions.map((item) => `<li>${escapeHtml(item.label)}: <strong>${escapeHtml(item.status)}</strong>${item.value !== null ? ` (${escapeHtml(String(item.value))})` : ''}</li>`).join('')}</ul>` : ''}
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>${escapeHtml(state.tTestResult.groupLabel)}</th>
            <th>N</th>
            <th>Weighted N</th>
            <th>Mean</th>
            <th>Std dev</th>
          </tr>
        </thead>
        <tbody>
          ${state.tTestResult.groups.map((group) => `
            <tr>
              <td>${escapeHtml(group.groupValue)}</td>
              <td>${group.count}</td>
              <td>${group.weightedCount === null || group.weightedCount === undefined ? 'n/a' : formatDecimal(group.weightedCount, 3)}</td>
              <td>${formatDecimal(group.mean, 3)}</td>
              <td>${group.stdDev === null ? 'n/a' : formatDecimal(group.stdDev, 3)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderPairedTTest() {
  const beforeEl = document.getElementById('paired-before-field');
  const afterEl = document.getElementById('paired-after-field');
  const runBtn = document.getElementById('run-paired-ttest-btn');
  const resultEl = document.getElementById('paired-ttest-result');
  if (!beforeEl || !afterEl || !runBtn || !resultEl) return;

  {
    const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
    const previousBefore = beforeEl.value;
    const previousAfter = afterEl.value;
    beforeEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    afterEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    if (numericOptions.length > 0) {
      beforeEl.value = numericOptions.some((option) => option.key === previousBefore) ? previousBefore : numericOptions[0].key;
    }
    if (numericOptions.length > 1) {
      afterEl.value = numericOptions.some((option) => option.key === previousAfter && option.key !== beforeEl.value)
        ? previousAfter
        : (numericOptions.find((option) => option.key !== beforeEl.value)?.key ?? numericOptions[0].key);
    }
    runBtn.disabled = numericOptions.length < 2;

    if (!state.pairedTTestResult) {
      resultEl.innerHTML = '<p>Choose two numeric fields measured on the same cases, then run a paired t-test.</p>';
      return;
    }

    const result = state.pairedTTestResult;
    resultEl.innerHTML = buildOutputViewer({
      eyebrow: 'Paired t-test',
      title: `${result.beforeLabel} vs ${result.afterLabel}`,
      summary: `Mean difference ${formatStatValue(result.meanDifference, 4)} with p ${formatStatValue(result.pValue, 4)} and 95% CI ${formatConfidenceInterval(result.confidenceInterval, 4)}.`,
      metrics: [
        { label: 'Pairs', value: result.pairCount },
        { label: 'Weighted total', value: result.weightedPairCount ? formatDecimal(result.weightedPairCount, 3) : 'n/a' },
        { label: 'df', value: formatStatValue(result.degreesOfFreedom, 3) },
        { label: "Cohen's dz", value: formatStatValue(result.cohensDz, 4) },
        { label: 'Pair correlation', value: formatStatValue(result.correlation, 4) }
      ],
      sections: [
        buildAssumptionsSection(result.assumptions)
      ]
    });
    return;
  }

  const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
  const previousBefore = beforeEl.value;
  const previousAfter = afterEl.value;
  beforeEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  afterEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  if (numericOptions.length > 0) {
    beforeEl.value = numericOptions.some((option) => option.key === previousBefore) ? previousBefore : numericOptions[0].key;
  }
  if (numericOptions.length > 1) {
    afterEl.value = numericOptions.some((option) => option.key === previousAfter && option.key !== beforeEl.value)
      ? previousAfter
      : (numericOptions.find((option) => option.key !== beforeEl.value)?.key ?? numericOptions[0].key);
  }
  runBtn.disabled = numericOptions.length < 2;

  if (!state.pairedTTestResult) {
    resultEl.innerHTML = '<p>Choose two numeric fields measured on the same cases, then run a paired t-test.</p>';
    return;
  }

  resultEl.innerHTML = `
    <p>
      Pairs: <strong>${state.pairedTTestResult.pairCount}</strong>${state.pairedTTestResult.weightedPairCount ? ` | Weighted total: <strong>${formatDecimal(state.pairedTTestResult.weightedPairCount, 3)}</strong>` : ''}
    </p>
    <p>
      Mean difference: <strong>${state.pairedTTestResult.meanDifference === null ? 'n/a' : formatDecimal(state.pairedTTestResult.meanDifference, 4)}</strong>
      | t: <strong>${state.pairedTTestResult.statistic === null ? 'n/a' : formatDecimal(state.pairedTTestResult.statistic, 4)}</strong>
      | df: <strong>${state.pairedTTestResult.degreesOfFreedom === null ? 'n/a' : formatDecimal(state.pairedTTestResult.degreesOfFreedom, 3)}</strong>
      | p: <strong>${state.pairedTTestResult.pValue === null ? 'n/a' : formatDecimal(state.pairedTTestResult.pValue, 4)}</strong>
    </p>
    <p>
      95% CI: <strong>${state.pairedTTestResult.confidenceInterval?.lower === null || state.pairedTTestResult.confidenceInterval?.lower === undefined ? 'n/a' : `${formatDecimal(state.pairedTTestResult.confidenceInterval.lower, 4)} to ${formatDecimal(state.pairedTTestResult.confidenceInterval.upper, 4)}`}</strong>
      | Cohen's dz: <strong>${state.pairedTTestResult.cohensDz === null ? 'n/a' : formatDecimal(state.pairedTTestResult.cohensDz, 4)}</strong>
      | Pair correlation: <strong>${state.pairedTTestResult.correlation === null ? 'n/a' : formatDecimal(state.pairedTTestResult.correlation, 4)}</strong>
    </p>
    ${state.pairedTTestResult.assumptions?.length ? `<ul>${state.pairedTTestResult.assumptions.map((item) => `<li>${escapeHtml(item.label)}: <strong>${escapeHtml(item.status)}</strong>${item.value !== null ? ` (${escapeHtml(String(item.value))})` : ''}</li>`).join('')}</ul>` : ''}
  `;
}

function renderNonparametric() {
  const outcomeEl = document.getElementById('nonparametric-outcome-field');
  const groupEl = document.getElementById('nonparametric-group-field');
  const runBtn = document.getElementById('run-nonparametric-btn');
  const resultEl = document.getElementById('nonparametric-result');
  if (!outcomeEl || !groupEl || !runBtn || !resultEl) return;

  {
    const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
    const groupOptions = getDatasetAnalysisFieldOptions();
    const previousOutcome = outcomeEl.value;
    const previousGroup = groupEl.value;
    outcomeEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    groupEl.innerHTML = groupOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    if (numericOptions.length > 0) {
      outcomeEl.value = numericOptions.some((option) => option.key === previousOutcome) ? previousOutcome : numericOptions[0].key;
    }
    if (groupOptions.length > 0) {
      groupEl.value = groupOptions.some((option) => option.key === previousGroup && option.key !== outcomeEl.value)
        ? previousGroup
        : (groupOptions.find((option) => option.key !== outcomeEl.value)?.key ?? groupOptions[0].key);
    }
    runBtn.disabled = numericOptions.length === 0 || groupOptions.length < 2;

    if (!state.nonparametricResult) {
      resultEl.innerHTML = '<p>Choose a numeric outcome and grouping field to run Mann-Whitney U or Kruskal-Wallis.</p>';
      return;
    }

    const result = state.nonparametricResult;
    resultEl.innerHTML = buildOutputViewer({
      eyebrow: 'Nonparametric test',
      title: `${result.method} for ${result.outcomeLabel ?? 'selected outcome'}`,
      summary: `Statistic ${formatStatValue(result.statistic, 4)} with p ${formatStatValue(result.pValue, 4)}.`,
      metrics: [
        { label: 'Effect size', value: formatStatValue(result.effectSize, 4) },
        { label: 'Weighted total', value: result.weightedValidCaseCount ? formatDecimal(result.weightedValidCaseCount, 3) : 'n/a' }
      ],
      sections: [
        result.notes?.length
          ? buildOutputSection('Notes', buildOutputList(result.notes.map((note) => escapeHtml(note))))
          : '',
        buildOutputSection(
          'Rank summaries',
          buildOutputTable(
            [escapeHtml(result.groupLabel), 'N', 'Weighted N', 'Mean rank'],
            result.groups.map((group) => [
              escapeHtml(group.groupValue),
              String(group.count),
              formatStatValue(group.weightedCount, 3),
              formatDecimal(group.meanRank, 3)
            ])
          )
        ),
        buildAssumptionsSection(result.assumptions)
      ].filter(Boolean)
    });
    return;
  }

  const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
  const groupOptions = getDatasetAnalysisFieldOptions();
  const previousOutcome = outcomeEl.value;
  const previousGroup = groupEl.value;
  outcomeEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  groupEl.innerHTML = groupOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  if (numericOptions.length > 0) {
    outcomeEl.value = numericOptions.some((option) => option.key === previousOutcome) ? previousOutcome : numericOptions[0].key;
  }
  if (groupOptions.length > 0) {
    groupEl.value = groupOptions.some((option) => option.key === previousGroup && option.key !== outcomeEl.value)
      ? previousGroup
      : (groupOptions.find((option) => option.key !== outcomeEl.value)?.key ?? groupOptions[0].key);
  }
  runBtn.disabled = numericOptions.length === 0 || groupOptions.length < 2;

  if (!state.nonparametricResult) {
    resultEl.innerHTML = '<p>Choose a numeric outcome and grouping field to run Mann-Whitney U or Kruskal-Wallis.</p>';
    return;
  }

  resultEl.innerHTML = `
    <p>
      Method: <strong>${escapeHtml(state.nonparametricResult.method)}</strong>
      | Statistic: <strong>${formatDecimal(state.nonparametricResult.statistic, 4)}</strong>
      | p: <strong>${state.nonparametricResult.pValue === null ? 'n/a' : formatDecimal(state.nonparametricResult.pValue, 4)}</strong>
      | Effect size: <strong>${state.nonparametricResult.effectSize === null || state.nonparametricResult.effectSize === undefined ? 'n/a' : formatDecimal(state.nonparametricResult.effectSize, 4)}</strong>
    </p>
    ${state.nonparametricResult.weightedValidCaseCount ? `<p>Weighted valid total: <strong>${formatDecimal(state.nonparametricResult.weightedValidCaseCount, 3)}</strong></p>` : ''}
    ${state.nonparametricResult.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join('')}
    ${state.nonparametricResult.assumptions?.length ? `<ul>${state.nonparametricResult.assumptions.map((item) => `<li>${escapeHtml(item.label)}: <strong>${escapeHtml(item.status)}</strong>${item.value !== null ? ` (${escapeHtml(String(item.value))})` : ''}</li>`).join('')}</ul>` : ''}
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>${escapeHtml(state.nonparametricResult.groupLabel)}</th>
            <th>N</th>
            <th>Weighted N</th>
            <th>Mean rank</th>
          </tr>
        </thead>
        <tbody>
          ${state.nonparametricResult.groups.map((group) => `
            <tr>
              <td>${escapeHtml(group.groupValue)}</td>
              <td>${group.count}</td>
              <td>${group.weightedCount === null || group.weightedCount === undefined ? 'n/a' : formatDecimal(group.weightedCount, 3)}</td>
              <td>${formatDecimal(group.meanRank, 3)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderRegression() {
  const dependentEl = document.getElementById('regression-dependent-field');
  const predictorEl = document.getElementById('regression-predictor-fields');
  const runBtn = document.getElementById('run-regression-btn');
  const resultEl = document.getElementById('regression-result');
  if (!dependentEl || !predictorEl || !runBtn || !resultEl) return;

  {
    const options = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
    const previousDependent = dependentEl.value;
    const previousPredictors = [...predictorEl.selectedOptions].map((option) => option.value);
    dependentEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    predictorEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    if (options.length > 0) {
      dependentEl.value = options.some((option) => option.key === previousDependent) ? previousDependent : options[0].key;
    }
    const availablePredictors = options.filter((option) => option.key !== dependentEl.value);
    for (const option of predictorEl.options) {
      option.selected = previousPredictors.includes(option.value) && option.value !== dependentEl.value;
    }
    if ([...predictorEl.selectedOptions].length === 0 && availablePredictors.length > 0) {
      availablePredictors.slice(0, Math.min(2, availablePredictors.length)).forEach((option) => {
        const target = [...predictorEl.options].find((candidate) => candidate.value === option.key);
        if (target) target.selected = true;
      });
    }
    runBtn.disabled = options.length < 2;

    if (options.length < 2) {
      resultEl.innerHTML = '<p>Add at least two numeric fields before running regression.</p>';
      return;
    }

    if (!state.regressionResult) {
      resultEl.innerHTML = '<p>Choose numeric fields and run a regression.</p>';
      return;
    }

    const result = state.regressionResult;
    const metricCards = Object.entries(result.metrics ?? {}).map(([key, value]) => ({
      label: key,
      value: value === null ? 'n/a' : formatDecimal(value, 4)
    }));
    const diagnostics = result.diagnostics ?? {};
    const diagnosticRows = [
      ['Durbin-Watson', formatStatValue(diagnostics.durbinWatson, 4)],
      ['Jarque-Bera statistic', formatStatValue(diagnostics.jarqueBeraStatistic, 4)],
      ['Jarque-Bera p-value', formatStatValue(diagnostics.jarqueBeraPValue, 4)],
      ['Breusch-Pagan statistic', formatStatValue(diagnostics.breuschPaganStatistic, 4)],
      ['Breusch-Pagan p-value', formatStatValue(diagnostics.breuschPaganPValue, 4)],
      ['Max VIF', formatStatValue(diagnostics.maxVif, 4)],
      ['Mean VIF', formatStatValue(diagnostics.meanVif, 4)],
      ['Max predictor correlation', formatStatValue(diagnostics.maxPredictorCorrelation, 4)],
      ['Outlier count', formatStatValue(diagnostics.outlierCount, 0)],
      ['High leverage count', formatStatValue(diagnostics.highLeverageCount, 0)],
      ['Influential count', formatStatValue(diagnostics.influentialCount, 0)]
    ];
    const observationRows = Array.isArray(result.observations) ? result.observations : [];
    const thresholdAnalysis = Array.isArray(result.thresholdAnalysis) ? result.thresholdAnalysis : [];
    const calibrationBins = Array.isArray(result.calibration?.bins) ? result.calibration.bins : [];
    const calibrationPoints = calibrationBins
      .filter((bin) => typeof bin.predictedRate === 'number' && typeof bin.observedRate === 'number')
      .map((bin) => ({ x: bin.predictedRate, y: bin.observedRate }));
    const calibrationObservedSeries = calibrationBins
      .map((bin) => ({ label: bin.bin, value: Number(bin.observedRate) }))
      .filter((point) => Number.isFinite(point.value));
    const calibrationPredictedSeries = calibrationBins
      .map((bin) => ({ label: bin.bin, value: Number(bin.predictedRate) }))
      .filter((point) => Number.isFinite(point.value));
    const coefficientChartItems = result.coefficients
      .filter((item) => item.field !== '(Intercept)')
      .map((item) => ({ label: item.field, value: item.coefficient }));
    const residualPlotPoints = observationRows
      .filter((item) => typeof item.predicted === 'number' && typeof item.residual === 'number')
      .map((item) => ({ x: item.predicted, y: item.residual }));
    const observedPredictedPoints = observationRows
      .filter((item) => typeof item.actual === 'number' && typeof item.predicted === 'number')
      .map((item) => ({ x: item.actual, y: item.predicted }));
    const qqPlotPoints = buildQqPlotPoints(observationRows.map((item) => item.standardizedResidual));

    resultEl.innerHTML = buildOutputViewer({
      eyebrow: `${result.model} regression`,
      title: result.dependentField,
      summary: `Predictors: ${result.predictorFields.join(', ')}.`,
      metrics: [
        { label: 'Cases', value: result.caseCount },
        { label: 'Intercept', value: formatStatValue(result.intercept, 4) },
        ...metricCards.slice(0, 4)
      ],
      sections: [
        buildOutputSection(
          'Coefficients',
          buildOutputTable(
            ['Field', 'Coefficient', 'SE', 'Statistic', 'p', '95% CI', 'Odds ratio'],
            result.coefficients.map((item) => [
              escapeHtml(item.field),
              formatStatValue(item.coefficient, 4),
              formatStatValue(item.standardError, 4),
              formatStatValue(item.statistic, 4),
              formatStatValue(item.pValue, 4),
              formatConfidenceInterval(item.confidenceInterval, 4),
              formatStatValue(item.oddsRatio, 4)
            ])
          )
        ),
        diagnosticRows.length
          ? buildOutputSection(
            'Model diagnostics',
            buildOutputTable(
              ['Diagnostic', 'Value'],
              diagnosticRows.map((row) => [escapeHtml(row[0]), row[1]])
            )
          )
          : '',
        result.model === 'logistic' && thresholdAnalysis.length > 0
          ? buildOutputSection(
            'Threshold analysis',
            buildOutputTable(
              ['Threshold', 'Accuracy', 'Precision', 'Recall', 'Specificity', 'F1', 'Youden J', 'TP', 'FP', 'TN', 'FN'],
              thresholdAnalysis.map((entry) => [
                formatStatValue(entry.threshold, 2),
                formatStatValue(entry.accuracy, 4),
                formatStatValue(entry.precision, 4),
                formatStatValue(entry.recall, 4),
                formatStatValue(entry.specificity, 4),
                formatStatValue(entry.f1Score, 4),
                formatStatValue(entry.youdenJ, 4),
                formatStatValue(entry.truePositive, 2),
                formatStatValue(entry.falsePositive, 2),
                formatStatValue(entry.trueNegative, 2),
                formatStatValue(entry.falseNegative, 2)
              ])
            )
          )
          : '',
        result.model === 'logistic' && calibrationBins.length > 0
          ? buildOutputSection(
            'Calibration diagnostics',
            `
              ${buildOutputTable(
                ['Bin', 'Prob range', 'N', 'Weighted N', 'Observed rate', 'Predicted rate', 'Gap'],
                calibrationBins.map((bin) => [
                  escapeHtml(bin.bin),
                  `${formatStatValue(bin.minProbability, 3)} to ${formatStatValue(bin.maxProbability, 3)}`,
                  String(bin.count),
                  formatStatValue(bin.weightedCount, 3),
                  formatStatValue(bin.observedRate, 4),
                  formatStatValue(bin.predictedRate, 4),
                  formatStatValue(bin.calibrationGap, 4)
                ])
              )}
              <div class="chart-grid">
                ${calibrationPoints.length > 0
                  ? buildChartCard('Observed vs predicted rate', buildSvgScatterPlot(calibrationPoints, { color: '#8fb3ff', xLabel: 'Predicted rate', yLabel: 'Observed rate' }), 'Points near diagonal indicate better calibration.')
                  : ''}
                ${calibrationObservedSeries.length > 0
                  ? buildChartCard('Observed rate by bin', buildSvgLineChart(calibrationObservedSeries, { color: '#ffb86c' }), 'Observed event rate per calibration bin.')
                  : ''}
                ${calibrationPredictedSeries.length > 0
                  ? buildChartCard('Predicted rate by bin', buildSvgLineChart(calibrationPredictedSeries, { color: '#7ea7a1' }), 'Average predicted probability per calibration bin.')
                  : ''}
              </div>
            `
          )
          : '',
        coefficientChartItems.length > 0
          ? buildOutputSection(
            'Coefficient profile',
            `<div class="chart-grid">${buildChartCard('Predictor coefficients', buildSvgBarChart(coefficientChartItems, { color: '#d2b27a', formatter: (value) => formatDecimal(value, 3) }), 'Coefficient direction and magnitude by predictor.')}</div>`
          )
          : '',
        observedPredictedPoints.length > 0
          ? buildOutputSection(
            'Fit profile',
            `<div class="chart-grid">${buildChartCard('Observed vs predicted', buildSvgScatterPlot(observedPredictedPoints, { color: '#8fb3ff', xLabel: 'Observed', yLabel: 'Predicted' }), 'Points close to the diagonal indicate better fit.')}</div>`
          )
          : '',
        residualPlotPoints.length > 0
          ? buildOutputSection(
            'Residual diagnostics',
            `<div class="chart-grid">${buildChartCard('Predicted vs residual', buildSvgScatterPlot(residualPlotPoints, { color: '#ffb86c', xLabel: 'Predicted', yLabel: 'Residual' }), 'Residual spread against fitted values for the sampled observations.')}${qqPlotPoints.length > 0 ? buildChartCard('Residual QQ plot', buildSvgScatterPlot(qqPlotPoints, { color: '#7ea7a1', xLabel: 'Theoretical quantile', yLabel: 'Standardized residual' }), 'Departures from linear pattern suggest non-normal residual behavior.') : ''}</div>`
          )
          : '',
        buildAssumptionsSection(result.assumptions),
        observationRows.length > 0
          ? buildOutputSection(
            'Observation diagnostics',
            buildOutputTable(
              ['Case', 'Actual', 'Predicted', 'Residual', 'Std residual', 'Leverage', "Cook's D", 'Deviance residual', 'Predicted class', 'Outlier'],
              observationRows.map((observation) => [
                escapeHtml(observation.caseLabel ?? observation.caseId ?? 'case'),
                formatStatValue(observation.actual, 4),
                formatStatValue(observation.predicted, 4),
                formatStatValue(observation.residual, 4),
                formatStatValue(observation.standardizedResidual, 4),
                formatStatValue(observation.leverage, 4),
                formatStatValue(observation.cooksDistance, 4),
                formatStatValue(observation.devianceResidual, 4),
                observation.predictedClass === null || observation.predictedClass === undefined ? 'n/a' : escapeHtml(String(observation.predictedClass)),
                observation.outlier ? 'yes' : 'no'
              ])
              )
            )
            : '',
        buildChartSuggestionsSection([
          'Coefficient bar chart with confidence intervals',
          'Residual vs fitted plot',
          'Observed vs predicted scatter or calibration plot'
        ])
      ].filter(Boolean)
    });
    return;
  }

  const options = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
  const previousDependent = dependentEl.value;
  const previousPredictors = [...predictorEl.selectedOptions].map((option) => option.value);
  dependentEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  predictorEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  if (options.length > 0) {
    dependentEl.value = options.some((option) => option.key === previousDependent) ? previousDependent : options[0].key;
  }
  const availablePredictors = options.filter((option) => option.key !== dependentEl.value);
  for (const option of predictorEl.options) {
    option.selected = previousPredictors.includes(option.value) && option.value !== dependentEl.value;
  }
  if ([...predictorEl.selectedOptions].length === 0 && availablePredictors.length > 0) {
    availablePredictors.slice(0, Math.min(2, availablePredictors.length)).forEach((option) => {
      const target = [...predictorEl.options].find((candidate) => candidate.value === option.key);
      if (target) target.selected = true;
    });
  }
  runBtn.disabled = options.length < 2;

  if (options.length < 2) {
    resultEl.innerHTML = '<p>Add at least two numeric fields before running regression.</p>';
    return;
  }

  if (!state.regressionResult) {
    resultEl.innerHTML = '<p>Choose numeric fields and run a regression.</p>';
    return;
  }

  const metrics = Object.entries(state.regressionResult.metrics)
    .map(([key, value]) => `<span class="source-meta">${escapeHtml(key)}: ${value === null ? 'n/a' : escapeHtml(formatDecimal(value, 4))}</span>`)
    .join('');
  const diagnostics = Object.entries(state.regressionResult.diagnostics ?? {})
    .map(([key, value]) => `<span class="source-meta">${escapeHtml(key)}: ${value === null ? 'n/a' : escapeHtml(formatDecimal(value, 4))}</span>`)
    .join('');
  const coefficients = state.regressionResult.coefficients
    .map((item) => `<li>${escapeHtml(item.field)}: <strong>${formatDecimal(item.coefficient, 4)}</strong>${item.standardError !== null && item.standardError !== undefined ? ` | SE ${formatDecimal(item.standardError, 4)}` : ''}${item.statistic !== null && item.statistic !== undefined ? ` | stat ${formatDecimal(item.statistic, 4)}` : ''}${item.pValue !== null && item.pValue !== undefined ? ` | p ${formatDecimal(item.pValue, 4)}` : ''}${item.confidenceInterval?.lower !== null && item.confidenceInterval?.lower !== undefined ? ` | 95% CI ${formatDecimal(item.confidenceInterval.lower, 4)} to ${formatDecimal(item.confidenceInterval.upper, 4)}` : ''}${item.oddsRatio !== null && item.oddsRatio !== undefined ? ` | OR ${formatDecimal(item.oddsRatio, 4)}` : ''}</li>`)
    .join('');
  const observations = Array.isArray(state.regressionResult.observations) ? state.regressionResult.observations : [];

  resultEl.innerHTML = `
    <p><strong>${escapeHtml(state.regressionResult.model)}</strong> regression on <strong>${escapeHtml(state.regressionResult.dependentField)}</strong></p>
    <p>Predictors: <strong>${escapeHtml(state.regressionResult.predictorFields.join(', '))}</strong></p>
    <span class="source-meta">Cases: ${state.regressionResult.caseCount}</span>
    <span class="source-meta">Intercept: ${formatDecimal(state.regressionResult.intercept, 4)}</span>
    <span class="source-meta">Slope: ${formatDecimal(state.regressionResult.slope, 4)}</span>
    ${metrics}
    ${diagnostics ? `<div style="margin-top:10px">${diagnostics}</div>` : ''}
    ${state.regressionResult.assumptions?.length ? `<ul style="margin-top:10px">${state.regressionResult.assumptions.map((item) => `<li>${escapeHtml(item.label)}: <strong>${escapeHtml(item.status)}</strong>${item.value !== null ? ` (${escapeHtml(String(item.value))})` : ''}</li>`).join('')}</ul>` : ''}
    <ul style="margin-top:10px">${coefficients}</ul>
    ${observations.length > 0 ? `
      <div class="matrix-table-wrap" style="margin-top:16px">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Actual</th>
              <th>Predicted</th>
              <th>Residual</th>
              <th>Std residual</th>
              <th>Leverage</th>
              <th>Cook's D</th>
              <th>Deviance residual</th>
              <th>Predicted class</th>
              <th>Outlier</th>
            </tr>
          </thead>
          <tbody>
            ${observations.map((observation) => `
              <tr>
                <td>${escapeHtml(observation.caseLabel ?? observation.caseId ?? 'case')}</td>
                <td>${observation.actual === null || observation.actual === undefined ? 'n/a' : formatDecimal(observation.actual, 4)}</td>
                <td>${observation.predicted === null || observation.predicted === undefined ? 'n/a' : formatDecimal(observation.predicted, 4)}</td>
                <td>${observation.residual === null || observation.residual === undefined ? 'n/a' : formatDecimal(observation.residual, 4)}</td>
                <td>${observation.standardizedResidual === null || observation.standardizedResidual === undefined ? 'n/a' : formatDecimal(observation.standardizedResidual, 4)}</td>
                <td>${observation.leverage === null || observation.leverage === undefined ? 'n/a' : formatDecimal(observation.leverage, 4)}</td>
                <td>${observation.cooksDistance === null || observation.cooksDistance === undefined ? 'n/a' : formatDecimal(observation.cooksDistance, 4)}</td>
                <td>${observation.devianceResidual === null || observation.devianceResidual === undefined ? 'n/a' : formatDecimal(observation.devianceResidual, 4)}</td>
                <td>${observation.predictedClass === null || observation.predictedClass === undefined ? 'n/a' : escapeHtml(String(observation.predictedClass))}</td>
                <td>${observation.outlier ? 'yes' : 'no'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
  `;
}

function renderReliability() {
  const fieldsEl = document.getElementById('reliability-fields');
  const subscaleEl = document.getElementById('reliability-subscales');
  const runBtn = document.getElementById('run-reliability-btn');
  const resultEl = document.getElementById('reliability-result');
  if (!fieldsEl || !subscaleEl || !runBtn || !resultEl) return;

  const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
  const previousSelections = getSelectedValues(fieldsEl);
  fieldsEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  for (const option of fieldsEl.options) {
    option.selected = previousSelections.includes(option.value);
  }
  if (getSelectedValues(fieldsEl).length < 2 && numericOptions.length >= 2) {
    numericOptions.slice(0, Math.min(4, numericOptions.length)).forEach((option) => {
      const target = [...fieldsEl.options].find((candidate) => candidate.value === option.key);
      if (target) target.selected = true;
    });
  }
  runBtn.disabled = numericOptions.length < 2;

  if (numericOptions.length < 2) {
    resultEl.innerHTML = '<p>Add at least two numeric fields before running reliability analysis.</p>';
    return;
  }
  if (!state.reliabilityResult) {
    resultEl.innerHTML = '<p>Select at least two numeric fields and run reliability analysis.</p>';
    return;
  }

  const result = state.reliabilityResult;
  const itemCorrelationItems = result.items.map((item) => ({
    label: item.label,
    value: item.itemTotalCorrelation ?? 0
  }));
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Reliability',
    title: `Cronbach alpha for ${result.fieldLabels.join(', ')}`,
    summary: `Alpha ${formatStatValue(result.alpha, 4)} across ${result.validCaseCount} complete case(s).`,
    metrics: [
      { label: 'Valid cases', value: result.validCaseCount },
      { label: 'Items', value: result.itemCount ?? result.fields?.length ?? result.fieldLabels.length },
      { label: 'Alpha', value: formatStatValue(result.alpha, 4) },
      { label: 'Std alpha', value: formatStatValue(result.standardizedAlpha, 4) },
      { label: 'Omega', value: formatStatValue(result.omegaTotal, 4) },
      { label: 'Spearman-Brown', value: formatStatValue(result.spearmanBrown, 4) },
      { label: 'Scale mean', value: formatStatValue(result.scaleMean, 4) },
      { label: 'Scale variance', value: formatStatValue(result.scaleVariance, 4) }
    ],
    sections: [
      buildOutputSection(
        'Reliability variants',
        buildOutputTable(
          ['Metric', 'Value'],
          [
            ['Cronbach alpha', formatStatValue(result.alpha, 4)],
            ['Standardized alpha', formatStatValue(result.standardizedAlpha, 4)],
            ['McDonald omega total', formatStatValue(result.omegaTotal, 4)],
            ['Average inter-item correlation', formatStatValue(result.averageInterItemCorrelation, 4)],
            ['Split-half correlation', formatStatValue(result.splitHalfCorrelation, 4)],
            ['Spearman-Brown', formatStatValue(result.spearmanBrown, 4)],
            ['Standard error of measurement', formatStatValue(result.standardErrorOfMeasurement, 4)]
          ]
        )
      ),
      buildOutputSection(
        'Item statistics',
        buildOutputTable(
          ['Item', 'Mean', 'Std dev', 'Item-total r', 'Alpha if deleted'],
          result.items.map((item) => [
            escapeHtml(item.label),
            formatStatValue(item.mean, 4),
            formatStatValue(item.stdDev, 4),
            formatStatValue(item.itemTotalCorrelation, 4),
            formatStatValue(item.alphaIfDeleted, 4)
          ])
        )
      ),
      Array.isArray(result.subscales) && result.subscales.length > 0
        ? buildOutputSection(
          'Subscale reliability',
          buildOutputTable(
            ['Subscale', 'Fields', 'Items', 'Valid cases', 'Alpha', 'Omega', 'Avg inter-item r', 'SEM'],
            result.subscales.map((subscale) => [
              escapeHtml(subscale.label),
              escapeHtml(subscale.fieldLabels.join(', ')),
              String(subscale.itemCount ?? subscale.fields.length),
              String(subscale.validCaseCount),
              formatStatValue(subscale.alpha, 4),
              formatStatValue(subscale.omegaTotal, 4),
              formatStatValue(subscale.averageInterItemCorrelation, 4),
              formatStatValue(subscale.standardErrorOfMeasurement, 4)
            ])
          )
        )
        : '',
      itemCorrelationItems.length > 0
        ? buildOutputSection(
          'Item-total pattern',
          `<div class="chart-grid">${buildChartCard('Item-total correlations', buildSvgBarChart(itemCorrelationItems, { color: '#7ea7a1', formatter: (value) => formatDecimal(value, 3) }), 'Higher values indicate stronger alignment with the full scale.')}</div>`
        )
        : '',
      result.notes?.length
        ? buildOutputSection('Notes', buildOutputList(result.notes.map((note) => escapeHtml(note))))
        : '',
      buildChartSuggestionsSection([
        'Item-total correlation bar chart',
        'Alpha-if-deleted comparison plot',
        'Subscale reliability summary chart'
      ])
    ].filter(Boolean)
  });
}

function renderFactorAnalysis() {
  const fieldsEl = document.getElementById('factor-analysis-fields');
  const factorCountEl = document.getElementById('factor-count');
  const rotationEl = document.getElementById('factor-rotation');
  const runBtn = document.getElementById('run-factor-analysis-btn');
  const resultEl = document.getElementById('factor-analysis-result');
  if (!fieldsEl || !factorCountEl || !rotationEl || !runBtn || !resultEl) return;

  const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
  const previousSelections = getSelectedValues(fieldsEl);
  fieldsEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  for (const option of fieldsEl.options) {
    option.selected = previousSelections.includes(option.value);
  }
  if (getSelectedValues(fieldsEl).length < 2 && numericOptions.length >= 2) {
    numericOptions.slice(0, Math.min(5, numericOptions.length)).forEach((option) => {
      const target = [...fieldsEl.options].find((candidate) => candidate.value === option.key);
      if (target) target.selected = true;
    });
  }
  const maxFactorCount = Math.max(1, getSelectedValues(fieldsEl).length || numericOptions.length || 1);
  factorCountEl.max = String(maxFactorCount);
  if (!factorCountEl.value || Number(factorCountEl.value) > maxFactorCount) {
    factorCountEl.value = String(Math.min(2, maxFactorCount));
  }
  runBtn.disabled = numericOptions.length < 2;

  if (numericOptions.length < 2) {
    resultEl.innerHTML = '<p>Add at least two numeric fields before running factor analysis.</p>';
    return;
  }
  if (!state.factorAnalysisResult) {
    resultEl.innerHTML = '<p>Select numeric fields and run factor analysis.</p>';
    return;
  }

  const result = state.factorAnalysisResult;
  const screeItems = result.eigenvalues.map((value, index) => ({
    label: `F${index + 1}`,
    value
  }));
  const diagnostics = result.diagnostics ?? null;
  const kmoRows = Array.isArray(diagnostics?.kmoPerField)
    ? diagnostics.kmoPerField.map((item) => [
      escapeHtml(item.label ?? item.field ?? ''),
      formatStatValue(item.kmo, 4)
    ])
    : [];
  const factorCorrelationRows = Array.isArray(diagnostics?.factorCorrelationMatrix)
    ? diagnostics.factorCorrelationMatrix.map((row, rowIndex) => [
      `Factor ${rowIndex + 1}`,
      ...row.map((value) => formatStatValue(value, 4))
    ])
    : [];
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Factor analysis',
    title: `${result.factorCount} factor(s) from ${result.fieldLabels.join(', ')}`,
    summary: `${result.extraction.replace(/_/g, ' ')} extraction across ${result.validCaseCount} complete case(s).`,
    metrics: [
      { label: 'Valid cases', value: result.validCaseCount },
      { label: 'Factors', value: result.factorCount },
      { label: 'Recommended', value: result.recommendedFactorCount },
      { label: 'Fields', value: result.fields.length },
      { label: 'Extraction', value: result.extraction.replace(/_/g, ' ') },
      { label: 'Rotation', value: result.rotation }
    ],
    sections: [
      buildOutputSection(
        'Factor recommendations',
        buildOutputTable(
          ['Requested factors', 'Recommended factors', 'Top eigenvalues'],
          [[
            String(result.factorCount),
            String(result.recommendedFactorCount),
            result.eigenvalues.slice(0, 5).map((value) => formatStatValue(value, 4)).join(', ')
          ]]
        )
      ),
      buildOutputSection(
        'Variance explained',
        buildOutputTable(
          ['Factor', 'Eigenvalue', '% variance', 'Cumulative %'],
          result.factors.map((factor) => [
            `Factor ${factor.factor}`,
            formatStatValue(factor.eigenvalue, 4),
            formatStatValue(factor.varianceExplained * 100, 2),
            formatStatValue(factor.cumulativeVarianceExplained * 100, 2)
          ])
        )
      ),
      diagnostics
        ? buildOutputSection(
          'Adequacy diagnostics',
          buildOutputTable(
            ['Check', 'Statistic', 'P-value'],
            [
              [
                'KMO (overall)',
                formatStatValue(diagnostics.kmoOverall, 4),
                'n/a'
              ],
              [
                `Bartlett test (df ${String(diagnostics.bartlettTest?.degreesOfFreedom ?? 0)})`,
                formatStatValue(diagnostics.bartlettTest?.chiSquare, 4),
                formatStatValue(diagnostics.bartlettTest?.pValue, 4)
              ],
              [
                'Correlation determinant',
                formatStatValue(diagnostics.correlationDeterminant, 6),
                'n/a'
              ]
            ]
          )
        )
        : '',
      kmoRows.length > 0
        ? buildOutputSection(
          'KMO by field',
          buildOutputTable(
            ['Field', 'KMO'],
            kmoRows
          )
        )
        : '',
      factorCorrelationRows.length > 0
        ? buildOutputSection(
          'Factor correlation matrix',
          buildOutputTable(
            ['Factor', ...result.factors.map((factor) => `Factor ${factor.factor}`)],
            factorCorrelationRows
          )
        )
        : '',
      screeItems.length > 0
        ? buildOutputSection(
          'Scree profile',
          `<div class="chart-grid">${buildChartCard('Eigenvalue scree', buildSvgLineChart(screeItems, { color: '#8fb3ff' }), 'Eigenvalues by extracted factor order.')}</div>`
        )
        : '',
      buildOutputSection(
        'Loadings',
        buildOutputTable(
          ['Field', ...result.factors.map((factor) => `Factor ${factor.factor}`), 'Communality', 'Uniqueness'],
          result.fields.map((field, fieldIndex) => [
            escapeHtml(result.fieldLabels[fieldIndex] ?? field),
            ...result.factors.map((factor) => formatStatValue(factor.loadings[fieldIndex]?.loading, 4)),
            formatStatValue(result.factors[0]?.loadings[fieldIndex]?.communality, 4),
            formatStatValue(result.factors[0]?.loadings[fieldIndex]?.uniqueness, 4)
          ])
        )
      ),
      buildOutputSection(
        'Correlation matrix',
        buildOutputTable(
          ['Field', ...result.fieldLabels.map((label) => escapeHtml(label))],
          result.correlationMatrix.map((row, rowIndex) => [
            escapeHtml(result.fieldLabels[rowIndex] ?? row.field),
            ...row.values.map((value) => formatStatValue(value, 4))
          ])
        )
      ),
      result.notes?.length
        ? buildOutputSection('Notes', buildOutputList(result.notes.map((note) => escapeHtml(note))))
        : '',
      buildChartSuggestionsSection([
        'Scree plot for eigenvalues',
        'Loading heatmap by factor',
        'Variance explained cumulative line chart'
      ])
    ].filter(Boolean)
  });
  }

function renderForecasting() {
  const timeEl = document.getElementById('forecast-time-field');
  const valueEl = document.getElementById('forecast-value-field');
  const horizonEl = document.getElementById('forecast-horizon');
  const methodEl = document.getElementById('forecast-method');
  const windowEl = document.getElementById('forecast-window');
  const alphaEl = document.getElementById('forecast-alpha');
  const runBtn = document.getElementById('run-forecasting-btn');
  const resultEl = document.getElementById('forecasting-result');
  if (!timeEl || !valueEl || !horizonEl || !methodEl || !windowEl || !alphaEl || !runBtn || !resultEl) return;

  const options = getDatasetAnalysisFieldOptions();
  const numericOptions = options.filter((option) => option.valueType === 'number');
  const previousTime = timeEl.value;
  const previousValue = valueEl.value;
  const previousMethod = methodEl.value;
  timeEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.valueType})</option>`).join('');
  valueEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  timeEl.value = options.some((option) => option.key === previousTime) ? previousTime : options[0]?.key ?? '';
  valueEl.value = numericOptions.some((option) => option.key === previousValue && option.key !== timeEl.value)
    ? previousValue
    : numericOptions.find((option) => option.key !== timeEl.value)?.key ?? numericOptions[0]?.key ?? '';
  methodEl.value = ['linear_trend', 'moving_average', 'exponential_smoothing'].includes(previousMethod)
    ? previousMethod
    : (state.forecastingResult?.method ?? 'linear_trend');
  windowEl.value = windowEl.value || '3';
  alphaEl.value = alphaEl.value || '0.35';
  windowEl.disabled = methodEl.value !== 'moving_average';
  alphaEl.disabled = methodEl.value !== 'exponential_smoothing';
  runBtn.disabled = options.length < 2 || numericOptions.length === 0 || !valueEl.value;

  if (!state.forecastingResult) {
    resultEl.innerHTML = '<p>Choose a time/order field and numeric value field, then run forecasting.</p>';
    return;
  }

  const result = state.forecastingResult;
  const methodLabel = result.method === 'moving_average'
    ? 'Moving average'
    : result.method === 'exponential_smoothing'
      ? 'Exponential smoothing'
      : 'Linear trend';
  const observedItems = result.observations.map((item, index) => ({ label: String(index + 1), value: item.actual }));
  const fittedItems = result.observations.map((item, index) => ({ label: String(index + 1), value: item.fitted }));
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Forecasting',
    title: `${result.valueLabel} over ${result.timeLabel} (${methodLabel})`,
    summary: result.method === 'linear_trend'
      ? `Linear trend slope ${formatStatValue(result.slope, 5)} with RMSE ${formatStatValue(result.metrics.rootMeanSquaredError, 5)}.`
      : result.method === 'moving_average'
        ? `Moving-average forecast (window ${result.methodSettings?.movingAverageWindow ?? 'n/a'}) with RMSE ${formatStatValue(result.metrics.rootMeanSquaredError, 5)}.`
        : `Exponential-smoothing forecast (alpha ${formatStatValue(result.methodSettings?.smoothingAlpha, 2)}) with RMSE ${formatStatValue(result.metrics.rootMeanSquaredError, 5)}.`,
    metrics: [
      { label: 'Rows', value: result.caseCount },
      { label: 'Method', value: methodLabel },
      { label: 'Horizon', value: result.horizon },
      { label: 'MAE', value: formatStatValue(result.metrics.meanAbsoluteError, 5) },
      { label: 'R squared', value: formatStatValue(result.metrics.rSquared, 5) }
    ],
    sections: [
      buildOutputSection(
        'Forecast points',
        buildOutputTable(
          ['Step', 'Time index', 'Forecast', 'Lower', 'Upper'],
          result.forecast.map((point) => [
            String(point.step),
            formatStatValue(point.timeIndex, 3),
            formatStatValue(point.forecast, 5),
            formatStatValue(point.lower, 5),
            formatStatValue(point.upper, 5)
          ])
        )
      ),
      buildOutputSection(
        'Observed and fitted',
        buildOutputTable(
          ['Time', 'Actual', 'Fitted', 'Residual'],
          result.observations.map((item) => [
            escapeHtml(String(item.timeValue)),
            formatStatValue(item.actual, 5),
            formatStatValue(item.fitted, 5),
            formatStatValue(item.residual, 5)
          ])
        )
      ),
      buildOutputSection(
        'Profile',
        `<div class="chart-grid">${buildChartCard('Actual values', buildSvgLineChart(observedItems, { color: '#8fb3ff' }), 'Observed values in sorted time order.')}${buildChartCard('Fitted values', buildSvgLineChart(fittedItems, { color: '#d2b27a' }), 'Method-specific fitted values.')}</div>`
      ),
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function renderClusterAnalysis() {
  const fieldsEl = document.getElementById('cluster-analysis-fields');
  const countEl = document.getElementById('cluster-count');
  const runBtn = document.getElementById('run-cluster-analysis-btn');
  const resultEl = document.getElementById('cluster-analysis-result');
  if (!fieldsEl || !countEl || !runBtn || !resultEl) return;
  const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
  const previousSelections = getSelectedValues(fieldsEl);
  fieldsEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  for (const option of fieldsEl.options) option.selected = previousSelections.includes(option.value);
  if (getSelectedValues(fieldsEl).length < 2) {
    numericOptions.slice(0, Math.min(3, numericOptions.length)).forEach((option) => {
      const target = [...fieldsEl.options].find((candidate) => candidate.value === option.key);
      if (target) target.selected = true;
    });
  }
  runBtn.disabled = numericOptions.length < 2;

  if (!state.clusterAnalysisResult) {
    resultEl.innerHTML = '<p>Choose at least two numeric fields and run cluster analysis.</p>';
    return;
  }

  const result = state.clusterAnalysisResult;
  const clusterItems = result.clusters.map((cluster) => ({ label: `C${cluster.cluster}`, value: cluster.count }));
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Cluster analysis',
    title: `${result.clusterCount} cluster k-means solution`,
    summary: `${result.caseCount} usable rows across ${result.fieldLabels.join(', ')}.`,
    metrics: [
      { label: 'Rows', value: result.caseCount },
      { label: 'Clusters', value: result.clusterCount },
      { label: 'Iterations', value: result.iterations },
      { label: 'Silhouette', value: formatStatValue(result.metrics.averageSilhouette, 5) }
    ],
    sections: [
      buildOutputSection(
        'Cluster summaries',
        buildOutputTable(
          ['Cluster', 'Count', 'Percent', ...result.fields.map((field, index) => escapeHtml(result.fieldLabels[index] ?? field))],
          result.clusters.map((cluster) => [
            String(cluster.cluster),
            String(cluster.count),
            `${formatDecimal(cluster.proportion * 100, 1)}%`,
            ...result.fields.map((field) => formatStatValue(cluster.center[field], 5))
          ])
        )
      ),
      buildOutputSection(
        'Assignment preview',
        buildOutputTable(
          ['Case', 'Cluster', 'Distance'],
          result.assignments.slice(0, 50).map((assignment) => [
            escapeHtml(assignment.caseLabel ?? assignment.caseId ?? 'case'),
            String(assignment.cluster),
            formatStatValue(assignment.distance, 5)
          ])
        )
      ),
      buildOutputSection(
        'Cluster sizes',
        `<div class="chart-grid">${buildChartCard('Cases per cluster', buildSvgBarChart(clusterItems, { color: '#7ea7a1', formatter: (value) => String(Math.round(value)) }), 'Cluster membership counts.')}</div>`
      ),
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function flattenDecisionTree(node, rows = []) {
  if (!node) return rows;
  rows.push({
    id: node.id,
    depth: node.depth,
    count: node.count,
    prediction: node.prediction,
    split: node.split ? `${node.split.label} ${node.split.operator} ${node.split.value}` : 'leaf'
  });
  flattenDecisionTree(node.left, rows);
  flattenDecisionTree(node.right, rows);
  return rows;
}

function renderDecisionTree() {
  const targetEl = document.getElementById('decision-tree-target-field');
  const predictorsEl = document.getElementById('decision-tree-predictor-fields');
  const depthEl = document.getElementById('decision-tree-depth');
  const runBtn = document.getElementById('run-decision-tree-btn');
  const resultEl = document.getElementById('decision-tree-result');
  if (!targetEl || !predictorsEl || !depthEl || !runBtn || !resultEl) return;
  const options = getDatasetAnalysisFieldOptions();
  const previousTarget = targetEl.value;
  const previousPredictors = getSelectedValues(predictorsEl);
  targetEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.valueType})</option>`).join('');
  predictorsEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${option.valueType})</option>`).join('');
  targetEl.value = options.some((option) => option.key === previousTarget) ? previousTarget : options[0]?.key ?? '';
  for (const option of predictorsEl.options) {
    option.selected = previousPredictors.includes(option.value) && option.value !== targetEl.value;
  }
  if (getSelectedValues(predictorsEl).length === 0) {
    options.filter((option) => option.key !== targetEl.value).slice(0, 4).forEach((option) => {
      const target = [...predictorsEl.options].find((candidate) => candidate.value === option.key);
      if (target) target.selected = true;
    });
  }
  runBtn.disabled = options.length < 2;

  if (!state.decisionTreeResult) {
    resultEl.innerHTML = '<p>Choose a target field and predictor fields, then run a decision tree.</p>';
    return;
  }

  const result = state.decisionTreeResult;
  const treeRows = flattenDecisionTree(result.tree);
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Decision tree',
    title: `${result.targetLabel} classification tree`,
    summary: `Training accuracy ${formatStatValue(result.accuracy === null ? null : result.accuracy * 100, 2)}% across ${result.caseCount} row(s).`,
    metrics: [
      { label: 'Rows', value: result.caseCount },
      { label: 'Depth', value: result.maxDepth },
      { label: 'Predictors', value: result.predictorFields.length },
      { label: 'Accuracy', value: result.accuracy === null ? 'n/a' : `${formatDecimal(result.accuracy * 100, 1)}%` }
    ],
    sections: [
      buildOutputSection(
        'Tree nodes',
        buildOutputTable(
          ['Node', 'Depth', 'Rows', 'Prediction', 'Split'],
          treeRows.map((row) => [
            escapeHtml(row.id),
            String(row.depth),
            String(row.count),
            escapeHtml(row.prediction),
            escapeHtml(row.split)
          ])
        )
      ),
      buildOutputSection(
        'Confusion matrix',
        buildOutputTable(
          ['Actual', 'Predicted', 'Count'],
          result.confusionMatrix.map((cell) => [
            escapeHtml(cell.actual),
            escapeHtml(cell.predicted),
            String(cell.count)
          ])
        )
      ),
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function renderGeneralLinearModel() {
  const dependentEl = document.getElementById('glm-dependent-field');
  const factorsEl = document.getElementById('glm-factor-fields');
  const covariatesEl = document.getElementById('glm-covariate-fields');
  const runBtn = document.getElementById('run-general-linear-model-btn');
  const resultEl = document.getElementById('general-linear-model-result');
  if (!dependentEl || !factorsEl || !covariatesEl || !runBtn || !resultEl) return;

  const options = getDatasetAnalysisFieldOptions();
  const numericOptions = options.filter((option) => option.valueType === 'number');
  const previousDependent = dependentEl.value;
  const previousFactors = getSelectedValues(factorsEl);
  const previousCovariates = getSelectedValues(covariatesEl);
  dependentEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  dependentEl.value = numericOptions.some((option) => option.key === previousDependent) ? previousDependent : numericOptions[0]?.key ?? '';
  factorsEl.innerHTML = options
    .filter((option) => option.key !== dependentEl.value)
    .map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${escapeHtml(option.valueType)})</option>`)
    .join('');
  covariatesEl.innerHTML = numericOptions
    .filter((option) => option.key !== dependentEl.value)
    .map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`)
    .join('');
  for (const option of factorsEl.options) option.selected = previousFactors.includes(option.value);
  for (const option of covariatesEl.options) option.selected = previousCovariates.includes(option.value) && !getSelectedValues(factorsEl).includes(option.value);
  if (getSelectedValues(factorsEl).length === 0 && getSelectedValues(covariatesEl).length === 0) {
    const defaultFactor = [...factorsEl.options].find((option) => option.value !== dependentEl.value);
    if (defaultFactor) defaultFactor.selected = true;
  }
  runBtn.disabled = !dependentEl.value || (getSelectedValues(factorsEl).length === 0 && getSelectedValues(covariatesEl).length === 0);

  if (!state.generalLinearModelResult) {
    resultEl.innerHTML = '<p>Choose a numeric dependent field plus factor or covariate fields, then run GLM.</p>';
    return;
  }

  const result = state.generalLinearModelResult;
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'GLM / ANCOVA',
    title: `${result.dependentLabel} general linear model`,
    summary: `${result.caseCount} usable row(s), R squared ${formatStatValue(result.metrics.rSquared, 5)}, omnibus F ${formatStatValue(result.metrics.fStatistic, 5)}.`,
    metrics: [
      { label: 'Rows', value: result.caseCount },
      { label: 'Design columns', value: result.designColumnCount },
      { label: 'R squared', value: formatStatValue(result.metrics.rSquared, 5) },
      { label: 'Model p', value: formatStatValue(result.metrics.fPValue, 5) }
    ],
    sections: [
      buildOutputSection(
        'Model fit',
        buildOutputTable(
          ['Metric', 'Value'],
          [
            ['Model df', String(result.metrics.modelDf)],
            ['Residual df', String(result.metrics.residualDf)],
            ['SS model', formatStatValue(result.metrics.sumSquaresModel, 5)],
            ['SS residual', formatStatValue(result.metrics.sumSquaresResidual, 5)],
            ['Residual std. error', formatStatValue(result.metrics.residualStdError, 5)]
          ]
        )
      ),
      buildOutputSection(
        'Coefficients',
        buildOutputTable(
          ['Term', 'Type', 'B', 'Std. error', 't', 'p', '95% CI'],
          result.coefficients.map((coefficient) => [
            escapeHtml(coefficient.label ?? coefficient.field),
            escapeHtml(coefficient.termType),
            formatStatValue(coefficient.coefficient, 6),
            formatStatValue(coefficient.standardError, 6),
            formatStatValue(coefficient.statistic, 5),
            formatStatValue(coefficient.pValue, 5),
            escapeHtml(formatConfidenceInterval(coefficient.confidenceInterval, 5))
          ])
        )
      ),
      buildOutputSection(
        'Terms',
        buildOutputTable(
          ['Field', 'Type', 'Levels / baseline'],
          result.terms.map((term) => [
            escapeHtml(term.label),
            escapeHtml(term.type),
            escapeHtml(term.type === 'factor'
              ? `${(term.levels ?? []).join(', ')}; baseline ${term.baseline ?? 'n/a'}`
              : 'numeric covariate')
          ])
        )
      ),
      buildAssumptionsSection(result.assumptions),
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function renderRepeatedMeasures() {
  const fieldsEl = document.getElementById('repeated-measures-fields');
  const runBtn = document.getElementById('run-repeated-measures-btn');
  const resultEl = document.getElementById('repeated-measures-result');
  if (!fieldsEl || !runBtn || !resultEl) return;
  const numericOptions = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
  const previousSelections = getSelectedValues(fieldsEl);
  fieldsEl.innerHTML = numericOptions.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  for (const option of fieldsEl.options) option.selected = previousSelections.includes(option.value);
  if (getSelectedValues(fieldsEl).length < 2) {
    numericOptions.slice(0, Math.min(3, numericOptions.length)).forEach((option) => {
      const target = [...fieldsEl.options].find((candidate) => candidate.value === option.key);
      if (target) target.selected = true;
    });
  }
  runBtn.disabled = numericOptions.length < 2;

  if (!state.repeatedMeasuresResult) {
    resultEl.innerHTML = '<p>Choose at least two numeric repeated measure fields, then run repeated measures.</p>';
    return;
  }

  const result = state.repeatedMeasuresResult;
  const meanItems = result.summaries.map((summary) => ({ label: summary.label, value: summary.mean }));
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Repeated measures',
    title: `${result.measureCount} within-subject measure(s)`,
    summary: `${result.subjectCount} complete subject row(s), omnibus F ${formatStatValue(result.anova?.fStatistic, 5)}.`,
    metrics: [
      { label: 'Subjects', value: result.subjectCount },
      { label: 'Measures', value: result.measureCount },
      { label: 'F', value: formatStatValue(result.anova?.fStatistic, 5) },
      { label: 'p', value: formatStatValue(result.anova?.pValue, 5) }
    ],
    sections: [
      buildOutputSection(
        'Measure summaries',
        buildOutputTable(
          ['Measure', 'N', 'Mean', 'Std. dev.', 'Min', 'Max'],
          result.summaries.map((summary) => [
            escapeHtml(summary.label),
            String(summary.count),
            formatStatValue(summary.mean, 5),
            formatStatValue(summary.stdDev, 5),
            formatStatValue(summary.min, 5),
            formatStatValue(summary.max, 5)
          ])
        )
      ),
      result.anova ? buildOutputSection(
        'Within-subject omnibus test',
        buildOutputTable(
          ['Effect', 'SS', 'df', 'F', 'p', 'Partial eta squared'],
          [[
            'Condition',
            formatStatValue(result.anova.ssCondition, 5),
            `${result.anova.dfCondition}, ${result.anova.dfError}`,
            formatStatValue(result.anova.fStatistic, 5),
            formatStatValue(result.anova.pValue, 5),
            formatStatValue(result.anova.partialEtaSquared, 5)
          ]]
        )
      ) : '',
      buildOutputSection(
        'Pairwise differences',
        buildOutputTable(
          ['Comparison', 'Mean difference', 'Std. dev. diff.', 't', 'df', 'p', '95% CI'],
          result.pairwiseComparisons.map((comparison) => [
            `${escapeHtml(comparison.rightLabel)} - ${escapeHtml(comparison.leftLabel)}`,
            formatStatValue(comparison.meanDifference, 5),
            formatStatValue(comparison.stdDevDifference, 5),
            formatStatValue(comparison.tStatistic, 5),
            String(comparison.degreesOfFreedom),
            formatStatValue(comparison.pValue, 5),
            escapeHtml(formatConfidenceInterval(comparison.confidenceInterval, 5))
          ])
        )
      ),
      buildOutputSection(
        'Profile plot direction',
        `<div class="chart-grid">${buildChartCard('Condition means', buildSvgLineChart(meanItems, { color: '#d2b27a' }), 'Mean profile across selected repeated fields.')}</div>`
      ),
      buildAssumptionsSection(result.assumptions),
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function renderSurvivalAnalysis() {
  const timeEl = document.getElementById('survival-time-field');
  const eventEl = document.getElementById('survival-event-field');
  const groupEl = document.getElementById('survival-group-field');
  const runBtn = document.getElementById('run-survival-analysis-btn');
  const resultEl = document.getElementById('survival-analysis-result');
  if (!timeEl || !eventEl || !groupEl || !runBtn || !resultEl) return;
  const options = getDatasetAnalysisFieldOptions();
  const previousTime = timeEl.value;
  const previousEvent = eventEl.value;
  const previousGroup = groupEl.value;
  timeEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${escapeHtml(option.valueType)})</option>`).join('');
  timeEl.value = options.some((option) => option.key === previousTime) ? previousTime : options[0]?.key ?? '';
  eventEl.innerHTML = options
    .filter((option) => option.key !== timeEl.value)
    .map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${escapeHtml(option.valueType)})</option>`)
    .join('');
  eventEl.value = options.some((option) => option.key === previousEvent && option.key !== timeEl.value)
    ? previousEvent
    : options.find((option) => option.key !== timeEl.value)?.key ?? '';
  groupEl.innerHTML = `<option value="">No grouping</option>${options
    .filter((option) => option.key !== timeEl.value && option.key !== eventEl.value)
    .map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${escapeHtml(option.valueType)})</option>`)
    .join('')}`;
  groupEl.value = options.some((option) => option.key === previousGroup && option.key !== timeEl.value && option.key !== eventEl.value) ? previousGroup : '';
  runBtn.disabled = options.length < 2 || !timeEl.value || !eventEl.value;

  if (!state.survivalAnalysisResult) {
    resultEl.innerHTML = '<p>Choose time and event fields, then run Kaplan-Meier survival analysis.</p>';
    return;
  }

  const result = state.survivalAnalysisResult;
  const survivalCharts = result.groups.map((group) => {
    const items = result.steps
      .filter((step) => step.groupValue === group.groupValue)
      .map((step) => ({ label: String(step.time), value: step.survival }));
    return buildChartCard(
      `${group.groupValue} survival`,
      buildSvgLineChart(items, { color: '#8fb3ff' }),
      'Kaplan-Meier survival estimate by observed time.'
    );
  }).join('');
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Survival analysis',
    title: `${result.timeLabel} by ${result.eventLabel}`,
    summary: `${result.caseCount} usable row(s) across ${result.groups.length} group(s).`,
    metrics: [
      { label: 'Rows', value: result.caseCount },
      { label: 'Groups', value: result.groups.length },
      { label: 'Events', value: result.groups.reduce((total, group) => total + group.eventCount, 0) },
      { label: 'Censored', value: result.groups.reduce((total, group) => total + group.censoredCount, 0) }
    ],
    sections: [
      buildOutputSection(
        'Group summaries',
        buildOutputTable(
          ['Group', 'Rows', 'Events', 'Censored', 'Median survival', 'Last survival'],
          result.groups.map((group) => [
            escapeHtml(group.groupValue),
            String(group.caseCount),
            String(group.eventCount),
            String(group.censoredCount),
            formatStatValue(group.medianSurvival, 5),
            formatStatValue(group.lastSurvival, 5)
          ])
        )
      ),
      buildOutputSection(
        'Kaplan-Meier table',
        buildOutputTable(
          ['Group', 'Time', 'At risk', 'Events', 'Censored', 'Survival'],
          result.steps.map((step) => [
            escapeHtml(step.groupValue),
            formatStatValue(step.time, 5),
            String(step.atRisk),
            String(step.events),
            String(step.censored),
            formatStatValue(step.survival, 5)
          ])
        )
      ),
      survivalCharts ? buildOutputSection('Survival curves', `<div class="chart-grid">${survivalCharts}</div>`) : '',
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function renderComplexSamples() {
  const targetEl = document.getElementById('complex-samples-target-field');
  const strataEl = document.getElementById('complex-samples-strata-field');
  const clusterEl = document.getElementById('complex-samples-cluster-field');
  const groupEl = document.getElementById('complex-samples-group-field');
  const runBtn = document.getElementById('run-complex-samples-btn');
  const resultEl = document.getElementById('complex-samples-result');
  if (!targetEl || !strataEl || !clusterEl || !groupEl || !runBtn || !resultEl) return;
  const options = getDatasetAnalysisFieldOptions();
  const previous = {
    target: targetEl.value,
    strata: strataEl.value,
    cluster: clusterEl.value,
    group: groupEl.value
  };
  targetEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${escapeHtml(option.valueType)})</option>`).join('');
  targetEl.value = options.some((option) => option.key === previous.target) ? previous.target : options[0]?.key ?? '';
  const optionalOptions = (currentValue) => `<option value="">None</option>${options
    .filter((option) => option.key !== targetEl.value)
    .map((option) => `<option value="${escapeHtml(option.key)}"${option.key === currentValue ? ' selected' : ''}>${escapeHtml(option.label)} (${escapeHtml(option.valueType)})</option>`)
    .join('')}`;
  strataEl.innerHTML = optionalOptions(previous.strata);
  clusterEl.innerHTML = optionalOptions(previous.cluster);
  groupEl.innerHTML = optionalOptions(previous.group);
  runBtn.disabled = !targetEl.value || options.length === 0;

  if (!state.complexSamplesResult) {
    resultEl.innerHTML = '<p>Choose a target and optional survey design fields, then run complex samples.</p>';
    return;
  }

  const result = state.complexSamplesResult;
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Complex samples',
    title: `${result.targetLabel} survey-design summary`,
    summary: `${result.caseCount} usable row(s), ${result.designSummary.domainCount} domain(s), statistic: ${result.statistic}.`,
    metrics: [
      { label: 'Rows', value: result.caseCount },
      { label: 'Weighted rows', value: formatStatValue(result.designSummary.weightedCaseCount, 3) },
      { label: 'Strata', value: result.designSummary.strataCount ?? 'n/a' },
      { label: 'Clusters', value: result.designSummary.clusterCount ?? 'n/a' }
    ],
    sections: [
      buildOutputSection(
        'Design setup',
        buildOutputTable(
          ['Role', 'Field'],
          [
            ['Target', escapeHtml(result.targetLabel)],
            ['Weight', escapeHtml(result.weightField ?? 'No weight field selected')],
            ['Strata', escapeHtml(result.strataLabel ?? 'None')],
            ['Cluster', escapeHtml(result.clusterLabel ?? 'None')],
            ['Domain/group', escapeHtml(result.groupLabel ?? 'All cases')]
          ]
        )
      ),
      buildOutputSection(
        'Estimates',
        buildOutputTable(
          ['Domain', 'Level', 'Statistic', 'N', 'Weighted N', 'Estimate', 'Std. error', '95% CI', 'Design effect'],
          result.estimates.map((estimate) => [
            escapeHtml(estimate.domainValue),
            escapeHtml(estimate.levelValue ?? ''),
            escapeHtml(estimate.statistic),
            String(estimate.count),
            formatStatValue(estimate.weightedCount, 3),
            formatStatValue(estimate.estimate, 5),
            formatStatValue(estimate.standardError, 5),
            escapeHtml(formatConfidenceInterval(estimate.confidenceInterval, 5)),
            formatStatValue(estimate.designEffect, 5)
          ])
        )
      ),
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function renderNeuralNetwork() {
  const targetEl = document.getElementById('neural-network-target-field');
  const predictorsEl = document.getElementById('neural-network-predictor-fields');
  const taskEl = document.getElementById('neural-network-task');
  const hiddenEl = document.getElementById('neural-network-hidden-units');
  const runBtn = document.getElementById('run-neural-network-btn');
  const resultEl = document.getElementById('neural-network-result');
  if (!targetEl || !predictorsEl || !taskEl || !hiddenEl || !runBtn || !resultEl) return;
  const options = getDatasetAnalysisFieldOptions();
  const numericOptions = options.filter((option) => option.valueType === 'number');
  const previousTarget = targetEl.value;
  const previousPredictors = getSelectedValues(predictorsEl);
  targetEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${escapeHtml(option.valueType)})</option>`).join('');
  targetEl.value = options.some((option) => option.key === previousTarget) ? previousTarget : options[0]?.key ?? '';
  predictorsEl.innerHTML = numericOptions
    .filter((option) => option.key !== targetEl.value)
    .map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`)
    .join('');
  for (const option of predictorsEl.options) option.selected = previousPredictors.includes(option.value);
  if (getSelectedValues(predictorsEl).length === 0) {
    numericOptions.filter((option) => option.key !== targetEl.value).slice(0, 4).forEach((option) => {
      const target = [...predictorsEl.options].find((candidate) => candidate.value === option.key);
      if (target) target.selected = true;
    });
  }
  runBtn.disabled = !targetEl.value || getSelectedValues(predictorsEl).length === 0;

  if (!state.neuralNetworkResult) {
    resultEl.innerHTML = '<p>Choose a target and numeric predictors, then run a neural network.</p>';
    return;
  }

  const result = state.neuralNetworkResult;
  const importanceItems = result.featureImportance.map((item) => ({ label: item.label, value: item.importance }));
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Neural network',
    title: `${result.targetLabel} ${result.task} model`,
    summary: `${result.caseCount} usable row(s), ${result.hiddenUnits} hidden units.`,
    metrics: [
      { label: 'Rows', value: result.caseCount },
      { label: 'Task', value: result.task },
      { label: 'Accuracy', value: result.metrics.accuracy === undefined ? 'n/a' : `${formatDecimal((result.metrics.accuracy ?? 0) * 100, 1)}%` },
      { label: 'RMSE', value: formatStatValue(result.metrics.rootMeanSquaredError, 5) }
    ],
    sections: [
      buildOutputSection(
        'Feature importance',
        buildOutputTable(
          ['Predictor', 'Importance'],
          result.featureImportance.map((item) => [
            escapeHtml(item.label),
            formatStatValue(item.importance, 5)
          ])
        )
      ),
      result.confusionMatrix?.length ? buildOutputSection(
        'Confusion matrix',
        buildOutputTable(
          ['Actual', 'Predicted', 'Count'],
          result.confusionMatrix.map((cell) => [
            escapeHtml(cell.actual),
            escapeHtml(cell.predicted),
            String(cell.count)
          ])
        )
      ) : '',
      buildOutputSection(
        'Prediction preview',
        buildOutputTable(
          ['Case', 'Actual', 'Predicted', 'Residual'],
          result.predictions.slice(0, 50).map((prediction) => [
            escapeHtml(prediction.caseLabel ?? prediction.caseId ?? 'case'),
            escapeHtml(String(prediction.actual)),
            escapeHtml(String(typeof prediction.predicted === 'number' ? formatStatValue(prediction.predicted, 5) : prediction.predicted)),
            formatStatValue(prediction.residual, 5)
          ])
        )
      ),
      importanceItems.length ? buildOutputSection(
        'Importance chart',
        `<div class="chart-grid">${buildChartCard('Predictor importance', buildSvgBarChart(importanceItems, { color: '#d2b27a' }), 'Relative importance from input-to-hidden and hidden-to-output weights.')}</div>`
      ) : '',
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function renderSyntaxCommandOutput(result) {
  if (result.status !== 'ok') {
    return `<p class="small-muted">${escapeHtml(result.message)}</p>`;
  }
  if (result.outputKind === 'descriptives') {
    const summaries = Array.isArray(result.output) ? result.output : [];
    return buildOutputTable(
      ['Field', 'N', 'Missing', 'Mean', 'Std. dev.', 'Min', 'Max'],
      summaries.map((summary) => [
        escapeHtml(summary.label ?? summary.key ?? ''),
        String(summary.validCount ?? ''),
        String(summary.missingCount ?? ''),
        formatStatValue(summary.numeric?.mean, 5),
        formatStatValue(summary.numeric?.stdDev, 5),
        formatStatValue(summary.numeric?.min, 5),
        formatStatValue(summary.numeric?.max, 5)
      ])
    );
  }
  if (result.outputKind === 'frequencies') {
    const summaries = Array.isArray(result.output) ? result.output : [];
    return summaries.map((summary) => buildOutputSection(
      `Frequency: ${summary.label ?? summary.key ?? 'field'}`,
      buildOutputTable(
        ['Value', 'Count', 'Percent'],
        (summary.frequencies ?? []).slice(0, 30).map((frequency) => [
          escapeHtml(frequency.value),
          formatStatValue(frequency.count, 3),
          `${formatDecimal((frequency.proportion ?? 0) * 100, 1)}%`
        ])
      )
    )).join('');
  }
  if (result.outputKind === 'crosstab') {
    const table = result.output ?? {};
    return buildOutputTable(
      ['Row', 'Column', 'Count', 'Row %', 'Column %'],
      (table.cells ?? []).map((cell) => [
        escapeHtml(cell.rowValue),
        escapeHtml(cell.columnValue),
        formatStatValue(cell.count, 3),
        `${formatDecimal((cell.rowProportion ?? 0) * 100, 1)}%`,
        `${formatDecimal((cell.columnProportion ?? 0) * 100, 1)}%`
      ])
    );
  }
  if (result.outputKind === 'correlations') {
    const correlations = Array.isArray(result.output) ? result.output : [];
    return buildOutputTable(
      ['X', 'Y', 'N', 'Pearson r', 'p', '95% CI'],
      correlations.map((item) => [
        escapeHtml(item.xField ?? ''),
        escapeHtml(item.yField ?? ''),
        String(item.caseCount ?? ''),
        formatStatValue(item.pearsonR, 5),
        formatStatValue(item.pValue, 5),
        escapeHtml(formatConfidenceInterval(item.confidenceInterval, 5))
      ])
    );
  }
  if (result.outputKind === 'regression') {
    const regression = result.output ?? {};
    return [
      buildOutputTable(
        ['Metric', 'Value'],
        Object.entries(regression.metrics ?? {}).slice(0, 12).map(([key, value]) => [
          escapeHtml(key),
          formatStatValue(value, 5)
        ])
      ),
      buildOutputTable(
        ['Term', 'B', 'Std. error', 't/z', 'p', '95% CI'],
        (regression.coefficients ?? []).map((coefficient) => [
          escapeHtml(coefficient.field ?? ''),
          formatStatValue(coefficient.coefficient, 6),
          formatStatValue(coefficient.standardError, 6),
          formatStatValue(coefficient.statistic, 5),
          formatStatValue(coefficient.pValue, 5),
          escapeHtml(formatConfidenceInterval(coefficient.confidenceInterval, 5))
        ])
      )
    ].join('');
  }
  return `<pre>${escapeHtml(JSON.stringify(result.output ?? result.message, null, 2))}</pre>`;
}

function renderSyntaxRun() {
  const inputEl = document.getElementById('syntax-input');
  const runBtn = document.getElementById('run-syntax-btn');
  const resultEl = document.getElementById('syntax-run-result');
  if (!inputEl || !runBtn || !resultEl) return;
  runBtn.disabled = !state.selectedProjectId;

  if (!state.syntaxRunResult) {
    resultEl.innerHTML = '<p>Enter syntax in the Data Syntax subtab and run it.</p>';
    return;
  }

  const result = state.syntaxRunResult;
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Syntax run',
    title: 'SPSS-like syntax output',
    summary: `${result.successfulCommandCount} of ${result.commandCount} command(s) completed.`,
    metrics: [
      { label: 'Commands', value: result.commandCount },
      { label: 'Successful', value: result.successfulCommandCount },
      { label: 'Failed', value: result.commandCount - result.successfulCommandCount },
      { label: 'Status', value: result.successfulCommandCount === result.commandCount ? 'complete' : 'review' }
    ],
    sections: [
      ...result.results.map((commandResult, index) => buildOutputSection(
        `${index + 1}. ${commandResult.commandName} (${commandResult.status})`,
        `
          <p class="small-muted">${escapeHtml(commandResult.message)}</p>
          <pre>${escapeHtml(commandResult.command)}</pre>
          ${renderSyntaxCommandOutput(commandResult)}
        `
      )),
      result.notes?.length ? buildOutputSection('Notes', buildOutputList(result.notes.map(escapeHtml))) : ''
    ].filter(Boolean)
  });
}

function renderCorrelation() {
  const xEl = document.getElementById('correlation-x-field');
  const yEl = document.getElementById('correlation-y-field');
  const runBtn = document.getElementById('run-correlation-btn');
  const resultEl = document.getElementById('correlation-result');
  if (!xEl || !yEl || !runBtn || !resultEl) return;

  {
    const options = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
    const previousX = xEl.value;
    const previousY = yEl.value;
    xEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    yEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
    if (options.length > 0) {
      xEl.value = options.some((option) => option.key === previousX) ? previousX : options[0].key;
    }
    if (options.length > 1) {
      yEl.value = options.some((option) => option.key === previousY && option.key !== xEl.value)
        ? previousY
        : (options.find((option) => option.key !== xEl.value)?.key ?? options[0].key);
    } else if (options.length === 1) {
      yEl.value = options[0].key;
    }
    runBtn.disabled = options.length < 2;

    if (options.length < 2) {
      resultEl.innerHTML = '<p>Add at least two numeric fields before running a correlation.</p>';
      return;
    }

    if (!state.correlationResult) {
      resultEl.innerHTML = '<p>Choose two numeric fields and run a correlation.</p>';
      return;
    }

      const result = state.correlationResult;
      const effectItems = [
        { label: 'r', value: Math.abs(result.pearsonR) },
        { label: 'r²', value: result.rSquared },
        { label: 'cov', value: Math.abs(result.covariance) }
      ];
      resultEl.innerHTML = buildOutputViewer({
      eyebrow: 'Correlation',
      title: `${result.xField} vs ${result.yField}`,
      summary: `Pearson r ${formatStatValue(result.pearsonR, 4)} with p ${formatStatValue(result.pValue, 4)} and 95% CI ${formatConfidenceInterval(result.confidenceInterval, 4)}.`,
      metrics: [
        { label: 'Cases', value: result.caseCount },
        { label: 'r', value: formatStatValue(result.pearsonR, 4) },
        { label: 'r squared', value: formatStatValue(result.rSquared, 4) },
        { label: 'Covariance', value: formatStatValue(result.covariance, 4) }
      ],
        sections: [
          buildOutputSection(
            'Field statistics',
          buildOutputTable(
            ['Field', 'Mean', 'Std dev'],
            [
              [escapeHtml(result.xField), formatStatValue(result.xMean, 3), formatStatValue(result.xStdDev, 3)],
              [escapeHtml(result.yField), formatStatValue(result.yMean, 3), formatStatValue(result.yStdDev, 3)]
              ]
            )
          ),
          buildOutputSection(
            'Effect profile',
            `<div class="chart-grid">${buildChartCard('Correlation strength', buildSvgBarChart(effectItems, { color: '#7ea7a1', formatter: (value) => formatDecimal(value, 3) }), 'Absolute effect-size indicators for the selected pair.')}</div>`
          ),
          buildChartSuggestionsSection([
            'Scatter plot with fitted line for the selected pair',
            'Confidence-interval plot for Pearson r',
            'Effect-size bar chart across saved correlations'
          ])
        ]
      });
    return;
  }

  const options = getDatasetAnalysisFieldOptions().filter((option) => option.valueType === 'number');
  const previousX = xEl.value;
  const previousY = yEl.value;
  xEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  yEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
  if (options.length > 0) {
    xEl.value = options.some((option) => option.key === previousX) ? previousX : options[0].key;
  }
  if (options.length > 1) {
    yEl.value = options.some((option) => option.key === previousY && option.key !== xEl.value)
      ? previousY
      : (options.find((option) => option.key !== xEl.value)?.key ?? options[0].key);
  } else if (options.length === 1) {
    yEl.value = options[0].key;
  }
  runBtn.disabled = options.length < 2;

  if (options.length < 2) {
    resultEl.innerHTML = '<p>Add at least two numeric fields before running a correlation.</p>';
    return;
  }

  if (!state.correlationResult) {
    resultEl.innerHTML = '<p>Choose two numeric fields and run a correlation.</p>';
    return;
  }

  resultEl.innerHTML = `
    <p><strong>Pearson correlation</strong> between <strong>${escapeHtml(state.correlationResult.xField)}</strong> and <strong>${escapeHtml(state.correlationResult.yField)}</strong></p>
    <span class="source-meta">Cases: ${state.correlationResult.caseCount}</span>
    <span class="source-meta">r: ${formatDecimal(state.correlationResult.pearsonR, 4)}</span>
    <span class="source-meta">r²: ${formatDecimal(state.correlationResult.rSquared, 4)}</span>
    <span class="source-meta">p: ${state.correlationResult.pValue === null || state.correlationResult.pValue === undefined ? 'n/a' : formatDecimal(state.correlationResult.pValue, 4)}</span>
    <span class="source-meta">Covariance: ${formatDecimal(state.correlationResult.covariance, 4)}</span>
    <span class="source-meta">X mean/std: ${formatDecimal(state.correlationResult.xMean, 3)} / ${formatDecimal(state.correlationResult.xStdDev, 3)}</span>
    <span class="source-meta">Y mean/std: ${formatDecimal(state.correlationResult.yMean, 3)} / ${formatDecimal(state.correlationResult.yStdDev, 3)}</span>
    <p style="margin-top:10px">95% CI: <strong>${state.correlationResult.confidenceInterval?.lower === null || state.correlationResult.confidenceInterval?.lower === undefined ? 'n/a' : `${formatDecimal(state.correlationResult.confidenceInterval.lower, 4)} to ${formatDecimal(state.correlationResult.confidenceInterval.upper, 4)}`}</strong></p>
  `;
}

function renderRetrieval() {
  const summaryEl = document.getElementById('retrieval-summary');
  const listEl = document.getElementById('retrieval-results-list');
  if (!summaryEl || !listEl) return;

  summaryEl.textContent = state.retrievalResults.length === 0
    ? 'Run a retrieval to inspect coded evidence.'
    : `${state.retrievalResults.length} evidence match(es). Coverage: ${state.retrievalCoverage || 'unknown'}.`;

  listEl.innerHTML = '';
  if (state.retrievalResults.length === 0) {
    listEl.innerHTML = '<li class="interactive-list-item empty">No retrieval results yet.</li>';
    return;
  }

  for (const item of state.retrievalResults) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(item.source?.title ?? item.segment.sourceId)}</span>
          <span class="source-meta">${escapeHtml(item.segment.id)} · ${escapeHtml(item.segment.sourceId)}</span>
          <span class="source-meta">${escapeHtml(summarizeText(item.segment.text, 220))}</span>
          <span class="source-meta">Codes: ${item.applications.map((application) => escapeHtml(application.codeId)).join(', ') || 'none'}</span>
          <span class="source-meta">Cases: ${item.cases.map((caseEntity) => escapeHtml(caseEntity.label)).join(', ') || 'none'}</span>
        </div>
        <div class="inline-actions">
          <span class="badge">${item.applications.length}</span>
          <button type="button" class="small retrieval-open-workspace-btn">Open in coding</button>
        </div>
      </div>
    `;
    li.querySelector('.retrieval-open-workspace-btn')?.addEventListener('click', () => {
      jumpToWorkspaceSegment(item.segment.id, item.segment.sourceId);
    });
    listEl.appendChild(li);
  }
}

function renderTextSearch() {
  const summaryEl = document.getElementById('text-search-summary');
  const resultEl = document.getElementById('text-search-result');
  if (!summaryEl || !resultEl) return;
  if (!state.textSearchResult) {
    summaryEl.textContent = 'Run a text search to inspect matching snippets inside the current qualitative scope.';
    resultEl.innerHTML = '<p>No text search yet.</p>';
    return;
  }
  const result = state.textSearchResult;
  summaryEl.textContent = `${result.totalHits} hit(s) across ${result.totalSegments} segment(s) using ${result.matchMode}.`;
  if (result.hits.length === 0) {
    resultEl.innerHTML = '<p>No text-search hits matched the current qualitative scope.</p>';
    return;
  }
  resultEl.innerHTML = `
    <ul class="interactive-list">
      ${result.hits.map((hit) => `
        <li class="interactive-list-item">
          <div class="source-row">
            <div>
              <span class="project-title">${escapeHtml(hit.sourceTitle ?? hit.sourceId)}</span>
              <span class="source-meta">${escapeHtml(hit.segmentId)} · Hits ${hit.hitCount}</span>
              <span class="source-meta">Codes: ${hit.codeIds.map((codeId) => escapeHtml(codeId)).join(', ') || 'none'}</span>
              <span class="source-meta">Cases: ${hit.caseIds.map((caseId) => escapeHtml(caseId)).join(', ') || 'none'}</span>
              <div class="stack gap-8" style="margin-top:8px">
                ${hit.snippets.map((snippet) => `<span class="source-meta">${escapeHtml(snippet)}</span>`).join('')}
              </div>
            </div>
            <div class="inline-actions">
              <button type="button" class="small text-search-open-btn" data-segment-id="${escapeHtml(hit.segmentId)}" data-source-id="${escapeHtml(hit.sourceId)}">Open in coding</button>
            </div>
          </div>
        </li>
      `).join('')}
    </ul>
  `;
  resultEl.querySelectorAll('.text-search-open-btn').forEach((button) => {
    button.addEventListener('click', () => {
      jumpToWorkspaceSegment(button.dataset.segmentId, button.dataset.sourceId);
    });
  });
}

function renderWordFrequency() {
  const summaryEl = document.getElementById('word-frequency-summary');
  const resultEl = document.getElementById('word-frequency-result');
  if (!summaryEl || !resultEl) return;
  if (!state.wordFrequencyResult) {
    summaryEl.textContent = 'Run word frequency to inspect the most common terms in the current qualitative scope.';
    resultEl.innerHTML = '<p>No word frequency view yet.</p>';
    return;
  }
  const result = state.wordFrequencyResult;
  summaryEl.textContent = `${result.totalTokens} token(s), ${result.uniqueTokenCount} unique term(s), ${result.excludedStopWordCount} stop-word token(s) excluded.`;
  if (result.tokens.length === 0) {
    resultEl.innerHTML = '<p>No qualifying terms were found in the current qualitative scope.</p>';
    return;
  }
  resultEl.innerHTML = `
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Count</th>
            <th>Sources</th>
            <th>Segments</th>
          </tr>
        </thead>
        <tbody>
          ${result.tokens.map((token) => `
            <tr>
              <td>${escapeHtml(token.token)}</td>
              <td><strong>${token.count}</strong></td>
              <td>${token.sourceCount}</td>
              <td>${token.segmentCount}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderWordCloud() {
  const summaryEl = document.getElementById('word-cloud-summary');
  const resultEl = document.getElementById('word-cloud-result');
  if (!summaryEl || !resultEl) return;
  if (!state.wordCloudResult) {
    summaryEl.textContent = 'Build a word cloud to inspect dominant qualitative terms in the current scope.';
    resultEl.innerHTML = '<p>No word cloud yet.</p>';
    return;
  }
  const result = state.wordCloudResult;
  summaryEl.textContent = `${result.items.length} weighted term(s) from ${result.totalTokens} scoped token(s).`;
  if (result.items.length === 0) {
    resultEl.innerHTML = '<p>No qualifying terms were available for a word cloud.</p>';
    return;
  }
  const maxValue = Math.max(1, result.maxValue || 1);
  resultEl.innerHTML = `
    <div class="word-cloud-wrap">
      ${result.items.map((item) => {
        const scale = 0.9 + ((item.value / maxValue) * 1.8);
        return `<span class="word-cloud-token" style="font-size:${scale.toFixed(2)}rem" title="${escapeHtml(`${item.value} hits across ${item.segmentCount} segments`)}">${escapeHtml(item.text)}</span>`;
      }).join('')}
    </div>
  `;
}

function renderSentimentResult() {
  const summaryEl = document.getElementById('sentiment-summary');
  const resultEl = document.getElementById('sentiment-result');
  if (!summaryEl || !resultEl) return;
  if (!state.sentimentResult) {
    summaryEl.textContent = 'Run sentiment analysis to classify the current qualitative scope by positive, negative, mixed, or neutral language.';
    resultEl.innerHTML = '<p>No sentiment analysis yet.</p>';
    return;
  }
  const result = state.sentimentResult;
  summaryEl.textContent = `${result.totalSegments} scoped segment(s) analysed. Positive ${result.counts.positive}, negative ${result.counts.negative}, mixed ${result.counts.mixed}, neutral ${result.counts.neutral}.`;
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Sentiment analysis',
    title: 'Scoped qualitative sentiment',
    summary: `Average scored sentiment ${formatStatValue(result.averageScore, 3)} across non-neutral segments.`,
    metrics: [
      { label: 'Positive', value: result.counts.positive },
      { label: 'Negative', value: result.counts.negative },
      { label: 'Mixed', value: result.counts.mixed },
      { label: 'Neutral', value: result.counts.neutral }
    ],
    sections: [
      buildOutputSection(
        'Segment classifications',
        buildOutputTable(
          ['Label', 'Score', 'Source', 'Segment', 'Terms', 'Excerpt'],
          (result.hits ?? []).slice(0, 30).map((item) => [
            escapeHtml(item.label),
            escapeHtml(formatStatValue(item.score, 3)),
            escapeHtml(item.sourceTitle ?? item.sourceId),
            escapeHtml(item.segmentId),
            escapeHtml([...item.positiveTerms, ...item.negativeTerms].join(', ') || 'none'),
            escapeHtml(summarizeText(item.text, 140))
          ])
        )
      )
    ]
  });
}

function renderCompoundQuery() {
  const summaryEl = document.getElementById('compound-query-summary');
  const resultEl = document.getElementById('compound-query-result');
  if (!summaryEl || !resultEl) return;
  if (!state.compoundQueryResult) {
    summaryEl.textContent = 'Run a compound query to combine multiple qualitative clauses in one retrieval.';
    resultEl.innerHTML = '<p>No compound query yet.</p>';
    return;
  }
  const result = state.compoundQueryResult;
  summaryEl.textContent = `${result.matchCount} match(es), ${result.sourceCount} source(s), ${result.caseCount} case(s) using ${result.operator} logic across ${result.clauseCount} clause(s).`;
  if (result.items.length === 0) {
    resultEl.innerHTML = '<p>No matches satisfied the current compound query.</p>';
    return;
  }
  resultEl.innerHTML = `
    <ul class="interactive-list">
      ${result.items.map((item) => `
        <li class="interactive-list-item">
          <div class="source-row">
            <div>
              <span class="project-title">${escapeHtml(item.source?.title ?? item.segment.sourceId)}</span>
              <span class="source-meta">${escapeHtml(item.segment.id)} · ${escapeHtml(summarizeText(item.segment.text, 220))}</span>
              <span class="source-meta">Codes: ${item.applications.map((application) => escapeHtml(application.codeId)).join(', ') || 'none'}</span>
              <span class="source-meta">Cases: ${item.cases.map((caseEntity) => escapeHtml(caseEntity.label)).join(', ') || 'none'}</span>
            </div>
            <div class="inline-actions">
              <button type="button" class="small compound-open-workspace-btn" data-segment-id="${escapeHtml(item.segment.id)}" data-source-id="${escapeHtml(item.segment.sourceId)}">Open in coding</button>
            </div>
          </div>
        </li>
      `).join('')}
    </ul>
  `;
  resultEl.querySelectorAll('.compound-open-workspace-btn').forEach((button) => {
    button.addEventListener('click', () => {
      jumpToWorkspaceSegment(button.dataset.segmentId, button.dataset.sourceId);
    });
  });
}

function renderSavedQualitativeQueries() {
  const node = document.getElementById('saved-qualitative-queries-list');
  if (!node) return;
  if (state.savedQualitativeQueries.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No saved qualitative queries yet.</li>';
    return;
  }

  node.innerHTML = '';
  for (const savedQuery of state.savedQualitativeQueries) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(savedQuery.label)}</span>
          <span class="source-meta">${escapeHtml(savedQuery.id)}</span>
          <span class="source-meta">Mode: ${escapeHtml(savedQuery.mode)}</span>
        </div>
        <div class="inline-actions">
          <button type="button" class="small qual-query-load-btn">Load</button>
          <button type="button" class="small danger qual-query-delete-btn">Delete</button>
        </div>
      </div>
    `;
    li.querySelector('.qual-query-load-btn')?.addEventListener('click', async () => {
      applyQualitativeQueryInputs(savedQuery.query ?? {});
      if (savedQuery.mode === 'matrix_code_case') await runMatrixCoding();
      else if (savedQuery.mode === 'matrix_code_code') await runCodeCodeMatrix();
      else if (savedQuery.mode === 'framework_matrix') await runFrameworkMatrix();
      else if (savedQuery.mode === 'code_by_case') await runCodeByCaseView();
      else if (savedQuery.mode === 'cooccurrence') await runCodeCooccurrence();
      else if (savedQuery.mode === 'coding_comparison') await runCodingComparison();
      else if (savedQuery.mode === 'inter_rater_summary') await runInterRaterSummary();
      else if (savedQuery.mode === 'query_report') await runQualitativeQueryReport();
        else if (savedQuery.mode === 'text_search') await runTextSearch();
        else if (savedQuery.mode === 'sentiment') await runSentimentAnalysis();
        else if (savedQuery.mode === 'word_frequency') await runWordFrequency();
        else if (savedQuery.mode === 'word_cloud') await runWordCloud();
        else if (savedQuery.mode === 'compound_query') await runCompoundQuery();
        else if (savedQuery.mode === 'map_visualization') await runMapVisualization();
        else if (savedQuery.mode === 'code_hierarchy') await runCodeHierarchy();
        else if (savedQuery.mode === 'concept_map') await runConceptMap();
        else if (savedQuery.mode === 'pattern_autocode') await runPatternAutocode();
        else await runRetrieval();
      });
    li.querySelector('.qual-query-delete-btn')?.addEventListener('click', async () => {
      await getJson(`${API_BASE}/saved-qualitative-queries/${encodeURIComponent(savedQuery.id)}?projectId=${encodeURIComponent(state.selectedProjectId)}`, {
        method: 'DELETE'
      });
      await loadSelectedProjectData();
      renderAll();
    });
    node.appendChild(li);
  }
}

function renderCodeCooccurrence() {
  const summaryEl = document.getElementById('cooccurrence-summary');
  const resultEl = document.getElementById('cooccurrence-result');
  if (!summaryEl || !resultEl) return;
  if (!state.cooccurrenceResult) {
    summaryEl.textContent = 'Build a co-occurrence view to inspect code pairs.';
    resultEl.innerHTML = '<p>No co-occurrence view yet.</p>';
    return;
  }
  summaryEl.textContent = `${state.cooccurrenceResult.pairs.length} code pair(s) across ${state.cooccurrenceResult.totalSegments} segment(s).`;
  if (state.cooccurrenceResult.pairs.length === 0) {
    resultEl.innerHTML = '<p>No co-occurring code pairs matched the current filters.</p>';
    return;
  }
  resultEl.innerHTML = `
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Primary code</th>
            <th>Secondary code</th>
            <th>Segments</th>
            <th>Sources</th>
            <th>Cases</th>
          </tr>
        </thead>
        <tbody>
          ${state.cooccurrenceResult.pairs.map((pair) => `
            <tr>
              <td>${escapeHtml(pair.primaryCodeName)}</td>
              <td>${escapeHtml(pair.secondaryCodeName)}</td>
              <td>${pair.segmentCount}</td>
              <td>${pair.sourceCount}</td>
              <td>${pair.caseCount}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderCodeCodeMatrix() {
  const summaryEl = document.getElementById('code-code-matrix-summary');
  const resultEl = document.getElementById('code-code-matrix-result');
  if (!summaryEl || !resultEl) return;
  if (!state.codeCodeMatrixResult) {
    summaryEl.textContent = 'Build a code-by-code matrix from the current qualitative filters.';
    resultEl.innerHTML = '<p>No code-by-code matrix yet.</p>';
    return;
  }
  const { rows, columns, cells, totalSegments } = state.codeCodeMatrixResult;
  summaryEl.textContent = `${rows.length} code row(s), ${columns.length} code column(s), ${totalSegments} segment(s).`;
  if (rows.length === 0) {
    resultEl.innerHTML = '<p>No code-by-code matrix data matched the current filters.</p>';
    return;
  }
  const cellLookup = new Map(cells.map((cell) => [`${cell.rowCodeId}::${cell.columnCodeId}`, cell]));
  resultEl.innerHTML = `
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Code \\ Code</th>
            ${columns.map((column) => `<th>${escapeHtml(column.codeName)}<br><span class="small-muted">${column.count}</span></th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeHtml(row.codeName)}</td>
              ${columns.map((column) => {
                const cell = cellLookup.get(`${row.codeId}::${column.codeId}`) ?? { count: 0 };
                return `<td><strong>${cell.count}</strong></td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderMatrixCoding() {
  const summaryEl = document.getElementById('matrix-coding-summary');
  const resultEl = document.getElementById('matrix-coding-result');
  if (!summaryEl || !resultEl) return;

  if (!state.matrixCodingResult) {
    summaryEl.textContent = 'Build a matrix view to summarize coding by case.';
    resultEl.innerHTML = '<p>No matrix coding view yet.</p>';
    return;
  }

  const { rows, columns, cells, totalCount } = state.matrixCodingResult;
  summaryEl.textContent = `${rows.length} code row(s), ${columns.length} case column(s), ${totalCount} coded link(s).`;
  if (rows.length === 0 || columns.length === 0) {
    resultEl.innerHTML = '<p>No case-linked coded evidence matched the current filters.</p>';
    return;
  }

  const cellLookup = new Map(cells.map((cell) => [`${cell.codeId}::${cell.caseId}`, cell]));
  resultEl.innerHTML = `
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Code \\ Case</th>
            ${columns.map((column) => `<th>${escapeHtml(column.caseLabel)}<br><span class="small-muted">${column.count}</span></th>`).join('')}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeHtml(row.codeName)}</td>
              ${columns.map((column) => {
                const cell = cellLookup.get(`${row.codeId}::${column.caseId}`) ?? { count: 0, segmentIds: [] };
                const firstSegmentId = cell.segmentIds?.[0] ?? '';
                return `<td><strong>${cell.count}</strong><br><span class="small-muted">${cell.segmentIds.length} segment(s)</span>${firstSegmentId ? `<br><button type="button" class="small matrix-open-workspace-btn" data-segment-id="${escapeHtml(firstSegmentId)}">Open</button>` : ''}</td>`;
              }).join('')}
              <td><strong>${row.count}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  resultEl.querySelectorAll('.matrix-open-workspace-btn').forEach((button) => {
    button.addEventListener('click', () => {
      jumpToWorkspaceSegment(button.dataset.segmentId);
    });
  });
}

function renderCodeByCaseView() {
  const summaryEl = document.getElementById('code-by-case-summary');
  const resultEl = document.getElementById('code-by-case-result');
  if (!summaryEl || !resultEl) return;

  if (!state.codeByCaseView) {
    summaryEl.textContent = 'Build a grouped case view to inspect qualitative evidence by case and code.';
    resultEl.innerHTML = '<p>No code-by-case view yet.</p>';
    return;
  }

  summaryEl.textContent = `${state.codeByCaseView.cases.length} case group(s), ${state.codeByCaseView.totalCount} coded link(s).`;
  if (state.codeByCaseView.cases.length === 0) {
    resultEl.innerHTML = '<p>No grouped case evidence matched the current filters.</p>';
    return;
  }

  resultEl.innerHTML = state.codeByCaseView.cases.map((caseEntry) => `
    <div class="interactive-list-item" style="margin-bottom:12px">
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(caseEntry.caseLabel)}</span>
          <span class="source-meta">${escapeHtml(caseEntry.caseId)}</span>
        </div>
        <span class="badge">${caseEntry.totalCount}</span>
      </div>
      <div class="interactive-list" style="margin-top:12px">
        ${caseEntry.codes.map((codeEntry) => `
          <div class="interactive-list-item">
            <div class="source-row">
              <div>
                <span class="project-title">${escapeHtml(codeEntry.codeName)}</span>
                <span class="source-meta">${escapeHtml(codeEntry.codeId)}</span>
              </div>
              <span class="badge">${codeEntry.count}</span>
            </div>
            <ul class="interactive-list" style="margin-top:12px">
              ${codeEntry.excerpts.map((excerpt) => `
                <li class="interactive-list-item">
                  <div class="source-row">
                    <div>
                      <span class="project-title">${escapeHtml(excerpt.sourceTitle ?? excerpt.sourceId)}</span>
                      <span class="source-meta">${escapeHtml(excerpt.segmentId)} | memos ${excerpt.memoCount}</span>
                      <span class="source-meta">${escapeHtml(summarizeText(excerpt.text, 220))}</span>
                    </div>
                    <button type="button" class="small code-by-case-open-btn" data-segment-id="${escapeHtml(excerpt.segmentId)}" data-source-id="${escapeHtml(excerpt.sourceId)}">Open in coding</button>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
  resultEl.querySelectorAll('.code-by-case-open-btn').forEach((button) => {
    button.addEventListener('click', () => {
      jumpToWorkspaceSegment(button.dataset.segmentId, button.dataset.sourceId);
    });
  });
}

function renderQualitativeQueryReport() {
  const summaryEl = document.getElementById('query-report-summary');
  const resultEl = document.getElementById('query-report-result');
  if (!summaryEl || !resultEl) return;
  if (!state.qualitativeQueryReport) {
    summaryEl.textContent = 'Build a qualitative query report across sources and cases.';
    resultEl.innerHTML = '<p>No qualitative query report yet.</p>';
    return;
  }

  const report = state.qualitativeQueryReport;
  summaryEl.textContent = `${report.summary.matchCount} matches, ${report.summary.sourceCount} sources, ${report.summary.caseCount} cases, ${report.summary.memoCount} memos.`;
  resultEl.innerHTML = `
    <div class="grid grid-2 compact-grid">
      <div class="interactive-list-item">
        <span class="project-title">Sources</span>
        <ul class="interactive-list" style="margin-top:12px">
          ${report.sources.map((source) => `
            <li class="interactive-list-item">
              <span class="project-title">${escapeHtml(source.sourceTitle ?? source.sourceId)}</span>
              <span class="source-meta">Matches ${source.matchCount} | Cases ${source.caseCount} | Memos ${source.memoCount}</span>
              <span class="source-meta">Top codes: ${source.topCodes.map((code) => `${escapeHtml(code.codeName)} (${code.count})`).join(', ') || 'none'}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="interactive-list-item">
        <span class="project-title">Cases</span>
        <ul class="interactive-list" style="margin-top:12px">
          ${report.cases.map((caseEntry) => `
            <li class="interactive-list-item">
              <span class="project-title">${escapeHtml(caseEntry.caseLabel)}</span>
              <span class="source-meta">Matches ${caseEntry.matchCount} | Sources ${caseEntry.sourceCount} | Memos ${caseEntry.memoCount}</span>
              <span class="source-meta">Top codes: ${caseEntry.topCodes.map((code) => `${escapeHtml(code.codeName)} (${code.count})`).join(', ') || 'none'}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;
}

function renderFrameworkMatrix() {
  const summaryEl = document.getElementById('framework-matrix-summary');
  const resultEl = document.getElementById('framework-matrix-result');
  if (!summaryEl || !resultEl) return;
  if (!state.frameworkMatrixResult) {
    summaryEl.textContent = 'Build a framework matrix to summarize cases across codes.';
    resultEl.innerHTML = '<p>No framework matrix yet.</p>';
    return;
  }

  const {
    rows,
    columns,
    cells,
    totalCount,
    populatedCellCount = cells.length,
    cellDensity = rows.length > 0 && columns.length > 0 ? cells.length / (rows.length * columns.length) : 0,
    caseSummaries = [],
    codeSummaries = [],
    sourceSummaries = []
  } = state.frameworkMatrixResult;
  summaryEl.textContent = `${rows.length} case row(s), ${columns.length} code column(s), ${totalCount} coded link(s), ${populatedCellCount} populated cell(s), density ${formatDecimal(cellDensity * 100, 1)}%.`;
  if (rows.length === 0 || columns.length === 0) {
    resultEl.innerHTML = '<p>No framework matrix data matched the current filters.</p>';
    return;
  }

  const cellLookup = new Map(cells.map((cell) => [`${cell.caseId}::${cell.codeId}`, cell]));
  resultEl.innerHTML = `
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Case \\ Code</th>
            ${columns.map((column) => `<th>${escapeHtml(column.codeName)}<br><span class="small-muted">${column.count}</span></th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeHtml(row.caseLabel)}</td>
              ${columns.map((column) => {
                const cell = cellLookup.get(`${row.caseId}::${column.codeId}`) ?? { count: 0, memoCount: 0, summary: '', segmentIds: [] };
                const firstSegmentId = cell.segmentIds?.[0] ?? '';
                return `
                  <td>
                    <strong>${cell.count}</strong>
                    <br><span class="small-muted">Memos ${cell.memoCount}</span>
                    ${cell.summary ? `<br><span class="small-muted">${escapeHtml(summarizeText(cell.summary, 120))}</span>` : ''}
                    ${firstSegmentId ? `<br><button type="button" class="small framework-open-btn" data-segment-id="${escapeHtml(firstSegmentId)}">Open</button>` : ''}
                  </td>
                `;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="stack gap-12" style="margin-top:14px">
      <div class="matrix-table-wrap">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Case summary</th>
              <th>Top codes</th>
              <th>Narrative summary</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            ${(caseSummaries.length > 0 ? caseSummaries : rows.slice(0, 10).map((row) => ({
              caseId: row.caseId,
              caseLabel: row.caseLabel,
              topCodes: [],
              summary: '',
              highlightSegmentId: null
            }))).slice(0, 12).map((entry) => `
              <tr>
                <td>${escapeHtml(entry.caseLabel)}</td>
                <td>${escapeHtml((entry.topCodes ?? []).map((code) => `${code.codeName} (${code.count})`).join(', ') || 'none')}</td>
                <td>${escapeHtml(summarizeText(entry.summary || 'No excerpt summary.', 140))}</td>
                <td>${entry.highlightSegmentId ? `<button type="button" class="small framework-open-btn" data-segment-id="${escapeHtml(entry.highlightSegmentId)}">Open</button>` : 'n/a'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="matrix-table-wrap">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Code summary</th>
              <th>Top cases</th>
              <th>Narrative summary</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            ${codeSummaries.slice(0, 12).map((entry) => `
              <tr>
                <td>${escapeHtml(entry.codeName)}</td>
                <td>${escapeHtml((entry.topCases ?? []).map((caseEntry) => `${caseEntry.caseLabel} (${caseEntry.count})`).join(', ') || 'none')}</td>
                <td>${escapeHtml(summarizeText(entry.summary || 'No excerpt summary.', 140))}</td>
                <td>${entry.highlightSegmentId ? `<button type="button" class="small framework-open-btn" data-segment-id="${escapeHtml(entry.highlightSegmentId)}">Open</button>` : 'n/a'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${sourceSummaries.length > 0 ? `
        <div class="matrix-table-wrap">
          <table class="matrix-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Links</th>
                <th>Cases</th>
                <th>Codes</th>
                <th>Memos</th>
              </tr>
            </thead>
            <tbody>
              ${sourceSummaries.slice(0, 15).map((entry) => `
                <tr>
                  <td>${escapeHtml(entry.sourceTitle ?? entry.sourceId)}</td>
                  <td>${entry.totalLinks}</td>
                  <td>${entry.caseCount}</td>
                  <td>${entry.codeCount}</td>
                  <td>${entry.memoCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>
  `;
  resultEl.querySelectorAll('.framework-open-btn').forEach((button) => {
    button.addEventListener('click', () => {
      jumpToWorkspaceSegment(button.dataset.segmentId);
    });
  });
}

function renderMapVisualization() {
  const summaryEl = document.getElementById('map-visualization-summary');
  const resultEl = document.getElementById('map-visualization-result');
  if (!summaryEl || !resultEl) return;
  if (!state.mapVisualizationResult) {
    summaryEl.textContent = 'Build a map view to aggregate qualitative evidence by location-like case attributes.';
    resultEl.innerHTML = '<p>No map view yet.</p>';
    return;
  }
  const result = state.mapVisualizationResult;
  if (!result.locationField) {
    summaryEl.textContent = 'No location-style case attribute was found in the current scope.';
    resultEl.innerHTML = '<p>Add case attributes such as campus, city, region, state, or country to build a map summary.</p>';
    return;
  }
  summaryEl.textContent = `${result.points.length} location point(s) using ${result.locationField}${result.coordinateMode ? ' with coordinates' : ''}.`;
  resultEl.innerHTML = result.points.length === 0
    ? '<p>No scoped evidence could be aggregated into location points.</p>'
    : `
      <div class="matrix-table-wrap">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Evidence</th>
              <th>Cases</th>
              <th>Segments</th>
              <th>Coordinates</th>
            </tr>
          </thead>
          <tbody>
            ${result.points.map((point) => `
              <tr>
                <td>${escapeHtml(point.label)}</td>
                <td>${point.count}</td>
                <td>${point.caseCount}</td>
                <td>${point.segmentCount}</td>
                <td>${point.latitude !== null && point.longitude !== null ? `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}` : 'label only'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
}

function renderHierarchyNode(node) {
  return `
    <li class="hierarchy-node">
      <div class="hierarchy-node-row">
        <span class="project-title">${escapeHtml(node.codeName)}</span>
        <span class="source-meta">Direct ${node.directCount} · Total ${node.totalCount}</span>
      </div>
      ${node.children.length > 0 ? `<ul class="hierarchy-node-children">${node.children.map(renderHierarchyNode).join('')}</ul>` : ''}
    </li>
  `;
}

function renderCodeHierarchy() {
  const summaryEl = document.getElementById('code-hierarchy-summary');
  const resultEl = document.getElementById('code-hierarchy-result');
  if (!summaryEl || !resultEl) return;
  if (!state.codeHierarchyResult) {
    summaryEl.textContent = 'Build a code hierarchy view to inspect parent-child structure against coded volume.';
    resultEl.innerHTML = '<p>No code hierarchy yet.</p>';
    return;
  }
  const result = state.codeHierarchyResult;
  summaryEl.textContent = `${result.totalCodes} code(s), ${result.totalApplications} scoped code application(s).`;
  resultEl.innerHTML = result.roots.length === 0
    ? '<p>No hierarchical codes are available in the current scope.</p>'
    : `<ul class="hierarchy-tree">${result.roots.map(renderHierarchyNode).join('')}</ul>`;
}

function renderConceptMap() {
  const summaryEl = document.getElementById('concept-map-summary');
  const resultEl = document.getElementById('concept-map-result');
  if (!summaryEl || !resultEl) return;
  if (!state.conceptMapResult) {
    summaryEl.textContent = 'Build a concept map to inspect code relationships and co-occurrence links.';
    resultEl.innerHTML = '<p>No concept map yet.</p>';
    return;
  }
  const result = state.conceptMapResult;
  summaryEl.textContent = `${result.nodes.length} node(s), ${result.links.length} link(s).`;
  resultEl.innerHTML = result.nodes.length === 0
    ? '<p>No concept links are available in the current scope.</p>'
    : buildOutputViewer({
      eyebrow: 'Concept map',
      title: 'Code relationship network',
      summary: 'Co-occurrence links and explicit see-also relationships across the current qualitative scope.',
      metrics: [
        { label: 'Nodes', value: result.nodes.length },
        { label: 'Links', value: result.links.length }
      ],
      sections: [
        buildOutputSection(
          'Code nodes',
          buildOutputTable(
            ['Code', 'Weight', 'Group'],
            result.nodes.slice(0, 30).map((node) => [
              escapeHtml(node.label),
              String(node.size),
              escapeHtml(node.group)
            ])
          )
        ),
        buildOutputSection(
          'Links',
          buildOutputTable(
            ['Source', 'Target', 'Weight', 'Kind'],
            result.links.slice(0, 40).map((link) => [
              escapeHtml(state.selectedCodes.find((code) => code.id === link.sourceId)?.name || link.sourceId),
              escapeHtml(state.selectedCodes.find((code) => code.id === link.targetId)?.name || link.targetId),
              String(link.weight),
              escapeHtml(link.kind)
            ])
          )
        )
      ]
    });
}

function renderCodeClusters() {
  const summaryEl = document.getElementById('code-cluster-summary');
  const resultEl = document.getElementById('code-cluster-result');
  if (!summaryEl || !resultEl) return;
  if (!state.codeClusterResult) {
    summaryEl.textContent = 'Build clusters to inspect which codes travel together in the current scope.';
    resultEl.innerHTML = '<p>No code clusters yet.</p>';
    return;
  }
  summaryEl.textContent = `${state.codeClusterResult.clusters.length} cluster(s).`;
  resultEl.innerHTML = state.codeClusterResult.clusters.length === 0
    ? '<p>No connected code clusters are available yet.</p>'
    : `
      <ul class="interactive-list">
        ${state.codeClusterResult.clusters.map((cluster) => `
          <li class="interactive-list-item">
            <div class="source-row">
              <div>
                <span class="project-title">${escapeHtml(cluster.label)}</span>
                <span class="source-meta">${cluster.codeIds.length} code(s) · weight ${cluster.totalWeight}</span>
                <span class="source-meta">${cluster.codeIds.map((codeId) => escapeHtml(state.selectedCodes.find((code) => code.id === codeId)?.name || codeId)).join(', ')}</span>
              </div>
            </div>
          </li>
        `).join('')}
      </ul>
    `;
}

function renderReferences() {
  const summaryEl = document.getElementById('reference-summary');
  const listEl = document.getElementById('reference-list');
  const importEl = document.getElementById('reference-import-result');
  const sourceSelect = document.getElementById('reference-related-source-id');
  if (!summaryEl || !listEl || !importEl) return;
  if (sourceSelect) {
    const currentValue = sourceSelect.value;
    sourceSelect.innerHTML = `<option value="">No source link</option>${state.selectedSources.map((source) => `<option value="${escapeHtml(source.id)}">${escapeHtml(source.title)}</option>`).join('')}`;
    sourceSelect.value = state.selectedSources.some((source) => source.id === currentValue) ? currentValue : '';
  }
  summaryEl.textContent = `${state.selectedReferences.length} project reference(s).`;
  if (state.referenceImportResult?.total) {
    importEl.textContent = `Imported ${state.referenceImportResult.total} reference(s).`;
  } else {
    importEl.textContent = 'Import RIS or BibTeX records and keep them attached to the project.';
  }
  if (state.selectedReferences.length === 0) {
    listEl.innerHTML = '<li class="interactive-list-item empty">No project references yet.</li>';
    return;
  }
  listEl.innerHTML = state.selectedReferences.map((reference) => `
    <li class="interactive-list-item">
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(reference.title || 'Untitled reference')}</span>
          <span class="source-meta">${escapeHtml(reference.referenceType)} · ${escapeHtml(reference.sourceFormat)}${reference.year ? ` · ${reference.year}` : ''}</span>
          <span class="source-meta">${escapeHtml((reference.authors ?? []).join(', ') || 'No authors')}</span>
          <span class="source-meta">${escapeHtml(reference.containerTitle || reference.publisher || reference.doi || reference.url || 'No container metadata')}</span>
        </div>
        <div class="inline-actions">
          ${reference.url ? `<a class="small button-link" href="${escapeHtml(reference.url)}" target="_blank" rel="noreferrer">Open URL</a>` : ''}
          <button type="button" class="small danger reference-delete-btn" data-reference-id="${escapeHtml(reference.id)}">Delete</button>
        </div>
      </div>
    </li>
  `).join('');
  listEl.querySelectorAll('.reference-delete-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      await deleteReference(button.dataset.referenceId);
    });
  });
}

function renderCodingComparison() {
  const summaryEl = document.getElementById('coding-comparison-summary');
  const resultEl = document.getElementById('coding-comparison-result');
  if (!summaryEl || !resultEl) return;
  if (!state.codingComparisonResult) {
    summaryEl.textContent = 'Run a coding comparison to inspect inter-rater agreement.';
    resultEl.innerHTML = '<p>No coding comparison yet.</p>';
    return;
  }

  const result = state.codingComparisonResult;
  summaryEl.textContent = `${result.codeName} across ${result.universeSegmentCount} segment(s): agreement ${formatStatValue(result.percentAgreement, 4)}, kappa ${formatStatValue(result.cohensKappa, 4)}.`;
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Coding comparison',
    title: `${result.codeName}: ${result.coderA} vs ${result.coderB}`,
    summary: `Agreement ${formatStatValue(result.percentAgreement, 4)} with Cohen's kappa ${formatStatValue(result.cohensKappa, 4)} across ${result.universeSegmentCount} segments.`,
    metrics: [
      { label: 'Agreement', value: result.agreementCount },
      { label: 'Disagreement', value: result.disagreementCount },
      { label: 'Both applied', value: result.bothAppliedCount },
      { label: 'Neither applied', value: result.neitherAppliedCount }
    ],
    sections: [
      buildOutputSection(
        'Decision counts',
        buildOutputTable(
          ['Coder pair', 'Count'],
          [
            [`${escapeHtml(result.coderA)} only`, String(result.coderAOnlyCount)],
            [`${escapeHtml(result.coderB)} only`, String(result.coderBOnlyCount)],
            ['Both applied', String(result.bothAppliedCount)],
            ['Neither applied', String(result.neitherAppliedCount)]
          ]
        )
      ),
      result.disagreements.length
        ? buildOutputSection(
          'Disagreement examples',
          buildOutputTable(
            ['Source', 'Segment', result.coderA, result.coderB, 'Excerpt'],
            result.disagreements.map((item) => [
              escapeHtml(item.sourceTitle ?? item.sourceId),
              escapeHtml(item.segmentId),
              item.coderAApplied ? 'yes' : 'no',
              item.coderBApplied ? 'yes' : 'no',
              escapeHtml(summarizeText(item.text, 160))
            ])
          )
        )
        : ''
    ].filter(Boolean)
  });
}

function renderInterRaterSummary() {
  const summaryEl = document.getElementById('inter-rater-summary-summary');
  const resultEl = document.getElementById('inter-rater-summary-result');
  if (!summaryEl || !resultEl) return;
  if (!state.interRaterSummaryResult) {
    summaryEl.textContent = 'Run an inter-rater summary to compare agreement across codes.';
    resultEl.innerHTML = '<p>No inter-rater summary yet.</p>';
    return;
  }
  const result = state.interRaterSummaryResult;
  summaryEl.textContent = `${result.rows.length} code(s) compared for ${result.coderA} vs ${result.coderB}. Average kappa ${formatStatValue(result.averageKappa, 4)}.`;
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: 'Inter-rater summary',
    title: `${result.coderA} vs ${result.coderB}`,
    summary: `Average agreement ${formatStatValue(result.averageAgreement, 4)} with average kappa ${formatStatValue(result.averageKappa, 4)}.`,
    metrics: [
      { label: 'Codes', value: result.rows.length },
      { label: 'Average agreement', value: formatStatValue(result.averageAgreement, 4) },
      { label: 'Average kappa', value: formatStatValue(result.averageKappa, 4) }
    ],
    sections: [
      buildOutputSection(
        'Code-level agreement',
        buildOutputTable(
          ['Code', 'Universe', 'Agreement', 'Disagreement', 'Percent agreement', "Cohen's kappa"],
          result.rows.map((row) => [
            escapeHtml(row.codeName),
            String(row.universeSegmentCount),
            String(row.agreementCount),
            String(row.disagreementCount),
            formatStatValue(row.percentAgreement, 4),
            formatStatValue(row.cohensKappa, 4)
          ])
        )
      )
    ]
  });
}

function renderAutocodeResult() {
  const summaryEl = document.getElementById('autocode-summary');
  const resultEl = document.getElementById('autocode-result');
  if (!summaryEl || !resultEl) return;
  if (!state.autocodeResult) {
    summaryEl.textContent = 'Keyword and pattern autocoding scope the current qualitative filters and apply the selected code to matching segments.';
    resultEl.innerHTML = '<p>No autocoding run yet.</p>';
    return;
  }
  const result = state.autocodeResult;
  summaryEl.textContent = `${result.createdCount} code application(s) created, ${result.skippedCount} skipped, ${result.matchedCount} matched segment(s).`;
  resultEl.innerHTML = buildOutputViewer({
    eyebrow: result.method === 'pattern' ? 'Pattern autocoding' : 'Keyword autocoding',
    title: result.method === 'pattern'
      ? `${result.codeId} from ${result.patterns.join(', ')}`
      : `${result.codeId} from ${result.keywords.join(', ')}`,
    summary: `${result.createdCount} application(s) created across ${result.scopeCount} scoped segment(s).`,
    metrics: [
      { label: 'Scope segments', value: result.scopeCount },
      { label: 'Matched', value: result.matchedCount },
      { label: 'Created', value: result.createdCount },
      { label: 'Skipped', value: result.skippedCount }
    ],
    sections: [
      result.method === 'pattern'
        ? buildOutputSection(
          'Pattern settings',
          buildOutputList([
            `Match mode: <strong>${escapeHtml(result.matchMode ?? 'phrase')}</strong>`,
            `Expanded patterns: <strong>${escapeHtml((result.expandedPatterns ?? []).join(', ') || 'none')}</strong>`
          ])
        )
        : '',
      buildOutputSection(
        'Matched segments',
        buildOutputTable(
          [result.method === 'pattern' ? 'Pattern' : 'Keyword', 'Source', 'Segment', 'Excerpt'],
          (result.matches ?? []).map((item) => [
            escapeHtml(item.pattern ?? item.keyword),
            escapeHtml(item.sourceId),
            escapeHtml(item.segmentId),
            escapeHtml(summarizeText(item.text, 160))
          ])
        )
      )
    ].filter(Boolean)
  });
}

function renderAuditEvents() {
  const node = document.getElementById('audit-events-list');
  if (!node) return;
  node.innerHTML = '';
  setText('audit-count', `${state.selectedAuditEvents.length}`);
  if (state.selectedAuditEvents.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No audit events yet.</li>';
    return;
  }
  for (const event of state.selectedAuditEvents) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(event.actionLabel ?? event.action)}</span>
          <span class="source-meta">${escapeHtml(event.createdAt)}</span>
          <span class="source-meta">${escapeHtml(event.actorUsername)} · ${escapeHtml(event.entityType)} · ${escapeHtml(event.entityId)}</span>
          <span class="source-meta">${escapeHtml(JSON.stringify(event.details ?? {}))}</span>
        </div>
        <span class="badge">${escapeHtml(event.actorRole)}</span>
      </div>
    `;
    node.appendChild(li);
  }
}

function renderBackupItems() {
  const node = document.getElementById('backup-list');
  if (!node) return;
  node.innerHTML = '';
  const permissions = getProjectPermissionState();
  setText('backup-count', `${state.backupItems.length}`);
  if (state.backupItems.length === 0) {
    node.innerHTML = '<li class="interactive-list-item empty">No backups available or backup access is not available for this account.</li>';
    return;
  }
  for (const item of state.backupItems) {
    const li = document.createElement('li');
    li.className = 'interactive-list-item';
    li.innerHTML = `
      <div class="source-row">
        <div>
          <span class="project-title">${escapeHtml(item.filename)}</span>
          <span class="source-meta">${escapeHtml(item.modifiedAt)} · ${escapeHtml(String(item.size))} bytes</span>
          <span class="source-meta">${escapeHtml(item.relativePath)}</span>
        </div>
      </div>
    `;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'small';
    button.textContent = 'Restore clone';
    button.disabled = !permissions.canManageProject;
    button.title = permissions.canManageProject
      ? 'Restore this backup as a cloned project.'
      : 'Only project owners can restore backups.';
    button.addEventListener('click', async () => {
      try {
        await restoreProjectBackup(item.relativePath);
      } catch (err) {
        document.getElementById('backup-result').textContent = `Restore failed: ${err.message}`;
      }
    });
    li.appendChild(button);
    node.appendChild(li);
  }
}

function renderAll() {
  renderInteractionStatus();
  renderOfficeLaunchStatus();
  renderExternalSqlPanel();
  renderProjects();
  renderProjectActions();
  renderProjectsSecondary();
  renderProjectChatHistory();
  renderMembers();
  renderActiveUsers();
  renderMessagesPreview();
  renderSources();
  renderCodes();
  renderVariables();
  renderVariableInspector();
  renderCases();
    renderMemos();
    renderAnnotations();
    renderRelationships();
    renderReferences();
    renderAttributes();
  renderSegments();
  renderCodeApplications();
  renderTraceLinks();
  renderDescriptives();
  renderFrequencyTable();
  renderAnalysisControls();
    renderSavedTransforms();
    renderSavedAnalysisJobs();
    renderQuantOutputHistory();
    renderQuantOutputTree();
    renderCompiledReportControls();
  renderCompiledReportPresets();
  renderCompareMeans();
  renderTTest();
  renderPairedTTest();
  renderNonparametric();
  renderCrosstab();
  renderCustomTable();
  renderExactTest();
  renderBootstrap();
  renderMissingValues();
  renderCorrelation();
  renderRegression();
  renderReliability();
  renderFactorAnalysis();
  renderForecasting();
  renderClusterAnalysis();
  renderDecisionTree();
  renderGeneralLinearModel();
  renderRepeatedMeasures();
  renderSurvivalAnalysis();
  renderComplexSamples();
  renderNeuralNetwork();
  renderSyntaxRun();
  renderRetrieval();
  renderSavedQualitativeQueries();
  renderTextSearch();
    renderSentimentResult();
    renderWordFrequency();
    renderWordCloud();
    renderCompoundQuery();
    renderMapVisualization();
    renderCodeCooccurrence();
    renderCodeHierarchy();
    renderConceptMap();
    renderCodeClusters();
    renderMatrixCoding();
  renderCodeCodeMatrix();
  renderCodeByCaseView();
  renderQualitativeQueryReport();
  renderFrameworkMatrix();
  renderCodingComparison();
  renderInterRaterSummary();
  renderMergeReview();
  renderAutocodeResult();
  renderMediaTimeline();
  renderGovernanceStatus();
  renderAuditEvents();
  renderBackupItems();
  renderSourceWorkspace();
  renderSummary();
  renderPresenceBanner();
  syncWorkspaceMenus();
  updateGlobalChatButton();
}

function buildChatPopupHtml(projectId, projectName) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>muStatistics Chat</title>
    <style>
      :root { color-scheme: dark; --bg:#0b1020; --panel:#121a31; --border:#2b3b66; --text:#edf2ff; --muted:#aab6d3; --accent:#8fb3ff; }
      * { box-sizing: border-box; }
      body { margin:0; font-family: "Segoe UI", Arial, sans-serif; background:linear-gradient(180deg,#0b1020 0%,#11182e 100%); color:var(--text); }
      .shell { display:grid; grid-template-rows:auto 1fr auto; height:100vh; }
      .head { padding:16px 18px; border-bottom:1px solid var(--border); background:rgba(18,26,49,0.95); }
      .head h1 { margin:0 0 6px; font-size:18px; }
      .head p { margin:0; color:var(--muted); font-size:13px; }
      .messages { padding:16px; overflow:auto; display:grid; gap:10px; }
      .message { border:1px solid var(--border); border-radius:12px; padding:12px; background:rgba(10,15,29,0.65); }
      .meta { display:block; color:var(--muted); font-size:12px; margin-bottom:6px; }
      .empty { color:var(--muted); text-align:center; padding:18px; border:1px dashed var(--border); border-radius:12px; }
      form { display:grid; grid-template-columns:1fr auto; gap:10px; padding:14px; border-top:1px solid var(--border); background:rgba(18,26,49,0.95); }
      textarea { width:100%; min-height:72px; resize:vertical; border-radius:12px; border:1px solid var(--border); background:#0a0f1d; color:var(--text); padding:12px; font:inherit; }
      button { border:1px solid rgba(143,179,255,0.4); background:rgba(143,179,255,0.14); color:var(--text); border-radius:12px; padding:12px 16px; cursor:pointer; font:inherit; }
      button:hover { background:rgba(143,179,255,0.22); }
      .error { padding:0 14px 12px; color:#ff9d9d; font-size:12px; }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="head">
        <h1>Project Chat</h1>
        <p>${escapeHtml(projectName)} (${escapeHtml(projectId)})</p>
      </div>
      <div id="messages" class="messages"></div>
      <div>
        <div id="error" class="error"></div>
        <form id="chat-form">
          <textarea id="chat-body" placeholder="Type a message to your project team"></textarea>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
    <script>
      const API_BASE = ${JSON.stringify(API_BASE)};
      const PROJECT_ID = ${JSON.stringify(projectId)};
      const messagesEl = document.getElementById('messages');
      const errorEl = document.getElementById('error');
      const bodyEl = document.getElementById('chat-body');
      const formEl = document.getElementById('chat-form');
      function escapeHtml(value) {
        return String(value ?? '')
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }
      async function getJson(url, options = {}) {
        const response = await fetch(url, { credentials: 'include', ...options });
        const payload = await response.json();
        if (!response.ok || payload.ok === false) {
          throw new Error(payload?.error?.message ?? ('Request failed: ' + response.status));
        }
        return payload;
      }
      async function loadMessages() {
        try {
          const env = await getJson(API_BASE + '/project-messages?projectId=' + encodeURIComponent(PROJECT_ID));
          const items = env.data.items ?? [];
          if (items.length === 0) {
            messagesEl.innerHTML = '<div class="empty">No messages yet.</div>';
            return;
          }
          messagesEl.innerHTML = items.map((message) => '<div class="message"><span class="meta">' + escapeHtml(message.username) + ' • ' + escapeHtml(message.createdAt) + '</span><div>' + escapeHtml(message.body) + '</div></div>').join('');
          messagesEl.scrollTop = messagesEl.scrollHeight;
          errorEl.textContent = '';
        } catch (err) {
          errorEl.textContent = err.message;
        }
      }
      formEl.addEventListener('submit', async (event) => {
        event.preventDefault();
        const body = bodyEl.value.trim();
        if (!body) return;
        try {
          await getJson(API_BASE + '/project-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: PROJECT_ID, body })
          });
          bodyEl.value = '';
          await loadMessages();
        } catch (err) {
          errorEl.textContent = err.message;
        }
      });
      loadMessages();
      setInterval(loadMessages, 3000);
    </script>
  </body>
</html>`;
}

function openChatPopup() {
  const project = state.selectedSummary?.project
    ?? state.projects.find((item) => item.id === state.selectedProjectId)
    ?? null;
  if (!state.selectedProjectId || !project) {
    window.alert('Select a project first.');
    return;
  }
  const popup = window.open('', `mu-chat-${state.selectedProjectId}`, 'width=460,height=720');
  if (!popup) {
    window.alert('Popup blocked. Please allow popups for localhost.');
    return;
  }
  popup.document.open();
  popup.document.write(buildChatPopupHtml(state.selectedProjectId, project.name));
  popup.document.close();
  popup.focus();
}

// ── Form wiring ───────────────────────────────────────────────────────────────

async function deleteSelectedProject() {
  requireProjectManagementPermission();
  const project = state.projects.find((item) => item.id === state.selectedProjectId);
  const projectName = project?.name ?? state.selectedProjectId;
  const confirmed = window.confirm(`Delete project "${projectName}"? This removes project data and stored artifacts.`);
  if (!confirmed) return;
  await deleteJson(`${API_BASE}/projects/${state.selectedProjectId}`);
  state.selectedProjectId = null;
  state.lastActivityTs = null;
  activateTab('projects');
  await refreshPage();
}

function wireForms() {
  const attributeValueTypeEl = document.getElementById('attribute-value-type');
  const attributeValueEl = document.getElementById('attribute-value');
  attributeValueTypeEl.addEventListener('change', () => {
    const isNull = attributeValueTypeEl.value === 'null';
    attributeValueEl.disabled = isNull;
    if (isNull) attributeValueEl.value = '';
    attributeValueEl.placeholder = isNull ? 'No value needed for null' : 'Admissions';
  });

  document.getElementById('project-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();
    const workspaceMode = document.getElementById('project-workspace-mode').value;
    if (!name) { alert('Project name is required.'); return; }
    const env = await postJson(`${API_BASE}/projects`, { name, description, workspaceMode });
    event.target.reset();
    document.getElementById('project-workspace-mode').value = 'solo';
    state.selectedProjectId = env.data.project.id;
    await refreshPage();
  });

  document.getElementById('member-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    requireProjectManagementPermission();
    const username = document.getElementById('member-username').value.trim();
    const role = document.getElementById('member-role').value;
    if (!username) { alert('Username is required.'); return; }
    await postJson(`${API_BASE}/projects/${state.selectedProjectId}/members`, { username, role });
    event.target.reset();
    await refreshPage();
  });

  document.getElementById('save-workspace-mode-btn').addEventListener('click', async () => {
    requireProjectManagementPermission();
    const workspaceMode = document.getElementById('collaboration-workspace-mode').value;
    await postJson(`${API_BASE}/projects/${state.selectedProjectId}/workspace-mode`, { workspaceMode });
    await refreshPage();
  });

  document.getElementById('global-chat-btn')?.addEventListener('click', () => {
    openChatPopup();
  });
  document.getElementById('collaboration-chat-btn')?.addEventListener('click', () => {
    openChatPopup();
  });
  document.getElementById('project-chat-popup-btn')?.addEventListener('click', () => {
    openChatPopup();
  });

  document.getElementById('delete-project-btn')?.addEventListener('click', async () => {
    try {
      await deleteSelectedProject();
    } catch (err) {
      window.alert(err.message);
    }
  });

  document.getElementById('source-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const title = document.getElementById('source-title').value.trim();
    const kind = document.getElementById('source-kind').value;
    const contentType = document.getElementById('source-content-type').value.trim() || 'text/plain';
    const contentUrl = document.getElementById('source-content-url').value.trim();
    const contentText = document.getElementById('source-content-text').value.trim();
    if (!title) { alert('Source title is required.'); return; }
    if ((kind === 'audio' || kind === 'video') && !contentUrl) {
      alert('Audio and video sources need a media URL.');
      return;
    }
    await postJson(`${API_BASE}/sources`, {
      projectId: state.selectedProjectId,
      title,
      kind,
      contentType,
      language: 'en',
      contentUrl: contentUrl || null,
      contentText
    });
    event.target.reset();
    document.getElementById('source-kind').value = 'transcript';
    document.getElementById('source-content-type').value = 'text/plain';
    await loadSelectedProjectData(); renderAll();
  });

  document.getElementById('code-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const name = document.getElementById('code-name').value.trim();
    const description = document.getElementById('code-description').value.trim();
    const parentCodeId = document.getElementById('code-parent-id').value.trim();
    const colorToken = document.getElementById('code-color-token').value.trim() || 'blue';
    if (!name) { alert('Code name is required.'); return; }
    await postJson(`${API_BASE}/codes`, { projectId: state.selectedProjectId, name, description, parentCodeId: parentCodeId || null, colorToken });
    event.target.reset();
    document.getElementById('code-color-token').value = 'blue';
    await loadSelectedProjectData(); renderAll();
  });

  document.getElementById('variable-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const name = document.getElementById('variable-name').value.trim();
    const label = document.getElementById('variable-label').value.trim();
    const kind = document.getElementById('variable-kind').value;
    const sourceKind = document.getElementById('variable-source-kind').value;
    const derivedFromCodeId = document.getElementById('variable-derived-code-id').value.trim();
    const derivationRule = document.getElementById('variable-derivation-rule').value;
    if (!name || !label) { alert('Variable name and label are required.'); return; }
    await postJson(`${API_BASE}/variables`, { projectId: state.selectedProjectId, name, label, kind, sourceKind, derivedFromCodeId: derivedFromCodeId || null, derivationRule });
    event.target.reset();
    document.getElementById('variable-kind').value = 'binary';
    document.getElementById('variable-source-kind').value = 'derived_code';
    document.getElementById('variable-derivation-rule').value = 'presence';
    await loadSelectedProjectData(); renderAll();
  });

  document.getElementById('case-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const label = document.getElementById('case-label').value.trim();
    const sourceIdsRaw = document.getElementById('case-source-ids').value.trim();
    const sourceIds = sourceIdsRaw ? sourceIdsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (!label) { alert('Case label is required.'); return; }
    await postJson(`${API_BASE}/cases`, { projectId: state.selectedProjectId, label, sourceIds });
    event.target.reset();
    await loadSelectedProjectData(); renderAll();
  });

  document.getElementById('memo-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const targetType = document.getElementById('memo-target-type').value;
    const targetId = document.getElementById('memo-target-id').value.trim() || state.selectedProjectId;
    const title = document.getElementById('memo-title').value.trim();
    const body = document.getElementById('memo-body').value.trim();
    if (!title) { alert('Memo title is required.'); return; }
    await postJson(`${API_BASE}/memos`, { projectId: state.selectedProjectId, targetType, targetId, title, body });
    event.target.reset();
    document.getElementById('memo-target-type').value = 'project';
    document.getElementById('memo-target-id').value = state.selectedProjectId;
    await loadSelectedProjectData(); renderAll();
  });

document.getElementById('annotation-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const targetType = document.getElementById('annotation-target-type').value;
    const targetId = document.getElementById('annotation-target-id').value.trim() || state.selectedProjectId;
    const quoteText = document.getElementById('annotation-quote-text').value.trim();
    const note = document.getElementById('annotation-note').value.trim();
    const startOffsetRaw = document.getElementById('annotation-start-offset').value;
    const endOffsetRaw = document.getElementById('annotation-end-offset').value;
    const colorToken = document.getElementById('annotation-color-token').value.trim() || 'amber';
    if (!note) { alert('Annotation note is required.'); return; }
    await postJson(`${API_BASE}/annotations`, {
      projectId: state.selectedProjectId,
      targetType,
      targetId,
      quoteText,
      note,
      startOffset: startOffsetRaw === '' ? null : Number(startOffsetRaw),
      endOffset: endOffsetRaw === '' ? null : Number(endOffsetRaw),
      colorToken
    });
    event.target.reset();
    document.getElementById('annotation-target-type').value = 'segment';
    document.getElementById('annotation-target-id').value = '';
    document.getElementById('annotation-color-token').value = 'amber';
    await loadSelectedProjectData(); renderAll();
  });

  document.getElementById('attribute-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const targetType = document.getElementById('attribute-target-type').value;
    const targetId = document.getElementById('attribute-target-id').value.trim();
    const name = document.getElementById('attribute-name').value.trim();
    const valueType = attributeValueTypeEl.value;
    const rawValue = attributeValueEl.value.trim();
    if (!targetId || !name) { alert('Target ID and attribute name are required.'); return; }

    let value = null;
    if (valueType === 'string') value = rawValue;
    else if (valueType === 'number') {
      if (rawValue === '' || Number.isNaN(Number(rawValue))) { alert('Enter a valid number value.'); return; }
      value = Number(rawValue);
    } else if (valueType === 'boolean') {
      value = rawValue.toLowerCase() === 'true' || rawValue === '1' || rawValue.toLowerCase() === 'yes';
    }

    await postJson(`${API_BASE}/attributes`, { projectId: state.selectedProjectId, targetType, targetId, name, value });
    event.target.reset();
    document.getElementById('attribute-target-type').value = 'case';
    attributeValueEl.disabled = false;
    attributeValueEl.placeholder = 'Admissions';
    await loadSelectedProjectData(); renderAll();
  });

  document.getElementById('segment-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const sourceId = document.getElementById('segment-source-id').value.trim();
    const text = document.getElementById('segment-text').value.trim();
    const kind = document.getElementById('segment-kind').value;
    const start = parseInt(document.getElementById('segment-start').value, 10) || 0;
    const end = parseInt(document.getElementById('segment-end').value, 10) || 0;
    if (!sourceId || !text) { alert('Source ID and text are required.'); return; }

    let anchor;
    if (kind === 'text_range') anchor = { kind: 'text_range', start, end };
    else if (kind === 'time_range') anchor = { kind: 'time_range', startMs: start, endMs: end };
    else anchor = { kind: 'page_region', page: 1, x: 0, y: 0, width: 1, height: 1 };

    await postJson(`${API_BASE}/segments`, { projectId: state.selectedProjectId, sourceId, kind, anchor, text });
    event.target.reset();
    document.getElementById('segment-kind').value = 'text_range';
    await loadSelectedProjectData(); renderAll();
  });

  document.getElementById('code-application-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const segmentId = document.getElementById('ca-segment-id').value.trim();
    const codeId = document.getElementById('ca-code-id').value.trim();
    const caseId = document.getElementById('ca-case-id').value.trim();
    const confidence = parseFloat(document.getElementById('ca-confidence').value) || 1;
    if (!segmentId || !codeId) { alert('Segment ID and Code ID are required.'); return; }
    await postJson(`${API_BASE}/code-applications`, { projectId: state.selectedProjectId, segmentId, codeId, caseId: caseId || null, confidence });
    event.target.reset();
    document.getElementById('ca-confidence').value = '1';
    await loadSelectedProjectData(); renderAll();
  });

  // Derive trace links button
  document.getElementById('derive-btn').addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const btn = document.getElementById('derive-btn');
    const resultEl = document.getElementById('derive-result');
    btn.disabled = true;
    btn.textContent = 'Running…';
    resultEl.textContent = '';
    try {
      const env = await postJson(`${API_BASE}/trace-links/derive`, { projectId: state.selectedProjectId });
      const r = env.data.result;
      resultEl.innerHTML = `
        Done — <strong>${r.created}</strong> created,
        <strong>${r.updated}</strong> updated,
        <strong>${r.deleted}</strong> deleted,
        <strong>${r.skipped}</strong> unchanged.
      `;
      await loadSelectedProjectData();
      renderAll();
    } catch (err) {
      resultEl.textContent = `Error: ${err.message}`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Run derivation';
    }
  });

  const importBrowseBtn = document.getElementById('import-browse-btn');
  const importFileInput = document.getElementById('import-file-input');
  const importDropzone = document.getElementById('import-dropzone');
  const sqlProfileSelect = document.getElementById('sql-profile-select');

  document.getElementById('save-sql-profile-btn')?.addEventListener('click', async () => {
    try {
      requireProjectExportPermission();
      const label = document.getElementById('sql-profile-label').value.trim();
      const clientType = document.getElementById('sql-client-type')?.value || 'postgres';
      const host = document.getElementById('sql-host').value.trim();
      const port = Number(document.getElementById('sql-port').value || 5432);
      const database = document.getElementById('sql-database').value.trim();
      const user = document.getElementById('sql-username').value.trim();
      const password = document.getElementById('sql-password').value;
      const ssl = Boolean(document.getElementById('sql-ssl').checked);
      const env = await postJson(`${API_BASE}/sql-profiles`, {
        projectId: state.selectedProjectId,
        label,
        clientType,
        connection: { host, port, database, user, password, ssl }
      });
      state.selectedSqlProfileId = env.data.profile.id;
      document.getElementById('sql-password').value = '';
      await loadExternalSqlProfiles();
      await loadExternalSqlTables(state.selectedSqlProfileId);
      renderAll();
      document.getElementById('sql-import-status').textContent = 'SQL profile saved and connection verified.';
    } catch (err) {
      document.getElementById('sql-import-status').textContent = `SQL profile save failed: ${err.message}`;
    }
  });

  document.getElementById('delete-sql-profile-btn')?.addEventListener('click', async () => {
    try {
      requireProjectExportPermission();
      if (!state.selectedSqlProfileId) throw new Error('Select a SQL profile first.');
      await deleteJson(`${API_BASE}/sql-profiles/${encodeURIComponent(state.selectedSqlProfileId)}?projectId=${encodeURIComponent(state.selectedProjectId)}`);
      state.selectedSqlProfileId = null;
      await loadExternalSqlProfiles();
      renderAll();
      document.getElementById('sql-import-status').textContent = 'SQL profile deleted.';
    } catch (err) {
      document.getElementById('sql-import-status').textContent = `SQL profile delete failed: ${err.message}`;
    }
  });

  document.getElementById('sql-client-type')?.addEventListener('change', (event) => {
    const clientType = event.target.value || 'postgres';
    const portEl = document.getElementById('sql-port');
    if (portEl && !portEl.value.trim()) {
      portEl.value = defaultSqlPortForClientType(clientType);
    }
  });

  sqlProfileSelect?.addEventListener('change', async (event) => {
    state.selectedSqlProfileId = event.target.value || null;
    state.externalSqlQueryPreview = null;
    await loadExternalSqlTables(state.selectedSqlProfileId);
  renderAll();
});

document.getElementById('relationship-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.selectedProjectId) {
    alert('Select a project first.');
    return;
  }
  const leftTargetType = document.getElementById('relationship-left-target-type').value;
  const leftTargetId = document.getElementById('relationship-left-target-id').value.trim();
  const rightTargetType = document.getElementById('relationship-right-target-type').value;
  const rightTargetId = document.getElementById('relationship-right-target-id').value.trim();
  const relationshipType = document.getElementById('relationship-type').value;
  const note = document.getElementById('relationship-note').value.trim();
  if (!leftTargetId || !rightTargetId) {
    alert('Both relationship targets are required.');
    return;
  }
  await postJson(`${API_BASE}/relationships`, {
    projectId: state.selectedProjectId,
    relationshipType,
    leftTargetType,
    leftTargetId,
    rightTargetType,
    rightTargetId,
    note
  });
  document.getElementById('relationship-note').value = '';
  await loadSelectedProjectData();
  renderAll();
});

  document.getElementById('load-sql-tables-btn')?.addEventListener('click', async () => {
    try {
      requireProjectExportPermission();
      if (!state.selectedSqlProfileId) throw new Error('Select a SQL profile first.');
      await loadExternalSqlTables(state.selectedSqlProfileId);
      state.selectedSqlTableKey = state.externalSqlTables[0] ? `${state.externalSqlTables[0].schema}.${state.externalSqlTables[0].table}` : '';
      renderAll();
    } catch (err) {
      document.getElementById('sql-import-status').textContent = `Table load failed: ${err.message}`;
    }
  });

  document.getElementById('sql-table-select')?.addEventListener('change', (event) => {
    state.selectedSqlTableKey = event.target.value || '';
    state.externalSqlPreview = null;
    renderExternalSqlPanel();
  });

  document.getElementById('preview-sql-table-btn')?.addEventListener('click', async () => {
    try {
      requireProjectExportPermission();
      if (!state.selectedSqlProfileId) throw new Error('Select a SQL profile first.');
      if (!state.selectedSqlTableKey) throw new Error('Select a SQL table first.');
      await loadExternalSqlPreview(state.selectedSqlProfileId, state.selectedSqlTableKey);
      renderAll();
      document.getElementById('sql-import-status').textContent = 'SQL table preview loaded.';
    } catch (err) {
      document.getElementById('sql-import-status').textContent = `SQL preview failed: ${err.message}`;
    }
  });

  document.getElementById('run-sql-query-btn')?.addEventListener('click', async () => {
    try {
      requireProjectExportPermission();
      if (!state.selectedSqlProfileId) throw new Error('Select a SQL profile first.');
      await runExternalSqlQueryPreview();
      renderAll();
      document.getElementById('sql-import-status').textContent = 'SQL query preview loaded.';
    } catch (err) {
      document.getElementById('sql-import-status').textContent = `SQL query failed: ${err.message}`;
    }
  });

  document.getElementById('import-sql-table-btn')?.addEventListener('click', async () => {
    try {
      requireProjectExportPermission();
      if (!state.selectedSqlProfileId) throw new Error('Select a SQL profile first.');
      const tableKey = state.selectedSqlTableKey || document.getElementById('sql-table-select').value;
      const caseLabelColumn = document.getElementById('sql-case-label-column').value;
      const maxRows = Number(document.getElementById('sql-max-rows').value || 500);
      if (!tableKey || !caseLabelColumn) throw new Error('Choose a table and a case label column.');
      const separatorIndex = tableKey.indexOf('.');
      if (separatorIndex < 0) throw new Error('Invalid table selection.');
      const schemaName = tableKey.slice(0, separatorIndex);
      const tableName = tableKey.slice(separatorIndex + 1);
      const selectedColumns = getSelectedSqlImportColumns();
      const variableColumns = getSelectedSqlVariableColumns();
      const env = await postJson(`${API_BASE}/sql-import/table`, {
        projectId: state.selectedProjectId,
        profileId: state.selectedSqlProfileId,
        schemaName,
        tableName,
        caseLabelColumn,
        maxRows,
        selectedColumns,
        variableColumns
      });
      await loadSelectedProjectData();
      renderAll();
      document.getElementById('sql-import-status').textContent = `Imported ${env.data.imported.casesCreated} cases, ${env.data.imported.attributesCreated} attributes, and ${env.data.imported.variablesCreated} variables from ${schemaName}.${tableName}.`;
    } catch (err) {
      document.getElementById('sql-import-status').textContent = `SQL import failed: ${err.message}`;
    }
  });

  document.getElementById('save-sql-import-job-btn')?.addEventListener('click', async () => {
    try {
      requireProjectExportPermission();
      if (!state.selectedSqlProfileId) throw new Error('Select a SQL profile first.');
      const tableKey = state.selectedSqlTableKey || document.getElementById('sql-table-select').value;
      const caseLabelColumn = document.getElementById('sql-case-label-column').value;
      if (!tableKey || !caseLabelColumn) throw new Error('Choose a table and a case label column.');
      const separatorIndex = tableKey.indexOf('.');
      if (separatorIndex < 0) throw new Error('Invalid table selection.');
      const schemaName = tableKey.slice(0, separatorIndex);
      const tableName = tableKey.slice(separatorIndex + 1);
      const label = window.prompt('SQL import job name', `${schemaName}.${tableName} import`);
      if (label === null) return;
      const maxRows = Number(document.getElementById('sql-job-max-rows')?.value || document.getElementById('sql-max-rows')?.value || 500);
      const scheduleEnabled = Boolean(document.getElementById('sql-job-schedule-enabled')?.checked);
      const scheduleIntervalMinutes = Number(document.getElementById('sql-job-schedule-interval')?.value || 60);
      await postJson(`${API_BASE}/sql-import/jobs`, {
        projectId: state.selectedProjectId,
        profileId: state.selectedSqlProfileId,
        label: label.trim(),
        schemaName,
        tableName,
        caseLabelColumn,
        selectedColumns: getSelectedSqlImportColumns(),
        variableColumns: getSelectedSqlVariableColumns(),
        maxRows,
        scheduleEnabled,
        scheduleIntervalMinutes
      });
      await loadExternalSqlImportJobs();
      renderAll();
      document.getElementById('sql-import-status').textContent = scheduleEnabled
        ? `SQL import job saved with a ${scheduleIntervalMinutes}-minute refresh schedule.`
        : 'SQL import job saved.';
    } catch (err) {
      document.getElementById('sql-import-status').textContent = `SQL import job save failed: ${err.message}`;
    }
  });

  document.getElementById('sql-import-jobs')?.addEventListener('click', async (event) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (!(target instanceof HTMLButtonElement)) return;
    const jobId = target.dataset.jobId;
    if (!jobId) return;
    try {
      requireProjectExportPermission();
      if (target.classList.contains('sql-job-run-btn')) {
        const maxRows = Number(document.getElementById('sql-job-max-rows')?.value || document.getElementById('sql-max-rows')?.value || 500);
        const env = await postJson(`${API_BASE}/sql-import/jobs/${encodeURIComponent(jobId)}/run`, {
          projectId: state.selectedProjectId,
          maxRows
        });
        await loadSelectedProjectData();
        await loadExternalSqlImportJobs();
        renderAll();
        document.getElementById('sql-import-status').textContent = `SQL refresh imported ${env.data.imported.casesCreated} cases and replaced ${env.data.imported.removedPriorCases} prior case rows.`;
        return;
      }
      if (target.classList.contains('sql-job-enable-schedule-btn') || target.classList.contains('sql-job-reschedule-btn')) {
        const suggested = target.dataset.currentInterval || document.getElementById('sql-job-schedule-interval')?.value || '60';
        const response = window.prompt('Automatic refresh interval in minutes', suggested);
        if (response === null) return;
        const intervalMinutes = Number(response || 60);
        const maxRows = Number(document.getElementById('sql-job-max-rows')?.value || document.getElementById('sql-max-rows')?.value || 500);
        await patchJson(`${API_BASE}/sql-import/jobs/${encodeURIComponent(jobId)}/schedule`, {
          projectId: state.selectedProjectId,
          enabled: true,
          intervalMinutes,
          maxRows
        });
        await loadExternalSqlImportJobs();
        renderAll();
        document.getElementById('sql-import-status').textContent = `SQL import job scheduled every ${intervalMinutes} minutes.`;
        return;
      }
      if (target.classList.contains('sql-job-pause-schedule-btn')) {
        const maxRows = Number(document.getElementById('sql-job-max-rows')?.value || document.getElementById('sql-max-rows')?.value || 500);
        await patchJson(`${API_BASE}/sql-import/jobs/${encodeURIComponent(jobId)}/schedule`, {
          projectId: state.selectedProjectId,
          enabled: false,
          maxRows
        });
        await loadExternalSqlImportJobs();
        renderAll();
        document.getElementById('sql-import-status').textContent = 'SQL import schedule paused.';
        return;
      }
      if (target.classList.contains('sql-job-delete-btn')) {
        await deleteJson(`${API_BASE}/sql-import/jobs/${encodeURIComponent(jobId)}?projectId=${encodeURIComponent(state.selectedProjectId)}`);
        await loadExternalSqlImportJobs();
        renderAll();
        document.getElementById('sql-import-status').textContent = 'SQL import job deleted.';
      }
    } catch (err) {
      document.getElementById('sql-import-status').textContent = `SQL import job action failed: ${err.message}`;
    }
  });

  document.getElementById('export-sql-table-btn')?.addEventListener('click', async () => {
    try {
      requireProjectExportPermission();
      if (!state.selectedSqlProfileId) throw new Error('Select a SQL profile first.');
      const exported = await exportDatasetToExternalSql();
      await loadExternalSqlTables(state.selectedSqlProfileId);
      renderAll();
    document.getElementById('sql-import-status').textContent = `Exported ${exported.rowsExported} dataset row(s) to external SQL with ${exported.columnsExported} column(s) using ${exported.mode} mode.`;
    } catch (err) {
      document.getElementById('sql-import-status').textContent = `SQL export failed: ${err.message}`;
    }
  });

  importBrowseBtn?.addEventListener('click', () => {
    importFileInput?.click();
  });

  importFileInput?.addEventListener('change', async () => {
    const files = [...(importFileInput.files ?? [])];
    if (files.length === 0) return;
    await importFiles(files);
    importFileInput.value = '';
  });

  importDropzone?.addEventListener('click', () => {
    importFileInput?.click();
  });
  importDropzone?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      importFileInput?.click();
    }
  });
  importDropzone?.addEventListener('dragover', (event) => {
    event.preventDefault();
    importDropzone.classList.add('dragover');
  });
  importDropzone?.addEventListener('dragleave', () => {
    importDropzone.classList.remove('dragover');
  });
  importDropzone?.addEventListener('drop', async (event) => {
    event.preventDefault();
    importDropzone.classList.remove('dragover');
    const files = [...(event.dataTransfer?.files ?? [])];
    if (files.length === 0) return;
    await importFiles(files);
  });

  document.getElementById('export-csv-btn')?.addEventListener('click', async () => {
    try {
      await downloadProjectDataset('csv');
    } catch (err) {
      document.getElementById('import-result').textContent = `Export failed: ${err.message}`;
    }
  });

  document.getElementById('export-xlsx-btn')?.addEventListener('click', async () => {
    try {
      await downloadProjectDataset('xlsx');
    } catch (err) {
      document.getElementById('import-result').textContent = `Excel export failed: ${err.message}`;
    }
  });

    document.getElementById('export-json-btn')?.addEventListener('click', async () => {
      try {
        await downloadProjectDataset('json');
      } catch (err) {
        document.getElementById('import-result').textContent = `Export failed: ${err.message}`;
      }
    });

    document.getElementById('open-recent-word-btn')?.addEventListener('click', async () => {
      try {
        await openRecentOfficeArtifact('word');
        document.getElementById('office-launch-status').textContent = 'Opened the most recent Word export in Microsoft Word.';
      } catch (err) {
        document.getElementById('office-launch-status').textContent = `Word open failed: ${err.message}`;
      }
    });

    document.getElementById('open-recent-excel-btn')?.addEventListener('click', async () => {
      try {
        await openRecentOfficeArtifact('excel');
        document.getElementById('office-launch-status').textContent = 'Opened the most recent Excel export in Microsoft Excel.';
      } catch (err) {
        document.getElementById('office-launch-status').textContent = `Excel open failed: ${err.message}`;
      }
    });

    document.getElementById('export-evidence-btn')?.addEventListener('click', async () => {
      try {
        await downloadEvidenceExport('json');
    } catch (err) {
      document.getElementById('import-result').textContent = `Evidence export failed: ${err.message}`;
    }
  });

  document.getElementById('export-evidence-docx-btn')?.addEventListener('click', async () => {
    try {
      await downloadEvidenceExport('docx');
    } catch (err) {
      document.getElementById('import-result').textContent = `Evidence Word export failed: ${err.message}`;
    }
  });

  document.getElementById('export-evidence-xlsx-btn')?.addEventListener('click', async () => {
    try {
      await downloadEvidenceExport('xlsx');
    } catch (err) {
      document.getElementById('import-result').textContent = `Evidence Excel export failed: ${err.message}`;
    }
  });

  document.getElementById('export-evidence-pdf-btn')?.addEventListener('click', async () => {
    try {
      await downloadEvidenceExport('pdf');
    } catch (err) {
      document.getElementById('import-result').textContent = `Evidence PDF export failed: ${err.message}`;
    }
  });

  document.getElementById('export-codebook-docx-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('codebook', 'docx');
    } catch (err) {
      document.getElementById('import-result').textContent = `Codebook Word export failed: ${err.message}`;
    }
  });

  document.getElementById('export-codebook-xlsx-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('codebook', 'xlsx');
    } catch (err) {
      document.getElementById('import-result').textContent = `Codebook Excel export failed: ${err.message}`;
    }
  });

  document.getElementById('export-codebook-pdf-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('codebook', 'pdf');
    } catch (err) {
      document.getElementById('import-result').textContent = `Codebook PDF export failed: ${err.message}`;
    }
  });

  document.getElementById('export-case-summaries-docx-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('case-summaries', 'docx');
    } catch (err) {
      document.getElementById('import-result').textContent = `Case summaries Word export failed: ${err.message}`;
    }
  });

  document.getElementById('export-case-summaries-xlsx-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('case-summaries', 'xlsx');
    } catch (err) {
      document.getElementById('import-result').textContent = `Case summaries Excel export failed: ${err.message}`;
    }
  });

  document.getElementById('export-case-summaries-pdf-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('case-summaries', 'pdf');
    } catch (err) {
      document.getElementById('import-result').textContent = `Case summaries PDF export failed: ${err.message}`;
    }
  });

  document.getElementById('export-appendix-docx-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('appendix', 'docx');
    } catch (err) {
      document.getElementById('import-result').textContent = `Appendix Word export failed: ${err.message}`;
    }
  });

  document.getElementById('export-appendix-xlsx-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('appendix', 'xlsx');
    } catch (err) {
      document.getElementById('import-result').textContent = `Appendix Excel export failed: ${err.message}`;
    }
  });

  document.getElementById('export-appendix-pdf-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('appendix', 'pdf');
    } catch (err) {
      document.getElementById('import-result').textContent = `Appendix PDF export failed: ${err.message}`;
    }
  });

  document.getElementById('apply-audit-filters-btn')?.addEventListener('click', async () => {
    try {
      await loadAuditEvents();
      renderAuditEvents();
    } catch (err) {
      document.getElementById('backup-result').textContent = `Audit load failed: ${err.message}`;
    }
  });

  document.getElementById('export-audit-json-btn')?.addEventListener('click', async () => {
    try {
      await downloadAuditExport('json');
    } catch (err) {
      document.getElementById('backup-result').textContent = `Audit JSON export failed: ${err.message}`;
    }
  });

  document.getElementById('export-audit-csv-btn')?.addEventListener('click', async () => {
    try {
      await downloadAuditExport('csv');
    } catch (err) {
      document.getElementById('backup-result').textContent = `Audit CSV export failed: ${err.message}`;
    }
  });

  document.getElementById('export-audit-xlsx-btn')?.addEventListener('click', async () => {
    try {
      await downloadAuditExport('xlsx');
    } catch (err) {
      document.getElementById('backup-result').textContent = `Audit Excel export failed: ${err.message}`;
    }
  });

  document.getElementById('export-audit-txt-btn')?.addEventListener('click', async () => {
    try {
      await downloadAuditExport('txt');
    } catch (err) {
      document.getElementById('backup-result').textContent = `Audit TXT export failed: ${err.message}`;
    }
  });

  document.getElementById('create-backup-btn')?.addEventListener('click', async () => {
    try {
      await createProjectBackup();
      renderBackupItems();
    } catch (err) {
      document.getElementById('backup-result').textContent = `Backup failed: ${err.message}`;
    }
  });

  document.getElementById('refresh-backups-btn')?.addEventListener('click', async () => {
    try {
      await loadBackupItems();
      renderBackupItems();
    } catch (err) {
      document.getElementById('backup-result').textContent = `Backup refresh failed: ${err.message}`;
    }
  });

  document.getElementById('refresh-deployment-btn')?.addEventListener('click', async () => {
    try {
      await loadGovernanceStatus();
      renderGovernanceStatus();
    } catch (err) {
      document.getElementById('policy-save-result').textContent = `Deployment refresh failed: ${err.message}`;
    }
  });

  document.getElementById('governance-policy-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const env = await putJson(`${API_BASE}/governance/policies`, {
        idleTimeoutMinutes: Number(document.getElementById('policy-idle-timeout').value),
        loginThrottleWindowMinutes: Number(document.getElementById('policy-login-window').value),
        loginThrottleMaxFailures: Number(document.getElementById('policy-login-failures').value),
        auditExportMaxRows: Number(document.getElementById('policy-audit-max-rows').value),
        backupRetentionDays: Number(document.getElementById('policy-backup-retention').value)
      });
      state.governancePolicy = env.data.policy;
      await loadGovernanceStatus();
      renderGovernanceStatus();
      document.getElementById('policy-save-result').textContent = 'Governance policy saved.';
    } catch (err) {
      document.getElementById('policy-save-result').textContent = `Policy save failed: ${err.message}`;
    }
  });

  document.getElementById('run-retrieval-btn')?.addEventListener('click', async () => {
    try {
      await runRetrieval();
    } catch (err) {
      document.getElementById('retrieval-summary').textContent = `Retrieval failed: ${err.message}`;
    }
  });

document.getElementById('run-text-search-btn')?.addEventListener('click', async () => {
  try {
    await runTextSearch();
  } catch (err) {
    document.getElementById('text-search-summary').textContent = `Text search failed: ${err.message}`;
  }
});

document.getElementById('run-sentiment-analysis-btn')?.addEventListener('click', async () => {
  try {
    await runSentimentAnalysis();
  } catch (err) {
    document.getElementById('sentiment-summary').textContent = `Sentiment analysis failed: ${err.message}`;
  }
});

  document.getElementById('run-word-frequency-btn')?.addEventListener('click', async () => {
    try {
      await runWordFrequency();
    } catch (err) {
      document.getElementById('word-frequency-summary').textContent = `Word frequency failed: ${err.message}`;
    }
  });

  document.getElementById('run-word-cloud-btn')?.addEventListener('click', async () => {
    try {
      await runWordCloud();
    } catch (err) {
      document.getElementById('word-cloud-summary').textContent = `Word cloud failed: ${err.message}`;
    }
  });

  document.getElementById('run-compound-query-btn')?.addEventListener('click', async () => {
    try {
      await runCompoundQuery();
    } catch (err) {
      document.getElementById('compound-query-summary').textContent = `Compound query failed: ${err.message}`;
    }
  });

  document.getElementById('run-code-cooccurrence-btn')?.addEventListener('click', async () => {
    try {
      await runCodeCooccurrence();
    } catch (err) {
      document.getElementById('cooccurrence-summary').textContent = `Co-occurrence failed: ${err.message}`;
    }
  });

  document.getElementById('run-map-visualization-btn')?.addEventListener('click', async () => {
    try {
      await runMapVisualization();
    } catch (err) {
      document.getElementById('map-visualization-summary').textContent = `Map view failed: ${err.message}`;
    }
  });

  document.getElementById('run-code-hierarchy-btn')?.addEventListener('click', async () => {
    try {
      await runCodeHierarchy();
    } catch (err) {
      document.getElementById('code-hierarchy-summary').textContent = `Code hierarchy failed: ${err.message}`;
    }
  });

  document.getElementById('run-concept-map-btn')?.addEventListener('click', async () => {
    try {
      await runConceptMap();
    } catch (err) {
      document.getElementById('concept-map-summary').textContent = `Concept map failed: ${err.message}`;
    }
  });

  document.getElementById('frequency-field')?.addEventListener('change', (event) => {
    state.selectedFrequencyField = event.target.value || null;
    state.quantOutputView = 'frequency';
    rememberQuantOutput('frequency', 'Frequency', state.selectedFrequencyField || 'Selected field');
    renderFrequencyTable();
    syncWorkspaceMenus();
  });

  document.getElementById('forecast-method')?.addEventListener('change', () => {
    renderForecasting();
  });

  document.getElementById('filter-operator')?.addEventListener('change', (event) => {
    const valueEl = document.getElementById('filter-value');
    const operator = event.target.value;
    const valueDisabled = operator === 'is_missing' || operator === 'not_missing';
    valueEl.disabled = valueDisabled;
    if (valueDisabled) valueEl.value = '';
  });

  document.getElementById('apply-filter-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const fieldKey = document.getElementById('filter-field').value;
    const operator = document.getElementById('filter-operator').value;
    const rawValue = document.getElementById('filter-value').value;
    if (!fieldKey) { alert('Choose a filter field.'); return; }
    const needsValue = !['is_missing', 'not_missing'].includes(operator);
    if (needsValue && !rawValue.trim()) { alert('Enter a filter value.'); return; }
    state.selectedDatasetFilters = [{
      fieldKey,
      operator,
      value: needsValue ? coerceAnalysisValue(rawValue) : null
    }];
    clearQuantResults();
    await refreshDatasetAnalysis({ includeCrosstab: false });
    renderAll();
  });

  document.getElementById('apply-recode-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const sourceFieldKey = document.getElementById('recode-source-field').value;
    const outputFieldKey = normalizeAnalysisFieldKey(document.getElementById('recode-output-key').value);
    const outputLabel = document.getElementById('recode-output-label').value.trim();
    const ruleText = document.getElementById('recode-rules').value;
    if (!sourceFieldKey) { alert('Choose a recode source field.'); return; }
    if (!outputLabel) { alert('Enter an output label for the recoded field.'); return; }
    const parsedRules = parseRecodeRules(ruleText);
    if (parsedRules.rules.length === 0 && parsedRules.defaultValue === undefined) {
      alert('Enter at least one recode rule.');
      return;
    }
    state.selectedDatasetRecodes = [{
      sourceFieldKey,
      outputFieldKey: outputFieldKey || undefined,
      outputLabel,
      rules: parsedRules.rules,
      defaultValue: parsedRules.defaultValue
    }];
    clearQuantResults();
    await refreshDatasetAnalysis({ includeCrosstab: false });
    renderAll();
  });

  document.getElementById('analysis-weight-field')?.addEventListener('change', async (event) => {
    state.selectedAnalysisWeightField = event.target.value || '';
    clearQuantResults();
    await refreshDatasetAnalysis({ includeCrosstab: false });
    renderAll();
  });

  document.getElementById('missing-strategy')?.addEventListener('change', async (event) => {
    state.selectedMissingStrategy = event.target.value || 'available';
    clearQuantResults();
    await refreshDatasetAnalysis({ includeCrosstab: false });
    renderAll();
  });

  document.getElementById('missing-codes')?.addEventListener('change', async (event) => {
    state.selectedMissingCodes = event.target.value || '';
    clearQuantResults();
    await refreshDatasetAnalysis({ includeCrosstab: false });
    renderAll();
  });

  document.getElementById('clear-analysis-btn')?.addEventListener('click', () => {
    state.selectedDatasetFilters = [];
    state.selectedDatasetRecodes = [];
    state.selectedAnalysisWeightField = '';
    state.selectedMissingStrategy = 'available';
    state.selectedMissingCodes = '';
    state.selectedDescriptives = state.selectedDescriptivesBase;
    clearQuantResults();
    renderAll();
  });

  document.getElementById('crosstab-row-field')?.addEventListener('change', (event) => {
    state.selectedCrosstabRowField = event.target.value || null;
    state.selectedCrosstab = null;
    state.selectedCrosstabError = '';
    renderCrosstab();
  });

  document.getElementById('crosstab-column-field')?.addEventListener('change', (event) => {
    state.selectedCrosstabColumnField = event.target.value || null;
    state.selectedCrosstab = null;
    state.selectedCrosstabError = '';
    renderCrosstab();
  });

document.getElementById('workspace-source-select')?.addEventListener('change', (event) => {
  state.activeSourceId = event.target.value || null;
  state.workspaceSelectedItemKey = null;
  const segmentSourceEl = document.getElementById('segment-source-id');
  if (segmentSourceEl) segmentSourceEl.value = state.activeSourceId ?? '';
  void loadMediaTimelineForActiveSource().then(() => {
    renderSourceWorkspace();
    renderMediaTimeline();
  });
});

  document.getElementById('workspace-code-select')?.addEventListener('change', (event) => {
    state.workspaceSelectedCodeId = event.target.value || null;
    const codeEl = document.getElementById('ca-code-id');
    if (codeEl) codeEl.value = state.workspaceSelectedCodeId ?? '';
    renderSourceWorkspace();
  });

  document.getElementById('workspace-case-select')?.addEventListener('change', (event) => {
    state.workspaceSelectedCaseId = event.target.value || '';
    const caseEl = document.getElementById('ca-case-id');
    if (caseEl) caseEl.value = state.workspaceSelectedCaseId;
    renderSourceWorkspace();
  });

document.getElementById('refresh-workspace-btn')?.addEventListener('click', async () => {
  await loadSelectedProjectData();
  await loadMediaTimelineForActiveSource();
  renderAll();
});

  document.getElementById('workspace-capture-start-btn')?.addEventListener('click', () => {
    captureWorkspaceMediaTime('workspace-media-start');
  });

  document.getElementById('workspace-capture-end-btn')?.addEventListener('click', () => {
    captureWorkspaceMediaTime('workspace-media-end');
  });

document.getElementById('workspace-save-media-segment-btn')?.addEventListener('click', async () => {
  await saveWorkspaceMediaSegment();
});
document.getElementById('workspace-refresh-media-timeline-btn')?.addEventListener('click', async () => {
  await loadMediaTimelineForActiveSource();
  renderMediaTimeline();
});
document.getElementById('workspace-queue-transcription-btn')?.addEventListener('click', async () => {
  await queueTranscriptionJob();
});

  document.getElementById('save-transform-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    if (state.selectedDatasetFilters.length === 0 && state.selectedDatasetRecodes.length === 0) {
      alert('Apply a filter or recode before saving a transform.');
      return;
    }
    const label = document.getElementById('transform-label').value.trim();
    if (!label) { alert('Enter a label for the saved transform.'); return; }
    await postJson(`${API_BASE}/saved-transforms`, {
      projectId: state.selectedProjectId,
      label,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes
    });
    document.getElementById('transform-label').value = '';
    await loadSelectedProjectData();
    renderAll();
  });

  document.getElementById('save-analysis-job-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    if (!state.lastQuantAnalysis) {
      alert('Run a statistical procedure first.');
      return;
    }
    const label = document.getElementById('analysis-job-label').value.trim();
    if (!label) { alert('Enter a label for the saved analysis.'); return; }
    await postJson(`${API_BASE}/saved-analysis-jobs`, {
      projectId: state.selectedProjectId,
      label,
      analysisKind: state.lastQuantAnalysis.analysisKind,
      analysis: state.lastQuantAnalysis.analysis
    });
    document.getElementById('analysis-job-label').value = '';
    await loadSelectedProjectData();
    renderAll();
  });

  document.getElementById('open-compiled-report-btn')?.addEventListener('click', () => {
    try {
      openCompiledReportWindow();
    } catch (err) {
      window.alert(`Compiled report failed: ${err.message}`);
    }
  });

  document.getElementById('export-compiled-report-btn')?.addEventListener('click', () => {
    try {
      exportCompiledReportHtml();
    } catch (err) {
      window.alert(`Compiled report export failed: ${err.message}`);
    }
  });

  document.getElementById('report-select-all-btn')?.addEventListener('click', () => {
    state.compiledReportIncludedViews = getAllCompiledReportViews();
    renderCompiledReportControls();
  });

  document.getElementById('report-clear-all-btn')?.addEventListener('click', () => {
    state.compiledReportIncludedViews = getAllCompiledReportViews();
    renderCompiledReportControls();
  });

  document.getElementById('report-committee-pack-btn')?.addEventListener('click', () => {
    state.compiledReportIncludedViews = getDefaultCommitteePackViews();
    renderCompiledReportControls();
    if (state.selectedProjectId) {
      state.compiledReportPresets = [
        {
          id: `preset-${Date.now()}`,
          label: 'Committee pack',
          views: [...state.compiledReportIncludedViews],
          favorite: true
        },
        ...state.compiledReportPresets.filter((entry) => entry.label !== 'Committee pack')
      ].slice(0, 20);
      persistCompiledReportPresets();
      renderCompiledReportPresets();
    } else {
      const input = document.getElementById('compiled-report-preset-label');
      if (input && !input.value.trim()) input.value = 'Committee pack';
    }
  });

  document.getElementById('save-report-preset-btn')?.addEventListener('click', () => {
    if (!state.selectedProjectId) {
      window.alert('Select a project first.');
      return;
    }
    const input = document.getElementById('compiled-report-preset-label');
    const label = input?.value?.trim();
    if (!label) {
      window.alert('Enter a preset label first.');
      return;
    }
    ensureCompiledReportViews();
    state.compiledReportPresets = [
      {
        id: `preset-${Date.now()}`,
        label,
        views: [...state.compiledReportIncludedViews],
        favorite: false
      },
      ...state.compiledReportPresets.filter((entry) => entry.label !== label)
    ].slice(0, 20);
    persistCompiledReportPresets();
    if (input) input.value = '';
    renderCompiledReportPresets();
  });

  document.getElementById('print-output-btn')?.addEventListener('click', () => {
    window.print();
  });

  document.getElementById('run-reliability-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const fields = getSelectedValues(document.getElementById('reliability-fields'));
    const subscales = parseReliabilitySubscales(document.getElementById('reliability-subscales')?.value ?? '');
    if (fields.length < 2) {
      alert('Choose at least two numeric fields for reliability analysis.');
      return;
    }
    const env = await postJson(`${API_BASE}/reliability`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      fields,
      subscales
    });
    state.reliabilityResult = env.data.reliability;
    setLastQuantAnalysis('reliability', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      fields,
      subscales
    });
    renderReliability();
  });

  document.getElementById('run-factor-analysis-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const fields = getSelectedValues(document.getElementById('factor-analysis-fields'));
    const factorCount = Number(document.getElementById('factor-count')?.value || 0);
    const rotationValue = document.getElementById('factor-rotation')?.value;
    const rotation = rotationValue === 'varimax' || rotationValue === 'promax' ? rotationValue : 'none';
    if (fields.length < 2) {
      alert('Choose at least two numeric fields for factor analysis.');
      return;
    }
    const env = await postJson(`${API_BASE}/factor-analysis`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      fields,
      factorCount,
      rotation
    });
    state.factorAnalysisResult = env.data.factorAnalysis;
    setLastQuantAnalysis('factor_analysis', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      fields,
      factorCount,
      rotation
    });
    renderFactorAnalysis();
  });

  document.getElementById('run-forecasting-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const timeField = document.getElementById('forecast-time-field')?.value;
    const valueField = document.getElementById('forecast-value-field')?.value;
    const horizon = Number(document.getElementById('forecast-horizon')?.value || 3);
    const method = document.getElementById('forecast-method')?.value || 'linear_trend';
    const movingAverageWindow = Number(document.getElementById('forecast-window')?.value || 3);
    const smoothingAlpha = Number(document.getElementById('forecast-alpha')?.value || 0.35);
    if (!timeField || !valueField || timeField === valueField) {
      alert('Choose different time/order and numeric value fields for forecasting.');
      return;
    }
    const env = await postJson(`${API_BASE}/forecasting`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      timeField,
      valueField,
      horizon,
      method,
      movingAverageWindow,
      smoothingAlpha
    });
    state.forecastingResult = env.data.forecast;
    setLastQuantAnalysis('forecasting', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      timeField,
      valueField,
      horizon,
      method,
      movingAverageWindow,
      smoothingAlpha
    });
    renderAll();
  });

  document.getElementById('run-cluster-analysis-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const fields = getSelectedValues(document.getElementById('cluster-analysis-fields'));
    const clusterCount = Number(document.getElementById('cluster-count')?.value || 3);
    if (fields.length < 2) {
      alert('Choose at least two numeric fields for cluster analysis.');
      return;
    }
    const env = await postJson(`${API_BASE}/cluster-analysis`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      fields,
      clusterCount
    });
    state.clusterAnalysisResult = env.data.clusterAnalysis;
    setLastQuantAnalysis('cluster_analysis', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      fields,
      clusterCount
    });
    renderAll();
  });

  document.getElementById('run-decision-tree-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const targetField = document.getElementById('decision-tree-target-field')?.value;
    const predictorFields = getSelectedValues(document.getElementById('decision-tree-predictor-fields'));
    const maxDepth = Number(document.getElementById('decision-tree-depth')?.value || 3);
    if (!targetField || predictorFields.length === 0 || predictorFields.includes(targetField)) {
      alert('Choose a target field and different predictor fields for the decision tree.');
      return;
    }
    const env = await postJson(`${API_BASE}/decision-tree`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      targetField,
      predictorFields,
      maxDepth
    });
    state.decisionTreeResult = env.data.decisionTree;
    setLastQuantAnalysis('decision_tree', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      targetField,
      predictorFields,
      maxDepth
    });
    renderAll();
  });

  document.getElementById('run-general-linear-model-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const dependentField = document.getElementById('glm-dependent-field')?.value;
    const factorFields = getSelectedValues(document.getElementById('glm-factor-fields'));
    const covariateFields = getSelectedValues(document.getElementById('glm-covariate-fields'))
      .filter((field) => !factorFields.includes(field));
    if (!dependentField || (factorFields.length === 0 && covariateFields.length === 0)) {
      alert('Choose a dependent field and at least one factor or covariate.');
      return;
    }
    if ([...factorFields, ...covariateFields].includes(dependentField)) {
      alert('Dependent, factor, and covariate fields must be different.');
      return;
    }
    const env = await postJson(`${API_BASE}/general-linear-model`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      dependentField,
      factorFields,
      covariateFields
    });
    state.generalLinearModelResult = env.data.generalLinearModel;
    setLastQuantAnalysis('general_linear_model', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      dependentField,
      factorFields,
      covariateFields
    });
    renderAll();
  });

  document.getElementById('run-repeated-measures-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const fields = getSelectedValues(document.getElementById('repeated-measures-fields'));
    if (fields.length < 2) {
      alert('Choose at least two repeated measure fields.');
      return;
    }
    const env = await postJson(`${API_BASE}/repeated-measures`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      fields
    });
    state.repeatedMeasuresResult = env.data.repeatedMeasures;
    setLastQuantAnalysis('repeated_measures', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      fields
    });
    renderAll();
  });

  document.getElementById('run-survival-analysis-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const timeField = document.getElementById('survival-time-field')?.value;
    const eventField = document.getElementById('survival-event-field')?.value;
    const groupField = document.getElementById('survival-group-field')?.value || undefined;
    if (!timeField || !eventField || timeField === eventField) {
      alert('Choose different time and event fields.');
      return;
    }
    const env = await postJson(`${API_BASE}/survival-analysis`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      timeField,
      eventField,
      groupField
    });
    state.survivalAnalysisResult = env.data.survivalAnalysis;
    setLastQuantAnalysis('survival_analysis', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      timeField,
      eventField,
      groupField
    });
    renderAll();
  });

  document.getElementById('run-complex-samples-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const targetField = document.getElementById('complex-samples-target-field')?.value;
    const strataField = document.getElementById('complex-samples-strata-field')?.value || undefined;
    const clusterField = document.getElementById('complex-samples-cluster-field')?.value || undefined;
    const groupField = document.getElementById('complex-samples-group-field')?.value || undefined;
    if (!targetField) {
      alert('Choose a target field for complex samples.');
      return;
    }
    const env = await postJson(`${API_BASE}/complex-samples`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      targetField,
      strataField,
      clusterField,
      groupField
    });
    state.complexSamplesResult = env.data.complexSamples;
    setLastQuantAnalysis('complex_samples', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      targetField,
      strataField,
      clusterField,
      groupField
    });
    renderAll();
  });

  document.getElementById('run-neural-network-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const targetField = document.getElementById('neural-network-target-field')?.value;
    const predictorFields = getSelectedValues(document.getElementById('neural-network-predictor-fields'));
    const task = document.getElementById('neural-network-task')?.value === 'classification' ? 'classification' : 'regression';
    const hiddenUnits = Number(document.getElementById('neural-network-hidden-units')?.value || 5);
    if (!targetField || predictorFields.length === 0 || predictorFields.includes(targetField)) {
      alert('Choose a target field and different numeric predictor fields.');
      return;
    }
    const env = await postJson(`${API_BASE}/neural-network`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      targetField,
      predictorFields,
      task,
      hiddenUnits
    });
    state.neuralNetworkResult = env.data.neuralNetwork;
    setLastQuantAnalysis('neural_network', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      targetField,
      predictorFields,
      task,
      hiddenUnits
    });
    renderAll();
  });

  document.getElementById('run-syntax-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const syntax = document.getElementById('syntax-input')?.value?.trim() ?? '';
    if (!syntax) {
      alert('Enter syntax to run.');
      return;
    }
    const env = await postJson(`${API_BASE}/syntax-run`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      syntax
    });
    state.syntaxRunResult = env.data.syntaxRun;
    setLastQuantAnalysis('syntax_run', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      syntax
    });
    renderAll();
  });

  document.getElementById('run-regression-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const dependentField = document.getElementById('regression-dependent-field').value;
    const predictorFields = getSelectedValues(document.getElementById('regression-predictor-fields'));
    const model = document.getElementById('regression-model').value;
    if (!dependentField || predictorFields.length === 0) {
      alert('Choose a dependent field and at least one predictor field.');
      return;
    }
    if (predictorFields.includes(dependentField)) {
      alert('Dependent and predictor fields must be different.');
      return;
    }
    const env = await postJson(`${API_BASE}/regression`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      dependentField,
      predictorField: predictorFields[0],
      predictorFields,
      model
    });
    state.regressionResult = env.data.regression;
    setLastQuantAnalysis('regression', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      dependentField,
      predictorFields,
      model
    });
    renderRegression();
  });

  document.getElementById('run-correlation-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const xField = document.getElementById('correlation-x-field').value;
    const yField = document.getElementById('correlation-y-field').value;
    if (!xField || !yField) {
      alert('Choose both numeric fields for correlation.');
      return;
    }
    if (xField === yField) {
      alert('Choose two different numeric fields for correlation.');
      return;
    }
    const env = await postJson(`${API_BASE}/correlation`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      xField,
      yField
    });
    state.correlationResult = env.data.correlation;
    setLastQuantAnalysis('correlation', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      xField,
      yField
    });
    renderCorrelation();
  });

  document.getElementById('run-compare-means-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const outcomeField = document.getElementById('compare-means-outcome-field').value;
    const groupField = document.getElementById('compare-means-group-field').value;
    if (!outcomeField || !groupField) {
      alert('Choose both an outcome field and a grouping field.');
      return;
    }
    if (outcomeField === groupField) {
      alert('Choose different outcome and grouping fields.');
      return;
    }
    const env = await postJson(`${API_BASE}/compare-means`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      outcomeField,
      groupField
    });
    state.compareMeansResult = env.data.compareMeans;
    setLastQuantAnalysis('compare_means', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      outcomeField,
      groupField
    });
    renderCompareMeans();
  });

  document.getElementById('run-ttest-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const outcomeField = document.getElementById('ttest-outcome-field').value;
    const groupField = document.getElementById('ttest-group-field').value;
    if (!outcomeField || !groupField || outcomeField === groupField) {
      alert('Choose different outcome and grouping fields for the t-test.');
      return;
    }
    const env = await postJson(`${API_BASE}/t-tests`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      outcomeField,
      groupField
    });
    state.tTestResult = env.data.tTest;
    setLastQuantAnalysis('t_test', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      outcomeField,
      groupField
    });
    renderTTest();
  });

  document.getElementById('run-paired-ttest-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const beforeField = document.getElementById('paired-before-field').value;
    const afterField = document.getElementById('paired-after-field').value;
    if (!beforeField || !afterField || beforeField === afterField) {
      alert('Choose two different numeric fields for the paired t-test.');
      return;
    }
    const env = await postJson(`${API_BASE}/paired-t-tests`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      beforeField,
      afterField
    });
    state.pairedTTestResult = env.data.pairedTTest;
    setLastQuantAnalysis('paired_t_test', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      beforeField,
      afterField
    });
    renderPairedTTest();
  });

  document.getElementById('run-nonparametric-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const outcomeField = document.getElementById('nonparametric-outcome-field').value;
    const groupField = document.getElementById('nonparametric-group-field').value;
    if (!outcomeField || !groupField || outcomeField === groupField) {
      alert('Choose different outcome and grouping fields for the nonparametric test.');
      return;
    }
    const env = await postJson(`${API_BASE}/nonparametric-tests`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      outcomeField,
      groupField
    });
    state.nonparametricResult = env.data.nonparametric;
    setLastQuantAnalysis('nonparametric', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      outcomeField,
      groupField
    });
    renderNonparametric();
  });

  document.getElementById('run-matrix-coding-btn')?.addEventListener('click', async () => {
    try {
      await runMatrixCoding();
    } catch (err) {
      document.getElementById('matrix-coding-summary').textContent = `Matrix coding failed: ${err.message}`;
    }
  });

  document.getElementById('run-code-code-matrix-btn')?.addEventListener('click', async () => {
    try {
      await runCodeCodeMatrix();
    } catch (err) {
      document.getElementById('code-code-matrix-summary').textContent = `Code-by-code matrix failed: ${err.message}`;
    }
  });

  document.getElementById('run-framework-matrix-btn')?.addEventListener('click', async () => {
    try {
      await runFrameworkMatrix();
    } catch (err) {
      document.getElementById('framework-matrix-summary').textContent = `Framework matrix failed: ${err.message}`;
    }
  });

document.getElementById('run-keyword-autocode-btn')?.addEventListener('click', async () => {
  try {
    await runKeywordAutocode();
  } catch (err) {
    document.getElementById('autocode-summary').textContent = `Keyword autocoding failed: ${err.message}`;
  }
});

document.getElementById('run-pattern-autocode-btn')?.addEventListener('click', async () => {
  try {
    await runPatternAutocode();
  } catch (err) {
    document.getElementById('autocode-summary').textContent = `Pattern autocoding failed: ${err.message}`;
  }
});

  document.getElementById('run-code-by-case-btn')?.addEventListener('click', async () => {
    try {
      await runCodeByCaseView();
    } catch (err) {
      document.getElementById('code-by-case-summary').textContent = `Code-by-case view failed: ${err.message}`;
    }
  });

  document.getElementById('run-coding-comparison-btn')?.addEventListener('click', async () => {
    try {
      await runCodingComparison();
    } catch (err) {
      document.getElementById('coding-comparison-summary').textContent = `Coding comparison failed: ${err.message}`;
    }
  });

document.getElementById('run-inter-rater-summary-btn')?.addEventListener('click', async () => {
  try {
    await runInterRaterSummary();
  } catch (err) {
    document.getElementById('inter-rater-summary-summary').textContent = `Inter-rater summary failed: ${err.message}`;
  }
});
document.getElementById('run-merge-review-btn')?.addEventListener('click', async () => {
  try {
    await runMergeReview();
  } catch (err) {
    document.getElementById('merge-review-summary').textContent = `Merge review failed: ${err.message}`;
  }
});

  document.getElementById('run-query-report-btn')?.addEventListener('click', async () => {
    try {
      await runQualitativeQueryReport();
    } catch (err) {
      document.getElementById('query-report-summary').textContent = `Query report failed: ${err.message}`;
    }
  });

  document.getElementById('save-qual-query-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const label = document.getElementById('qual-query-label').value.trim();
    const mode = document.getElementById('qual-query-mode').value;
    if (!label) { alert('Enter a label for the qualitative query.'); return; }
    await postJson(`${API_BASE}/saved-qualitative-queries`, {
      projectId: state.selectedProjectId,
      label,
      mode,
      query: readQualitativeQueryInputs()
    });
    document.getElementById('qual-query-label').value = '';
    await loadSelectedProjectData();
    renderAll();
  });

  document.getElementById('import-references-btn')?.addEventListener('click', async () => {
    try {
      await importReferences();
    } catch (err) {
      document.getElementById('reference-import-result').textContent = `Reference import failed: ${err.message}`;
    }
  });

  document.getElementById('run-crosstab-btn')?.addEventListener('click', async () => {
    await loadSelectedCrosstab();
    setLastQuantAnalysis('crosstab', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      rowField: state.selectedCrosstabRowField,
      columnField: state.selectedCrosstabColumnField
    });
    renderCrosstab();
  });

  document.getElementById('run-custom-table-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const rowFields = getSelectedValues(document.getElementById('custom-table-row-fields'));
    const columnField = document.getElementById('custom-table-column-field')?.value || '';
    const measureFields = getSelectedValues(document.getElementById('custom-table-measure-fields'));
    if (rowFields.length === 0) {
      alert('Choose at least one row field for the custom table.');
      return;
    }
    const env = await postJson(`${API_BASE}/custom-tables`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      rowFields,
      columnField,
      measureFields
    });
    state.customTableResult = env.data.customTable;
    setLastQuantAnalysis('custom_table', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      rowFields,
      columnField,
      measureFields
    });
    renderAll();
  });

  document.getElementById('run-exact-test-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const rowField = document.getElementById('exact-row-field')?.value;
    const columnField = document.getElementById('exact-column-field')?.value;
    if (!rowField || !columnField || rowField === columnField) {
      alert('Choose two different fields for exact testing.');
      return;
    }
    const env = await postJson(`${API_BASE}/exact-tests`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      rowField,
      columnField
    });
    state.exactTestResult = env.data.exactTest;
    setLastQuantAnalysis('exact_test', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      rowField,
      columnField
    });
    renderAll();
  });

  document.getElementById('bootstrap-procedure')?.addEventListener('change', () => {
    renderBootstrap();
  });

  document.getElementById('run-bootstrap-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const procedure = document.getElementById('bootstrap-procedure')?.value === 'correlation' ? 'correlation' : 'mean';
    const targetFields = getSelectedValues(document.getElementById('bootstrap-target-fields'));
    const requiredCount = procedure === 'correlation' ? 2 : 1;
    if (targetFields.length < requiredCount) {
      alert(`Choose ${requiredCount} numeric target field${requiredCount === 1 ? '' : 's'} for this bootstrap.`);
      return;
    }
    const iterations = Number(document.getElementById('bootstrap-iterations')?.value || 1000);
    const confidenceLevel = Number(document.getElementById('bootstrap-confidence')?.value || 0.95);
    const env = await postJson(`${API_BASE}/bootstrap`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      procedure,
      targetFields,
      iterations,
      confidenceLevel
    });
    state.bootstrapResult = env.data.bootstrap;
    setLastQuantAnalysis('bootstrap', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      procedure,
      targetFields,
      iterations,
      confidenceLevel
    });
    renderAll();
  });

  document.getElementById('run-missing-values-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const env = await postJson(`${API_BASE}/missing-values`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload()
    });
    state.missingValuesResult = env.data.missingValues;
    setLastQuantAnalysis('missing_values', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload()
    });
    renderAll();
  });

  document.getElementById('run-imputation-plan-btn')?.addEventListener('click', async () => {
    if (!state.selectedProjectId) { alert('Select a project first.'); return; }
    const field = document.getElementById('imputation-field')?.value;
    const method = document.getElementById('imputation-method')?.value || 'mode';
    if (!field) {
      alert('Choose a field for imputation preview.');
      return;
    }
    const strategy = {
      field,
      method,
      value: method === 'constant' ? parseImputationConstant(document.getElementById('imputation-constant')?.value) : null
    };
    const env = await postJson(`${API_BASE}/imputation-plan`, {
      projectId: state.selectedProjectId,
      filters: state.selectedDatasetFilters,
      recodes: state.selectedDatasetRecodes,
      analysis: getAnalysisOptionsPayload(),
      strategies: [strategy]
    });
    state.imputationPlanResult = env.data.imputationPlan;
    setLastQuantAnalysis('imputation_plan', {
      filters: cloneJson(state.selectedDatasetFilters),
      recodes: cloneJson(state.selectedDatasetRecodes),
      analysisOptions: getAnalysisOptionsPayload(),
      strategies: [strategy]
    });
    renderAll();
  });

  document.getElementById('export-chat-history-word-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('chat-history', 'docx');
    } catch (err) {
      window.alert(`Chat history Word export failed: ${err.message}`);
    }
  });

  document.getElementById('export-chat-history-excel-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('chat-history', 'xlsx');
    } catch (err) {
      window.alert(`Chat history Excel export failed: ${err.message}`);
    }
  });

  document.getElementById('export-chat-history-json-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('chat-history', 'json');
    } catch (err) {
      window.alert(`Chat history JSON export failed: ${err.message}`);
    }
  });

  document.getElementById('export-matrix-word-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('matrix-code-case', 'docx');
    } catch (err) {
      window.alert(`Matrix Word export failed: ${err.message}`);
    }
  });

  document.getElementById('export-matrix-excel-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('matrix-code-case', 'xlsx');
    } catch (err) {
      window.alert(`Matrix Excel export failed: ${err.message}`);
    }
  });

  document.getElementById('export-code-code-word-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('matrix-code-code', 'docx');
    } catch (err) {
      window.alert(`Code x code Word export failed: ${err.message}`);
    }
  });

  document.getElementById('export-code-code-excel-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('matrix-code-code', 'xlsx');
    } catch (err) {
      window.alert(`Code x code Excel export failed: ${err.message}`);
    }
  });

  document.getElementById('export-cooccurrence-word-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('cooccurrence', 'docx');
    } catch (err) {
      window.alert(`Co-occurrence Word export failed: ${err.message}`);
    }
  });

  document.getElementById('export-query-report-word-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('query-report', 'docx');
    } catch (err) {
      window.alert(`Query report Word export failed: ${err.message}`);
    }
  });

  document.getElementById('export-framework-word-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('framework-matrix', 'docx');
    } catch (err) {
      window.alert(`Framework Word export failed: ${err.message}`);
    }
  });

  document.getElementById('export-framework-excel-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('framework-matrix', 'xlsx');
    } catch (err) {
      window.alert(`Framework Excel export failed: ${err.message}`);
    }
  });

  document.getElementById('export-coding-comparison-word-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('coding-comparison', 'docx', {
        codeId: document.getElementById('comparison-code-id')?.value?.trim() || document.getElementById('retrieval-code-id')?.value?.trim() || '',
        coderA: document.getElementById('comparison-coder-a')?.value?.trim() || '',
        coderB: document.getElementById('comparison-coder-b')?.value?.trim() || ''
      });
    } catch (err) {
      window.alert(`Coding comparison Word export failed: ${err.message}`);
    }
  });

  document.getElementById('export-inter-rater-word-btn')?.addEventListener('click', async () => {
    try {
      await downloadReportPackage('inter-rater-summary', 'docx', {
        coderA: document.getElementById('comparison-coder-a')?.value?.trim() || '',
        coderB: document.getElementById('comparison-coder-b')?.value?.trim() || ''
      });
    } catch (err) {
      window.alert(`Inter-rater Word export failed: ${err.message}`);
    }
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

async function refreshPage() {
  await loadHealth();
  await loadIntegrationStatus();
  await loadGovernanceStatus();
  await loadProjectsAndSelection();
  await loadSelectedProjectData();
  await loadRecentOfficeArtifacts();
  await loadExternalSqlProfiles();
  await loadExternalSqlImportJobs();
  if (state.selectedSqlProfileId) {
    await loadExternalSqlTables(state.selectedSqlProfileId);
  }
  await syncPresence({ announce: false, heartbeat: true });
  renderAll();
  if (!state.selectedProjectId) {
    activateTab('projects');
  }
}

async function boot() {
  initTabs();
  await loadAuthConfig();
  await loadIntegrationStatus();
  initLoginOverlay();
  initActivityTracking();
  wireForms();

  const loggedIn = await checkSession();
  if (loggedIn) {
    await refreshPage();
    startPolling();
  }
}

boot().catch((err) => {
  console.error('Boot error:', err);
  setHtml('project-card', `<p><strong>Boot failed</strong></p><p>${escapeHtml(err.message)}</p>`);
});
