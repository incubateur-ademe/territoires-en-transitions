import {
  DepartementFiltre,
  NiveauDeLabellisationCollectiviteFiltre,
  PopulationCollectiviteFiltre,
  ReferentielCollectiviteFiltre,
  RegionFiltre,
  TauxRemplissageCollectiviteFiltre,
  TypeCollectiviteFiltre,
} from 'app/pages/ToutesLesCollectivites/components/Filtres';
import type {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {InputSearch} from 'ui/UiSearchBar';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {TDepartement} from '../useDepartements';
import {TRegion} from '../useRegions';

type UpdateFilters = (newFilters: TCollectivitesFilters) => void;

export const FiltresColonne = (props: {
  departments: TDepartement[];
  regions: TRegion[];
  filters: TCollectivitesFilters;
  setFilters: UpdateFilters;
}) => {
  const tracker = useFonctionTracker();

  return (
    <div className="flex flex-col gap-8">
      <InputSearch
        value={props.filters.nom || ''}
        placeholder="Rechercher par nom"
        onChange={e => {
          props.setFilters({...props.filters, nom: e.target.value});
          tracker({fonction: 'recherche', action: 'saisie'});
        }}
      />
      <RegionFiltre
        onChange={selected => {
          props.setFilters({...props.filters, regions: selected});
          tracker({fonction: 'filtre_region', action: 'selection'});
        }}
        selected={props.filters.regions}
        regions={props.regions}
      />
      <DepartementFiltre
        onChange={selected => {
          props.setFilters({...props.filters, departments: selected});
          tracker({fonction: 'filtre_departement', action: 'selection'});
        }}
        selected={props.filters.departments}
        departements={props.departments}
        regionCodes={props.filters.regions}
      />
      <TypeCollectiviteFiltre
        onChange={selected => {
          props.setFilters({...props.filters, types: selected});
          tracker({fonction: 'filtre_type', action: 'selection'});
        }}
        selected={props.filters.types}
      />
      <PopulationCollectiviteFiltre
        onChange={selected => {
          props.setFilters({...props.filters, population: selected});
          tracker({fonction: 'filtre_population', action: 'selection'});
        }}
        selected={props.filters.population}
      />
      <ReferentielCollectiviteFiltre
        onChange={selected => {
          props.setFilters({...props.filters, referentiel: selected});
          tracker({fonction: 'filtre_referentiel', action: 'selection'});
        }}
        selected={props.filters.referentiel}
      />
      <NiveauDeLabellisationCollectiviteFiltre
        onChange={selected => {
          props.setFilters({...props.filters, niveauDeLabellisation: selected});
          tracker({fonction: 'filtre_niveau', action: 'selection'});
        }}
        selected={props.filters.niveauDeLabellisation}
      />
      <TauxRemplissageCollectiviteFiltre
        onChange={selected => {
          props.setFilters({...props.filters, tauxDeRemplissage: selected});
          tracker({fonction: 'filtre_remplissage', action: 'selection'});
        }}
        selected={props.filters.tauxDeRemplissage}
      />
    </div>
  );
};
