---
title: 'Phase 1 — Périodicités des indicateurs'
parent: ./README.md
kind: phase
phase: 1
updated: 2026-09-24
---

# Phase 1 — Périodicités des indicateurs

[← Index](README.md)

Le socle annuel/mensuel est implémenté. Cette phase l'étend au trimestriel et au semestriel,
ajoute la visualisation agrégée et rend la périodicité de déclaration fixe dès la création.
Ces évolutions restent à implémenter sur le modèle de valeurs existant.

## Contrat de déclaration et de visualisation

Le [cadrage](README.md), complété par la décision produit du 24 septembre, distingue :

- **Périodicité de déclaration** : définie pour chaque indicateur parmi annuelle, semestrielle,
  trimestrielle et mensuelle, elle est immuable dès sa création. À la création d'un indicateur
  personnalisé, la collectivité la choisit ; le défaut reste annuel. Il n'existe plus de mode
  ni de préférence locale permettant de la modifier.
- **Périodicité de visualisation (affichage)** : réglage indépendant, qui calcule une projection
  ou une agrégation à la lecture. Il ne change ni la déclaration ni les valeurs enregistrées.
  Revenir au détail retrouve les observations intactes.

Les parcours de conversion ou suppression lors d'un changement de déclaration sont abandonnés.
Le choix de visualisation est le seul réglage de périodicité après la création.
Chaque valeur conserve son identité : indicateur, collectivité, périodicité, date et source.

| Périodicité des valeurs sources | Visualisations prises en charge                  |
| ------------------------------- | ------------------------------------------------ |
| Mensuelle                       | Mensuelle, trimestrielle, semestrielle, annuelle |
| Trimestrielle                   | Trimestrielle, semestrielle, annuelle            |
| Semestrielle                    | Semestrielle, annuelle                           |
| Annuelle                        | Annuelle                                         |

Les regroupements suivent la règle métier de l'indicateur. L'addition mensuel → annuel prévue
par le cadrage est calculée à la lecture, sans enregistrer de valeurs annuelles. Une visualisation
plus fine ne répartit jamais une valeur source en observations inventées.

Les données historiques et sources externes conservent leur périodicité d'origine. Leur lecture
ne permet pas de modifier la périodicité de déclaration de l'indicateur.
L'[ADR 0018](../../adr/0018-periodicite-des-indicateurs.md) précise ce contrat.

## Précisions nécessaires à l'activation

- Définir les règles d'agrégation pour stocks, pourcentages, objectifs et données incomplètes ;
  une somme de parts mensuelles ne définit pas une part annuelle.
- Préciser la restitution des commentaires, références et différentes sources dans la visualisation,
  sans altérer les observations ni mélanger implicitement les séries.
- Définir le traitement de migration des préférences locales divergentes et des séries historiques
  du socle existant. Ne pas choisir implicitement une nouvelle périodicité de déclaration.

L'extension des contrats et des règles de date peut avancer. Retirer les anciennes préférences
seulement après inventaire et validation du traitement métier, avec accès aux historiques préservé.
Activer les agrégations après validation des règles de calcul concernées.

## Task 1.1 — Extension du domaine et migration du socle

- ajouter trimestrielle et semestrielle au catalogue existant et aux validations domaine/API/SQL ;
- étendre les fonctions partagées de validation, comparaison, date suivante et les libellés ;
- conserver la périodicité dans les définitions et les valeurs, ainsi que l'identité et l'unicité
  par indicateur, collectivité, périodicité, date et source ;
- rendre la périodicité de définition immuable dès la création, même sans valeur enregistrée ;
- retirer `periodicite_mode` et la préférence de déclaration `indicateur_collectivite.periodicite`
  des contrats et interfaces, puis du schéma selon le plan de migration ; conserver les autres
  personnalisations de l'indicateur ;
- inventorier les préférences différentes de la définition et les séries existantes par
  collectivité, périodicité et source ; appliquer le traitement métier défini sans conversion,
  suppression ou masquage implicite de l'historique ;
- préserver les anciens contrats annuels et mensuels pendant la transition des consommateurs ;
  prévoir deploy/revert/verify et vérifier l'absence de perte de valeurs, sources et métadonnées.

Dates canoniques : année au 1er janvier ; semestre au 1er janvier/juillet ; trimestre au
1er janvier/avril/juillet/octobre ; mois au premier du mois. Ne jamais déduire la périodicité de la date.

Emplacements : `packages/domain/src/indicateurs/`, tables et services
`apps/backend/src/indicateurs/`, migrations `data_layer/sqitch/`.

## Task 1.2 — Lectures, écritures et calculs

- sélectionner explicitement les observations par périodicité, date et source, notamment pour update/delete ;
- faire respecter la périodicité de déclaration de la définition dans les commandes des collectivités ;
  aucune préférence ou modification de définition ne permet de la changer ;
- conserver la périodicité d'origine des sources externes et historiques ; distinguer leur traitement
  des déclarations de la collectivité, sans créer de dérogation utilisateur ;
- distinguer les lectures d'observations de la projection demandée pour la visualisation ;
- calculer les agrégats à la lecture selon les règles métier, sans écriture d'observation,
  suppression ou modification de la définition ;
- réutiliser les contrôles de droits et l'écriture tRPC par lot atomique : une erreur annule le lot ;
- adapter les calculs enregistrés à la périodicité de la définition, en retirant les branches liées
  à l'ancien mode ; préserver l'homogénéité entre formules, dépendances et groupes ;
- garder la sélection annuelle explicite pour PCAET, score indicatif et publication GES ;
  traiter l'absence d'une série annuelle sans la recréer implicitement depuis la visualisation.

Emplacements : `apps/backend/src/indicateurs/valeurs/`, hooks
`apps/app/src/indicateurs/valeurs/`.

## Task 1.3 — Création et choix de visualisation

- proposer les quatre périodicités à la création personnalisée, y compris depuis une action,
  annuel par défaut ; expliquer que ce choix fixe la périodicité de déclaration ;
- après création, afficher la périodicité de déclaration sans sélecteur de modification ;
- proposer séparément la périodicité de visualisation compatible avec les valeurs sources ;
- retirer les modes et tags de recommandation, préférences locales de déclaration et parcours
  de conversion ou suppression associés à l'ancien changement de périodicité ;
- préciser les sources affichables, leur masquage éventuel et leur réapparition lors d'un choix
  de visualisation, sans modifier leurs données ;
- conserver les fonctions ordinaires de déclaration, modification ou suppression d'une valeur,
  selon les droits existants et la périodicité fixe de l'indicateur.

## Task 1.4 — Interfaces de déclaration et détail existantes

Étendre les interfaces existantes ; cette phase n'impose ni grille générique ni remplacement du détail.

- adapter le modèle, la navigation, le collage, l'édition et l'ajout de dates aux quatre périodicités ;
- garder la grille de déclaration aux dates et à la périodicité des observations déclarables,
  avec la variante annuelle PCAET ;
- distinguer cette grille du tableau de consultation, qui peut présenter une agrégation dynamique ;
  un agrégat affiché ne devient pas une observation éditable ;
- préserver résultats, objectifs, commentaires, sources, segmentations, confidentialité,
  date de référence et date de la dernière valeur renseignée ;
- utiliser les objectifs propres aux indicateurs, sans projection depuis les candidatures ;
- vérifier la parité des fonctions existantes après adaptation du détail.

Emplacements : `apps/app/src/indicateurs/valeurs/grid/`, détail
`apps/app/src/app/pages/collectivite/Indicateurs/` et grille du diagnostic PCAET.

## Task 1.5 — Graphiques, imports et exports

- aligner tableau de consultation, graphique, cartes et rendus serveur sur les mêmes règles d'agrégation ;
- faire reprendre aux téléchargements de graphiques la visualisation choisie ;
- exporter les observations enregistrées avec périodicité, date et source, sans écraser plusieurs
  valeurs d'une année ni remplacer les observations par les agrégats d'affichage ;
- conserver la périodicité et la source à l'import ; un import ne modifie pas la périodicité
  d'une définition existante ;
- préserver les formats annuels et représenter explicitement les données absentes ; absence n'est pas zéro.

Points sensibles : `Indicateurs/data/prepare-data.ts`, `ui/charts/echarts/utils.ts`,
`indicateur-chart.service.ts`, `export-indicateurs/export-indicateurs.builder.ts`.

## Sortie de phase et tests

- Création et déclaration dans les quatre périodicités ; ancien défaut annuel préservé.
- Toute modification de la périodicité de déclaration après création est refusée, même avant
  la première valeur ; aucune préférence locale ne contourne cette règle.
- Migration avec préférences divergentes et plusieurs séries historiques : valeurs, sources,
  métadonnées et accès préservés selon le traitement métier, sans conversion ni suppression implicite.
- Dates canoniques et unicités vérifiées ; janvier/année/trimestre/semestre ne se confondent pas.
- Décembre → janvier, T4 → T1 et S2 → S1 franchissent correctement la limite d'année.
- Pour un indicateur additionnable, douze valeurs mensuelles de `10` produisent à la lecture
  quatre trimestres de `30`, deux semestres de `60` ou une année de `120`.
- Tous les regroupements autorisés sont vérifiés ; revenir au détail retrouve les valeurs,
  objectifs, commentaires, références et sources d'origine sans aucune écriture de valeur ou de définition.
- Aucune observation plus fine n'est inventée depuis une valeur trimestrielle, semestrielle ou annuelle.
- Sources externes et historiques conservent leur périodicité sans autoriser de nouvelles déclarations
  contraires à celle de la définition ; aucun mélange implicite de séries annuelles et d'agrégats mensuels.
- Droits, atomicité des déclarations par lot et isolation entre collectivités préservés.
- Formules et groupes restent cohérents avec la périodicité de définition après suppression de l'ancien mode.
- Stocks, pourcentages, objectifs, zéro, absence et données incomplètes traités selon les règles validées.
- Tableau, graphique et graphiques téléchargés concordants ; export fidèle aux observations enregistrées.
- PCAET, score indicatif et publication GES gèrent explicitement l'absence éventuelle de valeurs annuelles.
