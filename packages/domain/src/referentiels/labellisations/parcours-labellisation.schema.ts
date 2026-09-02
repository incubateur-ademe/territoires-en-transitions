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
  preuveNombre: number;
};

export type LabellisationAvecProchaineEtoile = Labellisation & {
  prochaineEtoile: Etoile | null;
};

export type ParcoursLabellisation = {
  collectiviteId: number;
  referentiel: ReferentielId;
  status: ParcoursLabellisationStatus;
  etoiles: Etoile;
  completudeOk: boolean;
  critereScore: LabellisationCritere;
  criteresAction: (Omit<
    EtoileActionConditionDefinition,
    'minRealiseScore' | 'minProgrammeScore'
  > & {
    atteint: boolean;
    proportionFait: number;
    proportionProgramme: number;
    statutOuScore: string;
  })[];
  labellisation: LabellisationAvecProchaineEtoile | null;
  demande: LabellisationDemande | null;
  audit: LabellisationAudit | null;
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
