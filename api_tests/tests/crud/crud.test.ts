import {
  assertFalse
} from "https://deno.land/std/testing/asserts.ts";
import { runConfidentialiteTest } from "../../lib/rpcs/confidentialite.ts";
import {supabase} from "../../lib/supabase.ts";
import {Database} from "../../lib/database.types.ts";

type TParametres = {
  type : Database["public"]["Enums"]["confidentialite_type_element"][],
  nbPart : number,
  part : number,
  filtreNom : string|null,
  elements : string[]
}

/**
 * Arguments : deno test crud.test.ts -- arguments
 *
 * type : type des éléments à tester, défaut tous (Ex: -- type:fonction,vue)
 * nbPart : en combien de parts diviser le nombre de résultats, défaut 1 (Ex: -- nbPart:5)
 * part : numéro de la part à traiter, défaut 1 (Ex: -- part:3)
 * filtreNom : le nom des éléments à tester doit contenir filtreNom (Ex: -- filtreNom:indicateur)
 * elements : nom précis des éléments à tester (Ex: -- elements:fiche_action,axe)
 *
 * Exemple :
 * Tester la deuxième moitié des fonctions et vues concernant les indicateurs, ainsi que la vue fiches_action
 * deno test crud.test.ts -- type:fonction,vue nbPart:2 part:2 filtreNom:indicateur elements:fiches_action
 */
const getParametres= async () : Promise<TParametres> => {
  const parametres : TParametres = {
    type : ['fonction', 'vue', 'table'],
    nbPart : 1,
    part : 1,
    filtreNom : null,
    elements : []
  }
  const mapArg: Map<string, string> = new Map<string, string>();
  if(Deno.args!=null){
    for(let arg of Deno.args){
      const decoupeArg = arg.split(':');
      if(decoupeArg.length==2){
        mapArg.set(decoupeArg[0], decoupeArg[1]);
      }
    }
  }

  if(mapArg.get('type')){
    parametres.type = String(mapArg.get('type')).split(',') as Database["public"]["Enums"]["confidentialite_type_element"][];
  }
  if(mapArg.get('nbPart')){
    parametres.nbPart = Number(mapArg.get('nbPart'));
  }
  if(mapArg.get('part')){
    const part = Number(mapArg.get('part'));
    if(part>0 && part<= parametres.nbPart){
      parametres.part = part;
    }
  }
  if(mapArg.get('filtreNom')){
    parametres.filtreNom = String(mapArg.get('filtreNom'));
  }
  if(mapArg.get('elements')){
    parametres.elements = String(mapArg.get('elements')).split(',');
  }
  return parametres;
}

/**
 * Créer la requête selon les paramètres
 * @param type
 * @param parametres
 * @return query
 */
const getQuery= async (
    type : Database["public"]["Enums"]["confidentialite_type_element"],
    parametres : TParametres
    ) : Promise<any> => {
  const query = supabase
      .from("confidentialite_"+type+"s_a_tester")
      .select("element");
  if(parametres.filtreNom && parametres.elements.length>0){
    query.or(`element.in.(${parametres.elements}),element.like.%${parametres.filtreNom}%`);
  }else if(parametres.filtreNom){
    query.like('element', `%${parametres.filtreNom}%`);
  }else if(parametres.elements.length>0){
    query.in("element", parametres.elements);
  }
  return query;
}

const getIndex= async (
    nbElements : number,
    parametres : TParametres
) : Promise<{indexStart: number, indexStop : number}> => {
  let indexStart = 0;
  let indexStop = nbElements;

  if(parametres.nbPart && parametres.nbPart<=nbElements){
    let nbElem = Math.trunc(nbElements/parametres.nbPart);
    indexStart = nbElem * (parametres.part-1);
    if(parametres.part<parametres.nbPart){
      indexStop = nbElem * (parametres.part);
    }
  }
  return {indexStart, indexStop}
}

/**
 * Test
 */
Deno.test("Test ", async () => {
  //assertFalse(!await runConfidentialiteTest('fonction', null));

  const parametres = await getParametres();

  let reussi = true;
  for(let type of parametres.type){
    const elements = await getQuery(type, parametres);

    if (elements != null && elements.data != null) {
      const {indexStart, indexStop} = await getIndex(elements.data.length, parametres);
      for (let i = indexStart; i<indexStop; i++) {
        const element = elements.data[i];
        const ok = await runConfidentialiteTest(type, element.element as string);
        console.log(type.toUpperCase() +' ' +element.element +' : ' +(ok?'%cOK':'%cNOK'), 'color : ' +(ok?'green':'red') +';');
        reussi = reussi && ok;
      }
    }
  }
  assertFalse(!reussi);
});
