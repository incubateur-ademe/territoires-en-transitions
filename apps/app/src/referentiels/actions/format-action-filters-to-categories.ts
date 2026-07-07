import { referentielToName } from '@/app/app/labels';
import { appLabels } from '@/app/labels/catalog';
import { ListActionsInput, ReferentielId } from '@tet/domain/referentiels';
import { FilterCategory } from '@tet/ui';

export type ActionFilterCategoryKey =
  | 'referentielIds'
  | 'pilotes'
  | 'servicePiloteIds';

type LookupLabels = {
  piloteIds?: (id: string | number) => string | undefined;
  serviceIds?: (id: number) => string | undefined;
};

export const formatActionFiltersToCategories = (
  filters: ListActionsInput,
  lookupLabels: LookupLabels = {},
  options?: { includeReferentielIds?: boolean }
): FilterCategory<ActionFilterCategoryKey>[] => {
  const categories: FilterCategory<ActionFilterCategoryKey>[] = [];

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

  if (options?.includeReferentielIds && filters.referentielIds?.length) {
    categories.push({
      key: 'referentielIds',
      title: appLabels.referentiel,
      selectedFilters: filters.referentielIds.map(
        (referentiel) => referentielToName[referentiel as ReferentielId]
      ),
      readonly: true,
    });
  }

  if (filters.servicePiloteIds?.length) {
    categories.push({
      key: 'servicePiloteIds',
      title: appLabels.directionOuServicePilote,
      selectedFilters: filters.servicePiloteIds.map(
        (id) => lookupLabels.serviceIds?.(id) ?? id.toString()
      ),
    });
  }

  return categories;
};
