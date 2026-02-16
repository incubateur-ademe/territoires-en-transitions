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
 */
export async function getOtpFromMailpit(email: string): Promise<string> {
  let messageId: string | null = null;

  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`
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
    throw new Error(`No email received for ${email} after 30s`);
  }

  const messageResponse = await fetch(`${MAILPIT_URL}/api/v1/message/${messageId}`);
  if (!messageResponse.ok) {
    const text = await messageResponse.text();
    throw new Error(
      `Mailpit API error (${messageResponse.status}): ${
        text || messageResponse.statusText
      }`
    );
  }
  const message: MailpitMessage = await messageResponse.json();

  // Le template de confirmation contient <b id="otp">{{ .Token }}</b>
  const otpMatch = message.HTML?.match(/<b id="otp">(\d{6})<\/b>/);
  if (!otpMatch) {
    throw new Error(`Could not find OTP in email body for ${email}`);
  }

  return otpMatch[1];
}

/**
 * Supprime tous les emails d'une boîte Mailpit pour l'adresse donnée
 */
export async function clearMailpitMailbox(email: string): Promise<void> {
  await fetch(
    `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    { method: 'DELETE' }
  );
}
