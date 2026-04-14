import { describe, expect, it } from 'vitest';
import {
  createAttribute,
  createCase,
  createVariable
} from '@mu/core-domain';
import {
  analyzeCompareMeans,
  analyzeCorrelation,
  analyzeCrosstab,
  analyzeFactorAnalysis,
  analyzeNonparametricComparison,
  analyzePairedTTest,
  analyzeRegression,
  analyzeReliability,
  analyzeTTest,
  applyDatasetFilters,
  applyDatasetRecodes,
  buildCaseDataset,
  describeDataset
} from '../src/index';

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
    expect(linear.metrics.fPValue).not.toBeNull();
    expect(Array.isArray(linear.multicollinearity)).toBe(true);
    expect(linear.multicollinearity?.length).toBe(2);
    expect(linear.diagnostics?.maxVif).not.toBeNull();
    expect(linear.diagnostics?.tol_predictor_one).not.toBeNull();
    expect(Array.isArray(linear.influenceSummary)).toBe(true);

    const logistic = analyzeRegression(dataset, 'binary_outcome', ['predictor_one', 'predictor_two'], 'logistic', {
      weightField: 'case_weight'
    });
    expect(logistic.model).toBe('logistic');
    expect(logistic.diagnostics?.logLikelihood).not.toBeNull();
    expect(logistic.diagnostics?.hosmerLemeshowPValue).not.toBeNull();
    expect(logistic.coefficients).toHaveLength(3);
    expect(logistic.diagnostics?.maxVif).not.toBeNull();
    expect(logistic.diagnostics?.influentialCount).not.toBeNull();
    expect(logistic.diagnostics?.maxCooksDistance).not.toBeNull();
    expect(Array.isArray(logistic.multicollinearity)).toBe(true);
    expect(Array.isArray(logistic.influenceSummary)).toBe(true);
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
    expect(reliability.items.every((item) => item.itemTotalCorrelation !== null)).toBe(true);

    const factorAnalysis = analyzeFactorAnalysis(dataset, ['item_1', 'item_2', 'item_3'], 2);
    expect(factorAnalysis.validCaseCount).toBe(6);
    expect(factorAnalysis.factorCount).toBeGreaterThanOrEqual(1);
    expect(factorAnalysis.recommendedFactorCount).toBeGreaterThanOrEqual(1);
    expect(factorAnalysis.eigenvalues.length).toBeGreaterThanOrEqual(factorAnalysis.factorCount);
    expect(factorAnalysis.factors[0]?.eigenvalue).toBeGreaterThan(1);
    expect(factorAnalysis.factors[0]?.loadings).toHaveLength(3);
    expect(factorAnalysis.correlationMatrix).toHaveLength(3);
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
  });
});
