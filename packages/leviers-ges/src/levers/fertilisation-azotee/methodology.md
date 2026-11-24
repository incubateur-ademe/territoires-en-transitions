# Fertilisation azotée

Identifiant : `fertilisation_azotee`. Niveaux : région, département et EPCI. À l'EPCI, la masse livrée est ventilée depuis le département par le rapport des surfaces de culture hors agriculture biologique, validé par le CGDD (Brice) ; un EPCI à cheval sur plusieurs départements se calcule département par département (documentation fonctionnelle, p. 45). Voir `docs/methodology/points-a-arbitrer.md`. Une hypothèse nommée de `docs/methodology/assumptions.md` s'applique (`nitrogenCampaigns`) ; elle est renvoyée dans `appliedAssumptions` avec le facteur d'émission et leurs limites. Métropole seule : l'outre-mer est absent des données et renvoie `missing_data`.

## Formule

```
Émissions évitées (tCO2e/an) = p × M × FE ÷ 1 000
```

| Terme | Sens | Unité |
|---|---|---|
| `p` | « % de réduction des kg de fertilisants minéraux azotés », saisi | fraction |
| `M` | « masse de fertilisants azotés livrés au territoire » (livrée, pas épandue) | kg d'azote par an, lue en tonnes d'azote |
| `FE` | « FE par kg de fertilisant minéral azoté épandu » | 5,733 kgCO2e par kg d'azote |

La formule est lue dans les formes de la feuille `ChgtPratiques` ; la cellule « Formule » ne contient que « Réduction GES = ». Deux formes sont dessinées : la réduction, et la masse livrée au territoire, ventilée depuis la masse livrée au département par le rapport des surfaces de culture hors bio. Cette seconde forme sert à l'EPCI : région et département prennent leur masse livrée directement. `M` est lue en tonnes d'azote, multipliée par 1 000 pour les kilogrammes, puis le résultat est divisé par 1 000.

À l'EPCI `e`, pour chaque département `d` où il a de la SAU :

```
M(e) = Σ_d  N(d) × max(0, SAU(e,d) − bio(e,d)) ÷ (SAU(d) − bio(d))
```

`N(d)` est l'azote livré au département (moyenne des campagnes 2022-2023 révisée et 2023-2024), `SAU(e,d)` la SAU des communes de l'EPCI dans `d` et `SAU(d)` celle du département (recensement agricole 2020), `bio(e,d)` et `bio(d)` la surface bio et en conversion 2024 de l'Agence Bio. La part d'un EPCI dans un département est plafonnée à 1 ; elle vaut 0 si `SAU(d) − bio(d)` n'est pas positif.

La formule est un proxy (`B12`) : `B13` utilise « la masse de fertilisants minéraux azotés livrés et non épandus car la donnée disponible concerne uniquement les livraisons ».

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `nitrogenReductionFraction` | fraction de la masse d'azote livrée | 0 à 1 |

Obligatoire, sans valeur par défaut ni valeur de la SNBC 3 (`ParametreDeterminants!H8` est vide, `I8` vaut 0). Le tableur ne pose aucune borne ; 0 à 1 par construction.

## Constantes

| Constante | Valeur | Source |
|---|---|---|
| FE de l'épandage d'engrais minéraux azotés | 5,733 kgCO2e/kg d'azote | Base Empreinte, élément 24270, France continentale, poste total, version 23.11, validité décembre 2018, incertitude 400 % ; le jeu ouvert Base Carbone donne 5,73 |
| Campagnes d'un territoire | 2 | hypothèse nommée `nitrogenCampaigns` ; `DonneesTerritoires!D8` : « Prendre la moyenne sur 2 ans » |

## Données

Jeux `fertilisation-azotee/regions` et `fertilisation-azotee/departements`, construits par `pnpm build:data:fertilisation-azotee` depuis le tableau UNIFA 2023-2024 versionné dans `data/fertilisation-azotee/sources/`.

| Niveau | Donnée |
|---|---|
| Région | tonnes d'azote livrées, moyenne des campagnes 2022-2023 révisée et 2023-2024 |
| Département | idem |

Deux jeux de surface bio, lus par le levier à l'EPCI, construits par le même script depuis les exports Agence Bio versionnés (`sources/agence-bio-surfaces-epci-2024.csv`, `…-departements-2024.csv`, lignes de l'année 2024) :

| Jeu | Contenu |
|---|---|
| `fertilisation-azotee/organic-epci-departements` | hectares bio et en conversion 2024 par couple EPCI-département, 1 248 lignes ; un EPCI à cheval a une ligne par département |
| `fertilisation-azotee/organic-departements` | hectares bio et en conversion 2024 par département, 96 lignes (2 713 507,61 ha) |

Les 50 couples EPCI-département sous secret statistique (1 ou 2 exploitations) et les lignes sans EPCI (`NA`, `ZZZZZZZZZ`, `992367730`) sont absents : le levier renverra `missing_data` pour ces EPCI. La somme des EPCI vaut 2 710 987,80 ha, 2 519,82 de moins que les départements : 247,23 ha portés par deux lignes sans code EPCI exploitable (`ZZZZZZZZZ` en Vendée, 101,34 ha ; `992367730` en Moselle, 145,90 ha, qui ressemble à un EPCI dont le code n'a pas le préfixe 2) et le reste sous secret statistique. Les totaux régionaux recoupent ceux de l'observatoire de l'Agence Bio à moins de 0,1 % près. Millésime 2024 pour la bio, 2020 pour la SAU du recensement : aucun EPCI n'a plus de bio que de SAU.

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Région, département et EPCI : moyenne des campagnes 2022-2023 révisée et 2023-2024 ; la campagne 2022-2023 est déduite de l'évolution publiée (azote 2023-2024 ÷ (1 + évolution)), les codes 20 et 99 écartés | hypothèse nommée `nitrogenCampaigns` ; le tableau UNIFA 2023-2024 donne l'azote et son évolution par rapport à la campagne précédente révisée, pas la campagne révisée elle-même ; renvoyé dans `appliedAssumptions.nitrogenCampaigns` |
| 2 | La masse du territoire est la masse livrée à la région ou au département, sans ventilation | `ChgtPratiques!B13` : « à la maille régionale (à utiliser pour les régions) » ; aucune formule départementale n'est dessinée |
| 3 | Les livraisons tiennent lieu d'épandage | proxy du tableur ; `B13` signale le problème des ports et entrepôts d'engrais |
| 4 | Les départements 2A et 2B n'ont pas de livraison : le levier renvoie `missing_data` | la Corse est publiée sous le code 20 sans distinguer 2A et 2B ; choix de conception, non validé |
| 5 | Le facteur d'émission est celui de la France continentale, y compris pour la Corse | Base Empreinte ; renvoyé dans `appliedAssumptions.nitrogenSpreadingEmissionFactor` |
| 6 | À l'EPCI, la masse est la somme des parts de chaque département, la part étant la SAU hors bio de l'EPCI dans le département sur celle du département | `ChgtPratiques!B13` ; documentation, p. 45 ; renvoyé dans `appliedAssumptions.nitrogenCampaigns` (moyenne de deux campagnes) |
| 7 | La part d'un EPCI est plafonnée à 1, et vaut 0 quand la SAU hors bio du département n'est pas positive (Paris, Hauts-de-Seine) | choix de conception, non validé |
| 8 | Un EPCI sous secret statistique (1 ou 2 fermes bio), ou dont un département n'a pas de livraison (Corse), renvoie `missing_data` ; un EPCI sans SAU renvoie 0 | choix de conception, non validé |
| 9 | La réduction est bornée de 0 à 1 | par construction ; une note antérieure citait une borne de 25 % (surplus national d'azote, bilan ClimAgri), absente du tableur actuel |

## Cas de test chiffrés

| Entrée | Résultat |
|---|---|
| 1 000 t d'azote, 100 % supprimés | 5 733 tCO2e |
| 1 000 t d'azote, 10 % supprimés | 573,3 tCO2e |
| région 84, jeu de test (1 000 et 3 000 t, soit 2 000 t en moyenne), 10 % | 1 146,6 tCO2e |
| département 01, jeu de test (500 t), 10 % | 286,65 tCO2e |
| région 84, données réelles (81 130 t en moyenne), 10 % | 46 511,85 tCO2e |
| région 53 (Bretagne, 113 904,1 t), 10 % | 65 301,21 tCO2e |
| région 11 (Île-de-France, 74 392,1 t), 10 % | 42 648,97 tCO2e |
| région 94 (Corse, 164,5 t), 10 % | 94,32 tCO2e |
| département 28 (Eure-et-Loir, 84 765 t), 10 % | 48 595,76 tCO2e |
| département 75 (Paris, 21 824,4 t pour 1 ha de SAU), 10 % | 12 511,93 tCO2e |
| département 35 (Ille-et-Vilaine, 32 078,1 t), 10 % | 18 390,36 tCO2e |
| EPCI 200000001, jeu de test (48 % de la SAU hors bio du département 01 : 288 t), 10 % | 165,11 tCO2e |
| EPCI 200000002, jeu de test, à cheval sur 01 et 69 (324 + 500 t), 10 % | 472,4 tCO2e |
| EPCI 200000172 (département 74), 10 % | 27,78 tCO2e |
| EPCI 200046977 (département 69), 10 % | 232,61 tCO2e |
| EPCI 243500139 (département 35), 10 % | 1 543,76 tCO2e |
| EPCI 200006682, à cheval sur 21 et 71, 10 % | 849,87 tCO2e |
| EPCI 200054781 (Métropole du Grand Paris) | `missing_data` : bio du département 91 sous secret statistique |

Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Limites

| Limite | Effet |
|---|---|
| Livré n'est pas épandu | les livraisons sont comptées au département du distributeur : Paris reçoit 21 824 t d'azote pour 1 ha de SAU, les Hauts-de-Seine 10 658 t pour 5 ha, contre 84 765 t pour 446 392 ha en Eure-et-Loir ; limite assumée par le tableur |
| Deux campagnes seulement | les valeurs bougent d'une campagne à l'autre : Nouvelle-Aquitaine 211 529 t en 2022-2023 révisée puis 220 836 t en 2023-2024, Provence-Alpes-Côte d'Azur 23 761 t puis 21 219 t |
| Campagne 2022-2023 déduite | la campagne précédente est déduite d'une évolution publiée arrondie à 0,1 % ; elle diffère de la valeur publiée en 2022-2023 (Île-de-France 63 044 t contre 57 386 t) |
| Corse départementale | 2A et 2B sans résultat ; la région 94 est calculée (201 t en 2023-2024, 164,5 t en moyenne) ; le code 20 de la Corse n'est pas réparti |
| Somme des départements et des régions | 1 807 072 t (94 départements) contre 1 807 283 t pour les 13 régions, moyenne des deux campagnes ; la Corse départementale et le code 99 sont écartés |
| Incertitude du facteur | 400 % dans la Base Empreinte |
| Ventilation à l'EPCI | proxy : l'azote du département réparti par la SAU hors bio, alors qu'il est livré où est le distributeur ; SAU de 2020 contre bio de 2024 ; Paris et Hauts-de-Seine (bio supérieure à la SAU) ne reçoivent aucune part à l'EPCI |
| EPCI sans résultat | 50 couples EPCI-département sous secret statistique, dont celui de la Métropole du Grand Paris dans le département 91 ; la Corse (2A, 2B) n'a pas de livraison |
| Métropole seulement | pas de calcul pour les départements d'outre-mer |
| Leviers du secteur | les leviers de l'agriculture s'additionnent sans interaction (feuille `SG Agriculture`) |
