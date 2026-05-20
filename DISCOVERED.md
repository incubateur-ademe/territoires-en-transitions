# Découvertes hors-scope

## [bug] La checklist audit-labellisation ne se rafraîchit pas au retour SPA après une mise à jour de statut
- **Symptôme** : depuis la checklist, ouvrir une mesure via « Voir la mesure », passer son statut à « Fait », puis revenir (`goBack`) ne met pas à jour l'icône du critère. Un rechargement manuel (`reload`) est nécessaire.
- **Localisation** : `apps/app/src/referentiels/labellisations/useLabellisationParcours.ts` (query `getParcours`) + `apps/app/src/referentiels/actions/action-statut/use-action-statut.ts` (invalidation `getParcours` dans `onSuccess`).
- **Diagnostic suspecté** : l'invalidation de `getParcours` est émise alors que l'utilisateur est sur la page mesure (aucun observer actif pour cette query, le `ChecklistProvider` est démonté). Au `goBack`, le subtree audit-labellisation remonte mais `refetchOnMount` ne re-déclenche pas la query (probablement cache de navigation Next.js App Router / BFCache). Trace réseau : aucun `getParcours` après `updateStatut` lors du retour. Piste de fix : `refetchOnMount: 'always'` sur la query parcours, ou refetch explicite sur changement de route.
- **Impact** : utilisateur — données de critères périmées affichées après navigation retour, jusqu'à un refresh manuel.
- **Découvert pendant** : audit-checklist-view-update (stabilisation des e2e labellisation)
- **Découvert le** : 2026-05-21

## [bug] Le critère de labellisation d'une tâche est évalué sur le parent sous-action, le rendant insatisfaisable par un seul update
- **Symptôme** : le critère « Être en conformité PCAET » (`cae_1.1.2.0.1`) ne devient jamais atteint quand on passe uniquement cette tâche à « Fait ». Il faut passer aussi la tâche sœur BGES (`cae_1.1.2.0.2`).
- **Localisation** : `apps/backend/src/referentiels/labellisations/get-labellisation.service.ts:708-713` (branche `parent.score.avancement !== NON_RENSEIGNE` → évalue le ratio du parent au lieu de la tâche).
- **Diagnostic suspecté** : dès que la sous-action parent `1.1.2.0` a une avancement (parce qu'une de ses tâches est renseignée), le critère bascule sur le ratio du parent. Le parent a deux tâches (PCAET + BGES) à 0 point : passer une seule donne 50 % (comptage de tâches via `getScoreRatios` quand `pointPotentiel === 0`), sous le seuil 100 % du critère « Programmé ou fait ». À confronter avec le comportement attendu : un critère portant sur une tâche précise devrait-il vraiment dépendre du parent ?
- **Impact** : utilisateur — un critère affiché peut être impossible à satisfaire en renseignant la seule mesure désignée ; dev — pièges de test (cf. `checklist-statut-refresh.spec.ts` qui doit passer les deux tâches).
- **Découvert pendant** : audit-checklist-view-update (stabilisation des e2e labellisation)
- **Découvert le** : 2026-05-21
