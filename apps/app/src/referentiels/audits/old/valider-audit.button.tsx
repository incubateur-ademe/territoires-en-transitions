import PreuveDoc from '@/app/referentiels/preuves/Bibliotheque/PreuveDoc';
import { appLabels } from '@/app/labels/catalog';
import { Button, Modal, RenderProps } from '@tet/ui';
import { auditReportToPreuve } from '@/app/referentiels/preuves/mappers/audit-report-to-preuve';
import { AddRapportButton } from './AddRapportButton';
import { useListReportsByAudit } from '../cloture/data/use-list-reports-by-audit';
import { useValidateAudit } from '../cloture/data/use-validate-audit';

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

  const { reports } = useListReportsByAudit(auditId);
  const canValidate = reports.length > 0;

  return (
    <div data-test="ValiderAuditModal">
      <h4 className="mb-6">{appLabels.validerAudit}</h4>
      <p>{appLabels.validerAuditDescription}</p>
      <AddRapportButton audit_id={auditId} />
      {reports.length ? (
        <div data-test="rapports-audit">
          {reports.map((report) => (
            <PreuveDoc key={report.id} preuve={auditReportToPreuve(report)} />
          ))}
        </div>
      ) : null}
      {!demandeId && (
        <p className="mt-4">{appLabels.auditSansLabellisationMessage}</p>
      )}
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
