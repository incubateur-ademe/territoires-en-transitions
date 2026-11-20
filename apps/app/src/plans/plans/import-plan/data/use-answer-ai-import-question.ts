import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/** La réponse à la précision demandée : l'import reprend avec le niveau choisi. */
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
