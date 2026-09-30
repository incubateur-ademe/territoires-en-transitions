import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import type { ListActionsDeReferenceInput } from '@tet/domain/shared';
import type {
  ActionsDeReferenceSearch,
  UseListActionsDeReference,
} from '../actions-de-reference.contract';

const toListInput = (
  search: ActionsDeReferenceSearch
): ListActionsDeReferenceInput => ({
  searchedText: search.searchedText,
  leviers: search.leviers,
  categories: search.categories,
  sortBy: search.sortBy,
});

export const useListActionsDeReference: UseListActionsDeReference = (
  search
) => {
  const trpc = useTRPC();
  const listQuery = useQuery(
    trpc.shared.actionsDeReference.list.queryOptions(toListInput(search))
  );

  if (listQuery.data) {
    return { status: 'loaded', actions: listQuery.data };
  }
  if (listQuery.isLoadingError) {
    return {
      status: 'error',
      retry: (): void => {
        void listQuery.refetch();
      },
    };
  }
  return { status: 'loading' };
};
