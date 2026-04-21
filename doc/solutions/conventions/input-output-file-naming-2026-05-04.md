---
title: "Convention de nommage des fichiers d'entrée/sortie : *.input.ts / *.output.ts"
date: 2026-05-04
category: conventions
module: referentiels
problem_type: convention
component: tooling
severity: medium
applies_when:
  - "Création d'un nouveau schéma Zod d'entrée ou de sortie pour un router tRPC ou un service"
  - "Migration d'un fichier legacy *.request.ts ou *.response.ts à l'occasion d'une modif fonctionnelle"
  - "Extraction d'un schéma de réponse inliné dans un fichier de schéma primitif (cas du *.schema.ts qui mélange item primitif et réponse de liste)"
  - "Définition de symboles XxxInput / XxxOutput pour un nouveau flux"
related_components:
  - documentation
  - service_object
related_adr: 0011-architecture-service-ddd.md
related_solutions:
  - architecture-patterns/extract-history-repository-from-service.md
  - architecture-patterns/supabase-to-trpc-with-computed-enrichment-2026-04-27.md
tags:
  - naming-convention
  - file-naming
  - zod
  - trpc
  - ddd
  - adr-0011
  - input-output
  - domain-package
---

# Convention de nommage des fichiers d'entrée/sortie : `*.input.ts` / `*.output.ts`

## Context

L'[ADR 0011](../../adr/0011-architecture-service-ddd.md) (statut « Proposé ») pose un découpage par couche de responsabilité et mentionne `*.input.ts` / `*.output.ts` dans son arborescence d'exemple, mais ne formalise pas explicitement :

1. que `*.request.ts` / `*.response.ts` (ou les schémas de réponse inlinés dans des fichiers `*.schema.ts`) sont du **legacy** à migrer ;
2. la convention de nommage des **symboles** à l'intérieur de ces fichiers (notamment : `XxxInput` vs `XxxInputType`).

Conséquence avant clarification : cohabitation accidentelle de plusieurs styles dans `packages/domain` — quatre fichiers en `*.request.ts` (`list-historique`, `list-actions`, `export-score-comparison`, `chart-render`), des fichiers `*.input.ts` plus récents (`list-plans`, `list-definitions`, `upsert-plan`, …), et des schémas de réponse parfois inlinés dans `*.schema.ts` (cas de `historique-item.schema.ts` qui mélangeait la primitive `historiqueItemSchema` et la réponse `listHistoriqueResponseSchema`).

## Guidance

**Suffixes de fichier (canonique).**

| Rôle | Suffixe |
|------|---------|
| Schéma et type d'entrée d'un router tRPC ou d'un service | `*.input.ts` |
| Schéma et type de sortie d'un router tRPC ou d'un service | `*.output.ts` |

Les fichiers historiques `*.request.ts` / `*.response.ts` (et les schémas de réponse inlinés dans des `*.schema.ts` qui ne sont pas le primitif d'item) sont du **legacy**. Migration **progressive**, à l'occasion d'une modification fonctionnelle du flux concerné — pas de refactor de masse.

**Nommage des symboles à l'intérieur.**

```ts
// ✅ packages/domain/.../list-foo.input.ts
export const listFooInputSchema = z.object({ /* … */ });
export const listFooInputFiltersSchema = z.object({ /* … */ });

export type ListFooInput = z.infer<typeof listFooInputSchema>;
export type ListFooInputFilters = z.infer<typeof listFooInputFiltersSchema>;

// ✅ packages/domain/.../list-foo.output.ts
import { fooItemSchema } from './foo-item.schema';

export const listFooOutputSchema = z.object({
  items: fooItemSchema.array(),
  total: z.number(),
});

export type ListFooOutput = z.infer<typeof listFooOutputSchema>;
```

Règles :
- Le **schéma** porte le suffixe `Schema` : `xxxInputSchema`, `xxxOutputSchema`.
- Le **type inféré** ne porte **pas** le suffixe `Type` : `XxxInput`, `XxxOutput` (et non `XxxInputType` / `XxxOutputType`).
- Pour les **sous-schémas** (filtres, options de tri, etc.), on étend la même règle : `xxxInputFiltersSchema`, `XxxInputFilters`.

**Quand extraire plutôt que renommer un fichier.**

Si la « réponse » d'un flux vit aujourd'hui dans un fichier de schéma primitif (`xxx-item.schema.ts`) parce que la primitive et la réponse de la liste ont été co-écrites, **extraire** la partie réponse dans un nouveau `xxx-list.output.ts` plutôt que de renommer le fichier primitif. Le fichier primitif reste un artefact réutilisable indépendamment de la liste (un futur flux `getOne` peut renvoyer un seul `XxxItem` sans dépendre du schéma de liste).

## Why This Matters

1. **Cohérence cross-codebase.** Un dev (ou un agent) qui cherche « le schéma d'entrée de la feature X » doit pouvoir localiser le fichier sans deviner la version de la convention en vigueur au moment où le code a été écrit.
2. **Symétrie input/output.** L'asymétrie existante (un `*.request.ts` côté input mais une réponse inlinée dans `*.schema.ts` côté output) crée une charge cognitive — on cherche le pendant du fichier d'entrée et on ne le trouve pas.
3. **Cohérence avec l'ADR.** L'ADR 0011 cite déjà `*.input.ts` / `*.output.ts` dans ses exemples ; codifier la convention dans la prose de l'ADR la rend opposable lors des revues plutôt que « ce que les fichiers récents font ».
4. **Surface des erreurs lors des migrations.** En extrayant la réponse dans un fichier dédié, on gagne un `git mv`-able, un import explicite (le `.output.ts` `import` la primitive `*.schema.ts`), et un point de référence stable pour les consommateurs backend (`.output(...)` du router tRPC) — au lieu d'un import groupé qui mélange item et response.

## When to Apply

- À la création de tout nouveau fichier de schéma d'entrée ou de sortie pour un router/service.
- Lors d'une modification fonctionnelle d'un flux existant qui utilise encore `*.request.ts` / `*.response.ts` ou un schéma de réponse inliné — migrer **dans le même PR** que la modif fonctionnelle, pas en commit séparé sans contexte.
- Quand un schéma de réponse vit dans un `*.schema.ts` à côté d'une primitive d'item (anti-pattern) : extraire dans `*.output.ts`, garder la primitive dans `*.schema.ts`.

**À ne pas faire :**
- Pas de refactor de masse type « rename all `.request.ts` ». Le coût de revue / merge conflicts dépasse le bénéfice ; la migration progressive est explicitement codifiée dans l'ADR (principe d'adoption graduelle).
- Pas de renommage du fichier primitif d'item quand on extrait sa réponse. La primitive est conceptuellement indépendante de la liste.

## Examples

**Avant (legacy).** `packages/domain/src/referentiels/historique/list-historique.request.ts` :

```ts
export const listHistoriqueRequestSchema = z.object({ /* … */ });
export type ListHistoriqueRequestType = z.infer<typeof listHistoriqueRequestSchema>;
```

… et la réponse inlinée dans `historique-item.schema.ts` :

```ts
export const historiqueItemSchema = z.object({ /* … */ });
export type HistoriqueItem = z.infer<typeof historiqueItemSchema>;

// ❌ La réponse de liste vit dans le fichier de la primitive d'item
export const listHistoriqueResponseSchema = z.object({
  items: historiqueItemSchema.array(),
  total: z.number(),
});
export type ListHistoriqueResponseType = z.infer<typeof listHistoriqueResponseSchema>;
```

**Après (canonique).** Trois fichiers, responsabilités séparées :

```ts
// list-historique.input.ts
export const listHistoriqueInputSchema = z.object({ /* … */ });
export type ListHistoriqueInput = z.infer<typeof listHistoriqueInputSchema>;

// historique-item.schema.ts (primitive seule)
export const historiqueItemSchema = z.object({ /* … */ });
export type HistoriqueItem = z.infer<typeof historiqueItemSchema>;

// list-historique.output.ts (extrait)
import { historiqueItemSchema } from './historique-item.schema';

export const listHistoriqueOutputSchema = z.object({
  items: historiqueItemSchema.array(),
  total: z.number(),
});
export type ListHistoriqueOutput = z.infer<typeof listHistoriqueOutputSchema>;
```

Côté router tRPC :

```ts
// list-historique.router.ts
.input(listHistoriqueInputSchema)
.output(listHistoriqueOutputSchema)
```

Voir le PR de référence (commits `bdf4ec4ac` à `204e7d92e` sur la branche `feat/historique-action-type`) et le plan de refactor : `doc/plans/2026-05-04-001-refactor-rename-historique-request-to-input-plan.md`.

## Related

- [ADR 0011 — Architecture backend de services Domain-Driven Design](../../adr/0011-architecture-service-ddd.md) — section « Conventions de nommage des fichiers d'entrée/sortie » formalise la règle.
- [Extraire les repositories d'historique depuis les services NestJS](../architecture-patterns/extract-history-repository-from-service.md) — autre découpage par responsabilité dans le même module historique.
- Plan de migration de référence : `doc/plans/2026-05-04-001-refactor-rename-historique-request-to-input-plan.md`.

## Migration Backlog (au 2026-05-04)

Fichiers `*.request.ts` restants à migrer à l'occasion d'une modif fonctionnelle :

- `packages/domain/src/utils/echarts/chart-render.request.ts`
- `packages/domain/src/referentiels/scores/export-score-comparison.request.ts`
- `packages/domain/src/referentiels/actions/list-actions.request.ts`

Schémas de réponse à extraire dans un `*.output.ts` symétrique :

- `listHistoriqueUtilisateursResponseSchema` dans `packages/domain/src/referentiels/historique/historique-utilisateur.schema.ts` (extraction symétrique vers `list-historique-utilisateur.output.ts`).

Cette liste n'est pas un mandat de refactor — chaque entrée se traite **avec** une modif fonctionnelle du flux concerné.
