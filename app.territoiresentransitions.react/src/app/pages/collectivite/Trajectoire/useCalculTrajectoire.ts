import { useCurrentCollectivite } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import {
  CalculTrajectoireReset,
  IndicateurAvecValeurs,
} from '@/domain/indicateurs';
import { Event, useEventTracker } from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type ResultatTrajectoire = {
  indentifiantsReferentielManquantsDonneesEntree: string[];
  trajectoire: {
    emissionsGes: IndicateurAvecValeurs[];
    consommationsFinales: IndicateurAvecValeurs[];
  };
};

/** Charge la trajectoire */
export const useGetTrajectoire = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.trajectoires.snbc.getOrCompute.queryOptions(
      {
        collectiviteId,
      },
      {
        retry: false,
        refetchOnMount: false,
      }
    )
  );
};

/** Déclenche le calcul de la trajectoire */
export const useCalculTrajectoire = ({
  nouveauCalcul,
  enabled = true,
}: {
  nouveauCalcul?: boolean;
  enabled?: boolean;
} = {}) => {
  const { collectiviteId } = useCurrentCollectivite();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const trackEvent = useEventTracker();

  return useQuery(
    trpc.indicateurs.trajectoires.snbc.getOrCompute.queryOptions(
      {
        collectiviteId,
        ...(nouveauCalcul
          ? {
              mode: CalculTrajectoireReset.MAJ_SPREADSHEET_EXISTANT,
              forceUtilisationDonneesCollectivite: true,
            }
          : {}),
      },
      {
        enabled,
        retry: false,
        // Utilise le `select` comme un `onSuccess` pour mettre à jour les caches de valeurs des indicateurs.
        // Utile dans le cas de l'affichage de la trajectoire sur le graphe d'un indicateur concerné (cae_1.a, cae_2.a)
        // et son sélecteur de sources.
        select: (data) => {
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.valeurs.list.queryKey({
              collectiviteId,
            }),
          });

          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.sources.available.queryKey({
              collectiviteId,
            }),
          });

          trackEvent(Event.trajectoire.triggerSnbcCalculation, {
            source: nouveauCalcul ? 'collectivite' : 'open_data',
          });

          return data;
        },
      }
    )
  );
};
