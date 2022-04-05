# Business
Ce service est responsable de "l'intelligence" de Territoires En Transitions. Il s'interface avec une couche de stockage de façon évenementielle. Ainsi, les commandes de ce service Business sont déclanchées par des évènements. 

## Organisation en mode "clean-archi"
Si vous ouvrez le dossier business, vous trouverez un dossier par "domaines": Referentiel, EPCI, Evaluation, ... 
Puis, au sein de chaque dossier, vous remarquerez l'organisation suivante :

- **DOMAIN**
    - **ports:** API de dépendance où nous définissons comment l'application interagit avec des "briques" externes. Par exemple, un port de dépôt aurait une méthode "add". La mise en œuvre réelle de ces "briques" se fait par des adaptateurs.
    Les ports sont testés dans tests/unit. 

    - **Use cases:** toutes les règles métier spécifiques à l'application sont divisées en une liste de cas d'usage, chacun ayant une seule responsabilité. Par exemple: stocker le référentiel dans un dépôt.
    Les use-cases sont testés dans tests/unit.  

    - **models** objets métiers manipulés dans l'application. Parmi eux, `events.py` qui régissent l'orchestration des cas d'usages. 

- **ADAPTATERS**:
    La mise en œuvre réelle des ports. Par exemple, un dépôt pourrait être implémenté avec la base de données Postgres, donc la méthode "add" serait un INSERT. 
    Les adapters sont testés dans tests/integration. 

- **ENTRYPOINTS**:
  TODO ! 
   <!-- - ./server.py: le script pour lancer l'application.
   - ./config.py: préparation des instances de l'application.
   Le serveur est testé dans tests/e2e.  -->

## Mode d'emploi 
### Installation
Créer un nouvel environnement virtuel, et y installer les paquets et la source.
```
python3 -m venv venv 
source venv/bin/activate 
pip install pipenv
pipenv install 
pip install -e .
```

### Lancer les tests
#### Unitaires
```
pytest tests/unit
```
#### Intégrations et end-to-end
Pour certains tests d'intégrations et pour les tests de bout-en-bout, il est nécessaire de lever un service SupaBase : 
```
    cp ../data_layer/test_only_docker/.env.sample  ./data_layer/test_only_docker/.env 
    docker-compose -f ../data_layer/test_only_docker/docker-compose.yml up --build
```
Puis :
```
pytest tests 
```

### Lancer l'application
On peut lancer l'application avec python
```
python business/evaluation/entrypoints/start_realtime.py
```

Ou bien en utilisant le container Docker.

```sh
# build de l'image
docker build -f dev.Dockerfile -t tet-business .
# démarrer l'image
docker run -d tet-business
```

### Déploiement 
Le service est déployé sur [Scalingo](https://doc.scalingo.com/) dans un worker, le fichier de configuration `Procfile` permet de démarrer ce 
worker.
Attention, notre service n'expose pas de container `web`, 
il faut donc scaler le nombre de containers `web` à 0 pour que les déploiments fonctionnent.

## Flux évenementiel 
Une ébauche d'event stormming a été entrepris sur Miro, disponible [ici](https://miro.com/app/board/o9J_lnl6wNw=/). 

À noter que la logique adoptée est un maximum évènementielle. Par exemple, on ne lève pas d'Exception en cas d'erreur, on publie un évènement d'échec, qui sera traité de façon à part entière. 

## Cas d'usages (eg. Services / Fonctionnalités)


### Referentiels
#### Contexte
L'ADEME et ses partenaires proposent aux collectivités des [référentiels](https://territoireengagetransitionecologique.ademe.fr/) permettant un état des lieux rapide de leur politique territoriale. 
Un référentiel est un arbre à plusieurs niveaux, par exemple : 
```
1. Axe
  1.1 Sous-axe
    1.1.1 Action 
      1.1.1.1 Sous-action 
        1.1.1.1.1 Tâche 
```
#### Besoins
- Les outils de la transition écologique ont besoin **d'une unique source de vérité pour les référentiels**
- L'ADEME a besoin de **pouvoir mettre à jour les référentiels**

#### Solution proposée
Pour chaque référentiel, l'ADEME tient à jour un dossier de fichiers markdowns qui décrit les actions de ce référentiel. Notre outil est chargé de parser les markdowns, vérifier leur cohérence, et stocker le référentiel en base de données. 

#### Mode d'emploi 
- Exemple de dossier markdown : [tests/data/md_referentiel_example]("tests/data/md_referentiel_example")

- Le format des actions définient dans les markdowns doit correspondre au modèle de l'object [MarkdownActionNode](business/domain/models/markdown_action_node.py)

- Les relations de parentés entre les actions (noeuds) du référentiels peuvent être faite de deux façons : 
    - Grâce à l'identifiant : Ainsi dans le dossier d'exemple, l'action 1.1 est "enfant" de l'action 1 
    - Grâce au titre clé `Actions` : Ainsi, dans le dossier d'exemple, l'action 1.1.1 est "enfant" de l'action "1.1" car elle est définie "nestée"/"imbriquée" sous le titre `Actions` de cette dernière.    
           
### Notation
#### Contexte
Dans l'application, les utilisateurs remplissent les statuts des tâches des référentiels et visualisent les scores des différents niveaux mis à jour en temps réel. 
#### Solution proposée
Lorsqu'un nouveau statut est sélectionné pour une tâche : 
1. le client écrit dans le data-layer le nouveau statut
2. au moment de la mise à jour du statut dans le data-layer, un "événement" est émis 
3. le business observe ces évènements, qui déclenchent le moteur de notation
4. une fois les scores calculés, le business met à jour les scores dans le data-layer
5. enfin, les scores sont "poussés" vers le client afin de mettre à jour les composants
