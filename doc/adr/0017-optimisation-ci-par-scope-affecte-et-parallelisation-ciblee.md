# 17. Optimisation de la CI par scope affecté et parallélisation ciblée

Date : 2026-08-25

## Statut

Proposé

## Contexte

L'ADR [0010](./0010-ci.md) a acté le passage à GitHub Actions avec des workflows réutilisables et des actions personnalisées. Cette migration a amélioré la lisibilité, mais la CI restait encore trop lente pour les besoins de développement quotidiens.

Les principaux problèmes observés étaient les suivants :

- la plupart des workflows étaient encore raisonnés comme des suites statiques de jobs, alors que tous les changements ne nécessitent pas de relancer l'ensemble de la pipeline
- plusieurs jobs repayaient les mêmes coûts de préparation (installation pnpm, dépendances natives, navigateurs Playwright, variables d'environnement)
- les frontières historiques entre jobs introduisaient des attentes inutiles sur le chemin critique
- les tests end-to-end représentaient le principal bottleneck et combinaient plusieurs coûts séquentiels : préparation de la stack Supabase, build runtime, démarrage applicatif puis exécution Playwright
- l'exécution e2e via une surcouche Nx dédiée augmentait le risque de dérive par rapport au chemin réel d'exécution, alors que le workspace n'utilise pas Nx Cloud (`neverConnectToCloud: true`)

Sur la branche de travail ayant conduit à cette ADR, l'objectif explicite a été de réduire le délai total de retour de la CI. Le coût en minutes GitHub Actions n'était pas le critère principal ; la durée totale de la pipeline était prioritaire.

## Décision

### 1. Piloter la CI par scope affecté

Le workflow racine `ci.yml` doit commencer par un job d'analyse chargé de :

- calculer la clé de cache des dépendances
- préparer ou restaurer le cache `node_modules`
- déterminer `nx-base` et `nx-head`
- calculer la liste des projets Nx affectés
- exposer des booléens de pilotage pour les familles de jobs CI

Les workflows descendants sont des workflows réutilisables conditionnés par ces booléens, et non plus des jobs toujours exécutés.

Les gates retenus sont :

- `run-backend-api`
- `run-e2e`
- `run-ui-storybook`
- `run-db-deploy`
- `run-prepare-test-db`

Le calcul s'appuie en priorité sur `nx show projects --affected`, complété par un filtrage de fichiers pour les validations de base de données qui ne se projettent pas proprement dans le graphe Nx.

### 2. Mutualiser les coûts de préparation via des actions réutilisables et des caches locaux

La préparation technique d'un job GitHub Actions doit être considérée comme une couche d'architecture à part entière.

Nous retenons les principes suivants :

- `pnpm-prepare` devient le point d'entrée standard pour restaurer les dépendances et relier le workspace sans réinstallation complète à chaque job
- un cache `node_modules` est géré explicitement au niveau du workflow principal
- des caches dédiés sont introduits pour les navigateurs Playwright, le cache de build Next.js et les dépendances système de `node-canvas`
- les variables d'environnement applicatives sont injectées via `app-env` plutôt que recopiées dans chaque workflow

Cette approche ne repose pas sur un partage de cache entre runners Nx, ni sur Nx Cloud. Elle optimise les préparatifs à l'échelle des workflows GitHub Actions eux-mêmes.

### 3. Consolider les familles de jobs autour des besoins réels

Les anciens workflows spécialisés mais redondants sont remplacés par des familles plus larges et plus cohérentes :

- `validate-affected-projects.yml` centralise lint, build non runtime, typecheck et tests affectés
- `test-backend-api.yml` mutualise la préparation de la stack puis exécute en parallèle les tests backend et API pertinents
- `test-ui-storybook.yml` isole les checks UI/Storybook lorsqu'ils sont nécessaires
- `prepare-test-db.yml` devient le workflow unique de préparation de la base de test partagée

L'objectif n'est pas de minimiser le nombre absolu de jobs, mais de limiter les duplications de setup et les dépendances artificielles entre jobs.

### 4. Optimiser explicitement le chemin critique e2e

Les tests end-to-end restent la partie la plus coûteuse de la pipeline. Nous retenons donc une stratégie spécifique :

- exécution directe de `playwright test` dans le workflow CI, sans passer par une cible Nx intermédiaire
- sharding via `strategy.matrix.shard` et `--shard=i/N`
- séparation entre suite isolée et suite `@serial`
- conservation de `--workers=50%` en CI (soit 2 sur le runner public 4 vCPU actuel), car l'augmentation du nombre de workers dégrade la fiabilité à cause de la contention sur la base et les pools Postgres
- production de rapports `blob` en CI, puis fusion dans un job dédié pour générer un rapport HTML unique

Nous privilégions donc le parallélisme horizontal entre shards plutôt que l'augmentation du parallélisme interne de chaque shard.

### 5. Supprimer les attentes sériées inutiles sur le runtime e2e

Le build runtime de `app` et `backend` ne doit plus bloquer l'entrée dans le job e2e via un workflow dédié produisant un artefact intermédiaire.

La décision retenue est de :

- lancer Supabase et Redis en arrière-plan au début du job e2e
- exécuter le build de `app` et `backend` dans chaque shard e2e
- faire en sorte que ce build se chevauche avec le temps de startup de Supabase
- restaurer et sauvegarder un cache de build Next.js pour limiter le coût de ce build répété

Nous acceptons donc une duplication de calcul entre shards si elle permet de réduire le délai total de la pipeline.

Cette décision rend obsolète le workflow `prepare-runtime-builds.yml`, qui est ensuite supprimé.

### 6. Corriger le chemin de démarrage runtime au plus près de l'exécution réelle

La simplification du workflow e2e n'était possible que si le démarrage des applications construites était fiable.

Le démarrage est désormais géré par l'action `app-start`, qui :

- prépare explicitement l'arborescence standalone Next.js
- copie `public` et `.next/static` dans le répertoire attendu par le serveur standalone
- démarre les processus localement puis attend leur disponibilité HTTP

Un point de vigilance important est conservé dans cette ADR : lors de la copie vers le standalone, il faut copier le contenu des répertoires avec `cp -r source/. destination/` pour éviter les structures imbriquées `public/public` et `.next/static/static`.

### 7. Rendre les effets de bord backend tolérants aux exécutions de tests CI

La pipeline optimisée augmente la réutilisation de certaines surfaces backend pendant les jobs de test. Les effets de bord au démarrage qui ne sont pas indispensables aux assertions ne doivent donc pas faire échouer des jobs par ailleurs valides.

Le préchargement asynchrone de `TrajectoiresXlsxService` est conservé, mais ses erreurs de fond ne doivent plus remonter sous forme de rejet non capturé au démarrage des tests.

## Conséquences

### Positives

- La CI n'exécute plus systématiquement toutes les familles de checks.
- Les coûts de préparation sont fortement mutualisés via des actions réutilisables et des caches dédiés.
- Le chemin critique est raccourci, en particulier pour les tests end-to-end.
- Les tests e2e sont plus observables grâce au sharding explicite, aux rapports `blob` et au rapport HTML fusionné.
- Le chemin d'exécution e2e CI est rapproché du chemin réel d'exécution Playwright, ce qui réduit le risque de dérive entre la CI et l'usage attendu.
- La topologie des workflows devient plus lisible : un workflow racine d'orchestration, des workflows réutilisables par famille de vérification, et des actions locales pour les briques techniques.

### Negatives

- La logique CI devient plus architecturée et demande davantage de rigueur de maintenance sur les actions composites et les booléens de gating.
- Sans Nx Cloud, les builds et tests restent cachés uniquement localement au runner ; certains calculs sont donc volontairement dupliqués entre jobs ou entre shards.
- Le build runtime e2e est répété dans chaque shard. Ce surcoût est accepté pour réduire le délai global.
- Le bon comportement du gating dépend de la qualité du mapping entre projets affectés, filtres de fichiers et besoins réels de validation.
- La limitation à `workers=50%` en e2e est une contrainte structurelle liée aux ressources du runner et à la contention base de données ; sur le runner public actuel cela correspond à 2 workers, et le gain futur passera plutôt par davantage de shards ou par une autre architecture d'exécution.

## Alternatives considérées

### Conserver une pipeline statique avec tous les jobs a chaque pull request

Rejeté car cela continue à payer des coûts fixes pour des changements locaux, et ne traite pas les attentes inutiles sur le chemin critique.

### S'appuyer sur une cible Nx e2e specialisee pour l'atomisation CI

Rejeté car le workspace n'utilise pas Nx Cloud. Dans ce contexte, la surcouche Nx n'apporte pas de bénéfice suffisant face au coût de complexité et au risque de dérive par rapport à l'exécution Playwright directe.

### Centraliser le build runtime e2e dans un workflow amont produisant un artefact

Rejeté pour l'objectif principal de cette ADR : cette approche mutualise du calcul, mais elle sérialise le build runtime et le startup de la stack e2e sur le chemin critique.

### Augmenter le nombre de workers Playwright dans chaque job e2e

Rejeté car les essais menés sur le runner public à 4 vCPU ont montré des échecs liés à la contention sur la base de données et les pools Postgres. Le parallélisme horizontal par shards est préféré.

## Portée

Cette ADR complète l'ADR [0010](./0010-ci.md). L'ADR 0010 actait la migration vers une CI GitHub Actions modulaire ; la présente ADR précise comment cette CI doit être orchestrée pour optimiser le délai de retour : scope affecté, mutualisation des préparatifs, parallélisation ciblée, et traitement spécifique du chemin critique e2e.
