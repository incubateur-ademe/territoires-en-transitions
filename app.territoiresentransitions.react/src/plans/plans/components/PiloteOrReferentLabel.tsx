import { PlanReferentOrPilote } from '@/backend/plans/plans/plans.schema';
import { ReactComponent as FranceIcon } from './france-icon.svg';
import { ReactComponent as PiloteIcon } from './pilote-icon.svg';

export const PiloteOrReferentLabel = ({
  icon,
  personnes,
}: {
  icon: 'pilote' | 'france';
  personnes: PlanReferentOrPilote[];
}) => {
  const Icon = icon === 'pilote' ? PiloteIcon : FranceIcon;
  const firstPerson = personnes[0];
  const additionalPersonLabel =
    personnes.length > 1 ? `+${personnes.length - 1}` : '';
  return (
    <div className="flex items-center gap-1">
      <Icon />
      <span className="text-sm text-grey-8 font-normal">
        {firstPerson.userName ?? firstPerson.tagName}
      </span>
      {additionalPersonLabel && (
        <span className="text-sm text-grey-8 font-normal">
          {additionalPersonLabel}
        </span>
      )}
    </div>
  );
};
