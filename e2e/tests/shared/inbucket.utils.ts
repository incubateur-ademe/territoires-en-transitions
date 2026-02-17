const INBUCKET_URL =
  process.env.INBUCKET_URL || 'http://127.0.0.1:54324';

interface InbucketMessageHeader {
  mailbox: string;
  id: string;
  from: string;
  subject: string;
  date: string;
  size: number;
}

interface InbucketMessageBody {
  mailbox: string;
  id: string;
  from: string;
  subject: string;
  date: string;
  body: {
    text: string;
    html: string;
  };
}

/**
 * Récupère le code OTP depuis l'email de confirmation envoyé par Supabase,
 * en interrogeant l'API inbucket.
 *
 * Attend l'arrivée de l'email avec un polling (30 tentatives, 1s d'intervalle).
 */
export async function getOtpFromInbucket(email: string): Promise<string> {
  const mailbox = email.split('@')[0];

  let messages: InbucketMessageHeader[] = [];
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(
      `${INBUCKET_URL}/api/v1/mailbox/${mailbox}`
    );
    messages = await response.json();
    if (messages.length > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (messages.length === 0) {
    throw new Error(`No email received for ${email} after 30s`);
  }

  const latestMessage = messages[messages.length - 1];
  const messageResponse = await fetch(
    `${INBUCKET_URL}/api/v1/mailbox/${mailbox}/${latestMessage.id}`
  );
  const messageBody: InbucketMessageBody = await messageResponse.json();

  // Le template de confirmation contient <b id="otp">{{ .Token }}</b>
  const otpMatch = messageBody.body.html.match(
    /<b id="otp">(\d{6})<\/b>/
  );
  if (!otpMatch) {
    throw new Error(
      `Could not find OTP in email body for ${email}`
    );
  }

  return otpMatch[1];
}

/**
 * Supprime tous les emails d'une boîte inbucket
 */
export async function clearInbucketMailbox(email: string): Promise<void> {
  const mailbox = email.split('@')[0];
  await fetch(`${INBUCKET_URL}/api/v1/mailbox/${mailbox}`, {
    method: 'DELETE',
  });
}
