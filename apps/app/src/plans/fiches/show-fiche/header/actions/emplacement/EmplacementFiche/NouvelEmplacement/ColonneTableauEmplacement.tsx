import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { TProfondeurAxe } from '@/app/plans/plans/types';
import { BoutonTableauEmplacement } from './BoutonTableauEmplacement';

type ColonneTableauEmplacementProps = {
  axesList: TProfondeurAxe[];
  selectedAxesIds: number[];
  maxSelectedDepth: number;
  onSelectAxe: (axe: TProfondeurAxe) => void;
};

export const ColonneTableauEmplacement = ({
  axesList,
  selectedAxesIds,
  maxSelectedDepth = 0,
  onSelectAxe,
}: ColonneTableauEmplacementProps) => {
  return (
    <div className="flex flex-col gap-4 px-3">
      {axesList.map((axe) => (
        <BoutonTableauEmplacement
          key={axe.axe.id}
          id={axe.axe.id}
          label={generateTitle(axe.axe.nom)}
          hasChildren={!!axe.enfants}
          isSelected={
            selectedAxesIds.includes(axe.axe.id) &&
            axe.profondeur === maxSelectedDepth
          }
          containsSelectedAxe={
            selectedAxesIds.includes(axe.axe.id) &&
            axe.profondeur !== maxSelectedDepth
          }
          onSelect={() => onSelectAxe(axe)}
        />
      ))}
    </div>
  );
};
