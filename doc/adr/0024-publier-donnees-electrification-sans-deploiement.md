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

**Tolérance des libellés existants - décision du 19 novembre 2026.** L'identité
publiée de l'engagement prime sur sa formulation. La synchronisation peut conserver
les anciens libellés du catalogue actif pour le même code, le même axe et le même
document Grist, lorsque les clés, unités et échéances des cibles sont compatibles.
Le contrat des premiers snapshots V4 permet de relire leurs associations
code/libellé même sans URL source. Cette lecture historique ne remplace aucune
définition ni correspondance provenant des sources actuelles.

Le Word peut désigner un engagement par son code exact, son libellé actuel ou un
ancien libellé ainsi conservé. Les sources originales restent dans le checkpoint ;
aucune équivalence sémantique n'est déduite de cette continuité d'identité. Cela
permet de conserver les documents existants, notamment l'ancienne formulation E05,
sans les réécrire ni modifier Grist. Un changement de document ou de cibles
incompatible ne reprend pas ces libellés ; une collision entre engagements d'un
même axe, ou entre un libellé et le code d'un autre engagement, bloque la
publication. Un lien au document Grist seul n'identifie pas un
engagement. L'IA reste un recours pour les libellés non reconnus.

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
et non à la date officielle de sélection. La date enregistrée dans le premier
fichier immuable est conservée après échec d'activation, retry concurrent ou
réactivation d'une version.
La CLI administrative conserve les métadonnées explicites des fichiers relus et
des anciennes versions à restaurer.

Chaque version est immuable. Une nouvelle publication enregistre d'abord
ses données, puis change la version active de ce jeu. Réutiliser un numéro
de version avec un autre contenu est refusé. Réactiver une version antérieure
exige de republier son contenu inchangé. Aucun nettoyage automatique ne
supprime les versions historiques.

**Correction du 12 novembre 2026, remplacée le 16 novembre.** Un verrou
transactionnel PostgreSQL couvrait l'upload et l'activation du jeu dans Storage,
avec `upsert: false` pour les versions. Cette première correction ne créait
pas de table. La revue a montré sa limite : après expiration de la transaction,
un upload HTTP encore en cours pouvait remplacer la sélection active.

**Activation transactionnelle - décision du 16 novembre 2026.** Les fichiers de
version restent immuables dans Storage. Seule la sélection active de chaque jeu
et son audit sont stockés dans `electrification_data_selection`, soit deux lignes
techniques, sans nouvelle entité métier. Cette migration est intégrée à C.
Elle reprend les sélections déjà publiées depuis les métadonnées Storage.

L'upload se termine avant la transaction d'activation. Sous un verrou par jeu,
le service compare la révision UUID courante à celle observée avant l'upload,
puis active la nouvelle version. Cette révision change à chaque activation,
même lors d'une restauration de A après B : un candidat préparé avant cette
restauration reste refusé. Aucun appel HTTP ne garde une transaction ouverte.
Une sélection modifiée entre-temps fait refuser l'activation ; un upload tardif
peut laisser une version inactive, mais ne remplace pas une publication récente.
Une relance vers la version déjà active ne réécrit pas son audit.

**Compatibilité Storage vérifiée le 16 novembre 2026.** Les e2e concurrents ont
révélé que le Storage embarqué par l'ancien CLI de CI pouvait accepter deux
créations simultanées au même chemin malgré `upsert: false`. Le
[code officiel de Storage](https://github.com/supabase/storage/blob/v1.90.1/src/storage/uploader.ts)
refuse désormais ce conflit sous verrou. La CI et les commandes `act` utilisent
le [CLI stable](https://github.com/supabase/cli/releases/tag/v3.1.0), avec la
[configuration migrée](https://supabase.com/docs/guides/local-development/cli/migrating-to-v3).
Les versions sont fixées dans les actions existantes ; PostgreSQL reste en
version majeure 15. Le cache de base physique inclut le CLI et sa configuration :
le changement d'image ne doit pas restaurer un ancien cluster dont la bibliothèque
de collation diffère. La configuration Auth conserve explicitement le contrat
JWT symétrique de TeT. Les fixtures SQL partagent le cleanup transactionnel des
métadonnées synthétiques sans fichier ; les documents réels passent toujours
par l'API Storage. Le modèle Drizzle retire aussi `storage.objects.level`,
une colonne interne supprimée par la
[migration Storage 0052](https://github.com/supabase/storage/blob/v1.90.1/migrations/tenant/0052-drop-not-used-indexes-and-functions.sql)
et inutilisée par TeT. Les e2e vérifient cette garantie du stockage réel, sans mock
ni retry masquant un écrasement.

La synchronisation capture aussi la révision de sélection du jeu avant de lire
Grist, pour le catalogue comme pour les lauréats, et la transmet à la publication. Si une publication administrative l'a remplacée, elle doit être
préparée de nouveau pour conserver les derniers compléments TeT. La publication
administrative explicite reste le moyen d'activer un fichier relu ou une ancienne
version. Une panne de lecture du catalogue avant le checkpoint d'un import
conserve son document source. La reprise proposée dans l'interface exige
toujours un checkpoint valide : cette conservation seule ne rend pas le job
reprenable. Avant ce premier checkpoint, il faut lancer un nouvel import après
rétablissement du catalogue.

L'admission d'un import conserve la version active du catalogue dans son
contrat. Son traitement et sa reprise chargent cette même version, même si
une autre version est devenue active. Les checkpoints conservent leurs
contrôles de compatibilité. Les références et parents catalogue déjà inscrits
sur les plans ne sont pas recalculés. Une correction du catalogue nécessite
un nouvel import pour être prise en compte ; reprendre un ancien job ne
le fait pas passer à la version corrigée.

L'éligibilité suit la liste courante des lauréats, y compris lors d'une reprise.
Le job conserve néanmoins la provenance de sa décision d'admission initiale.
L'ajustement du 17 novembre de l'[ADR 0022](0022-initialiser-plan-electrification-depuis-annexe-3.md)
autorise aussi le mode super-admin actif sans publication de la liste. Cette
exception est tracée sans source ni version fictive ; les données invalides
ou illisibles restent bloquantes et le catalogue publié reste obligatoire.

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
de configuration, sauf l'absence de liste des lauréats pour une session
super-admin active selon l'ajustement du 17 novembre ci-dessus. La recette
hors liste ne nécessite aucune variante contenant de faux lauréats.

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

Les fichiers utilisent le stockage existant. C ajoute les migrations
`indicateur/references-externes` et `plan_action/electrification_data_selection`,
à appliquer avant ce backend. Les sauvegardes doivent conserver les fichiers
immuables et la table de sélection. Un retour du code doit garder un lecteur
compatible avec cette table ; les anciens fichiers de sélection Storage ne
sont plus mis à jour. La gestion opérationnelle des accès et
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

## Métadonnées des cibles importées - 18 novembre 2026

Décision remplacée par [Engagements issus de Grist](#engagements-issus-de-grist---18-novembre-2026).

Le retour TT-67 révèle deux correspondances E07 absentes du Sheets. La colonne
Notion v2 désigne `s_26` pour le total et `elec_6_b` pour les bornes rapides.
Ce choix métier est confirmé, même si le canevas emploie "bornes rapides"
et la définition TeT précise "150 kW et plus".

Les correspondances sont corrigées dans "Références externes". Les colonnes
facultatives `libelleSource` et `uniteImport` portent le libellé du compte rendu
et l'unité attendue dans le brouillon pour chaque référence. Elles suivent
la publication transactionnelle des définitions puis la version du catalogue.
Sans `uniteImport`, la comparaison avec l'unité TeT reste exacte. Cette décision
écarte les alias globaux entre unités de comptage et les libellés E07 dans le
resolver. Elle n'autorise aucune conversion numérique ; la correspondance
doit porter sur la même mesure et la même échelle.

L'interprétation IA existante reste réservée aux cellules numériques complexes,
avec citations vérifiables et validation déterministe des valeurs. Elle ne
choisit ni l'indicateur TeT ni une équivalence d'unité. Les règles du canevas,
dont l'année cible et la cohérence entre total et bornes rapides, restent
explicites. Cette séparation conserve les checkpoints des imports existants.

La migration `indicateur/references-externes-import` et le backend doivent être
déployés avant de republier les indicateurs puis le catalogue. Les corrections
du Sheets seules ne modifient aucune version déjà publiée.


## Définitions importables des engagements - 18 novembre 2026

Décision remplacée par [Engagements issus de Grist](#engagements-issus-de-grist---18-novembre-2026).

Cette décision remplace la liste fermée et les branches par code décrites dans
"Engagements depuis les colonnes Grist existantes" et complète "Métadonnées
des cibles importées". Le code partagé n'énumère plus E01-E12. Chaque engagement
est défini dans "Références externes", sous le code Grist, avec son libellé,
son type (`action` ou `cibles`) et ses clés de cible. Chaque cible conserve sa
ligne de correspondance et déclare année, bornes, plafond et variantes de lecture.
Le contrat physique du Word reste dans son adapter ; ses engagements viennent
du catalogue publié.

Le choix d'étendre l'onglet existant conserve une publication transactionnelle
unique avec les définitions TeT et évite une lecture directe des sources pendant
l'import. Une ligne de définition n'a pas d'identifiant d'indicateur. Une ligne
de cible peut rester sans correspondance TeT, mais doit fournir ses règles de
lecture. Les références orphelines et les définitions incomplètes bloquent une
nouvelle publication. Une suppression de mapping laisse la définition en place.

L'IA peut rapprocher une formulation des engagements publiés du même axe et
extraire des valeurs complexes. Les codes, clés, citations, nombres, unités
et années sont vérifiés ensuite. Les réponses et citations sont conservées
dans le checkpoint V2 pour ne pas refaire ces appels à la reprise. Le worker
relit les checkpoints V1 sans ce champ et garde le format V1 pour les jobs
déjà admis, sans nouveau rapprochement IA. L'ajout du champ n'est pas compatible
avec le schéma strict des anciens workers ; une reprise V2 nécessite un worker
mis à jour. Une citation
prouve la provenance, pas la justesse sémantique ; cette limite impose une
validation humaine du comportement sur les documents représentatifs.

Les nouvelles publications portent `engagementsFormat=2` et ne récupèrent aucun
paramètre manquant depuis le code. Un adapter séparé restitue uniquement les
règles V4 des snapshots immuables déjà publiés, afin de préserver les jobs qui
les ont admis. Il ne participe jamais à la publication depuis Sheets/Grist.
Les tests des nouveaux catalogues emploient des codes, clés et années distincts
des douze engagements initiaux. Aucun appel à un modèle payant n'est nécessaire
pour vérifier ces contrats avec le fake LLM.


## Engagements issus de Grist - 18 novembre 2026

Cette décision remplace la source Sheets des définitions importables et des
métadonnées de cibles décrite ci-dessus. Grist doit rester en lecture seule.
Les engagements figurent déjà dans `V1_3_Axes` : `Code_signe` porte les codes,
`Parametre_signe` les formulations. Leur duplication dans les références des
indicateurs était un couplage injustifié. Aucun nouvel onglet ni configuration
métier administrée séparément n'est nécessaire.

Le lecteur construit les définitions depuis ces colonnes et les publie dans
le catalogue, via le circuit de validation, versionnement et activation déjà
partagé avec les lauréats. Le fichier Sheets ne porte que les correspondances
vers les indicateurs TeT. Les colonnes et la migration SQL ajoutées pour les
règles d'engagement sont retirées de la PR avant déploiement.

Le contrat reconnaît les quantités à compléter et leur échéance explicite,
les codes entre parenthèses pour les engagements regroupés et la relation
"dont" entre un total et sa sous-cible. Les identités `principale` et `total`
sont des conventions de lecture ; la clé d'une sous-cible vient du texte.
Les unités, libellés et années ne sont pas associés à des codes dans le moteur.
Les objectifs sont positifs ou nuls, les pourcentages plafonnés à 100. Une
formulation ambiguë bloque la publication sans remplacer la version active.

Une action sans échéance ne devient pas un objectif annuel. Cela conserve
le traitement d'E12, dont le Grist demande d'identifier des sites sans année,
et dont le canevas Word prévoit une sélection qualitative. Son libellé Grist
reste disponible et son titre d'axe devient le titre de la fiche. Aucune
quantité ni échéance n'est inventée. Une évolution de ce périmètre nécessiterait
un contrat explicite pour les engagements quantifiés non datés.

Les engagements restent publiables avec des correspondances en attente. Une
ligne Sheets supprimée ou vidée conserve la cible définie par Grist et bloque
seulement les imports qui l'utilisent. Les définitions TeT fournissent leur unité
et périodicité. L'IA intervient dans l'import Word pour rapprocher les libellés
et interpréter les valeurs complexes, dans les limites du catalogue admis ;
la synchronisation des sources ne démarre aucun modèle.

Les instantanés existants et leurs checkpoints restent inchangés. Les tests
utilisent un extrait des 11 lignes Grist relues le 18 novembre, des codes et
années synthétiques, ainsi qu'un fake LLM pour le rapprochement avec le canevas.
La validation réelle du comportement sémantique du modèle reste humaine.
