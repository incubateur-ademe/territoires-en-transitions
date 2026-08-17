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

## [bug] L'ordre des topics du diagnostic PCAET n'est pas déterministe
- **Symptôme** : deux tests rouges sur toutes les branches, avec la même empreinte. Backend : `get-diagnostic.router.e2e-spec.ts:84` attend `['profil_energie_climat', 'consommation_energetique', 'sequestration', 'polluants_atmospheriques', 'enr', 'vulnerabilite_territoire']` et reçoit `sequestration` et `consommation_energetique` **après** `polluants_atmospheriques`. E2E : `demarche-pcaet-workflow.spec.ts:97` attend `?topic=consommation_energetique` sur le bouton « suivant » de la barre d'étapes et obtient `?topic=polluants_atmospheriques`. Reproduit 3 fois sur 3 dans le même run (pas un flake transitoire), et à l'identique sur des branches sans rapport (`TET-6818/refonte-main-nav`, `chore/eslint-no-hardcoded-app-path`).
- **Localisation** : `apps/backend/src/demarches/pcaet/get-diagnostic/` (requête des topics) ; se propage à la barre d'étapes via `apps/app/src/demarches/steps.ts`.
- **Diagnostic suspecté** : `ORDER BY` absent ou non total sur la lecture des topics — l'ordre d'affichage repose sur l'ordre physique des lignes, qui varie selon l'état de la base de test. Les deux échecs ont une seule cause : le e2e ne fait que rendre visible l'ordre que le backend renvoie.
- **Impact** : utilisateur — l'ordre des étapes du diagnostic PCAET peut varier d'une collectivité à l'autre ; dev — deux checks CI rouges en permanence, qui masquent les régressions réelles.
- **Découvert pendant** : chore/eslint-no-hardcoded-app-path (qualification des rouges CI de la PR #4807)
- **Découvert le** : 2026-08-17

