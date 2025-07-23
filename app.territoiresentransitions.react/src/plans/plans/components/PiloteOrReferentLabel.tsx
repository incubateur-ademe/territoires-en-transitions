import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { PlanReferentOrPilote } from '@/domain/plans/plans';
import FranceIcon from './france-icon.svg';
import PiloteIcon from './pilote-icon.svg';

export const PiloteOrReferentLabel = ({
  icon,
  personnes,
}: {
  icon: 'pilote' | 'france';
  personnes: PlanReferentOrPilote[];
}) => {
  const Icon = icon === 'pilote' ? PiloteIcon : FranceIcon;

  return (
    <ListWithTooltip
      className="text-sm text-grey-8 font-normal flex"
      icon={() => <Icon className="mr-1.5" />}
      list={personnes
        .map((p) => p.userName ?? p.tagName)
        .filter((x) => x !== null)}
    />
  );
};
