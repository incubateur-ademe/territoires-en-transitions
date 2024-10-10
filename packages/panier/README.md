# Panier d'action à impact

## Description

Ce module permet de constituer une base d’actions adaptées aux compétences d'une collectivité et d'initier un plan d’action pilotable à partir de cette sélection.

Ce module utilise [Next.js](https://nextjs.org/).

## Configuration

Les variables d'environnement suivantes doivent être définies dans un fichier .env (voir le fichier [.env.sample](.env.sample)):

| Variable                        | Description                           |
| ------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL de l'API Supabase                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique d'accès à l'API Supabase |
| `NEXT_PUBLIC_POSTHOG_HOST`      | URL de l'API PostHog                  |
| `NEXT_PUBLIC_POSTHOG_KEY`       | Clé publique d'accès à l'API PostHog  |
| `NEXT_PUBLIC_AXEPTIO_ID`        | Identifiant d'accès à l'API Axeptio   |
| `NEXT_PUBLIC_CRISP_WEBSITE_ID`  | Identifiant d'accès à l'API Crisp     |

Ces variables sont toutes embarquées lors du build du module.

Elles sont définies à partir des [variables d'environnement de Github](https://github.com/incubateur-ademe/territoires-en-transitions/settings/environments) pour chaque environnement cible : `dev` (utilisé pour les tests), `preprod` et `prod`.

## Contenus

Les contenus sont importés depuis le CMS Directus par la edge function [`get_panier_data_from_directus`](../../supabase/functions/get_panier_data_from_directus/).
