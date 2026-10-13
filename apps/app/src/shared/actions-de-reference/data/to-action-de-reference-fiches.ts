import type {
  ActionDeReferenceFiche,
  ActionDeReferenceFiches,
} from '../actions-de-reference.contract';

type ListFichesQuery = {
  readonly data: readonly ActionDeReferenceFiche[] | undefined;
  readonly isLoadingError: boolean;
  readonly refetch: () => Promise<unknown>;
};

const toActionDeReferenceFiches = (
  listFichesQuery: ListFichesQuery
): ActionDeReferenceFiches => {
  if (listFichesQuery.data) {
    return { status: 'loaded', fiches: listFichesQuery.data };
  }
  if (listFichesQuery.isLoadingError) {
    return {
      status: 'error',
      retry: (): void => {
        void listFichesQuery.refetch();
      },
    };
  }
  return { status: 'loading' };
};

export { toActionDeReferenceFiches };
