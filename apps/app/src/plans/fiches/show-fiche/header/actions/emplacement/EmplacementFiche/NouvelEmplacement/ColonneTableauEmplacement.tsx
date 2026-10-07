import { AxeNode } from '@/app/plans/plans/types';
import { generateTitle } from '@/app/utils/generate-title';
import { BoutonTableauEmplacement } from './BoutonTableauEmplacement';

type ColonneTableauEmplacementProps = {
  axesList: AxeNode[];
  selectedAxesIds: number[];
  maxSelectedDepth: number;
  onSelectAxe: (axe: AxeNode) => void;
};

export const ColonneTableauEmplacement = ({
  axesList,
  selectedAxesIds,
  maxSelectedDepth = 0,
  onSelectAxe,
}: ColonneTableauEmplacementProps) => {
  if (axesList.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 px-3">
      {axesList.map((axe) => (
        <BoutonTableauEmplacement
          key={axe.axe.id}
          id={axe.axe.id}
          label={generateTitle(axe.axe.nom)}
          hasChildren={axe.enfants.length > 0}
          isSelected={
            selectedAxesIds.includes(axe.axe.id) &&
            axe.depth === maxSelectedDepth
          }
          containsSelectedAxe={
            selectedAxesIds.includes(axe.axe.id) &&
            axe.depth !== maxSelectedDepth
          }
          onSelect={() => onSelectAxe(axe)}
        />
      ))}
    </div>
  );
};
