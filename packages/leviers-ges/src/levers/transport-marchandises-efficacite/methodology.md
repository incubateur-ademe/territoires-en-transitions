# Transport de marchandises, efficacité énergétique

Identifiant : `transport_marchandises_efficacite`. Niveau : région seulement. Les données, le taux de chargement, le facteur électrique et les hypothèses `heavyVehicleLoadFactor`, `heavyVehicleTripType` et `includeInternationalFlows` sont ceux du levier `transport_marchandises_sobriete_logistique` (`src/levers/transport-marchandises-sobriete-logistique/methodology.md`) ; les valeurs et leurs limites sont renvoyées dans `appliedAssumptions`, avec le potentiel d'écoconduite. Métropole seule.

## Formule

```
Émissions évitées (tCO2e/an) = % baisse des émissions des PL × t.km rapportées à la région × FE_TRM ÷ 1 000

% baisse des émissions des PL = 1 − 1 / (1 + Δ_chargement) × (1 − % application de l'écoconduite × 10 %)
```

| Terme | Sens | Unité |
|---|---|---|
| `Δ_chargement` | « Pourcentage d'augmentation du chargement moyen des véhicules » (`% Augmentation du chargement`), saisi | fraction relative, 0 ou plus |
| `% application de l'écoconduite` | « Pourcentage d'application des pratiques d'éco conduite du transport routier », saisi | fraction |
| 10 % | « Potentiel de baisse par écoconduite » | fraction |
| `t.km` | « Tonne.km de TRM rapportées à la région » (avec l'étranger) | tonnes.kilomètres par an |
| `FE_TRM` | facteur mixte des poids lourds de la région (sobriété logistique) | kgCO2e par t.km |

La formule est lue dans les formes de la feuille `TrsptMarch_Efficacité` : « Émissions évitées = % Baisse des émissions des PL × Tonne.km de TRM rapportées à la région × FE TRM », et « % Baisse des émissions des PL = 1 − 1/(1 + % Augmentation du taux de chargement) × (1 − % Application de l'écoconduite × % Potentiel de baisse par écoconduite) » ; la cellule « Formule » ne contient que « Réduction GES = ». La structure est identique à celle de `transport_personnes_efficacite`. Le résultat du tableur est en kgCO2e ; il est divisé par 1 000.

**Produit et non somme.** `TrsptMarch_Efficacité!B13` dit que la baisse totale « se calcule comme la somme des baisses provenant de l'éco conduite et de l'augmentation du taux de chargement » ; la formule dessinée les combine par produit, retenu (correction 2 de `docs/methodology/formula-corrections.md`).

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `ecodrivingApplicationFraction` | fraction | 0 à 1, obligatoire |
| `loadFactorIncrease` | fraction relative | 0 ou plus, obligatoire, sans plafond (comme le tableur) |

Aucune valeur par défaut ni valeur de la SNBC 3 (`ParametreDeterminants!H26:I27` sont vides).

## Constantes

| Constante | Valeur | Source |
|---|---|---|
| Potentiel de baisse par écoconduite | 10 % | documentation fonctionnelle, 7.3.9 (p. 66) : celui du transport de personnes, 10 % par défaut (7.3.4.3, p. 61) ; la p. 66 écrit aussi « 15 % », contradiction tranchée par l'équipe le 2026-11-19 ; le tableur donne « ~15% » (`DonneesReference!D29`), la documentation l'emporte |
| Taux de chargement, facteur électrique, facteurs diesel | | voir `transport_marchandises_sobriete_logistique` |

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Potentiel d'écoconduite de 10 %, le même pour tous les poids lourds | documentation, pp. 61 et 66 ; décision de l'équipe du 2026-11-19 ; renvoyé dans `appliedAssumptions.ecodrivingPotential` |
| 2 | La baisse des émissions égale la baisse de consommation | comme la formule dessinée |
| 3 | Les deux effets se combinent par produit | correction 2 de `formula-corrections.md` |
| 4 | `FE_TRM` mixte, pas le thermique seul | forme dessinée « FE TRM » |
| 5 | La correction 4 de `formula-corrections.md` (« 1 − % » du Scénario global) ne concerne pas ce levier | il calcule sa réduction seule, sur les t.km initiales |

## Cas de test chiffrés

| Entrée | Résultat |
|---|---|
| 1 000 000 t.km à 0,08 kgCO2e/t.km, 50 % d'écoconduite, 20 % de chargement en plus | 16,666667 tCO2e (20,8333 % de 80) |
| idem, 50 % d'écoconduite seule | 4 tCO2e (5 %) |
| idem, 20 % de chargement en plus seul | 13,333333 tCO2e (16,67 %) |
| idem, 100 % d'écoconduite seule | 8 tCO2e (10 %) |
| région 84, jeu de test, 50 % et 20 % | 16,67 tCO2e |
| région 84, données réelles, 50 % et 20 % | 686 403,03 tCO2e |
| région 53 (Bretagne) | 292 847,76 tCO2e |
| région 11 (Île-de-France) | 457 612,11 tCO2e |
| région 94 (Corse) | 5 117,88 tCO2e |
| région 32 (Hauts-de-France) | 646 881,53 tCO2e |

Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Limites

| Limite | Effet |
|---|---|
| Potentiel moyen | le guide EVE de l'ADEME pour le transport de marchandises donne un gain initial de 5 à 15 % (10 % en moyenne, comme la valeur retenue), qui s'estompe : 6 % la première année, 2 % les deux suivantes, 3 % en moyenne sur trois ans |
| Un seul potentiel pour tous les poids lourds | le guide EVE distingue des gains par type d'activité (travaux publics et trajets urbains plus élevés) |
| Hausse du chargement sans plafond | 200 % de chargement en plus donnent une baisse de plus de 66 % avant écoconduite |
| Limites des données | celles de `transport_marchandises_sobriete_logistique` |
