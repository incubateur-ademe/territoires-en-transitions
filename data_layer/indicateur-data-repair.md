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

## Dates et suppressions validées

Le changement `indicateur/correct-dates-historiques` applique les décisions
explicites du 28 septembre 2026 sur les neuf observations inventoriées :

| Observation | Collectivité / indicateur | Décision |
| --- | --- | --- |
| 24464 | Bouguenais (1466), `cae_62` (135) | `0001-01-01 BC` → `2024-01-01` |
| 27353 | CA du Saint-Quentinois (3830), `cae_1.h` (333) | Supprimer cette saisie locale ; conserver les données Atmo |
| 287811340 | Collectivité Démo (5596), nombre de réunions (45906) | Supprimer cette observation |
| 11979621 | Margny-lès-Compiègne (2181), test (31816) | Archiver puis supprimer le résultat 5 / objectif 3 |
| 11979622 | Margny-lès-Compiègne (2181), test (31816) | Archiver puis supprimer le résultat 7 / objectif 5 |
| 11979623 | Margny-lès-Compiègne (2181), test (31816) | Archiver puis supprimer le résultat 2 / objectif 7 |
| 11979624 | Margny-lès-Compiègne (2181), test (31816) | Conserver le résultat 8 / objectif 9 ; `202504-01-01` → `2025-01-01` |
| 12374016 | Margny-lès-Compiègne (2181), Nombre de projets analysés (32392) | Archiver puis supprimer l’objectif 2 |
| 12374017 | Margny-lès-Compiègne (2181), Nombre de projets analysés (32392) | Conserver l’objectif 3, sans résultat ; `202512-01-01` → `2025-01-01` |

Pour Margny, la décision métier retient explicitement la dernière observation de
chaque indicateur au 1er janvier 2025. Les valeurs ne sont ni additionnées ni
agrégées. Les quatre autres observations quittent les données actives après
archivage.

Les six observations originales de Margny ont été exportées depuis la copie de
la sauvegarde avant toute correction, avec tous leurs champs, les dates erronées
intactes et les libellés de collectivité et d’indicateur. Les fichiers privés
`margny-historique-observations-2026-09-28.csv` et
`margny-historique-observations-2026-09-28.json`, accompagnés de leur provenance
et de leurs empreintes SHA-256, sont remis séparément pour conservation. Ils ne
sont pas versionnés dans ce dépôt. La migration conserve aussi les six originaux
dans son archive administrative.

La migration vérifie l’identité complète, la date initiale, le caractère manuel
sans métadonnée et la date de dernière modification observée dans la sauvegarde.
Un changement intervenu depuis cet inventaire, une collision à la date cible ou
une référence de score sur une observation à supprimer annule toute la migration.
Les verrous empêchent une écriture concurrente de contourner ces contrôles.

Une observation absente n’est pas créée. Une date déjà corrigée reste inchangée.
Les trois corrections préservent résultats, objectifs, commentaires et provenance ;
les triggers ordinaires mettent à jour les métadonnées de modification.
Aucun indicateur ni aucune série externe n’est supprimé ou recalculé.

`private.indicateur_valeur_date_repair` conserve les images complètes avant/après
des seules observations effectivement traitées, dont les six supprimées.
Cette archive administrative est inaccessible aux rôles applicatifs. Les
horodatages JSON sont sérialisés en UTC pour permettre les contrôles depuis
n’importe quel fuseau de connexion.

Le revert restaure exactement ces images initiales, y compris les observations
supprimées et leurs métadonnées. Il refuse d’écraser une modification ultérieure,
un identifiant réutilisé ou une autre observation à la date initiale. Les migrations
de schéma suivantes doivent être annulées d’abord. Seuls les triggers de
métadonnées sont suspendus pendant cette restauration, sous verrou et dans la
transaction ; les contraintes restent actives et les triggers retrouvent leur état
initial. L’archive est supprimée après une restauration réussie.

## Conséquence pour #5214

Les deux observations conservées de Margny sont au 1er janvier 2025, conformément
à la décision métier. Elles ne nécessitent aucune exception mensuelle pour la
migration annuelle. Cette réparation ne change pas les déclarations de
périodicité des définitions.

Après les deux réparations, le précontrôle réel de #5214 ne signale plus de date
invalide, de date à normaliser ou de collision dans la copie de production. Ce
résultat lève les anomalies de données inventoriées ; il ne valide pas les autres
changements de #5214 ou de #5215 au regard du plan et de l’ADR 0018.

## Validation de cette réparation

Le corps SQL a été répété dans une transaction annulée sur la copie locale de la
sauvegarde du 28 septembre 2026 : la référence erronée disparaît, le graphe passe
de une à zéro dépendance introuvable, et l’empreinte de tous les champs des
60 636 observations de `cae_2.a` reste identique. Le rollback restitue la formule
initiale de la copie. Ce contrôle ne vaut pas répétition de la migration de
périodicité de #5214.

Le cycle des dates a également été répété sur cette copie dans une transaction
annulée : trois mises à jour, six suppressions et neuf originaux archivés, aucune
date hors du calendrier restant parmi 4 772 453 observations, aucune dépendance
de formule introuvable après la correction précédente. Les autres observations des cinq
couples indicateur/collectivité concernés, notamment les séries externes, restent
identiques. Le revert restitue toutes les images initiales et réactive les deux
triggers de métadonnées. Le précontrôle réel de #5214 ne signale aucune anomalie
parmi les 4 772 453 observations restantes.

Les suites pgTAP passent : 22 assertions pour la formule et 40 pour les dates,
avec les vrais fichiers deploy/verify/revert. Elles couvrent aussi le rejeu,
les collisions, les données modifiées depuis l’approbation, les références de
score, le retour arrière après éditions concurrentes et les changements de fuseau.
Elles vérifient aussi les deux valeurs de Margny retenues au 1er janvier, le
résultat absent conservé à NULL et l’archivage de leurs six observations originales.
La vérification durable accepte les éditions métier ordinaires et les colonnes
ajoutées ultérieurement ; les contrôles de rejeu et de revert restent stricts.

Les tests de cycle utilisent les fichiers Sqitch réels sur des fixtures
synthétiques dans une base locale vide dédiée. Ils nécessitent Node.js, `psql`,
`pg_prove` et l’extension PostgreSQL `pgtap`. Leur commande est :

```sh
INDICATEUR_DATA_REPAIR_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/tet_indicateur_data_repair_test_local \
  bash data_layer/tests/indicateur/correct-formule-cae-2-a.spec.sh

# Utiliser une autre base vide pour la suite des dates.
INDICATEUR_DATA_REPAIR_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/tet_indicateur_data_repair_test_dates \
  bash data_layer/tests/indicateur/correct-dates-historiques.spec.sh
```

Créer cette base jetable avant le test et la supprimer après. Le runner refuse
une URL hors boucle locale, un autre préfixe de base ou un schéma indicateur déjà
présent. Il ne faut pas l’exécuter dans la base restaurée. Les assertions pgTAP
portent notamment sur la préservation des observations, le rejeu, le revert et
le refus d’une dépendance de remplacement absente.
