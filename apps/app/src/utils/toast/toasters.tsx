import { useMutationToast } from '@/app/utils/toast/use-mutation-toast';

/** Affiche les notifications déclenchées par l'enregistrement de données */
export const Toasters = () => {
  const { renderToast } = useMutationToast();
  return renderToast();
};
