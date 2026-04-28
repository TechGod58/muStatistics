import { describe, expect, it } from 'vitest';
import {
  analyzeExactTest,
  analyzeForecast,
  analyzeCompareMeans,
  analyzeComplexSamples,
  analyzeFactorAnalysis,
  analyzeMissingValues,
  analyzeNonparametricComparison,
  analyzeRepeatedMeasures,
  analyzeGeneralLinearModel,
  analyzeGeneralizedEstimatingEquation,
  analyzeMixedModel,
  analyzeNeuralNetwork,
  analyzeRegression,
  analyzeSurvivalAnalysis,
  analyzeTTest,
  analyzeWithMultipleImputation,
  buildMultipleImputationPlan
} from '../../src/index.ts';
import { spssBenchmarkDatasets } from './fixtures.ts';
import {
  expectAssumptionStatuses,
  expectConfidenceIntervalWithinTolerance,
  expectNumericBetween,
  expectNumericWithinTolerance,
  getCoefficientByField
} from './harness.ts';

describe('SPSS benchmark validation harness', () => {
  it('validates compare-means and independent t-test outputs with tolerance and CI checks', () => {
    const dataset = spssBenchmarkDatasets.compareMeansTTest;
    const compareMeans = analyzeCompareMeans(dataset, 'score', 'group');
    const tTest = analyzeTTest(dataset, 'score', 'group');

    expectNumericWithinTolerance({
      actual: compareMeans.anova?.fStatistic,
      expected: 30.374009508716323,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: compareMeans.anova?.pValue,
      expected: 0.00007667087576712639,
      tolerance: 1e-9
    });
    expectNumericWithinTolerance({
      actual: compareMeans.anova?.etaSquared,
      expected: 0.6845,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: compareMeans.postHocComparisons?.[0]?.adjustedPValue,
      expected: 0.00006574506281074779,
      tolerance: 1e-9
    });
    expectAssumptionStatuses(compareMeans.assumptions, [
      { key: 'group_count', status: 'pass' },
      { key: 'minimum_group_size', status: 'pass' }
    ]);

    expectNumericWithinTolerance({
      actual: tTest.statistic,
      expected: 5.891786972069443,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: tTest.degreesOfFreedom,
      expected: 12.332829629301857,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: tTest.pValue,
      expected: 0.00006574506281074779,
      tolerance: 1e-9
    });
    expectNumericWithinTolerance({
      actual: tTest.meanDifference,
      expected: 9.25,
      tolerance: 1e-9
    });
    expectNumericWithinTolerance({
      actual: tTest.cohensD,
      expected: 2.9458934860347217,
      tolerance: 1e-6
    });
    expectConfidenceIntervalWithinTolerance(
      tTest.confidenceInterval,
      {
        level: 0.95,
        lower: 5.839513573654699,
        upper: 12.660486426345301
      },
      1e-6
    );
    expectAssumptionStatuses(tTest.assumptions, [
      { key: 'two_groups', status: 'pass' },
      { key: 'group_size', status: 'pass' },
      { key: 'variance_ratio', status: 'pass' }
    ]);
  });

  it('validates multi-predictor linear regression diagnostics parity', () => {
    const dataset = spssBenchmarkDatasets.linearRegression;
    const regression = analyzeRegression(dataset, 'y', ['x1', 'x2'], 'linear');
    const x1Coefficient = getCoefficientByField(regression.coefficients, 'x1');
    const x2Coefficient = getCoefficientByField(regression.coefficients, 'x2');

    expectNumericWithinTolerance({
      actual: regression.intercept,
      expected: 11.29582033353095,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: x1Coefficient.coefficient,
      expected: 1.6371097844384026,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: x2Coefficient.coefficient,
      expected: 0.11381454751146716,
      tolerance: 1e-6
    });
    expectConfidenceIntervalWithinTolerance(
      x1Coefficient.confidenceInterval,
      {
        level: 0.95,
        lower: 1.6076073497165215,
        upper: 1.6666122191602837
      },
      1e-6
    );
    expectNumericWithinTolerance({
      actual: regression.metrics.rSquared,
      expected: 0.9991563795268275,
      tolerance: 1e-8
    });
    expectNumericWithinTolerance({
      actual: regression.metrics.adjustedRSquared,
      expected: 0.9990571300593953,
      tolerance: 1e-8
    });
    expectNumericWithinTolerance({
      actual: regression.metrics.fStatistic,
      expected: 10067.120815643117,
      tolerance: 1e-5
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.durbinWatson,
      expected: 0.8960413918119412,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.jarqueBeraPValue,
      expected: 0.6237022992278978,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.breuschPaganPValue,
      expected: 0.36505401995147135,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.maxVif,
      expected: 1.621564337947156,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.robustSeInflationMax,
      expected: 1.1608137416477673,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.influentialCount,
      expected: 1,
      tolerance: 1e-12
    });
    expectAssumptionStatuses(regression.assumptions, [
      { key: 'sample_size', status: 'pass' },
      { key: 'residual_df', status: 'pass' },
      { key: 'residual_normality', status: 'pass' },
      { key: 'homoskedasticity', status: 'pass' },
      { key: 'robust_se_shift', status: 'pass' },
      { key: 'multicollinearity', status: 'pass' }
    ]);
  });

  it('validates logistic regression diagnostics and assumption flag parity', () => {
    const dataset = spssBenchmarkDatasets.logisticRegression;
    const regression = analyzeRegression(dataset, 'admit', 'gpa', 'logistic');
    const gpaCoefficient = getCoefficientByField(regression.coefficients, 'gpa');

    expectNumericWithinTolerance({
      actual: regression.intercept,
      expected: -6.396135941877266,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: gpaCoefficient.coefficient,
      expected: 2.061660395405377,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: gpaCoefficient.oddsRatio,
      expected: 7.859008043858322,
      tolerance: 1e-6
    });
    expectConfidenceIntervalWithinTolerance(
      gpaCoefficient.confidenceInterval,
      {
        level: 0.95,
        lower: -0.351778956373892,
        upper: 4.475099747184647
      },
      1e-6
    );
    expectNumericWithinTolerance({
      actual: regression.metrics.accuracy,
      expected: 0.7916666666666666,
      tolerance: 1e-9
    });
    expectNumericWithinTolerance({
      actual: regression.metrics.rocAuc,
      expected: 0.8986013986013986,
      tolerance: 1e-9
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.hosmerLemeshowPValue,
      expected: 0.47798896826767656,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.rocAucCiLower,
      expected: 0.7692308333406732,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.rocAucCiUpper,
      expected: 1,
      tolerance: 1e-12
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.meanAbsoluteCalibrationError,
      expected: 0.19212166776512965,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.calibrationIntercept,
      expected: -0.5276117351638893,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.calibrationSlope,
      expected: 2.9326602808667794,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: regression.diagnostics?.robustSeInflationMax,
      expected: 0.6570161348079504,
      tolerance: 1e-6
    });
    expectAssumptionStatuses(regression.assumptions, [
      { key: 'binary_outcome', status: 'pass' },
      { key: 'sample_size', status: 'pass' },
      { key: 'hosmer_lemeshow', status: 'pass' },
      { key: 'calibration', status: 'warn' },
      { key: 'calibration_intercept', status: 'fail' },
      { key: 'calibration_slope', status: 'fail' },
      { key: 'robust_se_shift', status: 'pass' },
      { key: 'multicollinearity', status: 'warn' },
      { key: 'influence', status: 'pass' }
    ]);
  });

  it('validates GLM, MIXED, and GEE option-depth outputs against benchmark tolerances', () => {
    const dataset = spssBenchmarkDatasets.advancedModels;
    const glm = analyzeGeneralLinearModel(
      dataset,
      'binary_outcome',
      ['site'],
      ['x1', 'x2'],
      {},
      {
        family: 'binomial',
        link: 'probit',
        covarianceEstimator: 'robust',
        confidenceLevel: 0.9,
        maxIterations: 120,
        tolerance: 1e-7
      }
    );
    expect(glm.family).toBe('binomial');
    expect(glm.link).toBe('probit');
    expect(glm.modelOptions.covarianceEstimator).toBe('robust');
    expectNumericWithinTolerance({ actual: glm.metrics.aic, expected: 12.000024000012, tolerance: 1e-6 });
    expectNumericWithinTolerance({ actual: glm.metrics.bic, expected: 14.909463898740004, tolerance: 1e-6 });
    expectNumericWithinTolerance({ actual: glm.metrics.deviance, expected: 0.000024000012000698138, tolerance: 1e-9 });
    const glmX1 = getCoefficientByField(glm.coefficients, 'x1');
    expectNumericWithinTolerance({ actual: glmX1.coefficient, expected: -22167.22686836913, tolerance: 1e-3 });
    expectNumericWithinTolerance({ actual: glmX1.robustStandardError, expected: 3005.3715352473387, tolerance: 1e-3 });
    expectAssumptionStatuses(glm.assumptions, [
      { key: 'sample_size', status: 'pass' },
      { key: 'design_rank', status: 'warn' },
      { key: 'multicollinearity', status: 'fail' },
      { key: 'robust_se_shift', status: 'pass' },
      { key: 'discrimination', status: 'pass' }
    ]);

    const mixed = analyzeMixedModel(
      dataset,
      'outcome',
      ['x1', 'x2'],
      'site',
      {},
      {
        randomSlopeFields: ['x1'],
        covarianceStructure: 'independent',
        estimationMethod: 'ml',
        confidenceLevel: 0.9
      }
    );
    expect(mixed.modelOptions.covarianceStructure).toBe('independent');
    expect(mixed.modelOptions.estimationMethod).toBe('ml');
    expect(mixed.modelOptions.randomSlopeFields).toEqual(['x1']);
    expectNumericWithinTolerance({ actual: mixed.metrics.intraclassCorrelation, expected: 0.9872378089681798, tolerance: 1e-6 });
    expectNumericWithinTolerance({ actual: mixed.metrics.aic, expected: -8.995969812893339, tolerance: 1e-6 });
    const mixedX1 = getCoefficientByField(mixed.coefficients, 'x1');
    expectNumericWithinTolerance({ actual: mixedX1.coefficient, expected: 1.0472665148067746, tolerance: 1e-6 });
    expect(mixed.groupEffects.every((entry) => typeof entry.randomSlopes?.x1 === 'number')).toBe(true);

    const gee = analyzeGeneralizedEstimatingEquation(
      dataset,
      'count_outcome',
      ['x1', 'x2'],
      'site',
      'poisson',
      'exchangeable',
      {},
      {
        link: 'log',
        maxIterations: 110,
        tolerance: 1e-7,
        confidenceLevel: 0.9,
        smallSampleCorrection: true
      }
    );
    expect(gee.link).toBe('log');
    expect(gee.modelOptions.smallSampleCorrection).toBe(true);
    expectNumericWithinTolerance({ actual: gee.metrics.qic, expected: 38.16071199698732, tolerance: 1e-6 });
    expectNumericWithinTolerance({ actual: gee.metrics.qicu, expected: 43.99085383306101, tolerance: 1e-6 });
    const geeX2 = getCoefficientByField(gee.coefficients, 'x2');
    expectNumericWithinTolerance({ actual: geeX2.coefficient, expected: 0.8963653168297322, tolerance: 1e-6 });
    expectNumericWithinTolerance({ actual: geeX2.robustStandardError, expected: 0.3955237241276811, tolerance: 1e-6 });
    expectAssumptionStatuses(gee.assumptions, [
      { key: 'cluster_count', status: 'pass' },
      { key: 'mean_cluster_size', status: 'pass' },
      { key: 'multicollinearity', status: 'fail' },
      { key: 'robust_se_shift', status: 'pass' },
      { key: 'influence', status: 'pass' }
    ]);
  });

  it('validates complex-samples, neural-network, and factor-analysis benchmark outputs', () => {
    const complexSamples = analyzeComplexSamples(spssBenchmarkDatasets.complexSamplesReplicate, 'score', {
      strataField: 'strata',
      clusterField: 'cluster',
      groupField: 'domain',
      weightField: 'weight',
      varianceEstimator: 'replicate',
      replicateWeightFields: ['rep_w1', 'rep_w2', 'rep_w3'],
      finitePopulationCorrectionField: 'fpc',
      confidenceLevel: 0.9
    });
    expect(complexSamples.designSummary.varianceEstimator).toBe('replicate');
    expect(complexSamples.designSummary.replicateWeightCount).toBe(3);
    expect(complexSamples.designSummary.finitePopulationCorrectionField).toBe('fpc');
    expectNumericWithinTolerance({
      actual: complexSamples.estimates[0]?.estimate,
      expected: 58.75757575757576,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: complexSamples.estimates[1]?.standardError,
      expected: 0.18788723425821763,
      tolerance: 1e-6
    });

    const nnClassification = analyzeNeuralNetwork(
      spssBenchmarkDatasets.advancedModels,
      'binary_outcome',
      ['x1', 'x2'],
      'classification',
      5,
      {},
      {
        learningRate: 0.05,
        epochs: 400,
        l2Penalty: 0.002,
        validationSplit: 0.25,
        seed: 7
      }
    );
    expectNumericWithinTolerance({ actual: nnClassification.metrics.accuracy, expected: 1, tolerance: 1e-12 });
    expectNumericWithinTolerance({ actual: nnClassification.metrics.validationAccuracy, expected: 1, tolerance: 1e-12 });
    expectNumericWithinTolerance({
      actual: nnClassification.metrics.trainingLoss,
      expected: 0.0382308207064965,
      tolerance: 1e-8
    });

    const factor = analyzeFactorAnalysis(
      spssBenchmarkDatasets.factorStructure,
      ['item_a', 'item_b', 'item_c', 'item_d'],
      2,
      {},
      'quartimax',
      'principal_axis',
      {
        maxIterations: 180,
        convergenceTolerance: 1e-6,
        parallelAnalysisSamples: 120,
        confidenceLevel: 0.9
      }
    );
    expect(factor.rotation).toBe('quartimax');
    expect(factor.extraction).toBe('principal_axis');
    expect(factor.modelOptions.maxIterations).toBe(180);
    expectNumericWithinTolerance({
      actual: factor.diagnostics.kmoOverall,
      expected: 0.587745663117739,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: factor.diagnostics.residualRmsr,
      expected: 0.0009967586785793413,
      tolerance: 1e-6
    });
    expectNumericWithinTolerance({
      actual: factor.diagnostics.parallelAnalysisRecommendedFactorCount,
      expected: 1,
      tolerance: 1e-12
    });
  });

  it('validates exact/nonparametric edge procedures with option-depth outputs', () => {
    const dataset = spssBenchmarkDatasets.edgeExactProcedures;
    const binomial = analyzeExactTest(dataset, {
      testType: 'binomial',
      binaryField: 'before',
      successValue: 1,
      nullProportion: 0.5
    });
    expect(binomial.method).toBe('binomial_exact');
    expectNumericBetween(binomial.binomialExact?.observedProportion, 0, 1);
    expectNumericBetween(binomial.binomialExact?.pValueTwoSided, 0, 1);

    const mcnemar = analyzeExactTest(dataset, {
      testType: 'mcnemar',
      beforeField: 'before',
      afterField: 'after',
      positiveValue: 1
    });
    expect(mcnemar.method).toBe('mcnemar_exact');
    expect(mcnemar.mcnemarExact?.discordantPositiveToNegative).toBe(2);
    expect(mcnemar.mcnemarExact?.discordantNegativeToPositive).toBe(3);
    expectNumericBetween(mcnemar.mcnemarExact?.pValueTwoSided, 0, 1);

    const runs = analyzeExactTest(dataset, {
      testType: 'runs',
      binaryField: 'run_seq'
    });
    expect(runs.method).toBe('runs_exact');
    expect(runs.runsExact?.runCount).toBeGreaterThanOrEqual(1);
    expectNumericBetween(runs.runsExact?.pValueTwoSided, 0, 1);

    const fisher = analyzeExactTest(dataset, {
      testType: 'fisher_2x2',
      rowField: 'before',
      columnField: 'after'
    });
    expect(fisher.method).toBe('fisher_exact_2x2');
    expectNumericBetween(fisher.fisherExact?.pValueTwoSided, 0, 1);
    expectNumericBetween(fisher.chiSquare?.pValue, 0, 1);

    const mannWhitney = analyzeNonparametricComparison(dataset, 'run_seq', 'col_cat', {
      method: 'mann_whitney_u',
      exact: true
    });
    const medianTest = analyzeNonparametricComparison(dataset, 'run_seq', 'row_cat', {
      method: 'median_test',
      exact: false
    });
    expect(mannWhitney.method).toBe('mann_whitney_u');
    expect(medianTest.method).toBe('median_test');
    expect(mannWhitney.groups.length).toBe(2);
    expect(medianTest.groups.length).toBe(3);
    expectNumericBetween(mannWhitney.pValue, 0, 1);
    expectNumericBetween(medianTest.pValue, 0, 1);
  });

  it('validates missing-values and multiple-imputation pooled inference edge settings', () => {
    const dataset = spssBenchmarkDatasets.edgeMissingImputation;
    const missing = analyzeMissingValues(dataset, { weightField: 'weight' });
    expect(missing.caseCount).toBe(12);
    expect(missing.totalMissingValues).toBe(8);
    expect(missing.weightedCaseCount).not.toBeNull();
    expectNumericBetween(missing.missingCellsPercent, 0, 1);

    const strategies = [
      { field: 'x1', method: 'predictive_mean_matching' as const, predictorFields: ['x2', 'y'], nearestNeighbors: 3 },
      { field: 'x2', method: 'mean' as const },
      { field: 'y', method: 'median' as const },
      { field: 'binary', method: 'logistic_binary' as const, predictorFields: ['x1', 'x2'] }
    ];
    const miPlan = buildMultipleImputationPlan(dataset, strategies, {}, {
      imputations: 4,
      chainIterations: 2,
      randomSeed: 42,
      includeOriginalDataset: false
    });
    expect(miPlan.imputationsGenerated).toBe(4);
    expect(miPlan.datasets.every((entry) => entry.totalReplacements > 0)).toBe(true);

    const miAnalysis = analyzeWithMultipleImputation(dataset, {
      procedure: 'regression',
      dependentField: 'y',
      predictorFields: ['x1', 'x2']
    }, strategies, {}, {
      imputations: 4,
      chainIterations: 2,
      randomSeed: 42
    });
    expect(miAnalysis.imputationsUsed).toBe(4);
    expect(miAnalysis.pooledEstimates.some((entry) => entry.term === 'x1' && entry.estimate !== null)).toBe(true);
    expect(miAnalysis.pooledEstimates.some((entry) => entry.term === 'x2' && entry.estimate !== null)).toBe(true);
    const pValues = miAnalysis.pooledEstimates
      .map((entry) => entry.pValue)
      .filter((value): value is number => value !== null && value !== undefined);
    expect(pValues.length).toBeGreaterThan(0);
    for (const pValue of pValues) {
      expectNumericBetween(pValue, 0, 1);
    }
  });

  it('validates time-series, repeated-measures, and survival diagnostics edge options', () => {
    const forecast = analyzeForecast(
      spssBenchmarkDatasets.edgeTimeSeriesAndSurvival,
      'month',
      'value',
      4,
      {},
      {
        method: 'auto',
        holdoutFraction: 0.2,
        confidenceLevel: 0.9,
        ljungBoxLags: 6
      }
    );
    expect(['arima_auto', 'ets_auto', 'linear_trend', 'moving_average', 'exponential_smoothing']).toContain(forecast.method);
    expect(forecast.forecast.length).toBe(4);
    expect(forecast.modelSelection.length).toBeGreaterThanOrEqual(3);
    expect(forecast.diagnostics.holdoutCaseCount).toBeGreaterThanOrEqual(2);
    expectNumericBetween(forecast.metrics.rSquared, 0, 1);

    const repeated = analyzeRepeatedMeasures(spssBenchmarkDatasets.edgeRepeatedMeasuresAndCox, ['t1', 't2', 't3']);
    expect(repeated.subjectCount).toBe(12);
    expectNumericBetween(repeated.anova?.pValue, 0, 1);
    expectNumericBetween(repeated.anova?.pValueGreenhouseGeisser, 0, 1);
    expectNumericBetween(repeated.anova?.pValueHuynhFeldt, 0, 1);
    expectAssumptionStatuses(repeated.assumptions, [
      { key: 'complete_cases', status: 'pass' }
    ]);

    const survival = analyzeSurvivalAnalysis(
      spssBenchmarkDatasets.edgeRepeatedMeasuresAndCox,
      'time',
      'event',
      'group',
      {},
      ['x1', 'x2'],
      {
        tieMethod: 'efron',
        confidenceLevel: 0.9,
        landmarkTimes: [6, 9, 12]
      }
    );
    expect(survival.groups.length).toBe(3);
    expect(survival.logRank).not.toBeNull();
    if (survival.logRank?.pValue !== null && survival.logRank?.pValue !== undefined) {
      expectNumericBetween(survival.logRank.pValue, 0, 1);
    }
    if (survival.diagnostics?.eventRate !== null && survival.diagnostics?.eventRate !== undefined) {
      expectNumericBetween(survival.diagnostics.eventRate, 0, 1);
    }
    if (survival.diagnostics?.censoringRate !== null && survival.diagnostics?.censoringRate !== undefined) {
      expectNumericBetween(survival.diagnostics.censoringRate, 0, 1);
    }
    if (survival.cox) {
      expect(survival.cox.coefficients.length).toBe(2);
      if (survival.cox.concordance !== null && survival.cox.concordance !== undefined) {
        expectNumericBetween(survival.cox.concordance, 0, 1);
      }
    }
  });
});
