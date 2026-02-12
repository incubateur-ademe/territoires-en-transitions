'use client';
import { Pagination } from '@tet/ui';

import { CollectiviteEngagee } from '@tet/api';
import { JSX } from 'react';
import { RecherchesViewParam } from '../../../paths';
import FiltersColonne from '../Filters/FiltersColonne';
import {
  initialFilters,
  MAX_NUMBER_OF_CARDS_PER_PAGE,
  SetFilters,
} from '../data/filters';
import { CollectivitesHeader } from '../header/collectivites-header';
import { Grid } from './Grid';

export type CollectivitesEngageesView = {
  initialFilters: CollectiviteEngagee.Filters;
  filters: CollectiviteEngagee.Filters;
  setFilters: SetFilters;
  collectiviteId?: number;
};

export type Data =
  | CollectiviteEngagee.RecherchesCollectivite
  | CollectiviteEngagee.RecherchesReferentiel
  | CollectiviteEngagee.RecherchesPlan;

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
}: ViewProps<T>) => {
  return (
    <div data-test="ToutesLesCollectivites">
      <CollectivitesHeader
        view={view}
        initialFilters={initialFilters}
        filters={filters}
        dataCount={dataCount}
        isLoading={isLoading}
        setFilters={(newFilters) => setFilters({ ...newFilters, page: 1 })}
        collectiviteId={collectiviteId}
      />

      <div className="md:flex md:gap-6 xl:gap-12">
        <FiltersColonne
          vue={view}
          filters={filters}
          setFilters={(newFilters) => setFilters({ ...newFilters, page: 1 })}
        />

        <div className="grow flex flex-col">
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

          <Pagination
            className="mt-6 md:mt-12 mx-auto"
            selectedPage={filters.page ?? 1}
            nbOfElements={dataCount}
            maxElementsPerPage={MAX_NUMBER_OF_CARDS_PER_PAGE}
            onChange={(selected) => {
              setFilters({ ...filters, page: selected });
            }}
            idToScrollTo="app-header"
            small
          />
        </div>
      </div>
    </div>
  );
};
