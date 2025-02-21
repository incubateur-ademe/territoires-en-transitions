import { TAudit } from '@/app/referentiels/audits/types';
import PreuveDoc from '@/app/referentiels/preuves/Bibliotheque/PreuveDoc';
import { Button, Modal, RenderProps } from '@/ui';
import { AddRapportButton } from './AddRapportButton';
import { useRapportsAudit } from './useAudit';

export type TValiderAuditProps = {
  audit: TAudit;
  onValidate: (audit?: TAudit) => void;
};

/**
 * Affiche le bouton permettant d'ouvrir la modale de validation d'un audit
 */
export const ValiderAudit = (props: TValiderAuditProps) => (
  <Modal
    size="lg"
    disableDismiss
    render={(modalProps) => <ValiderAuditModal {...modalProps} {...props} />}
  >
    <Button dataTest="ValiderAuditBtn" size="sm">
      {"Valider l'audit"}
    </Button>
  </Modal>
);

const auditSansLabellisation =
  "Suite à cette validation, et après vérification par l'équipe Territoires en Transitions, un nouveau cycle va démarrer avec le score validé par l'audit.";
const auditLabellisation =
  'Suite à cette validation, plus aucune modification ne sera possible dans le cadre de l’audit et le secrétariat de la Commission nationale du label (CNL) sera notifié pour réceptionner le dossier de candidature complet et le transmettre aux membres de la CNL.';

/**
 * Affiche la modale de validation d'un audit
 */
export const ValiderAuditModal = (props: RenderProps & TValiderAuditProps) => {
  const { audit, close, onValidate } = props;
  const { id: audit_id, demande_id } = audit;

  // on peut valider seulement si au moins un rapport a été attaché à l'audit
  const rapports = useRapportsAudit(audit_id!);
  const canValidate = Boolean(rapports?.length);

  return (
    <div data-test="ValiderAuditModal">
      <h4>Valider l'audit</h4>
      <p>
        Pour clôturer l’audit, merci de joindre votre rapport définitif
        (disponible dans la bibliothèque de documents et visible par les membres
        de la communauté).
      </p>
      <AddRapportButton audit_id={audit_id!} />
      {rapports?.length ? (
        <div data-test="rapports-audit">
          {rapports.map((rapport) => (
            <PreuveDoc key={rapport.id} preuve={rapport} />
          ))}
        </div>
      ) : null}
      <p className="mt-4">
        {demande_id ? auditLabellisation : auditSansLabellisation}
      </p>
      <div className="flex gap-4">
        <Button
          dataTest="validate"
          size="sm"
          onClick={() => {
            onValidate(audit);
            close();
          }}
          disabled={!canValidate}
        >
          {"Valider l'audit"}
        </Button>
        <Button size="sm" variant="outlined" onClick={() => close()}>
          Annuler
        </Button>
      </div>
    </div>
  );
};
