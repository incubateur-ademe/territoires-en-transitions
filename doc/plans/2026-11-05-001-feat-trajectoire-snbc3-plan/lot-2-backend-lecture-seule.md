---
title: 'Lot 2 — Backend en lecture seule'
parent: ./README.md
kind: lot
lot: 2
updated: 2026-11-09
---

# Lot 2 SNBC 3 : backend en lecture seule, derrière le feature flag

> Décision d'architecture : [ADR 0023](../../adr/0023-integration-trajectoire-snbc3.md) (plus de calcul au runtime, code Sheets conservé jusqu'au retrait de la SNBC 2).
> [Plan général](./README.md) (décisions de conception 2 et 5, ordre de livraison).

## Contexte

Le lot 2 ajoute la lecture de `snbc3` derrière le feature flag, sans rien retirer (plan général, décision 5). Il peut être livré en plusieurs fois.

Prérequis (lot 1) : la source `snbc3`, les constantes SNBC 3, la clé du flag et le helper `isTrajectoireSnbc3Enabled`.

## Contrôle du flag

- Le contrôle passe par le helper `isTrajectoireSnbc3Enabled` du lot 1.
- Les nouvelles procédures renvoient `TRAJECTOIRE_SNBC3_NON_OUVERTE` (`FORBIDDEN`) si le flag est inactif.
- Les lecteurs partagés (leviers, PPT) choisissent leur source à chaque appel : `snbc3` si le flag est actif, `snbc` sinon.

## Nouvelles procédures

Dans `apps/backend/src/indicateurs/trajectoires/snbc3/`, un sous-router `trajectoires.snbc3`, placé à côté de `trajectoires.snbc`, qui reste inchangé.

**`trajectoires.snbc3.checkStatus`**

Le statut dépend d'abord de la présence de la collectivité dans le millésime, puis de sa nature. Les règles sont évaluées dans l'ordre :

| Ordre | Statut | Cas |
|---|---|---|
| 0 | `droits_insuffisants` | comme aujourd'hui |
| 1 | `disponible` | collectivité présente dans le millésime, quelle que soit sa nature : EPCI, EPT ou Paris |
| 2 | `absent_du_millesime` | collectivité absente, de nature `CC`, `CA`, `CU`, `METRO` ou `EPT` |
| 3 | `commune_non_supportee` | commune absente ; on renvoie `epciParent`, lu dans `collectivite_relations` avec le filtre `natureInsee ∈ CC/CA/CU/METRO` (même table que `getCollectiviteParentsQuery`, qui est privée) |
| 4 | `supra_non_supporte` | tout le reste : région, département, syndicats, PETR |

- Domaine : une nouvelle enum `StatutTrajectoireSnbc3` et `verification-trajectoire-snbc3.rules.ts`, à côté de l'existant. Au lot 6, elles remplaceront `verification-trajectoire-status.ts`, `canComputeTrajectoireSnbc`, `SYNDICAT_NATURES` et `isSyndicat`.
- Ces règles corrigent deux défauts des règles actuelles :
  - `EPT` figure dans `SYNDICAT_NATURES`. Une règle fondée sur la nature enverrait donc les 11 EPT en état vide.
  - Régions et départements tombent en `commune_non_supportee`, puisque tout ce qui n'est pas de type EPCI y va.
- Paris et les EPT n'ont pas besoin de cas particulier : la règle 1 les couvre.
- Les collectivités de test (type `TEST`) n'ont pas de SIREN dans le parquet. Elles passent en `absent_du_millesime`, ce qui permet de tester le cas des fusions récentes.
- **EPCI parent des communes (`commune_non_supportee`)** : `getCollectiviteParentsQuery` lit `collectivite_relations`, remplie depuis les périmètres Banatic au 01/01/2025 (`import-collectivite-relations.service.ts`). En prod, elle compte 5 587 relations (export du 08/11), mais 129 communes TeT n'ont pas d'EPCI parent : la carte ne pourra pas le proposer pour elles. Les 12 communes de Thionville-Fensch pointent vers les anciennes CA, qui ont bien une trajectoire. La mise à jour décrite dans le [complément COG 2026](./complement-mise-a-jour-collectivites-cog-2026.md) corrige les deux points.
- Les deux EPCI issus des fusions du 01/01/2026 (README, « Jointure ») sont les cas réels de `absent_du_millesime`. Thionville Fensch Agglomération (collectivité 6031) a toutefois un `nature_insee` vide dans TeT : elle tomberait en `supra_non_supporte`. **Corriger sa nature en `CA`** (donnée TeT, à faire en prod avant l'ouverture du flag). C'est le seul EPCI de TeT dans ce cas.
- La procédure renvoie `{ status, millesime, epciParent? }`. `millesime` vient de l'unique métadonnée `snbc3` : `{ dateVersion }`, la date du commit. Le commit lui-même n'est pas dans la métadonnée (lot 1) : il est dans le bucket (`last-import.json`).
- Les deux procédures sont des `authedProcedure` : sans utilisateur, le flag vaut `false` et l'accès serait refusé de toute façon.

**`trajectoires.snbc3.get`** : une lecture regroupée des valeurs `snbc3`, sur le modèle de la lecture actuelle de `getOrCompute`, mais sans `spreadsheetId`, `mode` ni `sourcesDonneesEntree`.

Le contrat existant ne change pas : les deux procédures s'ajoutent. `snbc.compute`, `snbc.getOrCompute` et l'ancien `checkStatus` disparaissent au lot 6.

## Leviers (mondrian)

Dossier : `apps/backend/src/indicateurs/trajectoire-leviers/`. Avec le flag, `getData` suit un chemin SNBC 3. Sans le flag, le chemin actuel est inchangé.

- **Point bloquant du chemin actuel.** `getData` lit le `objectifCommentaire` des valeurs SNBC 2 (« Source des données d'entrée: rare,aldo - … ») pour savoir dans quelles sources chercher les émissions observées de référence (`extractTrajectoireSource`). L'import SNBC 3 n'écrit pas ce commentaire. Lancé sur `snbc3`, le chemin actuel renverrait `TRAJECTOIRE_SOURCES_NOT_EXTRACTABLE` (erreur 500).
- **Dans le chemin SNBC 3, la base est la valeur `snbc3` de 2021.** Elle est placée dans `objectif2019`, avec `resultat2019 = null` : le package utilise alors `objectif2019`. Ce chemin n'utilise ni `extractTrajectoireSource` ni la requête des résultats, et `sourcesResultats` y est vide.
  - Pourquoi : le recalage fait déjà coïncider la SNBC 3 de 2021 avec l'OREC 2021. Garder le RARE de TeT en priorité ferait passer ses défauts dans les tuiles (plan général, « Écarts avec RARE expliqués »). Et des données saisies par la collectivité pour 2021 ne vont pas avec un objectif SNBC 3 pour 2030.
- **Année de référence 2021 dans le chemin SNBC 3** (`ANNEE_REFERENCE_SNBC_V3`). La SNBC 3 commence en 2020, donc avec 2019 la base serait vide partout. Le package externe `mondrian-treemap` (TerriSTORY) impose les noms `resultat2019` et `objectif2019`. On les garde, avec un commentaire dans `get-trajectoire-leviers-data.response.ts` qui précise qu'ils peuvent contenir des valeurs 2021.
- Le chemin SNBC 3 renvoie l'erreur `TRAJECTOIRE_NON_DISPONIBLE` là où le chemin actuel renvoie `TRAJECTOIRE_NOT_COMPUTED`.
- **Paris** (collectivité 5587, de type `commune`, décidé le 09/11) : le chemin SNBC 3 accepte toute collectivité présente dans le millésime, Paris compris. Paris a donc son mondrian, avec les pourcentages de l'Île-de-France, comme les EPT. Hors du millésime, une commune reçoit `COLLECTIVITE_NOT_EPCI`, et un EPCI `TRAJECTOIRE_NON_DISPONIBLE`.
- **DROM** : `REGIONS_FRANCAISES` ne contient que les 13 régions métropolitaines, donc `pourcentageRegional` n'a pas de valeur pour leurs EPCI. Le chemin SNBC 3 renvoie `REGION_NON_SUPPORTEE` (`BAD_REQUEST`, helper `isRegionSupportee` de la configuration) pour un EPCI qui a une trajectoire hors de l'Hexagone, et le front masque le mondrian.
- `identifiantManquants` est déjà renvoyé : il servira au message « secteurs non représentés » du lot 3.
- Au lot 6, le chemin SNBC 3 devient le seul : on supprime alors `extractTrajectoireSource`, `TRAJECTOIRE_SOURCES_NOT_EXTRACTABLE` et `TRAJECTOIRE_NOT_COMPUTED`.

## PPT

`plans/reports/generate-plan-report-pptx/ppt-builder.service.ts` lit `IndicateurSourceEnum.SNBC3` si le flag est actif pour l'utilisateur et la collectivité du plan, et `SNBC` sinon.

## Hors de ce lot

- Le score indicatif et `progression_snbc` restent sur `snbc` jusqu'à la généralisation (lot 6, raison dans l'ADR §4).
- Les exclusions génériques (moyenne, drapeau « open data ») sont faites au lot 1.

## Tests

- Domaine : `verification-trajectoire-snbc3.rules.spec.ts`. Cas à couvrir : disponible, absent, commune avec son EPCI parent, région, syndicat, PETR, Paris, EPT, collectivité de test.
- `trajectoires-snbc3.router.e2e-spec.ts` :
  - `checkStatus` et `get` avec le flag ;
  - `TRAJECTOIRE_SNBC3_NON_OUVERTE` sans le flag ;
  - valeurs SNBC 2 présentes mais ignorées.
- Leviers, avec le flag :
  - fixture `snbc3` sans commentaire, à côté de la fixture SNBC 2 de `trajectoire-leviers.test-fixture.ts` ;
  - cas à couvrir : base 2021, Paris, EPCI des DROM ;
  - sans le flag, les specs actuelles restent valables : `trajectoire-leviers.service.spec.ts`, `trajectoire-leviers.router.e2e-spec.ts` et `trajectoire-leviers.controller.e2e-spec.ts`. En test le flag est toujours actif : ces specs le coupent avec `mockTrajectoireSnbc3Flag(app, false)` (`snbc3/trajectoire-snbc3.test-fixture.ts`).
- PPT : la source dépend du flag.

## Vérification

- `nx test backend 'trajectoires'` et `nx test backend 'trajectoire-leviers'`.
- La recette dans l'app se fait avec les lots 3 et 4.
