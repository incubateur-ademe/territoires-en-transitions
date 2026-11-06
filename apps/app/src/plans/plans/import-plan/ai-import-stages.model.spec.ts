import { describe, expect, it } from 'vitest';
import {
  getCurrentImportStage,
  getImportProgressPercent,
  toImportStageViews,
} from './ai-import-stages.model';
import { ImportStepStates } from './ai-import-steps.model';

const allPending: ImportStepStates = {
  reading: 'pending',
  scouting: 'pending',
  extraction: 'pending',
  hierarchy: 'pending',
  scoring: 'pending',
  consolidation: 'pending',
  enrichment: 'pending',
  secteurs: 'pending',
  qualitativeReview: 'pending',
};

describe('toImportStageViews', () => {
  it('sans etats, met la lecture en cours et le reste en attente', () => {
    expect(toImportStageViews()).toEqual([
      { stage: 'lecture', status: 'current' },
      { stage: 'structure', status: 'waiting' },
      { stage: 'actions', status: 'waiting' },
      { stage: 'secteurs', status: 'waiting' },
    ]);
  });

  it('regroupe les etapes du pipeline : une etape commencee est en cours', () => {
    const stepStates: ImportStepStates = {
      ...allPending,
      reading: 'ok',
      scouting: 'skipped',
      extraction: 'ok',
    };

    expect(toImportStageViews(stepStates)).toEqual([
      { stage: 'lecture', status: 'done' },
      { stage: 'structure', status: 'done' },
      { stage: 'actions', status: 'current' },
      { stage: 'secteurs', status: 'waiting' },
    ]);
  });

  it("marque l'etape en echec quand l'import a echoue", () => {
    const stepStates: ImportStepStates = { ...allPending, reading: 'ok' };

    expect(toImportStageViews(stepStates, { failed: true })[1]).toEqual({
      stage: 'structure',
      status: 'failed',
    });
  });

  it('tout est fini quand toutes les etapes sont ok ou sautees', () => {
    const stepStates = Object.fromEntries(
      Object.keys(allPending).map((name) => [name, 'ok'])
    ) as ImportStepStates;

    const stages = toImportStageViews(stepStates);
    expect(stages.every(({ status }) => status === 'done')).toBe(true);
    expect(getCurrentImportStage(stages)).toBe('secteurs');
  });
});

describe('getImportProgressPercent', () => {
  it('compte les etapes terminees ou sautees', () => {
    expect(getImportProgressPercent()).toBe(0);
    expect(
      getImportProgressPercent({
        ...allPending,
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
      })
    ).toBe(33);
  });
});

describe('getCurrentImportStage', () => {
  it('retient la premiere etape en cours', () => {
    expect(
      getCurrentImportStage(
        toImportStageViews({ ...allPending, reading: 'ok' })
      )
    ).toBe('structure');
  });
});
