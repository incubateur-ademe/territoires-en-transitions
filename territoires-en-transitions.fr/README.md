# Site de Territoires En Transitions

- [Avant propos](#avant-propros)
- [Pré-requis](#pré-requis)
- [Pour commencer à développer](#pour-commencer-à-développer)
  - [Installer les dépendances de
    développement](#installer-les-dépendances-de-développement)
  - [Lancer l'application en local](#lancer-l-application-en-local)
  - [Lancer la version de production en local](#lancer-la-version-de-production-en-local)
- [Contenu](#contenu)

## Avant propros

Dans un soucis de sobriété, cette application génère une site statique.

Le site généré par cette application utilise le [design système de l'état](https://www.systeme-de-design.gouv.fr/).

## Pré-requis

- Node v15.6.0

## Pour commencer à développer

### Installer les dépendances de développement

```sh
npm install
```

### Lancer l'application en local

```sh
npm run dev
```

### Lancer la version de production en local

```sh
npm run build && npm run preview
```

Cette commande désactive le hot-reloading et génère les fichiers statiques pour la production.


## Contenu

L'application permet de modifier son contenu sans avoir à modifier les fichiers de code.
Les fichiers de contenu se trouvent dans le répertoire [./src/content/home](./src/content/home).
Il s'agit de fichier Markdown (et d'un fichier json).
Leur modification est directement prise en compte par l'application pour générer le contenu.
