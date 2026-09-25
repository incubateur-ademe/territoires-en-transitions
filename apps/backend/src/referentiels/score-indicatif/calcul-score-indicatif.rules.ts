import { EvaluationContext } from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { computeValeurAttendue } from '@tet/backend/indicateurs/valeurs/progression.rules';
import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import {
  CalculScoreIndicatif,
  IndicateurAssocie,
  typeCalculScoreIndicatifEnum,
  ValeurUtilisee,
} from '@tet/domain/referentiels';
import {
  buildAnneesPourExpression,
  buildValeursPourExpression,
} from './compute-score-indicatif.rules';

/**
 * Déduit le type de calcul du score indicatif des fonctions utilisées par la
 * formule, et rassemble les données ayant servi au calcul pour l'affichage.
 *
 * Une formule peut combiner plusieurs fonctions : `progression_snbc(...)` /
 * `reduction(...)` priment sur `cible(...)` / `limite(...)`, qui priment sur
 * `est_suivi(...)`. Renvoie `null` si aucune de ces fonctions n'est utilisée,
 * ou si `reduction(...)` n'a pas d'année cible ou de réduction cible.
 *
 * Seules la première référence portant une progression et sa première
 * progression sont exposées, même si la formule en combine plusieurs.
 *
 * Les données sont lues aux mêmes sources que l'évaluation de la formule
 * (`EvaluationContext`) pour que l'affichage corresponde au calcul.
 */
export function buildCalculScoreIndicatif({
  references,
  indicateursAssocies,
  evaluationContext,
  valeursUtiliseesFait,
}: {
  references: ReferencedIndicateur[];
  indicateursAssocies: IndicateurAssocie[];
  evaluationContext: EvaluationContext;
  valeursUtiliseesFait: ValeurUtilisee[];
}): CalculScoreIndicatif | null {
  // écarte les références à des indicateurs non associés à l'action (ex.
  // variante DROM filtrée pour cette collectivité)
  const indicateurParIdentifiant = new Map(
    indicateursAssocies.map((ind) => [ind.identifiantReferentiel, ind])
  );
  const referencesAssociees = references.filter((ref) =>
    indicateurParIdentifiant.has(ref.identifiant)
  );

  const refProgression = referencesAssociees.find(
    (ref) => ref.progressions?.length
  );
  if (refProgression?.progressions?.length) {
    const identifiant = refProgression.identifiant;
    const progression = refProgression.progressions[0];
    // mêmes helpers que l'évaluation, pour retenir la même valeur si
    // plusieurs sont sélectionnées pour l'indicateur
    const anneeUtilisee =
      buildAnneesPourExpression(valeursUtiliseesFait, indicateursAssocies)[
        identifiant
      ] ?? null;
    const valeurUtilisee =
      buildValeursPourExpression(valeursUtiliseesFait, indicateursAssocies)[
        identifiant
      ] ?? null;
    const valeursParAnnee =
      evaluationContext.valeursProgression?.[identifiant] ?? {};

    if (progression.token === 'reduction') {
      const resultatDepart =
        valeursParAnnee[progression.anneeDepart]?.resultatDepart ?? null;
      const anneeCible = progression.anneeCible ?? null;
      const reductionCible = progression.reductionCible ?? null;
      // paramètres incomplets : on n'expose aucun calcul plutôt que de retomber
      // sur un autre type (cible/limite, est_suivi) qui ne décrit pas la formule
      if (anneeCible === null || reductionCible === null) {
        return null;
      }
      return {
        type: typeCalculScoreIndicatifEnum.REDUCTION,
        identifiantReferentiel: identifiant,
        anneeDepart: progression.anneeDepart,
        resultatDepart,
        anneeCible,
        reductionCible,
        anneeUtilisee,
        valeurUtilisee,
        valeurCible: computeValeurAttendue({
          valeurDepart: resultatDepart,
          anneeDepart: progression.anneeDepart,
          anneeCible,
          reductionCible,
          anneeUtilisee,
        }),
      };
    } else if (progression.token === 'progression_snbc') {
      return {
        type: typeCalculScoreIndicatifEnum.PROGRESSION_SNBC,
        identifiantReferentiel: identifiant,
        anneeDepart: progression.anneeDepart,
        objectifSnbcDepart:
          valeursParAnnee[progression.anneeDepart]?.objectifSnbc ?? null,
        anneeUtilisee,
        valeurUtilisee,
        objectifSnbc:
          anneeUtilisee !== null
            ? valeursParAnnee[anneeUtilisee]?.objectifSnbc ?? null
            : null,
      };
    }
  }

  const refCibleSeuil = referencesAssociees.find(
    (ref) => ref.tokens.includes('cible') || ref.tokens.includes('limite')
  );
  if (refCibleSeuil) {
    const identifiant = refCibleSeuil.identifiant;
    const { cible, limite } = evaluationContext.valeursComplementaires ?? {};
    return {
      type: typeCalculScoreIndicatifEnum.VALEUR_CIBLE_SEUIL,
      identifiantReferentiel: identifiant,
      cible: cible?.[identifiant] ?? null,
      seuil: limite?.[identifiant] ?? null,
    };
  }

  if (referencesAssociees.some((ref) => ref.tokens.includes('est_suivi'))) {
    return { type: typeCalculScoreIndicatifEnum.PRESENCE_ABSENCE };
  }

  return null;
}
