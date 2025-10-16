import {
  ScoreIndicatifPayload,
  ValeurUtilisee,
} from '@/backend/referentiels/models/score-indicatif.dto';
import {
  TypeScoreIndicatif,
  typeScoreIndicatifEnum,
} from '@/backend/referentiels/models/type-score-indicatif.enum';

const typeScoreToLabel: Record<TypeScoreIndicatif, string> = {
  fait: 'Résultats de la collectivité',
  programme: 'Objectifs de la collectivité',
};

/**
 * Génère le libellé complet du score indicatif
 */
export function getLibelleScoreIndicatif(
  scoreIndicatif: ScoreIndicatifPayload
) {
  return [
    scoreIndicatif.fait
      ? getTextScoreIndicatif(typeScoreIndicatifEnum.FAIT, scoreIndicatif)
      : null,
    scoreIndicatif.programme
      ? getTextScoreIndicatif(typeScoreIndicatifEnum.PROGRAMME, scoreIndicatif)
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Génère le texte du score indicatif fait ou programmé
 */
function getTextScoreIndicatif(
  typeScore: TypeScoreIndicatif,
  scoreIndicatif: ScoreIndicatifPayload
) {
  const donnees = prepareScoreIndicatifData(typeScore, scoreIndicatif);
  if (!donnees) return null;

  const unite = scoreIndicatif.unite;
  const { valeurPrincipale, valeurSecondaire, noSource, score } = donnees;
  const dateValeur =
    valeurSecondaire?.dateValeur || valeurPrincipale.dateValeur;

  return (
    (typeScore === typeScoreIndicatifEnum.FAIT
      ? `Pourcentage indicatif Fait de ${toPercentString(
          score
        )} calculé sur la base de : `
      : getLibelleScoreProgramme({ score, dateValeur })) +
    getLibelleValeurUtilisee({
      typeScore,
      unite,
      valeurUtilisee: valeurPrincipale,
      noSource,
    }) +
    (valeurSecondaire
      ? ` et ${getLibelleValeurUtilisee({
          typeScore,
          unite,
          valeurUtilisee: valeurSecondaire,
          noSource,
        })}`
      : '') +
    (typeScore === typeScoreIndicatifEnum.PROGRAMME
      ? ` atteint${valeurSecondaire ? 's' : ''}`
      : '')
  );
}

/**
 * Prépare les données pour l'affichage du score indicatif
 */
function prepareScoreIndicatifData(
  typeScore: TypeScoreIndicatif,
  scoreIndicatif: ScoreIndicatifPayload
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

type LibelleValeurUtiliseeArgs = {
  typeScore: TypeScoreIndicatif;
  unite: string;
  valeurUtilisee: Pick<
    ValeurUtilisee,
    'valeur' | 'dateValeur' | 'sourceLibelle'
  >;
  noSource?: boolean;
  noYear?: boolean;
};

/**
 * Génère le libellé d'une valeur utilisée pour le calcul du score indicatif
 */
const getLibelleValeurUtilisee = (args: LibelleValeurUtiliseeArgs) => {
  const segments = getSegmentsValeurUtilisee(args);

  return `${segments.valeurEtUnite} ${segments.annee} ${segments.source}`;
};

/**
 * Génère les segments de texte pour une valeur utilisée
 */
function getSegmentsValeurUtilisee({
  valeurUtilisee,
  unite,
  typeScore,
  noSource,
  noYear,
}: LibelleValeurUtiliseeArgs) {
  const { valeur, dateValeur, sourceLibelle } = valeurUtilisee;
  const annee = new Date(dateValeur).getFullYear();

  return {
    valeurEtUnite: `${valeur} ${unite}`,
    annee: noYear || isNaN(annee) ? '' : `en ${annee}`,
    source: noSource
      ? ''
      : `(source : ${sourceLibelle ?? typeScoreToLabel[typeScore]})`,
  };
}

/**
 * Génère le texte principal pour le score indicatif "programme"
 */
function getLibelleScoreProgramme({
  score,
  dateValeur,
}: {
  score: number;
  dateValeur: string;
}) {
  const annee = new Date(dateValeur).getFullYear();
  return `Pourcentage indicatif Fait en ${
    isNaN(Number(annee)) ? '' : annee
  } de ${toPercentString(score)} calculé si `;
}

function toPercentString(value: number) {
  return `${Math.round(value * 100)}%`;
}
