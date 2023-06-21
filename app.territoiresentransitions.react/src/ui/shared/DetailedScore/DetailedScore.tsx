/**
 * Affiche le dialogue de définition de l'état d'avancement détaillé d'une tâche
 */

import {useState} from 'react';
import {DetailedScoreSlider, AvancementValues} from './DetailedScoreSlider';
import {actionAvancementColors} from 'app/theme';
import {toPercentString} from 'utils/score';

export type TDetailedScoreProps = {
  avancement: AvancementValues;
  saveAtValidation: boolean;
  onSave: (values: AvancementValues) => void;
};

export const DetailedScore = (props: TDetailedScoreProps) => {
  const {avancement, saveAtValidation, onSave} = props;
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
      <p className="mb-16">
        Pour faciliter la relecture, pensez à bien préciser les raisons de cette
        répartition dans le champ "Précisions sur l'état d'avancement".
      </p>
      <div className="w-full flex justify-end">
        <button
          className="fr-btn fr-btn--icon-left fr-fi-save-line"
          onClick={() => onSave(currentAvancement)}
        >
          {saveAtValidation
            ? 'Enregistrer le score personnalisé'
            : 'Valider le score personnalisé'}
        </button>
      </div>
    </div>
  );
};
