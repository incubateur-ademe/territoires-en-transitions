import { ActionDeReferenceCollectivitesPanel } from '@/app/shared/actions-de-reference/action-de-reference-collectivites.panel';
import { ActionDeReferenceCard } from '@/app/shared/actions-de-reference/action-de-reference.card';
import { toActionDeReferenceInterestControl } from '@/app/shared/actions-de-reference/to-action-de-reference-interest-control';
import { useActionDeReferenceUpdateAccess } from '@/app/shared/actions-de-reference/use-action-de-reference-update-access';
import type { ActionDeReference } from '@tet/domain/shared';
import { JSX, RefCallback } from 'react';
import { Preselection, PreselectionStatus } from '../../use-preselection';
import { useSavedActionToasts } from './use-saved-action-toasts';

type ActionDeReferencePreselectionCardProps = {
  readonly action: ActionDeReference;
  readonly status: PreselectionStatus;
  readonly preselection: Pick<
    Preselection,
    'actions' | 'add' | 'remove' | 'ignore' | 'restore' | 'statusOf'
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
  const savedActionControls = useSavedActionToasts(preselection);
  return (
    <ActionDeReferenceCard
      action={action}
      updateAccess={updateAccess}
      interest={toActionDeReferenceInterestControl(
        action,
        status,
        savedActionControls
      )}
      showTypeBadge
      showLevierAndCategorieBadges={false}
      actionsRef={actionsRef}
    >
      <ActionDeReferenceCollectivitesPanel actionDeReferenceId={action.id} />
    </ActionDeReferenceCard>
  );
};
