import type { PcaetDiagnosticIndicateurDefinition } from '@tet/domain/demarches';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
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
        isValeurRequired: (periode: IndicateurPeriode | null) => {
          if (
            !indicateurDefinition.isApplicable ||
            row.optionalYears === 'all'
          ) {
            return false;
          }
          // La référence reste requise tant qu'aucune période n'est choisie.
          return (
            periode === null ||
            !row.optionalYears.includes(
              IndicateurPeriodes.toAnnualYear(
                periode.periodicite,
                periode.dateDebut,
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
  periode,
  field,
  value,
}: Parameters<IndicateurValeursTableMeta['updateIndicateurValeurs']>[0]) => ({
  indicateurId,
  year: IndicateurPeriodes.toAnnualYear(
    periode.periodicite,
    periode.dateDebut,
    'Diagnostic PCAET'
  ),
  field,
  value,
});
