import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";
import {TablesInsert} from "../_shared/typeUtils.ts";

/**
 * Sauvegarde un commentaire
 * @param supabaseClient
 * @param collectivite_id collectivité concernée
 * @param action_id action concernée
 * @param commentaire commentaire à sauvegarder
 * @param commentaires commentaires déjà existant, pour garder l'ancien commentaire
 * @param tetId identifiant de l'équipe TeT pour le modified_by qui ne peut pas être null
 */
export const commentaire = async (
    supabaseClient: TSupabaseClient,
    collectivite_id: number,
    action_id: string,
    commentaire: string,
    commentaires: Map<string, TablesInsert<"action_commentaire">>,
    tetId: string
): Promise<boolean> => {
    let commentaireToSave = commentaires.get(action_id);
    if (commentaireToSave) {
        commentaireToSave.commentaire = commentaire + "\n---\n" + commentaireToSave.commentaire;
    } else {
        commentaireToSave = {
            action_id,
            collectivite_id,
            commentaire,
        };
    }
    commentaireToSave.modified_by = tetId;
    commentaireToSave.commentaire = "Import EMT: " + commentaireToSave.commentaire;

    const { error } = await supabaseClient.from("action_commentaire").upsert(commentaireToSave);
    if (error) {
        throw new Error(error.message);
    }
    return true;
};

/**
 * Sauvegarde un statut
 * @param supabaseClient
 * @param collectivite_id collectivité concernée
 * @param action_id action concernée
 * @param statut statut à sauvegarder
 * @param statuts statuts déjà existant, pour garder la valeur dans "concerne"
 * @param tetId identifiant de l'équipe TeT pour le modified_by qui ne peut pas être null
 */
export const statut = async (
    supabaseClient: TSupabaseClient,
    collectivite_id: number,
    action_id: string,
    statut: string,
    statuts: Map<string, TablesInsert<"action_statut">>,
    tetId: string
) => {
    // On n'écrase pas les statuts déjà renseignés.
    if (!statuts.get(action_id)) {
        const statutToSave = {
            action_id,
            collectivite_id,
            avancement: statut,
            concerne: true,
        } as TablesInsert<"action_statut">;

        // Erreur "msg":"InvalidWorkerCreation: worker boot error" si ajouté dans l'instruction précédente
        statutToSave.modified_by = tetId;

        const { error } = await supabaseClient.from("action_statut").upsert(statutToSave);
        if (error) {
            throw new Error(error.message);
        }
    }
    return true;
};
