"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFiches = exports.fetchPersonnes = exports.fetchActions = exports.fetchIndicateurs = exports.fetchSousThematiques = exports.fetchThematiques = exports.fetchData = void 0;
/**
 * Récupère des données utiles au nettoyage du fichier excel
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return des données utiles au nettoyage du fichier excel
 */
const fetchData = async (supabaseClient, collectivite_id) => {
    return {
        collectivite_id: collectivite_id,
        // - Thématiques
        thematiques: await (0, exports.fetchThematiques)(supabaseClient),
        // - Sous thématiques
        sousThematiques: await (0, exports.fetchSousThematiques)(supabaseClient),
        // - Indicateurs
        indicateurs: await (0, exports.fetchIndicateurs)(supabaseClient, collectivite_id),
        // - Actions
        actions: await (0, exports.fetchActions)(supabaseClient),
        // - Personnes
        personnes: await (0, exports.fetchPersonnes)(supabaseClient, collectivite_id),
        // - Fiches
        fiches: await (0, exports.fetchFiches)(supabaseClient, collectivite_id),
    };
};
exports.fetchData = fetchData;
/**
 * Récupère les thématiques
 * @param supabaseClient client supabase
 * @return map <nom de la thématique, objet de la thématique>
 */
const fetchThematiques = async (supabaseClient) => {
    const query = supabaseClient
        .from('thematique')
        .select();
    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map();
    for (let i = 0; i < data.length; i++) {
        const thematique = data[i];
        toReturn.set(thematique.thematique, thematique);
    }
    return toReturn;
};
exports.fetchThematiques = fetchThematiques;
/**
 * Récupère les sous-thématiques
 * @param supabaseClient client supabase
 * @return map <nom de la sous-thématique, objet de la sous-thématique>
 */
const fetchSousThematiques = async (supabaseClient) => {
    const query = supabaseClient
        .from('sous_thematique')
        .select();
    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map();
    for (let i = 0; i < data.length; i++) {
        const sousThematique = data[i];
        toReturn.set(sousThematique.sous_thematique, sousThematique);
    }
    return toReturn;
};
exports.fetchSousThematiques = fetchSousThematiques;
/**
 * Récupère les indicateurs de la collectivité
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return map <identifiant (référentiel) ou nom (personnalisé) de l'indicateur, objet de l'indicateur>
 */
const fetchIndicateurs = async (supabaseClient, collectivite_id) => {
    const query = supabaseClient
        .from('indicateurs_collectivite')
        .select()
        .eq('collectivite_id', collectivite_id);
    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map();
    for (let i = 0; i < data.length; i++) {
        const indicateur = data[i];
        toReturn.set(indicateur.indicateur_id == null ? indicateur.nom : indicateur.indicateur_id, indicateur);
    }
    return toReturn;
};
exports.fetchIndicateurs = fetchIndicateurs;
/**
 * Récupère les actions
 * @param supabaseClient client supabase
 * @return map <identifiant de l'action, objet de l'action>
 */
const fetchActions = async (supabaseClient) => {
    const query = supabaseClient
        .from('action_relation')
        .select();
    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map();
    for (let i = 0; i < data.length; i++) {
        const action = data[i];
        toReturn.set(action.id, action);
    }
    return toReturn;
};
exports.fetchActions = fetchActions;
/**
 * Récupère les personnes de la collectivité
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return map <nom de la personne, objet de la personne>
 */
const fetchPersonnes = async (supabaseClient, collectivite_id) => {
    const query = supabaseClient
        .rpc('personnes_collectivite', { collectivite_id });
    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map();
    for (let i = 0; i < data.length; i++) {
        const personne = {
            user: data[i]["user_id"],
            nom: data[i]['nom']
        };
        if (data[i]["tag_id"] != null) {
            personne.tag = {
                id: data[i]["tag_id"],
                collectivite_id: data[i]["collectivite_id"],
                nom: data[i]['nom']
            };
        }
        toReturn.set(personne.nom, personne);
    }
    return toReturn;
};
exports.fetchPersonnes = fetchPersonnes;
/**
 * Récupère les fiches de la collectivité
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return map <titre de la fiche, objet de la fiche>
 */
const fetchFiches = async (supabaseClient, collectivite_id) => {
    const query = supabaseClient
        .from('fiche_resume')
        .select()
        .eq('collectivite_id', collectivite_id);
    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map();
    for (let i = 0; i < data.length; i++) {
        const fiche = data[i];
        toReturn.set(fiche.titre, fiche);
    }
    return toReturn;
};
exports.fetchFiches = fetchFiches;
//# sourceMappingURL=fetchData.js.map