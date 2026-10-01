# Livraisons des périodicités

| Ordre | PR / branche | Responsabilité | Application après déploiement |
| --- | --- | --- | --- |
| 1 | #5220 — `fix/indicateur-data-before-periodicite` | Réparations des neuf observations approuvées et contrôle des dates | Backend actuel, schéma historique |
| 2 | #5292 — `split/periodicite-schema` | Catalogue, colonnes annuelles et index supplémentaires | Backend actuel, schéma compatible |
| 3 | #5214 — `split/periodicite-data-migration` | Backend, protection des saisies, correction de formule, contrôles et bascule SQL | Nouveau backend annuel |
| 4 | #5215 — `split/periodicite-activation` | Nouvelles cadences, saisie et agrégations de restitution | Quatre cadences |
| 5 | #5312 — `fix/margny-indicateurs-mensuels` | Migration mensuelle des deux indicateurs et six observations de Margny | Schéma activé, archives conservées |
| 6 | #5296 — `chore/periodicite-cleanup` | Retrait du temporaire après validation et sauvegarde complète | Schéma final nettoyé |

Les livraisons 1 et 2 peuvent rester en production avec le backend actuel.
Chaque livraison se base sur la précédente. Après fusion/squash du parent,
rebaser la suivante sur le commit fusionné et retargeter sa PR vers `main`.

## Schéma compatible

Appliquer d'abord #5220, puis déployer jusqu'à `@indicateur-periodicite-schema`.
La migration ajoute des colonnes avec un défaut annuel et les nouveaux index ;
elles ne modifient pas les dates, résultats, objectifs, commentaires ou auteurs.
Les anciens index restent disponibles pour les `ON CONFLICT` existants. Les droits
sur les valeurs et les formules restent identiques. Le catalogue est en lecture
seule ; les contraintes temporaires limitent les colonnes ajoutées à l'annuel et
ferment l'agrégation. Aucun déclencheur ne normalise les écritures historiques.

Prendre une sauvegarde avant le déploiement et prévoir les verrous DDL :
`lock_timeout = 5s` fait échouer la migration entière si elle ne peut pas obtenir
ses verrous rapidement. La durée de construction des index dépend du volume ;
la mesurer sur une copie récente et prévoir une courte suspension des écritures.
Après vérification, l'ancien backend, les imports et les tâches peuvent reprendre.
Tester création et édition, upserts locaux/importés, suppression et consultations.

Le revert retire uniquement les ajouts de cette livraison, sans changer les
observations. Il refuse un retour après la bascule backend ou si les nouvelles
colonnes contiennent un état qui serait perdu. Annuler d'abord les livraisons
ultérieures ; ne jamais forcer un retour qui supprimerait une information métier.

## Bascule backend

La livraison #5214 arrête les anciens producteurs pendant sa maintenance, contrôle
à nouveau les dates et collisions, corrige la formule PCAET puis installe le contrat
final et les applications compatibles. La correction de formule ne recalcule pas
les observations ; les recalculs reprennent avec la protection des saisies manuelles.
Les index historiques, la normalisation transitoire et les anciens droits ne sont
retirés que dans cette livraison. Les dates transmises aux API annuelles restent
normalisées au 1er janvier par le nouveau backend.

Une anomalie créée entre les livraisons doit être traitée avant la bascule.
Les contrôles de migration refusent les collisions, sans fusion automatique.
#5215 reste une livraison distincte d'activation après la validation annuelle.

## Restauration

Pour cette étape, utiliser les scripts du commit du schéma compatible ; ceux de
la sixième livraison exigent le schéma final nettoyé.
Conserver le catalogue installé par migration. Les sauvegardes historiques peuvent
être chargées sur le schéma compatible : les colonnes absentes prennent leurs
défauts annuels. Une sauvegarde du schéma compatible se restaure sur ce même état.
Le contrôle de restauration refuse une sauvegarde de la livraison backend ou
activée, ainsi qu'une sauvegarde avec colonnes nouvelles vers un schéma historique.
Pour un retour arrière en production, préparer une restauration cohérente du schéma,
des données et des applications ; `backup/restore.sh` cible local/staging/preprod.

## Vérification du schéma autonome

Sur une base locale vide et jetable, avec `psql` et `pg_prove` installés :

```sh
PERIODICITE_SCHEMA_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/periodicite_schema_test_local \
  bash data_layer/tests/indicateur/periodicite-schema.spec.sh
```

Les 18 assertions exécutent les vrais fichiers deploy/verify/revert. Elles couvrent
les upserts historiques locaux et importés, les valeurs zéro/null, les dates non
canoniques, les droits inchangés et la conservation des écritures lors du revert.
Le 30 septembre 2026, un scénario des vrais routeurs de l'ancien backend a aussi
validé insertion, upsert, édition, lecture et suppression avant et après ce schéma,
sur deux bases jetables avec fixtures synthétiques.

## Migration métier de Margny

Après #5215, suivre le [guide de migration mensuelle de Margny](margny-monthly-migration.md).
Cette livraison reste déployable avant le nettoyage #5296.

## Nettoyage final

Après validation de la migration de Margny, suivre le [guide de nettoyage](periodicite-cleanup.md).
La sixième livraison exige une sauvegarde complète vérifiée et ferme le retour arrière Sqitch.
