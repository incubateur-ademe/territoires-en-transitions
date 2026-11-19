import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  COLLECTIVITE_SOURCE_ID,
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
    const { mutateAsync: removeValeur } = useMutation(
      trpc.indicateurs.valeurs.delete.mutationOptions({
        meta: { disableToast: true },
      })
    );

    return useCallback(
      async ({ indicateurIds, periode }) => {
        const periodeLabel = IndicateurPeriodes.format(periode);
        try {
          const { indicateurs } = await queryClient.fetchQuery(
            trpc.indicateurs.valeurs.list.queryOptions({
              collectiviteId,
              indicateurIds: [...indicateurIds],
              sources: [COLLECTIVITE_SOURCE_ID],
            })
          );
          const periodeKey = IndicateurPeriodes.key(periode);
          const valeursToRemove = indicateurs.flatMap(
            ({ definition, sources }) =>
              (sources[COLLECTIVITE_SOURCE_ID]?.valeurs ?? [])
                .filter(
                  ({ dateValeur, periodicite }) =>
                    IndicateurPeriodes.key(
                      IndicateurPeriodes.containing(periodicite, dateValeur)
                    ) === periodeKey
                )
                .map(({ id }) => ({ id, indicateurId: definition.id }))
          );
          await Promise.all(
            valeursToRemove.map(({ id, indicateurId }) =>
              removeValeur({ id, collectiviteId, indicateurId })
            )
          );
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
      [collectiviteId, trpc, queryClient, setToast, removeValeur]
    );
  };
