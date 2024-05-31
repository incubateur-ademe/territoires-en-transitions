import {DBClient} from "../../typeUtils";
import {Tag, TypeTag} from "../domain/tag.schema";
import {objectToCamel} from "ts-case-convert";

/**
 * Récupère les tags d'une collectivité
 * @param dbClient client supabase
 * @param collectiviteId identifiant de la collectivité
 * @param typeTag type de tag
 * @return liste de tags
 */
export async function selectTags(
    dbClient : DBClient,
    collectiviteId : number,
    typeTag : TypeTag
): Promise<Tag[]>{
    const {data, error} = await dbClient
        .from(`${typeTag}_tag` as const)
        .select('id, nom, collectivite_id')
        .eq('collectivite_id', collectiviteId);

    return data ? objectToCamel(data) as Tag[] : [];
}