import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";
import {TablesInsert} from "../_shared/typeUtils.ts";

/**
 * Récupère les commentaires de la collectivité
 * @param supabaseClient
 * @param collectivite_id
 * @return commentaires
 */
export const commentaires = async(supabaseClient : TSupabaseClient, collectivite_id : number)=> {
    const query = supabaseClient
        .from('action_commentaire')
        .select()
        .eq('collectivite_id', collectivite_id);

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<string, TablesInsert<"action_commentaire">>();
    for(let i=0; i<data.length; i++){
        const commentaire : TablesInsert<"action_commentaire"> = data[i];
        toReturn.set(commentaire.action_id, commentaire);
    }
    return toReturn;
}

/**
 * Récupère les statuts de la collectivité
 * @param supabaseClient
 * @param collectivite_id
 */
export const statuts = async(supabaseClient : TSupabaseClient, collectivite_id : number)=> {
    const query = supabaseClient
        .from('action_statut')
        .select()
        .eq('collectivite_id', collectivite_id);

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<string, TablesInsert<"action_statut">>();
    for(let i=0; i<data.length; i++){
        const statut : TablesInsert<"action_statut"> = data[i];
        toReturn.set(statut.action_id, statut);
    }
    return toReturn;
}

/**
 * Récupère les actions du référentiel
 * @param supabaseClient
 */
export const actions = async(supabaseClient : TSupabaseClient)=> {
    const query = supabaseClient
        .from('action_relation')
        .select();

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Set<string>();
    for(let i=0; i<data.length; i++){
        const action : TablesInsert<"action_relation"> = data[i];
        toReturn.add(action.id);
    }
    return toReturn;
}
