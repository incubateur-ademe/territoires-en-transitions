---
title: 'Phase 1 — Socle mensuel'
parent: ./README.md
kind: phase
phase: 1
---

# Phase 1 — Socle générique mensuel

[← Index](README.md)

Généraliser le domaine `indicateurs` de l'année vers une période explicite, sans casser l'annuel
ni le PCAET. C'est la livraison de la dépendance « composant indicateur revu ».

**Prérequis** : décision périodicité (imposée par définition ou configurable).

## Task 1.1 — Contrat domaine + migration en deux temps

- ajouter `IndicateurPeriodicite` au domaine + utilitaires période ↔ date canonique ;
- transporter la périodicité dans `indicateurDefinitionSchemaTiny` et les contrats externes ;
- migration en 2 temps : ajouter/classifier la colonne, auditer, **puis** la rendre obligatoire ;
- interdire la bascule de maille après saisie ; ne pas déduire la périodicité des dates.

Fichiers : `packages/domain/src/indicateurs/definitions/indicateur-definition.schema.ts`,
`packages/domain/src/indicateurs/valeurs/`,
`apps/backend/src/indicateurs/definitions/indicateur-definition.table.ts`,
`.../mutate-definition/mutate-definition.input.ts`, nouveau changement `data_layer/sqitch/`.

## Task 1.2 — Écriture/lecture par période

- valider la date selon la périodicité ;
- refactorer le bulk REST en cœur transactionnel réutilisable + exposer une **commande tRPC
  atomique** mono-collectivité limitée aux champs de la grille ; une cellule en erreur rejette tout ;
- permissions « piloté par moi », une seule invalidation ;
- traiter explicitement les calculs de périodicités incompatibles.

Fichiers : `apps/backend/src/indicateurs/valeurs/` (`crud-valeurs.{controller,service,router}.ts`,
`upsert-*.request.ts`), hooks `apps/app/src/indicateurs/valeurs/`.

## Task 1.3 — Périodiser le cœur de grille

- types Zod + utilitaires `IndicateurPeriod` ; périodiser clés, regex, navigation, collage,
  éditabilité (`grid/types.ts`, `grid-model.ts`, `paste/use-grid-copy-paste.ts`) ;
- composer les variantes : `PcaetAnnualGrid`, `IndicateurDetailGrid`, `ElectrificationMonthlyGrid` ;
- une grille homogène en périodicité (catalogue mixte = grilles séparées).

Fichiers : `apps/app/src/indicateurs/valeurs/grid/`,
`apps/app/src/demarches/pcaet/diagnostic/indicateurs-grid/`.

## Task 1.4 — Parité puis migration du détail

- couvrir sources/segmentations, commentaires, suppression, confidentialité, dernière période ;
- brancher le nouveau détail **seulement** quand les tests de parité passent ;
- cibles 2030 distinctes ; ne pas inventer d'objectifs mensuels.

Fichiers : `apps/app/src/app/pages/collectivite/Indicateurs/table/`,
`apps/app/src/indicateurs/valeurs/grid/`.

## Task 1.5 — Graphiques et exports

- conserver toutes les dates ; format annuel/mensuel selon la définition ; aucun mois écrasé ;
- période absente = trou/`null`, jamais `0` ; régressions annuelles.

Fichiers : `ui/charts/echarts/utils.ts`, `Indicateurs/chart/`, `Indicateurs/data/prepare-data.ts`,
`apps/backend/src/indicateurs/charts/indicateur-chart.service.ts`,
`.../export-indicateurs/export-indicateurs.builder.ts`.

## Sortie de phase

Périodicité de premier ordre + saisie/lecture/grille/graphique/export préservant plusieurs mois
par an, annuel non régressé.

## Tests clés

2 puis 12 mois d'une même année indépendants ; update/delete cible la bonne période ; dates non
canoniques refusées ; `0` renseigné vs absence ; bulk atomique et cloisonné ; déc→jan ordonné ;
export conserve toutes les périodes ; PCAET non régressé.
