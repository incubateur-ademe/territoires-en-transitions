import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { usePersonneListe } from '@/app/collectivites/tags/use-list-personnes';
import { useListServices } from '@/app/collectivites/tags/use-list-services';
import { formatIndicateurFiltersToCategories } from '@/app/indicateurs/indicateurs/format-indicateur-filters-to-categories';
import { filterCategoriesToBadgeStrings } from '@/app/plans/fiches/list-all-fiches/filters/filter-categories-to-badge-strings';
import { fromFiltersToFormFilters } from '@/app/plans/fiches/list-all-fiches/filters/filter-converter';
import { formatToPrintableFilters } from '@/app/plans/fiches/list-all-fiches/filters/format-to-printable-filters';
import { getFilterValuesLabels } from '@/app/plans/fiches/list-all-fiches/filters/get-filter-values-labels';
import { FilterKeys } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { useFicheActionFiltersData } from '@/app/plans/fiches/list-all-fiches/filters/use-fiche-action-filters-data';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { useGetThematiqueOptions } from '@/app/shared/thematiques/use-get-thematique-and-sous-thematique-options';
import {
  formatModuleFiltersToCategories,
  isIndicateurModuleFilters,
  ModuleFilters,
} from '@/app/tableaux-de-bord/modules/module/format-module-filters-to-categories';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FilterCategory } from '@tet/ui';
import { useMemo } from 'react';

export type { ModuleFilters };

type Args = {
  filters: ModuleFilters;
  customCategories?: FilterCategory[];
  /** Remplace les badges planActionIds par ceux de `customCategories` */
  replacePlanFilters?: boolean;
};

export const useModuleFilterCategories = ({
  filters,
  customCategories,
  replacePlanFilters,
}: Args) => {
  const collectiviteId = useCollectiviteId();
  const { lookupConfig } = useFicheActionFiltersData();
  const { thematiqueListe } = useGetThematiqueOptions();
  const { plans } = useListPlans(collectiviteId);
  const { data: services } = useListServices();
  const { data: personnes } = usePersonneListe();

  const categories = useMemo(() => {
    const shouldReplacePlanFilters = Boolean(replacePlanFilters);
    const filtersForBadges =
      shouldReplacePlanFilters && 'planActionIds' in filters
        ? { ...filters, planActionIds: undefined }
        : filters;

    const actionLookups = {
      piloteIds: (id: string | number) =>
        personnes?.find((personne) => getPersonneStringId(personne) === `${id}`)
          ?.nom,
      serviceIds: (id: number) =>
        services?.find((service) => service.id === id)?.nom,
    };

    const actionCategories = formatModuleFiltersToCategories(
      filtersForBadges,
      actionLookups
    );

    const computedCategories =
      actionCategories ??
      (isIndicateurModuleFilters(filtersForBadges)
        ? formatIndicateurFiltersToCategories(filtersForBadges, {
            thematiqueIds: (id) =>
              thematiqueListe.find((thematique) => thematique.id === id)?.nom,
            planIds: (id) =>
              plans.find((plan) => plan.id === id)?.nom ?? undefined,
            serviceIds: actionLookups.serviceIds,
            piloteIds: actionLookups.piloteIds,
          })
        : formatToPrintableFilters(
            fromFiltersToFormFilters(filtersForBadges),
            {},
            (categoryKey: FilterKeys, values: string[] | number[]) =>
              getFilterValuesLabels(lookupConfig, categoryKey, values)
          ).map((category) => ({ ...category, readonly: true })));

    if (!customCategories?.length) {
      return computedCategories;
    }

    return [...customCategories, ...computedCategories];
  }, [
    customCategories,
    filters,
    lookupConfig,
    personnes,
    plans,
    replacePlanFilters,
    services,
    thematiqueListe,
  ]);

  const badgeStrings = useMemo(
    () => filterCategoriesToBadgeStrings(categories),
    [categories]
  );

  return { categories, badgeStrings };
};
