# 14. Système de notification par email

**Date :** 2025-11-19  
**Statut :** Proposition

## Besoins

Pouvoir envoyer des notifications par email lors de certains événements.

Premier cas d'usage : envoi d'une notification à la personne concernée lors de son affectation comme pilote à une fiche.

Les envois peuvent être différés. Par exemple dans le cas du pilote le mail ne part immédiatement après l'affectation, pour laisser le temps à l'utilisateur de changer l'affectation en cas d'erreur.

Le contenu du message doit donc être généré au moment de son envoi et non pas au moment de l'événement déclenchant la notification.

## Fonctionnement général

1. Au moment de l'événement déclenchant la notification : enregistrement d'une entrée dans une table dédiée comportant notamment :

    - `entityId` : identifiant de l'entité concernée (ex: ID de la fiche)
    - `status` : statut de la notification (`pending`, `sent`, `failed`)
    - `sendTo` : ID de l'utilisateur destinataire
    - `sentAt` : date d'envoi (si envoyée)
    - `sentToEmail` : email du destinataire (enregistré au moment de l'envoi)
    - `errorMessage` : message d'erreur en cas d'échec
    - `retries` : nombre de tentatives d'envoi
    - `createdBy` : ID de l'utilisateur ayant créé la notification - optionnel (ex: id de l'utilisateur ayant assigné le pilote à la fiche)
    - `createdAt` : date de création
    - `notifiedOn` : type de notification (ex: `update_fiche_pilote`)
    - `notificationData` : données JSON spécifiques à chaque type de notification

2. La vérification des notifications à envoyer est réalisée par un processus enregistré dans le service cron existant du module `apps/tools`.

    Celui-ci va appeler un service qui :

    - Récupère les notifications en attente à envoyer (passé le délai d'envoi différé depuis la date de création)
    - Charge les données nécessaires et génère le contenu de chaque notification
    - Envoie les emails vers le service externe SMTP
    - Met à jour le statut ("envoyé" ou "en échec")

## Solutions envisagées pour le système de templates

### Templates et utilisation de l'API du service externe d'envoi de mail

Avantages :

- Facile de changer le contenu
- Pas de génération à faire préalablement à l'envoi

Inconvénients :

- Il devient probablement plus facile de "casser" un template
- Difficile voir impossible de partager des éléments communs d'un template à l'autre (styles...)
- Ajout d'une dépendance supplémentaire sur un fournisseur et une API externe

### Templates au niveau code dans le backend (utilisation de react-email) et envoi en utilisant l'accès SMTP du service externe d'envoi des mails

Avantages :

- Développement en mode composants comme pour les apps front permettant de partager facilement les éléments communs (container, header, footer, boutons) d'un template à un autre
- Possibilité d'utiliser les mêmes styles (à travers le preset tailwind) que ceux utilisés dans les apps (quand packages/ui n'aura plus de dépendance sur packages/api ce qui génère actuellement une dépendance circulaire)
- Potentiellement plus robuste
- Pas de dépendance sur une API externe pour les templates
- Génération du contenu au moment de l'envoi garantit que les données sont à jour

Inconvénients :

- Un peu moins immédiat de faire un changement dans le contenu d'un template

## Décisions

La décision actuelle est d'utiliser des templates au niveau code dans le backend. Cette option pourra être réévaluée lors de la prochaine notification à développer.
