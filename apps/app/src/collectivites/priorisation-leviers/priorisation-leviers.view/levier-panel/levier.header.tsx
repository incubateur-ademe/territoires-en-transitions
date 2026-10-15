import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
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
    <p className="mb-0 text-xs text-grey-6">{subtitle}</p>
    {levier.pertinence === 'non_pertinent' && (
      <Badge
        title={appLabels.pertinenceLabel('non_pertinent')}
        variant="grey"
        size="sm"
        icon="eye-off-line"
        uppercase
        className="w-fit"
      />
    )}
    {upsertPertinence !== undefined && (
      <PertinenceField
        levier={levier}
        pertinence={levier.pertinence}
        upsertPertinence={upsertPertinence}
      />
    )}
  </div>
);
