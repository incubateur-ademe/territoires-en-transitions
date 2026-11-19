'use client';

import { PeriodesTable } from '@/app/indicateurs/valeurs/periodes-table/periodes-table';
import type { SousIndicateursTableData } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import type { IndicateurPeriodicite } from '@tet/domain/indicateurs';
import type { JSX, PropsWithChildren } from 'react';
import { useIndicateurSousIndicateursTable } from '../../context/indicateur-sous-indicateurs-table.context';
import { toSousIndicateurTable } from './to-sous-indicateur-table-rows';
import { useSousIndicateurRowsExpansion } from './use-sous-indicateur-rows-expansion';

type Props = {
  indicateurId: number;
  titre: string;
  unite: string;
  periodicite: IndicateurPeriodicite;
};

type ReadyTableProps = Omit<Props, 'indicateurId'> & {
  collectiviteId: number;
  data: SousIndicateursTableData;
};

const StatusMessage = ({
  role,
  children,
}: PropsWithChildren<{ role?: 'alert' }>): JSX.Element => (
  <p role={role} className="text-center text-sm text-grey-7">
    {children}
  </p>
);

const LoadingState = (): JSX.Element => (
  <div role="status" className="my-8 flex justify-center">
    <SpinnerLoader className="mx-auto" />
    <span className="sr-only">
      {appLabels.indicateurSousIndicateursChargement}
    </span>
  </div>
);

const ReadyTable = ({
  titre,
  unite,
  periodicite,
  collectiviteId,
  data,
}: ReadyTableProps): JSX.Element => {
  const { visibleRows, isExpanded, toggle } = useSousIndicateurRowsExpansion(
    data.rows
  );
  const { periodes, rows } = toSousIndicateurTable({
    data,
    visibleRows,
    periodicite,
    collectiviteId,
    isExpanded,
    onToggle: toggle,
  });

  return (
    <PeriodesTable
      title={titre}
      label={appLabels.indicateurSousIndicateursValeurs}
      unite={unite}
      periodes={periodes}
      rows={rows}
      readonly
      isTitlePinned
    />
  );
};

export const IndicateurSousIndicateursTable = ({
  indicateurId,
  titre,
  unite,
  periodicite,
}: Props): JSX.Element => {
  const { useSousIndicateursTable } = useIndicateurSousIndicateursTable();
  const state = useSousIndicateursTable(indicateurId);

  if (state.status === 'loading') {
    return <LoadingState />;
  }
  if (state.status === 'error') {
    return (
      <StatusMessage role="alert">
        {appLabels.indicateurSousIndicateursErreur}
      </StatusMessage>
    );
  }
  if (state.data.rows.length === 0) {
    return <StatusMessage>{appLabels.aucuneDonneeDisponible}</StatusMessage>;
  }

  return (
    <ReadyTable
      titre={titre}
      unite={unite}
      periodicite={periodicite}
      collectiviteId={state.collectiviteId}
      data={state.data}
    />
  );
};
