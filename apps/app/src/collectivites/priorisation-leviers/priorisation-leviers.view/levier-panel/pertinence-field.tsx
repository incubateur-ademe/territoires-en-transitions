import { appLabels } from '@/app/labels/catalog';
import { Pertinence } from '@tet/domain/collectivites';
import { JSX } from 'react';
import { LevierCardInfo } from '../../levier-card-info';
import { LevierCard } from '../data/to-levier-cards';
import { UpsertPertinence } from '../data/use-upsert-pertinence';
import { PertinenceToggle } from './pertinence-toggle';

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
