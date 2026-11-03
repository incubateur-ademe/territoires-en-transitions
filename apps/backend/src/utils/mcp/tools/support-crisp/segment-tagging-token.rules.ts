import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Ajout d'un segment préparé par l'assistant, à confirmer par l'utilisateur :
 * le jeton porte exactement ce qui sera écrit, signé par le serveur. Aucun état
 * côté serveur, donc valable quelle que soit l'instance qui reçoit la
 * confirmation.
 */
export type SegmentTaggingAction = {
  userId: string;
  segment: string;
  sessionIds: string[];
  expiresAt: number;
};

export const SEGMENT_TAGGING_TOKEN_TTL_MS = 30 * 60 * 1000;

const signingKey = (secret: string): Buffer =>
  createHash('sha256').update(`assistant-segment-tagging:${secret}`).digest();

const sign = (payload: string, secret: string): string =>
  createHmac('sha256', signingKey(secret)).update(payload).digest('base64url');

export const signSegmentTaggingAction = (
  action: SegmentTaggingAction,
  secret: string
): string => {
  const payload = Buffer.from(JSON.stringify(action)).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
};

export type VerifyTokenError = 'INVALID_TOKEN' | 'EXPIRED_TOKEN';

export const verifySegmentTaggingToken = (
  token: string,
  secret: string,
  now: number
):
  | { ok: true; action: SegmentTaggingAction }
  | { ok: false; error: VerifyTokenError } => {
  const [payload, signature, ...rest] = token.split('.');
  if (!payload || !signature || rest.length) {
    return { ok: false, error: 'INVALID_TOKEN' };
  }
  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return { ok: false, error: 'INVALID_TOKEN' };
  }
  let action: SegmentTaggingAction;
  try {
    action = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    return { ok: false, error: 'INVALID_TOKEN' };
  }
  if (action.expiresAt < now) {
    return { ok: false, error: 'EXPIRED_TOKEN' };
  }
  return { ok: true, action };
};
