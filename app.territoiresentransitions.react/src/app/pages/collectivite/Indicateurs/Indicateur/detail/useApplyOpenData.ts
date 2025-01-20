/**
 * Utilitaires pour appliquer des données open-data aux objectifs et résultats d'une collectivité
 */

import { Indicateurs } from '@/api';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { useEventTracker } from '@/ui';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { SOURCE_COLLECTIVITE, SOURCE_TYPE_LABEL } from '../../constants';
import { TIndicateurDefinition } from '../../types';
import { useOnSuccess } from './useEditIndicateurValeur';

type UseApplyOpenDataArgs = {
  definition: Indicateurs.domain.IndicateurDefinition;
  source?: Indicateurs.fetch.IndicateurImportSource;
};

/**
 * Applique les changements
 */
export const useApplyOpenData = ({
  definition,
  source,
}: UseApplyOpenDataArgs) => {
  const trackEvent = useEventTracker('app/indicateurs/predefini');
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;

  const type = source?.type || 'resultat';
  const onSuccess = useOnSuccess({
    collectiviteId,
    definition,
    type,
  });

  const queryClient = useQueryClient();

  return useMutation(
    async ({ overwrite }: { overwrite: boolean }) => {
      if (!source || !source.type || !collectiviteId) return null;

      const appliquerResultat = type === 'resultat';
      const appliquerObjectif = type === 'objectif';
      return Indicateurs.save.upsertValeursUtilisateurAvecSource({
        dbClient: supabaseClient,
        indicateurId: definition.id,
        collectiviteId,
        source,
        appliquerResultat,
        appliquerObjectif,
        ecraserResultat: appliquerResultat && overwrite,
        ecraserObjectif: appliquerObjectif && overwrite,
      });
    },
    {
      mutationKey: 'apply_open_data',
      meta: {
        success:
          source &&
          `Les ${SOURCE_TYPE_LABEL[source.type!]} ${
            source.libelle
          } ont bien été appliqués`,
      },
      onSuccess: (data, { overwrite }) => {
        onSuccess();
        queryClient.invalidateQueries([
          'indicateur-comparaison',
          collectiviteId,
          definition.id,
          source!.id,
        ]);
        trackEvent('apply_open_data', {
          collectiviteId,
          niveauAcces,
          role,
          indicateurId: definition.identifiant!,
          sourceId: source!.id,
          type,
          overwrite,
        });
      },
    }
  );
};

/**
 * Charge les données et fait la comparaison
 */
export const useOpenDataComparaison = ({
  collectiviteId,
  definition,
  importSource,
}: {
  collectiviteId: number | null;
  definition: TIndicateurDefinition;
  importSource: string;
}) => {
  const { data } = useQuery(
    ['indicateur-comparaison', collectiviteId, definition.id, importSource],
    async () => {
      if (
        !collectiviteId ||
        !importSource ||
        importSource === SOURCE_COLLECTIVITE
      )
        return null;
      return Indicateurs.fetch.getValeursComparaison(
        supabaseClient,
        definition.id,
        collectiviteId,
        importSource
      );
    }
  );
  return data;
};
