import { Database } from '../_shared/database.types.ts';

export type TFicheActionExport = {
  axe_id: number;
  axe_nom: string;
  axe_path: string[];
  fiche: {
    axe_id: number;
    fiche: FicheAction | null;
  };
};

type TFicheAction = Database['public']['Views']['fiches_action']['Row'];
type TThematique = Database['public']['Tables']['thematique']['Row'];
type TSousThematique = Database['public']['Tables']['sous_thematique']['Row'];
type TPartenaireInsert =
  Database['public']['Tables']['partenaire_tag']['Insert'];
type TFicheActionStructureInsert =
  Database['public']['Tables']['structure_tag']['Insert'];
type TAnnexe = Database['public']['Tables']['annexe']['Row'];
type TAxeInsert = Database['public']['Tables']['axe']['Insert'];
type TActionInsert = Database['public']['Tables']['action_relation']['Insert'];
type TFicheActionServicePiloteInsert =
  Database['public']['Tables']['service_tag']['Insert'];
type FicheAction = Omit<
  TFicheAction,
  | 'thematiques'
  | 'sous_thematiques'
  | 'partenaires'
  | 'structures'
  | 'pilotes'
  | 'referents'
  | 'annexes'
  | 'axes'
  | 'actions'
  | 'indicateurs'
  | 'services'
  | 'financeurs'
  | 'fiches_liees'
> & {
  thematiques: TThematique[] | null;
  sous_thematiques: TSousThematique[] | null;
  partenaires: TPartenaireInsert[] | null;
  structures: TFicheActionStructureInsert[] | null;
  pilotes: Personne[] | null;
  referents: Personne[] | null;
  annexes: TAnnexe[] | null;
  axes: TAxeInsert[] | null;
  actions: TActionInsert[] | null;
  indicateurs: Indicateur[] | null;
  services: TFicheActionServicePiloteInsert[] | null;
  financeurs: Financeur[];
  fiches_liees: FicheResume[] | null;
};

type TPersonne = Database['public']['CompositeTypes']['personne'];
type Personne = Omit<TPersonne, 'tag_id' | 'user_id'> & {
  tag_id?: number | null;
  user_id?: string | null;
};

type TIndicateur = Database['public']['CompositeTypes']['indicateur_generique'];
type Indicateur = Omit<
  TIndicateur,
  'indicateur_id' | 'indicateur_personnalise_id'
> & {
  indicateur_id?: string | null;
  indicateur_personnalise_id?: number | null;
};

type TFinanceurMontant =
  Database['public']['CompositeTypes']['financeur_montant'];
type TFinanceurTagInsert =
  Database['public']['Tables']['financeur_tag']['Insert'];
export type Financeur = Omit<
  TFinanceurMontant,
  'id' | 'montant_ttc' | 'financeur_tag'
> & {
  id?: number;
  montant_ttc?: number;
  financeur_tag: TFinanceurTagInsert;
};

type TFicheResume = Database['public']['Views']['fiche_resume']['Row'];
type FicheResume = Omit<TFicheResume, 'plans'> & {
  plans: TAxeInsert[] | [null] | null;
};

export type TFichier = {
  hash: string;
  filename: string;
  bucket_id: string;
  filesize: number;
};

export type TLien = {
  url: string;
  titre: string;
};
