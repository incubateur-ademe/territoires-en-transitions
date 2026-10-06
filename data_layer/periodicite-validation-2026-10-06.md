# Validation du découpage de #5214 — 6 octobre 2026

## Branches et périmètre

Base : `main` au commit `1be13a48b`. Source conservée :
`split/periodicite-data-migration` au commit `6a3d44176`.

1. `split/periodicite-backend-preparation` (`f81449e6b`) : 55 fichiers,
   refactors des définitions/liens/sources/catalogue et des autorisations,
   avec les contrats annuels historiques.
2. `split/periodicite-annual-cutover`, basée sur la préparation : reste de la
   bascule annuelle, applications et migrations dans la même maintenance.

L'activation #5215 reste séparée et devra être rebasée sur la seconde PR.
Le [guide de livraison](periodicite-releases.md) fixe l'ordre et les conditions
pour laisser chaque étape en production.

## Préparation backend

- Compilation du domaine historique et typecheck complet du backend : réussis.
- Lint des fichiers backend extraits : réussi.
- 80 tests unitaires dans 21 fichiers : réussis.
- 20 tests de liens fiches/pilotes/services/thématiques : réussis.
- 41 tests de définition et de stockage annuel via les routes tRPC : réussis.
  Les trois scénarios HTTP du fichier de périodicité sont exclus de cette relance.
- Le plan Sqitch, tous les scripts SQL, les tables Drizzle, les schémas du domaine,
  le service d'import des indicateurs, les écritures et les calculs de valeurs
  sont identiques à ceux de `main`.

Les tests de routes utilisent uniquement le PostgreSQL 15 local sur
`localhost:54322`. Inspection en lecture seule : aucune colonne `periodicite`
sur les définitions ou valeurs, aucun audit de normalisation ou table de
réconciliation, et les deux index historiques sont présents. Les anciennes dates
`2024-06-30` et `2024-12-31` sont conservées par le parcours lecture/écriture ;
la valeur `0` est préservée. Cette étape ne dépend donc pas des nouvelles migrations.

Les suites HTTP catalogue et valeurs, ainsi que trois cas HTTP de périodicité,
reçoivent `401` avec les jetons émis par le Supabase local, avant les assertions
métier. Ces scénarios ne sont pas validés. Une assertion de test qui attendait une
colonne stockée de périodicité a été déplacée dans la seconde PR, avec la table
Drizzle correspondante.

Commande de vérification des routes de la première branche, depuis `apps/backend` :

```sh
pnpm exec vitest run --project shared-app --maxWorkers=2 \
  src/indicateurs/definitions/mutate-definition/update-definition.router.e2e-spec.ts \
  src/indicateurs/definitions/indicateur-periodicite.router.e2e-spec.ts \
  --testNamePattern '^(?!.*HTTP).*'
```

## Bascule annuelle

- Compilation du domaine final et typecheck complet du backend : réussis.
- 348 tests backend dans 57 fichiers : réussis.
- Deux autres fichiers de trajectoires (`trajectoires.controller.spec.ts` et
  `trajectoires.router.spec.ts`) nécessitent une base migrée : ils échouent au
  setup sur la colonne `periodicite` absente. Leurs dix scénarios ne sont pas validés.
- 60 tests du domaine (périodes, adaptateur annuel, PCAET, score) : réussis.
- 10 tests des tâches cron et de la réconciliation dans `tools` : réussis.
- 9 tests de validation des URL de bases : réussis.
- Tests shell de compatibilité de restauration et de gestion de base jetable : réussis.
- Vérification des espaces et marqueurs de conflit : réussie.

La comparaison du résultat combiné avec `6a3d44176` conserve tout le code métier
et toutes les migrations. Les seules différences sont les documents de livraison
et une mise en forme du repository des liens fiches.

## Limites avant production

Aucune migration n'a été appliquée à la base locale partagée et aucune connexion
à la production n'a été utilisée. Le cycle SQL complet deploy/verify/revert, les
routes sur le schéma final et une répétition avec les deux versions applicatives
restent à exécuter sur des bases jetables. Les clients `psql`/`pg_dump` et un daemon
Docker ne sont pas accessibles dans cet environnement pour préparer ce clone.

Avant la seconde mise en production, exécuter les contrôles de dates/collisions,
mesurer les verrous et la durée de migration sur une copie récente et valider la
reprise selon le [runbook](periodicite-runbook.md). Les tests ci-dessus n'établissent
pas une garantie d'absence d'incident en production ni un déploiement sans maintenance.
