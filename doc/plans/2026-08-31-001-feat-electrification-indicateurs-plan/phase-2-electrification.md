---
title: 'Phase 2 — Catalogue et config Électrification'
parent: ./README.md
kind: phase
phase: 2
---

# Phase 2 — Catalogue et configuration Électrification

[← Index](README.md)

Créer le référentiel versionné engagement–indicateur, puis — **seulement si TeT en reçoit le
mandat** — la config des lauréats et l'intégration aux plans.

**Prérequis** : catalogue canonique + périmètre arbitré ; mandat TeT sur la personnalisation ;
socle mensuel livré (Phase 1).

Emplacements : `packages/domain/src/indicateurs/electrification/`,
`apps/backend/src/indicateurs/electrification/`, changements `data_layer/sqitch/`, sous-router
composé dans `indicateurs.router.ts`. `ElectrificationModule` importé par `IndicateursModule`.

## Task 2.1 — Référentiel versionné + import sécurisé

- tables catalogue/axe/engagement/mapping (voir [README](README.md#modèle-métier-électrification)) ;
- import via endpoint **authentifié** ou job avec lot/checksum/compte-rendu, idempotent ;
- **ne pas** réutiliser le contrôleur d'import anonyme `GET` pour des candidatures confidentielles ;
- campagne/participants/cibles ajoutés uniquement si TeT les porte ; RLS sans policy client ;
- deploy/revert/verify + tests d'intégrité.

## Task 2.2 — API de configuration conditionnelle

- lire la config applicable depuis la source retenue ; exposer le catalogue applicable ;
- si stockée dans TeT : modifier engagements/cibles selon permissions, tracer la provenance ;
- pattern `Result` (permissions/transaction dans le service, erreurs tRPC à la frontière) ;
- **permission plateforme dédiée** (non donnée automatiquement au super-admin) — ajouter à
  `permission-operation.enum.schema.ts` et `permission.models.ts`.

## Task 2.3 — Option d'intégration au plan

Choisir : plan existant / nouveau manuel / provisionné / aucun.

Si provisionné : orchestrateur `create-electrification-plan` composant les services plan+axe
(via `PlanModule` + `TransactionManager`, sans toucher aux repositories de `plans`),
transactionnel, idempotent, unicité campagne–participant.

- garder `electrification_engagement_indicateur` comme mapping canonique, indépendant des axes ;
- `axe_indicateur` pour associations locales, `fiche_action_indicateur` pour liens fiche ;
- **ne pas** utiliser `indicateur_action` (référentiels CAE/ECI/TE) ni le nom d'axe comme clé ;
- ⚠️ `UpsertAxeRepository.setAxeIndicateurs` **remplace** tout : à la création OK, mais une sync
  ultérieure doit être additive — tracer la provenance (`origine`) et ne supprimer que les liens
  provisionnés, jamais les manuels.

## Task 2.4 — Parcours territorial

- accès contextuel depuis le plan (si retenu), sinon bibliothèque préfiltrée ;
- catégorie/filtres/libellés `electrification` (`app/paths.ts`,
  `ui/dropdownLists/indicateur/utils.ts`, `labels/indicateurs.labels.ts`) ;
- réutiliser `IndicateurCard`, sélecteur d'indicateurs, filtres ; saisie mensuelle via la variante ;
- relation action → engagement selon le contrat validé ;
- états vides (catalogue manquant / engagement non retenu / mois non renseigné) ; pas d'onglet global.

## Tests clés

Import idempotent ; FK/unicités des versions/codes/mappings ; plan provisionné une seule fois,
IDs persistés, liens manuels préservés ; tables de personnalisation inaccessibles au client.
