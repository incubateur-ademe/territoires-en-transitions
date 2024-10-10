# Panier d'action à impact

## Description

Ce module permet de constituer une base d’actions adaptées aux compétences d'une collectivité et d'initier un plan d’action pilotable à partir de cette sélection.

Ce module utilise [Next.js](https://nextjs.org/).

## Configuration

Les variables d'environnement doivent être définies dans un fichier .env (voir le fichier [.env.sample](.env.sample)).

Ces variables sont toutes embarquées lors du build du module.

Elles sont définies à partir des [variables d'environnement de Github](https://github.com/incubateur-ademe/territoires-en-transitions/settings/environments) pour chaque environnement cible : `dev` (utilisé pour les tests), `preprod` et `prod`.

## Contenus

Les contenus sont importés depuis le CMS Directus par la edge function [`get_panier_data_from_directus`](../../supabase/functions/get_panier_data_from_directus/).
