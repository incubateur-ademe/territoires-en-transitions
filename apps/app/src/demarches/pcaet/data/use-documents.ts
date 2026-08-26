'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  computeDemarcheDocumentsCoverage,
  type DemarcheDocumentEtape,
} from '@tet/domain/demarches';
import { useCallback, useMemo } from 'react';

/**
 * Modèle documentaire et pièces déposées d'une démarche PCAET, en lecture seule.
 * À préférer partout où les mutations ne servent pas : elles coûtent chacune un
 * observateur de mutation, pour rien.
 */
export const useDemarchePcaetDocumentsSnapshot = (demarcheId: number) => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();

  const {
    data: snapshot,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    trpc.demarches.pcaet.documents.list.queryOptions({
      collectiviteId,
      demarcheId,
    })
  );

  const coverage = useMemo(
    () => (snapshot ? computeDemarcheDocumentsCoverage(snapshot) : []),
    [snapshot]
  );

  return { snapshot, coverage, isLoading, isError, refetch };
};

/**
 * Documents d'une démarche PCAET : le modèle attendu (servi par la base) et les
 * pièces déposées, plus les mutations de dépôt, de retrait et de couverture.
 */
export const useDemarchePcaetDocuments = (demarcheId: number) => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryKey = trpc.demarches.pcaet.documents.list.queryKey({
    collectiviteId,
    demarcheId,
  });
  const demarcheQueryKey = trpc.demarches.pcaet.get.queryKey({
    collectiviteId,
    demarcheId,
  });

  const { snapshot, coverage, isLoading, isError, refetch } =
    useDemarchePcaetDocumentsSnapshot(demarcheId);

  // La démarche est invalidée avec les documents : `availableTransitions` est
  // calculé par le serveur à partir de la complétude du dossier, sinon le bouton
  // de transmission resterait grisé après le dépôt de la dernière pièce requise.
  const invalidate = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: demarcheQueryKey }),
      ]),
    [queryClient, queryKey, demarcheQueryKey]
  );

  const { mutate: addDocument } = useMutation(
    trpc.demarches.pcaet.documents.add.mutationOptions({
      meta: {
        success: appLabels.demarcheDocumentsDeposeSucces,
        error: appLabels.demarcheDocumentsDeposeErreur,
      },
      onSuccess: invalidate,
    })
  );

  const { mutate: removeDocument } = useMutation(
    trpc.demarches.pcaet.documents.remove.mutationOptions({
      meta: {
        success: appLabels.demarcheDocumentsSuppressionSucces,
        error: appLabels.demarcheDocumentsSuppressionErreur,
      },
      onSuccess: invalidate,
    })
  );

  // L'apparition de la ligne est sa propre confirmation : pas de toast de
  // succès, seule l'erreur mérite d'être annoncée.
  const { mutate: createAdditional, data: documentAdditionalCree } =
    useMutation(
      trpc.demarches.pcaet.documents.createAdditional.mutationOptions({
        meta: { error: appLabels.demarcheDocumentsAdditionalCreationErreur },
        onSuccess: invalidate,
      })
    );

  // Nommer une pièce est de la saisie : ça s'enregistre à la sortie du champ,
  // sans toast, comme n'importe quel champ de formulaire.
  const { mutate: renameAdditional } = useMutation(
    trpc.demarches.pcaet.documents.updateAdditional.mutationOptions({
      meta: { error: appLabels.demarcheDocumentsAdditionalTitreErreur },
      onSuccess: invalidate,
    })
  );

  // Le dépôt, lui, se confirme comme celui d'une pièce attendue.
  const { mutate: deposeAdditional } = useMutation(
    trpc.demarches.pcaet.documents.updateAdditional.mutationOptions({
      meta: {
        success: appLabels.demarcheDocumentsDeposeSucces,
        error: appLabels.demarcheDocumentsDeposeErreur,
      },
      onSuccess: invalidate,
    })
  );

  const { mutate: removeAdditional } = useMutation(
    trpc.demarches.pcaet.documents.removeAdditional.mutationOptions({
      meta: {
        success: appLabels.demarcheDocumentsAdditionalSuppressionSucces,
        error: appLabels.demarcheDocumentsAdditionalSuppressionErreur,
      },
      onSuccess: invalidate,
    })
  );

  const { mutate: setCouverture } = useMutation(
    trpc.demarches.pcaet.documents.setCouverture.mutationOptions({
      meta: {
        success: appLabels.demarcheDocumentsCouvertureSucces,
        error: appLabels.demarcheDocumentsCouvertureErreur,
      },
      onSuccess: invalidate,
    })
  );

  return {
    snapshot,
    coverage,
    isLoading,
    isError,
    refetch,
    // Le temps visé accompagne l'écriture : une pièce de portée `both` a une
    // version par temps, et le serveur ne peut pas le deviner.
    addDocument: useCallback(
      (documentId: string, fichierId: number, etape: DemarcheDocumentEtape) =>
        addDocument({
          collectiviteId,
          demarcheId,
          documentId,
          fichierId,
          etape,
        }),
      [addDocument, collectiviteId, demarcheId]
    ),
    removeDocument: useCallback(
      (documentId: string, etape: DemarcheDocumentEtape) =>
        removeDocument({ collectiviteId, demarcheId, documentId, etape }),
      [removeDocument, collectiviteId, demarcheId]
    ),
    setCouverture: useCallback(
      (documentId: string, couvert: boolean) =>
        setCouverture({ collectiviteId, demarcheId, documentId, couvert }),
      [setCouverture, collectiviteId, demarcheId]
    ),
    // Pièces additionnelles : la création n'ouvre qu'une ligne, le nom et le fichier
    // arrivent ensuite, dans l'ordre que la collectivité choisit.
    createDocumentAdditional: useCallback(
      (etape: DemarcheDocumentEtape) =>
        createAdditional({ collectiviteId, demarcheId, etape }),
      [createAdditional, collectiviteId, demarcheId]
    ),
    /** Dernière pièce ouverte : c'est elle qui reçoit le focus de saisie. */
    documentAdditionalCreeId: documentAdditionalCree?.id,
    renameDocumentAdditional: useCallback(
      (documentAdditionalId: number, titre: string) =>
        renameAdditional({
          collectiviteId,
          demarcheId,
          documentAdditionalId,
          titre,
        }),
      [renameAdditional, collectiviteId, demarcheId]
    ),
    addFichierDocumentAdditional: useCallback(
      (documentAdditionalId: number, fichierId: number) =>
        deposeAdditional({
          collectiviteId,
          demarcheId,
          documentAdditionalId,
          fichierId,
        }),
      [deposeAdditional, collectiviteId, demarcheId]
    ),
    removeDocumentAdditional: useCallback(
      (documentAdditionalId: number) =>
        removeAdditional({ collectiviteId, demarcheId, documentAdditionalId }),
      [removeAdditional, collectiviteId, demarcheId]
    ),
  };
};
