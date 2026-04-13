import type { Attribute, CaseEntity, Variable } from '@mu/core-domain';

export type DatasetValue = string | number | boolean | null;
export type DatasetRow = Record<string, DatasetValue>;

export type DatasetFieldSource = 'system' | 'attribute' | 'variable';
export type DatasetValueType = 'string' | 'number' | 'boolean' | 'null' | 'mixed';

export type DatasetField = {
  key: string;
  label: string;
  source: DatasetFieldSource;
  valueType: DatasetValueType;
};

export type DatasetNote = {
  level: 'info';
  message: string;
};

export type DatasetFrequency = {
  value: string;
  count: number;
  proportion: number;
};

export type NumericSummary = {
  mean: number;
  min: number;
  max: number;
  stdDev?: number | null;
};

export type ConfidenceInterval = {
  level: number;
  lower: number | null;
  upper: number | null;
};

export type AssumptionCheck = {
  key: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  value: number | string | boolean | null;
  message: string;
};

export type DatasetFieldSummary = {
  key: string;
  label: string;
  source: DatasetFieldSource;
  valueType: DatasetValueType;
  validCount: number;
  missingCount: number;
  weightedValidCount?: number | null;
  weightedMissingCount?: number | null;
  distinctCount: number;
  frequencies: DatasetFrequency[];
  numeric: NumericSummary | null;
};

export type AnalysisMissingStrategy = 'available' | 'listwise';

export type DatasetAnalysisOptions = {
  weightField?: string;
  missingValues?: string[];
  missingStrategy?: AnalysisMissingStrategy;
};

export type DatasetDescriptives = {
  caseCount: number;
  fieldCount: number;
  summaries: DatasetFieldSummary[];
  weightedCaseCount?: number | null;
  analysis?: {
    weightField: string | null;
    missingValues: string[];
    missingStrategy: AnalysisMissingStrategy;
  };
};

export type CrosstabMargin = {
  value: string;
  count: number;
  proportion: number;
};

export type DatasetCrosstabCell = {
  rowValue: string;
  columnValue: string;
  count: number;
  rowProportion: number;
  columnProportion: number;
  totalProportion: number;
};

export type DatasetCrosstab = {
  rowField: string;
  rowLabel: string;
  columnField: string;
  columnLabel: string;
  caseCount: number;
  validCaseCount: number;
  missingCaseCount: number;
  weightedCaseCount?: number | null;
  weightedValidCaseCount?: number | null;
  rowCategories: CrosstabMargin[];
  columnCategories: CrosstabMargin[];
  cells: DatasetCrosstabCell[];
  chiSquare: {
    statistic: number;
    degreesOfFreedom: number;
    pValue: number | null;
    cramersV: number | null;
  } | null;
};

export type CustomTableMeasureOperation = 'mean' | 'sum';

export type CustomTableMeasure = {
  field: string;
  label: string;
  operation: CustomTableMeasureOperation;
  value: number | null;
  validCount: number;
  weightedValidCount?: number | null;
};

export type CustomTableCell = {
  rowValues: string[];
  columnValue: string | null;
  count: number;
  proportion: number;
  rowProportion: number | null;
  columnProportion: number | null;
  measures: CustomTableMeasure[];
};

export type CustomTableResult = {
  rowFields: string[];
  rowLabels: string[];
  columnField: string | null;
  columnLabel: string | null;
  measureFields: string[];
  caseCount: number;
  validCaseCount: number;
  missingCaseCount: number;
  weightedValidCaseCount?: number | null;
  rowCategories: Array<{ values: string[]; count: number; proportion: number }>;
  columnCategories: Array<{ value: string; count: number; proportion: number }>;
  cells: CustomTableCell[];
  notes: string[];
};

export type ExactTestResult = {
  rowField: string;
  rowLabel: string;
  columnField: string;
  columnLabel: string;
  caseCount: number;
  validCaseCount: number;
  table: {
    rowValues: string[];
    columnValues: string[];
    cells: Array<{ rowValue: string; columnValue: string; count: number }>;
  };
  method: 'fisher_exact_2x2' | 'chi_square_only';
  fisherExact?: {
    pValueTwoSided: number | null;
    pValueLeft: number | null;
    pValueRight: number | null;
    oddsRatio: number | null;
  } | null;
  chiSquare: DatasetCrosstab['chiSquare'];
  notes: string[];
};

export type BootstrapProcedure = 'mean' | 'correlation';

export type BootstrapResult = {
  procedure: BootstrapProcedure;
  targetFields: string[];
  iterationsRequested: number;
  iterationsUsed: number;
  confidenceLevel: number;
  caseCount: number;
  observed: number | null;
  standardError: number | null;
  confidenceInterval: ConfidenceInterval | null;
  estimates: number[];
  notes: string[];
};

export type MissingValueFieldSummary = {
  field: string;
  label: string;
  valueType: DatasetValueType;
  validCount: number;
  missingCount: number;
  missingPercent: number;
  weightedValidCount?: number | null;
  weightedMissingCount?: number | null;
  recommendedImputation: DatasetValue;
};

export type MissingValueRowPattern = {
  missingFieldCount: number;
  caseCount: number;
  proportion: number;
};

export type MissingValuesResult = {
  caseCount: number;
  fieldCount: number;
  totalMissingValues: number;
  missingCellsPercent: number;
  weightedCaseCount?: number | null;
  fields: MissingValueFieldSummary[];
  rowPatterns: MissingValueRowPattern[];
  notes: string[];
};

export type ImputationStrategy = {
  field: string;
  method: 'mean' | 'mode' | 'constant';
  value?: DatasetValue;
};

export type ImputationPlanResult = {
  caseCount: number;
  strategies: Array<{
    field: string;
    label: string;
    method: ImputationStrategy['method'];
    value: DatasetValue;
    replacements: number;
  }>;
  dataset: CaseDataset;
  notes: string[];
};

export type ForecastObservation = {
  caseId: string | null;
  timeValue: string | number;
  timeIndex: number;
  actual: number;
  fitted: number;
  residual: number;
};

export type ForecastPoint = {
  step: number;
  timeIndex: number;
  forecast: number;
  lower: number | null;
  upper: number | null;
};

export type ForecastResult = {
  timeField: string;
  timeLabel: string;
  valueField: string;
  valueLabel: string;
  method: 'linear_trend';
  caseCount: number;
  horizon: number;
  intercept: number;
  slope: number;
  metrics: {
    meanAbsoluteError: number | null;
    rootMeanSquaredError: number | null;
    rSquared: number | null;
  };
  observations: ForecastObservation[];
  forecast: ForecastPoint[];
  notes: string[];
};

export type ClusterAssignment = {
  caseId: string | null;
  caseLabel: string | null;
  cluster: number;
  distance: number;
};

export type ClusterSummary = {
  cluster: number;
  count: number;
  proportion: number;
  center: Record<string, number>;
};

export type ClusterAnalysisResult = {
  fields: string[];
  fieldLabels: string[];
  clusterCount: number;
  caseCount: number;
  iterations: number;
  clusters: ClusterSummary[];
  assignments: ClusterAssignment[];
  metrics: {
    totalWithinClusterSumSquares: number;
    averageSilhouette: number | null;
  };
  notes: string[];
};

export type DecisionTreeNode = {
  id: string;
  depth: number;
  prediction: string;
  count: number;
  distribution: Array<{ value: string; count: number; proportion: number }>;
  split: {
    field: string;
    label: string;
    operator: '<=' | 'in';
    value: number | string;
  } | null;
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
};

export type DecisionTreeResult = {
  targetField: string;
  targetLabel: string;
  predictorFields: string[];
  predictorLabels: string[];
  caseCount: number;
  maxDepth: number;
  tree: DecisionTreeNode;
  accuracy: number | null;
  confusionMatrix: Array<{
    actual: string;
    predicted: string;
    count: number;
  }>;
  notes: string[];
};

export type GeneralLinearModelCoefficient = RegressionCoefficient & {
  label: string;
  termType: 'intercept' | 'covariate' | 'factor';
  termField?: string;
};

export type GeneralLinearModelResult = {
  dependentField: string;
  dependentLabel: string;
  factorFields: string[];
  factorLabels: string[];
  covariateFields: string[];
  covariateLabels: string[];
  caseCount: number;
  designColumnCount: number;
  coefficients: GeneralLinearModelCoefficient[];
  metrics: {
    rSquared: number | null;
    adjustedRSquared: number | null;
    residualStdError: number | null;
    fStatistic: number | null;
    fPValue: number | null;
    modelDf: number;
    residualDf: number;
    sumSquaresModel: number | null;
    sumSquaresResidual: number | null;
    sumSquaresTotal: number | null;
  };
  terms: Array<{
    field: string;
    label: string;
    type: 'factor' | 'covariate';
    baseline?: string;
    levels?: string[];
  }>;
  assumptions: AssumptionCheck[];
  notes: string[];
};

export type RepeatedMeasureSummary = {
  field: string;
  label: string;
  count: number;
  mean: number;
  stdDev: number | null;
  min: number;
  max: number;
};

export type RepeatedMeasurePairwise = {
  leftField: string;
  leftLabel: string;
  rightField: string;
  rightLabel: string;
  count: number;
  meanDifference: number;
  stdDevDifference: number | null;
  tStatistic: number | null;
  degreesOfFreedom: number;
  pValue: number | null;
  confidenceInterval: ConfidenceInterval | null;
};

export type RepeatedMeasuresResult = {
  fields: string[];
  fieldLabels: string[];
  subjectCount: number;
  measureCount: number;
  summaries: RepeatedMeasureSummary[];
  pairwiseComparisons: RepeatedMeasurePairwise[];
  anova: {
    fStatistic: number | null;
    pValue: number | null;
    dfCondition: number;
    dfError: number;
    ssCondition: number;
    ssError: number;
    partialEtaSquared: number | null;
  } | null;
  assumptions: AssumptionCheck[];
  notes: string[];
};

export type SurvivalStep = {
  groupValue: string;
  time: number;
  atRisk: number;
  events: number;
  censored: number;
  survival: number;
};

export type SurvivalGroupSummary = {
  groupValue: string;
  caseCount: number;
  eventCount: number;
  censoredCount: number;
  medianSurvival: number | null;
  lastSurvival: number;
};

export type SurvivalAnalysisResult = {
  timeField: string;
  timeLabel: string;
  eventField: string;
  eventLabel: string;
  groupField: string | null;
  groupLabel: string | null;
  caseCount: number;
  groups: SurvivalGroupSummary[];
  steps: SurvivalStep[];
  notes: string[];
};

export type ComplexSampleEstimate = {
  domainValue: string;
  levelValue: string | null;
  statistic: 'mean' | 'proportion';
  count: number;
  weightedCount: number;
  estimate: number;
  standardError: number | null;
  confidenceInterval: ConfidenceInterval | null;
  strataCount: number | null;
  clusterCount: number | null;
  designEffect: number | null;
};

export type ComplexSampleResult = {
  targetField: string;
  targetLabel: string;
  groupField: string | null;
  groupLabel: string | null;
  strataField: string | null;
  strataLabel: string | null;
  clusterField: string | null;
  clusterLabel: string | null;
  weightField: string | null;
  caseCount: number;
  statistic: 'mean' | 'proportion';
  designSummary: {
    strataCount: number | null;
    clusterCount: number | null;
    domainCount: number;
    weightedCaseCount: number;
  };
  estimates: ComplexSampleEstimate[];
  notes: string[];
};

export type NeuralNetworkTask = 'regression' | 'classification';

export type NeuralNetworkPrediction = {
  caseId: string | null;
  caseLabel: string | null;
  actual: string | number;
  predicted: string | number;
  residual?: number | null;
};

export type NeuralNetworkResult = {
  targetField: string;
  targetLabel: string;
  predictorFields: string[];
  predictorLabels: string[];
  task: NeuralNetworkTask;
  caseCount: number;
  hiddenUnits: number;
  metrics: {
    accuracy?: number | null;
    rootMeanSquaredError?: number | null;
    meanAbsoluteError?: number | null;
    rSquared?: number | null;
  };
  featureImportance: Array<{
    field: string;
    label: string;
    importance: number;
  }>;
  classes?: string[];
  confusionMatrix?: Array<{
    actual: string;
    predicted: string;
    count: number;
  }>;
  predictions: NeuralNetworkPrediction[];
  notes: string[];
};

export type DatasetFilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'is_missing'
  | 'not_missing';

export type DatasetFilter = {
  fieldKey: string;
  operator: DatasetFilterOperator;
  value?: DatasetValue;
};

export type DatasetRecodeRule = {
  from: string;
  to: DatasetValue;
};

export type DatasetRecode = {
  sourceFieldKey: string;
  outputFieldKey?: string;
  outputLabel: string;
  rules: DatasetRecodeRule[];
  defaultValue?: DatasetValue;
};

export type RegressionModel = 'linear' | 'logistic';

export type RegressionCoefficient = {
  field: string;
  coefficient: number;
  standardError?: number | null;
  statistic?: number | null;
  pValue?: number | null;
  confidenceInterval?: ConfidenceInterval | null;
  oddsRatio?: number | null;
};

export type RegressionObservation = {
  caseId: string | null;
  caseLabel: string | null;
  actual: number;
  predicted: number;
  residual: number;
  standardizedResidual?: number | null;
  leverage?: number | null;
  cooksDistance?: number | null;
  devianceResidual?: number | null;
  predictedClass?: number | null;
  outlier: boolean;
};

export type RegressionResult = {
  model: RegressionModel;
  dependentField: string;
  predictorField: string;
  predictorFields: string[];
  caseCount: number;
  intercept: number;
  slope: number;
  coefficients: RegressionCoefficient[];
  metrics: Record<string, number | null>;
  diagnostics?: Record<string, number | null>;
  observations?: RegressionObservation[];
  assumptions?: AssumptionCheck[];
};

export type CorrelationResult = {
  xField: string;
  yField: string;
  caseCount: number;
  pearsonR: number;
  rSquared: number;
  covariance: number;
  xMean: number;
  yMean: number;
  xStdDev: number;
  yStdDev: number;
  slope: number;
  intercept: number;
  pValue?: number | null;
  confidenceInterval?: ConfidenceInterval | null;
};

export type CompareMeansGroupSummary = {
  groupValue: string;
  count: number;
  mean: number;
  stdDev: number | null;
  min: number;
  max: number;
};

export type CompareMeansPostHocComparison = {
  leftGroupValue: string;
  rightGroupValue: string;
  meanDifference: number | null;
  standardError: number | null;
  statistic: number | null;
  degreesOfFreedom: number | null;
  pValue: number | null;
  adjustedPValue: number | null;
  confidenceInterval?: ConfidenceInterval | null;
  effectSize?: number | null;
};

export type CompareMeansResult = {
  outcomeField: string;
  outcomeLabel: string;
  groupField: string;
  groupLabel: string;
  caseCount: number;
  validCaseCount: number;
  missingCaseCount: number;
  weightedValidCaseCount?: number | null;
  groups: CompareMeansGroupSummary[];
  anova: {
    fStatistic: number | null;
    dfBetween: number;
    dfWithin: number;
    pValue: number | null;
    ssBetween: number;
    ssWithin: number;
    msBetween: number | null;
    msWithin: number | null;
    etaSquared: number | null;
    omegaSquared: number | null;
  } | null;
  postHocComparisons?: CompareMeansPostHocComparison[];
  assumptions?: AssumptionCheck[];
};

export type TTestResult = {
  outcomeField: string;
  outcomeLabel: string;
  groupField: string;
  groupLabel: string;
  caseCount: number;
  validCaseCount: number;
  weightedValidCaseCount?: number | null;
  groups: Array<CompareMeansGroupSummary & { weightedCount?: number | null }>;
  statistic: number | null;
  degreesOfFreedom: number | null;
  pValue: number | null;
  meanDifference: number | null;
  cohensD: number | null;
  confidenceInterval?: ConfidenceInterval | null;
  assumptions?: AssumptionCheck[];
};

export type PairedTTestResult = {
  beforeField: string;
  beforeLabel: string;
  afterField: string;
  afterLabel: string;
  pairCount: number;
  weightedPairCount?: number | null;
  meanDifference: number | null;
  stdDevDifference: number | null;
  standardError: number | null;
  statistic: number | null;
  degreesOfFreedom: number | null;
  pValue: number | null;
  confidenceInterval?: ConfidenceInterval | null;
  cohensDz: number | null;
  correlation: number | null;
  assumptions?: AssumptionCheck[];
};

export type NonparametricTestResult = {
  method: 'mann_whitney_u' | 'kruskal_wallis';
  outcomeField: string;
  outcomeLabel: string;
  groupField: string;
  groupLabel: string;
  caseCount: number;
  validCaseCount: number;
  weightedValidCaseCount?: number | null;
  statistic: number;
  pValue: number | null;
  effectSize?: number | null;
  groups: Array<{
    groupValue: string;
    count: number;
    weightedCount?: number | null;
    meanRank: number;
  }>;
  notes: string[];
  assumptions?: AssumptionCheck[];
};

export type ReliabilityItemSummary = {
  field: string;
  label: string;
  mean: number | null;
  stdDev: number | null;
  itemTotalCorrelation: number | null;
  alphaIfDeleted: number | null;
};

export type ReliabilityResult = {
  fields: string[];
  fieldLabels: string[];
  caseCount: number;
  validCaseCount: number;
  alpha: number | null;
  standardizedAlpha: number | null;
  splitHalfCorrelation: number | null;
  spearmanBrown: number | null;
  scaleMean: number | null;
  scaleVariance: number | null;
  items: ReliabilityItemSummary[];
  subscales?: Array<{
    label: string;
    fields: string[];
    fieldLabels: string[];
    validCaseCount: number;
    alpha: number | null;
    standardizedAlpha: number | null;
    splitHalfCorrelation: number | null;
    spearmanBrown: number | null;
  }>;
  notes: string[];
};

export type FactorLoading = {
  field: string;
  label: string;
  loading: number;
  communality: number | null;
  uniqueness: number | null;
};

export type FactorSummary = {
  factor: number;
  eigenvalue: number;
  varianceExplained: number;
  cumulativeVarianceExplained: number;
  loadings: FactorLoading[];
};

export type FactorAnalysisResult = {
  fields: string[];
  fieldLabels: string[];
  caseCount: number;
  validCaseCount: number;
  factorCount: number;
  recommendedFactorCount: number;
  extraction: 'principal_components';
  rotation: 'none' | 'varimax';
  eigenvalues: number[];
  factors: FactorSummary[];
  correlationMatrix: Array<{ field: string; values: number[] }>;
  notes: string[];
};

export type CaseDataset = {
  caseCount: number;
  fields: DatasetField[];
  rows: DatasetRow[];
  notes: DatasetNote[];
};

export type TraceLinkValue = {
  variableId: string;
  caseId: string;
  supportingCodeApplicationIds?: string[];
};

export type BuildCaseDatasetInput = {
  cases: Pick<CaseEntity, 'id' | 'label' | 'sourceIds'>[];
  attributes: Pick<Attribute, 'targetType' | 'targetId' | 'name' | 'value'>[];
  variables: Pick<Variable, 'id' | 'name' | 'label' | 'kind' | 'sourceKind' | 'derivedFromCodeId' | 'derivationRule'>[];
  traceLinks: TraceLinkValue[];
};

const SYSTEM_FIELDS: Array<Omit<DatasetField, 'valueType'> & { valueType: DatasetValueType }> = [
  { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
  { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' }
];

function normalizeFieldKey(label: string): string {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'field';
}

function allocateFieldKey(baseLabel: string, used: Set<string>, fallbackPrefix: string): string {
  const base = normalizeFieldKey(baseLabel) || fallbackPrefix;
  let key = base;
  let counter = 2;
  while (used.has(key)) {
    key = `${base}_${counter++}`;
  }
  used.add(key);
  return key;
}

function inferValueType(values: DatasetValue[]): DatasetValueType {
  const kinds = new Set(values.filter((value) => value !== null).map((value) => typeof value));
  if (kinds.size === 0) return 'null';
  if (kinds.size > 1) return 'mixed';
  const [kind] = [...kinds];
  if (kind === 'string' || kind === 'number' || kind === 'boolean') return kind;
  return 'mixed';
}

function formatValue(value: DatasetValue): string {
  if (value === null) return 'Missing';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function aggregateSourceAttributeValues(values: DatasetValue[]): DatasetValue {
  if (values.length === 0) return null;
  const distinct = new Map(values.map((value) => [JSON.stringify(value), value]));
  if (distinct.size === 1) {
    return distinct.values().next().value as DatasetValue;
  }
  return [...distinct.values()].map((value) => formatValue(value)).join(' | ');
}

function materializeDerivedCodeValue(variable: BuildCaseDatasetInput['variables'][number], supportCount: number): DatasetValue {
  if (variable.kind === 'binary') return supportCount > 0 ? 1 : 0;
  if (variable.kind === 'continuous') return supportCount;
  if (variable.kind === 'categorical') return supportCount === 0 ? 'none' : supportCount === 1 ? 'single' : 'multiple';
  return supportCount > 0 ? 'present' : null;
}

function getDerivedVariableValueType(variable: BuildCaseDatasetInput['variables'][number]): DatasetValueType {
  if (variable.kind === 'binary' || variable.kind === 'continuous') return 'number';
  if (variable.kind === 'categorical' || variable.kind === 'text') return 'string';
  return 'null';
}

export function buildCaseDataset(input: BuildCaseDatasetInput): CaseDataset {
  const usedKeys = new Set<string>(SYSTEM_FIELDS.map((field) => field.key));
  const notes: DatasetNote[] = [];
  const fields: DatasetField[] = [...SYSTEM_FIELDS];

  const caseAttributeNames = [...new Set(
    input.attributes
      .filter((attribute) => attribute.targetType === 'case')
      .map((attribute) => attribute.name)
  )].sort((left, right) => left.localeCompare(right));

  const sourceAttributeNames = [...new Set(
    input.attributes
      .filter((attribute) => attribute.targetType === 'source')
      .map((attribute) => attribute.name)
  )].sort((left, right) => left.localeCompare(right));

  const supportedVariables = input.variables.filter((variable) =>
    variable.sourceKind === 'derived_code'
    && (variable.kind === 'binary' || variable.kind === 'continuous' || variable.kind === 'categorical')
  );
  const unsupportedVariables = input.variables.filter((variable) =>
    !(variable.sourceKind === 'derived_code'
      && (variable.kind === 'binary' || variable.kind === 'continuous' || variable.kind === 'categorical'))
  );

  for (const variable of unsupportedVariables) {
    notes.push({
      level: 'info',
      message: `${variable.label} is a ${variable.kind} ${variable.sourceKind} variable and is not yet materialized into the case-level dataset.`
    });
  }

  const caseAttributeKeys = new Map<string, string>();
  for (const name of caseAttributeNames) {
    const key = allocateFieldKey(name, usedKeys, 'case_attribute');
    caseAttributeKeys.set(name, key);
    fields.push({ key, label: name, source: 'attribute', valueType: 'null' });
  }

  const sourceAttributeKeys = new Map<string, string>();
  for (const name of sourceAttributeNames) {
    const key = allocateFieldKey(`${name}_source`, usedKeys, 'source_attribute');
    sourceAttributeKeys.set(name, key);
    fields.push({ key, label: `${name} (source)`, source: 'attribute', valueType: 'null' });
  }

  const variableKeys = new Map<string, string>();
  for (const variable of supportedVariables) {
    const key = allocateFieldKey(variable.name, usedKeys, 'variable');
    variableKeys.set(variable.id, key);
    fields.push({ key, label: variable.label, source: 'variable', valueType: getDerivedVariableValueType(variable) });
  }

  const caseAttributesByCase = new Map<string, Map<string, DatasetValue>>();
  const sourceAttributesBySource = new Map<string, Map<string, DatasetValue>>();

  for (const attribute of input.attributes) {
    if (attribute.targetType === 'case') {
      const byName = caseAttributesByCase.get(attribute.targetId) ?? new Map<string, DatasetValue>();
      byName.set(attribute.name, attribute.value);
      caseAttributesByCase.set(attribute.targetId, byName);
    }
    if (attribute.targetType === 'source') {
      const byName = sourceAttributesBySource.get(attribute.targetId) ?? new Map<string, DatasetValue>();
      byName.set(attribute.name, attribute.value);
      sourceAttributesBySource.set(attribute.targetId, byName);
    }
  }

  const traceLinkLookup = new Map(input.traceLinks.map((traceLink) => [
    `${traceLink.variableId}::${traceLink.caseId}`,
    traceLink.supportingCodeApplicationIds?.length ?? 0
  ]));

  const rows = input.cases.map((caseEntity) => {
    const row: DatasetRow = {
      case_id: caseEntity.id,
      case_label: caseEntity.label
    };

    const caseAttributes = caseAttributesByCase.get(caseEntity.id) ?? new Map<string, DatasetValue>();
    for (const [name, key] of caseAttributeKeys.entries()) {
      row[key] = caseAttributes.get(name) ?? null;
    }

    for (const [name, key] of sourceAttributeKeys.entries()) {
      const values = caseEntity.sourceIds
        .map((sourceId) => sourceAttributesBySource.get(sourceId)?.get(name))
        .filter((value): value is DatasetValue => value !== undefined);
      row[key] = aggregateSourceAttributeValues(values);
    }

    for (const variable of supportedVariables) {
      const key = variableKeys.get(variable.id);
      if (!key) continue;
      const supportCount = traceLinkLookup.get(`${variable.id}::${caseEntity.id}`) ?? 0;
      row[key] = materializeDerivedCodeValue(variable, supportCount);
    }

    return row;
  });

  const fieldValueTypes = new Map<string, DatasetValueType>();
  for (const field of fields) {
    fieldValueTypes.set(field.key, inferValueType(rows.map((row) => row[field.key] ?? null)));
  }

  return {
    caseCount: input.cases.length,
    fields: fields.map((field) => ({
      ...field,
      valueType: fieldValueTypes.get(field.key) ?? field.valueType
    })),
    rows,
    notes
  };
}

export function countWhere(
  rows: DatasetRow[],
  field: string,
  value: DatasetValue
): number {
  return rows.filter((row) => row[field] === value).length;
}

export function proportionWhere(
  rows: DatasetRow[],
  field: string,
  value: DatasetValue
): number {
  if (rows.length === 0) return 0;
  return countWhere(rows, field, value) / rows.length;
}

function summarizeNumeric(values: number[]): NumericSummary | null {
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return {
    mean: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    stdDev: sampleStdDev(values)
  };
}

function sampleStdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance = values.reduce((total, value) => total + ((value - mean) ** 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function normalizeAnalysisOptions(options?: DatasetAnalysisOptions): Required<DatasetAnalysisOptions> {
  return {
    weightField: typeof options?.weightField === 'string' && options.weightField.trim()
      ? options.weightField.trim()
      : '',
    missingValues: (options?.missingValues ?? [])
      .map((value) => value.trim())
      .filter(Boolean),
    missingStrategy: options?.missingStrategy === 'listwise' ? 'listwise' : 'available'
  };
}

function normalizeMissingValue(rawValue: DatasetValue, missingValues: string[]): DatasetValue {
  if (rawValue === null) return null;
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (trimmed.length === 0) return null;
    if (missingValues.some((candidate) => candidate.toLowerCase() === trimmed.toLowerCase())) {
      return null;
    }
    return rawValue;
  }
  return rawValue;
}

function normalizeDatasetForAnalysis(dataset: CaseDataset, options?: DatasetAnalysisOptions): CaseDataset {
  const normalizedOptions = normalizeAnalysisOptions(options);
  const rows = dataset.rows.map((row) => {
    const copy: DatasetRow = { ...row };
    for (const key of Object.keys(copy)) {
      copy[key] = normalizeMissingValue(copy[key] ?? null, normalizedOptions.missingValues);
    }
    return copy;
  });

  return {
    ...dataset,
    rows,
    notes: normalizedOptions.missingValues.length > 0
      ? [
        ...dataset.notes,
        {
          level: 'info',
          message: `Treating ${normalizedOptions.missingValues.length} custom missing code${normalizedOptions.missingValues.length === 1 ? '' : 's'} as missing values.`
        }
      ]
      : dataset.notes
  };
}

function getRowWeight(row: DatasetRow, weightField: string): number {
  if (!weightField) return 1;
  const value = row[weightField];
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function getWeightTotal(rows: DatasetRow[], weightField: string): number {
  return rows.reduce((total, row) => total + getRowWeight(row, weightField), 0);
}

function weightedMean(values: number[], weights: number[]): number | null {
  const totalWeight = weights.reduce((total, value) => total + value, 0);
  if (values.length === 0 || totalWeight <= 0) return null;
  return values.reduce((total, value, index) => total + (value * weights[index]!), 0) / totalWeight;
}

function weightedVariance(values: number[], weights: number[]): number | null {
  const mean = weightedMean(values, weights);
  const totalWeight = weights.reduce((total, value) => total + value, 0);
  if (mean === null || values.length < 2 || totalWeight <= 0) return null;
  const variance = values.reduce((total, value, index) => total + (weights[index]! * ((value - mean) ** 2)), 0) / totalWeight;
  return variance;
}

function weightedStdDev(values: number[], weights: number[]): number | null {
  const variance = weightedVariance(values, weights);
  return variance === null ? null : Math.sqrt(variance);
}

function effectiveSampleSize(weights: number[]): number {
  const sumWeights = weights.reduce((total, value) => total + value, 0);
  const sumSquares = weights.reduce((total, value) => total + (value ** 2), 0);
  if (sumWeights <= 0 || sumSquares <= 0) return 0;
  return (sumWeights ** 2) / sumSquares;
}

function analysisRows(
  dataset: CaseDataset,
  requiredFields: string[],
  options?: DatasetAnalysisOptions
): Array<{ row: DatasetRow; weight: number }> {
  const normalizedOptions = normalizeAnalysisOptions(options);
  const normalized = normalizeDatasetForAnalysis(dataset, normalizedOptions);
  const required = new Set([
    ...requiredFields,
    normalizedOptions.weightField
  ].filter(Boolean));

  return normalized.rows
    .filter((row) => {
      if (normalizedOptions.missingStrategy !== 'listwise') return true;
      return [...required].every((field) => row[field] !== null);
    })
    .map((row) => ({
      row,
      weight: getRowWeight(row, normalizedOptions.weightField)
    }));
}

function normalCdf(value: number): number {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

function erf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-(x ** 2));
  return sign * y;
}

function normalTwoSidedPValue(zScore: number): number {
  return 2 * (1 - normalCdf(Math.abs(zScore)));
}

function rankValues(values: number[]): number[] {
  const indexed = values.map((value, index) => ({ value, index })).sort((left, right) => left.value - right.value);
  const ranks = new Array<number>(values.length);
  let position = 0;
  while (position < indexed.length) {
    let end = position + 1;
    while (end < indexed.length && indexed[end]!.value === indexed[position]!.value) {
      end += 1;
    }
    const averageRank = (position + 1 + end) / 2;
    for (let cursor = position; cursor < end; cursor += 1) {
      ranks[indexed[cursor]!.index] = averageRank;
    }
    position = end;
  }
  return ranks;
}

function solveLinearSystem(matrix: number[][], vector: number[]): number[] {
  const size = matrix.length;
  const augmented = matrix.map((row, index) => [...row, vector[index] ?? 0]);

  for (let pivot = 0; pivot < size; pivot += 1) {
    let maxRow = pivot;
    for (let candidate = pivot + 1; candidate < size; candidate += 1) {
      if (Math.abs(augmented[candidate]![pivot]!) > Math.abs(augmented[maxRow]![pivot]!)) {
        maxRow = candidate;
      }
    }
    if (Math.abs(augmented[maxRow]![pivot]!) < 1e-12) {
      throw new Error('Regression design matrix is singular.');
    }
    if (maxRow !== pivot) {
      [augmented[pivot], augmented[maxRow]] = [augmented[maxRow]!, augmented[pivot]!];
    }

    const pivotValue = augmented[pivot]![pivot]!;
    for (let column = pivot; column <= size; column += 1) {
      augmented[pivot]![column] /= pivotValue;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === pivot) continue;
      const factor = augmented[row]![pivot]!;
      for (let column = pivot; column <= size; column += 1) {
        augmented[row]![column] -= factor * augmented[pivot]![column]!;
      }
    }
  }

  return augmented.map((row) => row[size]!);
}

function invertMatrix(matrix: number[][]): number[][] {
  const size = matrix.length;
  const augmented = matrix.map((row, rowIndex) => [
    ...row,
    ...Array.from({ length: size }, (_unused, columnIndex) => (rowIndex === columnIndex ? 1 : 0))
  ]);

  for (let pivot = 0; pivot < size; pivot += 1) {
    let maxRow = pivot;
    for (let candidate = pivot + 1; candidate < size; candidate += 1) {
      if (Math.abs(augmented[candidate]![pivot]!) > Math.abs(augmented[maxRow]![pivot]!)) {
        maxRow = candidate;
      }
    }
    if (Math.abs(augmented[maxRow]![pivot]!) < 1e-12) {
      throw new Error('Matrix is singular and cannot be inverted.');
    }
    if (maxRow !== pivot) {
      [augmented[pivot], augmented[maxRow]] = [augmented[maxRow]!, augmented[pivot]!];
    }

    const pivotValue = augmented[pivot]![pivot]!;
    for (let column = 0; column < size * 2; column += 1) {
      augmented[pivot]![column] /= pivotValue;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === pivot) continue;
      const factor = augmented[row]![pivot]!;
      for (let column = 0; column < size * 2; column += 1) {
        augmented[row]![column] -= factor * augmented[pivot]![column]!;
      }
    }
  }

  return augmented.map((row) => row.slice(size));
}

function logGamma(value: number): number {
  const coefficients = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.001208650973866179,
    -0.000005395239384953
  ];
  let x = value;
  let y = value;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let series = 1.000000000190015;
  for (const coefficient of coefficients) {
    y += 1;
    series += coefficient / y;
  }
  return -tmp + Math.log(2.5066282746310005 * series / x);
}

function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

function betaContinuedFraction(a: number, b: number, x: number): number {
  const maxIterations = 200;
  const epsilon = 3e-7;
  const fpMin = 1e-30;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpMin) d = fpMin;
  d = 1 / d;
  let h = d;
  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const m2 = 2 * iteration;
    let aa = (iteration * (b - iteration) * x) / ((qam + m2) * (a + m2));
    d = 1 + (aa * d);
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1 + (aa / c);
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    h *= d * c;
    aa = -((a + iteration) * (qab + iteration) * x) / ((a + m2) * (qap + m2));
    d = 1 + (aa * d);
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1 + (aa / c);
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  return h;
}

function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp((a * Math.log(x)) + (b * Math.log(1 - x)) - logBeta(a, b)) / a;
  if (x < (a + 1) / (a + b + 2)) {
    return front * betaContinuedFraction(a, b, x);
  }
  return 1 - (Math.exp((b * Math.log(1 - x)) + (a * Math.log(x)) - logBeta(b, a)) / b) * betaContinuedFraction(b, a, 1 - x);
}

function regularizedGammaP(shape: number, value: number): number {
  if (value <= 0) return 0;
  if (value < shape + 1) {
    let ap = shape;
    let sum = 1 / shape;
    let del = sum;
    for (let iteration = 0; iteration < 100; iteration += 1) {
      ap += 1;
      del *= value / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-8) {
        return sum * Math.exp(-value + shape * Math.log(value) - logGamma(shape));
      }
    }
  }

  let b = value + 1 - shape;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let iteration = 1; iteration < 100; iteration += 1) {
    const an = -iteration * (iteration - shape);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-8) {
      return 1 - Math.exp(-value + shape * Math.log(value) - logGamma(shape)) * h;
    }
  }
  return 1;
}

function chiSquarePValue(statistic: number, degreesOfFreedom: number): number | null {
  if (!(degreesOfFreedom > 0) || statistic < 0) return null;
  return 1 - regularizedGammaP(degreesOfFreedom / 2, statistic / 2);
}

function pearsonCorrelation(valuesA: number[], valuesB: number[]): number | null {
  if (valuesA.length !== valuesB.length || valuesA.length < 2) return null;
  const meanA = valuesA.reduce((total, value) => total + value, 0) / valuesA.length;
  const meanB = valuesB.reduce((total, value) => total + value, 0) / valuesB.length;
  let numerator = 0;
  let ssA = 0;
  let ssB = 0;
  for (let index = 0; index < valuesA.length; index += 1) {
    const deltaA = valuesA[index]! - meanA;
    const deltaB = valuesB[index]! - meanB;
    numerator += deltaA * deltaB;
    ssA += deltaA * deltaA;
    ssB += deltaB * deltaB;
  }
  if (ssA <= 0 || ssB <= 0) return null;
  return numerator / Math.sqrt(ssA * ssB);
}

function dotProduct(left: number[], right: number[]): number {
  return left.reduce((total, value, index) => total + (value * right[index]!), 0);
}

function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => dotProduct(row, vector));
}

function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((total, value) => total + (value * value), 0));
  if (!(magnitude > 0)) return vector.map(() => 0);
  return vector.map((value) => value / magnitude);
}

function cloneMatrix(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row]);
}

function outerProduct(vector: number[], scale: number): number[][] {
  return vector.map((left) => vector.map((right) => left * right * scale));
}

function deflateMatrix(matrix: number[][], component: number[][]): number[][] {
  return matrix.map((row, rowIndex) =>
    row.map((value, columnIndex) => value - component[rowIndex]![columnIndex]!)
  );
}

function powerIterationSymmetric(matrix: number[][], iterations = 100): { eigenvalue: number; eigenvector: number[] } {
  const size = matrix.length;
  let vector = normalizeVector(Array.from({ length: size }, (_, index) => 1 / Math.sqrt(size) + (index * 1e-4)));
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next = multiplyMatrixVector(matrix, vector);
    const normalized = normalizeVector(next);
    const delta = normalized.reduce((total, value, index) => total + Math.abs(value - vector[index]!), 0);
    vector = normalized;
    if (delta < 1e-8) break;
  }
  const projected = multiplyMatrixVector(matrix, vector);
  const eigenvalue = dotProduct(vector, projected);
  return { eigenvalue, eigenvector: vector };
}

function computeDurbinWatson(values: number[]): number | null {
  if (values.length < 2) return null;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]!;
    denominator += value * value;
    if (index > 0) {
      const delta = value - values[index - 1]!;
      numerator += delta * delta;
    }
  }
  return denominator > 0 ? numerator / denominator : null;
}

function computeRocAuc(probabilities: number[], outcomes: number[], weights?: number[]): number | null {
  const positive: Array<{ probability: number; weight: number }> = [];
  const negative: Array<{ probability: number; weight: number }> = [];
  for (let index = 0; index < probabilities.length; index += 1) {
    const entry = {
      probability: probabilities[index]!,
      weight: weights?.[index] ?? 1
    };
    if (outcomes[index] === 1) positive.push(entry);
    else negative.push(entry);
  }
  if (positive.length === 0 || negative.length === 0) return null;
  let concordant = 0;
  let ties = 0;
  let totalWeight = 0;
  for (const left of positive) {
    for (const right of negative) {
      const pairWeight = left.weight * right.weight;
      totalWeight += pairWeight;
      if (left.probability > right.probability) concordant += pairWeight;
      else if (left.probability === right.probability) ties += pairWeight;
    }
  }
  return totalWeight > 0 ? (concordant + (0.5 * ties)) / totalWeight : null;
}

function computeVifByPredictor(rows: Array<{ x: number[]; weight: number }>, predictorFields: string[]): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  if (predictorFields.length <= 1) {
    for (const field of predictorFields) result[field] = null;
    return result;
  }

  for (let predictorIndex = 0; predictorIndex < predictorFields.length; predictorIndex += 1) {
    const dependent = rows.map((row) => row.x[predictorIndex]!);
    const otherIndexes = predictorFields.map((_, index) => index).filter((index) => index !== predictorIndex);
    const designMatrix = rows.map((row) => [1, ...otherIndexes.map((index) => row.x[index]!)]);
    const xtwx = Array.from({ length: designMatrix[0]!.length }, () => Array.from({ length: designMatrix[0]!.length }, () => 0));
    const xtwy = Array.from({ length: designMatrix[0]!.length }, () => 0);
    for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
      const vector = designMatrix[rowIndex]!;
      const y = dependent[rowIndex]!;
      const weight = rows[rowIndex]!.weight;
      for (let i = 0; i < vector.length; i += 1) {
        xtwy[i] += vector[i]! * y * weight;
        for (let j = 0; j < vector.length; j += 1) {
          xtwx[i]![j] += vector[i]! * vector[j]! * weight;
        }
      }
    }
    const coefficients = solveLinearSystem(xtwx, xtwy);
    const predictions = designMatrix.map((vector) => coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0));
    const totalWeight = rows.reduce((total, row) => total + row.weight, 0);
    const meanY = dependent.reduce((total, value, index) => total + (value * rows[index]!.weight), 0) / totalWeight;
    const ssTot = dependent.reduce((total, value, index) => total + (rows[index]!.weight * ((value - meanY) ** 2)), 0);
    const ssRes = dependent.reduce((total, value, index) => total + (rows[index]!.weight * ((value - predictions[index]!) ** 2)), 0);
    const rSquared = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
    result[predictorFields[predictorIndex]!] = rSquared >= 1 ? null : 1 / Math.max(1e-12, 1 - rSquared);
  }

  return result;
}

function varimaxObjective(loadings: number[][]): number {
  if (loadings.length === 0 || (loadings[0]?.length ?? 0) === 0) return 0;
  const rowCount = loadings.length;
  const factorCount = loadings[0]!.length;
  let score = 0;
  for (let factorIndex = 0; factorIndex < factorCount; factorIndex += 1) {
    const columnSquares = loadings.map((row) => (row[factorIndex]! ** 2));
    const meanSquare = columnSquares.reduce((total, value) => total + value, 0) / rowCount;
    const meanFourth = columnSquares.reduce((total, value) => total + (value ** 2), 0) / rowCount;
    score += meanFourth - (meanSquare ** 2);
  }
  return score;
}

function rotateFactorPair(loadings: number[][], leftIndex: number, rightIndex: number, angle: number): number[][] {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return loadings.map((row) => {
    const left = row[leftIndex] ?? 0;
    const right = row[rightIndex] ?? 0;
    const next = [...row];
    next[leftIndex] = (left * cosine) + (right * sine);
    next[rightIndex] = (-left * sine) + (right * cosine);
    return next;
  });
}

function applyVarimaxRotation(loadings: number[][]): number[][] {
  if (loadings.length === 0 || (loadings[0]?.length ?? 0) < 2) return loadings.map((row) => [...row]);
  let rotated = loadings.map((row) => [...row]);
  let bestScore = varimaxObjective(rotated);
  const factorCount = rotated[0]!.length;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    let improved = false;
    for (let leftIndex = 0; leftIndex < factorCount; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < factorCount; rightIndex += 1) {
        let bestPair = rotated;
        let bestPairScore = bestScore;
        for (let degree = -45; degree <= 45; degree += 1) {
          if (degree === 0) continue;
          const candidate = rotateFactorPair(rotated, leftIndex, rightIndex, degree * (Math.PI / 180));
          const candidateScore = varimaxObjective(candidate);
          if (candidateScore > bestPairScore + 1e-8) {
            bestPair = candidate;
            bestPairScore = candidateScore;
          }
        }
        if (bestPairScore > bestScore + 1e-8) {
          rotated = bestPair;
          bestScore = bestPairScore;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return rotated;
}

function fDistributionPValue(statistic: number, numeratorDf: number, denominatorDf: number): number | null {
  if (!(numeratorDf > 0) || !(denominatorDf > 0) || statistic < 0) return null;
  const x = (numeratorDf * statistic) / ((numeratorDf * statistic) + denominatorDf);
  return 1 - regularizedBeta(x, numeratorDf / 2, denominatorDf / 2);
}

function studentTPValue(statistic: number, degreesOfFreedom: number): number | null {
  if (!(degreesOfFreedom > 0)) return null;
  const absolute = Math.abs(statistic);
  if (!Number.isFinite(absolute)) return null;
  const x = degreesOfFreedom / (degreesOfFreedom + (absolute ** 2));
  return regularizedBeta(x, degreesOfFreedom / 2, 0.5);
}

function studentTCritical(confidenceLevel: number, degreesOfFreedom: number): number | null {
  if (!(degreesOfFreedom > 0) || !(confidenceLevel > 0 && confidenceLevel < 1)) return null;
  const alpha = 1 - confidenceLevel;
  let low = 0;
  let high = 20;
  while ((studentTPValue(high, degreesOfFreedom) ?? 0) > alpha && high < 1_000) {
    high *= 2;
  }
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const pValue = studentTPValue(mid, degreesOfFreedom) ?? 0;
    if (pValue > alpha) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

function confidenceInterval95(estimate: number, standardError: number | null, degreesOfFreedom: number | null): ConfidenceInterval | null {
  if (standardError === null || standardError <= 0 || degreesOfFreedom === null || degreesOfFreedom <= 0) return null;
  const critical = studentTCritical(0.95, degreesOfFreedom);
  if (critical === null) return null;
  const margin = critical * standardError;
  return {
    level: 0.95,
    lower: estimate - margin,
    upper: estimate + margin
  };
}

function buildAssumptionCheck(
  key: string,
  label: string,
  status: 'pass' | 'warn' | 'fail',
  value: number | string | boolean | null,
  message: string
): AssumptionCheck {
  return { key, label, status, value, message };
}

function skewness(values: number[]): number | null {
  if (values.length < 3) return null;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const sd = sampleStdDev(values);
  if (!sd || sd === 0) return null;
  const n = values.length;
  const thirdMoment = values.reduce((total, value) => total + (((value - mean) / sd) ** 3), 0);
  return (n / ((n - 1) * (n - 2))) * thirdMoment;
}

export function describeDataset(dataset: CaseDataset, options?: DatasetAnalysisOptions): DatasetDescriptives {
  const normalizedOptions = normalizeAnalysisOptions(options);
  const prepared = normalizeDatasetForAnalysis(dataset, normalizedOptions);
  const weightedCaseCount = getWeightTotal(prepared.rows, normalizedOptions.weightField);

  const summaries = prepared.fields.map((field) => {
    const values = prepared.rows.map((row) => row[field.key] ?? null);
    const validValues = values.filter((value): value is Exclude<DatasetValue, null> => value !== null);
    const valueType = inferValueType(values);
    const frequencies = new Map<string, number>();
    let weightedValidCount = 0;

    prepared.rows.forEach((row, index) => {
      const value = values[index];
      if (value === null) return;
      const formatted = formatValue(value);
      const weight = getRowWeight(row, normalizedOptions.weightField);
      frequencies.set(formatted, (frequencies.get(formatted) ?? 0) + weight);
      weightedValidCount += weight;
    });

    const weightedMissingCount = weightedCaseCount - weightedValidCount;
    const denominator = normalizedOptions.weightField ? weightedValidCount : prepared.caseCount;

    const numericEntries = prepared.rows
      .map((row) => ({ value: row[field.key] ?? null, weight: getRowWeight(row, normalizedOptions.weightField) }))
      .filter((entry): entry is { value: number; weight: number } => typeof entry.value === 'number' && entry.weight > 0);
    const numericValues = numericEntries.map((entry) => entry.value);
    const numericWeights = numericEntries.map((entry) => entry.weight);
    const weightedNumericMean = weightedMean(numericValues, numericWeights);
    const weightedNumericStdDev = weightedStdDev(numericValues, numericWeights);

    const numericSummary = numericValues.length > 0
      ? {
        mean: weightedNumericMean ?? 0,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        stdDev: normalizedOptions.weightField ? weightedNumericStdDev : sampleStdDev(numericValues)
      }
      : null;

    const frequencyList = [...frequencies.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([value, count]) => ({
        value,
        count,
        proportion: denominator <= 0 ? 0 : count / denominator
      }));

    return {
      key: field.key,
      label: field.label,
      source: field.source,
      valueType,
      validCount: validValues.length,
      missingCount: prepared.caseCount - validValues.length,
      weightedValidCount: normalizedOptions.weightField ? weightedValidCount : null,
      weightedMissingCount: normalizedOptions.weightField ? weightedMissingCount : null,
      distinctCount: new Set(validValues.map((value) => JSON.stringify(value))).size,
      frequencies: frequencyList,
      numeric: numericSummary
    };
  });

  return {
    caseCount: prepared.caseCount,
    fieldCount: prepared.fields.length,
    summaries,
    weightedCaseCount: normalizedOptions.weightField ? weightedCaseCount : null,
    analysis: {
      weightField: normalizedOptions.weightField || null,
      missingValues: normalizedOptions.missingValues,
      missingStrategy: normalizedOptions.missingStrategy
    }
  };
}

function valuesEqual(left: DatasetValue, right: DatasetValue): boolean {
  if (left === null || right === null) return left === right;
  if (typeof left === 'number' && typeof right === 'number') return left === right;
  if (typeof left === 'boolean' && typeof right === 'boolean') return left === right;
  return formatValue(left) === formatValue(right);
}

function filterMatches(rowValue: DatasetValue, filter: DatasetFilter): boolean {
  switch (filter.operator) {
    case 'equals':
      return valuesEqual(rowValue, filter.value ?? null);
    case 'not_equals':
      return !valuesEqual(rowValue, filter.value ?? null);
    case 'contains':
      return rowValue !== null && formatValue(rowValue).toLowerCase().includes(formatValue(filter.value ?? '').toLowerCase());
    case 'greater_than':
      return typeof rowValue === 'number' && typeof filter.value === 'number' && rowValue > filter.value;
    case 'less_than':
      return typeof rowValue === 'number' && typeof filter.value === 'number' && rowValue < filter.value;
    case 'is_missing':
      return rowValue === null;
    case 'not_missing':
      return rowValue !== null;
    default:
      return true;
  }
}

export function applyDatasetFilters(dataset: CaseDataset, filters: DatasetFilter[]): CaseDataset {
  if (filters.length === 0) return dataset;

  const rows = dataset.rows.filter((row) =>
    filters.every((filter) => filterMatches(row[filter.fieldKey] ?? null, filter))
  );

  return {
    caseCount: rows.length,
    fields: dataset.fields,
    rows,
    notes: [
      ...dataset.notes,
      {
        level: 'info',
        message: `Applied ${filters.length} dataset filter${filters.length === 1 ? '' : 's'}.`
      }
    ]
  };
}

export function applyDatasetRecodes(dataset: CaseDataset, recodes: DatasetRecode[]): CaseDataset {
  if (recodes.length === 0) return dataset;

  const usedKeys = new Set(dataset.fields.map((field) => field.key));
  const rows = dataset.rows.map((row) => ({ ...row }));
  const fields = [...dataset.fields];

  for (const recode of recodes) {
    const sourceField = fields.find((field) => field.key === recode.sourceFieldKey);
    if (!sourceField) {
      throw new Error(`Source field "${recode.sourceFieldKey}" was not found for recode.`);
    }

    const outputFieldKey = recode.outputFieldKey && recode.outputFieldKey.trim()
      ? allocateFieldKey(recode.outputFieldKey, usedKeys, 'recode')
      : allocateFieldKey(recode.outputLabel, usedKeys, 'recode');

    fields.push({
      key: outputFieldKey,
      label: recode.outputLabel,
      source: 'variable',
      valueType: 'null'
    });

    for (const row of rows) {
      const sourceValue = row[recode.sourceFieldKey] ?? null;
      const formatted = formatValue(sourceValue);
      const rule = recode.rules.find((candidate) => candidate.from === formatted);
      row[outputFieldKey] = rule ? rule.to : recode.defaultValue ?? null;
    }
  }

  const fieldValueTypes = new Map<string, DatasetValueType>();
  for (const field of fields) {
    fieldValueTypes.set(field.key, inferValueType(rows.map((row) => row[field.key] ?? null)));
  }

  return {
    caseCount: rows.length,
    fields: fields.map((field) => ({
      ...field,
      valueType: fieldValueTypes.get(field.key) ?? field.valueType
    })),
    rows,
    notes: [
      ...dataset.notes,
      {
        level: 'info',
        message: `Added ${recodes.length} recoded field${recodes.length === 1 ? '' : 's'} to the dataset view.`
      }
    ]
  };
}

export function transformDataset(
  dataset: CaseDataset,
  options: {
    filters?: DatasetFilter[];
    recodes?: DatasetRecode[];
    analysis?: DatasetAnalysisOptions;
  }
): CaseDataset {
  const normalized = normalizeDatasetForAnalysis(dataset, options.analysis);
  const filtered = applyDatasetFilters(normalized, options.filters ?? []);
  return applyDatasetRecodes(filtered, options.recodes ?? []);
}

function requireDatasetField(dataset: CaseDataset, fieldKey: string, purpose: string): DatasetField {
  const field = dataset.fields.find((candidate) => candidate.key === fieldKey);
  if (!field) {
    throw new Error(`Selected ${purpose} field "${fieldKey}" was not found in the dataset.`);
  }
  return field;
}

function mostCommonValue(values: DatasetValue[]): DatasetValue {
  const counts = new Map<string, { value: DatasetValue; count: number }>();
  for (const value of values) {
    if (value === null) continue;
    const key = JSON.stringify(value);
    const entry = counts.get(key) ?? { value, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  const [top] = [...counts.values()].sort((left, right) =>
    right.count - left.count || formatValue(left.value).localeCompare(formatValue(right.value))
  );
  return top?.value ?? null;
}

function percentile(sortedValues: number[], proportion: number): number | null {
  if (sortedValues.length === 0) return null;
  if (sortedValues.length === 1) return sortedValues[0]!;
  const bounded = Math.min(1, Math.max(0, proportion));
  const position = bounded * (sortedValues.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  if (lowerIndex === upperIndex) return sortedValues[lowerIndex]!;
  const lower = sortedValues[lowerIndex]!;
  const upper = sortedValues[upperIndex]!;
  return lower + ((upper - lower) * (position - lowerIndex));
}

function seededRandom(seed = 8675309): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function buildCustomTable(
  dataset: CaseDataset,
  rowFields: string[],
  columnField?: string | null,
  measureFields: string[] = [],
  options?: DatasetAnalysisOptions
): CustomTableResult {
  const uniqueRowFields = [...new Set(rowFields.map((field) => field.trim()).filter(Boolean))].slice(0, 3);
  if (uniqueRowFields.length === 0) {
    throw new Error('Choose at least one row field for a custom table.');
  }
  const normalizedColumnField = typeof columnField === 'string' && columnField.trim() ? columnField.trim() : null;
  const uniqueMeasureFields = [...new Set(measureFields.map((field) => field.trim()).filter(Boolean))].slice(0, 5);
  const rowMeta = uniqueRowFields.map((field) => requireDatasetField(dataset, field, 'custom table row'));
  const columnMeta = normalizedColumnField ? requireDatasetField(dataset, normalizedColumnField, 'custom table column') : null;
  const measureMeta = uniqueMeasureFields.map((field) => requireDatasetField(dataset, field, 'custom table measure'));

  const requiredFields = [...uniqueRowFields, ...(normalizedColumnField ? [normalizedColumnField] : [])];
  const preparedRows = analysisRows(dataset, requiredFields, options);
  const validRows = preparedRows.filter(({ row, weight }) =>
    weight > 0
    && uniqueRowFields.every((field) => row[field] !== null)
    && (!normalizedColumnField || row[normalizedColumnField] !== null)
  );

  const rowCounts = new Map<string, { values: string[]; count: number }>();
  const columnCounts = new Map<string, number>();
  const cells = new Map<string, {
    rowValues: string[];
    columnValue: string | null;
    count: number;
    measures: Map<string, { field: string; label: string; values: number[]; weights: number[] }>;
  }>();

  for (const { row, weight } of validRows) {
    const rowValues = uniqueRowFields.map((field) => formatValue(row[field] ?? null));
    const rowKey = JSON.stringify(rowValues);
    const columnValue = normalizedColumnField ? formatValue(row[normalizedColumnField] ?? null) : null;
    const cellKey = `${rowKey}::${columnValue ?? '(total)'}`;
    const rowEntry = rowCounts.get(rowKey) ?? { values: rowValues, count: 0 };
    rowEntry.count += weight;
    rowCounts.set(rowKey, rowEntry);
    if (columnValue !== null) {
      columnCounts.set(columnValue, (columnCounts.get(columnValue) ?? 0) + weight);
    }

    const cellEntry = cells.get(cellKey) ?? {
      rowValues,
      columnValue,
      count: 0,
      measures: new Map<string, { field: string; label: string; values: number[]; weights: number[] }>()
    };
    cellEntry.count += weight;
    for (const field of measureMeta) {
      const value = row[field.key];
      if (typeof value !== 'number') continue;
      const measureEntry = cellEntry.measures.get(field.key) ?? {
        field: field.key,
        label: field.label,
        values: [],
        weights: []
      };
      measureEntry.values.push(value);
      measureEntry.weights.push(weight);
      cellEntry.measures.set(field.key, measureEntry);
    }
    cells.set(cellKey, cellEntry);
  }

  const weightedValidCaseCount = validRows.reduce((total, entry) => total + entry.weight, 0);
  const rowCategories = [...rowCounts.values()]
    .sort((left, right) => right.count - left.count || left.values.join(' | ').localeCompare(right.values.join(' | ')))
    .map((entry) => ({
      values: entry.values,
      count: entry.count,
      proportion: weightedValidCaseCount > 0 ? entry.count / weightedValidCaseCount : 0
    }));
  const columnCategories = [...columnCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([value, count]) => ({
      value,
      count,
      proportion: weightedValidCaseCount > 0 ? count / weightedValidCaseCount : 0
    }));

  return {
    rowFields: uniqueRowFields,
    rowLabels: rowMeta.map((field) => field.label),
    columnField: columnMeta?.key ?? null,
    columnLabel: columnMeta?.label ?? null,
    measureFields: measureMeta.map((field) => field.key),
    caseCount: dataset.caseCount,
    validCaseCount: validRows.length,
    missingCaseCount: dataset.caseCount - validRows.length,
    weightedValidCaseCount: normalizeAnalysisOptions(options).weightField ? weightedValidCaseCount : null,
    rowCategories,
    columnCategories,
    cells: [...cells.values()].map((cell) => {
      const rowCount = rowCounts.get(JSON.stringify(cell.rowValues))?.count ?? 0;
      const columnCount = cell.columnValue === null ? weightedValidCaseCount : columnCounts.get(cell.columnValue) ?? 0;
      const measures = [...cell.measures.values()].flatMap((measure) => {
        const mean = weightedMean(measure.values, measure.weights);
        const sum = measure.values.reduce((total, value, index) => total + (value * measure.weights[index]!), 0);
        return [
          {
            field: measure.field,
            label: measure.label,
            operation: 'mean' as const,
            value: mean,
            validCount: measure.values.length,
            weightedValidCount: normalizeAnalysisOptions(options).weightField
              ? measure.weights.reduce((total, value) => total + value, 0)
              : null
          },
          {
            field: measure.field,
            label: measure.label,
            operation: 'sum' as const,
            value: sum,
            validCount: measure.values.length,
            weightedValidCount: normalizeAnalysisOptions(options).weightField
              ? measure.weights.reduce((total, value) => total + value, 0)
              : null
          }
        ];
      });
      return {
        rowValues: cell.rowValues,
        columnValue: cell.columnValue,
        count: cell.count,
        proportion: weightedValidCaseCount > 0 ? cell.count / weightedValidCaseCount : 0,
        rowProportion: rowCount > 0 ? cell.count / rowCount : null,
        columnProportion: columnCount > 0 ? cell.count / columnCount : null,
        measures
      };
    }),
    notes: [
      'Custom tables are grouped case-level summaries with counts, proportions, and optional numeric mean/sum measures.',
      measureMeta.some((field) => field.valueType !== 'number')
        ? 'Non-numeric measure fields are accepted but only numeric values contribute to measure statistics.'
        : ''
    ].filter(Boolean)
  };
}

function isIntegerLike(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value - Math.round(value)) < 1e-8;
}

function hypergeometricProbability(a: number, row1: number, row2: number, column1: number, total: number): number {
  const column2 = total - column1;
  return Math.exp(
    logGamma(column1 + 1)
    - logGamma(a + 1)
    - logGamma(column1 - a + 1)
    + logGamma(column2 + 1)
    - logGamma(row1 - a + 1)
    - logGamma(column2 - row1 + a + 1)
    - logGamma(total + 1)
    + logGamma(row1 + 1)
    + logGamma(total - row1 + 1)
  );
}

export function analyzeExactTest(
  dataset: CaseDataset,
  rowFieldKey: string,
  columnFieldKey: string,
  options?: DatasetAnalysisOptions
): ExactTestResult {
  const crosstab = analyzeCrosstab(dataset, rowFieldKey, columnFieldKey, options);
  const notes: string[] = [];
  const rowValues = crosstab.rowCategories.map((entry) => entry.value);
  const columnValues = crosstab.columnCategories.map((entry) => entry.value);
  let fisherExact: ExactTestResult['fisherExact'] = null;
  let method: ExactTestResult['method'] = 'chi_square_only';

  if (rowValues.length === 2 && columnValues.length === 2) {
    const counts = rowValues.map((rowValue) =>
      columnValues.map((columnValue) =>
        crosstab.cells.find((cell) => cell.rowValue === rowValue && cell.columnValue === columnValue)?.count ?? 0
      )
    );
    const flatCounts = counts.flat();
    if (flatCounts.every(isIntegerLike)) {
      const a = Math.round(counts[0]![0]!);
      const b = Math.round(counts[0]![1]!);
      const c = Math.round(counts[1]![0]!);
      const d = Math.round(counts[1]![1]!);
      const row1 = a + b;
      const row2 = c + d;
      const column1 = a + c;
      const total = row1 + row2;
      const minA = Math.max(0, column1 - row2);
      const maxA = Math.min(row1, column1);
      const observedProbability = hypergeometricProbability(a, row1, row2, column1, total);
      let pLeft = 0;
      let pRight = 0;
      let pTwo = 0;
      for (let candidate = minA; candidate <= maxA; candidate += 1) {
        const probability = hypergeometricProbability(candidate, row1, row2, column1, total);
        if (candidate <= a) pLeft += probability;
        if (candidate >= a) pRight += probability;
        if (probability <= observedProbability + 1e-12) pTwo += probability;
      }
      fisherExact = {
        pValueTwoSided: Math.min(1, pTwo),
        pValueLeft: Math.min(1, pLeft),
        pValueRight: Math.min(1, pRight),
        oddsRatio: b * c === 0 ? null : (a * d) / (b * c)
      };
      method = 'fisher_exact_2x2';
    } else {
      notes.push('Fisher exact test requires integer-like counts. Weighted or fractional tables use the chi-square output only.');
    }
  } else {
    notes.push('Fisher exact test is currently available for 2x2 crosstabs. Larger tables report the chi-square output only.');
  }

  return {
    rowField: crosstab.rowField,
    rowLabel: crosstab.rowLabel,
    columnField: crosstab.columnField,
    columnLabel: crosstab.columnLabel,
    caseCount: crosstab.caseCount,
    validCaseCount: crosstab.validCaseCount,
    table: {
      rowValues,
      columnValues,
      cells: crosstab.cells.map((cell) => ({
        rowValue: cell.rowValue,
        columnValue: cell.columnValue,
        count: cell.count
      }))
    },
    method,
    fisherExact,
    chiSquare: crosstab.chiSquare,
    notes
  };
}

export function analyzeBootstrap(
  dataset: CaseDataset,
  procedure: BootstrapProcedure,
  targetFields: string[],
  iterations = 1000,
  confidenceLevel = 0.95,
  options?: DatasetAnalysisOptions
): BootstrapResult {
  const normalizedIterations = Math.min(10000, Math.max(100, Math.floor(iterations)));
  const normalizedConfidence = Math.min(0.99, Math.max(0.8, confidenceLevel));
  const fields = targetFields.map((field) => field.trim()).filter(Boolean);
  const requiredFieldCount = procedure === 'correlation' ? 2 : 1;
  if (fields.length < requiredFieldCount) {
    throw new Error(`${procedure} bootstrap requires ${requiredFieldCount} target field${requiredFieldCount === 1 ? '' : 's'}.`);
  }
  fields.slice(0, requiredFieldCount).forEach((field) => requireDatasetField(dataset, field, 'bootstrap target'));
  const rows = analysisRows(dataset, fields.slice(0, requiredFieldCount), options)
    .map(({ row, weight }) => ({
      values: fields.slice(0, requiredFieldCount).map((field) => row[field]),
      weight
    }))
    .filter((entry): entry is { values: number[]; weight: number } =>
      entry.weight > 0 && entry.values.every((value) => typeof value === 'number')
    );
  if (rows.length < 2) {
    throw new Error('Not enough usable numeric rows for bootstrapping.');
  }

  const computeEstimate = (sample: Array<{ values: number[]; weight: number }>): number | null => {
    if (procedure === 'mean') {
      return weightedMean(sample.map((entry) => entry.values[0]!), sample.map((entry) => entry.weight));
    }
    return pearsonCorrelation(sample.map((entry) => entry.values[0]!), sample.map((entry) => entry.values[1]!));
  };

  const observed = computeEstimate(rows);
  const random = seededRandom(rows.length * 97 + normalizedIterations);
  const estimates: number[] = [];
  for (let iteration = 0; iteration < normalizedIterations; iteration += 1) {
    const sample = Array.from({ length: rows.length }, () => rows[Math.floor(random() * rows.length)]!);
    const estimate = computeEstimate(sample);
    if (estimate !== null && Number.isFinite(estimate)) estimates.push(estimate);
  }
  const sorted = [...estimates].sort((left, right) => left - right);
  const alpha = 1 - normalizedConfidence;
  const lower = percentile(sorted, alpha / 2);
  const upper = percentile(sorted, 1 - (alpha / 2));
  const standardError = sampleStdDev(estimates);

  return {
    procedure,
    targetFields: fields.slice(0, requiredFieldCount),
    iterationsRequested: normalizedIterations,
    iterationsUsed: estimates.length,
    confidenceLevel: normalizedConfidence,
    caseCount: rows.length,
    observed,
    standardError,
    confidenceInterval: lower === null || upper === null
      ? null
      : { level: normalizedConfidence, lower, upper },
    estimates: estimates.slice(0, 250),
    notes: [
      'Bootstrap output uses deterministic seeded resampling for reproducible pilot results.',
      procedure === 'correlation' && normalizeAnalysisOptions(options).weightField
        ? 'Correlation bootstrap currently resamples usable rows and does not compute a weighted correlation coefficient.'
        : ''
    ].filter(Boolean)
  };
}

export function analyzeMissingValues(dataset: CaseDataset, options?: DatasetAnalysisOptions): MissingValuesResult {
  const normalizedOptions = normalizeAnalysisOptions(options);
  const prepared = normalizeDatasetForAnalysis(dataset, options);
  const weightedCaseCount = getWeightTotal(prepared.rows, normalizedOptions.weightField);
  let totalMissingValues = 0;
  const rowPatternCounts = new Map<number, number>();

  const fields = prepared.fields.map((field) => {
    let validCount = 0;
    let missingCount = 0;
    let weightedValidCount = 0;
    let weightedMissingCount = 0;
    const values: DatasetValue[] = [];
    for (const row of prepared.rows) {
      const value = row[field.key] ?? null;
      const weight = getRowWeight(row, normalizedOptions.weightField);
      if (value === null) {
        missingCount += 1;
        weightedMissingCount += weight;
      } else {
        validCount += 1;
        weightedValidCount += weight;
        values.push(value);
      }
    }
    totalMissingValues += missingCount;
    const numericValues = values.filter((value): value is number => typeof value === 'number');
    return {
      field: field.key,
      label: field.label,
      valueType: inferValueType(prepared.rows.map((row) => row[field.key] ?? null)),
      validCount,
      missingCount,
      missingPercent: prepared.caseCount > 0 ? missingCount / prepared.caseCount : 0,
      weightedValidCount: normalizedOptions.weightField ? weightedValidCount : null,
      weightedMissingCount: normalizedOptions.weightField ? weightedMissingCount : null,
      recommendedImputation: numericValues.length > 0
        ? numericValues.reduce((total, value) => total + value, 0) / numericValues.length
        : mostCommonValue(values)
    };
  });

  for (const row of prepared.rows) {
    const missingFieldCount = prepared.fields.filter((field) => (row[field.key] ?? null) === null).length;
    rowPatternCounts.set(missingFieldCount, (rowPatternCounts.get(missingFieldCount) ?? 0) + 1);
  }

  return {
    caseCount: prepared.caseCount,
    fieldCount: prepared.fields.length,
    totalMissingValues,
    missingCellsPercent: prepared.caseCount * prepared.fields.length > 0
      ? totalMissingValues / (prepared.caseCount * prepared.fields.length)
      : 0,
    weightedCaseCount: normalizedOptions.weightField ? weightedCaseCount : null,
    fields: fields.sort((left, right) => right.missingPercent - left.missingPercent || left.label.localeCompare(right.label)),
    rowPatterns: [...rowPatternCounts.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([missingFieldCount, caseCount]) => ({
        missingFieldCount,
        caseCount,
        proportion: prepared.caseCount > 0 ? caseCount / prepared.caseCount : 0
      })),
    notes: [
      'Missing-values output treats blank values, nulls, and configured user-missing codes as missing.',
      'Recommended imputations are simple mean for numeric fields and mode for categorical/text fields.'
    ]
  };
}

export function buildImputationPlan(
  dataset: CaseDataset,
  strategies: ImputationStrategy[],
  options?: DatasetAnalysisOptions
): ImputationPlanResult {
  const prepared = normalizeDatasetForAnalysis(dataset, options);
  const missing = analyzeMissingValues(prepared, options);
  const recommendedByField = new Map(missing.fields.map((field) => [field.field, field.recommendedImputation]));
  const strategyList = strategies
    .map((strategy) => ({
      field: strategy.field.trim(),
      method: strategy.method,
      value: strategy.value
    }))
    .filter((strategy) => strategy.field);
  if (strategyList.length === 0) {
    throw new Error('Choose at least one field imputation strategy.');
  }

  const rows = prepared.rows.map((row) => ({ ...row }));
  const applied: ImputationPlanResult['strategies'] = [];
  for (const strategy of strategyList) {
    const field = requireDatasetField(prepared, strategy.field, 'imputation');
    const fieldValues = rows.map((row) => row[field.key] ?? null);
    const numericValues = fieldValues.filter((value): value is number => typeof value === 'number');
    const nonMissingValues = fieldValues.filter((value): value is Exclude<DatasetValue, null> => value !== null);
    const value = strategy.method === 'constant'
      ? strategy.value ?? null
      : strategy.method === 'mean'
        ? (numericValues.length > 0 ? numericValues.reduce((total, item) => total + item, 0) / numericValues.length : recommendedByField.get(field.key) ?? null)
        : (mostCommonValue(nonMissingValues) ?? recommendedByField.get(field.key) ?? null);
    let replacements = 0;
    for (const row of rows) {
      if ((row[field.key] ?? null) === null) {
        row[field.key] = value;
        replacements += 1;
      }
    }
    applied.push({
      field: field.key,
      label: field.label,
      method: strategy.method,
      value,
      replacements
    });
  }

  const fieldValueTypes = new Map<string, DatasetValueType>();
  for (const field of prepared.fields) {
    fieldValueTypes.set(field.key, inferValueType(rows.map((row) => row[field.key] ?? null)));
  }

  return {
    caseCount: prepared.caseCount,
    strategies: applied,
    dataset: {
      ...prepared,
      fields: prepared.fields.map((field) => ({
        ...field,
        valueType: fieldValueTypes.get(field.key) ?? field.valueType
      })),
      rows,
      notes: [
        ...prepared.notes,
        {
          level: 'info',
          message: `Applied ${applied.length} imputation strateg${applied.length === 1 ? 'y' : 'ies'} to a preview dataset.`
        }
      ]
    },
    notes: [
      'Imputation currently creates a preview dataset; it does not overwrite stored project cases or attributes.',
      'Use this as a traceable preprocessing step before formal analysis.'
    ]
  };
}

function parseTimeValue(value: DatasetValue, fallbackIndex: number): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return Number.isFinite(fallbackIndex) ? fallbackIndex : null;
}

export function analyzeForecast(
  dataset: CaseDataset,
  timeFieldKey: string,
  valueFieldKey: string,
  horizon = 3,
  options?: DatasetAnalysisOptions
): ForecastResult {
  if (timeFieldKey === valueFieldKey) {
    throw new Error('Choose different time and value fields for forecasting.');
  }
  const timeField = requireDatasetField(dataset, timeFieldKey, 'forecast time');
  const valueField = requireDatasetField(dataset, valueFieldKey, 'forecast value');
  const rows = analysisRows(dataset, [timeFieldKey, valueFieldKey], options)
    .map(({ row }, index) => ({
      caseId: typeof row.case_id === 'string' ? row.case_id : null,
      timeValue: row[timeFieldKey] ?? null,
      timeIndex: parseTimeValue(row[timeFieldKey] ?? null, index),
      actual: row[valueFieldKey]
    }))
    .filter((entry): entry is { caseId: string | null; timeValue: DatasetValue; timeIndex: number; actual: number } =>
      entry.timeIndex !== null && typeof entry.actual === 'number'
    )
    .sort((left, right) => left.timeIndex - right.timeIndex);

  if (rows.length < 3) {
    throw new Error('Forecasting requires at least three usable time/value rows.');
  }

  const firstTimeIndex = rows[0]!.timeIndex;
  const normalizedTimes = rows.map((row) => row.timeIndex - firstTimeIndex);
  const values = rows.map((row) => row.actual);
  const timeMean = normalizedTimes.reduce((total, value) => total + value, 0) / normalizedTimes.length;
  const valueMean = values.reduce((total, value) => total + value, 0) / values.length;
  const ssTime = normalizedTimes.reduce((total, value) => total + ((value - timeMean) ** 2), 0);
  const covariance = normalizedTimes.reduce((total, value, index) => total + ((value - timeMean) * (values[index]! - valueMean)), 0);
  const slope = ssTime > 0 ? covariance / ssTime : 0;
  const intercept = valueMean - (slope * timeMean);
  const fitted = normalizedTimes.map((value) => intercept + (slope * value));
  const residuals = values.map((value, index) => value - fitted[index]!);
  const mae = residuals.reduce((total, value) => total + Math.abs(value), 0) / residuals.length;
  const rmse = Math.sqrt(residuals.reduce((total, value) => total + (value ** 2), 0) / residuals.length);
  const ssTotal = values.reduce((total, value) => total + ((value - valueMean) ** 2), 0);
  const ssResidual = residuals.reduce((total, value) => total + (value ** 2), 0);
  const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : null;
  const normalizedHorizon = Math.min(24, Math.max(1, Math.floor(horizon)));
  const sortedGaps = rows.slice(1).map((row, index) => row.timeIndex - rows[index]!.timeIndex).filter((value) => value > 0);
  const typicalGap = sortedGaps.length > 0
    ? sortedGaps.sort((left, right) => left - right)[Math.floor(sortedGaps.length / 2)]!
    : 1;
  const lastTime = rows[rows.length - 1]!.timeIndex;
  const residualStdDev = sampleStdDev(residuals) ?? 0;
  const critical = 1.96;

  return {
    timeField: timeField.key,
    timeLabel: timeField.label,
    valueField: valueField.key,
    valueLabel: valueField.label,
    method: 'linear_trend',
    caseCount: rows.length,
    horizon: normalizedHorizon,
    intercept,
    slope,
    metrics: {
      meanAbsoluteError: mae,
      rootMeanSquaredError: rmse,
      rSquared
    },
    observations: rows.map((row, index) => ({
      caseId: row.caseId,
      timeValue: typeof row.timeValue === 'number' ? row.timeValue : formatValue(row.timeValue),
      timeIndex: row.timeIndex,
      actual: row.actual,
      fitted: fitted[index]!,
      residual: residuals[index]!
    })),
    forecast: Array.from({ length: normalizedHorizon }, (_unused, index) => {
      const timeIndex = lastTime + (typicalGap * (index + 1));
      const normalizedTime = timeIndex - firstTimeIndex;
      const forecast = intercept + (slope * normalizedTime);
      const margin = residualStdDev > 0 ? critical * residualStdDev : 0;
      return {
        step: index + 1,
        timeIndex,
        forecast,
        lower: margin > 0 ? forecast - margin : null,
        upper: margin > 0 ? forecast + margin : null
      };
    }),
    notes: [
      'Forecasting is a first-pass linear trend procedure for pilot planning, not a full ARIMA/exponential-smoothing module.',
      'Date-like time fields are internally converted to timestamps before fitting.'
    ]
  };
}

function euclideanDistance(left: number[], right: number[]): number {
  return Math.sqrt(left.reduce((total, value, index) => total + ((value - right[index]!) ** 2), 0));
}

function meanVector(points: number[][], size: number): number[] {
  if (points.length === 0) return new Array<number>(size).fill(0);
  return Array.from({ length: size }, (_unused, index) =>
    points.reduce((total, point) => total + point[index]!, 0) / points.length
  );
}

export function analyzeClusterAnalysis(
  dataset: CaseDataset,
  fields: string[],
  requestedClusterCount = 3,
  options?: DatasetAnalysisOptions
): ClusterAnalysisResult {
  const uniqueFields = [...new Set(fields.map((field) => field.trim()).filter(Boolean))];
  if (uniqueFields.length < 2) {
    throw new Error('Choose at least two numeric fields for cluster analysis.');
  }
  const fieldMeta = uniqueFields.map((field) => requireDatasetField(dataset, field, 'cluster'));
  const rows = analysisRows(dataset, uniqueFields, options)
    .map(({ row }) => ({
      caseId: typeof row.case_id === 'string' ? row.case_id : null,
      caseLabel: typeof row.case_label === 'string' ? row.case_label : null,
      values: uniqueFields.map((field) => row[field])
    }))
    .filter((entry): entry is { caseId: string | null; caseLabel: string | null; values: number[] } =>
      entry.values.every((value) => typeof value === 'number')
    );
  if (rows.length < 2) {
    throw new Error('Not enough usable numeric rows for cluster analysis.');
  }
  const clusterCount = Math.min(Math.max(2, Math.floor(requestedClusterCount)), Math.min(8, rows.length));
  const means = uniqueFields.map((_field, fieldIndex) => rows.reduce((total, row) => total + row.values[fieldIndex]!, 0) / rows.length);
  const stdDevs = uniqueFields.map((_field, fieldIndex) => sampleStdDev(rows.map((row) => row.values[fieldIndex]!)) || 1);
  const standardized = rows.map((row) => row.values.map((value, index) => (value - means[index]!) / stdDevs[index]!));
  let centroids = Array.from({ length: clusterCount }, (_unused, index) => standardized[Math.floor(index * standardized.length / clusterCount)]!.slice());
  let assignments = new Array<number>(rows.length).fill(0);
  let iterations = 0;
  for (; iterations < 100; iterations += 1) {
    let changed = false;
    assignments = standardized.map((point, rowIndex) => {
      const distances = centroids.map((centroid) => euclideanDistance(point, centroid));
      const nearest = distances.indexOf(Math.min(...distances));
      if (nearest !== assignments[rowIndex]) changed = true;
      return nearest;
    });
    centroids = centroids.map((centroid, clusterIndex) => {
      const points = standardized.filter((_point, rowIndex) => assignments[rowIndex] === clusterIndex);
      return points.length > 0 ? meanVector(points, uniqueFields.length) : centroid;
    });
    if (!changed && iterations > 0) break;
  }
  const totalWithinClusterSumSquares = standardized.reduce((total, point, index) => {
    const centroid = centroids[assignments[index]!]!;
    const distance = euclideanDistance(point, centroid);
    return total + (distance ** 2);
  }, 0);
  const silhouetteValues = standardized.map((point, index) => {
    const cluster = assignments[index]!;
    const sameCluster = standardized.filter((_candidate, candidateIndex) => assignments[candidateIndex] === cluster && candidateIndex !== index);
    const a = sameCluster.length > 0
      ? sameCluster.reduce((total, candidate) => total + euclideanDistance(point, candidate), 0) / sameCluster.length
      : 0;
    const otherDistances = centroids
      .map((_centroid, clusterIndex) => {
        if (clusterIndex === cluster) return null;
        const points = standardized.filter((_candidate, candidateIndex) => assignments[candidateIndex] === clusterIndex);
        if (points.length === 0) return null;
        return points.reduce((total, candidate) => total + euclideanDistance(point, candidate), 0) / points.length;
      })
      .filter((value): value is number => value !== null);
    const b = otherDistances.length > 0 ? Math.min(...otherDistances) : 0;
    return Math.max(a, b) > 0 ? (b - a) / Math.max(a, b) : null;
  }).filter((value): value is number => value !== null);

  return {
    fields: uniqueFields,
    fieldLabels: fieldMeta.map((field) => field.label),
    clusterCount,
    caseCount: rows.length,
    iterations: iterations + 1,
    clusters: centroids.map((centroid, index) => {
      const members = rows.filter((_row, rowIndex) => assignments[rowIndex] === index);
      const originalCenter = Object.fromEntries(uniqueFields.map((field, fieldIndex) => [
        field,
        (centroid[fieldIndex]! * stdDevs[fieldIndex]!) + means[fieldIndex]!
      ]));
      return {
        cluster: index + 1,
        count: members.length,
        proportion: rows.length > 0 ? members.length / rows.length : 0,
        center: originalCenter
      };
    }),
    assignments: rows.map((row, index) => ({
      caseId: row.caseId,
      caseLabel: row.caseLabel,
      cluster: assignments[index]! + 1,
      distance: euclideanDistance(standardized[index]!, centroids[assignments[index]!]!)
    })).slice(0, 100),
    metrics: {
      totalWithinClusterSumSquares,
      averageSilhouette: silhouetteValues.length > 0
        ? silhouetteValues.reduce((total, value) => total + value, 0) / silhouetteValues.length
        : null
    },
    notes: [
      'Cluster analysis uses deterministic k-means over standardized numeric fields.',
      'Assignments are previewed for the first 100 usable cases.'
    ]
  };
}

type TreeRow = {
  target: string;
  predictors: Record<string, DatasetValue>;
};

function giniImpurity(rows: TreeRow[]): number {
  if (rows.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.target, (counts.get(row.target) ?? 0) + 1);
  return 1 - [...counts.values()].reduce((total, count) => {
    const proportion = count / rows.length;
    return total + (proportion ** 2);
  }, 0);
}

function targetDistribution(rows: TreeRow[]): Array<{ value: string; count: number; proportion: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.target, (counts.get(row.target) ?? 0) + 1);
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([value, count]) => ({ value, count, proportion: rows.length > 0 ? count / rows.length : 0 }));
}

function bestTreeSplit(rows: TreeRow[], predictorFields: string[], fieldLabels: Map<string, string>) {
  const parentImpurity = giniImpurity(rows);
  let best: {
    field: string;
    label: string;
    operator: '<=' | 'in';
    value: number | string;
    leftRows: TreeRow[];
    rightRows: TreeRow[];
    gain: number;
  } | null = null;

  for (const field of predictorFields) {
    const values = rows.map((row) => row.predictors[field]).filter((value) => value !== null);
    const numericValues = values.filter((value): value is number => typeof value === 'number').sort((left, right) => left - right);
    const candidates: Array<{ operator: '<=' | 'in'; value: number | string }> = [];
    if (numericValues.length >= 2) {
      for (let index = 1; index < numericValues.length; index += 1) {
        if (numericValues[index] !== numericValues[index - 1]) {
          candidates.push({ operator: '<=', value: (numericValues[index]! + numericValues[index - 1]!) / 2 });
        }
      }
    } else {
      const distinct = [...new Set(values.map((value) => formatValue(value)))].slice(0, 12);
      distinct.forEach((value) => candidates.push({ operator: 'in', value }));
    }

    for (const candidate of candidates) {
      const leftRows = rows.filter((row) => {
        const value = row.predictors[field] ?? null;
        return candidate.operator === '<='
          ? typeof value === 'number' && value <= Number(candidate.value)
          : formatValue(value) === candidate.value;
      });
      const rightRows = rows.filter((row) => !leftRows.includes(row));
      if (leftRows.length === 0 || rightRows.length === 0) continue;
      const weightedImpurity = ((leftRows.length / rows.length) * giniImpurity(leftRows))
        + ((rightRows.length / rows.length) * giniImpurity(rightRows));
      const gain = parentImpurity - weightedImpurity;
      if (!best || gain > best.gain) {
        best = {
          field,
          label: fieldLabels.get(field) ?? field,
          operator: candidate.operator,
          value: candidate.value,
          leftRows,
          rightRows,
          gain
        };
      }
    }
  }

  return best;
}

function buildTreeNode(
  rows: TreeRow[],
  predictorFields: string[],
  fieldLabels: Map<string, string>,
  depth: number,
  maxDepth: number,
  id: string
): DecisionTreeNode {
  const distribution = targetDistribution(rows);
  const prediction = distribution[0]?.value ?? 'Missing';
  if (depth >= maxDepth || rows.length < 4 || distribution.length <= 1) {
    return { id, depth, prediction, count: rows.length, distribution, split: null };
  }
  const split = bestTreeSplit(rows, predictorFields, fieldLabels);
  if (!split || split.gain <= 0) {
    return { id, depth, prediction, count: rows.length, distribution, split: null };
  }
  return {
    id,
    depth,
    prediction,
    count: rows.length,
    distribution,
    split: {
      field: split.field,
      label: split.label,
      operator: split.operator,
      value: split.value
    },
    left: buildTreeNode(split.leftRows, predictorFields, fieldLabels, depth + 1, maxDepth, `${id}L`),
    right: buildTreeNode(split.rightRows, predictorFields, fieldLabels, depth + 1, maxDepth, `${id}R`)
  };
}

function predictTree(node: DecisionTreeNode, row: TreeRow): string {
  if (!node.split || !node.left || !node.right) return node.prediction;
  const value = row.predictors[node.split.field] ?? null;
  const goLeft = node.split.operator === '<='
    ? typeof value === 'number' && value <= Number(node.split.value)
    : formatValue(value) === node.split.value;
  return predictTree(goLeft ? node.left : node.right, row);
}

export function analyzeDecisionTree(
  dataset: CaseDataset,
  targetFieldKey: string,
  predictorFields: string[],
  maxDepth = 3,
  options?: DatasetAnalysisOptions
): DecisionTreeResult {
  const uniquePredictors = [...new Set(predictorFields.map((field) => field.trim()).filter(Boolean))]
    .filter((field) => field !== targetFieldKey);
  if (uniquePredictors.length === 0) {
    throw new Error('Choose at least one predictor field for the decision tree.');
  }
  const targetField = requireDatasetField(dataset, targetFieldKey, 'decision-tree target');
  const predictorMeta = uniquePredictors.map((field) => requireDatasetField(dataset, field, 'decision-tree predictor'));
  const rows = analysisRows(dataset, [targetFieldKey, ...uniquePredictors], options)
    .map(({ row }) => ({
      target: row[targetFieldKey] === null || row[targetFieldKey] === undefined ? null : formatValue(row[targetFieldKey] ?? null),
      predictors: Object.fromEntries(uniquePredictors.map((field) => [field, row[field] ?? null])) as Record<string, DatasetValue>
    }))
    .filter((entry): entry is TreeRow => entry.target !== null);
  if (rows.length < 4) {
    throw new Error('Decision tree requires at least four usable rows with a target value.');
  }
  const normalizedMaxDepth = Math.min(6, Math.max(1, Math.floor(maxDepth)));
  const fieldLabels = new Map(predictorMeta.map((field) => [field.key, field.label]));
  const tree = buildTreeNode(rows, uniquePredictors, fieldLabels, 0, normalizedMaxDepth, 'N');
  const predictions = rows.map((row) => ({ actual: row.target, predicted: predictTree(tree, row) }));
  const correct = predictions.filter((entry) => entry.actual === entry.predicted).length;
  const confusionCounts = new Map<string, number>();
  for (const entry of predictions) {
    const key = `${entry.actual}::${entry.predicted}`;
    confusionCounts.set(key, (confusionCounts.get(key) ?? 0) + 1);
  }

  return {
    targetField: targetField.key,
    targetLabel: targetField.label,
    predictorFields: uniquePredictors,
    predictorLabels: predictorMeta.map((field) => field.label),
    caseCount: rows.length,
    maxDepth: normalizedMaxDepth,
    tree,
    accuracy: rows.length > 0 ? correct / rows.length : null,
    confusionMatrix: [...confusionCounts.entries()].map(([key, count]) => {
      const [actual, predicted] = key.split('::');
      return { actual: actual ?? '', predicted: predicted ?? '', count };
    }),
    notes: [
      'Decision trees are first-pass classification trees using Gini impurity.',
      'The current output is intended for exploratory modeling and teaching, not audited production prediction.'
    ]
  };
}

function uniqueFormattedLevels(values: DatasetValue[]): string[] {
  return [...new Set(values
    .filter((value) => value !== null && value !== undefined)
    .map((value) => formatValue(value)))]
    .sort((left, right) => left.localeCompare(right));
}

export function analyzeGeneralLinearModel(
  dataset: CaseDataset,
  dependentFieldKey: string,
  factorFields: string[] = [],
  covariateFields: string[] = [],
  options?: DatasetAnalysisOptions
): GeneralLinearModelResult {
  const normalizedFactors = [...new Set(factorFields.map((field) => field.trim()).filter(Boolean))]
    .filter((field) => field !== dependentFieldKey);
  const normalizedCovariates = [...new Set(covariateFields.map((field) => field.trim()).filter(Boolean))]
    .filter((field) => field !== dependentFieldKey && !normalizedFactors.includes(field));
  if (normalizedFactors.length === 0 && normalizedCovariates.length === 0) {
    throw new Error('Choose at least one factor or covariate for GLM.');
  }

  const dependentField = requireDatasetField(dataset, dependentFieldKey, 'GLM dependent');
  const factorMeta = normalizedFactors.map((field) => requireDatasetField(dataset, field, 'GLM factor'));
  const covariateMeta = normalizedCovariates.map((field) => requireDatasetField(dataset, field, 'GLM covariate'));
  const requiredFields = [dependentFieldKey, ...normalizedFactors, ...normalizedCovariates];
  const rows = analysisRows(dataset, requiredFields, options)
    .map(({ row, weight }) => ({
      y: row[dependentFieldKey],
      factorValues: Object.fromEntries(normalizedFactors.map((field) => [field, row[field] ?? null])) as Record<string, DatasetValue>,
      covariateValues: Object.fromEntries(normalizedCovariates.map((field) => [field, row[field] ?? null])) as Record<string, DatasetValue>,
      weight
    }))
    .filter((entry): entry is {
      y: number;
      factorValues: Record<string, DatasetValue>;
      covariateValues: Record<string, DatasetValue>;
      weight: number;
    } =>
      typeof entry.y === 'number'
      && entry.weight > 0
      && normalizedFactors.every((field) => entry.factorValues[field] !== null && entry.factorValues[field] !== undefined)
      && normalizedCovariates.every((field) => typeof entry.covariateValues[field] === 'number')
    );

  const factorLevels = new Map<string, string[]>();
  for (const field of normalizedFactors) {
    const levels = uniqueFormattedLevels(rows.map((entry) => entry.factorValues[field] ?? null));
    if (levels.length < 2) {
      throw new Error(`GLM factor "${field}" needs at least two observed levels.`);
    }
    factorLevels.set(field, levels);
  }

  const columns: Array<{
    field: string;
    label: string;
    termType: 'intercept' | 'covariate' | 'factor';
    value: (entry: typeof rows[number]) => number;
    termField?: string;
  }> = [{
    field: '(Intercept)',
    label: 'Intercept',
    termType: 'intercept',
    value: () => 1
  }];

  for (const field of normalizedCovariates) {
    const meta = covariateMeta.find((candidate) => candidate.key === field);
    columns.push({
      field,
      label: meta?.label ?? field,
      termType: 'covariate',
      termField: field,
      value: (entry) => Number(entry.covariateValues[field])
    });
  }

  for (const field of normalizedFactors) {
    const meta = factorMeta.find((candidate) => candidate.key === field);
    const levels = factorLevels.get(field) ?? [];
    const baseline = levels[0]!;
    for (const level of levels.slice(1)) {
      columns.push({
        field: `${field}:${level}`,
        label: `${meta?.label ?? field} = ${level}`,
        termType: 'factor',
        termField: field,
        value: (entry) => formatValue(entry.factorValues[field] ?? null) === level ? 1 : 0
      });
    }
    if (levels.length === 1 && baseline) {
      // Kept for readability if a caller inspects the terms object after validation changes.
    }
  }

  if (rows.length <= columns.length) {
    throw new Error('GLM requires more usable rows than design columns.');
  }

  const xMatrix = rows.map((entry) => columns.map((column) => column.value(entry)));
  const yVector = rows.map((entry) => entry.y);
  const weights = rows.map((entry) => entry.weight);
  const xtwx = Array.from({ length: columns.length }, () => Array.from({ length: columns.length }, () => 0));
  const xtwy = Array.from({ length: columns.length }, () => 0);
  for (let rowIndex = 0; rowIndex < xMatrix.length; rowIndex += 1) {
    const vector = xMatrix[rowIndex]!;
    const y = yVector[rowIndex]!;
    const weight = weights[rowIndex]!;
    for (let i = 0; i < vector.length; i += 1) {
      xtwy[i] += vector[i]! * y * weight;
      for (let j = 0; j < vector.length; j += 1) {
        xtwx[i]![j] += vector[i]! * vector[j]! * weight;
      }
    }
  }

  const coefficients = solveLinearSystem(xtwx, xtwy);
  const predictions = xMatrix.map((vector) => coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0));
  const weightedCaseCount = weights.reduce((total, value) => total + value, 0);
  const yMean = yVector.reduce((total, value, index) => total + (value * weights[index]!), 0) / weightedCaseCount;
  const ssTotal = yVector.reduce((total, value, index) => total + (weights[index]! * ((value - yMean) ** 2)), 0);
  const ssResidual = yVector.reduce((total, value, index) => total + (weights[index]! * ((value - predictions[index]!) ** 2)), 0);
  const ssModel = Math.max(0, ssTotal - ssResidual);
  const modelDf = Math.max(0, columns.length - 1);
  const residualDf = Math.max(0, rows.length - columns.length);
  const meanSquareResidual = residualDf > 0 ? ssResidual / residualDf : null;
  const meanSquareModel = modelDf > 0 ? ssModel / modelDf : null;
  const fStatistic = meanSquareModel !== null && meanSquareResidual !== null && meanSquareResidual > 0
    ? meanSquareModel / meanSquareResidual
    : null;
  const rSquared = ssTotal === 0 ? 1 : 1 - (ssResidual / ssTotal);
  const adjustedRSquared = residualDf > 0 && rows.length > 1
    ? 1 - ((1 - rSquared) * ((rows.length - 1) / residualDf))
    : null;
  const covarianceMatrix = meanSquareResidual === null ? null : invertMatrix(xtwx).map((row) => row.map((value) => value * meanSquareResidual));

  return {
    dependentField: dependentField.key,
    dependentLabel: dependentField.label,
    factorFields: normalizedFactors,
    factorLabels: factorMeta.map((field) => field.label),
    covariateFields: normalizedCovariates,
    covariateLabels: covariateMeta.map((field) => field.label),
    caseCount: rows.length,
    designColumnCount: columns.length,
    coefficients: coefficients.map((coefficient, index) => {
      const column = columns[index]!;
      const standardError = covarianceMatrix ? Math.sqrt(Math.max(0, covarianceMatrix[index]![index]!)) : null;
      const statistic = standardError && standardError > 0 ? coefficient / standardError : null;
      const pValue = statistic === null ? null : studentTPValue(statistic, residualDf);
      return {
        field: column.field,
        label: column.label,
        termType: column.termType,
        termField: column.termField,
        coefficient,
        standardError,
        statistic,
        pValue,
        confidenceInterval: standardError === null ? null : confidenceInterval95(coefficient, standardError, residualDf),
        oddsRatio: null
      };
    }),
    metrics: {
      rSquared,
      adjustedRSquared,
      residualStdError: meanSquareResidual === null ? null : Math.sqrt(meanSquareResidual),
      fStatistic,
      fPValue: fStatistic === null || modelDf <= 0 || residualDf <= 0 ? null : fDistributionPValue(fStatistic, modelDf, residualDf),
      modelDf,
      residualDf,
      sumSquaresModel: ssModel,
      sumSquaresResidual: ssResidual,
      sumSquaresTotal: ssTotal
    },
    terms: [
      ...normalizedCovariates.map((field) => ({
        field,
        label: covariateMeta.find((candidate) => candidate.key === field)?.label ?? field,
        type: 'covariate' as const
      })),
      ...normalizedFactors.map((field) => {
        const levels = factorLevels.get(field) ?? [];
        return {
          field,
          label: factorMeta.find((candidate) => candidate.key === field)?.label ?? field,
          type: 'factor' as const,
          baseline: levels[0],
          levels
        };
      })
    ],
    assumptions: [
      buildAssumptionCheck('sample_size', 'Sample size', rows.length > columns.length ? 'pass' : 'fail', rows.length, 'GLM requires more usable rows than design columns.'),
      buildAssumptionCheck('design_rank', 'Design matrix rank', 'warn', columns.length, 'Categorical factors are dummy-coded with the first sorted level as the baseline.')
    ],
    notes: [
      'GLM/ANCOVA is a first-pass weighted least-squares implementation with categorical dummy coding.',
      'Use the coefficient table and omnibus F statistic as exploratory output until the full SPSS GLM workflow is expanded.'
    ]
  };
}

export function analyzeRepeatedMeasures(
  dataset: CaseDataset,
  fields: string[],
  options?: DatasetAnalysisOptions
): RepeatedMeasuresResult {
  const normalizedFields = [...new Set(fields.map((field) => field.trim()).filter(Boolean))];
  if (normalizedFields.length < 2) {
    throw new Error('Repeated-measures analysis requires at least two numeric measure fields.');
  }
  const meta = normalizedFields.map((field) => requireDatasetField(dataset, field, 'repeated-measures'));
  const rows = analysisRows(dataset, normalizedFields, options)
    .map(({ row }) => normalizedFields.map((field) => row[field]))
    .filter((values): values is number[] => values.every((value) => typeof value === 'number'));
  if (rows.length < 2) {
    throw new Error('Repeated-measures analysis requires at least two complete cases.');
  }

  const measureCount = normalizedFields.length;
  const summaries = normalizedFields.map((field, index) => {
    const values = rows.map((row) => row[index]!);
    return {
      field,
      label: meta[index]!.label,
      count: values.length,
      mean: values.reduce((total, value) => total + value, 0) / values.length,
      stdDev: sampleStdDev(values),
      min: Math.min(...values),
      max: Math.max(...values)
    };
  });

  const pairwiseComparisons: RepeatedMeasurePairwise[] = [];
  for (let left = 0; left < measureCount; left += 1) {
    for (let right = left + 1; right < measureCount; right += 1) {
      const differences = rows.map((row) => row[right]! - row[left]!);
      const meanDifference = differences.reduce((total, value) => total + value, 0) / differences.length;
      const stdDevDifference = sampleStdDev(differences);
      const df = differences.length - 1;
      const standardError = stdDevDifference === null ? null : stdDevDifference / Math.sqrt(differences.length);
      const tStatistic = standardError && standardError > 0 ? meanDifference / standardError : null;
      pairwiseComparisons.push({
        leftField: normalizedFields[left]!,
        leftLabel: meta[left]!.label,
        rightField: normalizedFields[right]!,
        rightLabel: meta[right]!.label,
        count: differences.length,
        meanDifference,
        stdDevDifference,
        tStatistic,
        degreesOfFreedom: df,
        pValue: tStatistic === null ? null : studentTPValue(tStatistic, df),
        confidenceInterval: standardError === null ? null : confidenceInterval95(meanDifference, standardError, df)
      });
    }
  }

  const allValues = rows.flat();
  const grandMean = allValues.reduce((total, value) => total + value, 0) / allValues.length;
  const subjectMeans = rows.map((row) => row.reduce((total, value) => total + value, 0) / row.length);
  const conditionMeans = summaries.map((summary) => summary.mean);
  const ssTotal = rows.reduce((total, row) => total + row.reduce((rowTotal, value) => rowTotal + ((value - grandMean) ** 2), 0), 0);
  const ssSubjects = subjectMeans.reduce((total, mean) => total + (measureCount * ((mean - grandMean) ** 2)), 0);
  const ssCondition = conditionMeans.reduce((total, mean) => total + (rows.length * ((mean - grandMean) ** 2)), 0);
  const ssError = Math.max(0, ssTotal - ssSubjects - ssCondition);
  const dfCondition = measureCount - 1;
  const dfError = (rows.length - 1) * (measureCount - 1);
  const msCondition = dfCondition > 0 ? ssCondition / dfCondition : null;
  const msError = dfError > 0 ? ssError / dfError : null;
  const fStatistic = msCondition !== null && msError !== null && msError > 0 ? msCondition / msError : null;

  return {
    fields: normalizedFields,
    fieldLabels: meta.map((field) => field.label),
    subjectCount: rows.length,
    measureCount,
    summaries,
    pairwiseComparisons,
    anova: {
      fStatistic,
      pValue: fStatistic === null ? null : fDistributionPValue(fStatistic, dfCondition, dfError),
      dfCondition,
      dfError,
      ssCondition,
      ssError,
      partialEtaSquared: (ssCondition + ssError) > 0 ? ssCondition / (ssCondition + ssError) : null
    },
    assumptions: [
      buildAssumptionCheck('complete_cases', 'Complete repeated cases', rows.length >= 2 ? 'pass' : 'fail', rows.length, 'Only rows with all selected repeated measures are included.'),
      buildAssumptionCheck('sphericity', 'Sphericity', 'warn', null, 'Mauchly/sphericity correction is not yet implemented; interpret omnibus F cautiously.')
    ],
    notes: [
      'Repeated-measures output uses complete cases across the selected measure fields.',
      'Pairwise rows are paired t-test style differences; omnibus output is a first-pass repeated-measures ANOVA summary.'
    ]
  };
}

function isSurvivalEvent(value: DatasetValue): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    if (['1', 'true', 'yes', 'y', 'event', 'dead', 'death', 'complete', 'completed', 'failed'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'censored', 'alive', 'withdrawn'].includes(normalized)) return false;
  }
  return false;
}

export function analyzeSurvivalAnalysis(
  dataset: CaseDataset,
  timeFieldKey: string,
  eventFieldKey: string,
  groupFieldKey?: string,
  options?: DatasetAnalysisOptions
): SurvivalAnalysisResult {
  if (timeFieldKey === eventFieldKey) {
    throw new Error('Choose different time and event fields for survival analysis.');
  }
  const timeField = requireDatasetField(dataset, timeFieldKey, 'survival time');
  const eventField = requireDatasetField(dataset, eventFieldKey, 'survival event');
  const normalizedGroupField = typeof groupFieldKey === 'string' && groupFieldKey.trim() && groupFieldKey !== timeFieldKey && groupFieldKey !== eventFieldKey
    ? groupFieldKey.trim()
    : '';
  const groupField = normalizedGroupField ? requireDatasetField(dataset, normalizedGroupField, 'survival group') : null;
  const requiredFields = [timeFieldKey, eventFieldKey, normalizedGroupField].filter(Boolean);
  const rows = analysisRows(dataset, requiredFields, options)
    .map(({ row }, index) => ({
      time: parseTimeValue(row[timeFieldKey] ?? null, index),
      event: isSurvivalEvent(row[eventFieldKey] ?? null),
      groupValue: groupField ? formatValue(row[normalizedGroupField] ?? null) : 'All cases'
    }))
    .filter((entry): entry is { time: number; event: boolean; groupValue: string } =>
      entry.time !== null && Number.isFinite(entry.time) && entry.time >= 0 && Boolean(entry.groupValue)
    );

  if (rows.length < 2) {
    throw new Error('Kaplan-Meier survival analysis requires at least two usable time/event rows.');
  }

  const groupValues = [...new Set(rows.map((row) => row.groupValue))].sort((left, right) => left.localeCompare(right));
  const steps: SurvivalStep[] = [];
  const groups: SurvivalGroupSummary[] = [];
  for (const groupValue of groupValues) {
    const groupRows = rows.filter((row) => row.groupValue === groupValue).sort((left, right) => left.time - right.time);
    const times = [...new Set(groupRows.map((row) => row.time))].sort((left, right) => left - right);
    let survival = 1;
    let medianSurvival: number | null = null;
    for (const time of times) {
      const atRisk = groupRows.filter((row) => row.time >= time).length;
      const events = groupRows.filter((row) => row.time === time && row.event).length;
      const censored = groupRows.filter((row) => row.time === time && !row.event).length;
      if (atRisk > 0 && events > 0) {
        survival *= (1 - (events / atRisk));
      }
      if (medianSurvival === null && survival <= 0.5) {
        medianSurvival = time;
      }
      steps.push({ groupValue, time, atRisk, events, censored, survival });
    }
    const eventCount = groupRows.filter((row) => row.event).length;
    groups.push({
      groupValue,
      caseCount: groupRows.length,
      eventCount,
      censoredCount: groupRows.length - eventCount,
      medianSurvival,
      lastSurvival: survival
    });
  }

  return {
    timeField: timeField.key,
    timeLabel: timeField.label,
    eventField: eventField.key,
    eventLabel: eventField.label,
    groupField: groupField?.key ?? null,
    groupLabel: groupField?.label ?? null,
    caseCount: rows.length,
    groups,
    steps,
    notes: [
      'Survival output uses Kaplan-Meier product-limit estimates.',
      'Event values are treated as true for 1/true/yes/event/death style values and false for 0/false/no/censored/alive style values.',
      'Log-rank tests and Cox regression are not included in this first-pass batch.'
    ]
  };
}

function confidenceIntervalFromEstimate(estimate: number, standardError: number | null, clamp: boolean): ConfidenceInterval | null {
  if (standardError === null || !Number.isFinite(standardError)) return null;
  const lower = estimate - (1.96 * standardError);
  const upper = estimate + (1.96 * standardError);
  return {
    level: 0.95,
    lower: clamp ? Math.max(0, Math.min(1, lower)) : lower,
    upper: clamp ? Math.max(0, Math.min(1, upper)) : upper
  };
}

function clusterEstimateStandardError(
  values: number[],
  weights: number[],
  clusters: string[],
  estimator: (clusterValues: number[], clusterWeights: number[]) => number | null
): number | null {
  const clusterValues = new Map<string, { values: number[]; weights: number[] }>();
  for (let index = 0; index < values.length; index += 1) {
    const key = clusters[index] ?? 'cluster';
    const entry = clusterValues.get(key) ?? { values: [], weights: [] };
    entry.values.push(values[index]!);
    entry.weights.push(weights[index]!);
    clusterValues.set(key, entry);
  }
  const estimates = [...clusterValues.values()]
    .map((entry) => estimator(entry.values, entry.weights))
    .filter((value): value is number => value !== null && Number.isFinite(value));
  if (estimates.length < 2) return null;
  const stdDev = sampleStdDev(estimates);
  return stdDev === null ? null : stdDev / Math.sqrt(estimates.length);
}

export function analyzeComplexSamples(
  dataset: CaseDataset,
  targetFieldKey: string,
  options: DatasetAnalysisOptions & {
    strataField?: string;
    clusterField?: string;
    groupField?: string;
  } = {}
): ComplexSampleResult {
  const targetField = requireDatasetField(dataset, targetFieldKey, 'complex-samples target');
  const normalizedOptions = normalizeAnalysisOptions(options);
  const strataFieldKey = typeof options.strataField === 'string' && options.strataField.trim() && options.strataField !== targetFieldKey
    ? options.strataField.trim()
    : '';
  const clusterFieldKey = typeof options.clusterField === 'string' && options.clusterField.trim() && options.clusterField !== targetFieldKey
    ? options.clusterField.trim()
    : '';
  const groupFieldKey = typeof options.groupField === 'string' && options.groupField.trim() && options.groupField !== targetFieldKey
    ? options.groupField.trim()
    : '';
  const strataField = strataFieldKey ? requireDatasetField(dataset, strataFieldKey, 'complex-samples strata') : null;
  const clusterField = clusterFieldKey ? requireDatasetField(dataset, clusterFieldKey, 'complex-samples cluster') : null;
  const groupField = groupFieldKey ? requireDatasetField(dataset, groupFieldKey, 'complex-samples domain/group') : null;
  const requiredFields = [targetFieldKey, strataFieldKey, clusterFieldKey, groupFieldKey].filter(Boolean);
  const preparedRows = analysisRows(dataset, requiredFields, normalizedOptions)
    .map(({ row, weight }) => ({
      target: row[targetFieldKey] ?? null,
      strata: strataFieldKey ? formatValue(row[strataFieldKey] ?? null) : null,
      cluster: clusterFieldKey ? formatValue(row[clusterFieldKey] ?? null) : null,
      domain: groupFieldKey ? formatValue(row[groupFieldKey] ?? null) : 'All cases',
      weight
    }))
    .filter((entry) => entry.target !== null && entry.weight > 0 && Boolean(entry.domain));

  if (preparedRows.length < 2) {
    throw new Error('Complex samples analysis requires at least two usable rows.');
  }

  const numericTarget = preparedRows.every((entry) => typeof entry.target === 'number');
  const statistic = numericTarget ? 'mean' : 'proportion';
  const domains = [...new Set(preparedRows.map((row) => row.domain))].sort((left, right) => left.localeCompare(right));
  const estimates: ComplexSampleEstimate[] = [];
  for (const domain of domains) {
    const domainRows = preparedRows.filter((row) => row.domain === domain);
    const weights = domainRows.map((row) => row.weight);
    const weightedCount = weights.reduce((total, value) => total + value, 0);
    const strataCount = strataFieldKey ? new Set(domainRows.map((row) => row.strata ?? '')).size : null;
    const clusterValues = clusterFieldKey ? domainRows.map((row) => row.cluster ?? 'cluster') : [];
    const clusterCount = clusterFieldKey ? new Set(clusterValues).size : null;

    if (numericTarget) {
      const values = domainRows.map((row) => Number(row.target));
      const estimate = weightedMean(values, weights);
      if (estimate === null) continue;
      const weightedStd = weightedStdDev(values, weights);
      const effectiveN = effectiveSampleSize(weights);
      const simpleSe = weightedStd !== null && effectiveN > 0 ? weightedStd / Math.sqrt(effectiveN) : null;
      const clusterSe = clusterFieldKey
        ? clusterEstimateStandardError(values, weights, clusterValues, weightedMean)
        : null;
      const standardError = clusterSe ?? simpleSe;
      estimates.push({
        domainValue: domain,
        levelValue: null,
        statistic: 'mean',
        count: domainRows.length,
        weightedCount,
        estimate,
        standardError,
        confidenceInterval: confidenceIntervalFromEstimate(estimate, standardError, false),
        strataCount,
        clusterCount,
        designEffect: clusterSe !== null && simpleSe !== null && simpleSe > 0 ? (clusterSe / simpleSe) ** 2 : null
      });
    } else {
      const levels = uniqueFormattedLevels(domainRows.map((row) => row.target));
      for (const level of levels) {
        const indicators = domainRows.map((row) => formatValue(row.target) === level ? 1 : 0);
        const estimate = weightedMean(indicators, weights);
        if (estimate === null) continue;
        const effectiveN = effectiveSampleSize(weights);
        const simpleSe = effectiveN > 0 ? Math.sqrt((estimate * (1 - estimate)) / effectiveN) : null;
        const clusterSe = clusterFieldKey
          ? clusterEstimateStandardError(indicators, weights, clusterValues, weightedMean)
          : null;
        const standardError = clusterSe ?? simpleSe;
        estimates.push({
          domainValue: domain,
          levelValue: level,
          statistic: 'proportion',
          count: domainRows.length,
          weightedCount,
          estimate,
          standardError,
          confidenceInterval: confidenceIntervalFromEstimate(estimate, standardError, true),
          strataCount,
          clusterCount,
          designEffect: clusterSe !== null && simpleSe !== null && simpleSe > 0 ? (clusterSe / simpleSe) ** 2 : null
        });
      }
    }
  }

  if (estimates.length === 0) {
    throw new Error('Complex samples analysis could not produce estimates for the selected target field.');
  }

  return {
    targetField: targetField.key,
    targetLabel: targetField.label,
    groupField: groupField?.key ?? null,
    groupLabel: groupField?.label ?? null,
    strataField: strataField?.key ?? null,
    strataLabel: strataField?.label ?? null,
    clusterField: clusterField?.key ?? null,
    clusterLabel: clusterField?.label ?? null,
    weightField: normalizedOptions.weightField || null,
    caseCount: preparedRows.length,
    statistic,
    designSummary: {
      strataCount: strataFieldKey ? new Set(preparedRows.map((row) => row.strata ?? '')).size : null,
      clusterCount: clusterFieldKey ? new Set(preparedRows.map((row) => row.cluster ?? '')).size : null,
      domainCount: domains.length,
      weightedCaseCount: preparedRows.reduce((total, row) => total + row.weight, 0)
    },
    estimates,
    notes: [
      'Complex Samples is a first-pass survey-design summary procedure.',
      'If a cluster field is selected, standard errors use cluster-level estimate variation; otherwise they use effective sample size from weights.',
      'This does not yet replace full SPSS Complex Samples procedures such as plan files, Taylor linearization for every statistic, or replicate weights.'
    ]
  };
}

function solveRidgeSystem(matrix: number[][], vector: number[], lambda = 1e-6): number[] {
  const regularized = matrix.map((row, rowIndex) =>
    row.map((value, columnIndex) => value + (rowIndex === columnIndex && rowIndex > 0 ? lambda : 0))
  );
  return solveLinearSystem(regularized, vector);
}

function fitLinearOutputWeights(features: number[][], targets: number[][]): number[][] {
  const columnCount = features[0]?.length ?? 0;
  const outputCount = targets[0]?.length ?? 0;
  const xtx = Array.from({ length: columnCount }, () => Array.from({ length: columnCount }, () => 0));
  const xty = Array.from({ length: columnCount }, () => Array.from({ length: outputCount }, () => 0));
  for (let rowIndex = 0; rowIndex < features.length; rowIndex += 1) {
    const row = features[rowIndex]!;
    const target = targets[rowIndex]!;
    for (let i = 0; i < columnCount; i += 1) {
      for (let j = 0; j < columnCount; j += 1) {
        xtx[i]![j] += row[i]! * row[j]!;
      }
      for (let output = 0; output < outputCount; output += 1) {
        xty[i]![output] += row[i]! * target[output]!;
      }
    }
  }
  return Array.from({ length: outputCount }, (_unused, output) =>
    solveRidgeSystem(xtx, xty.map((row) => row[output] ?? 0), 1e-4)
  );
}

function hiddenLayerFeatures(values: number[], inputWeights: number[][], biases: number[]): number[] {
  return [
    1,
    ...inputWeights.map((weights, hiddenIndex) =>
      Math.tanh((biases[hiddenIndex] ?? 0) + weights.reduce((total, weight, inputIndex) => total + (weight * values[inputIndex]!), 0))
    )
  ];
}

export function analyzeNeuralNetwork(
  dataset: CaseDataset,
  targetFieldKey: string,
  predictorFields: string[],
  task: NeuralNetworkTask = 'regression',
  hiddenUnits = 5,
  options?: DatasetAnalysisOptions
): NeuralNetworkResult {
  const uniquePredictors = [...new Set(predictorFields.map((field) => field.trim()).filter(Boolean))]
    .filter((field) => field !== targetFieldKey);
  if (uniquePredictors.length === 0) {
    throw new Error('Neural network requires at least one predictor field.');
  }
  const targetField = requireDatasetField(dataset, targetFieldKey, 'neural-network target');
  const predictorMeta = uniquePredictors.map((field) => requireDatasetField(dataset, field, 'neural-network predictor'));
  const rows = analysisRows(dataset, [targetFieldKey, ...uniquePredictors], options)
    .map(({ row }) => ({
      caseId: typeof row.case_id === 'string' ? row.case_id : null,
      caseLabel: typeof row.case_label === 'string' ? row.case_label : null,
      target: row[targetFieldKey] ?? null,
      predictors: uniquePredictors.map((field) => row[field])
    }))
    .filter((entry): entry is { caseId: string | null; caseLabel: string | null; target: DatasetValue; predictors: number[] } =>
      entry.target !== null && entry.predictors.every((value) => typeof value === 'number')
    );
  if (rows.length < Math.max(4, uniquePredictors.length + 2)) {
    throw new Error('Neural network requires more usable rows than predictor fields.');
  }

  const normalizedHiddenUnits = Math.min(12, Math.max(2, Math.floor(hiddenUnits)));
  const means = uniquePredictors.map((_field, index) => rows.reduce((total, row) => total + row.predictors[index]!, 0) / rows.length);
  const stdDevs = uniquePredictors.map((_field, index) => sampleStdDev(rows.map((row) => row.predictors[index]!)) || 1);
  const standardizedInputs = rows.map((row) => row.predictors.map((value, index) => (value - means[index]!) / stdDevs[index]!));
  const random = seededRandom(424242);
  const inputWeights = Array.from({ length: normalizedHiddenUnits }, () =>
    Array.from({ length: uniquePredictors.length }, () => (random() * 2) - 1)
  );
  const biases = Array.from({ length: normalizedHiddenUnits }, () => (random() * 2) - 1);
  const features = standardizedInputs.map((values) => hiddenLayerFeatures(values, inputWeights, biases));

  if (task === 'classification') {
    const classes = uniqueFormattedLevels(rows.map((row) => row.target));
    if (classes.length < 2) {
      throw new Error('Classification neural network requires at least two target classes.');
    }
    const targets = rows.map((row) => classes.map((level) => formatValue(row.target) === level ? 1 : 0));
    const outputWeights = fitLinearOutputWeights(features, targets);
    const scored = features.map((featureRow) => outputWeights.map((weights) =>
      weights.reduce((total, weight, index) => total + (weight * featureRow[index]!), 0)
    ));
    const predictions = scored.map((scores, index) => {
      const predictedIndex = scores.indexOf(Math.max(...scores));
      return {
        caseId: rows[index]!.caseId,
        caseLabel: rows[index]!.caseLabel,
        actual: formatValue(rows[index]!.target),
        predicted: classes[predictedIndex] ?? classes[0]!
      };
    });
    const correct = predictions.filter((prediction) => prediction.actual === prediction.predicted).length;
    const confusionCounts = new Map<string, number>();
    for (const prediction of predictions) {
      const key = `${prediction.actual}::${prediction.predicted}`;
      confusionCounts.set(key, (confusionCounts.get(key) ?? 0) + 1);
    }
    const featureImportance = uniquePredictors.map((field, inputIndex) => {
      const importance = inputWeights.reduce((total, hiddenWeights, hiddenIndex) => {
        const downstream = outputWeights.reduce((sum, output) => sum + Math.abs(output[hiddenIndex + 1] ?? 0), 0);
        return total + (Math.abs(hiddenWeights[inputIndex] ?? 0) * downstream);
      }, 0);
      return { field, label: predictorMeta[inputIndex]!.label, importance };
    }).sort((left, right) => right.importance - left.importance);

    return {
      targetField: targetField.key,
      targetLabel: targetField.label,
      predictorFields: uniquePredictors,
      predictorLabels: predictorMeta.map((field) => field.label),
      task,
      caseCount: rows.length,
      hiddenUnits: normalizedHiddenUnits,
      metrics: {
        accuracy: rows.length > 0 ? correct / rows.length : null
      },
      featureImportance,
      classes,
      confusionMatrix: [...confusionCounts.entries()].map(([key, count]) => {
        const [actual, predicted] = key.split('::');
        return { actual: actual ?? '', predicted: predicted ?? '', count };
      }),
      predictions: predictions.slice(0, 100),
      notes: [
        'Neural network output uses a deterministic single-hidden-layer random-feature model for pilot exploration.',
        'The current procedure reports apparent fit on the same rows used for fitting; train/test validation is a future expansion.'
      ]
    };
  }

  const numericRows = rows.filter((row): row is typeof rows[number] & { target: number } => typeof row.target === 'number');
  if (numericRows.length !== rows.length || numericRows.length < Math.max(4, uniquePredictors.length + 2)) {
    throw new Error('Regression neural network requires a numeric target field and enough complete rows.');
  }
  const targets = numericRows.map((row) => [row.target]);
  const outputWeights = fitLinearOutputWeights(features, targets);
  const predictions = features.map((featureRow, index) => {
    const predicted = outputWeights[0]!.reduce((total, weight, weightIndex) => total + (weight * featureRow[weightIndex]!), 0);
    const actual = numericRows[index]!.target;
    return {
      caseId: numericRows[index]!.caseId,
      caseLabel: numericRows[index]!.caseLabel,
      actual,
      predicted,
      residual: actual - predicted
    };
  });
  const actualValues = predictions.map((prediction) => Number(prediction.actual));
  const predictedValues = predictions.map((prediction) => Number(prediction.predicted));
  const residuals = predictions.map((prediction) => prediction.residual ?? 0);
  const yMean = actualValues.reduce((total, value) => total + value, 0) / actualValues.length;
  const ssTotal = actualValues.reduce((total, value) => total + ((value - yMean) ** 2), 0);
  const ssResidual = actualValues.reduce((total, value, index) => total + ((value - predictedValues[index]!) ** 2), 0);
  const featureImportance = uniquePredictors.map((field, inputIndex) => {
    const importance = inputWeights.reduce((total, hiddenWeights, hiddenIndex) =>
      total + (Math.abs(hiddenWeights[inputIndex] ?? 0) * Math.abs(outputWeights[0]![hiddenIndex + 1] ?? 0)), 0);
    return { field, label: predictorMeta[inputIndex]!.label, importance };
  }).sort((left, right) => right.importance - left.importance);

  return {
    targetField: targetField.key,
    targetLabel: targetField.label,
    predictorFields: uniquePredictors,
    predictorLabels: predictorMeta.map((field) => field.label),
    task,
    caseCount: rows.length,
    hiddenUnits: normalizedHiddenUnits,
    metrics: {
      rootMeanSquaredError: Math.sqrt(residuals.reduce((total, value) => total + (value ** 2), 0) / residuals.length),
      meanAbsoluteError: residuals.reduce((total, value) => total + Math.abs(value), 0) / residuals.length,
      rSquared: ssTotal === 0 ? 1 : 1 - (ssResidual / ssTotal)
    },
    featureImportance,
    predictions: predictions.slice(0, 100),
    notes: [
      'Neural network output uses a deterministic single-hidden-layer random-feature model for pilot exploration.',
      'The current procedure reports apparent fit on the same rows used for fitting; train/test validation is a future expansion.'
    ]
  };
}

export function analyzeCrosstab(
  dataset: CaseDataset,
  rowFieldKey: string,
  columnFieldKey: string,
  options?: DatasetAnalysisOptions
): DatasetCrosstab {
  if (rowFieldKey === columnFieldKey) {
    throw new Error('Choose two different fields for the crosstab.');
  }

  const rowField = dataset.fields.find((field) => field.key === rowFieldKey);
  const columnField = dataset.fields.find((field) => field.key === columnFieldKey);

  if (!rowField || !columnField) {
    throw new Error('Selected crosstab field was not found in the dataset.');
  }

  const rows = analysisRows(dataset, [rowFieldKey, columnFieldKey], options);
  const validRows = rows.filter(({ row }) => row[rowFieldKey] !== null && row[columnFieldKey] !== null);
  const rowCounts = new Map<string, number>();
  const columnCounts = new Map<string, number>();
  const cellCounts = new Map<string, number>();

  for (const { row, weight } of validRows) {
    if (weight <= 0) continue;
    const rowValue = formatValue(row[rowFieldKey] ?? null);
    const columnValue = formatValue(row[columnFieldKey] ?? null);
    rowCounts.set(rowValue, (rowCounts.get(rowValue) ?? 0) + weight);
    columnCounts.set(columnValue, (columnCounts.get(columnValue) ?? 0) + weight);
    const cellKey = `${rowValue}::${columnValue}`;
    cellCounts.set(cellKey, (cellCounts.get(cellKey) ?? 0) + weight);
  }

  const sortCategoryEntries = (left: [string, number], right: [string, number]): number =>
    right[1] - left[1] || left[0].localeCompare(right[0]);

  const validCaseCount = validRows.length;
  const weightedValidCaseCount = [...rowCounts.values()].reduce((total, value) => total + value, 0);
  const rowCategories = [...rowCounts.entries()]
    .sort(sortCategoryEntries)
    .map(([value, count]) => ({
      value,
      count,
      proportion: weightedValidCaseCount === 0 ? 0 : count / weightedValidCaseCount
    }));
  const columnCategories = [...columnCounts.entries()]
    .sort(sortCategoryEntries)
    .map(([value, count]) => ({
      value,
      count,
      proportion: weightedValidCaseCount === 0 ? 0 : count / weightedValidCaseCount
    }));

  const cells: DatasetCrosstabCell[] = [];
  let chiSquareStatistic = 0;
  for (const rowCategory of rowCategories) {
    for (const columnCategory of columnCategories) {
      const count = cellCounts.get(`${rowCategory.value}::${columnCategory.value}`) ?? 0;
      const expected = weightedValidCaseCount === 0 ? 0 : (rowCategory.count * columnCategory.count) / weightedValidCaseCount;
      if (expected > 0) {
        chiSquareStatistic += ((count - expected) ** 2) / expected;
      }
      cells.push({
        rowValue: rowCategory.value,
        columnValue: columnCategory.value,
        count,
        rowProportion: rowCategory.count === 0 ? 0 : count / rowCategory.count,
        columnProportion: columnCategory.count === 0 ? 0 : count / columnCategory.count,
        totalProportion: weightedValidCaseCount === 0 ? 0 : count / weightedValidCaseCount
      });
    }
  }

  const degreesOfFreedom = Math.max(0, (rowCategories.length - 1) * (columnCategories.length - 1));
  const pValue = degreesOfFreedom > 0 ? chiSquarePValue(chiSquareStatistic, degreesOfFreedom) : null;
  const minDimension = Math.min(rowCategories.length - 1, columnCategories.length - 1);
  const cramersV = weightedValidCaseCount > 0 && minDimension > 0
    ? Math.sqrt(chiSquareStatistic / (weightedValidCaseCount * minDimension))
    : null;

  return {
    rowField: rowField.key,
    rowLabel: rowField.label,
    columnField: columnField.key,
    columnLabel: columnField.label,
    caseCount: dataset.caseCount,
    validCaseCount,
    missingCaseCount: dataset.caseCount - validCaseCount,
    weightedCaseCount: normalizeAnalysisOptions(options).weightField ? getWeightTotal(normalizeDatasetForAnalysis(dataset, options).rows, normalizeAnalysisOptions(options).weightField) : null,
    weightedValidCaseCount: normalizeAnalysisOptions(options).weightField ? weightedValidCaseCount : null,
    rowCategories,
    columnCategories,
    cells,
    chiSquare: degreesOfFreedom > 0
      ? {
        statistic: chiSquareStatistic,
        degreesOfFreedom,
        pValue,
        cramersV
      }
      : null
  };
}

export function analyzeRegression(
  dataset: CaseDataset,
  dependentField: string,
  predictorField: string | string[],
  model: RegressionModel,
  options?: DatasetAnalysisOptions
): RegressionResult {
  const predictorFields = (Array.isArray(predictorField) ? predictorField : [predictorField])
    .map((field) => field.trim())
    .filter(Boolean);
  if (predictorFields.length === 0) {
    throw new Error('At least one predictor field is required for regression.');
  }
  if (new Set(predictorFields).size !== predictorFields.length) {
    throw new Error('Predictor fields must be unique.');
  }
  if (predictorFields.includes(dependentField)) {
    throw new Error('Dependent and predictor fields must be different.');
  }

  const rows = analysisRows(dataset, [dependentField, ...predictorFields], options)
    .map(({ row, weight }) => ({
      caseId: typeof row.case_id === 'string' ? row.case_id : null,
      caseLabel: typeof row.case_label === 'string' ? row.case_label : null,
      x: predictorFields.map((field) => row[field]),
      y: row[dependentField],
      weight
    }))
    .filter((entry): entry is { caseId: string | null; caseLabel: string | null; x: number[]; y: number; weight: number } =>
      typeof entry.y === 'number'
      && entry.x.every((value) => typeof value === 'number')
      && entry.weight > 0
    );

  if (rows.length < predictorFields.length + 1) {
    throw new Error('Not enough usable numeric rows for the requested regression.');
  }

  const weightedCaseCount = rows.reduce((total, entry) => total + entry.weight, 0);
  const xMatrix = rows.map((entry) => [1, ...entry.x]);
  const yVector = rows.map((entry) => model === 'logistic' ? (entry.y >= 0.5 ? 1 : 0) : entry.y);
  const weights = rows.map((entry) => entry.weight);

  if (model === 'linear') {
    const xtwx = Array.from({ length: predictorFields.length + 1 }, () => Array.from({ length: predictorFields.length + 1 }, () => 0));
    const xtwy = Array.from({ length: predictorFields.length + 1 }, () => 0);
    for (let rowIndex = 0; rowIndex < xMatrix.length; rowIndex += 1) {
      const vector = xMatrix[rowIndex]!;
      const y = yVector[rowIndex]!;
      const weight = weights[rowIndex]!;
      for (let i = 0; i < vector.length; i += 1) {
        xtwy[i] += vector[i]! * y * weight;
        for (let j = 0; j < vector.length; j += 1) {
          xtwx[i]![j] += vector[i]! * vector[j]! * weight;
        }
      }
    }

    const coefficients = solveLinearSystem(xtwx, xtwy);
    const intercept = coefficients[0]!;
    const slopes = coefficients.slice(1);
    const predictions = xMatrix.map((vector) => coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0));
    const yMean = yVector.reduce((total, value, index) => total + (value * weights[index]!), 0) / weightedCaseCount;
    const ssTot = yVector.reduce((total, value, index) => total + (weights[index]! * ((value - yMean) ** 2)), 0);
    const ssRes = yVector.reduce((total, value, index) => total + (weights[index]! * ((value - predictions[index]!) ** 2)), 0);
    const rSquared = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
    const meanSquaredError = weightedCaseCount > 0 ? ssRes / weightedCaseCount : null;
    const degreesOfFreedom = Math.max(1, rows.length - predictorFields.length - 1);
    const residualStdError = meanSquaredError === null ? null : Math.sqrt(meanSquaredError);
    const fStatistic = predictorFields.length > 0 && degreesOfFreedom > 0 && rSquared < 1
      ? (rSquared / predictorFields.length) / ((1 - rSquared) / degreesOfFreedom)
      : null;
    const fPValue = fStatistic === null ? null : fDistributionPValue(fStatistic, predictorFields.length, degreesOfFreedom);
    const covarianceMatrix = meanSquaredError === null ? null : invertMatrix(xtwx).map((row) => row.map((value) => value * meanSquaredError));
    const coefficientStats = coefficients.map((coefficient, index) => {
      const standardError = covarianceMatrix ? Math.sqrt(Math.max(0, covarianceMatrix[index]![index]!)) : null;
      const statistic = standardError && standardError > 0 ? coefficient / standardError : null;
      const pValue = statistic === null ? null : studentTPValue(statistic, degreesOfFreedom);
      return {
        field: index === 0 ? '(Intercept)' : predictorFields[index - 1]!,
        coefficient,
        standardError,
        statistic,
        pValue,
        confidenceInterval: standardError === null ? null : confidenceInterval95(coefficient, standardError, degreesOfFreedom),
        oddsRatio: null
      };
    });
    const assumptions: AssumptionCheck[] = [
      buildAssumptionCheck(
        'sample_size',
        'Sample size',
        rows.length > predictorFields.length + 1 ? 'pass' : 'fail',
        rows.length,
        rows.length > predictorFields.length + 1 ? 'Enough rows for linear regression.' : 'Need more rows than predictors.'
      ),
      buildAssumptionCheck(
        'residual_df',
        'Residual degrees of freedom',
        degreesOfFreedom >= 5 ? 'pass' : 'warn',
        degreesOfFreedom,
        degreesOfFreedom >= 5 ? 'Residual degrees of freedom are acceptable.' : 'Residual degrees of freedom are low.'
      )
    ];
    const residuals = yVector.map((value, index) => value - predictions[index]!);
    const standardizedResiduals = residualStdError && residualStdError > 0
      ? residuals.map((residual) => residual / residualStdError)
      : residuals.map(() => null);
    const observations: RegressionObservation[] = rows.map((entry, index) => ({
      caseId: entry.caseId,
      caseLabel: entry.caseLabel,
      actual: yVector[index]!,
      predicted: predictions[index]!,
      residual: residuals[index]!,
      standardizedResidual: standardizedResiduals[index],
      leverage: null,
      cooksDistance: null,
      devianceResidual: null,
      predictedClass: null,
      outlier: standardizedResiduals[index] !== null && Math.abs(standardizedResiduals[index]!) >= 2.5
    }));
    const inverseXtWX = invertMatrix(xtwx);
    const parameterCount = predictorFields.length + 1;
    const leverageValues = rows.map((entry) => {
      const vector = [1, ...entry.x];
      const projected = inverseXtWX.map((row) => row.reduce((total, value, index) => total + (value * vector[index]!), 0));
      const leverage = entry.weight * vector.reduce((total, value, index) => total + (value * projected[index]!), 0);
      return Number.isFinite(leverage) ? leverage : null;
    });
    const cooksValues = observations.map((observation, index) => {
      const h = leverageValues[index];
      const stdResidual = observation.standardizedResidual;
      if (h === null || stdResidual === null || stdResidual === undefined || !(h >= 0) || h >= 1 || parameterCount <= 0) return null;
      const numericResidual = stdResidual as number;
      return ((numericResidual ** 2) * h) / (parameterCount * Math.max(1e-12, 1 - h));
    });
    observations.forEach((observation, index) => {
      observation.leverage = leverageValues[index];
      observation.cooksDistance = cooksValues[index];
    });
    const outlierCount = observations.filter((item) => item.outlier).length;
    const maxAbsStandardizedResidual = standardizedResiduals.reduce<number>((max, value) => {
      if (value === null) return max;
      const numericValue = value as number;
      return Math.max(max, Math.abs(numericValue));
    }, 0);
    const maxLeverage = leverageValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0);
    const maxCooksDistance = cooksValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0);
    const leverageThreshold = (2 * parameterCount) / Math.max(rows.length, 1);
    const highLeverageCount = leverageValues.filter((value) => value !== null && value > leverageThreshold).length;
    const influentialCount = cooksValues.filter((value) => value !== null && value > (4 / Math.max(rows.length, 1))).length;
    const durbinWatson = computeDurbinWatson(residuals);
    const meanAbsoluteError = residuals.reduce((total, value, index) => total + (Math.abs(value) * weights[index]!), 0) / weightedCaseCount;
    const vifByPredictor = computeVifByPredictor(rows, predictorFields);
    const vifValues = Object.values(vifByPredictor).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    return {
      model,
      dependentField,
      predictorField: predictorFields[0]!,
      predictorFields,
      caseCount: rows.length,
      intercept,
      slope: slopes[0] ?? 0,
      coefficients: coefficientStats,
      metrics: {
        rSquared,
        adjustedRSquared: rows.length > predictorFields.length + 1
          ? 1 - ((1 - rSquared) * ((rows.length - 1) / degreesOfFreedom))
          : null,
        meanSquaredError,
        residualStdError,
        fStatistic,
        fPValue
      },
      diagnostics: {
        weightedCaseCount,
        residualSumSquares: ssRes,
        totalSumSquares: ssTot,
        outlierCount,
        maxAbsStandardizedResidual,
        maxLeverage,
        maxCooksDistance,
        highLeverageCount,
        influentialCount,
        meanAbsoluteError,
        durbinWatson,
        maxVif: vifValues.length > 0 ? Math.max(...vifValues) : null,
        meanVif: vifValues.length > 0 ? vifValues.reduce((total, value) => total + value, 0) / vifValues.length : null,
        ...Object.fromEntries(Object.entries(vifByPredictor).map(([field, value]) => [`vif_${field}`, value]))
      },
      observations: observations.slice(0, 50),
      assumptions
    };
  }

  const coefficients = new Array<number>(predictorFields.length + 1).fill(0);
  const learningRate = 0.05;
  for (let iteration = 0; iteration < 5000; iteration += 1) {
    const gradients = new Array<number>(coefficients.length).fill(0);
    for (let rowIndex = 0; rowIndex < xMatrix.length; rowIndex += 1) {
      const linear = coefficients.reduce((total, coefficient, index) => total + (coefficient * xMatrix[rowIndex]![index]!), 0);
      const prediction = 1 / (1 + Math.exp(-linear));
      const error = prediction - yVector[rowIndex]!;
      for (let coefficientIndex = 0; coefficientIndex < coefficients.length; coefficientIndex += 1) {
        gradients[coefficientIndex] += error * xMatrix[rowIndex]![coefficientIndex]! * weights[rowIndex]!;
      }
    }
    for (let coefficientIndex = 0; coefficientIndex < coefficients.length; coefficientIndex += 1) {
      coefficients[coefficientIndex] -= (learningRate * gradients[coefficientIndex]!) / weightedCaseCount;
    }
  }

  const probabilities = xMatrix.map((vector) => 1 / (1 + Math.exp(-coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0))));
  const predictedClasses = probabilities.map((probability) => probability >= 0.5 ? 1 : 0);
  const weightedAccuracy = yVector.reduce((total, value, index) =>
    total + ((predictedClasses[index] === value ? 1 : 0) * weights[index]!), 0) / weightedCaseCount;
  const logLikelihood = yVector.reduce((total, value, index) => {
    const probability = Math.min(0.999999, Math.max(0.000001, probabilities[index]!));
    return total + (weights[index]! * ((value * Math.log(probability)) + ((1 - value) * Math.log(1 - probability))));
  }, 0);
  const meanY = yVector.reduce((total, value, index) => total + (value * weights[index]!), 0) / weightedCaseCount;
  const boundedMeanY = Math.min(0.999999, Math.max(0.000001, meanY));
  const nullLogLikelihood = yVector.reduce((total, value, index) =>
    total + (weights[index]! * ((value * Math.log(boundedMeanY)) + ((1 - value) * Math.log(1 - boundedMeanY)))), 0);
  const truePositive = yVector.reduce((total, value, index) => total + ((value === 1 && predictedClasses[index] === 1 ? 1 : 0) * weights[index]!), 0);
  const trueNegative = yVector.reduce((total, value, index) => total + ((value === 0 && predictedClasses[index] === 0 ? 1 : 0) * weights[index]!), 0);
  const falsePositive = yVector.reduce((total, value, index) => total + ((value === 0 && predictedClasses[index] === 1 ? 1 : 0) * weights[index]!), 0);
  const falseNegative = yVector.reduce((total, value, index) => total + ((value === 1 && predictedClasses[index] === 0 ? 1 : 0) * weights[index]!), 0);
  const precision = (truePositive + falsePositive) > 0 ? truePositive / (truePositive + falsePositive) : null;
  const recall = (truePositive + falseNegative) > 0 ? truePositive / (truePositive + falseNegative) : null;
  const specificity = (trueNegative + falsePositive) > 0 ? trueNegative / (trueNegative + falsePositive) : null;
  const f1Score = precision !== null && recall !== null && (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : null;
  const brierScore = probabilities.reduce((total, probability, index) => total + (weights[index]! * ((probability - yVector[index]!) ** 2)), 0) / weightedCaseCount;
  const deviance = -2 * logLikelihood;
  const nullDeviance = -2 * nullLogLikelihood;
  const rocAuc = computeRocAuc(probabilities, yVector, weights);

  const hessian = Array.from({ length: coefficients.length }, () => Array.from({ length: coefficients.length }, () => 0));
  for (let rowIndex = 0; rowIndex < xMatrix.length; rowIndex += 1) {
    const p = probabilities[rowIndex]!;
    const variance = p * (1 - p) * weights[rowIndex]!;
    const vector = xMatrix[rowIndex]!;
    for (let i = 0; i < vector.length; i += 1) {
      for (let j = 0; j < vector.length; j += 1) {
        hessian[i]![j] += vector[i]! * vector[j]! * variance;
      }
    }
  }
  const covarianceMatrix = invertMatrix(hessian);
  const coefficientStats = coefficients.map((coefficient, index) => {
    const standardError = Math.sqrt(Math.max(0, covarianceMatrix[index]![index]!));
    const statistic = standardError > 0 ? coefficient / standardError : null;
    const pValue = statistic === null ? null : studentTPValue(statistic, Math.max(1, rows.length - coefficients.length));
    return {
      field: index === 0 ? '(Intercept)' : predictorFields[index - 1]!,
      coefficient,
      standardError,
      statistic,
      pValue,
      confidenceInterval: standardError > 0 ? {
        level: 0.95,
        lower: coefficient - (1.959963984540054 * standardError),
        upper: coefficient + (1.959963984540054 * standardError)
      } : null,
      oddsRatio: Math.exp(coefficient)
    };
  });

  const hosmerGroupCount = Math.min(10, Math.max(2, Math.floor(rows.length / 2)));
  const probabilityGroups = probabilities
    .map((probability, index) => ({ probability, observed: yVector[index]!, weight: weights[index]! }))
    .sort((left, right) => left.probability - right.probability);
  const groupSize = Math.ceil(probabilityGroups.length / hosmerGroupCount);
  let hosmerLemeshowStatistic = 0;
  let realizedGroupCount = 0;
  for (let groupIndex = 0; groupIndex < hosmerGroupCount; groupIndex += 1) {
    const group = probabilityGroups.slice(groupIndex * groupSize, (groupIndex + 1) * groupSize);
    if (group.length === 0) continue;
    realizedGroupCount += 1;
    const observed = group.reduce((total, item) => total + (item.observed * item.weight), 0);
    const expected = group.reduce((total, item) => total + (item.probability * item.weight), 0);
    const totalWeight = group.reduce((total, item) => total + item.weight, 0);
    if (expected > 0 && expected < totalWeight) {
      hosmerLemeshowStatistic += (((observed - expected) ** 2) / expected) + ((((totalWeight - observed) - (totalWeight - expected)) ** 2) / (totalWeight - expected));
    }
  }
  const hosmerLemeshowDf = Math.max(1, realizedGroupCount - 2);
  const hosmerLemeshowPValue = chiSquarePValue(hosmerLemeshowStatistic, hosmerLemeshowDf);
  const assumptions: AssumptionCheck[] = [
    buildAssumptionCheck(
      'binary_outcome',
      'Binary outcome',
      new Set(yVector).size <= 2 ? 'pass' : 'fail',
      new Set(yVector).size,
      new Set(yVector).size <= 2 ? 'Outcome is binary.' : 'Logistic regression requires a binary outcome.'
    ),
    buildAssumptionCheck(
      'sample_size',
      'Sample size',
      rows.length >= (predictorFields.length * 5) ? 'pass' : 'warn',
      rows.length,
      rows.length >= (predictorFields.length * 5) ? 'Sample size is acceptable for this first-pass model.' : 'Sample size is small relative to predictor count.'
    )
  ];
  const pearsonResiduals = probabilities.map((probability, index) => {
    const denominator = Math.sqrt(Math.max(1e-12, probability * (1 - probability)));
    return (yVector[index]! - probability) / denominator;
  });
  const observations: RegressionObservation[] = rows.map((entry, index) => ({
    caseId: entry.caseId,
    caseLabel: entry.caseLabel,
    actual: yVector[index]!,
    predicted: probabilities[index]!,
    residual: yVector[index]! - probabilities[index]!,
    standardizedResidual: pearsonResiduals[index]!,
    leverage: null,
    cooksDistance: null,
    devianceResidual: null,
    predictedClass: predictedClasses[index]!,
    outlier: Math.abs(pearsonResiduals[index]!) >= 2.5
  }));
  const leverageValues = rows.map((entry, index) => {
    const vector = [1, ...entry.x];
    const variance = probabilities[index]! * (1 - probabilities[index]!) * weights[index]!;
    const projected = covarianceMatrix.map((row) => row.reduce((total, value, innerIndex) => total + (value * vector[innerIndex]!), 0));
    const leverage = variance * vector.reduce((total, value, innerIndex) => total + (value * projected[innerIndex]!), 0);
    return Number.isFinite(leverage) ? leverage : null;
  });
  const devianceResiduals = probabilities.map((probability, index) => {
    const y = yVector[index]!;
    const boundedProbability = Math.min(0.999999, Math.max(0.000001, probability));
    const term = (y === 1)
      ? (2 * Math.log(1 / boundedProbability))
      : (2 * Math.log(1 / (1 - boundedProbability)));
    return (y - boundedProbability >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, term));
  });
  observations.forEach((observation, index) => {
    observation.leverage = leverageValues[index];
    observation.devianceResidual = devianceResiduals[index];
  });
  const outlierCount = observations.filter((item) => item.outlier).length;
  const maxAbsPearsonResidual = pearsonResiduals.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  const maxLeverage = leverageValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0);
  const maxAbsDevianceResidual = devianceResiduals.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  const leverageThreshold = (2 * (predictorFields.length + 1)) / Math.max(rows.length, 1);
  const highLeverageCount = leverageValues.filter((value) => value !== null && value > leverageThreshold).length;

  return {
    model,
    dependentField,
    predictorField: predictorFields[0]!,
    predictorFields,
    caseCount: rows.length,
    intercept: coefficients[0]!,
    slope: coefficients[1] ?? 0,
    coefficients: coefficientStats,
    metrics: {
      accuracy: weightedAccuracy,
      meanPredictedProbability: probabilities.reduce((total, value, index) => total + (value * weights[index]!), 0) / weightedCaseCount,
      pseudoRSquared: nullLogLikelihood === 0 ? null : 1 - (logLikelihood / nullLogLikelihood),
      precision,
      recall,
      specificity,
      f1Score,
      brierScore,
      rocAuc
    },
    diagnostics: {
      weightedCaseCount,
      logLikelihood,
      nullLogLikelihood,
      deviance,
      nullDeviance,
      aic: (2 * coefficients.length) - (2 * logLikelihood),
      bic: (Math.log(rows.length) * coefficients.length) - (2 * logLikelihood),
      truePositive,
      trueNegative,
      falsePositive,
      falseNegative,
      hosmerLemeshowStatistic,
      hosmerLemeshowPValue,
      outlierCount,
      maxAbsPearsonResidual,
      maxLeverage,
      maxAbsDevianceResidual,
      highLeverageCount,
      rocAuc
    },
    observations: observations.slice(0, 50),
    assumptions
  };
}

export function analyzeCorrelation(
  dataset: CaseDataset,
  xField: string,
  yField: string,
  options?: DatasetAnalysisOptions
): CorrelationResult {
  if (xField === yField) {
    throw new Error('Choose two different numeric fields for correlation.');
  }

  const pairs = analysisRows(dataset, [xField, yField], options)
    .map(({ row, weight }) => ({
      x: row[xField],
      y: row[yField],
      weight
    }))
    .filter((row): row is { x: number; y: number; weight: number } => typeof row.x === 'number' && typeof row.y === 'number' && row.weight > 0);

  if (pairs.length < 2) {
    throw new Error('At least two numeric rows are required for correlation.');
  }

  const totalWeight = pairs.reduce((total, pair) => total + pair.weight, 0);
  const xMean = pairs.reduce((total, pair) => total + (pair.x * pair.weight), 0) / totalWeight;
  const yMean = pairs.reduce((total, pair) => total + (pair.y * pair.weight), 0) / totalWeight;
  const ssxx = pairs.reduce((total, pair) => total + (pair.weight * ((pair.x - xMean) ** 2)), 0);
  const ssyy = pairs.reduce((total, pair) => total + (pair.weight * ((pair.y - yMean) ** 2)), 0);
  const ssxy = pairs.reduce((total, pair) => total + (pair.weight * ((pair.x - xMean) * (pair.y - yMean))), 0);

  if (ssxx === 0 || ssyy === 0) {
    throw new Error('Both correlation fields must vary across the selected cases.');
  }

  const pearsonR = ssxy / Math.sqrt(ssxx * ssyy);
  const xStdDev = Math.sqrt(ssxx / totalWeight);
  const yStdDev = Math.sqrt(ssyy / totalWeight);
  const covariance = ssxy / totalWeight;
  const slope = ssxy / ssxx;
  const intercept = yMean - (slope * xMean);
  const degreesOfFreedom = Math.max(1, pairs.length - 2);
  const tStatistic = pearsonR === 1 || pearsonR === -1
    ? Number.POSITIVE_INFINITY
    : pearsonR * Math.sqrt(degreesOfFreedom / Math.max(1e-12, 1 - (pearsonR ** 2)));
  const pValue = studentTPValue(tStatistic, degreesOfFreedom);
  const fisherZ = Math.atanh(Math.max(-0.999999, Math.min(0.999999, pearsonR)));
  const fisherStandardError = pairs.length > 3 ? 1 / Math.sqrt(pairs.length - 3) : null;
  const confidenceInterval = fisherStandardError === null
    ? null
    : {
      level: 0.95,
      lower: Math.tanh(fisherZ - (1.959963984540054 * fisherStandardError)),
      upper: Math.tanh(fisherZ + (1.959963984540054 * fisherStandardError))
    };

  return {
    xField,
    yField,
    caseCount: pairs.length,
    pearsonR,
    rSquared: pearsonR ** 2,
    covariance,
    xMean,
    yMean,
    xStdDev,
    yStdDev,
    slope,
    intercept,
    pValue,
    confidenceInterval
  };
}

export function analyzeCompareMeans(
  dataset: CaseDataset,
  outcomeField: string,
  groupField: string,
  options?: DatasetAnalysisOptions
): CompareMeansResult {
  if (outcomeField === groupField) {
    throw new Error('Choose different outcome and grouping fields.');
  }

  const outcome = dataset.fields.find((field) => field.key === outcomeField);
  const group = dataset.fields.find((field) => field.key === groupField);
  if (!outcome || !group) {
    throw new Error('Selected compare-means field was not found in the dataset.');
  }

  const validPairs = analysisRows(dataset, [outcomeField, groupField], options)
    .map(({ row, weight }) => ({
      outcome: row[outcomeField],
      group: row[groupField],
      weight
    }))
    .filter((row): row is { outcome: number; group: Exclude<DatasetValue, null>; weight: number } =>
      typeof row.outcome === 'number' && row.group !== null && row.weight > 0
    );

  if (validPairs.length < 2) {
    throw new Error('At least two valid grouped numeric rows are required.');
  }

  const groupedValues = new Map<string, Array<{ value: number; weight: number }>>();
  for (const pair of validPairs) {
    const key = formatValue(pair.group);
    const values = groupedValues.get(key) ?? [];
    values.push({ value: pair.outcome, weight: pair.weight });
    groupedValues.set(key, values);
  }

  const groups = [...groupedValues.entries()]
    .map(([groupValue, values]) => {
      const numericValues = values.map((entry) => entry.value);
      const weights = values.map((entry) => entry.weight);
      const mean = weightedMean(numericValues, weights);
      if (mean === null) {
        throw new Error('Unable to summarize grouped values.');
      }
      return {
        groupValue,
        count: values.length,
        mean,
        stdDev: normalizeAnalysisOptions(options).weightField ? weightedStdDev(numericValues, weights) : sampleStdDev(numericValues),
        min: Math.min(...numericValues),
        max: Math.max(...numericValues)
      };
    })
    .sort((left, right) => right.count - left.count || left.groupValue.localeCompare(right.groupValue));

  const totalWeight = validPairs.reduce((total, pair) => total + pair.weight, 0);
  const overallMean = validPairs.reduce((total, pair) => total + (pair.outcome * pair.weight), 0) / totalWeight;
  const ssBetween = groups.reduce((total, item) => {
    const values = groupedValues.get(item.groupValue) ?? [];
    const groupWeight = values.reduce((inner, entry) => inner + entry.weight, 0);
    return total + (groupWeight * ((item.mean - overallMean) ** 2));
  }, 0);
  const ssWithin = groups.reduce((total, item) => {
    const values = groupedValues.get(item.groupValue) ?? [];
    return total + values.reduce((inner, value) => inner + (value.weight * ((value.value - item.mean) ** 2)), 0);
  }, 0);
  const ssTotal = ssBetween + ssWithin;
  const dfBetween = Math.max(0, groups.length - 1);
  const dfWithin = Math.max(0, validPairs.length - groups.length);
  const msBetween = dfBetween > 0 ? ssBetween / dfBetween : null;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : null;
  const fStatistic = msBetween !== null && msWithin !== null && msWithin > 0
    ? msBetween / msWithin
    : null;
  const pValue = fStatistic !== null ? fDistributionPValue(fStatistic, dfBetween, dfWithin) : null;
  const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : null;
  const omegaSquared = msWithin !== null && ssTotal > 0
    ? Math.max(0, (ssBetween - (dfBetween * msWithin)) / (ssTotal + msWithin))
    : null;
  const assumptions: AssumptionCheck[] = [
    buildAssumptionCheck(
      'group_count',
      'At least two groups',
      groups.length > 1 ? 'pass' : 'fail',
      groups.length,
      groups.length > 1 ? 'Enough groups for ANOVA.' : 'ANOVA requires at least two non-empty groups.'
    ),
    buildAssumptionCheck(
      'minimum_group_size',
      'Minimum group size',
      groups.every((group) => group.count >= 2) ? 'pass' : 'warn',
      Math.min(...groups.map((group) => group.count)),
      groups.every((group) => group.count >= 2) ? 'Each group has at least two cases.' : 'One or more groups have fewer than two cases.'
    )
  ];

  const pairwiseComparisons: CompareMeansPostHocComparison[] = [];
  for (let leftIndex = 0; leftIndex < groups.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < groups.length; rightIndex += 1) {
      const leftGroup = groups[leftIndex]!;
      const rightGroup = groups[rightIndex]!;
      const leftEntries = groupedValues.get(leftGroup.groupValue) ?? [];
      const rightEntries = groupedValues.get(rightGroup.groupValue) ?? [];
      const leftWeights = leftEntries.map((entry) => entry.weight);
      const rightWeights = rightEntries.map((entry) => entry.weight);
      const leftNumeric = leftEntries.map((entry) => entry.value);
      const rightNumeric = rightEntries.map((entry) => entry.value);
      const leftVariance = weightedVariance(leftNumeric, leftWeights);
      const rightVariance = weightedVariance(rightNumeric, rightWeights);
      const leftN = normalizeAnalysisOptions(options).weightField ? effectiveSampleSize(leftWeights) : leftNumeric.length;
      const rightN = normalizeAnalysisOptions(options).weightField ? effectiveSampleSize(rightWeights) : rightNumeric.length;

      let standardError: number | null = null;
      let statistic: number | null = null;
      let degreesOfFreedom: number | null = null;
      let pValue: number | null = null;
      let confidenceInterval: ConfidenceInterval | null = null;
      let effectSize: number | null = null;

      if (leftVariance !== null && rightVariance !== null && leftN > 1 && rightN > 1) {
        standardError = Math.sqrt((leftVariance / leftN) + (rightVariance / rightN));
        statistic = standardError > 0 ? (leftGroup.mean - rightGroup.mean) / standardError : null;
        const numerator = ((leftVariance / leftN) + (rightVariance / rightN)) ** 2;
        const denominator = (((leftVariance / leftN) ** 2) / Math.max(1, leftN - 1)) + (((rightVariance / rightN) ** 2) / Math.max(1, rightN - 1));
        degreesOfFreedom = denominator > 0 ? numerator / denominator : null;
        pValue = statistic === null || degreesOfFreedom === null ? null : studentTPValue(statistic, degreesOfFreedom);
        confidenceInterval = confidenceInterval95(leftGroup.mean - rightGroup.mean, standardError, degreesOfFreedom);
        const pooledVariance = ((Math.max(1, leftN - 1) * leftVariance) + (Math.max(1, rightN - 1) * rightVariance)) / Math.max(1, leftN + rightN - 2);
        effectSize = pooledVariance > 0 ? (leftGroup.mean - rightGroup.mean) / Math.sqrt(pooledVariance) : null;
      }

      pairwiseComparisons.push({
        leftGroupValue: leftGroup.groupValue,
        rightGroupValue: rightGroup.groupValue,
        meanDifference: leftGroup.mean - rightGroup.mean,
        standardError,
        statistic,
        degreesOfFreedom,
        pValue,
        adjustedPValue: null,
        confidenceInterval,
        effectSize
      });
    }
  }
  const adjustmentFactor = Math.max(1, pairwiseComparisons.length);
  pairwiseComparisons.forEach((comparison) => {
    comparison.adjustedPValue = comparison.pValue === null ? null : Math.min(1, comparison.pValue * adjustmentFactor);
  });

  return {
    outcomeField: outcome.key,
    outcomeLabel: outcome.label,
    groupField: group.key,
    groupLabel: group.label,
    caseCount: dataset.caseCount,
    validCaseCount: validPairs.length,
    missingCaseCount: dataset.caseCount - validPairs.length,
    weightedValidCaseCount: normalizeAnalysisOptions(options).weightField ? totalWeight : null,
    groups,
    anova: groups.length > 1
      ? {
        fStatistic,
        dfBetween,
        dfWithin,
        pValue,
        ssBetween,
        ssWithin,
        msBetween,
        msWithin,
        etaSquared,
        omegaSquared
      }
      : null,
    postHocComparisons: pairwiseComparisons,
    assumptions
  };
}

export function analyzeTTest(
  dataset: CaseDataset,
  outcomeField: string,
  groupField: string,
  options?: DatasetAnalysisOptions
): TTestResult {
  const compareMeans = analyzeCompareMeans(dataset, outcomeField, groupField, options);
  if (compareMeans.groups.length !== 2) {
    throw new Error('T-tests require exactly two groups.');
  }

  const normalizedOptions = normalizeAnalysisOptions(options);
  const validPairs = analysisRows(dataset, [outcomeField, groupField], options)
    .map(({ row, weight }) => ({
      outcome: row[outcomeField],
      group: row[groupField],
      weight
    }))
    .filter((row): row is { outcome: number; group: Exclude<DatasetValue, null>; weight: number } =>
      typeof row.outcome === 'number' && row.group !== null && row.weight > 0
    );

  const grouped = new Map<string, Array<{ value: number; weight: number }>>();
  for (const pair of validPairs) {
    const key = formatValue(pair.group);
    const values = grouped.get(key) ?? [];
    values.push({ value: pair.outcome, weight: pair.weight });
    grouped.set(key, values);
  }

  const left = compareMeans.groups[0]!;
  const right = compareMeans.groups[1]!;
  const leftValues = grouped.get(left.groupValue) ?? [];
  const rightValues = grouped.get(right.groupValue) ?? [];
  const leftWeights = leftValues.map((entry) => entry.weight);
  const rightWeights = rightValues.map((entry) => entry.weight);
  const leftNumeric = leftValues.map((entry) => entry.value);
  const rightNumeric = rightValues.map((entry) => entry.value);
  const leftVariance = weightedVariance(leftNumeric, leftWeights);
  const rightVariance = weightedVariance(rightNumeric, rightWeights);
  const leftN = normalizedOptions.weightField ? effectiveSampleSize(leftWeights) : leftNumeric.length;
  const rightN = normalizedOptions.weightField ? effectiveSampleSize(rightWeights) : rightNumeric.length;

  let statistic: number | null = null;
  let degreesOfFreedom: number | null = null;
  let pValue: number | null = null;
  let cohensD: number | null = null;
  let confidenceInterval: ConfidenceInterval | null = null;
  let standardError: number | null = null;

  if (leftVariance !== null && rightVariance !== null && leftN > 1 && rightN > 1) {
    standardError = Math.sqrt((leftVariance / leftN) + (rightVariance / rightN));
    statistic = standardError > 0 ? (left.mean - right.mean) / standardError : null;
    const numerator = ((leftVariance / leftN) + (rightVariance / rightN)) ** 2;
    const denominator = (((leftVariance / leftN) ** 2) / Math.max(1, leftN - 1)) + (((rightVariance / rightN) ** 2) / Math.max(1, rightN - 1));
    degreesOfFreedom = denominator > 0 ? numerator / denominator : null;
    pValue = statistic === null || degreesOfFreedom === null ? null : studentTPValue(statistic, degreesOfFreedom);
    const pooledVariance = ((Math.max(1, leftN - 1) * leftVariance) + (Math.max(1, rightN - 1) * rightVariance)) / Math.max(1, leftN + rightN - 2);
    cohensD = pooledVariance > 0 ? (left.mean - right.mean) / Math.sqrt(pooledVariance) : null;
    confidenceInterval = confidenceInterval95(left.mean - right.mean, standardError, degreesOfFreedom);
  }

  const varianceRatio = leftVariance !== null && rightVariance !== null && leftVariance > 0 && rightVariance > 0
    ? Math.max(leftVariance, rightVariance) / Math.min(leftVariance, rightVariance)
    : null;
  const assumptions: AssumptionCheck[] = [
    buildAssumptionCheck(
      'two_groups',
      'Exactly two groups',
      compareMeans.groups.length === 2 ? 'pass' : 'fail',
      compareMeans.groups.length,
      compareMeans.groups.length === 2 ? 'Two groups selected.' : 'Independent t-tests require exactly two groups.'
    ),
    buildAssumptionCheck(
      'group_size',
      'Group size',
      compareMeans.groups.every((group) => group.count >= 2) ? 'pass' : 'warn',
      Math.min(...compareMeans.groups.map((group) => group.count)),
      compareMeans.groups.every((group) => group.count >= 2) ? 'Each group has at least two cases.' : 'One or more groups have fewer than two cases.'
    ),
    buildAssumptionCheck(
      'variance_ratio',
      'Variance ratio',
      varianceRatio === null || varianceRatio <= 4 ? 'pass' : 'warn',
      varianceRatio,
      varianceRatio === null || varianceRatio <= 4 ? 'Group variances are reasonably similar.' : 'Group variances differ notably.'
    )
  ];

  return {
    outcomeField: compareMeans.outcomeField,
    outcomeLabel: compareMeans.outcomeLabel,
    groupField: compareMeans.groupField,
    groupLabel: compareMeans.groupLabel,
    caseCount: compareMeans.caseCount,
    validCaseCount: compareMeans.validCaseCount,
    weightedValidCaseCount: compareMeans.weightedValidCaseCount ?? null,
    groups: compareMeans.groups.map((group) => ({
      ...group,
      weightedCount: normalizedOptions.weightField
        ? (grouped.get(group.groupValue) ?? []).reduce((total, entry) => total + entry.weight, 0)
        : null
    })),
    statistic,
    degreesOfFreedom,
    pValue,
    meanDifference: left.mean - right.mean,
    cohensD,
    confidenceInterval,
    assumptions
  };
}

export function analyzePairedTTest(
  dataset: CaseDataset,
  beforeField: string,
  afterField: string,
  options?: DatasetAnalysisOptions
): PairedTTestResult {
  if (beforeField === afterField) {
    throw new Error('Choose two different fields for a paired t-test.');
  }

  const beforeLabel = dataset.fields.find((field) => field.key === beforeField)?.label ?? beforeField;
  const afterLabel = dataset.fields.find((field) => field.key === afterField)?.label ?? afterField;
  const normalizedOptions = normalizeAnalysisOptions(options);
  const pairs = analysisRows(dataset, [beforeField, afterField], options)
    .map(({ row, weight }) => ({
      before: row[beforeField],
      after: row[afterField],
      weight
    }))
    .filter((entry): entry is { before: number; after: number; weight: number } =>
      typeof entry.before === 'number' && typeof entry.after === 'number' && entry.weight > 0
    );

  if (pairs.length < 2) {
    throw new Error('At least two paired numeric rows are required.');
  }

  const differences = pairs.map((entry) => entry.after - entry.before);
  const weights = pairs.map((entry) => entry.weight);
  const weightedPairCount = weights.reduce((total, value) => total + value, 0);
  const effectiveN = normalizedOptions.weightField ? effectiveSampleSize(weights) : pairs.length;
  const meanDifference = weightedMean(differences, weights);
  const variance = weightedVariance(differences, weights);
  const stdDevDifference = variance === null ? null : Math.sqrt(variance);
  const standardError = meanDifference === null || stdDevDifference === null || effectiveN <= 0
    ? null
    : stdDevDifference / Math.sqrt(effectiveN);
  const degreesOfFreedom = effectiveN > 1 ? effectiveN - 1 : null;
  const statistic = meanDifference !== null && standardError !== null && standardError > 0 ? meanDifference / standardError : null;
  const pValue = statistic === null || degreesOfFreedom === null ? null : studentTPValue(statistic, degreesOfFreedom);
  const confidenceInterval = meanDifference === null ? null : confidenceInterval95(meanDifference, standardError, degreesOfFreedom);
  const beforeValues = pairs.map((entry) => entry.before);
  const afterValues = pairs.map((entry) => entry.after);
  const pairedCorrelation = beforeValues.length < 2
    ? null
    : analyzeCorrelation({
      caseCount: pairs.length,
      fields: [
        { key: 'before', label: beforeLabel, source: 'attribute', valueType: 'number' },
        { key: 'after', label: afterLabel, source: 'attribute', valueType: 'number' },
        { key: 'pair_weight', label: 'Pair Weight', source: 'attribute', valueType: 'number' }
      ],
      rows: pairs.map((entry) => ({ before: entry.before, after: entry.after, pair_weight: entry.weight })),
      notes: []
    }, 'before', 'after', normalizedOptions.weightField ? { weightField: 'pair_weight' } : undefined).pearsonR;
  const cohensDz = meanDifference !== null && stdDevDifference && stdDevDifference > 0 ? meanDifference / stdDevDifference : null;
  const differenceSkewness = skewness(differences);
  const assumptions: AssumptionCheck[] = [
    buildAssumptionCheck(
      'pair_count',
      'Paired rows',
      pairs.length >= 2 ? 'pass' : 'fail',
      pairs.length,
      pairs.length >= 2 ? 'Enough paired rows for analysis.' : 'Paired t-tests require at least two rows with both values.'
    ),
    buildAssumptionCheck(
      'difference_variation',
      'Difference variation',
      stdDevDifference !== null && stdDevDifference > 0 ? 'pass' : 'fail',
      stdDevDifference,
      stdDevDifference !== null && stdDevDifference > 0 ? 'Paired differences vary across cases.' : 'Paired differences do not vary.'
    ),
    buildAssumptionCheck(
      'difference_skewness',
      'Difference skewness',
      differenceSkewness === null || Math.abs(differenceSkewness) <= 1 ? 'pass' : 'warn',
      differenceSkewness,
      differenceSkewness === null || Math.abs(differenceSkewness) <= 1 ? 'Difference distribution is not heavily skewed.' : 'Differences are notably skewed.'
    )
  ];

  return {
    beforeField,
    beforeLabel,
    afterField,
    afterLabel,
    pairCount: pairs.length,
    weightedPairCount: normalizedOptions.weightField ? weightedPairCount : null,
    meanDifference,
    stdDevDifference,
    standardError,
    statistic,
    degreesOfFreedom,
    pValue,
    confidenceInterval,
    cohensDz,
    correlation: pairedCorrelation,
    assumptions
  };
}

export function analyzeNonparametricComparison(
  dataset: CaseDataset,
  outcomeField: string,
  groupField: string,
  options?: DatasetAnalysisOptions
): NonparametricTestResult {
  const normalizedOptions = normalizeAnalysisOptions(options);
  const pairs = analysisRows(dataset, [outcomeField, groupField], options)
    .map(({ row, weight }) => ({
      outcome: row[outcomeField],
      group: row[groupField],
      weight
    }))
    .filter((row): row is { outcome: number; group: Exclude<DatasetValue, null>; weight: number } =>
      typeof row.outcome === 'number' && row.group !== null && row.weight > 0
    );

  if (pairs.length < 2) {
    throw new Error('At least two valid rows are required for a nonparametric test.');
  }

  const groupValues = [...new Set(pairs.map((pair) => formatValue(pair.group)))].sort((left, right) => left.localeCompare(right));
  const sortedPairs = pairs
    .map((pair, index) => ({ ...pair, index }))
    .sort((left, right) => left.outcome - right.outcome);
  const weightedRanks = new Array<number>(pairs.length);
  let cumulativeWeight = 0;
  let position = 0;
  while (position < sortedPairs.length) {
    let end = position + 1;
    while (end < sortedPairs.length && sortedPairs[end]!.outcome === sortedPairs[position]!.outcome) {
      end += 1;
    }
    const blockWeight = sortedPairs.slice(position, end).reduce((total, item) => total + item.weight, 0);
    const startRank = cumulativeWeight + 1;
    const endRank = cumulativeWeight + blockWeight;
    const meanRank = (startRank + endRank) / 2;
    for (let cursor = position; cursor < end; cursor += 1) {
      weightedRanks[sortedPairs[cursor]!.index] = meanRank;
    }
    cumulativeWeight += blockWeight;
    position = end;
  }

  const rankGroups = new Map<string, Array<{ rank: number; weight: number }>>();
  for (let index = 0; index < pairs.length; index += 1) {
    const key = formatValue(pairs[index]!.group);
    const values = rankGroups.get(key) ?? [];
    values.push({ rank: weightedRanks[index]!, weight: pairs[index]!.weight });
    rankGroups.set(key, values);
  }

  const groups = groupValues.map((groupValue) => {
    const values = rankGroups.get(groupValue) ?? [];
    const weightTotal = values.reduce((total, value) => total + value.weight, 0);
    const rankTotal = values.reduce((total, value) => total + (value.rank * value.weight), 0);
    return {
      groupValue,
      count: values.length,
      weightedCount: normalizedOptions.weightField ? weightTotal : null,
      meanRank: weightTotal === 0 ? 0 : rankTotal / weightTotal
    };
  });
  const weightedValidCaseCount = normalizedOptions.weightField ? pairs.reduce((total, pair) => total + pair.weight, 0) : null;
  const assumptions: AssumptionCheck[] = [
    buildAssumptionCheck(
      'group_count',
      'Group count',
      groupValues.length >= 2 ? 'pass' : 'fail',
      groupValues.length,
      groupValues.length >= 2 ? 'Enough groups for the selected rank test.' : 'Need at least two groups.'
    )
  ];

  if (groupValues.length === 2) {
    const left = groups[0]!;
    const right = groups[1]!;
    const leftPairs = pairs.filter((pair) => formatValue(pair.group) === left.groupValue);
    const rightPairs = pairs.filter((pair) => formatValue(pair.group) === right.groupValue);
    let u1 = 0;
    for (const leftPair of leftPairs) {
      for (const rightPair of rightPairs) {
        if (leftPair.outcome > rightPair.outcome) {
          u1 += leftPair.weight * rightPair.weight;
        } else if (leftPair.outcome === rightPair.outcome) {
          u1 += 0.5 * leftPair.weight * rightPair.weight;
        }
      }
    }
    const leftWeight = leftPairs.reduce((total, pair) => total + pair.weight, 0);
    const rightWeight = rightPairs.reduce((total, pair) => total + pair.weight, 0);
    const u2 = (leftWeight * rightWeight) - u1;
    const statistic = Math.min(u1, u2);
    const meanU = (leftWeight * rightWeight) / 2;
    const stdU = Math.sqrt((leftWeight * rightWeight * (leftWeight + rightWeight + 1)) / 12);
    const zScore = stdU > 0 ? (statistic - meanU) / stdU : 0;
    const effectSize = pairs.length > 0 ? Math.abs(zScore) / Math.sqrt(pairs.length) : null;
    return {
      method: 'mann_whitney_u',
      outcomeField,
      outcomeLabel: dataset.fields.find((field) => field.key === outcomeField)?.label ?? outcomeField,
      groupField,
      groupLabel: dataset.fields.find((field) => field.key === groupField)?.label ?? groupField,
      caseCount: dataset.caseCount,
      validCaseCount: pairs.length,
      weightedValidCaseCount,
      statistic,
      pValue: stdU > 0 ? normalTwoSidedPValue(zScore) : null,
      effectSize,
      groups,
      notes: normalizedOptions.weightField
        ? ['Weighted rank handling is enabled for the Mann-Whitney comparison.']
        : [],
      assumptions
    };
  }

  const totalWeight = pairs.reduce((total, pair) => total + pair.weight, 0);
  const weightedRankSums = groups.map((group) =>
    (rankGroups.get(group.groupValue) ?? []).reduce((total, value) => total + (value.rank * value.weight), 0)
  );
  const statistic = (12 / (totalWeight * (totalWeight + 1)))
    * groups.reduce((total, group, index) => {
      const groupWeight = (rankGroups.get(group.groupValue) ?? []).reduce((inner, value) => inner + value.weight, 0);
      return total + ((weightedRankSums[index]! ** 2) / Math.max(groupWeight, 1e-12));
    }, 0)
    - (3 * (totalWeight + 1));
  const degreesOfFreedom = Math.max(1, groups.length - 1);
  return {
    method: 'kruskal_wallis',
    outcomeField,
    outcomeLabel: dataset.fields.find((field) => field.key === outcomeField)?.label ?? outcomeField,
    groupField,
    groupLabel: dataset.fields.find((field) => field.key === groupField)?.label ?? groupField,
    caseCount: dataset.caseCount,
    validCaseCount: pairs.length,
    weightedValidCaseCount,
    statistic,
    pValue: chiSquarePValue(statistic, degreesOfFreedom),
    effectSize: totalWeight > 1 ? Math.max(0, (statistic - groups.length + 1) / (totalWeight - groups.length)) : null,
    groups,
    notes: normalizedOptions.weightField
      ? ['Weighted rank handling is enabled for the Kruskal-Wallis comparison.']
      : [],
    assumptions
  };
}

export function analyzeReliability(
  dataset: CaseDataset,
  fields: string[],
  options?: DatasetAnalysisOptions,
  subscales?: Array<{ label: string; fields: string[] }>
): ReliabilityResult {
  const uniqueFields = [...new Set(fields.map((field) => field.trim()).filter(Boolean))];
  if (uniqueFields.length < 2) {
    throw new Error('Choose at least two numeric fields for reliability analysis.');
  }
  const fieldMeta = uniqueFields.map((field) => {
    const meta = dataset.fields.find((item) => item.key === field);
    if (!meta) throw new Error(`Field not found: ${field}`);
    return meta;
  });
  const rows = analysisRows(dataset, uniqueFields, {
    ...options,
    missingStrategy: 'listwise'
  })
    .map(({ row }) => uniqueFields.map((field) => row[field]))
    .filter((values): values is number[] => values.every((value) => typeof value === 'number'));
  if (rows.length < 2) {
    throw new Error('At least two complete cases are required for reliability analysis.');
  }

  const itemColumns = uniqueFields.map((_, fieldIndex) => rows.map((row) => row[fieldIndex]!));
  const itemVariances = itemColumns.map((column) => weightedVariance(column, new Array(column.length).fill(1)) ?? 0);
  const totalScores = rows.map((row) => row.reduce((total, value) => total + value, 0));
  const totalVariance = weightedVariance(totalScores, new Array(totalScores.length).fill(1));
  const itemCount = uniqueFields.length;
  const alpha = totalVariance !== null && totalVariance > 0 && itemCount > 1
    ? (itemCount / (itemCount - 1)) * (1 - (itemVariances.reduce((total, value) => total + value, 0) / totalVariance))
    : null;
  const pairwiseCorrelations: number[] = [];
  for (let leftIndex = 0; leftIndex < itemColumns.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < itemColumns.length; rightIndex += 1) {
      const correlation = pearsonCorrelation(itemColumns[leftIndex]!, itemColumns[rightIndex]!);
      if (correlation !== null) pairwiseCorrelations.push(correlation);
    }
  }
  const averageInterItemCorrelation = pairwiseCorrelations.length > 0
    ? pairwiseCorrelations.reduce((total, value) => total + value, 0) / pairwiseCorrelations.length
    : null;
  const standardizedAlpha = averageInterItemCorrelation === null
    ? null
    : (itemCount * averageInterItemCorrelation) / (1 + ((itemCount - 1) * averageInterItemCorrelation));
  const midpoint = Math.ceil(itemCount / 2);
  const splitHalfLeft = rows.map((row) => row.slice(0, midpoint).reduce((total, value) => total + value, 0));
  const splitHalfRight = rows.map((row) => row.slice(midpoint).reduce((total, value) => total + value, 0));
  const splitHalfCorrelation = midpoint < itemCount ? pearsonCorrelation(splitHalfLeft, splitHalfRight) : null;
  const spearmanBrown = splitHalfCorrelation === null || splitHalfCorrelation <= -1
    ? null
    : (2 * splitHalfCorrelation) / (1 + splitHalfCorrelation);
  const scaleMean = weightedMean(totalScores, new Array(totalScores.length).fill(1));
  const items: ReliabilityItemSummary[] = uniqueFields.map((field, fieldIndex) => {
    const values = itemColumns[fieldIndex]!;
    const remainingScores = rows.map((row) => row.reduce((total, value, index) => total + (index === fieldIndex ? 0 : value), 0));
    const remainingVariance = weightedVariance(remainingScores, new Array(remainingScores.length).fill(1));
    const alphaIfDeleted = uniqueFields.length <= 2
      ? null
      : remainingVariance !== null && remainingVariance > 0
        ? ((itemCount - 1) / (itemCount - 2)) * (1 - (itemVariances
          .filter((_, index) => index !== fieldIndex)
          .reduce((total, value) => total + value, 0) / remainingVariance))
        : null;
    return {
      field,
      label: fieldMeta[fieldIndex]!.label,
      mean: weightedMean(values, new Array(values.length).fill(1)),
      stdDev: sampleStdDev(values),
      itemTotalCorrelation: pearsonCorrelation(values, remainingScores),
      alphaIfDeleted
    };
  });

  return {
    fields: uniqueFields,
    fieldLabels: fieldMeta.map((field) => field.label),
    caseCount: dataset.caseCount,
    validCaseCount: rows.length,
    alpha,
    standardizedAlpha,
    splitHalfCorrelation,
    spearmanBrown,
    scaleMean,
    scaleVariance: totalVariance,
    items,
    subscales: Array.isArray(subscales)
      ? subscales
        .map((subscale) => ({
          label: String(subscale?.label ?? '').trim(),
          fields: Array.isArray(subscale?.fields) ? subscale.fields.map((field) => String(field ?? '').trim()).filter(Boolean) : []
        }))
        .filter((subscale) => subscale.label && subscale.fields.length >= 2)
        .map((subscale) => {
          const filteredFields = subscale.fields.filter((field) => uniqueFields.includes(field));
          if (filteredFields.length < 2) return null;
          const subscaleResult = analyzeReliability(dataset, filteredFields, options);
          return {
            label: subscale.label,
            fields: filteredFields,
            fieldLabels: subscaleResult.fieldLabels,
            validCaseCount: subscaleResult.validCaseCount,
            alpha: subscaleResult.alpha,
            standardizedAlpha: subscaleResult.standardizedAlpha,
            splitHalfCorrelation: subscaleResult.splitHalfCorrelation,
            spearmanBrown: subscaleResult.spearmanBrown
          };
        })
        .filter((subscale): subscale is NonNullable<typeof subscale> => subscale !== null)
      : [],
    notes: [
      'Reliability is computed as Cronbach alpha over complete numeric cases.',
      'Current implementation uses listwise complete rows across the selected fields.',
      'Standardized alpha and split-half reliability are also reported for quick scale review.'
    ]
  };
}

export function analyzeFactorAnalysis(
  dataset: CaseDataset,
  fields: string[],
  requestedFactorCount?: number,
  options?: DatasetAnalysisOptions,
  rotation: 'none' | 'varimax' = 'none'
): FactorAnalysisResult {
  const uniqueFields = [...new Set(fields.map((field) => field.trim()).filter(Boolean))];
  if (uniqueFields.length < 2) {
    throw new Error('Choose at least two numeric fields for factor analysis.');
  }
  const fieldMeta = uniqueFields.map((field) => {
    const meta = dataset.fields.find((item) => item.key === field);
    if (!meta) throw new Error(`Field not found: ${field}`);
    return meta;
  });
  const rows = analysisRows(dataset, uniqueFields, {
    ...options,
    missingStrategy: 'listwise'
  })
    .map(({ row }) => uniqueFields.map((field) => row[field]))
    .filter((values): values is number[] => values.every((value) => typeof value === 'number'));
  if (rows.length < 3) {
    throw new Error('At least three complete cases are required for factor analysis.');
  }

  const columns = uniqueFields.map((_, fieldIndex) => rows.map((row) => row[fieldIndex]!));
  const correlationMatrix = columns.map((columnA, rowIndex) =>
    columns.map((columnB, columnIndex) => {
      if (rowIndex === columnIndex) return 1;
      const correlation = pearsonCorrelation(columnA, columnB);
      return correlation ?? 0;
    })
  );
  const matrixSize = correlationMatrix.length;
  const workingMatrix = cloneMatrix(correlationMatrix);
  const extracted: Array<{ eigenvalue: number; eigenvector: number[] }> = [];
  for (let index = 0; index < matrixSize; index += 1) {
    const component = powerIterationSymmetric(workingMatrix);
    if (!(component.eigenvalue > 1e-6)) break;
    extracted.push(component);
    const deflationComponent = outerProduct(component.eigenvector, component.eigenvalue);
    const nextMatrix = deflateMatrix(workingMatrix, deflationComponent);
    for (let rowIndex = 0; rowIndex < nextMatrix.length; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < nextMatrix.length; columnIndex += 1) {
        workingMatrix[rowIndex]![columnIndex] = nextMatrix[rowIndex]![columnIndex]!;
      }
    }
  }
  const eigenvalues = extracted.map((component) => component.eigenvalue);
  const recommendedFactorCount = Math.max(1, eigenvalues.filter((value) => value >= 1).length || Math.min(1, extracted.length));
  let factorCount = Math.min(
    Math.max(1, Math.floor(requestedFactorCount ?? Math.min(recommendedFactorCount, matrixSize))),
    extracted.length
  );
  if (factorCount === 0) {
    throw new Error('Factor extraction did not converge on a usable component.');
  }

  const totalEigenvalue = matrixSize;
  const baseLoadingMatrix = uniqueFields.map((field, fieldIndex) =>
    extracted.slice(0, factorCount).map((component) =>
      component.eigenvector[fieldIndex]! * Math.sqrt(Math.max(component.eigenvalue, 0))
    )
  );
  const rotatedLoadingMatrix = rotation === 'varimax'
    ? applyVarimaxRotation(baseLoadingMatrix)
    : baseLoadingMatrix.map((row) => [...row]);
  const communalities = new Array<number>(matrixSize).fill(0);
  for (let fieldIndex = 0; fieldIndex < matrixSize; fieldIndex += 1) {
    communalities[fieldIndex] = rotatedLoadingMatrix[fieldIndex]!.reduce((total, value) => total + (value ** 2), 0);
  }
  let cumulativeVarianceExplained = 0;
  const factors = Array.from({ length: factorCount }, (_unused, factorIndex) => {
    const eigenvalue = rotatedLoadingMatrix.reduce((total, row) => total + ((row[factorIndex] ?? 0) ** 2), 0);
    const varianceExplained = eigenvalue / totalEigenvalue;
    cumulativeVarianceExplained += varianceExplained;
    const loadings: FactorLoading[] = uniqueFields.map((field, fieldIndex) => ({
      field,
      label: fieldMeta[fieldIndex]!.label,
      loading: rotatedLoadingMatrix[fieldIndex]![factorIndex] ?? 0,
      communality: communalities[fieldIndex]!,
      uniqueness: Math.max(0, 1 - communalities[fieldIndex]!)
    }));
    return {
      factor: factorIndex + 1,
      eigenvalue,
      varianceExplained,
      cumulativeVarianceExplained,
      loadings
    };
  });

  return {
    fields: uniqueFields,
    fieldLabels: fieldMeta.map((field) => field.label),
    caseCount: dataset.caseCount,
    validCaseCount: rows.length,
    factorCount,
    recommendedFactorCount,
    extraction: 'principal_components',
    rotation,
    eigenvalues,
    factors,
    correlationMatrix: correlationMatrix.map((values, index) => ({
      field: uniqueFields[index]!,
      values
    })),
    notes: [
      'Current factor analysis is a first-pass principal-components extraction.',
      'Kaiser-style factor count recommendation is based on eigenvalues greater than or equal to 1.',
      rotation === 'varimax'
        ? 'Varimax rotation is applied as a first-pass orthogonal rotation.'
        : 'Rotation is not applied in this version.'
    ]
  };
}
