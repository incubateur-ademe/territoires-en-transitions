import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";

/**
 * Sauvegarde un commentaire
 * @param supabaseClient
 * @param collectivite_id collectivité concernée
 * @param action_id action concernée
 * @param commentaire commentaire à sauvegarder
 * @param commentaires commentaires déjà existant, pour garder l'ancien commentaire
 * @param tetId identifiant de l'équipe TeT pour le modified_by qui ne peut pas être null
 */
export const commentaire = async(
    supabaseClient : TSupabaseClient,
    collectivite_id : number,
    action_id : string,
    commentaire : string,
    commentaires : Map<string, Database["public"]["Tables"]["action_commentaire"]["Insert"]>,
    tetId: string
):
    Promise<boolean> => {
    let commentaireToSave : Database["public"]["Tables"]["action_commentaire"]["Insert"]= commentaires.get(action_id);
    if(commentaireToSave) {
        commentaireToSave.commentaire = commentaire +'\n---\n' +commentaireToSave.commentaire;
    }else{
        commentaireToSave = {
            action_id: action_id,
            collectivite_id: collectivite_id,
            commentaire: commentaire
        }
    }
    commentaireToSave.modified_by = tetId;

    const { error, data } = await supabaseClient.from('action_commentaire').upsert(commentaireToSave);
    if (error) {
        throw new Error(error.message);
    }
    return true;
}

/**
 * Sauvegarde un commentaire
 * @param supabaseClient
 * @param collectivite_id collectivité concernée
 * @param action_id action concernée
 * @param statut statut à sauvegarder
 * @param statuts statuts déjà existant, pour garder la valeur dans "concerne"
 * @param tetId identifiant de l'équipe TeT pour le modified_by qui ne peut pas être null
 */
export const statut = async(
    supabaseClient : TSupabaseClient,
    collectivite_id : number,
    action_id : string,
    statut : string,
    statuts : Map<string, Database["public"]["Tables"]["action_statut"]["Insert"]>,
    tetId : string
):
    Promise<boolean> => {
    let statutToSave : Database["public"]["Tables"]["action_statut"]["Insert"]= statuts.get(action_id);
    if(statutToSave) {
        statutToSave.avancement = statut;
    }else{
        statutToSave = {
            action_id: action_id,
            collectivite_id: collectivite_id,
            avancement: statut,
            concerne: true
        }
    }
    statutToSave.modified_by = tetId;

    const { error, data } = await supabaseClient.from('action_statut').upsert(statutToSave);
    if (error) {
        throw new Error(error.message);
    }
    return true;
}