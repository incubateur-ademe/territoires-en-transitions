# Backend

## Description

Backend de territoires en transitions basé sur [Nest](https://github.com/nestjs/nest).

## Configuration

Les variables d'environnement du fichier [.env.default](.env.default) doivent être définies dans un fichier `.env` à la racine.

Les variables d'environnement suivantes sont définies:

- Dans les [variables d'environnement de Github](https://github.com/incubateur-ademe/territoires-en-transitions/settings/environments/1431973268/edit) utilisées pour configurer le [déploiement Koyeb](https://app.koyeb.com/services/c7001069-ca11-4fd7-86c6-7feb45b9b68d/settings) pour :

  - `TRAJECTOIRE_SNBC_SHEET_ID`
  - `TRAJECTOIRE_SNBC_XLSX_ID`
  - `TRAJECTOIRE_SNBC_RESULT_FOLDER_ID`

  Les identifiants peuvent également être récupérés à partir du drive de `territoiresentransitions`.

- Dans le [gestionnaire de secret de Koyeb](https://app.koyeb.com/secrets) pour :

  - `GCLOUD_SERVICE_ACCOUNT_KEY`
  - `SUPABASE_JWT_SECRET`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ANON_KEY`

## Scripts disponibles

À lancer depuis la racine du monorepo.

```bash

# Lance en développement avec rechargement automatique lorsqu'un fichier est modifié
$ pnpm dev:backend

# Build avec le mode production
$ pnpm build:backend

# Lance les tests
$ pnpm test:backend

# Ou directement avec Nx
$ nx test backend
```

### Tests

Les tests sont colocalisés au plus près du fichier testé.

Exemple :

```
└ update-action-statut.router.ts
└ update-action-statut.router.e2e-spec.ts
```

---

Lancer tous les tests :

```sh
nx test backend
```

Lancer uniquement un fichier de test donné :

```sh
nx test backend 'update-action-statut.router.e2e-spec.ts'
```

Lancer uniquement les tests dont le chemin contient `referentiels` :

```sh
nx test backend 'referentiels'
```

## API Publique

Une documentation [Swagger / Open Api](https://swagger.io/specification/) est disponible [ici](https://api.territoiresentransitions.fr/api-docs/v1).

Par ailleurs, un guide de démarrage rapide est disponible [ici](./QuickstartApi.md).

## TRPC UI

Une interface similaire à Swagger est disponible pour nos endpoints internes TRPC, sur [`/trpc-ui`](http://localhost:8080/trpc-ui).

Cette route est uniquement accessible en local en mode development (vérification de la var d'env `NODE_ENV=development`)
