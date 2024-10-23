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
$ nx test @tet/backend
```

### Tests

Pour lancer tous les tests :

```
nx test @tet/backend
```

Pour lancer uniquement les tests unitaires (dossier `src`) :

```
nx test @tet/backend src
```

Pour lancer uniquement les tests end-to-end (dossier `test`) :

```
nx test @tet/backend test
```
