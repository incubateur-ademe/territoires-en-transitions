import { ObjectToSnake } from 'ts-case-convert';
import { LabellisationAudit } from '../labellisation-audit.schema';
import {
  LabellisationDemande,
  SujetDemande,
} from '../labellisation-demande.schema';
import { Etoile } from '../labellisation-etoile.enum.schema';
import { ParcoursLabellisationStatus } from '../parcours-labellisation-status.enum';
import {
  ConditionFichiers,
  ParcoursLabellisation,
} from '../parcours-labellisation.schema';
import { getMaxRequestableStar } from '../requestable-star';
import {
  RequestLabellisationRulesErrors,
  RequestLabellisationRulesErrorsEnum,
} from './request-labellisation.rules-errors';

// détermine l'état consolidé du cycle
type TDemandeEtOuAudit = {
  demande: ObjectToSnake<Pick<LabellisationDemande, 'enCours'>> | null;
  audit: ObjectToSnake<
    Pick<LabellisationAudit, 'valide' | 'dateDebut' | 'dateFin'>
  > | null;
};

export const getParcoursLabellisationStatus = (
  demandeEtOuAudit: TDemandeEtOuAudit | null | undefined
): ParcoursLabellisationStatus => {
  if (!demandeEtOuAudit) {
    return 'non_demandee';
  }
  const { demande, audit } = demandeEtOuAudit;
  if (audit?.valide) {
    return 'audit_valide';
  }
  if (audit?.date_debut && !audit?.valide) {
    return 'audit_en_cours';
  }
  if (demande && !demande.en_cours) {
    return 'demande_envoyee';
  }
  return 'non_demandee';
};

export type ParcoursLabellisationForRequest = Pick<
  ParcoursLabellisation,
  'status' | 'completude_ok' | 'critere_score' | 'isCot' | 'etoiles'
> & {
  conditionFichiers: Pick<ConditionFichiers, 'atteint'>;
  criteres_action: Pick<
    ParcoursLabellisation['criteres_action'][number],
    'atteint'
  >[];
};

export function canRequestAuditOrLabellisation(
  parcours: ParcoursLabellisationForRequest,
  sujet: SujetDemande,
  etoiles: Etoile | null
):
  | {
      canRequest: false;
      reason: RequestLabellisationRulesErrors;
    }
  | {
      canRequest: true;
      reason: null;
    } {
  if (sujet === 'cot' && etoiles !== null) {
    return {
      canRequest: false,
      reason:
        RequestLabellisationRulesErrorsEnum.ETOILE_NOT_ALLOWED_FOR_AUDIT_ONLY,
    };
  }

  if ((sujet === 'cot' || sujet === 'labellisation_cot') && !parcours.isCot) {
    return {
      canRequest: false,
      reason:
        RequestLabellisationRulesErrorsEnum.AUDIT_COT_NOT_ALLOWED_FOR_COLLECTIVITE_NOT_COT,
    };
  }

  if (sujet !== 'cot' && etoiles === null) {
    return {
      canRequest: false,
      reason:
        RequestLabellisationRulesErrorsEnum.MISSING_ETOILE_FOR_LABELLISATION,
    };
  }

  if (parcours.status !== 'non_demandee') {
    return {
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.AUDIT_ALREADY_REQUESTED,
    };
  }

  const prerequisites = areAuditPrerequisitesMet(parcours, sujet, etoiles);
  if (!prerequisites.met) {
    return {
      canRequest: false,
      reason: prerequisites.reason,
    };
  }

  return {
    canRequest: true,
    reason: null,
  };
}

export type AuditPrerequisitesError = Extract<
  RequestLabellisationRulesErrors,
  | 'REFERENTIEL_NOT_COMPLETED'
  | 'SCORE_GLOBAL_CRITERIA_NOT_SATISFIED'
  | 'SCORE_ACTIONS_CRITERIA_NOT_SATISFIED'
  | 'MISSING_FILE'
>;

export type ParcoursForAuditPrerequisites = Omit<
  ParcoursLabellisationForRequest,
  'status'
>;

export function areAuditPrerequisitesMet(
  parcours: ParcoursForAuditPrerequisites,
  sujet: SujetDemande,
  etoiles: Etoile | null
):
  | { met: true; reason: null }
  | { met: false; reason: AuditPrerequisitesError } {
  if (!parcours.completude_ok) {
    return {
      met: false,
      reason: RequestLabellisationRulesErrorsEnum.REFERENTIEL_NOT_COMPLETED,
    };
  }

  if (sujet === 'cot') {
    // Pour un audit seul sans labellisation, il suffit d'avoir le référentiel complet pour pouvoir demander un audit
    // il n'y a pas de critères de score
    return { met: true, reason: null };
  }

  // Pour les autres, il faut vérifier les critères de score
  if ((etoiles ?? 0) > getMaxRequestableStar(parcours.critere_score.score_fait)) {
    return {
      met: false,
      reason:
        RequestLabellisationRulesErrorsEnum.SCORE_GLOBAL_CRITERIA_NOT_SATISFIED,
    };
  }

  if (!parcours.criteres_action.every((c) => c.atteint)) {
    return {
      met: false,
      reason:
        RequestLabellisationRulesErrorsEnum.SCORE_ACTIONS_CRITERIA_NOT_SATISFIED,
    };
  }

  // Pour la première étoile, si on est un COT, on a pas besoin de déposer un fichier
  if (
    (sujet === 'labellisation_cot' || sujet === 'labellisation') &&
    parcours.isCot &&
    etoiles === 1
  ) {
    return { met: true, reason: null };
  }

  // Pour les autres cas, il faut vérifier le fichier déposé
  if (!parcours.conditionFichiers.atteint) {
    return {
      met: false,
      reason: RequestLabellisationRulesErrorsEnum.MISSING_FILE,
    };
  }

  return { met: true, reason: null };
}

export function isPremiereEtoileDemande(
  demande:
    | Pick<ObjectToSnake<LabellisationDemande>, 'etoiles' | 'sujet'>
    | null
    | undefined
): boolean {
  if (!demande) {
    return false;
  }
  return (
    demande.etoiles === '1' &&
    (demande.sujet === 'labellisation' || demande.sujet === 'labellisation_cot')
  );
}
