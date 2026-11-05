---
title: "feat: Import de l'annexe 3 Électrification"
type: feat
status: in-progress
date: 2026-11-04
---

# Import de l'annexe 3 Électrification

Ce plan décline l'[ADR 0022](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md)
en incréments déployables séparément. Il couvre l'import complet, depuis le
document jusqu'au plan et au suivi des cibles. Il ne reprend pas le
provisionnement automatique ni le verrouillage des anciens plans de travail.

**Sept phases : onze PR de code, puis une ouverture progressive.** Les budgets
et financements constituent une huitième phase facultative. Les numéros de PR
ci-dessous désignent les lots ; leur avancement est suivi séparément.

## Avancement

- [x] PR 1A — Contrats des profils et API de suivi : [#5702](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5702), fusionnée le 4 novembre 2026 ; parcours générique vérifié en préproduction.
- [x] PR 1B — Suivi sans dépendre d'un plan : [#5709](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5709), implémentée et vérifiée, en revue.
- [x] PR 2A — Réutilisation du modèle et identification du type existant : [#5722](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5722), implémentée et vérifiée, en revue.
- [ ] PR 2B — Catalogue et résolution déterministe.
- [ ] PR 3A — Lecture documentaire.
- [ ] PR 3B — Extraction typée de l'annexe.
- [ ] PR 4A — Axes et liens de fiches.
- [ ] PR 4B — Indicateurs et liens.
- [ ] PR 4C — Valeurs sans écrasement et sources isolées par plan.
- [ ] PR 5 — Pipeline complet et cycle de vie.
- [ ] PR 6 — Parcours et lecture dans l'app.
- [ ] Phase 7 — Qualification et ouverture en production.
- [ ] Phase 8 — Budgets et financements, facultatifs.

Une case cochée signifie que le lot est implémenté et vérifié dans sa PR,
pas qu'il est fusionné ou déployé. L'ouverture en production reste une étape distincte.

La [révision de l'ADR du 5 novembre](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md#statut)
retire les cinq tables proposées dans la première version de #5722. Les
engagements sont représentés par les axes, fiches et indicateurs existants ;
les cibles utilisent les sources de valeurs, avec une métadonnée par plan.
Le type de plan est identifié par son couple existant `(categorie, type)`,
comme le PCAET, sans ajouter de colonne d'identification.
Les champs nécessaires sont livrés avec leurs écritures et lectures dans
les phases 4 à 6. Les validations des définitions E06/E08, du catalogue Grist
vers TeT et du mapping des lauréats restent à obtenir avant ouverture.

Chaque PR contient son code, ses migrations éventuelles, ses tests et la mise
à jour de sa documentation. Elle compile et fonctionne sans une PR suivante.
Pour les nouveaux comportements, privilégier les suites e2e existantes et
éviter de créer des fichiers de tests unitaires. Les tests d'import utilisent
un faux LLM.
Les premières phases livrent des capacités complètes mais gardent l'import
annexe fermé. Il n'y a pas d'ouverture intermédiaire qui importerait seulement
les engagements ou ignorerait les indicateurs des fiches B.

## Découpage et ordre de livraison

| Phase | PR | Résultat autonome en production | Dépendances |
| --- | --- | --- | --- |
| 1. Contrats et suivi des jobs | 1A, 1B | Jobs historiques compatibles ; suivi retrouvable après fermeture ; admission annexe fermée côté serveur | Aucune phase suivante |
| 2. Identification et références métier | 2A, 2B | Modèle existant réutilisé ; type identifié par catégorie et libellé ; résolution des références testable sans import | Phase 1 |
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
  app capable de lire les jobs et les sources de valeurs de la phase 6. Revenir au
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
Le flag IA actuel ne protège pas l'enfilement côté serveur. La création de
plans Électrification est temporairement bloquée côté interface et backend
par la [PR #5673](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5673).
Les premiers lots conservent ce garde-fou. Son remplacement intervient dans
les phases 5 et 6, sans ouvrir le profil annexe avant la phase 7.

## Phase 1 — Contrats compatibles et suivi persistant

### PR 1A — Contrats des profils et API de suivi

**Périmètre :** frontière HTTP, modèle du job, checkpoints et lectures de statut.

**Livraison 1A :** le contrôle partagé `isImportProfileImplemented` interdit
l'annexe dans tous les environnements. Le flag de déploiement est branché en
PR 5, lorsque le pipeline existe ; aucun flag actuel ni mode super-admin ne
peut ouvrir ce profil en 1A. Aucune migration n'est nécessaire pour ce lot.
Le blocage temporaire de création Électrification livré dans #5673 est conservé.

Le suivi expose `getAiImportStatus`, `getCurrentAiImport`,
`listRecentAiImports` et `getAiImportCapabilities` sous `plans.aiImport`.
Le compte rendu générique est dérivé de l'erreur et de la revue existantes :
une erreur non classée reste `processing-error`, une revue n'est pas transformée
en avertissement. La persistance des diagnostics annexe arrive avec leur
production en PR 5. Aucun texte extrait ni chemin de stockage n'est ajouté aux réponses.
Les messages d'incompatibilité du contrat et du point de reprise sont partagés
entre les erreurs API et les échecs des jobs affichés dans l'app.

- Ajouter le profil explicite et les versions de contrat/catalogue aux jobs.
  Un job historique sans profil reste générique. Un profil inconnu est refusé
  avant upload et enfilement. Reconnaître l'annexe mais refuser son admission
  tant que son traitement complet n'est pas branché : le flag seul ne suffit pas.
- Définir une réponse discriminée : l'import générique continue à produire
  `{ profile: 'generic', jobId, planId: number }`, l'annexe pourra produire
  `{ profile: 'annexe-3-electrification', jobId, planId: null }`.
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

**Vérifications effectuées :** 16 tests tRPC avec vraie base et 14 tests
full flow HTTP avec faux LLM, couvrant notamment l'admission, la réponse
générique, les permissions et les checkpoints conservés en base. Aucun nouveau
fichier de tests unitaires ; les suites unitaires existantes restent en place.
Typechecks du backend, de ses tests et de l'app, ESLint ciblé et liens locaux
vérifiés. Aucun appel réel au modèle.
Après rebase sur l'ADR fusionné, les 30 e2e et les 61 tests existants
d'enfilement/génération passent, y compris le blocage de création Électrification.
Le suivi dans l'app est implémenté dans la PR 1B, encore en revue.
Le déploiement en production n'a pas été vérifié lors de cette revue.

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

- [x] Conserver le `jobId` dans l'URL avec les outils existants et retrouver le
  suivi après fermeture/rechargement. Donner accès aux imports récents et aux
  échecs ; `getCurrentAiImport`, limité aux jobs en cours, ne suffit pas.
- [x] Supporter l'absence de plan dans les callbacks, le polling, les erreurs et
  la reprise par job. Attendre `done` et un `createdPlanId` pour la redirection
  automatique vers le plan.
  Garder le compte rendu accessible après la redirection.
- [x] Utiliser le fil d'Ariane du design system pour naviguer entre les plans,
  l'historique et le détail d'un import. Afficher "Ouvrir le plan" en style
  outlined dans l'en-tête du détail, à gauche de "Nouvel import". L'activer dès
  qu'un plan est associé, y compris pendant le traitement ou après un échec ;
  sinon le désactiver avec une infobulle expliquant son indisponibilité.
- [x] Ajouter "Détails de l’import" dans le menu du plan uniquement lorsqu'un
  import IA lui est associé et que l'utilisateur peut le consulter. Retrouver
  cet import avec le filtre `planId` de `listRecentAiImports`, sans dépendre
  d'un paramètre d'URL ni du flag de lancement. Ne charger cette information
  qu'à l'ouverture du menu. Placer cette section entre la génération de rapport
  et les actions dupliquer/supprimer. Cet accès remplace le bouton de compte
  rendu dans la vue du plan ; aucun paramètre de suivi n'est ajouté à son URL.
- [x] Préserver le rattachement immédiat du plan générique dans
  [PCAET](../../apps/app/src/demarches/pcaet/import-programme/import-programme.context.tsx)
  et sa [modale](../../apps/app/src/demarches/components/import-plan.modal.tsx).
  Aucun sélecteur annexe ni nouveau comportement d'extraction dans cette PR.
- [x] Conserver le blocage temporaire de création Électrification, y compris pour
  le parcours ordinaire. L'ancienne alerte promettant l'import des axes,
  actions et indicateurs a déjà été remplacée par le message d'indisponibilité
  de `PlanCreationRules` dans `main` : aucun parcours annexe à afficher ici.
  Son ouverture ultérieure dépendra de la capacité serveur.

**Validation :** rechargement pendant/après échec, accès refusé, job terminé,
reprise, conservation du compte rendu et parcours PCAET. Scénarios sans plan
avec réponses simulées ou fixtures, sans appel réel au modèle.

**Implémenté et vérifié dans [#5709](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5709), non fusionné :**
historique paginé sous `/plans/imports`, sélection par `importJobId`, compte
rendu accessible depuis le plan, reprise réservée à l'équipe et lecture
indépendante du flag de lancement. Après rebase sur `main`, onze scénarios
Playwright et dix-sept e2e tRPC ont été validés sur la stack locale, ainsi que
TypeScript (backend, app et e2e), le lint ciblé et les builds Next.js et NestJS.
Les tests couvrent notamment le filtre par plan, l'isolation des collectivités,
le menu, la navigation desktop/mobile et le parcours PCAET. Les lancements et
reprises IA sont simulés, sans appel réel au modèle.

**Déploiement et arrêt possible :** après 1A ; améliore le suivi des imports
actuels, même si aucune autre phase n'est livrée. L'annexe reste inaccessible.

## Phase 2 — Modèle existant et références résolues

### PR 2A — Réutilisation du modèle et identification du type existant

**Périmètre :** révision de l'architecture et règle partagée de création
utilisée par le backend et l'app, sans nouvelle table ni migration.

- Identifier le type Électrification par son couple unique `(categorie, type)`
  `("Plans thématiques", "Plan Électrification")` dans `PlanCreationRules`, selon
  le fonctionnement du PCAET. Conserver les IDs et les contrats de lecture existants.
- Conserver le blocage temporaire de création Électrification et garder
  l'admission annexe fermée. L'identification d'un type ne vaut ni autorisation
  d'import ni contrôle d'éligibilité.
- Réviser l'ADR et le découpage pour utiliser les axes, fiches, indicateurs et
  sources existants. Les champs de référence sont livrés en 4A, les métadonnées
  et valeurs en 4B/4C, avec les services qui les consomment. Aucune nouvelle
  lecture d'engagements ni API d'édition n'est exposée dans ce lot.

**Validation attendue :** suites e2e existantes pour la lecture des types,
le blocage du type Électrification, les types ordinaires et le suivi des imports.
Vérifier qu'un libellé identique dans une autre catégorie n'identifie pas le
type Électrification. TypeScript backend/app/domain et lint ciblé.

**Vérifications effectuées :** 54 tests dans les trois suites e2e existantes
de création de plans, de lecture des types et de suivi des imports, ainsi que
les 26 tests existants d'enfilement. Le type canonique reste bloqué, ses plans
existants restent modifiables et un homonyme dans une autre catégorie est
autorisé. Le build domain, TypeScript backend/tests/app/domain, le lint ciblé
et les liens locaux passent. Aucun nouveau fichier de tests unitaires ni appel
réel au modèle. Ce lot ne comporte aucune migration ; l'isolation des futures
cibles par source reste à valider en phase 4.

**Déploiement et arrêt possible :** backend et app, sans migration. La création
Électrification reste suspendue, sans dépendre d'une phase suivante.

### PR 2B — Catalogue et résolution déterministe

**Périmètre :** catalogue versionné livré avec le backend, validation et services
de résolution sans création de plan. Aucune administration de catalogue à construire.

- Distinguer la source Notion des indicateurs d'engagement de la source Grist
  des actions et indicateurs associés. Implémenter les correspondances validées
  de l'ADR, notamment E06, E07 et E08 ; ne pas inventer celles encore absentes.
  Pour E06/E08, les identifiants sont confirmés et l'unité "%" est renseignée.
  Les composantes prévues pour E08 sont `autobus_elec` et `autocar_elec`.
  Restent à valider les formules, périodicités et l'adéquation métier, puis à
  vérifier les définitions et leurs dépendances dans l'environnement cible.
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
- Ajouter sur les axes et fiches existants les champs de référence nécessaires :
  code, nature et version du catalogue. Conserver sur le plan racine la liste
  des codes d'engagement retenus dans A, sans la déduire des axes demandés par B.
  Le service interne les écrit après résolution, sous la transaction appelante.
  Livrer ces champs avec leurs écritures, sans tables de provenance ni snapshots
  répétés du fichier ou du job. Une duplication ordinaire ne les copie pas sur
  les nouveaux objets. Les DTO publics et les accès directs en base ne permettent
  pas de forger ces références ; vérifier les droits/RLS applicables.
- Ajouter les liens de fiches existantes aux axes sans copier leur contenu,
  remplacer leurs autres liens ou modifier leurs sous-actions/indicateurs.
  Conserver les permissions ordinaires, y compris le partage entre collectivités.
- Sortir les webhooks de la transaction de l'agrégat : le propriétaire de la
  transaction les déclenche après commit. Adapter tous les appelants dans cette
  PR, y compris ceux qui transmettent une transaction externe. Aucune promesse
  d'effet externe émise avant que la transaction englobante ait réussi.

**Validation :** axe vide, homonymes, parents corrects, rollback, liens existants
conservés, partage et droits, import générique, codes après renommage/déplacement,
duplication sans identité annexe et refus d'attribution par les écritures publiques.
Aucun webhook après rollback ;
un échec de notification ne provoque pas une seconde création.

**Déploiement et arrêt possible :** amélioration complète de l'agrégat existant,
sans activation annexe. Revenir au code précédent avant ouverture reste possible.

### PR 4B — Indicateurs et liens sous transaction appelante

**Périmètre :** [création d'indicateur personnalisé](../../apps/backend/src/indicateurs/indicateurs/mutate-indicateur/create-indicateur.service.ts),
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
- Réutiliser les sources et métadonnées d'indicateurs. Ajouter au plan racine
  un lien nullable vers sa métadonnée. La suppression du plan retire ce lien,
  sans supprimer les valeurs de la collectivité. Créer une métadonnée de source
  "Annexe 3 Électrification" distincte par plan, sous la transaction commune,
  sans créer de table d'engagement ou de cible. Contrôler la cohérence plan,
  collectivité, unicité et permissions ; les écritures ordinaires ne peuvent pas
  attribuer librement ce lien. La PR 4C consommera cet identifiant exact
  pour les écritures et les lectures de valeurs.

**Validation :** création ordinaire inchangée ; rollback de toutes les données
de l'indicateur ; liens préservés ; droits refusés ; ordre des verrous ; titres
prédéfinis inchangés ; métadonnées de deux plans distinctes ; suppression d'un
plan sans perte des valeurs. Les appels autorisés n'utilisent pas de contournement des droits.

**Déploiement et arrêt possible :** nouvelles opérations internes complètes,
API ordinaires conservées, aucune écriture issue d'une annexe.

### PR 4C — Écrire les valeurs sans écrasement et isoler les sources par plan

**Périmètre :** [écriture des valeurs](../../apps/backend/src/indicateurs/valeurs/write-indicateur-valeurs/),
lectures et calculs par métadonnée, compte rendu des conflits. Ces règles
méritent une revue séparée de la création des définitions : elles protègent
les saisies existantes et concurrentes ainsi que les valeurs des autres plans.

- Lire, comparer et écrire sous le même verrou de valeurs et la même transaction.
  Préserver séparément résultat, objectif et métadonnées déjà présents, y compris
  zéro. Une ligne existante n'interdit pas de compléter une cellule absente.
- Réutiliser la validation et la réconciliation existantes des valeurs réellement
  ajoutées. Ne pas appeler directement `saveBatch` avec un champ omis en supposant
  qu'il sera préservé : ce chemin transforme actuellement les absences en `null`.
- Retourner les conflits conservés pour le compte rendu ; respecter unité,
  périodicité et source. Les valeurs des nouveaux personnalisés passent par les
  règles ordinaires. Les objets désignés par URL n'empruntent pas ce chemin.
- Écrire les cibles de A comme objectifs datés sous la métadonnée propre au
  plan, sans toucher à l'objectif de la collectivité ni aux autres sources.
  Zéro est une valeur ; une cible absente n'invente ni résultat ni objectif.
  Réutiliser les lectures de valeurs en ciblant le `metadonneeId` exact du plan.
  Deux plans partageant un indicateur ne doivent pas lire la dernière valeur
  disponible sous le seul nom de source.
- Adapter l'isolation des calculs par métadonnée, à partir du mécanisme PCAET
  existant, avant d'autoriser ces écritures. Préserver les règles des autres
  sources et les formules du catalogue ; une cible saisie ne devient pas un
  résultat calculé. Vérifier les droits sur le plan, la métadonnée et les
  indicateurs sans introduire d'accès privilégié depuis un simple identifiant.

**Validation :** résultat présent/objectif absent et inverse ; zéro ; données
externes ; écritures concurrentes ; périodes invalides ; rollback ; chemin URL
strictement sans modification ; deux plans de la même collectivité, même
indicateur et même période avec cibles distinctes ; lectures et calculs isolés
par métadonnée ; absence d'effet sur les sources collectivité et PCAET.
Préserver l'ordre de verrouillage définitions → valeurs.

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
  Brancher le flag serveur dédié dans le contrôle de disponibilité partagé
  avec l'enfilement ; l'exclure de l'activation automatique PostHog en dev/test/CI.
  Le flag ne remplace aucun contrôle de droits ou de disponibilité métier.
- Pour l'annexe, créer le job sans plan provisoire. Adapter les échecs de stockage
  ou de queue sans suppression d'un plan inexistant ni job bloquant les quotas.
  Le service et le contrôleur retournent `planId: null` pour ce profil ; le
  nettoyage n'appelle `deleteImportingPlan` que si un identifiant existe.
  Garder le plan provisoire du profil générique et son comportement PCAET.
- Adapter le blocage temporaire de création Électrification dans les services
  partagés pour permettre la transaction annexe uniquement après validation de
  son admission. Aucun contournement par le type de plan, la duplication ou un
  import générique ; le parcours ordinaire reste bloqué jusqu'à la phase 6.
- Extraire/préparer hors transaction. Dans une transaction courte : revalider
  droits et références, créer plan/axes/fiches, ajouter liens, créer les
  personnalisés, écrire les codes de référence, la métadonnée du plan, les
  valeurs autorisées et le compte rendu, puis `markDone` avec le contrôle
  `status`/`attempt` existant.
  Un refus de `markDone` annule tout, comme une erreur métier ou une révocation de droit.
  Si le lot crée des personnalisés, acquérir le verrou exclusif du graphe avant
  toute revalidation verrouillée des définitions, selon l'ordre défini en 4B.
- E01/E02 partagent un axe ; la liste sur le plan conserve seulement les codes
  retenus dans A, indépendamment des axes demandés par les fiches B.
  E06/E08 utilisent les références confirmées une fois leurs définitions
  validées et intégrées, E07 deux objectifs indépendants sous la source du plan,
  E03/E12 des fiches "À venir". Aucun résultat ni achèvement n'est déduit d'un objectif.
- Déclencher notifications et webhooks après commit. Leur échec ne modifie pas
  un job réussi et ne relance pas la création. Ajouter profil, versions et
  catégories d'erreur à la télémétrie existante, sans contenu de convention.
- Garder quotas, protection contre un ancien worker, confirmation de réimport,
  distinction nouveau job/reprise et rétention. Conserver un checkpoint
  exploitable après échec ; ne pas supposer que le fichier temporaire existe
  encore, il est actuellement supprimé en fin de traitement. Ne pas purger le
  compte rendu avec les données temporaires de reprise.
  Persister les diagnostics structurés produits par l'annexe, distincts de
  l'erreur technique et du checkpoint ; les exposer via le contrat de compte
  rendu livré en 1A.

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
compte rendu. Réutiliser le suivi de la phase 1 et les lectures ordinaires
des plans et indicateurs, avec les sources préparées en phase 4.

- Proposer l'annexe à partir de la capacité serveur, des droits et de
  l'éligibilité. Envoyer son profil explicite ; adapter consignes et options
  pour conserver les sous-actions et références nécessaires. Ne pas envoyer
  une annexe indisponible au pipeline générique. Remplacer aussi le blocage
  temporaire du parcours ordinaire côté interface et backend pour permettre
  aux non-lauréats de créer un plan Électrification sans initialisation
  conventionnelle. Cela n'ouvre pas le profil annexe.
- Présenter "Cible de l'annexe 3" séparément de l'objectif courant, avec unité
  et échéance, notamment dans les
  [indicateurs d'axe](../../apps/app/src/plans/plans/show-plan/plan-arborescence.view/axe/axe-indicateurs.tsx).
  Réutiliser l'affichage des sources et l'adapter pour sélectionner la métadonnée
  exacte du plan, sans mélanger plusieurs imports ni masquer l'objectif local.
  Ne pas ajouter de registre ou d'écran de gestion des engagements. E03/E12
  renvoient à la fiche ordinaire suivie par statut.
- Afficher erreurs localisées, cibles vides, conflits conservés, données non
  appliquées aux objets liés par URL et champs budgétaires non repris.
  Une configuration manquante n'est pas présentée comme un document à corriger.
- Préserver les éditions ordinaires et afficher les liens actuels après
  suppression, déplacement ou dissociation ; ne recréer aucun objet disparu.
  Les écarts avec la convention sont traités par l'ADEME et le support à partir
  du document d'origine, sans API de détection des liens manquants. Ne proposer
  aucun renommage local des indicateurs prédéfinis ni édition des engagements.
- Mettre les textes dans les labels existants et les URLs dans les builders.
  Mettre à jour le guide de parcours et de support avec ces comportements.

**Validation :** parcours navigateur avec faux backend LLM/fixtures : upload,
suivi sans plan, retour après fermeture, erreur/correction par nouvel import,
reprise, succès et compte rendu. Vérifier les cibles E07, zéro/vide, axe sans
fiche, axe B sans engagement, deux plans sans mélange de sources, données
existantes préservées et comportement ordinaire après retrait d'un lien.
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
  Pour E06/E08, formules, périodicités et adéquation métier validées avec
  l'équipe data et le métier, notamment le périmètre autobus/autocars ;
  définitions conformes à l'unité "%" renseignée dans Notion. La présence d'un
  ID dans Notion ne prouve ni cette validation ni l'intégration ; le profil
  reste fermé tant qu'elles manquent.
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
plan, indicateur, lien ou valeur par rollback. Les problèmes d'un import
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
| Cibles par source, E06/E08, deux cibles E07, actions E03/E12 | 2B, 4A, 4B, 4C, 5 | 5 et 6 |
| Personnalisés, valeurs datées, oui/non et codes de référence | 3B, 4A, 4B, 4C, 5 | 5 |
| URL : liens seuls ; codes : complétion sans écrasement | 2B, 4A, 4B, 4C | 5 |
| Liberté d'édition, titres communs, suppression et références | 4A, 4B, 6 | 6 |
| Transaction totale, concurrence, effets après commit | 4A, 4B, 4C, 5 | 5 |
| Compte rendu complet, activation et arrêt sans perte | 1A, 1B, 5, 6 | 7 |
| Budgets facultatifs | 8 | 8, sans bloquer 7 |

Une PR est terminée lorsque ses checks ciblés passent, ses contrats restent
compatibles avec la version précédente et son état de production peut être
maintenu sans la suite. L'ouverture du profil nécessite toutes les phases du
socle et les validations métier ci-dessus. Les validations des lots non cochés
restent à réaliser ; les résultats documentés pour 1A et 1B ne valent pas
validation du profil annexe ni constat de son déploiement.

Restent hors périmètre : dashboard ADEME, bibliothèque d'actions après import,
groupements, export Word, modification des engagements, synchronisation par
réimport et migration/suppression automatique des plans existants.
