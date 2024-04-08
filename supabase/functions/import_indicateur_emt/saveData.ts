import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";
import {TablesInsert} from "../_shared/typeUtils.ts";

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
    resultats : Map<string, TablesInsert<"indicateur_resultat">>
)=> {

    let indicateurToSave : TablesInsert<"indicateur_resultat">=
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
    commentaires : Map<string, TablesInsert<"indicateur_resultat_import">>,
    tetId : string
)=> {

    let insert = true;
    let commentaireToSave : TablesInsert<"indicateur_resultat_import">
        = commentaires.get(annee?(indicateur_id +' ' +annee):indicateur_id);
    if(commentaireToSave) {
        commentaireToSave.commentaire = commentaire +'\n---\n' +commentaireToSave.commentaire;
        insert = false;
    }else{
        commentaireToSave = {
            indicateur_id: indicateur_id,
            collectivite_id: collectivite_id,
            annee : annee,
            commentaire: commentaire
        }
    }
    commentaireToSave.modified_by = tetId;

    // Il n'y a pas de clé primaire sur la table indicateur_resultat_commentaire
    // et donc il n'est pas possible d'utiliser upsert
    const { error, data } = insert ?
        await supabaseClient.from('indicateur_resultat_commentaire').insert(commentaireToSave) :
        (commentaireToSave.annee == null ?
            await supabaseClient.from('indicateur_resultat_commentaire')
                .update(commentaireToSave)
                .match({
                    collectivite_id : commentaireToSave.collectivite_id,
                    indicateur_id : commentaireToSave.indicateur_id})
                .is('annee', null):
        await supabaseClient.from('indicateur_resultat_commentaire')
            .update(commentaireToSave)
            .match({
                collectivite_id : commentaireToSave.collectivite_id,
                indicateur_id : commentaireToSave.indicateur_id,
                annee : commentaireToSave.annee}));
    if (error) {
        throw new Error(error.message);
    }
    return true;
}
