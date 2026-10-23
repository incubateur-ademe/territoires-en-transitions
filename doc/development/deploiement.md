# Déploiement groupé

Le workflow [cd.yml](../../.github/workflows/cd.yml) livre un commit sur `staging`,
`preprod` ou `prod`. Choisir la branche dans "Run workflow" ; `prod` exige `main`.
Les branches du dépôt utilisées hors prod doivent être revues et autorisées à
accéder aux secrets de l'environnement.

1. Le workflow exécute la CI du commit sélectionné, puis construit les images en
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

Le job protégé conserve le verrou pendant les migrations et tous les contrôles.
Les points d'entrée manuels par service sont remplacés par ce workflow. Les
aperçus existants restent accessibles via
[cd-preview-app.yml](../../.github/workflows/cd-preview-app.yml) et
[cd-preview-backend.yml](../../.github/workflows/cd-preview-backend.yml) ; ils ne
migrent pas la base partagée. Le workflow de destruction des aperçus est conservé.

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
[l'ADR 0016](../adr/0016-strategie-backup-database.md).

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

## Périmètre de cette étape

Cette étape implémente le déploiement progressif groupé de l'ADR de livraison
([PR #5171](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5171)).
Elle ne publie aucune release GitHub, ne calcule pas de SemVer et ne modifie pas les
Dockerfiles. La réutilisation d'images vérifie leur attestation sur la référence
immuable effectivement déployée.

La promotion d'une release qualifiée staging → prod, le rollback automatique
qualifié, le journal durable avec blocage après interruption, les sondes de
readiness des dépendances et les smoke tests métier complets restent des étapes
suivantes de l'ADR. Ce workflow conserve une reprise opérateur ; il n'implémente
ni une transaction distribuée ni une bascule simultanée. Les environnements fixes
`staging-test` / `preprod-test` restent également séparés de cet incrément.
