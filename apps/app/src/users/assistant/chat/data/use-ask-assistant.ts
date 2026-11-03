import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/** Question à l'assistant de l'app ; l'erreur s'affiche dans le fil. */
export const useAskAssistant = () => {
  const trpc = useTRPC();
  return useMutation(
    trpc.assistant.ask.mutationOptions({ meta: { disableToast: true } })
  );
};
