import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { FicheResume } from '@/domain/plans/fiches';
import { useQuery } from '@tanstack/react-query';
import * as formatter from './filter-formatters';
import { Filters, RawFilters } from './types';

type Args = {
  /** URL à matcher pour récupérer les paramètres */
  url: string;
  parameters: {
    collectivite_id: number;
    axes: number[];
  };
};

const nameToShortNames = {
  axes: 'axes',
  sans_plan: 'nc', // fiches non classées
  pilotes: 'pilotes',
  sans_pilote: 'sp',
  referents: 'ref',
  sans_referent: 'sr',
  statuts: 's',
  sans_statut: 'ss',
  sans_niveau: 'snp',
  priorites: 'prio',
  echeance: 'e',
  page: 'p',
};

/**
 * Liste de fiches actions au sein d'un axe
 */
export const useFichesActionFiltresListe = ({
  url,
  parameters,
}: Args): {
  items: FicheResume[];
  total: number;
  filters: Filters;
  filtersCount: number;
  setFilters: (filters: Filters) => void;
} => {
  const collectiviteId = useCollectiviteId();
  const trpcClient = useTRPC();
  const [rawFilters, setFilters, filtersCount] = useSearchParams<RawFilters>(
    url,
    parameters,
    nameToShortNames
  );
  const { data } = useQuery(
    trpcClient.plans.fiches.listResumes.queryOptions({
      collectiviteId,
      axesId: parameters.axes,
      filters: formatter.toQueryPayload(rawFilters),
    })
  );
  return {
    ...(data
      ? { items: data.data, total: data.count }
      : { items: [], total: 0 }),
    filters: formatter.fromSearchParameterFormat(rawFilters),
    setFilters: (filters) =>
      setFilters(formatter.toSearchParameterFormat(filters)),
    filtersCount,
  };
};
