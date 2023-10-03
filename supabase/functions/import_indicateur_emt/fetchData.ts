import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";


/**
 * Récupère les commentaires des indicateurs de la collectivité
 * @param supabaseClient
 * @param collectivite_id
 * @return commentaires
 */
export const commentaires = async(supabaseClient : TSupabaseClient, collectivite_id : number):
    Promise<Map<string, Database["public"]["Tables"]["indicateur_resultat_commentaire"]["Insert"]>> => {
    const query = supabaseClient
        .from('indicateur_resultat_commentaire')
        .select()
        .eq('collectivite_id', collectivite_id);

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<string, Database["public"]["Tables"]["indicateur_resultat_commentaire"]["Insert"]>();
    for(let i=0; i<data.length; i++){
        const commentaire : Database["public"]["Tables"]["indicateur_resultat_commentaire"]["Insert"] = data[i];
        toReturn.set(
            (commentaire.annee?commentaire.indicateur_id +' ' +commentaire.annee:commentaire.indicateur_id),
            commentaire
        );
    }
    return toReturn;
}

/**
 * Récupère les définitions des indicateurs
 * @param supabaseClient
 * @return definitions
 */
export const definitions = async(supabaseClient : TSupabaseClient):
    Promise<Map<string, Database["public"]["Tables"]["indicateur_definition"]["Row"]>> => {
    const query = supabaseClient
        .from('indicateur_definition')
        .select();

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<string, Database["public"]["Tables"]["indicateur_definition"]["Row"]>();
    for(let i=0; i<data.length; i++){
        const definition : Database["public"]["Tables"]["indicateur_definition"]["Row"] = data[i];
        toReturn.set(definition.id, definition);
    }
    return toReturn;
}

