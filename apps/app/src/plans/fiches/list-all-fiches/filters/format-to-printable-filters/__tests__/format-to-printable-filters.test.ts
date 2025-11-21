import { formatToPrintableFilters } from '..';
import { filterLabels } from '../../labels';
import type { FilterKeys, FormFilters } from '../../types';
import { createDateFilterLabel } from '../create-date-filter-label';

describe('formatToPrintableFilters', () => {
  it('formats filters to printable categories with date filter (deep equal)', () => {
    const filters: FormFilters = {
      noPlan: false,
      debutPeriode: '2024-12-31T23:00:00.000Z',
      finPeriode: '2025-04-30T22:00:00.000Z',
      typePeriode: 'debut',
      restreint: true,
      doesBelongToSeveralPlans: true,
      noPriorite: true,
      noTag: true,
      noStatut: true,
      noReferent: true,
      noServicePilote: true,
      noPilote: true,
      ameliorationContinue: true,
      hasIndicateurLies: 'WITH',
      notesDeSuivi: 'WITH_RECENT',
      hasMesuresLiees: 'WITH',
      hasAtLeastBeginningOrEndDate: false,
      hasDateDeFinPrevisionnelle: 'WITHOUT',
      planActionIds: [1],
      personnePiloteIds: [3],
      servicePiloteIds: [3],
      structurePiloteIds: [17],
      personneReferenteIds: [3],
      statuts: ['À venir'],
      priorites: ['Élevé'],
      thematiqueIds: [1, 13],
      financeurIds: [1],
      partenaireIds: [3],
      cibles: ['Grand public'],
      anneesNoteDeSuivi: ['2023'],
      utilisateurPiloteIds: ['4'],
      utilisateurReferentIds: [],
      sort: 'modified_at',
    };
    const getFilterValuesLabels = (
      key: FilterKeys,
      values: any[]
    ): string[] => {
      return values.map((v) => v.toString());
    };
    const result = formatToPrintableFilters(filters, {}, getFilterValuesLabels);
    expect(result).toEqual([
      {
        key: 'restreint',
        title: 'Fiche action en mode privé',
        selectedFilters: ['true'],
        onlyShowCategory: true,
      },
      {
        key: 'doesBelongToSeveralPlans',
        title: 'Actions mutualisées dans plusieurs plans',
        selectedFilters: ['true'],
        onlyShowCategory: true,
      },
      {
        key: 'noPriorite',
        title: 'Sans niveau de priorité',
        selectedFilters: ['true'],
        onlyShowCategory: true,
      },
      {
        key: 'noTag',
        title: 'Sans tags personnalisés',
        selectedFilters: ['true'],
        onlyShowCategory: true,
      },
      {
        key: 'noStatut',
        title: filterLabels['noStatut'],
        selectedFilters: ['true'],
        onlyShowCategory: true,
      },
      {
        key: 'noReferent',
        title: filterLabels['noReferent'],
        selectedFilters: ['true'],
        onlyShowCategory: true,
      },
      {
        key: 'noServicePilote',
        title: filterLabels['noServicePilote'],
        selectedFilters: ['true'],
        onlyShowCategory: true,
      },
      {
        key: 'noPilote',
        title: filterLabels['noPilote'],
        selectedFilters: ['true'],
        onlyShowCategory: true,
      },
      {
        key: 'ameliorationContinue',
        title: filterLabels['ameliorationContinue'],
        selectedFilters: ['true'],
        onlyShowCategory: true,
      },
      {
        key: 'hasIndicateurLies',
        title: filterLabels['hasIndicateurLies'],
        selectedFilters: ['Fiches avec indicateurs'],
        onlyShowCategory: false,
      },
      {
        key: 'notesDeSuivi',
        title: filterLabels['notesDeSuivi'],
        selectedFilters: ['WITH_RECENT'],
        onlyShowCategory: false,
      },
      {
        key: 'hasMesuresLiees',
        title: filterLabels['hasMesuresLiees'],
        selectedFilters: ['Avec mesures liées'],
        onlyShowCategory: false,
      },
      {
        key: 'hasAtLeastBeginningOrEndDate',
        title: filterLabels['hasAtLeastBeginningOrEndDate'],
        selectedFilters: ['false'],
        onlyShowCategory: false,
      },
      {
        key: 'hasDateDeFinPrevisionnelle',
        title: filterLabels['hasDateDeFinPrevisionnelle'],
        selectedFilters: ['Date non renseignée'],
        onlyShowCategory: false,
      },
      {
        key: 'planActionIds',
        title: filterLabels['planActionIds'],
        selectedFilters: ['1'],
        onlyShowCategory: false,
      },
      {
        key: ['utilisateurPiloteIds', 'personnePiloteIds'],
        title: filterLabels['personnePiloteIds'],
        selectedFilters: ['4', '3'],
        onlyShowCategory: false,
      },
      {
        key: 'servicePiloteIds',
        title: filterLabels['servicePiloteIds'],
        selectedFilters: ['3'],
        onlyShowCategory: false,
      },
      {
        key: 'structurePiloteIds',
        title: filterLabels['structurePiloteIds'],
        selectedFilters: ['17'],
        onlyShowCategory: false,
      },
      {
        key: ['utilisateurReferentIds', 'personneReferenteIds'],
        title: filterLabels['personneReferenteIds'],
        selectedFilters: ['3'],
        onlyShowCategory: false,
      },
      {
        key: 'statuts',
        title: filterLabels['statuts'],
        selectedFilters: ['À venir'],
        onlyShowCategory: false,
      },
      {
        key: 'priorites',
        title: filterLabels['priorites'],
        selectedFilters: ['Élevé'],
        onlyShowCategory: false,
      },
      {
        key: 'thematiqueIds',
        title: filterLabels['thematiqueIds'],
        selectedFilters: ['1', '13'],
        onlyShowCategory: false,
      },
      {
        key: 'financeurIds',
        title: filterLabels['financeurIds'],
        selectedFilters: ['1'],
        onlyShowCategory: false,
      },
      {
        key: 'partenaireIds',
        title: filterLabels['partenaireIds'],
        selectedFilters: ['3'],
        onlyShowCategory: false,
      },
      {
        key: 'cibles',
        title: filterLabels['cibles'],
        selectedFilters: ['Grand public'],
        onlyShowCategory: false,
      },
      {
        key: 'anneesNoteDeSuivi',
        title: filterLabels['anneesNoteDeSuivi'],
        selectedFilters: ['2023'],
        onlyShowCategory: false,
      },
      {
        key: ['typePeriode', 'debutPeriode', 'finPeriode'],
        title: createDateFilterLabel(filters as FormFilters),
        selectedFilters: [],
        onlyShowCategory: true,
      },
    ]);
  });

  it('removes from the list checkboxes filters that are equal to "true" and that do not need to be displayed', () => {
    const filters: Partial<FormFilters> = {
      noReferent: false,
      noServicePilote: false,
      noPilote: false,
      ameliorationContinue: false,
      restreint: false,
      noPriorite: false,
      noTag: false,
      noStatut: false,
      doesBelongToSeveralPlans: false,
    };
    const result = formatToPrintableFilters(
      filters as FormFilters,
      {},
      () => []
    );
    expect(result).toEqual([]);
  });
});
