type SendMailParams = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
};

/**
 * Envoie un email sans que l'appelant ait à connaître le transport :
 * - en local (MAILPIT_URL définie via docker-compose), l'email part vers Mailpit ;
 * - sinon (prod), l'email part via Resend (RESEND_API_KEY).
 *
 * Lève une erreur si aucun transport n'est configuré ou si l'envoi échoue.
 */
export async function sendMail({
  from,
  to,
  subject,
  html,
}: SendMailParams): Promise<void> {
  const mailpitUrl = Deno.env.get('MAILPIT_URL');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  let res: Response;

  if (resendApiKey) {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
  } else if (mailpitUrl) {
    const toArray = Array.isArray(to) ? to : [to];
    res = await fetch(`${mailpitUrl}/api/v1/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        From: { Email: from },
        To: toArray.map((email) => ({ Email: email })),
        Subject: subject,
        HTML: html,
      }),
    });
  } else {
    throw new Error('Neither MAILPIT_URL nor RESEND_API_KEY is defined');
  }

  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(new Error(`Failed to send email: ${body}`), {
      status: res.status,
    });
  }
}
