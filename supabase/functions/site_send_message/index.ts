import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import {getSupabaseClientWithServiceRole} from "../_shared/getSupabaseClient.ts";
import {corsHeaders} from "../_shared/cors.ts";

/**
 * Permet d'envoyer des mails depuis les formulaires de contact.
 **/
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {headers: corsHeaders});
  }

  try {
    const {categorie, objet, prenom, nom, email, message} = await req.json();

    // Par défaut, on envoie à notre adresse contact.
    let destEmail = "contact@territoiresentransitions.fr";
    let sujet = `Homepage : ${objet}`;

    if (categorie.toLowerCase().includes("questions relatives au programme")) {
      destEmail = "territoireengage@ademe.fr";
    } else if (categorie.toLowerCase().includes("aldo")) {
      destEmail = "aldo@abc-transitionbascarbone.fr";
      sujet = objet;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "contact@territoiresentransitions.fr",
        to: destEmail,
        subject: sujet,
        reply_to: email,
        html: `<p>De : ${prenom ? prenom : ''} ${nom} (${email})</p><p>${message}</p>`,
      }),
    });

    const supabase = getSupabaseClientWithServiceRole();
    const {error, data} = await supabase
      .from("site_contact")
      .insert({
        email: destEmail,
        formulaire: {
          categorie,
          objet,
          prenom,
          nom,
          email,
          message,
        },
      })
      .select();

    const resendData = await res.json();
    if (error) throw error;

    // Renvoie le statut pour persister dans les logs Supabase.
    return new Response(JSON.stringify(data), {
      headers: {"Content-Type": "application/json", ...corsHeaders},
      status: resendData.status || resendData.statusCode,
    });
  } catch (error) {
    return new Response(JSON.stringify({error: error.message}), {
      headers: {...corsHeaders},
      status: error.status || error.statusCode,
    });
  }
});
