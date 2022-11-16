import {FicheActionThematiques} from "./enums/ficheActionThematiques.ts";
import {FicheActionPiliersEci} from "./enums/ficheActionPiliersEci.ts";
import {FicheActionResultatsAttendus} from "./enums/ficheActionResultatsAttendus.ts";
import {FicheActionCibles} from "./enums/ficheActionCibles.ts";
import {FicheActionStatuts} from "./enums/ficheActionStatuts.ts";
import {FicheActionNiveauxPriorite} from "./enums/ficheActionNiveauxPriorite.ts";

export type FicheAction = {
    /*id : number;*/
    titre : string;
    description : string;
    thematiques: FicheActionThematiques[];
    piliers_eci: FicheActionPiliersEci[];
    /*objectifs: string;
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
    collectivite_id: number;*/
}