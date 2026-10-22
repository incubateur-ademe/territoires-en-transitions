---
title: 'NestJS : maintien sur la version 11 et corrections indépendantes'
type: fix
status: active
date: 2026-10-19
---

# NestJS : maintien sur la version 11 et corrections indépendantes

**Décision : attendre pour migrer vers NestJS 12.** Aucun besoin urgent ne justifie de retirer les générateurs Nx, de remplacer `nestjs-zod` ou de maintenir une instrumentation OpenTelemetry spécifique pour changer de version majeure. Backend et tools restent sur NestJS 11, avec les dépendances définies dans [package.json](../../package.json) et [pnpm-lock.yaml](../../pnpm-lock.yaml).

La [PR 5529](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5529) porte uniquement les corrections utiles sur cette version. La migration et l'adoption d'autres modules NestJS sont des travaux distincts.

## Périmètre et découpage des commits

| Commit              | Périmètre                                                    | Comportement attendu                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Plan             | Décision d'attente, corrections et conditions de reprise     | Le périmètre du code correspond à ce document.                                                                                                                                                                                                      |
| 2. Configuration    | Modules de configuration backend et tools                    | Seul le module racine appelle `ConfigModule.forRoot`. Les modules métier importent `ConfigModule` et respectent `ignoreEnvFile`. Les factories Zod conservent validation, transformations et valeurs par défaut.                                    |
| 3. Erreurs HTTP     | Filtre global backend                                        | Les erreurs Express avec un statut HTTP valide et cohérent conservent ce statut. Leur message reste masqué lorsque `expose` n'est pas strictement `true`. Les exceptions Nest conservent leurs détails et les erreurs de base de données leur code. |
| 4. Contrats OpenAPI | Génération Swagger et réponses des deux listes d'indicateurs | La documentation décrit HTTP 200, les enveloppes et les noms de champs publics réellement retournés. `cleanupOpenApiDoc` de `nestjs-zod` assure la conversion vers OpenAPI 3.0.                                                                     |

### Configuration

Les [modules backend](../../apps/backend/src/utils/config/configuration.module.ts) et [tools](../../apps/tools/src/config/configuration.module.ts) exposent leur service typé sans initialiser à nouveau la configuration. Une importation de module ne doit pas charger un fichier `.env` lorsque la racine utilise `ignoreEnvFile: true`.

Les factories existantes restent responsables de la validation des variables : un paramètre requis absent empêche la construction de l'application ; les nombres, booléens, listes et valeurs par défaut restent typés.

### Erreurs HTTP

Le [filtre global](../../apps/backend/src/utils/nest/all-exceptions.filter.ts) reconnaît les erreurs de middleware qui portent un `status` et un `statusCode` identiques, entiers et compris entre 400 et 599. Les corps JSON malformés, trop volumineux ou utilisant un charset non pris en charge produisent respectivement 400, 413 et 415.

Pour ces erreurs, le message public vient de l'erreur seulement si `expose === true`. Sinon, le filtre renvoie le libellé HTTP standard. Les autres erreurs suivent le traitement existant. L'adoption de `HttpExceptionOptions.errorCode` dépend de la migration future et ne fait pas partie de ces corrections.

### OpenAPI

- `GET /api/v1/indicateurs` documente `{ count, pageCount, pageSize, page, data }`. Chaque indicateur utilise les champs publics `favoris`, `confidentiel`, `ficheActions` et `parents`.
- `GET /api/v1/indicateurs/definitions` documente `{ count, data }`. Le parsing existant filtre les champs internes et rejette les données invalides.
- Les deux routes répondent HTTP 200. La correction des DTO de documentation ne change pas leurs payloads.
- Le [bootstrap](../../apps/backend/src/main.ts) applique le post-traitement officiel de `nestjs-zod` au document Swagger, notamment pour les champs nullables et les références. Voir la [documentation de l'intégration](https://github.com/BenLorantfy/nestjs-zod#cleanupopenapidoc-ensure-proper-openapi-output).

## Conditions de reprise de la migration

Ces conditions concernent une future migration, pas la fusion des corrections NestJS 11 :

- **D14 — Télémétrie :** sélectionner une combinaison OpenTelemetry déclarée compatible avec la cible Nest, Node et le SDK utilisés. Vérifier le bootstrap, les relations parent/enfant HTTP, les erreurs et les traitements asynchrones. Attendre si cela impose une instrumentation spécifique sans bénéfice propre.
- **D04 — Générateurs Nx :** vérifier le support de la cible par `@nx/nest` et confirmer l'usage des générateurs avec l'équipe. Une absence de référence dans les fichiers de configuration ne suffit pas à justifier leur suppression.
- **D02/D06 — Validation :** comparer le support de la cible par `nestjs-zod` et les API natives. Choisir selon la maintenance et les contrats applicatifs, sans imposer une réécriture pour accélérer la migration.
- **D08 — OpenAPI :** évaluer la conversion native avec une version de Zod exposant Standard JSON Schema avant d'introduire un convertisseur spécifique. Vérifier Zod classique et Mini, transformations entrée/sortie, noms de composants et résolution des références.
- Vérifier les versions réellement résolues et leurs peer dependencies, puis exécuter les tests et builds sur le commit proposé à la fusion. Les conditions ci-dessus restent à valider.

Les modifications OAuth, cookies, ordonnanceur, outillage, télémétrie et packages supplémentaires restent hors du périmètre de cette PR. Les intégrer nécessite un besoin et une validation propres.

## Validation des corrections

Les tests ciblés utilisent des données synthétiques et des services simulés. Ils ne nécessitent ni PostgreSQL ni Redis et ne déclenchent aucun appel IA réel.

Depuis la racine, après l'installation habituelle et le build des packages dépendants :

```sh
pnpm exec vitest run --config apps/backend/vitest.config.mts \
  apps/backend/src/utils/config/configuration.module.spec.ts \
  apps/backend/src/utils/nest/all-exceptions.filter.spec.ts \
  apps/backend/src/utils/nest/errors.utils.spec.ts \
  apps/backend/src/indicateurs/indicateurs/list-indicateurs/list-indicateurs.controller.spec.ts \
  apps/backend/src/indicateurs/definitions/list-platform-definitions/list-platform-definitions.controller.spec.ts

pnpm exec vitest run --config apps/tools/vitest.config.mts \
  apps/tools/src/config/configuration.module.spec.ts

pnpm exec nx run-many -t build -p backend tools
pnpm exec tsc --build apps/backend/tsconfig.json apps/tools/tsconfig.json --pretty false
git diff --check
```

Avant fusion, vérifier les checks du commit courant dans la [CI de la PR](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5529/checks) et la page OpenAPI dans l'environnement de validation. Les tests ciblés ne remplacent pas les suites avec base de données.

## Déploiement et retour arrière

Utiliser le processus habituel de backend et tools. Ces corrections ne changent ni les dépendances ni le schéma ou les données PostgreSQL. Vérifier le démarrage avec la configuration du déploiement et les réponses HTTP concernées. En cas de régression, redéployer les artefacts applicatifs précédents.
