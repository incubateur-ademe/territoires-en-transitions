import {
  ScoreIndicatifPayload,
  ScoreIndicatifType,
  scoreIndicatifTypeEnum,
  ValeurUtilisee,
} from '@tet/domain/referentiels';
import { toAnnualIndicateurYearFromHistoricalDate } from '@tet/domain/indicateurs';

const typeScoreToLabel: Record<ScoreIndicatifType, string> = {
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
      ? getTextScoreIndicatif(scoreIndicatifTypeEnum.FAIT, scoreIndicatif)
      : null,
    scoreIndicatif.programme
      ? getTextScoreIndicatif(scoreIndicatifTypeEnum.PROGRAMME, scoreIndicatif)
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Génère le texte du score indicatif fait ou programmé
 */
function getTextScoreIndicatif(
  typeScore: ScoreIndicatifType,
  scoreIndicatif: ScoreIndicatifPayload
) {
  const donnees = prepareScoreIndicatifData(typeScore, scoreIndicatif);
  if (!donnees) return null;

  const unite = scoreIndicatif.unite;
  const { valeurPrincipale, valeurSecondaire, noSource, score } = donnees;
  const dateValeur =
    valeurSecondaire?.dateValeur || valeurPrincipale.dateValeur;

  return (
    (typeScore === scoreIndicatifTypeEnum.FAIT
      ? `Pourcentage indicatif Fait de ${toPercentString(
          score
        )} calculé sur la base de : `
      : getLibelleScoreProgramme({
          score,
          dateValeur,
          periodicite: scoreIndicatif.periodicite,
        })) +
    getLibelleValeurUtilisee({
      typeScore,
      unite,
      valeurUtilisee: valeurPrincipale,
      periodicite: scoreIndicatif.periodicite,
      noSource,
    }) +
    (valeurSecondaire
      ? ` et ${getLibelleValeurUtilisee({
          typeScore,
          unite,
          valeurUtilisee: valeurSecondaire,
          periodicite: scoreIndicatif.periodicite,
          noSource,
        })}`
      : '') +
    (typeScore === scoreIndicatifTypeEnum.PROGRAMME
      ? ` atteint${valeurSecondaire ? 's' : ''}`
      : '')
  );
}

/**
 * Prépare les données pour l'affichage du score indicatif
 */
function prepareScoreIndicatifData(
  typeScore: ScoreIndicatifType,
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
  typeScore: ScoreIndicatifType;
  unite: string;
  valeurUtilisee: Pick<
    ValeurUtilisee,
    'valeur' | 'dateValeur' | 'sourceLibelle'
  >;
  noSource?: boolean;
  noYear?: boolean;
  periodicite: ScoreIndicatifPayload['periodicite'];
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
  periodicite,
}: LibelleValeurUtiliseeArgs) {
  const { valeur, dateValeur, sourceLibelle } = valeurUtilisee;
  const annee = toAnnualIndicateurYearFromHistoricalDate(
    periodicite,
    dateValeur,
    'Le libellé du score indicatif'
  );

  return {
    valeurEtUnite: `${valeur} ${unite}`,
    annee: noYear ? '' : `en ${annee}`,
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
  periodicite,
}: {
  score: number;
  dateValeur: string;
  periodicite: ScoreIndicatifPayload['periodicite'];
}) {
  const annee = toAnnualIndicateurYearFromHistoricalDate(
    periodicite,
    dateValeur,
    'Le libellé du score indicatif'
  );
  return `Pourcentage indicatif Fait en ${annee} de ${toPercentString(
    score
  )} calculé si `;
}

function toPercentString(value: number) {
  return `${Math.round(value * 100)}%`;
}
