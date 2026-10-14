import { IndicateurValeursCombinedCell } from '@/app/indicateurs/valeurs/grid/indicateur-valeurs-combined.cell';
import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { TableCell } from '@tet/ui';
import type { GetColorBySourceId } from '../data/use-indicateur-sources';
import type { SourceType } from '../types';
import { CellSourceName } from './cell-source-name';
import { ADD_PERIODE_CELL_CLASSNAME } from './indicateur-valeurs-table.styles';
import type { IndicateurTableSource } from './prepare-indicateur-table-data';

type Props = {
  row: IndicateurTableSource;
  periodes: readonly IndicateurPeriode[];
  readonly?: boolean;
  showAddPeriodeColumn: boolean;
  getColorBySourceId: GetColorBySourceId;
  onSave: (
    periode: IndicateurPeriode,
    type: SourceType,
    value: number | null
  ) => Promise<boolean>;
};

export const IndicateurValeursTableSourceRow = ({
  row,
  periodes,
  readonly,
  showAddPeriodeColumn,
  getColorBySourceId,
  onSave,
}: Props) => {
  const isLocal = row.source.source === 'collectivite';

  return (
    <tr>
      <CellSourceName
        source={row.source}
        type={row.resultats ? 'resultat' : 'objectif'}
        getColorBySourceId={getColorBySourceId}
      />
      {periodes.map((periode) => {
        const key = IndicateurPeriodes.key(periode);
        const resultat = row.resultats?.valeurs.find(
          (value) => IndicateurPeriodes.key(value.periode) === key
        );
        const objectif = row.objectifs?.valeurs.find(
          (value) => IndicateurPeriodes.key(value.periode) === key
        );
        return (
          <TableCell
            key={key}
            className="border-b border-r border-primary-4 !px-2"
            data-periode={periode.dateDebut}
            data-periodicite={periode.periodicite}
            data-source={row.source.source}
          >
            <IndicateurValeursCombinedCell
              periodeLabel={IndicateurPeriodes.format(periode)}
              resultat={resultat?.valeur ?? null}
              objectif={objectif?.valeur ?? null}
              readonly={readonly || !isLocal}
              emptyLabel={
                isLocal
                  ? appLabels.indicateurValeurAbsente
                  : appLabels.indicateurDonneeIndisponible
              }
              isFuture={IndicateurPeriodes.isFuture(periode)}
              onSave={(type, value) => onSave(periode, type, value)}
            />
          </TableCell>
        );
      })}
      {showAddPeriodeColumn && (
        <TableCell
          className={`${ADD_PERIODE_CELL_CLASSNAME} border-b border-primary-4`}
        />
      )}
    </tr>
  );
};
