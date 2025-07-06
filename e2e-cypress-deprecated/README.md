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

Dans vscode, l'extension [Cucumber (Gherkin) Full Support](https://marketplace.visualstudio.com/items?itemName=alexkrechik.cucumberautocomplete) permet notamment d'avoir la coloration syntaxique des scénarios de test.

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

### Exécuter un test donné depuis la ligne de commandes

```sh
# exécute les scénarios des fichiers `.feature` commençant par "15" ("15-auditer-la-collectivite.feature")
npm test -- -s "cypress/integration/**/15*"
```

### Exécuter un test donné depuis la ligne de commandes et générer une vidéo

```sh
npm test -- -s "cypress/integration/**/15*" --config video=true
```

## Rapport de test

Un rapport de test au format HTML est généré lors de l'exécution des tests. Ouvrir le fichier `cucumber-report.html` pour consulter ce rapport.

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

Fonctionnalité: Tester telle partie de la plateforme

    Scénario: Tester un comportement de cette partie
        # étapes :
        Etant donné que l'application est dans un état particulier
        Et que tel élément est présent
        
        Alors telle attente doit être satisfaite
        Et telle autre aussi

        Quand je réalise une action
        Et une autre
        Alors une nouvelle attente doit être satisfaite
        # etc.```

### Définition d'une étape de scénario

La [définition d'une étape de scénario](https://cucumber.io/docs/cucumber/step-definitions/?lang=javascript), permet d'associer une phrase en langage naturel et une ou plusieurs opérations (attentes, actions).

La fonction globale `Given` permet de réaliser cette implémentation.

La phrase d'une étape de test peut être exprimée avec une expression régulière (regex) ou une expression Cucumber, ce dernier mode étant plus lisible mais un peu moins puissant.

Les définitions du sous-dossier `cypress/integration/common` sont communes à toutes les fonctionnalités.

Les étapes spécifiques à chaque fonctionnalité sont définies dans un dossier portant le même nom (sans l'extension) que le fichier `.feature` associé.
Ceci permet d'éviter d'éventuelles collisions entre des phrases courtes ayant un sens différent d'une fonctionnalité à une autre.

### Sélecteurs

Les sélecteurs permettent de cibler les différents éléments du DOM.

On évite d'utiliser des sélecteurs qui rendront les tests trop sensibles à de futurs changements du markup ou des styles de la page.

C'est pour cela que l'on s'autorise à placer des attributs `data-test="SomeComponent"` dans certains éléments HTML.
Ceux-ci peuvent alors être ciblés avec la syntaxe `[data-test=SomeComponent]`.

Par convention, on défini les sélecteurs dans le fichier `common/selectors.js` (commun à tous les tests) et dans un éventuel `<ma-feature>/selectors.js` pour les éléments propre à une fonctionnalité.

### Exécuter un seul scénario d'une fonctionnalité

Afin de faciliter l'écriture et la mise au point d'un scénario il est possible d'isoler celui-ci en ajoutant une directive `@focus` avant sa déclaration, comme dans l'exemple suivant.

```gherkin
# language: fr

Fonctionnalité: Nom de la fonctionnalité à tester

    Scénario: 1er scénario (sera sauté)
        Etant donné que l'application est dans un état particulier
        Et que tel élément est présent
        # etc.

    @focus
    Scénario: 2ème scénario isolé pour mise au point
        Etant donné que l'application est dans un état particulier
        Et que tel élément est présent
        # etc.
```

### Mettre en pause un scénario

Pour mettre en pause le scénario, ajouter dans celui-ci une étape `* pause` comme dans l'exemple suivant.
Puis dans l'interface Cypress, utiliser la commande "suivant" pour continuer l'exécution du scénario en mode pas à pas ([cf doc](https://docs.cypress.io/api/commands/pause)).

```gherkin
# language: fr

Fonctionnalité: Nom de la fonctionnalité à tester

    Scénario: Nom d'un test
        Etant donné que l'application est dans un état particulier
        Et que tel élément est présent
        * pause # <- le scénario sera mis en pause ici
        
        Alors telle attente doit être satisfaite
        Et telle autre aussi
        # etc.
```
