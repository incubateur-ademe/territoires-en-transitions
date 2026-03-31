---
title: "Extraire les repositories d'historique depuis les services NestJS"
category: architecture-patterns
date: 2026-04-14
tags:
  - nestjs
  - repository-pattern
  - ddd
  - transaction
  - drizzle-orm
  - history-tracking
module: referentiels
problem_type: refactoring_pattern
severity: low
component:
  - referentiels/update-action-statut
  - referentiels/update-action-commentaire
related_adr: 0011-architecture-service-ddd.md
related_solutions:
  - database-issues/select-for-update-race-condition-drizzle-orm.md
---

# Extraire les repositories d'historique depuis les services NestJS

## Probleme

Les services `UpdateActionStatutService` et `UpdateActionCommentaireService` contenaient des methodes privees (`saveActionStatutHistory`, `saveActionCommentaireHistory`) gerant la persistence de l'historique avec deduplication. Cette logique etait invisible au systeme de modules NestJS et faisait grossir les fichiers de service, rendant difficile l'identification du concern "historique" en vue d'un futur regroupement dans un module dedie.

## Cause racine

Les methodes privees dans les services NestJS sont invisibles au systeme d'injection de dependances. Elles ne peuvent pas etre :
- Identifiees comme un concern cohesif au niveau du module
- Reutilisees par d'autres services
- Promues en unite testable independante
- Refactorees vers un module transversal d'audit/historique

## Solution

Extraire la logique d'historique dans des classes `@Injectable()` dediees suivant l'ADR #11 (architecture DDD).

### Structure du repository

```typescript
import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ActionStatut } from '@tet/domain/referentiels';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { historiqueActionStatutTable } from '../models/historique-action-statut.table';

@Injectable()
export class UpdateActionStatutHistoriqueRepository {
  /**
   * Sauvegarde l'historique du statut d'une action avec deduplication
   * sur une fenetre d'1 heure.
   *
   * IMPORTANT : le caller doit detenir un lock FOR UPDATE sur la ligne
   * action_statut correspondante pour eviter les insertions de doublons
   * concurrents.
   */
  async save(
    tx: Transaction,
    newRow: ActionStatut,
    oldRow: ActionStatut | null,
    userId: string | null
  ): Promise<void> {
    // Dedup: cherche une entree recente (meme user, meme action, < 1h)
    // Si trouvee: update. Sinon: insert avec les previous_* values.
  }
}
```

### Decisions cles

| Decision | Raison |
|---|---|
| **Pas d'injection de `DatabaseService`** | Le repository opere dans la transaction du caller. Injecter `DatabaseService` risquerait de creer une connexion separee, brisant l'atomicite. |
| **`tx: Transaction` en parametre** | Garantit que le repository partage la meme transaction et le meme lock que le service appelant. |
| **Methode `save()` au lieu de `execute()`** | Plus semantique : "sauvegarder l'historique" vs une operation generique. |
| **JSDoc documentant le contrat FOR UPDATE** | La dedup est safe uniquement si le caller a acquis un lock. Le contrat est implicite sans documentation. |

### Integration dans le service

```typescript
// Le service acquiert le lock, puis delegue au repository
await this.databaseService.db.transaction(async (tx) => {
  const oldValues = await tx.select().from(actionStatutTable)
    .where(/* ... */)
    .for('update'); // Lock acquis ici

  const upsertedRows = await tx.insert(actionStatutTable)
    .values(/* ... */).onConflictDoUpdate(/* ... */).returning();

  for (const upserted of upsertedRows) {
    await this.updateActionStatutHistoriqueRepository.save(
      tx, upserted, oldValuesMap.get(upserted.actionId) ?? null, user.id
    );
  }
});
```

### Enregistrement dans le module

```typescript
// referentiels.module.ts
providers: [
  UpdateActionStatutHistoriqueRepository,  // Avant le service qui l'injecte
  UpdateActionStatutService,
  UpdateActionStatutRouter,
  UpdateActionCommentaireHistoriqueRepository,
  UpdateActionCommentaireService,
  UpdateActionCommentaireRouter,
]
```

## Prevention

- **Quand extraire ?** Suivre l'ADR #11 : extraire en `.repository.ts` quand la logique de persistence est suffisamment complexe ou constitue un concern identifiable (ici : historique avec dedup).
- **Contrat de concurrence** : toujours documenter via JSDoc quand un repository depend d'un lock acquis par le caller. Cela empeche un futur appelant de l'utiliser hors contexte transactionnel.
- **Ne pas injecter `DatabaseService` dans les repositories transactionnels** : si le repository recoit `tx`, il n'a pas besoin de `DatabaseService`. L'injection creerait une tentation d'utiliser `this.databaseService.db` au lieu du `tx` passe.

## References

- ADR #11 : `doc/adr/0011-architecture-service-ddd.md` -- conventions repository DDD
- ADR #12 : `doc/adr/0012-pattern-result.md` -- pattern Result et TransactionManager
- Solution race condition : `doc/solutions/database-issues/select-for-update-race-condition-drizzle-orm.md`
- Plan : `doc/plans/2026-04-14-001-refactor-extract-historique-repositories-plan.md`
