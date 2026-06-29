---
title: "feat: Mode référentiel + guard backend (PR4 bascule TE)"
type: feat
status: active
date: 2026-06-25
branch: TE-7303/switch-te-PR4
parent: doc/plans/2026-06-11-001-feat-bascule-referentiel-te-prd.md
---

# feat: Mode référentiel + guard backend — PR4

## Résumé

Introduire la couche backend qui **lit le mode** (`write` / `readonly` / `archived`) depuis `collectivite.preferences.referentiels` et **refuse toute mutation de données référentiel** lorsque le mode n'est pas `write`.

C'est le verrou serveur qui rend effectifs les modes posés par PR1 (schéma) et PR3 (`deriveReferentielPreferences` + batch reset). Sans PR4, une URL directe ou un appel tRPC contourne la lecture seule.

**Dépendances mergées** : PR1 (schéma Zod + migration Sqitch), PR3 (`ResetDisplayPreferencesService`).

**Débloque** : PR5–PR7 (UI), PR8 (`SwitchToTeService`), PR11 (snapshots archivés).

**Hors scope PR4** : UI bandeaux/nav/désactivation contrôles (PR5–PR7), endpoint `switchToTe` (PR8), logique snapshots archivés `list`/`getCurrent` (PR11), paramètre `tx?` sur lecture/écriture des prefs (PR8, voir ci-dessous).

## Problem Statement

Aujourd'hui, les mutations référentiel (`updateStatut`, `updateCommentaire`, pilotes, services, fiches, preuves complémentaires, snapshots…) ne consultent que les permissions (`referentiels.mutate`) et les règles métier existantes (audit en cours, action désactivée…). Le champ `mode` introduit en PR1 n'est **pas enforced côté serveur**.

Les **fils de discussion** sont hors périmètre du guard : ils ne sont pas migrés vers TE (pour éviter de polluer l'interface) et l'historique reste consultable — voire modifiable sur les référentiels CAE/ECI archivés — jusqu'au débranchement complet des anciens référentiels (horizon : plusieurs années).

Risque identifié dans le PRD (annexe D) : édition via URL directe sur un référentiel `readonly` ou `archived`.

## Proposed Solution

### Architecture

```
collectivite.preferences.referentiels
        │
        ▼
CollectiviteReferentielModeService     ← lecture + écriture des prefs référentiels
        │
        ▼
ReferentielModeGuard                  ← assertCanMutate(collectiviteId, referentielId)
        │
        ▼
Services de mutation référentiel      ← appel guard après permissions, avant logique métier
```

Tout le code PR4 vit dans un seul dossier : `apps/backend/src/collectivites/collectivite-referentiel-mode/` (service mode + guard + erreurs + e2e), enregistré dans `CollectivitesCoreModule` pour éviter une dépendance circulaire avec `ReferentielsModule`.

### Règle domaine pure (packages/domain)

```typescript
// packages/domain/src/collectivites/can-mutate-referentiel.rules.ts
export function canMutateReferentielData(mode: ReferentielMode): boolean {
  return mode === 'write';
}
```

Test unitaire colocalisé. Le guard backend délègue à cette règle — pas de duplication de la condition `mode !== 'write'`.

### CollectiviteReferentielModeService

**Emplacement** : `apps/backend/src/collectivites/collectivite-referentiel-mode/collectivite-referentiel-mode.service.ts`

| Méthode | Rôle |
|---|---|
| `getReferentielMode(collectiviteId, referentielId)` | Retourne le `ReferentielMode` pour `cae` / `eci` / `te` |
| `getReferentielPreferences(collectiviteId)` | Wrapper typé autour du repository existant |
| `updateReferentielPreferences(collectiviteId, prefs)` | Écriture via le repository — **sans `tx?` en PR4** (voir décision ci-dessous) |

**Comportements** :
- Préférences absentes → fallback `defaultCollectivitePreferences` dans le service (`result.data ?? defaultCollectivitePreferences`).
- Erreur de parse → propagée via `Result` du repository (`PREFERENCES_PARSE_ERROR`).
- `referentielId === 'te-test'` → **pas de garde** (absent du schéma prefs ; bac à sable interne).
- Retourne `Result<T, CollectiviteReferentielModeError>` où `CollectiviteReferentielModeError` est un alias de `CollectivitePreferencesError` (défini dans `referentiel-mode-guard.errors.ts`).

**Module** : `CollectiviteReferentielModeService` et `ReferentielModeGuard` sont providers + exports de `CollectivitesCoreModule` (pas `ReferentielsCoreModule`).

### Paramètre `tx?` — reporté à PR8

Le plan initial prévoyait `tx?: Transaction` sur `assertCanMutate` et `updateReferentielPreferences`. **Non implémenté en PR4** :

- Aucun appelant du guard n'exécute le contrôle *dans* une transaction : pattern systématique **permissions → guard → `db.transaction(...)`**.
- `CollectivitePreferencesRepository` n'accepte pas encore de `Transaction` ; ajouter `tx?` sur le guard sans propager jusqu'au repository serait une API incomplète.
- Le seul besoin réel est **`updateReferentielPreferences(..., tx)`** pour l'orchestration transactionnelle de `SwitchToTeService` (PR8) ; `switchToTe` bypass le guard de toute façon.
- Pour un contrôle d'autorisation, lire l'état commité avant d'ouvrir la transaction métier est le comportement attendu.

À ajouter en PR8 avec la propagation `tx` dans le repository prefs.

### ReferentielModeGuard

**Emplacement** : `apps/backend/src/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.service.ts`

```typescript
@Injectable()
export class ReferentielModeGuard {
  async assertCanMutate(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<Result<void, ReferentielModeGuardError>>

  async assertCanMutateAction(
    collectiviteId: number,
    actionId: string
  ): Promise<Result<void, ReferentielModeGuardError>>

  // helpers pour les services qui throw encore (ForbiddenException)
  async assertCanMutateOrThrow(collectiviteId, referentielId): Promise<void>
  async assertCanMutateActionOrThrow(collectiviteId, actionId): Promise<void>
}
```

**Erreurs typées** (`referentiel-mode-guard.errors.ts`) :

- `referentielModeGuardSpecificErrors` / `referentielNotWritableTrpcErrorEntry` — fragment partagé
- `REFERENTIEL_NOT_WRITABLE_MESSAGE` dérivé de l'entrée tRPC (source unique)
- code tRPC : `FORBIDDEN`
- message : « Ce référentiel est en lecture seule et ne peut pas être modifié. » (readonly + archived — distinction UI, PR5)

**Pattern d'intégration** — services Result :

```typescript
const modeResult = await this.referentielModeGuard.assertCanMutateAction(
  collectiviteId,
  actionId
);
if (!modeResult.success) {
  return failure(ReferentielModeGuardErrorEnum.REFERENTIEL_NOT_WRITABLE);
}
```

**Pattern d'intégration** — services qui `throw` (`UpdateActionStatutService`, pilotes, services, score indicatif, validate audit, mesure audit statut, snapshots) :

```typescript
await this.referentielModeGuard.assertCanMutateOrThrow(collectiviteId, referentielId);
// ou assertCanMutateActionOrThrow(collectiviteId, actionId)
```

Les `*.errors.ts` concernés importent `referentielNotWritableTrpcErrorEntry` par spread plutôt que de dupliquer le message.

### Exceptions explicites (ne PAS garder)

| Mutation | Raison |
|---|---|
| `setPersonnalisationReponse` | P1 : « CTA personnalisation autorisés » sur TE `readonly` |
| `resetCollectiviteDisplayPreferences` / `resetAll…` | Service role, recalcule les modes |
| `forceRecompute` (snapshots) | Service role uniquement |
| `switchToTe` (PR8) | Orchestration qui *change* les modes |
| `DiscussionApplicationService` | Fils de discussion non migrés vers TE ; historique conservé sur CAE/ECI archivés jusqu'au débranchement complet (horizon : plusieurs années) |
| Import référentiel / endpoints admin | Hors périmètre collectivité |

### Mutations câblées (checklist PR4)

| Service | Fichier | Entrée référentiel | Priorité test e2e |
|---|---|---|---|
| `UpdateActionStatutService` | `update-action-statut.service.ts` | `referentielId` dérivé des actions | **oui** |
| `UpdateActionCommentaireService` | `update-action-commentaire.service.ts` | `getReferentielIdFromActionId(actionId)` | **oui** |
| `HandleMesurePilotesService` | `handle-mesure-pilotes.service.ts` | `assertCanMutateActionOrThrow(mesureId)` | non |
| `HandleMesureServicesService` | `handle-mesure-services.service.ts` | idem | non |
| `FicheActionLinkService` | `fiche-action-link.service.ts` | `assertCanMutateAction(actionId)` — flux action → fiches (`updateLinkedFiches`) | non |
| `UpdateFicheService` | `update-fiche.service.ts` | `assertCanMutateAction` sur l'union anciennes + nouvelles mesures — flux fiche → mesures (`updateFiche({ mesures })`) | non |
| `EditPreuveDocumentService` | `edit-preuve-document.service.ts` | `preuve.actionId` (preuves complémentaires) | non |
| `SnapshotsRouter` | `snapshots.router.ts` | `input.referentielId` (`computeAndUpsert`, `updateName`, `delete` ; pas `forceRecompute`) | non |
| `ScoreIndicatifService.setValeursUtilisees` | `score-indicatif.service.ts` | `assertCanMutateActionOrThrow(input.actionId)` | non |
| `RequestLabellisationService` | `request-labellisation.service.ts` | `input.referentielId` | non |
| `CreatePreuveService` | `create-preuve.service.ts` | `input.referentielId` | non |
| `HandleMesureAuditStatutService` | `handle-mesure-audit-statut.service.ts` | `getReferentielIdFromActionId(mesureId)` | non |
| `StartAuditService` | `start-audit.service.ts` | `audit.referentielId` (via repository) | non |
| `ValidateAuditService` | `validate-audit.service.ts` | `audit.referentielId` | non |

> **Décision actée** : tous les flux portant un `referentielId` ou dérivable depuis `actionId` passent par le guard — y compris labellisation/audit. Un référentiel `archived` ne doit pas accepter de nouvelle demande d'audit ; TE `readonly` non plus. Un audit en cours sur CAE reste possible car le guard est évalué **par référentiel** (CAE encore en `write` pré-bascule). Les permissions audit existantes restent en place *après* le guard.

## Fichiers créés

```
packages/domain/src/collectivites/
  can-mutate-referentiel.rules.ts
  can-mutate-referentiel.rules.spec.ts

apps/backend/src/collectivites/collectivite-referentiel-mode/
  collectivite-referentiel-mode.service.ts
  referentiel-mode-guard.service.ts
  referentiel-mode-guard.errors.ts
  referentiel-mode-guard.router.e2e-spec.ts
```

## Fichiers modifiés

- `packages/domain/src/collectivites/index.ts` — export règle
- `apps/backend/src/collectivites/collectivites-core.module.ts` — provider + export `CollectiviteReferentielModeService` et `ReferentielModeGuard`
- Services listés dans la checklist — injection + appel guard
- `*.errors.ts` concernés — spread de `referentielNotWritableTrpcErrorEntry` :
  - `update-action-commentaire.errors.ts`
  - `fiche-action-link.errors.ts`
  - `update-fiche.errors.ts`
  - `edit-preuve-document.errors.ts`
  - `request-labellisation.errors.ts`
  - `create-labellisation-preuve.errors.ts`
  - `start-audit.errors.ts`

## Stratégie de tests

### Unitaire (domain)

| Cas | Attendu |
|---|---|
| `mode: 'write'` | `canMutateReferentielData` → `true` |
| `mode: 'readonly'` | `false` |
| `mode: 'archived'` | `false` |

### E2E backend (minimal, via mutations existantes)

Fichier : `apps/backend/src/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.router.e2e-spec.ts`

**Setup** : `addTestCollectiviteAndUser` + prefs forcées via `collectivites.preferences.update` (super-admin).

| Scénario | Prefs | Appel | Attendu |
|---|---|---|---|
| TE readonly | `te: { mode: readonly, display: true }` | `updateStatut` sur action `te_*` | `REFERENTIEL_NOT_WRITABLE` / FORBIDDEN |
| CAE write (contrôle positif) | `cae: { mode: write, display: true }` | `updateStatut` sur action `cae_*` | succès |
| CAE archived | `cae: { mode: archived, display: false }` | `updateCommentaire` sur action `cae_*` | `REFERENTIEL_NOT_WRITABLE` |
| Personnalisation TE readonly | `te: readonly` | `setPersonnalisationReponse` sur TE | **succès** (exception P1) |

Pas de test e2e sur les autres services — deux mutations représentatives suffisent pour valider le câblage du guard.

## Ordre d'implémentation (tracer bullet)

1. Règle domaine + tests unitaires
2. `CollectiviteReferentielModeService` + enregistrement `CollectivitesCoreModule`
3. `ReferentielModeGuard` + erreurs typées (+ fragment partagé pour les `*.errors.ts`)
4. Câbler `UpdateActionStatutService` + e2e readonly/write
5. Câbler `UpdateActionCommentaireService` + e2e archived
6. Câbler les autres services (batch mécanique) + `assertCanMutateOrThrow` pour les services legacy
7. E2e exception personnalisation
8. `pnpm test:backend referentiel-mode-guard` + `pnpm nx test domain can-mutate-referentiel`

## Estimation

~500 LOC (code + tests), aligné PRD.

## Critères de done

- [x] `canMutateReferentielData` testée en unitaire
- [x] `CollectiviteReferentielModeService` lit/écrit les prefs référentiels via `Result`
- [x] `ReferentielModeGuard` exposé et injecté dans tous les services de mutation listés
- [x] Personnalisation **non** gardée
- [x] E2e : mutation refusée en `readonly` et `archived` ; autorisée en `write`
- [x] E2e : personnalisation autorisée sur TE `readonly`
- [x] `te-test` non impacté
- [x] Déployable en prod sans feature flag supplémentaire (comportement neutre tant que toutes les CT sont en `write` — état post-migration Sqitch : TE `readonly`, CAE/ECI `write` pour CT engagées → TE non modifiable, comportement attendu)

## Risques

| Risque | Mitigation |
|---|---|
| Oubli d'un endpoint mutation | Checklist exhaustive + grep `REFERENTIELS.MUTATE` |
| Régression CT sans batch reset (TE readonly, CAE write) | Comportement voulu ; le batch PR3 doit être exécuté avant levée flag (checklist ops PRD) |
| Services legacy qui `throw` vs `Result` | `assertCanMutateOrThrow` / `assertCanMutateActionOrThrow` sans refactor global |
| `EditPreuveDocumentService` sans `actionId` direct | Dériver depuis `preuve.actionId` après fetch (preuves complémentaires uniquement) |

## Références code

| Domaine | Fichier |
|---|---|
| Schéma prefs | `packages/domain/src/collectivites/collectivite-preferences.schema.ts` |
| Dérivation modes | `packages/domain/src/collectivites/collectivite-referentiel-preferences.rules.ts` |
| Repository prefs | `apps/backend/src/collectivites/collectivite-preferences/collectivite-preferences.repository.ts` |
| Service mode + guard | `apps/backend/src/collectivites/collectivite-referentiel-mode/` |
| Reset prefs | `apps/backend/src/referentiels/reset-display-preferences/` |
| Pattern Result | `doc/adr/0012-pattern-result.md` |
| Conventions backend | `apps/backend/CLAUDE.md` |
