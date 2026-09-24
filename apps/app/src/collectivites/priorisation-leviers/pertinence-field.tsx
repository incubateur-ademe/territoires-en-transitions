import { appLabels } from '@/app/labels/catalog';
import { Pertinence, PertinenceLevier } from '@tet/domain/collectivites';
import { CategorieAction } from '@tet/domain/shared';
import { JSX } from 'react';
import { UpsertPertinence } from './data/use-upsert-pertinence';
import { LevierCardInfo } from './levier-card-info';
import { PertinenceSelector } from './pertinence-selector';
import { LevierCard } from './to-levier-cards';

type PertinenceTarget = {
  levier: Pick<LevierCard, 'levierId' | 'nom'>;
  categorie?: CategorieAction;
};

type PertinenceFieldProps = PertinenceTarget & {
  pertinence?: Pertinence;
  upsertPertinence?: UpsertPertinence;
};

const toPertinenceLabel = ({ levier, categorie }: PertinenceTarget): string => {
  if (categorie === undefined) {
    return appLabels.pertinenceLevierLabel(levier.nom);
  }
  return appLabels.pertinenceCategorieLabel({
    categorie,
    levierNom: levier.nom,
  });
};

const toPertinenceLevier = ({
  levier,
  categorie,
  pertinence,
}: PertinenceTarget & { pertinence: Pertinence }): PertinenceLevier => {
  if (categorie === undefined) {
    return { levierId: levier.levierId, pertinence };
  }
  return { levierId: levier.levierId, categorie, pertinence };
};

export const PertinenceField = ({
  levier,
  categorie,
  pertinence,
  upsertPertinence,
}: PertinenceFieldProps): JSX.Element => {
  if (upsertPertinence === undefined) {
    return (
      <LevierCardInfo>{appLabels.pertinenceInfo(pertinence)}</LevierCardInfo>
    );
  }
  return (
    <PertinenceSelector
      label={toPertinenceLabel({ levier, categorie })}
      value={pertinence}
      onChange={(selected) =>
        upsertPertinence(
          toPertinenceLevier({ levier, categorie, pertinence: selected })
        )
      }
    />
  );
};
