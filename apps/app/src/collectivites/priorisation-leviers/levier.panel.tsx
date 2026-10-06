import { CategorieAction } from '@tet/domain/shared';
import { Divider } from '@tet/ui';
import { JSX, ReactNode } from 'react';
import { UpsertPertinence } from './data/use-upsert-pertinence';
import { LevierActionsDeReferenceList } from './levier-actions-de-reference.list';
import { LevierCardInfo } from './levier-card-info';
import { PertinenceField } from './pertinence-field';
import { LevierPriorisation } from './to-leviers-priorisation';
import { Preselection } from './use-preselection';

type LevierPanelProps = {
  levier: LevierPriorisation;
  initialCategorie?: CategorieAction;
  preselection: Preselection;
  upsertPertinence?: UpsertPertinence;
};

const LevierTitle = ({ children }: { children: ReactNode }): JSX.Element => (
  <h2 className="mb-0 text-base">{children}</h2>
);

export const LevierPanel = ({
  levier,
  initialCategorie,
  preselection,
  upsertPertinence,
}: LevierPanelProps): JSX.Element => (
  <div className="flex flex-col gap-4 p-6">
    <LevierTitle>{levier.nom}</LevierTitle>
    <LevierCardInfo>{levier.secteur}</LevierCardInfo>
    <PertinenceField
      levier={levier}
      pertinence={levier.pertinence}
      upsertPertinence={upsertPertinence}
    />
    <Divider />
    <LevierActionsDeReferenceList
      levierId={levier.levierId}
      initialCategorie={initialCategorie}
      preselection={preselection}
    />
  </div>
);
