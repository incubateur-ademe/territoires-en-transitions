'use client';

import { appLabels } from '@/app/labels/catalog';
import { autosaveMeta } from '@/app/utils/react-query/autosave-status/autosave-status';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';
import { demarchePcaetAutosaveKeys } from '../../data/autosave-keys';

type Diagnostic = RouterOutput['demarches']['pcaet']['diagnostic']['get'];

type SetLigneInput = Omit<
  RouterInput['demarches']['pcaet']['diagnostic']['setVulnerabiliteLigne'],
  'collectiviteId' | 'demarcheId'
>;

/** Motif d'échec d'un ajout de thématique, tel que la modale doit le formuler. */
export type AddThematiqueFailure = 'THEMATIQUE_DEJA_EXISTANT' | 'AUTRE';

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

  // Le succès s'affiche dans le badge d'enregistrement du tableau : seul
  // l'échec mérite un toast.
  // Toutes les écritures partagent une file : leurs réponses remplacent le
  // cache entier, et deux saisies rapprochées dont les réponses se croisent
  // laisseraient la plus ancienne à l'écran.
  const scope = { id: `demarche-pcaet-vulnerabilite-${demarcheId}` };
  const autosave = autosaveMeta(
    demarchePcaetAutosaveKeys.diagnosticVulnerabilite(demarcheId)
  );

  const { mutate: setLigneMutate } = useMutation(
    trpc.demarches.pcaet.diagnostic.setVulnerabiliteLigne.mutationOptions({
      scope,
      meta: { error: appLabels.mutationError, ...autosave },
      onSuccess,
      onError: () => queryClient.invalidateQueries({ queryKey }),
    })
  );

  // `mutateAsync` : la modale d'ajout ne se ferme qu'au succès, pour que le
  // libellé refusé reste corrigeable sans ressaisie.
  const { mutateAsync: addThematiqueMutate } = useMutation(
    trpc.demarches.pcaet.diagnostic.addVulnerabiliteThematique.mutationOptions({
      scope,
      // L'échec est rendu dans la modale, au plus près du champ fautif.
      meta: { disableToast: true, ...autosave },
      onSuccess,
    })
  );

  const { mutate: updateThematiqueMutate } = useMutation(
    trpc.demarches.pcaet.diagnostic.updateVulnerabiliteThematique.mutationOptions(
      {
        scope,
        meta: { error: appLabels.mutationError, ...autosave },
        onSuccess,
        onError: () => queryClient.invalidateQueries({ queryKey }),
      }
    )
  );

  const { mutate: removeThematiqueMutate } = useMutation(
    trpc.demarches.pcaet.diagnostic.removeVulnerabiliteThematique.mutationOptions(
      {
        scope,
        meta: { error: appLabels.mutationError, ...autosave },
        onSuccess,
      }
    )
  );

  return {
    setLigne: useCallback(
      (input: SetLigneInput) =>
        setLigneMutate({ collectiviteId, demarcheId, ...input }),
      [setLigneMutate, collectiviteId, demarcheId]
    ),
    addThematique: useCallback(
      async (
        label: string,
        parentId?: number
      ): Promise<AddThematiqueFailure | null> => {
        try {
          await addThematiqueMutate({
            collectiviteId,
            demarcheId,
            label,
            parentId,
          });
          return null;
        } catch (error) {
          // Sans distinguer le motif, une coupure réseau s'annonçait comme un
          // doublon de libellé.
          return errorKeyOf(error) === 'THEMATIQUE_DEJA_EXISTANT'
            ? 'THEMATIQUE_DEJA_EXISTANT'
            : 'AUTRE';
        }
      },
      [addThematiqueMutate, collectiviteId, demarcheId]
    ),
    updateThematique: useCallback(
      (thematiqueId: number, label: string) =>
        updateThematiqueMutate({
          collectiviteId,
          demarcheId,
          thematiqueId,
          label,
        }),
      [updateThematiqueMutate, collectiviteId, demarcheId]
    ),
    removeThematique: useCallback(
      (thematiqueId: number) =>
        removeThematiqueMutate({ collectiviteId, demarcheId, thematiqueId }),
      [removeThematiqueMutate, collectiviteId, demarcheId]
    ),
  };
};
