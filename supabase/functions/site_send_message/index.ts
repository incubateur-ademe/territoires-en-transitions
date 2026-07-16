import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClientWithServiceRole } from '../_shared/getSupabaseClient.ts';
import { sendMail } from '../_shared/mailer.ts';

/**
 *
 */
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { objet, prenom, nom, email, tel, message } = await req.json();

    let destEmail = '';

    if (objet === 'programme') {
      // Adresse à mettre à jour
      destEmail = 'territoireengage@ademe.fr';
    } else {
      destEmail = 'contact@territoiresentransitions.fr';
    }

    const subject = `Demande de contact depuis le site public - ${objet}`;
    const html = `<p>De : ${prenom} ${nom} (${email}${
      tel !== '' ? `,Tél. : ${tel}` : ''
    })</p><p>${message}</p>`;

    await sendMail({
      from: 'contact@territoiresentransitions.fr',
      to: destEmail,
      subject,
      html,
    });

    const supabase = getSupabaseClientWithServiceRole();

    const query = supabase
      .from('site_contact')
      .insert({
        email: email,
        formulaire: JSON.stringify({
          objet,
          prenom,
          nom,
          email,
          tel,
          message,
        }),
      })
      .select();

    const { error, data } = await query;

    if (error) throw error;

    // Renvoie le statut pour persister dans les logs Supabase.
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders },
      status: error.status || error.statusCode || 500,
    });
  }
});