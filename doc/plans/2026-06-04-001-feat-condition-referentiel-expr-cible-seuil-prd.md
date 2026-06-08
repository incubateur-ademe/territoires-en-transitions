---
title: "feat: Condition referentiel(...) dans les expressions cible/seuil des indicateurs"
type: feat
status: active
date: 2026-06-04
---

# feat: Condition `referentiel(...)` dans les expressions cible/seuil des indicateurs

## Overview

Introduire une fonction `referentiel(...)` dans les expressions `exprCible`/`exprSeuil` des indicateurs, pour qu'une même cible/seuil prenne une valeur différente selon le référentiel courant (`te`, `cae`, `eci`) et, optionnellement, selon une version minimale. La logique de parsing/validation de l'argument est factorisée et partagée entre l'import (validation sémantique) et le runtime (évaluation), l'évaluateur restant pur. La décision « défaut = `te` à sa version courante » lorsqu'aucun contexte n'est fourni est centralisée dans `ValeursReferenceService`.

Le travail est séquencé en **3 tranches** : cœur (parser + évaluation), branchement métier (score indicatif), robustesse import. **Arrêt pour feedback après la tranche 1.**

## Problem Statement / Motivation

Les valeurs de référence d'un indicateur (cible et seuil) sont calculées à partir d'expressions (`exprCible`, `exprSeuil`) importées depuis le tableur des définitions d'indicateurs. Ces expressions savent déjà se personnaliser selon l'identité de la collectivité (`identite(...)`) ou ses réponses de personnalisation (`reponse(...)`), mais elles **ne savent pas s'adapter au référentiel considéré** ni à sa version.

Or, pour le cas d'usage « score indicatif » d'une action, une même cible/seuil doit pouvoir prendre une valeur différente selon que la collectivité est évaluée sur le nouveau référentiel Territoire Engagé (`te`) ou sur les référentiels historiques (`cae`, `eci`), et potentiellement selon la version du référentiel atteinte. Aujourd'hui c'est impossible à exprimer dans le tableur.

## Proposed Solution

Une nouvelle fonction `referentiel(...)` utilisable dans les expressions `exprCible`/`exprSeuil`, qui branche une valeur sur le référentiel courant et, optionnellement, sur une version minimale.

Du point de vue de la personne qui maintient le tableur des indicateurs :

- `si referentiel(te) alors 20 sinon 10` → la cible vaut `20` quand l'indicateur est évalué dans le contexte du référentiel `te` (toute version), `10` sinon.
- `si referentiel(te_2.1.3) alors 20 sinon 10` → la cible vaut `20` uniquement si le référentiel courant est `te` **et** que sa version est supérieure ou égale à `2.1.3`.
- Composition avec l'existant : `si referentiel(te) alors (si identite(localisation, DOM) alors 75 sinon 38) sinon (si identite(localisation, DOM) alors 85 sinon 50)`.

Côté score indicatif, le référentiel et sa version sont déterminés automatiquement à partir des actions demandées : l'utilisateur n'a rien à fournir de plus.

En l'absence de contexte référentiel explicite (graphiques, endpoint de référence, agrégations), on considère par défaut le référentiel le plus récent (`te`) à sa version courante : ces vues affichent donc la variante `te` la plus à jour.

### Tableau illustratif des règles

Exemple : une cible historique d'action `cae` vaut `10` ; on introduit une variante `te` à `20`. Hypothèse d'illustration : version courante de `te` = `2.2.0`.

| Cas | Formule historique (action CAE) | Nouvelle formule (variante TE) | Sans contexte (défaut = `te` @ version courante) | Avec contexte `cae` | Avec contexte `te` (=2.2.0) |
|---|---|---|---|---|---|
| Sans version | `10` | `si referentiel(te) alors 20 sinon 10` | **20** | 10 | 20 |
| Version atteinte (min `2.1.3`) | `10` | `si referentiel(te_2.1.3) alors 20 sinon 10` | **20** (2.2.0 ≥ 2.1.3) | 10 | 20 |
| Version non atteinte (min `9.9.9`) | `10` | `si referentiel(te_9.9.9) alors 20 sinon 10` | **10** (2.2.0 < 9.9.9) | 10 | 10 |

`te-test` se comporte comme `te`. La comparaison de version est un seuil minimal inclusif (`semver.gte`).

## User Stories

1. En tant que personne maintenant le tableur des indicateurs, je veux écrire `si referentiel(te) alors X sinon Y` dans une expression cible, afin de donner une cible différente sur le référentiel Territoire Engagé sans dupliquer l'indicateur.
2. En tant que personne maintenant le tableur, je veux écrire `si referentiel(te) alors X sinon Y` dans une expression seuil, afin de différencier le seuil selon le référentiel.
3. En tant que personne maintenant le tableur, je veux pouvoir préciser une version minimale via `referentiel(te_2.1.3)`, afin que la nouvelle valeur ne s'applique qu'à partir d'une version donnée du référentiel.
4. En tant que personne maintenant le tableur, je veux que `referentiel(te)` couvre aussi le référentiel de test `te-test`, afin de pouvoir tester avant la bascule définitive.
5. En tant que personne maintenant le tableur, je veux composer `referentiel(...)` avec `identite(...)` et `reponse(...)` dans des `si/alors/sinon` imbriqués, afin de couvrir tous les cas existants.
6. En tant que personne réalisant l'import des indicateurs, je veux que l'import échoue avec un message clair si une expression référence un référentiel inconnu (ex. `referentiel(xx)`), afin de détecter l'erreur de saisie au plus tôt.
7. En tant que personne réalisant l'import des indicateurs, je veux que l'import échoue si la version fournie est mal formée (ex. `referentiel(te_9.9)` non sémantique), afin d'éviter des comparaisons de version incorrectes en production.
8. En tant qu'utilisateur consultant le score indicatif d'une action, je veux que la cible/seuil affichée corresponde au référentiel de l'action consultée, afin d'obtenir un score cohérent.
9. En tant qu'utilisateur consultant le score indicatif, je veux que la version du référentiel soit prise en compte automatiquement, afin de ne pas avoir à la renseigner.
10. En tant que développeur appelant le calcul de score indicatif, je veux qu'une demande mélangeant des actions de référentiels différents soit rejetée par une erreur explicite, afin d'éviter un contexte d'évaluation ambigu.
11. En tant qu'utilisateur consultant un graphique d'indicateur (hors score indicatif), je veux que les valeurs de référence affichées correspondent par défaut au référentiel le plus récent (`te`, à sa version courante), afin de voir la valeur la plus à jour même sans contexte de référentiel explicite.
12. En tant que développeur du backend, je veux une logique de parsing/validation de l'argument `referentiel(...)` factorisée et partagée entre import et évaluation, afin d'éviter toute divergence de comportement.

## Technical Approach

### Fonctions et services à construire / modifier

- **Fonctions utilitaires partagées (nouveau fichier)** — pas un module/classe NestJS, simplement des **fonctions pures exportées** (précédents dans le backend : `evaluate-identite.ts` / `evaluateIdentite`, `referentiel.utils.ts` / `getReferentielIdFromActionId`, `get-formatted-errors.utils.ts`).
  - Fichier suggéré : `apps/backend/src/utils/expression-parser/parse-referentiel-arg.ts` (co-localisé avec `evaluate-identite.ts`, déjà consommé par les visitors).
  - Fonction `parseReferentielArg(arg) -> { referentielId, version? }` : découpe l'argument sur le premier `_` (avant = `referentielId`, après = version), valide `referentielId` via `referentielIdEnumSchema`, valide la version via `semver.valid` quand elle est présente, lève une erreur explicite sinon.
  - Éventuellement une fonction de comparaison `matchReferentiel(courant, arg)` (famille `te` ⊇ `te-test` + `semver.gte`) si cela clarifie le partage import/runtime.
  - Sans dépendance base de données, testable en isolation. Réutilisé à l'import (validation sémantique) et au runtime (évaluation).

- **`PersonnalisationsExpressionService` (`personnalisations-expression.service.ts`, modifié)** — c'est le service qui valide ET évalue `exprCible`/`exprSeuil`. Modifications :
  - `PersonnalisationsExpressionParser` : ajout d'un token/règle `referentiel` à argument unique.
  - `PersonnalisationsExpressionVisitor` : résolution de `referentiel(...)`. **L'évaluateur reste pur** — sans `referentielContext` fourni, `referentiel(id)` renvoie `false` (déterministe, aucun accès base) ; avec contexte, il compare le `referentielId` courant à l'argument (famille `te` ⊇ `te-test`) et applique `semver.gte(versionCourante, versionMin)` si une version minimale est précisée. La règle « défaut = `te` » n'est PAS portée par l'évaluateur (cf. `ValeursReferenceService`).
  - `PersonnalisationQuestionsExtractionVisitor` (+ un éventuel visitor d'extraction dédié) : capacité d'extraction des références `referentiel(...)` pour la validation à l'import, sur le modèle de l'extraction des `reponse(...)`.
  - Remplacement de la signature positionnelle de `parseAndEvaluateExpression` (`reponses`, `identite`, `scores`) par un **objet de contexte** unique, incluant un `referentielContext` optionnel.

- **`ValeursReferenceService` (`valeurs-reference.service.ts`, modifié)** — propage le `referentielContext` jusqu'à l'évaluateur, et **porte la décision « défaut = `te` »** :
  - quand l'appelant fournit un `referentielContext` (cas score indicatif), il est transmis tel quel ;
  - quand l'appelant n'en fournit pas (graphiques, endpoint `indicateurs.valeurs.reference`, agrégations), le service **injecte un contexte par défaut `{ referentielId: 'te', version: <version courante de te> }`**, la version courante étant lue via `GetReferentielDefinitionService`. Conséquence : ces vues affichent la variante `te` la plus à jour. Cette lecture de version se fait une fois par appel (et non par indicateur) ; mise en cache possible mais hors périmètre.
  - Concerne les deux entrées du service : `getValeursReference` et `getValeursReferenceForDefinition`.

- **`ScoreIndicatifService` (`score-indicatif.service.ts`, modifié)** — dans la préparation du contexte d'évaluation (`getEvaluationContext`) :
  - dérive le `referentielId` à partir des actions demandées via `getReferentielIdFromActionId` (préfixe de l'`actionId`) ;
  - applique un **guard mono-référentiel** : si les actions mélangent plusieurs référentiels, renvoie une erreur ;
  - lit la **version courante** du référentiel via `GetReferentielDefinitionService` ;
  - construit le `referentielContext` et le transmet à `ValeursReferenceService`.

- **`ImportIndicateurDefinitionService` (`import-indicateur-definition.service.ts`, modifié)** — bascule la **validation** de `exprCible`/`exprSeuil` de `IndicateurExpressionService` vers `PersonnalisationsExpressionService` (celui qui les évalue réellement). Ajoute une validation sémantique des `referentiel(...)` (référentiel connu, version `semver`-valide) qui fait échouer l'import en cas d'erreur.

### Décisions techniques

- **Syntaxe à argument unique** : `referentiel(te)` / `referentiel(te_1.2.3)`. L'argument est un identifiant unique (compatible avec le token `CNAME` existant : `te_1.2.3` est intégralement reconnu). Aucun nouveau token de version n'est ajouté au lexer de base, aucune modification de la grammaire partagée. Le découpage référentiel/version se fait sur le premier `_`, ce qui est non ambigu car les identifiants de référentiels utilisent un tiret (`te-test`) et jamais d'underscore. Cette convention reprend celle déjà utilisée pour extraire le référentiel d'un `actionId`.

- **Sémantique** : `referentiel(id)` vrai si le référentiel courant appartient à la famille `id` (la famille `te` inclut `te-test`) ; `referentiel(id_version)` ajoute la condition « version courante ≥ version », seuil minimal **inclusif**, comparaison sémantique via `semver`.

- **Un seul parser concerné** : `referentiel(...)` n'est ajouté qu'au parser de personnalisation. Les formules de score d'action (qui utilisent `cible(...)`/`limite(...)`) lisent des valeurs déjà calculées et n'ont pas besoin de cette fonction. C'est ce qui justifie la bascule de la validation d'import vers le parser de personnalisation (cohérence validation/évaluation, suppression d'une duplication de grammaire latente).

- **Contexte absent → défaut `te`** : quand aucun `referentielContext` n'est fourni, `ValeursReferenceService` injecte par défaut le référentiel le plus récent (`te`) à sa **version courante réelle** (lue via `GetReferentielDefinitionService`). Ainsi `referentiel(te)` → vrai, `referentiel(cae)`/`referentiel(eci)` → faux, et `referentiel(te_x.y.z)` est comparé à la version courante de `te`. L'évaluateur, lui, reste pur : sans contexte injecté, `referentiel(id)` vaut `false` (filet de sécurité déterministe). On ne renvoie donc jamais « `true` en dur » dans l'évaluateur — la décision produit « défaut = `te` » est centralisée dans `ValeursReferenceService`.

- **Version globale** : la version d'un référentiel est unique au niveau plateforme (une seule définition de référentiel courante). Elle est lue via le service de définition de référentiel, et non par collectivité.

- **Alignement ADR 0012 (pattern Result)** : les méthodes de service backend publiques concernées (calcul de score indicatif, et le guard mono-référentiel) doivent privilégier un retour `Result<…, erreur typée>` plutôt qu'un `throw`, avec conversion en erreur tRPC au niveau du routeur. La validation à l'import suit le comportement existant du service d'import (exception non-traitable / `UnprocessableEntityException`).

## Implementation Units

Séquencement validé. **Arrêt pour feedback après la tranche 1.**

- **Tranche 1 (cœur)** : fonctions `parse-referentiel-arg`, ajout `referentiel` au parser de personnalisation, évaluation contextuelle (évaluateur pur), passage à l'objet de contexte, tests unitaires de l'évaluateur.
- **Tranche 2 (branchement métier)** : dérivation du contexte dans le score indicatif (+ guard mono-référentiel), propagation jusqu'à l'évaluateur, injection du défaut `te` (version courante) dans `ValeursReferenceService` pour les appelants sans contexte, tests ciblés.
- **Tranche 3 (robustesse import)** : bascule de la validation `exprCible`/`exprSeuil` vers le parser de personnalisation + validation sémantique des `referentiel(...)`, tests d'import.

## Testing Decisions

Un bon test vérifie le **comportement externe** (entrée → sortie) sans se coupler aux détails d'implémentation (structure du CST, noms internes du visitor).

- **Fonctions `parse-referentiel-arg`** (prioritaire, testées en isolation) : argument valide sans version, avec version ; `te-test` ; référentiel inconnu → erreur ; version mal formée → erreur ; underscore manquant / version vide → erreur.

- **Évaluateur `PersonnalisationsExpressionService`** (prioritaire, tests unitaires) — c'est là que réside le risque logique. L'évaluateur étant pur, on teste les deux modes (avec / sans `referentielContext`) :
  - `si referentiel(te) alors 20 sinon 10` : contexte `te` → 20 ; contexte `cae` → 10 ; **sans contexte → 10** (évaluateur pur, comportement « filet de sécurité »).
  - `si referentiel(te_2.1.3) alors 20 sinon 10` (contexte `te`) : versions `2.1.2` → 10, `2.1.3` → 20, `2.2.0` → 20.
  - `referentiel(te)` avec contexte `te-test` → vrai.
  - composition avec `identite(...)` imbriqué.
  - Prior art : tests existants du parser d'expressions et du service de personnalisation.

- **Service de score indicatif** (test ciblé, après la tranche cœur) : dérivation correcte du référentiel/version depuis les actions ; erreur sur mélange de référentiels. Prior art : tests existants du score indicatif (exécutables via `pnpm test:backend`).

- **Import des définitions** (tranche robustesse) : import rejeté pour référentiel inconnu et version mal formée. Prior art : tests d'import des définitions d'indicateurs existants.

## Out of Scope

- Fournir un contexte référentiel *par collectivité* aux graphiques / endpoint `indicateurs.valeurs.reference` : ils utilisent le défaut `te` (version courante), sans tenir compte du référentiel réel de la collectivité.
- La mise en cache de la lecture de la version courante de `te` dans le chemin sans contexte (optimisation possible, non requise).
- Le support de `referentiel(...)` dans les formules de score d'action (`exprScore`) ou dans les formules d'agrégation d'indicateurs (`valeurCalcule`).
- La gestion d'une version par collectivité / par snapshot (la version utilisée est la version courante globale du référentiel).
- La suppression du référentiel de test `te-test` (traité comme membre de la famille `te` ; sa disparition future est hors périmètre).
- Toute évolution de l'UI d'affichage du score indicatif.

## Further Notes

- `doc/adr/0012-pattern-result.md` — pattern `Result` pour les méthodes de service publiques, conversion en erreur tRPC au niveau du routeur
