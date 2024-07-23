import { Views, Enums } from "../_shared/typeUtils.ts";
import { Database, Tables } from "../_shared/database.types.ts";

export type TAnnexeImport = {
  lien: string | null;
};

export type TAxeImport = {
  id?: number | null;
  nom: string | null;
  parent: TAxeImport | null;
};

export type TFinanceur = Omit<
  Database["public"]["CompositeTypes"]["financeur_montant"],
  "id" | "montant_ttc" | "financeur_tag"
> & {
  id?: number;
  montant_ttc?: number;
  financeur_tag: TTag;
};

export type TIndicateur = Tables<"indicateur_definition">;

export type TPersonneMemoire = {
  user?: string | null;
  tag?: TTag | null;
  nom: string | null;
};

export type TPersonne = Omit<
  Database["public"]["CompositeTypes"]["personne"],
  "tag_id" | "user_id"
> & {
  tag_id?: number | null;
  user_id?: string | null;
};

export type TTag = {
  id?: number | null;
  nom: string | null;
  collectivite_id: number | null;
};

export type TFicheResume = Omit<
  Database["public"]["Views"]["fiche_resume"]["Row"],
  "plans"
> & {
  plans: Database["public"]["Tables"]["axe"]["Insert"][] | [null] | null;
};

export type TFicheAction = Omit<
  Views<"fiches_action">,
  | "thematiques"
  | "sous_thematiques"
  | "partenaires"
  | "structures"
  | "pilotes"
  | "referents"
  | "annexes"
  | "axes"
  | "actions"
  | "indicateurs"
  | "services"
  | "financeurs"
  | "fiches_liees"
> & {
  thematiques: Database["public"]["Tables"]["thematique"]["Insert"][] | null;
  sous_thematiques:
    | Database["public"]["Tables"]["sous_thematique"]["Insert"][]
    | null;
  partenaires: TTag[] | null;
  structures: TTag[] | null;
  pilotes: TPersonne[] | null;
  referents: TPersonne[] | null;
  annexes: Database["public"]["Tables"]["annexe"]["Insert"][] | null;
  axes: Database["public"]["Tables"]["axe"]["Insert"][] | null;
  actions: Database["public"]["Tables"]["action_relation"]["Insert"][] | null;
  indicateurs: TIndicateur[] | null;
  services: TTag[] | null;
  financeurs: TFinanceur[] | null;
  fiches_liees: TFicheResume[] | null;
};

export type TFicheActionImport = TFicheAction & {
  axeImport?: TAxeImport | null;
  annexesImport?: TAnnexeImport[] | null;
};
