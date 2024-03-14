import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  getSupabaseClientWithServiceRole
} from '../_shared/getSupabaseClient.ts';
import * as xlsx from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs";
import * as cptable from "https://deno.land/x/sheetjs@v0.18.3/dist/cpexcel.full.mjs";
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js';
import * as fetch from "./fetchData.ts"
import * as save from "./saveData.ts"

xlsx.set_cptable(cptable);

const tetUserId = '0938e00d-ff6d-41b0-82a0-068858a66520';
const yoloUserId = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9';

const avancementStatut = ["pas_fait","fait","non_renseigne","programme","detaille"];

/**
 * Import (xlsx) des statuts EMT
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
    const file = data.get("file") as File;
    const test = data.get("test") as boolean | null;

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
          if((cell.v) == 'Arborescence'){
            entete = cellCoord.r;
          }
          derniereCellule = cellCoord.r;
        }
      }
    }

    // Récupère les données déjà existantes
    const statuts = await fetch.statuts(supabaseClient, collectivite_id);
    const commentaires = await fetch.commentaires(supabaseClient, collectivite_id);
    const tetId = test?yoloUserId:tetUserId;
    const fuse = new Fuse(avancementStatut);
    const actions = await fetch.actions(supabaseClient);

    // Pour chaque ligne du fichier
    for (let ligne=entete+1; ligne<derniereCellule+1; ligne++){
      // Récupère l'id de l'action, le commentaire et le statut
      let action_id = await getCelluleValue(sheet, ligne, 0); // Colonne A
      let commentaire = await getCelluleValue(sheet, ligne, 2); // Colonne C
      commentaire = commentaire?commentaire.replace('_x000D_', ''):commentaire;
      let statut = await getCelluleValue(sheet, ligne, 3); // Colonne D

      // Ne sauvegarde pas si l'action dans le fichier excel n'existe pas en base
      if (actions.has(action_id)) {
        // Sauvegarde le commentaire s'il est présent
        if (commentaire) {
          await save.commentaire(supabaseClient, collectivite_id, action_id, commentaire, commentaires, tetId);
        }

        // Sauvegarde le statut s'il est présent
        if (statut) {
          const statutClean = fuse.search(statut)?.[0]?.item;
          if (statutClean) {
            await save.statut(supabaseClient, collectivite_id, action_id, statutClean, statuts, tetId);
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
const getCelluleValue = async (
    sheet: any,
    ligne: number,
    colonne: number
): Promise<any | null> => {
    const coord = xlsx.utils.encode_cell({ r: ligne, c: colonne });
    return !sheet[coord] ? null : sheet[coord].v;
};
