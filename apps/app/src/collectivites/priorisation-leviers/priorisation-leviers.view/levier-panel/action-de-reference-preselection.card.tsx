import { ActionDeReferenceCollectivitesPanel } from '@/app/shared/actions-de-reference/action-de-reference-collectivites.panel';
import { ActionDeReferenceCard } from '@/app/shared/actions-de-reference/action-de-reference.card';
import { toInterestControl } from '@/app/shared/actions-de-reference/to-action-de-reference-interest-control';
import { useActionDeReferenceUpdateAccess } from '@/app/shared/actions-de-reference/use-action-de-reference-update-access';
import type { ActionDeReference } from '@tet/domain/shared';
import { JSX } from 'react';
import { Preselection, PreselectionStatus } from '../../use-preselection';

type ActionDeReferencePreselectionCardProps = {
  action: ActionDeReference;
  status: PreselectionStatus;
  preselection: Pick<
    Preselection,
    'add' | 'remove' | 'ignore' | 'restore' | 'statusOf'
  >;
};

export const ActionDeReferencePreselectionCard = ({
  action,
  status,
  preselection,
}: ActionDeReferencePreselectionCardProps): JSX.Element => {
  const updateAccess = useActionDeReferenceUpdateAccess();
  return (
    <ActionDeReferenceCard
      action={action}
      updateAccess={updateAccess}
      interest={toInterestControl(action, status, preselection)}
      showAdemeBadge
    >
      <ActionDeReferenceCollectivitesPanel actionDeReferenceId={action.id} />
    </ActionDeReferenceCard>
  );
};
