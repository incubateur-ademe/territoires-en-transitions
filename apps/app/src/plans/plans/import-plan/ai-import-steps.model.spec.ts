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
      { name: 'secteurs', status: 'waiting' },
      { name: 'qualitativeReview', status: 'waiting' },
    ]);
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
});
