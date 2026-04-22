# AuthorizationsModule — Scope & AccessPolicy

Infrastructure d'autorisation appliquée directement dans les services.

Status : **pilote**, consommé par :
- `collectivites/tags/personnes/` — cas simple (policy = ownership collectivité pur)
- `plans/fiches/` — cas avec partage multi-collectivité (policy = ownership OR sharing)

Le pilote fiches ne migre que `listFiches` (endpoint tRPC public) ; `bulk-edit`, `count-by`, `notify-pilote` appellent le même service sans scope et restent sur le flot legacy — à migrer séparément (BOLAs connues, cf. audit sécu).

## Pourquoi

Historiquement, l'authz vit dans les services via des appels `PermissionService.isAllowed()` opt-in. Conséquences :

- un nouvel endpoint qui oublie le check → faille silencieuse (BOLA/IDOR)
- check parfois fait après la lecture DB → fuite timing + query inutile
- couplage au transport (middleware tRPC, guards Nest) → portabilité worker/cron médiocre

Le pattern ici introduit deux briques qu'on peut ajouter à **n'importe quel service existant sans le refactorer** :

1. un `Scope` (userscope ou systemscope) en 1er argument des méthodes publiques
2. une `AccessPolicy<Table>` déclarative qui produit la clause `where` à injecter dans les queries Drizzle du service

La plus-value est visible sur une diff minimale : l'architecture legacy (DB dans le service, throws) reste, seule la couche authz change.

## Vocabulaire

### `Scope`

```ts
type Scope = UserScope | SystemScope
```

- `UserScope` — un utilisateur réel, rôles/permissions déjà résolus. Construit via `ScopeFactory.fromAuthenticatedUser(ctx.user)`.
- `SystemScope` — bypass intentionnel (workers, jobs, étapes internes post-auth). Construit via `systemScope(reason)`. Le `reason` est **obligatoire** et loggable — `grep 'systemScope('` donne l'audit complet des bypasses.

### `AccessPolicy<Table>`

```ts
type AccessPolicy<T extends PgTable> = {
  read:  (input: { table: T; scope: Scope }) => SQL | undefined
  write: (input: { table: T; scope: Scope }) => SQL | undefined
}
```

Sémantique du retour :

| Retour | Signification |
|---|---|
| `undefined` | bypass complet (system scope ou permission plateforme) |
| `sql\`1 = 0\`` | refus total (utilisateur sans aucune collectivité accessible) |
| autre `SQL` | clause à composer en `and(...)` avec le `where` métier |

### Primitives

- `hasPlatformBypass({ scope, permission })` — `true` si le scope bypasse tout filtre (système OU permission plateforme type `SUPER_ADMIN`).
- `accessibleCollectiviteIds({ scope, permission })` — liste des ids de collectivités où le scope a la permission (via rôle collectivité ou audit).
- `ownedByAccessibleCollectivite({ table, scope, permission })` — `table.collectiviteId in (…)` pour les cas scoping pur ; `sql\`1 = 0\`` si aucune collectivité.

Pour les cas avec **partage** (ex. fiches), composer directement dans la policy — voir `plans/fiches/shared/fiche-action.policy.ts` : `ownedOrSharedWithAccessibleCollectivite` utilise `accessibleCollectiviteIds` + un `EXISTS` sur la table de partage.

### Check hors SQL

Certaines vérifications ne se traduisent pas en filtre (« puis-je muter la collectivité **cible** ? »). Utiliser `scopeHasPermission(scope, operation, { collectiviteId })` dans le service avant d'entamer la transaction.

## Intégration dans un service legacy

Voir `collectivites/tags/personnes/personne-tag.service.ts` — **c'est le before/after qui compte** :

**Avant** :
```ts
async convertTagsToUser(userId, tagIds, collectiviteId, user, trx?) {
  await this.permissionService.isAllowed(user, 'COLLECTIVITES.TAGS.MUTATE', ...)
  // ...
  const tagsToAdd = await tx.select().from(personneTagTable)
    .where(inArray(personneTagTable.id, tagIds))
  // ...
}
```

**Après** :
```ts
async convertTagsToUser(scope, userId, tagIds, collectiviteId, trx?) {
  if (!scopeHasPermission(scope, 'collectivites.tags.mutate', { collectiviteId })) {
    throw new ForbiddenException(...)
  }
  // ...
  const tagsToAdd = await tx.select().from(personneTagTable)
    .where(this.withPolicy('write', scope, inArray(personneTagTable.id, tagIds)))
  // ...
}

private withPolicy(mode, scope, businessWhere) {
  const policyClause = personneTagPolicy[mode]({ table: personneTagTable, scope })
  if (policyClause === undefined) return businessWhere
  if (businessWhere === undefined) return policyClause
  return and(policyClause, businessWhere)
}
```

Ce qui a changé concrètement :
- 1er arg : `user: AuthUser` → `scope: Scope`
- `permissionService.isAllowed(...)` → `scopeHasPermission(...)` pour le check target
- chaque `.where(...)` → `.where(this.withPolicy(mode, scope, ...))`

Tout le reste (Drizzle, throws, `trx` optionnel, structure) est identique.

## Écrire une policy

Voir `collectivites/tags/personnes/personne-tag.policy.ts`, ~35 lignes. Composer `hasPlatformBypass` + `ownedByAccessibleCollectivite` pour le cas collectivité-scoped. Les primitives partagées sont le point d'extension quand un nouveau motif apparaît (ex. partage multi-collectivités pour `fiches`).

## Router

Le router résout le scope via la factory et délègue :

```ts
const scopeResult = await this.scopeFactory.fromAuthenticatedUser(ctx.user)
if (!scopeResult.success) throw new ForbiddenException()
return this.service.convertTagsToUser(scopeResult.data, ...)
```

Aucune logique authz dans le router — il sert juste à transformer `ctx.user` en `Scope`.

## Quand utiliser `SystemScope`

- workers / jobs / cron / CLI sans user tRPC
- étapes internes d'un workflow où l'authz vient d'être accordée dans la même transaction (`ScopeFactory` n'aurait pas encore les permissions fraîches)
- tests d'intégration

Toujours un `reason` **précis** et loggable — grep `systemScope(` est l'audit du bypass.

## Hors scope (pilote)

- DataLoader / cache request-scoped sur `ScopeFactory` (phase 2)
- tracing OpenTelemetry automatique (phase 2)
- audit log automatique (phase 2)
- extraction d'un repository dédié (si et seulement si la séparation DB/métier apporte suffisamment, pas pour ce pattern)
- ESLint rule qui imposerait `withPolicy` sur tout `.where(personneTagTable)` — à proposer si le pattern s'étend
