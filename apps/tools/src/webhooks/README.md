# Publication des webhooks

Le backend écrit la modification métier, `webhooks.webhook_message` et le message
`nest_outbox.messages` dans **la même transaction PostgreSQL**. Une erreur de
persistance annule cette transaction. Une indisponibilité de Redis ou du partenaire
n'empêche pas le commit : le relais de tools publie après celui-ci.

Tools publie l'identifiant du message dans la queue BullMQ `webhook-notifications`.
L'outbox réessaie la publication vers Redis jusqu'à 100 fois, avec un délai
exponentiel de 1 seconde à 5 minutes. La livraison HTTP utilise les 10 tentatives
BullMQ de [webhook.queue.ts](../../../backend/src/utils/webhooks/webhook.queue.ts).
Ces deux budgets couvrent des pannes différentes. Un échec HTTP définitif reste un
job BullMQ en échec, visible dans Bull Board ; il ne devient pas une dead letter de
l'outbox.

Le relais conserve l'ordre de publication par configuration. Les nouvelles
tentatives HTTP peuvent dépasser une livraison plus récente : ce n'est pas une
garantie d'ordre de réception chez le partenaire.

Après l'acceptation du job par Redis, l'entrée outbox est supprimée. Une perte
ultérieure des données Redis ne déclenche pas de republication automatique :
la durabilité et la sauvegarde Redis restent nécessaires. Le backfill Sqitch
reprend les messages `pending` au déploiement, pas en continu.

## Livraison et doublons

La livraison est **au moins une fois**. Le même UUID sert d'identifiant d'outbox,
de job BullMQ et d'en-tête HTTP `Idempotency-Key`. Le consommateur recharge le
message PostgreSQL ; un message déjà marqué `success` n'est pas renvoyé, même si
Redis a purgé son job. Les payloads standard et Communs ainsi que Basic/Bearer
restent ceux de la configuration du partenaire.

Une panne après l'acceptation HTTP, mais avant l'enregistrement du succès en base,
peut provoquer une nouvelle livraison. Le partenaire doit dédupliquer
`Idempotency-Key` pour garantir un traitement unique. Les appels HTTP expirent au
bout de 10 secondes ; une expiration ne prouve pas que le partenaire n'a rien
traité.

## Déploiement et arrêt

1. Appliquer la migration Sqitch `webhooks/outbox` avant de démarrer les nouvelles
   versions backend/tools. Elle crée les tables et reprend les messages persistés
   dont le statut est `pending`. Leur UUID évite un deuxième job si Redis contient
   déjà la publication.
2. Déployer backend et tools. Le backend ne lance aucun relais. Chaque instance
   tools peut en lancer un ; les leases PostgreSQL répartissent les messages.
3. Vérifier la disponibilité PostgreSQL/Redis et surveiller les retards ci-dessous.

Le schéma est géré par Sqitch : `migrate: false` interdit au package de le créer au
démarrage. Son contrôle de version fait échouer le démarrage si la migration
manque. Le schéma est inaccessible à `anon` et `authenticated`, avec RLS activée.

À l'arrêt, le relais cesse de réclamer des messages puis attend ses publications
en cours avant la fermeture des workers et connexions. Un arrêt brutal laisse
les leases expirer : les messages seront repris, avec le même identifiant.

Un retour à une version applicative antérieure demande d'abord d'arrêter les
producteurs, de laisser tools vider l'outbox puis de traiter ses dead letters.
Les jobs déjà acceptés restent dans Redis. Arrêter ensuite tools et déployer les
versions applicatives choisies. **Conserver le schéma est possible** ; son revert
Sqitch refuse de supprimer des messages, des dead letters ou une inbox non vide.
Ne pas effacer ces données pour forcer le revert.

## Surveillance et reprise

Ces requêtes se lancent avec le compte de maintenance PostgreSQL ; elles ne
retournent pas le payload du webhook :

```sql
SELECT count(*) AS pending,
       coalesce(max(extract(epoch FROM now()) * 1000 - created_at), 0)::bigint AS oldest_age_ms
FROM nest_outbox.messages;
SELECT count(*) AS dead_letters FROM nest_outbox.dead_letters;
SELECT id, topic, attempts, last_error, reason, failed_at
FROM nest_outbox.dead_letters ORDER BY failed_at DESC LIMIT 50;
```

Une dead letter demande une investigation. Un âge croissant des messages en
attente indique un relais arrêté, une indisponibilité Redis ou une publication
bloquée ; une queue BullMQ en échec indique un problème de livraison HTTP.
Le déploiement doit raccorder ces indicateurs à la supervision : le module ne
crée pas automatiquement de règle d'alerte externe.

Après correction de la cause, remettre **les UUID examinés seulement** dans
l'outbox avec l'API officielle du store. Depuis la racine du dépôt, avec
`SUPABASE_DATABASE_URL` fourni par l'environnement de maintenance :

```bash
node --input-type=module - <uuid-du-message> <<'JS'
import { Pool } from 'pg';
import { fromPg, PostgresOutboxStore } from '@nestjs/outbox/postgres';
const ids = process.argv.slice(2);
if (!ids.length) throw new Error('Au moins un UUID est requis');
const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL });
try {
  const store = new PostgresOutboxStore({ executor: fromPg(pool), migrate: false });
  await store.onModuleInit();
  console.log({ requeued: await store.requeueDeadLetters({ ids }, Date.now()) });
} finally {
  await pool.end();
}
JS
```

Cette commande ne démarre pas l'application. Le relais tools actif publiera les
messages réinsérés. Pour les livraisons HTTP en échec, examiner puis relancer les
jobs concernés dans Bull Board ; ils gardent leur UUID.

## Validation isolée

[webhook-outbox.e2e-spec.ts](./webhook-outbox.e2e-spec.ts) utilise PostgreSQL,
Redis et un serveur HTTP factice, sans démarrer l'application. Elle exige les
deux variables ci-dessous et une base jetable nommée
`tet_webhook_outbox_test` sur `127.0.0.1`. Elle recrée ses schémas de test. Ne pas
pointer ces variables sur la stack applicative.

```bash
WEBHOOK_TEST_DATABASE_URL=postgresql://postgres:<mot-de-passe-local>@127.0.0.1:<port-pg>/tet_webhook_outbox_test \
WEBHOOK_TEST_REDIS_URL=redis://127.0.0.1:<port-redis> \
pnpm exec vitest run --config apps/tools/vitest.config.mts apps/tools/src/webhooks/webhook-outbox.e2e-spec.ts
```

Sans ces variables, cette suite est ignorée. Elle couvre commit/rollback,
publication refusée, reprise après crash, purge Redis, contrats HTTP, doublons,
validation des identifiants, droits SQL, reprise des messages en attente et
protection du revert. Aucun fournisseur IA ni partenaire réel n'est appelé.
