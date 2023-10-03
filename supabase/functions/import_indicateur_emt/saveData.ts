import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";

/**
 * Sauvegarde un résultat d'indicateur
 * @param supabaseClient
 * @param collectivite_id collectivité concernée
 * @param indicateur_id indicateur concernée
 * @param annee annee de la valeur de l'indicateur
 * @param valeur valeur de l'indicateur
 */
export const resultat = async(
    supabaseClient : TSupabaseClient,
    collectivite_id : number,
    indicateur_id : string,
    annee : string,
    valeur : number
):
    Promise<boolean> => {

    const indicateurToSave : Database["public"]["Tables"]["indicateur_resultat_import"]["Insert"] = {
        indicateur_id: indicateur_id,
        collectivite_id: collectivite_id,
        annee : annee,
        valeur : valeur,
        source : 'import EMT'
    }

    const { error, data } = await supabaseClient.from('indicateur_resultat_import').upsert(indicateurToSave);
    if (error) {
        throw new Error(error.message);
    }
    return true;
}

/**
 * Sauvegarde un commentaire d'indicateur
 * @param supabaseClient
 * @param collectivite_id collectivité concernée
 * @param indicateur_id indicateur concernée
 * @param annee annee de la valeur de l'indicateur
 * @param commentaire commentaire de la valeur de l'indicateur
 * @param commentaires commentaires déjà existant, pour garder l'ancien commentaire
 * @param tetId identifiant de l'équipe TeT pour le modified_by qui ne peut pas être null
 */
export const commentaire = async(
    supabaseClient : TSupabaseClient,
    collectivite_id : number,
    indicateur_id : string,
    annee : string,
    commentaire :string,
    commentaires : Map<string, Database["public"]["Tables"]["indicateur_resultat_import"]["Insert"]>,
    tetId : string
):
    Promise<boolean> => {

    let commentaireToSave : Database["public"]["Tables"]["indicateur_resultat_commentaire"]["Insert"]
        = commentaires.get(annee?(indicateur_id +' ' +annee):indicateur_id);
    if(commentaireToSave) {
        commentaireToSave.commentaire = commentaire +'\n---\n' +commentaireToSave.commentaire;
    }else{
        commentaireToSave = {
            indicateur_id: indicateur_id,
            collectivite_id: collectivite_id,
            annee : annee,
            commentaire: commentaire
        }
    }
    commentaireToSave.modified_by = tetId;

    const { error, data } = await supabaseClient.from('indicateur_resultat_commentaire').upsert(commentaireToSave);
    if (error) {
        throw new Error(error.message);
    }
    return true;
}