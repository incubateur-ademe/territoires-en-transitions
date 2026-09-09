# Périodicité des indicateurs — maintenance planifiée

L'[ADR 0018](../doc/adr/0018-periodicite-des-indicateurs.md) retient **une seule bascule par
environnement** : arrêter les écritures, migrer la base, déployer les applications, vérifier,
puis rouvrir. Le suivi mensuel devient disponible pour toutes les collectivités à la réouverture.

**État actuel : cette procédure est la cible de livraison.** Cette branche fournit encore le
schéma intermédiaire nommé `expand` ; le schéma final et les applications et scripts adaptés à ce
nouveau schéma sont répartis dans les PR suivantes. Elle ne constitue pas, seule, la version à déployer
pour ouvrir le mensuel.

## Avant la maintenance

- Préparer et tester ensemble les migrations et les versions compatibles du backend, du frontend,
  des outils et des imports, y compris les accès SQL directs.
- Sur une copie récente, exécuter le [contrôle des dates](scripts/check-indicateur-periodicite.sql)
  ci-dessous et résoudre les collisions : deux anciennes valeurs d'une même série peuvent correspondre
  à la même année. Ne pas les fusionner automatiquement. Répéter la migration et la restauration
  pour mesurer la durée de la fenêtre.
- Identifier la cible, les versions à déployer et les versions précédentes. Préparer une sauvegarde
  et une procédure de restauration couvrant **le schéma et les données**, vérifiée pendant la répétition.

Depuis la racine du dépôt, avec `PERIODICITE_CHECK_DATABASE_URL` pointant vers cette copie et un
compte autorisé à lire toutes les valeurs :

```sh
psql --no-psqlrc --dbname="${PERIODICITE_CHECK_DATABASE_URL:?URL de la copie requise}" \
  --file=data_layer/scripts/check-indicateur-periodicite.sql
```

Le script est en lecture seule et fonctionne avant comme après l'ajout de `periodicite`.
Il affiche les identifiants, sources (`metadonnee_id`), dates d'origine et dates canoniques :
`a_normaliser` signale une date que la migration peut normaliser ; `conflit`, `date_invalide` et
`periodicite_inconnue` nécessitent une correction préalable. Un rapport vide ne détecte aucune anomalie
de date ou collision. Le code de sortie indique seulement si le script s'est exécuté sans erreur SQL,
pas si les données sont prêtes ; lire le rapport. Ce contrôle ne remplace pas les vérifications de
migration sous verrou ni les tests applicatifs.

## Pendant la maintenance

1. Fermer les accès applicatifs, arrêter les anciennes instances et suspendre imports, tâches
   planifiées et autres écritures directes. Attendre la fin des opérations en cours. Suspendre
   aussi les sauvegardes et restaurations automatiques de cette cible pendant l'intervention.
2. Prendre la sauvegarde de reprise après l'arrêt des écritures et vérifier qu'elle est exploitable.
3. Exécuter les migrations Sqitch vérifiées de la version préparée jusqu'au schéma final. Elles
   revérifient les données sous verrou et s'arrêtent en cas de conflit. Chaque changement SQL
   est transactionnel ; plusieurs changements ne forment pas une transaction unique.
4. Déployer toutes les versions compatibles. Vérifier lecture et écriture annuelles, saisie mensuelle,
   coexistence de janvier et de l'année correspondante, calculs, imports et reporting.
5. Si les vérifications passent, rouvrir les accès et reprendre les tâches et imports compatibles.
   Reprendre les sauvegardes et les restaurations dont la source et la cible ont des schémas compatibles.

## En cas d'échec

Garder les accès fermés. Avant la réouverture, corriger et reprendre le déploiement, ou restaurer
le schéma et les données de l'étape 2 avec les versions applicatives précédentes.
`backup/restore.sh` est un outil de restauration de données vers local/staging/preprod ;
il ne remplace pas cette procédure de reprise de production avec restauration du schéma.

Après la réouverture, préserver les nouvelles écritures : privilégier une correction en avant.
Restaurer l'ancienne sauvegarde ou supprimer les colonnes de périodicité pourrait perdre des données.

## Refactoring restant avant la livraison

- Réunir les changements de schéma actuels et finaux dans le chemin de migration ordinaire,
  avec les adaptations des lecteurs et des écritures `ON CONFLICT`.
- Installer directement les contraintes finales ; garder le défaut annuel pour les anciens contrats.
  Remplacer la normalisation transitoire par le contrôle et la normalisation de migration.
- Retirer les commandes et workflows de phases, ainsi que les branches de restauration et de
  rollback propres à leur coexistence. Conserver les contrôles de compatibilité des sauvegardes.
- Adapter les tests au cycle migration, vérification et reprise de la version complète.

En attendant ce refactoring, `make db-migrate` s'arrête encore à `@indicateur-periodicite-expand`.
Les tests disponibles sont `make db-test-deployment-guards` et `make db-test-periodicite-migration` ;
ce dernier utilise une base locale jetable `periodicite_migration_lifecycle_test_*` préparée avant
les migrations, indiquée par `PERIODICITE_MIGRATION_TEST_DATABASE_URL`.
