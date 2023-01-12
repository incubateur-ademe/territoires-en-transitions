import {Database} from 'types/database.types';

// export type TFicheAction = Database['public']['Tables']['fiche_action']['Row'];
export type TFicheAction = Database['public']['Views']['fiches_action']['Row'];
export type TFicheActionInsert =
  Database['public']['Tables']['fiche_action']['Insert'];
export type TFicheActionUpdate =
  Database['public']['Tables']['fiche_action']['Update'];

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

export type TFicheActionPersonnePiloteRow =
  Database['public']['Tables']['personne_tag']['Row'];
export type TFicheActionPersonnePiloteInsert =
  Database['public']['Tables']['personne_tag']['Insert'];

export type TPartenaireRow =
  Database['public']['Tables']['partenaire_tag']['Row'];
export type TPartenaireInsert =
  Database['public']['Tables']['partenaire_tag']['Insert'];

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
