# Passation — Carte fiche action

> Prototype `apps/prototypes/app/card/` · à implémenter dans `apps/app`.
> Le prototype est une référence visuelle : partir du code existant listé
> ci-dessous, pas d'une copie du prototype.

## Liens

- Maquette Claude Design : https://claude.ai/artifact/TV8YiLJuzzLAuVo8bkuYL9
- Prototype publié (artifact) : https://claude.ai/artifact/7LpKZ7GW7HFMx5PD7HkMV8
- Pull request du prototype : https://github.com/incubateur-ademe/territoires-en-transitions/pull/5621
- En local : `pnpm exec nx dev prototypes` → `http://localhost:3002/card`

## Ce que fait la page

- Une grille de cartes de fiches action (3 colonnes desktop, 2 tablette, 1 mobile).
- En-tête de carte : badge statut, badge priorité, cadenas si la fiche est privée, bouton « Actions de la fiche » (kebab, toujours visible).
- Chemin plan · axe au-dessus du titre, titre limité à 2 lignes.
- Avancement « x / y sous-actions réalisées ».
- Grille 2×2 : pilote, échéance (en gras si en retard), budget prévisionnel, nombre d'indicateurs liés.
- Pied : étiquettes en `Badge` info, « Modifiée le <date> ».

## Correspondance avec l'app

Route cible : la carte remplace `FicheCard` ; elle s'affiche dans `apps/app/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/actions/page.tsx` (vue grille de « Toutes les actions ») et `apps/app/app/(authed)/collectivite/[collectiviteId]/plans/[planId]/page.tsx` (existantes).

| Élément du prototype           | Dans l'app                                                                                                                                               | Statut    | Note                                                                                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carte                          | `apps/app/src/plans/fiches/components/card/fiche.card.tsx` (`FicheCard`, sur `ActionCard` de `@tet/ui`)                                                  | à adapter | Réorganiser le contenu selon le prototype ; utilisée aussi par `fiches-list.grid.tsx`, `plan-arborescence.view/fiches.list.tsx`, `filtered-results.tsx`, sélecteurs de fiches liées |
| Grille de cartes               | `apps/app/src/plans/fiches/list-all-fiches/components/fiches-list.grid.tsx`, `apps/app/src/plans/plans/show-plan/plan-arborescence.view/fiches.list.tsx` | existe    | 3 colonnes sur « Toutes les actions », 2 sur la page plan (question 10)                                                                                                             |
| Badge statut                   | `apps/app/src/plans/fiches/show-fiche/components/fiche-statut.badge.tsx`                                                                                 | existe    | Mêmes variants que le prototype (En cours → `info`, En retard → `error`, Réalisé → `success`)                                                                                       |
| Badge priorité                 | `apps/app/src/plans/fiches/show-fiche/components/fiche-priorite.badge.tsx`                                                                               | à adapter | Affiche la valeur brute de l'enum (`Élevé`, `Moyen`, `Bas`) avec les variants error / warning / success ; le prototype écrit « Priorité élevée » en high / standard / grey          |
| Cadenas fiche privée           | `apps/app/src/plans/fiches/components/card/fiche-access.badges.tsx`                                                                                      | à adapter | Aujourd'hui une `Notification` `lock-fill` flottante au bord de la carte, avec le badge « partagée » ; le prototype la place en ligne dans l'en-tête                                |
| Bouton « Actions de la fiche » | `apps/app/src/plans/fiches/components/card/fiche-card-hover.actions.tsx`                                                                                 | à adapter | Aujourd'hui des boutons au survol (Modifier, Dissocier, `ButtonMenu` Déplacer / Dupliquer / Supprimer seulement si `isMoveable`) ; le prototype montre un kebab unique visible      |
| Chemin plan · axe              | `fiche.card.tsx` (nom du plan sous le titre, sans axe)                                                                                                   | à adapter | Passer au-dessus du titre et ajouter l'axe ; voir `fiches-list.table/cells/fiches-list.cell-plans.tsx` pour un affichage proche                                                     |
| Titre sur 2 lignes             | `fiche.card.tsx`                                                                                                                                         | à adapter | Ajouter `line-clamp-2`                                                                                                                                                              |
| Avancement sous-actions        | —                                                                                                                                                        | à créer   | Rien sur la carte ; `fiche.completion.tsx` (« Complétée / À compléter ») compte les champs remplis, pas les sous-actions                                                            |
| Pilote                         | `apps/app/src/plans/fiches/components/card/fiche.footer.tsx`                                                                                             | existe    | Affiche aussi les services pilotes, absents du prototype (question 6)                                                                                                               |
| Échéance en retard             | `fiche.footer.tsx`                                                                                                                                       | à adapter | Règle locale `isBefore(dateFin, startOfToday())` qui ignore le statut ; utiliser `isFicheOnTime` (`packages/domain/src/plans/fiches/utils/fiche.rules.ts`)                          |
| Budget prévisionnel            | —                                                                                                                                                        | à créer   | Aides existantes : `apps/app/src/plans/fiches/show-fiche/context/budget-utils.ts`                                                                                                   |
| Nombre d'indicateurs liés      | —                                                                                                                                                        | à créer   | `indicateurs.length`, déjà servi                                                                                                                                                    |
| Étiquettes en badges info      | —                                                                                                                                                        | à créer   | `Badge` de `@tet/ui`, `variant="info"` `size="sm"`                                                                                                                                  |
| « Modifiée le <date> »         | `fiche.card.tsx` (`getModifiedSince`, `apps/app/src/utils/formatUtils.ts`)                                                                               | à adapter | Aujourd'hui « Modifié il y a X » en italique                                                                                                                                        |

## Propositions de design system

| Proposition                   | Besoin                                                                                                   | Équivalent existant                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `proposals/budget-flamme.tsx` | Signaler un budget prévisionnel élevé (au-delà de 450 000 €) par trois flammes animées à côté du montant | aucun ; option conforme : `Badge variant="high"` « Budget élevé » |

## Données

Toutes viennent de `plans.fiches.listFiches` (`apps/backend/src/plans/fiches/list-fiches/list-fiches.router.ts`, service `list-fiches.service.ts`, hook front `apps/app/src/plans/fiches/list-all-fiches/data/use-list-fiches.ts`).

| Donnée affichée (fixture)  | Servie par                | Champ                                             | Statut                                                                   |
| -------------------------- | ------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| `Fiche.statut`             | `plans.fiches.listFiches` | `statut`                                          | servie                                                                   |
| `Fiche.priorite`           | `plans.fiches.listFiches` | `priorite`                                        | servie (libellés à mapper)                                               |
| `Fiche.estPrivee`          | `plans.fiches.listFiches` | `restreint`                                       | servie                                                                   |
| `Fiche.plan`               | `plans.fiches.listFiches` | `plans`, `axes`                                   | servie ; axe direct seulement, ancêtres avec `filters.withAxesAncestors` |
| `Fiche.titre`              | `plans.fiches.listFiches` | `titre`                                           | servie                                                                   |
| `Fiche.sousActions`        | —                         | —                                                 | manquante : aucun compte des fiches enfants (`parent_id`) dans la sortie |
| `Fiche.pilote`             | `plans.fiches.listFiches` | `pilotes`                                         | servie                                                                   |
| `Fiche.echeance`           | `plans.fiches.listFiches` | `dateFin`                                         | servie                                                                   |
| `Fiche.enRetard`           | —                         | `statut` + `dateFin`                              | à calculer côté front (`isFicheOnTime`)                                  |
| `Fiche.budgetPrevisionnel` | `plans.fiches.listFiches` | `budgets` (`fiche_action_budget`)                 | à calculer : pas de montant unique (question 2)                          |
| `Fiche.indicateursLies`    | `plans.fiches.listFiches` | `indicateurs`                                     | à calculer (`length`)                                                    |
| `Fiche.etiquettes`         | `plans.fiches.listFiches` | `libreTags` (ou `thematiques`, `sousThematiques`) | servie (question 4)                                                      |
| `Fiche.modifieeLe`         | `plans.fiches.listFiches` | `modifiedAt`                                      | servie                                                                   |

Fiches privées : sans le droit de lecture, `maskFichesRestreintes` (`apps/backend/src/plans/fiches/list-fiches/fiches-restreintes.rules.ts`) met `indicateurs`, `budgets`, `libreTags` et `thematiques` à `null` ; la carte doit le gérer, et un futur compte de sous-actions suivre la même règle.

## Questions ouvertes

1. Avancement — sous-actions (fiches enfants au statut Réalisé) ou ancien champ `etapes` ? Abandonné compte-t-il comme réalisé ? Le compte est à ajouter à `listFiches` (éviter un appel par carte).
2. Budget prévisionnel — quel montant : HT ou ETP, investissement + fonctionnement, ligne totale (`annee` nulle) ou somme des années ? Le prototype n'affiche qu'un nombre.
3. « En retard » — le badge statut reste-t-il le statut saisi à la main, et l'échéance en gras suit-elle `isFicheOnTime` (qui exclut Réalisé et Abandonné) ?
4. Étiquettes — `libreTags`, `thematiques`, `sousThematiques` ou un mélange ? Combien de badges avant un « +N » ?
5. Chemin plan · axe — axe direct ou chemin complet ? Comment afficher une fiche dans plusieurs plans ? Sur la page plan, le nom du plan est redondant.
6. Contenu de la carte actuelle absent du prototype — services pilotes, statut de complétude, badge « partagée », bouton « action à impact », mode sélection : supprimés ou gardés ?
7. Menu — kebab toujours visible ou au survol comme aujourd'hui ? « Modifier » dans le menu ou bouton séparé ? Déplacer n'existe que dans l'arborescence du plan.
8. Date de modification — « Modifiée le <date> » (prototype) ou « Modifié il y a X » (app) ?
9. Priorité — libellés « Priorité élevée / moyenne / basse » et couleurs high / standard / grey du prototype, ou ceux du badge actuel ?
10. Densité — la page plan (2 colonnes) passe-t-elle aussi à la nouvelle carte et à 3 colonnes ?
11. Fiche privée — que montre la carte pour les champs masqués (budget, indicateurs, étiquettes) ? Reste-t-elle non cliquable ?
12. Budget élevé — flammes animées (`proposals/budget-flamme.tsx`, hors design system, animation sans prise en compte de `prefers-reduced-motion`) ou `Badge variant="high"` ? Le seuil de 450 000 € est-il fixe, par collectivité, ou relatif au plan ? Il dépend aussi du montant retenu à la question 2.
