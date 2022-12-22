import {Database} from "../../database.types.ts";
import {Personne} from "./personne.ts";
import {IndicateurGlobal} from "./indicateurGlobal.ts";

export type FicheActionVueRow = Database["public"]["Views"]["fiches_action"]["Row"] & {
    partenaires: Database["public"]["Tables"]["partenaire_tag"]["Insert"][] | null,
    structures: Database["public"]["Tables"]["structure_tag"]["Insert"][] | null,
    pilotes: Personne[] | null,
    referents: Personne[] | null,
    annexes: Database["public"]["Tables"]["annexe"]["Insert"][]  | null,
    axes: Database["public"]["Tables"]["axe"]["Insert"][]  | null,
    actions: Database["public"]["Tables"]["action_relation"]["Insert"][]  | null,
    indicateurs: IndicateurGlobal[] | null
};

export type FicheActionVueInsert = Database["public"]["Views"]["fiches_action"]["Insert"] & {
    partenaires: Database["public"]["Tables"]["partenaire_tag"]["Insert"][] | null,
    structures: Database["public"]["Tables"]["structure_tag"]["Insert"][] | null,
    pilotes: Personne[] | null,
    referents: Personne[] | null,
    annexes: Database["public"]["Tables"]["annexe"]["Insert"][]  | null,
    axes: Database["public"]["Tables"]["axe"]["Insert"][]  | null,
    actions: Database["public"]["Tables"]["action_relation"]["Insert"][]  | null,
    indicateurs: IndicateurGlobal[] | null
};

export type FicheActionVueUpdate = Database["public"]["Views"]["fiches_action"]["Update"] & {
    partenaires: Database["public"]["Tables"]["partenaire_tag"]["Insert"][] | null,
    structures: Database["public"]["Tables"]["structure_tag"]["Insert"][] | null,
    pilotes: Personne[] | null,
    referents: Personne[] | null,
    annexes: Database["public"]["Tables"]["annexe"]["Insert"][]  | null,
    axes: Database["public"]["Tables"]["axe"]["Insert"][]  | null,
    actions: Database["public"]["Tables"]["action_relation"]["Insert"][]  | null,
    indicateurs: IndicateurGlobal[] | null
};