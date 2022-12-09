# Referentiels

## Contexte
L'ADEME et ses partenaires proposent aux collectivités des [référentiels](https://territoireengagetransitionecologique.ademe.fr/) permettant un état des lieux rapide de leur politique territoriale. 

**Besoins :**
- Les outils de la transition écologique ont besoin **d'une unique source de vérité pour les référentiels**
- L'ADEME a besoin de **pouvoir mettre à jour les référentiels**

## Solution mise en place
Pour chaque référentiel, l'ADEME tient à jour un dossier de fichiers markdowns qui décrit les actions de ce référentiel.
Notre outil est chargé de parser les markdowns, vérifier leur cohérence et écrire les contenus dans un format JSON, qui sera ensuite ingéré par le datalayer. 


Les types contenus sont les suivants : 
  - Actions
  - Indicateurs 
  - Questions et Règles de personnalisation
  - Preuves 

## Contenus des référentiels

### Actions 
Un référentiel est un arbre à plusieurs niveaux, par exemple : 
```
1. Axe
  1.1 Sous-axe
    1.1.1 Action 
      1.1.1.1 Sous-action 
        1.1.1.1.1 Tâche 
```
On appelle "action", un nœud de cet arbre.

Ces actions sont définies dans des markdowns, définis comme [tests/data/md_referentiel_example_ok](../../tests/data/md_referentiel_example_ok).
Le format des actions définies dans les markdowns doit correspondre au modèle de l'objet [MarkdownAction](./convert_actions.py). 

Les relations de parenté entre les actions (nœuds) du référentiel peuvent être faite de deux façons : 
      - Grâce à l'identifiant : Ainsi dans le dossier d'exemple, l'action 1.1 est "enfant" de l'action 1 
      - Grâce au titre clé `Actions` : Ainsi, dans le dossier d'exemple, l'action 1.1.1 est "enfant" de l'action "1.1" car elle est définie "nestée"/"imbriquée" sous le titre `Actions` de cette dernière.

### Indicateurs 

Des indicateurs du référentiel permettent de suivre les progrès d'une collectivité, en fonction des objectifs qu'elle s'est donnés. 
Ces indicateurs sont définis dans des markdowns, définis comme [tests/data/md_indicateurs_example_ok](../../tests/data/md_indicateurs_example_ok/indicateur_example.md).

Le format des indicateurs définis dans les markdowns doit correspondre au modèle de l'objet [MarkdownIndicateur](./convert_indicateurs.py). 

À noter : 
 - Les indicateurs sont liés à plusieurs actions du référentiel (voir le champ "actions")
 - Les valeurs des indicateurs peuvent être liées, si bien que si la collectivité renseigne une valeur pour un indicateur, celle-ci est reportée sur un autre indicateur (voir le champ "valeur") 

### Preuves 

Les preuves sont des fichiers réglementaires que la collectivité doit rassembler en vue d'une labellisation. 

À noter : 
 - Les preuves réglementaires sont liées à des actions du référentiel (voir le champ "actions")

### Questions et Règles de personnalisation

Voir les détails dans [la page notion correspondante](https://www.notion.so/territoires-en-transitions/Personnalisation-du-r-f-rentiel-84af6ab9922d4a6a957de2b5bcfced16) (accessible aux seuls membres de l'équipe pour l'instant).

Toutes les collectivités ne sont pas évaluées selon le même barême.  
En effet, en fonction de type de collectivité, de la taille et des compétences, certaines actions sont désactivées ou ont des potentiels réduits. 
La définition de la personnalisation des référentiels a ainsi lieu en deux étapes : 
 1. Questions 
 2. Règles de personnalisation 

#### Questions

Les questions sont définies dans des markdowns, définis comme [tests/data/md_questions_example_ok](../../tests/data/md_questions_example_ok/question_example.md).
Le format des questions définies dans les markdowns doit correspondre au modèle de l'objet [MarkdownQuestion](parse_questions.py). 

Il y a trois types de questions :
- **binaire** : la réponse est binaire OUI/NON, par ex : "La collectivité a-t-elle une population inférieure à 100 000 habitants ?"
- **choix** : la réponse est l'une des options proposées, par ex "La collectivité a-t-elle la compétence éclairage public ?" Options => ["Oui  uniquement sur les zones d’intérêt communautaire", "Non"]
- **proportion** : la réponse est une float entre 0 et 1, par ex : "Quelle est la part de la collectivité dans la structure compétente en matière d'éclairage public ?"
    
    
#### Règles

Les règles sont définies dans des markdowns, définis comme [tests/data/md_personnalisation_example_ok](../../tests/data/md_personnalisation_example_ok/regles_example.md).
Le format des règles définies dans les markdowns doit correspondre au modèle de l'objet [MarkdownPersonnalisation](parse_regles.py). 

Afin d'éviter les conflits de personalisation entre actions, on n'applique qu'une seule personnalisation par action. 
Il y a trois types de règles possibles dans une personnalisation : 
  - Désactivation : 
    - la sortie de la règle est un booléen et la conséquence est la désactivation de l'action en question.
    - Exemple de formule : `**reponse**(***dechets_1, NON)*** **ou reponse(dechets_3, NON)**` signifie que l'action sera désactivée si la collectivité répond NON à l'un des questions `dechets_1` ou `dechets_3`
    
  - Réduction : 
    - la sortie de la règle est un float, et la conséquence est la réduction du postentiel de l'action en question. 
    - Exemple de formule : `**max(reponse(mobilite_2), 0.5)** ` signifie que le potentiel de l'action sera réduit proportionnellement à la réponse à la question mobilite_2 dans la limite de 50%. 

  - Score :  
    - Un seul cas : Le score de la 3.3.5 ne peut pas dépasser le score de la 1.2.3
    - Formule : `**min(score(cae_1.2.3), score(cae_3.3.5 ))** ` 


## Command Line Interfaces (CLI)

Le point d'entrée de ce service est le fichier "cli.py"

Conversion des actions : 

```
python business/referentiel/cli.py parse-actions --input-markdown-folder "../markdown/referentiels/cae" --output-json-file "../data_layer/content/cae.json"
``` 

Conversion des indicateurs : 

```
python business/referentiel/cli.py parse-indicateurs --input-markdown-folder "../markdown/indicateurs/**" --output-json-file "../data_layer/content/indicateurs.json"
```

Mise à jour des preuves : 

  ```
  python business/referentiel/cli.py parse-preuves --input-markdown-folder "../markdown/preuves" --output-json-file "../data_layer/content/preuves.json"
  ```

Mise à jour des questions et règles :
```
python business/referentiel/cli.py parse-personnalisations --questions-markdown-folder "../markdown/questions"  --regles-markdown-folder "../markdown/personnalisations" --output-json-file "../data_layer/content/personnalisations.json"
```

## Et après ? 

Une fois que les définitions des fichiers markdowns ont été convertis en JSON, ils sont insérés dans une table du data_layer,
ce qui déclenche une fonction de mise à jour des tables de définition de contenus du datalayer.
