/** Un critère de labellisation */
export type CritereLabellisation =
  | CritereLabellisationSimple
  | CritereLabellisationAction
  | CritereLabellisationListeActions
  | CritereLabellisationListeFichiers;

/** Un critère de labellisation "simple" */
export type CritereLabellisationSimple = {
  /** Identifiant du critère (exemple: 1.1) */
  id: string;
  /** Formulation (exemple: Renseigner tous les statuts du référentiel) */
  formulation: string;
  /** Vrai si le critère est rempli */
  rempli: boolean;
};

/** Un critère de labellisation associé à une liste de sous-critères, eux-mêmes
    associés à des actions */
export type CritereLabellisationListeActions = {
  /** Identifiant du critère (exemple: 1.2) */
  id: string;
  /** Formulation (exemple: "Être une collectivité engagée dans une politique 
      Économie circulaire et le prouver (via les documents preuves ou un texte 
      justificatif)" ) */
  formulation: string;
  /** Vrai si le critère est rempli */
  rempli: boolean;
  /** Tableau des critères associés aux actions */
  criteres: CritereLabellisationAction[];
};

/** Un critère de labellisation associé à une action */
export type CritereLabellisationAction = {
  /** Identifiant du critère (exemple: 1.2.1) */
  id: string;
  /** Formulation (exemple: Identifier un·e élu·e référent·e) */
  formulation: string;
  /** Vrai si le critère est rempli */
  rempli: boolean;
  /** Identifiant de l'action (exemple: eci_1.1.1.1) */
  action_id: string;
  /** Statut ou score requis pour que le critère soit rempli (exemple: "Programmé 
      ou fait") */
  statut_ou_score: string;
};

/** Un critère de labellisation nécessitant l'ajout d'un ou plusieurs fichiers */
export type CritereLabellisationListeFichiers = {
  /** Identifiant du critère (exemple: 2.3) */
  id: string;
  /** Formulation (exemple: Ajouter les documents officiels de candidature) */
  formulation: string;
  /** Vrai si le critère est rempli (au moins un fichier est disponible
   * dans le tableau `fichiers`) */
  rempli: boolean;
  /** Fichiers requis */
  fichiers: CritereLabellisationFichier[];
};

/** Un fichier attendu pour remplir un critère de labellisation */
export type CritereLabellisationFichier = {
  /** Descriptif du fichier attendu (exemple: Courrier d’acte de candidature)  */
  formulation: string;
  /** Identifiant du bucket de la collectivité */
  bucket_id: string;
  /** Nom du fichier dans le bucket de la collectivité (exemple:
   * 'courrier-acte-candidature.pdf'). */
  filename: string;
};

/** Avancement courant de la collectivité dans le parcours de labellisation */
export type ParcoursLabellisation = {
  /** Identifiant de la collectivité */
  collectivite_id: number;
  /** Référentiel concerné */
  referentiel: string;
  /** Nombre d'étoiles atteignables */
  etoiles: number;
  /** Critères à remplir */
  criteres: CritereLabellisation[];
  /** Vrai si tous les critères sont remplis */
  rempli: boolean;
  /** Dates des prochaines sessions d'audit (exemple: Les prochaines sessions 
      d’audit sont planifiées du 23 avril au 23 juin 2022 et du 5 novembre 2022 
      au 5 janvier 2023.) */
  calendrier?: string;
  /** Information à propos de la dernière demande de labellisation pour l'étoile
      précédente */
  dernière_demande: {
    /** Date/heure de la dernière demande */
    demandee_le: Date;
    /** Etoiles demandées */
    etoiles: number;
  };
};
