import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  useCollectiviteId,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { useLabellisationParcours } from '../labellisations/useLabellisationParcours';
import { TPreuveAudit } from '../preuves/Bibliotheque/types';
import { useReferentielId } from '../referentiel-context';

/**
 * Statut d'audit du référentiel et de la collectivité courante.
 */
export const useAudit = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();

  const parcours = useLabellisationParcours({
    collectiviteId: collectivite_id,
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

/** Liste des auditeurs pour la collectivité et le référentiel courant */
export const useAuditeurs = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();
  const parcours = useLabellisationParcours({
    collectiviteId: collectivite_id,
    referentielId: referentiel,
  });
  return { data: parcours?.auditeurs };
};

/** Indique si l'utilisateur courant est l'auditeur d'un audit donné */
export const useIsAuditAuditeur = (audit_id?: number) => {
  const user = useUser();

  return user.collectivites.some((collectivite) =>
    collectivite.audits.some((audit) => audit.auditId === audit_id)
  );
};

/** Rapport(s) associé(s) à un audit */
export const useRapportsAudit = (auditId?: number): TPreuveAudit[] => {
  const trpc = useTRPC();
  const { data: preuvesAudit } = useQuery(
    trpc.referentiels.labellisations.listPreuvesAudit.queryOptions(
      {
        auditId: auditId ?? 0,
      },
      {
        enabled: Boolean(auditId),
      }
    )
  );
  // TODO: fix this
  return (preuvesAudit || []) as unknown as TPreuveAudit[];
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
