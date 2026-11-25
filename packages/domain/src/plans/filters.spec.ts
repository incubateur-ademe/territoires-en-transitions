import { describe, expect, test } from 'vitest';
import { hasSousActionFieldFilters } from './filters';

describe('hasSousActionFieldFilters', () => {
  test.each([
    { statuts: ['En retard' as const] },
    { noStatut: true },
    { utilisateurPiloteIds: ['u1'] },
    { personnePiloteIds: [1] },
    { noPilote: true },
    { texteNomOuDescription: 'vélo' },
    { noTitre: true },
    { noDescription: true },
    { hasDateDeFinPrevisionnelle: false },
    { typePeriode: 'fin' as const, debutPeriode: '2026-01-01' },
  ])('vrai pour %o', (filters) => {
    expect(hasSousActionFieldFilters(filters)).toBe(true);
  });

  test.each([
    {},
    { thematiqueIds: [1], priorites: ['Élevé' as const] },
    { statuts: [], personnePiloteIds: [], texteNomOuDescription: '' },
    { noPilote: false },
    { typePeriode: 'fin' as const },
    { typePeriode: 'debut' as const, debutPeriode: '2026-01-01' },
    { withSousActionsMatches: true },
  ])('faux pour %o', (filters) => {
    expect(hasSousActionFieldFilters(filters)).toBe(false);
  });
});
