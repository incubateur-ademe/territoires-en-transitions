import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

type MesureDocuments =
  RouterOutput['referentiels']['documents']['listMesureDocuments'];

type MesureDocumentsQuery =
  | { status: 'loading' }
  | { status: 'error' }
  | ({ status: 'loaded' } & MesureDocuments);

export const useListMesureDocuments = ({
  collectiviteId,
  actionId,
  withSubActions,
}: {
  collectiviteId: number;
  actionId: string;
  withSubActions?: boolean;
}): MesureDocumentsQuery => {
  const trpc = useTRPC();

  const { data, isError } = useQuery(
    trpc.referentiels.documents.listMesureDocuments.queryOptions({
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
