---
title: "refactor: Isoler les tests e2e backend pour permettre la parallélisation par fichier"
type: refactor
status: active
date: 2026-04-08
---

# refactor: Isoler les tests e2e backend pour permettre la parallélisation par fichier

## Overview

Migrer tous les tests e2e backend qui utilisent des données de seed partagées (`yoloDodoUser`, `collectiviteId: 1`) vers un pattern de collectivités et utilisateurs de test isolés, créés dynamiquement via `addTestCollectiviteAndUsers`. Cela permet l'exécution parallèle des fichiers de test (`fileParallelism: true` déjà activé dans vitest) sans interférence entre fichiers.

**Pas de cleanup** : les collectivités et utilisateurs créés par les tests ne sont pas nettoyés. La base est réinitialisée entre les runs CI. Cela simplifie le code de test et accélère l'exécution.

## Problem Statement / Motivation

Actuellement, ~47 fichiers e2e-spec utilisent des données de seed partagées (principalement `YOLO_DODO` sur `collectiviteId: 1`, mais aussi d'autres collectivités hard-codées comme `collectiviteId: 2`, `3`, etc.). Quand `fileParallelism: true` est activé, ces tests se marchent dessus car ils lisent/écrivent les mêmes lignes en base. Résultat : des échecs non déterministes, impossibles à reproduire localement.

L'ADR 0013 stipule déjà que **chaque test doit être isolé** en créant ses propres données. ~28 fichiers sont déjà migrés. Il reste ~47 fichiers à convertir.

**Retour d'expérience** : une tentative précédente de migration en bloc a échoué. Ce plan découpe le travail en phases incrémentales, chacune vérifiable indépendamment.

## Résultats d'investigation (2026-04-08)

3 exécutions de `npx nx run backend:test` avec `fileParallelism: true` ont produit respectivement 12, 18, et un nombre variable de fichiers en échec — confirmant le non-déterminisme. Voici les causes racines identifiées :

### Cause #1 : YOLO_DODO utilisé comme "utilisateur sans droits" (impact majeur)

**29 fichiers** utilisent `getAuthUser(YOLO_DODO)` et **3 fichiers** utilisent `signInWith(YOLO_DODO)`.

Parmi les 29, **14 sont "partiellement isolés"** : ils créent leur propre collectivité via `addTestCollectiviteAndUser(s)` mais utilisent `YOLO_DODO` pour les tests de refus d'autorisation ("un utilisateur sans droits ne peut pas...").

**Le problème** : quand `update-user-role.router.e2e-spec.ts` active le mode super-admin pour `YOLO_DODO` en parallèle, celui-ci obtient un accès global et toutes les assertions de refus échouent (le test voit `YOLO_DODO` avec des permissions super-admin).

**Fichiers partiellement isolés (14) :**
- `plans/axes/list-axes/list-axes.router.e2e-spec.ts`
- `plans/axes/get-axe/get-axe.router.e2e-spec.ts`
- `plans/axes/delete-axe/delete-axe.router.e2e-spec.ts`
- `plans/axes/upsert-axe/upsert-axe.router.e2e-spec.ts`
- `plans/plans/list-plans/list-plans.router.e2e-spec.ts`
- `plans/plans/get-plan/get-plan.router.e2e-spec.ts`
- `plans/plans/delete-plan/delete-plan.router.e2e-spec.ts`
- `plans/plans/upsert-plan/upsert-plan.router.e2e-spec.ts`
- `plans/fiches/create-fiche/create-fiche.router.e2e-spec.ts`
- `plans/fiches/delete-fiche/delete-fiche.router.e2e-spec.ts`
- `collectivites/personnalisations/set-personnalisation-reponse/set-personnalisation-reponse.router.e2e-spec.ts`
- `referentiels/labellisations/request-labellisation/request-labellisation.router.e2e-spec.ts`
- `referentiels/labellisations/start-audit/start-audit.router.e2e-spec.ts`
- `referentiels/labellisations/list-preuves/list-preuves.router.e2e-spec.ts`

**Fichiers utilisant `signInWith(YOLO_DODO)` (3) :**
- `collectivites/documents/document.controller.e2e-spec.ts`
- `collectivites/documents/update-document/update-document.router.e2e-spec.ts`
- `indicateurs/definitions/list-platform-definitions/list-platform-definitions.controller.e2e-spec.ts`

### Cause #2 : Race condition sur la génération d'emails dans `addTestUser`

`addTestUser` (`users/users/users.test-fixture.ts:48-51`) génère des emails via `count()` sur `auth.users`. Deux fichiers en parallèle lisent le même compteur → même email → violation de contrainte d'unicité ou confusion d'identité utilisateur.

### Cause #3 : Données partagées sur collectiviteId 1/2/3

~15 fichiers hard-codent `collectiviteId: 1` et écrivent des données (scores, fiches, indicateurs, plans) qui interfèrent entre eux.

### Cause #4 : `test_reset()` dans list-users

`list-users.router.e2e-spec.ts` appelle `test_reset()` qui réinitialise la base pendant que d'autres tests tournent.

### Cause #5 : Lifecycle Redis dans version.controller

`version.controller.e2e-spec.ts` ferme la connexion Redis, provoquant 4 "unhandled rejection: Connection is closed" qui impactent potentiellement d'autres tests.

### Cause #6 : Contention de ressources sous charge parallèle

Timeouts (10s) et deadlocks lors de l'exécution parallèle.

### Erreurs observées par catégorie

| Catégorie | Fichiers impactés | Symptôme |
|---|---|---|
| Permissions leak (super-admin YOLO_DODO) | list-axes, delete-plan, list-plans, document.controller, get-axe, upsert-plan, etc. | "promise resolved instead of rejecting", expected 403 got 200/201 |
| Data pollution (collectiviteId 1) | snapshots.router, metrics.router, list-fiches, list-indicateurs, notifications.service | Assertions sur des données polluées par un autre test |
| Naming collision | collectivite-crud.router | "La collectivité Test existe déjà sous l'identifiant 5583" |
| Deadlock / timeout | get-user-roles-and-permissions, import-plan, list-users, compute-score, generate-reports, export-score-comparison | deadlock detected, hook/test timed out in 10000ms |
| Redis lifecycle | version.controller | Unhandled rejection: Connection is closed |

## Proposed Solution

Appliquer le pattern exemplaire à tous les fichiers restants, **sans cleanup** :

1. Dans `beforeAll` : appeler `addTestCollectiviteAndUsers(db, { users: [...], collectivite: {...} })`
2. Remplacer toute `collectiviteId` hard-codée (`1`, `2`, `3`, etc.) par `collectivite.id` dynamique
3. Remplacer `getAuthUser()` par `getAuthUserFromUserCredentials(user)`
4. **Remplacer `getAuthUser(YOLO_DODO)` / `signInWith(YOLO_DODO)` pour les tests de refus** par un `addTestUser(db)` sans collectiviteId (utilisateur isolé sans accès)
5. **Pas de cleanup** — ni cleanup domaine, ni cleanup collectivité/users. Les données restent en base.

## Technical Considerations

### Pattern de migration (simplifié, sans cleanup)

```typescript
beforeAll(async () => {
  const app = await getTestApp();
  const router = await getTestRouter(app);
  const db = await getTestDatabase(app);

  const testResult = await addTestCollectiviteAndUsers(db, {
    collectivite: { /* isCOT: true si nécessaire */ },
    users: [
      { role: CollectiviteRole.ADMIN },
      { role: CollectiviteRole.EDITION },
      // ... selon besoin
    ],
  });

  collectivite = testResult.collectivite;
  adminUser = getAuthUserFromUserCredentials(testResult.users[0]);

  // Utilisateur sans droits pour les tests de refus
  const noAccessResult = await addTestUser(db);
  noAccessUser = getAuthUserFromUserCredentials(noAccessResult.user);

  return async () => {
    if (app) await app.close();
  };
});
```

### Race condition sur la génération d'emails

`addTestUser` (`apps/backend/src/users/users/users.test-fixture.ts:48-51`) génère des emails via `userCount` lu en base avec `count()`. Deux fichiers en parallèle peuvent lire le même compteur et générer le même email, causant une violation de contrainte d'unicité.

**Correction** : Remplacer le compteur par la première partie du `userId` (déjà un UUID généré ligne 47). Le `userId` est unique par construction, donc `userId.split('-')[0]` l'est aussi.

```typescript
// Avant (racy) :
const resp = await db.select({ userCount: count() }).from(authUsersTable);
const userCount = resp?.[0].userCount;
assert(userCount > 0, 'User count is valid');
const email = `${prenom}_${userCount}@${nom}.fr`.toLowerCase();

// Après (safe) :
const email = `${prenom}_${userId.split('-')[0]}@${nom}.fr`.toLowerCase();
```

### Tests mutant des tables globales (non scopées par collectivité)

3 fichiers modifient des tables de définitions globales (`referentiel_definition`, `indicateur_definition`, `question`) :
- `import-referentiel.controller.e2e-spec.ts`
- `import-indicateur-definition.controller.e2e-spec.ts`
- `import-personnalisation-question.controller.e2e-spec.ts`

**Ces fichiers sont déjà quarantinés en exécution série** — aucune action supplémentaire requise.

### Tests dépendants de données de seed réelles (siren)

Certains tests nécessitent des données INSEE réelles (population, géographie) liées à de vrais sirens :
- `trajectoire-leviers.router.e2e-spec.ts`
- `trajectoire-leviers.controller.e2e-spec.ts`
- `snapshots.router.e2e-spec.ts` / `list-snapshots.service.e2e-spec.ts`

**Stratégie** : garder la collectivité seed mais migrer l'utilisateur (créer un utilisateur de test avec le rôle approprié sur la collectivité réelle).

### `test_reset()` incompatible avec la parallélisation

`list-users.router.e2e-spec.ts` appelle `test_reset()` qui réinitialise la base. **Doit être retiré** et le test réécrit.

### Redis connection lifecycle dans version.controller

`version.controller.e2e-spec.ts` provoque des "Connection is closed" sur Redis. Probablement un `app.close()` qui ferme la connexion Redis partagée. **Investiguer** si le NestApp partage le même pool Redis entre fichiers ou si c'est un problème de timing.

## Acceptance Criteria

### Phase 0 — Prérequis critiques (2 fichiers)

Corriger les problèmes transverses qui causent des échecs indépendamment de l'isolation.

- [x] Corriger la race condition email dans `addTestUser` (`apps/backend/src/users/users/users.test-fixture.ts:48-51`) — utiliser `userId.split('-')[0]` au lieu du compteur `userCount`
- [x] Investiguer et fixer le problème Redis dans `version.controller.e2e-spec.ts`
- [ ] Retirer les cleanup existants dans les tests déjà migrés (supprimer les fonctions de retour de `beforeAll` qui font du cleanup, ne garder que `app.close()`)

**Validation** : lancer les tests 2 fois avec `fileParallelism: true`, vérifier qu'il n'y a plus de collision d'email ni d'erreur Redis.

---

### Phase 1 — Éliminer YOLO_DODO dans les fichiers déjà isolés (17 fichiers)

Ces fichiers ont déjà leur propre collectivité. Il suffit de remplacer `getAuthUser(YOLO_DODO)` / `signInWith(YOLO_DODO)` par un `addTestUser(db)` sans collectiviteId.

**Batch 1a — Domaine `plans/` (10 fichiers) :**
- [x] `plans/axes/list-axes/list-axes.router.e2e-spec.ts`
- [x] `plans/axes/get-axe/get-axe.router.e2e-spec.ts`
- [x] `plans/axes/delete-axe/delete-axe.router.e2e-spec.ts`
- [x] `plans/axes/upsert-axe/upsert-axe.router.e2e-spec.ts`
- [x] `plans/plans/list-plans/list-plans.router.e2e-spec.ts`
- [x] `plans/plans/get-plan/get-plan.router.e2e-spec.ts`
- [x] `plans/plans/delete-plan/delete-plan.router.e2e-spec.ts`
- [x] `plans/plans/upsert-plan/upsert-plan.router.e2e-spec.ts`
- [x] `plans/fiches/create-fiche/create-fiche.router.e2e-spec.ts`
- [x] `plans/fiches/delete-fiche/delete-fiche.router.e2e-spec.ts`

**Validation batch 1a** : lancer les tests du domaine `plans/` 2 fois, vérifier 0 échec.

**Batch 1b — Domaines `collectivites/`, `referentiels/`, `indicateurs/` (7 fichiers) :**
- [x] `collectivites/personnalisations/set-personnalisation-reponse/set-personnalisation-reponse.router.e2e-spec.ts`
- [x] `referentiels/labellisations/request-labellisation/request-labellisation.router.e2e-spec.ts`
- [x] `referentiels/labellisations/start-audit/start-audit.router.e2e-spec.ts`
- [x] `referentiels/labellisations/list-preuves/list-preuves.router.e2e-spec.ts`
- [x] `collectivites/documents/document.controller.e2e-spec.ts`
- [x] `collectivites/documents/update-document/update-document.router.e2e-spec.ts`
- [x] `indicateurs/definitions/list-platform-definitions/list-platform-definitions.controller.e2e-spec.ts`

**Validation batch 1b** : lancer les tests de ces 3 domaines 2 fois, vérifier 0 échec.

---

### Phase 2 — Migration domaine `collectivites/` (8 fichiers)

Remplacer `getAuthUser()` + `collectiviteId` hard-codée par `addTestCollectiviteAndUsers`. Pas de cleanup.

- [x] `collectivites/personnes.router.e2e-spec.ts`
- [x] `collectivites/recherches/recherches.router.e2e-spec.ts` — adapter les assertions si elles comptent le nombre total de résultats
- [x] `collectivites/tableau-de-bord/tableau-de-bord-collectivite.router.e2e-spec.ts`
- [x] `collectivites/handle-instance-gouvernance/handle-instance-gouvernance.router.e2e-spec.ts`
- [x] `collectivites/handle-categories/list-categories.router.e2e-spec.ts`
- [x] `collectivites/collectivite-crud/collectivite-crud.router.e2e-spec.ts`
- [x] `collectivites/membres/mutate-invitations/invitation.router.e2e-spec.ts`
- [x] `collectivites/tags/personnes/personne-tag.router.e2e-spec.ts`

**Validation** : lancer les tests `collectivites/` 2 fois avec `fileParallelism: true`, vérifier 0 échec.

---

### Phase 3 — Migration domaine `indicateurs/` (8 fichiers)

- [x] `indicateurs/valeurs/crud-valeurs.router.e2e-spec.ts` — collectivité dynamique pour CRUD, seed pour computed
- [x] `indicateurs/valeurs/crud-valeurs.controller.e2e-spec.ts` — auth isolée, seed collectivités pour computed
- [x] `indicateurs/indicateurs/list-indicateurs/list-indicateurs.router.e2e-spec.ts` — auth isolée, seed collectivités 1+2
- [x] `indicateurs/definitions/mutate-definition/create-definition.router.e2e-spec.ts` — collectivité dynamique
- [x] `indicateurs/definitions/mutate-definition/update-definition.router.e2e-spec.ts` — collectivité dynamique
- [x] `indicateurs/definitions/mutate-definition/delete-definition.router.e2e-spec.ts` — collectivité dynamique
- [x] `indicateurs/indicateurs/export-indicateurs/export-indicateurs.controller.e2e-spec.ts` — auth isolée
- [x] `indicateurs/trajectoire-leviers/trajectoire-leviers.router.e2e-spec.ts` — auth isolée, seed collectivités

**Validation** : lancer les tests `indicateurs/` 2 fois, vérifier 0 échec.

---

### Phase 4 — Migration domaine `plans/` — fichiers entièrement partagés (9 fichiers)

- [x] `plans/fiches/plan-actions.service.e2e-spec.ts` — auth isolée
- [x] `plans/fiches/count-by/count-by.router.e2e-spec.ts` — auth isolée
- [x] `plans/fiches/fiche-action-etape/fiche-action-etape.router.e2e-spec.ts` — auth isolée
- [x] `plans/fiches/fiche-action-budget/fiche-action-budget.router.e2e-spec.ts` — auth isolée
- [x] `plans/fiches/bulk-edit/bulk-edit.router.e2e-spec.ts` — auth isolée
- [x] `plans/fiches/share-fiches/share-fiche.service.e2e-spec.ts` — auth isolée, 2 utilisateurs
- [x] `plans/fiches/export/export-plan.controller.e2e-spec.ts` — auth isolée
- [x] `plans/plans/import-plan-aggregate/import-plan.router.e2e-spec.ts` — auth isolée
- [x] `plans/plans/get-plan-completion/get-plan-completion.router.e2e-spec.ts` — auth isolée
- [x] `plans/plans/reports/generate-plan-report-pptx/generate-reports.router.e2e-spec.ts` — auth isolée

**Validation** : lancer les tests `plans/` 2 fois, vérifier 0 échec.

---

### Phase 5 — Migration domaine `referentiels/` (7 fichiers)

- [x] `referentiels/score-indicatif/score-indicatif.router.e2e-spec.ts` — auth isolée
- [x] `referentiels/handle-mesure-services/handle-mesure-services.router.e2e-spec.ts` — auth isolée
- [x] `referentiels/handle-mesure-pilotes/handle-mesure-pilotes.router.e2e-spec.ts` — auth isolée
- [x] `referentiels/list-actions/list-actions.router.e2e-spec.ts` — auth isolée
- [x] `referentiels/labellisations/validate-audit/validate-audit.router.e2e-spec.ts` — auth isolée
- [x] `referentiels/labellisations/handle-mesure-audit-statut/handle-mesure-audit-statut.router.e2e-spec.ts` — auth isolée
- [x] `referentiels/labellisations/handle-mesure-audit-statut/list-mesure-audit-statuts.router.e2e-spec.ts` — auth isolée
- [x] `referentiels/snapshots/snapshots.router.e2e-spec.ts` — auth isolée, lecture sur Rhône Agglo
- [x] `referentiels/snapshots/list-snapshots/list-snapshots.service.e2e-spec.ts` — auth isolée

**Validation** : lancer les tests `referentiels/` 2 fois, vérifier 0 échec.

---

### Phase 6 — Migration domaines `users/`, `utils/`, `metrics/` (13 fichiers)

**Domaine `users/` :**
- [ ] `users/users/update-user/update-user.router.e2e-spec.ts`
- [ ] `users/users/list-users/list-users.router.e2e-spec.ts` — **retirer `test_reset()`**, réécrire assertions pour ne pas dépendre du dataset complet
- [ ] `users/authorizations/update-user-role/update-user-role.router.e2e-spec.ts`
- [ ] `users/authorizations/permission.service.e2e-spec.ts` — teste plusieurs rôles, créer users avec différents niveaux d'accès
- [ ] `users/apikeys/apikeys.controller.e2e-spec.ts`
- [ ] `users/apikeys/apikeys.router.e2e-spec.ts`

**Domaine `utils/` :**
- [ ] `utils/trpc/trpc.router.e2e-spec.ts`
- [ ] `utils/notifications/notifications.router.e2e-spec.ts`
- [ ] `utils/notifications/notifications.service.e2e-spec.ts`
- [ ] `utils/email/email.service.e2e-spec.ts`
- [ ] `utils/version/version.controller.e2e-spec.ts`

**Domaine `metrics/` :**
- [ ] `metrics/metrics.router.spec.ts`

**Domaine `trajectoires/` :**
- [ ] `indicateurs/trajectoire-leviers/trajectoire-leviers.controller.e2e-spec.ts` — garder collectivité seed, migrer uniquement l'utilisateur

**Validation** : lancer les tests de ces domaines 2 fois, vérifier 0 échec.

---

### Phase 7 — Vérification finale et CI

- [ ] Tous les tests passent avec `fileParallelism: true`
- [ ] Exécuter 3 fois la suite complète pour vérifier l'absence de flakiness
- [ ] Aucun fichier de test ne référence `YOLO_DODO` ou une `collectiviteId` hard-codée (sauf fichiers seed documentés)
- [ ] Ajouter un lint/grep CI pour détecter l'usage de `collectiviteId` hard-codées dans les nouveaux tests

## Success Metrics

- 0 test flaky dû à des conflits de données entre fichiers
- Temps d'exécution CI réduit grâce à la parallélisation effective
- Tous les e2e-spec passent de manière déterministe sur 3 exécutions consécutives

## Dependencies & Risks

| Risque | Impact | Mitigation |
|---|---|---|
| Race condition emails `addTestUser` | Tests échouent aléatoirement | Corriger en Phase 0 avec `userId.split('-')[0]` |
| YOLO_DODO super-admin leak | Tests de refus d'autorisation passent à tort | Phase 1 : remplacer par `addTestUser(db)` sans collectiviteId |
| Tests Tier 3 non migrables | Restent vulnérables aux conflits | Garder collectivité seed, migrer uniquement l'utilisateur |
| `test_reset()` détruit les données | Tous les tests parallèles échouent | Retirer en Phase 6 |
| Assertions hardcodées sur des comptages | Tests cassés après migration | Adapter assertions pour filtrer par collectivité |
| Redis connection lifecycle | Unhandled rejections sur d'autres tests | Investiguer le partage de connexion Redis |
| Accumulation de données en base (pas de cleanup) | Ralentissement potentiel sur de très longues sessions | Négligeable : la base est réinitialisée entre les runs CI |

## Sources & References

- ADR 0013 (test isolation) : `doc/adr/0013-tests-e2e.md`
- Fixture collectivité : `apps/backend/src/collectivites/collectivites/collectivites.test-fixture.ts`
- Fixture users : `apps/backend/src/users/users/users.test-fixture.ts`
- Données seed : `data_layer/seed/fakes/11-insert_fake_user.sql`
- Config vitest : `apps/backend/vitest.config.mts`
