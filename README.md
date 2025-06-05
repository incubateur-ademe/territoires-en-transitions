# Territoires en Transition

Dans le cadre des programmes d'accompagnement des collectivités dans leurs démarches de transition écologique, l'[ADEME (l'Agence de la transition écologique)](https://www.ademe.fr/) s'est associée à [beta.gouv.fr](https://beta.gouv.fr/).

L'objectif : Aider les collectivités à prioriser la mise en œuvre des actions les plus impactantes pour réussir la transition écologique.

## Description du service

### Une transition écologique lente et complexe

Les collectivités ont un rôle central à jouer dans la transition écologique. Elles possèdent les compétences et l'influence sur de nombreuses activités déterminantes pour la réussite de la transition écologique.

Une majorité des collectivités rencontrent des difficultés à mettre en place des actions à la hauteur des enjeux sur leur territoire. Au-delà des différents blocages politiques, organisationnels et financiers, ces difficultés sont directement liées à la complexité et transversalité des sujets de la transition écologique qui, pourtant, dans leur mise en oeuvre, ne sont portés que par quelques personnes au sein de la collectivité.

### Faciliter et accélérer la mise en oeuvre des actions de transition écologique

La plateforme numérique a pour objectifs de faciliter et d'accélérer la mise en oeuvre des actions ayant le plus d'impact pour la réussite de la transition écologique au sein d'une interface permettant :

- D'accéder aux référentiels d'actions de transition écologique CAE (Climat-Air-Énergie, aussi connu comme la labellisation Cit'ergie) et ECI (Économie Circulaire) et de personnaliser leur utilisation
- De gérer et suivre ses actions et indicateurs de transition écologique
- De prioriser les actions ayant le plus d'impact
- De partager la progression des réalisations et des retours d'expériences entre collectivités

## Documentation

La documentation technique du projet utilise le format Architecture Decision Record (ADR), basé sur le template par défaut du CLI [`adr-tools`](https://github.com/npryce/adr-tools).

## Organisation du dépôt

Ce dépôt Git contient :

- 2 services :
  - le ["data-layer"](./data_layer)
  - le [client](./app.territoiresentransitions.react)
- les données des référentiels en [markdown](./markdown)
- le [code du site statique](./packages/site)
- les [composants partagés](./packages/ui) entre le client et le site

Chaque dossier à la racine contient son propre `README.md` et peut a priori fonctionner de manière autonome.

Vous pouvez contribuer à notre projet [en suivant cette documentation](docs/workflows/contribuer-au-projet.md).

# Conception

La conception, des données au choix de la stack.

## Données

### Les données métier

Les contenus de notre application sont écrits en markdown, ce faisant les experts métiers travaillent dans le même dépôt
que les devs.

Ces fichiers markdowns représentent des définitions auxquelles sont rattachées des données provenant d'utilisateurs. Par
exemple un indicateur tel que [Emissions de GES](markdown/indicateurs/crte/crte_001.md)
est destiné à permettre aux utilisateurs à saisir leurs données annuelles dans notre application.

### Les données utilisateurs

Les utilisateurs saisissent pour le compte de leur collectivité des données qui sont stockées dans le `data layer` qui vérifie leurs droits en écriture grace aux
[row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Design

L'application est composée de deux éléments :
le `client`, le `data layer`.

Chacun de ses éléments a un périmètre définit :

- le `client` permet aux utilisateurs de se servir du produit et ne communique qu'avec le `data layer`
- le `data layer` se charge des données et de l'authentification.
  - Il permet au `client` de stocker les données de façon sécurisé et lui fournit les moyens via une API REST de lire
    les données simplement en lui fournissant des endpoints adaptés.
  - Il permet au `business` de stocker les données métier et d'accéder aux données utilisateurs
  - Dans le processus d'évaluation, il permet au `business` de réagir aux changements des données utilisateur et au
    `client` de réagir aux changements des évaluations.
  - Enfin, il garantit la cohérence des données.

## Stack

- Le `client` utilise React ce qui nous permet de bénéficier d'un écosystème riche. Il est développé en TypeScript.

- Le `data layer` utilise [Supabase](https://github.com/supabase/), une solution qui intègre tous
  les [services](https://supabase.com/docs/architecture) dont nous avons besoin en open source dont :

  - [gotrue](https://github.com/netlify/gotrue) pour l'authentification OAuth2
  - [PostgreSQL](https://www.postgresql.org/) la base qui nous apporte le typage et la consistence des données.
  - [PostgREST](https://postgrest.org/en/stable/) qui transforme la base de donnée en une API RESTful.

## Lancer le projet en local pour le développement

### Dépendances

- Docker, permet de lancer les conteneurs qui composent le produit. Installation simple avec [Docker Desktop](https://docs.docker.com/desktop/).
- PNPM
- [Earthly](https://earthly.dev/get-earthly) qui permet de lancer le projet et la CI en local comme en remote.
- [Supabase CLI](https://supabase.com/docs/guides/cli) pour lancer le datalayer et générer les types.

### Set up

Une fois les dépendances il suffit de lancer la commande `setup-env` avec `earthly` pour configurer les variables d'environnement de chaque projet.

```shell
earthly +setup-env
```

### Lancer les différents services en local

Pour lancer les services en local avec docker, on utilise la commande `dev` :

```shell
earthly +dev
```

Par default le client (`app`) n'est pas lancé, on peut néanmoins spécifier les options suivantes :

- `stop` : commence par stopper les services.
- `datalayer` : lance supabase.
- `business` : build et lance le business.
- `app` : build et lance l'app

On peut écrire par exemple :

```shell
earthly +dev --stop=yes --datalayer=yes --business=yes --app=no
```

### Lancer les tests

Les trois services sont des projets indépendants qui peuvent-être testés en local sous reserve que les dépendances de
développement soient installées.

Néanmoins, on peut lancer les tests avec `earthly` en utilisant des conteneurs :

```shell
# Lance le projet suivi de tout les tests.
earthly +dev

# Lance les tests indépendamment
earthly --push +db-test
earthly --push +business-test
earthly --push +app-test
earthly --push +api-test
earthly --push +deploy-test
```

## Déploiement

Aujourd'hui le `business` et le `client` sont déployés chez [Scalingo](https://scalingo.com/), le `data layer` est chez [Supabase](https://supabase.com/) en mode BaaS.

## Apps et libs

Pour lancer les apps en local :

```sh
# Lance toutes les apps en parallèle
pnpm dev

# Lance les apps nécessaire à l'app principale (app, auth, backend)
pnpm dev:app

# Lance uniquement l'app backend
pnpm dev:backend
```

Se référer au README des différents dossiers pour plus de détails.

Pour nos apps :

- `app` dans `./app.territoiresentransitions.react`
- `backend` dans `./backend`
- `auth` dans `./packages/auth`
- `panier` dans `./packages/panier`
- `site` dans `./packages/site`

Pour nos libs :

- `ui` dans `./packages/ui`
- `api` dans `./packages/api`
