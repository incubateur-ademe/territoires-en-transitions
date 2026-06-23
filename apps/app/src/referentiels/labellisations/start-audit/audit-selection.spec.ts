import { describe, expect, it } from 'vitest';
import {
  auditSelectionSchema,
  auditSelectionToRequestInput,
} from './audit-selection';

describe('auditSelectionSchema', () => {
  it('valide un audit COT et ignore l\'étoile', () => {
    const result = auditSelectionSchema.safeParse({
      sujet: 'cot',
      targetStar: null,
    });
    expect(result).toEqual({ success: true, data: { sujet: 'cot' } });
  });

  it('valide une variante labellisante avec son étoile', () => {
    const result = auditSelectionSchema.safeParse({
      sujet: 'labellisation_cot',
      targetStar: 4,
    });
    expect(result).toEqual({
      success: true,
      data: { sujet: 'labellisation_cot', targetStar: 4 },
    });
  });

  it('rejette une sélection sans sujet', () => {
    expect(
      auditSelectionSchema.safeParse({ sujet: null, targetStar: 3 }).success
    ).toBe(false);
  });

  it('rejette une variante labellisante sans étoile', () => {
    expect(
      auditSelectionSchema.safeParse({
        sujet: 'labellisation',
        targetStar: null,
      }).success
    ).toBe(false);
  });

  it('rejette la première étoile (hors périmètre audit)', () => {
    expect(
      auditSelectionSchema.safeParse({ sujet: 'labellisation', targetStar: 1 })
        .success
    ).toBe(false);
  });
});

describe('auditSelectionToRequestInput', () => {
  const context = { collectiviteId: 16527, referentiel: 'cae' as const };

  it('envoie etoiles: null pour un audit COT seul', () => {
    expect(auditSelectionToRequestInput(context, { sujet: 'cot' })).toEqual({
      collectiviteId: 16527,
      referentiel: 'cae',
      sujet: 'cot',
      etoiles: null,
    });
  });

  it('envoie l\'étoile visée pour une labellisation COT', () => {
    expect(
      auditSelectionToRequestInput(context, {
        sujet: 'labellisation_cot',
        targetStar: 3,
      })
    ).toEqual({
      collectiviteId: 16527,
      referentiel: 'cae',
      sujet: 'labellisation_cot',
      etoiles: 3,
    });
  });
});
