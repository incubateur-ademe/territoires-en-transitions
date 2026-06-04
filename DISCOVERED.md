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

## [bug] `parcours.isCot` et `identite.activeCOT` divergent sur une collectivité dont le COT est inactif
- **Symptôme** : deux sources de vérité « collectivité COT » qui peuvent se contredire. Pour une ligne `cot(collectivite_id, actif=false)`, `parcours.isCot` vaut `true` alors que `identite.activeCOT` vaut `false`.
- **Localisation** : `apps/backend/src/referentiels/labellisations/get-labellisation.service.ts:367-376` (`isCot` teste seulement `cotResult.length > 0`, avec un TODO ligne 374) vs `apps/backend/src/collectivites/list-collectivites/list-collectivites.service.ts:164` (`activeCOT: coalesce(cotTable.actif, false)`).
- **Diagnostic suspecté** : `isCot` ignore la colonne `actif`. La règle domaine `areAuditPrerequisitesMet`/`canRequestAuditOrLabellisation` consomme `parcours.isCot` (exemption de fichier en 1ère étoile COT) ; un COT inactif y serait traité comme actif. Le bouton « Demander un audit » utilise `identite.activeCOT` (correct) pour `availableAuditTypes`, donc l'incohérence n'affecte pas le cas étoile ≥ 2, mais les deux sources devraient être unifiées.
- **Impact** : dev/archi — double source de vérité ; utilisateur potentiel — exemption de pièce en 1ère étoile pour un COT inactif.
- **Découvert pendant** : audit-badge-component (fix activation « Demander un audit »)
- **Découvert le** : 2026-06-04

## [improvement] La fenêtre de 15 j post-clôture accorde le rôle auditeur complet, alors que le label ne promet que le remplacement du rapport
- **Symptôme** : le fix « auditeur garde son rôle 15 j après la clôture » (getAuditRoles) restitue le rôle `AUDITEUR` **plein** (avec `referentiels.mutate`) pendant la fenêtre. Or `catalog.ts:413` ne promet que de « remplacer le rapport d'audit dans les 15 jours ». L'auditeur peut donc, pendant 15 j, modifier des statuts/scores au-delà du seul rapport.
- **Localisation** : `apps/backend/src/users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.repository.ts` (getAuditRoles, fenêtre 15 j) + `apps/backend/src/users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.adapter.ts:32` (mappe vers `AuditRole.AUDITEUR` sans dégrader) + `packages/domain/src/users/.../permission.models.ts` (permissions du rôle AUDITEUR).
- **Diagnostic suspecté** : il faudrait un rôle auditeur **post-clôture dégradé** (lecture + remplacement du rapport uniquement) ou une permission dédiée `modify_validated_audit_report`, attribué pendant la fenêtre à la place du rôle plein. Hypothèse prise pour le fix initial : rôle plein (prolongation simple), faute de décision produit.
- **Impact** : sécurité/produit — surface de modification trop large pour un audit clos.
- **Découvert pendant** : audit-badge-component (fix rôle auditeur post-clôture)
- **Découvert le** : 2026-06-04

## [refactor] Acte d'engagement et documents de candidature partagent une liste de preuves à plat sans distinction de type
- **Symptôme** : aucune colonne ne distingue « acte d'engagement » de « document de candidature » ; le front traite `preuves[0]` comme l'acte (identification purement positionnelle). Dans la fenêtre où les deux lignes s'affichent ensemble (non-COT, aucune étoile obtenue mais `score_fait >= 0.35`), `preuves[0]` apparaît à la fois dans la ligne acte et dans la liste candidature (duplication visuelle, et l'acte devient supprimable depuis la ligne candidature).
- **Localisation** : `apps/backend/src/referentiels/labellisations/list-preuves/list-preuves.service.ts` (tri `orderBy(id)` + commentaire « le front traite preuves[0] comme l'acte d'engagement ») ; `apps/backend/src/collectivites/documents/models/preuve-labellisation.table.ts` (pas de champ type/catégorie) ; `apps/app/src/referentiels/audit-labellisation/checklist/table/sections/acte-engagement.section.tsx:42` (`preuves?.[0]`) ; `.../candidature-documents.section.tsx` (liste toutes les preuves) ; visibilités mutuellement non exclusives : `.../rules/is-acte-engagement-visible.ts` (non-COT && 0 étoile) vs `.../rules/is-candidature-documents-visible.ts` (`maxRequestableStar > 1`, score-based via `packages/domain/src/referentiels/labellisations/requestable-star.ts`).
- **Diagnostic suspecté** : il faudrait un champ de type/catégorie sur `preuve_labellisation` (ou un sous-type de demande) pour distinguer acte vs candidature, plutôt qu'une convention positionnelle. Cela supprimerait la duplication et permettrait des règles d'édition propres par type. Tentative d'exclusion positionnelle (`preuves.slice(1)`) rejetée : casse le cas normal d'une demande de 2ᵉ étoile où `preuves[0]` est un vrai document de candidature.
- **Impact** : utilisateur — duplication/édition ambiguë dans la fenêtre de chevauchement ; dev/archi — convention positionnelle fragile, cast `as unknown as TPreuveLabellisation[]` subsistant dans `CriteresLabellisation.tsx:69`.
- **Découvert pendant** : audit-badge-component (ajout remplacer/supprimer documents de candidature)
- **Découvert le** : 2026-06-04

## [refactor] L'invalidation des queries de preuves d'une demande est triplée
- **Symptôme** : la même invalidation (`listPreuvesLabellisation` + `getParcours`) est répétée dans trois hooks de mutation.
- **Localisation** : `apps/app/src/referentiels/labellisations/useAddPreuveToDemande.ts` (branche replace) ; `apps/app/src/referentiels/preuves/Bibliotheque/useEditPreuve.ts` (`useRemovePreuve`, branche `demande`) ; `apps/app/src/referentiels/labellisations/useRemovePreuveFromDemande.ts` (nouveau).
- **Diagnostic suspecté** : extraire un helper `invalidateDemandePreuveQueries(queryClient, trpc, { demandeId, collectiviteId, referentielId })` consommé par les trois. Non fait ici pour rester dans le scope (toucherait le module preuves/Bibliotheque) ; le nouveau hook suit le style inline de son voisin `useAddPreuveToDemande`.
- **Impact** : dev — duplication de logique d'invalidation, risque de dérive si les clés changent.
- **Découvert pendant** : audit-badge-component (ajout remplacer/supprimer documents de candidature)
- **Découvert le** : 2026-06-04

## [refactor] Deux sources pour les seuils de score par étoile (DB vs barème domaine)
- **Symptôme** : le mapping « score réalisé → étoile » existe en double. La règle de demande utilise le barème en dur `ETOILE_MIN_REALISE_SCORE` (domaine), tandis que `getEtoileCible` lit les mêmes seuils depuis la table `etoile_meta` (`min_realise_percentage` → `min_realise_score`).
- **Localisation** : `packages/domain/src/referentiels/labellisations/requestable-star.ts` (`ETOILE_MIN_REALISE_SCORE`, `getMaxRequestableStar`) ; `apps/backend/src/referentiels/labellisations/get-labellisation.service.ts:687-691` (`maxEligibleEtoile` inline depuis `getEtoileDefinitions`) et `:640-645` (`critere_score`).
- **Diagnostic suspecté** : les seuils sont constants (35/50/65/75 %, table `etoile_meta` sans dimension référentiel). Faire consommer `ETOILE_MIN_REALISE_SCORE` par `getEtoileCible`/`critere_score` (ou inversement dériver le barème de la table) pour une source unique. Non fait ici : `getEtoileCible` calcule aussi l'objectif (`Math.max` avec étoile labellisée + prochaine), hors scope du plafond de demande.
- **Impact** : dev — risque de divergence si les seuils changent d'un côté seulement.
- **Découvert pendant** : audit-badge-component (plafond de l'étoile demandable par le score)
- **Découvert le** : 2026-06-04
