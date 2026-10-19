---
title: 'Migration vers NestJS 12.2'
type: chore
status: in-review
date: 2026-10-19
---

# Migration vers NestJS 12.2

Faire fonctionner le backend et tools avec NestJS 12.2, adopter les API natives adaptées à leurs usages et retirer les intégrations dont la compatibilité déclarée ne couvre pas cette version. Les contrats REST, les schémas Zod métier et le fonctionnement du monorepo restent les points de référence.

Les décisions D01 à D14 sont implémentées dans la [PR 5529](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5529) et soumises à revue. Les propositions d’adoption de packages officiels constituent des suites à arbitrer ; elles ne sont pas implémentées dans cette PR. Le déploiement reste à effectuer après validation de la PR.

## Périmètre et références

- Source : NestJS **11.2.6**. Le commit `0dbb8cde73a88d400f5c806af5f6b0d080229c4d` est la base initiale figée pour l’audit, avant le rebasage de la PR sur `main`.
- Cible demandée : NestJS **12.2.0**. Les versions exactes des dépendances associées sont maintenues dans [package.json](../../package.json) et [pnpm-lock.yaml](../../pnpm-lock.yaml).
- Applications : [backend](../../apps/backend) et [tools](../../apps/tools), leurs contrôleurs, configuration, tests et outils de compilation.
- Recherche de compatibilité : 19 octobre 2026, sur les publications officielles et les API des versions installées. Le guide et les déclarations de compatibilité peuvent évoluer après cette date.
- La migration ne change ni le schéma PostgreSQL, ni les données, ni l’architecture tRPC, ni les domaines métier. Elle ne déclenche aucun traitement IA réel.

La branche 11 reste maintenue en parallèle de la branche 12. Le correctif 11.2.7 ne demande pas d’étape intermédiaire pour ces applications : ses changements concernent la robustesse WebSocket. Le parcours utile couvre les changements de 12.0, 12.1 et 12.2. Voir le [diff 11.2.6 → 11.2.7](https://github.com/nestjs/nest/compare/v11.2.6...v11.2.7), le [guide de migration](https://docs.nestjs.com/migration-guide) et les publications [12.0](https://github.com/nestjs/nest/releases/tag/v12.0.0), [12.1](https://github.com/nestjs/nest/releases/tag/v12.1.0), [12.2](https://github.com/nestjs/nest/releases/tag/v12.2.0).

## Plan de réalisation

| Étape                      | Actions et critère de sortie                                                                                                                  | État                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1. Cadrer                  | Isoler le travail, figer la source, inventorier les usages et vérifier les contraintes de la cible.                                           | Réalisé dans le worktree dédié et la branche `chore/nestjs-12.2`.    |
| 2. Aligner les dépendances | Mettre à jour les packages couplés, retirer les intégrations remplacées et générer le lockfile avec pnpm.                                     | Réalisé ; installation avec lockfile figé vérifiée.                  |
| 3. Migrer les intégrations | Appliquer les décisions D01 à D14 et conserver les contrats explicités ci-dessous.                                                            | Implémenté dans la PR.                                               |
| 4. Vérifier                | Tester les frontières HTTP, les erreurs, les schémas et la télémétrie ; compiler les deux applications et leurs tests.                        | Vérifications locales réalisées ; détail dans la section validation. |
| 5. Relire et fusionner     | Relire les changements de comportement, confirmer les usages manuels des générateurs et examiner tous les résultats CI du commit à fusionner. | À terminer dans la PR.                                               |
| 6. Déployer et observer    | Vérifier les parcours critiques en environnement de validation, puis utiliser le processus de déploiement habituel.                           | À effectuer.                                                         |

## Décisions sur les dépendances et les outils

### D01 Aligner les packages couplés sans contourner leurs contraintes

**Choix.** Aligner `@nestjs/common`, `core`, `platform-express` et `testing` sur la cible. Mettre également à jour les packages config, Swagger, JWT, BullMQ, schedule, throttler, CLI et schematics vers leurs versions compatibles. Leurs numéros majeurs ne sont pas nécessairement identiques à celui du cœur.

Bull Board est mis à jour avec ses trois packages API, Express et Nest. Express et cron sont alignés avec les intégrations Nest ; pour cron, cela évite notamment des types `CronJob` incompatibles entre versions. Le minimum de l’override webpack existant satisfait le peer du CLI. Cela n’active pas un builder webpack.

**Alternative non retenue.** Conserver les anciennes versions en ignorant les peer dependencies ou en élargissant artificiellement leurs plages. Une résolution forcée ne démontre pas leur compatibilité.

**Conséquence.** Le lockfile contient les changements transitifs associés à cette chaîne. Les versions sont épinglées selon la convention du dépôt ; aucun alias `latest` n’est ajouté. pnpm reste le gestionnaire déclaré par le projet.

### D02 Retirer nestjs-zod et conserver Zod

**Choix.** Remplacer `createZodDto` et les pipes de `nestjs-zod` par les types inférés des schémas, les décorateurs natifs avec `schema` et `StandardSchemaValidationPipe`. Utiliser l’intégration Standard Schema de Swagger pour la documentation.

**Raison.** Les [peers de nestjs-zod 5.5.0](https://registry.npmjs.org/nestjs-zod/5.5.0), dernière version vérifiée, couvrent Nest 10/11 et Swagger jusqu’à 11. Nest 12 fournit les points d’intégration utilisés ici. Le package n’est **pas officiellement déprécié** ; il devient inutile pour ces usages après leur migration. Cette limite déclarée ne prouve pas, à elle seule, qu’il échouerait à l’exécution.

**Alternative non retenue.** Attendre une version compatible ou forcer son installation. La première retarderait la cible demandée ; la seconde conserverait une intégration hors de sa plage déclarée alors qu’une solution native existe.

**Conséquence.** Zod et les schémas métier restent en place. La suppression concerne l’adaptateur Nest et les classes DTO artificielles, avec préservation des noms de composants OpenAPI utilisés par les consommateurs.

### D03 Remplacer nestjs-form-data pour le formulaire OAuth

**Choix.** Utiliser `NoFilesInterceptor()` sur `/oauth/token`, puis valider le corps avec le schéma Zod. Les identifiants fournis en Basic restent traités avant la validation finale du couple client/secret.

**Raison.** Le seul usage de `nestjs-form-data` était ce formulaire de champs texte. Sa [version 11.0.1](https://registry.npmjs.org/nestjs-form-data/11.0.1), dernière vérifiée, déclare Nest jusqu’à 11 et n’est pas officiellement dépréciée. L’intercepteur Nest couvre le besoin sans cette dépendance.

**Alternative non retenue.** Garder un module tiers de gestion de formulaires pour ce seul endpoint, avec des peers ne couvrant pas Nest 12.

**Conséquence.** JSON, URL-encoded, multipart et Basic sont vérifiés par les tests OAuth. Les fichiers sur cet endpoint sont explicitement refusés. Les autres endpoints d’upload conservent leurs intercepteurs et limites propres.

### D04 Retirer le plugin Nx Nest sans retirer Nx

**Choix.** Supprimer `@nx/nest`. Les cibles des projets [backend](../../apps/backend/project.json) et [tools](../../apps/tools/project.json) continuent à faire exécuter `nest build` et `nest start --watch` par Nx.

**Raison.** Aucun exécuteur ou générateur de ce plugin n’est référencé dans la configuration du dépôt. Les [peers de @nx/nest 23.2.1](https://registry.npmjs.org/@nx/nest/23.2.1) exigent Nest `>=10.0.0 <12.0.0`. Le plugin n’est pas officiellement déprécié.

**Alternative non retenue.** Le conserver avec une résolution forcée, ou changer l’ensemble de Nx pour une dépendance sans usage enregistré dans le projet.

**Conséquence à confirmer en revue.** Les commandes manuelles `nx g @nx/nest:…` disparaissent. L’absence de référence dans le dépôt ne prouve pas l’absence d’usage par l’équipe. Le CLI Nest reste disponible pour générer du code depuis le dossier de l’application ; ses options ne sont pas présentées comme strictement équivalentes à celles du plugin Nx. Si ces générateurs font partie du workflow de l’équipe, leur remplacement doit être convenu avant fusion. Nx conserve l’orchestration, les dépendances de tâches et le cache du monorepo.

### D05 Conserver les builders et fixer les prérequis de la chaîne CLI

**Choix.** Conserver SWC, le format CommonJS actuel des applications, Vitest et ESLint. Déclarer Node `>=24.15.0 <25`, compatible avec la branche Node 24 déjà utilisée et le minimum des schematics. Les versions CI et Docker sont à vérifier dans leurs fichiers maintenus : [préparation pnpm](../../.github/actions/pnpm-prepare/action.yml), [Docker backend](../../apps/backend/Dockerfile), [Docker tools](../../apps/tools/Dockerfile).

Prettier passe à la branche 3, requise par le peer optionnel des schematics lorsqu’il est installé. Le réglage `trailingComma: "es5"` conserve la convention précédente ; cela ne garantit pas que tous les autres choix de formatage de Prettier 2 et 3 soient identiques.

**Alternatives non retenues.** Basculer simultanément vers ESM, Rspack, oxlint ou un autre gestionnaire de paquets. Les nouveaux choix proposés par le CLI pour les projets générés ne rendent pas notre chaîne actuelle obsolète. Les flags webpack dépréciés ne sont pas utilisés par nos commandes Nest.

## Décisions sur les intégrations

### D06 Valider les requêtes par Standard Schema et préserver les erreurs

**Choix.** Porter les schémas sur `@Body`, `@Query` et `@Param`, puis les faire exécuter par le pipe natif. [SchemaValidationPipe](../../apps/backend/src/utils/nest/schema-validation.pipe.ts) le spécialise pour préserver le corps d’erreur `statusCode`, `message`, `errors` et enrichir le contexte des logs après transformation réussie.

**Raison.** Le projet utilise déjà Zod. Cette intégration conserve les coercitions, valeurs par défaut, unions et validations asynchrones sans maintenir un moteur de validation propre. Les tests et le bootstrap utilisent le même pipe.

**Alternatives non retenues.** Revenir à des DTO `class-validator`, ou conserver une couche imitant `createZodDto`. Les validations locales qui composent plusieurs entrées ou portent un contrat d’erreur particulier restent justifiées, notamment le complément des identifiants OAuth et le formulaire d’import IA.

### D07 Valider la configuration une seule fois par application

**Choix.** Passer les schémas Zod à `ConfigModule.forRoot({ validationSchema })` dans chaque module racine. Les modules `ConfigurationModule` importent simplement `ConfigModule`. Le module d’évaluation possède sa propre initialisation puisqu’il constitue une entrée indépendante.

**Raison.** Les factories de chargement qui appelaient manuellement `parse` sont remplacées par la validation native. Une seconde initialisation sans options relisait `.env` en dehors du réglage de production.

**Conséquence.** `ignoreEnvFile` reste actif en production pour backend et tools. Les services de configuration métier restent disponibles, ainsi que les valeurs typées et transformées. Aucune clé de déchiffrement ni aucun secret n’entre dans le dépôt.

### D08 Conserver une documentation OpenAPI conforme aux schémas et aux réponses

**Choix.** Utiliser `standardSchema` et un [convertisseur Swagger](../../apps/backend/src/utils/nest/swagger-document.options.ts) fondé sur `z.toJSONSchema`, compatible avec les schémas Zod classiques et Mini. Le convertisseur demande OpenAPI 3.0, respecte le sens entrée/sortie transmis par Swagger et conserve les composants nommés et leurs références.

**Raison.** Les identifiants de composants font partie de la documentation consommée à l’extérieur. Les requêtes avec transformations doivent décrire ce que le client envoie. Une vérification parcourt les références locales du document généré et confirme qu’elles se résolvent.

**Alternative non retenue.** Ajouter une autre dépendance de conversion Zod/OpenAPI ou conserver des classes DTO servant uniquement de support à Swagger. Le convertisseur ne prend pas en charge la validation des requêtes.

### D09 Limiter la sérialisation native au catalogue déjà filtré

**Choix.** Appliquer `StandardSchemaSerializerInterceptor` et `@SerializeOptions` au [catalogue des définitions](../../apps/backend/src/indicateurs/definitions/list-platform-definitions/list-platform-definitions.controller.ts). Le schéma porte sur l’enveloppe complète `{ count, data }` ; le repository conserve par inférence le type complet de ses agrégats.

**Raison.** Cet endpoint validait et retirait déjà les champs internes avant de répondre. Le sérialiseur prend en charge cette responsabilité. L’enveloppe et le champ `count` existent déjà : ils ne sont pas ajoutés par la migration. OpenAPI est corrigé pour décrire cette enveloppe en HTTP 200.

**Alternative non retenue.** Installer un sérialiseur global sur tous les endpoints. Cela pourrait retirer des champs ou imposer de nouveaux contrats à des réponses qui n’étaient pas filtrées. Les exports et flux de fichiers conservent leur fonctionnement.

### D10 Utiliser les cookies natifs pour les contrôleurs OIDC

**Choix.** Remplacer le parseur manuscrit par `@Cookies()` et les décorateurs nommés dans [OidcController](../../apps/backend/src/users/authentications/oidc/oidc.controller.ts).

**Raison.** Nest 12.1 fournit une lecture native, avec gestion des valeurs encodées et des entrées mal formées. Pour des cookies dupliqués, la **première valeur prévaut**, selon le comportement du parseur natif ; le parseur remplacé retenait la dernière.

**Conséquence.** Les tests couvrent état/nonce manquants ou invalides, encodage, doublons et déconnexion. Les attributs des cookies, leurs domaines et durées de vie, l’écriture via Express et la lecture des sessions Supabase restent inchangés. Cette migration n’applique pas le plan distinct de bascule same-origin.

### D11 Diagnostiquer les routes sans changer leur ordre

**Choix.** Partager `routeConflictPolicy: { duplicate: 'error', shadow: 'warn' }` entre backend et tools dans [httpApplicationOptions](../../apps/backend/src/utils/nest/http-application.options.ts).

**Conséquence.** Une route Nest strictement dupliquée empêche le démarrage ; un recouvrement de motifs produit un avertissement. L’audit isolé initialise les 25 contrôleurs backend avec leurs dépendances simulées. Il ne constitue pas un test des services métier ou des middlewares montés directement sur Express.

**Alternative non retenue.** Activer `routeResolutionStrategy: 'specificity'` : cela pourrait changer le handler choisi pour une URL existante. Les diagnostics sont activés avec l’ordre de déclaration conservé.

### D12 Garder les limites et les formats des corps HTTP

**Choix.** Utiliser `NestExpressApplication.useBodyParser('json', …)` avec les limites existantes : 5 Mo pour backend, 10 Mo pour tools. Le parseur URL-encoded fourni par Nest reste disponible.

**Raison.** Cette API configure le parseur à travers Nest et respecte ses options. L’appel direct à `express.json` n’est pas déclaré déprécié ; son remplacement est un alignement de l’intégration, sans augmentation des limites ni activation globale de `rawBody`.

### D13 Exposer les codes métier et respecter les erreurs masquées

**Choix.** Transmettre `result.error` comme `HttpExceptionOptions.errorCode`, ainsi que la cause pour le diagnostic. Le champ `code` de l’enveloppe HTTP privilégie ce code natif, puis conserve les codes de cause/base de données lorsqu’aucun code natif n’est défini.

Pour les erreurs de forme `http-errors` qui sont des `Error`, portent `expose: false`, un `statusCode` entier 5xx et un `status` identique, le filtre utilise le libellé HTTP standard et conserve ce statut. Les autres politiques de messages ne sont pas réécrites globalement.

**Raison.** Le [filtre personnalisé](../../apps/backend/src/utils/nest/all-exceptions.filter.ts) doit tenir compte des fonctions natives de Nest 12 tout en gardant l’enveloppe existante. Cette adaptation concerne aussi les échecs métier sans configuration de mapping.

**Conséquence.** Les clients disposent d’un identifiant métier stable dans `code` ; les détails peuvent également contenir `errorCode`. La cause n’est pas ajoutée à la réponse. Les tests vérifient la priorité des codes, les erreurs masquées et la conservation des messages explicitement exposés.

### D14 Conserver OpenTelemetry avec des points d’intégration publics

**Choix.** Désactiver uniquement l’auto-instrumentation `nestjs-core`, dont la plage de versions vérifiée exclut Nest 12. Utiliser [traceNestBootstrap et NestTelemetryInterceptor](../../apps/backend/src/utils/nest/nest-telemetry.ts) pour le bootstrap et les contrôleurs. Les instrumentations HTTP, PostgreSQL et pino, ainsi que l’export OTLP existant, restent en place.

**Alternatives non retenues.** Modifier la plage de compatibilité de l’instrumentation, patcher les composants internes Nest, ou introduire le service Observe uniquement parce qu’il est proposé avec Nest 12.

**Conséquence.** La topologie des traces change : une span de bootstrap et une span par exécution de contrôleur, maintenue pendant les traitements asynchrones et les Observables. Les refus des guards, exécutés avant les intercepteurs, restent couverts par la span HTTP. Les réponses Express écrites directement et leur streaming ne sont pas entièrement décrits par la durée de la span contrôleur.

## Options non activées et contraintes maintenues

| Option                                                    | Décision et condition d’une éventuelle évolution                                                                                                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CSRF natif et nouveaux en-têtes de sécurité               | Pas d’activation globale dans cette migration. Ces réglages demandent une analyse des échanges entre origines, d’OIDC, de Swagger et des clients API.                                                                    |
| Arrêt gracieux et nouveaux réglages de shutdown           | Pas d’activation supplémentaire de hooks de signaux. Le handler OpenTelemetry existant réémet le signal après son flush ; un changement demande de coordonner l’arrêt HTTP, des workers, de la base et de la télémétrie. |
| Nouvel ordre des hooks de cycle de vie                    | Audit des initialisations PDF, des files et checkpoints, et des hooks de fermeture DB/PostHog. Aucun correctif d’ordre identifié dans ces usages ; le démarrage en environnement reste un contrôle de déploiement.       |
| Héritage de `@Optional()`                                 | La correction livrée en 12.1 est prise en compte. Le sous-type LLM concerné redéclare déjà son paramètre optionnel ; aucun contournement fondé sur l’avertissement initial du guide n’est ajouté.                        |
| Nouveaux paramètres structurés de ConsoleLogger           | Le logger pino personnalisé reste utilisé. Aucun changement de format de logs imposé par migration vers ConsoleLogger.                                                                                                   |
| GraphQL, NATS, WebSockets et autres intégrations absentes | Pas d’ajout de dépendance ou de configuration sans besoin identifié. Terminus fait l’objet d’une proposition ci-dessous pour améliorer les sondes existantes.                                                            |
| Tests et évaluations IA                                   | Toute vérification automatisée conserve un faux LLM. Aucun endpoint, job ou script n’est lancé avec un fournisseur payant réel.                                                                                          |

## Propositions d’adoption des packages officiels

**Priorités proposées : sondes et arrêt du service, sécurité HTTP, puis pilotes du client HTTP, de Drizzle et de l’outbox.** L’objectif est de réduire des risques observables et la maintenance des intégrations. Un package officiel apporte un point d’intégration maintenu par Nest ; son ancienneté, ses garanties et son adéquation aux contrats du projet restent déterminantes.

L’inventaire du 19 octobre 2026 couvre les intégrations de données, HTTP, sécurité, fiabilité, mail, stockage et observabilité des [dépôts officiels Nest](https://github.com/orgs/nestjs/repositories). Les versions citées sont celles évaluées, à revérifier avant adoption. Le projet utilise Node 24 et Nest 12.2 : les candidats ci-dessous couvrent cette combinaison dans leurs contraintes déclarées. Les nouvelles intégrations `0.x` ne portent pas de suffixe prerelease, mais disposent de quelques semaines de recul seulement.

### Priorités et périmètres

| Proposition                                         | Gain dans le projet                                                                                                                                                                     | Périmètre recommandé et coût relatif                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1 — `@nestjs/terminus`**                         | Les `HEALTHCHECK` de backend et tools interrogent `/version` : HTTP peut répondre alors que PostgreSQL ou Redis est indisponible.                                                       | Ajouter une sonde de disponibilité avec délais bornés et une sonde de vie indépendante des services externes. Coût moyen, car l’arrêt et la configuration du déploiement font partie du travail. [Documentation](https://docs.nestjs.com/recipes/terminus), [version évaluée 12.1.0](https://registry.npmjs.org/@nestjs/terminus/12.1.0).                                                                |
| **P1 — renforcer `@nestjs/throttler` déjà présent** | Les compteurs sont en mémoire, donc propres à chaque instance. L’extraction d’IP tRPC lit le premier `X-Forwarded-For`, que le code décrit comme falsifiable.                           | Définir les proxies de confiance et partager les compteurs si plusieurs instances servent le trafic. Vérifier REST et tRPC séparément. L’adaptateur Redis cité par Nest est communautaire et doit être évalué. Coût moyen. [Documentation](https://docs.nestjs.com/security/rate-limiting), [code actuel](../../apps/backend/src/utils/trpc/trpc.service.ts).                                            |
| **P2 — pilote `@nestjs/http-client`**               | Plusieurs intégrations utilisent `fetch` directement sans délai explicite. Des clients nommés peuvent centraliser origine, authentification, annulation et erreurs réseau.              | Commencer par Calendly et Sirene, garder les validations Zod et les résultats métier. Configurer explicitement le délai : sa valeur par défaut est zéro. Vérifier la politique de retry par méthode ; un POST n’est pas relancé par défaut. Coût moyen. [Documentation](https://docs.nestjs.com/application/http-client), [version évaluée 0.0.2](https://registry.npmjs.org/@nestjs/http-client/0.0.2). |
| **P2 — pilote `@nestjs/drizzle`**                   | Les deux `DatabaseService` créent et ferment manuellement leur pool. Le module ajoute notamment des listeners d’erreurs des connexions et évite la fermeture multiple d’un même client. | Migrer d’abord tools, puis backend. Retirer la couche de simple délégation dans chaque application migrée, en gardant le `TransactionManager` métier. Coût moyen pour tools, plus élevé pour backend en raison des nombreuses injections et fixtures. [Documentation](https://docs.nestjs.com/data/drizzle), [version évaluée 0.0.2](https://registry.npmjs.org/@nestjs/drizzle/0.0.2).                  |
| **P2 — prototype `@nestjs/outbox`**                 | L’enregistrement PostgreSQL des webhooks et leur publication Redis sont deux opérations distinctes. Une panne intermédiaire peut laisser un message sans job.                           | Écrire l’événement dans la transaction métier, puis le publier vers BullMQ par un relais. Conserver BullMQ. Coût moyen à élevé : transactions appelantes, schéma Sqitch, reprise et suivi des échecs. [Documentation](https://docs.nestjs.com/reliability/outbox), [version évaluée 0.1.2](https://registry.npmjs.org/@nestjs/outbox/0.1.2).                                                             |
| **P3 — `@nestjs/resilience` ciblé**                 | Un circuit breaker et une limite de concurrence peuvent protéger les workers d’un fournisseur durablement indisponible.                                                                 | Après le pilote HTTP, ajouter uniquement les politiques manquantes aux destinations qui en ont besoin. Éviter de cumuler retries HTTP, resilience et les dix tentatives BullMQ des webhooks. Coût moyen. [Documentation](https://docs.nestjs.com/reliability/resilience), [version évaluée 0.0.2](https://registry.npmjs.org/@nestjs/resilience/0.0.2).                                                  |

P1 désigne les premiers travaux proposés ; P2 demande un pilote avant généralisation ; P3 dépend d’un besoin plus ciblé. La priorité du problème peut être élevée même lorsque l’adoption du package reste conditionnelle.

### Conditions des premiers lots

**Sondes et arrêt.** Réutiliser les connexions PostgreSQL et Redis pour la disponibilité, sans ajouter un autre ORM. Les indicateurs personnalisés de Terminus suffisent. Borner aussi l’acquisition de connexion et la requête DB : le timeout d’une sonde ne garantit pas l’annulation effective de l’I/O. Conserver une réponse minimale, sans exposer les détails de connexion. Le [bootstrap](../../apps/backend/src/main.ts) n’active pas les hooks de signaux, et [OpenTelemetry](../../apps/backend/src/utils/telemetry-init.ts) gère déjà SIGTERM/SIGINT avec réémission : coordonner la mise hors trafic, le drainage HTTP/BullMQ, la fermeture des pools et le flush des traces. Adapter les sondes à la sémantique du déploiement ; une panne DB ne doit pas provoquer une boucle de redémarrages inutile.

**Sécurité HTTP native.** Prévoir un lot dédié à `useSecurityHeaders()` et `enableCsrfProtection()`, disponibles dans Nest 12.1 sans nouvelle dépendance. Le [CORS actuel](../../apps/backend/src/main.ts) reflète toutes les origines avec `credentials: true` : définir les origines navigateur autorisées et les clients API attendus avant de le restreindre. Tester tRPC avec cookies, OIDC, Swagger, Bull Board et les domaines de prévisualisation. Les origines CORS ne deviennent pas automatiquement des origines CSRF de confiance ; le contrôle CSRF ignore `X-Forwarded-Host`. Ces contraintes imposent de vérifier les en-têtes réellement transmis par le proxy. [En-têtes de sécurité](https://docs.nestjs.com/security/helmet), [CSRF](https://docs.nestjs.com/security/csrf).

**Drizzle.** Le package a été publié pour la première fois le 23 septembre 2026 ; sa version évaluée accepte Drizzle `>=0.35.0`, donc le `0.45.2` du dépôt convient. Les exemples de documentation utilisant Drizzle 1 RC n’imposent pas cette montée de version. Conserver les options `pg` existantes : taille des pools, délais, `application_name` et connexion/TLS. Garder Sqitch, les schémas, les droits SQL/RLS et le [contrat transactionnel `Result`](../../apps/backend/src/utils/transaction/transaction-manager.service.ts). Vérifier l’isolation des pools entre applications de test et les déconnexions pendant une transaction. La [gestion des erreurs de connexion](https://github.com/nestjs/drizzle/blob/0.0.2/lib/common/drizzle.utils.ts) est un gain concret, sans garantie de réussite des requêtes pendant une panne. Retirer aussi des deux `DatabaseService` le log de l’URL PostgreSQL complète hors production : cette valeur peut contenir des identifiants, indépendamment du choix d’adaptateur.

**Outbox et webhooks.** Le [service de webhooks](../../apps/backend/src/utils/webhooks/webhook.service.ts) fait un `INSERT` puis `addBulk`. Certains appels métier notifient après commit, d’autres depuis une transaction externe qui n’est pas transmise au service. Le prototype doit donc couvrir la transaction métier entière. La livraison demeure « au moins une fois » : identifiant stable, dédoublonnage et reprise sont nécessaires, même après la purge des jobs BullMQ terminés. `@nestjs/webhooks` peut ensuite simplifier émission, signature et protection des destinations, en s’appuyant sur cette même outbox. Son format natif diffère du payload actuel : démontrer que l’adaptation conserve le contrat des destinataires Communs, leurs authentifications Basic/Bearer et les protections du transport ; sinon différer ce package. Éviter deux mécanismes de livraison concurrents. [Webhooks Nest](https://docs.nestjs.com/http/webhooks), [version évaluée 0.0.2](https://registry.npmjs.org/@nestjs/webhooks/0.0.2).

### Packages à différer ou à conserver en veille

| Package ou famille                                            | Décision proposée et motif                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nestjs/mail`                                                | Conserver Nodemailer et React Email. Le nouveau module développe son propre transport SMTP/MIME ; la [version 0.0.1](https://registry.npmjs.org/@nestjs/mail/0.0.1), publiée depuis septembre, n’offre pas de raison suffisante de remplacer cette intégration. Réexaminer si un besoin de transport ou de gestion du cycle de vie apparaît. [Documentation](https://docs.nestjs.com/application/mail).                                                                                                                                               |
| `@nestjs/storage`                                             | Conserver Supabase Storage. Les adaptateurs fournis couvrent local, S3 et mémoire ; aucun adaptateur Supabase natif ne préserve directement les contrats `storage.objects`, RLS, URL et jetons d’upload. Un adaptateur personnalisé ajouterait une couche sans supprimer le SDK. [Documentation](https://docs.nestjs.com/application/file-storage), [version 0.0.3](https://registry.npmjs.org/@nestjs/storage/0.0.3).                                                                                                                                |
| `@nestjs/authentication`                                      | Conserver Supabase Auth, `openid-client`, Argon2 et `@nestjs/jwt`. Le nouveau module couvre de nombreux parcours, mais remplacer les sessions, les fournisseurs OIDC et les clés API est un chantier d’authentification complet. La [version 0.1.1](https://registry.npmjs.org/@nestjs/authentication/0.1.1) est trop récente pour justifier cette réécriture par la seule robustesse. [Documentation](https://docs.nestjs.com/security/authentication).                                                                                              |
| `@nestjs/authorization`                                       | Intérêt à réévaluer pour des politiques explicites et un refus par défaut des routes REST. Conserver les règles partagées du domaine et `PermissionService`, qui portent les droits par collectivité, audit, référentiel et clé API. Le guard Nest ne couvre pas notre middleware tRPC ; l’adoption demanderait aussi des appels explicites dans les services. [Documentation](https://docs.nestjs.com/security/authorization), [version 0.1.0](https://registry.npmjs.org/@nestjs/authorization/0.1.0).                                              |
| `@nestjs/idempotency`                                         | À proposer avec un contrat précis de mutation rejouable : clé client, portée utilisateur/collectivité, empreinte, durée et store partagé à implémenter. Le décorateur ne couvre pas automatiquement tRPC et ne rend pas atomiques les effets externes. [Documentation](https://docs.nestjs.com/reliability/idempotency), [version 0.0.2](https://registry.npmjs.org/@nestjs/idempotency/0.0.2).                                                                                                                                                       |
| `@nestjs/locks`                                               | Pas d’ajout pour les tâches déjà confiées à BullMQ. Si plusieurs instances tools activent les crons, le [planificateur local](../../apps/tools/src/cron/cron.service.ts) peut produire plusieurs jobs ; examiner d’abord les [Job Schedulers BullMQ](https://docs.bullmq.io/guide/job-schedulers/). Le module Nest demande un store distribué à implémenter et tester. Conserver les verrous transactionnels PostgreSQL. [Documentation](https://docs.nestjs.com/reliability/locks), [version 0.0.3](https://registry.npmjs.org/@nestjs/locks/0.0.3). |
| `@nestjs/workflows`                                           | Conserver les checkpoints et reprises des imports. Remplacer leur état persistant par un nouveau moteur introduirait une migration et des risques de réexécution, notamment des appels IA facturés. Étudier ce module pour un nouveau processus long si ses attentes d’événements ou compensations deviennent nécessaires. [Documentation](https://docs.nestjs.com/reliability/workflows), [version 0.0.3](https://registry.npmjs.org/@nestjs/workflows/0.0.3).                                                                                       |
| `@nestjs/cache-manager`                                       | Pas de cache HTTP global sur les données privées ou tRPC. Éventuel usage ciblé pour des valeurs simples avec expiration/invalidation, comme les identifiants Notion. Garder le cache OIDC actuel : il contient des promesses et instances `openid-client`, inadaptées à une substitution directe par un store JSON. [Documentation](https://docs.nestjs.com/techniques/caching), [version 12.0.1](https://registry.npmjs.org/@nestjs/cache-manager/12.0.1).                                                                                           |
| `@nestjs/observe`                                             | Conserver OpenTelemetry/PostHog. Le SDK cible le collecteur Observe hébergé ; ce n’est pas un remplacement transparent de notre export OTLP. Son adoption demanderait une décision sur la destination des données, le coût et la suppression des instrumentations redondantes. [Documentation](https://docs.nestjs.com/observability/sdk), [version 0.3.15](https://registry.npmjs.org/@nestjs/observe/0.3.15).                                                                                                                                       |
| `@nestjs/i18n`, CQRS, event-emitter, autres ORM et transports | Pas de besoin identifié justifiant leur ajout. Une internationalisation, une architecture CQRS ou un nouveau transport relève d’un besoin produit ou architectural distinct. Un bus d’événements en mémoire ne remplace pas une livraison persistante. `@nestjs/store-kit` peut servir les modules de persistance retenus, sans devenir un nouvel ORM du projet.                                                                                                                                                                                      |

### Découpage et preuves attendues

1. **Disponibilité et sécurité** : PR séparées pour les sondes/arrêt et les protections HTTP. Tester les réponses aux pannes DB/Redis, l’arrêt pendant une requête ou un job, les origines autorisées/refusées, les parcours OIDC et les quotas entre instances.
2. **Client HTTP** : pilote sur des API externes simulées. Vérifier timeout avec annulation, redirections, confidentialité des en-têtes, erreurs et politique de retry. Préserver les contrats Zod et métier.
3. **Drizzle** : pilote tools, puis backend. Vérifier les options de connexion, les injections de test, la fermeture unique et les transactions partagées avec rollback.
4. **Outbox** : prototype avec PostgreSQL et Redis locaux. Vérifier rollback sans émission, commit pendant une panne Redis, arrêt après publication avant acquittement et dédoublonnage. Évaluer ensuite le module webhooks et les politiques resilience utiles.

Ces critères sont des conditions d’adoption, distinctes des vérifications de migration ci-dessous. Les tests automatisés utilisent des fournisseurs simulés ; aucune validation n’appelle un modèle IA réel.

## Validation et critères d’acceptation

### Vérifications locales réalisées

Les vérifications suivantes portent sur le code de migration publié dans le commit `5c04c2113d262c87dfa28fb0842e139e45f0f7c0` ; les résultats ne valent pas validation d’un déploiement.

| Vérification                         | Résultat et portée                                                                                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installation pnpm avec lockfile figé | Réussite avec la version de pnpm du dépôt et l’accès habituel au registre Bryntum.                                                                         |
| Tests ciblés                         | 89 tests passent dans 10 fichiers, avec dépendances externes simulées.                                                                                     |
| Enregistrement des routes            | Audit temporaire non conservé dans le dépôt : initialisation des 25 contrôleurs backend, avec diagnostics de routes et dépendances métier/canvas simulées. |
| TypeScript                           | Compilation des sources et tests de backend et tools réussie avec `tsc --build`.                                                                           |
| Builds Nx                            | Builds backend et tools réussis, avec leurs dépendances de build.                                                                                          |
| ESLint                               | Aucun échec sur les 56 fichiers TypeScript modifiés ; trois avertissements `any` préexistants dans `apps/backend/test/app-utils.ts`.                       |
| Diff                                 | `git diff --check` réussi. Aucun secret ni fichier d’environnement ajouté.                                                                                 |

Depuis la racine, après l’installation habituelle des dépendances et de l’environnement local :

```sh
pnpm exec vitest run --config apps/backend/vitest.config.mts \
  apps/backend/src/users/apikeys/apikeys.controller.spec.ts \
  apps/backend/src/users/authentications/oidc/oidc.controller.spec.ts \
  apps/backend/src/indicateurs/definitions/list-platform-definitions/list-platform-definitions.controller.spec.ts \
  apps/backend/src/utils/config/configuration.module.spec.ts \
  apps/backend/src/utils/nest/schema-validation.pipe.spec.ts \
  apps/backend/src/utils/nest/swagger-document.options.spec.ts \
  apps/backend/src/utils/nest/nest-telemetry.spec.ts \
  apps/backend/src/utils/nest/errors.utils.spec.ts \
  apps/backend/src/utils/nest/controller-error-handler.spec.ts \
  apps/backend/src/utils/nest/all-exceptions.filter.spec.ts

pnpm exec nx run-many -t build -p backend tools
pnpm exec tsc --build apps/backend/tsconfig.json apps/tools/tsconfig.json --pretty false
git diff --check
```

La commande Nx de typecheck a rencontré **localement** un problème préexistant de `@nx/js:typescript-sync` sur les références de `apps/app/tsconfig.json`, reproduit sur la base de comparaison. Cela ne constitue pas une erreur de compilation de la migration et ne doit pas être présenté comme un échec CI : le job de validation des projets affectés a depuis réussi sur la PR. Les références frontend ne sont pas modifiées dans ce travail.

### Vérifications avant fusion

- [ ] Relire et accepter les conséquences D04, D09, D10, D11, D13 et D14, dont les générateurs Nx et les changements observables par les clients.
- [ ] Vérifier l’état final de tous les checks sur le commit à fusionner dans la [CI de la PR](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5529/checks). Les 89 tests locaux ne remplacent pas les suites avec base de données.
- [ ] Vérifier les parcours OAuth/OIDC et un export de fichier dans l’environnement de validation, ainsi que la page OpenAPI et le tableau Bull Board de tools.
- [ ] Vérifier l’enregistrement des tâches planifiées de tools et l’absence de doublons de noms, sans déclencher de traitement IA.
- [ ] Confirmer que les logs et traces restent exploitables, notamment pour les erreurs, les requêtes asynchrones et les réponses longues.

## Déploiement et retour arrière

Utiliser le processus de déploiement existant pour backend et tools, après les vérifications précédentes. Contrôler le démarrage, les diagnostics de routes, l’authentification, les réponses REST et l’accès aux files. Une vérification de l’import IA ne doit jamais lancer un appel payant réel automatiquement.

La migration ne contient aucune migration SQL ni conversion de données. En cas de régression, redéployer les artefacts applicatifs précédents via le processus habituel, ou annuler le changement complet de code et de dépendances puis reconstruire. Éviter un retour arrière limité à `package.json` : le code utilise des API absentes de Nest 11, et le lockfile doit rester cohérent avec les sources.
