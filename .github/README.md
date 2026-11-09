## GitHub workflows et actions

Le dossier `.github` contient les workflows de CI, de déploiement et de maintenance.

Nous utilisons les [workflows réutilisables](https://docs.github.com/en/actions/concepts/workflows-and-actions/reusable-workflows#about-reusable-workflows) et les [actions personnalisées](https://docs.github.com/en/actions/concepts/workflows-and-actions/custom-actions) afin de modulariser les différents workflows et de minimiser la duplication de code.

Ces workflows peuvent aussi être utilisés en local par le biais de [`act`](https://nektosact.com/) pour faciliter leur élaboration et initialiser les environnements de développememt.

La variable d'environnement `ACT` est ajoutée automatiquement ce qui permet de distinguer dans les workflows les exécutions locales de celles en CI.

Par exemple les images docker construites par les actions ne sont pas tirées ou poussées vers le registre de containers lorsque les workflows associés sont utilisés avec `act`.

### Organisation de la CI

| Workflow                                                          | Rôle                                                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [main-ci.yml](./workflows/main-ci.yml)                            | Point d'entrée pour les pushes sur `main` et les lancements manuels.                     |
| [pull-request-ci.yml](./workflows/pull-request-ci.yml)            | Point d'entrée pour les PR hors brouillon.                                               |
| [\_ci.yml](./workflows/_ci.yml)                                   | Calcul des scopes et orchestration des validations.                                      |
| [\_ci-validate.yml](./workflows/_ci-validate.yml)                 | Lint, build, typecheck et tests unitaires des projets affectés.                          |
| [\_ci-storybook.yml](./workflows/_ci-storybook.yml)               | Tests des Storybooks sélectionnés et publication UI sur Chromatic.                       |
| [\_ci-test-db.yml](./workflows/_ci-test-db.yml)                   | Tests des migrations, de la compatibilité des backups et des contraintes en base locale. |
| [\_ci-test-backend-api.yml](./workflows/_ci-test-backend-api.yml) | Tests d'intégration backend et API avec Supabase et Redis.                               |
| [\_ci-test-e2e.yml](./workflows/_ci-test-e2e.yml)                 | Shards Playwright et fusion des rapports E2E.                                            |
| [\_prepare-test-db.yml](./workflows/_prepare-test-db.yml)         | Préparation de la base de test, partagée entre `_ci.yml` et `dev.yml`.                   |

Les workflows internes portent le préfixe `_` et exposent seulement `workflow_call`. Les points d'entrée appellent `_ci.yml`, qui délègue chaque famille de validations à un sous-workflow `_ci-*.yml`. Ces sous-workflows séparent les responsabilités même lorsqu'ils n'ont qu'un seul appelant.

Chaque job publie son propre résultat dans les checks de la PR. Le retry automatique reste limité à une tentative pour les tests backend/API et les shards E2E, uniquement si tous les jobs en échec font partie de ces tests. Un échec de publication Storybook ou de fusion des rapports ne déclenche pas de retry automatique.

Les caches passent par les actions locales dédiées [à `node_modules`](./actions/cache/node-modules/action.yml) et [au build Next.js](./actions/cache/next-app-build/action.yml), qui utilisent `actions/cache`. Le login Docker passe par l'[action locale `docker/login`](./actions/docker/login/action.yml), qui utilise `docker/login-action`. `keep-alive-streamlit.yml` utilise une [action dédiée](./actions/providers/streamlit/keep-alive/action.yml) pour installer les dépendances et réveiller les applications Streamlit.

### CI des stacks GitHub natives

La CI conserve lint, build non runtime, typecheck et tests unitaires affectés
sur chaque PR hors brouillon. Les PR déclarées dans une stack native GitHub
diffèrent les suites coûteuses tant qu’elles dépendent d’une PR parente :
Storybook, préparation de la base, tests DB, backend/API et E2E.

La première PR non mergée reçoit la validation complète des projets affectés.
Elle est identifiée par l’égalité entre `pull_request.base.ref` et
`pull_request.stack.base.ref`. La position d’origine dans la stack ne suffit
pas : elle peut rester supérieure à 1 après le merge des premiers étages.

Les PR sans métadonnées natives complètes, y compris les branches empilées
manuellement, conservent la validation complète. Les pushes sur `main` et
les lancements manuels de Main CI conservent également cette validation.

#### Checks et merge

Le workflow réutilisable reste appelé et publie `ci / status`. Ce check est
rouge tant que la validation complète est différée, même si les checks
rapides passent. Il explique la raison dans son résumé. Un job attendu
mais sauté, échoué ou annulé bloque également le merge.

Le merge de la PR parente provoque la promotion de l’étage suivant. Le
workflow traite les pushes et changements de branche cible pour lancer sa
validation complète. Les modifications du titre ou de la description ne
doivent pas annuler une validation en cours.

Le fonctionnement par défaut implique un merge étage par étage, avec une
attente de CI entre les merges. Les résultats d’une PR ne valident jamais
une autre PR de la stack.

#### Lancer la validation complète sans attendre

Dans le run Pull request CI de la PR, choisir **Re-run all jobs**. Toute
nouvelle tentative exécute la validation complète, y compris pour un étage
supérieur. Cela permet aussi de récupérer une PR retirée d’une stack sans
nouveau push. **Re-run failed jobs** ne suffit pas : le calcul du mode doit
être réexécuté.

Pour fusionner plusieurs étages en une fois, chaque PR concernée doit avoir
obtenu son propre verdict complet sur sa version courante.

#### Vérification locale

```sh
node --test .github/actions/ci/native-stack-policy/*.spec.mjs
```

Ces tests utilisent uniquement des événements et résultats synthétiques,
sans GitHub, base de données ou fournisseur LLM. Ils sont aussi exécutés
au début du job `analyze-affected`.

Voir la [décision et ses compromis](../doc/adr/0023-ci-progressive-stacks-natives.md)
et la [documentation GitHub](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/optimizing-ci-for-stacked-pull-requests).

### Organisation des actions locales

Les actions sont classées par responsabilité sous `.github/actions/` :

| Dossier      | Responsabilité                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `app/`       | Configuration, démarrage et métadonnées des applications.                                       |
| `cache/`     | Caches dédiés aux dépendances, builds et outils de test.                                        |
| `ci/`        | Calcul des projets affectés et sélection des validations.                                       |
| `database/`  | Commandes PostgreSQL, seed et migrations Sqitch ; services locaux dans `supabase/` et `redis/`. |
| `docker/`    | Login au registre, chemins, disponibilité, pull et build/push des images.                       |
| `node/`      | Préparation de pnpm et des dépendances natives Node.js.                                         |
| `providers/` | Intégrations externes, séparées dans `aws/`, `koyeb/` et `streamlit/`.                          |
| `runner/`    | Configuration du système du runner.                                                             |
| `utils/`     | Helpers partagés de troncature et d'attente HTTP.                                               |

Les workflows et actions composites utilisent un chemin depuis la racine du dépôt, par exemple `uses: ./.github/actions/docker/login`. Les scripts et Dockerfiles propres à une action restent dans son dossier.

### Cache des images de déploiement

L'action `docker-build-push` utilise un [cache BuildKit dans le registre](https://docs.docker.com/build/cache/backends/registry/), sous le tag `buildcache-<cache-scope>` du même package GHCR que l'image. Le cache est partagé entre les branches et les environnements et conserve les couches intermédiaires (`mode=max`), avec compression zstd niveau 1. Il utilise la connexion fournie par `docker-login` ; un échec d'export du cache ne fait pas échouer le déploiement.

Le workflow `cd-app.yml` réutilise l'image d'un commit déjà publié, y compris lors d'une promotion vers un autre environnement ou d'un déploiement d'app de test. Cocher **Reconstruire l'image même si ce commit est déjà publié** pour relancer le build en conservant le cache BuildKit : les étapes déjà en cache peuvent être réutilisées. Cette réutilisation d'image concerne l'app, dont la configuration arrive au runtime ; l'action la désactive par défaut pour les autres images.

Les caches de travail Next.js et Nx de l'app restent dans des mounts locaux au builder et ne sont pas exportés dans les couches Docker. Sur un runner éphémère, le build Next.js reste donc un build à froid lorsque le commit change. Le premier build après ce changement de backend de cache doit également alimenter le cache GHCR.

### Structure des dossiers

- **`.actrc`** : configuration de `act`
- **`.github/config/`** : configuration de l'environnement pour l'exécution en local des workflows
  - **`.act.vars(.default)`** : variables (équivalent du contexte `vars` GitHub)
  - **`.act.secrets(.default)`** : secrets (équivalent du contexte `secrets` GitHub)
- **`.github/actions/`** : actions locales réutilisées dans les workflows
- **`.github/workflows/`** : workflows

### Prérequis

- Docker démarré
- `act` installé : `brew install act` (macOS)

### Mise en place (une fois)

```sh
cp .github/config/.act.vars.default .github/config/.act.vars
cp .github/config/.act.secrets.default .github/config/.act.secrets
# Éditez et complétez les valeurs nécessaires (IDs de spreadsheets, clés API…)
```

### Exécuter un workflow avec Act

Les exemples donnés ici utilise le workflow `dev` ([`.github/workflows/dev.yml`](./workflows/dev.yml)).

Ce workflow fourni des jobs utiles en développement. Voir les commentaires dans le fichier lui-même pour plus d'information.

Cependant n'importe quel autre workflow/job peut être lancé avec Act afin de tester et déboguer ce qui se passe en CI.

- Lister les jobs disponibles :

```sh
act -W .github/workflows/dev.yml -l
```

- Lancer un job :

```sh
act -W .github/workflows/dev.yml -j prepare-dev-db
```

Lorsque le nom du job est unique, il n'est pas nécessaire de spécifier le workflow.

```sh
act -j prepare-dev-db
```

- Voir un graphe d'un workflow :

```sh
act -W .github/workflows/main-ci.yml -g
```

## Troubleshooting

Lorsqu'une commande tel que `act -j db-save` résulte en un message d'erreur "docker daemon is not running" dans un job qui appelle la CLI de Docker, il est probable que le chemin de la socket par défaut de `act` ne soit pas la bonne.

Il est alors possible d'éditer son fichier `~/.actrc` pour le définir en dur :

```
--container-daemon-socket unix:///Users/yolododo/.docker/run/docker.sock
```
