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

- 3 services :
  - le ["data-layer"](./data_layer)
  - le [client](./apps/app)
- le [code du site statique](./apps/site)
- les [composants partagés](./packages/ui) entre le client et le site

Chaque dossier à la racine contient son propre `README.md` et peut a priori fonctionner de manière autonome.

Vous pouvez contribuer à notre projet [en suivant cette documentation](docs/workflows/contribuer-au-projet.md).

# Conception

La conception, des données au choix de la stack.

## Données

### Les données métier

Les données métier suivantes sont stockées sur des spreadsheets partagés:

- La définition des indicateurs
- Les questions de personnalisation
- La définition des référentiels (actions, preuves)

Cela permet de bénéficier des avantages suivants par rapport aux markdown employés jusqu'alors:

- Edition facilitée sans connaissance de la syntaxe markdown (y compris en utilisant des tris / filtres du tableau) par des personnes métier sans impacter les équipes de développement.
- Gestion de l'historique facilement accessible.
- Contrôle de validité des données saisies simplifié:
  - Validation directement dans le spreadsheet lorsque cela est faisable à travers des listes déroulantes par exemple.
  - Fonctionnalité de validitation du contenu faisant appel au backend intégrée sous forme de bouton.

## Stack

- Le `client` utilise React ce qui nous permet de bénéficier d'un écosystème riche. Il est développé en TypeScript.

- Le `data layer` utilise [Supabase](https://github.com/supabase/), une solution qui intègre tous
  les [services](https://supabase.com/docs/architecture) dont nous avons besoin en open source dont :

  - [gotrue](https://github.com/netlify/gotrue) pour l'authentification OAuth2
  - [PostgreSQL](https://www.postgresql.org/) la base qui nous apporte le typage et la consistence des données.
  - [PostgREST](https://postgrest.org/en/stable/) qui transforme la base de donnée en une API RESTful.

- le `business` est développé en Python 🐍.

## Lancer le projet en local pour le développement

### Dépendances

- Docker, permet de lancer les conteneurs qui composent le produit. Installation simple avec [Docker Desktop](https://docs.docker.com/desktop/).
- [act](https://nektosact.com/) qui permet de lancer le projet en local avec les mêmes actions que celles utilisées en CI. Voir plus d'information dans le [README](./.github/README.md) de notre configuration de CI.
- [Supabase CLI](https://supabase.com/docs/guides/cli) pour lancer le datalayer et générer les types.

### Package manager

**⚠️ Ce projet utilise exclusivement [`pnpm`](https://pnpm.io/).**

- **Espace disque optimisé**: stockage partagé des dépendances entre projets
- **Sécurité**: résolution stricte des dépendances et `node_modules` non-plat
- **Performance**: installation plus rapide et meilleure prise en charge des monorepos


Pour installer les dépendances avec pnpm il est nécessaire que la clé `BRYNTUM_ACCESS_TOKEN` soit définie dans votre environnement et que les deux commandes suivantes aient été lancées avant de pouvoir lancer la commande `pnpm i`.

```sh
pnpm config set '@bryntum:registry' 'https://npm.bryntum.com'
pnpm config set '//npm.bryntum.com/:_authToken' "$BRYNTUM_ACCESS_TOKEN"
```

### Lancer les différents services en local

Pour lancer la base de données et les autres services en local avec docker, on utilise la commande `db-init` :

```shell
act -j db-init
```

Cette commande va réaliser tout ou partie des opérations suivantes, en fonction de si les fichiers du répertoire `data_layer` ont été modifiés ou non depuis la dernière exécution de la commande :

- démarrer redis
- démarrer les services supabase
- tenter de réinitialiser la base depuis la dernière copie du volume si il existe
- passer les migrations sqitch
- importer les définitions d'indicateurs et les référentiels depuis les spreadsheets
- charger les données de tests
- générer une copie du volume de la base de données dans une image docker afin de pouvoir la restaurer rapidement (voir ci-dessous)

L'image contenant la copie du volume de la base est taguée avec le hash du répertoire `data_layer`. Le contenu de la base (structure et données) et le nom de cette image peuvent donc variés d'une branche à une autre.

Lorsque l'on passe d'une branche à une autre il peut donc être nécessaire de lancer à nouveau cette commande `db-init` pour avoir la version de la base correspondant à la branche en cours.

### Restaurer l'état initial de la base

Pour réinitialiser l'état initial des données de tests de la base (par exemple lorsque on a fait des tests manuels ou importer de données depuis la staging via [pgsync](./data_layer/pgsync/README.md)) on utilise la commande `db-restore` :

```shell
act -j db-restore
```

Celle-ci va restaurer la copie du volume de la base de données généré par la commande `db-init` pour la branche en cours.

### Réinitialiser complètement la base

Lorsque l'on veut être sûr de bien regénérer l'état initial de la base locale (exécution des migrations, imports des définitions et des données de test) correspondant à la branche en cours, on utilise la commande `db-delete` :

```shell
act -j db-delete
```

Celle-ci réalise les opérations suivantes :

- arrêter tous les services supabase
- supprimer le volume docker de la base
- supprimer l'image encapsulant la dernière copie du volume de la base (correspondant à la branche courante)

Après son exécution la commande `db-init` (voir ci-dessus) doit être à nouveau exécutée.

### Lancer les tests

Les trois services sont des projets indépendants qui peuvent-être testés en local sous reserve que les dépendances de
développement soient installées.

Néanmoins, on peut lancer les tests avec `earthly` en utilisant des conteneurs :

```shell
# Lance le projet suivi de tout les tests.
earthly +dev

# Lance les tests indépendamment
earthly --push +db-test
earthly --push +app-test
earthly --push +api-test
earthly --push +deploy-test
```

## Déploiement

Les services sont déployés chez [Koyeb](https://koyeb.com/) dans la zone PAR (Paris), le `data layer` est chez [Supabase](https://supabase.com/) en mode BaaS et est hébergé en Europe.

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

- `app` dans `./apps/app`
- `backend` dans `./apps/backend`
- `auth` dans `./apps/auth`
- `panier` dans `./apps/panier`
- `site` dans `./apps/site`

Pour nos libs :

- `ui` dans `./packages/ui`
- `api` dans `./packages/api`
