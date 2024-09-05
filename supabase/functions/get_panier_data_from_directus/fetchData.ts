import {ActionImpact, Partenaire, SousThematique} from "./types.ts";
import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";
import {Database, TablesInsert} from "../_shared/database.types.ts";


const HEADERS = {
    'Authorization': `Bearer ${Deno.env.get('DIRECTUS_API_KEY')}`
}

const DIRECTUS_URL = 'https://tet.directus.app';


/**
 * Renvoie une liste d'élements d'une collection Directus donnée
 * On trouve les noms des collections dans l'url de Directus ex :
 * action_referentiel: https://tet.directus.app/admin/content/action_referentiel
 * @param collection nom de la table à récupérer de directus
 * @return le résultat de la requête
 */
export const getFromDirectus = async (collection : string) : Promise<any> => {

    const response = await fetch(
        `${DIRECTUS_URL}/items/${collection}?fields[]=*.*&limit=-1`,
        {
            method: 'GET',
            headers: HEADERS
        });

    if (!response.ok) {
        console.log("PAS OK");
        return null
    }
    console.log(`Récupération de la table ${collection} dans directus`);
    return await response.json();
}

/**
 * Récupère les actions à impact provenant de directus
 * @return les actions à impact
 */
export const getActionsImpactFromDirectus = async() : Promise<ActionImpact[]> => {
    return (await getFromDirectus('action_impact'))?.data as ActionImpact[];
}

/**
 * Récupère les sous thématiques provenant de directus
 * @return les sous thématiques
 */
export const getSousThematiquesFromDirectus = async() : Promise<SousThematique[]> => {
    return (await getFromDirectus('sous_thematique'))?.data as SousThematique[];
}

/**
 * Récupère les partenaires provenant de directus
 * @return les partenaires
 */
export const getPartenairesFromDirectus = async() : Promise<Partenaire[]> => {
    return (await getFromDirectus('action_impact_partenaire'))?.data as Partenaire[];
}

/**
 * Récupère les sous thématiques provenant de la BDD
 * @param supabaseClient
 * @return une map de sous thématiques avec en clé le nom de la sous thématique
 */
export const getSousThematiquesFromBD = async (supabaseClient: TSupabaseClient):
    Promise<Map<string, Database["public"]["Tables"]["sous_thematique"]["Insert"]>> => {

    const query = supabaseClient.from("sous_thematique").select();
    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<
        string,
        Database["public"]["Tables"]["sous_thematique"]["Insert"]
    >();
    for (let i = 0; i < data.length; i++) {
        const thematique: TablesInsert<"sous_thematique"> = data[i];
        toReturn.set(thematique.sous_thematique, thematique);
    }
    console.log(`Récupération de la table sous_thematique dans la BDD`);
    return toReturn;
}

/**
 * Récupère les indicateurs prédéfinis provenant de la BDD
 * @param supabaseClient
 * @return une map d'indicateurs avec en clé l'identifiant référentiel
 */
export const getIndicateurPredefiniFromBD = async (supabaseClient: TSupabaseClient):
    Promise<Map<string, Database["public"]["Tables"]["indicateur_definition"]["Insert"]>> => {

    const query = supabaseClient.from("indicateur_definition").select().is('collectivite_id', null);
    const { error, data } = await query;
    if (error) {
        throw new Error(error.message);
    }
    const toReturn = new Map<
        string,
        Database["public"]["Tables"]["indicateur_definition"]["Insert"]
    >();
    for (let i = 0; i < data.length; i++) {
        const indicateur: TablesInsert<"indicateur_definition"> = data[i];
        toReturn.set(indicateur.identifiant_referentiel, indicateur);
    }
    console.log(`Récupération de la table indicateur_definition dans la BDD`);
    return toReturn;
}
