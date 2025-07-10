import { countActiveFicheFilters } from '../count-active-fiche-filters';
import { WITH, WITHOUT } from '../options';
import { FormFilters } from '../types';

describe('countActiveFicheFilters', () => {
  it('should count individual active filters correctly', () => {
    const filters: Partial<FormFilters> = {
      statuts: ['En cours'],
      priorites: ['Élevé'],
      thematiqueIds: [1],
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(3); // statuts, priorites, thematiqueIds
  });

  it('should ignore noPlan filter', () => {
    const filters: Partial<FormFilters> = {
      noPlan: true,
      statuts: ['En cours'],
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(1); // only statuts, noPlan is ignored
  });

  it('should ignore undefined and null values', () => {
    const filters: Partial<FormFilters> = {
      statuts: ['En cours'],
      priorites: undefined,
      thematiqueIds: null as any,
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(1); // only statuts
  });

  it('should ignore empty arrays', () => {
    const filters: Partial<FormFilters> = {
      statuts: ['En cours'],
      priorites: [],
      thematiqueIds: [1, 2],
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(2); // statuts and thematiqueIds, priorites is empty
  });

  it('should count boolean filters correctly', () => {
    const filters: Partial<FormFilters> = {
      hasIndicateurLies: WITH,
      hasNoteDeSuivi: WITHOUT,
      ameliorationContinue: true,
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(3); // hasIndicateurLies, hasNoteDeSuivi, ameliorationContinue
  });

  it('should count pilotes as a single category', () => {
    const filters: Partial<FormFilters> = {
      utilisateurPiloteIds: ['user1', 'user2'],
      personnePiloteIds: [1, 2],
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(1); // pilotes counted as one category
  });

  it('should count referents as a single category', () => {
    const filters: Partial<FormFilters> = {
      utilisateurReferentIds: ['user3'],
      personneReferenteIds: [3, 4],
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(1); // referents counted as one category
  });

  it('should count pilotes and referents as separate categories', () => {
    const filters: Partial<FormFilters> = {
      utilisateurPiloteIds: ['user1'],
      personnePiloteIds: [1],
      utilisateurReferentIds: ['user3'],
      personneReferenteIds: [3],
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(2); // pilotes and referents as separate categories
  });

  it('should handle mixed individual and combined filters', () => {
    const filters: Partial<FormFilters> = {
      statuts: ['En cours'],
      priorites: ['Élevé'],
      utilisateurPiloteIds: ['user1'],
      personnePiloteIds: [1],
      utilisateurReferentIds: ['user3'],
      personneReferenteIds: [3],
      typePeriode: 'creation',
      debutPeriode: '2021-01-01',
      finPeriode: '2021-12-31',
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(5); // periode, statuts, priorites, pilotes (1), referents (1)
  });

  it('should handle empty combined filter arrays', () => {
    const filters: Partial<FormFilters> = {
      utilisateurPiloteIds: [],
      personnePiloteIds: [],
      utilisateurReferentIds: ['user3'],
      personneReferenteIds: [3],
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(1); // only referents (pilotes arrays are empty)
  });

  it('should handle partial combined filter arrays', () => {
    const filters: Partial<FormFilters> = {
      utilisateurPiloteIds: ['user1'],
      personnePiloteIds: [], // empty
      utilisateurReferentIds: [], // empty
      personneReferenteIds: [3],
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(2); // pilotes (1) and referents (1) - each has at least one non-empty array
  });

  it('should return 0 for no active filters', () => {
    const filters: Partial<FormFilters> = {
      statuts: undefined,
      priorites: [],
      thematiqueIds: null as any,
      hasIndicateurLies: undefined,
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(0);
  });

  it('should handle complex scenario with all filter types', () => {
    const filters: Partial<FormFilters> = {
      statuts: ['En cours', 'Réalisé'],
      priorites: ['Élevé'],
      thematiqueIds: [1, 2],
      planActionIds: [10],
      utilisateurPiloteIds: ['user1'],
      personnePiloteIds: [1],
      utilisateurReferentIds: ['user3'],
      personneReferenteIds: [3],
      hasIndicateurLies: WITH,
      ameliorationContinue: true,
      restreint: false,
    };

    const count = countActiveFicheFilters(filters as FormFilters);
    expect(count).toBe(9); // statuts, priorites, thematiqueIds, planActionIds, pilotes(1), referents(1), hasIndicateurLies, ameliorationContinue, restreint
  });
});
