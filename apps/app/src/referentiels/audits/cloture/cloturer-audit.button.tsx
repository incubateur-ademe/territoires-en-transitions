import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { JSX, useState } from 'react';
import { CloturerAuditModal } from './cloturer-audit.modal';

export const CloturerAuditButton = ({
  auditId,
  demandeId,
}: {
  auditId: number;
  demandeId: number | null;
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
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
