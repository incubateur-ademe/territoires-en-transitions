---
title: 'feat: Import du plan Électrification'
type: feat
status: in-progress
date: 2026-11-04
---

# Import du plan Électrification

Dernière mise à jour : 2026-11-11.

Ce plan applique l'[ADR 0022](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md).
Il remplace le découpage en quinze PRs par deux livraisons. Les décisions,
sources et preuves des anciens lots restent dans
[l'historique de l'ADR](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md#historique-des-décisions-et-des-prs).
Les deux PRs suivent le périmètre élargi : A reprend aussi les refactorings
actifs sans changement de comportement ; B garde les évolutions fonctionnelles.
L'import Électrification n'est pas qualifié pour une ouverture en production.

## Livraisons et avancement

| Livraison                           | Base → branche                               | État                                                                                      |
| ----------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [PR A — Fondations][pr-foundations] | `main` → `refactor/plans-import-foundations` | Builds et tests ciblés passés ; CI des ajustements du 11 novembre à vérifier ; un commit ; non fusionnée.    |
| [PR B — Import complet][pr-import]  | A → `feat/electrification-plan-import`       | Reconstruite sur A élargie ; draft ; un commit ; qualification finale et métier restante. |

- [x] Fixer la séparation entre refactorings sans changement utilisateur et évolutions fonctionnelles.
- [x] Intégrer les données vérifiables : 41 sous-axes et métadonnées E07.
- [ ] Valider puis fusionner A sans changement de comportement utilisateur.
- [ ] Valider B sur A, y compris les chemins générique, PCAET et Excel.
- [ ] Compléter les données métier et vérifier leur déploiement.
- [ ] Qualifier le parcours complet en préproduction, puis ouvrir un pilote.

Une case cochée décrit une étape réalisée, pas un déploiement. Les vérifications
des anciennes PRs ne remplacent pas celles des deux nouvelles compositions.
Le socle de contrats et d'API de suivi #5702 est déjà dans `main`.

## PR A — Fondations sans changement utilisateur

**But :** livrer les contrats et refactorings réutilisés par B en conservant
le comportement actuel des utilisateurs, y compris sur les chemins backend
actifs.

**Contenu :**

- Contrats métier, catalogue `electrification-v1`, résolveurs des engagements,
  fiches et URL TeT, préparation sans écriture et éligibilité interne.
- Séparation du coordinateur des jobs et du générateur documentaire, contrat
  commun de résultat/échec et `CompletePlanImportService`. La transaction
  appartient toujours à l'appelant ; finalisation et effets après commit
  conservent leur ordre et leur comportement.
- Politique PCAET interne pour le choix actuel de `withSecteurs`. Les jobs
  PCAET restent publics `generic` ; aucun profil public supplémentaire dans A.
- Enum partagé `GENERIC`/`ELECTRIFICATION`, mêmes valeurs publiques `generic`
  et `annexe-3-electrification`. Électrification reste refusé. Messages d'erreur
  déplacés sans changer leur texte et schéma commun des tokens existants.
- Option de tracking `requireExplicitActivation` et caller du bypass diagnostic
  PCAET déplacés ensemble : son activation reste explicite ; aucun
  nouveau flag ni changement de défaut pour les autres appelants.
- Transaction appelante facultative pour la création des indicateurs et les
  sources, méthode interne de liens additifs. Les appels existants et les
  anciens upserts de liens conservent leurs contrats.

Le frontend, le schéma SQL, les lecteurs documentaires et les calculs restent
identiques à `main`. Des services actifs sont refactorisés ; leurs effets,
formats, erreurs et contrats restent identiques. Les résolveurs Électrification
et les nouvelles méthodes de liaison ne sont pas raccordés à un import public.
Le blocage actuel de création Électrification reste en place.

**Données métier :** 11 axes, 41 sous-axes et deux cibles E07 validées ; les
109 actions, 58 sous-actions et 113 codes d'indicateurs Grist sont intégrés.
Les correspondances TeT des 113 indicateurs restent `pending`, avec une
référence `null`. Le mapping lauréats contient
105 correspondances, dont 28 porteurs de groupements provisoires ; 4 cas
restent en attente.
Les neuf autres cibles restent `pending`, avec une périodicité `annuelle`.
L'unité canonique E09 est `nb`. Ces réponses sont intégrées au catalogue ;
les définitions déployées et les décisions encore ouvertes restent à vérifier.
Une donnée de test ne remplace pas une validation métier. La version v1 est
conservée jusqu'à la qualification initiale ; elle ne suit pas les numéros
des PRs ni la version de Grist.

**Critères de validation de A élargie :**

- [x] Typage et lint des contrats/services ; données publiées, parents
      explicites, permissions et erreurs de configuration vérifiés.
- [x] Imports générique/PCAET identiques : mêmes formats, plan immédiat,
      secteurs, erreurs, finalisation et reprise des checkpoints historiques.
- [x] Transaction de création et propriétaire inchangés ; un échec de
      finalisation annule les écritures, les effets externes gardent leur ordre.
- [x] Bypass diagnostic PCAET toujours explicite et autres flags inchangés ;
      aucune nouvelle valeur de profil admise par l'API.
- [x] Primitives transactionnelles et liens additifs vérifiés ; anciens
      upserts et appelants sans transaction explicite inchangés.
- [x] Résolveurs Électrification non raccordés ; frontend, SQL, lecteurs et
      calculs identiques à `main`.
- [x] Checks de la PR sur son commit `5938e7d5fe`, indépendamment de B.
- [ ] Checks CI des nouveaux commits intégrant la relecture des specs du 11 novembre.

**Vérification de A élargie — 10 novembre 2026.** Le build Nx du domaine
et le build Nest du backend passent, ainsi que le typage des specs backend et
le lint des fichiers TypeScript modifiés ou créés. Les 47 tests unitaires du
service de génération, du worker, de création d'indicateurs et des sources
passent, ainsi que 221 e2e répartis sur dix suites : parcours complet
(16, dont deux nouveaux cas de rollback lors de la finalisation du plan/job),
admission (9), suivi (16), liens d'indicateurs (14), création d'indicateurs (14),
sources (4), fiches (54), engagements (43), URL (33) et éligibilité (18).

La suite PCAET supplémentaire de transmission pour avis compte trois succès
et onze échecs : huit définitions d'indicateurs nécessaires manquent dans le
dump local. Le test modifié du bypass diagnostic passe et vérifie l'activation
explicite. Ce résultat local ne vaut pas validation globale du parcours PCAET.
La CI du commit `5938e7d5fe` est verte, dont les tests backend et navigateur
sur la base CI complète. La comparaison avec `main` confirme l'absence de changement
du frontend, du SQL, des lecteurs de documents et des calculs d'indicateurs.
Aucun modèle externe réel n'a été appelé. Les 187 e2e du premier découpage
restent une preuve historique distincte dans l'ADR.


**Vérification des périodes, unités et aides — 11 novembre 2026.** A seule passe ses
105 e2e de résolution (45 engagements, 60 fiches), les builds domaine/backend,
le typage des specs et le lint ciblé. Frontend, SQL, lecteurs et calculs restent
identiques à `main`. La CI des nouveaux commits reste à vérifier.

**Vérification de la liste lauréats — 11 novembre 2026.** Les 21 e2e
d'éligibilité passent après intégration de la liste et de l'absence d'expiration,
sur une nouvelle copie isolée du dump. Builds domaine/backend, typage des specs,
lint ciblé et liens locaux passent. Les suites précédentes ne sont pas relancées
pour cet ajustement ; les IDs de préproduction restent à vérifier.

**Vérification du catalogue d'actions — 11 novembre 2026.** Les données livrées
ont été comparées aux six tables Grist. Les 111 e2e de A passent (66 fiches,
45 engagements), avec les actions réelles et les correspondances incomplètes.
Builds domaine/backend, typage des specs, lint ciblé et liens locaux passent.
Les tests utilisent une base isolée sans snapshots de scores et un modèle
simulé ; l'admission publique reste fermée.
Après rebase, les 148 e2e de fiches/extraction de B, son build backend et le
typage des specs passent également. La recette navigateur reste à effectuer.

**Déploiement :** A peut être livrée seule lorsque ces critères passent.
Aucun nouveau profil n'est ouvert, aucune migration ni nouvelle configuration
PostHog n'est requise. Un retour au code précédent conserve les contrats des
jobs et les données produites par les parcours existants.

## PR B — Import complet

**But :** reprendre les changements fonctionnels et raccorder les fondations
de A, puis qualifier le fonctionnement intégré. Les refactorings actifs qui
préservent le comportement actuel sont déjà dans A.

| Ensemble              | Contenu à revoir et vérifier                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Profils et PCAET      | Profil public PCAET distinct utilisant le moteur multiformat commun ; reprise des anciens jobs PCAET `generic` avec leurs options et checkpoints inchangés.                                      |
| Suivi et navigation   | Historique, accès persistant au job et aux erreurs, liens depuis le plan, absence de `planId` avant succès pour Électrification. Le générique/PCAET garde son plan immédiat.                     |
| Lecture et extraction | Conservation des liens/localisations, parser du DOCX officiel V4, assistance IA limitée aux valeurs numériques non comprises, checkpoints compatibles.                                           |
| Persistance commune   | Structure explicite, raccordement des primitives de A, complétion sans écrasement, isolation des calculs et effets externes après commit.                                                        |
| Schéma et provenance  | Migration additive sur `axe` et `fiche_action`, références catalogue et parent exact à l'import, engagements sélectionnés et métadonnée de source propre au plan. Aucune nouvelle entité métier. |
| Jobs et admission     | Résolveurs de A raccordés, transaction finale, compte rendu, concurrence, reprise, contrôles de droits, d'éligibilité et de configuration.                                                       |
| App et création       | Profils, capacités serveur, cibles séparées des objectifs locaux, flag de création pour tous les parcours Électrification.                                                                       |

Le regroupement ne réduit pas la migration à un détail de raccordement :
revoir explicitement ses contraintes, ses droits et son rollback avec les
services qui la consomment. Les champs durables ne sont pas déplacés dans le
JSON des jobs et ne sont pas abandonnés. Les décisions détaillées restent
celles de l'ADR, sections 3 et 4.

Les fichiers de B qui ne sont pas livrés dans A sont consultables sur la
[branche d'implémentation](https://github.com/incubateur-ademe/territoires-en-transitions/tree/feat/electrification-plan-import).

**Critères de validation de B reconstruite :**

- [ ] Historique, navigation, création, édition et duplication vérifiés dans
      les e2e navigateur existants, avec permissions et erreurs réseau.
- [x] Nouveau profil PCAET et moteur multiformat commun vérifiés ; reprise
      des anciens jobs `generic` sans changement de profil ni ré-extraction.
- [x] Non-régression des imports générique, PCAET et Excel et des lectures,
      valeurs, calculs, créations et duplications de plans ordinaires.
- [x] Parser et assistance sur DOCX synthétiques avec faux LLM : références
      bloquantes, erreurs localisées, preuves contrôlées et aucun appel lorsque
      le parser suffit.
- [x] Full flow avec base locale et faux LLM : aucun plan Électrification
      avant validation, rollback total, liens seuls pour les URL, conservation
      des valeurs et absence de doublon après reprise ou concurrence.
- [x] Contraintes et usages de la migration vérifiés sur la base locale :
      droits, références durables, sélection initiale, parent catalogue exact,
      duplication sans provenance et métadonnées distinctes entre plans.
- [x] Compatibilité des contrats et checkpoints de chaque profil ; aucune
      ré-extraction ni réattribution de version automatique.
- [x] Flag fermé côté backend : nouveaux parcours Électrification bloqués,
      plans existants accessibles/modifiables, imports admis capables de terminer.
- [ ] Checks de la PR sur son commit final et recette de la version intégrée.

**Vérification de B reconstruite — 10 novembre 2026.** 404 tests backend
passent sur 14 suites (386 e2e et 18 tests du lecteur documentaire), dont
les nouveaux profils/checkpoints PCAET et les deux rollbacks de finalisation.
Les deux assertions de reprise corrigées comptaient deux fois le même appel
de classification ; les 31 tests de leur suite ont été rejoués avec succès.
S'ajoutent 73 tests unitaires existants de génération/worker/admission et
18 tests frontend sur quatre suites. Builds domaine/backend/API, typages
backend/app/specs/Storybook/e2e et lint ciblé passent. La migration a passé
son deploy et son verify sur la base locale.

La suite navigateur d'import compte 15 succès et un échec intermittent :
après fermeture du compte rendu PCAET, la modale a réaffiché le résultat
terminé au lieu du formulaire. Le même scénario a ensuite passé cinq relances
tracées sans modification. Le nouveau cas de chargement retardé du type PCAET
passe. La cause de l'échec intermittent reste à établir ; aucune attente
artificielle ni correction spéculative n'a été ajoutée.

Le deploy, le verify et le revert SQL passent. Les colonnes temporaires de
test ont été retirées, les 21 jobs running initiaux conservés et les services
locaux remis à l'arrêt. La CI finale de B et la recette intégrée en préproduction
restent requises. Les 396/18 tests du premier découpage sont des preuves historiques
distinctes dans l'ADR. Aucun modèle externe réel n'a été appelé.

Ces tests vérifient le code avec des fixtures. Ils ne démontrent pas la fidélité
du modèle réel ni la couverture de documents réellement remplis, encore
indisponibles lors de la conception. Privilégier les e2e existants ; aucun
nouveau fichier de test unitaire n'est requis pour ce regroupement.


**Vérification des ajustements du 11 novembre 2026.** Les 245 e2e ciblés
(engagements, fiches/extraction, agrégat, persistance, parcours complet) et les
16 tests unitaires existants de l'agrégat passent sur B. Builds domaine/backend,
typage des specs et lint ciblé passent. Les tests utilisent une copie isolée
du dump, avec upload Storage et modèle IA simulés. Les vérifications plus
larges ci-dessus datent du 10 novembre ; la recette navigateur n'a pas été rejouée.

**Ordre de déploiement de B :** déployer tous les workers capables de lire le
profil `pcaet` avant l'API et le frontend qui le produisent. Si API et workers
partagent un déploiement, suspendre les nouveaux enfilements pendant leur
remplacement. Les workers de A ne reconnaissent pas ce nouveau profil.
Le flag Électrification ne protège pas cette évolution PCAET. Un retour vers A
nécessite d'arrêter les nouvelles admissions et de laisser terminer les jobs
`pcaet` déjà admis avec les workers de B ; ne pas les réétiqueter `generic`.

## Dépendances métier avant ouverture

Les constats détaillés et leurs sources figurent dans
[l'ADR](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md#questions-ouvertes-et-dépendances-avant-ouverture).

| Dépendance                   | État et action restante                                                                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sous-axes                    | 41 numéros, titres et parents vérifiés dans Grist ; repris dans A.                                                                                                                                         |
| E07                          | Deux références confirmées, unité "Nombre de bornes" et périodicité annuelle validées dans la source TeT et le dump local ; vérifier les définitions/dépendances déployées.                                |
| Autres cibles                | Neuf périodes annuelles intégrées, sans lever les statuts `pending`. Vérifier les 11 références et leurs dépendances dans l'environnement cible.                                                           |
| E08                          | Faire valider formule, dénominateurs et périmètre autobus/autocars : la formule publiée additionne deux pourcentages de parcs différents.                                                                  |
| E09                          | Unité canonique `nb` intégrée dans A ; traduction documentaire ciblée dans B, également appliquée aux checkpoints lors d'une reprise.                                                                       |
| Actions et sous-actions      | 109 actions et 58 sous-actions intégrées, avec identités internes fixes, rattachements principaux, 89 liens d'indicateurs et 354 liens vers 107 ressources partagées. Le parent exact reste conservé à l'import. |
| Indicateurs Grist             | 113 codes et métadonnées explicites intégrés, correspondances TeT `pending`. Faire préciser ces correspondances, le seuil ≥150 kW de `6-b`, les unités principales de `1-a`/`1-b`/`1-c` et la période des deux comptes "Ponctuelle". |
| Aides                        | Contrat et résolution des liens dans A ; persistance transactionnelle dans "Documents" dans B. Faire préciser le traitement des ressources sans URL avant d'importer une action qui en utilise une.       |
| Lauréats                     | Liste du 30 septembre intégrée pour 105 lauréats : 77 correspondances vérifiées et 28 porteurs provisoires. Quatre groupements restent exclus. Confirmer les porteurs et le responsable des mises à jour ; vérifier les IDs en préproduction. |
| Préproduction                | Vérifier les jobs présents et leurs versions, déployer les définitions et qualifier le parcours complet. Le dump local ne prouve pas l'état actuel de la préproduction.                                    |

Aucune correspondance n'est déduite d'un titre par le code ou l'IA. Aucun accès
à Notion ou Grist n'a lieu pendant l'import. Les données validées sont livrées
dans Git et les définitions restent dans le catalogue TeT.

**Suite de la relecture du 10 novembre :**

- [x] Relire les specs et commentaires, les deux Grist, la source TeT des
      définitions et les fichiers lauréats ; distinguer réponses et lacunes.
- [x] Publier les questions restantes dans les discussions concernées, liées
      dans l'ADR ; retirer les questions déjà résolues par les sources.
- [x] Intégrer les périodes annuelles dans A et la traduction d'unité E09
      dans B, avec reprise des checkpoints documentaires existants.
- [x] Transporter les aides avec URL et les ajouter aux nouvelles fiches via
      la persistance de documents existante ; préserver les fiches liées par URL.
- [x] Intégrer les 109 actions et 58 sous-actions avec leurs identités stables,
      descriptions, parents et liens vers les indicateurs et ressources.
- [x] Conserver les 113 codes d'indicateurs connus avec leurs métadonnées
      explicites et des correspondances TeT `pending`, sans définition inventée.
- [x] Intégrer la dernière liste lauréats pour 105 correspondances, dont 28
      porteurs provisoires, avec les deux corrections sourcées ; garder les
      quatre groupements sans correspondance fiable en attente.
- [x] Autoriser l'absence d'expiration quand la source n'en prévoit pas ;
      préserver le contrôle des mappings qui ont une borne de fin.
- [ ] Corriger les quatre groupements exclus, confirmer les porteurs provisoires
      et la maintenance de la liste.
- [ ] Compléter les correspondances et la formule E08 après réponse ; vérifier
      les définitions et les rattachements réellement déployés.

Les ajustements du 11 novembre ne lèvent pas l'admission : le catalogue
reste incomplet. L'éligibilité est désormais vérifiable pour 105 collectivités.
Le contrôle global des correspondances est
une politique technique actuelle, pas une règle explicitement imposée par les
specs. Une aide sans URL bloque seulement l'action concernée à la résolution,
sans créer un nouveau blocage global pour les actions non sélectionnées.

## Déploiement de B et ouverture

1. Garder `is-electrification-plan-creation-enabled` fermé. Valider les checks
   et la recette des parcours existants : le flag n'isole pas les modifications
   de l'historique ni celles des services partagés.
2. Appliquer la migration additive, puis déployer les API, tous les workers et
   l'app compatibles. Aucun job d'un nouveau profil public ne doit être admis
   pendant qu'un ancien worker peut encore consommer la queue commune. Les
   anciens jobs PCAET `generic` gardent leurs contrats de reprise.
3. Vérifier les éventuels jobs de préproduction et traiter les versions non
   compatibles avec leur code/catalogue d'origine. Ne pas réétiqueter les jobs.
4. Compléter les dépendances métier, qualifier les documents et comparer
   parser seul et assistance sur un corpus annoté dès que des documents remplis
   sont disponibles. Mesurer aussi les valeurs incorrectes acceptées, pas
   seulement les rejets. Tout appel réel à un modèle reste lancé par un humain.
5. Recetter le parcours complet en préproduction, puis ouvrir un pilote de
   lauréats validés. L'ouverture du flag ne remplace ni l'éligibilité ni les
   droits et ne contourne pas une configuration incomplète.

Le flag couvre création manuelle, import Excel, duplication, changement vers
le type Électrification et nouveaux imports dédiés. Son activation explicite
est requise, y compris en dev/test/CI et pour le super-admin. Sa fermeture
laisse terminer et reprendre les imports déjà admis, sous réserve de contrats,
droits et éligibilité toujours valides.

Une donnée écrasée, un mauvais rattachement, un plan partiel/doublon ou une
faille de droits entraîne la fermeture de l'admission et le traitement des
jobs actifs avant reprise. La queue étant partagée, sa mise en pause peut
aussi suspendre le générique. Vérifier cette procédure en préproduction.

**Retour arrière :** conserver le schéma et les données. Une fois des jobs
Électrification admis, garder des API, workers et lecteurs capables de les
traiter ; fermer le flag ne permet pas de revenir à un worker générique ancien.
Le revert SQL est réservé à un schéma encore inutilisé. Aucun plan, lien,
indicateur ou objectif n'est supprimé automatiquement.

## Suite facultative et hors périmètre

Les budgets et financements restent une extension facultative après le socle.
Leur absence ne bloque pas l'ouverture : signaler les champs non repris. Une
future livraison utilisera les modèles actuels, sans `budgetPrevisionnel`
déprécié, préservera les montants existants et les checkpoints antérieurs.

Restent hors périmètre : dashboard ADEME, ajout d'actions du catalogue après
import, modification des engagements, réimport avec fusion, gestion native
des groupements, export Word et migration/suppression automatique des plans
existants.

[pr-foundations]: https://github.com/incubateur-ademe/territoires-en-transitions/pull/5812
[pr-import]: https://github.com/incubateur-ademe/territoires-en-transitions/pull/5813
