import { Database, Tables } from '@/api';
import { TAudit } from '@/app/referentiels/audits/types';
import { Etoile } from '@/domain/referentiels';

export type TEtoiles = Database['labellisation']['Enums']['etoile'];
export type TSujetDemande = Database['labellisation']['Enums']['sujet_demande'];

// typage d'une demande d'audit (tel qu'exporté par gen_types)
export type TLabellisationDemande =
  Database['labellisation']['Tables']['demande']['Row'];
// et surchargé pour gérer le cas sujet="cot" (audit SANS labellisation)
type TDemandeAudit = Omit<TLabellisationDemande, 'etoiles'> & {
  etoiles: TLabellisationDemande['etoiles'] | null;
};

/**
 * Avancement courant de la collectivité dans le parcours de labellisation
 * (type retourné par la RPC `labellisation_parcours`)
 */
export type TLabellisationParcours = {
  collectivite_id: number;
  /** Référentiel concerné */
  referentiel: Database['public']['Enums']['referentiel'];
  /** Nombre d'étoiles atteignables */
  etoiles: Etoile;
  /** Vrai si le critère de remplissage du référentiel est rempli */
  completude_ok: boolean;
  /** Critères liés aux actions à remplir */
  criteres_action: TCritereAction[];
  /** Critère lié au score */
  critere_score: TCritereScore;
  /** Indique que les critères action, score et fichiers de labellisation sont tous atteints */
  rempli: boolean;
  /** Demande de labellisation associée au parcours */
  demande: TDemandeAudit | null;
  /** Dernière labellisation obtenue */
  labellisation: Tables<'labellisation'> | null;
  /** Audit associée à la demande */
  audit: TAudit | null;
};

/** Critère de labellisation associé à une action */
type TCritereAction = {
  /** Formulation (exemple: Identifier un·e élu·e référent·e) */
  formulation: string;
  /** Vrai si le critère est rempli */
  rempli: boolean;
  /** Ordre d'affichage du critère */
  prio: number;
  /** Identifiant de l'action (exemple: eci_1.1.1.1) */
  action_id: string;
  /** Statut ou score requis pour que le critère soit rempli (exemple: "Programmé
      ou fait") */
  statut_ou_score: string;
  /** Etoile pour laquelle le critère est requis */
  etoile: Etoile;
};

/** Critère lié au score de la collectivité pour un référentiel */
type TCritereScore = {
  atteint: boolean;
  etoiles: Etoile;
  score_fait: number;
  score_a_realiser: number;
};
