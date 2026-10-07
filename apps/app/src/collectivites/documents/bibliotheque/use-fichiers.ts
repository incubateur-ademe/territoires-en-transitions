import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RouterOutput, TRPCUseQueryResult, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

const BIBLIOTHEQUE_DISPLAY_LIMIT = 5;

export type BibliothequeDocuments =
  RouterOutput['collectivites']['documents']['listBibliothequeDocuments'];
export type BibliothequeFichierListItem =
  BibliothequeDocuments['items'][number];

export const useFichiers = (
  search: string
): TRPCUseQueryResult<BibliothequeDocuments> => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.documents.listBibliothequeDocuments.queryOptions(
      { collectiviteId, search, limit: BIBLIOTHEQUE_DISPLAY_LIMIT },
      { placeholderData: keepPreviousData }
    )
  );
};
