import { ObjectToSnake } from 'ts-case-convert';
import { ReferentielId } from '../referentiel-id.enum';
import { ScoresPayload } from '../scores/score-snapshot-action-scores-payload.schema';
import { EtoileActionConditionDefinition } from './etoile-action-condition-definition.schema';
import { LabellisationAudit } from './labellisation-audit.schema';
import { LabellisationCritere } from './labellisation-critere.schema';
import { LabellisationDemande } from './labellisation-demande.schema';
import { PreuveWithObjet } from './expected-documents/expected-documents.rule';
import { Etoile } from './labellisation-etoile.enum.schema';
import { Labellisation } from './labellisation.schema';
import { ReferentRolesDefined } from './role-mesures/role-mesures';
import { ParcoursLabellisationStatus } from './parcours-labellisation-status.enum';

export type ConditionFichiers = {
  referentiel: ReferentielId;
  preuve_nombre: number;
  atteint: boolean;
};

// TODO: remove ObjectToSnake when front is updated
export type ParcoursLabellisation = {
  collectivite_id: number;
  referentiel: ReferentielId;
  status: ParcoursLabellisationStatus;
  etoiles: Etoile;
  completude_ok: boolean;
  critere_score: LabellisationCritere;
  criteres_action: ObjectToSnake<
    Omit<
      EtoileActionConditionDefinition,
      'minRealiseScore' | 'minProgrammeScore'
    > & {
      atteint: boolean;
      proportionFait: number;
      proportionProgramme: number;
      statut_ou_score: string;
    }
  >[];
  labellisation:
    | (ObjectToSnake<Labellisation> & { prochaine_etoile: Etoile | null })
    | null;
  demande: ObjectToSnake<LabellisationDemande> | null;
  audit: ObjectToSnake<LabellisationAudit> | null;
  isCot: boolean;
  referentRolesDefined: ReferentRolesDefined;
  conditionFichiers: ConditionFichiers;
  preuvesObjets: PreuveWithObjet[];
  score: ScoresPayload['scores']['score'];
  auditeurs: {
    userId: string;
    nom: string;
  }[];
};
