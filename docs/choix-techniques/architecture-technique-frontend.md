# Architecture technique frontend

Les choix présentés ici, comme tout nos choix sont susceptibles d'évoluer conformément à
la [philosophie de l'équipe de développement](https://github.com/labels-transition/documentation/blob/main/tech/fonctionnement-de-l-equipe.md#philosophie).

- [Langages et framewor](#langages-et-frameworks)
  - [JavaScript](#javascript)
  - [TypeScript](#typescript)
- [Gérer les ressources avec Webpack](#gérer-les-ressources-avec-webpack)
  - [postcss-loader](#postcss-loader)
  - [ts-loader](#ts-loader)
- [Description de la stack de test](#description-de-la-stack-de-test)

## Languages et frameworks
Les languages et les frameworks ont été choisis pour remplir les exigences en terme :
- d'expérience développeur,
- d'écoconception,
- de pérennité du projet notamment en matière de recrutement.

### JavaScript
Pour le frontend nous avons choisi de programmer en JavaScript et d'éviter d'utiliser un
framework, tout du moins dans un premier temps.

En effet, nous souhaitons ne pas embarquer plus de fonctionnalités que nécessaires
dans l'application et nous prenons garde à ne pas concevoir un système en anticipant des
besoins trop à l'avance.

### TypeScript
On choisit d'étendre JavaScript avec l'utilisation du langage open-source [TypeScript](https://www.typescriptlang.org/).
Cela permet :
- d'avoir des définitions statiques qui décrivent la structure d'un objet,
- de documenter facilement et obligatoirement le code,
- de faire valider par TypeScript le code écrit, que ce soit via des plugins dans
  l'IDE ou des scripts dans le CI.

L'usage de TypeScript est nouveau pour l'équipe de développement. Dans un premier
temps, on l'adopte en mode strict pour s'approprier les subtilités du langage. Si cela
est trop contraignant, on se réserve la possibilité d'écrire de manière plus flexible.

## Gérer les ressources avec Webpack

On utilise [Webpack](https://webpack.js.org/) pour gérer les dépendances de
l'application cliente. Ce qui motive son adoption dans l'équipe :
- C'est un gestionnaire populaire dans la communauté JavaScript. Cela signifie une
  grande communauté d'entraide et également, un large éventail de problèmes rencontrés
  déjà résolus par d'autres équipes de développement.
- Il permet de nombreuses configurations en fonction des environnements de développement
  et de déploiement.
- Il propose beaucoup de l'outillage pour gérer différents types de ressources (natifs ou
  issus de frameworks),
- C'est un outil que connaît bien une personne de l'équipe de développement (Fanny).

### postcss-loader

TailwindCSS propose, par défaut, [l'usage de PostCSS](https://tailwindcss.com/docs/installation#installing-tailwind-css-as-a-post-css-plugin)
pour générer le fichier CSS final. Le loader existant pour Webpack, on choisit donc
cette implémentation-là.

### ts-loader

Pour l'instant, on utilise [ts-loader](https://github.com/TypeStrong/ts-loader)
pour transcompiler les fichiers écrits en TypeScript en fichiers JavaScript ES2020.

Dans un futur proche, afin de préserver la compatibilité avec d'anciens navigateurs, on se
servira probablement de [Babel](https://babeljs.io/) pour avoir des fichiers en JavaScript
ES5. À ce moment-là, on pourra plutôt utiliser [@babel/preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript).

## Description de la stack de test

Les tests peuvent être lancés avec la commande `npm run test`. Le schéma suivant
décrit la stack avec laquelle les tests sont lancés dans
[Node.js](https://nodejs.org/en/).

```
+-------------------------------------------------------------------------+
|                             TYPESCRIPT COMPILATION                      |
|                                                                         |
|                                                                         |
|                                                                         |
|                                                      +----------------+ |
| +--------------------------+      +-----------+      |                | |
| | TS_NODE_COMPILER_OPTIONS |      |           |      |* @types/chai * | |
| |                          +----> |* ts-node *+----> |                | |
| | .tsconfig                |      |           |      |* @types/mocha *| |
| +--------------------------+      +-----------+      |                | |
|                                                      +------+---+-----+ |
|                                                             |   |       |
|                                                             |   |       |
+-----------------------------------------------------------+ |   | +-----+
                                                              |   |
                                                              v   v

                                                   +---------------------+
                                                   |                     |
      +--------------+                             |      * mocha *      |
      |              |                             |          +          |
      | Tests output |        launches tests       |          | uses     |
      |     and      | <---------------------------+          |          |
      |   results    |                             |      +---v----+     |
      |              |                             |      |        |     |
      +--------------+                             |      |* chai *|     |
                                                   |      |        |     |
                                                   |      +--------+     |
                                                   |                     |
                                                   +---------------------+
```
- `TS_NODE_COMPILER_OPTIONS` est une [option pour
  ts-node](https://github.com/TypeStrong/ts-node#cli-and-programmatic-options) pour surcharger notre fichier de configuration pour TypeScript afin de permettre de compiler des [modules CommonJS pour NodeJS](https://nodejs.org/api/modules.html) (et non des modules es5).
- `.tsconfig` est [notre fichier de
  configuration](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) pour lister nos options de compilation pour TypeScript.
- [ts-node](https://github.com/TypeStrong/ts-node) permet l'exécution de TypeScript dans Node.js.
- [@types/chai](https://www.npmjs.com/package/@types/chai) donne les
  définitions de types pour la librarie [Chai](https://www.chaijs.com/).
- [@types/mocha](https://www.npmjs.com/package/@types/mocha) donne les
  définitions de types pour le framework [Mocha](https://mochajs.org/)
- [Mocha](https://mochajs.org/) est le framework de test qui permet de lancer
  les tests dans Node.js.
- [Chai](https://www.chaijs.com) est la librairie d'assertion utilisée pour
  écrire les tests. La documentation pour l'API est disponible sur
  https://www.chaijs.com/api/bdd/.

