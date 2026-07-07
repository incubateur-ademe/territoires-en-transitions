import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { usePersonneListe } from '@/app/collectivites/tags/use-list-personnes';
import { useListServices } from '@/app/collectivites/tags/use-list-services';
import { ListActionsInput } from '@tet/domain/referentiels';
import { useMemo } from 'react';
import {
  ActionFilterCategoryKey,
  formatActionFiltersToCategories,
} from './format-action-filters-to-categories';

type Args = {
  filters: ListActionsInput;
  includeReferentielIds?: boolean;
};

export const useActionFilterCategories = ({
  filters,
  includeReferentielIds = false,
}: Args) => {
  const { data: personnes } = usePersonneListe();
  const { data: services } = useListServices();

  return useMemo(
    () =>
      formatActionFiltersToCategories(
        filters,
        {
          piloteIds: (id) =>
            personnes?.find(
              (personne) => getPersonneStringId(personne) === `${id}`
            )?.nom,
          serviceIds: (id) =>
            services?.find((service) => service.id === id)?.nom,
        },
        { includeReferentielIds }
      ),
    [filters, includeReferentielIds, personnes, services]
  );
};

export type { ActionFilterCategoryKey };
