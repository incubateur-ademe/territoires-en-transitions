# Périodicité des indicateurs — préparation #5366 puis bascule annuelle #5367

La livraison annuelle [#5367](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5367)
(`split/periodicite-annual-cutover`) suit la préparation backend
[#5366](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5366)
(`split/periodicite-backend-preparation`). Ces deux PR remplacent #5214.
La première PR peut rester en production avec le stockage annuel historique.
Cette seconde PR livre ensemble les valeurs, les calculs, leurs protections,
les tâches `tools` et la bascule SQL ; elle peut rester en production sans #5215.
Créations, imports et valeurs restent annuels, et l'agrégation reste désactivée.
Des validations API et des contraintes SQL imposent cette limite.

Le [guide des livraisons](periodicite-releases.md) décrit le périmètre et les
validations de chaque branche. Le SQL de bascule et les applications compatibles
se déploient dans la même fenêtre de maintenance. Le frontend reste annuel.

## Déployer et valider la préparation backend — #5366

Après validation des réparations et du schéma compatible #5220, déployer #5366
selon la procédure applicative habituelle. Cette étape ne contient aucune migration SQL.
Vérifier la création, la modification et la suppression des indicateurs personnalisés,
leurs liens, la lecture du catalogue et des sources, ainsi que les valeurs annuelles.
Les dates historiques et les anciens producteurs restent compatibles. En cas d'échec,
redéployer la version applicative précédente, sans revert SQL.

Attendre la validation de #5366 avant de programmer la maintenance de #5367.
Après fusion, rebaser #5367 sur le commit effectivement fusionné dans `main`.
Les étapes suivantes s'exécutent depuis le checkout de #5367 ; ses migrations,
tâches et cibles de validation ne font pas partie du checkout de #5366.

## Préparer la maintenance — #5367

Les réparations et le schéma compatible de #5220 jusqu'à
`@indicateur-periodicite-schema`, puis la préparation backend #5366, doivent être
appliqués et validés avant cette livraison. La préparation backend n'exige aucune
migration supplémentaire et ne normalise aucune date. Arrêter tous les producteurs
avant la bascule ci-dessous, y compris les instances exécutant cette préparation.
La correction SQL de formule `correct-formule-cae-2-a` fait partie de #5367.
Elle remplace le jeton `cae_2.lpcaet` par `cae_2.l_pcaet` sans recalculer les
observations. Les recalculs reprennent seulement avec le backend protecteur.
Les protections des saisies manuelles et de provenance font partie de #5367 :
un calcul automatique ne remplace pas une saisie, y compris sous métadonnée PCAET ;
un appel REST utilisateur ne peut pas fournir de `metadonneeId`. Les imports
privilégiés et le parcours PCAET dédié conservent leurs autorisations propres.
La migration `indicateur/reserver-ecriture-valeurs-backend` retire les écritures
directes de `PUBLIC`, `anon` et `authenticated`, tout en conservant les lectures
et les imports `service_role`. Elle doit tourner avec le propriétaire de la table ;
un héritage de droits inattendu bloque la migration. Ses ACL initiales sont
archivées pour un retour arrière exact. La restauration de données conserve
les ACL et cette archive propres à la cible.

La [répétition historique du déploiement groupé du 29 septembre](https://github.com/incubateur-ademe/territoires-en-transitions/blob/007fe364fd1650b8b145058e15e13feed27349ef/data_layer/periodicite-validation-2026-09-29.md) documente
les protections, les tests et leurs limites ; elle ne remplace pas les contrôles
sur une sauvegarde à jour avant la maintenance.

- Choisir la cible et le commit de `split/periodicite-annual-cutover` à livrer. Préparer les versions correspondantes du backend,
  du frontend et de `tools`, ainsi que les versions précédentes pour une reprise.
- Sur une copie récente de la production, exécuter le contrôle des dates ci-dessous, résoudre
  les collisions, puis répéter la migration et la restauration du **schéma et des données**.
  Utiliser cette répétition pour fixer la durée de la maintenance et la procédure de reprise.
- Mettre à jour l'automatisation Google Sheets du catalogue : authentifier
  `GET /indicateur-definitions/verify`, remplacer l'ancien import anonyme par
  `POST /indicateur-definitions/import` authentifié et lire la réponse
  `status` / `definitions` / `reconciliation`. Ces appels externes doivent être prêts pour la reprise.

### Contrôler les dates avant migration

Le [script de contrôle](scripts/check-indicateur-periodicite.sql) est livré dès #5220.
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
   Vérifier la cellule `valeurCalcule` de `cae_2.a` dans le catalogue Google Sheets
   pour que la référence erronée `cae_2.lpcaet` ne soit pas réintroduite.
3. Depuis la racine du commit préparé, exécuter
   `sqitch deploy --mode all --verify --target <cible> @indicateur-periodicite-annuelle`.
   Les migrations revérifient les données sous verrou et refusent les conflits. Chaque changement SQL
   est transactionnel ; l'ensemble ne forme pas une transaction unique. Les tags intermédiaires
   ordonnent les migrations et leurs tests, sans déploiement applicatif entre ces étapes.
4. Déployer le backend et `tools` compatibles, puis le frontend annuel du même commit.
   Avant de rouvrir, vérifier lecture et écriture annuelles (y compris `0`, `NULL` et
   commentaires), modification par identifiant, imports, calculs, PCAET, score indicatif,
   graphiques et exports existants. Une date historique annuelle est rattachée au
   1er janvier de son année, même si le client transmet `periodicite: annuelle`.
   Vérifier que les créations/imports non annuels sont refusés par l’API et que les
   écritures SQL privilégiées restent limitées à l’annuel. L’API n’expose aucun réglage
   d’agrégation.
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

L’état de restauration est `annual`. Une sauvegarde `legacy`, `schema`, `expand` ou activée
(`contract`) ne peut pas être restaurée avec le script de restauration de données
sur cette livraison. Utiliser une sauvegarde du même état ou une reprise complète
cohérente du schéma, des données et des applications.

## En cas d'échec

Avant la réouverture, garder les accès fermés : corriger et reprendre le déploiement, ou
revenir à l'état sauvegardé à l'étape 2 avec les anciennes versions applicatives.

La reprise de production — schéma et données — s'appuie sur les sauvegardes managées de
Supabase (fenêtre de 7 jours, restauration déclenchée par l'opérateur depuis la plateforme
Supabase), complétées par les sauvegardes décrites dans
[l'ADR 0016](../doc/adr/0016-strategie-backup-database.md). Le script
[backup/restore.sh](backup/restore.sh) restaure uniquement des données (`--data-only`) vers
local/staging/preprod : il ne recrée pas le schéma et ne cible pas la production, il ne
constitue donc pas à lui seul une procédure de reprise de production. Valider une restauration
complète (schéma, données et versions applicatives) sur un environnement de préproduction
avant la fenêtre de maintenance.

Après la réouverture, préserver les nouvelles écritures et privilégier une correction en avant.
Restaurer l'ancienne sauvegarde ou supprimer les colonnes de périodicité pourrait perdre des données.

La [validation du découpage du 30 septembre](https://github.com/incubateur-ademe/territoires-en-transitions/blob/007fe364fd1650b8b145058e15e13feed27349ef/data_layer/periodicite-validation-2026-09-30.md)
consigne les contrôles sur fixtures synthétiques et leurs limites.

## Vérifications locales

- `make db-migrate` applique les migrations avec vérification sur la base locale configurée.
- `make db-init` initialise les services, migrations, référentiels et données de test locaux.
- `make db-test-deployment-guards` teste les contrôles de connexion et de restauration.
- `make db-test-periodicite-migration` teste migration, concurrence, restauration et retour arrière.
  `PERIODICITE_MIGRATION_TEST_DATABASE_URL` doit désigner une base locale jetable nommée
  `periodicite_migration_lifecycle_test_*`, initialisée au schéma précédant les migrations de périodicité.

La [validation du découpage du 6 octobre 2026](periodicite-releases.md#vérification-du-découpage-du-6-octobre-2026)
distingue les contrôles réellement exécutés sur chaque branche des vérifications
de migration et de production restant à effectuer.

## Livraisons suivantes

Après validation de #5367, l'activation #5215 ouvre les autres cadences dans une
maintenance distincte. Valider cette activation avant #5312, qui migre les six
observations de Margny au mensuel. Contrôler ces six observations après migration.

Le nettoyage #5296 attend la validation de #5312 et la vérification de la restauration
d'une sauvegarde complète du schéma et des données. Il supprime les archives et
outils temporaires et ferme leur chemin de retour arrière. Le
[guide des livraisons](periodicite-releases.md) conserve cet ordre et ces prérequis.
