import {TSupabaseClient} from "../_shared/getSupabaseClient.ts";
import {TablesInsert} from "../_shared/typeUtils.ts";

/**
 * Sauvegarde une valeur d'indicateur
 * @param supabaseClient
 * @param collectivite_id collectivité concernée
 * @param indicateur_id indicateur concernée
 * @param annee annee de la valeur de l'indicateur
 * @param commentaire commentaire de la valeur de l'indicateur
 * @param resultat valeur de l'indicateur
 * @param valeurs valeurs déjà existant à ne pas écraser
 */
export const valeurs = async(
    supabaseClient : TSupabaseClient,
    collectivite_id : number,
    indicateur_id : number,
    annee : number,
    resultat : number | null,
    commentaire : string | null,
    valeurs : Map<string, TablesInsert<"indicateur_valeur">>
)=> {
    let valeurToSave : TablesInsert<"indicateur_valeur">=
        valeurs.get(indicateur_id + ' - ' +annee);
    let modifie = false;
    // On n'écrase pas les indicateurs déjà renseignés.
    if(valeurToSave){
        if(commentaire){
            valeurToSave =  {
                ...valeurToSave,
                resultat_commentaire : valeurToSave.resultat_commentaire ?
                    commentaire +'\n---\n' +valeurToSave.resultat_commentaire :
                    commentaire
            }
            modifie = true;
        }
    }else if (commentaire || resultat){
        valeurToSave = {
            indicateur_id: indicateur_id,
            collectivite_id: collectivite_id,
            date_valeur: new Date(annee, 0, 1).toLocaleDateString('sv-SE'),
            resultat: resultat != null ? resultat : undefined ,
            resultat_commentaire : commentaire ? commentaire : undefined,
            metadonnee_id : null
        }
        modifie = true;
    }

    if(modifie){
        const {error, data} = await supabaseClient.from('indicateur_valeur').upsert(valeurToSave);
        if (error) {
            throw new Error(error.message);
        }
    }
    return true;
}