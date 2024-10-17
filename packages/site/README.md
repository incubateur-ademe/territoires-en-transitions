# Site

## Description

Ce module implémente le site institutionnel du programme TETE.

Les contenus sont maintenus dans une instance Strapi.

## Configuration

Les variables d'environnement suivantes doivent être définies dans un fichier .env (voir le fichier [.env.sample](.env.sample)):

| Variable                        | Description                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL de l'API Supabase                                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique d'accès à l'API Supabase                                            |
| `NEXT_PUBLIC_POSTHOG_HOST`      | URL de l'API PostHog                                                             |
| `NEXT_PUBLIC_POSTHOG_KEY`       | Clé publique d'accès à l'API PostHog                                             |
| `NEXT_PUBLIC_AXEPTIO_ID`        | Identifiant d'accès à l'API Axeptio                                              |
| `NEXT_PUBLIC_CRISP_WEBSITE_ID`  | Identifiant d'accès à l'API Crisp                                                |
| `NEXT_PUBLIC_STRAPI_URL`        | URL de l'API Strapi                                                              |
| `NEXT_PUBLIC_STRAPI_KEY`        | Clé publique d'accès à l'API Strapi                                              |
| `NEXT_PUBLIC_PANIER_URL`        | URL du module [panier](../panier/) (accessible depuis la page "Outil numérique") |

Ces variables sont toutes embarquées lors du build du module.

Elles sont définies à partir des [variables d'environnement de Github](https://github.com/incubateur-ademe/territoires-en-transitions/settings/environments) pour chaque environnement cible : `dev` (utilisé pour les tests), `preprod` et `prod`.

## Lancer le site avec Strapi en local

Démarrer strapi en local
TODO

Ouvrir [Strapi admin](http://localhost:1337/admin) en local, et créer une clé depuis Settings > API Tokens. Au premier lancement, il sera nécessaire de créer un compte, puis de compléter les données des pages / collections à tester.

Valeurs à renseigner dans le fichier .env :

- NEXT_PUBLIC_STRAPI_KEY (clé créée depuis le menu Settings)
- NEXT_PUBLIC_STRAPI_URL=http://127.0.0.1:1337
