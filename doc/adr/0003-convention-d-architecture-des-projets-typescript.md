# 3. Convention d'architecture des projets Typescript

Date: 2024-10-01

## Status

Proposed

## Context

Afin d'améliorer la lisibilité, la cohérence et la maintenabilité de notre codebase, il parait nécessaire d'adopter une convention de nommage pour nos projets, fichiers et dossiers au sein du monorepo. Cette convention vise à standardiser les pratiques et à faciliter la navigation et la compréhension du code par tous les membres de l'équipe.

## Decision

Les conventions de nommage et d'architecture choisies suivent les standards par défaut Typescript, ESLint, Node, Next.js, et Nest.js.

- **Language FR et EN**

  → En français : nom des domaines, scopes, entités, leur attributs si métier
  → En anglais : tout le reste, les objets et attributs non "métier", les commentaires, les logs

  Exemple : `hasFicheActions()`

  Exemple : `const result = await indicateursFetch()`

- **Commentaires** : conformément à "Clean Code", le code expressif ne nécessite pas de commentaire. Sauf si la complexité le justifie.

- **`kebab-case` pour les noms de fichiers et dossiers**

  Exemple : `src/app/plan-actions/plan-actions.tsx`

- **Organisation des dossiers d'abord par domaine → puis scope → puis layer technique**

  Exemple : `src/indicateurs/models/indicateur.schema.ts`

  Exemple : `src/plan-actions/shared/models/fiche-action.schema.ts`

  Exemple : `src/app/plan-actions/fiche-actions/views/fiche-action.card.tsx`

- **Suffix des fichiers avec son "type"**

  Exemple type UI : `fiche-action.card.tsx`, `fiche-action.list.tsx`, `fiche-action.list-item.tsx`

- **`index.ts` au niveau des sous-scopes**, si besoin, pour rassembler tous les exports associés et simplifier les imports.

  Exemple : `src/plan-actions/fiche-actions/index.ts`

  → résultat à l'import : `import { FicheAction } from '@tet/api/fiche-actions'`

### Les domaines métiers territoires en Transition

Les domaines correspondent aux principaux contextes métiers de la plateforme Territoires en Transition.

Voici les domaines définis actuellement :

1. `utilisateurs`
2. `collectivites`
3. `referentiels`
4. `indicateurs`
5. `plan-actions`
6. `impact-actions`

Les domaines définis doivent rester restreints et (quasi) figés.

L'ajout exceptionnel d'un nouveau domaine ne peut se faire qu'après validation auprès de l'ensemble de l'équipe.

#### Exemples d'entités au sein de ces domaines

```
plan-actions
  → plan-action
  → fiche-action

indicateurs
  → definition
  → valeur
  → categorie
```

### Les "layers" et "types" techniques

Les layers techniques sont représentés au niveau du dossier final du fichier.

Au sein d'un layer, chaque fichier peut avoir un "type" préfixé pour préciser son usage et favoriser la découvrabilité et la compréhension de la codebase. On écrira ce type toujours au singulier.

#### Nos layers backend :

- `models` : couche de représentation des données structurées (entités BDD ou simple value objects)
- `services` : couche de logique ou d'échange de données
- `controllers` : couche de logique ou d'échange de données

Exemples de type :

- `models/fiche-action.`**`table`**`.ts`
- `models/fiche-action.`**`dto`**`.ts`
- `services/fiche-action.`**`repo`**`.ts`

Exemples plus granulaires, si pertinent :

- `services/fiche-action.`**`save`**`.ts`
- `services/fiche-action.`**`fetch-one`**`.ts`
- `services/fiche-actions.`**`fetch-all`**`.ts`

#### Nos layers frontend :

- `views` : couche des composants UI
- `hooks` : couche de logique UI

## Consequences

1.  Standards par défaut

    Les conventions se veulent simples, avec le moins d'exceptions possibles.

    Les conventions suivent au maximum les standards de la communauté. On évite ainsi les débats basés sur les préférences personnelles, et on facilite la prise en main du code par les nouveaux arrivants sur le projet.

    Note particulière concernant le `kebab-case` des dossiers et fichiers : ce choix est principalement motivé par le fait de suivre la convention Next.js (App Router), framework – et donc architecture de dossier du router associé – utilisé par la plupart de nos apps. À noter que de nombreux autres projets suivent aussi désormais ce standard.

    → Voir par exemple le projet de démo Next.js [`commerce`](https://github.com/vercel/commerce) par les équipes de Vercel, ou bien simplement les [fichiers par défaut](https://nextjs.org/docs/app/api-reference/file-conventions) du framework.

2.  Automatiser les conventions

    Installation requise du plugin "EditorConfig" pour automatiser le linting des fichiers en conformité avec le fichier `.editorconfig` du repo.

    → [Lien plugin VSCode](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

## Useful links

- Inspirations autour du concept d'architecture hexagonale / clean code

  → https://dev.to/dyarleniber/hexagonal-architecture-and-clean-architecture-with-examples-48oi

  → https://damien.pobel.fr/post/clean-code/
