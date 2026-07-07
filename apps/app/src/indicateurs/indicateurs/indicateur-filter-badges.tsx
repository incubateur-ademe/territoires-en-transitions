'use client';

import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { getCategorieLabel } from '@/app/ui/dropdownLists/indicateur/utils';
import { BadgeFilters, ClearAllFiltersButton, cn } from '@tet/ui';
import { ListDefinitionsInputFilters } from '@tet/domain/indicateurs';
import { IndicateurFilterCategoryKey } from './format-indicateur-filters-to-categories';
import { useIndicateurFilterCategories } from './use-indicateur-filter-categories';

type Props = {
  filters: ListDefinitionsInputFilters;
  onFiltersChange: (filters: ListDefinitionsInputFilters) => void;
  onClearAllFilters?: () => void;
  className?: string;
};

export const IndicateurFilterBadges = ({
  filters,
  onFiltersChange,
  onClearAllFilters,
  className,
}: Props) => {
  const {
    categories: filterCategories,
    thematiqueListe,
    plans,
    services,
    personnes,
  } = useIndicateurFilterCategories(filters);

  if (filterCategories.length === 0) {
    return null;
  }

  const onDeleteFilterCategory = (
    categoryKey: IndicateurFilterCategoryKey | IndicateurFilterCategoryKey[]
  ) => {
    const keys = Array.isArray(categoryKey) ? categoryKey : [categoryKey];
    const updatedFilters = { ...filters };

    keys.forEach((key) => {
      if (key === 'pilotes') {
        delete updatedFilters.utilisateurPiloteIds;
        delete updatedFilters.personnePiloteIds;
      } else {
        delete updatedFilters[key];
      }
    });

    onFiltersChange(updatedFilters);
  };

  const onDeleteFilterValue = ({
    categoryKey,
    valueToDelete,
  }: {
    categoryKey: IndicateurFilterCategoryKey | IndicateurFilterCategoryKey[];
    valueToDelete: string;
  }) => {
    const keys = Array.isArray(categoryKey) ? categoryKey : [categoryKey];
    const updatedFilters = { ...filters };

    keys.forEach((key) => {
      if (key === 'categorieNoms') {
        updatedFilters.categorieNoms = updatedFilters.categorieNoms?.filter(
          (nom) =>
            getCategorieLabel(nom) !== valueToDelete && nom !== valueToDelete
        );
        if (!updatedFilters.categorieNoms?.length) {
          delete updatedFilters.categorieNoms;
        }
        return;
      }

      if (key === 'estRempli' || key === 'text' || key === 'mesureId') {
        delete updatedFilters[key];
        return;
      }

      if (key === 'identifiantsReferentiel') {
        updatedFilters.identifiantsReferentiel =
          updatedFilters.identifiantsReferentiel?.filter(
            (id) => id !== valueToDelete
          );
        if (!updatedFilters.identifiantsReferentiel?.length) {
          delete updatedFilters.identifiantsReferentiel;
        }
        return;
      }

      if (key === 'thematiqueIds') {
        const targetId =
          thematiqueListe.find((thematique) => thematique.nom === valueToDelete)
            ?.id ?? Number(valueToDelete);
        if (Number.isNaN(targetId)) {
          return;
        }
        updatedFilters.thematiqueIds = updatedFilters.thematiqueIds?.filter(
          (id) => id !== targetId
        );
        if (!updatedFilters.thematiqueIds?.length) {
          delete updatedFilters.thematiqueIds;
        }
        return;
      }

      if (key === 'planIds') {
        const targetId =
          plans.find((plan) => plan.nom === valueToDelete)?.id ??
          Number(valueToDelete);
        if (Number.isNaN(targetId)) {
          return;
        }
        updatedFilters.planIds = updatedFilters.planIds?.filter(
          (id) => id !== targetId
        );
        if (!updatedFilters.planIds?.length) {
          delete updatedFilters.planIds;
        }
        return;
      }

      if (key === 'serviceIds') {
        const targetId =
          services?.find((service) => service.nom === valueToDelete)?.id ??
          Number(valueToDelete);
        if (Number.isNaN(targetId)) {
          return;
        }
        updatedFilters.serviceIds = updatedFilters.serviceIds?.filter(
          (id) => id !== targetId
        );
        if (!updatedFilters.serviceIds?.length) {
          delete updatedFilters.serviceIds;
        }
        return;
      }

      if (key === 'pilotes') {
        const personne = personnes?.find(
          (candidate) =>
            candidate.nom === valueToDelete ||
            getPersonneStringId(candidate) === valueToDelete
        );
        const targetId = personne
          ? getPersonneStringId(personne)
          : valueToDelete;

        updatedFilters.utilisateurPiloteIds =
          updatedFilters.utilisateurPiloteIds?.filter((id) => id !== targetId);
        if (!updatedFilters.utilisateurPiloteIds?.length) {
          delete updatedFilters.utilisateurPiloteIds;
        }

        updatedFilters.personnePiloteIds =
          updatedFilters.personnePiloteIds?.filter(
            (id) => id.toString() !== targetId
          );
        if (!updatedFilters.personnePiloteIds?.length) {
          delete updatedFilters.personnePiloteIds;
        }
      }
    });

    onFiltersChange(updatedFilters);
  };

  return (
    <div className={cn('flex gap-2 items-center flex-wrap', className)}>
      <BadgeFilters<IndicateurFilterCategoryKey>
        filterCategories={filterCategories}
        onDeleteFilterValue={onDeleteFilterValue}
        onDeleteFilterCategory={onDeleteFilterCategory}
      />
      {onClearAllFilters ? (
        <ClearAllFiltersButton onClick={onClearAllFilters} />
      ) : null}
    </div>
  );
};
