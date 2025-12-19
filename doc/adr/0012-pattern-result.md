# 12. Pattern Result pour la Gestion d'Erreurs

Date: 2025-11-21

## Statut

Proposé

## Contexte

Notre codebase actuel souffre de gestion d'erreurs incohérente :

- `throw new Error()` générique partout
- Impossible de distinguer erreurs métier vs techniques
- Pas de typage des erreurs
- Debugging difficile

**Problème concret :**
```typescript
// ❌ AVANT : Erreurs génériques non typées lancées avec throw
async function createPlan(data) {
  if (!data.nom) throw new Error('Nom requis');
  if (data.type === 'PCAET' && !data.referents) throw new Error('Référents requis');
  // ... impossible de savoir facilement quelles autres erreurs peuvent survenir
}
```

**Problèmes identifiés :**
1. Les erreurs ne sont pas typées - impossible de savoir quelles erreurs peuvent survenir
2. Les exceptions sont lancées - pas de propagation explicite
3. Pas de distinction entre erreurs métier et erreurs techniques
4. Le compilateur ne force pas à gérer les erreurs
5. Debugging difficile car les erreurs sont génériques

## Décision

Adopter le **pattern `Result`** pour la gestion d'erreurs avec des **erreurs typées** et une **propagation explicite**.

Ce pattern peut être utilisé dans toute la codebase, mais est particulièrement recommandé pour nos services backend.

###  Définition du pattern `Result`

```typescript
// Type Result simple et réutilisable
type Result<T, E> = 
  | { success: true; value: T } 
  | { success: false; error: E };

// Helper functions pour construire les Results
const success = <T>(value: T): { success: true; value: T } => ({ success: true, value });
const failure = <E>(error: E): { success: false; error: E } => ({ success: false, error });
```

### Erreurs typées

Les erreurs doivent être des classes avec un tag `_tag` pour permettre le pattern matching :

```typescript
// Types d'erreurs métier explicites
class InvalidPlanName extends Error {
  readonly _tag = 'InvalidPlanName';
  constructor(public readonly name: string) {
    super(`Invalid plan name: "${name}"`);
    this.name = 'InvalidPlanName';
  }
}

class MissingPcaetReferent extends Error {
  readonly _tag = 'MissingPcaetReferent';
  constructor() {
    super('Un plan PCAET doit avoir au moins un référent');
    this.name = 'MissingPcaetReferent';
  }
}

// Union type pour toutes les erreurs possibles
type CreatePlanError = InvalidPlanName | MissingPcaetReferent;
```

## Conséquences

### Bénéfices

**1. Gestion d'erreurs plus robuste**
- Erreurs typées et explicites
- Propagation explicite des erreurs sans utiliser `throw` qui force à gérer les erreurs
- Distinguer les erreurs métier des erreurs techniques
- Réduction des exceptions inattendues en production

**2. Maintenabilité**
- Code plus lisible avec gestion d'erreurs explicite
- Facile de comprendre quelles erreurs peuvent survenir
- Documentation implicite via les types d'erreurs
- Tests plus expressifs avec vérification des types d'erreurs

**3. Migration Progressive**
- Migration service par service au fur et à mesure possible
- Coexistence temporaire avec l'ancien système d'exceptions

### Coûts

**1. Verbosité**
- Plus de code pour gérer les erreurs explicitement
- Nécessite des vérifications `if (!result.success)` répétées

**2. Courbe d'Apprentissage**
- Nouveau pattern à apprendre pour l'équipe
- Changement de mentalité : pas de `throw`, propagation explicite


## Exemple d'Utilisation

```typescript
// ❌ AVANT
async function createPlan(data: CreatePlanData): Promise<Plan> {
  if (!data.nom) {
    throw new Error('Nom requis');
  }
  // ...
  return plan;
}

// ✅ APRÈS
async function createPlan(data: CreatePlanData): Promise<Result<Plan, PlanDomainError>> {
  const validationResult = PlanOperations.create(data);
  if (!validationResult.success) {
    return validationResult;
  }
  // ...
  return success(plan);
}
```

## Références

- Pattern Result inspiré de Rust `Result<T, E>`
- Utilisé dans des langages fonctionnels (Haskell `Either`, Scala `Try`)
- Pattern similaire dans TypeScript : `fp-ts`, `effect-ts`
