import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  getSupabaseClientWithServiceRole
} from '../_shared/getSupabaseClient.ts';
import * as xlsx from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs";
import * as cptable from "https://deno.land/x/sheetjs@v0.18.3/dist/cpexcel.full.mjs";
import * as fetch from "./fetchData.ts"
import * as save from "./saveData.ts"
import * as clean from "./cleanData.ts"

xlsx.set_cptable(cptable);

const tetUserId = '0938e00d-ff6d-41b0-82a0-068858a66520';
const yoloUserId = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9';

/**
 * Import (xlsx) des indicateurs EMT
 */
serve(async (req) => {
  // permet l'appel de la fonction depuis le navigateur
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (
    req.headers.get('authorization') !==
    `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  ) {
    // Seule la service key permet d'exécuter cette fonction.
    return new Response('Execute access forbidden', { status: 403 });
  }

  try {
    const supabaseClient = getSupabaseClientWithServiceRole();
    // Récupère les paramètres de la fonction : collectivite_id, file et test
    const data = await req.formData();
    const collectivite_id = parseInt(data.get("collectivite_id") as string);
    const referentiel : string = data.get("referentiel") as string;
    const file = data.get("file") as File;
    const test = data.get("test") as boolean;

    // Ouvre le fichier
    const workbook = xlsx.read(await file.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // Récupère les coordonnées du début et fin de fichier
    let derniereCellule = 0;
    let entete = 0;
    for (const cellAddress in sheet) {
      if (sheet.hasOwnProperty(cellAddress)) {
        const cell = sheet[cellAddress];
        const cellCoord = xlsx.utils.decode_cell(cellAddress)
        if(cellCoord.r>0){
          if((cell.v) == 'N°'){
            entete = cellCoord.r;
          }
          derniereCellule = cellCoord.r;
        }
      }
    }
    const valeurs = await fetch.valeurs(supabaseClient, collectivite_id);
    const definitions = await fetch.definitions(supabaseClient);
    const tetId = test?yoloUserId:tetUserId;

    // Pour chaque ligne du fichier
    for (let ligne=entete+1; ligne<derniereCellule+1; ligne++){
      // Récupère l'id de l'indicateur
      const id = await getCelluleValue(sheet, ligne, 0); // Colonne A
      const nom = await getCelluleValue(sheet, ligne, 2); // Colonne C
      const indicateur_id = await clean.id(id, nom, referentiel, definitions.parIdentifiant);

      if(indicateur_id) {
        for (let colonne = 4; colonne < 14; colonne += 3) {
          // Récupère la valeur, l'année et le commentaire
          let valeur = await getCelluleValue(sheet, ligne, colonne);
          let annee = await clean.annee(await getCelluleValue(sheet, ligne, colonne + 1));
          let commentaire = await getCelluleValue(sheet, ligne, colonne + 2);
          const valeurClean = await clean.valeur(valeur, indicateur_id, definitions.parID);
          // Sauvegarde les valeurs si elles sont présentes, ainsi que l'année associée
          if (annee && (valeurClean || commentaire)) {
            await save.valeurs(
                supabaseClient,
                collectivite_id,
                indicateur_id,
                annee,
                valeurClean,
                commentaire,
                valeurs
            );
          }
        }
      }

    }

    // renvoi ok
    return new Response('ok', {
      headers: { ...corsHeaders },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders },
      status: 200,
    });
  }
});


/**
 * Récupère la valeur de la cellule
 * @param sheet
 * @param ligne
 * @param colonne
 */
const getCelluleValue = async (sheet : any, ligne : number, colonne : number)
    : Promise<any | null> => {
  const coord = xlsx.utils.encode_cell({r: ligne, c: colonne});
  return !sheet[coord]?null:sheet[coord].v;
}
