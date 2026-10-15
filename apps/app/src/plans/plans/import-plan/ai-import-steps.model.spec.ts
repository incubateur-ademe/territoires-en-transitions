import { describe, expect, it } from 'vitest';
import { ImportStepStates, toImportStepViews } from './ai-import-steps.model';

describe('toImportStepViews', () => {
  it('sans etats, met la premiere etape en cours et les suivantes en attente', () => {
    expect(toImportStepViews()).toEqual([
      { name: 'reading', status: 'current' },
      { name: 'scouting', status: 'waiting' },
      { name: 'extraction', status: 'waiting' },
      { name: 'hierarchy', status: 'waiting' },
      { name: 'scoring', status: 'waiting' },
      { name: 'consolidation', status: 'waiting' },
      { name: 'enrichment', status: 'waiting' },
      { name: 'secteurs', status: 'waiting' },
      { name: 'qualitativeReview', status: 'waiting' },
    ]);
  });

  it('marque la premiere etape encore pending comme en cours', () => {
    const stepStates: ImportStepStates = {
      reading: 'ok',
      scouting: 'skipped',
      extraction: 'ok',
      hierarchy: 'skipped',
      scoring: 'pending',
      consolidation: 'pending',
      enrichment: 'pending',
      secteurs: 'pending',
      qualitativeReview: 'pending',
    };

    expect(toImportStepViews(stepStates)).toEqual([
      { name: 'reading', status: 'done' },
      { name: 'scouting', status: 'skipped' },
      { name: 'extraction', status: 'done' },
      { name: 'hierarchy', status: 'skipped' },
      { name: 'scoring', status: 'current' },
      { name: 'consolidation', status: 'waiting' },
      { name: 'enrichment', status: 'waiting' },
      { name: 'secteurs', status: 'waiting' },
      { name: 'qualitativeReview', status: 'waiting' },
    ]);
  });

  it('saute les etapes skipped pour designer la prochaine pending en cours', () => {
    const stepStates: ImportStepStates = {
      reading: 'ok',
      scouting: 'skipped',
      extraction: 'ok',
      hierarchy: 'skipped',
      scoring: 'skipped',
      consolidation: 'skipped',
      enrichment: 'pending',
      secteurs: 'pending',
      qualitativeReview: 'pending',
    };

    expect(toImportStepViews(stepStates)).toEqual([
      { name: 'reading', status: 'done' },
      { name: 'scouting', status: 'skipped' },
      { name: 'extraction', status: 'done' },
      { name: 'hierarchy', status: 'skipped' },
      { name: 'scoring', status: 'skipped' },
      { name: 'consolidation', status: 'skipped' },
      { name: 'enrichment', status: 'current' },
      { name: 'secteurs', status: 'current' },
      { name: 'qualitativeReview', status: 'waiting' },
    ]);
  });

  it("met les secteurs en cours avec l'enrichissement, puis avec la relecture", () => {
    const afterConsolidation: ImportStepStates = {
      reading: 'ok',
      scouting: 'skipped',
      extraction: 'ok',
      hierarchy: 'skipped',
      scoring: 'ok',
      consolidation: 'ok',
      enrichment: 'pending',
      secteurs: 'pending',
      qualitativeReview: 'pending',
    };
    const current = (stepStates: ImportStepStates) =>
      toImportStepViews(stepStates)
        .filter(({ status }) => status === 'current')
        .map(({ name }) => name);

    expect(
      current({ ...afterConsolidation, consolidation: 'pending' })
    ).toEqual(['consolidation']);
    expect(current(afterConsolidation)).toEqual(['enrichment', 'secteurs']);
    expect(current({ ...afterConsolidation, enrichment: 'ok' })).toEqual([
      'secteurs',
      'qualitativeReview',
    ]);
    expect(current({ ...afterConsolidation, secteurs: 'ok' })).toEqual([
      'enrichment',
    ]);
    expect(
      current({
        ...afterConsolidation,
        enrichment: 'ok',
        qualitativeReview: 'ok',
      })
    ).toEqual(['secteurs']);
  });

  it('ne designe aucune etape en cours quand tout est termine', () => {
    const stepStates: ImportStepStates = {
      reading: 'ok',
      scouting: 'skipped',
      extraction: 'ok',
      hierarchy: 'skipped',
      scoring: 'skipped',
      consolidation: 'skipped',
      enrichment: 'ok',
      secteurs: 'skipped',
      qualitativeReview: 'ok',
    };

    expect(toImportStepViews(stepStates)).toEqual([
      { name: 'reading', status: 'done' },
      { name: 'scouting', status: 'skipped' },
      { name: 'extraction', status: 'done' },
      { name: 'hierarchy', status: 'skipped' },
      { name: 'scoring', status: 'skipped' },
      { name: 'consolidation', status: 'skipped' },
      { name: 'enrichment', status: 'done' },
      { name: 'secteurs', status: 'skipped' },
      { name: 'qualitativeReview', status: 'done' },
    ]);
  });

  it("met en echec les etapes en cours quand l'import a echoue", () => {
    const stepStates: ImportStepStates = {
      reading: 'ok',
      scouting: 'skipped',
      extraction: 'ok',
      hierarchy: 'skipped',
      scoring: 'ok',
      consolidation: 'ok',
      enrichment: 'pending',
      secteurs: 'pending',
      qualitativeReview: 'pending',
    };

    expect(toImportStepViews(stepStates, { failed: true }).slice(-3)).toEqual([
      { name: 'enrichment', status: 'failed' },
      { name: 'secteurs', status: 'failed' },
      { name: 'qualitativeReview', status: 'waiting' },
    ]);
  });
});
