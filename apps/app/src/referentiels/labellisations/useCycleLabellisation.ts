import { useGetCollectivite } from '@/app/collectivites/collectivites/use-get-collectivite';
import { AuditViewerRole, getViewerRole } from '@/app/referentiels/audit-labellisation/audit-badge-status';
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
import { useIsAuditeur } from '../audits/useAudit';
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
  labellisable: boolean;
  maximumRequestableStar: Etoile | null;
  peutDemanderEtoile: boolean;
  canStartAudit: boolean;
  peutDemander1ereEtoileCOT: boolean;
  canAskFirstStar: boolean;
};

export const useCycleLabellisation = (
  referentielId: ReferentielId
): TCycleLabellisation => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const isAuditeur = useIsAuditeur();
  const user = useUser();
  const { data: identite } = useGetCollectivite(collectiviteId);

  const { parcours, isLoading, isError } = useLabellisationParcours({
    collectiviteId,
    referentielId,
  });

  const status = parcours?.status || 'non_demandee';
  const isConductingAudit = isAuditeur && status === 'audit_en_cours';
  const isCOT = Boolean(identite?.activeCOT);
  const hasMutatePermission = hasCollectivitePermission('referentiels.mutate');
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

  const peutDemander1ereEtoileCOT = parcours
    ? hasMutatePermission &&
      canRequestAuditOrLabellisation(
        parcours,
        SujetDemandeEnum.LABELLISATION_COT,
        1
      ).canRequest
    : false;

  const maximumRequestableStar = parcours
    ? getMaxRequestableStar(parcours.critere_score.score_fait)
    : null;

  const peutDemanderEtoile =
    parcours !== null && maximumRequestableStar !== null
      ? hasMutatePermission &&
        canRequestAuditOrLabellisation(
          parcours,
          SujetDemandeEnum.LABELLISATION,
          maximumRequestableStar
        ).canRequest
      : false;

  const labellisable = peutDemanderEtoile && maximumRequestableStar !== 1;

  return {
    parcours,
    isLoading,
    isError,
    status,
    isAuditeur,
    isConductingAudit,
    viewerRole,
    isCOT,
    peutDemanderEtoile,
    peutDemander1ereEtoileCOT,
    canStartAudit,
    labellisable,
    maximumRequestableStar,
    canAskFirstStar,
  };
};

export const usePreuvesLabellisation = (demande_id?: number) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.referentiels.labellisations.listPreuvesLabellisation.queryOptions(
      { demandeId: demande_id ?? 0 },
      { enabled: Boolean(demande_id) }
    )
  );
};
