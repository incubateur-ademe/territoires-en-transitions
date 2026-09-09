#!/usr/bin/env tsx
/**
 * Reconstruit dans PostHog les évènements `auth:oidc:linked` perdus.
 *
 * Jusqu'au correctif de la course d'initialisation de posthog-js, l'évènement
 * était émis au montage d'un composant, avant `posthog.init()` : la capture
 * était jetée. 1 évènement enregistré pour ~230 identités en base. Ce script
 * réémet un évènement par identité, antidaté à sa date de liaison
 * (`utilisateur_identite_oidc.created_at`, que l'upsert de rotation du `sub`
 * ne touche pas), et marqué `backfill: true`.
 *
 * Ne lit PAS la base : il consomme l'export JSON de la requête du README,
 * pour qu'aucun identifiant de production ne transite par le script.
 * Rejouable sans doublon (uuid déterministe, cf. `utils.ts`).
 *
 * Usage :
 *   # 1. à blanc (par défaut) : n'envoie rien, affiche ce qui partirait
 *   pnpx tsx apps/tools/src/migrations/backfill-oidc-linked-events/index.ts export.json
 *
 *   # 2. envoi réel
 *   POSTHOG_KEY="phc_..." POSTHOG_HOST="https://..." \
 *     pnpx tsx apps/tools/src/migrations/backfill-oidc-linked-events/index.ts export.json --confirm
 */

import { readFileSync } from 'node:fs';
import { chunk } from 'es-toolkit';
import { PostHog } from 'posthog-node';
import { sleep } from '../../utils/sleep.utils';
import {
  BackfillEvent,
  buildBackfillPlan,
  ExportedIdentity,
  SkippedIdentity,
} from './utils';

/** Évènements par requête HTTP `/batch` (le corps doit rester < 20 Mo). */
const CHUNK_SIZE = 100;

/** Pause entre deux lots — politesse, pas un rate limit. */
const SLEEP_BETWEEN_CHUNKS_MS = 200;

const readIdentities = (path: string): ExportedIdentity[] => {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));

  if (!Array.isArray(parsed)) {
    throw new Error(
      `${path} : tableau JSON attendu (export « Download JSON » de l'éditeur SQL Supabase)`
    );
  }

  return parsed as ExportedIdentity[];
};

const formatSkipped = (skipped: SkippedIdentity[]) => {
  const counts = skipped.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.reason] = (acc[entry.reason] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([reason, count]) => `${count} ${reason}`)
    .join(', ');
};

/**
 * Tout ce qui permet à l'opérateur de vérifier la cible AVANT l'envoi : rien
 * n'est plus difficile à défaire qu'un import antidaté dans le mauvais projet.
 */
const printSummary = (
  events: BackfillEvent[],
  skipped: SkippedIdentity[],
  { host, key }: { host?: string; key?: string }
) => {
  const timestamps = events.map((event) => event.timestamp.getTime());

  console.log(`\nProjet PostHog ciblé : ${host ?? '(POSTHOG_HOST absent)'}`);
  console.log(
    `Clé                  : ${key ? `${key.slice(0, 12)}…` : '(POSTHOG_KEY absente)'}`
  );
  console.log(`Évènements à envoyer : ${events.length}`);
  console.log(
    `Lignes écartées      : ${skipped.length}${
      skipped.length ? ` (${formatSkipped(skipped)})` : ''
    }`
  );

  if (events.length > 0) {
    console.log(
      `Plage de dates       : ${new Date(
        Math.min(...timestamps)
      ).toISOString()} → ${new Date(Math.max(...timestamps)).toISOString()}`
    );
    console.log('\nExemples :');
    for (const event of events.slice(0, 3)) {
      console.log(
        `  ${event.timestamp.toISOString()}  ${event.distinctId}  ${
          event.properties.provider
        }  uuid=${event.uuid}`
      );
    }
  }
};

const send = async (events: BackfillEvent[], key: string, host: string) => {
  // `historicalMigration` route l'ingestion sur un pipeline séparé : pas de
  // détection de pic sur des dates passées, pas de facturation d'ingestion
  // standard. Obligatoire pour des évènements antidatés — d'où un client
  // dédié plutôt que `PostHogClientService`, qui ne le pose pas.
  const posthog = new PostHog(key, {
    host,
    historicalMigration: true,
    flushAt: CHUNK_SIZE,
    maxBatchSize: CHUNK_SIZE,
  });

  const chunks = chunk(events, CHUNK_SIZE);
  for (const [index, batch] of chunks.entries()) {
    // `BackfillEvent` a exactement la forme d'un `EventMessage` posthog-node :
    // `timestamp` et `uuid` y sont des champs du message, pas des options.
    for (const event of batch) {
      posthog.capture(event);
    }
    await posthog.flush();
    console.log(`  lot ${index + 1}/${chunks.length} envoyé`);

    if (index < chunks.length - 1) {
      await sleep(SLEEP_BETWEEN_CHUNKS_MS);
    }
  }

  await posthog.shutdown();
};

async function main() {
  const [path, ...flags] = process.argv.slice(2);
  if (!path) {
    throw new Error(
      "Chemin de l'export JSON manquant. Usage : … index.ts export.json [--confirm]"
    );
  }

  const confirmed = flags.includes('--confirm');
  const key = process.env.POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST;

  const { events, skipped } = buildBackfillPlan(readIdentities(path));
  printSummary(events, skipped, { host, key });

  if (!confirmed) {
    console.log(
      '\nÀ blanc : rien envoyé. Relancer avec --confirm pour envoyer.\n' +
        'Premier passage sur un projet PostHog de TEST, jamais directement en production.'
    );
    return;
  }

  if (!key || !host) {
    throw new Error(
      'POSTHOG_KEY et POSTHOG_HOST sont requis pour un envoi réel.'
    );
  }

  if (events.length === 0) {
    console.log('\nAucun évènement à envoyer.');
    return;
  }

  console.log(`\nEnvoi de ${events.length} évènement(s)…`);
  await send(events, key, host);
  console.log(
    'Terminé. Un second passage est un no-op : PostHog déduplique sur uuid + nom + timestamp + distinct_id.'
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill en échec :', error);
    process.exit(1);
  });
