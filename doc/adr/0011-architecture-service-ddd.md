# 11. Architecture backend de services Domain-Driven Design

Date: 2025-09-04

## Statut

Proposé

## Contexte

Nous rencontrons un problème de complexité lorsque nos services deviennent trop volumineux et contiennent trop de responsabilités. Il en résulte des méthodes de services fourre-tout, sans *séparation des responsabilités* claire, avec de potentielles duplications. Ces services deviennent peu à peu difficiles à comprendre et à maintenir.

Prenons l'exemple d'un service typique de notre application - celui qui gère la création des plans d'action.

```typescript
@Injectable()
export class MutatePlanService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly cacheService: CacheService,
    private readonly eventBus: EventBus,
    private readonly ficheService: FicheService,
    private readonly auditService: AuditService
  ) {}

  async createPlan(request: CreatePlanRequest, user: AuthenticatedUser): Promise<PlanResponse> {
    
    // 🔥 AUTORISATION
    if (!await this.permissionService.isAllowed(user, 'PLANS.CREATE', request.collectiviteId)) {
      throw new Error('Forbidden');
    }

    // 🔥 VALIDATION métier
    if (!request.nom || request.nom.trim().length === 0) {
      throw new Error('Le nom du plan est obligatoire');
    }
    
    if (request.nom.length > 255) {
      throw new Error('Le nom du plan ne peut pas dépasser 255 caractères');
    }

    // 🔥 RÈGLES MÉTIER (validation spécifique PCAET ici)
    if (request.type === 'PCAET') {
      if (!request.referents || request.referents.length === 0) {
        throw new Error('Un plan PCAET doit avoir au moins un référent');
      }
      
      const hasEnergiePilote = request.referents.some(r => r.competence === 'ENERGIE');
      if (!hasEnergiePilote) {
        throw new Error('Un plan PCAET doit avoir un référent énergie');
      }
    }

    // 🔥 TRANSACTION et PERSISTANCE
    const savedPlan = await this.databaseService.db.transaction(async (tx) => {
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
      
      return plan[0];
    });

    // 🔥 EFFETS DE BORD (logging, cache, événements, …)
    await Promise.all([
      this.auditService.logPlanCreation(plan[0].id, user.id, tx);
      this.cacheService.invalidate(`plans:${request.collectiviteId}`),
      this.eventBus.publish(new PlanCreatedEvent(savedPlan.id, user.id))
    ]);
  

    // 🔥 TRANSFORMATION de données
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

  // 🔥 Autre méthode du même service avec DUPLICATION de logique
  async updatePlan(planId: number, updates: UpdatePlanRequest, user: AuthenticatedUser): Promise<PlanResponse> {
    // Autorisation dupliquée...
    if (!await this.permissionService.isAllowed(user, 'PLANS.EDIT', planId)) {
      throw new Error('Forbidden');
    }

    // Validation dupliquée...
    if (updates.nom && updates.nom.trim().length === 0) {
      throw new Error('Le nom du plan est obligatoire');
    }

    // Règles métier dupliquées...
    if (updates.type === 'PCAET') {
      // Même logique qu'au-dessus mais légèrement différente
    }

    // ...
  }
}
```

### 🔍 Constats sur cet exemple de code

**1. Responsabilités multiples dans une même méthode**
- Autorisation + validation + règles métier + persistance + effets de bord + transformation
- Changer une règle métier peut impacter l'autorisation ou le cache

**2. Règles métier éparpillées et dupliquées**
- La logique de validation du plan est dupliquée dans plusieurs méthodes différentes du service
- Difficile de comprendre les règles métier en un coup d'oeil rapide

**3. Difficile à tester unitairement**
- Pour tester une règle métier simple ("un PCAET doit avoir un référent énergie"), il faut mocker 6 dépendances
- Les tests sont lents et fragiles

**4. Maintenance complexe**
- Ajouter un nouveau type de plan nécessite de modifier plusieurs endroits
- La logique métier n'est pas réutilisable dans d'autres contextes


## Décision

En s'inspirant des principes DDD, les différentes responsabilités des méthodes de services sont extraites dans des sous-services spécifiques. 

Ce découpage en sous-service est recommandé dès lors que les méthodes de services deviennent de taille ou de complexité importante. Pour un service simple, tout ou partie de ce découpage est considéré optionnel. 

L'objectif est de pouvoir comprendre ce qu'un service fait dans les grandes lignes en quelques secondes de lecture. Au-dessus de 300 lignes de code, 


### 🗂️ Structure de dossiers et fichiers

#### Partie **applicative** au sein de `apps/backend`

Structure en domaine / sous-domaine / "un dossier par feature", contenant la logique applicative, avec des suffixes spécifiques par fichier pour préciser la couche de responsabilité.

```
backend/src/plans/                          # Dossier DOMAINE (plans)
├─ fiches/                                  # Dossier SOUS-DOMAINE
│  ├─ mutate-fiche/                         # Dossier FEATURE
│  │  ├─ mutate-fiche.input.ts              # Schéma de validation et type d'entrée du router / service
│  │  ├─ mutate-fiche.output.ts             # Schéma et type de sortie 
│  │  ├─ mutate-fiche.service.ts            # Service d'application
│  │  ├─ mutate-fiche.router.ts             # Router TRPC
│  │  ├─ mutate-fiche.router.e2e-spec.ts    # Tests e2e en sortie de router, approche par défaut recommandée
│  │  ├─ mutate-fiche.controller.ts         # Controller API REST pour les endpoints publics (si nécessaire), 
│  │  │                                     # ou pour les endpoints internes de download/upload de fichiers 
│  │  ├─ mutate-fiche.repository.ts         # 🆕 Accès aux données de BDD : requêtes SQL avec ORM Drizzle
│  │  ├─ mutate-fiche.adapter.ts            # 🆕 Transformations BDD ↔ entité Domain
│  │  ├─ mutate-fiche.rule.ts               # 🆕 Logique métier pure (sans dépendance externe)
│  │  ├─ mutate-fiche.error.ts              # 🆕 Erreurs métiers typées
│  │  ├─ mutate-fiche.effect.ts             # 🆕 Effets de bord
│  │
│  ├─ database/                   # 🆕
│  │  ├─ fiche.table.ts           # Schéma de table SQL Drizzle au niveau domaine (voire sous-domaine ?)
```

#### Partie **domaine** au sein de `packages/domain`

Structure en domaine / sous-domaine, contenant les entités et les règles métier communes à l'application, avec d'autres suffixes spécifiques par fichier pour préciser la couche de responsabilité.

```
domain/src/plans/
├─ plans/
│  ├─ plan.aggregate.ts             # 🆕 Plan comme racine d'agrégat = plan avec tout ce qui le compose (axes, fiches, etc.)
│  ├─ axe.entity.ts                 # 🆕 Entité enfant 
├─ fiches/
   ├─ fiche.entity.ts
   ├─ budget.value-object.ts        # 🆕 Value object (toujours associé à une entité)
   ├─ fiche.rule.ts                 # 🆕 Fonctions pures de règles métier
  
```

### 🏷️ Conventions de nommage des fichiers d'entrée/sortie

**Suffixes canoniques.** Les schémas et types d'entrée d'un router ou service utilisent `*.input.ts`. Les schémas et types de sortie utilisent `*.output.ts`. Les anciens fichiers en `*.request.ts` / `*.response.ts` (ou les schémas de réponse inlinés dans des fichiers de schéma primitif) sont considérés comme du legacy et sont migrés vers `*.input.ts` / `*.output.ts` à l'occasion de modifications fonctionnelles, sans refactor de masse — cohérent avec le principe d'adoption graduelle décrit en section *Conséquences*.

**Nommage des symboles à l'intérieur.** Le schéma porte le nom de la feature suivi du suffixe `Schema` : `xxxInputSchema`, `xxxOutputSchema`. Le type inféré porte le nom de la feature sans suffixe `Type` : `XxxInput`, `XxxOutput`. Pour les sous-schémas (filtres, options, etc.), on étend la même convention : `xxxInputFiltersSchema`, `XxxInputFilters`.

```ts
// ✅ packages/domain/.../list-plans.input.ts
export const listPlansInputSchema = z.object({ /* … */ });
export type ListPlansInput = z.infer<typeof listPlansInputSchema>;

// ✅ packages/domain/.../list-plans.output.ts
export const listPlansOutputSchema = z.object({ /* … */ });
export type ListPlansOutput = z.infer<typeof listPlansOutputSchema>;
```

### ♻️ Flux de données entre les couches de responsabilité

```
┌----------------------------------------
│ useMutation / useQuery (frontend) 
└----------------------------------------
      ↓
┌----------------------------------------
│ Router TRPC           - `.router.ts` 
│                                      
│  • validation input   - `.input.ts`  
│  • validation output  - `.output.ts` (si pertinent)
└----------------------------------------
      ↓ 
┌----------------------------------------
│ Application Service    - `.service.ts`
│
│  • authorisation       - `.guard.ts`
│  • règles métier pure  - `.rule.ts`       ┐
│  • persistance         - `.repository.ts` │ → couches métiers
│  • gestion des erreurs - `.error.ts`      ┘
│  • transformation      - `.adapter.ts`
│  • effets de bord      - `.effect.ts`
└----------------------------------------
```

La création de fichier spécifique par couche de responsabilité est recommandée dès lors que la taille ou la complexité du service le justifie. Dans les cas simples, il peut rester pertinent et pragmatique de coordonner les différentes responsabilités au sein du seul fichier service, et de les extraire uniquement lorsque la complexité le justifie.

### 🧶 Pour les cas plus complexes : Domain Service spécifique

Dans les cas de **workflows métier complexes**, en particulier en cas de **coordination inter-services** (par exemple, la création d'un plan nécessite la création d'axes et de fiches), il peut être pertinent d'extraire les couches métiers du "application service" dans un(des) "domain service" spécifique(s).

```
┌----------------------------------------
│  Application Service   - `create-plan.application-service.ts`
|  (coordination)
│
│  • authorisation
│  • coordination des domain services
│  • effets de bord
└----------------------------------------
      ↓ 
┌----------------------------------------
│  Domain Service        - `.domain-service.ts`
|  (logique métier + persistance)
│
│  • règles métier pures - `.rule.ts`
│  • persistance         - `.repository.ts`
│  • gestion des erreurs - `.error.ts`
└----------------------------------------
```

## Conséquences

### Bénéfices

**1. Meilleure maintenabilité et évolutivité**
- Des services plus petits, et plus faciles à comprendre
- Règles métier centralisées plus faciles à modifier et à tester
- Réutilisation possible de la logique métier dans différents contextes (back et front si nécessaire)

**2. Séparation des responsabilités plus claire**
- Chaque couche a une responsabilité bien définie
- Un suffixe de fichier explicite par responsabilité 
- Moins de duplications de code potentielles
- Tests unitaires simples pour les règles métiers pures (mais tests `router.e2e-spec.ts` privilégiés au niveau service)

**3. Adoption graduelle**
- Adoption des nouveaux formats de fichier quand nécessaire
- Pas de migration forcée de l'existant ni de refactoring massif


### Coûts

**1. Plus de boilerplate**
- 1 service se compose potentiellement de 3-4 fichiers
- Coût mitigé par l'utilisation de l'IA générative

**2. Courbe d'apprentissage**
- Nouveaux patterns et organisation de fichiers à assimiler


## Exemples d'utilisation

### 🪡 1. Exemple simple 

> 1 service, 1 repository, pas de coordination inter-services

```typescript
// `apps/backend/src/plans/fiches/mutate-fiche/mutate-fiche.service.ts`
export class MutateFicheService {
  constructor(
    private readonly mutateFicheRepository: MutateFicheRepository
  ) {}

  async createFiche(fiche: CreateFicheInput, user: AuthenticatedUser): Promise<Result<Fiche, FicheForbidden>> {

    // 💡 AUTORISATION, au sein du service car reste simple
    if (!await this.permissionService.isAllowed(user, 'FICHES.CREATE', fiche.collectiviteId)) {

      // 💡 ERREUR métier typée
      return failure(new FicheForbidden({fiche, user}));
    }

    // ⏩ PERSISTANCE déléguée au repository
    const createFicheResult = await this.mutateFicheRepository.create(fiche);

    if (!createFicheResult.success) {
      return createFicheResult;
    }

    // 💡 TRANSFORMATION de données, au sein du service car reste simple
    const ficheDto = {
      ... pick(createFicheResult.value, ['id', 'nom', 'description']),
      createdAt: createFicheResult.value.createdAt.toISOString(),
      updatedAt: createFicheResult.value.updatedAt.toISOString()
    };

    return success(ficheDto);
  }
}
```

### 🧵 2. Exemple complexe avec coordination inter-services 

> 1 application service, 2 domain services, 1 repository, 1 fichier règle métier

→ Application service qui coordonne 2 domain services :
- `CreatePlanDomainService` pour la création du plan
- `NotifyPlanCreatedDomainService` pour la notification de la création du plan

```typescript
// `apps/backend/src/plans/plans/create-plan/create-plan.application-service.ts`
@Injectable()
export class CreatePlanApplicationService {
  constructor(
    private readonly createPlanService: CreatePlanDomainService,
    private readonly notifyPlanCreatedService: NotifyPlanCreatedDomainService,
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
  ) {}

  async createPlan(
    input: CreatePlanInput,
    user: AuthenticatedUser
  ): Promise<Result<CreatePlanOutput, CreatePlanError>> {
    
    // 1. 🔐 AUTORISATION (responsabilité application)
    const hasPermission = await this.permissionService.isAllowed(
      user,
      'PLANS.CREATE',
      input.collectiviteId
    );

    if (!hasPermission) {
      return failure(new Forbidden('Cannot create plan for this collectivité'));
    }

    // 2. 🏗️ COORDINATION MÉTIER avec transaction
    const txResult = await this.databaseService.transaction(async (tx) => {
      // Déléguer au service métier
      const createPlanResult = await this.createPlanService.createPlan(input, tx);
      
      // Propager l'erreur si présente
      if (!createPlanResult.success) {
        return tx.rollback(createPlanResult)
      }

      const planCreated = createPlanResult.value;

      // Déléguer à la notification
      const notifyPlanCreatedResult = await this.notifyPlanCreatedService.notifyPlanCreated(planCreated, tx);
      
      // Propager l'erreur si présente
      if (!notifyPlanCreatedResult.success) {
        return tx.rollback(notifyPlanCreatedResult)
      }

      return success(planCreated);
    });

    // 3. 🔄 EFFETS DE BORD (responsabilité application)
    await this.webhookService.publish(new PlanCreatedEvent(txResult.value));
    
    return txResult;
  }

}
```

→ Domain service pour la création du plan :

```typescript
// `apps/backend/src/plans/plans/create-plan/create-plan.domain-service.ts`
type CreatePlanDomainError = CreatePlanError | PersistenceError;

// 🎯 SERVICE MÉTIER - Orchestre les objets du domaine + persistance
@Injectable()
export class CreatePlanDomainService {
  constructor(private readonly createPlanRepository: CreatePlanRepository) {}

  // Création avec logique métier + persistance
  async createPlan(
    input: CreatePlanData,
    tx?: Transaction
  ): Promise<Result<Plan, CreatePlanDomainError>> {
    // 1. Appliquer les règles métier (pure)
    const planResult = CreatePlanRule.create(input);
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
}
```

→ Logique métier pure centralisée dans son fichier dédié

```typescript
// `apps/backend/src/plans/plans/create-plan/create-plan.rule.ts`

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

export type Plan = z.output<typeof planSchema>;
export type CreatePlanData = z.input<typeof planSchema>;

// 🎯 LOGIQUE MÉTIER PURE - Aucune dépendance externe
export const CreatePlanRule = {
  
  create: (input: CreatePlanData): Result<Plan, CreatePlanError> => {
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
  }
};

// 🧪 Test unitaire simple et sans dépendance - `create-plan.rule.spec.ts`
describe('CreatePlanRule.create', () => {
  it('refuse un plan PCAET sans référent énergie', () => {
    const input = {
      nom: 'Mon PCAET',
      type: 'PCAET' as const,
      collectiviteId: 1,
      referents: [{ userId: 'uuid', nom: 'Jean', competence: 'TRANSPORT' as const }]
    };
    
    const result = CreatePlanRule.create(input);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error._tag).toBe('MissingEnergyExpertise');
    }
  });
});
```

Par souci de brièveté, les autres fichiers utilisés dans cet exemple ne sont pas détaillés.

→ le repository pour la création du plan

→ le domain service pour la notification de la création du plan

