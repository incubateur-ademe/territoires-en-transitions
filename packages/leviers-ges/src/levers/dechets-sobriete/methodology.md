# Déchets, sobriété

Identifiant : `dechets_sobriete`. Niveaux : région, département et EPCI. Une hypothèse nommée de `docs/methodology/assumptions.md` s'applique (`wasteScope`) ; elle est renvoyée dans `appliedAssumptions`, avec les tonnes ignorées faute de facteur quand il y en a (`wasteTonnesWithoutEmissionFactor`). Les données, les facteurs et leurs limites sont ceux du levier `dechets_mode_de_traitement` (`src/levers/dechets-mode-de-traitement/methodology.md`) : mêmes jeux `dechets/treatment-flows` et `dechets/emission-factors`, même lecture.

## Formule

```
Émissions évitées (tCO2e/an) =
  Σ_type [ r_s × T_stockage × FE_stockage + r_i × T_incinération × FE_incinération ] ÷ 1 000
```

| Terme | Sens | Unité |
|---|---|---|
| `r_s` | « % réduction des déchets stockés ou incinérés sans récupération d'énergie », saisi | fraction des tonnes stockées |
| `r_i` | « % réduction des déchets incinérés avec récupération d'énergie », saisi | fraction des tonnes incinérées avec récupération |
| `T_stockage` | tonnes stockées, ou incinérées sans récupération d'énergie, du type de déchet | tonnes par an |
| `T_incinération` | tonnes incinérées avec récupération d'énergie du type de déchet | tonnes par an |
| `FE_stockage`, `FE_incinération` | « FE Stockage type de déchet », « FE Incinération type de déchet » | kgCO2e par tonne |

La formule est lue dans les formes de la feuille `SobriétéDéchets` ; la cellule « Formule » ne contient que « Réduction GES = ». Deux lignes reliées par un « + » sous une accolade « Chaque type de déchet ». Le résultat du tableur est en kgCO2e ; il est divisé par 1 000. La réduction de la valorisation matière n'est pas comptée : `B13` dit que ce n'est pas un objectif de réduire le recyclage, le compostage et la méthanisation.

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `storageReductionFraction` | fraction des tonnes stockées | 0 à 1 |
| `incinerationReductionFraction` | fraction des tonnes incinérées avec récupération | 0 à 1 |

Les deux sont obligatoires et indépendantes, sans valeur par défaut ni valeur de la SNBC 3 (`ParametreDeterminants!H50:I51` sont vides). Chaque pourcentage s'applique « sans distinction à l'ensemble des DM ou par type de déchets » (`ParametreDeterminants!D50:D51`) : la même fraction pour tous les types.

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Les tonnes sont celles des sites de traitement situés dans le territoire | hypothèse nommée `wasteScope` ; renvoyé dans `appliedAssumptions.wasteScope` ; confirmée par Laurent (CGDD) et par la documentation fonctionnelle (p. 68) |
| 2 | Les deux « Tonnes de DM type de déchet » de la forme sont lues comme les tonnes du mode du terme : stockage et incinération sans récupération pour le premier, incinération avec récupération pour le second | `SobriétéDéchets!A19` et `A20` donnent chaque pourcentage par mode ; choix de conception, non validé |
| 3 | Un terme dont le facteur manque n'est pas calculé | « Pas de FE disponible » dans `FE_déchets` ; tonnes ignorées renvoyées dans `appliedAssumptions.wasteTonnesWithoutEmissionFactor` |
| 4 | La correction 4 de `docs/methodology/formula-corrections.md` (« 1 − % » du Scénario global) ne concerne pas ce levier : il calcule la réduction seule, pas le reste des déchets après sobriété | `Scénario global Déchets` hors périmètre |
| 5 | Les deux réductions sont indépendantes, sans plafond | aucune borne dans le tableur ; 0 à 100 % par construction |

## Cas de test chiffrés

| Entrée | Résultat |
|---|---|
| 100 t stockées et 200 t incinérées d'OMR (400 et 100 kgCO2e/t), 50 % du stockage et 10 % de l'incinération réduits | 22 tCO2e (20 + 2) |
| idem, 50 % du stockage seul | 20 tCO2e |
| idem, 10 % de l'incinération seule | 2 tCO2e |
| idem, 100 % des deux | 60 tCO2e |
| idem avec 10 t de verre stockées (41 kgCO2e/t) | 22,205 tCO2e |
| région 84, jeu de test (150 t stockées, 200 t incinérées, 1 000 t de terres sans facteur), 50 % et 10 % | 32 tCO2e |
| région 84, données réelles, 10 % du stockage et 20 % de l'incinération | 138 053,55 tCO2e |
| région 53 (Bretagne) | 38 981,49 tCO2e |
| région 11 (Île-de-France) | 291 668,25 tCO2e |
| région 94 (Corse) | 2 815,61 tCO2e |
| département 69 | 35 032,39 tCO2e |
| département 75 | 0 tCO2e (aucun site) |
| département 2A | 347,73 tCO2e |
| EPCI 200046977 | 28 888 tCO2e |

Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Limites

Celles du levier `dechets_mode_de_traitement` : sites et non déchets du territoire (un territoire sans site a un résultat nul), terres et pierres (28,2 % du stockage) sans facteur et ignorées, incinération sans récupération très supérieure à SINOE, récupération d'énergie non créditée, facteurs d'une famille voisine, un seul millésime (2022), même fraction pour tous les types de déchets.

| Limite propre au levier | Effet |
|---|---|
| Réduction à la source | la sobriété retire des tonnes au mode de traitement actuel du territoire ; elle ne dit pas où vont les déchets évités |
| Deux leviers cumulés | `Scénario global Déchets` calcule les tonnes après sobriété (« Tonne initial × % réduction des déchets ») puis les répartit selon les parts d'après le changement de mode ; chaque levier se calcule ici seul sur les tonnes initiales. Avec un seul pourcentage `r`, la somme des deux leviers diffère du cumul de `r` × (résultat du changement de mode) : elle le surestime quand le changement de mode évite des émissions, le sous-estime quand il en ajoute (plastique). Le cumul du tableur n'a qu'un « % réduction des déchets » : il ne coïncide avec les deux pourcentages de cette feuille que si `r_s = r_i` |
