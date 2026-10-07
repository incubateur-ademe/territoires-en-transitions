import { createHash, randomBytes } from 'crypto';

/**
 * Génère un token de rattachement à usage unique (32 octets aléatoires,
 * encodés en base64url pour un lien propre) et son hash sha256 — seul le
 * hash est stocké en base (`utilisateur_identite_oidc_invitation.token_hash`), jamais le
 * token brut (cf. `demande-rattachement.table.ts`).
 */
export function genererTokenRattachement(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashOidcInvitationToken(token) };
}

/** Hash sha256 (hex) d'un token de rattachement reçu en clair (par email). */
export function hashOidcInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
