import {
  authError,
  getDbUserFromRequest,
} from '../../src/supabase/getDbUserFromRequest';
import { sendEmail } from '../../src/utils/sendEmail';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// schéma des données attendues
const invitationSchema = z.object({
  /** Adresse à laquelle envoyer l'invitation */
  to: z.email(),
  /** Utilisateur envoyant l'invitation */
  from: z.object({
    prenom: z.string(),
    nom: z.string(),
    email: z.email(),
  }),
  /** Collectivité à laquelle est attachée l'invitation */
  collectivite: z.string(),
  /** Lien pour activer l'invitation ou accéder à la collectivité (dans le cas
   * du rattachement d'un utilisateur existant) */
  url: z.string(),
  /** Indique si il s'agit d'une invitation ou d'un rattachement */
  urlType: z.enum(['invitation', 'rattachement']),
});

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

  // vérifie les paramètres
  const invitation = (await request.json()) as Invitation;
  const verifyArgs = invitationSchema.safeParse(invitation);
  if (!verifyArgs.success) {
    console.error('POST invite error', verifyArgs.error);
    return Response.json({ error: 'Arguments non valides' }, { status: 500 });
  }

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

// formatage du mail
const mailTemplate = ({ from, collectivite, url, urlType }: Invitation) => {
  const { email, nom, prenom } = from;

  return `<html>
<body>
    <h2>Territoires en Transitions</h2>
    <p>Bonjour,</p>

  <p>${prenom} ${nom} (${email}) vous invite à contribuer pour ${collectivite} sur Territoires en Transitions.</p>
  <a href="${url}"
    style="font-size: 1rem; font-weight: 700; border: 1px solid #6A6AF4; border-radius: 8px; text-align: center; padding: 1rem 2rem; margin: 1rem; display: block; max-width: fit-content; background-color: #6A6AF4; color: white; text-decoration: none;"
    >${
      urlType === 'invitation'
        ? 'Je rejoins la collectivité'
        : 'Je lance Territoires en transitions !'
    }</a
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
