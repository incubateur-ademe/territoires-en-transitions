import { electrificationIndicateursDocument } from '@tet/backend/plans/plans/electrification/config/electrification-indicateurs-document.config';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  IndicateurPeriodes,
  IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { ElectrificationImportLocations as Locations } from '../electrification-import-locations';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationFichesErrors as Errors } from './electrification-fiches.errors';
import {
  ElectrificationIndicateurInput,
  PreparedElectrificationIndicateur,
  PreparedElectrificationIndicateurValeur,
} from './electrification-fiches.schema';

/** Valide les périodes et regroupe résultats et objectifs sans écraser une cible. */
export class ResolveElectrificationIndicateursRules {
  /** Les fiches qui réutilisent un indicateur catalogue partagent ses objectifs. */
  static validateObjectives(
    indicateurs: PreparedElectrificationIndicateur[]
  ): ElectrificationIssue[] {
    const objectivesByIndicateur = new Map<number, Map<string, number>>();
    for (const indicateur of indicateurs) {
      if (indicateur.mode !== 'catalogue' || indicateur.indicateurId === null)
        continue;
      const objectives =
        objectivesByIndicateur.get(indicateur.indicateurId) ??
        new Map<string, number>();
      for (const { dateValeur, objectif } of indicateur.valeurs) {
        if (objectif === null) continue;
        const existing = objectives.get(dateValeur);
        if (existing !== undefined && existing !== objectif)
          return [
            Errors.issue(
              'CONFLICTING_INDICATEUR_OBJECTIVES',
              indicateur.source.location
            ),
          ];
        objectives.set(dateValeur, objectif);
      }
      objectivesByIndicateur.set(indicateur.indicateurId, objectives);
    }
    return [];
  }

  static resolveValeurs(
    input: Extract<ElectrificationIndicateurInput, { type: 'quantitatif' }>,
    periodicite: IndicateurPeriodicite
  ): Result<PreparedElectrificationIndicateurValeur[], ElectrificationIssue[]> {
    const issue = (code: Parameters<typeof Errors.issue>[0], field: string) =>
      Errors.issue(code, Locations.field(input.source.location, field));
    const valeurs = new Map<string, PreparedElectrificationIndicateurValeur>();
    const observations = [
      {
        field: 'resultat' as const,
        valeur: input.resultat,
        fieldLabel: electrificationIndicateursDocument.fields.resultat.label,
      },
      {
        field: 'objectif' as const,
        valeur: input.objectif,
        fieldLabel: electrificationIndicateursDocument.fields.objectif.label,
      },
      ...(input.objectifComplementaire
        ? [
            {
              field: 'objectif' as const,
              valeur: input.objectifComplementaire,
              fieldLabel:
                electrificationIndicateursDocument.fields.objectifComplementaire
                  .label,
            },
          ]
        : []),
    ];
    for (const { field, valeur, fieldLabel } of observations) {
      if (valeur.valeur === null) continue;
      if (valeur.periode === null)
        return failure([
          issue(
            periodicite === 'annuelle'
              ? 'MISSING_INDICATEUR_YEAR'
              : 'INVALID_INDICATEUR_PERIOD',
            fieldLabel
          ),
        ]);
      if (input.periodicite === null)
        return failure([
          issue('INVALID_INDICATEUR_PERIODICITY', 'Périodicité'),
        ]);
      const periode = IndicateurPeriodes.tryParse(periodicite, valeur.periode);
      if (!periode)
        return failure([issue('INVALID_INDICATEUR_PERIOD', fieldLabel)]);
      const dateValeur = IndicateurPeriodes.toDateValeur(periode);
      const existing = valeurs.get(dateValeur) ?? {
        dateValeur,
        resultat: null,
        objectif: null,
      };
      if (existing[field] !== null && existing[field] !== valeur.valeur)
        return failure([
          issue('CONFLICTING_INDICATEUR_OBJECTIVES', fieldLabel),
        ]);
      existing[field] = valeur.valeur;
      valeurs.set(dateValeur, existing);
    }
    return success([...valeurs.values()]);
  }
}
