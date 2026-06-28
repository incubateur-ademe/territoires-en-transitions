import { sendInvitationEmail } from '@/app/collectivites/membres/invite-membre/send-invitation.service';
import { NextRequest } from 'next/server';

/**
 * Endpoint pour envoyer le mail d'invitation à rejoindre une collectivité
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Arguments non valides' }, { status: 400 });
  }

  const result = await sendInvitationEmail(body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.data);
}

// laisse passer les requêtes preflight
export async function OPTIONS() {
  return Response.json({});
}
