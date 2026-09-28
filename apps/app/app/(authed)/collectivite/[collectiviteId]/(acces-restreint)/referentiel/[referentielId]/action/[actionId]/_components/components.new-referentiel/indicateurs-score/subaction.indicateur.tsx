import { useState } from 'react';

import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ScoreIndicatifResponse } from '../../score-indicatif/use-get-score-indicatif';
import { prepareScoreIndicatifData } from '../../score-indicatif/utils';
import { SubactionIndicateurModal } from './subaction.indicateur-modal';
import { SubactionIndicateurScore } from './subaction.indicateur-score';

type Props = {
  action: ActionListItem;
  scoreIndicatif?: ScoreIndicatifResponse;
};

export const SubactionIndicateur = ({ action, scoreIndicatif }: Props) => {
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const indicateur = scoreIndicatif?.indicateurs[0];
  if (!scoreIndicatif || !indicateur) {
    return null;
  }

  const { indicateurId, identifiantReferentiel, titre, unite } = indicateur;
  const valeurFait = prepareScoreIndicatifData('fait', scoreIndicatif);

  return (
    <>
      <button
        className="flex flex-col gap-2 pt-2 pb-3 px-4 text-left font-normal border border-grey-3 hover:border-primary-4 rounded-md"
        onClick={() => {
          setIsScoreModalOpen(true);
        }}
      >
        <p className="mb-auto font-bold text-sm text-primary-9">{titre}</p>
        <SubactionIndicateurScore
          action={action}
          unite={unite}
          calcul={scoreIndicatif.calcul}
          valeurSelectionnee={valeurFait?.valeurPrincipale}
          size="sm"
        />
      </button>
      {isScoreModalOpen && (
        <SubactionIndicateurModal
          action={action}
          titre={titre}
          unite={unite}
          indicateurId={indicateurId}
          identifiantReferentiel={identifiantReferentiel}
          calcul={scoreIndicatif.calcul}
          openState={{
            isOpen: isScoreModalOpen,
            setIsOpen: setIsScoreModalOpen,
          }}
        />
      )}
    </>
  );
};
