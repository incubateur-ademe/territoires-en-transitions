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

  if (!parcours.completude_ok) {
    return {
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.REFERENTIEL_NOT_COMPLETED,
    };
  }

  if (sujet === 'cot') {
    // Pour un audit seul sans labellisation, il suffit d'avoir le référentiel complet pour pouvoir demander un audit
    // il n'y a pas de critères de score
    return {
      canRequest: true,
      reason: null,
    };
  }

  // Pour les autres, il faut vérifier les critères de score
  if ((etoiles || 0) > parcours.etoiles || !parcours.critere_score.atteint) {
    return {
      canRequest: false,
      reason:
        RequestLabellisationRulesErrorsEnum.SCORE_GLOBAL_CRITERIA_NOT_SATISFIED,
    };
  }

  if (!parcours.criteres_action.every((c) => c.atteint)) {
    return {
      canRequest: false,
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
    return {
      canRequest: true,
      reason: null,
    };
  }

  // Pour les autres cas, il faut vérifier le fichier déposé
  if (!parcours.conditionFichiers.atteint) {
    return {
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.MISSING_FILE,
    };
  }

  return {
    canRequest: true,
    reason: null,
  };
}
