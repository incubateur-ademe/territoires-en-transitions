import type { PeriodeTableRow } from '@/app/indicateurs/valeurs/periodes-table/periodes-table.types';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import type { IndicateurPeriodeData } from '../../../data/prepare-indicateur-periode-data';
import { prepareIndicateurTableData } from '../../../table/prepare-indicateur-table-data';
import { toSourceTableRows } from '../../../table/to-source-table-rows';
import type { IndicateurActionsValue } from '../../context/indicateur-actions.context';

export const toValeursPropresTable = ({
  resultats,
  objectifs,
  periodicite,
  canWrite,
  saveValeur,
}: {
  resultats: IndicateurPeriodeData;
  objectifs: IndicateurPeriodeData;
  periodicite: IndicateurPeriodicite;
  canWrite: boolean;
  saveValeur: IndicateurActionsValue['saveValeur'];
}): { periodes: IndicateurPeriode[]; rows: PeriodeTableRow[] } => {
  const { sources, periodes } = prepareIndicateurTableData(
    resultats,
    objectifs
  );
  return {
    periodes,
    rows: toSourceTableRows({
      sources,
      readonly: !canWrite,
      periodicite,
      onSave: async (periode, type, value) => {
        if (!canWrite) return false;
        try {
          await saveValeur({
            id: resultats.valeursExistantes.find(
              (valeur) =>
                IndicateurPeriodes.key(valeur.periode) ===
                IndicateurPeriodes.key(periode)
            )?.id,
            dateValeur: periode.dateDebut,
            periodicite: periode.periodicite,
            [type]: value,
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
  };
};
