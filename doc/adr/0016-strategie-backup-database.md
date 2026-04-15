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

### 2. Restauration table par table avec pgsync comme source de vérité

Le fichier `data_layer/pgsync/.pgsync.yml` définit la liste des tables et leur regroupement logique (groupes : technical, stats, collectivites, indicateurs, referentiels, pai, plans). Ce fichier sert de **source de vérité unique** pour :

- La synchronisation entre environnements (pgsync)
- La restauration des backups (restore.sh)

Chaque table fait l'objet d'un appel `pg_restore` individuel. Cette approche est **plus lente** que la restauration monolithique (~150 appels vs 3), mais offre :

- Un **diagnostic précis** : en cas d'erreur, on sait immédiatement quelle table et quel groupe posent problème
- Une **restauration partielle** facilitée : on peut facilement modifier le script pour ne restaurer qu'un sous-ensemble de groupes
- Un **suivi de progression** détaillé : chaque table affiche son statut et sa durée

Les tables qui ne sont pas dans `.pgsync.yml` (ex : `notifications`, `webhooks`) ne sont **pas restaurées**. C'est intentionnel — ces tables contiennent des données transientes gérées par le système de queues (BullMQ/Redis).

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

### 4. Validation automatique en CI

Après chaque backup quotidien (2h UTC), un job CI `validate-restore` restaure le dump fraîchement créé sur la base **preprod**. Ce job :

1. Télécharge le backup depuis S3 (valide le roundtrip complet : backup → upload → download → restore)
2. Tronque les tables de la base preprod dans l'ordre inverse des dépendances
3. Restaure table par table
4. Réinitialise les séquences PostgreSQL (`*_id_seq`) pour correspondre aux `MAX(id)` effectifs des tables restaurées (via `reset_sequences.sql`)
5. Exécute des **sanity checks** : vérifie que les tables clés (`collectivite`, `dcp`, `indicateur_valeur`, `action_statut`, `score_snapshot`) contiennent des données

> **Note :** la validation automatique en CI est temporairement désactivée (trop lente). Le backup quotidien continue de fonctionner.

Un verrou de concurrence (`concurrency: restore-preprod`) empêche deux restaurations simultanées sur la même base preprod.

### 5. Restauration manuelle à la demande

En complément de la validation quotidienne, un workflow GitHub Actions séparé (`cd-restore-preprod.yml`) permet de restaurer **à la demande** la preprod à partir d'un backup S3 de prod. Déclenchable manuellement via `workflow_dispatch`, il accepte un paramètre optionnel `backup_date` au format ISO (`YYYY-MM-DD`) : si une date est fournie, le backup correspondant (`backup-YYYY-MM-DD.dump`) est téléchargé et restauré ; si le champ est laissé vide, le workflow délègue à `restore.sh latest` qui liste le bucket S3 et sélectionne automatiquement le backup le plus récent disponible.

Ce mode `latest` est exposé par `restore.sh` lui-même (et non dans le workflow) pour rester utilisable en local (`./restore.sh latest`). La sémantique historique « pas d'argument = date du jour (UTC) » est préservée afin de ne pas modifier le comportement du job `validate-restore` quotidien. Le workflow manuel partage le même verrou de concurrence (`restore-preprod`) que la validation automatique, sérialisant les restaurations concurrentes (manuelles ou planifiées) sur la preprod partagée. Le garde-fou de protection production reste actif puisqu'il est implémenté dans `restore.sh` et donc commun à tous les appelants.

### 6. Sécurité

- **Protection production** : `restore.sh` bloque toute restauration vers une URL contenant l'identifiant du projet Supabase de production (denylist hardcodée)
- **Délai de confirmation** : un `sleep 10` permet à l'opérateur de vérifier l'URL cible avant la restauration (désactivé en CI via `$CI`)
- **Masquage des credentials** : l'URL de connexion est masquée dans les logs (`postgresql://***@host/db`)
- **Secrets GitHub** : tous les credentials sont passés via des variables d'environnement (secrets GitHub), jamais en arguments CLI

## Conséquences

### Positives

- Backups quotidiens automatisés avec vérification d'intégrité (`pg_restore --list` avant upload)
- Restauration vérifiée automatiquement chaque jour en CI
- Diagnostic précis des erreurs de restauration grâce à l'approche table par table
- Compatibilité code/données vérifiable via les métadonnées
- Politique de rétention automatisée avec garde-fous

### Négatives

- La restauration table par table est significativement plus lente (~150 appels `pg_restore` relisant chacun le dump complet)
- Les tables non listées dans `.pgsync.yml` ne sont pas restaurées (le backup, lui, contient l'intégralité de la base) — nécessite une attention lors de l'ajout de nouvelles tables pour les inclure dans un groupe pgsync
- Le garde-fou production est une denylist (un seul identifiant) plutôt qu'une allowlist — fragile si un second projet de production est créé
- La restauration sur preprod interrompt brièvement l'utilisation de cet environnement

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
┌─────────────────────────────────────────────────────┐
│                 GitHub Actions (2h UTC)              │
│                                                     │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │   backup.sh  │→│  S3 bucket │→│  restore.sh   │ │
│  │  pg_dump     │  │  .dump     │  │  pg_restore   │ │
│  │  + metadata  │  │  .metadata │  │  table/table  │ │
│  └──────┬──────┘  └────────────┘  └──────┬───────┘ │
│         │                                │         │
│         ▼                                ▼         │
│  ┌─────────────┐                ┌──────────────┐   │
│  │ cleanup.sh  │                │ sanity checks│   │
│  │ rétention   │                │ 5 tables clés│   │
│  └─────────────┘                └──────────────┘   │
│                                                     │
│  BDD prod ──────────────────────→ BDD preprod      │
└─────────────────────────────────────────────────────┘
```

## Fichiers et scripts

| Fichier                                    | Rôle                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `data_layer/backup/backup.sh`              | Dump production + upload S3 + metadata                                  |
| `data_layer/backup/restore.sh`             | Download S3 + truncate + restore table/table + sanity checks            |
| `data_layer/backup/cleanup.sh`             | Nettoyage des backups obsolètes selon la politique de rétention         |
| `data_layer/backup/reset_sequences.sql`    | Réinitialisation des séquences après restore data-only                  |
| `data_layer/pgsync/.pgsync.yml`            | Source de vérité : liste des tables et groupes                          |
| `.github/workflows/backup-database.yml`    | Orchestration CI : backup + cleanup + validation restore                |
| `.github/workflows/cd-restore-preprod.yml` | Restauration manuelle à la demande de la preprod (date ISO ou `latest`) |
