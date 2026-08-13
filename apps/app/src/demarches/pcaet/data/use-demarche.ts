'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  emptyDemarchePcaetCompletion,
  getDemarchePcaetCompletion,
} from '../../completion';
import { useApplyDemarchePcaetTransition } from './use-apply-transition';
import { DemarchePcaetPublicationStatusEnum } from '@tet/domain/demarches';
import { useDemarchePcaetDiagnostic } from '../diagnostic/data/use-diagnostic';
import { useDemarchePcaetDocumentsSnapshot } from './use-documents';
import type { DemarchePcaetTransition } from '@tet/domain/demarches';
import type { DemarchePcaet, DemarchePcaetUpdatePatch } from '../../types';

type ServerDemarche = RouterOutput['demarches']['pcaet']['get'];
type UpdateInput = RouterInput['demarches']['pcaet']['update'];
type HeaderPatch = Omit<UpdateInput, 'collectiviteId' | 'demarcheId'>;

const toFrontDemarche = (server: ServerDemarche): DemarchePcaet => ({
  id: server.id,
  collectiviteId: server.collectiviteId,
  type: server.type,
  titre: server.titre,
  description: server.description,
  statutPublication: server.publicationStatus,
  statut: server.status,
  obligation: server.obligation,
  dateCreation: server.createdAt,
  dateModification: server.modifiedAt,
  dateLancement: server.launchedAt,
  datePublication: server.publishedAt,
  dateTransmission: server.transmittedAt,
  dateEcheanceAvis: server.avisDeadlineAt,
  pilotes: server.pilotes,
  planActionId: server.planActionId,
  availableTransitions: server.availableTransitions,
});

const toHeaderPatch = (patch: DemarchePcaetUpdatePatch) => {
  const headerPatch: HeaderPatch = {
    ...(patch.titre !== undefined ? { titre: patch.titre } : {}),
    ...(patch.description !== undefined
      ? { description: patch.description }
      : {}),
    ...(patch.obligation !== undefined ? { obligation: patch.obligation } : {}),
    ...(patch.dateLancement !== undefined
      ? { launchedAt: patch.dateLancement }
      : {}),
    ...(patch.planActionId !== undefined
      ? { planActionId: patch.planActionId }
      : {}),
    ...(patch.pilotes !== undefined
      ? {
          pilotes: patch.pilotes.map((pilote) => ({
            tagId: pilote.tagId ?? null,
            userId: pilote.userId ?? null,
          })),
        }
      : {}),
  };

  return {
    headerPatch,
    hasHeaderChanges: Object.keys(headerPatch).length > 0,
    /** Pilotes optimistes : on garde les objets complets (avec le nom). */
    optimisticPilotes: patch.pilotes,
  };
};

const HEADER_FLUSH_DELAY_MS = 400;

export const useDemarchePcaet = (demarcheId: number) => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const getQueryKey = trpc.demarches.pcaet.get.queryKey({
    collectiviteId,
    demarcheId,
  });

  const { data: serverDemarche, isLoading } = useQuery(
    trpc.demarches.pcaet.get.queryOptions({ collectiviteId, demarcheId })
  );

  const demarche = useMemo(
    () => (serverDemarche ? toFrontDemarche(serverDemarche) : null),
    [serverDemarche]
  );

  const invalidateList = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: trpc.demarches.pcaet.list.queryKey({ collectiviteId }),
      }),
    [queryClient, trpc, collectiviteId]
  );

  const pendingHeaderRef = useRef<HeaderPatch>({});

  const { mutate: updateDemarche } = useMutation(
    trpc.demarches.pcaet.update.mutationOptions()
  );

  // Les mutations du header sont regroupées (la description est éditée à
  // chaque frappe) ; l'UI reste réactive grâce au cache optimiste. Les
  // callbacks sont passés à l'appel de mutate (et non à mutationOptions) :
  // ils lisent la ref du patch en attente, ce que react-hooks/refs interdit
  // dans une closure créée pendant le rendu.
  const flushHeader = useDebouncedCallback(() => {
    const payload = pendingHeaderRef.current;
    pendingHeaderRef.current = {};
    if (Object.keys(payload).length === 0) {
      return;
    }
    updateDemarche(
      { collectiviteId, demarcheId, ...payload },
      {
        onSuccess: async (updated) => {
          // Ne pas écraser une frappe en cours : le cache n'est resynchronisé
          // avec la réponse serveur que si aucun patch n'est en attente (la
          // ref est remplie avant chaque armement du debounce).
          if (Object.keys(pendingHeaderRef.current).length === 0) {
            queryClient.setQueryData(getQueryKey, updated);
          }
          await invalidateList();
        },
        onError: async () => {
          // Rollback de l'optimiste : on recharge la vérité serveur (le toast
          // d'erreur global s'affiche via le subscriber de mutations).
          await queryClient.invalidateQueries({ queryKey: getQueryKey });
          await invalidateList();
        },
      }
    );
  }, HEADER_FLUSH_DELAY_MS);

  // Envoie le patch en attente au démontage.
  useEffect(() => () => flushHeader.flush(), [flushHeader]);

  const { mutate: setPublicationStatus } = useMutation(
    trpc.demarches.pcaet.setPublicationStatus.mutationOptions({
      onSuccess: async (updated) => {
        queryClient.setQueryData(getQueryKey, updated);
        await invalidateList();
      },
    })
  );

  const update = useCallback(
    (
      patch:
        | DemarchePcaetUpdatePatch
        | ((current: DemarchePcaet) => DemarchePcaetUpdatePatch)
    ) => {
      if (!demarche) {
        return;
      }
      const resolvedPatch =
        typeof patch === 'function' ? patch(demarche) : patch;
      const { headerPatch, hasHeaderChanges, optimisticPilotes } =
        toHeaderPatch(resolvedPatch);

      if (hasHeaderChanges) {
        const { pilotes: _pilotes, ...headerScalarPatch } = headerPatch;
        queryClient.setQueryData(
          getQueryKey,
          (old: ServerDemarche | undefined) =>
            old
              ? {
                  ...old,
                  ...headerScalarPatch,
                  ...(optimisticPilotes !== undefined
                    ? { pilotes: optimisticPilotes }
                    : {}),
                }
              : old
        );
        pendingHeaderRef.current = {
          ...pendingHeaderRef.current,
          ...headerPatch,
        };
        flushHeader();
      }
    },
    [
      demarche,
      collectiviteId,
      demarcheId,
      queryClient,
      getQueryKey,
      flushHeader,
    ]
  );

  const { mutate: applyTransitionMutate } = useApplyDemarchePcaetTransition();
  const applyTransition = useCallback(
    (transition: DemarchePcaetTransition) => {
      applyTransitionMutate({ collectiviteId, demarcheId, transition });
    },
    [applyTransitionMutate, collectiviteId, demarcheId]
  );

  const publish = useCallback(() => {
    setPublicationStatus({
      collectiviteId,
      demarcheId,
      publicationStatus: DemarchePcaetPublicationStatusEnum.PUBLISHED,
    });
  }, [collectiviteId, demarcheId, setPublicationStatus]);

  const unpublish = useCallback(() => {
    setPublicationStatus({
      collectiviteId,
      demarcheId,
      publicationStatus: DemarchePcaetPublicationStatusEnum.DRAFT,
    });
  }, [collectiviteId, demarcheId, setPublicationStatus]);

  // Les topics du diagnostic et le dossier documentaire viennent du serveur.
  // Les deux queries sont partagées avec les pages correspondantes (mêmes clés
  // de cache, un seul fetch).
  const { topics } = useDemarchePcaetDiagnostic(demarcheId);
  const { snapshot: documentsSnapshot } =
    useDemarchePcaetDocumentsSnapshot(demarcheId);
  const completion = useMemo(
    () =>
      demarche
        ? getDemarchePcaetCompletion(demarche, topics, documentsSnapshot)
        : emptyDemarchePcaetCompletion(),
    [demarche, topics, documentsSnapshot]
  );

  return {
    demarche,
    completion,
    isLoading,
    update,
    applyTransition,
    publish,
    unpublish,
    collectiviteId,
  };
};
