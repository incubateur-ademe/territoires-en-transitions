# Réparation des données avant la migration des périodicités

Le contrôle de la sauvegarde de production du 28 septembre 2026 a trouvé une
référence de formule inexistante et neuf dates hors du calendrier pris en charge.
Ces données doivent être traitées avant la migration de schéma de la PR #5214.

## Référence de formule

Le changement Sqitch `indicateur/correct-formule-cae-2-a` remplace le seul jeton
`cae_2.lpcaet` par `cae_2.l_pcaet` dans la formule prédéfinie `cae_2.a`. La définition
cible existe en production et l’échantillon du catalogue utilise déjà ce nom.
Les autres termes de la formule sont conservés.

Le changement verrouille la définition et refuse une réparation si la référence
erronée apparaît plusieurs fois ou si la définition cible prédéfinie manque.
Il ne fait rien avant le peuplement du catalogue ou si la formule est déjà corrigée.
La vérification porte sur cette référence uniquement. Le revert conserve la
correction de données : il ne réintroduit pas une référence inexistante.

Avant le déploiement, vérifier également la cellule `valeurCalcule` de `cae_2.a`
dans le catalogue configuré par `INDICATEUR_DEFINITIONS_SHEET_ID`, onglet
`Indicateur definitions`, pour éviter qu’un import ultérieur réintroduise la faute.

Cette réparation directe ne recalcule pas les observations enregistrées. L’import
applicatif du catalogue, lui, lance un recalcul lorsque la formule change ; il ne
sert donc pas à exécuter cette réparation. Le recalcul historique reste à planifier
après la protection des observations manuelles avec métadonnées identifiée par
l’audit de la PR #5214. Importer ensuite une formule déjà corrigée ne suffit pas
à déclencher ce recalcul.

## Dates en attente de décision

Les neuf observations invalides sont conservées. Deux dates portent l’année
`1 av. J.-C.`, une l’année `20225`, et six des années ressemblant à `YYYYMM`.
Leur date cible doit être validée explicitement. Ne pas déduire une périodicité
depuis ces nombres, fusionner les observations ou les supprimer.

La réparation des dates devra utiliser une correspondance explicite entre
l’identité actuelle de chaque observation et la date approuvée, refuser toute
collision et préserver résultats, objectifs, commentaires et sources. Plusieurs
dates corrigées dans la même année peuvent encore entrer en collision lors de la
normalisation annuelle prévue par #5214 ; contrôler les deux étapes.

Tant que ces dates ne sont pas traitées, cette correction de formule ne rend pas
le déploiement de #5214 possible. Rejouer le contrôle des dates et des dépendances
sur une copie récente après toutes les corrections, puis répéter le cycle de
migration du schéma.

## Validation de cette réparation

Le corps SQL a été répété dans une transaction annulée sur la copie locale de la
sauvegarde du 28 septembre 2026 : la référence erronée disparaît, le graphe passe
de une à zéro dépendance introuvable, et l’empreinte de tous les champs des
60 636 observations de `cae_2.a` reste identique. Le rollback restitue la formule
initiale de la copie. Ce contrôle ne vaut pas répétition de la migration de
périodicité de #5214.

Les tests de cycle utilisent les fichiers Sqitch réels sur des fixtures
synthétiques dans une base locale vide dédiée. Ils nécessitent Node.js, `psql`,
`pg_prove` et l’extension PostgreSQL `pgtap`. Leur commande est :

```sh
INDICATEUR_DATA_REPAIR_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/tet_indicateur_data_repair_test_local \
  bash data_layer/tests/indicateur/correct-formule-cae-2-a.spec.sh
```

Créer cette base jetable avant le test et la supprimer après. Le runner refuse
une URL hors boucle locale, un autre préfixe de base ou un schéma indicateur déjà
présent. Il ne faut pas l’exécuter dans la base restaurée. Les assertions pgTAP
portent notamment sur la préservation des observations, le rejeu, le revert et
le refus d’une dépendance de remplacement absente.
