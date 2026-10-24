# Déploiement groupé

Le workflow [cd.yml](../.github/workflows/cd.yml) livre un commit sur `staging`,
`preprod` ou `prod`. Choisir la branche dans
"Run workflow" ; `prod` exige `main`.
Les branches du dépôt utilisées hors prod doivent être revues et autorisées à
accéder aux secrets de l'environnement.

Le point d'entrée appelle [\_cd-build.yml](../.github/workflows/_cd-build.yml)
puis [\_cd-deploy.yml](../.github/workflows/_cd-deploy.yml). Ce dernier appelle
[\_cd-check.yml](../.github/workflows/_cd-check.yml) avant de libérer le verrou
de maintenance.

1. Pour `prod` uniquement, le workflow exige une branche `main` et une CI réussie
   du commit sélectionné avant le build. Les deux autres cibles passent
   directement au build, sans relancer la CI. Les images sont construites en
   parallèle. Les tags restent les SHA courts existants ; le site conserve son
   tag `<environnement>-<SHA court>` et sa configuration de build.
2. Une fois toutes les images disponibles, le job de livraison prend le verrou
   `database-maintenance-<environnement>`, partagé avec les backups et restores.
   Les opérations en attente sont conservées avec `queue: max` et le run actif
   n'est pas annulé par une nouvelle demande.
3. Il contrôle les services existants et le registre Sqitch. En prod, il refuse
   une régression par rapport aux commits servis par l'app et le backend et exige
   un backup S3 de moins de 24 h.
4. Il exécute `sqitch check`, `sqitch deploy --mode change --verify`, puis
   `sqitch verify`, même sans nouveau SQL. Le plan et les images proviennent du
   même commit. Aucune mise à jour de service ne démarre si cette étape échoue.
5. Il déploie le backend par digest, attend ses instances et son `/version`, puis
   lance immédiatement l'app. Le délai partagé est mesuré du début de cette
   transition jusqu'à la readiness des deux services.
6. Après la mise en service du couple, il observe les deux services en parallèle
   pendant au moins 30 secondes, puis livre le site et enfin `tools`.
   `tools` est absent de preprod. Le workflow vérifie ensuite les URLs publiques
   des frontends avant de déclarer le succès.

Le workflow interne de déploiement conserve le verrou pendant les migrations,
les déploiements et le workflow de contrôle final. Les jobs accédant aux services
utilisent le GitHub Environment de la cible. Les builds sont hors de ce verrou.
Les trois cibles passent par ce point d'entrée.

## Images et cache de build

Pour `app`, `backend` et `tools`, une image déjà publiée pour le commit est
réutilisée si son attestation confirme le commit et le workflow de build attendus.
Sinon, elle est reconstruite. Cocher "Reconstruire les images même si ce commit
est déjà publié" (`force-rebuild`) pour forcer le build. Le site est toujours
reconstruit avec la configuration de la cible. Les déploiements utilisent les
références par digest.

Le cache BuildKit dans GHCR reste actif lors d'un build forcé. Il est partagé
entre branches et environnements, avec un scope par image ; les paramètres sont
définis dans l'action [docker/build-push](../.github/actions/docker/build-push/action.yml).
Les caches de travail Next.js et Nx restent locaux au builder et ne sont pas
exportés : pour un nouveau commit, le build Next.js reste à froid sur un runner
éphémère.

## Configuration de la cible

Les services Koyeb doivent déjà exister : `<env>-backend/backend`,
`<env>-app/front`, `<env>-site/front` et, hors preprod,
`<env>-tools-autom-api/tools`. Les références de secrets et les valeurs runtime
restent celles des workflows précédents. Les ports, ressources et checks de
santé existants sont conservés.

Configurer dans chaque GitHub Environment :

| Clé                                      | Type      | Valeur attendue                                                                                                                                                            |
| ---------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MIGRATION_DATABASE_URL`                 | Secret    | `postgresql://<rôle>:<mot-de-passe>@<hôte>:5432/postgres`, sans query string. Rôle de migration distinct du rôle applicatif ; connexion directe ou pooler en mode session. |
| `MIGRATION_DATABASE_HOST`                | Variable  | Hôte attendu pour cette base, contrôlé avant connexion.                                                                                                                    |
| `APP_BACKEND_TRANSITION_TIMEOUT_SECONDS` | Variable  | Délai de 10 à 1800 secondes, mesuré et validé sur staging avant d'être retenu en prod. Un dépassement arrête la suite.                                                     |
| `APP_URL`, `BACKEND_URL`, `SITE_URL`     | Variables | URLs HTTPS publiques de la cible, sans slash final.                                                                                                                        |

Les secrets Koyeb et de build existants restent nécessaires. En prod, les clés
`BACKUP_*` utilisées par le backup quotidien doivent être accessibles au job de
livraison pour lire les métadonnées des objets S3. La présence d'une archive
récente ne remplace pas les exercices de restauration de
[l'ADR 0016](./adr/0016-strategie-backup-database.md).

La connexion PostgreSQL impose TLS `verify-full` avec les autorités du système.
Le runner doit pouvoir joindre cette base et le rôle doit pouvoir exécuter le
plan Sqitch et lire son registre. Les verrous SQL attendent au maximum 10 secondes,
une instruction SQL 10 minutes et l'étape de migration 20 minutes. Les migrations
restent compatibles avec la version applicative déjà active (expand/contract).

Configurer la protection de `prod` sur `main` et les reviewers nécessaires.
Les jobs de build utilisent encore les environments actuels pour leurs secrets ;
les séparer des credentials de livraison appartient à la future chaîne de release.
Ne pas effectuer de mutation Koyeb manuelle pendant un run.

`tools` conserve une seule région et une seule instance, vérifiées avant Sqitch.
Sa mise à jour utilise la stratégie Koyeb `immediate` pour arrêter le déploiement
précédent avant le suivant : une interruption temporaire est attendue. Ce choix
évite le chevauchement des handlers Crisp dont la déduplication est locale au
processus ; vérifier la stratégie et la reprise des webhooks sur staging.

## Échec et reprise

Les appels fournisseur et les attentes ont une échéance. L'adaptateur exige que
le déploiement attendu soit actif et sain, utilise la référence d'image par digest
et ne laisse aucune ancienne instance vivante. Pour l'app et le backend, il vérifie
aussi le SHA court servi par `/version`. Un ancien HTTP 200 ne suffit pas.

Un échec arrête la suite et conserve le run en échec. Le résumé contient les images,
les opérations Koyeb et la durée de transition réussie ; les logs Sqitch montrent
l'état atteint. Une réponse perdue ou un timeout ne prouve pas l'arrêt de
l'opération distante. Ne pas relancer le run ni une restauration avant d'avoir
inspecté les services, les opérations en cours et le schéma.

Après un échec de migration, les changements déjà réussis restent appliqués.
Avec `--mode change`, Sqitch peut annuler le changement dont le verify échoue,
mais le workflow ne lance aucun `sqitch revert` global ni restore de données.
Corriger l'état partiel si nécessaire, puis relancer la livraison complète.
Les contrôles refusent un service non sain ou dont le dernier déploiement n'est
pas le déploiement actif. Une reprise applicative manuelle exige de vérifier la
compatibilité avec le schéma atteint ; aucune compatibilité de rollback n'est
présumée.
