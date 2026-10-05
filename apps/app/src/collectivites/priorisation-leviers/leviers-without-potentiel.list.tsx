import { appLabels } from '@/app/labels/catalog';
import { LevierId } from '@tet/domain/shared';
import { Button } from '@tet/ui';
import { JSX, ReactNode, useId } from 'react';
import { LevierPriorisation } from './to-leviers-priorisation';

type LeviersWithoutPotentielListProps = {
  leviers: LevierPriorisation[];
  onLevierSelected: (levierId: LevierId) => void;
};

const LeviersWithoutPotentielTitle = ({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}): JSX.Element => (
  <h2 id={id} className="mb-0 text-base">
    {children}
  </h2>
);

export const LeviersWithoutPotentielList = ({
  leviers,
  onLevierSelected,
}: LeviersWithoutPotentielListProps): JSX.Element => {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <LeviersWithoutPotentielTitle id={headingId}>
        {appLabels.leviersSansPotentiel({ count: leviers.length })}
      </LeviersWithoutPotentielTitle>
      <ul role="list" className="m-0 flex list-none flex-wrap gap-2 p-0">
        {leviers.map((levier) => (
          <li key={levier.levierId} className="p-0">
            <Button
              size="xs"
              variant="outlined"
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
