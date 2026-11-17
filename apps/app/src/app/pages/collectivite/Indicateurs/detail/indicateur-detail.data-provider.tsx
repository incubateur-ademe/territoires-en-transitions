'use client';

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
import {
  canUpdateIndicateur,
  canUpdateIndicateurValeur,
} from '@/app/indicateurs/indicateurs/indicateur-authorization.utils';
import { useDeleteIndicateurValeur } from '../data/use-delete-indicateur-valeur';
import { useIndicateurChartInfo } from '../data/use-indicateur-chart';
import { useExportIndicateurs } from '../Indicateur/useExportIndicateurs';
import { getIndicateurPeriodeInputOptions } from '../table/indicateur-periode-input.options';
import { IndicateurChartProvider } from './indicateur-chart.context';
import { IndicateurDefinitionProvider } from './indicateur-definition.context';
import { IndicateurActionsProvider } from './indicateur-actions.context';
import {
  IndicateurValeursProvider,
  type IndicateurValeursValue,
} from './indicateur-valeurs.context';

type Props = PropsWithChildren<{ indicateur: IndicateurDetaille }>;

const IndicateurDefinitionDataProvider = ({ indicateur, children }: Props) => {
  const { mutate: updateIndicateur } = useUpdateIndicateur(indicateur.id);
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
  const value = useMemo(
    () => ({
      indicateur,
      updateIndicateur,
      canMutateIndicateur,
      canMutateValeur,
    }),
    [indicateur, updateIndicateur, canMutateIndicateur, canMutateValeur]
  );

  return (
    <IndicateurDefinitionProvider value={value}>
      {children}
    </IndicateurDefinitionProvider>
  );
};

const IndicateurChartDataProvider = ({ indicateur, children }: Props) => {
  const chartInfo = useIndicateurChartInfo({ indicateur });
  const value = useMemo(() => ({ chartInfo }), [chartInfo]);

  return (
    <IndicateurChartProvider value={value}>{children}</IndicateurChartProvider>
  );
};

const IndicateurValeursDataProvider = ({ indicateur, children }: Props) => {
  const collectiviteId = useCollectiviteId();
  const { id: indicateurId, periodicite } = indicateur;
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

  const value = useMemo<IndicateurValeursValue>(
    () => ({
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
      upsertValeur,
      upsertPeriode,
      declarePeriodes,
      removeValeur,
      collectiviteId,
      indicateurId,
    ]
  );

  return (
    <IndicateurValeursProvider value={value}>
      {children}
    </IndicateurValeursProvider>
  );
};

const IndicateurActionsDataProvider = ({ indicateur, children }: Props) => {
  const { mutate: exportIndicateurs } = useExportIndicateurs({
    mode: 'selection',
    indicateurIds: [indicateur.id],
  });
  const { mutate: deleteIndicateur } = useDeleteIndicateur(indicateur.id);
  const value = useMemo(
    () => ({
      exportIndicateur: () => exportIndicateurs(),
      deleteIndicateur: () => deleteIndicateur(),
    }),
    [exportIndicateurs, deleteIndicateur]
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
  <IndicateurDefinitionDataProvider indicateur={indicateur}>
    <IndicateurChartDataProvider indicateur={indicateur}>
      <IndicateurValeursDataProvider indicateur={indicateur}>
        <IndicateurActionsDataProvider indicateur={indicateur}>
          {children}
        </IndicateurActionsDataProvider>
      </IndicateurValeursDataProvider>
    </IndicateurChartDataProvider>
  </IndicateurDefinitionDataProvider>
);
