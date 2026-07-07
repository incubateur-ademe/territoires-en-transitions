import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { usePersonneListe } from '@/app/collectivites/tags/use-list-personnes';
import { useListServices } from '@/app/collectivites/tags/use-list-services';
import { BadgeFilters, ClearAllFiltersButton, cn } from '@tet/ui';
import { ListActionsInput } from '@tet/domain/referentiels';
import { ActionFilterCategoryKey } from './format-action-filters-to-categories';
import { useActionFilterCategories } from './use-action-filter-categories';

type Props = {
  filters: ListActionsInput;
  onFiltersChange: (filters: ListActionsInput) => void;
  onClearAllFilters: () => void;
  className?: string;
};

export const ActionFilterBadges = ({
  filters,
  onFiltersChange,
  onClearAllFilters,
  className,
}: Props) => {
  const filterCategories = useActionFilterCategories({ filters });
  const { data: personnes } = usePersonneListe();
  const { data: services } = useListServices();

  if (filterCategories.length === 0) {
    return null;
  }

  const onDeleteFilterCategory = (
    categoryKey: ActionFilterCategoryKey | ActionFilterCategoryKey[]
  ) => {
    const keys = Array.isArray(categoryKey) ? categoryKey : [categoryKey];

    const updatedFilters = { ...filters };
    keys.forEach((key) => {
      if (key === 'pilotes') {
        delete updatedFilters.utilisateurPiloteIds;
        delete updatedFilters.personnePiloteIds;
      } else if (key === 'servicePiloteIds') {
        delete updatedFilters.servicePiloteIds;
      }
    });
    onFiltersChange(updatedFilters);
  };

  const onDeleteFilterValue = ({
    categoryKey,
    valueToDelete,
  }: {
    categoryKey: ActionFilterCategoryKey | ActionFilterCategoryKey[];
    valueToDelete: string;
  }) => {
    const keys = Array.isArray(categoryKey) ? categoryKey : [categoryKey];
    const updatedFilters = { ...filters };

    keys.forEach((key) => {
      if (key === 'pilotes') {
        // Le badge affiche le nom de la personne, mais retombe sur son id
        // quand la liste des personnes n'est pas encore chargée. On résout
        // donc par nom ou par id, avec repli sur la valeur brute (l'id).
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

      if (key === 'servicePiloteIds') {
        // Repli sur la valeur brute (l'id) quand le libellé du service n'est
        // pas résolu (liste des services non chargée).
        const targetId =
          services?.find((service) => service.nom === valueToDelete)?.id ??
          Number(valueToDelete);
        if (Number.isNaN(targetId)) {
          return;
        }

        updatedFilters.servicePiloteIds =
          updatedFilters.servicePiloteIds?.filter((id) => id !== targetId);

        if (!updatedFilters.servicePiloteIds?.length) {
          delete updatedFilters.servicePiloteIds;
        }
      }
    });

    onFiltersChange(updatedFilters);
  };

  return (
    <div className={cn('flex gap-2 items-center flex-wrap', className)}>
      <BadgeFilters<ActionFilterCategoryKey>
        filterCategories={filterCategories}
        onDeleteFilterValue={onDeleteFilterValue}
        onDeleteFilterCategory={onDeleteFilterCategory}
      />
      <ClearAllFiltersButton onClick={onClearAllFilters} />
    </div>
  );
};
