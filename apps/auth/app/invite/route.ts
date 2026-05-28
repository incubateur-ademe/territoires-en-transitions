import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  authError,
  getDbUserFromRequest,
} from '../../src/supabase/getDbUserFromRequest';
import { sendEmail } from '../../src/utils/sendEmail';

// SÉCURITÉ (pentest V3 / ORHUS-302) :
// Le contenu et le lien du mail d'invitation doivent être générés strictement
// côté serveur. Auparavant, le client envoyait l'URL du bouton et le nom de la
// collectivité en clair, ce qui permettait à un utilisateur authentifié de
// déclencher l'envoi d'un mail aux couleurs de l'ADEME depuis l'adresse
// officielle, contenant un lien arbitraire (phishing). Le schéma ci-dessous
// n'accepte plus que les identifiants nécessaires ; l'URL est construite à
// partir de `APP_URL`, et toutes les valeurs interpolées dans le template HTML
// sont échappées.

const APP_URL = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '')
  // on retire un éventuel `/` final pour produire des URL propres
  .replace(/\/+$/, '');

// Restreint les noms/prénoms à un jeu de caractères usuel (lettres latines,
// accents, espace, tiret, apostrophe, point). Empêche l'injection de balises.
const safeNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[\p{L}\p{M}\s'.-]+$/u,
    "Caractères non autorisés dans le nom ou prénom"
  );

// Nom de collectivité : même esprit, on autorise en plus chiffres, parenthèses
// et virgule (ex: « CC de la Basse-Zorn », « CA Grand Paris Sud (91) »).
const collectiviteNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(
    /^[\p{L}\p{M}\p{N}\s'(),.-]+$/u,
    'Caractères non autorisés dans le nom de la collectivité'
  );

const baseInvitationSchema = z.object({
  /** Adresse à laquelle envoyer l'invitation */
  to: z.email(),
  /** Utilisateur envoyant l'invitation */
  from: z.object({
    prenom: safeNameSchema,
    nom: safeNameSchema,
    email: z.email(),
  }),
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

/**
 * Endpoint pour envoyer le mail d'invitation à rejoindre une collectivité
 */
export async function POST(request: NextRequest) {
  // vérifie l'utilisateur courant
  const user = await getDbUserFromRequest(request);
  if (!user) {
    return authError;
  }

  if (!APP_URL) {
    console.error('POST invite: APP_URL non configurée côté serveur');
    return Response.json(
      { error: 'Configuration serveur incomplète' },
      { status: 500 }
    );
  }

  // vérifie les paramètres
  const body = (await request.json()) as unknown;
  const verifyArgs = invitationSchema.safeParse(body);
  if (!verifyArgs.success) {
    console.error('POST invite error', verifyArgs.error);
    return Response.json({ error: 'Arguments non valides' }, { status: 400 });
  }
  const invitation = verifyArgs.data;

  // génère et envoi le mail
  const { to, from, collectivite } = invitation;
  const { nom, prenom } = from;
  const res = await sendEmail({
    to,
    subject: `Invitation de ${prenom} ${nom} à rejoindre ${collectivite} sur Territoires en Transitions`,
    html: mailTemplate(invitation),
  });

  return Response.json(res);
}

// laisse passer les requêtes preflight
export async function OPTIONS() {
  return Response.json({});
}

// Construit l'URL du bouton à partir d'`APP_URL` (verrouillée côté serveur),
// jamais d'une URL fournie par le client.
const buildInvitationUrl = (invitation: Invitation): string => {
  if (invitation.urlType === 'invitation') {
    return `${APP_URL}/invitation/${invitation.invitationId}/${encodeURIComponent(
      invitation.to
    )}`;
  }
  return `${APP_URL}/collectivite/${invitation.collectiviteId}/accueil`;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// formatage du mail
const mailTemplate = (invitation: Invitation) => {
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
      ? '<p><i>Envie d’en savoir plus sur la plateforme ? RDV sur : <a href="https://www.territoiresentransitions.fr/outil-numerique">https://www.territoiresentransitions.fr/outil-numerique</a></p>'
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
