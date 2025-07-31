import { Pagination } from '@/ui';

import { CollectiviteEngagee } from '@/api';
import {
  RecherchesCollectivite,
  RecherchesPlan,
  RecherchesReferentiel,
} from '@/api/collectiviteEngagees';
import { Grid } from '@/app/app/pages/CollectivitesEngagees/Views/Grid';
import { NB_CARDS_PER_PAGE } from '@/app/app/pages/CollectivitesEngagees/data/utils';
import { RecherchesViewParam } from '@/app/app/paths';
import PageContainer from '@/ui/components/layout/page-container';
import FiltersColonne from '../Filters/FiltersColonne';
import { SetFilters } from '../data/filters';
import CollectivitesHeader from '../header/collectivites-header';

export type CollectivitesEngageesView = {
  initialFilters: CollectiviteEngagee.Filters;
  filters: CollectiviteEngagee.Filters;
  setFilters: SetFilters;
  setView: (newView: string) => void;
  canUserClickCard: boolean;
  isConnected: boolean;
};

export type Data =
  | RecherchesCollectivite
  | RecherchesReferentiel
  | RecherchesPlan;

type ViewProps = CollectivitesEngageesView & {
  view: RecherchesViewParam;
  data: Data[];
  dataCount: number;
  isLoading: boolean;
  renderCard: (data: Data) => JSX.Element;
};

/** Vue générique pour la page colléctivité engagée */
const View = ({
  view,
  initialFilters,
  filters,
  setFilters,
  setView,
  data,
  dataCount,
  isLoading,
  renderCard,
  isConnected,
}: ViewProps) => {
  return (
    <PageContainer dataTest="ToutesLesCollectivites" bgColor="primary">
      {/* Header */}
      <CollectivitesHeader
        view={view}
        initialFilters={initialFilters}
        filters={filters}
        dataCount={dataCount}
        isLoading={isLoading}
        setFilters={setFilters}
        setView={setView}
      />

      {/* Page */}
      <div className="md:flex md:gap-6 xl:gap-12">
        {/* Filtres */}
        <FiltersColonne vue={view} filters={filters} setFilters={setFilters} />

        {/* Données */}
        <div className="grow flex flex-col">
          {/** Grille des résultats */}
          <div className="grow">
            <Grid
              view={view}
              isLoading={isLoading}
              data={data}
              renderCard={renderCard}
              isConected={isConnected}
            />
          </div>

          {/** Pagination */}
          <Pagination
            className="mt-6 md:mt-12 mx-auto"
            selectedPage={filters.page ?? 1}
            nbOfElements={dataCount}
            maxElementsPerPage={NB_CARDS_PER_PAGE}
            onChange={(selected) => {
              setFilters({ ...filters, page: selected });
            }}
            idToScrollTo="app-header"
            small
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default View;
