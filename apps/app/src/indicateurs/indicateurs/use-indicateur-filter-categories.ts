import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { usePersonneListe } from '@/app/collectivites/tags/use-list-personnes';
import { useListServices } from '@/app/collectivites/tags/use-list-services';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { useGetThematiqueOptions } from '@/app/shared/thematiques/use-get-thematique-and-sous-thematique-options';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ListDefinitionsInputFilters } from '@tet/domain/indicateurs';
import { useMemo } from 'react';
import { formatIndicateurFiltersToCategories } from './format-indicateur-filters-to-categories';

export const useIndicateurFilterCategories = (
  filters: ListDefinitionsInputFilters
) => {
  const collectiviteId = useCollectiviteId();
  const { thematiqueListe } = useGetThematiqueOptions();
  const { plans } = useListPlans(collectiviteId);
  const { data: services } = useListServices();
  const { data: personnes } = usePersonneListe();

  const categories = useMemo(
    () =>
      formatIndicateurFiltersToCategories(filters, {
        thematiqueIds: (id) =>
          thematiqueListe.find((thematique) => thematique.id === id)?.nom,
        planIds: (id) => plans.find((plan) => plan.id === id)?.nom ?? undefined,
        serviceIds: (id) => services?.find((service) => service.id === id)?.nom,
        piloteIds: (id) =>
          personnes?.find(
            (personne) => getPersonneStringId(personne) === `${id}`
          )?.nom,
      }),
    [filters, personnes, plans, services, thematiqueListe]
  );

  return { categories, thematiqueListe, plans, services, personnes };
};
