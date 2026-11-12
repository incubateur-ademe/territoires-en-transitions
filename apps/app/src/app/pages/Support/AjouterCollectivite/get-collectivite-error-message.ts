import { appLabels } from '@/app/labels/catalog';

type ErrorWithErrorKey = { data?: { errorKey?: string } | null };

/** Code d'erreur renvoyé par l'API (`data.errorKey`), s'il y en a un. */
export const getErrorKey = (error: ErrorWithErrorKey) => error.data?.errorKey;

/**
 * Message lisible par l'opérateur : le libellé du code d'erreur renvoyé par
 * l'API, sinon un message générique — jamais le texte brut de l'erreur, qui
 * peut contenir la requête SQL.
 */
export const getCollectiviteErrorMessage = (error: ErrorWithErrorKey) => {
  const errorKey = getErrorKey(error);
  return (
    (errorKey && appLabels.erreursApi[errorKey]) ||
    appLabels.formErreurInattendue
  );
};
