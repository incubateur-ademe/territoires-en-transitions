import { useMutationToast } from '@/app/core-logic/hooks/useMutationToast';

/** Affiche les notifications déclenchées par l'enregistrement de données */
export const Toasters = () => {
  const { renderToast } = useMutationToast();
  return renderToast();
};
