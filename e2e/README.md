# Tests E2E

Les tests E2E sont exécutés par l'outil [Cypress](https://github.com/cypress-io/cypress).

## Pré-requis

- Node v16.13.2+
- npm v8.1.2+

Il est recommandé d'utiliser un gestionnaire de versions de l'environnement Node tel que [nvm](https://github.com/nvm-sh/nvm) pour installer et utiliser une version donnée de Node (ici v16).

```sh
# à faire qu'une seule fois pour installer la version voulue
nvm install 16
# puis à chaque ouverture d'un terminal
nvm use 16
```

## Commandes

### Démarrer le gestionnaire de tests

```sh
npm start
```

puis sélectionner une fonctionnalité à tester dans la liste.

### Dérouler les tests en mode automatique

```sh
npm test
```

## Organisation des tests

Les tests sont organisés en fonctionnalités et scénarios.

Le répertoire `cypress/integration` contient un fichier `.feature` par fonctionnalité à tester.

Chaque fichier `.feature` contient un ou plusieurs scénarios de test décrivant la fonctionnalité.

## Gherkin

Les scénarios sont exprimés dans le [formalisme *Gherkin*](https://cucumber.io/docs/gherkin/reference/).

Les mots clés français de Gherkin sont disponibles en ajoutant une ligne `# language: fr` au début de chaque fichier `.feature`.
