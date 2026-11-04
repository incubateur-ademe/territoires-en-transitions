---
title: "feat: Import de l'annexe 3 Électrification"
type: feat
status: draft
date: 2026-11-04
---

# Import de l'annexe 3 Électrification

Ce plan décline l'[ADR 0022](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md)
en incréments déployables séparément. Il couvre l'import complet, depuis le
document jusqu'au plan et au suivi des cibles. Il ne reprend pas le
provisionnement automatique ni le verrouillage des anciens plans de travail.

**Sept phases : onze PR de code, puis une ouverture progressive.** Les budgets
et financements constituent une huitième phase facultative. Les numéros de PR
ci-dessous sont des lots à créer, pas des PR déjà ouvertes.

Chaque PR contient son code, ses migrations éventuelles, ses tests et la mise
à jour de sa documentation. Elle compile et fonctionne sans une PR suivante.
Les premières phases livrent des capacités complètes mais gardent l'import
annexe fermé. Il n'y a pas d'ouverture intermédiaire qui importerait seulement
les engagements ou ignorerait les indicateurs des fiches B.

## Découpage et ordre de livraison

| Phase | PR | Résultat autonome en production | Dépendances |
| --- | --- | --- | --- |
| 1. Contrats et suivi des jobs | 1A, 1B | Jobs historiques compatibles ; suivi retrouvable après fermeture ; admission annexe fermée côté serveur | Aucune phase suivante |
| 2. Données et références métier | 2A, 2B | Stockage et lecture des engagements prêts ; résolution des références testable sans import | Phase 1 |
| 3. Lecture et extraction de l'annexe | 3A, 3B | Document transformé en brouillon typé et validé, sans écriture métier | Phases 1 et 2 |
| 4. Primitives de persistance | 4A, 4B, 4C | Création et liaison sous transaction, sans écraser les données existantes | Phases 1 et 2 |
| 5. Import complet côté backend | 5 | Pipeline, reprise et transaction finale opérationnels ; admission toujours fermée | Phases 1 à 4 |
| 6. Parcours et lecture dans l'app | 6 | Parcours complet et cibles conventionnelles affichables ; ouverture toujours contrôlée | Phases 1 à 5 |
| 7. Qualification et ouverture | Pas de PR artificielle d'activation | Ouverture à un premier groupe de lauréats, puis élargissement | Phase 6 et prérequis métier validés |
| 8. Budgets et financements, facultatif | 8 | Import budgétaire additionnel ; le socle reste utilisable sans lui | Socle complet des phases 1 à 6 |

Les phases 3 et 4 peuvent être développées en parallèle après la phase 2.
À l'intérieur d'une phase, chaque PR peut être fusionnée et déployée avant la
suivante. Une phase terminée reste un état de production supporté si le travail
s'arrête là. Le nombre de PR n'est pas une estimation de délai : l'appétit
produit de deux semaines ne vaut pas engagement sur ces travaux.

Le découpage sépare les revues qui demandent des raisonnements différents :
contrats de jobs, extraction documentaire, intégrité des liens, concurrence
sur les valeurs. La PR 5 assemble des services déjà testés ; elle ne doit pas
devenir la PR qui implémente toutes les écritures. Éviter les PR de types seuls
ou de migrations inutilisables sans leur code associé.

## Règles communes de déploiement

- Réutiliser la queue BullMQ et les services existants. Ajouter un contrôle
  serveur dédié au profil annexe, avec le mécanisme de feature flags existant,
  explicitement fermé par défaut dans tous les environnements. Ne pas hériter
  de l'activation automatique en dev/CI ni du contournement super-admin du flag
  UI de l'import IA. Les droits et l'éligibilité restent des contrôles distincts.
- L'API publie la disponibilité du profil pour la collectivité. L'app ne le
  propose que si cette capacité est positive. Une API sans cette capacité ne
  reçoit pas de demande annexe ; aucun repli vers un import générique.
- Ne jamais ouvrir le profil avant remplacement de toutes les API et de tous
  les workers par des versions compatibles. L'ancienne API peut ignorer le
  champ `profile`, et l'ancien worker consomme la même queue avec seulement
  `{ jobId }` : une ouverture pendant leur coexistence peut créer un plan générique.
- Fermer l'admission interdit les nouveaux imports annexe. Cela ne supprime
  aucun plan et ne masque ni le suivi, ni le compte rendu, ni la reprise des
  jobs déjà admis. Les consommateurs continuent à comprendre leur profil.
- Les migrations sont additives et passent avant le code qui les utilise.
  Un rollback applicatif garde les tables et les données. Après ouverture,
  conserver un backend au moins aussi capable que celui de la phase 5 et une
  app capable de lire les jobs et les engagements de la phase 6. Revenir au
  worker générique initial n'est pas un rollback sûr.
- Avant ouverture, un retour à une API plus ancienne nécessite d'abord une
  app compatible avec ses routes et contrats. Ne pas retirer une lecture de
  suivi alors qu'une app déjà déployée l'utilise.
- Les changements de schéma ou de catalogue ont une version propre au profil.
  Ne pas invalider les checkpoints génériques v1 par une hausse globale de
  version. Garder les versions nécessaires aux reprises autorisées et aligner
  les contrôles du worker avec ceux de l'API de reprise.
  Comparer profil et versions contrat/catalogue entre job et checkpoint, y
  compris après la dernière étape, et vérifier leur prise en charge par le worker.
  Une divergence ou un format inconnu bloque la reprise en conservant source
  et checkpoint selon leur rétention, sans ré-extraction automatique avec une
  autre version. Revalider les références et les droits avant écriture.

Les points d'appui existent : [feature flags](../../packages/domain/src/utils/feature-flags.ts),
[TrackingService](../../apps/backend/src/utils/tracking/tracking.service.ts),
[options des jobs](../../apps/backend/src/plans/ai-plan-import/models/ai-plan-import-job.ts)
et [repository des jobs](../../apps/backend/src/plans/ai-plan-import/ai-plan-import-job.repository.ts).
Le flag IA actuel ne protège pas l'enfilement côté serveur. Le type de plan
Électrification est actuellement sélectionnable ; son alerte dans le formulaire
n'est pas un verrou. L'ouverture ci-dessous concerne le nouveau profil d'import.

## Phase 1 — Contrats compatibles et suivi persistant

### PR 1A — Contrats des profils et API de suivi

**Périmètre :** frontière HTTP, modèle du job, checkpoints et lectures de statut.

- Ajouter le profil explicite et les versions de contrat/catalogue aux jobs.
  Un job historique sans profil reste générique. Un profil inconnu est refusé
  avant upload et enfilement. Reconnaître l'annexe mais refuser son admission
  tant que son traitement complet n'est pas branché : le flag seul ne suffit pas.
- Définir une réponse discriminée : l'import générique continue à produire
  `{ jobId, planId }`, l'annexe pourra produire `{ jobId, planId: null }`.
  La colonne `created_plan_id` et le statut autorisent déjà `null` ; ne pas
  ajouter de migration de nullabilité inutile ni changer le parcours PCAET.
- Valider le JSON des checkpoints à la lecture, selon profil et version.
  Préserver les anciens checkpoints génériques et leurs règles de rétention.
  Les futurs contrats annexe seront ajoutés avec leur implémentation, sans stub
  de réussite ni lecture permissive d'un format encore inconnu.
- Étendre les lectures existantes avec un accès autorisé par `jobId` et une
  liste paginée des imports récents de la collectivité, échecs compris.
  Exposer nom/date, profil, statut, plan éventuel et compte rendu structuré.
  Le compte rendu distingue erreur documentaire, configuration manquante,
  avertissement et donnée conservée. Ne pas exposer de chemins de stockage.
- Exposer la capacité serveur, encore indisponible pour l'annexe. Ne pas
  conditionner la lecture des anciens jobs à l'ouverture du profil.

**Validation :** jobs historiques avec et sans plan provisoire ; checkpoint v1 ;
format inconnu refusé ; accès inter-collectivités refusé ; admission fermée sans
upload/job ; consommateurs génériques existants compatibles.

**Déploiement et arrêt possible :** backend compatible avec l'app actuelle,
aucun nouveau job annexe produit. Retour au code précédent possible avant 1B ;
ensuite, revenir d'abord à une app compatible avec l'ancienne API de suivi.

### PR 1B — Suivi sans dépendre d'un plan

**Périmètre :** [flow d'import](../../apps/app/src/plans/plans/import-plan/ai-import.flow.tsx),
[mutation d'enfilement](../../apps/app/src/plans/plans/import-plan/data/use-enqueue-ai-import.ts)
et point d'accès depuis la liste des plans.

- Conserver le `jobId` dans l'URL avec les outils existants et retrouver le
  suivi après fermeture/rechargement. Donner accès aux imports récents et aux
  échecs ; `getCurrentAiImport`, limité aux jobs en cours, ne suffit pas.
- Supporter l'absence de plan dans les callbacks, le polling, les erreurs et
  la reprise par job. Attendre `done` et un `createdPlanId` pour ouvrir le plan.
  Garder le compte rendu accessible après la redirection.
- Préserver le rattachement immédiat du plan générique dans
  [PCAET](../../apps/app/src/demarches/pcaet/import-programme/import-programme.context.tsx)
  et sa [modale](../../apps/app/src/demarches/components/import-plan.modal.tsx).
  Aucun sélecteur annexe ni nouveau comportement d'extraction dans cette PR.
- Conditionner dès ce lot l'alerte actuelle qui promet l'import des axes,
  actions et indicateurs depuis l'annexe : ne plus proposer ce parcours lorsque
  la capacité serveur est indisponible. La création Électrification ordinaire reste possible.

**Validation :** rechargement pendant/après échec, accès refusé, job terminé,
reprise, conservation du compte rendu et parcours PCAET. Scénarios sans plan
avec réponses simulées ou fixtures, sans appel réel au modèle.

**Déploiement et arrêt possible :** après 1A ; améliore le suivi des imports
actuels, même si aucune autre phase n'est livrée. L'annexe reste inaccessible.

## Phase 2 — Modèle durable et références résolues

### PR 2A — Données conventionnelles, provenance et lecture

**Périmètre :** migrations Sqitch, modèles et services internes dans `plans`,
lecture autorisée des engagements d'un plan.

- Ajouter les trois relations de l'ADR : initialisation, engagements retenus,
  cibles. Ajouter deux tables de provenance attachées aux axes et aux fiches ;
  cette forme évite d'étendre tous les DTO d'édition génériques. Les tables
  sont typées, avec contraintes et clés étrangères, pas un stockage du draft brut.
- Livrer leurs écritures internes sous transaction appelante et les tester
  avec fixtures. La PR 5 les composera sans réimplémenter leur persistance.
- Unicité par plan, puis `(plan, engagement)`, puis `(plan, engagement, cible)`.
  Valeur, unité, échéance et référence métier sont indépendantes de l'indicateur
  lié. Les cibles ne sont pas des lignes d'`indicateur_valeur.objectif`.
- La suppression du plan supprime ses engagements/cibles. La suppression d'un
  objet opérationnel met son lien à `null` ; une fiche supprimée logiquement
  est exclue de la lecture. La provenance d'une fiche déplacée reste attachée
  à celle-ci, même si le plan d'origine disparaît.
- Conserver source/hash, versions, clés de source, auteur/date durablement.
  Une suppression de job ou d'auteur ne doit pas supprimer les engagements :
  références nullables, sans cascade depuis ces objets. Les checkpoints et le
  fichier temporaire ne sont pas l'historique conventionnel.
- RLS activée, accès direct `anon`/`authenticated` révoqué ; services backend
  soumis aux droits et à la confidentialité du plan. Pas d'API d'édition des
  engagements. La lecture retourne aussi les liens manquants et retourne une
  liste vide pour un plan ordinaire.
- Lire les rattachements actuels et distinguer un axe avec engagement retenu
  d'un axe demandé seulement par B. Un élément libre ne devient pas une référence
  du fait de sa position ; une action de l'axe 1 n'est comptée qu'une fois.
- Ajouter au type de plan une clé technique stable pour Électrification,
  nullable et unique, avec reprise contrôlée de l'entrée existante, sans changer
  ses IDs. Si cette entrée est absente ou ambiguë, garder l'annexe indisponible
  jusqu'à correction du mapping, sans bloquer la migration ni les autres types.
  Le [modèle actuel](../../apps/backend/src/plans/fiches/shared/models/plan-action-type.table.ts)
  ne porte que catégorie, libellé et ID ; ne pas reproduire le test de libellé UI.

**Validation :** migrations `deploy/verify/revert` sur base de test ; contraintes,
permissions, suppression/déplacement/dissociation et lecture sans double compte,
auteur/job supprimé, ancien backend avec schéma étendu. Le `revert` refuse de
supprimer les tables si l'une des cinq contient encore des données, provenance comprise.

**Déploiement et arrêt possible :** migrations puis backend. Tables initialement
vides, aucun writer public ; ancien fonctionnement conservé. Rollback du code
sans retrait des données ni des tables utilisées.

### PR 2B — Catalogue et résolution déterministe

**Périmètre :** catalogue versionné livré avec le backend, validation et services
de résolution sans création de plan. Aucune administration de catalogue à construire.

- Distinguer la source Notion des indicateurs d'engagement de la source Grist
  des actions et indicateurs associés. Implémenter les correspondances validées
  de l'ADR, notamment E06, E07 et E08 ; ne pas inventer celles encore absentes.
  Pour E06/E08, les identifiants sont confirmés ; les définitions, formules,
  unités, périodicités, dépendances et l'adéquation métier restent à valider.
- Livrer le contrat métier typé d'entrée/sortie du résolveur dans cette PR.
  L'extracteur de la phase 3 le produira ; le résolveur ne dépend pas de types
  ou d'exports laissés à une PR suivante.
- Résoudre codes, numéros d'axes/sous-axes et URL TeT reconnues, y compris UID
  de fiches, vers des identités existantes et accessibles. Aucun appel réseau
  vers les URL du document, aucun rapprochement par titre.
- Valider les unités, les périodes et la cohérence des références. Une référence
  fournie invalide bloque ; une référence vide désigne un objet personnalisé.
  Une cible vide est un avertissement ; une définition attendue manquante est
  une erreur de configuration, pas une demande de correction du document.
- Calculer la structure : union des axes demandés par A et B, axe 1 partagé
  E01/E02, sans engagement implicite, clés de parents stables. Préparer le
  résultat résolu sans écrire de données métier.
- Pour les nouvelles fiches de référence, appliquer les compléments prévus au
  catalogue uniquement après les champs renseignés de l'annexe, qui priment.
  Ne pas ajouter deux fois une sous-action présente dans les deux sources.
- Brancher l'éligibilité sur le mapping lauréats → collectivités validé. Si un
  fichier versionné suffit pour ce programme, garder ce format avec sa source ;
  ne pas développer un outil de gestion des candidatures. Distinguer éligibilité
  métier et sélection du premier groupe de déploiement.
  Un mapping absent, obsolète ou ambigu rend le profil indisponible pour la
  collectivité et bloque l'enfilement avec une erreur de configuration.
  Conserver source et version de la décision, avec une validité vérifiable ;
  les jobs admis enregistrent cette provenance. Distinguer ce cas d'une
  non-éligibilité établie par un mapping valide.
- Une configuration métier incomplète rend le profil indisponible sans empêcher
  le backend de démarrer ni bloquer les imports génériques. Tester avec des
  fixtures synthétiques tant que les données réelles ne sont pas prêtes.

**Validation :** références inexistantes/ambiguës, URL autorisée ou non, fiche
partagée, absence de correspondance, unités doubles, cible zéro/vide, deux
cibles E07, catalogue indisponible, collectivité non éligible et mapping lauréat
absent/obsolète/ambigu avec décision traçable.

**Déploiement et arrêt possible :** services internes seulement ; aucune
création de plan. Les prérequis data peuvent avancer sans ouvrir l'import.

## Phase 3 — Du document au brouillon validé

### PR 3A — Préserver les liens et les localisations

**Périmètre :** [lecteurs](../../apps/backend/src/plans/ai-plan-import/pipeline/read-document/),
[grille tableur](../../apps/backend/src/plans/ai-plan-import/pipeline/analyze-workbook/read-workbook-grid.ts),
contrat documentaire, normalisation et découpage.

- Garder texte, destination et localisation des hyperliens DOCX/XLSX et des
  liens PDF exploitables. Conserver les URL textuelles du CSV ; ne pas inventer
  une destination perdue dans un scan. Les métadonnées survivent au découpage.
- Préserver le texte consommé par l'import générique ; le nouveau profil
  utilisera ces métadonnées explicitement. Préparer les fixtures de convention
  avec A, fiches B renseignées, modèle vide et exemple fictif C.
- Couvrir les formats déjà acceptés avec un diagnostic explicite lorsque
  l'annexe ou une référence n'est pas exploitable ; aucun fetch des URL.

**Validation :** liens masqués ou affichés, cellules fusionnées, plusieurs liens
dans un champ, coordonnées après normalisation, régression des lecteurs génériques.

**Déploiement et arrêt possible :** enrichissement du contrat documentaire ;
aucun nouveau profil exécuté, aucun changement de persistance.

### PR 3B — Extraction annexe et checkpoint typé

**Périmètre :** extraction, adaptation et validation du brouillon, sans worker
de production branché sur ce profil.

- Lire seulement A et les fiches B renseignées. Produire engagements/cibles,
  axes, fiches, sous-actions, codes/URL, unités et valeurs datées avec clés et
  localisations de source. Exclure instructions et exemple C.
- Brancher le profil sur les stratégies LLM existantes, sans fournisseur ni
  moteur supplémentaire. Préserver les deux stratégies et les chemins tableur
  qui peuvent court-circuiter l'extraction générique.
- Ne pas appliquer les fusions par titre ni les suppressions/enrichissements
  génériques qui perdraient des références ou inventeraient des sous-actions.
  Préserver les sous-actions même si les options génériques les désactivent.
- Préparer les conversions oui/non et les actions E03/E12 prévues par l'ADR.
  Reprendre les champs non budgétaires, dont moyens humains lorsqu'ils sont
  renseignés. Ne pas créer de compte depuis un nom de pilote.
- Utiliser le résolveur 2B et son compte rendu. Sérialiser un checkpoint annexe
  validé et versionné, sans IDs fournis par le LLM. Une reprise revalidera les
  références et les permissions avant écriture, même si l'extraction est conservée.
- Adapter le parcours d'évaluation existant pour sélectionner ce profil.
  Les tests utilisent un faux LLM ; les essais réels restent lancés par un humain.

**Validation :** A sans fiche, axe demandé seulement par B, homonymes, sous-actions
avec parents distincts, E03/E12, E07, zéro/vide, résultats/objectifs oui/non,
source fictive C exclue, références conservées, reprise sans nouvelle extraction.

**Déploiement et arrêt possible :** extraction utilisable en test/évaluation,
aucune admission annexe en production et aucune écriture métier partielle.

## Phase 4 — Primitives d'écriture sûres

### PR 4A — Structure explicite et effets après commit

**Périmètre :** [création d'agrégat](../../apps/backend/src/plans/plans/create-plan-aggregate/),
adaptateurs existants et liaison des fiches aux axes.

- Accepter des axes explicites, y compris sans fiche, et des clés
  `sourceKey`/`parentSourceKey`. Retourner les correspondances clés → IDs.
  Garder l'adaptateur générique fonctionnel et ses entrées actuelles.
- Ajouter les liens de fiches existantes aux axes sans copier leur contenu,
  remplacer leurs autres liens ou modifier leurs sous-actions/indicateurs.
  Conserver les permissions ordinaires, y compris le partage entre collectivités.
- Sortir les webhooks de la transaction de l'agrégat : le propriétaire de la
  transaction les déclenche après commit. Adapter tous les appelants dans cette
  PR, y compris ceux qui transmettent une transaction externe. Aucune promesse
  d'effet externe émise avant que la transaction englobante ait réussi.

**Validation :** axe vide, homonymes, parents corrects, rollback, liens existants
conservés, partage et droits, import générique. Aucun webhook après rollback ;
un échec de notification ne provoque pas une seconde création.

**Déploiement et arrêt possible :** amélioration complète de l'agrégat existant,
sans activation annexe. Revenir au code précédent avant ouverture reste possible.

### PR 4B — Indicateurs et liens sous transaction appelante

**Périmètre :** [création de définition](../../apps/backend/src/indicateurs/definitions/mutate-definition/create-definition.service.ts),
liens axe/indicateur et fiche/indicateur.

- Permettre à la création personnalisée de participer à la transaction fournie,
  tout en conservant sa transaction propre pour les appels ordinaires.
  Inclure définition, préférences et liens dans cette même transaction.
- Préserver validations, droits et protections du graphe. Si le lot crée des
  personnalisés, prendre le verrou exclusif du graphe avant les lectures
  verrouillées des définitions ; éviter une montée partagé → exclusif.
- Ajouter des opérations de liaison additives et idempotentes, sous `tx`.
  Ne pas utiliser les setters qui remplacent toutes les relations, notamment
  `setAxeIndicateurs` et `upsertIndicateurFiches`, comme des opérations d'ajout.
  Ne modifier ni définition, ni valeurs, ni liens préexistants sur le chemin URL.

**Validation :** création ordinaire inchangée ; rollback de toutes les données
de l'indicateur ; liens préservés ; droits refusés ; ordre des verrous ; titres
prédéfinis inchangés. Les appels autorisés n'utilisent pas de contournement des droits.

**Déploiement et arrêt possible :** nouvelles opérations internes complètes,
API ordinaires conservées, aucune écriture issue d'une annexe.

### PR 4C — Compléter uniquement les valeurs absentes

**Périmètre :** [écriture des valeurs](../../apps/backend/src/indicateurs/valeurs/write-indicateur-valeurs/)
et compte rendu des conflits. Cette règle mérite une revue séparée de la création
des définitions : elle protège des saisies existantes et concurrentes.

- Lire, comparer et écrire sous le même verrou de valeurs et la même transaction.
  Préserver séparément résultat, objectif et métadonnées déjà présents, y compris
  zéro. Une ligne existante n'interdit pas de compléter une cellule absente.
- Réutiliser la validation et la réconciliation existantes des valeurs réellement
  ajoutées. Ne pas appeler directement `saveBatch` avec un champ omis en supposant
  qu'il sera préservé : ce chemin transforme actuellement les absences en `null`.
- Retourner les conflits conservés pour le compte rendu ; respecter unité,
  périodicité et source. Les valeurs des nouveaux personnalisés passent par les
  règles ordinaires. Les objets désignés par URL n'empruntent pas ce chemin.

**Validation :** résultat présent/objectif absent et inverse ; zéro ; données
externes ; écritures concurrentes ; périodes invalides ; rollback ; chemin URL
strictement sans modification. Préserver l'ordre de verrouillage définitions → valeurs.

**Déploiement et arrêt possible :** opération interne testée, sans modifier
le comportement des saisies et imports ordinaires qui ne l'appellent pas.

## Phase 5 — Import complet dans une transaction

### PR 5 — Assembler le pipeline et le cycle de vie

**Périmètre :** [enfilement](../../apps/backend/src/plans/ai-plan-import/enqueue-import/),
[worker et service](../../apps/backend/src/plans/ai-plan-import/generate-import-draft/),
reprise et orchestration métier. Les primitives de stockage sont déjà livrées.

- Brancher le dispatch par profil sur l'extraction 3B et la résolution 2B.
  Garder l'admission fermée par défaut ; contrôler droits, éligibilité, type
  stable et configuration avant upload/enfilement.
- Pour l'annexe, créer le job sans plan provisoire. Adapter les échecs de stockage
  ou de queue sans suppression d'un plan inexistant ni job bloquant les quotas.
  Le service et le contrôleur retournent `planId: null` pour ce profil ; le
  nettoyage n'appelle `deleteImportingPlan` que si un identifiant existe.
  Garder le plan provisoire du profil générique et son comportement PCAET.
- Extraire/préparer hors transaction. Dans une transaction courte : revalider
  droits et références, créer plan/axes/fiches, ajouter liens, créer les
  personnalisés, écrire les valeurs autorisées, provenance, engagements/cibles
  et compte rendu, puis `markDone` avec le contrôle `status`/`attempt` existant.
  Un refus de `markDone` annule tout, comme une erreur métier ou une révocation de droit.
  Si le lot crée des personnalisés, acquérir le verrou exclusif du graphe avant
  toute revalidation verrouillée des définitions, selon l'ordre défini en 4B.
- E01/E02 partagent un axe ; seuls les engagements A retenus sont persistés.
  E06/E08 utilisent les références confirmées une fois leurs définitions
  validées et intégrées, E07 deux cibles indépendantes,
  E03/E12 des fiches "À venir". Aucun résultat ni achèvement n'est déduit d'un objectif.
- Déclencher notifications et webhooks après commit. Leur échec ne modifie pas
  un job réussi et ne relance pas la création. Ajouter profil, versions et
  catégories d'erreur à la télémétrie existante, sans contenu de convention.
- Garder quotas, protection contre un ancien worker, confirmation de réimport,
  distinction nouveau job/reprise et rétention. Conserver un checkpoint
  exploitable après échec ; ne pas supposer que le fichier temporaire existe
  encore, il est actuellement supprimé en fin de traitement. Ne pas purger le
  compte rendu avec les données temporaires de reprise.

**Validation :** étendre le
[full flow avec faux LLM](../../apps/backend/src/plans/ai-plan-import/ai-plan-import.full-flow.e2e-spec.ts)
et vraie base : référence invalide sans plan ; annulation de toutes les écritures,
y compris ajout de liens aux objets existants ; retry sans doublon ; révocation
de droit ; worker périmé ; failure upload/queue ; admission fermée pendant un job
déjà admis ; imports génériques inchangés. Utiliser l'ouverture simulée du flag en test.

**Déploiement et arrêt possible :** backend complet mais fermé aux utilisateurs.
La production peut rester à ce stade. Aucun import pilote avant la lecture des
cibles et le parcours de la phase 6.

## Phase 6 — Parcours complet et cibles visibles

### PR 6 — Exposer le parcours préparé

**Périmètre :** formulaire d'import, affichage des engagements, erreurs et
compte rendu. Réutiliser le suivi de la phase 1 et les lectures de la phase 2.

- Proposer l'annexe à partir de la capacité serveur, des droits et de
  l'éligibilité. Envoyer son profil explicite ; adapter consignes et options
  pour conserver les sous-actions et références nécessaires. Ne pas envoyer
  une annexe indisponible au pipeline générique. Les non-lauréats conservent
  le plan Électrification ordinaire.
- Présenter "Cible de l'annexe 3" séparément de l'objectif courant, avec unité
  et échéance, notamment dans les
  [indicateurs d'axe](../../apps/app/src/plans/plans/show-plan/plan-arborescence.view/axe/axe-indicateurs.tsx).
  Garder aussi une lecture au niveau du plan si l'axe ou l'indicateur a été
  supprimé/déplacé. E03/E12 renvoient à la fiche suivie par statut.
- Afficher erreurs localisées, cibles vides, conflits conservés, données non
  appliquées aux objets liés par URL et champs budgétaires non repris.
  Une configuration manquante n'est pas présentée comme un document à corriger.
- Préserver les éditions ordinaires. Invalider le suivi après suppression,
  déplacement ou dissociation ; ne recréer aucun objet disparu. Ne proposer
  aucun renommage local des indicateurs prédéfinis ni édition des engagements.
- Mettre les textes dans les labels existants et les URLs dans les builders.
  Mettre à jour le guide de parcours et de support avec ces comportements.

**Validation :** parcours navigateur avec faux backend LLM/fixtures : upload,
suivi sans plan, retour après fermeture, erreur/correction par nouvel import,
reprise, succès et compte rendu. Vérifier les cibles E07, zéro/vide, axe sans
fiche, axe B sans engagement, données existantes préservées et liens manquants.
Les tests de l'ancien import support ne constituent pas cette couverture.

**Déploiement et arrêt possible :** backend de phase 5 puis app, admission encore
fermée. Les lecteurs restent accessibles indépendamment du flag. Aucune phase
budgétaire ni dashboard n'est nécessaire pour ouvrir le socle.

## Phase 7 — Qualifier puis ouvrir progressivement

Cette phase est une opération de livraison, pas une PR vide pour changer un flag.
Les corrections éventuelles rejoignent les lots concernés avec leur validation.

**Prérequis avant ouverture :**

- Correspondances métier validées et version de catalogue livrée, sans code
  fictif : unités principales, périodicités, sous-axes, sous-actions, références
  des fiches B et traitement des liens d'aides dans "Documents" convenu.
- Définitions et dépendances de calcul disponibles dans l'environnement cible,
  notamment `v_particulier_elec`, `autobus_autocar_elec`, `s_26` et `s_26.a`.
  Pour E06/E08, définitions, formules, unités, périodicités, dépendances et
  adéquation métier validées avec l'équipe data et le métier, notamment le
  périmètre autobus/autocars. La présence d'un ID dans Notion ne prouve ni cette
  validation ni l'intégration ; le profil reste fermé tant qu'elles manquent.
- Mapping lauréats → collectivités validé et maintenu ; premier groupe choisi
  parmi ces lauréats. Aucun élargissement de droits par le ciblage du flag.
- Migrations, backend/API, tous les workers et app compatibles déployés.
  Pas de message annexe en queue tant qu'un ancien worker peut le consommer.
- Tests de chaque lot passés, non-régression générique/PCAET et full flow validés.
  Qualification de documents représentatifs selon le
  [guide d'évaluation](../../apps/backend/src/plans/ai-plan-import/eval/README.md),
  lancée par un humain uniquement. Aucun agent ni test automatisé n'appelle le LLM réel.

**Ouverture :** valider le parcours complet en préproduction, puis ouvrir
l'admission à un petit groupe identifié de collectivités. Les utilisateurs ou
l'équipe lancent eux-mêmes les imports réels. Contrôler chaque import pilote :
complétude A/B, cibles, conservation des données, erreurs et absence de doublon.
Suivre durées, échecs par cause, reprises, volumes et consommation LLM avec
l'instrumentation existante. Élargir seulement après validation métier des
résultats et de l'exploitation ; aucun taux de succès arbitraire n'est supposé validé.

**Critères d'arrêt :** donnée existante écrasée, mauvais rattachement, plan
partiel/doublon ou contrôle d'accès incorrect entraînent la fermeture de
l'admission et la suspension de consommation pendant la correction. La queue
BullMQ est partagée : sa mise en pause peut aussi suspendre les imports génériques.
Traiter explicitement les jobs actifs avant reprise sur des workers corrigés,
en préservant sources, checkpoints et état ; ne pas convertir automatiquement
l'incident en suppression ou échec avec cleanup. Vérifier cette procédure en
préproduction. Une référence invalide dans une annexe est un rejet attendu,
à distinguer d'un défaut du service.

**Retour arrière :** fermer l'admission, garder les lecteurs et consommateurs
compatibles, traiter les jobs admis selon leurs versions. Ne supprimer aucun
plan, indicateur, lien ou engagement par rollback. Les problèmes d'un import
terminé relèvent du support ; pas de réimport avec fusion automatique.

## Phase 8 — Budgets et financements, facultatif

### PR 8 — Étendre le profil complet

Livrer après le socle, sans en faire un critère d'ouverture. Reprendre
investissement/fonctionnement et financements explicitement renseignés vers
les modèles actuels, sans `budgetPrevisionnel` déprécié. Couvrir extraction,
unités/périodes, absence/zéro, persistance dans la transaction commune et compte
rendu. Les fiches désignées par URL restent strictement inchangées.

Préserver les jobs/checkpoints du socle sans données budgétaires ; ne pas
réinterpréter un import déjà réussi ni déclencher de nouvel appel au modèle
sur une reprise ancienne pour ajouter ce périmètre. Appliquer les mêmes règles
de compatibilité avant de produire un nouveau format de checkpoint.

**Validation et déploiement :** valeurs absentes/zéro, champs distincts,
rollback complet, conservation des montants existants et anciennes reprises.
Le retrait de cette extension conserve les budgets déjà importés et l'accès
au socle. Aucun chantier de reporting budgétaire n'est inclus.

## Couverture et définition de fin

| Exigence de l'ADR | Implémentation | Vérification de bout en bout |
| --- | --- | --- |
| Profil explicite, droits, lauréats, aucun plan avant validation | 1A, 2B, 5 | 5 et 7 |
| Suivi durable, reprise et compatibilité des jobs | 1A, 1B, 3B, 5 | 5 et 6 |
| A/B uniquement, hyperliens, clés stables, références bloquantes | 2B, 3A, 3B | 5 |
| Axes explicites, E01/E02, axes libres et B sans engagement | 2B, 4A, 5 | 5 et 6 |
| Cibles distinctes, E06/E08, deux cibles E07, actions E03/E12 | 2A, 2B, 5 | 5 et 6 |
| Personnalisés, valeurs datées, oui/non et provenance | 2A, 3B, 4A, 4B, 4C, 5 | 5 |
| URL : liens seuls ; codes : complétion sans écrasement | 2B, 4A, 4B, 4C | 5 |
| Liberté d'édition, titres communs, suppression et traçabilité | 2A, 4A, 6 | 6 |
| Transaction totale, concurrence, effets après commit | 4A, 4B, 4C, 5 | 5 |
| Compte rendu complet, activation et arrêt sans perte | 1A, 1B, 5, 6 | 7 |
| Budgets facultatifs | 8 | 8, sans bloquer 7 |

Une PR est terminée lorsque ses checks ciblés passent, ses contrats restent
compatibles avec la version précédente et son état de production peut être
maintenu sans la suite. L'ouverture du profil nécessite toutes les phases du
socle et les validations métier ci-dessus. Ce document décrit des travaux et
des validations à réaliser ; il ne constate ni leur exécution ni un déploiement.

Restent hors périmètre : dashboard ADEME, bibliothèque d'actions après import,
groupements, export Word, modification des engagements, synchronisation par
réimport et migration/suppression automatique des plans existants.
