import {
  DepartementFiltre,
  NiveauDeLabellisationCollectiviteFiltre,
  PopulationCollectiviteFiltre,
  ReferentielCollectiviteFiltre,
  RegionFiltre,
  TauxRemplissageCollectiviteFiltre,
  TypeCollectiviteFiltre,
} from 'app/pages/ToutesLesCollectivites/Filtres';
import type {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {RegionRead} from 'generated/dataLayer/region_read';

type UpdateFilters = (newFilters: TCollectivitesFilters) => void;

export const FiltresColonne = (props: {
  departments: RegionRead[];
  regions: RegionRead[];
  filters: TCollectivitesFilters;
  setFilters: UpdateFilters;
}) => {
  return (
    <div className="flex flex-col gap-8">
      <RegionFiltre
        onChange={selected =>
          props.setFilters({...props.filters, regions: selected})
        }
        selected={props.filters.regions}
        regions={props.regions}
      />
      <DepartementFiltre
        onChange={selected =>
          props.setFilters({...props.filters, departments: selected})
        }
        selected={props.filters.departments}
        departements={props.departments}
      />
      <TypeCollectiviteFiltre
        onChange={selected =>
          props.setFilters({...props.filters, types: selected})
        }
        selected={props.filters.types}
      />
      <PopulationCollectiviteFiltre
        onChange={selected =>
          props.setFilters({...props.filters, population: selected})
        }
        selected={props.filters.population}
      />
      <ReferentielCollectiviteFiltre
        onChange={selected =>
          props.setFilters({...props.filters, referentiel: selected})
        }
        selected={props.filters.referentiel}
      />
      <NiveauDeLabellisationCollectiviteFiltre
        onChange={selected =>
          props.setFilters({...props.filters, niveauDeLabellisation: selected})
        }
        selected={props.filters.niveauDeLabellisation}
      />
      <TauxRemplissageCollectiviteFiltre
        onChange={selected =>
          props.setFilters({...props.filters, tauxDeRemplissage: selected})
        }
        selected={props.filters.tauxDeRemplissage}
      />
    </div>
  );
};
