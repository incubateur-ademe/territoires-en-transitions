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

TODO !

## Mode d'emploi

### Dev / tests avec docker

Aller dans le dossier `./test_only_docker` et exécuter :

```
 docker-compose up --build 
```

### Générer les types pour le Business et le Client

TODO !

### Production

TODO !

### Lancer les tests

TODO !

### Déployer

TODO !

## Generation de type

```bash
pipenv install
python typedef_cli.py --help
```

Génére les modèles client ou business à partir de [json typedefs](https://jsontypedef.com/docs/jtd-in-5-minutes/) 
pour être utilisés par
[json typedef codegen](https://jsontypedef.com/docs/jtd-codegen/)

        
### Faux utilisateurs

```yaml
1:
  email: yolo@dodo.com
  password": yolododo
2:
  email: yulu@dudu.com
  password: yulududu 
```
