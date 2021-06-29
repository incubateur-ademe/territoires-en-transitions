# Application client pour Labels Transition Écologique


- [Pré-requis](#pré-requis)
- [Pour commencer à développer](#pour-commencer-à-développer)
    - [Installer les dépendances de
      développement](#installer-les-dépendances-de-développement)
    - [Lancer l'application en local](#lancer-l-application-en-local)
    - [Lancer la version de production en local](#lancer-la-version-de-production-en-local)
- [Lancer les tests end-to-end](#lancer-les-tests-end-to-end)

Ce dossier regroupe une partie de l'application cliente pour le projet
Territoires en Transitions. Cette application est construite avec
[Sapper](https://sapper.svelte.dev/).

## Pré-requis

- Node v15.6.0
- [Les fichiers générés par codegen](codegen#le-générateur-de-code)

## Pour commencer à développer

### Installer les dépendances de développement

```sh
npm i
```

### Lancer l'application en local

```sh
npm run dev:sandbox
```

L'application va alors se lancer sur [localhost:3000](http://localhost:3000).

**Important** :

L'application client communique avec une API pour récupérer certaines données et les mettre à jour. Cette API est
disponible sur https://github.com/betagouv/api-label-transition-ecologique.

On peut développer l'application cliente avec une API lancée en local sur
[localhost:8000](http://localhost:8000). Pour cela, démarrer l'API, puis pour
lancer le client :
```
npm run dev
```

### Lancer la version de production en local

```sh
npm run build && npm start
```
Cette commande désactive le hot-reloading et charge les plugins nécessaires à la production.

## Lancer les tests end-to-end

On utilise [Cypress](https://www.cypress.io/) pour lancer nos tests end-to-end.
Pour lancer le Test Runner de Cypress :
```sh
npm i
npm run cy:open
```
