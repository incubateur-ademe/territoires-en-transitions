# Business
Ce dossier contient le code de différents services python de l'outil Territoires En Transitions. 
 - Le service offline "referentiel" qui expose des CLI permettant de lire des fichiers .md, de valider leur format et de les convertir au format JSON attendus par le datalayer
 - Le service online "evaluation" qui expose une API de personnalisation et d'évaluation d'une collectivité en fonction de des réponses données et de l'état d'avancement des tâches du référentiel 

## Mode d'emploi 
### Installation
Par souci de simplicité, les services partagent les mêmes dépendances. 
Les instructions sont donc les mêmes pour tous les services. 

Créer un nouvel environnement virtuel, et y installer les paquets et la source.

```sh
python3 -m venv venv 
source venv/bin/activate 
pip install pipenv
pipenv install 
pip install -e .
```

### Lancer les tests
Pareil pour les tests, ceux-ci sont communs dans le dossier tests. 

#### Avec docker
```sh
docker-compose run business-test
```

#### Avec pipenv
```sh
pipenv run pytest tests
```

### Lancer les services
Chaque dossier comporte un README avec des instructions de lancement du service. 
