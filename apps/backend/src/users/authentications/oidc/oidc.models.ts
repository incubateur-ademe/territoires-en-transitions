import { z } from 'zod';
import {
  oidcProviderSchema,
  oidcProviders,
  OidcProvider,
} from './models/utilisateur-identite-oidc.table';

export { oidcProviders, oidcProviderSchema };
export type { OidcProvider };

/**
 * Claims vérifiés retournés par le flux OIDC (id_token validé + userinfo signé).
 * ProConnect utilise `usual_name` (et non `family_name`) pour le nom d'usage.
 */
export const oidcClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  /**
   * Interprété par `isEmailVerified(provider, claims)` :
   * - provider de confiance (ProConnect, MonCompteAdeme adossé à ProConnect) →
   *   l'email fait foi, ce claim est ignoré (souvent absent chez ProConnect,
   *   `false` chez le Keycloak MCA d'intégration) ;
   * - provider NON listé de confiance → on exige `email_verified === true`
   *   (`false` ou absent = non vérifié, fail closed).
   *
   * Sécurité critique : la liaison automatique par email (cas 2) ne doit jamais
   * rattacher un sub à un compte existant sur la foi d'un email qu'un provider
   * non de confiance n'affirme pas avoir vérifié — sinon usurpation de compte
   * possible. Cf. `authentifier-oidc.service.ts`.
   */
  email_verified: z.boolean().optional(),
  given_name: z.string().min(1),
  usual_name: z.string().min(1),
  uid: z.string().optional(),
  siret: z.string().optional(),
  idp_id: z.string().optional(),
  /**
   * Statut d'agent public (`agent_public`, `agent_public_etat`,
   * `agent_public_territorial`, ou vide). Tableau, dans la config ProConnect
   * de base (pas d'habilitation spéciale). Ne distingue PAS les élus.
   * Optionnel : absent = statut inconnu, jamais bloquant.
   */
  roles: z.array(z.string()).optional(),
  /**
   * Nom lisible de l'organisation sélectionnée à la connexion (ex. « Mairie
   * de X »), fourni par ProConnect avec le `siret`. Sert à l'affichage de la
   * pré-sélection de collectivité. Optionnel.
   */
  organization_label: z.string().optional(),
});

export type OidcClaims = z.infer<typeof oidcClaimsSchema>;

/**
 * Providers gouvernementaux configurés explicitement (client_secret) dont
 * l'email fait foi, quelle que soit la valeur du claim `email_verified` :
 * - ProConnect : n'émet pas `email_verified` ; email professionnel du
 *   fournisseur d'identité officiel de l'agent (non modifiable librement) ;
 * - MonCompteAdeme : ProConnect en coulisses — l'email est donc forcément
 *   validé, même quand le Keycloak d'intégration renvoie `email_verified:false`.
 */
const OIDC_PROVIDERS_EMAIL_DE_CONFIANCE: ReadonlySet<OidcProvider> = new Set([
  'proconnect',
  'moncompteademe',
]);

/**
 * L'email des `claims` est-il vérifié, du point de vue du rattachement
 * automatique (cas 1 sync + cas 2 liaison) ?
 *
 * - provider de confiance (`OIDC_PROVIDERS_EMAIL_DE_CONFIANCE`) → l'email fait
 *   foi, on ignore un éventuel `email_verified` (IdP gouvernemental) ;
 * - sinon → on exige un `email_verified` explicitement `true` (un provider tiers
 *   qui ne l'affirme pas reste bloquant, garde-fou anti-usurpation).
 */
export function isEmailVerified(
  provider: OidcProvider,
  claims: OidcClaims
): boolean {
  if (OIDC_PROVIDERS_EMAIL_DE_CONFIANCE.has(provider)) {
    return true;
  }
  return claims.email_verified === true;
}

/**
 * Codes d'erreur typés relayés à l'app via `${APP_URL}/login?erreur=<code>`.
 * Jamais de 500 nue : toute erreur du flux aboutit à une redirection avec un de ces codes.
 */
export const oidcErrorCodes = [
  'oidc-state-invalide',
  'oidc-acces-refuse',
  'oidc-echec-token',
  'oidc-echec-userinfo',
  'oidc-claims-invalides',
  'oidc-compte-inconnu',
  'oidc-compte-desactive',
  'oidc-echec-session',
  'oidc-erreur-interne',
  /** Ticket JWT (cas 3) invalide/altéré ou expiré (TTL 15 min) au moment de la création de compte. */
  'oidc-ticket-expire',
  /** Echec de `auth.admin.createUser` (ex. email déjà pris de façon inattendue) lors de la création de compte (cas 3). */
  'oidc-echec-creation-compte',
  /** Liaison volontaire : le sub est déjà lié à un AUTRE compte — anti-vol, aucune modification. */
  'oidc-identite-deja-liee-ailleurs',
  /** Liaison volontaire : le compte courant est `dcp.deleted` — défense en profondeur. */
  'oidc-compte-supprime',
  /** Liaison volontaire : plus de session active au retour du provider. */
  'oidc-session-requise',
  /**
   * Un compte TeT existe pour cet email mais ProConnect ne le déclare pas
   * vérifié (`email_verified` absent/false) : rattachement automatique refusé
   * (sécurité), l'utilisateur doit d'abord vérifier son email. Cf. cas 2.
   */
  'oidc-email-non-verifie',
] as const;

export type OidcErrorCode = (typeof oidcErrorCodes)[number];

/**
 * Contrat entre le callback OIDC et le matching des comptes :
 * - `sub` connu (cas 1) → `connexion` (maj last_sign_in_at/claims/email) ;
 * - email vérifié connu (cas 2) → `connexion` avec `nouvelleLiaison:true`
 *   (déclenche le toast one-shot côté app) ;
 * - `dcp.limited` → `compte-desactive` (écran support, jamais de liaison) ;
 * - email connu mais NON vérifié par le provider → `email-non-verifie`
 *   (rattachement automatique refusé, l'utilisateur doit vérifier son email) ;
 * - aucun match ou `dcp.deleted` (traité comme non trouvé) → `non-reconnu`
 *   (la dialog de bienvenue est branchée ensuite).
 */
export type LoginUserWithOidcProviderResult =
  | {
      statut: 'connexion';
      userId: string;
      email: string;
      /** Liaison automatique venant d'avoir lieu (cas 2) — déclenche le toast one-shot. */
      nouvelleLiaison?: boolean;
    }
  | { statut: 'compte-desactive' }
  | { statut: 'email-non-verifie' }
  | { statut: 'non-reconnu' };

/** Noms des cookies httpOnly du flux (state/nonce/next scoppés au host api, TTL 5 min). */
export const OIDC_COOKIES = {
  state: 'oidc-state',
  nonce: 'oidc-nonce',
  next: 'oidc-next',
  idToken: 'oidc-id-token',
  logoutState: 'oidc-logout-state',
  /**
   * Liaison volontaire depuis le profil (`mode=link`) : simple drapeau
   * d'intention (valeur `'1'`, PAS d'identifiant de compte). Le compte cible
   * est re-résolu depuis la session Supabase AU CALLBACK — jamais depuis ce
   * cookie — pour éviter qu'un cookie forgé ne lie une identité au compte d'un
   * tiers (prise de contrôle de compte).
   */
  linkMode: 'oidc-link-mode',
  /**
   * Provider ayant ouvert la session courante (`proconnect` | `moncompteademe`).
   * Cookie LISIBLE par l'app (non httpOnly) : permet à la déconnexion de savoir
   * vers quel `/:provider/logout` rediriger pour fermer la session SSO amont
   * (sinon le provider ré-authentifie silencieusement au login suivant). Posé au
   * callback en même temps que l'id_token, purgé à la déconnexion.
   */
  provider: 'oidc-provider',
  /**
   * Parcours de création de compte (`intent=creation`) : drapeau d'intention
   * (valeur `'1'`). Quand le matching ne trouve aucun compte (cas 3), on crée
   * directement le compte au lieu de demander « avez-vous déjà un compte ? » —
   * on sait déjà que l'utilisateur voulait s'inscrire.
   */
  signupIntent: 'oidc-signup-intent',
} as const;

/** TTL des cookies de flux (state, nonce, next) : 5 minutes. */
export const OIDC_FLOW_COOKIES_TTL_MS = 5 * 60 * 1000;

/** TTL du cookie id_token (aligné sur la durée de session ProConnect : 12 h). */
export const OIDC_ID_TOKEN_COOKIE_TTL_MS = 12 * 60 * 60 * 1000;
