# 11. Architecture de Services Domain-Driven Design

Date: 2025-09-04

## Statut

Proposé

## Contexte

L'architecture backend actuelle a évolué de manière organique, conduisant à des services avec des responsabilités mélangées et des frontières peu claires :

1. **Responsabilités mélangées** : Les services gèrent l'autorisation, la logique métier, l'accès aux données et les préoccupations de présentation dans la même classe
2. **Services monolithiques** : Gros services (certains avec plusieurs centaines de lignes) qui gèrent plusieurs opérations non liées
3. **Frontières floues** : Pas de séparation claire entre la coordination applicative et la logique métier du domaine
4. **Difficultés de test** : Services complexes difficiles à tester unitairement à cause des dépendances mélangées
5. **Problèmes de maintenabilité** : Règles métier éparpillées dans les services rendant les modifications risquées

## Proposition

Adoption d'une **architecture de services à deux couches** suivant en partie les principes Domain-Driven Design :

### Couches d'Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                SERVICES DE COORDINATION                    │
│  • Autorisation et Permissions                            │
│  • Validation et Transformation des Entrées               │
│  • Cache et Optimisation des Performances                 │
│  • Publication d'Événements et Notifications              │
│  • Coordination des Transactions                          │
│  • Cross-cutting Concerns                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   SERVICES MÉTIER                          │
│  • Logique Métier et Règles du Domaine                    │
│  • Coordination des Objets Métier                        │
│  • Calculs Métier Complexes                               │
│  • Opérations Spécifiques au Domaine                      │
│  • Workflows Métier Purs                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│        ENTITIES, OBJETS MÉTIER COMPOSÉS & REPOSITORIES     │
│  • Rich Domain Models avec Comportement Métier           │
│  • Repository Interfaces et Implémentations              │
│  • Événements Métier et Objets de Valeur                        │
└─────────────────────────────────────────────────────────────┘
```

### Responsabilités des Services

#### Services de Coordination
- **Coordination** : Orchestrer les Services Métier et les cross-cutting concerns
- **Autorisation** : Vérifier les permissions utilisateur avant les opérations
- **Validation** : Validation des entrées avec les schémas Zod
- **Transactions** : Coordonner les transactions de base de données entre opérations
- **Cache** : Implémenter les optimisations de performance
- **Événements** : Publier les événements de domaine et gérer les notifications

#### Services Métier
- **Logique Métier** : Implémenter les règles métier complexes et les calculs
- **Coordination Métier** : Orchestrer les Entities et les Objets de Valeur
- **Opérations Pures** : Opérations métier sans état et sans effets de bord
- **Règles de Domaine** : Faire respecter les invariants métier et les contraintes

### Règles de Dépendances des Services

#### Services Métier - Dépendances Autorisées

**✅ AUTORISÉ :**
- Repositories du même domaine
- Autres Services Métier du même domaine métier
- Domain Entities et Objets de Valeur

**❌ INTERDIT :**
- Services d'autres domaines (Fiches, Auth, Collectivités)
- Services d'infrastructure (Cache, Email, Events)
- Services externes (HTTP, Notifications)

**Exemples pour le domaine Plans :**
- ✅ `PlanValidationService`, `PlanCalculationService`, `PlanTemplateService`
- ✅ `PlanRepository`, `AxeRepository`
- ❌ `FicheService`, `PermissionService`, `EmailService`

#### Services de Coordination - Orchestration

**Responsabilités :**
- Coordonner plusieurs Services Métier
- Gérer les dépendances externes et l'infrastructure
- Autorisation et cross-cutting concerns

**Règle fondamentale :** 
- **Service Métier** = Logique métier pure, dépendances limitées au domaine
- **Service de Coordination** = Coordination, autorisation, infrastructure

### Matrice de Décision des Couches de Service

Utilisez cette matrice pour déterminer si une fonctionnalité appartient à un Service de Coordination ou un Service Métier :

| Concern | Service de Coordination | Service Métier |
|---------|-------------------|----------------|
| **Autorisation et Permissions** | ✅ Toujours | ❌ Jamais |
| **Cross-domain Coordination** | ✅ Toujours | ❌ Jamais |
| **Gestion des Transactions** | ✅ Workflows complexes | ⚠️ Domaine unique seulement |
| **Règles Métier et Validation** | ❌ Jamais | ✅ Toujours |
| **Calculs de Domaine** | ❌ Jamais | ✅ Toujours |
| **Transformation de Données** | ⚠️ Cross-domain seulement | ✅ Spécifique au domaine |
| **Appels de Services Externes** | ✅ Orchestration | ❌ Jamais |
| **Cache** | ✅ Cross-cutting | ❌ Jamais |
| **Publication d'Événements** | ✅ Toujours | ❌ Jamais |
| **Validation des Entrées** | ✅ Frontière API | ✅ Règles métier |
| **Gestion d'Erreurs** | ✅ Erreurs de coordination | ✅ Erreurs de domaine |

**Règles de Décision :**
- **Si ça touche plusieurs domaines** → Service de Coordination
- **Si c'est de la logique métier pure** → Service Métier  
- **Si ça nécessite des dépendances externes** → Service de Coordination
- **Si c'est un calcul de domaine** → Service Métier

### Directives de Granularité des Services

#### Séparer les Services Quand :
- ✅ **Domaines métier différents** (Plans vs Fiches vs Indicateurs)
- ✅ **Caractéristiques de performance différentes** (CRUD vs Analytics)
- ✅ **Patterns de montée en charge différents** (Lecture intensive vs Écriture intensive)
- ✅ **Besoins d'optimisation différents** (Stratégies de cache, patterns d'accès base de données)
- ✅ **Opérations inter-entités** qui n'appartiennent pas à un seul Objet Métier Composé

#### Service Unique Quand :
- ✅ **Opérations CRUD liées** sur la même Entity
- ✅ **Logique métier simple** qui ne nécessite pas d'orchestration
- ✅ **Caractéristiques de performance et montée en charge similaires**

### Gestion d'Erreurs avec le Pattern Result

Nous adoptons le **pattern Result** pour gérer les erreurs explicitement et éviter de lever des exceptions :

```typescript
// ✅ Type Result pour la gestion explicite d'erreurs
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const Result = {
  success: <T>(data: T): Result<T, never> => ({ success: true, data }),
  failure: <E>(error: E): Result<never, E> => ({ success: false, error })
};

// ✅ Erreurs de domaine avec contexte
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ApplicationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}
```

**Avantages :**
- **Gestion d'erreurs explicite** : Force  à gérer les erreurs au moment de la compilation
- **Meilleur débogage** : Les erreurs contiennent du contexte et des codes pour faciliter le dépannage
- **Pas d'exceptions inattendues** : Flux d'erreur prévisible dans toute l'application
- **Sécurité de type** : TypeScript s'assure que tous les chemins d'erreur sont gérés

### Objets Métier & Objets Métier Composés

#### Objets métiers

Les object métiers sont définis par un schéma Zod et leur type est inféré de ce schéma. 
Pour garantir la centralisation des règles métier, un objet `XXXXOperations` peut être créer pour porter ces mêmes règles.


Exemple: 

```typescript
import { z } from 'zod';

// ✅ Schémas de domaine définissent structure et validation
const planSchema = z.object({
  id: z.number().positive(),
  nom: z.string().min(1).max(255).transform(s => s.trim()),
  collectiviteId: z.number().positive(),
  type: z.enum(['PAT', 'PCAET', 'AUTRE']).nullable(),
  statut: z.enum(['brouillon', 'en_cours', 'valide', 'archive']),
  createdAt: z.date(),
  createdBy: z.string().uuid(),
  referents: z.array(z.object({
    userId: z.string().uuid(),
    nom: z.string().min(1),
    role: z.enum(['pilote', 'contributeur'])
  })).max(10)
});

const ficheSchema = z.object({
  id: z.number().positive(),
  planId: z.number().positive(),
  titre: z.string().min(1).max(255),
  statut: z.enum(['brouillon', 'en_cours', 'realise', 'abandonne']),
  priorite: z.enum(['basse', 'moyenne', 'haute']).nullable(),
  dateDebut: z.date().nullable(),
  dateFin: z.date().nullable(),
  budget: z.number().min(0).nullable()
});

// ✅ Types dérivés des schémas
export type Plan = z.infer<typeof planSchema>;
export type Fiche = z.infer<typeof ficheSchema>;
export type CreatePlanData = z.input<typeof planSchema>;

// ✅ Fonctions pures pour les opérations de domaine
export const PlanOperations = {
  // Fonction factory avec validation
  create: (input: CreatePlanData): Result<Plan, DomainError> => {
    const validation = planSchema.safeParse(input);
    if (!validation.success) {
      return Result.failure(new DomainError(
        'VALIDATION_ERROR',
        'Données de plan invalides',
        { issues: validation.error.issues }
      ));
    }
    return Result.success(validation.data);
  },

  // Règle métier par exemple: Ajouter un référent avec validation
  addReferent: (plan: Plan, referent: { userId: string; nom: string; role: string }): Result<Plan, DomainError> => {
    if (plan.referents.length >= 10) {
      return Result.failure(new DomainError(
        'MAX_REFERENTS_EXCEEDED',
        'Impossible d\'ajouter plus de 10 référents à un plan'
      ));
    }

    if (plan.referents.some(r => r.userId === referent.userId)) {
      return Result.failure(new DomainError(
        'REFERENT_ALREADY_EXISTS',
        'L\'utilisateur est déjà référent sur ce plan'
      ));
    }

    return Result.success({
      ...plan,
      referents: [...plan.referents, referent]
    });
  },

  // Règle métier : Seuls les plans validés peuvent être archivés
  archive: (plan: Plan): Result<Plan, DomainError> => {
    if (plan.statut !== 'valide') {
      return Result.failure(new DomainError(
        'INVALID_STATUS_TRANSITION',
        'Seuls les plans validés peuvent être archivés'
      ));
    }

    return Result.success({
      ...plan,
      statut: 'archive' as const
    });
  },

  // autres règles métiers ici
};

```

#### Objets métiers composés

Un objet métier composé est la composition de différents objets métier (dont certains n'ont pas vraiment de sens par eux-mêmes)

Ex: un `planAggregate`peut être vu comme la composition d'un plan (un axe de niveau 0), de référents, de pilotes et de fiches.

```typescript
 // ✅ Composition d'Objet Métier Composé root
export const PlanAggregate = {
  // Charger l'Objet Métier Composé complet avec validation
  create: (planData: Plan, fichesData: Fiche[]): Result<{plan: Plan, fiches: Fiche[]}, DomainError> => {
    const validationResult = PlanOperations.validatePlanAggregate(planData, fichesData);
    if (!validationResult.success) return validationResult;

    return Result.success({
      plan: planData,
      fiches: fichesData
    });
  },

  // Opérations métier d'Objet Métier Composé
  addFiche: (aggregate: {plan: Plan, fiches: Fiche[]}, ficheData: CreateFicheData): Result<{plan: Plan, fiches: Fiche[]}, DomainError> => {
    const ficheResult = FicheOperations.create({ ...ficheData, planId: aggregate.plan.id });
    if (!ficheResult.success) return ficheResult;

    return Result.success({
      plan: aggregate.plan,
      fiches: [...aggregate.fiches, ficheResult.data]
    });
  }
};
```


### Patterns d'Implémentation

#### Service de Domaine avec Entités Fonctionnelles
```typescript
// ✅ Utilisation de Domain Entities (voir section Objets Métier ci-dessus)
import { PlanOperations, PlanAggregate } from './entities/plan.entity';
```

#### Pattern de Service Métier
```typescript
@Injectable()
export class PlanServiceMetier {
  constructor(
    @Inject('PlansRepositoryInterface')
    private readonly plansRepository: PlansRepositoryInterface
  ) {}

  async createPlanWithInitialStructure(
    planData: CreatePlanData,
    tx?: Transaction
  ): Promise<Result<Plan, DomainError>> {
    // ✅ Utiliser les opérations de domaine fonctionnelles
    const planResult = PlanOperations.create(planData);
    if (!planResult.success) return planResult;
    
    // ✅ Appliquer les règles métier avec des fonctions pures
    const validationResult = this.applyCreationBusinessRules(planResult.data);
    if (!validationResult.success) return validationResult;
    
    // ✅ Persister avec gestion d'erreurs explicite
    try {
      const savedPlan = await this.plansRepository.save(planResult.data, tx);
      return Result.success(savedPlan);
    } catch (error) {
      return Result.failure(new DomainError(
        'PERSISTENCE_ERROR',
        'Échec de sauvegarde du plan',
        { originalError: error }
      ));
    }
  }

  async getCompletePlanAggregate(
    planId: number,
    tx?: Transaction
  ): Promise<Result<{plan: Plan, fiches: Fiche[]}, DomainError>> {
    try {
      const plan = await this.plansRepository.findById(planId, tx);
      if (!plan) {
        return Result.failure(new DomainError('NOT_FOUND', 'Plan non trouvé'));
      }

      const fiches = await this.fichesRepository.findByPlanId(planId, tx);
      
      // ✅ Utiliser la composition d'agrégat avec validation
      return PlanAggregate.create(plan, fiches);
    } catch (error) {
      return Result.failure(new DomainError(
        'REPOSITORY_ERROR',
        'Échec de chargement de l\'agrégat plan',
        { planId, originalError: error }
      ));
    }
  }

  private applyCreationBusinessRules(plan: Plan): Result<Plan, DomainError> {
    // Règle métier : Les plans doivent avoir au moins un référent
    if (plan.referents.length === 0) {
      return Result.failure(new DomainError(
        'MISSING_REFERENTS',
        'Les plans doivent avoir au moins un référent'
      ));
    }

    // Règle métier : Les plans PCAET nécessitent une validation spécifique
    if (plan.type === 'PCAET' && !this.validatePCAETRequirements(plan)) {
      return Result.failure(new DomainError(
        'PCAET_VALIDATION_FAILED',
        'Les plans PCAET doivent respecter des exigences spécifiques'
      ));
    }

    return Result.success(plan);
  }
}
```

#### Pattern d'Service de Coordination
```typescript
@Injectable()
export class PlanServiceCoordination {
  constructor(
    private readonly planServiceMetier: PlanDomainService,
    private readonly permissionService: PermissionService,
    private readonly cacheService: CacheService,
    private readonly eventBus: EventBus,
    private readonly databaseService: DatabaseService
  ) {}

  async createPlan(
    request: CreatePlanRequest,
    user: AuthenticatedUser
  ): Promise<Result<PlanResponse, ApplicationError>> {
    
    // ✅ Vérification d'autorisation avec gestion d'erreurs explicite
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.CREATION'],
      ResourceType.COLLECTIVITE,
      request.collectiviteId
    );
    
    if (!hasPermission) {
      return Result.failure(new ApplicationError(
        'UNAUTHORIZED',
        'L\'utilisateur n\'a pas la permission de créer des plans pour cette collectivité'
      ));
    }

    // ✅ Déléguer au service de domaine avec propagation d'erreurs
    const domainResult = await this.planServiceMetier.createPlanWithInitialStructure({
      ...request,
      createdBy: user.id,
      createdAt: new Date()
    });

    if (!domainResult.success) {
      // ✅ Convertir les erreurs de domaine en erreurs d'application
      return Result.failure(new ApplicationError(
        domainResult.error.code,
        domainResult.error.message,
        { originalError: domainResult.error }
      ));
    }

    // ✅ Gérer les préoccupations transversales avec gestion d'erreurs
    try {
      await Promise.all([
        this.cacheService.invalidate(`plans:${request.collectiviteId}`),
        this.eventBus.publish(new PlanCreatedEvent({
          planId: domainResult.data.id,
          collectiviteId: domainResult.data.collectiviteId,
          createdBy: user.id
        }))
      ]);
    } catch (error) {
      // ✅ Logger les erreurs d'effets de bord mais ne pas faire échouer l'opération
      console.error('Échec de gestion des effets de bord de création de plan:', error);
    }

    return Result.success(this.toPlanResponse(domainResult.data));
  }

  async getCompletePlanAggregate(
    planId: number,
    user: AuthenticatedUser
  ): Promise<Result<PlanAggregateResponse, ApplicationError>> {
    
    // ✅ Autorisation pour les opérations de lecture
    const hasPermission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.READ'],
      ResourceType.PLAN,
      planId
    );
    
    if (!hasPermission) {
      return Result.failure(new ApplicationError('UNAUTHORIZED', 'Accès refusé'));
    }

    // ✅ Essayer le cache d'abord
    const cacheKey = `plan-aggregate:${planId}`;
    const cachedResult = await this.cacheService.get(cacheKey);
    if (cachedResult) {
      return Result.success(cachedResult);
    }

    // ✅ Déléguer au service de domaine
    const domainResult = await this.planServiceMetier.getCompletePlanAggregate(planId);
    
    if (!domainResult.success) {
      return Result.failure(new ApplicationError(
        domainResult.error.code,
        domainResult.error.message
      ));
    }

    const response = this.toPlanAggregateResponse(domainResult.data);
    
    // ✅ Cache avec gestion d'erreurs
    try {
      await this.cacheService.set(cacheKey, response, { ttl: 300 }); // 5 minutes
    } catch (error) {
      console.error('Échec de mise en cache de l\'agrégat plan:', error);
      // Ne pas faire échouer l'opération pour les erreurs de cache
    }

    return Result.success(response);
  }

  private toPlanResponse(plan: Plan): PlanResponse {
    return {
      id: plan.id,
      nom: plan.nom,
      type: plan.type,
      statut: plan.statut,
      collectiviteId: plan.collectiviteId,
      referents: plan.referents,
      createdAt: plan.createdAt.toISOString()
    };
  }

  private toPlanAggregateResponse(aggregate: {plan: Plan, fiches: Fiche[]}): PlanAggregateResponse {
    return {
      plan: this.toPlanResponse(aggregate.plan),
      fiches: aggregate.fiches.map(f => ({
        id: f.id,
        titre: f.titre,
        statut: f.statut,
        priorite: f.priorite
      })),
      completion: PlanOperations.calculateCompletion(aggregate.plan, aggregate.fiches)
    };
  }
}
```
## Conséquences de cette architecture

### Positives

1. **Séparation Claire des Préoccupations** : Chaque couche de service a des responsabilités bien définies
2. **Testabilité Améliorée** : La logique de domaine peut être testée unitairement sans dépendances d'infrastructure
3. **Meilleure Maintenabilité** : Règles métier centralisées dans les services de domaine
5. **Adoption Graduelle** : Peut être implémentée de manière incrémentale sans casser le code existant
6. **Sécurité de Type** : Zod fournit validation runtime avec types compile-time

### Négatives

1. **Plus de Fichiers** : Classes de service supplémentaires à maintenir
4. **Complexité de Coordination** : Les services applicatifs doivent coordonner plusieurs services de domaine

## Exemples

### Organisation des Services

```
src/plans/
├── plan/
│   ├── domain/
│   │   ├── plan.aggregate.ts
│   │   ├── plan.entity.ts
│   │   ├── plan-domain.service.ts
│   │   ├── plan-validation.service.ts
│   │   ├── plan.repository.interface.ts
│   │   └── plan.events.ts
│   ├── application/
│   │   └── plan-application.service.ts
│   ├── infrastructure/
│   │   ├── plan.repository.impl.ts
│   │   └── plan.adapter.ts
│   └── presentation/
│       ├── plan.router.ts
│       └── plan.schemas.ts
├── fiche/
│   ├── domain/
│   │   ├── fiche.aggregate.ts
│   │   ├── fiche.entity.ts
│   │   ├── fiche-domain.service.ts
│   │   ├── fiche.repository.interface.ts
│   │   └── fiche.events.ts
│   ├── application/
│   │   └── fiche-application.service.ts
│   ├── infrastructure/
│   │   ├── fiche.repository.impl.ts
│   │   └── fiche.adapter.ts
│   └── presentation/
│       ├── fiche.router.ts
│       ├── fiche.schemas.ts
│       ├── fiche-analytics.router.ts    // ✅ Analytics colocalisé
│       └── analytics.schemas.ts
├── axe/
│   ├── domain/
│   │   ├── axe.entity.ts
│   │   ├── axe-domain.service.ts
│   │   └── axe.repository.interface.ts
│   └── infrastructure/
│       └── axe.repository.impl.ts
├── shared/
│   ├── domain/
│   │   ├── value-objects/
│   │   └── errors/
│   └── infrastructure/
│       └── database/
└── presentation/
    └── index.ts                         // ✅ Composition globale des routeurs
```

### Intégration avec les Routeurs

La nouvelle architecture de services s'intègre parfaitement avec le pattern de routeur tRPC existant :

```typescript
// ✅ Schémas de requête/réponse avec validation Zod
const createPlanRequestSchema = z.object({
  collectiviteId: z.number().positive(),
  nom: z.string().min(1).max(255),
  type: z.enum(['PAT', 'PCAET', 'AUTRE']).optional(),
  referents: z.array(z.object({
    userId: z.string().uuid(),
    nom: z.string().min(1)
  })).optional()
});

const listPlansRequestSchema = z.object({
  collectiviteId: z.number().positive(),
  filters: z.object({
    type: z.enum(['PAT', 'PCAET', 'AUTRE']).optional(),
    searchTerm: z.string().min(1).optional(),
    hasReferents: z.boolean().optional()
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
  }).optional()
});

// ✅ Le routeur délègue au service applicatif
@Injectable()
export class PlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly planServiceCoordination: PlanApplicationService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createPlanRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.planServiceCoordination.createPlan(input, ctx.user);
        
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error.message
          });
        }
        
        return result.data;
      }),

    list: this.trpc.authedProcedure
      .input(listPlansRequestSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.planServiceCoordination.listPlans(
          input.collectiviteId,
          input.filters || {},
          input.pagination || { page: 1, limit: 20 },
          ctx.user
        );
        
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST', 
            message: result.error.message
          });
        }
        
        return result.data;
      }),

    getById: this.trpc.authedProcedure
      .input(z.object({ 
        planId: z.number().positive(),
        includeDetails: z.boolean().default(false)
      }))
      .query(async ({ input, ctx }) => {
        // Choisir la méthode de service appropriée selon les besoins
        const result = input.includeDetails
          ? await this.planServiceCoordination.getCompletePlanAggregate(input.planId, ctx.user)
          : await this.planServiceCoordination.getBasicPlan(input.planId, ctx.user);
        
        if (!result.success) {
          throw new TRPCError({
            code: result.error.code === 'NOT_FOUND' ? 'NOT_FOUND' : 'BAD_REQUEST',
            message: result.error.message
          });
        }
        
        return result.data;
      }),

    update: this.trpc.authedProcedure
      .input(z.object({
        planId: z.number().positive(),
        updates: z.object({
          nom: z.string().min(1).max(255).optional(),
          type: z.enum(['PAT', 'PCAET', 'AUTRE']).optional(),
          newReferents: z.array(z.object({
            userId: z.string().uuid(),
            nom: z.string().min(1)
          })).optional()
        })
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await this.planServiceCoordination.updatePlan(
          input.planId,
          input.updates,
          ctx.user
        );
        
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error.message
          });
        }
        
        return result.data;
      }),

    // ✅ Opérations complexes avec intention métier claire
    submitForApproval: this.trpc.authedProcedure
      .input(z.object({ planId: z.number().positive() }))
      .mutation(async ({ input, ctx }) => {
        const result = await this.planServiceCoordination.submitForApproval(
          input.planId,
          ctx.user
        );
        
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error.message
          });
        }
        
        return result.data;
      })
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}

// ✅ Routeur d'analytique utilisant un service séparé
@Injectable()
export class FicheAnalyticsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly ficheAnalyticsService: FicheAnalyticsApplicationService
  ) {}

  router = this.trpc.router({
    countBy: this.trpc.authedProcedure
      .input(z.object({
        collectiviteId: z.number().positive(),
        property: z.enum(['statut', 'priorite', 'dateDebut', 'dateFin', 'cibles']),
        filters: z.object({
          planIds: z.array(z.number()).optional(),
          statutIds: z.array(z.string()).optional(),
          searchTerm: z.string().optional()
        }).optional()
      }))
      .query(async ({ input, ctx }) => {
        const result = await this.ficheAnalyticsService.countByProperty(
          input,
          ctx.user
        );
        
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error.message
          });
        }
        
        return result.data;
      })
  });
}

// ✅ Composition du routeur principal (pattern inchangé)
@Injectable()
export class PlansMainRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly planRouter: PlanRouter,
    private readonly ficheAnalyticsRouter: FicheAnalyticsRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.planRouter.router,
    this.ficheAnalyticsRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
```

#### Avantages des Routeurs avec la Nouvelle Architecture

1. **Separation of Concerns** : Les routeurs ne gèrent que les préoccupations HTTP/tRPC, délèguent la logique métier aux Services de Coordination
2. **Gestion d'Erreurs Cohérente** : Les Services de Coordination retournent des types Result structurés, les routeurs convertissent en erreurs tRPC
3. **Validation des Entrées** : Schémas Zod au niveau routeur pour les contrats d'API, validation de domaine dans les services
4. **Sécurité de Type** : Sécurité de type bout-en-bout de l'entrée du routeur aux Domain Entities
5. **Testabilité** : Les routeurs deviennent des adaptateurs fins, facile de tester les Services de Coordination indépendamment

### Gestion des Transactions

La propriété des transactions suit la hiérarchie des services :

#### Niveau Service de Coordination
- **Possède les transactions inter-domaines** qui couvrent plusieurs Services Métier
- **Coordonne les workflows complexes** nécessitant plusieurs opérations
- **Gère les effets de bord** comme événements, notifications et logging d'audit

```typescript
@Injectable()
export class PlanServiceCoordination {
  async createPlanWithInitialFiches(request: CreatePlanWithFichesRequest): Promise<Result<PlanWithFiches>> {
    return this.databaseService.db.transaction(async (tx) => {
      // Coordination inter-domaines
      const planResult = await this.planServiceMetier.createPlan(request.planData, tx);
      const fichesResult = await this.ficheDomainService.createInitialFiches(planResult.data.id, request.fiches, tx);
      
      // Effets de bord
      await this.auditService.logPlanCreation(planResult.data.id, tx);
      
      return { plan: planResult.data, fiches: fichesResult.data };
    });
  }
}
```

#### Niveau Service Métier
- **Possède les transactions domaine unique** pour les opérations métier complexes
- **Accepte un paramètre transaction optionnel** pour participer aux transactions plus larges
- **Maintient l'intégrité de la logique métier** dans les frontières du domaine

```typescript
@Injectable()
export class PlanServiceMetier {
  async createPlanWithHierarchy(planData: CreatePlanData, tx?: Transaction): Promise<Result<Plan>> {
    const executeOperation = async (transaction: Transaction) => {
      const plan = await this.plansRepository.save(Plan.create(planData), transaction);
      await this.createAxesHierarchy(plan.id, planData.hierarchy, transaction);
      return plan;
    };
    
    return tx ? executeOperation(tx) : this.databaseService.db.transaction(executeOperation);
  }
}
```

#### Niveau Repository
- **Accepte les transactions** mais n'en crée jamais
- **Fournit des opérations de données atomiques** dans les transactions existantes
- **Maintient la cohérence des données** au niveau de la persistance

## Pattern Adapter pour Repository

### Problématique

Les Repositories doivent convertir les données entre le format base de données et les objets Domain (logique métier, validation, mapping de valeurs). Le **Pattern Adapter** isole cette responsabilité de transformation.

### Implémentation Simple

```typescript
// ✅ Interface Adapter générique
interface Adapter<TDb, TDomain> {
  toDomain: (dbData: unknown) => Result<TDomain, AdapterError>;
  toDb: (domainData: TDomain) => Result<TDb, AdapterError>;
}

// ✅ Adapter avec Drizzle → Zod
import { createSelectSchema } from 'drizzle-zod';

const planAdapter: Adapter<PlanDbRow, Plan> = {
  
  toDomain: (dbData: unknown): Result<Plan, AdapterError> => {
    try {
      // Validation avec schema Drizzle → Zod
      const validatedDbData = createSelectSchema(plansTable).parse(dbData);
      
      // Mapping DB → Domain (Drizzle fait déjà camelCase conversion)
      const mappedData = {
        id: validatedDbData.planId,
        nom: validatedDbData.planName,
        collectiviteId: validatedDbData.collectiviteId,
        statut: mapDbStatusToDomain(validatedDbData.statusCode),
        createdAt: validatedDbData.createdAt,
        createdBy: validatedDbData.createdByUserId
      };
      
      // Validation Domain
      const validatedDomainData = planDomainSchema.parse(mappedData);
      return Result.success(validatedDomainData);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Result.failure(new AdapterError('VALIDATION_ERROR', 'Invalid data format'));
      }
      return Result.failure(new AdapterError('TRANSFORMATION_ERROR', 'Mapping failed'));
    }
  },

  toDb: (domainData: Plan): Result<PlanDbRow, AdapterError> => {
    try {
      // Validation Domain
      const validatedDomainData = planDomainSchema.parse(domainData);
      
      // Mapping Domain → DB (Drizzle fait déjà snake_case conversion)
      const mappedData = {
        planId: validatedDomainData.id,
        planName: validatedDomainData.nom,
        collectiviteId: validatedDomainData.collectiviteId,
        statusCode: mapDomainStatusToDb(validatedDomainData.statut),
        createdAt: validatedDomainData.createdAt,
        createdByUserId: validatedDomainData.createdBy
      };
      
      return Result.success(mappedData);
      
    } catch (error) {
      return Result.failure(new AdapterError('VALIDATION_ERROR', 'Invalid domain object'));
    }
  }
};

// ✅ Usage dans Repository
export const createPlansRepository = (db: DatabaseService): PlansRepositoryInterface => ({
  
  async findById(id: number): Promise<Result<Plan, RepositoryError>> {
    try {
      const dbRow = await db.select().from('plans').where('plan_id', id).first();
      if (!dbRow) return Result.failure(new RepositoryError('NOT_FOUND', 'Plan not found'));
      
      return planAdapter.toDomain(dbRow);
    } catch (error) {
      return Result.failure(new RepositoryError('DATABASE_ERROR', 'Query failed'));
    }
  },

  async save(plan: Plan): Promise<Result<Plan, RepositoryError>> {
    const dbDataResult = planAdapter.toDb(plan);
    if (!dbDataResult.success) return dbDataResult;

    try {
      const savedRow = await db.insert(dbDataResult.data).into('plans').returning('*');
      return planAdapter.toDomain(savedRow[0]);
    } catch (error) {
      return Result.failure(new RepositoryError('PERSISTENCE_ERROR', 'Save failed'));
    }
  }
});
```

### Avantages

- **Isolation** : Séparation claire entre format DB et Domain
- **Type Safety** : Validation Zod à chaque conversion  
- **Mapping Métier** : Conversion de valeurs (statuts, énums, calculs)
- **Réutilisabilité** : Pattern consistant pour tous les Repository
- **Maintenance** : Changement de mapping centralisé
- **Testabilité** : Adapter testable indépendamment

## Stratégie de test

### Objectifs

Tout code backend doit être livré sur main avec ses tests associés pour:

- Assurer la justesse et la stabilité des règles métier
- Garantir l'orchestration correcte (autorisations, transactions, cache, événements)
- Offrir un feedback rapide (unitaires) et une confiance élevée (intégration/e2e)

### Pyramide (recommandée)

- **Unitaires (majoritaires)**: objets métier, services métier, adapters purs
- **Intégration**: services d'application/coordination (avec mocks ciblés), routeurs
- **E2E/DB**: repositories réels, parcours critiques bout-à-bout

### Lignes directrices par couche

#### Domaine (priorité élevée – tests unitaires)

- Tester les opérations sur les objets métiers, agrégats, validations Zod, invariants et transitions.
- Couvrir cas heureux/erreurs via `Result`, avec cas limites (tailles max, doublons, nullables...).

```typescript
import { describe, it, expect } from 'vitest';

type Result<T, E> = { success: true; value: T } | { success: false; error: E };
type PlanStatus = 'brouillon' | 'valide' | 'archive';

type Plan = {
  id: number;
  status: PlanStatus;
  archivedAt: Date | null;
};

type ArchiveError = { code: 'INVALID_STATUS_TRANSITION' };

function archivePlan(plan: Plan): Result<Plan, ArchiveError> {
  if (plan.status !== 'valide') {
    return { success: false, error: { code: 'INVALID_STATUS_TRANSITION' } };
  }
  return {
    success: true,
    value: { ...plan, status: 'archive', archivedAt: new Date(0) }, 
  };
}

describe('Domain: archivePlan', () => {
  it("refuse si le statut n'est pas 'valide'", () => {
    const input: Plan = { id: 1, status: 'brouillon', archivedAt: null };
    const res = archivePlan(input);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it("archive un plan valide et fige la date d'archivage", () => {
    const input: Plan = { id: 2, status: 'valide', archivedAt: null };
    const res = archivePlan(input);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.value.status).toBe('archive');
      expect(res.value.archivedAt?.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    }
  });
});
```

#### Application/coordination (tests d'orchestration avec mocks)

- Mocker: permissions, cache, bus d'événements, services métier, DB/transactions.
- Asserter: ordre d'appels, propagation d'erreurs (Domain → Application), invalidation cache, payloads d'événements.

```typescript
import { vi, describe, it, expect } from 'vitest';

// Exemple d'orchestration: permission d'écriture plan, vérification des fiches liées,
// puis création du plan en DB avec publication d'un événement.
// NB: on teste l'orchestration (ordre d'appels, propagation erreurs, mapping),
// pas la logique métier interne des composants mockés.


describe('PlanServiceCoordination.createPlan', () => {
  it('refuse si permission manquante; sinon vérifie fiches et crée le plan', async () => {
    const permissionService = { can: vi.fn() };
    const ficheService = { getManyByIds: vi.fn() };
    const planRepo = { insert: vi.fn() };

    const svc = makePlanServiceCoordination({ permissionService, ficheService, planRepo  });

    // 1) Cas interdit
    permissionService.can.mockResolvedValueOnce(false);
    const denied = await svc.createPlan({ collectiviteId: 1, nom: 'Plan A', ficheIds: [10, 20] }, { id: 'u1' });
    expect(denied).toEqual({ success: false, error: { code: 'FORBIDDEN' } });
    expect(ficheService.getManyByIds).not.toHaveBeenCalled();
    expect(planRepo.insert).not.toHaveBeenCalled();

    // 2) Cas autorisé mais fiches invalides
    // ...
    // 3) Happy path
    // ...
});
```

#### Repositories/Adapters (intégration/e2e avec DB réelle)

- Lancer une base isolée sur lequel on va tester les vraies requêtes en DB pour vérifier le bon fonctionnement des repositories.

- Tests round-trip: Domain → toDb → insert → select → toDomain; tests d'erreurs DB/validation.

#### [Si pertinent] Routeurs (contrats, validation, mapping erreurs)

- Instancier routeurs avec services mockés, tester schémas Zod, `TRPCError` et guards d'auth.