> **Cette application client est dépréciée. La nouvelle application client se trouve maintenant dans le dossier `/client_new`.**

# Application client pour Labels Transition Écologique

- [Pré-requis](#pré-requis)
- [Pour commencer à développer](#pour-commencer-à-développer)
  - [Installer les dépendances de
    développement](#installer-les-dépendances-de-développement)
  - [Lancer l'application en local](#lancer-l-application-en-local)
- [Générer les assets](#générer-les-assets)
- [Lancer les tests](#lancer-les-tests)
- [Déployer sur le staging](#déployer-sur-le-staging)

Ce dossier regroupe toute l'application cliente pour le projet Labels Transition
Écologique.


## Pré-requis

- Node v15.6.0

## Pour commencer à développer

### Installer les dépendances de développement

```sh
npm i
```

### Lancer l'application en local

```sh
npm start
```

Cette commande lance [webpack-dev-server](https://webpack.js.org/configuration/dev-server/)
et permet de servir l'application en local sur le port `8080`. Ouvrir l'url 
http://localhost:8080 dans un navigateur pour afficher l'application.

Note: les assets sont compilés et servis par la mémoire avec webpack-dev-server. On ne 
trouvera donc pas les fichiers générés dans le dossier `./dist`. Pour écrire les 
fichiers dans le dossier `dist`, on peut utiliser la commande `npm run build`.

_Source : https://webpack.js.org/guides/development/#using-webpack-dev-server_ :
> webpack-dev-server doesn't write any output files after compiling. Instead, it keeps 
> bundle files in memory and serves them as if they were real files mounted at the server's root path.

## Générer les assets

Pour générer les assets (CSS et JavaScript), on utilise
[Webpack](https://webpack.js.org/), qui lui-même va se servir d'outils et de
plugins différents pour les CSS ou le JavaScript.

Une [documentation plus détaillée](https://lte.jetbrains.space/p/territoires-en-transitions/code/territoiresentransitions.fr/files/docs/choix-techniques/architecture-technique-frontend.md) 
décrit notre usage de Webpack dans le dossier `docs/choix-techniques`

Pour générer les assets en environnement de développement, on lance :
```sh
npm run build
```

## Lancer les tests

Pour lancer la suite de tests : 
```sh
npm run test
```

Pour lancer un test spécifique : 
```sh
npm run test -- [chemin/vers/un/fichier/ou/dossier]
```

Pour lancer des tests qui correspondent à une string ou une RegExp :
```sh
npm run test -- --grep [maRegExp]
```

## Mettre à jour les dépendances

De temps en temps, on peut vérifier les dépendances et les mettre à jour. Pour cela :


1. On lance la commande `npm outdated` pour voir ce qui n'est plus à jour. Si certains 
   modules nécessitent d'être mis à jour, on peut suivre les points 2 et 3.
2. On installe [npm-check-updates]( https://www.npmjs.com/package/npm-check-updates) en
   global et on lance `ncu -u` pour mettre à jour le `package.json`.
3. Enfin, on lance `npm i` pour avoir un nouveau `package-lock.json` à commit.
4. On crée une PR avec le `package.json` et le `package-lock.json` modifiés.

## Déployer sur le staging
 
On peut déployer l'application client manuellement.

Pour cela, on envoie les fichiers sur notre [Object Storage sur
Scaleway](https://www.scaleway.com/en/docs/object-storage-feature/) :

1- D'abord, [on configure son environnement pour pouvoir communiquer avec
Object
Storage](https://github.com/labels-transition/documentation/blob/main/tech/setup/deploiement.md).

2- On déploie en lançant la commande :
```sh
npm run deploy
```
