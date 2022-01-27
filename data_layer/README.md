# Data-Layer
Le Data-Layer est responsable des lectures/écritures en base, c'est à dire de:

- stocker des données
    - provenant du business (referentiel, scores calculés...)
    - provenant du client (toutes valeurs saisies dans l'application)
- notifier d'un changement en base
    - au business (ex : nouveau statut d'une action, qui déclenchera le moteur de notation pour mettre à jour les
      scores)
    - au client (ex : un nouveau score a été calculé, donc les jauges doivent être mises à jour dynaamiquement)
- fournir au client des vues prêtes à consommer

## Organisation du dossier
- `postgres/content` : le contenu exporté par le `business`. Destiné à disparaitre, `business` stockera directement les
  données par la suite
- `postgres/definitions` : le schema du datalayer, les modèles, types et fonctions.
- `postgres/fakes` : des fausses données utilisées pour développer/tester [readme](data_layer/postgres/fakes/README.md)
- `postgres/tests` : début de tests en sql, on utilisera [pgtap](https://pgtap.org/) par la suite 
- `requests` : des requêtes http pour tester l'API [readme](data_layer/requests/README.md)
- `test_only_docker` : une appli docker compose utilisée pour développer/tester 
- `tests` : tests en python

## Mode d'emploi

### Pré-requis

- psql (on peut l'installer sur Mac avec brew : `brew install postgresql`)
- docker

### Dev / tests avec docker

Aller dans le dossier `./test_only_docker` et exécuter :

```bash
 docker-compose up --build
```

Ensuite utiliser `insert_all.sh` pour insérer les contenus de test.

Redémarrer le container `postgrest` après les insertions pour que l'API soit regénérée.

## Générer les types pour le Business et le Client

```bash
pipenv install
python typedef_cli.py --help
```

Génére les modèles client ou business à partir de [json typedefs](https://jsontypedef.com/docs/jtd-in-5-minutes/) pour être utilisés par
[json typedef codegen](https://jsontypedef.com/docs/jtd-codegen/)
