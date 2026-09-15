'use client';

import {
  deriveReferenceYearFromIndicateurValeurYears,
  PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS,
} from '@tet/domain/demarches';
import { toAnnualIndicateurYear } from '@tet/domain/indicateurs';
import { useCallback, useMemo, useState } from 'react';
import {
  isUnsetReferenceYear,
  type IndicateurTableRow,
} from '../../../../indicateurs/valeurs/grid/types';
import { useSetDiagnosticReferenceYear } from '../data/use-set-diagnostic-reference-year';
import type { DiagnosticIndicateurTable } from './indicateur-tab.layout';
import { buildDiagnosticIndicateurTableRows } from './diagnostic-indicateur-table.adapter';

const OBJECTIF_YEARS = PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS;

type DiagnosticIndicateurValeursTable = {
  rows: IndicateurTableRow[];
  years: number[];
  referenceYear: number | null;
  unit: string;

  onReferenceYearChange?: (year: number) => void;
};

export const useDiagnosticIndicateurValeursTable = ({
  demarcheId,
  table,
  isReadonly,
}: {
  demarcheId: number;
  table: DiagnosticIndicateurTable;
  isReadonly: boolean;
}): DiagnosticIndicateurValeursTable => {
  const { setReferenceYear } = useSetDiagnosticReferenceYear(demarcheId);
  const rows = useMemo(
    () => buildDiagnosticIndicateurTableRows(table),
    [table]
  );
  const derivedReferenceYear = useMemo(
    () =>
      deriveReferenceYearFromIndicateurValeurYears({
        resultYears: rows.flatMap((row) =>
          row.indicateurValeurs.map((valeur) =>
            toAnnualIndicateurYear(
              row.indicateurDefinition.periodicite,
              valeur.dateValeur,
              'Diagnostic PCAET'
            )
          )
        ),
      }),
    [rows]
  );

  const [referenceYearOverride, setReferenceYearOverride] = useState<
    number | null
  >(null);

  const referenceYear = referenceYearOverride ?? derivedReferenceYear ?? 0;

  const years = [referenceYear, ...OBJECTIF_YEARS];

  const unit = rows[0]?.indicateurDefinition.unite;

  /**
   * L'année affichée passe tout de suite à `nextYear` : le serveur ne stocke
   * pas l'année de référence, il ne peut donc pas la confirmer quand le tableau
   * est encore vierge. Il ne reste qu'à lui faire suivre les valeurs déjà
   * saisies.
   */
  const onReferenceYearChange = useCallback(
    (nextYear: number) => {
      if (isReadonly) return;
      setReferenceYearOverride(nextYear);

      if (isUnsetReferenceYear(referenceYear) || referenceYear === nextYear) {
        return;
      }

      void setReferenceYear({
        indicateurIds: rows.map((row) => row.indicateurId),
        fromYear: referenceYear,
        toYear: nextYear,
      });
    },
    [isReadonly, referenceYear, rows, setReferenceYear]
  );

  return {
    rows,
    years,
    referenceYear,
    unit,
    onReferenceYearChange: isReadonly ? undefined : onReferenceYearChange,
  };
};
