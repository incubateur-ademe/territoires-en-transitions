# Transport de marchandises, sobriété logistique

Identifiant : `transport_marchandises_sobriete_logistique`. Niveau : région seulement (le tableur déclare le département et l'EPCI hors périmètre). Trois hypothèses nommées de `docs/methodology/assumptions.md` s'appliquent (`heavyVehicleLoadFactor`, `heavyVehicleTripType`, `includeInternationalFlows`) ; leurs valeurs et leurs limites sont renvoyées dans `appliedAssumptions`, avec le facteur thermique, la part des poids lourds diesel sans vignette (`dieselUnclassifiedShare`) et le facteur électrique. Métropole seule : les régions d'outre-mer n'ont pas de tonnes.kilomètres dans les données et renvoient `missing_data`. Les données et les facteurs d'émission sont ceux des quatre leviers de transport de marchandises : cette fiche les décrit, les trois autres y renvoient.

## Formule

```
Émissions évitées (tCO2e/an) = % de réduction × t.km rapportées à la région × FE_TRM ÷ 1 000

FE_TRM = (1 − part zéro émission) × FE_thermique + part zéro émission × FE_électrique
FE_thermique = FE diesel par véhicule.km ÷ taux de chargement
```

| Terme | Sens | Unité |
|---|---|---|
| `% de réduction` | « Pourcentage réduction du transport routier de marchandises » (`% Réduction TRM`), saisi | fraction des t.km |
| `t.km` | « Tonne.km de TM rapportées à la région » : interne + 50 % des quatre flux entrants et sortants, avec l'étranger | tonnes.kilomètres par an |
| `FE_TRM` | « FE TRM » de la région, moyenne pondérée par le parc de poids lourds | kgCO2e par t.km |
| `FE diesel` | CO2 des poids lourds diesel, OMINEA 2024, type de trajet par défaut du tableur (route et ville), pondéré par le parc Crit'Air de la région | kg par véhicule.km |
| taux de chargement | 8,1 t | tonnes par véhicule |
| `FE_électrique` | 0,0467 | kgCO2e par t.km |

La formule est lue dans les formes de la feuille `TrsptMarch_SobriétéLogistique` : « Émissions évitées = % de réduction du transport de marchandises routier × Tonne.km de TM rapportées à la région × FE TRM » ; la cellule « Formule » ne contient que « Réduction GES = ». Le résultat du tableur est en kgCO2e ; il est divisé par 1 000. La correction 1 de `docs/methodology/formula-corrections.md` s'applique : le facteur par véhicule.km est divisé par le taux de chargement.

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `roadFreightReductionFraction` | fraction des t.km | 0 à 1, obligatoire |

Aucune valeur par défaut ni valeur de la SNBC 3 (`ParametreDeterminants!H29:I29` sont vides).

## Constantes

| Constante | Valeur | Source |
|---|---|---|
| Taux de chargement | 8,1 t | hypothèse nommée `heavyVehicleLoadFactor` : guide SGPE du 16/02/2024, p. 37, « de 8,1 t à 8,7 t » (8,1 t en 2019, 8,7 t en cible 2030) ; `DonneesReference!D43` demande « la valeur SNBC3 » sans la donner |
| `FE_électrique` | 0,0467 kgCO2e/t.km | Base Empreinte, élément 28030 « Rigide, 3,5 à 7,5 tonnes, Electrique », poste Amont seul ; total 0,058, fabrication 0,0113 exclue ; validité avril 2021, incertitude 70 % |

Facteur indicatif : la moyenne nationale du CO2 des poids lourds diesel, pondérée par le parc, vaut 854,4 g par véhicule.km (OMINEA 2024, SNAP 070302PL et 070303PL, Euro III à VI selon la vignette Crit'Air), soit 0,1055 kgCO2e par t.km avec le taux de chargement de 8,1 t. Chaque région a son propre facteur, entre 846 et 860 g.

## Données

Jeu `transport-marchandises/regions`, construit par `pnpm build:data:transport-marchandises` : milliards de t.km rapportées à la région (SDES, Le TRM des pavillons européens en 2024, feuille `reg_type_flux`), parc de poids lourds au 1er janvier 2024 (RSVERO, SDES) dont les zéro émission, facteur diesel pondéré par la région (OMINEA 2024), part des poids lourds diesel sans vignette Crit'Air 1 à 5.

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Les t.km comptent l'étranger : interne + 50 % du trafic chargé ou déchargé dans la région | hypothèse nommée `includeInternationalFlows` ; `DonneesTerritoires!D17` ; renvoyé dans `appliedAssumptions.includeInternationalFlows` |
| 2 | Facteur thermique des poids lourds diesel au type de trajet par défaut du tableur (route et ville), parc de la région | hypothèse nommée `heavyVehicleTripType`, résolue par le tableur ; `FE_transports!A22` et `A31` ; renvoyé dans `appliedAssumptions.heavyVehicleTripType` |
| 3 | Taux de chargement de 8,1 t | hypothèse nommée `heavyVehicleLoadFactor` ; renvoyé dans `appliedAssumptions.heavyVehicleLoadFactor` |
| 4 | Le facteur thermique est le CO2 seul, divisé par le taux de chargement | CH4 et N2O ajouteraient environ 1,7 % ; la division suit l'unité (le tableur dessine une multiplication pour l'électrification, voir la fiche de ce levier) |
| 5 | Les poids lourds électriques, hydrogène et autres zéro émission prennent le facteur électrique | `FE_transports!A19` ; 907 poids lourds en métropole ; choix de conception, non validé |
| 6 | La moyenne du facteur diesel ne compte que les vignettes Crit'Air 1 à 5 | `FE_transports!G36:K75` ; la part sans vignette est renvoyée dans `appliedAssumptions.dieselUnclassifiedShare` |
| 7 | La correction 4 de `formula-corrections.md` (« 1 − % » du Scénario global) ne concerne pas ce levier | il calcule sa réduction seule, sur les t.km initiales |

## Cas de test chiffrés

| Entrée | Résultat |
|---|---|
| 10 % de 1 000 000 t.km à 0,08 kgCO2e/t.km | 8 tCO2e |
| 100 % de 1 000 000 t.km à 0,08 kgCO2e/t.km | 80 tCO2e |
| facteur diesel de 0,81 kg/véh.km, taux de chargement de 8,1 t | 0,1 kgCO2e/t.km |
| un quart de poids lourds électriques, thermique à 0,1 | 0,086675 kgCO2e/t.km |
| région 84, jeu de test (30 milliards de t.km, aucun électrique), 10 % | 300 000 tCO2e |
| région 11, jeu de test (20 milliards de t.km, un quart électrique), 10 % | 173 350 tCO2e |
| région 84, données réelles, 10 % | 329 473,45 tCO2e |
| région 53 (Bretagne), 10 % | 140 566,92 tCO2e |
| région 11 (Île-de-France), 10 % | 219 653,81 tCO2e |
| région 94 (Corse), 10 % | 2 456,58 tCO2e |
| région 32 (Hauts-de-France), 10 % | 310 503,13 tCO2e |
| région 27 (Bourgogne-Franche-Comté), 10 % | 146 053,14 tCO2e |

Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Limites

| Limite | Effet |
|---|---|
| Parc immatriculé, pas circulant | le jeu localise un véhicule à l'adresse de la carte grise : le parc d'une région n'est pas celui qui y roule |
| Vignettes sans correspondance | 3 à 14 % des poids lourds diesel d'une région sont « Non classé » ou sans vignette 1 à 5 et sont écartés de la moyenne |
| Biodiesel | 2 485 poids lourds au niveau national sont dans le parc mais pas dans la moyenne diesel |
| CO2 seul | CH4 et N2O ajoutent environ 1,7 % au facteur thermique |
| T.km non rattachées | 6,7 milliards de t.km à région « non précisé » et celles des DOM ne vont dans aucune des 13 régions |
| Un seul facteur électrique | il sert à tous les poids lourds, dont ceux de plus de 7,5 t |
| Pas de département ni d'EPCI | le tableur les déclare hors périmètre |
| Millésime | t.km 2024, parc 2024 (révisable), OMINEA 2024 |
