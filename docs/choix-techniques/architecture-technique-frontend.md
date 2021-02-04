# Architecture technique frontend

Les choix présentés ici, comme tout nos choix sont susceptibles d'évoluer conformément à
la [philosophie de l'équipe de développement](https://github.com/labels-transition/documentation/blob/main/tech/fonctionnement-de-l-equipe.md#philosophie).

- (Langages et frameworks)[#langages-et-frameworks]
  - (JavaScript)[#javascript]
  - (TypeScript)[#typescript]
- (Gérer les ressources avec Webpack)[#gérer-les-ressources-avec-webpack]
  - (postcss-loader)[#postcss-loader]
  - (ts-loader)[#ts-loader]

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

