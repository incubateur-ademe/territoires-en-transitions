# Pratiques stockantes

Identifiant : `pratiques_stockantes`. Niveaux : région, département, EPCI. Une hypothèse nommée de `docs/methodology/assumptions.md` s'applique (`applicationSurfaceBounds`) ; sa valeur et sa limite sont renvoyées dans `appliedAssumptions`. La requête ne porte pas de territoire.

Le tableur déclare ce levier « LIMITEE » à chaque maille, sans commentaire. Brice et Laurent (CGDD) expliquent que l'on n'a pas d'information sur la surface où chaque pratique serait pertinente ni sur celles où elle est déjà en place. La documentation fonctionnelle PlanET (pp. 72-73) en fait un levier dont les paramètres sont des surfaces saisies par la collectivité.

## Formule

```
Stockage (tCO2e/an) = Σ_p S_p × F_p

p : cultures intermédiaires, enherbement permanent d'un inter-rang sur deux en vigne,
    cultures intercalaires temporaires hivernales en vigne, agroforesterie,
    accroissement de la durée des prairies temporaires
```

Équation 26 de la documentation fonctionnelle (p. 72) : somme, sur chaque pratique stockante, de la surface d'application par l'absorption de CO2 associée. Aucune donnée de territoire n'entre dans le calcul. Le résultat est un flux annuel, sans horizon.

| Terme | Sens | Unité |
|---|---|---|
| `S_p` | surface d'application de la pratique p, saisie | hectares |
| `F_p` | absorption de CO2 de la pratique p | tCO2e par hectare et par an |

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `intermediateCropsHectares` | hectares | 0 ou plus |
| `permanentVineyardGrassingHectares` | hectares | 0 ou plus |
| `winterIntercropVineyardHectares` | hectares | 0 ou plus |
| `agroforestryHectares` | hectares | 0 ou plus |
| `temporaryGrasslandExtensionHectares` | hectares | 0 ou plus |

Les cinq sont obligatoires, sans valeur par défaut : une pratique non appliquée se saisit à `'0'`. Aucune borne supérieure : la documentation n'en documente pas (p. 78).

## Constantes

| Constante | Valeur | Source |
|---|---|---|
| Cultures intermédiaires | 0,753 tCO2e/ha/an | documentation fonctionnelle, p. 73, étude Bamière et al. 2023 (« A marginal abatement cost curve… ») ; `DonneesReference!C19` |
| Enherbement permanent d'un inter-rang sur deux, dans certains vignobles | 1,534 tCO2e/ha/an | idem |
| Cultures intercalaires temporaires hivernales, dans certains vignobles | 1,087 tCO2e/ha/an | idem |
| Agroforesterie | 4,078 tCO2e/ha/an | idem |
| Accroissement de la durée des prairies temporaires | 0,903 tCO2e/ha/an | idem |

La documentation les donne négatifs (émissions nettes) ; la valeur absolue est retenue pour exprimer le stockage, positif comme celui des haies.

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Aucune borne supérieure sur les surfaces saisies | hypothèse nommée `applicationSurfaceBounds` ; documentation, p. 78 : limite à maintenir |
| 2 | Surfaces négatives refusées | choix de conception, non validé : une surface d'application n'est pas négative, alors que les haies admettent un net négatif |
| 3 | Facteurs pris en valeur absolue | la documentation les écrit négatifs ; choix de lecture, non validé |

## Cas de test

| Entrée | Résultat |
|---|---|
| aucune surface | 0 |
| 1 ha de cultures intermédiaires | 0,753 tCO2e/an |
| 1 ha d'enherbement permanent en vigne | 1,534 tCO2e/an |
| 1 ha de cultures intercalaires hivernales en vigne | 1,087 tCO2e/an |
| 1 ha d'agroforesterie | 4,078 tCO2e/an |
| 1 ha d'accroissement de la durée des prairies temporaires | 0,903 tCO2e/an |
| 1 ha de chacune | 8,355 tCO2e/an |
| 1 000 ha de cultures intermédiaires et 200 ha d'agroforesterie | 1 568,6 tCO2e/an |

Linéarité : réduire a + b hectares donne la somme des réductions de a et de b hectares (test par propriété).

## Limites

| Limite | Effet |
|---|---|
| Surfaces d'application non définies | la surface maximale de chaque pratique dépend de la pratique (prairies, vergers, vignes ou cultures) et n'est pas définie ; une saisie supérieure à la surface du territoire n'est pas refusée |
| Valeurs moyennes potentielles | les facteurs sont des moyennes potentielles : les pratiques ne sont pas toujours simples à mettre en œuvre et n'atteindront pas toujours le stock espéré (documentation, p. 73) |
| Pratiques écartées | labour occasionnel (controverse scientifique), bandes enherbées (potentiel négligeable), intensification modérée des prairies permanentes peu productives (impacts indirects négatifs), p. 72 |
| Surfaces d'ALDO | la documentation les donne comme données de territoire (prairies, cultures, vergers, vignes ; Corine Land Cover 2018) ; ce levier ne les lit pas |
