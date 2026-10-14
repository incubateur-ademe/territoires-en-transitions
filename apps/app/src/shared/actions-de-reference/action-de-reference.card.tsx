import { appLabels } from '@/app/labels/catalog';
import type { ActionDeReference } from '@tet/domain/shared';
import { Button, Card } from '@tet/ui';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import { ActionDeReferenceDetailLink } from './action-de-reference-detail.link';
import { ActionDeReferenceInterestButtons } from './action-de-reference-interest.buttons';
import { ActionDeReferenceBadges } from './action-de-reference.badges';
import type { ActionDeReferenceCardComponent } from './actions-de-reference.contract';

const UpdateActionDeReferenceButton = ({
  action,
  onUpdate,
}: {
  readonly action: ActionDeReference;
  readonly onUpdate: (action: ActionDeReference) => void;
}): JSX.Element => {
  const updateLabel = appLabels.actionDeReferenceModifier(action.titre);
  return (
    <Button
      icon="edit-line"
      variant="grey"
      size="xs"
      title={updateLabel}
      aria-label={updateLabel}
      onClick={() => onUpdate(action)}
    />
  );
};

const ActionDeReferenceTitle = ({
  action,
}: {
  readonly action: ActionDeReference;
}): JSX.Element => (
  <h2 className="mb-0 text-base font-bold leading-normal text-primary-9">
    <ActionDeReferenceDetailLink action={action} />
  </h2>
);

export const ActionDeReferenceCard: ActionDeReferenceCardComponent = ({
  action,
  updateAccess,
  interest,
  showAdemeBadge = false,
  actions,
  children,
}) => (
  <div className="group relative h-full">
    {match(updateAccess)
      .with({ status: 'forbidden' }, () => null)
      .with({ status: 'allowed' }, ({ onUpdate }) => (
        <div className="absolute right-4 top-4 z-10 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
          <UpdateActionDeReferenceButton action={action} onUpdate={onUpdate} />
        </div>
      ))
      .exhaustive()}
    <Card
      className="h-full gap-2 p-4 font-normal text-grey-8 shadow-none"
      header={
        <ActionDeReferenceBadges
          action={action}
          hasUpdateButton={updateAccess.status === 'allowed'}
          showAdemeBadge={showAdemeBadge}
        />
      }
      footer={
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <ActionDeReferenceInterestButtons interest={interest} />
          {actions}
        </div>
      }
    >
      <ActionDeReferenceTitle action={action} />
      <p className="mb-0 whitespace-pre-line text-sm font-medium text-grey-8">
        {action.description}
      </p>
      {children}
    </Card>
  </div>
);
