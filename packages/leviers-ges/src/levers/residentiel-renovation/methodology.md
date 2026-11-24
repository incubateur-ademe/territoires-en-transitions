# Résidentiel, rénovation

Identifiant : `residentiel_renovation`. Niveaux : région, département et EPCI, tous `workaround`. Le levier est une approximation : la consommation par m² avant rénovation (CEREN, non ouvert) est remplacée par des parts nationales du SDES (choix 1). Seuls les logements dont le niveau après rénovation est sourcé en pourcentage sont calculés : les appartements d'après 1971 ne le sont pas (choix 3). Métropole seule, comme `residentiel_sobriete`.

## Formule

```
Émissions évitées (tCO2e/an) = p × 35 % × Σ_v  C_v × part_chauffage_ECS_v × part_éligible_v × FE_v

v : électricité, gaz naturel, fioul domestique, GPL, chaleur commercialisée
```

| Terme | Sens | Unité |
|---|---|---|
| `p` | « Pourcentage rénovation parc immobilier », saisi, entre 0 et 1 | fraction |
| `35 %` | baisse de consommation d'une maison ou d'un appartement d'avant 1971 rénové (exigence de l'ANAH) | fraction |
| `C_v` | consommation résidentielle du vecteur `v`, tous usages, lue comme dans `residentiel_sobriete` | MWh |
| `part_chauffage_ECS_v` | part nationale du chauffage et de l'eau chaude sanitaire dans cette consommation (SDES 2024) | fraction |
| `part_éligible_v` | part des m² des logements chauffés au combustible de `v` qui sont des maisons (toutes périodes) ou des appartements d'avant 1971 | fraction |
| `FE_v` | facteur d'émission du vecteur ; la chaleur : moyenne pondérée des réseaux du territoire | kgCO2e/kWh |

La cellule « Formule » du tableur est vide (« Réduction GES = »). La formule est lue dans ses commentaires et dans la documentation (p. 53 : « la consommation énergétique moyenne au m², avant et après rénovation ») : économie = m² rénovés × (kWh/m² avant − kWh/m² après) × FE, où « après » = 65 % de « avant » pour les maisons et les appartements d'avant 1971. Les kWh/m² étant les mêmes pour tous les logements d'un même vecteur (choix 1), la somme des m² éligibles × kWh/m² revient à la consommation du vecteur × la part éligible.

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `renovatedParcFraction` | fraction du parc | 0 à 1 |

Obligatoire, sans valeur par défaut ni valeur de la SNBC 3 (`F19` et `E19` valent 0). La documentation (p. 54) permet aussi une part par typologie de logement : non reprise (choix 5).

## Constantes

| Constante | Valeur | Source |
|---|---|---|
| Baisse de consommation après rénovation | 35 % | documentation, pp. 53-54 ; `Residentiel_Rénovation!B13` et `A34` : exigence de l'ANAH |
| Parts du chauffage et de l'ECS | 46,7 % (électricité), 92,6 % (gaz), 100 % (fioul), 53,2 % (GPL), 100 % (chaleur) | SDES Conso_usage 2024, documentation p. 51 ; `src/domain/residential-heating-shares.ts` |
| FE électricité, gaz, fioul, GPL | comme `residentiel_sobriete` | `src/domain/emission-factors.ts` |

## Données

Aucun jeu propre. La consommation vient de `src/application/residential-consumption/` (jeux de `residentiel_sobriete`), les m² du parc INSEE de `residentiel-logements/logements-departement` (département et région : somme des départements de la région) et de `residentiel-logements/logements-epci-departement` (EPCI : somme de ses lignes).

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Consommation avant rénovation = consommation du territoire × part nationale du chauffage et de l'ECS, la même au m² pour tous les types, combustibles identiques et toutes les périodes | interprétation nouvelle, remplace le CEREN non ouvert (`Residentiel_Rénovation!G24`) ; suppose le même usage partout |
| 2 | Maisons et appartements d'avant 1971 : « après » = 65 % de « avant » | documentation p. 54 ; `A34` |
| 3 | Appartements d'après 1971 (privé et social, 1971-2005 et après 2005) : non calculés, ils comptent 0 | le tableur les aligne sur le BBC rénovation, 110 kWhEP/m²/an et 11 kgCO2e/m²/an (`B13`) ; comparé à des moyennes nationales en énergie finale (électricité 63 kWh/m², gaz 100, fioul 130), le niveau donnerait un gain négatif pour l'électricité et le gaz sans facteurs d'énergie primaire ; −35 % partout surestimerait ; choix de conception, non validé |
| 4 | La part éligible d'un vecteur sans logement chauffé à ce combustible vaut 0 | choix de conception, non validé |
| 5 | Une seule part de parc rénové pour tous les types | documentation p. 54 : « par défaut de façon homogène » |
| 6 | Climatisation non comptée | documentation p. 51 : chauffage et ECS ; le tableur ajoute la climatisation (`B13`), 2,6 TWh d'électricité en 2024 |
| 7 | Bois : consommation de base 0, rien à rénover | documentation pp. 52-53 : l'INSEE n'a pas de bois ; limite reconnue |
| 8 | Territoire sans réseau de chaleur : facteur de la chaleur nul | comme `residentiel_sobriete` (choix 15) |

## Cas de test

| Entrée | Résultat |
|---|---|
| 1 000 MWh d'électricité, tout éligible, 100 % du parc | 5,72 tCO2e |
| 1 000 MWh de gaz naturel, idem | 65,2 tCO2e |
| 1 000 MWh de fioul, idem | 93,9 tCO2e |
| 1 000 MWh de GPL, idem | 42,3 tCO2e |
| 1 000 MWh de chaleur à 0,1 kgCO2e/kWh, idem | 35 tCO2e |
| département 01, jeu de test, 50 % du parc | 59,39 tCO2e |
| région 84, jeu de test (parc des départements 01 et 69), 50 % du parc | 1 018,45 tCO2e |
| département 35, données réelles, 50 % du parc | 63 239,51 tCO2e |
| région 84, données réelles | 536 328,06 tCO2e |
| somme des 13 régions | 4 480 136,54 tCO2e |
| somme des 96 départements | 4 523 488,05 tCO2e |
| somme des 1 232 EPCI | 4 528 519,95 tCO2e |

Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Limites

| Limite | Effet |
|---|---|
| Consommation par m² moyenne nationale | un département plus ou moins chauffé que la France, ou des logements plus ou moins énergivores, sont mal estimés ; les moyennes nationales sont, en énergie finale pour le chauffage et l'ECS : électricité 63 kWh/m², gaz 100, fioul 130, bois 177, chaleur 132 |
| Appartements d'après 1971 | non comptés : le total est sous-estimé |
| Régions, départements et EPCI | les totaux diffèrent d'environ 1 % (4,48, 4,52 et 4,53 MtCO2e à 50 % du parc) : les consommations viennent de trois jeux différents (bilan régional, IRIS départemental, SDES à l'EPCI), la part éligible du même parc INSEE ; comme `residentiel_sobriete` |
| EPCI sans surface de logements | la consommation de l'EPCI, lue en amont, échoue déjà en `missing_data` ; le levier ne le vérifie pas une seconde fois |
| Logements déjà rénovés | les consommations moyennes embarquent des logements déjà rénovés et le parc « disponible » à rénover n'est pas déduit : les gains sont sous-estimés (tableur, `B15`) |
| Constructions postérieures au recensement | non comptées (documentation, p. 54) |
| Effets rebond | non pris en compte (documentation, 7.2.2.6) |
| Bois | absent des données du territoire |
| Outre-mer | 23 EPCI refusés (`missing_data`) faute de parc de logements |
