import { describe, expect, it } from 'vitest';
import {
  auditSelectionSchema,
  auditSelectionToRequestInput,
} from './audit-selection';

describe('auditSelectionSchema', () => {
  it('valide un audit COT', () => {
    const result = auditSelectionSchema.safeParse({ sujet: 'cot' });
    expect(result).toEqual({ success: true, data: { sujet: 'cot' } });
  });

  it('valide une variante labellisante', () => {
    const result = auditSelectionSchema.safeParse({
      sujet: 'labellisation_cot',
    });
    expect(result).toEqual({
      success: true,
      data: { sujet: 'labellisation_cot' },
    });
  });

  it('rejette une sélection sans sujet', () => {
    expect(auditSelectionSchema.safeParse({ sujet: null }).success).toBe(false);
  });
});

describe('auditSelectionToRequestInput', () => {
  const context = {
    collectiviteId: 16527,
    referentiel: 'cae' as const,
    etoile: 3 as const,
  };

  it("envoie etoiles: null pour un audit COT seul, quelle que soit l'étoile de la checklist", () => {
    expect(auditSelectionToRequestInput(context, { sujet: 'cot' })).toEqual({
      collectiviteId: 16527,
      referentiel: 'cae',
      sujet: 'cot',
      etoiles: null,
    });
  });

  it("envoie l'étoile de la checklist pour une labellisation COT", () => {
    expect(
      auditSelectionToRequestInput(context, { sujet: 'labellisation_cot' })
    ).toEqual({
      collectiviteId: 16527,
      referentiel: 'cae',
      sujet: 'labellisation_cot',
      etoiles: 3,
    });
  });
});
