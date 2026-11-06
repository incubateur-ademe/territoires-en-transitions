import {
  isPcaetDiagnosticReferenceYear,
  PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS,
  type PcaetDiagnosticIndicateur,
} from '@tet/domain/demarches';
import {
  IndicateurPeriodes,
  type IndicateurValeur,
} from '@tet/domain/indicateurs';
import type { IndicateurValeursTableMeta } from '../../../../indicateurs/valeurs/grid/utils';
import type { IndicateurTableRow } from '../../../../indicateurs/valeurs/grid/types';
import type { DiagnosticIndicateurTable } from './indicateur-tab.layout';

export const buildDiagnosticIndicateurTableRows = (
  table: DiagnosticIndicateurTable
): IndicateurTableRow[] => {
  const indicateurByIdentifiant = new Map<string, PcaetDiagnosticIndicateur>();
  for (const indicateur of table.indicateurDefinitions) {
    IndicateurPeriodes.assertAnnual(indicateur.periodicite, 'Diagnostic PCAET');
    const identifiant = indicateur.identifiantReferentiel;
    if (identifiant === null || identifiant === undefined) {
      continue;
    }
    indicateurByIdentifiant.set(identifiant, indicateur);
  }

  const valeursByIndicateurId = new Map<number, IndicateurValeur[]>();
  for (const { indicateurValeur } of table.indicateurValeurs) {
    const valeurs =
      valeursByIndicateurId.get(indicateurValeur.indicateurId) ?? [];
    valeurs.push(indicateurValeur);
    valeursByIndicateurId.set(indicateurValeur.indicateurId, valeurs);
  }

  return table.rows.flatMap((row) => {
    const indicateur = indicateurByIdentifiant.get(row.indicateurDefinitionId);
    if (indicateur === undefined) {
      return [];
    }
    for (const valeur of valeursByIndicateurId.get(indicateur.id) ?? []) {
      IndicateurPeriodes.toAnnualYearFromHistoricalDate(
        valeur.periodicite,
        valeur.dateValeur,
        'Diagnostic PCAET'
      );
    }
    return [
      {
        indicateurId: indicateur.id,
        indicateurDefinition: indicateur,
        indicateurValeurs: valeursByIndicateurId.get(indicateur.id) ?? [],
        indicateurLabel: row.label,
        // Même règle que `isLeafComplet` : un constat sur l'année de
        // référence (sauf ligne à référence facultative) et un objectif sur
        // chaque horizon requis. Une ligne facultative ou non applicable ne
        // réclame rien.
        isValeurRequired: (periode) => {
          if (!indicateur.isApplicable || row.isOptional) {
            return false;
          }
          if (periode === null) {
            return row.isReferenceResultatRequired;
          }
          const year = IndicateurPeriodes.toAnnualYear(
            periode.periodicite,
            periode.dateDebut,
            'Diagnostic PCAET'
          );
          return (
            PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.includes(
              year
            ) ||
            (row.isReferenceResultatRequired &&
              isPcaetDiagnosticReferenceYear(year))
          );
        },
        isApplicable: indicateur.isApplicable,
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
