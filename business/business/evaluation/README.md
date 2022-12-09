
# API Evaluation

## Contexte

Dans l'application, les utilisateurs renseignent les statuts des tâches des référentiels et visualisent les scores des différents niveaux mis à jour en temps réel.
Également, ils renseignent des informations sur leur collectivité qui permettent de personnaliser le barème du référentiel.

## Solution mise en place

Lorsqu'un nouveau statut ou une nouvelle réponse est sélectionné par l'utilisateur : 
- le client écrit dans le datalayer le nouveau statut ou la nouvelle réponse
- au moment de la mise à jour de la donnée, le datalayer appelle l'API  
- à partir des statuts, des conséquences de la personalisation et de la structure du référentiel, l'API calcul et renvoie une liste de scores 
- le datalayer sauvegarde ces scores dans une table 
- enfin, les événements de changements des scores sont transmis au client par websocket. 


### Performance

`run_evaluation.py` calcule 100 fois les scores pour une collectivité. 
On obtient les temps moyens d'exécution suivants pour chaque référentiel sur un macbook pro M1 :  
- **CAE**: 85.71 ms
- **ECI**: 9.56 ms

## Lancer l'application

On peut lancer l'application avec python
```sh
uvicorn api:app
```

Ou bien en utilisant le conteneur Docker.

```sh
# build de l'image
docker build -f dev.Dockerfile -t tet-business .
# démarrer l'image
docker run -d tet-business
```

## Déploiement 

Le service est déployé sur [Scalingo](https://doc.scalingo.com/)
