## GitHub workflows et actions

Le dossier `.github` contient la définition des worflows utilisés en CI.

Nous utilisons les [workflows réutilisables](https://docs.github.com/en/actions/concepts/workflows-and-actions/reusable-workflows#about-reusable-workflows) et les [actions personnalisées](https://docs.github.com/en/actions/concepts/workflows-and-actions/custom-actions) afin de modulariser les différents workflows et de minimiser la duplication de code.

Ces workflows peuvent aussi être utilisés en local par le biais de [`act`](https://nektosact.com/) pour faciliter leur élaboration et initialiser les environnements de développememt.

La variable d'environnement `ACT` est ajoutée automatiquement ce qui permet de distinguer dans les workflows les exécutions locales de celles en CI.

Par exemple les images docker construites par les actions ne sont pas tirées ou poussées vers le registre de containers lorsque les workflows associés sont utilisés avec `act`.

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
act -W .github/workflows/ci.yml -g
```

## Troubleshooting

Lorsqu'une commande tel que `act -j db-save` résulte en un message d'erreur "docker daemon is not running" dans un job qui appelle la CLI de Docker, il est probable que le chemin de la socket par défaut de `act` ne soit pas la bonne.

Il est alors possible d'éditer son fichier `~/.actrc` pour le définir en dur :

```
--container-daemon-socket unix:///Users/yolododo/.docker/run/docker.sock
```
