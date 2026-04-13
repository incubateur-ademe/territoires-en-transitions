---
title: "Isoler les tests e2e backend pour la parallélisation"
category: test-failures
date: 2026-04-13
tags: [vitest, parallel, e2e, isolation, YOLO_DODO, addTestUser, flaky-tests]
module: apps/backend
severity: high
---

# Isoler les tests e2e backend pour la parallélisation

## Problème

Avec `fileParallelism: true` dans vitest, 12 à 18 fichiers de tests e2e échouaient de manière non-déterministe. Les symptômes incluaient :
- `expected 403 got 200` (tests de refus d'autorisation qui passent à tort)
- `"La collectivité Test existe déjà"` (collision de noms)
- Deadlocks et timeouts (10s)
- `"Connection is closed"` (Redis lifecycle)

## Cause racine

**5 causes identifiées, par ordre d'impact :**

1. **YOLO_DODO partagé comme utilisateur de test** : `update-user-role.router.e2e-spec.ts` activait le mode super-admin pour YOLO_DODO. En parallèle, tous les tests utilisant YOLO_DODO pour des assertions de refus d'accès échouaient car YOLO_DODO avait soudainement un accès global.

2. **Race condition sur la génération d'emails** : `addTestUser` utilisait `count()` sur `auth.users` pour générer des emails uniques. Deux fichiers parallèles lisaient le même compteur → même email → violation de contrainte d'unicité.

3. **Données partagées sur collectiviteId 1/2/3** : ~15 fichiers écrivaient sur les mêmes collectivités seed (scores, fiches, indicateurs, plans).

4. **`test_reset()` dans list-users** : Réinitialisait la base entière pendant que d'autres tests tournaient.

5. **Tests d'import global en parallèle** : `import-referentiel` supprimait et recréait temporairement les `referentiel_definition`, causant "Referentiel not found" dans tout test accédant aux référentiels au même moment.

## Solution

### Pattern de migration (sans cleanup)

```typescript
beforeAll(async () => {
  const app = await getTestApp();
  router = await getTestRouter(app);
  const db = await getTestDatabase(app);

  // Utilisateur isolé au lieu de getAuthUser(YOLO_DODO)
  const testUserResult = await addTestUser(db, {
    collectiviteId: collectivite.id,
    role: CollectiviteRole.ADMIN,
  });
  testUser = getAuthUserFromUserCredentials(testUserResult.user);

  // Utilisateur sans droits pour les tests de refus
  const noAccessResult = await addTestUser(db);
  noAccessUser = getAuthUserFromUserCredentials(noAccessResult.user);
});
```

### Pour les tests nécessitant une collectivité isolée

```typescript
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';

const testResult = await addTestCollectiviteAndUser(db, {
  user: { role: CollectiviteRole.ADMIN },
});
collectivite = testResult.collectivite;
testUser = getAuthUserFromUserCredentials(testResult.user);
```

### Pour les tests REST (supertest) nécessitant un JWT

```typescript
const testUserResult = await addTestUser(db);
authToken = await getAuthToken({
  email: testUserResult.user.email!,
  password: testUserResult.user.password, // 'yolododo' pour tous les test users
});
```

### Fix de la race condition email

```typescript
// Avant (racy) :
const resp = await db.select({ userCount: count() }).from(authUsersTable);
const email = `${prenom}_${resp[0].userCount}@${nom}.fr`;

// Après (safe) :
const email = `${prenom}_${userId.split('-')[0]}@${nom}.fr`;
```

### Exclusion des tests d'import global

```typescript
// vitest.config.mts
exclude: [
  'src/referentiels/import-referentiel/**',
  'src/indicateurs/definitions/import-indicateur-definition/**',
  'src/collectivites/personnalisations/import-personnalisation-question/**',
],
```

### Fixture idempotente

```typescript
// Avant (crash si données existent déjà) :
const result = await db.insert(table).values([...]).onConflictDoNothing().returning();
result[0].id; // undefined si conflit !

// Après (supprimer avant insérer) :
await db.delete(table).where(and(eq(...), eq(...)));
const result = await db.insert(table).values([...]).returning();
```

## Résultat

| Métrique | Avant | Après |
|---|---|---|
| Tests échoués (parallèle) | 12-18 (non-déterministe) | 3 (timing uniquement) |
| Tests passés | ~1050 | 1055 |
| Cause des échecs restants | Super-admin leak + data | Timing/infra uniquement |

## Stratégie de prévention

1. **Ne jamais utiliser `getAuthUser(YOLO_DODO)` dans les nouveaux tests** — toujours `addTestUser` + `getAuthUserFromUserCredentials`
2. **Ne jamais hardcoder un collectiviteId** — créer une collectivité via `addTestCollectiviteAndUser` ou `addTestCollectivite`
3. **Pas de cleanup** — la base est réinitialisée entre les runs CI, le cleanup ralentit les tests
4. **Nommer les variables `testUser`** (pas `yoloDodoUser`) pour éviter la confusion
5. **Les tests d'import global doivent rester exclus** du run parallèle (ils modifient des tables globales)

## Références

- Plan : `doc/plans/2026-04-08-001-refactor-e2e-tests-parallel-isolation-plan.md`
- ADR : `doc/adr/0013-tests-e2e.md`
- Fixture collectivité : `apps/backend/src/collectivites/collectivites/collectivites.test-fixture.ts`
- Fixture users : `apps/backend/src/users/users/users.test-fixture.ts`
- Config vitest : `apps/backend/vitest.config.mts`
