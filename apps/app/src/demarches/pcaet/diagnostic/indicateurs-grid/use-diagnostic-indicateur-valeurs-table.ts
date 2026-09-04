'use client';

import {
  deriveReferenceYearFromIndicateurValeurYears,
  PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS,
} from '@tet/domain/demarches';
import {
  getYearFromIsoDate,
  IndicateurDefinition,
  IndicateurValeur,
} from '@tet/domain/indicateurs';
import { useCallback, useMemo, useState } from 'react';
import {
  isUnsetReferenceYear,
  type IndicateurTableRow,
} from '../../../../indicateurs/valeurs/grid/types';
import { useSetDiagnosticReferenceYear } from '../data/use-set-diagnostic-reference-year';
import type { DiagnosticIndicateurTable } from './indicateur-tab.layout';

const OBJECTIF_YEARS = PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS;

const toGridRows = (table: DiagnosticIndicateurTable): IndicateurTableRow[] => {
  const definitionByIdentifiant = new Map<string, IndicateurDefinition>();
  for (const definition of table.indicateurDefinitions) {
    const identifiant = definition.identifiantReferentiel;
    if (identifiant === null || identifiant === undefined) {
      continue;
    }
    definitionByIdentifiant.set(identifiant, definition);
  }

  const valeursByIndicateurId = new Map<number, IndicateurValeur[]>();
  for (const { indicateurValeur } of table.indicateurValeurs) {
    const valeurs =
      valeursByIndicateurId.get(indicateurValeur.indicateurId) ?? [];
    valeurs.push(indicateurValeur);
    valeursByIndicateurId.set(indicateurValeur.indicateurId, valeurs);
  }

  return table.rows.flatMap((row) => {
    const indicateurDefinition = definitionByIdentifiant.get(
      row.indicateurDefinitionId
    );
    if (indicateurDefinition === undefined) {
      return [];
    }
    return [
      {
        indicateurId: indicateurDefinition.id,
        indicateurDefinition,
        indicateurValeurs:
          valeursByIndicateurId.get(indicateurDefinition.id) ?? [],
        indicateurLabel: row.label,
        optionalYears: row.optionalYears,
      },
    ];
  });
};

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
  const rows = useMemo(() => toGridRows(table), [table]);
  const derivedReferenceYear = useMemo(
    () =>
      deriveReferenceYearFromIndicateurValeurYears({
        resultYears: rows.flatMap((row) =>
          row.indicateurValeurs.map((valeur) =>
            getYearFromIsoDate(valeur.dateValeur)
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
    [referenceYear, rows, setReferenceYear]
  );

  return {
    rows,
    years,
    referenceYear,
    unit,
    onReferenceYearChange: isReadonly ? undefined : onReferenceYearChange,
  };
};
