---
title: 'Phase 1 — Périodicités des indicateurs'
parent: ./README.md
kind: phase
phase: 1
updated: 2026-10-08
---

# Phase 1 — Périodicités des indicateurs

[← Index](README.md)

Le socle annuel/mensuel est implémenté. Cette phase l'étend au trimestriel et au semestriel,
rend la périodicité fixe dès la création et l'applique à la déclaration comme à la visualisation,
sans agrégation entre périodes, conformément à la décision du 24 septembre 2026.
Ces évolutions restent à implémenter sur le modèle de valeurs existant.

## Contrat de déclaration et de visualisation

Le [cadrage](README.md), corrigé selon la décision produit du 24 septembre 2026, fixe les règles suivantes :

- La périodicité est imposée pour chaque indicateur parmi annuelle, semestrielle, trimestrielle
  et mensuelle. Il n'existe plus de mode forcé ou recommandé ni de préférence locale de périodicité.
- La déclaration et la visualisation utilisent la même périodicité, sans sélecteur indépendant
  d'affichage ni agrégation entre périodes.
- À la création d'un indicateur personnalisé, la collectivité choisit la périodicité ;
  le défaut reste annuel. Pour un prédéfini, elle est fixée à la création dans le catalogue.
- La périodicité n'est plus modifiable après création, même sans valeur enregistrée.

Les parcours de conversion ou suppression lors d'un changement de déclaration sont abandonnés.
Il ne reste aucun réglage de périodicité après la création.
Chaque valeur conserve son identité : indicateur, collectivité, périodicité, date et source.

Douze déclarations mensuelles de `10` restent douze valeurs mensuelles de `10` à l'affichage,
y compris lorsque la plage consultée couvre une année. Aucune somme, moyenne ou dernière valeur
n'est calculée pour les convertir à une autre périodicité. Aucune observation plus fine n'est inventée.

Les données historiques et sources externes conservent leur périodicité d'origine. Leur lecture
ne permet pas de modifier la périodicité de déclaration de l'indicateur.
L'[ADR 0018](../../adr/0018-periodicite-des-indicateurs.md) précise ce contrat.

## Précisions nécessaires à l'activation

- Définir le traitement de migration des préférences locales divergentes et des séries historiques
  du socle existant. Ne pas choisir implicitement une nouvelle périodicité de déclaration.
- Préciser l'accès aux historiques et aux sources externes dont la périodicité diffère de celle
  de la définition, sans conversion, perte d'accès implicite ni réglage de visualisation indépendant.

L'extension des contrats et des règles de date peut avancer. Retirer les anciennes préférences
seulement après inventaire et validation du traitement métier, avec accès aux historiques préservé.
Les règles d'agrégation de restitution sont hors périmètre et ne conditionnent pas l'activation.

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
- faire utiliser aux lectures de visualisation la même périodicité que la déclaration ;
  retirer les paramètres de périodicité d'affichage indépendante et les agrégations de restitution ;
- réutiliser les contrôles de droits et l'écriture tRPC par lot atomique : une erreur annule le lot ;
- adapter les calculs enregistrés à la périodicité de la définition, en retirant les branches liées
  à l'ancien mode ; préserver l'homogénéité entre formules, dépendances et groupes ;
- garder la sélection annuelle explicite pour PCAET, score indicatif et publication GES ;
  traiter l'absence d'une série annuelle sans la recréer implicitement depuis la visualisation.

Emplacements : `apps/backend/src/indicateurs/valeurs/`, hooks
`apps/app/src/indicateurs/valeurs/`.

## Task 1.3 — Choix à la création et périodicité fixe

- proposer les quatre périodicités à la création personnalisée, y compris depuis une action,
  annuel par défaut ; expliquer que ce choix fixe la périodicité de déclaration et de visualisation ;
- après création, afficher cette périodicité sans sélecteur de modification, y compris dans le détail,
  les graphiques et les vues enregistrées ;
- retirer les modes et tags de recommandation, préférences locales de déclaration et parcours
  de conversion ou suppression associés à l'ancien changement de périodicité ;
- appliquer le traitement défini pour l'accès aux sources externes et historiques, sans modifier
  leurs données ni introduire de choix de périodicité de visualisation ;
- conserver les fonctions ordinaires de déclaration, modification ou suppression d'une valeur,
  selon les droits existants et la périodicité fixe de l'indicateur.

## Task 1.4 — Interfaces de déclaration et détail existantes

La PR frontend [#5394](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5394) suit #5215 et précède #5312. Elle adapte la fiche indicateur
aux prototypes [annuel](https://tet-protos.vercel.app/#/indicateurs/realisation-programme-tete)
et [mensuel](https://tet-protos.vercel.app/#/indicateurs/part-electrique-flotte-collectivite) :

- placer le badge de périodicité et son infobulle sur la ligne de métadonnées, avec
  la date de modification, les pilotes et les services ; rappeler son caractère immuable
  et le rôle du suivi annuel pour les indicateurs participant au score TETE ;
- réunir résultat et objectif dans chaque cellule, supprimer leur bascule et le bouton
  d'ajout placé au-dessus du tableau ;
- ouvrir une liste résultat/objectif dans une cellule vide ; permettre la saisie et
  l'édition directe de chacun des deux champs, identifiés par R et O ;
- ajouter les périodes depuis la dernière cellule d'en-tête : saisie directe de l'année,
  ou modale permettant de choisir plusieurs mois, trimestres ou semestres avec leur année ;
- refuser les périodes invalides et les doublons ; conserver les colonnes vides comme
  brouillons de saisie jusqu'à l'enregistrement d'une valeur ou d'un commentaire ;
- enregistrer avec Entrée ou à la sortie du champ, annuler avec Échap et conserver
  le brouillon si l'enregistrement échoue ;
- afficher la grille même avant la première valeur et préserver les droits, la lecture
  des sources externes, les commentaires, la suppression confirmée et la confidentialité.

Le sélecteur de fréquence présent dans le prototype mensuel n'est pas repris :
la décision du 24 septembre impose la périodicité choisie à la création.
La grille annuelle du diagnostic PCAET conserve son parcours existant.

Autres adaptations de cette phase :

- adapter le modèle, la navigation, le collage, l'édition et l'ajout de dates aux quatre périodicités ;
- garder la grille de déclaration aux dates et à la périodicité des observations déclarables,
  avec la variante annuelle PCAET ;
- aligner le tableau de consultation sur la périodicité de la grille de déclaration,
  en présentant les observations sans agrégation ;
- préserver résultats, objectifs, commentaires, sources, segmentations, confidentialité,
  date de référence et date de la dernière valeur renseignée ;
- utiliser les objectifs propres aux indicateurs, sans projection depuis les candidatures ;
- vérifier la parité des fonctions existantes après adaptation du détail.

Emplacements : `apps/app/src/indicateurs/valeurs/grid/`, détail
`apps/app/src/app/pages/collectivite/Indicateurs/` et grille du diagnostic PCAET.

## Task 1.5 — Graphiques, imports et exports

- aligner tableau de consultation, graphique, cartes et rendus serveur sur la périodicité de la définition,
  commune à la déclaration et à la visualisation, sans agrégation ;
- faire reprendre aux téléchargements de graphiques les valeurs affichées à cette périodicité ;
- exporter les observations enregistrées avec périodicité, date et source, sans écraser plusieurs
  valeurs d'une année ni les convertir à une autre périodicité ;
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
- Pour chacune des quatre périodicités, la déclaration et la visualisation utilisent celle de la définition ;
  aucun mode forcé/recommandé, préférence locale ou sélecteur d'affichage indépendant ne subsiste.
- Douze valeurs mensuelles de `10` restent douze points mensuels de `10` dans le tableau,
  le graphique et son téléchargement ; consulter une année ne produit aucun agrégat trimestriel,
  semestriel ou annuel et ne modifie aucune valeur ni définition.
- Résultats, objectifs, commentaires, références et sources restent attachés aux observations d'origine.
- Aucune observation plus fine n'est inventée depuis une valeur trimestrielle, semestrielle ou annuelle.
- Sources externes et historiques conservent leur périodicité sans autoriser de nouvelles déclarations
  contraires à celle de la définition ; aucun mélange ni conversion implicite des séries.
- Droits, atomicité des déclarations par lot et isolation entre collectivités préservés.
- Formules et groupes restent cohérents avec la périodicité de définition après suppression de l'ancien mode.
- Zéro, absence et données incomplètes restent distincts, sans valeur de remplacement ni agrégation.
- Tableau, graphique et graphiques téléchargés concordants ; export fidèle aux observations enregistrées.
- PCAET, score indicatif et publication GES gèrent explicitement l'absence éventuelle de valeurs annuelles.
