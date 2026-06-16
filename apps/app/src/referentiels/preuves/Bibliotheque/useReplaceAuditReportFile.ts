import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase, useTRPC } from '@tet/api';
import { useIsAuditAuditeur } from '../../audits/useAudit';
import { invalidateQueries } from '../useAddPreuves';

export const useReplaceAuditReportFile = (
  collectiviteId: number,
  auditId: number | undefined
) => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const isAuditeur = useIsAuditAuditeur(auditId);
  const { setToast } = useToastContext();

  return useMutation({
    mutationFn: async ({
      preuveId,
      fichierId,
    }: {
      preuveId: number;
      fichierId: number;
    }) => {
      if (!isAuditeur) {
        setToast('error', appLabels.remplacerRapportReserveAuditeurErreur);
        return;
      }
      return supabase
        .from('preuve_audit')
        .update({ fichier_id: fichierId })
        .eq('id', preuveId);
    },

    onSuccess: () => {
      invalidateQueries(queryClient, collectiviteId, {
        invalidateParcours: false,
        trpc,
      });
      queryClient.invalidateQueries({
        queryKey: trpc.referentiels.labellisations.listPreuvesAudit.pathKey(),
      });
    },
  });
};
