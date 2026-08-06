'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { computeDemarcheDocumentsCoverage } from '@tet/domain/demarches';
import { useCallback, useMemo } from 'react';

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

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    [queryClient, queryKey]
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
        success: appLabels.demarcheDocumentsRetraitSucces,
        error: appLabels.demarcheDocumentsRetraitErreur,
      },
      onSuccess: invalidate,
    })
  );

  const { mutate: setCouverture } = useMutation(
    trpc.demarches.pcaet.documents.setCouverture.mutationOptions({
      onSuccess: invalidate,
    })
  );

  const coverage = useMemo(
    () => (snapshot ? computeDemarcheDocumentsCoverage(snapshot) : []),
    [snapshot]
  );

  return {
    snapshot,
    coverage,
    isLoading,
    isError,
    refetch,
    addDocument: useCallback(
      (documentId: string, fichierId: number) =>
        addDocument({ collectiviteId, demarcheId, documentId, fichierId }),
      [addDocument, collectiviteId, demarcheId]
    ),
    removeDocument: useCallback(
      (documentId: string) =>
        removeDocument({ collectiviteId, demarcheId, documentId }),
      [removeDocument, collectiviteId, demarcheId]
    ),
    setCouverture: useCallback(
      (documentId: string, couvert: boolean) =>
        setCouverture({ collectiviteId, demarcheId, documentId, couvert }),
      [setCouverture, collectiviteId, demarcheId]
    ),
  };
};
