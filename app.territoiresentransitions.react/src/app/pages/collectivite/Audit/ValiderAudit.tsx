import Modal, {RenderProps} from 'ui/shared/floating-ui/Modal';
import {AddRapportButton} from './AddRapportButton';
import {TAudit} from './types';

export type TValiderAuditProps = RenderProps & {
  audit: TAudit;
};

/**
 * Affiche le bouton permettant d'ouvrir la modale de validation d'un audit
 */
export const ValiderAudit = (props: TValiderAuditProps) => (
  <Modal
    size="lg"
    disableDismiss
    render={modalProps => <ValiderAuditModal {...modalProps} {...props} />}
  >
    <button className="fr-btn">Valider l'audit</button>
  </Modal>
);

const auditSansLabellisation =
  "Suite à cette validation, et après vérification par l'équipe Territoires en Transitions, un nouveau cycle va démarrer avec le score validé par l'audit.";
const auditLabellisation =
  'Suite à cette validation, plus aucune modification ne sera possible dans le cadre de l’audit et le secrétariat de la Commission nationale du label (CNL) sera notifié pour réceptionner le dossier de candidature complet et le transmettre aux membres de la CNL.';

/**
 * Affiche la modale de validation d'un audit
 */
export const ValiderAuditModal = (props: TValiderAuditProps) => {
  const {audit, close} = props;
  const {id: audit_id, demande_id} = audit;

  // validation
  const handleValidate = () => {
    close();
  };

  // on peut valider si le rapport a été attaché à l'audit
  const canValidate = false;

  return (
    <div>
      <h4>Valider l'audit</h4>
      <p>
        Pour clôturer l’audit, merci de joindre votre rapport définitif
        (disponible dans la bibliothèque de documents et visible par les membres
        de la communauté).
      </p>
      <AddRapportButton audit_id={audit_id} />
      <p className="fr-mt-4w">
        {demande_id ? auditLabellisation : auditSansLabellisation}
      </p>
      <div className="flex">
        <button
          className="fr-btn fr-btn--sm fr-mr-2w"
          onClick={() => handleValidate()}
          disabled={!canValidate}
        >
          Valider l'audit
        </button>
        <button
          className="fr-btn fr-btn--sm fr-btn--secondary"
          onClick={() => close()}
        >
          Annuler
        </button>
      </div>
    </div>
  );
};
