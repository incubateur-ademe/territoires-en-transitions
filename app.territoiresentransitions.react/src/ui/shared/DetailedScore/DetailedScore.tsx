/**
 * Affiche le dialogue de définition de l'état d'avancement détaillé d'une tâche
 */

import {useState} from 'react';
import {DetailedScoreSlider, AvancementValues} from './DetailedScoreSlider';
import {actionAvancementColors} from 'app/theme';

export type TDetailedScoreProps = {
  avancement: AvancementValues;
  onSave: (values: AvancementValues) => void;
};

const toPercentString = (value: number) => `${Math.round(value * 100)}%`;

export const DetailedScore = (props: TDetailedScoreProps) => {
  const {avancement, onSave} = props;
  const [currentAvancement, setCurrentAvancement] =
    useState<AvancementValues>(avancement);

  return (
    <div className="flex flex-col items-center">
      <p className="mb-10">
        Pour faciliter la relecture, pensez à bien préciser les raisons de cette
        répartition dans le champ "Précisions sur l'état d'avancement"
      </p>
      <DetailedScoreSlider
        value={currentAvancement}
        onChange={setCurrentAvancement}
      />
      <table className="fr-table fr-table--bordered w-48 mt-14">
        <tbody>
          <tr>
            <td className="font-bold">Fait</td>
            <td style={{color: actionAvancementColors.fait}}>
              {toPercentString(currentAvancement[0])}
            </td>
          </tr>
          <tr>
            <td className="font-bold">Programmé</td>
            <td style={{color: actionAvancementColors.programme}}>
              {toPercentString(currentAvancement[1])}
            </td>
          </tr>
          <tr>
            <td className="font-bold">Pas fait</td>
            <td style={{color: actionAvancementColors.pas_fait}}>
              {toPercentString(currentAvancement[2])}
            </td>
          </tr>
        </tbody>
      </table>
      <button
        className="fr-btn fr-btn--icon-left fr-fi-save-line"
        onClick={() => onSave(currentAvancement)}
      >
        Enregistrer
      </button>
    </div>
  );
};
