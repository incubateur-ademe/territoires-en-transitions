import { appLabels } from '@/app/labels/catalog';
import PreuveDoc from '@/app/referentiels/preuves/Bibliotheque/PreuveDoc';
import { Button } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useState } from 'react';
import { useValidateAudit } from '../labellisations/useValidateAudit';
import { AddRapportButton } from './AddRapportButton';
import { useRapportsAudit } from './useAudit';

type ValiderAuditProps = {
  auditId: number;
  demandeId: number | null;
};

export const ValiderAuditButton = ({
  auditId,
  demandeId,
}: ValiderAuditProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: onValidateAudit } = useValidateAudit();

  const rapports = useRapportsAudit(auditId);
  const canValidate = Boolean(rapports?.length);

  return (
    <Modal
      size="lg"
      dismissable={false}
      openState={{ isOpen, setIsOpen }}
    >
      <Modal.Trigger>
        <Button dataTest="ValiderAuditBtn" size="sm">
          {appLabels.validerAudit}
        </Button>
      </Modal.Trigger>
      <Modal.Header>
        <Modal.Title>{appLabels.validerAudit}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div data-test="ValiderAuditModal">
          <p>{appLabels.validerAuditDescription}</p>
          <AddRapportButton auditId={auditId} />
          {rapports?.length ? (
            <div data-test="rapports-audit">
              {rapports.map((rapport) => (
                <PreuveDoc key={rapport.id} preuve={rapport} />
              ))}
            </div>
          ) : null}
          <p className="mt-4">
            {demandeId
              ? appLabels.auditLabellisationMessage
              : appLabels.auditSansLabellisationMessage}
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Button
          dataTest="validate"
          size="sm"
          onClick={() => {
            onValidateAudit({ auditId });
            setIsOpen(false);
          }}
          disabled={!canValidate}
        >
          {appLabels.validerAudit}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
