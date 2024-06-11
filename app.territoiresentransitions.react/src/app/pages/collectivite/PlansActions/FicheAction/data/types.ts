import {Indicateur} from 'app/pages/collectivite/Indicateurs/types';
import {
  TActionInsert,
  TAxeInsert,
  TFicheAction,
  TFicheActionServicePiloteInsert,
  TFicheActionStructureInsert,
  TPartenaireInsert,
  TSousThematiqueInsert,
  TFinanceurTagInsert,
  TFinanceurMontant,
  TFicheResume,
  TThematiqueRow,
} from 'types/alias';
import {Personne} from 'ui/dropdownLists/PersonnesDropdown/usePersonneListe';

export type FicheAction = Omit<
  TFicheAction,
  | 'thematiques'
  | 'sous_thematiques'
  | 'partenaires'
  | 'structures'
  | 'pilotes'
  | 'referents'
  | 'axes'
  | 'actions'
  | 'indicateurs'
  | 'services'
  | 'financeurs'
  | 'fiches_liees'
> & {
  thematiques: TThematiqueRow[] | null;
  sous_thematiques: TSousThematiqueInsert[] | null;
  partenaires: TPartenaireInsert[] | null;
  structures: TFicheActionStructureInsert[] | null;
  pilotes: Personne[] | null;
  referents: Personne[] | null;
  axes: TAxeInsert[] | null;
  actions: TActionInsert[] | null;
  indicateurs: Indicateur[] | null;
  services: TFicheActionServicePiloteInsert[] | null;
  financeurs: Financeur[];
  fiches_liees: FicheResume[] | null;
};

export type Financeur = Omit<
  TFinanceurMontant,
  'id' | 'montant_ttc' | 'financeur_tag'
> & {
  id?: number;
  montant_ttc?: number;
  financeur_tag: TFinanceurTagInsert;
};

export type FicheResume = Omit<TFicheResume, 'plans' | 'pilotes'> & {
  plans: TAxeInsert[] | [null] | null;
  pilotes: Personne[] | null;
};
