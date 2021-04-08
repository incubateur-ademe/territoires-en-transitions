## Action d'un référentiel
Représente une action provenant d'un référentiel. Cette action est incluse avec l'application.

Le path est un identifiant unique au format `referentiel/action_id` par exemple `citergie/1.1.1` est différent de `economie_circulaire/1.1.1`
```yaml
ActionReferentiel:
    path:
        type: String
    id:
        type: String
    nom:
        type: String
    description:
        type: String
    actions:
        type: List[ActionReferentiel]
```
