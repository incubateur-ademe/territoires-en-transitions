import {objectToCamel} from "ts-case-convert";
import {DBClient} from "../../typeUtils";
import {Personne} from "../domain/personne.schema";

/**
 * Récupère les personnes d'une collectivité
 * @param dbClient client supabase
 * @param collectiviteId identifiant de la collectivité
 * @return liste de personnes
 */
export async function selectPersonnes(
    dbClient : DBClient,
    collectiviteId : number
): Promise<Personne[]>{
    // TODO ne plus utiliser une rpc postgresql
    const {data, error} = await dbClient
        .rpc('personnes_collectivite', {collectivite_id : collectiviteId});
    return data ? objectToCamel(data) as Personne[] : [];
}