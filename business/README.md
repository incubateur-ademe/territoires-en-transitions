# Business
Ce service est responsable de "l'intelligence" de Territoires En Transitions. Il s'interface avec une couche de stockage de façon évenementielle. Ainsi, les commandes de ce service Business sont déclanchées par des évènements. 

## Organization en mode "clean-archi"
Si vous ouvrez le dossier business, vous remarquerez l'organisation suivante :

- **DOMAIN**
    - **ports:** API de dépendance où nous définissons comment l'application interagit avec des "briques" externes. Par exemple, un port de dépôt aurait une méthode "add". La mise en œuvre réelle de ces "briques" se fait par des adaptateurs.
    Les ports sont testés dans tests/unit. 

    - **Use cases:** toutes les règles métier spécifiques à l'application sont divisées en une liste de cas d'usage, chacun ayant une seule responsabilité. Par exemple: stocker le référentiel dans un dépôt.
    Les use-cases sont testés dans tests/unit.  

    - **models** objets métiers manipulés dans l'application. Parmi eux, [events](business/domain/models/events.py) et [commands](business/domain/models/events.py) qui régissent l'orchestration des cas d'usages. 

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
pip install -r requirements.txt
pip install -e ./business
```

### Lancer les tests
```
pytest tests 
```

### Lancer l'application
TODO ! 
<!-- ```
python business/entrypoints/server.py
``` -->
### Déploiement 
TODO ! 

## Flux évenementiel 
Une ébauche d'event stormming a été entrepris sur Miro, disponible [ici](https://miro.com/app/board/o9J_lnl6wNw=/)

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
- Les outils de la T.E ont besoin **d'une unique source de vérité pour les référentiels**
- L'ADEME a besoin de **pouvoir mettre à jour les référentiels**

#### Solution proposée
Pour chaque référentiel, l'ADEME tient à jour un dossier de fichiers markdowns qui décrit les actions de ce référentiel. Notre outil est chargé de parser les markdowns, vérifier leur cohérence, et stocker le référentiel en base de données. 

#### Mode d'emploi 
- Exemple de dossier markdown : [tests/data/md_referentiel_example]("tests/data/md_referentiel_example")

- Le format des actions définient dans les markdowns doit correspondre au modèle de l'object [MarkdownActionNode](business/domain/models/markdown_action_node.py)

- Les relations de parentés entre les actions (noeuds) du référentiels peuvent être faite de deux façons : 
    - Grâce à l'identifiant : Ainsi dans le dossier d'exemple, l'action 1.1 est "enfant" de l'action 1 
    - Grâce au titre clé `Actions` : Ainsi, dans le dossier d'exemple, l'action 1.1.1 est "enfant" de l'action "1.1" car elle est définie "nestée"/"imbriquée" sous le titre `Actions` de cette dernière. 
#### Flow idéal (sans erreur)
- [commands.MarkdownFolderUpdate] 
- [events.MarkdownFolder.updated] 
- [commands.ParseMarkdownFolder] 
- [events.MarkdownFolderParsed] 
- [commands.CheckReferentielAndExtractEntities]
- [events.ReferentielActionEntitiesExtracted]
- [commands.StoreReferentielActionEntities]           
- [events.ReferentielActionEntitiesStored]           
           
### Notation
#### Contexte

#### Solution proposée

#### Flow idéal (sans erreur)
