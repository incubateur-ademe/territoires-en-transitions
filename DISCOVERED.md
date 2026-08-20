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


## [improvement] Libellé de repli « Sans titre » en dur dans la table de résolution des filtres
- **Symptôme** : la chaîne user-facing `'Sans titre'` (repli d'un plan introuvable) est écrite en dur au lieu de passer par `appLabels.*`, contrairement à la règle catalogue du repo.
- **Localisation** : `apps/app/src/plans/fiches/list-all-fiches/filters/build-lookup-config.ts:41` (`planActionIds.fallbackLabel`).
- **Diagnostic suspecté** : antérieur au découpage du fichier ; déplacé tel quel lors de l'extraction de `buildLookupConfig`, sans être corrigé pour garder le diff traçable au correctif.
- **Impact** : dev — chaîne non traduisible/non centralisée ; utilisateur — aucun.
- **Découvert pendant** : fix/badge-pilote-tdb-perso (ajout d'un libellé de repli sur les clés personne)
- **Découvert le** : 2026-08-20

## [improvement] `LookupConfig.items` typé `any[]` dans la résolution des libellés de filtres
- **Symptôme** : `items: any[] | undefined` — seul `any` restant du fichier, signalé par `@typescript-eslint/no-explicit-any`.
- **Localisation** : `apps/app/src/plans/fiches/list-all-fiches/filters/build-lookup-config.ts:6`.
- **Diagnostic suspecté** : les consommateurs lisent `item[config.key]` et `item[config.valueKey]` via des clés dynamiques ; `Record<string, unknown>[]` serait le type honnête, mais les listes réelles (plans, services, tags) ne s'y assignent pas toutes sans index signature. Demande de vérifier chaque source avant de resserrer.
- **Impact** : dev — aucune vérification de type sur le contenu des tables de résolution.
- **Découvert pendant** : fix/badge-pilote-tdb-perso (extraction de `buildLookupConfig`)
- **Découvert le** : 2026-08-20
