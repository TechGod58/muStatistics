import { describe, expect, it } from 'vitest';
import {
  createAttribute,
  createCase,
  createVariable
} from '@mu/core-domain';
import {
  analyzeCompareMeans,
  analyzeCorrelation,
  analyzeConjoint,
  analyzeCrosstab,
  analyzeDirectMarketing,
  analyzeExactTest,
  analyzeFactorAnalysis,
  analyzeForecast,
  analyzeGeneralLinearModel,
  analyzeGeneralizedEstimatingEquation,
  analyzeMixedModel,
  analyzeWithMultipleImputation,
  analyzeNonparametricComparison,
  analyzeOptimalScaling,
  analyzePairedTTest,
  analyzeRegression,
  analyzeReliability,
  analyzeSurvivalAnalysis,
  analyzeTTest,
  applyDatasetFilters,
  applyDatasetRecodes,
  buildCaseDataset,
  buildMultipleImputationPlan,
  clearSyntaxExtensions,
  describeDataset,
  registerSyntaxExtension,
  runSyntax,
  type SyntaxExtensionInvocation,
  type SyntaxExtensionResult
} from '../src/index.ts';

describe('buildCaseDataset', () => {
  it('builds a case-level dataset and descriptive summaries from attributes and derived trace links', () => {
    const cases = [
      createCase({ id: 'case-1', projectId: 'project-1', label: 'Participant 1', sourceIds: ['source-1'] }),
      createCase({ id: 'case-2', projectId: 'project-1', label: 'Participant 2', sourceIds: ['source-2'] })
    ];

    const attributes = [
      createAttribute({ id: 'attr-1', projectId: 'project-1', targetType: 'case', targetId: 'case-1', name: 'age', value: 34 }),
      createAttribute({ id: 'attr-2', projectId: 'project-1', targetType: 'case', targetId: 'case-2', name: 'age', value: 41 }),
      createAttribute({ id: 'attr-3', projectId: 'project-1', targetType: 'source', targetId: 'source-1', name: 'department', value: 'Admissions' }),
      createAttribute({ id: 'attr-4', projectId: 'project-1', targetType: 'source', targetId: 'source-2', name: 'department', value: 'Financial Aid' })
    ];

    const variables = [
      createVariable({
        id: 'variable-1',
        projectId: 'project-1',
        name: 'trust_concern_flag',
        label: 'Trust concern flagged',
        kind: 'binary',
        sourceKind: 'derived_code',
        derivedFromCodeId: 'code-1',
        derivationRule: 'presence'
      }),
      createVariable({
        id: 'variable-3',
        projectId: 'project-1',
        name: 'trust_concern_count',
        label: 'Trust concern count',
        kind: 'continuous',
        sourceKind: 'derived_code',
        derivedFromCodeId: 'code-1',
        derivationRule: 'count'
      }),
      createVariable({
        id: 'variable-4',
        projectId: 'project-1',
        name: 'trust_concern_intensity',
        label: 'Trust concern intensity',
        kind: 'categorical',
        sourceKind: 'derived_code',
        derivedFromCodeId: 'code-1',
        derivationRule: 'intensity'
      }),
      createVariable({
        id: 'variable-2',
        projectId: 'project-1',
        name: 'comment_text',
        label: 'Comment text',
        kind: 'text',
        sourceKind: 'manual'
      })
    ];

    const dataset = buildCaseDataset({
      cases,
      attributes,
      variables,
      traceLinks: [
        { variableId: 'variable-1', caseId: 'case-1', supportingCodeApplicationIds: ['ca-1', 'ca-2'] },
        { variableId: 'variable-3', caseId: 'case-1', supportingCodeApplicationIds: ['ca-1', 'ca-2'] },
        { variableId: 'variable-4', caseId: 'case-1', supportingCodeApplicationIds: ['ca-1', 'ca-2'] }
      ]
    });

    expect(dataset.caseCount).toBe(2);
    expect(dataset.rows[0]?.trust_concern_flag).toBe(1);
    expect(dataset.rows[1]?.trust_concern_flag).toBe(0);
    expect(dataset.rows[0]?.trust_concern_count).toBe(2);
    expect(dataset.rows[1]?.trust_concern_count).toBe(0);
    expect(dataset.rows[0]?.trust_concern_intensity).toBe('multiple');
    expect(dataset.rows[1]?.trust_concern_intensity).toBe('none');
    expect(dataset.rows[0]?.age).toBe(34);
    expect(dataset.rows[1]?.department_source).toBe('Financial Aid');
    expect(dataset.notes).toHaveLength(1);

    const report = describeDataset(dataset);
    const ageSummary = report.summaries.find((summary) => summary.key === 'age');
    const trustSummary = report.summaries.find((summary) => summary.key === 'trust_concern_flag');

    expect(report.caseCount).toBe(2);
    expect(ageSummary?.numeric?.mean).toBe(37.5);
    expect(ageSummary?.missingCount).toBe(0);
    expect(trustSummary?.frequencies).toEqual([
      { value: '0', count: 1, proportion: 0.5 },
      { value: '1', count: 1, proportion: 0.5 }
    ]);

    const crosstab = analyzeCrosstab(dataset, 'department_source', 'trust_concern_flag');
    expect(crosstab.validCaseCount).toBe(2);
    expect(crosstab.rowCategories).toEqual([
      { value: 'Admissions', count: 1, proportion: 0.5 },
      { value: 'Financial Aid', count: 1, proportion: 0.5 }
    ]);
    expect(crosstab.columnCategories).toEqual([
      { value: '0', count: 1, proportion: 0.5 },
      { value: '1', count: 1, proportion: 0.5 }
    ]);
    expect(crosstab.cells.find((cell) => cell.rowValue === 'Admissions' && cell.columnValue === '1')).toEqual({
      rowValue: 'Admissions',
      columnValue: '1',
      count: 1,
      rowProportion: 1,
      columnProportion: 1,
      totalProportion: 0.5
    });
    expect(crosstab.chiSquare?.degreesOfFreedom).toBe(1);

    const filtered = applyDatasetFilters(dataset, [
      { fieldKey: 'department_source', operator: 'equals', value: 'Admissions' }
    ]);
    expect(filtered.caseCount).toBe(1);
    expect(filtered.rows[0]?.case_label).toBe('Participant 1');

    const recoded = applyDatasetRecodes(dataset, [
      {
        sourceFieldKey: 'department_source',
        outputFieldKey: 'service_area',
        outputLabel: 'Service area',
        rules: [
          { from: 'Admissions', to: 'Student Services' },
          { from: 'Financial Aid', to: 'Student Services' }
        ],
        defaultValue: 'Other'
      }
    ]);
    expect(recoded.fields.some((field) => field.key === 'service_area')).toBe(true);
    expect(recoded.rows[0]?.service_area).toBe('Student Services');
    expect(recoded.rows[1]?.service_area).toBe('Student Services');

    const linear = analyzeRegression(dataset, 'trust_concern_flag', 'age', 'linear');
    expect(linear.model).toBe('linear');
    expect(linear.caseCount).toBe(2);

    const logistic = analyzeRegression(dataset, 'trust_concern_flag', 'age', 'logistic');
    expect(logistic.model).toBe('logistic');
    expect(logistic.caseCount).toBe(2);
    expect(logistic.diagnostics?.deviance).not.toBeNull();
    expect(logistic.diagnostics?.hosmerLemeshowDf).not.toBeNull();
    expect(logistic.diagnostics?.rocAuc).not.toBeNull();

    const correlation = analyzeCorrelation(dataset, 'age', 'trust_concern_count');
    expect(correlation.caseCount).toBe(2);
    expect(correlation.pearsonR).toBe(-1);
    expect(correlation.rSquared).toBe(1);
    expect(correlation.pValue).toBeNull();
    expect(correlation.confidenceInterval).toBeNull();

    const compareMeans = analyzeCompareMeans(dataset, 'age', 'trust_concern_flag');
    expect(compareMeans.validCaseCount).toBe(2);
    expect(compareMeans.groups).toHaveLength(2);
    expect(compareMeans.anova?.dfBetween).toBe(1);
    expect(compareMeans.anova?.pValue).toBeNull();
    expect(compareMeans.assumptions?.length).toBeGreaterThan(0);
  });

  it('supports weights, missing-data handling, t-tests, nonparametric tests, and multi-predictor regression', () => {
    const dataset = {
      caseCount: 6,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'outcome', label: 'Outcome', source: 'attribute', valueType: 'number' },
        { key: 'group', label: 'Group', source: 'attribute', valueType: 'string' },
        { key: 'group_two', label: 'Two-group', source: 'attribute', valueType: 'string' },
        { key: 'predictor_one', label: 'Predictor One', source: 'attribute', valueType: 'number' },
        { key: 'predictor_two', label: 'Predictor Two', source: 'attribute', valueType: 'number' },
        { key: 'case_weight', label: 'Case Weight', source: 'attribute', valueType: 'number' },
        { key: 'binary_outcome', label: 'Binary Outcome', source: 'attribute', valueType: 'number' },
        { key: 'missing_code_field', label: 'Missing Code Field', source: 'attribute', valueType: 'string' }
      ],
      rows: [
        { case_id: 'case-1', case_label: 'Case 1', outcome: 10, group: 'A', group_two: 'A', predictor_one: 1, predictor_two: 2, case_weight: 1, binary_outcome: 0, missing_code_field: 'NA' },
        { case_id: 'case-2', case_label: 'Case 2', outcome: 12, group: 'A', group_two: 'A', predictor_one: 2, predictor_two: 1, case_weight: 2, binary_outcome: 0, missing_code_field: 'ok' },
        { case_id: 'case-3', case_label: 'Case 3', outcome: 19, group: 'B', group_two: 'B', predictor_one: 3, predictor_two: 4, case_weight: 1, binary_outcome: 1, missing_code_field: 'ok' },
        { case_id: 'case-4', case_label: 'Case 4', outcome: 22, group: 'B', group_two: 'B', predictor_one: 4, predictor_two: 3, case_weight: 1.5, binary_outcome: 1, missing_code_field: 'ok' },
        { case_id: 'case-5', case_label: 'Case 5', outcome: 30, group: 'C', group_two: 'B', predictor_one: 5, predictor_two: 6, case_weight: 1, binary_outcome: 1, missing_code_field: 'NA' },
        { case_id: 'case-6', case_label: 'Case 6', outcome: null, group: 'C', group_two: 'B', predictor_one: 6, predictor_two: 5, case_weight: 0.5, binary_outcome: 1, missing_code_field: 'ok' }
      ],
      notes: []
    } as const;

    const weightedReport = describeDataset(dataset, {
      weightField: 'case_weight',
      missingValues: ['NA'],
      missingStrategy: 'available'
    });
    expect(weightedReport.weightedCaseCount).toBeCloseTo(7, 5);
    expect(weightedReport.analysis?.weightField).toBe('case_weight');
    expect(weightedReport.summaries.find((summary) => summary.key === 'missing_code_field')?.missingCount).toBe(2);

    const weightedCrosstab = analyzeCrosstab(dataset, 'group', 'binary_outcome', {
      weightField: 'case_weight'
    });
    expect(weightedCrosstab.weightedValidCaseCount).toBeCloseTo(7, 5);

    const tTest = analyzeTTest(dataset, 'outcome', 'group_two', {
      weightField: 'case_weight',
      missingStrategy: 'available'
    });
    expect(tTest.groups).toHaveLength(2);
    expect(tTest.meanDifference).not.toBeNull();
    expect(tTest.confidenceInterval?.lower).not.toBeNull();
    expect(tTest.assumptions?.length).toBeGreaterThan(0);

    const pairedTTest = analyzePairedTTest(dataset, 'predictor_one', 'predictor_two', {
      weightField: 'case_weight'
    });
    expect(pairedTTest.pairCount).toBe(6);
    expect(pairedTTest.pValue).not.toBeNull();
    expect(pairedTTest.confidenceInterval?.lower).not.toBeNull();

    const nonparametric = analyzeNonparametricComparison(dataset, 'outcome', 'group', {
      weightField: 'case_weight'
    });
    expect(['mann_whitney_u', 'kruskal_wallis']).toContain(nonparametric.method);
    expect(nonparametric.validCaseCount).toBe(5);
    expect(nonparametric.weightedValidCaseCount).not.toBeNull();
    expect(nonparametric.effectSize).not.toBeNull();

    const linear = analyzeRegression(dataset, 'outcome', ['predictor_one', 'predictor_two'], 'linear', {
      weightField: 'case_weight'
    });
    expect(linear.predictorFields).toEqual(['predictor_one', 'predictor_two']);
    expect(linear.coefficients).toHaveLength(3);
    expect(linear.coefficients.some((item) => item.robustStandardError !== null && item.robustStandardError !== undefined)).toBe(true);
    expect(linear.coefficients.some((item) => item.robustPValue !== null && item.robustPValue !== undefined)).toBe(true);
    expect(linear.metrics.fPValue).not.toBeNull();
    expect(Array.isArray(linear.multicollinearity)).toBe(true);
    expect(linear.multicollinearity?.length).toBe(2);
    expect(linear.diagnostics?.maxVif).not.toBeNull();
    expect(linear.diagnostics?.tol_predictor_one).not.toBeNull();
    expect(linear.diagnostics?.robustSeInflationMax).not.toBeNull();
    expect(Array.isArray(linear.influenceSummary)).toBe(true);
    expect(linear.assumptions?.some((item) => item.key === 'robust_se_shift')).toBe(true);

    const logistic = analyzeRegression(dataset, 'binary_outcome', ['predictor_one', 'predictor_two'], 'logistic', {
      weightField: 'case_weight'
    });
    expect(logistic.model).toBe('logistic');
    expect(logistic.diagnostics?.logLikelihood).not.toBeNull();
    expect(logistic.diagnostics?.hosmerLemeshowPValue).not.toBeNull();
    expect(logistic.diagnostics?.hosmerLemeshowDf).toBeGreaterThanOrEqual(1);
    expect(logistic.diagnostics?.hosmerLemeshowGroupCount).toBeGreaterThanOrEqual(2);
    expect(logistic.diagnostics?.rocAuc).not.toBeNull();
    expect(logistic.diagnostics?.rocAucCiLower).not.toBeNull();
    expect(logistic.diagnostics?.rocAucCiUpper).not.toBeNull();
    expect(logistic.diagnostics?.calibrationIntercept).not.toBeNull();
    expect(logistic.diagnostics?.calibrationSlope).not.toBeNull();
    expect(logistic.coefficients).toHaveLength(3);
    expect(logistic.diagnostics?.maxVif).not.toBeNull();
    expect(logistic.diagnostics?.influentialCount).not.toBeNull();
    expect(logistic.diagnostics?.maxCooksDistance).not.toBeNull();
    expect(Array.isArray(logistic.multicollinearity)).toBe(true);
    expect(Array.isArray(logistic.influenceSummary)).toBe(true);
    expect(logistic.assumptions?.some((item) => item.key === 'hosmer_lemeshow')).toBe(true);
    expect(logistic.coefficients.some((item) => item.robustStandardError !== null && item.robustStandardError !== undefined)).toBe(true);
    expect(logistic.coefficients.some((item) => item.robustPValue !== null && item.robustPValue !== undefined)).toBe(true);
    expect(logistic.coefficients.some((item) => item.oddsRatioConfidenceInterval !== null && item.oddsRatioConfidenceInterval !== undefined)).toBe(true);
    expect(logistic.coefficients.some((item) =>
      item.robustOddsRatioConfidenceInterval !== null && item.robustOddsRatioConfidenceInterval !== undefined
    )).toBe(true);
    expect(logistic.diagnostics?.robustSeInflationMax).not.toBeNull();
    expect(logistic.assumptions?.some((item) => item.key === 'robust_se_shift')).toBe(true);
  });

  it('supports mixed/gee/glm/survival diagnostics with richer post-estimation output', () => {
    const dataset = {
      caseCount: 10,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'outcome', label: 'Outcome', source: 'attribute', valueType: 'number' },
        { key: 'binary_outcome', label: 'Binary outcome', source: 'attribute', valueType: 'number' },
        { key: 'predictor_one', label: 'Predictor one', source: 'attribute', valueType: 'number' },
        { key: 'predictor_two', label: 'Predictor two', source: 'attribute', valueType: 'number' },
        { key: 'site', label: 'Site', source: 'attribute', valueType: 'string' },
        { key: 'time_to_event', label: 'Time to Event', source: 'attribute', valueType: 'number' },
        { key: 'event_status', label: 'Event Status', source: 'attribute', valueType: 'number' },
        { key: 'case_weight', label: 'Case weight', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'case-1', case_label: 'Case 1', outcome: 10, binary_outcome: 0, predictor_one: 1, predictor_two: 2, site: 'North', time_to_event: 4, event_status: 1, case_weight: 1 },
        { case_id: 'case-2', case_label: 'Case 2', outcome: 12, binary_outcome: 0, predictor_one: 2, predictor_two: 1, site: 'North', time_to_event: 7, event_status: 0, case_weight: 1 },
        { case_id: 'case-3', case_label: 'Case 3', outcome: 14, binary_outcome: 0, predictor_one: 3, predictor_two: 2, site: 'North', time_to_event: 10, event_status: 1, case_weight: 1 },
        { case_id: 'case-4', case_label: 'Case 4', outcome: 18, binary_outcome: 1, predictor_one: 4, predictor_two: 3, site: 'South', time_to_event: 5, event_status: 1, case_weight: 1.2 },
        { case_id: 'case-5', case_label: 'Case 5', outcome: 20, binary_outcome: 1, predictor_one: 5, predictor_two: 4, site: 'South', time_to_event: 8, event_status: 1, case_weight: 1.1 },
        { case_id: 'case-6', case_label: 'Case 6', outcome: 22, binary_outcome: 1, predictor_one: 6, predictor_two: 5, site: 'South', time_to_event: 12, event_status: 0, case_weight: 1.1 },
        { case_id: 'case-7', case_label: 'Case 7', outcome: 11, binary_outcome: 0, predictor_one: 1.5, predictor_two: 2.5, site: 'East', time_to_event: 6, event_status: 1, case_weight: 0.9 },
        { case_id: 'case-8', case_label: 'Case 8', outcome: 13, binary_outcome: 0, predictor_one: 2.5, predictor_two: 3.5, site: 'East', time_to_event: 9, event_status: 0, case_weight: 0.9 },
        { case_id: 'case-9', case_label: 'Case 9', outcome: 17, binary_outcome: 1, predictor_one: 3.5, predictor_two: 4.5, site: 'West', time_to_event: 11, event_status: 1, case_weight: 1 },
        { case_id: 'case-10', case_label: 'Case 10', outcome: 19, binary_outcome: 1, predictor_one: 4.5, predictor_two: 5.5, site: 'West', time_to_event: 14, event_status: 0, case_weight: 1 }
      ],
      notes: []
    } as const;

    const mixedModel = analyzeMixedModel(
      dataset,
      'outcome',
      ['predictor_one', 'predictor_two'],
      'site',
      { weightField: 'case_weight' }
    );
    expect(mixedModel.groupCount).toBe(4);
    expect(mixedModel.coefficients.length).toBe(3);
    expect(mixedModel.groupEffects.length).toBe(4);
    expect(mixedModel.metrics.intraclassCorrelation).not.toBeNull();
    expect(mixedModel.diagnostics.maxVif).not.toBeNull();
    expect(mixedModel.coefficients.some((item) => item.robustStandardError !== null && item.robustStandardError !== undefined)).toBe(true);
    expect(mixedModel.influenceSummary.length).toBeGreaterThan(0);
    expect(mixedModel.assumptions.some((item) => item.key === 'robust_se_shift')).toBe(true);

    const geeGaussian = analyzeGeneralizedEstimatingEquation(
      dataset,
      'outcome',
      ['predictor_one', 'predictor_two'],
      'site',
      'gaussian',
      'exchangeable',
      { weightField: 'case_weight' }
    );
    expect(geeGaussian.family).toBe('gaussian');
    expect(geeGaussian.clusterCount).toBe(4);
    expect(geeGaussian.coefficients.length).toBe(3);
    expect(geeGaussian.metrics.workingCorrelation).not.toBeNull();
    expect(geeGaussian.diagnostics.maxVif).not.toBeNull();
    expect(geeGaussian.observations[0]?.standardizedResidual).not.toBeUndefined();
    expect(geeGaussian.diagnostics.robustSeInflationMax).not.toBeNull();
    expect(geeGaussian.assumptions.some((item) => item.key === 'influence')).toBe(true);

    const geeBinomial = analyzeGeneralizedEstimatingEquation(
      dataset,
      'binary_outcome',
      ['predictor_one', 'predictor_two'],
      'site',
      'binomial',
      'independence',
      { weightField: 'case_weight' }
    );
    expect(geeBinomial.family).toBe('binomial');
    expect(geeBinomial.coefficients.length).toBe(3);
    expect(geeBinomial.metrics.pseudoRSquared).not.toBeNull();
    expect(geeBinomial.coefficients.some((item) => item.oddsRatio !== null)).toBe(true);
    expect((geeBinomial.thresholdAnalysis?.length ?? 0)).toBeGreaterThan(0);
    expect((geeBinomial.calibration?.bins.length ?? 0)).toBeGreaterThan(0);
    expect(geeBinomial.diagnostics.rocAuc).not.toBeNull();
    expect(geeBinomial.assumptions.some((item) => item.key === 'discrimination')).toBe(true);

    const glm = analyzeGeneralLinearModel(
      dataset,
      'outcome',
      ['site'],
      ['predictor_one', 'predictor_two'],
      { weightField: 'case_weight' }
    );
    expect(glm.coefficients.length).toBeGreaterThan(3);
    expect(glm.diagnostics.maxVif).not.toBeNull();
    expect(glm.influenceSummary.length).toBeGreaterThan(0);
    expect(glm.assumptions.some((item) => item.key === 'robust_se_shift')).toBe(true);

    const survival = analyzeSurvivalAnalysis(
      dataset,
      'time_to_event',
      'event_status',
      'site'
    );
    expect(survival.groups.length).toBe(4);
    expect(survival.steps.length).toBeGreaterThan(0);
    expect(survival.steps.some((step) => step.standardError !== null)).toBe(true);
    expect(survival.steps.some((step) => step.confidenceLower !== null && step.confidenceUpper !== null)).toBe(true);
    expect(survival.diagnostics?.logRankDegreesOfFreedom).toBeGreaterThan(0);
    expect(survival.diagnostics?.logRankPValue).not.toBeNull();
  });

  it('supports reliability analysis and factor analysis over complete numeric rows', () => {
    const dataset = {
      caseCount: 6,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'item_1', label: 'Item 1', source: 'attribute', valueType: 'number' },
        { key: 'item_2', label: 'Item 2', source: 'attribute', valueType: 'number' },
        { key: 'item_3', label: 'Item 3', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'case-1', case_label: 'Case 1', item_1: 1, item_2: 1, item_3: 2 },
        { case_id: 'case-2', case_label: 'Case 2', item_1: 2, item_2: 2, item_3: 3 },
        { case_id: 'case-3', case_label: 'Case 3', item_1: 3, item_2: 3, item_3: 4 },
        { case_id: 'case-4', case_label: 'Case 4', item_1: 4, item_2: 4, item_3: 5 },
        { case_id: 'case-5', case_label: 'Case 5', item_1: 5, item_2: 5, item_3: 6 },
        { case_id: 'case-6', case_label: 'Case 6', item_1: 6, item_2: 6, item_3: 7 }
      ],
      notes: []
    } as const;

    const reliability = analyzeReliability(dataset, ['item_1', 'item_2', 'item_3']);
    expect(reliability.validCaseCount).toBe(6);
    expect(reliability.items).toHaveLength(3);
    expect(reliability.alpha).toBeGreaterThan(0.95);
    expect(reliability.standardizedAlpha).toBeGreaterThan(0.95);
    expect(reliability.omegaTotal).toBeGreaterThan(0.95);
    expect(reliability.averageInterItemCorrelation).toBeGreaterThan(0.8);
    expect(reliability.spearmanBrown).not.toBeNull();
    expect(reliability.standardErrorOfMeasurement).not.toBeNull();
    expect(reliability.alphaConfidenceInterval === null || reliability.alphaConfidenceInterval.level === 0.95).toBe(true);
    expect(reliability.standardizedAlphaConfidenceInterval === null || reliability.standardizedAlphaConfidenceInterval.level === 0.95).toBe(true);
    expect(reliability.items.every((item) => item.itemTotalCorrelation !== null)).toBe(true);

    const factorAnalysis = analyzeFactorAnalysis(dataset, ['item_1', 'item_2', 'item_3'], 2);
    expect(factorAnalysis.validCaseCount).toBe(6);
    expect(factorAnalysis.factorCount).toBeGreaterThanOrEqual(1);
    expect(factorAnalysis.recommendedFactorCount).toBeGreaterThanOrEqual(1);
    expect(factorAnalysis.eigenvalues.length).toBeGreaterThanOrEqual(factorAnalysis.factorCount);
    expect(factorAnalysis.factors[0]?.eigenvalue).toBeGreaterThan(1);
    expect(factorAnalysis.factors[0]?.loadings).toHaveLength(3);
    expect(factorAnalysis.factorScoreSummary).toHaveLength(factorAnalysis.factorCount);
    expect(factorAnalysis.factorScoreCaseCount).toBe(6);
    expect(factorAnalysis.factorScoreSample.length).toBe(6);
    expect(factorAnalysis.factorScoreSample[0]?.scores).toHaveLength(factorAnalysis.factorCount);
    expect(factorAnalysis.correlationMatrix).toHaveLength(3);
    expect(factorAnalysis.diagnostics.patternMatrix).toBeNull();
    expect(factorAnalysis.diagnostics.structureMatrix).toBeNull();
    expect(factorAnalysis.diagnostics.kmoPerField).toHaveLength(3);
    expect(factorAnalysis.diagnostics.bartlettTest.degreesOfFreedom).toBe(3);
  });

  it('supports promax rotation and reports factor adequacy diagnostics', () => {
    const dataset = {
      caseCount: 8,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'item_1', label: 'Item 1', source: 'attribute', valueType: 'number' },
        { key: 'item_2', label: 'Item 2', source: 'attribute', valueType: 'number' },
        { key: 'item_3', label: 'Item 3', source: 'attribute', valueType: 'number' },
        { key: 'item_4', label: 'Item 4', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'case-1', case_label: 'Case 1', item_1: 1, item_2: 2, item_3: 5, item_4: 4 },
        { case_id: 'case-2', case_label: 'Case 2', item_1: 2, item_2: 1, item_3: 4, item_4: 5 },
        { case_id: 'case-3', case_label: 'Case 3', item_1: 1, item_2: 2, item_3: 6, item_4: 4 },
        { case_id: 'case-4', case_label: 'Case 4', item_1: 3, item_2: 3, item_3: 3, item_4: 2 },
        { case_id: 'case-5', case_label: 'Case 5', item_1: 4, item_2: 5, item_3: 2, item_4: 1 },
        { case_id: 'case-6', case_label: 'Case 6', item_1: 3, item_2: 4, item_3: 3, item_4: 2 },
        { case_id: 'case-7', case_label: 'Case 7', item_1: 5, item_2: 6, item_3: 1, item_4: 0 },
        { case_id: 'case-8', case_label: 'Case 8', item_1: 4, item_2: 5, item_3: 2, item_4: 1 }
      ],
      notes: []
    } as const;

    const factorAnalysis = analyzeFactorAnalysis(dataset, ['item_1', 'item_2', 'item_3', 'item_4'], 2, undefined, 'promax');
    expect(factorAnalysis.rotation).toBe('promax');
    expect(factorAnalysis.factorCount).toBe(2);
    expect(factorAnalysis.diagnostics.kmoOverall).not.toBeNull();
    expect(factorAnalysis.diagnostics.correlationDeterminant).not.toBeNull();
    expect(factorAnalysis.diagnostics.bartlettTest.degreesOfFreedom).toBe(6);
    expect(factorAnalysis.diagnostics.bartlettTest.pValue).not.toBeNull();
    expect(factorAnalysis.diagnostics.kmoPerField).toHaveLength(4);
    expect(factorAnalysis.diagnostics.factorCorrelationMatrix?.length ?? 0).toBe(2);
    expect(factorAnalysis.diagnostics.patternMatrix?.length ?? 0).toBe(4);
    expect(factorAnalysis.diagnostics.patternMatrix?.[0]?.length ?? 0).toBe(2);
    expect(factorAnalysis.diagnostics.structureMatrix?.length ?? 0).toBe(4);
    expect(factorAnalysis.diagnostics.structureMatrix?.[0]?.length ?? 0).toBe(2);
    expect(factorAnalysis.factorScoreSummary).toHaveLength(2);
    expect(factorAnalysis.factorScoreCaseCount).toBe(8);
    expect(factorAnalysis.factorScoreSample[0]?.scores).toHaveLength(2);
  });

  it('returns richer reliability diagnostics for subscales', () => {
    const dataset = {
      caseCount: 8,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'item_a', label: 'Item A', source: 'attribute', valueType: 'number' },
        { key: 'item_b', label: 'Item B', source: 'attribute', valueType: 'number' },
        { key: 'item_c', label: 'Item C', source: 'attribute', valueType: 'number' },
        { key: 'item_d', label: 'Item D', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'case-1', case_label: 'Case 1', item_a: 1, item_b: 2, item_c: 4, item_d: 5 },
        { case_id: 'case-2', case_label: 'Case 2', item_a: 2, item_b: 3, item_c: 5, item_d: 6 },
        { case_id: 'case-3', case_label: 'Case 3', item_a: 3, item_b: 3, item_c: 4, item_d: 4 },
        { case_id: 'case-4', case_label: 'Case 4', item_a: 4, item_b: 5, item_c: 6, item_d: 6 },
        { case_id: 'case-5', case_label: 'Case 5', item_a: 5, item_b: 5, item_c: 7, item_d: 7 },
        { case_id: 'case-6', case_label: 'Case 6', item_a: 4, item_b: 4, item_c: 6, item_d: 6 },
        { case_id: 'case-7', case_label: 'Case 7', item_a: 2, item_b: 2, item_c: 3, item_d: 3 },
        { case_id: 'case-8', case_label: 'Case 8', item_a: 3, item_b: 4, item_c: 5, item_d: 5 }
      ],
      notes: []
    } as const;

    const reliability = analyzeReliability(
      dataset,
      ['item_a', 'item_b', 'item_c', 'item_d'],
      undefined,
      [
        { label: 'Scale 1', fields: ['item_a', 'item_b'] },
        { label: 'Scale 2', fields: ['item_c', 'item_d'] }
      ]
    );
    expect(reliability.subscales?.length).toBe(2);
    expect(reliability.subscales?.[0]?.itemCount).toBe(2);
    expect(reliability.subscales?.[0]?.omegaTotal).not.toBeNull();
    expect(reliability.subscales?.[0]?.averageInterItemCorrelation).not.toBeNull();
    expect(reliability.subscales?.[0]?.standardErrorOfMeasurement).not.toBeNull();
    expect(reliability.subscales?.[0]?.alphaConfidenceInterval === null || reliability.subscales?.[0]?.alphaConfidenceInterval?.level === 0.95).toBe(true);
    expect(
      reliability.subscales?.[0]?.standardizedAlphaConfidenceInterval === null
      || reliability.subscales?.[0]?.standardizedAlphaConfidenceInterval?.level === 0.95
    ).toBe(true);
  });

  it('supports reliability stratification by a grouping field', () => {
    const dataset = {
      caseCount: 10,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'cohort', label: 'Cohort', source: 'attribute', valueType: 'string' },
        { key: 'item_1', label: 'Item 1', source: 'attribute', valueType: 'number' },
        { key: 'item_2', label: 'Item 2', source: 'attribute', valueType: 'number' },
        { key: 'item_3', label: 'Item 3', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'case-1', case_label: 'Case 1', cohort: 'A', item_1: 1, item_2: 1, item_3: 2 },
        { case_id: 'case-2', case_label: 'Case 2', cohort: 'A', item_1: 2, item_2: 2, item_3: 3 },
        { case_id: 'case-3', case_label: 'Case 3', cohort: 'A', item_1: 3, item_2: 3, item_3: 4 },
        { case_id: 'case-4', case_label: 'Case 4', cohort: 'A', item_1: 4, item_2: 4, item_3: 5 },
        { case_id: 'case-5', case_label: 'Case 5', cohort: 'A', item_1: 5, item_2: 5, item_3: 6 },
        { case_id: 'case-6', case_label: 'Case 6', cohort: 'B', item_1: 2, item_2: 2, item_3: 3 },
        { case_id: 'case-7', case_label: 'Case 7', cohort: 'B', item_1: 3, item_2: 3, item_3: 4 },
        { case_id: 'case-8', case_label: 'Case 8', cohort: 'B', item_1: 4, item_2: 4, item_3: 5 },
        { case_id: 'case-9', case_label: 'Case 9', cohort: 'B', item_1: 5, item_2: 5, item_3: 6 },
        { case_id: 'case-10', case_label: 'Case 10', cohort: 'B', item_1: 6, item_2: 6, item_3: 7 }
      ],
      notes: []
    } as const;

    const reliability = analyzeReliability(
      dataset,
      ['item_1', 'item_2', 'item_3'],
      undefined,
      undefined,
      'cohort'
    );

    expect(reliability.stratifiedByField).toBe('cohort');
    expect(reliability.stratifiedByLabel).toBe('Cohort');
    expect(reliability.strata.length).toBe(2);
    expect(reliability.strata.map((entry) => entry.groupValue)).toEqual(['A', 'B']);
    expect(reliability.strata.every((entry) => entry.alpha !== null)).toBe(true);
    expect(reliability.strata.every((entry) => entry.alphaConfidenceInterval === null || entry.alphaConfidenceInterval.level === 0.95)).toBe(true);
    expect(
      reliability.strata.every(
        (entry) => entry.standardizedAlphaConfidenceInterval === null || entry.standardizedAlphaConfidenceInterval.level === 0.95
      )
    ).toBe(true);
    expect(reliability.notes.some((note) => note.includes('Stratified reliability'))).toBe(true);
  });
});

describe('syntax data management', () => {
  it('supports compute, aggregate, rank, split file, reshape, dataset registry, and match files', () => {
    const dataset = {
      caseCount: 4,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'dept', label: 'Department', source: 'attribute', valueType: 'string' },
        { key: 'score_t1', label: 'Score T1', source: 'attribute', valueType: 'number' },
        { key: 'score_t2', label: 'Score T2', source: 'attribute', valueType: 'number' },
        { key: 'score', label: 'Score', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'c1', case_label: 'Case 1', dept: 'A', score_t1: 10, score_t2: 13, score: 13 },
        { case_id: 'c2', case_label: 'Case 2', dept: 'A', score_t1: 11, score_t2: 16, score: 16 },
        { case_id: 'c3', case_label: 'Case 3', dept: 'B', score_t1: 9, score_t2: 11, score: 11 },
        { case_id: 'c4', case_label: 'Case 4', dept: 'B', score_t1: 12, score_t2: 18, score: 18 }
      ],
      notes: []
    } as const;

    const result = runSyntax(
      dataset,
      `
      DATASET NAME main.
      DATASET COPY dept_rollup.
      DATASET ACTIVATE dept_rollup.
      AGGREGATE /BREAK=dept /dept_mean=MEAN(score).
      DATASET ACTIVATE main.
      MATCH FILES /FILE=main /TABLE=dept_rollup /BY=dept.
      COMPUTE score_delta = score_t2 - score_t1.
      IF score_delta > 4 high_delta = 1.
      RANK /VARIABLES=score /RANK INTO score_rank /BY=dept.
      RESHAPE LONG /ID=case_id dept dept_mean score_delta high_delta score_rank /VARIABLES=score_t1 score_t2 /INDEX=wave /VALUE=wave_score.
      SPLIT FILE LAYERED BY dept.
      DESCRIPTIVES VARIABLES=wave_score.
      SPLIT FILE OFF.
      RESHAPE WIDE /ID=case_id dept dept_mean score_delta high_delta score_rank /INDEX=wave /VALUE=wave_score /PREFIX=score_wave_.
      `
    );

    expect(result.commandCount).toBeGreaterThanOrEqual(14);
    const failures = result.results
      .filter((entry) => entry.status === 'error')
      .map((entry) => ({ commandName: entry.commandName, message: entry.message }));
    expect(failures).toEqual([]);
    expect(result.successfulCommandCount).toBe(result.commandCount);
    expect(result.datasetNames).toContain('main');
    expect(result.datasetNames).toContain('dept_rollup');
    expect(result.activeDatasetName).toBe('main');
    expect(result.finalDatasetSummary.caseCount).toBe(4);
    expect(result.finalDatasetSummary.fields).toContain('score_delta');
    expect(result.finalDatasetSummary.fields).toContain('score_rank');
    expect(result.finalDatasetSummary.fields.some((field) => field.startsWith('score_wave_'))).toBe(true);

    const splitDescriptives = result.results.find((entry) => entry.commandName === 'DESCRIPTIVES');
    expect(splitDescriptives?.status).toBe('ok');
    expect((splitDescriptives?.output as { groups?: unknown[] })?.groups?.length).toBe(2);
  });

  it('supports sort cases, add files, and merge files command aliases', () => {
    const dataset = {
      caseCount: 3,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'dept', label: 'Department', source: 'attribute', valueType: 'string' },
        { key: 'score', label: 'Score', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'c1', case_label: 'Case 1', dept: 'A', score: 10 },
        { case_id: 'c2', case_label: 'Case 2', dept: 'B', score: 7 },
        { case_id: 'c3', case_label: 'Case 3', dept: 'A', score: 15 }
      ],
      notes: []
    } as const;

    const result = runSyntax(
      dataset,
      `
      DATASET NAME base.
      DATASET COPY bonus.
      DATASET ACTIVATE bonus.
      COMPUTE score = score + 5.
      DATASET ACTIVATE base.
      MERGE FILES /FILE=base /TABLE=bonus /BY=case_id.
      ADD FILES /FILE=* /FILE=bonus.
      SORT CASES BY dept(A) score(D).
      `
    );

    const failures = result.results
      .filter((entry) => entry.status === 'error')
      .map((entry) => ({ commandName: entry.commandName, message: entry.message }));
    expect(failures).toEqual([]);
    expect(result.successfulCommandCount).toBe(result.commandCount);
    expect(result.datasetNames).toEqual(expect.arrayContaining(['base', 'bonus']));
    expect(result.finalDatasetSummary.caseCount).toBe(6);
    expect(result.finalDatasetSummary.fields).toContain('score');
    expect(result.finalDatasetSummary.fields).toContain('score_table');

    const sortedRows = result.results.find((entry) => entry.commandName === 'SORT_CASES')?.output as { datasetSummary?: unknown } | undefined;
    expect(sortedRows).toBeDefined();
  });

  it('supports recode/filter/weight/missing/labels/rename controls in syntax', () => {
    const dataset = {
      caseCount: 5,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'dept', label: 'Department', source: 'attribute', valueType: 'string' },
        { key: 'score', label: 'Score', source: 'attribute', valueType: 'number' },
        { key: 'weight', label: 'Weight', source: 'attribute', valueType: 'number' },
        { key: 'passed', label: 'Passed', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'c1', case_label: 'Case 1', dept: 'A', score: 5, weight: 1, passed: 0 },
        { case_id: 'c2', case_label: 'Case 2', dept: 'B', score: 12, weight: 2, passed: 1 },
        { case_id: 'c3', case_label: 'Case 3', dept: 'C', score: 20, weight: 1, passed: 1 },
        { case_id: 'c4', case_label: 'Case 4', dept: 'A', score: 999, weight: 3, passed: 0 },
        { case_id: 'c5', case_label: 'Case 5', dept: 'B', score: 8, weight: 1, passed: 0 }
      ],
      notes: []
    } as const;

    const result = runSyntax(
      dataset,
      `
      VARIABLE LABELS score "Outcome Score".
      VALUE LABELS passed 1 "Pass" 0 "Fail".
      MISSING VALUES score (999).
      RECODE dept ('A'=1) ('B'=2) (ELSE=3) INTO dept_code.
      AUTORECODE VARIABLES=dept /INTO dept_auto.
      COUNT low_scores = score (LOWEST THRU 10).
      COMPUTE use_case_filter = score > 10.
      FILTER BY use_case_filter.
      WEIGHT BY weight.
      DESCRIPTIVES VARIABLES=score.
      FILTER OFF.
      SELECT IF dept_code >= 2.
      N OF CASES 2.
      RENAME VARIABLES (dept_code=dept_group).
      EXECUTE.
      `
    );

    const controlFailures = result.results
      .filter((entry) => entry.status === 'error')
      .map((entry) => ({ commandName: entry.commandName, message: entry.message }));
    expect(controlFailures).toEqual([]);
    expect(result.successfulCommandCount).toBe(result.commandCount);
    expect(result.finalDatasetSummary.caseCount).toBe(2);
    expect(result.finalDatasetSummary.fields).toContain('dept_group');
    expect(result.finalDatasetSummary.fields).not.toContain('dept_code');
    expect(result.finalDatasetSummary.fields).toContain('dept_auto');
    expect(result.finalDatasetSummary.fields).toContain('low_scores');

    const descriptives = result.results.find((entry) => entry.commandName === 'DESCRIPTIVES');
    expect(descriptives?.status).toBe('ok');
    const summary = (descriptives?.output as Array<{ key: string; numeric: { mean: number } | null }> | undefined)
      ?.find((entry) => entry.key === 'score');
    expect(summary?.numeric?.mean).toBeCloseTo(14.6666667, 5);
  });

  it('supports keep/delete variables plus MEANS, LOGISTIC REGRESSION, UNIANOVA, and COXREG syntax families', () => {
    const dataset = {
      caseCount: 10,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'group', label: 'Group', source: 'attribute', valueType: 'string' },
        { key: 'x1', label: 'X1', source: 'attribute', valueType: 'number' },
        { key: 'x2', label: 'X2', source: 'attribute', valueType: 'number' },
        { key: 'outcome', label: 'Outcome', source: 'attribute', valueType: 'number' },
        { key: 'binary_outcome', label: 'Binary Outcome', source: 'attribute', valueType: 'number' },
        { key: 'time_to_event', label: 'Time to Event', source: 'attribute', valueType: 'number' },
        { key: 'status_code', label: 'Status Code', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'c1', case_label: 'Case 1', group: 'A', x1: 1.2, x2: 2.1, outcome: 10, binary_outcome: 0, time_to_event: 4, status_code: 1 },
        { case_id: 'c2', case_label: 'Case 2', group: 'A', x1: 1.6, x2: 2.5, outcome: 12, binary_outcome: 0, time_to_event: 7, status_code: 0 },
        { case_id: 'c3', case_label: 'Case 3', group: 'A', x1: 2.1, x2: 2.9, outcome: 13, binary_outcome: 0, time_to_event: 9, status_code: 1 },
        { case_id: 'c4', case_label: 'Case 4', group: 'A', x1: 2.7, x2: 3.1, outcome: 14, binary_outcome: 1, time_to_event: 11, status_code: 1 },
        { case_id: 'c5', case_label: 'Case 5', group: 'A', x1: 3.0, x2: 3.4, outcome: 15, binary_outcome: 1, time_to_event: 12, status_code: 0 },
        { case_id: 'c6', case_label: 'Case 6', group: 'B', x1: 2.0, x2: 1.8, outcome: 11, binary_outcome: 0, time_to_event: 5, status_code: 1 },
        { case_id: 'c7', case_label: 'Case 7', group: 'B', x1: 2.5, x2: 2.2, outcome: 13, binary_outcome: 1, time_to_event: 8, status_code: 1 },
        { case_id: 'c8', case_label: 'Case 8', group: 'B', x1: 3.2, x2: 2.7, outcome: 16, binary_outcome: 1, time_to_event: 10, status_code: 0 },
        { case_id: 'c9', case_label: 'Case 9', group: 'B', x1: 3.6, x2: 3.1, outcome: 18, binary_outcome: 1, time_to_event: 13, status_code: 1 },
        { case_id: 'c10', case_label: 'Case 10', group: 'B', x1: 4.0, x2: 3.5, outcome: 20, binary_outcome: 1, time_to_event: 15, status_code: 1 }
      ],
      notes: []
    } as const;

    const result = runSyntax(
      dataset,
      `
      NUMERIC tmp_flag.
      COMPUTE tmp_flag = x1 + x2.
      DELETE VARIABLES tmp_flag.
      KEEP VARIABLES group x1 x2 outcome binary_outcome time_to_event status_code.
      MEANS TABLES=outcome BY group.
      LOGISTIC REGRESSION binary_outcome /METHOD=ENTER x1 x2.
      UNIANOVA binary_outcome BY group WITH x1 x2 /DISTRIBUTION=BINOMIAL /LINK=LOGIT.
      COXREG time_to_event /STATUS=status_code(1) /METHOD=ENTER x1 x2 /STRATA=group /TIES=EFRON.
      `
    );

    const failures = result.results
      .filter((entry) => entry.status === 'error')
      .map((entry) => ({ commandName: entry.commandName, message: entry.message }));
    expect(failures).toEqual([]);
    expect(result.successfulCommandCount).toBe(result.commandCount);
    expect(result.results.find((entry) => entry.commandName === 'DELETE_VARIABLES')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'KEEP_VARIABLES')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'MEANS')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'LOGISTIC_REGRESSION')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'UNIANOVA')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'COXREG')?.status).toBe('ok');
    expect(result.finalDatasetSummary.fields).not.toContain('tmp_flag');
    expect(result.finalDatasetSummary.fields).toContain('time_to_event');

    expect(result.outputDocument.tree.some((entry) => entry.nodeType === 'table')).toBe(true);
    expect(result.outputDocument.tree.some((entry) => entry.nodeType === 'chart')).toBe(true);
    expect(result.outputDocument.chartTemplates.some((entry) => entry.chartType === 'histogram')).toBe(true);
    expect(result.outputDocument.chartTemplates.some((entry) => entry.chartType === 'boxplot')).toBe(true);
  });

  it('supports procedural syntax blocks and declarations (DO IF, DO REPEAT, LOOP, VECTOR, STRING/NUMERIC)', () => {
    const dataset = {
      caseCount: 4,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'dept', label: 'Department', source: 'attribute', valueType: 'string' },
        { key: 'score', label: 'Score', source: 'attribute', valueType: 'number' },
        { key: 'score_t2', label: 'Score T2', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'c1', case_label: 'Case 1', dept: 'A', score: 10, score_t2: 12 },
        { case_id: 'c2', case_label: 'Case 2', dept: 'A', score: 11, score_t2: 14 },
        { case_id: 'c3', case_label: 'Case 3', dept: 'B', score: 9, score_t2: 10 },
        { case_id: 'c4', case_label: 'Case 4', dept: 'B', score: 12, score_t2: 16 }
      ],
      notes: []
    } as const;

    const result = runSyntax(
      dataset,
      `
      NUMERIC score_a score_b.
      STRING group_text.
      VECTOR v(2).
      COMPUTE v(1) = score.
      COMPUTE v(2) = score * 2.
      DO IF dept = 'A'.
      COMPUTE group_text = 'alpha'.
      ELSE IF dept = 'B'.
      COMPUTE group_text = 'beta'.
      ELSE.
      COMPUTE group_text = 'other'.
      END IF.
      DO REPEAT target = score_a score_b / src = score score_t2.
      COMPUTE target = src.
      END REPEAT.
      LOOP #i = 1 TO 2.
      COMPUTE v(#i) = v(#i) + 1.
      END LOOP.
      DESCRIPTIVES VARIABLES=score_a score_b v1 v2.
      `
    );

    const failures = result.results
      .filter((entry) => entry.status === 'error')
      .map((entry) => ({ commandName: entry.commandName, message: entry.message }));
    expect(failures).toEqual([]);
    expect(result.finalDatasetSummary.fields).toEqual(expect.arrayContaining(['score_a', 'score_b', 'group_text', 'v1', 'v2']));

    const doIf = result.results.find((entry) => entry.commandName === 'DO_IF');
    expect(doIf?.status).toBe('ok');
    const loop = result.results.find((entry) => entry.commandName === 'LOOP');
    expect(loop?.status).toBe('ok');
    const doRepeat = result.results.find((entry) => entry.commandName === 'DO_REPEAT');
    expect(doRepeat?.status).toBe('ok');

    const descriptives = result.results.find((entry) => entry.commandName === 'DESCRIPTIVES');
    expect(descriptives?.status).toBe('ok');
  });

  it('supports macro expansion, OMS capture/export, and BEGIN PROGRAM extension hooks', () => {
    clearSyntaxExtensions();
    registerSyntaxExtension('PYTHON3', (invocation: SyntaxExtensionInvocation): SyntaxExtensionResult => {
      const setFieldCommand = invocation.body
        .map((line) => line.trim())
        .find((line) => /^SET_FIELD\s+/i.test(line));
      if (!setFieldCommand) {
        return {
          status: 'ok',
          message: 'PYTHON3 hook received no SET_FIELD command.',
          dataset: invocation.dataset
        };
      }
      const match = setFieldCommand.match(/^SET_FIELD\s+([A-Za-z_][\w$]*)\s+(.+)$/i);
      if (!match) {
        return {
          status: 'error',
          message: 'SET_FIELD syntax must be: SET_FIELD field value.'
        };
      }
      const fieldKey = String(match[1] ?? '').trim().toLowerCase();
      const rawValue = String(match[2] ?? '').trim();
      const parsedValue = /^-?\d+(\.\d+)?$/.test(rawValue)
        ? Number(rawValue)
        : rawValue.replace(/^['"]|['"]$/g, '');
      const fieldExists = invocation.dataset.fields.some((field) => field.key === fieldKey);
      const fields = fieldExists
        ? invocation.dataset.fields.map((field) => ({ ...field }))
        : [
          ...invocation.dataset.fields.map((field) => ({ ...field })),
          { key: fieldKey, label: fieldKey, source: 'variable' as const, valueType: typeof parsedValue === 'number' ? 'number' as const : 'string' as const }
        ];
      const rows = invocation.dataset.rows.map((row) => ({ ...row, [fieldKey]: parsedValue }));
      return {
        status: 'ok',
        message: `Extension set ${fieldKey} for ${rows.length} row(s).`,
        dataset: {
          caseCount: rows.length,
          fields,
          rows,
          notes: invocation.dataset.notes
        },
        output: { fieldKey, appliedValue: parsedValue, rowCount: rows.length }
      };
    });

    try {
      const dataset = {
        caseCount: 6,
        fields: [
          { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
          { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
          { key: 'dept', label: 'Department', source: 'attribute', valueType: 'string' },
          { key: 'score', label: 'Score', source: 'attribute', valueType: 'number' }
        ],
        rows: [
          { case_id: 'c1', case_label: 'Case 1', dept: 'A', score: 10 },
          { case_id: 'c2', case_label: 'Case 2', dept: 'A', score: 12 },
          { case_id: 'c3', case_label: 'Case 3', dept: 'A', score: 14 },
          { case_id: 'c4', case_label: 'Case 4', dept: 'B', score: 8 },
          { case_id: 'c5', case_label: 'Case 5', dept: 'B', score: 9 },
          { case_id: 'c6', case_label: 'Case 6', dept: 'B', score: 11 }
        ],
        notes: []
      } as const;

      const result = runSyntax(
        dataset,
        `
        DEFINE !addflag (src=!TOKENS(1) target=!TOKENS(1)).
        COMPUTE !target = !src >= 12.
        !ENDDEFINE.
        OMS /IF COMMANDS=['DESCRIPTIVES' 'T_TEST'] /DESTINATION FORMAT=JSON OUTFILE='oms_capture.json' /TAG='pilot'.
        !addflag score high_flag.
        DESCRIPTIVES VARIABLES=score.
        T-TEST GROUPS=dept('A' 'B') /VARIABLES=score.
        BEGIN PROGRAM PYTHON3.
        SET_FIELD ext_flag 1
        END PROGRAM.
        OMSINFO.
        OMSEND.
        OUTPUT EXPORT /CONTENTS=OMS /FORMAT=JSON.
        `
      );

      const failures = result.results
        .filter((entry) => entry.status === 'error')
        .map((entry) => ({ commandName: entry.commandName, message: entry.message }));
      expect(failures).toEqual([]);
      expect(result.finalDatasetSummary.fields).toEqual(expect.arrayContaining(['high_flag', 'ext_flag']));

      const macroResult = result.results.find((entry) => entry.commandName === '!ADDFLAG');
      expect(macroResult?.status).toBe('ok');

      const beginProgram = result.results.find((entry) => entry.commandName === 'PYTHON3');
      expect(beginProgram?.status).toBe('ok');

      const omsInfo = result.results.find((entry) => entry.commandName === 'OMSINFO');
      expect(omsInfo?.status).toBe('ok');
      expect(String(omsInfo?.message ?? '')).toContain('OMS is active');

      const outputExport = result.results.find((entry) => entry.commandName === 'OUTPUT_EXPORT');
      expect(outputExport?.status).toBe('ok');
      expect((outputExport?.output as { recordCount?: number } | undefined)?.recordCount).toBeGreaterThanOrEqual(2);
    } finally {
      clearSyntaxExtensions();
    }
  });

  it('supports advanced procedure option syntax plus OUTPUT document/pack workflows', () => {
    const dataset = {
      caseCount: 12,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'outcome', label: 'Outcome', source: 'attribute', valueType: 'number' },
        { key: 'binary_outcome', label: 'Binary outcome', source: 'attribute', valueType: 'number' },
        { key: 'predictor_one', label: 'Predictor one', source: 'attribute', valueType: 'number' },
        { key: 'predictor_two', label: 'Predictor two', source: 'attribute', valueType: 'number' },
        { key: 'site', label: 'Site', source: 'attribute', valueType: 'string' },
        { key: 'time_to_event', label: 'Time to Event', source: 'attribute', valueType: 'number' },
        { key: 'case_weight', label: 'Case Weight', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'case-1', case_label: 'Case 1', outcome: 10, binary_outcome: 0, predictor_one: 1, predictor_two: 2, site: 'North', time_to_event: 4, case_weight: 1 },
        { case_id: 'case-2', case_label: 'Case 2', outcome: 12, binary_outcome: 0, predictor_one: 2, predictor_two: 1, site: 'North', time_to_event: 7, case_weight: 1 },
        { case_id: 'case-3', case_label: 'Case 3', outcome: 14, binary_outcome: 0, predictor_one: 3, predictor_two: 2, site: 'North', time_to_event: 10, case_weight: 1 },
        { case_id: 'case-4', case_label: 'Case 4', outcome: 18, binary_outcome: 1, predictor_one: 4, predictor_two: 3, site: 'South', time_to_event: 5, case_weight: 1.2 },
        { case_id: 'case-5', case_label: 'Case 5', outcome: 20, binary_outcome: 1, predictor_one: 5, predictor_two: 4, site: 'South', time_to_event: 8, case_weight: 1.1 },
        { case_id: 'case-6', case_label: 'Case 6', outcome: 22, binary_outcome: 1, predictor_one: 6, predictor_two: 5, site: 'South', time_to_event: 12, case_weight: 1.1 },
        { case_id: 'case-7', case_label: 'Case 7', outcome: 11, binary_outcome: 0, predictor_one: 1.5, predictor_two: 2.5, site: 'East', time_to_event: 6, case_weight: 0.9 },
        { case_id: 'case-8', case_label: 'Case 8', outcome: 13, binary_outcome: 0, predictor_one: 2.5, predictor_two: 3.5, site: 'East', time_to_event: 9, case_weight: 0.9 },
        { case_id: 'case-9', case_label: 'Case 9', outcome: 17, binary_outcome: 1, predictor_one: 3.5, predictor_two: 4.5, site: 'West', time_to_event: 11, case_weight: 1 },
        { case_id: 'case-10', case_label: 'Case 10', outcome: 19, binary_outcome: 1, predictor_one: 4.5, predictor_two: 5.5, site: 'West', time_to_event: 14, case_weight: 1 },
        { case_id: 'case-11', case_label: 'Case 11', outcome: 21, binary_outcome: 1, predictor_one: 5.5, predictor_two: 6.5, site: 'West', time_to_event: 16, case_weight: 1 },
        { case_id: 'case-12', case_label: 'Case 12', outcome: 9, binary_outcome: 0, predictor_one: 0.8, predictor_two: 1.5, site: 'East', time_to_event: 3, case_weight: 1 }
      ],
      notes: []
    } as const;

    const result = runSyntax(
      dataset,
      `
      OUTPUT NEW NAME='COMMITTEE'.
      OUTPUT ACTIVATE NAME='COMMITTEE'.
      OMS /IF COMMANDS=['GLM' 'GEE' 'COMPLEX_SAMPLES' 'NNEURAL' 'FACTOR'] /EXCEPTIF COMMANDS=['MIXED'] /DESTINATION FORMAT=JSON OUTFILE='committee.json' /VIEWER='COMMITTEE' /MODE=REPLACE.
      GLM binary_outcome WITH predictor_one predictor_two /DISTRIBUTION=BINOMIAL /LINK=LOGIT /MAXITER=80 /CILEVEL=90 /COVB=ROBUST.
      MIXED outcome /FIXED=predictor_one predictor_two /SUBJECT(site) /RANDOM=predictor_one /METHOD=ML /TYPE(ID) /CILEVEL=90.
      GEE outcome /MODEL=predictor_one predictor_two /SUBJECT(site) /DISTRIBUTION=GAUSSIAN /CORRSTRUCT=EXCHANGEABLE /MAXITER=60 /CONVERGE=0.000001 /SMALLSAMPLE.
      CSGLM outcome /BY=site /CLUSTER=site /VARIANCE=LINEARIZATION.
      NNEURAL binary_outcome /INPUTS=predictor_one predictor_two /TYPE=CLASSIFICATION /HIDDEN=4 /EPOCHS=120 /SEED=11 /LEARNINGRATE=0.03.
      FACTOR /VARIABLES=predictor_one predictor_two outcome time_to_event /CRITERIA FACTORS(2) /ROTATION QUARTIMAX /MAXITER=120 /PARALLEL=40 /CONVERGE=0.00001.
      OMSINFO.
      OUTPUT EXPORT /NAME='COMMITTEE' /CONTENTS=ACTIVE /FORMAT=JSON.
      OMSEND.
      `
    );

    const failures = result.results
      .filter((entry) => entry.status === 'error')
      .map((entry) => ({ commandName: entry.commandName, message: entry.message }));
    expect(failures).toEqual([]);

    expect(result.results.find((entry) => entry.commandName === 'GLM')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'MIXED')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'GEE')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'COMPLEX_SAMPLES')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'NNEURAL')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'FACTOR')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'OUTPUT_NEW')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'OUTPUT_ACTIVATE')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'OUTPUT_EXPORT')?.status).toBe('ok');

    const outputExport = result.results.find((entry) => entry.commandName === 'OUTPUT_EXPORT');
    const exportPayload = (outputExport?.output as {
      recordCount?: number;
      payload?: {
        activeDocument?: { recordCount?: number; tree?: unknown[]; tables?: unknown[]; chartTemplates?: unknown[] };
        outputPack?: { activeDocumentName?: string; syntaxHash?: string; documentNames?: string[] };
      };
    } | undefined)?.payload;
    expect((outputExport?.output as { recordCount?: number } | undefined)?.recordCount).toBeGreaterThanOrEqual(4);
    expect(exportPayload?.activeDocument?.recordCount).toBeGreaterThanOrEqual(4);
    expect((exportPayload?.activeDocument?.tree?.length ?? 0)).toBeGreaterThanOrEqual(4);
    expect((exportPayload?.activeDocument?.tables?.length ?? 0)).toBeGreaterThanOrEqual(1);
    expect((exportPayload?.activeDocument?.chartTemplates?.length ?? 0)).toBeGreaterThanOrEqual(1);
    expect(exportPayload?.outputPack?.activeDocumentName).toBe('COMMITTEE');
    expect((exportPayload?.outputPack?.syntaxHash ?? '').length).toBe(8);

    expect(result.outputDocument.name).toBe('COMMITTEE');
    expect(result.outputDocument.recordCount).toBeGreaterThanOrEqual(4);
    expect(result.outputPack.activeDocumentName).toBe('COMMITTEE');
    expect(result.outputPack.documentNames).toContain('COMMITTEE');
    expect(result.outputPack.syntaxHash.length).toBe(8);
  });

  it('supports expanded procedure commands via syntax (CTABLES/ONEWAY/NPAR/T-TEST/RELIABILITY/FACTOR)', () => {
    const dataset = {
      caseCount: 8,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'dept', label: 'Department', source: 'attribute', valueType: 'string' },
        { key: 'passed', label: 'Passed', source: 'attribute', valueType: 'number' },
        { key: 'score', label: 'Score', source: 'attribute', valueType: 'number' },
        { key: 'score_t2', label: 'Score T2', source: 'attribute', valueType: 'number' },
        { key: 'item_1', label: 'Item 1', source: 'attribute', valueType: 'number' },
        { key: 'item_2', label: 'Item 2', source: 'attribute', valueType: 'number' },
        { key: 'item_3', label: 'Item 3', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'c1', case_label: 'Case 1', dept: 'A', passed: 1, score: 12, score_t2: 13, item_1: 3, item_2: 4, item_3: 4 },
        { case_id: 'c2', case_label: 'Case 2', dept: 'A', passed: 1, score: 14, score_t2: 15, item_1: 4, item_2: 4, item_3: 5 },
        { case_id: 'c3', case_label: 'Case 3', dept: 'A', passed: 0, score: 10, score_t2: 11, item_1: 2, item_2: 3, item_3: 3 },
        { case_id: 'c4', case_label: 'Case 4', dept: 'A', passed: 1, score: 13, score_t2: 13, item_1: 4, item_2: 5, item_3: 5 },
        { case_id: 'c5', case_label: 'Case 5', dept: 'B', passed: 0, score: 7, score_t2: 8, item_1: 1, item_2: 2, item_3: 2 },
        { case_id: 'c6', case_label: 'Case 6', dept: 'B', passed: 0, score: 8, score_t2: 9, item_1: 2, item_2: 2, item_3: 2 },
        { case_id: 'c7', case_label: 'Case 7', dept: 'B', passed: 1, score: 9, score_t2: 10, item_1: 2, item_2: 3, item_3: 3 },
        { case_id: 'c8', case_label: 'Case 8', dept: 'B', passed: 0, score: 6, score_t2: 7, item_1: 1, item_2: 1, item_3: 2 }
      ],
      notes: []
    } as const;

    const result = runSyntax(
      dataset,
      `
      CTABLES /TABLE=dept BY passed /MEASURES=score.
      ONEWAY score BY dept.
      NPAR TESTS /MANN-WHITNEY=score BY dept('A' 'B').
      T-TEST GROUPS=dept('A' 'B') /VARIABLES=score.
      T-TEST PAIRS=score WITH score_t2 (PAIRED).
      RELIABILITY /VARIABLES=item_1 item_2 item_3.
      FACTOR /VARIABLES=item_1 item_2 item_3 /CRITERIA FACTORS(1) /ROTATION VARIMAX.
      `
    );

    const failures = result.results
      .filter((entry) => entry.status === 'error')
      .map((entry) => ({ commandName: entry.commandName, message: entry.message }));
    expect(failures).toEqual([]);
    expect(result.successfulCommandCount).toBe(result.commandCount);
    expect(result.results.find((entry) => entry.commandName === 'CTABLES')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'ONEWAY')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'NPAR_TESTS')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'T_TEST')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'T_TEST_PAIRED')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'RELIABILITY')?.status).toBe('ok');
    expect(result.results.find((entry) => entry.commandName === 'FACTOR')?.status).toBe('ok');
  });

  it('supports exact test breadth plus conjoint, categories, and direct marketing modules', () => {
    const dataset = {
      caseCount: 10,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'row_group', label: 'Row Group', source: 'attribute', valueType: 'string' },
        { key: 'col_group', label: 'Column Group', source: 'attribute', valueType: 'string' },
        { key: 'binary_flag', label: 'Binary Flag', source: 'attribute', valueType: 'number' },
        { key: 'before_bin', label: 'Before Binary', source: 'attribute', valueType: 'number' },
        { key: 'after_bin', label: 'After Binary', source: 'attribute', valueType: 'number' },
        { key: 'before_score', label: 'Before Score', source: 'attribute', valueType: 'number' },
        { key: 'after_score', label: 'After Score', source: 'attribute', valueType: 'number' },
        { key: 'rating', label: 'Preference Rating', source: 'attribute', valueType: 'number' },
        { key: 'attribute_color', label: 'Color', source: 'attribute', valueType: 'string' },
        { key: 'attribute_speed', label: 'Speed', source: 'attribute', valueType: 'string' },
        { key: 'attribute_price', label: 'Price', source: 'attribute', valueType: 'string' },
        { key: 'category_a', label: 'Category A', source: 'attribute', valueType: 'string' },
        { key: 'category_b', label: 'Category B', source: 'attribute', valueType: 'string' },
        { key: 'anchor_score', label: 'Anchor Score', source: 'attribute', valueType: 'number' },
        { key: 'customer_id', label: 'Customer ID', source: 'attribute', valueType: 'string' },
        { key: 'response', label: 'Response', source: 'attribute', valueType: 'number' },
        { key: 'recency_days', label: 'Recency Days', source: 'attribute', valueType: 'number' },
        { key: 'purchase_count', label: 'Purchase Count', source: 'attribute', valueType: 'number' },
        { key: 'spend_amount', label: 'Spend Amount', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'c1', case_label: 'Case 1', row_group: 'A', col_group: 'Y', binary_flag: 1, before_bin: 1, after_bin: 1, before_score: 10, after_score: 12, rating: 74, attribute_color: 'red', attribute_speed: 'fast', attribute_price: 'low', category_a: 'north', category_b: 'online', anchor_score: 0.72, customer_id: 'cust-1', response: 1, recency_days: 5, purchase_count: 8, spend_amount: 210 },
        { case_id: 'c2', case_label: 'Case 2', row_group: 'A', col_group: 'Y', binary_flag: 1, before_bin: 1, after_bin: 0, before_score: 11, after_score: 10, rating: 66, attribute_color: 'red', attribute_speed: 'medium', attribute_price: 'mid', category_a: 'north', category_b: 'store', anchor_score: 0.58, customer_id: 'cust-2', response: 0, recency_days: 18, purchase_count: 5, spend_amount: 130 },
        { case_id: 'c3', case_label: 'Case 3', row_group: 'A', col_group: 'N', binary_flag: 0, before_bin: 0, after_bin: 1, before_score: 9, after_score: 11, rating: 71, attribute_color: 'blue', attribute_speed: 'fast', attribute_price: 'low', category_a: 'north', category_b: 'online', anchor_score: 0.68, customer_id: 'cust-3', response: 1, recency_days: 7, purchase_count: 7, spend_amount: 180 },
        { case_id: 'c4', case_label: 'Case 4', row_group: 'A', col_group: 'N', binary_flag: 0, before_bin: 0, after_bin: 0, before_score: 8, after_score: 8, rating: 58, attribute_color: 'blue', attribute_speed: 'medium', attribute_price: 'high', category_a: 'south', category_b: 'store', anchor_score: 0.44, customer_id: 'cust-4', response: 0, recency_days: 42, purchase_count: 3, spend_amount: 75 },
        { case_id: 'c5', case_label: 'Case 5', row_group: 'B', col_group: 'Y', binary_flag: 1, before_bin: 1, after_bin: 1, before_score: 13, after_score: 15, rating: 79, attribute_color: 'green', attribute_speed: 'fast', attribute_price: 'mid', category_a: 'south', category_b: 'online', anchor_score: 0.81, customer_id: 'cust-5', response: 1, recency_days: 3, purchase_count: 9, spend_amount: 240 },
        { case_id: 'c6', case_label: 'Case 6', row_group: 'B', col_group: 'Y', binary_flag: 1, before_bin: 1, after_bin: 0, before_score: 12, after_score: 11, rating: 63, attribute_color: 'green', attribute_speed: 'slow', attribute_price: 'high', category_a: 'south', category_b: 'store', anchor_score: 0.52, customer_id: 'cust-6', response: 0, recency_days: 30, purchase_count: 4, spend_amount: 95 },
        { case_id: 'c7', case_label: 'Case 7', row_group: 'B', col_group: 'N', binary_flag: 0, before_bin: 0, after_bin: 1, before_score: 10, after_score: 12, rating: 76, attribute_color: 'red', attribute_speed: 'fast', attribute_price: 'low', category_a: 'east', category_b: 'online', anchor_score: 0.75, customer_id: 'cust-7', response: 1, recency_days: 6, purchase_count: 8, spend_amount: 205 },
        { case_id: 'c8', case_label: 'Case 8', row_group: 'B', col_group: 'N', binary_flag: 0, before_bin: 0, after_bin: 0, before_score: 9, after_score: 9, rating: 55, attribute_color: 'blue', attribute_speed: 'slow', attribute_price: 'high', category_a: 'east', category_b: 'store', anchor_score: 0.39, customer_id: 'cust-8', response: 0, recency_days: 55, purchase_count: 2, spend_amount: 60 },
        { case_id: 'c9', case_label: 'Case 9', row_group: 'B', col_group: 'Y', binary_flag: 1, before_bin: 1, after_bin: 1, before_score: 14, after_score: 15, rating: 81, attribute_color: 'green', attribute_speed: 'fast', attribute_price: 'low', category_a: 'east', category_b: 'online', anchor_score: 0.84, customer_id: 'cust-9', response: 1, recency_days: 2, purchase_count: 10, spend_amount: 260 },
        { case_id: 'c10', case_label: 'Case 10', row_group: 'A', col_group: 'N', binary_flag: 0, before_bin: 0, after_bin: 0, before_score: 7, after_score: 6, rating: 52, attribute_color: 'blue', attribute_speed: 'slow', attribute_price: 'mid', category_a: 'north', category_b: 'store', anchor_score: 0.33, customer_id: 'cust-10', response: 0, recency_days: 64, purchase_count: 1, spend_amount: 42 }
      ],
      notes: []
    } as const;

    const fisher = analyzeExactTest(dataset, {
      testType: 'fisher_2x2',
      rowField: 'row_group',
      columnField: 'col_group'
    });
    expect(fisher.testType).toBe('fisher_2x2');
    expect(['fisher_exact_2x2', 'chi_square_only']).toContain(fisher.method);

    const binomial = analyzeExactTest(dataset, {
      testType: 'binomial',
      binaryField: 'binary_flag',
      successValue: 1,
      nullProportion: 0.5
    });
    expect(binomial.testType).toBe('binomial');
    expect(binomial.binomialExact?.successCount).toBeGreaterThan(0);

    const mcnemar = analyzeExactTest(dataset, {
      testType: 'mcnemar',
      beforeField: 'before_bin',
      afterField: 'after_bin',
      positiveValue: 1
    });
    expect(mcnemar.testType).toBe('mcnemar');
    expect(mcnemar.mcnemarExact?.discordantPositiveToNegative).toBeGreaterThanOrEqual(0);
    expect(mcnemar.mcnemarExact?.discordantNegativeToPositive).toBeGreaterThanOrEqual(0);

    const sign = analyzeExactTest(dataset, {
      testType: 'sign',
      beforeField: 'before_score',
      afterField: 'after_score'
    });
    expect(sign.testType).toBe('sign');
    expect((sign.signTest?.positiveCount ?? 0) + (sign.signTest?.negativeCount ?? 0)).toBeGreaterThan(0);

    const conjoint = analyzeConjoint(
      dataset,
      'customer_id',
      'rating',
      ['attribute_color', 'attribute_speed', 'attribute_price']
    );
    expect(conjoint.attributes.length).toBe(3);
    expect(conjoint.usableCaseCount).toBeGreaterThanOrEqual(6);
    expect(conjoint.profiles.length).toBeGreaterThanOrEqual(6);

    const optimalScaling = analyzeOptimalScaling(
      dataset,
      ['category_a', 'category_b'],
      'anchor_score'
    );
    expect(optimalScaling.fields.length).toBe(2);
    expect(optimalScaling.usableCaseCount).toBeGreaterThanOrEqual(8);
    expect(optimalScaling.fieldSummaries.length).toBe(2);

    const directMarketing = analyzeDirectMarketing(dataset, {
      customerField: 'customer_id',
      responseField: 'response',
      recencyField: 'recency_days',
      frequencyField: 'purchase_count',
      monetaryField: 'spend_amount'
    });
    expect(directMarketing.usableCaseCount).toBeGreaterThanOrEqual(10);
    expect(directMarketing.deciles.length).toBeGreaterThan(0);
    expect(directMarketing.segments.length).toBeGreaterThan(0);
  });

  it('supports multiple-imputation pooling, expanded exact/nonparametric branches, and deeper forecast/survival outputs', () => {
    const dataset = {
      caseCount: 12,
      fields: [
        { key: 'case_id', label: 'Case ID', source: 'system', valueType: 'string' },
        { key: 'case_label', label: 'Case Label', source: 'system', valueType: 'string' },
        { key: 'group', label: 'Group', source: 'attribute', valueType: 'string' },
        { key: 'outcome', label: 'Outcome', source: 'attribute', valueType: 'number' },
        { key: 'predictor_one', label: 'Predictor One', source: 'attribute', valueType: 'number' },
        { key: 'predictor_two', label: 'Predictor Two', source: 'attribute', valueType: 'number' },
        { key: 'before_score', label: 'Before Score', source: 'attribute', valueType: 'number' },
        { key: 'after_score', label: 'After Score', source: 'attribute', valueType: 'number' },
        { key: 'repeated_a', label: 'Repeated A', source: 'attribute', valueType: 'number' },
        { key: 'repeated_b', label: 'Repeated B', source: 'attribute', valueType: 'number' },
        { key: 'repeated_c', label: 'Repeated C', source: 'attribute', valueType: 'number' },
        { key: 'series_time', label: 'Series Time', source: 'attribute', valueType: 'number' },
        { key: 'series_value', label: 'Series Value', source: 'attribute', valueType: 'number' },
        { key: 'time_to_event', label: 'Time to Event', source: 'attribute', valueType: 'number' },
        { key: 'event_status', label: 'Event Status', source: 'attribute', valueType: 'number' }
      ],
      rows: [
        { case_id: 'c1', case_label: 'Case 1', group: 'A', outcome: 10, predictor_one: 1, predictor_two: 2, before_score: 12, after_score: 13, repeated_a: 4, repeated_b: 5, repeated_c: 6, series_time: 1, series_value: 101, time_to_event: 4, event_status: 1 },
        { case_id: 'c2', case_label: 'Case 2', group: 'A', outcome: 11, predictor_one: 2, predictor_two: 1, before_score: 11, after_score: 12, repeated_a: 5, repeated_b: 5, repeated_c: 7, series_time: 2, series_value: 99, time_to_event: 7, event_status: 0 },
        { case_id: 'c3', case_label: 'Case 3', group: 'A', outcome: null, predictor_one: 3, predictor_two: 3, before_score: 10, after_score: 12, repeated_a: 4, repeated_b: 6, repeated_c: 7, series_time: 3, series_value: 103, time_to_event: 6, event_status: 1 },
        { case_id: 'c4', case_label: 'Case 4', group: 'A', outcome: 13, predictor_one: 4, predictor_two: 2, before_score: 9, after_score: 9, repeated_a: 3, repeated_b: 4, repeated_c: 4, series_time: 4, series_value: 98, time_to_event: 9, event_status: 0 },
        { case_id: 'c5', case_label: 'Case 5', group: 'B', outcome: 15, predictor_one: 5, predictor_two: 5, before_score: 8, after_score: 10, repeated_a: 6, repeated_b: 7, repeated_c: 8, series_time: 5, series_value: 106, time_to_event: 5, event_status: 1 },
        { case_id: 'c6', case_label: 'Case 6', group: 'B', outcome: null, predictor_one: 6, predictor_two: 4, before_score: 7, after_score: 9, repeated_a: 5, repeated_b: 6, repeated_c: 7, series_time: 6, series_value: 97, time_to_event: 10, event_status: 0 },
        { case_id: 'c7', case_label: 'Case 7', group: 'B', outcome: 17, predictor_one: 7, predictor_two: 6, before_score: 6, after_score: 8, repeated_a: 7, repeated_b: 8, repeated_c: 8, series_time: 7, series_value: 107, time_to_event: 8, event_status: 1 },
        { case_id: 'c8', case_label: 'Case 8', group: 'B', outcome: 16, predictor_one: 8, predictor_two: 7, before_score: 5, after_score: 6, repeated_a: 6, repeated_b: 7, repeated_c: 7, series_time: 8, series_value: 96, time_to_event: 12, event_status: 0 },
        { case_id: 'c9', case_label: 'Case 9', group: 'A', outcome: 12, predictor_one: 9, predictor_two: 8, before_score: 9, after_score: 11, repeated_a: 4, repeated_b: 5, repeated_c: 6, series_time: 9, series_value: 108, time_to_event: 11, event_status: 1 },
        { case_id: 'c10', case_label: 'Case 10', group: 'B', outcome: 18, predictor_one: 10, predictor_two: 9, before_score: 8, after_score: 10, repeated_a: 7, repeated_b: 8, repeated_c: 9, series_time: 10, series_value: 95, time_to_event: 13, event_status: 0 },
        { case_id: 'c11', case_label: 'Case 11', group: 'A', outcome: 14, predictor_one: 11, predictor_two: 10, before_score: 7, after_score: 9, repeated_a: 5, repeated_b: 6, repeated_c: 7, series_time: 11, series_value: 109, time_to_event: 14, event_status: 1 },
        { case_id: 'c12', case_label: 'Case 12', group: 'B', outcome: 19, predictor_one: 12, predictor_two: 11, before_score: 6, after_score: 8, repeated_a: 8, repeated_b: 9, repeated_c: 10, series_time: 12, series_value: 94, time_to_event: 15, event_status: 1 }
      ],
      notes: []
    } as const;

    const miPlan = buildMultipleImputationPlan(dataset, [
      {
        field: 'outcome',
        method: 'predictive_mean_matching',
        predictorFields: ['predictor_one', 'predictor_two'],
        nearestNeighbors: 3
      }
    ], undefined, {
      imputations: 4,
      chainIterations: 2,
      randomSeed: 42
    });
    expect(miPlan.imputationsRequested).toBe(4);
    expect(miPlan.datasets.length).toBe(5);
    expect(miPlan.datasets.some((entry) => entry.totalReplacements > 0)).toBe(true);

    const miAnalysis = analyzeWithMultipleImputation(dataset, {
      procedure: 'regression',
      dependentField: 'outcome',
      predictorFields: ['predictor_one', 'predictor_two'],
      model: 'linear'
    }, [
      {
        field: 'outcome',
        method: 'predictive_mean_matching',
        predictorFields: ['predictor_one', 'predictor_two'],
        nearestNeighbors: 3
      }
    ], undefined, {
      imputations: 4,
      chainIterations: 2,
      randomSeed: 42
    });
    expect(miAnalysis.procedure).toBe('regression');
    expect(miAnalysis.imputationsUsed).toBe(4);
    expect(miAnalysis.pooledEstimates.length).toBeGreaterThanOrEqual(2);
    expect(miAnalysis.pooledScalars.rSquared).not.toBeNull();

    const runs = analyzeNonparametricComparison(dataset, 'series_value', 'group', {
      method: 'runs_test',
      exact: true
    });
    expect(runs.method).toBe('runs_test');
    expect(runs.exactPValue).not.toBeNull();

    const wilcoxon = analyzeNonparametricComparison(dataset, 'after_score', 'group', {
      method: 'wilcoxon_signed_rank',
      beforeField: 'before_score',
      exact: true
    });
    expect(wilcoxon.method).toBe('wilcoxon_signed_rank');
    expect(wilcoxon.exactPValue).not.toBeNull();

    const friedman = analyzeNonparametricComparison(dataset, 'repeated_a', 'group', {
      method: 'friedman',
      relatedFields: ['repeated_a', 'repeated_b', 'repeated_c']
    });
    expect(friedman.method).toBe('friedman');
    expect(friedman.degreesOfFreedom).toBe(2);

    const exactWilcoxon = analyzeExactTest(dataset, {
      testType: 'wilcoxon_signed_rank',
      beforeField: 'before_score',
      afterField: 'after_score'
    });
    expect(exactWilcoxon.method).toBe('wilcoxon_signed_rank_exact');
    expect(exactWilcoxon.wilcoxonExact?.pairCount).toBeGreaterThanOrEqual(10);

    const exactRuns = analyzeExactTest(dataset, {
      testType: 'runs',
      binaryField: 'series_value'
    });
    expect(exactRuns.method).toBe('runs_exact');
    expect(exactRuns.runsExact?.runCount).toBeGreaterThanOrEqual(2);

    const forecast = analyzeForecast(dataset, 'series_time', 'series_value', 4, undefined, {
      method: 'auto',
      holdoutFraction: 0.25,
      confidenceLevel: 0.9,
      ljungBoxLags: 4
    });
    expect(forecast.diagnostics.holdoutCaseCount).toBeGreaterThan(0);
    expect(forecast.modelSelection.length).toBeGreaterThanOrEqual(2);
    expect(forecast.diagnostics.ljungBoxPValue).not.toBeNull();

    const survival = analyzeSurvivalAnalysis(
      dataset,
      'time_to_event',
      'event_status',
      'group',
      undefined,
      ['predictor_one', 'predictor_two'],
      {
        confidenceLevel: 0.9,
        tieMethod: 'efron',
        landmarkTimes: [5, 10, 15]
      }
    );
    expect(survival.landmarkSurvival.length).toBeGreaterThan(0);
    expect(survival.restrictedMeanSurvival.length).toBeGreaterThanOrEqual(2);
    expect(survival.modelSelection.length).toBeGreaterThanOrEqual(1);
    expect(survival.options.tieMethod).toBe('efron');
  });
});
