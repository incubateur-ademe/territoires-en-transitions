---
title: "feat: Dérivation du statut d'une action à partir de son score indicatif"
type: feat
status: active
date: 2026-06-05
---

# feat: Dérivation du statut d'une action à partir de son score indicatif

## Aperçu

Sur le référentiel **Climat Ressources** (`te`), le score calculé à partir des valeurs d'indicateur cesse d'être purement indicatif : il **devient le statut d'avancement** de l'action. À l'enregistrement de la valeur d'indicateur retenue, le backend dérive le statut détaillé au pourcentage à partir de `fait.score`, l'écrit via le chemin existant (`upsertActionStatuts`) et recalcule le snapshot.

Le tout se fait en **un seul appel**, dans une **transaction unique** : on ne peut pas enregistrer une valeur sans appliquer le statut correspondant.

Les référentiels historiques (`cae`, `eci`) sont **strictement inchangés** : ils conservent la procédure `setValeursUtilisees` existante et le caractère indicatif du score.

Cette fonctionnalité constitue la **phase 2** du PRD `2026-06-04-001` (condition `referentiel(...)` dans les expressions cible/seuil), qui fiabilise le calcul du score indicatif par référentiel.

Le travail est séquencé en **3 tranches**. **Arrêt pour feedback après la tranche 1.**

## Problème / Motivation

Sur le référentiel TE, la saisie manuelle du statut est **déjà désactivée** pour les actions dont le score est calculé à partir d'indicateurs : le sélecteur de statut est remplacé par la mention « Le score est calculé automatiquement à partir des indicateurs » (cf. `hasIndicateursScore` et ses usages dans `referentiel-table.statut.cell.tsx`, `referentiel-table.statut-detaille.cell.tsx` et `components.new-referentiel/subaction.tsx`).

Mais rien ne calcule ce statut aujourd'hui. Ces actions restent donc en `non_renseigne`, alors même que les données d'indicateur existent, **sans aucun moyen de correction** puisque la saisie est verrouillée. Le score réel de la collectivité ignore des données potentiellement déjà saisies (très peu probables, le référentiel n'étant pas encore ouvert largement aux collectivités en écriture), et l'interface promet un calcul automatique qui n'a pas lieu.

Le problème n'est donc pas une double saisie à éviter — c'est un trou fonctionnel : la promesse faite à l'utilisateur n'est pas tenue.

## Solution proposée

Lorsque l'utilisateur enregistre la valeur d'indicateur retenue pour une action du référentiel TE, le serveur, dans une seule et même transaction :

1. enregistre la valeur retenue ;
2. recalcule le score à partir de cette valeur ;
3. en dérive le statut détaillé au pourcentage et l'écrit.

Puis il recalcule le snapshot et le renvoie au client.

Si le statut ne peut pas être appliqué (parcours verrouillé par un audit, action désactivée), **rien n'est enregistré** et l'utilisateur voit une erreur : les deux écritures sont indissociables. Cas peu probable voir impossible, la sélection de la valeur retenue sera également bridée sur les mêmes conditions que l'écriture des statuts.

### Dérivation

Seul `fait.score` est utilisé. Le statut détaillé se réduit à une part **faite** et une part **pas faite** ; la part **programmée** est toujours nulle.

```
fait    = clamp(faitScore, 0, 1)
triplet = [fait, 0, 1 − fait]
```

| `faitScore` | Triplet `[fait, programmé, pasFait]` | Statut après normalisation |
|---|---|---|
| 0.5 | `[0.5, 0, 0.5]` | `detaille` |
| 1.0 | `[1, 0, 0]` | `fait` |
| 1.3 (au-delà du plafond de la formule) | `[1, 0, 0]` (bridé) | `fait` |
| 0 | `[0, 0, 1]` | `pas_fait` |
| non calculable | (aucun) | inchangé — no-op |

Deux points sont des **décisions**, pas des évidences :

- **un score de `0` produit `pas_fait`**, et non `non_renseigne` : la donnée existe et vaut zéro, ce qui est une information, pas une absence d'information ;
- **la normalisation est déléguée** : on soumet toujours `statut = DETAILLE_AU_POURCENTAGE` et l'adapter existant `actionStatutCreateToActionStatutInDatabase` ramène `[1,0,0]` à `fait` et `[0,0,1]` à `pas_fait`. Aucune logique de normalisation n'est dupliquée.

`programme.score` n'est plus utilisé pour le statut. Son retrait de l'affichage du score indicatif fera l'objet d'une PR distincte.

## User Stories

1. En tant qu'utilisateur du référentiel TE renseignant la valeur d'indicateur d'une action, je veux que le statut d'avancement en soit déduit et appliqué automatiquement, afin que l'interface tienne la promesse d'un score « calculé automatiquement à partir des indicateurs ».
2. En tant qu'utilisateur, je veux que la dérivation n'ait jamais lieu à moitié — valeur enregistrée sans statut appliqué — afin de ne pas me retrouver avec un score incohérent que je n'ai aucun moyen de corriger.
3. En tant qu'utilisateur des référentiels CAE/ECI, je veux que mon fonctionnement actuel soit inchangé.
4. En tant que développeur, je veux une fonction pure de dérivation testable en isolation, afin de garantir un comportement déterministe et partageable.

## Technical Approach

### Fonction pure (domaine)

`packages/domain/src/referentiels/scores/calculate-avancement-from-score.rules.ts`, exportée depuis `packages/domain/src/referentiels/index.ts` :

```ts
export function calculateAvancementFromScore(
  score: number | null | undefined
): StatutDetailleAuPourcentage | null;
```

- bride le score à `[0, 1]` et renvoie `[fait, 0, 1 − fait]` ;
- renvoie `null` quand le score est absent, ou non fini (`NaN`, `Infinity`, `-Infinity`) — l'appelant gère le no-op ;
- réutilise le type `StatutDetailleAuPourcentage` de `action-statut.schema.ts` plutôt que de redéclarer un tuple ;
- **pleine précision, pas d'arrondi au pas du slider** : `statutDetailleAuPourcentageSchema` n'impose aucune contrainte de pas, et arrondir dégraderait le recalcul du score réel.

Le fichier suit la convention des règles pures du domaine (`can-update-action-statut.rules.ts`), à plat dans `scores/`, sans dépendance NestJS ni base de données.

### Nouvelle feature backend

`apps/backend/src/referentiels/set-score-from-indicateur/`, à la racine du domaine comme les autres features (`update-action-statut/`, `switch-to-te/`…) :

```
set-score-from-indicateur/
├─ set-score-from-indicateur.input.ts
├─ set-score-from-indicateur.service.ts
├─ set-score-from-indicateur.router.ts
├─ set-score-from-indicateur.errors.ts
└─ set-score-from-indicateur.router.e2e-spec.ts
```

Le nom dit le résultat métier — le score de l'action est fixé à partir de l'indicateur — et abandonne le vocabulaire « valeurs utilisées / indicatif », que la feature cesse justement d'être. Les fichiers d'entrée suivent la convention `.input.ts` de l'ADR 0011 (les `.request.ts` sont du legacy).

**`SetScoreFromIndicateurService`** — orchestrateur, déclaré dans `ReferentielsModule`, qui peut y injecter `ScoreIndicatifService` (exporté par `ScoreIndicatifModule`, déjà importé) **et** `UpdateActionStatutService` (déjà déclaré là). Aucune dépendance circulaire : `ScoreIndicatifModule` reste ignorant de l'écriture de statut.

Séquence, via `TransactionManager.executeTransaction`, qui supporte déjà le partage de `tx` :

1. `ScoreIndicatifService.setValeursUtilisees(input, { user, tx })` — existant, accepte déjà `tx` ;
2. `getScoreIndicatif({ collectiviteId, actionIds: [actionId] }, { user, tx })` — relit le score **dans** la transaction, donc sur la valeur qui vient d'être écrite ;
3. `calculateAvancementFromScore(faitScore)` → triplet, ou `null` → no-op ;
4. écriture du statut dans la même transaction ;
5. **après commit** : recalcul du snapshot, renvoyé au client.

**`SetScoreFromIndicateurRouter`** — procédure `setScoreFromIndicateur` (mutation `authedProcedure`). La permission `REFERENTIELS.MUTATE` est vérifiée dans les services appelés, comme le fait déjà `setValeursUtilisees`. Conversion des erreurs typées en erreur tRPC au niveau du routeur (ADR 0012).

`setValeursUtilisees` reste **strictement inchangée** sur `ScoreIndicatifRouter` : CAE/ECI ne traverse aucun code nouveau, et le chemin historique pourra être supprimé à la bascule. Les deux routeurs étant fusionnés par `mergeRouters` sous `referentiels.actions`, la nouvelle procédure s'ajoute sans collision de chemin.

### Modifications de l'existant

**`ScoreIndicatifService.getScoreIndicatif`** — ajout d'un second argument `{ user, tx }: ServiceSecondArg`, propagé à `repository.getFormules` et `repository.listValeursUtiliseesParActionId`, qui acceptent **déjà** un `tx`. À noter : `ServiceSecondArg` rend `user` obligatoire ; l'orchestrateur en dispose.

**`UpdateActionStatutService`** — mise en conformité ADR 0011, à faire à cette occasion :

- extraire l'accès aux données (le `select … for update` puis `insert … onConflictDoUpdate` aujourd'hui inline dans le service) vers un `update-action-statut.repository.ts`, aux côtés du `UpdateActionStatutHistoriqueRepository` existant ;
- le service conserve validations et orchestration, et délègue la persistance ;
- la méthode d'écriture accepte un `tx` externe — aujourd'hui `this.databaseService.db.transaction(...)` ouvre systématiquement sa propre transaction, ce qui interdit toute composition ;
- `upsertActionStatuts` devient « écriture + `computeAndUpsert` », à comportement constant pour `updateStatut` / `updateStatuts` ;
- sortir `upsertActionStatutsRequestSchema`, aujourd'hui déclaré dans le service, vers un `.input.ts`.

Ce refactor touche un service critique servant les deux procédures existantes : il constitue une tranche à part entière, avec `update-action-statut.router.e2e-spec.ts` comme filet.

### Décisions techniques

- **Tout ou rien sur les données persistées.** La valeur retenue et le statut sont écrits dans la même transaction. Si le statut ne peut pas être appliqué, l'enregistrement de la valeur est annulé : mieux vaut une erreur explicite qu'un score silencieusement incohérent que l'utilisateur ne peut pas corriger.

- **Le snapshot est recalculé après le commit, et c'est voulu.** `SnapshotsService.computeAndUpsert` accepte bien un `tx`, mais ne le propage qu'à l'**écriture** du snapshot : le **calcul** (`ScoresService.computeScoreForCollectivite`) n'a pas de paramètre `tx` et lirait hors transaction, donc sans voir les statuts non commités. Le « tout ou rien » porte par conséquent sur les données persistées, le snapshot restant un dérivé recalculé ensuite — exactement la sémantique actuelle de `upsertActionStatuts`, dont la transaction se ferme avant l'appel à `computeAndUpsert`. Propager `tx` jusqu'au calcul de score serait un chantier sans rapport avec cette feature.

- **Une procédure distincte plutôt qu'un branchement interne.** Deux sémantiques différentes, deux procédures : aucun risque de régression sur CAE/ECI, et la suppression du chemin historique à la bascule sera un simple retrait.

- **Filtrage sur `exprScore` + référentiel TE.** La colonne `typeCalculScore` (ajoutée récemment sur `action_definition`) n'est encore lue nulle part et n'entre pas dans la dérivation ; elle reste une piste pour un filtrage plus fin.

- **Pas de backfill rétroactif.** La dérivation ne s'applique qu'aux nouveaux enregistrements de valeur.

### Contrat pour la future UI TE

La procédure renvoie le `ScoreSnapshot` recalculé. L'interface devra l'utiliser pour s'actualiser via `setQueryData` et **ne pas** appeler `computeScoreAndUpdateCurrentSnapshot`, sous peine d'un second recalcul serveur inutile — travers présent dans l'actuel `use-set-valeurs-utilisees.ts` (chemin CAE/ECI, laissé tel quel).

Le statut changeant désormais, cette UI devra également invalider `labellisations.getParcours` et — tant que l'historisation reste en place — `historique.list` et `historique.listUtilisateurs`, comme le fait `useUpdateActionStatut`.

### Question ouverte : l'historisation

Vérifié dans le code, le statut dérivé sera historisé **comme une saisie manuelle** :

- `UpdateActionStatutHistoriqueRepository.save` insère dans `historique.action_statut` avec `modifiedBy = userId`, et la table ne porte **aucune colonne qualifiant l'origine** du changement : dérivé et manuel sont indistinguables ;
- `computeAndMergeParentCascadingStatuts` propage le statut aux **parents**, chacun produisant sa propre entrée : une seule valeur d'indicateur générerait plusieurs lignes d'historique ;
- `exprScore` est porté au niveau **tâche**, or les tâches sont masquées dans l'UI TE au profit de l'affichage par indicateurs : l'historique montrerait des changements sur des éléments que l'utilisateur ne voit pas ;
- effet de bord annexe : la déduplication sur une fenêtre d'une heure (même utilisateur, même action) fusionnerait une entrée dérivée avec une entrée manuelle récente.

Il est probable que ces changements **ne doivent pas** apparaître dans l'historique, ou sous une autre forme (colonne d'origine, attribution système, historisation au niveau de la mesure). La question est **reportée** : le comportement par défaut de `upsertActionStatuts` s'applique d'ici là.

## Implementation Units

**Arrêt pour feedback après la tranche 1.**

- **Tranche 1 (cœur)** : fonction pure `calculateAvancementFromScore` + tests unitaires.
- **Tranche 2 (refactor)** : repository `UpdateActionStatutService` (ADR 0011) et support d'un `tx` externe, à comportement constant.
- **Tranche 3 (feature backend)** : `getScoreIndicatif` avec `ServiceSecondArg`, orchestrateur, procédure `setScoreFromIndicateur`, tests e2e.

## Testing Decisions

Un bon test vérifie le **comportement externe** (entrée → sortie) sans se coupler aux détails d'implémentation.

- **`calculateAvancementFromScore`** (prioritaire, en isolation) : `0.5 → [0.5, 0, 0.5]` ; `1 → [1, 0, 0]` ; `1.3 → [1, 0, 0]` (bridé) ; `0 → [0, 0, 1]` ; score négatif → `[0, 0, 1]` (bridé) ; `null` / `undefined` → `null` ; `NaN` / `Infinity` / `-Infinity` → `null`. Le triplet somme toujours à `1`, en pleine précision.

- **`setScoreFromIndicateur`** (tests e2e en sortie de routeur, approche recommandée par l'ADR 0011) :
  - une action TE avec une valeur calculable : valeur enregistrée **et** statut appliqué, snapshot recalculé et renvoyé ;
  - score non calculable : valeur enregistrée, statut inchangé, aucune erreur ;
  - statut non applicable (audit en cours, action désactivée) : **aucune écriture**, erreur typée — vérifier que la valeur n'a pas été enregistrée ;
  - le score est relu dans la transaction : le statut appliqué correspond bien à la valeur qui vient d'être écrite, pas à la précédente.

- **Non-régression CAE/ECI** : `setValeursUtilisees` inchangée, couverte par les tests existants (`score-indicatif.router.e2e-spec.ts`).

- **Non-régression `upsertActionStatuts`** : la tranche 2 s'appuie sur `update-action-statut.router.e2e-spec.ts`.

## Out of Scope

- **UI TE de sélection de la valeur** — dépendance bloquante : `subaction.indicateur-modal-resultats.tsx` affiche aujourd'hui « sélection non disponible » et le bouton Valider de `subaction.indicateur-modal.tsx` n'est pas câblé. Tant que cette UI n'existe pas, la procédure n'a **aucun appelant** et la fonctionnalité n'est pas observable par l'utilisateur.
- **Traitement de l'historique des statuts dérivés** (cf. question ouverte ci-dessus).
- Retrait de `programme.score` de l'affichage du score indicatif — PR distincte.
- Comportement CAE/ECI, inchangé.
- Suppression de la saisie manuelle du statut — déjà en place.
- Backfill des actions ayant déjà des valeurs mais pas de statut.
- Dérivation au calcul du snapshot (`computeAndUpsert`), au chargement front, ou à la modification d'une valeur d'indicateur ailleurs dans l'application.
- Exploitation de `typeCalculScore` dans la dérivation.
- Propagation de `tx` jusqu'au calcul de score (`computeScoreForCollectivite`).
- Toute évolution de l'algorithme de calcul du score indicatif lui-même (couvert par le PRD `2026-06-04-001`).
- Pré-alimentation automatique des valeurs opendata pour les indicateurs du score (nouveau référentiel TE) : script de migration pour créer les liens `actionScoreIndicateurValeur` manquants et dériver les statuts associés — évolution future, session distincte.

## Further Notes

- `doc/adr/0011-architecture-service-ddd.md` — structure des features, séparation service / repository / rules, conventions `.input.ts`
- `doc/adr/0012-pattern-result.md` — pattern `Result` pour les méthodes de service publiques, conversion en erreur tRPC au niveau du routeur
- PRD amont : `2026-06-04-001-feat-condition-referentiel-expr-cible-seuil-prd.md`
- Dépendances réutilisées : `ScoreIndicatifService.getScoreIndicatif`, `ScoreIndicatifService.setValeursUtilisees`, `UpdateActionStatutService.upsertActionStatuts`, `actionStatutCreateToActionStatutInDatabase`, `canUpdateActionStatutWithoutPermissionCheck`, `TransactionManager.executeTransaction`
