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
import { Either, left, right } from 'effect/Either';
import { Data } from 'effect';

// Types d'erreurs métier explicites
class InvalidPlanName extends Data.TaggedError('InvalidPlanName')<{ name: string }> {}
class MissingPcaetReferent extends Data.TaggedError('MissingPcaetReferent')<{}> {}
class MissingEnergyExpertise extends Data.TaggedError('MissingEnergyExpertise')<{}> {}

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
  create: (input: CreatePlanData): Either<PlanDomainError, Plan> => {
    // Validation structurelle
    const validation = planSchema.safeParse(input);
    if (!validation.success) {
      return left(new InvalidPlanName({ name: input.nom || '' }));
    }

    const plan = validation.data;

    // Règles métier spécifiques PCAET
    if (plan.type === 'PCAET') {
      if (plan.referents.length === 0) {
        return left(new MissingPcaetReferent({}));
      }
      
      const hasEnergyExpert = plan.referents.some(r => r.competence === 'ENERGIE');
      if (!hasEnergyExpert) {
        return left(new MissingEnergyExpertise({}));
      }
    }

    return right(plan);
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
    
    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left).toBeInstanceOf(MissingEnergyExpertise);
    }
  });
});
```

## Étape 2 : Créer un Service Métier (Domain Service)

**💡 TAKE #2** : Certaines opérations métier ne peuvent pas être exprimées purement et nécessitent des dépendances (comme les repositories), mais elles restent dans le domaine.

Créons un service métier qui orchestre les objets du domaine et gère la persistance :

```typescript
import { Effect, Data } from 'effect';

// Erreurs liées à la persistance du domaine
class PlanNotFound extends Data.TaggedError('PlanNotFound')<{ planId: number }> {}
class PersistenceError extends Data.TaggedError('PersistenceError')<{ cause: unknown }> {}

type PlanDomainServiceError = PlanDomainError | PlanNotFound | PersistenceError;

// Interface du repository (contrat du domaine)
interface PlanRepository {
  save: (plan: Plan, tx?: Transaction) => Effect.Effect<Plan, PersistenceError, never>;
  findById: (id: number, tx?: Transaction) => Effect.Effect<Plan | null, PersistenceError, never>;
}

// 🎯 SERVICE MÉTIER - Orchestre les objets du domaine + persistance
@Injectable()
export class PlanDomainService {
  constructor(
    @Inject('PlanRepository')
    private readonly planRepository: PlanRepository
  ) {}

  // Création avec logique métier + persistance
  createPlan(
    input: CreatePlanData,
    tx?: Transaction
  ): Effect.Effect<Plan, PlanDomainServiceError, never> {
    return Effect.gen(function* () {
      // 1. Appliquer les règles métier (pure)
      const planResult = PlanOperations.create(input);
      const validPlan = yield* Effect.fromEither(planResult);

      // 2. Persister (avec gestion d'erreurs explicite)
      const savedPlan = yield* this.planRepository.save(validPlan, tx);

      return savedPlan;
    }.bind(this));
  }

  // Création avec structure par défaut (logique métier complexe)
  createPlanWithDefaultStructure(
    input: CreatePlanData,
    tx?: Transaction
  ): Effect.Effect<{ plan: Plan; axes: Axe[] }, PlanDomainServiceError, never> {
    return Effect.gen(function* () {
      // 1. Créer le plan avec validation métier
      const plan = yield* this.createPlan(input, tx);

      // 2. Générer la structure par défaut (logique métier)
      const defaultAxesData = PlanOperations.getDefaultAxesForType(plan.type);
      
      // 3. Créer les axes avec leurs propres règles métier
      const axes: Axe[] = [];
      for (const axeData of defaultAxesData) {
        const axeResult = AxeOperations.create({
          ...axeData,
          planId: plan.id
        });
        const axe = yield* Effect.fromEither(axeResult);
        const savedAxe = yield* this.axeRepository.save(axe, tx);
        axes.push(savedAxe);
      }

      return { plan, axes };
    }.bind(this));
  }

  // Mise à jour avec règles métier
  updatePlan(
    planId: number,
    updates: Partial<CreatePlanData>,
    tx?: Transaction
  ): Effect.Effect<Plan, PlanDomainServiceError, never> {
    return Effect.gen(function* () {
      // 1. Récupérer le plan existant
      const existingPlan = yield* this.planRepository.findById(planId, tx);
      if (!existingPlan) {
        return yield* Effect.fail(new PlanNotFound({ planId }));
      }

      // 2. Appliquer les modifications avec validation métier
      const updatedData = { ...existingPlan, ...updates };
      const validatedResult = PlanOperations.create(updatedData);
      const validPlan = yield* Effect.fromEither(validatedResult);

      // 3. Persister
      const savedPlan = yield* this.planRepository.save(validPlan, tx);

      return savedPlan;
    }.bind(this));
  }
}
```

**Résultat de l'Étape 2 :**
- Logique métier complexe centralisée (création + structure par défaut)
- Gestion d'erreurs explicite avec Effect
- Transactions gérées au bon niveau
- Testable avec des mocks simples du repository
- Réutilisable par différents services d'application

## Étape 3 : Créer un Service d'Application (Coordination)

**💡 TAKE #3** : Le service d'application orchestre tout ce qui n'est PAS de la logique métier : autorisations, cache, événements, transformations de données.

```typescript
import { Effect } from 'effect';

// Erreurs d'application (non-métier)
class Forbidden extends Data.TaggedError('Forbidden')<{ reason: string }> {}
class ApplicationError extends Data.TaggedError('ApplicationError')<{ code: string; message: string }> {}

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
  ): Promise<Either<PlanApplicationError, PlanResponse>> {
    
    // 1. 🔐 AUTORISATION (responsabilité application)
    const hasPermission = await this.permissionService.isAllowed(
      user,
      'PLANS.CREATE',
      request.collectiviteId
    );
    if (!hasPermission) {
      return left(new Forbidden({ reason: 'Cannot create plan for this collectivité' }));
    }

    // 2. 🏗️ COORDINATION MÉTIER avec transaction
    const domainResult = await this.databaseService.db.transaction(async (tx) => {
      // Déléguer au service métier
      const planEffect = this.planDomainService.createPlanWithDefaultStructure({
      ...request,
      createdBy: user.id,
      createdAt: new Date()
      }, tx);

      // Exécuter l'effet (gestion d'erreurs automatique)
      const result = await Effect.runPromise(planEffect);

      // Audit (effet de bord métier mais géré par l'application)
      await this.auditService.logPlanCreation(result.plan.id, user.id, tx);

      return result;
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
    
    return right(response);
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
    if (isLeft(result)) throw new BadRequestException(result.left.message);
    return result.right;
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
        
        // Conversion d'erreurs directement dans le routeur
        if (isLeft(result)) {
          const error = result.left;
          if (error._tag === 'Forbidden') {
            throw new TRPCError({ code: 'FORBIDDEN', message: error.reason });
          }
          throw new TRPCError({ code: 'BAD_REQUEST', message: error.message });
        }
        
        return result.right;
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
  create: (input) => Either<DomainError, Plan>  // 20 lignes, 0 dépendance
}

// Transformations de données isolées
const PlanAdapter = {
  toDomain: (dbRow) => Either<AdapterError, Plan>  // 15 lignes, 0 dépendance
  toDb: (plan) => Either<AdapterError, DbRow>      // 15 lignes, 0 dépendance
}

// Service métier avec persistance
class PlanDomainService {
  createPlan: (input, tx?) => Effect<Plan, DomainError>  // 30 lignes, 1 dépendance
}

// Service d'application pour coordination
class PlanApplicationService {
  createPlan: (request, user) => Promise<Either<AppError, Response>>  // 40 lignes, 5 dépendances
}

// Routeur appelle directement le service d'application
class PlanRouter {
  // Conversion d'erreurs + délégation  // 15 lignes, 1 dépendance
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
// ✅ Router : Validation API + conversion erreurs
input: createPlanSchema,
const result = await this.planApplicationService.createPlan(input, ctx.user);
if (isLeft(result)) throw new TRPCError({...});

// ✅ Application Service : Autorisation + coordination + effets de bord
const hasPermission = await this.permissionService.isAllowed(...);
const planResult = await this.planDomainService.createPlan(...);
await this.cacheService.invalidate(...);
await this.eventBus.publish(...);

// ✅ Domain Service : Orchestration métier + persistance
const validPlan = yield* Effect.fromEither(PlanOperations.create(input));
const savedPlan = yield* this.planRepository.save(validPlan);
const axes = yield* this.createDefaultAxes(savedPlan.id);

// ✅ Operations : Règles métier pures
if (input.type === 'PCAET' && !input.referents?.some(r => r.competence === 'ENERGIE')) {
  return left(new MissingEnergyExpertise({}));
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
getCompletionRate(planId: number): Effect<number, DomainError> {
  return Effect.gen(function* () {
    const plan = yield* this.findPlanById(planId);
    const fiches = yield* this.findFichesByPlanId(planId);
    return PlanOperations.calculateCompletion(plan, fiches);
  });
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

## Gestion d'Erreurs avec Effect-TS

### Pourquoi Effect-TS ?

Notre codebase actuel souffre de gestion d'erreurs incohérente :
- `throw new Error()` générique partout
- Impossible de distinguer erreurs métier vs techniques
- Pas de typage des erreurs
- Debugging difficile

Effect-TS résout ces problèmes :

```typescript
// ❌ AVANT : Erreurs génériques non typées
async function createPlan(data) {
  if (!data.nom) throw new Error('Nom requis');
  if (data.type === 'PCAET' && !data.referents) throw new Error('Référents requis');
  // ... impossible de savoir quelles erreurs peuvent survenir
}

// ✅ APRÈS : Erreurs typées et explicites
function createPlan(data: CreatePlanData): Either<PlanDomainError, Plan> {
  // Toutes les erreurs possibles sont dans le type de retour
  // Le compilateur force à les gérer
}
```

### Pattern d'Adoption Progressif

```typescript
// 1. Commencez par Either pour la logique pure
const result = PlanOperations.create(data);
if (isLeft(result)) {
  // Gestion d'erreur explicite
  console.error(result.left.message);
}

// 2. Utilisez Effect pour les opérations avec dépendances
const planEffect = planDomainService.createPlan(data);
const plan = await Effect.runPromise(planEffect);

// 3. Intégrez progressivement dans vos services existants
```

## Étape 5 : Ajouter les Adapters (Transformation de Données)

**💡 TAKE #5** : Les objets métier ne devraient jamais dépendre du format de la base de données. Les Adapters isolent ces transformations.

Dans notre refactoring, nous avons un problème caché : notre `PlanDomainService` assume que les données DB correspondent exactement aux objets métier. En réalité, il faut souvent transformer :

```typescript
// 🔥 PROBLÈME : Couplage DB ↔ Domain
class PlanDomainService {
  async createPlan(input: CreatePlanData): Effect<Plan, DomainServiceError> {
    return Effect.gen(function* () {
      const validPlan = yield* Effect.fromEither(PlanOperations.create(input));
      
      // ❌ On assume que l'objet métier = format DB
      const savedPlan = yield* this.planRepository.save(validPlan, tx);
      return savedPlan;
    });
  }
}
```

**Le problème** : Notre base de données utilise `snake_case`, des IDs différents, et des formats de dates spécifiques, mais notre domaine utilise `camelCase` et des types TypeScript stricts.

**La solution** : Créer des Adapters qui transforment entre les formats :

```typescript
import { Either, left, right } from 'effect/Either';
import { Data } from 'effect';

class AdapterError extends Data.TaggedError('AdapterError')<{ 
  reason: string; 
  field?: string; 
}> {}

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
  toDomain: (dbRow: PlanDbRow): Either<AdapterError, Plan> => {
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

      return right(domainPlan);
    } catch (error) {
      return left(new AdapterError({ 
        reason: 'Failed to convert DB row to domain object',
        field: error instanceof Error ? error.message : 'unknown'
      }));
    }
  },

  // Domain → DB
  toDb: (plan: Plan): Either<AdapterError, PlanDbRow> => {
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

      return right(dbRow);
    } catch (error) {
      return left(new AdapterError({
        reason: 'Failed to convert domain object to DB row'
      }));
    }
  }
};

// 🎯 REPOSITORY avec Adapter intégré
@Injectable()
export class PlanRepository {
  constructor(private readonly db: DatabaseService) {}

  save(plan: Plan, tx?: Transaction): Effect.Effect<Plan, PersistenceError | AdapterError, never> {
    return Effect.gen(function* () {
      // 1. Convertir Domain → DB
      const dbRowResult = PlanAdapter.toDb(plan);
      const dbRow = yield* Effect.fromEither(dbRowResult);

      // 2. Sauvegarder en DB
      const savedRow = yield* Effect.tryPromise({
        try: async () => {
          const executor = tx || this.db;
          const [inserted] = await executor
            .insert(plansTable)
            .values(dbRow)
            .returning();
          return inserted as PlanDbRow;
        },
        catch: (error) => new PersistenceError({ cause: error })
      });

      // 3. Convertir DB → Domain
      const domainResult = PlanAdapter.toDomain(savedRow);
      const savedPlan = yield* Effect.fromEither(domainResult);

      return savedPlan;
    }.bind(this));
  }

  findById(id: number, tx?: Transaction): Effect.Effect<Plan | null, PersistenceError | AdapterError, never> {
    return Effect.gen(function* () {
      // 1. Récupérer de la DB
      const dbRow = yield* Effect.tryPromise({
        try: async () => {
          const executor = tx || this.db;
          return await executor
            .select()
            .from(plansTable)
            .where(eq(plansTable.plan_id, id))
            .limit(1)
            .then(rows => rows[0] || null);
        },
        catch: (error) => new PersistenceError({ cause: error })
      });

      if (!dbRow) return null;

      // 2. Convertir DB → Domain
      const domainResult = PlanAdapter.toDomain(dbRow);
      const plan = yield* Effect.fromEither(domainResult);

      return plan;
    }.bind(this));
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
    
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.statut).toBe('valide'); // Mapping correct
      expect(result.right.createdAt).toBeInstanceOf(Date);
      expect(result.right.referents).toHaveLength(1);
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
  createCompletePlan(
    planData: CreatePlanData,
    tx?: Transaction
  ): Effect.Effect<Plan, DomainError, never> {
    return Effect.gen(function* () {
      
      // Validation de l'agrégat complet
      const planResult = PlanOperations.create({
        ...planData,
        createDefaultStructure: true
      });
      const plan = yield* Effect.fromEither(planResult);
      
      // Sauvegarde atomique de tout l'agrégat
      const savedPlan = yield* this.planRepository.save(plan, tx);
      
      return savedPlan;
    }.bind(this));
  }
  
  // Plus besoin de coordonner : tout est dans le même agrégat
  updatePlanStructure(
    planId: number,
    updates: UpdatePlanStructureData,
    tx?: Transaction
  ): Effect.Effect<Plan, DomainError, never> {
    return Effect.gen(function* () {
      
      const plan = yield* this.planRepository.findById(planId, tx);
      if (!plan) return yield* Effect.fail(new PlanNotFound({ planId }));
      
      // Logique métier unifiée dans l'agrégat
      const updatedPlanResult = plan.updateStructure(updates);
      const updatedPlan = yield* Effect.fromEither(updatedPlanResult);
      
      const savedPlan = yield* this.planRepository.save(updatedPlan, tx);
      
      return savedPlan;
    }.bind(this));
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
  updateStructure(updates: UpdatePlanStructureData): Either<DomainError, Plan> {
    // Validation globale de la cohérence
    if (updates.axes && updates.fiches) {
      const isCoherent = this.validateAxesFichesCoherence(updates.axes, updates.fiches);
      if (!isCoherent) {
        return left(new IncoherentStructureError({}));
      }
    }
    
    return right(new Plan(
      this.id,
      updates.nom ?? this.nom,
      updates.type ?? this.type,
      this.collectiviteId,
      updates.axes ?? this.axes,
      updates.fiches ?? this.fiches,
      this.statut
    ));
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
  createPlanWithStructure(
    request: CreatePlanRequest,
    tx?: Transaction
  ): Effect.Effect<Plan, DomainError, never> {
    return Effect.gen(function* () {
      
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
      
      const plan = yield* Effect.fromEither(planResult);
      
      // Une seule sauvegarde atomique
      const savedPlan = yield* this.planRepository.save(plan, tx);
      
      return savedPlan;
    }.bind(this));
  }
}

// Agrégat qui gère sa propre cohérence
export class PlanAggregate {
  
  static create(data: CreatePlanData): Either<DomainError, PlanAggregate> {
    // Validation de cohérence globale à la création
    if (data.type === 'PCAET') {
      if (data.defaultAxes.length < 3) {
        return left(new InvalidPcaetStructure({ reason: 'PCAET needs at least 3 axes' }));
      }
    }
    
    // Validation des relations axes-fiches
    const ficheAxeIds = data.defaultFiches.map(f => f.axeId);
    const axeIds = data.defaultAxes.map(a => a.id);
    const hasOrphanFiches = ficheAxeIds.some(id => !axeIds.includes(id));
    
    if (hasOrphanFiches) {
      return left(new OrphanFichesError({}));
    }
    
    return right(new PlanAggregate(
      data.nom,
      data.type,
      data.collectiviteId,
      data.defaultAxes,
      data.defaultFiches,
      'brouillon'
    ));
  }
  
  // Opérations qui maintiennent la cohérence interne
  addAxe(axe: Axe): Either<DomainError, PlanAggregate> {
    // Validation des règles métier internes
    if (this.axes.some(a => a.nom === axe.nom)) {
      return left(new DuplicateAxeError({ nom: axe.nom }));
    }
    
    return right(new PlanAggregate(
      this.nom,
      this.type,
      this.collectiviteId,
      [...this.axes, axe],
      this.fiches,
      this.statut
    ));
  }
  
  removeAxe(axeId: number): Either<DomainError, PlanAggregate> {
    // Gestion des dépendances internes
    const dependentFiches = this.fiches.filter(f => f.axeId === axeId);
    if (dependentFiches.length > 0) {
      return left(new AxeHasDependentFichesError({ axeId, ficheCount: dependentFiches.length }));
    }
    
    return right(new PlanAggregate(
      this.nom,
      this.type,
      this.collectiviteId,
      this.axes.filter(a => a.id !== axeId),
      this.fiches,
      this.statut
    ));
  }
}

// Application Service simplifié - plus de transactions cross-services
@Injectable()
export class PlanApplicationService {
  
  async createPlan(request: CreatePlanRequest, user: AuthenticatedUser) {
    // Autorisation
    const hasPermission = await this.permissionService.isAllowed(user, 'PLANS.CREATE', request.collectiviteId);
    if (!hasPermission) return left(new Forbidden({}));
    
    // Une seule transaction pour tout l'agrégat
    const result = await this.db.transaction(async (tx) => {
      const planEffect = this.planDomainService.createPlanWithStructure(request, tx);
      return await Effect.runPromise(planEffect);
    });
    
    // Effets de bord
    await this.eventBus.publish(new PlanCreatedEvent({ planId: result.id }));
    
    return right(result);
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
    if (!hasPermission) return left(new Forbidden({}));
    
    // Délégation au domaine pour la logique métier
    const validationResult = await this.planDomainService.validatePlan(planId);
    
    if (isLeft(validationResult)) {
      return validationResult; // Propagation des erreurs métier
    }
    
    const validatedPlan = validationResult.right;
    
    // Effets de bord (Application concern)
    await Promise.all([
      this.eventBus.publish(new PlanValidatedEvent({ planId: validatedPlan.id })),
      this.auditService.logPlanValidation(planId, user.id),
      this.cacheService.invalidate(`plan:${planId}`)
    ]);
    
    return right(validatedPlan);
  }
}

// Logique métier centralisée dans le domaine
@Injectable()
export class PlanDomainService {
  
  validatePlan(planId: number): Effect.Effect<Plan, DomainError, never> {
    return Effect.gen(function* () {
      
      const plan = yield* this.planRepository.findById(planId);
      if (!plan) return yield* Effect.fail(new PlanNotFound({ planId }));
      
      // Délégation à l'agrégat pour les règles métier
      const validationResult = plan.validate();
      const validatedPlan = yield* Effect.fromEither(validationResult);
      
      // Sauvegarde du nouveau statut
      const savedPlan = yield* this.planRepository.save(validatedPlan);
      
      return savedPlan;
    }.bind(this));
  }
}

// ✅ Règles métier dans l'agrégat
export class Plan {
  
  validate(): Either<DomainError, Plan> {
    // Règle métier : validation spécifique par type
    if (this.type === 'PCAET') {
      const pcaetValidation = this.validatePcaetRules();
      if (isLeft(pcaetValidation)) {
        return pcaetValidation;
      }
    }
    
    // Règle métier : calcul de complétude
    const completion = this.calculateCompletion();
    if (completion < 0.8) {
      return left(new InsufficientCompletionError({ 
        current: completion, 
        required: 0.8 
      }));
    }
    
    // Transition d'état valide
    if (this.statut !== 'brouillon' && this.statut !== 'en_cours') {
      return left(new InvalidStatusTransitionError({ 
        from: this.statut, 
        to: 'valide' 
      }));
    }
    
    return right(new Plan(
      this.id,
      this.nom,
      this.type,
      this.collectiviteId,
      this.axes,
      this.fiches,
      'valide' // Nouveau statut
    ));
  }
  
  private validatePcaetRules(): Either<DomainError, void> {
    // Règle métier PCAET : au moins 3 fiches
    if (this.fiches.length < 3) {
      return left(new InsufficientPcaetFichesError({ 
        current: this.fiches.length, 
        required: 3 
      }));
    }
    
    // Règle métier PCAET : au moins un axe "énergie"
    const hasEnergyAxe = this.axes.some(axe => 
      axe.nom.toLowerCase().includes('énergie') || 
      axe.nom.toLowerCase().includes('energie')
    );
    
    if (!hasEnergyAxe) {
      return left(new MissingEnergyAxeError({}));
    }
    
    return right(undefined);
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
  updateFiche(ficheId: number, updates: UpdateFicheData): Either<DomainError, Plan> {
    const ficheIndex = this.fiches.findIndex(f => f.id === ficheId);
    if (ficheIndex === -1) {
      return left(new FicheNotFoundError({ ficheId }));
    }
    
    const currentFiche = this.fiches[ficheIndex];
    
    // Règle métier : impossible de modifier une fiche si le plan est archivé
    if (this.statut === 'archive') {
      return left(new CannotModifyArchivedPlanError({ planId: this.id }));
    }
    
    // Règle métier : validation des transitions d'axe
    if (updates.axeId && updates.axeId !== currentFiche.axeId) {
      const targetAxe = this.axes.find(a => a.id === updates.axeId);
      if (!targetAxe) {
        return left(new AxeNotFoundError({ axeId: updates.axeId }));
      }
      
      // Règle métier : impossible d'abandonner une fiche d'axe obligatoire
      if (targetAxe.type === 'OBLIGATOIRE' && updates.statut === 'abandonne') {
        return left(new CannotAbandonMandatoryAxeFicheError({ axeId: targetAxe.id }));
      }
    }
    
    // Mise à jour cohérente
    const updatedFiches = [...this.fiches];
    updatedFiches[ficheIndex] = { ...currentFiche, ...updates };
    
    return right(new Plan(
      this.id,
      this.nom,
      this.type,
      this.collectiviteId,
      this.axes,
      updatedFiches,
      this.statut
    ));
  }
  
  // Encapsulation : gestion des dépendances internes
  removeAxe(axeId: number): Either<DomainError, Plan> {
    const axeIndex = this.axes.findIndex(a => a.id === axeId);
    if (axeIndex === -1) {
      return left(new AxeNotFoundError({ axeId }));
    }
    
    // Gestion des dépendances : réassignation automatique des fiches
    const dependentFiches = this.fiches.filter(f => f.axeId === axeId);
    const defaultAxe = this.axes.find(a => a.type === 'DEFAULT');
    
    if (dependentFiches.length > 0 && !defaultAxe) {
      return left(new CannotRemoveAxeWithoutDefaultError({ axeId }));
    }
    
    // Réassignation automatique
    const updatedFiches = this.fiches.map(fiche => 
      fiche.axeId === axeId 
        ? { ...fiche, axeId: defaultAxe!.id }
        : fiche
    );
    
    const updatedAxes = this.axes.filter(a => a.id !== axeId);
    
    return right(new Plan(
      this.id,
      this.nom,
      this.type,
      this.collectiviteId,
      updatedAxes,
      updatedFiches,
      this.statut
    ));
  }
}

// Domain Service simplifié - plus de connaissances cross-domaines
@Injectable()
export class PlanDomainService {
  
  updateFiche(
    planId: number,
    ficheId: number,
    updates: UpdateFicheData,
    tx?: Transaction
  ): Effect.Effect<Plan, DomainError, never> {
    return Effect.gen(function* () {
      
      // Récupération de l'agrégat complet
      const plan = yield* this.planRepository.findById(planId, tx);
      if (!plan) return yield* Effect.fail(new PlanNotFound({ planId }));
      
      // Délégation à l'agrégat pour toute la logique métier
      const updatedPlanResult = plan.updateFiche(ficheId, updates);
      const updatedPlan = yield* Effect.fromEither(updatedPlanResult);
      
      // Sauvegarde atomique
      const savedPlan = yield* this.planRepository.save(updatedPlan, tx);
      
      return savedPlan;
    }.bind(this));
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
  createAxe(
    planId: number,
    axeData: CreateAxeData,
    tx?: Transaction
  ): Effect.Effect<Plan, DomainError, never> {
    return Effect.gen(function* () {
      
      // Récupération de l'agrégat complet
      const plan = yield* this.planRepository.findById(planId, tx);
      if (!plan) return yield* Effect.fail(new PlanNotFound({ planId }));
      
      // L'agrégat gère sa propre cohérence
      const updatedPlanResult = plan.addAxe(axeData);
      const updatedPlan = yield* Effect.fromEither(updatedPlanResult);
      
      // Sauvegarde atomique
      const savedPlan = yield* this.planRepository.save(updatedPlan, tx);
      
      return savedPlan;
    }.bind(this));
  }
  
  // Suppression d'axe avec gestion automatique des dépendances
  removeAxe(
    planId: number,
    axeId: number,
    tx?: Transaction
  ): Effect.Effect<Plan, DomainError, never> {
    return Effect.gen(function* () {
      
      const plan = yield* this.planRepository.findById(planId, tx);
      if (!plan) return yield* Effect.fail(new PlanNotFound({ planId }));
      
      // L'agrégat gère les dépendances internes automatiquement
      const updatedPlanResult = plan.removeAxe(axeId);
      const updatedPlan = yield* Effect.fromEither(updatedPlanResult);
      
      const savedPlan = yield* this.planRepository.save(updatedPlan, tx);
      
      return savedPlan;
    }.bind(this));
  }
}

// Agrégat qui garantit la cohérence interne
export class Plan {
  
  addAxe(axeData: CreateAxeData): Either<DomainError, Plan> {
    // Validation autonome (pas besoin de vérifier d'autres services)
    if (this.axes.some(a => a.nom === axeData.nom)) {
      return left(new DuplicateAxeError({ nom: axeData.nom }));
    }
    
    // Règles métier internes
    if (this.statut === 'archive') {
      return left(new CannotModifyArchivedPlanError({ planId: this.id }));
    }
    
    const newAxe = new Axe(
      this.generateAxeId(),
      axeData.nom,
      axeData.type || 'STANDARD',
      this.axes.length + 1 // ordre automatique
    );
    
    return right(new Plan(
      this.id,
      this.nom,
      this.type,
      this.collectiviteId,
      [...this.axes, newAxe],
      this.fiches,
      this.statut
    ));
  }
  
  removeAxe(axeId: number): Either<DomainError, Plan> {
    const axeToRemove = this.axes.find(a => a.id === axeId);
    if (!axeToRemove) {
      return left(new AxeNotFoundError({ axeId }));
    }
    
    // Gestion automatique des dépendances (plus besoin d'autres services)
    const dependentFiches = this.fiches.filter(f => f.axeId === axeId);
    const defaultAxe = this.axes.find(a => a.type === 'DEFAULT');
    
    if (dependentFiches.length > 0) {
      if (!defaultAxe) {
        return left(new CannotRemoveAxeWithoutDefaultError({ axeId }));
      }
      
      // Réassignation automatique des fiches
      const reassignedFiches = this.fiches.map(fiche =>
        fiche.axeId === axeId
          ? { ...fiche, axeId: defaultAxe.id }
          : fiche
      );
      
      const remainingAxes = this.axes.filter(a => a.id !== axeId);
      
      return right(new Plan(
        this.id,
        this.nom,
        this.type,
        this.collectiviteId,
        remainingAxes,
        reassignedFiches,
        this.statut
      ));
    }
    
    // Suppression simple si pas de dépendances
    const remainingAxes = this.axes.filter(a => a.id !== axeId);
    
    return right(new Plan(
      this.id,
      this.nom,
      this.type,
      this.collectiviteId,
      remainingAxes,
      this.fiches,
      this.statut
    ));
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
  ): Promise<Either<ApplicationError, CompletionReportResponse>> {
    
    // Autorisation
    const hasPermission = await this.permissionService.isAllowed(
      user, 'ANALYTICS.READ', collectiviteId
    );
    if (!hasPermission) return left(new Forbidden({}));
    
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
    
    return right({
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
    });
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
