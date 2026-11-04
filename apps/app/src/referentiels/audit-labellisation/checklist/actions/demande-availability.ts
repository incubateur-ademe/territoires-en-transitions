import { appLabels } from '@/app/labels/catalog';
import { getRequestAuditTooltip } from '@/app/referentiels/audit-labellisation/audit-badge-status';
import {
  AuditRequestUnavailableReason,
  getAuditRequestAvailability,
  listAuditTypeOptions,
  ParcoursLabellisation,
  SujetDemande,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { match } from 'ts-pattern';
import { DemandeVisee } from '../../demande-visee';
import {
  PremiereEtoileDemandeState,
  getPremiereEtoileDemandeState,
} from './premiere-etoile-demande-state';

export type DemandeAvailability =
  | { isRequestable: true }
  | { isRequestable: false; tooltip: string };

type AuditDemandeVisee = Exclude<DemandeVisee, { kind: 'premiere-etoile' }>;

const premiereEtoileAvailability = (
  state: PremiereEtoileDemandeState
): DemandeAvailability =>
  match(state)
    .returnType<DemandeAvailability>()
    .with({ kind: 'requestable' }, () => ({ isRequestable: true }))
    .with({ kind: 'request-pending' }, () => ({
      isRequestable: false,
      tooltip: appLabels.demandePremiereEtoileEnCours,
    }))
    .with({ kind: 'criteria-incomplete' }, () => ({
      isRequestable: false,
      tooltip: appLabels.tousCriteresRequisPourDemande,
    }))
    .with({ kind: 'other-cycle-in-progress' }, ({ reason }) => ({
      isRequestable: false,
      tooltip: getRequestAuditTooltip(reason),
    }))
    .exhaustive();

const tooltipForUnavailableAudit = (
  reason: AuditRequestUnavailableReason
): string =>
  match(reason)
    .with({ kind: 'cycleUnavailable' }, ({ cause }) =>
      getRequestAuditTooltip(cause)
    )
    .with(
      { kind: 'auditTypeUnavailable', cause: 'SCORE_BELOW_AUDITABLE_STAR' },
      () => appLabels.demanderAuditScoreInsuffisant
    )
    .with(
      { kind: 'auditTypeUnavailable', cause: 'REFERENTIEL_NOT_COMPLETED' },
      () => appLabels.completudeCritere
    )
    .with(
      {
        kind: 'auditTypeUnavailable',
        cause: 'SCORE_GLOBAL_CRITERIA_NOT_SATISFIED',
      },
      {
        kind: 'auditTypeUnavailable',
        cause: 'SCORE_ACTIONS_CRITERIA_NOT_SATISFIED',
      },
      { kind: 'auditTypeUnavailable', cause: 'REFERENT_ROLES_NOT_DEFINED' },
      { kind: 'auditTypeUnavailable', cause: 'MISSING_FILE' },
      () => appLabels.renseignerCriteresPourDemande
    )
    .exhaustive();

const toAuditSujet = (demande: AuditDemandeVisee): SujetDemande =>
  demande.kind === 'audit-cot' ? SujetDemandeEnum.COT : demande.sujet;

const auditAvailability = ({
  demande,
  parcours,
  isCOT,
}: {
  demande: AuditDemandeVisee;
  parcours: ParcoursLabellisation;
  isCOT: boolean;
}): DemandeAvailability => {
  const auditTypeOptions = listAuditTypeOptions(parcours, { isCOT }).filter(
    (option) => option.sujet === toAuditSujet(demande)
  );
  const availability = getAuditRequestAvailability(parcours, auditTypeOptions);
  if (availability.canRequest) {
    return { isRequestable: true };
  }
  return {
    isRequestable: false,
    tooltip: tooltipForUnavailableAudit(availability.reason),
  };
};

export const getDemandeAvailability = ({
  demande,
  parcours,
  isCOT,
  canAskFirstStar,
}: {
  demande: DemandeVisee;
  parcours: ParcoursLabellisation;
  isCOT: boolean;
  canAskFirstStar: boolean;
}): DemandeAvailability => {
  if (demande.kind === 'premiere-etoile') {
    return premiereEtoileAvailability(
      getPremiereEtoileDemandeState({ canAskFirstStar, parcours })
    );
  }
  return auditAvailability({ demande, parcours, isCOT });
};
