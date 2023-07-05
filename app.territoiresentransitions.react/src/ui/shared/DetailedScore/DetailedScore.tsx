/**
 * Affiche le dialogue de définition de l'état d'avancement détaillé d'une tâche
 */

import {useState} from 'react';
import {DetailedScoreSlider, AvancementValues} from './DetailedScoreSlider';
import {actionAvancementColors} from 'app/theme';
import {toPercentString} from 'utils/score';
import classNames from 'classnames';

export type TDetailedScoreProps = {
  actionType: string;
  avancement: AvancementValues;
  saveAtValidation: boolean;
  onSave: (values: AvancementValues) => void;
};

export const DetailedScore = ({
  actionType,
  avancement,
  saveAtValidation,
  onSave,
}: TDetailedScoreProps) => {
  const [currentAvancement, setCurrentAvancement] =
    useState<AvancementValues>(avancement);

  return (
    <div className="flex flex-col items-center py-6">
      <DetailedScoreSlider
        value={currentAvancement}
        onChange={setCurrentAvancement}
      />
      <div className="grid grid-cols-2 gap-y-4 gap-x-3 mt-8 mb-16">
        <div>Fait</div>
        <div
          style={{color: actionAvancementColors.fait}}
          className="text-right"
        >
          {toPercentString(currentAvancement[0])}
        </div>
        <div>Programmé</div>
        <div
          style={{color: actionAvancementColors.programme}}
          className="text-right"
        >
          {toPercentString(currentAvancement[1])}
        </div>
        <div>Pas fait</div>
        <div
          style={{color: actionAvancementColors.pas_fait}}
          className="text-right"
        >
          {toPercentString(currentAvancement[2])}
        </div>
      </div>
      {actionType === 'tache' && (
        <p className="mb-16">
          Pour faciliter la relecture, vous pouvez préciser les raisons de cette
          répartition en cliquant sur le bouton{' '}
          <span className="fr-icon-pencil-line text-bf500" aria-hidden="true" />{' '}
          situé sous l'intitulé de la tâche.
        </p>
      )}
      <div className="w-full flex justify-end">
        <button
          className={classNames('fr-btn', {
            'fr-btn--icon-left fr-fi-save-line': saveAtValidation,
          })}
          onClick={() => onSave(currentAvancement)}
        >
          {saveAtValidation
            ? 'Enregistrer la répartition'
            : 'Valider la répartition'}
        </button>
      </div>
    </div>
  );
};
