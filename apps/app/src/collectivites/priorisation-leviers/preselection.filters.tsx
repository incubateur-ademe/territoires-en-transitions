import { appLabels } from '@/app/labels/catalog';
import {
  type ActionDeReference,
  type CategorieAction,
  categorieActionEnumValues,
  LEVIER_NOM_BY_ID,
  type LevierId,
  levierIdEnumValues,
} from '@tet/domain/shared';
import { type Option, type OptionValue, Select } from '@tet/ui';
import { JSX, ReactNode, useMemo, useState } from 'react';
import * as z from 'zod/mini';

export type PreselectionFilter = {
  levierId?: LevierId;
  categorie?: CategorieAction;
};

type PreselectionFiltering = {
  filter: PreselectionFilter;
  filteredActions: readonly ActionDeReference[];
  chooseLevier: (value: OptionValue | undefined) => void;
  chooseCategorie: (value: OptionValue | undefined) => void;
};

type PreselectionFiltersProps = {
  actions: readonly ActionDeReference[];
  filtering: PreselectionFiltering;
};

const levierIdSchema = z.enum(levierIdEnumValues);

const categorieSchema = z.enum(categorieActionEnumValues);

const toCategorie = (
  value: OptionValue | undefined
): CategorieAction | undefined => {
  const categorie = categorieSchema.safeParse(value);
  return categorie.success ? categorie.data : undefined;
};

const matchesFilter = (
  action: ActionDeReference,
  { levierId, categorie }: PreselectionFilter
): boolean =>
  (levierId === undefined || action.leviers.includes(levierId)) &&
  (categorie === undefined || action.categories.includes(categorie));

const toEffectiveFilter = ({
  chosenFilter,
  actions,
}: {
  chosenFilter: PreselectionFilter;
  actions: readonly ActionDeReference[];
}): PreselectionFilter => {
  const hasChosenLevier = actions.some(
    (action) =>
      chosenFilter.levierId !== undefined &&
      action.leviers.includes(chosenFilter.levierId)
  );
  const hasChosenCategorie = actions.some(
    (action) =>
      chosenFilter.categorie !== undefined &&
      action.categories.includes(chosenFilter.categorie)
  );
  return {
    levierId: hasChosenLevier ? chosenFilter.levierId : undefined,
    categorie: hasChosenCategorie ? chosenFilter.categorie : undefined,
  };
};

export const usePreselectionFiltering = (
  actions: readonly ActionDeReference[]
): PreselectionFiltering => {
  const [chosenFilter, setFilter] = useState<PreselectionFilter>({});
  const filter = useMemo(
    () => toEffectiveFilter({ chosenFilter, actions }),
    [chosenFilter, actions]
  );
  const filteredActions = useMemo(
    () => actions.filter((action) => matchesFilter(action, filter)),
    [actions, filter]
  );
  return {
    filter,
    filteredActions,
    chooseLevier: (value) => {
      const levierId = levierIdSchema.safeParse(value);
      setFilter((current) => ({
        ...current,
        levierId: levierId.success ? levierId.data : undefined,
      }));
    },
    chooseCategorie: (value) => {
      setFilter((current) => ({ ...current, categorie: toCategorie(value) }));
    },
  };
};

const toLevierOptions = (actions: readonly ActionDeReference[]): Option[] =>
  levierIdEnumValues
    .filter((levierId) =>
      actions.some((action) => action.leviers.includes(levierId))
    )
    .map((levierId) => ({
      value: levierId,
      label: LEVIER_NOM_BY_ID[levierId],
    }));

export const toCategorieOption = (categorie: CategorieAction): Option => ({
  value: categorie,
  label: appLabels.categorieActionLabel(categorie),
});

const toCategorieOptions = (actions: readonly ActionDeReference[]): Option[] =>
  categorieActionEnumValues
    .filter((categorie) =>
      actions.some((action) => action.categories.includes(categorie))
    )
    .map(toCategorieOption);

export const FilterField = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): JSX.Element => (
  <fieldset className="m-0 min-w-0 border-0 p-0">
    <legend className="sr-only">{label}</legend>
    {children}
  </fieldset>
);

export const PreselectionFilters = ({
  actions,
  filtering,
}: PreselectionFiltersProps): JSX.Element => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-2xl">
    <FilterField label={appLabels.filtrerParLevier}>
      <Select
        options={toLevierOptions(actions)}
        values={filtering.filter.levierId}
        onChange={filtering.chooseLevier}
        placeholder={appLabels.filtrerParLevier}
        small
      />
    </FilterField>
    <FilterField label={appLabels.filtrerParCategorie}>
      <Select
        options={toCategorieOptions(actions)}
        values={filtering.filter.categorie}
        onChange={filtering.chooseCategorie}
        placeholder={appLabels.filtrerParCategorie}
        small
      />
    </FilterField>
  </div>
);
