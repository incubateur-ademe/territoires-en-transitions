"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.annexes = exports.fiches = exports.niveauPriorite = exports.statut = exports.personnes = exports.tags = exports.actions = exports.cibles = exports.resultats = exports.indicateurs = exports.sousThematique = exports.thematique = exports.date = exports.booleen = exports.entier = exports.texte = void 0;
const fuse_esm_js_1 = __importDefault(require("https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js"));
const regexSplit = /((et\/ou)|[,/+?&;]|\n|\r| - | -|- |^-| et (?!de))(?![^(]*[)])(?![^«]*[»])/;
const regexSplitThematique = /([/+?&;]|\n|\r| - | -|- |^-)(?![^(]*[)])(?![^«]*[»])/;
const regexEspace = /\\t|\\r|\\n/;
const regexURL = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
const ficheActionResultatsAttendus = [
    "Adaptation au changement climatique",
    "Allongement de la durée d’usage",
    "Amélioration de la qualité de vie",
    "Développement des énergies renouvelables",
    "Efficacité énergétique",
    "Préservation de la biodiversité",
    "Réduction des consommations énergétiques",
    "Réduction des déchets",
    "Réduction des émissions de gaz à effet de serre",
    "Réduction des polluants atmosphériques",
    "Sobriété énergétique"
];
const ficheActionCibles = [
    "Grand public et associations",
    "Public Scolaire",
    "Autres collectivités du territoire",
    "Acteurs économiques",
    "Acteurs économiques du secteur primaire",
    "Acteurs économiques du secteur secondaire",
    "Acteurs économiques du secteur tertiaire",
    "Partenaires",
    "Collectivité elle-même",
    "Elus locaux",
    "Agents"
];
const ficheActionStatuts = ["À venir", "En cours", "Réalisé", "En pause", "Abandonné"];
const ficheActionNiveauxPrioritesSynonyme = {
    'Faible': 'Bas',
    'Haut': 'Élevé'
};
const ficheActionNiveauxPriorites = ["Élevé", "Moyen", "Bas", ...Object.keys(ficheActionNiveauxPrioritesSynonyme)];
/**
 * Nettoie du texte
 * @param texte
 * @param titre vrai si le texte est un titre et ne doit pas contenir de saut de ligne
 * @return texte nettoyé
 */
const texte = async (texte, titre) => {
    return !texte ? null : String(titre ? String(texte).replace(regexEspace, ' ') : texte).trim();
};
exports.texte = texte;
/**
 * Nettoie un entier
 * @param entier
 * @return entier nettoyé
 */
const entier = async (entier) => {
    if (!entier) {
        return null;
    }
    const toReturn = parseInt(entier);
    if (isNaN(toReturn)) {
        throw new Error('Les montants ne doivent contenir que des chiffres : ' + String(entier));
    }
    return toReturn;
};
exports.entier = entier;
/**
 * Nettoie un booléen
 * @param booleen
 * @return booléen nettoyé
 */
const booleen = async (booleen) => {
    if (typeof booleen == "boolean") {
        return booleen;
    }
    if (typeof booleen == "string") {
        const s = booleen.toLowerCase();
        if (s == 'true' || s == 'vrai') {
            return true;
        }
        else if (s == 'false' || s == 'faux') {
            return false;
        }
    }
    return null;
};
exports.booleen = booleen;
/**
 * Nettoie une date
 * @param date
 * @return date nettoyée
 */
const date = async (date) => {
    if (!date) {
        return null;
    }
    const toReturn = new Date(date);
    if (toReturn.toString() == "Invalid Date") {
        throw Error("La date n'est pas valide");
    }
    return toReturn;
};
exports.date = date;
/**
 * Nettoie des thématiques
 * @param thematique
 * @param memoire données utiles au nettoyage du fichier
 * @return thematique nettoyée
 */
const thematique = async (thematique, memoire) => {
    const toReturn = [];
    if (thematique) {
        const fuse = new fuse_esm_js_1.default(Array.from(memoire.thematiques.keys()));
        const tab = String(thematique).split(regexSplitThematique);
        for (let element of tab) {
            if (element && !element.match(regexSplitThematique)) {
                const res = fuse.search(element)?.[0]?.item;
                if (res) {
                    toReturn.push(memoire.thematiques.get(res));
                }
            }
        }
    }
    return toReturn;
};
exports.thematique = thematique;
/**
 * Nettoie des sous-thématiques
 * @param sousThematique
 * @param memoire données utiles au nettoyage du fichier
 * @return sous-thematique nettoyée
 */
const sousThematique = async (sousThematique, memoire) => {
    const toReturn = [];
    if (sousThematique) {
        const fuse = new fuse_esm_js_1.default(Array.from(memoire.sousThematiques.keys()));
        const tab = String(sousThematique).split(regexSplitThematique);
        for (let element of tab) {
            if (element && !element.match(regexSplitThematique)) {
                const res = fuse.search(element)?.[0]?.item;
                if (res) {
                    toReturn.push(memoire.sousThematiques.get(res));
                }
            }
        }
    }
    return toReturn;
};
exports.sousThematique = sousThematique;
/**
 * Nettoie des indicateurs
 * @param indicateurs chaîne de caractère contenant N indicateurs
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau d'indicateurs nettoyés
 */
const indicateurs = async (indicateurs, memoire) => {
    // TODO détecter les id d'indicateurs
    return null;
};
exports.indicateurs = indicateurs;
/**
 * Nettoie des résultats
 * @param resultats chaîne de caractère contenant N résultats
 * @return tableau de résultats nettoyés
 */
const resultats = async (resultats) => {
    const toReturn = [];
    if (resultats) {
        const fuse = new fuse_esm_js_1.default(ficheActionResultatsAttendus);
        const tab = String(resultats).split(regexSplit);
        for (let element of tab) {
            if (element && !element.match(regexSplit)) {
                const res = fuse.search(element)?.[0]?.item;
                if (res) {
                    toReturn.push(res);
                }
            }
        }
    }
    return toReturn;
};
exports.resultats = resultats;
/**
 * Nettoie des cibles
 * @param cibles chaîne de caractère contenant N cibles
 * @return tableau de cibles nettoyées
 */
const cibles = async (cibles) => {
    const toReturn = [];
    if (cibles) {
        const fuse = new fuse_esm_js_1.default(ficheActionCibles);
        const tab = String(cibles).split(regexSplit);
        for (let element of tab) {
            if (element && !element.match(regexSplit)) {
                const res = fuse.search(element)?.[0]?.item;
                if (res) {
                    toReturn.push(res);
                }
            }
        }
    }
    return toReturn;
};
exports.cibles = cibles;
/**
 * Nettoie des actions
 * @param actions chaîne de caractère contenant N actions
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau d'actions nettoyées
 */
const actions = async (actions, memoire) => {
    // TODO détecter les is d'actions
    return null;
};
exports.actions = actions;
/**
 * Nettoie des tags
 * @param tags chaîne de caractère contenant N tags
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau de tags nettoyés
 */
const tags = async (tags, memoire) => {
    const toReturn = [];
    const tagDone = [];
    if (tags) {
        const tab = String(tags).split(regexSplit);
        for (let element of tab) {
            const elem = await (0, exports.texte)(element, true);
            if (elem && !element.match(regexSplit) && !tagDone.includes(elem)) {
                tagDone.push(elem);
                const tag = {
                    nom: elem,
                    collectivite_id: memoire.collectivite_id
                };
                toReturn.push(tag);
            }
        }
    }
    return toReturn;
};
exports.tags = tags;
/**
 * Nettoie des personnes
 * @param personnes chaîne de caractère contenant N indicateurs
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau de personnes nettoyées
 */
const personnes = async (personnes, memoire) => {
    const toReturn = [];
    if (personnes) {
        const tab = String(personnes).split(regexSplit);
        for (let element of tab) {
            const elem = await (0, exports.texte)(element, true);
            if (elem && !element.match(regexSplit)) {
                const personne = {
                    collectivite_id: memoire.collectivite_id,
                    nom: elem
                };
                const personneImport = memoire.personnes.get(elem);
                if (personneImport != null) {
                    personne.tag_id = personneImport.tag?.id;
                    personne.user_id = personneImport.user;
                }
                toReturn.push(personne);
            }
        }
    }
    return toReturn;
};
exports.personnes = personnes;
/**
 * Nettoie un statut
 * @param statut
 * @return statut nettoyé
 */
const statut = async (statut) => {
    if (!statut) {
        return null;
    }
    const fuse = new fuse_esm_js_1.default(ficheActionStatuts);
    return fuse.search(statut)?.[0]?.item;
};
exports.statut = statut;
/**
 * Nettoie un niveau de priorité
 * @param niveau
 * @return niveau nettoyé
 */
const niveauPriorite = async (niveau) => {
    if (!niveau) {
        return null;
    }
    const fuse = new fuse_esm_js_1.default(ficheActionNiveauxPriorites);
    const toTest = fuse.search(niveau)?.[0]?.item;
    return toTest ? (ficheActionNiveauxPrioritesSynonyme[toTest] || toTest) : null;
};
exports.niveauPriorite = niveauPriorite;
/**
 * Nettoie des fiches liées
 * @param fiches chaîne de caractère contenant N fiches
 * @param memoire données utiles au nettoyage du fichier
 * @return tableau de fiches liées nettoyées
 */
const fiches = async (fiches, memoire) => {
    // TODO détecter les différentes id de fiches
    return null;
};
exports.fiches = fiches;
/**
 * Nettoie des annexes format lien
 * @param annexes chaîne de caractère contenant N annexes
 * @return tableau d'annexes format lien nettoyées
 */
const annexes = async (annexes) => {
    const toReturn = [];
    if (annexes) {
        const resultats = String(annexes).match(regexURL);
        for (let resultat of resultats) {
            const annexe = {
                lien: resultat
            };
            toReturn.push(annexe);
        }
    }
    return toReturn;
};
exports.annexes = annexes;
//# sourceMappingURL=fonctionsDeNettoyage.js.map