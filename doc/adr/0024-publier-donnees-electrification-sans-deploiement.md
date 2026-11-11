# 24. Publier les données Électrification sans déploiement

Date : 2026-11-11

## Statut

Publication implémentée, déployée et données initiales publiées en préproduction
le 11 novembre 2026. La synchronisation Grist des deux jeux par workflow GitHub
manuel, décidée le 12 novembre, reste à déployer et qualifier avec les accès
aux sources. Le lecteur est adapté aux colonnes existantes de l'annuaire le
13 novembre ; les porteurs des groupements restent à compléter dans la source
pour couvrir tous les territoires. La recette complète de l'import et la mise en production
restent à terminer.
Remplace la décision de livraison des données dans Git de la
[section 3 de l'ADR 0022](0022-initialiser-plan-electrification-depuis-annexe-3.md#3-un-catalogue-versionné-et-une-identité-indépendante-des-libellés)
et son application à la liste des lauréats. Les autres décisions métier de
cet ADR restent applicables. Le changement est livré dans la [PR C dédiée — #5815](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5815),
sur `feat/electrification-data-publication`, basée sur B
(`feat/electrification-plan-import`). A conserve son périmètre ; B conserve
ses configurations embarquées et reste déployable sans C.

## Contexte

Les libellés, liens d'aides, correspondances d'indicateurs et lauréats étaient
des constantes TypeScript. Chaque correction nécessitait une PR et un
déploiement. Les schémas de validation doivent rester partagés en code, mais
les données métier doivent évoluer indépendamment.

Au début de cette décision, le dépôt possédait déjà des imports vérifiés de
catalogues et un stockage privé Supabase utilisé pour les releases SNBC3,
mais aucun connecteur Grist ni service générique de publication des catalogues métier.

## Décision

Publier deux jeux de données indépendants : le catalogue Électrification et
la liste des lauréats. Conserver les schémas, types et identifiants techniques
dans `@tet/domain/plans`. Les données exécutées viennent de versions publiées
dans le stockage TeT, sans lecture de Notion ou Grist pendant un import.

Réutiliser le stockage privé Supabase, l'authentification tRPC et les règles
de validation existantes. Une opération réservée aux utilisateurs dont le
rôle `SUPER_ADMIN` est vérifié en base permet d'exporter, vérifier et publier
un fichier JSON. Elle exige une session utilisateur ; les clés API, tokens
avec permissions limitées et tokens service role sont refusés, y compris
pour un super-admin. Le catalogue ne crée pas de définitions d'indicateurs :
celles-ci restent gérées par le catalogue TeT existant.

La publication vérifie la structure, les identités et les rattachements du
jeu de données. Les correspondances `pending` restent explicites et ne sont
pas déduites automatiquement. Les contrôles de chaque référence utilisée
par un import restent applicables avant création du plan.

**Synchronisation manuelle Grist — décision du 12 novembre 2026.** Le catalogue
et les lauréats sont lus depuis leurs documents Grist respectifs. Un workflow
GitHub Actions, déclenchable exclusivement par `workflow_dispatch`, vérifie puis
publie le jeu choisi dans `staging`, `preprod` ou `prod`. Aucun cron, push, déploiement ou
import de plan ne déclenche cette synchronisation. Le mode `verify` ne fait
aucune écriture. Le mode `publish` valide et publie le contenu lu pendant ce run.
Deux runs distincts relisent chacun la source ; une vérification ne réserve
pas le contenu pour le run suivant.

Cette décision remplace le choix précédent d'un Google Sheets pour les lauréats
et de boutons Apps Script, implémentés mais non qualifiés dans le fichier métier.
Le connecteur Sheets spécifique et les boutons sont retirés. Le fichier Sheets
des indicateurs reste la source des définitions ; l’ajout des références externes
est décrit ci-dessous. Les vérifications
historiques de ces boutons ci-dessous ne valident pas le nouveau workflow.

Le runner suit le pattern des scripts backend existants, avec un module NestJS
de maintenance limité à la configuration, la base, le stockage et ces services.
Il ne démarre ni serveur HTTP, ni worker, ni fournisseur IA. Les droits de lancement
et protections de l'environnement GitHub remplacent la session TeT dans ce
contexte interne ; les endpoints publics ne gagnent aucun droit supplémentaire.
La préparation et la validation sont partagées avec l'administration `SUPER_ADMIN`.
Les secrets de chaque environnement ciblent sa propre base et son propre stockage.
Les métadonnées publiées tracent l'opérateur, le run GitHub et la révision Grist.
Les runs sont sérialisés par environnement, sans annulation du run en cours.

Les deux lecteurs réutilisent le même accès HTTP Grist avec authentification,
timeout, refus des redirections et vérification de la révision avant/après lecture.
Le catalogue reprend les six tables `V1_3_*`. Les 58 identités initiales des
sous-actions correspondent aux IDs de lignes vérifiés le 12 novembre ; elles
restent stables après renommage, déplacement et réordonnancement. Changer de
document ou de tables exige de vérifier cette continuité. Les engagements viennent
des colonnes existantes `Code_signe` et `Parametre_signe` de `V1_3_Axes`.
L'adaptateur reçoit les actions déjà publiées pour conserver leurs compléments
TeT ; il ne reprend pas les anciens mappings d'engagements ou d'indicateurs.
Les cibles d'engagement et indicateurs des fiches sont résolus depuis les
références externes publiées avec les définitions TeT dans l'environnement cible.
Sans correspondance publiée,
un code reste `pending` ; un ancien mapping du catalogue actif ne le réactive pas.

**Ajustement du 13 novembre — Grist comme seule source des lauréats.** Le
lecteur utilise les colonnes existantes de `Territoires` : "Code territoire",
"Identifiant public" et "Nature du périmètre". Les métadonnées Grist relient
ces libellés aux IDs techniques ; un libellé absent ou ambigu bloque la lecture.
Les colonnes TeT imaginées précédemment ne sont pas nécessaires. Grist n'est
pas modifié.

Le code territoire devient la référence publiée. Une commune est résolue par
son code INSEE, un EPCI par son SIREN, avec vérification du type dans la base
cible. Seule une correspondance unique est retenue. Les groupements sans porteur
explicite, identifiants vides, inconnus ou ambigus sont exclus et comptés dans
le résultat. Une source invalide, des codes dupliqués ou aucune correspondance
exploitable bloquent la publication, sans remplacer la version active.
Aucun rapprochement par nom, mapping codé en dur ou ancien porteur provisoire
n'est utilisé. Cette décision remplace la conservation des porteurs provisoires
acceptée le 11 novembre pour la liste initiale.

La liste remplace intégralement la précédente, sans expiration automatique.
Pour la recette hors liste, B autorise une session en mode super-admin actif ;
aucun ajout de la démo dans Grist ou dans la publication n'est nécessaire.

L'annuaire ne tranche pas les choix de porteur encore ouverts. La
[comparaison ci-dessous](#annuaire-des-lauréats--12-novembre-2026) reste valable.
Les extractions, contacts et colonnes privées soumis à la consigne de non-diffusion
restent hors du dépôt, des versions publiées, des logs et des artifacts GitHub.
Seuls les références et IDs TeT nécessaires à l'éligibilité sont conservés.

**Version et date automatiques — ajustement du 12 novembre 2026.** Le workflow
ne demande que la cible, le jeu et le mode vérification/publication. La saisie
initialement prévue d'une version et d'un début de validité imposait à l'opérateur
des choix techniques sans information métier pour les déterminer.

La version est une empreinte SHA-256 du DTO validé, correspondances TeT comprises,
sans la version ni la date de publication. Les clés JSON sont ordonnées pour
stabiliser le calcul ; l'ordre des listes métier reste conservé, et le lecteur
ordonne les lauréats par référence. La révision Grist reste une métadonnée d'audit :
elle ne suffit pas à identifier les mappings conservés dans TeT et peut changer
sans modification des données importées.

Un contenu actif inchangé ne crée ni version ni activation et conserve l'audit
de la publication effective, y compris pour une version administrative existante.
`validFrom` correspond à la première publication des lauréats dans TeT, en UTC,
et non à la date officielle de sélection. Cette date est fixée sous verrou et
conservée après échec d'activation, retry concurrent ou réactivation d'une version.
La CLI administrative conserve les métadonnées explicites des fichiers relus et
des anciennes versions à restaurer.

Chaque version est immuable. Une nouvelle publication enregistre d'abord
ses données, puis change la version active de ce jeu. Réutiliser un numéro
de version avec un autre contenu est refusé. Réactiver une version antérieure
exige de republier son contenu inchangé. Aucun nettoyage automatique ne
supprime les versions historiques.

**Correction du 12 novembre 2026.** La CI a montré que deux publications
concurrentes de contenus différents sous la même version pouvaient réussir.
La vérification et l'enregistrement d'une version sont désormais sérialisés
par un verrou transactionnel PostgreSQL, selon le pattern déjà utilisé dans
le dépôt. Initialement limité à une version, ce verrou couvre désormais le jeu
de données et son activation pour garantir aussi les relances sans écriture et
la date de première publication. Il fonctionne entre instances du backend ;
l'upload conserve `upsert: false`. La version complète existe avant son activation.
Ce verrou n'ajoute pas de schéma ; la table de références décidée ci-dessous
a un autre rôle.

L'admission d'un import conserve la version active du catalogue dans son
contrat. Son traitement et sa reprise chargent cette même version, même si
une autre version est devenue active. Les checkpoints conservent leurs
contrôles de compatibilité. Les références et parents catalogue déjà inscrits
sur les plans ne sont pas recalculés. Une correction du catalogue nécessite
un nouvel import pour être prise en compte ; reprendre un ancien job ne
le fait pas passer à la version corrigée.

L'éligibilité suit la liste courante des lauréats, y compris lors d'une reprise.
Le job conserve néanmoins la provenance de sa décision d'admission initiale.

**Organisation des configurations — décision du 12 novembre 2026.** Les paramètres
Grist, les noms de stockage et les correspondances TeT initiales ont été regroupés
avec le canevas dans `apps/backend/src/plans/plans/electrification/config/`.
Les contrats partagés restent dans le dossier `config/` du domaine et les
paramètres du formulaire dans celui du frontend, conformément à
l'[ADR 0022](0022-initialiser-plan-electrification-depuis-annexe-3.md#organisation-des-configurations--12-novembre-2026).
Les correspondances initiales sont ensuite retirées par la décision ci-dessous.
Les lecteurs, schémas de source et règles restent dans leurs dossiers métier.
Ce regroupement est appliqué dès chaque PR qui introduit les fichiers ; il ne
change ni les valeurs, ni les clés de stockage des versions déjà publiées.

**Retrait des copies embarquées — décision du 12 novembre 2026.** Les fichiers
JSON de première publication, initialement conservés dans C, sont supprimés.
La première synchronisation lit le catalogue et les lauréats dans Grist.
Le relevé initial avait conservé les 12 engagements en configuration en les
considérant absents de Grist. La lecture des colonnes existantes de `V1_3_Axes`,
documentée ci-dessous, corrige ce constat et supprime ce mapping initial.
Les 113 indicateurs ne sont pas recopiés dans le code.
Le choix annuel des recensements doit être porté par leurs définitions TeT
publiées ; aucune exception par code Grist n’est nécessaire.
Les tests utilisent un catalogue synthétique réduit et des collectivités de test.

Les versions JSON publiées dans le stockage privé restent immuables ; leur
format et les API/CLI de publication sont inchangés. Un export administratif
peut donc toujours produire un fichier local, sans le versionner dans le dépôt.
Après déploiement de C, chaque environnement nécessite une publication explicite
avant d'admettre des imports Électrification. Les anciennes versions nécessaires
aux jobs conservés doivent rester disponibles : exporter celles déjà publiées
ou sauvegarder le catalogue du commit B réellement déployé avant sa bascule.
Le Grist courant et les fixtures ne peuvent pas remplacer ce contenu historique.
Une donnée absente ou illisible bloque le parcours concerné avec un diagnostic
de configuration. La recette hors liste utilise le mode super-admin actif,
sans variante contenant de faux lauréats.

La bascule initiale ferme temporairement le flag de création Électrification,
laisse les anciens workers terminer les jobs en attente, en cours et leurs
retries, puis déploie le backend exposant la publication. Les anciennes versions
nécessaires aux reprises sont publiées d'abord, puis le catalogue souhaité
pour les nouveaux imports et la liste courante des lauréats. Les versions
actives sont contrôlées avant la réouverture du flag. Les jobs échoués et leur
historique sont conservés ; ils peuvent reprendre quand leur catalogue est disponible. Les imports
génériques et PCAET ne dépendent pas de cette publication et continuent.

## Références externes des indicateurs — décision du 12 novembre 2026

Cette décision est complétée plus bas par la
[publication de l'adresse source et des lignes en attente](#adresse-du-catalogue-portée-par-les-références--décision-du-12-novembre-2026).

Le Sheets des définitions accueille un onglet "Références externes" générique,
sans gestion du WIP. Trois colonnes sont importées : `identifiantReferentiel`,
`source` et `codeExterne`. Les autres colonnes servent à la revue métier.
`source` identifie le catalogue métier, indépendamment de son hébergement ;
`catalogue-electrification` est le premier consommateur.

Réutiliser les endpoints de vérification/publication Sheets et leur version
`Versions`. Les références sont lues et contrôlées avant toute écriture, puis
remplacées dans la même transaction que les définitions, relations, objectifs
et recalculs. La table générique `indicateur_reference_externe` conserve la
version publiée, le lien à la définition et une clé primaire `(source, code_externe)`.
Elle n’introduit ni définition d’indicateur parallèle ni entité d’engagement.
Une panne ou une référence invalide annule l’ensemble ; une feuille manquante
ou sans ses trois en-têtes ne vaut pas une liste vide.

Un identifiant TeT renseigné doit figurer dans les définitions de la même
publication. Les couples source/code sont uniques, y compris parmi les lignes
encore à compléter. Un indicateur peut avoir plusieurs références ; le même
code peut exister dans deux sources différentes. Une ligne sans identifiant
reste documentaire et ne publie pas de lien. Retirer une référence de la
feuille retire le lien de la définition importée ; les définitions hors de
l’import gardent leurs références. Les appels internes qui ne fournissent
pas de références ne les modifient pas.

La synchronisation Grist lit ces correspondances en base dans la cible choisie.
Leur présence dans la publication vaut choix explicite de correspondance ;
la vérification technique ne remplace pas la revue des périmètres métier.
L’unité et la périodicité viennent de la définition TeT publiée : les colonnes
externes documentent les écarts, elles ne déclenchent aucune conversion.
Le catalogue produit fige ces informations. Les imports déjà admis continuent
avec leur version ; publier les définitions ne republie pas le catalogue Grist.

Cette décision remplace les deux exceptions de recensement et la conservation
des anciens mappings de fiches lors d’une synchronisation. Elle est étendue
aux cibles des engagements par la décision ci-dessous, avec une source distincte
pour ne pas confondre leurs codes avec ceux des indicateurs Grist.
Aucune correspondance n’est déduite d’un libellé ou créée par l’IA.

### Engagements depuis les colonnes Grist existantes — 12 novembre 2026

La lecture de [`V1_3_Axes`](https://grist.numerique.gouv.fr/o/100te/m4aC9Epwz7ot/Referentiel-dactions-feuilles-de-routes/p/78)
retrouve les 12 engagements dans `Code_signe` et leur formulation dans
`Parametre_signe`. Le lecteur TeT ignorait ces colonnes ; leur absence dans
son DTO ne démontrait pas leur absence dans Grist. Aucune nouvelle table ou
colonne Grist n'est nécessaire. Aucun onglet d'engagements n'est ajouté au Sheets.

Scinder explicitement `E01+E02` en deux engagements rattachés au même axe.
Refuser un code inconnu, vide, répété ou manquant. Les codes stables, les deux
actions sans cible et les clés `principale`/`total`/`rapides` appartiennent au
contrat de lecture du canevas ; les rattachements, titres et correspondances
TeT sont des données publiées. Pour les actions sans cible, reprendre le
paramètre signé ; retirer sa mention terminale "(non chiffré)". Si un blanc à
remplir subsiste, utiliser le titre d'axe. Émilien retient ainsi "Recharge des
poids lourds" pour E12, sans inventer un nombre de sites.

Réutiliser l'onglet "Références externes", sous `engagements-electrification`,
avec des codes tels que `E01.principale`, `E07.total` et `E07.rapides`.
Les 11 correspondances vers TeT doivent être renseignées et validées par le
métier ; aucun lien n'est déduit du seul axe ou de la proximité des libellés.
Les deux sources de références sont lues en une requête dans la cible. L'unité
et la périodicité sont celles de la définition publiée ; la validation exige
une périodicité annuelle pour une cible d'engagement.

Supprimer `electrification-initial-mappings.config.ts`. Une référence absente
ou retirée produit une cible `pending` dont identifiant, unité et périodicité
sont `null`, sans réutiliser une version antérieure. Deux cibles en attente
ne constituent pas un doublon d'indicateur. Le catalogue incomplet reste
publiable ; seul un import utilisant cette cible est bloqué, avec une erreur
de configuration. Un code de cible inconnu dans la source dédiée bloque la
synchronisation. Les versions déjà publiées restent immuables pour les jobs
admis, tandis que les nouveaux imports utilisent le catalogue actif.

Le relevé initial de l'onglet contient 113 codes Grist, trois rapprochements
documentaires et des questions métier. Les 11 références de cibles restent à
renseigner ; cette implémentation ne modifie pas Sheets. Les rapprochements
préremplis ne sont pas encore validés pour la
production : les relire avant de lancer la publication Sheets. Aucun bouton
n’a été actionné ni définition existante modifiée lors de sa préparation.

**Vérification locale du raccordement — 12 novembre 2026.** 40 e2e et 33 tests
existants réussissent avec Sheets/Grist simulés, PostgreSQL et stockage locaux.
Le parseur Sheets réel est exercé avec des lignes synthétiques. Le typage
backend/specs et le lint ciblé passent. Les scripts SQL deploy/verify/revert
sont exécutés directement ; Sqitch est bloqué par un identifiant historique
local de `plan_action/type_electrification` absent du plan courant. Son
historique n’est pas modifié ; la table de test vide est retirée après validation.
Aucune publication distante ni appel IA réel n’est effectué. Ces vérifications
ne valident pas les correspondances métier préremplies dans Sheets.

**Vérification après lecture des engagements Grist — 12 novembre 2026.**
396 e2e réussissent : 46 publication, 46 résolution des engagements, 2 import
des références et 302 fiches/extraction, admission, agrégat, persistance,
parcours complet, historique et éligibilité. Les sources et le LLM sont simulés ;
PostgreSQL et le stockage sont locaux. Typages backend/specs, lint, formatage
TypeScript et liens locaux des ADR, du plan et du guide passent. La table de
références préparée pour les tests est retirée après vérification qu'elle est
vide. Aucun appel IA réel, modification de Grist/Sheets ni publication distante.

### Une seule source par champ — audit du 12 novembre 2026

L'audit du dossier backend `electrification/config/`, du lecteur Grist et des
deux onglets Sheets confirme la suppression des copies métier embarquées.
Il identifie néanmoins un fallback dans l'adaptateur : les indicateurs sans
référence publiée conservaient l'unité et la fréquence Grist. Ils restaient
bloquants à l'import, mais leurs métadonnées avaient deux origines possibles.

Supprimer ce fallback et la traduction des fréquences Grist. Comme pour les
cibles, une référence manquante produit `identifiantReferentiel`, `unite` et
`periodicite` à `null`. Le lecteur ne dépend plus des colonnes `Unite` et
`Frequence`. Seules les définitions TeT publiées font autorité, y compris
lorsque les métadonnées Grist ou les colonnes documentaires Sheets divergent.
Les e2e couvrent aussi la suppression d'une référence et l'absence de ces
colonnes Grist, sans changement de version provoqué par des données ignorées.

La [répartition par champ](../development/publish-electrification-data.md#source-faisant-autorité-pour-chaque-donnée)
distingue les libellés du canevas des titres du catalogue, ainsi que les
compléments TeT absents de Grist. Ces derniers restent administrés dans le
catalogue publié ; ils ne concurrencent pas les champs Grist. Les exports de
restauration et variantes de recette ne deviennent pas une nouvelle source
de maintenance pour les champs synchronisés. Ni Grist ni Sheets ne sont
modifiés par cet audit. Le contrat des lauréats reste à vérifier avec les
droits requis ; la lecture publique de ses colonnes retourne une 404.

Validation ciblée : 49 e2e réussis, avec Sheets/Grist simulés et PostgreSQL
local. Les versions publiées restent immuables et les références retirées
ne retrouvent aucune métadonnée depuis Grist.

**Simplification de l'onglet — décision complémentaire du 12 novembre 2026.**
Après cet audit, Émilien valide la suppression de `libelleExterne`,
`uniteExterne` et `periodiciteExterne` dans "Références externes". Ces copies
documentaires pouvaient être prises pour des paramètres de publication.
L'onglet conserve les trois champs du mapping, `observation`, `lienSource`
et `lienDefinitionTeT`. Le lecteur porte désormais sur A:F. Les 113 lignes,
leurs valeurs, notes, validations et formats conservés sont vérifiés après
suppression. Aucun changement n'est effectué dans "Indicateur definitions"
ni dans Grist. La relecture des sources remplace la maintenance de copies.

## Conséquences

Les corrections compatibles avec les schémas ne nécessitent plus de PR ni
de déploiement. Une modification de structure ou de règle métier reste une
évolution de code. Le flag de création et les permissions ordinaires ne
changent pas ; publier une liste ne déclenche aucun import ni ouverture.

La synchronisation métier se lance manuellement depuis GitHub Actions. L'export
et la publication explicite d'un fichier restent disponibles pour les
correspondances TeT, la recette et les opérations de reprise. Grist ne devient
pas une dépendance runtime des imports de plans.

La publication du stockage réutilise les tables existantes. Le raccordement
Sheets ajoute uniquement la migration générique `indicateur/references-externes`,
à appliquer avant ce backend. Le stockage des versions et de leur activation doit être conservé
dans les procédures de sauvegarde. La gestion opérationnelle des accès et
des publications incombe aux administrateurs de l'environnement.

La [procédure de publication](../development/publish-electrification-data.md)
décrit les commandes, la première publication et le retour à une version
antérieure. Les critères de qualification restent dans le
[plan d'implémentation](../plans/2026-11-04-001-feat-import-annexe-3-electrification-plan.md#pr-c--publication-des-données-sans-déploiement).

## Vérification du 11 novembre 2026

Les résultats suivants ont été obtenus avant la séparation de C en PR dédiée.
Ils restent des preuves datées de cette implémentation, sans nouvelle
exécution de tests liée au découpage des PRs.

449 tests ciblés réussissent après intégration : 10 nouveaux e2e de publication,
373 tests de parcours/résolution/reprise et 66 tests existants d'admission et
de traitement. Les nouveaux e2e utilisent la base et le stockage Supabase
locaux : accès admin, refus des tokens limités, vérification sans écriture,
références invalides, immuabilité et publication concurrente, réactivation,
indépendance des lauréats et conservation de la version active après un échec.

Les parcours vérifient la conservation du catalogue admis après une nouvelle
publication, son utilisation lors d'une reprise, la préservation de la source
quand cette version est indisponible et l'indépendance générique/PCAET. Les
appels IA sont simulés ; aucun modèle externe n'a été lancé.

Le build backend, le typage du domaine, du backend et des specs, le lint et
le formatage ciblés passent. La CLI compilée et ses opérations ont été
contrôlées avec un serveur HTTP de test, y compris le refus d'écraser un
export existant et le refus des redirections. Ces vérifications locales
utilisent Node 26 ; la version supportée reste celle du `package.json`.

Ces preuves ne valent pas publication en préproduction ou production, ni
recette navigateur de ce mécanisme. La CI finale et la première publication
dans chaque environnement restent nécessaires avant ouverture.

## Première publication en préproduction — 11 novembre 2026

La CLI officielle a vérifié puis publié le catalogue `electrification-v1`
(109 actions) et les lauréats `2026-09-30-revision-2026-11-11-demo`
(106 entrées, démo 5460 comprise), avec une session super-admin autorisée.
L'export des versions actives correspond exactement aux fichiers publiés.
Le formulaire Électrification est disponible sur la démo en mode ordinaire.

La tentative avec le document original TT-67 n'a pas créé de job : le quota
de 10 imports sur 24 heures était atteint. Cette publication ne vaut donc
pas validation du parcours d'import complet. L'exception de quota en mode
super-admin est livrée dans B ; C la reprend sans règle spécifique de quota.

Le reset quotidien de la préproduction restaure aussi les métadonnées du
stockage. Après un reset, contrôler les versions actives et republier les
jeux nécessaires selon la procédure. Aucune publication en production n'a
été effectuée dans cette recette.

## Vérification des sources — 12 novembre 2026

Les 25 e2e de publication et l'e2e existant du catalogue d'indicateurs passent
avec la base et le stockage locaux. Ils couvrent les sources simulées, les droits,
la lecture commune des versions, les dates invalides, la préservation des
correspondances et identités, ainsi que la publication du contenu préparé.
Le build, le typage backend/specs, le lint et le formatage ciblés passent.
La lecture du Grist réel par le connecteur produit un catalogue identique aux
données initiales (109 actions et 58 sous-actions), sans publication.

La CLI est vérifiée contre un serveur HTTP simulé. Le script des boutons est
exécuté avec les API Apps Script simulées : vérification sans publication,
contenu exact, modification entre les deux étapes, changement de backend,
annulation, mauvais Sheets et refus API. Ces résultats concernent le connecteur Sheets et les boutons depuis remplacés
par la décision de synchronisation Grist via GitHub Actions. Aucun appel IA réel
ni publication distante n'a été déclenché par ces vérifications.

## Vérification de la synchronisation Grist — 12 novembre 2026

Avant l’ajustement des métadonnées automatiques, les 33 e2e de publication
passent avec Grist simulé et les services locaux.
Ils exécutent le module de maintenance utilisé par le workflow et couvrent
vérification sans écriture, publication des deux jeux, audit, rerun identique,
refus d'un autre contenu sous la même version, première publication et version
active corrompue. Les erreurs de source, changements de révision, correspondances
absentes et accès privés sont également couverts. Le LLM est simulé.

Build backend, typage backend/specs, lint et formatage passent. Le YAML et le
Bash du workflow sont vérifiés ; la CLI compilée refuse les arguments absents,
le mode inconnu et la date invalide avant connexion. Aucun lancement du workflow
sur GitHub ni publication distante n'a été effectué. Les secrets par environnement,
les droits Grist, les colonnes TeT et la recette préproduction restent à compléter.

## Vérification des métadonnées automatiques — 12 novembre 2026

Les 36 e2e de publication passent avec Grist et LLM simulés, base et stockage
locaux. Ils vérifient la version calculée depuis le contenu validé et les mappings
TeT, la stabilité malgré une nouvelle révision Grist, la vérification sans écriture,
la date de première publication, les relances sans activation ni réécriture
d'audit, le retour à un contenu antérieur et la reprise concurrente après échec
d'activation. Les publications administratives exactes et leurs conflits restent
couverts. Build, typage backend/specs, lint et formatage ciblés passent.
Le YAML/Bash du workflow, les trois choix exposés, l’aide de la CLI compilée et
son refus des arguments invalides sont vérifiés, ainsi que 46 liens et ancres locaux.

Aucun lancement GitHub ni publication distante n'a été effectué pour cet ajustement.
La configuration des accès et la recette du workflow réel restent à terminer.

## Annuaire des lauréats — 12 novembre 2026

Dans le [fil TET-8065](https://app.notion.com/p/3e96523d57d780beb6cffcd9e04b01a9?d=4146523d57d7818fbfa6001c9406d183),
Nicolas partage un annuaire Grist et trois pièces jointes, demande au SGPE
l'ouverture des droits et précise de ne pas diffuser les données. Cette
source retenue pour la synchronisation complète les fichiers de septembre ; son partage ne constitue pas
une validation des correspondances TeT.

Les trois CSV fournis localement sont comparés à la liste initiale et à son
audit du 11 novembre : 109 territoires, 231 lignes d'EPCI et 6 056 communes.
La comparaison couvre les 105 correspondances livrées et les 4 groupements
exclus, sans l'entrée synthétique de démonstration.

- **76 identifiants publics concordent** : 72 SIREN d'EPCI et 4 codes INSEE
  de communes.
- **Saint-Quentin présente un écart d'identité** : la liste initiale désigne
  la commune, tandis que l'annuaire désigne la CA du Saint-Quentinois. Le dump
  local utilisé pour la comparaison distingue TeT `59` et `3830`. Confirmer
  le porteur et vérifier l'ID dans l'environnement cible avant de corriger
  l'éligibilité ; une correction ne transfère aucun plan existant.
- **Les 32 groupements sont rapprochés par leurs libellés** : 23 après
  normalisation et 9 après revue des différences de nom. Leur identifiant
  public est vide et aucun champ ne désigne la collectivité TeT porteuse du
  plan. Les 28 porteurs provisoires et les 4 exclusions restent donc à confirmer.
  Les deux anciennes propositions exclues pour Pays Lédonien et Pays-du-Bocage
  ne figurent pas dans leurs périmètres respectifs ; aucun remplaçant n'est déduit.

La présence dans un périmètre ne suffit pas à valider un porteur : les 72 SIREN
et les 5 codes INSEE initiaux sont tous présents dans les tables géographiques,
y compris Saint-Quentin au sein de son agglomération. Les codes de territoire
de l'annuaire ne remplacent pas automatiquement les références déjà livrées.
Le rapprochement local ne devient pas une règle de résolution par nom au runtime.
Aucun rattachement, fichier initial ou jeu publié n'est modifié par ce contrôle.


## Couverture des lauréats — décision du 13 novembre 2026

Les exports disponibles contiennent 77 territoires avec identifiant public
(73 EPCI et 4 communes) et 32 groupements sans identifiant de porteur.
Les 77 sont résolubles seulement si leur collectivité existe de façon unique
dans la base cible. La synchronisation suit désormais ces identifiants, y compris
celui de la CA du Saint-Quentinois, sans reprendre les 28 porteurs provisoires.
La comparaison du 12 novembre ci-dessus reste une preuve historique.

Pour couvrir les 109 territoires :

- Faire désigner dans la source métier le porteur de chacun des 32 groupements,
  avec un identifiant public exploitable ; adapter ensuite le lecteur à ce
  contrat validé. Les tables des communes/EPCI décrivent un périmètre et ne
  suffisent pas à choisir ce porteur. Aucune modification de Grist n'est faite
  dans cette livraison.
- Faire confirmer que la CA du Saint-Quentinois est bien le porteur attendu,
  puisque son identifiant remplace celui de la commune dans la source.
- Vérifier les correspondances uniques dans la base de chaque environnement ;
  corriger dans leur source les identifiants manquants ou incohérents et les
  données TeT si nécessaire, sans ajouter de table de correspondance parallèle.
- Configurer l'accès en lecture à l'annuaire et qualifier le workflow sur la
  source réelle. Le 13 novembre, les lectures anonymes des métadonnées renvoient
  HTTP 404 ; aucun accès authentifié n'a été qualifié. Les tests utilisent Grist
  simulé et ne valident donc pas ces droits.

La vérification avant publication affiche le nombre retenu et les exclusions.
Publier la liste partielle retire les anciens porteurs absents de la source ;
leur statut ne sera pas maintenu par un repli sur une ancienne publication.

## Adresse du catalogue portée par les références — décision du 12 novembre 2026

Cette décision complète celle des références externes et remplace le caractère
purement documentaire de `lienSource`. L'adresse du document Grist ne doit pas
être dupliquée entre Sheets et le code.

Publier `lienSource` dans la table générique existante, sous la version des
définitions. Les références sans identifiant TeT sont conservées avec un
`indicateur_id` nul : elles permettent de désigner le catalogue avant de terminer
les correspondances. Aucun nouvel objet métier n'est créé. Une publication
explicite remplace toutes les lignes en attente et les liens des définitions
importées ; elle préserve les liens des autres définitions. Les contrôles et
écritures restent atomiques, y compris si ces liens préservés sont incohérents
avec la nouvelle adresse.

Le lecteur résout un document Grist unique depuis les liens publiés des deux
espaces `catalogue-electrification` et `engagements-electrification`. Leurs clés
logiques restent stables quand l'hébergement change. Les pages et slugs peuvent
différer ; les adresses doivent désigner un même document HTTPS sur l'hôte Grist
supporté. Le réseau utilise toujours le client Grist existant, jamais une URL
arbitraire provenant du Sheets. Un lien absent, invalide ou ambigu bloque
l'opération ; aucun ancien document n'est réutilisé. Le catalogue actif reste
intact en cas d'échec. La source résolue est inscrite dans le catalogue publié
et participe à son identité de version.

Les lauréats ne relèvent pas des références d'indicateurs. Leur document est
configuré par `ELECTRIFICATION_LAUREATS_GRIST_DOCUMENT_ID`, selon le mécanisme
d'environnement existant, avec une variable GitHub propre à chaque cible.
Sans cette variable, seule leur préparation est refusée. Les noms de tables et
contrats de colonnes restent en code ; changer la structure Grist nécessite
encore d'adapter le lecteur. Les imports de plans continuent à lire les versions
publiées sans accès direct à Sheets ou Grist.

## Vérification du lecteur des lauréats — 13 novembre 2026

Les 55 e2e de publication/synchronisation passent avec base et stockage locaux,
Grist et LLM simulés. Ils couvrent les libellés de colonnes distincts de leurs
IDs techniques, les rapprochements INSEE/SIREN, l'exclusion des lignes sans
correspondance, l'absence de repli sur les anciens porteurs, les colonnes
absentes/ambiguës, les doublons, les erreurs de lecture et la préservation
de la publication active en cas d'échec. Aucun workflow distant ni accès
authentifié à l'annuaire réel n'a été lancé.

Après rebase sur l'exception super-admin de B : 104 e2e réussis (55 publication,
25 éligibilité et 24 parcours d'import), typages backend/specs et lint ciblé
vérifiés. Les 55 liens et ancres locaux de l'ADR, du plan et du guide passent.

## Qualification de la publication en préproduction — 13 novembre 2026

Le backend et le frontend déployés servent le commit `5372450506` de C. Après
application des migrations, l'API existante a publié les définitions et
références du Sheets en préproduction : 1 004 définitions, sans recalcul de
valeurs. Le fichier Sheets n'a pas été modifié.

La préparation du catalogue depuis Grist, sa vérification et sa publication
par la CLI administrative réussissent. La relecture active est identique au
contenu préparé : 11 axes, 41 sous-axes, 109 actions, 12 engagements et
113 indicateurs. La version est
`sha256-07ab95098f7fcf790201072dcd2566f2f3d1bdf0d3868ca31408228e9aa493f4`.
Trois indicateurs sont rattachés aux définitions TeT ; leur validation métier
reste à tracer. Les 11 cibles d'engagement sont toujours en attente.

La liste des lauréats n'a pas été republiée : l'ancienne version contenant la
démo reste active. Aucun import de plan ni appel IA n'a été lancé pour cette
qualification. Elle ne valide pas le workflow GitHub ni la lecture authentifiée
de l'annuaire.

Le workflow de synchronisation reste livré dans C, sans PR préalable d'activation.
Il utilise les secrets GitHub de la cible et reste exclusivement manuel.
La préparation administrative utilise les accès du backend : le déploiement Koyeb
associe sa clé Grist au secret existant et reprend l'identifiant du document depuis
la même variable GitHub que la synchronisation. Aucun identifiant de document
supplémentaire n'est maintenu dans Koyeb. Sans cette variable, les deux paramètres
Grist sont retirés du service ; le backend peut démarrer avec les données publiées.
La variable est configurée dans GitHub `preprod` ; le déploiement avec ces paramètres,
la lecture authentifiée des lauréats et le workflow réel restent à qualifier.

La configuration Koyeb est vérifiée sans réseau sur 24 scénarios shell : backend
normal et de test, trois environnements, source absente, valide et deux identifiants
invalides. Les autres arguments de déploiement sont identiques à ceux du workflow
précédent ; build, déclencheurs et déploiement Coolify ne changent pas. Actionlint
et le formatage YAML passent. Ces contrôles ne valent pas déploiement distant.
