# Nettoyage après activation des périodicités

La PR #5296 est la dernière étape de la chaîne restante et suit #5312,
la [migration mensuelle de Margny](margny-monthly-migration.md).
Elle retire les objets et outils temporaires après validation des déploiements.
Elle ne réécrit aucune observation ni définition ; toutes les données métier,
les droits actuels et le recalcul synchrone sont conservés.

## Prérequis de production

Le socle annuel #5378 est déjà déployé. Ne fusionner et déployer cette PR
qu'après validation de l'activation #5215, de la réparation #5312 et des autres
livraisons intégrées : saisies, imports, recalculs, autorisations, visualisation à la
périodicité de déclaration, exports et consommateurs annuels. La périodicité reste
immuable après création et aucune agrégation temporelle n'est proposée,
conformément à la décision du 24 septembre 2026.
Le responsable du déploiement confirme la fermeture de la
fenêtre de retour arrière. Cette décision est distincte du simple déploiement de
l'activation.

Conserver une sauvegarde **complète** du schéma et des données avant nettoyage,
avec les versions applicatives et l'historique Sqitch correspondants. Vérifier sa
restauration sur une base jetable. Elle doit contenir notamment :

- `private.indicateur_valeur_date_repair` : originaux des réparations et du retour arrière ciblé de Margny.

La migration ne peut pas prouver l'existence d'une sauvegarde externe : cette
vérification et sa conservation sont des prérequis opératoires obligatoires.

## Déploiement

1. Suspendre les écritures, imports, tâches et sauvegardes/restaurations automatiques.
   Attendre les transactions en cours et prendre la sauvegarde finale de reprise.
2. Déployer et vérifier jusqu'à `indicateur/periodicite_nettoyage`. La migration
   prend le verrou du graphe puis des définitions et valeurs, avec un
   `lock_timeout` de cinq secondes. Un échec annule le nettoyage entier.
3. Livrer les scripts de restauration de cette PR. Vérifier une saisie annuelle
   et mensuelle, un import et ses recalculs synchrones avant réouverture.
4. Prendre une nouvelle sauvegarde de l'état nettoyé et en tester la restauration.
   Conserver séparément la sauvegarde prise avant nettoyage ; ne pas l'écraser.

## Objets retirés et conservés

| Élément                                                              | Sort après nettoyage                                                                          |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Ancien contrôle préalable des dates et documentation des réparations | Supprimés après validation des livraisons                                                     |
| Archive des neuf réparations                                         | Retirée après validation de la migration métier distincte de Margny                           |
| Adaptateurs annuels des API, PCAET, trajectoires, scores et site     | Conservés : contrats métier permanents de la phase 1                                          |
| Migrations Sqitch et tests de transition                             | Conservés pour installations neuves, vérifications et répétitions des anciennes livraisons    |
| Chemins et groupes de restauration des anciennes phases              | Retirés des scripts actuels ; utiliser le commit correspondant pour une sauvegarde historique |

## Reprise

Le nettoyage est volontairement irréversible par `sqitch revert` : recréer des
tables vides ne restituerait les dates originales.
Son revert échoue avant toute modification, y compris si les données sont encore
annuelles. Privilégier une correction en avant après réouverture.

Les scripts actuels restaurent uniquement l’état final `cleaned`. Ils vérifient
les marqueurs d’activation, de migration de Margny et de nettoyage dans les
registres de la cible et du snapshot, ainsi que le schéma physique, avant tout
`TRUNCATE`. Les observations mensuelles sont chargées avec les valeurs normales.
#5492 reste différée : aucune file de recalcul n’est déployée.
Une sauvegarde antérieure n'est pas
injectable directement dans cet état, et une sauvegarde nettoyée ne convient pas
aux anciennes phases. Pour revenir à une ancienne livraison, restaurer ensemble
son schéma, ses données, son registre Sqitch et ses applications dans un
environnement cohérent ; préserver les écritures postérieures selon le plan de
reprise. `backup/restore.sh` demeure destiné à local/staging/preprod.

## Validation

La CI vérifie le schéma final sans rejouer un retour arrière interdit. Son
contrôle de restauration exige une sauvegarde au même état `cleaned` et exécute
les vérificateurs SQL avant toute troncature.

Aucun audit de normalisation n'est créé ou supprimé par cette chaîne.

Les colonnes inutilisées `aggregation_resultat` et `aggregation_objectif`,
conservées à NULL depuis l’activation, sont également supprimées ici.
Leur suppression ne réinterprète aucune valeur et n’introduit aucune agrégation.
