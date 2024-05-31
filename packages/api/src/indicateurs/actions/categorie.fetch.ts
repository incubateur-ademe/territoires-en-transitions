import {DBClient} from "../../typeUtils";
import {Categorie} from "../domain/categorie.schema";
import {Groupement} from "../../collectivites/shared/domain/groupement.schema";
import {selectGroupementParCollectivite} from "../../collectivites/shared/actions/groupement.fetch";

/**
 * Récupère les catégories indicateurs prédéfinis pour une collectivité
 * @param dbClient client supabase
 * @param collectiviteId identifiant de la collectivité
 * @return liste de catégories
 */
export async function selectCategories(
    dbClient : DBClient,
    collectiviteId : number
): Promise<Categorie[]>{
    const {data, error} = await dbClient
        .from("categorie_tag")
        .select('id, nom, groupement_id')
        .is('collectivite_id', null);

    const groupement : Groupement[] = await selectGroupementParCollectivite(dbClient, collectiviteId);
    const groupementIds = groupement.map(gp => gp.id);
    const toReturn = data?.filter((item : any)=> item.groupement_id === null ||
        groupementIds.includes(item.groupement_id))
        .map((item : any) => ({id : item.id, nom : item.nom})) || [];

    return toReturn as Categorie[];
}