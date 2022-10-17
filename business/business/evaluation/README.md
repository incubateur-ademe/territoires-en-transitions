
# Evaluation
## Contexte
Dans l'application, les utilisateurs renseignent les statuts des tâches des référentiels et visualisent les scores des différents niveaux mis à jour en temps réel.
Également, ils renseignent des informations sur leur collectivité qui permettent de personnaliser le barême du référentiel. 

## Solution proposée

Lorsqu'un nouveau statut est sélectionné pour une tâche : 
1. le client écrit dans le data-layer le nouveau statut
1. au moment de la mise à jour du statut, le data-layer appelle `POST/evaluate` à l'API  
1. à partir des statuts, des conséquences de la personnlisation et de la structure du référentiel, l'API estime et renvoie une liste de scores 
1. le datalayer sauvegare ces scores dans une  table 
1. enfin, ces scores sont "poussés" vers le client afin de mettre à jour les composants

Le procédé est le même lorsqu'une réponse à une question est donnée :
1. le client écrit dans le data_layer la nouvelle réponse
1. au moment de la mise à jour de la réponse, le data-layer appelle `POST/personnalize` à l'API  
1. à partir des réponses et des règles de personnalisation, l'API estime et revoie une liste de conséquences 
1. le datalayer sauvegarde ces conséquences dans une table 
1. l'écriture de ces conséquences déclenchent un re-calcul des scores (appel à `POST/evaluate`, maj des tables, maj des scores dans le client)

## Lancer l'application
On peut lancer l'application avec python
```sh
uvicorn api:app
```

Ou bien en utilisant le container Docker.

```sh
# build de l'image
docker build -f dev.Dockerfile -t tet-business .
# démarrer l'image
docker run -d tet-business
```

## Déploiement 
Le service est déployé sur [Scalingo](https://doc.scalingo.com/) dans un worker, le fichier de configuration `Procfile` permet de démarrer ce 
worker.
Attention, notre service n'expose pas de container `web`, 
il faut donc scaler le nombre de containers `web` à 0 pour que les déploiments fonctionnent.
