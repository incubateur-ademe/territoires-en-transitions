# Codegen
Génération de code pour Labels Transition Écologique

### Pour quoi faire ?
- Générer des classes et des objets en js et en python pour la communication entre le back et le front (et peut être des formulaires) à partir de yaml contenu dans des fichiers markdown.
- Générer des vues (plus tard peut-être une API) à partir de fichiers markdown, afin de séparer la partie métier de la couche de présentation.

### Comment on s'en sert ?
Pour se servir des scripts et de l'outil CLI il faut [installer poetry](https://python-poetry.org/docs/#installation)

Ensuite pour mettre à jour les dépendances:
```shell
poetry update
```

#### Les deux outils CLI

##### Le parser citergie
Permet d'extraire le fichier Word citergie `referentiels/source/citergie.docx`  pour créer des fichiers markdown.
Plus tard on pourra faire la même chose avec le référentiel ECi.

```shell
poetry run extract citergie --help
```
```
Usage: extract citergie [OPTIONS]

  Convert source docx file to 'mesures' markdown files.

Options:
  -d, --docx TEXT    [default: referentiels/source/citergie.docx]
  -o, --output TEXT  [default: referentiels/extracted/citergie]
  --help             Show this message and exit.

```

##### Le générateur de code
Permet de générer des 'vues' à partir des fichiers générés par le parser.

```shell
poetry run generate mesures --help
```
```
Usage: generate mesures [OPTIONS]

  Convert 'mesures' markdown files to code.

Options:
  -md, --markdown TEXT  [default: referentiels/extracted/citergie]
  -o, --output TEXT     [default: generated/citergie]
  --html / --no-html    [default: True]
  --json / --no-json    [default: True]
  --js / --no-js        [default: True]
  --help                Show this message and exit.
```

Permet de générer du code partagé à partir des fichiers markdown `definitions/shared`.
```shell
poetry run generate shared --help
```
```
Usage: generate shared [OPTIONS]

Generate shared definitions.

Options:
-md, --markdown TEXT    [default: definitions/shared]
-o, --output TEXT       [default: generated/definition/shared]
--python / --no-python  [default: True]
--js / --no-js          [default: True]
--help                  Show this message and exit.
```

### On en est où ?
-[ ] Raccorder au front
-[x] Écriture de tests de base
-[x] Faire un outil en ligne de commande
-[x] Parser le md/yaml et générer des sorties de démo en JS et python.
-[x] Parser ces fichiers md et générer des exemples de module et de pages html en sortie.
-[X] Parser le docx citergie pour générer des fichiers markdown

