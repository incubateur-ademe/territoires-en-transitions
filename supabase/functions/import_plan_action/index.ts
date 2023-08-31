import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/getSupabaseClient.ts";
import { XLSXToPlan } from "./importXLSX.ts";
import * as xlsx from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs";
import * as cptable from "https://deno.land/x/sheetjs@v0.18.3/dist/cpexcel.full.mjs";

xlsx.set_cptable(cptable);

/**
 * Import (xls) d'un plan d'action
 */
serve(async (req) => {
  // permet l'appel de la fonction depuis le navigateur
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const data = await req.formData();
  const planId = data.get("planId") as string;
  const planNom = data.get("planNom") as string;
  const file = data.get("file") as File;
  const collectivite_id = data.get("collectivite_id") as string;

  const workbook = xlsx.read(await file.arrayBuffer(), { type: "array" });

  try {
    const supabaseClient = getSupabaseClient(req);
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
