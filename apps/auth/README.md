# Module d'authentification

Ce module implémente les écrans nécessaires à la création des comptes utilisateur et à l'authentification.

## Variables d'environnement

Les variables suivantes sont utilisées au runtime.

| Nom         | Description                                                                              |
| ----------- | ---------------------------------------------------------------------------------------- |
| `SMTP_KEY`  | Clé du serveur SMTP                                                                      |
| `SMTP_USER` | Utilisateur du serveur SMTP                                                              |
| `PORT`      | Port sur lequel l'application en mode prod est exposée lors du lancement via `npm start` |

> Dans les modes `development` ou `test`, les variables `SMTP_*` sont ignorées car le code utilise le serveur SMTP du service [Inbucket](https://inbucket.org/) inclus dans Supabase.

Les variables suivantes sont utilisées au build et embarquées dans le front.

| Nom                             | Description                 |
| ------------------------------- | --------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Adresse du serveur Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé Supabase anonyme        |

## Commandes NPM

| Commande    | Description                      |
| ----------- | -------------------------------- |
| `dev`       | Lance le serveur de dev          |
| `build`     | Fait le build                    |
| `start`     | Démarre le module après le build |
| `lint`      | Vérifie la syntaxe               |
| `storybook` | Démarre le storybook             |
| `format`    | Formate le code                  |
