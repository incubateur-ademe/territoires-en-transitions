import { appLabels } from '@/app/labels/catalog';
import { Button, ButtonSize } from '@tet/ui';
import { JSX, useState } from 'react';
import { CloturerAuditModal } from './cloturer-audit.modal';

export const CloturerAuditButton = ({
  auditId,
  size = 'sm',
}: {
  auditId: number;
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
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </>
  );
};
