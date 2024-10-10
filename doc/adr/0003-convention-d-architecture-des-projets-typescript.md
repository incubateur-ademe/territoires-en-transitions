# 3. Convention d'architecture des projets Typescript

Date: 2024-10-01

## Status

Proposed

## Context

Afin d'améliorer la lisibilité, la cohérence et la maintenabilité de notre codebase, il parait nécessaire d'adopter une convention de nommage pour nos projets, fichiers et dossiers au sein du monorepo. Cette convention vise à standardiser les pratiques et à faciliter la navigation et la compréhension du code par tous les membres de l'équipe.

## Decision

Les conventions de nommage et d'architecture choisies suivent les standards par défaut Typescript, ESLint, Node, Next.js, et Nest.js.

**→ Pour les apps et librairies :**

1. Language FR/EN : domaines, scopes, et entités en français, tout le reste en anglais pour fluidifer l'écriture du code

   Exemple : `hasFicheActions()`
   
   Exemple : `const result = await indicateursFetch()`

1. `kebab-case` pour les noms de fichiers et dossiers

   Exemple : `src/app/plan-actions/plan-actions.tsx`

1. Organisation des dossiers en domaine → scope (optionnel) → layer technique

   Exemple : `src/indicateurs/models/indicateur.schema.ts`
   
   Exemple : `src/plan-actions/shared/models/fiche-action.schema.ts`
   
   Exemple : `src/app/plan-actions/fiche-actions/views/fiche-action.card.tsx`

1. Préfix des fichiers avec son "type"

   Exemple type UI : `fiche-action.card.tsx`, `fiche-action.list.tsx`, `fiche-action.list-item.tsx`

**→ Pour les librairies uniquement :**

1. `index.ts` au niveau des sous-scopes, pour rassembler tous les exports associés et simplifier les imports.

   Exemple : `src/plan-actions/fiche-actions/index.ts`
   → résultat à l'import : `import { FicheAction } from '@tet/api/fiche-actions'`

### Les domaines métiers territoires en Transition

Les domaines correspondent aux principaux contextes métiers de la plateforme Territoires en Transition.

1. `utilisateurs`
2. `collectivites`
3. `referentiels`
4. `indicateurs`
5. `plan-actions`
6. `panier-actions`

### Les "layers" techniques

Les couches techniques sont représentés au niveau du dossier final du fichier.

Exemples de layer :

- `models` : couche de représentation des données structurées (entités BDD ou simple value objects)
- `views` : couche d'UI
- `repos` : couche d'échange de données

Au sein d'un layer, chaque fichier peut avoir un "type" préfixé pour préciser son usage et favoriser la découvrabilité et la compréhension de la codebase. On écrira ce type toujours au singulier.

Exemples de type :

**Pour les models :**

- `model` → `models/fiche-action.model.ts`

**Pour les repos :**

- `save` → `models/fiche-action.save.ts`
- `fetch-one` → `models/fiche-action.fetch-one.ts`
- `fetch-all` → `models/fiche-actions.fetch-all.ts`

## Consequences

1.  Standards par défaut

    On évite ainsi les débats basés sur les préférences personnelles, et on facilite la prise en main du code par les nouveaux arrivants sur le projet.

    → Voir les conventions de Next.js par exemple sur le projet de démo [`commerce`](https://github.com/vercel/commerce) par les équipes de Vercel, ou bien sur les [fichiers par défaut](https://nextjs.org/docs/app/api-reference/file-conventions) du framework.
    → Voir

2.  Automatiser les conventions

    Installation requise du plugin "EditorConfig" pour automatiser le linting des fichiers en conformité avec le fichier `.editorconfig` du repo.

    → [Lien plugin VSCode](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

## Useful links

- Inspirations autour du concept d'architecture hexagonale / clean architecture

  → https://dev.to/dyarleniber/hexagonal-architecture-and-clean-architecture-with-examples-48oi
