import {Field, Select} from '@tet/ui';

import {UiSearchBar} from 'ui/UiSearchBar';
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

// /** TODO: Ne plus avoir à utiliser cet utilitaire pour gérer les values d'un select */
const onSelectMultiple = (optionValue: any, values: any[] | undefined) => {
  // si au moins une valeur est présente dans les valeurs du sélecteur
  if (values) {
    if (values.includes(optionValue)) {
      // retrait d'une valeur
      return values.length === 1
        ? // renvoie undefined si la seule valeur présente dans les valeurs du sélecteur est la même que la valeur de l'option
          undefined
        : values.filter(v => v !== optionValue);
    } else {
      // ajoût d'une valeur
      return [...values, optionValue];
    }
    // si aucune valeur n'était déjà sélectionnée alors on renvoie directement la veleur de l'option dans un tableau
  } else {
    return [optionValue];
  }
};

type Props = {
  filters: Tfilters;
  setFilters: TSetFilters;
};

export const Filters = ({filters, setFilters}: Props) => {
  const tracker = useFonctionTracker();
  const {regions} = useRegions();
  const {departements} = useDepartements();
  const {options: planTypeOptions} = usePlanTypeListe();

  const vue = filters.vue[0];

  return (
    <div className="flex flex-col gap-8">
      <UiSearchBar
        dataTest="CollectiviteSearchInput"
        value={filters.nom || ''}
        placeholder="Rechercher par nom de collectivité"
        search={v => {
          setFilters({...filters, nom: v});
          tracker({fonction: 'recherche', action: 'saisie'});
        }}
        debouncePeriod={500}
      />
      {vue === 'plan' && (
        /** Type plan d'action */
        <Field title="Type de plan" small>
          <Select
            options={planTypeOptions ?? []}
            onChange={selected => {
              setFilters({
                ...filters,
                typesPlan: onSelectMultiple(selected, filters.typesPlan) || [],
              });
            }}
            values={filters.typesPlan?.length ? filters.typesPlan : undefined}
            multiple
            small
          />
        </Field>
      )}
      <div className="font-bold pb-4 border-b border-b-primary-3">
        Collectivité
      </div>
      {/** Région */}
      <Field title="Région" small>
        <Select
          options={regions.map(({code, libelle}) => ({
            value: code,
            label: libelle,
          }))}
          onChange={selected => {
            setFilters({
              ...filters,
              regions:
                (onSelectMultiple(selected, filters.regions) as string[]) || [],
            });
            tracker({fonction: 'filtre_region', action: 'selection'});
          }}
          values={filters.regions?.length ? filters.regions : undefined}
          multiple
          small
          isSearcheable
        />
      </Field>
      {/** Départements */}
      <Field title="Département" small>
        <Select
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
          onChange={selected => {
            setFilters({
              ...filters,
              departments:
                (onSelectMultiple(selected, filters.departments) as string[]) ||
                [],
            });
            tracker({fonction: 'filtre_departement', action: 'selection'});
          }}
          values={filters.departments?.length ? filters.departments : undefined}
          multiple
          small
          isSearcheable
        />
      </Field>
      {/** Type de collectivité */}
      <Field title="Type de collectivité" small>
        <Select
          options={typeCollectiviteOptions}
          onChange={selected => {
            setFilters({
              ...filters,
              typesCollectivite:
                onSelectMultiple(selected, filters.typesCollectivite) || [],
            });
            tracker({fonction: 'filtre_type', action: 'selection'});
          }}
          values={
            filters.typesCollectivite?.length
              ? filters.typesCollectivite
              : undefined
          }
          multiple
          small
        />
      </Field>
      {/** Population */}
      <Field title="Population" small>
        <Select
          options={populationCollectiviteOptions}
          onChange={selected => {
            setFilters({
              ...filters,
              population: onSelectMultiple(selected, filters.population) || [],
            });
            tracker({fonction: 'filtre_population', action: 'selection'});
          }}
          values={filters.population?.length ? filters.population : undefined}
          multiple
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
              tracker({fonction: 'filtre_referentiel', action: 'selection'});
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
          <MultiSelectCheckboxes
            htmlId="tx"
            title="Taux de remplissage"
            options={tauxRemplissageCollectiviteOptions}
            onChange={selected => {
              setFilters({...filters, tauxDeRemplissage: selected});
              tracker({fonction: 'filtre_remplissage', action: 'selection'});
            }}
            selected={filters.tauxDeRemplissage}
          />
        </>
      )}
    </div>
  );
};
