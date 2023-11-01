import {Database} from 'types/database.types';
import {NonNullableFields} from './utils';

// Alias génériques sur le typage de la base
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
export type CompositeTypes<
  T extends keyof Database['public']['CompositeTypes']
> = Database['public']['CompositeTypes'][T];

export type TFlatAxe = Database['public']['CompositeTypes']['flat_axe_node'];

export type TFicheAction = Views<'fiches_action'>;
export type TFicheActionInsert = TablesInsert<'fiche_action'>;
export type TFicheActionUpdate = TablesUpdate<'fiche_action'>;

export type TAxeRow = Tables<'axe'>;
export type TAxeInsert = TablesInsert<'axe'>;
export type TAxeUpdate = TablesUpdate<'axe'>;

export type TPlanActionChemin = Views<'plan_action_chemin'>;

export type TPlanActionProfondeur = Views<'plan_action_profondeur'>;

export type TThematiqueRow = Tables<'thematique'>;
export type TThematiqueInsert = TablesInsert<'thematique'>;

export type TSousThematiqueRow = Tables<'sous_thematique'>;
export type TSousThematiqueInsert = TablesInsert<'sous_thematique'>;

export type TFicheActionStructureRow = Tables<'structure_tag'>;
export type TFicheActionStructureInsert = TablesInsert<'structure_tag'>;

export type TFicheActionServicePiloteRow = Tables<'service_tag'>;
export type TFicheActionServicePiloteInsert = TablesInsert<'service_tag'>;

export type TFicheActionPersonnePiloteRow = Tables<'personne_tag'>;
export type TFicheActionPersonnePiloteInsert = TablesInsert<'personne_tag'>;

export type TPartenaireRow = Tables<'partenaire_tag'>;
export type TPartenaireInsert = TablesInsert<'partenaire_tag'>;

export type TFinanceurTagRow = Tables<'financeur_tag'>;
export type TFinanceurTagInsert = TablesInsert<'financeur_tag'>;

export type TAnnexeRow = Tables<'annexe'>;
export type TAnnexeInsert = TablesInsert<'annexe'>;

export type TActionRow = Tables<'action_relation'>;
export type TActionInsert = TablesInsert<'action_relation'>;

export type TPersonneTagInsert = TablesInsert<'personne_tag'>;

export type TFicheResume = Views<'fiche_resume'>;

export type TPersonne = Database['public']['CompositeTypes']['personne'];
export type TIndicateur =
  Database['public']['CompositeTypes']['indicateur_generique'];
export type TFinanceurMontant =
  Database['public']['CompositeTypes']['financeur_montant'];

export type TFicheActionCibles = Enums<'fiche_action_cibles'>;
export type TFicheActionNiveauxPriorite =
  Enums<'fiche_action_niveaux_priorite'>;
export type TFicheActionPiliersECI = Enums<'fiche_action_piliers_eci'>;
export type TFicheActionResultatsAttendus =
  Enums<'fiche_action_resultats_attendus'>;
export type TFicheActionStatuts = Enums<'fiche_action_statuts'>;
export type TFicheActionEcheances = Enums<'fiche_action_echeances'>;

export type TActionRelationInsert = TablesInsert<'action_relation'>;

export type TActionAvancement = Enums<'avancement'>;
export type TActionAvancementExt = TActionAvancement | 'non_concerne';

export type TActionStatutsRow = NonNullableFields<Views<'action_statuts'>>;

export type TNomCollectivite = NonNullableFields<Views<'named_collectivite'>>;

export type TNiveauAcces = Enums<'niveau_acces'>;

export type TMembreFonction = Enums<'membre_fonction'>;
