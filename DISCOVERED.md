# Découvertes hors-scope

## [refactor] La surface `/referentiel/[id]/labellisation` duplique l'onglet audit et porte seule le suivi d'audit
- **Symptôme** : depuis la suppression de `referentiel/new` et de son gate, cette surface n'est plus interceptée et devient visible sans condition. Elle expose l'ancienne UI (`HeaderLabellisationConnected`, `CriteresLabellisationConnected`) en parallèle de l'onglet « Audit et labellisation » de l'overview, avec deux implémentations distinctes du bouton de demande d'audit.
- **Localisation** : `apps/app/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/labellisation/**` ; boutons divergents dans `apps/app/src/referentiels/labellisations/HeaderLabellisation.tsx:32,145` (`ApplyAuditButton`) vs `apps/app/src/referentiels/audit-labellisation/checklist/actions/start-audit.button.tsx`. Entrée utilisateur : `apps/app/src/referentiels/tableau-de-bord/labellisation/Scores.tsx:121`.
- **Diagnostic suspecté** : ce n'est pas du code mort, mais `criteres` et `cycles` sont désormais dupliqués avec l'overview. L'onglet « Suivi de l'audit » a été supprimé depuis (il était inatteignable : le layout n'acceptait de le rendre que si `status === 'audit_en_cours'`, état où le bouton du tableau de bord qui y menait était précisément désactivé). Reste donc à faire converger la décision « Demander un audit » sur une seule fonction domaine, puis à rediriger le lien du tableau de bord avant de supprimer la surface.
- **Impact** : utilisateur — deux chemins vers l'audit dont les règles d'activation du bouton peuvent diverger ; dev — toute règle métier d'audit doit être écrite deux fois.
- **Découvert pendant** : TET-6818/refonte-main-nav (suppression de `referentiel/new`)
- **Découvert le** : 2026-08-17

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

## [improvement] Une migration de données de référence peut périmer des assertions TS sans que rien ne le signale
- **Symptôme** : `demarche/pcaet_diagnostic_ordre_reglementaire` (commit `f43f017abb`) permute le `display_order` de deux topics PCAET et met à jour le test pgTAP voisin, mais laisse rouges deux specs TS qui figeaient l'ancien ordre (`get-diagnostic.router.e2e-spec.ts:84`, `demarche-pcaet-workflow.spec.ts:97`). Résultat : `test-backend` et `test-e2e` rouges sur toutes les branches, de façon déterministe, jusqu'à ce que quelqu'un remonte à la migration. Corrigé par la PR #4809.
- **Localisation** : `data_layer/sqitch/deploy/demarche/` (migrations qui font des `UPDATE` sur des données de référence) vs les specs TS qui les assertent.
- **Diagnostic suspecté** : rien ne relie une migration de données de référence aux tests applicatifs qui en dépendent. Les tests pgTAP colocalisés sont mis à jour parce qu'ils sont dans le même dossier ; les specs backend/e2e sont à deux dossiers de là et personne ne pense à les chercher. Piste : un test qui compare l'ordre servi par l'API à `SELECT code FROM demarche_pcaet_topic ORDER BY display_order` plutôt qu'à une liste littérale, ce qui déplacerait l'assertion vers « l'API respecte l'ordre de la base » — la propriété qu'on veut vraiment — au lieu de dupliquer la donnée.
- **Impact** : dev — checks CI rouges de façon persistante, qui masquent les régressions réelles et coûtent un diagnostic complet à chaque personne qui les croise.
- **Découvert pendant** : chore/eslint-no-hardcoded-app-path (qualification des rouges CI de la PR #4807)
- **Découvert le** : 2026-08-17

