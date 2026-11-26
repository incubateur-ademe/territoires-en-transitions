import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/** Les réponses aux précisions demandées : l'import reprend avec les choix faits. */
export const useAnswerAiImportQuestion = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.plans.aiImport.answerAiImportQuestion.mutationOptions({
      meta: { success: appLabels.importPlanIaQuestionReponseEnregistree },
      // Statut du job, import en cours de la collectivité, badges et page du plan.
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: trpc.plans.pathKey() }),
    })
  );
};
