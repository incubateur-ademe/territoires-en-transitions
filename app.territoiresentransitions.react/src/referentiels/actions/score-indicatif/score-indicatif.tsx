import { useCurrentCollectivite } from '@/api/collectivites';
import { avancementToLabel } from '@/app/app/labels';
import { ScoreIndicatifBadge } from '@/app/referentiels/actions/score-indicatif/score-indicatif-badge';
import {
  prepareScoreIndicatifData,
  texteValeurUtilisee,
} from '@/app/referentiels/actions/score-indicatif/utils';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { toPercentString } from '@/app/utils/to-percent-string';
import {
  TypeScoreIndicatif,
  typeScoreIndicatifEnum,
} from '@/domain/referentiels';
import { Button } from '@/ui';
import { useState } from 'react';
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
  const nbIndicateurs = scoreIndicatif.indicateurs?.length || 0;
  if (!nbIndicateurs) return;

  const unite = scoreIndicatif.indicateurs[0].unite;

  return (
    <div className="col-span-full">
      <ScoreIndicatifBadge nbIndicateurs={nbIndicateurs} />
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
              } les données ${
                nbIndicateurs > 1 ? 'des indicateurs' : "de l'indicateur"
              }`}
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
    </div>
  );
};

/**
 * Affiche le libellé du score indicatif (fait ou programmé)
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
  const donnees = prepareScoreIndicatifData(typeScore, scoreIndicatif);
  if (!donnees) return null;

  const { valeurPrincipale, valeurSecondaire, noSource, score } = donnees;
  const dateValeur =
    valeurSecondaire?.dateValeur || valeurPrincipale.dateValeur;

  return (
    <p className="mb-0">
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
      Pourcentage indicatif <b>Fait</b> de {toPercentString(score)} calculé sur
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
      Pourcentage indicatif <b>Fait</b> en {isNaN(Number(annee)) ? '' : annee}{' '}
      de {toPercentString(score)} calculé si
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
