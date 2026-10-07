# Strapi — CMS du site vitrine

Strapi 5 (`@strapi/strapi` épinglé dans `package.json`), projet npm isolé du
monorepo (hors workspace pnpm et Nx). Il alimente `apps/site` via l'API REST,
lue avec un token API en lecture seule.

## En local

```bash
make up p=strapi      # Strapi + sa base Postgres (localhost:1337), Node 24 en conteneur
make cms-pull         # ⚠ remplace le contenu local par celui de l'instance distante
```

- `docker-compose.yml` fournit les secrets de dev (`APP_KEYS`, `API_TOKEN_SALT`,
  `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY`) et seede un token
  API `local-dev-readonly` (`strapi/src/index.ts`). Pour brancher le site dessus,
  le reporter dans `apps/site/.env.local` (voir `apps/site/README.md`).
- L'image `tet-strapi` est taguée par version de Node (`tet-strapi:node24`) :
  compose la reconstruit d'office au changement de version. Le premier démarrage
  remplace les `node_modules` du volume `strapi-node-modules` (environ une minute).
- `make cms-pull` enchaîne `strapi transfer` (même version majeure des deux côtés
  obligatoire) puis `scripts/strapi-localize-uploads.mts`, qui rapatrie les médias.
- Le bootstrap (`src/index.ts`) joue une seule fois, au premier démarrage :
  - le référencement de la page Démarche PCAET et les questions de la FAQ
    « Démarche PCAET », s'ils n'existent pas ;
  - la copie de l'`id` Strapi 4 de chaque actualité dans le champ caché
    `legacy_id`, qui permet au site de rediriger les anciennes URLs `/actus/<id>/…`.

## Modèle de contenu

`src/api/*/content-types/*/schema.json` et `src/components/**`. Tous les types
sont en Draft & Publish : chaque entrée publiée a une version brouillon jumelle,
et l'API publique ne renvoie que les publiées. Les entrées s'identifient par
`documentId` : publier recrée la ligne publiée sous un nouvel `id` numérique, qui
ne doit donc servir ni dans une URL, ni pour un tri.

## Serveur MCP

Le serveur MCP de Strapi (`/mcp`) est activé dans `config/server.ts`. Il permet
de lire et de modifier les contenus depuis un agent, avec les droits d'un admin
token. Le serveur `strapi` de `.mcp.json` s'y connecte en déchiffrant à la volée
`STRAPI_REMOTE_URL` et `STRAPI_MCP_TOKEN` depuis le `.env` racine.

Pour l'activer en local :

1. Dans l'admin de prod, créer un admin token limité aux types de contenu à
   modifier.
2. Le chiffrer dans le `.env` racine :
   `pnpm exec dotenvx set STRAPI_MCP_TOKEN <token> --env-keys-file=.env.keys -f .env`
3. Relancer Claude Code et approuver le serveur `strapi`.

## Déploiement

Strapi Cloud, branché sur la branche `strapi-updates` avec déclenchement manuel
(« Trigger deployment »). Voir `doc/adr/0009-site-public-administrable.md`.

Variables à définir sur Strapi Cloud : `APP_KEYS`, `API_TOKEN_SALT`,
`ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT` et `ENCRYPTION_KEY` (par exemple
`openssl rand -base64 32`). `JWT_SECRET` n'est plus lue. La version de Node du
projet (Settings → Node version) doit être 24, comme ici.

### Bascule Strapi 4 → 5 (une seule fois)

Le site lit le format de réponse de Strapi 5 : il casse contre un Strapi 4, et
inversement. `next build` pré-rend les pages contre Strapi : l'image du site se
construit donc après le passage de Strapi en v5, jamais avant.

1. Geler les éditions dans l'admin de prod, puis faire une sauvegarde
   manuelle sur Strapi Cloud (onglet Backups).
2. Vérifier dans l'admin de prod (Content Manager → User) que la collection
   Users & Permissions est vide ou inutilisée : le plugin est retiré, ses tables
   `up_*` disparaissent au premier démarrage.
3. Régler Node 24 et ajouter `ENCRYPTION_KEY` sur Strapi Cloud.
4. Merger la PR sur `main`, pousser le même commit sur `strapi-updates`, puis
   « Trigger deployment ». Attendre que l'API réponde au format v5 :
   `GET /api/faqs?pagination[pageSize]=1` renvoie `data[0].documentId`, sans
   `attributes`.
5. Lancer aussitôt le workflow GitHub `cd-site` sur `prod`, puis `staging` et
   `preprod`, qui lisent le même Strapi. Entre les étapes 4 et 5, le site est
   en erreur sur les pages non encore en cache.
6. Dégeler les éditions. `make cms-pull` refonctionne pour tout le monde.

Retour arrière : restaurer la sauvegarde Strapi Cloud, redéployer le dernier
commit Strapi 4 sur `strapi-updates`, revert de la PR puis `cd-site`.
