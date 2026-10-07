import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

type MesureDocuments =
  RouterOutput['referentiels']['documents']['listDocumentsMesure'];

export type MesureDocumentsState =
  | { status: 'loading' }
  | { status: 'error' }
  | ({ status: 'loaded' } & MesureDocuments);

export const useListDocumentsMesure = ({
  collectiviteId,
  actionId,
  withSubActions,
}: {
  collectiviteId: number;
  actionId: string;
  withSubActions?: boolean;
}): MesureDocumentsState => {
  const trpc = useTRPC();

  const { data, isError } = useQuery(
    trpc.referentiels.documents.listDocumentsMesure.queryOptions({
      collectiviteId,
      actionId,
      withSubActions,
    })
  );

  if (data) {
    return { status: 'loaded', ...data };
  }
  if (isError) {
    return { status: 'error' };
  }
  return { status: 'loading' };
};
