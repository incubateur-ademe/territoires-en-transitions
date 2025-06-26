import { TypeScoreIndicatif } from '@/domain/referentiels';
import { typeScoreToLabel } from './score-indicatif.labels';
import {
  ScoreIndicatifAction,
  ScoreIndicatifValeurUtilisee,
} from './score-indicatif.types';

/**
 * Prépare les données pour l'affichage du score indicatif
 */
export function prepareScoreIndicatifData(
  typeScore: TypeScoreIndicatif,
  scoreIndicatif: ScoreIndicatifAction
) {
  const donnees = scoreIndicatif[typeScore];
  if (!donnees?.valeursUtilisees[0]) return null;

  const valeurPrincipale = donnees.valeursUtilisees[0];
  const valeurSecondaire = donnees.valeursUtilisees[1];

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
}: {
  valeurUtilisee: ScoreIndicatifValeurUtilisee;
  typeScore: TypeScoreIndicatif;
  unite: string;
  noSource?: boolean;
  noYear?: boolean;
}) {
  const { valeur, dateValeur, sourceLibelle } = valeurUtilisee;
  const annee = new Date(dateValeur).getFullYear();

  return {
    valeurEtUnite: `${valeur} ${unite}`,
    annee: noYear || isNaN(annee) ? '' : `en ${annee}`,
    source: noSource
      ? ''
      : ` (source : ${sourceLibelle ?? typeScoreToLabel[typeScore]})`,
  };
}
