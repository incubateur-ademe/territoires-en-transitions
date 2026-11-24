# Transport de marchandises, électrification

Identifiant : `transport_marchandises_electrification`. Niveau : région seulement. Les données, le taux de chargement, le facteur électrique et les hypothèses `heavyVehicleLoadFactor`, `heavyVehicleTripType` et `includeInternationalFlows` sont ceux du levier `transport_marchandises_sobriete_logistique` (`src/levers/transport-marchandises-sobriete-logistique/methodology.md`) ; les valeurs et leurs limites sont renvoyées dans `appliedAssumptions`, avec le plafond de la part électrifiée quand il s'applique. Métropole seule.

## Formule

```
Émissions évitées (tCO2e/an) = t.km rapportées à la région × % de nouveaux poids lourds électrifiés
                                × (FE_thermique − FE_électrique) ÷ 1 000

FE_thermique = FE diesel par véhicule.km ÷ taux de chargement
```

| Terme | Sens | Unité |
|---|---|---|
| `t.km` | « Tonne.km de TM rapportées à la région » (avec l'étranger) | tonnes.kilomètres par an |
| `% de nouveaux TRM électrifiés` | « Pourcentage du parc de véhicules de transport marchandises routier électrifiés additionnels », saisi | fraction du parc |
| `FE_thermique` | « FE TRM thermique », diesel pondéré par le parc Crit'Air de la région, divisé par le taux de chargement de 8,1 t | kgCO2e par t.km |
| `FE_électrique` | « FE TRM électrique » | 0,0467 kgCO2e par t.km |

La formule est lue dans les formes de la feuille `TrsptMarch_Electrification` : « Émissions évitées = Tonne.km de TM rapportées à la région × % de nouveaux TRM électrifiés × (FE TRM thermique × Tx de chargement TRM − FE TRM électrique) » ; la cellule « Formule » ne contient que « Réduction GES = ». Le résultat du tableur est en kgCO2e ; il est divisé par 1 000.

**Division et non multiplication.** La forme dessine « FE TRM thermique × Tx de chargement TRM », alors que le facteur est en g par véhicule.km (`DonneesReference!D38`) et le taux en tonnes par véhicule (`C43`) : seule la division donne des kgCO2e par t.km (645 g par véhicule.km ÷ 8,1 t = 0,080 ; × 8,1 = 5,2). Correction 1 de `docs/methodology/formula-corrections.md`. Le tableur se contredit : `DonneesReference!C40` et `TrsptMarch_Electrification!D27` libellent le facteur thermique « kgeqCO2/t.km », ce qui le dirait déjà par t.km ; `D38` (« FE thermique en CO2e/veh.km ») et les données OMINEA en g/véh.km tranchent pour la division.

**Le facteur thermique, pas le mixte.** La formule dessine « FE TRM thermique » ; les autres leviers de marchandises utilisent le facteur mixte de la région.

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `additionalElectrifiedFleetFraction` | fraction du parc de poids lourds | 0 à 1, plafonnée à la part thermique du parc |

Obligatoire, sans valeur par défaut ni valeur de la SNBC 3 (`ParametreDeterminants!H41:I41` sont vides). `ParametreDeterminants!D41` : « il s'agit de points de pourcentage d'électrification supplémentaires ». La part demandée est plafonnée à la part thermique du parc de la région (1 − part zéro émission) ; la part appliquée est alors renvoyée dans `appliedAssumptions.additionalElectrifiedFleetFraction`, avec la raison.

## Constantes

Taux de chargement (8,1 t), facteur électrique (0,0467 kgCO2e/t.km), facteur diesel par région : voir `transport_marchandises_sobriete_logistique`. Avec les valeurs nationales, un t.km passé du thermique à l'électrique évite environ 0,059 kgCO2e (−56 %).

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Division du facteur par le taux de chargement | correction 1 de `formula-corrections.md` |
| 2 | La part saisie est une part du parc entier, en points de parc supplémentaires, plafonnée à la part thermique | `ParametreDeterminants!D41` ; choix de conception, non validé pour le plafond ; renvoyé dans `appliedAssumptions` |
| 3 | Un seul facteur électrique pour tous les poids lourds | `DonneesReference!D39` : « un seul FE électrique … (pour les véhicules entre 3,5t et 7t) » |
| 4 | L'hydrogène est traité comme l'électrique | `FE_transports!A19` |
| 5 | Les t.km sont réparties uniformément entre les poids lourds | le tableur applique la part de parc aux t.km |
| 6 | La correction 4 de `formula-corrections.md` (« 1 − % » du Scénario global) ne concerne pas ce levier | il calcule sa réduction seule ; le tableur enchaîne l'électrification après l'efficacité |

## Cas de test chiffrés

| Entrée | Résultat |
|---|---|
| 1 000 000 t.km, thermique à 0,08, électrique à 0,0467, 20 % du parc | 6,66 tCO2e |
| idem, 100 % du parc | 33,3 tCO2e |
| idem, facteur électrique au-dessus du thermique | −6,66 tCO2e |
| région 84, jeu de test, 20 % | 6,66 tCO2e |
| région tout zéro émission, 20 % demandés (rien à électrifier) | 0 tCO2e |
| région à 90 % de zéro émission, 20 % demandés (plafonnés à 10 %) | 3,33 tCO2e |
| région 84, données réelles, 20 % | 367 463,36 tCO2e |
| région 53 (Bretagne) | 157 007,31 tCO2e |
| région 11 (Île-de-France) | 245 566,49 tCO2e |
| région 94 (Corse) | 2 719,15 tCO2e |
| région 32 (Hauts-de-France) | 348 386,68 tCO2e |
| région 84, 100 % demandés, plafonnés à 99,86 % | 1 834 753,82 tCO2e |

Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Limites

| Limite | Effet |
|---|---|
| Un seul facteur électrique | il sert aussi aux poids lourds de plus de 7,5 t |
| Hydrogène traité comme l'électrique | `FE_transports!A19` regroupe électrique, hydrogène et autres ZE |
| Facteur électrique ancien | validité avril 2021, incertitude 70 % |
| Résultat négatif possible | si le facteur électrique dépassait le thermique ; aucune alerte renvoyée |
| Limites des données | celles de `transport_marchandises_sobriete_logistique` |
