import { describe, expect, it } from 'vitest';
import {
  computeAvisDeadline,
  isDemarchePcaetAvisTousRendus,
  isDemarchePcaetPilote,
} from './demarche-pcaet-guard.rules';

const LES_DEUX_TITRES = [
  'prefet_region' as const,
  'autorite_environnementale' as const,
];

describe('règles pures des guards', () => {
  it('isDemarchePcaetPilote : pilote à compte, ou fallback sans pilote utilisateur', () => {
    expect(isDemarchePcaetPilote('u1', [{ userId: 'u1' }])).toBe(true);
    expect(isDemarchePcaetPilote('u2', [{ userId: 'u1' }])).toBe(false);
    // Pilotes uniquement en tags (sans compte) → tout éditeur est autorisé.
    expect(isDemarchePcaetPilote('u2', [{ userId: null }])).toBe(true);
    expect(isDemarchePcaetPilote('u2', [])).toBe(true);
  });

  describe('isDemarchePcaetAvisTousRendus', () => {
    it('faux sans aucune demande : la condition serait vraie à vide', () => {
      expect(isDemarchePcaetAvisTousRendus([])).toBe(false);
    });

    it('faux tant qu’un titre attendu manque', () => {
      expect(
        isDemarchePcaetAvisTousRendus([{ titresValides: ['prefet_region'] }])
      ).toBe(false);
      expect(isDemarchePcaetAvisTousRendus([{ titresValides: [] }])).toBe(false);
    });

    it('vrai quand chaque demande a tous ses titres', () => {
      expect(
        isDemarchePcaetAvisTousRendus([{ titresValides: LES_DEUX_TITRES }])
      ).toBe(true);
      expect(
        isDemarchePcaetAvisTousRendus([
          { titresValides: LES_DEUX_TITRES },
          { titresValides: LES_DEUX_TITRES },
        ])
      ).toBe(true);
    });

    it('faux si une seule demande sur plusieurs est incomplète', () => {
      expect(
        isDemarchePcaetAvisTousRendus([
          { titresValides: LES_DEUX_TITRES },
          { titresValides: ['prefet_region'] },
        ])
      ).toBe(false);
    });
  });

  it('computeAvisDeadline : délai légal appliqué à la date de transmission', () => {
    expect(
      computeAvisDeadline(new Date('2026-08-06T10:00:00.000Z')).toISOString()
    ).toBe('2026-11-06T10:00:00.000Z');
    // Fin de mois : le débordement est reporté (31 août + 3 mois → 1er déc.).
    expect(
      computeAvisDeadline(new Date('2026-08-31T10:00:00.000Z')).toISOString()
    ).toBe('2026-12-01T10:00:00.000Z');
  });
});
