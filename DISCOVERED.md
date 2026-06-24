# Découvertes hors-scope

## [bug] La checklist audit-labellisation ne se rafraîchit pas au retour SPA après une mise à jour de statut
- **Symptôme** : depuis la checklist, ouvrir une mesure via « Voir la mesure », passer son statut à « Fait », puis revenir (`goBack`) ne met pas à jour l'icône du critère. Un rechargement manuel (`reload`) est nécessaire.
- **Localisation** : `apps/app/src/referentiels/labellisations/useLabellisationParcours.ts` (query `getParcours`) + `apps/app/src/referentiels/actions/action-statut/use-action-statut.ts` (invalidation `getParcours` dans `onSuccess`).
- **Diagnostic suspecté** : l'invalidation de `getParcours` est émise alors que l'utilisateur est sur la page mesure (aucun observer actif pour cette query, le `ChecklistProvider` est démonté). Au `goBack`, le subtree audit-labellisation remonte mais `refetchOnMount` ne re-déclenche pas la query (probablement cache de navigation Next.js App Router / BFCache). Trace réseau : aucun `getParcours` après `updateStatut` lors du retour. Piste de fix : `refetchOnMount: 'always'` sur la query parcours, ou refetch explicite sur changement de route.
- **Impact** : utilisateur — données de critères périmées affichées après navigation retour, jusqu'à un refresh manuel.
- **Découvert pendant** : audit-checklist-view-update (stabilisation des e2e labellisation)
- **Découvert le** : 2026-05-21

## [bug] Plusieurs headings de niveau 1 sur la page d'un plan (titre + axes racine)
- **Symptôme** : sur la page d'un plan, le titre (`<h1>`) et chaque axe racine sont tous des headings de niveau 1. `getByRole('heading', { level: 1 })` y résout plusieurs éléments (violation strict-mode Playwright). Une page devrait avoir un seul `h1`, les sous-sections incrémentant le niveau.
- **Localisation** : `apps/app/src/plans/plans/show-plan/plan-arborescence.view/axe/axe-header.tsx:30` (`aria-level={axe.depth}` → niveau 1 pour les axes de profondeur 1, identique au titre de page).
- **Diagnostic suspecté** : `aria-level` devrait valoir `axe.depth + 1` pour que le titre du plan reste le seul niveau 1, les axes racine en niveau 2, les sous-axes en niveau 3, etc.
- **Impact** : utilisateur — hiérarchie de titres incohérente pour les lecteurs d'écran ; dev — sélecteurs e2e par rôle/niveau ambigus (contourné côté POM par un scope `data-test="plan-header"`).
- **Découvert pendant** : refactor/page-header-sticky (diagnostic des e2e plans en échec)
- **Découvert le** : 2026-06-04

## [bug] Le critère de labellisation d'une tâche est évalué sur le parent sous-action, le rendant insatisfaisable par un seul update
- **Symptôme** : le critère « Être en conformité PCAET » (`cae_1.1.2.0.1`) ne devient jamais atteint quand on passe uniquement cette tâche à « Fait ». Il faut passer aussi la tâche sœur BGES (`cae_1.1.2.0.2`).
- **Localisation** : `apps/backend/src/referentiels/labellisations/get-labellisation.service.ts:708-713` (branche `parent.score.avancement !== NON_RENSEIGNE` → évalue le ratio du parent au lieu de la tâche).
- **Diagnostic suspecté** : dès que la sous-action parent `1.1.2.0` a une avancement (parce qu'une de ses tâches est renseignée), le critère bascule sur le ratio du parent. Le parent a deux tâches (PCAET + BGES) à 0 point : passer une seule donne 50 % (comptage de tâches via `getScoreRatios` quand `pointPotentiel === 0`), sous le seuil 100 % du critère « Programmé ou fait ». À confronter avec le comportement attendu : un critère portant sur une tâche précise devrait-il vraiment dépendre du parent ?
- **Impact** : utilisateur — un critère affiché peut être impossible à satisfaire en renseignant la seule mesure désignée ; dev — pièges de test (cf. `checklist-statut-refresh.spec.ts` qui doit passer les deux tâches).
- **Découvert pendant** : audit-checklist-view-update (stabilisation des e2e labellisation)
- **Découvert le** : 2026-05-21

