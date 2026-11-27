import {
  getPersonneStringId,
  isMembre,
} from '@/app/collectivites/tags/personnes.utils';
import { usePersonneListe } from '@/app/collectivites/tags/use-list-personnes';
import { useListServices } from '@/app/collectivites/tags/use-list-services';
import { appLabels } from '@/app/labels/catalog';
import {
  PlanFilterKey,
  PlanFiltersFields,
} from '@/app/plans/plans/show-plan/filters/plan-filters.fields';
import ThematiquesDropdown from '@/app/shared/thematiques/thematiques.dropdown';
import { FiltersGenericButtonMenu } from '@/app/ui/lists/filters.generic-button-menu';
import { PlanNode } from '@tet/domain/plans';
import { Alert, Button, Field, SelectFilter } from '@tet/ui';
import { useSuiviPlanBlocFilters } from './use-suivi-plan-bloc-filters';

export const SuiviPlanFiltersButton = ({
  filters,
  hiddenKeys,
  axes,
  withServicesPilotes = false,
  dataTest,
}: {
  filters: ReturnType<typeof useSuiviPlanBlocFilters>;
  hiddenKeys?: PlanFilterKey[];
  axes?: PlanNode[];
  /** Le filtre par direction ou service pilote, propre au bloc des indicateurs */
  withServicesPilotes?: boolean;
  dataTest?: string;
}) => {
  const { data: personnes } = usePersonneListe();
  const personneOptions =
    personnes?.filter(isMembre).map((personne) => ({
      value: getPersonneStringId(personne),
      label: personne.nom,
    })) ?? [];
  const { data: services } = useListServices();

  const axesField = axes && (
    <Field title={appLabels.suiviPlanAxe}>
      <SelectFilter
        values={filters.axeIds.map(String)}
        options={axes.map((axe) => ({
          value: String(axe.id),
          label: `${' '.repeat((axe.depth - 1) * 4)}${
            axe.nom || appLabels.sansTitre
          }`,
        }))}
        onChange={({ values }) =>
          filters.setAxeIds(Array.isArray(values) ? values.map(Number) : [])
        }
        disabled={axes.length === 0}
        isSearcheable
        dataTest={dataTest && `${dataTest}.axes`}
      />
    </Field>
  );
  const thematiquesField = (
    <Field title={appLabels.suiviPlanThematiques}>
      <ThematiquesDropdown
        values={filters.thematiqueIds}
        onChange={filters.setThematiqueIds}
        dataTest={dataTest && `${dataTest}.thematiques`}
      />
    </Field>
  );

  return (
    <FiltersGenericButtonMenu
      activeFiltersCount={filters.filtersCount}
      menuClassName="w-[32rem] max-w-lg"
      dataTest={dataTest}
    >
      <div className="flex flex-col gap-4">
        <Alert title={appLabels.suiviPlanFiltresBloc} />
        {axesField}
        {withServicesPilotes ? (
          <>
            <PlanFiltersFields
              filters={filters.formFilters}
              setFilters={filters.setFormFilters}
              personneOptions={personneOptions}
              hiddenKeys={[
                'statuts',
                'referents',
                'priorites',
                'suivi',
                ...(hiddenKeys ?? []),
              ]}
            />
            <Field title={appLabels.directionOuServicePilote()}>
              <SelectFilter
                values={filters.servicePiloteIds.map(String)}
                options={(services ?? []).map((service) => ({
                  value: String(service.id),
                  label: service.nom,
                }))}
                onChange={({ values }) =>
                  filters.setServicePiloteIds(
                    Array.isArray(values) ? values.map(Number) : []
                  )
                }
                isSearcheable
                dataTest={dataTest && `${dataTest}.services`}
              />
            </Field>
            {thematiquesField}
          </>
        ) : (
          <>
            {thematiquesField}
            <PlanFiltersFields
              filters={filters.formFilters}
              setFilters={filters.setFormFilters}
              personneOptions={personneOptions}
              hiddenKeys={hiddenKeys}
            />
          </>
        )}
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
    </FiltersGenericButtonMenu>
  );
};
