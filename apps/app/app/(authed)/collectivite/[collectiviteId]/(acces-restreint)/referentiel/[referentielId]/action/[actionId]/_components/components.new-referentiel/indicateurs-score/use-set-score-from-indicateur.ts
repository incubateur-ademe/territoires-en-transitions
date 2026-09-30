import { appLabels } from '@/app/labels/catalog';
import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { broadcastQueryInvalidation } from '@tet/api/utils/react-query/cross-tab-invalidation';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';

type ScoreSnapshot =
  RouterOutput['referentiels']['actions']['setScoreFromIndicateur'];

/**
 * Enregistre la valeur d'indicateur retenue pour une action du référentiel CR
 * et en déclenche le calcul du score : le backend dérive et applique le
 * statut d'avancement dans la même transaction, puis renvoie le snapshot
 * recalculé.
 */
export const useSetScoreFromIndicateur = () => {
  const trpc = useTRPC();
  const { onSuccess, onSettled } = useOnScoreFromIndicateurUpdated();

  return useMutation(
    trpc.referentiels.actions.setScoreFromIndicateur.mutationOptions({
      onSuccess: (snapshot, variables) => onSuccess(snapshot, variables),
      onSettled,
      meta: {
        disableToast: true,
      },
    })
  );
};

/**
 * Marque un indicateur associé à une action du référentiel TE comme suivi ou
 * non suivi : le backend met à jour le flag, désélectionne la valeur retenue
 * si l'indicateur devient non suivi et recalcule le statut d'avancement dans
 * la même transaction, puis renvoie le snapshot recalculé.
 */
export const useSetIndicateurSuivi = () => {
  const trpc = useTRPC();
  const { onSuccess, onSettled } = useOnScoreFromIndicateurUpdated();

  return useMutation(
    trpc.referentiels.actions.setIndicateurSuivi.mutationOptions({
      onSuccess: (snapshot, variables) =>
        onSuccess(snapshot, variables, [
          // source de la définition (et donc du flag `isSuivi`) affichée
          trpc.indicateurs.indicateurs.list.queryKey({
            collectiviteId: variables.collectiviteId,
          }),
        ]),
      onSettled,
      meta: {
        error: appLabels.indicateurNonSuiviUpdateError,
      },
    })
  );
};

/**
 * Met à jour les caches impactés par un recalcul du score d'une action à
 * partir de ses indicateurs (le backend renvoie le snapshot recalculé).
 * `extraQueryKeys` permet d'invalider en plus des caches propres à l'appelant.
 */
const useOnScoreFromIndicateurUpdated = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const onSuccess = (
    snapshot: ScoreSnapshot,
    { collectiviteId, actionId }: { collectiviteId: number; actionId: string },
    extraQueryKeys: QueryKey[] = []
  ) => {
    const referentielId = getReferentielIdFromActionId(actionId);

    // le contrat de la procédure renvoie déjà le snapshot recalculé :
    // pas besoin d'un second recalcul via `computeScoreAndUpdateCurrentSnapshot`
    queryClient.setQueryData(
      trpc.referentiels.snapshots.getCurrent.queryKey({
        collectiviteId,
        referentielId,
      }),
      snapshot
    );

    queryClient.invalidateQueries({
      queryKey: trpc.referentiels.actions.listActionsGroupedById.queryKey({
        collectiviteId,
        referentielId,
      }),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.referentiels.actions.getValeursUtilisables.queryKey({
        collectiviteId,
        actionIds: [actionId],
      }),
    });

    // `getScoreIndicatif` est mis en cache avec le tableau `actionIds`
    // de toutes les sous-actions affichées ensemble (cf
    // `SubactionIndicateurList`, une instance par sous-mesure) : un
    // filtre `actionIds: [actionId]` ne matche ce cache que si `actionId`
    // est le premier élément de ce tableau (matching partiel de TanStack
    // Query = comparaison index par index, pas par inclusion). On cible
    // donc les caches via un `predicate` qui vérifie que `actionId` fait
    // bien partie du tableau `actionIds` mis en cache, plutôt que
    // d'invalider toutes les sous-mesures de la page.
    queryClient.invalidateQueries({
      queryKey: trpc.referentiels.actions.getScoreIndicatif.queryKey(),
      predicate: (query) => {
        const [, args] = query.queryKey as [
          string[],
          { input?: { actionIds?: string[] } }
        ];
        return Boolean(args?.input?.actionIds?.includes(actionId));
      },
    });
    queryClient.invalidateQueries({
      queryKey: trpc.referentiels.labellisations.getParcours.queryKey({
        collectiviteId,
        referentielId,
      }),
    });
    extraQueryKeys.forEach((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    );

    // les autres onglets ouverts sur cette collectivité n'ont pas reçu le
    // snapshot recalculé : on les invite à invalider leur cache plutôt
    // que de les laisser afficher un score obsolète jusqu'au rechargement
    broadcastQueryInvalidation([
      trpc.referentiels.snapshots.getCurrent.queryKey({
        collectiviteId,
        referentielId,
      }),
      trpc.referentiels.actions.listActionsGroupedById.queryKey({
        collectiviteId,
        referentielId,
      }),
      trpc.referentiels.actions.getValeursUtilisables.queryKey({
        collectiviteId,
        actionIds: [actionId],
      }),
      trpc.referentiels.actions.getScoreIndicatif.queryKey(),
      trpc.referentiels.labellisations.getParcours.queryKey({
        collectiviteId,
        referentielId,
      }),
      ...extraQueryKeys,
    ]);
  };

  const onSettled = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.referentiels.historique.list.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.referentiels.historique.listUtilisateurs.queryKey(),
    });
  };

  return { onSuccess, onSettled };
};
