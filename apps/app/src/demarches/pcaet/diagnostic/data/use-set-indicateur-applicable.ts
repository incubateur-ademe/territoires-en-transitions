'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback, useRef } from 'react';

/**
 * Déclare un indicateur applicable ou non à la collectivité. Le flag vit dans
 * `indicateur_collectivite` et vaut pour tout le produit : la mutation est donc
 * celle du routeur indicateurs, et non une mutation propre au diagnostic.
 *
 * Elle ne renvoie rien — contrairement aux autres mutations du diagnostic, on
 * ne peut donc pas reposer le payload reçu. La bascule met à jour le cache de
 * `pcaet.diagnostic.get` de façon optimiste (le roundtrip réseau ne doit pas
 * bloquer le toggle), avec rollback sur erreur, puis invalide les requêtes
 * pour resynchroniser. `pcaet.get` suit aussi : le badge de complétion du
 * parcours en dépend.
 */
export const useSetIndicateurApplicable = (demarcheId: number) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryKeyOfDiagnostic = trpc.demarches.pcaet.diagnostic.get.queryKey({
    collectiviteId,
    demarcheId,
  });
  const updateMutationKey = trpc.indicateurs.indicateurs.update.mutationKey();

  /**
   * Ne touche que le flag de l'indicateur visé : plusieurs bascules peuvent
   * être en vol, et chacune doit garder les mises à jour optimistes des autres.
   */
  const setIsApplicableInCache = (
    indicateurId: number,
    isApplicable: boolean
  ) =>
    queryClient.setQueryData(queryKeyOfDiagnostic, (old) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        indicateurDefinitions: old.indicateurDefinitions.map((definition) =>
          definition.id === indicateurId
            ? { ...definition, isApplicable }
            : definition
        ),
      };
    });

  const { mutateAsync, isPending } = useMutation(
    trpc.indicateurs.indicateurs.update.mutationOptions({
      meta: { error: appLabels.pcaetDiagnosticApplicabiliteEchec },

      onMutate: async ({ indicateurId, indicateurFields }) => {
        const { isApplicable } = indicateurFields;
        if (isApplicable === undefined) {
          return;
        }

        await queryClient.cancelQueries({ queryKey: queryKeyOfDiagnostic });

        const previousIsApplicable = queryClient
          .getQueryData(queryKeyOfDiagnostic)
          ?.indicateurDefinitions.find(
            (definition) => definition.id === indicateurId
          )?.isApplicable;

        setIsApplicableInCache(indicateurId, isApplicable);

        return { previousIsApplicable };
      },

      onError: (_error, { indicateurId }, context) => {
        if (context?.previousIsApplicable !== undefined) {
          setIsApplicableInCache(indicateurId, context.previousIsApplicable);
        }
      },

      onSettled: async () => {
        // `pcaet.get` ne porte aucune mise à jour optimiste, et le badge de
        // complétion du parcours dépend de l'applicabilité : on l'invalide dans
        // tous les cas. Le laisser derrière la garde ci-dessous le figerait sur
        // son compte d'avant la bascule, sans rien pour le rattraper — la clé
        // de mutation est celle de *toute* mise à jour d'indicateur, partagée
        // avec les pages Indicateurs.
        await queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.get.queryKey({
            collectiviteId,
            demarcheId,
          }),
        });

        // Un refetch lancé pendant qu'une autre bascule est encore en vol
        // écraserait sa mise à jour optimiste : seule la dernière resynchronise.
        // En attendant, le cache reste juste : le succès y a écrit la valeur
        // même du serveur, et l'erreur a rembobiné le seul champ touché.
        const isLastPendingUpdate =
          queryClient.isMutating({ mutationKey: updateMutationKey }) === 1;
        if (!isLastPendingUpdate) {
          return;
        }
        await queryClient.invalidateQueries({
          queryKey: queryKeyOfDiagnostic,
        });
      },
    })
  );

  /**
   * Bascules déjà parties et pas encore retombées, par indicateur. Deux clics
   * rapides sur la même ligne partiraient en deux requêtes indépendantes (le
   * client n'agrège pas les appels) : commitées dans l'autre ordre, le refetch
   * final rendrait la valeur du *premier* clic et la ligne se figerait sur
   * l'inverse de ce que l'utilisateur a demandé. La garde est par ligne : les
   * autres bascules de la grille restent libres.
   */
  const indicateurIdsEnVol = useRef(new Set<number>());

  const setIndicateurApplicable = useCallback(
    async ({
      indicateurId,
      isApplicable,
    }: {
      indicateurId: number;
      isApplicable: boolean;
    }) => {
      if (indicateurIdsEnVol.current.has(indicateurId)) {
        return;
      }
      indicateurIdsEnVol.current.add(indicateurId);
      try {
        await mutateAsync({
          indicateurId,
          collectiviteId,
          indicateurFields: { isApplicable },
        });
      } finally {
        indicateurIdsEnVol.current.delete(indicateurId);
      }
    },
    [mutateAsync, collectiviteId]
  );

  return { setIndicateurApplicable, isPending };
};
