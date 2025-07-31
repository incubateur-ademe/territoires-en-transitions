# 6. Mise en place d'une plateforme de background jobs & webhooks

Date: 2025-04-24

## Statut

Accepté

## Contexte

Un certain nombre d'opérations sont fait en background sur la plateforme via des [crons postgres](https://github.com/citusdata/pg_cron) qui déclenchent dans certain cas des appels en utilisant [pg_net](https://github.com/supabase/pg_net) à des [Supabase Edge Function](https://supabase.com/docs/guides/functions). Un certain nombre de limites ont été identifiées avec cette architecture:

- Difficulté de monitoring et de gestion des erreurs, en particulier lorsque l'appel réseau pg_net échoue (bug identifié lorsque la payload est trop importante)
- Pas de possibilité facilitée de retry
- Edge function ne profitant pas du code écrit dans le backend et reposant sur Deno plutôt que sur Node.
- Cadre limité pour des besoins plus complexes.

Par ailleurs, de nouveaux besoins ont été identifiés:

- webhooks pour l'intégration aux communs et plus largement pour notifier des systèmes tierces
- Remontées d'informations dans airtable
- Synchronisation avec le CRM connect de l'ademe.

Cela a amené à reconsidérer l'architecture existante.

## Besoin

Disposer d'une plateforme de background jobs permettant de mettre en oeuvre des taches de synchronisation et de notification:

- Les taches doivent être intégré au système sentry de monitoring global.
- Un mécanisme de retry automatique paramétrable doit pouvoir être facilement mis en place.
- Une interface doit permettre de facilement consulter le statut des taches et de les relancer manuellement en cas d'erreur.
- L'intégration et l'utilisation du code du backend doit être facilité pour permettre l'accès aux données et favoriser la réutilisation de code.

## Décision

Utiliser le [système de queueing BullMq](https://docs.nestjs.com/techniques/queues) et de [scheduling / cron](https://docs.nestjs.com/techniques/task-scheduling) intégré à NestJs pour avancer sur le sujet rapidement.
Cette décision est motivée par la facilité de mise en place et l'absence court termes de besoins plus complexes nécessitant des workflows.

### Facteurs de décision

#### Positifs

- La mise en place est très facile et complètement intégrée à NestJs.
- Il est facile de réutiliser du code du backend et d'utiliser les apis via un client trpc.
- Déploiement aisé en ayant uniquement une base Redis à déployer en plus.
- Un changement de solution ne serait pas trop couteux.

#### Négatifs

- Cadre très simple permettant la mise en place de tâche de fond planifiées en gérant la charge mais ne supporte pas nativement des cas d'usage plus complexes comme des workflow.
- un peu trop "bas niveau" par rapport à des alternatives plus riches telles que trigger.dev.

## Alternatives considérées

### Trigger.dev

Solution plus haut niveau permettant de gérer facilement des workflows et des taches plus complexes. Le déploiement managé est simple mais cela multiplie les infrastructures de déploiement/monitoring, rend plus compliqué la réutilisation du code de backend. Le self hosting ne semble pas forcément simple et encouragé (documentation précise qu'il ne s'agit pas d'une procédure aboutissant à un "production ready" déploiement: https://trigger.dev/docs/open-source-self-hosting).

### Temporal

Cette alternative semble également plus puissante et riche en fonctionnalité. Elle se structure autour de worfklows déclenchant des activités tout en fournissant les mécanismes de gestion d'erreur et de retry.
Un quickstart typescript est disponible ici: https://learn.temporal.io/getting_started/typescript/hello_world_in_typescript/.

## Mise en place et tutorial

La mise en place est très bien décrite dans la documentation NestJs qui se suffit à elle même:

- Queueing: https://docs.nestjs.com/techniques/queues
- Scheduling: https://docs.nestjs.com/techniques/task-scheduling
- UI board: https://github.com/felixmosh/bull-board/tree/master/packages/nestjs

Une base de donnée Redis est mise en place et déployée sur Koyeb pour la gestion des messages. Aucune persistence n'est mise en place pour l'instant car il ne s'agit pas de tâches critiques.

L'ui est protégée par une authentification basique uniquement pour le moment.

## Détail d'implémentation pour la mise en place des webhooks

La mise en place des webhooks en se basant sur un système de queue répond aux problématiques suivantes:

- La volonté de ne pas dépendre d'un système tierce: si le système devant être notifié tombe, cela ne doit pas bloquer l'utilisation de la plateforme par l'utilisateur final
- La résilience: un mécanisme de retry doit être mise en place pour être robuste à une indisponibilité temporaire du système tierce.
- Les notifications doivent pouvoir être mises en place rapidement pour différentes entités (collectivités, valeurs d'indicateur, etc) même si le besoin initial concerne uniquement les fiches actions.
- Il doit être possible de supporter différents formats de notification pour s'adapter à des besoins spécifiques.

Configuration et fonctionnement:

- `BullMQ` est configuré avec la connexion `Redis` [dans le backend](../../apps/backend/src/app.module.ts#L34) et [dans l'api d'automation](../../apps/tools/src/app.module.ts#L31)
- Le board UI est configurée pour être exposé sur la route `/queues` à [cet endroit](../../apps/tools/src/app.module.ts#L48)
- Une queue `webhook-notifications` est déclarée [dans le backend](../../apps/backend/src/utils/utils.module.ts#L13) pour pouvoir publier des messages. Un exponential backoff avec un maximum de 10 tentatives est configuré pour cette queue.
- Cette même queue est déclarée [dans l'api d'automation](../../apps/tools/src/webhooks/webhook.module.ts) afin de pouvoir consommer les messages. Dans le même module, cette queue est également enregistrée pour être exposée dans le board UI.
- Lors de la [sauvegarde d'une fiche action](../../apps/backend/src/plans/fiches/fiches-action-update.service.ts#L370), des message sont sauvegardés dans la base postgres et publiés dans la queue (un message par configuration de webhook afin d'avoir un retry indépendant, [voir cette fonction](../../apps/backend/src/utils/webhooks/webhook.service.ts#L42)). Le choix de sauvegarder également le message dans la BDD Postgres est discutable mais est motivé par l'absence de persistence de la base Redis et la volonté d'avoir une base unique de vérité (la base redis est uniquement considérée comme une base technique).
- Un `consumer` est enregistré pour cette queue [dans l'api d'automation](../../apps/tools/src/webhooks/webhook-consumer.service.ts#L30) et dépile les messages. Pour chaque message, sa configuration est récupérée (permet ainsi de pouvoir renvoyer un message en cas de changement de configuration) et la payload à envoyer est constituée. A noter que les secrets pour l'appel des endpoints de webhook sont configurés dans une configuration unique afin de ne pas avoir à redéployer l'api en cas d'ajout d'un nouveau système tierce.
