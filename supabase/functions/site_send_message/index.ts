import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClientWithServiceRole } from '../_shared/getSupabaseClient.ts';
import { corsHeaders } from '../_shared/cors.ts';

/**
 *
 */
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { categorie, objet, prenom, nom, email, tel, message } =
      await req.json();

    let destEmail = '';

    if (
      categorie ===
      'Questions relatives au programme Territoire Engagé Transition Écologique'
    ) {
      // Adresse à mettre à jour
      destEmail = 'territoireengage@ademe.fr';
    } else if (
      categorie ===
      'Questions relatives à la plateforme Territoires en transitions'
    ) {
      destEmail = 'contact@territoiresentransitions.fr';
    } else {
      destEmail = 'contact@territoiresentransitions.fr';
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'contact@territoiresentransitions.fr',
        to: destEmail,
        subject: `Homepage : ${objet}`,
        html: `<p>De : ${prenom} ${nom} (${email}${
          tel !== '' ? `,Tél. : ${tel}` : ''
        })</p><p>${message}</p>`,
      }),
    });

    const resendData = await res.json();

    if (resendData.statusCode !== 200) throw resendData;

    const supabase = getSupabaseClientWithServiceRole();

    const query = supabase
      .from('site_contact')
      .insert({
        email: email,
        formulaire: JSON.stringify({
          categorie,
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
      status: resendData.status || resendData.statusCode,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders },
      status: error.status || error.statusCode,
    });
  }
});
