---
title: "infra: Migration de Supabase Cloud + Koyeb vers Scaleway + Coolify"
type: infra
status: brainstorm
date: 2026-05-15
---

# Migration de Supabase Cloud + Koyeb vers Scaleway + Coolify

## Overview

Migration complète de l'infrastructure de TET pour atteindre un hébergement souverain français :

- **Couche données** : Supabase Cloud → Scaleway Managed PostgreSQL + GoTrue self-hosté + Storage API self-hostée + Scaleway Object Storage + Scaleway Managed Redis
- **Couche applicative** : Koyeb (5 services) → instance Coolify auto-hébergée sur VM Scaleway
- **Infrastructure as Code** : l'ensemble des ressources Scaleway et le bootstrap de Coolify sont décrits en Terraform, dans le monorepo, et permettent un re-provisioning complet en < 1h
- **Auth** : bascule de Supabase Auth managé vers GoTrue self-hosté avec préservation du `JWT_SECRET`, des hashes bcrypt et du schéma `auth.*` — zéro reset de mot de passe, zéro déconnexion utilisateur

La bascule se fait en une fenêtre de maintenance planifiée (option A), pas en shadow mode.

---

## Problem Frame

L'objectif primaire est la **souveraineté** de l'hébergement : ramener l'ensemble des composants chez un fournisseur de cloud français (Scaleway, zone PAR). Cela répond à des attentes structurelles du contexte TET (ADEME, beta.gouv.fr, collectivités publiques) sans être déclenché par une exigence réglementaire datée à ce jour.

Cette migration porte également une réduction de la dépendance à des produits managés tiers (Supabase Cloud, Koyeb), au profit de briques open source que l'équipe contrôle directement (GoTrue, Storage API, Postgres, Redis, Coolify). Le compromis assumé est un transfert de responsabilité opérationnelle vers l'équipe — patching OS, supervision, sauvegardes — en échange d'un alignement avec la mission produit et d'un coût d'infrastructure significativement réduit.

### Pourquoi Coolify plutôt que Kapsule

Kapsule (Kubernetes managé) a été écarté au profit de **Coolify sur VM Scaleway** pour les raisons suivantes, propres à TET :

- **Charge faible et prévisible** : pas de pics, l'auto-scaling horizontal n'est pas un pré-requis
- **SLA cible < 99.95%** : un mono-VM Coolify avec procédure de restauration documentée suffit, la HA stricte n'est pas requise
- **Équipe restreinte** : Coolify est transmissible (Docker + UI), Kubernetes ne l'est pas sans investissement long
- **Coût** : 1 VM PRO2-S vs cluster 3 nœuds Kapsule, ratio 5-10× plus bas
- **Narratif souveraineté** : un système opéré directement par l'équipe est cohérent avec la motivation initiale, là où un produit managé ajouterait une couche de dépendance

### Pourquoi GoTrue self-hosté

GoTrue (renommé `supabase/auth`) est l'image Docker open source identique à celle utilisée par Supabase Cloud. Le self-hosting permet :

- Restauration **bit-à-bit** du schéma `auth.*` (users, identities, sessions, refresh_tokens) → toutes les FK existantes (`private_utilisateur_droit.user_id` et autres) restent intactes
- Préservation du **JWT_SECRET** → les tokens existants restent valides, aucune déconnexion utilisateur
- Préservation des **hashes bcrypt** → aucun reset de mot de passe forcé
- Réutilisation des **templates email** existants (`supabase/templates/*.html`) via les variables `GOTRUE_MAILER_TEMPLATES_*`
- Aucune migration OAuth à effectuer (la config TET n'utilise que magic link + password, aucun provider externe)

---

## Requirements Trace

### Infrastructure cible

- R1. L'ensemble des ressources Scaleway est défini en **Terraform**, dans un dossier `infra/` à la racine du monorepo, organisé par environnement (`infra/preprod/`, `infra/staging/`, `infra/prod/`).
- R2. Le **state Terraform** est distant, stocké dans un bucket Scaleway Object Storage dédié, avec verrouillage. Le state n'est jamais en local.
- R3. L'**authentification CI vers Scaleway** se fait via OIDC GitHub → IAM Scaleway. Aucune clé `SCW_ACCESS_KEY` longue durée n'est stockée dans les secrets GitHub.
- R4. Les **secrets applicatifs** (JWT_SECRET, SMTP, BREVO_API_KEY, etc.) sont stockés dans Scaleway Secret Manager et référencés par data sources Terraform. Ils ne figurent jamais en clair dans le repo ni dans le state.
- R5. Un **workflow CI dédié** (`ci-infra.yml`) déclenche `terraform plan` automatiquement sur PR (avec commentaire de plan), et `terraform apply` uniquement sur `main` avec approbation manuelle via GitHub Environments.
- R6. Le dossier `infra/` est protégé par **CODEOWNERS** : seules les personnes habilitées peuvent merger.
- R7. Le **lockfile** `.terraform.lock.hcl` est versionné. `terraform fmt` et `tflint` tournent en CI.

### Plateforme applicative

- R8. Une **VM Scaleway** (gamme PRO2 ou DEV3, taille à dimensionner sur preprod) héberge **Coolify**, exposée derrière Traefik (intégré à Coolify) avec certificats Let's Encrypt automatiques.
- R9. Le **dashboard Coolify** n'est jamais exposé en clair sur internet : accès via VPN (Tailscale ou Scaleway VPC bastion), MFA activé, IP allowlist côté Scaleway Security Group.
- R10. Le **bootstrap de Coolify** sur la VM (installation, configuration initiale, hardening OS) est automatisé via cloud-init ou Ansible, déclenché par Terraform. Idempotent et versionné dans le repo.
- R11. Chaque service applicatif (`app`, `auth`, `backend`, `site`, `panier`) est déployé dans Coolify à partir des **images Docker existantes** produites par Earthly et poussées sur GHCR. La chaîne de build Earthly n'est pas modifiée.
- R12. La **CD** existante (`cd-app.yml`, `cd-backend.yml`, etc.) est adaptée : l'étape `koyeb services update` est remplacée par un appel à l'API Coolify (webhook ou API REST) qui redéploie le service ciblé.

### Services managés Scaleway

- R13. La **base de données PostgreSQL** est hébergée sur **Scaleway Managed Database for PostgreSQL** en version 15, avec snapshots automatiques et Point-In-Time Recovery activés. Conformément à la version locale (`supabase/config.toml`, `major_version = 15`).
- R14. La **file Redis** est hébergée sur **Scaleway Managed Database for Redis**, remplaçant l'instance Redis externe actuelle (`QUEUE_REDIS_HOST_*`).
- R15. Le **stockage objet** est hébergé sur **Scaleway Object Storage** (compatible S3), avec un bucket dédié par environnement. Les buckets par collectivité existants restent une convention applicative (clés/prefixes), pas des buckets S3 distincts.

### Auth (GoTrue self-hosté)

- R16. **GoTrue self-hosté** tourne en conteneur Docker sous Coolify, image officielle `supabase/auth` à une **version compatible** avec le schéma `auth.*` actuel de Supabase Cloud (version à figer après audit de `auth.schema_migrations`).
- R17. Le `JWT_SECRET` actuel de Supabase Cloud est **conservé tel quel** et injecté dans GoTrue self-hosté. Tous les tokens et refresh tokens existants restent valides.
- R18. Le schéma `auth.*` est **dumpé puis restauré intégralement** dans la nouvelle base Scaleway (tables `users`, `identities`, `sessions`, `refresh_tokens`, `mfa_factors`, et toutes les tables système GoTrue). Aucune transformation, aucun re-hash de mot de passe.
- R19. Les **templates email** sont injectés dans GoTrue via `GOTRUE_MAILER_TEMPLATES_*` à partir des fichiers `supabase/templates/*.html`. Le SMTP utilisé est Brevo (déjà en place pour TET).
- R20. GoTrue est exposé sur un **sous-domaine dédié** (ex. `auth-api.tet.example.fr`), distinct du sous-domaine actuel de `apps/auth` (UI de login). Cette séparation isole le blast radius et facilite le rollback.
- R21. Le client `@supabase/supabase-js` côté frontend est repointé via la configuration `supabaseUrl` vers le nouvel endpoint, sans changement de code applicatif autre que la valeur de variable d'environnement.

### Storage

- R22. **Storage API self-hostée** (image `supabase/storage-api`) tourne en conteneur Coolify, configurée pour pointer vers Scaleway Object Storage en backend S3. Cela permet de conserver l'API existante (`supabase.storage.from(bucket).download/upload`) inchangée côté code applicatif.
- R23. La **migration des objets** de Supabase Storage vers Scaleway Object Storage se fait via `rclone` ou équivalent, en mode synchronisation différentielle, avec une fenêtre finale courte pour rattraper le delta.
- R24. Storage API est exposée sur un **sous-domaine dédié** (ex. `storage-api.tet.example.fr`), suivant le même pattern que GoTrue.

### Domaines et DNS

- R25. **Tous les services exposés** ont un sous-domaine dédié, géré en Terraform via le provider DNS (Scaleway DNS ou registrar tiers). Pas de reverse proxy unique avec routing par path.
- R26. Les **certificats TLS** sont émis automatiquement par Let's Encrypt via Traefik (intégré à Coolify). Pas de gestion manuelle de certificats.

---

## Pré-requis bloquants

Avant tout démarrage de la migration infra, deux chantiers applicatifs doivent être terminés. Ces deux chantiers sont déjà en cours, indépendamment de cette migration.

### P1. Fin de la migration PostgREST → tRPC

L'usage de `supabase.from(...)` (PostgREST direct depuis le frontend) doit être entièrement remplacé par des appels tRPC vers le backend NestJS. Conséquence pour la migration infra : la **RLS Postgres n'a plus besoin d'être préservée** dans son fonctionnement actuel (basé sur `auth.uid()` / `auth.jwt()` alimentés par PostgREST), ce qui simplifie radicalement la bascule DB.

Sans P1 fini, il faudrait soit self-hoster PostgREST en plus de GoTrue, soit refactoriser toutes les RLS — deux complications majeures.

### P2. Portage des Edge Functions Supabase vers le backend NestJS

Les 9 Edge Functions Deno actuelles (`crm_sync`, `export_indicateur`, `import_indicateur_emt`, `import_statut_emt`, `send_user_pai_to_brevo`, `send_users_to_brevo`, `site_send_message`, `get_panier_data_from_directus`, plus `_shared/`) doivent être ré-implémentées en TypeScript dans `apps/backend` (NestJS).

Sans P2 fini, il faudrait soit déployer un runtime Deno dans Coolify, soit garder un pont vers Supabase Cloud spécifiquement pour ces fonctions — l'un comme l'autre annule le bénéfice de souveraineté.

### P3. Suppression de l'usage de `pg_net` dans le schéma DB

Audit réalisé : **`pg_net` est utilisé dans une vingtaine de fichiers SQL** sous `data_layer/sqitch/deploy/` pour faire des appels HTTP synchrones et asynchrones depuis Postgres. Cette extension est propriétaire Supabase et n'est pas disponible sur Scaleway Managed PostgreSQL. Les usages identifiés :

- `automatisation/crm*.sql` — synchronisation CRM via webhook
- `automatisation/newsletters*.sql` et `newsletters_pai.sql` — déclenchement d'envois d'email
- `labellisation/audit*.sql`, `comparaison_audit*.sql` — appels à `personnalisation_endpoint`
- `referentiel/verification_score.sql`, `score_snapshot*.sql` — appels au score service
- `evaluation/score_service*.sql` — idem

Stratégie de remplacement (à élaborer dans le plan d'implémentation, mais à terminer **avant** la bascule infra) :

1. **Déplacer les appels HTTP côté backend NestJS** : chaque mutation qui modifiait la DB et déclenchait `net.http_*` est ré-organisée pour que le backend fasse à la fois l'écriture DB et l'appel HTTP. Privilégier ce chemin pour les cas applicatifs (CRM, newsletters, score service).
2. **`pg_notify` + worker NestJS qui écoute via `LISTEN`** : pour les cas où le trigger DB doit rester maître (cohérence transactionnelle), Postgres notifie sur changement, le backend écoute et fait l'appel HTTP. Bonne option pour les triggers d'audit.
3. **`pg_cron` + cron applicatif** : pour les cas planifiés (`verification_scores`, etc.), remplacer `net.http_*` par un cron applicatif côté backend. `pg_cron` reste utile pour les tâches purement SQL (rafraîchissement de vues matérialisées notamment).

Les extensions `pg_jsonschema` et `http` sont également créées dans le schéma mais sans usage trouvé — à droper sans risque dans le même chantier.

Ce chantier est cohérent avec P2 (portage Edge Functions) et peut être conduit en parallèle ; il appartient logiquement à la même équipe.

---

## Stratégie de bascule

### Approche retenue : maintenance window planifiée

Une **fenêtre de maintenance unique** (typiquement un week-end), pendant laquelle l'application est en lecture seule ou totalement inaccessible. RTO cible : **2-4 heures** pour TET (taille DB modeste, charge faible).

L'option shadow mode (réplication logique parallèle, bascule progressive) a été évaluée et écartée : complexité opérationnelle disproportionnée par rapport au coût d'une fenêtre de maintenance acceptée par les utilisateurs.

### Séquence de bascule

0. **J-15 (admin Scaleway, à faire une seule fois par projet)** : ouvrir un ticket support Scaleway pour débloquer le SMTP sortant sur le projet hébergeant la VM Coolify (ports 25/465/587). Sans ce déblocage, seul le port 2525 est utilisable côté Brevo (voir Risques opérationnels). Le ticket est indépendant de la fenêtre de bascule mais doit être résolu avant la prod.
1. **J-7** : annonce maintenance aux collectivités utilisatrices, bannière in-app
2. **J-3** : `terraform apply` complet sur l'environnement cible (VM Coolify, RDB, Redis, Object Storage, DNS pré-créés mais non basculés)
3. **J-3** : bootstrap Coolify + déploiement de tous les conteneurs (app, auth, backend, site, panier, GoTrue, Storage API) pointant vers une copie de la DB de preprod pour smoke test
4. **J-1** : pré-synchronisation des objets Supabase Storage → Scaleway Object Storage via `rclone` (gros du volume)
5. **J-0 H+0** : début maintenance, application en lecture seule
6. **J-0 H+0:15** : dump final de Supabase Cloud (DB complète, tous schémas dont `auth`)
7. **J-0 H+0:45** : restore vers Scaleway RDB + sync différentiel storage
8. **J-0 H+1:15** : démarrage des services pointant vers la nouvelle infra
9. **J-0 H+1:30** : bascule DNS (TTL bas pré-configuré 24h avant)
10. **J-0 H+1:45** : smoke tests bout-en-bout : login OTP, login password, signup, reset password, magic link, refresh token, upload preuve, export indicateur
11. **J-0 H+2:30** : réouverture
12. **J+1 à J+7** : monitoring renforcé, Supabase Cloud reste actif en read-only pour fallback d'urgence
13. **J+14** : décommissionnement Supabase Cloud + Koyeb après validation

### Plan de rollback

À chaque étape, le rollback consiste à :
- Repointer le DNS vers les anciens endpoints Koyeb/Supabase (TTL bas)
- Restaurer les variables d'environnement applicatives vers les valeurs Supabase Cloud
- Documenter dans le journal d'incident

Le rollback reste possible **tant que Supabase Cloud n'est pas décommissionné** (J+14 minimum).

### Test exhaustif en preprod

L'intégralité de la séquence est exécutée d'abord en preprod, avec :
- Tests e2e Playwright complets contre la nouvelle infra
- Validation que les sessions et refresh tokens existants restent valides
- Mesure du RTO réel
- Test du rollback de bout en bout

Aucun apply en production sans une exécution preprod réussie et reproductible.

---

## Scope Boundaries

### Inclus dans cette migration

- Bascule du data layer (DB, auth, storage, redis) de Supabase Cloud / hébergeurs actuels vers Scaleway
- Bascule de la couche applicative de Koyeb vers Coolify sur Scaleway
- Infrastructure as Code Terraform pour l'ensemble des ressources Scaleway et le bootstrap Coolify
- Adaptation des workflows CD existants pour cibler Coolify
- Procédure de restauration complète testée et documentée

### Non inclus

- **Refonte de la stack applicative** : aucun changement de code applicatif autre que les valeurs d'env vars (`SUPABASE_URL`, `SUPABASE_DATABASE_URL`, etc.)
- **Migration des données Strapi** (CMS du site public) : le périmètre actuel de Strapi est hors scope, à traiter séparément si applicable
- **Migration de tooling** Cypress/Playwright/Bryntum : aucun changement, ces outils continuent d'utiliser leurs services tiers actuels
- **Refonte de la RLS** : la RLS reste en place dans le schéma DB, mais sa fonctionnalité via `auth.uid()` ne sera plus exploitée applicativement (P1 acquis)
- **Certification HDS ou SecNumCloud** : Scaleway est qualifié HDS sur certaines briques, SecNumCloud en cours ; aucune démarche de certification n'est entreprise dans cette migration. À traiter séparément si un financeur l'exige.
- **Migration des Edge Functions Deno** : traitée par P2 en pré-requis, hors scope de la migration infra elle-même
- **Migration de PostgREST** : traitée par P1 en pré-requis, hors scope

### Reporté à une itération ultérieure

- **HA Coolify multi-nœuds (Swarm mode)** : si le SLA cible évolue au-delà de 99.95%, on passera à une topologie Swarm ou Kapsule à ce moment-là. Pas avant.
- **Provider Terraform Coolify** : le bootstrap de la config interne de Coolify (services, env vars) reste manuel ou via webhook au démarrage. La gestion en Terraform via un provider Coolify communautaire est différée jusqu'à maturité du provider.
- **WAF/rate-limiting avancé sur les endpoints auth** : Traefik fournit du basique ; une politique fine (rate-limit par IP, fail2ban, etc.) est différée à un second temps si nécessaire.

---

## Architecture cible (vue d'ensemble)

```
                        Internet
                            │
                ┌───────────┼───────────────────────────┐
                │           │                           │
       DNS Scaleway (Terraform)                  Scaleway Object Storage
       │ app.tet.fr                              (S3 backend pour Storage API)
       │ auth.tet.fr           (Frontend UI)
       │ auth-api.tet.fr       (GoTrue API)
       │ storage-api.tet.fr    (Storage API)
       │ backend.tet.fr        (NestJS tRPC)
       │ panier.tet.fr
       │ site.tet.fr
                            │
                    ┌───────┴────────┐
                    │  VM Scaleway   │
                    │   + Coolify    │
                    │   + Traefik    │
                    └───────┬────────┘
                            │
              Docker containers gérés par Coolify :
              ├── apps/app        (Next.js)
              ├── apps/auth       (Next.js, UI login)
              ├── apps/backend    (NestJS tRPC)
              ├── apps/site       (Next.js)
              ├── apps/panier     (Next.js)
              ├── gotrue          (supabase/auth)
              └── storage-api     (supabase/storage-api)
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        Scaleway       Scaleway       Scaleway
        Managed PG     Managed        Object
        (PG 15)        Redis          Storage
```

---

## Risques et points d'attention

### Risques techniques

- **Extensions Postgres Supabase-spécifiques** : audit réalisé (cf. P3). Extensions utilisées par TET et leur disponibilité Scaleway PG 15 : `pg_net` ❌ (à supprimer via P3), `pg_jsonschema` ❌ (créée mais non utilisée → drop), `http` ❌ (créée mais non utilisée → drop), `pg_cron` ✅ supporté, `btree_gin`/`btree_gist`/`pg_trgm`/`unaccent`/`moddatetime` ✅ contrib standard. À reconfirmer sur la version exacte de Scaleway PG 15 au moment du provisioning.
- **Version GoTrue compatible** : la version self-hostée doit accepter le schéma `auth.*` produit par Supabase Cloud. Lire `auth.schema_migrations` avant la migration et figer la version Docker en conséquence. Tester en preprod la lecture des tables existantes par GoTrue self-hosté.
- **Délai de propagation DNS** : prévoir un abaissement de TTL 24-48h avant la bascule pour limiter le délai effectif de switch utilisateur.
- **Perte du dashboard Coolify** : si la VM Coolify devient inaccessible (mauvais déploiement, corruption), il faut pouvoir reconstruire rapidement. Procédure documentée et testée : `terraform apply` + bootstrap + restore Coolify config depuis backup.

### Risques opérationnels

- **Transfert de responsabilité ops** : patching OS, supervision, gestion des certificats, sauvegardes Coolify, sauvegardes data devient l'affaire de l'équipe. Documentation runbook obligatoire avant la bascule prod.
- **Backup de la config Coolify** : la base interne de Coolify contient la définition de tous les services, env vars, secrets. Doit être backupée séparément des données applicatives. Restauration testée.
- **Dépendance à Brevo pour SMTP** : déjà le cas aujourd'hui, mais devient critique chemin pour les emails de magic link. Tester en preprod.
- **Blocage SMTP sortant par Scaleway** : Scaleway bloque par défaut les ports SMTP sortants (25, 465, 587) sur ses Instances pour lutter contre les abus de spam. Constaté en preprod : depuis la VM Coolify, `nc -vz smtp-relay.brevo.com 587` timeout, `nc -vz smtp-relay.brevo.com 2525` répond. Deux conséquences :
  - **Workaround immédiat** : configurer tous les clients SMTP (Coolify notifications, GoTrue `GOTRUE_SMTP_PORT`, et tout autre conteneur émetteur d'email) sur `smtp-relay.brevo.com:2525` en STARTTLS. Brevo expose le même relais sur ce port non bloqué.
  - **Fix propre** : ouvrir un ticket support Scaleway pour débloquer le SMTP sortant (cas d'usage : envoi transactionnel via Brevo, domaine vérifié SPF/DKIM). Délai typique 24-72h. À faire en amont de la mise en place de l'auth en preprod pour éviter de retomber sur le sujet en prod.

### Risques de timing

- **Coordination avec les pré-requis P1 et P2** : la migration infra ne peut pas démarrer tant que ces chantiers ne sont pas finis. Définir des jalons clairs et une date de "go/no-go" infra.

---

## Open Questions (à résoudre avant le plan d'implémentation)

1. **Périmètre exact des Edge Functions à porter (P2)** : lister fonction par fonction, estimer effort, prioriser. Certaines peuvent-elles être supprimées au lieu d'être portées ?
2. **Audit des extensions Postgres** : ✅ Fait, intégré dans P3 et la section Risques.
3. **Dimensionnement de la VM Coolify** : tester en preprod différentes tailles (DEV3-L, PRO2-S, PRO2-M) pour identifier le sweet spot CPU/RAM pour 9 conteneurs + Traefik.
4. **Choix du registrar DNS** : conserver le registrar actuel et déléguer les sous-domaines à Scaleway DNS, ou tout migrer vers Scaleway ?
5. **VPN/Bastion pour accès Coolify** : Tailscale (SaaS US, attention à la cohérence du narratif souveraineté), bastion SSH self-hosté, ou Scaleway VPC + IAM ?
6. **Backups Coolify** : où sont-ils stockés ? Object Storage Scaleway avec versioning, ou bucket externe pour résilience ?
7. **Décision sur le décommissionnement Supabase Cloud** : J+14 ou plus long ? Coût du double-run pendant la période de garde.
8. **Communication ADEME/beta.gouv** : faut-il pré-notifier les financeurs de la migration ? Y a-t-il une attente d'attestation de souveraineté à produire après bascule ?

---

## Next Steps

1. **Lever les 8 open questions** ci-dessus, en particulier le périmètre P2 et l'audit des extensions Postgres
2. **Avancer les pré-requis P1 et P2** en parallèle, indépendamment de cette migration
3. Une fois P1 et P2 quasi-finalisés, **rédiger un plan d'implémentation détaillé** dérivé de ce document de brainstorm, avec :
   - Découpage en unités d'implémentation (`U1`, `U2`, …)
   - Modules Terraform spécifiques
   - Scripts de bascule (`migrate-auth.sh`, `migrate-storage.sh`, etc.)
   - Plan de test preprod détaillé
   - Runbook de bascule prod minute par minute
   - Runbook de rollback
4. **Exécution preprod** avant tout démarrage prod, avec un dry-run complet de la séquence de bascule
