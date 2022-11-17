import {FicheActionThematiques} from "./enums/ficheActionThematiques.ts";
import {FicheActionPiliersEci} from "./enums/ficheActionPiliersEci.ts";
import {FicheActionResultatsAttendus} from "./enums/ficheActionResultatsAttendus.ts";
import {FicheActionCibles} from "./enums/ficheActionCibles.ts";
import {FicheActionStatuts} from "./enums/ficheActionStatuts.ts";
import {FicheActionNiveauxPriorite} from "./enums/ficheActionNiveauxPriorite.ts";
import {PartenairesTags, StructuresTags, UsersTags} from "./ficheActionTags.ts";
import {PlanAction} from "./planAction.ts";

export type FicheActionWrite =
    {
    id : number;
    titre : string;
    description : string;
    thematiques: FicheActionThematiques[];
    piliers_eci: FicheActionPiliersEci[];
    objectifs: string;
    resultats_attendus: FicheActionResultatsAttendus[];
    cibles: FicheActionCibles[];
    ressources: string;
    financements: string;
    budget_previsionnel : number;
    statut: FicheActionStatuts;
    niveau_priorite: FicheActionNiveauxPriorite;
    date_debut: Date;
    date_fin_provisoire : Date;
    amelioration_continue: boolean;
    calendrier: string;
    notes_complementaires: string;
    maj_termine: boolean;
    collectivite_id: number; // Seul champs obligatoire
    }

export type FicheActionRead =
    FicheActionWrite &
    {
        plans_action : PlanAction[];
        partenaires : PartenairesTags[];
        structures : StructuresTags[];
        pilotes_tags : UsersTags[];
        // pilotes_users : UserData[];
        referents_tags : UsersTags[];
        // referents_users : UsersData[];
        // indicateurs : Indicateurs[]
        // annexes : Annexes[];
        // actions : ActionRelation[];
    };