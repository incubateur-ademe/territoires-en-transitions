import { JSX, Ref } from 'react';
import { LevierPriorisation } from '../data/to-leviers-priorisation';
import { UpsertPertinence } from '../data/use-upsert-pertinence';
import { PertinenceField } from './pertinence-field';

type LevierHeaderProps = {
  levier: LevierPriorisation;
  subtitle: string;
  upsertPertinence?: UpsertPertinence;
  headerRef?: Ref<HTMLDivElement>;
};

export const LevierHeader = ({
  levier,
  subtitle,
  upsertPertinence,
  headerRef,
}: LevierHeaderProps): JSX.Element => (
  <div ref={headerRef} className="flex flex-col gap-3 pt-3">
    <p className="mb-0 text-xs text-grey-8">{subtitle}</p>
    {upsertPertinence !== undefined && (
      <PertinenceField
        levier={levier}
        pertinence={levier.pertinence}
        upsertPertinence={upsertPertinence}
      />
    )}
  </div>
);
