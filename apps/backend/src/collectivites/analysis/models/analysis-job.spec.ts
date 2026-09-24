import { describe, expect, it } from 'vitest';
import {
  ANALYSIS_BUDGET_MS,
  CLASSIFICATION_BUDGET_MS,
  IN_FLIGHT_LEASE_MS,
  MOBILISATION_BUDGET_MS,
  toAnalysisDeadlineFrom,
  toClassificationDeadlineFrom,
} from './analysis-job';

describe("budget de temps de l'analyse", () => {
  it('couvre les deux phases, et le bail in-flight les couvre toutes les deux', () => {
    expect({
      classificationBudget: CLASSIFICATION_BUDGET_MS,
      mobilisationBudget: MOBILISATION_BUDGET_MS,
      analysisBudget: ANALYSIS_BUDGET_MS,
      isLeaseCoveringWholeAnalysis: IN_FLIGHT_LEASE_MS > ANALYSIS_BUDGET_MS,
    }).toEqual({
      classificationBudget: 30 * 60 * 1000,
      mobilisationBudget: 30 * 60 * 1000,
      analysisBudget: 60 * 60 * 1000,
      isLeaseCoveringWholeAnalysis: true,
    });
  });

  it('borne la classification à son propre budget', () => {
    expect(toClassificationDeadlineFrom('2026-09-21T10:00:00.000Z')).toBe(
      '2026-09-21T10:30:00.000Z'
    );
  });

  it("borne l'analyse entiere depuis la creation du job, mobilisation comprise", () => {
    const createdAt = '2026-09-21T10:00:00.000Z';

    expect(toAnalysisDeadlineFrom(createdAt)).toBe('2026-09-21T11:00:00.000Z');
  });

  it('ne laisse plus rien a la mobilisation quand le budget est deja epuise', () => {
    const createdAtBeyondBudget = new Date(
      Date.now() - ANALYSIS_BUDGET_MS - 1000
    ).toISOString();

    expect(
      Date.parse(toAnalysisDeadlineFrom(createdAtBeyondBudget))
    ).toBeLessThan(Date.now());
  });
});
