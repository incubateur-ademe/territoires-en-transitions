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
- [Les fichiers générés par codegen](https://github.com/betagouv/territoires-en-transitions/tree/main/codegen#le-g%C3%A9n%C3%A9rateur-de-code) : 
    Pour générer les fichiers nécessaires, lancer à la racine du repo : 
    ```
    cd codegen
    poetry run generate all
    ```

## Pour commencer à développer

Ces instructions doivent être lancées dans le dossier `app.territoiresentransitions.fr`.

### Installer les dépendances de développement

```sh
npm i
```

### Lancer l'application en local

```sh
npm run dev
```

L'application va alors se lancer sur [localhost:3000](http://localhost:3000).

**Important** :

L'application client communique avec une API pour récupérer certaines données et les mettre à jour. Cette API est
disponible dans le dossier `api`

On peut développer l'application cliente avec une API lancée en local sur
[localhost:8000](http://localhost:8000). Pour cela, démarrer l'API, puis pour
lancer le client.

L'URL de l'API utilisée par le client est déterminée par la variable d'environment `MODE` voir `package.json` pour
les différents modes disponibles.

### Lancer la version de production en local

```sh
npm run build && npm start
```
Cette commande désactive le hot-reloading et charge les plugins nécessaires à la production.

## S'authentifier sur l'application en local

En production, pour s'authentifier, on passe par le flot Keycloack de l'ADEME. En local, on outrepasse cette 
authentification en passant par la route `/auth/token_signin`. Sur cette page, on permet deux possibilités : 
- l'authentification via un `accessToken` collecté via sandbox ou la production,
- l'authentification via un faux token.

### Connexion par token

Cette action permet d'enregistrer un `accessToken` collecté via sandbox ou la production dans `LocalStorage`.
Pour cela, aller sur `/auth/token_signin`, puis :
- Se connecter via la route `/auth/signin`. Cela va rediriger sur une url de sandbox ou de production.
- Dans les dev tools, récupérer les tokens sur la réponse de l'endpoint `v2/auth/token` ou depuis
  `LocalStorage`.
- Les coller dans les champs correspondants et cliquer sur `Se connecter`.

### Connexion avec un faux token

Cette action permet d'enregistrer un faux token dans `LocalStorage`. Ce faux token permet d'utiliser l'API comme si on 
avec un vrai token d'accès. Pour que l'API puisse accepter ce faux token, il faut lancer l'API avec la variable 
d'environnement `AUTH_DISABLED_DUMMY_USER`. 

Sur sandbox, cette fonctionnalité est activée par défaut.

## Lancer les tests end-to-end

On utilise [Cypress](https://www.cypress.io/) pour lancer nos tests end-to-end.
Pour lancer le Test Runner de Cypress :
```sh
npm i
npm run cy:open
```