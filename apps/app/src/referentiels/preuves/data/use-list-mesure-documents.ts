import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  MesureDocuments,
  toMesureDocuments,
} from './to-mesure-documents.adapter';

type MesureDocumentsQuery =
  | { status: 'loading' }
  | { status: 'error' }
  | ({ status: 'loaded' } & MesureDocuments);

export const useListMesureDocuments = ({
  collectiviteId,
  actionId,
  withSubActions,
  disabled,
}: {
  collectiviteId: number;
  actionId: string;
  withSubActions?: boolean;
  disabled?: boolean;
}): MesureDocumentsQuery => {
  const trpc = useTRPC();

  const { data, isError } = useQuery(
    trpc.referentiels.documents.listMesureDocuments.queryOptions(
      { collectiviteId, actionId, withSubActions },
      { enabled: !disabled }
    )
  );

  if (data) {
    return { status: 'loaded', ...toMesureDocuments(data) };
  }
  if (isError) {
    return { status: 'error' };
  }
  return { status: 'loading' };
};
