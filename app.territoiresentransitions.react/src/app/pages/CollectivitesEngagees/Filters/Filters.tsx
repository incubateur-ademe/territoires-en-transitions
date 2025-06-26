import {
  Event,
  Field,
  Input,
  SelectFilter,
  getFlatOptions,
  useEventTracker,
} from '@/ui';

import { CollectiviteEngagee } from '@/api';
import { MultiSelectCheckboxes } from '@/app/app/pages/CollectivitesEngagees/Filters/MultiSelectCheckboxes';
import { SetFilters } from '@/app/app/pages/CollectivitesEngagees/data/filters';
import {
  niveauLabellisationCollectiviteOptions,
  populationCollectiviteOptions,
  referentielCollectiviteOptions,
  tauxRemplissageCollectiviteOptions,
  typeCollectiviteOptions,
} from '@/app/app/pages/CollectivitesEngagees/data/filtreOptions';
import { usePlanTypeListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanTypeListe';
import { RecherchesViewParam } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useEffect, useState } from 'react';
import { useDepartements } from '../data/useDepartements';
import { useRegions } from '../data/useRegions';

type Props = {
  vue: RecherchesViewParam;
  filters: CollectiviteEngagee.Filters;
  setFilters: SetFilters;
};

export const Filters = ({ vue, filters, setFilters }: Props) => {
  const tracker = useEventTracker();

  const { regions, isLoading: isRegionsLoading } = useRegions();
  const { departements, isLoading: isDepartementsLoading } = useDepartements();
  const { options: planTypeOptions } = usePlanTypeListe();

  const isLoading = isRegionsLoading || isDepartementsLoading;

  const [search, setSearch] = useState(filters.nom);

  // Afin de réinitialiser la recherche à la désactivation des filtres
  useEffect(() => {
    setSearch(filters.nom);
  }, [filters.nom]);

  return (
    <div className="flex flex-col gap-8">
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <SpinnerLoader />
        </div>
      ) : (
        <>
          <Input
            data-test="CollectiviteSearchInput"
            type="search"
            onChange={(e) => setSearch(e.target.value)}
            onSearch={(v) => {
              setFilters({ ...filters, nom: v });
            }}
            value={search}
            placeholder="Rechercher par nom de collectivité"
            displaySize="sm"
          />
          {vue === 'plans' && (
            /** Type plan d'action */
            (<Field title="Type de plan" small>
              <SelectFilter
                dropdownZindex={600} // nécessaire pour le menu mobile
                options={planTypeOptions ?? []}
                onChange={({ values }) => {
                  setFilters({
                    ...filters,
                    typesPlan: (values as number[]) ?? [],
                  });
                  tracker(Event.recherches.updateFiltresTypePlan, {
                    plan: getFlatOptions(planTypeOptions ?? [])
                      .filter((p) => values?.includes(p.value))
                      .map((plan) => plan.label),
                    vue,
                  });
                }}
                values={filters.typesPlan}
                small
              />
            </Field>)
          )}
          <div className="font-bold pb-4 border-b border-b-primary-3">
            Collectivité
          </div>
          {/** Région */}
          <Field title="Région" small>
            <SelectFilter
              dropdownZindex={600} // nécessaire pour le menu mobile
              options={regions.map(({ code, libelle }) => ({
                value: code,
                label: libelle,
              }))}
              onChange={({ values, selectedValue }) => {
                // Désélection
                if (!values?.includes(selectedValue)) {
                  // départements sélectionnés associés à la région désélectionnée
                  const deps = departements.filter(
                    (d) => d.region_code === selectedValue
                  );
                  // on désélectionne aussi les départements associés à cette région
                  setFilters({
                    ...filters,
                    regions: (values as string[]) ?? [],
                    departments: filters.departments.filter(
                      (d) => !deps.map((dep) => dep.code).includes(d)
                    ),
                  });
                  // Sélection
                } else {
                  // si un département est déjà sélectionné lorsqu'aucune région n'est sélectionnée
                  if (
                    filters.departments.length > 0 &&
                    filters.regions.length === 0
                  ) {
                    // si ce département n'appartient pas à la région sélectionnée, on le déselectionne
                    setFilters({
                      ...filters,
                      regions: (values as string[]) ?? [],
                      departments: filters.departments.filter(
                        (d) =>
                          departements.find((dep) => dep.code === d)
                            ?.region_code === selectedValue
                      ),
                    });
                  } else {
                    setFilters({
                      ...filters,
                      regions: (values as string[]) ?? [],
                    });
                  }
                }
              }}
              values={filters.regions}
              small
              isSearcheable
            />
          </Field>
          {/** Départements */}
          <Field title="Département" small>
            <SelectFilter
              dropdownZindex={600} // nécessaire pour le menu mobile
              options={departements
                .filter(
                  (dep) =>
                    filters.regions.length === 0 ||
                    filters.regions.includes(dep.region_code)
                )
                .map(({ code, libelle }) => ({
                  value: code,
                  label: libelle,
                }))}
              onChange={({ values }) => {
                setFilters({
                  ...filters,
                  departments: (values as string[]) ?? [],
                });
              }}
              values={filters.departments}
              small
              isSearcheable
            />
          </Field>
          {/** Type de collectivité */}
          <Field title="Type de collectivité" small>
            <SelectFilter
              dropdownZindex={600} // nécessaire pour le menu mobile
              options={typeCollectiviteOptions}
              onChange={({ values }) => {
                setFilters({
                  ...filters,
                  typesCollectivite: (values as string[]) ?? [],
                });
              }}
              values={filters.typesCollectivite}
              small
            />
          </Field>
          {/** Population */}
          <Field title="Population" small>
            <SelectFilter
              dropdownZindex={600} // nécessaire pour le menu mobile
              options={populationCollectiviteOptions}
              onChange={({ values }) => {
                setFilters({
                  ...filters,
                  population: (values as string[]) ?? [],
                });
              }}
              values={filters.population}
              small
            />
          </Field>
          {vue === 'referentiels' && (
            <>
              <MultiSelectCheckboxes
                htmlId="ref"
                title="Référentiel"
                options={referentielCollectiviteOptions}
                onChange={(selected) => {
                  setFilters({ ...filters, referentiel: selected });
                }}
                selected={filters.referentiel}
              />
              <MultiSelectCheckboxes
                htmlId="nx"
                title="Niveau de labellisation"
                options={niveauLabellisationCollectiviteOptions}
                onChange={(selected) => {
                  setFilters({ ...filters, niveauDeLabellisation: selected });
                  tracker(Event.recherches.updateFiltresLabellisation, {
                    labellisation: selected,
                  });
                }}
                selected={filters.niveauDeLabellisation}
              />
              {/** Taux de remplissage */}
              <Field title="Taux de remplissage" small>
                <SelectFilter
                  dropdownZindex={600} // nécessaire pour le menu mobile
                  options={tauxRemplissageCollectiviteOptions}
                  onChange={({ values }) => {
                    setFilters({
                      ...filters,
                      tauxDeRemplissage: (values as string[]) ?? [],
                    });
                  }}
                  values={filters.tauxDeRemplissage}
                  small
                />
              </Field>
            </>
          )}
        </>
      )}
    </div>
  );
};
