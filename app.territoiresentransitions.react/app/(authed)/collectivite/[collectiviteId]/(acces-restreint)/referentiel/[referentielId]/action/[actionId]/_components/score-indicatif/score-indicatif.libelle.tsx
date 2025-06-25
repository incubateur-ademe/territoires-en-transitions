import { avancementToLabel } from '@/app/app/labels';
import { toPercentString } from '@/app/utils/to-percent-string';
import {
  TypeScoreIndicatif,
  typeScoreIndicatifEnum,
} from '@/domain/referentiels';
import {
  ScoreIndicatifAction,
  ScoreIndicatifValeurUtilisee,
  ScoreIndicatifValeursUtilisees,
} from './types';
import { useGetScoreIndicatif } from './use-get-score-indicatif';
import { prepareScoreIndicatifData, texteValeurUtilisee } from './utils';

type Props = {
  actionId: string;
};

const ScoreIndicatifLibelle = ({ actionId }: Props) => {
  const { data, isLoading } = useGetScoreIndicatif(actionId);
  if (!data || isLoading) return null;

  const scoreIndicatif = data[actionId];
  if (!scoreIndicatif) return;

  const unite = scoreIndicatif.indicateurs[0].unite;

  return (
    <div className="flex flex-col gap-1">
      <LibelleScoreIndicatif
        typeScore="fait"
        unite={unite}
        scoreIndicatif={scoreIndicatif}
      />
      <LibelleScoreIndicatif
        typeScore="programme"
        unite={unite}
        scoreIndicatif={scoreIndicatif}
      />
    </div>
  );
};

export default ScoreIndicatifLibelle;

/**
 * Affiche le libellé du score indicatif (fait ou programmé)
 */
export const LibelleScoreIndicatif = ({
  typeScore,
  unite,
  scoreIndicatif,
}: {
  typeScore: TypeScoreIndicatif;
  unite: string;
  scoreIndicatif: ScoreIndicatifAction;
}) => {
  const donnees = prepareScoreIndicatifData(typeScore, scoreIndicatif);
  if (!donnees) return null;

  const { valeurPrincipale, valeurSecondaire, noSource, score } = donnees;
  const dateValeur =
    valeurSecondaire?.dateValeur || valeurPrincipale.dateValeur;

  return (
    <p className="mb-0 text-sm text-grey-8 font-normal leading-5">
      {typeScore === typeScoreIndicatifEnum.FAIT ? (
        <LibelleScoreFait score={score} />
      ) : (
        <LibelleScoreProgramme score={score} dateValeur={dateValeur} />
      )}{' '}
      <LibelleValeurUtilisee
        typeScore={typeScore}
        unite={unite}
        valeurUtilisee={valeurPrincipale}
        noSource={noSource}
      />
      {valeurSecondaire && (
        <>
          {' '}
          et{' '}
          <LibelleValeurUtilisee
            typeScore={typeScore}
            unite={unite}
            valeurUtilisee={valeurSecondaire}
          />
        </>
      )}
      {typeScore === typeScoreIndicatifEnum.PROGRAMME &&
        ` atteint${valeurSecondaire ? 's' : ''}`}
    </p>
  );
};

/**
 * Génère le texte principal pour le score indicatif "fait"
 */
const LibelleScoreFait = ({ score }: { score: number }) => {
  return (
    <>
      Pourcentage indicatif Fait de <b>{toPercentString(score)}</b> calculé sur
      la base de :
    </>
  );
};

/**
 * Génère le texte principal pour le score indicatif "programme"
 */
export function LibelleScoreProgramme({
  score,
  dateValeur,
}: {
  score: number;
  dateValeur: string;
}) {
  const annee = new Date(dateValeur).getFullYear();
  return (
    <>
      Pourcentage indicatif Fait en {isNaN(Number(annee)) ? '' : annee} de{' '}
      <b>{toPercentString(score)}</b> calculé si
    </>
  );
}

type LibelleValeurUtiliseeProps = {
  typeScore: TypeScoreIndicatif;
  unite: string;
  valeurUtilisee: ScoreIndicatifValeurUtilisee;
  noSource?: boolean;
  noYear?: boolean;
};

/**
 * Affiche le détail d'une valeur utilisée pour le calcul du score indicatif
 */
const LibelleValeurUtilisee = ({
  typeScore,
  unite,
  valeurUtilisee,
  noSource,
  noYear,
}: LibelleValeurUtiliseeProps) => {
  const segments = texteValeurUtilisee({
    valeurUtilisee,
    unite,
    typeScore,
    noSource,
    noYear,
  });

  return (
    <span>
      <b>{segments.valeurEtUnite}</b> {segments.annee} {segments.source}{' '}
    </span>
  );
};

/** Affiche le libellé d'une valeur sélectionnée */
export const LibelleValeurSelectionnee = (props: {
  indicateurId: number;
  unite: string;
  valeurUtilisees?: ScoreIndicatifValeursUtilisees;
  typeScore: TypeScoreIndicatif;
}) => {
  const { unite, valeurUtilisees, typeScore } = props;
  const valeurUtilisee = valeurUtilisees?.find(
    (v) => v.typeScore === typeScore
  );

  return (
    <>
      <span>
        Valeur sélectionnée pour le calcul du pourcentage indicatif{' '}
        {avancementToLabel[typeScore]} :
      </span>{' '}
      {valeurUtilisee ? (
        <LibelleValeurUtilisee
          typeScore={typeScore}
          unite={unite}
          valeurUtilisee={valeurUtilisee}
        />
      ) : (
        <i>à compléter</i>
      )}
    </>
  );
};
