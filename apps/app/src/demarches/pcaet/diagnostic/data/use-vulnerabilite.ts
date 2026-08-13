'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';

type Diagnostic = RouterOutput['demarches']['pcaet']['diagnostic']['get'];

type SetLigneInput = Omit<
  RouterInput['demarches']['pcaet']['diagnostic']['setVulnerabiliteLigne'],
  'collectiviteId' | 'demarcheId'
>;

/** Motif d'échec d'un ajout de domaine, tel que la modale doit le formuler. */
export type AddDomaineFailure = 'DOMAINE_DEJA_EXISTANT' | 'AUTRE';

/**
 * Clé métier de l'erreur, posée par le formateur d'erreurs tRPC à partir de la
 * cause. Le code HTTP ne suffit pas : `CONFLICT` couvre aussi bien le doublon
 * que le dossier devenu non modifiable.
 */
const errorKeyOf = (error: unknown): string | undefined => {
  const data = (error as { data?: { errorKey?: unknown } } | undefined)?.data;
  return typeof data?.errorKey === 'string' ? data.errorKey : undefined;
};

/**
 * Écritures du volet vulnérabilité. Toutes renvoient le diagnostic complet :
 * la réponse remplace le cache, et la démarche est invalidée pour que
 * `availableTransitions` suive la complétude qui vient de changer.
 *
 * Aucune n'est en `disableToast` : ce drapeau couvre aussi la branche d'erreur
 * du subscriber, et une saisie refusée revenait alors à son état antérieur sans
 * un mot — l'utilisateur ne pouvait qu'y voir un bug d'affichage.
 */
export const useDemarchePcaetVulnerabilite = (demarcheId: number) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryKey = trpc.demarches.pcaet.diagnostic.get.queryKey({
    collectiviteId,
    demarcheId,
  });

  const onSuccess = useCallback(
    async (diagnostic: Diagnostic) => {
      queryClient.setQueryData(queryKey, diagnostic);
      await queryClient.invalidateQueries({
        queryKey: trpc.demarches.pcaet.get.queryKey({
          collectiviteId,
          demarcheId,
        }),
      });
    },
    [queryClient, queryKey, trpc, collectiviteId, demarcheId]
  );

  // La saisie d'une cellule est fréquente : son succès n'a pas besoin d'un
  // toast, seul l'échec doit se voir.
  // Toutes les écritures partagent une file : leurs réponses remplacent le
  // cache entier, et deux saisies rapprochées dont les réponses se croisent
  // laisseraient la plus ancienne à l'écran.
  const scope = { id: `demarche-pcaet-vulnerabilite-${demarcheId}` };

  const { mutate: setLigneMutate } = useMutation(
    trpc.demarches.pcaet.diagnostic.setVulnerabiliteLigne.mutationOptions({
      scope,
      meta: { error: appLabels.mutationError },
      onSuccess,
      onError: () => queryClient.invalidateQueries({ queryKey }),
    })
  );

  // `mutateAsync` : la modale d'ajout ne se ferme qu'au succès, pour que le
  // libellé refusé reste corrigeable sans ressaisie.
  const { mutateAsync: addDomaineMutate } = useMutation(
    trpc.demarches.pcaet.diagnostic.addVulnerabiliteDomaine.mutationOptions({
      scope,
      // L'échec est rendu dans la modale, au plus près du champ fautif.
      meta: { disableToast: true },
      onSuccess,
    })
  );

  const { mutate: updateDomaineMutate } = useMutation(
    trpc.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine.mutationOptions({
      scope,
      meta: { error: appLabels.mutationError },
      onSuccess,
      onError: () => queryClient.invalidateQueries({ queryKey }),
    })
  );

  const { mutate: removeDomaineMutate } = useMutation(
    trpc.demarches.pcaet.diagnostic.removeVulnerabiliteDomaine.mutationOptions({
      scope,
      meta: {
        success: appLabels.demarcheVulnerabiliteDomaineSupprime,
        error: appLabels.mutationError,
      },
      onSuccess,
    })
  );

  return {
    setLigne: useCallback(
      (input: SetLigneInput) =>
        setLigneMutate({ collectiviteId, demarcheId, ...input }),
      [setLigneMutate, collectiviteId, demarcheId]
    ),
    addDomaine: useCallback(
      async (label: string): Promise<AddDomaineFailure | null> => {
        try {
          await addDomaineMutate({ collectiviteId, demarcheId, label });
          return null;
        } catch (error) {
          // Sans distinguer le motif, une coupure réseau s'annonçait comme un
          // doublon de libellé.
          return errorKeyOf(error) === 'DOMAINE_DEJA_EXISTANT'
            ? 'DOMAINE_DEJA_EXISTANT'
            : 'AUTRE';
        }
      },
      [addDomaineMutate, collectiviteId, demarcheId]
    ),
    updateDomaine: useCallback(
      (domaineId: number, label: string) =>
        updateDomaineMutate({ collectiviteId, demarcheId, domaineId, label }),
      [updateDomaineMutate, collectiviteId, demarcheId]
    ),
    removeDomaine: useCallback(
      (domaineId: number) =>
        removeDomaineMutate({ collectiviteId, demarcheId, domaineId }),
      [removeDomaineMutate, collectiviteId, demarcheId]
    ),
  };
};
