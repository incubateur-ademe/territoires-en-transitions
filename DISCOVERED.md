# Découvertes hors-scope

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

## [refactor] Le backend n'implémente pas l'ADR « pas de throw en service → Result<T,E> »
- **Symptôme** : la convention `.claude/CLAUDE.md` impose `Result<T,E>` (neverthrow) pour les erreurs métier des services ; en réalité tout `apps/backend` signale les erreurs métier via `throw new *Exception` NestJS. 34 fichiers throw une exception HTTP, 0 fichier importe `neverthrow`.
- **Localisation** : ensemble de `apps/backend/src/**/*.service.ts` (ex. `indicateurs/valeurs/crud-valeurs.service.ts:306,322,454,631,730`).
- **Diagnostic suspecté** : l'ADR décrit une cible hexagonale non appliquée côté backend. Une migration cohérente suppose un mapper `Result → TRPCError` centralisé + reprise service par service ; la faire à la maille d'une seule méthode créerait le seul `Result` du backend et casserait la surface d'erreur tRPC (le routeur renverrait l'objet Result en success).
- **Impact** : archi — écart durable entre convention documentée et code ; dev — ambiguïté sur la règle à suivre pour tout nouveau service.
- **Découvert pendant** : feat/indicateur-upsert-resultat (revue /ce:review)
- **Découvert le** : 2026-07-03

## [refactor] Le format ISO de `dateValeur` n'est contraint que sur un seul chemin d'appel
- **Symptôme** : `upsert-valeur-field.request.ts:13` durcit à la main `z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/))`, alors que le schéma domaine `indicateurValeurSchemaCreate.shape.dateValeur` reste un `z.string()` nu. La règle pure `yearOf` (`valeur-field.rules.ts:3`, `dateValeur.slice(0,4)`) dépend de ce format ISO, mais seul ce chemin l'impose ; `upsert` (sibling) ne le garantit pas.
- **Localisation** : `apps/backend/src/indicateurs/valeurs/upsert-valeur-field.request.ts:13` ; `packages/domain/src/indicateurs/valeurs/indicateur-valeur.schema.ts:13`.
- **Diagnostic suspecté** : le contrat de format devrait vivre dans le schéma domaine (ou un `DateValeur` brandé) et être consommé par les deux requests, plutôt que dupliqué/partiel. Hors-scope ici car cela touche `packages/domain` et le request sibling.
- **Impact** : dev — anti-duplication ; correction pure couplée à une invariant enforçée à un seul endroit.
- **Découvert pendant** : feat/indicateur-upsert-resultat (revue /ce:review)
- **Découvert le** : 2026-07-03

## [improvement] Validation métier avant autorisation dans upsertValeurField
- **Symptôme** : `upsertValeurField` lève `BadRequestException` (règle année future) avant de déléguer à `upsertValeur` où vit le contrôle d'autorisation (`canMutateValeur`). Un utilisateur sans droit `mutate` sur la collectivité qui soumet un résultat futur reçoit 400 au lieu de 403.
- **Localisation** : `apps/backend/src/indicateurs/valeurs/crud-valeurs.service.ts:631` (validation) vs `:504` (autorisation dans `upsertValeur`).
- **Diagnostic suspecté** : ordre conventionnel = autoriser puis valider. Divulgation triviale (n'expose que la règle temporelle, aucune donnée ressource), d'où priorité basse.
- **Impact** : utilisateur — code d'erreur incohérent sur un cas non autorisé ; sécurité — divulgation négligeable.
- **Découvert pendant** : feat/indicateur-upsert-resultat (revue /ce:review)
- **Découvert le** : 2026-07-03

