import { TAuditEnCours } from '@/app/referentiels/audits/types';
import {
  Etoile,
  Labellisation,
  LabellisationCritere,
  LabellisationDemande,
  ReferentielId,
} from '@tet/domain/referentiels';
import { ObjectToSnake } from 'ts-case-convert';

// et surchargé pour gérer le cas sujet="cot" (audit SANS labellisation)
// type TDemandeAudit = Omit<TLabellisationDemande, 'etoiles'> & {
//   etoiles: TLabellisationDemande['etoiles'] | null;
// };

/**
 * Avancement courant de la collectivité dans le parcours de labellisation
 * (type retourné par la RPC `labellisation_parcours`)
 */
export type TLabellisationParcours = {
  collectivite_id: number;
  /** Référentiel concerné */
  referentiel: ReferentielId;
  /** Nombre d'étoiles atteignables */
  etoiles: Etoile;
  /** Vrai si le critère de remplissage du référentiel est rempli */
  completude_ok: boolean;
  /** Critères liés aux actions à remplir */
  criteres_action: TCritereAction[];
  /** Critère lié au score */
  critere_score: LabellisationCritere;
  /** Indique que les critères action, score et fichiers de labellisation sont tous atteints */
  rempli: boolean;
  /** Demande de labellisation associée au parcours */
  demande: ObjectToSnake<LabellisationDemande> | null;
  /** Dernière labellisation obtenue */
  labellisation: ObjectToSnake<Labellisation> | null;
  /** Audit associée à la demande */
  audit: TAuditEnCours | null;
};

/** Critère de labellisation associé à une action */
type TCritereAction = {
  /** Formulation (exemple: Identifier un·e élu·e référent·e) */
  formulation: string;
  /** Vrai si le critère est rempli */
  rempli: boolean;
  /** Ordre d'affichage du critère */
  priorite: number;
  /** Identifiant de l'action (exemple: eci_1.1.1.1) */
  action_id: string;
  /** Statut ou score requis pour que le critère soit rempli (exemple: "Programmé
      ou fait") */
  statut_ou_score: string;
  /** Etoile pour laquelle le critère est requis */
  etoile: Etoile;
};
