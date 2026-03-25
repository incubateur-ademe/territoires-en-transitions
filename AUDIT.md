# Audit de Code — Territoires en Transitions

**Date :** 2026-03-18
**Scope :** Audit statique complet (architecture, sécurité, qualité, CI/CD, OSS)

---

## 1. Vue d'ensemble du projet

| Aspect | Détail |
|--------|--------|
| **Type** | Monorepo (Nx + pnpm workspaces) |
| **Frontend** | Next.js 16, React 19, TailwindCSS, DSFR |
| **Backend** | NestJS 11, tRPC 11, BullMQ/Redis |
| **BDD** | PostgreSQL 15 via Supabase, Drizzle ORM |
| **Migrations** | Sqitch |
| **Tests** | Vitest, Playwright, pgTAP |
| **CI/CD** | GitHub Actions (22 workflows), Earthly |
| **Déploiement** | Koyeb (Paris), GHCR |
| **Node** | 24.x |

Le projet est une plateforme ADEME aidant les collectivités françaises dans leur transition écologique. Architecture moderne, bien structurée en 6 applications et 3 packages partagés.

---

## 2. Points forts

### 2.1 Architecture solide
- **Monorepo bien organisé** avec Nx pour l'orchestration des builds et tâches.
- **Séparation claire** : `apps/` (app, auth, backend, site, panier, tools), `packages/` (api, domain, ui), `data_layer/`.
- **ADR (Architecture Decision Records)** documentées (15+ décisions : tRPC, BullMQ, DDD, etc.).
- **TypeScript strict** activé (`"strict": true` dans tsconfig.base.json).

### 2.2 Stack technique moderne et cohérente
- **tRPC end-to-end typesafe** entre frontend et backend — excellente DX et sécurité de types.
- **React Query** pour la gestion d'état serveur.
- **DSFR** (Design System de l'État Français) garantit l'accessibilité et le respect des normes gouvernementales.
- **Drizzle ORM** pour un accès base typé et performant.

### 2.3 Pipeline CI/CD robuste
- **22 workflows GitHub Actions** couvrant CI, CD, tests, et déploiements.
- Parallélisation des jobs avec cache NX, Next.js et pnpm.
- Tests E2E Playwright avec retry (2x en CI) et rapports HTML.
- Builds containerisés via **Earthly** — reproductibles et isolés.

### 2.4 Bonnes pratiques de sécurité de base
- Pas de credentials hardcodées dans le code source.
- `.gitignore` correctement configuré (`.env`, `keyfile.json` exclus).
- Secrets GitHub Actions correctement gérés via `${{ secrets.* }}`.
- Protection XSS avec **DOMPurify** pour tout rendu HTML dynamique.
- Pas d'usage de `eval()` ou `new Function()`.
- Requêtes SQL paramétrées (pas d'injection SQL détectée).
- **SECURITY.md** avec processus de divulgation de vulnérabilités.
- Rate limiting sur les endpoints d'authentification (ThrottlerModule global + throttle spécifique sur la génération de tokens API : 3 req/s).
- **Argon2** pour le hashing des secrets API (supérieur à bcrypt).
- Upload de fichiers sécurisé : limite 15 Mo, hash SHA-256 pour déduplication, vérification de permissions, stockage Supabase isolé.
- Validation d'entrée systématique avec **Zod** (schémas de validation sur toutes les procédures tRPC).
- AuthGuard appliqué globalement — 18 endpoints explicitement marqués publics avec décorateurs dédiés.
- Pas de données sensibles dans les logs (tokens, secrets non loggués).

### 2.5 Qualité du code
- **Pattern Result<T, E>** pour la gestion d'erreurs côté backend (unions discriminées).
- **Sentry** intégré pour le monitoring d'erreurs en production.
- Lazy loading stratégique des composants lourds (Bryntum, Sentry, Crisp).
- ESLint 9 (flat config) avec règles TypeScript strictes (`no-non-null-assertion: error`, `no-explicit-any: warn`).
- Storybook 10 pour la documentation des composants UI.
- Swagger/OpenAPI pour la documentation API (`/api-docs/v1`).

---

## 3. Points faibles et risques

### 3.1 Sécurité — Priorité Haute

#### 3.1.1 CSP `unsafe-inline` en production
**Fichiers :** `apps/auth/proxy.ts`, `apps/panier/proxy.ts`

```
script-src: 'self' 'unsafe-inline'  // En production !
```

Un commentaire TODO existe dans le code : *"TODO: supprimer cette ligne et rétablir la précédente"*.

- **Risque :** Vulnérabilité XSS — les scripts inline sont autorisés.
- **Recommandation :** Implémenter un CSP basé sur des nonces ou migrer vers des scripts externes uniquement.

#### 3.1.2 Absence de headers de sécurité (helmet.js)
**Fichier :** `apps/backend/src/main.ts`

Le backend NestJS ne configure **aucun header de sécurité HTTP** :
- Pas de `X-Frame-Options` (clickjacking)
- Pas de `X-Content-Type-Options` (MIME sniffing)
- Pas de `Strict-Transport-Security` (HSTS)
- Pas de CSP sur les réponses API

- **Risque :** Surface d'attaque élargie — headers défensifs standards manquants.
- **Recommandation :** Ajouter `@nestjs/helmet` ou `helmet` middleware dans `main.ts`.

#### 3.1.3 XSS non sanitisé dans l'import de plan
**Fichier :** `apps/app/src/app/pages/Support/ImporterPlan/importer-plan.page.tsx`

```tsx
dangerouslySetInnerHTML={{ __html: errorMessage }}  // ⚠️ Pas de DOMPurify !
```

Contrairement aux autres usages de `dangerouslySetInnerHTML` (qui utilisent correctement `DOMPurify.sanitize()`), le message d'erreur ici est injecté **sans sanitisation**. Si le message d'erreur tRPC contient de l'input utilisateur, c'est un vecteur XSS.

- **Risque :** XSS reflété via messages d'erreur.
- **Recommandation :** Appliquer `DOMPurify.sanitize(errorMessage)` ou utiliser du texte React natif.

#### 3.1.4 CORS permissif avec credentials
**Fichier :** `apps/backend/src/main.ts`

```typescript
app.enableCors({
  origin: true,  // Reflète n'importe quelle origine
  credentials: true,
});
```

De plus, les fonctions Supabase Edge utilisent `Access-Control-Allow-Origin: '*'` dans `supabase/functions/_shared/cors.ts`.

- **Risque :** Potentiel CSRF si des cookies sont utilisés.
- **Atténuation actuelle :** JWT en header Authorization (pas de cookie). Utilitaire `isAllowedOrigin` existe dans `packages/api` mais n'est pas appliqué partout.
- **Recommandation :** Restreindre les origines autorisées à une whitelist explicite en production.

#### 3.1.5 Webhooks sans vérification HMAC
**Fichier :** `apps/tools/src/webhooks/webhook-consumer.service.ts`

Les webhooks ne supportent que Bearer token et Basic auth, sans vérification de signature HMAC des payloads.

- **Risque :** Un attaquant pourrait forger des payloads webhook valides si le token est compromis.
- **Recommandation :** Implémenter la vérification HMAC-SHA256 sur les payloads entrants.

#### 3.1.6 Politiques RLS partiellement permissives
Certaines tables ont des politiques RLS ouvertes :

```sql
-- data_layer/sqitch/deploy/collectivite/rls.sql
create policy allow_read on filtre_intervalle using (true);

-- data_layer/sqitch/deploy/evaluation/rls.sql
create policy allow_read on client_scores using (true);
```

- **Risque :** Toutes les données de ces tables sont lisibles par tous les utilisateurs authentifiés.
- **Recommandation :** Documenter explicitement quelles tables sont intentionnellement publiques. Auditer systématiquement les politiques RLS.

### 3.2 Tests — Priorité Moyenne

#### 3.2.1 Couverture de tests faible
- **101 fichiers de test** pour **~3 309 fichiers source** → ratio ~3%.
- Tests concentrés sur les chemins critiques (backend, API), mais beaucoup de composants frontend non testés.
- Pas de rapport de couverture automatisé dans la CI.

**Recommandation :**
- Définir un seuil minimum de couverture (ex: 40-60%).
- Ajouter des rapports de couverture dans la CI avec `vitest --coverage`.
- Prioriser les tests sur les modules critiques : auth, scoring, accès données.

#### 3.2.2 Pas de git hooks (pre-commit)
- Aucune configuration **husky** ou **lint-staged** détectée.
- Les vérifications de qualité ne sont appliquées qu'en CI (délai de feedback).

**Recommandation :** Installer `husky` + `lint-staged` pour lint et format au commit.

### 3.3 Architecture — Priorité Moyenne

#### 3.3.1 Dépendances lourdes non surveillées
Le projet embarque des dépendances volumineuses :
- **Bryntum Scheduler** (composant commercial lourd)
- **Nivo** (6 sous-packages de visualisation)
- **echarts**, **Leaflet**, **react-pdf**, **exceljs**, **pptx-automizer**

Pas de monitoring automatisé de la taille du bundle.

**Recommandation :**
- Ajouter `@next/bundle-analyzer` pour suivre la taille du bundle.
- Vérifier que le tree-shaking fonctionne correctement pour Nivo et autres.

#### 3.3.2 Strapi en version legacy
`strapi/` utilise Strapi 4.25.20 avec Node 16-18 — incompatible avec le Node 24 du reste du projet.

**Recommandation :** Planifier la migration vers Strapi 5 ou évaluer des alternatives.

### 3.4 Qualité du code — Priorité Basse

#### 3.4.1 Documentation inline inconsistante
- JSDoc présent dans certains fichiers (`packages/api`) mais absent de la majorité.
- Documentation en français (cohérent avec le projet gouvernemental).

#### 3.4.2 TypeScript strict incomplet
Certaines vérifications désactivées dans tsconfig :
- `noFallthroughCasesInSwitch: false`
- `noImplicitReturns: false`
- `noUnusedLocals: false`

**Recommandation :** Activer progressivement ces vérifications.

#### 3.4.3 Tests Cypress dépréciés non supprimés
Le dossier `e2e-cypress-deprecated/` existe encore.

**Recommandation :** Supprimer pour réduire le bruit et la dette technique.

---

## 4. Sécurité — Analyse OWASP Top 10

| # | Catégorie OWASP | Statut | Détail |
|---|-----------------|--------|--------|
| A01 | Broken Access Control | ⚠️ Moyen | RLS partiellement permissives, CORS ouvert |
| A02 | Cryptographic Failures | ✅ OK | JWT Supabase, HTTPS enforced |
| A03 | Injection | ✅ OK | Requêtes paramétrées, pas de SQL brut |
| A04 | Insecure Design | ✅ OK | Architecture DDD, ADR, patterns solides |
| A05 | Security Misconfiguration | ⚠️ Haut | CSP unsafe-inline en prod, absence de helmet.js, CORS wildcard sur Edge Functions |
| A06 | Vulnerable Components | ⚠️ Faible | Pas d'audit pnpm automatisé en CI |
| A07 | Auth Failures | ✅ OK | Supabase Auth, rate limiting, JWT |
| A08 | Software/Data Integrity | ✅ OK | Lock file, CI vérifiée |
| A09 | Logging/Monitoring | ✅ OK | Sentry, Logger NestJS |
| A10 | SSRF | ✅ OK | Pas de fetch dynamique côté serveur non contrôlé |

---

## 5. Considérations OSS (Open Source)

### Points positifs
- **Licence et contribution** : processus de sécurité documenté (SECURITY.md).
- **ADR publiques** : transparence sur les décisions architecturales.
- **Stack standard** : technologies mainstream facilitant les contributions.
- **DSFR** : conformité avec les standards du gouvernement français.

### Points d'amélioration
| Aspect | État | Recommandation |
|--------|------|----------------|
| **CONTRIBUTING.md** | Absent à la racine | Créer un guide de contribution clair |
| **CODE_OF_CONDUCT.md** | Non détecté | Ajouter (standard pour les projets gov) |
| **Issue templates** | Non vérifiés | Créer des templates (bug, feature, security) |
| **CLAUDE.md** | Absent | Ajouter pour guider les contributeurs IA |
| **pnpm audit en CI** | Absent | Ajouter `pnpm audit --audit-level=high` dans la CI |
| **Dependabot/Renovate** | Non détecté | Activer pour les mises à jour automatiques de dépendances |
| **License file** | Non vérifié à la racine | S'assurer qu'une licence OSS est présente |

---

## 6. Analyse architecturale du backend — Vision DDD

### 6.1 Structure des modules

Le backend NestJS (`apps/backend/src/`) est organisé en **5 domaines métier** + infrastructure :

```
src/
├── collectivites/          # Gestion des collectivités territoriales
│   ├── collectivite-crud/  #   CRUD de base
│   ├── discussions/        #   Fil de discussion (le module le plus DDD)
│   ├── documents/          #   Upload / stockage de documents
│   ├── membres/            #   Membres d'une collectivité
│   ├── personnalisations/  #   Personnalisation des référentiels
│   ├── recherches/         #   Recherche fulltext
│   ├── tableau-de-bord/    #   Dashboard / widgets
│   └── tags/               #   Tags personnalisés
├── indicateurs/            # Indicateurs et trajectoires
│   ├── definitions/        #   Définitions d'indicateurs
│   ├── valeurs/            #   Saisie des valeurs
│   ├── trajectoires/       #   Calcul de trajectoires SNBC
│   ├── import/             #   Import de données
│   └── sources/            #   Sources de données externes
├── plans/                  # Plans d'action
│   ├── plans/              #   CRUD plans (Get/List/Upsert/Delete)
│   ├── fiches/             #   Fiches action (entité la plus complexe)
│   ├── axes/               #   Arborescence d'axes
│   ├── paniers/            #   Panier d'actions prédéfinies
│   └── reports/            #   Génération de rapports (PDF/PPTX)
├── referentiels/           # Référentiels de notation (CAE, ECI)
│   ├── compute-score/      #   Moteur de calcul de scores
│   ├── definitions/        #   Définitions d'actions référentiel
│   ├── labellisations/     #   Processus de labellisation
│   ├── snapshots/          #   Historique des scores
│   └── export-score/       #   Export de scores
├── users/                  # Utilisateurs et permissions
│   ├── apikeys/            #   Clés API (Argon2 + throttle)
│   ├── authorizations/     #   RBAC / permissions
│   ├── guards/             #   AuthGuard, JWT validation
│   └── preferences/        #   Préférences utilisateur
├── shared/                 # Services partagés inter-domaines
│   ├── thematiques/
│   ├── effet-attendu/
│   └── models/
├── metrics/                # Métriques plateforme
└── utils/                  # Infrastructure transversale
    ├── database/           #   DatabaseService (Drizzle + RLS)
    ├── trpc/               #   TrpcService + error handlers
    ├── transaction/        #   TransactionManager
    ├── bullmq/             #   Job queue (BullMQ)
    ├── email/              #   Service email
    ├── supabase/           #   Client Supabase
    └── ...                 #   Log, config, context, tracking, etc.
```

### 6.2 Analyse du layering

#### Architecture actuelle par module

Chaque module suit un pattern de découpage **par opération** :

```
plans/plans/
├── plans.module.ts              # Module NestJS
├── plans.router.ts              # Agrégateur de sous-routers
├── get-plan/
│   ├── get-plan.router.ts       # Présentation (tRPC)
│   ├── get-plan.service.ts      # Application (orchestration)
│   ├── get-plan.repository.ts   # Infrastructure (Drizzle)
│   ├── get-plan.schema.ts       # Input DTO (Zod)
│   └── get-plan.error-config.ts # Mapping erreurs → tRPC
├── list-plans/
│   ├── list-plans.router.ts
│   ├── list-plans.service.ts
│   └── list-plans.repository.ts
├── upsert-plan/
│   ├── upsert-plan.router.ts
│   ├── upsert-plan.service.ts
│   └── upsert-plan.repository.ts
└── delete-plan/
    ├── delete-plan.router.ts
    ├── delete-plan.service.ts
    └── delete-plan.repository.ts
```

#### Couches identifiées

| Couche | Fichiers | Implémenté | Observations |
|--------|----------|------------|--------------|
| **Présentation** | `*.router.ts` | ✅ Bien | tRPC procedures, validation Zod, conversion erreurs |
| **Application** | `*.service.ts`, `*-application.service.ts` | ⚠️ Mixte | Orchestration + logique métier mélangées |
| **Domaine** | `packages/domain/src/**/*.schema.ts`, `*.rule.ts` | ❌ Anémique | Schémas Zod uniquement, pas d'entités riches |
| **Infrastructure** | `*.repository.ts`, `database.service.ts` | ✅ Correct | Drizzle ORM, transaction-aware |

### 6.3 Pattern Repository — Analyse détaillée

#### Segmentation par opération (non par agrégat)

Le choix architectural est **1 repository = 1 opération CRUD**, et non 1 repository = 1 agrégat :

```typescript
// ❌ Pattern actuel : segmentation par opération
GetPlanRepository      // SELECT plan + joins
ListPlansRepository    // SELECT plans avec filtres
UpsertPlanRepository   // INSERT/UPDATE plan + relations
DeletePlanRepository   // DELETE plan

// ✅ Pattern DDD : 1 repository par agrégat
PlanRepository {
  findById(id): Plan
  findAll(filters): Plan[]
  save(plan): void
  delete(id): void
}
```

**Avantages du pattern actuel :**
- Fichiers courts et focalisés (~50-150 lignes)
- Facile de trouver le code d'une opération
- Chaque repository est testable indépendamment

**Inconvénients :**
- Pas de notion d'agrégat — le `Plan` n'est pas une unité de cohérence
- Relations (pilotes, référents, axes) gérées dans des méthodes séparées sans cohésion
- Duplication de jointures entre Get et List
- Pas d'invariant d'agrégat vérifiable côté repository

#### Implémentation technique

```typescript
// get-plan.repository.ts — Pattern typique
@Injectable()
export class GetPlanRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getPlan(
    { planId, collectiviteId }: GetPlanInput,
    tx?: Transaction
  ): Promise<Result<PlanRow, GetPlanError>> {
    const db = tx ?? this.databaseService.db;
    const result = await db
      .select()
      .from(planActionTable)
      .where(and(
        eq(planActionTable.id, planId),
        eq(planActionTable.collectiviteId, collectiviteId)
      ))
      .limit(1);

    if (!result.length) {
      return { success: false, error: GetPlanErrorEnum.PLAN_NOT_FOUND };
    }
    return { success: true, data: result[0] };
  }
}
```

**Points positifs :**
- Transaction optionnelle (`tx?: Transaction`) — permet la composition transactionnelle
- `Result<T, E>` systématique — pas d'exceptions pour les erreurs métier
- Drizzle ORM avec requêtes typées — pas de SQL brut

**Point d'attention :**
- Pas d'interface abstraite (sauf `DiscussionRepository`) — couplage direct à Drizzle
- Impossible de mock facilement pour les tests unitaires sans DI sur interface

### 6.4 Service Layer — Analyse critique

#### Trois types de services identifiés

**Type 1 : Services d'orchestration simples** (majorité)

```typescript
// get-plan.service.ts — Agrège données de plusieurs repositories
@Injectable()
export class GetPlanService {
  async getPlan(input, user?, tx?): Promise<Result<PlanWithDetails, Error>> {
    // 1. Récupère le plan
    const planResult = await this.getPlanRepo.getPlan(input, tx);
    // 2. Vérifie les permissions
    if (!await this.checkPermission(plan.collectiviteId, user)) { ... }
    // 3. Récupère les axes
    const axes = await this.axeRepo.listAxes(planId, tx);
    // 4. Récupère les pilotes
    const pilotes = await this.getPlanRepo.getPilotes(planId, tx);
    // 5. Récupère les référents
    const referents = await this.getPlanRepo.getReferents(planId, tx);
    // 6. Calcule le budget
    const budget = this.computeBudgetRules.computeBudget(fiches);
    // 7. Assemble et retourne
    return { success: true, data: { ...plan, axes, pilotes, referents, budget } };
  }
}
```

**Type 2 : Application Services** (module discussions — le plus proche de DDD)

```typescript
// discussion-application.service.ts
@Injectable()
export class DiscussionApplicationService {
  constructor(
    private readonly discussionDomainService: DiscussionDomainService,
    private readonly discussionRepo: DiscussionRepository,  // ← Interface !
    private readonly permissionService: PermissionService,
  ) {}

  async createDiscussion(input, user): Promise<Result<Discussion, Error>> {
    // 1. Vérifie permissions
    await this.permissionService.check(user, input.collectiviteId);
    // 2. Délègue au domain service pour la logique métier
    return this.discussionDomainService.create(input, user);
  }
}
```

**Type 3 : Services "fat"** (anti-pattern)

```typescript
// create-fiche.service.ts — 343 lignes, fait TOUT
@Injectable()
export class CreateFicheService {
  async createFiche(input, user, tx?): Promise<Result<Fiche, Error>> {
    // 1. Permission check
    // 2. Insert fiche principale
    // 3. Ajoute thématiques (helper interne)
    // 4. Ajoute sous-thématiques
    // 5. Ajoute effets attendus
    // 6. Ajoute partenaires
    // 7. Ajoute structures
    // 8. Ajoute services
    // 9. Ajoute financeurs
    // 10. Ajoute pilotes
    // 11. Ajoute référents
    // 12. Ajoute actions
    // 13. Ajoute impacts
    // 14. Ajoute budget
    // 15. Retourne fiche complète
  }
}
```

#### Critique architecturale

| Aspect | État | Commentaire |
|--------|------|-------------|
| **Responsabilité unique** | ⚠️ Variable | Certains services orchestrent bien, d'autres sont des "god services" |
| **Permission checks** | ⚠️ Dupliqué | Chaque service vérifie les permissions — devrait être un aspect/intercepteur |
| **Transaction management** | ✅ Bien | Pattern `tx?: Transaction` cohérent, `TransactionManager` disponible |
| **Séparation read/write** | ⚠️ Partielle | Get/List séparés de Upsert/Delete mais pas de CQRS formel |
| **Composition** | ⚠️ Faible | Les services se composent rarement entre eux — logique dupliquée |

### 6.5 Modèle de domaine — Anti-pattern anémique

#### Le package `@tet/domain` : un pur schéma de validation

Le package domaine (`packages/domain/src`) ne contient **aucune entité riche**. C'est un catalogue de :

- **Schémas Zod** pour la validation d'entrée/sortie
- **Enums** pour les statuts et priorités
- **Types inférés** (`type Fiche = z.infer<typeof ficheSchema>`)
- **Fonctions utilitaires** dispersées dans des fichiers `*.rule.ts` et `*.utils.ts`

```typescript
// ❌ Ce qui existe : un sac de données
export const ficheSchema = z.object({
  id: z.number(),
  titre: z.string().nullable(),
  statut: z.enum(statutEnumValues).nullable(),
  priorite: z.enum(prioriteEnumValues).nullable(),
  dateDebut: z.string().nullable(),
  dateFin: z.string().nullable(),
  budgetPrevisionnel: z.string().nullable(),
  // ... 20+ champs sans comportement
});

// Logique métier externalisée dans un fichier utilitaire séparé
export const isFicheOnTime = ({ statut, dateFin }: Pick<Fiche, ...>): boolean => {
  if (statut === StatutEnum.REALISE || statut === StatutEnum.ABANDONNE) return true;
  if (!dateFin) return true;
  return isBefore(new Date(Date.now()), new Date(dateFin));
};
```

```typescript
// ✅ Ce qui serait souhaitable : une entité riche
class FicheAction {
  private constructor(private props: FicheProps) {
    this.validate();
  }

  get isOnTime(): boolean {
    if (this.isTerminee) return true;
    if (!this.props.dateFin) return true;
    return isBefore(new Date(), this.props.dateFin);
  }

  get isTerminee(): boolean {
    return [StatutEnum.REALISE, StatutEnum.ABANDONNE].includes(this.props.statut);
  }

  changerStatut(nouveau: Statut): Result<void, FicheError> {
    // Invariants métier vérifiés ici
    if (this.isTerminee && nouveau !== StatutEnum.EN_COURS) {
      return { success: false, error: 'CANNOT_CHANGE_TERMINAL_STATUS' };
    }
    this.props.statut = nouveau;
    return { success: true, data: undefined };
  }
}
```

#### Conséquences de l'anémie

1. **Logique métier éparpillée** : entre `*.rule.ts`, `*.utils.ts`, et les services backend
2. **Pas d'invariants métier** : aucune garantie qu'une `Fiche` est dans un état cohérent
3. **Duplication** : la même logique peut exister côté frontend et backend
4. **Tests unitaires difficiles** : il faut mocker l'infrastructure pour tester une règle métier

### 6.6 Intégration tRPC

#### Pattern Router → Service → Repository

```
┌─────────────┐    ┌──────────────┐    ┌────────────────┐    ┌─────────┐
│ tRPC Router │───▶│   Service    │───▶│  Repository    │───▶│ Drizzle │
│ (.router.ts)│    │ (.service.ts)│    │(.repository.ts)│    │   ORM   │
└─────────────┘    └──────────────┘    └────────────────┘    └─────────┘
       │                  │                     │
  Zod Input          Permission           Transaction
  Validation          Check               Awareness
  Error → TRPCError   Result<T,E>         Result<T,E>
```

#### Cohérence et qualité

```typescript
// Pattern tRPC systématique et bien appliqué
@Injectable()
export class GetPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: GetPlanService,
  ) {}

  private readonly handle = createTrpcErrorHandler(getPlanErrorConfig);

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(getPlanInputSchema)       // ← Validation Zod
      .query(async ({ input, ctx }) => {
        const result = await this.service.getPlan(input, ctx.user);
        return this.handle(result);     // ← Result → TRPCError
      }),
  });
}
```

**Points forts :**
- Pattern uniforme sur 70+ routers
- Validation systématique avec Zod
- Conversion centralisée `Result<T,E>` → `TRPCError` via `createTrpcErrorHandler`
- Séparation `authedProcedure` / `publicProcedure`

**Points faibles :**
- Deux styles d'error handling coexistent (`createTrpcErrorHandler` vs manuel)
- Les routers sont très fins → overhead de fichiers (4-6 fichiers par opération)

### 6.7 Gestion des erreurs — Pattern Result

Le pattern `Result<T, E>` est **le meilleur choix architectural du backend** :

```typescript
// utils/result.type.ts
export type Result<Data, ServiceError, Cause extends Error = Error> =
  | { success: true; data: Data }
  | { success: false; error: ServiceError; cause?: Cause };
```

#### Propagation à travers les couches

```typescript
// Repository → retourne Result
async getPlan(input, tx?): Promise<Result<PlanRow, GetPlanError>> {
  if (!result.length) {
    return { success: false, error: GetPlanErrorEnum.PLAN_NOT_FOUND };
  }
  return { success: true, data: result[0] };
}

// Service → propage ou enrichit
async getPlan(input, user?): Promise<Result<PlanDetails, GetPlanError>> {
  const planResult = await this.repo.getPlan(input, tx);
  if (!planResult.success) return planResult;  // ← Propagation directe
  // ... enrichissement
  return { success: true, data: enrichedPlan };
}

// Router → convertit en TRPCError
const result = await this.service.getPlan(input, ctx.user);
return this.handle(result);  // ← Success → data, Failure → throw TRPCError
```

#### Qualité : erreurs typées par domaine

```typescript
// Chaque module définit ses erreurs
const specificErrors = ['PLAN_NOT_FOUND', 'GET_PILOTES_ERROR'] as const;
export const GetPlanErrorEnum = createErrorsEnum(specificErrors);

// Avec mapping vers codes HTTP/tRPC
export const getPlanErrorConfig = {
  specificErrors: {
    PLAN_NOT_FOUND: { code: 'NOT_FOUND', message: "Le plan n'a pas été trouvé" },
  },
};
```

### 6.8 Cross-cutting concerns

| Concern | Implémentation | Qualité |
|---------|----------------|---------|
| **Logging** | `CustomLogger` + `ContextStoreService` (userId, role dans chaque log) | ✅ Bien |
| **Transactions** | `TransactionManager.executeSingle()`, `tx?: Transaction` passé partout | ✅ Bien |
| **RLS** | `DatabaseService.rls(user)` → set_config JWT avant chaque tx | ✅ Bien |
| **Permissions** | `PermissionService.check()` appelé dans chaque service | ⚠️ Dupliqué — devrait être un aspect |
| **Tracking** | `ApiTrackingInterceptor` + Sentry context | ✅ Bien |
| **Caching** | ❌ Absent — aucune couche de cache applicatif | ❌ Manquant |
| **Events** | ❌ Absent — pas de domain events, seulement webhooks HTTP | ❌ Manquant |
| **Retry** | BullMQ pour les jobs asynchrones uniquement | ⚠️ Partiel |

### 6.9 Incohérences de nommage

| Pattern | Exemples | Problème |
|---------|----------|----------|
| **Service naming** | `GetPlanService` vs `DiscussionApplicationService` vs `CreateFicheService` | Pas de convention unique |
| **Repository naming** | `GetPlanRepository` vs `DiscussionRepositoryImpl` | `Impl` suffix inconsistant |
| **Langue** | Tables FR (`fiche_action`), services EN (`GetPlanService`), erreurs FR ("Le plan n'a pas été trouvé") | Mix FR/EN |
| **Fichiers** | `get-plan.service.ts` vs `discussion-application.service.ts` | Granularité variable |
| **Domain service** | Seul `DiscussionDomainService` existe | Convention non généralisée |

### 6.10 Le module Discussions — Modèle à suivre

Le module `collectivites/discussions/` est le **seul module qui implémente un layering DDD propre** :

```
discussions/
├── application/
│   ├── discussion-application.service.ts    # Orchestration + permissions
│   └── discussion-query.service.ts          # Lecture
├── domain/
│   ├── discussion-domain-service.ts         # Logique métier
│   └── discussion.repository.ts             # Interface abstraite (!)
├── infrastructure/
│   └── discussion-repository-impl.ts        # Implémentation Drizzle
├── list-discussion/
│   └── list-discussion.service.ts
└── discussion.router.ts
```

**Ce qui est bien :**
- `DiscussionRepository` est une **interface** (le seul du projet)
- `DiscussionRepositoryImpl` implémente l'interface → mockable pour les tests
- `DiscussionDomainService` contient la logique métier
- `DiscussionApplicationService` ne fait qu'orchestrer

**Ce qui manque pour être exemplaire :**
- Pas d'entité `Discussion` riche (toujours des schémas Zod)
- Pas de domain events (`DiscussionCreated`, `CommentAdded`)

### 6.11 Synthèse et recommandations DDD

#### Matrice de maturité DDD

| Critère | Score | Détail |
|---------|-------|--------|
| **Bounded Contexts** | 6/10 | Modules bien séparés mais pas de context map explicite |
| **Entités / Agrégats** | 2/10 | Anémique — schémas Zod sans comportement |
| **Value Objects** | 2/10 | Simples enums, pas de VO typés (ex: `CollectiviteId`) |
| **Domain Services** | 3/10 | Un seul (`DiscussionDomainService`), logique dans les app services |
| **Repositories** | 5/10 | Fonctionnels mais sans interface (sauf Discussions) |
| **Application Services** | 6/10 | Présents mais trop gros, mélangent orchestration et logique |
| **Domain Events** | 0/10 | Inexistants |
| **Ubiquitous Language** | 4/10 | Termes métier FR dans les tables, mais mix FR/EN dans le code |
| **Anti-corruption Layer** | 5/10 | Zod valide les entrées, mais pas de mapping entité ↔ persistence |

**Score DDD global : 3.5/10**

#### Recommandations architecturales prioritaires

**1. Généraliser le pattern Discussions à tous les modules**
Le module `discussions/` est la preuve de concept interne. Appliquer progressivement :
- Interfaces repository dans chaque module
- Séparation `application/` vs `domain/` vs `infrastructure/`
- Domain services pour la logique métier

**2. Enrichir le modèle de domaine**
Transformer les schémas Zod en entités riches progressivement, en commençant par `FicheAction` (l'entité la plus complexe) :
- Encapsuler les invariants (`isFicheOnTime`, `changerStatut`, `ajouterBudget`)
- Créer des Value Objects typés (`PlanId`, `CollectiviteId`, `Statut`)
- Extraire un mapper `FicheMapper` pour la conversion entité ↔ persistence

**3. Dégraisser les services "fat"**
`CreateFicheService` (343 lignes) devrait être décomposé :
- `FicheFactory` pour la création avec ses relations
- `FicheRelationsService` pour la gestion des associations
- Ou mieux : méthodes sur l'agrégat `FicheAction`

**4. Extraire les permissions en aspect**
Le check `await this.permissionService.check(user, collectiviteId)` est dupliqué dans **chaque service**. Alternatives :
- Intercepteur NestJS sur les routes
- Décorateur `@RequirePermission(PermissionLevel.WRITE)` sur les méthodes
- Guard tRPC middleware

**5. Introduire des Domain Events**
Pour découpler les modules (notifications, webhooks, audit) :
```typescript
// Exemple : quand une fiche change de statut
ficheAction.changerStatut(StatutEnum.REALISE);
// → émet FicheStatutChangedEvent
// → déclenche notification aux pilotes
// → déclenche webhook externe
// → met à jour les indicateurs liés
```

**6. Standardiser le nommage**
Choisir une convention unique et l'appliquer (ADR recommandée) :
- `{Feature}QueryService` pour les lectures
- `{Feature}CommandService` pour les écritures
- `{Feature}Repository` (interface) + `Drizzle{Feature}Repository` (impl)
- Tout en anglais ou tout en français — pas de mix

---

## 7. Plan d'action recommandé

### Immédiat (Sprint en cours)
1. **Ajouter helmet.js** au backend NestJS (`apps/backend/src/main.ts`) — headers de sécurité manquants.
2. **Corriger CSP unsafe-inline** dans `apps/auth/proxy.ts` et `apps/panier/proxy.ts`.
3. **Sanitiser errorMessage** dans `apps/app/src/app/pages/Support/ImporterPlan/importer-plan.page.tsx` (XSS).
4. **Restreindre CORS** à une whitelist d'origines en production (backend + Supabase Edge Functions).
5. **Ajouter `pnpm audit`** dans le workflow CI.

### Court terme (1-2 sprints)
6. Auditer et documenter la stratégie RLS — identifier les tables intentionnellement publiques.
7. **Implémenter la vérification HMAC** pour les webhooks (`apps/tools/src/webhooks/`).
8. Installer **husky + lint-staged** pour les pre-commit hooks.
9. Ajouter **couverture de tests** avec seuil dans la CI.
10. Créer **CONTRIBUTING.md** et **CODE_OF_CONDUCT.md**.
11. Activer **Dependabot** ou **Renovate** pour le suivi des dépendances.
12. Restreindre le passage du token JWT aux headers uniquement (supprimer le support query params dans `auth.guard.ts`).
13. **Généraliser le pattern Discussions** (interface repository, séparation domain/application) aux modules Plans et Fiches.
14. **Extraire les permission checks en intercepteur** NestJS pour éliminer la duplication.

### Moyen terme (1-3 mois)
15. Activer les vérifications TypeScript manquantes (`noImplicitReturns`, etc.).
16. Ajouter le monitoring de taille de bundle (`@next/bundle-analyzer`).
17. Supprimer `e2e-cypress-deprecated/`.
18. Planifier la migration Strapi 4 → 5.
19. Augmenter la couverture de tests vers 40%+ (prioriser auth, scoring, API).
20. **Enrichir le modèle de domaine** : transformer `FicheAction` en entité riche (invariants, méthodes, Value Objects).
21. **Standardiser le nommage** (QueryService/CommandService) via une ADR.
22. **Introduire les Domain Events** pour découpler notifications/webhooks/audit.

---

## 8. Conclusion

**Note globale : 7/10**

Le projet Territoires en Transitions est un projet OSS gouvernemental bien architecturé avec une stack moderne et des fondations solides. La séparation des concerns est claire, le typage end-to-end avec tRPC est excellent, et la pipeline CI/CD est robuste.

Les principaux axes d'amélioration concernent :
- Les **headers de sécurité HTTP** manquants (helmet.js) et la **CSP unsafe-inline** en production — le plus urgent.
- Une **XSS non sanitisée** dans la page d'import de plan.
- La **couverture de tests** insuffisante (~3%) pour un projet de cette taille.
- L'**outillage contributeur** (git hooks, guides de contribution) pour faciliter l'onboarding.
- La **gouvernance des dépendances** (166 vulnérabilités Dependabot, pas d'audit automatisé en CI).

Aucune vulnérabilité critique exploitable immédiatement n'a été détectée. Les bonnes pratiques de base sont en place (pas de secrets hardcodés, requêtes paramétrées, Argon2, Zod, AuthGuard global). Les risques identifiés sont principalement des **améliorations de configuration et de durcissement** (hardening) qui sont typiques d'un projet en développement actif.
