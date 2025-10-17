# 11. Architecture de Services Domain-Driven Design

Date: 2025-09-04

## Statut

Proposé

## Le Problème : Un Service Réel de Notre Codebase

Regardons un service typique de notre application - celui qui gère la création des plans d'action. Ce code illustre parfaitement les problèmes que nous rencontrons quotidiennement :

```typescript
@Injectable()
export class PlanService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly cacheService: CacheService,
    private readonly eventBus: EventBus,
    private readonly ficheService: FicheService,
    private readonly auditService: AuditService
  ) {}

  async createPlan(request: CreatePlanRequest, user: AuthenticatedUser): Promise<PlanResponse> {
    // 🔥 AUTORISATION mélangée avec logique métier
    if (!await this.permissionService.isAllowed(user, 'PLANS.CREATE', request.collectiviteId)) {
      throw new Error('Forbidden');
    }

    // 🔥 VALIDATION métier éparpillée 
    if (!request.nom || request.nom.trim().length === 0) {
      throw new Error('Le nom du plan est obligatoire');
    }
    
    if (request.nom.length > 255) {
      throw new Error('Le nom du plan ne peut pas dépasser 255 caractères');
    }

    // 🔥 RÈGLES MÉTIER enfouies dans le service
    if (request.type === 'PCAET') {
      if (!request.referents || request.referents.length === 0) {
        throw new Error('Un plan PCAET doit avoir au moins un référent');
      }
      
      // Validation spécifique PCAET cachée ici
      const hasEnergiePilote = request.referents.some(r => r.competence === 'ENERGIE');
      if (!hasEnergiePilote) {
        throw new Error('Un plan PCAET doit avoir un référent énergie');
      }
    }

    // 🔥 GESTION D'ERREURS incohérente (throw Error vs custom errors)
    let savedPlan;
    try {
      // 🔥 TRANSACTION et PERSISTENCE mélangées
      savedPlan = await this.databaseService.db.transaction(async (tx) => {
        const planData = {
          nom: request.nom.trim(),
          type: request.type,
          collectiviteId: request.collectiviteId,
          statut: 'brouillon',
          createdBy: user.id,
          createdAt: new Date()
        };

        const plan = await tx.insert(plans).values(planData).returning();
        
        // 🔥 LOGIQUE MÉTIER cachée dans la persistance
        if (request.createDefaultStructure) {
          const defaultAxes = await this.getDefaultAxesForType(request.type, tx);
          for (const axe of defaultAxes) {
            await tx.insert(axes).values({
              planId: plan[0].id,
              nom: axe.nom,
              ordre: axe.ordre
            });
          }
        }

        // 🔥 EFFETS DE BORD mélangés avec la logique principale
        await this.auditService.logPlanCreation(plan[0].id, user.id, tx);
        
        return plan[0];
      });
    } catch (error) {
      // 🔥 GESTION D'ERREURS générique et peu informative
      console.error('Erreur création plan:', error);
      throw new Error('Impossible de créer le plan');
    }

    // 🔥 CACHE et ÉVÉNEMENTS mélangés avec la logique principale
    try {
      await Promise.all([
        this.cacheService.invalidate(`plans:${request.collectiviteId}`),
        this.eventBus.publish(new PlanCreatedEvent(savedPlan.id, user.id))
      ]);
    } catch (error) {
      // Les erreurs de cache/événements sont silencieuses mais le plan est créé
      console.warn('Erreur effets de bord:', error);
    }

    // 🔥 TRANSFORMATION de données dans le service
    return {
      id: savedPlan.id,
      nom: savedPlan.nom,
      type: savedPlan.type,
      statut: savedPlan.statut,
      collectiviteId: savedPlan.collectiviteId,
      createdAt: savedPlan.createdAt.toISOString(),
      canEdit: await this.permissionService.isAllowed(user, 'PLANS.EDIT', savedPlan.id)
    };
  }

  // 🔥 Même service, autre méthode avec DUPLICATION de logique
  async updatePlan(planId: number, updates: UpdatePlanRequest, user: AuthenticatedUser): Promise<PlanResponse> {
    // Autorisation dupliquée...
    if (!await this.permissionService.isAllowed(user, 'PLANS.EDIT', planId)) {
      throw new Error('Forbidden');
    }

    // Validation dupliquée...
    if (updates.nom && updates.nom.trim().length === 0) {
      throw new Error('Le nom du plan est obligatoire');
    }

    // Règles métier dupliquées et éparpillées...
    if (updates.type === 'PCAET') {
      // ... même logique qu'au-dessus mais légèrement différente
    }

    // ... 50 autres lignes de code similaire
  }
}
```

### 🔍 Constats sur Ce Code

**1. Impossible à tester unitairement**
- Pour tester une règle métier simple ("un PCAET doit avoir un référent énergie"), il faut mocker 6 dépendances
- Les tests sont lents et fragiles

**2. Règles métier éparpillées et dupliquées**
- La logique "qu'est-ce qui fait un plan valide" est répartie dans 3 méthodes différentes
- Impossible de comprendre les règles métier sans lire tout le service

**3. Gestion d'erreurs incohérente**
- `throw new Error()` générique partout
- Impossible de distinguer les erreurs métier des erreurs techniques
- Debugging complexe

**4. Responsabilités multiples dans une même classe**
- Autorisation + validation + règles métier + persistance + cache + événements
- Changer une règle métier peut impacter l'autorisation ou le cache

**5. Évolutivité limitée**
- Ajouter un nouveau type de plan nécessite de modifier plusieurs endroits
- La logique métier n'est pas réutilisable dans d'autres contextes

## La Solution : Refactoring Progressif Vers DDD

Au lieu de réécrire tout d'un coup, nous allons progressivement extraire les responsabilités pour faire émerger une architecture claire. Suivez cette transformation étape par étape :

## Étape 1 : Extraire la Logique Métier Pure

**💡 TAKE #1** : Les règles métier ne devraient dépendre de rien d'autre que du domaine lui-même.

Commençons par extraire toute la logique de validation et les règles métier dans un objet dédié :

```typescript
// AVANT : Logique éparpillée dans le service
// APRÈS : Logique centralisée et testable

import { z } from 'zod';

// Result type pour propagation d'erreurs
type Result<T, E> = { success: true; value: T } | { success: false; error: E };

// Helper functions pour construire les Results
const success = <T>(value: T): { success: true; value: T } => ({ success: true, value });
const failure = <E>(error: E): { success: false; error: E } => ({ success: false, error });

// Combine multiple Results into a single Result with an array of values
const combineResults = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (!result.success) {
      return result;
    }
    values.push(result.value);
  }
  return success(values);
};

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
class MissingEnergyExpertise extends Error {
  readonly _tag = 'MissingEnergyExpertise';
  constructor() {
    super('Un plan PCAET doit avoir un référent énergie');
    this.name = 'MissingEnergyExpertise';
  }
}

type PlanDomainError = InvalidPlanName | MissingPcaetReferent | MissingEnergyExpertise;

// Schéma de validation avec transformation
const planSchema = z.object({
  nom: z.string().min(1).max(255).transform(s => s.trim()),
  type: z.enum(['PAT', 'PCAET', 'AUTRE']).nullable(),
  collectiviteId: z.number().positive(),
  referents: z.array(z.object({
    userId: z.string().uuid(),
    nom: z.string().min(1),
    competence: z.enum(['ENERGIE', 'TRANSPORT', 'DECHETS', 'AUTRE'])
  })).default([])
});

export type Plan = z.infer<typeof planSchema>;
export type CreatePlanData = z.input<typeof planSchema>;

// 🎯 LOGIQUE MÉTIER PURE - Aucune dépendance externe
export const PlanOperations = {
  // Factory avec toutes les règles métier centralisées
  create: (input: CreatePlanData): Result<Plan, PlanDomainError> => {
    // Validation structurelle
    const validation = planSchema.safeParse(input);
    if (!validation.success) {
      return failure(new InvalidPlanName(input.nom || ''));
    }

    const plan = validation.data;

    // Règles métier spécifiques PCAET
    if (plan.type === 'PCAET') {
      if (plan.referents.length === 0) {
        return failure(new MissingPcaetReferent());
      }
      
      const hasEnergyExpert = plan.referents.some(r => r.competence === 'ENERGIE');
      if (!hasEnergyExpert) {
        return failure(new MissingEnergyExpertise());
      }
    }

    return success(plan);
  },

  // Autres règles métier centralisées
  canTransitionTo: (plan: Plan, newStatus: PlanStatus): boolean => {
    // Toute la logique de transition d'état ici
    return true; // Simplified
  },

  getDefaultAxesForType: (type: Plan['type']): Array<{nom: string, ordre: number}> => {
    // Logique de structure par défaut
    if (type === 'PCAET') {
      return [
        { nom: 'Réduction des émissions', ordre: 1 },
        { nom: 'Adaptation au changement climatique', ordre: 2 },
        { nom: 'Production d\'énergie renouvelable', ordre: 3 }
      ];
    }
    return [
      { nom: 'Axe principal', ordre: 1 }
    ];
  }
};
```

**Résultat de l'Étape 1 :**
- Toutes les règles métier sont dans un seul endroit
- Testable unitairement sans aucune dépendance
- Gestion d'erreurs explicite et typée
- Réutilisable dans d'autres contextes

```typescript
// Test unitaire simplifié
describe('PlanOperations.create', () => {
  it('refuse un plan PCAET sans référent énergie', () => {
    const input = {
      nom: 'Mon PCAET',
      type: 'PCAET' as const,
      collectiviteId: 1,
      referents: [{ userId: 'uuid', nom: 'Jean', competence: 'TRANSPORT' as const }]
    };
    
    const result = PlanOperations.create(input);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error._tag).toBe('MissingEnergyExpertise');
    }
  });
});
```

## Étape 2 : Créer un Service Métier (Domain Service)

**💡 TAKE #2** : Certaines opérations métier ne peuvent pas être exprimées purement et nécessitent des dépendances (comme les repositories), mais elles restent dans le domaine.

Créons un service métier qui orchestre les objets du domaine et gère la persistance :

```typescript
// Erreurs liées à la persistance du domaine
class PlanNotFound extends Error {
  readonly _tag = 'PlanNotFound';
  constructor(public readonly planId: number) {
    super(`Plan not found: ${planId}`);
    this.name = 'PlanNotFound';
  }
}
class PersistenceError extends Error {
  readonly _tag = 'PersistenceError';
  constructor(public readonly cause: unknown) {
    super(`Persistence error: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = 'PersistenceError';
  }
}

type PlanDomainServiceError = PlanDomainError | PlanNotFound | PersistenceError;

// Interface du repository (contrat du domaine)
interface PlanRepository {
  save: (plan: Plan, tx?: Transaction) => Promise<Result<Plan, PersistenceError>>;
  findById: (id: number, tx?: Transaction) => Promise<Result<Plan | null, PersistenceError>>;
}

// 🎯 SERVICE MÉTIER - Orchestre les objets du domaine + persistance
@Injectable()
export class PlanDomainService {
  constructor(
    @Inject('PlanRepository')
    private readonly planRepository: PlanRepository
  ) {}

  // Création avec logique métier + persistance
  async createPlan(
    input: CreatePlanData,
    tx?: Transaction
  ): Promise<Result<Plan, PlanDomainServiceError>> {
    // 1. Appliquer les règles métier (pure)
    const planResult = PlanOperations.create(input);
    if (!planResult.success) {
      return planResult;
    }

    // 2. Persister (avec gestion d'erreurs explicite)
    const savedPlanResult = await this.planRepository.save(planResult.value, tx);
    if (!savedPlanResult.success) {
      return savedPlanResult;
    }

    return savedPlanResult;
  }

  // Création avec structure par défaut (logique métier complexe)
  async createPlanWithDefaultStructure(
    input: CreatePlanData,
    tx?: Transaction
  ): Promise<Result<{ plan: Plan; axes: Axe[] }, PlanDomainServiceError>> {
    // 1. Créer le plan avec validation métier
    const planResult = await this.createPlan(input, tx);
    if (!planResult.success) {
      return planResult;
    }
    const plan = planResult.value;

    // 2. Générer la structure par défaut (logique métier)
    const defaultAxesData = PlanOperations.getDefaultAxesForType(plan.type);
    
    // 3. Créer les axes avec leurs propres règles métier (en parallèle)
    const axeCreationResults = defaultAxesData.map(axeData =>
      AxeOperations.create({
        ...axeData,
        planId: plan.id
      })
    );
    
    const validatedAxesResult = combineResults(axeCreationResults);
    if (!validatedAxesResult.success) {
      return validatedAxesResult;
    }
    
    // Sauvegarder tous les axes en parallèle
    const saveResults = await Promise.all(
      validatedAxesResult.value.map(axe => this.axeRepository.save(axe, tx))
    );
    
    const axesResult = combineResults(saveResults);
    if (!axesResult.success) {
      return axesResult;
    }

    return success({ plan, axes: axesResult.value });
  }

  // Mise à jour avec règles métier
  async updatePlan(
    planId: number,
    updates: Partial<CreatePlanData>,
    tx?: Transaction
  ): Promise<Result<Plan, PlanDomainServiceError>> {
    // 1. Récupérer le plan existant
    const existingPlanResult = await this.planRepository.findById(planId, tx);
    if (!existingPlanResult.success) {
      return existingPlanResult;
    }
    
    const existingPlan = existingPlanResult.value;
    if (!existingPlan) {
      return failure(new PlanNotFound(planId));
    }

    // 2. Appliquer les modifications avec validation métier
    const updatedData = { ...existingPlan, ...updates };
    const validatedResult = PlanOperations.create(updatedData);
    if (!validatedResult.success) {
      return validatedResult;
    }

    // 3. Persister
    const savedPlanResult = await this.planRepository.save(validatedResult.value, tx);
    if (!savedPlanResult.success) {
      return savedPlanResult;
    }

    return savedPlanResult;
  }
}
```

**Résultat de l'Étape 2 :**
- Logique métier complexe centralisée (création + structure par défaut)
- Gestion d'erreurs explicite avec le pattern Result
- Pas d'exceptions lancées, erreurs propagées de manière typée
- Transactions gérées au bon niveau
- Testable avec des mocks simples du repository
- Réutilisable par différents services d'application

## Étape 3 : Créer un Service d'Application (Coordination)

**💡 TAKE #3** : Le service d'application orchestre tout ce qui n'est PAS de la logique métier : autorisations, cache, événements, transformations de données.

```typescript
// Erreurs d'application (non-métier)
class Forbidden extends Error {
  readonly _tag = 'Forbidden';
  constructor(public readonly reason: string) {
    super(`Forbidden: ${reason}`);
    this.name = 'Forbidden';
  }
}
class ApplicationError extends Error {
  readonly _tag = 'ApplicationError';
  constructor(public readonly code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = 'ApplicationError';
  }
}

type PlanApplicationError = Forbidden | ApplicationError;

// 🎯 SERVICE D'APPLICATION - Coordination et orchestration
@Injectable()
export class PlanApplicationService {
  constructor(
    private readonly planDomainService: PlanDomainService,
    private readonly permissionService: PermissionService,
    private readonly cacheService: CacheService,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
    private readonly databaseService: DatabaseService
  ) {}

  async createPlan(
    request: CreatePlanRequest,
    user: AuthenticatedUser
  ): Promise<Result<PlanResponse, PlanApplicationError>> {
    
    // 1. 🔐 AUTORISATION (responsabilité application)
    const hasPermission = await this.permissionService.isAllowed(
      user,
      'PLANS.CREATE',
      request.collectiviteId
    );
    if (!hasPermission) {
      return failure(new Forbidden('Cannot create plan for this collectivité'));
    }

    // 2. 🏗️ COORDINATION MÉTIER avec transaction
    const domainResult = await this.databaseService.db.transaction(async (tx) => {
      // Déléguer au service métier
      const planResult = await this.planDomainService.createPlanWithDefaultStructure({
        ...request,
        createdBy: user.id,
        createdAt: new Date()
      }, tx);
      
      // Propager l'erreur si présente
      if (!planResult.success) {
        throw planResult.error; // Will rollback transaction
      }

      // Audit (effet de bord métier mais géré par l'application)
      await this.auditService.logPlanCreation(planResult.value.plan.id, user.id, tx);

      return planResult.value;
    });

    // 3. 🔄 EFFETS DE BORD (responsabilité application)
    try {
      await Promise.all([
        this.cacheService.invalidate(`plans:${request.collectiviteId}`),
        this.eventBus.publish(new PlanCreatedEvent({
          planId: domainResult.plan.id,
          collectiviteId: domainResult.plan.collectiviteId,
          createdBy: user.id
        }))
      ]);
    } catch (error) {
      // Les erreurs de cache/événements ne font pas échouer l'opération
      console.warn('Side effects failed:', error);
    }

    // 4. 📋 TRANSFORMATION DE DONNÉES (responsabilité application)
    const response = await this.toPlanResponse(domainResult.plan, user);
    
    return success(response);
  }

  // Transformation des données du domaine vers l'API
  private async toPlanResponse(plan: Plan, user: AuthenticatedUser): Promise<PlanResponse> {
    return {
      id: plan.id,
      nom: plan.nom,
      type: plan.type,
      statut: plan.statut,
      collectiviteId: plan.collectiviteId,
      createdAt: plan.createdAt.toISOString(),
      // Permissions calculées au niveau application
      canEdit: await this.permissionService.isAllowed(user, 'PLANS.EDIT', plan.id),
      canDelete: await this.permissionService.isAllowed(user, 'PLANS.DELETE', plan.id)
    };
  }
}
```

**Résultat de l'Étape 3 :**
- Service d'application focalisé sur l'orchestration
- Séparation claire : métier vs coordination
- Gestion des effets de bord isolée
- Transformation de données centralisée
- Autorisations gérées au bon niveau

## Étape 4 : Éliminer le Service Original

**💡 TAKE #4** : Le service original n'a plus de raison d'exister ! Le routeur peut directement appeler le service d'application.

```typescript
// Service intermédiaire qui ne fait que déléguer
@Injectable()
export class PlanService {
  constructor(private readonly planApplicationService: PlanApplicationService) {}

  async createPlan(request: CreatePlanRequest, user: AuthenticatedUser): Promise<PlanResponse> {
    const result = await this.planApplicationService.createPlan(request, user);
    // Juste une conversion d'erreurs...
    if (!result.success) throw new BadRequestException(result.error);
    return result.value;
  }
}

// Alternative : Le routeur appelle directement le service d'application
@Injectable()
export class PlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly planApplicationService: PlanApplicationService  // Direct !
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createPlanRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.planApplicationService.createPlan(input, ctx.user);
        
        // Conversion d'erreurs directement dans le routeur - gestion gracieuse
        if (!result.success) {
          const error = result.error;
          if (error._tag === 'Forbidden') {
            throw new TRPCError({ code: 'FORBIDDEN', message: error.reason });
          }
          throw new TRPCError({ code: 'BAD_REQUEST', message: error.message });
        }
        
        return result.value;
      })
  });
}
```

**Considérations sur le service intermédiaire :**

1. **Absence de logique métier** : Il ne fait que déléguer
2. **Absence de coordination** : Aucune orchestration
3. **Mapping d'erreurs uniquement** : Le routeur peut assumer cette responsabilité
4. **Couche supplémentaire** : Ajoute de la complexité
5. **Simplification des tests** : Un composant en moins à tester

## 🎯 Comparaison Avant/Après

### AVANT (Monolithe de 150+ lignes)
```typescript
// Tout mélangé dans une seule classe
class PlanService {
  // 6 dépendances injectées
  // Autorisation + validation + règles métier + persistance + cache + événements
  // 150+ lignes par méthode
  // Tests unitaires complexes
  // Logique dupliquée entre create/update
}
```

### APRÈS (Responsabilités séparées)
```typescript
// Logique métier pure et testable
const PlanOperations = {
  create: (input) => Result<Plan, DomainError>  // 20 lignes, 0 dépendance
}

// Transformations de données isolées
const PlanAdapter = {
  toDomain: (dbRow) => Result<Plan, AdapterError>  // 15 lignes, 0 dépendance
  toDb: (plan) => Result<DbRow, AdapterError>      // 15 lignes, 0 dépendance
}

// Service métier avec persistance
class PlanDomainService {
  createPlan: (input, tx?) => Promise<Result<Plan, DomainError>>  // 30 lignes, 1 dépendance
}

// Service d'application pour coordination
class PlanApplicationService {
  createPlan: (request, user) => Promise<Result<Response, AppError>>  // 40 lignes, 5 dépendances
}

// Routeur appelle directement le service d'application
class PlanRouter {
  // Gestion gracieuse des erreurs + délégation  // 15 lignes, 1 dépendance
}
```

## 💡 Les Concepts DDD Émergent Naturellement

En refactorisant notre service, nous avons naturellement découvert les concepts DDD sans les imposer :

**🎯 Entité (Entity)** : `Plan` - Objet avec identité unique qui évolve dans le temps
**🎯 Objet Valeur (Value Object)** : `PlanType`, `PlanStatus` - Valeurs immuables définies par leurs attributs  
**🎯 Agrégat (Aggregate)** : `Plan + Axes` - Groupe d'objets avec invariants partagés
**🎯 Service Métier (Domain Service)** : `PlanDomainService` - Logique métier qui ne peut pas être dans une entité (=> du code est nécessaire pour exprimer cette logique)
**🎯 Service d'Application** : `PlanApplicationService` - Orchestration et coordination
**🎯 Repository** : Interface d'accès aux données orientée domaine
**🎯 Adapter** : `PlanAdapter` - Transformations entre formats DB et Domain

## Architecture Résultante

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE D'APPLICATION                   │
│  • Autorisation et Permissions                            │
│  • Cache et Optimisation                                  │
│  • Publication d'Événements                               │
│  • Coordination des Transactions                          │
│  • Transformation des Données (API ↔ Domaine)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   SERVICE MÉTIER                          │
│  • Logique Métier et Règles du Domaine                   │
│  • Orchestration des Objets Métier                       │
│  • Workflows Métier avec Persistance                     │
│  • Invariants et Contraintes                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              OBJETS MÉTIER + REPOSITORIES                 │
│  • Entités avec Comportement Métier                      │
│  • Objets de Valeur Immuables                            │
│  • Repository Interfaces                                  │
│  • Logique Métier Pure (Operations)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     ADAPTERS                              │
│  • Transformations DB ↔ Domain                           │
│  • Mapping des Types et Formats                          │
│  • Validation des Conversions                            │
│  • Isolation des Formats Externes                        │
└─────────────────────────────────────────────────────────────┘
```

## Organisation des Dossiers

### Structure Recommandée

```
src/
├── plans/                              # Domaine métier "Plans"
│   ├── domain/                         # 🎯 Logique métier pure
│   │   ├── plan.operations.ts          # Operations pures (create, validate, etc.)
│   │   ├── plan.types.ts               # Types et schémas Zod
│   │   ├── plan.errors.ts              # Erreurs métier typées
│   │   ├── plan-domain.service.ts      # Service métier avec persistance
│   │   └── plan.repository.interface.ts # Contrat repository
│   │
│   ├── application/                    # 🎯 Coordination et orchestration
│   │   └── plan-application.service.ts # Service d'application
│   │
│   ├── infrastructure/                 # 🎯 Détails techniques
│   │   ├── plan.repository.impl.ts     # Implémentation repository
│   │   ├── plan.adapter.ts             # Transformations DB ↔ Domain
│   │   └── plan.queries.ts             # Requêtes SQL/ORM complexes
│   │
│   └── presentation/                   # 🎯 Interface API
│       ├── plan.router.ts              # Routeur tRPC
│       └── plan.schemas.ts             # Schémas de validation API
│
├── fiches/                             # Autre domaine métier
│   ├── domain/
│   │   ├── fiche.operations.ts
│   │   ├── fiche.types.ts
│   │   ├── fiche-domain.service.ts
│   │   └── fiche.repository.interface.ts
│   ├── application/
│   │   └── fiche-application.service.ts
│   ├── infrastructure/
│   │   ├── fiche.repository.impl.ts
│   │   └── fiche.adapter.ts
│   └── presentation/
│       └── fiche.router.ts
│
├── shared/                             # Code partagé
│   ├── domain/
│   │   ├── base-errors.ts              # Erreurs communes
│   │   ├── value-objects/              # Objets de valeur réutilisables
│   │   │   ├── email.ts
│   │   │   ├── uuid.ts
│   │   │   └── date-range.ts
│   │   └── types.ts                    # Types communs
│   │
│   ├── infrastructure/
│   │   ├── database.service.ts         # Service DB commun
│   │   ├── cache.service.ts            # Service cache
│   │   └── event-bus.service.ts        # Bus d'événements
│   │
│   └── application/
│       ├── permission.service.ts       # Service permissions
│       └── audit.service.ts            # Service audit
│
└── app.module.ts                       # Configuration NestJS
```

### Règles d'Organisation

**🎯 Par Domaine Métier, Pas Par Type Technique**
```
✅ BIEN                          ❌ MAL
src/plans/domain/               src/services/
src/plans/application/          src/repositories/
src/fiches/domain/              src/controllers/
```

**🎯 Dépendances Claires**
- `presentation` → `application` → `domain`
- `infrastructure` → `domain` (via interfaces)
- Jamais `domain` → `infrastructure`

**🎯 Partage Intelligent**
- `shared/domain` : Objets de valeur, types communs
- `shared/infrastructure` : Services techniques
- `shared/application` : Services transversaux (permissions, audit)

## Matrice de Décision : Où Mettre Cette Logique ?

### 🤔 "Je dois implémenter cette fonctionnalité, où la mettre ?"

| **Critère** | **Router** | **Application Service** | **Domain Service** | **Operations** |
|-------------|------------|------------------------|-------------------|----------------|
| **Validation des entrées API** | ✅ Schémas Zod | ❌ | ❌ | ❌ |
| **Authentification/Autorisation** | ✅ Guards tRPC | ✅ Vérifications | ❌ | ❌ |
| **Règles métier** | ❌ | ❌ | ✅ Orchestration | ✅ Pure |
| **Validation métier** | ❌ | ❌ | ❌ | ✅ |
| **Persistance simple** | ❌ | ❌ | ✅ | ❌ |
| **Transactions complexes** | ❌ | ✅ Multi-domaine | ✅ Mono-domaine | ❌ |
| **Cache** | ❌ | ✅ | ❌ | ❌ |
| **Événements** | ❌ | ✅ | ❌ | ❌ |
| **Transformation API ↔ Domain** | ✅ Simple | ✅ Complexe | ❌ | ❌ |
| **Gestion d'erreurs HTTP** | ✅ | ❌ | ❌ | ❌ |
| **Calculs métier** | ❌ | ❌ | ✅ Avec données | ✅ Pure |
| **Coordination inter-services** | ❌ | ✅ | ❌ | ❌ |

### 🎯 Exemples Concrets

#### Exemple 1 : "Créer un plan PCAET"
```typescript
// ✅ Router : Validation API + gestion gracieuse des erreurs
input: createPlanSchema,
const result = await this.planApplicationService.createPlan(input, ctx.user);
if (!result.success) throw new TRPCError({...});

// ✅ Application Service : Autorisation + coordination + effets de bord
const hasPermission = await this.permissionService.isAllowed(...);
const planResult = await this.planDomainService.createPlan(...);
await this.cacheService.invalidate(...);
await this.eventBus.publish(...);

// ✅ Domain Service : Orchestration métier + persistance
const validPlanResult = PlanOperations.create(input);
if (!validPlanResult.success) return validPlanResult;
const savedPlanResult = await this.planRepository.save(validPlanResult.value);
if (!savedPlanResult.success) return savedPlanResult;
const axesResult = await this.createDefaultAxes(savedPlanResult.value.id);

// ✅ Operations : Règles métier pures
if (input.type === 'PCAET' && !input.referents?.some(r => r.competence === 'ENERGIE')) {
  return failure(new MissingEnergyExpertise());
}
```

#### Exemple 2 : "Calculer le taux de completion d'un plan"
```typescript
// ✅ Operations : Calcul pur
calculateCompletion: (plan: Plan, fiches: Fiche[]): number => {
  const totalFiches = fiches.length;
  const fichesCompleted = fiches.filter(f => f.statut === 'realise').length;
  return totalFiches > 0 ? (fichesCompleted / totalFiches) * 100 : 0;
}

// ✅ Domain Service : Récupération données + calcul
async getCompletionRate(planId: number): Promise<Result<number, DomainError>> {
  const planResult = await this.findPlanById(planId);
  if (!planResult.success) return planResult;
  
  const fichesResult = await this.findFichesByPlanId(planId);
  if (!fichesResult.success) return fichesResult;
  
    const completion = PlanOperations.calculateCompletion(planResult.value, fichesResult.value);
  return success(completion);
}
```

#### Exemple 3 : "Envoyer une notification lors de validation"
```typescript
// ❌ MAL : Dans Domain Service
class PlanDomainService {
  async validatePlan(planId: number) {
    // ... logique de validation
    await this.emailService.sendNotification(); // ❌ Effet de bord
  }
}

// ✅ BIEN : Dans Application Service
class PlanApplicationService {
  async validatePlan(planId: number, user: User) {
    // Logique métier déléguée
    const result = await this.planDomainService.validatePlan(planId);
    
    // Effets de bord dans Application Service
    if (result.success) {
      await this.eventBus.publish(new PlanValidatedEvent({...}));
      await this.notificationService.notifyReferents(result.data);
    }
  }
}
```

### 🚨 Pièges Courants à Éviter

| **Piège** | **Pourquoi c'est mal** | **Solution** |
|-----------|----------------------|-------------|
| Logique métier dans le Router | Couplage API ↔ Business | → Application Service |
| Autorisation dans Domain Service | Mélange concerns | → Application Service |
| Cache dans Domain Service | Effet de bord technique | → Application Service |
| SQL dans Application Service | Couplage technique | → Repository |
| Validation API dans Domain | Couplage format externe | → Router (schémas Zod) |
| Événements dans Domain Service | Effet de bord | → Application Service |

## Règles de Décision Simples

### Où mettre cette logique ?

**🎯 Operations (Logique Pure)**
- ✅ Validation des données d'entrée
- ✅ Règles métier qui ne nécessitent pas de persistance
- ✅ Calculs et transformations métier
- ✅ Tout ce qui peut être testé sans dépendances

**🎯 Domain Service (Logique + Persistance)**
- ✅ Orchestration d'objets métier avec persistance
- ✅ Workflows métier complexes
- ✅ Logique qui nécessite des données existantes
- ✅ Transactions au niveau domaine

**🎯 Application Service (Coordination)**
- ✅ Autorisation et permissions
- ✅ Cache et optimisations
- ✅ Événements et notifications
- ✅ Transformations API ↔ Domaine
- ✅ Coordination inter-domaines

## Gestion d'Erreurs avec le Pattern Result

### Pourquoi le Pattern Result ?

Notre codebase actuel souffre de gestion d'erreurs incohérente :
- `throw new Error()` générique partout
- Impossible de distinguer erreurs métier vs techniques
- Pas de typage des erreurs
- Debugging difficile

Le pattern Result résout ces problèmes :

```typescript
// ❌ AVANT : Erreurs génériques non typées lancées avec throw
async function createPlan(data) {
  if (!data.nom) throw new Error('Nom requis');
  if (data.type === 'PCAET' && !data.referents) throw new Error('Référents requis');
  // ... impossible de savoir quelles erreurs peuvent survenir
}

// ✅ APRÈS : Erreurs typées et propagées via Result
function createPlan(data: CreatePlanData): Result<Plan, PlanDomainError> {
  // Toutes les erreurs possibles sont dans le type de retour
  // Pas d'exception lancée, erreurs propagées explicitement
  // Le compilateur force à les gérer
}
```

### Pattern d'Adoption Progressif

```typescript
// Type Result simple et réutilisable
type Result<T, E> = 
  | { success: true; value: T } 
  | { success: false; error: E };

// 1. Commencez par Result pour la logique pure
const result = PlanOperations.create(data);
if (!result.success) {
  // Gestion d'erreur explicite, pas d'exception
  console.error(result.error);
  return;
}
const plan = result.value;

// 2. Propagation dans les services avec async/await
async function createPlan(input: CreatePlanData): Promise<Result<Plan, DomainError>> {
  const validationResult = PlanOperations.create(input);
  if (!validationResult.success) {
    return validationResult; // Propagation sans throw
  }
  
  const saveResult = await repository.save(validationResult.value);
  return saveResult; // Pas d'exception lancée
}

// 3. Gestion gracieuse dans le router (seul endroit où on throw si nécessaire)
const result = await planApplicationService.createPlan(request, user);
if (!result.success) {
  // Conversion en erreur HTTP appropriée
  throw new TRPCError({ code: 'BAD_REQUEST', message: result.error.message });
}
return result.value;
```

## Étape 5 : Ajouter les Adapters (Transformation de Données)

**💡 TAKE #5** : Les objets métier ne devraient jamais dépendre du format de la base de données. Les Adapters isolent ces transformations.

Dans notre refactoring, nous avons un problème caché : notre `PlanDomainService` assume que les données DB correspondent exactement aux objets métier. En réalité, il faut souvent transformer :

```typescript
// 🔥 PROBLÈME : Couplage DB ↔ Domain
class PlanDomainService {
  async createPlan(input: CreatePlanData): Promise<Result<Plan, DomainServiceError>> {
    const validationResult = PlanOperations.create(input);
    if (!validationResult.success) {
      return validationResult;
    }
    
    // ❌ On assume que l'objet métier = format DB
    const savedPlanResult = await this.planRepository.save(validationResult.value, tx);
    return savedPlanResult;
  }
}
```

**Le problème** : Notre base de données utilise `snake_case`, des IDs différents, et des formats de dates spécifiques, mais notre domaine utilise `camelCase` et des types TypeScript stricts.

**La solution** : Créer des Adapters qui transforment entre les formats :

```typescript
class AdapterError extends Error {
  readonly _tag = 'AdapterError';
  constructor(
    public readonly reason: string, 
    public readonly field?: string
  ) {
    super(`Adapter error: ${reason}${field ? ` (field: ${field})` : ''}`);
    this.name = 'AdapterError';
  }
}

// Types séparés : DB vs Domain
type PlanDbRow = {
  plan_id: number;
  plan_name: string;
  collectivite_id: number;
  plan_type: 'PAT' | 'PCAET' | 'AUTRE' | null;
  status_code: 'draft' | 'in_progress' | 'validated' | 'archived';
  created_at: string; // ISO string from DB
  created_by_user_id: string;
  referents_data: string; // JSON string
};

type Plan = {
  id: number;
  nom: string;
  collectiviteId: number;
  type: 'PAT' | 'PCAET' | 'AUTRE' | null;
  statut: 'brouillon' | 'en_cours' | 'valide' | 'archive';
  createdAt: Date;
  createdBy: string;
  referents: Array<{
    userId: string;
    nom: string;
    competence: 'ENERGIE' | 'TRANSPORT' | 'DECHETS' | 'AUTRE';
  }>;
};

// 🎯 ADAPTER - Transformations isolées et testables
export const PlanAdapter = {
  // DB → Domain
  toDomain: (dbRow: PlanDbRow): Result<Plan, AdapterError> => {
    try {
      // Mapping des statuts
      const statutMapping = {
        'draft': 'brouillon',
        'in_progress': 'en_cours', 
        'validated': 'valide',
        'archived': 'archive'
      } as const;

      // Parse JSON des référents
      let referents: Plan['referents'] = [];
      if (dbRow.referents_data) {
        referents = JSON.parse(dbRow.referents_data);
      }

      const domainPlan: Plan = {
        id: dbRow.plan_id,
        nom: dbRow.plan_name,
        collectiviteId: dbRow.collectivite_id,
        type: dbRow.plan_type,
        statut: statutMapping[dbRow.status_code],
        createdAt: new Date(dbRow.created_at),
        createdBy: dbRow.created_by_user_id,
        referents
      };

      return success(domainPlan);
    } catch (error) {
      return failure(new AdapterError(
          'Failed to convert DB row to domain object',
          error instanceof Error ? error.message : 'unknown'
        )
      );
    }
  },

  // Domain → DB
  toDb: (plan: Plan): Result<PlanDbRow, AdapterError> => {
    try {
      // Mapping inverse des statuts
      const statusMapping = {
        'brouillon': 'draft',
        'en_cours': 'in_progress',
        'valide': 'validated', 
        'archive': 'archived'
      } as const;

      const dbRow: PlanDbRow = {
        plan_id: plan.id,
        plan_name: plan.nom,
        collectivite_id: plan.collectiviteId,
        plan_type: plan.type,
        status_code: statusMapping[plan.statut],
        created_at: plan.createdAt.toISOString(),
        created_by_user_id: plan.createdBy,
        referents_data: JSON.stringify(plan.referents)
      };

      return success(dbRow);
    } catch (error) {
      return failure(new AdapterError('Failed to convert domain object to DB row'));
    }
  }
};

// 🎯 REPOSITORY avec Adapter intégré
@Injectable()
export class PlanRepository {
  constructor(private readonly db: DatabaseService) {}

  async save(plan: Plan, tx?: Transaction): Promise<Result<Plan, PersistenceError | AdapterError>> {
    // 1. Convertir Domain → DB
    const dbRowResult = PlanAdapter.toDb(plan);
    if (!dbRowResult.success) {
      return dbRowResult;
    }

    // 2. Sauvegarder en DB
    try {
      const executor = tx || this.db;
      const [inserted] = await executor
        .insert(plansTable)
        .values(dbRowResult.value)
        .returning();
      const savedRow = inserted as PlanDbRow;

      // 3. Convertir DB → Domain
      const domainResult = PlanAdapter.toDomain(savedRow);
      if (!domainResult.success) {
        return domainResult;
      }

      return domainResult;
    } catch (error) {
      return { 
        success: false, 
        error: new PersistenceError(error) 
      };
    }
  }

  async findById(id: number, tx?: Transaction): Promise<Result<Plan | null, PersistenceError | AdapterError>> {
    // 1. Récupérer de la DB
    try {
      const executor = tx || this.db;
      const dbRow = await executor
        .select()
        .from(plansTable)
        .where(eq(plansTable.plan_id, id))
        .limit(1)
        .then(rows => rows[0] || null);

      if (!dbRow) {
        return success(null);
      }

      // 2. Convertir DB → Domain
      const domainResult = PlanAdapter.toDomain(dbRow);
      if (!domainResult.success) {
        return domainResult;
      }

      return domainResult;
    } catch (error) {
      return { 
        success: false, 
        error: new PersistenceError(error) 
      };
    }
  }
}
```

**🎯 Résultat de l'Étape 5 :**
- ✅ **Isolation complète** : Le domaine ne connaît pas le format DB
- ✅ **Transformations explicites** : Mapping des statuts, formats de dates, etc.
- ✅ **Testabilité** : Les adapters sont purs et facilement testables
- ✅ **Évolutivité** : Changer le schéma DB n'impacte que l'adapter
- ✅ **Gestion d'erreurs** : Les erreurs de transformation sont typées

```typescript
// Test de l'adapter (trivial)
describe('PlanAdapter', () => {
  it('convertit correctement DB → Domain', () => {
    const dbRow: PlanDbRow = {
      plan_id: 1,
      plan_name: 'Mon Plan PCAET',
      collectivite_id: 42,
      plan_type: 'PCAET',
      status_code: 'validated',
      created_at: '2024-01-15T10:30:00.000Z',
      created_by_user_id: 'user-123',
      referents_data: '[{"userId":"ref-1","nom":"Jean","competence":"ENERGIE"}]'
    };

    const result = PlanAdapter.toDomain(dbRow);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.statut).toBe('valide'); // Mapping correct
      expect(result.value.createdAt).toBeInstanceOf(Date);
      expect(result.value.referents).toHaveLength(1);
    }
  });
});
```


# 🏗️ Architecture Backend DDD - Proposition

## 📁 Structure Générale Proposée

```
src/
├── app.module.ts                           # Configuration NestJS racine
├── main.ts                                # Point d'entrée de l'application
│
├── plans/                                 # 🎯 DOMAINE : Plans d'action territoriaux
│   ├── domain/                           # 🧠 Logique métier pure
│   │   ├── plan.aggregate.ts             # Plan comme racine d'agrégat
│   │   ├── axe.entity.ts                 # Entité enfant : Axe
│   │   ├── fiche.entity.ts               # Entité enfant : Fiche
│   │   ├── budget.value-object.ts        # Objet de valeur : Budget
│   │   ├── plan.operations.ts            # Opérations pures (create, validate, etc.)
│   │   ├── plan.types.ts                 # Types et schémas Zod
│   │   ├── plan.errors.ts                # Erreurs métier typées
│   │   ├── plan-domain.service.ts        # Service métier avec persistance
│   │   └── plan.repository.interface.ts  # Contrat repository
│   │
│   ├── application/                      # 🎯 Coordination et orchestration
│   │   ├── plan-application.service.ts   # Service d'application principal
│   │   ├── plan-import.service.ts        # Service d'import (use case spécifique)
│   │   ├── plan-export.service.ts        # Service d'export (use case spécifique)
│   │   └── plan-analytics.service.ts     # Service analytics cross-domaine
│   │
│   ├── infrastructure/                   # 🔧 Détails techniques
│   │   ├── plan.repository.impl.ts       # Implémentation repository
│   │   ├── plan.adapter.ts               # Transformations DB ↔ Domain
│   │   ├── plan.queries.ts               # Requêtes SQL/ORM complexes
│   │   ├── plan.tables.ts                # Définitions tables Drizzle
│   │   └── external/                     # Services externes
│   │       ├── plan-export.client.ts     # Client pour export externe
│   │       └── plan-notification.client.ts # Client notifications
│   │
│   ├── presentation/                     # 🌐 Interface API
│   │   ├── plan.router.ts                # Routeur tRPC principal
│   │   ├── plan.schemas.ts               # Schémas validation API
│   │   ├── plan.controller.ts            # Controller REST (si nécessaire)
│   │   └── dto/                          # DTOs pour API
│   │       ├── create-plan.dto.ts
│   │       ├── update-plan.dto.ts
│   │       └── plan-response.dto.ts
│   │
│   ├── tests/                            # 🧪 Tests du domaine
│   │   ├── unit/                         # Tests unitaires (domain, operations)
│   │   ├── integration/                  # Tests d'intégration (services)
│   │   └── e2e/                          # Tests end-to-end (API)
│   │
│   ├── plans.module.ts                   # Module NestJS du domaine
│   └── index.ts                          # Exports publics
│
├── indicateurs/                          # 🎯 DOMAINE : Indicateurs et métriques
│   ├── ...
## Conséquences de cette Architecture

### Bénéfices

**1. Testabilité Améliorée**
- Logique métier testable unitairement sans aucune dépendance
- Tests plus rapides et plus fiables
- Coverage métier plus facilement atteignable

**2. Maintenabilité et Évolutivité**
- Règles métier centralisées et plus faciles à modifier
- Réutilisation de la logique métier dans différents contextes

**3. Gestion d'Erreurs Plus Robuste**
- Erreurs typées et explicites
- Debugging facilité avec des erreurs contextualisées
- Réduction des exceptions inattendues en production

**4. Séparation des Préoccupations Plus Claire**
- Chaque couche a une responsabilité bien définie
- Modifications plus isolées avec moins d'effets de bord
- Code plus lisible et plus compréhensible

**5. Adoption Graduelle**
- Migration service par service sans casser l'existant
- Approche progressive, risque maîtrisé
- ROI visible dès le premier service migré

### Coûts

**1. Nombre de Fichiers Accru**
- 1 service devient 3-4 fichiers (Operations, Domain Service, Application Service)
- Structure de dossiers plus complexe

**2. Courbe d'Apprentissage**
- Effect-TS nécessite une montée en compétences
- Concepts DDD à assimiler
- Nouveaux patterns à maîtriser

**3. Overhead Initial**
- Setup plus long pour les nouveaux services
- Plus de boilerplate au début


## 🚨 Détecter les Mauvaises Frontières de Domaine

### Application Services : Révélateurs de Problèmes de Domaine

Votre Application Service vous dit si vos domaines sont mal découpés. Voici les signaux d'alarme :

### **🔴 RED FLAG #1 : Coordination Systématique**

```typescript
// PROBLÈME : Toujours les mêmes services ensemble
@Injectable()
export class PlanApplicationService {
  
  async createPlan() {
    const plan = await this.planDomainService.createPlan();
    const axes = await this.axeDomainService.createDefaultAxes(plan.id);     // Toujours
    const fiches = await this.ficheDomainService.createDefaultFiches(plan.id); // Toujours
    return { plan, axes, fiches };
  }

  async updatePlan() {
    const plan = await this.planDomainService.updatePlan();
    await this.axeDomainService.reorderAxes(plan.id);                       // Toujours
    await this.ficheDomainService.updateFichesStructure(plan.id);           // Toujours
    return plan;
  }

  async deletePlan() {
    await this.ficheDomainService.deleteAllFiches(plan.id);                 // Toujours
    await this.axeDomainService.deleteAllAxes(plan.id);                     // Toujours  
    await this.planDomainService.deletePlan(plan.id);
  }
}

// DIAGNOSTIC : Si vous coordonnez TOUJOURS les mêmes services
// → C'est probablement UN SEUL domaine métier
```

#### **💡 SOLUTION pour Red Flag #1 : Unifier en Agrégat**

```typescript
// SOLUTION : Domaine unifié avec Plan comme racine d'agrégat
@Injectable()
export class PlanDomainService {
  
  // Une seule opération qui gère tout l'agrégat
  async createCompletePlan(
    planData: CreatePlanData,
    tx?: Transaction
  ): Promise<Result<Plan, DomainError>> {
    // Validation de l'agrégat complet
    const planResult = PlanOperations.create({
      ...planData,
      createDefaultStructure: true
    });
    if (!planResult.success) {
      return planResult;
    }
    
    // Sauvegarde atomique de tout l'agrégat
    const savedPlanResult = await this.planRepository.save(planResult.value, tx);
    if (!savedPlanResult.success) {
      return savedPlanResult;
    }
    
    return savedPlanResult;
  }
  
  // Plus besoin de coordonner : tout est dans le même agrégat
  async updatePlanStructure(
    planId: number,
    updates: UpdatePlanStructureData,
    tx?: Transaction
  ): Promise<Result<Plan, DomainError>> {
    const planResult = await this.planRepository.findById(planId, tx);
    if (!planResult.success) {
      return planResult;
    }
    
    const plan = planResult.value;
    if (!plan) {
      return failure(new PlanNotFound(planId));
    }
    
    // Logique métier unifiée dans l'agrégat
    const updatedPlanResult = plan.updateStructure(updates);
    if (!updatedPlanResult.success) {
      return updatedPlanResult;
    }
    
    const savedPlanResult = await this.planRepository.save(updatedPlanResult.value, tx);
    if (!savedPlanResult.success) {
      return savedPlanResult;
    }
    
    return savedPlanResult;
  }
}

// Modèle de domaine unifié
export class Plan {
  constructor(
    public readonly id: number,
    public readonly nom: string,
    public readonly type: PlanType,
    public readonly collectiviteId: number,
    public readonly axes: Axe[],          // Entités enfants
    public readonly fiches: Fiche[],      // Entités enfants
    public readonly statut: PlanStatus
  ) {}
  
  // Logique métier centralisée
  updateStructure(updates: UpdatePlanStructureData): Result<Plan, DomainError> {
    // Validation globale de la cohérence
    if (updates.axes && updates.fiches) {
      const isCoherent = this.validateAxesFichesCoherence(updates.axes, updates.fiches);
      if (!isCoherent) {
        return failure(new IncoherentStructureError());
      }
    }
    
    return success(new Plan(
        this.id,
        updates.nom ?? this.nom,
        updates.type ?? this.type,
        this.collectiviteId,
        updates.axes ?? this.axes,
        updates.fiches ?? this.fiches,
        this.statut
      )
    };
  }
  
  private validateAxesFichesCoherence(axes: Axe[], fiches: Fiche[]): boolean {
    // Règle métier : toutes les fiches doivent avoir un axe valide
    return fiches.every(fiche => 
      axes.some(axe => axe.id === fiche.axeId)
    );
  }
}
```

### **🔴 RED FLAG #2 : Transaction Boundaries Partout**

```typescript
// PROBLÈME : Toutes les opérations nécessitent des transactions cross-services
@Injectable() 
export class PlanApplicationService {

  async createPlan() {
    return this.db.transaction(async (tx) => {
      const plan = await this.planDomainService.createPlan(data, tx);
      const axes = await this.axeDomainService.createAxes(plan.id, tx);     // Même transaction
      const fiches = await this.ficheDomainService.createFiches(plan.id, tx); // Même transaction
      // Toujours dans la même transaction = même agrégat !
    });
  }

  async updatePlanStructure() {
    return this.db.transaction(async (tx) => {
      await this.planDomainService.updatePlan(data, tx);
      await this.axeDomainService.restructureAxes(planId, tx);              // Même transaction
      await this.ficheDomainService.reassignFiches(planId, tx);             // Même transaction
    });
  }
}

// DIAGNOSTIC : Si vos opérations métier nécessitent TOUJOURS des transactions cross-services
// → Ces services gèrent le même agrégat métier
```

#### **💡 SOLUTION pour Red Flag #2 : Transactions Intra-Agrégat**

```typescript
// SOLUTION : Une seule transaction par agrégat
@Injectable()
export class PlanDomainService {
  
  // Transaction unique pour l'agrégat complet
  async createPlanWithStructure(
    request: CreatePlanRequest,
    tx?: Transaction
  ): Promise<Result<Plan, DomainError>> {
    // Tout se passe dans le même agrégat = une seule transaction
    const planResult = PlanAggregate.create({
      nom: request.nom,
      type: request.type,
      collectiviteId: request.collectiviteId,
      defaultAxes: request.createDefaultStructure ? 
        PlanOperations.getDefaultAxesForType(request.type) : [],
      defaultFiches: request.createDefaultStructure ?
          PlanOperations.getDefaultFichesForType(request.type) : []
    });
    
    if (!planResult.success) {
      return planResult;
    }
    
    // Une seule sauvegarde atomique
    const savedPlanResult = await this.planRepository.save(planResult.value, tx);
    if (!savedPlanResult.success) {
      return savedPlanResult;
    }
    
    return savedPlanResult;
  }
}

// Agrégat qui gère sa propre cohérence
export class PlanAggregate {
  
  static create(data: CreatePlanData): Result<PlanAggregate, DomainError> {
    // Validation de cohérence globale à la création
    if (data.type === 'PCAET') {
      if (data.defaultAxes.length < 3) {
        return failure(new InvalidPcaetStructure('PCAET needs at least 3 axes'));
      }
    }
    
    // Validation des relations axes-fiches
    const ficheAxeIds = data.defaultFiches.map(f => f.axeId);
    const axeIds = data.defaultAxes.map(a => a.id);
    const hasOrphanFiches = ficheAxeIds.some(id => !axeIds.includes(id));
    
    if (hasOrphanFiches) {
      return failure(new OrphanFichesError());
    }
    
    return success(new PlanAggregate(
        data.nom,
        data.type,
        data.collectiviteId,
        data.defaultAxes,
        data.defaultFiches,
        'brouillon'
      )
    };
  }
  
  // Opérations qui maintiennent la cohérence interne
  addAxe(axe: Axe): Result<PlanAggregate, DomainError> {
    // Validation des règles métier internes
    if (this.axes.some(a => a.nom === axe.nom)) {
      return failure(new DuplicateAxeError(axe.nom));
    }
    
    return success(new PlanAggregate(
        this.nom,
        this.type,
        this.collectiviteId,
        [...this.axes, axe],
        this.fiches,
        this.statut
      )
    };
  }
  
  removeAxe(axeId: number): Result<PlanAggregate, DomainError> {
    // Gestion des dépendances internes
    const dependentFiches = this.fiches.filter(f => f.axeId === axeId);
    if (dependentFiches.length > 0) {
      return failure(new AxeHasDependentFichesError(axeId, dependentFiches.length));
    }
    
    return success(new PlanAggregate(
        this.nom,
        this.type,
        this.collectiviteId,
        this.axes.filter(a => a.id !== axeId),
        this.fiches,
        this.statut
      )
    };
  }
}

// Application Service simplifié - plus de transactions cross-services
@Injectable()
export class PlanApplicationService {
  
  async createPlan(request: CreatePlanRequest, user: AuthenticatedUser) {
    // Autorisation
    const hasPermission = await this.permissionService.isAllowed(user, 'PLANS.CREATE', request.collectiviteId);
    if (!hasPermission) {
      return failure(new Forbidden('Unauthorized'));
    }
    
    // Une seule transaction pour tout l'agrégat
    const result = await this.db.transaction(async (tx) => {
      const planResult = await this.planDomainService.createPlanWithStructure(request, tx);
      if (!planResult.success) {
        throw planResult.error; // Rollback transaction
      }
      return planResult.value;
    });
    
    // Effets de bord
    await this.eventBus.publish(new PlanCreatedEvent({ planId: result.id }));
    
    return success(result);
  }
}
```

### **🔴 RED FLAG #3 : Logique Métier dans l'Application Service**

```typescript
// PROBLÈME : L'Application Service contient de la logique métier
@Injectable()
export class PlanApplicationService {

  async validatePlan(planId: number) {
    const plan = await this.planDomainService.findById(planId);
    const fiches = await this.ficheDomainService.findByPlanId(planId);
    
    // Règle métier dans l'Application Service
    if (plan.type === 'PCAET' && fiches.length < 3) {
      throw new Error('Un PCAET doit avoir au moins 3 fiches');
    }
    
    // Calcul métier dans l'Application Service
    const completion = fiches.filter(f => f.statut === 'realise').length / fiches.length;
    if (completion < 0.8) {
      throw new Error('Le plan doit être complété à 80%');
    }
    
    return this.planDomainService.markAsValidated(planId);
  }
}

// DIAGNOSTIC : Si l'Application Service connaît les règles métier
// → Ces objets appartiennent au même domaine
```

#### **💡 SOLUTION pour Red Flag #3 : Déplacer la Logique vers le Domaine**

```typescript
// SOLUTION : Logique métier dans le domaine, coordination dans l'Application Service
@Injectable()
export class PlanApplicationService {

  async validatePlan(planId: number, user: AuthenticatedUser) {
    // Autorisation (Application concern)
    const hasPermission = await this.permissionService.isAllowed(user, 'PLANS.VALIDATE', planId);
    if (!hasPermission) {
      return failure(new Forbidden('Unauthorized'));
    }
    
    // Délégation au domaine pour la logique métier
    const validationResult = await this.planDomainService.validatePlan(planId);
    
    if (!validationResult.success) {
      return validationResult; // Propagation des erreurs métier
    }
    
    const validatedPlan = validationResult.value;
    
    // Effets de bord (Application concern)
    await Promise.all([
      this.eventBus.publish(new PlanValidatedEvent({ planId: validatedPlan.id })),
      this.auditService.logPlanValidation(planId, user.id),
      this.cacheService.invalidate(`plan:${planId}`)
    ]);
    
    return success(validatedPlan);
  }
}

// Logique métier centralisée dans le domaine
@Injectable()
export class PlanDomainService {
  
  async validatePlan(planId: number): Promise<Result<Plan, DomainError>> {
    const planResult = await this.planRepository.findById(planId);
    if (!planResult.success) {
      return planResult;
    }
    
    const plan = planResult.value;
    if (!plan) {
      return failure(new PlanNotFound(planId));
    }
    
    // Délégation à l'agrégat pour les règles métier
    const validationResult = plan.validate();
    if (!validationResult.success) {
      return validationResult;
    }
    
    // Sauvegarde du nouveau statut
    const savedPlanResult = await this.planRepository.save(validationResult.value);
    if (!savedPlanResult.success) {
      return savedPlanResult;
    }
    
    return savedPlanResult;
  }
}

// ✅ Règles métier dans l'agrégat
export class Plan {
  
  validate(): Result<Plan, DomainError> {
    // Règle métier : validation spécifique par type
    if (this.type === 'PCAET') {
      const pcaetValidation = this.validatePcaetRules();
      if (!pcaetValidation.success) {
        return pcaetValidation;
      }
    }
    
    // Règle métier : calcul de complétude
    const completion = this.calculateCompletion();
    if (completion < 0.8) {
      return { 
        success: false, 
        error: new InsufficientCompletionError(completion, 0.8)
      };
    }
    
    // Transition d'état valide
    if (this.statut !== 'brouillon' && this.statut !== 'en_cours') {
      return { 
        success: false, 
        error: new InvalidStatusTransitionError(this.statut, 'valide')
      };
    }
    
    return { 
      success: true, 
      value: new Plan(
        this.id,
        this.nom,
        this.type,
        this.collectiviteId,
        this.axes,
        this.fiches,
        'valide' // Nouveau statut
      )
    };
  }
  
  private validatePcaetRules(): Result<void, DomainError> {
    // Règle métier PCAET : au moins 3 fiches
    if (this.fiches.length < 3) {
      return { 
        success: false, 
        error: new InsufficientPcaetFichesError(this.fiches.length, 3)
      };
    }
    
    // Règle métier PCAET : au moins un axe "énergie"
    const hasEnergyAxe = this.axes.some(axe => 
      axe.nom.toLowerCase().includes('énergie') || 
      axe.nom.toLowerCase().includes('energie')
    );
    
    if (!hasEnergyAxe) {
      return failure(new MissingEnergyAxeError());
    }
    
    return success(undefined);
  }
  
  private calculateCompletion(): number {
    if (this.fiches.length === 0) return 0;
    
    const completedFiches = this.fiches.filter(fiche => 
      fiche.statut === 'realise' || fiche.statut === 'valide'
    ).length;
    
    return completedFiches / this.fiches.length;
  }
}
```

### **🔴 RED FLAG #4 : Services qui se Connaissent Trop**

```typescript
// PROBLÈME : Les Domain Services se connaissent indirectement
@Injectable()
export class FicheDomainService {
  
  async updateFiche(ficheId: number, updates: UpdateFicheData) {
    const fiche = await this.ficheRepository.findById(ficheId);
    
    // Le FicheService connaît les règles du Plan
    const plan = await this.planDomainService.findById(fiche.planId);
    if (plan.statut === 'archive') {
      throw new Error('Cannot modify fiche in archived plan');
    }
    
    // Le FicheService connaît la structure des Axes
    const axe = await this.axeDomainService.findById(fiche.axeId);
    if (axe.type === 'OBLIGATOIRE' && updates.statut === 'abandonne') {
      throw new Error('Cannot abandon mandatory axe fiche');
    }
    
    return this.ficheRepository.save({ ...fiche, ...updates });
  }
}

// DIAGNOSTIC : Si un Domain Service connaît les règles d'autres "domaines"
// → C'est le même domaine métier
```

#### **💡 SOLUTION pour Red Flag #4 : Encapsulation dans l'Agrégat**

```typescript
// SOLUTION : Toute la logique inter-entités dans l'agrégat
export class Plan {
  
  // Encapsulation : les règles inter-entités restent dans l'agrégat
  updateFiche(ficheId: number, updates: UpdateFicheData): Result<Plan, DomainError> {
    const ficheIndex = this.fiches.findIndex(f => f.id === ficheId);
    if (ficheIndex === -1) {
      return failure(new FicheNotFoundError(ficheId));
    }
    
    const currentFiche = this.fiches[ficheIndex];
    
    // Règle métier : impossible de modifier une fiche si le plan est archivé
    if (this.statut === 'archive') {
      return failure(new CannotModifyArchivedPlanError(this.id));
    }
    
    // Règle métier : validation des transitions d'axe
    if (updates.axeId && updates.axeId !== currentFiche.axeId) {
      const targetAxe = this.axes.find(a => a.id === updates.axeId);
      if (!targetAxe) {
        return failure(new AxeNotFoundError(updates.axeId));
      }
      
      // Règle métier : impossible d'abandonner une fiche d'axe obligatoire
      if (targetAxe.type === 'OBLIGATOIRE' && updates.statut === 'abandonne') {
        return failure(new CannotAbandonMandatoryAxeFicheError(targetAxe.id));
      }
    }
    
    // Mise à jour cohérente
    const updatedFiches = [...this.fiches];
    updatedFiches[ficheIndex] = { ...currentFiche, ...updates };
    
    return success(new Plan(
        this.id,
        this.nom,
        this.type,
        this.collectiviteId,
        this.axes,
        updatedFiches,
        this.statut
      )
    };
  }
  
  // Encapsulation : gestion des dépendances internes
  removeAxe(axeId: number): Result<Plan, DomainError> {
    const axeIndex = this.axes.findIndex(a => a.id === axeId);
    if (axeIndex === -1) {
      return failure(new AxeNotFoundError(axeId));
    }
    
    // Gestion des dépendances : réassignation automatique des fiches
    const dependentFiches = this.fiches.filter(f => f.axeId === axeId);
    const defaultAxe = this.axes.find(a => a.type === 'DEFAULT');
    
    if (dependentFiches.length > 0 && !defaultAxe) {
      return failure(new CannotRemoveAxeWithoutDefaultError(axeId));
    }
    
    // Réassignation automatique
    const updatedFiches = this.fiches.map(fiche => 
      fiche.axeId === axeId 
        ? { ...fiche, axeId: defaultAxe!.id }
        : fiche
    );
    
    const updatedAxes = this.axes.filter(a => a.id !== axeId);
    
    return success(new Plan(
        this.id,
        this.nom,
        this.type,
        this.collectiviteId,
        updatedAxes,
        updatedFiches,
        this.statut
      )
    };
  }
}

// Domain Service simplifié - plus de connaissances cross-domaines
@Injectable()
export class PlanDomainService {
  
  async updateFiche(
    planId: number,
    ficheId: number,
    updates: UpdateFicheData,
    tx?: Transaction
  ): Promise<Result<Plan, DomainError>> {
    // Récupération de l'agrégat complet
    const planResult = await this.planRepository.findById(planId, tx);
    if (!planResult.success) {
      return planResult;
    }
    
    const plan = planResult.value;
    if (!plan) {
      return failure(new PlanNotFound(planId));
    }
    
    // Délégation à l'agrégat pour toute la logique métier
    const updatedPlanResult = plan.updateFiche(ficheId, updates);
    if (!updatedPlanResult.success) {
      return updatedPlanResult;
    }
    
    // Sauvegarde atomique
    const savedPlanResult = await this.planRepository.save(updatedPlanResult.value, tx);
    if (!savedPlanResult.success) {
      return savedPlanResult;
    }
    
    return savedPlanResult;
  }
}
```

### **🔴 RED FLAG #5 : Pas d'Opérations Indépendantes**

```typescript
// PROBLÈME : Aucune opération ne peut être faite de manière isolée
@Injectable()
export class AxeDomainService {
  
  // Impossible de créer un axe sans plan
  async createAxe(data: CreateAxeData) {
    // Doit toujours vérifier le plan parent
    const plan = await this.planDomainService.findById(data.planId);
    // ...
  }
  
  // Impossible de supprimer un axe sans impacter les fiches
  async deleteAxe(axeId: number) {
    // Doit toujours gérer les fiches liées
    await this.ficheApplicationService.reassignFichesFromAxe(axeId);
    // ...
  }
}

// DIAGNOSTIC : Si aucune opération ne peut être faite de manière indépendante
// → Ces objets forment un seul agrégat
```

#### **💡 SOLUTION pour Red Flag #5 : Agrégat Root Unique**

```typescript
// SOLUTION : Un seul point d'entrée via l'agrégat root
@Injectable()
export class PlanDomainService {
  
  // Toutes les opérations passent par l'agrégat root
  async createAxe(
    planId: number,
    axeData: CreateAxeData,
    tx?: Transaction
  ): Promise<Result<Plan, DomainError>> {
    // Récupération de l'agrégat complet
    const planResult = await this.planRepository.findById(planId, tx);
    if (!planResult.success) {
      return planResult;
    }
    
    const plan = planResult.value;
    if (!plan) {
      return failure(new PlanNotFound(planId));
    }
    
    // L'agrégat gère sa propre cohérence
    const updatedPlanResult = plan.addAxe(axeData);
    if (!updatedPlanResult.success) {
      return updatedPlanResult;
    }
    
    // Sauvegarde atomique
    const savedPlanResult = await this.planRepository.save(updatedPlanResult.value, tx);
    if (!savedPlanResult.success) {
      return savedPlanResult;
    }
    
    return savedPlanResult;
  }
  
  // Suppression d'axe avec gestion automatique des dépendances
  async removeAxe(
    planId: number,
    axeId: number,
    tx?: Transaction
  ): Promise<Result<Plan, DomainError>> {
    const planResult = await this.planRepository.findById(planId, tx);
    if (!planResult.success) {
      return planResult;
    }
    
    const plan = planResult.value;
    if (!plan) {
      return failure(new PlanNotFound(planId));
    }
    
    // L'agrégat gère les dépendances internes automatiquement
    const updatedPlanResult = plan.removeAxe(axeId);
    if (!updatedPlanResult.success) {
      return updatedPlanResult;
    }
    
    const savedPlanResult = await this.planRepository.save(updatedPlanResult.value, tx);
    if (!savedPlanResult.success) {
      return savedPlanResult;
    }
    
    return savedPlanResult;
  }
}

// Agrégat qui garantit la cohérence interne
export class Plan {
  
  addAxe(axeData: CreateAxeData): Result<Plan, DomainError> {
    // Validation autonome (pas besoin de vérifier d'autres services)
    if (this.axes.some(a => a.nom === axeData.nom)) {
      return failure(new DuplicateAxeError(axeData.nom));
    }
    
    // Règles métier internes
    if (this.statut === 'archive') {
      return failure(new CannotModifyArchivedPlanError(this.id));
    }
    
    const newAxe = new Axe(
      this.generateAxeId(),
      axeData.nom,
      axeData.type || 'STANDARD',
      this.axes.length + 1 // ordre automatique
    );
    
    return success(new Plan(
        this.id,
        this.nom,
        this.type,
        this.collectiviteId,
        [...this.axes, newAxe],
        this.fiches,
        this.statut
      )
    };
  }
  
  removeAxe(axeId: number): Result<Plan, DomainError> {
    const axeToRemove = this.axes.find(a => a.id === axeId);
    if (!axeToRemove) {
      return failure(new AxeNotFoundError(axeId));
    }
    
    // Gestion automatique des dépendances (plus besoin d'autres services)
    const dependentFiches = this.fiches.filter(f => f.axeId === axeId);
    const defaultAxe = this.axes.find(a => a.type === 'DEFAULT');
    
    if (dependentFiches.length > 0) {
      if (!defaultAxe) {
        return failure(new CannotRemoveAxeWithoutDefaultError(axeId));
      }
      
      // Réassignation automatique des fiches
      const reassignedFiches = this.fiches.map(fiche =>
        fiche.axeId === axeId
          ? { ...fiche, axeId: defaultAxe.id }
          : fiche
      );
      
      const remainingAxes = this.axes.filter(a => a.id !== axeId);
      
      return { 
        success: true, 
        value: new Plan(
          this.id,
          this.nom,
          this.type,
          this.collectiviteId,
          remainingAxes,
          reassignedFiches,
          this.statut
        )
      };
    }
    
    // Suppression simple si pas de dépendances
    const remainingAxes = this.axes.filter(a => a.id !== axeId);
    
    return { 
      success: true, 
      value: new Plan(
        this.id,
        this.nom,
        this.type,
        this.collectiviteId,
        remainingAxes,
        this.fiches,
        this.statut
      )
    };
  }
  
  // Opérations autonomes possibles
  canAddAxe(): boolean {
    return this.statut !== 'archive' && this.axes.length < 10; // Limite métier
  }
  
  canRemoveAxe(axeId: number): boolean {
    const axe = this.axes.find(a => a.id === axeId);
    return axe?.type !== 'OBLIGATOIRE' && this.statut !== 'archive';
  }
  
  private generateAxeId(): number {
    return Math.max(...this.axes.map(a => a.id), 0) + 1;
  }
}

// Plus de services séparés - tout passe par l'agrégat
// Pas de AxeDomainService, FicheDomainService séparés
// = Cohérence garantie, opérations atomiques, règles centralisées
```

### **À Quoi Ressemble un Application Service Bien Conçu**

```typescript
// Application Service qui coordonne des domaines vraiment indépendants
@Injectable()
export class PlanningApplicationService {
  
  async createCompletePlan(request: CreatePlanRequest) {
    
    // Autorisation (Application concern)
    await this.checkPermissions(request.collectiviteId, user);
    
    return this.db.transaction(async (tx) => {
      
      // 1. Domaine Plan : Gestion du plan d'action
      const plan = await this.planDomainService.createPlan({
        nom: request.planName,
        type: request.planType,
        collectiviteId: request.collectiviteId
      }, tx);
      
      // 2. Domaine Budget : Allocation budgétaire (vraiment indépendant)
      const budget = await this.budgetDomainService.allocateBudget({
        planId: plan.id,
        amount: request.totalBudget,
        year: request.year
      }, tx);
      
      // 3. Domaine Communication : Plan de communication (vraiment indépendant)  
      const communication = await this.communicationDomainService.createCampaign({
        planId: plan.id,
        channels: request.communicationChannels,
        timeline: request.timeline
      }, tx);
      
      // Effets de bord
      await this.eventBus.publish(new PlanCreated({ planId: plan.id }));
      
      return { plan, budget, communication };
    });
  }
}

// Chaque domaine peut évoluer indépendamment
// - Changer les règles budgétaires n'impacte pas les plans
// - Modifier la communication n'impacte pas le budget
// - Seule la coordination change quand on ajoute/retire des domaines
```

### **Autre Exemple : Service d'Analytics Cross-Domaine**

```typescript
// Service d'analytics qui agrège des données de plusieurs domaines
@Injectable()
export class TerritorialAnalyticsApplicationService {
  
  async generateCompletionReport(
    collectiviteId: number,
    period: DateRange,
    user: AuthenticatedUser
  ): Promise<Result<CompletionReportResponse, ApplicationError>> {
    
    // Autorisation
    const hasPermission = await this.permissionService.isAllowed(
      user, 'ANALYTICS.READ', collectiviteId
    );
    if (!hasPermission) {
      return failure(new Forbidden('Unauthorized'));
    }
    
    // Agrégation de données de différents domaines
    const [plansData, budgetData, indicateursData] = await Promise.all([
      // Chaque domaine expose ses propres métriques
      this.planDomainService.getCompletionMetrics(collectiviteId, period),
      this.budgetDomainService.getBudgetUtilization(collectiviteId, period),
      this.indicateurDomainService.getProgressMetrics(collectiviteId, period)
    ]);
    
    // Calculs d'analytics (logique d'application, pas de domaine)
    const globalCompletion = this.calculateGlobalCompletion(plansData, budgetData);
    const trends = this.calculateTrends(indicateursData, period);
    const recommendations = this.generateRecommendations(globalCompletion, trends);
    
    return { 
      success: true, 
      value: {
        collectiviteId,
        period,
        globalCompletion,
        trends,
        recommendations,
        details: {
          plans: plansData,
          budget: budgetData,
          indicateurs: indicateursData
        }
      }
    };
  }
  
  // Logique d'analytics (coordination, pas métier)
  private calculateGlobalCompletion(plans: PlanMetrics[], budget: BudgetMetrics): number {
    // Calcul cross-domaine pour analytics
    const planWeight = 0.6;
    const budgetWeight = 0.4;
    
    return (plans.averageCompletion * planWeight) + (budget.utilizationRate * budgetWeight);
  }
  
  private calculateTrends(indicateurs: IndicateurMetrics[], period: DateRange): TrendAnalysis {
    // Analyse de tendances (logique d'analytics, pas de domaine)
    return {
      direction: indicateurs.length > 0 ? 'improving' : 'stable',
      velocity: this.calculateVelocity(indicateurs, period),
      predictions: this.predictFutureValues(indicateurs)
    };
  }
}

// POURQUOI CETTE APPROCHE FONCTIONNE :
// - Chaque domaine reste indépendant (Plans, Budget, Indicateurs)
// - L'analytics est une préoccupation d'APPLICATION (reporting cross-domaine)
// - Les domaines exposent leurs métriques sans connaître les autres
// - L'analytics peut évoluer sans impacter les domaines métier
// - C'est de la coordination légitime, pas de la logique métier
```

### **🎯 Comment Distinguer Analytics Légitime vs Mauvais Domaines**

| **Critère** | **Analytics Légitime** | **Mauvais Découpage** |
|-------------|------------------------|------------------------|
| **Nature de la logique** | Agrégation, calculs de reporting | Règles métier, validation |
| **Dépendances** | Lecture seule des métriques | Modification des données métier |
| **Évolution** | Analytics change indépendamment | Domaines liés évoluent ensemble |
| **Expertise** | Analyste/Data, pas expert métier | Même expert métier pour tous |
| **Transactions** | Pas de transactions cross-domaine | Transactions systématiques |
| **Réutilisabilité** | Réutilisable pour différents contextes | Spécifique à un workflow |

```typescript
// ANALYTICS APPROPRIÉ
class AnalyticsService {
  // Agrège des données existantes
  async getGlobalMetrics() {
    const planMetrics = await this.planService.getMetrics();     // Lecture seule
    const budgetMetrics = await this.budgetService.getMetrics(); // Lecture seule
    return this.aggregateMetrics(planMetrics, budgetMetrics);    // Calcul d'analytics
  }
}

// DÉCOUPAGE PROBLÉMATIQUE
class PlanApplicationService {
  // Modifie toujours les mêmes objets ensemble
  async createPlan() {
    const plan = await this.planService.create();     // Toujours
    const axes = await this.axeService.create();      // Toujours  
    const fiches = await this.ficheService.create();  // Toujours
    // = Même domaine métier
  }
}
```

### **🎯 Test de Validation des Domaines**

**Posez-vous ces questions :**

1. **"Puis-je faire évoluer ce domaine sans toucher aux autres ?"**
   - Oui → Domaines bien séparés
   - Non → Probablement même domaine

2. **"Mes Application Services font-ils principalement de la coordination ?"**
   - Oui → Domaines bien séparés
   - Non, ils contiennent de la logique métier → Frontières à revoir

3. **"Ai-je des experts métier différents pour chaque domaine ?"**
   - Oui → Domaines bien séparés
   - Non, même expert → Probablement même domaine

4. **"Mes transactions sont-elles principalement intra-domaine ?"**
   - Oui → Domaines bien séparés
   - Non, toujours cross-domaine → Frontières à revoir
