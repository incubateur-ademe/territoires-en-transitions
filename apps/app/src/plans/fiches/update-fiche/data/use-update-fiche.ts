import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { ListFichesOutput } from '../../list-all-fiches/data/use-list-fiches';

type Args = Partial<{
  invalidatePlanId: number;
  onUpdateCallback: () => void;
}>;

export type UpdateFicheInput = RouterInput['plans']['fiches']['update'];

export const useUpdateFiche = (args?: Args) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const user = useUser();
  const isNotificationEnabled = useFeatureFlagEnabled(
    'is-notification-enabled'
  );

  const { mutateAsync } = useMutation(
    trpc.plans.fiches.update.mutationOptions()
  );

  return useMutation({
    mutationFn: (input: UpdateFicheInput) =>
      mutateAsync({ ...input, isNotificationEnabled }),
    // Optimistic update
    onMutate: async ({ ficheId, ficheFields }) => {
      const queryKeyOfGetFiche = trpc.plans.fiches.get.queryKey({
        id: ficheId,
      });

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: queryKeyOfGetFiche,
      });

      // Snapshot the previous value
      const previousFiche = queryClient.getQueryData(queryKeyOfGetFiche);

      // Optimistically update when updating the fiche from the detail page of a fiche
      queryClient.setQueryData(queryKeyOfGetFiche, (old: any) => {
        if (old?.id !== ficheId) return old;

        const mergedFicheFields = { ...ficheFields };

        if (ficheFields.notes) {
          mergedFicheFields.notes = ficheFields.notes.map((newNote: any) => {
            if (newNote.id === undefined) return newNote;
            const existingNote = old.notes?.find(
              (n: any) => n.id === newNote.id
            );
            if (!existingNote) return newNote;
            return {
              ...newNote,
              createdAt: existingNote.createdAt,
              createdBy: existingNote.createdBy,
              modifiedAt: new Date().toISOString(),
              modifiedBy: user
                ? { id: user.id, nom: user.nom, prenom: user.prenom }
                : existingNote.modifiedBy,
            };
          });
        }

        return { ...old, ...mergedFicheFields };
      });

      // Optimistically update all caches of list of fiches
      queryClient.setQueriesData(
        trpc.plans.fiches.listFiches.queryFilter({
          collectiviteId,
        }),
        (previous: ListFichesOutput) => {
          if (!previous)
            return {
              data: [{ ...ficheFields, id: ficheId }],
            };

          return {
            ...previous,
            data: (previous.data ?? []).map((fiche) =>
              fiche.id === ficheId ? { ...fiche, ...ficheFields } : fiche
            ),
          };
        }
      );

      let newListActionsKey: unknown[] | undefined;
      if (ficheFields.mesures) {
        const oldFiche = previousFiche as
          | { mesures?: { id: string }[] }
          | undefined;
        const oldActionIds = oldFiche?.mesures?.map((m) => m.id) ?? [];
        const newActionIds = ficheFields.mesures.map((m) => m.id);
        const oldListActionsKey =
          trpc.referentiels.actions.listActions.queryKey({
            collectiviteId,
            filters: { actionIds: oldActionIds },
          });
        newListActionsKey = trpc.referentiels.actions.listActions.queryKey({
          collectiviteId,
          filters: { actionIds: newActionIds },
        });
        const oldList = (queryClient.getQueryData(oldListActionsKey) ?? []) as {
          actionId: string;
          identifiant?: string;
          nom?: string;
          referentiel?: string;
          pilotes?: unknown[];
          services?: unknown[];
        }[];

        const addedIds = newActionIds.filter(
          (id) => !oldActionIds.includes(id)
        );
        const removedIds = oldActionIds.filter(
          (id) => !newActionIds.includes(id)
        );

        let newList = [...oldList];

        if (removedIds.length > 0) {
          newList = newList.filter((a) => !removedIds.includes(a.actionId));
        }
        if (addedIds.length > 0) {
          const placeholders = addedIds.map((actionId) => {
            const [referentiel = 'cae', identifiantPart] = actionId.split('_');
            return {
              actionId,
              identifiant: identifiantPart ?? actionId,
              nom: 'Chargement…',
              referentiel,
              pilotes: [] as unknown[],
              services: [] as unknown[],
            };
          });
          newList = [...newList, ...placeholders];
        }

        queryClient.setQueryData(newListActionsKey, newList);
      }

      if (ficheFields.indicateurs) {
        queryClient.setQueryData(
          trpc.indicateurs.indicateurs.list.queryKey({
            collectiviteId,
            filters: {
              ficheIds: [ficheId],
            },
          }),
          (previous) => {
            return {
              ...(previous ?? {
                count: 0,
                pageCount: 0,
                pageSize: 0,
                page: 0,
                data: [],
              }),
              data: (previous?.data ?? []).filter((i) =>
                ficheFields.indicateurs?.find((f) => f.id === i.id)
              ),
            };
          }
        );
      }

      // Return a context object with the snapshotted value
      return { previousFiche, newListActionsKey };
    },
    // If the mutation fails, use the context returned from onMutate to rollback
    onError: (error, { ficheId, ficheFields }, context) => {
      const queryKeyOfGetFiche = trpc.plans.fiches.get.queryKey({
        id: ficheId,
      });

      queryClient.setQueryData(queryKeyOfGetFiche, context?.previousFiche);
      if (ficheFields.mesures && context?.newListActionsKey) {
        queryClient.removeQueries({ queryKey: context.newListActionsKey });
      }
    },
    // Always refetch after error or success:
    onSettled: (result, error, { ficheId, ficheFields }) => {
      const queryKeyOfGetFiche = trpc.plans.fiches.get.queryKey({
        id: ficheId,
      });

      queryClient.invalidateQueries({
        queryKey: queryKeyOfGetFiche,
      });

      if (ficheFields.indicateurs) {
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.indicateurs.list.queryKey({
            filters: {
              ficheIds: [ficheId],
            },
          }),
        });
      }

      if (ficheFields.mesures) {
        const newActionIds = ficheFields.mesures.map((m) => m.id);
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listActions.queryKey({
            collectiviteId,
            filters: { actionIds: newActionIds },
          }),
        });
      }

      // Dans le cas où on update la fiche depuis la liste des fiches
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.listFiches.queryKey({
          collectiviteId,
        }),
      });

      /**
       * Invalide le cache de la query countBy des fiches
       * pour recalculer le status d'un plan
       */
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.countBy.queryKey(),
      });

      /**
       * Invalide le cache de completion analytics pour recalculer
       * les champs à compléter après mise à jour d'une fiche
       */
      queryClient.invalidateQueries({
        queryKey: trpc.plans.plans.getPlanCompletion.queryKey(),
      });

      if (ficheFields.axes) {
        ficheFields.axes.forEach(({ id: axeId }) =>
          queryClient.invalidateQueries({ queryKey: ['axe_fiches', axeId] })
        );
      }

      if (args?.invalidatePlanId) {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.plans.get.queryKey({
            planId: args.invalidatePlanId,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listFiches.queryKey({
            collectiviteId,
          }),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['axe_fiches', null] });
      queryClient.invalidateQueries({
        queryKey: ['structures', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['partenaires', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['personnes_pilotes', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['personnes', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['services_pilotes', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['personnes_referentes', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['financeurs', collectiviteId],
      });
    },
    onSuccess: () => {
      if (args?.onUpdateCallback) {
        args.onUpdateCallback();
      }
    },
  });
};
