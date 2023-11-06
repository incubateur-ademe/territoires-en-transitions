import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";

/**
 * Sauvegarde un résultat d'indicateur
 * @param supabaseClient
 * @param collectivite_id collectivité concernée
 * @param indicateur_id indicateur concernée
 * @param annee annee de la valeur de l'indicateur
 * @param valeur valeur de l'indicateur
 * @param resultats resultats déjà existant à ne pas écraser
 */
export const resultat = async(
    supabaseClient : TSupabaseClient,
    collectivite_id : number,
    indicateur_id : string,
    annee : string,
    valeur : number,
    resultats : Map<string, Database["public"]["Tables"]["indicateur_resultat"]["Insert"]>
):
    Promise<boolean> => {

    let indicateurToSave : Database["public"]["Tables"]["indicateur_resultat"]["Insert"]=
        resultats.get(indicateur_id + ' - ' +annee);
    // On n'écrase pas les indicateurs déjà renseignés.
    if(!indicateurToSave) {
        indicateurToSave = {
            indicateur_id: indicateur_id,
            collectivite_id: collectivite_id,
            annee: annee,
            valeur: valeur,
        }

        const {error, data} = await supabaseClient.from('indicateur_resultat').upsert(indicateurToSave);
        if (error) {
            throw new Error(error.message);
        }
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
    commentaireToSave.commentaire = 'Import EMT: ' + commentaireToSave.commentaire

    const { error, data } = await supabaseClient.from('indicateur_resultat_commentaire').upsert(commentaireToSave);
    if (error) {
        throw new Error(error.message);
    }
    return true;
}
