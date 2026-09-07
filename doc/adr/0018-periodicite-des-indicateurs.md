# 18. Périodicité des indicateurs

Date : 2026-09-03

## Statut

Proposé. À valider avant la revue et la fusion des PRs d’implémentation.

## Contexte et périmètre

Les valeurs sont stockées à une date SQL, mais leurs consommateurs supposent aujourd’hui un suivi
annuel. Le programme Électrification nécessite un suivi mensuel, tout en conservant les parcours
annuels existants, notamment le diagnostic PCAET.

Cette décision couvre les cadences **annuelle et mensuelle** et le détail mensuel d’un indicateur.
Elle prépare d’autres cadences sans les ajouter. Une grille mensuelle générique reste hors périmètre.

## Décisions

### 1. Distinguer déclaration et affichage

La **périodicité de déclaration** détermine les périodes saisies et les séries stockées et lues.
Chaque définition porte une `periodicite` et un `periodicite_mode` :

- `recommandee` : chaque collectivité peut choisir sa cadence ;
- `imposee` : la collectivité ne peut pas la modifier. L’API et SQL refusent sa personnalisation.

La préférence est stockée dans `indicateur_collectivite.periodicite`, par couple indicateur/collectivité.
Si elle est nulle, la recommandation s’applique. Une cadence imposée utilise toujours la définition.
Seule l’administration du catalogue modifie le mode ; les lectures exposent le mode, la recommandation
et la cadence effective pour permettre à l’interface d’expliquer le réglage.

**Les indicateurs existants deviennent annuels et recommandés.** Les créations sont recommandées
par défaut ; les anciens contrats de création conservent explicitement le défaut annuel recommandé.

Un suivi recommandé peut changer même après saisie de valeurs. Par exemple, une collectivité peut
suivre mensuellement un indicateur annuel recommandé sans affecter les autres collectivités.
Les lectures du suivi local sélectionnent uniquement la cadence effective ; les autres séries restent
lisibles sur demande explicite de leur cadence. Revenir au suivi annuel retrouve ses valeurs annuelles.
Aucune donnée n’est convertie. Les imports conservent également leur cadence d’origine.

La cadence par défaut du catalogue devient immuable dès la première valeur. Le passage à `imposee`
est refusé tant qu’une préférence locale non nulle ou une valeur d’une autre cadence existe,
sans suppression ni conversion automatique. Un indicateur ayant des valeurs annuelles ne peut
donc pas devenir mensuel imposé.
Les changements locaux sont verrouillés contre les saisies concurrentes.

La **périodicité d’affichage** ne modifie que les repères de l’axe du graphique :

| Déclaration | Affichage autorisé | Points                            |
| ----------- | ------------------ | --------------------------------- |
| Mensuelle   | Mensuel ou annuel  | Les mêmes observations mensuelles |
| Annuelle    | Annuel             | Les observations annuelles        |

Douze observations mensuelles affichées par année restent douze points à leurs dates d’origine,
avec leurs mois dans les infobulles. Aucun total, moyenne, interpolation ou mois absent n’est créé.
Les valeurs annuelles enregistrées ne sont pas mélangées à cette série mensuelle.
Une déclaration mensuelle imposée autorise donc aussi l’affichage annuel.

Ce choix est local à chaque vue de graphique, sans préférence persistée pour la collectivité.
Il suit la déclaration par défaut et se réinitialise au changement d’indicateur, de collectivité
ou de déclaration. Cartes, téléchargements et rendus serveur appliquent la même règle, validée
par le domaine. Saisie, commentaires, suppressions et exports de valeurs gardent les périodes déclarées.
Une grille conserve une seule cadence de déclaration ; tout futur tableau réutilise les périodes,
leur ordre et leurs libellés du domaine et de son adaptateur de présentation.

### 2. Porter une période explicite dans le domaine

Une cadence décrit un rythme ; une période en est une occurrence. Le domaine manipule un
`IndicateurPeriod` immuable, validé par une fabrique et sérialisable :

```typescript
type IndicateurPeriod = Readonly<{
  periodicite: IndicateurPeriodicite;
  dateDebut: LocalDate;
}>;
```

Sa construction est opaque. L’hydratation aux frontières utilise la cadence **de la valeur** ;
les opérations suivantes prennent cet objet, sans périodicité séparée. Son identité inclut la
cadence : janvier 2026 et l’année 2026 sont distincts malgré leur même date de début.
Toute inférence depuis une date, une forme de chaîne ou un type `number | string` est interdite.

Les règles calendaires utilisent des stratégies sans état et un registre exhaustif typé.
Annuel et mensuel partagent un algorithme fondé sur le mois, paramétré par un pas de 12 ou 1 mois
et un ancrage explicite. Ajouter une cadence de cette famille ajoute une configuration.
L’ancrage est un premier de mois et le pas divise 12. Le codec doit être injectif : une identité
limitée à l’année convient seulement à une cadence annuelle alignée sur janvier.

Les fonctions restent pures, la façade et les registres immuables, les exports publics explicites.
Le calendrier sépare codec et arithmétique ; il ne dépend ni de React, ni d’ECharts, ni de SQL,
ni d’une règle d’agrégation. Un registre de présentation distinct partage libellés et contraintes
d’axe entre frontend et serveur ; l’adaptateur frontend ajoute les contrôles de saisie.
Une cadence sans stratégie de domaine ou de présentation fait échouer la compilation, sans
fallback annuel ou mensuel. Aucun hook ou classe n’est nécessaire pour un simple calcul pur.

### 3. Conserver un stockage unique et canonique

`indicateur_valeur` conserve une `periodicite` explicite et une date canonique de début de période.
L’unicité inclut collectivité, indicateur, cadence, date et identité de source existante.
Lectures, dédoublonnage et calculs utilisent cette identité ; les repositories hydratent les périodes.
La migration classe les valeurs historiques sans cadence explicite comme `annuelle`, sans modifier
leurs valeurs ni leur identité de source. Seules les dates suivent la normalisation auditée.

Le catalogue SQL des cadences décrit unité, pas et ancrage, identiques à ceux du domaine.
Il est public en lecture, modifiable uniquement par migration et immuable même avant utilisation.
Changer le sens d’une cadence exige un nouvel identifiant et une migration métier.
Une seule fonction SQL de canonisation sert à l’audit, au trigger transitoire et au trigger strict.
Toute cadence inconnue est refusée. Les validations applicatives et SQL restent indépendantes.

La migration normalise les dates historiques non canoniques sous audit, sans fusion automatique.
Les collisions doivent être corrigées. Le reporting conserve ses six colonnes historiques dans
le même ordre, puis ajoute `periodicite` et `periode_debut`. L’alias `annee` reste temporairement
disponible ; les nouveaux consommateurs utilisent cadence et début de période, sans libellés SQL.

### 4. Calculer uniquement entre périodes compatibles

Les calculs regroupent les valeurs par collectivité, cadence, période et source.
Une formule recommandée s’évalue séparément sur chaque série disponible ; une cible imposée
ne produit que sa cadence. Les dépendances absentes suivent les règles de valeurs manquantes.
Les cadences par défaut du catalogue doivent être identiques entre une formule et ses sources,
ainsi qu’entre parents et enfants d’un groupe. Les préférences locales ne changent pas ces défauts.

Le parseur applicatif valide la syntaxe. SQL extrait exhaustivement les références dans une
projection privée, reconstruite avec la formule dans la même transaction et non modifiable par
l’application. Une contrainte différable garantit l’existence et la cadence de chaque référence :
contrôle en fin d’instruction par défaut, report possible au commit pour remplacer un graphe.
La base ne duplique pas l’évaluateur complet.

Il n’existe aucune conversion automatique entre cadences. Une future somme, moyenne, dernière
observation ou moyenne pondérée nécessitera une politique métier distincte, par indicateur ou formule.
Les horizons annuels de référence restent également distincts des observations.

PCAET, score indicatif et publication GES demandent explicitement la série annuelle, même si le
suivi local est mensuel, et refusent les autres cadences. Le catalogue PCAET appartient au domaine ;
ses anciennes tables SQL sont supprimées. La publication GES et les définitions du score transportent
la cadence. Seul l’adaptateur des anciens snapshots du score complète explicitement `annuelle`.
Le tableau PCAET conserve son architecture et ses sources propres à chaque démarche.

### 5. Garantir les écritures et la réconciliation

Un lot cible une collectivité et des cellules `resultat` ou `objectif`, avec indicateur et période.
Droits et périodes sont validés pour tout le lot avant écriture ; ses valeurs et leurs recalculs
synchrones sont validés ou annulés dans la même transaction. Le détail conserve ses mutations unitaires.
Les nouveaux contrats portent
une période explicite ; les contrats REST historiques sans cadence restent des adaptateurs annuels,
même après personnalisation locale.

Toute écriture de valeurs prend un verrou partagé du graphe ; les mutations de cadence ou de
formule prennent un verrou exclusif, avant les verrous de lignes. Définitions et dépendances sont
relues sous verrou, par identifiant croissant. Calcul et écriture récursive utilisent ce même état.
Les imports suivent cet ordre et revalident leur état initial sous verrou ; une modification
concurrente du catalogue provoque un conflit. Le travail de réconciliation découle des états
avant/après verrouillés.

L’import lit et valide définitions et objectifs avant toute mutation. Version, définitions,
objectifs de référence et intentions de réconciliation sont enregistrés atomiquement.
Une version identique ou inférieure est refusée ; changer le contenu exige une nouvelle version.

Le recalcul global du catalogue s’exécute après commit pour ne pas bloquer toutes les collectivités ;
son échec n’annule pas le catalogue importé.
La transaction crée des intentions durables par cible et collectivité, avec formule attendue et
génération. Sont concernées les collectivités ayant des sources de la nouvelle formule **ou**
des résultats automatiques existants, y compris lors du retrait d’une formule.

Le traitement est borné et idempotent. Après le verrou partagé du graphe, la sélection
`SELECT … FOR UPDATE SKIP LOCKED` réserve une intention jusqu’à la fin de la transaction qui
la réconcilie et la supprime. La formule attendue est vérifiée sous ce verrou ; une intention
obsolète est supprimée sans calcul. Chaque génération crée des intentions distinctes :
l’acquittement ne supprime que la ligne verrouillée, jamais celle d’une génération suivante.
Un crash annule la transaction et libère le verrou ; l’intention reste disponible pour reprise,
sans bail à expirer. Le drain initial de l’import,
un cron et une reprise réservée au rôle de service traitent les intentions persistées sans réimporter
le tableur. Les reprises ont un délai persisté ; erreurs et travail restant sont observables.

Cette solution accepte une **cohérence éventuelle** entre catalogue et résultats automatiques.
La réponse distingue le catalogue validé et la réconciliation terminée, en attente ou en échec,
avec le travail restant lorsqu’il est connu. Le succès complet exige qu’aucune intention ne reste
à traiter et qu’aucun échec ne soit signalé.
Une activation strictement atomique à l’échelle du catalogue exigerait des résultats versionnés,
hors périmètre de cet import administratif.

La réconciliation examine les périodes de la formule et des anciens résultats automatiques.
Elle supprime les résultats obsolètes, conserve le manuel et ne lit que les périodes découvertes
puis verrouillées ; une période créée concurremment relève de sa propre écriture.
La version de source retenue est la plus grande `dateVersion`, puis le plus grand `metadonneeId`
en cas d’égalité, comme en lecture. Les anciennes versions automatiques sont supprimées.
Source obligatoire absente : aucune ligne automatique. Source présente à `null` : résultat `null`.
Une suppression déclenche récursivement la réconciliation des dépendants dans la même transaction,
sans créer de pseudo-valeur `null`. Un zéro saisi reste distinct d’une absence.

Les triggers d’écriture SQL directe protègent le graphe, sans garantir les verrous de période ni
le recalcul applicatif. SQL direct n’est donc pas une API d’écriture courante.
L’exception historique EMT reste annuelle : validation de toutes les définitions avant écriture,
refus du mensuel, RPC de service verrouillant graphe, définition puis période, date au 1er janvier.
Elle exige ensuite `indicateurs.valeurs.recompute` pour la collectivité et doit disparaître avec
le format historique, sans servir de modèle aux nouveaux imports.

### 6. Respecter les frontières applicatives

```text
Frontend → tRPC Router → Application Service → Repository → PostgreSQL
```

Le frontend authentifié utilise tRPC, sans accès Supabase ou tables. Les services portent droits,
règles métier et transactions, sans importer `DatabaseService`, Drizzle ou les tables.
Les repositories exécutent les requêtes et acceptent la transaction de l’appelant.
Les entrées REST suivent `Controller → Application Service → Repository`.
L’Edge EMT compose son service et son repository Supabase, dont la RPC est la frontière transactionnelle.

Les exceptions suivantes restent temporaires, limitées aux lectures existantes et aux adaptations
annuelle/mensuelle couvertes par cet ADR. Elles ne constituent pas l’architecture cible :

| Exception                                                                   | Responsable de la migration | Cible                                                               |
| --------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------- |
| `ListIndicateursService`                                                    | Mainteneurs backend         | Requêtes dans un repository                                         |
| `ValeursMoyenneService`                                                     | Mainteneurs backend         | Requêtes dans un repository                                         |
| `ValeursReferenceService`                                                   | Mainteneurs backend         | Droits dans le service, requêtes dans un repository                 |
| `fetchCollectivite` du site public (`apps/site/app/collectivites/utils.ts`) | Mainteneurs du site         | API publique conservant le périmètre publié de `site_labellisation` |

Échéance pour chaque exception : migration préalable à toute extension de son accès aux données,
hors de ces adaptations. La migration conserve les contrôles d’accès et retire
l’exception backend du test d’architecture dans la même PR.
Les tests Nx frontend et backend contrôlent le périmètre modifié et la liste backend exacte,
sans nouvelle exception. L’accès historique du site n’est pas couvert par le test frontend.

<!-- Alias conservé pour les liens existants vers l’ancienne section 10. -->

<a id="10-la-migration-reste-progressive-et-réversible"></a>

### 7. Déployer en deux phases

Sur une base existante, **expand et contract sont deux déploiements distincts**, bornés par
`@indicateur-periodicite-expand` et `@indicateur-periodicite-contract`, jamais par `HEAD`.
Les migrations déjà déployées ne sont pas réécrites.

| Phase    | Changements                                                                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Expand   | Catalogue des cadences, défaut annuel des définitions, mode recommandé, préférences nullables, valeurs annuelles, audit et normalisation sans collision, trigger transitoire, nouveaux index, RPC EMT, file de réconciliation et projection des dépendances. |
| Contract | Nouvel audit sous verrou, refus des conflits, cadence des définitions obligatoire sans défaut annuel, trigger strict, validation des formules, reporting et retrait des anciens index après adaptation de tous les `ON CONFLICT`.                            |

Le défaut annuel des **valeurs** reste une compatibilité des anciens contrats ; le mode recommandé
reste le défaut de création. Le défaut annuel des **définitions** disparaît au contract.

Ordre de déploiement :

1. Drainer brièvement tous les producteurs ; expand verrouille les définitions avant les valeurs.
   Les anciennes instances peuvent ensuite reprendre pendant la compatibilité.
2. Corriger tous les conflits historiques **avant** de déployer les lecteurs et calculs stricts.
   Le trigger transitoire normalise les écritures compatibles et refuse les nouvelles collisions.
3. Déployer application, backend et outils compatibles, mensuel désactivé ; retirer les anciennes
   instances et drainer les producteurs SQL directs.
4. Exécuter le contract après préflight, avec nouvel audit sous verrou.
5. Vérifier lecture/écriture, reporting et réconciliation, puis activer le mensuel.

Le flag `is-indicateur-periodicite-mensuelle-enabled` bloque les nouveaux choix de cadence dans
le frontend **et** le backend jusqu’au postflight. Les imports de catalogue non annuels attendent
aussi cette activation : les anciennes contraintes d’unicité empêchent auparavant la coexistence
de janvier et de l’année correspondante.

**Prérequis avant le déploiement applicatif :**

- L’automatisation Google Sheets doit utiliser `POST /indicateur-definitions/import` et
  `GET /indicateur-definitions/verify`, avec bearer token de service, et lire l’enveloppe
  `status`, `definitions`, `reconciliation`. Méthode, secret et réponse doivent être validés sur
  la cible. L’ancien import anonyme par `GET` est supprimé, sans alias de compatibilité.
- La file durable doit être installée et le cron de réconciliation actif dans `apps/tools`
  (`ENABLE_CRON_JOBS`, sans exclusion de `drain-indicateur-formula-reconciliations`).

### 8. Encadrer le contract, les restaurations et le retour arrière

En environnement partagé, le contract passe par le workflow manuel protégé
`.github/workflows/cd-periodicite-contract.yml` ; une cible Make équivalente existe en local.
Les chemins ordinaires s’arrêtent à expand. L’acquittement `tet.periodicite_contract_confirmed`
est limité à la session Sqitch, fourni par ce chemin et indépendant du flag fonctionnel.

Un mainteneur exécute, un reviewer DB/plateforme distinct approuve. Les protections GitHub sont
un prérequis externe vérifié avant mutation : environnement et base identifiés, branche principale
seule, ni auto-approbation ni contournement administrateur. La connexion est directe ou via pooler
de session, jamais transactionnel. Le workflow protégé exige une image Sqitch épinglée par digest.

Le préflight technique et la validation opérateur vérifient la phase et le schéma, les cadences
et formules valides, l’audit sans conflit,
les anciens producteurs drainés, Google Sheets compatible et le cron sain sans échec non pris en
charge. Une sauvegarde récente, un responsable du rollback et un gel des déploiements jusqu’au
postflight sont requis. L’audit des données et la validation du graphe sont répétés sous verrou.

Sauvegardes, restaurations et contract partagent la concurrence de maintenance de la cible ;
les opérations externes restent couvertes par le gel opératoire.
Une restauration exige source et cible dans la même phase complète `legacy`, `expand` ou `contract`.
Phase partielle ou incohérence entre registre Sqitch et schéma bloque toute troncature.
Audit et intentions sont restaurés du même snapshot ; la projection des dépendances est reconstruite
et validée sous verrou après chargement. Les dates sont réauditées en expand, validées en contract.

Le déploiement utilise `sqitch deploy --mode all --verify --to <tag>` : le tag borne la phase,
le mode `all` annule les changements de cette exécution en cas d’échec détecté, si les scripts
`revert` réussissent. Chaque changement SQL est transactionnel. Une interruption peut laisser
une phase partielle ; le préflight revalide cet état avant reprise jusqu’au même tag.
Le garde créé par le `revert` du reporting reste actif jusqu’au redéploiement transactionnel
du reporting compatible. La reprise et le maintien puis le retrait de ce garde doivent être testés.

Le bootstrap est réservé à une base au registre absent ou vide, **sans tables applicatives**, ou déjà au
contract. Il refuse une base existante sans registre ou arrêtée à expand. Son acquittement est
interne, sans option générale de contournement. Les tests destructifs locaux et CI vérifient une
cible jetable isolée ; ils n’acceptent pas de base arbitraire.
Après contract de tous les environnements persistants, un commit dédié retire les chemins
temporaires et rétablit les migrations ordinaires, en conservant le garde historique et son
rejeu au bootstrap.

Un retour complet à l’ancien schéma est sans perte uniquement si les définitions sont annuelles
recommandées, les valeurs annuelles et les préférences locales absentes. Sinon, il est bloqué
avant modification du reporting ou retrait des colonnes et exige une migration métier.
Après drainage des écritures, un garde transactionnel empêche toute nouvelle cadence incompatible,
préférence ou mode imposé entre les changements Sqitch ; le reporting compatible le retire au
redéploiement. Une date normalisée n’est restaurable que si identité métier et date canonique
sont restées intactes : déplacement, réattribution, suppression ou remplacement invalide
définitivement l’audit, même si le même tuple réapparaît.

## Conséquences et alternatives

Le modèle partage l’identité des périodes entre saisie, calcul, graphique et export, et concentre
les extensions dans les registres. Il exige une hydratation aux frontières, deux registres
domaine/présentation et des adaptateurs annuels temporaires, donc davantage de refactoring
qu’un simple champ ajouté aux valeurs.

Alternatives écartées :

- Couple période/cadence transporté séparément ou cadence déduite d’une chaîne : incohérences possibles.
- Classes sérialisées : méthodes et prototypes perdus aux frontières JSON et serveur/client.
- Présentation et agrégation dans le calendrier : responsabilités et dépendances mélangées.
- Table mensuelle séparée : duplication des droits, sources, commentaires, calculs et exports.
- Agrégation implicite : opération indéterminée sans règle métier.

## Validation

Les tests couvrent les contrats, sans recopier chaque implémentation :

- **Calendrier** : allers-retours codec et stockage, addition inversible et ordonnée, absence de
  chevauchement, changements d’année, dates canoniques, registres exhaustifs. Comparaison entre
  cadences refusée sauf tri total explicitement demandé.
- **Métier et compatibilité** : existant annuel recommandé, indépendance des collectivités et des
  historiques, année distincte de janvier, personnalisation imposée refusée par API et SQL,
  imports et parcours annuels préservés.
- **Présentation** : matrice déclaration/affichage, points et infobulles mensuels conservés,
  absence d’agrégation, mêmes règles pour cartes et exports graphiques, aucun effet sur saisie
  et exports bruts.
- **Transactions et calculs** : lot invalide sans écriture, zéro/null/absence distincts,
  catalogue/objectifs/intentions atomiques, réconciliation des suppressions et versions,
  crash, reprise, générations et traitements concurrents.
- **Migration** : expand, contract, revert, redéploiement et restauration, y compris conflits,
  écritures concurrentes, frontières partielles et gardes de rollback/bootstrap.
- **Architecture** : frontières de persistance, dispatch des cadences limité aux registres et
  adaptateurs, aucune inférence de format, période `number | string` ou fallback annuel implicite.
