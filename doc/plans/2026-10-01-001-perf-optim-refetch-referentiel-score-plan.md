---
title: "perf: Alléger listActionsGroupedById et le trafic après recalcul des scores"
type: perf
status: active
date: 2026-10-01
notion: TET-8095
branch: TET-8095/optim-score-refetch
---

# perf: Alléger `listActionsGroupedById` et le trafic après recalcul des scores

## Overview

Chaque écriture qui touche les scores recharge l'intégralité de `listActionsGroupedById` (≈1,5 Mo sur TE, ≥ 2,2 Mo sur CAE, sans gzip), dont 70 à 75 % de textes de définition qui ne changent qu'à la publication d'un référentiel. En parallèle, les mutations renvoient un snapshot complet que le front jette. Le plan supprime ces réponses inutiles, puis sépare la partie statique (définitions, cache permanent) de la partie dynamique (scores, généalogie, pilotes/services), fusionnées de façon transparente côté front.

## Problem Statement / Motivation

`referentiels.actions.listActionsGroupedById` est invalidée après chaque écriture qui touche les scores (statut, commentaire, pilotes, indicateur, personnalisation…), depuis 16 sites côté front. Chaque action y est renvoyée en entier : une modification de statut recharge donc tout le référentiel, textes compris.

La réponse est construite dans `ListActionsService.listActionsGroupedById` en fusionnant deux sources :

1. l'arbre du snapshot courant (`scoresPayload.scores`), aplati par `scoreSnapshotTreeToActionsWithGenealogyGroupedById`, qui apporte `score`, `scoresTag`, `scoreIndicatif`, la généalogie, mais aussi des champs de définition (`nom`, `identifiant`, `categorie`, `points`, `level`, `actionType`, `exprScore`, `tags`, `preuves`) ;
2. `listWithDetails`, un agrégat SQL sur `action_definition` + pilotes + services + labels, dont le `GROUP BY` porte sur toutes les colonnes texte.

La fusion fait `{ ...snapshot, ...definition }` : la définition écrase les champs en double, et les champs propres au snapshot (`level`, `tags`, `preuves`) partent dans la réponse sans être déclarés dans le type `Action`.

### Mesures (base locale, JSON réel, sans gzip)

| Part du payload | CAE (1 471 actions) | TE (656) | ECI (368) |
|---|---|---|---|
| Textes longs de `action_definition` (description, contexte, exemples, ressources, perimetreEvaluation, reductionPotentiel, preuve, exprScore) | **≈1,1 Mo** | **≈1,1 Mo** | ≈0,3 Mo |
| Objet `score` du snapshot | ≈640 Ko | à mesurer | à mesurer |
| Reste des nœuds du snapshot (nom, identifiant, categorie, points, tags, level, preuves… **en double** avec la définition) | ≈530 Ko | à mesurer | à mesurer |
| **Total de la réponse** | à mesurer (≥ 2,2 Mo d'après les lignes ci-dessus) | **≈1,5 Mo** ¹ | à mesurer |

¹ Relevé dans les devtools en mode dev (donc sans gzip) sur la requête `listActionsGroupedById` TE rechargée après un `setScoreFromIndicateur`. Sur TE, les textes longs (≈1,1 Mo) pèsent donc ≈73 % de la réponse ; `score`, doublons, généalogie et pilotes/services se partagent les ≈0,4 Mo restants.

CAE est le référentiel le plus lourd (≥ 2,2 Mo d'après la ventilation) : mesurer son total de la même façon pour avoir une référence avant/après.

**La partie statique (textes + doublons) représente environ 70 à 75 % du payload, sur TE comme sur CAE.** Elle ne change qu'à la publication d'une nouvelle version d'un référentiel.

### Autres constats en lisant le code

1. **Le snapshot complet est renvoyé puis jeté.** `updateStatut`, `updateStatuts`, `setScoreFromIndicateur`, `setIndicateurSuivi` et `snapshots.computeAndUpsert` renvoient un `ScoreSnapshot` complet (`scoresPayload` ≈1,2 Mo pour CAE, soit l'objet `score` + le reste des nœuds du tableau ci-dessus). Or le front n'observe jamais `snapshots.getCurrent` : aucun `useQuery`/`queryOptions` sur cette clé (seuls `setQueryData`, `invalidateQueries` et `broadcastQueryInvalidation` y font référence). Ces écritures de cache sont donc sans effet. Une modification de statut transfère ainsi ≈1,2 Mo (réponse de la mutation) puis le rechargement complet de la liste.
2. **La compression est déjà active** : la prod répond avec `content-encoding: gzip`. Le gain réseau sera donc bien inférieur aux chiffres bruts ci-dessus. Ce qu'on gagne surtout : coût client (décompression, `JSON.parse`, mémoire, nouveau rendu des consommateurs), requête SQL (plus de `GROUP BY` sur les textes) et sérialisation côté backend.
3. **Bug annexe** : [use-update-action-explication.ts](apps/app/src/referentiels/actions/use-update-action-explication.ts) type le cache comme un `ActionsGroupedById`, alors qu'il contient `{ actionsById, hiddenActions }`. `old[actionId]` vaut toujours `undefined`, donc la mise à jour optimiste du commentaire ne fait jamais rien. (`old` est simplement le paramètre de l'updater de `setQueriesData`. Le seul champ déprécié du domaine est `referentiel`, `@deprecated use referentielId` : le nouveau code ne doit pas le lire.)
4. **`childrenIdsWithExprScore` mélange statique et dynamique** : il combine `exprScore` (définition) et `childrenIds` (filtré par `desactive` pour TE, cf. `filterHiddenActionsFromGroupedById`).
5. **Versions** : `action_definition` n'a que `actionId` comme clé primaire, donc une seule version par référentiel en base. `ScoreSnapshot.referentielVersion` est nullable et reflète la version **au moment du calcul**, qui peut être antérieure à la version publiée.

### Appelants vérifiés

| Élément modifié | Appelants | Impact |
|---|---|---|
| `ListActionsService.listActionsGroupedById` | uniquement `list-actions.router.ts` | contrat tRPC seul |
| `ListActionsService.listWithDetails` (public) | `handle-mesure-audit-statut.service.ts` : CTE pour `actionId`, `actionType`, `nom`, `referentiel` | **ne pas modifier** : écrire des requêtes séparées pour les définitions et pour les pilotes/services |
| `ListActionsService.countPiloteActions` | `users-metrics.service.ts` | aucun |
| `scoreSnapshotTreeToActionsWithGenealogyGroupedById` (domain) | uniquement `list-actions.service.ts` (+ spec) | on peut ajouter une projection sans casser personne |
| Types `ListActionsGroupedByIdResult` / `ActionsGroupedById` | backend : `list-actions.service.ts` ; front : `patch-service-tag-in-denormalized-caches.ts`, `referentiel-dropdown.navigation.tsx`, `use-update-action-explication.ts` | conserver le type fusionné, créer un nouveau type pour la réponse « état » |
| Réponse des routers `updateStatut` / `updateStatuts` | specs : `update-action-statut.router.e2e-spec.ts`, `referentiel-scoped-permissions.router.e2e-spec.ts` ; Playwright : `ReferentielsFixture.updateActionStatut` (typée `Promise<ScoreSnapshot>`) | lire le snapshot via `snapshots.getCurrent` dans les tests |
| Réponse du router `snapshots.computeAndUpsert` | `snapshots.router.e2e-spec.ts` (≈6 tests lisent `scoresPayload` dans la réponse) ; front : `use-snapshot.tsx`, `useSaveScore.ts` (n'utilisent pas la réponse) | voir 1a |
| Services `UpdateActionStatutService`, `SetScoreFromIndicateurService` | `switch-to-te.service.ts`, `set-score-from-indicateur.service.ts` et les specs de service | **ne changer que les routers**, pas la valeur de retour des services |
| e2e backend `list-actions.router.e2e-spec.ts`, `handle-mesure-pilotes.router.e2e-spec.ts` | lisent `actionsById[x].pilotes` et des champs de définition | à adapter (les pilotes restent dans la partie dynamique) |

Aucun prefetch serveur (`prefetchQuery`/`fetchQuery`) de `listActionsGroupedById` côté Next. Aucun autre client (`apps/tools`, `e2e/`) n'appelle la procédure, hormis les commentaires d'un spec Playwright. Un `grep` sur `apps/app/src/referentiels` ne trouve aucune lecture de `.level`, `.tags` ou `.preuves` sur une action fusionnée.

## Proposed Solution

Par ordre de rapport gain/effort.

### Étape 1 : gains rapides, sans changer le contrat de lecture

**1a. Ne plus renvoyer le snapshot complet depuis les mutations**

- Routers : [update-action-statut.router.ts](apps/backend/src/referentiels/update-action-statut/update-action-statut.router.ts) (`updateStatut`, `updateStatuts`), [set-score-from-indicateur.router.ts](apps/backend/src/referentiels/set-score-from-indicateur/set-score-from-indicateur.router.ts) (`setScoreFromIndicateur`, `setIndicateurSuivi`).
- Renvoyer `SnapshotWithoutPayloads` (le schéma `snapshotWithoutPayloadsSchema` existe dans `packages/domain/src/referentiels/scores/score-snapshot.schema.ts`) plutôt que rien : ça garde `pointFait`/`pointPotentiel`… pour un éventuel usage futur, pour quelques octets.
- La transformation se fait **dans le router** ; les services gardent leur valeur de retour (utilisée par `switch-to-te.service.ts`, `set-score-from-indicateur.service.ts` et les specs de service).
- `snapshots.computeAndUpsert` : appelé rarement par le front (figer un état des lieux, valeurs utilisées d'un indicateur) et sa réponse est lue par ≈6 tests de `snapshots.router.e2e-spec.ts`. **À traiter dans un second temps**, ou en même temps si on accepte de réécrire ces tests via `getCurrent`.
- Côté front, supprimer les `setQueryData`, invalidations et diffusions inter-onglets sur `snapshots.getCurrent`, toutes sans effet : [use-set-score-from-indicateur.ts](<apps/app/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/components.new-referentiel/indicateurs-score/use-set-score-from-indicateur.ts>) (et le type `ScoreSnapshot` de `onSuccess`), [use-snapshot.tsx](apps/app/src/referentiels/use-snapshot.tsx), `use-update-action-statut.ts`, `use-action-statut.ts`, `use-upsert-indicateur-valeur.ts`, `use-delete-indicateur-valeur.ts`, `use-set-personnalisation-reponse.ts`, `use-switch-to-te.ts`.
- Adapter les tests listés dans le tableau des appelants.
- Gain : ≈1,2 Mo de JSON (avant gzip) en moins par écriture sur CAE.

**1b. Corriger** `patchActionExplicationInCache` pour qu'il cible `old.actionsById` (type `ListActionsGroupedByIdResult`), avec un test unitaire de la fonction.

### Étape 2 : séparer la partie statique et la partie dynamique

**Backend**

- Nouvelle query `referentiels.actions.listActionDefinitions({ referentielId })` dans `apps/backend/src/referentiels/list-actions/` :
  - fichiers `list-action-definitions.service.ts`, `.router.ts`, `.input.ts`, suivant ADR 0011 ;
  - renvoie `{ referentielVersion, definitionsById: Record<ActionId, ActionDefinition & ActionLabels> }`, où `referentielVersion` vient de `referentiel_definition.version`. On garde le champ `referentiel` (déprécié) uniquement pour que le type fusionné ne change pas ; aucune logique nouvelle ne doit le lire ;
  - reprend la partie définition de `listWithDetails` : colonnes, `depth`, `actionType`, `questionIds`, `labels`, mais **sans** jointure sur les pilotes et les services (le `GROUP BY` ne sert plus qu'aux `labels` ; une sous-requête `array_agg` comme pour `questionIds` permet de le supprimer) ;
  - indépendante de la collectivité : données publiques, comme `referentiels.definitions.get` déjà en `publicProcedure`. Le cache React Query est donc partagé entre collectivités.
- `listActionsGroupedById` **garde son nom et son input** (les 16 sites d'invalidation restent valides) mais ne renvoie plus que la partie dynamique :
  - `{ referentielVersion, actionsById: Record<ActionId, { actionId, score, scoresTag, scoreIndicatif?, pilotes, services, parentId, childrenIds, nextId, previousId }>, hiddenActionIds: ActionId[] }` ;
  - `referentielVersion` est la **version publiée courante** (lue dans `referentiel_definition`, requête triviale), pas celle du snapshot : sinon un snapshot calculé sur une ancienne version provoquerait une invalidation des définitions à chaque rechargement, sans jamais converger ;
  - la généalogie reste dynamique, parce que `childrenIds`, `nextId`/`previousId` et le filtrage des actions masquées dépendent de `desactive` (personnalisation TE) ;
  - les champs du nœud de snapshot qui doublonnent la définition (`nom`, `identifiant`, `categorie`, `tags`, `level`, `preuves`, `points`, `exprScore`, `actionType`) sont retirés **en sélectionnant explicitement** les champs à la sortie (pas de spread), sans modifier `scoreSnapshotTreeToActionsWithGenealogyGroupedById` ;
  - `hiddenActions` devient `hiddenActionIds` (le nom change avec la forme, pour qu'aucun appelant ne lise par erreur `identifiant`/`nom` dessus) ;
  - `childrenIdsWithExprScore` sort de la réponse : il est recalculé côté front lors de la fusion (`exprScore` des définitions × `childrenIds` de l'état), ce qui garde chaque partie pure ;
  - les pilotes et les services viennent d'une nouvelle requête privée `listPilotesAndServicesGroupedByActionId(collectiviteId, referentielId)`, sans `action_definition` dans le `GROUP BY`. **`listWithDetails` n'est pas modifié**.
- Types dans `packages/domain/src/referentiels/action-with-score.schema.ts` : ajouter `ActionDynamicState` et `ActionStaticDefinition`, et le type de résultat de chaque query. Le type fusionné `Action` et `ListActionsGroupedByIdResult` (forme fusionnée, `hiddenActions: HiddenActionSummary[]`) sont conservés tels quels pour le front.
- La fonction de fusion (`mergeActionDefinitionsAndState(definitions, state): ListActionsGroupedByIdResult`) vit dans `packages/domain/src/referentiels/` : pure, testable, et réutilisable côté backend si besoin.

**Front : fusion transparente dans un seul hook**

- [use-list-actions-grouped-by-id.tsx](apps/app/src/referentiels/actions/use-list-actions-grouped-by-id.tsx) : `useQueries` lance, pour chaque référentiel, la query de définitions (`staleTime: Infinity`, `gcTime: Infinity`) et la query d'état (options actuelles). Le `combine` appelle `mergeActionDefinitionsAndState` et produit exactement l'`ActionsGroupedByIdData` actuel (`hiddenActions` résolues avec `identifiant`/`nom`, `childrenIdsWithExprScore` recalculé).
  - `ActionsGroupedByIdData` ne peut plus être dérivé de `RouterOutput[...]['listActionsGroupedById']` : il devient un alias de `ListActionsGroupedByIdResult`.
  - `combine` stable (fonction au niveau du module ou `useCallback`) et fusion mémoïsée par paire (`definitions.dataUpdatedAt`, `state.dataUpdatedAt`) pour préserver les références entre deux rendus.
  - `isPending`/`isError` agrègent les deux queries de chaque référentiel ; aucune donnée n'est exposée pour un référentiel tant que les deux parties ne sont pas là.
  - Une action présente dans l'état mais absente des définitions (snapshot plus ancien que la version publiée) est ignorée, comme les actions de définition absentes de l'état.
  - Si `state.referentielVersion !== definitions.referentielVersion`, on invalide les définitions de ce référentiel (publication d'une nouvelle version sans rechargement de page).
- Les ~30 fichiers consommateurs (`useListActions`, `useGetAction`, `useGetActionChildren`…) ne changent pas.
- Sites qui modifient le cache (`setQueriesData`) : ils ne touchent que `score.explication`, `pilotes` et `services`, qui restent dans la partie dynamique. Il suffit de les retyper vers le type « état ». Fichiers : `use-update-action-explication.ts`, `patch-service-tag-in-denormalized-caches.ts`, `use-mesure-pilotes.ts`, `use-mesure-services-pilotes.ts`.
- Les stories et `use-referentiel-table-data.ts`, qui fabriquent des actions factices, ne bougent pas puisque le type fusionné est inchangé.

**Gain attendu** (JSON sans gzip) : sur TE, la réponse rechargée après chaque écriture passe de ≈1,5 Mo à ≈0,4 Mo au plus (on retire les ≈1,1 Mo de textes, plus les doublons). Sur CAE, elle ne contient plus que `score` (≈640 Ko), `scoresTag`, `scoreIndicatif`, la généalogie et les pilotes/services, contre ≥ 2,2 Mo aujourd'hui. La requête SQL ne fait plus de `GROUP BY` sur les textes longs. Les définitions ne sont téléchargées qu'une fois par session et par référentiel. Au premier chargement, deux requêtes partent en parallèle au lieu d'une.

### Étape 3 : pour aller plus loin (facultatif, selon les mesures après l'étape 2)

- **Compacter `score`** (≈640 Ko pour CAE, devient le poste principal) : ne plus envoyer les champs `null`/`0`/`undefined`, et retirer les champs que le front n'utilise pas (`pointPotentielPerso`, `statutModifiedBy`…), après audit.
- **Les mutations renvoient directement l'état dynamique** (même forme que la nouvelle `listActionsGroupedById`). Le front fait `setQueryData` au lieu d'invalider, ce qui supprime l'aller-retour. Prérequis : le service d'écriture sait construire cet état (snapshot + pilotes et services) ; à mettre en balance avec la diffusion inter-onglets, qui continuera d'invalider.
- **Moins d'invalidations** : les mutations pilotes et services pourraient se contenter de `setQueryData` (leur réponse suffit) au lieu de recharger tout le référentiel.
- **Cache persistant des définitions** : en-têtes HTTP `Cache-Control` sur la query publique, avec la version dans l'input pour invalider le cache à chaque publication (via `responseMeta` de tRPC), ou persister React Query en IndexedDB. Les définitions survivent alors aux rechargements de page.

## Ordre d'implémentation (découpage en PR)

1. Étape 1a (hors `computeAndUpsert`) + 1b : petite PR, sans changement de contrat de lecture.
2. Étape 2 backend + front dans une même PR : le contrat de `listActionsGroupedById` change, le front suit au même déploiement. Pas de compatibilité temporaire : un onglet resté ouvert sur l'ancien front affiche des données incomplètes jusqu'à son rechargement, ce qui est accepté.
3. `computeAndUpsert` et étape 3 : PR séparées, selon les mesures.

## Vérification

- Backend :
  - `nx test backend 'list-actions.router.e2e-spec.ts'` : adapter les assertions à la nouvelle forme ; ajouter `list-action-definitions.router.e2e-spec.ts` (accès anonyme, `labels`, `questionIds`, `referentielVersion`).
  - `nx test backend 'handle-mesure-pilotes'`, `nx test backend 'handle-mesure-audit-statut'` (garde-fou sur `listWithDetails`), `nx test backend 'update-action-statut'`, `nx test backend 'set-score-from-indicateur'`, `nx test backend 'referentiel-scoped-permissions'`.
- Domain : spec pur de `mergeActionDefinitionsAndState` (fusion, `hiddenActions` résolues, `childrenIdsWithExprScore`, action absente d'un côté).
- Front :
  - `nx test app 'use-update-action-explication'` (nouveau test du patch) et `nx test app 'use-list-actions'`.
  - `nx typecheck app` pour vérifier que le type fusionné est inchangé pour les consommateurs.
- Taille : dans les mêmes conditions que la mesure de référence (devtools, mode dev, après un `setScoreFromIndicateur`), comparer la réponse de `listActionsGroupedById` TE (référence ≈1,5 Mo), puis CAE et ECI, et celle de la mutation, avant et après, sur une collectivité de la base locale (par ex. 5457).
- e2e Playwright sur les référentiels (`e2e/tests/referentiels/…`) : modification de statut, navigation mesure suivante/précédente, checklist de labellisation, mesures masquées TE, commentaire d'une mesure.

## Décisions tranchées

- Référence de mesure : ≈1,5 Mo (TE, devtools en mode dev, sans gzip, après `setScoreFromIndicateur`). Les mesures après refonte se font dans les mêmes conditions.
- Pas de compatibilité temporaire de `listActionsGroupedById` pendant le déploiement.
