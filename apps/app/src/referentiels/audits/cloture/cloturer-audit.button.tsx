import { appLabels } from '@/app/labels/catalog';
import { Button, ButtonSize } from '@tet/ui';
import { JSX, useState } from 'react';
import { CloturerAuditModal } from './cloturer-audit.modal';

export const CloturerAuditButton = ({
  auditId,
  demandeId,
  size = 'sm',
}: {
  auditId: number;
  demandeId: number | null;
  size?: ButtonSize;
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button size={size} onClick={() => setIsOpen(true)}>
        {appLabels.cloturerAudit}
      </Button>
      <CloturerAuditModal
        auditId={auditId}
        demandeId={demandeId}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </>
  );
};
