import { avancementToLabel } from '@/app/app/labels';
import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { toPercentString } from '@/app/utils/to-percent-string';
import {
  type IndicateurPeriodicite,
  toAnnualIndicateurYear,
} from '@tet/domain/indicateurs';
import {
  ScoreIndicatifType,
  scoreIndicatifTypeEnum,
} from '@tet/domain/referentiels';
import {
  ScoreIndicatifAction,
  ScoreIndicatifValeurUtilisee,
  ScoreIndicatifValeursUtilisees,
} from './score-indicatif.types';
import { useGetScoreIndicatif } from './use-get-score-indicatif';
import { prepareScoreIndicatifData, texteValeurUtilisee } from './utils';

type Props = {
  action: Pick<ActionListItem, 'actionId' | 'exprScore'>;
  scoreIndicatif?: ScoreIndicatifAction;
};

const ScoreIndicatifLibelle = ({
  action,
  scoreIndicatif: prefetchedScoreIndicatif,
}: Props) => {
  const { actionId, exprScore } = action;
  const haveScoreIndicatif = Boolean(exprScore && exprScore.trim() !== '');

  const { data, isLoading } = useGetScoreIndicatif({
    actionIds: [actionId],
    enabled: haveScoreIndicatif && !prefetchedScoreIndicatif,
  });

  if (isLoading) return null;

  const scoreIndicatif = prefetchedScoreIndicatif ?? data?.[actionId];
  if (!scoreIndicatif) return null;

  const donneesFait = prepareScoreIndicatifData('fait', scoreIndicatif);
  const donneesProgramme = prepareScoreIndicatifData(
    'programme',
    scoreIndicatif
  );
  if (!donneesFait && !donneesProgramme) return null;

  const unite = scoreIndicatif.indicateurs[0].unite;

  return (
    <div className="flex flex-col gap-1">
      {!!donneesFait && (
        <LibelleScoreIndicatif
          typeScore="fait"
          donnees={donneesFait}
          unite={unite}
        />
      )}
      {!!donneesProgramme && (
        <LibelleScoreIndicatif
          typeScore="programme"
          donnees={donneesProgramme}
          unite={unite}
        />
      )}
    </div>
  );
};

export default ScoreIndicatifLibelle;

/**
 * Affiche le libellé du score indicatif (fait ou programmé)
 */
const LibelleScoreIndicatif = ({
  typeScore,
  donnees,
  unite,
}: {
  typeScore: ScoreIndicatifType;
  donnees: {
    valeurPrincipale: ScoreIndicatifValeurUtilisee & {
      periodicite: IndicateurPeriodicite | undefined;
    };
    valeurSecondaire:
      | (ScoreIndicatifValeurUtilisee & {
          periodicite: IndicateurPeriodicite | undefined;
        })
      | null;
    noSource?: boolean;
    score: number;
  };
  unite: string;
}) => {
  const { valeurPrincipale, valeurSecondaire, noSource, score } = donnees;
  const dateValeur =
    valeurSecondaire?.dateValeur || valeurPrincipale.dateValeur;

  return (
    <p className="mb-0 text-sm text-grey-8 font-normal leading-5">
      {typeScore === scoreIndicatifTypeEnum.FAIT ? (
        <LibelleScoreFait score={score} />
      ) : (
        <LibelleScoreProgramme
          score={score}
          dateValeur={dateValeur}
          periodicite={
            valeurSecondaire?.periodicite ?? valeurPrincipale.periodicite
          }
        />
      )}{' '}
      <LibelleValeurUtilisee
        typeScore={typeScore}
        unite={unite}
        valeurUtilisee={valeurPrincipale}
        periodicite={valeurPrincipale.periodicite}
        noSource={noSource}
      />
      {valeurSecondaire && (
        <>
          {' '}
          {appLabels.et}{' '}
          <LibelleValeurUtilisee
            typeScore={typeScore}
            unite={unite}
            valeurUtilisee={valeurSecondaire}
            periodicite={valeurSecondaire.periodicite}
          />
        </>
      )}
    </p>
  );
};

/**
 * Génère le texte principal pour le score indicatif "fait"
 */
const LibelleScoreFait = ({ score }: { score: number }) => {
  return <>{appLabels.scoreIndicatifFait(toPercentString(score))}</>;
};

/**
 * Génère le texte principal pour le score indicatif "programme"
 */
function LibelleScoreProgramme({
  score,
  dateValeur,
  periodicite,
}: {
  score: number;
  dateValeur: string;
  periodicite: IndicateurPeriodicite | null | undefined;
}) {
  const annee = toAnnualIndicateurYear(
    periodicite,
    dateValeur,
    'Le libellé du score indicatif'
  );
  return (
    <>
      {appLabels.scoreIndicatifProgramme({
        annee,
        percent: toPercentString(score),
      })}
    </>
  );
}

type LibelleValeurUtiliseeProps = {
  typeScore: ScoreIndicatifType;
  unite: string;
  valeurUtilisee: ScoreIndicatifValeurUtilisee;
  periodicite: IndicateurPeriodicite | null | undefined;
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
  periodicite,
  noSource,
  noYear,
}: LibelleValeurUtiliseeProps) => {
  const segments = texteValeurUtilisee({
    valeurUtilisee,
    periodicite,
    unite,
    typeScore,
    noSource,
    noYear,
  });

  return (
    <span>
      {appLabels.valeurDeLIndicateur(valeurUtilisee.indicateurTitre)}{' '}
      <b>{segments.valeurEtUnite}</b>
      {typeScore === scoreIndicatifTypeEnum.FAIT ? ' ' : ' atteint '}
      {segments.annee} {segments.source}{' '}
    </span>
  );
};

/** Affiche le libellé d'une valeur sélectionnée */
export const LibelleValeurSelectionnee = (props: {
  indicateurId: number;
  unite: string;
  valeurUtilisees?: ScoreIndicatifValeursUtilisees;
  periodicite: IndicateurPeriodicite;
  typeScore: ScoreIndicatifType;
}) => {
  const { unite, valeurUtilisees, periodicite, typeScore } = props;
  const valeurUtilisee = valeurUtilisees?.find(
    (v) => v.typeScore === typeScore
  );

  return (
    <>
      <span>
        {appLabels.valeurSelectionneePourPourcentageIndicatif(
          avancementToLabel[typeScore]
        )}
      </span>{' '}
      {valeurUtilisee ? (
        <LibelleValeurUtilisee
          typeScore={typeScore}
          unite={unite}
          valeurUtilisee={valeurUtilisee}
          periodicite={periodicite}
        />
      ) : (
        <i>{appLabels.aCompleter}</i>
      )}
    </>
  );
};
