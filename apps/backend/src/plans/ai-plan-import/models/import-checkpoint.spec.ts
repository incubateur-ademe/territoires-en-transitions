import { describe, expect, it } from 'vitest';
import { emptyTokenUsage } from '@tet/backend/utils/llm/token-usage';
import { createEmptyExtractedAction } from './extracted-action';
import {
  ImportCheckpoint,
  isImportCheckpointSupported,
  isSupportedGenericImport,
  parseImportCheckpoint,
} from './import-checkpoint';

const checkpoint: ImportCheckpoint = {
  schemaVersion: 1,
  completedStep: 'extraction',
  currentDate: '2026-06-10T00:00:00Z',
  llm: { strategy: 'whole-document', maxInputTokens: 900_000 },
  progress: {
    actions: [createEmptyExtractedAction({ titre: 'Rénover les bâtiments' })],
    review: null,
    tokens: emptyTokenUsage(),
    stepStates: {
      reading: 'ok',
      scouting: 'skipped',
      extraction: 'ok',
      hierarchy: 'pending',
      scoring: 'pending',
      consolidation: 'pending',
      enrichment: 'pending',
      secteurs: 'skipped',
      qualitativeReview: 'pending',
    },
    warnings: [],
  },
  chunks: ['Rénover les bâtiments'],
  units: null,
  skeleton: null,
  source: { chunks: ['Rénover les bâtiments'], chunkIndexByAction: [0] },
  documentStats: null,
};

describe('Contrat des points de reprise', () => {
  it('reprend le format générique v1 sans métadonnées de profil ni type documentaire', () => {
    expect(parseImportCheckpoint(checkpoint)).toEqual({
      success: true,
      data: checkpoint,
    });
    expect(isImportCheckpointSupported(checkpoint, {})).toBe(true);
  });

  it('accepte les métadonnées explicites du contrat générique', () => {
    const contract = {
      profile: 'generic',
      contractVersion: 1,
      catalogueVersion: null,
    };

    expect(
      isImportCheckpointSupported({ ...checkpoint, ...contract }, contract)
    ).toBe(true);
  });

  it('restaure les étapes ajoutées au format générique v1', () => {
    const {
      reading: _reading,
      scouting: _scouting,
      hierarchy: _hierarchy,
      secteurs: _secteurs,
      ...steps
    } = checkpoint.progress.stepStates;

    const result = parseImportCheckpoint({
      ...checkpoint,
      progress: { ...checkpoint.progress, stepStates: steps },
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        progress: {
          stepStates: {
            reading: 'skipped',
            scouting: 'skipped',
            hierarchy: 'skipped',
            secteurs: 'skipped',
          },
        },
      },
    });
  });

  it.each([
    { profile: 'annexe-3-electrification' },
    { profile: 'unknown' },
    { profile: null },
    { contractVersion: 2 },
    { contractVersion: '1' },
    { catalogueVersion: 'annexe-v1' },
    { schemaVersion: 2 },
    { completedStep: 'unknown' },
    { currentDate: 'invalid' },
    {
      progress: {
        ...checkpoint.progress,
        actions: [{ titre: 'Fiche incomplète' }],
      },
    },
    { source: { chunks: ['texte'], chunkIndexByAction: ['0'] } },
    { source: { chunks: ['texte'], chunkIndexByAction: [] } },
    { source: { chunks: ['texte'], chunkIndexByAction: [0, 0] } },
    { source: { chunks: ['texte'], chunkIndexByAction: [1] } },
    { source: { chunks: [], chunkIndexByAction: [0] } },
    { units: [{ id: 'unité incomplète' }] },
  ])('refuse un checkpoint non pris en charge : %j', (change) => {
    expect(parseImportCheckpoint({ ...checkpoint, ...change }).success).toBe(
      false
    );
    expect(isImportCheckpointSupported({ ...checkpoint, ...change }, {})).toBe(
      false
    );
  });

  it.each([
    null,
    { profile: 'annexe-3-electrification' },
    { profile: 'unknown' },
    { profile: null },
    { contractVersion: 2 },
    { catalogueVersion: 'annexe-v1' },
  ])(
    'refuse les options incompatibles même avec un checkpoint générique : %j',
    (options) => {
      expect(isSupportedGenericImport(options)).toBe(false);
      expect(isImportCheckpointSupported(checkpoint, options)).toBe(false);
    }
  );
});
