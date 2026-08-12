import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { HistoriqueItem, ReferentielId } from '@tet/domain/referentiels';
import { ITEM_ALL } from '@tet/ui';
import { Filters } from './filters';

/** vérifie si ITEM_ALL n'est pas présent dans un filtre */
const isValidFilter = (
  values: string[] | undefined | null
): values is string[] => Array.isArray(values) && !values.includes(ITEM_ALL);

/**
 * Les dernières modifications d'une collectivité
 */
type HistoriqueItemListe = {
  items: HistoriqueItem[];
  total: number;
  isLoading?: boolean;
  isError: boolean;
};

export const useHistoriqueItemListe = ({
  filters,
  actionId,
  referentielId,
}: {
  filters: Filters;
  actionId?: string;
  referentielId?: ReferentielId;
}): HistoriqueItemListe => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();

  const { modifiedBy, types, startDate, endDate, page } = filters;

  const { data, isLoading, isError } = useQuery(
    trpc.referentiels.historique.list.queryOptions({
      collectiviteId,
      actionId,
      referentielId,
      filters: {
        modifiedBy: isValidFilter(modifiedBy) ? modifiedBy : undefined,
        types: isValidFilter(types) ? types : undefined,
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
        page: page ?? undefined,
      },
    })
  );

  return {
    ...(data ?? { items: [], total: 0 }),
    isLoading,
    isError,
  };
};
