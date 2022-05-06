import {ReferentielParamOption} from 'app/paths';

export type TEtoiles = '1' | '2' | '3' | '4' | '5';

/** Avancement courant de la collectivité dans le parcours de labellisation */
export interface LabellisationParcoursRead {
  /** Référentiel concerné */
  referentiel: ReferentielParamOption;
  /** Nombre d'étoiles atteignables */
  etoiles: TEtoiles;
  /** Vrai si le critère de remplissage du référentiel est rempli */
  completude_ok: boolean;
  /** Critères liés aux actions à remplir */
  criteres_action: CritereLabellisationAction[];
  /** Critère lié au score */
  critere_score: CritereLabellisationScore;
  /** Calendrier de labellisation */
  calendrier: string;
  derniere_demande: {
    etoiles: TEtoiles;
    demandee_le: Date;
  };
  derniere_labellisation: {
    etoiles: TEtoiles;
    obtenue_le: Date;
  };
}

/** Un critère de labellisation associé à une action */
export type CritereLabellisationAction = {
  /** Formulation (exemple: Identifier un·e élu·e référent·e) */
  formulation: string;
  /** Vrai si le critère est rempli */
  rempli: boolean;
  /** Identifiant de l'action (exemple: eci_1.1.1.1) */
  action_id: string;
  /** Identifiant de l'action dans le référentiel (exemple: 1.1.1.1) */
  action_identifiant: string;
  /** Statut ou score requis pour que le critère soit rempli (exemple: "Programmé
      ou fait") */
  statut_ou_score: string;
  /** Dates des prochaines sessions d'audit (exemple: Les prochaines sessions 
      d’audit sont planifiées du 23 avril au 23 juin 2022 et du 5 novembre 2022 
      au 5 janvier 2023.) */
  calendrier?: string;
  /** Information à propos de la dernière demande de labellisation pour l'étoile
      précédente */
  dernière_demande: null | {
    /** Date/heure de la dernière demande */
    demandee_le: Date;
    /** Etoiles demandées */
    etoiles: TEtoiles;
  };
  /** Information à propos de la dernière labellisation obtenue */
  derniere_labellisation: null | {
    /** Date/heure d'obtentien */
    obtenue_le: Date;
    /** Etoiles obtenues */
    etoiles: TEtoiles;
  };
};

/** Critère lié au score de la collectivité pour un référentiel */
export type CritereLabellisationScore = {
  atteint: boolean;
  etoiles: TEtoiles;
  score_fait: number;
  score_a_realiser: number;
};
