# Passation — Fiches d’un plan

> Prototype `apps/prototypes/app/fiches-plan/` · à implémenter dans `apps/app`.
> Le prototype est une référence visuelle : partir du code existant listé
> ci-dessous, pas d’une copie du prototype.

## Liens

- Maquette Claude Design : https://claude.ai/artifact/JkautGUQSmSJyto1vyEVjq
- Prototype publié (artifact) : https://claude.ai/artifact/DwYQatzh2ZdcuiTJKvqMP1
- Pull request du prototype : https://github.com/incubateur-ademe/territoires-en-transitions/pull/5615
- En local : `pnpm exec nx dev prototypes` → `http://localhost:3002/fiches-plan`

## Ce que fait la page

- Affiche le nom du plan, son nombre de fiches et son budget prévisionnel total.
- Filtre les fiches par statut avec des pastilles qui indiquent le nombre de fiches par statut, et affiche le budget prévisionnel des fiches filtrées.
- Liste les fiches dans un tableau : titre (lien vers la fiche), statut, pilote, budget prévisionnel, montant dépensé, fin prévue.
- Totalise budget et dépensé des fiches affichées en pied de tableau.
- Ajoute une fiche au plan ; un état vide propose de revenir à « Tous ».

## Correspondance avec l’app

Route cible : `apps/app/app/(authed)/collectivite/[collectiviteId]/plans/[planId]/page.tsx` (existante), qui rend `apps/app/src/plans/plans/show-plan/plan.view.tsx`. Aujourd’hui la page affiche les fiches en **cartes, par axe** (`PlanTree`), ou en cartes à plat quand un filtre est actif (`filters/filtered-results.tsx`) : il n’y a pas de vue tableau.

| Élément du prototype                          | Dans l’app                                                                                                                                                       | Statut    | Note                                                                                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titre du plan, sous-titre                     | `plans.plans.get` via la page ; `show-plan/plan-metadata.tsx` affiche déjà budget et compteurs                                                                   | existe    | `totalFiches` et `budget` sont servis par `plans.plans.get`                                                                                        |
| Bouton « Ajouter une fiche »                  | `useCreateFicheResume` (`apps/app/src/plans/fiches/data/use-create-fiche-resume.ts`), branché dans `plan.view.tsx`                                               | existe    | libellé actuel : `appLabels.creerAction`                                                                                                           |
| Filtre par statut                             | `show-plan/filters/filters.button-menu.tsx` (menu déroulant) ; état dans l’URL via nuqs (`show-plan/data/use-fiches-filters-list/index.ts`, paramètre `filters`) | à adapter | le prototype montre des pastilles avec compteurs, que le menu actuel n’a pas ; le menu filtre aussi pilotes, référents et priorités                |
| Budget prévisionnel affiché (fiches filtrées) | —                                                                                                                                                                | à créer   | somme côté client des budgets des fiches filtrées (voir Données)                                                                                   |
| Tableau des fiches                            | `FichesListTable` (`apps/app/src/plans/fiches/list-all-fiches/components/fiches-list.table/fiches-list.table.tsx`), `ReactTable` de `@tet/ui`                    | à adapter | colonnes existantes : titre, plans, statut, pilotes, priorité, date de fin ; manquent budget et dépensé ; masquer plans et priorité sur cette page |
| Badge de statut                               | `FicheStatutBadge` (`apps/app/src/plans/fiches/show-fiche/components/fiche-statut.badge.tsx`)                                                                    | existe    | gère aussi « Sans statut »                                                                                                                         |
| Cellules titre, pilotes, date de fin          | `fiches-list.table/cells/`                                                                                                                                       | existe    |                                                                                                                                                    |
| Ligne de total                                | —                                                                                                                                                                | à créer   | `ReactTable` n’a pas de pied de tableau : dépend de la proposition `TableTotalRow`                                                                 |
| État vide « Afficher toutes les fiches »      | `emptyCard` de `ReactTable` (`TableEmpty`)                                                                                                                       | existe    | action à brancher sur la remise à zéro du filtre                                                                                                   |
| Bandeau « En cours de développement »         | —                                                                                                                                                                | à créer   | hors page : composant d’`AppShell` (proposition `EnvironmentBanner`)                                                                               |

## Propositions de design system

À trancher avec le design avant l’implémentation ; une proposition retenue s’ajoute à `packages/ui`, puis repasse dans le design system de Claude Design.

| Proposition                        | Besoin                                                           | Équivalent existant                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proposals/table-total-row.tsx`    | ligne de total en pied de tableau                                | aucun (`ReactTable` ne rend ni `tfoot` ni ligne de total)                                                                                                        |
| `proposals/table-scroll-frame.tsx` | largeur minimale de 880px et défilement horizontal sur mobile    | aucun dans `@tet/ui` ; l’app le fait au cas par cas (`min-w-[800px]` dans `apps/app/src/plans/fiches/show-fiche/content/moyens/budget/per-year-table/index.tsx`) |
| `proposals/environment-banner.tsx` | signaler un environnement hors production en haut de chaque page | aucun                                                                                                                                                            |

## Données

| Donnée affichée (fixture)  | Servie par                                                                                     | Champ                                                                                                      | Statut     |
| -------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------- |
| `plan.nom`                 | `plans.plans.get`                                                                              | `nom`                                                                                                      | servie     |
| `Fiche.titre`              | `plans.fiches.listFiches` (`apps/backend/src/plans/fiches/list-fiches/list-fiches.service.ts`) | `titre`                                                                                                    | servie     |
| `Fiche.statut`             | `plans.fiches.listFiches`                                                                      | `statut` (8 valeurs, `packages/domain/src/plans/fiches/statut.enum.schema.ts`, ou `null`)                  | servie     |
| `Fiche.pilote`             | `plans.fiches.listFiches`                                                                      | `pilotes` (liste)                                                                                          | servie     |
| `Fiche.finPrevue`          | `plans.fiches.listFiches`                                                                      | `dateFin` (ISO)                                                                                            | servie     |
| `Fiche.budgetPrevisionnel` | `plans.fiches.listFiches`                                                                      | `budgets[].budgetPrevisionnel`, lignes par `type`, `unite` et `annee` (`list-fiches-budget.repository.ts`) | à calculer |
| `Fiche.depense`            | `plans.fiches.listFiches`                                                                      | `budgets[].budgetReel`                                                                                     | à calculer |
| Totaux du plan             | `plans.plans.get` (`apps/backend/src/plans/plans/get-plan/get-plan.service.ts`)                | `budget` (par type, unité et champ, via `compute-budget.rules.ts`), `totalFiches`                          | servie     |
| Compteur par statut        | `plans.fiches.listFiches`                                                                      | à compter côté client sur la liste du plan                                                                 | à calculer |

## Questions ouvertes

1. **Vue tableau ou cartes par axe ?** Le prototype montre une liste à plat ; la page du plan est organisée par axes. Le tableau remplace-t-il l’arborescence, s’ajoute-t-il comme seconde vue, ou ne s’affiche-t-il qu’en mode filtré ?
2. **Pastilles ou menu de filtres ?** Les pastilles doublonnent le filtre par statut du menu existant, qui filtre aussi pilotes, référents et priorités. Les deux cohabitent-ils ?
3. **Quel montant est « le budget » ?** Les budgets sont ventilés par type (investissement, fonctionnement), unité (HT, ETP) et année. La maquette affiche un seul montant en euros : investissement + fonctionnement HT, toutes années ? La règle doit rester cohérente avec `plan.budget` (`compute-budget.rules.ts`).
4. **Fiches restreintes** : leur `budgets` est masqué à `null` (`fiches-restreintes.rules.ts`). Faut-il afficher « Non renseigné » ou un libellé dédié, et les compter dans le total ?
5. **Statuts** : le domaine en compte 8 (dont « Bloqué » et « A discuter ») plus « Sans statut » ; le prototype n’en montre que 6. Faut-il une pastille par statut, même vide ?
6. **Propositions** : `TableTotalRow` et `TableScrollFrame` touchent `ReactTable` dans `@tet/ui`, et `EnvironmentBanner` touche `AppShell` ; à valider avec le design system avant l’implémentation.
