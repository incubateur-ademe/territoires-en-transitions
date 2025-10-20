# 3. Conventions de code et d'architecture

Date: 2024-10-01

## Statut

Accepted

## Contexte

Afin d'améliorer la lisibilité, la cohérence et la maintenabilité de notre codebase, il parait nécessaire d'adopter une convention de nommage pour nos projets, fichiers et dossiers au sein du monorepo. Cette convention vise à standardiser les pratiques et à faciliter la navigation et la compréhension du code par tous les membres de l'équipe.

## Décision

Les conventions de nommage et d'architecture choisies suivent les standards par défaut Typescript, ESLint, Node, Next.js, et Nest.js.

### Language FR et EN

→ En français : nom des domaines, scopes, entités, leur attributs si métier, éventuellement les commentaires et logs
→ En anglais : tout le reste, notamment les objets et attributs non "métier"

Exemple : `hasFicheActions()`

Exemple : `const result = await fetchIndicateurs()`

### Commentaires

Conformément à "Clean Code", le code expressif ne nécessite pas de commentaire. Sauf si la complexité le justifie.

L'usage du `kebab-case` est préconisé pour les noms de fichiers et dossiers.
Exemple : `src/plans/plan-action.list-item.tsx`.

### Organisation des dossiers d'abord par domaine → puis scope [→ puis feature] [→ puis layer technique]

Exemple côté backend :

```
src
└ plans
  └ fiches
    └ count-by-statut
    · └ count-by-statut.request.ts
    · └ count-by-statut.response.ts
    · └ count-by-statut.router.ts
    · └ count-by-statut.router.e2e-test.ts
    · └ count-by-statut.service.ts
    └ update-fiche
    · └ update-fiche.controller.ts
    · └ update-fiche.request.ts
    · └ update-fiche.service.ts
    └ shared
      └ fiche-action.table.ts
      └ fiche-action-referent.table.ts
```

Exemple côté frontend :

```
src
└ plans
  └ toutes-les-fiches
  · └ views
  ·   └ fiche-action.list.tsx
  ·   └ fiche-action.list-item.tsx
  ·   └ fiche-action.card.tsx
  ·   └ fiche-action.card.stories.tsx
  └ shared
    └ hooks
      └ use-create-fiche-action.ts
      └ use-export-fiche-action.ts
```

### Suffix des fichiers avec son "type"

Exemple type UI :

- `fiche-action.card.tsx`
- `fiche-action.list.tsx`
- `fiche-action.list-item.tsx`

### Nommage des actions avec le verbe au début

Exemple de service backend :

- `list-mesures.service.ts`
- `class ListMesuresService {}`

Exemple de hook frontend :

- `use-list-mesures.ts`
- `function useListMesures()`

### Conventions de nommage des verbes d'action

Pour uniformiser le nommage des fonctions, services et hooks, voici la liste des verbes recommandés avec leurs définitions et cas d'usage :

| Verbe          | Définition                                          | Cas d'usage typique                          |
| -------------- | --------------------------------------------------- | -------------------------------------------- |
| **get**        | Récupérer une ressource ou une information          | `getUser()`, `getAllPosts()`                 |
| **list**       | Lister/rechercher des ressources selon des critères | `listUsers()`, `listAvailableProducts()`     |
| **upsert**     | Sauvegarder une ressource (création ou mise à jour) | `upsertDocument()`, `upsertSettings()`       |
| **create**     | Sauvegarder une ressource (création uniquement)     | `createDocument()`, `createSettings()`       |
| **delete**     | Supprimer une ressource                             | `deleteAccount()`, `deleteFile()`            |
| **add**        | Ajouter un élément à une collection ou une liste    | `addItem()`, `addUserToGroup()`              |
| **remove**     | Retirer un élément d'une collection ou d'une liste  | `removeItem()`, `removeTag()`                |
| **send**       | Envoyer des données ou une notification             | `sendEmail()`, `sendMessage()`               |
| **receive**    | Recevoir des données ou une notification            | `receivePayment()`, `receiveMessage()`       |
| **validate**   | Vérifier la validité d'une donnée ou d'un état      | `validateInput()`, `validateToken()`         |
| **calculate**  | Effectuer un calcul et retourner le résultat        | `calculateTotal()`, `calculateAge()`         |
| **build**      | Construire un objet complexe ou une structure       | `buildQuery()`, `buildReport()`              |
| **toggle**     | Changer l'état d'un élément entre deux valeurs      | `toggleVisibility()`, `toggleActive()`       |
| **is/has/can** | Préfixes pour des méthodes retournant un booléen    | `isActive()`, `hasPermission()`, `canEdit()` |

#### Aide au nommage avec VS Code

Pour faciliter l'application de ces conventions, un snippet VS Code est disponible :

**Installation :**

1. Créez un fichier `.vscode/verb-snippets.code-snippets` dans votre workspace
2. Copiez-y le contenu suivant :
   ```json
   {
     "Prefered Verbs": {
       "prefix": ["verb"],
       "body": ["${1|list,get,upsert,delete,add,remove,send,receive,validate,calculate,build,toggle|}${2:ResourceName}"],
       "description": "Provides preferred verbs for naming functions"
     }
   }
   ```
3. VS Code chargera automatiquement le snippet

**Utilisation :**

1. Dans un fichier TypeScript/JavaScript, tapez `verb`
2. Appuyez sur `Tab` ou `Entrée`
3. Une liste déroulante apparaît avec tous les verbes approuvés
4. Sélectionnez le verbe approprié avec les flèches ↑↓
5. Ajoutez le nom de la ressource

**Exemple :**

```typescript
// Tapez "verb" puis sélectionnez dans la liste
function listUsers() {} // ✅
function getUserById() {} // ✅
function upsertDocument() {} // ✅
```

### Attributs `data-test`

Sur le même principe que pour le nommage des fichiers, on préfixe les attributs `data-test` avec le "type". Ceci afin de contextualiser l'attribut.

Exemple : `data-test="referentiels.snapshots.figer-referentiel-button"`

### `index.ts` au niveau des sous-scopes

Si besoin, pour rassembler tous les exports associés et simplifier les imports.

Exemple : `src/plans/fiches/index.ts`

→ résultat à l'import : `import { FicheAction } from '@/api/plans/fiches'`

### Les domaines métiers Territoires en Transitions

Les domaines correspondent aux principaux contextes métiers de la plateforme Territoires en Transitions.

Voici les domaines et sous-scopes définis actuellement :

1. `users`
2. `collectivites`
   - `membres`
   - `personnalisations`
   - `documents`
3. `referentiels`
   - `scores`
     - `snapshots`
   - `evaluations`
     - `audits`
     - `labelisations`
4. `indicateurs`
   - `trajectoires`
5. `plans`
   - `plans`
   - `fiches`
   - `paniers`
   - `modeles`
6. `shared`

Les domaines et scopes définis doivent rester restreints et (quasi) figés.

L'ajout exceptionnel d'un nouveau domaine ne peut se faire qu'après validation auprès de l'ensemble de l'équipe.

#### Exemples d'entités au sein de ces domaines

```
plans
  → plan-action
  → fiche-action

indicateurs
  → definition
  → valeur
  → categorie

shared
  → thematiques
  → pilotes
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

## Conséquences

1.  Standards par défaut

    Les conventions se veulent simples, avec le moins d'exceptions possibles.

    Les conventions suivent au maximum les standards de la communauté. On évite ainsi les débats basés sur les préférences personnelles, et on facilite la prise en main du code par les nouveaux arrivants sur le projet.

    Note particulière concernant le `kebab-case` des dossiers et fichiers : ce choix est principalement motivé par le fait de suivre la convention Next.js (App Router), framework – et donc architecture de dossier du router associé – utilisé par la plupart de nos apps. À noter que de nombreux autres projets suivent aussi désormais ce standard.

    → Voir par exemple le projet de démo Next.js [`commerce`](https://github.com/vercel/commerce) par les équipes de Vercel, ou bien simplement les [fichiers par défaut](https://nextjs.org/docs/app/api-reference/file-conventions) du framework.

2.  Automatiser les conventions

    Installation requise du plugin "EditorConfig" pour automatiser le linting des fichiers en conformité avec le fichier `.editorconfig` du repo.

    → [Lien plugin VSCode](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

## Références

- Inspirations autour du concept d'architecture hexagonale / clean code

  → https://dev.to/dyarleniber/hexagonal-architecture-and-clean-architecture-with-examples-48oi

  → https://damien.pobel.fr/post/clean-code/
