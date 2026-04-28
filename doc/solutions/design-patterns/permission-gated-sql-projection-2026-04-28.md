---
title: "Projection SQL conditionnelle : exposer un champ identitaire seulement aux utilisateurs autorisés"
category: design-patterns
date: 2026-04-28
problem_type: design_pattern
severity: medium
module: utils/banner
component: service_object
applies_when:
  - "Une même requête tRPC/REST est appelée par des callers privilégiés et non-privilégiés"
  - "Un sous-ensemble des champs renvoyés contient des identités d'utilisateurs ou métadonnées d'audit"
  - "On veut un seul endpoint, pas un endpoint parallèle gardé plus haut"
  - "Un PermissionService renvoie un booléen pour un couple (user, operation)"
tags:
  - drizzle
  - trpc
  - permissions
  - sql-projection
  - data-visibility
  - nestjs
  - sentinel
  - privacy
related_adr:
  - 0004-trpc.md
  - 0011-architecture-service-ddd.md
  - 0012-pattern-result.md
related_solutions:
  - architecture-patterns/extract-history-repository-from-service.md
related_plan: 2026-04-23-001-feat-banner-info-plan.md
---

# Projection SQL conditionnelle : exposer un champ identitaire seulement aux utilisateurs autorisés

## Context

Le widget `BannerInfo` est monté globalement dans `<SuperAdminModeProvider>` et affiche la bannière à **tout utilisateur connecté** (membres de collectivité, support, ADEME, etc.). La sortie de `banner.get` portait initialement un champ `modifiedByNom` construit via le helper SQL `createdByNom` (joint sur `dcpTable`) — c'est-à-dire le `prenom + nom` du dernier modificateur.

Conséquence : n'importe quel utilisateur connecté pouvait lire l'identité du SUPER_ADMIN qui avait dernièrement édité la bannière. Surface de divulgation durable (un agent du support ayant édité une bannière l'année dernière voit son nom exposé pendant des mois à tous les utilisateurs de la plateforme), pas une fuite ponctuelle.

Deux fausses pistes :

- **Splitter en deux endpoints** (`banner.get` pour tout le monde + `banner.getMetadata` réservé au support) : oblige la page d'édition à faire deux round-trips, duplique le typage de sortie, et déplace la logique « est-ce que je dois afficher l'auteur ? » côté frontend. Coût excessif pour un seul champ scalaire.
- **Garder le nom complet et redacter côté frontend** : tout consommateur direct de l'API (script, agent, futur SSR caller, intégration tierce) reçoit l'identité réelle. La redaction doit avoir lieu à la frontière de confiance, pas à l'affichage.

La bonne réponse : **résoudre la question au moment de la requête**. Demander une fois au `PermissionService` si l'utilisateur a la permission, puis passer à Drizzle soit l'expression SQL réelle, soit une sentinelle statique. Un endpoint, un round-trip, un type de sortie.

## Guidance

### 1. Le helper SQL d'affichage canonique

`createdByNom` vit dans `apps/backend/src/users/models/dcp.table.ts` et est déjà partagé par `labellisations`, `list-preuves`, `discussions`. **Ne le redéfinissez pas inline.**

```ts
// apps/backend/src/users/models/dcp.table.ts
export const createdByNom = sql<string>`CASE
  WHEN ${dcpTable.id} IS NULL THEN 'Utilisateur inconnu'
  WHEN ${dcpTable.limited} THEN 'Compte désactivé'
  WHEN ${dcpTable.deleted} THEN 'Compte supprimé'
  ELSE CONCAT(${dcpTable.prenom}, ' ', ${dcpTable.nom})
END`;
```

Le CASE traite tous les états dégénérés (FK NULL via `ON DELETE SET NULL`, compte désactivé/supprimé) et renvoie toujours une chaîne lisible. Les callers ne voient jamais de UUID brut ni de NULL.

### 2. La permission

Définir la permission dans le domaine partagé, puis l'accorder au rôle voulu :

```ts
// packages/domain/src/users/authorizations/permission-operation.enum.schema.ts
export const PermissionOperations = [
  // ...
  'users.authorizations.mutate_super_admin_role',

  // Utils
  'utils.banner.mutate',
] as const;
```

```ts
// packages/domain/src/users/authorizations/permission.models.ts
[PlatformRole.SUPER_ADMIN]: [
  ...collectiviteAdminPermissions,
  'collectivites.mutate',
  'plans.fiches.import',
  'utils.banner.mutate',
],
```

Pas de migration SQL : les permissions sont configurées en TypeScript par rôle dans `permissionsByRole`. Le `createEnumObject` du domaine expose ensuite `PermissionOperationEnum['UTILS.BANNER.MUTATE']` (clé majuscule, valeur originale en minuscules).

### 3. Le check de permission dans le service

```ts
const revealIdentity = await this.permissionService.isAllowed(
  user,                                            // AuthenticatedUser complet, PAS user.id
  PermissionOperationEnum['UTILS.BANNER.MUTATE'],
  ResourceType.PLATEFORME,
  null,                                            // pas de resource id — scope plateforme
  true                                             // doNotThrow : refus = sentinelle, pas d'exception
);
```

Le `doNotThrow=true` regroupe « pas de permission » et « erreur DB pendant le lookup permissions » dans `false`. Défaut sûr : en cas de doute, on affiche la sentinelle. Ne pas utiliser le mode throw — un refus n'est pas une exception, c'est juste le chemin de contenu non-privilégié.

**Toujours passer le `AuthenticatedUser` complet** (typé `user: AuthenticatedUser`). Le permission service a besoin du JWT payload, du rôle, etc. Un simple `userId: string` ne suffit pas et brise la convention utilisée partout dans le code (`upsertAxe(input, user)`, `getAxe(..., user)`, `metrics(user)`).

### 4. La projection conditionnelle

```ts
const MODIFIED_BY_SENTINEL = 'Équipe support';

@Injectable()
export class BannerService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  /**
   * Build the projection. When `revealIdentity` is true, the sensitive
   * field uses the real createdByNom helper (joined against dcpTable);
   * otherwise it uses the static sentinel. Same key, same SQL<string> type
   * either way — the inferred output shape is identical.
   */
  private projection(revealIdentity: boolean) {
    const modifiedByNomExpr: SQL<string> = revealIdentity
      ? createdByNom
      : sql<string>`${MODIFIED_BY_SENTINEL}`;

    return {
      type: bannerInfoTable.type,
      info: bannerInfoTable.info,
      active: bannerInfoTable.active,
      modifiedAt: bannerInfoTable.modifiedAt,
      modifiedByNom: modifiedByNomExpr,
    } as const;
  }
}
```

Le `as const` stabilise le type retourné. `.select(projection)` infère la forme de sortie depuis les **clés** de l'objet, pas depuis le contenu de chaque expression SQL — les deux branches produisent donc la même interface TypeScript. Le router, les tests et l'UI ne voient jamais de type union.

### 5. La requête

```ts
async get(user: AuthenticatedUser): Promise<BannerGetOutput> {
  const revealIdentity = await this.permissionService.isAllowed(
    user,
    PermissionOperationEnum['UTILS.BANNER.MUTATE'],
    ResourceType.PLATEFORME,
    null,
    true
  );
  const projection = this.projection(revealIdentity);

  const rows = await this.databaseService.db
    .select(projection)
    .from(bannerInfoTable)
    .leftJoin(dcpTable, eq(dcpTable.id, bannerInfoTable.modifiedBy))
    .limit(1);

  return rows[0] ?? null;
}
```

Le `leftJoin(dcpTable, ...)` est **inconditionnel**. Même quand la branche sentinelle est active, garder le join en place préserve la forme de la requête (plan d'exécution stable, code review plus simple) et permet à du code futur d'ajouter d'autres champs dérivés de `dcpTable` sans restructurer. Le coût est au pire un index lookup sur une table indexée — négligeable pour un singleton.

### 6. Le router passe le `ctx.user` complet

```ts
// banner.router.ts — utiliser authedProcedure (convention ADR 0004)
get: this.trpc.authedProcedure.query(async ({ ctx: { user } }) => {
  return this.bannerService.get(user);  // ✓ AuthenticatedUser complet
}),
```

```ts
// ✗ NE PAS écrire ceci — perd les claims JWT, le rôle, etc.
get: this.trpc.authedProcedure.query(async ({ ctx: { user } }) => {
  return this.bannerService.get(user.id);
}),
```

### 7. Sur les mutations, projection « réelle » d'office

Après un `upsert`, le caller vient de prouver la permission `mutate`. Le re-select post-écriture utilise toujours `projection(true)` : la réponse est immédiatement utilisable côté UI sans `get` de suivi.

```ts
async upsert(
  input: UpsertBannerInput,
  user: AuthenticatedUser
): Promise<Result<BannerOutput, BannerError>> {
  if (!(await this.canMutateBanner(user))) {
    return failure('BANNER_NOT_AUTHORIZED');
  }
  // ... write ...
  const [row] = await this.databaseService.db
    .select(this.projection(true))                            // toujours réel sur upsert
    .from(bannerInfoTable)
    .leftJoin(dcpTable, eq(dcpTable.id, bannerInfoTable.modifiedBy))
    .limit(1);
  return success(row);
}
```

## Why This Matters

**Posture privacy.** Renvoyer un prénom/nom à tout utilisateur connecté — quel que soit son rôle — est une violation du principe de minimisation des données. Le nom appartient à un agent du support qui peut raisonnablement attendre que son identité ne soit pas divulguée à tous les utilisateurs de la plateforme. La sentinelle (`Équipe support`) donne aux callers non-privilégiés toute l'information qu'ils ont besoin (« la bannière a été éditée par l'équipe support ») sans fuiter une identité individuelle.

**Defense-in-depth.** La redaction côté frontend ne suffit pas. N'importe quel consommateur direct de l'API (script, agent automatisé, futur SSR caller, intégration tierce) recevrait le vrai nom. La redaction doit être à la frontière de confiance, c'est-à-dire dans la requête SQL. Le CASE conditionnel garantit que la valeur sensible n'est jamais chargée en mémoire pour un caller non-privilégié — pas seulement masquée dans le navigateur.

**API ergonomics.** Un endpoint, un round-trip, un type de sortie. Le frontend n'a pas à choisir quelle procédure appeler. L'interface TypeScript est identique pour les deux niveaux de privilège. Les tests utilisent la même procédure. Le router reste mince.

**Cohérence avec le reste de l'app.** Le pattern réutilise les primitives déjà en place : `createdByNom` (déjà utilisé par `labellisations`, `list-preuves`, `discussions`), `permissionService.isAllowed(user, op, ResourceType, resourceId, doNotThrow)`, `AuthenticatedUser` comme type d'argument canonique. Aucune nouvelle abstraction.

## When to Apply

**Appliquer ce pattern quand :**

- La même requête est appelée par des callers privilégiés ET non-privilégiés, et splitter en deux endpoints ajouterait de la complexité côté client.
- Un sous-ensemble des champs renvoyés contient des identités, métadonnées d'audit, infos de contact, ou autre contenu sensible vis-à-vis de la vie privée.
- On veut un seul endpoint avec un seul type de sortie, pas une procédure parallèle gardée plus haut.
- Le `permissionService.isAllowed` est fiable et rapide pour un couple `(user, operation)`.
- Le contenu sensible est un scalaire ou un petit nombre de champs scalaires (nom, email, label de rôle) — pas une forme de résultat entièrement différente.

**NE PAS appliquer quand :**

- La version privilégiée a une forme différente : lignes supplémentaires, filtres différents, join coûteux que les callers non-privilégiés ne devraient pas payer. Un endpoint dédié avec un guard de permission plus haut est plus clair.
- Le lookup de permission est lui-même coûteux et `get` est appelé des milliers de fois par requête. Cacher le booléen en amont ou déplacer le guard dans une middleware.
- Le champ sensible est l'objet principal de l'endpoint (par exemple un audit log admin). Garder toute la procédure derrière une permission.
- On est tenté de redacter côté frontend plutôt qu'au niveau de la requête. Ce n'est jamais la bonne réponse, quel que soit le pattern choisi.

## Examples

### Exemple 1 — Avant (sentinelle pour tout le monde, pas de logique conditionnelle)

```ts
// Avant : tous les callers voient 'Équipe support', pas de join nécessaire
const rows = await this.databaseService.db
  .select({
    type: bannerInfoTable.type,
    info: bannerInfoTable.info,
    active: bannerInfoTable.active,
    modifiedAt: bannerInfoTable.modifiedAt,
    modifiedByNom: sql<string>`'Équipe support'`,  // statique, toujours
  })
  .from(bannerInfoTable)
  .limit(1);
```

État de départ : posture privacy correcte, mais le support ne peut pas voir qui a édité la bannière depuis la réponse API. La page d'édition n'a pas d'attribution.

### Exemple 2 — Après (helper de projection conditionnelle)

```ts
const MODIFIED_BY_SENTINEL = 'Équipe support';

@Injectable()
export class BannerService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  private projection(revealIdentity: boolean) {
    const modifiedByNomExpr: SQL<string> = revealIdentity
      ? createdByNom
      : sql<string>`${MODIFIED_BY_SENTINEL}`;
    return {
      type: bannerInfoTable.type,
      info: bannerInfoTable.info,
      active: bannerInfoTable.active,
      modifiedAt: bannerInfoTable.modifiedAt,
      modifiedByNom: modifiedByNomExpr,
    } as const;
  }

  private async canMutateBanner(user: AuthenticatedUser): Promise<boolean> {
    return this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['UTILS.BANNER.MUTATE'],
      ResourceType.PLATEFORME,
      null,
      true
    );
  }

  async get(user: AuthenticatedUser): Promise<BannerGetOutput> {
    const revealIdentity = await this.canMutateBanner(user);
    const rows = await this.databaseService.db
      .select(this.projection(revealIdentity))
      .from(bannerInfoTable)
      .leftJoin(dcpTable, eq(dcpTable.id, bannerInfoTable.modifiedBy))
      .limit(1);
    return rows[0] ?? null;
  }
}
```

Le type de sortie est identique pour les deux niveaux de privilège. La seule différence est le fragment SQL envoyé à Postgres.

### Exemple 3 — Tests : assertions sur les deux branches

```ts
const SENTINEL = 'Équipe support';

test('Caller without utils.banner.mutate sees the sentinel modifiedByNom', async () => {
  await databaseService.db.insert(bannerInfoTable).values({
    type: 'info', info: '<p>Hello</p>', active: true,
  });
  const caller = router.createCaller({ user: testUser });
  const result = await caller.banner.get();

  expect(result?.modifiedByNom).toBe(SENTINEL);
});

test('Caller with utils.banner.mutate sees the real modifier name', async () => {
  const caller = router.createCaller({ user: testUser });
  const { cleanup } = await addAndEnableUserSuperAdminMode({ app, caller, userId: testUser.id });
  onTestFinished(cleanup);

  await caller.banner.upsert({ type: 'info', info: '<p>Hello</p>', active: true });
  const result = await caller.banner.get();

  expect(result?.modifiedByNom).not.toBe(SENTINEL);
  expect(result?.modifiedByNom).toEqual(expect.any(String));
  expect((result?.modifiedByNom ?? '').trim().length).toBeGreaterThan(0);
});
```

Le test sentinelle utilise un user de test sans rôle particulier. Le test « real name » l'élève en SUPER_ADMIN actif via la fixture `addAndEnableUserSuperAdminMode`, déclenchant la permission `utils.banner.mutate` accordée au rôle.

## Related

- ADR `doc/adr/0004-trpc.md` — `authedProcedure`, `RouterInput`/`RouterOutput`.
- ADR `doc/adr/0011-architecture-service-ddd.md` — découpage des services NestJS, où placer la logique de projection.
- ADR `doc/adr/0012-pattern-result.md` — `Result<T, FeatureError>` pour le retour de `upsert` ; `BANNER_NOT_AUTHORIZED` est un échec typé qui suit la même convention.
- Plan `doc/plans/2026-04-23-001-feat-banner-info-plan.md` — origine de la feature ; les sections « Key Technical Decisions » et « Open Questions » documentent le choix initial du gate `SUPER_ADMIN` (avant d'être migré vers la permission `utils.banner.mutate`).
- Solution `doc/solutions/architecture-patterns/extract-history-repository-from-service.md` — cousin sur l'organisation des projections / repositories Drizzle ; pas un prérequis.
