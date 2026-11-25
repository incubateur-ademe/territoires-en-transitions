import type { PeriodeTableRow } from '@/app/indicateurs/valeurs/periodes-table/periodes-table.types';
import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import type { SourceType } from '../types';
import { CellSourceName } from './cell-source-name';
import type { IndicateurTableSource } from './prepare-indicateur-table-data';

type SourceValues = NonNullable<IndicateurTableSource['resultats']>['valeurs'];

const findValeurOfPeriode = ({
  valeurs,
  periode,
}: {
  valeurs: SourceValues | undefined;
  periode: IndicateurPeriode;
}): number | null =>
  valeurs?.find(
    (value) =>
      IndicateurPeriodes.key(value.periode) === IndicateurPeriodes.key(periode)
  )?.valeur ?? null;

export const toSourceTableRows = ({
  sources,
  readonly,
  periodicite,
  onSave,
}: {
  sources: readonly IndicateurTableSource[];
  readonly?: boolean;
  periodicite: IndicateurPeriode['periodicite'];
  onSave: (
    periode: IndicateurPeriode,
    type: SourceType,
    value: number | null
  ) => Promise<boolean>;
}): PeriodeTableRow[] =>
  sources.map((row) => {
    const isLocal = row.source.source === 'collectivite';
    return {
      key: row.key,
      title: (
        <CellSourceName
          source={row.source}
          type={row.resultats ? 'resultat' : 'objectif'}
        />
      ),
      cellOf: (periode) => ({
        kind: 'valeurs',
        resultat: findValeurOfPeriode({
          valeurs: row.resultats?.valeurs,
          periode,
        }),
        objectif: findValeurOfPeriode({
          valeurs: row.objectifs?.valeurs,
          periode,
        }),
        isReadonly:
          Boolean(readonly) || !isLocal || periode.periodicite !== periodicite,
        emptyLabel: isLocal
          ? appLabels.indicateurValeurAbsente
          : appLabels.indicateurDonneeIndisponible,
        dataSource: row.source.source,
      }),
      onSave,
    };
  });
