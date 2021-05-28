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

##### Mesures
```shell
poetry run extract mesures --help
```
```shell
Usage: extract mesures [OPTIONS]

  Convert source docx file to 'mesures' markdown files.

Options:
  -d, --docx TEXT            [default: ../referentiels/sources/citergie.docx]
  -c, --correspondance TEXT  [default: ../referentiels/sources/correspondance_
                             citergie_climat_pratique.xlsx]

  -o, --output TEXT          [default:
                             ../referentiels/markdown/mesures_citergie]

  --help                     Show this message and exit.
```

##### Indicateurs
```shell
poetry run extract indicateurs --help
```
```shell
Usage: extract indicateurs [OPTIONS]

  Convert source xlsx files to 'indicateurs' markdown files.

Options:
  -i, --indicateurs TEXT     [default:
                             ../referentiels/sources/indicateurs_citergie.xlsx]

  -c, --correspondance TEXT  [default: ../referentiels/sources/correspondance_cit
                             ergie_climat_pratique.xlsx]

  -o, --output TEXT          [default:
                             ../referentiels/markdown/indicateurs_citergie]

  --help                     Show this message and exit.
```

#### Le générateur de code

##### Les données métiers

On peut générer des fichiers pour le client (vues HTML, objets JavaScript) à
partir des markdowns générés par le parser. Par défaut :
- les fichiers sources pour la génération sont dans
[referentiels/markdown](referentiels/markdown),
- les objets JavaScript sont générés dans
  [client_new/generated/data](client_new/generated/data),
- les vues HTML ne sont pas générées (__elles ont servi de prototypage de départ
  pour le client avant l'utilisation de Sapper).

```shell
poetry run generate mesures --help
```
```shell
Usage: generate mesures [OPTIONS]

  Convert 'mesures' markdown files to code.

Options:
  -md, --markdown TEXT  [default: ../referentiels/markdown/mesures_citergie]
  -o, --output TEXT     [default: generated/citergie]
  --html / --no-html    [default: True]
  --json / --no-json    [default: True]
  --js / --no-js        [default: True]
  --help                Show this message and exit.
```

```shell
poetry run generate indicateurs --help
```
```shell
Usage: generate indicateurs [OPTIONS]

  Convert 'indicateurs' markdown files to code.

Options:
  -md, --markdown TEXT  [default: ../referentiels/markdown/indicateurs_citergie]
  -o, --output TEXT     [default: generated/indicateurs_citergie]
  --html / --no-html    [default: True]
  --help                Show this message and exit.
```

##### Les structures de données

On peut générer des fichiers pour le back et le client (classes Python ou
JavaScript) à partir de markdowns sources. Par défaut :
- les fichiers sources pour la génération sont dans
[codegen/definitions/shared](codegen/definitions/shared),
- les classes JavaScript sont générés dans
  [client_new/generated/models](client_new/generated/models),
- les classes Python ne sont pas générées.

```shell
poetry run generate shared --help
```
```shell
Usage: generate shared [OPTIONS]

Generate shared definitions.

Options:
-md, --markdown TEXT    [default: definitions/shared]
-o, --output TEXT       [default: generated/definition/shared]
--python / --no-python  [default: True]
--js / --no-js          [default: True]
--help                  Show this message and exit.
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
