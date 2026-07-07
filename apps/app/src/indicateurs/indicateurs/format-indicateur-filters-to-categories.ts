import { appLabels } from '@/app/labels/catalog';
import { getCategorieLabel } from '@/app/ui/dropdownLists/indicateur/utils';
import { ListDefinitionsInputFilters } from '@tet/domain/indicateurs';
import { FilterCategory } from '@tet/ui';

export type IndicateurFilterCategoryKey =
  | keyof ListDefinitionsInputFilters
  | 'pilotes';

type LookupLabels = {
  thematiqueIds?: (id: number) => string | undefined;
  planIds?: (id: number) => string | undefined;
  serviceIds?: (id: number) => string | undefined;
  piloteIds?: (id: string | number) => string | undefined;
};

export const formatIndicateurFiltersToCategories = (
  filters: ListDefinitionsInputFilters,
  lookupLabels: LookupLabels = {}
): FilterCategory<IndicateurFilterCategoryKey>[] => {
  const categories: FilterCategory<IndicateurFilterCategoryKey>[] = [];

  const pilotes = [
    ...(filters.utilisateurPiloteIds ?? []),
    ...(filters.personnePiloteIds ?? []),
  ];

  if (pilotes.length) {
    categories.push({
      key: 'pilotes',
      title: appLabels.personnePilote,
      selectedFilters: pilotes.map(
        (id) => lookupLabels.piloteIds?.(id) ?? id.toString()
      ),
    });
  }

  if (filters.categorieNoms?.length) {
    categories.push({
      key: 'categorieNoms',
      title: appLabels.categorie,
      selectedFilters: filters.categorieNoms.map(getCategorieLabel),
    });
  }

  if (filters.estRempli !== undefined) {
    categories.push({
      key: 'estRempli',
      title: appLabels.indicateurCompleteParCollectivite,
      selectedFilters: [
        filters.estRempli ? appLabels.complet : appLabels.incomplet,
      ],
    });
  }

  if (filters.participationScore) {
    categories.push({
      key: 'participationScore',
      title: appLabels.participeAuScoreCae,
      selectedFilters: [],
      onlyShowCategory: true,
    });
  }

  if (filters.estPerso) {
    categories.push({
      key: 'estPerso',
      title: appLabels.indicateurPersonnaliseSingulier,
      selectedFilters: [],
      onlyShowCategory: true,
    });
  }

  if (filters.estConfidentiel) {
    categories.push({
      key: 'estConfidentiel',
      title: appLabels.indicateurPriveSingulier,
      selectedFilters: [],
      onlyShowCategory: true,
    });
  }

  if (filters.hasOpenData) {
    categories.push({
      key: 'hasOpenData',
      title: appLabels.donneesOpenData,
      selectedFilters: [],
      onlyShowCategory: true,
    });
  }

  if (filters.estFavori) {
    categories.push({
      key: 'estFavori',
      title: appLabels.favori,
      selectedFilters: [],
      onlyShowCategory: true,
    });
  }

  if (filters.text) {
    categories.push({
      key: 'text',
      title: appLabels.recherche,
      selectedFilters: [filters.text],
    });
  }

  if (filters.identifiantsReferentiel?.length) {
    categories.push({
      key: 'identifiantsReferentiel',
      title: appLabels.referentiel,
      selectedFilters: filters.identifiantsReferentiel,
    });
  }

  if (filters.mesureId) {
    categories.push({
      key: 'mesureId',
      title: appLabels.mesure,
      selectedFilters: [filters.mesureId],
    });
  }

  if (filters.thematiqueIds?.length) {
    categories.push({
      key: 'thematiqueIds',
      title: appLabels.thematique,
      selectedFilters: filters.thematiqueIds.map(
        (id) => lookupLabels.thematiqueIds?.(id) ?? id.toString()
      ),
    });
  }

  if (filters.planIds?.length) {
    categories.push({
      key: 'planIds',
      title: appLabels.tableauPlan,
      selectedFilters: filters.planIds.map(
        (id) => lookupLabels.planIds?.(id) ?? id.toString()
      ),
    });
  }

  if (filters.serviceIds?.length) {
    categories.push({
      key: 'serviceIds',
      title: appLabels.directionOuServicePilote,
      selectedFilters: filters.serviceIds.map(
        (id) => lookupLabels.serviceIds?.(id) ?? id.toString()
      ),
    });
  }

  return categories;
};
