import {
  CompositeTypes,
  Enums,
  NonNullableFields,
  Tables,
  TablesInsert,
  Views,
} from '@/api';
import { CollectiviteMembre } from '@/app/referentiels/tableau-de-bord/referents/useMembres';

export type TFlatAxe = NonNullableFields<CompositeTypes<'flat_axe_node'>>;

export type TAxeRow = Tables<'axe'>;
export type TAxeInsert = TablesInsert<'axe'>;

export type TPlanActionChemin = Views<'plan_action_chemin'>;

export type TPlanActionProfondeur = Views<'plan_action_profondeur'>;

export type TPersonne = CompositeTypes<'personne'>;

export type TFicheActionNiveauxPriorite =
  Enums<'fiche_action_niveaux_priorite'>;
export type TFicheActionStatuts = Enums<'fiche_action_statuts'>;
export type TFicheActionEcheances = Enums<'fiche_action_echeances'>;

export type TActionStatutsRow = NonNullableFields<Views<'action_statuts'>>;

export type TNiveauAcces = Enums<'niveau_acces'>;

export type TMembreFonction = Exclude<CollectiviteMembre['fonction'], null>;
