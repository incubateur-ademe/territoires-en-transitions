import { appLabels } from '@/app/labels/catalog';
import { LevierId } from '@tet/domain/shared';
import { Button } from '@tet/ui';
import { JSX, useId } from 'react';
import { LevierPriorisation } from './to-leviers-priorisation';

type LeviersWithoutPotentielListProps = {
  leviers: LevierPriorisation[];
  onLevierSelected: (levierId: LevierId) => void;
};

export const LeviersWithoutPotentielList = ({
  leviers,
  onLevierSelected,
}: LeviersWithoutPotentielListProps): JSX.Element => {
  const labelId = useId();
  return (
    <section
      aria-labelledby={labelId}
      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-grey-8"
    >
      <span id={labelId}>
        {appLabels.leviersSansPotentiel({ count: leviers.length })}
      </span>
      <ul role="list" className="m-0 flex list-none flex-wrap gap-x-3 p-0">
        {leviers.map((levier) => (
          <li key={levier.levierId} className="p-0">
            <Button
              size="xs"
              variant="underlined"
              onClick={() => onLevierSelected(levier.levierId)}
            >
              {levier.nom}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
};
