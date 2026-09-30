# Réparation des dates avant le schéma des périodicités

Cette PR (#5220) corrige uniquement les neuf observations approuvées sur le
schéma historique. Elle ne modifie aucune formule et ne lance aucun recalcul.
Elle peut être déployée avec le backend actuel, avant la PR de schéma compatible.

Ordre : **réparations #5220 → schéma compatible → backend #5214 → activation #5215**.
La correction de `cae_2.lpcaet` en `cae_2.l_pcaet` est livrée avec le backend
protecteur de #5214, avant ses contrôles de dépendances des formules. Elle doit
rester absente de cette livraison : les recalculs de l'ancien backend ne protègent
pas encore toutes les saisies PCAET manuelles avec métadonnées.

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

## Contrôler les dates avant et après la réparation

Le [rapport de dates](scripts/check-indicateur-periodicite.sql) est en lecture seule
et fonctionne sur le schéma historique puis sur le schéma avec périodicité :

```sh
psql --no-psqlrc --dbname="${PERIODICITE_CHECK_DATABASE_URL:?URL de la copie requise}" \
  --file=data_layer/scripts/check-indicateur-periodicite.sql
```

Un code de sortie 0 signifie que le rapport a été exécuté : lire aussi ses lignes.
`date_invalide` et `conflit` exigent une réparation métier ; `a_normaliser` indique
une date annuelle différente du 1er janvier. Aucune fusion ni correction générique
n'est exécutée par ce contrôle.

Sur la sauvegarde du **29 septembre 2026**, les neuf observations approuvées étaient
les seules anomalies. Après les trois corrections et six suppressions :
**4 772 548 observations, aucune date invalide, aucune date à normaliser et aucune
collision**. Les dates de Margny sont au 1er janvier 2025, avec `8 / 9` et `NULL / 3`.
Il n'est donc pas nécessaire d'ajouter une réécriture générale des dates à cette PR.
Ce constat porte sur cette sauvegarde ; refaire le contrôle sur une copie récente
et avant la bascule du backend. Les écritures de l'ancien backend restent possibles
entre les livraisons et peuvent introduire de nouvelles anomalies.

## Déploiement et retour arrière

Déployer cette PR avant tout ajout de colonne de périodicité : les empreintes
approuvées couvrent les lignes complètes du schéma historique. Prendre une sauvegarde
avant le changement. La migration prend les verrous nécessaires et applique le lot
atomiquement ; un état différent de celui approuvé bloque le déploiement.

Après vérification des réparations, le backend actuel peut continuer à fonctionner.
Les formules, imports et règles de recalcul conservent leur état antérieur. La
protection générale des saisies manuelles sera livrée dans #5214 ; aucun recalcul
historique ne doit être déclenché pour valider cette réparation.

Revenir sur les migrations de schéma ultérieures avant le revert de cette PR.
Le revert refuse d'écraser une édition métier postérieure. Une fois les écritures
reprises, privilégier une correction en avant qui préserve ces éditions.

## Preuves et limites

Les répétitions des 28 et 29 septembre sur copies locales ont appliqué les trois
corrections et six suppressions, puis restauré exactement les neuf originaux par
revert et rollback. Les séries voisines, dont Atmo, sont restées identiques. Les
empreintes approuvées et les exports de Margny étaient identiques sur les deux
sauvegardes. Aucune écriture en production n'a été effectuée.

Les **55 assertions pgTAP** de dates couvrent notamment : identité complète approuvée,
RLS, collisions, références de score, refus des mutations ignorées par un trigger,
rejeu, archivage, retour arrière et changements de fuseau. Les fixtures sont
synthétiques ; seules les constantes d'approbation d'une copie temporaire du script
sont remplacées, avant les mutations de test. Les empreintes livrées restent figées.

```sh
INDICATEUR_DATA_REPAIR_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/tet_indicateur_data_repair_test_dates \
  bash data_layer/tests/indicateur/correct-dates-historiques.spec.sh
```

Créer cette base locale vide et jetable avant le test, puis la supprimer. Le runner
requiert Node.js, `psql`, `pg_prove` et l'extension `pgtap` ; il refuse une cible
hors boucle locale ou contenant déjà les tables d'indicateurs.

Les validations historiques des formules, protections PCAET et droits SQL concernent
la livraison backend, décrite dans le [rapport de #5214](https://github.com/incubateur-ademe/territoires-en-transitions/blob/split/periodicite-data-migration/data_layer/periodicite-validation-2026-09-29.md).
Elles ne constituent pas une validation du nouveau découpage ; celui-ci doit tester
l'ancien backend après réparation, puis après ajout du schéma, et le nouveau backend
après sa bascule SQL.
