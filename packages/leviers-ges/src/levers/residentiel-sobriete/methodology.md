# Résidentiel, sobriété des bâtiments

Identifiant : `residentiel_sobriete`. Niveaux : région et département (`no_open_question`), EPCI (`workaround`, choix 18 à 22 : le fioul et le GPL n'existent pas à cette maille et sont répartis depuis le département). Les interprétations ci-dessous sont encodées dans les données et le code, et chacune est listée dans « Choix faits ». Métropole seule : l'outre-mer est absent des données énergétiques et du parc de logements et renvoie `missing_data`.

## Formule

```
Émissions évitées (tCO2e/an) = f × b × Σ_v  C_v × FE_v

v : électricité, gaz naturel, fioul domestique, GPL, chaleur commercialisée
FE_électricité = 0,0519 × 67,4 %
```

| Terme | Sens | Unité |
|---|---|---|
| `f` | « Pourcentage des foyers mettant en oeuvre des mesures de sobriété d'usage », saisi, entre 0 et 1 | fraction |
| `b` | « Pourcentage de baisse consommation après mesures de sobriété », saisi, entre 0 et 1 | fraction |
| `C_v` | consommation résidentielle du vecteur `v`, tous usages | MWh |
| `FE_v` | facteur d'émission du vecteur `v` | kgCO2e/kWh |

`FE (kg/kWh) × C (MWh)` est déjà en tonnes (voir la méthodologie de `reseaux_chaleur`). Les cinq vecteurs s'additionnent, puis `f × b` s'applique à la somme. Le tableur ne fournit pas la cellule « Formule » (elle ne contient que « Réduction GES = ») : la formule est lue dans les formes de la feuille `Residentiel_Sobriete`.

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `householdsApplyingSobrietyFraction` | fraction | 0 à 1 |
| `consumptionReductionFraction` | fraction | 0 à 1 |

Les deux sont obligatoires. Le tableur donne une valeur par défaut à la baisse seule, 0,1 (`Residentiel_Sobriete!F20`) ; elle n'est pas reprise (voir choix 14). La colonne « valeur de référence de la SNBC 3 » est vide.

## Constantes

| Constante | Valeur | Source |
|---|---|---|
| FE électricité, mix moyen 2024 | 0,0519 kgCO2e/kWh | Base Empreinte, élément 43642 (« Electricité 2024 - mix moyen », consommation, France continentale) ; le tableur renvoie au jeu « mix moyen » sans valeur figée |
| Coefficient sur l'électricité | 67,4 % | part « combustion à la centrale » du facteur 2024 (0,0350 ÷ 0,0519, élément 43642), documentation fonctionnelle PlanET, pp. 43, 50, 52 et 56 ; forme « FE de l'électricité * 67,4% » du tableur (FE appliqué : 0,0349806) |
| FE gaz naturel | 55,88 kg/GJ PCI | OMINEA, NAPFUE 301, SNAP 020202, 2024 (55,8796 arrondi, choix 17) |
| FE fioul domestique | 74,52 kg/GJ PCI | OMINEA, NAPFUE 204, SNAP 020202, 2024 (74,5229 arrondi, choix 17) |
| FE GPL | 63,1 kg/GJ PCI | OMINEA, NAPFUE 303, SNAP 020202, 2024 |
| Conversion | 0,0036 GJ/kWh | `DonneesReference!D16`, « convertir GJ en kWh » |

Les FE en kg/GJ deviennent des kg/kWh par `FE × 0,0036` : gaz 0,201168, fioul 0,268272, GPL 0,22716.

## Données

| Jeu | Contenu | Niveau |
|---|---|---|
| `residentiel-sobriete/regions` | électricité, gaz (PCI), fioul, GPL et chaleur, en GWh, SDES 2024 | région |
| `residentiel-sobriete/departements` | électricité et gaz IRIS, fioul et GPL répartis, en MWh | département |
| `residentiel-sobriete/epcis` | électricité et gaz résidentiels 2024 de l'EPCI, en MWh | EPCI |
| `residentiel-sobriete/heat-networks` | livraisons au résidentiel (`CONSOR`) et contenu CO2 SDES de chaque réseau | réseau |
| `residentiel-logements/logements-epci-departement`, `residentiel-logements/logements-departement` | m² des résidences principales (INSEE RP2022) par type, combustible et période ; seules les colonnes fioul et GPL (9 chacune) sont lues | EPCI-département, département |

| Vecteur | Région | Département | EPCI |
|---|---|---|---|
| Électricité, gaz | ligne de la région (bilan SDES) | ligne du département (IRIS SDES) | ligne de l'EPCI (SDES, somme des opérateurs) |
| Fioul, GPL | produits pétroliers de la région répartis par la part nationale du CEREN | fioul et GPL de la région répartis au prorata des ventes de FOD et de GPL du département | pour chaque département de l'EPCI : consommation du département × m² de l'EPCI chauffés à ce combustible ÷ m² du département chauffés à ce combustible ; somme sur les départements |
| Chaleur | ligne de la région (bilan SDES) | somme des livraisons des réseaux dont la commune est dans le département | somme des livraisons des réseaux dont la commune est dans l'EPCI |

Les m² chauffés au fioul sont la somme des 9 colonnes `housing_m2_<type>_fuel_oil_<période>` (CMBL = 3), ceux du GPL celle des 9 colonnes `lpg` (CMBL = 5, « gaz en bouteilles ou en citerne »). Un département sans m² pour le combustible n'apporte rien (part de 0) ; un EPCI dont les m² dépassent ceux de son département est refusé (`control_total_mismatch`).

Le facteur de la chaleur est la moyenne des contenus CO2 des réseaux du territoire, pondérée par les livraisons au résidentiel (`Residentiel_Sobriete!C33`).

Construction des jeux : `pnpm build:data:residentiel-sobriete`, depuis les six sources versionnées de `data/residentiel-sobriete/sources/` (le jeu communal de chaleur du SDES y figure aussi dans `data/reseaux-chaleur/sources/`, avec la même empreinte : un manifeste ne référence que des fichiers de son dossier).

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Consommations régionales du bilan SDES (lignes CR2, CR4, CR5, CR8) à la place du CEREN | le tableur désigne le CEREN, « Pas disponible en open source » (`Residentiel_Sobriete!G24`) ; le bilan SDES 2024 concorde avec le CEREN national à 5 % près |
| 2 | Produits pétroliers régionaux répartis en fioul (80 %) et GPL (20 %) par la part nationale du CEREN 2024 (32 et 8 TWh) | choix de conception, non validé : CEREN public national, résidences principales, TWh entiers, à climat normal |
| 3 | Fioul et GPL départementaux : la ligne régionale répartie au prorata des ventes 2024 de FOD et de GPL | choix de conception, non validé, écart avec la fiche qui prend les ventes comme consommation (unité non publiée, ventes tous clients) |
| 4 | Électricité et gaz départementaux : somme des lignes IRIS hors secret statistique, le secret compte pour 0 | comme `batiments_machines_agricoles` |
| 5 | Département absent de l'extrait IRIS : consommation de 0 (gaz : 2A, 2B, 48) | choix de conception, non validé |
| 6 | Gaz local lu comme du PCI | les FE OMINEA sont par GJ PCI ; le jeu ne dit pas PCS ou PCI |
| 7 | Chaleur : `CONSOR` et `CONTENU_EN_CO2` du SDES, lu en kg/kWh | fiche du levier ; le tableur annonce des g éq. CO2/kWh (`Residentiel_Sobriete!D33`), les valeurs du jeu vont de 0 à 0,50 |
| 8 | Réseaux de froid conservés (31 réseaux, 0,14 % de `CONSOR`) | comme `reseaux_chaleur` |
| 9 | Réseaux sous secret statistique exclus (140 sur 992) ; arrondissements rapportés à leur commune | comme `reseaux_chaleur` |
| 10 | Bois non compté | `Residentiel_Sobriete!B13` dit « consommations énergétiques totales du bâtiment », mais la forme ne liste que l'électricité, le gaz, le GPL, le fioul et la chaleur |
| 11 | Coefficient de 67,4 % sur l'électricité | part « combustion à la centrale » du facteur 2024, documentation fonctionnelle PlanET, pp. 43, 50, 52 et 56 |
| 12 | FE du fioul : valeur PCI d'OMINEA | une alerte des fiches d'analyse note que le jeu ouvert n'a le fioul domestique qu'en PCI et que le tableur annonce du PCS |
| 13 | Formule appliquée à la consommation initiale du territoire | dans le scénario, `SG Résidentiel!E13` l'applique à la consommation restante après les deux premiers leviers résidentiels |
| 14 | Les deux fractions sont obligatoires, la baisse n'a pas de valeur par défaut | le tableur donne 0,1 (`F20`) ; les autres leviers n'ont pas de défaut et `appliedAssumptions` reste vide |
| 15 | Territoire sans réseau : facteur de chaleur nul | choix de conception, non validé, comme `batiments_machines_agricoles` |
| 16 | Année 2024 pour toutes les données | le tableur ne fixe pas l'année des facteurs OMINEA |
| 17 | Facteurs OMINEA du gaz et du fioul arrondis à deux décimales (55,88 et 74,52 au lieu de 55,8796 et 74,5229) | choix de conception, non validé ; le GPL (63,1) n'est pas arrondi |
| 18 | EPCI : fioul et GPL du département répartis par la part des m² de l'EPCI chauffés à ce combustible (RP2022) | interprétation nouvelle : la documentation (p. 51) désigne le Fichier Logements sans fixer la règle ; suppose la même consommation par m² dans tout le département |
| 19 | EPCI sur plusieurs départements : somme des contributions de chaque département | comme `produits_bois` |
| 20 | `CMBL` = 5 (« gaz en bouteilles ou en citerne ») lu comme GPL | choix de conception, non validé |
| 21 | EPCI : électricité et gaz du SDES 2024, ligne secrète à 0, EPCI sans ligne de gaz à 0 | comme le choix 4 ; EPCI sans consommation dans le jeu : `missing_data` |
| 22 | EPCI d'outre-mer (23) : `missing_data`, le parc INSEE construit ne couvre que la métropole | choix de conception, non validé |
| 23 | EPCI : m² du parc estimés d'après les classes de superficie du recensement (milieu de classe) et la pondération `IPONDL`, bois dans « autre » | méthode du jeu `residentiel-logements` (documentation fonctionnelle PlanET, pp. 51-52) ; choix de conception, non validé |

## Cas de test

| Entrée | Résultat |
|---|---|
| 1 000 MWh d'électricité, f = b = 100 % | 34,9806 tCO2e |
| 1 000 MWh de gaz naturel | 201,168 tCO2e |
| 1 000 MWh de fioul | 268,272 tCO2e |
| 1 000 MWh de GPL | 227,16 tCO2e |
| 1 000 MWh de chaleur à 0,1 kgCO2e/kWh | 100 tCO2e |
| 1 000 MWh de chaque vecteur, chaleur à 0,1 | 831,5806 tCO2e |
| idem, 50 % des foyers et 10 % de baisse | 41,57903 tCO2e |
| 1 000 MWh à 0,1 et 3 000 MWh à 0,2 | facteur de chaleur de 0,175 |
| région 84, jeu de test, 100 % | 8 189,05 tCO2e |
| département 01, jeu de test, 100 % | 1 229,68 tCO2e |
| région 84, données réelles, 100 % | 4 686 750,91 tCO2e |
| région 53 (Bretagne), 100 % | 1 741 315,05 tCO2e |
| département 35, 100 % | 564 332,91 tCO2e |
| département 75, 100 % | 1 283 555,75 tCO2e |
| région 84, 50 % des foyers et 10 % de baisse | 234 337,55 tCO2e |
| somme des 13 régions, 100 % | 36 785 947,91 tCO2e |
| somme des 96 départements, 100 % | 37 133 226,16 tCO2e |
| EPCI couvrant tout le département 01, jeu de test | 1 229,68 tCO2e |
| EPCI à 25 % du fioul et 50 % du GPL de son département, jeu de test | 231,47 tCO2e |
| EPCI sur deux départements, jeu de test | 290,33 tCO2e |
| somme des 1 232 EPCI métropolitains, 100 % | 37 138 667,36 tCO2e (somme des valeurs arrondies) |

Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Interrogations ouvertes

| Interrogation | Constat |
|---|---|
| Part du fioul et du GPL | à confirmer avec l'ADEME : le CEREN par région, ou une autre clé de répartition (choix 2) |
| Répartition par les ventes | à confirmer avec l'ADEME : ventes SDES lues comme clé de répartition plutôt que comme consommation (choix 3) |
| Valeurs négatives dans les CSV | une valeur négative passe la lecture sans contrôle (`require-column.ts`, partagé par les leviers) ; aucune borne n'est posée, à décider pour tous les leviers |

## Limites

| Limite | Effet |
|---|---|
| SDES et non CEREN | le CEREN donne des consommations à climat normal, le SDES des consommations constatées ; l'électricité IRIS dépasse le bilan de 3,5 % (152,9 contre 147,8 TWh en métropole), le gaz IRIS vaut 101,7 TWh contre 100,2 au bilan en PCI |
| Départements et régions | la somme des 96 départements dépasse celle des 13 régions de 0,9 % (37,13 contre 36,79 MtCO2e à 100 %), parce que l'électricité et le gaz départementaux viennent du jeu IRIS et ceux des régions du bilan : on ne les additionne ni ne les compare |
| Ventes de FOD et de GPL | tous clients, unité non publiée, GPL carburant compris ; en 2024 le FOD de la Haute-Corse (110 570) vaut 27 fois celui de la Corse-du-Sud (4 027), et la répartition suit les ventes telles que publiées |
| Secret statistique | électricité : 1 330 lignes IRIS sur 50 786 (2,6 %) ; gaz : 1 283 sur 24 291 (5,3 %) ; chaleur : 140 réseaux sur 992 (14 %) ; les lignes secrètes comptent pour 0 |
| Chaleur à la commune du réseau | la chaleur n'est pas attribuée à la commune des clients ; un département servi par un réseau implanté dans un autre n'en reçoit pas la chaleur |
| Chaleur : bilan et réseaux | la chaleur d'une région vient du bilan (14,7 TWh en métropole) et son facteur des réseaux hors secret (13,7 TWh) |
| Départements sans réseau | 4 départements n'ont aucun réseau hors secret : leur chaleur et son facteur valent 0 |
| Outre-mer | absent des données énergétiques ; 23 EPCI d'outre-mer sont refusés faute de parc de logements |
| EPCI : consommation par m² uniforme | le fioul et le GPL d'un EPCI valent sa part des m² du département : un EPCI plus chauffé au fioul par m² que son département est sous-estimé |
| EPCI et départements | la somme des 1 232 EPCI dépasse de 0,015 % celle des 96 départements (37,139 contre 37,133 MtCO2e) |
| Jeux IRIS agrégés hors dépôt | `sdes-electricite-iris-…-par-departement.csv` et `sdes-gaz-iris-…-par-departement.csv` sont des extraits déjà sommés par département ; le jeu IRIS résidentiel complet n'est pas versionné |

## Errata à remonter à l'ADEME

| Constat | Cellule |
|---|---|
| Le paramètre « Pourcentage de baisse consommation après mesures de sobriété » est rattaché au levier « Tertiaire - Sobriété des bâtiments » alors que `Residentiel_Sobriete` l'utilise | `ParametreDeterminants!E49`, `Residentiel_Sobriete!A20` |
| Le facteur du réseau de chaleur est en « g éq. CO2/kWh » ; le contenu CO2 du SDES va de 0 à 0,50, lu comme des kg/kWh | `Residentiel_Sobriete!D33` |
| Le parc de logements est listé comme donnée de territoire et n'est pas dans la formule | `Residentiel_Sobriete!A25` |
