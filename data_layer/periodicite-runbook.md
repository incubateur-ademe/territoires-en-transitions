# Périodicité des indicateurs — livraison 1 : migration annuelle

Cette première livraison migre le stockage, normalise les dates annuelles et adapte
le backend ainsi que les tâches `tools`. Elle peut rester en production sans la
livraison d’activation : créations, imports et valeurs restent annuels, l’agrégation
reste désactivée. Des validations API et des contraintes SQL imposent cette limite.

Le [découpage des deux livraisons](periodicite-releases.md) décrit leur périmètre.
La migration et les applications compatibles se déploient dans la même fenêtre de
maintenance. Le frontend conserve son fonctionnement annuel.

## Préparer la maintenance

La [pré-PR #5220](indicateur-data-repair.md) doit être appliquée avant cette livraison.
Les protections des saisies manuelles et de provenance font partie de #5214 :
un calcul automatique ne remplace pas une saisie, y compris sous métadonnée PCAET ;
un appel REST utilisateur ne peut pas fournir de `metadonneeId`. Les imports
privilégiés et le parcours PCAET dédié conservent leurs autorisations propres.
La migration `indicateur/reserver-ecriture-valeurs-backend` retire les écritures
directes de `PUBLIC`, `anon` et `authenticated`, tout en conservant les lectures
et les imports `service_role`. Elle doit tourner avec le propriétaire de la table ;
un héritage de droits inattendu bloque la migration. Ses ACL initiales sont
archivées pour un retour arrière exact. La restauration de données conserve
les ACL et cette archive propres à la cible.

La [répétition du 29 septembre](periodicite-validation-2026-09-29.md) documente
les protections, les tests et leurs limites ; elle ne remplace pas les contrôles
sur une sauvegarde à jour avant la maintenance.

- Choisir la cible et le commit de `split/periodicite-data-migration` à livrer. Préparer les versions correspondantes du backend,
  du frontend et de `tools`, ainsi que les versions précédentes pour une reprise.
- Sur une copie récente de la production, exécuter le contrôle des dates ci-dessous, résoudre
  les collisions, puis répéter la migration et la restauration du **schéma et des données**.
  Utiliser cette répétition pour fixer la durée de la maintenance et la procédure de reprise.
- Mettre à jour l'automatisation Google Sheets du catalogue : authentifier
  `GET /indicateur-definitions/verify`, remplacer l'ancien import anonyme par
  `POST /indicateur-definitions/import` authentifié et lire la réponse
  `status` / `definitions` / `reconciliation`. Ces appels externes doivent être prêts pour la reprise.

### Contrôler les dates avant migration

Le [script de contrôle](scripts/check-indicateur-periodicite.sql) est livré avec cette première PR.
Depuis la racine d'un checkout de cette version, définir `PERIODICITE_CHECK_DATABASE_URL`
vers la copie **encore au schéma précédent**, avec un compte pouvant lire toutes les valeurs :

```sh
psql --no-psqlrc --dbname="${PERIODICITE_CHECK_DATABASE_URL:?URL de la copie requise}" \
  --file=data_layer/scripts/check-indicateur-periodicite.sql
```

Le script ne modifie ni données ni schéma. Il fonctionne aussi après l'ajout de `periodicite`.
Il affiche les valeurs concernées, leur indicateur et collectivité, la version de données importées
(`metadonnee_id`, vide pour une saisie de la collectivité), et les dates d'origine et attendues.

| Statut | Action avant migration |
| --- | --- |
| `a_normaliser` | Vérifier la date attendue. La migration la normalisera et conservera la date d'origine dans l'audit. |
| `conflit` | Faire résoudre les valeurs qui correspondent à la même période ; aucune fusion automatique. |
| `date_invalide` / `periodicite_inconnue` | Corriger les données signalées. |

Un rapport vide ne signale aucune anomalie de date ou collision. **Un code de sortie 0 signifie
seulement que le script s'est exécuté** : il faut lire le rapport. Le contrôle ne remplace pas
les vérifications des migrations ni les tests applicatifs.

## Pendant la maintenance

1. Fermer les accès, arrêter les anciennes instances et suspendre les imports, tâches planifiées
   et autres écritures SQL directes. Attendre la fin des opérations en cours. Suspendre aussi les
   sauvegardes et restaurations automatiques de la cible pendant l'intervention.
2. Prendre la sauvegarde de reprise du schéma et des données après l'arrêt des écritures.
   Réexécuter le contrôle des dates sur la cible : toute nouvelle anomalie bloquante doit être résolue
   avant de migrer, avec une nouvelle sauvegarde si les données sont corrigées.
3. Depuis la racine du commit préparé, exécuter
   `sqitch deploy --mode all --verify --target <cible>` jusqu'au schéma final.
   Les migrations revérifient les données sous verrou et refusent les conflits. Chaque changement SQL
   est transactionnel ; l'ensemble ne forme pas une transaction unique. Les tags intermédiaires
   ordonnent les migrations et leurs tests, sans déploiement applicatif entre ces étapes.
4. Déployer le backend et `tools` compatibles, puis le frontend annuel du même commit.
   Avant de rouvrir, vérifier lecture et écriture annuelles (y compris `0`, `NULL` et
   commentaires), modification par identifiant, imports, calculs, PCAET, score indicatif,
   graphiques et exports existants. Une date historique annuelle est rattachée au
   1er janvier de son année, même si le client transmet `periodicite: annuelle`.
   Vérifier que les créations/imports non annuels et la configuration d’agrégation
   sont refusés par l’API et que les écritures SQL privilégiées restent limitées à l’annuel.
   Vérifier le refus des mutations directes `anon`/`authenticated` sur
   `indicateur_valeur`, tout en conservant lecture, imports et parcours PCAET.
5. Si les vérifications passent, rouvrir les accès et reprendre les imports et tâches compatibles. Dans `tools`, vérifier que
   `drain-indicateur-formula-reconciliations` s'exécute ; l'inclure dans `CRON_JOBS_FILTER` si ce filtre
   est configuré. Reprendre les sauvegardes et les restaurations entre schémas compatibles.

## Contrat après migration

Les identifiants des valeurs sont conservés ; les dates normalisées sont auditées.
Plusieurs lignes d’une même série dans une année constituent une collision : la
migration bloque et ne choisit ni ne fusionne automatiquement les observations.
Les nouvelles écritures utilisent une seule valeur par indicateur, collectivité,
source/version et année. Les dates historiques transmises par les clients annuels
sont normalisées avant l’upsert. Les instantanés de scores restent inchangés.

L’état de restauration est `annual`. Une sauvegarde `legacy`, `expand` ou activée
(`contract`) ne peut pas être restaurée avec le script de restauration de données
sur cette livraison. Utiliser une sauvegarde du même état ou une reprise complète
cohérente du schéma, des données et des applications.

## En cas d'échec

Avant la réouverture, garder les accès fermés : corriger et reprendre le déploiement, ou restaurer
le schéma et les données sauvegardés à l'étape 2 avec les anciennes versions applicatives.
Le script [backup/restore.sh](backup/restore.sh) restaure des données vers local/staging/preprod ;
il ne constitue pas une procédure de reprise de production couvrant le schéma.

Après la réouverture, préserver les nouvelles écritures et privilégier une correction en avant.
Restaurer l'ancienne sauvegarde ou supprimer les colonnes de périodicité pourrait perdre des données.

## Vérifications locales

- `make db-migrate` applique les migrations avec vérification sur la base locale configurée.
- `make db-init` initialise les services, migrations, référentiels et données de test locaux.
- `make db-test-deployment-guards` teste les contrôles de connexion et de restauration.
- `make db-test-periodicite-migration` teste migration, concurrence, restauration et retour arrière.
  `PERIODICITE_MIGRATION_TEST_DATABASE_URL` doit désigner une base locale jetable nommée
  `periodicite_migration_lifecycle_test_*`, initialisée au schéma précédant les migrations de périodicité.
