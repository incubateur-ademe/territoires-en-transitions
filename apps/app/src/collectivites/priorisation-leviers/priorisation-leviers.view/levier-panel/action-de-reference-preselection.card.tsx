import { ActionDeReferenceCollectivitesPanel } from '@/app/shared/actions-de-reference/action-de-reference-collectivites.panel';
import { ActionDeReferenceCard } from '@/app/shared/actions-de-reference/action-de-reference.card';
import { toActionDeReferenceInterestControl } from '@/app/shared/actions-de-reference/to-action-de-reference-interest-control';
import { useActionDeReferenceUpdateAccess } from '@/app/shared/actions-de-reference/use-action-de-reference-update-access';
import type { ActionDeReference } from '@tet/domain/shared';
import { JSX, RefCallback } from 'react';
import { Preselection, PreselectionStatus } from '../../use-preselection';

type ActionDeReferencePreselectionCardProps = {
  readonly action: ActionDeReference;
  readonly status: PreselectionStatus;
  readonly preselection: Pick<
    Preselection,
    'add' | 'remove' | 'ignore' | 'restore' | 'statusOf'
  >;
  readonly actionsRef?: RefCallback<HTMLDivElement>;
};

export const ActionDeReferencePreselectionCard = ({
  action,
  status,
  preselection,
  actionsRef,
}: ActionDeReferencePreselectionCardProps): JSX.Element => {
  const updateAccess = useActionDeReferenceUpdateAccess();
  return (
    <ActionDeReferenceCard
      action={action}
      updateAccess={updateAccess}
      interest={toActionDeReferenceInterestControl(
        action,
        status,
        preselection
      )}
      showTypeBadge
      showLevierAndCategorieBadges={false}
      actionsRef={actionsRef}
    >
      <ActionDeReferenceCollectivitesPanel actionDeReferenceId={action.id} />
    </ActionDeReferenceCard>
  );
};
