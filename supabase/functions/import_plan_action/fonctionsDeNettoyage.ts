import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js';
import {TMemoire} from "./fetchData.ts";
import {
    TAnnexeImport, TFicheResume, TIndicateur,
    TPersonne,
    TPersonneMemoire,
    TTag
} from "./types.ts";
import {Enums} from "../_shared/typeUtils.ts";
import {Database} from "../_shared/database.types.ts";

const regexSplit = /((et\/ou)|[,/+?&;]|\n|\r| - | -|- |^-| et (?!de))(?![^(]*[)])(?![^«]*[»])/;
const regexSplitThematique = /([/+?&;]|\n|\r| - | -|- |^-)(?![^(]*[)])(?![^«]*[»])/;
const regexEspace =  /\\t|\\r|\\n/;
const regexURL = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

const ficheActionResultatsAttendus = [
    "Adaptation au changement climatique" ,
    "Allongement de la durée d’usage" ,
    "Amélioration de la qualité de vie" ,
    "Développement des énergies renouvelables" ,
    "Efficacité énergétique" ,
    "Préservation de la biodiversité" ,
    "Réduction des consommations énergétiques" ,
    "Réduction des déchets" ,
    "Réduction des émissions de gaz à effet de serre" ,
    "Réduction des polluants atmosphériques" ,
    "Sobriété énergétique"
];

const ficheActionCibles = [
    "Grand public et associations" ,
    "Public Scolaire" ,
    "Autres collectivités du territoire" ,
    "Acteurs économiques" ,
    "Acteurs économiques du secteur primaire" ,
    "Acteurs économiques du secteur secondaire" ,
    "Acteurs économiques du secteur tertiaire" ,
    "Partenaires" ,
    "Collectivité elle-même" ,
    "Elus locaux" ,
    "Agents"
];

const ficheActionStatuts = ["À venir", "En cours", "Réalisé", "En pause", "Abandonné"];
const ficheActionNiveauxPrioritesSynonyme : Record<string, string> = {
    'Faible' : 'Bas',
    'Haut' : 'Élevé'
}
const ficheActionNiveauxPriorites = ["Élevé","Moyen","Bas", ... Object.keys(ficheActionNiveauxPrioritesSynonyme)];

/**
 * Nettoie du texte
 * @param texte
 * @param titre vrai si le texte est un titre et ne doit pas contenir de saut de ligne
 * @return texte nettoyé
 */
export const texte = async (texte : string, titre : boolean) : Promise<string> => {
    return !texte?null:String(titre? String(texte).replace(regexEspace, ' '): texte).trim();
}

/**
 * Nettoie un entier
 * @param entier
 * @return entier nettoyé
 */
export const entier = async (entier : string) : Promise<number> => {
    if(!entier){
        return null;
    }
    const toReturn =  parseInt(entier);
    if (isNaN(toReturn)){
        throw new Error('Les montants ne doivent contenir que des chiffres : ' +String(entier));
    }
    return toReturn;
}

/**
 * Nettoie un booléen
 * @param booleen
 * @return booléen nettoyé
 */
export const booleen = async (booleen : any) : Promise<boolean> => {
    if(typeof booleen == "boolean" ){
        return booleen;
    }
    if (typeof  booleen == "string" ){
        const s : string = booleen.toLowerCase();
        if(s == 'true'|| s == 'vrai'){
            return true;
        } else if(s == 'false'|| s == 'faux'){
            return false;
        }
    }
    return null;
}

/**
 * Nettoie une date
 * @param date
 * @return date nettoyée
 */
const nettoieDate = async (date: any) => {
  if (!date) {
    return null;
  }
  const d = new Date(date);
  if (d.toString() == "Invalid Date") {
    throw Error("La date n'est pas valide");
  }
  const toReturn = d.toISOString();
  if (toReturn.substring(0, 10) === "1970-01-01") {
    return null;
  }
  return toReturn;
};

// extrait et nettoie la valeur d'une cellule "date"
export const date = async (sheet: any, celluleCoordonnes: any) => {
  if (!sheet[celluleCoordonnes]) return null;

  // essaye d'extraire une date de la valeur brute
  const value = await nettoieDate(sheet[celluleCoordonnes].v);
  if (value) {
    return value;
  }

  // ou à défaut essaye d'interpréter la valeur formattée
  return await nettoieDate(sheet[celluleCoordonnes].w);
};
  

/**
 * Nettoie des thématiques
 * @param thematique
 * @param memoire données utiles au nettoyage du fichier
 * @return thematique nettoyée
 */
export const thematique = async (thematique : string, memoire : TMemoire) : Promise<Database["public"]["Tables"]["thematique"]["Insert"]> => {
    const toReturn = [];
    if(thematique){
        const fuse = new Fuse(Array.from(memoire.thematiques.keys()));
        const tab :string[] = String(thematique).split(regexSplitThematique);
        for(let element of tab){
            if(element && !element.match(regexSplitThematique)){
                const res = fuse.search(element)?.[0]?.item;
                if(res){
                    toReturn.push(memoire.thematiques.get(res));
                }
            }
        }
    }
    return toReturn;
}

/**
 * Nettoie des sous-thématiques
 * @param sousThematique
 * @param memoire données utiles au nettoyage du fichier
 * @return sous-thematique nettoyée
 */
export const sousThematique = async (sousThematique : string, memoire : TMemoire) : Promise<Database["public"]["Tables"]["sous_thematique"]["Insert"]> => {
    const toReturn = [];
    if(sousThematique){
        const fuse = new Fuse(Array.from(memoire.sousThematiques.keys()));
        const tab :string[] = String(sousThematique).split(regexSplitThematique);
        for(let element of tab){
            if(element && !element.match(regexSplitThematique)) {
                const res = fuse.search(element)?.[0]?.item;
                if (res) {
                    toReturn.push(memoire.sousThematiques.get(res));
                }
            }
        }
    }
    return toReturn;
}

/**
 * Nettoie des indicateurs
 * @param indicateurs chaîne de caractère contenant N indicateurs
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau d'indicateurs nettoyés
 */
export const indicateurs = async (indicateurs : any, memoire : TMemoire) : Promise<TIndicateur[]> => {
    // TODO détecter les id d'indicateurs
    return null;
}

/**
 * Nettoie des résultats (ou effets attendus)
 * @param resultats chaîne de caractère contenant N résultats
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau de effets attendus nettoyés
 */
export const resultats= async (resultats : string, memoire : TMemoire) : Promise<Database["public"]["Tables"]["effet_attendu"]["Insert"][]> => {
    const toReturn = [];
    if(resultats){
        const fuseResultat = new Fuse(ficheActionResultatsAttendus);
        const fuseEffet = new Fuse(Array.from(memoire.effets.keys()));
        const tab :string[] = String(resultats).split(regexSplit);
        // Transition entre l'enum résultat attendu et la table effet attendu
        for(let element of tab){
            if(element && !element.match(regexSplit)) {
                // On récupère le résultat et l'effet le plus proche
                const resResultat = fuseResultat.search(element)?.[0]?.item;
                const resEffet = fuseEffet.search(element)?.[0]?.item;
                let effetToAdd : string | null = null;
                if (resEffet) {
                    // On priorise l'effet s'il existe
                    effetToAdd = resEffet;
                }else if(resResultat) {
                    // Si, c'est le résultat qui est retourné, on essaie de trouver une correspondance en effet
                    const resEffet2 = fuseEffet.search(resResultat)?.[0]?.item;
                    if(resEffet2){
                        effetToAdd = resEffet2;
                    }else{
                        // Si l'effet n'est toujours pas trouvé, on gère au cas par cas les changements de nom évident
                        switch (resResultat) {
                            case "Amélioration de la qualité de vie" :
                                effetToAdd = "Amélioration du cadre de vie";
                            break;
                            case "Efficacité énergétique" :
                                effetToAdd = "Réduction des consommations énergétiques"
                            break;
                            case "Sobriété énergétique" :
                                effetToAdd = "Sobriété"
                            break;
                        }
                    }
                }
                if(effetToAdd && memoire.effets.get(effetToAdd)){
                    toReturn.push(memoire.effets.get(effetToAdd));
                }
            }
        }
    }
    return toReturn;
}

/**
 * Nettoie des cibles
 * @param cibles chaîne de caractère contenant N cibles
 * @return tableau de cibles nettoyées
 */
export const cibles= async (cibles : string) : Promise<Enums<"fiche_action_cibles">[]> => {
    const toReturn = [];
    if(cibles){
        const fuse = new Fuse(ficheActionCibles);
        const tab :string[] = String(cibles).split(regexSplit);
        for(let element of tab){
            if(element && !element.match(regexSplit)) {
                const res = fuse.search(element)?.[0]?.item;
                if (res) {
                    toReturn.push(res);
                }
            }
        }
    }
    return toReturn;
}

/**
 * Nettoie des actions
 * @param actions chaîne de caractère contenant N actions
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau d'actions nettoyées
 */
export const actions = async (actions : any, memoire : TMemoire) :
    Promise<Database["public"]["Tables"]["action_relation"]["Insert"][]> => {
    // TODO détecter les is d'actions
    return null;
}

/**
 * Nettoie des tags
 * @param tags chaîne de caractère contenant N tags
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau de tags nettoyés
 */
export const tags = async (
    tags : string,
    memoire : TMemoire
) : Promise<TTag[]> => {
    const toReturn = [];
    const tagDone = [];
    if(tags){
        const tab :string[] = String(tags).split(regexSplit);
        for(let element of tab){
            const elem = await texte(element, true);
            if(elem && !element.match(regexSplit) && !tagDone.includes(elem)){
                tagDone.push(elem);
                const tag: TTag = {
                    nom : elem,
                    collectivite_id : memoire.collectivite_id
                }
                toReturn.push(tag);
            }
        }
    }
    return toReturn;
}

/**
 * Nettoie des personnes
 * @param personnes chaîne de caractère contenant N indicateurs
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau de personnes nettoyées
 */
export const personnes = async (personnes : string, memoire : TMemoire) : Promise<TPersonne[]> => {
    const toReturn = [];
    if(personnes){
        const tab :string[] = String(personnes).split(regexSplit);
        for(let element of tab){
            const elem = await texte(element, true);
            if (elem && !element.match(regexSplit)){
                const personne : TPersonne = {
                    collectivite_id :  memoire.collectivite_id,
                    nom : elem
                }
                const personneImport : TPersonneMemoire = memoire.personnes.get(elem);
                if(personneImport!=null){
                    personne.tag_id = personneImport.tag?.id;
                    personne.user_id = personneImport.user;
                }
                toReturn.push(personne);
            }
        }
    }
    return toReturn;
}

/**
 * Nettoie un statut
 * @param statut
 * @return statut nettoyé
 */
export const statut = async (statut : any) : Promise<Enums<"fiche_action_statuts">> => {
    if(!statut){
        return null;
    }
    const fuse = new Fuse(ficheActionStatuts);
    return fuse.search(statut)?.[0]?.item;
}

/**
 * Nettoie un niveau de priorité
 * @param niveau
 * @return niveau nettoyé
 */
export const niveauPriorite = async (niveau : any) : Promise<Enums<"fiche_action_niveaux_priorite">> => {
    if(!niveau){
        return null;
    }
    const fuse = new Fuse(ficheActionNiveauxPriorites);
    const toTest = fuse.search(niveau)?.[0]?.item;
    return toTest? (ficheActionNiveauxPrioritesSynonyme[toTest] || toTest) : null;
}

/**
 * Nettoie des fiches liées
 * @param fiches chaîne de caractère contenant N fiches
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau de fiches liées nettoyées
 */
export const fiches = async (fiches : any, memoire : TMemoire) : Promise<TFicheResume[]> => {
    // TODO détecter les différentes id de fiches
    return null;
}

/**
 * Nettoie des annexes format lien
 * @param annexes chaîne de caractère contenant N annexes
 * @return tableau d'annexes format lien nettoyées
 */
export const annexes = async (annexes : string) : Promise<TAnnexeImport[]> => {
    const toReturn = [];
    if(annexes){
        const resultats = String(annexes).match(regexURL)
        for (let resultat of resultats){
            const annexe: TAnnexeImport = {
                lien : resultat
            }
            toReturn.push(annexe);
        }
    }
    return toReturn;
}
