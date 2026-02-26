const MAILPIT_URL =
  process.env.SUPABASE_MAILPIT_URL || 'http://127.0.0.1:54324';

interface MailpitMessageSummary {
  ID: string;
  To: Array<{ Address: string; Name: string }>;
  Subject: string;
  Snippet: string;
}

interface MailpitMessagesResponse {
  messages: MailpitMessageSummary[];
  total: number;
}

interface MailpitMessage {
  ID: string;
  HTML: string;
  Text: string;
  To: Array<{ Address: string; Name: string }>;
  Subject: string;
}

/**
 * Récupère le code OTP depuis l'email de confirmation envoyé par Supabase,
 * en interrogeant l'API Mailpit.
 *
 * Attend l'arrivée de l'email avec un polling (30 tentatives, 1s d'intervalle).
 * Parcourt les emails reçus pour trouver celui contenant l'OTP (utile quand
 * plusieurs emails arrivent pour la même adresse, ex. invitation + confirmation).
 */
export async function getOtpFromMailpit(email: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(
        `to:${email}`
      )}&limit=10`
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Mailpit API error (${response.status}): ${text || response.statusText}`
      );
    }
    const data: MailpitMessagesResponse = await response.json();

    for (const msg of data.messages ?? []) {
      const messageResponse = await fetch(
        `${MAILPIT_URL}/api/v1/message/${msg.ID}`
      );
      if (!messageResponse.ok) continue;

      const message: MailpitMessage = await messageResponse.json();
      const otpMatch = message.HTML?.match(/<b id="otp">(\d{6})<\/b>/);
      if (otpMatch) {
        return otpMatch[1];
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`No OTP email received for ${email} after 30s`);
}

/**
 * Supprime tous les emails d'une boîte Mailpit pour l'adresse donnée
 */
export async function clearMailpitMailbox(email: string): Promise<void> {
  const response = await fetch(
    `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Mailpit API error (${response.status}): ${text || response.statusText}`
    );
  }
}

export type InvitationEmailType = 'invitation' | 'rattachement';

export interface InvitationEmail {
  subject: string;
  /** URL du bouton CTA (invitation ou rattachement) */
  url: string;
  type: InvitationEmailType;
}

/**
 * Récupère l'email d'invitation à une collectivité depuis Mailpit.
 * Extrait l'URL du bouton "Je rejoins la collectivité" ou "Je lance Territoires en transitions !".
 */
export async function getInvitationEmailFromMailpit(
  email: string
): Promise<InvitationEmail> {
  let messageId: string | null = null;

  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(
        `to:${email}`
      )}&limit=1`
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Mailpit API error (${response.status}): ${text || response.statusText}`
      );
    }
    const data: MailpitMessagesResponse = await response.json();
    if (data.messages?.length > 0) {
      messageId = data.messages[0].ID;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!messageId) {
    throw new Error(`No invitation email received for ${email} after 30s`);
  }

  const messageResponse = await fetch(
    `${MAILPIT_URL}/api/v1/message/${messageId}`
  );
  if (!messageResponse.ok) {
    const text = await messageResponse.text();
    throw new Error(
      `Mailpit API error (${messageResponse.status}): ${
        text || messageResponse.statusText
      }`
    );
  }
  const message: MailpitMessage = await messageResponse.json();

  // Le template contient un <a href="...">Je rejoins la collectivité</a> ou Je lance Territoires...
  const invitationMatch = message.HTML?.match(
    /<a href="(https?:\/\/[^"]+)"[^>]*>\s*Je rejoins la collectivité/
  );
  const rattachementMatch = message.HTML?.match(
    /<a href="(https?:\/\/[^"]+)"[^>]*>\s*Je lance Territoires/
  );

  const urlMatch = invitationMatch ?? rattachementMatch;
  if (!urlMatch) {
    throw new Error(
      `Could not find invitation URL in email body for ${email}. Subject: ${message.Subject}`
    );
  }

  return {
    subject: message.Subject,
    url: urlMatch[1],
    type: invitationMatch ? 'invitation' : 'rattachement',
  };
}
