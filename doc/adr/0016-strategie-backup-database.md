# 16. Stratégie de backup et restore de la base de données

Date : 2026-04-15

## Statut

Accepté

## Contexte

La base de données de production de Territoires en Transitions est hébergée sur Supabase (PostgreSQL managé). Nous avons besoin d'une stratégie de sauvegarde et de restauration fiable, automatisée et vérifiable pour être en complément de la [sauvegarde automatique en place sur Supabase ne dépassant pas 7j](https://supabase.com/docs/guides/platform/backups).

Ces backups doivent permettre de

- Prévenir la perte de données en cas d'incident détecté après 7J
- Permettre la restauration de données de prod dans d'autres environnements (preprod, développement local)
- Permettre un diagnostic précis en cas de problème de restauration
- Garantir la compatibilité entre les données sauvegardées et le code déployé

## Contraintes Supabase

L'hébergement sur Supabase impose plusieurs contraintes techniques qui ont fortement influencé les choix d'architecture :

### 1. Tables `auth` et `storage` appartiennent à Supabase

Les schémas `auth` et `storage` sont gérés par Supabase. Le rôle de connexion utilisé par notre application n'est **pas propriétaire** de ces tables. Cela signifie que :

- `ALTER TABLE auth.users DISABLE TRIGGER USER` échoue (pas les permissions)
- Les opérations DDL (DROP, CREATE) sur ces tables sont impossibles
- Seules les opérations DML (INSERT, UPDATE, DELETE, TRUNCATE) sont autorisées

**Workaround :** on restaure ces tables individuellement. En cas d'échec de la désactivation des triggers, un warning est logué mais la restauration continue. L'échec est non-bloquant car les triggers en question sont ceux de Supabase (gestion interne des sessions, etc.) et n'empêchent pas l'insertion des données.

### 2. `--disable-triggers` impossible

L'option `--disable-triggers` de `pg_restore` nécessite d'être superuser ou propriétaire de toutes les tables restaurées. Sur Supabase, ce n'est le cas ni pour `auth` ni pour `storage`.

**Workaround :** on désactive les triggers table par table avec `ALTER TABLE ... DISABLE TRIGGER USER` avant chaque restauration, et on les réactive après. Cette commande fonctionne pour les tables dont on est propriétaire (toutes les tables applicatives dans `public`, `private`, `historique`, etc.) et échoue silencieusement pour les tables Supabase.

### 3. Triggers `auth.users` → `dcp`

Lors de la restauration de la table `auth.users`, les triggers Supabase (qu'on ne peut pas désactiver) recréent automatiquement des lignes dans la table `public.dcp`. Lorsqu'on restaure ensuite `dcp` avec ses propres données, il y a un conflit.

**Solution :** on re-tronque `dcp` juste avant sa propre restauration (cas spécial dans le script de restore).

## Décisions

### 1. Restore data-only : pas de recréation de schéma

On ne supprime pas et ne recrée pas les tables lors d'une restauration. Seules les **données** sont restaurées (`pg_restore --data-only`). Le schéma de la base de données est géré exclusivement par le code (migrations Sqitch).

Cette approche garantit que le schéma de la base cible est toujours celui du code actuellement déployé. On évite ainsi les incompatibilités entre un schéma sauvegardé (potentiellement ancien) et le code en cours d'exécution.

**Conséquence importante :** `pg_restore --data-only` ne restaure pas les séquences PostgreSQL. Après la restauration des données, un script dédié (`reset_sequences.sql`) réinitialise toutes les séquences pour correspondre au `MAX` effectif de leur colonne propriétaire. Sans cette étape, les prochains `INSERT` échoueraient avec des violations de clé dupliquée.

Pour faciliter la vérification de compatibilité, un fichier **metadata** (`backup-YYYY-MM-DD.metadata.json`) est uploadé avec chaque backup. Il contient la version du backend, le commit et l'environnement au moment de la sauvegarde. Cela permet à l'opérateur de vérifier que le backup est compatible avec le code déployé sur l'environnement cible avant de lancer la restauration.

Cette information humaine ne constitue pas le garde de schéma. Avant sa première troncature,
`restore.sh` lit la phase de périodicité dans le registre Sqitch de la cible et dans la table
`sqitch.changes` archivée par `pg_dump` dans le même snapshot que les données. Les phases reconnues
sont `legacy`, `expand` et `contract`; elles doivent être strictement identiques. L'expand exige ses
quatre changements `periodicite`, `import_emt_valeur`, `reconciliation_formules` et
`dependances_formules`. Le contract exige en plus `periodicite_obligatoire`,
`periodicite_formules` et `report_indicateur_resultat_periode`. Toute combinaison partielle est
refusée, côté source comme côté cible. Cette matrice conservatrice bloque aussi bien un vieux backup
sur un schéma contracté qu'un backup mensuel sur un ancien schéma ou reporting. Une source ou cible
privée du registre Sqitch, ou une archive illisible, est toujours refusée. Le contrôle ne dépend ni
du nom daté de l'archive ni d'un fichier metadata modifiable séparément.

### 2. Restauration table par table pilotée par `restore-config.yml`

Le fichier `data_layer/backup/restore-config.yml` définit la liste des tables et leur regroupement logique (groupes : technical, stats, collectivites, indicateurs, referentiels, pai, plans). Il sert d'unique source de vérité consommée par `restore.sh` pour orchestrer la restauration. Les règles d'anonymisation, elles, sont écrites en SQL dans `clean_data.sql` (cf. §7).

Chaque table fait l'objet d'un appel `pg_restore` individuel. Cette approche est **plus lente** que la restauration monolithique (~150 appels vs 3), mais offre :

- Un **diagnostic précis** : en cas d'erreur, on sait immédiatement quelle table et quel groupe posent problème
- Une **restauration partielle** facilitée : on peut facilement modifier le script pour ne restaurer qu'un sous-ensemble de groupes
- Un **suivi de progression** détaillé : chaque table affiche son statut et sa durée

Les tables qui ne sont pas dans `restore-config.yml` (ex : `notifications`, `webhooks`) ne sont **pas restaurées**. C'est intentionnel — ces tables contiennent des données transientes gérées par le système de queues (BullMQ/Redis).

> **Historique :** ce fichier s'appelait auparavant `data_layer/pgsync/.pgsync.yml` et servait à la fois `restore.sh` et `pgsync`. Depuis le retrait de pgsync (cf. §4), il a été renommé et déplacé pour refléter son unique consommateur restant.

### 3. Stockage S3-compatible avec politique de rétention

Les backups sont stockés sur un bucket S3-compatible (Scaleway, OVH, MinIO, etc.) via l'AWS CLI avec le flag `--endpoint-url`. Le format de nommage est `backup-YYYY-MM-DD.dump` (dates UTC).
A l'heure actuelle, un projet supabase `backups` a été créé et est utilisé pour stocker les backups car il est sur une zone AWS différente (bonne pratique en cas d'incident dans un datacenter).

**Politique de rétention** (gérée par `cleanup.sh`) :

| Période            | Rétention                                  |
| ------------------ | ------------------------------------------ |
| < 60 jours         | 1 backup par jour (tous conservés)         |
| 60 jours → 24 mois | 1 backup par mois (le plus ancien du mois) |
| > 24 mois          | Supprimé                                   |

Un garde-fou empêche de descendre sous un nombre minimum de backups (configurable, défaut : 1).

### 4. Restauration nocturne sur staging et preprod

Après le backup quotidien (cron `0 22 * * *`, soit 22h UTC), deux jobs CI parallèles s'exécutent :

- **`restore-staging`** restaure la **staging** à partir du backup le plus récent (argument `latest` passé à `restore.sh`) — l'environnement reflète alors l'état de prod aux dernières minutes près.
- **`restore-preprod`** restaure la **preprod** à partir du backup de la veille (D-1, calculé via `date -u -d 'yesterday'` dans le job, relatif à l'achèvement du backup) — l'environnement sert de référence stable « état de prod il y a 24h » pour le debugging.

Ce remplacement du job historique `validate-restore` par deux jobs supprime la nécessité d'un mécanisme de synchronisation séparé : `restore-staging` remplace l'ancien job pgsync nocturne (cf. §4 historique : pgsync, retiré).

Chaque job :

1. Télécharge le backup depuis S3 (valide le roundtrip complet : backup → upload → download → restore)
2. Vérifie l'intégrité de l'archive et sa compatibilité Sqitch avec la cible, avant toute mutation
3. Tronque les tables cibles dans l'ordre inverse des dépendances
4. Restaure table par table à partir du dump
5. Restaure l'audit de migration et les intentions de réconciliation durables du même snapshot
6. Reconstruit et valide atomiquement la projection dérivée des dépendances de formules, puis rejoue
   l'audit de dates sous verrou
7. Réinitialise les séquences PostgreSQL via `reset_sequences.sql`
8. Exécute `clean_data.sql` (cf. §7) pour anonymiser les colonnes sensibles et asserter la garantie post-scrub
9. Vérifie les sanity checks de présence de données (`collectivite`, `dcp`, `indicateur_valeur`, `action_statut`, `score_snapshot`)

Chaque job a son propre groupe de concurrence par base (`database-maintenance-staging` et
`database-maintenance-preprod`), partagé avec le workflow contractuel de périodicité. Une
restauration et ce changement de schéma exceptionnel ne peuvent donc pas s'exécuter simultanément
sur une même cible depuis GitHub Actions. Les jobs gardent un timeout de 90 minutes pour borner les
runs runaway et utilisent respectivement `STAGING_DB_URL` et `PREPROD_DB_URL` (les deux secrets
pré-existants, hérités du fonctionnement pgsync). `clean_data.sql` lit
`RESTORE_ENCRYPTED_PASSWORD` via `psql -v` pour la mise à jour de `encrypted_password`.

Le backup utilise le groupe `database-maintenance-prod`. Les trois jobs nocturnes et la restauration manuelle (§5) configurent `cancel-in-progress: false` et `queue: max` : une seule opération s'exécute par groupe, avec jusqu'à 100 opérations en attente, traitées dans l'ordre de leur entrée dans la file. Une nouvelle demande ne remplace donc pas une demande déjà en attente. [Fonctionnement des files GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

**Saturation de la file** : au-delà de 100 opérations en attente dans un groupe, GitHub annule les nouvelles demandes. Il n'y a pas de relance automatique. L'opérateur vérifie les exécutions annulées dans GitHub Actions, attend qu'une place se libère puis relance manuellement les opérations encore nécessaires, après vérification de la cible et de la date du backup. Il conserve le groupe de concurrence pour éviter des opérations simultanées sur la même base.

### 5. Restauration manuelle à la demande

En complément de la restauration nocturne, un workflow GitHub Actions séparé (`cd-restore-preprod.yml`) permet de restaurer **à la demande** la preprod à partir d'un backup S3 de prod. Déclenchable manuellement via `workflow_dispatch`, il accepte un paramètre optionnel `backup_date` au format ISO (`YYYY-MM-DD`) : si une date est fournie, le backup correspondant (`backup-YYYY-MM-DD.dump`) est téléchargé et restauré ; si le champ est laissé vide, le workflow délègue à `restore.sh latest` qui liste le bucket S3 et sélectionne automatiquement le backup le plus récent disponible.

Ce mode `latest` est exposé par `restore.sh` lui-même (et non dans le workflow) pour rester utilisable en local (`./restore.sh latest`). Le workflow manuel utilise le secret `PREPROD_DB_URL` (consolidé avec celui du job `restore-preprod` nocturne) et partage le même verrou de concurrence (`database-maintenance-preprod`), sérialisant les restaurations concurrentes (manuelles ou planifiées) et le contract de périodicité sur la preprod partagée. La politique de file et de reprise en cas de saturation décrite au §4 s'applique également à ce workflow. `clean_data.sql` (§7) s'applique automatiquement, comme pour le job nocturne. Le garde-fou de protection production (allowlist, §6) reste actif puisqu'il est implémenté dans `restore.sh` et donc commun à tous les appelants.

### 6. Sécurité

- **Protection production (allowlist fail-closed)** : `restore.sh` parse `TO_DB_URL` et refuse toute
  restauration sauf si son hostname effectif est local ou si l'identité Supabase extraite correspond
  exactement à staging ou preprod. Les paramètres libpq capables de remplacer l'autorité de l'URL
  sont interdits. Une valeur autorisée placée dans le mot de passe, la query string ou un suffixe de
  domaine ne peut donc pas autoriser une autre cible. Toute URL inattendue, dont production, est
  rejetée sans journaliser ses credentials. Toute cible Supabase distante doit en plus déclarer
  explicitement `sslmode=require`, `verify-ca` ou `verify-full` dans son secret de connexion.
- **Compatibilité fail-closed avant troncature** : les phases Sqitch de la source et de la cible
  doivent être exactement égales, et toute phase `expand` ou `contract` partielle est rejetée. La
  cible doit aussi posséder les tables et fonctions physiques attendues par sa phase déclarée ; le
  registre Sqitch seul ne peut pas masquer une dérive de schéma. Les restaurations nocturnes
  resteront donc volontairement en échec pendant chaque décalage de rollout entre production et
  staging/preprod, dans les deux directions. En `expand` et `contract`, l'archive doit aussi contenir
  les entrées `TABLE DATA` de l'audit et de la file de réconciliation ; une archive sélective ne peut
  pas les vider silencieusement.
- **État dérivé restauré explicitement** : `indicateur_definition` est chargé avec ses triggers USER
  désactivés. La projection `private.indicateur_definition_dependance_calcul` est donc reconstruite
  avec l'extracteur canonique, puis validée sous les verrous du graphe et du catalogue. En revanche,
  `migration.indicateur_valeur_periodicite_audit` et
  `private.indicateur_reconciliation_formule` sont des états durables restaurés depuis le même
  snapshot : ils portent respectivement l'historique de downgrade et les recalculs encore dus. Le
  rejeu de l'audit en phase `expand` écarte les entrées devenues incohérentes et traite les valeurs
  chargées sans triggers. En phase `contract`, la fonction transitoire ayant été retirée, les dates
  sont validées directement. Une validation en échec annule atomiquement les post-traitements.
- **Exclusion mutuelle des maintenances** : les restaurations planifiées et manuelles partagent leur
  groupe de concurrence par base avec le workflow contractuel. Le backup de production partage de
  même `database-maintenance-prod`, afin de ne jamais capturer un snapshot au milieu du contract.
  Une invocation hors GitHub Actions reste une opération de maintenance et doit respecter le même
  gel opératoire.
- **Réactivation des triggers** : pendant la restauration table par table, la table dont les
  triggers USER ont effectivement été désactivés reste mémorisée. Toute sortie normale, erreur,
  interruption ou annulation par `TERM` tente de les réactiver ; un échec de réactivation arrête le
  restore au lieu de publier silencieusement une table sans invariants. Seul un arrêt non
  interceptable (`SIGKILL` ou panne de la cible) nécessite encore une vérification opérateur.
- **Délai de confirmation** : un `sleep 10` permet à l'opérateur de vérifier l'URL cible avant la restauration (désactivé en CI via `$CI`)
- **Masquage des credentials** : l'URL de connexion est masquée dans les logs (`postgresql://***@host/db`)
- **Secrets GitHub** : tous les credentials sont passés via des variables d'environnement (secrets GitHub), jamais en arguments CLI
- **Anonymisation post-restore (`clean_data.sql`, cf. §7)** : les colonnes sensibles (`auth.users.phone` et `encrypted_password`, `public.dcp.telephone`, `config.service_configurations.token`) sont systématiquement anonymisées après chaque restauration sur staging / preprod / local

### 7. Scrubbing post-restore (`clean_data.sql`)

Après `reset_sequences.sql` et avant les sanity checks, `restore.sh` exécute `clean_data.sql` via `psql -v ON_ERROR_STOP=1 -v pwd="$RESTORE_ENCRYPTED_PASSWORD" -f`. Le SQL est intentionnellement plat et lisible : un `UPDATE` par colonne sensible, suivi d'un bloc `DO` d'assertions. Pas de génération dynamique, pas d'introspection de schéma, pas de YAML pour les règles — la liste exacte des colonnes scrubbées est lisible d'un coup d'œil dans le fichier.

**Colonnes scrubbées (état actuel)** :

| Cible                                 | Action                                                       |
| ------------------------------------- | ------------------------------------------------------------ |
| `auth.users.phone`                    | `NULL`                                                       |
| `auth.users.encrypted_password`       | `:'pwd'` si non vide, sinon laissé tel quel                  |
| `public.dcp.telephone`                | `NULL` (cf. interaction trigger ci-dessous)                  |
| `config.service_configurations.token` | `NULL` — empêche staging/preprod d'avoir des tokens API live |

**Substitution du mot de passe** : `restore.sh` passe `-v pwd="${RESTORE_ENCRYPTED_PASSWORD:-}"` à `psql`. La variable peut être vide (env var non définie en local) — l'`UPDATE` correspondant et son assertion sont alors no-op (clauses `WHERE :'pwd' <> ''`). Le hash bcrypt n'est ainsi jamais stocké dans le repo ; la rotation se fait en mettant à jour le secret GitHub Actions `RESTORE_ENCRYPTED_PASSWORD`.

**Interaction avec le trigger `auth.users → public.dcp`** : le trigger Supabase utilise `coalesce(new.phone, telephone)`. Quand le scrub met `auth.users.phone = NULL`, le trigger conserverait l'ancien `dcp.telephone`. Le SQL ajoute donc une seconde passe explicite `UPDATE public.dcp SET telephone = NULL`. Cette interaction est commentée dans `clean_data.sql`.

**Assertion intégrée** : la fin de `clean_data.sql` est un bloc `DO $$ ... $$` qui vérifie chaque invariant (`auth.users.phone IS NULL`, `public.dcp.telephone IS NULL`, `config.service_configurations.token IS NULL`, et — si `pwd` est non vide — le hash attendu sur tous les `auth.users.encrypted_password`). En cas de violation, `RAISE EXCEPTION` fait échouer la transaction et `ON_ERROR_STOP=1` propage l'erreur jusqu'au job CI. C'est un oracle indépendant : chaque assertion est posée à la main (pas dérivée d'un quelconque mécanisme dynamique), donc un bug d'ajout d'`UPDATE` se détecte par l'absence de l'assertion correspondante, pas par sa réplication d'une boucle.

## Conséquences

### Positives

- Backups quotidiens automatisés avec vérification d'intégrité (`pg_restore --list` avant upload)
- Restauration vérifiée automatiquement chaque jour en CI
- Diagnostic précis des erreurs de restauration grâce à l'approche table par table
- Compatibilité code/données vérifiable via les métadonnées
- Politique de rétention automatisée avec garde-fous

### Négatives

- La restauration table par table est significativement plus lente (~150 appels `pg_restore` relisant chacun le dump complet)
- Les tables non listées dans `restore-config.yml` ne sont pas restaurées (le backup, lui, contient l'intégralité de la base) — nécessite une attention lors de l'ajout de nouvelles tables pour les inclure dans un groupe
- Ajouter une nouvelle colonne sensible au scrubber demande une modification SQL (ajout d'`UPDATE` + assertion correspondante dans `clean_data.sql`) — c'est volontaire (gate de revue, oracle indépendant) mais c'est un peu plus de friction que l'ancienne approche pgsync où `data_rules` couvrait dynamiquement toutes les tables synchronisées
- La restauration sur staging et preprod interrompt brièvement l'utilisation de ces environnements (chaque nuit)

## Alternatives considérées

### pg_restore monolithique (ancien fonctionnement)

Un seul appel `pg_restore` par schéma. Plus rapide, mais en cas d'erreur le message d'échec ne permet pas d'identifier la table problématique. Le debug nécessitait une bisection manuelle avec les flags `-t`. De plus, cette approche ne permet pas de désactiver les triggers table par table — il faudrait résoudre les problèmes de droits Supabase (devenir propriétaire des tables ou obtenir les privilèges superuser) pour pouvoir utiliser `--disable-triggers` globalement.

### Recréation complète du schéma (DROP + CREATE + données)

Suppression et recréation des tables avant restauration. Rejeté car :

- Impossible pour les tables `auth` et `storage` (pas propriétaire)
- Risque d'incompatibilité entre le schéma du backup et le code déployé
- Perte des objets de schéma non inclus dans le dump (fonctions, triggers applicatifs)

### `session_replication_role = replica`

Désactivation globale des triggers via le paramètre de session PostgreSQL. Envisagé pour simplifier la gestion des triggers, mais rejeté car ce paramètre est **par connexion** et chaque appel `pg_restore` ouvre une nouvelle connexion. Il aurait fallu le configurer au niveau de la base entière (`ALTER DATABASE ... SET`), ce qui nécessite des privilèges superuser dont on ne dispose pas sur Supabase.

### Backups Supabase natifs

Supabase propose ses propres backups (Point-in-Time Recovery). Non retenu comme solution principale car :

- Pas de contrôle sur le format et le contenu
- Pas de restauration partielle possible
- Pas d'intégration avec nos environnements (preprod, local)
- Dépendance au vendor pour une opération critique
- Limité à 7 jours de rétention
- Peut entraîner des coûts supplémentaires

## Architecture globale

```
┌────────────────────────────────────────────────────────────────────┐
│                     GitHub Actions (cron 0 22 * * *)                │
│                                                                    │
│  ┌─────────────┐    ┌────────────┐    ┌─────────────────────────┐ │
│  │  backup.sh  │ →  │ S3 bucket  │    │  restore-staging        │ │
│  │  pg_dump    │    │ backup-    │ ─→ │  restore.sh latest      │ │
│  │  + metadata │    │  YYYY-MM-  │    │  → STAGING_DB_URL       │ │
│  └──────┬──────┘    │  DD.dump   │    └─────────────────────────┘ │
│         │           │ + metadata │                                 │
│         ▼           └─────┬──────┘    ┌─────────────────────────┐ │
│  ┌─────────────┐          ├──────→    │  restore-preprod        │ │
│  │ cleanup.sh  │          │           │  restore.sh <D-1 date>  │ │
│  │ rétention   │          │           │  → PREPROD_DB_URL       │ │
│  └─────────────┘          │           └─────────────────────────┘ │
│                           ▼                                        │
│                Each restore.sh: pg_restore table-by-table          │
│                              ↓ restore audit + reconciliation      │
│                              ↓ rebuild/validate formula projection │
│                              ↓ reset_sequences.sql                 │
│                              ↓ clean_data.sql (auth.users.phone +  │
│                                  encrypted_password, dcp.telephone,│
│                                  config.service_configurations.    │
│                                  token + integrated assertions)    │
│                              ↓ PII assertion + sanity checks       │
│                                                                    │
│  BDD prod ───→ S3 ───→ staging (latest)  /  preprod (D-1)          │
└────────────────────────────────────────────────────────────────────┘
```

## Fichiers et scripts

| Fichier                                                  | Rôle                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `data_layer/backup/backup.sh`                            | Dump production + upload S3 + metadata                                                            |
| `data_layer/backup/restore.sh`                           | Contrôle de phase + restore ordonné + post-traitements + sanity                                   |
| `data_layer/backup/check-restore-compatibility.sh`       | Classification Sqitch source/cible et matrice de compatibilité fail-closed                        |
| `data_layer/backup/rebuild-indicateur-formula-state.sql` | Rebuild/validation du graphe dérivé et rejeu d'audit après restore                                |
| `data_layer/backup/cleanup.sh`                           | Nettoyage des backups obsolètes selon la politique de rétention                                   |
| `data_layer/backup/reset_sequences.sql`                  | Réinitialisation des séquences après restore data-only                                            |
| `data_layer/backup/clean_data.sql`                       | Anonymisation des colonnes sensibles (cf. §7) + assertions intégrées                              |
| `data_layer/backup/restore-config.yml`                   | Source de vérité : liste des tables et groupes restaurés par `restore.sh`                         |
| `.github/workflows/backup-database.yml`                  | Orchestration CI : backup-production + restore-staging (latest) + restore-preprod (D-1) + cleanup |
| `.github/workflows/cd-restore-preprod.yml`               | Restauration manuelle à la demande de la preprod (date ISO ou `latest`)                           |

## Opérations courantes

### Ajouter une colonne au scrubbing

Éditer `data_layer/backup/clean_data.sql` :

1. Ajouter un `UPDATE schema.table SET col = <val> WHERE …` avec la même forme que les UPDATEs existants.
2. Ajouter dans le bloc `DO $$ … $$` final une assertion `count(*) … = 0` correspondante avec un `RAISE EXCEPTION` clair si elle échoue.

L'oracle d'assertion étant écrit à la main, oublier d'ajouter l'assertion équivaut à oublier la garantie — c'est volontaire (revue obligatoire des deux modifications ensemble).

### Faire tourner le hash bcrypt

1. Générer un nouveau hash bcrypt à partir du nouveau mot de passe partagé : `htpasswd -bnBC 10 "" "<nouveau-mdp>" | tr -d ':\n'`.
2. Mettre à jour le secret GitHub Actions `RESTORE_ENCRYPTED_PASSWORD` (environnement `prod`) avec la nouvelle valeur.
3. La prochaine restauration nocturne propage le nouveau hash. Documenter le nouveau cleartext dans le credential store de l'équipe.
