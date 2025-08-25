## GitHub workflows et actions

Le dossier `.github` contient la définition des worflows utilisés en CI.

Nous utilisons les [workflows réutilisables](https://docs.github.com/en/actions/concepts/workflows-and-actions/reusable-workflows#about-reusable-workflows) et les [actions personnalisées](https://docs.github.com/en/actions/concepts/workflows-and-actions/custom-actions) afin de modulariser les différents workflows et de minimiser la duplication de code.

Ces workflows peuvent aussi être utilisés en local par le biais de [`act`](https://nektosact.com/) pour faciliter leur élaboration et initialiser les environnements de développememt.

La variable d'environnement `ACT` est ajoutée automatiquement ce qui permet de distinguer dans les workflows les exécutions locales de celles en CI.

Par exemple les images docker construites par les actions ne sont pas tirées ou poussées vers le registre de containers lorsque les workflows associés sont utilisés avec `act`.

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

Exemples avec le workflow `ci` (`.github/workflows/ci.yml`).

- Lister les jobs disponibles :

```sh
act -l -W .github/workflows/ci.yml
```

- Lancer un job :

```sh
act -W .github/workflows/ci.yml -j init-db
```

Lorsque le nom du job est unique, il n'est pas nécessaire de spécifier le workflow.

```sh
act -j init-db
```

- Voir un graphe du workflow :

```sh
act -W .github/workflows/ci.yml -g
```
