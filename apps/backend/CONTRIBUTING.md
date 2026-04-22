# Contributing — apps/backend

## Autorisation via Scope & AccessPolicy (pilote)

**Status** : pilote sur `collectivites/tags/personnes/`. Doc complète : [`src/authorizations/README.md`](./src/authorizations/README.md).

Le backend historique utilise `PermissionService.isAllowed()` opt-in. Pour les nouveaux endpoints (et les refactors de domaines sensibles), on privilégie un modèle où :

- les méthodes publiques du service prennent un `Scope` en 1er argument
- une `AccessPolicy<T>` déclarative produit la clause `where` injectée dans les queries Drizzle **existantes** du service
- le router résout le scope via `ScopeFactory.fromAuthenticatedUser(ctx.user)`

**Ce pattern n'impose pas d'extraire un repository.** L'architecture legacy (DB dans le service, throws) peut rester — seule la couche authz change.

### TL;DR pour un nouveau domaine

1. Créer `<domain>.policy.ts` avec `read` et `write` (voir `personne-tag.policy.ts` comme modèle).
2. Ajouter `scope: Scope` en 1er arg de chaque méthode publique du service.
3. Remplacer `permissionService.isAllowed(...)` par `scopeHasPermission(scope, op, resource)` pour les target-checks.
4. Wrapper chaque `.where(businessWhere)` avec `.where(withPolicy(mode, scope, businessWhere))`.
5. Router : résoudre le scope via `ScopeFactory.fromAuthenticatedUser(ctx.user)` et le passer au service.
6. Callsites internes (ex. `invitation.service`) : résoudre le scope localement, ou utiliser `systemScope(reason)` si l'authz vient d'être accordée dans la même transaction.

### Quand utiliser `SystemScope`

- workers, jobs, cron, CLI sans user tRPC
- étapes internes d'un workflow où l'authz vient d'être accordée dans la même transaction et où `ScopeFactory` n'aurait pas encore les permissions fraîches
- tests d'intégration

Toujours un `reason` **précis** et loggable — grep `systemScope(` est l'audit du bypass.

### Cas particuliers non couverts par la policy

La policy filtre sur la table de la ressource. Ne sont **pas** exprimables en SQL :

- **target-resource check** : « puis-je muter la collectivité **X** passée en input ? » → `scopeHasPermission(scope, op, { collectiviteId })` dans le service, avant la transaction.
- **invariants métier** : après un read policy-filtré, le service peut encore devoir vérifier la cohérence avec les autres paramètres de l'input (ex. « ce tag appartient-il à la collectivité cible ? »).

### Prochaines étapes (hors pilote)

- DataLoader / cache request-scoped du `UserRolesAndPermissions`
- Audit log automatique des `SystemScope` (via la `reason`)
- Migration d'un 2e domaine pour valider la portabilité du pattern (candidat suggéré : `documents` ou `fiches` partageables)
