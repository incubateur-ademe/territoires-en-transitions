import {CollectivitesFiltreesColonne} from 'app/pages/ToutesLesCollectivites/CollectivitesFiltreesColonne';
import {
  filtresVides,
  useFilteredCollectivites,
  useRegions,
  useUrlFiltersParams,
} from 'app/pages/ToutesLesCollectivites/hooks';
import {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {FiltresColonne} from 'app/pages/ToutesLesCollectivites/FiltresColonne';
import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {TrierParFiltre} from 'app/pages/ToutesLesCollectivites/Filtres';
import {RegionRead} from 'generated/dataLayer/region_read';
import {Link} from 'react-router-dom';

export type TRenderToutesCollectivitesProps = {
  departements: RegionRead[];
  regions: RegionRead[];
  collectivites: CollectiviteCarteRead[];
  filters: TCollectivitesFilters;
  setFilters: (filters: TCollectivitesFilters) => void;
};

export const RenderToutesLesCollectivites = (
  props: TRenderToutesCollectivitesProps
) => (
  <>
    <div className="text-center">
      <h1>Toutes les collectivités</h1>
      <p>
        Consultez l'avancement des [xxx] collectivités sur la plateforme.
        Consultez les <Link to="/statistics">statistiques</Link> d'utilisation
        de la plateforme.
      </p>
    </div>
    <div className="flex flex-row justify-between">
      <div className="w-1/5">
        <FiltresColonne
          filters={props.filters}
          setFilters={props.setFilters}
          regions={props.regions}
          departments={props.departements}
        />
      </div>
      <div className="w-4/5">
        <CollectivitesFiltreesColonne
          collectivites={props.collectivites}
          desactiverLesFiltres={() => props.setFilters(filtresVides)}
        >
          {' '}
          <TrierParFiltre
            onChange={selected =>
              props.setFilters({...props.filters, trierPar: selected})
            }
            selected={props.filters.trierPar}
          />
        </CollectivitesFiltreesColonne>
      </div>
    </div>
  </>
);

const ToutesLesCollectivites = () => {
  const {regions} = useRegions();
  const {filters, setFilters} = useUrlFiltersParams();
  const {collectivites, isLoading} = useFilteredCollectivites(filters);

  return (
    <RenderToutesLesCollectivites
      collectivites={collectivites}
      filters={filters}
      setFilters={setFilters}
      regions={regions}
      departements={regions} // TODO useDepartments()
    />
  );
};

export default ToutesLesCollectivites;
