import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/** Reprise par l'équipe d'un import en échec, depuis sa dernière étape terminée. */
export const useResumeAiImport = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.plans.aiImport.resumeAiImport.mutationOptions({
      meta: { success: appLabels.importPlanIaRepriseLancee },
      // Réussie ou non, la reprise change le job et son plan : statut,
      // badge de la liste, page du plan, bouton de reprise.
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: trpc.plans.pathKey() }),
    })
  );
};
