# Livraisons des périodicités

État au **5 octobre 2026** : [#5292](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5292)
est fusionnée dans [#5220](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5220).
Les étapes historiques 1/4 (réparations) et 2/4 (schéma compatible) forment donc
une seule livraison. #5220 cible `main` ; #5214 et #5215 restent en brouillon.
Le périmètre fonctionnel reste celui de l'[ADR 0018](../doc/adr/0018-periodicite-des-indicateurs.md).

| Ordre | PR / branche | Responsabilité | Application après déploiement |
| --- | --- | --- | --- |
| 1 | [#5220](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5220) — `fix/indicateur-data-before-periodicite`, incluant #5292 | Réparations des neuf observations approuvées, contrôle des dates, catalogue, colonnes annuelles et index supplémentaires | Backend actuel, schéma compatible |
| 2 | [#5214](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5214) — `split/periodicite-data-migration` | Backend, protection des saisies, correction de formule, contrôles et bascule SQL | Nouveau backend annuel |
| 3 | [#5215](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5215) — `split/periodicite-activation` | Nouvelles cadences, saisie et agrégations de restitution | Quatre cadences |

La première livraison peut rester en production avec le backend actuel ; la deuxième
peut rester en production sans activation.

La chaîne de PR est **#5220 → #5214 → #5215**. #5214 cible la branche de #5220 ;
#5215 cible la branche de #5214. Chaque modification du parent nécessite de
resynchroniser les PR qui en dépendent. Après fusion/squash d'un parent dans `main`, rebaser la PR suivante
sur le commit effectivement fusionné, retargeter cette PR vers `main`, puis
resynchroniser les PR qui en dépendent.

## Réparations et schéma compatible — #5220

Déployer #5220 jusqu'à **`@indicateur-periodicite-schema`**. Sqitch impose l'ordre :

1. `indicateur/correct-dates-historiques` : trois corrections de date et six suppressions,
   avec archivage et contrôle des neuf observations approuvées. Voir le
   [détail des réparations](indicateur-data-repair.md).
2. `@indicateur-periodicite-base` : repère après réparation, encore au schéma historique.
3. `indicateur/periodicite_schema`, puis `@indicateur-periodicite-schema` : catalogue,
   colonnes annuelles et index supplémentaires.

Les empreintes approuvées couvrent les lignes complètes du schéma historique :
la réparation doit précéder l'ajout des colonnes. Le tag `@indicateur-periodicite-base`
reste un repère intermédiaire, même si les deux étapes sont maintenant dans la même PR.
Chaque migration est transactionnelle ; un échec du schéma n'annule pas automatiquement
une réparation déjà appliquée.

La migration de schéma ajoute des colonnes avec un défaut annuel et les nouveaux index ;
elle ne modifie pas les dates, résultats, objectifs, commentaires ou auteurs.
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

Refaire le [rapport de dates et collisions](scripts/check-indicateur-periodicite.sql)
sur une copie récente avant déploiement, puis après réparation :

```sh
psql --no-psqlrc --dbname="${PERIODICITE_CHECK_DATABASE_URL:?URL de la copie requise}" \
  --file=data_layer/scripts/check-indicateur-periodicite.sql
```

Ce contrôle est en lecture seule et fonctionne avant et après l'ajout du schéma.
Un code de sortie 0 signifie que le rapport a été exécuté : lire aussi ses lignes.
Les statuts `date_invalide`, `periodicite_inconnue` et `conflit` exigent une correction
métier ; `a_normaliser` signale une date annuelle que #5214 devra normaliser.
Le schéma compatible ne normalise pas les dates écrites par l'ancien backend.

## Bascule backend annuelle — #5214

Après validation de #5220, arrêter les anciens producteurs pendant la maintenance,
contrôler à nouveau les dates et collisions, puis déployer jusqu'à
**`@indicateur-periodicite-annuelle`** avec le backend, le frontend annuel et `tools`
compatibles dans la même fenêtre. Les tags `expand` et `contract` sont des repères
internes de la bascule, sans reprise des anciens producteurs entre ces étapes.

Cette livraison normalise les dates annuelles avec audit, installe les contraintes
finales et retire les anciens index et les droits d'écriture SQL des rôles utilisateurs.
Les imports privilégiés conservent leurs autorisations. La correction de formule
`cae_2.lpcaet` → `cae_2.l_pcaet` ne recalcule pas les observations ; les recalculs
reprennent avec la protection des saisies manuelles, y compris sous métadonnée PCAET.
Les dates transmises aux API annuelles sont normalisées au 1er janvier.
Créations, imports et valeurs restent annuels ; l'agrégation reste fermée.

Une anomalie créée entre les livraisons doit être traitée avant la bascule.
Les contrôles de migration refusent les collisions, sans fusion automatique.
Voir le [runbook de #5214](https://github.com/incubateur-ademe/territoires-en-transitions/blob/007fe364fd1650b8b145058e15e13feed27349ef/data_layer/periodicite-runbook.md)
pour l'arrêt des producteurs, les versions applicatives, les contrôles de reprise
et l'adaptation de l'automatisation du catalogue.

## Activation — #5215

Après validation du backend annuel, déployer #5215 jusqu'à
**`@indicateur-periodicite-activee`**, avec les applications compatibles dans la même
maintenance. `indicateur/periodicite_activation` retire les contraintes annuelles
temporaires sans remigrer les observations. Les cadences mensuelle, trimestrielle
et semestrielle et les agrégations de restitution explicitement configurées deviennent
disponibles, en complément de l'annuel.

## Retour arrière

Annuler les livraisons dans l'ordre inverse : activation, backend annuel, schéma
compatible, puis réparation. Le revert d'activation refuse une cadence non annuelle
ou une agrégation configurée. Le revert du backend conserve le schéma compatible.

Le revert de `periodicite_schema` retire uniquement ses ajouts et conserve les
observations, y compris les écritures faites depuis son déploiement. Il refuse un
retour après la bascule backend ou un état qui perdrait des informations.
Il doit précéder celui de `correct-dates-historiques` : ce dernier exige le schéma
historique et refuse d'écraser une édition ultérieure, un identifiant réutilisé
ou une collision à la date d'origine. Après reprise des écritures, privilégier
une correction en avant qui préserve ces éditions.

## Restauration

Dans #5220, [check-restore-compatibility.sh](backup/check-restore-compatibility.sh)
contrôle la sauvegarde et la cible avant toute troncature par
[restore.sh](backup/restore.sh). Seuls **`legacy → legacy`**, **`legacy → schema`**
et **`schema → schema`** sont autorisés. Les états inconnus, les sauvegardes backend
ou activées et `schema → legacy` sont refusés.

Conserver le catalogue installé par migration. Avec `legacy → schema`, les colonnes
absentes de la sauvegarde prennent leurs défauts annuels. Après la bascule backend,
les scripts exigent une sauvegarde et une cible au même état : `annual` pour #5214,
`contract` après activation par #5215.

`backup/restore.sh` cible local/staging/preprod. Pour une reprise de production ou
un retour à un état antérieur, préparer une restauration cohérente du schéma,
des données et des applications selon le runbook de #5214.

## Vérification de la première livraison

Créer deux bases locales vides et jetables, avec Node.js, `psql`, `pg_prove`,
l'extension `pgtap` et les rôles `anon`, `authenticated`, `service_role` disponibles.
Depuis la racine du dépôt :

```sh
INDICATEUR_DATA_REPAIR_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/tet_indicateur_data_repair_test_dates \
  bash data_layer/tests/indicateur/correct-dates-historiques.spec.sh

PERIODICITE_SCHEMA_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/periodicite_schema_test_local \
  bash data_layer/tests/indicateur/periodicite-schema.spec.sh
```

Supprimer ces bases après les tests. Les runners refusent une cible hors boucle
locale ou contenant déjà les tables d'indicateurs. Les 55 assertions de réparation
et les 18 assertions de schéma exécutent les vrais fichiers deploy/verify/revert
avec des fixtures synthétiques. Elles couvrent les refus de réparation et les
archives, les upserts historiques, zéro/null, les dates non canoniques, les droits
inchangés et la conservation des écritures lors du revert du schéma.

Les résultats historiques du 30 septembre, dont les scénarios des vrais routeurs
de l'ancien backend avant et après le schéma, sont consignés dans la
[validation du découpage](https://github.com/incubateur-ademe/territoires-en-transitions/blob/007fe364fd1650b8b145058e15e13feed27349ef/data_layer/periodicite-validation-2026-09-30.md).
Le regroupement des PR et les rebases sur `main` ne constituent pas une nouvelle
exécution de ces tests ni une répétition sur le volume de production.
Avant déploiement, répéter les contrôles sur une copie récente et mesurer les verrous
et la durée de construction des index.
