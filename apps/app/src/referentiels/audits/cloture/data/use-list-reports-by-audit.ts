import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type AuditReport =
  RouterOutput['referentiels']['labellisations']['listPreuvesAudit'][number];

export const useListReportsByAudit = (
  auditId: number
): { reports: Array<AuditReport>; isLoading: boolean } => {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.referentiels.labellisations.listPreuvesAudit.queryOptions({ auditId })
  );
  return { reports: data ?? [], isLoading };
};
