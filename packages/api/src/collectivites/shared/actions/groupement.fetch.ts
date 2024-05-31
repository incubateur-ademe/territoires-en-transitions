import {Groupement} from "../domain/groupement.schema";
import {DBClient} from "../../../typeUtils";

/**
 * Récupère les groupements auquel appartient une collectivité
 * @param dbClient client supabase
 * @param collectiviteId identifiant de la collectivité
 * @return liste des groupements
 */
export async function selectGroupementParCollectivite(
    dbClient : DBClient,
    collectiviteId : number
): Promise<Groupement[]>{
    const {data, error} = await dbClient
        .from("groupement_collectivite")
        .select('...groupement(*)')
        .eq('collectivite_id', collectiviteId)
        .returns<any[]>();

    return data ? data as Groupement[] : [] ;
}

/**
 * Récupère les groupements
 * @param dbClient client supabase
 * @return liste des groupements
 */
export async function selectGroupements(
    dbClient : DBClient
): Promise<Groupement[]>{
    const {data, error} = await dbClient
        .from("groupement")
        .select('id, nom, collectivites:groupement_collectivite(collectivite_id)')
        .returns<any[]>();
    return data ? data.map(d => {
        return {
            id: d.id,
            nom: d.nom,
            collectivites: d.collectivites.map((col : any) => col.collectivite_id)
        };
    }) as Groupement[] : [] ;
}