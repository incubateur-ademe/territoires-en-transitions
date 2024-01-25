import {Field, SelectMultiple, Input} from '@tet/ui';

import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {useDepartements} from '../data/useDepartements';
import {useRegions} from '../data/useRegions';
import {Tfilters, TSetFilters} from '../data/filters';
import {
  niveauLabellisationCollectiviteOptions,
  populationCollectiviteOptions,
  referentielCollectiviteOptions,
  tauxRemplissageCollectiviteOptions,
  typeCollectiviteOptions,
} from 'app/pages/CollectivitesEngagees/data/filtreOptions';
import {usePlanTypeListe} from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlanTypeListe';
import {MultiSelectCheckboxes} from 'app/pages/CollectivitesEngagees/Filters/MultiSelectCheckboxes';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import {useState} from 'react';

type Props = {
  filters: Tfilters;
  setFilters: TSetFilters;
};

export const Filters = ({filters, setFilters}: Props) => {
  const tracker = useFonctionTracker();
  const {regions, isLoading: isRegionsLoading} = useRegions();
  const {departements, isLoading: isDepartementsLoading} = useDepartements();
  const {options: planTypeOptions} = usePlanTypeListe();

  const vue = filters.vue[0];

  const isLoading = isRegionsLoading || isDepartementsLoading;

  const [search, setSearch] = useState('');

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
            onChange={e => setSearch(e.target.value)}
            onSearch={v => {
              setFilters({...filters, nom: v});
              tracker({fonction: 'recherche', action: 'saisie'});
            }}
            value={search}
            placeholder="Rechercher par nom de collectivité"
            displaySize="sm"
          />
          {vue === 'plan' && (
            /** Type plan d'action */
            <Field title="Type de plan" small>
              <SelectMultiple
                options={planTypeOptions ?? []}
                onChange={({values}) => {
                  setFilters({
                    ...filters,
                    typesPlan: values ?? [],
                  });
                }}
                values={
                  filters.typesPlan?.length ? filters.typesPlan : undefined
                }
                small
              />
            </Field>
          )}
          <div className="font-bold pb-4 border-b border-b-primary-3">
            Collectivité
          </div>
          {/** Région */}
          <Field title="Région" small>
            <SelectMultiple
              options={regions.map(({code, libelle}) => ({
                value: code,
                label: libelle,
              }))}
              onChange={({values}) => {
                setFilters({
                  ...filters,
                  regions: values ?? [],
                });
                tracker({fonction: 'filtre_region', action: 'selection'});
              }}
              values={filters.regions?.length ? filters.regions : undefined}
              small
              isSearcheable
            />
          </Field>
          {/** Départements */}
          <Field title="Département" small>
            <SelectMultiple
              options={departements
                .filter(
                  dep =>
                    filters.regions.length === 0 ||
                    filters.regions.includes(dep.region_code)
                )
                .map(({code, libelle}) => ({
                  value: code,
                  label: libelle,
                }))}
              onChange={({values}) => {
                setFilters({
                  ...filters,
                  departments: values ?? [],
                });
                tracker({fonction: 'filtre_departement', action: 'selection'});
              }}
              values={
                filters.departments?.length ? filters.departments : undefined
              }
              small
              isSearcheable
            />
          </Field>
          {/** Type de collectivité */}
          <Field title="Type de collectivité" small>
            <SelectMultiple
              options={typeCollectiviteOptions}
              onChange={({values}) => {
                setFilters({
                  ...filters,
                  typesCollectivite: values ?? [],
                });
                tracker({fonction: 'filtre_type', action: 'selection'});
              }}
              values={
                filters.typesCollectivite?.length
                  ? filters.typesCollectivite
                  : undefined
              }
              small
            />
          </Field>
          {/** Population */}
          <Field title="Population" small>
            <SelectMultiple
              options={populationCollectiviteOptions}
              onChange={({values}) => {
                setFilters({
                  ...filters,
                  population: values ?? [],
                });
                tracker({fonction: 'filtre_population', action: 'selection'});
              }}
              values={
                filters.population?.length ? filters.population : undefined
              }
              small
            />
          </Field>
          {vue === 'collectivite' && (
            <>
              <MultiSelectCheckboxes
                htmlId="ref"
                title="Référentiel"
                options={referentielCollectiviteOptions}
                onChange={selected => {
                  setFilters({...filters, referentiel: selected});
                  tracker({
                    fonction: 'filtre_referentiel',
                    action: 'selection',
                  });
                }}
                selected={filters.referentiel}
              />
              <MultiSelectCheckboxes
                htmlId="nx"
                title="Niveau de labellisation"
                options={niveauLabellisationCollectiviteOptions}
                onChange={selected => {
                  setFilters({...filters, niveauDeLabellisation: selected});
                  tracker({fonction: 'filtre_niveau', action: 'selection'});
                }}
                selected={filters.niveauDeLabellisation}
              />
              {/** Taux de remplissage */}
              <Field title="Taux de remplissage" small>
                <SelectMultiple
                  options={tauxRemplissageCollectiviteOptions}
                  onChange={({values}) => {
                    setFilters({
                      ...filters,
                      tauxDeRemplissage: values ?? [],
                    });
                    tracker({
                      fonction: 'filtre_remplissage',
                      action: 'selection',
                    });
                  }}
                  values={
                    filters.tauxDeRemplissage?.length
                      ? filters.tauxDeRemplissage
                      : undefined
                  }
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
