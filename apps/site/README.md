# Site

## Description

Ce module implémente le site institutionnel du programme TETE.

Les contenus sont maintenus dans une instance Strapi.

## Configuration

Les variables d'environnement doivent être définies dans un fichier .env (voir le fichier [.env.sample](.env.sample)).

Ces variables sont toutes embarquées lors du build du module.

Elles sont définies à partir des [variables d'environnement de Github](https://github.com/incubateur-ademe/territoires-en-transitions/settings/environments) pour chaque environnement cible : `dev` (utilisé pour les tests), `preprod` et `prod`.

## Lancer le site avec Strapi en local

```bash
make up p=strapi   # Strapi 5 + sa base Postgres sur localhost:1337
make cms-pull      # optionnel : copie le contenu de l'instance distante
```

Le Strapi local seede au démarrage un token API en lecture seule dont la valeur
est déjà celle de `NEXT_PUBLIC_STRAPI_KEY` dans `apps/site/.env` : aucune clé à
créer à la main. Voir `strapi/README.md`.

Le site lit l'API REST de Strapi 5 : réponses à plat (pas d'enveloppe
`attributes`), entrées identifiées par `documentId`, population des dynamic
zones en syntaxe `populate[<zone>][on][<composant>]`.
