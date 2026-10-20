import { appLabels } from '@/app/labels/catalog';
import type { ActionDeReference } from '@tet/domain/shared';
import { ActionCard, Button } from '@tet/ui';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import { ActionDeReferenceDetailLink } from './action-de-reference-detail.link';
import { ActionDeReferenceInterestButtons } from './action-de-reference-interest.buttons';
import { ActionDeReferenceBadges } from './action-de-reference.badges';
import type {
  ActionDeReferenceCardComponent,
  ActionDeReferenceUpdateAccess,
} from './actions-de-reference.contract';

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

const toHoverActions = ({
  action,
  updateAccess,
}: {
  readonly action: ActionDeReference;
  readonly updateAccess: ActionDeReferenceUpdateAccess;
}): JSX.Element | undefined =>
  match(updateAccess)
    .with({ status: 'forbidden' }, () => undefined)
    .with({ status: 'allowed' }, ({ onUpdate }) => (
      <UpdateActionDeReferenceButton action={action} onUpdate={onUpdate} />
    ))
    .exhaustive();

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
  showTypeBadge = false,
  showLevierAndCategorieBadges = true,
  actions,
  actionsRef,
  children,
}) => (
  <ActionCard
    hoverActions={toHoverActions({ action, updateAccess })}
    header={
      <ActionDeReferenceBadges
        action={action}
        hasUpdateButton={updateAccess.status === 'allowed'}
        showTypeBadge={showTypeBadge}
        showLevierAndCategorieBadges={showLevierAndCategorieBadges}
      />
    }
    footer={
      <div ref={actionsRef} className="flex flex-wrap items-center gap-3 pt-1">
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
  </ActionCard>
);
