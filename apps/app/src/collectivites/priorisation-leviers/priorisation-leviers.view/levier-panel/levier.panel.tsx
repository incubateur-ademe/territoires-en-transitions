import { CategorieAction } from '@tet/domain/shared';
import { Divider } from '@tet/ui';
import { JSX, ReactNode, Ref, RefCallback } from 'react';
import { LevierCardInfo } from '../../levier-card-info';
import { Preselection } from '../../use-preselection';
import { LevierPriorisation } from '../data/to-leviers-priorisation';
import { UpsertPertinence } from '../data/use-upsert-pertinence';
import { LevierActionsDeReferenceList } from './levier-actions-de-reference.list';
import { PertinenceField } from './pertinence-field';

type LevierPanelProps = {
  levier: LevierPriorisation;
  initialCategorie?: CategorieAction;
  preselection: Preselection;
  upsertPertinence?: UpsertPertinence;
  headerRef?: Ref<HTMLElement>;
  actionsRef?: RefCallback<HTMLDivElement>;
};

const LevierTitle = ({ children }: { children: ReactNode }): JSX.Element => (
  <h2 className="mb-0 text-base">{children}</h2>
);

const LevierPanel = ({
  levier,
  initialCategorie,
  preselection,
  upsertPertinence,
  headerRef,
  actionsRef,
}: LevierPanelProps): JSX.Element => (
  <div className="flex flex-col gap-4 p-6">
    <header ref={headerRef} className="flex flex-col gap-4">
      <LevierTitle>{levier.nom}</LevierTitle>
      <LevierCardInfo>{levier.secteur}</LevierCardInfo>
      <PertinenceField
        levier={levier}
        pertinence={levier.pertinence}
        upsertPertinence={upsertPertinence}
      />
    </header>
    <Divider />
    <LevierActionsDeReferenceList
      actionsRef={actionsRef}
      levierId={levier.levierId}
      initialCategorie={initialCategorie}
      preselection={preselection}
    />
  </div>
);

export { LevierPanel };
