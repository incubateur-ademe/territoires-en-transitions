import {Database} from "../../database.types.ts";

export type FicheActionVueRow = Database["public"]["Views"]["fiches_action"]["Row"] & {
    thematiques: Database["public"]["Tables"]["thematique"]["Insert"][] | null,
    sous_thematiques: Database["public"]["Tables"]["sous_thematique"]["Insert"][] | null,
    partenaires: Database["public"]["Tables"]["partenaire_tag"]["Insert"][] | null,
    structures: Database["public"]["Tables"]["structure_tag"]["Insert"][] | null,
    pilotes: Database["public"]["CompositeTypes"]["personne"][] | null,
    referents: Database["public"]["CompositeTypes"]["personne"][] | null,
    annexes: Database["public"]["Tables"]["annexe"]["Insert"][]  | null,
    axes: Database["public"]["Tables"]["axe"]["Insert"][]  | null,
    actions: Database["public"]["Tables"]["action_relation"]["Insert"][]  | null,
    indicateurs: Database["public"]["CompositeTypes"]["indicateur_generique"][] | null,
    services : Database["public"]["Tables"]["service_tag"]["Insert"][]  | null,
    financeurs : Database["public"]["CompositeTypes"]["financeur_montant"][]  | null,
    fiches_liees: Database["public"]["Views"]["fiche_resume"][]  | null
};

export type FicheActionVueInsert = FicheActionVueRow;
export type FicheActionVueUpdate = FicheActionVueRow;
