import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import {
  type IndicateurPeriodicite,
  toAnnualIndicateurYear,
} from '@tet/domain/indicateurs';
import { ScoreIndicatifType } from '@tet/domain/referentiels';
import { typeScoreToLabel } from './score-indicatif.labels';
import {
  ScoreIndicatifAction,
  ScoreIndicatifValeurUtilisee,
} from './score-indicatif.types';

/**
 * Prépare les données pour l'affichage du score indicatif
 */
export function prepareScoreIndicatifData(
  typeScore: ScoreIndicatifType,
  scoreIndicatif: ScoreIndicatifAction
) {
  const donnees = scoreIndicatif[typeScore];
  if (!donnees?.valeursUtilisees[0]) return null;

  const enrichValeur = (valeur: ScoreIndicatifValeurUtilisee) => {
    const indicateur = scoreIndicatif.indicateurs.find(
      ({ indicateurId }) => indicateurId === valeur.indicateurId
    );
    return {
      ...valeur,
      indicateurTitre: indicateur?.titre ?? '',
      periodicite: indicateur?.periodicite,
    };
  };

  const valeurPrincipale = enrichValeur(donnees.valeursUtilisees[0]);
  const valeurSecondaire = donnees.valeursUtilisees[1]
    ? enrichValeur(donnees.valeursUtilisees[1])
    : undefined;

  return {
    score: donnees.score,
    valeurPrincipale,
    valeurSecondaire: valeurSecondaire || null,
    noSource:
      valeurSecondaire &&
      valeurPrincipale.sourceMetadonnee === valeurSecondaire.sourceMetadonnee,
  };
}

/**
 * Génère les segments de texte pour une valeur utilisée
 */
export function texteValeurUtilisee({
  valeurUtilisee,
  unite,
  typeScore,
  noSource,
  noYear,
  periodicite,
}: {
  valeurUtilisee: ScoreIndicatifValeurUtilisee;
  periodicite: IndicateurPeriodicite | null | undefined;
  typeScore: ScoreIndicatifType;
  unite: string;
  noSource?: boolean;
  noYear?: boolean;
}) {
  const { valeur, dateValeur, sourceLibelle } = valeurUtilisee;
  const annee = toAnnualIndicateurYear(
    periodicite,
    dateValeur,
    `Le score indicatif (${valeurUtilisee.indicateurId})`
  );

  return {
    valeurEtUnite: `${valeur} ${unite}`,
    annee: noYear ? '' : `en ${annee}`,
    source: noSource
      ? ''
      : ` (source : ${sourceLibelle ?? typeScoreToLabel[typeScore]})`,
  };
}

export const hasIndicateursScore = (action: ActionListItem) => {
  const hasExprScore = Boolean(
    action.exprScore && action.exprScore.trim() !== ''
  );

  return hasExprScore || action.childrenIdsWithExprScore.length > 0;
};
