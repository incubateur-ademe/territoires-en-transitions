import { useGetCollectivite } from '@/app/collectivites/collectivites/use-get-collectivite';
import {
  AuditViewerRole,
  getViewerRole,
} from '@/app/referentiels/audit-labellisation/audit-badge-status';
import { useQuery } from '@tanstack/react-query';
import { useTRPC, useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  canRequestAuditOrLabellisation,
  canStartAudit as canStartAuditRule,
  Etoile,
  getMaxRequestableStar,
  ParcoursLabellisation,
  ParcoursLabellisationStatus,
  ReferentielId,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { isUserAuditeurForAudit } from '@tet/domain/users';
import { useLabellisationParcours } from './useLabellisationParcours';

export type TCycleLabellisation = {
  parcours: ParcoursLabellisation | null;
  isLoading: boolean;
  isError: boolean;
  status: ParcoursLabellisationStatus;
  isAuditeur: boolean;
  isConductingAudit: boolean;
  viewerRole: AuditViewerRole;
  isCOT: boolean;
  maximumRequestableStar: Etoile | null;
  canStartAudit: boolean;
  canAskFirstStar: boolean;
};

export const useCycleLabellisation = (
  referentielId: ReferentielId
): TCycleLabellisation => {
  const { collectiviteId, hasReferentielPermission } = useCurrentCollectivite();
  const user = useUser();
  const { data: identite } = useGetCollectivite(collectiviteId);

  const { parcours, isLoading, isError } = useLabellisationParcours({
    collectiviteId,
    referentielId,
  });

  const isAuditeur = parcours?.audit
    ? isUserAuditeurForAudit(user, parcours.audit.id)
    : false;
  const status = parcours?.status || 'non_demandee';
  const isConductingAudit = isAuditeur && status === 'audit_en_cours';
  const isCOT = Boolean(identite?.activeCOT);
  const hasMutatePermission = hasReferentielPermission(
    'referentiels.mutate',
    referentielId
  );
  const viewerRole = getViewerRole({
    isAuditor: isAuditeur,
    canMutate: hasMutatePermission,
  });

  const canStartAudit = canStartAuditRule(parcours, user.id).canRequest;

  const canAskFirstStar = parcours
    ? hasMutatePermission &&
      canRequestAuditOrLabellisation(
        parcours,
        isCOT
          ? SujetDemandeEnum.LABELLISATION_COT
          : SujetDemandeEnum.LABELLISATION,
        1
      ).canRequest
    : false;

  const maximumRequestableStar = parcours
    ? getMaxRequestableStar(parcours.critereScore.scoreFait)
    : null;

  return {
    parcours,
    isLoading,
    isError,
    status,
    isAuditeur,
    isConductingAudit,
    viewerRole,
    isCOT,
    canStartAudit,
    maximumRequestableStar,
    canAskFirstStar,
  };
};

export const usePreuvesLabellisation = (demandeId?: number) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.referentiels.labellisations.listPreuvesLabellisation.queryOptions(
      { demandeId: demandeId ?? 0 },
      { enabled: Boolean(demandeId) }
    )
  );
};
