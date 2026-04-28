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
  testType: 'fisher_2x2' | 'binomial' | 'mcnemar' | 'sign' | 'wilcoxon_signed_rank' | 'runs';
  rowField: string | null;
  rowLabel: string | null;
  columnField: string | null;
  columnLabel: string | null;
  caseCount: number;
  validCaseCount: number;
  table: {
    rowValues: string[];
    columnValues: string[];
    cells: Array<{ rowValue: string; columnValue: string; count: number }>;
  };
  method:
    | 'fisher_exact_2x2'
    | 'chi_square_only'
    | 'binomial_exact'
    | 'mcnemar_exact'
    | 'sign_test_exact'
    | 'wilcoxon_signed_rank_exact'
    | 'runs_exact';
  fisherExact?: {
    pValueTwoSided: number | null;
    pValueLeft: number | null;
    pValueRight: number | null;
    oddsRatio: number | null;
  } | null;
  binomialExact?: {
    field: string;
    label: string;
    successValue: string;
    nullProportion: number;
    successCount: number;
    failureCount: number;
    observedProportion: number | null;
    confidenceInterval: ConfidenceInterval | null;
    pValueTwoSided: number | null;
    pValueLeft: number | null;
    pValueRight: number | null;
  } | null;
  mcnemarExact?: {
    beforeField: string;
    beforeLabel: string;
    afterField: string;
    afterLabel: string;
    positiveValue: string;
    concordantPositive: number;
    concordantNegative: number;
    discordantPositiveToNegative: number;
    discordantNegativeToPositive: number;
    statistic: number | null;
    pValueTwoSided: number | null;
    pValueLeft: number | null;
    pValueRight: number | null;
    oddsRatio: number | null;
  } | null;
  signTest?: {
    beforeField: string;
    beforeLabel: string;
    afterField: string;
    afterLabel: string;
    positiveCount: number;
    negativeCount: number;
    tieCount: number;
    medianDifference: number | null;
    pValueTwoSided: number | null;
    pValueLeft: number | null;
    pValueRight: number | null;
  } | null;
  wilcoxonExact?: {
    beforeField: string;
    beforeLabel: string;
    afterField: string;
    afterLabel: string;
    pairCount: number;
    nonZeroPairs: number;
    positiveRankSum: number;
    negativeRankSum: number;
    statisticW: number;
    zScore: number | null;
    pValueTwoSidedExact: number | null;
    pValueTwoSidedAsymptotic: number | null;
    continuityCorrectionApplied: boolean;
    effectSizeR: number | null;
  } | null;
  runsExact?: {
    field: string;
    label: string;
    runCount: number;
    positiveCount: number;
    negativeCount: number;
    expectedRuns: number | null;
    varianceRuns: number | null;
    zScore: number | null;
    pValueTwoSided: number | null;
    medianCutpoint: number | null;
  } | null;
  chiSquare: DatasetCrosstab['chiSquare'];
  notes: string[];
};

export type ExactTestInput = {
  testType?: 'fisher_2x2' | 'binomial' | 'mcnemar' | 'sign' | 'wilcoxon_signed_rank' | 'runs';
  rowField?: string | null;
  columnField?: string | null;
  binaryField?: string | null;
  successValue?: DatasetValue;
  nullProportion?: number;
  beforeField?: string | null;
  afterField?: string | null;
  positiveValue?: DatasetValue;
  continuityCorrection?: boolean;
  exactThreshold?: number;
};

export type ConjointAttributeLevel = {
  level: string;
  count: number;
  meanScore: number | null;
  utility: number | null;
};

export type ConjointAttributeSummary = {
  field: string;
  label: string;
  levels: ConjointAttributeLevel[];
  range: number | null;
  importance: number | null;
};

export type ConjointProfileEstimate = {
  caseId: string | null;
  caseLabel: string | null;
  holdout: boolean;
  observedScore: number;
  predictedScore: number;
  residual: number;
  attributes: Record<string, string>;
};

export type ConjointResult = {
  profileField: string | null;
  profileLabel: string | null;
  ratingField: string;
  ratingLabel: string;
  attributeFields: string[];
  attributeLabels: string[];
  caseCount: number;
  usableCaseCount: number;
  holdoutCount: number;
  overallMean: number | null;
  meanAbsoluteError: number | null;
  rootMeanSquaredError: number | null;
  pearsonCorrelation: number | null;
  attributes: ConjointAttributeSummary[];
  profiles: ConjointProfileEstimate[];
  notes: string[];
};

export type OptimalScalingLevel = {
  level: string;
  count: number;
  quantification: number;
  anchorMean: number | null;
};

export type OptimalScalingFieldSummary = {
  field: string;
  label: string;
  discrimination: number | null;
  levels: OptimalScalingLevel[];
};

export type OptimalScalingCaseScore = {
  caseId: string | null;
  caseLabel: string | null;
  score: number;
  values: Record<string, string>;
};

export type OptimalScalingResult = {
  method: 'alternating_least_squares_single_dimension';
  fields: string[];
  fieldLabels: string[];
  anchorField: string | null;
  anchorLabel: string | null;
  caseCount: number;
  usableCaseCount: number;
  iterations: number;
  eigenvalue: number | null;
  varianceExplained: number | null;
  fieldSummaries: OptimalScalingFieldSummary[];
  caseScores: OptimalScalingCaseScore[];
  notes: string[];
};

export type DirectMarketingCustomerScore = {
  caseId: string | null;
  caseLabel: string | null;
  customerId: string;
  recencyScore: number | null;
  frequencyScore: number | null;
  monetaryScore: number | null;
  propensity: number;
  response: number | null;
  segment: string;
};

export type DirectMarketingSegmentSummary = {
  segment: string;
  count: number;
  averagePropensity: number;
  responseRate: number | null;
  averageRecency: number | null;
  averageFrequency: number | null;
  averageMonetary: number | null;
};

export type DirectMarketingDecile = {
  decile: number;
  count: number;
  cumulativeCount: number;
  responders: number;
  cumulativeResponders: number;
  responseRate: number | null;
  lift: number | null;
  averagePropensity: number;
};

export type DirectMarketingResult = {
  customerField: string | null;
  customerLabel: string | null;
  responseField: string | null;
  responseLabel: string | null;
  recencyField: string | null;
  recencyLabel: string | null;
  frequencyField: string | null;
  frequencyLabel: string | null;
  monetaryField: string | null;
  monetaryLabel: string | null;
  caseCount: number;
  usableCaseCount: number;
  overallResponseRate: number | null;
  scoringWeights: {
    recency: number;
    frequency: number;
    monetary: number;
    response: number;
  };
  segments: DirectMarketingSegmentSummary[];
  deciles: DirectMarketingDecile[];
  customerScores: DirectMarketingCustomerScore[];
  topRecommendations: string[];
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

export type ImputationMethod =
  | 'mean'
  | 'median'
  | 'mode'
  | 'constant'
  | 'random_hot_deck'
  | 'predictive_mean_matching'
  | 'logistic_binary';

export type ImputationStrategy = {
  field: string;
  method: ImputationMethod;
  value?: DatasetValue;
  predictorFields?: string[];
  nearestNeighbors?: number;
  donorField?: string;
};

export type ImputationPlanResult = {
  caseCount: number;
  strategies: Array<{
    field: string;
    label: string;
    method: ImputationMethod;
    value: DatasetValue;
    replacements: number;
  }>;
  dataset: CaseDataset;
  notes: string[];
};

export type MultipleImputationConfig = {
  imputations?: number;
  randomSeed?: number;
  includeOriginalDataset?: boolean;
  confidenceLevel?: number;
  chainIterations?: number;
};

export type MultipleImputationPlanResult = {
  caseCount: number;
  imputationsRequested: number;
  imputationsGenerated: number;
  randomSeed: number;
  datasets: Array<{
    imputationIndex: number;
    dataset: CaseDataset;
    totalReplacements: number;
    replacementByField: Record<string, number>;
  }>;
  notes: string[];
};

export type MultipleImputationTarget =
  | {
    procedure: 'regression';
    dependentField: string;
    predictorFields: string[];
    model?: RegressionModel;
  }
  | {
    procedure: 't_test';
    outcomeField: string;
    groupField: string;
  }
  | {
    procedure: 'paired_t_test';
    beforeField: string;
    afterField: string;
  }
  | {
    procedure: 'compare_means';
    outcomeField: string;
    groupField: string;
  }
  | {
    procedure: 'correlation';
    xField: string;
    yField: string;
  };

export type MultipleImputationPooledEstimate = {
  term: string;
  estimate: number | null;
  withinVariance: number | null;
  betweenVariance: number | null;
  totalVariance: number | null;
  standardError: number | null;
  degreesOfFreedom: number | null;
  statistic: number | null;
  pValue: number | null;
  confidenceInterval: ConfidenceInterval | null;
  fractionMissingInformation: number | null;
  relativeIncreaseInVariance: number | null;
};

export type MultipleImputationAnalysisResult = {
  procedure: MultipleImputationTarget['procedure'];
  imputationsRequested: number;
  imputationsUsed: number;
  randomSeed: number;
  pooledEstimates: MultipleImputationPooledEstimate[];
  pooledScalars: Record<string, number | null>;
  perImputation: Array<{
    imputationIndex: number;
    result: unknown;
  }>;
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

export type ForecastMethod =
  | 'auto'
  | 'linear_trend'
  | 'moving_average'
  | 'exponential_smoothing'
  | 'arima_auto'
  | 'ets_auto';

export type ForecastSettings = {
  method?: ForecastMethod;
  movingAverageWindow?: number;
  smoothingAlpha?: number;
  smoothingBeta?: number;
  dampingPhi?: number;
  holdoutFraction?: number;
  confidenceLevel?: number;
  ljungBoxLags?: number;
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
  method: ForecastMethod;
  requestedMethod: ForecastMethod;
  methodSettings: {
    movingAverageWindow: number | null;
    smoothingAlpha: number | null;
    smoothingBeta: number | null;
    dampingPhi: number | null;
    arOrder: number | null;
    differencing: number | null;
  };
  caseCount: number;
  horizon: number;
  intercept: number;
  slope: number;
  metrics: {
    meanAbsoluteError: number | null;
    rootMeanSquaredError: number | null;
    meanAbsolutePercentageError: number | null;
    rSquared: number | null;
    aic: number | null;
    bic: number | null;
  };
  diagnostics: {
    durbinWatson: number | null;
    ljungBoxQ: number | null;
    ljungBoxPValue: number | null;
    residualAutocorrelationLag1: number | null;
    residualMean: number | null;
    residualSkewness: number | null;
    residualKurtosis: number | null;
    holdoutCaseCount: number;
    holdoutMeanAbsoluteError: number | null;
    holdoutRootMeanSquaredError: number | null;
    seasonalityStrength: number | null;
    trendStrength: number | null;
  };
  modelSelection: Array<{
    method: ForecastMethod;
    aic: number | null;
    bic: number | null;
    meanAbsoluteError: number | null;
    rootMeanSquaredError: number | null;
  }>;
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
  method: 'cart' | 'random_forest';
  targetField: string;
  targetLabel: string;
  predictorFields: string[];
  predictorLabels: string[];
  caseCount: number;
  treeCount: number;
  maxDepth: number;
  tree: DecisionTreeNode;
  accuracy: number | null;
  balancedAccuracy: number | null;
  oobAccuracy: number | null;
  featureImportance: Array<{
    field: string;
    label: string;
    importance: number;
  }>;
  confusionMatrix: Array<{
    actual: string;
    predicted: string;
    count: number;
  }>;
  notes: string[];
};

export type GeneralLinearModelFamily = 'gaussian' | 'binomial' | 'poisson';
export type GeneralLinearModelLink = 'identity' | 'logit' | 'log' | 'probit' | 'cloglog' | 'sqrt';
export type GeneralLinearModelCovarianceEstimator = 'model' | 'robust';

export type GeneralLinearModelOptions = {
  family?: GeneralLinearModelFamily;
  link?: GeneralLinearModelLink;
  maxIterations?: number;
  tolerance?: number;
  confidenceLevel?: number;
  covarianceEstimator?: GeneralLinearModelCovarianceEstimator;
};

export type GeneralLinearModelCoefficient = RegressionCoefficient & {
  label: string;
  termType: 'intercept' | 'covariate' | 'factor';
  termField?: string;
};

export type GeneralLinearModelResult = {
  dependentField: string;
  dependentLabel: string;
  family: GeneralLinearModelFamily;
  link: GeneralLinearModelLink;
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
    deviance: number | null;
    nullDeviance: number | null;
    aic: number | null;
    bic: number | null;
  };
  terms: Array<{
    field: string;
    label: string;
    type: 'factor' | 'covariate';
    baseline?: string;
    levels?: string[];
  }>;
  observations: RegressionObservation[];
  influenceSummary: RegressionInfluenceRow[];
  assumptions: AssumptionCheck[];
  diagnostics: Record<string, number | null>;
  modelOptions: {
    maxIterations: number;
    tolerance: number;
    confidenceLevel: number;
    covarianceEstimator: GeneralLinearModelCovarianceEstimator;
  };
  notes: string[];
};

export type MixedModelCovarianceStructure = 'independent' | 'compound_symmetry';

export type MixedModelOptions = {
  randomSlopeFields?: string[];
  covarianceStructure?: MixedModelCovarianceStructure;
  estimationMethod?: 'ml' | 'reml';
  confidenceLevel?: number;
};

export type MixedModelCoefficient = RegressionCoefficient & {
  label: string;
  termType: 'intercept' | 'fixed';
  termField?: string;
};

export type MixedModelGroupEffect = {
  groupValue: string;
  caseCount: number;
  weightedCount: number;
  randomIntercept: number;
  randomSlopes?: Record<string, number>;
  standardError: number | null;
};

export type MixedModelObservation = {
  caseId: string | null;
  caseLabel: string | null;
  groupValue: string;
  actual: number;
  fixedPredicted: number;
  mixedPredicted: number;
  residual: number;
  standardizedResidual: number | null;
  leverage: number | null;
  cooksDistance: number | null;
  outlier: boolean;
};

export type MixedModelResult = {
  dependentField: string;
  dependentLabel: string;
  predictorFields: string[];
  predictorLabels: string[];
  groupField: string;
  groupLabel: string;
  caseCount: number;
  groupCount: number;
  coefficients: MixedModelCoefficient[];
  groupEffects: MixedModelGroupEffect[];
  observations: MixedModelObservation[];
  influenceSummary: RegressionInfluenceRow[];
  metrics: {
    weightedCaseCount: number;
    betweenGroupVariance: number | null;
    withinGroupVariance: number | null;
    intraclassCorrelation: number | null;
    residualStdError: number | null;
    rSquaredMarginal: number | null;
    rSquaredConditional: number | null;
    logLikelihood: number | null;
    aic: number | null;
    bic: number | null;
    covarianceStructure: MixedModelCovarianceStructure;
    estimationMethod: 'ml' | 'reml';
    randomEffectParameterCount: number;
  };
  assumptions: AssumptionCheck[];
  diagnostics: Record<string, number | null>;
  modelOptions: {
    randomSlopeFields: string[];
    covarianceStructure: MixedModelCovarianceStructure;
    estimationMethod: 'ml' | 'reml';
    confidenceLevel: number;
  };
  notes: string[];
};

export type GeeFamily = 'gaussian' | 'binomial' | 'poisson';
export type GeeLink = 'identity' | 'log' | 'sqrt' | 'logit' | 'probit' | 'cloglog';
export type GeeCorrelationStructure = 'independence' | 'exchangeable' | 'ar1';

export type GeeModelOptions = {
  link?: GeeLink;
  maxIterations?: number;
  tolerance?: number;
  confidenceLevel?: number;
  smallSampleCorrection?: boolean;
};

export type GeeCoefficient = RegressionCoefficient & {
  label: string;
  termType: 'intercept' | 'predictor';
  termField?: string;
  modelStandardError: number | null;
  robustStandardError: number | null;
};

export type GeeObservation = {
  caseId: string | null;
  caseLabel: string | null;
  clusterValue: string;
  actual: number;
  predicted: number;
  residual: number;
  standardizedResidual?: number | null;
  leverage?: number | null;
  cooksDistance?: number | null;
  devianceResidual?: number | null;
  predictedClass?: number | null;
  outlier?: boolean;
};

export type GeeResult = {
  dependentField: string;
  dependentLabel: string;
  predictorFields: string[];
  predictorLabels: string[];
  clusterField: string;
  clusterLabel: string;
  family: GeeFamily;
  link: GeeLink;
  correlation: GeeCorrelationStructure;
  caseCount: number;
  clusterCount: number;
  coefficients: GeeCoefficient[];
  observations: GeeObservation[];
  metrics: {
    weightedCaseCount: number;
    meanClusterSize: number;
    minClusterSize: number;
    maxClusterSize: number;
    workingCorrelation: number | null;
    quasiLikelihood: number | null;
    rSquared: number | null;
    pseudoRSquared: number | null;
    modelStatistic: number | null;
    modelPValue: number | null;
    qic: number | null;
    qicu: number | null;
  };
  assumptions: AssumptionCheck[];
  diagnostics: Record<string, number | null>;
  thresholdAnalysis?: RegressionThresholdMetric[];
  calibration?: {
    bins: RegressionCalibrationBin[];
    meanAbsoluteCalibrationError: number | null;
    maxCalibrationGap: number | null;
    calibrationIntercept: number | null;
    calibrationSlope: number | null;
    bestThresholdByF1: number | null;
    bestThresholdByYouden: number | null;
  };
  modelOptions: {
    maxIterations: number;
    tolerance: number;
    confidenceLevel: number;
    smallSampleCorrection: boolean;
  };
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
    mauchlyW: number | null;
    mauchlyPValue: number | null;
    greenhouseGeisserEpsilon: number | null;
    huynhFeldtEpsilon: number | null;
    pValueGreenhouseGeisser: number | null;
    pValueHuynhFeldt: number | null;
  } | null;
  assumptions: AssumptionCheck[];
  notes: string[];
};

export type CoxCoefficient = RegressionCoefficient & {
  label: string;
  termType: 'intercept' | 'predictor';
  termField?: string;
};

export type CoxResult = {
  predictorFields: string[];
  predictorLabels: string[];
  coefficients: CoxCoefficient[];
  baselineHazard: Array<{
    time: number;
    events: number;
    riskSetCount: number;
    hazardIncrement: number;
    cumulativeHazard: number;
    baselineSurvival: number;
  }>;
  concordance: number | null;
  logLikelihood: number | null;
  nullLogLikelihood: number | null;
  likelihoodRatioChiSquare: number | null;
  likelihoodRatioPValue: number | null;
  notes: string[];
};

export type SurvivalStep = {
  groupValue: string;
  time: number;
  atRisk: number;
  events: number;
  censored: number;
  survival: number;
  standardError: number | null;
  confidenceLower: number | null;
  confidenceUpper: number | null;
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
  landmarkSurvival: Array<{
    groupValue: string;
    time: number;
    survival: number | null;
  }>;
  restrictedMeanSurvival: Array<{
    groupValue: string;
    rmst: number | null;
    tau: number;
  }>;
  cox: CoxResult | null;
  proportionalHazardsDiagnostics: Array<{
    field: string;
    label: string;
    schoenfeldCorrelation: number | null;
    pValue: number | null;
  }>;
  modelSelection: Array<{
    model: string;
    logLikelihood: number | null;
    aic: number | null;
    bic: number | null;
  }>;
  diagnostics?: Record<string, number | null>;
  options: {
    confidenceLevel: number;
    tieMethod: 'breslow' | 'efron';
    landmarkTimes: number[];
  };
  notes: string[];
};

export type SurvivalAnalysisSettings = {
  confidenceLevel?: number;
  tieMethod?: 'breslow' | 'efron';
  landmarkTimes?: number[];
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
    varianceEstimator: 'linearization' | 'replicate';
    replicateWeightCount: number;
    finitePopulationCorrectionField: string | null;
  };
  estimates: ComplexSampleEstimate[];
  modelOptions: {
    varianceEstimator: 'linearization' | 'replicate';
    replicateWeightFields: string[];
    finitePopulationCorrectionField: string | null;
  };
  notes: string[];
};

export type ComplexSamplesOptions = DatasetAnalysisOptions & {
  strataField?: string;
  clusterField?: string;
  groupField?: string;
  varianceEstimator?: 'linearization' | 'replicate';
  replicateWeightFields?: string[];
  finitePopulationCorrectionField?: string;
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
    validationAccuracy?: number | null;
    rootMeanSquaredError?: number | null;
    validationRootMeanSquaredError?: number | null;
    meanAbsoluteError?: number | null;
    validationMeanAbsoluteError?: number | null;
    rSquared?: number | null;
    validationRSquared?: number | null;
    trainingLoss?: number | null;
    validationLoss?: number | null;
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

export type NeuralNetworkOptions = {
  hiddenUnits?: number;
  learningRate?: number;
  epochs?: number;
  l2Penalty?: number;
  validationSplit?: number;
  seed?: number;
};

export type SyntaxCommandResult = {
  command: string;
  commandName: string;
  status: 'ok' | 'error';
  outputKind: 'descriptives' | 'frequencies' | 'crosstab' | 'correlations' | 'regression' | 'dataset' | 'message';
  message: string;
  output?: unknown;
};

export type SyntaxOutputTreeNode = {
  id: string;
  parentId: string | null;
  level: number;
  nodeType: 'group' | 'command' | 'table' | 'chart';
  title: string;
  commandName: string;
  outputKind: SyntaxCommandResult['outputKind'];
  subtype: string;
  sequence: number;
  capturedAt: string;
};

export type SyntaxOutputTableModel = {
  id: string;
  title: string;
  commandName: string;
  outputKind: SyntaxCommandResult['outputKind'];
  columns: string[];
  rows: Array<Record<string, DatasetValue>>;
  rowCount: number;
  columnCount: number;
  numericColumnCount: number;
  categoricalColumnCount: number;
  pivotable: boolean;
};

export type SyntaxChartTemplateType = 'bar' | 'line' | 'scatter' | 'area' | 'histogram' | 'boxplot';

export type SyntaxChartTemplate = {
  id: string;
  title: string;
  chartType: SyntaxChartTemplateType;
  sourceTableId: string;
  xField: string;
  yField: string;
  xScale: 'categorical' | 'numeric';
  palette: 'sand' | 'ocean' | 'forest' | 'ember';
};

export type SyntaxOutputDocumentModel = {
  name: string;
  generatedAt: string;
  recordCount: number;
  tree: SyntaxOutputTreeNode[];
  tables: SyntaxOutputTableModel[];
  chartTemplates: SyntaxChartTemplate[];
};

export type SyntaxOutputPack = {
  version: 1;
  generatedAt: string;
  syntaxHash: string;
  commandCount: number;
  successfulCommandCount: number;
  activeDocumentName: string;
  documentNames: string[];
  documents: Record<string, SyntaxOutputDocumentModel>;
};

export type SyntaxRunResult = {
  syntax: string;
  commandCount: number;
  successfulCommandCount: number;
  results: SyntaxCommandResult[];
  activeDatasetName: string;
  datasetNames: string[];
  splitFields: string[];
  finalDatasetSummary: {
    caseCount: number;
    fieldCount: number;
    fields: string[];
  };
  outputDocument: SyntaxOutputDocumentModel;
  outputDocuments: SyntaxOutputDocumentModel[];
  outputPack: SyntaxOutputPack;
  notes: string[];
};

export type SyntaxExtensionInvocation = {
  command: string;
  commandName: string;
  args: string;
  body: string[];
  dataset: CaseDataset;
  analysisOptions: Required<DatasetAnalysisOptions>;
};

export type SyntaxExtensionResult = {
  status?: 'ok' | 'error';
  outputKind?: SyntaxCommandResult['outputKind'];
  message?: string;
  output?: unknown;
  dataset?: CaseDataset | null;
};

export type SyntaxExtensionHandler = (invocation: SyntaxExtensionInvocation) => SyntaxExtensionResult;

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
  robustStandardError?: number | null;
  robustStatistic?: number | null;
  robustPValue?: number | null;
  robustConfidenceInterval?: ConfidenceInterval | null;
  oddsRatio?: number | null;
  oddsRatioConfidenceInterval?: ConfidenceInterval | null;
  robustOddsRatioConfidenceInterval?: ConfidenceInterval | null;
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

export type RegressionMulticollinearityRow = {
  field: string;
  vif: number | null;
  tolerance: number | null;
};

export type RegressionInfluenceRow = {
  caseId: string | null;
  caseLabel: string | null;
  leverage: number | null;
  cooksDistance: number | null;
  standardizedResidual: number | null;
  devianceResidual: number | null;
};

export type RegressionThresholdMetric = {
  threshold: number;
  weightedCount: number;
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  specificity: number | null;
  f1Score: number | null;
  youdenJ: number | null;
};

export type RegressionCalibrationBin = {
  bin: string;
  minProbability: number;
  maxProbability: number;
  count: number;
  weightedCount: number;
  observedRate: number | null;
  predictedRate: number | null;
  calibrationGap: number | null;
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
  multicollinearity?: RegressionMulticollinearityRow[];
  influenceSummary?: RegressionInfluenceRow[];
  assumptions?: AssumptionCheck[];
  thresholdAnalysis?: RegressionThresholdMetric[];
  calibration?: {
    bins: RegressionCalibrationBin[];
    meanAbsoluteCalibrationError: number | null;
    maxCalibrationGap: number | null;
    calibrationIntercept: number | null;
    calibrationSlope: number | null;
    bestThresholdByF1: number | null;
    bestThresholdByYouden: number | null;
  };
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
  method: 'mann_whitney_u' | 'kruskal_wallis' | 'wilcoxon_signed_rank' | 'friedman' | 'median_test' | 'runs_test';
  outcomeField: string;
  outcomeLabel: string;
  groupField: string;
  groupLabel: string;
  caseCount: number;
  validCaseCount: number;
  weightedValidCaseCount?: number | null;
  statistic: number;
  degreesOfFreedom?: number | null;
  pValue: number | null;
  exactPValue?: number | null;
  asymptoticPValue?: number | null;
  zScore?: number | null;
  effectSize?: number | null;
  effectSizeLabel?: string | null;
  tieCount?: number | null;
  continuityCorrectionApplied?: boolean;
  diagnostics?: Record<string, number | string | null>;
  groups: Array<{
    groupValue: string;
    count: number;
    weightedCount?: number | null;
    meanRank: number;
  }>;
  notes: string[];
  assumptions?: AssumptionCheck[];
};

export type NonparametricComparisonOptions = DatasetAnalysisOptions & {
  method?: NonparametricTestResult['method'];
  beforeField?: string;
  relatedFields?: string[];
  exact?: boolean;
  continuityCorrection?: boolean;
};

export type ReliabilityItemSummary = {
  field: string;
  label: string;
  mean: number | null;
  stdDev: number | null;
  itemTotalCorrelation: number | null;
  alphaIfDeleted: number | null;
};

export type ReliabilitySubscaleSummary = {
  label: string;
  fields: string[];
  fieldLabels: string[];
  validCaseCount: number;
  itemCount: number;
  alpha: number | null;
  alphaConfidenceInterval: ConfidenceInterval | null;
  standardizedAlpha: number | null;
  standardizedAlphaConfidenceInterval: ConfidenceInterval | null;
  omegaTotal: number | null;
  averageInterItemCorrelation: number | null;
  splitHalfCorrelation: number | null;
  spearmanBrown: number | null;
  standardErrorOfMeasurement: number | null;
};

export type ReliabilityStrataSummary = {
  groupValue: string;
  caseCount: number;
  validCaseCount: number;
  itemCount: number;
  alpha: number | null;
  alphaConfidenceInterval: ConfidenceInterval | null;
  standardizedAlpha: number | null;
  standardizedAlphaConfidenceInterval: ConfidenceInterval | null;
  omegaTotal: number | null;
  averageInterItemCorrelation: number | null;
  splitHalfCorrelation: number | null;
  spearmanBrown: number | null;
  standardErrorOfMeasurement: number | null;
  notes: string[];
};

export type ReliabilityResult = {
  fields: string[];
  fieldLabels: string[];
  caseCount: number;
  validCaseCount: number;
  itemCount: number;
  alpha: number | null;
  alphaConfidenceInterval: ConfidenceInterval | null;
  standardizedAlpha: number | null;
  standardizedAlphaConfidenceInterval: ConfidenceInterval | null;
  omegaTotal: number | null;
  averageInterItemCorrelation: number | null;
  splitHalfCorrelation: number | null;
  spearmanBrown: number | null;
  scaleMean: number | null;
  scaleVariance: number | null;
  standardErrorOfMeasurement: number | null;
  items: ReliabilityItemSummary[];
  subscales?: ReliabilitySubscaleSummary[];
  stratifiedByField: string | null;
  stratifiedByLabel: string | null;
  strata: ReliabilityStrataSummary[];
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

export type FactorScoreSummary = {
  factor: number;
  mean: number | null;
  stdDev: number | null;
  min: number | null;
  max: number | null;
};

export type FactorScoreCase = {
  caseId: string;
  caseLabel: string;
  scores: number[];
};

export type FactorRotation = 'none' | 'varimax' | 'quartimax' | 'promax';

export type FactorAnalysisOptions = {
  maxIterations?: number;
  convergenceTolerance?: number;
  parallelAnalysisSamples?: number;
  confidenceLevel?: number;
};

export type FactorDiagnostics = {
  correlationDeterminant: number | null;
  kmoOverall: number | null;
  kmoPerField: Array<{
    field: string;
    label: string;
    kmo: number | null;
  }>;
  bartlettTest: {
    chiSquare: number | null;
    degreesOfFreedom: number;
    pValue: number | null;
  };
  residualRmsr: number | null;
  totalCommunality: number | null;
  heywoodCount: number;
  factorCorrelationMatrix: number[][] | null;
  patternMatrix: number[][] | null;
  structureMatrix: number[][] | null;
  parallelAnalysisRecommendedFactorCount: number | null;
  parallelAnalysisReferenceEigenvalues: number[] | null;
  extractionIterations: number;
  extractionConverged: boolean;
};

export type FactorAnalysisResult = {
  fields: string[];
  fieldLabels: string[];
  caseCount: number;
  validCaseCount: number;
  factorCount: number;
  recommendedFactorCount: number;
  extraction: 'principal_components' | 'principal_axis';
  rotation: FactorRotation;
  eigenvalues: number[];
  factors: FactorSummary[];
  factorScoreSummary: FactorScoreSummary[];
  factorScoreCaseCount: number;
  factorScoreSample: FactorScoreCase[];
  factorScoreSampleLimit: number;
  correlationMatrix: Array<{ field: string; values: number[] }>;
  diagnostics: FactorDiagnostics;
  modelOptions: {
    maxIterations: number;
    convergenceTolerance: number;
    parallelAnalysisSamples: number;
    confidenceLevel: number;
  };
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
  const normalizedMissing = missingValues.map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (normalizedMissing.length > 0) {
    const asText = formatValue(rawValue).trim().toLowerCase();
    if (normalizedMissing.includes(asText)) {
      return null;
    }
  }
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (trimmed.length === 0) return null;
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

function normalPdf(value: number): number {
  return Math.exp(-0.5 * (value ** 2)) / Math.sqrt(2 * Math.PI);
}

function inverseNormalCdf(probability: number): number {
  const p = Number(probability);
  if (!(p > 0 && p < 1)) {
    if (p === 0) return Number.NEGATIVE_INFINITY;
    if (p === 1) return Number.POSITIVE_INFINITY;
    return Number.NaN;
  }
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  const high = 1 - low;
  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!)
      / ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  if (p > high) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!)
      / ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q
    / (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
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

function computeRocAucConfidenceInterval(
  probabilities: number[],
  outcomes: number[],
  weights?: number[],
  confidenceLevel = 0.95
): ConfidenceInterval | null {
  const auc = computeRocAuc(probabilities, outcomes, weights);
  if (auc === null || !Number.isFinite(auc)) return null;
  const positiveWeights: number[] = [];
  const negativeWeights: number[] = [];
  for (let index = 0; index < outcomes.length; index += 1) {
    const weight = weights?.[index] ?? 1;
    if (!(weight > 0) || !Number.isFinite(weight)) continue;
    if (outcomes[index] === 1) positiveWeights.push(weight);
    else negativeWeights.push(weight);
  }
  const positiveCount = weights ? effectiveSampleSize(positiveWeights) : positiveWeights.length;
  const negativeCount = weights ? effectiveSampleSize(negativeWeights) : negativeWeights.length;
  if (!(positiveCount > 1) || !(negativeCount > 1)) return null;
  const q1 = auc / (2 - auc);
  const q2 = (2 * (auc ** 2)) / (1 + auc);
  const variance = (
    (auc * (1 - auc))
    + ((positiveCount - 1) * (q1 - (auc ** 2)))
    + ((negativeCount - 1) * (q2 - (auc ** 2)))
  ) / (positiveCount * negativeCount);
  if (!(variance >= 0) || !Number.isFinite(variance)) return null;
  const standardError = Math.sqrt(variance);
  const clampedConfidence = Math.min(0.99, Math.max(0.8, confidenceLevel));
  const z = clampedConfidence >= 0.95
    ? 1.959963984540054
    : clampedConfidence >= 0.9
      ? 1.6448536269514722
      : 1.2815515655446004;
  return {
    level: clampedConfidence,
    lower: Math.max(0, auc - (z * standardError)),
    upper: Math.min(1, auc + (z * standardError))
  };
}

function computeCalibrationSlopeIntercept(
  probabilities: number[],
  outcomes: number[],
  weights?: number[]
): { intercept: number; slope: number } | null {
  if (probabilities.length !== outcomes.length || probabilities.length < 6) return null;
  const designMatrix: number[][] = [];
  const binaryOutcomes: number[] = [];
  const rowWeights: number[] = [];
  let minLogit = Infinity;
  let maxLogit = -Infinity;
  for (let index = 0; index < probabilities.length; index += 1) {
    const outcome = outcomes[index];
    if (outcome !== 0 && outcome !== 1) continue;
    const rawProbability = probabilities[index];
    if (!Number.isFinite(rawProbability)) continue;
    const boundedProbability = Math.min(0.999999, Math.max(0.000001, rawProbability));
    const logit = Math.log(boundedProbability / (1 - boundedProbability));
    const weight = weights?.[index] ?? 1;
    if (!Number.isFinite(weight) || !(weight > 0)) continue;
    designMatrix.push([1, logit]);
    binaryOutcomes.push(outcome);
    rowWeights.push(weight);
    minLogit = Math.min(minLogit, logit);
    maxLogit = Math.max(maxLogit, logit);
  }
  if (designMatrix.length < 6 || !(maxLogit - minLogit > 1e-8)) return null;
  try {
    const fitted = fitBinaryLogit(designMatrix, binaryOutcomes, rowWeights);
    const intercept = fitted.coefficients[0];
    const slope = fitted.coefficients[1];
    if (!Number.isFinite(intercept) || !Number.isFinite(slope)) return null;
    return { intercept, slope };
  } catch {
    return null;
  }
}

function computeClassificationMetricsAtThreshold(
  probabilities: number[],
  outcomes: number[],
  weights: number[],
  threshold: number
): RegressionThresholdMetric {
  const normalizedThreshold = Math.min(0.99, Math.max(0.01, threshold));
  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  let weightedCount = 0;
  for (let index = 0; index < probabilities.length; index += 1) {
    const weight = weights[index] ?? 1;
    weightedCount += weight;
    const predicted = probabilities[index]! >= normalizedThreshold ? 1 : 0;
    const actual = outcomes[index]!;
    if (actual === 1 && predicted === 1) truePositive += weight;
    else if (actual === 0 && predicted === 0) trueNegative += weight;
    else if (actual === 0 && predicted === 1) falsePositive += weight;
    else falseNegative += weight;
  }
  const accuracy = weightedCount > 0 ? (truePositive + trueNegative) / weightedCount : null;
  const precision = (truePositive + falsePositive) > 0 ? truePositive / (truePositive + falsePositive) : null;
  const recall = (truePositive + falseNegative) > 0 ? truePositive / (truePositive + falseNegative) : null;
  const specificity = (trueNegative + falsePositive) > 0 ? trueNegative / (trueNegative + falsePositive) : null;
  const f1Score = precision !== null && recall !== null && (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : null;
  const youdenJ = recall !== null && specificity !== null ? (recall + specificity - 1) : null;
  return {
    threshold: normalizedThreshold,
    weightedCount,
    truePositive,
    trueNegative,
    falsePositive,
    falseNegative,
    accuracy,
    precision,
    recall,
    specificity,
    f1Score,
    youdenJ
  };
}

function buildCalibrationBins(
  probabilities: number[],
  outcomes: number[],
  weights: number[],
  binCount = 10
): RegressionCalibrationBin[] {
  const points = probabilities.map((probability, index) => ({
    probability,
    outcome: outcomes[index]!,
    weight: weights[index] ?? 1
  })).sort((left, right) => left.probability - right.probability);
  if (points.length === 0) return [];
  const normalizedBinCount = Math.min(Math.max(3, Math.floor(binCount)), Math.max(3, Math.min(10, points.length)));
  const chunkSize = Math.ceil(points.length / normalizedBinCount);
  const bins: RegressionCalibrationBin[] = [];
  for (let binIndex = 0; binIndex < normalizedBinCount; binIndex += 1) {
    const chunk = points.slice(binIndex * chunkSize, (binIndex + 1) * chunkSize);
    if (chunk.length === 0) continue;
    const weightedCount = chunk.reduce((total, item) => total + item.weight, 0);
    const observedRate = weightedCount > 0
      ? chunk.reduce((total, item) => total + (item.outcome * item.weight), 0) / weightedCount
      : null;
    const predictedRate = weightedCount > 0
      ? chunk.reduce((total, item) => total + (item.probability * item.weight), 0) / weightedCount
      : null;
    bins.push({
      bin: `B${binIndex + 1}`,
      minProbability: chunk[0]!.probability,
      maxProbability: chunk[chunk.length - 1]!.probability,
      count: chunk.length,
      weightedCount,
      observedRate,
      predictedRate,
      calibrationGap: observedRate === null || predictedRate === null ? null : observedRate - predictedRate
    });
  }
  return bins;
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

function computeWeightedCorrelation(left: number[], right: number[], weights: number[]): number | null {
  if (left.length !== right.length || left.length !== weights.length || left.length < 2) return null;
  const totalWeight = weights.reduce((total, value) => total + value, 0);
  if (!(totalWeight > 0)) return null;
  const leftMean = left.reduce((total, value, index) => total + (value * weights[index]!), 0) / totalWeight;
  const rightMean = right.reduce((total, value, index) => total + (value * weights[index]!), 0) / totalWeight;
  const leftSS = left.reduce((total, value, index) => total + (weights[index]! * ((value - leftMean) ** 2)), 0);
  const rightSS = right.reduce((total, value, index) => total + (weights[index]! * ((value - rightMean) ** 2)), 0);
  if (!(leftSS > 0) || !(rightSS > 0)) return null;
  const covariance = left.reduce((total, value, index) => total + (weights[index]! * (value - leftMean) * (right[index]! - rightMean)), 0);
  return covariance / Math.sqrt(leftSS * rightSS);
}

function computeMaxPredictorCorrelation(rows: Array<{ x: number[]; weight: number }>): number | null {
  const predictorCount = rows[0]?.x.length ?? 0;
  if (predictorCount < 2) return null;
  let maxAbsCorrelation = 0;
  let hasValue = false;
  for (let left = 0; left < predictorCount; left += 1) {
    for (let right = left + 1; right < predictorCount; right += 1) {
      const leftValues = rows.map((row) => row.x[left]!);
      const rightValues = rows.map((row) => row.x[right]!);
      const weights = rows.map((row) => row.weight);
      const correlation = computeWeightedCorrelation(leftValues, rightValues, weights);
      if (correlation === null) continue;
      hasValue = true;
      maxAbsCorrelation = Math.max(maxAbsCorrelation, Math.abs(correlation));
    }
  }
  return hasValue ? maxAbsCorrelation : null;
}

function computeJarqueBera(values: number[]): { statistic: number | null; pValue: number | null } {
  if (values.length < 8) {
    return { statistic: null, pValue: null };
  }
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const centered = values.map((value) => value - mean);
  const secondMoment = centered.reduce((total, value) => total + (value ** 2), 0) / values.length;
  if (!(secondMoment > 0)) {
    return { statistic: null, pValue: null };
  }
  const thirdMoment = centered.reduce((total, value) => total + (value ** 3), 0) / values.length;
  const fourthMoment = centered.reduce((total, value) => total + (value ** 4), 0) / values.length;
  const skewness = thirdMoment / (secondMoment ** 1.5);
  const kurtosis = fourthMoment / (secondMoment ** 2);
  const statistic = (values.length / 6) * ((skewness ** 2) + (((kurtosis - 3) ** 2) / 4));
  return {
    statistic,
    pValue: chiSquarePValue(statistic, 2)
  };
}

function computeBreuschPagan(
  rows: Array<{ x: number[]; weight: number }>,
  residuals: number[]
): { statistic: number | null; pValue: number | null; rSquared: number | null } {
  const predictorCount = rows[0]?.x.length ?? 0;
  if (predictorCount === 0 || rows.length < predictorCount + 2) {
    return { statistic: null, pValue: null, rSquared: null };
  }
  const y = residuals.map((value) => value ** 2);
  const designMatrix = rows.map((row) => [1, ...row.x]);
  const xtwx = Array.from({ length: predictorCount + 1 }, () => Array.from({ length: predictorCount + 1 }, () => 0));
  const xtwy = Array.from({ length: predictorCount + 1 }, () => 0);
  for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
    const vector = designMatrix[rowIndex]!;
    const weight = rows[rowIndex]!.weight;
    for (let i = 0; i < vector.length; i += 1) {
      xtwy[i] += vector[i]! * y[rowIndex]! * weight;
      for (let j = 0; j < vector.length; j += 1) {
        xtwx[i]![j] += vector[i]! * vector[j]! * weight;
      }
    }
  }
  try {
    const coefficients = solveLinearSystem(xtwx, xtwy);
    const predictions = designMatrix.map((vector) => coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0));
    const totalWeight = rows.reduce((total, row) => total + row.weight, 0);
    if (!(totalWeight > 0)) {
      return { statistic: null, pValue: null, rSquared: null };
    }
    const meanY = y.reduce((total, value, index) => total + (value * rows[index]!.weight), 0) / totalWeight;
    const ssTot = y.reduce((total, value, index) => total + (rows[index]!.weight * ((value - meanY) ** 2)), 0);
    const ssRes = y.reduce((total, value, index) => total + (rows[index]!.weight * ((value - predictions[index]!) ** 2)), 0);
    const rSquared = ssTot === 0 ? null : Math.max(0, 1 - (ssRes / ssTot));
    if (rSquared === null) {
      return { statistic: null, pValue: null, rSquared: null };
    }
    const statistic = rows.length * rSquared;
    return {
      statistic,
      pValue: chiSquarePValue(statistic, predictorCount),
      rSquared
    };
  } catch {
    return { statistic: null, pValue: null, rSquared: null };
  }
}

function computeHc3RobustCovariance(
  inverseXtWX: number[][],
  designMatrix: number[][],
  residuals: number[],
  weights: number[],
  leverageValues: Array<number | null>
): number[][] | null {
  const parameterCount = inverseXtWX.length;
  if (parameterCount === 0 || designMatrix.length === 0) return null;
  const meat = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
  for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
    const vector = designMatrix[rowIndex]!;
    const residual = residuals[rowIndex] ?? 0;
    const weight = weights[rowIndex] ?? 1;
    const leverage = leverageValues[rowIndex];
    if (!Number.isFinite(residual) || !Number.isFinite(weight) || !(weight > 0)) continue;
    const denominator = leverage === null || leverage === undefined
      ? 1
      : Math.max(1e-8, 1 - leverage);
    const scale = ((weight * residual) / denominator) ** 2;
    if (!Number.isFinite(scale)) continue;
    for (let left = 0; left < parameterCount; left += 1) {
      for (let right = 0; right < parameterCount; right += 1) {
        meat[left]![right] += (vector[left]! * vector[right]!) * scale;
      }
    }
  }
  try {
    return multiplyMatrices(multiplyMatrices(inverseXtWX, meat), inverseXtWX);
  } catch {
    return null;
  }
}

function safeInvertMatrix(matrix: number[][]): number[][] | null {
  try {
    return invertMatrix(matrix);
  } catch {
    return null;
  }
}

function computeClusterRobustCovariance(
  inverseInformation: number[][],
  designMatrix: number[][],
  scoreResiduals: number[],
  weights: number[],
  clusterValues: string[]
): number[][] {
  const parameterCount = inverseInformation.length;
  const clusterScores = new Map<string, number[]>();
  for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
    const vector = designMatrix[rowIndex]!;
    const weight = weights[rowIndex] ?? 1;
    const residual = scoreResiduals[rowIndex] ?? 0;
    const cluster = clusterValues[rowIndex] ?? '__cluster__';
    const score = clusterScores.get(cluster) ?? new Array<number>(parameterCount).fill(0);
    for (let index = 0; index < parameterCount; index += 1) {
      score[index] += vector[index]! * residual * weight;
    }
    clusterScores.set(cluster, score);
  }

  const meat = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
  for (const score of clusterScores.values()) {
    for (let rowIndex = 0; rowIndex < parameterCount; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < parameterCount; columnIndex += 1) {
        meat[rowIndex]![columnIndex] += score[rowIndex]! * score[columnIndex]!;
      }
    }
  }
  return multiplyMatrices(multiplyMatrices(inverseInformation, meat), inverseInformation);
}

type GlmIrlsSpecification = {
  inverseLink: (eta: number) => number;
  variance: (mu: number) => number;
  derivativeMuByEta: (eta: number, mu: number) => number;
  clampObserved: (value: number) => number;
};

function getGlmIrlsSpecification(family: GeneralLinearModelFamily, link: GeneralLinearModelLink): GlmIrlsSpecification {
  if (family === 'gaussian') {
    if (link === 'log') {
      return {
        inverseLink: (eta) => Math.exp(Math.max(-20, Math.min(20, eta))),
        variance: () => 1,
        derivativeMuByEta: (_eta, mu) => Math.max(1e-8, mu),
        clampObserved: (value) => value
      };
    }
    return {
      inverseLink: (eta) => eta,
      variance: () => 1,
      derivativeMuByEta: () => 1,
      clampObserved: (value) => value
    };
  }
  if (family === 'binomial') {
    if (link === 'probit') {
      return {
        inverseLink: (eta) => Math.min(0.999999, Math.max(0.000001, normalCdf(eta))),
        variance: (mu) => Math.max(1e-8, mu * (1 - mu)),
        derivativeMuByEta: (eta) => Math.max(1e-8, normalPdf(eta)),
        clampObserved: (value) => value >= 0.5 ? 1 : 0
      };
    }
    if (link === 'cloglog') {
      return {
        inverseLink: (eta) => {
          const bounded = Math.max(-20, Math.min(20, eta));
          const mu = 1 - Math.exp(-Math.exp(bounded));
          return Math.min(0.999999, Math.max(0.000001, mu));
        },
        variance: (mu) => Math.max(1e-8, mu * (1 - mu)),
        derivativeMuByEta: (eta) => {
          const bounded = Math.max(-20, Math.min(20, eta));
          return Math.max(1e-8, Math.exp(bounded - Math.exp(bounded)));
        },
        clampObserved: (value) => value >= 0.5 ? 1 : 0
      };
    }
    return {
      inverseLink: (eta) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, eta)))),
      variance: (mu) => Math.max(1e-8, mu * (1 - mu)),
      derivativeMuByEta: (_eta, mu) => Math.max(1e-8, mu * (1 - mu)),
      clampObserved: (value) => value >= 0.5 ? 1 : 0
    };
  }
  if (link === 'identity') {
    return {
      inverseLink: (eta) => Math.max(1e-8, eta),
      variance: (mu) => Math.max(1e-8, mu),
      derivativeMuByEta: () => 1,
      clampObserved: (value) => Math.max(0, value)
    };
  }
  if (link === 'sqrt') {
    return {
      inverseLink: (eta) => Math.max(1e-8, eta ** 2),
      variance: (mu) => Math.max(1e-8, mu),
      derivativeMuByEta: (eta) => Math.max(1e-8, Math.abs(2 * eta)),
      clampObserved: (value) => Math.max(0, value)
    };
  }
  return {
    inverseLink: (eta) => Math.exp(Math.max(-20, Math.min(20, eta))),
    variance: (mu) => Math.max(1e-8, mu),
    derivativeMuByEta: (_eta, mu) => Math.max(1e-8, mu),
    clampObserved: (value) => Math.max(0, value)
  };
}

function fitGeneralizedLinearModelIrls(
  designMatrix: number[][],
  outcomes: number[],
  weights: number[],
  family: GeneralLinearModelFamily,
  link: GeneralLinearModelLink,
  maxIterations = 80,
  tolerance = 1e-6
): { coefficients: number[]; means: number[]; information: number[][]; converged: boolean; iterations: number } {
  const parameterCount = designMatrix[0]?.length ?? 0;
  const coefficients = new Array<number>(parameterCount).fill(0);
  const spec = getGlmIrlsSpecification(family, link);
  let means = outcomes.map((value) => spec.clampObserved(value));
  let information = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
  let converged = false;
  let iterations = 0;

  const buildWeightedNormalEquation = (workingResponse: number[], workingWeights: number[]): { xtwx: number[][]; xtwz: number[] } => {
    const xtwx = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
    const xtwz = new Array<number>(parameterCount).fill(0);
    for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
      const vector = designMatrix[rowIndex]!;
      const weight = Math.max(0, workingWeights[rowIndex] ?? 0);
      if (!(weight > 0)) continue;
      const z = workingResponse[rowIndex] ?? 0;
      for (let i = 0; i < parameterCount; i += 1) {
        xtwz[i] += vector[i]! * z * weight;
        for (let j = 0; j < parameterCount; j += 1) {
          xtwx[i]![j] += vector[i]! * vector[j]! * weight;
        }
      }
    }
    return { xtwx, xtwz };
  };

  for (let iteration = 0; iteration < Math.max(5, Math.floor(maxIterations)); iteration += 1) {
    iterations = iteration + 1;
    const eta = designMatrix.map((vector) => coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0));
    means = eta.map((value) => spec.inverseLink(value));
    const workingWeights = means.map((mu, index) => {
      const variance = spec.variance(mu);
      const dMuByEta = spec.derivativeMuByEta(eta[index]!, mu);
      return Math.max(1e-9, (weights[index] ?? 1) * ((dMuByEta ** 2) / Math.max(1e-9, variance)));
    });
    const workingResponse = means.map((mu, index) => {
      const dMuByEta = spec.derivativeMuByEta(eta[index]!, mu);
      const residual = spec.clampObserved(outcomes[index] ?? 0) - mu;
      return eta[index]! + (residual / Math.max(1e-9, dMuByEta));
    });
    const { xtwx, xtwz } = buildWeightedNormalEquation(workingResponse, workingWeights);
    const next = solveLinearSystem(xtwx, xtwz);
    const delta = next.map((value, index) => value - coefficients[index]!);
    const maxDelta = delta.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    for (let index = 0; index < parameterCount; index += 1) {
      coefficients[index] = next[index] ?? coefficients[index]!;
    }
    if (maxDelta <= Math.max(1e-10, tolerance)) {
      converged = true;
      break;
    }
  }

  const eta = designMatrix.map((vector) => coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0));
  means = eta.map((value) => spec.inverseLink(value));
  information = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
  for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
    const vector = designMatrix[rowIndex]!;
    const mu = means[rowIndex]!;
    const variance = spec.variance(mu);
    const dMuByEta = spec.derivativeMuByEta(eta[rowIndex]!, mu);
    const weight = Math.max(1e-9, (weights[rowIndex] ?? 1) * ((dMuByEta ** 2) / Math.max(1e-9, variance)));
    for (let i = 0; i < parameterCount; i += 1) {
      for (let j = 0; j < parameterCount; j += 1) {
        information[i]![j] += vector[i]! * vector[j]! * weight;
      }
    }
  }
  return { coefficients, means, information, converged, iterations };
}

function fitBinaryLogit(
  designMatrix: number[][],
  outcomes: number[],
  weights: number[],
  maxIterations = 60
): { coefficients: number[]; probabilities: number[]; information: number[][] } {
  const parameterCount = designMatrix[0]?.length ?? 0;
  const coefficients = new Array<number>(parameterCount).fill(0);
  let probabilities = new Array<number>(designMatrix.length).fill(0.5);
  let information = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    probabilities = designMatrix.map((vector) => {
      const linear = coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0);
      return 1 / (1 + Math.exp(-linear));
    });
    information = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
    const score = new Array<number>(parameterCount).fill(0);
    for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
      const vector = designMatrix[rowIndex]!;
      const probability = Math.min(0.999999, Math.max(0.000001, probabilities[rowIndex]!));
      const variance = probability * (1 - probability) * (weights[rowIndex] ?? 1);
      const residual = outcomes[rowIndex]! - probability;
      for (let i = 0; i < parameterCount; i += 1) {
        score[i] += vector[i]! * residual * (weights[rowIndex] ?? 1);
        for (let j = 0; j < parameterCount; j += 1) {
          information[i]![j] += vector[i]! * vector[j]! * variance;
        }
      }
    }
    const step = solveLinearSystem(information, score);
    const maxDelta = step.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    for (let index = 0; index < parameterCount; index += 1) {
      coefficients[index] += step[index] ?? 0;
    }
    if (maxDelta < 1e-6) break;
  }

  probabilities = designMatrix.map((vector) => {
    const linear = coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0);
    return 1 / (1 + Math.exp(-linear));
  });
  information = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
  for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
    const vector = designMatrix[rowIndex]!;
    const probability = Math.min(0.999999, Math.max(0.000001, probabilities[rowIndex]!));
    const variance = probability * (1 - probability) * (weights[rowIndex] ?? 1);
    for (let i = 0; i < parameterCount; i += 1) {
      for (let j = 0; j < parameterCount; j += 1) {
        information[i]![j] += vector[i]! * vector[j]! * variance;
      }
    }
  }

  return { coefficients, probabilities, information };
}

function fitPoissonLogLink(
  designMatrix: number[][],
  outcomes: number[],
  weights: number[],
  maxIterations = 80
): { coefficients: number[]; means: number[]; information: number[][] } {
  const parameterCount = designMatrix[0]?.length ?? 0;
  const coefficients = new Array<number>(parameterCount).fill(0);
  let means = new Array<number>(designMatrix.length).fill(1);
  let information = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    means = designMatrix.map((vector) => {
      const eta = coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0);
      return Math.exp(Math.max(-20, Math.min(20, eta)));
    });
    const score = new Array<number>(parameterCount).fill(0);
    information = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
    for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
      const vector = designMatrix[rowIndex]!;
      const mu = Math.max(1e-9, means[rowIndex]!);
      const weight = weights[rowIndex] ?? 1;
      const residual = outcomes[rowIndex]! - mu;
      for (let i = 0; i < parameterCount; i += 1) {
        score[i] += vector[i]! * residual * weight;
        for (let j = 0; j < parameterCount; j += 1) {
          information[i]![j] += vector[i]! * vector[j]! * mu * weight;
        }
      }
    }
    const step = solveLinearSystem(information, score);
    const maxDelta = step.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    for (let index = 0; index < parameterCount; index += 1) {
      coefficients[index] += step[index] ?? 0;
    }
    if (maxDelta < 1e-6) break;
  }
  means = designMatrix.map((vector) => {
    const eta = coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0);
    return Math.exp(Math.max(-20, Math.min(20, eta)));
  });
  information = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
  for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
    const vector = designMatrix[rowIndex]!;
    const mu = Math.max(1e-9, means[rowIndex]!);
    const weight = weights[rowIndex] ?? 1;
    for (let i = 0; i < parameterCount; i += 1) {
      for (let j = 0; j < parameterCount; j += 1) {
        information[i]![j] += vector[i]! * vector[j]! * mu * weight;
      }
    }
  }
  return { coefficients, means, information };
}

function computePoissonDeviance(observed: number[], expected: number[], weights: number[]): number {
  let total = 0;
  for (let index = 0; index < observed.length; index += 1) {
    const y = Math.max(0, observed[index] ?? 0);
    const mu = Math.max(1e-9, expected[index] ?? 0);
    const weight = Math.max(0, weights[index] ?? 1);
    const term = y > 0
      ? (y * Math.log(y / mu)) - (y - mu)
      : mu;
    total += 2 * weight * term;
  }
  return total;
}

function estimateExchangeableWorkingCorrelation(
  pearsonResiduals: number[],
  clusterValues: string[],
  weights: number[]
): number | null {
  const grouped = new Map<string, Array<{ residual: number; weight: number }>>();
  for (let index = 0; index < pearsonResiduals.length; index += 1) {
    const cluster = clusterValues[index] ?? '__cluster__';
    const bucket = grouped.get(cluster) ?? [];
    bucket.push({ residual: pearsonResiduals[index] ?? 0, weight: weights[index] ?? 1 });
    grouped.set(cluster, bucket);
  }
  let numerator = 0;
  let denominator = 0;
  for (const rows of grouped.values()) {
    if (rows.length < 2) continue;
    for (let left = 0; left < rows.length; left += 1) {
      for (let right = left + 1; right < rows.length; right += 1) {
        const pairWeight = Math.sqrt(Math.max(0, rows[left]!.weight * rows[right]!.weight));
        numerator += pairWeight * rows[left]!.residual * rows[right]!.residual;
        denominator += pairWeight;
      }
    }
  }
  if (!(denominator > 0)) return null;
  return Math.max(-0.95, Math.min(0.95, numerator / denominator));
}

function estimateAr1WorkingCorrelation(
  pearsonResiduals: number[],
  clusterValues: string[],
  weights: number[]
): number | null {
  const grouped = new Map<string, Array<{ residual: number; weight: number }>>();
  for (let index = 0; index < pearsonResiduals.length; index += 1) {
    const cluster = clusterValues[index] ?? '__cluster__';
    const bucket = grouped.get(cluster) ?? [];
    bucket.push({ residual: pearsonResiduals[index] ?? 0, weight: weights[index] ?? 1 });
    grouped.set(cluster, bucket);
  }
  let numerator = 0;
  let denominator = 0;
  for (const rows of grouped.values()) {
    for (let index = 1; index < rows.length; index += 1) {
      const previous = rows[index - 1]!;
      const current = rows[index]!;
      const pairWeight = Math.sqrt(Math.max(0, previous.weight * current.weight));
      numerator += pairWeight * previous.residual * current.residual;
      denominator += pairWeight * (previous.residual ** 2);
    }
  }
  if (!(denominator > 0)) return null;
  return Math.max(-0.95, Math.min(0.95, numerator / denominator));
}

function orthomaxObjective(loadings: number[][], gamma: number): number {
  if (loadings.length === 0 || (loadings[0]?.length ?? 0) === 0) return 0;
  const rowCount = Math.max(1, loadings.length);
  const factorCount = loadings[0]!.length;
  let score = 0;
  for (let factorIndex = 0; factorIndex < factorCount; factorIndex += 1) {
    const columnSquares = loadings.map((row) => (row[factorIndex] ?? 0) ** 2);
    const sumSquare = columnSquares.reduce((total, value) => total + value, 0);
    const sumFourth = columnSquares.reduce((total, value) => total + (value ** 2), 0);
    score += sumFourth - ((gamma / rowCount) * (sumSquare ** 2));
  }
  return score;
}

function varimaxObjective(loadings: number[][]): number {
  return orthomaxObjective(loadings, 1);
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
  return applyOrthomaxRotation(loadings, 1);
}

function applyQuartimaxRotation(loadings: number[][]): number[][] {
  return applyOrthomaxRotation(loadings, 0);
}

function applyOrthomaxRotation(loadings: number[][], gamma: number): number[][] {
  if (loadings.length === 0 || (loadings[0]?.length ?? 0) < 2) return loadings.map((row) => [...row]);
  let rotated = loadings.map((row) => [...row]);
  let bestScore = orthomaxObjective(rotated, gamma);
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
          const candidateScore = orthomaxObjective(candidate, gamma);
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

function transposeMatrix(matrix: number[][]): number[][] {
  if (matrix.length === 0) return [];
  const columnCount = matrix[0]?.length ?? 0;
  return Array.from({ length: columnCount }, (_unused, columnIndex) =>
    matrix.map((row) => row[columnIndex] ?? 0)
  );
}

function multiplyMatrices(left: number[][], right: number[][]): number[][] {
  const leftRows = left.length;
  const shared = left[0]?.length ?? 0;
  const rightColumns = right[0]?.length ?? 0;
  if (shared === 0 || right.length === 0 || shared !== right.length) {
    throw new Error('Matrix dimensions are incompatible for multiplication.');
  }
  const result = Array.from({ length: leftRows }, () => Array.from({ length: rightColumns }, () => 0));
  for (let rowIndex = 0; rowIndex < leftRows; rowIndex += 1) {
    for (let sharedIndex = 0; sharedIndex < shared; sharedIndex += 1) {
      const value = left[rowIndex]![sharedIndex] ?? 0;
      for (let columnIndex = 0; columnIndex < rightColumns; columnIndex += 1) {
        result[rowIndex]![columnIndex] += value * (right[sharedIndex]![columnIndex] ?? 0);
      }
    }
  }
  return result;
}

function matrixDeterminant(matrix: number[][]): number {
  const size = matrix.length;
  if (size === 0) return 1;
  const working = cloneMatrix(matrix);
  let determinant = 1;
  let sign = 1;
  for (let pivot = 0; pivot < size; pivot += 1) {
    let maxRow = pivot;
    for (let candidate = pivot + 1; candidate < size; candidate += 1) {
      if (Math.abs(working[candidate]![pivot]!) > Math.abs(working[maxRow]![pivot]!)) {
        maxRow = candidate;
      }
    }
    const pivotValue = working[maxRow]![pivot]!;
    if (Math.abs(pivotValue) < 1e-12) return 0;
    if (maxRow !== pivot) {
      [working[pivot], working[maxRow]] = [working[maxRow]!, working[pivot]!];
      sign *= -1;
    }
    const diagonal = working[pivot]![pivot]!;
    determinant *= diagonal;
    for (let row = pivot + 1; row < size; row += 1) {
      const factor = (working[row]![pivot] ?? 0) / diagonal;
      for (let column = pivot + 1; column < size; column += 1) {
        working[row]![column] -= factor * (working[pivot]![column] ?? 0);
      }
    }
  }
  return determinant * sign;
}

function computeKmoDiagnostics(correlationMatrix: number[][]): { overall: number | null; perField: Array<number | null> } {
  const size = correlationMatrix.length;
  if (size < 2) {
    return {
      overall: null,
      perField: correlationMatrix.map(() => null)
    };
  }
  let inverse: number[][];
  try {
    inverse = invertMatrix(correlationMatrix);
  } catch {
    return {
      overall: null,
      perField: correlationMatrix.map(() => null)
    };
  }

  const correlationSquareTotals = new Array<number>(size).fill(0);
  const partialSquareTotals = new Array<number>(size).fill(0);
  let totalCorrelationSquares = 0;
  let totalPartialSquares = 0;

  for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
    for (let columnIndex = rowIndex + 1; columnIndex < size; columnIndex += 1) {
      const correlation = correlationMatrix[rowIndex]![columnIndex] ?? 0;
      const diagonalProduct = (inverse[rowIndex]![rowIndex] ?? 0) * (inverse[columnIndex]![columnIndex] ?? 0);
      const denominator = diagonalProduct > 0 ? Math.sqrt(diagonalProduct) : 0;
      const partialCorrelation = denominator > 0
        ? -((inverse[rowIndex]![columnIndex] ?? 0) / denominator)
        : 0;
      const correlationSquare = correlation ** 2;
      const partialSquare = Number.isFinite(partialCorrelation) ? partialCorrelation ** 2 : 0;
      totalCorrelationSquares += correlationSquare;
      totalPartialSquares += partialSquare;
      correlationSquareTotals[rowIndex]! += correlationSquare;
      correlationSquareTotals[columnIndex]! += correlationSquare;
      partialSquareTotals[rowIndex]! += partialSquare;
      partialSquareTotals[columnIndex]! += partialSquare;
    }
  }

  const overallDenominator = totalCorrelationSquares + totalPartialSquares;
  return {
    overall: overallDenominator > 0 ? totalCorrelationSquares / overallDenominator : null,
    perField: correlationSquareTotals.map((correlationSquare, index) => {
      const denominator = correlationSquare + partialSquareTotals[index]!;
      return denominator > 0 ? correlationSquare / denominator : null;
    })
  };
}

function applyPromaxRotation(
  loadings: number[][],
  power = 4
): { loadings: number[][]; factorCorrelationMatrix: number[][] | null } {
  if (loadings.length === 0 || (loadings[0]?.length ?? 0) < 2) {
    return {
      loadings: loadings.map((row) => [...row]),
      factorCorrelationMatrix: null
    };
  }
  const varimaxLoadings = applyVarimaxRotation(loadings);
  const target = varimaxLoadings.map((row) =>
    row.map((value) => Math.sign(value) * (Math.abs(value) ** power))
  );
  try {
    const loadingsTranspose = transposeMatrix(varimaxLoadings);
    const normalMatrix = multiplyMatrices(loadingsTranspose, varimaxLoadings);
    const crossMatrix = multiplyMatrices(loadingsTranspose, target);
    const transformMatrix = multiplyMatrices(invertMatrix(normalMatrix), crossMatrix);
    const rotated = multiplyMatrices(varimaxLoadings, transformMatrix);
    const transformTranspose = transposeMatrix(transformMatrix);
    const factorCorrelationMatrix = invertMatrix(multiplyMatrices(transformTranspose, transformMatrix));
    return {
      loadings: rotated,
      factorCorrelationMatrix
    };
  } catch {
    return {
      loadings: varimaxLoadings,
      factorCorrelationMatrix: null
    };
  }
}

function buildCorrelationMatrix(columns: number[][]): number[][] {
  return columns.map((columnA, rowIndex) =>
    columns.map((columnB, columnIndex) => {
      if (rowIndex === columnIndex) return 1;
      const correlation = pearsonCorrelation(columnA, columnB);
      return correlation ?? 0;
    })
  );
}

function computeOmegaTotalFromCorrelationMatrix(correlationMatrix: number[][]): number | null {
  if (correlationMatrix.length < 2) return null;
  try {
    const component = powerIterationSymmetric(correlationMatrix);
    if (!(component.eigenvalue > 0)) return null;
    const loadings = component.eigenvector.map((value) => value * Math.sqrt(Math.max(component.eigenvalue, 0)));
    const commonVarianceSum = loadings.reduce((total, value) => total + value, 0) ** 2;
    const uniquenessSum = loadings.reduce((total, value) => total + Math.max(0, 1 - (value ** 2)), 0);
    const denominator = commonVarianceSum + uniquenessSum;
    if (!(denominator > 0)) return null;
    const omega = commonVarianceSum / denominator;
    if (!Number.isFinite(omega)) return null;
    return Math.max(0, Math.min(1, omega));
  } catch {
    return null;
  }
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

function exponentiateConfidenceInterval(interval: ConfidenceInterval | null): ConfidenceInterval | null {
  if (!interval) return null;
  return {
    level: interval.level,
    lower: interval.lower === null ? null : Math.exp(interval.lower),
    upper: interval.upper === null ? null : Math.exp(interval.upper)
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

function summarizeResidualDistribution(
  residualValues: Array<number | null | undefined>,
  standardizedValues?: Array<number | null | undefined>
): Record<string, number | null> {
  const residuals = residualValues
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const standardized = (standardizedValues ?? residualValues)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (residuals.length === 0) {
    return {
      residualMedian: null,
      residualIqr: null,
      residualAbsP90: null,
      residualAbsP95: null,
      standardizedAbsP90: null,
      standardizedAbsP95: null,
      standardizedOutlierCount2: null,
      standardizedOutlierCount3: null
    };
  }

  const sortedResiduals = [...residuals].sort((left, right) => left - right);
  const sortedAbsResiduals = [...residuals].map((value) => Math.abs(value)).sort((left, right) => left - right);
  const sortedAbsStandardized = [...standardized].map((value) => Math.abs(value)).sort((left, right) => left - right);

  const q25 = percentile(sortedResiduals, 0.25);
  const q75 = percentile(sortedResiduals, 0.75);

  return {
    residualMedian: percentile(sortedResiduals, 0.5),
    residualIqr: q25 === null || q75 === null ? null : q75 - q25,
    residualAbsP90: percentile(sortedAbsResiduals, 0.9),
    residualAbsP95: percentile(sortedAbsResiduals, 0.95),
    standardizedAbsP90: sortedAbsStandardized.length > 0 ? percentile(sortedAbsStandardized, 0.9) : null,
    standardizedAbsP95: sortedAbsStandardized.length > 0 ? percentile(sortedAbsStandardized, 0.95) : null,
    standardizedOutlierCount2: standardized.length > 0 ? standardized.filter((value) => Math.abs(value) >= 2).length : null,
    standardizedOutlierCount3: standardized.length > 0 ? standardized.filter((value) => Math.abs(value) >= 3).length : null
  };
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

function normalizeExactCategory(value: DatasetValue): string {
  return formatValue(value).trim();
}

function normalizeBinaryValue(value: DatasetValue): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return value >= 0.5 ? 1 : 0;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'event', 'success', 'positive'].includes(normalized)) return 1;
    if (['0', 'false', 'no', 'n', 'none', 'failure', 'negative'].includes(normalized)) return 0;
  }
  return null;
}

function binomialProbability(successes: number, trials: number, probability: number): number {
  if (trials < 0 || successes < 0 || successes > trials || probability < 0 || probability > 1) return 0;
  if (probability === 0) return successes === 0 ? 1 : 0;
  if (probability === 1) return successes === trials ? 1 : 0;
  const logValue = logGamma(trials + 1)
    - logGamma(successes + 1)
    - logGamma(trials - successes + 1)
    + (successes * Math.log(probability))
    + ((trials - successes) * Math.log(1 - probability));
  return Math.exp(logValue);
}

function binomialTailProbability(successes: number, trials: number, probability: number, tail: 'left' | 'right'): number {
  let total = 0;
  if (tail === 'left') {
    for (let count = 0; count <= successes; count += 1) {
      total += binomialProbability(count, trials, probability);
    }
    return Math.min(1, total);
  }
  for (let count = successes; count <= trials; count += 1) {
    total += binomialProbability(count, trials, probability);
  }
  return Math.min(1, total);
}

function inverseRegularizedBeta(target: number, a: number, b: number): number {
  if (!(target > 0)) return 0;
  if (!(target < 1)) return 1;
  let lower = 0;
  let upper = 1;
  for (let iteration = 0; iteration < 70; iteration += 1) {
    const mid = (lower + upper) / 2;
    const value = regularizedBeta(mid, a, b);
    if (!Number.isFinite(value)) {
      upper = mid;
      continue;
    }
    if (Math.abs(value - target) < 1e-8) return mid;
    if (value < target) lower = mid;
    else upper = mid;
  }
  return (lower + upper) / 2;
}

function clopperPearsonInterval(successes: number, trials: number, level = 0.95): ConfidenceInterval | null {
  if (!(trials > 0)) return null;
  const alpha = Math.max(0.0001, Math.min(0.2, 1 - level));
  const lower = successes === 0 ? 0 : inverseRegularizedBeta(alpha / 2, successes, trials - successes + 1);
  const upper = successes === trials ? 1 : inverseRegularizedBeta(1 - alpha / 2, successes + 1, trials - successes);
  return {
    level,
    lower,
    upper
  };
}

function exactBinomialTest(successes: number, trials: number, nullProportion: number) {
  if (!(trials > 0)) {
    return {
      pValueTwoSided: null,
      pValueLeft: null,
      pValueRight: null
    };
  }
  const probability = Math.max(0.000001, Math.min(0.999999, nullProportion));
  const observedProbability = binomialProbability(successes, trials, probability);
  let pTwo = 0;
  for (let count = 0; count <= trials; count += 1) {
    const candidate = binomialProbability(count, trials, probability);
    if (candidate <= observedProbability + 1e-12) pTwo += candidate;
  }
  return {
    pValueTwoSided: Math.min(1, pTwo),
    pValueLeft: binomialTailProbability(successes, trials, probability, 'left'),
    pValueRight: binomialTailProbability(successes, trials, probability, 'right')
  };
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
  input: ExactTestInput,
  options?: DatasetAnalysisOptions
): ExactTestResult {
  const testType = input.testType ?? 'fisher_2x2';
  if (testType === 'binomial') {
    const fieldKey = typeof input.binaryField === 'string' && input.binaryField.trim()
      ? input.binaryField.trim()
      : null;
    if (!fieldKey) throw new Error('Binomial exact test requires a binary field.');
    const field = requireDatasetField(dataset, fieldKey, 'exact test field');
    const rows = analysisRows(dataset, [fieldKey], options)
      .map(({ row }) => row[fieldKey])
      .filter((value): value is DatasetValue => value !== null);
    const successValue = normalizeExactCategory(input.successValue ?? 1);
    const normalizedRows = rows.map((value) => normalizeExactCategory(value));
    const successCount = normalizedRows.filter((value) => value === successValue).length;
    const validCaseCount = normalizedRows.length;
    const failureCount = Math.max(0, validCaseCount - successCount);
    const nullProportion = typeof input.nullProportion === 'number' && Number.isFinite(input.nullProportion)
      ? Math.max(0.001, Math.min(0.999, input.nullProportion))
      : 0.5;
    const binomial = exactBinomialTest(successCount, validCaseCount, nullProportion);
    return {
      testType: 'binomial',
      rowField: null,
      rowLabel: null,
      columnField: null,
      columnLabel: null,
      caseCount: dataset.caseCount,
      validCaseCount,
      table: {
        rowValues: [],
        columnValues: [],
        cells: []
      },
      method: 'binomial_exact',
      fisherExact: null,
      binomialExact: {
        field: field.key,
        label: field.label,
        successValue,
        nullProportion,
        successCount,
        failureCount,
        observedProportion: validCaseCount > 0 ? successCount / validCaseCount : null,
        confidenceInterval: clopperPearsonInterval(successCount, validCaseCount, 0.95),
        pValueTwoSided: binomial.pValueTwoSided,
        pValueLeft: binomial.pValueLeft,
        pValueRight: binomial.pValueRight
      },
      mcnemarExact: null,
      signTest: null,
      wilcoxonExact: null,
      runsExact: null,
      chiSquare: null,
      notes: [
        'Binomial exact tests compare observed successes against a fixed null proportion.',
        'Confidence intervals use the exact Clopper-Pearson method.'
      ]
    };
  }

  if (testType === 'mcnemar') {
    const beforeFieldKey = typeof input.beforeField === 'string' && input.beforeField.trim()
      ? input.beforeField.trim()
      : null;
    const afterFieldKey = typeof input.afterField === 'string' && input.afterField.trim()
      ? input.afterField.trim()
      : null;
    if (!beforeFieldKey || !afterFieldKey || beforeFieldKey === afterFieldKey) {
      throw new Error('McNemar exact test requires two different paired binary fields.');
    }
    const beforeField = requireDatasetField(dataset, beforeFieldKey, 'McNemar before field');
    const afterField = requireDatasetField(dataset, afterFieldKey, 'McNemar after field');
    const positiveValue = normalizeExactCategory(input.positiveValue ?? 1);
    const pairedRows = analysisRows(dataset, [beforeFieldKey, afterFieldKey], options)
      .map(({ row }) => ({
        before: normalizeExactCategory(row[beforeFieldKey] ?? null),
        after: normalizeExactCategory(row[afterFieldKey] ?? null)
      }))
      .filter((entry) => entry.before && entry.after);
    let concordantPositive = 0;
    let concordantNegative = 0;
    let discordantPositiveToNegative = 0;
    let discordantNegativeToPositive = 0;
    for (const row of pairedRows) {
      const beforeIsPositive = row.before === positiveValue;
      const afterIsPositive = row.after === positiveValue;
      if (beforeIsPositive && afterIsPositive) concordantPositive += 1;
      else if (!beforeIsPositive && !afterIsPositive) concordantNegative += 1;
      else if (beforeIsPositive && !afterIsPositive) discordantPositiveToNegative += 1;
      else discordantNegativeToPositive += 1;
    }
    const discordant = discordantPositiveToNegative + discordantNegativeToPositive;
    const exact = exactBinomialTest(Math.min(discordantPositiveToNegative, discordantNegativeToPositive), discordant, 0.5);
    const statistic = discordant > 0
      ? ((Math.abs(discordantPositiveToNegative - discordantNegativeToPositive) - 1) ** 2) / discordant
      : null;
    return {
      testType: 'mcnemar',
      rowField: null,
      rowLabel: null,
      columnField: null,
      columnLabel: null,
      caseCount: dataset.caseCount,
      validCaseCount: pairedRows.length,
      table: {
        rowValues: [],
        columnValues: [],
        cells: []
      },
      method: 'mcnemar_exact',
      fisherExact: null,
      binomialExact: null,
      mcnemarExact: {
        beforeField: beforeField.key,
        beforeLabel: beforeField.label,
        afterField: afterField.key,
        afterLabel: afterField.label,
        positiveValue,
        concordantPositive,
        concordantNegative,
        discordantPositiveToNegative,
        discordantNegativeToPositive,
        statistic,
        pValueTwoSided: exact.pValueTwoSided,
        pValueLeft: exact.pValueLeft,
        pValueRight: exact.pValueRight,
        oddsRatio: discordantNegativeToPositive === 0
          ? null
          : discordantPositiveToNegative / discordantNegativeToPositive
      },
      signTest: null,
      wilcoxonExact: null,
      runsExact: null,
      chiSquare: statistic === null ? null : {
        statistic,
        degreesOfFreedom: 1,
        pValue: chiSquarePValue(statistic, 1),
        cramersV: null
      },
      notes: [
        'McNemar exact uses the discordant pair counts with a binomial tail test.',
        'Continuity-corrected McNemar chi-square is shown as a reference statistic.'
      ]
    };
  }

  if (testType === 'sign') {
    const beforeFieldKey = typeof input.beforeField === 'string' && input.beforeField.trim()
      ? input.beforeField.trim()
      : null;
    const afterFieldKey = typeof input.afterField === 'string' && input.afterField.trim()
      ? input.afterField.trim()
      : null;
    if (!beforeFieldKey || !afterFieldKey || beforeFieldKey === afterFieldKey) {
      throw new Error('Sign test requires two different paired numeric fields.');
    }
    const beforeField = requireDatasetField(dataset, beforeFieldKey, 'sign before field');
    const afterField = requireDatasetField(dataset, afterFieldKey, 'sign after field');
    const pairedRows = analysisRows(dataset, [beforeFieldKey, afterFieldKey], options)
      .map(({ row }) => ({
        before: typeof row[beforeFieldKey] === 'number' ? row[beforeFieldKey] : null,
        after: typeof row[afterFieldKey] === 'number' ? row[afterFieldKey] : null
      }))
      .filter((entry): entry is { before: number; after: number } =>
        typeof entry.before === 'number' && Number.isFinite(entry.before)
        && typeof entry.after === 'number' && Number.isFinite(entry.after)
      );
    const differences = pairedRows.map((row) => row.after - row.before);
    const positiveCount = differences.filter((difference) => difference > 0).length;
    const negativeCount = differences.filter((difference) => difference < 0).length;
    const tieCount = differences.length - positiveCount - negativeCount;
    const effectiveN = positiveCount + negativeCount;
    const exact = exactBinomialTest(Math.min(positiveCount, negativeCount), effectiveN, 0.5);
    const sortedDiff = [...differences].sort((left, right) => left - right);
    return {
      testType: 'sign',
      rowField: null,
      rowLabel: null,
      columnField: null,
      columnLabel: null,
      caseCount: dataset.caseCount,
      validCaseCount: pairedRows.length,
      table: {
        rowValues: [],
        columnValues: [],
        cells: []
      },
      method: 'sign_test_exact',
      fisherExact: null,
      binomialExact: null,
      mcnemarExact: null,
      signTest: {
        beforeField: beforeField.key,
        beforeLabel: beforeField.label,
        afterField: afterField.key,
        afterLabel: afterField.label,
        positiveCount,
        negativeCount,
        tieCount,
        medianDifference: percentile(sortedDiff, 0.5),
        pValueTwoSided: exact.pValueTwoSided,
        pValueLeft: exact.pValueLeft,
        pValueRight: exact.pValueRight
      },
      wilcoxonExact: null,
      runsExact: null,
      chiSquare: null,
      notes: [
        'Sign test evaluates paired direction changes without assuming normality.',
        'Ties are excluded from the exact binomial p-value calculation.'
      ]
    };
  }

  if (testType === 'wilcoxon_signed_rank') {
    const beforeFieldKey = typeof input.beforeField === 'string' && input.beforeField.trim()
      ? input.beforeField.trim()
      : null;
    const afterFieldKey = typeof input.afterField === 'string' && input.afterField.trim()
      ? input.afterField.trim()
      : null;
    if (!beforeFieldKey || !afterFieldKey || beforeFieldKey === afterFieldKey) {
      throw new Error('Wilcoxon signed-rank exact test requires two different paired numeric fields.');
    }
    const beforeField = requireDatasetField(dataset, beforeFieldKey, 'wilcoxon before field');
    const afterField = requireDatasetField(dataset, afterFieldKey, 'wilcoxon after field');
    const pairedRows = analysisRows(dataset, [beforeFieldKey, afterFieldKey], options)
      .map(({ row }) => ({
        before: typeof row[beforeFieldKey] === 'number' ? row[beforeFieldKey] : null,
        after: typeof row[afterFieldKey] === 'number' ? row[afterFieldKey] : null
      }))
      .filter((entry): entry is { before: number; after: number } =>
        typeof entry.before === 'number' && Number.isFinite(entry.before)
        && typeof entry.after === 'number' && Number.isFinite(entry.after)
      );
    const differences = pairedRows.map((row) => row.after - row.before);
    const nonZero = differences.filter((difference) => Math.abs(difference) > 1e-12);
    if (nonZero.length < 2) throw new Error('Wilcoxon signed-rank exact test requires at least two non-zero paired differences.');
    const ranks = rankWithTies(nonZero.map((difference) => Math.abs(difference)));
    let positiveRankSum = 0;
    let negativeRankSum = 0;
    for (let index = 0; index < nonZero.length; index += 1) {
      if (nonZero[index]! > 0) positiveRankSum += ranks[index]!;
      else negativeRankSum += ranks[index]!;
    }
    const statisticW = Math.min(positiveRankSum, negativeRankSum);
    const n = nonZero.length;
    const meanW = (n * (n + 1)) / 4;
    const varianceW = (n * (n + 1) * (2 * n + 1)) / 24;
    const continuityCorrection = input.continuityCorrection === false ? 0 : 0.5;
    const zScore = varianceW > 0
      ? (statisticW - meanW - continuityCorrection * Math.sign(statisticW - meanW)) / Math.sqrt(varianceW)
      : null;
    const exactP = wilcoxonSignedRankExactPValue(nonZero.map((difference) => Math.abs(difference)), statisticW);
    return {
      testType: 'wilcoxon_signed_rank',
      rowField: null,
      rowLabel: null,
      columnField: null,
      columnLabel: null,
      caseCount: dataset.caseCount,
      validCaseCount: pairedRows.length,
      table: {
        rowValues: [],
        columnValues: [],
        cells: []
      },
      method: 'wilcoxon_signed_rank_exact',
      fisherExact: null,
      binomialExact: null,
      mcnemarExact: null,
      signTest: null,
      wilcoxonExact: {
        beforeField: beforeField.key,
        beforeLabel: beforeField.label,
        afterField: afterField.key,
        afterLabel: afterField.label,
        pairCount: pairedRows.length,
        nonZeroPairs: nonZero.length,
        positiveRankSum,
        negativeRankSum,
        statisticW,
        zScore,
        pValueTwoSidedExact: exactP,
        pValueTwoSidedAsymptotic: zScore === null ? null : normalTwoSidedPValue(zScore),
        continuityCorrectionApplied: input.continuityCorrection !== false,
        effectSizeR: zScore === null ? null : Math.abs(zScore) / Math.sqrt(n)
      },
      runsExact: null,
      chiSquare: null,
      notes: [
        'Wilcoxon signed-rank exact branch reports exact small-sample p-values when rank scaling permits.',
        'Asymptotic normal approximation is also reported for reference.'
      ]
    };
  }

  if (testType === 'runs') {
    const fieldKey = typeof input.binaryField === 'string' && input.binaryField.trim()
      ? input.binaryField.trim()
      : (typeof input.rowField === 'string' && input.rowField.trim() ? input.rowField.trim() : null);
    if (!fieldKey) throw new Error('Runs exact test requires binaryField (or rowField) to specify the sequence field.');
    const field = requireDatasetField(dataset, fieldKey, 'runs test field');
    const values = analysisRows(dataset, [fieldKey], options)
      .map(({ row }) => row[fieldKey])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (values.length < 5) throw new Error('Runs exact test requires at least five numeric values.');
    const median = medianValue(values);
    if (median === null) throw new Error('Runs exact test could not compute median cutpoint.');
    const binary = values
      .map((value) => (value > median ? 1 : value < median ? 0 : null))
      .filter((value): value is 0 | 1 => value !== null);
    if (binary.length < 4) throw new Error('Runs exact test requires non-tied values around the cutpoint.');
    let runCount = 1;
    for (let index = 1; index < binary.length; index += 1) {
      if (binary[index] !== binary[index - 1]) runCount += 1;
    }
    const positiveCount = binary.filter((value) => value === 1).length;
    const negativeCount = binary.length - positiveCount;
    const expectedRuns = ((2 * positiveCount * negativeCount) / (positiveCount + negativeCount)) + 1;
    const varianceRuns = (2 * positiveCount * negativeCount * ((2 * positiveCount * negativeCount) - positiveCount - negativeCount))
      / (((positiveCount + negativeCount) ** 2) * Math.max(1, positiveCount + negativeCount - 1));
    const zScore = varianceRuns > 0 ? (runCount - expectedRuns) / Math.sqrt(varianceRuns) : null;
    const exactP = runsExactPValue(positiveCount, negativeCount, runCount);
    return {
      testType: 'runs',
      rowField: field.key,
      rowLabel: field.label,
      columnField: null,
      columnLabel: null,
      caseCount: dataset.caseCount,
      validCaseCount: binary.length,
      table: {
        rowValues: [],
        columnValues: [],
        cells: []
      },
      method: 'runs_exact',
      fisherExact: null,
      binomialExact: null,
      mcnemarExact: null,
      signTest: null,
      wilcoxonExact: null,
      runsExact: {
        field: field.key,
        label: field.label,
        runCount,
        positiveCount,
        negativeCount,
        expectedRuns,
        varianceRuns,
        zScore,
        pValueTwoSided: exactP ?? (zScore === null ? null : normalTwoSidedPValue(zScore)),
        medianCutpoint: median
      },
      chiSquare: null,
      notes: [
        'Runs exact branch evaluates sequence randomness around median cutpoint.',
        'Exact permutation p-values are used for small binary sequence lengths.'
      ]
    };
  }

  const rowFieldKey = typeof input.rowField === 'string' ? input.rowField : '';
  const columnFieldKey = typeof input.columnField === 'string' ? input.columnField : '';
  if (!rowFieldKey || !columnFieldKey || rowFieldKey === columnFieldKey) {
    throw new Error('Fisher exact testing requires two different categorical fields.');
  }
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
    testType: 'fisher_2x2',
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
    binomialExact: null,
    mcnemarExact: null,
    signTest: null,
    wilcoxonExact: null,
    runsExact: null,
    chiSquare: crosstab.chiSquare,
    notes
  };
}

function standardizeValues(values: number[]): number[] {
  if (values.length === 0) return [];
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const sd = sampleStdDev(values);
  if (!sd || !Number.isFinite(sd) || sd <= 0) return values.map(() => 0);
  return values.map((value) => (value - mean) / sd);
}

function rankScaledScores(values: number[], higherIsBetter: boolean): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [0.5];
  const ranks = rankValues(values);
  return ranks.map((rank) => {
    const base = Math.max(0, Math.min(1, (rank - 1) / (values.length - 1)));
    return higherIsBetter ? base : 1 - base;
  });
}

export function analyzeConjoint(
  dataset: CaseDataset,
  profileFieldKey: string | null,
  ratingFieldKey: string,
  attributeFieldKeys: string[],
  options?: DatasetAnalysisOptions,
  holdoutFraction = 0.2
): ConjointResult {
  const normalizedProfileField = typeof profileFieldKey === 'string' && profileFieldKey.trim() ? profileFieldKey.trim() : null;
  const normalizedRatingField = ratingFieldKey.trim();
  const normalizedAttributes = [...new Set(attributeFieldKeys.map((field) => field.trim()).filter(Boolean))]
    .filter((field) => field !== normalizedRatingField && field !== normalizedProfileField);
  if (normalizedAttributes.length === 0) {
    throw new Error('Conjoint analysis requires at least one attribute field.');
  }
  const ratingField = requireDatasetField(dataset, normalizedRatingField, 'conjoint rating');
  const profileField = normalizedProfileField ? requireDatasetField(dataset, normalizedProfileField, 'conjoint profile id') : null;
  const attributeMeta = normalizedAttributes.map((field) => requireDatasetField(dataset, field, 'conjoint attribute'));
  const requiredFields = [normalizedRatingField, ...normalizedAttributes, normalizedProfileField].filter(Boolean) as string[];
  const rows = analysisRows(dataset, requiredFields, options).map(({ row }, index) => ({
    index,
    caseId: typeof row.case_id === 'string' ? row.case_id : null,
    caseLabel: typeof row.case_label === 'string' ? row.case_label : null,
    profileId: profileField ? normalizeExactCategory(row[normalizedProfileField!] ?? null) : null,
    score: typeof row[normalizedRatingField] === 'number' && Number.isFinite(row[normalizedRatingField])
      ? row[normalizedRatingField] as number
      : null,
    attributes: Object.fromEntries(normalizedAttributes.map((field) => [field, normalizeExactCategory(row[field] ?? null)])) as Record<string, string>
  }))
    .filter((entry) => typeof entry.score === 'number' && Number.isFinite(entry.score) && normalizedAttributes.every((field) => entry.attributes[field]))
    .map((entry) => ({
      ...entry,
      score: entry.score as number
    }));
  if (rows.length < 6) {
    throw new Error('Conjoint analysis requires at least six usable profile rows.');
  }
  const holdoutStep = holdoutFraction > 0 ? Math.max(3, Math.round(1 / Math.max(0.05, Math.min(0.45, holdoutFraction)))) : Number.POSITIVE_INFINITY;
  const holdoutRows = rows.filter((entry) => Number.isFinite(holdoutStep) && entry.index % holdoutStep === 0);
  const trainRows = rows.filter((entry) => !holdoutRows.includes(entry));
  const estimationRows = trainRows.length >= 4 ? trainRows : rows;
  const overallMean = estimationRows.reduce((total, row) => total + row.score, 0) / estimationRows.length;

  const attributeUtilities: ConjointAttributeSummary[] = attributeMeta.map((fieldMeta) => {
    const levelGroups = new Map<string, number[]>();
    for (const row of estimationRows) {
      const level = row.attributes[fieldMeta.key];
      const list = levelGroups.get(level) ?? [];
      list.push(row.score);
      levelGroups.set(level, list);
    }
    const rawLevels = [...levelGroups.entries()].map(([level, values]) => {
      const meanScore = values.reduce((total, value) => total + value, 0) / values.length;
      return {
        level,
        count: values.length,
        meanScore,
        utility: meanScore - overallMean
      };
    });
    const utilityMean = rawLevels.length > 0
      ? rawLevels.reduce((total, item) => total + item.utility, 0) / rawLevels.length
      : 0;
    const levels: ConjointAttributeLevel[] = rawLevels
      .map((item) => ({
        level: item.level,
        count: item.count,
        meanScore: item.meanScore,
        utility: item.utility - utilityMean
      }))
      .sort((left, right) => (right.utility ?? 0) - (left.utility ?? 0));
    const utilities = levels.map((item) => item.utility ?? 0);
    const range = utilities.length > 1 ? Math.max(...utilities) - Math.min(...utilities) : 0;
    return {
      field: fieldMeta.key,
      label: fieldMeta.label,
      levels,
      range,
      importance: null
    };
  });

  const totalRange = attributeUtilities.reduce((total, item) => total + (item.range ?? 0), 0);
  for (const summary of attributeUtilities) {
    summary.importance = totalRange > 0 ? ((summary.range ?? 0) / totalRange) * 100 : null;
  }

  const utilityLookup = new Map<string, number>();
  for (const summary of attributeUtilities) {
    for (const level of summary.levels) {
      utilityLookup.set(`${summary.field}::${level.level}`, level.utility ?? 0);
    }
  }

  const profiles: ConjointProfileEstimate[] = rows.map((row) => {
    const predictedScore = overallMean + normalizedAttributes.reduce((total, field) => total + (utilityLookup.get(`${field}::${row.attributes[field]}`) ?? 0), 0);
    return {
      caseId: row.caseId,
      caseLabel: row.caseLabel,
      holdout: holdoutRows.includes(row),
      observedScore: row.score,
      predictedScore,
      residual: row.score - predictedScore,
      attributes: row.attributes
    };
  });

  const evaluationRows = holdoutRows.length >= 3 ? profiles.filter((row) => row.holdout) : profiles;
  const absoluteErrors = evaluationRows.map((row) => Math.abs(row.residual));
  const squaredErrors = evaluationRows.map((row) => row.residual ** 2);
  return {
    profileField: profileField?.key ?? null,
    profileLabel: profileField?.label ?? null,
    ratingField: ratingField.key,
    ratingLabel: ratingField.label,
    attributeFields: normalizedAttributes,
    attributeLabels: attributeMeta.map((field) => field.label),
    caseCount: dataset.caseCount,
    usableCaseCount: rows.length,
    holdoutCount: holdoutRows.length,
    overallMean,
    meanAbsoluteError: absoluteErrors.length > 0 ? absoluteErrors.reduce((total, value) => total + value, 0) / absoluteErrors.length : null,
    rootMeanSquaredError: squaredErrors.length > 0 ? Math.sqrt(squaredErrors.reduce((total, value) => total + value, 0) / squaredErrors.length) : null,
    pearsonCorrelation: pearsonCorrelation(evaluationRows.map((row) => row.observedScore), evaluationRows.map((row) => row.predictedScore)),
    attributes: attributeUtilities.sort((left, right) => (right.importance ?? -Infinity) - (left.importance ?? -Infinity)),
    profiles: profiles.slice(0, 250),
    notes: [
      'Part-worth utilities are mean-centered within each attribute and estimated from profile ratings.',
      holdoutRows.length >= 3
        ? 'Prediction diagnostics are evaluated against deterministic holdout rows.'
        : 'Prediction diagnostics are evaluated on in-sample rows because holdout rows were insufficient.'
    ]
  };
}

export function analyzeOptimalScaling(
  dataset: CaseDataset,
  fieldKeys: string[],
  anchorFieldKey?: string | null,
  options?: DatasetAnalysisOptions,
  maxIterations = 20
): OptimalScalingResult {
  const normalizedFields = [...new Set(fieldKeys.map((field) => field.trim()).filter(Boolean))];
  if (normalizedFields.length < 2) {
    throw new Error('Optimal scaling requires at least two categorical fields.');
  }
  const fieldMeta = normalizedFields.map((field) => requireDatasetField(dataset, field, 'optimal scaling field'));
  const normalizedAnchor = typeof anchorFieldKey === 'string' && anchorFieldKey.trim() ? anchorFieldKey.trim() : null;
  const anchorMeta = normalizedAnchor ? requireDatasetField(dataset, normalizedAnchor, 'optimal scaling anchor') : null;
  const requiredFields = [...normalizedFields, normalizedAnchor].filter(Boolean) as string[];
  const rows = analysisRows(dataset, requiredFields, options)
    .map(({ row }) => {
      const values = Object.fromEntries(normalizedFields.map((field) => [field, normalizeExactCategory(row[field] ?? null)])) as Record<string, string>;
      const anchor = normalizedAnchor && typeof row[normalizedAnchor] === 'number' && Number.isFinite(row[normalizedAnchor])
        ? row[normalizedAnchor] as number
        : null;
      return {
        caseId: typeof row.case_id === 'string' ? row.case_id : null,
        caseLabel: typeof row.case_label === 'string' ? row.case_label : null,
        values,
        anchor
      };
    })
    .filter((entry) => normalizedFields.every((field) => entry.values[field]));
  if (rows.length < 8) {
    throw new Error('Optimal scaling requires at least eight usable rows.');
  }

  const levelQuantifications = new Map<string, Map<string, number>>();
  for (const field of normalizedFields) {
    const levels = [...new Set(rows.map((row) => row.values[field]))].sort((left, right) => left.localeCompare(right));
    const map = new Map<string, number>();
    levels.forEach((level, index) => {
      const centered = levels.length <= 1 ? 0 : ((index / (levels.length - 1)) * 2) - 1;
      map.set(level, centered);
    });
    levelQuantifications.set(field, map);
  }

  let caseScores = rows.map(() => 0);
  let iterations = 0;
  const runIterations = normalizedAnchor ? 1 : Math.max(3, Math.min(60, Math.floor(maxIterations)));
  for (let iteration = 0; iteration < runIterations; iteration += 1) {
    if (normalizedAnchor) {
      const anchorValues = rows.map((row) => row.anchor ?? 0);
      caseScores = standardizeValues(anchorValues);
    } else {
      caseScores = rows.map((row) => {
        const values = normalizedFields.map((field) => levelQuantifications.get(field)?.get(row.values[field]) ?? 0);
        return values.reduce((total, value) => total + value, 0) / Math.max(1, values.length);
      });
      caseScores = standardizeValues(caseScores);
    }
    for (const field of normalizedFields) {
      const perLevel = new Map<string, number[]>();
      rows.forEach((row, rowIndex) => {
        const level = row.values[field];
        const list = perLevel.get(level) ?? [];
        list.push(caseScores[rowIndex]!);
        perLevel.set(level, list);
      });
      const updated = new Map<string, number>();
      const centeredValues = [...perLevel.entries()].map(([level, values]) => ({
        level,
        value: values.reduce((total, value) => total + value, 0) / Math.max(1, values.length)
      }));
      const mean = centeredValues.reduce((total, entry) => total + entry.value, 0) / Math.max(1, centeredValues.length);
      const sd = sampleStdDev(centeredValues.map((entry) => entry.value)) ?? 0;
      for (const entry of centeredValues) {
        updated.set(entry.level, sd > 0 ? (entry.value - mean) / sd : entry.value - mean);
      }
      levelQuantifications.set(field, updated);
    }
    iterations = iteration + 1;
  }

  const fieldSummaries: OptimalScalingFieldSummary[] = fieldMeta.map((meta) => {
    const map = levelQuantifications.get(meta.key) ?? new Map<string, number>();
    const rowScores = rows.map((row) => map.get(row.values[meta.key]) ?? 0);
    const discrimination = pearsonCorrelation(rowScores, caseScores);
    const levels = [...map.entries()]
      .map(([level, quantification]) => {
        const levelRows = rows.filter((row) => row.values[meta.key] === level);
        const anchorValues = levelRows.map((row) => row.anchor).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
        return {
          level,
          count: levelRows.length,
          quantification,
          anchorMean: anchorValues.length > 0
            ? anchorValues.reduce((total, value) => total + value, 0) / anchorValues.length
            : null
        };
      })
      .sort((left, right) => right.quantification - left.quantification);
    return {
      field: meta.key,
      label: meta.label,
      discrimination,
      levels
    };
  });

  const eigenvalue = fieldSummaries.reduce((total, summary) => total + ((summary.discrimination ?? 0) ** 2), 0);
  return {
    method: 'alternating_least_squares_single_dimension',
    fields: normalizedFields,
    fieldLabels: fieldMeta.map((field) => field.label),
    anchorField: anchorMeta?.key ?? null,
    anchorLabel: anchorMeta?.label ?? null,
    caseCount: dataset.caseCount,
    usableCaseCount: rows.length,
    iterations,
    eigenvalue,
    varianceExplained: normalizedFields.length > 0 ? Math.max(0, Math.min(1, eigenvalue / normalizedFields.length)) : null,
    fieldSummaries,
    caseScores: rows.slice(0, 250).map((row, index) => ({
      caseId: row.caseId,
      caseLabel: row.caseLabel,
      score: caseScores[index] ?? 0,
      values: row.values
    })),
    notes: [
      normalizedAnchor
        ? 'Anchor-guided optimal scaling uses standardized anchor scores to quantify category levels.'
        : 'Optimal scaling uses alternating least-squares updates over one latent dimension.',
      'Quantifications are centered and standardized per field for comparability.'
    ]
  };
}

export function analyzeDirectMarketing(
  dataset: CaseDataset,
  config: {
    customerField?: string | null;
    responseField?: string | null;
    recencyField?: string | null;
    frequencyField?: string | null;
    monetaryField?: string | null;
    scoringWeights?: Partial<{ recency: number; frequency: number; monetary: number; response: number }>;
  },
  options?: DatasetAnalysisOptions
): DirectMarketingResult {
  const normalizedCustomer = typeof config.customerField === 'string' && config.customerField.trim() ? config.customerField.trim() : null;
  const normalizedResponse = typeof config.responseField === 'string' && config.responseField.trim() ? config.responseField.trim() : null;
  const normalizedRecency = typeof config.recencyField === 'string' && config.recencyField.trim() ? config.recencyField.trim() : null;
  const normalizedFrequency = typeof config.frequencyField === 'string' && config.frequencyField.trim() ? config.frequencyField.trim() : null;
  const normalizedMonetary = typeof config.monetaryField === 'string' && config.monetaryField.trim() ? config.monetaryField.trim() : null;
  const activeScoringFields = [normalizedRecency, normalizedFrequency, normalizedMonetary, normalizedResponse].filter(Boolean);
  if (activeScoringFields.length === 0) {
    throw new Error('Direct marketing requires at least one recency, frequency, monetary, or response field.');
  }

  const customerMeta = normalizedCustomer ? requireDatasetField(dataset, normalizedCustomer, 'direct marketing customer id') : null;
  const responseMeta = normalizedResponse ? requireDatasetField(dataset, normalizedResponse, 'direct marketing response') : null;
  const recencyMeta = normalizedRecency ? requireDatasetField(dataset, normalizedRecency, 'direct marketing recency') : null;
  const frequencyMeta = normalizedFrequency ? requireDatasetField(dataset, normalizedFrequency, 'direct marketing frequency') : null;
  const monetaryMeta = normalizedMonetary ? requireDatasetField(dataset, normalizedMonetary, 'direct marketing monetary') : null;
  const requiredFields = [normalizedCustomer, normalizedResponse, normalizedRecency, normalizedFrequency, normalizedMonetary].filter(Boolean) as string[];
  const rows = analysisRows(dataset, requiredFields, options).map(({ row }, index) => ({
    index,
    caseId: typeof row.case_id === 'string' ? row.case_id : null,
    caseLabel: typeof row.case_label === 'string' ? row.case_label : null,
    customerId: normalizedCustomer ? normalizeExactCategory(row[normalizedCustomer] ?? null) : normalizeExactCategory(row.case_id ?? row.case_label ?? index + 1),
    response: normalizedResponse ? normalizeBinaryValue(row[normalizedResponse] ?? null) : null,
    recency: normalizedRecency && typeof row[normalizedRecency] === 'number' && Number.isFinite(row[normalizedRecency]) ? row[normalizedRecency] as number : null,
    frequency: normalizedFrequency && typeof row[normalizedFrequency] === 'number' && Number.isFinite(row[normalizedFrequency]) ? row[normalizedFrequency] as number : null,
    monetary: normalizedMonetary && typeof row[normalizedMonetary] === 'number' && Number.isFinite(row[normalizedMonetary]) ? row[normalizedMonetary] as number : null
  }));
  if (rows.length < 10) {
    throw new Error('Direct marketing analysis requires at least ten usable rows.');
  }

  const recencyIndices = rows.map((row, index) => ({ index, value: row.recency })).filter((entry): entry is { index: number; value: number } => typeof entry.value === 'number');
  const frequencyIndices = rows.map((row, index) => ({ index, value: row.frequency })).filter((entry): entry is { index: number; value: number } => typeof entry.value === 'number');
  const monetaryIndices = rows.map((row, index) => ({ index, value: row.monetary })).filter((entry): entry is { index: number; value: number } => typeof entry.value === 'number');
  const responseIndices = rows.map((row, index) => ({ index, value: row.response })).filter((entry): entry is { index: number; value: number } => typeof entry.value === 'number');

  const recencyScores = new Map<number, number>();
  rankScaledScores(recencyIndices.map((entry) => entry.value), false).forEach((score, rankIndex) => {
    recencyScores.set(recencyIndices[rankIndex]!.index, score);
  });
  const frequencyScores = new Map<number, number>();
  rankScaledScores(frequencyIndices.map((entry) => entry.value), true).forEach((score, rankIndex) => {
    frequencyScores.set(frequencyIndices[rankIndex]!.index, score);
  });
  const monetaryScores = new Map<number, number>();
  rankScaledScores(monetaryIndices.map((entry) => entry.value), true).forEach((score, rankIndex) => {
    monetaryScores.set(monetaryIndices[rankIndex]!.index, score);
  });

  const baseWeights = {
    recency: 0.15,
    frequency: 0.25,
    monetary: 0.20,
    response: 0.40,
    ...config.scoringWeights
  };
  const customerScores: DirectMarketingCustomerScore[] = rows.map((row, index) => {
    const recencyScore = recencyScores.get(index) ?? null;
    const frequencyScore = frequencyScores.get(index) ?? null;
    const monetaryScore = monetaryScores.get(index) ?? null;
    const responseScore = typeof row.response === 'number' ? row.response : null;
    const components: Array<{ score: number; weight: number }> = [];
    if (recencyScore !== null) components.push({ score: recencyScore, weight: Math.max(0, baseWeights.recency) });
    if (frequencyScore !== null) components.push({ score: frequencyScore, weight: Math.max(0, baseWeights.frequency) });
    if (monetaryScore !== null) components.push({ score: monetaryScore, weight: Math.max(0, baseWeights.monetary) });
    if (responseScore !== null) components.push({ score: responseScore, weight: Math.max(0, baseWeights.response) });
    const totalWeight = components.reduce((total, item) => total + item.weight, 0);
    const propensity = totalWeight > 0
      ? components.reduce((total, item) => total + (item.score * item.weight), 0) / totalWeight
      : 0;
    const segment = (() => {
      const r = recencyScore ?? propensity;
      const f = frequencyScore ?? propensity;
      const m = monetaryScore ?? propensity;
      if (r >= 0.8 && f >= 0.75 && m >= 0.65) return 'Champions';
      if (r >= 0.6 && f >= 0.65) return 'Loyal';
      if (r < 0.35 && f >= 0.6) return 'At risk';
      if (r >= 0.75 && f < 0.35) return 'New';
      if (m >= 0.75) return 'High value';
      if (propensity >= 0.65) return 'Growth';
      if (propensity < 0.35) return 'Dormant';
      return 'Core';
    })();
    return {
      caseId: row.caseId,
      caseLabel: row.caseLabel,
      customerId: row.customerId || row.caseId || row.caseLabel || `row_${index + 1}`,
      recencyScore,
      frequencyScore,
      monetaryScore,
      propensity,
      response: row.response,
      segment
    };
  });

  const responders = customerScores.filter((entry) => entry.response === 1).length;
  const respondedCases = customerScores.filter((entry) => entry.response !== null).length;
  const overallResponseRate = respondedCases > 0 ? responders / respondedCases : null;

  const segmentMap = new Map<string, DirectMarketingCustomerScore[]>();
  for (const score of customerScores) {
    const list = segmentMap.get(score.segment) ?? [];
    list.push(score);
    segmentMap.set(score.segment, list);
  }
  const segments: DirectMarketingSegmentSummary[] = [...segmentMap.entries()]
    .map(([segment, entries]) => {
      const responderCount = entries.filter((entry) => entry.response === 1).length;
      const responded = entries.filter((entry) => entry.response !== null).length;
      const sourceRows = entries.map((entry) => rows.find((row) => (row.caseId && row.caseId === entry.caseId) || row.customerId === entry.customerId)).filter(Boolean);
      const recencyValues = sourceRows.map((row) => row?.recency).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      const frequencyValues = sourceRows.map((row) => row?.frequency).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      const monetaryValues = sourceRows.map((row) => row?.monetary).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      return {
        segment,
        count: entries.length,
        averagePropensity: entries.reduce((total, entry) => total + entry.propensity, 0) / entries.length,
        responseRate: responded > 0 ? responderCount / responded : null,
        averageRecency: recencyValues.length > 0 ? recencyValues.reduce((total, value) => total + value, 0) / recencyValues.length : null,
        averageFrequency: frequencyValues.length > 0 ? frequencyValues.reduce((total, value) => total + value, 0) / frequencyValues.length : null,
        averageMonetary: monetaryValues.length > 0 ? monetaryValues.reduce((total, value) => total + value, 0) / monetaryValues.length : null
      };
    })
    .sort((left, right) =>
      (right.responseRate ?? -Infinity) - (left.responseRate ?? -Infinity)
      || right.averagePropensity - left.averagePropensity
      || right.count - left.count
    );

  const sortedByPropensity = [...customerScores].sort((left, right) => right.propensity - left.propensity);
  const decileSize = Math.max(1, Math.ceil(sortedByPropensity.length / 10));
  const deciles: DirectMarketingDecile[] = [];
  let cumulativeCount = 0;
  let cumulativeResponders = 0;
  for (let decile = 0; decile < 10; decile += 1) {
    const bucket = sortedByPropensity.slice(decile * decileSize, (decile + 1) * decileSize);
    if (bucket.length === 0) break;
    const bucketResponders = bucket.filter((entry) => entry.response === 1).length;
    const bucketResponded = bucket.filter((entry) => entry.response !== null).length;
    cumulativeCount += bucket.length;
    cumulativeResponders += bucketResponders;
    const responseRate = bucketResponded > 0 ? bucketResponders / bucketResponded : null;
    deciles.push({
      decile: decile + 1,
      count: bucket.length,
      cumulativeCount,
      responders: bucketResponders,
      cumulativeResponders,
      responseRate,
      lift: overallResponseRate && responseRate !== null ? responseRate / overallResponseRate : null,
      averagePropensity: bucket.reduce((total, entry) => total + entry.propensity, 0) / bucket.length
    });
  }

  return {
    customerField: customerMeta?.key ?? null,
    customerLabel: customerMeta?.label ?? null,
    responseField: responseMeta?.key ?? null,
    responseLabel: responseMeta?.label ?? null,
    recencyField: recencyMeta?.key ?? null,
    recencyLabel: recencyMeta?.label ?? null,
    frequencyField: frequencyMeta?.key ?? null,
    frequencyLabel: frequencyMeta?.label ?? null,
    monetaryField: monetaryMeta?.key ?? null,
    monetaryLabel: monetaryMeta?.label ?? null,
    caseCount: dataset.caseCount,
    usableCaseCount: customerScores.length,
    overallResponseRate,
    scoringWeights: baseWeights,
    segments,
    deciles,
    customerScores: sortedByPropensity.slice(0, 250),
    topRecommendations: segments.slice(0, 3).map((segment) =>
      segment.responseRate !== null
        ? `${segment.segment}: target first (response ${Math.round(segment.responseRate * 1000) / 10}%, n=${segment.count})`
        : `${segment.segment}: high propensity segment (n=${segment.count})`
    ),
    notes: [
      'Propensity scores blend available RFM and response dimensions using weighted rank scaling.',
      overallResponseRate === null
        ? 'No binary response field was supplied; lift table response rates are unavailable.'
        : 'Lift values compare decile response rates with the overall observed response rate.'
    ]
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

type NormalizedImputationStrategy = {
  field: string;
  label: string;
  method: ImputationMethod;
  value: DatasetValue;
  predictorFields: string[];
  nearestNeighbors: number;
  donorField: string | null;
};

type ImputationApplication = {
  rows: DatasetRow[];
  appliedStrategies: ImputationPlanResult['strategies'];
  replacementByField: Record<string, number>;
  totalReplacements: number;
  notes: string[];
};

function medianValue(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return percentile(sorted, 0.5);
}

function normalizeImputationStrategies(
  dataset: CaseDataset,
  strategies: ImputationStrategy[]
): NormalizedImputationStrategy[] {
  const normalized = strategies
    .map((strategy) => ({
      field: String(strategy.field ?? '').trim(),
      method: strategy.method,
      value: strategy.value ?? null,
      predictorFields: Array.isArray(strategy.predictorFields)
        ? strategy.predictorFields.map((field) => String(field ?? '').trim()).filter(Boolean)
        : [],
      nearestNeighbors: Number.isFinite(strategy.nearestNeighbors)
        ? Math.max(1, Math.min(20, Math.floor(Number(strategy.nearestNeighbors))))
        : 5,
      donorField: typeof strategy.donorField === 'string' && strategy.donorField.trim()
        ? strategy.donorField.trim()
        : null
    }))
    .filter((strategy) => strategy.field);
  if (normalized.length === 0) throw new Error('Choose at least one field imputation strategy.');
  return normalized.map((strategy) => {
    const field = requireDatasetField(dataset, strategy.field, 'imputation');
    const predictorFields = strategy.predictorFields
      .map((fieldKey) => requireDatasetField(dataset, fieldKey, 'imputation predictor').key)
      .filter((fieldKey) => fieldKey !== field.key);
    const donorField = strategy.donorField
      ? requireDatasetField(dataset, strategy.donorField, 'imputation donor field').key
      : null;
    return {
      field: field.key,
      label: field.label,
      method: strategy.method,
      value: strategy.value,
      predictorFields: [...new Set(predictorFields)],
      nearestNeighbors: strategy.nearestNeighbors,
      donorField
    };
  });
}

function drawStandardNormal(rng: () => number): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 <= Number.EPSILON) u1 = rng();
  while (u2 <= Number.EPSILON) u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function coerceBinaryTemplate(value: DatasetValue, templateValues: DatasetValue[]): DatasetValue {
  const positive = templateValues.find((entry) => normalizeBinaryValue(entry) === 1) ?? 1;
  const negative = templateValues.find((entry) => normalizeBinaryValue(entry) === 0) ?? 0;
  return value === 1 ? positive : negative;
}

function inferImputationFallbackValue(
  strategy: NormalizedImputationStrategy,
  observedValues: DatasetValue[]
): DatasetValue {
  const numericValues = observedValues.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const nonMissing = observedValues.filter((value): value is Exclude<DatasetValue, null> => value !== null);
  if (strategy.method === 'constant') return strategy.value ?? null;
  if (strategy.method === 'median') return medianValue(numericValues);
  if (strategy.method === 'mode') return mostCommonValue(nonMissing);
  if (strategy.method === 'mean') {
    if (numericValues.length === 0) return mostCommonValue(nonMissing);
    return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
  }
  if (strategy.method === 'logistic_binary') {
    const binary = observedValues
      .map((value) => normalizeBinaryValue(value))
      .filter((value): value is number => value !== null);
    if (binary.length === 0) return 0;
    const prevalence = binary.reduce((total, value) => total + value, 0) / binary.length;
    return coerceBinaryTemplate(prevalence >= 0.5 ? 1 : 0, observedValues);
  }
  return mostCommonValue(nonMissing);
}

function fitLogisticImputationModel(
  rows: DatasetRow[],
  targetField: string,
  predictorFields: string[]
): {
  coefficients: number[];
  means: number[];
  stdDevs: number[];
  prevalence: number;
  templateValues: DatasetValue[];
} | null {
  if (predictorFields.length === 0) return null;
  const donors = rows
    .map((row) => ({
      y: normalizeBinaryValue(row[targetField] ?? null),
      predictors: predictorFields.map((field) => row[field])
    }))
    .filter((entry): entry is { y: number; predictors: number[] } =>
      entry.y !== null && entry.predictors.every((value) => typeof value === 'number' && Number.isFinite(value))
    );
  if (donors.length < Math.max(8, predictorFields.length + 2)) return null;
  const means = predictorFields.map((_field, index) =>
    donors.reduce((total, row) => total + row.predictors[index]!, 0) / donors.length
  );
  const stdDevs = predictorFields.map((_field, index) =>
    sampleStdDev(donors.map((row) => row.predictors[index]!)) || 1
  );
  const design = donors.map((row) => [
    1,
    ...row.predictors.map((value, index) => (value - means[index]!) / stdDevs[index]!)
  ]);
  const response = donors.map((row) => row.y);
  const beta = new Array<number>(predictorFields.length + 1).fill(0);
  const learningRate = 0.08;
  const l2Penalty = 0.01;
  for (let iteration = 0; iteration < 500; iteration += 1) {
    const gradient = new Array<number>(beta.length).fill(0);
    for (let rowIndex = 0; rowIndex < design.length; rowIndex += 1) {
      const x = design[rowIndex]!;
      const eta = beta.reduce((total, coefficient, coefficientIndex) => total + (coefficient * x[coefficientIndex]!), 0);
      const probability = 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, eta))));
      const residual = response[rowIndex]! - probability;
      for (let coefficientIndex = 0; coefficientIndex < gradient.length; coefficientIndex += 1) {
        gradient[coefficientIndex]! += residual * x[coefficientIndex]!;
      }
    }
    for (let coefficientIndex = 0; coefficientIndex < beta.length; coefficientIndex += 1) {
      const penalty = coefficientIndex === 0 ? 0 : l2Penalty * beta[coefficientIndex]!;
      beta[coefficientIndex]! += learningRate * ((gradient[coefficientIndex]! / design.length) - penalty);
    }
  }
  const prevalence = response.reduce((total, value) => total + value, 0) / response.length;
  return {
    coefficients: beta,
    means,
    stdDevs,
    prevalence,
    templateValues: rows
      .map((row) => row[targetField] ?? null)
      .filter((value): value is DatasetValue => normalizeBinaryValue(value) !== null)
  };
}

function predictiveMeanMatchingCandidate(
  row: DatasetRow,
  donorRows: DatasetRow[],
  targetField: string,
  predictorFields: string[],
  nearestNeighbors: number,
  rng: () => number
): DatasetValue {
  const validPredictors = predictorFields.filter((field) => typeof row[field] === 'number' && Number.isFinite(row[field] as number));
  if (validPredictors.length === 0) {
    const fallback = donorRows[Math.floor(rng() * donorRows.length)]?.[targetField] ?? null;
    return fallback;
  }
  const donorVectors = donorRows
    .map((donor) => ({
      value: donor[targetField] ?? null,
      predictors: validPredictors.map((field) => donor[field])
    }))
    .filter((entry): entry is { value: DatasetValue; predictors: number[] } =>
      typeof entry.value === 'number' && entry.predictors.every((value) => typeof value === 'number' && Number.isFinite(value))
    );
  if (donorVectors.length === 0) {
    return donorRows[Math.floor(rng() * donorRows.length)]?.[targetField] ?? null;
  }
  const means = validPredictors.map((_field, index) =>
    donorVectors.reduce((total, item) => total + item.predictors[index]!, 0) / donorVectors.length
  );
  const stdDevs = validPredictors.map((_field, index) =>
    sampleStdDev(donorVectors.map((item) => item.predictors[index]!)) || 1
  );
  const standardizedRow = validPredictors.map((field, index) =>
    ((row[field] as number) - means[index]!) / stdDevs[index]!
  );
  const rankedDonors = donorVectors
    .map((donor) => ({
      value: donor.value,
      distance: Math.sqrt(donor.predictors.reduce((total, predictorValue, index) => {
        const standardizedDonor = (predictorValue - means[index]!) / stdDevs[index]!;
        return total + ((standardizedDonor - standardizedRow[index]!) ** 2);
      }, 0))
    }))
    .sort((left, right) => left.distance - right.distance);
  const k = Math.max(1, Math.min(nearestNeighbors, rankedDonors.length));
  const selected = rankedDonors[Math.floor(rng() * k)]?.value ?? rankedDonors[0]?.value ?? null;
  return selected;
}

function applyImputationStrategies(
  dataset: CaseDataset,
  strategies: ImputationStrategy[],
  options: DatasetAnalysisOptions | undefined,
  runtime: { randomSeed: number; stochastic: boolean }
): ImputationApplication {
  const normalizedStrategies = normalizeImputationStrategies(dataset, strategies);
  const rows = dataset.rows.map((row) => ({ ...row }));
  const rng = seededRandom(runtime.randomSeed);
  const notes: string[] = [];
  const appliedStrategies: ImputationPlanResult['strategies'] = [];
  const replacementByField: Record<string, number> = {};

  for (const strategy of normalizedStrategies) {
    const donors = rows.filter((row) => (row[strategy.field] ?? null) !== null);
    const observedValues = donors.map((row) => row[strategy.field] ?? null);
    const fallbackValue = inferImputationFallbackValue(strategy, observedValues);
    const logisticModel = strategy.method === 'logistic_binary'
      ? fitLogisticImputationModel(rows, strategy.field, strategy.predictorFields)
      : null;
    const replacementRows = rows.filter((row) => (row[strategy.field] ?? null) === null);
    let replacements = 0;
    for (const row of replacementRows) {
      let imputed: DatasetValue = fallbackValue;
      if (strategy.method === 'random_hot_deck' && donors.length > 0) {
        const donorPool = strategy.donorField
          ? donors.filter((donor) => normalizeExactCategory(donor[strategy.donorField!] ?? null) === normalizeExactCategory(row[strategy.donorField!] ?? null))
          : donors;
        const selectedPool = donorPool.length > 0 ? donorPool : donors;
        imputed = selectedPool[Math.floor(rng() * selectedPool.length)]?.[strategy.field] ?? fallbackValue;
      } else if (strategy.method === 'predictive_mean_matching' && donors.length > 0) {
        imputed = predictiveMeanMatchingCandidate(
          row,
          donors,
          strategy.field,
          strategy.predictorFields,
          strategy.nearestNeighbors,
          rng
        );
      } else if (strategy.method === 'logistic_binary') {
        const model = logisticModel;
        if (model) {
          const usable = strategy.predictorFields.every((field, index) =>
            typeof row[field] === 'number' && Number.isFinite(row[field] as number) && Number.isFinite(model.stdDevs[index]!)
          );
          const probability = usable
            ? 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, model.coefficients.reduce((total, coefficient, index) => {
              if (index === 0) return total + coefficient;
              const standardized = ((row[strategy.predictorFields[index - 1]!] as number) - model.means[index - 1]!) / model.stdDevs[index - 1]!;
              return total + (coefficient * standardized);
            }, 0)))))
            : model.prevalence;
          const draw = runtime.stochastic ? rng() : 0.5;
          const binaryValue = draw < probability ? 1 : 0;
          imputed = coerceBinaryTemplate(binaryValue, model.templateValues);
        } else {
          imputed = fallbackValue;
        }
      } else if (strategy.method === 'median') {
        const numeric = observedValues.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
        imputed = medianValue(numeric);
      } else if (strategy.method === 'mean') {
        const numeric = observedValues.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
        imputed = numeric.length > 0
          ? numeric.reduce((total, value) => total + value, 0) / numeric.length
          : fallbackValue;
      } else if (strategy.method === 'mode') {
        imputed = mostCommonValue(observedValues.filter((value): value is Exclude<DatasetValue, null> => value !== null));
      } else if (strategy.method === 'constant') {
        imputed = strategy.value ?? null;
      }
      row[strategy.field] = imputed;
      replacements += 1;
    }
    replacementByField[strategy.field] = replacements;
    appliedStrategies.push({
      field: strategy.field,
      label: strategy.label,
      method: strategy.method,
      value: strategy.method === 'constant' || strategy.method === 'mean' || strategy.method === 'median' || strategy.method === 'mode'
        ? fallbackValue
        : null,
      replacements
    });
    if (strategy.method === 'predictive_mean_matching') {
      notes.push(`Predictive mean matching applied on ${strategy.label} with k=${strategy.nearestNeighbors}.`);
    } else if (strategy.method === 'random_hot_deck') {
      notes.push(`Random hot-deck donors applied on ${strategy.label}.`);
    } else if (strategy.method === 'logistic_binary') {
      notes.push(`Logistic binary imputation applied on ${strategy.label}${strategy.predictorFields.length ? ` using predictors ${strategy.predictorFields.join(', ')}` : ''}.`);
    }
  }

  return {
    rows,
    appliedStrategies,
    replacementByField,
    totalReplacements: Object.values(replacementByField).reduce((total, value) => total + value, 0),
    notes
  };
}

function finalizeImputedDataset(dataset: CaseDataset, rows: DatasetRow[], noteMessages: string[]): CaseDataset {
  const fieldValueTypes = new Map<string, DatasetValueType>();
  for (const field of dataset.fields) {
    fieldValueTypes.set(field.key, inferValueType(rows.map((row) => row[field.key] ?? null)));
  }
  return {
    ...dataset,
    fields: dataset.fields.map((field) => ({
      ...field,
      valueType: fieldValueTypes.get(field.key) ?? field.valueType
    })),
    rows,
    notes: [
      ...dataset.notes,
      ...noteMessages.map((message) => ({ level: 'info' as const, message }))
    ]
  };
}

export function buildImputationPlan(
  dataset: CaseDataset,
  strategies: ImputationStrategy[],
  options?: DatasetAnalysisOptions
): ImputationPlanResult {
  const prepared = normalizeDatasetForAnalysis(dataset, options);
  const applied = applyImputationStrategies(prepared, strategies, options, {
    randomSeed: 20260421,
    stochastic: false
  });
  return {
    caseCount: prepared.caseCount,
    strategies: applied.appliedStrategies,
    dataset: finalizeImputedDataset(prepared, applied.rows, [
      `Applied ${applied.appliedStrategies.length} imputation strateg${applied.appliedStrategies.length === 1 ? 'y' : 'ies'} to a preview dataset.`
    ]),
    notes: [
      'Imputation currently creates a preview dataset; it does not overwrite stored project cases or attributes.',
      'Use this as a traceable preprocessing step before formal analysis.',
      ...applied.notes
    ]
  };
}

export function buildMultipleImputationPlan(
  dataset: CaseDataset,
  strategies: ImputationStrategy[],
  options?: DatasetAnalysisOptions,
  config: MultipleImputationConfig = {}
): MultipleImputationPlanResult {
  const prepared = normalizeDatasetForAnalysis(dataset, options);
  const imputationsRequested = Math.max(2, Math.min(50, Math.floor(config.imputations ?? 5)));
  const randomSeed = Number.isFinite(config.randomSeed) ? Math.floor(Number(config.randomSeed)) : 20260421;
  const chainIterations = Math.max(1, Math.min(10, Math.floor(config.chainIterations ?? 3)));
  const includeOriginal = config.includeOriginalDataset !== false;
  const datasets: MultipleImputationPlanResult['datasets'] = [];

  if (includeOriginal) {
    datasets.push({
      imputationIndex: 0,
      dataset: cloneCaseDataset(prepared),
      totalReplacements: 0,
      replacementByField: {}
    });
  }

  for (let index = 1; index <= imputationsRequested; index += 1) {
    let rows = prepared.rows.map((row) => ({ ...row }));
    const replacementByField: Record<string, number> = {};
    let totalReplacements = 0;
    for (let chain = 0; chain < chainIterations; chain += 1) {
      const applied = applyImputationStrategies(
        {
          ...prepared,
          rows
        },
        strategies,
        options,
        {
          randomSeed: randomSeed + (index * 1009) + (chain * 37),
          stochastic: true
        }
      );
      rows = applied.rows;
      for (const [field, count] of Object.entries(applied.replacementByField)) {
        replacementByField[field] = (replacementByField[field] ?? 0) + count;
      }
      totalReplacements += applied.totalReplacements;
    }
    datasets.push({
      imputationIndex: index,
      dataset: finalizeImputedDataset(prepared, rows, [
        `Multiple-imputation dataset ${index}/${imputationsRequested} generated with ${chainIterations} chained iteration(s).`
      ]),
      totalReplacements,
      replacementByField
    });
  }

  return {
    caseCount: prepared.caseCount,
    imputationsRequested,
    imputationsGenerated: datasets.length,
    randomSeed,
    datasets,
    notes: [
      'Multiple imputation uses chained field-level fills with configurable stochastic methods.',
      'Pooled inference should be used for formal reporting across generated imputations.'
    ]
  };
}

function poolRubinsRules(
  term: string,
  estimates: number[],
  withinVariances: number[],
  confidenceLevel: number
): MultipleImputationPooledEstimate {
  const validEstimates = estimates.filter((value) => Number.isFinite(value));
  const validWithin = withinVariances.filter((value) => Number.isFinite(value) && value >= 0);
  const m = validEstimates.length;
  if (m === 0) {
    return {
      term,
      estimate: null,
      withinVariance: null,
      betweenVariance: null,
      totalVariance: null,
      standardError: null,
      degreesOfFreedom: null,
      statistic: null,
      pValue: null,
      confidenceInterval: null,
      fractionMissingInformation: null,
      relativeIncreaseInVariance: null
    };
  }
  const estimate = validEstimates.reduce((total, value) => total + value, 0) / m;
  const withinVariance = validWithin.length > 0
    ? validWithin.reduce((total, value) => total + value, 0) / validWithin.length
    : 0;
  const betweenVariance = m > 1
    ? validEstimates.reduce((total, value) => total + ((value - estimate) ** 2), 0) / (m - 1)
    : 0;
  const totalVariance = withinVariance + ((1 + (1 / m)) * betweenVariance);
  const standardError = totalVariance > 0 ? Math.sqrt(totalVariance) : null;
  const relativeIncreaseInVariance = withinVariance > 0
    ? ((1 + (1 / m)) * betweenVariance) / withinVariance
    : betweenVariance > 0
      ? Number.POSITIVE_INFINITY
      : 0;
  const degreesOfFreedom = betweenVariance > 0
    ? (m - 1) * ((1 + (1 / Math.max(relativeIncreaseInVariance, 1e-12))) ** 2)
    : 1_000_000;
  const statistic = standardError && standardError > 0 ? estimate / standardError : null;
  const pValue = statistic === null
    ? null
    : (degreesOfFreedom > 0 ? studentTPValue(statistic, degreesOfFreedom) : normalTwoSidedPValue(statistic));
  const critical = inverseNormalCdf(1 - ((1 - confidenceLevel) / 2));
  const confidenceInterval = standardError && Number.isFinite(critical)
    ? {
      level: confidenceLevel,
      lower: estimate - (critical * standardError),
      upper: estimate + (critical * standardError)
    }
    : null;
  const fractionMissingInformation = totalVariance > 0
    ? (((1 + (1 / m)) * betweenVariance) / totalVariance)
    : null;
  return {
    term,
    estimate,
    withinVariance,
    betweenVariance,
    totalVariance,
    standardError,
    degreesOfFreedom,
    statistic,
    pValue,
    confidenceInterval,
    fractionMissingInformation,
    relativeIncreaseInVariance: Number.isFinite(relativeIncreaseInVariance) ? relativeIncreaseInVariance : null
  };
}

function inferVarianceFromConfidenceInterval(interval: ConfidenceInterval | null | undefined): number | null {
  if (!interval || interval.lower === null || interval.upper === null) return null;
  const critical = inverseNormalCdf(1 - ((1 - interval.level) / 2));
  if (!(critical > 0)) return null;
  const se = (interval.upper - interval.lower) / (2 * critical);
  return Number.isFinite(se) && se >= 0 ? se ** 2 : null;
}

export function analyzeWithMultipleImputation(
  dataset: CaseDataset,
  target: MultipleImputationTarget,
  strategies: ImputationStrategy[],
  options?: DatasetAnalysisOptions,
  config: MultipleImputationConfig = {}
): MultipleImputationAnalysisResult {
  const plan = buildMultipleImputationPlan(dataset, strategies, options, {
    ...config,
    includeOriginalDataset: false
  });
  const confidenceLevel = Math.min(0.99, Math.max(0.8, config.confidenceLevel ?? 0.95));
  const imputedDatasets = plan.datasets.filter((entry) => entry.imputationIndex > 0);
  const perImputation: MultipleImputationAnalysisResult['perImputation'] = [];
  const pooledScalars: Record<string, number | null> = {};
  let pooledEstimates: MultipleImputationPooledEstimate[] = [];

  if (target.procedure === 'regression') {
    const model = target.model ?? 'linear';
    const regressionResults = imputedDatasets.map((entry) => ({
      imputationIndex: entry.imputationIndex,
      result: analyzeRegression(entry.dataset, target.dependentField, target.predictorFields, model, options)
    }));
    perImputation.push(...regressionResults.map((entry) => ({ imputationIndex: entry.imputationIndex, result: entry.result })));
    const termNames = [...new Set(regressionResults.flatMap((entry) => entry.result.coefficients.map((coefficient) => coefficient.field)))];
    pooledEstimates = termNames.map((term) => {
      const estimates = regressionResults
        .map((entry) => entry.result.coefficients.find((coefficient) => coefficient.field === term)?.coefficient ?? NaN)
        .filter((value) => Number.isFinite(value));
      const variances = regressionResults
        .map((entry) => {
          const coefficient = entry.result.coefficients.find((item) => item.field === term);
          return coefficient?.standardError && Number.isFinite(coefficient.standardError) ? coefficient.standardError ** 2 : null;
        })
        .filter((value): value is number => value !== null && Number.isFinite(value));
      return poolRubinsRules(term, estimates, variances, confidenceLevel);
    });
    pooledScalars.rSquared = regressionResults.reduce((total, entry) => total + (entry.result.metrics.rSquared ?? 0), 0) / regressionResults.length;
    pooledScalars.adjustedRSquared = regressionResults.reduce((total, entry) => total + (entry.result.metrics.adjustedRSquared ?? 0), 0) / regressionResults.length;
  } else if (target.procedure === 't_test') {
    const results = imputedDatasets.map((entry) => ({
      imputationIndex: entry.imputationIndex,
      result: analyzeTTest(entry.dataset, target.outcomeField, target.groupField, options)
    }));
    perImputation.push(...results.map((entry) => ({ imputationIndex: entry.imputationIndex, result: entry.result })));
    pooledEstimates = [
      poolRubinsRules(
        'mean_difference',
        results.map((entry) => entry.result.meanDifference ?? NaN).filter((value) => Number.isFinite(value)),
        results.map((entry) => inferVarianceFromConfidenceInterval(entry.result.confidenceInterval)).filter((value): value is number => value !== null),
        confidenceLevel
      )
    ];
    pooledScalars.cohensD = results.reduce((total, entry) => total + (entry.result.cohensD ?? 0), 0) / results.length;
  } else if (target.procedure === 'paired_t_test') {
    const results = imputedDatasets.map((entry) => ({
      imputationIndex: entry.imputationIndex,
      result: analyzePairedTTest(entry.dataset, target.beforeField, target.afterField, options)
    }));
    perImputation.push(...results.map((entry) => ({ imputationIndex: entry.imputationIndex, result: entry.result })));
    pooledEstimates = [
      poolRubinsRules(
        'mean_difference',
        results.map((entry) => entry.result.meanDifference ?? NaN).filter((value) => Number.isFinite(value)),
        results.map((entry) => entry.result.standardError !== null && entry.result.standardError !== undefined ? entry.result.standardError ** 2 : null)
          .filter((value): value is number => value !== null && Number.isFinite(value)),
        confidenceLevel
      )
    ];
    pooledScalars.cohensDz = results.reduce((total, entry) => total + (entry.result.cohensDz ?? 0), 0) / results.length;
    pooledScalars.correlation = results.reduce((total, entry) => total + (entry.result.correlation ?? 0), 0) / results.length;
  } else if (target.procedure === 'compare_means') {
    const results = imputedDatasets.map((entry) => ({
      imputationIndex: entry.imputationIndex,
      result: analyzeCompareMeans(entry.dataset, target.outcomeField, target.groupField, options)
    }));
    perImputation.push(...results.map((entry) => ({ imputationIndex: entry.imputationIndex, result: entry.result })));
    pooledScalars.fStatistic = results.reduce((total, entry) => total + (entry.result.anova?.fStatistic ?? 0), 0) / results.length;
    pooledScalars.etaSquared = results.reduce((total, entry) => total + (entry.result.anova?.etaSquared ?? 0), 0) / results.length;
    const pValues = results
      .map((entry) => entry.result.anova?.pValue)
      .filter((value): value is number => value !== null && value !== undefined && value > 0 && value <= 1);
    if (pValues.length > 0) {
      const fisherStatistic = -2 * pValues.reduce((total, value) => total + Math.log(value), 0);
      pooledScalars.combinedPValue = chiSquarePValue(fisherStatistic, 2 * pValues.length);
    } else {
      pooledScalars.combinedPValue = null;
    }
    pooledEstimates = results[0]?.result.groups.map((group) => {
      const estimates = results
        .map((entry) => entry.result.groups.find((candidate) => candidate.groupValue === group.groupValue)?.mean ?? NaN)
        .filter((value) => Number.isFinite(value));
      const variances = results
        .map((entry) => {
          const current = entry.result.groups.find((candidate) => candidate.groupValue === group.groupValue);
          return current?.stdDev !== null && current?.stdDev !== undefined && current.count > 0
            ? (current.stdDev ** 2) / current.count
            : null;
        })
        .filter((value): value is number => value !== null && Number.isFinite(value));
      return poolRubinsRules(`group_mean:${group.groupValue}`, estimates, variances, confidenceLevel);
    }) ?? [];
  } else if (target.procedure === 'correlation') {
    const results = imputedDatasets.map((entry) => ({
      imputationIndex: entry.imputationIndex,
      result: analyzeCorrelation(entry.dataset, target.xField, target.yField, options)
    }));
    perImputation.push(...results.map((entry) => ({ imputationIndex: entry.imputationIndex, result: entry.result })));
    const fisherEstimates = results
      .map((entry) => entry.result.pearsonR)
      .filter((value) => Number.isFinite(value))
      .map((value) => Math.atanh(Math.max(-0.999999, Math.min(0.999999, value))));
    const fisherVariances = results
      .map((entry) => entry.result.caseCount > 3 ? 1 / (entry.result.caseCount - 3) : null)
      .filter((value): value is number => value !== null && Number.isFinite(value));
    const pooledFisher = poolRubinsRules('fisher_z', fisherEstimates, fisherVariances, confidenceLevel);
    const correlationEstimate = pooledFisher.estimate === null ? null : Math.tanh(pooledFisher.estimate);
    const correlationInterval = pooledFisher.confidenceInterval && pooledFisher.confidenceInterval.lower !== null && pooledFisher.confidenceInterval.upper !== null
      ? {
        level: pooledFisher.confidenceInterval.level,
        lower: Math.tanh(pooledFisher.confidenceInterval.lower),
        upper: Math.tanh(pooledFisher.confidenceInterval.upper)
      }
      : null;
    pooledEstimates = [
      {
        ...pooledFisher,
        term: 'pearson_r',
        estimate: correlationEstimate,
        confidenceInterval: correlationInterval
      }
    ];
    pooledScalars.rSquared = correlationEstimate === null ? null : correlationEstimate ** 2;
  }

  return {
    procedure: target.procedure,
    imputationsRequested: plan.imputationsRequested,
    imputationsUsed: imputedDatasets.length,
    randomSeed: plan.randomSeed,
    pooledEstimates,
    pooledScalars,
    perImputation,
    notes: [
      `Pooled inference used Rubin's rules across ${imputedDatasets.length} imputed dataset(s).`,
      'Within-imputation variance and between-imputation variance are reported for traceability.'
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

type ForecastFitCandidate = {
  method: ForecastMethod;
  fitted: number[];
  forecast: number[];
  intercept: number;
  slope: number;
  movingAverageWindow: number | null;
  smoothingAlpha: number | null;
  smoothingBeta: number | null;
  dampingPhi: number | null;
  arOrder: number | null;
  differencing: number | null;
  aic: number | null;
  bic: number | null;
  notes: string[];
};

function computeForecastInformationCriteria(
  actual: number[],
  fitted: number[],
  parameterCount: number
): { aic: number | null; bic: number | null } {
  if (actual.length !== fitted.length || actual.length <= parameterCount + 1 || parameterCount <= 0) {
    return { aic: null, bic: null };
  }
  const residuals = actual.map((value, index) => value - fitted[index]!);
  const rss = residuals.reduce((total, value) => total + (value ** 2), 0);
  if (!(rss > 0)) return { aic: null, bic: null };
  const n = actual.length;
  const aic = (n * Math.log(rss / n)) + (2 * parameterCount);
  const bic = (n * Math.log(rss / n)) + (Math.log(n) * parameterCount);
  return {
    aic: Number.isFinite(aic) ? aic : null,
    bic: Number.isFinite(bic) ? bic : null
  };
}

function fitLinearTrendForecast(
  normalizedTimes: number[],
  values: number[],
  horizon: number,
  firstTimeIndex: number,
  lastTime: number,
  typicalGap: number
): ForecastFitCandidate {
  const timeMean = normalizedTimes.reduce((total, value) => total + value, 0) / normalizedTimes.length;
  const valueMean = values.reduce((total, value) => total + value, 0) / values.length;
  const ssTime = normalizedTimes.reduce((total, value) => total + ((value - timeMean) ** 2), 0);
  const covariance = normalizedTimes.reduce((total, value, index) => total + ((value - timeMean) * (values[index]! - valueMean)), 0);
  const slope = ssTime > 0 ? covariance / ssTime : 0;
  const intercept = valueMean - (slope * timeMean);
  const fitted = normalizedTimes.map((value) => intercept + (slope * value));
  const forecast = Array.from({ length: horizon }, (_unused, index) => {
    const timeIndex = lastTime + (typicalGap * (index + 1));
    const normalizedTime = timeIndex - firstTimeIndex;
    return intercept + (slope * normalizedTime);
  });
  const criteria = computeForecastInformationCriteria(values, fitted, 2);
  return {
    method: 'linear_trend',
    fitted,
    forecast,
    intercept,
    slope,
    movingAverageWindow: null,
    smoothingAlpha: null,
    smoothingBeta: null,
    dampingPhi: null,
    arOrder: null,
    differencing: 0,
    aic: criteria.aic,
    bic: criteria.bic,
    notes: [
      'Linear trend estimates intercept and slope from all observed rows.'
    ]
  };
}

function fitMovingAverageForecast(
  values: number[],
  horizon: number,
  movingAverageWindow: number
): ForecastFitCandidate {
  const normalizedWindow = Math.min(
    Math.max(2, Math.floor(movingAverageWindow)),
    Math.min(24, values.length)
  );
  const fitted = values.map((value, index) => {
    if (index === 0) return value;
    const history = values.slice(Math.max(0, index - normalizedWindow), index);
    return history.length > 0
      ? history.reduce((total, item) => total + item, 0) / history.length
      : value;
  });
  const trail = values.slice(-normalizedWindow);
  const forecast = Array.from({ length: horizon }, () => {
    const next = trail.reduce((total, item) => total + item, 0) / trail.length;
    trail.push(next);
    while (trail.length > normalizedWindow) trail.shift();
    return next;
  });
  const criteria = computeForecastInformationCriteria(values, fitted, 1 + normalizedWindow);
  return {
    method: 'moving_average',
    fitted,
    forecast,
    intercept: fitted[0] ?? values[0] ?? 0,
    slope: 0,
    movingAverageWindow: normalizedWindow,
    smoothingAlpha: null,
    smoothingBeta: null,
    dampingPhi: null,
    arOrder: null,
    differencing: 0,
    aic: criteria.aic,
    bic: criteria.bic,
    notes: [
      `Moving-average forecast uses a rolling window of ${normalizedWindow}.`
    ]
  };
}

function buildHoltForecast(
  values: number[],
  horizon: number,
  alpha: number,
  beta: number,
  dampingPhi = 1
): ForecastFitCandidate {
  const boundedAlpha = Math.min(0.99, Math.max(0.01, alpha));
  const boundedBeta = Math.min(0.99, Math.max(0.001, beta));
  const boundedPhi = Math.min(1, Math.max(0.75, dampingPhi));
  let level = values[0] ?? 0;
  let trend = (values[1] ?? values[0] ?? 0) - (values[0] ?? 0);
  const fitted = new Array<number>(values.length).fill(level);
  fitted[0] = values[0] ?? level;
  for (let index = 1; index < values.length; index += 1) {
    const predicted = level + (boundedPhi * trend);
    fitted[index] = predicted;
    const observed = values[index]!;
    const nextLevel = (boundedAlpha * observed) + ((1 - boundedAlpha) * predicted);
    const nextTrend = (boundedBeta * (nextLevel - level)) + ((1 - boundedBeta) * boundedPhi * trend);
    level = nextLevel;
    trend = nextTrend;
  }
  const forecast = Array.from({ length: horizon }, (_unused, stepIndex) => {
    const step = stepIndex + 1;
    if (Math.abs(1 - boundedPhi) < 1e-9) {
      return level + (step * trend);
    }
    const dampMultiplier = (boundedPhi * (1 - (boundedPhi ** step))) / (1 - boundedPhi);
    return level + (dampMultiplier * trend);
  });
  const criteria = computeForecastInformationCriteria(values, fitted, 3);
  return {
    method: boundedPhi < 0.999 ? 'ets_auto' : 'exponential_smoothing',
    fitted,
    forecast,
    intercept: level,
    slope: trend,
    movingAverageWindow: null,
    smoothingAlpha: boundedAlpha,
    smoothingBeta: boundedBeta,
    dampingPhi: boundedPhi,
    arOrder: null,
    differencing: 0,
    aic: criteria.aic,
    bic: criteria.bic,
    notes: [
      boundedPhi < 0.999
        ? `ETS (Holt damped trend) selected with alpha ${boundedAlpha.toFixed(2)}, beta ${boundedBeta.toFixed(2)}, phi ${boundedPhi.toFixed(2)}.`
        : `Exponential smoothing with trend selected with alpha ${boundedAlpha.toFixed(2)} and beta ${boundedBeta.toFixed(2)}.`
    ]
  };
}

function fitEtsAutoForecast(values: number[], horizon: number): ForecastFitCandidate {
  const alphaCandidates = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
  const betaCandidates = [0.05, 0.1, 0.2, 0.3, 0.4];
  const phiCandidates = [1, 0.98, 0.95, 0.9, 0.85];
  let best: ForecastFitCandidate | null = null;
  for (const alpha of alphaCandidates) {
    for (const beta of betaCandidates) {
      for (const phi of phiCandidates) {
        const candidate = buildHoltForecast(values, horizon, alpha, beta, phi);
        const score = candidate.aic ?? Number.POSITIVE_INFINITY;
        const bestScore = best?.aic ?? Number.POSITIVE_INFINITY;
        if (!best || score < bestScore - 1e-9) {
          best = candidate;
        }
      }
    }
  }
  return best ?? buildHoltForecast(values, horizon, 0.35, 0.2, 1);
}

function differenceSeries(values: number[], differencing: number): number[] {
  if (differencing <= 0) return [...values];
  let output = [...values];
  for (let order = 0; order < differencing; order += 1) {
    const next: number[] = [];
    for (let index = 1; index < output.length; index += 1) {
      next.push(output[index]! - output[index - 1]!);
    }
    output = next;
  }
  return output;
}

function fitArimaAutoForecast(values: number[], horizon: number): ForecastFitCandidate {
  const candidateOrders: Array<{ p: number; d: number }> = [
    { p: 1, d: 0 },
    { p: 2, d: 0 },
    { p: 1, d: 1 },
    { p: 2, d: 1 }
  ];
  let best: ForecastFitCandidate | null = null;
  for (const order of candidateOrders) {
    const differenced = differenceSeries(values, order.d);
    if (differenced.length <= order.p + 2) continue;
    const designRows: number[][] = [];
    const target: number[] = [];
    for (let index = order.p; index < differenced.length; index += 1) {
      const row = [1];
      for (let lag = 1; lag <= order.p; lag += 1) {
        row.push(differenced[index - lag]!);
      }
      designRows.push(row);
      target.push(differenced[index]!);
    }
    if (designRows.length <= order.p + 1) continue;
    const parameterCount = order.p + 1;
    const xtx = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
    const xty = Array.from({ length: parameterCount }, () => 0);
    for (let rowIndex = 0; rowIndex < designRows.length; rowIndex += 1) {
      const row = designRows[rowIndex]!;
      const y = target[rowIndex]!;
      for (let left = 0; left < parameterCount; left += 1) {
        xty[left] += row[left]! * y;
        for (let right = 0; right < parameterCount; right += 1) {
          xtx[left]![right] += row[left]! * row[right]!;
        }
      }
    }
    let coefficients: number[];
    try {
      coefficients = solveLinearSystem(xtx, xty);
    } catch {
      continue;
    }
    const fittedDiff = differenced.map((value) => value);
    for (let index = order.p; index < differenced.length; index += 1) {
      let predicted = coefficients[0] ?? 0;
      for (let lag = 1; lag <= order.p; lag += 1) {
        predicted += (coefficients[lag] ?? 0) * differenced[index - lag]!;
      }
      fittedDiff[index] = predicted;
    }
    const diffHistory = [...differenced];
    const forecastDiff: number[] = [];
    for (let step = 0; step < horizon; step += 1) {
      let predicted = coefficients[0] ?? 0;
      for (let lag = 1; lag <= order.p; lag += 1) {
        const source = diffHistory[diffHistory.length - lag];
        predicted += (coefficients[lag] ?? 0) * (source ?? 0);
      }
      forecastDiff.push(predicted);
      diffHistory.push(predicted);
    }

    let fitted: number[] = [];
    let forecast: number[] = [];
    if (order.d === 0) {
      fitted = [...fittedDiff];
      forecast = forecastDiff;
    } else {
      fitted = new Array<number>(values.length).fill(values[0] ?? 0);
      for (let index = 1; index < values.length; index += 1) {
        const diffIndex = index - 1;
        const predictedDiff = diffIndex < fittedDiff.length ? fittedDiff[diffIndex]! : differenced[differenced.length - 1]!;
        fitted[index] = values[index - 1]! + predictedDiff;
      }
      forecast = [];
      let level = values[values.length - 1]!;
      for (const diff of forecastDiff) {
        level += diff;
        forecast.push(level);
      }
    }
    const criteria = computeForecastInformationCriteria(values, fitted, parameterCount + order.d);
    const candidate: ForecastFitCandidate = {
      method: 'arima_auto',
      fitted,
      forecast,
      intercept: coefficients[0] ?? 0,
      slope: coefficients[1] ?? 0,
      movingAverageWindow: null,
      smoothingAlpha: null,
      smoothingBeta: null,
      dampingPhi: null,
      arOrder: order.p,
      differencing: order.d,
      aic: criteria.aic,
      bic: criteria.bic,
      notes: [
        `ARIMA auto selected AR(${order.p}) with differencing d=${order.d} by information criteria.`
      ]
    };
    const score = candidate.aic ?? Number.POSITIVE_INFINITY;
    const bestScore = best?.aic ?? Number.POSITIVE_INFINITY;
    if (!best || score < bestScore - 1e-9) {
      best = candidate;
    }
  }
  return best ?? fitLinearTrendForecast(
    values.map((_value, index) => index),
    values,
    horizon,
    0,
    values.length - 1,
    1
  );
}

function selectAutoForecastCandidate(candidates: ForecastFitCandidate[]): ForecastFitCandidate {
  let best = candidates[0]!;
  let bestScore = best.aic ?? Number.POSITIVE_INFINITY;
  for (const candidate of candidates.slice(1)) {
    const score = candidate.aic ?? Number.POSITIVE_INFINITY;
    if (score < bestScore - 1e-9) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function autocorrelationAtLag(values: number[], lag: number): number | null {
  if (lag <= 0 || values.length <= lag + 1) return null;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index += 1) {
    const centered = values[index]! - mean;
    denominator += centered ** 2;
    if (index >= lag) numerator += centered * (values[index - lag]! - mean);
  }
  if (!(denominator > 0)) return null;
  return numerator / denominator;
}

function computeLjungBoxStatistic(residuals: number[], lags: number): { q: number | null; pValue: number | null } {
  if (residuals.length < 8) return { q: null, pValue: null };
  const n = residuals.length;
  const lagCount = Math.max(1, Math.min(lags, Math.floor(n / 2)));
  let q = 0;
  for (let lag = 1; lag <= lagCount; lag += 1) {
    const rho = autocorrelationAtLag(residuals, lag);
    if (rho === null) continue;
    q += (rho ** 2) / Math.max(1e-12, n - lag);
  }
  q *= n * (n + 2);
  return {
    q,
    pValue: chiSquarePValue(q, lagCount)
  };
}

function excessKurtosis(values: number[]): number | null {
  if (values.length < 4) return null;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const centered = values.map((value) => value - mean);
  const variance = centered.reduce((total, value) => total + (value ** 2), 0) / values.length;
  if (!(variance > 0)) return null;
  const fourth = centered.reduce((total, value) => total + (value ** 4), 0) / values.length;
  return (fourth / (variance ** 2)) - 3;
}

export function analyzeForecast(
  dataset: CaseDataset,
  timeFieldKey: string,
  valueFieldKey: string,
  horizon = 3,
  options?: DatasetAnalysisOptions,
  settings?: ForecastSettings
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

  const requestedMethod: ForecastMethod = settings?.method ?? 'auto';
  const normalizedHorizon = Math.min(24, Math.max(1, Math.floor(horizon)));
  const movingAverageWindow = Math.min(
    Math.max(2, Math.floor(settings?.movingAverageWindow ?? 3)),
    Math.min(12, rows.length)
  );
  const smoothingAlpha = Math.min(0.95, Math.max(0.05, typeof settings?.smoothingAlpha === 'number' ? settings.smoothingAlpha : 0.35));
  const smoothingBeta = Math.min(0.95, Math.max(0.01, typeof settings?.smoothingBeta === 'number' ? settings.smoothingBeta : 0.2));
  const dampingPhi = Math.min(1, Math.max(0.75, typeof settings?.dampingPhi === 'number' ? settings.dampingPhi : 0.95));
  const holdoutFraction = Math.min(0.4, Math.max(0, typeof settings?.holdoutFraction === 'number' ? settings.holdoutFraction : 0.2));
  const confidenceLevel = Math.min(0.99, Math.max(0.8, typeof settings?.confidenceLevel === 'number' ? settings.confidenceLevel : 0.95));
  const ljungBoxLags = Math.max(1, Math.min(24, Math.floor(settings?.ljungBoxLags ?? 10)));

  const firstTimeIndex = rows[0]!.timeIndex;
  const normalizedTimes = rows.map((row) => row.timeIndex - firstTimeIndex);
  const values = rows.map((row) => row.actual);
  const sortedGaps = rows.slice(1).map((row, index) => row.timeIndex - rows[index]!.timeIndex).filter((value) => value > 0);
  const typicalGap = sortedGaps.length > 0
    ? sortedGaps.sort((left, right) => left - right)[Math.floor(sortedGaps.length / 2)]!
    : 1;
  const lastTime = rows[rows.length - 1]!.timeIndex;
  const linearCandidate = fitLinearTrendForecast(
    normalizedTimes,
    values,
    normalizedHorizon,
    firstTimeIndex,
    lastTime,
    typicalGap
  );
  const movingAverageCandidate = fitMovingAverageForecast(values, normalizedHorizon, movingAverageWindow);
  const exponentialCandidate = buildHoltForecast(values, normalizedHorizon, smoothingAlpha, smoothingBeta, 1);
  const etsCandidate = fitEtsAutoForecast(values, normalizedHorizon);
  const arimaCandidate = fitArimaAutoForecast(values, normalizedHorizon);
  const candidateList = [
    arimaCandidate,
    etsCandidate,
    linearCandidate,
    movingAverageCandidate,
    exponentialCandidate
  ];
  const selected = requestedMethod === 'linear_trend'
    ? linearCandidate
    : requestedMethod === 'moving_average'
      ? movingAverageCandidate
      : requestedMethod === 'exponential_smoothing'
        ? exponentialCandidate
        : requestedMethod === 'ets_auto'
          ? etsCandidate
          : requestedMethod === 'arima_auto'
          ? arimaCandidate
            : selectAutoForecastCandidate(candidateList);

  const residuals = values.map((value, index) => value - (selected.fitted[index] ?? value));
  const mae = residuals.reduce((total, value) => total + Math.abs(value), 0) / residuals.length;
  const rmse = Math.sqrt(residuals.reduce((total, value) => total + (value ** 2), 0) / residuals.length);
  const nonZeroActuals = values.filter((value) => Math.abs(value) > 1e-9);
  const mape = nonZeroActuals.length > 0
    ? values.reduce((total, value, index) => {
      if (Math.abs(value) <= 1e-9) return total;
      return total + Math.abs((value - (selected.fitted[index] ?? value)) / value);
    }, 0) / nonZeroActuals.length
    : null;
  const valueMean = values.reduce((total, value) => total + value, 0) / values.length;
  const ssTotal = values.reduce((total, value) => total + ((value - valueMean) ** 2), 0);
  const ssResidual = residuals.reduce((total, value) => total + (value ** 2), 0);
  const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : null;
  const residualStdDev = sampleStdDev(residuals) ?? 0;
  const critical = inverseNormalCdf(1 - ((1 - confidenceLevel) / 2));
  const holdoutCount = holdoutFraction > 0 ? Math.min(Math.max(2, Math.floor(rows.length * holdoutFraction)), Math.max(2, rows.length - 3)) : 0;
  const holdoutActual = holdoutCount > 0 ? values.slice(-holdoutCount) : [];
  const holdoutPredicted = holdoutCount > 0 ? selected.fitted.slice(-holdoutCount) : [];
  const holdoutResiduals = holdoutActual.map((value, index) => value - (holdoutPredicted[index] ?? value));
  const holdoutMae = holdoutResiduals.length > 0
    ? holdoutResiduals.reduce((total, value) => total + Math.abs(value), 0) / holdoutResiduals.length
    : null;
  const holdoutRmse = holdoutResiduals.length > 0
    ? Math.sqrt(holdoutResiduals.reduce((total, value) => total + (value ** 2), 0) / holdoutResiduals.length)
    : null;
  const ljungBox = computeLjungBoxStatistic(residuals, ljungBoxLags);
  const autocorrelationLag1 = autocorrelationAtLag(residuals, 1);
  const residualMean = residuals.reduce((total, value) => total + value, 0) / residuals.length;
  const residualSkewness = skewness(residuals);
  const residualKurtosis = excessKurtosis(residuals);
  const trendStrength = (() => {
    if (values.length < 3) return null;
    const indices = values.map((_value, index) => index + 1);
    const correlation = pearsonCorrelation(indices, values);
    return correlation === null ? null : correlation ** 2;
  })();
  const seasonalityStrength = (() => {
    const lag = Math.min(12, Math.max(2, Math.floor(values.length / 3)));
    const rho = autocorrelationAtLag(values, lag);
    return rho === null ? null : Math.max(0, Math.min(1, Math.abs(rho)));
  })();
  const modelSelection = candidateList.map((candidate) => {
    const candidateResiduals = values.map((value, index) => value - (candidate.fitted[index] ?? value));
    return {
      method: candidate.method,
      aic: candidate.aic,
      bic: candidate.bic,
      meanAbsoluteError: candidateResiduals.reduce((total, value) => total + Math.abs(value), 0) / candidateResiduals.length,
      rootMeanSquaredError: Math.sqrt(candidateResiduals.reduce((total, value) => total + (value ** 2), 0) / candidateResiduals.length)
    };
  }).sort((left, right) => {
    const leftScore = left.aic ?? Number.POSITIVE_INFINITY;
    const rightScore = right.aic ?? Number.POSITIVE_INFINITY;
    return leftScore - rightScore || (left.rootMeanSquaredError ?? Number.POSITIVE_INFINITY) - (right.rootMeanSquaredError ?? Number.POSITIVE_INFINITY);
  });

  return {
    timeField: timeField.key,
    timeLabel: timeField.label,
    valueField: valueField.key,
    valueLabel: valueField.label,
    method: selected.method,
    requestedMethod,
    methodSettings: {
      movingAverageWindow: selected.movingAverageWindow,
      smoothingAlpha: selected.smoothingAlpha,
      smoothingBeta: selected.smoothingBeta,
      dampingPhi: selected.dampingPhi,
      arOrder: selected.arOrder,
      differencing: selected.differencing
    },
    caseCount: rows.length,
    horizon: normalizedHorizon,
    intercept: selected.intercept,
    slope: selected.slope,
    metrics: {
      meanAbsoluteError: mae,
      rootMeanSquaredError: rmse,
      meanAbsolutePercentageError: mape,
      rSquared,
      aic: selected.aic,
      bic: selected.bic
    },
    diagnostics: {
      durbinWatson: computeDurbinWatson(residuals),
      ljungBoxQ: ljungBox?.q ?? null,
      ljungBoxPValue: ljungBox?.pValue ?? null,
      residualAutocorrelationLag1: autocorrelationLag1,
      residualMean,
      residualSkewness,
      residualKurtosis,
      holdoutCaseCount: holdoutResiduals.length,
      holdoutMeanAbsoluteError: holdoutMae,
      holdoutRootMeanSquaredError: holdoutRmse,
      seasonalityStrength,
      trendStrength
    },
    modelSelection,
    observations: rows.map((row, index) => ({
      caseId: row.caseId,
      timeValue: typeof row.timeValue === 'number' ? row.timeValue : formatValue(row.timeValue),
      timeIndex: row.timeIndex,
      actual: row.actual,
      fitted: selected.fitted[index] ?? row.actual,
      residual: residuals[index] ?? 0
    })),
    forecast: Array.from({ length: normalizedHorizon }, (_unused, index) => {
      const timeIndex = lastTime + (typicalGap * (index + 1));
      const forecast = selected.forecast[index] ?? selected.forecast[selected.forecast.length - 1] ?? values[values.length - 1]!;
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
      ...selected.notes,
      requestedMethod === 'auto'
        ? `Auto model selection chose ${selected.method} by information criteria.`
        : `Requested method ${requestedMethod} executed.`,
      'Date-like time fields are internally converted to numeric time indexes before fitting.'
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

type TreeSplitCriterion = 'gini' | 'entropy';

function entropyImpurity(rows: TreeRow[]): number {
  if (rows.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.target, (counts.get(row.target) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / rows.length;
    if (probability > 0) {
      entropy -= probability * Math.log2(probability);
    }
  }
  return entropy;
}

function createDeterministicRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function selectFeatureSubset(fields: string[], subsetCount: number, rng: () => number): string[] {
  if (subsetCount <= 0 || subsetCount >= fields.length) return [...fields];
  const pool = [...fields];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex]!, pool[index]!];
  }
  return pool.slice(0, subsetCount);
}

function bestTreeSplit(
  rows: TreeRow[],
  predictorFields: string[],
  fieldLabels: Map<string, string>,
  criterion: TreeSplitCriterion,
  minSamplesLeaf: number
) {
  const impurityFn = criterion === 'entropy' ? entropyImpurity : giniImpurity;
  const parentImpurity = impurityFn(rows);
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
      const distinct = [...new Set(values.map((value) => formatValue(value)))].slice(0, 20);
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
      if (leftRows.length < minSamplesLeaf || rightRows.length < minSamplesLeaf) continue;
      const weightedImpurity = ((leftRows.length / rows.length) * impurityFn(leftRows))
        + ((rightRows.length / rows.length) * impurityFn(rightRows));
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
  id: string,
  settings: {
    criterion: TreeSplitCriterion;
    minSamplesLeaf: number;
    minGain: number;
    featureSubsetCount: number;
    rng: () => number;
    totalRows: number;
    featureGain: Map<string, number>;
  }
): DecisionTreeNode {
  const distribution = targetDistribution(rows);
  const prediction = distribution[0]?.value ?? 'Missing';
  if (depth >= maxDepth || rows.length < (settings.minSamplesLeaf * 2) || distribution.length <= 1) {
    return { id, depth, prediction, count: rows.length, distribution, split: null };
  }
  const candidateFields = selectFeatureSubset(predictorFields, settings.featureSubsetCount, settings.rng);
  const split = bestTreeSplit(rows, candidateFields, fieldLabels, settings.criterion, settings.minSamplesLeaf);
  if (!split || split.gain <= settings.minGain) {
    return { id, depth, prediction, count: rows.length, distribution, split: null };
  }
  const weightedGain = split.gain * (rows.length / Math.max(1, settings.totalRows));
  settings.featureGain.set(split.field, (settings.featureGain.get(split.field) ?? 0) + weightedGain);
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
    left: buildTreeNode(split.leftRows, predictorFields, fieldLabels, depth + 1, maxDepth, `${id}L`, settings),
    right: buildTreeNode(split.rightRows, predictorFields, fieldLabels, depth + 1, maxDepth, `${id}R`, settings)
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
  options?: DatasetAnalysisOptions,
  settings?: {
    method?: 'cart' | 'random_forest';
    criterion?: TreeSplitCriterion;
    treeCount?: number;
    minSamplesLeaf?: number;
    minGain?: number;
    featureSubsetCount?: number;
    seed?: number;
  }
): DecisionTreeResult {
  const uniquePredictors = [...new Set(predictorFields.map((field) => field.trim()).filter(Boolean))]
    .filter((field) => field !== targetFieldKey);
  if (uniquePredictors.length === 0) {
    throw new Error('Choose at least one predictor field for the decision tree.');
  }
  const targetField = requireDatasetField(dataset, targetFieldKey, 'decision-tree target');
  const predictorMeta = uniquePredictors.map((field) => requireDatasetField(dataset, field, 'decision-tree predictor'));
  const rows = analysisRows(dataset, [targetFieldKey, ...uniquePredictors], options)
    .map(({ row }, rowIndex) => ({
      rowIndex,
      target: row[targetFieldKey] === null || row[targetFieldKey] === undefined ? null : formatValue(row[targetFieldKey] ?? null),
      predictors: Object.fromEntries(uniquePredictors.map((field) => [field, row[field] ?? null])) as Record<string, DatasetValue>
    }))
    .filter((entry): entry is TreeRow & { rowIndex: number } => entry.target !== null);
  if (rows.length < 4) {
    throw new Error('Decision tree requires at least four usable rows with a target value.');
  }
  const normalizedMaxDepth = Math.min(10, Math.max(1, Math.floor(maxDepth)));
  const fieldLabels = new Map(predictorMeta.map((field) => [field.key, field.label]));
  const method = settings?.method === 'random_forest' ? 'random_forest' : 'cart';
  const criterion = settings?.criterion === 'entropy' ? 'entropy' : 'gini';
  const minSamplesLeaf = Math.min(20, Math.max(1, Math.floor(settings?.minSamplesLeaf ?? 2)));
  const minGain = Math.max(0, settings?.minGain ?? 1e-6);
  const treeCount = method === 'random_forest'
    ? Math.min(200, Math.max(10, Math.floor(settings?.treeCount ?? 60)))
    : 1;
  const featureSubsetCount = Math.min(
    uniquePredictors.length,
    Math.max(
      0,
      Math.floor(settings?.featureSubsetCount ?? (method === 'random_forest' ? Math.max(1, Math.floor(Math.sqrt(uniquePredictors.length))) : uniquePredictors.length))
    )
  );
  const rng = createDeterministicRng(Math.floor(settings?.seed ?? 42));

  const allTrees: DecisionTreeNode[] = [];
  const featureGain = new Map<string, number>();
  const predictionVotes = rows.map(() => new Map<string, number>());
  const oobVotes = rows.map(() => new Map<string, number>());
  for (let treeIndex = 0; treeIndex < treeCount; treeIndex += 1) {
    const bootstrapRows: Array<TreeRow & { rowIndex: number }> = [];
    const inBagIndices = new Set<number>();
    if (method === 'random_forest') {
      for (let index = 0; index < rows.length; index += 1) {
        const sampledIndex = Math.floor(rng() * rows.length);
        bootstrapRows.push(rows[sampledIndex]!);
        inBagIndices.add(rows[sampledIndex]!.rowIndex);
      }
    } else {
      bootstrapRows.push(...rows);
      rows.forEach((row) => inBagIndices.add(row.rowIndex));
    }
    const tree = buildTreeNode(
      bootstrapRows,
      uniquePredictors,
      fieldLabels,
      0,
      normalizedMaxDepth,
      `T${treeIndex + 1}`,
      {
        criterion,
        minSamplesLeaf,
        minGain,
        featureSubsetCount,
        rng,
        totalRows: bootstrapRows.length,
        featureGain
      }
    );
    allTrees.push(tree);
    for (const row of rows) {
      const vote = predictTree(tree, row);
      const votes = predictionVotes[row.rowIndex]!;
      votes.set(vote, (votes.get(vote) ?? 0) + 1);
      if (!inBagIndices.has(row.rowIndex)) {
        const oob = oobVotes[row.rowIndex]!;
        oob.set(vote, (oob.get(vote) ?? 0) + 1);
      }
    }
  }

  const resolveVote = (votes: Map<string, number>, fallback: string) => {
    let topLabel = fallback;
    let topCount = -1;
    for (const [label, count] of votes.entries()) {
      if (count > topCount) {
        topLabel = label;
        topCount = count;
      }
    }
    return topLabel;
  };
  const predictions = rows.map((row) => ({
    actual: row.target,
    predicted: resolveVote(predictionVotes[row.rowIndex]!, row.target)
  }));
  const correct = predictions.filter((entry) => entry.actual === entry.predicted).length;
  const classes = [...new Set(predictions.map((entry) => entry.actual))];
  const recallByClass = classes.map((label) => {
    const classRows = predictions.filter((entry) => entry.actual === label);
    if (classRows.length === 0) return 0;
    const hits = classRows.filter((entry) => entry.predicted === label).length;
    return hits / classRows.length;
  });
  const balancedAccuracy = recallByClass.length > 0
    ? recallByClass.reduce((total, value) => total + value, 0) / recallByClass.length
    : null;
  const oobPredictions = rows
    .map((row) => ({
      actual: row.target,
      predicted: resolveVote(oobVotes[row.rowIndex]!, row.target),
      hasVote: oobVotes[row.rowIndex]!.size > 0
    }))
    .filter((entry) => entry.hasVote);
  const oobAccuracy = oobPredictions.length > 0
    ? oobPredictions.filter((entry) => entry.actual === entry.predicted).length / oobPredictions.length
    : null;
  const confusionCounts = new Map<string, number>();
  for (const entry of predictions) {
    const key = `${entry.actual}::${entry.predicted}`;
    confusionCounts.set(key, (confusionCounts.get(key) ?? 0) + 1);
  }
  const totalGain = [...featureGain.values()].reduce((total, value) => total + value, 0);
  const featureImportance = uniquePredictors.map((field) => ({
    field,
    label: fieldLabels.get(field) ?? field,
    importance: totalGain > 0 ? (featureGain.get(field) ?? 0) / totalGain : 0
  })).sort((left, right) => right.importance - left.importance);

  return {
    method,
    targetField: targetField.key,
    targetLabel: targetField.label,
    predictorFields: uniquePredictors,
    predictorLabels: predictorMeta.map((field) => field.label),
    caseCount: rows.length,
    treeCount,
    maxDepth: normalizedMaxDepth,
    tree: allTrees[0]!,
    accuracy: rows.length > 0 ? correct / rows.length : null,
    balancedAccuracy,
    oobAccuracy,
    featureImportance,
    confusionMatrix: [...confusionCounts.entries()].map(([key, count]) => {
      const [actual, predicted] = key.split('::');
      return { actual: actual ?? '', predicted: predicted ?? '', count };
    }),
    notes: [
      method === 'random_forest'
        ? `Random forest fit ${treeCount} trees with ${criterion} splitting and OOB scoring.`
        : `CART classification tree fit with ${criterion} splitting and minimum leaf size ${minSamplesLeaf}.`,
      `Feature subset per split: ${featureSubsetCount <= 0 || featureSubsetCount >= uniquePredictors.length ? 'all predictors' : featureSubsetCount}.`
    ]
  };
}

function uniqueFormattedLevels(values: DatasetValue[]): string[] {
  return [...new Set(values
    .filter((value) => value !== null && value !== undefined)
    .map((value) => formatValue(value)))]
    .sort((left, right) => left.localeCompare(right));
}

function defaultGlmLinkForFamily(family: GeneralLinearModelFamily): GeneralLinearModelLink {
  if (family === 'binomial') return 'logit';
  if (family === 'poisson') return 'log';
  return 'identity';
}

function isGlmLinkValidForFamily(family: GeneralLinearModelFamily, link: GeneralLinearModelLink): boolean {
  if (family === 'gaussian') return link === 'identity';
  if (family === 'binomial') return link === 'logit' || link === 'probit' || link === 'cloglog';
  return link === 'log' || link === 'identity' || link === 'sqrt';
}

function resolveGlmLink(family: GeneralLinearModelFamily, requestedLink?: GeneralLinearModelLink | null): GeneralLinearModelLink {
  const normalized = requestedLink ?? null;
  if (normalized && isGlmLinkValidForFamily(family, normalized)) return normalized;
  return defaultGlmLinkForFamily(family);
}

function resolveGeeLink(family: GeeFamily, requestedLink?: GeeLink | null): GeeLink {
  const link = requestedLink ?? null;
  if (family === 'gaussian') {
    if (link === 'identity') return link;
    return 'identity';
  }
  if (family === 'binomial') {
    if (link === 'logit' || link === 'probit' || link === 'cloglog') return link;
    return 'logit';
  }
  if (link === 'log' || link === 'identity' || link === 'sqrt') return link;
  return 'log';
}

export function analyzeGeneralLinearModel(
  dataset: CaseDataset,
  dependentFieldKey: string,
  factorFields: string[] = [],
  covariateFields: string[] = [],
  options?: DatasetAnalysisOptions,
  modelOptions?: GeneralLinearModelOptions
): GeneralLinearModelResult {
  const requestedFamily = modelOptions?.family ?? 'gaussian';
  const family: GeneralLinearModelFamily = requestedFamily === 'binomial' || requestedFamily === 'poisson'
    ? requestedFamily
    : 'gaussian';
  const link = resolveGlmLink(family, modelOptions?.link);
  const confidenceLevel = Math.min(0.999, Math.max(0.8, modelOptions?.confidenceLevel ?? 0.95));
  const confidenceZ = Math.abs(inverseNormalCdf((1 + confidenceLevel) / 2));
  const maxIterations = Math.max(10, Math.min(500, Math.floor(modelOptions?.maxIterations ?? 120)));
  const tolerance = Math.max(1e-10, Math.min(1e-2, modelOptions?.tolerance ?? 1e-6));
  const covarianceEstimator: GeneralLinearModelCovarianceEstimator = modelOptions?.covarianceEstimator === 'model'
    ? 'model'
    : 'robust';

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
  const normalizeBinary = (value: DatasetValue): number | null => {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null;
      return value >= 0.5 ? 1 : 0;
    }
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['1', 'true', 'yes', 'y', 'event', 'success', 'positive'].includes(normalized)) return 1;
      if (['0', 'false', 'no', 'n', 'none', 'failure', 'negative'].includes(normalized)) return 0;
    }
    return null;
  };
  const requiredFields = [dependentFieldKey, ...normalizedFactors, ...normalizedCovariates];
  const rows = analysisRows(dataset, requiredFields, options)
    .map(({ row, weight }) => ({
      caseId: typeof row.case_id === 'string' ? row.case_id : null,
      caseLabel: typeof row.case_label === 'string' ? row.case_label : null,
      yRaw: row[dependentFieldKey],
      y: family === 'gaussian'
        ? (typeof row[dependentFieldKey] === 'number' ? row[dependentFieldKey] : null)
        : family === 'binomial'
          ? normalizeBinary(row[dependentFieldKey] ?? null)
          : (typeof row[dependentFieldKey] === 'number' && row[dependentFieldKey] >= 0 ? row[dependentFieldKey] : null),
      factorValues: Object.fromEntries(normalizedFactors.map((field) => [field, row[field] ?? null])) as Record<string, DatasetValue>,
      covariateValues: Object.fromEntries(normalizedCovariates.map((field) => [field, row[field] ?? null])) as Record<string, DatasetValue>,
      weight
    }))
    .filter((entry): entry is {
      caseId: string | null;
      caseLabel: string | null;
      yRaw: DatasetValue;
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

  if (family !== 'gaussian') {
    const parameterCount = columns.length;
    const weightedCaseCount = weights.reduce((total, value) => total + value, 0);
    let coefficients: number[] = [];
    let predictions: number[] = [];
    let information: number[][] = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
    let modelLogLikelihood: number | null = null;
    let nullModelLogLikelihood: number | null = null;
    let deviance: number | null = null;
    let nullDeviance: number | null = null;
    let modelStatistic: number | null = null;
    let modelPValue: number | null = null;
    let pseudoRSquared: number | null = null;
    let meanAbsoluteError: number | null = null;
    let rootMeanSquareError: number | null = null;
    let brierScore: number | null = null;
    let rocAuc: number | null = null;
    let rocAucConfidenceInterval: ConfidenceInterval | null = null;
    let thresholdAnalysis: RegressionThresholdMetric[] | undefined;
    let bestByF1: RegressionThresholdMetric | null = null;
    let bestByYouden: RegressionThresholdMetric | null = null;
    let calibrationBins: RegressionCalibrationBin[] = [];
    let meanAbsoluteCalibrationError: number | null = null;
    let maxCalibrationGap: number | null = null;
    let calibrationSlopeIntercept: { intercept: number | null; slope: number | null } | null = null;

    const fitted = fitGeneralizedLinearModelIrls(
      xMatrix,
      yVector,
      weights,
      family,
      link,
      maxIterations,
      tolerance
    );
    coefficients = fitted.coefficients;
    predictions = fitted.means;
    information = fitted.information;

    if (family === 'binomial') {
      predictions = predictions.map((value) => Math.min(0.999999, Math.max(0.000001, value)));
      modelLogLikelihood = yVector.reduce((total, value, index) =>
        total + (weights[index]! * ((value * Math.log(predictions[index]!)) + ((1 - value) * Math.log(1 - predictions[index]!)))), 0);
      const meanY = yVector.reduce((total, value, index) => total + (value * weights[index]!), 0) / weightedCaseCount;
      const boundedMeanY = Math.min(0.999999, Math.max(0.000001, meanY));
      nullModelLogLikelihood = yVector.reduce((total, value, index) =>
        total + (weights[index]! * ((value * Math.log(boundedMeanY)) + ((1 - value) * Math.log(1 - boundedMeanY)))), 0);
      deviance = -2 * modelLogLikelihood;
      nullDeviance = -2 * nullModelLogLikelihood;
      modelStatistic = -2 * (nullModelLogLikelihood - modelLogLikelihood);
      modelPValue = chiSquarePValue(modelStatistic, Math.max(1, parameterCount - 1));
      pseudoRSquared = nullModelLogLikelihood === 0 ? null : 1 - (modelLogLikelihood / nullModelLogLikelihood);

      const scoreResidualsForSummary = yVector.map((value, index) => value - predictions[index]!);
      meanAbsoluteError = scoreResidualsForSummary.reduce((total, value, index) => total + (Math.abs(value) * weights[index]!), 0) / weightedCaseCount;
      rootMeanSquareError = Math.sqrt(
        scoreResidualsForSummary.reduce((total, value, index) => total + (weights[index]! * (value ** 2)), 0) / weightedCaseCount
      );
      brierScore = yVector.reduce((total, value, index) => total + (weights[index]! * ((value - predictions[index]!) ** 2)), 0) / weightedCaseCount;
      thresholdAnalysis = (() => {
        const thresholdCandidates = Array.from({ length: 17 }, (_unused, index) => Number((0.1 + (index * 0.05)).toFixed(2)));
        if (!thresholdCandidates.includes(0.5)) thresholdCandidates.push(0.5);
        return [...new Set(thresholdCandidates)]
          .sort((left, right) => left - right)
          .map((threshold) => computeClassificationMetricsAtThreshold(predictions, yVector, weights, threshold));
      })();
      bestByF1 = [...thresholdAnalysis]
        .filter((item) => item.f1Score !== null)
        .sort((left, right) =>
          (right.f1Score! - left.f1Score!)
          || ((right.youdenJ ?? -Infinity) - (left.youdenJ ?? -Infinity))
          || Math.abs(left.threshold - 0.5) - Math.abs(right.threshold - 0.5))[0] ?? null;
      bestByYouden = [...thresholdAnalysis]
        .filter((item) => item.youdenJ !== null)
        .sort((left, right) =>
          (right.youdenJ! - left.youdenJ!)
          || ((right.f1Score ?? -Infinity) - (left.f1Score ?? -Infinity))
          || Math.abs(left.threshold - 0.5) - Math.abs(right.threshold - 0.5))[0] ?? null;
      calibrationBins = buildCalibrationBins(predictions, yVector, weights, 10);
      const totalCalibrationWeight = calibrationBins.reduce((total, bin) => total + bin.weightedCount, 0);
      meanAbsoluteCalibrationError = totalCalibrationWeight > 0
        ? calibrationBins.reduce((total, bin) => total + (Math.abs(bin.calibrationGap ?? 0) * bin.weightedCount), 0) / totalCalibrationWeight
        : null;
      maxCalibrationGap = calibrationBins.reduce<number | null>((max, bin) => {
        if (bin.calibrationGap === null) return max;
        const absoluteGap = Math.abs(bin.calibrationGap);
        return max === null ? absoluteGap : Math.max(max, absoluteGap);
      }, null);
      calibrationSlopeIntercept = computeCalibrationSlopeIntercept(predictions, yVector, weights);
      rocAuc = computeRocAuc(predictions, yVector, weights);
      rocAucConfidenceInterval = computeRocAucConfidenceInterval(predictions, yVector, weights);
    } else {
      predictions = predictions.map((value) => Math.max(1e-9, value));
      modelLogLikelihood = yVector.reduce((total, value, index) => {
        const y = Math.max(0, value);
        const mu = Math.max(1e-9, predictions[index]!);
        const logFactorial = logGamma(y + 1);
        return total + (weights[index]! * ((y * Math.log(mu)) - mu - logFactorial));
      }, 0);
      const meanY = yVector.reduce((total, value, index) => total + (value * weights[index]!), 0) / weightedCaseCount;
      const nullMeans = yVector.map(() => Math.max(1e-9, meanY));
      nullModelLogLikelihood = yVector.reduce((total, value, index) => {
        const y = Math.max(0, value);
        const mu = nullMeans[index]!;
        const logFactorial = logGamma(y + 1);
        return total + (weights[index]! * ((y * Math.log(mu)) - mu - logFactorial));
      }, 0);
      deviance = computePoissonDeviance(yVector, predictions, weights);
      nullDeviance = computePoissonDeviance(yVector, nullMeans, weights);
      modelStatistic = nullDeviance - deviance;
      modelPValue = chiSquarePValue(modelStatistic, Math.max(1, parameterCount - 1));
      pseudoRSquared = nullDeviance > 0 ? 1 - (deviance / nullDeviance) : null;
      const residualsForSummary = yVector.map((value, index) => value - predictions[index]!);
      meanAbsoluteError = residualsForSummary.reduce((total, value, index) => total + (Math.abs(value) * weights[index]!), 0) / weightedCaseCount;
      rootMeanSquareError = Math.sqrt(
        residualsForSummary.reduce((total, value, index) => total + (weights[index]! * (value ** 2)), 0) / weightedCaseCount
      );
    }

    const inverseInformation = safeInvertMatrix(information);
    if (!inverseInformation) {
      throw new Error('Unable to invert GLM information matrix; review design terms and collinearity.');
    }
    const scoreResiduals = yVector.map((value, index) => value - predictions[index]!);
    const rowClusters = rows.map((_entry, index) => `row-${index + 1}`);
    const robustCovarianceMatrix = computeClusterRobustCovariance(inverseInformation, xMatrix, scoreResiduals, weights, rowClusters);
    const modelSe = inverseInformation.map((row, index) => {
      const variance = row[index] ?? null;
      return variance !== null && variance >= 0 ? Math.sqrt(variance) : null;
    });
    const robustSe = robustCovarianceMatrix.map((row, index) => {
      const variance = row[index] ?? null;
      return variance !== null && variance >= 0 ? Math.sqrt(variance) : null;
    });
    const robustSeInflation: number[] = [];
    const coefficientRows = coefficients.map((coefficient, index) => {
      const standardError = modelSe[index] ?? null;
      const robustStandardError = robustSe[index] ?? null;
      const chosenStandardError = covarianceEstimator === 'model'
        ? standardError
        : (robustStandardError && robustStandardError > 0 ? robustStandardError : standardError);
      const statistic = chosenStandardError && chosenStandardError > 0 ? coefficient / chosenStandardError : null;
      if (
        robustStandardError !== null
        && robustStandardError !== undefined
        && robustStandardError > 0
        && standardError !== null
        && standardError !== undefined
        && standardError > 0
      ) {
        robustSeInflation.push(robustStandardError / standardError);
      }
      const coefficientCi = chosenStandardError === null ? null : {
        level: confidenceLevel,
        lower: coefficient - (confidenceZ * chosenStandardError),
        upper: coefficient + (confidenceZ * chosenStandardError)
      };
      const robustCi = robustStandardError === null ? null : {
        level: confidenceLevel,
        lower: coefficient - (confidenceZ * robustStandardError),
        upper: coefficient + (confidenceZ * robustStandardError)
      };
      return {
        field: columns[index]!.field,
        label: columns[index]!.label,
        termType: columns[index]!.termType,
        termField: columns[index]!.termField,
        coefficient,
        standardError,
        statistic,
        pValue: statistic === null ? null : normalTwoSidedPValue(statistic),
        confidenceInterval: coefficientCi,
        robustStandardError,
        robustStatistic: robustStandardError && robustStandardError > 0 ? coefficient / robustStandardError : null,
        robustPValue: robustStandardError && robustStandardError > 0 ? normalTwoSidedPValue(coefficient / robustStandardError) : null,
        robustConfidenceInterval: robustCi,
        oddsRatio: family === 'binomial' ? Math.exp(coefficient) : null
      };
    });
    const pearsonResiduals = yVector.map((value, index) => {
      if (family === 'binomial') {
        const mu = Math.min(0.999999, Math.max(0.000001, predictions[index]!));
        return (value - mu) / Math.sqrt(Math.max(1e-12, mu * (1 - mu)));
      }
      return (value - predictions[index]!) / Math.sqrt(Math.max(1e-12, predictions[index]!));
    });
    const devianceResiduals = family === 'binomial'
      ? predictions.map((probability, index) => {
        const y = yVector[index]!;
        const boundedProbability = Math.min(0.999999, Math.max(0.000001, probability));
        const term = y === 1
          ? (2 * Math.log(1 / boundedProbability))
          : (2 * Math.log(1 / (1 - boundedProbability)));
        return (y - boundedProbability >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, term));
      })
      : predictions.map((mu, index) => {
        const y = Math.max(0, yVector[index]!);
        const boundedMu = Math.max(1e-9, mu);
        const term = y > 0
          ? 2 * ((y * Math.log(y / boundedMu)) - (y - boundedMu))
          : 2 * boundedMu;
        return (y - boundedMu >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, term));
      });
    const leverageValues = rows.map((entry, rowIndex) => {
      const vector = xMatrix[rowIndex]!;
      const projected = inverseInformation.map((row) => row.reduce((total, value, index) => total + (value * vector[index]!), 0));
      const varianceScale = family === 'binomial'
        ? Math.max(1e-12, predictions[rowIndex]! * (1 - predictions[rowIndex]!) * entry.weight)
        : Math.max(1e-12, predictions[rowIndex]! * entry.weight);
      const leverage = varianceScale * vector.reduce((total, value, index) => total + (value * projected[index]!), 0);
      return Number.isFinite(leverage) ? leverage : null;
    });
    const cooksValues = pearsonResiduals.map((residual, index) => {
      const leverage = leverageValues[index];
      if (leverage === null || !(leverage >= 0) || leverage >= 1 || parameterCount <= 0) return null;
      return ((residual ** 2) * leverage) / (parameterCount * Math.max(1e-12, (1 - leverage) ** 2));
    });
    const predictedClasses = family === 'binomial'
      ? predictions.map((probability) => probability >= 0.5 ? 1 : 0)
      : predictions.map(() => null);
    const observations: RegressionObservation[] = rows.map((entry, rowIndex) => ({
      caseId: entry.caseId,
      caseLabel: entry.caseLabel,
      actual: yVector[rowIndex]!,
      predicted: predictions[rowIndex]!,
      residual: scoreResiduals[rowIndex]!,
      standardizedResidual: pearsonResiduals[rowIndex] ?? null,
      leverage: leverageValues[rowIndex] ?? null,
      cooksDistance: cooksValues[rowIndex] ?? null,
      devianceResidual: devianceResiduals[rowIndex] ?? null,
      predictedClass: predictedClasses[rowIndex],
      outlier: Math.abs(pearsonResiduals[rowIndex] ?? 0) >= 2.5
    }));
    const influenceSummary: RegressionInfluenceRow[] = [...observations]
      .sort((left, right) => {
        const cooksDelta = (right.cooksDistance ?? -Infinity) - (left.cooksDistance ?? -Infinity);
        if (Number.isFinite(cooksDelta) && cooksDelta !== 0) return cooksDelta;
        const leverageDelta = (right.leverage ?? -Infinity) - (left.leverage ?? -Infinity);
        if (Number.isFinite(leverageDelta) && leverageDelta !== 0) return leverageDelta;
        return Math.abs(right.standardizedResidual ?? 0) - Math.abs(left.standardizedResidual ?? 0);
      })
      .slice(0, 10)
      .map((observation) => ({
        caseId: observation.caseId,
        caseLabel: observation.caseLabel,
        leverage: observation.leverage ?? null,
        cooksDistance: observation.cooksDistance ?? null,
        standardizedResidual: observation.standardizedResidual ?? null,
        devianceResidual: observation.devianceResidual ?? null
      }));
    const robustSeInflationMax = robustSeInflation.length > 0 ? Math.max(...robustSeInflation) : null;
    const robustSeInflationMean = robustSeInflation.length > 0
      ? robustSeInflation.reduce((total, value) => total + value, 0) / robustSeInflation.length
      : null;
    const vifByPredictor = columns.slice(1).length > 0
      ? computeVifByPredictor(rows.map((entry, rowIndex) => ({ x: xMatrix[rowIndex]!.slice(1), weight: entry.weight })), columns.slice(1).map((column) => column.field))
      : {};
    const vifValues = Object.values(vifByPredictor).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    const maxVif = vifValues.length > 0 ? Math.max(...vifValues) : null;
    const defaultThresholdMetric = thresholdAnalysis?.find((item) => Math.abs(item.threshold - 0.5) < 1e-9) ?? null;
    const residualSummary = summarizeResidualDistribution(scoreResiduals, pearsonResiduals);

    return {
      dependentField: dependentField.key,
      dependentLabel: dependentField.label,
      family,
      link,
      factorFields: normalizedFactors,
      factorLabels: factorMeta.map((field) => field.label),
      covariateFields: normalizedCovariates,
      covariateLabels: covariateMeta.map((field) => field.label),
      caseCount: rows.length,
      designColumnCount: columns.length,
      coefficients: coefficientRows,
      metrics: {
        rSquared: null,
        adjustedRSquared: null,
        residualStdError: null,
        fStatistic: modelStatistic,
        fPValue: modelPValue,
        modelDf: Math.max(0, parameterCount - 1),
        residualDf: Math.max(0, rows.length - parameterCount),
        sumSquaresModel: null,
        sumSquaresResidual: null,
        sumSquaresTotal: null,
        deviance,
        nullDeviance,
        aic: modelLogLikelihood === null ? null : (2 * parameterCount) - (2 * modelLogLikelihood),
        bic: modelLogLikelihood === null ? null : ((Math.log(Math.max(2, rows.length)) * parameterCount) - (2 * modelLogLikelihood))
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
      observations: observations.slice(0, 50),
      influenceSummary,
      assumptions: [
        buildAssumptionCheck('sample_size', 'Sample size', rows.length > columns.length ? 'pass' : 'fail', rows.length, 'GLM requires more usable rows than design columns.'),
        buildAssumptionCheck('design_rank', 'Design matrix rank', 'warn', columns.length, 'Categorical factors are dummy-coded with the first sorted level as the baseline.'),
        buildAssumptionCheck(
          'multicollinearity',
          'Multicollinearity (max VIF)',
          maxVif === null ? 'warn' : maxVif <= 5 ? 'pass' : maxVif <= 10 ? 'warn' : 'fail',
          maxVif,
          maxVif === null
            ? 'Could not compute VIF for all design predictors.'
            : maxVif <= 5
              ? 'Multicollinearity is within typical bounds.'
              : maxVif <= 10
                ? 'Moderate multicollinearity detected.'
                : 'High multicollinearity detected; term estimates may be unstable.'
        ),
        buildAssumptionCheck(
          'robust_se_shift',
          'Robust SE shift',
          robustSeInflationMax === null ? 'warn' : robustSeInflationMax <= 1.25 ? 'pass' : robustSeInflationMax <= 1.75 ? 'warn' : 'fail',
          robustSeInflationMax,
          robustSeInflationMax === null
            ? 'Robust-to-model standard-error inflation could not be computed.'
            : robustSeInflationMax <= 1.25
              ? 'Robust and model-based standard errors are closely aligned.'
              : robustSeInflationMax <= 1.75
                ? 'Moderate robust standard-error inflation is present.'
                : 'Large robust standard-error inflation suggests model misspecification.'
        ),
        ...(family === 'binomial'
          ? [buildAssumptionCheck(
            'discrimination',
            'Discrimination (ROC AUC)',
            rocAuc === null ? 'warn' : rocAuc >= 0.8 ? 'pass' : rocAuc >= 0.7 ? 'warn' : 'fail',
            rocAuc,
            rocAuc === null
              ? 'ROC AUC could not be computed for this binary outcome.'
              : rocAuc >= 0.8
                ? 'Discrimination is strong.'
                : rocAuc >= 0.7
                  ? 'Discrimination is moderate.'
                  : 'Discrimination is weak; review predictors and functional form.'
          )]
          : [])
      ],
      diagnostics: {
        weightedCaseCount,
        irlsIterations: fitted.iterations,
        irlsConverged: fitted.converged ? 1 : 0,
        modelLogLikelihood,
        nullModelLogLikelihood,
        deviance,
        nullDeviance,
        modelStatistic,
        modelPValue,
        pseudoRSquared,
        meanAbsoluteError,
        rootMeanSquareError,
        brierScore,
        rocAuc,
        rocAucCiLower: rocAucConfidenceInterval?.lower ?? null,
        rocAucCiUpper: rocAucConfidenceInterval?.upper ?? null,
        meanAbsoluteCalibrationError,
        maxCalibrationGap,
        calibrationIntercept: calibrationSlopeIntercept?.intercept ?? null,
        calibrationSlope: calibrationSlopeIntercept?.slope ?? null,
        thresholdAtF1Max: bestByF1?.threshold ?? null,
        thresholdAtYoudenMax: bestByYouden?.threshold ?? null,
        threshold05Accuracy: defaultThresholdMetric?.accuracy ?? null,
        threshold05Precision: defaultThresholdMetric?.precision ?? null,
        threshold05Recall: defaultThresholdMetric?.recall ?? null,
        threshold05F1: defaultThresholdMetric?.f1Score ?? null,
        maxVif,
        meanVif: vifValues.length > 0 ? vifValues.reduce((total, value) => total + value, 0) / vifValues.length : null,
        maxAbsPearsonResidual: pearsonResiduals.reduce((max, value) => Math.max(max, Math.abs(value)), 0),
        maxAbsDevianceResidual: devianceResiduals.reduce((max, value) => Math.max(max, Math.abs(value)), 0),
        maxLeverage: leverageValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0),
        maxCooksDistance: cooksValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0),
        outlierCount: observations.filter((item) => item.outlier).length,
        robustSeInflationMax,
        robustSeInflationMean,
        ...residualSummary,
        ...Object.fromEntries(Object.entries(vifByPredictor).map(([field, value]) => [`vif_${field}`, value]))
      },
      modelOptions: {
        maxIterations,
        tolerance,
        confidenceLevel,
        covarianceEstimator
      },
      notes: [
        family === 'binomial'
          ? `GLM binomial output uses iteratively reweighted ${link} estimation with configurable covariance inference.`
          : `GLM Poisson output uses iteratively reweighted ${link} estimation with configurable covariance inference.`,
        'Categorical factors are dummy-coded with the first sorted level as baseline.',
        `Estimator ${covarianceEstimator === 'model' ? 'uses model-based covariance' : 'uses sandwich-robust covariance'} at ${(confidenceLevel * 100).toFixed(1)}% confidence.`,
        family === 'binomial'
          ? `Model discrimination (ROC AUC ${formatValue(rocAuc as DatasetValue)}) and calibration diagnostics are included for logistic GLM.`
          : 'Poisson diagnostics include deviance and likelihood-ratio fit statistics.'
      ]
    };
  }

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
  const residualStdError = meanSquareResidual === null ? null : Math.sqrt(meanSquareResidual);
  const meanSquareModel = modelDf > 0 ? ssModel / modelDf : null;
  const fStatistic = meanSquareModel !== null && meanSquareResidual !== null && meanSquareResidual > 0
    ? meanSquareModel / meanSquareResidual
    : null;
  const rSquared = ssTotal === 0 ? 1 : 1 - (ssResidual / ssTotal);
  const adjustedRSquared = residualDf > 0 && rows.length > 1
    ? 1 - ((1 - rSquared) * ((rows.length - 1) / residualDf))
    : null;
  const inverseXtWX = safeInvertMatrix(xtwx);
  if (!inverseXtWX) {
    throw new Error('Unable to invert GLM design matrix; review factor levels and collinearity.');
  }
  const covarianceMatrix = meanSquareResidual === null ? null : inverseXtWX.map((row) => row.map((value) => value * meanSquareResidual));
  const residuals = yVector.map((value, index) => value - predictions[index]!);
  const standardizedResiduals = residualStdError && residualStdError > 0
    ? residuals.map((residual) => residual / residualStdError)
    : residuals.map(() => null);
  const leverageValues = rows.map((entry, rowIndex) => {
    const vector = xMatrix[rowIndex]!;
    const projected = inverseXtWX.map((row) => row.reduce((total, value, index) => total + (value * vector[index]!), 0));
    const leverage = entry.weight * vector.reduce((total, value, index) => total + (value * projected[index]!), 0);
    return Number.isFinite(leverage) ? leverage : null;
  });
  const parameterCount = columns.length;
  const cooksValues = standardizedResiduals.map((value, rowIndex) => {
    const leverage = leverageValues[rowIndex];
    if (value === null || leverage === null || !(leverage >= 0) || leverage >= 1 || parameterCount <= 0) return null;
    return ((value ** 2) * leverage) / (parameterCount * Math.max(1e-12, 1 - leverage));
  });
  const observations: RegressionObservation[] = rows.map((entry, rowIndex) => ({
    caseId: entry.caseId,
    caseLabel: entry.caseLabel,
    actual: yVector[rowIndex]!,
    predicted: predictions[rowIndex]!,
    residual: residuals[rowIndex]!,
    standardizedResidual: standardizedResiduals[rowIndex],
    leverage: leverageValues[rowIndex],
    cooksDistance: cooksValues[rowIndex],
    devianceResidual: null,
    predictedClass: null,
    outlier: standardizedResiduals[rowIndex] !== null && Math.abs(standardizedResiduals[rowIndex]!) >= 2.5
  }));
  const robustCovarianceMatrix = computeHc3RobustCovariance(inverseXtWX, xMatrix, residuals, weights, leverageValues);
  const robustSeInflation: number[] = [];

  return {
    dependentField: dependentField.key,
    dependentLabel: dependentField.label,
    family,
    link,
    factorFields: normalizedFactors,
    factorLabels: factorMeta.map((field) => field.label),
    covariateFields: normalizedCovariates,
    covariateLabels: covariateMeta.map((field) => field.label),
    caseCount: rows.length,
    designColumnCount: columns.length,
    coefficients: coefficients.map((coefficient, index) => {
      const column = columns[index]!;
      const standardError = covarianceMatrix ? Math.sqrt(Math.max(0, covarianceMatrix[index]![index]!)) : null;
      const robustStandardError = robustCovarianceMatrix
        ? Math.sqrt(Math.max(0, robustCovarianceMatrix[index]![index]!))
        : null;
      const inferenceStandardError = covarianceEstimator === 'model'
        ? standardError
        : (robustStandardError && robustStandardError > 0 ? robustStandardError : standardError);
      const statistic = inferenceStandardError && inferenceStandardError > 0 ? coefficient / inferenceStandardError : null;
      const pValue = statistic === null ? null : studentTPValue(statistic, residualDf);
      const robustStatistic = robustStandardError && robustStandardError > 0
        ? coefficient / robustStandardError
        : null;
      const robustPValue = robustStatistic === null ? null : studentTPValue(robustStatistic, residualDf);
      if (
        standardError !== null
        && standardError !== undefined
        && standardError > 0
        && robustStandardError !== null
        && robustStandardError !== undefined
        && Number.isFinite(robustStandardError)
      ) {
        robustSeInflation.push(robustStandardError / standardError);
      }
      return {
        field: column.field,
        label: column.label,
        termType: column.termType,
        termField: column.termField,
        coefficient,
        standardError,
        statistic,
        pValue,
        confidenceInterval: inferenceStandardError === null ? null : {
          level: confidenceLevel,
          lower: coefficient - (confidenceZ * inferenceStandardError),
          upper: coefficient + (confidenceZ * inferenceStandardError)
        },
        robustStandardError,
        robustStatistic,
        robustPValue,
        robustConfidenceInterval: robustStandardError === null ? null : {
          level: confidenceLevel,
          lower: coefficient - (confidenceZ * robustStandardError),
          upper: coefficient + (confidenceZ * robustStandardError)
        },
        oddsRatio: null
      };
    }),
    observations: observations.slice(0, 50),
    influenceSummary: [...observations]
      .sort((left, right) => {
        const cooksDelta = (right.cooksDistance ?? -Infinity) - (left.cooksDistance ?? -Infinity);
        if (Number.isFinite(cooksDelta) && cooksDelta !== 0) return cooksDelta;
        const leverageDelta = (right.leverage ?? -Infinity) - (left.leverage ?? -Infinity);
        if (Number.isFinite(leverageDelta) && leverageDelta !== 0) return leverageDelta;
        return Math.abs(right.standardizedResidual ?? 0) - Math.abs(left.standardizedResidual ?? 0);
      })
      .slice(0, 10)
      .map((observation) => ({
        caseId: observation.caseId,
        caseLabel: observation.caseLabel,
        leverage: observation.leverage ?? null,
        cooksDistance: observation.cooksDistance ?? null,
        standardizedResidual: observation.standardizedResidual ?? null,
        devianceResidual: observation.devianceResidual ?? null
      })),
    metrics: {
      rSquared,
      adjustedRSquared,
      residualStdError,
      fStatistic,
      fPValue: fStatistic === null || modelDf <= 0 || residualDf <= 0 ? null : fDistributionPValue(fStatistic, modelDf, residualDf),
      modelDf,
      residualDf,
      sumSquaresModel: ssModel,
      sumSquaresResidual: ssResidual,
      sumSquaresTotal: ssTotal,
      deviance: null,
      nullDeviance: null,
      aic: null,
      bic: null
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
      buildAssumptionCheck('design_rank', 'Design matrix rank', 'warn', columns.length, 'Categorical factors are dummy-coded with the first sorted level as the baseline.'),
      (() => {
        const standardizedResidualValues = standardizedResiduals
          .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
        const jarqueBera = computeJarqueBera(standardizedResidualValues);
        return buildAssumptionCheck(
          'residual_normality',
          'Residual normality (Jarque-Bera)',
          jarqueBera.pValue === null ? 'warn' : jarqueBera.pValue >= 0.05 ? 'pass' : 'warn',
          jarqueBera.pValue,
          jarqueBera.pValue === null
            ? 'Not enough variation to evaluate residual normality.'
            : jarqueBera.pValue >= 0.05
              ? 'Residual distribution does not strongly deviate from normality.'
              : 'Residual distribution shows non-normality; review transformation or robust inference.'
        );
      })(),
      (() => {
        const predictorDesignRows = rows.map((entry, rowIndex) => ({ x: xMatrix[rowIndex]!.slice(1), weight: entry.weight }));
        const breuschPagan = computeBreuschPagan(predictorDesignRows, residuals);
        return buildAssumptionCheck(
          'homoskedasticity',
          'Homoskedasticity (Breusch-Pagan)',
          breuschPagan.pValue === null ? 'warn' : breuschPagan.pValue >= 0.05 ? 'pass' : 'warn',
          breuschPagan.pValue,
          breuschPagan.pValue === null
            ? 'Unable to evaluate heteroskedasticity for this model.'
            : breuschPagan.pValue >= 0.05
              ? 'No strong heteroskedasticity signal detected.'
              : 'Heteroskedasticity signal detected; robust inference is recommended.'
        );
      })(),
      (() => {
        const robustSeInflationMax = robustSeInflation.length > 0 ? Math.max(...robustSeInflation) : null;
        return buildAssumptionCheck(
          'robust_se_shift',
          'Robust SE shift (HC3)',
          robustSeInflationMax === null ? 'warn' : robustSeInflationMax <= 1.25 ? 'pass' : robustSeInflationMax <= 1.75 ? 'warn' : 'fail',
          robustSeInflationMax,
          robustSeInflationMax === null
            ? 'HC3 robust standard errors were not available.'
            : robustSeInflationMax <= 1.25
              ? 'Robust and conventional standard errors are closely aligned.'
              : robustSeInflationMax <= 1.75
                ? 'Some coefficients show moderate robust-SE inflation.'
                : 'Large robust-SE inflation suggests unstable conventional inference.'
        );
      })(),
      (() => {
        const predictorFieldsForDiagnostics = columns.slice(1).map((column) => column.field);
        const predictorRowsForDiagnostics = rows.map((entry, rowIndex) => ({ x: xMatrix[rowIndex]!.slice(1), weight: entry.weight }));
        const vifByPredictor = predictorFieldsForDiagnostics.length > 0
          ? computeVifByPredictor(predictorRowsForDiagnostics, predictorFieldsForDiagnostics)
          : {};
        const vifValues = Object.values(vifByPredictor).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
        const maxVif = vifValues.length > 0 ? Math.max(...vifValues) : null;
        return buildAssumptionCheck(
          'multicollinearity',
          'Multicollinearity (max VIF)',
          maxVif === null ? 'warn' : maxVif <= 5 ? 'pass' : maxVif <= 10 ? 'warn' : 'fail',
          maxVif,
          maxVif === null
            ? 'Could not compute VIF for all design predictors.'
            : maxVif <= 5
              ? 'Multicollinearity is within typical bounds.'
              : maxVif <= 10
                ? 'Moderate multicollinearity detected.'
                : 'High multicollinearity detected; term estimates may be unstable.'
        );
      })(),
      (() => {
        const influentialCount = cooksValues.filter((value) => value !== null && value > (4 / Math.max(rows.length, 1))).length;
        return buildAssumptionCheck(
          'influence',
          "Influence (Cook's D)",
          influentialCount === 0 ? 'pass' : influentialCount <= 2 ? 'warn' : 'fail',
          influentialCount,
          influentialCount === 0
            ? 'No highly influential rows by Cook threshold.'
            : influentialCount <= 2
              ? 'A small number of influential rows were detected.'
              : 'Multiple influential rows were detected; inspect case-level diagnostics.'
        );
      })()
    ],
    diagnostics: (() => {
      const predictorFieldsForDiagnostics = columns.slice(1).map((column) => column.field);
      const predictorRowsForDiagnostics = rows.map((entry, rowIndex) => ({ x: xMatrix[rowIndex]!.slice(1), weight: entry.weight }));
      const vifByPredictor = predictorFieldsForDiagnostics.length > 0
        ? computeVifByPredictor(predictorRowsForDiagnostics, predictorFieldsForDiagnostics)
        : {};
      const vifValues = Object.values(vifByPredictor).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      const standardizedResidualValues = standardizedResiduals
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      const jarqueBera = computeJarqueBera(standardizedResidualValues);
      const breuschPagan = computeBreuschPagan(predictorRowsForDiagnostics, residuals);
      const robustSeInflationMax = robustSeInflation.length > 0 ? Math.max(...robustSeInflation) : null;
      const robustSeInflationMean = robustSeInflation.length > 0
        ? robustSeInflation.reduce((total, value) => total + value, 0) / robustSeInflation.length
        : null;
      const outlierCount = observations.filter((item) => item.outlier).length;
      const maxAbsStandardizedResidual = standardizedResiduals.reduce<number>((max, value) => {
        if (value === null) return max;
        return Math.max(max, Math.abs(value));
      }, 0);
      const maxLeverage = leverageValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0);
      const maxCooksDistance = cooksValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0);
      const leverageThreshold = (2 * parameterCount) / Math.max(rows.length, 1);
      const highLeverageCount = leverageValues.filter((value) => value !== null && value > leverageThreshold).length;
      const influentialCount = cooksValues.filter((value) => value !== null && value > (4 / Math.max(rows.length, 1))).length;
      const residualSummary = summarizeResidualDistribution(residuals, standardizedResiduals);
      return {
        weightedCaseCount,
        residualSumSquares: ssResidual,
        totalSumSquares: ssTotal,
        modelSumSquares: ssModel,
        outlierCount,
        maxAbsStandardizedResidual,
        maxLeverage,
        maxCooksDistance,
        highLeverageCount,
        influentialCount,
        meanAbsoluteError: residuals.reduce((total, value, index) => total + (Math.abs(value) * weights[index]!), 0) / weightedCaseCount,
        durbinWatson: computeDurbinWatson(residuals),
        jarqueBeraStatistic: jarqueBera.statistic,
        jarqueBeraPValue: jarqueBera.pValue,
        breuschPaganStatistic: breuschPagan.statistic,
        breuschPaganPValue: breuschPagan.pValue,
        breuschPaganRSquared: breuschPagan.rSquared,
        robustSeInflationMax,
        robustSeInflationMean,
        maxVif: vifValues.length > 0 ? Math.max(...vifValues) : null,
        meanVif: vifValues.length > 0 ? vifValues.reduce((total, value) => total + value, 0) / vifValues.length : null,
        maxPredictorCorrelation: predictorRowsForDiagnostics.length > 0 ? computeMaxPredictorCorrelation(predictorRowsForDiagnostics) : null,
        ...residualSummary,
        ...Object.fromEntries(Object.entries(vifByPredictor).map(([field, value]) => [`vif_${field}`, value]))
      };
    })(),
    modelOptions: {
      maxIterations,
      tolerance,
      confidenceLevel,
      covarianceEstimator
    },
    notes: [
      'GLM/ANCOVA uses weighted least-squares estimation with categorical dummy coding and expanded post-estimation diagnostics.',
      `Estimator ${covarianceEstimator === 'model' ? 'uses model-based covariance' : 'uses HC3/sandwich robust covariance'} at ${(confidenceLevel * 100).toFixed(1)}% confidence.`,
      `Configured link function: ${link}.`
    ]
  };
}

export function analyzeMixedModel(
  dataset: CaseDataset,
  dependentFieldKey: string,
  predictorFields: string[],
  groupFieldKey: string,
  options?: DatasetAnalysisOptions,
  modelOptions: MixedModelOptions = {}
): MixedModelResult {
  const uniquePredictors = [...new Set(predictorFields.map((field) => field.trim()).filter(Boolean))]
    .filter((field) => field !== dependentFieldKey && field !== groupFieldKey);
  const randomSlopeFields = [...new Set((modelOptions.randomSlopeFields ?? [])
    .map((field) => String(field ?? '').trim())
    .filter(Boolean))]
    .filter((field) => uniquePredictors.includes(field));
  const covarianceStructure: MixedModelCovarianceStructure = modelOptions.covarianceStructure === 'independent'
    ? 'independent'
    : 'compound_symmetry';
  const estimationMethod: 'ml' | 'reml' = modelOptions.estimationMethod === 'ml' ? 'ml' : 'reml';
  const confidenceLevel = Math.min(0.999, Math.max(0.8, modelOptions.confidenceLevel ?? 0.95));
  const confidenceZ = Math.abs(inverseNormalCdf((1 + confidenceLevel) / 2));
  if (!groupFieldKey || !groupFieldKey.trim()) {
    throw new Error('Mixed model requires a grouping field for random intercepts.');
  }
  if (uniquePredictors.length === 0) {
    throw new Error('Mixed model requires at least one numeric fixed predictor.');
  }

  const dependentField = requireDatasetField(dataset, dependentFieldKey, 'mixed-model dependent');
  const groupField = requireDatasetField(dataset, groupFieldKey, 'mixed-model grouping');
  const predictorMeta = uniquePredictors.map((field) => requireDatasetField(dataset, field, 'mixed-model predictor'));
  const rows = analysisRows(dataset, [dependentFieldKey, groupFieldKey, ...uniquePredictors], options)
    .map(({ row, weight }) => ({
      caseId: typeof row.case_id === 'string' ? row.case_id : null,
      caseLabel: typeof row.case_label === 'string' ? row.case_label : null,
      y: row[dependentFieldKey],
      x: uniquePredictors.map((field) => row[field]),
      groupValue: row[groupFieldKey],
      weight
    }))
    .filter((entry): entry is {
      caseId: string | null;
      caseLabel: string | null;
      y: number;
      x: number[];
      groupValue: Exclude<DatasetValue, null>;
      weight: number;
    } =>
      typeof entry.y === 'number'
      && entry.x.every((value) => typeof value === 'number')
      && entry.groupValue !== null
      && entry.weight > 0
    );

  const groupSet = new Set(rows.map((entry) => formatValue(entry.groupValue)));
  if (rows.length <= uniquePredictors.length + 1) {
    throw new Error('Mixed model requires more usable rows than fixed-effect parameters.');
  }
  if (groupSet.size < 2) {
    throw new Error('Mixed model requires at least two observed groups.');
  }

  const designMatrix = rows.map((entry) => [1, ...entry.x]);
  const outcomes = rows.map((entry) => entry.y);
  const weights = rows.map((entry) => entry.weight);
  const weightedCaseCount = weights.reduce((total, value) => total + value, 0);
  const parameterCount = uniquePredictors.length + 1;
  const xtwx = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
  const xtwy = Array.from({ length: parameterCount }, () => 0);
  for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
    const vector = designMatrix[rowIndex]!;
    const y = outcomes[rowIndex]!;
    const weight = weights[rowIndex]!;
    for (let i = 0; i < parameterCount; i += 1) {
      xtwy[i] += vector[i]! * y * weight;
      for (let j = 0; j < parameterCount; j += 1) {
        xtwx[i]![j] += vector[i]! * vector[j]! * weight;
      }
    }
  }

  const coefficients = solveLinearSystem(xtwx, xtwy);
  const fixedPredictions = designMatrix.map((vector) => coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0));
  const fixedResiduals = outcomes.map((value, index) => value - fixedPredictions[index]!);

  const groupedResiduals = new Map<string, { caseCount: number; weightedCount: number; residuals: number[]; weights: number[]; xRows: number[][] }>();
  for (let index = 0; index < rows.length; index += 1) {
    const key = formatValue(rows[index]!.groupValue);
    const bucket = groupedResiduals.get(key) ?? { caseCount: 0, weightedCount: 0, residuals: [], weights: [], xRows: [] };
    bucket.caseCount += 1;
    bucket.weightedCount += weights[index]!;
    bucket.residuals.push(fixedResiduals[index]!);
    bucket.weights.push(weights[index]!);
    bucket.xRows.push([...rows[index]!.x]);
    groupedResiduals.set(key, bucket);
  }

  const randomSlopeFieldIndexes = randomSlopeFields.map((field) => uniquePredictors.indexOf(field)).filter((index) => index >= 0);
  const randomEffectsByGroup = new Map<string, number[]>();
  const randomInterceptByGroup = new Map<string, number>();
  for (const [groupValue, bucket] of groupedResiduals.entries()) {
    if (randomSlopeFieldIndexes.length === 0) {
      const intercept = weightedMean(bucket.residuals, bucket.weights) ?? 0;
      randomEffectsByGroup.set(groupValue, [intercept]);
      randomInterceptByGroup.set(groupValue, intercept);
      continue;
    }
    const zRows = bucket.xRows.map((row) => [1, ...randomSlopeFieldIndexes.map((fieldIndex) => row[fieldIndex] ?? 0)]);
    const zParamCount = zRows[0]?.length ?? 1;
    let randomEffects: number[];
    if (bucket.caseCount <= zParamCount) {
      randomEffects = [weightedMean(bucket.residuals, bucket.weights) ?? 0, ...randomSlopeFieldIndexes.map(() => 0)];
    } else {
      const ztwz = Array.from({ length: zParamCount }, () => Array.from({ length: zParamCount }, () => 0));
      const ztwResidual = new Array<number>(zParamCount).fill(0);
      for (let rowIndex = 0; rowIndex < zRows.length; rowIndex += 1) {
        const z = zRows[rowIndex]!;
        const residual = bucket.residuals[rowIndex] ?? 0;
        const weight = bucket.weights[rowIndex] ?? 1;
        for (let i = 0; i < zParamCount; i += 1) {
          ztwResidual[i] += z[i]! * residual * weight;
          for (let j = 0; j < zParamCount; j += 1) {
            ztwz[i]![j] += z[i]! * z[j]! * weight;
          }
        }
      }
      randomEffects = solveRidgeSystem(ztwz, ztwResidual, 1e-4);
    }
    randomEffectsByGroup.set(groupValue, randomEffects);
    randomInterceptByGroup.set(groupValue, randomEffects[0] ?? 0);
  }
  const mixedPredictions = rows.map((entry, index) => {
    const groupValue = formatValue(entry.groupValue);
    const randomEffects = randomEffectsByGroup.get(groupValue) ?? [0];
    const randomSlopeContribution = randomSlopeFieldIndexes.reduce((total, predictorIndex, slopeIndex) =>
      total + ((randomEffects[slopeIndex + 1] ?? 0) * (entry.x[predictorIndex] ?? 0)), 0);
    return fixedPredictions[index]! + (randomEffects[0] ?? 0) + randomSlopeContribution;
  });
  const mixedResiduals = outcomes.map((value, index) => value - mixedPredictions[index]!);

  const yMean = outcomes.reduce((total, value, index) => total + (value * weights[index]!), 0) / weightedCaseCount;
  const ssTotal = outcomes.reduce((total, value, index) => total + (weights[index]! * ((value - yMean) ** 2)), 0);
  const ssFixedResidual = outcomes.reduce((total, value, index) => total + (weights[index]! * ((value - fixedPredictions[index]!) ** 2)), 0);
  const ssMixedResidual = outcomes.reduce((total, value, index) => total + (weights[index]! * ((value - mixedPredictions[index]!) ** 2)), 0);

  const groupEffectValues = [...groupedResiduals.entries()].map(([groupValue, bucket]) => ({
    groupValue,
    weightedCount: bucket.weightedCount,
    randomIntercept: randomInterceptByGroup.get(groupValue) ?? 0,
    caseCount: bucket.caseCount
  }));
  const betweenGroupVariance = weightedVariance(
    groupEffectValues.map((item) => item.randomIntercept),
    groupEffectValues.map((item) => item.weightedCount)
  );
  const withinGroupVariance = weightedVariance(mixedResiduals, weights);
  const totalVariance = (betweenGroupVariance ?? 0) + (withinGroupVariance ?? 0);
  const intraclassCorrelation = totalVariance > 0 ? (betweenGroupVariance ?? 0) / totalVariance : null;
  const rSquaredMarginal = ssTotal === 0 ? 1 : 1 - (ssFixedResidual / ssTotal);
  const rSquaredConditional = ssTotal === 0 ? 1 : 1 - (ssMixedResidual / ssTotal);
  const residualStdError = withinGroupVariance === null ? null : Math.sqrt(Math.max(0, withinGroupVariance));
  const sigmaSquared = weightedCaseCount > 0 ? ssMixedResidual / weightedCaseCount : null;
  const logLikelihood = sigmaSquared && sigmaSquared > 0
    ? -0.5 * weightedCaseCount * (Math.log(2 * Math.PI * sigmaSquared) + 1)
    : null;
  const informationInverse = safeInvertMatrix(xtwx);
  if (!informationInverse) {
    throw new Error('Unable to invert mixed-model fixed-effects information matrix.');
  }
  const degreesOfFreedom = Math.max(1, rows.length - parameterCount);
  const leverageValues = rows.map((entry, rowIndex) => {
    const vector = designMatrix[rowIndex]!;
    const projected = informationInverse.map((row) => row.reduce((total, value, index) => total + (value * vector[index]!), 0));
    const leverage = entry.weight * vector.reduce((total, value, index) => total + (value * projected[index]!), 0);
    return Number.isFinite(leverage) ? leverage : null;
  });
  const standardizedResiduals = residualStdError && residualStdError > 0
    ? mixedResiduals.map((residual) => residual / residualStdError)
    : mixedResiduals.map(() => null);
  const cooksValues = standardizedResiduals.map((value, rowIndex) => {
    const leverage = leverageValues[rowIndex];
    if (value === null || leverage === null || !(leverage >= 0) || leverage >= 1 || parameterCount <= 0) return null;
    return ((value ** 2) * leverage) / (parameterCount * Math.max(1e-12, 1 - leverage));
  });
  const robustCovarianceMatrix = computeHc3RobustCovariance(informationInverse, designMatrix, mixedResiduals, weights, leverageValues);
  const robustSeInflation: number[] = [];
  const coefficientTable: MixedModelCoefficient[] = coefficients.map((coefficient, index) => {
    const modelVariance = withinGroupVariance !== null
      ? Math.max(0, informationInverse[index]![index]! * withinGroupVariance)
      : null;
    const standardError = modelVariance === null ? null : Math.sqrt(modelVariance);
    const statistic = standardError && standardError > 0 ? coefficient / standardError : null;
    const robustStandardError = robustCovarianceMatrix
      ? Math.sqrt(Math.max(0, robustCovarianceMatrix[index]![index]!))
      : null;
    const robustStatistic = robustStandardError && robustStandardError > 0
      ? coefficient / robustStandardError
      : null;
    const robustPValue = robustStatistic === null ? null : studentTPValue(robustStatistic, degreesOfFreedom);
    if (
      standardError !== null
      && standardError !== undefined
      && standardError > 0
      && robustStandardError !== null
      && robustStandardError !== undefined
      && Number.isFinite(robustStandardError)
    ) {
      robustSeInflation.push(robustStandardError / standardError);
    }
    return {
      field: index === 0 ? '(Intercept)' : uniquePredictors[index - 1]!,
      label: index === 0 ? 'Intercept' : predictorMeta[index - 1]!.label,
      termType: index === 0 ? 'intercept' : 'fixed',
      termField: index === 0 ? undefined : uniquePredictors[index - 1]!,
      coefficient,
      standardError,
      statistic,
      pValue: statistic === null ? null : studentTPValue(statistic, degreesOfFreedom),
      confidenceInterval: standardError === null ? null : {
        level: confidenceLevel,
        lower: coefficient - (confidenceZ * standardError),
        upper: coefficient + (confidenceZ * standardError)
      },
      robustStandardError,
      robustStatistic,
      robustPValue,
      robustConfidenceInterval: robustStandardError === null ? null : {
        level: confidenceLevel,
        lower: coefficient - (confidenceZ * robustStandardError),
        upper: coefficient + (confidenceZ * robustStandardError)
      },
      oddsRatio: null
    };
  });
  const observations: MixedModelObservation[] = rows.map((entry, rowIndex) => ({
    caseId: entry.caseId,
    caseLabel: entry.caseLabel,
    groupValue: formatValue(entry.groupValue),
    actual: outcomes[rowIndex]!,
    fixedPredicted: fixedPredictions[rowIndex]!,
    mixedPredicted: mixedPredictions[rowIndex]!,
    residual: mixedResiduals[rowIndex]!,
    standardizedResidual: standardizedResiduals[rowIndex],
    leverage: leverageValues[rowIndex],
    cooksDistance: cooksValues[rowIndex],
    outlier: standardizedResiduals[rowIndex] !== null && Math.abs(standardizedResiduals[rowIndex]!) >= 2.5
  }));
  const influenceSummary: RegressionInfluenceRow[] = [...observations]
    .sort((left, right) => {
      const cooksDelta = (right.cooksDistance ?? -Infinity) - (left.cooksDistance ?? -Infinity);
      if (Number.isFinite(cooksDelta) && cooksDelta !== 0) return cooksDelta;
      const leverageDelta = (right.leverage ?? -Infinity) - (left.leverage ?? -Infinity);
      if (Number.isFinite(leverageDelta) && leverageDelta !== 0) return leverageDelta;
      return Math.abs(right.standardizedResidual ?? 0) - Math.abs(left.standardizedResidual ?? 0);
    })
    .slice(0, 10)
    .map((observation) => ({
      caseId: observation.caseId,
      caseLabel: observation.caseLabel,
      leverage: observation.leverage ?? null,
      cooksDistance: observation.cooksDistance ?? null,
      standardizedResidual: observation.standardizedResidual ?? null,
      devianceResidual: null
    }));

  const groupEffects: MixedModelGroupEffect[] = groupEffectValues
    .map((item) => ({
      groupValue: item.groupValue,
      caseCount: item.caseCount,
      weightedCount: item.weightedCount,
      randomIntercept: item.randomIntercept,
      randomSlopes: randomSlopeFields.length > 0
        ? Object.fromEntries(randomSlopeFields.map((field, slopeIndex) => [field, randomEffectsByGroup.get(item.groupValue)?.[slopeIndex + 1] ?? 0]))
        : undefined,
      standardError: withinGroupVariance === null || item.weightedCount <= 0
        ? null
        : Math.sqrt(Math.max(0, withinGroupVariance / item.weightedCount))
    }))
    .sort((left, right) => right.weightedCount - left.weightedCount || left.groupValue.localeCompare(right.groupValue));

  const vifByPredictor = computeVifByPredictor(rows.map((entry) => ({ x: entry.x, weight: entry.weight })), uniquePredictors);
  const vifValues = Object.values(vifByPredictor).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const maxVif = vifValues.length > 0 ? Math.max(...vifValues) : null;
  const maxPredictorCorrelation = computeMaxPredictorCorrelation(rows.map((entry) => ({ x: entry.x, weight: entry.weight })));
  const jarqueBera = computeJarqueBera(
    standardizedResiduals.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  );
  const breuschPagan = computeBreuschPagan(rows.map((entry) => ({ x: entry.x, weight: entry.weight })), mixedResiduals);
  const robustSeInflationMax = robustSeInflation.length > 0 ? Math.max(...robustSeInflation) : null;
  const robustSeInflationMean = robustSeInflation.length > 0
    ? robustSeInflation.reduce((total, value) => total + value, 0) / robustSeInflation.length
    : null;
  const residualSummary = summarizeResidualDistribution(mixedResiduals, standardizedResiduals);
  const outlierCount = observations.filter((item) => item.outlier).length;
  const maxAbsStandardizedResidual = standardizedResiduals.reduce<number>((max, value) => {
    if (value === null) return max;
    return Math.max(max, Math.abs(value));
  }, 0);
  const maxLeverage = leverageValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0);
  const maxCooksDistance = cooksValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0);
  const leverageThreshold = (2 * parameterCount) / Math.max(rows.length, 1);
  const highLeverageCount = leverageValues.filter((value) => value !== null && value > leverageThreshold).length;
  const influentialCount = cooksValues.filter((value) => value !== null && value > (4 / Math.max(rows.length, 1))).length;

  return {
    dependentField: dependentField.key,
    dependentLabel: dependentField.label,
    predictorFields: uniquePredictors,
    predictorLabels: predictorMeta.map((item) => item.label),
    groupField: groupField.key,
    groupLabel: groupField.label,
    caseCount: rows.length,
    groupCount: groupSet.size,
    coefficients: coefficientTable,
    groupEffects: groupEffects.slice(0, 120),
    observations: observations.slice(0, 50),
    influenceSummary,
    metrics: {
      weightedCaseCount,
      betweenGroupVariance,
      withinGroupVariance,
      intraclassCorrelation,
      residualStdError,
      rSquaredMarginal,
      rSquaredConditional,
      logLikelihood,
      aic: logLikelihood === null ? null : (2 * (parameterCount + 1)) - (2 * logLikelihood),
      bic: logLikelihood === null ? null : ((Math.log(Math.max(2, rows.length)) * (parameterCount + 1)) - (2 * logLikelihood)),
      covarianceStructure,
      estimationMethod,
      randomEffectParameterCount: 1 + randomSlopeFields.length
    },
    assumptions: [
      buildAssumptionCheck(
        'group_count',
        'Observed groups',
        groupSet.size >= 2 ? 'pass' : 'fail',
        groupSet.size,
        groupSet.size >= 2 ? 'At least two groups are present.' : 'Mixed model needs at least two groups.'
      ),
      buildAssumptionCheck(
        'mean_cluster_size',
        'Mean cluster size',
        (rows.length / groupSet.size) >= 3 ? 'pass' : 'warn',
        rows.length / groupSet.size,
        (rows.length / groupSet.size) >= 3 ? 'Average group size is acceptable.' : 'Average group size is small; random effects may be unstable.'
      ),
      buildAssumptionCheck(
        'multicollinearity',
        'Multicollinearity (max VIF)',
        maxVif === null ? 'warn' : maxVif <= 5 ? 'pass' : maxVif <= 10 ? 'warn' : 'fail',
        maxVif,
        maxVif === null
          ? 'VIF could not be computed for all predictors.'
          : maxVif <= 5
            ? 'Fixed predictors are within typical collinearity bounds.'
          : maxVif <= 10
            ? 'Moderate collinearity detected among fixed predictors.'
            : 'High collinearity detected among fixed predictors.'
      ),
      buildAssumptionCheck(
        'residual_normality',
        'Residual normality (Jarque-Bera)',
        jarqueBera.pValue === null ? 'warn' : jarqueBera.pValue >= 0.05 ? 'pass' : 'warn',
        jarqueBera.pValue,
        jarqueBera.pValue === null
          ? 'Not enough variation to evaluate residual normality.'
          : jarqueBera.pValue >= 0.05
            ? 'Residual distribution does not strongly deviate from normality.'
            : 'Residual distribution shows non-normality; review model form.'
      ),
      buildAssumptionCheck(
        'homoskedasticity',
        'Homoskedasticity (Breusch-Pagan)',
        breuschPagan.pValue === null ? 'warn' : breuschPagan.pValue >= 0.05 ? 'pass' : 'warn',
        breuschPagan.pValue,
        breuschPagan.pValue === null
          ? 'Unable to evaluate heteroskedasticity for this model.'
          : breuschPagan.pValue >= 0.05
            ? 'No strong heteroskedasticity signal detected.'
            : 'Heteroskedasticity signal detected; robust inference is recommended.'
      ),
      buildAssumptionCheck(
        'robust_se_shift',
        'Robust SE shift (HC3)',
        robustSeInflationMax === null ? 'warn' : robustSeInflationMax <= 1.25 ? 'pass' : robustSeInflationMax <= 1.75 ? 'warn' : 'fail',
        robustSeInflationMax,
        robustSeInflationMax === null
          ? 'HC3 robust standard errors were not available.'
          : robustSeInflationMax <= 1.25
            ? 'Robust and conventional standard errors are closely aligned.'
            : robustSeInflationMax <= 1.75
              ? 'Some fixed effects show moderate robust-SE inflation.'
              : 'Large robust-SE inflation suggests unstable conventional inference.'
      ),
      buildAssumptionCheck(
        'influence',
        "Influence (Cook's D)",
        influentialCount === 0 ? 'pass' : influentialCount <= 2 ? 'warn' : 'fail',
        influentialCount,
        influentialCount === 0
          ? 'No highly influential rows by Cook threshold.'
          : influentialCount <= 2
            ? 'A small number of influential rows were detected.'
            : 'Multiple influential rows were detected; inspect case-level diagnostics.'
      )
    ],
    diagnostics: {
      weightedCaseCount,
      maxVif,
      meanVif: vifValues.length > 0 ? vifValues.reduce((total, value) => total + value, 0) / vifValues.length : null,
      maxPredictorCorrelation,
      fixedResidualSumSquares: ssFixedResidual,
      mixedResidualSumSquares: ssMixedResidual,
      outlierCount,
      maxAbsStandardizedResidual,
      maxLeverage,
      maxCooksDistance,
      highLeverageCount,
      influentialCount,
      meanAbsoluteError: mixedResiduals.reduce((total, value, rowIndex) => total + (Math.abs(value) * weights[rowIndex]!), 0) / weightedCaseCount,
      durbinWatson: computeDurbinWatson(mixedResiduals),
      jarqueBeraStatistic: jarqueBera.statistic,
      jarqueBeraPValue: jarqueBera.pValue,
      breuschPaganStatistic: breuschPagan.statistic,
      breuschPaganPValue: breuschPagan.pValue,
      breuschPaganRSquared: breuschPagan.rSquared,
      robustSeInflationMax,
      robustSeInflationMean,
      ...residualSummary,
      randomSlopeCount: randomSlopeFields.length
    },
    modelOptions: {
      randomSlopeFields,
      covarianceStructure,
      estimationMethod,
      confidenceLevel
    },
    notes: [
      randomSlopeFields.length > 0
        ? `Mixed model includes random intercepts and random slopes for: ${randomSlopeFields.join(', ')}.`
        : 'Mixed model includes random intercepts by grouping field.',
      `Covariance structure: ${covarianceStructure}; estimation method label: ${estimationMethod.toUpperCase()}.`,
      `Confidence intervals are reported at ${(confidenceLevel * 100).toFixed(1)}%.`
    ]
  };
}

export function analyzeGeneralizedEstimatingEquation(
  dataset: CaseDataset,
  dependentFieldKey: string,
  predictorFields: string[],
  clusterFieldKey: string,
  family: GeeFamily = 'gaussian',
  correlation: GeeCorrelationStructure = 'independence',
  options?: DatasetAnalysisOptions,
  modelOptions: GeeModelOptions = {}
): GeeResult {
  const uniquePredictors = [...new Set(predictorFields.map((field) => field.trim()).filter(Boolean))]
    .filter((field) => field !== dependentFieldKey && field !== clusterFieldKey);
  const link = resolveGeeLink(family, modelOptions.link);
  const maxIterations = Math.max(10, Math.min(500, Math.floor(modelOptions.maxIterations ?? 120)));
  const tolerance = Math.max(1e-10, Math.min(1e-2, modelOptions.tolerance ?? 1e-6));
  const smallSampleCorrection = modelOptions.smallSampleCorrection !== false;
  const confidenceLevel = Math.min(0.999, Math.max(0.8, modelOptions.confidenceLevel ?? 0.95));
  const confidenceZ = Math.abs(inverseNormalCdf((1 + confidenceLevel) / 2));
  if (!clusterFieldKey || !clusterFieldKey.trim()) {
    throw new Error('GEE requires a cluster field.');
  }
  if (uniquePredictors.length === 0) {
    throw new Error('GEE requires at least one numeric predictor.');
  }
  const dependentField = requireDatasetField(dataset, dependentFieldKey, 'GEE dependent');
  const clusterField = requireDatasetField(dataset, clusterFieldKey, 'GEE cluster');
  const predictorMeta = uniquePredictors.map((field) => requireDatasetField(dataset, field, 'GEE predictor'));
  const normalizeBinary = (value: DatasetValue): number | null => {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null;
      return value >= 0.5 ? 1 : 0;
    }
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['1', 'true', 'yes', 'y', 'event', 'success', 'positive'].includes(normalized)) return 1;
      if (['0', 'false', 'no', 'n', 'none', 'failure', 'negative'].includes(normalized)) return 0;
    }
    return null;
  };

  const rows = analysisRows(dataset, [dependentFieldKey, clusterFieldKey, ...uniquePredictors], options)
    .map(({ row, weight }) => ({
      caseId: typeof row.case_id === 'string' ? row.case_id : null,
      caseLabel: typeof row.case_label === 'string' ? row.case_label : null,
      yRaw: row[dependentFieldKey],
      x: uniquePredictors.map((field) => row[field]),
      clusterValue: row[clusterFieldKey],
      weight
    }))
    .filter((entry): entry is {
      caseId: string | null;
      caseLabel: string | null;
      yRaw: DatasetValue;
      x: number[];
      clusterValue: Exclude<DatasetValue, null>;
      weight: number;
    } =>
      entry.x.every((value) => typeof value === 'number')
      && entry.clusterValue !== null
      && entry.weight > 0
      && (
        family === 'gaussian'
          ? typeof entry.yRaw === 'number'
          : family === 'binomial'
            ? normalizeBinary(entry.yRaw) !== null
            : (typeof entry.yRaw === 'number' && entry.yRaw >= 0)
      )
    );

  const parameterCount = uniquePredictors.length + 1;
  if (rows.length <= parameterCount) {
    throw new Error('GEE requires more usable rows than model parameters.');
  }

  const designMatrix = rows.map((entry) => [1, ...entry.x]);
  const outcomes = rows.map((entry) =>
    family === 'gaussian'
      ? Number(entry.yRaw)
      : family === 'binomial'
        ? (normalizeBinary(entry.yRaw) ?? 0)
        : Math.max(0, Number(entry.yRaw))
  );
  const weights = rows.map((entry) => entry.weight);
  const clusterValues = rows.map((entry) => formatValue(entry.clusterValue));
  const weightedCaseCount = weights.reduce((total, value) => total + value, 0);
  const clusterCounts = new Map<string, number>();
  for (const cluster of clusterValues) {
    clusterCounts.set(cluster, (clusterCounts.get(cluster) ?? 0) + 1);
  }
  const clusterSizeValues = [...clusterCounts.values()];
  const clusterCount = clusterCounts.size;
  if (clusterCount < 2) {
    throw new Error('GEE requires at least two observed clusters.');
  }

  let coefficients: number[] = [];
  let predicted: number[] = [];
  let scoreResiduals: number[] = [];
  let information: number[][] = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
  let modelCovariance: number[][] = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
  let quasiLikelihood: number | null = null;
  let rSquared: number | null = null;
  let pseudoRSquared: number | null = null;
  let modelStatistic: number | null = null;
  let modelPValue: number | null = null;
  let modelLogLikelihood: number | null = null;
  let nullModelLogLikelihood: number | null = null;

  if (family === 'gaussian') {
    const xtwx = Array.from({ length: parameterCount }, () => Array.from({ length: parameterCount }, () => 0));
    const xtwy = Array.from({ length: parameterCount }, () => 0);
    for (let rowIndex = 0; rowIndex < designMatrix.length; rowIndex += 1) {
      const vector = designMatrix[rowIndex]!;
      const y = outcomes[rowIndex]!;
      const weight = weights[rowIndex]!;
      for (let i = 0; i < parameterCount; i += 1) {
        xtwy[i] += vector[i]! * y * weight;
        for (let j = 0; j < parameterCount; j += 1) {
          xtwx[i]![j] += vector[i]! * vector[j]! * weight;
        }
      }
    }
    coefficients = solveLinearSystem(xtwx, xtwy);
    predicted = designMatrix.map((vector) => coefficients.reduce((total, coefficient, index) => total + (coefficient * vector[index]!), 0));
    scoreResiduals = outcomes.map((value, index) => value - predicted[index]!);
    information = xtwx;
    const inverseInformation = safeInvertMatrix(information);
    if (!inverseInformation) {
      throw new Error('Unable to invert GEE information matrix for gaussian family.');
    }
    const residualSumSquares = outcomes.reduce((total, value, index) => total + (weights[index]! * ((value - predicted[index]!) ** 2)), 0);
    const modelScale = residualSumSquares / Math.max(1, rows.length - parameterCount);
    modelCovariance = inverseInformation.map((row) => row.map((value) => value * modelScale));
    quasiLikelihood = -0.5 * residualSumSquares;
    modelLogLikelihood = modelScale > 0
      ? -0.5 * weightedCaseCount * (Math.log(2 * Math.PI * modelScale) + 1)
      : null;
    const yMean = outcomes.reduce((total, value, index) => total + (value * weights[index]!), 0) / weightedCaseCount;
    const ssTotal = outcomes.reduce((total, value, index) => total + (weights[index]! * ((value - yMean) ** 2)), 0);
    rSquared = ssTotal === 0 ? 1 : 1 - (residualSumSquares / ssTotal);
    const dfModel = Math.max(1, parameterCount - 1);
    const dfResidual = Math.max(1, rows.length - parameterCount);
    const msModel = Math.max(0, ssTotal - residualSumSquares) / dfModel;
    const msResidual = residualSumSquares / dfResidual;
    modelStatistic = msResidual > 0 ? msModel / msResidual : null;
    modelPValue = modelStatistic === null ? null : fDistributionPValue(modelStatistic, dfModel, dfResidual);
  } else if (family === 'binomial') {
    const fitted = fitGeneralizedLinearModelIrls(
      designMatrix,
      outcomes,
      weights,
      'binomial',
      link as GeneralLinearModelLink,
      maxIterations,
      tolerance
    );
    coefficients = fitted.coefficients;
    predicted = fitted.means.map((value) => Math.min(0.999999, Math.max(0.000001, value)));
    information = fitted.information;
    scoreResiduals = outcomes.map((value, index) => value - predicted[index]!);
    const inverseInformation = safeInvertMatrix(information);
    if (!inverseInformation) {
      throw new Error('Unable to invert GEE information matrix for binomial family.');
    }
    modelCovariance = inverseInformation;
    const logLikelihood = outcomes.reduce((total, value, index) =>
      total + (weights[index]! * ((value * Math.log(predicted[index]!)) + ((1 - value) * Math.log(1 - predicted[index]!)))), 0);
    quasiLikelihood = logLikelihood;
    modelLogLikelihood = logLikelihood;
    const meanY = outcomes.reduce((total, value, index) => total + (value * weights[index]!), 0) / weightedCaseCount;
    const boundedMeanY = Math.min(0.999999, Math.max(0.000001, meanY));
    const nullLogLikelihood = outcomes.reduce((total, value, index) =>
      total + (weights[index]! * ((value * Math.log(boundedMeanY)) + ((1 - value) * Math.log(1 - boundedMeanY)))), 0);
    nullModelLogLikelihood = nullLogLikelihood;
    pseudoRSquared = nullLogLikelihood === 0 ? null : 1 - (logLikelihood / nullLogLikelihood);
    modelStatistic = -2 * (nullLogLikelihood - logLikelihood);
    modelPValue = modelStatistic === null ? null : chiSquarePValue(modelStatistic, Math.max(1, parameterCount - 1));
  } else {
    const fitted = fitGeneralizedLinearModelIrls(
      designMatrix,
      outcomes,
      weights,
      'poisson',
      link as GeneralLinearModelLink,
      maxIterations,
      tolerance
    );
    coefficients = fitted.coefficients;
    predicted = fitted.means.map((value) => Math.max(1e-9, value));
    information = fitted.information;
    scoreResiduals = outcomes.map((value, index) => value - predicted[index]!);
    const inverseInformation = safeInvertMatrix(information);
    if (!inverseInformation) {
      throw new Error('Unable to invert GEE information matrix for poisson family.');
    }
    modelCovariance = inverseInformation;
    modelLogLikelihood = outcomes.reduce((total, value, index) => {
      const y = Math.max(0, value);
      const mu = Math.max(1e-9, predicted[index]!);
      return total + (weights[index]! * ((y * Math.log(mu)) - mu - logGamma(y + 1)));
    }, 0);
    const meanY = outcomes.reduce((total, value, index) => total + (value * weights[index]!), 0) / weightedCaseCount;
    const boundedMeanY = Math.max(1e-9, meanY);
    nullModelLogLikelihood = outcomes.reduce((total, value, index) => {
      const y = Math.max(0, value);
      return total + (weights[index]! * ((y * Math.log(boundedMeanY)) - boundedMeanY - logGamma(y + 1)));
    }, 0);
    const deviance = computePoissonDeviance(outcomes, predicted, weights);
    const nullDeviance = computePoissonDeviance(outcomes, outcomes.map(() => boundedMeanY), weights);
    quasiLikelihood = modelLogLikelihood;
    pseudoRSquared = nullDeviance > 0 ? 1 - (deviance / nullDeviance) : null;
    modelStatistic = nullDeviance - deviance;
    modelPValue = modelStatistic === null ? null : chiSquarePValue(modelStatistic, Math.max(1, parameterCount - 1));
  }

  const inverseInformation = safeInvertMatrix(information);
  if (!inverseInformation) {
    throw new Error('Unable to invert GEE information matrix.');
  }
  let robustCovariance = computeClusterRobustCovariance(inverseInformation, designMatrix, scoreResiduals, weights, clusterValues);
  if (smallSampleCorrection && clusterCount > 1 && rows.length > parameterCount) {
    const correction = (clusterCount / Math.max(1, clusterCount - 1)) * ((rows.length - 1) / Math.max(1, rows.length - parameterCount));
    robustCovariance = robustCovariance.map((row) => row.map((value) => value * correction));
  }
  const robustSe = robustCovariance.map((row, index) => {
    const variance = row[index] ?? null;
    return variance !== null && variance >= 0 ? Math.sqrt(variance) : null;
  });
  const modelSe = modelCovariance.map((row, index) => {
    const variance = row[index] ?? null;
    return variance !== null && variance >= 0 ? Math.sqrt(variance) : null;
  });
  const robustSeInflation: number[] = [];
  const coefficientTable: GeeCoefficient[] = coefficients.map((coefficient, index) => {
    const robustStandardError = robustSe[index] ?? null;
    const modelStandardError = modelSe[index] ?? null;
    const standardError = (robustStandardError && Number.isFinite(robustStandardError) && robustStandardError > 0)
      ? robustStandardError
      : modelStandardError;
    const statistic = standardError && standardError > 0 ? coefficient / standardError : null;
    if (
      robustStandardError !== null
      && robustStandardError !== undefined
      && robustStandardError > 0
      && modelStandardError !== null
      && modelStandardError !== undefined
      && modelStandardError > 0
    ) {
      robustSeInflation.push(robustStandardError / modelStandardError);
    }
    return {
      field: index === 0 ? '(Intercept)' : uniquePredictors[index - 1]!,
      label: index === 0 ? 'Intercept' : predictorMeta[index - 1]!.label,
      termType: index === 0 ? 'intercept' : 'predictor',
      termField: index === 0 ? undefined : uniquePredictors[index - 1]!,
      coefficient,
      standardError,
      modelStandardError,
      robustStandardError,
      statistic,
      pValue: statistic === null ? null : normalTwoSidedPValue(statistic),
      confidenceInterval: standardError === null ? null : {
        level: confidenceLevel,
        lower: coefficient - (confidenceZ * standardError),
        upper: coefficient + (confidenceZ * standardError)
      },
      oddsRatio: family === 'binomial' ? Math.exp(coefficient) : null
    };
  });

  const pearsonResiduals = predicted.map((estimate, index) => {
    if (family === 'gaussian') {
      const scale = modelSe[0] && modelSe[0]! > 0 ? modelSe[0]! : 1;
      return scoreResiduals[index]! / Math.max(1e-12, scale);
    }
    if (family === 'binomial') {
      const denominator = Math.sqrt(Math.max(1e-12, estimate * (1 - estimate)));
      return scoreResiduals[index]! / denominator;
    }
    return scoreResiduals[index]! / Math.sqrt(Math.max(1e-12, estimate));
  });
  const devianceResiduals = family === 'binomial'
    ? predicted.map((probability, index) => {
      const y = outcomes[index]!;
      const boundedProbability = Math.min(0.999999, Math.max(0.000001, probability));
      const term = y === 1
        ? (2 * Math.log(1 / boundedProbability))
        : (2 * Math.log(1 / (1 - boundedProbability)));
      return (y - boundedProbability >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, term));
    })
    : family === 'poisson'
      ? predicted.map((mu, index) => {
        const y = Math.max(0, outcomes[index]!);
        const boundedMu = Math.max(1e-9, mu);
        const term = y > 0
          ? 2 * ((y * Math.log(y / boundedMu)) - (y - boundedMu))
          : 2 * boundedMu;
        return (y - boundedMu >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, term));
      })
      : predicted.map(() => null);
  const leverageValues = rows.map((entry, index) => {
    const vector = designMatrix[index]!;
    const projected = inverseInformation.map((row) => row.reduce((total, value, innerIndex) => total + (value * vector[innerIndex]!), 0));
    const varianceScale = family === 'binomial'
      ? Math.max(1e-12, predicted[index]! * (1 - predicted[index]!) * entry.weight)
      : family === 'poisson'
        ? Math.max(1e-12, predicted[index]! * entry.weight)
        : entry.weight;
    const leverage = varianceScale * vector.reduce((total, value, innerIndex) => total + (value * projected[innerIndex]!), 0);
    return Number.isFinite(leverage) ? leverage : null;
  });
  const cooksValues = pearsonResiduals.map((residual, index) => {
    const leverage = leverageValues[index];
    if (leverage === null || !(leverage >= 0) || leverage >= 1 || parameterCount <= 0) return null;
    return ((residual ** 2) * leverage) / (parameterCount * Math.max(1e-12, (1 - leverage) ** 2));
  });
  const predictedClasses = family === 'binomial'
    ? predicted.map((probability) => probability >= 0.5 ? 1 : 0)
    : predicted.map(() => null);
  const observations: GeeObservation[] = rows.slice(0, 50).map((entry, index) => ({
    caseId: entry.caseId,
    caseLabel: entry.caseLabel,
    clusterValue: clusterValues[index]!,
    actual: outcomes[index]!,
    predicted: predicted[index]!,
    residual: scoreResiduals[index]!,
    standardizedResidual: pearsonResiduals[index]!,
    leverage: leverageValues[index],
    cooksDistance: cooksValues[index],
    devianceResidual: devianceResiduals[index] ?? null,
    predictedClass: predictedClasses[index],
    outlier: Math.abs(pearsonResiduals[index]!) >= 2.5
  }));
  const workingCorrelation = correlation === 'exchangeable'
    ? estimateExchangeableWorkingCorrelation(pearsonResiduals, clusterValues, weights)
    : correlation === 'ar1'
      ? estimateAr1WorkingCorrelation(pearsonResiduals, clusterValues, weights)
      : null;

  const vifByPredictor = computeVifByPredictor(rows.map((entry) => ({ x: entry.x, weight: entry.weight })), uniquePredictors);
  const vifValues = Object.values(vifByPredictor).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const maxVif = vifValues.length > 0 ? Math.max(...vifValues) : null;
  const maxPredictorCorrelation = computeMaxPredictorCorrelation(rows.map((entry) => ({ x: entry.x, weight: entry.weight })));
  const robustSeInflationMax = robustSeInflation.length > 0 ? Math.max(...robustSeInflation) : null;
  const robustSeInflationMean = robustSeInflation.length > 0
    ? robustSeInflation.reduce((total, value) => total + value, 0) / robustSeInflation.length
    : null;
  const outlierCount = pearsonResiduals.filter((value) => Math.abs(value) >= 2.5).length;
  const maxAbsPearsonResidual = pearsonResiduals.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  const devianceResidualValues = devianceResiduals.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const maxAbsDevianceResidual = devianceResidualValues.length > 0
    ? devianceResidualValues.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
    : null;
  const maxLeverage = leverageValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0);
  const maxCooksDistance = cooksValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0);
  const leverageThreshold = (2 * parameterCount) / Math.max(rows.length, 1);
  const highLeverageCount = leverageValues.filter((value) => value !== null && value > leverageThreshold).length;
  const influentialCount = cooksValues.filter((value) => value !== null && value > (4 / Math.max(rows.length, 1))).length;
  const meanAbsoluteError = scoreResiduals.reduce((total, value, index) => total + (Math.abs(value) * weights[index]!), 0) / weightedCaseCount;
  const rootMeanSquareError = Math.sqrt(
    scoreResiduals.reduce((total, value, index) => total + (weights[index]! * (value ** 2)), 0) / weightedCaseCount
  );
  const brierScore = family === 'binomial'
    ? outcomes.reduce((total, value, index) => total + (weights[index]! * ((value - predicted[index]!) ** 2)), 0) / weightedCaseCount
    : null;
  const thresholdAnalysis = family === 'binomial'
    ? (() => {
      const thresholdCandidates = Array.from({ length: 17 }, (_unused, index) => Number((0.1 + (index * 0.05)).toFixed(2)));
      if (!thresholdCandidates.includes(0.5)) thresholdCandidates.push(0.5);
      return [...new Set(thresholdCandidates)]
        .sort((left, right) => left - right)
        .map((threshold) => computeClassificationMetricsAtThreshold(predicted, outcomes, weights, threshold));
    })()
    : undefined;
  const bestByF1 = thresholdAnalysis
    ? [...thresholdAnalysis]
      .filter((item) => item.f1Score !== null)
      .sort((left, right) =>
        (right.f1Score! - left.f1Score!)
        || ((right.youdenJ ?? -Infinity) - (left.youdenJ ?? -Infinity))
        || Math.abs(left.threshold - 0.5) - Math.abs(right.threshold - 0.5))[0] ?? null
    : null;
  const bestByYouden = thresholdAnalysis
    ? [...thresholdAnalysis]
      .filter((item) => item.youdenJ !== null)
      .sort((left, right) =>
        (right.youdenJ! - left.youdenJ!)
        || ((right.f1Score ?? -Infinity) - (left.f1Score ?? -Infinity))
        || Math.abs(left.threshold - 0.5) - Math.abs(right.threshold - 0.5))[0] ?? null
    : null;
  const calibrationBins = family === 'binomial' ? buildCalibrationBins(predicted, outcomes, weights, 10) : [];
  const totalCalibrationWeight = calibrationBins.reduce((total, bin) => total + bin.weightedCount, 0);
  const meanAbsoluteCalibrationError = totalCalibrationWeight > 0
    ? calibrationBins.reduce((total, bin) => total + (Math.abs(bin.calibrationGap ?? 0) * bin.weightedCount), 0) / totalCalibrationWeight
    : null;
  const maxCalibrationGap = calibrationBins.reduce<number | null>((max, bin) => {
    if (bin.calibrationGap === null) return max;
    const absoluteGap = Math.abs(bin.calibrationGap);
    return max === null ? absoluteGap : Math.max(max, absoluteGap);
  }, null);
  const residualSummary = summarizeResidualDistribution(scoreResiduals, pearsonResiduals);
  const calibrationSlopeIntercept = family === 'binomial'
    ? computeCalibrationSlopeIntercept(predicted, outcomes, weights)
    : null;
  const rocAuc = family === 'binomial' ? computeRocAuc(predicted, outcomes, weights) : null;
  const rocAucConfidenceInterval = family === 'binomial' ? computeRocAucConfidenceInterval(predicted, outcomes, weights) : null;
  const defaultThresholdMetric = thresholdAnalysis?.find((item) => Math.abs(item.threshold - 0.5) < 1e-9) ?? null;
  const qic = (() => {
    if (quasiLikelihood === null) return null;
    try {
      const traceMatrix = multiplyMatrices(robustCovariance, information);
      const trace = traceMatrix.reduce((total, row, index) => total + (row[index] ?? 0), 0);
      return -2 * quasiLikelihood + (2 * trace);
    } catch {
      return null;
    }
  })();
  const qicu = quasiLikelihood === null ? null : (-2 * quasiLikelihood) + (2 * parameterCount);

  return {
    dependentField: dependentField.key,
    dependentLabel: dependentField.label,
    predictorFields: uniquePredictors,
    predictorLabels: predictorMeta.map((item) => item.label),
    clusterField: clusterField.key,
    clusterLabel: clusterField.label,
    family,
    link,
    correlation,
    caseCount: rows.length,
    clusterCount,
    coefficients: coefficientTable,
    observations,
    metrics: {
      weightedCaseCount,
      meanClusterSize: rows.length / clusterCount,
      minClusterSize: Math.min(...clusterSizeValues),
      maxClusterSize: Math.max(...clusterSizeValues),
      workingCorrelation,
      quasiLikelihood,
      rSquared,
      pseudoRSquared,
      modelStatistic,
      modelPValue,
      qic,
      qicu
    },
    assumptions: [
      buildAssumptionCheck(
        'cluster_count',
        'Observed clusters',
        clusterCount >= 2 ? 'pass' : 'fail',
        clusterCount,
        clusterCount >= 2 ? 'At least two clusters are present.' : 'GEE requires at least two clusters.'
      ),
      buildAssumptionCheck(
        'mean_cluster_size',
        'Mean cluster size',
        (rows.length / clusterCount) >= 3 ? 'pass' : 'warn',
        rows.length / clusterCount,
        (rows.length / clusterCount) >= 3 ? 'Average cluster size is acceptable.' : 'Average cluster size is small for stable robust covariance.'
      ),
      buildAssumptionCheck(
        'multicollinearity',
        'Multicollinearity (max VIF)',
        maxVif === null ? 'warn' : maxVif <= 5 ? 'pass' : maxVif <= 10 ? 'warn' : 'fail',
        maxVif,
        maxVif === null
          ? 'VIF could not be computed for all predictors.'
          : maxVif <= 5
            ? 'Predictors are within typical collinearity bounds.'
            : maxVif <= 10
              ? 'Moderate collinearity detected.'
              : 'High collinearity detected.'
      ),
      buildAssumptionCheck(
        'robust_se_shift',
        'Robust SE shift',
        robustSeInflationMax === null ? 'warn' : robustSeInflationMax <= 1.25 ? 'pass' : robustSeInflationMax <= 1.75 ? 'warn' : 'fail',
        robustSeInflationMax,
        robustSeInflationMax === null
          ? 'Robust-to-model standard-error inflation could not be computed.'
          : robustSeInflationMax <= 1.25
            ? 'Robust and model-based standard errors are closely aligned.'
            : robustSeInflationMax <= 1.75
              ? 'Moderate robust standard-error inflation is present.'
              : 'Large robust standard-error inflation suggests model misspecification.'
      ),
      buildAssumptionCheck(
        'influence',
        "Influence (Cook's D)",
        influentialCount === 0 ? 'pass' : influentialCount <= 2 ? 'warn' : 'fail',
        influentialCount,
        influentialCount === 0
          ? 'No highly influential rows by Cook threshold.'
          : influentialCount <= 2
            ? 'A small number of influential rows were detected.'
            : 'Multiple influential rows were detected; inspect case-level diagnostics.'
      ),
      ...(family === 'binomial'
        ? [buildAssumptionCheck(
          'discrimination',
          'Discrimination (ROC AUC)',
          rocAuc === null ? 'warn' : rocAuc >= 0.8 ? 'pass' : rocAuc >= 0.7 ? 'warn' : 'fail',
          rocAuc,
          rocAuc === null
            ? 'ROC AUC could not be computed for this binary outcome.'
            : rocAuc >= 0.8
              ? 'Discrimination is strong.'
              : rocAuc >= 0.7
                ? 'Discrimination is moderate.'
                : 'Discrimination is weak; review predictors and functional form.'
        )]
        : [])
    ],
    diagnostics: {
      weightedCaseCount,
      maxVif,
      meanVif: vifValues.length > 0 ? vifValues.reduce((total, value) => total + value, 0) / vifValues.length : null,
      maxPredictorCorrelation,
      workingCorrelation,
      minClusterSize: Math.min(...clusterSizeValues),
      maxClusterSize: Math.max(...clusterSizeValues),
      meanClusterSize: rows.length / clusterCount,
      quasiLikelihood,
      modelLogLikelihood,
      nullModelLogLikelihood,
      modelStatistic,
      modelPValue,
      outlierCount,
      maxAbsPearsonResidual,
      maxAbsDevianceResidual,
      maxLeverage,
      maxCooksDistance,
      highLeverageCount,
      influentialCount,
      robustSeInflationMax,
      robustSeInflationMean,
      meanAbsoluteError,
      rootMeanSquareError,
      brierScore,
      rocAuc,
      rocAucCiLower: rocAucConfidenceInterval?.lower ?? null,
      rocAucCiUpper: rocAucConfidenceInterval?.upper ?? null,
      calibrationIntercept: calibrationSlopeIntercept?.intercept ?? null,
      calibrationSlope: calibrationSlopeIntercept?.slope ?? null,
      meanAbsoluteCalibrationError,
      maxCalibrationGap,
      thresholdAtF1Max: bestByF1?.threshold ?? null,
      thresholdAtYoudenMax: bestByYouden?.threshold ?? null,
      threshold05Accuracy: defaultThresholdMetric?.accuracy ?? null,
      threshold05Sensitivity: defaultThresholdMetric?.recall ?? null,
      threshold05Specificity: defaultThresholdMetric?.specificity ?? null,
      threshold05Precision: defaultThresholdMetric?.precision ?? null,
      threshold05F1: defaultThresholdMetric?.f1Score ?? null,
      ...residualSummary,
      qic,
      qicu
    },
    thresholdAnalysis,
    calibration: family === 'binomial'
      ? {
        bins: calibrationBins,
        meanAbsoluteCalibrationError,
        maxCalibrationGap,
        calibrationIntercept: calibrationSlopeIntercept?.intercept ?? null,
        calibrationSlope: calibrationSlopeIntercept?.slope ?? null,
        bestThresholdByF1: bestByF1?.threshold ?? null,
        bestThresholdByYouden: bestByYouden?.threshold ?? null
      }
      : undefined,
    modelOptions: {
      maxIterations,
      tolerance,
      confidenceLevel,
      smallSampleCorrection
    },
    notes: [
      `GEE uses cluster-robust (sandwich) covariance with ${smallSampleCorrection ? 'small-sample correction enabled' : 'no small-sample correction'}.`,
      family === 'binomial'
        ? `Binomial GEE uses ${link} link with binary outcomes and robust standard errors.`
        : family === 'poisson'
          ? `Poisson GEE uses ${link} link for count outcomes with robust standard errors.`
          : `Gaussian GEE uses ${link} link with robust standard errors.`,
      correlation === 'exchangeable'
        ? 'Exchangeable working correlation is currently summarized as a scalar estimate.'
        : correlation === 'ar1'
          ? 'AR(1)-style working correlation is estimated from adjacent within-cluster residual pairs.'
          : 'Independence working correlation is used for estimating equations.'
    ]
  };
}

export function analyzeRepeatedMeasures(
  dataset: CaseDataset,
  fields: string[],
  options?: DatasetAnalysisOptions
): RepeatedMeasuresResult {
  const covarianceMatrix = (inputRows: number[][]): number[][] => {
    if (inputRows.length === 0) return [];
    const measureCountInner = inputRows[0]!.length;
    const means = Array.from({ length: measureCountInner }, (_unused, measureIndex) =>
      inputRows.reduce((total, row) => total + row[measureIndex]!, 0) / inputRows.length
    );
    return Array.from({ length: measureCountInner }, (_unused, rowIndex) =>
      Array.from({ length: measureCountInner }, (_unusedColumn, columnIndex) => {
        if (inputRows.length < 2) return 0;
        const numerator = inputRows.reduce((total, row) =>
          total + ((row[rowIndex]! - means[rowIndex]!) * (row[columnIndex]! - means[columnIndex]!)), 0);
        return numerator / (inputRows.length - 1);
      })
    );
  };
  const computeSphericity = (inputRows: number[][]): {
    mauchlyW: number | null;
    mauchlyPValue: number | null;
    greenhouseGeisserEpsilon: number | null;
    huynhFeldtEpsilon: number | null;
  } => {
    const n = inputRows.length;
    const k = inputRows[0]?.length ?? 0;
    if (k < 3 || n < 4) {
      return {
        mauchlyW: null,
        mauchlyPValue: null,
        greenhouseGeisserEpsilon: null,
        huynhFeldtEpsilon: null
      };
    }
    const covariance = covarianceMatrix(inputRows);
    const centering = Array.from({ length: k }, (_unused, rowIndex) =>
      Array.from({ length: k }, (_unusedColumn, columnIndex) =>
        (rowIndex === columnIndex ? 1 : 0) - (1 / k)
      )
    );
    let projected: number[][];
    try {
      projected = multiplyMatrices(multiplyMatrices(centering, covariance), centering);
    } catch {
      return {
        mauchlyW: null,
        mauchlyPValue: null,
        greenhouseGeisserEpsilon: null,
        huynhFeldtEpsilon: null
      };
    }
    const components: Array<{ eigenvalue: number; eigenvector: number[] }> = [];
    const working = cloneMatrix(projected);
    for (let index = 0; index < k; index += 1) {
      const component = powerIterationSymmetric(working);
      if (!(component.eigenvalue > 1e-8)) break;
      components.push(component);
      const deflated = deflateMatrix(working, outerProduct(component.eigenvector, component.eigenvalue));
      for (let rowIndex = 0; rowIndex < k; rowIndex += 1) {
        for (let columnIndex = 0; columnIndex < k; columnIndex += 1) {
          working[rowIndex]![columnIndex] = deflated[rowIndex]![columnIndex]!;
        }
      }
    }
    const eigenvalues = components
      .map((component) => component.eigenvalue)
      .filter((value) => value > 1e-8)
      .slice(0, Math.max(0, k - 1));
    if (eigenvalues.length < 2) {
      return {
        mauchlyW: null,
        mauchlyPValue: null,
        greenhouseGeisserEpsilon: null,
        huynhFeldtEpsilon: null
      };
    }
    const m = eigenvalues.length;
    const sumEigen = eigenvalues.reduce((total, value) => total + value, 0);
    const meanEigen = sumEigen / m;
    const productEigen = eigenvalues.reduce((total, value) => total * value, 1);
    const rawW = meanEigen > 0 ? productEigen / (meanEigen ** m) : null;
    const mauchlyW = rawW === null ? null : Math.max(1e-12, Math.min(1, rawW));
    const correctionU = (2 * (m ** 2) + m + 2) / (6 * m * Math.max(1, n - 1));
    const chiSquare = mauchlyW === null
      ? null
      : Math.max(0, -((n - 1) * (1 - correctionU) * Math.log(mauchlyW)));
    const sphericityDf = (m * (m + 1)) / 2 - 1;
    const mauchlyPValue = chiSquare === null ? null : chiSquarePValue(chiSquare, sphericityDf);
    const sumSquaredEigen = eigenvalues.reduce((total, value) => total + (value ** 2), 0);
    const gg = sumSquaredEigen > 0
      ? Math.max(1 / m, Math.min(1, (sumEigen ** 2) / (m * sumSquaredEigen)))
      : null;
    const hfNumerator = gg === null ? null : (n * m * gg) - 2;
    const hfDenominator = gg === null ? null : (m * (n - 1 - (m * gg)));
    const hfRaw = hfNumerator !== null && hfDenominator !== null && hfDenominator > 0
      ? hfNumerator / hfDenominator
      : null;
    const hf = hfRaw === null
      ? null
      : Math.max(gg ?? (1 / m), Math.min(1, hfRaw));
    return {
      mauchlyW,
      mauchlyPValue,
      greenhouseGeisserEpsilon: gg,
      huynhFeldtEpsilon: hf
    };
  };

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
  const sphericity = computeSphericity(rows);
  const pValue = fStatistic === null ? null : fDistributionPValue(fStatistic, dfCondition, dfError);
  const epsilonGG = sphericity.greenhouseGeisserEpsilon;
  const epsilonHF = sphericity.huynhFeldtEpsilon;
  const pValueGreenhouseGeisser = fStatistic === null || epsilonGG === null
    ? pValue
    : fDistributionPValue(
      fStatistic,
      Math.max(1e-9, dfCondition * epsilonGG),
      Math.max(1e-9, dfError * epsilonGG)
    );
  const pValueHuynhFeldt = fStatistic === null || epsilonHF === null
    ? pValue
    : fDistributionPValue(
      fStatistic,
      Math.max(1e-9, dfCondition * epsilonHF),
      Math.max(1e-9, dfError * epsilonHF)
    );

  return {
    fields: normalizedFields,
    fieldLabels: meta.map((field) => field.label),
    subjectCount: rows.length,
    measureCount,
    summaries,
    pairwiseComparisons,
    anova: {
      fStatistic,
      pValue,
      dfCondition,
      dfError,
      ssCondition,
      ssError,
      partialEtaSquared: (ssCondition + ssError) > 0 ? ssCondition / (ssCondition + ssError) : null,
      mauchlyW: sphericity.mauchlyW,
      mauchlyPValue: sphericity.mauchlyPValue,
      greenhouseGeisserEpsilon: epsilonGG,
      huynhFeldtEpsilon: epsilonHF,
      pValueGreenhouseGeisser,
      pValueHuynhFeldt
    },
    assumptions: [
      buildAssumptionCheck('complete_cases', 'Complete repeated cases', rows.length >= 2 ? 'pass' : 'fail', rows.length, 'Only rows with all selected repeated measures are included.'),
      buildAssumptionCheck(
        'sphericity',
        'Sphericity (Mauchly)',
        sphericity.mauchlyPValue === null ? 'warn' : sphericity.mauchlyPValue >= 0.05 ? 'pass' : 'warn',
        sphericity.mauchlyPValue,
        sphericity.mauchlyPValue === null
          ? 'Sphericity could not be fully evaluated for this design.'
          : sphericity.mauchlyPValue >= 0.05
            ? 'Mauchly test does not reject sphericity.'
            : 'Sphericity violation detected; use Greenhouse-Geisser or Huynh-Feldt corrected p-values.'
      )
    ],
    notes: [
      'Repeated-measures output uses complete cases across the selected measure fields.',
      'Pairwise rows are paired t-test style differences.',
      'Omnibus output includes Greenhouse-Geisser and Huynh-Feldt corrected p-values when sphericity corrections are estimable.'
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

function computeLogRankTest(
  rows: Array<{ time: number; event: boolean; groupValue: string }>,
  groupValues: string[]
): { statistic: number | null; degreesOfFreedom: number | null; pValue: number | null } {
  if (groupValues.length < 2) {
    return { statistic: null, degreesOfFreedom: null, pValue: null };
  }
  const reducedGroupCount = groupValues.length - 1;
  const observedMinusExpected = Array.from({ length: reducedGroupCount }, () => 0);
  const varianceMatrix = Array.from({ length: reducedGroupCount }, () => Array.from({ length: reducedGroupCount }, () => 0));
  const eventTimes = [...new Set(rows.filter((row) => row.event).map((row) => row.time))].sort((left, right) => left - right);

  for (const time of eventTimes) {
    const atRiskByGroup = groupValues.map((groupValue) => rows.filter((row) => row.groupValue === groupValue && row.time >= time).length);
    const eventsByGroup = groupValues.map((groupValue) => rows.filter((row) => row.groupValue === groupValue && row.time === time && row.event).length);
    const totalAtRisk = atRiskByGroup.reduce((total, value) => total + value, 0);
    const totalEvents = eventsByGroup.reduce((total, value) => total + value, 0);
    if (totalAtRisk <= 1 || totalEvents <= 0) continue;

    const covarianceFactor = (totalEvents * (totalAtRisk - totalEvents)) / (totalAtRisk ** 2 * (totalAtRisk - 1));
    for (let leftIndex = 0; leftIndex < reducedGroupCount; leftIndex += 1) {
      const atRiskLeft = atRiskByGroup[leftIndex]!;
      const observedLeft = eventsByGroup[leftIndex]!;
      const expectedLeft = (atRiskLeft * totalEvents) / totalAtRisk;
      observedMinusExpected[leftIndex] += observedLeft - expectedLeft;
      for (let rightIndex = 0; rightIndex < reducedGroupCount; rightIndex += 1) {
        const atRiskRight = atRiskByGroup[rightIndex]!;
        if (leftIndex === rightIndex) {
          varianceMatrix[leftIndex]![rightIndex] += covarianceFactor * atRiskLeft * (totalAtRisk - atRiskLeft);
        } else {
          varianceMatrix[leftIndex]![rightIndex] -= covarianceFactor * atRiskLeft * atRiskRight;
        }
      }
    }
  }

  const inverseVariance = safeInvertMatrix(varianceMatrix);
  if (!inverseVariance) {
    return { statistic: null, degreesOfFreedom: reducedGroupCount, pValue: null };
  }
  const statistic = Math.max(0, observedMinusExpected.reduce((total, leftValue, leftIndex) => {
    const rowContribution = observedMinusExpected.reduce((rowTotal, rightValue, rightIndex) =>
      rowTotal + (inverseVariance[leftIndex]![rightIndex]! * rightValue), 0);
    return total + (leftValue * rowContribution);
  }, 0));
  const degreesOfFreedom = reducedGroupCount;
  return {
    statistic,
    degreesOfFreedom,
    pValue: chiSquarePValue(statistic, degreesOfFreedom)
  };
}

function fitCoxProportionalHazards(
  rows: Array<{ time: number; event: boolean; predictors: number[] }>,
  predictorFields: string[],
  predictorLabels: string[]
): CoxResult | null {
  const eventCount = rows.filter((row) => row.event).length;
  if (rows.length < 3 || predictorFields.length === 0 || eventCount < 2) return null;
  const predictorCount = predictorFields.length;
  const means = Array.from({ length: predictorCount }, (_unused, predictorIndex) =>
    rows.reduce((total, row) => total + row.predictors[predictorIndex]!, 0) / rows.length
  );
  const stdDevs = Array.from({ length: predictorCount }, (_unused, predictorIndex) =>
    sampleStdDev(rows.map((row) => row.predictors[predictorIndex]!)) || 1
  );
  const standardizedRows = rows.map((row) => ({
    ...row,
    predictors: row.predictors.map((value, index) => (value - means[index]!) / stdDevs[index]!)
  }));
  const eventTimes = [...new Set(standardizedRows.filter((row) => row.event).map((row) => row.time))].sort((left, right) => left - right);
  let beta = new Array<number>(predictorCount).fill(0);
  let information = Array.from({ length: predictorCount }, () => Array.from({ length: predictorCount }, () => 0));
  let logLikelihood = 0;

  for (let iteration = 0; iteration < 60; iteration += 1) {
    const score = new Array<number>(predictorCount).fill(0);
    information = Array.from({ length: predictorCount }, () => Array.from({ length: predictorCount }, () => 0));
    logLikelihood = 0;
    for (const eventTime of eventTimes) {
      const eventRows = standardizedRows.filter((row) => row.event && row.time === eventTime);
      const d = eventRows.length;
      if (d === 0) continue;
      const riskRows = standardizedRows.filter((row) => row.time >= eventTime);
      let riskSum = 0;
      const weightedX = new Array<number>(predictorCount).fill(0);
      const weightedXX = Array.from({ length: predictorCount }, () => Array.from({ length: predictorCount }, () => 0));
      for (const riskRow of riskRows) {
        const eta = beta.reduce((total, coefficient, index) => total + (coefficient * riskRow.predictors[index]!), 0);
        const expEta = Math.exp(Math.max(-20, Math.min(20, eta)));
        riskSum += expEta;
        for (let left = 0; left < predictorCount; left += 1) {
          weightedX[left] += expEta * riskRow.predictors[left]!;
          for (let right = 0; right < predictorCount; right += 1) {
            weightedXX[left]![right] += expEta * riskRow.predictors[left]! * riskRow.predictors[right]!;
          }
        }
      }
      if (!(riskSum > 0)) continue;
      const meanX = weightedX.map((value) => value / riskSum);
      for (const eventRow of eventRows) {
        for (let index = 0; index < predictorCount; index += 1) {
          score[index] += eventRow.predictors[index]!;
        }
        const eta = beta.reduce((total, coefficient, index) => total + (coefficient * eventRow.predictors[index]!), 0);
        logLikelihood += eta;
      }
      logLikelihood -= d * Math.log(riskSum);
      for (let index = 0; index < predictorCount; index += 1) {
        score[index] -= d * meanX[index]!;
      }
      for (let left = 0; left < predictorCount; left += 1) {
        for (let right = 0; right < predictorCount; right += 1) {
          information[left]![right] += d * ((weightedXX[left]![right]! / riskSum) - (meanX[left]! * meanX[right]!));
        }
      }
    }
    const step = solveLinearSystem(information, score);
    const maxDelta = step.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    beta = beta.map((value, index) => value + (step[index] ?? 0));
    if (maxDelta < 1e-6) break;
  }

  const inverseInformation = safeInvertMatrix(information);
  if (!inverseInformation) return null;
  const standardizedLinearPredictors = standardizedRows.map((row) =>
    beta.reduce((total, coefficient, index) => total + (coefficient * row.predictors[index]!), 0)
  );
  const coefficients: CoxCoefficient[] = beta.map((coefficient, index) => {
    const standardizedSe = Math.sqrt(Math.max(0, inverseInformation[index]![index]!));
    const scale = stdDevs[index]!;
    const originalCoefficient = scale > 0 ? coefficient / scale : coefficient;
    const originalSe = scale > 0 ? standardizedSe / scale : standardizedSe;
    const statistic = originalSe > 0 ? originalCoefficient / originalSe : null;
    return {
      field: predictorFields[index]!,
      label: predictorLabels[index]!,
      termType: 'predictor',
      termField: predictorFields[index]!,
      coefficient: originalCoefficient,
      standardError: originalSe,
      statistic,
      pValue: statistic === null ? null : normalTwoSidedPValue(statistic),
      confidenceInterval: originalSe > 0
        ? {
          level: 0.95,
          lower: originalCoefficient - (1.959963984540054 * originalSe),
          upper: originalCoefficient + (1.959963984540054 * originalSe)
        }
        : null,
      oddsRatio: Math.exp(originalCoefficient)
    };
  });

  const baselineHazard: CoxResult['baselineHazard'] = [];
  let cumulativeHazard = 0;
  for (const eventTime of eventTimes) {
    const eventRows = standardizedRows.filter((row) => row.event && row.time === eventTime);
    const d = eventRows.length;
    if (d === 0) continue;
    const riskSet = standardizedRows
      .map((row, rowIndex) => ({ row, linearPredictor: standardizedLinearPredictors[rowIndex]! }))
      .filter((item) => item.row.time >= eventTime);
    const riskSum = riskSet.reduce((total, item) => total + Math.exp(Math.max(-20, Math.min(20, item.linearPredictor))), 0);
    if (!(riskSum > 0)) continue;
    const hazardIncrement = d / riskSum;
    cumulativeHazard += hazardIncrement;
    baselineHazard.push({
      time: eventTime,
      events: d,
      riskSetCount: riskSet.length,
      hazardIncrement,
      cumulativeHazard,
      baselineSurvival: Math.exp(-cumulativeHazard)
    });
  }

  const nullLogLikelihood = (() => {
    let value = 0;
    for (const eventTime of eventTimes) {
      const d = standardizedRows.filter((row) => row.event && row.time === eventTime).length;
      if (d === 0) continue;
      const riskCount = standardizedRows.filter((row) => row.time >= eventTime).length;
      if (riskCount <= 0) continue;
      value -= d * Math.log(riskCount);
    }
    return value;
  })();
  const likelihoodRatioChiSquare = 2 * (logLikelihood - nullLogLikelihood);
  const likelihoodRatioPValue = chiSquarePValue(likelihoodRatioChiSquare, predictorCount);

  let concordant = 0;
  let discordant = 0;
  let ties = 0;
  for (let left = 0; left < standardizedRows.length; left += 1) {
    for (let right = left + 1; right < standardizedRows.length; right += 1) {
      const rowLeft = standardizedRows[left]!;
      const rowRight = standardizedRows[right]!;
      if (rowLeft.time === rowRight.time) continue;
      let earlyIndex: number | null = null;
      let lateIndex: number | null = null;
      if (rowLeft.time < rowRight.time && rowLeft.event) {
        earlyIndex = left;
        lateIndex = right;
      } else if (rowRight.time < rowLeft.time && rowRight.event) {
        earlyIndex = right;
        lateIndex = left;
      }
      if (earlyIndex === null || lateIndex === null) continue;
      const earlyRisk = standardizedLinearPredictors[earlyIndex]!;
      const lateRisk = standardizedLinearPredictors[lateIndex]!;
      if (earlyRisk > lateRisk) concordant += 1;
      else if (earlyRisk < lateRisk) discordant += 1;
      else ties += 1;
    }
  }
  const comparable = concordant + discordant + ties;
  const concordance = comparable > 0 ? (concordant + (0.5 * ties)) / comparable : null;

  return {
    predictorFields,
    predictorLabels,
    coefficients,
    baselineHazard,
    concordance,
    logLikelihood,
    nullLogLikelihood,
    likelihoodRatioChiSquare,
    likelihoodRatioPValue,
    notes: [
      'Cox proportional hazards estimates use Breslow handling for ties.',
      'Hazard ratios are reported as exp(beta) for each predictor.',
      'Baseline hazard/survival is estimated from event-time risk sets.'
    ]
  };
}

export function analyzeSurvivalAnalysis(
  dataset: CaseDataset,
  timeFieldKey: string,
  eventFieldKey: string,
  groupFieldKey?: string,
  options?: DatasetAnalysisOptions,
  predictorFields: string[] = [],
  settings?: SurvivalAnalysisSettings
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
  const normalizedPredictors = [...new Set(predictorFields.map((field) => field.trim()).filter(Boolean))]
    .filter((field) => field !== timeFieldKey && field !== eventFieldKey && field !== normalizedGroupField);
  const predictorMeta = normalizedPredictors.map((field) => requireDatasetField(dataset, field, 'survival predictor'));
  const requiredFields = [timeFieldKey, eventFieldKey, normalizedGroupField, ...normalizedPredictors].filter(Boolean);
  const rows = analysisRows(dataset, requiredFields, options)
    .map(({ row }, index) => ({
      caseId: typeof row.case_id === 'string' ? row.case_id : null,
      caseLabel: typeof row.case_label === 'string' ? row.case_label : null,
      time: parseTimeValue(row[timeFieldKey] ?? null, index),
      event: isSurvivalEvent(row[eventFieldKey] ?? null),
      groupValue: groupField ? formatValue(row[normalizedGroupField] ?? null) : 'All cases',
      predictors: normalizedPredictors.map((field) => row[field])
    }))
    .filter((entry): entry is { caseId: string | null; caseLabel: string | null; time: number; event: boolean; groupValue: string; predictors: DatasetValue[] } =>
      entry.time !== null && Number.isFinite(entry.time) && entry.time >= 0 && Boolean(entry.groupValue)
    );

  if (rows.length < 2) {
    throw new Error('Kaplan-Meier survival analysis requires at least two usable time/event rows.');
  }
  const confidenceLevel = Math.min(0.99, Math.max(0.8, settings?.confidenceLevel ?? 0.95));
  const zCritical = inverseNormalCdf(1 - ((1 - confidenceLevel) / 2));
  const tieMethod: 'breslow' | 'efron' = settings?.tieMethod === 'efron' ? 'efron' : 'breslow';

  const groupValues = [...new Set(rows.map((row) => row.groupValue))].sort((left, right) => left.localeCompare(right));
  const steps: SurvivalStep[] = [];
  const groups: SurvivalGroupSummary[] = [];
  for (const groupValue of groupValues) {
    const groupRows = rows.filter((row) => row.groupValue === groupValue).sort((left, right) => left.time - right.time);
    const times = [...new Set(groupRows.map((row) => row.time))].sort((left, right) => left - right);
    let survival = 1;
    let medianSurvival: number | null = null;
    let greenwoodComponent = 0;
    for (const time of times) {
      const atRisk = groupRows.filter((row) => row.time >= time).length;
      const events = groupRows.filter((row) => row.time === time && row.event).length;
      const censored = groupRows.filter((row) => row.time === time && !row.event).length;
      if (atRisk > 0 && events > 0) {
        survival *= (1 - (events / atRisk));
        if (atRisk - events > 0) {
          greenwoodComponent += events / (atRisk * (atRisk - events));
        }
      }
      const standardError = Math.sqrt(Math.max(0, (survival ** 2) * greenwoodComponent));
      const confidenceLower = Math.max(0, survival - (zCritical * standardError));
      const confidenceUpper = Math.min(1, survival + (zCritical * standardError));
      if (medianSurvival === null && survival <= 0.5) {
        medianSurvival = time;
      }
      steps.push({
        groupValue,
        time,
        atRisk,
        events,
        censored,
        survival,
        standardError,
        confidenceLower,
        confidenceUpper
      });
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
  const totalEvents = groups.reduce((total, group) => total + group.eventCount, 0);
  const totalCensored = groups.reduce((total, group) => total + group.censoredCount, 0);
  const observedTimes = rows.map((row) => row.time).sort((left, right) => left - right);
  const minObservedTime = observedTimes.length > 0 ? observedTimes[0]! : null;
  const maxObservedTime = rows.reduce((max, row) => Math.max(max, row.time), 0);
  const medianObservedTime = percentile(observedTimes, 0.5);
  const logRank = computeLogRankTest(rows, groupValues);
  const coxRows = normalizedPredictors.length > 0
    ? rows
      .filter((row) => row.predictors.every((value) => typeof value === 'number'))
      .map((row) => ({
        time: row.time,
        event: row.event,
        predictors: row.predictors as number[]
      }))
    : [];
  const cox = coxRows.length > 0
    ? fitCoxProportionalHazards(coxRows, normalizedPredictors, predictorMeta.map((item) => item.label))
    : null;
  const coxDiagnostics: Record<string, number | null> = {
    coxConcordance: cox?.concordance ?? null,
    coxLogLikelihood: cox?.logLikelihood ?? null,
    coxNullLogLikelihood: cox?.nullLogLikelihood ?? null,
    coxLikelihoodRatioChiSquare: cox?.likelihoodRatioChiSquare ?? null,
    coxLikelihoodRatioPValue: cox?.likelihoodRatioPValue ?? null
  };
  const candidateLandmarkTimes = (settings?.landmarkTimes ?? [])
    .filter((value) => Number.isFinite(value))
    .map((value) => Number(value))
    .filter((value) => value >= 0);
  const defaultLandmarkTimes = [0.25, 0.5, 0.75]
    .map((fraction) => maxObservedTime * fraction)
    .filter((value) => value > 0);
  const landmarkTimes = [...new Set((candidateLandmarkTimes.length > 0 ? candidateLandmarkTimes : defaultLandmarkTimes)
    .map((value) => Math.round(value * 1000) / 1000))]
    .sort((left, right) => left - right);
  const landmarkSurvival: SurvivalAnalysisResult['landmarkSurvival'] = [];
  for (const groupValue of groupValues) {
    const groupSteps = steps
      .filter((step) => step.groupValue === groupValue)
      .sort((left, right) => left.time - right.time);
    for (const time of landmarkTimes) {
      const upto = groupSteps.filter((step) => step.time <= time);
      const latest = upto.length > 0 ? upto[upto.length - 1]! : null;
      landmarkSurvival.push({
        groupValue,
        time,
        survival: latest?.survival ?? null
      });
    }
  }
  const rmstTau = landmarkTimes.length > 0 ? landmarkTimes[landmarkTimes.length - 1]! : maxObservedTime;
  const restrictedMeanSurvival: SurvivalAnalysisResult['restrictedMeanSurvival'] = groupValues.map((groupValue) => {
    const groupSteps = steps
      .filter((step) => step.groupValue === groupValue)
      .sort((left, right) => left.time - right.time);
    if (groupSteps.length === 0 || rmstTau <= 0) {
      return { groupValue, rmst: null, tau: rmstTau };
    }
    let area = 0;
    let lastTime = 0;
    let lastSurvival = 1;
    for (const step of groupSteps) {
      const upper = Math.min(step.time, rmstTau);
      if (upper > lastTime) {
        area += (upper - lastTime) * lastSurvival;
      }
      if (step.time >= rmstTau) {
        lastTime = rmstTau;
        break;
      }
      lastTime = step.time;
      lastSurvival = step.survival;
    }
    if (lastTime < rmstTau) {
      area += (rmstTau - lastTime) * lastSurvival;
    }
    return {
      groupValue,
      rmst: area,
      tau: rmstTau
    };
  });
  const proportionalHazardsDiagnostics: SurvivalAnalysisResult['proportionalHazardsDiagnostics'] = cox
    ? normalizedPredictors.map((field, predictorIndex) => {
      const label = predictorMeta[predictorIndex]?.label ?? field;
      const beta = cox.coefficients.find((coefficient) => coefficient.termField === field)?.coefficient ?? null;
      if (beta === null) {
        return { field, label, schoenfeldCorrelation: null, pValue: null };
      }
      const times: number[] = [];
      const residuals: number[] = [];
      for (const eventRow of coxRows.filter((row) => row.event)) {
        const riskSet = coxRows.filter((row) => row.time >= eventRow.time);
        if (riskSet.length === 0) continue;
        const weighted = riskSet.map((riskRow) => {
          const linear = riskRow.predictors.reduce((total, value, index) => {
            const coefficient = cox.coefficients.find((item) => item.termField === normalizedPredictors[index])?.coefficient ?? 0;
            return total + (coefficient * value);
          }, 0);
          return {
            value: riskRow.predictors[predictorIndex]!,
            weight: Math.exp(Math.max(-20, Math.min(20, linear)))
          };
        });
        const weightTotal = weighted.reduce((total, item) => total + item.weight, 0);
        if (!(weightTotal > 0)) continue;
        const expected = weighted.reduce((total, item) => total + (item.value * item.weight), 0) / weightTotal;
        times.push(eventRow.time);
        residuals.push(eventRow.predictors[predictorIndex]! - expected);
      }
      const schoenfeldCorrelation = times.length > 2 ? pearsonCorrelation(times, residuals) : null;
      const pValue = schoenfeldCorrelation !== null && times.length > 2
        ? (() => {
          const denominator = Math.max(1e-12, 1 - (schoenfeldCorrelation ** 2));
          const statistic = schoenfeldCorrelation * Math.sqrt((times.length - 2) / denominator);
          return studentTPValue(statistic, times.length - 2);
        })()
        : null;
      return {
        field,
        label,
        schoenfeldCorrelation,
        pValue
      };
    })
    : [];
  const modelSelection: SurvivalAnalysisResult['modelSelection'] = [];
  if (cox) {
    const predictorCount = normalizedPredictors.length;
    modelSelection.push({
      model: 'cox_null',
      logLikelihood: cox.nullLogLikelihood,
      aic: cox.nullLogLikelihood === null ? null : (-2 * cox.nullLogLikelihood),
      bic: cox.nullLogLikelihood === null ? null : (-2 * cox.nullLogLikelihood)
    });
    modelSelection.push({
      model: predictorCount > 0 ? `cox_full_${predictorCount}predictor` : 'cox_full',
      logLikelihood: cox.logLikelihood,
      aic: cox.logLikelihood === null ? null : (-2 * cox.logLikelihood) + (2 * predictorCount),
      bic: cox.logLikelihood === null ? null : (-2 * cox.logLikelihood) + (predictorCount * Math.log(Math.max(2, coxRows.length)))
    });
  } else {
    modelSelection.push({
      model: 'kaplan_meier_only',
      logLikelihood: null,
      aic: null,
      bic: null
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
    landmarkSurvival,
    restrictedMeanSurvival,
    diagnostics: {
      groupCount: groups.length,
      totalEvents,
      totalCensored,
      eventRate: rows.length > 0 ? totalEvents / rows.length : null,
      censoringRate: rows.length > 0 ? totalCensored / rows.length : null,
      minObservedTime,
      medianObservedTime,
      maxObservedTime,
      logRankStatistic: logRank.statistic,
      logRankDegreesOfFreedom: logRank.degreesOfFreedom,
      logRankPValue: logRank.pValue,
      ...coxDiagnostics
    },
    cox,
    proportionalHazardsDiagnostics,
    modelSelection,
    options: {
      confidenceLevel,
      tieMethod,
      landmarkTimes
    },
    notes: [
      'Survival output uses Kaplan-Meier product-limit estimates.',
      'Event values are treated as true for 1/true/yes/event/death style values and false for 0/false/no/censored/alive style values.',
      `Confidence intervals use ${(confidenceLevel * 100).toFixed(1)}% coverage.`,
      tieMethod === 'efron'
        ? 'Efron tie-handling was requested; Cox estimation currently uses a Breslow-style tie approximation.'
        : 'Cox estimation uses Breslow tie handling.',
      groupField
        ? 'Grouped output includes a log-rank test for between-group curve differences.'
        : 'No grouping variable was provided; log-rank comparison is omitted.',
      normalizedPredictors.length > 0
        ? cox
          ? `Cox proportional hazards model fit with predictors: ${predictorMeta.map((item) => item.label).join(', ')}.`
          : 'Cox model predictors were provided but a stable model could not be estimated from usable event rows.'
        : 'No Cox predictors were selected; Cox model output is omitted.'
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
  options: ComplexSamplesOptions = {}
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
  const varianceEstimator: 'linearization' | 'replicate' = options.varianceEstimator === 'replicate' ? 'replicate' : 'linearization';
  const replicateWeightFields = [...new Set((options.replicateWeightFields ?? [])
    .map((field) => String(field ?? '').trim())
    .filter(Boolean)
    .filter((field) => field !== targetFieldKey))];
  const finitePopulationCorrectionField = typeof options.finitePopulationCorrectionField === 'string' && options.finitePopulationCorrectionField.trim()
    ? options.finitePopulationCorrectionField.trim()
    : '';
  if (finitePopulationCorrectionField) {
    requireDatasetField(dataset, finitePopulationCorrectionField, 'complex-samples finite population correction');
  }
  replicateWeightFields.forEach((field) => {
    requireDatasetField(dataset, field, 'complex-samples replicate weight');
  });
  const requiredFields = [
    targetFieldKey,
    strataFieldKey,
    clusterFieldKey,
    groupFieldKey,
    finitePopulationCorrectionField,
    ...replicateWeightFields
  ].filter(Boolean);
  const preparedRows = analysisRows(dataset, requiredFields, normalizedOptions)
    .map(({ row, weight }) => ({
      target: row[targetFieldKey] ?? null,
      strata: strataFieldKey ? formatValue(row[strataFieldKey] ?? null) : null,
      cluster: clusterFieldKey ? formatValue(row[clusterFieldKey] ?? null) : null,
      domain: groupFieldKey ? formatValue(row[groupFieldKey] ?? null) : 'All cases',
      weight,
      fpc: finitePopulationCorrectionField ? row[finitePopulationCorrectionField] : null,
      replicateWeights: Object.fromEntries(replicateWeightFields.map((field) => [field, row[field] ?? null])) as Record<string, DatasetValue>
    }))
    .filter((entry) => entry.target !== null && entry.weight > 0 && Boolean(entry.domain));

  if (preparedRows.length < 2) {
    throw new Error('Complex samples analysis requires at least two usable rows.');
  }

  const numericTarget = preparedRows.every((entry) => typeof entry.target === 'number');
  const statistic = numericTarget ? 'mean' : 'proportion';
  const domains = [...new Set(preparedRows.map((row) => row.domain))].sort((left, right) => left.localeCompare(right));
  const applyFinitePopulationCorrection = (standardError: number | null, domainRows: typeof preparedRows): number | null => {
    if (!(standardError !== null && Number.isFinite(standardError))) return standardError;
    if (!finitePopulationCorrectionField) return standardError;
    const numericFpc = domainRows
      .map((row) => Number(row.fpc))
      .filter((value) => Number.isFinite(value) && value > 1);
    if (numericFpc.length === 0) return standardError;
    const populationSize = numericFpc.reduce((total, value) => total + value, 0) / numericFpc.length;
    const sampleSize = domainRows.length;
    if (!(populationSize > sampleSize)) return standardError;
    const correction = Math.sqrt((populationSize - sampleSize) / Math.max(1, populationSize - 1));
    return standardError * correction;
  };
  const estimateReplicateStandardError = (
    domainRows: typeof preparedRows,
    estimator: (weights: number[]) => number | null
  ): number | null => {
    if (varianceEstimator !== 'replicate' || replicateWeightFields.length === 0) return null;
    const replicateEstimates = replicateWeightFields
      .map((field) => estimator(domainRows.map((row) => {
        const value = Number(row.replicateWeights[field]);
        return Number.isFinite(value) && value > 0 ? value : 0;
      })))
      .filter((value): value is number => value !== null && Number.isFinite(value));
    if (replicateEstimates.length < 2) return null;
    const meanEstimate = replicateEstimates.reduce((total, value) => total + value, 0) / replicateEstimates.length;
    const variance = ((replicateEstimates.length - 1) / replicateEstimates.length)
      * (replicateEstimates.reduce((total, value) => total + ((value - meanEstimate) ** 2), 0));
    return Math.sqrt(Math.max(0, variance));
  };
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
      const replicateSe = estimateReplicateStandardError(domainRows, (replicateWeights) => weightedMean(values, replicateWeights));
      const baseStandardError = replicateSe ?? clusterSe ?? simpleSe;
      const standardError = applyFinitePopulationCorrection(baseStandardError, domainRows);
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
        const replicateSe = estimateReplicateStandardError(domainRows, (replicateWeights) => weightedMean(indicators, replicateWeights));
        const baseStandardError = replicateSe ?? clusterSe ?? simpleSe;
        const standardError = applyFinitePopulationCorrection(baseStandardError, domainRows);
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
      weightedCaseCount: preparedRows.reduce((total, row) => total + row.weight, 0),
      varianceEstimator,
      replicateWeightCount: replicateWeightFields.length,
      finitePopulationCorrectionField: finitePopulationCorrectionField || null
    },
    estimates,
    modelOptions: {
      varianceEstimator,
      replicateWeightFields,
      finitePopulationCorrectionField: finitePopulationCorrectionField || null
    },
    notes: [
      varianceEstimator === 'replicate'
        ? `Variance estimator uses replicate weights (${replicateWeightFields.length} replicate field${replicateWeightFields.length === 1 ? '' : 's'}).`
        : 'Variance estimator uses linearization with optional cluster-based standard-error inflation.',
      'If a cluster field is selected, standard errors use cluster-level estimate variation when replicate weights are not requested.',
      finitePopulationCorrectionField
        ? `Finite population correction was applied from ${finitePopulationCorrectionField}.`
        : 'Finite population correction is not applied for this run.'
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
  options?: DatasetAnalysisOptions,
  modelOptions: NeuralNetworkOptions = {}
): NeuralNetworkResult {
  const uniquePredictors = [...new Set(predictorFields.map((field) => field.trim()).filter(Boolean))]
    .filter((field) => field !== targetFieldKey);
  if (uniquePredictors.length === 0) {
    throw new Error('Neural network requires at least one predictor field.');
  }
  const configuredHiddenUnits = Math.min(64, Math.max(2, Math.floor(modelOptions.hiddenUnits ?? hiddenUnits)));
  const learningRate = Math.max(1e-5, Math.min(1, modelOptions.learningRate ?? 0.03));
  const epochs = Math.max(25, Math.min(2000, Math.floor(modelOptions.epochs ?? 300)));
  const l2Penalty = Math.max(0, Math.min(10, modelOptions.l2Penalty ?? 0.0005));
  const validationSplit = Math.max(0, Math.min(0.45, modelOptions.validationSplit ?? 0.2));
  const seed = Number.isFinite(modelOptions.seed ?? Number.NaN) ? Number(modelOptions.seed) : 424242;
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

  const means = uniquePredictors.map((_field, index) => rows.reduce((total, row) => total + row.predictors[index]!, 0) / rows.length);
  const stdDevs = uniquePredictors.map((_field, index) => sampleStdDev(rows.map((row) => row.predictors[index]!)) || 1);
  const standardizedInputs = rows.map((row) => row.predictors.map((value, index) => (value - means[index]!) / stdDevs[index]!));
  const rng = seededRandom(seed);
  const shuffledIndices = Array.from({ length: rows.length }, (_unused, index) => index);
  for (let index = shuffledIndices.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [shuffledIndices[index], shuffledIndices[swap]] = [shuffledIndices[swap]!, shuffledIndices[index]!];
  }
  const validationCount = Math.min(rows.length - 1, Math.max(0, Math.floor(rows.length * validationSplit)));
  const validationIndexSet = new Set<number>(shuffledIndices.slice(0, validationCount));
  const trainIndices = shuffledIndices.filter((index) => !validationIndexSet.has(index));
  const validIndices = shuffledIndices.filter((index) => validationIndexSet.has(index));

  const inputCount = uniquePredictors.length;
  const hiddenCount = configuredHiddenUnits;
  const initScaleInput = Math.sqrt(2 / Math.max(1, inputCount + hiddenCount));
  const initializeMatrix = (rowCount: number, columnCount: number, scale: number): number[][] =>
    Array.from({ length: rowCount }, () =>
      Array.from({ length: columnCount }, () => ((rng() * 2) - 1) * scale)
    );
  const W1 = initializeMatrix(hiddenCount, inputCount, initScaleInput);
  const b1 = new Array<number>(hiddenCount).fill(0);
  const computeHidden = (input: number[]): { z: number[]; h: number[] } => {
    const z = W1.map((weights, hiddenIndex) =>
      b1[hiddenIndex]! + weights.reduce((total, weight, inputIndex) => total + (weight * input[inputIndex]!), 0)
    );
    const h = z.map((value) => Math.tanh(value));
    return { z, h };
  };
  const softmax = (values: number[]): number[] => {
    const max = Math.max(...values);
    const exps = values.map((value) => Math.exp(value - max));
    const sum = exps.reduce((total, value) => total + value, 0) || 1;
    return exps.map((value) => value / sum);
  };
  const safeLog = (value: number): number => Math.log(Math.max(1e-12, value));
  const computeR2 = (actual: number[], predicted: number[]): number | null => {
    if (actual.length === 0 || predicted.length !== actual.length) return null;
    const mean = actual.reduce((total, value) => total + value, 0) / actual.length;
    const ssTotal = actual.reduce((total, value) => total + ((value - mean) ** 2), 0);
    const ssResidual = actual.reduce((total, value, index) => total + ((value - predicted[index]!) ** 2), 0);
    return ssTotal === 0 ? 1 : 1 - (ssResidual / ssTotal);
  };

  if (task === 'classification') {
    const classes = uniqueFormattedLevels(rows.map((row) => row.target));
    if (classes.length < 2) {
      throw new Error('Classification neural network requires at least two target classes.');
    }
    const classByValue = new Map(classes.map((value, index) => [value, index]));
    const yIndices = rows.map((row) => classByValue.get(formatValue(row.target)) ?? 0);
    const classCount = classes.length;
    const initScaleOutput = Math.sqrt(2 / Math.max(1, hiddenCount + classCount));
    const W2 = initializeMatrix(classCount, hiddenCount, initScaleOutput);
    const b2 = new Array<number>(classCount).fill(0);
    let finalTrainingLoss: number | null = null;
    let finalValidationLoss: number | null = null;

    for (let epoch = 0; epoch < epochs; epoch += 1) {
      const gradW1 = Array.from({ length: hiddenCount }, () => new Array<number>(inputCount).fill(0));
      const gradb1 = new Array<number>(hiddenCount).fill(0);
      const gradW2 = Array.from({ length: classCount }, () => new Array<number>(hiddenCount).fill(0));
      const gradb2 = new Array<number>(classCount).fill(0);
      let loss = 0;

      for (const rowIndex of trainIndices) {
        const input = standardizedInputs[rowIndex]!;
        const { h } = computeHidden(input);
        const logits = W2.map((weights, classIndex) =>
          b2[classIndex]! + weights.reduce((total, weight, hiddenIndex) => total + (weight * h[hiddenIndex]!), 0)
        );
        const probabilities = softmax(logits);
        const yClass = yIndices[rowIndex] ?? 0;
        loss += -safeLog(probabilities[yClass] ?? 1e-12);
        const dLogits = probabilities.map((value, classIndex) => value - (classIndex === yClass ? 1 : 0));
        for (let classIndex = 0; classIndex < classCount; classIndex += 1) {
          gradb2[classIndex] += dLogits[classIndex]!;
          for (let hiddenIndex = 0; hiddenIndex < hiddenCount; hiddenIndex += 1) {
            gradW2[classIndex]![hiddenIndex] += dLogits[classIndex]! * h[hiddenIndex]!;
          }
        }
        for (let hiddenIndex = 0; hiddenIndex < hiddenCount; hiddenIndex += 1) {
          let dHidden = 0;
          for (let classIndex = 0; classIndex < classCount; classIndex += 1) {
            dHidden += dLogits[classIndex]! * W2[classIndex]![hiddenIndex]!;
          }
          const dZ = dHidden * (1 - (h[hiddenIndex]! ** 2));
          gradb1[hiddenIndex] += dZ;
          for (let inputIndex = 0; inputIndex < inputCount; inputIndex += 1) {
            gradW1[hiddenIndex]![inputIndex] += dZ * input[inputIndex]!;
          }
        }
      }

      const batchScale = 1 / Math.max(1, trainIndices.length);
      for (let hiddenIndex = 0; hiddenIndex < hiddenCount; hiddenIndex += 1) {
        b1[hiddenIndex] -= learningRate * gradb1[hiddenIndex]! * batchScale;
        for (let inputIndex = 0; inputIndex < inputCount; inputIndex += 1) {
          const grad = (gradW1[hiddenIndex]![inputIndex]! * batchScale) + (2 * l2Penalty * W1[hiddenIndex]![inputIndex]!);
          W1[hiddenIndex]![inputIndex] -= learningRate * grad;
        }
      }
      for (let classIndex = 0; classIndex < classCount; classIndex += 1) {
        b2[classIndex] -= learningRate * gradb2[classIndex]! * batchScale;
        for (let hiddenIndex = 0; hiddenIndex < hiddenCount; hiddenIndex += 1) {
          const grad = (gradW2[classIndex]![hiddenIndex]! * batchScale) + (2 * l2Penalty * W2[classIndex]![hiddenIndex]!);
          W2[classIndex]![hiddenIndex] -= learningRate * grad;
        }
      }

      if (epoch === epochs - 1) {
        finalTrainingLoss = loss / Math.max(1, trainIndices.length);
      }
    }

    const predictClass = (rowIndex: number): { predictedIndex: number; probabilities: number[] } => {
      const input = standardizedInputs[rowIndex]!;
      const { h } = computeHidden(input);
      const logits = W2.map((weights, classIndex) =>
        b2[classIndex]! + weights.reduce((total, weight, hiddenIndex) => total + (weight * h[hiddenIndex]!), 0)
      );
      const probabilities = softmax(logits);
      const predictedIndex = probabilities.indexOf(Math.max(...probabilities));
      return { predictedIndex, probabilities };
    };
    if (validIndices.length > 0) {
      const validationLoss = validIndices.reduce((total, rowIndex) => {
        const { probabilities } = predictClass(rowIndex);
        return total - safeLog(probabilities[yIndices[rowIndex] ?? 0] ?? 1e-12);
      }, 0);
      finalValidationLoss = validationLoss / validIndices.length;
    }
    const predictions = rows.map((row, rowIndex) => {
      const prediction = predictClass(rowIndex);
      return {
        caseId: row.caseId,
        caseLabel: row.caseLabel,
        actual: formatValue(row.target),
        predicted: classes[prediction.predictedIndex] ?? classes[0]!
      };
    });
    const correct = predictions.filter((prediction) => prediction.actual === prediction.predicted).length;
    const validationAccuracy = validIndices.length > 0
      ? validIndices.filter((rowIndex) => {
        const { predictedIndex } = predictClass(rowIndex);
        return predictedIndex === (yIndices[rowIndex] ?? 0);
      }).length / validIndices.length
      : null;
    const confusionCounts = new Map<string, number>();
    for (const prediction of predictions) {
      const key = `${prediction.actual}::${prediction.predicted}`;
      confusionCounts.set(key, (confusionCounts.get(key) ?? 0) + 1);
    }
    const featureImportance = uniquePredictors.map((field, inputIndex) => {
      const importance = W1.reduce((total, hiddenWeights, hiddenIndex) => {
        const downstream = W2.reduce((sum, output) => sum + Math.abs(output[hiddenIndex] ?? 0), 0);
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
      hiddenUnits: configuredHiddenUnits,
      metrics: {
        accuracy: rows.length > 0 ? correct / rows.length : null,
        validationAccuracy,
        trainingLoss: finalTrainingLoss,
        validationLoss: finalValidationLoss
      },
      featureImportance,
      classes,
      confusionMatrix: [...confusionCounts.entries()].map(([key, count]) => {
        const [actual, predicted] = key.split('::');
        return { actual: actual ?? '', predicted: predicted ?? '', count };
      }),
      predictions: predictions.slice(0, 100),
      notes: [
        `One-hidden-layer MLP trained with full-batch gradient descent for ${epochs} epoch(s).`,
        `Learning rate ${learningRate}, L2 ${l2Penalty}, validation split ${(validationSplit * 100).toFixed(1)}%.`
      ]
    };
  }

  const numericRows = rows.filter((row): row is typeof rows[number] & { target: number } => typeof row.target === 'number');
  if (numericRows.length !== rows.length || numericRows.length < Math.max(4, uniquePredictors.length + 2)) {
    throw new Error('Regression neural network requires a numeric target field and enough complete rows.');
  }
  const regressionTargets = numericRows.map((row) => row.target);
  const W2 = initializeMatrix(1, hiddenCount, Math.sqrt(2 / Math.max(1, hiddenCount + 1)))[0]!;
  let b2 = 0;
  let finalTrainingLoss: number | null = null;
  let finalValidationLoss: number | null = null;
  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const gradW1 = Array.from({ length: hiddenCount }, () => new Array<number>(inputCount).fill(0));
    const gradb1 = new Array<number>(hiddenCount).fill(0);
    const gradW2 = new Array<number>(hiddenCount).fill(0);
    let gradb2 = 0;
    let loss = 0;
    for (const rowIndex of trainIndices) {
      const input = standardizedInputs[rowIndex]!;
      const target = regressionTargets[rowIndex]!;
      const { h } = computeHidden(input);
      const predicted = b2 + W2.reduce((total, weight, hiddenIndex) => total + (weight * h[hiddenIndex]!), 0);
      const error = predicted - target;
      loss += 0.5 * (error ** 2);
      gradb2 += error;
      for (let hiddenIndex = 0; hiddenIndex < hiddenCount; hiddenIndex += 1) {
        gradW2[hiddenIndex] += error * h[hiddenIndex]!;
      }
      for (let hiddenIndex = 0; hiddenIndex < hiddenCount; hiddenIndex += 1) {
        const dHidden = error * W2[hiddenIndex]!;
        const dZ = dHidden * (1 - (h[hiddenIndex]! ** 2));
        gradb1[hiddenIndex] += dZ;
        for (let inputIndex = 0; inputIndex < inputCount; inputIndex += 1) {
          gradW1[hiddenIndex]![inputIndex] += dZ * input[inputIndex]!;
        }
      }
    }
    const batchScale = 1 / Math.max(1, trainIndices.length);
    for (let hiddenIndex = 0; hiddenIndex < hiddenCount; hiddenIndex += 1) {
      b1[hiddenIndex] -= learningRate * gradb1[hiddenIndex]! * batchScale;
      for (let inputIndex = 0; inputIndex < inputCount; inputIndex += 1) {
        const grad = (gradW1[hiddenIndex]![inputIndex]! * batchScale) + (2 * l2Penalty * W1[hiddenIndex]![inputIndex]!);
        W1[hiddenIndex]![inputIndex] -= learningRate * grad;
      }
      const gradOutput = (gradW2[hiddenIndex]! * batchScale) + (2 * l2Penalty * W2[hiddenIndex]!);
      W2[hiddenIndex] -= learningRate * gradOutput;
    }
    b2 -= learningRate * gradb2 * batchScale;
    if (epoch === epochs - 1) {
      finalTrainingLoss = loss / Math.max(1, trainIndices.length);
    }
  }

  const predictRegression = (rowIndex: number): number => {
    const input = standardizedInputs[rowIndex]!;
    const { h } = computeHidden(input);
    return b2 + W2.reduce((total, weight, hiddenIndex) => total + (weight * h[hiddenIndex]!), 0);
  };
  if (validIndices.length > 0) {
    const validationLoss = validIndices.reduce((total, rowIndex) => {
      const residual = predictRegression(rowIndex) - regressionTargets[rowIndex]!;
      return total + (0.5 * (residual ** 2));
    }, 0);
    finalValidationLoss = validationLoss / validIndices.length;
  }
  const predictions = numericRows.map((row, index) => {
    const predicted = predictRegression(index);
    const actual = row.target;
    return {
      caseId: row.caseId,
      caseLabel: row.caseLabel,
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
  const validationActual = validIndices.map((rowIndex) => regressionTargets[rowIndex]!);
  const validationPredicted = validIndices.map((rowIndex) => predictRegression(rowIndex));
  const validationResiduals = validationActual.map((value, index) => value - validationPredicted[index]!);
  const featureImportance = uniquePredictors.map((field, inputIndex) => {
    const importance = W1.reduce((total, hiddenWeights, hiddenIndex) =>
      total + (Math.abs(hiddenWeights[inputIndex] ?? 0) * Math.abs(W2[hiddenIndex] ?? 0)), 0);
    return { field, label: predictorMeta[inputIndex]!.label, importance };
  }).sort((left, right) => right.importance - left.importance);

  return {
    targetField: targetField.key,
    targetLabel: targetField.label,
    predictorFields: uniquePredictors,
    predictorLabels: predictorMeta.map((field) => field.label),
    task,
    caseCount: rows.length,
    hiddenUnits: configuredHiddenUnits,
    metrics: {
      rootMeanSquaredError: Math.sqrt(residuals.reduce((total, value) => total + (value ** 2), 0) / residuals.length),
      meanAbsoluteError: residuals.reduce((total, value) => total + Math.abs(value), 0) / residuals.length,
      rSquared: ssTotal === 0 ? 1 : 1 - (ssResidual / ssTotal),
      validationRootMeanSquaredError: validationResiduals.length > 0
        ? Math.sqrt(validationResiduals.reduce((total, value) => total + (value ** 2), 0) / validationResiduals.length)
        : null,
      validationMeanAbsoluteError: validationResiduals.length > 0
        ? validationResiduals.reduce((total, value) => total + Math.abs(value), 0) / validationResiduals.length
        : null,
      validationRSquared: validationActual.length > 0 ? computeR2(validationActual, validationPredicted) : null,
      trainingLoss: finalTrainingLoss,
      validationLoss: finalValidationLoss
    },
    featureImportance,
    predictions: predictions.slice(0, 100),
    notes: [
      `One-hidden-layer MLP trained with full-batch gradient descent for ${epochs} epoch(s).`,
      `Learning rate ${learningRate}, L2 ${l2Penalty}, validation split ${(validationSplit * 100).toFixed(1)}%.`
    ]
  };
}

type SyntaxMacroParameter = {
  name: string;
  key: string;
  mode: 'tokens' | 'cmdend';
  width: number;
  named: boolean;
};

type SyntaxMacroDefinition = {
  name: string;
  key: string;
  parameters: SyntaxMacroParameter[];
  body: string[];
};

type SyntaxOmsRecord = {
  sequence: number;
  capturedAt: string;
  tag: string | null;
  commandName: string;
  command: string;
  outputKind: SyntaxCommandResult['outputKind'];
  subtype: string;
  message: string;
  output: unknown;
};

type SyntaxOutputDocumentStore = {
  name: string;
  records: SyntaxOmsRecord[];
  createdAt: string;
};

type SyntaxOmsSession = {
  active: boolean;
  tag: string | null;
  commandFilter: Set<string> | null;
  exceptCommandFilter: Set<string> | null;
  subtypeFilter: Set<string> | null;
  destinationFormat: 'json' | 'text';
  destinationOutfile: string | null;
  destinationViewer: string | null;
  mode: 'replace' | 'append';
  records: SyntaxOmsRecord[];
};

const syntaxExtensionRegistry = new Map<string, SyntaxExtensionHandler>();

function normalizeSyntaxCommandName(name: string): string {
  return cleanSyntaxToken(name)
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function normalizeSyntaxMacroKey(name: string): string {
  return cleanSyntaxToken(name).replace(/^!+/, '').toLowerCase();
}

function deepCloneUnknown<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function isSyntaxCommentCommand(command: string): boolean {
  const trimmed = command.trim();
  return trimmed.startsWith('*') || trimmed.startsWith('//') || /^COMMENT\b/i.test(trimmed);
}

export function registerSyntaxExtension(commandName: string, handler: SyntaxExtensionHandler): void {
  const normalized = normalizeSyntaxCommandName(commandName);
  if (!normalized) throw new Error('Extension command name is required.');
  syntaxExtensionRegistry.set(normalized, handler);
}

export function unregisterSyntaxExtension(commandName: string): boolean {
  const normalized = normalizeSyntaxCommandName(commandName);
  if (!normalized) return false;
  return syntaxExtensionRegistry.delete(normalized);
}

export function listSyntaxExtensions(): string[] {
  return [...syntaxExtensionRegistry.keys()].sort((left, right) => left.localeCompare(right));
}

export function clearSyntaxExtensions(): void {
  syntaxExtensionRegistry.clear();
}

function splitSyntaxCommands(syntax: string): string[] {
  const normalized = syntax.replace(/\r/g, '\n');
  const commands: string[] = [];
  let buffer = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index]!;
    const previous = index > 0 ? normalized[index - 1]! : '';
    const next = index + 1 < normalized.length ? normalized[index + 1]! : '';

    if (char === '\'' && !inDoubleQuote && previous !== '\\') {
      inSingleQuote = !inSingleQuote;
      buffer += char;
      continue;
    }
    if (char === '"' && !inSingleQuote && previous !== '\\') {
      inDoubleQuote = !inDoubleQuote;
      buffer += char;
      continue;
    }

    const isDecimalPoint = /\d/.test(previous) && /\d/.test(next);
    if (char === '.' && !inSingleQuote && !inDoubleQuote && !isDecimalPoint) {
      const command = buffer.trim();
      if (command && !isSyntaxCommentCommand(command)) commands.push(command);
      buffer = '';
      continue;
    }

    if (char === '\n' && !inSingleQuote && !inDoubleQuote) {
      const command = buffer.trim();
      if (command && !isSyntaxCommentCommand(command)) commands.push(command);
      buffer = '';
      continue;
    }

    buffer += char;
  }

  const trailing = buffer.trim();
  if (trailing && !isSyntaxCommentCommand(trailing)) commands.push(trailing);
  return commands;
}

function cleanSyntaxToken(token: string): string {
  return token.trim().replace(/^[("'`]+|[)"'`,.;]+$/g, '');
}

function resolveSyntaxField(dataset: CaseDataset, token: string): string {
  const cleaned = cleanSyntaxToken(token);
  const exact = dataset.fields.find((field) => field.key === cleaned);
  if (exact) return exact.key;
  const labelMatch = dataset.fields.find((field) => field.label.toLowerCase() === cleaned.toLowerCase());
  if (labelMatch) return labelMatch.key;
  const caseInsensitive = dataset.fields.find((field) => field.key.toLowerCase() === cleaned.toLowerCase());
  if (caseInsensitive) return caseInsensitive.key;
  throw new Error(`Syntax field "${cleaned}" was not found in the dataset.`);
}

function parseSyntaxFieldList(dataset: CaseDataset, text: string): string[] {
  const raw = text.trim();
  if (!raw) return [];
  if (/^ALL$/i.test(raw)) {
    return dataset.fields.filter((field) => field.source !== 'system').map((field) => field.key);
  }
  return [...new Set(raw
    .split(/[\s,]+/)
    .map(cleanSyntaxToken)
    .filter(Boolean)
    .map((token) => resolveSyntaxField(dataset, token)))];
}

function extractSyntaxClause(command: string, clause: string): string | null {
  const regex = new RegExp(`${clause}\\s*=\\s*([^/]+)`, 'i');
  const match = command.match(regex);
  return match?.[1]?.trim() ?? null;
}

function extractSyntaxClauseLoose(command: string, clause: string): string | null {
  const strict = extractSyntaxClause(command, clause);
  if (strict) return strict;
  const regex = new RegExp(`${clause}\\s+([^/]+)`, 'i');
  const match = command.match(regex);
  return match?.[1]?.trim() ?? null;
}

type SyntaxExecutionContext = {
  currentDataset: CaseDataset;
  activeDatasetName: string;
  datasets: Map<string, CaseDataset>;
  activeOutputDocumentName: string;
  outputDocuments: Map<string, SyntaxOutputDocumentStore>;
  splitFields: string[];
  filterField: string;
  syntaxAnalysisOptions: Required<DatasetAnalysisOptions>;
  valueLabels: Map<string, Map<string, string>>;
  vectorFields: Map<string, string[]>;
  rowMask: boolean[] | null;
  macros: Map<string, SyntaxMacroDefinition>;
  oms: SyntaxOmsSession;
  macroDepth: number;
};

function cloneCaseDataset(dataset: CaseDataset): CaseDataset {
  return {
    caseCount: dataset.caseCount,
    fields: dataset.fields.map((field) => ({ ...field })),
    rows: dataset.rows.map((row) => ({ ...row })),
    notes: dataset.notes.map((note) => ({ ...note }))
  };
}

function summarizeSyntaxDataset(dataset: CaseDataset): { caseCount: number; fieldCount: number; fields: string[] } {
  return {
    caseCount: dataset.caseCount,
    fieldCount: dataset.fields.length,
    fields: dataset.fields.map((field) => field.key)
  };
}

function syncActiveDataset(context: SyntaxExecutionContext): void {
  context.datasets.set(context.activeDatasetName, cloneCaseDataset(context.currentDataset));
}

function ensureSyntaxField(dataset: CaseDataset, fieldKey: string): CaseDataset {
  if (dataset.fields.some((field) => field.key === fieldKey)) return dataset;
  return {
    ...dataset,
    fields: [
      ...dataset.fields,
      { key: fieldKey, label: fieldKey, source: 'variable', valueType: 'null' }
    ]
  };
}

function refreshDatasetFieldTypes(dataset: CaseDataset): CaseDataset {
  const map = new Map<string, DatasetValueType>();
  for (const field of dataset.fields) {
    map.set(field.key, inferValueType(dataset.rows.map((row) => row[field.key] ?? null)));
  }
  return {
    ...dataset,
    fields: dataset.fields.map((field) => ({ ...field, valueType: map.get(field.key) ?? field.valueType }))
  };
}

function parseSyntaxClauses(command: string): Array<{ key: string; rawKey: string; value: string }> {
  return command
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(1)
    .map((part) => {
      const idx = part.indexOf('=');
      if (idx < 0) return { key: part.toUpperCase(), rawKey: part, value: '' };
      const rawKey = part.slice(0, idx).trim();
      return { key: rawKey.toUpperCase(), rawKey, value: part.slice(idx + 1).trim() };
    });
}

function parseSyntaxValueToken(value: string): DatasetValue {
  const cleaned = cleanSyntaxToken(value);
  if (!cleaned) return null;
  if (/^(NULL|SYSMIS)$/i.test(cleaned)) return null;
  if (/^(TRUE|YES|ON)$/i.test(cleaned)) return true;
  if (/^(FALSE|NO|OFF)$/i.test(cleaned)) return false;
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) return Number(cleaned);
  return cleaned;
}

function parseSyntaxTokens(text: string): string[] {
  const matches = text.match(/'[^']*'|"[^"]*"|[^\s,]+/g);
  return matches ? matches.map((token) => token.trim()).filter(Boolean) : [];
}

function parseSyntaxTargetFieldList(text: string): string[] {
  return [...new Set(parseSyntaxTokens(text).map((token) => normalizeFieldKey(cleanSyntaxToken(token))).filter(Boolean))];
}

function parseSyntaxNumericSetting(
  command: string,
  patterns: RegExp[]
): number | null {
  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (!match) continue;
    const raw = String(match[1] ?? '').trim();
    if (!raw) continue;
    const value = Number(raw);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function parseSyntaxConfidenceLevel(command: string): number | null {
  const value = parseSyntaxNumericSetting(command, [
    /\bCILEVEL\s*\(\s*([0-9]*\.?[0-9]+)\s*\)/i,
    /\bCILEVEL\s*=\s*([0-9]*\.?[0-9]+)/i,
    /\bCONFIDENCE\s*=\s*([0-9]*\.?[0-9]+)/i
  ]);
  if (value === null) return null;
  return value > 1 ? value / 100 : value;
}

function vectorMapKey(name: string): string {
  return cleanSyntaxToken(name).toLowerCase();
}

function syntaxRowMaskAllows(context: SyntaxExecutionContext, rowIndex: number): boolean {
  if (!context.rowMask) return true;
  return Boolean(context.rowMask[rowIndex]);
}

function resolveSyntaxVectorField(
  context: SyntaxExecutionContext,
  dataset: CaseDataset,
  token: string,
  row: DatasetRow
): string | null {
  const normalizedToken = token.trim().replace(/^[("'`]+|[,"'`;]+$/g, '');
  const match = normalizedToken.match(/^([A-Za-z_][\w$]*)\((.+)\)$/);
  if (!match) return null;
  const vectorName = vectorMapKey(match[1]!);
  const vectorFields = context.vectorFields.get(vectorName);
  if (!vectorFields || vectorFields.length === 0) return null;
  const indexExpression = match[2]!.trim();
  const indexValue = evaluateSyntaxExpression(context, dataset, row, indexExpression);
  const numericIndex = typeof indexValue === 'number' ? Math.floor(indexValue) : Number.NaN;
  if (!Number.isFinite(numericIndex)) {
    throw new Error(`Vector index "${indexExpression}" must resolve to a numeric value for "${match[1]}".`);
  }
  if (numericIndex < 1 || numericIndex > vectorFields.length) {
    throw new Error(`Vector index ${numericIndex} is out of range for "${match[1]}" (1..${vectorFields.length}).`);
  }
  return vectorFields[numericIndex - 1]!;
}

function evaluateSyntaxExpression(
  context: SyntaxExecutionContext,
  dataset: CaseDataset,
  row: DatasetRow,
  expression: string
): DatasetValue {
  const trimmed = expression.trim();
  if (!trimmed) return null;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
    return trimmed.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (/^(NULL|SYSMIS)$/i.test(trimmed)) return null;
  if (/^(TRUE|YES|ON)$/i.test(trimmed)) return true;
  if (/^(FALSE|NO|OFF)$/i.test(trimmed)) return false;

  const functionMatch = trimmed.match(/^([A-Za-z_][\w]*)\((.*)\)$/);
  if (functionMatch) {
    const vectorField = resolveSyntaxVectorField(context, dataset, trimmed, row);
    if (vectorField) return row[vectorField] ?? null;
    const fn = functionMatch[1]!.toUpperCase();
    const args = functionMatch[2]!
      .split(',')
      .map((arg) => arg.trim())
      .filter(Boolean)
      .map((arg) => evaluateSyntaxExpression(context, dataset, row, arg));
    const numericArgs = args.map((arg) => typeof arg === 'number' ? arg : Number.NaN).filter((arg) => Number.isFinite(arg));
    if (fn === 'ABS') return numericArgs.length > 0 ? Math.abs(numericArgs[0]!) : null;
    if (fn === 'ROUND') {
      if (numericArgs.length === 0) return null;
      const decimals = numericArgs.length > 1 ? Math.max(0, Math.floor(numericArgs[1]!)) : 0;
      const scale = 10 ** decimals;
      return Math.round(numericArgs[0]! * scale) / scale;
    }
    if (fn === 'MIN') return numericArgs.length ? Math.min(...numericArgs) : null;
    if (fn === 'MAX') return numericArgs.length ? Math.max(...numericArgs) : null;
    if (fn === 'MEAN') return numericArgs.length ? numericArgs.reduce((sum, value) => sum + value, 0) / numericArgs.length : null;
    if (fn === 'CONCAT') return args.map((arg) => arg === null ? '' : String(arg)).join('');
    if (fn === 'LOWER') return String(args[0] ?? '').toLowerCase();
    if (fn === 'UPPER') return String(args[0] ?? '').toUpperCase();
    if (fn === 'COALESCE') return args.find((arg) => arg !== null && `${arg}` !== '') ?? null;
    throw new Error(`Unsupported function "${fn}" in COMPUTE/IF expression.`);
  }

  for (const operator of ['>=', '<=', '<>', '!=', '>', '<', '=']) {
    const idx = trimmed.indexOf(operator);
    if (idx > 0) {
      const left = evaluateSyntaxExpression(context, dataset, row, trimmed.slice(0, idx));
      const right = evaluateSyntaxExpression(context, dataset, row, trimmed.slice(idx + operator.length));
      if (operator === '=' ) return valuesEqual(left, right);
      if (operator === '<>' || operator === '!=') return !valuesEqual(left, right);
      const leftNumber = typeof left === 'number' ? left : Number.NaN;
      const rightNumber = typeof right === 'number' ? right : Number.NaN;
      if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
        if (operator === '>=') return leftNumber >= rightNumber;
        if (operator === '<=') return leftNumber <= rightNumber;
        if (operator === '>') return leftNumber > rightNumber;
        return leftNumber < rightNumber;
      }
      const leftText = formatValue(left);
      const rightText = formatValue(right);
      if (operator === '>=') return leftText >= rightText;
      if (operator === '<=') return leftText <= rightText;
      if (operator === '>') return leftText > rightText;
      return leftText < rightText;
    }
  }

  const arithmeticMatch = trimmed.match(/^(.+?)\s*([+\-*/%])\s*(.+)$/);
  if (arithmeticMatch) {
    const left = evaluateSyntaxExpression(context, dataset, row, arithmeticMatch[1]!);
    const right = evaluateSyntaxExpression(context, dataset, row, arithmeticMatch[3]!);
    const leftNumber = typeof left === 'number' ? left : Number.NaN;
    const rightNumber = typeof right === 'number' ? right : Number.NaN;
    if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) return null;
    const op = arithmeticMatch[2]!;
    if (op === '+') return leftNumber + rightNumber;
    if (op === '-') return leftNumber - rightNumber;
    if (op === '*') return leftNumber * rightNumber;
    if (op === '/') return rightNumber === 0 ? null : leftNumber / rightNumber;
    if (op === '%') return rightNumber === 0 ? null : leftNumber % rightNumber;
  }

  const vectorField = resolveSyntaxVectorField(context, dataset, trimmed, row);
  if (vectorField) return row[vectorField] ?? null;
  const field = resolveSyntaxField(dataset, trimmed);
  return row[field] ?? null;
}

function groupRowsByFields(rows: DatasetRow[], fields: string[]): Map<string, { groupValues: Record<string, DatasetValue>; rows: DatasetRow[] }> {
  const grouped = new Map<string, { groupValues: Record<string, DatasetValue>; rows: DatasetRow[] }>();
  for (const row of rows) {
    const values = fields.map((field) => row[field] ?? null);
    const key = JSON.stringify(values);
    const bucket = grouped.get(key) ?? { groupValues: Object.fromEntries(fields.map((field, index) => [field, values[index] ?? null])), rows: [] };
    bucket.rows.push(row);
    grouped.set(key, bucket);
  }
  return grouped;
}

function parseSplitByFields(dataset: CaseDataset, command: string): string[] {
  const byMatch = command.match(/\bBY\s+(.+)$/i);
  if (!byMatch) return [];
  return parseSyntaxFieldList(dataset, byMatch[1] ?? '');
}

function isSyntaxTruthy(value: DatasetValue): boolean {
  if (value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const lowered = value.trim().toLowerCase();
  return lowered.length > 0 && lowered !== '0' && lowered !== 'false' && lowered !== 'no' && lowered !== 'off';
}

function filterDatasetForSyntaxAnalysis(context: SyntaxExecutionContext): CaseDataset {
  if (!context.filterField) return context.currentDataset;
  const rows = context.currentDataset.rows.filter((row) => isSyntaxTruthy(row[context.filterField] ?? null));
  return {
    caseCount: rows.length,
    fields: context.currentDataset.fields.map((field) => ({ ...field })),
    rows: rows.map((row) => ({ ...row })),
    notes: [
      ...context.currentDataset.notes,
      { level: 'info', message: `FILTER BY ${context.filterField} included ${rows.length} case(s).` }
    ]
  };
}

function compareSyntaxValues(left: DatasetValue, right: DatasetValue): number {
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  return formatValue(left).localeCompare(formatValue(right), undefined, { numeric: true, sensitivity: 'base' });
}

function parseSortSpecifications(dataset: CaseDataset, command: string): Array<{ field: string; descending: boolean }> {
  const byMatch = command.match(/\bBY\s+(.+)$/i);
  if (!byMatch) return [];
  const clause = byMatch[1] ?? '';
  const specs: Array<{ field: string; descending: boolean }> = [];
  const matcher = /([A-Za-z_][\w$]*)\s*(?:\(\s*([AD])\s*\))?/gi;
  let match = matcher.exec(clause);
  while (match) {
    const field = resolveSyntaxField(dataset, match[1]!);
    specs.push({ field, descending: (match[2] ?? 'A').toUpperCase() === 'D' });
    match = matcher.exec(clause);
  }
  if (specs.length > 0) return specs;
  return parseSyntaxFieldList(dataset, clause).map((field) => ({ field, descending: false }));
}

type SyntaxRecodeMatcher =
  | { kind: 'else' }
  | { kind: 'missing' }
  | { kind: 'value'; value: DatasetValue }
  | { kind: 'range'; low: number | null; high: number | null };

type SyntaxRecodeAction =
  | { kind: 'copy' }
  | { kind: 'system_missing' }
  | { kind: 'value'; value: DatasetValue };

type SyntaxRecodeRule = {
  matchers: SyntaxRecodeMatcher[];
  action: SyntaxRecodeAction;
};

function parseSyntaxRangeBound(token: string, isLow: boolean): number | null {
  const normalized = cleanSyntaxToken(token).toUpperCase();
  if (normalized === 'LOWEST') return isLow ? null : Number.NEGATIVE_INFINITY;
  if (normalized === 'HIGHEST') return isLow ? Number.POSITIVE_INFINITY : null;
  const value = Number(cleanSyntaxToken(token));
  if (!Number.isFinite(value)) throw new Error(`Invalid numeric bound "${token}" in range specification.`);
  return value;
}

function parseSyntaxMatcherTokens(spec: string): SyntaxRecodeMatcher[] {
  const normalized = spec.trim();
  if (!normalized) return [];
  if (/^ELSE$/i.test(normalized)) return [{ kind: 'else' }];
  const tokens = parseSyntaxTokens(normalized.replace(/,/g, ' '));
  const matchers: SyntaxRecodeMatcher[] = [];
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index]!;
    if (/^(SYSMIS|MISSING)$/i.test(token)) {
      matchers.push({ kind: 'missing' });
      index += 1;
      continue;
    }
    if (index + 2 < tokens.length && /^THRU$/i.test(tokens[index + 1]!)) {
      const lowBound = parseSyntaxRangeBound(token, true);
      const highBound = parseSyntaxRangeBound(tokens[index + 2]!, false);
      const low = lowBound === Number.POSITIVE_INFINITY ? null : lowBound;
      const high = highBound === Number.NEGATIVE_INFINITY ? null : highBound;
      matchers.push({ kind: 'range', low, high });
      index += 3;
      continue;
    }
    matchers.push({ kind: 'value', value: parseSyntaxValueToken(token) });
    index += 1;
  }
  return matchers;
}

function parseSyntaxRecodeAction(token: string): SyntaxRecodeAction {
  const normalized = cleanSyntaxToken(token).toUpperCase();
  if (normalized === 'COPY') return { kind: 'copy' };
  if (normalized === 'SYSMIS' || normalized === 'MISSING') return { kind: 'system_missing' };
  return { kind: 'value', value: parseSyntaxValueToken(token) };
}

function extractSyntaxParenthesizedSegments(text: string): string[] {
  const segments: string[] = [];
  const matcher = /\(([^()]*)\)/g;
  let match = matcher.exec(text);
  while (match) {
    segments.push(match[1]!.trim());
    match = matcher.exec(text);
  }
  return segments;
}

function parseSyntaxRecodeRules(commandPart: string): SyntaxRecodeRule[] {
  return extractSyntaxParenthesizedSegments(commandPart)
    .map((segment) => {
      const equalsIndex = segment.indexOf('=');
      if (equalsIndex <= 0) return null;
      const sourceSpec = segment.slice(0, equalsIndex).trim();
      const targetSpec = segment.slice(equalsIndex + 1).trim();
      if (!sourceSpec || !targetSpec) return null;
      return {
        matchers: parseSyntaxMatcherTokens(sourceSpec),
        action: parseSyntaxRecodeAction(targetSpec)
      } satisfies SyntaxRecodeRule;
    })
    .filter((rule): rule is SyntaxRecodeRule => rule !== null && rule.matchers.length > 0);
}

function matchesSyntaxRecodeMatcher(value: DatasetValue, matcher: SyntaxRecodeMatcher): boolean {
  if (matcher.kind === 'else') return true;
  if (matcher.kind === 'missing') return value === null;
  if (matcher.kind === 'value') return valuesEqual(value, matcher.value);
  if (typeof value !== 'number') return false;
  const low = matcher.low ?? Number.NEGATIVE_INFINITY;
  const high = matcher.high ?? Number.POSITIVE_INFINITY;
  return value >= low && value <= high;
}

function applySyntaxRecodeRules(
  sourceValue: DatasetValue,
  rules: SyntaxRecodeRule[],
  defaultValue: DatasetValue
): DatasetValue {
  for (const rule of rules) {
    if (!rule.matchers.some((matcher) => matchesSyntaxRecodeMatcher(sourceValue, matcher))) continue;
    if (rule.action.kind === 'copy') return sourceValue;
    if (rule.action.kind === 'system_missing') return null;
    return rule.action.value;
  }
  return defaultValue;
}

function executeRecode(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const body = command.replace(/^\s*RECODE\s+/i, '').trim();
  if (!body) throw new Error('RECODE requires source field(s) and one or more recode rules.');
  const intoSplit = body.split(/\bINTO\b/i);
  const leftPart = intoSplit[0]!.trim();
  const sourcePart = leftPart.split('(')[0]?.trim() ?? '';
  const sourceFields = parseSyntaxFieldList(context.currentDataset, sourcePart);
  if (sourceFields.length === 0) throw new Error('RECODE requires source field(s).');
  const rules = parseSyntaxRecodeRules(leftPart);
  if (rules.length === 0) throw new Error('RECODE requires at least one rule in parentheses, for example (1=0).');

  const targetFields = intoSplit.length > 1
    ? parseSyntaxTargetFieldList(intoSplit.slice(1).join(' '))
    : [...sourceFields];
  if (targetFields.length !== sourceFields.length) {
    throw new Error('RECODE INTO requires the same number of target fields as source fields.');
  }

  const existing = new Set(context.currentDataset.fields.map((field) => field.key));
  let dataset = context.currentDataset;
  targetFields.forEach((targetField, index) => {
    if (dataset.fields.some((field) => field.key === targetField)) return;
    const sourceField = sourceFields[index]!;
    const sourceMeta = dataset.fields.find((field) => field.key === sourceField);
    dataset = ensureSyntaxField(dataset, targetField);
    dataset = {
      ...dataset,
      fields: dataset.fields.map((field) => field.key === targetField
        ? {
          ...field,
          label: sourceMeta?.label ? `${sourceMeta.label} (recoded)` : targetField,
          source: 'variable'
        }
        : field)
    };
    existing.add(targetField);
  });

  let changed = 0;
  const rows = dataset.rows.map((row, rowIndex) => {
    const nextRow: DatasetRow = { ...row };
    if (!syntaxRowMaskAllows(context, rowIndex)) return nextRow;
    sourceFields.forEach((sourceField, index) => {
      const targetField = targetFields[index]!;
      const sourceValue = row[sourceField] ?? null;
      const defaultValue = targetField === sourceField ? sourceValue : null;
      const recoded = applySyntaxRecodeRules(sourceValue, rules, defaultValue);
      if (!valuesEqual(nextRow[targetField] ?? null, recoded)) {
        changed += 1;
      }
      nextRow[targetField] = recoded;
    });
    return nextRow;
  });

  dataset = refreshDatasetFieldTypes({
    ...dataset,
    caseCount: rows.length,
    rows,
    notes: [...dataset.notes, { level: 'info', message: `RECODE applied ${rules.length} rule(s) to ${sourceFields.length} field(s).` }]
  });
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'RECODE',
    status: 'ok',
    outputKind: 'dataset',
    message: `Recoded ${sourceFields.length} field(s); ${changed} value update(s).`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset), sourceFields, targetFields, ruleCount: rules.length }
  };
}

function executeAutorecode(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const sourceClause = extractSyntaxClauseLoose(command, 'VARIABLES') ?? command.replace(/^\s*AUTORECODE/i, '').split('/')[0] ?? '';
  const sourceFields = parseSyntaxFieldList(context.currentDataset, sourceClause);
  if (sourceFields.length === 0) throw new Error('AUTORECODE requires /VARIABLES source field(s).');
  const intoClause = extractSyntaxClauseLoose(command, 'INTO');
  if (!intoClause) throw new Error('AUTORECODE requires /INTO target field(s).');
  const targetFields = parseSyntaxTargetFieldList(intoClause);
  if (targetFields.length !== sourceFields.length) {
    throw new Error('AUTORECODE /INTO requires the same number of target fields as /VARIABLES.');
  }

  let dataset = context.currentDataset;
  sourceFields.forEach((sourceField, index) => {
    const targetField = targetFields[index]!;
    if (dataset.fields.some((field) => field.key === targetField)) return;
    const sourceMeta = dataset.fields.find((field) => field.key === sourceField);
    dataset = ensureSyntaxField(dataset, targetField);
    dataset = {
      ...dataset,
      fields: dataset.fields.map((field) => field.key === targetField
        ? {
          ...field,
          label: sourceMeta?.label ? `${sourceMeta.label} (code)` : targetField,
          source: 'variable'
        }
        : field)
    };
  });

  const rowCopies = dataset.rows.map((row) => ({ ...row }));
  const generatedMappings: Record<string, Array<{ code: number; value: string }>> = {};
  sourceFields.forEach((sourceField, index) => {
    const targetField = targetFields[index]!;
    const scopedRows = rowCopies.filter((_row, rowIndex) => syntaxRowMaskAllows(context, rowIndex));
    const distinct = [...new Set(
      scopedRows
        .map((row) => row[sourceField] ?? null)
        .filter((value): value is Exclude<DatasetValue, null> => value !== null)
        .map((value) => formatValue(value))
    )].sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }));
    const codeByValue = new Map<string, number>();
    distinct.forEach((value, valueIndex) => {
      codeByValue.set(value, valueIndex + 1);
    });
    rowCopies.forEach((row, rowIndex) => {
      if (!syntaxRowMaskAllows(context, rowIndex)) return;
      const rawValue = row[sourceField] ?? null;
      row[targetField] = rawValue === null ? null : (codeByValue.get(formatValue(rawValue)) ?? null);
    });
    const labels = new Map<string, string>();
    distinct.forEach((value, valueIndex) => {
      labels.set(String(valueIndex + 1), value);
    });
    context.valueLabels.set(targetField, labels);
    generatedMappings[targetField] = distinct.map((value, valueIndex) => ({ code: valueIndex + 1, value }));
  });

  dataset = refreshDatasetFieldTypes({
    ...dataset,
    caseCount: rowCopies.length,
    rows: rowCopies,
    notes: [...dataset.notes, { level: 'info', message: `AUTORECODE created ${targetFields.length} coded field(s).` }]
  });
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'AUTORECODE',
    status: 'ok',
    outputKind: 'dataset',
    message: `Autorecoded ${sourceFields.length} field(s).`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset), mapping: generatedMappings }
  };
}

function executeCount(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const match = command.match(/^\s*COUNT\s+([A-Za-z_][\w$]*)\s*=\s*(.+?)\s*\((.+)\)\s*$/i);
  if (!match) throw new Error('COUNT requires syntax: COUNT target = varlist (values).');
  const targetField = normalizeFieldKey(match[1]!);
  const sourceFields = parseSyntaxFieldList(context.currentDataset, match[2] ?? '');
  const matchers = parseSyntaxMatcherTokens(match[3] ?? '').filter((matcher) => matcher.kind !== 'else');
  if (sourceFields.length === 0) throw new Error('COUNT requires at least one source field.');
  if (matchers.length === 0) throw new Error('COUNT requires at least one value matcher.');

  let dataset = ensureSyntaxField(context.currentDataset, targetField);
  const rows = dataset.rows.map((row, rowIndex) => {
    if (!syntaxRowMaskAllows(context, rowIndex)) return { ...row };
    let count = 0;
    sourceFields.forEach((field) => {
      const value = row[field] ?? null;
      if (matchers.some((matcher) => matchesSyntaxRecodeMatcher(value, matcher))) {
        count += 1;
      }
    });
    return { ...row, [targetField]: count };
  });
  dataset = refreshDatasetFieldTypes({
    ...dataset,
    caseCount: rows.length,
    rows,
    notes: [...dataset.notes, { level: 'info', message: `COUNT populated "${targetField}" across ${sourceFields.length} field(s).` }]
  });
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'COUNT',
    status: 'ok',
    outputKind: 'dataset',
    message: `Counted matches into "${targetField}".`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset), sourceFields, targetField }
  };
}

function executeSelectIf(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const expression = command.replace(/^\s*SELECT\s+IF\s*/i, '').trim();
  if (!expression) throw new Error('SELECT IF requires a condition expression.');
  const rows = context.currentDataset.rows
    .filter((row) => isSyntaxTruthy(evaluateSyntaxExpression(context, context.currentDataset, row, expression)))
    .map((row) => ({ ...row }));
  const dataset: CaseDataset = {
    caseCount: rows.length,
    fields: context.currentDataset.fields.map((field) => ({ ...field })),
    rows,
    notes: [...context.currentDataset.notes, { level: 'info', message: `SELECT IF retained ${rows.length} row(s).` }]
  };
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'SELECT_IF',
    status: 'ok',
    outputKind: 'dataset',
    message: `Selected ${rows.length} row(s).`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset) }
  };
}

function executeFilter(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  if (/\bOFF\b/i.test(command)) {
    context.filterField = '';
    return {
      command,
      commandName: 'FILTER',
      status: 'ok',
      outputKind: 'message',
      message: 'Filter disabled.',
      output: { filterField: null }
    };
  }
  const byMatch = command.match(/\bBY\s+([A-Za-z_][\w$]*)/i);
  if (!byMatch) throw new Error('FILTER requires syntax: FILTER BY field or FILTER OFF.');
  const filterField = resolveSyntaxField(context.currentDataset, byMatch[1] ?? '');
  context.filterField = filterField;
  return {
    command,
    commandName: 'FILTER',
    status: 'ok',
    outputKind: 'message',
    message: `Filter enabled using "${filterField}".`,
    output: { filterField }
  };
}

function executeWeight(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  if (/\bOFF\b/i.test(command)) {
    context.syntaxAnalysisOptions.weightField = '';
    return {
      command,
      commandName: 'WEIGHT',
      status: 'ok',
      outputKind: 'message',
      message: 'Weighting disabled.',
      output: { weightField: null }
    };
  }
  const byMatch = command.match(/\bBY\s+([A-Za-z_][\w$]*)/i);
  if (!byMatch) throw new Error('WEIGHT requires syntax: WEIGHT BY field or WEIGHT OFF.');
  const weightField = resolveSyntaxField(context.currentDataset, byMatch[1] ?? '');
  context.syntaxAnalysisOptions.weightField = weightField;
  return {
    command,
    commandName: 'WEIGHT',
    status: 'ok',
    outputKind: 'message',
    message: `Weighting enabled using "${weightField}".`,
    output: { weightField }
  };
}

function executeMissingValues(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const segments = extractSyntaxParenthesizedSegments(command);
  if (segments.length === 0) throw new Error('MISSING VALUES requires one or more parenthesized missing-code sets.');
  if (segments.some((segment) => !segment.trim())) {
    context.syntaxAnalysisOptions.missingValues = [];
    return {
      command,
      commandName: 'MISSING_VALUES',
      status: 'ok',
      outputKind: 'message',
      message: 'Cleared custom missing values.',
      output: { missingValues: [] }
    };
  }
  const nextValues = new Set(context.syntaxAnalysisOptions.missingValues.map((value) => value.trim()).filter(Boolean));
  segments.forEach((segment) => {
    parseSyntaxTokens(segment.replace(/,/g, ' '))
      .filter((token) => !/^THRU$/i.test(token))
      .map((token) => cleanSyntaxToken(token))
      .filter(Boolean)
      .forEach((token) => nextValues.add(token));
  });
  context.syntaxAnalysisOptions.missingValues = [...nextValues].sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }));
  return {
    command,
    commandName: 'MISSING_VALUES',
    status: 'ok',
    outputKind: 'message',
    message: `Configured ${context.syntaxAnalysisOptions.missingValues.length} custom missing value code(s).`,
    output: { missingValues: context.syntaxAnalysisOptions.missingValues }
  };
}

function executeVariableLabels(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const matcher = /([A-Za-z_][\w$]*)\s+('[^']*'|"[^"]*")/g;
  const updates: Array<{ field: string; label: string }> = [];
  let match = matcher.exec(command);
  while (match) {
    const field = resolveSyntaxField(context.currentDataset, match[1] ?? '');
    const rawLabel = match[2] ?? '';
    const label = rawLabel.startsWith('\'') || rawLabel.startsWith('"')
      ? rawLabel.slice(1, -1)
      : cleanSyntaxToken(rawLabel);
    updates.push({ field, label });
    match = matcher.exec(command);
  }
  if (updates.length === 0) {
    throw new Error('VARIABLE LABELS requires pairs in the form: VARIABLE LABELS field "Label".');
  }
  const labelMap = new Map(updates.map((entry) => [entry.field, entry.label]));
  const dataset: CaseDataset = {
    caseCount: context.currentDataset.caseCount,
    fields: context.currentDataset.fields.map((field) => ({
      ...field,
      label: labelMap.get(field.key) ?? field.label
    })),
    rows: context.currentDataset.rows.map((row) => ({ ...row })),
    notes: [...context.currentDataset.notes, { level: 'info', message: `Updated labels for ${updates.length} variable(s).` }]
  };
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'VARIABLE_LABELS',
    status: 'ok',
    outputKind: 'dataset',
    message: `Updated ${updates.length} variable label(s).`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset), labels: Object.fromEntries(updates.map((entry) => [entry.field, entry.label])) }
  };
}

function executeValueLabels(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const body = command.replace(/^\s*VALUE\s+LABELS\s*/i, '').trim();
  if (!body) throw new Error('VALUE LABELS requires at least one variable/value-label assignment.');
  const sections = body.split('/').map((segment) => segment.trim()).filter(Boolean);
  const updates: Record<string, Record<string, string>> = {};
  for (const section of sections) {
    const tokens = parseSyntaxTokens(section);
    if (tokens.length < 3) continue;
    const field = resolveSyntaxField(context.currentDataset, tokens[0] ?? '');
    const labelMap = context.valueLabels.get(field) ?? new Map<string, string>();
    for (let index = 1; index + 1 < tokens.length; index += 2) {
      const valueToken = tokens[index]!;
      const labelToken = tokens[index + 1]!;
      const label = labelToken.startsWith('\'') || labelToken.startsWith('"')
        ? labelToken.slice(1, -1)
        : cleanSyntaxToken(labelToken);
      labelMap.set(formatValue(parseSyntaxValueToken(valueToken)), label);
    }
    context.valueLabels.set(field, labelMap);
    updates[field] = Object.fromEntries([...labelMap.entries()]);
  }
  if (Object.keys(updates).length === 0) {
    throw new Error('VALUE LABELS parsing failed. Expected syntax like: VALUE LABELS var 1 "Yes" 0 "No".');
  }
  return {
    command,
    commandName: 'VALUE_LABELS',
    status: 'ok',
    outputKind: 'message',
    message: `Updated value labels for ${Object.keys(updates).length} variable(s).`,
    output: { valueLabels: updates }
  };
}

function executeRenameVariables(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const matcher = /\(([^=()]+)=([^()]+)\)/g;
  const pairs: Array<{ from: string; to: string }> = [];
  let match = matcher.exec(command);
  while (match) {
    const from = resolveSyntaxField(context.currentDataset, match[1] ?? '');
    const to = normalizeFieldKey(cleanSyntaxToken(match[2] ?? ''));
    if (!to) throw new Error(`Invalid rename target "${match[2] ?? ''}".`);
    pairs.push({ from, to });
    match = matcher.exec(command);
  }
  if (pairs.length === 0) throw new Error('RENAME VARIABLES requires pairs in the form: (old = new).');

  const fromSet = new Set(pairs.map((pair) => pair.from));
  const existing = new Set(context.currentDataset.fields.map((field) => field.key));
  for (const pair of pairs) {
    if (existing.has(pair.to) && !fromSet.has(pair.to)) {
      throw new Error(`Cannot rename to "${pair.to}" because it already exists.`);
    }
  }
  const mapping = new Map(pairs.map((pair) => [pair.from, pair.to]));
  const fields = context.currentDataset.fields.map((field) => ({
    ...field,
    key: mapping.get(field.key) ?? field.key
  }));
  const rows = context.currentDataset.rows.map((row) => {
    const nextRow: DatasetRow = {};
    Object.entries(row).forEach(([key, value]) => {
      nextRow[mapping.get(key) ?? key] = value ?? null;
    });
    return nextRow;
  });
  const dataset = refreshDatasetFieldTypes({
    caseCount: rows.length,
    fields,
    rows,
    notes: [...context.currentDataset.notes, { level: 'info', message: `Renamed ${pairs.length} variable(s).` }]
  });
  context.currentDataset = dataset;
  context.splitFields = context.splitFields.map((field) => mapping.get(field) ?? field);
  context.filterField = context.filterField ? (mapping.get(context.filterField) ?? context.filterField) : '';
  if (context.syntaxAnalysisOptions.weightField) {
    context.syntaxAnalysisOptions.weightField = mapping.get(context.syntaxAnalysisOptions.weightField) ?? context.syntaxAnalysisOptions.weightField;
  }
  const valueLabelEntries = [...context.valueLabels.entries()];
  context.valueLabels.clear();
  valueLabelEntries.forEach(([field, labels]) => {
    context.valueLabels.set(mapping.get(field) ?? field, labels);
  });
  syncActiveDataset(context);
  return {
    command,
    commandName: 'RENAME_VARIABLES',
    status: 'ok',
    outputKind: 'dataset',
    message: `Renamed ${pairs.length} variable(s).`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset), mapping: Object.fromEntries(pairs.map((pair) => [pair.from, pair.to])) }
  };
}

function executeDeleteVariables(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const body = command
    .replace(/^\s*(?:DELETE|DROP)\s+VARIABLES?\s*/i, '')
    .replace(/^=\s*/, '')
    .trim();
  const requestedFields = parseSyntaxFieldList(context.currentDataset, body);
  if (requestedFields.length === 0) {
    throw new Error('DELETE VARIABLES requires at least one variable name.');
  }

  const protectedFields = new Set(
    context.currentDataset.fields
      .filter((field) => field.source === 'system')
      .map((field) => field.key)
  );
  const deleted = requestedFields.filter((field) => !protectedFields.has(field));
  const skippedProtected = requestedFields.filter((field) => protectedFields.has(field));
  if (deleted.length === 0) {
    return {
      command,
      commandName: 'DELETE_VARIABLES',
      status: 'ok',
      outputKind: 'dataset',
      message: `No variables deleted (${skippedProtected.length} protected system field(s) were skipped).`,
      output: {
        datasetSummary: summarizeSyntaxDataset(context.currentDataset),
        deleted,
        skippedProtected
      }
    };
  }

  const deleteSet = new Set(deleted);
  const fields = context.currentDataset.fields
    .filter((field) => !deleteSet.has(field.key))
    .map((field) => ({ ...field }));
  const rows = context.currentDataset.rows.map((row) => {
    const nextRow: DatasetRow = {};
    Object.entries(row).forEach(([key, value]) => {
      if (!deleteSet.has(key)) nextRow[key] = value ?? null;
    });
    return nextRow;
  });
  const dataset = refreshDatasetFieldTypes({
    caseCount: rows.length,
    fields,
    rows,
    notes: [...context.currentDataset.notes, { level: 'info', message: `Deleted ${deleted.length} variable(s).` }]
  });
  context.currentDataset = dataset;
  context.splitFields = context.splitFields.filter((field) => !deleteSet.has(field));
  if (context.filterField && deleteSet.has(context.filterField)) context.filterField = '';
  if (context.syntaxAnalysisOptions.weightField && deleteSet.has(context.syntaxAnalysisOptions.weightField)) {
    context.syntaxAnalysisOptions.weightField = '';
  }
  const valueLabelEntries = [...context.valueLabels.entries()].filter(([field]) => !deleteSet.has(field));
  context.valueLabels.clear();
  valueLabelEntries.forEach(([field, labels]) => context.valueLabels.set(field, labels));
  syncActiveDataset(context);
  return {
    command,
    commandName: 'DELETE_VARIABLES',
    status: 'ok',
    outputKind: 'dataset',
    message: `Deleted ${deleted.length} variable(s).`,
    output: {
      datasetSummary: summarizeSyntaxDataset(dataset),
      deleted,
      skippedProtected
    }
  };
}

function executeKeepVariables(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const body = command
    .replace(/^\s*KEEP\s+VARIABLES?\s*/i, '')
    .replace(/^=\s*/, '')
    .trim();
  const requestedFields = parseSyntaxFieldList(context.currentDataset, body);
  if (requestedFields.length === 0) {
    throw new Error('KEEP VARIABLES requires at least one variable name.');
  }

  const protectedFields = context.currentDataset.fields
    .filter((field) => field.source === 'system')
    .map((field) => field.key);
  const keepSet = new Set([...protectedFields, ...requestedFields]);
  const dropped = context.currentDataset.fields
    .map((field) => field.key)
    .filter((fieldKey) => !keepSet.has(fieldKey));
  const fields = context.currentDataset.fields
    .filter((field) => keepSet.has(field.key))
    .map((field) => ({ ...field }));
  const rows = context.currentDataset.rows.map((row) => {
    const nextRow: DatasetRow = {};
    for (const field of fields) {
      nextRow[field.key] = row[field.key] ?? null;
    }
    return nextRow;
  });
  const dataset = refreshDatasetFieldTypes({
    caseCount: rows.length,
    fields,
    rows,
    notes: [...context.currentDataset.notes, { level: 'info', message: `Kept ${requestedFields.length} requested variable(s).` }]
  });
  context.currentDataset = dataset;
  context.splitFields = context.splitFields.filter((field) => keepSet.has(field));
  if (context.filterField && !keepSet.has(context.filterField)) context.filterField = '';
  if (context.syntaxAnalysisOptions.weightField && !keepSet.has(context.syntaxAnalysisOptions.weightField)) {
    context.syntaxAnalysisOptions.weightField = '';
  }
  const valueLabelEntries = [...context.valueLabels.entries()].filter(([field]) => keepSet.has(field));
  context.valueLabels.clear();
  valueLabelEntries.forEach(([field, labels]) => context.valueLabels.set(field, labels));
  syncActiveDataset(context);
  return {
    command,
    commandName: 'KEEP_VARIABLES',
    status: 'ok',
    outputKind: 'dataset',
    message: `Kept ${fields.length} variable(s) (${dropped.length} dropped).`,
    output: {
      datasetSummary: summarizeSyntaxDataset(dataset),
      kept: [...keepSet].filter((field) => dataset.fields.some((candidate) => candidate.key === field)),
      dropped
    }
  };
}

function executeNOfCases(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const match = command.match(/^\s*N\s+OF\s+CASES\s+(\d+)\s*$/i);
  if (!match) throw new Error('N OF CASES requires an integer count, for example: N OF CASES 100.');
  const count = Math.max(0, Math.floor(Number(match[1]!)));
  const rows = context.currentDataset.rows.slice(0, count).map((row) => ({ ...row }));
  const dataset: CaseDataset = {
    caseCount: rows.length,
    fields: context.currentDataset.fields.map((field) => ({ ...field })),
    rows,
    notes: [...context.currentDataset.notes, { level: 'info', message: `N OF CASES limited active dataset to ${rows.length} row(s).` }]
  };
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'N_OF_CASES',
    status: 'ok',
    outputKind: 'dataset',
    message: `Limited dataset to ${rows.length} row(s).`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset) }
  };
}

function executeExecute(command: string): SyntaxCommandResult {
  return {
    command,
    commandName: 'EXECUTE',
    status: 'ok',
    outputKind: 'message',
    message: 'EXECUTE acknowledged (transformations in this engine are applied immediately).',
    output: {}
  };
}

function syntaxCommandAllowedInRowScope(commandName: string, command: string): boolean {
  if (commandName === 'COMPUTE' || commandName === 'IF' || commandName === 'RECODE' || commandName === 'AUTORECODE' || commandName === 'COUNT') {
    return true;
  }
  if (commandName === 'EXECUTE' || commandName === 'TEMPORARY') return true;
  if (commandName === 'STRING' || commandName === 'NUMERIC' || commandName === 'VARIABLE' || commandName === 'VALUE') return true;
  if (commandName === 'VECTOR') return true;
  if (commandName === 'DO' && /\bREPEAT\b/i.test(command)) return true;
  return false;
}

function escapeRegexPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function combineSyntaxRowMasks(baseMask: boolean[] | null, branchMask: boolean[]): boolean[] {
  if (!baseMask) return [...branchMask];
  return branchMask.map((flag, index) => Boolean(flag && baseMask[index]));
}

function ensureSyntaxNumericOrStringFields(
  context: SyntaxExecutionContext,
  command: string,
  valueType: DatasetValueType
): SyntaxCommandResult {
  const commandName = valueType === 'number' ? 'NUMERIC' : 'STRING';
  const body = command.replace(new RegExp(`^\\s*${commandName}\\s+`, 'i'), '').trim();
  if (!body) throw new Error(`${commandName} requires at least one variable name.`);
  const fieldSegment = body.split('(')[0]?.trim() ?? '';
  const fields = parseSyntaxTargetFieldList(fieldSegment);
  if (fields.length === 0) throw new Error(`${commandName} requires at least one valid variable name.`);

  let dataset = context.currentDataset;
  fields.forEach((fieldKey) => {
    dataset = ensureSyntaxField(dataset, fieldKey);
    dataset = {
      ...dataset,
      fields: dataset.fields.map((field) => field.key === fieldKey
        ? {
          ...field,
          source: 'variable',
          valueType
        }
        : field)
    };
  });
  dataset = refreshDatasetFieldTypes(dataset);
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName,
    status: 'ok',
    outputKind: 'dataset',
    message: `${commandName} declared ${fields.length} field(s).`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset), fields }
  };
}

function executeVector(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const body = command.replace(/^\s*VECTOR\s+/i, '').trim();
  if (!body) throw new Error('VECTOR requires syntax like VECTOR x(3) or VECTOR x = var1 var2.');
  let vectorName = '';
  let fields: string[] = [];
  if (body.includes('=')) {
    const [left, right] = body.split('=');
    vectorName = cleanSyntaxToken(left ?? '');
    const tokens = parseSyntaxTokens(right ?? '').map((token) => cleanSyntaxToken(token)).filter(Boolean);
    if (!vectorName || tokens.length === 0) throw new Error('VECTOR assignment requires a name and at least one field token.');
    let dataset = context.currentDataset;
    fields = tokens.map((token) => {
      try {
        return resolveSyntaxField(dataset, token);
      } catch {
        const nextField = normalizeFieldKey(token);
        dataset = ensureSyntaxField(dataset, nextField);
        return nextField;
      }
    });
    context.currentDataset = refreshDatasetFieldTypes(dataset);
  } else {
    const match = body.match(/^([A-Za-z_][\w$]*)\s*\(\s*(\d+)\s*\)/i);
    if (!match) throw new Error('VECTOR requires syntax like VECTOR x(3).');
    vectorName = cleanSyntaxToken(match[1]!);
    const size = Math.max(1, Math.floor(Number(match[2]!)));
    let dataset = context.currentDataset;
    fields = Array.from({ length: size }, (_unused, index) => normalizeFieldKey(`${vectorName}${index + 1}`));
    fields.forEach((fieldKey) => {
      dataset = ensureSyntaxField(dataset, fieldKey);
      dataset = {
        ...dataset,
        fields: dataset.fields.map((field) => field.key === fieldKey
          ? { ...field, source: 'variable', valueType: 'number' }
          : field)
      };
    });
    context.currentDataset = refreshDatasetFieldTypes(dataset);
  }
  context.vectorFields.set(vectorMapKey(vectorName), fields);
  syncActiveDataset(context);
  return {
    command,
    commandName: 'VECTOR',
    status: 'ok',
    outputKind: 'dataset',
    message: `Vector "${vectorName}" mapped to ${fields.length} field(s).`,
    output: { vector: vectorName, fields, datasetSummary: summarizeSyntaxDataset(context.currentDataset) }
  };
}

function substituteSyntaxTokens(command: string, replacements: Record<string, string>): string {
  let next = command;
  Object.entries(replacements).forEach(([token, value]) => {
    if (!token) return;
    const escaped = escapeRegexPattern(token);
    const pattern = token.startsWith('#')
      ? new RegExp(`${escaped}(?![A-Za-z0-9_])`, 'g')
      : new RegExp(`\\b${escaped}\\b`, 'g');
    next = next.replace(pattern, value);
  });
  return next;
}

function findSyntaxBlockEnd(
  commands: string[],
  startIndex: number,
  beginPattern: RegExp,
  endPattern: RegExp
): number {
  let depth = 0;
  for (let index = startIndex + 1; index < commands.length; index += 1) {
    const current = commands[index]!.trim();
    if (beginPattern.test(current)) {
      depth += 1;
      continue;
    }
    if (endPattern.test(current)) {
      if (depth === 0) return index;
      depth -= 1;
    }
  }
  return -1;
}

function parseSyntaxMacroParameters(specification: string): SyntaxMacroParameter[] {
  const params: SyntaxMacroParameter[] = [];
  const matcher = /(\/)?\s*(!?[A-Za-z_][\w$]*)\s*=\s*!(TOKENS|CMDEND)\s*(?:\(\s*(\d+)\s*\))?/gi;
  let match = matcher.exec(specification);
  while (match) {
    const name = cleanSyntaxToken(match[2] ?? '').replace(/^!+/, '');
    const key = normalizeSyntaxMacroKey(name);
    const mode = (match[3] ?? 'TOKENS').toUpperCase() === 'CMDEND' ? 'cmdend' : 'tokens';
    const width = Math.max(1, Math.floor(Number(match[4] ?? '1')));
    if (name && key) {
      params.push({
        name,
        key,
        mode,
        width,
        named: Boolean(match[1])
      });
    }
    match = matcher.exec(specification);
  }
  return params;
}

function substituteSyntaxMacroParameters(command: string, replacements: Record<string, string>): string {
  let output = command;
  for (const [token, value] of Object.entries(replacements)) {
    const pattern = new RegExp(`!${escapeRegexPattern(token)}\\b`, 'gi');
    output = output.replace(pattern, value);
  }
  return output;
}

function resolveSyntaxMacroInvocationArguments(definition: SyntaxMacroDefinition, rawArguments: string): Record<string, string> {
  const namedValues = new Map<string, string>();
  const namedPattern = /\/([A-Za-z_][\w$]*)\s*=\s*([\s\S]*?)(?=(?:\s\/[A-Za-z_][\w$]*\s*=)|$)/gi;
  let stripped = rawArguments;
  let match = namedPattern.exec(rawArguments);
  while (match) {
    const key = normalizeSyntaxMacroKey(match[1] ?? '');
    const value = (match[2] ?? '').trim();
    if (key) namedValues.set(key, value);
    stripped = stripped.replace(match[0], ' ');
    match = namedPattern.exec(rawArguments);
  }

  const positionalTokens = parseSyntaxTokens(stripped);
  const assignments: Record<string, string> = {};
  for (const parameter of definition.parameters) {
    const namedSource = namedValues.get(parameter.key);
    if (parameter.mode === 'cmdend') {
      if (namedSource !== undefined) {
        assignments[parameter.name] = namedSource.trim();
      } else {
        assignments[parameter.name] = positionalTokens.join(' ').trim();
        positionalTokens.splice(0, positionalTokens.length);
      }
      continue;
    }
    if (namedSource !== undefined) {
      const tokens = parseSyntaxTokens(namedSource);
      assignments[parameter.name] = tokens.slice(0, parameter.width).join(' ');
      continue;
    }
    const consumed = positionalTokens.splice(0, parameter.width);
    assignments[parameter.name] = consumed.join(' ');
  }
  return assignments;
}

function executeDefineMacroBlock(
  context: SyntaxExecutionContext,
  commands: string[],
  startIndex: number
): { result: SyntaxCommandResult; nextIndex: number } {
  const command = commands[startIndex]!;
  const endIndex = findSyntaxBlockEnd(commands, startIndex, /^\s*DEFINE\b/i, /^\s*!ENDDEFINE\b/i);
  if (endIndex < 0) {
    return {
      result: {
        command,
        commandName: 'DEFINE',
        status: 'error',
        outputKind: 'message',
        message: 'DEFINE block is missing !ENDDEFINE.'
      },
      nextIndex: startIndex
    };
  }
  const header = command.replace(/^\s*DEFINE\s+/i, '').trim();
  const nameMatch = header.match(/^(!?[A-Za-z_][\w$]*)\s*(?:\(([\s\S]*)\))?$/i);
  if (!nameMatch) {
    return {
      result: {
        command,
        commandName: 'DEFINE',
        status: 'error',
        outputKind: 'message',
        message: 'DEFINE requires syntax like DEFINE !macroName (a=!TOKENS(1)).'
      },
      nextIndex: endIndex
    };
  }
  const name = cleanSyntaxToken(nameMatch[1] ?? '').replace(/^!+/, '');
  const key = normalizeSyntaxMacroKey(name);
  const parameters = parseSyntaxMacroParameters(nameMatch[2] ?? '');
  context.macros.set(key, {
    name,
    key,
    parameters,
    body: commands.slice(startIndex + 1, endIndex).map((item) => item.trim()).filter(Boolean)
  });
  return {
    result: {
      command,
      commandName: 'DEFINE',
      status: 'ok',
      outputKind: 'message',
      message: `Defined macro !${name} with ${parameters.length} parameter(s).`,
      output: {
        macro: `!${name}`,
        parameters: parameters.map((parameter) => ({
          name: parameter.name,
          mode: parameter.mode,
          width: parameter.width,
          named: parameter.named
        })),
        bodyCommandCount: Math.max(0, endIndex - startIndex - 1)
      }
    },
    nextIndex: endIndex
  };
}

function executeSyntaxMacroInvocation(
  context: SyntaxExecutionContext,
  command: string,
  options?: DatasetAnalysisOptions
): SyntaxCommandResult {
  const invocationMatch = command.match(/^\s*(![A-Za-z_][\w$]*)\s*([\s\S]*)$/i);
  if (!invocationMatch) {
    return {
      command,
      commandName: 'MACRO',
      status: 'error',
      outputKind: 'message',
      message: `Invalid macro invocation "${command}".`
    };
  }
  const macroKey = normalizeSyntaxMacroKey(invocationMatch[1] ?? '');
  const definition = context.macros.get(macroKey);
  if (!definition) {
    return {
      command,
      commandName: 'MACRO',
      status: 'error',
      outputKind: 'message',
      message: `Macro ${invocationMatch[1]} is not defined.`
    };
  }
  if (context.macroDepth >= 25) {
    return {
      command,
      commandName: 'MACRO',
      status: 'error',
      outputKind: 'message',
      message: `Macro expansion depth exceeded safety limit while running !${definition.name}.`
    };
  }
  const replacements = resolveSyntaxMacroInvocationArguments(definition, invocationMatch[2] ?? '');
  const missingParameter = definition.parameters.find((parameter) => !replacements[parameter.name]?.trim());
  if (missingParameter) {
    return {
      command,
      commandName: 'MACRO',
      status: 'error',
      outputKind: 'message',
      message: `Macro !${definition.name} is missing a value for parameter !${missingParameter.name}.`
    };
  }
  const expandedCommands = definition.body.map((bodyCommand) => substituteSyntaxMacroParameters(bodyCommand, replacements));
  context.macroDepth += 1;
  try {
    const nestedResults = executeSyntaxProgramCommands(context, expandedCommands, options);
    const errors = nestedResults.filter((result) => result.status === 'error');
    return {
      command,
      commandName: `!${definition.name.toUpperCase()}`,
      status: errors.length === 0 ? 'ok' : 'error',
      outputKind: 'message',
      message: errors.length === 0
        ? `Macro !${definition.name} expanded into ${expandedCommands.length} command(s).`
        : `Macro !${definition.name} completed with ${errors.length} nested error(s).`,
      output: {
        expandedCommands,
        nestedCommandCount: nestedResults.length,
        nestedErrors: errors.map((entry) => entry.message)
      }
    };
  } finally {
    context.macroDepth = Math.max(0, context.macroDepth - 1);
  }
}

function ensureOutputDocument(
  context: SyntaxExecutionContext,
  name: string
): SyntaxOutputDocumentStore {
  const normalizedName = cleanSyntaxToken(name || 'OUTPUT').trim().toUpperCase() || 'OUTPUT';
  const existing = context.outputDocuments.get(normalizedName);
  if (existing) return existing;
  const created: SyntaxOutputDocumentStore = {
    name: normalizedName,
    records: [],
    createdAt: new Date().toISOString()
  };
  context.outputDocuments.set(normalizedName, created);
  return created;
}

function outputSubtypeForRecord(record: Pick<SyntaxOmsRecord, 'commandName' | 'outputKind'>): string {
  return `${normalizeSyntaxCommandName(record.commandName)}:${record.outputKind.toUpperCase()}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeOutputCellValue(value: unknown): DatasetValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map((item) => normalizeOutputCellValue(item)).join(', ');
  if (isPlainObject(value)) return JSON.stringify(value);
  return String(value);
}

function coerceOutputRows(value: unknown): Array<Record<string, DatasetValue>> {
  if (!Array.isArray(value) || value.length === 0) return [];
  if (value.every((entry) => isPlainObject(entry))) {
    return value.map((entry) => {
      const row: Record<string, DatasetValue> = {};
      for (const [key, cell] of Object.entries(entry)) {
        row[key] = normalizeOutputCellValue(cell);
      }
      return row;
    });
  }
  return value.map((entry, index) => ({
    index: index + 1,
    value: normalizeOutputCellValue(entry)
  }));
}

function buildOutputTableModel(
  id: string,
  title: string,
  commandName: string,
  outputKind: SyntaxCommandResult['outputKind'],
  rows: Array<Record<string, DatasetValue>>
): SyntaxOutputTableModel | null {
  if (rows.length === 0) return null;
  const columnSet = new Set<string>();
  for (const row of rows.slice(0, 200)) {
    for (const key of Object.keys(row)) columnSet.add(key);
  }
  const columns = [...columnSet];
  if (columns.length === 0) return null;
  const numericColumnCount = columns.filter((column) =>
    rows.some((row) => typeof row[column] === 'number')
  ).length;
  const categoricalColumnCount = columns.filter((column) =>
    rows.some((row) => typeof row[column] === 'string' || typeof row[column] === 'boolean')
  ).length;
  return {
    id,
    title,
    commandName,
    outputKind,
    columns,
    rows: rows.slice(0, 500),
    rowCount: rows.length,
    columnCount: columns.length,
    numericColumnCount,
    categoricalColumnCount,
    pivotable: rows.length > 1 && columns.length > 1
  };
}

function extractOutputTablesFromRecord(record: SyntaxOmsRecord): SyntaxOutputTableModel[] {
  const tables: SyntaxOutputTableModel[] = [];
  const queue: Array<{ value: unknown; title: string }> = [
    { value: record.output, title: `${record.commandName} output` }
  ];
  let tableIndex = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    const rows = coerceOutputRows(current.value);
    if (rows.length > 0) {
      const model = buildOutputTableModel(
        `${record.sequence}-${tableIndex + 1}`,
        current.title,
        record.commandName,
        record.outputKind,
        rows
      );
      if (model) {
        tables.push(model);
        tableIndex += 1;
      }
      continue;
    }
    if (isPlainObject(current.value)) {
      for (const [key, value] of Object.entries(current.value)) {
        if (Array.isArray(value) || isPlainObject(value)) {
          queue.push({
            value,
            title: `${current.title} · ${key}`
          });
        }
      }
    }
  }
  return tables;
}

function buildChartTemplatesFromTables(tables: SyntaxOutputTableModel[]): SyntaxChartTemplate[] {
  const templates: SyntaxChartTemplate[] = [];
  const paletteCycle: Array<SyntaxChartTemplate['palette']> = ['sand', 'ocean', 'forest', 'ember'];
  for (const table of tables) {
    const numericColumns = table.columns.filter((column) =>
      table.rows.some((row) => typeof row[column] === 'number')
    );
    const categoricalColumns = table.columns.filter((column) =>
      table.rows.some((row) => typeof row[column] === 'string' || typeof row[column] === 'boolean')
    );
    const xField = (categoricalColumns[0] ?? table.columns[0]) || '';
    const yField = numericColumns[0] ?? '';
    if (!xField || !yField) continue;
    const palette = paletteCycle[templates.length % paletteCycle.length]!;
    templates.push({
      id: `${table.id}-bar`,
      title: `${table.title} (bar)`,
      chartType: 'bar',
      sourceTableId: table.id,
      xField,
      yField,
      xScale: 'categorical',
      palette
    });
    templates.push({
      id: `${table.id}-line`,
      title: `${table.title} (line)`,
      chartType: 'line',
      sourceTableId: table.id,
      xField,
      yField,
      xScale: 'categorical',
      palette
    });
    if (numericColumns.length >= 2) {
      templates.push({
        id: `${table.id}-scatter`,
        title: `${table.title} (scatter)`,
        chartType: 'scatter',
        sourceTableId: table.id,
        xField: numericColumns[0]!,
        yField: numericColumns[1]!,
        xScale: 'numeric',
        palette
      });
    }
    templates.push({
      id: `${table.id}-area`,
      title: `${table.title} (area)`,
      chartType: 'area',
      sourceTableId: table.id,
      xField,
      yField,
      xScale: 'categorical',
      palette
    });
    templates.push({
      id: `${table.id}-histogram`,
      title: `${table.title} (histogram)`,
      chartType: 'histogram',
      sourceTableId: table.id,
      xField: yField,
      yField,
      xScale: 'numeric',
      palette
    });
    if (categoricalColumns.length > 0) {
      templates.push({
        id: `${table.id}-boxplot`,
        title: `${table.title} (boxplot)`,
        chartType: 'boxplot',
        sourceTableId: table.id,
        xField: categoricalColumns[0]!,
        yField,
        xScale: 'categorical',
        palette
      });
    }
  }
  return templates.slice(0, 80);
}

function buildOutputDocumentModel(
  name: string,
  records: SyntaxOmsRecord[],
  generatedAt = new Date().toISOString()
): SyntaxOutputDocumentModel {
  const groupNodes = new Map<string, SyntaxOutputTreeNode>();
  const tree: SyntaxOutputTreeNode[] = [];
  const tables: SyntaxOutputTableModel[] = [];
  const tableNodeIdByTableId = new Map<string, string>();
  for (const record of records) {
    const groupId = `group-${record.outputKind}`;
    if (!groupNodes.has(groupId)) {
      const groupNode: SyntaxOutputTreeNode = {
        id: groupId,
        parentId: null,
        level: 0,
        nodeType: 'group',
        title: record.outputKind.toUpperCase(),
        commandName: record.outputKind.toUpperCase(),
        outputKind: record.outputKind,
        subtype: `${record.outputKind.toUpperCase()}:GROUP`,
        sequence: 0,
        capturedAt: record.capturedAt
      };
      groupNodes.set(groupId, groupNode);
      tree.push(groupNode);
    }
    const commandNodeId = `record-${record.sequence}`;
    tree.push({
      id: commandNodeId,
      parentId: groupId,
      level: 1,
      nodeType: 'command',
      title: `${record.commandName} #${record.sequence}`,
      commandName: record.commandName,
      outputKind: record.outputKind,
      subtype: record.subtype,
      sequence: record.sequence,
      capturedAt: record.capturedAt
    });
    const recordTables = extractOutputTablesFromRecord(record);
    for (const table of recordTables) {
      tables.push(table);
      const tableNodeId = `table-${table.id}`;
      tableNodeIdByTableId.set(table.id, tableNodeId);
      tree.push({
        id: tableNodeId,
        parentId: commandNodeId,
        level: 2,
        nodeType: 'table',
        title: table.title,
        commandName: table.commandName,
        outputKind: table.outputKind,
        subtype: `${table.commandName}:TABLE`,
        sequence: record.sequence,
        capturedAt: record.capturedAt
      });
    }
  }
  const chartTemplates = buildChartTemplatesFromTables(tables);
  for (const [index, template] of chartTemplates.entries()) {
    const parentTableNodeId = tableNodeIdByTableId.get(template.sourceTableId) ?? null;
    tree.push({
      id: `chart-${template.id}`,
      parentId: parentTableNodeId,
      level: parentTableNodeId ? 3 : 1,
      nodeType: 'chart',
      title: template.title,
      commandName: 'CHART_TEMPLATE',
      outputKind: 'message',
      subtype: `CHART:${template.chartType.toUpperCase()}`,
      sequence: index + 1,
      capturedAt: generatedAt
    });
  }
  return {
    name,
    generatedAt,
    recordCount: records.length,
    tree,
    tables,
    chartTemplates
  };
}

function hashStringFnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function captureSyntaxOmsResult(context: SyntaxExecutionContext, result: SyntaxCommandResult): void {
  if (result.status !== 'ok') return;
  const normalizedCommand = normalizeSyntaxCommandName(result.commandName);
  if (normalizedCommand === 'OMS' || normalizedCommand === 'OMSEND' || normalizedCommand === 'OUTPUT') return;
  const subtype = `${normalizedCommand}:${result.outputKind.toUpperCase()}`;
  const baseRecord: Omit<SyntaxOmsRecord, 'sequence'> = {
    capturedAt: new Date().toISOString(),
    tag: context.oms.tag,
    commandName: normalizedCommand,
    command: result.command,
    outputKind: result.outputKind,
    subtype,
    message: result.message,
    output: deepCloneUnknown(result.output ?? null)
  };
  const targetName = context.oms.destinationViewer ?? context.activeOutputDocumentName;
  const documentStore = ensureOutputDocument(context, targetName);
  documentStore.records.push({
    ...baseRecord,
    sequence: documentStore.records.length + 1
  });
  context.activeOutputDocumentName = documentStore.name;
  if (!context.oms.active) return;
  if (context.oms.commandFilter && !context.oms.commandFilter.has(normalizedCommand)) return;
  if (context.oms.exceptCommandFilter && context.oms.exceptCommandFilter.has(normalizedCommand)) return;
  if (context.oms.subtypeFilter && !context.oms.subtypeFilter.has(subtype)) return;
  context.oms.records.push({
    ...baseRecord,
    sequence: context.oms.records.length + 1
  });
}

function executeOmsCommand(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  if (/^\s*OMS\s*(?:\/\s*)?END\b/i.test(command)) {
    const capturedCount = context.oms.records.length;
    context.oms.active = false;
    return {
      command,
      commandName: 'OMSEND',
      status: 'ok',
      outputKind: 'message',
      message: `OMS capture ended with ${capturedCount} captured output item(s).`,
      output: {
        capturedCount,
        tag: context.oms.tag
      }
    };
  }
  const commandsMatch = command.match(/COMMANDS\s*=\s*\[([^\]]+)\]/i);
  const commandFilter = commandsMatch
    ? new Set(
      parseSyntaxTokens(commandsMatch[1] ?? '')
        .map((token) => normalizeSyntaxCommandName(cleanSyntaxToken(token)))
        .filter(Boolean)
    )
    : null;
  const exceptMatch = command.match(/EXCEPTIF\s+COMMANDS\s*=\s*\[([^\]]+)\]/i);
  const exceptCommandFilter = exceptMatch
    ? new Set(
      parseSyntaxTokens(exceptMatch[1] ?? '')
        .map((token) => normalizeSyntaxCommandName(cleanSyntaxToken(token)))
        .filter(Boolean)
    )
    : null;
  const subtypeMatch = command.match(/SUBTYPES?\s*=\s*\[([^\]]+)\]/i);
  const subtypeFilter = subtypeMatch
    ? new Set(
      parseSyntaxTokens(subtypeMatch[1] ?? '')
        .map((token) => cleanSyntaxToken(token).trim().toUpperCase())
        .filter(Boolean)
    )
    : null;
  const formatMatch = command.match(/\bFORMAT\s*=\s*([A-Za-z_][\w-]*)/i);
  const destinationFormat = (formatMatch?.[1] ?? 'JSON').trim().toLowerCase() === 'text' ? 'text' : 'json';
  const outFileMatch = command.match(/\bOUTFILE\s*=\s*('[^']*'|"[^"]*"|[^\s/]+)/i);
  const destinationOutfile = outFileMatch ? cleanSyntaxToken(outFileMatch[1] ?? '') : null;
  const viewerMatch = command.match(/\bVIEWER\s*=\s*('[^']*'|"[^"]*"|[^\s/]+)/i);
  const destinationViewer = viewerMatch ? cleanSyntaxToken(viewerMatch[1] ?? '') : context.activeOutputDocumentName;
  const tagMatch = command.match(/\bTAG\s*=\s*('[^']*'|"[^"]*"|[^\s/]+)/i);
  const tag = tagMatch ? cleanSyntaxToken(tagMatch[1] ?? '') : null;
  const modeMatch = command.match(/\bMODE\s*=\s*(APPEND|REPLACE)/i);
  const mode: 'replace' | 'append' = /REPLACE/i.test(modeMatch?.[1] ?? '') ? 'replace' : 'append';
  if (mode === 'replace') {
    context.oms.records = [];
    const target = ensureOutputDocument(context, destinationViewer || context.activeOutputDocumentName);
    target.records = [];
  }
  context.oms.active = true;
  context.oms.tag = tag || null;
  context.oms.commandFilter = commandFilter && commandFilter.size > 0 ? commandFilter : null;
  context.oms.exceptCommandFilter = exceptCommandFilter && exceptCommandFilter.size > 0 ? exceptCommandFilter : null;
  context.oms.subtypeFilter = subtypeFilter && subtypeFilter.size > 0 ? subtypeFilter : null;
  context.oms.destinationFormat = destinationFormat;
  context.oms.destinationOutfile = destinationOutfile;
  context.oms.destinationViewer = destinationViewer || context.activeOutputDocumentName;
  context.oms.mode = mode;
  context.activeOutputDocumentName = ensureOutputDocument(context, context.oms.destinationViewer).name;
  return {
    command,
    commandName: 'OMS',
    status: 'ok',
    outputKind: 'message',
    message: `OMS capture started${context.oms.commandFilter ? ` for ${[...context.oms.commandFilter].join(', ')}` : ''}.`,
    output: {
      active: context.oms.active,
      tag: context.oms.tag,
      destination: {
        format: context.oms.destinationFormat,
        outfile: context.oms.destinationOutfile,
        viewer: context.oms.destinationViewer
      },
      mode: context.oms.mode,
      commandFilter: context.oms.commandFilter ? [...context.oms.commandFilter] : [],
      exceptCommandFilter: context.oms.exceptCommandFilter ? [...context.oms.exceptCommandFilter] : [],
      subtypeFilter: context.oms.subtypeFilter ? [...context.oms.subtypeFilter] : []
    }
  };
}

function executeOmsInfoCommand(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  return {
    command,
    commandName: 'OMSINFO',
    status: 'ok',
    outputKind: 'message',
    message: context.oms.active
      ? `OMS is active with ${context.oms.records.length} captured output item(s).`
      : `OMS is inactive with ${context.oms.records.length} captured output item(s).`,
    output: {
      active: context.oms.active,
      tag: context.oms.tag,
      destination: {
        format: context.oms.destinationFormat,
        outfile: context.oms.destinationOutfile,
        viewer: context.oms.destinationViewer
      },
      mode: context.oms.mode,
      commandFilter: context.oms.commandFilter ? [...context.oms.commandFilter] : [],
      exceptCommandFilter: context.oms.exceptCommandFilter ? [...context.oms.exceptCommandFilter] : [],
      subtypeFilter: context.oms.subtypeFilter ? [...context.oms.subtypeFilter] : [],
      capturedCount: context.oms.records.length
    }
  };
}

function executeOutputCommand(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const nameMatch = command.match(/\bNAME\s*=\s*('[^']*'|"[^"]*"|[^\s/]+)/i);
  const requestedName = nameMatch ? cleanSyntaxToken(nameMatch[1] ?? '') : '';
  const targetName = requestedName || context.activeOutputDocumentName || 'OUTPUT';
  if (/\bEXPORT\b/i.test(command)) {
    const formatMatch = command.match(/\bFORMAT\s*=\s*([A-Za-z_][\w-]*)/i);
    const format = (formatMatch?.[1] ?? context.oms.destinationFormat).toLowerCase() === 'text' ? 'text' : 'json';
    const outFileMatch = command.match(/\bOUTFILE\s*=\s*('[^']*'|"[^"]*"|[^\s/]+)/i);
    const outfile = outFileMatch ? cleanSyntaxToken(outFileMatch[1] ?? '') : context.oms.destinationOutfile;
    const contentsMatch = command.match(/\bCONTENTS\s*=\s*([A-Za-z_][\w-]*)/i);
    const contents = (contentsMatch?.[1] ?? 'OMS').toUpperCase();
    const documentStore = ensureOutputDocument(context, targetName);
    const recordSource = contents === 'ALL'
      ? [...context.outputDocuments.values()].flatMap((document) => document.records)
      : contents === 'ACTIVE'
        ? documentStore.records
        : context.oms.records;
    const generatedAt = new Date().toISOString();
    const activeDocument = buildOutputDocumentModel(documentStore.name, documentStore.records, generatedAt);
    const allDocuments = [...context.outputDocuments.values()].map((entry) =>
      buildOutputDocumentModel(entry.name, entry.records, generatedAt)
    );
    const documentMap = Object.fromEntries(allDocuments.map((entry) => [entry.name, entry]));
    const outputPack: SyntaxOutputPack = {
      version: 1,
      generatedAt,
      syntaxHash: hashStringFnv1a(JSON.stringify({
        records: recordSource,
        outputDocuments: [...context.outputDocuments.entries()],
        targetName: documentStore.name,
        contents
      })),
      commandCount: recordSource.length,
      successfulCommandCount: recordSource.length,
      activeDocumentName: documentStore.name,
      documentNames: allDocuments.map((entry) => entry.name),
      documents: documentMap
    };
    const payload = format === 'text'
      ? recordSource.map((record) => `[${record.sequence}] ${record.commandName}: ${record.message}`).join('\n')
      : {
        contents,
        recordCount: recordSource.length,
        records: recordSource,
        activeDocument,
        outputPack
      };
    return {
      command,
      commandName: 'OUTPUT_EXPORT',
      status: 'ok',
      outputKind: 'message',
      message: `Prepared OUTPUT EXPORT payload (${recordSource.length} item(s)) from ${contents}.`,
      output: {
        format,
        outfile,
        contents,
        recordCount: recordSource.length,
        outputDocumentName: documentStore.name,
        payload
      }
    };
  }
  if (/\bACTIVATE\b/i.test(command)) {
    const documentStore = ensureOutputDocument(context, targetName);
    context.activeOutputDocumentName = documentStore.name;
    context.oms.destinationViewer = documentStore.name;
    return {
      command,
      commandName: 'OUTPUT_ACTIVATE',
      status: 'ok',
      outputKind: 'message',
      message: `Activated OUTPUT document "${documentStore.name}".`,
      output: {
        activeOutputDocumentName: documentStore.name,
        documentNames: [...context.outputDocuments.keys()].sort((left, right) => left.localeCompare(right))
      }
    };
  }
  if (/\bCLOSE\b/i.test(command)) {
    const normalizedTarget = cleanSyntaxToken(targetName || 'OUTPUT').toUpperCase();
    if (normalizedTarget === 'OMS' || normalizedTarget === 'OUTPUT') {
      context.oms.records = [];
      const activeDocument = ensureOutputDocument(context, context.activeOutputDocumentName);
      activeDocument.records = [];
    } else {
      context.outputDocuments.delete(normalizedTarget);
      if (context.activeOutputDocumentName === normalizedTarget) {
        context.activeOutputDocumentName = 'OUTPUT';
      }
    }
    return {
      command,
      commandName: 'OUTPUT_CLOSE',
      status: 'ok',
      outputKind: 'message',
      message: `Closed OUTPUT document "${normalizedTarget}".`,
      output: {
        closed: normalizedTarget,
        activeOutputDocumentName: context.activeOutputDocumentName,
        documentNames: [...context.outputDocuments.keys()].sort((left, right) => left.localeCompare(right))
      }
    };
  }
  if (/\bNEW\b/i.test(command)) {
    const documentStore = ensureOutputDocument(context, targetName || `OUTPUT_${context.outputDocuments.size + 1}`);
    documentStore.records = [];
    documentStore.createdAt = new Date().toISOString();
    context.activeOutputDocumentName = documentStore.name;
    context.oms.destinationViewer = documentStore.name;
    return {
      command,
      commandName: 'OUTPUT_NEW',
      status: 'ok',
      outputKind: 'message',
      message: `Created OUTPUT document "${documentStore.name}".`,
      output: {
        activeOutputDocumentName: documentStore.name,
        documentNames: [...context.outputDocuments.keys()].sort((left, right) => left.localeCompare(right))
      }
    };
  }
  throw new Error('Supported OUTPUT commands: EXPORT, ACTIVATE, CLOSE, NEW.');
}

function executeRegisteredSyntaxExtension(
  context: SyntaxExecutionContext,
  command: string,
  commandName: string,
  args: string,
  body: string[]
): SyntaxCommandResult {
  const normalized = normalizeSyntaxCommandName(commandName);
  const handler = syntaxExtensionRegistry.get(normalized);
  if (!handler) {
    return {
      command,
      commandName: normalized || commandName,
      status: 'error',
      outputKind: 'message',
      message: `Extension command "${commandName}" is not registered.`
    };
  }
  const invocation: SyntaxExtensionInvocation = {
    command,
    commandName: normalized,
    args: args.trim(),
    body: body.map((item) => item.trim()),
    dataset: cloneCaseDataset(context.currentDataset),
    analysisOptions: { ...context.syntaxAnalysisOptions }
  };
  try {
    const extensionResult = handler(invocation) ?? {};
    if (extensionResult.dataset) {
      context.currentDataset = refreshDatasetFieldTypes(cloneCaseDataset(extensionResult.dataset));
      syncActiveDataset(context);
    }
    return {
      command,
      commandName: normalized,
      status: extensionResult.status ?? 'ok',
      outputKind: extensionResult.outputKind ?? 'message',
      message: extensionResult.message ?? `Extension command "${normalized}" completed.`,
      output: extensionResult.output ?? {}
    };
  } catch (error) {
    return {
      command,
      commandName: normalized,
      status: 'error',
      outputKind: 'message',
      message: error instanceof Error ? error.message : `Extension command "${normalized}" failed.`
    };
  }
}

function executeBeginProgramBlock(
  context: SyntaxExecutionContext,
  commands: string[],
  startIndex: number
): { result: SyntaxCommandResult; nextIndex: number } {
  const command = commands[startIndex]!;
  const endIndex = findSyntaxBlockEnd(commands, startIndex, /^\s*BEGIN\s+PROGRAM\b/i, /^\s*END\s+PROGRAM\b/i);
  if (endIndex < 0) {
    return {
      result: {
        command,
        commandName: 'BEGIN_PROGRAM',
        status: 'error',
        outputKind: 'message',
        message: 'BEGIN PROGRAM block is missing END PROGRAM.'
      },
      nextIndex: startIndex
    };
  }
  const match = command.match(/^\s*BEGIN\s+PROGRAM(?:\s+([A-Za-z_][\w.-]*))?/i);
  const extensionName = normalizeSyntaxCommandName(match?.[1] ?? 'PROGRAM');
  const body = commands.slice(startIndex + 1, endIndex);
  const result = executeRegisteredSyntaxExtension(
    context,
    command,
    extensionName,
    '',
    body
  );
  return { result, nextIndex: endIndex };
}

function executeSyntaxProgramCommands(
  context: SyntaxExecutionContext,
  commands: string[],
  options?: DatasetAnalysisOptions
): SyntaxCommandResult[] {
  const results: SyntaxCommandResult[] = [];
  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index]!.trim();
    if (!command) continue;
    if (/^\s*DEFINE\b/i.test(command)) {
      const block = executeDefineMacroBlock(context, commands, index);
      results.push(block.result);
      captureSyntaxOmsResult(context, block.result);
      index = block.nextIndex;
      continue;
    }
    if (/^\s*!ENDDEFINE\b/i.test(command)) {
      const result: SyntaxCommandResult = {
        command,
        commandName: '!ENDDEFINE',
        status: 'error',
        outputKind: 'message',
        message: 'Unexpected !ENDDEFINE without a matching DEFINE block.'
      };
      results.push(result);
      continue;
    }
    if (/^\s*BEGIN\s+PROGRAM\b/i.test(command)) {
      const block = executeBeginProgramBlock(context, commands, index);
      results.push(block.result);
      captureSyntaxOmsResult(context, block.result);
      index = block.nextIndex;
      continue;
    }
    if (/^\s*END\s+PROGRAM\b/i.test(command)) {
      const result: SyntaxCommandResult = {
        command,
        commandName: 'END_PROGRAM',
        status: 'error',
        outputKind: 'message',
        message: 'Unexpected END PROGRAM without BEGIN PROGRAM.'
      };
      results.push(result);
      continue;
    }
    if (/^DO\s+IF\b/i.test(command)) {
      const block = executeDoIfBlock(context, commands, index, options);
      results.push(block.result);
      captureSyntaxOmsResult(context, block.result);
      index = block.nextIndex;
      continue;
    }
    if (/^DO\s+REPEAT\b/i.test(command)) {
      const block = executeDoRepeatBlock(context, commands, index, options);
      results.push(block.result);
      captureSyntaxOmsResult(context, block.result);
      index = block.nextIndex;
      continue;
    }
    if (/^\s*LOOP\b/i.test(command)) {
      const block = executeLoopBlock(context, commands, index, options);
      results.push(block.result);
      captureSyntaxOmsResult(context, block.result);
      index = block.nextIndex;
      continue;
    }
    if (/^(END\s+IF|END\s+REPEAT|END\s+LOOP|ELSE\s+IF|ELSE)\b/i.test(command)) {
      results.push({
        command,
        commandName: command.split(/\s+/)[0]?.toUpperCase() ?? 'UNKNOWN',
        status: 'error',
        outputKind: 'message',
        message: `Unexpected control token "${command}" without a matching block opener.`
      });
      continue;
    }
    if (/^\s*![A-Za-z_][\w$]*/.test(command)) {
      const macroResult = executeSyntaxMacroInvocation(context, command, options);
      results.push(macroResult);
      captureSyntaxOmsResult(context, macroResult);
      continue;
    }
    const commandResult = runSyntaxCommand(context, command, options);
    results.push(commandResult);
    captureSyntaxOmsResult(context, commandResult);
  }
  return results;
}

function executeDoIfBlock(
  context: SyntaxExecutionContext,
  commands: string[],
  startIndex: number,
  options?: DatasetAnalysisOptions
): { result: SyntaxCommandResult; nextIndex: number } {
  const command = commands[startIndex]!;
  const condition = command.replace(/^\s*DO\s+IF\s+/i, '').trim();
  if (!condition) {
    return {
      result: {
        command,
        commandName: 'DO_IF',
        status: 'error',
        outputKind: 'message',
        message: 'DO IF requires a condition expression.'
      },
      nextIndex: startIndex
    };
  }
  const endIndex = findSyntaxBlockEnd(commands, startIndex, /^DO\s+IF\b/i, /^END\s+IF\b/i);
  if (endIndex < 0) {
    return {
      result: {
        command,
        commandName: 'DO_IF',
        status: 'error',
        outputKind: 'message',
        message: 'DO IF block is missing END IF.'
      },
      nextIndex: startIndex
    };
  }

  const branches: Array<{ condition: string | null; commands: string[] }> = [{ condition, commands: [] }];
  for (let index = startIndex + 1; index < endIndex; index += 1) {
    const inner = commands[index]!.trim();
    if (/^ELSE\s+IF\b/i.test(inner)) {
      branches.push({ condition: inner.replace(/^ELSE\s+IF\s+/i, '').trim(), commands: [] });
      continue;
    }
    if (/^ELSE$/i.test(inner)) {
      branches.push({ condition: null, commands: [] });
      continue;
    }
    branches[branches.length - 1]!.commands.push(inner);
  }

  const rowCount = context.currentDataset.rows.length;
  const priorMask = context.rowMask ? [...context.rowMask] : null;
  const unmatched = Array.from({ length: rowCount }, (_unused, rowIndex) => syntaxRowMaskAllows(context, rowIndex));
  const branchMasks = branches.map(() => Array.from({ length: rowCount }, () => false));
  context.currentDataset.rows.forEach((row, rowIndex) => {
    if (!unmatched[rowIndex]) return;
    for (let branchIndex = 0; branchIndex < branches.length; branchIndex += 1) {
      const branch = branches[branchIndex]!;
      const matches = branch.condition === null
        ? true
        : isSyntaxTruthy(evaluateSyntaxExpression(context, context.currentDataset, row, branch.condition));
      if (!matches) continue;
      branchMasks[branchIndex]![rowIndex] = true;
      unmatched[rowIndex] = false;
      break;
    }
  });

  const branchResults: SyntaxCommandResult[] = [];
  for (let branchIndex = 0; branchIndex < branches.length; branchIndex += 1) {
    const branch = branches[branchIndex]!;
    const scopedMask = combineSyntaxRowMasks(priorMask, branchMasks[branchIndex]!);
    if (!scopedMask.some(Boolean)) continue;
    context.rowMask = scopedMask;
    branchResults.push(...executeSyntaxProgramCommands(context, branch.commands, options));
  }
  context.rowMask = priorMask;
  const errors = branchResults.filter((result) => result.status === 'error');
  return {
    result: {
      command,
      commandName: 'DO_IF',
      status: errors.length === 0 ? 'ok' : 'error',
      outputKind: 'message',
      message: errors.length === 0
        ? `DO IF evaluated ${branches.length} branch(es).`
        : `DO IF completed with ${errors.length} nested command error(s).`,
      output: {
        branchCount: branches.length,
        nestedCommands: branchResults.length,
        nestedErrors: errors.map((entry) => entry.message)
      }
    },
    nextIndex: endIndex
  };
}

function executeDoRepeatBlock(
  context: SyntaxExecutionContext,
  commands: string[],
  startIndex: number,
  options?: DatasetAnalysisOptions
): { result: SyntaxCommandResult; nextIndex: number } {
  const command = commands[startIndex]!;
  const endIndex = findSyntaxBlockEnd(commands, startIndex, /^DO\s+REPEAT\b/i, /^END\s+REPEAT\b/i);
  if (endIndex < 0) {
    return {
      result: {
        command,
        commandName: 'DO_REPEAT',
        status: 'error',
        outputKind: 'message',
        message: 'DO REPEAT block is missing END REPEAT.'
      },
      nextIndex: startIndex
    };
  }
  const header = command.replace(/^\s*DO\s+REPEAT\s+/i, '').trim();
  const definitions = header
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const parts = segment.split('=');
      if (parts.length < 2) return null;
      const name = cleanSyntaxToken(parts[0] ?? '');
      const values = parseSyntaxTokens(parts.slice(1).join('=')).map((token) => cleanSyntaxToken(token)).filter(Boolean);
      if (!name || values.length === 0) return null;
      return { name, values };
    })
    .filter((entry): entry is { name: string; values: string[] } => entry !== null);
  if (definitions.length === 0) {
    return {
      result: {
        command,
        commandName: 'DO_REPEAT',
        status: 'error',
        outputKind: 'message',
        message: 'DO REPEAT requires iterator definitions, for example DO REPEAT v = var1 var2.'
      },
      nextIndex: endIndex
    };
  }
  const repeatCount = definitions[0]!.values.length;
  if (!definitions.every((definition) => definition.values.length === repeatCount)) {
    return {
      result: {
        command,
        commandName: 'DO_REPEAT',
        status: 'error',
        outputKind: 'message',
        message: 'DO REPEAT iterator lists must have matching lengths in this implementation.'
      },
      nextIndex: endIndex
    };
  }
  const bodyCommands = commands.slice(startIndex + 1, endIndex);
  const nestedResults: SyntaxCommandResult[] = [];
  for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
    const replacements: Record<string, string> = {};
    definitions.forEach((definition) => {
      replacements[definition.name] = definition.values[repeatIndex]!;
    });
    const substituted = bodyCommands.map((item) => substituteSyntaxTokens(item, replacements));
    nestedResults.push(...executeSyntaxProgramCommands(context, substituted, options));
  }
  const errors = nestedResults.filter((result) => result.status === 'error');
  return {
    result: {
      command,
      commandName: 'DO_REPEAT',
      status: errors.length === 0 ? 'ok' : 'error',
      outputKind: 'message',
      message: errors.length === 0
        ? `DO REPEAT executed ${repeatCount} cycle(s).`
        : `DO REPEAT completed with ${errors.length} nested command error(s).`,
      output: {
        cycles: repeatCount,
        nestedCommands: nestedResults.length,
        nestedErrors: errors.map((entry) => entry.message)
      }
    },
    nextIndex: endIndex
  };
}

function executeLoopBlock(
  context: SyntaxExecutionContext,
  commands: string[],
  startIndex: number,
  options?: DatasetAnalysisOptions
): { result: SyntaxCommandResult; nextIndex: number } {
  const command = commands[startIndex]!;
  const endIndex = findSyntaxBlockEnd(commands, startIndex, /^\s*LOOP\b/i, /^END\s+LOOP\b/i);
  if (endIndex < 0) {
    return {
      result: {
        command,
        commandName: 'LOOP',
        status: 'error',
        outputKind: 'message',
        message: 'LOOP block is missing END LOOP.'
      },
      nextIndex: startIndex
    };
  }
  const header = command.match(/^\s*LOOP\s+([#A-Za-z_][\w$]*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+BY\s+(.+))?$/i);
  if (!header) {
    return {
      result: {
        command,
        commandName: 'LOOP',
        status: 'error',
        outputKind: 'message',
        message: 'LOOP requires syntax: LOOP #i = start TO end [BY step].'
      },
      nextIndex: endIndex
    };
  }
  const loopToken = cleanSyntaxToken(header[1]!);
  const loopField = normalizeFieldKey(loopToken.replace(/^#/, ''));
  const startValue = Number(parseSyntaxValueToken(header[2] ?? ''));
  const endValue = Number(parseSyntaxValueToken(header[3] ?? ''));
  const stepValue = header[4] ? Number(parseSyntaxValueToken(header[4])) : (startValue <= endValue ? 1 : -1);
  if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || !Number.isFinite(stepValue) || stepValue === 0) {
    return {
      result: {
        command,
        commandName: 'LOOP',
        status: 'error',
        outputKind: 'message',
        message: 'LOOP start/end/step must resolve to finite numeric values, and BY cannot be 0.'
      },
      nextIndex: endIndex
    };
  }
  context.currentDataset = ensureSyntaxField(context.currentDataset, loopField);
  const bodyCommands = commands.slice(startIndex + 1, endIndex);
  const nestedResults: SyntaxCommandResult[] = [];
  let cycles = 0;
  const shouldContinue = (value: number) => stepValue > 0 ? value <= endValue : value >= endValue;
  for (let cursor = startValue; shouldContinue(cursor); cursor += stepValue) {
    cycles += 1;
    context.currentDataset = refreshDatasetFieldTypes({
      ...context.currentDataset,
      rows: context.currentDataset.rows.map((row, rowIndex) => {
        if (!syntaxRowMaskAllows(context, rowIndex)) return { ...row };
        return { ...row, [loopField]: cursor };
      })
    });
    syncActiveDataset(context);
    const replacements: Record<string, string> = {
      [loopToken]: String(cursor)
    };
    if (!loopToken.startsWith('#')) {
      replacements[`#${loopToken}`] = String(cursor);
    } else {
      replacements[loopToken.replace(/^#/, '')] = String(cursor);
    }
    const substituted = bodyCommands.map((item) => substituteSyntaxTokens(item, replacements));
    nestedResults.push(...executeSyntaxProgramCommands(context, substituted, options));
    if (cycles >= 10000) {
      nestedResults.push({
        command,
        commandName: 'LOOP',
        status: 'error',
        outputKind: 'message',
        message: 'LOOP exceeded safety limit (10000 cycles).'
      });
      break;
    }
  }
  const errors = nestedResults.filter((result) => result.status === 'error');
  return {
    result: {
      command,
      commandName: 'LOOP',
      status: errors.length === 0 ? 'ok' : 'error',
      outputKind: 'message',
      message: errors.length === 0
        ? `LOOP executed ${cycles} cycle(s).`
        : `LOOP completed with ${errors.length} nested command error(s).`,
      output: {
        cycles,
        loopField,
        nestedCommands: nestedResults.length,
        nestedErrors: errors.map((entry) => entry.message)
      }
    },
    nextIndex: endIndex
  };
}

function runSplitAware(
  context: SyntaxExecutionContext,
  outputKind: SyntaxCommandResult['outputKind'],
  message: string,
  runner: (dataset: CaseDataset) => unknown
): Pick<SyntaxCommandResult, 'outputKind' | 'message' | 'output'> {
  const analysisDataset = filterDatasetForSyntaxAnalysis(context);
  if (context.splitFields.length === 0) {
    return { outputKind, message, output: runner(analysisDataset) };
  }
  const groups = [...groupRowsByFields(analysisDataset.rows, context.splitFields).values()].map((group) => {
    const scoped: CaseDataset = {
      caseCount: group.rows.length,
      fields: analysisDataset.fields.map((field) => ({ ...field })),
      rows: group.rows.map((row) => ({ ...row })),
      notes: analysisDataset.notes.map((note) => ({ ...note }))
    };
    try {
      return { group: group.groupValues, caseCount: scoped.caseCount, output: runner(scoped) };
    } catch (error) {
      return { group: group.groupValues, caseCount: scoped.caseCount, error: error instanceof Error ? error.message : 'Split subgroup failed.' };
    }
  });
  return {
    outputKind,
    message: `${message} Split by ${context.splitFields.join(', ')} (${groups.length} groups)${context.filterField ? ` with FILTER ${context.filterField}` : ''}.`,
    output: { splitBy: context.splitFields, groups }
  };
}

function executeCompute(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const match = command.match(/^\s*COMPUTE\s+([A-Za-z_][\w$]*(?:\([^)]*\))?)\s*=\s*(.+)$/i);
  if (!match) throw new Error('COMPUTE requires syntax: COMPUTE target = expression.');
  const targetExpression = match[1]!.trim();
  const expression = match[2]!.trim();
  const vectorTarget = /^([A-Za-z_][\w$]*)\((.+)\)$/.test(targetExpression);
  const fixedTargetField = vectorTarget ? null : normalizeFieldKey(targetExpression);
  let dataset = fixedTargetField ? ensureSyntaxField(context.currentDataset, fixedTargetField) : context.currentDataset;
  const rows = dataset.rows.map((row, index) => {
    if (!syntaxRowMaskAllows(context, index)) return { ...row };
    const targetField = resolveSyntaxVectorField(context, dataset, targetExpression, row) ?? fixedTargetField;
    if (!targetField) throw new Error(`Unable to resolve COMPUTE target "${targetExpression}".`);
    return {
      ...row,
      [targetField]: evaluateSyntaxExpression(context, dataset, row, expression)
    };
  });
  dataset = refreshDatasetFieldTypes({
    ...dataset,
    caseCount: rows.length,
    rows,
    notes: [...dataset.notes, { level: 'info', message: `COMPUTE set "${targetExpression}".` }]
  });
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'COMPUTE',
    status: 'ok',
    outputKind: 'dataset',
    message: `Computed "${targetExpression}" for ${rows.length} row(s).`,
    output: {
      datasetSummary: summarizeSyntaxDataset(dataset),
      preview: fixedTargetField
        ? rows.slice(0, 10).map((row) => ({ case_id: row.case_id ?? null, [fixedTargetField]: row[fixedTargetField] ?? null }))
        : rows.slice(0, 10).map((row) => ({ case_id: row.case_id ?? null }))
    }
  };
}

function executeIfCompute(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const match = command.match(/^\s*IF\s+(.+?)\s+([A-Za-z_][\w$]*(?:\([^)]*\))?)\s*=\s*(.+)$/i);
  if (!match) throw new Error('IF requires syntax: IF condition target = expression.');
  const conditionExpression = match[1]!.trim();
  const targetExpression = match[2]!.trim();
  const computeExpression = match[3]!.trim();
  const vectorTarget = /^([A-Za-z_][\w$]*)\((.+)\)$/.test(targetExpression);
  const fixedTargetField = vectorTarget ? null : normalizeFieldKey(targetExpression);
  let dataset = fixedTargetField ? ensureSyntaxField(context.currentDataset, fixedTargetField) : context.currentDataset;
  let updated = 0;
  const rows = dataset.rows.map((row, index) => {
    if (!syntaxRowMaskAllows(context, index)) return { ...row };
    const condition = evaluateSyntaxExpression(context, dataset, row, conditionExpression);
    const active = condition === true || condition === 1 || condition === '1' || condition === 'true';
    if (!active) return { ...row };
    const targetField = resolveSyntaxVectorField(context, dataset, targetExpression, row) ?? fixedTargetField;
    if (!targetField) throw new Error(`Unable to resolve IF target "${targetExpression}".`);
    updated += 1;
    return {
      ...row,
      [targetField]: evaluateSyntaxExpression(context, dataset, row, computeExpression)
    };
  });
  dataset = refreshDatasetFieldTypes({
    ...dataset,
    caseCount: rows.length,
    rows,
    notes: [...dataset.notes, { level: 'info', message: `IF updated "${targetExpression}" for ${updated} row(s).` }]
  });
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'IF',
    status: 'ok',
    outputKind: 'dataset',
    message: `IF updated ${updated} row(s).`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset), updatedRows: updated }
  };
}

function executeAggregate(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const clauses = parseSyntaxClauses(command);
  const breakFields = parseSyntaxFieldList(context.currentDataset, clauses.find((clause) => clause.key === 'BREAK')?.value ?? '');
  const assignmentClauses = clauses.filter((clause) => clause.key !== 'BREAK');
  if (assignmentClauses.length === 0) throw new Error('AGGREGATE requires output assignments, for example /mean_score=MEAN(score).');

  const groups = groupRowsByFields(context.currentDataset.rows, breakFields);
  const rows: DatasetRow[] = [];
  for (const group of groups.values()) {
    const row: DatasetRow = {};
    for (const field of breakFields) row[field] = group.groupValues[field] ?? null;
    for (const clause of assignmentClauses) {
      const targetField = normalizeFieldKey(clause.rawKey);
      if (!targetField) continue;
      const fnMatch = clause.value.match(/^([A-Za-z_][\w]*)\s*(?:\(([^)]*)\))?$/);
      if (!fnMatch) throw new Error(`Invalid AGGREGATE expression "${clause.value}".`);
      const fn = fnMatch[1]!.toUpperCase();
      const argField = fnMatch[2] ? resolveSyntaxField(context.currentDataset, fnMatch[2]) : null;
      const values = argField ? group.rows.map((sourceRow) => sourceRow[argField] ?? null) : [];
      const numerics = values.filter((value): value is number => typeof value === 'number');
      if (fn === 'N') row[targetField] = group.rows.length;
      else if (fn === 'SUM') row[targetField] = numerics.reduce((total, value) => total + value, 0);
      else if (fn === 'MEAN') row[targetField] = numerics.length > 0 ? numerics.reduce((total, value) => total + value, 0) / numerics.length : null;
      else if (fn === 'MIN') row[targetField] = numerics.length > 0 ? Math.min(...numerics) : null;
      else if (fn === 'MAX') row[targetField] = numerics.length > 0 ? Math.max(...numerics) : null;
      else if (fn === 'COUNT') row[targetField] = values.filter((value) => value !== null).length;
      else throw new Error(`Unsupported AGGREGATE function "${fn}".`);
    }
    rows.push(row);
  }

  const fieldOrder = [...new Set([...breakFields, ...assignmentClauses.map((clause) => normalizeFieldKey(clause.rawKey)).filter(Boolean)])];
  const existing = new Map(context.currentDataset.fields.map((field) => [field.key, field]));
  const dataset = refreshDatasetFieldTypes({
    caseCount: rows.length,
    fields: fieldOrder.map((fieldKey) => ({
      key: fieldKey!,
      label: existing.get(fieldKey!)?.label ?? fieldKey!,
      source: existing.get(fieldKey!)?.source ?? 'variable',
      valueType: 'null'
    })),
    rows,
    notes: [...context.currentDataset.notes, { level: 'info', message: `AGGREGATE generated ${rows.length} grouped row(s).` }]
  });
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'AGGREGATE',
    status: 'ok',
    outputKind: 'dataset',
    message: `Aggregated to ${rows.length} row(s).`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset), preview: rows.slice(0, 20) }
  };
}

function executeRank(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const sourceFields = parseSyntaxFieldList(context.currentDataset, extractSyntaxClause(command, 'VARIABLES') ?? '');
  if (sourceFields.length === 0) throw new Error('RANK requires /VARIABLES=...');
  const byFields = parseSyntaxFieldList(context.currentDataset, extractSyntaxClause(command, 'BY') ?? '');
  const intoClause = command.match(/\/RANK\s+INTO\s*=?\s*([^/]+)/i)?.[1]?.trim() ?? '';
  const intoFields = intoClause
    ? intoClause.split(/[\s,]+/).map((value) => normalizeFieldKey(value)).filter(Boolean)
    : [];
  const targetFields = sourceFields.map((sourceField, index) => intoFields[index] || `${sourceField}_rank`);
  let dataset = context.currentDataset;
  for (const targetField of targetFields) dataset = ensureSyntaxField(dataset, targetField);
  const rows = dataset.rows.map((row) => ({ ...row }));
  const rowIndexLookup = new Map(context.currentDataset.rows.map((row, index) => [row, index]));
  const groups = groupRowsByFields(context.currentDataset.rows, byFields);
  for (const group of groups.values()) {
    for (let fieldIndex = 0; fieldIndex < sourceFields.length; fieldIndex += 1) {
      const sourceField = sourceFields[fieldIndex]!;
      const targetField = targetFields[fieldIndex]!;
      const ranked = group.rows
        .map((row) => ({ row, value: row[sourceField] }))
        .filter((entry): entry is { row: DatasetRow; value: number } => typeof entry.value === 'number');
      if (ranked.length === 0) continue;
      const ranks = rankValues(ranked.map((entry) => entry.value));
      ranked.forEach((entry, index) => {
        const rowIndex = rowIndexLookup.get(entry.row);
        if (rowIndex === undefined) return;
        rows[rowIndex]![targetField] = ranks[index]!;
      });
    }
  }
  dataset = refreshDatasetFieldTypes({ ...dataset, caseCount: rows.length, rows, notes: [...dataset.notes, { level: 'info', message: `RANK created ${targetFields.length} rank field(s).` }] });
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'RANK',
    status: 'ok',
    outputKind: 'dataset',
    message: `Ranked ${sourceFields.length} field(s).`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset), rankFields: targetFields }
  };
}

function executeSortCases(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const specs = parseSortSpecifications(context.currentDataset, command);
  if (specs.length === 0) throw new Error('SORT CASES requires BY field(s), for example SORT CASES BY score(D).');

  const rows = context.currentDataset.rows
    .map((row) => ({ ...row }))
    .sort((left, right) => {
      for (const spec of specs) {
        const delta = compareSyntaxValues(left[spec.field] ?? null, right[spec.field] ?? null);
        if (delta !== 0) return spec.descending ? -delta : delta;
      }
      return 0;
    });
  const dataset: CaseDataset = {
    caseCount: rows.length,
    fields: context.currentDataset.fields.map((field) => ({ ...field })),
    rows,
    notes: [...context.currentDataset.notes, { level: 'info', message: `SORT CASES applied (${specs.map((spec) => `${spec.field}${spec.descending ? ' D' : ' A'}`).join(', ')}).` }]
  };
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'SORT_CASES',
    status: 'ok',
    outputKind: 'dataset',
    message: `Sorted ${rows.length} row(s) by ${specs.map((spec) => spec.field).join(', ')}.`,
    output: {
      datasetSummary: summarizeSyntaxDataset(dataset),
      sortOrder: specs.map((spec) => ({ field: spec.field, direction: spec.descending ? 'D' : 'A' }))
    }
  };
}

function executeAddFiles(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const clauses = parseSyntaxClauses(command);
  const fileClauses = clauses
    .filter((clause) => clause.key === 'FILE')
    .map((clause) => cleanSyntaxToken(clause.value))
    .filter(Boolean);
  const sourceAliases = fileClauses.length > 0 ? fileClauses : [context.activeDatasetName];
  const datasets = sourceAliases.map((alias) => {
    const resolvedAlias = alias === '*' ? context.activeDatasetName : alias;
    const dataset = resolvedAlias === context.activeDatasetName
      ? context.currentDataset
      : context.datasets.get(resolvedAlias);
    if (!dataset) throw new Error(`Dataset "${resolvedAlias}" not found.`);
    return { alias: resolvedAlias, dataset: cloneCaseDataset(dataset) };
  });
  if (datasets.length === 0) throw new Error('ADD FILES requires at least one /FILE clause.');

  const byClause = clauses.find((clause) => clause.key === 'BY')?.value ?? '';
  const byFields = byClause ? parseSyntaxFieldList(context.currentDataset, byClause) : [];
  const fieldOrder: string[] = [];
  const fieldMeta = new Map<string, DatasetField>();
  for (const source of datasets) {
    source.dataset.fields.forEach((field) => {
      if (!fieldMeta.has(field.key)) {
        fieldMeta.set(field.key, { ...field });
        fieldOrder.push(field.key);
      }
    });
  }

  const rows: DatasetRow[] = [];
  for (const source of datasets) {
    source.dataset.rows.forEach((row) => {
      const nextRow: DatasetRow = {};
      fieldOrder.forEach((field) => {
        nextRow[field] = row[field] ?? null;
      });
      rows.push(nextRow);
    });
  }

  if (byFields.length > 0) {
    rows.sort((left, right) => {
      for (const field of byFields) {
        const delta = compareSyntaxValues(left[field] ?? null, right[field] ?? null);
        if (delta !== 0) return delta;
      }
      return 0;
    });
  }

  const dataset = refreshDatasetFieldTypes({
    caseCount: rows.length,
    fields: fieldOrder.map((field): DatasetField => {
      const existing = fieldMeta.get(field);
      if (existing) return { ...existing };
      return { key: field, label: field, source: 'variable', valueType: 'null' };
    }),
    rows,
    notes: [
      ...context.currentDataset.notes,
      { level: 'info', message: `ADD FILES combined ${datasets.length} dataset(s).` }
    ]
  });
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'ADD_FILES',
    status: 'ok',
    outputKind: 'dataset',
    message: `Added ${datasets.length} file(s) into ${rows.length} row(s).`,
    output: {
      datasetSummary: summarizeSyntaxDataset(dataset),
      sourceAliases: datasets.map((entry) => entry.alias),
      sortedBy: byFields
    }
  };
}

function executeSplitFileCommand(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  if (/\bOFF\b/i.test(command)) {
    context.splitFields = [];
    return {
      command,
      commandName: 'SPLIT_FILE',
      status: 'ok',
      outputKind: 'message',
      message: 'Split file mode turned off.',
      output: { splitFields: [] }
    };
  }
  const splitFields = parseSplitByFields(context.currentDataset, command);
  if (splitFields.length === 0) throw new Error('SPLIT FILE requires BY fields or OFF.');
  context.splitFields = splitFields;
  return {
    command,
    commandName: 'SPLIT_FILE',
    status: 'ok',
    outputKind: 'message',
    message: `Split file mode enabled for ${splitFields.join(', ')}.`,
    output: { splitFields }
  };
}

function executeReshape(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  if (/\bLONG\b/i.test(command)) {
    const idFields = parseSyntaxFieldList(context.currentDataset, extractSyntaxClause(command, 'ID') ?? 'case_id');
    const sourceFields = parseSyntaxFieldList(context.currentDataset, extractSyntaxClause(command, 'VARIABLES') ?? extractSyntaxClause(command, 'FROM') ?? '');
    if (sourceFields.length === 0) throw new Error('RESHAPE LONG requires /VARIABLES list.');
    const indexField = normalizeFieldKey(extractSyntaxClause(command, 'INDEX') ?? 'reshape_index');
    const valueField = normalizeFieldKey(extractSyntaxClause(command, 'VALUE') ?? 'reshape_value');
    const passthroughFields = context.currentDataset.fields
      .map((field) => field.key)
      .filter((field) => !sourceFields.includes(field));
    const rows: DatasetRow[] = [];
    for (const row of context.currentDataset.rows) {
      sourceFields.forEach((sourceField, index) => {
        const nextRow: DatasetRow = {};
        passthroughFields.forEach((field) => { nextRow[field] = row[field] ?? null; });
        idFields.forEach((field) => { nextRow[field] = row[field] ?? null; });
        nextRow[indexField] = index + 1;
        nextRow[valueField] = row[sourceField] ?? null;
        rows.push(nextRow);
      });
    }
    const fieldOrder = [...new Set([...passthroughFields, ...idFields, indexField, valueField])];
    const fieldMap = new Map<string, DatasetField>(context.currentDataset.fields.map((field) => [field.key, field]));
    const dataset = refreshDatasetFieldTypes({
      caseCount: rows.length,
      fields: fieldOrder.map((field): DatasetField => {
        const existing = fieldMap.get(field);
        return {
          key: field,
          label: existing?.label ?? field,
          source: existing?.source ?? 'variable',
          valueType: 'null'
        };
      }),
      rows,
      notes: [...context.currentDataset.notes, { level: 'info', message: 'RESHAPE LONG completed.' }]
    });
    context.currentDataset = dataset;
    syncActiveDataset(context);
    return {
      command,
      commandName: 'RESHAPE_LONG',
      status: 'ok',
      outputKind: 'dataset',
      message: `Reshape long created ${rows.length} row(s).`,
      output: { datasetSummary: summarizeSyntaxDataset(dataset) }
    };
  }

  if (/\bWIDE\b/i.test(command)) {
    const idFields = parseSyntaxFieldList(context.currentDataset, extractSyntaxClause(command, 'ID') ?? 'case_id');
    const indexField = resolveSyntaxField(context.currentDataset, extractSyntaxClause(command, 'INDEX') ?? 'reshape_index');
    const valueField = resolveSyntaxField(context.currentDataset, extractSyntaxClause(command, 'VALUE') ?? 'reshape_value');
    const rawPrefix = cleanSyntaxToken(extractSyntaxClause(command, 'PREFIX') ?? `${valueField}_`);
    const normalizedPrefix = rawPrefix.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+/, '');
    const prefixBase = normalizedPrefix.replace(/_+$/, '') || normalizeFieldKey(valueField);
    const prefix = normalizedPrefix.endsWith('_') ? normalizedPrefix : `${prefixBase}_`;
    const passthroughFields = context.currentDataset.fields
      .map((field) => field.key)
      .filter((field) => !idFields.includes(field) && field !== indexField && field !== valueField);
    const groups = groupRowsByFields(context.currentDataset.rows, idFields);
    const rows: DatasetRow[] = [];
    const generatedFields = new Set<string>();
    for (const group of groups.values()) {
      const nextRow: DatasetRow = {};
      idFields.forEach((field) => { nextRow[field] = group.groupValues[field] ?? null; });
      passthroughFields.forEach((field) => {
        nextRow[field] = group.rows.find((row) => row[field] !== null)?.[field] ?? null;
      });
      group.rows.forEach((row) => {
        const suffix = formatValue(row[indexField] ?? null).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
        const key = `${prefix}${suffix || 'value'}`;
        generatedFields.add(key);
        nextRow[key] = row[valueField] ?? null;
      });
      rows.push(nextRow);
    }
    const fieldMap = new Map<string, DatasetField>(context.currentDataset.fields.map((field) => [field.key, field]));
    const fields: DatasetField[] = [
      ...idFields.map((field): DatasetField => {
        const existing = fieldMap.get(field);
        return {
          key: field,
          label: existing?.label ?? field,
          source: existing?.source ?? 'variable',
          valueType: 'null'
        };
      }),
      ...passthroughFields.map((field): DatasetField => {
        const existing = fieldMap.get(field);
        return {
          key: field,
          label: existing?.label ?? field,
          source: existing?.source ?? 'variable',
          valueType: 'null'
        };
      }),
      ...[...generatedFields].sort((left, right) => left.localeCompare(right)).map((field): DatasetField => ({
        key: field,
        label: field,
        source: 'variable',
        valueType: 'null'
      }))
    ];
    const dataset = refreshDatasetFieldTypes({
      caseCount: rows.length,
      fields,
      rows,
      notes: [...context.currentDataset.notes, { level: 'info', message: 'RESHAPE WIDE completed.' }]
    });
    context.currentDataset = dataset;
    syncActiveDataset(context);
    return {
      command,
      commandName: 'RESHAPE_WIDE',
      status: 'ok',
      outputKind: 'dataset',
      message: `Reshape wide created ${rows.length} row(s).`,
      output: { datasetSummary: summarizeSyntaxDataset(dataset), generatedFields: [...generatedFields].sort((left, right) => left.localeCompare(right)) }
    };
  }

  throw new Error('RESHAPE requires LONG or WIDE mode.');
}

function executeDatasetCommand(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  if (/^\s*DATASET\s+NAME\s+/i.test(command)) {
    const match = command.match(/^\s*DATASET\s+NAME\s+([A-Za-z_][\w-]*)/i);
    if (!match) throw new Error('DATASET NAME requires a dataset alias.');
    context.activeDatasetName = cleanSyntaxToken(match[1]!);
    syncActiveDataset(context);
    return { command, commandName: 'DATASET_NAME', status: 'ok', outputKind: 'message', message: `Active dataset renamed to "${context.activeDatasetName}".`, output: { activeDatasetName: context.activeDatasetName } };
  }
  if (/^\s*DATASET\s+COPY\s+/i.test(command)) {
    const match = command.match(/^\s*DATASET\s+COPY\s+([A-Za-z_][\w-]*)/i);
    if (!match) throw new Error('DATASET COPY requires a target alias.');
    const alias = cleanSyntaxToken(match[1]!);
    context.datasets.set(alias, cloneCaseDataset(context.currentDataset));
    return { command, commandName: 'DATASET_COPY', status: 'ok', outputKind: 'message', message: `Dataset copied to "${alias}".`, output: { datasetNames: [...context.datasets.keys()] } };
  }
  if (/^\s*DATASET\s+ACTIVATE\s+/i.test(command)) {
    const match = command.match(/^\s*DATASET\s+ACTIVATE\s+([A-Za-z_][\w-]*)/i);
    if (!match) throw new Error('DATASET ACTIVATE requires an alias.');
    const alias = cleanSyntaxToken(match[1]!);
    const source = context.datasets.get(alias);
    if (!source) throw new Error(`Dataset "${alias}" not found.`);
    context.currentDataset = cloneCaseDataset(source);
    context.activeDatasetName = alias;
    return { command, commandName: 'DATASET_ACTIVATE', status: 'ok', outputKind: 'dataset', message: `Activated dataset "${alias}".`, output: { datasetSummary: summarizeSyntaxDataset(context.currentDataset) } };
  }
  if (command.trim().toUpperCase() === 'DATASET LIST') {
    return { command, commandName: 'DATASET_LIST', status: 'ok', outputKind: 'message', message: `Datasets: ${[...context.datasets.keys()].join(', ') || 'none'}.`, output: { activeDatasetName: context.activeDatasetName, datasetNames: [...context.datasets.keys()] } };
  }
  throw new Error('Supported DATASET commands: NAME, COPY, ACTIVATE, LIST.');
}

function executeMatchFiles(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const sourceAliasRaw = extractSyntaxClause(command, 'FILE') ?? context.activeDatasetName;
  const tableAliasRaw = extractSyntaxClause(command, 'TABLE');
  const byClause = extractSyntaxClause(command, 'BY');
  if (!tableAliasRaw || !byClause) throw new Error('MATCH FILES requires /TABLE and /BY clauses.');
  const sourceAlias = sourceAliasRaw === '*' ? context.activeDatasetName : cleanSyntaxToken(sourceAliasRaw);
  const tableAlias = cleanSyntaxToken(tableAliasRaw);
  const sourceDataset = sourceAlias === context.activeDatasetName ? cloneCaseDataset(context.currentDataset) : cloneCaseDataset(context.datasets.get(sourceAlias) ?? (() => { throw new Error(`Dataset "${sourceAlias}" not found.`); })());
  const tableDataset = cloneCaseDataset(context.datasets.get(tableAlias) ?? (() => { throw new Error(`Dataset "${tableAlias}" not found.`); })());
  const byFields = parseSyntaxFieldList(sourceDataset, byClause);
  if (byFields.length === 0) throw new Error('MATCH FILES /BY requires key fields.');
  byFields.forEach((field) => { resolveSyntaxField(tableDataset, field); });
  const tableFields = tableDataset.fields.map((field) => field.key).filter((field) => !byFields.includes(field));
  const sourceFieldSet = new Set(sourceDataset.fields.map((field) => field.key));
  const mapping = new Map<string, string>();
  for (const field of tableFields) {
    const mapped = sourceFieldSet.has(field) ? `${field}_table` : field;
    mapping.set(field, mapped);
    sourceFieldSet.add(mapped);
  }
  const keyFor = (row: DatasetRow) => JSON.stringify(byFields.map((field) => row[field] ?? null));
  const tableIndex = new Map<string, DatasetRow[]>();
  tableDataset.rows.forEach((row) => {
    const key = keyFor(row);
    const bucket = tableIndex.get(key) ?? [];
    bucket.push(row);
    tableIndex.set(key, bucket);
  });
  const rows: DatasetRow[] = [];
  sourceDataset.rows.forEach((row) => {
    const matches = tableIndex.get(keyFor(row)) ?? [];
    if (matches.length === 0) {
      const merged: DatasetRow = { ...row };
      tableFields.forEach((field) => { merged[mapping.get(field)!] = null; });
      rows.push(merged);
      return;
    }
    matches.forEach((match) => {
      const merged: DatasetRow = { ...row };
      tableFields.forEach((field) => { merged[mapping.get(field)!] = match[field] ?? null; });
      rows.push(merged);
    });
  });
  const fields: DatasetField[] = [
    ...sourceDataset.fields.map((field) => ({ ...field })),
    ...tableFields.map((field) => ({ key: mapping.get(field)!, label: mapping.get(field)!, source: 'variable' as const, valueType: 'null' as const }))
  ];
  const dataset = refreshDatasetFieldTypes({
    caseCount: rows.length,
    fields,
    rows,
    notes: [...context.currentDataset.notes, { level: 'info', message: `MATCH FILES merged "${sourceAlias}" with "${tableAlias}".` }]
  });
  context.currentDataset = dataset;
  syncActiveDataset(context);
  return {
    command,
    commandName: 'MATCH_FILES',
    status: 'ok',
    outputKind: 'dataset',
    message: `Merged "${sourceAlias}" with "${tableAlias}" on ${byFields.join(', ')}.`,
    output: { datasetSummary: summarizeSyntaxDataset(dataset), tableFieldMap: Object.fromEntries([...mapping.entries()]) }
  };
}

function filterSyntaxDatasetByFieldValues(dataset: CaseDataset, fieldKey: string, allowedValues: DatasetValue[]): CaseDataset {
  if (allowedValues.length === 0) return dataset;
  const allowed = new Set(allowedValues.map((value) => formatValue(value)));
  const rows = dataset.rows
    .filter((row) => allowed.has(formatValue(row[fieldKey] ?? null)))
    .map((row) => ({ ...row }));
  return {
    caseCount: rows.length,
    fields: dataset.fields.map((field) => ({ ...field })),
    rows,
    notes: [...dataset.notes, { level: 'info', message: `Filtered ${fieldKey} to explicit group values (${allowedValues.map((value) => formatValue(value)).join(', ')}).` }]
  };
}

function parseSyntaxFieldCandidates(dataset: CaseDataset, clause: string): string[] {
  const candidates = parseSyntaxTokens(clause)
    .map((token) => cleanSyntaxToken(token))
    .filter((token) => /^[A-Za-z_][\w$]*$/.test(token));
  const resolved: string[] = [];
  for (const candidate of candidates) {
    try {
      resolved.push(resolveSyntaxField(dataset, candidate));
    } catch {
      continue;
    }
  }
  return [...new Set(resolved)];
}

function executeTTestSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const analysisOptions = context.syntaxAnalysisOptions;
  if (/\bPAIRS\s*=/i.test(command)) {
    const pairClause = extractSyntaxClauseLoose(command, 'PAIRS');
    const pairMatch = pairClause?.match(/([A-Za-z_][\w$]*)\s+WITH\s+([A-Za-z_][\w$]*)/i);
    if (!pairMatch) throw new Error('T-TEST paired syntax requires /PAIRS=before WITH after.');
    const beforeField = resolveSyntaxField(context.currentDataset, pairMatch[1] ?? '');
    const afterField = resolveSyntaxField(context.currentDataset, pairMatch[2] ?? '');
    const splitAware = runSplitAware(
      context,
      'message',
      `Returned paired t-test for ${beforeField} WITH ${afterField}.`,
      (dataset) => analyzePairedTTest(dataset, beforeField, afterField, analysisOptions)
    );
    return {
      command,
      commandName: 'T_TEST_PAIRED',
      status: 'ok',
      ...splitAware
    };
  }

  const variableClause = extractSyntaxClause(command, 'VARIABLES') ?? extractSyntaxClauseLoose(command, 'VARIABLES') ?? '';
  const outcomeField = parseSyntaxFieldList(context.currentDataset, variableClause)[0];
  if (!outcomeField) throw new Error('T-TEST requires /VARIABLES=outcomeField.');
  const groupsClause = extractSyntaxClause(command, 'GROUPS') ?? extractSyntaxClauseLoose(command, 'GROUPS') ?? '';
  const groupsMatch = groupsClause.match(/^([A-Za-z_][\w$]*)\s*(?:\(([^)]*)\))?$/i);
  if (!groupsMatch) throw new Error('T-TEST requires /GROUPS=groupField(value1 value2).');
  const groupField = resolveSyntaxField(context.currentDataset, groupsMatch[1] ?? '');
  const explicitValues = groupsMatch[2]
    ? parseSyntaxTokens(groupsMatch[2]).map((token) => parseSyntaxValueToken(token))
    : [];

  const splitAware = runSplitAware(
    context,
    'message',
    `Returned independent t-test for ${outcomeField} by ${groupField}.`,
    (dataset) => {
      const scoped = filterSyntaxDatasetByFieldValues(dataset, groupField, explicitValues);
      return analyzeTTest(scoped, outcomeField, groupField, analysisOptions);
    }
  );
  return {
    command,
    commandName: 'T_TEST',
    status: 'ok',
    ...splitAware
  };
}

function executeNparTestsSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const match = command.match(/(?:MANN-?WHITNEY|K-?W(?:ALLIS)?)\s*=\s*([A-Za-z_][\w$]*)\s+BY\s+([A-Za-z_][\w$]*)(?:\(([^)]*)\))?/i);
  if (!match) throw new Error('NPAR TESTS requires syntax such as /MANN-WHITNEY=outcome BY group.');
  const method = /MANN-?WHITNEY/i.test(match[0] ?? '') ? 'mann_whitney' : 'kruskal_wallis';
  const outcomeField = resolveSyntaxField(context.currentDataset, match[1] ?? '');
  const groupField = resolveSyntaxField(context.currentDataset, match[2] ?? '');
  const explicitValues = match[3]
    ? parseSyntaxTokens(match[3]).map((token) => parseSyntaxValueToken(token))
    : [];
  const splitAware = runSplitAware(
    context,
    'message',
    `Returned ${method === 'mann_whitney' ? 'Mann-Whitney' : 'Kruskal-Wallis'} output for ${outcomeField} by ${groupField}.`,
    (dataset) => {
      const scoped = filterSyntaxDatasetByFieldValues(dataset, groupField, explicitValues);
      return analyzeNonparametricComparison(scoped, outcomeField, groupField, context.syntaxAnalysisOptions);
    }
  );
  return {
    command,
    commandName: 'NPAR_TESTS',
    status: 'ok',
    ...splitAware
  };
}

function executeOneWaySyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const match = command.match(/^\s*ONEWAY\s+([A-Za-z_][\w$]*)\s+BY\s+([A-Za-z_][\w$]*)/i);
  if (!match) throw new Error('ONEWAY requires syntax: ONEWAY outcome BY group.');
  const outcomeField = resolveSyntaxField(context.currentDataset, match[1] ?? '');
  const groupField = resolveSyntaxField(context.currentDataset, match[2] ?? '');
  const splitAware = runSplitAware(
    context,
    'message',
    `Returned one-way ANOVA output for ${outcomeField} by ${groupField}.`,
    (dataset) => analyzeCompareMeans(dataset, outcomeField, groupField, context.syntaxAnalysisOptions)
  );
  return {
    command,
    commandName: 'ONEWAY',
    status: 'ok',
    ...splitAware
  };
}

function executeMeansSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const tablesClause = extractSyntaxClause(command, 'TABLES')
    ?? extractSyntaxClauseLoose(command, 'TABLES')
    ?? command.replace(/^\s*MEANS\b/i, '');
  const match = tablesClause.match(/([A-Za-z_][\w$]*)\s+BY\s+([A-Za-z_][\w$]*)/i);
  if (!match) throw new Error('MEANS requires TABLES syntax such as MEANS TABLES=outcome BY group.');
  const outcomeField = resolveSyntaxField(context.currentDataset, match[1] ?? '');
  const groupField = resolveSyntaxField(context.currentDataset, match[2] ?? '');
  const splitAware = runSplitAware(
    context,
    'message',
    `Returned MEANS output for ${outcomeField} by ${groupField}.`,
    (dataset) => analyzeCompareMeans(dataset, outcomeField, groupField, context.syntaxAnalysisOptions)
  );
  return {
    command,
    commandName: 'MEANS',
    status: 'ok',
    ...splitAware
  };
}

function executeLogisticRegressionSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const dependentToken = command.match(/^\s*LOGISTIC\s+REGRESSION\s+([A-Za-z_][\w$]*)/i)?.[1]
    ?? extractSyntaxClause(command, 'DEPENDENT')
    ?? extractSyntaxClauseLoose(command, 'DEPENDENT');
  if (!dependentToken) {
    throw new Error('LOGISTIC REGRESSION requires a dependent field.');
  }
  const dependentField = resolveSyntaxField(context.currentDataset, dependentToken);
  const methodMatches = [...command.matchAll(/METHOD\s*=\s*ENTER\s+([^/]+)/ig)];
  const predictorClause = methodMatches.map((match) => String(match[1] ?? '')).join(' ')
    || extractSyntaxClause(command, 'PREDICTORS')
    || extractSyntaxClauseLoose(command, 'PREDICTORS')
    || '';
  const predictorFields = parseSyntaxFieldCandidates(context.currentDataset, predictorClause)
    .filter((field) => field !== dependentField);
  if (predictorFields.length === 0) {
    throw new Error('LOGISTIC REGRESSION requires one or more predictors via METHOD=ENTER.');
  }
  const splitAware = runSplitAware(
    context,
    'regression',
    `Returned logistic regression output for ${dependentField}.`,
    (dataset) => analyzeRegression(dataset, dependentField, predictorFields, 'logistic', context.syntaxAnalysisOptions)
  );
  return {
    command,
    commandName: 'LOGISTIC_REGRESSION',
    status: 'ok',
    ...splitAware
  };
}

function executeCoxRegSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const timeToken = command.match(/^\s*COXREG\s+([A-Za-z_][\w$]*)/i)?.[1]
    ?? extractSyntaxClause(command, 'TIME')
    ?? extractSyntaxClauseLoose(command, 'TIME');
  if (!timeToken) throw new Error('COXREG requires a time field.');
  const timeField = resolveSyntaxField(context.currentDataset, timeToken);
  const statusClause = extractSyntaxClause(command, 'STATUS')
    ?? extractSyntaxClauseLoose(command, 'STATUS')
    ?? '';
  const statusMatch = statusClause.match(/^([A-Za-z_][\w$]*)(?:\s*\(\s*([^)]*)\s*\))?$/i);
  if (!statusMatch) throw new Error('COXREG requires STATUS=statusField(eventValue).');
  const statusField = resolveSyntaxField(context.currentDataset, statusMatch[1] ?? '');
  const eventToken = cleanSyntaxToken(statusMatch[2] ?? '1');
  const eventValue = parseSyntaxValueToken(eventToken || '1');
  const strataClause = extractSyntaxClause(command, 'STRATA') ?? extractSyntaxClauseLoose(command, 'STRATA');
  const groupField = strataClause ? parseSyntaxFieldCandidates(context.currentDataset, strataClause)[0] ?? null : null;
  const methodMatches = [...command.matchAll(/METHOD\s*=\s*ENTER\s+([^/]+)/ig)];
  const predictorClause = methodMatches.map((match) => String(match[1] ?? '')).join(' ')
    || extractSyntaxClause(command, 'PREDICTORS')
    || extractSyntaxClauseLoose(command, 'PREDICTORS')
    || '';
  const predictors = parseSyntaxFieldCandidates(context.currentDataset, predictorClause)
    .filter((field) => field !== timeField && field !== statusField && field !== groupField);
  const tieMethod: 'breslow' | 'efron' = /\bTIES\s*=\s*EFRON\b/i.test(command) ? 'efron' : 'breslow';
  const confidenceLevel = parseSyntaxConfidenceLevel(command) ?? undefined;

  const splitAware = runSplitAware(
    context,
    'message',
    `Returned COXREG survival output for ${timeField} with status ${statusField}.`,
    (dataset) => {
      const derivedStatusField = '__coxreg_status_binary';
      const fields = dataset.fields.some((field) => field.key === derivedStatusField)
        ? dataset.fields.map((field) => ({ ...field }))
        : [
          ...dataset.fields.map((field) => ({ ...field })),
          { key: derivedStatusField, label: derivedStatusField, source: 'variable' as const, valueType: 'number' as const }
        ];
      const rows = dataset.rows.map((row) => ({
        ...row,
        [derivedStatusField]: formatValue(row[statusField] ?? null) === formatValue(eventValue) ? 1 : 0
      }));
      const scopedDataset = refreshDatasetFieldTypes({
        caseCount: rows.length,
        fields,
        rows,
        notes: [...dataset.notes]
      });
      return analyzeSurvivalAnalysis(
        scopedDataset,
        timeField,
        derivedStatusField,
        groupField ?? undefined,
        context.syntaxAnalysisOptions,
        predictors,
        {
          tieMethod,
          confidenceLevel
        }
      );
    }
  );
  return {
    command,
    commandName: 'COXREG',
    status: 'ok',
    ...splitAware
  };
}

function executeUnianovaSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const mappedCommand = command.replace(/^\s*UNIANOVA\b/i, 'GLM');
  const glmResult = executeGlmSyntax(context, mappedCommand);
  return {
    ...glmResult,
    command,
    commandName: 'UNIANOVA'
  };
}

function executeReliabilitySyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const variablesClause = extractSyntaxClause(command, 'VARIABLES') ?? extractSyntaxClauseLoose(command, 'VARIABLES') ?? '';
  const fields = parseSyntaxFieldList(context.currentDataset, variablesClause);
  if (fields.length < 2) throw new Error('RELIABILITY requires at least two /VARIABLES fields.');
  const strataClause = extractSyntaxClause(command, 'STRATA') ?? extractSyntaxClauseLoose(command, 'STRATA');
  const stratifyField = strataClause ? parseSyntaxFieldList(context.currentDataset, strataClause)[0] : undefined;
  const splitAware = runSplitAware(
    context,
    'message',
    `Returned reliability output for ${fields.length} field(s).`,
    (dataset) => analyzeReliability(dataset, fields, context.syntaxAnalysisOptions, undefined, stratifyField)
  );
  return {
    command,
    commandName: 'RELIABILITY',
    status: 'ok',
    ...splitAware
  };
}

function executeFactorSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const variablesClause = extractSyntaxClause(command, 'VARIABLES') ?? extractSyntaxClauseLoose(command, 'VARIABLES') ?? '';
  const fields = parseSyntaxFieldList(context.currentDataset, variablesClause);
  if (fields.length < 2) throw new Error('FACTOR requires at least two /VARIABLES fields.');
  const factorCountMatch = command.match(/FACTORS?\s*\(\s*(\d+)\s*\)|FACTORS?\s*=\s*(\d+)/i);
  const requestedFactorCount = factorCountMatch ? Number(factorCountMatch[1] ?? factorCountMatch[2]) : undefined;
  const rotation = /\bPROMAX\b/i.test(command) ? 'promax'
    : /\bQUARTIMAX\b/i.test(command) ? 'quartimax'
    : /\bVARIMAX\b/i.test(command) ? 'varimax'
      : 'none';
  const extraction = /\bPAF\b/i.test(command) || /\bPRINCIPAL[_\s-]*AXIS\b/i.test(command)
    ? 'principal_axis'
    : 'principal_components';
  const maxIterations = parseSyntaxNumericSetting(command, [
    /\bMAXITER\s*\(\s*(\d+)\s*\)/i,
    /\bMAXITER\s*=\s*(\d+)/i
  ]);
  const convergenceTolerance = parseSyntaxNumericSetting(command, [
    /\bCONVERGE\s*\(\s*([0-9.eE+-]+)\s*\)/i,
    /\bCONVERGE\s*=\s*([0-9.eE+-]+)/i,
    /\bTOL(?:ERANCE)?\s*=\s*([0-9.eE+-]+)/i
  ]);
  const parallelAnalysisSamples = parseSyntaxNumericSetting(command, [
    /\bPARALLEL\s*\(\s*(\d+)\s*\)/i,
    /\bPARALLEL\s*=\s*(\d+)/i,
    /\bPA_SAMPLES\s*=\s*(\d+)/i
  ]);
  const confidenceLevel = parseSyntaxConfidenceLevel(command);
  const splitAware = runSplitAware(
    context,
    'message',
    `Returned factor analysis output for ${fields.length} field(s).`,
    (dataset) => analyzeFactorAnalysis(
      dataset,
      fields,
      requestedFactorCount,
      context.syntaxAnalysisOptions,
      rotation,
      extraction,
      {
        maxIterations: maxIterations ?? undefined,
        convergenceTolerance: convergenceTolerance ?? undefined,
        parallelAnalysisSamples: parallelAnalysisSamples ?? undefined,
        confidenceLevel: confidenceLevel ?? undefined
      }
    )
  );
  return {
    command,
    commandName: 'FACTOR',
    status: 'ok',
    ...splitAware
  };
}

function executeCTablesSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const tableClause = extractSyntaxClause(command, 'TABLE') ?? extractSyntaxClauseLoose(command, 'TABLE');
  if (!tableClause) throw new Error('CTABLES requires a /TABLE clause.');
  const [rowClause, columnClause] = tableClause.split(/\bBY\b/i).map((segment) => segment.trim());
  const rowFields = parseSyntaxFieldCandidates(context.currentDataset, rowClause.replace(/[+*><[\]]+/g, ' '));
  if (rowFields.length === 0) throw new Error('CTABLES requires at least one valid row field in /TABLE.');
  const columnField = columnClause
    ? parseSyntaxFieldCandidates(context.currentDataset, columnClause.replace(/[+*><[\]]+/g, ' '))[0] ?? null
    : null;
  const measureClause = extractSyntaxClause(command, 'MEASURES') ?? extractSyntaxClauseLoose(command, 'MEASURES') ?? '';
  const measureFields = measureClause
    ? parseSyntaxFieldCandidates(context.currentDataset, measureClause.replace(/[+*><[\]]+/g, ' '))
    : [];
  const splitAware = runSplitAware(
    context,
    'message',
    `Returned custom table output with ${rowFields.length} row field(s).`,
    (dataset) => buildCustomTable(dataset, rowFields, columnField, measureFields, context.syntaxAnalysisOptions)
  );
  return {
    command,
    commandName: 'CTABLES',
    status: 'ok',
    ...splitAware
  };
}

function executeGlmSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const dependentToken = command.match(/^\s*(?:GLM|GENLIN)\s+([A-Za-z_][\w$]*)/i)?.[1]
    ?? extractSyntaxClause(command, 'DEPENDENT')
    ?? extractSyntaxClauseLoose(command, 'DEPENDENT');
  if (!dependentToken) throw new Error('GLM/GENLIN requires a dependent field.');
  const dependentField = resolveSyntaxField(context.currentDataset, dependentToken);
  const byClause = extractSyntaxClause(command, 'BY')
    ?? command.match(/\bBY\s+([^/]+)/i)?.[1]
    ?? '';
  const withClause = extractSyntaxClause(command, 'WITH')
    ?? command.match(/\bWITH\s+([^/]+)/i)?.[1]
    ?? '';
  const factorFields = parseSyntaxFieldCandidates(
    context.currentDataset,
    byClause.replace(/\bWITH\b[\s\S]*$/i, '').trim()
  );
  const covariateFields = parseSyntaxFieldCandidates(context.currentDataset, withClause);
  const distributionToken = extractSyntaxClause(command, 'DISTRIBUTION')
    ?? extractSyntaxClauseLoose(command, 'DISTRIBUTION')
    ?? '';
  const family: GeneralLinearModelFamily = /BINOMIAL/i.test(distributionToken)
    ? 'binomial'
    : /POISSON/i.test(distributionToken)
      ? 'poisson'
      : 'gaussian';
  const linkToken = extractSyntaxClause(command, 'LINK')
    ?? extractSyntaxClauseLoose(command, 'LINK')
    ?? '';
  const link: GeneralLinearModelLink | undefined = /PROBIT/i.test(linkToken)
    ? 'probit'
    : /CLOGLOG/i.test(linkToken)
      ? 'cloglog'
      : /SQRT/i.test(linkToken)
        ? 'sqrt'
        : /\bLOGIT\b/i.test(linkToken)
          ? 'logit'
          : /\bLOG\b/i.test(linkToken)
            ? 'log'
            : /\bIDENTITY\b/i.test(linkToken)
              ? 'identity'
              : undefined;
  const maxIterations = parseSyntaxNumericSetting(command, [
    /\bMAXITER\s*\(\s*(\d+)\s*\)/i,
    /\bMAXITER\s*=\s*(\d+)/i
  ]);
  const tolerance = parseSyntaxNumericSetting(command, [
    /\bCONVERGE\s*\(\s*([0-9.eE+-]+)\s*\)/i,
    /\bCONVERGE\s*=\s*([0-9.eE+-]+)/i,
    /\bTOL(?:ERANCE)?\s*=\s*([0-9.eE+-]+)/i
  ]);
  const confidenceLevel = parseSyntaxConfidenceLevel(command);
  const covarianceEstimator: GeneralLinearModelCovarianceEstimator =
    /\b(COVB|COVARIANCE)\s*=\s*ROBUST\b/i.test(command) || /\bEMPIRICAL\b/i.test(command)
      ? 'robust'
      : 'model';
  const splitAware = runSplitAware(
    context,
    'message',
    `Returned GLM output for ${dependentField}.`,
    (dataset) => analyzeGeneralLinearModel(
      dataset,
      dependentField,
      factorFields,
      covariateFields,
      context.syntaxAnalysisOptions,
      { family, link, maxIterations: maxIterations ?? undefined, tolerance: tolerance ?? undefined, confidenceLevel: confidenceLevel ?? undefined, covarianceEstimator }
    )
  );
  return {
    command,
    commandName: /GENLIN/i.test(command) ? 'GENLIN' : 'GLM',
    status: 'ok',
    ...splitAware
  };
}

function executeMixedSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const dependentToken = command.match(/^\s*MIXED\s+([A-Za-z_][\w$]*)/i)?.[1]
    ?? extractSyntaxClause(command, 'DEPENDENT')
    ?? extractSyntaxClauseLoose(command, 'DEPENDENT');
  if (!dependentToken) throw new Error('MIXED requires a dependent field.');
  const dependentField = resolveSyntaxField(context.currentDataset, dependentToken);
  const fixedClause = extractSyntaxClause(command, 'FIXED')
    ?? extractSyntaxClauseLoose(command, 'FIXED')
    ?? '';
  const predictorFields = parseSyntaxFieldCandidates(context.currentDataset, fixedClause);
  if (predictorFields.length === 0) throw new Error('MIXED requires at least one fixed predictor in /FIXED.');
  const subjectToken = command.match(/\bSUBJECT\s*\(\s*([A-Za-z_][\w$]*)\s*\)/i)?.[1]
    ?? extractSyntaxClause(command, 'SUBJECT')
    ?? extractSyntaxClauseLoose(command, 'SUBJECT');
  if (!subjectToken) throw new Error('MIXED requires SUBJECT(groupField).');
  const groupField = resolveSyntaxField(context.currentDataset, subjectToken);
  const randomClause = extractSyntaxClause(command, 'RANDOM')
    ?? extractSyntaxClauseLoose(command, 'RANDOM')
    ?? '';
  const randomSlopeFields = parseSyntaxFieldCandidates(context.currentDataset, randomClause)
    .filter((field) => predictorFields.includes(field));
  const covarianceStructure: MixedModelCovarianceStructure = /\bTYPE\s*\(\s*(ID|VC)\s*\)/i.test(command)
    ? 'independent'
    : 'compound_symmetry';
  const estimationMethod: 'ml' | 'reml' = /\bMETHOD\s*=\s*ML\b/i.test(command) ? 'ml' : 'reml';
  const confidenceLevel = parseSyntaxConfidenceLevel(command);
  const splitAware = runSplitAware(
    context,
    'message',
    `Returned mixed-model output for ${dependentField}.`,
    (dataset) => analyzeMixedModel(
      dataset,
      dependentField,
      predictorFields,
      groupField,
      context.syntaxAnalysisOptions,
      {
        randomSlopeFields,
        covarianceStructure,
        estimationMethod,
        confidenceLevel: confidenceLevel ?? undefined
      }
    )
  );
  return {
    command,
    commandName: 'MIXED',
    status: 'ok',
    ...splitAware
  };
}

function executeGeeSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const dependentToken = command.match(/^\s*(?:GEE|GENLIN)\s+([A-Za-z_][\w$]*)/i)?.[1]
    ?? extractSyntaxClause(command, 'DEPENDENT')
    ?? extractSyntaxClauseLoose(command, 'DEPENDENT');
  if (!dependentToken) throw new Error('GEE requires a dependent field.');
  const dependentField = resolveSyntaxField(context.currentDataset, dependentToken);
  const modelClause = extractSyntaxClause(command, 'MODEL')
    ?? extractSyntaxClauseLoose(command, 'MODEL')
    ?? '';
  const predictorFields = parseSyntaxFieldCandidates(context.currentDataset, modelClause)
    .filter((field) => field !== dependentField);
  if (predictorFields.length === 0) throw new Error('GEE requires at least one predictor in /MODEL.');
  const subjectToken = command.match(/\bSUBJECT\s*\(\s*([A-Za-z_][\w$]*)\s*\)/i)?.[1]
    ?? extractSyntaxClause(command, 'SUBJECT')
    ?? extractSyntaxClauseLoose(command, 'SUBJECT');
  if (!subjectToken) throw new Error('GEE requires SUBJECT(clusterField).');
  const clusterField = resolveSyntaxField(context.currentDataset, subjectToken);
  const familyToken = extractSyntaxClause(command, 'DISTRIBUTION')
    ?? extractSyntaxClauseLoose(command, 'DISTRIBUTION')
    ?? '';
  const family: GeeFamily = /BINOMIAL/i.test(familyToken)
    ? 'binomial'
    : /POISSON/i.test(familyToken)
      ? 'poisson'
      : 'gaussian';
  const linkToken = extractSyntaxClause(command, 'LINK')
    ?? extractSyntaxClauseLoose(command, 'LINK')
    ?? '';
  const link: GeeLink | undefined = /PROBIT/i.test(linkToken)
    ? 'probit'
    : /CLOGLOG/i.test(linkToken)
      ? 'cloglog'
      : /SQRT/i.test(linkToken)
        ? 'sqrt'
        : /\bLOGIT\b/i.test(linkToken)
          ? 'logit'
          : /\bLOG\b/i.test(linkToken)
            ? 'log'
            : /\bIDENTITY\b/i.test(linkToken)
              ? 'identity'
              : undefined;
  const corrToken = extractSyntaxClause(command, 'CORRSTRUCT')
    ?? extractSyntaxClauseLoose(command, 'CORRSTRUCT')
    ?? '';
  const correlation: GeeCorrelationStructure = /EXCHANGEABLE/i.test(corrToken)
    ? 'exchangeable'
    : /AR1/i.test(corrToken)
      ? 'ar1'
      : 'independence';
  const maxIterations = parseSyntaxNumericSetting(command, [
    /\bMAXITER\s*\(\s*(\d+)\s*\)/i,
    /\bMAXITER\s*=\s*(\d+)/i
  ]);
  const tolerance = parseSyntaxNumericSetting(command, [
    /\bCONVERGE\s*\(\s*([0-9.eE+-]+)\s*\)/i,
    /\bCONVERGE\s*=\s*([0-9.eE+-]+)/i,
    /\bTOL(?:ERANCE)?\s*=\s*([0-9.eE+-]+)/i
  ]);
  const confidenceLevel = parseSyntaxConfidenceLevel(command);
  const smallSampleCorrection = /\bSMALLSAMPLE\b/i.test(command) || /\bROBUST\s*=\s*SMALL\b/i.test(command);
  const splitAware = runSplitAware(
    context,
    'message',
    `Returned GEE output for ${dependentField}.`,
    (dataset) => analyzeGeneralizedEstimatingEquation(
      dataset,
      dependentField,
      predictorFields,
      clusterField,
      family,
      correlation,
      context.syntaxAnalysisOptions,
      {
        link,
        maxIterations: maxIterations ?? undefined,
        tolerance: tolerance ?? undefined,
        confidenceLevel: confidenceLevel ?? undefined,
        smallSampleCorrection
      }
    )
  );
  return {
    command,
    commandName: 'GEE',
    status: 'ok',
    ...splitAware
  };
}

function executeComplexSamplesSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const targetToken = command.match(/^\s*(?:CSGLM|CSMEANS)\s+([A-Za-z_][\w$]*)/i)?.[1]
    ?? extractSyntaxClause(command, 'TARGET')
    ?? extractSyntaxClauseLoose(command, 'TARGET')
    ?? extractSyntaxClause(command, 'MODEL')
    ?? extractSyntaxClauseLoose(command, 'MODEL');
  if (!targetToken) throw new Error('CSGLM/CSMEANS requires a target field.');
  const targetField = resolveSyntaxField(context.currentDataset, targetToken);
  const strataToken = extractSyntaxClause(command, 'STRATA') ?? extractSyntaxClauseLoose(command, 'STRATA');
  const clusterToken = extractSyntaxClause(command, 'CLUSTER') ?? extractSyntaxClauseLoose(command, 'CLUSTER');
  const groupToken = extractSyntaxClause(command, 'BY') ?? extractSyntaxClauseLoose(command, 'BY');
  const repWeightsClause = extractSyntaxClause(command, 'REPWEIGHTS') ?? extractSyntaxClauseLoose(command, 'REPWEIGHTS') ?? '';
  const replicateWeightFields = parseSyntaxFieldCandidates(context.currentDataset, repWeightsClause);
  const fpcToken = extractSyntaxClause(command, 'FPC') ?? extractSyntaxClauseLoose(command, 'FPC');
  const varianceEstimator: 'linearization' | 'replicate' = replicateWeightFields.length > 0 || /\b(VAREST|VARIANCE)\s*=\s*(BRR|JACKKNIFE|REPLICATE)/i.test(command)
    ? 'replicate'
    : 'linearization';
  const splitAware = runSplitAware(
    context,
    'message',
    `Returned complex-samples output for ${targetField}.`,
    (dataset) => analyzeComplexSamples(dataset, targetField, {
      ...context.syntaxAnalysisOptions,
      strataField: strataToken ? resolveSyntaxField(context.currentDataset, strataToken) : undefined,
      clusterField: clusterToken ? resolveSyntaxField(context.currentDataset, clusterToken) : undefined,
      groupField: groupToken ? resolveSyntaxField(context.currentDataset, groupToken) : undefined,
      varianceEstimator,
      replicateWeightFields,
      finitePopulationCorrectionField: fpcToken ? resolveSyntaxField(context.currentDataset, fpcToken) : undefined
    })
  );
  return {
    command,
    commandName: 'COMPLEX_SAMPLES',
    status: 'ok',
    ...splitAware
  };
}

function executeNeuralNetworkSyntax(context: SyntaxExecutionContext, command: string): SyntaxCommandResult {
  const targetToken = command.match(/^\s*(?:NNEURAL|NEURAL)\s+([A-Za-z_][\w$]*)/i)?.[1]
    ?? extractSyntaxClause(command, 'TARGET')
    ?? extractSyntaxClauseLoose(command, 'TARGET');
  if (!targetToken) throw new Error('NNEURAL requires a target field.');
  const targetField = resolveSyntaxField(context.currentDataset, targetToken);
  const predictorClause = extractSyntaxClause(command, 'INPUTS')
    ?? extractSyntaxClauseLoose(command, 'INPUTS')
    ?? extractSyntaxClause(command, 'PREDICTORS')
    ?? extractSyntaxClauseLoose(command, 'PREDICTORS')
    ?? '';
  const predictorFields = parseSyntaxFieldCandidates(context.currentDataset, predictorClause)
    .filter((field) => field !== targetField);
  if (predictorFields.length === 0) throw new Error('NNEURAL requires at least one predictor in /INPUTS or /PREDICTORS.');
  const task: NeuralNetworkTask = /\bTYPE\s*=\s*CLASSIFICATION\b/i.test(command) ? 'classification' : 'regression';
  const hiddenMatch = command.match(/\bHIDDEN\s*=\s*(\d+)/i);
  const hidden = hiddenMatch ? Number(hiddenMatch[1]) : 6;
  const learningRate = parseSyntaxNumericSetting(command, [
    /\bLEARNINGRATE\s*=\s*([0-9.eE+-]+)/i,
    /\bLR\s*=\s*([0-9.eE+-]+)/i
  ]);
  const epochs = parseSyntaxNumericSetting(command, [
    /\bEPOCHS\s*=\s*(\d+)/i,
    /\bITERATIONS\s*=\s*(\d+)/i
  ]);
  const l2Penalty = parseSyntaxNumericSetting(command, [
    /\bL2\s*=\s*([0-9.eE+-]+)/i,
    /\bWEIGHTDECAY\s*=\s*([0-9.eE+-]+)/i
  ]);
  const validationSplit = parseSyntaxNumericSetting(command, [
    /\bVALIDATION\s*=\s*([0-9]*\.?[0-9]+)/i,
    /\bHOLDOUT\s*=\s*([0-9]*\.?[0-9]+)/i
  ]);
  const seed = parseSyntaxNumericSetting(command, [/\bSEED\s*=\s*(\d+)/i]);
  const splitAware = runSplitAware(
    context,
    'message',
    `Returned neural-network output for ${targetField}.`,
    (dataset) => analyzeNeuralNetwork(
      dataset,
      targetField,
      predictorFields,
      task,
      hidden,
      context.syntaxAnalysisOptions,
      {
        learningRate: learningRate ?? undefined,
        epochs: epochs ?? undefined,
        l2Penalty: l2Penalty ?? undefined,
        validationSplit: validationSplit !== null
          ? (validationSplit > 1 ? validationSplit / 100 : validationSplit)
          : undefined,
        seed: seed !== null ? Math.floor(seed) : undefined
      }
    )
  );
  return {
    command,
    commandName: 'NNEURAL',
    status: 'ok',
    ...splitAware
  };
}

function runSyntaxCommand(context: SyntaxExecutionContext, command: string, _options?: DatasetAnalysisOptions): SyntaxCommandResult {
  const commandName = command.split(/\s+/)[0]?.toUpperCase() ?? 'UNKNOWN';
  const normalizedCommandName = normalizeSyntaxCommandName(commandName);
  const analysisOptions = context.syntaxAnalysisOptions;
  try {
    if (context.rowMask && !syntaxCommandAllowedInRowScope(commandName, command)) {
      return {
        command,
        commandName,
        status: 'error',
        outputKind: 'message',
        message: `Command "${commandName}" is not supported inside scoped procedural blocks in this implementation.`
      };
    }

    if (normalizedCommandName && syntaxExtensionRegistry.has(normalizedCommandName)) {
      const args = command.slice(commandName.length).trim();
      return executeRegisteredSyntaxExtension(context, command, normalizedCommandName, args, []);
    }

    if (commandName === 'OMS' || commandName === 'OMSEND') {
      return executeOmsCommand(context, commandName === 'OMSEND' ? 'OMS END' : command);
    }

    if (commandName === 'OMSINFO') {
      return executeOmsInfoCommand(context, command);
    }

    if (commandName === 'OUTPUT') {
      return executeOutputCommand(context, command);
    }

    if (commandName === 'VECTOR') {
      return executeVector(context, command);
    }

    if (commandName === 'NUMERIC') {
      return ensureSyntaxNumericOrStringFields(context, command, 'number');
    }

    if (commandName === 'STRING') {
      return ensureSyntaxNumericOrStringFields(context, command, 'string');
    }

    if (commandName === 'RECODE') {
      return executeRecode(context, command);
    }

    if (commandName === 'AUTORECODE') {
      return executeAutorecode(context, command);
    }

    if (commandName === 'COUNT') {
      return executeCount(context, command);
    }

    if (commandName === 'SELECT' && /\bIF\b/i.test(command)) {
      return executeSelectIf(context, command);
    }

    if (commandName === 'FILTER') {
      return executeFilter(context, command);
    }

    if (commandName === 'WEIGHT') {
      return executeWeight(context, command);
    }

    if (commandName === 'MISSING' && /\bVALUES\b/i.test(command)) {
      return executeMissingValues(context, command);
    }

    if (commandName === 'VARIABLE' && /\bLABELS\b/i.test(command)) {
      return executeVariableLabels(context, command);
    }

    if (commandName === 'VALUE' && /\bLABELS\b/i.test(command)) {
      return executeValueLabels(context, command);
    }

    if (commandName === 'RENAME' && /\bVARIABLES\b/i.test(command)) {
      return executeRenameVariables(context, command);
    }

    if ((commandName === 'DELETE' || commandName === 'DROP') && /\bVARIABLES\b/i.test(command)) {
      return executeDeleteVariables(context, command);
    }

    if (commandName === 'KEEP' && /\bVARIABLES\b/i.test(command)) {
      return executeKeepVariables(context, command);
    }

    if (commandName === 'N' && /\bOF\s+CASES\b/i.test(command)) {
      return executeNOfCases(context, command);
    }

    if (commandName === 'EXECUTE' || commandName === 'TEMPORARY') {
      return executeExecute(command);
    }

    if (commandName === 'COMPUTE') {
      return executeCompute(context, command);
    }

    if (commandName === 'IF') {
      return executeIfCompute(context, command);
    }

    if (commandName === 'AGGREGATE') {
      return executeAggregate(context, command);
    }

    if (commandName === 'RANK') {
      return executeRank(context, command);
    }

    if (commandName === 'SORT' && /\bCASES\b/i.test(command)) {
      return executeSortCases(context, command);
    }

    if (commandName === 'SPLIT') {
      return executeSplitFileCommand(context, command);
    }

    if (commandName === 'RESHAPE') {
      return executeReshape(context, command);
    }

    if (commandName === 'DATASET') {
      return executeDatasetCommand(context, command);
    }

    if (commandName === 'MATCH' && /\bFILES\b/i.test(command)) {
      return executeMatchFiles(context, command);
    }

    if (commandName === 'ADD' && /\bFILES\b/i.test(command)) {
      return executeAddFiles(context, command);
    }

    if (commandName === 'MERGE' && /\bFILES\b/i.test(command)) {
      if (extractSyntaxClause(command, 'TABLE') || extractSyntaxClause(command, 'BY')) {
        return executeMatchFiles(context, command);
      }
      return executeAddFiles(context, command);
    }

    if (commandName === 'DESCRIPTIVES' || commandName === 'DESCRIPTIVE') {
      const variableClause = extractSyntaxClause(command, 'VARIABLES') ?? command.replace(/^\s*DESCRIPTIVES?/i, '');
      const fields = parseSyntaxFieldList(context.currentDataset, variableClause)
        .filter((field) => context.currentDataset.fields.find((candidate) => candidate.key === field)?.valueType === 'number');
      if (fields.length === 0) throw new Error('DESCRIPTIVES requires at least one numeric field.');
      const splitAware = runSplitAware(
        context,
        'descriptives',
        `Returned numeric summaries for ${fields.length} field(s).`,
        (dataset) => describeDataset(dataset, analysisOptions).summaries.filter((summary) => fields.includes(summary.key))
      );
      return {
        command,
        commandName,
        status: 'ok',
        ...splitAware
      };
    }

    if (commandName === 'FREQUENCIES' || commandName === 'FREQUENCY') {
      const variableClause = extractSyntaxClause(command, 'VARIABLES') ?? command.replace(/^\s*FREQUENC(?:IES|Y)/i, '');
      const fields = parseSyntaxFieldList(context.currentDataset, variableClause);
      if (fields.length === 0) throw new Error('FREQUENCIES requires at least one field.');
      const splitAware = runSplitAware(
        context,
        'frequencies',
        `Returned frequency tables for ${fields.length} field(s).`,
        (dataset) => describeDataset(dataset, analysisOptions).summaries.filter((summary) => fields.includes(summary.key))
      );
      return {
        command,
        commandName,
        status: 'ok',
        ...splitAware
      };
    }

    if (commandName === 'CROSSTABS' || commandName === 'CROSSTAB') {
      const tableClause = extractSyntaxClause(command, 'TABLES');
      const match = tableClause?.match(/(.+?)\s+BY\s+(.+)/i);
      if (!match) throw new Error('CROSSTABS requires /TABLES=rowField BY columnField.');
      const rowField = resolveSyntaxField(context.currentDataset, match[1] ?? '');
      const columnField = resolveSyntaxField(context.currentDataset, match[2] ?? '');
      const splitAware = runSplitAware(
        context,
        'crosstab',
        `Returned crosstab for ${rowField} by ${columnField}.`,
        (dataset) => analyzeCrosstab(dataset, rowField, columnField, analysisOptions)
      );
      return {
        command,
        commandName,
        status: 'ok',
        ...splitAware
      };
    }

    if (commandName === 'CORRELATIONS' || commandName === 'CORRELATION') {
      const variableClause = extractSyntaxClause(command, 'VARIABLES') ?? command.replace(/^\s*CORRELATIONS?/i, '');
      const fields = parseSyntaxFieldList(context.currentDataset, variableClause)
        .filter((field) => context.currentDataset.fields.find((candidate) => candidate.key === field)?.valueType === 'number');
      if (fields.length < 2) throw new Error('CORRELATIONS requires at least two numeric fields.');
      const splitAware = runSplitAware(
        context,
        'correlations',
        `Returned pairwise correlations for ${fields.length} field(s).`,
        (dataset) => {
          const correlations: CorrelationResult[] = [];
          for (let left = 0; left < fields.length; left += 1) {
            for (let right = left + 1; right < fields.length; right += 1) {
              correlations.push(analyzeCorrelation(dataset, fields[left]!, fields[right]!, analysisOptions));
            }
          }
          return correlations;
        }
      );
      return {
        command,
        commandName,
        status: 'ok',
        ...splitAware
      };
    }

    if (commandName === 'REGRESSION') {
      const dependentClause = command.match(/DEPENDENT\s+([^/\s]+)/i)?.[1] ?? extractSyntaxClause(command, 'DEPENDENT');
      const methodClause = command.match(/METHOD\s*=\s*ENTER\s+([^/]+)/i)?.[1] ?? extractSyntaxClause(command, 'PREDICTORS');
      if (!dependentClause || !methodClause) {
        throw new Error('REGRESSION requires /DEPENDENT field /METHOD=ENTER predictors.');
      }
      const dependentField = resolveSyntaxField(context.currentDataset, dependentClause);
      const predictorFields = parseSyntaxFieldList(context.currentDataset, methodClause);
      if (predictorFields.length === 0) throw new Error('REGRESSION requires at least one predictor field.');
      const splitAware = runSplitAware(
        context,
        'regression',
        `Returned linear regression for ${dependentField}.`,
        (dataset) => analyzeRegression(dataset, dependentField, predictorFields, 'linear', analysisOptions)
      );
      return {
        command,
        commandName,
        status: 'ok',
        ...splitAware
      };
    }

    if (commandName === 'T-TEST' || commandName === 'TTEST') {
      return executeTTestSyntax(context, command);
    }

    if (commandName === 'NPAR') {
      return executeNparTestsSyntax(context, command);
    }

    if (commandName === 'ONEWAY') {
      return executeOneWaySyntax(context, command);
    }

    if (commandName === 'MEANS') {
      return executeMeansSyntax(context, command);
    }

    if (commandName === 'LOGISTIC' && /\bREGRESSION\b/i.test(command)) {
      return executeLogisticRegressionSyntax(context, command);
    }

    if (commandName === 'COXREG') {
      return executeCoxRegSyntax(context, command);
    }

    if (commandName === 'RELIABILITY') {
      return executeReliabilitySyntax(context, command);
    }

    if (commandName === 'UNIANOVA') {
      return executeUnianovaSyntax(context, command);
    }

    if (commandName === 'GLM') {
      return executeGlmSyntax(context, command);
    }

    if (commandName === 'GENLIN') {
      if (/\bSUBJECT\b/i.test(command) || /\bCORRSTRUCT\b/i.test(command)) {
        return executeGeeSyntax(context, command);
      }
      return executeGlmSyntax(context, command);
    }

    if (commandName === 'MIXED') {
      return executeMixedSyntax(context, command);
    }

    if (commandName === 'GEE') {
      return executeGeeSyntax(context, command);
    }

    if (commandName === 'CSGLM' || commandName === 'CSMEANS') {
      return executeComplexSamplesSyntax(context, command);
    }

    if (commandName === 'NNEURAL' || (commandName === 'NEURAL' && /\bNETWORK\b/i.test(command))) {
      return executeNeuralNetworkSyntax(context, command);
    }

    if (commandName === 'FACTOR') {
      return executeFactorSyntax(context, command);
    }

    if (commandName === 'CTABLES') {
      return executeCTablesSyntax(context, command);
    }

    return {
      command,
      commandName,
      status: 'error',
      outputKind: 'message',
      message: `Unsupported syntax command "${commandName}". Supported: RECODE, AUTORECODE, COUNT, SELECT IF, FILTER, WEIGHT, MISSING VALUES, VARIABLE LABELS, VALUE LABELS, RENAME VARIABLES, DELETE/DROP VARIABLES, KEEP VARIABLES, N OF CASES, NUMERIC, STRING, VECTOR, EXECUTE, COMPUTE, IF, AGGREGATE, RANK, SORT CASES, SPLIT FILE, RESHAPE, DATASET, MATCH FILES, ADD FILES, MERGE FILES, DESCRIPTIVES, FREQUENCIES, CROSSTABS, CORRELATIONS, REGRESSION, LOGISTIC REGRESSION, T-TEST, NPAR TESTS, ONEWAY, MEANS, RELIABILITY, GLM, UNIANOVA, GENLIN, MIXED, GEE, COXREG, CSGLM/CSMEANS, NNEURAL, FACTOR, CTABLES, OMS/OMSEND/OMSINFO, OUTPUT EXPORT/ACTIVATE/CLOSE/NEW, and registered extension commands.`
    };
  } catch (error) {
    return {
      command,
      commandName,
      status: 'error',
      outputKind: 'message',
      message: error instanceof Error ? error.message : `Unable to run ${commandName}.`
    };
  }
}

export function runSyntax(
  dataset: CaseDataset,
  syntax: string,
  options?: DatasetAnalysisOptions
): SyntaxRunResult {
  const commands = splitSyntaxCommands(syntax);
  if (commands.length === 0) {
    throw new Error('Enter at least one syntax command.');
  }
  const context: SyntaxExecutionContext = {
    currentDataset: cloneCaseDataset(dataset),
    activeDatasetName: 'WORK',
    datasets: new Map<string, CaseDataset>([['WORK', cloneCaseDataset(dataset)]]),
    activeOutputDocumentName: 'OUTPUT',
    outputDocuments: new Map<string, SyntaxOutputDocumentStore>([[
      'OUTPUT',
      {
        name: 'OUTPUT',
        records: [],
        createdAt: new Date().toISOString()
      }
    ]]),
    splitFields: [],
    filterField: '',
    syntaxAnalysisOptions: normalizeAnalysisOptions(options),
    valueLabels: new Map<string, Map<string, string>>(),
    vectorFields: new Map<string, string[]>(),
    rowMask: null,
    macros: new Map<string, SyntaxMacroDefinition>(),
    oms: {
      active: false,
      tag: null,
      commandFilter: null,
      exceptCommandFilter: null,
      subtypeFilter: null,
      destinationFormat: 'json',
      destinationOutfile: null,
      destinationViewer: 'OUTPUT',
      mode: 'append',
      records: []
    },
    macroDepth: 0
  };
  const results = executeSyntaxProgramCommands(context, commands, options);
  syncActiveDataset(context);
  const generatedAt = new Date().toISOString();
  const normalizedDocumentName = ensureOutputDocument(context, context.activeOutputDocumentName).name;
  context.activeOutputDocumentName = normalizedDocumentName;
  const outputDocuments = [...context.outputDocuments.values()]
    .map((entry) => buildOutputDocumentModel(entry.name, entry.records, generatedAt))
    .sort((left, right) => left.name.localeCompare(right.name));
  const outputDocument = outputDocuments.find((entry) => entry.name === normalizedDocumentName)
    ?? buildOutputDocumentModel(normalizedDocumentName, [], generatedAt);
  const outputPack: SyntaxOutputPack = {
    version: 1,
    generatedAt,
    syntaxHash: hashStringFnv1a(JSON.stringify({
      syntax,
      results,
      activeDatasetName: context.activeDatasetName,
      finalDatasetSummary: summarizeSyntaxDataset(context.currentDataset),
      outputDocuments
    })),
    commandCount: results.length,
    successfulCommandCount: results.filter((result) => result.status === 'ok').length,
    activeDocumentName: normalizedDocumentName,
    documentNames: outputDocuments.map((entry) => entry.name),
    documents: Object.fromEntries(outputDocuments.map((entry) => [entry.name, entry]))
  };
  return {
    syntax,
    commandCount: results.length,
    successfulCommandCount: results.filter((result) => result.status === 'ok').length,
    results,
    activeDatasetName: context.activeDatasetName,
    datasetNames: [...context.datasets.keys()].sort((left, right) => left.localeCompare(right)),
    splitFields: [...context.splitFields],
    finalDatasetSummary: summarizeSyntaxDataset(context.currentDataset),
    outputDocument,
    outputDocuments,
    outputPack,
    notes: [
      'Syntax runner supports SPSS-style data-management commands including RECODE, AUTORECODE, COUNT, SELECT IF, FILTER, WEIGHT, MISSING VALUES, VARIABLE LABELS, VALUE LABELS, RENAME VARIABLES, DELETE/DROP VARIABLES, KEEP VARIABLES, N OF CASES, NUMERIC, STRING, VECTOR, COMPUTE, IF, AGGREGATE, RANK, SORT CASES, SPLIT FILE, RESHAPE LONG/WIDE, DATASET registry commands, and merge operations via MATCH FILES, ADD FILES, and MERGE FILES.',
      'Procedural blocks include DO IF / ELSE IF / ELSE / END IF, DO REPEAT / END REPEAT, and LOOP / END LOOP with scoped row execution for row-wise transforms.',
      'Macro features include DEFINE/!ENDDEFINE blocks and inline !macro invocations with !TOKENS and !CMDEND parameter modes.',
      'OMS and output command families are supported via OMS/OMSEND/OMSINFO and OUTPUT EXPORT/ACTIVATE/CLOSE/NEW with in-memory capture and output-document trees.',
      'Extension hooks can run through BEGIN PROGRAM ... END PROGRAM blocks or direct registered extension command names.',
      'Analytic commands include DESCRIPTIVES, FREQUENCIES, CROSSTABS, CORRELATIONS, REGRESSION, LOGISTIC REGRESSION, T-TEST, NPAR TESTS, ONEWAY, MEANS, RELIABILITY, GLM, UNIANOVA, GENLIN, MIXED, GEE, COXREG, CSGLM/CSMEANS, NNEURAL, FACTOR, and CTABLES with split-group output when SPLIT FILE is active.',
      'Syntax-managed analysis settings are applied to procedures (current WEIGHT, MISSING VALUES, and FILTER state).',
      'Use dataset field keys for the most reliable command execution.',
      ...(context.oms.records.length > 0
        ? [`OMS captured ${context.oms.records.length} output item(s) during this run.`]
        : [])
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
    let coefficientStats = coefficients.map((coefficient, index) => {
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
    const robustCovarianceMatrix = computeHc3RobustCovariance(inverseXtWX, xMatrix, residuals, weights, leverageValues);
    const robustSeInflation: number[] = [];
    coefficientStats = coefficientStats.map((entry, index) => {
      const robustStandardError = robustCovarianceMatrix
        ? Math.sqrt(Math.max(0, robustCovarianceMatrix[index]![index]!))
        : null;
      const robustStatistic = robustStandardError && robustStandardError > 0
        ? entry.coefficient / robustStandardError
        : null;
      const robustPValue = robustStatistic === null ? null : studentTPValue(robustStatistic, degreesOfFreedom);
      if (
        entry.standardError !== null
        && entry.standardError !== undefined
        && entry.standardError > 0
        && robustStandardError !== null
        && robustStandardError !== undefined
        && Number.isFinite(robustStandardError)
      ) {
        robustSeInflation.push(robustStandardError / entry.standardError);
      }
      return {
        ...entry,
        robustStandardError,
        robustStatistic,
        robustPValue,
        robustConfidenceInterval: robustStandardError === null ? null : confidenceInterval95(entry.coefficient, robustStandardError, degreesOfFreedom)
      };
    });
    const robustSeInflationMax = robustSeInflation.length > 0 ? Math.max(...robustSeInflation) : null;
    const robustSeInflationMean = robustSeInflation.length > 0
      ? robustSeInflation.reduce((total, value) => total + value, 0) / robustSeInflation.length
      : null;
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
    const toleranceByPredictor = Object.fromEntries(
      Object.entries(vifByPredictor).map(([field, value]) => [field, value === null || value <= 0 ? null : 1 / value])
    ) as Record<string, number | null>;
    const vifValues = Object.values(vifByPredictor).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    const standardizedResidualValues = standardizedResiduals
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    const jarqueBera = computeJarqueBera(standardizedResidualValues);
    const breuschPagan = computeBreuschPagan(rows, residuals);
    const maxPredictorCorrelation = computeMaxPredictorCorrelation(rows);
    const maxVif = vifValues.length > 0 ? Math.max(...vifValues) : null;
    const multicollinearity = predictorFields.map((field) => ({
      field,
      vif: vifByPredictor[field] ?? null,
      tolerance: toleranceByPredictor[field] ?? null
    }));
    const influenceSummary = [...observations]
      .sort((left, right) => {
        const cooksDelta = (right.cooksDistance ?? -Infinity) - (left.cooksDistance ?? -Infinity);
        if (Number.isFinite(cooksDelta) && cooksDelta !== 0) return cooksDelta;
        const leverageDelta = (right.leverage ?? -Infinity) - (left.leverage ?? -Infinity);
        if (Number.isFinite(leverageDelta) && leverageDelta !== 0) return leverageDelta;
        return Math.abs(right.standardizedResidual ?? 0) - Math.abs(left.standardizedResidual ?? 0);
      })
      .slice(0, 10)
      .map((observation) => ({
        caseId: observation.caseId,
        caseLabel: observation.caseLabel,
        leverage: observation.leverage ?? null,
        cooksDistance: observation.cooksDistance ?? null,
        standardizedResidual: observation.standardizedResidual ?? null,
        devianceResidual: observation.devianceResidual ?? null
      }));
    assumptions.push(
      buildAssumptionCheck(
        'residual_normality',
        'Residual normality (Jarque-Bera)',
        jarqueBera.pValue === null ? 'warn' : jarqueBera.pValue >= 0.05 ? 'pass' : 'warn',
        jarqueBera.pValue,
        jarqueBera.pValue === null
          ? 'Not enough variation to evaluate residual normality.'
          : jarqueBera.pValue >= 0.05
            ? 'Residual distribution does not strongly deviate from normality.'
            : 'Residual distribution shows non-normality; review transformations or robust inference.'
      ),
      buildAssumptionCheck(
        'homoskedasticity',
        'Homoskedasticity (Breusch-Pagan)',
        breuschPagan.pValue === null ? 'warn' : breuschPagan.pValue >= 0.05 ? 'pass' : 'warn',
        breuschPagan.pValue,
        breuschPagan.pValue === null
          ? 'Unable to evaluate heteroskedasticity for this model.'
          : breuschPagan.pValue >= 0.05
            ? 'No strong heteroskedasticity signal detected.'
            : 'Heteroskedasticity signal detected; consider robust standard errors.'
      ),
      buildAssumptionCheck(
        'robust_se_shift',
        'Robust SE shift (HC3)',
        robustSeInflationMax === null ? 'warn' : robustSeInflationMax <= 1.25 ? 'pass' : robustSeInflationMax <= 1.75 ? 'warn' : 'fail',
        robustSeInflationMax,
        robustSeInflationMax === null
          ? 'HC3 robust standard errors were not available.'
          : robustSeInflationMax <= 1.25
            ? 'Robust and conventional standard errors are closely aligned.'
            : robustSeInflationMax <= 1.75
              ? 'Some coefficients show moderate robust-SE inflation.'
              : 'Large robust-SE inflation suggests unstable conventional inference.'
      ),
      buildAssumptionCheck(
        'multicollinearity',
        'Multicollinearity (max VIF)',
        maxVif === null ? 'warn' : maxVif <= 5 ? 'pass' : maxVif <= 10 ? 'warn' : 'fail',
        maxVif,
        maxVif === null
          ? 'Could not compute VIF for all predictors.'
          : maxVif <= 5
            ? 'Multicollinearity is within typical bounds.'
            : maxVif <= 10
              ? 'Moderate multicollinearity detected.'
              : 'High multicollinearity detected; coefficients may be unstable.'
      )
    );

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
      multicollinearity,
      influenceSummary,
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
        maxVif,
        meanVif: vifValues.length > 0 ? vifValues.reduce((total, value) => total + value, 0) / vifValues.length : null,
        maxPredictorCorrelation,
        jarqueBeraStatistic: jarqueBera.statistic,
        jarqueBeraPValue: jarqueBera.pValue,
        breuschPaganStatistic: breuschPagan.statistic,
        breuschPaganPValue: breuschPagan.pValue,
        breuschPaganRSquared: breuschPagan.rSquared,
        robustSeInflationMax,
        robustSeInflationMean,
        ...Object.fromEntries(Object.entries(vifByPredictor).map(([field, value]) => [`vif_${field}`, value])),
        ...Object.fromEntries(Object.entries(toleranceByPredictor).map(([field, value]) => [`tol_${field}`, value]))
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
  const defaultThresholdMetrics = computeClassificationMetricsAtThreshold(probabilities, yVector, weights, 0.5);
  const predictedClasses = probabilities.map((probability) => probability >= 0.5 ? 1 : 0);
  const weightedAccuracy = defaultThresholdMetrics.accuracy;
  const logLikelihood = yVector.reduce((total, value, index) => {
    const probability = Math.min(0.999999, Math.max(0.000001, probabilities[index]!));
    return total + (weights[index]! * ((value * Math.log(probability)) + ((1 - value) * Math.log(1 - probability))));
  }, 0);
  const meanY = yVector.reduce((total, value, index) => total + (value * weights[index]!), 0) / weightedCaseCount;
  const boundedMeanY = Math.min(0.999999, Math.max(0.000001, meanY));
  const nullLogLikelihood = yVector.reduce((total, value, index) =>
    total + (weights[index]! * ((value * Math.log(boundedMeanY)) + ((1 - value) * Math.log(1 - boundedMeanY)))), 0);
  const { truePositive, trueNegative, falsePositive, falseNegative } = defaultThresholdMetrics;
  const precision = defaultThresholdMetrics.precision;
  const recall = defaultThresholdMetrics.recall;
  const specificity = defaultThresholdMetrics.specificity;
  const f1Score = defaultThresholdMetrics.f1Score;
  const brierScore = probabilities.reduce((total, probability, index) => total + (weights[index]! * ((probability - yVector[index]!) ** 2)), 0) / weightedCaseCount;
  const deviance = -2 * logLikelihood;
  const nullDeviance = -2 * nullLogLikelihood;
  const rocAuc = computeRocAuc(probabilities, yVector, weights);
  const rocAucConfidenceInterval = computeRocAucConfidenceInterval(probabilities, yVector, weights);

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
  const scoreResiduals = yVector.map((value, index) => value - probabilities[index]!);
  const singletonClusters = rows.map((_entry, index) => `case_${index + 1}`);
  const robustCovariance = computeClusterRobustCovariance(covarianceMatrix, xMatrix, scoreResiduals, weights, singletonClusters);
  const robustSe = robustCovariance.map((row, index) => {
    const variance = row[index] ?? null;
    return variance !== null && variance >= 0 ? Math.sqrt(variance) : null;
  });
  const robustSeInflation: number[] = [];
  const coefficientStats = coefficients.map((coefficient, index) => {
    const standardError = Math.sqrt(Math.max(0, covarianceMatrix[index]![index]!));
    const statistic = standardError > 0 ? coefficient / standardError : null;
    const pValue = statistic === null ? null : normalTwoSidedPValue(statistic);
    const robustStandardError = robustSe[index] ?? null;
    const robustStatistic = robustStandardError !== null && robustStandardError > 0
      ? coefficient / robustStandardError
      : null;
    const robustPValue = robustStatistic === null ? null : normalTwoSidedPValue(robustStatistic);
    if (standardError > 0 && robustStandardError !== null && Number.isFinite(robustStandardError)) {
      robustSeInflation.push(robustStandardError / standardError);
    }
    const confidenceInterval = standardError > 0 ? {
      level: 0.95,
      lower: coefficient - (1.959963984540054 * standardError),
      upper: coefficient + (1.959963984540054 * standardError)
    } : null;
    const robustConfidenceInterval = robustStandardError !== null && robustStandardError > 0 ? {
      level: 0.95,
      lower: coefficient - (1.959963984540054 * robustStandardError),
      upper: coefficient + (1.959963984540054 * robustStandardError)
    } : null;
    const oddsRatio = Math.exp(coefficient);
    return {
      field: index === 0 ? '(Intercept)' : predictorFields[index - 1]!,
      coefficient,
      standardError,
      statistic,
      pValue,
      robustStandardError,
      robustStatistic,
      robustPValue,
      confidenceInterval,
      robustConfidenceInterval,
      oddsRatio,
      oddsRatioConfidenceInterval: exponentiateConfidenceInterval(confidenceInterval),
      robustOddsRatioConfidenceInterval: exponentiateConfidenceInterval(robustConfidenceInterval)
    };
  });
  const robustSeInflationMax = robustSeInflation.length > 0 ? Math.max(...robustSeInflation) : null;
  const robustSeInflationMean = robustSeInflation.length > 0
    ? robustSeInflation.reduce((total, value) => total + value, 0) / robustSeInflation.length
    : null;

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
      rows.length >= (predictorFields.length * 5) ? 'Sample size is acceptable for this model.' : 'Sample size is small relative to predictor count.'
    )
  ];
  const thresholdCandidates = Array.from({ length: 17 }, (_unused, index) => Number((0.1 + (index * 0.05)).toFixed(2)));
  if (!thresholdCandidates.includes(0.5)) thresholdCandidates.push(0.5);
  const thresholdAnalysis = [...new Set(thresholdCandidates)]
    .sort((left, right) => left - right)
    .map((threshold) => computeClassificationMetricsAtThreshold(probabilities, yVector, weights, threshold));
  const bestByF1 = [...thresholdAnalysis]
    .filter((item) => item.f1Score !== null)
    .sort((left, right) =>
      (right.f1Score! - left.f1Score!)
      || ((right.youdenJ ?? -Infinity) - (left.youdenJ ?? -Infinity))
      || Math.abs(left.threshold - 0.5) - Math.abs(right.threshold - 0.5))[0] ?? null;
  const bestByYouden = [...thresholdAnalysis]
    .filter((item) => item.youdenJ !== null)
    .sort((left, right) =>
      (right.youdenJ! - left.youdenJ!)
      || ((right.f1Score ?? -Infinity) - (left.f1Score ?? -Infinity))
      || Math.abs(left.threshold - 0.5) - Math.abs(right.threshold - 0.5))[0] ?? null;
  const calibrationBins = buildCalibrationBins(probabilities, yVector, weights, 10);
  const totalCalibrationWeight = calibrationBins.reduce((total, bin) => total + bin.weightedCount, 0);
  const meanAbsoluteCalibrationError = totalCalibrationWeight > 0
    ? calibrationBins.reduce((total, bin) => total + ((Math.abs(bin.calibrationGap ?? 0)) * bin.weightedCount), 0) / totalCalibrationWeight
    : null;
  const maxCalibrationGap = calibrationBins.reduce<number | null>((max, bin) => {
    if (bin.calibrationGap === null) return max;
    const absoluteGap = Math.abs(bin.calibrationGap);
    return max === null ? absoluteGap : Math.max(max, absoluteGap);
  }, null);
  const calibrationSlopeIntercept = computeCalibrationSlopeIntercept(probabilities, yVector, weights);
  assumptions.push(
    buildAssumptionCheck(
      'hosmer_lemeshow',
      'Hosmer-Lemeshow goodness of fit',
      hosmerLemeshowPValue === null ? 'warn' : hosmerLemeshowPValue >= 0.05 ? 'pass' : 'warn',
      hosmerLemeshowPValue,
      hosmerLemeshowPValue === null
        ? 'Hosmer-Lemeshow fit could not be computed for this model.'
        : hosmerLemeshowPValue >= 0.05
          ? 'No strong Hosmer-Lemeshow misfit signal detected.'
          : 'Hosmer-Lemeshow indicates calibration misfit; review predictors, link form, and binning.'
    ),
    buildAssumptionCheck(
      'calibration',
      'Calibration (mean absolute gap)',
      meanAbsoluteCalibrationError === null ? 'warn' : meanAbsoluteCalibrationError <= 0.1 ? 'pass' : 'warn',
      meanAbsoluteCalibrationError,
      meanAbsoluteCalibrationError === null
        ? 'Calibration gap could not be computed.'
        : meanAbsoluteCalibrationError <= 0.1
          ? 'Predicted probabilities are reasonably calibrated.'
          : 'Calibration gap is elevated; consider recalibration or threshold tuning.'
    ),
    buildAssumptionCheck(
      'calibration_intercept',
      'Calibration intercept',
      calibrationSlopeIntercept?.intercept === null || calibrationSlopeIntercept?.intercept === undefined
        ? 'warn'
        : Math.abs(calibrationSlopeIntercept.intercept) <= 0.1
          ? 'pass'
          : Math.abs(calibrationSlopeIntercept.intercept) <= 0.2
            ? 'warn'
            : 'fail',
      calibrationSlopeIntercept?.intercept ?? null,
      calibrationSlopeIntercept?.intercept === null || calibrationSlopeIntercept?.intercept === undefined
        ? 'Calibration intercept could not be estimated.'
        : Math.abs(calibrationSlopeIntercept.intercept) <= 0.1
          ? 'Calibration intercept is near zero.'
          : Math.abs(calibrationSlopeIntercept.intercept) <= 0.2
            ? 'Calibration intercept shows moderate offset from ideal.'
            : 'Calibration intercept shows substantial offset from ideal.'
    ),
    buildAssumptionCheck(
      'calibration_slope',
      'Calibration slope',
      calibrationSlopeIntercept?.slope === null || calibrationSlopeIntercept?.slope === undefined
        ? 'warn'
        : Math.abs(calibrationSlopeIntercept.slope - 1) <= 0.1
          ? 'pass'
          : Math.abs(calibrationSlopeIntercept.slope - 1) <= 0.2
            ? 'warn'
            : 'fail',
      calibrationSlopeIntercept?.slope ?? null,
      calibrationSlopeIntercept?.slope === null || calibrationSlopeIntercept?.slope === undefined
        ? 'Calibration slope could not be estimated.'
        : Math.abs(calibrationSlopeIntercept.slope - 1) <= 0.1
          ? 'Calibration slope is close to the ideal value of 1.'
          : Math.abs(calibrationSlopeIntercept.slope - 1) <= 0.2
            ? 'Calibration slope is moderately offset from 1.'
            : 'Calibration slope is substantially offset from 1.'
    )
  );
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
  const parameterCount = predictorFields.length + 1;
  const cooksValues = observations.map((observation, index) => {
    const h = leverageValues[index];
    const pearsonResidual = observation.standardizedResidual;
    if (h === null || pearsonResidual === null || pearsonResidual === undefined || !(h >= 0) || h >= 1 || parameterCount <= 0) return null;
    const numericResidual = pearsonResidual as number;
    return ((numericResidual ** 2) * h) / (parameterCount * Math.max(1e-12, (1 - h) ** 2));
  });
  observations.forEach((observation, index) => {
    observation.cooksDistance = cooksValues[index];
  });
  const outlierCount = observations.filter((item) => item.outlier).length;
  const maxAbsPearsonResidual = pearsonResiduals.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  const maxLeverage = leverageValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0);
  const maxCooksDistance = cooksValues.reduce<number>((max, value) => value === null ? max : Math.max(max, value), 0);
  const maxAbsDevianceResidual = devianceResiduals.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  const leverageThreshold = (2 * parameterCount) / Math.max(rows.length, 1);
  const highLeverageCount = leverageValues.filter((value) => value !== null && value > leverageThreshold).length;
  const influentialCount = cooksValues.filter((value) => value !== null && value > (4 / Math.max(rows.length, 1))).length;
  const vifByPredictor = computeVifByPredictor(rows, predictorFields);
  const toleranceByPredictor = Object.fromEntries(
    Object.entries(vifByPredictor).map(([field, value]) => [field, value === null || value <= 0 ? null : 1 / value])
  ) as Record<string, number | null>;
  const vifValues = Object.values(vifByPredictor).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const maxVif = vifValues.length > 0 ? Math.max(...vifValues) : null;
  const meanVif = vifValues.length > 0 ? vifValues.reduce((total, value) => total + value, 0) / vifValues.length : null;
  const maxPredictorCorrelation = computeMaxPredictorCorrelation(rows);
  const multicollinearity = predictorFields.map((field) => ({
    field,
    vif: vifByPredictor[field] ?? null,
    tolerance: toleranceByPredictor[field] ?? null
  }));
  const influenceSummary = [...observations]
    .sort((left, right) => {
      const cooksDelta = (right.cooksDistance ?? -Infinity) - (left.cooksDistance ?? -Infinity);
      if (Number.isFinite(cooksDelta) && cooksDelta !== 0) return cooksDelta;
      const leverageDelta = (right.leverage ?? -Infinity) - (left.leverage ?? -Infinity);
      if (Number.isFinite(leverageDelta) && leverageDelta !== 0) return leverageDelta;
      return Math.abs(right.standardizedResidual ?? 0) - Math.abs(left.standardizedResidual ?? 0);
    })
    .slice(0, 10)
    .map((observation) => ({
      caseId: observation.caseId,
      caseLabel: observation.caseLabel,
      leverage: observation.leverage ?? null,
      cooksDistance: observation.cooksDistance ?? null,
      standardizedResidual: observation.standardizedResidual ?? null,
      devianceResidual: observation.devianceResidual ?? null
    }));
  assumptions.push(
    buildAssumptionCheck(
      'robust_se_shift',
      'Robust SE shift',
      robustSeInflationMax === null ? 'warn' : robustSeInflationMax <= 1.25 ? 'pass' : robustSeInflationMax <= 1.75 ? 'warn' : 'fail',
      robustSeInflationMax,
      robustSeInflationMax === null
        ? 'Robust standard errors could not be computed for this model.'
        : robustSeInflationMax <= 1.25
          ? 'Robust and conventional SEs are closely aligned.'
          : robustSeInflationMax <= 1.75
            ? 'Moderate robust-SE inflation detected.'
            : 'Large robust-SE inflation detected; conventional inference may be optimistic.'
    ),
    buildAssumptionCheck(
      'multicollinearity',
      'Multicollinearity (max VIF)',
      maxVif === null ? 'warn' : maxVif <= 5 ? 'pass' : maxVif <= 10 ? 'warn' : 'fail',
      maxVif,
      maxVif === null
        ? 'Could not compute VIF for all predictors.'
        : maxVif <= 5
          ? 'Multicollinearity is within typical bounds.'
          : maxVif <= 10
            ? 'Moderate multicollinearity detected.'
            : 'High multicollinearity detected; coefficients may be unstable.'
    ),
    buildAssumptionCheck(
      'influence',
      "Influence (Cook's D)",
      influentialCount === 0 ? 'pass' : influentialCount <= 2 ? 'warn' : 'fail',
      influentialCount,
      influentialCount === 0
        ? 'No highly influential rows by Cook threshold.'
        : influentialCount <= 2
          ? 'A small number of influential rows were detected.'
          : 'Multiple influential rows were detected; inspect case-level diagnostics.'
    )
  );

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
    multicollinearity,
    influenceSummary,
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
      hosmerLemeshowDf,
      hosmerLemeshowGroupCount: realizedGroupCount,
      hosmerLemeshowPValue,
      defaultThreshold: 0.5,
      bestThresholdByF1: bestByF1?.threshold ?? null,
      bestThresholdByYouden: bestByYouden?.threshold ?? null,
      bestF1Score: bestByF1?.f1Score ?? null,
      bestYoudenJ: bestByYouden?.youdenJ ?? null,
      meanAbsoluteCalibrationError,
      maxCalibrationGap,
      calibrationIntercept: calibrationSlopeIntercept?.intercept ?? null,
      calibrationSlope: calibrationSlopeIntercept?.slope ?? null,
      outlierCount,
      maxAbsPearsonResidual,
      maxLeverage,
      maxCooksDistance,
      maxAbsDevianceResidual,
      highLeverageCount,
      influentialCount,
      maxVif,
      meanVif,
      maxPredictorCorrelation,
      rocAucCiLower: rocAucConfidenceInterval?.lower ?? null,
      rocAucCiUpper: rocAucConfidenceInterval?.upper ?? null,
      robustSeInflationMax,
      robustSeInflationMean,
      rocAuc,
      ...Object.fromEntries(Object.entries(vifByPredictor).map(([field, value]) => [`vif_${field}`, value])),
      ...Object.fromEntries(Object.entries(toleranceByPredictor).map(([field, value]) => [`tol_${field}`, value]))
    },
    thresholdAnalysis,
    calibration: {
      bins: calibrationBins,
      meanAbsoluteCalibrationError,
      maxCalibrationGap,
      calibrationIntercept: calibrationSlopeIntercept?.intercept ?? null,
      calibrationSlope: calibrationSlopeIntercept?.slope ?? null,
      bestThresholdByF1: bestByF1?.threshold ?? null,
      bestThresholdByYouden: bestByYouden?.threshold ?? null
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

function buildSignedRankExactDistribution(scaledRanks: number[]): Map<number, number> {
  let distribution = new Map<number, number>([[0, 1]]);
  for (const rank of scaledRanks) {
    const next = new Map<number, number>();
    for (const [sum, count] of distribution.entries()) {
      next.set(sum, (next.get(sum) ?? 0) + count);
      const shifted = sum + rank;
      next.set(shifted, (next.get(shifted) ?? 0) + count);
    }
    distribution = next;
  }
  return distribution;
}

function wilcoxonSignedRankExactPValue(
  absoluteDifferences: number[],
  observedW: number
): number | null {
  if (absoluteDifferences.length === 0 || absoluteDifferences.length > 25) return null;
  const ranks = rankValues(absoluteDifferences);
  const scaledRanks = ranks.map((rank) => Math.round(rank * 2));
  if (scaledRanks.some((rank, index) => Math.abs((ranks[index]! * 2) - rank) > 1e-8)) return null;
  const distribution = buildSignedRankExactDistribution(scaledRanks);
  const totalCombinations = 2 ** scaledRanks.length;
  if (!(totalCombinations > 0)) return null;
  const totalRank = scaledRanks.reduce((total, rank) => total + rank, 0);
  const observedScaled = Math.round(observedW * 2);
  const observedTail = Math.min(observedScaled, totalRank - observedScaled);
  const observedProbability = (distribution.get(observedTail) ?? 0) / totalCombinations;
  let pTwoSided = 0;
  for (const [sum, count] of distribution.entries()) {
    const tail = Math.min(sum, totalRank - sum);
    const probability = count / totalCombinations;
    if (probability <= observedProbability + 1e-12) pTwoSided += probability;
  }
  return Math.min(1, pTwoSided);
}

function runsExactPValue(
  positiveCount: number,
  negativeCount: number,
  observedRuns: number
): number | null {
  if (positiveCount <= 0 || negativeCount <= 0) return null;
  if (positiveCount + negativeCount > 24) return null;
  const memo = new Map<string, Map<number, number>>();
  const recur = (p: number, n: number, last: 0 | 1 | 2): Map<number, number> => {
    const key = `${p}|${n}|${last}`;
    const cached = memo.get(key);
    if (cached) return cached;
    if (p === 0 && n === 0) return new Map([[0, 1]]);
    const map = new Map<number, number>();
    if (p > 0) {
      const branch = recur(p - 1, n, 1);
      for (const [runs, count] of branch.entries()) {
        const nextRuns = runs + (last === 1 ? 0 : 1);
        map.set(nextRuns, (map.get(nextRuns) ?? 0) + count);
      }
    }
    if (n > 0) {
      const branch = recur(p, n - 1, 2);
      for (const [runs, count] of branch.entries()) {
        const nextRuns = runs + (last === 2 ? 0 : 1);
        map.set(nextRuns, (map.get(nextRuns) ?? 0) + count);
      }
    }
    memo.set(key, map);
    return map;
  };
  const distribution = recur(positiveCount, negativeCount, 0);
  const total = [...distribution.values()].reduce((sum, count) => sum + count, 0);
  if (!(total > 0)) return null;
  const expected = ((2 * positiveCount * negativeCount) / (positiveCount + negativeCount)) + 1;
  const observedDistance = Math.abs(observedRuns - expected);
  let pTwoSided = 0;
  for (const [runs, count] of distribution.entries()) {
    if (Math.abs(runs - expected) >= observedDistance - 1e-9) {
      pTwoSided += count / total;
    }
  }
  return Math.min(1, pTwoSided);
}

function rankWithTies(values: number[]): number[] {
  return rankValues(values);
}

export function analyzeNonparametricComparison(
  dataset: CaseDataset,
  outcomeField: string,
  groupField: string,
  options?: NonparametricComparisonOptions
): NonparametricTestResult {
  const normalizedOptions = normalizeAnalysisOptions(options);
  const requestedMethod = options?.method ?? null;
  const outcomeMeta = dataset.fields.find((field) => field.key === outcomeField);
  const groupMeta = dataset.fields.find((field) => field.key === groupField);

  if (requestedMethod === 'runs_test') {
    const sequenceRows = analysisRows(dataset, [outcomeField], options)
      .map(({ row }) => row[outcomeField])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (sequenceRows.length < 5) throw new Error('Runs test requires at least five usable numeric observations.');
    const median = medianValue(sequenceRows);
    if (median === null) throw new Error('Runs test requires non-missing numeric values.');
    const binary = sequenceRows
      .map((value) => (value > median ? 1 : value < median ? 0 : null))
      .filter((value): value is 0 | 1 => value !== null);
    if (binary.length < 4) throw new Error('Runs test needs variation above/below the median cutpoint.');
    let runCount = 1;
    for (let index = 1; index < binary.length; index += 1) {
      if (binary[index] !== binary[index - 1]) runCount += 1;
    }
    const positiveCount = binary.filter((value) => value === 1).length;
    const negativeCount = binary.length - positiveCount;
    const expectedRuns = ((2 * positiveCount * negativeCount) / (positiveCount + negativeCount)) + 1;
    const varianceRuns = (2 * positiveCount * negativeCount * ((2 * positiveCount * negativeCount) - positiveCount - negativeCount))
      / (((positiveCount + negativeCount) ** 2) * Math.max(1, positiveCount + negativeCount - 1));
    const zScore = varianceRuns > 0 ? (runCount - expectedRuns) / Math.sqrt(varianceRuns) : null;
    const exactPValue = options?.exact ? runsExactPValue(positiveCount, negativeCount, runCount) : null;
    const asymptoticPValue = zScore === null ? null : normalTwoSidedPValue(zScore);
    return {
      method: 'runs_test',
      outcomeField,
      outcomeLabel: outcomeMeta?.label ?? outcomeField,
      groupField,
      groupLabel: groupMeta?.label ?? groupField,
      caseCount: dataset.caseCount,
      validCaseCount: binary.length,
      weightedValidCaseCount: null,
      statistic: runCount,
      pValue: exactPValue ?? asymptoticPValue,
      exactPValue,
      asymptoticPValue,
      zScore,
      effectSize: zScore === null ? null : Math.abs(zScore) / Math.sqrt(binary.length),
      effectSizeLabel: 'r',
      groups: [
        { groupValue: 'Above median', count: positiveCount, meanRank: 0 },
        { groupValue: 'Below median', count: negativeCount, meanRank: 0 }
      ],
      diagnostics: {
        expectedRuns,
        varianceRuns,
        medianCutpoint: median
      },
      notes: [
        'Runs test evaluates randomness of sign changes around the sample median.',
        options?.exact ? 'Exact run-count p-value requested (available for small samples).' : 'Asymptotic normal approximation used for run-count p-value.'
      ],
      assumptions: [
        buildAssumptionCheck('binary_sequence', 'Binary sequence length', binary.length >= 4 ? 'pass' : 'fail', binary.length, 'At least four above/below observations are required.')
      ]
    };
  }

  if (requestedMethod === 'wilcoxon_signed_rank') {
    const beforeField = typeof options?.beforeField === 'string' && options.beforeField.trim()
      ? options.beforeField.trim()
      : '';
    if (!beforeField || beforeField === outcomeField) {
      throw new Error('Wilcoxon signed-rank requires options.beforeField different from outcomeField.');
    }
    const beforeMeta = requireDatasetField(dataset, beforeField, 'wilcoxon before');
    const afterMeta = requireDatasetField(dataset, outcomeField, 'wilcoxon after');
    const paired = analysisRows(dataset, [beforeField, outcomeField], options)
      .map(({ row }) => ({
        before: row[beforeField],
        after: row[outcomeField]
      }))
      .filter((entry): entry is { before: number; after: number } =>
        typeof entry.before === 'number' && Number.isFinite(entry.before)
        && typeof entry.after === 'number' && Number.isFinite(entry.after)
      );
    if (paired.length < 2) throw new Error('Wilcoxon signed-rank requires at least two paired numeric rows.');
    const differences = paired.map((entry) => entry.after - entry.before);
    const nonZero = differences
      .map((difference, index) => ({ difference, absolute: Math.abs(difference), index }))
      .filter((entry) => Math.abs(entry.difference) > 1e-12);
    if (nonZero.length < 2) throw new Error('Wilcoxon signed-rank requires at least two non-zero paired differences.');
    const ranks = rankWithTies(nonZero.map((entry) => entry.absolute));
    let positiveRankSum = 0;
    let negativeRankSum = 0;
    for (let index = 0; index < nonZero.length; index += 1) {
      if (nonZero[index]!.difference > 0) positiveRankSum += ranks[index]!;
      else negativeRankSum += ranks[index]!;
    }
    const statisticW = Math.min(positiveRankSum, negativeRankSum);
    const n = nonZero.length;
    const meanW = (n * (n + 1)) / 4;
    const absoluteValues = nonZero.map((entry) => entry.absolute).sort((left, right) => left - right);
    let tieCorrection = 0;
    let cursor = 0;
    while (cursor < absoluteValues.length) {
      let end = cursor + 1;
      while (end < absoluteValues.length && Math.abs(absoluteValues[end]! - absoluteValues[cursor]!) < 1e-12) end += 1;
      const tieSize = end - cursor;
      if (tieSize > 1) tieCorrection += (tieSize ** 3) - tieSize;
      cursor = end;
    }
    const varianceW = ((n * (n + 1) * (2 * n + 1)) - (tieCorrection / 2)) / 24;
    const continuity = options?.continuityCorrection === false ? 0 : 0.5;
    const zScore = varianceW > 0
      ? (statisticW - meanW - continuity * Math.sign(statisticW - meanW)) / Math.sqrt(varianceW)
      : null;
    const asymptoticPValue = zScore === null ? null : normalTwoSidedPValue(zScore);
    const exactPValue = options?.exact ? wilcoxonSignedRankExactPValue(nonZero.map((entry) => entry.absolute), statisticW) : null;
    return {
      method: 'wilcoxon_signed_rank',
      outcomeField,
      outcomeLabel: afterMeta.label,
      groupField: beforeField,
      groupLabel: beforeMeta.label,
      caseCount: dataset.caseCount,
      validCaseCount: nonZero.length,
      weightedValidCaseCount: null,
      statistic: statisticW,
      pValue: exactPValue ?? asymptoticPValue,
      exactPValue,
      asymptoticPValue,
      zScore,
      tieCount: differences.length - nonZero.length,
      continuityCorrectionApplied: options?.continuityCorrection !== false,
      effectSize: zScore === null ? null : Math.abs(zScore) / Math.sqrt(n),
      effectSizeLabel: 'r',
      groups: [
        { groupValue: 'Positive differences', count: nonZero.filter((entry) => entry.difference > 0).length, meanRank: positiveRankSum / Math.max(1, nonZero.filter((entry) => entry.difference > 0).length) },
        { groupValue: 'Negative differences', count: nonZero.filter((entry) => entry.difference < 0).length, meanRank: negativeRankSum / Math.max(1, nonZero.filter((entry) => entry.difference < 0).length) }
      ],
      diagnostics: {
        positiveRankSum,
        negativeRankSum,
        varianceW
      },
      notes: [
        'Wilcoxon signed-rank uses ranked absolute differences and direction signs for paired data.',
        options?.exact ? 'Exact two-sided p-value requested when computable.' : 'Asymptotic normal approximation used for p-value.'
      ],
      assumptions: [
        buildAssumptionCheck('non_zero_pairs', 'Non-zero paired differences', nonZero.length >= 2 ? 'pass' : 'fail', nonZero.length, 'At least two non-zero differences are required.')
      ]
    };
  }

  if (requestedMethod === 'friedman') {
    const relatedFields = [...new Set((options?.relatedFields ?? []).map((field) => String(field ?? '').trim()).filter(Boolean))];
    if (relatedFields.length < 3) {
      throw new Error('Friedman test requires options.relatedFields with at least three repeated numeric fields.');
    }
    const fieldMeta = relatedFields.map((field) => requireDatasetField(dataset, field, 'friedman field'));
    const rows = analysisRows(dataset, relatedFields, options)
      .map(({ row }) => relatedFields.map((field) => row[field]))
      .filter((entry): entry is number[] => entry.every((value) => typeof value === 'number' && Number.isFinite(value)));
    if (rows.length < 2) throw new Error('Friedman test requires at least two complete repeated rows.');
    const k = relatedFields.length;
    const n = rows.length;
    const rankSums = new Array<number>(k).fill(0);
    let tieCorrectionSum = 0;
    for (const row of rows) {
      const ranks = rankWithTies(row);
      for (let index = 0; index < k; index += 1) {
        rankSums[index]! += ranks[index]!;
      }
      const sorted = [...row].sort((left, right) => left - right);
      let cursor = 0;
      while (cursor < sorted.length) {
        let end = cursor + 1;
        while (end < sorted.length && Math.abs(sorted[end]! - sorted[cursor]!) < 1e-12) end += 1;
        const tieSize = end - cursor;
        if (tieSize > 1) tieCorrectionSum += (tieSize ** 3) - tieSize;
        cursor = end;
      }
    }
    const baseStatistic = (12 / (n * k * (k + 1))) * rankSums.reduce((total, value) => total + (value ** 2), 0) - (3 * n * (k + 1));
    const tieCorrectionFactor = 1 - (tieCorrectionSum / (n * (k ** 3 - k)));
    const statistic = tieCorrectionFactor > 0 ? baseStatistic / tieCorrectionFactor : baseStatistic;
    const degreesOfFreedom = k - 1;
    const pValue = chiSquarePValue(statistic, degreesOfFreedom);
    const kendallsW = n > 0 && k > 1 ? statistic / (n * (k - 1)) : null;
    return {
      method: 'friedman',
      outcomeField: relatedFields[0]!,
      outcomeLabel: fieldMeta[0]!.label,
      groupField: 'within_subject',
      groupLabel: 'Within-subject repeated fields',
      caseCount: dataset.caseCount,
      validCaseCount: n,
      weightedValidCaseCount: null,
      statistic,
      degreesOfFreedom,
      pValue,
      effectSize: kendallsW,
      effectSizeLabel: "Kendall's W",
      groups: fieldMeta.map((field, index) => ({
        groupValue: field.label,
        count: n,
        meanRank: rankSums[index]! / n
      })),
      diagnostics: {
        tieCorrectionFactor
      },
      notes: [
        'Friedman test evaluates repeated-measures rank differences across related samples.',
        "Kendall's W is reported as an effect-size measure."
      ],
      assumptions: [
        buildAssumptionCheck('related_fields', 'Repeated fields', relatedFields.length >= 3 ? 'pass' : 'fail', relatedFields.length, 'At least three repeated fields are required.')
      ]
    };
  }

  if (requestedMethod === 'median_test') {
    const independent = analyzeNonparametricComparison(dataset, outcomeField, groupField, {
      ...options,
      method: 'kruskal_wallis'
    });
    const pairsForMedian = analysisRows(dataset, [outcomeField, groupField], options)
      .map(({ row }) => ({
        outcome: row[outcomeField],
        group: row[groupField]
      }))
      .filter((entry): entry is { outcome: number; group: Exclude<DatasetValue, null> } =>
        typeof entry.outcome === 'number' && Number.isFinite(entry.outcome) && entry.group !== null
      );
    const grandMedian = medianValue(pairsForMedian.map((entry) => entry.outcome));
    if (grandMedian === null) throw new Error('Median test requires valid numeric outcomes.');
    const nonTied = pairsForMedian.filter((entry) => Math.abs(entry.outcome - grandMedian) > 1e-12);
    const grouped = new Map<string, { above: number; below: number }>();
    for (const entry of nonTied) {
      const key = formatValue(entry.group);
      const existing = grouped.get(key) ?? { above: 0, below: 0 };
      if (entry.outcome > grandMedian) existing.above += 1;
      else existing.below += 1;
      grouped.set(key, existing);
    }
    const rowsCount = [...grouped.values()].map((value) => value.above + value.below);
    const totalAbove = [...grouped.values()].reduce((total, value) => total + value.above, 0);
    const totalBelow = [...grouped.values()].reduce((total, value) => total + value.below, 0);
    const grandTotal = totalAbove + totalBelow;
    let chiSquare = 0;
    for (const groupStats of grouped.values()) {
      const groupTotal = groupStats.above + groupStats.below;
      const expectedAbove = grandTotal > 0 ? (groupTotal * totalAbove) / grandTotal : 0;
      const expectedBelow = grandTotal > 0 ? (groupTotal * totalBelow) / grandTotal : 0;
      if (expectedAbove > 0) chiSquare += ((groupStats.above - expectedAbove) ** 2) / expectedAbove;
      if (expectedBelow > 0) chiSquare += ((groupStats.below - expectedBelow) ** 2) / expectedBelow;
    }
    const df = Math.max(1, grouped.size - 1);
    const pValue = chiSquarePValue(chiSquare, df);
    const cramersV = grandTotal > 0 ? Math.sqrt(chiSquare / (grandTotal * Math.max(1, Math.min(1, grouped.size - 1)))) : null;
    return {
      ...independent,
      method: 'median_test',
      statistic: chiSquare,
      degreesOfFreedom: df,
      pValue,
      effectSize: cramersV,
      effectSizeLabel: "Cramer's V",
      diagnostics: {
        grandMedian,
        tiedExcludedCount: pairsForMedian.length - nonTied.length,
        minGroupSize: rowsCount.length > 0 ? Math.min(...rowsCount) : 0
      },
      notes: [
        ...independent.notes,
        'Mood median test compares counts above/below the grand median across groups.'
      ]
    };
  }

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
  const method: NonparametricTestResult['method'] = requestedMethod ?? (groupValues.length === 2 ? 'mann_whitney_u' : 'kruskal_wallis');
  if (method === 'mann_whitney_u' && groupValues.length !== 2) {
    throw new Error('Mann-Whitney requires exactly two groups.');
  }
  if (method === 'kruskal_wallis' && groupValues.length < 3) {
    throw new Error('Kruskal-Wallis requires at least three groups.');
  }
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
    const exactPValue = options?.exact && (!normalizedOptions.weightField) && Number.isFinite(statistic)
      ? (() => {
        const n1 = leftPairs.length;
        const n2 = rightPairs.length;
        if (n1 <= 0 || n2 <= 0 || n1 + n2 > 24) return null;
        const total = n1 + n2;
        const allRanks = rankValues([...leftPairs.map((entry) => entry.outcome), ...rightPairs.map((entry) => entry.outcome)]);
        const rankScale = allRanks.map((rank) => Math.round(rank * 2));
        if (rankScale.some((rank, index) => Math.abs((allRanks[index]! * 2) - rank) > 1e-8)) return null;
        const target = Math.round(statistic * 2);
        const memo = new Map<string, Map<number, number>>();
        const recur = (idx: number, choose: number): Map<number, number> => {
          const key = `${idx}|${choose}`;
          const cached = memo.get(key);
          if (cached) return cached;
          if (choose === 0) return new Map([[0, 1]]);
          if (idx >= rankScale.length) return new Map();
          const map = new Map<number, number>();
          const skip = recur(idx + 1, choose);
          for (const [sum, count] of skip.entries()) {
            map.set(sum, (map.get(sum) ?? 0) + count);
          }
          const take = recur(idx + 1, choose - 1);
          for (const [sum, count] of take.entries()) {
            const shifted = sum + rankScale[idx]!;
            map.set(shifted, (map.get(shifted) ?? 0) + count);
          }
          memo.set(key, map);
          return map;
        };
        const distribution = recur(0, n1);
        const totalComb = distribution.size > 0
          ? [...distribution.values()].reduce((sum, count) => sum + count, 0)
          : 0;
        if (!(totalComb > 0)) return null;
        const observedProbability = (distribution.get(target) ?? 0) / totalComb;
        let pTwo = 0;
        for (const count of distribution.values()) {
          const probability = count / totalComb;
          if (probability <= observedProbability + 1e-12) pTwo += probability;
        }
        return Math.min(1, pTwo);
      })()
      : null;
    const asymptoticPValue = stdU > 0 ? normalTwoSidedPValue(zScore) : null;
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
      pValue: exactPValue ?? asymptoticPValue,
      exactPValue,
      asymptoticPValue,
      zScore,
      effectSize,
      effectSizeLabel: 'r',
      groups,
      notes: normalizedOptions.weightField
        ? ['Weighted rank handling is enabled for the Mann-Whitney comparison.']
        : options?.exact ? ['Exact small-sample Mann-Whitney p-value requested when computable.'] : [],
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
    degreesOfFreedom,
    pValue: chiSquarePValue(statistic, degreesOfFreedom),
    effectSize: totalWeight > 1 ? Math.max(0, (statistic - groups.length + 1) / (totalWeight - groups.length)) : null,
    effectSizeLabel: 'epsilon_squared',
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
  subscales?: Array<{ label: string; fields: string[] }>,
  stratifyField?: string
): ReliabilityResult {
  const cronbachAlphaFromRows = (inputRows: number[][]): number | null => {
    if (inputRows.length < 2) return null;
    const itemCountInner = inputRows[0]?.length ?? 0;
    if (itemCountInner < 2) return null;
    const itemColumnsInner = Array.from({ length: itemCountInner }, (_unused, fieldIndex) =>
      inputRows.map((row) => row[fieldIndex] ?? 0)
    );
    const itemVariancesInner = itemColumnsInner.map((column) => weightedVariance(column, new Array(column.length).fill(1)) ?? 0);
    const totalScoresInner = inputRows.map((row) => row.reduce((total, value) => total + value, 0));
    const totalVarianceInner = weightedVariance(totalScoresInner, new Array(totalScoresInner.length).fill(1));
    if (totalVarianceInner === null || !(totalVarianceInner > 0)) return null;
    const alphaInner = (itemCountInner / (itemCountInner - 1))
      * (1 - (itemVariancesInner.reduce((total, value) => total + value, 0) / totalVarianceInner));
    return Number.isFinite(alphaInner) ? alphaInner : null;
  };
  const standardizedAlphaFromRows = (inputRows: number[][]): number | null => {
    if (inputRows.length < 2) return null;
    const itemCountInner = inputRows[0]?.length ?? 0;
    if (itemCountInner < 2) return null;
    const itemColumnsInner = Array.from({ length: itemCountInner }, (_unused, fieldIndex) =>
      inputRows.map((row) => row[fieldIndex] ?? 0)
    );
    const correlations: number[] = [];
    for (let leftIndex = 0; leftIndex < itemColumnsInner.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < itemColumnsInner.length; rightIndex += 1) {
        const correlation = pearsonCorrelation(itemColumnsInner[leftIndex]!, itemColumnsInner[rightIndex]!);
        if (correlation !== null && Number.isFinite(correlation)) correlations.push(correlation);
      }
    }
    if (correlations.length === 0) return null;
    const averageCorrelation = correlations.reduce((total, value) => total + value, 0) / correlations.length;
    const denominator = 1 + ((itemCountInner - 1) * averageCorrelation);
    if (Math.abs(denominator) < 1e-12) return null;
    const standardizedInner = (itemCountInner * averageCorrelation) / denominator;
    return Number.isFinite(standardizedInner) ? standardizedInner : null;
  };
  const reliabilityJackknifeConfidenceInterval = (
    inputRows: number[][],
    estimator: (jackknifeRows: number[][]) => number | null
  ): ConfidenceInterval | null => {
    if (inputRows.length < 4) return null;
    const estimate = estimator(inputRows);
    if (estimate === null || !Number.isFinite(estimate)) return null;
    const leaveOneOut = inputRows
      .map((_unused, index) => estimator([...inputRows.slice(0, index), ...inputRows.slice(index + 1)]))
      .filter((value): value is number => value !== null && Number.isFinite(value));
    if (leaveOneOut.length < 3) return null;
    const mean = leaveOneOut.reduce((total, value) => total + value, 0) / leaveOneOut.length;
    const jackknifeVariance = ((leaveOneOut.length - 1) / leaveOneOut.length)
      * leaveOneOut.reduce((total, value) => total + ((value - mean) ** 2), 0);
    if (!(jackknifeVariance > 0)) return null;
    const interval = confidenceInterval95(estimate, Math.sqrt(jackknifeVariance), leaveOneOut.length - 1);
    if (!interval) return null;
    return {
      level: interval.level,
      lower: interval.lower === null ? null : Math.max(-1, Math.min(1, interval.lower)),
      upper: interval.upper === null ? null : Math.max(-1, Math.min(1, interval.upper))
    };
  };

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
  const alphaConfidenceInterval = reliabilityJackknifeConfidenceInterval(rows, cronbachAlphaFromRows);
  const standardizedAlphaConfidenceInterval = reliabilityJackknifeConfidenceInterval(rows, standardizedAlphaFromRows);
  const correlationMatrix = buildCorrelationMatrix(itemColumns);
  const omegaTotal = computeOmegaTotalFromCorrelationMatrix(correlationMatrix);
  const midpoint = Math.ceil(itemCount / 2);
  const splitHalfLeft = rows.map((row) => row.slice(0, midpoint).reduce((total, value) => total + value, 0));
  const splitHalfRight = rows.map((row) => row.slice(midpoint).reduce((total, value) => total + value, 0));
  const splitHalfCorrelation = midpoint < itemCount ? pearsonCorrelation(splitHalfLeft, splitHalfRight) : null;
  const spearmanBrown = splitHalfCorrelation === null || splitHalfCorrelation <= -1
    ? null
    : (2 * splitHalfCorrelation) / (1 + splitHalfCorrelation);
  const scaleMean = weightedMean(totalScores, new Array(totalScores.length).fill(1));
  const standardErrorOfMeasurement = totalVariance !== null && alpha !== null
    ? Math.sqrt(Math.max(0, totalVariance * Math.max(0, 1 - alpha)))
    : null;
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

  const subscaleSummaries = Array.isArray(subscales)
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
          itemCount: filteredFields.length,
          alpha: subscaleResult.alpha,
          alphaConfidenceInterval: subscaleResult.alphaConfidenceInterval,
          standardizedAlpha: subscaleResult.standardizedAlpha,
          standardizedAlphaConfidenceInterval: subscaleResult.standardizedAlphaConfidenceInterval,
          omegaTotal: subscaleResult.omegaTotal,
          averageInterItemCorrelation: subscaleResult.averageInterItemCorrelation,
          splitHalfCorrelation: subscaleResult.splitHalfCorrelation,
          spearmanBrown: subscaleResult.spearmanBrown,
          standardErrorOfMeasurement: subscaleResult.standardErrorOfMeasurement
        };
      })
      .filter((subscale): subscale is NonNullable<typeof subscale> => subscale !== null)
    : [];

  let stratifiedByField: string | null = null;
  let stratifiedByLabel: string | null = null;
  const strata: ReliabilityStrataSummary[] = [];
  const normalizedStratifyField = typeof stratifyField === 'string' && stratifyField.trim()
    ? stratifyField.trim()
    : null;
  if (normalizedStratifyField) {
    const stratifyMeta = dataset.fields.find((item) => item.key === normalizedStratifyField);
    if (!stratifyMeta) {
      throw new Error(`Stratify field not found: ${normalizedStratifyField}`);
    }
    stratifiedByField = stratifyMeta.key;
    stratifiedByLabel = stratifyMeta.label;
    const grouped = new Map<string, { label: string; rows: DatasetRow[] }>();
    for (const row of dataset.rows) {
      const rawValue = row[normalizedStratifyField] ?? null;
      const key = JSON.stringify(rawValue);
      const entry = grouped.get(key) ?? { label: formatValue(rawValue), rows: [] };
      entry.rows.push(row);
      grouped.set(key, entry);
    }
    for (const entry of [...grouped.values()].sort((left, right) =>
      right.rows.length - left.rows.length || left.label.localeCompare(right.label)
    )) {
      const stratumDataset: CaseDataset = {
        caseCount: entry.rows.length,
        fields: dataset.fields,
        rows: entry.rows,
        notes: dataset.notes
      };
      try {
        const stratumResult = analyzeReliability(stratumDataset, uniqueFields, options, subscales);
        strata.push({
          groupValue: entry.label,
          caseCount: stratumDataset.caseCount,
          validCaseCount: stratumResult.validCaseCount,
          itemCount: stratumResult.itemCount,
          alpha: stratumResult.alpha,
          alphaConfidenceInterval: stratumResult.alphaConfidenceInterval,
          standardizedAlpha: stratumResult.standardizedAlpha,
          standardizedAlphaConfidenceInterval: stratumResult.standardizedAlphaConfidenceInterval,
          omegaTotal: stratumResult.omegaTotal,
          averageInterItemCorrelation: stratumResult.averageInterItemCorrelation,
          splitHalfCorrelation: stratumResult.splitHalfCorrelation,
          spearmanBrown: stratumResult.spearmanBrown,
          standardErrorOfMeasurement: stratumResult.standardErrorOfMeasurement,
          notes: stratumResult.notes
        });
      } catch (error) {
        strata.push({
          groupValue: entry.label,
          caseCount: stratumDataset.caseCount,
          validCaseCount: 0,
          itemCount: uniqueFields.length,
          alpha: null,
          alphaConfidenceInterval: null,
          standardizedAlpha: null,
          standardizedAlphaConfidenceInterval: null,
          omegaTotal: null,
          averageInterItemCorrelation: null,
          splitHalfCorrelation: null,
          spearmanBrown: null,
          standardErrorOfMeasurement: null,
          notes: [
            error instanceof Error
              ? error.message
              : 'Reliability could not be computed for this stratum.'
          ]
        });
      }
    }
  }

  return {
    fields: uniqueFields,
    fieldLabels: fieldMeta.map((field) => field.label),
    caseCount: dataset.caseCount,
    validCaseCount: rows.length,
    itemCount,
    alpha,
    alphaConfidenceInterval,
    standardizedAlpha,
    standardizedAlphaConfidenceInterval,
    omegaTotal,
    averageInterItemCorrelation,
    splitHalfCorrelation,
    spearmanBrown,
    scaleMean,
    scaleVariance: totalVariance,
    standardErrorOfMeasurement,
    items,
    subscales: subscaleSummaries,
    stratifiedByField,
    stratifiedByLabel,
    strata,
    notes: [
      'Reliability is computed as Cronbach alpha over complete numeric cases.',
      'Current implementation uses listwise complete rows across the selected fields.',
      'Standardized alpha, omega total, and split-half reliability are also reported for quick scale review.',
      'Approximate 95% confidence intervals for alpha and standardized alpha are estimated via jackknife resampling.',
      ...(stratifiedByField ? [`Stratified reliability was computed by ${stratifiedByLabel ?? stratifiedByField}.`] : [])
    ]
  };
}

export function analyzeFactorAnalysis(
  dataset: CaseDataset,
  fields: string[],
  requestedFactorCount?: number,
  options?: DatasetAnalysisOptions,
  rotation: FactorRotation = 'none',
  extraction: 'principal_components' | 'principal_axis' = 'principal_components',
  modelOptions: FactorAnalysisOptions = {}
): FactorAnalysisResult {
  const FACTOR_SCORE_SAMPLE_LIMIT = 200;
  const maxIterations = Math.max(10, Math.min(1000, Math.floor(modelOptions.maxIterations ?? 200)));
  const convergenceTolerance = Math.max(1e-8, Math.min(1e-2, modelOptions.convergenceTolerance ?? 1e-5));
  const parallelAnalysisSamples = Math.max(10, Math.min(400, Math.floor(modelOptions.parallelAnalysisSamples ?? 60)));
  const confidenceLevel = Math.min(0.999, Math.max(0.8, modelOptions.confidenceLevel ?? 0.95));
  const uniqueFields = [...new Set(fields.map((field) => field.trim()).filter(Boolean))];
  if (uniqueFields.length < 2) {
    throw new Error('Choose at least two numeric fields for factor analysis.');
  }
  const fieldMeta = uniqueFields.map((field) => {
    const meta = dataset.fields.find((item) => item.key === field);
    if (!meta) throw new Error(`Field not found: ${field}`);
    return meta;
  });
  const completeRows = analysisRows(dataset, uniqueFields, {
    ...options,
    missingStrategy: 'listwise'
  })
    .map(({ row }, rowIndex) => ({
      row,
      rowIndex,
      values: uniqueFields.map((field) => row[field])
    }))
    .filter((entry): entry is { row: DatasetRow; rowIndex: number; values: number[] } =>
      entry.values.every((value) => typeof value === 'number')
    );
  const rows = completeRows.map((entry) => entry.values);
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
  const extractPrincipalAxisLoadings = (
    correlation: number[][],
    selectedFactorCount: number
  ): { loadings: number[][]; communalities: number[]; converged: boolean; iterations: number } => {
    const size = correlation.length;
    const boundedFactorCount = Math.max(1, Math.min(selectedFactorCount, size));
    let communalities = new Array<number>(size).fill(0.7);
    try {
      const inverse = invertMatrix(correlation);
      communalities = communalities.map((_value, index) => {
        const diagonal = inverse[index]?.[index] ?? null;
        if (!diagonal || diagonal <= 0 || !Number.isFinite(diagonal)) return 0.7;
        return Math.max(0.05, Math.min(0.99, 1 - (1 / diagonal)));
      });
    } catch {
      communalities = correlation.map((row, rowIndex) => {
        const maxCorrelation = row
          .filter((_value, columnIndex) => columnIndex !== rowIndex)
          .reduce((max, value) => Math.max(max, Math.abs(value)), 0);
        return Math.max(0.05, Math.min(0.99, maxCorrelation ** 2));
      });
    }
    let loadings = Array.from({ length: size }, () => Array.from({ length: boundedFactorCount }, () => 0));
    let converged = false;
    let iterations = 0;
    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      iterations = iteration + 1;
      const reduced = cloneMatrix(correlation);
      for (let index = 0; index < size; index += 1) {
        reduced[index]![index] = communalities[index]!;
      }
      const working = cloneMatrix(reduced);
      const extractedComponents: Array<{ eigenvalue: number; eigenvector: number[] }> = [];
      for (let index = 0; index < size; index += 1) {
        const component = powerIterationSymmetric(working);
        if (!(component.eigenvalue > 1e-8)) break;
        extractedComponents.push(component);
        const deflated = deflateMatrix(working, outerProduct(component.eigenvector, component.eigenvalue));
        for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
          for (let columnIndex = 0; columnIndex < size; columnIndex += 1) {
            working[rowIndex]![columnIndex] = deflated[rowIndex]![columnIndex]!;
          }
        }
      }
      loadings = Array.from({ length: size }, (_unused, fieldIndex) =>
        extractedComponents.slice(0, boundedFactorCount).map((component) =>
          component.eigenvector[fieldIndex]! * Math.sqrt(Math.max(component.eigenvalue, 0))
        )
      );
      if (loadings[0]?.length !== boundedFactorCount) {
        loadings = Array.from({ length: size }, () => Array.from({ length: boundedFactorCount }, () => 0));
      }
      const nextCommunalities = loadings.map((row) => row.reduce((total, value) => total + (value ** 2), 0));
      const maxDelta = nextCommunalities.reduce((max, value, index) => Math.max(max, Math.abs(value - communalities[index]!)), 0);
      communalities = nextCommunalities.map((value) => Math.max(0, Math.min(0.9999, value)));
      if (maxDelta < convergenceTolerance) {
        converged = true;
        break;
      }
    }
    return { loadings, communalities, converged, iterations };
  };

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
  const parallelReferenceEigenvalues = (() => {
    const random = seededRandom(20260501);
    const samples: number[][] = Array.from({ length: matrixSize }, () => new Array<number>(parallelAnalysisSamples).fill(0));
    for (let sampleIndex = 0; sampleIndex < parallelAnalysisSamples; sampleIndex += 1) {
      const syntheticRows = Array.from({ length: rows.length }, () =>
        Array.from({ length: matrixSize }, () => ((random() * 2) - 1))
      );
      const syntheticColumns = Array.from({ length: matrixSize }, (_unused, fieldIndex) =>
        syntheticRows.map((row) => row[fieldIndex]!)
      );
      const syntheticCorrelation = syntheticColumns.map((columnA, rowIndex) =>
        syntheticColumns.map((columnB, columnIndex) => {
          if (rowIndex === columnIndex) return 1;
          return pearsonCorrelation(columnA, columnB) ?? 0;
        })
      );
      const workingSynthetic = cloneMatrix(syntheticCorrelation);
      for (let componentIndex = 0; componentIndex < matrixSize; componentIndex += 1) {
        const component = powerIterationSymmetric(workingSynthetic);
        if (!(component.eigenvalue > 1e-8)) break;
        samples[componentIndex]![sampleIndex] = component.eigenvalue;
        const deflated = deflateMatrix(workingSynthetic, outerProduct(component.eigenvector, component.eigenvalue));
        for (let left = 0; left < matrixSize; left += 1) {
          for (let right = 0; right < matrixSize; right += 1) {
            workingSynthetic[left]![right] = deflated[left]![right]!;
          }
        }
      }
    }
    return samples.map((componentSamples) => {
      const ordered = [...componentSamples].filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
      if (ordered.length === 0) return 0;
      const percentileIndex = Math.min(ordered.length - 1, Math.max(0, Math.floor(0.95 * (ordered.length - 1))));
      return ordered[percentileIndex] ?? ordered[ordered.length - 1]!;
    });
  })();
  const kaiserRecommendation = Math.max(1, eigenvalues.filter((value) => value >= 1).length || Math.min(1, extracted.length));
  const parallelRecommendation = Math.max(
    1,
    eigenvalues.filter((value, index) => value > (parallelReferenceEigenvalues[index] ?? Number.POSITIVE_INFINITY)).length || 1
  );
  const recommendedFactorCount = Math.max(kaiserRecommendation, parallelRecommendation);
  const maxExtractableFactorCount = extraction === 'principal_axis'
    ? matrixSize
    : extracted.length;
  const factorCount = Math.min(
    Math.max(1, Math.floor(requestedFactorCount ?? Math.min(recommendedFactorCount, matrixSize))),
    maxExtractableFactorCount
  );
  if (factorCount === 0) {
    throw new Error('Factor extraction did not converge on a usable component.');
  }

  const totalEigenvalue = matrixSize;
  const principalAxis = extraction === 'principal_axis'
    ? extractPrincipalAxisLoadings(correlationMatrix, factorCount)
    : null;
  const baseLoadingMatrix = extraction === 'principal_axis'
    ? principalAxis?.loadings ?? Array.from({ length: matrixSize }, () => Array.from({ length: factorCount }, () => 0))
    : uniqueFields.map((_field, fieldIndex) =>
      extracted.slice(0, factorCount).map((component) =>
        component.eigenvector[fieldIndex]! * Math.sqrt(Math.max(component.eigenvalue, 0))
      )
    );
  let rotatedLoadingMatrix = baseLoadingMatrix.map((row) => [...row]);
  let factorCorrelationMatrix: number[][] | null = null;
  let patternMatrix: number[][] | null = null;
  let structureMatrix: number[][] | null = null;
  if (rotation === 'varimax') {
    rotatedLoadingMatrix = applyVarimaxRotation(baseLoadingMatrix);
  } else if (rotation === 'quartimax') {
    rotatedLoadingMatrix = applyQuartimaxRotation(baseLoadingMatrix);
  } else if (rotation === 'promax') {
    const rotated = applyPromaxRotation(baseLoadingMatrix);
    rotatedLoadingMatrix = rotated.loadings;
    factorCorrelationMatrix = rotated.factorCorrelationMatrix;
    patternMatrix = rotatedLoadingMatrix.map((row) => [...row]);
    if (factorCorrelationMatrix && factorCorrelationMatrix.length === factorCount) {
      try {
        structureMatrix = multiplyMatrices(rotatedLoadingMatrix, factorCorrelationMatrix);
      } catch {
        structureMatrix = null;
      }
    }
  }

  const communalities = new Array<number>(matrixSize).fill(0);
  for (let fieldIndex = 0; fieldIndex < matrixSize; fieldIndex += 1) {
    communalities[fieldIndex] = rotatedLoadingMatrix[fieldIndex]!.reduce((total, value) => total + (value ** 2), 0);
  }
  const uniquenesses = communalities.map((value) => 1 - value);
  let reconstructedCorrelation: number[][] | null = null;
  try {
    const core = factorCorrelationMatrix
      ? multiplyMatrices(multiplyMatrices(rotatedLoadingMatrix, factorCorrelationMatrix), transposeMatrix(rotatedLoadingMatrix))
      : multiplyMatrices(rotatedLoadingMatrix, transposeMatrix(rotatedLoadingMatrix));
    reconstructedCorrelation = core.map((row, rowIndex) =>
      row.map((value, columnIndex) => value + (rowIndex === columnIndex ? Math.max(0, uniquenesses[rowIndex] ?? 0) : 0))
    );
  } catch {
    reconstructedCorrelation = null;
  }
  const residualRmsr = reconstructedCorrelation
    ? (() => {
      const residualSquares: number[] = [];
      for (let rowIndex = 0; rowIndex < matrixSize; rowIndex += 1) {
        for (let columnIndex = rowIndex + 1; columnIndex < matrixSize; columnIndex += 1) {
          const residual = (correlationMatrix[rowIndex]![columnIndex] ?? 0) - (reconstructedCorrelation[rowIndex]![columnIndex] ?? 0);
          residualSquares.push(residual ** 2);
        }
      }
      if (residualSquares.length === 0) return null;
      return Math.sqrt(residualSquares.reduce((total, value) => total + value, 0) / residualSquares.length);
    })()
    : null;
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

  const columnMeans = columns.map((column) => column.reduce((total, value) => total + value, 0) / column.length);
  const columnStdDevs = columns.map((column) => sampleStdDev(column) || 1);
  const factorScoreRows: FactorScoreCase[] = completeRows.map((entry, entryIndex) => {
    const standardizedValues = entry.values.map((value, fieldIndex) => {
      const stdDev = columnStdDevs[fieldIndex]!;
      if (!(stdDev > 0) || !Number.isFinite(stdDev)) return 0;
      return (value - columnMeans[fieldIndex]!) / stdDev;
    });
    const scores = Array.from({ length: factorCount }, (_unused, factorIndex) =>
      standardizedValues.reduce(
        (total, standardizedValue, fieldIndex) =>
          total + (standardizedValue * (rotatedLoadingMatrix[fieldIndex]![factorIndex] ?? 0)),
        0
      )
    );
    const caseIdRaw = entry.row.case_id;
    const caseLabelRaw = entry.row.case_label;
    const caseId = typeof caseIdRaw === 'string' && caseIdRaw.trim()
      ? caseIdRaw.trim()
      : `case-${entry.rowIndex + 1}`;
    const caseLabel = typeof caseLabelRaw === 'string' && caseLabelRaw.trim()
      ? caseLabelRaw.trim()
      : `Case ${entryIndex + 1}`;
    return {
      caseId,
      caseLabel,
      scores
    };
  });
  const factorScoreSummary: FactorScoreSummary[] = Array.from({ length: factorCount }, (_unused, factorIndex) => {
    const values = factorScoreRows.map((row) => row.scores[factorIndex]).filter((value): value is number => typeof value === 'number');
    return {
      factor: factorIndex + 1,
      mean: values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : null,
      stdDev: sampleStdDev(values),
      min: values.length > 0 ? Math.min(...values) : null,
      max: values.length > 0 ? Math.max(...values) : null
    };
  });

  const kmoDiagnostics = computeKmoDiagnostics(correlationMatrix);
  const determinant = matrixDeterminant(correlationMatrix);
  const positiveDeterminant = determinant > 0 && Number.isFinite(determinant) ? determinant : null;
  const bartlettDegreesOfFreedom = Math.max(0, Math.floor((matrixSize * (matrixSize - 1)) / 2));
  const bartlettScale = (rows.length - 1) - ((2 * matrixSize + 5) / 6);
  const bartlettStatistic = positiveDeterminant !== null && positiveDeterminant < 1 && bartlettScale > 0
    ? Math.max(0, -bartlettScale * Math.log(positiveDeterminant))
    : null;
  const bartlettPValue = bartlettStatistic === null
    ? null
    : chiSquarePValue(bartlettStatistic, bartlettDegreesOfFreedom);

  return {
    fields: uniqueFields,
    fieldLabels: fieldMeta.map((field) => field.label),
    caseCount: dataset.caseCount,
    validCaseCount: rows.length,
    factorCount,
    recommendedFactorCount,
    extraction,
    rotation,
    eigenvalues,
    factors,
    factorScoreSummary,
    factorScoreCaseCount: factorScoreRows.length,
    factorScoreSample: factorScoreRows.slice(0, FACTOR_SCORE_SAMPLE_LIMIT),
    factorScoreSampleLimit: FACTOR_SCORE_SAMPLE_LIMIT,
    correlationMatrix: correlationMatrix.map((values, index) => ({
      field: uniqueFields[index]!,
      values
    })),
    diagnostics: {
      correlationDeterminant: positiveDeterminant,
      kmoOverall: kmoDiagnostics.overall,
      kmoPerField: uniqueFields.map((field, index) => ({
        field,
        label: fieldMeta[index]!.label,
        kmo: kmoDiagnostics.perField[index] ?? null
      })),
      bartlettTest: {
        chiSquare: bartlettStatistic,
        degreesOfFreedom: bartlettDegreesOfFreedom,
        pValue: bartlettPValue
      },
      residualRmsr,
      totalCommunality: communalities.reduce((total, value) => total + value, 0),
      heywoodCount: communalities.filter((value) => value > 1).length,
      factorCorrelationMatrix,
      patternMatrix,
      structureMatrix,
      parallelAnalysisRecommendedFactorCount: parallelRecommendation,
      parallelAnalysisReferenceEigenvalues: parallelReferenceEigenvalues,
      extractionIterations: principalAxis?.iterations ?? 1,
      extractionConverged: principalAxis?.converged ?? true
    },
    modelOptions: {
      maxIterations,
      convergenceTolerance,
      parallelAnalysisSamples,
      confidenceLevel
    },
    notes: [
      extraction === 'principal_axis'
        ? `Principal-axis extraction${principalAxis?.converged === false ? ' reached iteration limit before full convergence.' : ' converged successfully.'}`
        : 'Principal-components extraction was applied.',
      'Kaiser-style factor count recommendation is based on eigenvalues greater than or equal to 1.',
      `Parallel analysis reference (${parallelAnalysisSamples} synthetic sample${parallelAnalysisSamples === 1 ? '' : 's'}) recommends ${parallelRecommendation} factor(s).`,
      'Factor scores are standardized component-score estimates intended for exploratory profiling.',
      rotation === 'varimax'
        ? 'Varimax rotation is applied as orthogonal rotation.'
        : rotation === 'quartimax'
          ? 'Quartimax rotation is applied as orthogonal rotation emphasizing simpler variable structure.'
        : rotation === 'promax'
          ? 'Promax rotation is applied as oblique rotation (via varimax target transformation), with pattern and structure matrices reported when available.'
          : 'Rotation is not applied in this version.'
    ]
  };
}
