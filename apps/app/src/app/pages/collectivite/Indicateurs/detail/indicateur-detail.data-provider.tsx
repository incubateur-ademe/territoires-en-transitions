'use client';

import {
  canUpdateIndicateur,
  canUpdateIndicateurValeur,
} from '@/app/indicateurs/indicateurs/indicateur-authorization.utils';
import { useDeleteIndicateur } from '@/app/indicateurs/indicateurs/use-delete-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { useDeclareIndicateurPeriodes } from '@/app/indicateurs/valeurs/use-declare-indicateur-periodes';
import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';
import {
  useCollectiviteId,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { type PropsWithChildren, useMemo } from 'react';
import { useDeleteIndicateurValeur } from '../data/use-delete-indicateur-valeur';
import { useIndicateurChartInfo } from '../data/use-indicateur-chart';
import { useExportIndicateurs } from '../Indicateur/useExportIndicateurs';
import { getIndicateurPeriodeInputOptions } from '../table/indicateur-periode-input.options';
import {
  IndicateurActionsProvider,
  type IndicateurActionsValue,
} from './indicateur-actions.context';
import {
  IndicateurDataProvider,
  type IndicateurDataValue,
} from './indicateur-data.context';

type Props = PropsWithChildren<{ indicateur: IndicateurDetaille }>;

const IndicateurDataQueriesProvider = ({ indicateur, children }: Props) => {
  const chartInfo = useIndicateurChartInfo({ indicateur });
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const { id: userId } = useUser();
  const canMutateIndicateur = canUpdateIndicateur(
    hasCollectivitePermission,
    indicateur,
    userId
  );
  const canMutateValeur = canUpdateIndicateurValeur(
    hasCollectivitePermission,
    indicateur,
    userId
  );
  const value = useMemo<IndicateurDataValue>(
    () => ({ indicateur, chartInfo, canMutateIndicateur, canMutateValeur }),
    [indicateur, chartInfo, canMutateIndicateur, canMutateValeur]
  );

  return (
    <IndicateurDataProvider value={value}>{children}</IndicateurDataProvider>
  );
};

const IndicateurActionsMutationsProvider = ({
  indicateur,
  children,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  const { id: indicateurId, periodicite } = indicateur;
  const { mutate: updateIndicateur } = useUpdateIndicateur(indicateurId);
  const { mutate: exportIndicateurs } = useExportIndicateurs({
    mode: 'selection',
    indicateurIds: [indicateurId],
  });
  const { mutate: removeIndicateur } = useDeleteIndicateur(indicateurId);
  const { mutateAsync: upsertValeur } = useUpsertIndicateurValeur();
  const { mutateAsync: upsertPeriode } = useUpsertIndicateurValeur({
    successMessage:
      periodicite === undefined
        ? undefined
        : getIndicateurPeriodeInputOptions(periodicite).success,
    disableErrorToast: true,
  });
  const declarePeriodes = useDeclareIndicateurPeriodes(
    collectiviteId,
    indicateurId
  );
  const { mutateAsync: removeValeur } = useDeleteIndicateurValeur();

  const value = useMemo<IndicateurActionsValue>(
    () => ({
      updateIndicateur,
      exportIndicateur: () => exportIndicateurs(),
      deleteIndicateur: () => removeIndicateur(),
      saveValeur: async (input) => {
        await upsertValeur({ ...input, collectiviteId, indicateurId });
      },
      declarePeriode: async ({ periodicite, dateDebut }) => {
        await upsertPeriode({
          periodicite,
          dateValeur: dateDebut,
          collectiviteId,
          indicateurId,
        });
      },
      declarePeriodes,
      deleteValeur: async (valeurId) => {
        await removeValeur({ id: valeurId, collectiviteId, indicateurId });
      },
    }),
    [
      updateIndicateur,
      exportIndicateurs,
      removeIndicateur,
      upsertValeur,
      upsertPeriode,
      declarePeriodes,
      removeValeur,
      collectiviteId,
      indicateurId,
    ]
  );

  return (
    <IndicateurActionsProvider value={value}>
      {children}
    </IndicateurActionsProvider>
  );
};

export const IndicateurDetailDataProvider = ({
  indicateur,
  children,
}: Props) => (
  <IndicateurDataQueriesProvider indicateur={indicateur}>
    <IndicateurActionsMutationsProvider indicateur={indicateur}>
      {children}
    </IndicateurActionsMutationsProvider>
  </IndicateurDataQueriesProvider>
);
