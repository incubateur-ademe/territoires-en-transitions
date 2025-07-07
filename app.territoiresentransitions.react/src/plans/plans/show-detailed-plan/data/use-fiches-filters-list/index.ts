import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { FicheResume } from '@/domain/plans/fiches';
import * as formatter from './filter-formatters';
import { Filters, RawFilters } from './types';

type Args = {
  /** URL à matcher pour récupérer les paramètres */
  url: string;
  initialFilters: {
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
  initialFilters,
}: Args): {
  items: FicheResume[];
  total: number;
  filters: Filters;
  filtersCount: number;
  setFilters: (filters: Filters) => void;
} => {
  const collectiviteId = useCollectiviteId();

  const [rawFilters, setFilters, filtersCount] = useSearchParams<RawFilters>(
    url,
    initialFilters,
    nameToShortNames
  );

  const { data } = trpc.plans.fiches.listResumes.useQuery({
    collectiviteId,
    filters: formatter.toQueryPayload(rawFilters),
  });

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
