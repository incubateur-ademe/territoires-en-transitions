import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { ReactElement } from 'react';
import { useStartAudit } from '../../../labellisations/useStartAudit';

export const BeginAuditButton = ({
  auditId,
}: {
  auditId: number;
}): ReactElement => {
  const { mutate, isPending } = useStartAudit();
  return (
    <Button
      size="xs"
      dataTest="StartAuditBtn"
      disabled={isPending}
      onClick={() => mutate({ auditId })}
    >
      {appLabels.commencerLAudit}
    </Button>
  );
};
