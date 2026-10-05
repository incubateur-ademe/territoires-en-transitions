# Strapi — CMS du site vitrine

Strapi 5 (`@strapi/strapi` épinglé dans `package.json`), projet npm isolé du
monorepo (hors workspace pnpm et Nx). Il alimente `apps/site` via l'API REST,
lue avec un token API en lecture seule.

## En local

```bash
make up p=strapi      # Strapi + sa base Postgres (localhost:1337), Node 22 en conteneur
make cms-pull         # ⚠ remplace le contenu local par celui de l'instance distante
```

- `docker-compose.yml` fournit les secrets de dev (`APP_KEYS`, `API_TOKEN_SALT`,
  `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY`) et seede un token
  API `local-dev-readonly` (`strapi/src/index.ts`) égal à `NEXT_PUBLIC_STRAPI_KEY`
  dans `apps/site/.env`.
- `make cms-pull` enchaîne `strapi transfer` (même version majeure des deux côtés
  obligatoire) puis `scripts/strapi-localize-uploads.mts`, qui rapatrie les médias.
- Au premier démarrage, le bootstrap crée le référencement de la page Démarche
  PCAET et les questions de la FAQ « Démarche PCAET » s'ils n'existent pas.

## Modèle de contenu

`src/api/*/content-types/*/schema.json` et `src/components/**`. Tous les types
sont en Draft & Publish : chaque entrée publiée a une version brouillon jumelle,
et l'API publique ne renvoie que les publiées. Les entrées s'identifient par
`documentId` (URLs du site), l'`id` numérique restant disponible pour les filtres.

## Déploiement

Strapi Cloud, branché sur la branche `strapi-updates` avec déclenchement manuel
(« Trigger deployment »). Voir `doc/adr/0009-site-public-administrable.md`.
Les variables d'environnement ci-dessus doivent y exister ; les migrations de
données internes de Strapi se jouent au démarrage.
