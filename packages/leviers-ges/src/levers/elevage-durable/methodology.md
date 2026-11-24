# Élevage durable

Identifiant : `elevage_durable`. Niveaux : région et département. **L'EPCI n'est pas calculé** : le fichier Agreste par EPCI (`RA2020_2141_EPCI`, indicateur 040.01) se contredit sur les bovins : la somme des vaches laitières vaut 5 827 825 têtes pour 3 482 723 en France métropolitaine, et dans 43 départements sur 72 dont le total est publié la somme des EPCI vaut à peu près deux fois le total départemental (le total d'un département est parfois écrit sous un code EPCI, 44 départements) ; le fichier communal Agreste `RA2020_2141_Cheptels_communes` ne donne que « Herbivores » et « Non herbivores », sans type d'animal ; le niveau est `not_computed` dans `src/domain/lever-registry.ts`, alors que la fiche d'analyse le jugeait faisable avec réserve. L'hypothèse nommée `methanisationFactors` de `docs/methodology/assumptions.md` s'applique ; les valeurs par défaut et les limites sont renvoyées dans `appliedAssumptions`. Métropole seule : l'outre-mer est absent des données et renvoie `missing_data`, comme Paris (absent du recensement agricole).

## Formule

Pour chaque type d'animal `a` que la requête change :

```
Émissions évitées (tCO2e/an) = Σ_a N_a × (R_CH4,a + R_N2O,a) ÷ 1 000

R_CH4,a = PRG_CH4 × { FE_ferm,a + FE_déj,a × Σk FCM_k × SG_a,k
                      − (1 − b_a) × [ (1 − f_a) × FE_ferm,a + FE_déj,a × Σk FCM_k × c_a,k ] }
R_N2O,a = PRG_N2O × Fex_a × 44/28 × [ Σk FD_k × SG_a,k − (1 − b_a) × Σk FD_k × c_a,k ]
FE_déj,a = SV_a × 365 × Bo_a × 0,67
```

| Terme | Sens | Unité |
|---|---|---|
| `N` | effectif du type d'animal (recensement agricole 2020) | têtes |
| `b` | « % de baisse du nombre de têtes », saisi | fraction |
| `f` | « % de baisse du facteur d'émission de méthane par fermentation entérique », saisi, 0 par défaut | fraction |
| `c_k` | « proportion cible du système de gestion k », saisie : lisier, fumier, pâture, méthanisation | fractions, somme à 1 |
| `SG_k` | proportion actuelle du système k, nationale (OMINEA 2013), méthanisation à 0 | fraction |
| `k` | « chaque mode de gestion » : lisier, fumier, pâture, méthanisation | |
| `FE_ferm` | facteur de fermentation entérique | kg CH4 par tête et par an |
| `SV`, `Bo` | solides volatils excrétés (kg par jour), capacité maximale de production de méthane (m3 par kg de SV) | |
| `0,67` | masse volumique du méthane | kg par m3 |
| `FCM_k` | facteur de conversion en méthane du mode k | fraction |
| `Fex` | excrétion azotée | kg d'azote par place et par an |
| `FD_k` | facteur d'émission directe de N2O du mode k | kg de N-N2O par kg d'azote excrété |
| `PRG_CH4`, `PRG_N2O` | 28 et 265 (AR5, Secten 2026 du Citepa) | kgCO2e par kg |

La formule est lue dans les formes de la feuille `ElevageDurable` ; la cellule « Formule » ne contient que « Réduction GES = ». Trois formes sont dessinées : la réduction de N2O par tête, celle de méthane par tête, et leur somme multipliée par la taille du cheptel. La forme dit « dioxyde d'azote » pour la réduction de N2O : lu comme protoxyde d'azote (`DonneesReference!A14`), confirmé par Laurent (CGDD) et par la documentation fonctionnelle (équation 3, p. 47). Le facteur `(1 − b)` s'applique aux déjections comme à la fermentation entérique, et au N2O comme au CH4, d'après le dessin ; la prose du tableur (`Formule` de l'extrait brut) le place autrement (`− b × après` pour le N2O, rien sur les déjections de méthane) et ne donne pas zéro quand rien ne change : le dessin est retenu. Le résultat du tableur est en kgCO2e ; il est divisé par 1 000.

## Entrées

`parameters.animals` associe à chaque type d'animal que la requête change :

| Entrée | Unité | Bornes |
|---|---|---|
| `headcountReductionFraction` | fraction du cheptel | 0 à 1, obligatoire |
| `entericEmissionReductionFraction` | fraction du facteur entérique | 0 à 1, facultative, 0 par défaut |
| `targetManureShares` : `liquid`, `solid`, `pasture`, `anaerobicDigestion` | fractions | 0 à 1 chacune, somme exactement égale à 1 |

Onze types d'animaux : `dairyCows`, `otherCattle`, `sows`, `otherPigs`, `goats`, `sheep`, `horses`, `mulesAndDonkeys`, `layingHens`, `broilers`, `otherPoultry`. Au moins un est obligatoire ; un type absent de la requête ne change pas et n'apporte rien (renvoyé dans `appliedAssumptions.unchangedAnimals`).

Le lisier est refusé pour les ovins, les caprins, les chevaux, les mules et ânes (facteur « NA » de l'OMINEA 2013) ; la méthanisation est refusée hors bovins et porcins (aucun facteur).

## Constantes

Le détail des facteurs par animal est dans `src/levers/elevage-durable/animal-parameters.ts`, avec sa source.

| Animal | FE_ferm | SV | Bo | Fex | SG lisier / fumier / pâture |
|---|---|---|---|---|---|
| Vache laitière | 121 | 3,79 | 0,24 | 115,6 | 41 / 20 / 39 % |
| Autres bovins | 51 | 1,96 | 0,17 | 59,1 | 27 / 30 / 43 % |
| Truies | 2,5 | 0,5 | 0,45 | 21,2 | 88 / 10 / 2 % |
| Autres porcins | 0,65 | 0,5 | 0,45 | 5,8 | 93 / 6 / 1 % |
| Caprins | 11,7 | 0,28 | 0,17 | 14,1 | 0 / 88 / 12 % |
| Ovins | 9,3 | 0,4 | 0,19 | 16,7 | 0 / 26 / 74 % |
| Chevaux | 21,8 | 1,72 | 0,33 | 60,2 | 0 / 42 / 58 % |
| Mules et ânes | 12,1 | 0,94 | 0,33 | 17,1 | 0 / 42 / 58 % |
| Poules, poulets, autres volailles | 0 | 0,1 | 0,32 | 0,61 ; 0,34 ; 0,71 | 3 / 90 / 7 % |

| Constante | Valeur | Source |
|---|---|---|
| FCM lisier | 39 % (bovins, porcins), 1,5 % (volailles), non applicable (autres) | OMINEA 2013, Base Carbone « Agriculture - cheptels » |
| FCM fumier | 1 % ; 1,5 % pour les volailles | idem |
| FCM pâture | 1 % | idem |
| FD lisier, fumier, pâture | 0,1 % ; 2 % ; 2 % | valeurs par défaut du GIEC, même page |
| FCM et FD de la méthanisation | 2,27 % et 0,0006 kg N-N2O/kg N, bovins et porcins | hypothèse nommée `methanisationFactors`, OMINEA 2026 du CITEPA |
| PRG CH4, PRG N2O | 28 ; 265 | Secten 2026 du Citepa (AR5), page 34 |
| Jours par an, densité du méthane, 44/28 | 365 ; 0,67 ; 44/28 | `DonneesReference!D11`, `D13` |

## Données

Jeux `elevage-durable/regions` et `elevage-durable/departements`, construits par `pnpm build:data:elevage-durable` : onze colonnes d'effectifs par territoire, déduites des catégories du recensement agricole 2020 d'Agreste (vaches laitières : cartostat). Les déductions (autres bovins = bovins − vaches laitières, etc.) et leurs limites sont dans le manifeste.

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Pas de calcul à l'EPCI | fichier Agreste par EPCI contradictoire sur les bovins (somme des EPCI à peu près double du total départemental dans 43 départements sur 72 dont le total est publié) ; décision du 2026-10-20, constat refait le 2026-11-19 |
| 2 | La formule du dessin, avec `(1 − b)` sur les déjections et le N2O | la prose du tableur est incohérente et ne donne pas zéro quand rien ne change ; formule confirmée par la documentation fonctionnelle (équation 3, p. 47) |
| 3 | La proportion actuelle de méthanisation est 0 | `ElevageDurable!B15` |
| 4 | Les proportions actuelles sont nationales | `DonneesTerritoires!H22` : « Nationale » ; renvoyé dans `appliedAssumptions.currentManureShares` |
| 5 | Constantes de l'OMINEA 2013, pas de l'OMINEA 2026 | `DonneesReference!D11` à `D15` ; l'OMINEA 2026 donne 121,9 à 152,5 kg de CH4 par vache laitière (121 ici) et 118,7 kg d'azote excrété (115,6) ; renvoyé dans `appliedAssumptions.animalParameters` |
| 6 | SV des bovins au milieu de la plage publiée | 3,46-4,12 donne 3,79 ; 1,93-1,99 donne 1,96 ; `DonneesReference!D11` dit « valeur de 2013 » ; choix de conception, non validé |
| 7 | Lecture des cellules fusionnées du tableau FCM de la documentation | lisier 39 % pour bovins et porcins, 1,5 % volailles, NA pour les autres ; fumier 1 % (1,5 % volailles) ; choix de conception, non validé |
| 8 | Méthanisation : facteurs de l'OMINEA 2026 pour les bovins et les porcins, indisponible pour les autres | hypothèse nommée `methanisationFactors` ; renvoyé dans `appliedAssumptions.methanisationFactors` |
| 9 | Un animal absent de la requête ne change pas et ne contribue pas ; une baisse entérique omise vaut 0 | `ParametreDeterminants!I9` pour la baisse entérique ; renvoyés dans `appliedAssumptions` |
| 10 | Les lapines et les ruches ne sont pas comptées | aucun facteur dans le tableur (422 790 lapines reproductrices en France) |
| 11 | Les onze types d'animaux sont ceux de la documentation Base Carbone ; la table de correspondance avec les catégories du recensement est la nôtre | `DonneesTerritoires!D23` laisse à « décliner » ; choix de conception, non validé |
| 12 | Une catégorie sous secret compte pour zéro ; Paris, absent d'Agreste, renvoie `missing_data` | voir le manifeste du jeu ; renvoyé dans `appliedAssumptions.livestockHeadcounts` |

## Cas de test chiffrés

| Entrée | Résultat |
|---|---|
| 1 000 vaches laitières, rien ne change | 0 tCO2e |
| 1 000 vaches laitières supprimées | 5 008,446832 tCO2e |
| 1 000 vaches laitières, 10 % de baisse du facteur entérique (28 × 121 × 1 000 × 0,1 ÷ 1 000) | 338,8 tCO2e |
| 1 000 vaches laitières, toutes les déjections à la pâture | 595,380024 tCO2e |
| 1 000 vaches laitières, toutes les déjections méthanisées | 1 450,178779 tCO2e |
| 500 truies, 20 % de têtes en moins, 5 % de baisse entérique, parts cibles 50/10/2/38 % | 150,907651 tCO2e |
| 2 000 ovins, 10 % de têtes en moins, 10 % de baisse entérique, fumier 50 % pâture 50 % | 127,810233 tCO2e |
| 100 000 poules, 20 % en moins, fumier 50 % pâture 50 % | 189,018662 tCO2e |
| région 84, jeu de test (1 000 vaches laitières supprimées) | 5 008,45 tCO2e |
| scénario S, région 84, données réelles | 857 784,2 tCO2e |
| scénario S, région 53 (Bretagne) | 912 982,46 tCO2e |
| scénario S, région 11 (Île-de-France) | 9 105,67 tCO2e |
| scénario S, région 94 (Corse) | 16 129,22 tCO2e |
| scénario S, département 69 | 41 327,89 tCO2e |
| scénario S, département 2A | 5 233,5 tCO2e |
| scénario S, département 35 | 300 567,63 tCO2e |
| scénario S, département 91 | 269,82 tCO2e |

Scénario S : vaches laitières (10 % de têtes en moins, 5 % de baisse entérique, parts 30/10/50/10 %), autres bovins (10 % en moins, parts 20/30/50/0 %), ovins (10 % de baisse entérique, parts 0/20/80/0 %). Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Limites

| Limite | Effet |
|---|---|
| Constantes de 2013 | voir choix 5 |
| Méthanisation initiale à 0 | l'OMINEA 2026 estime la part initiale à 9,5 % des truies et 9,8 % des autres porcins en 2024 (UE) ; l'effet d'un passage à la méthanisation peut être surestimé |
| Effectifs au siège de l'exploitation | un élevage sur deux départements est compté au siège |
| Vaches laitières estimées | 21 départements sous secret reçoivent une estimation de cartostat dont la méthode n'est pas décrite ; 91 et 93 sans valeur |
| Secret statistique | une catégorie sous secret compte pour zéro, y compris quand son parent est publié : 0,2 % des volailles des régions et jusqu'à 1,3 % de celles de 53 départements |
| Zones pédoclimatiques | non prises en compte (`ElevageDurable!B15`) |
| Un seul millésime | 2020 |
| Pas d'interaction entre animaux | les réductions s'additionnent (feuille `SG Agriculture`) |
