# Dépôt PCAET porté par un Supra pour plusieurs EPCI — plan de mise en œuvre

> Esquisse Notion : https://app.notion.com/p/3e96523d57d781a09583f628396080b0 · statut : WIP, à reprendre

## Contexte

Esquisse Notion « Dépôt PCAET porté par un Supra pour plusieurs EPCI » (pariée le 27/10, cycle C3-26, petite fournée).
Un PETR, un syndicat mixte ou un pôle métropolitain dépose un PCAET pour le compte de plusieurs EPCI à fiscalité propre, qui restent juridiquement obligés. Aujourd'hui, tout le dépôt repose sur **une seule** `demarche.collectivite_id`. Aucun EPCI couvert ne voit le dépôt, aucun n'est notifié, et côté DREAL/DDT chaque EPCI couvert apparaît comme « aucun dépôt ».

Règle de fond : **1 dépôt = 1 PCAET = 1 diagnostic**, au périmètre du PCAET. Le PA reste chez le Supra.

Décisions prises (esquisse, commentaires du 03/11, échanges avec Leny) :
- **Liste des EPCI à cocher : tout décoché**, sauf renouvellement, où l'on reprend le périmètre du dépôt précédent. Le lien Supra → EPCI en base (`collectivite_relations`) sert seulement à **proposer** des candidats, jamais à décider.
- **Rien côté EPCI** : pas de choix « mon PCAET est porté par une autre structure », pas d'état « délégué ». Un EPCI voit le dépôt du Supra **seulement s'il est coché dans son périmètre**.
- **Amélioration de l'import IA** (CT concernées par fiche) : lot séparé, plus tard.
- Pas de nouveau rôle. On réutilise la lecture seule des services déconcentrés.

## Lot 0 — Données (prérequis, sans code)

`collectivite_relations` est **vide sur staging**. La prod n'a pas été vérifiée. En local, l'import relie bien PETR / pôles métropolitains / SM → EPCI (1 470 liens, et 120 des 124 PETR du CSV existent sur staging).
- Lancer `collectivites.relations.importSyndicatEpciRelations` en service role sur staging puis en prod (procédure tRPC existante, [import-collectivite-relations.service.ts](apps/backend/src/collectivites/import-collectivite-relations/import-collectivite-relations.service.ts)).
- Ce n'est pas bloquant pour livrer : sans lien, la liste de candidats est vide et le porteur passe par la recherche.

## Lot 1 — Modèle et périmètre côté porteur

**Migration sqitch** `demarche/pcaet_collectivite_couverte` (deploy, revert, verify), jouée **avant** le backend :
- Table `public.demarche_pcaet_collectivite_couverte (demarche_id → demarche ON DELETE CASCADE, collectivite_id → collectivite ON DELETE CASCADE, created_at, created_by, PK (demarche_id, collectivite_id))`.
- RLS sans policy, plus `REVOKE … FROM anon, authenticated`, sur le modèle de `collectivite_perimetre_secondaire`.
- Garde-fous en trigger : la collectivité couverte ≠ le porteur, et sa nature est un EPCI à fiscalité propre (CC, CA, CU, METRO, EPT).
- Pas d'unicité entre dépôts. Un EPCI déjà couvert ou déjà en dépôt propre déclenche une **alerte non bloquante** (piège n° 3).
- Modèle Drizzle à côté de [demarche.table.ts](apps/backend/src/demarches/shared/models/demarche.table.ts).

**Domaine** ([pcaet-assujettissement.rules.ts](packages/domain/src/demarches/pcaet/pcaet-assujettissement.rules.ts)) :
- `estNatureSupraPcaet(natureInsee)` : vrai pour les sous-types `SYNDICAT` et `POLE` de `NATURE_TO_SOUS_TYPE`. Ne pas réutiliser `isSyndicat` des trajectoires, qui range EPT parmi les syndicats.
- Le schéma zod du périmètre est un tableau d'ids, unique.

**Backend** (`apps/backend/src/demarches/pcaet/`) :
- `getDepotContext` ([get-depot-context.service.ts](apps/backend/src/demarches/pcaet/get-depot-context/get-depot-context.service.ts)), à enrichir avec :
  - `estSupra`
  - `epciCandidats` : enfants EPCI FP du porteur dans `collectivite_relations`, chacun avec `aUnDepotEnCours` et `dejaCouvertPar`
  - `perimetrePrecedent` : périmètre du dernier dépôt abouti du porteur, pour le pré-cochage en renouvellement, via `DemarcheHistoriqueRepository`
- `create` : entrée optionnelle `collectivitesCouvertesIds`, validée (existence, EPCI FP, ≠ porteur, porteur Supra) et écrite dans la même transaction. Le cas « un seul EPCI » suit le même chemin.
- Nouvelle procédure `demarches.pcaet.setCollectivitesCouvertes` : préambule d'écriture `DemarchePcaetAccessService`, autorisée tant que le statut est dans `DEPOT_AVIS`. **Figée après transmission**, parce que les saisines sont calculées à ce moment-là.
- `get` renvoie `collectivitesCouvertes` (id, nom), avec les alertes.

**Front** (`apps/app/src/demarches/pcaet/`) :
- [create.page.tsx](apps/app/src/demarches/pcaet/create.page.tsx) : si `estSupra`, une question en tête, « Ce PCAET est élaboré pour ».
  - Liste de `Checkbox` (`@tet/ui`) avec les candidats, décochés, ou pré-cochés depuis `perimetrePrecedent`.
  - `MultipleCollectiviteSelector` ([multiple-collectivite.selector.tsx](apps/app/src/plans/fiches/share-fiche/multiple-collectivite.selector.tsx)) filtré sur les EPCI, pour en ajouter un hors liste.
  - Alertes en ligne.
- En-tête du dossier ([components/header/index.tsx](apps/app/src/demarches/pcaet/components/header/index.tsx)) : un champ « Couvre N EPCI », éditable comme `obligation-field.tsx`, en lecture seule après transmission.

## Lot 2 — Lecture par l'EPCI couvert

- **Accès** : dans [depot-permissions.service.ts](apps/backend/src/demarches/pcaet/shared/depot-permissions.service.ts), ajouter une branche « membre actif d'une collectivité couverte par la démarche ». Elle donne la lecture seule **quel que soit le statut**, dès la création.
  - Elle sert à `getDossierInstruction`, `getDiagnosticInstruction`, `getDossierDocumentUrl` et au zip.
  - Jamais d'avis, jamais de mutation.
- **Liste** : nouvelle procédure `demarches.pcaet.listDepotsCouvrants({collectiviteId})`, qui renvoie les dépôts couvrant cet EPCI, avec porteur et statut.
  - [list-demarches-pcaet.page.tsx](apps/app/src/demarches/pcaet/list-demarches/list-demarches-pcaet.page.tsx) et la variante publique affichent une section « PCAET porté par [Supra] » + statut + « Consulter le dépôt ».
  - **Corriger la redirection automatique vers `/nouveau`** quand la liste propre est vide mais qu'un dépôt couvrant existe.
  - Le bouton « Commencer un dépôt » reste disponible : l'EPCI n'est jamais bloqué.
- **Vue** : nouvelle route `/collectivite/[id]/demarche-pcaet/couverture/[demarcheId]`. Elle reprend les sections de `DossierInstructionPage` (`dossier.header`, `etape-documents`, `etape-diagnostic`, `etape-plan`) sans le panneau d'avis, avec un bandeau « porté pour votre compte par [Supra] ».
- Pas d'activation d'espace ni de création de compte pour un EPCI sans admin (piège n° 4).

## Lot 3 — Services déconcentrés

- **Couverture et saisine** : les codes du dépôt deviennent l'**union** des codes du porteur et de ceux de ses EPCI couverts, périmètres secondaires compris. À appliquer dans :
  - [perimetre-instructeur.columns.ts](apps/backend/src/demarches/pcaet/shared/perimetre-instructeur.columns.ts)
  - `PcaetInstructeursRepository.listInstructeursCouvrants` / `saisirInstructeurs`
  - `canConsulterDemarche`

  Une DDT d'un département couvert seulement par un EPCI membre voit ainsi le dépôt. Le statut `principal` reste celui du siège du porteur ; les autres services sont saisis en `secondaire`, en lecture seule. **Règle à faire confirmer par la DGEC.**
- **Tableau** ([list-dossiers-instruction.repository.ts](apps/backend/src/demarches/pcaet/list-dossiers-instruction/list-dossiers-instruction.repository.ts)) : `LEFT JOIN` sur la table de couverture.
  - La ligne d'un EPCI couvert porte la démarche du porteur, avec `couvertPar: {id, nom}`, au lieu de « aucun dépôt ».
  - La ligne du porteur porte `collectivitesCouvertes`.
  - Mettre à jour le schéma de sortie, l'adapter, `CollectiviteCell` (mention « couvert par le dépôt de [Supra] » ou « couvre N EPCI », dépliable) et les métriques : un EPCI couvert compte comme ayant un dépôt.

## Lot 4 — Notifications

- `ListDestinatairesDemarcheService.list` ([list-destinataires-demarche.service.ts](apps/backend/src/demarches/pcaet/notifications/list-destinataires-demarche.service.ts)) :
  - ajouter les admins des collectivités couvertes. `CollectiviteContactsRepository` accepte déjà plusieurs ids.
  - Marquer chaque destinataire avec `pourCollectiviteId`, et dédoublonner les personnes qui sont à la fois admin du porteur et d'un EPCI couvert.
- `NotifyAvisRecu` et `NotifyInstructionClose` :
  - ajouter un `porteurNom` optionnel dans les props et dans `notificationData`, avec la mention « porté pour votre compte par [Supra] » ;
  - adapter le `raison` du pied de page ;
  - pour l'EPCI couvert, le CTA pointe vers la route de consultation du lot 2 : à ajouter dans `GetDemarcheUrlService`.
- Aucune nouvelle notification : on garde « les notifications déjà prévues ».

## Découpage en PR

Une PR par lot, empilées : 1 → 2 → 3 → 4. Le lot 0 est une opération manuelle à faire avant la recette.

## Hors plan (rappel)

- Import IA : détection des CT concernées par fiche (lot à part).
- Diagnostic décliné par EPCI : réponse DGEC attendue (mail à Louise le 26/10). S'il est exigé, il passera en pièce jointe.
- Archivage croisé : la publication d'un dépôt Supra n'archive pas un PCAET publié en propre par un EPCI couvert, car `archiverRemplacees` est limité à un `collectivite_id`. À traiter si le cas se présente.
- Publication grand public sur la page de l'EPCI, pilotage conjoint du PA, nouveau rôle.

## Vérification

- **Domaine** : tests unitaires de `estNatureSupraPcaet` et de l'union des codes de couverture.
- **Backend e2e** (relire d'abord la mémoire « Tests e2e TeT ») : `nx test backend 'pcaet'`. Cas à couvrir :
  - création avec périmètre, et refus d'un non-EPCI, du porteur ou d'un porteur non Supra
  - édition refusée après transmission
  - lecture accordée à un membre d'un EPCI couvert, refusée à un EPCI non couvert et à un non-membre
  - ligne « couvert par » dans `listDossiersInstruction`
  - DDT d'un département secondaire saisie
  - destinataires des notifications

  Les fixtures s'appuient sur `ensureCollectiviteRelationsImported`.
- **Migration** : jouer deploy, revert et verify (`make db-migrate` ne joue que deploy).
- **Typecheck** : `nx typecheck` sur domain, backend et app ; lint depuis le projet.
- **Recette locale** sur le PETR du Pays Lauragais (4 CC déjà reliées en local) :
  1. créer le dépôt en cochant 3 CC ;
  2. se connecter en admin d'une CC couverte : ligne « Porté par… » et consultation en lecture ;
  3. côté DREAL Occitanie : ligne porteur « couvre 3 EPCI » et lignes « couvert par » ;
  4. transmettre, valider un avis, vérifier les mails générés dans `notifications.notification`.
