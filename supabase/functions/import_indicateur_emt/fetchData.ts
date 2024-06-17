import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";
import {Tables, TablesInsert} from "../_shared/typeUtils.ts";


/**
 * Récupère les valeurs des indicateurs de la collectivité
 * @param supabaseClient
 * @param collectivite_id
 * @return commentaires
 */
export const valeurs = async(supabaseClient : TSupabaseClient, collectivite_id : number)=> {
    const query = supabaseClient
        .from('indicateur_valeur')
        .select()
        .eq('collectivite_id', collectivite_id)
        .is('metadonnee_id', null);

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<string, TablesInsert<"indicateur_valeur">>();
    for(let i=0; i<data.length; i++){
        const valeur : TablesInsert<"indicateur_valeur"> = data[i];
        toReturn.set(`${valeur.indicateur_id} - ${new Date(valeur.date_valeur).getFullYear()}`, valeur);
    }
    return toReturn;
}

/**
 * Récupère les définitions prédéfinis des indicateurs
 * @param supabaseClient
 * @return definitions
 */
export const definitions = async(supabaseClient : TSupabaseClient)=> {
    const query = supabaseClient
        .from('indicateur_definition')
        .select()
        .is('collectivite_id', null)
        .is('groupement_id', null)
        .not('identifiant_referentiel', 'is', null);

    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const parIdentifiant = new Map<string, Tables<"indicateur_definition">>();
    const parID = new Map<number, Tables<"indicateur_definition">>();
    for(let i=0; i<data.length; i++){
        const definition : Tables<"indicateur_definition"> = data[i];
        parIdentifiant.set(definition.identifiant_referentiel, definition);
        parID.set(definition.id, definition);
    }
    return {parIdentifiant, parID};
}


