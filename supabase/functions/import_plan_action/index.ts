import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  getSupabaseClient,
  getSupabaseClientWithServiceRole,
} from '../_shared/getSupabaseClient.ts';
import { XLSXToPlan } from "./importXLSX.ts";
// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.2/package/types/index.d.ts"
import * as xlsx from "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs";
import * as cptable from 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/cpexcel.full.mjs';

xlsx.set_cptable(cptable);

/**
 * Import (xls) d'un plan d'action
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

  const data = await req.formData();
  const planId = data.get("planId") as string;
  const planNom = data.get("planNom") as string;
  const file = data.get("file") as File;
  const collectivite_id = data.get("collectivite_id") as string;

  const workbook = xlsx.read(await file.arrayBuffer(), { type: "array" });

  try {
    const supabaseClient = getSupabaseClientWithServiceRole();
    const res = await XLSXToPlan(
      supabaseClient,
      workbook,
      parseInt(collectivite_id),
      planNom,
    );

    // renvoi ok
    return new Response(res, {
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
