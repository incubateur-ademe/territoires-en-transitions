# Périodicité des indicateurs — déploiement de #4981

Ce guide accompagne la mise en service des quatre périodicités dans #4981, après fusion de #4961.
Une seule fenêtre de maintenance couvre les migrations et le déploiement des applications
compatibles. À la réouverture, les déclarations mensuelles, trimestrielles et semestrielles sont disponibles pour toutes les collectivités.
#4961 conserve le fonctionnement annuel et peut rester en production jusqu'à cette intervention.

## Préparer la maintenance

- Choisir la cible et le commit de #4981 à livrer. Préparer les versions correspondantes du backend,
  du frontend, de `tools` et de l'import EMT, ainsi que les versions précédentes pour une reprise.
- Sur une copie récente de la production, exécuter le contrôle des dates ci-dessous, résoudre
  les collisions, puis répéter la migration et la restauration du **schéma et des données**.
  Utiliser cette répétition pour fixer la durée de la maintenance et la procédure de reprise.
- Mettre à jour l'automatisation Google Sheets du catalogue : authentifier
  `GET /indicateur-definitions/verify`, remplacer l'ancien import anonyme par
  `POST /indicateur-definitions/import` authentifié et lire la réponse
  `status` / `definitions` / `reconciliation`. Ces appels externes doivent être prêts pour la reprise.

### Contrôler les dates avant migration

Le [script de contrôle](scripts/check-indicateur-periodicite.sql) est livré avec #4981.
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
4. Déployer les versions préparées. Avant de rouvrir, vérifier lecture et écriture annuelles,
   saisies mensuelle, trimestrielle et semestrielle, immuabilité dès création et refus des déclarations
   locales incompatibles. Vérifier les sources externes à leur cadence d'origine, les calculs, les imports
   et le reporting. Configurer explicitement `aggregation_resultat` et `aggregation_objectif`
   (`somme`, `moyenne` ou `derniere_valeur`) pour autoriser les regroupements de consultation ;
   `NULL` n'applique aucune agrégation. Les périodes incomplètes ne produisent pas d'agrégat.
5. Si les vérifications passent, rouvrir les accès et reprendre les imports et tâches compatibles. Dans `tools`, vérifier que
   `drain-indicateur-formula-reconciliations` s'exécute ; l'inclure dans `CRON_JOBS_FILTER` si ce filtre
   est configuré. Reprendre les sauvegardes et les restaurations entre schémas compatibles.

## Règles de consultation

Chaque définition configure séparément `aggregation_resultat` et `aggregation_objectif`
(champs API `aggregationResultat` et `aggregationObjectif`) : `somme`, `moyenne` ou
`derniere_valeur`. La valeur `NULL` signifie qu'aucune règle métier n'est connue : aucun
agrégat n'est produit pour ce champ à une périodicité plus large.

Un regroupement exige toutes les périodes sources du trimestre, semestre ou de l'année civile.
Une observation absente ou `NULL` n'est jamais remplacée par zéro. Cette règle s'applique
également à la dernière valeur : l'affichage ne présente pas une période incomplète comme complète.
Les objectifs suivent leur propre règle explicite, indépendamment des résultats.

Les séries de sources, versions de métadonnées et périodicités différentes restent séparées.
Les commentaires regroupés sont présentés avec les libellés des périodes d'origine ; les
agrégats sont consultables uniquement. La grille de déclaration édite toujours les valeurs
sources. Les mêmes calculs sont partagés par les vues et les graphiques générés par le serveur.
Les exports de valeurs conservent les dates, périodicités et contenus enregistrés.

## En cas d'échec

Avant la réouverture, garder les accès fermés : corriger et reprendre le déploiement, ou restaurer
le schéma et les données sauvegardés à l'étape 2 avec les anciennes versions applicatives.
Le script [backup/restore.sh](backup/restore.sh) restaure des données vers local/staging/preprod ;
il ne constitue pas une procédure de reprise de production couvrant le schéma.

Après la réouverture, préserver les nouvelles écritures et privilégier une correction en avant.
Restaurer l'ancienne sauvegarde ou supprimer les colonnes de périodicité pourrait perdre des données.

## Vérifications locales de #4981

- `make db-migrate` applique les migrations avec vérification sur la base locale configurée.
- `make db-init` initialise les services, migrations, référentiels et données de test locaux.
- `make db-test-deployment-guards` teste les contrôles de connexion et de restauration.
- `make db-test-periodicite-migration` teste migration, concurrence, restauration et retour arrière.
  `PERIODICITE_MIGRATION_TEST_DATABASE_URL` doit désigner une base locale jetable nommée
  `periodicite_migration_lifecycle_test_*`, initialisée au schéma précédant les migrations de périodicité.
