# Périodicité des indicateurs — activation (#5215)

Cette quatrième livraison ouvre les cadences mensuelle, trimestrielle et semestrielle,
la grille, l'agrégation de restitution et les graphiques. La migration
`indicateur/periodicite_activation` retire les trois contraintes annuelles temporaires.
Elle ne reclasse ni ne renormalise les observations.

## Prérequis

Respecter le [découpage des livraisons](periodicite-releases.md) :
réparations #5220, schéma compatible, backend annuel #5214, puis cette activation.
La base doit être déployée et vérifiée jusqu'à `@indicateur-periodicite-annuelle`.
Valider les lectures, écritures, imports et calculs annuels avant de poursuivre.
Les protections des saisies manuelles et de provenance ainsi que la correction de
formule PCAET sont déjà livrées dans #5214 et restent actives.

Préparer une sauvegarde du schéma et des données, les versions applicatives à livrer
et celles de reprise. Répéter la migration et la procédure de restauration sur une
copie récente avant la maintenance. Le [guide de nettoyage final](periodicite-cleanup.md)
regroupe les vérifications locales et leurs limites.

## Déploiement

1. Suspendre les accès en écriture, les imports, les tâches et les anciennes instances.
   Attendre les transactions en cours puis prendre la sauvegarde de reprise. Suspendre
   les restaurations et sauvegardes automatiques pendant l'intervention.
2. Depuis le commit préparé, déployer et vérifier jusqu'à `@indicateur-periodicite-activee`
   avec Sqitch. Garder les écritures fermées jusqu'à la mise en service des applications.
3. Déployer ensemble le backend, le frontend et les tâches compatibles de cette PR.
   Vérifier création et saisie pour les quatre cadences, modification par identifiant,
   valeurs zéro/null, commentaires, imports, recalculs et autorisations. Les dates
   transmises sont rattachées au début canonique de leur période.
4. Vérifier les agrégations configurées par champ, les périodes incomplètes, les
   graphiques et exports. Vérifier également les consommateurs annuels : PCAET,
   trajectoires, score indicatif et fiche publique du site.
5. Rouvrir puis reprendre les imports, les réconciliations de formules et les tâches.
   L'automatisation du catalogue conserve les endpoints authentifiés et les contrats
   de réponse documentés dans #5214.

## Règles de consultation

Chaque définition configure séparément `aggregation_resultat` et `aggregation_objectif`
(champs API `aggregationResultat` et `aggregationObjectif`) : `somme`, `moyenne` ou
`derniere_valeur`. `NULL` signifie qu'aucune règle métier n'est connue : aucun agrégat
n'est produit pour ce champ à une cadence plus large.

Un regroupement exige toutes les périodes sources du trimestre, semestre ou de
l'année civile, y compris pour la dernière valeur. Une observation absente ou `NULL`
n'est jamais remplacée par zéro. Les objectifs suivent leur propre règle explicite.

Les sources, versions de métadonnées et cadences restent séparées. Les commentaires
regroupés portent les libellés des périodes d'origine. Les agrégats sont consultables ;
la grille édite les valeurs sources. Les vues et graphiques serveur partagent les
mêmes calculs. Les exports conservent les dates, périodicités et contenus enregistrés.

## Reprise et restauration

Cette livraison précède le nettoyage : utiliser les scripts de restauration de
son commit avec une sauvegarde du même état. Après la sixième livraison,
`backup/restore.sh` accepte uniquement le schéma final nettoyé. Le script vise
local/staging/preprod ; une reprise de production doit couvrir ensemble schéma,
données et versions applicatives.

Avant la réouverture, corriger et reprendre le déploiement ou restaurer la sauvegarde
cohérente. Le revert d'activation réinstalle les contraintes annuelles et refuse toute
observation ou définition non annuelle, ainsi que toute agrégation configurée.
Après réouverture, préserver les nouvelles écritures et privilégier une correction
en avant ; ne pas forcer un revert qui ferait perdre une information métier.

## Vérifications locales

- `make db-test-deployment-guards` : contrôles de connexion et restauration.
- `make db-test-periodicite-migration` : migrations, concurrence et retours arrière.
  La variable `PERIODICITE_MIGRATION_TEST_DATABASE_URL` doit cibler une base jetable
  `periodicite_migration_lifecycle_test_*`, initialisée avant les migrations de périodicité.
- `data_layer/tests/indicateur/periodicite*.sql` : contrats des périodes, formules,
  collectivités et état activé, sur une base de test initialisée.

## Livraison suivante

Après validation de cette activation en production, déployer la
[migration mensuelle de Margny](margny-monthly-migration.md), puis la
[sixième PR de nettoyage](periodicite-cleanup.md) qui retire les objets de transition.
Elle exige une sauvegarde complète vérifiée et ferme le retour arrière Sqitch.
