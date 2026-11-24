# Bâtiments et machines agricoles

Identifiant : `batiments_machines_agricoles`. Niveaux : région, département, EPCI. Aucune question ouverte ; les interprétations ci-dessous sont encodées dans les données et le code. Métropole seule : l'outre-mer est absent des données énergétiques et renvoie `missing_data`.

## Formule

```
Émissions évitées (tCO2e/an) = Σ_v  p_v × C_v × FE_v

v : électricité, gaz naturel, produits pétroliers, chaleur commercialisée
FE_électricité = 0,0519 × 67,4 %
FE_produits pétroliers = FE du gazole non routier
```

| Terme | Sens | Unité |
|---|---|---|
| `p_v` | « % de réduction de consommation » du vecteur `v`, saisi, entre 0 et 1 | fraction |
| `C_v` | consommation du secteur agriculture pour le vecteur `v` | MWh |
| `FE_v` | facteur d'émission du vecteur `v` | kgCO2e/kWh |

`FE (kg/kWh) × C (MWh)` est déjà en tonnes (voir la méthodologie de `reseaux_chaleur`). Les quatre vecteurs s'additionnent.

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `electricityReductionFraction` | fraction | 0 à 1 |
| `naturalGasReductionFraction` | fraction | 0 à 1 |
| `petroleumProductsReductionFraction` | fraction | 0 à 1 |
| `heatReductionFraction` | fraction | 0 à 1 |

Les quatre sont obligatoires : un vecteur qu'on ne réduit pas se saisit à 0. Le tableur n'a ni valeur par défaut ni valeur de la SNBC 3 (`ParametreDeterminants!H12:I15` vides).

## Constantes

| Constante | Valeur | Source |
|---|---|---|
| FE électricité, mix moyen 2024 | 0,0519 kgCO2e/kWh | Base Empreinte, élément 43642 (« Electricité 2024 - mix moyen », consommation, France continentale) ; le tableur renvoie au jeu « mix moyen » sans valeur figée |
| Coefficient sur l'électricité | 67,4 % | part « combustion à la centrale » du facteur 2024 (0,0350 ÷ 0,0519, élément 43642), documentation fonctionnelle PlanET, pp. 43, 50, 52 et 56 ; forme « FE de l'électricité * 67,4% » du tableur (FE appliqué : 0,0349806) |
| FE gaz naturel | 55,88 kg/GJ PCI | OMINEA, NAPFUE 301, SNAP 020302, 2024 |
| FE produits pétroliers | 74,52 kg/GJ | OMINEA v23.1, gazole (NAPFUE 205), SNAP 080601 (engins agricoles, échappement moteur), 2024 : 74,5229 arrondi ; documentation fonctionnelle (7.1.3.6, p. 51) : « le gazole non routier » ; le tableur dit « FE du fioul lourd » (78 kg/GJ), la documentation l'emporte |
| Conversion | 0,0036 GJ/kWh | `DonneesReference!D16` demande de « convertir GJ en kWh » sans donner de nombre ; 0,0036 est la conversion physique |

Les FE en kg/GJ deviennent des kg/kWh par `FE × 0,0036` : gaz 0,201168, produits pétroliers 0,268272.

## Données

| Jeu | Contenu | Niveau |
|---|---|---|
| `batiments-machines-agricoles/regions` | électricité, gaz (PCI), produits pétroliers, chaleur, en GWh, SDES 2024 | région |
| `batiments-machines-agricoles/departements` | électricité et gaz, en MWh, SDES 2024 (IRIS) | département |
| `batiments-machines-agricoles/epcis` | électricité et gaz, en MWh, SDES 2024 | EPCI |
| `surface-agricole-utile/communes` | SAU en hectares, recensement agricole 2020 | commune |
| `reseaux-chaleur/networks` | livraisons et facteur de chaque réseau (voir `reseaux_chaleur`) | réseau |

| Vecteur | Région | Département et EPCI |
|---|---|---|
| Électricité, gaz | ligne de la région | ligne du territoire |
| Produits pétroliers, chaleur | ligne de la région | part de SAU du territoire dans chaque région où il a des communes, appliquée à la ligne de cette région |

La part de SAU d'un territoire dans une région est la SAU de ses communes de cette région divisée par la SAU de la région, calculée sur les communes de la géographie. Un EPCI à cheval sur deux régions reçoit donc une part de chacune.

Le facteur de la chaleur est la moyenne des facteurs des réseaux du territoire, pondérée par la chaleur livrée (`DonneesReference!D51`).

## Cas de test

| Entrée | Résultat |
|---|---|
| 1 000 MWh d'électricité, 100 % | 34,9806 tCO2e |
| 1 000 MWh de gaz naturel, 100 % | 201,168 tCO2e |
| 1 000 MWh de produits pétroliers, 100 % | 268,272 tCO2e |
| 1 000 MWh de chaleur à 0,1 kgCO2e/kWh, 100 % | 100 tCO2e |
| 1 000 MWh de chaque vecteur, 100 % | 604,4206 tCO2e |
| 1 000 MWh à 0,1 et 3 000 MWh à 0,2 | facteur de chaleur de 0,175 |
| commune de 100 ha dans une région de 400 ha | part de 25 % |
| EPCI à cheval : 25 % de 80 GWh et 25 % de 40 GWh de produits pétroliers | 8 048,16 tCO2e |
| chacune des 13 régions, produits pétroliers seuls à 100 % | sa ligne en GWh × 1 000 × 0,268272 |
| somme des 96 départements, produits pétroliers seuls | somme des 13 régions, à 0,005 t près par département |
| région 84, 100 % | 919 124,85 tCO2e |
| région 53 (Bretagne), 100 % | 1 918 102,2 tCO2e |
| département 35, 100 % | 514 448,28 tCO2e |
| EPCI 200054781 (Métropole du Grand Paris), 100 % | 3 576,25 tCO2e |

## Interrogations ouvertes

| Interrogation | Constat |
|---|---|
| Valeurs négatives dans les CSV | une valeur négative en MWh, GWh ou hectares passe la lecture sans contrôle (`require-column.ts`, partagé par les leviers) ; les fichiers sont protégés par leur empreinte, mais un hectare négatif donnerait une part hors de 0 à 1. Aucune borne n'est posée, à décider pour tous les leviers |
| Écart de 105 tCO2e entre EPCI et régions | pour les produits pétroliers, la somme des EPCI est inférieure de 105 tCO2e aux 13 régions (11 783 370,82 contre 11 783 476,03) alors que la somme des 96 départements retrouve les régions ; cause non établie |

## Limites

| Limite | Effet |
|---|---|
| Pêche comprise | le secteur du SDES est « agriculture/sylviculture/pêche » ; la pêche pèse 9,0 % des produits pétroliers de métropole (22 % en Bretagne) et reste dans la formule, comme dans le tableur |
| Territoire sans réseau de chaleur | sa contribution de chaleur est nulle (décision du 2026-10-08, à arbitrer avec l'ADEME) ; la chaleur agricole ne concerne que 15 communes |
| Trois séries d'énergie | régionale, IRIS et EPCI ne se réconcilient pas (gaz local supérieur au gaz régional PCS, écart DROM de 38 125,283 MWh d'électricité) : on ne les additionne ni ne les compare. Pour les produits pétroliers, la somme des 96 départements retrouve les 13 régions (11 783 476,04 tCO2e) ; la somme des EPCI est inférieure de 105 tCO2e, cause non établie |
| Gaz : PCS ou PCI | le jeu local ne le dit pas ; les facteurs OMINEA sont par GJ PCI ; l'écart de 10 % porte sur 3,0 % de l'énergie du secteur |
| Secret statistique | électricité : 38 % des lignes IRIS sous secret ; gaz : 66 % ; les lignes secrètes comptent pour 0 |
| Ventilation par la SAU | la part de SAU s'écarte de la part de gazole non routier de 3,0 points en médiane et 11,6 au 90e centile ; indicatif |
| Territoire sans SAU | à tout niveau, ses produits pétroliers et sa chaleur sont nuls et seuls l'électricité et le gaz comptent, sans signal dans le résultat ; c'est le cas d'une région sans SAU (testé sur un jeu fictif : les 13 régions de métropole ont une SAU) et d'un département ou d'un EPCI urbain sans commune agricole |
| Communes de la SAU absentes de la géographie | aucune aujourd'hui, un test fixe ce nombre à 0 ; si un millésime futur en ajoutait, elles seraient écartées sans erreur et n'entreraient dans aucune part ni dans la SAU de leur région (choix de conception, non validé), et ce test casserait |
| Communes de la géographie sans ligne de SAU | 1 384 (dont 94 d'outre-mer) : lues comme une SAU nulle, cohérent avec les totaux régionaux (manifeste de `surface-agricole-utile`) |
| Facteur du gazole pour tous les produits pétroliers | appliqué aussi à l'essence ; OMINEA donne 72,48 pour l'essence des engins agricoles, soit 2,7 % de moins, et pas de facteur 2024 pour le fioul domestique de ces engins |
| Élevage | la fiche élevage (02) n'est pas vérifiée contre le dessin du classeur |
