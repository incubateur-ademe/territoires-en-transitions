import PreuveDoc from '@/app/referentiels/preuves/Bibliotheque/PreuveDoc';
import { appLabels } from '@/app/labels/catalog';
import { Button, Modal, RenderProps } from '@tet/ui';
import { useValidateAudit } from '../labellisations/useValidateAudit';
import { AddRapportButton } from './AddRapportButton';
import { useRapportsAudit } from './useAudit';

type TValiderAuditProps = {
  auditId: number;
  demandeId: number | null;
};

export const ValiderAuditButton = ({
  auditId,
  demandeId,
}: TValiderAuditProps) => (
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
    <Button dataTest="ValiderAuditBtn" size="sm">
      {appLabels.validerAudit}
    </Button>
  </Modal>
);

export const ValiderAuditModal = ({
  auditId,
  demandeId,
  close,
}: RenderProps & TValiderAuditProps) => {
  const { mutate: onValidateAudit } = useValidateAudit();

  const rapports = useRapportsAudit(auditId);
  const canValidate = Boolean(rapports?.length);

  return (
    <div data-test="ValiderAuditModal">
      <h4 className="mb-6">{appLabels.validerAudit}</h4>
      <p>{appLabels.validerAuditDescription}</p>
      <AddRapportButton audit_id={auditId} />
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
      <div className="flex gap-4">
        <Button
          dataTest="validate"
          size="sm"
          onClick={() => {
            onValidateAudit({ auditId });
            close();
          }}
          disabled={!canValidate}
        >
          {appLabels.validerAudit}
        </Button>
        <Button size="sm" variant="outlined" onClick={() => close()}>
          {appLabels.annuler}
        </Button>
      </div>
    </div>
  );
};
