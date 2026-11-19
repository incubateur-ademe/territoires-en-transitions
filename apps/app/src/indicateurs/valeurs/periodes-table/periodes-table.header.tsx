import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { Button, Icon, TableHead, TableHeaderCell, Tooltip } from '@tet/ui';
import type { ReactNode } from 'react';
import { IndicateurHeaderTitleCell } from '../grid/indicateur-title.header-cell';
import { IndicateurValeurPeriodeHeaderCell } from '../grid/indicateur-valeur-periode.header-cell';
import { ADD_PERIODE_CELL_CLASSNAME } from './periodes-table.styles';

const NO_DELETABLE_PERIODE_KEYS: ReadonlySet<string> = new Set();

type Props = {
  title: string;
  unite: string;
  periodes: readonly IndicateurPeriode[];
  deletablePeriodeKeys?: ReadonlySet<string>;
  privatePeriodeKey?: string;
  readonly?: boolean;
  addPeriode?: ReactNode;
  onDelete?: (periode: IndicateurPeriode) => void;
};

export const PeriodesTableHeader = ({
  title,
  unite,
  periodes,
  deletablePeriodeKeys = NO_DELETABLE_PERIODE_KEYS,
  privatePeriodeKey,
  readonly,
  addPeriode,
  onDelete,
}: Props) => (
  <TableHead className="static shadow-none">
    <tr>
      <IndicateurHeaderTitleCell
        title={title}
        unit={unite}
        pinnedLeft={false}
        className="border-b border-r border-primary-4"
      />
      {periodes.map((periode) => {
        const key = IndicateurPeriodes.key(periode);
        const label = IndicateurPeriodes.format(periode);
        return (
          <IndicateurValeurPeriodeHeaderCell
            key={key}
            label={<span>{label}</span>}
            className="static w-52 min-w-52 border-b border-primary-4 bg-primary-2 text-primary-9"
          >
            {privatePeriodeKey === key && (
              <Tooltip label={appLabels.resultatModePrive}>
                <span tabIndex={0}>
                  <Icon icon="lock-fill" size="sm" />
                </span>
              </Tooltip>
            )}
            {onDelete && deletablePeriodeKeys.has(key) && !readonly && (
              <Button
                icon="delete-bin-6-line"
                size="xs"
                variant="white"
                className="!bg-transparent !border-transparent"
                title={appLabels.indicateurSupprimerPeriode(label)}
                aria-label={appLabels.indicateurSupprimerPeriode(label)}
                onClick={() => onDelete(periode)}
                data-test="indicateurs.valeurs.periode.delete"
              />
            )}
          </IndicateurValeurPeriodeHeaderCell>
        );
      })}
      {addPeriode && (
        <TableHeaderCell
          scope="col"
          data-pinned="right"
          className={`${ADD_PERIODE_CELL_CLASSNAME} align-middle border-b border-primary-4 bg-primary-2`}
        >
          {addPeriode}
        </TableHeaderCell>
      )}
    </tr>
  </TableHead>
);
