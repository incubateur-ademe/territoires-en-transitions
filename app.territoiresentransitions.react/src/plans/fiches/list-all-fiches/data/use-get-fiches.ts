import { useCurrentCollectivite } from '@/api/collectivites';
import {
  GetFichesOptions,
  useListFicheResumes,
} from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-list-fiche-resumes';
import { useFicheActionCount } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useFicheActionCount';
import { Filters } from '../filters/types';
import { SortByOptions } from '../hooks/use-fiche-action-sorting';

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
  const { data: ficheResumes, isLoading } = useListFicheResumes(
    collectivite.collectiviteId,
    ficheResumesOptions
  );
  const { count: fichesCount } = useFicheActionCount();
  const hasFiches = fichesCount > 0;
  const countTotal = ficheResumes?.count || 0;

  return {
    ficheResumes,
    isLoading,
    hasFiches,
    countTotal,
    collectivite,
  };
};
