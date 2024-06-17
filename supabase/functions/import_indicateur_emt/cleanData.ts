import {Tables} from "../_shared/typeUtils.ts";

/**
 * Récupère l'indicateur_id
 * @param id identifiant de l'indicateur dans le fichier excel
 * @param nom nom de l'indicateur dans le fichier excel
 * @param referentiel référentiel auquel s'appliquent les indicateurs
 * @param definitions liste des indicateurs existants
 * @return indicateur_id l'identifiant de l'indicateur pour la base de données
 */
export const id = async (
    id : string,
    nom : string,
    referentiel : string,
    definitions : Map<string, Tables<"indicateur_definition">>
): Promise<number | null> => {
    // Cellules fusionnées et dont la valeur ne se retrouve que sur la première cellule
    if(!id){
        if(String(nom).includes('Montant des aides financières accordées aux particuliers et acteurs privés (euros/hab.an)')){
            id = '49d';
        }
        if(String(nom).includes(('Budget politique cyclable  (euros/hab.an)'))){
            id = '49f';
        }
    }
    let idClean = String(id).replace(/(\d)([a-zA-Z])/g, '$1.$2');
    // Cas spéciaux
    switch (idClean){
        case '15.a' : // 15.a ou 15.a_dom
        case '15.b' : // 15.b ou 15.b_dom
            if(String(nom).includes("DOM")){
                idClean += '_dom';
            }
            break;
        case '19.a' : // 19.a_hors_dom
        case '19.b' : // 19.b_hors_dom
            idClean += '_hors_dom';
            break;
        case '49.a' : // 49.a ou 49.a-hab
        case '49.d' : // 49.d ou 49.d-hab
        case '49.f' : // 49.f ou 49.f-hab
            if(String(nom).includes("hab.an")){
                idClean += '-hab';
            }
            break;
        case null :
    }
    idClean = referentiel +'_' +idClean;
    return definitions.get(idClean) ? definitions.get(idClean).id : null;
}

/**
 * Nettoie la valeur
 * @param valeur
 * @param indicateur_id
 * @param definitons
 * @return valeur nettoyée
 */
export const valeur = async (
    valeur : any,
    indicateur_id : number,
    definitons : Map<number, Tables<"indicateur_definition">>
): Promise<number | null> => {
    if(valeur==null){
        return null;
    }
    let toReturn = parseFloat(String(valeur).replace('%', ''));
    if(isNaN(toReturn)){
        return null;
    }
    const defs = definitons.get(indicateur_id) || null;
    const unite = defs ? defs.unite : '';

    if(unite ==='%' && toReturn<1){
        toReturn *= 100;
    }
    return toReturn;

}

/**
 * Nettoie l'annee
 * @param annee à nettoyer
 * @return annee nettoyée
 */
export const annee = async (
    annee : any
): Promise<number | null> => {
    if(!annee){
        return null;
    }
    let toReturn = parseInt(String(String(annee).replace(' ', '')).slice(0, 4));
    if(isNaN(toReturn)){
        return null;
    }
    return toReturn;

}

