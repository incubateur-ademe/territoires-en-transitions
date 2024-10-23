/**
 * Liste les types retournés par l'api de directus
 */

export type Link = {
  label: string;
  url: string;
};

export type Niveau = {
  niveau: number;
  nom: string;
  notice?: string | null;
};

export type Partenaire = {
  id: number;
  nom: string;
};

export type ImpactCarbone = {
  id: number;
  nom: string;
};

export type Typologie = {
  id: number;
  nom: string;
};

export type SousThematiques = {
  id: number;
  action_impact_id: number;
  sous_thematique_id?: number; // Ne devrait pas être optionnel
};

export type EffetsAttendus = {
  id: number;
  action_impact_id: number;
  action_impact_effet_attendu_id: number;
};

export type Thematiques = {
  id: number;
  action_impact_id: number;
  thematique_id: number;
};

export type Partenaires = {
  id: number;
  action_impact_id: number;
  action_impact_partenaire_id: number;
};

export type IndicateursSuivi = {
  id: number;
  action_impact_id: number;
  indicateur_suivi_id: number;
};

export type Indicateurs = {
  id: number;
  action_impact_id: number;
  indicateur_predefini_id?: string;
};

export type ActionsReferentiel = {
  id: number;
  action_impact_id: number;
  action_referentiel_id: string;
};

export type ActionImpact = {
  id: number;
  titre: string;
  description_courte: string;
  fourchette_budgetaire: Niveau;
  description_longue?: string;
  temps_de_mise_en_oeuvre: Niveau;
  ressources_externes?: Link[];
  rex?: Link[];
  subventions_mobilisables?: Link[];
  typologie: Typologie;
  notes_travail?: string;
  statut: string;
  elements_budgetaires?: string;
  indicateur_impact_carbone?: ImpactCarbone;
  competences_communales?: boolean;
  independamment_competences?: boolean;
  sous_thematiques: SousThematiques[];
  effets_attendus: EffetsAttendus[];
  thematiques: Thematiques[];
  partenaires: Partenaires[];
  indicateurs_suivi: IndicateursSuivi[];
  indicateurs: Indicateurs[];
  actions_referentiel: ActionsReferentiel[];
  banatic_competences_parentes: any[];
  banatic_competences: any[];
};

export type Thematique = {
  id: number;
  nom: string;
};

export type SousThematique = {
  id: number;
  nom: string;
  thematique?: Thematique | null; //une thématique au moins est cassée
};
