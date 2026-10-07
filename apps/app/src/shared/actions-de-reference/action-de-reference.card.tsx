import { appLabels } from '@/app/labels/catalog';
import { type ActionDeReference, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { Badge, Button, Card, cn } from '@tet/ui';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
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
  children,
}: {
  readonly children: string;
}): JSX.Element => (
  <h2 className="mb-0 text-base font-bold leading-normal text-primary-9">
    {children}
  </h2>
);

const ActionDeReferenceBadges = ({
  action,
  hasUpdateButton,
}: {
  readonly action: ActionDeReference;
  readonly hasUpdateButton: boolean;
}): JSX.Element => (
  <div className={cn('flex flex-wrap gap-2', hasUpdateButton && 'pr-8')}>
    <Badge
      title={LEVIER_NOM_BY_ID[action.levier]}
      size="sm"
      type="outlined"
      trim={false}
      uppercase={false}
    />
    <Badge
      title={appLabels.categorieActionLabel(action.categorie)}
      size="sm"
      variant="info"
      trim={false}
      uppercase={false}
    />
  </div>
);

export const ActionDeReferenceCard: ActionDeReferenceCardComponent = ({
  action,
  updateAccess,
}) => (
  <div className="group relative h-full">
    {match(updateAccess)
      .with({ status: 'forbidden' }, () => null)
      .with({ status: 'allowed' }, ({ onUpdate }) => (
        <div className="absolute right-4 top-4 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
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
        />
      }
    >
      <ActionDeReferenceTitle>{action.titre}</ActionDeReferenceTitle>
      <p className="mb-0 whitespace-pre-line text-sm font-medium text-grey-8">
        {action.description}
      </p>
    </Card>
  </div>
);
