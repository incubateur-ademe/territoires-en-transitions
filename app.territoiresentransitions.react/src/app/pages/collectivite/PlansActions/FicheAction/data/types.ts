import {
  TActionInsert,
  TAnnexeInsert,
  TAxeInsert,
  TFicheAction,
  TIndicateur,
  TFicheActionServicePiloteInsert,
  TFicheActionStructureInsert,
  TPartenaireInsert,
  TSousThematiqueInsert,
  TThematiqueInsert,
  TPersonne,
  TFinanceurTagInsert,
  TFinanceurMontant,
} from 'types/alias';

export type FicheAction = Omit<
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
> & {
  thematiques: TThematiqueInsert[] | null;
  sous_thematiques: TSousThematiqueInsert[] | null;
  partenaires: TPartenaireInsert[] | null;
  structures: TFicheActionStructureInsert[] | null;
  pilotes: Personne[] | null;
  referents: Personne[] | null;
  annexes: TAnnexeInsert[] | null;
  axes: TAxeInsert[] | null;
  actions: TActionInsert[] | null;
  indicateurs: Indicateur[] | null;
  services: TFicheActionServicePiloteInsert[] | null;
  financeurs: Financeur[];
};

export type Personne = Omit<TPersonne, 'tag_id' | 'user_id'> & {
  tag_id?: number | null;
  user_id?: string | null;
};

export type Indicateur = Omit<
  TIndicateur,
  'indicateur_id' | 'indicateur_personnalise_id'
> & {
  indicateur_id?: string | null;
  indicateur_personnalise_id?: number | null;
};

export type Financeur = Omit<
  TFinanceurMontant,
  'id' | 'montant_ttc' | 'financeur_tag'
> & {
  id?: number;
  montant_ttc?: number;
  financeur_tag: TFinanceurTagInsert;
};
