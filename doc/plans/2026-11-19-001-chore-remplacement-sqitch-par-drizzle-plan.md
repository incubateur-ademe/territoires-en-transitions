# Remplacer sqitch par les migrations Drizzle (rc6) — analyse d'impact

## Contexte

Objectif : se débarrasser de sqitch et utiliser le nouveau système de migration de Drizzle 1.0.
Analyse faite sur trois sources : le repo, la base locale migrée par sqitch (lecture seule), et le
code de la branche `rc6` de drizzle-orm (clonée et lue, rien exécuté ; commit du 2026-11-19, les
`package.json` indiquent encore `1.0.0-rc.5`).

## Conclusion en une phrase

Drizzle peut remplacer sqitch comme **exécuteur de fichiers SQL** à coût modéré, mais pas comme
**générateur de migrations** : son moteur de diff ne couvre qu'environ la moitié de ce que font nos
migrations, et nos déclarations `*.table.ts` ne sont pas assez fidèles à la base pour servir de
source de vérité aujourd'hui.

## Ce que rc6 fait et ne fait pas

| Sujet | Comportement rc6 | Conséquence pour nous |
|---|---|---|
| Format | Un dossier `<YYYYMMDDHHmmss>_<nom>/` avec `migration.sql` + `snapshot.json`, plus de journal | Fin des conflits de merge sur `sqitch.plan` (199 commits sur ce fichier en 2026) |
| Suivi | Table `drizzle.__drizzle_migrations`, différence d'ensembles sur le nom du dossier | Les migrations hors ordre s'appliquent ; pas de dépendances à déclarer |
| Objets gérés par le diff | Tables, colonnes, contraintes, index, enums, séquences, schémas, vues, vues matérialisées, policies RLS, rôles | — |
| Objets non gérés | Fonctions, triggers, grants, extensions, domaines, commentaires, pg_cron, héritage de tables | Restent en SQL écrit à la main (`generate --custom`) |
| Rollback | Aucun (`down`/`revert` n'existe pas) | Perte des 750 scripts `revert` ; ils ne servent qu'en CI, jamais en procédure de prod |
| Vérification | Aucun équivalent de `sqitch verify` | Perte des 748 scripts `verify` (dont ~130 vides) ; à remplacer par du pgTAP là où ça compte |
| Transaction | Toutes les migrations en attente dans **une seule** transaction, sans dérogation | `create index concurrently` impossible (5 changements sqitch l'utilisent) ; verrous plus longs si plusieurs migrations en attente |
| Intégrité | Hash stocké mais jamais comparé | Un fichier déjà appliqué puis modifié est ignoré sans alerte |
| Concurrence | Aucun verrou consultatif | Sans effet tant que le déploiement reste manuel |
| Conflits de branches | Détectés sur les snapshots ; `generate --fix-conflicts` supprime les migrations en conflit | Le SQL écrit à la main n'a pas de delta : deux branches qui modifient la même fonction ne sont pas détectées |
| Reprise d'une base existante | `drizzle-kit pull --init` écrit une migration de référence et la marque appliquée | Ne contient que les objets gérés : inutilisable seule pour reconstruire une base de test (voir étape 3) |

## Ce que l'on perd de sqitch, au-delà de revert/verify

- **Le rework** : 91 changements retravaillés (`plan_action/fiches` ×35). Aujourd'hui une fonction ou
  une vue évolue dans le même fichier, donc le diff git est lisible. Avec Drizzle, chaque évolution
  est un nouveau fichier contenant le `create or replace` complet. C'est la perte la plus sensible
  au quotidien, vu les 180 fonctions et 116 vues.
- **Les inclusions psql `\ir`** : 3 migrations et 7 tests pgTAP incluent des fichiers. Le migrateur
  Drizzle découpe le fichier sur `--> statement-breakpoint` et n'interprète pas psql.

## État du schéma Drizzle (pourquoi le mode « diff » n'est pas prêt)

- 181 des 260 tables applicatives sont déclarées ; 79 manquent.
- Sur 10 tables comparées à la base, 8 ont des écarts (nullabilité, défauts, enums déclarés en
  `varchar`, FK/checks/index manquants). En base : 361 FK, 97 checks, 114 index ; dans Drizzle :
  ~267, 21, 58.
- Non exprimable : 9 tables en `INHERITS public.abstract_modified_at`, 7 domaines utilisés par 59
  colonnes.
- Pièges : `personnalisation` encore déclarée alors que supprimée en base ; `_baseFields` fausse
  table ; `auth.users` et `storage.objects` sans `.existing()` ; builder `actionIdVarchar` partagé
  et muté par 13 tables.
- ~300 policies RLS en base contre 4 dans Drizzle ; 116 vues contre 3 (toutes `.existing()`).

Un premier `drizzle-kit generate` produirait donc un diff massif et en partie faux.

## Ce qu'il faut recâbler dans le repo

Le chemin de déploiement est petit : sqitch n'est joué automatiquement qu'en local et en CI.
En preprod/staging/prod, `sqitch deploy` est lancé à la main (`scripts/deploy.mts:369-379` se
contente d'avertir).

- `Makefile:261` (`db-migrate`), service `sqitch` de `docker-compose.yml:316-331`
- `.github/actions/database/sqitch*` (image Perl à supprimer), `_prepare-test-db.yml:90-104`,
  `_ci-test-db.yml` (le test revert/deploy/verify disparaît), `compute-affected-scope`
- `scripts/deploy.mts`, `scripts/up.mts`, `scripts/tui/*`
- **Restauration prod → staging/preprod** : `data_layer/backup/check-restore-compatibility.sh:31-75`
  compare `sqitch.changes` entre sauvegarde et cible. À réécrire sur `drizzle.__drizzle_migrations`.
  C'est le couplage le plus critique : il conditionne la restauration quotidienne.
- **Vue `stats.release_version`** : lit `sqitch.events`, utilisée par deux vues de stats
  (`collectivite/fusion.sql:1759`, `utilisateur/remove_timescale.sql:382`). À réécrire avant de
  supprimer le schéma `sqitch`.
- Tests pgTAP qui incluent des fichiers sqitch ; seeds joués deux fois via `\ir`
  (`seed/imports/09`, `10`, `11`).
- Docs : `AGENTS.md`, `README.md`, `data_layer/README.md`, nouvel ADR.

## Prérequis : monter drizzle-orm de 0.45.2 à 1.0

Le nouveau migrateur n'existe qu'en 1.0, et toutes les dépendances sont à la racine : changer
d'outil de migration impose donc de monter l'ORM du backend.

- Coût d'API faible : aucune `relations()` v1, pas de `drizzle-zod`, 2 tables sur la forme dépréciée
  de `pgTable`.
- Risque réel : rc5/rc6 changent le décodage côté driver (codecs supprimés, parsers par requête).
  Cela touche tout le backend à l'exécution, pas seulement les migrations.
- Node 24 satisfait le minimum requis.

## Trajectoire recommandée

1. **Attendre la 1.0 finale**, puis monter l'ORM dans un PR dédié, validé par la suite de tests
   backend. Ne pas faire dépendre les migrations de prod d'une RC.
2. **Prototype local** (une demi-journée, sans toucher aux environnements partagés) :
   - migration de référence = `pg_dump --schema-only` des schémas applicatifs **plus** les données
     insérées par les migrations (144 `insert` dans 63 fichiers : à inventorier, c'est le point le
     plus risqué du chantier) ;
   - la rejouer sur une base vide avec `migrate()` de `drizzle-orm/node-postgres/migrator` et
     vérifier qu'un corps plpgsql en `$$` multi-instructions passe ;
   - comparer le résultat à une base migrée par sqitch (`pg_dump` des deux, diff).
3. **Bascule en mode exécuteur** : migrations SQL écrites à la main dans des dossiers horodatés,
   `*.table.ts` maintenus à la main comme aujourd'hui. Sur prod/preprod/staging, insérer la ligne de
   référence dans `drizzle.__drizzle_migrations` sans rien exécuter. Recâbler les points listés
   plus haut, en commençant par le contrôle de restauration.
   Effet de bord positif : l'historique de 2,7 Mo disparaît, et avec lui la vingtaine de migrations
   dépendantes de `pg_net`/`http` qui empêchent de rejouer l'historique sur Scaleway.
4. **Mode diff, plus tard et seulement si le besoin se confirme** : aligner les `*.table.ts` sur la
   base domaine par domaine, puis laisser `generate` produire le DDL des tables. Non chiffré ici ;
   c'est le gros du coût (79 tables, écarts sur la majorité des autres, héritage et domaines sans
   solution).

Les `index concurrently` futurs devront être joués hors migration (script à la main).

## Points non vérifiés

- Le comportement réel du migrateur n'a pas été exécuté : tout vient de la lecture du code rc6.
- Passage du mode exécuteur au mode diff : il faut un `snapshot.json` conforme à la base. Faisable
  a priori via `pull`, à prototyper.
- Les credentials utilisés pour le `sqitch deploy` manuel en prod ne sont pas documentés dans le
  repo.
- La base locale comparée avait ~14 changements de retard sur HEAD.

## Vérification (pour l'étape 2, seule étape exécutable maintenant)

- `make db-init` sur une base locale, `pg_dump --schema-only` → référence A.
- Base vide + migration de référence via `migrate()` → `pg_dump --schema-only` → B.
- `diff A B` vide (hors schémas `sqitch`/`drizzle`), comptage des lignes des tables de référence
  identique, puis `nx test backend` et `data_layer/scripts/run_tests.sh` sur B.
