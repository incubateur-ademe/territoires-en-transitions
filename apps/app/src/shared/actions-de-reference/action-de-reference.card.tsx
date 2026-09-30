import { appLabels } from '@/app/labels/catalog';
import { type ActionDeReference, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { Badge, Button, Card } from '@tet/ui';
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
}): JSX.Element => <h2 className="mb-0 text-lg">{children}</h2>;

export const ActionDeReferenceCard: ActionDeReferenceCardComponent = ({
  action,
  updateAccess,
}) => (
  <Card className="h-full font-normal">
    <div className="flex items-start justify-between gap-4">
      <ActionDeReferenceTitle>{action.titre}</ActionDeReferenceTitle>
      {match(updateAccess)
        .with({ status: 'forbidden' }, () => null)
        .with({ status: 'allowed' }, ({ onUpdate }) => (
          <UpdateActionDeReferenceButton action={action} onUpdate={onUpdate} />
        ))
        .exhaustive()}
    </div>
    <p className="mb-0 whitespace-pre-line text-sm text-grey-8">
      {action.description}
    </p>
    <div className="mt-auto flex flex-wrap gap-2">
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
  </Card>
);
