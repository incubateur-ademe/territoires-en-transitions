import { appLabels } from '@/app/labels/catalog';
import { Pertinence } from '@tet/domain/collectivites';
import { JSX } from 'react';
import { UpsertPertinence } from './data/use-upsert-pertinence';
import { LevierCardInfo } from './levier-card-info';
import { PertinenceToggle } from './pertinence-toggle';
import { LevierCard } from './to-levier-cards';

type PertinenceFieldProps = {
  levier: Pick<LevierCard, 'levierId' | 'nom'>;
  pertinence?: Pertinence;
  upsertPertinence?: UpsertPertinence;
};

export const PertinenceField = ({
  levier,
  pertinence,
  upsertPertinence,
}: PertinenceFieldProps): JSX.Element => {
  if (upsertPertinence === undefined) {
    return (
      <LevierCardInfo>{appLabels.pertinenceInfo(pertinence)}</LevierCardInfo>
    );
  }
  return (
    <PertinenceToggle
      label={appLabels.pertinenceLevierLabel(levier.nom)}
      value={pertinence}
      onChange={(selected) =>
        upsertPertinence({ levierId: levier.levierId, pertinence: selected })
      }
    />
  );
};
