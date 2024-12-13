/**
 * Affiche le dialogue de définition de l'état d'avancement détaillé d'une tâche
 */

import { actionAvancementColors } from '@/app/app/theme';
import { toPercentString } from '@/app/utils/score';
import { Dispatch, SetStateAction } from 'react';
import { AvancementValues, DetailedScoreSlider } from './DetailedScoreSlider';

export type TDetailedScoreProps = {
  avancement: AvancementValues;
  setCurrentAvancement: Dispatch<SetStateAction<AvancementValues>>;
};

export const DetailedScore = ({
  avancement,
  setCurrentAvancement,
}: TDetailedScoreProps) => {
  return (
    <div className="flex flex-col items-center py-6">
      <DetailedScoreSlider value={avancement} onChange={setCurrentAvancement} />
      <div className="grid grid-cols-2 gap-y-4 gap-x-3 my-8">
        <div>Fait</div>
        <div
          style={{ color: actionAvancementColors.fait }}
          className="text-right"
        >
          {toPercentString(avancement[0])}
        </div>
        <div>Programmé</div>
        <div
          style={{ color: actionAvancementColors.programme }}
          className="text-right"
        >
          {toPercentString(avancement[1])}
        </div>
        <div>Pas fait</div>
        <div
          style={{ color: actionAvancementColors.pas_fait }}
          className="text-right"
        >
          {toPercentString(avancement[2])}
        </div>
      </div>
    </div>
  );
};
