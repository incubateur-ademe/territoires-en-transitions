## Indicateur d'un référentiel

Représente un indicateur provenant d'un référentiel. Cet indicateur est inclus avec l'application.

L'id est un identifiant unique au format `referentiel__action_id` par exemple `citergie__1.1.1` est différent
de `economie_circulaire__1.1.1`.
L'id de nomenclature correspond à la clef `id` dans les referentiels par exemple `1.1.1`.

Certaines actions disposent d'une thématique. Cette information est optionnelle.
```yaml
IndicateurReferentiel:
    id:
        type: String
    action_ids:
        type: List[String]
    nom:
        type: String
    description:
        type: String
    thematique_id:
        type: String
    unite:
        type: String
```
