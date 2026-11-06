---
title: 'Lot 6 — Généralisation'
parent: ./README.md
kind: lot
lot: 6
updated: 2026-11-06
---

# Lot 6 SNBC 3 : généralisation

> Décision d'architecture : [ADR 0023](../../adr/0023-integration-trajectoire-snbc3.md) (§4 : généralisation ; file `compute-trajectoire` retirée, code Sheets conservé jusqu'au retrait de la SNBC 2).
> [Plan général](./README.md) (décision de conception 5, ordre de livraison).

## Contexte

Le lot 6 retire le flag et l'ancien chemin, arrête le calcul SNBC 2 et fait passer le score indicatif sur `snbc3`, en une seule livraison. La transition commence avec lui.

Prérequis :
- le feu vert des experts métier sur la dernière livraison importée ;
- le flag ouvert à tous en prod, pendant la durée fixée au lot 0, sans retour bloquant.

## Retrait du flag

- Retirer `is-trajectoire-snbc3-enabled` de `packages/domain/src/utils/feature-flags.ts`, puis de PostHog après le déploiement.
- Backend :
  - retirer le filtre conditionnel de `list-indicateur-valeurs.service.ts` et de la liste des sources (lot 1). Les exclusions génériques restent ;
  - retirer le contrôle `TRAJECTOIRE_SNBC3_NON_OUVERTE` des procédures `trajectoires.snbc3` et des routes d'export ;
  - leviers et PPT : garder le seul chemin SNBC 3.
- Frontend : garder la seule nouvelle page, et la branche « avec flag » de la priorisation et de la fiche indicateur.

## Retrait de l'ancien chemin

**API**
- Retirer `snbc.compute`, `snbc.getOrCompute`, l'ancien `checkStatus`, ainsi que les endpoints REST `telechargement` et `modele` et `modele-trajectoire-telechargement.request.ts`.
- Le REST `GET /trajectoires/snbc` reste disponible et renvoie désormais la SNBC 3.
- Domaine : l'enum `StatutTrajectoireSnbc3` et ses règles remplacent `verification-trajectoire-status.ts`, `canComputeTrajectoireSnbc`, `SYNDICAT_NATURES` et `isSyndicat`. Supprimer `data-sufficiency.ts` et `get-indicateur-trajectoire-for-value-input.ts`.
- Leviers : supprimer `extractTrajectoireSource`, la requête des résultats, `TRAJECTOIRE_SOURCES_NOT_EXTRACTABLE` et `TRAJECTOIRE_NOT_COMPUTED`. `REFERENCE_YEAR` devient `ANNEE_REFERENCE_SNBC_V3`.

**Frontend** (`apps/app/src/app/pages/collectivite/Trajectoire/`)
- Supprimer l'ancienne page :
  - `Presentation`, `DonneesNonDispo`, l'ancien `TrajectoireCalculee.tsx`, `DonneesPartiellementDisponibles.tsx`, `DonneesCollectivite/` et sa story ;
  - l'ancien `AllerPlusLoin.tsx`, `useTelechargementTrajectoire.ts`, `useTelechargementModele.ts` et `use-indicateur-trajectoire.ts` ;
  - l'ancienne carte d'état vide et `trajectoire-reference.alert.tsx`.
- Les variantes SNBC 3 de `METHODO_PAR_SECTEUR` et de `DOC_METHODO` remplacent les actuelles.
- Retirer le déclenchement du calcul de `IndicateurDetail.tsx` et l'ancienne branche de la priorisation (CTA « Calculer ma trajectoire »).
- Libellés et PostHog : retirer `triggerSnbcCalculation`.

**Code SNBC 2 débranché, mais conservé jusqu'au lot 7**, pour qu'un simple revert permette de revenir en arrière :
- `trajectoires-spreadsheet.service.ts` et `TrajectoiresXlsxService` restent, mais plus rien ne les appelle ;
- la logique d'entrées de `trajectoires-data.service.ts` (`verificationDonneesSnbc` : interpolation 2015, fallback, parsing de `objectifCommentaire`) reste aussi, puisque le service Sheets en dépend. On l'isole dans un fichier SNBC 2, avec ses anciens statuts (`pret_a_calculer`, `mise_a_jour_disponible`, `donnees_manquantes`, `deja_calcule`) dans une enum interne.

## Arrêt du calcul SNBC 2

- Supprimer `apps/tools/src/indicateurs/trajectoires/cron-compute-trajectoire.service.ts`, ainsi que l'entrée `compute-all-outdated-trajectoires` dans `cron/cron.config.ts`, `cron.config.spec.ts` et `cron-consumer.service.ts`. Le planning est fait dans le process par `CronService` : rien à retirer en dehors du dépôt.
- À la mise en prod, vider de Redis les jobs `compute-trajectoire` encore en attente, puisque plus aucun worker ne les traite.
- À partir de là, la SNBC 2 est figée : les corrections RARE prévues (Occitanie, Corse, EPCI à cheval sur deux régions) ne la modifient plus. Ses valeurs (source `snbc`, métadonnée 17) restent en base, en lecture seule, et s'affichent sur les fiches indicateurs (lot 4).

## Score indicatif sur `snbc3`

Il est resté sur `snbc` pendant l'ouverture progressive (raison dans l'ADR §4).

- `valeurs/progression.rules.ts` : `SOURCE_SNBC` devient `'snbc3'`.
- `referentiels/score-indicatif/*` : même bascule.
- `valeurs/indicateur-expression.service.ts` : l'année de référence par défaut de `progression_snbc` passe de `ANNEE_REFERENCE_SNBC_V2` (2015) à `ANNEE_REFERENCE_SNBC_V3` (2021).
- **À vérifier** : le référentiel TE passe l'année en dur (`progression_snbc(cae_1.a, 2015)`, et de même pour `cae_2.a` et `cae_63.a`, dans `referentiel-te-structure.csv`). Selon le sens de ce paramètre (année de départ de la collectivité ou de la trajectoire), les expressions du référentiel sont à mettre à jour et à réimporter.
- Recalculer les scores courants des collectivités concernées. Les snapshots figés ne changent pas.
- Avant la livraison, les experts peuvent comparer les scores indicatifs SNBC 2 et SNBC 3 grâce à une requête ou un script de simulation, en local sur une base de prod restaurée.

## Tests

- Retirer ou adapter les specs de l'ancien chemin : `verification-trajectoire.rules.spec.ts`, `trajectoires.router.spec.ts`, `trajectoires.controller.spec.ts` et les specs des leviers sur la fixture SNBC 2.
- Retirer les cas « sans flag » des specs des lots 1, 2 et 5.
- `score-indicatif.router.e2e-spec.ts` : fixture `snbc3`, année de référence 2021.

## Vérification

- `nx test backend 'trajectoires'`, `nx test backend 'trajectoire-leviers'` et `nx test backend 'score-indicatif'`. `nx build tools`, et les tests de `apps/tools`, passent.
- Dans l'app, avec un EPCI, une commune, une région, un EPCI absent du millésime et Paris : même recette qu'aux lots 3 et 4, mais sans flag.
- Après la mise en prod :
  - le nombre de valeurs de la métadonnée 17 et leur `max(modified_at)` ne bougent plus ;
  - les scores indicatifs d'une collectivité témoin correspondent à la simulation.
