import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { usePersonneListe } from '@/app/collectivites/tags/use-list-personnes';
import { appLabels } from '@/app/labels/catalog';
import {
  PlanFilterKey,
  planFilterLabels,
} from '@/app/plans/plans/show-plan/filters/plan-filters.fields';
import { useGetThematiqueOptions } from '@/app/shared/thematiques/use-get-thematique-and-sous-thematique-options';
import { PlanNode } from '@tet/domain/plans';
import { BadgeFilters } from '@tet/ui';
import { useSuiviPlanBlocFilters } from './use-suivi-plan-bloc-filters';

type BadgeKey = PlanFilterKey | 'thematiqueIds' | 'axeIds';

type Option = { value: string; label: string };

export const SuiviPlanFilterBadges = ({
  filters,
  axes = [],
}: {
  filters: ReturnType<typeof useSuiviPlanBlocFilters>;
  axes?: PlanNode[];
}) => {
  const { data: personnes } = usePersonneListe();
  const { thematiqueListe } = useGetThematiqueOptions();

  const getPersonneLabel = (value: string) =>
    personnes?.find((personne) => getPersonneStringId(personne) === value)
      ?.nom ?? value;

  const optionsByKey: Partial<Record<BadgeKey, Option[]>> = {
    axeIds: filters.axeIds.map((id) => ({
      value: String(id),
      label: axes.find((axe) => axe.id === id)?.nom || appLabels.sansTitre,
    })),
    thematiqueIds: filters.thematiqueIds.map((id) => ({
      value: String(id),
      label:
        thematiqueListe.find((thematique) => thematique.id === id)?.nom ??
        String(id),
    })),
    ...Object.fromEntries(
      (Object.keys(planFilterLabels) as PlanFilterKey[]).map((key) => [
        key,
        (filters.formFilters[key] ?? []).map((value) => ({
          value,
          label:
            key === 'pilotes' || key === 'referents'
              ? getPersonneLabel(value)
              : value,
        })),
      ])
    ),
  };

  const filterCategories = (Object.keys(optionsByKey) as BadgeKey[])
    .filter((key) => (optionsByKey[key]?.length ?? 0) > 0)
    .map((key) => ({
      key,
      title:
        key === 'thematiqueIds'
          ? appLabels.suiviPlanThematiques
          : key === 'axeIds'
          ? appLabels.suiviPlanAxe
          : planFilterLabels[key],
      selectedFilters: optionsByKey[key]?.map((option) => option.label) ?? [],
    }));

  if (filterCategories.length === 0) {
    return null;
  }

  const setValues = (key: BadgeKey, values: string[]) => {
    if (key === 'thematiqueIds') {
      filters.setThematiqueIds(values.map(Number));
    } else if (key === 'axeIds') {
      filters.setAxeIds(values.map(Number));
    } else {
      filters.setFormFilters({ ...filters.formFilters, [key]: values });
    }
  };

  const toKeys = (key: BadgeKey | BadgeKey[]) =>
    Array.isArray(key) ? key : [key];

  return (
    <BadgeFilters<BadgeKey>
      filterCategories={filterCategories}
      onDeleteFilterValue={({ categoryKey, valueToDelete }) =>
        toKeys(categoryKey).forEach((key) =>
          setValues(
            key,
            (optionsByKey[key] ?? [])
              .filter((option) => option.label !== valueToDelete)
              .map((option) => option.value)
          )
        )
      }
      onDeleteFilterCategory={(categoryKey) =>
        toKeys(categoryKey).forEach((key) => setValues(key, []))
      }
      onClearAllFilters={filters.resetFilters}
    />
  );
};
