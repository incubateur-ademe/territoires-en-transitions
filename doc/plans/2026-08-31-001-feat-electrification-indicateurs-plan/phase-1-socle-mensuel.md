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

**Prérequis** : validation de l’ADR0018, première PR de la pile. Le catalogue recommande ou
impose une périodicité. Seules les recommandations sont personnalisables par collectivité.
Les décisions durables sont dans l’[ADR 0018](../../adr/0018-periodicite-des-indicateurs.md) ;
les opérations de livraison dans le [runbook](../../../data_layer/periodicite-runbook.md).

## Task 1.1 — Contrat domaine + migration en deux temps

- ajouter `IndicateurPeriodicite` au domaine + utilitaires période ↔ date canonique ;
- transporter la périodicité dans `indicateurDefinitionSchemaTiny` et les contrats externes ;
- migration en 2 temps : ajouter/classifier la colonne, auditer, **puis** la rendre obligatoire ;
- classer tous les indicateurs existants, prédéfinis et personnalisés, comme annuels recommandés ;
- stocker séparément la préférence locale et la périodicité de chaque valeur ;
- autoriser un changement de suivi recommandé après saisie sans convertir ni supprimer les séries ;
- interdire toute personnalisation d’une périodicité imposée dans l’API et la base.

Fichiers : `packages/domain/src/indicateurs/definitions/indicateur-definition.schema.ts`,
`packages/domain/src/indicateurs/valeurs/`,
`apps/backend/src/indicateurs/definitions/indicateur-definition.table.ts`,
`.../mutate-definition/mutate-definition.input.ts`, nouveau changement `data_layer/sqitch/`.

### Indicateurs personnalisés

- conserver une définition rattachée à sa collectivité par `indicateur_definition.collectivite_id` ;
  la préférence de suivi reste dans `indicateur_collectivite`, comme pour un indicateur prédéfini ;
- permettre la création annuelle ou mensuelle selon les périodicités disponibles pour la collectivité,
  en mode recommandé ; préserver le défaut annuel des anciens contrats de création ;
- contrôler les droits de la collectivité propriétaire à la création et à la modification ;
  ne pas exposer le changement de mode dans ces commandes ;
- modifier ensuite le suivi via la préférence locale, sans changer la périodicité de la définition
  ni convertir les valeurs ; `null` rétablit la périodicité de la définition ;
- réutiliser les règles communes de saisie, lecture, calcul, affichage et export.

## Task 1.2 — Écriture/lecture par période

- valider la date selon la périodicité ;
- refactorer le bulk REST en cœur transactionnel réutilisable + exposer une **commande tRPC
  atomique** mono-collectivité limitée aux résultats et objectifs ; une cellule en erreur rejette tout ;
- permissions « piloté par moi » ; le détail conserve ses mutations unitaires et leurs invalidations ;
- traiter explicitement les calculs de périodicités incompatibles.

Fichiers : `apps/backend/src/indicateurs/valeurs/` (`crud-valeurs.{controller,service,router}.ts`,
`upsert-*.request.ts`), hooks `apps/app/src/indicateurs/valeurs/`.

## Task 1.3 — Préserver le tableau annuel du diagnostic PCAET

- conserver le tableau introduit sur `main`, ses colonnes annuelles et ses mutations ;
- demander la série annuelle du diagnostic, indépendamment du suivi mensuel choisi localement ;
- préserver la source métadonnée propre à chaque démarche lors des lectures, écritures et calculs ;
- transporter la périodicité dans la publication GES et les définitions du score ; seul l’adaptateur des anciens snapshots du score complète explicitement `annuelle` ;
- utiliser le catalogue PCAET du package domaine ; ne pas réintroduire les anciennes tables SQL
  de topics et de lignes ni l'ancienne grille générique.

Fichiers : `apps/app/src/indicateurs/valeurs/grid/`,
`apps/app/src/demarches/pcaet/diagnostic/indicateurs-grid/`,
`packages/domain/src/demarches/pcaet/diagnostic/`.

## Task 1.4 — Parité puis migration du détail

- couvrir sources/segmentations, commentaires, suppression, confidentialité, dernière période ;
- brancher le nouveau détail **seulement** quand les tests de parité passent ;
- cibles 2030 distinctes ; ne pas inventer d'objectifs mensuels.

Fichiers : `apps/app/src/app/pages/collectivite/Indicateurs/table/`,
`apps/app/src/indicateurs/valeurs/grid/`.

## Task 1.5 — Graphiques et exports

- utiliser la périodicité de déclaration effective pour la saisie et les lectures de séries ;
- séparer le réglage graphique : conserver les points mensuels à leurs dates sur un axe temporel continu ; le choix mensuel ou annuel change uniquement les graduations et leurs libellés, sans agrégation ni interpolation ;
- conserver la période déclarée dans les infobulles, les formulaires et les exports de valeurs ;
- refuser un affichage mensuel pour une déclaration annuelle, y compris via l’API de rendu ;
- réinitialiser le choix d’affichage au changement d’indicateur, de collectivité ou de déclaration ;
- garder une seule périodicité de déclaration par grille et réutiliser périodes, ordre et libellés du domaine ;
- conserver séparément les séries annuelles et mensuelles, y compris janvier et l’année correspondante ;
- période absente = trou/`null`, jamais `0` ; régressions annuelles.

Fichiers : `ui/charts/echarts/utils.ts`, `Indicateurs/chart/`, `Indicateurs/data/prepare-data.ts`,
`apps/backend/src/indicateurs/charts/indicateur-chart.service.ts`,
`.../export-indicateurs/export-indicateurs.builder.ts`.

## Sortie de phase

Périodicité de premier ordre + saisie et lecture du détail, graphiques et exports préservant
plusieurs mois par an, tableau PCAET annuel non régressé. La commande API par lot est disponible
indépendamment ; aucune grille mensuelle générique n'est ajoutée dans cette phase.

## Contrat calendaire et projection SQL

Les règles calendaires utilisent des stratégies sans état et un registre exhaustif typé.
Annuel et mensuel partagent un algorithme fondé sur le mois, paramétré par un pas de 12 ou 1 mois
et un ancrage explicite. Ajouter une périodicité de cette famille ajoute une configuration.
L’ancrage est un premier de mois et le pas divise 12. Le codec doit être injectif : une identité
limitée à l’année convient seulement à une périodicité annuelle alignée sur janvier.

Les fonctions restent pures, la façade et les registres immuables, les exports publics explicites.
Le calendrier sépare codec et arithmétique ; il ne dépend ni de React, ni d’ECharts, ni de SQL,
ni d’une règle d’agrégation. Un registre de présentation distinct partage libellés et contraintes
d’axe entre frontend et serveur ; l’adaptateur frontend ajoute les contrôles de saisie.
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
une période explicite ; les contrats REST historiques sans périodicité restent des adaptateurs annuels,
même après personnalisation locale.

Toute écriture de valeurs prend un verrou partagé du graphe ; les mutations de périodicité ou de
formule prennent un verrou exclusif, avant les verrous de lignes. Définitions et dépendances sont
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
refus du mensuel, RPC de service verrouillant graphe, définition puis période, date au 1er janvier.
Elle exige ensuite `indicateurs.valeurs.recompute` pour la collectivité et doit disparaître avec
le format historique, sans servir de modèle aux nouveaux imports.

## Exceptions architecturales à retirer

Les exceptions suivantes restent temporaires, limitées aux lectures existantes et aux adaptations
annuelle/mensuelle couvertes par l’ADR 0018. Elles ne constituent pas l’architecture cible :

| Exception                                                                   | Responsable de la migration | Cible                                                               |
| --------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------- |
| `ListIndicateursService`                                                    | Mainteneurs backend         | Requêtes dans un repository                                         |
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

Un indicateur annuel recommandé peut être suivi mensuellement par une seule collectivité. Le
catalogue et les autres collectivités restent inchangés ; revenir au suivi annuel restitue son
historique. Les imports et calculs conservent la périodicité de leurs valeurs.

- **Calendrier** : allers-retours codec et stockage, addition inversible et ordonnée, absence de
  chevauchement, changements d’année, dates canoniques, registres exhaustifs. Comparaison entre
  périodicités refusée sauf tri total explicitement demandé.
- **Métier et compatibilité** : existant annuel recommandé, indépendance des collectivités et des
  historiques, année distincte de janvier, personnalisation imposée refusée par API et SQL,
  imports et parcours annuels préservés.
- **Indicateurs personnalisés** : création annuelle par défaut et mensuelle explicite, mensuel
  indisponible refusé, modification hors collectivité propriétaire refusée, préférence locale
  modifiable après saisie puis remise à `null` sans perte des séries. Déclaration mensuelle et
  affichage annuel conservent chaque point ; déclaration annuelle et affichage mensuel refusés.
- **Présentation** : matrice déclaration/affichage, points et infobulles mensuels conservés,
  absence d’agrégation, mêmes règles pour cartes et exports graphiques, aucun effet sur saisie
  et exports bruts.
- **Transactions et calculs** : lot invalide sans écriture, zéro/null/absence distincts,
  catalogue/objectifs/intentions atomiques, réconciliation des suppressions et versions,
  crash, reprise, générations et traitements concurrents.
- **Migration** : expand, contract, revert, redéploiement et restauration, y compris conflits,
  écritures concurrentes, frontières partielles et gardes de rollback/bootstrap.
- **Architecture** : frontières de persistance, dispatch des périodicités limité aux registres et
  adaptateurs, aucune inférence de format, période `number | string` ou fallback annuel implicite.
