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
import {Pagination} from 'app/pages/ToutesLesCollectivites/Pagination';
import {NB_CARDS_PER_PAGE} from 'app/pages/ToutesLesCollectivites/queries';
import {getNumberOfActiveFilters} from 'app/pages/ToutesLesCollectivites/getNumberOfActiveFilters';
import {useState} from 'react';

export type TRenderToutesCollectivitesProps = {
  regions: RegionRead[];
  departements: DepartementRead[];
  collectivites: CollectiviteCarteRead[];
  collectivitesCount: number;
  filters: TCollectivitesFilters;
  setFilters: (filters: TCollectivitesFilters) => void;
  isLoading?: boolean;
};

export const RenderToutesLesCollectivites = (
  props: TRenderToutesCollectivitesProps
) => {
  const [mobileClickedFilters, setMobileClickedFilters] = useState(false);
  return (
    <div data-test="ToutesLesCollectivites" className="app fr-container mt-5">
      <div className="text-center">
        <div className="font-bold text-black md:text-4xl text-3xl my-4 ">
          Toutes les collectivités
        </div>
        <p>
          Consultez les <Link to="/statistics">statistiques</Link> d'utilisation
          de la plateforme.
        </p>
      </div>
      <div className="md:flex">
        <div className={`md:w-3/12 ${mobileClickedFilters ? '' : 'hidden'}`}>
          <FiltresColonne
            filters={props.filters}
            setFilters={props.setFilters}
            regions={props.regions}
            departments={props.departements}
          />
        </div>
        <div className={`ml-6 w-full ${mobileClickedFilters ? 'hidden' : ''}`}>
          {props.isLoading ? (
            <div className="text-center text-gray-500">
              Chargement en cours...
            </div>
          ) : (
            <CollectivitesFiltreesColonne
              collectivites={props.collectivites}
              collectivitesCount={props.collectivitesCount}
              desactiverLesFiltres={() => props.setFilters(filtresVides)}
              filters={props.filters}
            >
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
      <MobileFilterButton
        numberOfActiveFilters={getNumberOfActiveFilters(props.filters)}
        mobileClickedFilters={mobileClickedFilters}
        setMobileClickedFilters={setMobileClickedFilters}
      />
      <div className="flex justify-center mt-3">
        <Pagination
          nbOfPages={Math.ceil(props.collectivitesCount / NB_CARDS_PER_PAGE)}
          selectedPage={props.filters.page ?? 1}
          onChange={selected =>
            props.setFilters({...props.filters, page: selected})
          }
        />
      </div>
    </div>
  );
};

const MobileFilterButton = (props: {
  numberOfActiveFilters: number;
  mobileClickedFilters: boolean;
  setMobileClickedFilters: (value: boolean) => void;
}) => {
  return (
    <div className="md:hidden w-full my-4">
      <button
        className={`fr-btn text-center ${
          props.numberOfActiveFilters > 0
            ? 'fr-fi-filter-fill'
            : 'fr-fi-filter-line'
        } fr-fi--sm min-w-full text-center`}
        onClick={() => {
          props.setMobileClickedFilters(!props.mobileClickedFilters);
        }}
      >
        {props.numberOfActiveFilters > 0
          ? `Filtrer (${props.numberOfActiveFilters})`
          : 'Filtrer'}
      </button>
    </div>
  );
};

const ToutesLesCollectivites = () => {
  const {regions} = useRegions();
  const {departements} = useDepartements();

  const {filters, setFilters} = useFiltersParams();
  const {collectivites, collectivitesCount, isLoading} =
    useFilteredCollectivites(filters);

  return (
    <RenderToutesLesCollectivites
      collectivites={collectivites}
      collectivitesCount={collectivitesCount}
      filters={filters}
      setFilters={setFilters}
      regions={regions}
      departements={departements}
      isLoading={isLoading}
    />
  );
};

export default ToutesLesCollectivites;
