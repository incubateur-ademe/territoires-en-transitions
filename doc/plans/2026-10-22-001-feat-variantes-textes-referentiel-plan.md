---
title: "feat: Variantes de texte d'un référentiel selon l'identité de la collectivité"
type: feat
status: draft
date: 2026-10-22
---

# Variantes de texte d'un référentiel

## Context

On veut faire varier les textes du référentiel (`nom`, `description`, `exemples`, `contexte`, `ressources`, `reductionPotentiel`, `perimetreEvaluation`, `preuve`) selon la localisation de la collectivité, avec des variations souvent parcellaires (quelques mots, un paragraphe masqué). Le front reçoit le texte déjà adapté, et **le même texte partout dans l'app**.

Constats tirés du code et de l'échantillon `referentiel-te-structure.csv` (655 lignes) :

- Ces champs sont du Markdown (listes, liens `[texte](url)`, parfois `[CUS]`). **Aucune cellule de l'échantillon TE ne contient `{`** : `{{…}}` est libre de collision ; `[[…]]` ne l'est pas. Ce n'est vérifié que sur l'échantillon : l'import refuse donc, dans tous les référentiels, tout `{{` ou `}}` qui ne forme pas une balise valide.
- Les balises sont acceptées dans **tous les référentiels** (CAE, ECI, TE) : l'import est commun et rien dans le mécanisme n'est propre à TE.
- Le langage de condition existe déjà : `identite(localisation, DOM)` via chevrotain (`utils/expression-parser/`, `evaluateIdentite`), avec validation à l'import (`verify-referentiel-expressions.ts`).
- Depuis f4d2eabd1a, les définitions d'actions sont **séparées de l'état** de la collectivité :
  - `ListActionDefinitionsService` (`referentiels.actions.listActionDefinitions`) : procédure **publique, indépendante de la collectivité**, qui renvoie tous les champs de texte (via `actionStaticDefinitionSchema`) avec la version publiée. Côté front, cache `staleTime: Infinity`, rechargé seulement quand la version publiée change.
  - `listActionsGroupedById` ne renvoie plus que la partie dynamique (`ListActionsDynamicStateResult` : scores, généalogie, pilotes, services, `hiddenActionIds`, version) ; la fusion se fait dans `mergeActionDefinitionsAndState` (domain).
  - `listWithDetails` lit toujours les textes directement.
- Sur la branche `TET-8138/poc-offline-first` (3e1ceee409), les définitions sont **persistées localement** (SQLite/OPFS, partagée entre onglets) sous la clé (référentiel, version), et la fusion passe par `assemble-actions-grouped-by-id.ts`. L'état reste adossé à la query tRPC.
- Sur la branche `TET-8215/add-new-cols-into-export-score` (57821d0924), l'export des scores lit `nom`/`description` via `ListActionDefinitionsService` et non plus via `getReferentielTree`.
- `nom` est lu à de nombreux endroits du back, chacun avec sa propre requête SQL sur `action_definition` (inventaire plus bas). Le front n'accède jamais à la table directement, tout passe par ces services.

**Conséquence de conception :** les définitions doivent rester identiques pour toutes les collectivités, sinon on perd le cache sans fin, le caractère public de la procédure et la persistance locale à venir. La variante d'une collectivité ne peut donc pas être rendue dans `listActionDefinitions` : elle doit arriver **à côté**.

## Analyse des solutions

| Solution | Verdict |
|---|---|
| Dédoubler les lignes + `desactivation` | Non. Deux `actionId` pour une même mesure : statuts, scores, preuves, fiches liées et comparaisons entre collectivités divergent. |
| Dédoubler les colonnes (`Nom_DOM`) | Non. Duplique le texte entier pour 3 mots, dérive entre versions, migration + import à chaque nouvelle dimension. |
| Onglet « Variantes » (action, champ, condition, texte) | Autre piste : pas de modif d'import par dimension, mais même duplication du texte entier. Écartée. |
| Templating dans la cellule | **Oui**, seul à bien traiter la variation parcellaire. |

### Quel moteur ?

- **Handlebars** : déconseillé. Deuxième langage d'expression à côté du DSL existant, surface inutile (helpers, partials, échappement HTML à désactiver), historique de CVE (déjà un `override` pnpm), erreurs illisibles pour un éditeur.
- **Eta / EJS** : exclus (exécutent du JS arbitraire). **Nunjucks** : lourd, peu maintenu.
- **Mustache** : minuscule et sûr, mais `{{^dom}}` est cryptique et une faute de frappe rend du vide en silence.
- **LiquidJS** : le meilleur choix « sur étagère » (`{% if dom %}…{% else %}…{% endif %}`, mode strict). À retenir si le besoin dépasse un jour le conditionnel (boucles, variables, filtres).
- **Micro-syntaxe maison (recommandé)** : le besoin se réduit à *un* bloc conditionnel ; conditions, évaluation, validation et messages d'erreur en français existent déjà. ~100 lignes pures, zéro dépendance, un seul langage de condition.

### Syntaxe

```
{{si dom}}texte DOM{{sinon}}texte par défaut{{/si}}
{{si dom}}paragraphe réservé aux DOM{{/si}}
{{si metropole}}paragraphe masqué en DOM{{/si}}
```

- Pas de `#` : inutile avec une syntaxe maison (c'est une convention Handlebars).
- La condition est une expression du DSL existant, enrichie d'**alias** : `dom` → `identite(localisation, dom)`, `metropole` → `identite(localisation, metropole)`. Elle ne peut porter que sur des champs d'identité qui ont une valeur de référence (voir « Rendu par défaut »).
  - **Pas de négation.** Dans le DSL, `non` est la valeur booléenne faux (comme `faux`), et non un opérateur : la grammaire n'en a pas. Pour masquer un passage en DOM, on écrit la valeur contraire (`{{si metropole}}`). Quand le contraire couvre plusieurs valeurs (« tout sauf syndicat »), on passe par la branche `{{sinon}}` : `{{si syndicat}}{{sinon}}…{{/si}}`. `{{si non dom}}` est refusé à l'import, avec un message qui propose `metropole`.
  - **Résolution des alias dans un visiteur dédié**, `TemplateConditionVisitor extends PersonnalisationsExpressionVisitor` (`personnalisations-expression.service.ts`). Un identifiant nu en position de condition (`{{si dom}}`, `{{si dom ou syndicat}}`) est remplacé par l'expression de son alias, et un alias inconnu donne une erreur. Un identifiant en argument d'`identite(...)` reste une valeur : `primary` est commun aux deux cas, donc le visiteur suit s'il est dans les arguments d'un appel. Jamais de remplacement textuel, qui transformerait `identite(localisation, dom)` en `identite(localisation, identite(localisation, dom))`. Un nom d'alias ne peut être ni un mot-clé du DSL (`si`, `ou`, `et`, `non`…), ni un champ d'identité.
  - Sur ces champs, un éditeur avancé peut écrire la forme longue sans développement : `{{si identite(localisation, metropole)}}`, des combinaisons avec `et`/`ou`.
  - Ouvrir un nouveau champ, comme `population` ou `soustype`, demande une petite intervention de dev : choisir sa valeur de référence et, si besoin, un alias.
  - `population` est un cas plus délicat. C'est une liste de tranches qui se recouvrent (`moins_de_20000` et `moins_de_50000` peuvent être vraies en même temps). Sa valeur de référence serait donc un ensemble de tranches cohérent, par exemple celui d'un EPCI de plus de 50 000 habitants. L'aperçu, lui, énumérerait des profils réalistes plutôt que toutes les combinaisons de tranches. Cependant cela ne fait pas partie du besoin exprimé et ne sera probablement jamais nécessaire.
- **Imbrication autorisée** (un `{{si}}` à l'intérieur d'un autre) : le parseur récursif la gère sans surcoût, inutile de l'interdire.
- **En ligne, rien de spécial** : `La collectivité suit le {{si dom}}SAR{{sinon}}SRADDET{{/si}} en vigueur.` fonctionne tel quel, les balises sont simplement remplacées par le texte retenu, espaces et ponctuation autour inchangés.
- **Uniquement quand une balise est seule sur sa ligne**, cette ligne disparaît du rendu (fins de ligne `\n` comme `\r\n`, fréquentes depuis Google Sheets). Exemple :

  ```
  - Exemple A
  {{si dom}}
  - Exemple B (DOM)
  {{/si}}
  - Exemple C
  ```

  Sans cette règle, il resterait une ligne vide à la place de chaque balise, ce qui en Markdown coupe la liste en deux listes séparées. Avec, on obtient `A, B, C` (DOM) ou `A, C` (hors DOM) en une seule liste.

### Stockage : rendu par défaut + source à part

- Les colonnes existantes (`nom`, `description`…) reçoivent le **rendu par défaut**, c'est-à-dire le rendu pour une **identité de référence** (voir ci-dessous), donc du texte propre.
- Une colonne `templates jsonb` (nullable) conserve le texte source des seuls champs balisés : `{ "nom": "…{{si dom}}…" }`.
- Les lecteurs qui connaissent la collectivité re-rendent depuis `templates`.

Pourquoi ne pas stocker le texte balisé directement dans `nom` : tout lecteur non adapté (contexte sans collectivité comme l'API publique `get-referentiel.controller.ts`, vues SQL historiques de `data_layer` utilisées par Retool/stats, futur lecteur oublié) afficherait `{{si dom}}` en clair. Avec le rendu par défaut en colonne, le pire cas est « texte hors DOM », jamais des balises.

### Rendu par défaut = identité de référence, pas « toutes conditions fausses »

Définir le défaut comme « toutes conditions fausses » ne tient pas :

- `dom` et `metropole` sont toutes deux des valeurs acceptées (`IDENTITE_ALLOWED_VALUES`). Si toutes les conditions sont fausses, `{{si dom}}` et `{{si metropole}}` sont masqués ensemble : la collectivité n'est ni DOM ni métropole, et le rendu ne correspond à aucune collectivité réelle.
- Le sens du texte dépendrait de la façon dont l'éditeur a tourné sa condition : `{{si dom}}A{{sinon}}B{{/si}}` et `{{si metropole}}B{{sinon}}A{{/si}}` donneraient deux défauts différents pour le même contenu.

**Règle retenue :** le rendu par défaut est le rendu pour une identité de référence explicite, évaluée par le **même évaluateur** que les vraies collectivités :

```ts
// action-text-template.rules.ts
export const TEMPLATE_REFERENCE_VALUES = {
  localisation: 'metropole',
} as const satisfies Partial<Record<IdentiteField, string>>;
```

- L'éditeur n'a donc rien à organiser : l'ordre des branches et la façon de tourner la condition (`dom` ou `metropole`) ne changent pas le défaut.
- Seuls les champs d'identité qui ont une valeur de référence sont acceptés dans les balises. Une condition sur `type`, `population`… est refusée à l'import tant qu'on ne leur a pas choisi une valeur de référence (il n'y en a pas de naturelle : EPCI ou commune ?). Ajouter un champ = choisir sa valeur de référence, en connaissance de cause.
- `reponse(...)`, `score(...)` et `demarche(...)` sont refusés dans les balises : ils ne relèvent pas de l'identité et changeraient le texte au fil des réponses de la collectivité.
- `drom` à `null` (collectivités de test) : l'évaluateur actuel répond faux **à la fois** à `identite(localisation, dom)` et à `identite(localisation, metropole)` (`identite.drom === …`). On n'évalue donc jamais sur l'identité réelle. On évalue sur une **identité d'évaluation construite en un seul point**, `buildTemplateIdentite(variante)` : une `IdentiteCollectivite` complète, faite des valeurs de référence remplacées par celles de la variante. `buildTextVariantKey` normalise `drom ?? false` en amont.

**Ce qui reste à la charge de l'éditeur, et comment on le vérifie.** La machine garantit un défaut cohérent, mais pas que le texte de la branche de référence soit le bon. Pour ça :

- **Aperçu de toutes les variantes** dans le rapport de `verifyReferentielExpressions` (et donc dans l'endpoint de vérification) : pour chaque champ balisé, le rendu pour chaque combinaison des valeurs des champs d'identité qu'il utilise. Comme ces valeurs viennent d'enums finis, la liste est exhaustive : pour `localisation`, deux rendus, « Métropole (par défaut) » et « DOM ». L'éditeur relit ce que chaque public verra réellement.
- **Contrôles automatiques sur chaque variante** :
  - erreur si `nom` est vide dans une variante ;
  - erreur s'il reste `{{` ou `}}` après rendu (balise mal écrite) ;
  - avertissement si toutes les variantes sont identiques (balise inutile, par exemple `{{si dom}}X{{sinon}}X{{/si}}`) ;
  - avertissement si une condition vaut toujours vrai ou toujours faux sur l'ensemble des combinaisons (`dom ou metropole`).

**Ajouter une dimension plus tard (exemple : les syndicats)** : il n'y a ni migration, ni changement d'API, ni changement côté front.

1. Ajouter l'alias `syndicat` → `identite(soustype, syndicat)` dans `TEMPLATE_CONDITION_ALIASES`.
2. Ajouter `soustype: 'epci_a_fiscalite_propre'` dans `TEMPLATE_REFERENCE_VALUES`. Le défaut reste ainsi le texte « non syndicat ». Contrairement à `drom`, un `soustype` à `null` est une vraie valeur (les communes) : `buildTextVariantKey` le garde tel quel (`soustype=aucun`), et l'évaluateur répond déjà faux à `syndicat` pour une commune. Sans négation, « masqué pour les syndicats » s'écrit `{{si syndicat}}{{sinon}}…{{/si}}`.
3. Appliquer `normalizeTypeSyndicatExpressions` aux conditions des balises comme aux autres expressions de l'import. Sinon `identite(type, syndicat)` serait refusé, parce que `type` n'a pas de valeur de référence.
4. Incrémenter `TEMPLATE_RENDER_VERSION` : la composition de `textVariantKey` change (`r2;localisation=…;soustype=…`), et les caches front et back repartent proprement. Puis réimporter les référentiels balisés avec une nouvelle version (voir plus bas).

L'aperçu énumère alors `soustype` ∈ {EPCI à fiscalité propre, syndicat, pôle, aucun} (× `localisation` si la cellule l'utilise aussi), en **regroupant les rendus identiques** (« Syndicat » / « Autres ») pour rester lisible. La couverture des variantes demande juste une collectivité de test syndicat dans les e2e.

Contexte : aujourd'hui, les syndicats et les DROM ne peuvent pas encore basculer vers TE (`switch-to-te.rules.ts`, `getEligibiliteType`). Les variantes préparent leur arrivée sans en dépendre.

C'est aussi ce qui rend les **définitions statiques** compatibles : `listActionDefinitions` sert le rendu par défaut, identique pour tous, et peut rester publique, en cache et persistée.

### Livraison au front : définitions par défaut + surcharges par variante

**Retenu (A) : l'état donne la clé de variante, les surcharges ont leur propre query, en cache.**

**Clé de variante sur les champs.**
- `buildTextVariantKey(identite)` (moteur pur) part de l'identité réelle. Il ne garde que les champs de `TEMPLATE_REFERENCE_VALUES`, triés, avec des valeurs normalisées (minuscules, `drom ?? false`). Il les préfixe par `TEMPLATE_RENDER_VERSION`, par exemple `r1;localisation=dom`.
- La clé vaut `null` quand l'identité donne le rendu par défaut (toutes les valeurs égales à la référence). Il n'y a alors rien à charger : c'est le cas de toutes les collectivités hors DOM aujourd'hui.
- Pourquoi des champs, et pas toute l'identité : la clé est partagée par toutes les collectivités du même profil. Aujourd'hui, il n'y a que deux variantes (`null` et `r1;localisation=dom`). Elle ne change pas non plus quand un champ sans effet sur les textes est modifié (population, SINOE…).
- `TEMPLATE_RENDER_VERSION` est une constante à incrémenter quand on modifie les alias, les valeurs de référence ou les règles de rendu. Ces changements modifient le résultat sans changer la version du référentiel.
- **Réimport obligatoire après un changement de `TEMPLATE_RENDER_VERSION`.** Le rendu par défaut est calculé à l'import et stocké dans les colonnes. Les définitions en cache côté front ont pour clé la seule version du référentiel. Incrémenter la constante ne met donc à jour que les surcharges : il faut ensuite réimporter les référentiels balisés avec une nouvelle version. La règle est écrite en commentaire de la constante.

**Contrats.**
- `ListActionsDynamicStateResult` gagne `textVariantKey: string | null`, calculé pour la collectivité à chaque chargement de l'état. Un changement d'identité (localisation corrigée) donne donc une nouvelle clé, sans invalidation dédiée.
- Nouvelle procédure **publique** `referentiels.actions.listActionTextOverrides({ referentielId, referentielVersion, textVariantKey })` → `{ referentielVersion, textVariantKey, overridesById: Record<ActionId, ActionTextOverrides> }`. `ActionTextOverrides` vaut `Partial<Pick<ActionDefinition, TemplatedActionField>>`, avec les 8 champs de `TEMPLATED_ACTION_FIELDS`. `overridesById` couvre toutes les actions balisées du référentiel, et pour chacune seulement les champs dont le rendu diffère du défaut : quelques Ko au plus.
  - La procédure peut être publique : la clé décrit un profil (« DOM »), pas une collectivité, et les textes sont déjà publics.
  - `parseTextVariantKey` valide la clé (version de rendu, champ et valeur connus). Une clé invalide donne `BAD_REQUEST`.
  - `referentielVersion` en entrée ne sert que de clé de cache : le serveur répond toujours pour la version publiée et la renvoie. Un écart est traité comme pour les définitions (rechargement, une fois par écart).
- Map au niveau racine plutôt qu'un champ par action, parce que les mesures masquées (`hiddenActionIds`) ne sont pas dans `actionsById` et que `hiddenActions` affiche leur `nom`.

**Cache.**
- **Back** : `getTextOverridesForVariant(referentielId, textVariantKey)` est mémoïsé en mémoire (petit LRU) par (référentiel, version, clé). La version et les lignes sont lues dans une même transaction `repeatable read`, comme dans `listActionDefinitions`. Le contenu d'une clé ne change jamais, donc il n'y a rien à invalider, et plusieurs instances calculent chacune de leur côté. Les lecteurs back qui partent d'une collectivité (`getTextOverrides(collectiviteId)`) calculent la clé, puis passent par ce même cache.
- **Front** : une query par référentiel, `staleTime: Infinity`, active seulement quand l'état est chargé et que `textVariantKey` n'est pas `null`. Tant qu'elle charge, le hook reste en chargement, pour ne pas afficher le texte par défaut puis le remplacer. **En cas d'erreur, le hook est en erreur**, comme pour les définitions ou l'état : on n'affiche jamais un texte qui pourrait être faux pour la collectivité. Les surcharges ne sont plus renvoyées à chaque rechargement de l'état (après chaque écriture qui touche aux scores) : seule la clé repart.
- **Persistance locale** (offline-first) : petite collection persistée à côté des définitions, avec la clé (référentiel, version, variante). Elle est rechargée quand la version ou la clé change. La collection des définitions ne change pas : même clé (référentiel, version), même schéma, pas de `schemaVersion` à changer.

**Fusion.** Un helper pur du domaine, `applyActionTextOverrides(definition, overrides)`, est appelé par `mergeActionDefinitionsAndState(definitions, state, textOverrides?)`, pour `actionsById` comme pour `hiddenActions`. Sur la branche offline-first, `assemble-actions-grouped-by-id.ts` l'appelle aux deux mêmes endroits. Les consommateurs du hook ne changent pas.

**Extension possible : une clé basée sur les conditions.** Si on ouvre un jour des champs avec beaucoup de valeurs (`population`, ou `soustype` combiné à `localisation`), la clé sur les champs multiplierait des variantes qui donnent les mêmes textes. On pourrait alors prendre comme clé le vecteur de vérité des conditions distinctes de la version : conditions triées, alias développés, un bit par condition (`te:v3:01`). Toutes les collectivités qui donnent les mêmes textes partageraient ainsi une seule entrée. La clé ne vaudrait que pour sa version, et il faudrait évaluer les conditions pour la calculer. Le contrat (`textVariantKey` opaque) ne changerait pas.

**Écarté (B) : variante dans la clé des définitions complètes.** `listActionDefinitions({ referentielId, textVariantKey })` rendrait tout côté back, mais chaque variante pèserait ~3 Mo de plus, téléchargés et persistés, pour quelques Ko réellement différents. A garde la même clé et ne transporte que la différence.

**Exclu (C) : envoyer les `templates` au front et rendre côté client.** Il faudrait le DSL et l'identité dans le front, ce qui contredit « le front reçoit le texte déjà adapté ».

## Inventaire des lecteurs à adapter

| Lecteur | Champs | Collectivité connue | Traitement |
|---|---|---|---|
| `list-actions/list-action-definitions.service.ts` (`listActionDefinitions`) | tous | non pour la procédure tRPC (par conception) | **rendu par défaut, voulu**. Option back `{ collectiviteId? }` qui applique les surcharges : la procédure tRPC ne la passe jamais, les appelants back qui connaissent la collectivité la passent. Remplacer `...getTableColumns(actionDefinitionTable)` par une sélection qui exclut `templates`. Le schéma de sortie le retirerait de toute façon, mais autant ne pas le charger. |
| `list-actions/list-actions.service.ts` (`listActionsGroupedById`) | tous | oui | renvoie `textVariantKey` |
| `list-actions/list-action-text-overrides.service.ts` (`listActionTextOverrides`, nouveau) | tous | non (profil seulement) | surcharges d'une variante, en cache |
| `list-actions/list-actions.service.ts` (`listWithDetails`, `getTableColumns` l. 293) | tous | oui | surcharges appliquées sur les lignes ; exclure `templates` de la sélection |
| `get-referentiel/get-referentiel.service.ts` (`getReferentielTree`), appelé avec une collectivité par `scores.service.ts:911` et `:1084` (→ `nom` copié dans le payload des snapshots, donc `snapshots.getCurrent`), `preuves-archive/generate-preuves-archive.service.ts:243`, `switch-to-te/build-switch-to-te-context.service.ts:84`, et sur `main` `export-score/load-score-comparison.service.ts:315` | nom (`get-referentiel.repository.ts:48`, `:67`, `:148`, `:154`) | oui | option `collectiviteId` sur `getReferentielTree` |
| `export-score/load-score-comparison.service.ts` **après merge de TET-8215** (`listActionDefinitions` l. 348) | nom, description | oui (une seule collectivité par export) | appeler `listActionDefinitions({ referentielId, collectiviteId })`, une fois par export. Remplace l'entrée `getReferentielTree` de l'export. |
| `getReferentielTree` appelé sans collectivité : retour de l'import (`import-referentiel.service.ts:510`) et endpoint REST de debug `GET /referentiels/:id` (`get-referentiel.controller.ts:74`) | nom | non | rendu par défaut, voulu |
| `plans/fiches/list-fiches/list-fiches.service.ts:692` (mesures liées) | nom | oui | `applyNomOverrides` |
| `collectivites/discussions/…/discussion.repository.impl.ts:37` et `discussion-query-service.ts:99` | nom | oui | `applyNomOverrides` |
| `indicateurs/definitions/list-platform-definitions/…repository.ts:299` (mesures liées) | nom | oui | `applyNomOverrides` |
| `referentiels/historique/list-historique/list-historique.repository.ts` (sélections `actionNom`/`tacheNom`, dont `${ad.nom}` via une table aliasée, l. 275 et 344) | nom | oui | `applyNomOverrides` |
| `referentiels/action-definitions/action-definitions.repository.ts:30` (`listByActionIds`, export PDF des fiches) | nom | oui (`fiche.collectiviteId`) | `applyNomOverrides` |
| `score-indicatif/score-indicatif.repository.ts:79` | aucun texte (`actionId`, `exprScore`) | — | liste blanche du garde-fou |

Snapshots : le snapshot courant est recalculé automatiquement quand la version du référentiel change (`snapshots.service.ts:574`), donc le nom adapté y arrive dès l'import d'une nouvelle version. Les snapshots figés gardent le nom de leur date.

**Limite connue :** le `nom` copié dans le payload du snapshot courant n'est pas recalculé quand l'identité d'une collectivité change (localisation corrigée). Il est lu au moins par la comparaison d'audit (`useComparaisonScoreAudit.ts`). Il se met à jour au prochain recalcul de score ou changement de version. C'est accepté : une correction de localisation est très rare, et les DROM ne peuvent pas encore passer en TE.

Versions : la clé de cache et de persistance des définitions et des surcharges est la version publiée.
- **En production**, `checkLastVersion` (`base-spreadsheet-importer.service.ts`) refuse déjà une version qui n'est pas strictement supérieure : le changement de version est imposé par le code.
- **Hors production**, `allowVersionOverwrite` permet de réimporter avec la même version. Les caches restent alors périmés : définitions et surcharges côté front, LRU côté back. On le documente : après une réimportation à version égale, redémarrer le back et recharger le front sans cache. C'est déjà le cas des définitions depuis f4d2eabd1a.

## Implémentation

1. **Moteur pur** : `apps/backend/src/referentiels/action-definitions/action-text-template.rules.ts`
   - `parseActionTextTemplate(text)`, `renderActionTextTemplate(parsed, evaluateCondition)`, `hasTemplateMarkup(text)`, `TEMPLATE_CONDITION_ALIASES` (`dom`, `metropole`), `TEMPLATED_ACTION_FIELDS` (les 8 champs), `TEMPLATE_REFERENCE_VALUES`.
   - `TemplateConditionVisitor` (résolution des alias, voir « Syntaxe »), à côté de `PersonnalisationsExpressionVisitor`.
   - `buildTemplateIdentite(variante)` : seule identité d'évaluation, complète. `TEMPLATE_RENDER_VERSION`, `buildTextVariantKey(identite)` / `parseTextVariantKey(key)` (aller-retour testé, `null` pour le profil de référence). `listTemplateVariants(parsed)` : énumère les combinaisons de valeurs des champs utilisés et donne le rendu de chacune (pour l'aperçu et les contrôles).
   - Spec colocalisée : sinon absent, `{{si non dom}}` refusé avec suggestion, alias inconnu refusé, alias en position de condition et `identite(localisation, dom)` intact, imbrication, balise seule sur sa ligne (`\n` et `\r\n`), liens Markdown intacts, `{{` ou `}}` isolé refusé, bloc non fermé, `{{sinon}}` orphelin, condition invalide, champ d'identité sans valeur de référence refusé, `reponse(...)` refusé, `{{si dom}}A{{sinon}}B{{/si}}` et `{{si metropole}}B{{sinon}}A{{/si}}` qui donnent le même défaut.

2. **Domaine** : `packages/domain/src/referentiels/`
   - `actionTextOverridesSchema` / `ActionTextOverrides` dans `action-with-score.schema.ts` ; `textVariantKey` ajouté à `ListActionsDynamicStateResult`.
   - `actions/list-action-text-overrides.output.ts` : `listActionTextOverridesOutputSchema`.
   - `applyActionTextOverrides` + spec ; paramètre optionnel `textOverrides` de `mergeActionDefinitionsAndState` (`actionsById` et `hiddenActions`), spec mise à jour.
   - `actionStaticDefinitionSchema` **inchangé**, sans `templates` ni surcharge.
   - `TemplatedActionField` (union des 8 champs) dans le domaine, pour typer `ActionTextOverrides`. `TEMPLATED_ACTION_FIELDS` côté back s'en sert.

3. **Service partagé** : `action-definitions/render-action-texts.service.ts` (exporté par `action-definitions.module.ts`)
   - `getTextOverridesForVariant(referentielId, textVariantKey)` → `{ referentielVersion, overridesById }` : lit la version et les lignes où `templates is not null` (très peu) dans une même transaction. Il évalue avec `TemplateConditionVisitor` sur `buildTemplateIdentite(parseTextVariantKey(key))`, et ne garde que les champs dont le rendu diffère du rendu par défaut. Mémoïsé par (référentiel, version, clé), avec une remise à zéro réservée aux tests (`clearCacheForTests`).
   - `getTextVariantKey(collectiviteId)` : charge l'identité (`CollectivitesService.getCollectiviteAvecType`) puis appelle `buildTextVariantKey`.
   - `getTextOverrides(collectiviteId, { referentielId?, fields?, tx? })` → `Map<actionId, ActionTextOverrides>` : les deux précédents enchaînés, pour les lecteurs back.
   - `applyNomOverrides(collectiviteId, rows, accessor)` : helper pour les lecteurs de `nom`.
   - Tous les chemins (API publique, lecteurs back, import) passent par identité réelle → `buildTextVariantKey` → `buildTemplateIdentite`. Un `drom` à `null` donne ainsi le rendu par défaut et non un mélange.

4. **Import** : `import-referentiel.service.ts`, `verify-referentiel-expressions.ts`, `import-referentiel.repository.ts`
   - Validation dans `verifyReferentielExpressions` (donc aussi dans l'endpoint de vérification) : structure des blocs, parsing de chaque condition, champs limités à `TEMPLATE_REFERENCE_VALUES`, puis contrôles sur chaque variante (`nom` vide, balise résiduelle, variantes toutes identiques, condition constante). Erreurs et avertissements agrégés au format existant (mesure + colonne).
   - Le rapport de vérification ajoute l'aperçu des variantes de chaque champ balisé.
   - Colonnes = rendu pour l'identité de référence ; `templates` = sources des champs balisés ; ajouter `templates` à `columnsToUpdate`.
   - `templates` est **toujours recalculé et écrit**. Un champ qui a perdu ses balises en sort, et la colonne passe à `null` si plus aucun champ n'est balisé. Sinon, une ancienne surcharge resterait active et contredirait le nouveau texte.

5. **Schéma** : colonne `templates jsonb` sur `action_definition`, avec une migration sqitch et `action-definition.table.ts`. Les trois `getTableColumns(actionDefinitionTable)` qui partent vers une réponse (`list-action-definitions.service.ts`, `list-actions.service.ts`, `get-referentiel.repository.ts`) l'excluent explicitement.

6. **État et surcharges** :
   - `listActionsGroupedById` calcule `textVariantKey` en parallèle des pilotes et services (même `Promise.all`).
   - Nouvelle procédure publique `listActionTextOverrides` (`list-action-text-overrides.{input,service,router}.ts`, enregistrée dans `referentiels.router.ts`, schéma de sortie explicite), sur le modèle de `listActionDefinitions`.
   - Front (`main`), `use-list-actions-grouped-by-id.tsx` : troisième query par référentiel, `{ referentielId, referentielVersion, textVariantKey }` lus dans l'état, `staleTime: Infinity`, `enabled` si la clé n'est pas `null`. Le hook reste en chargement tant qu'elle n'a pas répondu. Les surcharges sont passées à la fusion du domaine. Écarts de version : la query des surcharges prend sa version dans l'état (elle fait partie de sa clé), donc elle est relancée d'elle-même quand l'état change de version. Si la version renvoyée diffère de celle demandée, l'écart est traité comme un écart définitions/état (même clé dans `handledVersionMismatchKeys`, un seul rechargement). La fusion n'applique les surcharges que si leur version est égale à celle des définitions.
   - Vérifier que les patchs de cache (`patch-action-explication-in-cache`, `patch-service-tag-in-denormalized-caches`) conservent `textVariantKey`.

7. **Autres lecteurs** : appliquer le service aux lecteurs « oui » du tableau. Pour l'arbre : option `collectiviteId` sur `getReferentielTree`, qui rend `nom` (mesures et noms d'origine) une seule fois pour ses appelants ; sans l'option, rendu par défaut. Pour l'export des scores : traiter la version qui sera sur `main` au moment du dev (`getReferentielTree` avant le merge de TET-8215, `listActionDefinitions({ referentielId, collectiviteId })` après). L'option `collectiviteId` de `ListActionDefinitionsService` n'existe que côté back : l'input de la procédure tRPC ne la contient pas.

8. **Garde-fou anti-oubli** : spec `action-definition-text-readers.spec.ts`, qui parcourt `apps/backend/src`. Il échoue si un fichier hors liste blanche contient `actionDefinitionTable.<champ balisable>`, `getTableColumns(actionDefinitionTable)`, `alias(actionDefinitionTable` (cas de l'historique) ou l'injection de `ListActionDefinitionsService`. La liste blanche commente chaque entrée : `list-action-definitions.service.ts` (rendu par défaut voulu), `score-indicatif.repository.ts` (pas de texte), et les lecteurs adaptés. Un nouveau lecteur doit passer par le service ou être déclaré explicitement.

9. **Offline-first (TET-8138, à rebaser)** : appeler `applyActionTextOverrides` dans `assemble-actions-grouped-by-id.ts`, aux deux endroits qui lisent la définition (lignes jointes et `hiddenActions`). Ajouter une collection `action-text-overrides.collection.ts` persistée comme les définitions, avec la clé (référentiel, version, variante), et synchronisée sur le modèle de `sync-referentiel-definitions.ts`, quand la version ou `textVariantKey` de l'état change. La jointure lit la ligne de la variante courante. Aucun changement dans `action-definitions.collection.ts` ni dans son schéma.

10. **Doc éditeurs** : syntaxe, alias disponibles, le défaut (le texte vu en métropole et par les lecteurs qui ne connaissent pas la collectivité), la relecture de l'aperçu des variantes avant import, l'absence de négation (valeur contraire ou `{{sinon}}`), et le fait qu'une réimportation à version égale, possible hors production seulement, n'est pas vue par les caches.

## Vérification

- `nx test backend 'action-text-template'` et `nx test backend 'action-definition-text-readers'`.
- Domaine : specs de `applyActionTextOverrides` et de `mergeActionDefinitionsAndState` (surcharge appliquée à `actionsById` et `hiddenActions`, sans effet sans surcharge).
- Moteur : `buildTextVariantKey` donne `null` pour une identité métropolitaine et pour `drom = null`, la même clé pour deux collectivités DOM aux populations différentes, et fait l'aller-retour avec `parseTextVariantKey`.
- `nx test backend 'verify-referentiel-expressions'`, `nx test backend 'import-referentiel'` : une cellule balisée valide donne les colonnes par défaut + `templates` ; une cellule invalide donne une erreur qui nomme la mesure et la colonne ; `identite(population, …)` dans une balise est refusé ; `nom` vide dans la variante DOM est refusé ; `{{si non dom}}` est refusé ; une balise dans `preuve` est acceptée ; le rapport contient l'aperçu Métropole / DOM.
- Retrait d'une balise : importer une mesure balisée, puis la réimporter sans balise. `templates` passe à `null`, et `listActionTextOverrides` ne la renvoie plus.
- `list-action-definitions.router.e2e-spec.ts` : avec une mesure balisée, la réponse contient le rendu par défaut et aucun champ `templates`, et elle est identique quel que soit l'appelant.
- E2E avec deux collectivités fraîches (DOM / hors DOM, `addTestCollectiviteAndUser`) et une mesure dont `nom` est balisé. La mesure est préparée par un helper de test, `setActionTemplatesForTest(db, { actionId, templates })`, qui écrit `templates` et le texte par défaut, vide le LRU, et rend une fonction de restauration à passer à `onTestFinished`. Les specs qui touchent cette mesure ne tournent pas en parallèle (même fichier, ou exécution séquentielle).
  - `list-actions.router` : `textVariantKey` vaut `null` hors DOM et `r1;localisation=dom` en DOM, et `listWithDetails` est cohérent ;
  - `list-action-text-overrides.router` (sans authentification) : la clé DOM renvoie la mesure surchargée ; une clé invalide donne `BAD_REQUEST` ; une version périmée en entrée donne la version publiée en sortie ;
  - export des scores : `nom` et `description` adaptés pour la collectivité DOM ;
  - front : si `listActionTextOverrides` échoue, le hook est en erreur ;
  - snapshot courant, fiches liées, discussions, historique, indicateurs : même nom pour une collectivité donnée, différent entre les deux.
- Manuel : baliser une mesure dans le sheet `te`, importer (nouvelle version), puis comparer page mesure, navigation, fiche liée, discussion et export des scores pour une collectivité DOM et une métropolitaine. Basculer de l'une à l'autre dans le même onglet pour vérifier que les définitions en cache ne sont pas rechargées, que les surcharges ne sont chargées qu'une fois pour la collectivité DOM, et que le nom change bien. Une écriture qui recalcule les scores ne recharge pas les surcharges.
