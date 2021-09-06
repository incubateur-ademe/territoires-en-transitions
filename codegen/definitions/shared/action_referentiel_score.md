## Action Référentiel Score

Représente le score d'une action du référentiel. Il est calculé à partir des status des actions.

referentiel_points et referentiel_percentage contiennent des informations concernant le référentiel en tant que tel, mais pas la collectivité.


```yaml
ActionReferentielScore:
    action_id:
        type: String
    action_nomenclature_id:
        type: String
    avancement:
        type: String
        options: 
            - faite
            - programmee
            - pas_faite
            - non_concernee
            - 
    points:
        type: num
    percentage:
        type: num
    potentiel:
        type: num
    referentiel_points:
        type: num
    referentiel_percentage:
        type: num
```
