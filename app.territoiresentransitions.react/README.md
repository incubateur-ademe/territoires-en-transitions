# Install

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## If you do not use docker :

You need node, version >= 14.
In 'front', install app dependencies with :

#### `npm install`
#### `cp .env.sample .env`
You can change the environement variables in this new file `.env`
#### `cp src/ui/map/empty_cstc.json src/ui/map/cstc.json`
You can also change to another geojson `cstc.json`.

Then you can use the following scripts which suits you.

<br/>

## Available Scripts

**`npm start`** : starts the app in dev mode

**`npm test`** : launch tests

**`npm run build`** : build production bundle

**`npm run generate-interfaces`** : generates typescript interfaces from the backend python dataclasses.

## Front folder organisation

The frontend tree is the following:\

src

> app\
> core-logic\
> ui\
> utils\
> interfaces

- **core-logic** : this is where the state management happens. Redux is used, with [redux-toolkit](https://redux-toolkit.js.org/). There should not be any `jsx`, `css` or `html` around here. This part handle pure business logic, the orchestration of the state. Requests and subscriptions also happen here. This part is tested.

- **ui** : the components library. We want componants to be independant from the application. They should not know, nor reference redux. We use [material-ui](https://material-ui.com/). Imports of material-ui components should happen only in `ui` folder. This makes design changes easy, without having to touch code directly in app folder.

- **utils** : we gather here the utility functions which we need around the app.

- **interface** : typescript interfaces are generated here from backend python dataclasses. C'est sur elle que l'on s'appuie pour garantir le contrat d'interface avec le backend.

- **app** : this is where the actual app is built. It uses the functionalities and components from `core-logic` and `ui`.

In each of these folders, we have an `ClientScore.ts` which purpose is to reference every exposed functionalities. So when a new component is created, it should be referenced here. When working in `app` folder, all that we can import from `ui` should be able to be import with the following line:

##### `import {ComponentA, ComponentB} from "ui"`

We should never need to do:
##### `import {ComponentA, ComponentB} from "ui/map/Map"`

If the components looks unavailable, it has probably been forgotten in the `ClientScore.ts`.

It is the same when importing from `core-logic`, `interface` and `utils`

## Core logic

This is the tuffest part of the front: good knowledge of redux is needed.

This part is build around useCases. The subfolder `helloSapeur` gives a good idea of how things work together. The `slice` describes the possible changes and how the state should evolve.

Thunks are used for actions (often asynchronous) which rely on dependencies. The most classical example is a request to the backend. We can see in `helloSapeur.thunk.ts` for example,we are accessing the dependency `httpClient`.

The dependencies list of the app is in `store.config.ts`. Now there are 3 dependencies on the front : `HttpClient`, `PubSubClient`, `Refresher`.

During testing, we instantiate the store with `InMemory` dependencies(this makes it possible to simulate backend response). This is the role of the function `createTestStore` in `test.utils.ts`. It is used systematically before each test, to get a fresh store each time. You can find a good test example here : `helloSapeur.spec.ts`.

Production dependencies, which will actually send requests, are injected when the application starts. For demonstration purpose, `InMemory` dependencies could be used in the app, which avoid to rely on any backend (the right environnement variable should be set in `.env`). This happens in the file `initializeStore.ts`: it is the role of `getStore` which is used when the app starts in `src/index.tsx`.

### Selectors

Selectors are used to access data from the store. We are using the [reselect](https://github.com/reduxjs/reselect) library, which comes with redux-toolkit.

`Reselect` is very efficient to minimize the computation cost. This is why we do our best to make efficient selectors chain. Best practice is to always use selectors when accessing the state.


