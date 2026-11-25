import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { useCallback } from 'react';
import { invalidateIndicateurValeursQueries } from '../../valeurs/invalidate-indicateur-valeurs-queries';

export type DeleteSousIndicateursPeriode = (
  input: Readonly<{
    indicateurIds: readonly number[];
    periode: IndicateurPeriode;
  }>
) => Promise<void>;

export const useDeleteSousIndicateursPeriode =
  (): DeleteSousIndicateursPeriode => {
    const collectiviteId = useCollectiviteId();
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const { setToast } = useToastContext();
    const { mutateAsync: removePeriode } = useMutation(
      trpc.indicateurs.valeurs.deletePeriode.mutationOptions({
        meta: { disableToast: true },
      })
    );

    return useCallback(
      async ({ indicateurIds, periode }) => {
        const periodeLabel = IndicateurPeriodes.format(periode);
        try {
          await removePeriode({
            collectiviteId,
            indicateurIds: [...indicateurIds],
            dateValeur: periode.dateDebut,
          });
          setToast(
            'success',
            appLabels.indicateurPeriodeSupprimee(periodeLabel)
          );
        } catch {
          setToast(
            'error',
            appLabels.indicateurPeriodeSuppressionErreur(periodeLabel)
          );
        } finally {
          await invalidateIndicateurValeursQueries({
            queryClient,
            trpc,
            collectiviteId,
          });
        }
      },
      [collectiviteId, trpc, queryClient, setToast, removePeriode]
    );
  };
