---
title: 'feat: Suivi mensuel des indicateurs Électrification'
type: feat
status: draft
date: 2026-08-31
updated: 2026-09-24
kind: index
notion: https://app.notion.com/p/accelerateur-transition-ecologique-ademe/BUILD-lectrification-indicateurs-3c76523d57d78013aa2ae3785cf09f1f
---

# Suivi mensuel des indicateurs Électrification

Batch ShapeUp. Un fichier par phase.

## En bref

Permettre aux territoires lauréats du programme Électrification de suivre **mensuellement** les
indicateurs liés à leurs engagements, puis à l'ADEME d'en suivre complétude et progression aux
niveaux territorial → national.

Trois lots dépendants :

| Lot                                                     | État       | Débloqué par                                   |
| ------------------------------------------------------- | ---------- | ---------------------------------------------- |
| [Phase 1 — Socle périodique](phase-1-socle-mensuel.md)  | ADR validé | Fusion de la PR préparatoire #4961             |
| [Phase 2 — Électrification](phase-2-electrification.md) | Bloqué     | Catalogue Écolab + mandat TeT sur candidatures |
| [Phase 3 — Reporting ADEME](phase-3-reporting.md)       | Bloqué     | Règles complétude/progression + permissions    |

**Reco** : généraliser d'abord le domaine `indicateurs` de l'année vers une période explicite
(`annuelle` | `semestrielle` | `trimestrielle` | `mensuelle`), puis importer un mapping
engagement–indicateur, puis ajouter config
lauréats et reporting **seulement selon le mandat réel de TeT**.

Le socle ajoute la périodicité aux définitions et aux valeurs dans la table `indicateur_valeur`,
avec une identité et des contraintes de date explicites. Il adapte aussi les couches qui
réduisent une date à une année (grille, graphique, export).

## Décisions de cadrage

Phase 1 (validée dans l’ADR 0018) :

1. La définition porte une périodicité de déclaration annuelle, semestrielle, trimestrielle ou
   mensuelle, fixe dès la création, même sans valeur enregistrée. Elle s'applique aux déclarations
   locales de toutes les collectivités. Les indicateurs existants sont classés annuels.
2. Les indicateurs personnalisés suivent les mêmes règles : la collectivité propriétaire choisit
   l'une des quatre périodicités à la création, avec un défaut annuel. La définition est l'unique
   source de cette périodicité, sans mode ni préférence locale.
3. La visualisation reste indépendante : une périodicité plus large agrège les valeurs selon une
   règle explicite pour les résultats et les objectifs. Une règle inconnue ou une période incomplète
   ne produit pas d'agrégat ; aucune observation plus fine n'est inventée. Les sources externes et
   les historiques conservent leur périodicité et leurs valeurs d'origine. Les séries restent
   distinctes, y compris lorsqu'elles partagent une date de début.

Phase 2 (à trancher avant de démarrer) :

4. Catalogue Écolab canonique et versionné (contenu, unités, périodicité, agrégation) ?
5. TeT stocke-t-il engagements/cibles des candidatures, ou l'ADEME reste source de vérité ?
6. Périmètre premier lot : catalogue complet ou top 3/5 engagements ?
7. Intégration plan : plan existant / nouveau manuel / provisionné / aucun ?
8. Identité et droits d'un `Regroupement d'EPCI` ?

Phase 3 :

9. Formules de complétude et de progression, par indicateur ?
10. Reporting : POC Streamlit, vue TeT, ou les deux ?
11. Rôles ADEME et confidentialité ?

## Risques et no-gos

Risques : catalogue Écolab instable ; doublons avec indicateurs TeT existants ; collision
`2026-01-01` entre année, semestre, trimestre et mois d'une même définition ; confusion cible 2030 / mesure
mensuelle ; agrégation incorrecte de %/stocks/flux ; perte de mois dans un consommateur annuel
oublié ; sync de plan écrasant du contenu local ; reporting exposant des données confidentielles.

No-gos premier incrément :

- ne pas coder `100`/`108`/4 axes/top 3-5 comme règle métier (viennent de données versionnées) ;
- ne pas importer le DOCX comme catalogue d'indicateurs ;
- ne pas dupliquer une définition sans comparer sens, unité, périodicité, formule, agrégation ;
- ne pas modifier la périodicité d’une définition après sa création, même sans valeur ;
- ne pas déduire la périodicité des dates saisies ;
- ne pas détourner `groupement` ni `indicateur_action` pour les engagements ;
- ne pas appliquer une somme aux stocks, pourcentages ou objectifs sans règle métier explicite ;
- ne pas réutiliser le contrôleur d'import anonyme pour des candidatures confidentielles ;
- ne pas inventer de valeurs plus fines ni mélanger observations enregistrées et agrégats affichés.

## Contexte utile

- L'ADEME pilote la mesure N°1 (sur 22) du plan national d'électrification.
- Objectif : permettre aux lauréats de suivre leurs engagements et à l'ADEME d'en suivre la
  complétude/progression.
- Mise à jour pitch : l'ADEME suit les 12 engagements ; régions/départements sont retirés du
  suivi ; TeT doit rattacher par défaut les indicateurs pré-définis aux 12 engagements.
- Source Grist actuelle : ~20 indicateurs, pas d'open data, un seul engagement couvert, forte
  dépendance à l'Écolab.

## Ce qui est fixe vs à arbitrer

Fixe : 12 engagements ; sous-ensemble par lauréat ; cibles 2030 ; plusieurs indicateurs par
engagement ; suivi mensuel ; indicateurs définis par l'Écolab ; besoin de reporting ADEME.

A arbitrer : catalogue complet ou top 3/5 ; plan Électrification ou
non ; visibilité de tous les indicateurs ou seulement ceux des engagements retenus ; reporting TeT
ou Streamlit.

## Points de vigilance métier

- 100 territoires en public vs 108 lauréats dans le pitch : ne rien coder en dur.
- 3 priorités publiques vs 4 axes internes : mapping non fourni.
- Mensuel, annuel possible et revue trimestrielle sont 3 notions différentes.
- `Regroupement d'EPCI` existe dans le formulaire, mais la feature groupement est barrée.

## Les 12 engagements

Le formulaire donne des engagements et cibles 2030, pas le catalogue mensuel.

|  N° | Engagement                             | Cible                         |
| --: | -------------------------------------- | ----------------------------- |
|   1 | Sortie du fioul domestique             | % bâtiments au fioul          |
|   2 | Sortie du gaz des bâtiments            | % bâtiments au gaz            |
|   3 | Décommissionnement réseau gaz          | Aucune cible                  |
|   4 | Sortie du gaz logements sociaux        | % du parc                     |
|   5 | Sortie du gaz bâtiments publics        | % du parc                     |
|   6 | Électrification véhicules particuliers | % du parc immatriculé         |
|   7 | Bornes de recharge publiques           | Nombre total + bornes rapides |
|   8 | Autobus électriques                    | % du parc                     |
|   9 | Électrification des artisans           | Nombre d'artisans accompagnés |
|  10 | Électrification de l'industrie         | Consommation MWh 2030         |
|  11 | Électrification de l'agriculture       | Consommation MWh 2030         |
|  12 | Recharge des poids lourds              | Site « clés en main »         |

Vigilances import : une seule case Oui/Non ; engagement 7 a 2 cibles ; engagements 3 et 12 n'ont
pas de cible structurée ; ne pas créer de fiches actions automatiquement depuis le descriptif libre.

## État du code et périmètre du socle

| Besoin                 | Existant avant le socle                   | Écart couvert par le socle                                       |
| ---------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| Plusieurs valeurs / an | Date réelle + contraintes sur date        | Identité incluant périodicité, date et source                    |
| Maille de déclaration  | Aucun champ de périodicité                | Quatre périodicités, fixes dès la création                       |
| Saisie                 | Détail indicateur et tableau PCAET annuel | Périodiser le détail ; préserver le tableau PCAET                |
| Graphique / export     | Réduction par année                       | Agrégation de consultation ; export des originaux                |
| Liens fiche / axe      | Tables existantes                         | Réutilisables                                                    |
| Plan                   | Types et création existent                | Pas de template idempotent                                       |
| Import définitions     | Import versionné Google Sheets            | Ajouter périodicité et règles d’agrégation ; mappings en phase 2 |
| Reporting ADEME        | API/UI mono-collectivité                  | Lecture agrégée + permission dédiée                              |

Hypothèses annuelles à supprimer dans les consommateurs génériques :
`Indicateurs/data/prepare-data.ts`, `ui/charts/echarts/utils.ts`,
`export-indicateurs/export-indicateurs.builder.ts`. Le tableau PCAET reste annuel et vérifie
explicitement la périodicité des observations annuelles, indépendamment de celle de la définition. Les anciens adaptateurs de grille supprimés sur `main` ne sont
pas réintroduits. Le catalogue PCAET est désormais porté par le package domaine, sans tables
SQL de topics ou de lignes.

## Modèle temporel

```ts
type IndicateurPeriodicite = 'annuelle' | 'semestrielle' | 'trimestrielle' | 'mensuelle';
// annuelle : 1er janvier ; semestrielle : 1er janvier ou juillet
// trimestrielle : 1er janvier, avril, juillet ou octobre ; mensuelle : premier du mois
```

Le domaine manipule `IndicateurPeriod`, qui associe périodicité et date de début validée.
Une interface à colonnes temporelles utilise une seule périodicité de déclaration ; une éventuelle
grille mensuelle dédiée à l’Électrification relève de la phase 2.

L’unicité des valeurs inclut collectivité, indicateur, périodicité, date de début et source :
janvier, le premier trimestre, le premier semestre et l’année 2026 restent distincts.
La périodicité de la définition est immuable dès sa création, dans l’API, les imports et la base.
Les déclarations locales la respectent ; les sources externes et les historiques conservent leur
périodicité d’origine. Le choix de visualisation reste local à la vue et ne modifie aucune valeur.
Voir l’[ADR 0018](../../adr/0018-periodicite-des-indicateurs.md), le
[plan de phase 1](phase-1-socle-mensuel.md) et le [runbook](../../../data_layer/periodicite-runbook.md).

## Modèle métier Électrification

Deux niveaux :

1. référentiel engagement–indicateur, nécessaire ;
2. personnalisation par lauréat, seulement si TeT porte la source de vérité.

Référentiel versionné par campagne :

- `electrification_catalogue_version` ;
- `electrification_axe` ;
- `electrification_engagement` ;
- `electrification_engagement_indicateur` avec obligatoire/optionnel, sémantique et stratégie
  d'agrégation.

Si TeT porte la personnalisation : `electrification_campagne`, `electrification_laureat`,
`electrification_laureat_engagement`, `electrification_laureat_engagement_cible`,
`electrification_cible_definition`.

`Regroupement d'EPCI` reste un point de conception : pas de SIREN unique, donc décider s'il s'agit
d'une collectivité TeT, d'une liste de collectivités, ou d'un participant externe dédié.

## Navigation

- [Phase 1 — Socle périodique](phase-1-socle-mensuel.md)
- [Phase 2 — Catalogue et config Électrification](phase-2-electrification.md)
- [Phase 3 — Reporting ADEME](phase-3-reporting.md)
