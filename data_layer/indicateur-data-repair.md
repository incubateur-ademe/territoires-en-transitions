# Réparation des données avant la migration des périodicités

Le contrôle de la sauvegarde de production du 28 septembre 2026 a trouvé une
référence de formule inexistante et neuf dates hors du calendrier pris en charge.
Ces données doivent être traitées avant la migration de schéma de la PR #5214.
L’inventaire et les réparations ont été revalidés sur la sauvegarde du 29 septembre ;
les mesures et risques actualisés figurent en fin de document.

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

## Actualisation sur la sauvegarde du 29 septembre 2026

Restauration locale avec `make db-restore-local-from-prod-backup d=latest` :
archive `backup-2026-09-29.dump`, créée à 02:21:05 CEST depuis PostgreSQL 15.8,
version applicative de production `e32417f9e` déployée le 25 septembre.
Les 165 tables configurées ont été restaurées et tous les contrôles de fin ont
réussi. Le schéma de l’archive et son journal Sqitch ont été examinés séparément
du schéma local : aucune colonne de périodicité, préférence locale associée
ni migration de périodicité n’y figure. Le socle annuel/mensuel décrit dans le plan ne doit donc pas être
considéré comme déjà déployé dans cette sauvegarde. Les dates seules ne prouvent
pas la périodicité métier d’une série.

| Mesure | 28 septembre | 29 septembre |
| --- | ---: | ---: |
| Observations avant réparation | 4 772 459 | 4 772 554 |
| Dates invalides avant réparation | 9 | 9 |
| Observations après les six suppressions approuvées | 4 772 453 | 4 772 548 |
| Observations de `cae_2.a`, intégralement préservées | 60 636 | 60 639 |
| Observations manuelles PCAET avec métadonnées | 69 | 71 |
| Dont observations d’indicateurs avec formule | 30 | 32 |

Le catalogue contient 26 554 définitions, dont 78 formules. Le graphe garde
294 références, dont une introuvable avant réparation et aucune après.
Le précontrôle de #5214 retrouve uniquement les neuf dates invalides connues
avant réparation, puis aucune anomalie sur les 4 772 548 observations restantes :
aucune date invalide, aucune date à normaliser et aucune collision.

Les six originaux de Margny correspondent champ par champ à l’export du
28 septembre ; ses empreintes SHA-256 sont inchangées. Les garde-fous de la
migration valident encore les neuf identités et états initiaux, les trois dates
cibles libres et l’absence de référence de score sur les six suppressions.
La répétition des vrais SQL deploy/verify/revert applique trois corrections et
six suppressions, conserve les neuf originaux en archive privée, puis les
restaure exactement. Les deux valeurs retenues de Margny sont bien `8 / 9` et
`NULL / 3` au 1er janvier 2025. Les autres observations des cinq couples
indicateur/collectivité concernés, dont Atmo, et l’empreinte de tous les champs
des 60 639 observations de `cae_2.a` restent identiques. Les deux triggers de
métadonnées sont réactivés après revert.

Cette répétition s’est terminée par un rollback : la copie locale conserve les
observations originales du 29 septembre. Aucune écriture n’a été faite en production.
Le code des réparations et les décisions métier du 28 septembre sont inchangés.
Les 62 assertions pgTAP ont été exécutées le 28 septembre ; la nouvelle validation
du 29 septembre porte sur la restauration, l’inventaire et cette répétition sur
la copie de production.

### Risques et limites actualisés

- **Recalcul des saisies manuelles avec métadonnées : risque toujours présent.**
  Les 32 observations PCAET manuelles d’indicateurs calculés constituent une
  exposition possible, pas un décompte de pertes certaines. Dans #5214 au commit
  `1304106ca`, l’upsert avec métadonnées ne possède pas la protection de l’upsert
  sans métadonnées. Un recalcul peut remplacer une saisie s’il produit la même
  identité indicateur/collectivité/période/métadonnée. Protéger ces écritures avant
  tout recalcul historique ; la réparation SQL de formule n’en déclenche aucun.
  Voir [les deux chemins d’upsert](https://github.com/incubateur-ademe/territoires-en-transitions/blob/1304106ca/apps/backend/src/indicateurs/valeurs/crud-valeurs.repository.ts#L438).
- **Provenance externe fournie par l’API REST : écart de droits encore à traiter.**
  Un utilisateur autorisé à écrire dans sa collectivité peut transmettre une
  métadonnée externe existante, sans capacité d’import distincte vérifiée.
  Le risque concerne une écriture sous cette provenance pour un indicateur
  disponible et autorisant les valeurs utilisateur. Ce constat de code ne
  démontre ni accès anonyme ni écriture intercollectivités ; #5214 impose encore
  l’annuel. Voir [la validation des métadonnées](https://github.com/incubateur-ademe/territoires-en-transitions/blob/1304106ca/apps/backend/src/indicateurs/valeurs/validate-indicateur-valeurs-write.service.ts#L127).
- **Catalogue externe : vérification toujours nécessaire.** La sauvegarde ne
  permet pas de contrôler la cellule Google Sheets pouvant réintroduire
  `cae_2.lpcaet`. La préparation décrite plus haut reste applicable.
- **Ordre de livraison et fraîcheur des données.** Appliquer la pré-PR #5220 avant
  la migration #5214, puis l’activation #5215. Relancer les contrôles sur la cible
  au moment prévu par le runbook : de nouvelles écritures peuvent modifier les
  états approuvés, créer une collision ou une référence de score. Les contrôles
  stricts feront alors échouer la migration des dates sans correction partielle.
  La correction de formule, migration distincte, peut déjà être appliquée.
- **La conformité complète au plan et à l’ADR reste distincte de cet inventaire.**
  La migration complète du schéma de #5214, l’activation de #5215, leur reprise et
  les parcours applicatifs n’ont pas été répétés ici. La validation métier des
  agrégations reste également à établir ; elle ne se déduit pas du dump.
  La décision annuelle de Margny n’impose plus d’exception mensuelle pour ces
  données et ne démontre pas l’existence d’un historique à cadence différente.
