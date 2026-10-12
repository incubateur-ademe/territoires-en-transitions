import type { PcaetDiagnosticIndicateurDefinition } from '@tet/domain/demarches';
import {
  toAnnualIndicateurYear,
  type IndicateurPeriod,
  type IndicateurValeur,
} from '@tet/domain/indicateurs';
import type { IndicateurValeursTableMeta } from '../../../../indicateurs/valeurs/grid/utils';
import type { IndicateurTableRow } from '../../../../indicateurs/valeurs/grid/types';
import type { DiagnosticIndicateurTable } from './indicateur-tab.layout';

export const buildDiagnosticIndicateurTableRows = (
  table: DiagnosticIndicateurTable
): IndicateurTableRow[] => {
  const definitionByIdentifiant = new Map<
    string,
    PcaetDiagnosticIndicateurDefinition
  >();
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
        isValeurRequired: (period: IndicateurPeriod | null) => {
          if (
            !indicateurDefinition.isApplicable ||
            row.optionalYears === 'all'
          ) {
            return false;
          }
          // La référence reste requise tant qu'aucune période n'est choisie.
          return (
            period === null ||
            !row.optionalYears.includes(
              toAnnualIndicateurYear(
                period.periodicite,
                period.dateDebut,
                'Diagnostic PCAET'
              )
            )
          );
        },
        isApplicable: indicateurDefinition.isApplicable,
      },
    ];
  });
};

export const buildDiagnosticIndicateurValeurInput = ({
  indicateurId,
  period,
  field,
  value,
}: Parameters<IndicateurValeursTableMeta['updateIndicateurValeurs']>[0]) => ({
  indicateurId,
  year: toAnnualIndicateurYear(
    period.periodicite,
    period.dateDebut,
    'Diagnostic PCAET'
  ),
  field,
  value,
});
