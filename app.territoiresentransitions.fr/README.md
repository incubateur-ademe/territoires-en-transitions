# Application client pour Labels Transition Écologique

- [Pré-requis](#pré-requis)
- [Pour commencer à développer](#pour-commencer-à-développer)
    - [Installer les dépendances de
      développement](#installer-les-dépendances-de-développement)
    - [Lancer l'application en local](#lancer-l-application-en-local)
    - [Lancer la version de production en local](#lancer-la-version-de-production-en-local)
- [Déployer sur le staging](#déployer-sur-le-staging)

Ce dossier regroupe une partie de l'application cliente pour le projet Labels Transition
Écologique. Cette application est construite avec [Sapper](https://sapper.svelte.dev/).

## Pré-requis

- Node v15.6.0
- [API Territoires en Transitions](https://github.com/betagouv/api-label-transition-ecologique)
  démarrée sur [localhost:8000](http://localhost:8000).
- [Les fichiers générés par codegen](codegen#le-générateur-de-code)

## Pour commencer à développer

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
disponible sur https://github.com/betagouv/api-label-transition-ecologique.

Pour que l'application client fonctionne correctement, on peut s'assurer que l'API est lancée correctement sur
[localhost:8000](http://localhost:8000).

### Lancer la version de production en local

```sh
npm run build && npm start
```
Cette commande désactive le hot-reloading et charge les plugins nécessaires à la production.

## Déployer sur le staging

On peut déployer l'application client manuellement.

Pour cela, on envoie les fichiers sur notre [Object Storage sur
Scaleway](https://www.scaleway.com/en/docs/object-storage-feature/) :

1- D'abord, [on configure son environnement pour pouvoir communiquer avec
Object
Storage](https://github.com/labels-transition/documentation/blob/main/tech/setup/deploiement.md).

2- On build et on exporte l'application :
```sh
npm run export
```

3- On déploie avec le script de déploiement dans le dossier `/tools`:
```sh
cd tools
poetry run deploy -s staging
```
