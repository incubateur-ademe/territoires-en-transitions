---
title: 'feat: Import du plan Électrification'
type: feat
status: in-progress
date: 2026-11-04
---

# Import du plan Électrification

Dernière mise à jour : 2026-11-13.

Ce plan applique l'[ADR 0022](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md).
Il remplace le découpage en quinze PRs par deux livraisons. Les décisions,
sources et preuves des anciens lots restent dans
[l'historique de l'ADR](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md#historique-des-décisions-et-des-prs).
Les deux PRs suivent le périmètre élargi : A reprend aussi les refactorings
actifs sans changement de comportement ; B garde les évolutions fonctionnelles.
L'import Électrification n'est pas qualifié pour une ouverture en production.

La publication des configurations sans déploiement fait l'objet de la
[PR #5815](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5815),
distincte et basée sur B : `feat/electrification-data-publication`. B conserve
ses données embarquées et reste déployable sans cette évolution.

Les [retours de recette TT-67 du 11 novembre][retours-tt67] sont intégrés au
périmètre de B. Leur validation locale est décrite ci-dessous ; la recette
de la version déployée reste à effectuer.

## Livraisons et avancement

| Livraison                           | Base → branche                               | État                                                                                                      |
| ----------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [PR A — Fondations][pr-foundations] | `main` → `refactor/plans-import-foundations` | Builds et tests ciblés passés ; CI des ajustements du 11 novembre à vérifier ; un commit ; non fusionnée. |
| [PR B — Import complet][pr-import]  | A → `feat/electrification-plan-import`       | Reconstruite sur A élargie ; draft ; un commit ; qualification finale et métier restante.                 |

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

**Organisation des configurations — 12 novembre 2026 :**

- [x] Regrouper les six configurations métier dans le dossier
      `packages/domain/src/plans/plans/electrification/config/` et les tokens
      d'injection dans le dossier `config/` Électrification du backend.
      Conserver les valeurs et les exports publics du domaine.
      Validation du déplacement : typage domaine/backend et specs, lint et
      132 e2e (engagements, fiches, éligibilité) réussis avec un faux LLM.

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
simulé ; l'admission publique était encore fermée à ce stade.
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

Une migration de données fournit aussi le type "Plan Électrification" sur
une base neuve. Elle conserve son ID s'il existe déjà et ne supprime pas ce
type au rollback. Les tests utilisent cette donnée livrée par la migration.

Les fichiers de B qui ne sont pas livrés dans A sont consultables sur la
[branche d'implémentation](https://github.com/incubateur-ademe/territoires-en-transitions/tree/feat/electrification-plan-import).

**Organisation des configurations — 12 novembre 2026 :**

- [x] Regrouper les constantes du canevas dans le dossier `config/`
      Électrification du backend et les paramètres du formulaire dans celui
      du frontend. Reprendre les emplacements du domaine livrés dans A.
      Validation du déplacement : typage domaine/backend/API/frontend et specs,
      lint et 168 e2e (extraction/résolution, parcours complet) réussis avec un
      faux LLM. Les sources ne diffèrent que par leurs chemins d'import.

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
- [x] Admission avec un catalogue partiellement validé : les références non
      utilisées ne bloquent pas ; une référence utilisée incomplète, y compris
      un complément automatique, échoue avant création. Un catalogue incohérent
      reste refusé dès l'admission.
- [ ] Checks de la PR sur son commit final et recette de la version intégrée.

**Exception de quota pour la recette et le support — dans B :**

- [x] Vérifier dans les e2e existants qu'un super-admin actif peut dépasser
      le quota journalier, sans suppression de l'historique. Les profils
      générique, PCAET et Électrification partagent cette règle d'admission.
- [x] Vérifier le maintien du quota pour un éditeur et pour le support sans
      mode super-admin actif, y compris après des imports échoués, ainsi que
      des limites de concurrence globale et par collectivité.
- [ ] Reporter la correction dans #5815, redéployer en préproduction et
      reprendre la recette TT-67 sur la démo 5460 en mode super-admin.
      Chaque import réel est lancé par un humain.

Validation locale du 12 novembre : 29 e2e HTTP d'admission, 33 tests du service
et 13 tests de permissions réussis. Queue et LLM simulés ; typage
domaine/backend/specs et lint ciblé réussis. La recette préproduction reste
à reprendre après redéploiement.

**Ajustements après la recette produit du 11 novembre :**

- [x] Vérifier le texte d'upload "Annexe 3 de la convention signée sur Word",
      sans modifier les contrôles DOCX/taille, et l'usage d'"action" dans
      l'interface et les étapes de progression de l'import.
- [x] Vérifier qu'une relance après correction conserve titre, type et options,
      permet de remplacer le fichier et crée un nouvel import ; une reprise
      du même job conserve sa source et ses checkpoints.
- [x] Vérifier l'affichage unique des erreurs, leurs localisations métier
      (action, engagement, indicateur, sous-action) et une correction concrète,
      notamment pour un sous-axe inconnu ou une année de référence manquante.
- [x] Vérifier qu'une configuration manquante est à traiter par l'équipe,
      sans demander à la collectivité de modifier un document valide.
- [x] Vérifier l'omission d'une aide sans URL avec un avertissement, sans
      blocage de l'action ; une URL renseignée mais invalide reste bloquante.

Les quatre premiers points viennent de [TT-67][retours-tt67] ; le dernier
applique la [réponse de Clément du 11 novembre à 11:19 UTC][decision-aides].
Afficher toutes les erreurs du document en une fois reste une piste produit,
sans engagement de validation exhaustive dans ce lot. Les questions E08,
recharge ≥150 kW, unités et correspondances TeT restent ouvertes. Le suivi
annuel des deux recensements est retenu le 12 novembre et intégré dans la
configuration ; il ne valide pas leurs correspondances TeT.

**Retours complémentaires TT-67 du 12 novembre — PR B :**

- [x] Vérifier les nouveaux libellés de l'objectif et de son infobulle sur la
      page indicateur après un nouvel import.
- [x] Vérifier les cartes compactes sans blocs objectifs/cibles et la
      conservation des valeurs locales et conventionnelles.
- [x] Vérifier l'annonce de l'absence d'import des budgets et financements.
- [x] Vérifier qu'un import Électrification termine au statut actif sans
      auteur/date de validation humaine ; générique/PCAET restent à vérifier.
- [x] Vérifier la liste stable lecture/extraction/création, les coches et le
      loader pendant l'attente et le traitement, y compris après rechargement.
- [x] Masquer les étapes après échec en conservant compte rendu et actions de
      relance/reprise ; réafficher la progression pendant une reprise.
      Périmètre retenu pour le [retour de Clément à 17:28][retour-etapes-tt67],
      formulé dans le fil sur l'écran d'erreur.
- [x] Vérifier les titres "Erreur"/"Avertissement" et le cas d'une action
      résolue par code avec une aide sans URL, sans perdre ses sous-actions
      ni ses autres documents.
- [x] Clarifier les erreurs de configuration signalées par Ugo : contacter
      le support TeT, puis relancer l'import avec le même document une fois
      le catalogue corrigé. Ne pas suggérer qu'une prise en charge automatique
      est déjà en cours ; conserver les corrections du Word pour ses erreurs.
- [x] Retenir le suivi annuel proposé par Émeline et [confirmé par Clément
      à 17:28][decision-annuelle-tt67]. Le défaut annuel existant est conservé,
      sans changement de configuration. Conserver les validations `pending`
      tant que les correspondances et définitions concernées ne sont pas confirmées.
- [ ] Rejouer en préproduction le nouveau Word de Clément avec les codes.
      L'absence d'URL de ChargeFrance reste une donnée source à compléter,
      sans bloquer son action ni inventer de lien.
- [ ] Vérifier dans la cible la publication des définitions d'engagement avec
      leur périodicité annuelle ; l'accord produit ne prouve pas que
      le Sheets ou la base déployée ont été mis à jour.

[retour-etapes-tt67]: https://app.notion.com/p/4156523d57d780a9bf20ec12b9bae893?d=4156523d57d78155988c001ccc7ff90f
[decision-annuelle-tt67]: https://app.notion.com/p/4156523d57d780a9bf20ec12b9bae893?d=4156523d57d781408015001cc3cbcce5

**Validation du 13 novembre :** 3 scénarios Playwright existants réussis
(Électrification, échec générique après rechargement, reprise), 4 tests du
composant existant, lint ciblé et liens locaux vérifiés. Les appels d'import
sont interceptés et le backend de test utilise un faux LLM. La publication
des définitions annuelles et la recette en préproduction restent à vérifier.

- [x] Autoriser la recette sur une collectivité non lauréate en mode super-admin
      actif, avec la même règle pour les capacités, l'admission et la création.
      Conserver le flag, les validations et les refus pour les sessions ordinaires
      ou limitées ; ne pas modifier la liste des lauréats. Vérifié par le parcours
      e2e complet avec faux LLM et les scénarios d'éligibilité existants :
      47 tests réussis sur B. Invalider les requêtes du frontend lors du
      changement de mode pour recalculer les capacités du formulaire : un
      scénario Playwright vérifie leur rechargement et le retrait du formulaire
      sans reload manuel. Typages backend/API/frontend/specs et lint vérifiés.

**Correction CI du 13 novembre :** les deux assertions de finalisation
générique utilisent désormais le contrat `{ planId, requiresVerification }`,
avec vérification humaine requise. Les 35 tests existants du service et le
lint ciblé passent. L'échec du job navigateur précédent venait de
`actions/setup-node` avant lancement des tests ; vérifier le nouveau run CI.

Vérification ciblée des précisions Ugo/Émeline : 194 e2e existants de résolution
réussis, typage backend, lint ciblé et liens locaux vérifiés. Aucun appel IA
réel ni publication de données ; recette des messages en préproduction restante.

Les plans de recette déjà créés peuvent être recréés ; aucun rattrapage ni
changement de schéma, conformément au choix du 12 novembre.
Le suivi annuel des deux recensements est déjà intégré ; les correspondances
Grist/TeT encore inconnues restent une dépendance métier.

**Validation des retours du 12 novembre :** 200 e2e backend réussis (149
résolution/extraction, 20 parcours Électrification et 31 génériques/PCAET),
16 tests frontend existants et 5 scénarios Playwright. Typages domaine,
backend/API/frontend et specs backend, build Nest, lint et liens locaux
vérifiés. Les lancements navigateur sont interceptés, le backend emploie un
faux LLM ; aucun appel IA payant. La recette du document réel reste ouverte.

**Validation locale de ces ajustements — 11 novembre 2026.** 199 e2e backend
réussis (149 extraction/résolution, 19 parcours complets, 31 suivi/historique),
16 tests frontend existants et cinq scénarios Playwright : DOCX/libellé,
relance après rechargement avec fichier remplacé et options conservées,
relance depuis l'historique et nouvel import vierge, import PCAET depuis les
documents, fermeture/réouverture de la modale PCAET. Une nouvelle erreur
technique reste affichée même si un ancien rapport existe. IA simulée et
requêtes d'import navigateur interceptées ; aucun appel payant. Build backend,
typage domaine/backend/specs/app et lint ciblé réussis. Le typage global e2e
reste bloqué par deux erreurs `TS2883` dans les fixtures de mobilisation
existantes, hors fichiers modifiés. Ces contrôles locaux sous Node 26 ne
remplacent pas la CI sur la version supportée ni la recette préproduction.

L'harmonisation des messages exposés par le pipeline générique vers "actions"
est également vérifiée : 98 tests existants passent, sans nouveau fichier de
tests ni modification des titres importés.

**Vérification de l'admission ciblée — 11 novembre 2026.** 187 e2e passent
(148 fiches/extraction, 14 parcours complets, 25 admission HTTP). Le catalogue
livré permet E03/E12 et `1.4.1` ; une cible ou un complément indicateur utilisé
encore en attente bloque sans écriture métier. Les tests HTTP utilisent le
stockage simulé et des JWT signés localement, avec les guards et quotas réels.
Build backend et dépendances, typage des specs, lint/formatage ciblés et liens
locaux passent. La recette de préproduction et l'ouverture du flag restent à faire.

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

### Mesure d'usage des imports dans B

La [PR B][pr-import] complète les événements PostHog existants pour les trois
profils et la navigation qu'elle introduit. Ce suivi reste indépendant de la
publication des données de #5815 et ne modifie pas le parcours d'import.
Le contrat des événements et leur interprétation figurent dans
[l'ADR](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md#7-mesurer-lusage-des-imports-dans-posthog).

- [x] Partager le profil, les identifiants, la tentative et les versions sur
      les événements serveur ; qualifier les refus par profil demandé.
- [x] Suivre les clics vers l'historique, le détail et le plan, et rattacher
      les clics de reprise/nouvel essai au job concerné.
- [x] Ajouter l'environnement aux captures frontend/backend pour distinguer
      production, préproduction, staging et tests locaux.
- [x] Vérifier les parcours générique/PCAET/Électrification, les échecs et
      reprises avec les e2e existants et un faux LLM, sans capture PostHog réelle
      pour les nouvelles assertions.
- [ ] Après déploiement, vérifier la réception en préproduction des événements
      serveur et des clics, leur profil, leur groupe collectivité et leur environnement.
- [ ] Configurer les vues produit dans PostHog : adoption par profil/collectivité,
      résultats par job/tentative, refus, reprises et accès aux comptes rendus.
      Filtrer la production explicitement ; ne pas compter une reprise comme un
      nouvel import ni un clic comme une consultation effective.

## PR dédiée — Publication des données sans déploiement

Séparer l'administration du catalogue et des lauréats dans
`feat/electrification-data-publication`, basée sur B
([#5815](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5815)). Cette PR porte la
publication, le chargement des données publiées, les tests et la procédure
de bascule. Ses critères et preuves figurent dans le plan de cette branche.
La première publication des données est un prérequis de cette livraison,
pas de B.

## Dépendances métier avant ouverture

Les constats détaillés et leurs sources figurent dans
[l'ADR](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md#questions-ouvertes-et-dépendances-avant-ouverture).

| Dépendance              | État et action restante                                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sous-axes               | 41 numéros, titres et parents vérifiés dans Grist ; repris dans A.                                                                                                                                                                                                        |
| E07                     | Deux références confirmées, unité "Nombre de bornes" et périodicité annuelle validées dans la source TeT et le dump local ; vérifier les définitions/dépendances déployées.                                                                                               |
| Autres cibles           | Neuf périodes annuelles intégrées, sans lever les statuts `pending`. Vérifier les 11 références et leurs dépendances dans l'environnement cible.                                                                                                                          |
| E08                     | Faire valider formule, dénominateurs et périmètre autobus/autocars : la formule publiée additionne deux pourcentages de parcs différents.                                                                                                                                 |
| E09                     | Unité canonique `nb` intégrée dans A ; traduction documentaire ciblée dans B, également appliquée aux checkpoints lors d'une reprise.                                                                                                                                     |
| Actions et sous-actions | 109 actions et 58 sous-actions intégrées, avec identités internes fixes, rattachements principaux, 89 liens d'indicateurs et 354 liens vers 107 ressources partagées. Le parent exact reste conservé à l'import.                                                          |
| Indicateurs Grist       | 113 codes et métadonnées explicites intégrés, correspondances TeT `pending`. Faire préciser ces correspondances, le seuil ≥150 kW de `6-b`, les unités principales de `1-a`/`1-b`/`1-c`. Les recensements `9.1.1-a` et `11.1.1-a` sont annuels (décision du 12 novembre). |
| Aides                   | Liens valides ajoutés dans "Documents". Réponse du 11 novembre : omettre les aides sans URL avec un avertissement, sans bloquer l'action. Vérifier cette évolution dans B ; une URL renseignée mais invalide reste bloquante.                                             |
| Lauréats                | Liste du 30 septembre intégrée pour 105 lauréats : 77 correspondances vérifiées et 28 porteurs provisoires. Quatre groupements restent exclus. Confirmer les porteurs et le responsable des mises à jour ; vérifier les IDs en préproduction.                             |
| Préproduction           | Vérifier les jobs présents et leurs versions, déployer les définitions et qualifier le parcours complet. Le dump local ne prouve pas l'état actuel de la préproduction.                                                                                                   |

Aucune correspondance n'est déduite d'un titre par le code ou l'IA. Aucun accès
à Notion ou Grist n'a lieu pendant l'import. Les données validées sont livrées
dans Git et les définitions restent dans le catalogue TeT.

**Réponse métier du 12 novembre intégrée :**

- [x] Passer les recensements des entreprises artisanales (`9.1.1-a`) et des
      exploitations (`11.1.1-a`) en suivi annuel dans la configuration, en
      conservant le type quantitatif, l'unité `nb` et les correspondances TeT
      `pending`. Le choix de périodicité est clos ; les identifiants restent à
      confirmer (voir la décision du 12 novembre dans l'ADR).

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
- [x] Ajouter dans B l'admission de la collectivité de démonstration `5460`
      avec la référence synthétique `demo-5460`, distincte des 105 lauréats.
- [x] Configurer le flag PostHog pour la seule collectivité `5460` ; ciblage
      vérifié le 11 novembre sur le flag créé par Émilien.
- [x] Vérifier dans le navigateur l'accès au formulaire Électrification sur
      `5460` sans mode super-admin, la restriction DOCX et l'admission du job.
- [x] Vérifier la mise à jour du backend de test préprod, responsable du
      premier échec, vers une version compatible avec l'import dédié.
- [x] Recetter E03/E12 et `1.4.1` : plan créé, six fiches dont trois sous-actions,
      compte rendu sans anomalie et navigation entre plan et import.
- [x] Recetter un DOCX à quatre fiches : cibles E07 120/30 en 2030, indicateur
      propre avec résultat zéro, dates partielles, champs libres, sous-actions
      et préservation d'une fiche existante liée par hyperlien Word.
- [x] Vérifier le refus d'une date réduite à l'année, avec erreur localisée
      et aucun plan associé à l'import.
- [ ] Étendre la recette aux références inconnues/inaccessibles, reprises,
      droits et autres correspondances métier ; qualifier l'assistance IA.
- [ ] Corriger les quatre groupements exclus, confirmer les porteurs provisoires
      et la maintenance de la liste.
- [ ] Compléter les correspondances et la formule E08 après réponse ; vérifier
      les définitions et les rattachements réellement déployés.

**Décision du 11 novembre :** dans B, l'admission et la reprise contrôlent
l'intégrité du catalogue ; les résolveurs exigent des correspondances complètes
uniquement pour les références utilisées, compléments automatiques inclus. Une
entrée `pending` non utilisée ne bloque plus un import ; une référence inconnue,
incomplète ou inaccessible utilisée bloque avant toute création. Après la
[réponse de Clément][decision-aides], une aide sans URL est omise avec un
avertissement et ne bloque plus l'action ; une URL renseignée mais invalide
reste bloquante. Le flag, les droits et l'éligibilité
restent requis ; 105 collectivités ont une correspondance métier livrée.

**Décision du 11 novembre — collectivité de démonstration :** B ajoute `5460`
avec la référence synthétique `demo-5460` pour la recette. Cette entrée ne
provient pas de la liste officielle et ne constitue pas une attribution du
programme. A conserve ses 105 correspondances ; B en contient 105 métier et
une de démonstration, soumise aux mêmes contrôles d'admission.

Les scénarios E03/E12 et `1.4.1` (réseau de chauffagistes), puis E07 avec ses
deux cibles et un indicateur personnalisé, sont recettés sur cette collectivité.
Les définitions `s_26` et `s_26.a` sont vérifiées en préproduction avec l'unité
et la périodicité attendues. Les autres correspondances restent à qualifier.

La seconde recette du 11 novembre réussit après mise à jour du backend de test
préprod : le plan `59229` contient les éléments attendus du scénario sans cible
chiffrée. Le plan `59234` valide ensuite le document plus complet ; sa variante
avec une date invalide est refusée sans créer de plan. Les preuves sont consignées dans
[l'ADR](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md#recette-navigateur-du-11-novembre-2026).

## Déploiement de B et ouverture

1. Garder `is-electrification-plan-creation-enabled` fermé. Valider les checks
   et la recette des parcours existants : le flag n'isole pas les modifications
   de l'historique ni celles des services partagés.
2. Appliquer la migration additive, puis déployer les API, tous les workers et
   l'app compatibles. Aucun job d'un nouveau profil public ne doit être admis
   pendant qu'un ancien worker peut encore consommer la queue commune. Les
   backends de test utilisant le même Redis sont également des consommateurs
   à vérifier. Les anciens jobs PCAET `generic` gardent leurs contrats de reprise.
3. Vérifier les éventuels jobs de préproduction et traiter les versions non
   compatibles avec leur code/catalogue d'origine. Ne pas réétiqueter les jobs.
4. Activer le flag pour la collectivité de démonstration `5460`, puis les autres
   collectivités de recette retenues, et tester d'abord un DOCX synthétique
   avec des références résolubles (E03/E12 et
   `1.4.1`). Vérifier aussi le refus d'une action avec un indicateur `pending`,
   sans plan ni fiche créés. Tout appel réel à un modèle reste lancé par un humain.
5. Compléter les dépendances métier pour les scénarios restants, qualifier les
   documents et comparer parser seul et assistance sur un corpus annoté dès
   que des documents remplis sont disponibles. Mesurer aussi les valeurs
   incorrectes acceptées, pas seulement les rejets.
6. Recetter le parcours complet en préproduction, puis ouvrir un pilote de
   lauréats validés. L'ouverture du flag ne remplace ni l'éligibilité ni les
   droits et ne contourne pas les références utilisées incomplètes.

**Configuration PostHog de la recette :** dans le
[projet TeT](https://eu.posthog.com/project/12975/feature_flags), utiliser le flag
booléen `is-electrification-plan-creation-enabled` avec une évaluation par
groupe `collectivite`. Reprendre le principe du
[contournement du diagnostic PCAET](https://eu.posthog.com/project/12975/feature_flags/275614),
avec une règle `collectivite_id` contenant `5460`, puis les autres collectivités
retenues pour cette recette, et un déploiement à 100 % de ce groupe ciblé.
Ne pas reprendre automatiquement la liste du flag PCAET ni ajouter de règle
ouverte à tous. Conserver le runtime `all`, sans contexte d'environnement.
**Vérification du 11 novembre :** le
[flag créé par Émilien](https://eu.posthog.com/project/12975/feature_flags/355720)
est actif, ciblé à 100 % sur le groupe `collectivite` dont `collectivite_id`
vaut `5460`, avec le runtime `all` et aucun contexte d'environnement. Aucune
autre collectivité n'est ciblée par cette configuration.

Le ciblage s'applique aux mêmes collectivités en préproduction et en production
avec le code compatible. Le serveur évalue déjà le flag avec la collectivité
courante et l'app lit ses capacités. Après déploiement de B, l'import dédié
peut être testé sur la collectivité de démonstration `5460`, explicitement
admise dans le mapping, ou sur une collectivité lauréate. Depuis la décision
du 13 novembre, le mode super-admin actif autorise aussi l'import pour une
collectivité hors liste, sans la déclarer lauréate. Le flag et les validations
restent requis ; une session ordinaire reste soumise à la liste.

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
[retours-tt67]: https://app.notion.com/p/4156523d57d780a9bf20ec12b9bae893
[decision-aides]: https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90?d=4146523d57d781b891ed001cee19a898
