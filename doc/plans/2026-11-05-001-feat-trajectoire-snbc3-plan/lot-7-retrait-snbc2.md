---
title: 'Lot 7 — Retrait de la SNBC 2'
parent: ./README.md
kind: lot
lot: 7
updated: 2026-11-06
---

# Lot 7 SNBC 3 : retrait de la SNBC 2

> Décision d'architecture : [ADR 0023](../../adr/0023-integration-trajectoire-snbc3.md) (la dépendance à l'API Google Sheets disparaît avec le retrait de la SNBC 2).
> [Plan général](./README.md) (durée de la transition, à fixer au lot 0).

## Contexte

Le lot 7 met fin à la transition, à la date fixée au lot 0. Il supprime le code SNBC 2 débranché au lot 6, les branches `snbc` ajoutées au lot 4, puis les données de la source `snbc`.

## Backend et domaine

- Supprimer le code SNBC 2 conservé :
  - `trajectoires-spreadsheet.service.ts` et `TrajectoiresXlsxService` ;
  - le fichier de logique d'entrées SNBC 2 et son enum de statuts (lot 6) ;
  - l'usage de `SheetService` par les trajectoires ;
  - les variables `TRAJECTOIRE_SNBC_*` (`utils/config/configuration.model.ts`), à retirer aussi de la configuration des environnements.
- Retirer `IndicateurSourceEnum.SNBC`, ramener `SOURCES_TRAJECTOIRE` à `[SNBC3]`, et supprimer les constantes `*_SNBC_V2`.

## Frontend

- Retirer de `Indicateurs/data/` les branches `snbc` ajoutées ou conservées au lot 4.

## Données

Un script, dans cet ordre :
1. supprimer les valeurs de la source `snbc` (2,17 M lignes), par lots ;
2. supprimer ses métadonnées (dont la 17) ;
3. supprimer sa ligne `indicateur_source`.

Le script ne touche pas aux autres sources : les totaux calculés `snbc` partent avec leurs valeurs, sans recalcul.

## Vérification

- `nx test backend 'trajectoires'` et les tests de `Indicateurs/data/`.
- En local, après le script : plus aucune ligne pour la source `snbc`. Le nombre de valeurs `snbc3` est inchangé. La fiche `cae_1.a` ne montre plus que « SNBC3 ».
