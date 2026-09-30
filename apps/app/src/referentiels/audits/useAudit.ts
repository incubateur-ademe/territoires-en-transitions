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
    collectiviteId,
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
