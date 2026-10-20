# Supprimer les espaces Arrondissements de Paris et Marseille

[TET-6518](https://app.notion.com/p/2e76523d57d780d993bfe0921cd6da1b).
Script manuel, absent du plan Sqitch et des seeds : aucun nettoyage au déploiement.

Le périmètre est limité aux collectivités de type `commune` portant les codes
`13201` à `13216` (Marseille) ou `75101` à `75120` (Paris). Les identifiants sont
résolus dans la base cible. Les villes (`13055`, `75056`), Lyon, les comptes
utilisateurs et les données géographiques d'import restent inchangés.

Le ticket ne définit aucun transfert de données ni de droits. Le script refuse
donc **toute suppression** si un espace ciblé a encore des dépendances : clés
étrangères, y compris celles avec cascade, tables avec `collectivite_id` même sans
FK, ou fichiers dans ses buckets. L'inventaire indique les espaces, tables,
colonnes et nombres de lignes concernés. Les références stockées seulement dans
du JSON, des journaux textuels ou des services externes ne sont pas inventoriées.
La présence des deux espaces Ville est également requise.

Seuls les liens `collectivite_bucket` vers des buckets vides sont supprimés avec
les espaces. Les buckets eux-mêmes restent en place ; les identifiants figurent
dans l'inventaire pour une éventuelle intervention ultérieure via l'API Storage.
Les contraintes et les triggers restent actifs.

## Inventaire

Utiliser `psql` avec un rôle pouvant lire toutes les tables concernées. Le script
refuse un inventaire incomplet lié aux droits ou aux politiques RLS.
`ARRONDISSEMENTS_DATABASE_URL` doit désigner explicitement la base choisie.
Commencer sur une copie récente et isolée.

La restauration `make db-restore-local-from-prod-backup` charge les tables
énumérées dans `data_layer/backup/restore-config.yml`. Avant de conclure à
l'absence de dépendances, comparer cet ensemble aux tables de l'archive et de
l'inventaire. Des références peuvent notamment rester dans `migration.plan_action`,
`client_scores`, `personnalisation_consequence`, `pre_audit_scores`, `usage_backup`
ou `visite_backup`, qui ne font pas partie de cette restauration. Charger les
tables manquantes concernées depuis la même archive dans la copie locale avant
de tester la suppression.

```sh
psql -X --dbname="$ARRONDISSEMENTS_DATABASE_URL" \
  --file=data_layer/scripts/delete-arrondissements-paris-marseille.sql \
  > /tmp/arrondissements-inventaire.log 2>&1
```

La fonction auxiliaire est créée dans le schéma temporaire de la session.
L'inventaire s'exécute ensuite dans une transaction **READ ONLY**.
Une valeur de `espaces_supprimes = 0` en mode inventaire n'indique pas l'absence de
blocages : lire les messages `BLOCAGE` et les nombres d'objets stockés.

## Exécution manuelle, après revue

1. Vérifier les identifiants, les deux espaces Ville et tous les blocages.
   Si des données existent, décider explicitement de leur conservation ou de leur
   transfert ; le script ne les efface pas et n'offre aucun mode de forçage.
2. Disposer d'une sauvegarde restaurable de la base cible et valider le script
   sur une copie. Fermer les écritures applicatives, imports et tâches de fond
   pendant l'intervention : le script verrouille aussi les tables de dépendances
   et `storage.objects`.
3. Lancer explicitement :

   ```sh
   psql -X --dbname="$ARRONDISSEMENTS_DATABASE_URL" -v apply=true \
     --file=data_layer/scripts/delete-arrondissements-paris-marseille.sql
   ```

4. Relancer l'inventaire : aucun espace ne doit rester ciblé.

L'exécution refait les contrôles sous verrous et commit la suppression dans une
seule transaction. Une erreur ou un délai de verrouillage annule l'ensemble.
Une nouvelle exécution après succès ne supprime rien. Après commit, la récupération
des espaces nécessite la sauvegarde.

Les seeds de développement contiennent ces arrondissements et peuvent les recréer
lors d'une réinitialisation locale ; ce script reste une intervention manuelle.

## Validation

Les tests utilisent uniquement des données synthétiques dans une base jetable avec
pgTAP, sans serveur applicatif ni appel externe :

```sh
pg_prove --dbname="$ARRONDISSEMENTS_TEST_DATABASE_URL" --ext .psql --verbose \
  data_layer/tests/collectivite/delete-arrondissements-paris-marseille.assertions.psql
```

Cette base doit être vide (hors extension pgTAP). Le test refuse une base contenant
déjà `public.collectivite` ou un des schémas `storage`, `historique`, `imports`.
Les tests de permissions nécessitent un rôle superutilisateur dans cette base
jetable. L'extension `.psql` exclut ce test de la suite `run_tests.sh` qui s'exécute
sur une base initialisée.
