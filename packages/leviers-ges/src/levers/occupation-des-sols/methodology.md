# Changement d'occupation des sols

Identifiant : `occupation_des_sols`. Niveaux : EPCI, département et région (`workaround`). Les facteurs d'ALDO Flux 2 sont publiés à l'EPCI et à la commune ; la documentation parle de la « zone pédoclimatique majoritaire du territoire » sans dire comment l'obtenir et ALDO ne publie pas de facteurs par zone : pour le département et la région, le facteur est la moyenne des facteurs des communes pondérée par la surface du type de sol de départ (choix 7, voir `docs/methodology/points-a-arbitrer.md`). Trois interprétations s'appliquent à l'EPCI, une de plus au département et à la région ; elles sont renvoyées dans `appliedAssumptions` avec leurs sources et leurs limites. Métropole seule : l'outre-mer est absent des données et renvoie `missing_data`.

## Formule

```
Stockage (tCO2e/an) =
    r_aff × H × Σ_t [ S(forêt t) ÷ S(forêt) × FC(prairies → forêt t) ]
  + r_zh  × H × Σ_s [ S(s) ÷ S(prairies + cultures) × FC(s → zones humides) ]
  + r_des × Σ_u [ S(u) ÷ S(arboré + enherbé) × FC(imperméabilisé → u) ]
```

Lue dans l'équation 27 de la documentation fonctionnelle (p. 74), qui est celle de la feuille `COS` du classeur ; la cellule « Formule » ne contient que « Réduction GES = ». La réponse du CGDD à la question 2 confirme les unités : les facteurs des deux premiers termes sont des flux annuels (tCO2e par hectare et par an), celui du troisième est une variation ponctuelle (tCO2e par hectare), d'où l'absence d'horizon. Les trois termes donnent des tCO2e par an.

| Terme | Sens | Unité |
|---|---|---|
| `r_aff` | rythme d'afforestation, appliqué aux prairies, saisi | ha par an |
| `r_zh` | rythme de développement des zones humides, appliqué aux prairies et aux cultures, saisi | ha par an |
| `r_des` | rythme de désimperméabilisation, appliqué aux sols artificiels, saisi | ha par an |
| `H` | horizon de temps (année cible − année de référence), saisi | années |
| `t` | type de forêt : mixte, feuillue, conifère, peupleraie | |
| `s` | cultures et chacun des trois types de prairie | |
| `u` | sols artificiels arbustifs (lus comme « enherbés ») et arborés et buissonnants | |
| `S(·)` | surface du type de sol dans le territoire (ALDO, stocks de carbone) | ha |
| `FC` | facteur de conversion du territoire (ALDO, Flux 2), réservoirs sol, biomasse et litière additionnés ; positif = stockage | tCO2e par ha (par an pour les deux premiers termes) |

Les parts sont des rapports de surfaces, comme le dit le tableur (`COS!B15` : « au prorata des surfaces existantes »). Le facteur de l'afforestation pour un type de forêt est la moyenne des facteurs prairie → ce type, pondérée par la surface de chaque type de prairie.

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `afforestationHectaresPerYear` | ha par an | non négatif |
| `wetlandDevelopmentHectaresPerYear` | ha par an | non négatif |
| `desealingHectaresPerYear` | ha par an | non négatif |
| `horizonYears` | années | strictement positif |

Les quatre sont obligatoires, sans valeur par défaut (`COS` : valeurs à 0 ; l'horizon dépend de la surface disponible). Aucune borne sur la surface disponible : un rythme qui dépasse les prairies ou les sols artificiels de l'EPCI est accepté.

## Constantes

Aucune constante du code : les surfaces et les facteurs sont des données.

## Données

| Jeu | Contenu | Niveau |
|---|---|---|
| `occupation-des-sols/epcis-surfaces` | surfaces des types de sol, en ha, somme des communes ALDO « stocks de carbone » | EPCI |
| `occupation-des-sols/epcis-facteurs` | 18 facteurs de conversion, ALDO Flux 2 : 12 de prairies vers forêt, 4 vers zones humides (cultures et trois prairies), 2 de sols artificiels imperméabilisés vers arbustifs et arborés | EPCI |
| `occupation-des-sols/departements-surfaces`, `…/regions-surfaces` | mêmes surfaces, somme de toutes les communes ALDO du territoire (dont 4 communes sans EPCI) | département, région |
| `occupation-des-sols/departements-facteurs`, `…/regions-facteurs` | mêmes 18 facteurs, moyenne des facteurs des communes pondérée par la surface du type de départ ; moyenne simple si cette surface est nulle | département, région |

Construits par `pnpm build:data:occupation-des-sols` depuis les exports ALDO versionnés dans `data/occupation-des-sols/sources/` : surfaces des communes (avec leur département, leur région et le numéro de leur jeu de facteurs), facteurs des EPCI, et les 48 jeux de valeurs distincts des facteurs des 35 066 communes (J01 à J48, numérotés dans l'ordre croissant (texte) du code de la première commune qui les porte). Les surfaces donnent 19 427 350,5 ha de cultures et 18 497 382 ha de forêt sur 1 241 EPCI, comme les surfaces de forêt de `produits_bois`. Les codes commune de Corse des exports ALDO sont tronqués : l'agrégation se fait par la colonne `epci` du jeu. Les EPCI sont ceux du millésime ALDO : 18 EPCI de métropole du référentiel `territoires` n'y figurent pas et renvoient `missing_data`.

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | « Prairie » regroupe les trois types ALDO (arborée, herbacée, arbustive), au prorata de leurs surfaces | la documentation n'en nomme qu'un ; `COS!B15` ; choix de conception, non validé ; renvoyé dans `appliedAssumptions.grasslandTypes` |
| 2 | « Sol artificialisé enherbé » est la colonne ALDO « sols artificiels arbustifs » | `FC_COS` liste « artificialisé enherbé » ; ALDO n'a pas de colonne du même nom ; choix de conception, non validé |
| 3 | Le troisième terme n'est pas multiplié par l'horizon | équation 27 ; réponse du CGDD, question 2 ; renvoyé dans `appliedAssumptions.desealingWithoutHorizon` |
| 4 | Un terme dont la surface de référence est nulle vaut 0, quel que soit le rythme demandé | choix de conception, non validé ; hypothèse nommée `occupationDesSolsReferenceAreas` ; renvoyé dans `appliedAssumptions.zeroReferenceArea` |
| 5 | Le signe des facteurs est conservé : un facteur négatif déstocke | seuls les mouvements positifs en stockage sont comptés « au niveau du levier » (documentation, p. 73), ce qui désigne les trois stratégies, non un plancher sur les facteurs ; aucune borne dans le tableur |
| 6 | Les réservoirs sol, biomasse et litière (forêt) s'additionnent ; une colonne absente d'ALDO (biomasse des cultures et des prairies herbacées vers zones humides) n'a pas de flux | `FC_COS` : « les différents réservoirs à additionner » |
| 7 | Département et région : facteur = moyenne des facteurs des communes, pondérée par la surface du type de sol de départ (chaque type de prairie, cultures, sols imperméabilisés) ; moyenne simple des communes si cette surface est nulle (Paris) | interprétation nouvelle de « la zone pédoclimatique majoritaire du territoire » (documentation, p. 74) : les facteurs d'ALDO varient à l'intérieur d'une zone ; renvoyé dans `appliedAssumptions.territoryFactors` |

## Cas de test chiffrés

| Entrée | Résultat |
|---|---|
| jeu de test : forêts 100, 300, 600, 0 ha ; prairies 10, 30, 60 ha ; cultures 100 ha ; arborés et enherbés 60 et 40 ha ; facteurs 10 à 80 ; rythmes 2, 3 et 1 ha/an sur 10 ans | 800 + 300 + 68 = 1 168 tCO2e |
| idem sur 20 ans, puis sur 1 an | 2 268 puis 178 tCO2e : l'horizon ne touche pas la désimperméabilisation |
| sans forêt, sans prairie, sans prairie ni culture, sans sol artificiel arboré ni enherbé | 0 pour le terme concerné |
| facteurs de désimperméabilisation −50 et −80, rythme 2 | −136 tCO2e |
| facteurs de 10 partout, rythmes 2, 3 et 1 sur 10 ans (estimateur) | 510 tCO2e |
| EPCI 200046977, 10 ha/an d'afforestation, 5 de zones humides, 2 de désimperméabilisation sur 20 ans | 29 489,46 tCO2e |
| EPCI 200000172, mêmes entrées | 19 203,9 tCO2e |
| EPCI 243500139, mêmes entrées | 30 000,44 tCO2e |
| EPCI 200054781, mêmes entrées | 41 305,94 tCO2e |
| EPCI 200067049, mêmes entrées | 33 157,58 tCO2e |
| EPCI absent du millésime ALDO (200083392) | `missing_data` |
| département 28, mêmes entrées | 37 126,21 tCO2e |
| département 2A, mêmes entrées | 31 154,41 tCO2e |
| département 75 (sans prairie, forêt ni culture) | 0 tCO2e |
| région 53, mêmes entrées | 29 969,19 tCO2e |
| région 84, mêmes entrées | 23 634,61 tCO2e |
| région 94, mêmes entrées | 29 562,35 tCO2e |

Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Limites

| Limite | Effet |
|---|---|
| Facteurs de la région et du département | moyenne pondérée des communes, non la valeur d'une zone majoritaire ; à l'EPCI les facteurs sont ceux d'ALDO, qu'on ne sait pas reconstruire depuis ceux des communes : un territoire et ses EPCI n'ont pas des facteurs cohérents entre eux |
| Unité des facteurs | ALDO annonce « tC/ha/an » dans sa présentation et nomme ses colonnes `tCO2e_ha-1` ; le CGDD a tranché pour un flux annuel (question 2) : zones humides de 101 à 324 tCO2e/ha/an selon l'EPCI, lues comme un flux annuel |
| Premier ordre de grandeur | « une version simplifiée de ce que propose l'outil ALDO » (documentation, p. 73) : trois stratégies seulement, le déstockage à date est laissé au scénario global |
| Répartition au prorata | les surfaces à afforester ou à transformer sont choisies au prorata des surfaces existantes, comme l'indique le tableur ; la collectivité peut les répartir autrement |
| Zone pédoclimatique | prise en compte par les facteurs de l'EPCI, qui mélangent celles de ses communes ; plus le territoire est grand, plus c'est grossier (documentation, p. 75) |
| Millésime | surfaces issues de Corine Land Cover, mises à jour à fréquence variable |
| Pas de borne de surface | un rythme et un horizon qui dépassent les surfaces disponibles sont acceptés |
