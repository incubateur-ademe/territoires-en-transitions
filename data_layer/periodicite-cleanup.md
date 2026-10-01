# Nettoyage après activation des périodicités

La PR #5296 est la cinquième livraison et suit #5312,
la [migration mensuelle de Margny](margny-monthly-migration.md).
Elle retire les objets et outils temporaires après validation des déploiements.
Elle ne réécrit aucune observation ni définition ; toutes les données métier,
les droits actuels et les recalculs en attente sont conservés.

## Prérequis de production

Ne fusionner et déployer cette PR qu'après validation des quatre livraisons
précédentes : saisies, imports, recalculs, autorisations, visualisation à la
périodicité de déclaration, exports et consommateurs annuels. La périodicité reste
immuable après création et aucune agrégation temporelle n'est proposée,
conformément à la décision du 24 septembre 2026.
Le responsable du déploiement confirme la fermeture de la
fenêtre de retour arrière. Cette décision est distincte du simple déploiement de
l'activation.

Conserver une sauvegarde **complète** du schéma et des données avant nettoyage,
avec les versions applicatives et l'historique Sqitch correspondants. Vérifier sa
restauration sur une base jetable. Elle doit contenir notamment :

- `private.indicateur_valeur_date_repair` : originaux des réparations et du retour arrière ciblé de Margny ;
- `private.indicateur_reconciliation_formule` : recalculs en attente, si #5379 est déployée.

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

| Élément                                                              | Sort après nettoyage                                                                          |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Ancien contrôle préalable des dates et documentation des réparations | Supprimés après validation des livraisons                                                     |
| Archive des neuf réparations                                         | Retirée après validation de la migration métier distincte de Margny                           |
| File de réconciliation et projection des dépendances                 | Conservées : nécessaires aux recalculs et restaurations                                       |
| Adaptateurs annuels des API, PCAET, trajectoires, scores et site     | Conservés : contrats métier permanents de la phase 1                                          |
| Migrations Sqitch et tests de transition                             | Conservés pour installations neuves, vérifications et répétitions des anciennes livraisons    |
| Chemins et groupes de restauration des anciennes phases              | Retirés des scripts actuels ; utiliser le commit correspondant pour une sauvegarde historique |

## Reprise

Le nettoyage est volontairement irréversible par `sqitch revert` : recréer des
tables vides ne restituerait les dates originales.
Son revert échoue avant toute modification, y compris si les données sont encore
annuelles. Privilégier une correction en avant après réouverture.

Les scripts actuels restaurent uniquement l'état final nettoyé. Ils vérifient les
marqueurs de la file de recalcul, d'activation, de migration de Margny et de nettoyage dans les registres
de la cible et du snapshot,
et la présence de la file de recalcul avant tout
`TRUNCATE`. Les observations mensuelles sont chargées avec les valeurs normales ;
la reconstruction transactionnelle du graphe préserve la file de recalcul.
Une sauvegarde antérieure n'est pas
injectable directement dans cet état, et une sauvegarde nettoyée ne convient pas
aux anciennes phases. Pour revenir à une ancienne livraison, restaurer ensemble
son schéma, ses données, son registre Sqitch et ses applications dans un
environnement cohérent ; préserver les écritures postérieures selon le plan de
reprise. `backup/restore.sh` demeure destiné à local/staging/preprod.

## Validation

`make db-test-backup-compatibility` couvre les marqueurs des livraisons, les erreurs
de lecture/connexion et le refus d'une archive sans file durable.
La CI vérifie le schéma final avec Sqitch. Elle ne tente plus de revenir avant
la migration qui ferme explicitement le retour arrière. Les tests de la file de recalcul appartiennent à #5379 ; cette PR ne la
requiert pas et doit être vérifiée aussi sur le commit d’intégration si elle est présente.

Aucun audit de normalisation n'est créé ou supprimé par cette chaîne.
