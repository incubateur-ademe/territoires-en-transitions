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

La migration vérifie l’identité, la date initiale, le caractère manuel sans
métadonnée, la date de dernière modification et **l’empreinte SHA-256 de l’image
JSONB complète approuvée**. Ces neuf empreintes sont figées dans le script,
vérifiées sur la sauvegarde du 29 septembre ; elles ne sont jamais recalculées
à partir des lignes courantes lors du déploiement. Résultat, objectif,
commentaires, auteurs et tous les autres champs sont donc contrôlés même si
`modified_at` reste inchangé, sans publier les images privées dans le dépôt.
Un changement intervenu depuis cet inventaire, une collision à la date cible ou
une référence de score sur une observation à supprimer annule toute la migration.
Les verrous empêchent une écriture concurrente de contourner ces contrôles.
Les scripts imposent `row_security = off` : ce réglage ne contourne pas les RLS,
il fait échouer le script si le rôle reçoit une vue filtrée. Utiliser un rôle
propriétaire non soumis à RLS ou disposant de `BYPASSRLS`. Un contrôle final
vérifie que toutes les suppressions et corrections archivées ont réellement eu
lieu ; un trigger qui ignore une mutation fait annuler tout le lot.

Une observation absente n’est pas créée. Une date déjà corrigée reste inchangée.
Les trois corrections préservent résultats, objectifs, commentaires et provenance ;
les triggers ordinaires mettent à jour les métadonnées de modification.
Aucun indicateur ni aucune série externe n’est supprimé ou recalculé.

`private.indicateur_valeur_date_repair` conserve les images complètes avant/après
des seules observations effectivement traitées, dont les six supprimées.
Cette archive administrative est inaccessible aux rôles applicatifs. Les
horodatages JSON sont sérialisés en UTC, les dates en ISO/YMD et les flottants
avec `extra_float_digits = 3`, indépendamment des réglages de connexion.

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

Les suites pgTAP comptaient initialement 22 assertions pour la formule et
40 pour les dates. La suite des dates passe désormais **55 assertions** après
les correctifs de revue du 29 septembre : résultat/commentaire modifié sans
changement d’horodatage, rôle soumis à RLS, suppression et mise à jour ignorées
par un trigger. Elles couvrent aussi le rejeu,
les collisions, les données modifiées depuis l’approbation, les références de
score, le retour arrière après éditions concurrentes et les changements de fuseau.
Elles vérifient aussi les deux valeurs de Margny retenues au 1er janvier, le
résultat absent conservé à NULL et l’archivage de leurs six observations originales.
La vérification durable accepte les éditions métier ordinaires et les colonnes
ajoutées ultérieurement ; les contrôles de rejeu et de revert restent stricts.

Les tests de cycle utilisent le SQL Sqitch sur des fixtures synthétiques dans
une base locale vide dédiée. Le runner remplace uniquement les neuf constantes
d’approbation dans une copie temporaire du deploy par les empreintes des fixtures,
figées **avant** les mutations de test. Aucun contrôle SQL n’est modifié, et
aucune donnée de production n’est publiée. Les constantes livrées sont vérifiées
séparément sur les neuf images réelles de la copie privée, avec deploy, verify,
revert puis rollback intégral. Comme le dump original n’exporte pas les ACL,
le droit d’usage du schéma `auth` par le propriétaire de `auth.users` a été
rétabli uniquement dans cette transaction de test, puis annulé avec elle.
Ils nécessitent Node.js, `psql`,
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
Les décisions métier du 28 septembre sont inchangées ; les contrôles du deploy ont été renforcés après revue.
Les 62 assertions pgTAP initiales ont été exécutées le 28 septembre. Après revue,
les 55 assertions de dates passent et une nouvelle répétition transactionnelle
sur le schéma métier original vérifie les neuf empreintes livrées, les trois
corrections, les six suppressions, le revert exact et le rollback intégral.

### Risques et limites actualisés

- **Recalcul manuel : protection ajoutée dans #5214.** L’upsert avec métadonnée
  refuse désormais qu’un calcul remplace une saisie (`calcul_auto = false` ou
  `NULL`), y compris après attente d’un verrou concurrent. Les dix tests PostgreSQL
  passent. Une répétition des vrais services de calcul/réconciliation sur les
  trois collectivités concernées préserve les **71 lignes PCAET complètes**,
  dont 32 sur formule : 1 142 écritures/propagations exercées, 800 résultats
  automatiques cohérents. La transaction est annulée et les 3 909 observations
  concernées retrouvent exactement leur empreinte initiale. **Cette pré-PR seule
  n’active pas la protection** et sa correction SQL de formule ne lance toujours
  aucun recalcul historique.
- **Provenance : fermeture des chemins utilisateur dans #5214.** REST/tRPC
  refusent les métadonnées importées sans capacité interne ; le parcours PCAET
  dispose d’une capacité bornée, les imports privilégiés restent fonctionnels.
  Les tests couvrent aussi le refus atomique du lot et les tentatives de
  falsification. Une migration réversible retire les mutations directes
  d’`indicateur_valeur` aux rôles utilisateurs/PostgREST, conserve la lecture et
  `service_role`, et archive les ACL de la cible pour un revert exact. Ses
  38 contrôles SQL passent. Les ACL ne figurent pas dans l’archive de production :
  les droits réels sont donc contrôlés au déploiement, avec arrêt atomique en cas
  d’héritage ou d’état inattendu.
- **Catalogue externe : vérification toujours nécessaire.** La sauvegarde ne
  permet pas de contrôler la cellule Google Sheets pouvant réintroduire
  `cae_2.lpcaet`. La préparation décrite plus haut reste applicable.
- **Ordre de livraison et fraîcheur des données.** Appliquer #5220, puis #5214,
  puis #5215. Les branches et le plan Sqitch imposent cette dépendance.
  **Garder la même maintenance entre #5220 et #5214** : arrêter les écritures
  utilisateur, imports et workers susceptibles de recalculer avant #5220 ; ne les
  reprendre qu’après déploiement et validation du backend protecteur de #5214.
  La pré-PR peut être revue/fusionnée séparément, mais ne doit pas être livrée
  seule en production avec l’ancienne application active. Relancer
  les contrôles sur la cible au moment prévu par le runbook : de nouvelles
  écritures peuvent modifier les états approuvés, créer une collision ou une
  référence de score. Les contrôles stricts feront alors échouer la migration des
  dates sans correction partielle. La correction de formule, migration distincte,
  peut déjà être appliquée.
- **Validation du schéma et des parcours.** Les répétitions de migration,
  activation et retour arrière, ainsi que les tests API, de restitution et
  d’export, sont détaillés dans le
  [rapport de validation de #5214/#5215](https://github.com/incubateur-ademe/territoires-en-transitions/blob/split/periodicite-data-migration/data_layer/periodicite-validation-2026-09-29.md).
  Elles ne remplacent pas les checks CI du commit publié, les contrôles avant
  réouverture ni la validation métier des règles d’agrégation. La décision
  annuelle de Margny n’impose plus d’exception mensuelle et ne démontre pas
  l’existence d’un historique à cadence différente.
