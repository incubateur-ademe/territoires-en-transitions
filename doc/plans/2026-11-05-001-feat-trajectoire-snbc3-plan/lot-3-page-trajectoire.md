---
title: 'Lot 3 — Page Trajectoire'
parent: ./README.md
kind: lot
lot: 3
updated: 2026-11-06
---

# Lot 3 SNBC 3 : page Trajectoire, derrière le feature flag

> [Plan général](./README.md) (objectifs, décision de conception 5, textes produit du lot 0).
> Backend : [plan du lot 2](./lot-2-backend-lecture-seule.md) (statuts, leviers). Téléchargements : [plan du lot 5](./lot-5-export-xlsx.md).

## Contexte

Avec le flag, la page n'affiche que la SNBC 3 : plus de calcul ni de saisie, mais un bandeau de transition et des états vides. Sans le flag, la page actuelle ne change pas (plan général, décision 5). Le lot suppose les procédures `trajectoires.snbc3` du lot 2.

Dossier : `apps/app/src/app/pages/collectivite/Trajectoire/`.

## Aiguillage

- `Trajectoire.tsx` lit `useIsFeatureFlagEnabled('is-trajectoire-snbc3-enabled')` et affiche soit la nouvelle page, soit la page actuelle.
- La nouvelle page vit dans `trajectoire-snbc3/`, en nouveaux fichiers. On ne modifie pas les composants actuels : au lot 6, il suffira de supprimer l'ancienne branche et ses fichiers.
- Composants partagés par les deux pages (graphes, onglet méthodologie, mondrian) : un paramètre ou une liste dédiée sépare les deux, quand le comportement diffère.

## États vides

- Un `match` sur les statuts de `trajectoires.snbc3.checkStatus` (lot 2) affiche des cartes d'état vide, construites à partir de `methodology-not-applicable.card.tsx`. La carte actuelle reste pour l'ancienne page.
- Pour une commune, la carte propose « Voir la trajectoire de mon EPCI », qui mène à `makeCollectiviteTrajectoirelUrl` avec `epciParent`.
- Boutons de la carte, comme dans la maquette :
  - le premier télécharge l'outil Excel SNBC 3 (hook du lot 5) ;
  - le second renvoie vers la méthodologie SNBC 3 ;
  - ces deux boutons apparaissent sur les cartes `absent_du_millesime`, `commune_non_supportee` et `supra_non_supporte`.

## Trajectoire disponible

- La nouvelle page reprend la page actuelle (`TrajectoireCalculee.tsx`), sans « Recalculer », sans `DonneesPartiellementDisponibles` et sans la modale `DonneesCollectivite`.
- Ajouter `snbc3-transition.banner.tsx`. On peut le fermer, avec une clé localStorage, sur le modèle de `utils/banner/use-dismiss-banner-info.ts`.
- Ajouter `snbc3-changements.modal.tsx`, qui s'ouvre depuis le bandeau et depuis un lien sous le titre.
- Un secteur sans valeur affiche « Données non disponibles », sans bouton.
- **`use-indicateur-trajectoire-snbc3.ts`**, à côté de `use-indicateur-trajectoire.ts` :
  - lecture de `trajectoires.snbc3.get` ;
  - bornes SNBC 3 (de 2020 à 2050), au lieu de `DATE_FIN_SNBC_V2` ;
  - même comparaison avec les objectifs et résultats de la collectivité.
- **Sous-secteur « Construction »** : `cae_1.ih` et `cae_2.kh` s'ajoutent aux listes de `ges-emissions-properties.ts` et `consommations-finales-properties.ts`, mais pour la SNBC 3 seulement. La SNBC 2 n'a pas de valeur pour ces indicateurs.
- **Aérien et maritime aux DROM** : le COPIL du 08/10/2026 a demandé un message d'explication dans les restitutions TeT. Ce poste (`cae_1.f`) est concentré sur les EPCI qui portent ports et aéroports, et peut atteindre un tiers de leurs émissions (rapport `snbc3`, §4.7). Le texte fait partie des textes produit du lot 0.

## Mondrian (`indicateurs/trajectoire-leviers/sgpe-mondrian.tsx`)

Le backend choisit déjà la source selon le flag (lot 2). Côté front :
- Le package ignore sans prévenir les secteurs incomplets et les leviers dont l'effet va dans le mauvais sens. Sous le mondrian, afficher « Secteurs non représentés faute de données : … », construit à partir de `identifiantManquants`. C'est utile aux deux versions.
- Ordres de grandeur avec la SNBC 3 :
  - Branche énergie (`cae_1.j`) : vide pour 521 EPCI, dont toute l'Occitanie. C'est à peu près comme avec la SNBC 2 (613 EPCI couverts sur 1 141).
  - Déchets (`cae_1.h`) : vide pour 284 EPCI, contre 172 avec la SNBC 2. Plus d'EPCI perdent donc les 3 leviers déchets.
- Le levier industrie lit le total `cae_1.i` (`trajectoire-leviers.config.ts:521`), qui inclut désormais la construction. À signaler avec la question SGPE du lot 0.
- Vérifier sur des données réelles les leviers « Pratiques stockantes », « Gestion des haies » et « Sobriété foncière ». `cae_63.ca` et `cae_63.db` deviennent négatifs (émissions nettes), donc ces leviers risquent d'être ignorés.
- Masquer le mondrian pour les DROM (erreur `REGION_NON_SUPPORTEE` du lot 2). Paris garde le sien (décidé le 09/11). Ne pas afficher la carte d'erreur générique.

## Méthodologie

- Dans `trajectoire-constants.ts`, ajouter les variantes SNBC 3 de `METHODO_PAR_SECTEUR` et de `DOC_METHODO` (le nouveau PDF). Elles remplaceront les actuelles au lot 6.
- Documenter que `cons_csc` (procédé de captage) est compté dans « Autres industries » (`cae_2.kg`).
- Dans la nouvelle page, l'onglet porte le nom SNBC 3, et `trajectoire-reference.alert.tsx` n'est pas affiché.

## Libellés et suivi

- Libellés (`labels/catalog.ts`, `trajectoires-snbc.labels.ts`) : ajouter ceux de la nouvelle page.
- PostHog (`posthog-events.ts`) : ajouter des événements pour le bandeau et la modale.
- La suppression de l'ancienne page, de `DonneesCollectivite/`, de `triggerSnbcCalculation` et des fichiers du domaine `data-sufficiency.ts` et `get-indicateur-trajectoire-for-value-input.ts` se fait au lot 6.

## Vérification

En local (flag actif), avec un EPCI, une commune, une région, un EPCI absent du millésime et Paris :
- pas de calcul, et ni bouton « Recalculer » ni « Compléter les données » ;
- le bandeau ne s'affiche qu'une fois ;
- la commune renvoie vers son EPCI ;
- la page n'affiche que la SNBC 3, avec le sous-secteur « Construction » ;
- le mondrian s'affiche sans erreur pour un EPCI quelconque, un EPCI de Grand Est et un EPCI d'Occitanie, avec la liste des secteurs non représentés. Il s'affiche aussi pour Paris, et il est masqué pour un EPCI des DROM.

Sans le flag (décision 5) : la page actuelle est inchangée, calcul compris.

E2E : ajouter `e2e/tests/collectivite/trajectoire/`, avec un EPCI disponible et une commune. La CI teste la nouvelle page.
