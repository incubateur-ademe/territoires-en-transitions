# Installation

Ce projet a été démarré avec [Create React App](https://github.com/facebook/create-react-app).

## Si vous n'utiliez pas docker :

Vous avez besoin de node installé, version >= 14.
Dans 'front', vous devez installer l'application avec la commande :

#### `npm install`
#### `cp .env.sample .env`
Vous pouvez modifier les variable d'environnement dans ce nouveau fichier `.env`
#### `cp src/ui/map/empty_cstc.json src/ui/map/cstc.json`
Vous pouvez aussi mettre le fichier geojson `cstc.json` des secteurs de la brigade.

On peut ensuite lancer le script qui nous intéresse dans la liste ci-dessous.

<br/>

## Scripts disponibles

**`npm start`** : démarre l'appli en mode dev

**`npm test`** : lance les tests

**`npm run build`** : construit les bundles de production

**`npm run generate-interfaces`** : génère les interfaces en s'appuyant sur les dataclasses python du backend.

## Organisation du front

L'arboresence du front est la suivante :\

src

> app\
> core-logic\
> ui\
> utils\
> interfaces

- **core-logic** : c'est là que se fait la gestion de l'état de l'application. Redux est utilisé, avec [redux-toolkit](https://redux-toolkit.js.org/). Il ne doit pas y avoir de `jsx`, `css` ou `html` ici. Cette partie concentre la logique métier pure, l'orchestration du state. Les requêtes et les souscriptions se passent ici également. C'est la partie du front qui est testé.

- **ui** : la bibliotèque de composants. On cherche à faire des composants indépendants de l'application. Il ne doivent pas connaitre, ni faire référence à redux. On utilise beaucoup [material-ui](https://material-ui.com/). Les imports à material-ui doivent se faire uniquement dans le dossier `ui`. Cela permet de changer facilement de design, sans avoir à toucher directement au code de l'application.

- **utils** : on regroupe là les petites fonctions utilitaires qui peuvent servir un peu partout.

- **interface** : les interfaces typescript qui sont ici sont générées par le backend. C'est sur elle que l'on s'appuie pour garantir le contrat d'interface avec le backend.

- **app** : c'est là qu'est construite l'application react à proprement parlée. Elle va consommer ce qui est dans `core-logic` et dans `ui`.

Dans chacun des dossiers, on utilise un fichier `index.ts` dont le role est de déterminer ce qui est exposé à l'utilisation externe. Et donc quand on créer un composant, il ne faut pas oublier de l'ajouter ici. Quand on travaille dans le dossier `app`, tout ce qui est importable de `ui` doit être importable avec la ligne suivante:

##### `import {ComponentA, ComponentB} from "ui"`

On ne doit jamais faire:

##### `import {ComponentA, ComponentB} from "ui/map/Map"`

Si le composant n'apparait pas disponible c'est généralement qu'il a été oublié dans l'index.

La même chose est valable pour importer de `core-logic`, `interface` et `utils`

## Core logic

C'est la partie la plus compliqué du front: il faut bien comprendre comment fonctionne redux.

Elle s'organise par useCase. Le sous-dossier helloSapeur permet de se faire une bonne idée du fonctionnement. La partie `slice` décrit les changements possible de l'application et comment le state doit réagir selon les actions.

Les thunks sont utilisés pour les actions (le plus souvents asynchrones) qui s'appuyent sur des dépendances. L'exemple le plus classique étant une requête http au backend. On voit dans `helloSapeur.thunk.ts` par exemple qu'on accède à la dépendance : `httpClient`.

La list des dépendances se trouve dans `store.config.ts` actuellement il y a 3 dépendance pour le front : `HttpClient`, `PubSubClient`, `Refresher`.

Pour les tests, on instantie le store avec des dépendances `InMemory`. Ce qui nous permet de simuler des réponses de requêtes au backend. C'est le role de la fonction `createTestStore` dans `test.utils.ts`. Elle est utilisé sytématiquement avant chaque test pour préparer le store. Un bon exemple de tests est le fichier : `helloSapeur.spec.ts`.

Les dépendances de production, qui elles vont réellement faire des requêtes sont injectées quand l'application démarre. À des fins de démonstration, on peut aussi démarrer l'application avec les dépendances `InMemory`, ce qui permet d'éviter de dépendre du backend (on joue simplement sur les variables d'environnement, dans le fichier `.env`). Cela se passe dans le fichier `initializeStore.ts` : c'est le role de la fonction `getStore` qui est utilisé au démarrage de l'appi, dans `src/index.tsx`.

### Selectors

Les selecteurs sont utilisés pour accéder à des données du state redux. Nous utilisons la library [reselect](https://github.com/reduxjs/reselect) qui est fournie avec redux-toolkit.

`Reselect` est très efficace pour optimiser les accès au store. C'est pourquoi nous faisons en store de l'utiliser au maximum, et de produire des selecteurs en chaine.
