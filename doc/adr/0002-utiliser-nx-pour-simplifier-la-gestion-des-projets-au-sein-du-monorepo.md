# 2. Utiliser Nx pour simplifier la gestion des projets au sein du monorepo

Date: 2024-10-01

## Status

Accepted

## Context

Les problèmes aujourd'hui :

1. Workspaces `npm` sans gestion de l'ordre des builds des libs dépendantes

   L'app principale est dépendante de `package/api` et `package/ui` et les changements ne sont pas toujours bien pris en compte par le serveur de dev. Il faut regulièrement stopper le serveur, puis le relancer pour assurer que les libs ont correctement été build.

2. Dépendances `npm` indépendantes pour chaque projet, même entre celles de l'app et celles des libs `ui` et `api` par exemple

   Cela complexifie la montée de version des librairies – qu'il faut faire dans plusieurs `package.json` différents – avec un fort risque de conflits de version entre les packages dépendants.

3. Hétérogénité des outils et des configs utilisés dans les différents projets

   Des configs Typescript et ESLint différentes suivants les projets car chaque fichier de conf est dupliqué. On réinvente la roue pour configurer tel ou tel outil dans tel projet, sans faire monter en qualité l'ensemble des projets qui utilisent cet outil.

## Decision

[Nx](https://nx.dev/getting-started/why-nx) devient le point d'entrée par défaut pour :

- builder les apps de prod
- servir les apps en dev
- lancer les tests
- installer de nouveaux outils dans le monorepo

→ Voir la section `scripts` du `package.json` pour comprendre les commandes `nx` utilisées pour builder ou lancer les apps.

## Consequences

1.  Un unique `package.json` (et un unique `node_modules`) à la racine du projet

    Toutes les dépendances des différentes apps et libs sont rassemblées dans le même `package.json`. Il existe désormais une unique version de dépendances commune à tous les projets.

    → Fini les conflits de versions entre apps et libs

    Voir :

    - https://nx.dev/concepts/integrated-vs-package-based
    - https://nx.dev/concepts/decisions/dependency-management#single-version-policy

2.  Eslint / Prettier

    Uniformisation de nos standards ESlint et prettier, en utilisant les défauts proposés par Nx (standard des communautés open-source, Nextjs, etc).

3.  Vitest = nouveau test runner

    Suppression de chai côté app et package api, on utilise désormais vitest pour tous les tests unitaires + intégrations

4.  PNPM

    Suite à des problèmes d'import avec `npm`, j'en profite pour passer à `pnpm` : plus rapide et plus efficace dans les résolutions croisées.

5.  Quelques bonus pour une meilleure maintenabilité du code

    Renforcement des ["module boundaries"](https://nx.dev/features/enforce-module-boundaries) : Nx s'assure qu'un package créé avec une finalité particulière la respecte en levant des erreurs si ce n'est pas le cas (ex 1 : le package auth ne peut appeler que le package ui ou api, ex 2 : le package api ne peut pas utiliser de dépendance externe de libs front, etc)

    Nx vient avec une CLI de génération automatique de code, projet, librairie, etc, et facilite l'ajout de nouvels outils ou de plugins.

    In fine Nx enforce un certain nombre de bonnes pratiques d'organisation du code et d'un monorepo en proposant un standard éprouvé.
