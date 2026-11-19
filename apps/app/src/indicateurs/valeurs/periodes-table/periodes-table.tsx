import { appLabels } from '@/app/labels/catalog';
import type { IndicateurPeriode } from '@tet/domain/indicateurs';
import { TableCell } from '@tet/ui';
import type { ReactNode, RefObject } from 'react';
import { IndicateurValeursTableFrame } from '../grid/indicateur-valeurs.table-frame';
import { IndicateurValeursTableLegend } from '../grid/indicateur-valeurs.table-legend';
import { PeriodesTableCommentairesFooter } from './periodes-table.commentaires.footer';
import { PeriodesTableHeader } from './periodes-table.header';
import { PeriodesTableRow } from './periodes-table.row';
import type {
  PeriodeTableCommentaires,
  PeriodeTableRow,
} from './periodes-table.types';

type Props = {
  title: string;
  label?: string;
  unite: string;
  periodes: readonly IndicateurPeriode[];
  rows: readonly PeriodeTableRow[];
  deletablePeriodeKeys?: ReadonlySet<string>;
  privatePeriodeKey?: string;
  readonly?: boolean;
  isTitlePinned?: boolean;
  addPeriode?: ReactNode;
  commentaires?: PeriodeTableCommentaires;
  scrollRef?: RefObject<HTMLDivElement | null>;
  onDelete?: (periode: IndicateurPeriode) => void;
};

export const PeriodesTable = ({
  title,
  label = title,
  unite,
  periodes,
  rows,
  deletablePeriodeKeys,
  privatePeriodeKey,
  readonly,
  isTitlePinned,
  addPeriode,
  commentaires,
  scrollRef,
  onDelete,
}: Props) => {
  const showAddPeriodeColumn = Boolean(addPeriode);

  return (
    <div className="flex flex-col gap-2">
      <IndicateurValeursTableLegend />
      <IndicateurValeursTableFrame
        scrollRef={scrollRef}
        persistentScrollbar
        className="border-primary-3"
        maxHeight="none"
        layout="auto"
        role="table"
        aria-label={label}
        data-test="indicateurs.valeurs.table"
      >
        <PeriodesTableHeader
          title={title}
          unite={unite}
          periodes={periodes}
          deletablePeriodeKeys={deletablePeriodeKeys}
          privatePeriodeKey={privatePeriodeKey}
          readonly={readonly}
          isTitlePinned={isTitlePinned}
          addPeriode={addPeriode}
          onDelete={onDelete}
        />
        <tbody>
          {readonly && periodes.length === 0 ? (
            <tr>
              <TableCell className="text-center text-sm text-grey-7">
                {appLabels.aucuneDonneeDisponible}
              </TableCell>
            </tr>
          ) : (
            rows.map((row) => (
              <PeriodesTableRow
                key={row.key}
                row={row}
                periodes={periodes}
                showAddPeriodeColumn={showAddPeriodeColumn}
              />
            ))
          )}
        </tbody>
        {commentaires && (
          <PeriodesTableCommentairesFooter
            periodes={periodes}
            commentaires={commentaires}
            showAddPeriodeColumn={showAddPeriodeColumn}
          />
        )}
      </IndicateurValeursTableFrame>
    </div>
  );
};
