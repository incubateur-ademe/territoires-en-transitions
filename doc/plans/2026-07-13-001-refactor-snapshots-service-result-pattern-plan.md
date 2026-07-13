---
title: "refactor: SnapshotsService vers le pattern Result (ADR 0012)"
type: refactor
status: active
date: 2026-07-13
---

# refactor: SnapshotsService vers le pattern Result (ADR 0012)

## Overview

Migrer `apps/backend/src/referentiels/snapshots/snapshots.service.ts` pour que ses méthodes
publiques retournent `Result<Data, SnapshotsError>` au lieu de lever des exceptions NestJS,
conformément à l'ADR 0012 et aux conventions backend (`apps/backend/CLAUDE.md`).

Le routeur `snapshots.router.ts` dispose déjà de `getResultDataOrThrowError` mais ne l'utilise
pas encore pour les retours du service. Le fichier `snapshots.errors.ts` existe mais ne couvre
que les erreurs du `ReferentielModeGuard`.

## Problem Statement / Motivation

`SnapshotsService` (~805 lignes) est l'un des services référentiels qui n'applique pas encore
l'ADR 0012. Il lève **13 exceptions NestJS** via 5 méthodes publiques. Les appelants internes
(7+ fichiers) s'appuient sur ce comportement throw-based, ce qui complique la composition dans
des transactions et des orchestrations `Result` (ex. `CreatePreSwitchSnapshotsService` avec un
`try/catch` manuel autour de `computeAndUpsert`).

## État des lieux

### Méthodes publiques à migrer

| Méthode | Retour actuel | Exceptions |
|---------|---------------|------------|
| `computeAndUpsert` | `Promise<ScoreSnapshot>` | via `saveSnapshotForScoreResponse` |
| `get` | `Promise<ScoreSnapshot>` | `NotFoundException` |
| `updateName` | `Promise<ScoreSnapshot[]>` | `NotFoundException`, `BadRequestException` |
| `forceRecompute` | `Promise<ScoreSnapshot>` | `NotFoundException` (+ `hasServiceRole` qui throw) |
| `delete` | `Promise<void>` | `NotFoundException`, `ForbiddenException` |

### Méthodes privées qui lèvent encore

| Méthode | Exceptions |
|---------|------------|
| `getDefaultSnapshotMetadata` | 3× `InternalServerErrorException` |
| `saveSnapshotForScoreResponse` | `BadRequestException` (jalon mismatch, ref dupliquée), `InternalServerErrorException` |

### Appelants internes (7 fichiers)

```
create-pre-switch-snapshots.service.ts   → computeAndUpsert (try/catch manuel)
validate-audit.service.ts                → computeAndUpsert (dans transaction)
start-audit.service.ts                   → computeAndUpsert
update-action-statut.service.ts          → get + computeAndUpsert
update-action-commentaire.service.ts     → computeAndUpsert
get-labellisation.service.ts             → get (×2)
load-score-comparison.service.ts         → get + computeAndUpsert
list-actions.service.ts                  → get
onPersonnalisationResponseSaved (interne) → computeAndUpsert
```

## Objectif

Toutes les méthodes **publiques** retournent `Result<Data, SnapshotsError>`. Les exceptions ne
sont levées qu'au niveau routeur via `getResultDataOrThrowError`.

## Phase 0 — Enrichir `snapshots.errors.ts`

Étendre le catalogue d'erreurs spécifiques (en conservant `referentielModeGuardSpecificErrors`) :

```ts
const snapshotSpecificErrors = [
  'SNAPSHOT_NOT_FOUND',
  'SNAPSHOT_NAME_UPDATE_FORBIDDEN',
  'SNAPSHOT_JALON_MISMATCH',
  'SNAPSHOT_REF_ALREADY_EXISTS',
  'SNAPSHOT_DELETION_FORBIDDEN',
  'SNAPSHOT_INVALID_METADATA',
  'SNAPSHOT_SAVE_FAILED',
] as const;
```

| Code erreur | Code tRPC | Message (reprendre les messages actuels) |
|-------------|-----------|------------------------------------------|
| `SNAPSHOT_NOT_FOUND` | `NOT_FOUND` | « Aucun snapshot de score avec la référence … » |
| `SNAPSHOT_NAME_UPDATE_FORBIDDEN` | `BAD_REQUEST` | « Seuls les noms des snapshots de type date_personnalisee… » |
| `SNAPSHOT_JALON_MISMATCH` | `BAD_REQUEST` | « Impossible de mettre à jour… type de jalon est différent » |
| `SNAPSHOT_REF_ALREADY_EXISTS` | `BAD_REQUEST` | « Un snapshot de score avec la référence … existe déjà » |
| `SNAPSHOT_DELETION_FORBIDDEN` | `FORBIDDEN` | « Uniquement les snaphots de type date_personnalisee… » |
| `SNAPSHOT_INVALID_METADATA` | `INTERNAL_SERVER_ERROR` | jalon sans année audit / nom manquant |
| `SNAPSHOT_SAVE_FAILED` | `INTERNAL_SERVER_ERROR` | « Impossible de sauvegarder le snapshot de score » |

Réutiliser les erreurs communes (`UNAUTHORIZED`, `DATABASE_ERROR`, `SERVER_ERROR`) quand c'est
pertinent.

**Référence** : `update-action-statut.errors.ts` pour le pattern config-map.

## Phase 1 — `delete` + routeur

Commencer par la méthode la plus isolée pour valider le flux bout-en-bout.

### 1.1 Migrer `delete`

```ts
async delete(
  collectiviteId: number,
  referentielId: ReferentielId,
  snapshotRef: string,
  { user }: ServiceSecondArg
): Promise<Result<void, SnapshotsError>>
```

- Remplacer chaque `throw` par `return failure(SnapshotsErrorEnum.…)`.
- `hasServiceRole` : utiliser `doNotThrow=true` et retourner `failure('UNAUTHORIZED')` si besoin
  (la logique actuelle est dans le service, pas le routeur).

### 1.2 Adapter `snapshots.router.ts`

```ts
return this.getResultDataOrThrowError(
  await this.snapshots.delete(...)
);
```

### 1.3 Vérifier les tests e2e

`snapshots.router.e2e-spec.ts` ligne ~572 : le message d'erreur doit rester identique via la
config tRPC.

## Phase 2 — Cœur métier : `saveSnapshotForScoreResponse` + `computeAndUpsert`

C'est le changement le plus impactant (9 appelants).

### 2.1 Extraire la logique métier pure (optionnel mais recommandé)

Créer `snapshots.rules.ts` pour `getDefaultSnapshotMetadata` :

```ts
export function getDefaultSnapshotMetadata(
  ...
): Result<{ ref: string; nom: string }, SnapshotsError>
```

- Logique pure, testable sans DB.
- Le service ne fait plus que orchestrer.

### 2.2 Migrer `saveSnapshotForScoreResponse`

```ts
private async saveSnapshotForScoreResponse(
  ...
): Promise<Result<ScoreSnapshot, SnapshotsError>>
```

- Remplacer le `try/catch` sur violation unique par
  `failure(SNAPSHOT_REF_ALREADY_EXISTS, cause)`.
- Propager les erreurs DB inattendues via `failure('DATABASE_ERROR', cause)`.

### 2.3 Migrer `computeAndUpsert`

```ts
async computeAndUpsert(
  input: Omit<z.infer<typeof upsertSnapshotInputSchema>, 'date'> & { date?: string },
  { user, tx }: ServiceSecondArg
): Promise<Result<ScoreSnapshot, SnapshotsError>>
```

- Vérifier si `scoresService.computeScoreForCollectivite` retourne déjà un `Result` ; sinon,
  wrapper les erreurs en `DATABASE_ERROR` / `SERVER_ERROR`.
- Déplacer `user` et `tx` vers `ServiceSecondArg` (dernier paramètre).

### 2.4 Mettre à jour les appelants

| Appelant | Action |
|----------|--------|
| `CreatePreSwitchSnapshotsService` | Supprimer le `try/catch`, vérifier `result.success`, propager `failure` |
| `ValidateAuditService` | Vérifier le `Result` avant de committer la transaction |
| `UpdateActionStatutService` | Propager l'échec snapshot au lieu de `success(snapshot)` aveugle |
| `UpdateActionCommentaireService` | Idem |
| `StartAuditService` | Idem |
| `LoadScoreComparisonService` | Gérer les échecs ou propager |
| `onPersonnalisationResponseSaved` | Logger les échecs, ne pas laisser remonter d'exception |

Pour les services **sans** `Result` (`GetLabellisationService`, `ListActionsService`) : phase
séparée ou helper temporaire `unwrapSnapshotResult(result)` qui throw — à éviter si possible.

## Phase 3 — `get`, `updateName`, `forceRecompute`

### 3.1 `get`

```ts
async get(
  collectiviteId: number,
  referentielId: ReferentielId,
  snapshotRef?: string,
  { user, tx }: ServiceSecondArg = {}
): Promise<Result<ScoreSnapshot, SnapshotsError>>
```

- Le recomputage automatique (`score-courant`) appelle `computeAndUpsert` et propage son
  `Result`.
- `NotFoundException` → `failure(SNAPSHOT_NOT_FOUND)`.

### 3.2 `updateName`

```ts
async updateName(
  collectiviteId: number,
  referentielId: ReferentielId,
  snapshotRef: string,
  newName: string
): Promise<Result<ScoreSnapshot[], SnapshotsError>>
```

### 3.3 `forceRecompute`

```ts
async forceRecompute(
  collectiviteId: number,
  referentielId: ReferentielId,
  snapshotRef: string,
  { user }: ServiceSecondArg
): Promise<Result<ScoreSnapshot, SnapshotsError>>
```

- Remplacer `permissionService.hasServiceRole(user)` par `hasServiceRole(user, true)` +
  `failure('UNAUTHORIZED')`.
- La vérification service role peut rester dans le routeur (comme aujourd'hui) **ou** être
  déplacée dans le service — choisir une seule couche.

### 3.4 Routeur

Toutes les procédures qui appellent le service doivent passer par `getResultDataOrThrowError` :

```ts
computeAndUpsert: ... => this.getResultDataOrThrowError(
  await this.snapshots.computeAndUpsert(input, { user: ctx.user })
),
getCurrent: ... => this.getResultDataOrThrowError(
  await this.snapshots.get(input.collectiviteId, input.referentielId, undefined, { user: ctx.user })
),
// idem updateName, forceRecompute, delete
```

## Phase 4 — Appelants legacy sans `Result`

Services qui consomment `get` / `computeAndUpsert` sans pattern `Result` :

| Service | Stratégie recommandée |
|---------|----------------------|
| `GetLabellisationService` | Vérifier `result.success`, sinon throw ou retourner une valeur par défaut selon le contexte |
| `ListActionsService` | Adapter le `.then()` en gestion explicite du `Result` |
| `LoadScoreComparisonService` | Propager ou mapper vers ses propres erreurs |

**Principe** : les exceptions ne doivent plus sortir de `SnapshotsService` ; chaque appelant
décide comment gérer l'échec à sa frontière.

## Phase 5 — Tests

### Tests à mettre à jour

- `snapshots.router.e2e-spec.ts` — messages d'erreur inchangés côté client
- `export-score-comparison.controller.e2e-spec.ts` — appels directs au service
- Tests e2e labellisation qui déclenchent `computeAndUpsert` indirectement

### Tests à ajouter (optionnel)

- Tests unitaires sur `snapshots.rules.ts` (metadata par jalon)
- Cas d'erreur dans les e2e : ref dupliquée, suppression interdite, snapshot introuvable

## Signatures cibles (récapitulatif)

```ts
// apps/backend/src/referentiels/snapshots/snapshots.service.ts

computeAndUpsert(input, { user, tx }): Promise<Result<ScoreSnapshot, SnapshotsError>>
get(collectiviteId, referentielId, snapshotRef?, { user, tx }?): Promise<Result<ScoreSnapshot, SnapshotsError>>
updateName(...): Promise<Result<ScoreSnapshot[], SnapshotsError>>
forceRecompute(..., { user }): Promise<Result<ScoreSnapshot, SnapshotsError>>
delete(..., { user }): Promise<Result<void, SnapshotsError>>
```

Imports à retirer du service : `BadRequestException`, `ForbiddenException`,
`InternalServerErrorException`, `NotFoundException`.

Imports à ajouter : `failure`, `success`, `Result` depuis `result.type.ts`, `SnapshotsError`
depuis `snapshots.errors.ts`, `ServiceSecondArg`.

## Découpage PR recommandé

| PR | Contenu | Risque |
|----|---------|--------|
| **PR1** | `snapshots.errors.ts` + `snapshots.rules.ts` + `delete` + routeur delete | Faible |
| **PR2** | `saveSnapshotForScoreResponse` + `computeAndUpsert` + routeur + appelants Result-aware | Moyen |
| **PR3** | `get`, `updateName`, `forceRecompute` + routeur + appelants legacy | Moyen-élevé |

## Points d'attention

1. **Transactions** : dans `ValidateAuditService`, un `failure` de `computeAndUpsert` doit faire
   rollback — vérifier que le `Result` est bien vérifié avant le return `success`.
2. **Listener personnalisation** : `onPersonnalisationResponseSaved` ne doit plus laisser des
   exceptions non gérées remonter ; logger et continuer pour les autres référentiels.
3. **Messages utilisateur** : conserver les messages exacts dans `snapshotsErrorConfig` pour ne
   pas casser les e2e existants.
4. **Taille du fichier** : 805 lignes dépasse la recommandation (~300). La migration `Result` peut
   être l'occasion d'extraire `snapshots.rules.ts` et éventuellement un `snapshots.repository.ts`
   pour les requêtes DB — hors scope strict mais utile.
5. **`ListSnapshotsService`** : hors scope (lecture seule, pas d'exceptions métier) ; migration
   `Result` optionnelle ultérieure.

## Critères de done

- [ ] Aucun `throw new *Exception` dans `snapshots.service.ts`
- [ ] Les 5 méthodes publiques retournent `Result<…, SnapshotsError>`
- [ ] `snapshots.errors.ts` couvre toutes les erreurs métier snapshots
- [ ] `snapshots.router.ts` utilise `getResultDataOrThrowError` pour toutes les mutations/queries du service
- [ ] Tous les appelants internes gèrent explicitement les `Result` (plus de `try/catch` autour de `computeAndUpsert`)
- [ ] `pnpm test:backend snapshots` passe
- [ ] Les e2e `snapshots.router.e2e-spec.ts` passent sans changement de message côté client
