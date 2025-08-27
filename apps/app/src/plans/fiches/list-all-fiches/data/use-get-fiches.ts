import { useCurrentCollectivite } from '@/api/collectivites';
import {
  GetFichesOptions,
  useListFiches,
} from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { Filters } from '../filters/types';
import { SortByOptions } from '../hooks/use-fiche-action-sorting';
import { useGetFichesTotalCount } from './use-get-fiches-total-count';

export const useGetFiches = (
  filters: Filters,
  currentPage: number,
  numberOfItemsPerPage: number,
  sort: SortByOptions,
  textSearchValue?: string
) => {
  const collectivite = useCurrentCollectivite();

  const ficheResumesOptions: GetFichesOptions = {
    filters,
    queryOptions: {
      page: currentPage,
      limit: numberOfItemsPerPage,
      sort: [
        {
          field: sort.field,
          direction: sort.direction,
        },
      ],
    },
  };

  if (textSearchValue) {
    ficheResumesOptions.filters = {
      ...ficheResumesOptions.filters,
      texteNomOuDescription: textSearchValue,
    };
  }
  const { data: ficheResumes, isLoading } = useListFiches(
    collectivite.collectiviteId,
    ficheResumesOptions
  );
  const { count: fichesCount, isLoading: isLoadingCount } =
    useGetFichesTotalCount();
  const hasFiches = fichesCount ? fichesCount > 0 : false;
  const countTotal = ficheResumes?.count || 0;

  return {
    ficheResumes,
    isLoading: isLoading || isLoadingCount,
    hasFiches,
    countTotal,
    collectivite
  };
};
