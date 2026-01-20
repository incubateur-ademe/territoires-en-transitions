import { Etoile } from '@tet/domain/referentiels';
import { Database } from '../database.types.ts';
import { supabase } from '../supabase.ts';

export type TEtoiles = Database['labellisation']['Enums']['etoile'];

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
  /** Dates des prochaines sessions d'audit (exemple: Les prochaines sessions
   d’audit sont planifiées du 23 avril au 23 juin 2022 et du 5 novembre 2022
   au 5 janvier 2023.) */
  calendrier: string;
  /** Demande de labellisation associée au parcours */
  demande: TDemandeAudit | null;
  /** Dernière labellisation obtenue */
  labellisation: Database['public']['Tables']['labellisation']['Row'] | null;
  /** Audit associée à la demande */
  audit: Database['public']['Views']['audit']['Row'] | null;
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
  /** Identifiant de l'action dans le référentiel (exemple: 1.1.1.1) */
  action_identifiant: string;
  /** Statut ou score requis pour que le critère soit rempli (exemple: "Programmé
   ou fait") */
  statut_ou_score: string;
  /** Etoile pour laquelle le critère est requis */
  etoile: Etoile;
};

/** Critère lié au score de la collectivité pour un référentiel */
type TCritereScore = {
  atteint: boolean;
  etoiles: TEtoiles;
  score_fait: number;
  score_a_realiser: number;
};

export async function labellisationParcours(
  collectivite_id: number
): Promise<TLabellisationParcours[]> {
  const { data, error } = await supabase
    .rpc('labellisation_parcours', { collectivite_id })
    .select();
  if (!data || error) {
    console.error(error);
    throw `La RPC 'labellisation_parcours' devrait renvoyer un parcours`;
  }

  return data;
}
