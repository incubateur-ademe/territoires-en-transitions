import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";

/**
 * Récupère les commentaires de la collectivité
 * @param supabaseClient
 * @param collectivite_id
 * @return commentaires
 */
export const commentaires = async(supabaseClient : TSupabaseClient, collectivite_id : number):
    Promise<Map<string, Database["public"]["Tables"]["action_commentaire"]["Insert"]>> => {
    const query = supabaseClient
        .from('action_commentaire')
        .select()
        .eq('collectivite_id', collectivite_id);

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<string, Database["public"]["Tables"]["action_commentaire"]["Insert"]>();
    for(let i=0; i<data.length; i++){
        const commentaire : Database["public"]["Tables"]["action_commentaire"]["Insert"] = data[i];
        toReturn.set(commentaire.action_id, commentaire);
    }
    return toReturn;
}

/**
 * Récupère les statuts de la collectivité
 * @param supabaseClient
 * @param collectivite_id
 */
export const statuts = async(supabaseClient : TSupabaseClient, collectivite_id : number):
    Promise<Map<string, Database["public"]["Tables"]["action_statut"]["Insert"]>> => {
    const query = supabaseClient
        .from('action_commentaire')
        .select()
        .eq('collectivite_id', collectivite_id);

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<string, Database["public"]["Tables"]["action_statut"]["Insert"]>();
    for(let i=0; i<data.length; i++){
        const statut : Database["public"]["Tables"]["action_statut"]["Insert"] = data[i];
        toReturn.set(statut.action_id, statut);
    }
    return toReturn;
}
