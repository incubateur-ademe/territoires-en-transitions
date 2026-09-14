import {
  assertAnnualIndicateurPeriodicite,
  toAnnualIndicateurYear,
  type IndicateurDefinition,
  type IndicateurValeur,
} from '@tet/domain/indicateurs';
import type { IndicateurTableRow } from '../../../../indicateurs/valeurs/grid/types';
import type { DiagnosticIndicateurTable } from './indicateur-tab.layout';

export const buildDiagnosticIndicateurTableRows = (
  table: DiagnosticIndicateurTable
): IndicateurTableRow[] => {
  const definitionByIdentifiant = new Map<string, IndicateurDefinition>();
  for (const definition of table.indicateurDefinitions) {
    assertAnnualIndicateurPeriodicite(
      definition.periodicite,
      'Diagnostic PCAET'
    );
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
    for (const valeur of valeursByIndicateurId.get(indicateurDefinition.id) ??
      []) {
      toAnnualIndicateurYear(
        indicateurDefinition.periodicite,
        valeur.dateValeur,
        'Diagnostic PCAET'
      );
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
