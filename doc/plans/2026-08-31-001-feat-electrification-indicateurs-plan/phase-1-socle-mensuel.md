---
title: 'Phase 1 — Socle périodique'
parent: ./README.md
kind: phase
phase: 1
---

# Phase 1 — Socle générique périodique

[← Index](README.md)

Généraliser le domaine `indicateurs` de l'année vers une période explicite annuelle, semestrielle,
trimestrielle ou mensuelle, en préservant l'annuel et le PCAET. C'est la livraison de la dépendance
« composant indicateur revu ».

**Cadrage validé** : la périodicité de déclaration est fixée dès la création de la définition,
même sans valeur enregistrée. Elle est commune aux collectivités, sans mode ni préférence locale.
Les décisions durables sont dans l’[ADR 0018](../../adr/0018-periodicite-des-indicateurs.md) ;
les opérations de livraison dans le [runbook](../../../data_layer/periodicite-runbook.md).

**Livraison** : chaque PR est déployable après ses prérequis fusionnés, sans dépendre d'une PR
ultérieure. #4961 prépare le modèle et le contrôle en lecture seule, sans changement de schéma
ou de comportement. #4981 réunit la fonctionnalité complète et se déploie pendant sa propre
maintenance. Les anciens découpages techniques sont remplacés par ces deux unités de livraison.

## Task 1.1 — Contrat domaine + migration en deux temps

- ajouter les quatre valeurs de `IndicateurPeriodicite` au domaine et les utilitaires de période
  et date canonique ;
- transporter la périodicité dans `indicateurDefinitionSchemaTiny` et les contrats externes ;
- migration en 2 temps : ajouter/classifier les colonnes, auditer, **puis** les rendre obligatoires ;
- classer tous les indicateurs existants, prédéfinis et personnalisés, comme annuels ;
- stocker la périodicité de chaque valeur et l'inclure dans l'identité avec collectivité, indicateur,
  date de début et source ;
- rendre la périodicité de la définition immuable dès sa création dans l'API, les imports et la base ;
- configurer séparément les règles d'agrégation des résultats et des objectifs : `somme`, `moyenne`
  ou `derniere_valeur` ; une règle absente reste `null`, sans somme implicite.

Fichiers : `packages/domain/src/indicateurs/definitions/indicateur-definition.schema.ts`,
`packages/domain/src/indicateurs/valeurs/`,
`apps/backend/src/indicateurs/definitions/indicateur-definition.table.ts`,
`.../mutate-definition/mutate-definition.input.ts`, nouveau changement `data_layer/sqitch/`.

### Indicateurs personnalisés

- conserver une définition rattachée à sa collectivité par `indicateur_definition.collectivite_id` ;
- permettre le choix des quatre périodicités à la création, y compris depuis une action,
  avec un défaut annuel pour les anciens contrats de création ;
- contrôler les droits de la collectivité propriétaire à la création et à la modification ;
- interdire ensuite toute modification de périodicité, même sans valeur ;
- configurer explicitement les règles d'agrégation des résultats et des objectifs ;
- réutiliser les règles communes de saisie, lecture, calcul, affichage et export.

## Task 1.2 — Écriture/lecture par période

- valider une périodicité connue et sa date de début canonique ;
- imposer la périodicité de la définition aux déclarations locales, y compris celles du PCAET ;
  conserver la périodicité d’origine des sources externes importées ;
- lire toutes les séries originales lorsque la requête ne filtre pas explicitement une périodicité ;
- refactorer le bulk REST en cœur transactionnel réutilisable + exposer une **commande tRPC
  atomique** mono-collectivité limitée aux résultats et objectifs ; une cellule en erreur rejette tout ;
- permissions « piloté par moi » ; le détail conserve ses mutations unitaires et leurs invalidations ;
- produire les résultats calculés à la seule périodicité de la définition cible, avec des
  définitions de même périodicité entre formule et dépendances, comme entre parent et enfants
  d’un groupe ; ne pas réutiliser les agrégats de visualisation comme observations.

Fichiers : `apps/backend/src/indicateurs/valeurs/` (`crud-valeurs.{controller,service,router}.ts`,
`upsert-*.request.ts`), hooks `apps/app/src/indicateurs/valeurs/`.

## Task 1.3 — Préserver le tableau annuel du diagnostic PCAET

- conserver le tableau introduit sur `main`, ses colonnes annuelles et ses mutations ;
- demander explicitement les observations annuelles du diagnostic, indépendamment de la
  périodicité de la définition ; traiter leur absence sans annualiser les observations infra-annuelles ;
- réserver la déclaration annuelle locale aux définitions annuelles ; accepter les observations
  annuelles d’une source externe même lorsque la définition a une autre périodicité ;
- préserver la source métadonnée propre à chaque démarche lors des lectures, écritures et calculs ;
- sélectionner également les observations annuelles dans la publication GES et le score indicatif ;
  transporter la périodicité de chaque observation ; seul l’adaptateur des anciens snapshots du
  score complète explicitement `annuelle` ;
- utiliser le catalogue PCAET du package domaine ; ne pas réintroduire les anciennes tables SQL
  de topics et de lignes ni l'ancienne grille générique.

Fichiers : `apps/app/src/indicateurs/valeurs/grid/`,
`apps/app/src/demarches/pcaet/diagnostic/indicateurs-grid/`,
`packages/domain/src/demarches/pcaet/diagnostic/`.

## Task 1.4 — Parité puis migration du détail

- couvrir sources/segmentations, commentaires, suppression, confidentialité, dernière période ;
- brancher le nouveau détail **seulement** quand les tests de parité passent ;
- cibles 2030 distinctes ; ne pas inventer d'objectifs mensuels ;
- conserver l'édition des valeurs sources dans la grille de déclaration ; les agrégats de
  consultation ne sont pas directement éditables.

Fichiers : `apps/app/src/app/pages/collectivite/Indicateurs/table/`,
`apps/app/src/indicateurs/valeurs/grid/`.

## Task 1.5 — Graphiques et exports

- utiliser la périodicité fixe de la définition pour la saisie, tout en conservant les séries
  externes à leur périodicité d'origine dans les lectures ;
- séparer le réglage de visualisation : à périodicité identique, afficher les valeurs sources ;
  à une périodicité plus large, appliquer une règle métier explicite à chaque résultat et objectif ;
- prendre en charge mensuel → trimestriel, semestriel ou annuel ; trimestriel → semestriel ou
  annuel ; semestriel → annuel ; aucune visualisation à une périodicité plus fine ;
- pour un indicateur additionnable, douze mois de `10` donnent quatre trimestres de `30`, deux
  semestres de `60` ou une année de `120` ; revenir au mensuel restitue les douze valeurs de `10` ;
- sans règle connue ou sans toutes les observations requises, ne pas produire d'agrégat pour
  le champ concerné ; une observation absente ou `null` n'est jamais remplacée par `0` ;
- appliquer les mêmes calculs au tableau de consultation, aux graphiques, aux cartes et au rendu
  serveur ; les téléchargements de graphiques reprennent la restitution affichée ;
- conserver les dates, périodicités et contenus enregistrés dans les exports de valeurs ;
  les valeurs sources, objectifs, commentaires et références restent inchangés ;
- présenter les commentaires regroupés avec les libellés des périodes d'origine, tout en
  conservant séparément les sources, versions de métadonnées et périodicités différentes ;
- garder le choix de visualisation local à la vue, avec la déclaration comme défaut, et le
  réinitialiser au changement d'indicateur ou de collectivité ; les choix disponibles dépendent
  de la périodicité des valeurs sources ;
- garder une seule périodicité de déclaration par grille et réutiliser périodes, ordre et libellés
  du domaine ; distinguer janvier, le premier trimestre, le premier semestre et l'année correspondante.

Fichiers : `ui/charts/echarts/utils.ts`, `Indicateurs/chart/`, `Indicateurs/data/prepare-data.ts`,
`apps/backend/src/indicateurs/charts/indicateur-chart.service.ts`,
`.../export-indicateurs/export-indicateurs.builder.ts`.

## Sortie de phase

Quatre périodicités de déclaration fixes dès la création, saisie et lecture du détail, agrégation
de consultation partagée et exports conservant les observations originales. Le tableau PCAET
reste annuel. La commande API par lot est disponible indépendamment ; aucune grille mensuelle
générique n'est ajoutée dans cette phase.

## Contrat calendaire et projection SQL

Les règles calendaires utilisent des stratégies sans état et un registre exhaustif typé.
Annuel, semestriel, trimestriel et mensuel partagent un algorithme fondé sur le mois, paramétré
par un pas de 12, 6, 3 ou 1 mois et un ancrage explicite en janvier. Ajouter une périodicité de cette famille ajoute une configuration.
L’ancrage est un premier de mois et le pas divise 12. Le codec doit être injectif : une identité
limitée à l’année convient seulement à une périodicité annuelle alignée sur janvier.

Les fonctions restent pures, la façade et les registres immuables, les exports publics explicites.
Le calendrier sépare codec et arithmétique ; il ne dépend ni de React, ni d’ECharts, ni de SQL,
ni d’une règle d’agrégation. Un registre de présentation distinct partage libellés et contraintes
d’axe entre frontend et serveur ; un calcul d’agrégation partagé reste distinct de ces libellés
et du calendrier. L’adaptateur frontend ajoute les contrôles de saisie.
Une périodicité sans stratégie de domaine ou de présentation fait échouer la compilation, sans
fallback annuel ou mensuel. Aucun hook ou classe n’est nécessaire pour un simple calcul pur.

Une même fonction SQL de canonisation sert à l’audit, au trigger transitoire et au trigger strict.
Le catalogue des périodicités reste public en lecture et modifiable seulement par migration.

Le parseur applicatif valide la syntaxe. SQL extrait exhaustivement les références dans une
projection privée, reconstruite avec la formule dans la même transaction et non modifiable par
l’application. Une contrainte différable garantit l’existence et la périodicité de chaque référence :
contrôle en fin d’instruction par défaut, report possible au commit pour remplacer un graphe.
La base ne duplique pas l’évaluateur complet.

## Contrats d’écriture et de réconciliation

Un lot cible une collectivité et des cellules `resultat` ou `objectif`, avec indicateur et période.
Droits et périodes sont validés pour tout le lot avant écriture ; ses valeurs et leurs recalculs
synchrones sont validés ou annulés dans la même transaction. Le détail conserve ses mutations unitaires.
Les nouveaux contrats portent
une période explicite ; les contrats REST historiques sans périodicité restent des adaptateurs annuels.
Ils sont soumis aux mêmes contraintes de déclaration locale et ne modifient pas la définition.

Toute écriture de valeurs prend un verrou partagé du graphe ; la création des définitions et les
mutations de formule ou de relations prennent un verrou exclusif, avant les verrous de lignes.
La périodicité d’une définition existante reste immuable. Définitions et dépendances sont
relues sous verrou, par identifiant croissant. Calcul et écriture récursive utilisent ce même état.
Les imports suivent cet ordre et revalident leur état initial sous verrou ; une modification
concurrente du catalogue provoque un conflit. Le travail de réconciliation découle des états
avant/après verrouillés.

L’import lit et valide définitions et objectifs avant toute mutation. Version, définitions,
objectifs de référence et intentions de réconciliation sont enregistrés atomiquement.
Une version identique ou inférieure est refusée ; changer le contenu exige une nouvelle version.

Le recalcul global du catalogue s’exécute après commit pour ne pas bloquer toutes les collectivités ;
son échec n’annule pas le catalogue importé.
La transaction crée des intentions durables par cible et collectivité, avec formule attendue et
génération. Sont concernées les collectivités ayant des sources de la nouvelle formule **ou**
des résultats automatiques existants, y compris lors du retrait d’une formule.

Le traitement est borné et idempotent. Après le verrou partagé du graphe, la sélection
`SELECT … FOR UPDATE SKIP LOCKED` réserve une intention jusqu’à la fin de la transaction qui
la réconcilie et la supprime. La formule attendue est vérifiée sous ce verrou ; une intention
obsolète est supprimée sans calcul. Chaque génération crée des intentions distinctes :
l’acquittement ne supprime que la ligne verrouillée, jamais celle d’une génération suivante.
Un crash annule la transaction et libère le verrou ; l’intention reste disponible pour reprise,
sans bail à expirer. Le drain initial de l’import,
un cron et une reprise réservée au rôle de service traitent les intentions persistées sans réimporter
le tableur. Les reprises ont un délai persisté ; erreurs et travail restant sont observables.

Cette solution accepte une **cohérence éventuelle** entre catalogue et résultats automatiques.
La réponse distingue le catalogue validé et la réconciliation terminée, en attente ou en échec,
avec le travail restant lorsqu’il est connu. Le succès complet exige qu’aucune intention ne reste
à traiter et qu’aucun échec ne soit signalé.
Une activation strictement atomique à l’échelle du catalogue exigerait des résultats versionnés,
hors périmètre de cet import administratif.

La réconciliation examine les périodes de la formule et des anciens résultats automatiques.
Elle supprime les résultats obsolètes, conserve le manuel et ne lit que les périodes découvertes
puis verrouillées ; une période créée concurremment relève de sa propre écriture.
La version de source retenue est la plus grande `dateVersion`, puis le plus grand `metadonneeId`
en cas d’égalité, comme en lecture. Les anciennes versions automatiques sont supprimées.
Source obligatoire absente : aucune ligne automatique. Source présente à `null` : résultat `null`.
Une suppression déclenche récursivement la réconciliation des dépendants dans la même transaction,
sans créer de pseudo-valeur `null`. Un zéro saisi reste distinct d’une absence.

Les triggers d’écriture SQL directe protègent le graphe, sans garantir les verrous de période ni
le recalcul applicatif. SQL direct n’est donc pas une API d’écriture courante.
L’exception historique EMT reste annuelle : validation de toutes les définitions avant écriture,
refus des définitions non annuelles, RPC de service verrouillant graphe, définition puis période,
date au 1er janvier.
Elle exige ensuite `indicateurs.valeurs.recompute` pour la collectivité et doit disparaître avec
le format historique, sans servir de modèle aux nouveaux imports.

## Exceptions architecturales à retirer

Les exceptions suivantes restent temporaires, limitées aux lectures existantes et aux adaptations
des quatre périodicités couvertes par l’ADR 0018. Elles ne constituent pas l’architecture cible :

| Exception                                                                   | Responsable de la migration | Cible                                                               |
| --------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------- |
| `ValeursMoyenneService`                                                     | Mainteneurs backend         | Requêtes dans un repository                                         |
| `ValeursReferenceService`                                                   | Mainteneurs backend         | Droits dans le service, requêtes dans un repository                 |
| `fetchCollectivite` du site public (`apps/site/app/collectivites/utils.ts`) | Mainteneurs du site         | API publique conservant le périmètre publié de `site_labellisation` |

Échéance pour chaque exception : migration préalable à toute extension de son accès aux données,
hors de ces adaptations. La migration conserve les contrôles d’accès et retire
l’exception backend du test d’architecture dans la même PR.
Les tests Nx frontend et backend contrôlent le périmètre modifié et la liste backend exacte,
sans nouvelle exception. L’accès historique du site n’est pas couvert par le test frontend.

## Scénarios de validation

2 puis 12 mois d'une même année indépendants ; update/delete cible la bonne période ; dates non
canoniques refusées ; `0` renseigné vs absence ; bulk atomique et cloisonné ; déc→jan ordonné ;
export conserve toutes les périodes ; PCAET non régressé.

Une définition conserve sa périodicité dès la création, même sans valeur. Une déclaration locale
la respecte, tandis qu'une source externe annuelle peut coexister avec les observations locales
mensuelles d'une définition mensuelle. Le changement de visualisation retrouve toujours les
observations originales. Les calculs enregistrés produisent seulement la périodicité cible.

- **Calendrier** : allers-retours codec et stockage des quatre périodicités, addition inversible et
  ordonnée, absence de chevauchement, passages décembre→janvier, T4→T1 et S2→S1, dates canoniques,
  registres exhaustifs. Comparaison entre périodicités refusée sauf tri total explicitement demandé.
- **Métier et compatibilité** : existant annuel, immuabilité dès création par API, imports et SQL,
  déclaration locale conforme à la définition, sources externes conservées à leur périodicité,
  année distincte de janvier, du premier trimestre et du premier semestre. PCAET, score et GES
  sélectionnent les observations annuelles sans convertir les observations infra-annuelles.
- **Indicateurs personnalisés** : création annuelle par défaut et choix explicite de chacune des
  quatre périodicités, y compris depuis une action ; modification hors collectivité propriétaire
  refusée ; périodicité immuable même sans valeur ; choix de visualisation sans effet sur la définition.
- **Présentation** : matrice source/visualisation, règles indépendantes pour résultats et objectifs,
  douze mois de `10` donnant `4 × 30`, `2 × 60` ou `120` pour la somme ; règles inconnues et groupes
  incomplets sans agrégat ; absence distincte de zéro ; aucune désagrégation ou fusion implicite de
  séries. Commentaires et références d'origine préservés, agrégats non éditables, mêmes règles pour
  tableau, graphiques, cartes et rendus serveur ; exports bruts conservant les observations.
- **Transactions et calculs** : lot invalide sans écriture, zéro/null/absence distincts,
  catalogue/objectifs/intentions atomiques, réconciliation des suppressions et versions,
  crash, reprise, générations et traitements concurrents.
- **Migration** : déploiement complet sous maintenance, vérification, retour arrière et restauration,
  y compris conflits de dates, écritures concurrentes et préservation des données.
- **Architecture** : frontières de persistance, dispatch des périodicités limité aux registres et
  adaptateurs, aucune inférence de format, période `number | string` ou fallback annuel implicite.
