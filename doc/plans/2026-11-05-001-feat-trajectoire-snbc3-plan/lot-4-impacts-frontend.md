---
title: 'Lot 4 — Impacts ailleurs dans le frontend'
parent: ./README.md
kind: lot
lot: 4
updated: 2026-11-06
---

# Lot 4 SNBC 3 : impacts ailleurs dans le frontend, derrière le feature flag

> [Plan général](./README.md) (sort de la SNBC 2, décisions de conception 2 et 5, libellés décidés au lot 0).

## Contexte

Avec le flag, le reste du frontend ne déclenche plus de calcul, et les fiches indicateurs affichent les deux trajectoires. Sans le flag, rien ne change (plan général, décision 5).

## Calcul et priorisation

- `Indicateurs/detail/IndicateurDetail.tsx` : pas de déclenchement du calcul quand le flag est actif.
- Priorisation des leviers :
  - avec le flag, `to-priorisation-access.ts` et `priorisation-blocked.card.tsx` utilisent les statuts de `trajectoires.snbc3.checkStatus`, et le CTA « Calculer ma trajectoire » disparaît ;
  - sans le flag, rien ne change ;
  - mettre à jour `e2e/tests/collectivite/priorisation-leviers/priorisation-actions.spec.ts` et sa POM pour la version avec flag, celle que voit la CI.

## Cohabitation des deux trajectoires sur les fiches indicateurs

Le backend ne renvoie `snbc3` qu'aux utilisateurs qui ont le flag (lot 1, étape 4). Le front n'a donc pas besoin de tester le flag : il s'appuie sur les sources que le backend lui sert.

Dossier : `Indicateurs/data/`. `snbc3` reçoit partout le traitement de `snbc`, avec son propre libellé et sa propre couleur :
- `get-source-label.tsx` : « SNBC3 » pour `snbc3`. Pour `snbc`, « SNBC2 » quand `snbc3` fait partie des sources servies, et le libellé actuel sinon. Un utilisateur sans flag ne voit donc aucun changement ;
- `layer-parameters.ts` : une seconde couche « trajectoire », de couleur distincte (par exemple la SNBC 2 en pointillés ou plus claire) ;
- `use-indicateur-sources.ts` : `snbc3` est sortie des sources « open data », comme `snbc`, et reçoit sa couleur ;
- `use-source-filter.ts` : `snbc3` apparaît dans les options du filtre, et dans le cas « seule source trajectoire sélectionnée » ;
- `use-indicateur-chart.ts` : la condition `avecSecteursSNBC` s'applique aux deux sources.

Ajouter une story ou un test de `prepare-data` avec les deux séries.

Les branches `snbc` seront retirées au lot 7.

## Vérification

En local (flag actif) :
- la fiche `cae_1.a` d'un EPCI montre les deux séries, SNBC 2 et SNBC 3, avec des libellés et des couleurs distincts, et le filtre de sources propose les deux ;
- la moyenne des collectivités n'inclut pas la SNBC 3 ;
- la priorisation des leviers fonctionne sans CTA de calcul.

Sans le flag (décision 5) : la fiche est inchangée (SNBC 2 seule, avec son libellé actuel), et la priorisation garde le CTA de calcul.

E2E : `priorisation-actions.spec.ts` passe.
