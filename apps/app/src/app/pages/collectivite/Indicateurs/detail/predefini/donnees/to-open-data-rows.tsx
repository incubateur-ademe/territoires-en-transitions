import type { SousIndicateurOpenData } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-open-data.rules';
import type { SousIndicateurTableRow } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import type { PeriodeTableRow } from '@/app/indicateurs/valeurs/periodes-table/periodes-table.types';
import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { SousIndicateurRowHeaderCell } from '../../content/sous-indicateurs/sous-indicateur-row-header.cell';

const INDENTATION_REM_PER_DEPTH = 1.5;
const MOYENNE_SOURCE_ID = 'moyenne';

type DatedValeur = Readonly<{
  dateValeur: string;
  resultat: number | null;
  objectif: number | null;
}>;

const toValeurByPeriodeKey = ({
  valeurs,
  periodicite,
}: {
  valeurs: readonly DatedValeur[];
  periodicite: IndicateurPeriodicite;
}): ReadonlyMap<string, DatedValeur> =>
  new Map(
    valeurs
      .toReversed()
      .map((valeur) => [
        IndicateurPeriodes.key(
          IndicateurPeriodes.containing(periodicite, valeur.dateValeur)
        ),
        valeur,
      ])
  );

const toReadonlyRow = ({
  key,
  label,
  row,
  valeurs,
  periodicite,
  sourceId,
}: {
  key: string;
  label: string;
  row: Pick<SousIndicateurTableRow, 'color' | 'depth'>;
  valeurs: readonly DatedValeur[];
  periodicite: IndicateurPeriodicite;
  sourceId: string;
}): PeriodeTableRow => {
  const valeurByPeriodeKey = toValeurByPeriodeKey({ valeurs, periodicite });
  return {
    key,
    title: (
      <SousIndicateurRowHeaderCell
        color={row.color}
        indentationRem={row.depth * INDENTATION_REM_PER_DEPTH}
        toggle={<span aria-hidden />}
      >
        {label}
      </SousIndicateurRowHeaderCell>
    ),
    cellOf: (periode) => {
      const valeur = valeurByPeriodeKey.get(IndicateurPeriodes.key(periode));
      return {
        kind: 'valeurs',
        resultat: valeur?.resultat ?? null,
        objectif: valeur?.objectif ?? null,
        isReadonly: true,
        emptyLabel: appLabels.indicateurDonneeIndisponible,
        dataSource: sourceId,
      };
    },
    onSave: () => Promise.resolve(false),
  };
};

export const toOpenDataRows = ({
  row,
  openData,
  periodicite,
}: {
  row: Pick<SousIndicateurTableRow, 'rowKey' | 'color' | 'depth'>;
  openData: SousIndicateurOpenData;
  periodicite: IndicateurPeriodicite;
}): PeriodeTableRow[] => [
  ...openData.sources.map((source) =>
    toReadonlyRow({
      key: `${row.rowKey}/${source.id}`,
      label: appLabels.indicateurSousIndicateurResultatsSource({
        source: source.label,
      }),
      row,
      valeurs: source.valeurs,
      periodicite,
      sourceId: source.id,
    })
  ),
  ...(openData.moyenne
    ? [
        toReadonlyRow({
          key: `${row.rowKey}/${MOYENNE_SOURCE_ID}`,
          label: appLabels.sourceMoyenne,
          row,
          valeurs: openData.moyenne.valeurs.map(({ dateValeur, valeur }) => ({
            dateValeur,
            resultat: valeur,
            objectif: null,
          })),
          periodicite,
          sourceId: MOYENNE_SOURCE_ID,
        }),
      ]
    : []),
];
