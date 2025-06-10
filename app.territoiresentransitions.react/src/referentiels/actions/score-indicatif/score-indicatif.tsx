import { useCurrentCollectivite } from '@/api/collectivites';
import { avancementToLabel } from '@/app/app/labels';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { toPercentString } from '@/app/utils/to-percent-string';
import { TypeScoreIndicatif } from '@/domain/referentiels';
import { Button } from '@/ui';
import { useState } from 'react';
import { typeScoreToLabel, typeScoreToName } from './labels';
import { ScoreIndicatifModal } from './score-indicatif-modal';
import {
  ScoreIndicatifAction,
  ScoreIndicatifValeursUtilisees,
  ScoreIndicatifValeurUtilisee,
} from './types';
import { useGetScoreIndicatif } from './use-get-score-indicatif';

export type ScoreIndicatifProps = {
  actionId: string;
};

/**
 * Affiche le score indicatif d'une sous-action/tâche
 */
export const ScoreIndicatif = (props: ScoreIndicatifProps) => {
  const { actionId } = props;
  const { data: scoreIndicatifParActionId, isLoading } =
    useGetScoreIndicatif(actionId);
  const [isOpen, setIsOpen] = useState(false);
  const collectivite = useCurrentCollectivite();

  if (isLoading) return <SpinnerLoader />;
  const scoreIndicatif = scoreIndicatifParActionId?.[actionId];
  if (!scoreIndicatif) return;

  const unite = scoreIndicatif.indicateurs?.[0]?.unite;

  return (
    <div className="mt-4 flex flex-col gap-2">
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
      {!collectivite.isReadOnly && (
        <>
          <Button
            variant="underlined"
            size="sm"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            {`${
              scoreIndicatif.fait?.valeursUtilisees?.length ||
              scoreIndicatif.programme?.valeursUtilisees?.length
                ? 'Modifier'
                : 'Renseigner'
            } les données de l'indicateur`}
          </Button>
          {isOpen && (
            <ScoreIndicatifModal
              scoreIndicatif={scoreIndicatif}
              openState={{ isOpen, setIsOpen }}
            />
          )}
        </>
      )}
    </div>
  );
};

/**
 * Affiche le score indicatif fait ou programmé
 */
const LibelleScoreIndicatif = ({
  typeScore,
  unite,
  scoreIndicatif,
}: {
  typeScore: TypeScoreIndicatif;
  unite: string;
  scoreIndicatif: ScoreIndicatifAction;
}) => {
  if (!scoreIndicatif?.[typeScore]) return;
  const { score, valeursUtilisees } = scoreIndicatif[typeScore];

  return (
    <p className="mb-0" key={typeScore}>
      Score indicatif {avancementToLabel[typeScore]} de{' '}
      <b>{toPercentString(score)}</b> calculé pour :{' '}
      {valeursUtilisees[0] && (
        <LibelleValeurUtilisee
          typeScore={typeScore}
          unite={unite}
          valeurUtilisee={valeursUtilisees[0]}
        />
      )}
      {valeursUtilisees[1] && (
        <>
          {' '}
          et{' '}
          <LibelleValeurUtilisee
            typeScore={typeScore}
            unite={unite}
            valeurUtilisee={valeursUtilisees[1]}
          />
        </>
      )}
    </p>
  );
};

type LibelleValeurUtiliseeProps = {
  typeScore: TypeScoreIndicatif;
  unite: string;
  valeurUtilisee: ScoreIndicatifValeurUtilisee;
};

/**
 * Affiche le détail d'une valeur utilisée pour le calcul du score indicatif
 */
const LibelleValeurUtilisee = ({
  typeScore,
  unite,
  valeurUtilisee,
}: LibelleValeurUtiliseeProps) => {
  const { valeur, dateValeur, sourceLibelle } = valeurUtilisee;
  return (
    <span>
      <b>
        {valeur} {unite}
      </b>{' '}
      en {new Date(dateValeur).getFullYear()}, source{' '}
      {sourceLibelle ? sourceLibelle : typeScoreToLabel[typeScore]}
    </span>
  );
};

export const LibelleValeurSelectionnee = (props: {
  indicateurId: number;
  unite: string;
  valeurUtilisees?: ScoreIndicatifValeursUtilisees | null;
  typeScore: TypeScoreIndicatif;
}) => {
  const { unite, valeurUtilisees, typeScore } = props;
  const valeurUtilisee = valeurUtilisees?.find(
    (v) => v.typeScore === typeScore
  );

  return (
    <>
      <span>
        Valeur sélectionnée pour le calcul du score indicatif{' '}
        {typeScoreToName[typeScore]} :
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
