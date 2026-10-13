import type { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { IndicateurHeaderTitleCell } from '@/app/indicateurs/valeurs/grid/indicateur-title.header-cell';
import { IndicateurValeurPeriodeHeaderCell } from '@/app/indicateurs/valeurs/grid/indicateur-valeur-periode.header-cell';
import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { Button, Icon, TableHead, TableHeaderCell, Tooltip } from '@tet/ui';
import type { ReactNode } from 'react';
import type { IndicateurPeriodeValue } from '../data/prepare-indicateur-periode-data';
import { ADD_PERIODE_CELL_CLASSNAME } from './indicateur-valeurs-table.styles';

type Props = {
  definition: Pick<IndicateurDefinition, 'titre' | 'unite'>;
  periodes: readonly IndicateurPeriode[];
  localValues: readonly IndicateurPeriodeValue[];
  privatePeriode?: IndicateurPeriode;
  readonly?: boolean;
  addPeriode?: ReactNode;
  onDelete: (periode: IndicateurPeriode) => void;
};

export const IndicateurValeursTableHeader = ({
  definition,
  periodes,
  localValues,
  privatePeriode,
  readonly,
  addPeriode,
  onDelete,
}: Props) => {
  const deletablePeriodeKeys = new Set(
    localValues.map(({ periode }) => IndicateurPeriodes.key(periode))
  );
  const privatePeriodeKey = privatePeriode
    ? IndicateurPeriodes.key(privatePeriode)
    : undefined;

  return (
    <TableHead className="static shadow-none">
      <tr>
        <IndicateurHeaderTitleCell
          title={definition.titre}
          unit={definition.unite}
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
              {deletablePeriodeKeys.has(key) && !readonly && (
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
            className={`${ADD_PERIODE_CELL_CLASSNAME} align-middle border-b border-primary-4 bg-primary-2`}
          >
            {addPeriode}
          </TableHeaderCell>
        )}
      </tr>
    </TableHead>
  );
};
