# Textes balisés du référentiel

Un même texte de mesure peut varier selon le profil de la collectivité, par exemple DOM ou métropole. On ne duplique pas la mesure : on balise les passages qui changent, directement dans la cellule du Google Sheet.

## Colonnes concernées

`nom`, `description`, `contexte`, `exemples`, `ressources`, `reductionPotentiel`, `perimetreEvaluation`, `preuve`, dans tous les référentiels (CAE, ECI, TE).

## Syntaxe

```
{{si dom}}texte DOM{{sinon}}texte métropole{{/si}}
{{si dom}}paragraphe réservé aux DOM{{/si}}
{{si metropole}}paragraphe masqué en DOM{{/si}}
```

- Les balises peuvent être au milieu d'une phrase : `La collectivité suit le {{si dom}}SAR{{sinon}}SRADDET{{/si}} en vigueur.`
- Une balise seule sur sa ligne disparaît avec la ligne. Une liste Markdown reste donc une seule liste :

  ```
  - Exemple A
  {{si dom}}
  - Exemple B (DOM)
  {{/si}}
  - Exemple C
  ```

- Les balises peuvent s'imbriquer.
- **Il n'y a pas de négation.** `{{si non dom}}` est refusé : écrire la valeur contraire (`{{si metropole}}`) ou utiliser `{{sinon}}`.

## Conditions disponibles

| Condition | Vraie pour |
|---|---|
| `dom` | une collectivité d'un département ou région d'outre-mer |
| `metropole` | toute autre collectivité |

Forme longue équivalente : `identite(localisation, dom)`. On peut combiner avec `et` / `ou` : `{{si dom ou metropole}}`. Seuls les champs ci-dessus sont acceptés pour l'instant. En ouvrir un autre (syndicats, etc.) demande une petite intervention de l'équipe technique.

## Texte par défaut

Le texte par défaut est celui vu **en métropole**. C'est aussi celui que voient les usages qui ne connaissent pas la collectivité : API publique, statistiques, exports globaux. L'ordre des branches n'a pas d'importance : `{{si dom}}A{{sinon}}B{{/si}}` et `{{si metropole}}B{{sinon}}A{{/si}}` donnent le même résultat.

## Avant d'importer : vérifier

La vérification du référentiel (`GET /referentiels/<id>/verify`) contrôle les balises et renvoie, pour chaque cellule balisée :

- les **erreurs**, qui bloquent l'import : balise non fermée, accolades `{{ }}` isolées, condition inconnue, nom vide pour un profil ;
- les **avertissements** : balise sans effet, condition toujours vraie ou toujours fausse ;
- l'**aperçu** du texte vu par chaque profil (« Métropole (par défaut) », « DOM »). Relisez-le : la vérification garantit que la syntaxe est correcte, pas que le texte est le bon.

## Publier une nouvelle version

Les textes sont mis en cache par version du référentiel, côté serveur comme dans le navigateur. Une modification de texte ou de balise n'est visible qu'après l'import d'une **nouvelle version** (ajoutée dans l'onglet des versions). En production, l'import l'impose. Hors production, une réimportation à version égale reste possible, mais elle n'est pas vue par les caches tant que le serveur n'a pas redémarré et que le navigateur n'a pas été rechargé sans cache.

## Limite connue

Si la localisation d'une collectivité est corrigée, le nom enregistré dans son état des lieux courant (utilisé par la comparaison d'audit) ne se met à jour qu'au prochain recalcul du score ou à la prochaine version du référentiel.
