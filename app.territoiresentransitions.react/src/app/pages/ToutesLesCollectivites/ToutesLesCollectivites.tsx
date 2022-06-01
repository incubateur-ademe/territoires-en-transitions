import {CollectivitesFiltreesColonne} from 'app/pages/ToutesLesCollectivites/CollectivitesFiltreesColonne';
import {
  filtresVides,
  useDepartements,
  useFilteredCollectivites,
  useRegions,
  useFiltersParams,
} from 'app/pages/ToutesLesCollectivites/hooks';
import {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {FiltresColonne} from 'app/pages/ToutesLesCollectivites/FiltresColonne';
import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {TrierParFiltre} from 'app/pages/ToutesLesCollectivites/Filtres';
import {RegionRead} from 'generated/dataLayer/region_read';
import {Link} from 'react-router-dom';
import {DepartementRead} from 'generated/dataLayer/departement_read';

export type TRenderToutesCollectivitesProps = {
  regions: RegionRead[];
  departements: DepartementRead[];
  collectivites: CollectiviteCarteRead[];
  filters: TCollectivitesFilters;
  setFilters: (filters: TCollectivitesFilters) => void;
  isLoading?: boolean;
};

export const RenderToutesLesCollectivites = (
  props: TRenderToutesCollectivitesProps
) => (
  <div data-test="ToutesLesCollectivites" className="app fr-container mt-5">
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
        {props.isLoading ? (
          <tr>
            <td className="text-center text-gray-500">
              Chargement en cours...
            </td>
          </tr>
        ) : (
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
        )}
      </div>
    </div>
  </div>
);

const ToutesLesCollectivites = () => {
  const {regions} = useRegions();
  const {departements} = useDepartements();

  const {filters, setFilters} = useFiltersParams();
  const {collectivites, isLoading} = useFilteredCollectivites(filters);

  return (
    <RenderToutesLesCollectivites
      collectivites={collectivites}
      filters={filters}
      setFilters={setFilters}
      regions={regions}
      departements={departements}
      isLoading={isLoading}
    />
  );
};

export default ToutesLesCollectivites;
