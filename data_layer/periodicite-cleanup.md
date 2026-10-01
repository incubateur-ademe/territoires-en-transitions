# Nettoyage après activation des périodicités

La PR #5296 est la sixième livraison et suit #5312,
la [migration mensuelle de Margny](margny-monthly-migration.md).
Elle retire les objets et outils temporaires après validation des déploiements.
Elle ne réécrit aucune observation ni définition ; toutes les données métier,
les droits actuels et les recalculs en attente sont conservés.

## Prérequis de production

Ne fusionner et déployer cette PR qu'après validation des cinq livraisons
précédentes : saisies, imports, recalculs, autorisations, agrégations, exports et
consommateurs annuels. Le responsable du déploiement confirme la fermeture de la
fenêtre de retour arrière. Cette décision est distincte du simple déploiement de
l'activation.

Conserver une sauvegarde **complète** du schéma et des données avant nettoyage,
avec les versions applicatives et l'historique Sqitch correspondants. Vérifier sa
restauration sur une base jetable. Elle doit contenir notamment :

- `migration.indicateur_valeur_periodicite_audit` : anciennes dates normalisées ;
- `private.indicateur_valeur_write_acl` : droits directs antérieurs ;
- `private.indicateur_valeur_date_repair` : originaux des réparations et du retour arrière ciblé de Margny ;
- `private.indicateur_reconciliation_formule` : recalculs en attente.

La migration ne peut pas prouver l'existence d'une sauvegarde externe : cette
vérification et sa conservation sont des prérequis opératoires obligatoires.

## Déploiement

1. Suspendre les écritures, imports, tâches et sauvegardes/restaurations automatiques.
   Attendre les transactions en cours et prendre la sauvegarde finale de reprise.
2. Déployer et vérifier jusqu'à `@indicateur-periodicite-nettoyee`. La migration
   prend le verrou du graphe puis des définitions et valeurs, avec un
   `lock_timeout` de cinq secondes. Un échec annule le nettoyage entier.
3. Livrer les scripts de restauration de cette PR. Vérifier une saisie annuelle
   et mensuelle, un import et la reprise des recalculs avant réouverture.
4. Prendre une nouvelle sauvegarde de l'état nettoyé et en tester la restauration.
   Conserver séparément la sauvegarde prise avant nettoyage ; ne pas l'écraser.

## Objets retirés et conservés

| Élément | Sort après nettoyage |
| --- | --- |
| Audit de normalisation, son déclencheur et sa fonction d'entretien | Retirés de la base ; historique disponible dans la sauvegarde préalable |
| Archive des anciennes ACL | Retirée ; droits actuels inchangés |
| Fonction de garde des anciens reverts | Retirée ; le revert du nettoyage bloque désormais tout retour dans la pile |
| Deux précontrôles SQL et trois documents ponctuels de préparation | Supprimés ; les contraintes finales et tests des vrais scripts Sqitch couvrent le contrat |
| Archive des neuf réparations | Retirée après validation de la migration métier distincte de Margny |
| File de réconciliation et projection des dépendances | Conservées : nécessaires aux recalculs et restaurations |
| Adaptateurs annuels des API, PCAET, trajectoires, scores et site | Conservés : contrats métier permanents de la phase 1 |
| Migrations Sqitch et tests de transition | Conservés pour installations neuves, vérifications et répétitions des anciennes livraisons |
| Chemins et groupes de restauration des anciennes phases | Retirés des scripts actuels ; utiliser le commit correspondant pour une sauvegarde historique |

## Reprise

Le nettoyage est volontairement irréversible par `sqitch revert` : recréer des
tables vides ne restituerait ni les dates originales ni les anciens droits.
Son revert échoue avant toute modification, y compris si les données sont encore
annuelles. Privilégier une correction en avant après réouverture.

Les scripts actuels restaurent uniquement l'état final nettoyé. Ils vérifient les
marqueurs d'activation, de migration de Margny et de nettoyage dans les registres
de la cible et du snapshot,
les vrais contrats SQL Sqitch et la présence de la file de recalcul avant tout
`TRUNCATE`. Les observations mensuelles sont chargées avec les valeurs normales ;
la reconstruction transactionnelle du graphe préserve la file de recalcul.
Une sauvegarde antérieure n'est pas
injectable directement dans cet état, et une sauvegarde nettoyée ne convient pas
aux anciennes phases. Pour revenir à une ancienne livraison, restaurer ensemble
son schéma, ses données, son registre Sqitch et ses applications dans un
environnement cohérent ; préserver les écritures postérieures selon le plan de
reprise. `backup/restore.sh` demeure destiné à local/staging/preprod.

## Validation

`make db-test-deployment-guards` couvre les marqueurs du schéma final, les erreurs
de lecture/connexion, les contrats SQL et le refus d'une archive sans file durable.
`make db-test-periodicite-migration` parcourt les migrations et leurs retours
arrière, puis le nettoyage : refus avant activation ou avec conflit, conservation
de toutes les observations et définitions, y compris Margny, des tâches et droits,
refus atomique du revert, vérifications historiques et reconstruction des formules.
Utiliser exclusivement une base jetable `periodicite_migration_lifecycle_test_*`
initialisée avant les migrations de périodicité.

Le 1er octobre 2026, les deux étapes ont été testées séparément sur PostgreSQL 15
avec fixtures synthétiques. Les treize contrôles shell, les 92 assertions du
schéma final et le cycle complet passent. Le nettoyage préserve intégralement
les images de toutes les observations et définitions, y compris Margny, les ACL
et la file de recalcul. Un scénario appelle le vrai `restore.sh` avec une archive
sans file durable et vérifie son refus avant lecture des groupes YAML ou
effacement. L'aller-retour réel `pg_dump`/`pg_restore` préserve la file ; la
reconstruction du graphe refuse atomiquement les dépendances incompatibles.

Les vrais scripts Sqitch ont aussi été déployés et vérifiés étape par étape :
Margny, retour arrière ciblé, redéploiement puis nettoyage. Les vérifications
historiques passent après nettoyage sur une installation sans données de Margny.

Ces contrôles ne remplacent pas la répétition sur une sauvegarde de production
récente ni la mesure des verrous sur son volume réel.
