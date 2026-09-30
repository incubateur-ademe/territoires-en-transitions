import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type RapportAudit =
  RouterOutput['referentiels']['documents']['listDocumentsAudit'][number];

export const useListRapportsByAudit = (
  auditId: number
): { reports: Array<RapportAudit>; isLoading: boolean } => {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.referentiels.documents.listDocumentsAudit.queryOptions({ auditId })
  );
  return { reports: data ?? [], isLoading };
};
