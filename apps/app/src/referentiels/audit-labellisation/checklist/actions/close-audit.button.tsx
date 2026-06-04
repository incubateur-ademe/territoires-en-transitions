import { appLabels } from '@/app/labels/catalog';
import { Button, Modal } from '@tet/ui';
import { ReactElement } from 'react';
import { ValiderAuditModal } from '../../../audits/valider-audit.button';

export const CloseAuditButton = ({
  auditId,
  demandeId,
}: {
  auditId: number;
  demandeId: number | null;
}): ReactElement => (
  <Modal
    size="lg"
    disableDismiss
    render={(modalProps) => (
      <ValiderAuditModal
        {...modalProps}
        auditId={auditId}
        demandeId={demandeId}
      />
    )}
  >
    <Button size="xs" dataTest="CloturerAuditBtn">
      {appLabels.cloturerAudit}
    </Button>
  </Modal>
);
