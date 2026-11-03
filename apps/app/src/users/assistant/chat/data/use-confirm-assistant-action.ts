import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/** Confirme une écriture préparée par l'assistant (ajout d'un segment Crisp). */
export const useConfirmAssistantAction = () => {
  const trpc = useTRPC();
  return useMutation(
    trpc.assistant.confirmAction.mutationOptions({
      meta: { disableToast: true },
    })
  );
};
