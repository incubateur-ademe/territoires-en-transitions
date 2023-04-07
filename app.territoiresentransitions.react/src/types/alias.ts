import {Database} from 'types/database.types';

export type TFicheAction = Database['public']['Views']['fiches_action']['Row'];
export type TFicheActionInsert =
  Database['public']['Tables']['fiche_action']['Insert'];
export type TFicheActionUpdate =
  Database['public']['Tables']['fiche_action']['Update'];

export type TAxeRow = Database['public']['Tables']['axe']['Row'];
export type TAxeInsert = Database['public']['Tables']['axe']['Insert'];
export type TAxeUpdate = Database['public']['Tables']['axe']['Update'];

export type TPlanActionChemin =
  Database['public']['Views']['plan_action_chemin']['Row'];

export type TPlanActionProfondeur =
  Database['public']['Views']['plan_action_profondeur']['Row'];

export type TThematiqueRow = Database['public']['Tables']['thematique']['Row'];
export type TThematiqueInsert =
  Database['public']['Tables']['thematique']['Insert'];

export type TSousThematiqueRow =
  Database['public']['Tables']['sous_thematique']['Row'];
export type TSousThematiqueInsert =
  Database['public']['Tables']['sous_thematique']['Insert'];

export type TFicheActionStructureRow =
  Database['public']['Tables']['structure_tag']['Row'];
export type TFicheActionStructureInsert =
  Database['public']['Tables']['structure_tag']['Insert'];

export type TFicheActionServicePiloteRow =
  Database['public']['Tables']['service_tag']['Row'];
export type TFicheActionServicePiloteInsert =
  Database['public']['Tables']['service_tag']['Insert'];

export type TFicheActionPersonnePiloteRow =
  Database['public']['Tables']['personne_tag']['Row'];
export type TFicheActionPersonnePiloteInsert =
  Database['public']['Tables']['personne_tag']['Insert'];

export type TPartenaireRow =
  Database['public']['Tables']['partenaire_tag']['Row'];
export type TPartenaireInsert =
  Database['public']['Tables']['partenaire_tag']['Insert'];

export type TFinanceurTagRow =
  Database['public']['Tables']['financeur_tag']['Row'];
export type TFinanceurTagInsert =
  Database['public']['Tables']['financeur_tag']['Insert'];

export type TAnnexeRow = Database['public']['Tables']['annexe']['Row'];
export type TAnnexeInsert = Database['public']['Tables']['annexe']['Insert'];

export type TActionRow = Database['public']['Tables']['action_relation']['Row'];
export type TActionInsert =
  Database['public']['Tables']['action_relation']['Insert'];

export type TPersonneTagInsert =
  Database['public']['Tables']['personne_tag']['Insert'];

export type TFicheResume = Database['public']['Views']['fiche_resume']['Row'];

export type TPersonne = Database['public']['CompositeTypes']['personne'];
export type TIndicateur =
  Database['public']['CompositeTypes']['indicateur_generique'];
export type TFinanceurMontant =
  Database['public']['CompositeTypes']['financeur_montant'];

export type TFicheActionCibles =
  Database['public']['Enums']['fiche_action_cibles'];
export type TFicheActionNiveauxPriorite =
  Database['public']['Enums']['fiche_action_niveaux_priorite'];
export type TFicheActionPiliersECI =
  Database['public']['Enums']['fiche_action_piliers_eci'];
export type TFicheActionResultatsAttendus =
  Database['public']['Enums']['fiche_action_resultats_attendus'];
export type TFicheActionStatuts =
  Database['public']['Enums']['fiche_action_statuts'];

export type TActionRelationInsert =
  Database['public']['Tables']['action_relation']['Insert'];
