import { getAnnee } from '@tet/backend/indicateurs/valeurs/progression.rules';
import { IndicateurAssocie, ValeurUtilisee } from '@tet/domain/referentiels';
import { pick } from 'es-toolkit';

/**
 * Construit la table identifiant référentiel -> valeur attendue par
 * `IndicateurExpressionService.parseAndEvaluateExpression`, à partir des
 * valeurs utilisées et des indicateurs associés à l'action
 */
export function buildValeursPourExpression(
  valeursUtilisees: ValeurUtilisee[],
  indicateursAssocies: IndicateurAssocie[]
): Record<string, number> {
  const identifiantReferentielParId = Object.fromEntries(
    indicateursAssocies.map(({ indicateurId, identifiantReferentiel }) => [
      indicateurId,
      identifiantReferentiel,
    ])
  );

  return Object.fromEntries(
    valeursUtilisees
      .map(({ indicateurId, valeur }) => {
        const identifiant = identifiantReferentielParId[indicateurId];
        return identifiant ? ([identifiant, valeur] as const) : null;
      })
      .filter((entry): entry is readonly [string, number] => entry !== null)
  );
}

/**
 * Construit la table identifiant référentiel -> année (`dateValeur`) de la
 * valeur utilisée, pour `progression_snbc(...)` et `reduction(...)`
 */
export function buildAnneesPourExpression(
  valeursUtilisees: ValeurUtilisee[],
  indicateursAssocies: IndicateurAssocie[]
): Record<string, number> {
  const identifiantReferentielParId = Object.fromEntries(
    indicateursAssocies.map(({ indicateurId, identifiantReferentiel }) => [
      indicateurId,
      identifiantReferentiel,
    ])
  );

  return Object.fromEntries(
    valeursUtilisees
      .map(({ indicateurId, dateValeur }) => {
        const identifiant = identifiantReferentielParId[indicateurId];
        return identifiant
          ? ([identifiant, getAnnee(dateValeur)] as const)
          : null;
      })
      .filter((entry): entry is readonly [string, number] => entry !== null)
  );
}

/** Ne garde que les champs des valeurs utilisées pertinents pour le résultat du calcul */
export function pickValeursUtiliseesPourResultat(
  valeursUtilisees: ValeurUtilisee[]
) {
  return valeursUtilisees.map((val) =>
    pick(val, [
      'valeur',
      'dateValeur',
      'sourceLibelle',
      'sourceMetadonnee',
      'indicateurId',
    ])
  );
}
