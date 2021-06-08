# Codegen

- [Pré-requis](#pré-requis)
- [Pour développer](#pour-développer)
- [Pour lancer les tests](#pour-lancer-les-tests)
- [Comment on s'en sert ?](#comment-on-sen-sert-)
  - [Le parser des référentiels](#le-parser-des-référentiels)
  - [Le générateur de code](#le-générateur-de-code)
    - [Les données métiers](#les-données-métiers)
    - [Les structures de données](#les-structures-de-données)

Ce dossier regroupe des scripts pour générer différents contenus à
partir des ressources métiers de l'ADEME pour les référentiels. On distigue deux
types de contenus générés : les données métiers et les structures de ces
données métiers.

La génération des données métiers sous un format unifié, le markdown, permet de
redonner facilement la main aux personnes du métier pour mettre à jour ces
contenus.

La génération des structures de données permet d'expliciter les termes métiers
pour l'équipe de développement, mais également de partager des structures
similaires à partir d'une unique source de vérité entre le front et le back.

Voici la liste des contenus pouvant être générés par Codegen :
- des markdowns représentants le contenu des référentiels,
- des markdowns représentants la structure des données métiers (actions,
  indicateurs, EPCIs, etc.),
- des classes en JavaScript et en Python issus des markdowns de structure de
  données préalablement générés,
- des objets en JavaScript issus des markdowns de contenu préalablement générés,
- des vues issus des markdowns de contenu préalablement générés (__ceci n'est
  plus utilisé__).

## Pré-requis
- Python >= 3.9.1
- [Poetry](https://python-poetry.org/docs/#installation)

## Pour développer

On commence par installer le [gestionnaire de dépendances Poetry](https://python-poetry.org/docs/#installation).

Puis, on installe les dépendances du projet :
```sh
poetry install
```

On peut suivre la section (Comment on s'en sert ?)[#comment-on-sen-sert-] pour
en savoir plus sur l'utilisation des scripts.

## Pour lancer les tests

```sh
poetry run pytest
```

## Comment on s'en sert ?
Pour se servir des scripts et de l'outil CLI il faut [installer poetry](https://python-poetry.org/docs/#installation)

Ensuite pour mettre à jour les dépendances:
```shell
poetry update
```

### Les deux outils CLI

#### Le parser des référentiels

Ce parser permet d'extraire les données des fichier Cit'ergie et Économie
Circulaire pour créer des fichiers markdown. Par défaut :
- les fichiers sources sont ceux qui se trouvent dans
[referentiels/sources](referentiels/sources),
- les fichiers de données métiers sont générés dans
[referentiels/markdown](referentiels/markdown),
- les fichiers de structure de données sont générés dans
[codegen/definitions/shared](codegen/definitions/shared).

Par exemple, pour extraire les indicateurs Cit'ergie, on peut lancer :
```shell
poetry run extract indicateurs-citergie
```

Pour extraire un ensemble de données, lancer :
```shell
poetry run extract [COMMAND]
```
Les commandes disponibles sont :
- `domaines` : les domaines du référentiel Cit'ergie,
- `indicateurs-citergie` : les indicateurs du référentiel Cit'ergie,
- `mesures` : les mesures du référentiel Cit'ergie,
- `indicateurs-eci` : les indicateurs du référentiel Économie Circulaire,
- `orientations` : les orientations du référentiel Économie Circulaire.

Pour plus d'informations,

#### Le générateur de code

Pour générer les données métiers et les structures de données en une seule fois,
on peut lancer :
```shell
poetry run generate all
```

##### Les données métiers

On peut générer des fichiers pour le client (vues HTML, objets JavaScript) à
partir des markdowns générés par le parser. Par défaut :
- les fichiers sources pour la génération sont dans
[referentiels/markdown](referentiels/markdown),
- les objets JavaScript sont générés dans
  [generated/data](generated/data),
- les vues HTML ne sont pas générées (__elles ont servi de prototypage de départ
  pour le client avant l'utilisation de Sapper).

Par exemple, pour générer les indicateurs, lancer :
```shell
poetry run generate indicateurs
```

Pour générer un ensemble de données, lancer :
```shell
poetry run generate [COMMAND]
```
Les commandes disponibles sont :
- `actions` : toutes les actions des référentiels extraits,
- `indicateurs` : tous les indicateurs des référentiels extraits,
- `thematiques` : les thématiques des référentiels extraits.

##### Les structures de données

On peut générer des fichiers pour le back et le client (classes Python ou
JavaScript) à partir de markdowns sources. Par défaut :
- les fichiers sources pour la génération sont dans
[codegen/definitions/shared](codegen/definitions/shared),
- les classes JavaScript sont générés dans
  [generated/models](generated/models),
- les classes Python ne sont pas générées.

Pour générer les structures de données partagées, on peut lancer :
```shell
poetry run generate shared
```

## Mettre à jour les markdowns

Les markdowns générés peuvent être mis à jour via des Pull Requests. En effet,
on espère, à terme, pouvoir sortir ces fichiers markdowns dans un dépôt séparé
dont la gestion serait confiée aux personnes du métier.


### Qu'est-ce que cela signifie pour les scripts de génération ?

Idéalement, la génération des markdowns ne se fait qu'une seule fois à partir
des fichiers Excel ou Word fournis par l'ADEME.

Dans le cas où des données seraient ajoutés, une commande idempotente est
disponible pour regénérer les markdowns:
```sh
poetry run regenerate --help
```
