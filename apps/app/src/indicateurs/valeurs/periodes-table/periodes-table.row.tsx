import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { cn, TableCell } from '@tet/ui';
import { IndicateurValeursCombinedCell } from '../grid/indicateur-valeurs-combined.cell';
import { ADD_PERIODE_CELL_CLASSNAME } from './periodes-table.styles';
import type { PeriodeTableCell, PeriodeTableRow } from './periodes-table.types';

type Props = {
  row: PeriodeTableRow;
  periodes: readonly IndicateurPeriode[];
  showAddPeriodeColumn: boolean;
};

const PeriodeCell = ({
  cell,
  periode,
  row,
}: {
  cell: PeriodeTableCell;
  periode: IndicateurPeriode;
  row: PeriodeTableRow;
}) => {
  if (cell.kind === 'contenu') {
    return (
      <TableCell
        className={cn(
          'border-b border-r border-primary-4 whitespace-nowrap text-center',
          cell.isBold && 'font-bold'
        )}
        data-periode={periode.dateDebut}
        data-periodicite={periode.periodicite}
      >
        {cell.content}
      </TableCell>
    );
  }
  return (
    <TableCell
      className="border-b border-r border-primary-4 !px-2"
      data-periode={periode.dateDebut}
      data-periodicite={periode.periodicite}
      data-source={cell.dataSource}
    >
      <IndicateurValeursCombinedCell
        periodeLabel={IndicateurPeriodes.format(periode)}
        resultat={cell.resultat}
        objectif={cell.objectif}
        readonly={cell.isReadonly}
        emptyLabel={cell.emptyLabel}
        isFuture={IndicateurPeriodes.isFuture(periode)}
        onSave={(field, value) => row.onSave(periode, field, value)}
      />
    </TableCell>
  );
};

export const PeriodesTableRow = ({
  row,
  periodes,
  showAddPeriodeColumn,
}: Props) => (
  <tr>
    {row.title}
    {periodes.map((periode) => (
      <PeriodeCell
        key={IndicateurPeriodes.key(periode)}
        cell={row.cellOf(periode)}
        periode={periode}
        row={row}
      />
    ))}
    {showAddPeriodeColumn && (
      <TableCell
        className={`${ADD_PERIODE_CELL_CLASSNAME} border-b border-primary-4`}
      />
    )}
  </tr>
);
