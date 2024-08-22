import {FicheResume as FicheResumeZod} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fiche_resumes.schema';
import {Indicateur} from 'app/pages/collectivite/Indicateurs/types';
import {
  TActionInsert,
  TAxeInsert,
  TFicheAction,
  TFinanceurTagInsert,
  TFinanceurMontant,
  TThematiqueRow,
  TSousThematiqueRow,
  TFicheActionStructureRow,
  TFicheActionServicePiloteRow,
  TPartenaireRow,
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
  sous_thematiques: TSousThematiqueRow[] | null;
  partenaires: TPartenaireRow[] | null;
  structures: TFicheActionStructureRow[] | null;
  pilotes: Personne[] | null;
  referents: Personne[] | null;
  axes: TAxeInsert[] | null;
  actions: TActionInsert[] | null;
  indicateurs: Indicateur[] | null;
  services: TFicheActionServicePiloteRow[] | null;
  financeurs: Financeur[] | null;
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

// export type FicheResume = Omit<TFicheResume, 'plans' | 'pilotes'> & {
//   plans: TAxeInsert[] | [null] | null;
//   pilotes: Personne[] | null;
// };

export type FicheResume = FicheResumeZod;
