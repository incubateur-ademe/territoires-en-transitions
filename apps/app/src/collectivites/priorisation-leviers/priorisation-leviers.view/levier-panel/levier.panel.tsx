import { CategorieAction } from '@tet/domain/shared';
import { JSX } from 'react';
import { Preselection } from '../../use-preselection';
import { LevierPriorisation } from '../data/to-leviers-priorisation';
import { LevierActionsDeReferenceList } from './levier-actions-de-reference.list';
import { SuggestActionAlert } from './suggest-action.alert';

type LevierPanelProps = {
  levier: LevierPriorisation;
  initialCategorie?: CategorieAction;
  preselection: Preselection;
};

export const LevierPanel = ({
  levier,
  initialCategorie,
  preselection,
}: LevierPanelProps): JSX.Element => (
  <div className="flex flex-col gap-4 p-4">
    <LevierActionsDeReferenceList
      levierId={levier.levierId}
      initialCategorie={initialCategorie}
      preselection={preselection}
    />
    <SuggestActionAlert levierId={levier.levierId} />
  </div>
);
