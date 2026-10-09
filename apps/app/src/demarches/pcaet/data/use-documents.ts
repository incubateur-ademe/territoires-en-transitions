'use client';

import { appLabels } from '@/app/labels/catalog';
import { autosaveMeta } from '@/app/utils/react-query/autosave-status/autosave-status';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  computeDemarcheDocumentsCoverage,
  type DemarcheDocumentDepose,
  type DemarcheDocumentEtape,
} from '@tet/domain/demarches';
import { useCallback, useMemo } from 'react';
import { demarchePcaetAutosaveKeys } from './autosave-keys';

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

  // Le succès s'affiche dans le badge d'enregistrement de l'étape, pas en
  // toast : seule l'erreur mérite d'interrompre, avec le détail de ce qui a
  // échoué.
  const autosave = autosaveMeta(
    demarchePcaetAutosaveKeys.documents(demarcheId)
  );

  const { mutate: addDocument } = useMutation(
    trpc.demarches.pcaet.documents.add.mutationOptions({
      meta: { error: appLabels.demarcheDocumentsDeposeErreur, ...autosave },
      onSuccess: invalidate,
    })
  );

  const { mutate: removeDocument } = useMutation(
    trpc.demarches.pcaet.documents.remove.mutationOptions({
      meta: {
        error: appLabels.demarcheDocumentsSuppressionErreur,
        ...autosave,
      },
      onSuccess: invalidate,
    })
  );

  const { mutate: createAdditional, data: documentAdditionalCree } =
    useMutation(
      trpc.demarches.pcaet.documents.createAdditional.mutationOptions({
        meta: {
          error: appLabels.demarcheDocumentsAdditionalCreationErreur,
          ...autosave,
        },
        onSuccess: invalidate,
      })
    );

  // Même mutation pour le nom et le fichier d'une pièce additionnelle, mais
  // deux observateurs : chacun formule son propre échec.
  const { mutate: renameAdditional } = useMutation(
    trpc.demarches.pcaet.documents.updateAdditional.mutationOptions({
      meta: {
        error: appLabels.demarcheDocumentsAdditionalTitreErreur,
        ...autosave,
      },
      onSuccess: invalidate,
    })
  );

  const { mutate: deposeAdditional } = useMutation(
    trpc.demarches.pcaet.documents.updateAdditional.mutationOptions({
      meta: { error: appLabels.demarcheDocumentsDeposeErreur, ...autosave },
      onSuccess: invalidate,
    })
  );

  const { mutate: removeAdditional } = useMutation(
    trpc.demarches.pcaet.documents.removeAdditional.mutationOptions({
      meta: {
        error: appLabels.demarcheDocumentsAdditionalSuppressionErreur,
        ...autosave,
      },
      onSuccess: invalidate,
    })
  );

  const { mutate: setCouverture } = useMutation(
    trpc.demarches.pcaet.documents.setCouverture.mutationOptions({
      meta: {
        error: appLabels.demarcheDocumentsCouvertureErreur,
        ...autosave,
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
      (
        documentId: string,
        fichierId: number,
        etape: DemarcheDocumentEtape,
        options?: { onSuccess?: (depose: DemarcheDocumentDepose) => void }
      ) =>
        addDocument(
          {
            collectiviteId,
            demarcheId,
            documentId,
            fichierId,
            etape,
          },
          { onSuccess: options?.onSuccess }
        ),
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
