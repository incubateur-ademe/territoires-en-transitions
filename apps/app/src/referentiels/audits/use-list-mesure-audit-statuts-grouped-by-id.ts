import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ActionId, ReferentielId } from '@tet/domain/referentiels';
import { keyBy } from 'es-toolkit';

export type MesureAuditStatutRow =
  RouterOutput['referentiels']['labellisations']['listMesureAuditStatuts'][number];

export const useListMesureAuditStatutsGroupedById = ({
  referentielId,
  enabled,
}: {
  referentielId: ReferentielId;
  enabled: boolean;
}): {
  auditStatutsByMesureId: Partial<Record<ActionId, MesureAuditStatutRow>>;
  isLoading: boolean;
} => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.referentiels.labellisations.listMesureAuditStatuts.queryOptions(
      { collectiviteId, referentielId },
      { enabled }
    )
  );

  const auditStatutsByMesureId = keyBy(data ?? [], (row) => row.mesureId);

  return { auditStatutsByMesureId, isLoading };
};
