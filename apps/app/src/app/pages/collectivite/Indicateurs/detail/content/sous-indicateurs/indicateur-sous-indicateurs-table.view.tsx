'use client';

import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { toSousIndicateurPeriodLabel } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-period-label';
import { SOUS_INDICATEURS_TOTAL_COLOR } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-colors';
import type {
  SousIndicateurRowCell,
  SousIndicateursTableData,
  SousIndicateurTableRow,
} from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import { IndicateurHeaderTitleCell } from '@/app/indicateurs/valeurs/grid/indicateur-title.header-cell';
import { IndicateurValeursTableFrame } from '@/app/indicateurs/valeurs/grid/indicateur-valeurs.table-frame';
import { IndicateurValeursTableLegend } from '@/app/indicateurs/valeurs/grid/indicateur-valeurs.table-legend';
import { IndicateurValeurPeriodeHeaderCell } from '@/app/indicateurs/valeurs/grid/indicateur-valeur-periode.header-cell';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { cn, TableCell, TableHead, TableRow } from '@tet/ui';
import type { IndicateurPeriodicite } from '@tet/domain/indicateurs';
import Link from 'next/link';
import type { JSX, PropsWithChildren } from 'react';
import { useIndicateurSousIndicateursTable } from '../../context/indicateur-sous-indicateurs-table.context';
import { SousIndicateurExpandToggle } from './sous-indicateur-expand.toggle';
import { SousIndicateurRowHeaderCell } from './sous-indicateur-row-header.cell';
import { SousIndicateurYearCell } from './sous-indicateur-period.cell';
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

type SousIndicateurRowProps = {
  row: SousIndicateurTableRow;
  collectiviteId: number;
  isExpanded: boolean;
  onToggle: () => void;
};

const INDENTATION_REM_PER_DEPTH = 1.5;

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

const ValeurCells = ({
  cells,
  isBold = false,
}: {
  cells: readonly SousIndicateurRowCell[];
  isBold?: boolean;
}): JSX.Element => (
  <>
    {cells.map(({ dateValeur, resultat, objectif }) => (
      <TableCell
        key={dateValeur}
        className={cn(
          'border-b border-r border-grey-3 whitespace-nowrap text-center',
          isBold && 'font-bold'
        )}
      >
        <SousIndicateurYearCell resultat={resultat} objectif={objectif} />
      </TableCell>
    ))}
  </>
);

const SousIndicateurRow = ({
  row,
  collectiviteId,
  isExpanded,
  onToggle,
}: SousIndicateurRowProps): JSX.Element => (
  <TableRow>
    <SousIndicateurRowHeaderCell
      color={row.color}
      indentationRem={row.depth * INDENTATION_REM_PER_DEPTH}
      toggle={
        row.isExpandable ? (
          <SousIndicateurExpandToggle
            label={row.label}
            isExpanded={isExpanded}
            onToggle={onToggle}
          />
        ) : null
      }
    >
      <Link
        className="text-primary-9 underline"
        href={makeCollectiviteIndicateursUrl({
          collectiviteId,
          indicateurView: 'perso',
          indicateurId: row.indicateurId,
        })}
      >
        {row.label}
      </Link>{' '}
      <span className="sr-only">
        {appLabels.indicateurSousIndicateurNiveau({ niveau: row.depth + 1 })}
      </span>
    </SousIndicateurRowHeaderCell>
    <ValeurCells cells={row.cells} />
  </TableRow>
);

const TotalRow = ({
  cells,
}: {
  cells: readonly SousIndicateurRowCell[];
}): JSX.Element => (
  <TableRow>
    <SousIndicateurRowHeaderCell color={SOUS_INDICATEURS_TOTAL_COLOR} isBold>
      {appLabels.indicateurSousIndicateursTotalSomme}
    </SousIndicateurRowHeaderCell>
    <ValeurCells cells={cells} isBold />
  </TableRow>
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

  return (
    <div className="flex flex-col gap-4">
      <IndicateurValeursTableLegend />
      <IndicateurValeursTableFrame
        maxHeight="none"
        layout="auto"
        role="table"
        aria-label={appLabels.indicateurSousIndicateursValeurs}
      >
        <TableHead>
          <TableRow>
            <IndicateurHeaderTitleCell title={titre} unit={unite} />
            {data.columns.map(({ dateValeur }) => (
              <IndicateurValeurPeriodeHeaderCell
                key={dateValeur}
                label={
                  <span>
                    {toSousIndicateurPeriodLabel({ periodicite, dateValeur })}
                  </span>
                }
              />
            ))}
          </TableRow>
        </TableHead>
        <tbody>
          {data.hasTotalRow && <TotalRow cells={data.totalCells} />}
          {visibleRows.map((row) => (
            <SousIndicateurRow
              key={row.rowKey}
              row={row}
              collectiviteId={collectiviteId}
              isExpanded={isExpanded(row.rowKey)}
              onToggle={() => toggle(row.rowKey)}
            />
          ))}
        </tbody>
      </IndicateurValeursTableFrame>
    </div>
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
