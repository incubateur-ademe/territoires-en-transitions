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

### Dérouler tous les tests en mode automatique

```sh
npm test
```

## Organisation des tests

Les tests sont organisés en fonctionnalités et scénarios.

Le répertoire `cypress/integration` contient un fichier `.feature` par fonctionnalité à tester.

Chaque fichier `.feature` contient un ou plusieurs scénarios de test décrivant la fonctionnalité.

Un scénario est lui-même composé de plusieurs étapes (*steps*) permettant de définir :

- un contexte (état initial)
- des attentes (l'affichage doit vérifier telles conditions, une requête a été émise, etc.)
- des actions d'un utilisateur (saisie d'une valeur dans un champ, clique sur un bouton, etc.)

### Gherkin

Les scénarios sont rédigés dans le [formalisme *Gherkin*](https://cucumber.io/docs/gherkin/reference/).

Celui-ci permet d'exprimer un scénario de test en langage naturel en utilisant des mot-clés permettant d'articuler les différentes étapes d'un scénario.

Les [mot-clés français](https://cucumber.io/docs/gherkin/languages/#gherkin-dialect-fr-content) de Gherkin sont disponibles en ajoutant une ligne `# language: fr` au début de chaque fichier `.feature`.

Un fichier `.feature` est ainsi réalisé sur le modèle suivant :

```gherkin
# language: fr

Fonctionnalité: Nom de la fonctionnalité à tester

    Scénario: Nom d'un test
        # étapes :
        Etant donné que l'application est dans un état particulier
        Et que tel élément est présent 
        
        Alors telle attente doit être satisfaite
        Et telle autre aussi

        Quand je réalise une action
        Et une autre
        Alors une nouvelle attente doit être satisfaite
        # etc.
```

### Définition d'une étape de scénario

La [définition d'une étape de scénario](https://cucumber.io/docs/cucumber/step-definitions/), permet d'associer une phrase en langage naturel et une ou plusieurs opérations (attentes, actions).

La fonction globale `defineStep` permet de réaliser cette implémentation.

Les définitions du sous-dossier `cypress/integration/common` sont communes à toutes les fonctionnalités.

Les étapes spécifiques à chaque fonctionnalité sont définies dans un dossier portant le même nom (sans l'extension) que le fichier `.feature` associé.
Ceci permet d'éviter d'éventuelles collisions entre des phrases courtes ayant un sens différent d'une fonctionnalité à une autre.

### Sélecteurs

Les sélecteurs permettent de cibler les différents éléments du DOM.

On évite d'utiliser des sélecteurs qui rendront les tests trop sensibles à de futurs changements du markup ou des styles de la page.

C'est pour cela que l'on s'autorise à placer des attributs `data-test="SomeComponent"` dans certains éléments HTML.
Ceux-ci peuvent alors être ciblés avec la syntaxe `[data-test=SomeComponent]`.

Par convention, on défini les sélecteurs dans le fichier `common/selectors.js` (commun à tous les tests) et dans un éventuel `<ma-feature>/selectors.js` pour les éléments propre à une fonctionnalité.
