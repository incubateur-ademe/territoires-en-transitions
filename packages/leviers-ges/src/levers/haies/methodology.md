# Gestion des haies

Identifiant : `haies`. Périmètre du tableur : région, département, EPCI (aucune question ouverte, aucune interprétation à encoder). La requête ne porte pas de territoire.

## Formule

```
Stockage (tCO2e/an) = km de haies plantées par an, nets des arrachages × FS
```

La collectivité saisit le net elle-même. La formule est « directe » (`GestionHaies!B12`). Aucune donnée de territoire n'entre dans le calcul : la requête ne porte pas de territoire et en refuse un (clé `territory` non reconnue).

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `hedgeKmCreatedPerYear` | km/an | aucune dans le tableur ; une valeur négative (arrachage net) est admise et donne une réduction négative |
## Constantes

| Constante | Valeur | Unité | Source |
|---|---|---|---|
| `HEDGE_STORAGE_FACTOR` (`FS`) | 1,17 (0,77 + 0,4) | tCO2e/km/an | Label bas carbone, méthode Haies, webinaire du 25/01/2021 p. 6 : carbone du sol 0,77 + biomasse racinaire 0,4 (bornes basses). La biomasse aérienne n'est pas comptée |

## Cas de test

| Entrée | Résultat |
|---|---|
| 0 km | 0 |
| 1 km | 1,17 tCO2e/an |
| 1 000 000 km | 1 170 000 tCO2e/an |

Linéarité : réduire a + b km donne la somme des réductions de a km et de b km (test par propriété).

## Limites

Le facteur est celui de la méthode sans ses rabais régionaux (5 à 50 %, plus 10 % de risque de non-permanence) : hors Grand-Ouest, le stockage est surestimé. Le tableur n'en applique aucun, le code non plus.

| Limite | Effet |
|---|---|
| Rabais régionaux absents | hors Grand-Ouest, le stockage est surestimé (rabais de 5 à 50 %, plus 10 % de risque de non-permanence) |
