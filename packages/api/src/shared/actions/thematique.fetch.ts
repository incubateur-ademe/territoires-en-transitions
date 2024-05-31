import {DBClient} from "../../typeUtils";
import {SousThematique, SousThematiqueId, Thematique} from "../domain/thematique.schema";

/**
 * Recupère les thématiques
 * @param dbClient client supabase
 * @return liste de thématiques
 */
export async function selectThematiques(dbClient : DBClient): Promise<Thematique[]>{
    const {data, error} = await dbClient
        .from('thematique')
        .select('id, nom');

    return data ? data as Thematique[] : [];
}

/**
 * Recupère les sous thématiques
 * @param dbClient client supabase
 * @param thematiqueId identifiant de la thématique parent, null pour récupérer toutes les sous thématiques
 * @param lienThematiqueId vrai pour avoir le lien vers la thématique parente sous forme d'identifiant,
 *                         faux pour avoir l'objet complet
 * @return liste de sous thématiques
 */
export async function selectSousThematiques(
    dbClient : DBClient,
    thematiqueId : number | null,
    lienThematiqueId : boolean): Promise<SousThematique[] | SousThematiqueId[]> {

    const colonnes = 'id, nom:sous_thematique, thematique:' +(thematiqueId?'thematique_id':'thematique(*)');
    const query = dbClient
        .from('sous_thematique')
        .select(colonnes);
    if(thematiqueId){
        query.eq('thematique_id', thematiqueId!);
    }
    const {data, error} = await query.returns<any[]>();
    if(!data){
        return [];
    }
    return lienThematiqueId? data as SousThematiqueId[] :  data as SousThematique[];
}

