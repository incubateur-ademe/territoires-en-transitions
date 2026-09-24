import { describe, expect, it } from 'vitest';
import { calculateFicheFingerprint } from './calculate-fiche-fingerprint.rules';
import { FicheFingerprint } from '../models/fiche-analysis';
import { isMobilisationStale } from './is-mobilisation-stale.rules';

const CALCULATED_AT = new Date('2026-09-01T03:00:00Z');
const BEFORE_CALCULATION = new Date('2026-09-01T02:00:00Z');
const AFTER_CALCULATION = new Date('2026-09-02T02:00:00Z');

const toFingerprint = (): FicheFingerprint =>
  calculateFicheFingerprint({
    titre: 'Pistes cyclables',
    description: 'Dix km',
  });

describe('daily-ct-check', () => {
  it.skip('est périmé quand une fiche a été traitée après le dernier calcul', () => {
    const isStale = isMobilisationStale({
      mobilisation: {
        kind: 'calculated',
        calculatedAt: CALCULATED_AT,
        ficheIds: [1, 2],
      },
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: BEFORE_CALCULATION,
          status: 'processed',
          fingerprint: toFingerprint(),
        },
        {
          ficheId: 2,
          collectiviteId: 10,
          analyzedAt: AFTER_CALCULATION,
          status: 'processed',
          fingerprint: toFingerprint(),
        },
      ],
    });

    expect(isStale).toBe(true);
  });

  it.skip('est à jour quand toutes les fiches ont été analysées avant le dernier calcul', () => {
    const isStale = isMobilisationStale({
      mobilisation: {
        kind: 'calculated',
        calculatedAt: CALCULATED_AT,
        ficheIds: [1],
      },
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: BEFORE_CALCULATION,
          status: 'processed',
          fingerprint: toFingerprint(),
        },
      ],
    });

    expect(isStale).toBe(false);
  });

  it.skip("est périmé quand il n'a jamais été calculé et qu'une fiche est traitée", () => {
    const isStale = isMobilisationStale({
      mobilisation: { kind: 'never_calculated' },
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: BEFORE_CALCULATION,
          status: 'processed',
          fingerprint: toFingerprint(),
        },
      ],
    });

    expect(isStale).toBe(true);
  });

  it.skip('reste à jour quand seule une fiche en erreur a été analysée après le dernier calcul', () => {
    const isStale = isMobilisationStale({
      mobilisation: {
        kind: 'calculated',
        calculatedAt: CALCULATED_AT,
        ficheIds: [1],
      },
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: BEFORE_CALCULATION,
          status: 'processed',
          fingerprint: toFingerprint(),
        },
        {
          ficheId: 2,
          collectiviteId: 10,
          analyzedAt: AFTER_CALCULATION,
          status: 'failed',
          retryCount: 1,
        },
      ],
    });

    expect(isStale).toBe(false);
  });

  it.skip("n'est pas périmé quand il n'a jamais été calculé et que toutes les fiches sont en erreur", () => {
    const isStale = isMobilisationStale({
      mobilisation: { kind: 'never_calculated' },
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: AFTER_CALCULATION,
          status: 'failed',
          retryCount: 1,
        },
      ],
    });

    expect(isStale).toBe(false);
  });
});

describe('reclassification-on-deletion', () => {
  it.skip("est périmé quand il cite une fiche qui n'a plus de statut", () => {
    const isStale = isMobilisationStale({
      mobilisation: {
        kind: 'calculated',
        calculatedAt: CALCULATED_AT,
        ficheIds: [1, 2],
      },
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: BEFORE_CALCULATION,
          status: 'processed',
          fingerprint: toFingerprint(),
        },
      ],
    });

    expect(isStale).toBe(true);
  });

  it.skip('est périmé quand la dernière fiche citée a perdu son statut', () => {
    const isStale = isMobilisationStale({
      mobilisation: {
        kind: 'calculated',
        calculatedAt: CALCULATED_AT,
        ficheIds: [1],
      },
      analyses: [],
    });

    expect(isStale).toBe(true);
  });
});
