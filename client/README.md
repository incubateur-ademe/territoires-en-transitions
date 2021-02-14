# Application client pour Labels Transition Écologique

- [Pour commencer à développer](#pour-commencer-à-développer)
  - [Pré-requis](#pré-requis)
  - [Installer les dépendances de
    développement](#installer-les-dépendances-de-développement)
  - [Générer les styles](#générer-les-styles)
    - [Bundle CSS](#bundle-css)
    - [Bundle JavaScript](#bundle-javascript)
- [Déployer sur le staging](#déployer-sur-le-staging)

Ce dossier regroupe toute l'application cliente pour le projet Labels Transition
Écologique.

## Pour commencer à développer

### Pré-requis

- Node v15.6.0

### Installer les dépendances de développement

```
npm i
```

### Générer les assets

Pour générer les assets (CSS et JavaScript), on utilise
[Webpack](https://webpack.js.org/), qui lui-même va se servir d'outils et de
plugins différents pour les CSS ou le JavaScript.

Pour l'instant, il n'y a pas de watcher. Il faut générer les assets à chaque
modification :

```
npm run build
```

### Tests

```
npm run test
```

### Bundle CSS

Pour générer les styles, on utilise [postcss-cli](https://github.com/postcss/postcss-cli)
avec une configuration qu'on retrouve dans le fichier
[`postcss.config.js`](https://lte.jetbrains.space/p/territoires-en-transitions/code/territoiresentransitions.fr/files/client/.postcss.config.js).

La documentation pour chaque plugin est accessible en
ligne. Principalement, c'est le framework [TailwindCSS](https://tailwindcss.com/)
qui va nous permettre de styler nos éléments HTML. On se base sur les classes
qu'il nous propose et on écrit du CSS en suivant leurs conventions de style.

### Bundle JavaScript

On utilise le langage [TypeScript](https://www.typescriptlang.org/) pour générer
nos fichiers JavaScript. Pour l'instant, seul `ts-loader` est utilisé dans la
configuration Webpack. Si nécessaire plus tard, on pourrait passer sur Babel en
utilisant le preset `@babel/preset-typescript`.

## Déployer sur le staging

En attendant de mettre en place le CI, on peut déployer l'application client
manuellement.

Pour cela, on envoie les fichiers sur notre [Object Storage sur
Scaleway](https://www.scaleway.com/en/docs/object-storage-feature/) :

1- D'abord, [on configure son environnement pour pouvoir communiquer avec
Object
Storage](https://github.com/labels-transition/documentation/blob/main/tech/setup/deploiement.md).

2- On déploie en lancant la commande :
```
npm run deploy
```
