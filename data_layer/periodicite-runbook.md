# Périodicité des indicateurs : déploiement

Prérequis : #5220, #5292 et #5366 déployées. Valider chaque étape avant la suivante.
Chaque étape doit pouvoir rester seule en production après ses prérequis, sans
attendre une PR suivante. La livraison annuelle (#5378) conserve le fonctionnement
annuel ; #5215 suffit à livrer les quatre cadences. Les branches secondaires ne
sont pas des versions applicatives à redéployer telles quelles par-dessus les autres.

La décision du 24 septembre 2026 impose une même périodicité pour la déclaration
et la visualisation, sans agrégation. Le choix est possible à la création d'un
indicateur personnalisé et ne peut plus être modifié ensuite.

Le chemin prioritaire est **#5378 → #5215** : socle de stockage et calcul,
puis activation de la saisie et de la visualisation par période.

Les autres PR peuvent être livrées ensuite : #5418 (refactor et atomicité de
l'import), #5379 (file durable de recalcul), #5394 (nouvelle saisie), #5312
(réparation de Margny), #5417 (protections SQL) et #5416 (verrou du score).
#5296 ferme le retour arrière et reste la dernière étape.

| PR | Changement | Tag Sqitch |
| --- | --- | --- |
| #5378 | Contrat annuel pour les saisies, imports et calculs | `@indicateur-periodicite-annuelle` |
| #5215 | Activation des périodicités communes à la déclaration et à l'affichage | `@indicateur-periodicite-activee` |
| #5379 | File durable de recalcul, secondaire à l'activation | `@indicateur-reconciliation-formules` |
| #5312 | Six observations de Margny remises au mensuel | `@indicateur-margny-mensuel` |
| #5296 | Suppression des archives ; fin du retour arrière Sqitch | `@indicateur-periodicite-nettoyee` |

## Pour chaque déploiement

1. Utiliser un **commit d’intégration qui contient aussi toutes les PR déjà en
   production**, avec une CI réussie sur ce commit. Une branche secondaire basée
   avant une autre livraison ne doit pas retirer cette livraison au déploiement.
   Vérifier que le commit actuellement en production est un ancêtre du candidat :

   ```sh
   git merge-base --is-ancestor <commit-production> <commit-candidat>
   ```

   Tester d’abord ce candidat et ses migrations sur une copie récente et isolée
   de production, puis en préproduction. La CI utilise des données de test : elle
   ne prouve pas que les données réelles passent tous les contrôles de migration.
2. Pour #5378 et #5215, prévoir une fenêtre de maintenance : fermer le trafic
   applicatif, arrêter les imports et tâches, puis attendre les transactions en
   cours. Les workflows `cd-backend`, `cd-app`, `cd-site` et `cd-tools` sont
   indépendants et n’orchestrent ni cette maintenance ni les migrations.
3. Sauvegarder le schéma, les données et le registre Sqitch ; conserver les versions
   applicatives précédentes. Relever le dernier changement appliqué avec
   `sqitch status --target <cible>` pour pouvoir revenir à cet état.
4. Depuis la racine du dépôt, appliquer les migrations jusqu'au tag de la PR :

   ```sh
   sqitch deploy --mode change --verify --target <cible> <tag>
   ```

   Remplacer `<cible>` par la cible Sqitch et `<tag>` par le tag du tableau.

5. Déployer les services indiqués, effectuer les contrôles de l'étape, puis
   rouvrir le trafic et relancer les tâches. Pour #5215, attendre que tous les
   services utilisent la version activée avant toute création non annuelle ;
   faire recharger les sessions de l’application restées ouvertes.

Ne pas poursuivre une livraison sur une CI en échec ou une migration refusée.
Après #5215, un retour au backend annuel exige aussi le retour au schéma annuel,
qui refuse les définitions et observations non annuelles. Ne pas supprimer ces
nouvelles données pour forcer un rollback : corriger en avant ou appliquer le
plan de reprise avec récupération des saisies intervenues depuis la sauvegarde.
#5296 supprime les archives et ferme explicitement le retour arrière Sqitch.

## 1. Contrat annuel — #5378

Arrêter toutes les écritures, imports et tâches. Déployer le backend, l'application,
le site et `tools`. Le tag remplace le catalogue SQL des périodicités et ses clés
étrangères par des contraintes `CHECK (periodicite = 'annuelle')`, sans changer
les observations ni les droits d'écriture. Le moteur de périodes reste annuel ;
les stratégies des autres cadences et l'élargissement des `CHECK` sont livrés
dans #5215. Les restrictions annuelles déjà livrées par #5366 restent en place.
Le revert restaure le catalogue et les clés étrangères.

Contrôler :

- Une saisie annuelle avec zéro, valeur absente et commentaire ; un import et un recalcul.
- PCAET, score indicatif, graphiques et exports.
- Le refus des créations non annuelles. Les droits PostgREST restent inchangés.

Le catalogue conserve `GET /indicateur-definitions/verify` et
`GET /indicateur-definitions/import`, accessibles avec le jeton anonyme utilisé
par Google Sheets. Les données viennent uniquement du tableur configuré. Lire `definitions` et
`identifiantsRecalcules` dans la réponse. Comme sur `main`, le catalogue est
enregistré avant le recalcul : un échec de recalcul ne l'annule pas. Suspendre les
imports et reprendre le recalcul avant de publier une autre version. Le rollback
commun du catalogue et des valeurs sera livré séparément dans #5418.

## Verrous SQL — #5417

Déployer le backend #5378 avant la migration
`indicateur/verrouiller-graphe-calcul-indicateur`. Suspendre les écritures le temps
d’installer les triggers. Les écritures directes des intégrations existantes
conservent leurs droits et prennent désormais le verrou du graphe de calcul.
Tester leurs imports sur la version candidate en préproduction avant réouverture.

Le retrait des droits PostgREST est différé : il casserait les intégrations qui
écrivent encore avec un compte utilisateur. Elles devront migrer vers les routes
backend avant une éventuelle restriction. Ces verrous ne déclenchent pas de
recalcul automatique pour une écriture SQL directe ; ce comportement reste à la
charge de l’intégration, comme avant cette PR.

## En cas d'échec

Garder les écritures fermées. Corriger le déploiement ou revenir au dernier changement
Sqitch relevé avant celui-ci, dans les limites indiquées pour l'étape, puis redéployer
les versions applicatives précédentes. Après réouverture, préserver les nouvelles
saisies et privilégier une correction sur la version déployée.

`backup/restore.sh` restaure des données en local, staging ou préproduction dans un
schéma déjà migré. Utiliser le script du commit correspondant à l'état sauvegardé
et vérifier sa compatibilité avec la cible. Pour une reprise de production,
restaurer ensemble schéma, données, registre Sqitch et versions applicatives :
[procédure de sauvegarde et restauration](../doc/adr/0016-strategie-backup-database.md).
