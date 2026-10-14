# Périodicité des indicateurs : déploiement

État au 14 octobre 2026 : les préparations annuelles applicatives (#5481), SQL
(#5488) et reporting (#5489) sont fusionnées dans `main`. Les cinq préparations
ci-dessous restent annuelles et peuvent être déployées sans #5215.

La décision du 24 septembre 2026 impose une même périodicité pour la déclaration
et la visualisation, sans agrégation. Le choix est possible à la création d'un
indicateur personnalisé et ne peut plus être modifié ensuite.

La chaîne de revue restante est :

- `main` → #5463 (restauration) → #5417 (verrous SQL) → #5491 (import atomique).
- #5491 → #5492 (file durable annuelle) → #5493 (métadonnées et saisie annuelle).
- #5493 → #5215 (activation) → #5312 (Margny) → #5296 (nettoyage final).

Chaque étape peut rester seule en production après ses prérequis. #5296 reste
la dernière livraison, après la période d'observation et la fermeture de la
fenêtre de retour arrière. Les branches de revue ne sont pas des versions à
redéployer telles quelles par-dessus les autres livraisons.

| PR restante | Changement | Migration Sqitch |
| --- | --- | --- |
| #5463 | Contrôles de restauration et retour arrière | Aucune |
| #5215 | Activation des quatre périodicités | `indicateur/periodicite_activation` |
| #5491 | Import atomique du catalogue | Aucune |
| #5492 | File durable de recalcul | `indicateur/reconciliation_formules` |
| #5493 | Métadonnées et saisie annuelle | Aucune |
| #5312 | Six observations de Margny remises au mensuel | `indicateur/margny_indicateurs_mensuels` |
| #5417 | Verrous SQL du graphe de calcul | `indicateur/verrouiller-graphe-calcul-indicateur` |
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
commun du catalogue et des valeurs sera livré séparément dans #5491.

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

## 3. Validation SQL des formules — `fix/indicateurs-formula-validation`

Cette préparation se déploie avec l’application annuelle. Appliquer
`indicateur/dependances_formules`, puis `indicateur/periodicite_formules` : les
références sont lues directement dans les expressions, sans table dérivée ni
reconstruction après restauration. Les références absentes et les cadences
incompatibles sont refusées, y compris lors d’une écriture SQL directe.
Les restrictions annuelles, les index et le reporting restent inchangés.

Le dump de production du **14 octobre 2026 à 00:44:26 UTC** contient 26 991
définitions et 4 771 525 valeurs, toutes annuelles et cohérentes. Les 78 formules
ont 295 dépendances existantes de même cadence : aucune réparation n’est requise.
Le contrôle de #5488 a restauré les 26 991 définitions depuis ce dump dans une
base isolée : les 78 formules et leurs 295 dépendances correspondent au parseur
applicatif. Les sept fonctions de référence sont couvertes, y compris `est_suivi`,
`progression_snbc` et `reduction`. La recherche des sources ignore la casse, comme
l’extraction des références. Les 36 assertions SQL passent (20 dans
`periodicite-formules.sql`, 16 dans `periodicite-release.sql`) ; les empreintes
des définitions restent identiques après déploiement, tests et retour arrière.

Mesures du 14 octobre 2026 sur ce catalogue restauré : environ 55 ms pour un
contrôle global et 14 s pour un upsert des 896 définitions, dans une transaction
annulée. Les durées sont mesurées avec `clock_timestamp()` sous PostgreSQL 15.14
(`supabase/postgres:15.14.1.159`), dans Docker local sur un poste Linux x86_64,
Intel Core i7-10750H (12 threads), 30 Gio de RAM, sans quota Docker explicite.
Ce coût porte sur les mutations du catalogue, pas sur les saisies de valeurs.
Le test reproduit l’upsert SQL de l’import, sans appeler Google Sheets ni lancer
de recalcul ; ces mesures locales ne prédisent pas la latence en production.
Refaire le contrôle sur une sauvegarde récente avant déploiement.

Vérifier la suite SQL `periodicite-formules.sql` et le maintien du contrat annuel
avec `periodicite-release.sql`. Une transaction peut différer la contrainte pour
renommer une source et mettre à jour ses formules avant le COMMIT.

Le retour arrière annule ces deux migrations sans modifier les données. Les
sauvegardes de cette étape se restaurent dans une cible au même état `formulas` ;
le contrôle vérifie aussi les fonctions et le trigger avant toute troncature.

## 4. Reporting par période — `refactor/indicateurs-period-reporting`

Après la validation SQL des formules, appliquer
`stats/report_indicateur_resultat_periode` avec l’application annuelle. La vue
conserve ses six colonnes historiques et ajoute `periodicite` et `periode_debut`.
Aucune nouvelle cadence n’est autorisée et aucune observation n’est modifiée.

Vérifier les résultats annuels avec `periodicite-release.sql`. Le retour arrière
recrée la vue à six colonnes. Les sauvegardes exigent une cible au même état
`reporting`, dont la vue et les contrôles de formule sont vérifiés avant restauration.

## 5. Activation des cadences — #5215

L’activation des trois cadences reste une livraison distincte, après la préparation
applicative #5481 et les deux préparations SQL ci-dessus. Les gardes annuelles
restent actives jusque-là.

## Verrous SQL — #5417

Le backend requis est déjà déployé avec #5378. Cette migration
`indicateur/verrouiller-graphe-calcul-indicateur` peut être livrée sur `main`,
sans attendre #5215. Suspendre les écritures le temps
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

## Contrôles indépendants de restauration — #5463

Aucune nouvelle migration. Avant toute troncature, le contrôle de restauration
vérifie aussi l’état physique : absence des colonnes de périodicité sur une cible
historique, ou présence des deux contraintes annuelles validées sur une cible
annuelle. Il ne dépend pas d’une ancienne table d’audit temporaire. Le retour
arrière de `periodicite_schema` exige le retrait préalable des verrous SQL de
#5417. Les gardes d’activation restent dans #5215.
