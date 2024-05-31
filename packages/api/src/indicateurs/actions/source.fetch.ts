import {DBClient} from "../../typeUtils";
import {Source} from "../domain/source.schema";

/**
 * Recupère les sources
 * @param dbClient client supabase
 * @return liste des sources existantes
 */
export async function selectSources(dbClient : DBClient): Promise<Source[]>{
    const {data, error} = await dbClient
        .from('indicateur_source')
        .select();

    return data ? data as Source[] : [];
}