## Action d'un référentiel

Représente une action provenant d'un référentiel. Cette action est incluse avec l'application.

L'id est un identifiant unique au format `referentiel__action_id` par exemple `citergie__1.1.1` est différent
de `economie_circulaire__1.1.1`.
L'id de nomenclature correspond à la clef `id` dans les referentiels par exemple `1.1.1`.

Certaines actions disposent d'une thématique. Cette information est optionnelle.
```yaml
ActionReferentiel:
    id:
        type: String
    id_nomenclature:
        type: String
    nom:
        type: String
    thematique_id: 
        type: String
    description:
        type: Optional[String]
    contexte:
        type: Optional[String]
    exemples:
        type: Optional[String]
    ressources:
        type: Optional[String]
    points:
        type: num
    actions:
        type: List[ActionReferentiel]
```
