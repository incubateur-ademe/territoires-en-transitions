import {
  useCollectiviteId,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import { useLabellisationParcours } from '../labellisations/useLabellisationParcours';
import { useReferentielId } from '../referentiel-context';

/**
 * Statut d'audit du référentiel et de la collectivité courante.
 */
export const useAudit = () => {
  const collectiviteId = useCollectiviteId();
  const referentiel = useReferentielId();

  const { parcours } = useLabellisationParcours({
    collectiviteId: collectiviteId,
    referentielId: referentiel,
  });
  const auditEnCours =
    parcours?.status === 'audit_en_cours' ? parcours.audit : null;

  return { data: auditEnCours };
};

/** Indique si l'utilisateur courant est l'auditeur pour la
 * collectivité courante */
export const useIsAuditeur = () => {
  const collectivite = useCurrentCollectivite();
  return collectivite?.isRoleAuditeur || false;
};

/** Détermine si la description de l'action doit être affichée dans la page
 * Action ou dans le panneau d'information */
export const useShowDescIntoInfoPanel = () => {
  const { data: audit } = useAudit();
  const isAuditeur = useIsAuditeur();

  // la description de l'action est affichée dans le panneau uniquement pour
  // l'auditeur et pour un audit en cours
  return (audit && audit.date_debut && !audit.valide && isAuditeur) || false;
};
