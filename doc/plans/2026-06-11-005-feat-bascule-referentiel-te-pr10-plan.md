---

name: PR10 Snapshots pre-bascule
overview: "Implémenter la création des snapshots `pre-switch-te` pour les référentiels CAE/ECI en `mode: write`, via un service dédié testé en e2e, extension minimale de SnapshotsService, et câblage NestJS — sans brancher dans switchToTe() (PR18)."
todos:

- id: snapshots-metadata
content: Étendre SnapshotsService (constantes PRE_SWITCH_TE + case getDefaultSnapshotMetadata)
status: pending
- id: create-service
content: Créer CreatePreSwitchSnapshotsService (sélection refs write, computeAndUpsert séquentiel, Result ADR 0012)
status: pending
- id: errors
content: Ajouter PRE_SWITCH_SNAPSHOT_FAILED dans switch-to-te.errors.ts
status: pending
- id: module-wiring
content: Enregistrer CreatePreSwitchSnapshotsService dans ReferentielsModule (SwitchToTeService inchangé)
status: pending
- id: e2e
content: Tests e2e create-pre-switch-snapshots.service.e2e-spec.ts (1 ref, 2 refs, eci hors write, idempotence)
status: pending
- id: prd-reconcile
content: Mettre à jour le PRD (section Snapshots + lignes PR10/PR17/PR18)
status: pending
isProject: false

---



# PR10 — Snapshots pré-bascule

**Parent** : [doc/plans/2026-06-11-001-feat-bascule-referentiel-te-prd.md](doc/plans/2026-06-11-001-feat-bascule-referentiel-te-prd.md)

**Branche** : `TE-7303/switch-te-PR10` depuis `main` (PR8 + PR9 mergés)

**Estimation** : ~400 LOC (code + tests e2e) — endpoint `referentiels.switchToTe` toujours **non exposé prod** (`SWITCH_NOT_IMPLEMENTED` conservé jusqu'à PR18)

---



## Contexte

PR2 a ajouté les jalons `pre_switch_te` / `post_switch_te` dans `[SnapshotJalonEnum](packages/domain/src/referentiels/scores/snapshot-jalon.enum.ts)`. `[SnapshotsService](apps/backend/src/referentiels/snapshots/snapshots.service.ts)` sait déjà calculer et persister un snapshot via `computeAndUpsert({ collectiviteId, referentielId, jalon, user, tx })` — y compris `personnalisationReponses` — mais `getDefaultSnapshotMetadata` ne gère pas encore `PRE_SWITCH_TE` (throw pour jalon inconnu).

PR8–PR9 ont posé `[SwitchToTeService](apps/backend/src/referentiels/switch-to-te/switch-to-te.service.ts)` avec tous les guards, puis `SWITCH_NOT_IMPLEMENTED`. PR10 implémente **l'étape 1** du flux transactionnel (cf. [Flux de bascule](doc/plans/2026-06-11-001-feat-bascule-referentiel-te-prd.md#flux-de-bascule)) comme **unité isolée** : non appelée par `switchToTe()` avant PR18.

```mermaid
sequenceDiagram
  participant PR18 as SwitchToTeService (PR18)
  participant Create as CreatePreSwitchSnapshotsService
  participant Snap as SnapshotsService
  participant Scores as ScoresService

  Note over PR18: PR10 — hors switchToTe
  Create->>Create: sélectionner refs cae/eci mode write
  loop par ref source (cae puis eci)
    Create->>Snap: computeAndUpsert(jalon PRE_SWITCH_TE, tx)
    Snap->>Scores: computeScoreForCollectivite
    Snap-->>Create: ScoreSnapshot figé
  end
  Create-->>PR18: Result ScoreSnapshot[]

  Note over PR18: PR18 câble dans executeSingle(tx)
```



---



## Décisions actées


| Sujet                   | Décision                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Câblage PR10            | **Unité isolée** : `CreatePreSwitchSnapshotsService` testé via `app.get(...)`. `switchToTe()` **inchangé** (toujours `SWITCH_NOT_IMPLEMENTED`). PR18 injecte et appelle dans `transactionManager.executeSingle`.                                                                                                                                                                |
| Emplacement             | Service dédié `[create-pre-switch-snapshots.service.ts](apps/backend/src/referentiels/switch-to-te/create-pre-switch-snapshots.service.ts)` dans le feature folder `switch-to-te/`.                                                                                                                                                                                             |
| Référentiels snapshotés | **Uniquement** `cae` / `eci` avec `prefs[ref].mode === 'write'`. Ordre déterministe : `cae` puis `eci`. Cas « ref `archived` dont des actions participent à la fusion » → **reporté PR17/PR18** (détection au moment de la migration, quand la logique de fusion existe).                                                                                                       |
| Mécanisme snapshot      | Extension minimale de `SnapshotsService` : constantes `PRE_SWITCH_TE_SNAPSHOT_REF = 'pre-switch-te'`, `PRE_SWITCH_TE_SNAPSHOT_NOM = 'État pré-bascule Climat Ressources'` + `case SnapshotJalonEnum.PRE_SWITCH_TE` dans `getDefaultSnapshotMetadata`. Appel `computeAndUpsert({ jalon: PRE_SWITCH_TE })` **sans** `nom` ni `ref` (évite le guard `snapshotNom` L1068–1076 de `ScoresService`). |
| Signature               | `createPreSwitchSnapshots(collectiviteId, prefs, { user, tx })` → `Promise<Result<ScoreSnapshot[], SwitchToTeError>>`. Prefs passées par l'appelant (PR18 les a déjà chargées ; évite re-fetch ; facilite les tests).                                                                                                                                                           |
| Erreurs                 | `try/catch` autour de chaque `computeAndUpsert` → `failure(PRE_SWITCH_SNAPSHOT_FAILED, cause)`. Code `INTERNAL_SERVER_ERROR` dans `[switch-to-te.errors.ts](apps/backend/src/referentiels/switch-to-te/switch-to-te.errors.ts)`.                                                                                                                                                |
| Permissions             | **Pas de re-check** dans le service dédié : `REFERENTIELS.MUTATE` déjà vérifié par `switchToTe` (PR8). `user` sert à `createdBy` / `modifiedBy` du snapshot.                                                                                                                                                                                                                    |
| Concurrence             | Écritures **séquentielles** (`for await`) — une transaction = une connexion ; pas de `Promise.all` sur le même `tx`.                                                                                                                                                                                                                                                            |
| Module NestJS           | Provider dans `[ReferentielsModule](apps/backend/src/referentiels/referentiels.module.ts)` uniquement. **Ne pas** injecter dans `SwitchToTeService` en PR10 (YAGNI).                                                                                                                                                                                                            |
| Tests                   | e2e niveau service (`app.get(CreatePreSwitchSnapshotsService)`), collectivité seedée `1` (données CAE réelles) + prefs fabriquées à la main.                                                                                                                                                                                                                                    |
| Hors scope PR10         | Snapshot `post-switch-te` (PR18), `list` / `getCurrent` sur refs archivées (PR11), UI snapshots (PR22), suppression utilisateur (déjà bloquée : `USER_DELETION_ALLOWED_SNAPSHOT_TYPES` n'inclut pas `pre_switch_te`).                                                                                                                                                           |

> **Évolution possible à PR18** : le service dédié se justifie surtout par la livraison isolée de PR10 (testable avant câblage). Sa logique reste mince (filtre `write` + boucle `computeAndUpsert`). Au moment de PR18, si l'isolation n'apporte plus de valeur, envisager de passer `CreatePreSwitchSnapshotsService` en méthode privée de `SwitchToTeService` (étape 1 de la transaction).

---

## Implémentation

### 1. Extension `SnapshotsService`

Fichier : `[snapshots.service.ts](apps/backend/src/referentiels/snapshots/snapshots.service.ts)`

```typescript
static readonly PRE_SWITCH_TE_SNAPSHOT_REF = 'pre-switch-te';
static readonly PRE_SWITCH_TE_SNAPSHOT_NOM = 'État pré-bascule Climat Ressources';
```

Dans `getDefaultSnapshotMetadata`, ajouter :

```typescript
case SnapshotJalonEnum.PRE_SWITCH_TE:
  ref = SnapshotsService.PRE_SWITCH_TE_SNAPSHOT_REF;
  nom = SnapshotsService.PRE_SWITCH_TE_SNAPSHOT_NOM;
  break;
```

> **Note** : ajouter aussi `POST_SWITCH_TE` (constantes + case) en PR10 si souhaité pour préparer PR18 sans coût ; sinon report strict PR18.

Comportement attendu de `computeAndUpsert` avec `jalon: PRE_SWITCH_TE` :

- Score courant du référentiel source (personnalisation au moment T).
- `personnalisationReponses` capturées automatiquement.
- Chemin `snapshotForceUpdate` + `upsertScoreSnapshot` → **idempotent** (2e appel = update, pas de doublon sur `(collectivite_id, referentiel_id, ref)`).



### 2. `CreatePreSwitchSnapshotsService`

Fichier : `apps/backend/src/referentiels/switch-to-te/create-pre-switch-snapshots.service.ts`

```typescript
@Injectable()
export class CreatePreSwitchSnapshotsService {
  private static readonly SOURCE_REFERENTIELS = [
    ReferentielIdEnum.CAE,
    ReferentielIdEnum.ECI,
  ] as const;

  constructor(private readonly snapshotsService: SnapshotsService) {}

  async createPreSwitchSnapshots(
    collectiviteId: number,
    prefs: CollectiviteReferentielPreferences,
    { user, tx }: ServiceSecondArg & { tx?: Transaction }
  ): Promise<Result<ScoreSnapshot[], SwitchToTeError>> {
    const referentielsToSnapshot =
      CreatePreSwitchSnapshotsService.SOURCE_REFERENTIELS.filter(
        (referentiel) => prefs[referentiel].mode === 'write'
      );

    const snapshots: ScoreSnapshot[] = [];

    try {
      for (const referentielId of referentielsToSnapshot) {
        const snapshot = await this.snapshotsService.computeAndUpsert({
          collectiviteId,
          referentielId,
          jalon: SnapshotJalonEnum.PRE_SWITCH_TE,
          user,
          tx,
        });
        snapshots.push(snapshot);
      }
    } catch (error) {
      return failure(
        SwitchToTeErrorEnum.PRE_SWITCH_SNAPSHOT_FAILED,
        error instanceof Error ? error : undefined
      );
    }

    return success(snapshots);
  }
}
```



### 3. Erreur — `[switch-to-te.errors.ts](apps/backend/src/referentiels/switch-to-te/switch-to-te.errors.ts)`

Ajouter à `specificErrors` + `switchToTeTrpcErrorEntries` :


| Code                         | tRPC                    | Message (indicatif)                         |
| ---------------------------- | ----------------------- | ------------------------------------------- |
| `PRE_SWITCH_SNAPSHOT_FAILED` | `INTERNAL_SERVER_ERROR` | Impossible de créer le snapshot pré-bascule |




### 4. Câblage module

`[referentiels.module.ts](apps/backend/src/referentiels/referentiels.module.ts)` : ajouter `CreatePreSwitchSnapshotsService` aux `providers`.

**Ne pas modifier** `[switch-to-te.service.ts](apps/backend/src/referentiels/switch-to-te/switch-to-te.service.ts)` en PR10.

---



## Tests

Fichier : `apps/backend/src/referentiels/switch-to-te/create-pre-switch-snapshots.service.e2e-spec.ts`

Setup : `getTestApp()` + `app.get(CreatePreSwitchSnapshotsService)` + user admin via `addTestCollectiviteAndUser` ou user seedé avec droits sur collectivité `1`.

Helper : fabriquer `CollectiviteReferentielPreferences` sans écrire en BDD :

```typescript
function prefsEligibleCaeOnly(): CollectiviteReferentielPreferences {
  return {
    te: { display: true, mode: 'readonly' },
    cae: { display: true, mode: 'write' },
    eci: { display: false, mode: 'archived' },
  };
}
```


| Scénario           | Prefs                            | Attendu                                                                                                                                                                       |
| ------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAE seul en write  | `cae: write`, `eci: archived`    | `success`, 1 snapshot ; `ref === 'pre-switch-te'`, `jalon === pre_switch_te`, `nom === 'État pré-bascule Climat Ressources'` ; `scoresPayload` non vide ; `personnalisationReponses` présent |
| CAE + ECI en write | les deux `write`                 | `success`, 2 snapshots (cae + eci)                                                                                                                                            |
| ECI hors write     | `cae: write`, `eci: archived`    | aucun snapshot `eci` en base pour cette CT                                                                                                                                    |
| Idempotence        | 2 appels consécutifs mêmes prefs | 1 ligne par `(collectivite_id, referentiel_id, ref)` ; 2e appel met à jour `modifiedAt`                                                                                       |


Nettoyage : `onTestFinished` — supprimer les snapshots `pre-switch-te` créés (`delete` service-role ou `DELETE FROM client_scores WHERE ref = 'pre-switch-te'`).

Commande : `pnpm test:backend create-pre-switch-snapshots`

---



## Hors scope PR10 (PRs suivantes)


| PR   | Ajout                                                                                                                                                                                                                 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR11 | `list` / `getCurrent` sur refs archivées (masquer `score-courant`, retourner `pre-switch-te`)                                                                                                                         |
| PR17 | `MigrateCollectiviteDataService` — détection des sources fusionnées (y compris ref archived)                                                                                                                          |
| PR18 | Câbler `createPreSwitchSnapshots` en **étape 1** de `transactionManager.executeSingle` ; compléter snapshots archived si fusion ; `post-switch-te` ; prefs + `populatedFromCaeEci` ; retrait `SWITCH_NOT_IMPLEMENTED` |
| PR22 | UI snapshots post-bascule + masquage CTA « Figer l'état des lieux »                                                                                                                                                   |


---



## Ordre d'implémentation

1. Constantes + `case PRE_SWITCH_TE` dans `SnapshotsService.getDefaultSnapshotMetadata`
2. `PRE_SWITCH_SNAPSHOT_FAILED` dans `switch-to-te.errors.ts`
3. `CreatePreSwitchSnapshotsService`
4. Provider dans `ReferentielsModule`
5. e2e `create-pre-switch-snapshots.service.e2e-spec.ts` + `pnpm test:backend create-pre-switch-snapshots`
6. Mise à jour PRD (section Snapshots + plan de livraison)

---



## Critères de done

- [ ] `SnapshotsService` gère `jalon: PRE_SWITCH_TE` (`ref`, `nom` dérivés)
- [ ] `CreatePreSwitchSnapshotsService` : sélection `mode === 'write'`, ordre cae → eci, `tx?` propagé, `Result<ScoreSnapshot[]>`
- [ ] `PRE_SWITCH_SNAPSHOT_FAILED` typé
- [ ] Provider enregistré ; `SwitchToTeService` **inchangé**
- [ ] e2e : 4 scénarios (1 ref, 2 refs, eci ignoré, idempotence)
- [ ] PRD mis à jour (création pre-switch-te = write only en PR10 ; cas archived → PR17/PR18)
- [ ] Déployable en prod sans risque utilisateur (aucun changement sur `switchToTe`)
