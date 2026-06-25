---
title: "fix: Export Excel des indicateurs sur l'ensemble des résultats filtrés (au-delà de la première page)"
type: fix
status: active
date: 2026-06-25
notion: TET-7414
branch: TET-7414/fix-export-indicateurs-pagination
---

# fix: Export Excel des indicateurs sur l'ensemble des résultats filtrés

## Overview

Le bouton **« Exporter le résultat de mon filtre en Excel »** de la liste des indicateurs
n'exporte aujourd'hui que les indicateurs de la **première page**. On corrige le bug en
répliquant le modèle déjà utilisé pour la **sélection multiple des fiches action à travers la
pagination** : une **union discriminée** `{ mode: 'selection' } | { mode: 'all' }` où, en mode
`all`, le front envoie **les filtres** et le **backend matérialise l'ensemble complet**.

## Problem Statement / Motivation

Retour utilisateur :

> « Je souhaite extraire l'ensemble des indicateurs clés du programme pour présenter cette liste
> à mes élus. Malheureusement je ne parviens pas à le faire via le bouton "exporter le résultat
> de mon filtre en Excel" car le fichier extrait uniquement les indicateurs de la première page. »

### Cause racine

Le bouton d'export reçoit **uniquement les données paginées** :

1. `apps/app/src/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list.tsx:64`
   appelle `useListIndicateurs({ …, queryOptions: { page: currentPage, limit: maxNbOfCards } })`
   — `maxNbOfCards` vaut **9** par défaut. `definitions` est donc **paginé** (≤ 9 éléments).
2. Ce `definitions` paginé descend tel quel : `indicateurs-list.tsx:109` →
   `badge-list.tsx:47` → `useExportIndicateurs(definitions)`.
3. `useExportIndicateurs.ts:23` fait `definitions.map((d) => d.id)` et POST ces ≤ 9 IDs vers
   `/indicateur-definitions/xlsx`. Le backend exporte exactement ces IDs.

→ Quel que soit le filtre, seuls les ≤ 9 indicateurs visibles sont exportés.

## Pattern de référence : sélection multiple des fiches action « à travers la pagination »

Les fiches action résolvent déjà ce problème via une **union discriminée** dans laquelle le
backend résout lui-même l'ensemble filtré lorsque « tout » est sélectionné, plutôt que de faire
confiance à une liste d'IDs côté client
(`apps/app/src/plans/fiches/show-fiche/header/menu/actions/pdf-export/ExportModal/export-fa-modal.tsx`) :

```ts
const input =
  selectedFicheIds === 'all'
    ? { mode: 'all' as const, collectiviteId, filters, sort }   // backend résout TOUT le filtre
    : { mode: 'selection' as const, ficheIds: selectedFicheIds }; // IDs explicites
```

C'est le modèle qu'on réplique pour les indicateurs : passer **les filtres** (et non une liste
d'IDs paginée) et laisser le backend matérialiser l'ensemble complet.

> ⚠️ **On réplique le *modèle*, pas la *plomberie*.** L'export fiches passe par une mutation
> tRPC, mais l'export indicateurs est un endpoint **REST** :
> `@Controller('indicateur-definitions')` consommant un `createZodDto(exportIndicateursRequestSchema)`
> via `apiClient.getAsBlob(..., 'POST')`. Le schéma union doit rester un **objet Zod simple
> utilisable par `createZodDto` et `@Body()`**, et le front continue d'utiliser `getAsBlob`
> (pas `useTRPC`). Ne pas porter la forme `mutationOptions` du flux fiches.

## Proposed Solution

### Décisions d'architecture

- **Union discriminée `{ mode: 'selection' } | { mode: 'all' }`** pour l'export indicateurs,
  alignée sur le pattern fiches.
  - `selection` → `indicateurIds` explicites. **Conserve** l'export d'un indicateur unique
    depuis `IndicateurToolbar.tsx:27` (`useExportIndicateurs([definition])`).
  - `all` → `filters` (même schéma `listDefinitionsInputFiltersSchema` que la liste). Le backend
    résout **tous** les indicateurs correspondants, sans pagination.
- **Réutiliser `ListIndicateursService.listIndicateurs`** côté backend pour résoudre les IDs
  filtrés : une seule source de vérité pour le filtrage (garantit que l'export == ce que
  l'utilisateur voit dans sa liste filtrée, toutes pages confondues).
- **Scoping / IDOR (sécurité)** : en `mode:'all'`, le `collectiviteId` qui sert à résoudre le
  filtre doit être **re-validé contre l'appartenance de l'utilisateur authentifié** (passer le
  `user` à `listIndicateurs`, qui vérifie déjà les droits). Sans cela, un utilisateur pourrait
  forger une requête `mode:'all'` ciblant le `collectiviteId` d'une autre collectivité — cf.
  règle IDOR des conventions backend (le `WHERE` doit inclure le parent ID).
- **Garde-fou technique invisible** : pas de limite fonctionnelle exposée à l'utilisateur. On
  définit un plafond technique haut (constante backend, très au-dessus de l'usage réel) servant
  uniquement de soupape de sécurité contre un export qui ferait exploser mémoire/timeout. Au-delà,
  on retourne une **erreur** (et non une troncature silencieuse, qui réintroduirait le bug
  d'origine). En usage normal, ce plafond n'est jamais atteint.

### Graphe de dépendances

```
listDefinitionsInputFiltersSchema (@tet/domain/indicateurs)   ListIndicateursService (résolution filtres + tri)
                 │                                                        │
                 └──────────────┬─────────────────────────────────────────┘
                                ▼
              export-indicateurs.request.ts  (schéma union selection|all)
                                │
                                ▼
              export-indicateurs.service.ts  (résout IDs si mode=all, puis export)
                                │
                                ▼
                    useExportIndicateurs (hook front, input par mode)
                          │                         │
                          ▼                         ▼
            ExportButton/BadgeList (mode all)   IndicateurToolbar (mode selection)
            + indicateurs-list (passe filters)
```

## Décisions tranchées

- **Plafond de volumétrie** → garde-fou **technique invisible** (plafond haut, soupape de
  sécurité). Pas de limite fonctionnelle exposée. Erreur si dépassé, jamais de troncature.
- **Tri** → on **transmet le `sort` de la liste à l'export** (cohérence : le fichier exporté
  reflète l'ordre que l'utilisateur voit à l'écran), en s'alignant sur le pattern fiches qui passe
  déjà `sort` au backend. En `mode:'all'`, le `sort` est passé à `ListIndicateursService` (source
  unique du filtrage **et** du tri). En `mode:'selection'`, l'ordre suit les `indicateurIds`
  fournis. Si aucun `sort` n'est fourni, on retombe sur le tri backend par défaut (par
  identifiant) déjà implémenté dans `export-indicateurs.service.ts`.
- **Autorisation (`mode:'all'` et `mode:'selection'`)** → appliquer
  **`indicateurs.indicateurs.read_confidentiel`** comme gate **pour les deux modes**, et
  **corriger** le `plans.fiches.read_confidentiel` actuel (permission *fiches* utilisée par
  copier-coller sur un export *indicateurs*). Passer `user` à `listIndicateurs` pour que son
  check natif (`indicateurs.indicateurs.read`) s'exécute aussi. Le gate confidentiel propre au
  domaine indicateur reste la barrière, identique quel que soit le mode.
- **Indicateurs confidentiels** → **gate par permission, filtre seulement si demandé** :
  l'export inclut les indicateurs confidentiels pour un utilisateur autorisé (via le gate
  ci-dessus) et les exclut sinon ; le filtre `estConfidentiel` n'est appliqué **que** si
  l'utilisateur l'a explicitement posé. Pas de modification silencieuse du périmètre exporté.
- **Rétro-compatibilité de l'union** → **union stricte** (`z.discriminatedUnion('mode', …)`,
  comme les fiches) **+ déploiement atomique** : la Task 4 (front) doit être livrée
  **atomiquement avec la Task 2** (backend), dans le même PR/déploiement. ⚠️ Conséquence :
  pendant la bascule, les sessions navigateur déjà ouvertes (ancien JS envoyant
  `{collectiviteId, indicateurIds}` sans `mode`) verront l'export d'indicateur unique échouer
  (400) jusqu'au refresh — accepté comme fenêtre courte.

## Découpage en tâches (slices verticales)

> 🚢 **Contrainte de livraison (décision rétro-compat)** : l'union est **stricte**, donc la
> **Task 2 (backend) et la Task 4 (front) doivent être livrées atomiquement** dans le même
> PR/déploiement. Le découpage ci-dessous reste l'ordre d'implémentation/test, mais les deux
> tâches ne se déploient pas séparément.

### Phase 1 — Backend : contrat + résolution par filtres (cœur du fix)

#### Task 1 — Test e2e backend rouge (mode `all`)

Ajouter un test prouvant qu'un export `mode: 'all'` avec filtres renvoie tous les indicateurs
filtrés, au-delà d'une page. Doit échouer avant le fix.

- **Critères d'acceptation**
  - [ ] Test seede strictement plus d'indicateurs qu'une page de liste sous un filtre commun
        (fixtures fraîches via `addTestCollectiviteAndUser`, pas le `collectiviteId: 1` seedé)
  - [ ] L'export `mode: 'all'` produit un classeur contenant tous ces indicateurs
  - [ ] Le test est rouge avant Task 2
- **Vérification** : `pnpm nx test backend -- export-indicateurs` → échec attendu (rouge)
- **Dépendances** : Aucune
- **Fichiers** : `apps/backend/src/indicateurs/indicateurs/export-indicateurs/export-indicateurs.controller.e2e-spec.ts`
- **Scope** : S

#### Task 2 — Schéma union + résolution par filtres

Passer `exportIndicateursRequestSchema` en union `selection | all` ; adapter le service pour
résoudre les IDs via `ListIndicateursService` quand `mode = all` ; câbler le module ; ajouter le
garde-fou technique invisible.

- ⚠️ **Bloqueur concret à réécrire** : `exportXLSX` commence par
  `if (!options.indicateurIds) return null;` → une requête `mode:'all'` (qui porte `filters` et
  pas d'`indicateurIds`) renvoie `null` dès la première ligne, et le contrôleur répond **404**
  avant toute résolution. Tant que ce garde n'est pas réécrit, le test rouge de la Task 1
  échouera sur un 404 et non sur l'assertion attendue.
- **Critères d'acceptation**
  - [ ] Réécrire le garde `if (!options.indicateurIds) return null;` pour gérer `mode:'all'`
  - [ ] `mode: 'all'` résout tous les IDs filtrés via `ListIndicateursService` (pas de pagination)
  - [ ] `mode: 'selection'` exporte exactement les `indicateurIds` fournis (non régressé)
  - [ ] Schéma reste un **objet Zod simple** (REST `createZodDto` + `@Body()`), front via `getAsBlob`
  - [ ] **Autorisation** : `indicateurs.indicateurs.read_confidentiel` appliqué aux **deux modes**,
        en **remplacement** du `plans.fiches.read_confidentiel` actuel ; `user` passé à `listIndicateurs`
  - [ ] **Confidentiels** : inclus si autorisé (gate), exclus sinon ; `estConfidentiel` appliqué
        uniquement si explicitement posé (pas de modif silencieuse du périmètre)
  - [ ] `collectiviteId` re-validé contre l'utilisateur authentifié pour `mode:'selection'` et `mode:'all'`  
  - [ ] Chaque `indicateurId` est vérifié contre la collectivité et les droits de l’utilisateur  
  - [ ] `sort` de la liste transmis à l'export : en `mode:'all'`, passé à `ListIndicateursService`
        (tri == ordre affiché) ; fallback tri par identifiant si `sort` absent
  - [ ] Plafond technique haut : au-delà → erreur (jamais de troncature silencieuse)
  - [ ] **Union stricte** `z.discriminatedUnion('mode', …)` → livrée **atomiquement avec Task 4**
- **Vérification** : `pnpm nx test backend -- export-indicateurs` vert ; `pnpm nx typecheck backend` vert
- **Dépendances** : Task 1
- **Fichiers** :
  - `apps/backend/src/indicateurs/indicateurs/export-indicateurs/export-indicateurs.request.ts`
  - `apps/backend/src/indicateurs/indicateurs/export-indicateurs/export-indicateurs.service.ts`
  - `apps/backend/src/indicateurs/**/*.module.ts` (wiring `ListIndicateursService`)
- **Scope** : M

#### ✅ Checkpoint Backend
- [ ] Suite export-indicateurs verte
- [ ] Export indicateur unique non régressé

### Phase 2 — Frontend : passer les filtres

#### Task 3 — Hook `useExportIndicateurs` par mode

Modifier la signature pour accepter `{ mode: 'selection'; indicateurIds } | { mode: 'all'; filters; sort }`
(collectiviteId du contexte).

- **Critères d'acceptation**
  - [ ] Le hook construit le bon body selon le mode (incluant `sort` en `mode:'all'`)
  - [ ] Les toasts succès/échec et le tracking sont conservés
- **Vérification** : `pnpm nx typecheck app` vert
- **Dépendances** : Task 2
- **Fichiers** : `apps/app/src/app/pages/collectivite/Indicateurs/Indicateur/useExportIndicateurs.ts`
- **Scope** : S

#### Task 4 — Câbler les filtres dans l'UI de liste + mode selection sur le détail

`indicateurs-list.tsx` passe `filters` **et le `sort` actif** (et non `definitions` paginé) jusqu'à
`ExportButton` qui utilise `mode: 'all'`. `IndicateurToolbar` utilise `mode: 'selection'`.

- **Critères d'acceptation**
  - [ ] L'export de liste envoie les filtres **et le tri** actifs (mode `all`), plus aucune liste d'IDs paginée
  - [ ] Le bouton reste désactivé/masqué quand la liste filtrée est vide
  - [ ] L'export d'un indicateur unique (détail) passe en mode `selection`
  - [ ] 🚢 **Livrée atomiquement avec la Task 2** (union stricte) — même PR/déploiement
- **Vérification** : `pnpm nx typecheck app` vert ; contrôle manuel (filtre > 1 page → fichier complet)
- **Dépendances** : Task 3 ; **co-déploiement obligatoire avec Task 2**
- **Fichiers** :
  - `apps/app/src/app/pages/collectivite/Indicateurs/lists/indicateurs-list/export-button.tsx`
  - `apps/app/src/app/pages/collectivite/Indicateurs/lists/indicateurs-list/badge-list.tsx`
  - `apps/app/src/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list.tsx`
  - `apps/app/src/app/pages/collectivite/Indicateurs/detail/Header/IndicateurToolbar.tsx`
- **Scope** : M

#### ✅ Checkpoint Frontend
- [ ] `nx typecheck app` vert ; build OK

### Phase 3 — Couverture e2e UI

#### Task 5 — Test e2e UI du use-case

Reproduire le scénario utilisateur de bout en bout et vérifier que l'export contient tous les
indicateurs filtrés (toutes pages).

- **Critères d'acceptation**
  - [ ] Fixture : > 9 indicateurs sous un filtre commun (de préférence **sans parent**, sinon
        l'assertion par onglet est faussée — voir ci-dessous)
  - [ ] L'UI applique le filtre, clique « Exporter le résultat de mon filtre en Excel »
  - [ ] Le `.xlsx` téléchargé (parsé via `exceljs`) contient **tous** les indicateurs filtrés,
        pas seulement la première page. ⚠️ Ne pas asserter `nb_onglets == count` de la liste :
        `addIndicateurToWorkbook` fusionne les enfants dans l'onglet du parent, alors que le
        `count` liste compte les enfants à part quand `withChildren` est actif. Asserter contre
        **l'ensemble des définitions de tête résolues**, ou contraindre la fixture à des
        indicateurs sans parent.
  - [ ] Cas de contrôle : export d'un indicateur unique reste correct (mode selection)
- **Vérification** : `pnpm nx e2e e2e -- indicateurs` vert
- **Dépendances** : Task 4
- **Fichiers** :
  - `e2e/tests/indicateurs/export-indicateurs/export-indicateurs.spec.ts` (nouveau)
  - `e2e/tests/indicateurs/export-indicateurs/export-indicateurs.pom.ts` (nouveau)
  - `e2e/tests/indicateurs/indicateurs.fixture.ts` (helper de seed en masse si besoin)
- **Scope** : M

#### ✅ Checkpoint Complet
- [ ] e2e UI vert (scénario du retour utilisateur)
- [ ] Backend + front + e2e verts ; prêt pour revue

---

## Phase 4 — Format Excel consolidé (PR indépendante)

> 🧭 **Pourquoi une PR séparée ?** Les Phases 1–3 corrigent un **bug** (export tronqué à la
> première page) avec un risque sécurité (IDOR/confidentiels) → à livrer vite, sans le coupler à
> un changement de format. La Phase 4 est une **évolution produit** du rendu du classeur, sans
> dépendance bloquante sur le fix, et avec ses propres arbitrages (mise en page, rétro-compat du
> fichier livré aux utilisateurs). On la sort donc dans un PR/déploiement distinct, livré **après**
> le fix. Techniquement elle s'appuie sur le même socle : `mode:'all'` résout déjà l'ensemble
> filtré via `ListIndicateursService`, dont l'output expose **déjà** tout le nécessaire
> (`pilotes`, `services`, `commentaire`, `enfants`, `parent`) — aucune nouvelle requête de fond
> n'est requise.

### Problème (retour utilisateur)

> « Un indicateur par onglet ne convient pas. Je veux une vue consolidée de tous les indicateurs
> exportés dans un seul onglet (un indicateur par ligne), avec le lien parent/enfant bien
> visible. »

### Format cible : un onglet, un indicateur par ligne

Aujourd'hui `addIndicateurToWorkbook`
(`apps/backend/src/indicateurs/indicateurs/export-indicateurs/export-indicateurs.service.ts:133`)
crée **un onglet par indicateur de tête** et y empile des lignes par *type de donnée*
(objectif / résultat / commentaire) × *année en colonnes*, en fusionnant les enfants dans
l'onglet du parent.

Le format consolidé inverse la maille : **une seule feuille**, **une ligne par indicateur**
(parent **et** chaque sous-indicateur sur sa propre ligne), avec colonnes :

| Colonne | Source (output `ListIndicateursService`) | Notes |
|---|---|---|
| Identifiant | `identifiantReferentiel ?? id` | |
| Nom de l'indicateur | `titre` | |
| Indicateur parent | `parent.titre` (vide si tête) | rend le lien parent/enfant explicite |
| Sous-indicateurs | `enfants[].titre` (joints), ou lignes enfants dédiées | voir « maille » ci-dessous |
| Unité | `unite` | |
| Résultats par année | `indicateur_valeur.resultat` pivoté par année | colonnes dynamiques `Résultat <année>` |
| Objectifs par année | `indicateur_valeur.objectif` pivoté par année | colonnes dynamiques `Objectif <année>` |
| Commentaires | `commentaire` (+ commentaires de valeurs si pertinent) | |
| Pilotes (personnes) | `pilotes` (`personneTagOrUserSchema`) | noms joints |
| Services pilotes | `services` (`tagSchema`) | noms joints |

> 🗑️ **Le format consolidé remplace définitivement le multi-onglets** — on ne conserve **pas**
> l'ancien rendu en option. `addIndicateurToWorkbook` (un onglet par indicateur) est supprimé.

**Maille parent/enfant** — un seul indicateur par ligne implique de choisir comment matérialiser
le lien (décision produit, à trancher avant implémentation) :
- **(recommandé)** une ligne par indicateur, parent **et** enfants, avec colonne « Indicateur
  parent » remplie sur les lignes enfants + indentation/préfixe visuel du `titre` ;
- variante : enfants listés en une cellule « Sous-indicateurs » sur la ligne du parent (plus
  compact mais perd les valeurs par année des enfants).

> ⚠️ **Années en colonnes = colonnes dynamiques.** L'union des années couvre **tous** les
> indicateurs exportés → potentiellement large. Prévoir un ordre d'années stable et figer
> l'en-tête (freeze panes) pour la lisibilité.

### Tasks

#### Task 6 — Acter la maille parent/enfant

Le format consolidé **remplace** le multi-onglets (décision prise — pas d'option de repli). Seule
la maille parent/enfant reste à trancher avant implémentation (tableau ci-dessus).

- **Critères d'acceptation**
  - [ ] Maille parent/enfant validée (ligne dédiée par enfant vs cellule agrégée)
- **Dépendances** : Phases 1–3 livrées
- **Scope** : S

#### Task 7 — Test backend rouge (format consolidé)

Prouver que l'export produit **une seule feuille** avec une ligne par indicateur et les colonnes
attendues (dont pilotes/services et lien parent/enfant).

- **Critères d'acceptation**
  - [ ] Fixture avec ≥ 1 parent + ≥ 1 enfant, valeurs résultats/objectifs sur ≥ 2 années,
        pilotes (personne + user) et services renseignés
  - [ ] Assertion : 1 onglet, 1 ligne/indicateur, colonnes années résultats+objectifs,
        commentaires, pilotes, services, indicateur parent
  - [ ] Rouge avant Task 8
- **Vérification** : `pnpm nx test backend -- export-indicateurs` → rouge attendu
- **Dépendances** : Task 6
- **Fichiers** : `apps/backend/src/indicateurs/indicateurs/export-indicateurs/export-indicateurs.controller.e2e-spec.ts`
- **Scope** : S

#### Task 8 — Implémenter le rendu consolidé

Remplacer la génération multi-onglets par une feuille unique consolidée (nouveau builder), en
consommant les champs déjà exposés par `ListIndicateursService` (pilotes, services, commentaire,
enfants, parent) + les valeurs par année.

- **Critères d'acceptation**
  - [ ] Une seule feuille, une ligne par indicateur (parent + enfants), maille de la Task 6
  - [ ] Colonnes dynamiques `Résultat <année>` / `Objectif <année>` sur l'union des années
  - [ ] Lien parent/enfant explicite (colonne « Indicateur parent » + indentation du titre)
  - [ ] Commentaires, pilotes (personnes) et services présents
  - [ ] `mode:'selection'` (indicateur unique depuis le détail) rendu dans le même format
  - [ ] En-tête figé (freeze panes) + largeurs de colonnes lisibles
- **Vérification** : `pnpm nx test backend -- export-indicateurs` vert ; `pnpm nx typecheck backend` vert
- **Dépendances** : Task 7
- **Fichiers** : `apps/backend/src/indicateurs/indicateurs/export-indicateurs/export-indicateurs.service.ts`
  (extraire un builder dédié si > ~300 lignes — cf. règle backend)
- **Scope** : M

#### Task 9 — Mettre à jour l'e2e UI

Adapter les assertions de la Task 5 au nouveau format (le `caveat` « ne pas asserter
`nb_onglets == count` » disparaît : on assied désormais sur **un seul onglet** et on compte les
**lignes**).

- **Critères d'acceptation**
  - [ ] L'e2e UI vérifie 1 onglet + 1 ligne par indicateur filtré (toutes pages)
  - [ ] Présence des colonnes clés (pilotes, services, parent, années)
- **Vérification** : `pnpm nx e2e e2e -- indicateurs` vert
- **Dépendances** : Task 8
- **Fichiers** : `e2e/tests/indicateurs/export-indicateurs/export-indicateurs.spec.ts`,
  `…/export-indicateurs.pom.ts`
- **Scope** : S

#### ✅ Checkpoint Phase 4
- [ ] Backend + e2e verts ; classeur consolidé conforme au retour utilisateur ; PR distincte

## Risques & mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Export volumineux (collectivité avec beaucoup d'indicateurs) → timeout/mémoire | Moyen | Garde-fou technique invisible (plafond haut) → erreur si dépassé, jamais de troncature silencieuse |
| Divergence entre filtre liste et filtre export | Élevé | Réutiliser `ListIndicateursService` (source unique du filtrage) |
| Régression de l'export indicateur unique (`IndicateurToolbar`) | Moyen | Conserver le mode `selection` + test backend dédié |
| Endpoint `/indicateur-definitions/xlsx` consommé hors app | Faible | Endpoint marqué `@ApiExcludeController` + `ApiUsage([APP])` : usage interne app uniquement |
| Fenêtre de déploiement : ancien JS envoie l'ancienne forme sans `mode` → 400 | Faible | Union stricte assumée + **livrer Task 2 et Task 4 atomiquement** (même PR) ; fenêtre courte, sessions ouvertes se rétablissent au refresh |
| Export `mode:'all'` exfiltre des indicateurs confidentiels sans droit | Élevé | Gate `indicateurs.indicateurs.read_confidentiel` appliqué aux deux modes + `user` passé à `listIndicateurs` |
| IDOR : `collectiviteId` du payload utilisé sans contrôle | Élevé | Re-valider `collectiviteId` contre l'utilisateur authentifié (passer `user` à `listIndicateurs`) |
| Phase 4 : changement de format casse des usages/macros côté utilisateurs habitués au multi-onglets | Moyen | Remplacement assumé (pas d'option de repli) ; PR séparée + communication du changement aux utilisateurs avant déploiement |
| Phase 4 : colonnes années dynamiques très larges (union de toutes les années) → classeur peu lisible | Faible | Ordre d'années stable, freeze panes, largeurs de colonnes ajustées |

## Notes de revue (ce-doc-review, 2026-06-25)

Plan revu par 4 personas (coherence, feasibility, security-lens, adversarial). 8 findings
actionnables traités : 5 corrigés dans ce document, 3 décisions sécurité/architecture tranchées
(autorisation, confidentiels, rétro-compat) et intégrées dans **Décisions tranchées** ci-dessus.
Concerns résiduels non bloquants conservés pour mémoire : coût de la requête de résolution (~14
jointures) qui s'exécute avant le plafond ; TOCTOU entre count affiché et set résolu.

**Mise à jour (2026-06-25)** : décision « Tri » révisée — le `sort` de la liste est désormais
**transmis à l'export** (cohérence ordre affiché == ordre exporté), ce qui lève le concern
résiduel « divergence d'ordre export vs tri affiché ». Ajout d'une **Phase 4 (PR indépendante)**
pour le format Excel consolidé (un onglet, un indicateur par ligne).
