import { describe, expect, it } from 'vitest';
import { ImportStepStates, toImportStepViews } from './ai-import-steps.model';

describe('toImportStepViews', () => {
  it('sans etats, met la premiere etape en cours et les suivantes en attente', () => {
    expect(toImportStepViews()).toEqual([
      { name: 'extraction', status: 'current' },
      { name: 'scoring', status: 'waiting' },
      { name: 'consolidation', status: 'waiting' },
      { name: 'enrichment', status: 'waiting' },
      { name: 'qualitativeReview', status: 'waiting' },
    ]);
  });

  it('marque la premiere etape encore pending comme en cours', () => {
    const stepStates: ImportStepStates = {
      extraction: 'ok',
      scoring: 'pending',
      consolidation: 'pending',
      enrichment: 'pending',
      qualitativeReview: 'pending',
    };

    expect(toImportStepViews(stepStates)).toEqual([
      { name: 'extraction', status: 'done' },
      { name: 'scoring', status: 'current' },
      { name: 'consolidation', status: 'waiting' },
      { name: 'enrichment', status: 'waiting' },
      { name: 'qualitativeReview', status: 'waiting' },
    ]);
  });

  it('saute les etapes skipped pour designer la prochaine pending en cours', () => {
    const stepStates: ImportStepStates = {
      extraction: 'ok',
      scoring: 'skipped',
      consolidation: 'skipped',
      enrichment: 'pending',
      qualitativeReview: 'pending',
    };

    expect(toImportStepViews(stepStates)).toEqual([
      { name: 'extraction', status: 'done' },
      { name: 'scoring', status: 'skipped' },
      { name: 'consolidation', status: 'skipped' },
      { name: 'enrichment', status: 'current' },
      { name: 'qualitativeReview', status: 'waiting' },
    ]);
  });

  it('ne designe aucune etape en cours quand tout est termine', () => {
    const stepStates: ImportStepStates = {
      extraction: 'ok',
      scoring: 'skipped',
      consolidation: 'skipped',
      enrichment: 'ok',
      qualitativeReview: 'ok',
    };

    expect(toImportStepViews(stepStates)).toEqual([
      { name: 'extraction', status: 'done' },
      { name: 'scoring', status: 'skipped' },
      { name: 'consolidation', status: 'skipped' },
      { name: 'enrichment', status: 'done' },
      { name: 'qualitativeReview', status: 'done' },
    ]);
  });
});
