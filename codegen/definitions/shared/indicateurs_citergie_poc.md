# Indicateurs

## Indicateur citergie
Représente un indicateur extrait de `codegen/referentiels/sources/indicateurs_citergie.xlsx`.

```yaml
IndicateurCitergie:
  id:
      type: String
  numero_citergie:
      type: String
  nom:
      type: String
  descriptif:
      type: String
  conditions:
      type: ConditionsCitergie
  mesure_ids:
      type: List[String]
  fonction_de_calcul:
      type: FonctionCalcul
```

## Fonction de calcul
Le nom d'une fonction de réduction.

```yaml
FonctionCalcul:
  nom:
    type: String
    default: add
    possibles:
        - add
```

### Les conditions d'application.
L'indicateur peut s'appliquer à une EPCI si toutes conditions sont réunies.

### Comment ça marche ?
Par exemple si la `conditions['dom']` est:
- *absente*: l'indicateur est applicable à toutes les collectivités.
- *vraie*: l'indicateur est applicable aux collectivités DOM
- *fausse*: l'indicateur est applicable aux collectivités qui ne sont *pas* DOM

```yaml
ConditionsCitergie:
  conditions:
    type: Map[String, bool]
```

