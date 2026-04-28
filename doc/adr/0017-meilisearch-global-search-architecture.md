# 17. Recherche globale via Meilisearch — pipeline d'indexation interne

Date: 2026-04-28

## Statut

Accepted

## Contexte

Jusqu'à présent, chaque liste d'entités (`list-fiches`, `list-indicateurs`, `list-personnalisation-questions`, `get-referentiel`, etc.) implémentait sa propre recherche par sous-chaîne via `ilike` sur Postgres. Ce modèle force l'utilisateur à savoir *où* chercher avant de pouvoir chercher : pas de moyen de retrouver une fiche depuis la page indicateurs, ni de découvrir une mesure depuis n'importe où en dehors de l'arbre du référentiel. Les résultats n'ont aucun ranking, aucune tolérance aux fautes de frappe, aucun snippet contextuel.

Le besoin produit : une recherche globale type Notion — déclenchée par ⌘K depuis n'importe quelle page, retournant des résultats classés et highlightés à travers tout le produit (plans, fiches, indicateurs, mesures du référentiel, documents).

Plusieurs pistes ont été évaluées dans `doc/plans/2026-04-27-001-meilisearch-global-search-requirements.md` :

- **Postgres FTS** (`websearch_to_tsquery` + `ts_rank` + `ts_headline` + `pg_trgm`) — techniquement capable, mais demande sensiblement plus de glue code pour atteindre la même qualité d'expérience instant-search (tolérance aux fautes, ranking multi-attribut pondéré, snippets prêts à afficher).
- **Meilisearch** — moteur full-text dédié, déjà auto-hébergé sur Koyeb. UX instant-search "out-of-the-box".
- **Réutiliser le pipeline `WebhookService` existant** pour l'indexation — rejeté car cela conflerait deux contrats très différents (livraison externe vs indexation interne).

## Décision

### Moteur

**Meilisearch ≥ v1.10**, auto-hébergé sur Koyeb. Choix dicté par la qualité de l'expérience instant-search et le coût de glue code que représenterait une équivalent sur Postgres FTS. La v1.10 est le seuil minimum pour `localizedAttributes` (tokenizer français de qualité) et les améliorations de performance sur `multiSearch` de mars 2026. Les opérateurs `IS NULL` / `IS NOT NULL`, eux, sont disponibles depuis la v1.2.

### Topologie : proxy NestJS

Toutes les requêtes de recherche traversent un endpoint tRPC dédié dans `apps/backend/src/search/`. Meilisearch n'est **jamais** exposé directement au navigateur. Conséquences :

- Pas besoin de tenant tokens — le filtre multi-tenant est injecté côté backend (jamais reçu du client).
- Rotation de clé simplifiée — la master key reste côté serveur.
- On réutilise le middleware tRPC existant et la couche d'authentification.

### 5 index, 5 indexeurs par domaine, 1 wrapper SDK partagé

- **`SearchIndexerService`** dans `apps/backend/src/utils/search-indexer/` est un wrapper fin du SDK Meilisearch (`upsert`, `bulkUpsert`, `delete`, `multiSearch`, `swapIndexes`, `ensureIndexSettings`, `waitForTask`, `deleteIndex`, `classifyMeilisearchError`). Aucune connaissance métier.
- **5 indexeurs par domaine** co-localisés avec leur module d'entité, chacun avec sa propre queue BullMQ et son propre `@Processor` :
  - `PlanIndexerService` → `apps/backend/src/plans/plans/plan-indexer/`
  - `FicheIndexerService` → `apps/backend/src/plans/fiches/fiche-indexer/`
  - `IndicateurIndexerService` → `apps/backend/src/indicateurs/indicateurs/indicateur-indexer/`
  - `ActionIndexerService` → `apps/backend/src/referentiels/action-indexer/`
  - `DocumentIndexerService` → `apps/backend/src/collectivites/documents/document-indexer/`

Chaque indexeur possède le transform entity → document Meilisearch pour son domaine, et délègue l'écriture HTTP au wrapper. Les noms de queue (`search-indexing-plan`, etc.) sont déclarés en tête de chaque fichier d'indexeur, suivant la convention déjà établie pour `generate-reports.application-service.ts` (et non centralisés dans `apps/backend/src/utils/bullmq/queue-names.constants.ts`).

### Modèle multi-tenant

Le proxy injecte un filtre par index :

Les noms de champs des documents Meilisearch sont en **camelCase**, alignés avec le reste du codebase TypeScript. Les noms de colonnes Postgres restent snake_case ; les transforms d'indexeur mappent entre les accesseurs Drizzle (déjà camelCase) et la forme du document.

| Index | Filtre |
| --- | --- |
| `plans` | `collectiviteId = ${activeId}`, avec un sous-filtre optionnel `planParentFilter` (`'all'` / `'root'` / `'axe'`) qui ajoute `AND parent IS NULL` ou `AND parent IS NOT NULL` selon que l'utilisateur veut voir les plans racines ou les sous-axes |
| `fiches` | `visibleCollectiviteIds = ${activeId}` (tableau multi-valué incluant le propriétaire et chaque collectivité avec qui la fiche est partagée via `fiche_action_sharing`), avec un sous-filtre optionnel `ficheParentFilter` (`'all'` / `'top-level'` / `'sous-action'`) symétrique à `planParentFilter` |
| `indicateurs` | `collectiviteId IS NULL OR collectiviteId = ${activeId}` (les indicateurs prédéfinis ont `collectiviteId IS NULL`) |
| `actions` | `collectiviteId = ${activeId}` (1 document par couple `action × collectivité activée`, avec le `commentaire` de la collectivité dénormalisé) |
| `documents` | `collectiviteId IS NULL OR collectiviteId = ${activeId}` (les documents système ont `collectiviteId IS NULL`) |

Le filtre est construit dans un seul helper `buildTenantFilter(...)` à l'intérieur de `SearchService`, pour qu'un appelant ne puisse jamais l'oublier. Les collectivités `accesRestreint` sont gérées au niveau de la requête : le proxy résout `collectivites.isPrivate(...)` et bascule la permission sur `COLLECTIVITES.READ_CONFIDENTIEL` (sinon `COLLECTIVITES.READ`). Un utilisateur sans la permission est refusé avant même d'atteindre `multiSearch`.

### Schémas de documents Meilisearch

La forme de chaque document indexé est définie par un Zod schema co-localisé avec son domaine, et non centralisé dans `packages/domain/src/search/` :

| Schéma | Fichier | Source |
| --- | --- | --- |
| `AxeSearchDocSchema` | `packages/domain/src/plans/fiches/axe-search-doc.schema.ts` | table `axe` (le nom du schéma reflète la table source ; `parent IS NULL` distingue un plan racine d'un sous-axe ; `plan` pointe vers le plan racine — synthétisé à l'indexation comme `axe.plan ?? axe.id`) |
| `FicheSearchDocSchema` | `packages/domain/src/plans/fiches/fiche-search-doc.schema.ts` | table `fiche_action` |
| `IndicateurSearchDocSchema` | `packages/domain/src/indicateurs/definitions/indicateur-search-doc.schema.ts` | table `indicateur_definition` |
| `ActionSearchDocSchema` | `packages/domain/src/referentiels/actions/action-search-doc.schema.ts` | tables `action_definition` × `action_commentaire` |
| `DocumentSearchDocSchema` | `packages/domain/src/collectivites/documents/document-search-doc.schema.ts` | table `bibliotheque_fichier` |

Chaque schéma est construit comme une **projection Zod** de son schéma de domaine canonique : `z.pick(domainSchema, {...})` pour la majorité des champs, plus `z.extend(...)` pour les champs synthétisés à l'indexation (clé primaire composite des `actions`, `visibleCollectiviteIds` des `fiches`, `plan` racine des `axes`) ou les overrides de nullabilité explicites. Les noms de champs des search-docs suivent les accesseurs des schémas de domaine — c'est pourquoi le schéma `axe` expose `parent` et `plan` (noms de colonnes Postgres conservés tels quels par Drizzle, pas `parentId` / `planId`). Cette dérivation élimine la duplication et fait des search-docs des projections explicites des entités de domaine.

La co-localisation rend chaque dossier de domaine auto-suffisant et reflète la structure des indexeurs côté backend (un indexeur par sous-domaine). Le seul cas où le nom du schéma diverge du nom de la chip UI est `Axe` (chip = `Plans` / `Axes`, schéma = `AxeSearchDoc`) — la chip refléte le concept utilisateur, le schéma reflète la table source.

### Plans vs Axes dans la modale

La modale ⌘K affiche **7 chips** : `Plans`, `Axes`, `Actions`, `Sous-actions`, `Indicateurs`, `Mesures`, `Documents`. La paire `Plans`/`Axes` filtre l'index `plans` (composant `planParentFilter`), et la paire `Actions`/`Sous-actions` filtre l'index `fiches` (composant `ficheParentFilter`). La liste de résultats partitionne le bucket `plans` en deux sections visuelles `Plans` (`parent` null) et `Axes` (`parent` set), et applique le même split au bucket `fiches` (basé sur `parentId` côté fiches, qui suit `ficheSchema.parentId`). Les badges des lignes basculent entre `"Plan"` / `"Axe"` et entre `"Action"` / `"Sous-action"` selon le champ parent correspondant.

### Pipeline interne, séparé de `WebhookService`

L'indexation Meilisearch ne réutilise PAS le pipeline `WebhookService` existant (`apps/backend/src/utils/webhooks/`). Bien que les deux soient des "événements d'entité poussés vers un consommateur", les contrats sous-jacents diffèrent significativement :

- **`WebhookService` (externe)** : contrat avec des partenaires tiers (e.g. *communs*) — la forme du payload fait partie d'un accord d'intégration, les politiques de retry et d'auth sont calibrées pour la fiabilité partenaire, l'audit `webhook_message` existe pour debugger les livraisons vers des systèmes externes.
- **Pipeline d'indexation (interne)** : un détail d'implémentation privé du produit — on contrôle les deux extrémités, la forme du document peut évoluer librement avec nos schémas, pas d'auth externe, les échecs sont opérationnellement les nôtres seuls à gérer.

Garder les deux pipelines séparés permet à chacun d'évoluer indépendamment : un changement de forme côté search ne peut pas accidentellement casser un partenaire ; un changement de contrat partenaire ne peut pas accidentellement faire dérailler l'indexation. Les politiques de retry, le monitoring et la responsabilité on-call peuvent être tunés par pipeline.

La couche queue elle-même reste essentielle pour l'indexation : une panne Meilisearch ou une indexation lente NE doit PAS bloquer le chemin d'écriture utilisateur, et BullMQ donne le retry-with-backoff gratuitement.

### Backfill admin avec deux modes

Cinq endpoints admin tRPC (un par entité), gating `COLLECTIVITES.MUTATE` + `ResourceType.PLATEFORME` :

- **`mode: 'upsert'`** (défaut) — délègue à `indexAll()` du domaine. Idempotent, sûr sous trafic. C'est le chemin de récupération des dérives liées à la non-persistance Redis sur Koyeb (cf. ADR 0006).
- **`mode: 'rebuild'`** — flow swap atomique : verrou Redis SETNX par index (TTL 30 min, retourne `CONFLICT` sur conflit), création de l'index temp, application des settings *avant* écriture, `indexAll(targetIndex)`, `swapIndexes`, `deleteIndex`, libération du verrou. Réservé au nettoyage des orphelins et au reindex post-changement de settings ; tourne en fenêtre de faible trafic.

## Conséquences

### Positives

- Expérience instant-search natif : tolérance aux fautes, ranking pondéré multi-attribut, highlights et snippets sans glue code maison.
- Séparation claire entre indexation interne et webhook externe.
- 1:1 entre index, queue, indexeur, module de domaine — peu de charge mentale.
- Le wrapper SDK centralise la gestion d'erreurs et la classification permanent / retryable, évitant que chaque indexeur réinvente cette logique.

### Négatives

- Une nouvelle infra à monitorer (Meilisearch sur Koyeb) en plus de Postgres et Redis.
- Couplage entre chaque chemin d'écriture d'entité et un appel `enqueue` post-commit — facile à oublier sur un nouveau path. Mitigations : tests d'intégration "create X → search X" par domaine ; backfill admin comme filet de récupération ; sweep horaire sur le partage des fiches pour fermer la fenêtre de fuite après une suppression silencieuse.
- Pour les mesures (`actions` index), le modèle est 1 doc par couple `action × collectivité activée`. À l'échelle haute (~3 000 actions × ~5 000 collectivités × N référentiels) cela peut atteindre des millions de documents. Acceptable pour l'instant ; un éventuel passage à un modèle plus compact (filtrage côté requête sur deux indexes) reste envisageable.

### Neutres

- Le modèle d'outbox transactionnel évoqué par ADR 0006 (persistance des messages dans Postgres en plus de Redis) est **différé** pour la v1. La récupération de drive passe par le backfill admin `mode: 'upsert'`. À reconsidérer si les drift observés en prod le justifient.
- Le contrat de filtre s'appuie sur Meilisearch ≥ v1.10 (`IS NULL`, `localizedAttributes`). Si on devait redescendre à une version < v1.2, il faudrait remplacer `IS NULL` par un champ booléen dénormalisé (`is_top_level_fiche`, `is_predefined_indicateur`).

## Notes de migration (2026-05-04)

Le passage des noms de champs des documents de snake_case vers camelCase et la co-localisation des schémas par domaine ont été menés dans un commit groupé (plan : [doc/plans/2026-05-04-001-refactor-search-doc-shape-and-plan-axe-plan.md](../plans/2026-05-04-001-refactor-search-doc-shape-and-plan-axe-plan.md)). La migration est *breaking au niveau du document* : `ensureIndexSettings` au boot ré-applique les nouveaux `filterableAttributes` camelCase (idempotent), mais les documents stockés conservent leurs clés snake_case et deviennent silencieusement non-filtrables.

### Notes de migration (2026-05-04 #2)

Une seconde refonte des schémas a aligné chaque `*SearchDocSchema` sur son schéma de domaine canonique via `z.pick(...)` / `z.extend(...)` (plan : [doc/plans/2026-05-04-002-refactor-search-docs-from-domain-plan.md](../plans/2026-05-04-002-refactor-search-docs-from-domain-plan.md)). Pour aligner les noms de champs sur les accesseurs du schéma `axe` (qui conserve les noms de colonnes Postgres `parent` / `plan` tels quels), l'`AxeSearchDoc` a renommé deux champs : `parentId → parent`, `planId → plan`. Aucun autre index n'a changé de forme.

**Runbook (un seul index à reconstruire) :** `search.admin.reindexPlans { mode: 'rebuild' }` post-déploiement. Les 4 autres index restent stables — leur `pick()` produit un wire shape identique à l'existant.

**Runbook de déploiement (obligatoire) :** après chaque déploiement qui modifie la forme des documents, l'opérateur doit lancer `search.admin.reindex<Entity> { mode: 'rebuild' }` pour les 5 entités (`reindexPlans`, `reindexFiches`, `reindexIndicateurs`, `reindexActions`, `reindexDocuments`). Le mode `'rebuild'` (et non `'upsert'`) est requis car il drop les documents stockés à l'ancienne forme via le swap-and-drop, alors que `'upsert'` se contenterait de mergier les nouvelles clés sur les anciennes.

## Références

- Plan d'implémentation initial : [doc/plans/2026-04-27-002-feat-meilisearch-global-search-plan.md](../plans/2026-04-27-002-feat-meilisearch-global-search-plan.md)
- Plan de refactor schémas + camelCase + plan/axe UI : [doc/plans/2026-05-04-001-refactor-search-doc-shape-and-plan-axe-plan.md](../plans/2026-05-04-001-refactor-search-doc-shape-and-plan-axe-plan.md)
- Plan de refactor projection des search-docs depuis le domaine : [doc/plans/2026-05-04-002-refactor-search-docs-from-domain-plan.md](../plans/2026-05-04-002-refactor-search-docs-from-domain-plan.md)
- Document de brainstorm : [doc/plans/2026-04-27-001-meilisearch-global-search-requirements.md](../plans/2026-04-27-001-meilisearch-global-search-requirements.md)
- ADR 0006 — [Plateforme background jobs](0006-plateforme-background-jobs.md)
- Documentation Meilisearch — [Filter expression syntax](https://www.meilisearch.com/docs/capabilities/filtering_sorting_faceting/advanced/filter_expression_syntax), [Multi-search vs federated search](https://www.meilisearch.com/docs/learn/multi_search/multi_search_vs_federated_search), [Localized attributes](https://www.meilisearch.com/docs/learn/indexing/multilingual-datasets)
