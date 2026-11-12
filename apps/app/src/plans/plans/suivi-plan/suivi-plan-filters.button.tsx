import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { usePersonneListe } from '@/app/collectivites/tags/use-list-personnes';
import { appLabels } from '@/app/labels/catalog';
import {
  PlanFilterKey,
  PlanFiltersFields,
} from '@/app/plans/plans/show-plan/filters/plan-filters.fields';
import ThematiquesDropdown from '@/app/shared/thematiques/thematiques.dropdown';
import { Alert, Button, ButtonMenu, Field } from '@tet/ui';
import { useSuiviPlanBlocFilters } from './use-suivi-plan-bloc-filters';

export const SuiviPlanFiltersButton = ({
  filters,
  hiddenKeys,
  dataTest,
}: {
  filters: ReturnType<typeof useSuiviPlanBlocFilters>;
  hiddenKeys?: PlanFilterKey[];
  dataTest?: string;
}) => {
  const { data: personnes } = usePersonneListe();
  const personneOptions =
    personnes?.map((personne) => ({
      value: getPersonneStringId(personne),
      label: personne.nom,
    })) ?? [];

  return (
    <ButtonMenu
      icon="filter-line"
      variant="outlined"
      size="xs"
      className="h-8 py-1.5 gap-2 text-sm font-medium rounded-md"
      notification={
        filters.filtersCount > 0 ? { number: filters.filtersCount } : undefined
      }
      dataTest={dataTest}
      menu={{
        className: 'w-[32rem] max-w-lg',
        startContent: (
          <div className="flex flex-col gap-4 p-4">
            <Alert title={appLabels.suiviPlanFiltresBloc} />
            <Field title={appLabels.suiviPlanThematiques}>
              <ThematiquesDropdown
                values={filters.thematiqueIds}
                onChange={filters.setThematiqueIds}
                dataTest={dataTest && `${dataTest}.thematiques`}
              />
            </Field>
            <PlanFiltersFields
              filters={filters.formFilters}
              setFilters={filters.setFormFilters}
              personneOptions={personneOptions}
              hiddenKeys={hiddenKeys}
            />
            <Button
              variant="underlined"
              size="xs"
              className="self-end"
              disabled={filters.filtersCount === 0}
              onClick={filters.resetFilters}
            >
              {appLabels.suiviPlanReinitialiserFiltres}
            </Button>
          </div>
        ),
      }}
    >
      {appLabels.filtrer}
    </ButtonMenu>
  );
};
