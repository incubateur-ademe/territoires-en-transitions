# Produits bois

Identifiant : `produits_bois`. Niveaux : région, département et EPCI. Le terme `S_forêt_EPCI / S_forêt_dép` du tableur ventile la récolte du département sur ses EPCI, par la surface de forêt ; le CGDD (Brice, Laurent) le valide. Un EPCI à cheval sur plusieurs départements se calcule département par département (documentation fonctionnelle, p. 71). Voir `docs/methodology/points-a-arbitrer.md`. Aucune question ouverte sur les niveaux calculés ; les interprétations ci-dessous sont encodées dans les données et le code. Métropole seule : l'outre-mer est absent de la récolte et renvoie `missing_data`.

## Formule

```
Stockage (tCO2e/an) = a × 44/12 × [ tC_BO × Prod_BO_territoire / Prod_BO_national + tC_BI × Prod_BI_territoire / Prod_BI_national ]
```

Lue dans l'image de la feuille `ProduitsBois` du classeur (`xl/media/image25.png`) ; la cellule « Formule » ne contient que « Réduction GES = ».

| Terme | Sens | Unité |
|---|---|---|
| `a` | « % augmentation prod BO/BI » : augmentation de la production annuelle de bois d'œuvre et d'industrie, saisie | variation relative (0,1 pour +10 %) |
| `tC_BO` | carbone des produits bois d'œuvre (sciages plus contreplaqués), France, 2022 | tC par an |
| `tC_BI` | carbone des produits bois d'industrie (panneaux plus papier), France, 2022 | tC par an |
| `Prod_BO_*` | récolte de grumes du territoire et nationale, 2022 | milliers de m³ |
| `Prod_BI_*` | récolte de bois d'industrie du territoire et nationale, 2022 | milliers de m³ |
| `44/12` | rapport des masses molaires du CO2 et du carbone | tCO2e par tC |

La part de la récolte en m³ tient lieu de part de la production de produits bois en tC (`ProduitsBois!B12` : « Proxy »). La formule suppose invariante la sortie de stock des produits bois malgré la hausse de production (`B15`). Le terme `S_forêt_EPCI / S_forêt_dép` du tableur vaut 1 à la maille départementale ou régionale (`B15` : « inutile dans le cas d'une collectivité de taille départementale ou supérieure »). À l'EPCI, la production du territoire est la somme, sur les départements où l'EPCI a de la forêt, de la récolte du département × `S_forêt_EPCI∩dép / S_forêt_dép` ; un département sans forêt (Paris) n'apporte rien. Les leviers du secteur s'additionnent (feuille `SG UTCATF`).

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `woodProductionIncrease` | variation relative | aucune, comme dans le tableur : une valeur négative (baisse de production) donne un stockage négatif, une valeur supérieure à 1 (plus de 100 %) est admise |

Pas de valeur par défaut dans `ParametreDeterminants` (`I21` absente) : `ProduitsBois!F19` affiche 0 par une recherche sur cette cellule vide ; colonne « valeur de référence de la SNBC 3 » vide (`ParametreDeterminants!H21`). Une seule entrée s'applique au bois d'œuvre et au bois d'industrie ensemble.

## Constantes

| Constante | Valeur | Source |
|---|---|---|
| `44/12` | 44 et 12 | masses molaires du CO2 (44 g/mol) et du carbone (12 g/mol), formule de la feuille |

`tC_BO`, `tC_BI` et la récolte nationale sont des données (`constants.csv`), pas des constantes du code.

## Données

| Jeu | Contenu | Niveau |
|---|---|---|
| `produits-bois/regions` | grumes et bois d'industrie, 2022, en milliers de m³ | région |
| `produits-bois/departements` | idem | département |
| `produits-bois/constants` | récolte nationale 2022 (ligne `METRO` du tableau EXFNR00) ; carbone des produits bois 2022 | national |
| `produits-bois/foret-epci-departement` | hectares de forêt (mixte, feuillu, conifère, peupleraie) par couple EPCI-département, somme des communes ALDO ; une ligne par département pour un EPCI à cheval ; lu par le levier à l'EPCI | EPCI × département |
| `produits-bois/foret-departement` | hectares de forêt par département, communes sans EPCI comprises ; lu par le levier à l'EPCI | département |

Construits par `pnpm build:data:produits-bois` à partir d'Agreste (enquête EXFSRI, tableau EXFNR00) et d'OMINEA 2026 (UTCATF, tableau 45, p. 97), alors que le tableur cite le rapport OMINEA 2025 (tableau 83, p. 131, `DonneesReference!E21`). `tC_BO` = 1 495 194 (sciages) + 211 509 (contreplaqués) = 1 706 703 ; `tC_BI` = 1 304 599 (panneaux) + 930 031 (papier) = 2 234 630. Récolte nationale : 19 975 milliers de m³ de grumes et 10 311 de bois d'industrie.

La même année, 2022, vaut pour la récolte et pour les tC (le tableur ne fixe pas l'année des séries OMINEA).

Les deux jeux de forêt viennent de l'export brut du jeu ALDO « stocks de carbone - communes » (35 066 lignes, 96 départements ; 18 497 934,5 ha de forêt). Les codes commune de Corse y sont tronqués (« 2 »), d'où l'agrégation par les colonnes `epci` et `departement` du jeu et non par jointure sur les communes du référentiel. Les EPCI sont ceux du millésime ALDO : 18 EPCI de métropole du référentiel `territoires` n'y figurent pas, et 27 EPCI d'ALDO ne sont pas dans le référentiel (environ 270 000 ha, 1,5 % de la forêt). Quatre communes sans EPCI (552,5 ha) ne comptent que dans les totaux départementaux.

## Cas de test

| Entrée | Résultat |
|---|---|
| territoire à 25 % des grumes et 20 % du bois d'industrie, national 1 000 et 500, tC 1 000 et 2 000, `a` = 0,12 | 286 tCO2e |
| territoire = national, `a` = 1 | (1 000 + 2 000) × 44/12 = 11 000 tCO2e |
| `a` = -0,12, même territoire | -286 tCO2e |
| `a` = 0 | 0 |
| territoire sans récolte | 0 |
| somme des 13 régions, `a` = 1 | 14 451 554,33 tCO2e, à 0,005 t près par région |
| somme des 96 départements, `a` = 1 | 14 450 110,24 tCO2e, soit 1 444 de moins que les régions |
| région 84 (Auvergne-Rhône-Alpes), `a` = 1 | 1 790 587,59 tCO2e |
| région 53 (Bretagne), `a` = 1 | 279 226,76 tCO2e |
| département 01 (Ain), `a` = 1 | 101 856,04 tCO2e |
| département 75 (Paris, sans récolte) | 0 |
| EPCI 200000172 (CC Faucigny-Glières, département 74), `a` = 1 | 2 818,43 tCO2e |
| EPCI 200046977 (département 69), `a` = 1 | 12 256,43 tCO2e |
| EPCI 200054781 (Métropole du Grand Paris, 6 départements), `a` = 1 | 3 430,94 tCO2e |
| somme des 1 241 EPCI, `a` = 1 | 14 449 897,70 tCO2e, soit 212,55 de moins que les départements (forêt des 4 communes sans EPCI) |
| EPCI à cheval sur deux départements (fixture) | somme des parts de récolte des deux départements, forêt de l'EPCI ÷ forêt du département |
| EPCI absent des surfaces de forêt | `missing_data` |

Aucune valeur de référence extérieure : le classeur ne donne aucun exemple chiffré, et ses liens et sources de données non plus. Les valeurs réelles ci-dessus sont celles du code, recalculées à part (Python, `Decimal`) depuis les CSV.

## Limites

| Limite | Effet |
|---|---|
| Bois d'industrie absent de la source | 2A, 2B, 75, 93 et 94 (et la Corse en région) comptent 0 : la source ne dit pas zéro ou secret ; l'écart avec le total national est de 3 milliers de m³ sur 10 311 |
| Régions et départements non réconciliés | la somme des départements s'écarte de 3 milliers de m³ du national (arrondis de la source) ; les régions retombent exactement sur le national |
| Une seule année | 2022, dernier millésime de la récolte ; 2024 existe pour les tC des produits bois |
| EPCI du millésime ALDO | 18 EPCI de métropole du référentiel `territoires` n'ont pas de forêt dans ALDO : `missing_data` ; la forêt de 27 EPCI d'ALDO absents du référentiel (environ 1,5 %) n'est attribuée à aucun EPCI demandé |
| Forêt, pas production | la ventilation à l'EPCI suppose la récolte proportionnelle à la surface de forêt (tous peuplements, sans distinguer feuillus et conifères) |
| Proxy | la part départementale de la récolte en m³ tient lieu de part de la production de produits bois en tC |
| Sortie de stock invariante | la formule ignore l'effet de la hausse sur la sortie de stock des produits |
| Hausse sans borne | une hausse négative donne un stockage négatif, une hausse supérieure à 100 % est acceptée, comme dans le tableur |
| Récolte nationale nulle | non gérée : une récolte nationale à 0 dans `constants.csv` donnerait un résultat infini, sans erreur ; la donnée versionnée vaut 19 975 et 10 311 |
