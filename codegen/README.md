# Codegen
Génération de code pour Labels Transition Écologique

### Pour quoi faire ?
- Générer les données à partir de fichiers markdown, afin de séparer la partie métier de la couche de présentation, notamment pour donner de l'autonomie sur le contenu au personnes ayant une expertise métier mais ne développant pas.
- Générer des classes et des objets en js et en python pour la communication entre le back et le front (et peut être des formulaires) à partir de yaml contenu dans des fichiers markdown.


### Comment on s'en sert ?
Pour se servir des scripts et de l'outil CLI il faut [installer poetry](https://python-poetry.org/docs/#installation)

Ensuite pour mettre à jour les dépendances:
```shell
poetry update
```

#### Les deux outils CLI
Les outils CLI utilisent [Typer](https://typer.tiangolo.com/typer-cli/) pour obtenir des informations sur les paramètres on utilise `--help`

##### Le parser
Permet d'extraire les documents office source des référentiels Cit'ergie et Économie Circulaire

Pour extraire le fichier Word citergie et la table de correspondance climat pratic pour créer des fichiers markdown.

```shell
poetry run extract mesures
```

On peut faire la même chose pour le référentiel ECi :

```shell
poetry run extract orientations
```

Pour l'instant les indicateurs extraits sont ceux de Cit'ergie :
```shell
poetry run extract indicateurs
```


##### Le générateur de code
Permet de générer du code à partir des fichiers markdown des référentiels situés dans `/referentiels` et des 'définitions' situés dans `codegen/definitions/shared`

Pour générer tous les fichiers on utilise :
```shell
poetry run generate all
```

Pour plus d'information :
```shell
poetry run generate --help
```

### On en est où ?
- [ ] Utiliser les définitions pour l'API
- [x] Utiliser les définitions pour le front
- [x] Écriture de tests de base
- [x] Faire un outil en ligne de commande
- [x] Parser le md/yaml et générer des sorties de démo en JS et python.
- [x] Parser ces fichiers md et générer des exemples de module et de pages html en sortie.
- [X] Parser le docx citergie pour générer des fichiers markdown

