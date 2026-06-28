import {
  makeCollectiviteAccueilUrl,
  makeInvitationLandingPath,
} from '@/app/app/paths';
import { sendEmail } from '@/app/utils/send-email';
import { dcpFetch } from '@tet/api/users/dcp.fetch';
import { getAuthUser } from '@tet/api/utils/supabase/auth-user.server';
import { createSupabaseServerClient } from '@tet/api/utils/supabase/server-client';
import { z } from 'zod';

// SÉCURITÉ (pentest V3 / ORHUS-302) :
// Le contenu et le lien du mail d'invitation doivent être générés strictement
// côté serveur. Auparavant, le client envoyait l'URL du bouton et le nom de la
// collectivité en clair, ce qui permettait à un utilisateur authentifié de
// déclencher l'envoi d'un mail aux couleurs de l'ADEME depuis l'adresse
// officielle, contenant un lien arbitraire (phishing). Le schéma ci-dessous
// n'accepte plus que les identifiants nécessaires ; l'URL est construite à
// partir de `APP_URL`, l'identité de l'expéditeur est lue depuis le DCP de
// l'utilisateur connecté, et toutes les valeurs interpolées dans le template
// HTML sont échappées.

const APP_URL = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '')
  // on retire un éventuel `/` final pour produire des URL propres
  .replace(/\/+$/, '');

// Nom de collectivité : même esprit, on autorise en plus chiffres, parenthèses,
// virgule et dièse (ex: « CC de la Basse-Zorn », « CA Grand Paris Sud (91) »,
// « # Collectivité démo (édition) »). La valeur reste échappée avant toute
// interpolation dans le template HTML, donc ces caractères sont sans risque.
const collectiviteNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(
    /^[\p{L}\p{M}\p{N}\s'(),.#-]+$/u,
    'Caractères non autorisés dans le nom de la collectivité'
  );

const baseInvitationSchema = z.object({
  /** Adresse à laquelle envoyer l'invitation */
  to: z.email(),
  /** Collectivité à laquelle est attachée l'invitation */
  collectivite: collectiviteNameSchema,
});

const invitationSchema = z.discriminatedUnion('urlType', [
  baseInvitationSchema.extend({
    urlType: z.literal('invitation'),
    /** Identifiant de l'invitation côté backend (UUID). */
    invitationId: z.uuid(),
  }),
  baseInvitationSchema.extend({
    urlType: z.literal('rattachement'),
    /** Collectivité à laquelle on rattache un utilisateur existant. */
    collectiviteId: z.number().int().positive(),
  }),
]);

type Invitation = z.infer<typeof invitationSchema>;

type InvitationWithSender = Invitation & {
  from: { prenom: string; nom: string; email: string };
};

export type SendInvitationResult =
  | { ok: true; data: unknown }
  | { ok: false; status: 400 | 403 | 500; error: string };

/**
 * Valide le payload, résout l'expéditeur depuis le DCP, génère et envoie
 * le mail d'invitation à rejoindre une collectivité.
 */
export async function sendInvitationEmail(
  body: unknown
): Promise<SendInvitationResult> {
  const authUser = await getAuthUser();
  if (!authUser) {
    return { ok: false, status: 403, error: 'Non autorisé' };
  }

  if (!APP_URL) {
    console.error('POST invite: APP_URL non configurée côté serveur');
    return {
      ok: false,
      status: 500,
      error: 'Configuration serveur incomplète',
    };
  }

  const supabaseClient = await createSupabaseServerClient();
  const userDetails = await dcpFetch({
    dbClient: supabaseClient,
    user_id: authUser.id,
  });

  const senderEmail = userDetails?.email ?? authUser.email;
  if (!userDetails?.prenom || !userDetails?.nom || !senderEmail) {
    return { ok: false, status: 403, error: 'Profil incomplet' };
  }

  const from = {
    prenom: userDetails.prenom,
    nom: userDetails.nom,
    email: senderEmail,
  };

  const verifyArgs = invitationSchema.safeParse(body);
  if (!verifyArgs.success) {
    console.error('POST invite error', verifyArgs.error);
    return { ok: false, status: 400, error: 'Arguments non valides' };
  }
  const invitation: InvitationWithSender = { ...verifyArgs.data, from };

  const { to, collectivite } = invitation;
  const { nom, prenom } = from;
  const data = await sendEmail({
    to,
    subject: `Invitation de ${prenom} ${nom} à rejoindre ${collectivite} sur Territoires en Transitions`,
    html: mailTemplate(invitation),
  });

  return { ok: true, data };
}

// Construit l'URL du bouton à partir de `APP_URL` (verrouillée côté serveur),
// jamais d'une URL fournie par le client.
const buildInvitationUrl = (invitation: InvitationWithSender): string => {
  if (invitation.urlType === 'invitation') {
    // Identifiant opaque uniquement : le destinataire est résolu côté serveur
    // à l'ouverture du lien (évite email dans historique / logs / analytics).
    return `${APP_URL}${makeInvitationLandingPath(invitation.invitationId)}`;
  }
  return `${APP_URL}${makeCollectiviteAccueilUrl({
    collectiviteId: invitation.collectiviteId,
  })}`;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const mailTemplate = (invitation: InvitationWithSender) => {
  const { from, collectivite, urlType } = invitation;
  const { email, nom, prenom } = from;
  const url = buildInvitationUrl(invitation);
  const ctaLabel =
    urlType === 'invitation'
      ? 'Je rejoins la collectivité'
      : 'Je lance Territoires en transitions !';

  return `<html>
<body>
    <h2>Territoires en Transitions</h2>
    <p>Bonjour,</p>

  <p>${escapeHtml(prenom)} ${escapeHtml(nom)} (${escapeHtml(
    email
  )}) vous invite à contribuer pour ${escapeHtml(
    collectivite
  )} sur Territoires en Transitions.</p>
  <a href="${escapeHtml(url)}"
    style="font-size: 1rem; font-weight: 700; border: 1px solid #6A6AF4; border-radius: 8px; text-align: center; padding: 1rem 2rem; margin: 1rem; display: block; max-width: fit-content; background-color: #6A6AF4; color: white; text-decoration: none;"
    >${ctaLabel}</a
  >

  ${
    urlType === 'invitation'
      ? '<p><i>Envie d’en savoir plus sur la plateforme ? RDV sur : <a href="https://www.territoiresentransitions.fr/outil-numerique">https://www.territoiresentransitions.fr/outil-numerique</a></i></p>'
      : ''
  }

  <p>À bientôt sur la plateforme !</p>

  <p>
  Un problème ? Contactez-nous à <br /><a
      href="mailto:contact@territoiresentransitions.fr"
      >contact@territoiresentransitions.fr</a
    >
  </p>
</body>
</html>
`;
};
