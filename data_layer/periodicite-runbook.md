# Périodicité des indicateurs : déploiement

État au 14 octobre 2026 : les préparations annuelles applicatives (#5481), SQL
(#5488), reporting (#5489), restauration (#5463), import atomique (#5491),
interface annuelle (#5493) et intégrité annuelle (#5494) sont fusionnées dans `main`.
La prochaine étape de revue est l’activation #5215. Vérifier le déploiement effectif
de ces préparations sur la cible avant activation. #5417 et #5492 restent différées.

La décision du 24 septembre 2026 impose une même périodicité pour la déclaration
et la visualisation, sans agrégation. Le choix est possible à la création d'un
indicateur personnalisé et ne peut plus être modifié ensuite.

La chaîne de revue restante est :

`main` → #5215 (activation) → #5312 (Margny) → #5296 (nettoyage final).

Chaque étape peut rester seule en production après ses prérequis. #5296 reste
la dernière livraison, après la période d'observation et la fermeture de la
fenêtre de retour arrière. Les branches de revue ne sont pas des versions à
redéployer telles quelles par-dessus les autres livraisons.

| PR restante | Changement | Migration Sqitch |
| --- | --- | --- |
| #5215 | Activation des quatre périodicités | `indicateur/periodicite_activation` |
| #5312 | Six observations de Margny remises au mensuel | `indicateur/margny_indicateurs_mensuels` |
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
2. Pour la préparation d’intégrité annuelle et #5215, prévoir une fenêtre de maintenance : fermer le trafic
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
`identifiantsRecalcules` dans la réponse. Depuis #5491, fusionnée dans `main`, le catalogue et les valeurs recalculées
sont enregistrés dans une même transaction : un échec annule l’ensemble.

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

## 5. Préparation d’intégrité annuelle — #5494 (fusionnée)

Cette étape est fusionnée dans `main` et reste déployable seule avec l’application
annuelle. Si elle n’est pas encore déployée sur la cible, appliquer
`indicateur/periodicite_obligatoire`, puis `indicateur/periodicite_integrite`.
La première rend la cadence explicitement obligatoire et retire les deux anciens
index d’unicité, déjà remplacés dans les upserts applicatifs par les index incluant
la périodicité. La seconde installe les règles de cohérence des définitions,
groupes et valeurs locales. Les observations importées conservent leur identité.
Les quatre contraintes annuelles restent actives ; les API, imports et le
formulaire de création n’ouvrent aucune nouvelle cadence.

Arrêter les écritures et imports pendant les migrations : elles prennent des
verrous sur les tables. Déployer le frontend pour le libellé accessible du bouton
de retrait de colonne et le code de restauration de cette version. Le backend
annuel courant reste compatible. Vérifier la saisie annuelle (zéro, objectif,
commentaire et lot), les droits de l’utilisateur pilote, les moyennes, un import
et le refus des trois autres cadences. Aucune observation n’est réécrite.

Pour revenir à l’état précédent, arrêter les écritures et exécuter :

```sh
sqitch revert --target <cible> --to-change stats/report_indicateur_resultat_periode
```

Le revert retire les règles préparées et recrée les anciens index. Les données
restent annuelles ; prévoir le temps de reconstruction des index. Utiliser les
versions applicatives et le code de restauration correspondant à l’état revenu.
Les sauvegardes de la préparation exigent l’état `prepared`, vérifié physiquement ;
un état contenant seulement une des deux migrations est refusé.

## 5 bis. Activation des cadences — #5215

Après la préparation d’intégrité annuelle, appliquer seulement
`indicateur/periodicite_activation`. Cette migration élargit les CHECK aux quatre
cadences et retire les gardes annuelles. Les règles de cohérence sont déjà en place.
Déployer ensemble backend, application, site et tools, avant de rouvrir le trafic.
La création, saisie, lecture, import et visualisation des nouvelles cadences
sont ouvertes par cette PR. PCAET et score TETE conservent leur contrat annuel.

Le retour annuel cible `indicateur/periodicite_integrite` et conserve la préparation.
Il échoue atomiquement si une définition ou observation non annuelle existe.
Les sauvegardes activées exigent l’état `contract`, distinct de `prepared`.

## Verrous SQL différés — #5417

#5417 est hors de cette chaîne de livraison. Les verrous du graphe sont pris
explicitement par le backend avant les lectures et calculs ; aucun trigger de
verrouillage supplémentaire n’est requis pour les PR ci-dessus. Les contraintes
SQL d’intégrité restent en place.

Réexaminer #5417 seulement si un chemin d’écriture supporté qui contourne le
backend est identifié en production. Les droits SQL conservés et le dump ne
prouvent pas qu’un tel chemin est utilisé. Les intégrations doivent passer par
les services backend ; une intervention SQL doit coordonner ses écritures avec
les transactions applicatives.

## Refactor et atomicité de l’import — #5491

Avant l’activation, le catalogue, les relations, les objectifs et les recalculs
sont enregistrés dans une seule transaction. Un échec annule l’ensemble.
Aucune migration supplémentaire ; déployer le backend imports suspendus. Les
contrats d’import et les contraintes SQL continuent de refuser les autres cadences.

## File de recalcul différée — #5492

#5492 est hors de cette chaîne de livraison. L’import conserve le recalcul
synchrone et la transaction atomique de #5491, y compris après #5215. Aucune
file persistante, tâche de reprise ou migration de réconciliation n’est requise.
Réexaminer ce changement si les mesures en production montrent que la durée
des imports ou des recalculs nécessite un traitement en arrière-plan.

## 6. Interface de saisie — #5493 (fusionnée)

Cette préparation annuelle est fusionnée dans `main`. Déployer le commit
d’intégration annuel avant #5215 si ce n’est pas déjà fait. Elle ajoute le badge de périodicité,
son explication au clavier (notamment pour le score TETE) et la lecture seule
pour les indicateurs sans valeur utilisateur, sans migration SQL.

Contrôler le badge, son infobulle, la saisie annuelle des résultats et objectifs
avec zéro, les commentaires et la lecture seule. Les scénarios mensuels,
trimestriels et semestriels seront exécutés avec #5215.
Le retour à l’application précédente conserve toutes les observations annuelles.

## 7. Margny — #5312

Arrêter toutes les écritures, imports et tâches. Suivre la
[procédure Margny](margny-monthly-migration.md) et contrôler les six observations
mensuelles dans l'application avant réouverture.

Le retour à `indicateur/periodicite_activation` reste possible tant que les observations
concernées et leurs dépendances n'ont pas changé, et avant le nettoyage #5296.

## 8. Nettoyage — #5296

Après validation de Margny, confirmer la fin de la fenêtre de retour arrière.
Suivre la [procédure de nettoyage](periodicite-cleanup.md) : arrêter les écritures,
imports, tâches et sauvegardes/restaurations automatiques ; conserver une sauvegarde
complète dont la restauration a été vérifiée avant de supprimer les archives.

Après déploiement, vérifier une saisie annuelle et mensuelle, un import et ses recalculs
synchrones. Tester une sauvegarde du nouvel état et conserver celle d'avant nettoyage.
**Cette étape interdit tout retour arrière par Sqitch.**

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
arrière de `periodicite_schema` refuse de retirer le schéma si les verrous SQL
optionnels de #5417 ont été installés. Cette garde est inactive dans la chaîne
retenue, qui ne déploie pas #5417. Les gardes d’activation restent dans #5215.

### Vérification de la reprise de Margny — sauvegarde du 14 octobre 2026

La sauvegarde contient les six images originales dans
`private.indicateur_valeur_date_repair`. Quatre observations ne sont plus dans
`indicateur_valeur` ; les deux conservées correspondent intégralement aux images
annuelles archivées. La migration mensuelle reste donc nécessaire.

Déploiement puis retour arrière vérifiés dans une transaction annulée sur la
copie locale : six observations mensuelles restaurées, puis les deux images
annuelles initiales retrouvées sans différence. Aucun contrôle ne dépend de
l’ancienne projection des dépendances : les deux définitions doivent déjà être
sans formule et sans identifiant référentiel. La restauration conserve l’archive
si elle est présente dans la sauvegarde, y compris avant la conversion mensuelle.

Le nettoyage #5296 supprime également les deux colonnes d’agrégation restées
à NULL pendant les étapes de préparation et d’activation.
