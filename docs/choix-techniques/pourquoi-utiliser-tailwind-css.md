# Qu'est-ce que Tailwind CSS et pourquoi l'utiliser ?

[Tailwind CSS](https://tailwindcss.com/) est un framework CSS qui permet de styliser 
rapidement une page HTML sans écrire du CSS.

- [À quoi sert un framework CSS en général ?](#à-quoi-sert-un-framework-css-en-général-)
- [Pourquoi en prendre un pour LTE ?](#pourquoi-en-prendre-un-pour-lte-)
- [Pourquoi utiliser Tailwind CSS ?](#pourquoi-utiliser-tailwind-css-)

## À quoi sert un framework CSS en général ?

Un framework CSS est une base d'**outils et de règles CSS prédéfinies** que l'on peut 
implémenter dans un projet HTML/CSS. 

Principaux avantages :
- gommer les différences entre les navigateurs,
- offrir une nomenclature et convention d'écriture déjà éprouvée, 
- définir des styles de base pour positionner les éléments,
- définir des styles de base pour s'adapter aux différentes tailles d'écran,
- définir des styles de base pour gérer les couleurs, les tailles, les espacements 
  et les polices de caractères.
  
Principaux inconvénients : 
- ajout de code externe dont on ne maîtrise pas le poids,
- manque de souplesse dans l'écriture de CSS.

## Pourquoi en prendre un pour LTE ?

Nous sommes début 2021. Le projet est en phase de **prototypage**. On cherche davantage à 
se concentrer sur l'UX et les retours utilisateurs que sur l'UI ou le design. L'usage 
d'un framework CSS nous permet de nous épargner les discussions et les problématiques 
liées à l'écriture de CSS.

En termes de partage de travail côté dev, cela nous donne une sorte de **convention** 
pour écrire nos styles avec une **documentation existante** (sans qu'on ait besoin de 
l'écrire et de la justifier) Nous ne sommes pas experts CSS. Les frameworks ont résolu des 
problèmes de CSS avant nous.

Pour le produit, l'UX et le design, ca veut dire également qu'avec quelques bases simples 
de HTML et CSS, on peut prototyper des pages en suivant les styles choisis pour le 
projet (par exemple, via un [CodePen](https://codepen.io)).

## Pourquoi utiliser Tailwind CSS ?

[Tailwind CSS](https://tailwindcss.com/) est un framework CSS qui a été crée en 2017. 
Il a déjà été éprouvé plusieurs fois en production par son créateur et d'autres 
projets qui l'utilisent. En 2020, on peut dire que c'est un projet plutôt populaire. 
Cela permet d'avoir une **grande communauté pour l'entraide** (résolution de bugs, 
partage de problématiques d'intégration HTML/CSS, etc.). 
À ce jour, on compte 1000 personnes sur leur Slack et une soixantaine de contributions sur 
le dépôt GitHub (7 auteurs très actifs).

La perennité du projet semble assurée à moyen terme. En effet, Tailwind CSS est 
maintenu principalement par son créateur et son équipe qui sont financés dans 
l'entreprise que le créateur et son associé ont eux-même crées. De plus, étant sous 
licence MIT, cela permettrait de l'améliorer si nécessaire, voire faire un fork pour 
notre usage personnel.

Sur le plan technique, TailWind CSS vient avec un système de purge pour retirer les 
CSS ([PurgeCSS](https://purgecss.com/)). Ce qui est intéressant, c'est que cette 
approche fait partie de la philosophie de base de la librairie. Il y a une **attention 
qui est portée sur le poids de la CSS servie en production** et cela correspond à ce 
qu'on recherche en termes de sobriété numérique.

En anticipant un peu sur le projet, à terme, si on a besoin de créer une librairie de 
composants au lieu d'utiliser des règles CSS atomiques, Tailwind CSS propose également 
une [solution pour sortir de la phase de prototypage](https://tailwindcss.
com/docs/extracting-components). D'ailleurs, Tailwind propose eux-mêmes des composants 
déjà utilisables sur [TailwindUI](https://tailwindui.com/components), certains sont 
gratuits, d'autres payants.

Au final, avec ce framework, on peut lister les points d'attention suivants : 
- le poids des fichiers CSS finaux en production,
- la convention d'écriture des règles CSS custom,
- la convention d'écriture de composants qui étendent les styles de Tailwind.