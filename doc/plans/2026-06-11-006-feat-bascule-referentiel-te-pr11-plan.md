---
name: PR11 Snapshots refs archivées
overview: "Adapter les lectures de snapshots pour les référentiels `archived` : masquer `score-courant` dans `list` et `listWithScores`, et faire retourner `pre-switch-te` par `getCurrent`, sans modifier la primitive partagée `SnapshotsService.get`."
todos:
  - id: list-filter
    content: Filtrer SnapshotJalonEnum.COURANT pour les refs archived dans list et listWithScores via une méthode privée commune
    status: completed
  - id: getcurrent-service
    content: Ajouter SnapshotsService.getCurrent (politique archived => pre-switch-te) en conservant get inchangé
    status: completed
  - id: router-wiring
    content: Câbler le routeur snapshots.getCurrent vers SnapshotsService.getCurrent
    status: completed
  - id: tests-existing
    content: Étendre les specs existantes list-snapshots et snapshots.router.e2e-spec
    status: completed
  - id: run-tests
    content: Lancer les tests backend ciblés PR11
    status: completed
isProject: false
---

# PR11 — Snapshots sur référentiels archivés

**Parent** : `doc/plans/2026-06-11-001-feat-bascule-referentiel-te-prd.md`

**Branche** : `TE-7303/switch-te-PR11` depuis `main` (PR10 mergée)

**Estimation** : ~300 LOC (code + tests)

---

## Contexte

PR10 a introduit le snapshot `pre-switch-te` et la préparation de la bascule.  
Le PRD précise pour les référentiels `archived` :

- `list` ne doit plus exposer `score-courant`,
- `getCurrent` doit retourner `pre-switch-te`,
- sans recalcul de snapshot courant.

Cette PR reste strictement sur `list` / `listWithScores` / `getCurrent`.  
L’export score-comparaison reste traité en PR23.

---

## Décisions actées

| Sujet | Décision |
| --- | --- |
| Primitive snapshots | `SnapshotsService.get(...)` reste inchangée (méthode partagée par d'autres services) |
| API getCurrent | Nouvelle méthode `SnapshotsService.getCurrent(...)` dédiée à la politique de lecture PR11 |
| Règle getCurrent archived | Si `mode === 'archived'` : lecture de `pre-switch-te`; sinon comportement actuel (`score-courant`) |
| Cas absent | Si `pre-switch-te` est absent : 404 défensif (aucun fallback sur `score-courant`) |
| Filtrage listes | Filtre `SnapshotJalonEnum.COURANT` sur **`list` et `listWithScores`** |
| Implémentation filtre | Méthode privée commune dans `ListSnapshotsService` pour éviter la duplication |
| Test strategy | Étendre les tests existants (`list-snapshots.controller.spec.ts`, `list-snapshots.service.e2e-spec.ts`, `snapshots.router.e2e-spec.ts`) |

---

## Implémentation

### 1) `ListSnapshotsService` — filtrage commun archived

Fichier : `apps/backend/src/referentiels/snapshots/list-snapshots/list-snapshots.service.ts`

- Injecter `CollectiviteReferentielModeService`.
- Ajouter une méthode privée commune, par exemple :
  - `getEffectiveJalons(collectiviteId, referentielId, jalons)`
- Logique :
  - lire le mode via `collectiviteReferentielModeService`,
  - si `referentielId` n'est pas un display id (`cae|eci|te`) : ne rien filtrer,
  - si `mode === 'archived'` : retirer `SnapshotJalonEnum.COURANT`,
  - sinon : laisser `jalons` inchangé.
- Réutiliser cette méthode dans **`list`** et **`listWithScores`**.

### 2) `SnapshotsService` — nouvelle méthode `getCurrent`

Fichier : `apps/backend/src/referentiels/snapshots/snapshots.service.ts`

- Ajouter `getCurrent(collectiviteId, referentielId, context?)` où `context` est un `Partial<ServiceSecondArg>` (`{ user?, isUserTrusted?, tx? }`).
- Logique :
  - si référentiel non display id : déléguer à `get(..., score-courant)` en propageant `user`, `isUserTrusted` et `tx` du contexte,
  - lire le mode référentiel,
  - `archived` => `get(..., pre-switch-te)` (sans recompute) en propageant le même contexte,
  - sinon => `get(..., score-courant)` (comportement actuel, avec recompute si nécessaire) en propageant le même contexte.
- La logique de sélection des scores (display id / mode archived / ref snapshot) reste inchangée ; seul le contexte de service est transmis tel quel à `get`.
- `get(...)` n’est pas modifiée (logique métier inchangée).

### 3) `SnapshotsRouter` — câblage

Fichier : `apps/backend/src/referentiels/snapshots/snapshots.router.ts`

- Route `getCurrent` : appeler `this.snapshots.getCurrent(...)` au lieu de `this.snapshots.get(...)`.

---

## Tests

### A. Extension `list-snapshots.service.e2e-spec.ts`

Ajouter des scénarios de filtrage `archived` :

- quand le mode est `archived`, `list` n’inclut pas `SnapshotJalonEnum.COURANT`,
- quand le mode est `archived`, `listWithScores` n’inclut pas `SnapshotJalonEnum.COURANT`,
- quand le mode n’est pas `archived`, `COURANT` reste présent.

### B. Extension `snapshots.router.e2e-spec.ts`

Ajouter des scénarios `getCurrent` :

- mode `write|readonly` : comportement courant inchangé (retourne `score-courant`),
- mode `archived` avec `pre-switch-te` : `getCurrent` retourne `pre-switch-te`,
- mode `archived` sans `pre-switch-te` : `getCurrent` retourne 404.

### C. Extension `list-snapshots.controller.spec.ts` (si nécessaire)

- Vérifier que l’API REST de listing reflète le même filtrage `archived` que tRPC.

### Commandes tests

- `pnpm test:backend snapshots.router.e2e-spec`
- `pnpm test:backend list-snapshots`

---

## Hors scope PR11

- Export score-comparaison (PR23)
- UI snapshots post-bascule (PR22)
- Complément snapshot archived pendant fusion (PR17/PR18)

---

## Critères de done

- [x] `list` et `listWithScores` excluent `COURANT` pour les refs `archived`
- [x] la logique est factorisée via une méthode privée commune (pas de duplication)
- [x] `SnapshotsService.getCurrent` implémente la politique archived (`pre-switch-te`)
- [x] `SnapshotsService.get` reste inchangée
- [x] routeur `getCurrent` branché sur la nouvelle méthode
- [x] tests existants étendus et verts avec `pnpm test:backend <pattern>`
