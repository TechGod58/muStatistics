import { expect } from 'vitest';
import type { AssumptionCheck, ConfidenceInterval, RegressionCoefficient } from '../../src/index.ts';

type NumericExpectation = {
  actual: number | null | undefined;
  expected: number | null;
  tolerance?: number;
};

export type AssumptionStatusExpectation = {
  key: string;
  status: AssumptionCheck['status'];
};

const DEFAULT_TOLERANCE = 1e-4;

export function expectNumericWithinTolerance(expectation: NumericExpectation): void {
  const { actual, expected, tolerance = DEFAULT_TOLERANCE } = expectation;
  if (expected === null) {
    expect(actual ?? null).toBeNull();
    return;
  }
  expect(typeof actual).toBe('number');
  const numericActual = actual as number;
  const delta = Math.abs(numericActual - expected);
  expect(delta).toBeLessThanOrEqual(tolerance);
}

export function expectNumericBetween(
  actual: number | null | undefined,
  minimum: number,
  maximum: number
): void {
  expect(typeof actual).toBe('number');
  const numericActual = actual as number;
  expect(numericActual).toBeGreaterThanOrEqual(minimum);
  expect(numericActual).toBeLessThanOrEqual(maximum);
}

export function expectConfidenceIntervalWithinTolerance(
  actual: ConfidenceInterval | null | undefined,
  expected: ConfidenceInterval,
  tolerance = DEFAULT_TOLERANCE
): void {
  expect(actual).not.toBeNull();
  expect(actual).toBeDefined();
  const interval = actual as ConfidenceInterval;
  expectNumericWithinTolerance({
    actual: interval.level,
    expected: expected.level,
    tolerance
  });
  expectNumericWithinTolerance({
    actual: interval.lower,
    expected: expected.lower,
    tolerance
  });
  expectNumericWithinTolerance({
    actual: interval.upper,
    expected: expected.upper,
    tolerance
  });
}

export function expectAssumptionStatuses(
  assumptions: AssumptionCheck[] | undefined,
  expectations: AssumptionStatusExpectation[]
): void {
  expect(assumptions).toBeDefined();
  const assumptionMap = new Map((assumptions ?? []).map((assumption) => [assumption.key, assumption.status]));
  for (const expectation of expectations) {
    expect(assumptionMap.get(expectation.key)).toBe(expectation.status);
  }
}

export function getCoefficientByField(
  coefficients: RegressionCoefficient[],
  field: string
): RegressionCoefficient {
  const coefficient = coefficients.find((item) => item.field === field);
  expect(coefficient).toBeDefined();
  return coefficient as RegressionCoefficient;
}
