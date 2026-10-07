# Backfill des évènements `auth:oidc:linked`

Reconstruit dans PostHog les évènements de liaison OIDC perdus avant le
correctif de la course d'initialisation de posthog-js.

## Pourquoi

`auth:oidc:linked` était émis par l'app dans un `useEffect` de montage, au
retour de la redirection du fournisseur d'identité. Or `posthog.init()` était
appelé dans un `useEffect` du provider **parent**, et React exécute les effets
des enfants avant ceux du parent : la capture partait avant l'initialisation et
posthog-js la jetait. Résultat en production : **1 évènement enregistré pour
~230 identités en base**.

Le correctif (init pendant le rendu du provider, puis émission de l'évènement
par le backend au moment de l'écriture en base) répare l'avenir. Ce script
répare le passé.

## Ce qui est reconstruit, et ce qui ne peut pas l'être

Une identité encore présente dans `utilisateur_identite_oidc` porte sa date de
première liaison dans `created_at` : l'upsert de rotation du `sub` ne touche pas
cette colonne. C'est la seule source fiable, et elle a des trous :

- les identités **détachées** depuis (`auth:oidc:unlinked`) et les comptes
  **supprimés** (FK `ON DELETE CASCADE`) n'ont plus de ligne : le backfill est
  un **plancher**, pas l'historique exact ;
- la propriété `origine` est inconnue pour l'historique — elle est
  volontairement absente des évènements reconstruits plutôt qu'inventée ;
- les **créations de compte** via OIDC sont écartées : le compte naît avec son
  identité, il n'y a aucun compte préexistant rattaché, et le backend n'émet
  pas l'évènement dans ce cas. Les inclure changerait le sens de la métrique à
  la date de la bascule ;
- l'historique des **connexions** OIDC n'est pas reconstructible :
  `last_sign_in_at` est écrasé à chaque connexion. Le backfiller fabriquerait
  une série qui n'a jamais existé.

Tous les évènements reconstruits portent `backfill: true` et
`backfill_source: 'utilisateur_identite_oidc'` : l'équipe data peut les isoler
de ceux émis en direct.

## 1. Exporter les données

Dans l'éditeur SQL Supabase **de production**, jouer :

```sql
select
  o.user_id,
  o.provider,
  o.created_at as identite_creee_le,
  u.created_at as compte_cree_le
from public.utilisateur_identite_oidc o
join auth.users u on u.id = o.user_id
order by o.created_at;
```

puis « Download JSON ». Aucun identifiant de production n'est nécessaire au
script : il ne parle jamais à la base.

## 2. Vérifier à blanc

```bash
pnpx tsx apps/tools/src/migrations/backfill-oidc-linked-events/index.ts ~/Downloads/export.json
```

Rien n'est envoyé. Le résumé affiche le projet ciblé, le nombre d'évènements,
le nombre de lignes écartées (avec leur motif), la plage de dates et trois
exemples. **Lire ce résumé avant d'aller plus loin** : un import antidaté dans
le mauvais projet est très difficile à défaire.

## 3. Envoyer, projet de test d'abord

PostHog recommande de passer un import historique sur un projet de test avant
la production.

```bash
POSTHOG_KEY="phc_projet_de_test" POSTHOG_HOST="https://..." \
  pnpx tsx apps/tools/src/migrations/backfill-oidc-linked-events/index.ts ~/Downloads/export.json --confirm
```

Puis, une fois le résultat vérifié dans le projet de test, la même commande avec
la clé de production.

Le script pose `historicalMigration: true` : l'ingestion passe par un pipeline
séparé (pas de détection de pic sur des dates passées, pas de facturation
d'ingestion standard).

## Rejouabilité

Chaque évènement porte un uuid v5 déterministe dérivé de
`provider:user_id`. PostHog déduplique les évènements partageant
uuid + nom + timestamp + distinct_id : **un second passage est un no-op**. Ne
jamais changer le namespace uuid de `utils.ts`, ce serait perdre cette garantie.

## Tests

```bash
npx nx test tools -- backfill-oidc
```

La logique de classification, de construction et d'uuid est dans `utils.ts`
(pure et testée) ; `index.ts` ne fait que l'I/O.
