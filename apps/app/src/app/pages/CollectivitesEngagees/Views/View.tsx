'use client';
import { Pagination } from '@/ui';

import { CollectiviteEngagee } from '@/api';
import {
  RecherchesCollectivite,
  RecherchesPlan,
  RecherchesReferentiel,
} from '@/api/collectiviteEngagees';
import { Grid } from '@/app/app/pages/CollectivitesEngagees/Views/Grid';
import { RecherchesViewParam } from '@/app/app/paths';
import PageContainer from '@/ui/components/layout/page-container';
import FiltersColonne from '../Filters/FiltersColonne';
import { initialFilters, SetFilters } from '../data/filters';
import { useGetCardNumber } from '../data/utils';
import { CollectivitesHeader } from '../header/collectivites-header';

export type CollectivitesEngageesView = {
  initialFilters: CollectiviteEngagee.Filters;
  filters: CollectiviteEngagee.Filters;
  setFilters: SetFilters;
  setView: (newView: string) => void;
  collectiviteId?: number;
};

export type Data =
  | RecherchesCollectivite
  | RecherchesReferentiel
  | RecherchesPlan;

type ViewProps<T extends Data> = {
  view: RecherchesViewParam;
  collectiviteId?: number;
  data: T[];
  dataCount: number;
  isLoading: boolean;
  renderCard: ({
    data,
    isClickable,
  }: {
    data: T;
    isClickable: boolean;
  }) => JSX.Element;
  filters: CollectiviteEngagee.Filters;
  setFilters: SetFilters;
  setView: (newView: string) => void;
};

export const View = <T extends Data>({
  view,
  renderCard,
  collectiviteId,
  data,
  dataCount,
  isLoading,
  filters,
  setFilters,
  setView,
}: ViewProps<T>) => {
  const cardNumberToDisplay = useGetCardNumber();
  return (
    <PageContainer dataTest="ToutesLesCollectivites" bgColor="primary">
      <CollectivitesHeader
        view={view}
        initialFilters={initialFilters}
        filters={filters}
        dataCount={dataCount}
        isLoading={isLoading}
        setFilters={setFilters}
        setView={setView}
        collectiviteId={collectiviteId}
      />

      <div className="md:flex md:gap-6 xl:gap-12">
        <FiltersColonne vue={view} filters={filters} setFilters={setFilters} />

        <div className="grow flex flex-col">
          <div className="grow">
            <Grid
              view={view}
              isLoading={isLoading}
              data={data}
              renderCard={(data) =>
                renderCard({
                  data,
                  isClickable: collectiviteId !== undefined,
                })
              }
            />
          </div>

          <Pagination
            className="mt-6 md:mt-12 mx-auto"
            selectedPage={filters.page ?? 1}
            nbOfElements={dataCount}
            maxElementsPerPage={cardNumberToDisplay}
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
