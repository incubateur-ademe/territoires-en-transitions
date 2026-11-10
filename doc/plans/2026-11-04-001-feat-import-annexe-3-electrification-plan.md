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

**Sept phases : quatorze PR de code, puis une ouverture progressive.** Les budgets
et financements constituent une huitième phase facultative. Les numéros de PR
ci-dessous désignent les lots ; leur avancement est suivi séparément.

## Avancement

- [x] PR 1A — Contrats des profils et API de suivi : [#5702](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5702), fusionnée le 4 novembre 2026 ; parcours générique vérifié en préproduction.
- [x] PR 1B — Suivi sans dépendre d'un plan : [#5709](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5709), implémentée et vérifiée, en revue.
- [x] PR 2A — Réutilisation du modèle et identification du type existant : [#5722](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5722), implémentée et vérifiée, en revue.
- [x] PR 2B1 — Catalogue des engagements, axes et cibles : [#5730](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5730), implémentée et vérifiée, en revue.
- [x] PR 2B2a — URL TeT existantes et éligibilité : [#5736](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5736), implémentée et vérifiée, en revue.
- [x] PR 2B2b — Codes et compléments des fiches actions : [#5756](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5756), implémentée et vérifiée, en revue ; correspondances métier réelles encore à livrer avant ouverture.
- [x] PR 3A — Lecture documentaire : [#5757](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5757), implémentée et vérifiée, en revue.
- [x] PR 3B — Extraction du canevas DOCX V4 avec assistance IA ciblée : [#5759](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5759), implémentée et vérifiée, en revue. Profil de production toujours fermé.
- [x] PR 4A — Structure explicite, liens et effets après commit : [#5774](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5774), implémentée et vérifiée, en revue. Aucun changement de schéma ; profil de production toujours fermé.
- [x] PR 4B — Indicateurs et liens : [#5775](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5775), implémentée et vérifiée, en revue. Création, sources et liens additifs sous transaction ; aucune migration ni ouverture du profil.
- [x] PR 4C — Valeurs sans écrasement et isolation par métadonnée : [#5778](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5778), implémentée et vérifiée, en revue. Opération interne de complétion et calculs isolés ; rattachement durable et changements de schéma en 4D.
- [ ] PR 4D — Références ADEME durables, engagements retenus et rattachement des sources.
- [ ] PR 5 — Pipeline complet et cycle de vie.
- [ ] PR 6 — Parcours et lecture dans l'app.
- [ ] Phase 7 — Qualification et ouverture en production.
- [ ] Phase 8 — Budgets et financements, facultatifs.

Une case cochée signifie que le lot est implémenté et vérifié dans sa PR,
pas qu'il est fusionné ou déployé. L'ouverture en production reste une étape distincte.

Le cadrage réutilise les entités existantes, sans nouveau modèle métier
d'engagement, de cible ou de convention. Les évolutions minimales de schéma
pour les références durables et le rattachement des sources sont revues dans
la PR 4D dédiée ; la PR 4A reste sans migration. Les engagements sont représentés
par les axes, fiches et indicateurs existants ; les cibles utilisent les sources
de valeurs.
Le type de plan est identifié par son couple existant `(categorie, type)`,
comme le PCAET, sans ajouter de colonne d'identification.
La conservation durable des identités ADEME, de la sélection des engagements
et du rattachement des sources aux plans est livrée en 4D avant la phase 5.
Ces besoins demeurent requis pour l'import et le futur reporting ; les clés
techniques de création ne les résolvent pas. Les validations des définitions
E06/E08, du catalogue Grist vers TeT et du mapping des lauréats restent à obtenir
avant ouverture.

Chaque PR contient son code, ses éventuelles migrations, ses tests et la mise
à jour de sa documentation. Elle compile et fonctionne sans une PR suivante.
Pour les nouveaux comportements, privilégier les suites e2e existantes et
éviter de créer des fichiers de tests unitaires. Les tests d'import utilisent
un faux LLM pour le parcours générique et l'assistance Électrification ciblée.
Le profil Électrification est vérifié avec le vrai parser sur des DOCX synthétiques
issus du canevas officiel V4 ; ces tests ne mesurent pas la fidélité du modèle réel.
Aucun document réellement rempli n'est encore disponible ; cette limite de
qualification reste explicite jusqu'aux premiers imports réels.
Les premières phases livrent des capacités complètes mais gardent l'import
annexe fermé. Il n'y a pas d'ouverture intermédiaire qui importerait seulement
les engagements ou ignorerait les indicateurs des fiches actions.

## Découpage et ordre de livraison

| Phase | PR | Résultat autonome en production | Dépendances |
| --- | --- | --- | --- |
| 1. Contrats et suivi des jobs | 1A, 1B | Jobs historiques compatibles ; suivi retrouvable après fermeture ; admission annexe fermée côté serveur | Aucune phase suivante |
| 2. Identification et références métier | 2A, 2B1, 2B2a, 2B2b | Modèle existant réutilisé ; type identifié par catégorie et libellé ; résolution des références testable sans import | Phase 1 ; 2B2a/2B2b réutilisent 2B1 |
| 3. Lecture et extraction de l'annexe | 3A, 3B | Document transformé en brouillon typé et validé, sans écriture métier | Phases 1 et 2 |
| 4. Primitives de persistance | 4A, 4B, 4C, 4D | Création, liaison et références durables sous transaction, avec lectures isolées par source | Phases 1 et 2 ; 4D réutilise 4A/4B/4C |
| 5. Import complet côté backend | 5 | Pipeline, reprise et transaction finale opérationnels ; admission toujours fermée | Phases 1 à 4, y compris 4D |
| 6. Parcours et lecture dans l'app | 6 | Parcours complet et cibles conventionnelles affichables ; ouverture toujours contrôlée | Phases 1 à 5 |
| 7. Qualification et ouverture | Pas de PR artificielle d'activation | Ouverture à un premier groupe de lauréats, puis élargissement | Phase 6 et prérequis métier validés |
| 8. Budgets et financements, facultatif | 8 | Import budgétaire additionnel ; le socle reste utilisable sans lui | Socle complet des phases 1 à 6 |

Les phases 3 et 4 peuvent être développées en parallèle après la phase 2.
À l'intérieur d'une phase, chaque PR peut être fusionnée et déployée avant la
suivante. En phase 4, 4B fournit les opérations d'indicateurs et de sources,
4C travaille avec un identifiant de métadonnée explicite et 4D livre son
rattachement durable au plan avec les références ADEME. Une phase terminée
reste un état de production supporté si le travail
s'arrête là. Le nombre de PR n'est pas une estimation de délai : l'appétit
produit de deux semaines ne vaut pas engagement sur ces travaux.

Le découpage sépare les revues qui demandent des raisonnements différents :
contrats de jobs, extraction documentaire, intégrité des liens, concurrence
sur les valeurs. La PR 5 assemble des services déjà testés ; elle ne doit pas
devenir la PR qui implémente toutes les écritures. La PR 4D isole la revue du
schéma et de ses usages, sans ajouter de reporting ou de parcours utilisateur.
Éviter les PR de types seuls ou de migrations sans comportement utilisable.
Le catalogue et la préparation des engagements (2B1) sont revus séparément
des références de fiches et des droits d'accès associés (2B2). Le lot 2B2 est lui-même séparé
entre les URL et l'éligibilité (2B2a), puis les
codes et la complétion des fiches actions (2B2b). Ces lots livrent des services internes
complets, sans ouvrir l'import ni créer de données.

## Livraison dédiée avant la phase 5 — PR 4D

- [ ] **Identité ADEME et sélection des engagements :** définir et livrer en 4D la
  conservation des identifiants attendus pour le reporting après renommage ou
  déplacement. Une duplication ordinaire ne doit pas copier l'identité d'annexe.
  Préserver séparément la sélection de A, notamment E01/E02,
  sans la déduire des axes créés à la demande des fiches actions. Les IDs TeT
  identifient les objets, mais ne définissent pas leur correspondance ADEME.
- [ ] **Isolation des cibles :** définir et livrer en 4D le rattachement durable
  de la métadonnée de source exacte d'un plan. Les écritures, lectures et calculs
  de deux plans doivent rester
  séparés, y compris pour le même indicateur et la même période.

Le schéma précis reste à définir dans cette PR : réutiliser les tables
existantes et justifier chaque adaptation par ses écritures et lectures.
Ne pas déplacer ces données métier dans le JSON d'un job : les checkpoints
restent des données de reprise avec leur rétention technique. La PR 4D doit
être utilisable et vérifiée sans attendre la phase 5 ; elle précède
l'intégration complète et la qualification pour le reporting. Elle ne comprend
ni dashboard ni moteur de reporting.

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
- Les migrations additives de 4D sont livrées avec leurs usages et passent
  avant le code qui les utilise. Un rollback applicatif garde les données.
  Après ouverture,
  conserver un backend au moins aussi capable que celui de la phase 5 et une
  app capable de lire les jobs et les sources de valeurs de la phase 6. Revenir au
  worker générique initial n'est pas un rollback sûr.
- Avant ouverture, un retour à une API plus ancienne nécessite d'abord une
  app compatible avec ses routes et contrats. Ne pas retirer une lecture de
  suivi alors qu'une app déjà déployée l'utilise.
- Électrification utilise une seule version technique de checkpoint :
  `schemaVersion`, initialisée à `1`. La V4 du canevas et la version du catalogue
  identifient le document officiel et les correspondances métier.
  Ne pas invalider les checkpoints génériques v1 par une hausse globale de
  version. Garder les versions nécessaires aux reprises autorisées et aligner
  les contrôles du worker avec ceux de l'API de reprise.
  Comparer profil, version technique et catalogue entre job et checkpoint,
  y compris après la dernière étape, et vérifier la compatibilité du checkpoint
  selon son profil.
  Les contrôles de contrat et de schéma génériques déjà livrés restent inchangés.
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
  sources existants. Les écritures et liens sont livrés en 4A/4B/4C ; les
  références durables et le rattachement des sources sont livrés en 4D avant
  la phase 5. Aucune nouvelle
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

### PR 2B1 — Catalogue des engagements, axes et cibles

**Périmètre :** configuration versionnée des engagements dans le domaine `plans`,
préparation des axes demandés par A/B et résolution des cibles du tableau A
vers les indicateurs existants. Services internes seulement, sans nouvelle
table, API publique, écriture métier ni administration de catalogue.

Les traitements spécifiques sont regroupés sous
`ai-plan-import/electrification/resolve-engagements/`, avec leurs contrats,
règles, erreurs et e2e. Le token d'injection reste dans
`electrification/electrification.constants.ts`. Les contrats communs aux imports
et les définitions métier conservent leur emplacement partagé.

- Livrer le contrat métier typé d'entrée/sortie de cette préparation avec son
  implémentation. L'extracteur de la phase 3 le produira ; ce lot ne dépend
  d'aucun type ou export laissé à une PR suivante. Conserver clés de source
  et localisations pour le rattachement et les diagnostics.
- Placer `Engagement` et `EngagementCible` dans `packages/domain/src/plans/plans`,
  exportés par `@tet/domain/plans` pour les parcours du plan. Dans l'import,
  dériver `EngagementImport` et `EngagementCibleImport` de ces schémas en ajoutant
  les sources `ImportSource`. Le domaine ne dépend pas de l'import ni de l'IA ;
  le format et les validations d'import existants sont conservés.
  Le catalogue, la structure A/B, l'échéance 2030 et les contrôles E07 restent
  propres à Électrification.
  Réutiliser les modèles et services existants ; ce lot ne crée aucun moteur
  générique ni entité persistante d'engagement.
- Utiliser le catalogue de correspondances versionné dans Git et les
  définitions d'indicateurs existantes de TeT. La configuration, son schéma
  et son type sont exportés par `@tet/domain/plans` depuis
  `electrification.config.ts` ; le backend conserve le branchement
  Nest et sa validation à la résolution. Les documents Notion et Grist
  éclairent les décisions conservées dans l'ADR ; leurs liens ne font pas
  partie du contrat du résolveur. Toute évolution du mapping nécessite une
  validation métier, une PR et une nouvelle version du catalogue, sans
  synchronisation automatique depuis ces documents. Résoudre les références
  explicites, jamais par ressemblance de titre ni par ID numérique codé en dur.
- Calculer l'union des axes demandés par A et B : axe 1 commun à E01/E02,
  axe retenu sans fiche, axe demandé par B sans engagement implicite et axes
  libres. Utiliser des clés de parents stables ; le numéro d'axe fait foi
  sur son intitulé. La résolution du contenu des fiches actions reste en 2B2.
- Résoudre les indicateurs des cibles avec leurs unités et périodicités
  validées. E07 conserve deux cibles indépendantes ; zéro reste une valeur,
  une cible vide reste absente avec un avertissement. E03/E12 préparent des
  fiches ordinaires "À venir", sans déduire de réalisation de leur sélection.
- Une définition absente, ambiguë ou non conforme et une périodicité non
  validée produisent une erreur de configuration, pas une demande de correction
  de l'annexe. Ne pas créer d'indicateur personnalisé de remplacement.
  Pour E06/E08, les formules, l'adéquation métier et les dépendances restent
  à valider ; les composantes prévues pour E08 sont `autobus_elec` et `autocar_elec`.
- Garder l'admission annexe fermée. Une configuration incomplète ne bloque
  ni le démarrage du backend ni les imports génériques. Les e2e utilisent
  des fixtures synthétiques validées tant que les données métier ne sont
  pas prêtes ; leur réussite ne vaut pas validation du catalogue réel.

Les correspondances relevées dans Notion sont documentées dans
l'[ADR, section catalogue](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md#3-un-catalogue-versionné-et-une-identité-indépendante-des-libellés).
Leurs périodicités restent à valider avant utilisation ; une cible annuelle
2030 n'est pas convertie vers une autre périodicité. Les correspondances de
sous-axes restent indisponibles tant que le mapping Grist n'est pas livré.

**Validation attendue :** axe vide, union A/B, E01/E02, axe libre, référence
d'axe incohérente, clés stables, cible zéro/vide, deux cibles E07, E03/E12,
unités et périodes invalides, définitions absentes/ambiguës et configuration
non validée. Vérifier l'absence d'écriture et la conservation de l'admission fermée.

**Vérifications effectuées :** 39 e2e du
[résolveur](../../apps/backend/src/plans/ai-plan-import/electrification/resolve-engagements/resolve-electrification-engagements.service.e2e-spec.ts)
avec vraie base et définitions synthétiques, 17 e2e de suivi et 14 e2e du
parcours HTTP générique avec faux LLM. Ces suites vérifient la structure,
les deux cibles E07, les droits, les configurations invalides, l'absence
d'écriture métier et le maintien de l'admission annexe fermée. Les e2e du
résolveur vérifient aussi l'utilisation du contrat métier sans contexte
d'import, son adaptation documentaire et les validations Électrification,
ainsi que le rejet d'identifiants de base injectés dans les engagements ou
cibles. Builds domain et NestJS, TypeScript backend/tests, ESLint ciblé et
liens locaux vérifiés. Aucun nouveau
fichier de tests unitaires ni appel réel au modèle. Le catalogue livré reste
en attente des validations métier ; ce résultat ne qualifie pas un import réel.

**Déploiement et arrêt possible :** après 2A, services internes sans migration ;
aucune création de plan ni dépendance à 2B2 pour fonctionner. Les références
des fiches actions et l'éligibilité restent à livrer avant le pipeline complet.

### PR 2B2a — URL TeT existantes et éligibilité

**Périmètre :** résoudre les URL de fiches actions et d'indicateurs dans le
périmètre accessible à la collectivité cible ; vérifier son éligibilité au programme.
Deux services internes sans nouvelle table, API publique ni écriture métier. Le
résolveur réutilise `ListFichesService`, `FicheActionPermissionsService` et
`ListIndicateursService` pour les lectures, droits et périmètres existants.
L'éligibilité réutilise `PermissionService` et ajoute seulement la décision
métier issue du mapping des lauréats ; elle reste distincte des feature flags.

- [x] Reconnaître les URL de l'origine configurée et de l'app de production,
  avec les routes de fiches actions actuelles et leurs redirections maintenues.
  Les indicateurs sont résolus par ID d’indicateur personnalisé ou identifiant
  de référentiel.
  Aucun fetch, redirection HTTP ni rapprochement par titre.
- [x] Contrôler les permissions ordinaires d'import. Une fiche action doit
  appartenir à la collectivité cible ou lui être partagée, et être accessible en écriture
  avec les règles existantes. Une lecture publique ne suffit pas. Vérifier
  aussi que la collectivité de l'URL appartient à ce périmètre de partage.
  Résoudre les indicateurs dans le catalogue visible de la cible, y compris
  ses groupements ; aucune valeur de la collectivité de l'URL n'est lue.
- [x] Retourner uniquement l'identité résolue ou un diagnostic bloquant.
  Conserver les champs, valeurs, sous-actions et liens existants. Le compte
  rendu des champs documentaires non appliqués sera produit avec les brouillons
  des fiches actions en 2B2b ; ce lot ne reçoit pas ces champs.
- [x] Refuser explicitement les anciens UUID de fiches actions sans inventer
  de mapping.
  Le modèle actuel utilise des ID numériques malgré le nom `ficheUid` côté app.
  Les URL historiques à ID numérique restent prises en charge.
- [x] Placer le mapping versionné des lauréats dans le domaine `plans`, avec
  source, version et bornes de validité. `null` signifie non livré ; une liste
  complète valide permet une décision éligible ou non éligible. Une configuration
  absente, inactive, invalide ou ambiguë reste une erreur distincte.
  Le résultat conserve la provenance et la date de vérification. La sélection
  du groupe de déploiement reste indépendante.
- [x] Garder la configuration réelle des lauréats absente et l'admission fermée.
  La vérification est différée à l'appel du service et ne bloque pas le démarrage.
  Le raccordement aux capacités, à l'enfilement et à la provenance des jobs
  intervient en phase 5, avec revalidation avant écriture.

**Vérifications effectuées :** 61 e2e sur vraie base : 29 pour les
URL, 18 pour l'éligibilité et 14 pour le parcours HTTP générique/PCAET avec
faux LLM. Les tests couvrent la conservation des objets et valeurs, les droits,
le partage puis son retrait, les groupements, les configurations invalides et
le maintien de l'admission annexe fermée. Les 47 e2e des deux services
réutilisent le `FakeLlmRepository` existant et vérifient explicitement l'absence
d'appel à `complete` et `chat`. Builds domain et NestJS, TypeScript
backend/tests, ESLint ciblé et 37 liens locaux vérifiés.
Ces fixtures synthétiques valident le comportement technique ; elles ne
valident ni la liste des lauréats ni les correspondances Grist. Aucun appel réel
au modèle ni nouveau fichier de tests unitaires.

**Déploiement et arrêt possible :** après 2B1, sans migration ni ouverture de
profil. Aucun plan ni lien n'est créé ; le parcours générique reste disponible.
Les codes et compléments des fiches actions restent à livrer en 2B2b.

### PR 2B2b — Codes et compléments des fiches actions

**Périmètre :** étendre la configuration et les contrats de 2B1 aux actions,
sous-actions et indicateurs des fiches actions, en réutilisant la résolution des URL
livrée en 2B2a. Préparation sans écriture métier ni nouvelle API publique.

- [ ] Livrer les correspondances Grist validées, leurs unités principales,
  périodicités et numéros de sous-axes. Ne pas inventer les correspondances
  encore absentes ; `6-a`/`6-b` ne sont pas assimilés à `s_26`/`s_26.a` sans
  validation métier. La configuration appartient au domaine `plans`.
  Le contrat est livré ; les données réelles restent à valider avant ouverture.
- [x] Résoudre les codes et contrôler les axes/sous-axes. Une référence fournie
  invalide bloque ; une référence vide désigne un objet personnalisé.
  Valider unités, périodes et cohérence des références sans conversion implicite
  de "Ponctuelle" en annuelle ni invention d'unité ou de date.
- [x] Pour les objets désignés par URL, préparer uniquement leurs liens et signaler
  les champs de l'annexe non appliqués. Un indicateur identifié à la fois par
  code et par URL ne produit qu'un lien ; la conservation par URL prime.
- [x] Pour les nouvelles fiches de référence, compléter uniquement les champs non
  renseignés de l'annexe avec les valeurs prévues au catalogue. Ne pas ajouter
  deux fois une sous-action présente dans les deux sources. Contrôler les dates
  fusionnées. Les codes de sous-actions sont résolus dans leur action de référence ;
  leur rattachement à une fiche libre reste à préciser avec le catalogue métier.
- [x] Extraire le contrat et la préparation communs des fiches : fusion des champs,
  validation des titres/dates et compléments de sous-actions sans doublon.
  Réutiliser les contrôles de titre/date dans l'import Excel. Garder les codes,
  axes, engagements et indicateurs dans l'orchestrateur Électrification.
- [x] Auditer les nouveaux fichiers contre l'existant : réutiliser le contrôle des
  sources, les règles de références URL, les schémas de champs/textes et le type
  des valeurs d'indicateurs. Conserver les règles de fusion et de doublons propres
  à la préparation documentaire, sans nouveau service.
- [x] Préparer les résultats et objectifs numériques datés, sans confondre zéro
  et absence. Respecter la périodicité du catalogue et garder son titre commun.
  Convertir les indicateurs oui/non en sous-actions : seul le résultat "Oui"
  donne "Réalisé" ; l'année d'objectif donne une échéance conventionnelle en fin
  d'année. Garder la réponse et son année d'observation dans le résultat préparé.
- [x] Une configuration incomplète produit un diagnostic de configuration et ne
  bloque ni le démarrage ni les imports génériques. Tester avec des fixtures
  synthétiques tant que les données métier restent à valider.

**Validation attendue :** codes inexistants/ambigus, absence de correspondance,
axes incohérents, unités doubles, périodes invalides, compléments sans écrasement
ni sous-action dupliquée, diagnostics de données conservées pour les URL.

**Implémentation :** contrat et configuration partagés dans `@tet/domain/plans`,
orchestration par
[`ResolveElectrificationFichesService`](../../apps/backend/src/plans/ai-plan-import/electrification/resolve-fiches/resolve-electrification-fiches.service.ts).
Les traitements propres aux fiches actions, leurs contrats, règles, erreurs
et e2e sont regroupés sous `ai-plan-import/electrification/resolve-fiches/`,
à côté des engagements.
Le résultat distingue `fiches`, préparées depuis les fiches actions du document,
et `fichesEngagements`, issues des engagements E03/E12. Le repère "section B"
reste dans les explications d'extraction et les localisations documentaires.
Le [contrat documentaire commun](../../apps/backend/src/plans/ai-plan-import/prepare-fiche/prepare-fiche.schema.ts)
et `PrepareFicheRules` restent dans `ai-plan-import/prepare-fiche/` : ils reçoivent
des références et compléments déjà résolus, sans lire le catalogue ni la base.
Les champs et `FicheImportRules` appartiennent au domaine ; l'import Excel partage
les contrôles de titre/date tout en gardant ses erreurs. Aucun service Nest ajouté.
Réutilisation des résolveurs d'engagements et d'URL, de `ListIndicateursService`,
des contraintes de `ficheSchema` et de `IndicateurPeriodes`. Aucun nouveau modèle
persistant, endpoint ou appel documentaire externe. La configuration est renommée
`electrification.config.ts` pour couvrir A et B avec une seule version.
Les correspondances des fiches actions et des sous-axes restent à `null` ; les
fixtures de test ne valident pas le catalogue réel.

**Vérifications effectuées le 9 novembre 2026 :** après le renommage du contrat,
93 e2e passent : 54 pour les fiches actions et les règles communes, 39 pour les
engagements. Un cas vérifie la conservation simultanée des fiches documentaires
homonymes et des fiches issues d'E03/E12 dans leurs collections respectives.
Les cas de collision entre sources des axes,
fiches, sous-actions et indicateurs protègent le contrôle partagé. La suite
des fiches actions vérifie aussi les compléments, les homonymes, la priorité
aux URL, l'absence de mutation et d'écriture métier, ainsi que l'absence
d'appel au faux LLM.
TypeScript backend/tests, ESLint et formatage ciblés, ainsi que 41 liens locaux
et ancres vérifiés. Aucun appel réel au modèle ni nouveau fichier de tests unitaires.

**Déploiement et arrêt possible :** après 2B2a, services internes seulement ;
aucune création de plan. Le pipeline complet reste fermé.

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
  avec le tableau A, la section B renseignée, le modèle vide et l'exemple fictif C.
- Couvrir les formats déjà acceptés avec un diagnostic technique lorsque
  la destination d'un lien est illisible ; aucun fetch des URL. La validation
  métier du contenu A/B et de ses références appartient au lot 3B.

**Contrat de lecture :** les [liens et localisations](../../apps/backend/src/plans/ai-plan-import/pipeline/document/document-page.ts)
complètent les pages, lignes et unités existantes. Les coordonnées désignent
la source avant nettoyage : section logique/ligne pour Word, page/ligne et
rectangle natif pour PDF, feuille/rangée/colonne pour les tableurs. Les
cellules fusionnées citent leur cellule maître. Aucun offset dans le texte
normalisé ne sert de localisation.

Le texte générique reste inchangé. Les lignes fusionnées, les en-têtes
tableur composés et les rappels de fusion conservent leurs sources lors du
découpage. `page.links` garde aussi les liens sans libellé, les annotations
PDF sans texte associé et les liens de marges retirées. Ils ne sont pas
attribués à une unité voisine : le lot 3B doit consulter ce registre en plus
des liens des unités. Une destination inaccessible à la lecture est `null`,
notamment pour une formule `HYPERLINK` dynamique ; aucune formule n'est
évaluée, aucune cible n'est déduite d'un libellé OCR. Les signets Word sans
hyperlien ne sont pas des références.

Les lecteurs utilisent mammoth, ExcelJS et le proxy PDF déjà présents. Le
[contrat et les règles documentaires](../../apps/backend/src/plans/ai-plan-import/pipeline/document/document-links.rules.ts)
sont communs aux profils ; le checkpoint générique et `SourceChunks` restent
textuels. La fixture synthétique A/B/C prépare l'extraction du lot 3B ; elle
ne valide pas encore la sélection des sections métier.

**Validation :** liens masqués ou affichés, cellules fusionnées, plusieurs liens
dans un champ, coordonnées après normalisation, régression des lecteurs génériques.

**Vérification du lot 3A, 9 novembre 2026 :** 204 tests passent, dont les
21 scénarios de l'e2e existant (7 nouveaux parcours documentaires) et
183 tests existants des lecteurs, de la normalisation, des grilles et du
découpage. Les fixtures couvrent les quatre formats, les liens sans libellé,
les signets Word, les formules sans cache ou dynamiques, les césures, les
marges et l'OCR factice. TypeScript backend/tests, ESLint et formatage ciblés,
ainsi que 44 liens locaux et ancres vérifiés. Aucun appel réel au modèle ni
nouveau fichier de tests unitaires.

**Déploiement et arrêt possible :** enrichissement du contrat documentaire ;
aucun nouveau profil exécuté, aucun changement de persistance.

### PR 3B — Extraction annexe et checkpoint typé

**Périmètre :** parser déterministe du canevas officiel DOCX V4, assistance IA
automatique limitée aux valeurs numériques en prose, adaptation et validation
du brouillon, sans worker de production branché sur ce profil.
La [révision de l'ADR du 9 novembre](../adr/0022-initialiser-plan-electrification-depuis-annexe-3.md#statut)
prévoit d'appeler l'IA lorsque le parser ne comprend pas une cible d'engagement
ou une valeur numérique d'indicateur éligible, sans option d'activation. Les
documents PDF, tableurs et structures libres ne font pas partie du contrat de ce profil ;
l'import générique les conserve.

- [x] Conserver les tableaux, cellules et liens DOCX avant aplatissement, puis
      reconnaître les sections et libellés du canevas sans indices de ligne fixes.
      Lire seulement A et les fiches renseignées dans B ; exclure textes d'aide
      connus, modèle vide et exemple C. Refuser les structures inconnues et valeurs
      invalides des champs contrôlés avec leur localisation, sans omission
      silencieuse ni fallback général. Valider aussi les dates et statuts renseignés
      d'une fiche désignée par URL : une valeur invalide bloque avant création du
      plan ; les champs valides restent non appliqués et signalés au compte rendu.
- [x] Regrouper les libellés, textes d'aide et correspondances des engagements
      dans une définition explicite du format V4, séparée des règles d'extraction
      et du catalogue métier, sans modifier le canevas officiel.
- [x] Produire engagements/cibles, axes, fiches, sous-actions, codes/URL, unités
      et valeurs datées avec clés et localisations de source. Copier les textes
      libres sans reformulation. Préserver les homonymes et parents distincts.
- [x] Conserver les conversions oui/non, E03/E12, E07 et les résolveurs existants.
      Ne pas fusionner par titre ni appliquer les enrichissements génériques.
      Reprendre les champs non budgétaires effectivement renseignés, sans créer
      de compte depuis un nom de pilote.
- [x] Sérialiser un checkpoint avec une seule version technique, `schemaVersion: 1`,
      `templateVersion: "electrification-v4"`, `documentKind: "docx"` et catalogue
      versionné, sans identité TeT résolue. Une reprise compatible conserve
      l'extraction et revalide références et droits. Une version incompatible
      bloque sans ré-extraction ni conversion automatique.
- [x] Adapter l'évaluation locale : extraction DOCX, puis assistance automatique
      seulement si des cellules sont éligibles ; formats et options incompatibles
      refusés.
      Le parcours générique conserve ses stratégies et son fournisseur configuré.
- [x] Vérifier le parser sur des fixtures DOCX synthétiques issues du canevas
      officiel, de la lecture aux résolveurs ; compléter les e2e existants et
      vérifier les non-régressions génériques sans appel réel au modèle.
- [x] Isoler les cellules numériques non comprises après reconnaissance
      déterministe du formulaire. Réutiliser `LlmService` uniquement pour ces
      candidates avec leur contexte, automatiquement. Ne lui confier
      ni structure, descriptions, dates, statuts, Oui/Non, codes, URL ni résolution.
- [x] Exiger nombres, unités, années et citations exactes de la source ; contrôler
      côté serveur citations, emplacements attendus et conservation des nombres.
      Réappliquer le parser et les validateurs existants. Une ambiguïté, une
      information manquante ou une preuve insuffisante reste bloquante.
- [x] Conserver sources originales, interprétations acceptées et tokens dans le
      checkpoint. La reprise réutilise l'extraction sans rappeler le modèle.
- [x] Garder zéro appel au modèle lorsque le parser suffit ou détecte une erreur
      non éligible, l'admission de production fermée et les évaluations réelles
      réservées aux humains. Aucun paramètre d'activation de l'assistance n'est ajouté.
- [x] Compléter les e2e existants avec un faux LLM : candidats acceptés, preuves
      invalides, données ambiguës, valeurs déjà reconnues et reprise sans appel.

**Implémentation :** l'[extracteur](../../apps/backend/src/plans/ai-plan-import/electrification/extract-plan/extract-electrification-plan.ts)
consomme les tableaux du lecteur DOCX et alimente le même contrat documentaire
et les mêmes résolveurs. Les références sont extraites de leur cellule ; leurs
textes et destinations restent vérifiables. Les transformations de valeurs
sont contrôlées. Selon la convention confirmée le 9 novembre, les dates de
fiche et de sous-action renseignées avec un mois et une année utilisent le
premier jour du mois (`06/2028` ou `juin 2028` → `2028-06-01`). Une date
complète conserve son jour ; une année seule ou une date invalide est signalée.
Le lecteur textuel et les stratégies génériques restent disponibles pour les
autres profils.

L'[assistance ciblée](../../apps/backend/src/plans/ai-plan-import/electrification/extract-plan/interpret-electrification-values.ts)
réutilise `LlmService` uniquement pour les cellules numériques éligibles que le
parser ne comprend pas. Le [contrat de réponse](../../apps/backend/src/plans/ai-plan-import/electrification/extract-plan/electrification-value-interpretation.schema.ts)
exige les littéraux et leurs citations ; l'extraction complète repasse ensuite
dans le même parser. Aucun modèle n'est appelé lorsque celui-ci suffit ou
détecte une erreur non éligible.

La [lecture du formulaire](../../apps/backend/src/plans/ai-plan-import/electrification/extract-plan/electrification-fiche-form.rules.ts)
gère les sections et champs répétés à partir de la
[définition du canevas officiel](../../apps/backend/src/plans/ai-plan-import/electrification/extract-plan/electrification-document-template.constants.ts).
Les titres d'axes du Word sont reconnus depuis cette définition, indépendamment
des titres métier du catalogue. Le numéro assure le rattachement ; le titre
du plan préparé vient du catalogue, même après un renommage métier.
La [construction des fiches](../../apps/backend/src/plans/ai-plan-import/electrification/extract-plan/electrification-fiches-document.rules.ts)
valide leur rattachement et leurs valeurs, en réutilisant les conversions existantes.
Les règles, le format V4 et le catalogue utilisent les noms métier de
`ElectrificationEngagementCodeEnum` (par exemple `DECOMMISSIONNEMENT_RESEAU_GAZ`).
Les identifiants E01 à E12 restent les valeurs sérialisées du contrat.
Le profil utilise également un nom métier dans le code
(`AiPlanImportProfileEnum.ELECTRIFICATION`) ; sa valeur sérialisée
`annexe-3-electrification` reste inchangée pour le contrat API et les options des jobs.

Le [checkpoint](../../apps/backend/src/plans/ai-plan-import/electrification/extract-plan/electrification-extraction-checkpoint.schema.ts)
porte `schemaVersion: 1`, les métadonnées de canevas et de catalogue, la réponse,
les sources originales et les interprétations acceptées. Les tokens restent à
zéro sans assistance et sont comptabilisés lorsqu'elle est utilisée. Cette
première livraison
utilise `ELECTRIFICATION_CHECKPOINT_VERSION` comme unique version technique ;
la V4 du canevas reste une métadonnée de `electrificationDocumentTemplate`. La
[préparation interne](../../apps/backend/src/plans/ai-plan-import/electrification/extract-plan/prepare-electrification-import.service.ts)
vérifie les droits et la compatibilité du checkpoint, puis appelle les
résolveurs existants, sans rappeler le modèle à la reprise. Son callback conserve
l'extraction avant une erreur de
résolution ; le raccordement au stockage des jobs et au worker reste en phase 5.
Le catalogue reste `electrification-v2` ; les libellés du canevas appartiennent
au parser. Ce changement ne valide aucune correspondance métier encore en attente.

L'[évaluation locale](../../apps/backend/src/plans/ai-plan-import/eval/README.md#profil-électrification)
accepte `--profile annexe-3-electrification` et produit le checkpoint avec
`referencesResolved: false`. L'assistance est automatique sur les seules cellules
candidates que le parser ne comprend pas. Aucun appel au modèle n'est effectué
si le parser suffit. Ce parcours pouvant appeler le modèle réel, son lancement
est réservé à un humain. Les sources originales et les interprétations restent
consultables.
Elle ne résout pas les références en base et n'exécute aucune écriture métier.
Les options génériques de comparaison et de normalisation restent incompatibles.
Le CLI sépare validation des entrées, exécution du parcours et restitution des
résultats. Le modèle n'est appelé que pour le parcours générique ou
les cellules éligibles à l'assistance ; tout contexte Nest créé est fermé même
si la lecture ou le pipeline lève une erreur.

**Validation attendue :** DOCX V4 avec plusieurs tableaux B, A sans fiche,
axe demandé seulement par B, homonymes, sous-actions, E03/E12, deux cibles E07,
zéro/vide, résultats/objectifs oui/non, exclusion du modèle vide et de C,
conservation des textes et des liens, dates complètes et mois/année convertis
selon la convention, champs invalides localisés, formats et structures refusés,
dates/statuts invalides refusés même pour une fiche désignée par URL,
reprise sans extraction ni appel au modèle avec droits/catalogue actuels.
Vérifier les valeurs attendues depuis les fichiers ; pour l'assistance seulement,
simuler les réponses du LLM et vérifier les garde-fous avec le vrai parser.
Refuser plages, nombres inventés ou omis, citations absentes et champs inattendus.
Vérifier que les dates/statuts invalides restent bloquants, y compris avec une URL
de fiche existante, et qu'un document reconnu par le parser conserve zéro appel au modèle.

**Vérifications antérieures à la simplification du checkpoint, 9 novembre 2026 :**
245 tests avaient réussi : 104 e2e
extraction/résolution, 39 e2e engagements, 21 e2e du parcours générique,
13 e2e indicateurs annuels, 18 tests du lecteur et 50 tests du pipeline générique.
Les suites existantes ont été complétées, sans nouveau fichier de tests unitaires.
Les exports PNG/SVG passent après l'extraction dans le même worker.
Build backend, typechecks domain/backend/tests, ESLint, Prettier et 54 liens/ancres
locaux vérifiés. Le CLI refuse les formats/options incompatibles sans modèle.
Une copie du véritable DOCX V4, remplie avec des données synthétiques, conserve
E03/E12, une fiche, une sous-action, un indicateur, leurs valeurs et les dates
partielles converties au premier jour du mois ; C est exclu. Aucun appel au modèle.

Après regroupement de la définition V4 et nommage des identifiants d'engagement,
les 143 e2e avaient réussi (104 extraction/résolution des fiches et 39 engagements).
Les JSON du catalogue et du format V4 sont strictement identiques avant/après
nommage, y compris l'ordre des clés ; les fixtures restent indépendantes.
Une comparaison temporaire de 2 063 variantes (1 119 fiches et 944 tableaux
d'engagements) donne les mêmes données, sources et erreurs, dans le même ordre.
Les 12 tests existants d'évaluation ont également réussi lors de la refactorisation du CLI.
Les six cas CLI comparés conservent leurs sorties et codes de retour ; le
DOCX synthétique et cinq résultats génériques conservent leur JSON, hors
horodatage et durée. Ces comparaisons n'appellent aucun modèle et ne valident
pas le changement ultérieur de version du checkpoint.

**Vérification avant l'assistance ciblée, 9 novembre 2026 :** les 105 e2e
d'extraction/résolution ont réussi, notamment les reprises compatibles et les refus
de métadonnées incompatibles, ainsi que les dates et statuts invalides d'une fiche
référencée par URL. Typecheck domain/backend/tests, ESLint, Prettier
et 58 liens locaux/ancres vérifiés. Aucun appel au modèle. Ces résultats portent
sur le socle déterministe avant l'assistance.

**Vérification de l'extraction hybride, 10 novembre 2026 :** 129 e2e
d'extraction/résolution réussis, dont 24 nouveaux cas, ainsi que les 21 e2e du
parcours générique. Les tests utilisent des faux fournisseurs, sans appel payant.
Build backend, typechecks domain/backend/tests, ESLint et Prettier du code
vérifiés, ainsi que 61 liens locaux et ancres. Huit contrôles CLI réussis
sans modèle : aide, profil inconnu, cinq options génériques incompatibles et
refus du CSV. Ces vérifications couvrent le code et les garde-fous ; elles ne
mesurent pas la fidélité d'un modèle réel.

**Séparation des titres du canevas et du catalogue, 10 novembre 2026 :**
133 e2e d'extraction/résolution réussis. Les quatre nouveaux cas vérifient le
renommage métier avec une cellule fusionnée et une fiche B, le refus d'un titre
Word remplacé par le nouveau titre métier, le refus d'un autre axe officiel et
l'absence de l'axe dans le catalogue. Les 11 libellés du template correspondent
à la fixture indépendante du canevas. Aucun appel IA réel.

Aucun document réellement rempli n'est disponible ; les fixtures couvrent
uniquement le canevas et les variantes explicitement testées. La comparaison
des premiers documents réels à leurs résultats reste à effectuer.
L'assistance doit être comparée au parser seul sur les mêmes documents annotés :
mesurer les rejets injustifiés et les valeurs incorrectes acceptées, sans déduire
un gain de fiabilité des seuls tests avec faux LLM. Ces résultats participent à
la qualification du profil avant son ouverture en production.
Toute variante supplémentaire doit être observée dans un document et couverte
par les tests. Une instruction reformulée dans une cellule libre peut être
importée comme une saisie ; la définition du format ne lève pas cette ambiguïté.

**Déploiement et arrêt possible :** extraction utilisable en test/évaluation,
aucune admission annexe en production et aucune écriture métier partielle.

## Phase 4 — Primitives d'écriture sûres

### PR 4A — Structure explicite et effets après commit

**Périmètre :** [création d'agrégat](../../apps/backend/src/plans/plans/create-plan-aggregate/),
adaptateurs existants et liaison des fiches aux axes.

**Livraison 4A :** l'agrégat reçoit des axes et fiches identifiés par clé, y
compris les axes vides, et retourne les correspondances vers les IDs créés.
L'adaptateur Excel/IA générique conserve ses entrées par chemins et titres.
Les liens de fiches existantes sont ajoutés sous transaction, sans mutation de
leur contenu. Le contrôle de portée et de partage est commun au résolveur
et à l'écriture. Les clés locales à la requête servent à relier les objets
créés ; elles n'ajoutent pas d'identité métier persistante. Le schéma et les
privilèges SQL restent inchangés.
Les notifications sont déclenchées par le propriétaire de la transaction après
le commit, y compris après l'enregistrement du job IA terminé. Leur échec
n'invalide pas le plan créé. L'assemblage du pipeline Électrification reste en PR 5.

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
conservés, partage et droits, import générique et validation des clés locales.
Aucun webhook après rollback ;
un échec de notification ne provoque pas une seconde création.

**Déploiement et arrêt possible :** amélioration complète de l'agrégat existant,
sans migration ni activation annexe. Revenir au code précédent avant ouverture
reste possible.

### PR 4B — Indicateurs et liens sous transaction appelante

**Périmètre :** [création d'indicateur personnalisé](../../apps/backend/src/indicateurs/indicateurs/mutate-indicateur/create-indicateur.service.ts),
liens axe/indicateur et fiche/indicateur.

**Livraison 4B :** la création personnalisée accepte le contexte `{ user, tx? }`.
Le service commun `AddIndicateurLinksService` ajoute les liens aux axes et aux
fiches sous la transaction obligatoire de l'appelant, après contrôle des droits,
de la collectivité et des partages. Les repositories existants fournissent les
insertions additives ; leurs setters conservent leur comportement de remplacement.
Un lot qui crée aussi des indicateurs prend le verrou exclusif du graphe avant
ses premières lectures verrouillées. Les services de sources transmettent la
transaction aux opérations existantes et renvoient l'ID exact de la métadonnée
créée, y compris si plusieurs métadonnées partagent une source et une date.
Le schéma reste inchangé et le profil Électrification reste fermé.

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
- Réutiliser la création de sources et métadonnées d'indicateurs sous la
  transaction commune, en conservant leurs contrôles. Retourner l'identifiant
  exact utilisable par 4C. Le rattachement durable au plan et ses lectures
  appartiennent à 4D ; 4B reste utilisable sans ce rattachement.

**Validation :** création ordinaire inchangée ; rollback de toutes les données
de l'indicateur ; liens préservés ; droits refusés ; ordre des verrous ; titres
prédéfinis inchangés ; création de métadonnées distinctes et rollback commun.
Les appels autorisés n'utilisent pas de contournement des droits.

**Déploiement et arrêt possible :** nouvelles opérations internes complètes,
API ordinaires conservées, aucune écriture issue d'une annexe.

### PR 4C — Écrire les valeurs sans écrasement et isoler les métadonnées

**Périmètre :** [écriture des valeurs](../../apps/backend/src/indicateurs/valeurs/write-indicateur-valeurs/),
lectures et calculs par métadonnée, compte rendu des conflits. Ces règles
méritent une revue séparée de la création des définitions : elles protègent
les saisies existantes et concurrentes ainsi que les valeurs des autres plans.
Les opérations prennent un `metadonneeId` explicite et contrôlé ; elles ne
dépendent pas du rattachement au plan livré en 4D.

**Livraison 4C :** `ReconcileIndicateurValeursService.fillMissing` complète les
cellules absentes et retourne les conflits conservés. Validation, lecture,
comparaison, écriture et réconciliation partagent les verrous et la transaction.
La normalisation est commune aux écritures ; elle ne réarrondit pas les valeurs
historiques conservées. Une répétition identique ne réécrit pas leur audit.
Une ligne enrichie devient manuelle selon les règles ordinaires, pour protéger
ses cellules d'un recalcul ultérieur.

Les lectures filtrent déjà par `metadonneeId`. Les calculs isolent la source
`electrification` par métadonnée, comme PCAET, et un objectif seul n'alimente pas
un résultat via une source externe. Cette restriction par champ est portée par
la politique de source ; l'évaluateur commun ne connaît pas Électrification.
Les compléments externes restent possibles selon les règles ordinaires pour
PCAET et les autres sources. L'autorisation interne de métadonnée est
bornée à sa source, sa collectivité et son ID ; le parcours de complétion garde
un utilisateur authentifié et les droits ordinaires. Elle n'est pas un champ de
requête. La PR 4D la produira depuis le rattachement vérifié au plan ; 4C
n'autorise aucun rattachement à partir d'un ID seul. Le schéma et l'admission
Électrification restent inchangés.

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
  Réutiliser les lectures de valeurs en ciblant le `metadonneeId` fourni.
  La résolution durable de cet identifiant depuis le plan est livrée en 4D.
  Deux plans partageant un indicateur ne doivent pas lire la dernière valeur
  disponible sous le seul nom de source.
- Adapter l'isolation des calculs par métadonnée, à partir du mécanisme PCAET
  existant, avant d'autoriser ces écritures. Préserver les règles des autres
  sources et les formules du catalogue ; une cible saisie ne devient pas un
  résultat calculé. Vérifier les droits sur le plan, la métadonnée et les
  indicateurs sans introduire d'accès privilégié depuis un simple identifiant.

**Validation :** résultat présent/objectif absent et inverse ; zéro ; données
externes ; écritures concurrentes ; périodes invalides ; rollback ; chemin URL
strictement sans modification ; deux métadonnées pour la même collectivité,
le même indicateur et la même période avec cibles distinctes ; lectures et
calculs isolés par métadonnée ; absence d'effet sur les sources collectivité et
PCAET.
Préserver l'ordre de verrouillage définitions → valeurs.

**Déploiement et arrêt possible :** opération interne testée, sans modifier
le comportement des saisies et imports ordinaires qui ne l'appellent pas.

### PR 4D — Références durables et rattachement des sources

**Périmètre :** adaptations minimales des tables existantes d'axes, de fiches
et de sources, contrats et services internes qui écrivent et lisent ces
références. Réutiliser l'agrégat de 4A et les opérations de 4B/4C. Le lot ne
crée aucune nouvelle entité métier d'engagement, de cible ou de convention.

- Définir les identifiants ADEME à conserver et leur correspondance avec les
  objets TeT. Justifier chaque champ et contrainte par ses usages.
- Conserver la sélection explicite des engagements de A, distincte des axes
  demandés par les fiches actions et des objets libres. E01/E02 partagent un axe
  sans perdre leur distinction. Préserver la référence des oui/non convertis.
- Attribuer les références aux nouveaux objets après résolution, sous la
  transaction appelante et les droits ordinaires. Les objets liés par URL
  restent inchangés. Protéger l'attribution contre les DTO publics et les
  écritures directes en base ; une duplication ordinaire ne la copie pas.
- Créer et retrouver la source exacte d'un plan sous la même transaction.
  Contrôler cohérence, collectivité et permissions, sans donner de droits
  supplémentaires par ce rattachement. La suppression du plan conserve les
  valeurs de la collectivité.
  Accorder le contexte interne `metadataAuthorization` de 4C après contrôle
  des droits du plan et de son rattachement exact, verrouillé jusqu'au commit.
- Livrer les lectures internes des références et de la source d'un plan,
  ainsi que leur branchement sur les lectures de valeurs de 4C. La purge du
  job n'efface pas ces informations. Les services sont exercés ensemble avant
  leur assemblage dans le worker en phase 5.
- Livrer les migrations additives, contrats, écritures, lectures et tests dans
  cette PR. Préserver les objets ordinaires et leur duplication ; ne pas créer
  de dashboard, de registre de convention ou de moteur de reporting.

**Validation :** attribution puis lecture sous transaction ; renommage et
déplacement sans perte d'identité ; E01/E02 distincts ; axe libre sans référence
implicite ; duplication sans identité d'annexe ; rejet des attributions
publiques ; permissions ; rollback complet. Deux plans de la même collectivité
partageant un indicateur gardent leurs sources et cibles distinctes à la
lecture ; la suppression d'un plan conserve les valeurs. Vérifier les
migrations et la compatibilité du code précédent.

**Déploiement et arrêt possible :** schéma et usages internes complets,
déployables sans la phase 5. Les parcours ordinaires restent fonctionnels et
l'admission Électrification reste fermée.

## Phase 5 — Import complet dans une transaction

### PR 5 — Assembler le pipeline et le cycle de vie

**Périmètre :** [enfilement](../../apps/backend/src/plans/ai-plan-import/enqueue-import/),
[worker et service](../../apps/backend/src/plans/ai-plan-import/generate-import-draft/),
reprise et orchestration métier. Les primitives de stockage sont déjà livrées.

**Prérequis :** les lots 4A à 4D sont livrés et vérifiés, y compris les lectures
des références durables et de la source exacte du plan. La phase 5 assemble
ces capacités ; elle ne reporte pas leur implémentation ni leurs migrations.

- Brancher le dispatch par profil sur l'extraction 3B et les résolutions 2B1/2B2a/2B2b.
  Refuser les formats autres que DOCX pour Électrification avant toute lecture
  nécessitant un OCR. Le pipeline utilise le parser puis l'assistance automatique
  sur les seules cellules éligibles, sans fallback générique ni option d'activation
  supplémentaire. Préserver les interprétations et tokens lors de la reprise.
  Garder l'admission fermée par défaut ; contrôler droits, éligibilité, type
  stable et configuration avant upload/enfilement.
  Brancher le flag serveur dédié dans le contrôle de disponibilité partagé
  avec l'enfilement ; l'exclure de l'activation automatique PostHog en dev/test/CI.
  Le flag ne remplace aucun contrôle de droits ou de disponibilité métier.
- Brancher la validation de `schemaVersion` du checkpoint Électrification dans
  le worker et l'API de reprise, y compris après la dernière étape. Le job porte
  cette même version technique. Contrôler le canevas et la concordance du profil,
  de la version et du catalogue entre le job et le checkpoint.
  Conserver les contrôles de contrat et de schéma propres au profil générique.
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
  personnalisés, utiliser les écritures de 4D pour les références,
  les engagements et les sources, écrire les valeurs autorisées et le compte
  rendu, puis `markDone` avec le contrôle
  `status`/`attempt` existant.
  Un refus de `markDone` annule tout, comme une erreur métier ou une révocation de droit.
  Si le lot crée des personnalisés, acquérir le verrou exclusif du graphe avant
  toute revalidation verrouillée des définitions, selon l'ordre défini en 4B.
- E01/E02 partagent un axe ; la sélection durable conserve seulement les codes
  retenus dans A selon le contrat livré en 4D, indépendamment des axes demandés
  par les fiches actions.
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
  l'éligibilité. Limiter ce profil au DOCX officiel V4 et rendre cette contrainte
  visible dès le choix du fichier. Envoyer son profil explicite ; adapter consignes et options
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

**Validation :** parcours navigateur avec fixtures DOCX et parser réel : upload,
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
  des fiches actions et traitement des liens d'aides dans "Documents" convenu.
- Définitions et dépendances de calcul disponibles dans l'environnement cible,
  notamment `v_particulier_elec`, `autobus_autocar_elec`, `s_26` et `s_26.a`.
  Pour E06/E08, formules, périodicités et adéquation métier validées avec
  l'équipe data et le métier, notamment le périmètre autobus/autocars ;
  définitions conformes aux unités validées dans le catalogue versionné.
  Une référence dans un document de travail ne prouve ni cette validation
  ni l'intégration ; le profil reste fermé tant qu'elles manquent.
- Mapping lauréats → collectivités validé et maintenu ; premier groupe choisi
  parmi ces lauréats. Aucun élargissement de droits par le ciblage du flag.
- PR 4D livrée : identités ADEME et sélection de A durables, rattachement exact
  des sources au plan et lectures isolées vérifiés avec les opérations de 4C.
- Migrations, backend/API, tous les workers et app compatibles déployés.
  Pas de message annexe en queue tant qu'un ancien worker peut le consommer.
- Tests de chaque lot passés, non-régression générique/PCAET et full flow validés.
  Qualification du canevas et de ses variantes synthétiques selon le
  [guide d'évaluation](../../apps/backend/src/plans/ai-plan-import/eval/README.md).
  Comparer les premiers documents réellement remplis à leurs résultats dès
  leur disponibilité ; les fixtures seules ne démontrent pas cette couverture.
  Avant l'ouverture du profil Électrification, comparer l'extraction hybride au
  parser seul sur un corpus annoté : rejets injustifiés et erreurs silencieuses.
  Tout appel réel au modèle,
  y compris pour cette évaluation, reste réservé à un lancement humain.

**Ouverture :** valider le parcours complet en préproduction, puis ouvrir
l'admission à un petit groupe identifié de collectivités. Les utilisateurs ou
l'équipe lancent eux-mêmes les imports réels. Contrôler chaque import pilote :
complétude A/B, cibles, conservation des données, erreurs et absence de doublon.
Suivre durées, échecs par cause, reprises et volumes avec l'instrumentation
existante ; une extraction entièrement reconnue par le parser conserve zéro appel
et zéro token LLM. Tracer les appels, tokens et valeurs interprétées lorsque
l'assistance intervient. Élargir seulement après validation métier des
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
réinterpréter un import déjà réussi ni déclencher une nouvelle extraction
sur une reprise ancienne pour ajouter ce périmètre. Appliquer les mêmes règles
de compatibilité avant de produire un nouveau format de checkpoint.

**Validation et déploiement :** valeurs absentes/zéro, champs distincts,
rollback complet, conservation des montants existants et anciennes reprises.
Le retrait de cette extension conserve les budgets déjà importés et l'accès
au socle. Aucun chantier de reporting budgétaire n'est inclus.

## Couverture et définition de fin

| Exigence de l'ADR | Implémentation | Vérification de bout en bout |
| --- | --- | --- |
| Profil explicite, droits, lauréats, aucun plan avant validation | 1A, 2B2a, 5 | 5 et 7 |
| Suivi durable, reprise et compatibilité des jobs | 1A, 1B, 3B, 5 | 5 et 6 |
| A/B uniquement, hyperliens, clés stables, références bloquantes | 2B1, 2B2a, 2B2b, 3A, 3B | 5 |
| Axes explicites, E01/E02, axes libres et B sans engagement | 2B1, 4A, 5 | 5 et 6 |
| Cibles par source, E06/E08, deux cibles E07, actions E03/E12 | 2B1, 4A, 4B, 4C, 4D, 5 | 5 et 6 |
| Personnalisés, valeurs datées et oui/non | 3B, 4A, 4B, 4C, 5 | 5 |
| Identités ADEME et sélection des engagements durables | 4D | 4D, puis 5 et 6 |
| Rattachement durable des sources au plan | 4D, avec les primitives 4B/4C | 4D, puis 5 et 6 |
| URL : liens seuls ; codes : complétion sans écrasement | 2B2a, 2B2b, 4A, 4B, 4C | 5 |
| Liberté d'édition, titres communs et suppression | 4A, 4B, 4D, 6 | 4D et 6 |
| Transaction totale, concurrence, effets après commit | 4A, 4B, 4C, 4D, 5 | 5 |
| Compte rendu complet, activation et arrêt sans perte | 1A, 1B, 5, 6 | 7 |
| Budgets facultatifs | 8 | 8, sans bloquer 7 |

Une PR est terminée lorsque ses checks ciblés passent, ses contrats restent
compatibles avec la version précédente et son état de production peut être
maintenu sans la suite. L'ouverture du profil nécessite toutes les phases du
socle, y compris la PR 4D, et les validations métier ci-dessus.
Les validations des lots non cochés
restent à réaliser ; les résultats documentés pour 1A et 1B ne valent pas
validation du profil annexe ni constat de son déploiement.

Restent hors périmètre : dashboard ADEME, bibliothèque d'actions après import,
groupements, export Word, modification des engagements, synchronisation par
réimport et migration/suppression automatique des plans existants.
