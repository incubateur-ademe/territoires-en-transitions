import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";
import {Tables, TablesInsert} from "../_shared/typeUtils.ts";


/**
 * Récupère les commentaires des indicateurs de la collectivité
 * @param supabaseClient
 * @param collectivite_id
 * @return commentaires
 */
export const commentaires = async(supabaseClient : TSupabaseClient, collectivite_id : number)=> {
    const query = supabaseClient
        .from('indicateur_resultat_commentaire')
        .select()
        .eq('collectivite_id', collectivite_id);

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<string, TablesInsert<"indicateur_resultat_commentaire">>();
    for(let i=0; i<data.length; i++){
        const commentaire : TablesInsert<"indicateur_resultat_commentaire"> = data[i];
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
export const definitions = async(supabaseClient : TSupabaseClient)=> {
    const query = supabaseClient
        .from('indicateur_definition')
        .select();

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<string, Tables<"indicateur_definition">>();
    for(let i=0; i<data.length; i++){
        const definition : Tables<"indicateur_definition"> = data[i];
        toReturn.set(definition.id, definition);
    }
    return toReturn;
}

/**
 * Récupère les résultats des indicateurs
 * @param supabaseClient
 * @param collectivite_id
 * @return definitions
 */
export const resultats = async(supabaseClient : TSupabaseClient, collectivite_id : number)=> {
    const query = supabaseClient
        .from('indicateur_resultat')
        .select()
        .eq('collectivite_id', collectivite_id);

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<string, Tables<"indicateur_resultat">>();
    for(let i=0; i<data.length; i++){
        const resultat : Tables<"indicateur_resultat"> = data[i];
        toReturn.set(resultat.indicateur_id +' - '+ resultat.annee, resultat);
    }
    return toReturn;
}

