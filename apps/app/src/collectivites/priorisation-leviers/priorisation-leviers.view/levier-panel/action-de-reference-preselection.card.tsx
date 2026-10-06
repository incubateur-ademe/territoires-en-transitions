import { appLabels } from '@/app/labels/catalog';
import type { ActionDeReference } from '@tet/domain/shared';
import { Button } from '@tet/ui';
import { JSX } from 'react';
import { match } from 'ts-pattern';
import { ActionDeReferenceSummaryCard } from '../../action-de-reference-summary.card';
import { Preselection, PreselectionStatus } from '../../use-preselection';

type ActionDeReferencePreselectionCardProps = {
  action: ActionDeReference;
  status: PreselectionStatus;
  preselection: Pick<Preselection, 'add' | 'remove' | 'ignore' | 'restore'>;
};

const IgnoreActionButton = ({
  onIgnore,
}: {
  onIgnore: () => void;
}): JSX.Element => (
  <Button size="xs" variant="underlined" onClick={onIgnore}>
    {appLabels.pasInteresse}
  </Button>
);

const PreselectionButtons = ({
  action,
  status,
  preselection,
}: ActionDeReferencePreselectionCardProps): JSX.Element =>
  match(status)
    .with('disponible', () => (
      <>
        <Button
          size="xs"
          variant="outlined"
          onClick={() => preselection.add(action)}
        >
          {appLabels.ajouterALaPreselection}
        </Button>
        <IgnoreActionButton onIgnore={() => preselection.ignore(action.id)} />
      </>
    ))
    .with('preselectionnee', () => (
      <>
        <Button
          size="xs"
          icon="check-line"
          onClick={() => preselection.remove(action.id)}
        >
          {appLabels.ajouteeALaPreselection}
        </Button>
        <IgnoreActionButton onIgnore={() => preselection.ignore(action.id)} />
      </>
    ))
    .with('ignoree', () => (
      <Button
        size="xs"
        variant="underlined"
        onClick={() => preselection.restore(action.id)}
      >
        {appLabels.retablirAction}
      </Button>
    ))
    .exhaustive();

export const ActionDeReferencePreselectionCard = ({
  action,
  status,
  preselection,
}: ActionDeReferencePreselectionCardProps): JSX.Element => (
  <ActionDeReferenceSummaryCard action={action}>
    <PreselectionButtons
      action={action}
      status={status}
      preselection={preselection}
    />
  </ActionDeReferenceSummaryCard>
);
