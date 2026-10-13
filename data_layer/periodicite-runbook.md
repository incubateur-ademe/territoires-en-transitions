# Périodicité des indicateurs : déploiement

État au 12 octobre 2026 : #5220, #5292, #5366 et **#5378 sont fusionnées et
déployées**. Le socle annuel de #5378 est inclus dans `main` ; sa migration
`indicateur/remplacer-catalogue-periodicites-par-contraintes` est déjà appliquée.
La [PR de corrections annuelles #5430](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5430) est également fusionnée dans `main`.
La préparation annuelle restante (#5433) conserve
ce contrat et ne demande aucune migration. **#5215** vient ensuite et ouvre les
trois autres cadences.

La décision du 24 septembre 2026 impose une même périodicité pour la déclaration
et la visualisation, sans agrégation. Le choix est possible à la création d'un
indicateur personnalisé et ne peut plus être modifié ensuite.

La chaîne de revue restante est :

- `main` → #5433 (préparation annuelle restante) → #5215 (activation).
- #5215 → #5418 (import atomique) → #5379 (file durable de recalcul).
- #5215 → #5394 (nouvelle saisie) → #5312 (Margny) → #5296 (nettoyage final).
- `main` → #5417 (verrous SQL) et `main` → #5416 (verrou du score), indépendantes
  de l'activation. Le prérequis backend de #5417 est satisfait par #5378.

Chaque étape peut rester seule en production après ses prérequis. #5296 reste
la dernière livraison, après la période d'observation et la fermeture de la
fenêtre de retour arrière. Les branches de revue ne sont pas des versions à
redéployer telles quelles par-dessus les autres livraisons.

| PR restante | Changement | Migration Sqitch |
| --- | --- | --- |
| #5433 | Score, publication GES, fixtures et corrections annuelles restantes | Aucune |
| #5215 | Activation des quatre périodicités | `indicateur/periodicite_activation` |
| #5418 | Import atomique du catalogue | Aucune |
| #5379 | File durable de recalcul | `indicateur/reconciliation_formules` |
| #5394 | Saisie commune des résultats et objectifs | Aucune |
| #5312 | Six observations de Margny remises au mensuel | `indicateur/margny_indicateurs_mensuels` |
| #5417 | Verrous SQL du graphe de calcul | `indicateur/verrouiller-graphe-calcul-indicateur` |
| #5416 | Verrou de sélection du score | Aucune |
| #5296 | Suppression des archives ; fin du retour arrière Sqitch | `indicateur/periodicite_nettoyage` |

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
2. Pour #5215, prévoir une fenêtre de maintenance : fermer le trafic
   applicatif, arrêter les imports et tâches, puis attendre les transactions en
   cours. Les workflows `cd-backend`, `cd-app`, `cd-site` et `cd-tools` sont
   indépendants et n’orchestrent ni cette maintenance ni les migrations.
3. Sauvegarder le schéma, les données et le registre Sqitch ; conserver les versions
   applicatives précédentes. Relever le dernier changement appliqué avec
   `sqitch status --target <cible>` pour pouvoir revenir à cet état.
4. Si la livraison comporte une migration, depuis la racine du dépôt, l'appliquer jusqu'à celle indiquée
   pour la PR :

   ```sh
   sqitch deploy --mode change --verify --target <cible> --to-change <migration>
   ```

   Remplacer `<cible>` par la cible Sqitch et `<migration>` par le nom de migration
   indiqué dans le tableau.

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

## 1. Contrat annuel — #5378 (déjà déployé)

Cette étape est terminée. La procédure ci-dessous reste une référence pour
comprendre le socle et son retour arrière ; elle ne doit pas être rejouée pour
livrer les PR restantes.

Arrêter toutes les écritures, imports et tâches. Appliquer la migration indiquée
dans le tableau, puis déployer le backend, l'application, le site et `tools`.
La migration remplace le catalogue SQL des périodicités et ses clés
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

## 2. Corrections des parcours annuels — #5430, déploiement autonome

Cette livraison extrait de #5215 les corrections indépendantes des nouvelles
cadences : sauvegardes successives dans les cellules, refus des nombres non
finis, rafraîchissement des valeurs et scores après une écriture ou suppression,
et respect de la lecture seule dans le diagnostic PCAET. La lecture des dates
historiques reste inchangée ; les nouveaux contrôles stricts de périodes sont
conservés dans #5215. Les cellules et leurs identifiants utilisent le service
`IndicateurPeriodes` du socle déjà déployé. `containing` conserve la lecture des
observations annuelles datées en cours d'année. Les années restent aux frontières
PCAET (horizons réglementaires et API annuelle), sans conversion des données.
L'adaptateur PCAET porte aussi la règle des années facultatives et des lignes
non applicables ; la cellule reçoit uniquement le booléen `isRequired`.
Le tableau reçoit des colonnes de périodes et des callbacks d'écriture. Les
mutations PCAET, la conversion vers l'année de l'API et l'en-tête d'année de
référence restent dans la couche PCAET.
L'éditeur partagé attend la sauvegarde avant de se fermer : une saisie invalide
ou un échec laisse le brouillon ouvert. Échap permet de l'annuler, même pendant
une requête ; sa réponse tardive ne ferme pas une nouvelle édition.

**Déployer uniquement l'application frontend** à partir du commit intégré à
`main`. Le backend, le moteur de périodes, les schémas d'entrée des API, les
contraintes SQL, le plan Sqitch et les données restent ceux du socle annuel.
Aucune migration et aucune activation de cadence ne sont nécessaires. Cette
version peut rester seule en production sans livrer #5215.

Contrôler avant production puis après déploiement :

- Déclaration, saisie de zéro, commentaires et suppression d'une année ;
  rafraîchissement des valeurs et du score sans recharger la page.
- Grille PCAET : saisies successives pendant un enregistrement, échec suivi
  d'une nouvelle tentative sans fermeture du champ, annulation par Échap pendant
  une requête, année de référence et consultation en lecture seule.
- Refus des créations et imports mensuels, trimestriels et semestriels par les
  API annuelles existantes ; les contraintes SQL annuelles restent en place.

En cas de régression, redéployer la version précédente de l'application. Il n'y
a aucun revert Sqitch ni aucune conversion de données à effectuer. Les saisies
annuelles restent lisibles par le backend et le frontend précédents.

## 2 bis. Préparation annuelle restante — #5433

Cette livraison extrait les adaptations annuelles du score indicatif et de la
publication GES, les fixtures et stories annuelles, les remplacements de littéraux
par l’enum existante et les corrections indépendantes de
l’activation. Une valeur zéro reste une observation pour la confidentialité et
nécessite une confirmation avant suppression. L’édition d’un indicateur du
catalogue ne transmet plus les thématiques réservées aux indicateurs personnels.

Les libellés du score conservent la lecture des snapshots annuels historiques,
y compris lorsque leur date n’est pas le 1er janvier. La publication GES conserve
également la lecture des dates annuelles historiques. Ces lecteurs utilisent
l’adaptateur historique ; les validations d’écriture ne sont pas assouplies.

Aucune migration, modification d’API ou ouverture de cadence : le moteur de
périodes et les contraintes SQL restent annuels. Les modifications des tables
Drizzle ne font que réutiliser l’enum existante pour la valeur par défaut annuelle.
Déployer l’application et le site ; cette étape peut rester seule en production.
Le retour arrière consiste à redéployer leurs versions précédentes.

Vérifier les libellés et snapshots du score, la publication GES, la confidentialité
et la suppression d’une valeur zéro. Les stratégies de période, sélecteurs de
cadence, adaptations aux séries mixtes, validations API et migrations restent
dans #5215. Les garde-fous PCAET et les restrictions de saisie annuelle face aux
nouvelles cadences y restent aussi.

## 3. Activation des cadences — #5215

Arrêter toutes les écritures, imports et tâches, ainsi que les sauvegardes et
restaurations automatiques. Appliquer `indicateur/periodicite_activation`, puis
déployer le backend, l'application, le site et `tools`.

Contrôler :

- Création, saisie, commentaire, import et recalcul pour les quatre cadences.
- Choix de la périodicité à la création d’un indicateur personnalisé, puis refus
  de toute modification, même sans valeur enregistrée.
- Même périodicité pour la déclaration et la visualisation, sans sélecteur de
  restitution ni agrégation temporelle. Les sources et versions de données
  restent séparées et conservent leurs périodes d’origine.
- Graphiques, exports, PCAET, trajectoires, score indicatif et fiche publique du site.

Avant le retour au socle annuel, vérifier que les définitions et valeurs sont
uniquement annuelles ; interrompre la procédure si des lignes non annuelles existent.
Ce retour annule **`indicateur/periodicite_activation` (#5215)** : son script de
revert rétablit les contraintes annuelles et échoue atomiquement si une autre
cadence est utilisée. Il recrée les anciennes colonnes d’agrégation à NULL.
**`indicateur/remplacer-catalogue-periodicites-par-contraintes` reste appliquée** :
c'est l'état cible, pas le script de revert à exécuter. Le propre revert de ce
socle restaure le catalogue des quatre cadences et ses clés étrangères ; il ne
constitue pas le garde-fou annuel.
Après restauration des données, les scripts reconstruisent les dépendances des formules.

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
