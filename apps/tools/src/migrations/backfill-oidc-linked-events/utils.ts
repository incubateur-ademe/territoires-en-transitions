import { EVENT_OIDC_LINKED } from '@tet/backend/users/authentications/oidc/oidc.models';
import { oidcProviders } from '@tet/backend/users/authentications/oidc/models/utilisateur-identite-oidc.table';
import { v5 as uuidv5 } from 'uuid';

/**
 * Le nom vient du backend, il n'est pas recopié : le backfill complète la même
 * série, il ne crée pas une série parallèle — un renommage ne peut donc pas
 * les faire diverger.
 */
export const OIDC_LINKED_EVENT = EVENT_OIDC_LINKED;

/**
 * Namespace uuid v5 tiré une fois et figé pour toujours : c'est lui qui rend
 * le backfill rejouable. PostHog déduplique les évènements partageant
 * uuid + nom + timestamp + distinct_id, donc deux passages du script écrivent
 * le même évènement, pas deux. Le changer casserait cette garantie.
 */
const BACKFILL_UUID_NAMESPACE = '58a3361c-c3bd-4a9f-aae3-07d61edf1097';

/**
 * Au-delà de ce délai entre la création du compte et celle de son identité, la
 * liaison a rattaché un compte préexistant. En dessous, le compte est né avec
 * son identité (création de compte via OIDC) : ce n'est pas une liaison, et le
 * backend n'émet pas l'évènement dans ce cas — le backfill ne doit pas non
 * plus, sinon la métrique changerait de sens à la date de la bascule.
 */
export const ACCOUNT_CREATION_THRESHOLD_MS = 60_000;

/** Une ligne de l'export SQL (cf. README). */
export type ExportedIdentity = {
  user_id: string;
  provider: string;
  identite_creee_le: string;
  compte_cree_le: string;
};

export type BackfillEvent = {
  distinctId: string;
  event: typeof OIDC_LINKED_EVENT;
  properties: Record<string, string | boolean>;
  uuid: string;
  timestamp: Date;
};

export type SkippedIdentity = {
  identity: ExportedIdentity;
  reason: 'creation-compte' | 'ligne-invalide';
};

export type BackfillPlan = {
  events: BackfillEvent[];
  skipped: SkippedIdentity[];
};

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

/**
 * Vrai quand l'identité est née avec son compte : `created_at` des deux à
 * moins de `ACCOUNT_CREATION_THRESHOLD_MS` d'écart.
 */
export const isAccountCreation = (
  identityCreatedAt: Date,
  accountCreatedAt: Date
): boolean =>
  identityCreatedAt.getTime() - accountCreatedAt.getTime() <=
  ACCOUNT_CREATION_THRESHOLD_MS;

/**
 * `distinct_id` = l'UUID `auth.users.id`, comme
 * `posthog.identify(user.id, …)` côté app : les évènements reconstruits se
 * rattachent aux personnes existantes.
 */
export const buildBackfillEvent = (
  identity: ExportedIdentity,
  timestamp: Date
): BackfillEvent => ({
  distinctId: identity.user_id,
  event: OIDC_LINKED_EVENT,
  properties: {
    provider: identity.provider,
    // Marque la reconstruction : l'équipe data doit pouvoir isoler ces
    // évènements de ceux émis en direct.
    backfill: true,
    backfill_source: 'utilisateur_identite_oidc',
  },
  // Pas d'`origine` : elle est inconnue pour l'historique. En inventer une
  // polluerait la propriété que le backend vient de redéfinir.
  uuid: uuidv5(
    `${identity.provider}:${identity.user_id}`,
    BACKFILL_UUID_NAMESPACE
  ),
  timestamp,
});

/**
 * Transforme l'export en évènements à envoyer, en écartant les créations de
 * compte et les lignes inexploitables. Pure : c'est elle qui est testée.
 */
export const buildBackfillPlan = (
  identities: ExportedIdentity[]
): BackfillPlan => {
  const events: BackfillEvent[] = [];
  const skipped: SkippedIdentity[] = [];

  for (const identity of identities) {
    const identityCreatedAt = new Date(identity.identite_creee_le);
    const accountCreatedAt = new Date(identity.compte_cree_le);

    const isUsable =
      !!identity.user_id &&
      (oidcProviders as readonly string[]).includes(identity.provider) &&
      isValidDate(identityCreatedAt) &&
      isValidDate(accountCreatedAt);

    if (!isUsable) {
      skipped.push({ identity, reason: 'ligne-invalide' });
      continue;
    }

    if (isAccountCreation(identityCreatedAt, accountCreatedAt)) {
      skipped.push({ identity, reason: 'creation-compte' });
      continue;
    }

    events.push(buildBackfillEvent(identity, identityCreatedAt));
  }

  return { events, skipped };
};
