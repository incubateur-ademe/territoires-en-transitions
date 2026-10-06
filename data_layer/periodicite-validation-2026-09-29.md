> Rapport historique du 29 septembre, avant séparation de la PR de schéma.
> Le nouvel ordre est **réparations #5220 → schéma compatible → backend #5214 → activation #5215**.
> Les résultats ci-dessous concernent la chaîne groupée de cette date et ne prouvent
> pas la compatibilité de l'ancien backend entre les nouvelles livraisons.
> La formule est désormais corrigée dans #5214, avec la protection des saisies.

# Validation de la phase 1 — 29 septembre 2026

Périmètre : [phase 1](../doc/plans/2026-08-31-001-feat-electrification-indicateurs-plan/phase-1-periodicites-des-indicateurs.md)
et [ADR 0018](../doc/adr/0018-periodicite-des-indicateurs.md).
Ordre de livraison : **#5220 → #5214 → #5215**. Aucun recalcul ni changement
n’a été exécuté en production ; les répétitions utilisent des bases locales isolées.

## Saisies manuelles et recalcul

L’upsert avec métadonnée applique désormais le même garde-fou atomique que
l’upsert local : une valeur calculée ne peut remplacer qu’une valeur déjà
calculée. `calcul_auto = false` et `NULL` désignent des saisies à conserver.
PostgreSQL revérifie cette condition après l’attente d’un verrou concurrent.
Les résultats refusés ne sont pas propagés aux indicateurs dépendants.
Une saisie authentifiée impose `calculAuto = false` et efface les identifiants
manquants ; l’utilisateur ne peut pas se déclarer calcul automatique.

Les dix régressions sur PostgreSQL couvrent la ligne complète (valeur, objectif,
commentaires, provenance, auteurs et horodatages), zéro/absence, les lots mixtes,
la modification manuelle d’un calcul et une course entre deux transactions.

La répétition privée sur les données du 29 septembre a exécuté les vrais services
de réconciliation, de calcul et d’écriture, dans une transaction annulée :

| Contrôle | Résultat |
| --- | --- |
| Saisies manuelles PCAET, dont 32 sur formule | **71/71 lignes intégralement inchangées** |
| Périmètre de recalcul | 3 collectivités, 78 formules |
| Écritures/propagations automatiques exercées | 1 142 |
| Résultats automatiques contrôlés après recalcul | 800, zéro divergence, zéro résultat obsolète |
| Vérification après rollback | 3 909 observations, empreinte complète identique |

Les données nominatives, les exports et ce script lié au snapshot restent dans
les artefacts privés ignorés par Git. Le test versionné utilise uniquement ses
propres fixtures.

## Provenance et droits

Les routes ordinaires REST/tRPC refusent toute écriture utilisateur sous une
métadonnée externe. Le refus annule tout le lot. La capacité PCAET reste interne,
limitée à la collectivité et à la métadonnée autorisées par le parcours de
la démarche ; elle ne peut pas être fournie dans le corps de la requête.
Les imports privilégiés existants restent fonctionnels.

La copie locale conservait aussi des droits directs de mutation pour `anon` et
`authenticated`, alors que les écrans passent par le backend. Le dump original
contient les politiques RLS permissives correspondantes, mais pas les ACL : les
droits effectifs de production devront être vérifiés au déploiement. La migration
`indicateur/reserver-ecriture-valeurs-backend` retire ces mutations (y compris
les droits par colonne et ceux de `PUBLIC`), conserve `SELECT` et les droits
`service_role`, et refuse atomiquement un héritage inattendu de permissions.
Les ACL initiales sont archivées dans une table privée et restaurées exactement
au revert. Les consommateurs Supabase des applications ont été vérifiés : aucun
n’écrit directement dans `indicateur_valeur`.

Les **38 assertions SQL** couvrent notamment les droits de table et de colonne,
`PUBLIC`, les droits hérités, le refus atomique et la restitution exacte au revert.
Après application de cette révocation, les **31 tests API** de droits (17), de CRUD
REST (8) et de PCAET (6) passent ; les vérifications SQL avant et après passent aussi.

La seule RPC d’écriture correspondante du schéma de production,
`delete_collectivite_test`, exige `service_role` et une collectivité de test.
Le helper non protégé `test_reset_plan_action` appartient aux seeds locaux et
est absent du schéma de la sauvegarde de production.

## Répétition de la chaîne SQL sur le snapshot

La sauvegarde `backup-2026-09-29.dump` contient **4 772 554 observations**,
26 554 définitions, 116 métadonnées et 25 sources. La pré-PR #5220 applique
les trois corrections de date et six suppressions validées, avec archivage
intégral des neuf lignes d'origine. Il reste **4 772 548 observations**,
sans date invalide ni collision.

Deux répétitions isolées ont été réalisées : la première avec toutes les données
restaurées dans le schéma local précédent, la seconde avec **le schéma métier
et les données extraits directement de l'archive de production**. Cette seconde
copie conserve également les 669 changements du registre Sqitch original et
les propriétaires des objets, dont les huit event triggers.

Les huit migrations de #5214, leurs vérifications, puis l'activation #5215 et
son verify passent. Le retour arrière des neuf changements revient à l'état
réparé, avant périodicité. À chacune des trois étapes — annuel, activation,
retour arrière — une jointure complète compare l'identifiant et l'empreinte de
chaque ligne à l'état après #5220 :

| Entité comparée intégralement | Lignes | Écarts |
| --- | ---: | ---: |
| Observations | 4 772 548 | **0** |
| Définitions | 26 554 | **0** |
| Métadonnées | 116 | **0** |
| Sources | 25 | **0** |

Seules les nouvelles colonnes de périodicité/agrégation sont exclues de ces
comparaisons. Tous les anciens champs restent inclus : résultats, objectifs,
commentaires, dates, provenance, auteurs, horodatages et indicateurs de calcul.
Après revert, le seul écart textuel de schéma est un alias interne de la vue
matérialisée de reporting (`ir` → `valeur`), sans changement de sémantique.

Une base sans données de production couvre en plus **103 assertions pgTAP**
(calendrier, déclarations/sources, formules, livraison annuelle et activation),
les verrous/concurrences et la reprise après restauration. Six scénarios vérifient
le refus atomique du revert d'activation : trois cadences non annuelles, une
source externe mensuelle sous définition annuelle, et les deux règles
d'agrégation. Chaque refus laisse données et contraintes inchangées.

Limites de cette répétition :

- `pg_cron` est exclu des copies pour empêcher l'exécution des tâches du snapshot.
- L'archive ne contient pas les ACL d'origine. Des droits explicites de test sont
  posés avant la seconde répétition ; les 38 tests dédiés couvrent leurs variantes.
  La migration vérifie les droits effectifs sur la cible et bloque un héritage
  inattendu, plutôt que de supposer les ACL de production.
- Les vrais scripts deploy/verify/revert tournent via `psql`, avec leurs propres
  transactions. Le registre Sqitch n'est pas modifié artificiellement. Le plan
  est validé séparément ; cette répétition ne certifie pas le déploiement des
  autres migrations `main` en attente, notamment celles utilisant `cron`.
- Les durées locales et les journaux complets restent dans les artefacts privés ;
  elles ne constituent pas une durée garantie de maintenance en production.

## Parcours applicatifs et contrat de période

Les vérifications utilisent une base réelle, une authentification et un Redis
locaux dédiés. Les modèles payants sont remplacés ; les tests SNBC lisent le XLSX
versionné et simulent Google Sheets.

- #5214 : 17 tests de droits, 8 CRUD/imports/recalculs, 6 PCAET, 7 routes SNBC
  et 3 parcours SNBC avec téléchargement, calcul, persistance et recalcul passent.
- 270 tests unitaires backend ciblés passent, complétés par les deux fixtures
  annuelles du score (18 tests) et les libellés des référentiels ECI/TE (2 tests).
- #5215 : **92 tests API** passent : création et immutabilité des quatre cadences,
  droits, lots atomiques, contrats historiques, réconciliation et exports.
- #5215 : 233 tests frontend, 109 tests du domaine indicateur, 79 tests backend
  de grille/graphique/export/architecture, 2 tests de publication GES et 10 tests
  du worker passent. Les 19 tests des fichiers React en conflit ont été rejoués
  après rebase sur `main`.
- Les anciens upserts annuels normalisent encore les dates historiques, avec ou
  sans périodicité explicite. La nouvelle grille exige des dates canoniques pour
  les quatre cadences. La base ne stocke que des débuts de période canoniques.
- Les typechecks TypeScript 6 du backend (tests compris), de l’app et du site
  passent. `tools` conserve deux erreurs TS2883 dans les services de périmètres
  EPCI et de clôture d’instructions, également reproduites sur `main` ; elles ne
  sont pas modifiées dans ces PR.
- Les plans Sqitch des trois branches et `make db-test-deployment-guards` passent.

## Conditions restant à vérifier au déploiement

- Actualiser la sauvegarde et relancer les garde-fous de données : les neuf
  observations réparées peuvent évoluer entre la répétition et la maintenance.
- Vérifier la correction de `cae_2.lpcaet` dans le catalogue Google Sheets et la
  compatibilité des automatisations du catalogue. La sauvegarde ne certifie pas
  le contenu de cette feuille externe.
- Les règles d’agrégation restent explicites, sans somme par défaut pour une
  règle inconnue. Leur validation métier n’est pas déduite des données annuelles
  du snapshot et doit précéder leur configuration.
- Cette validation locale ne remplace pas les checks CI du commit publié ni les
  contrôles du runbook avant réouverture. La pré-PR de données seule n’active
  aucune des protections applicatives de #5214.
