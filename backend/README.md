# Backend

## Description

Backend de territoires en transitions basé sur [Nest](https://github.com/nestjs/nest).

## Installation

```bash
$ npm install
```

## Configuration

Les variables d'environnement suivantes doivent être définies dans un fichier .env (voir le fichier [.env.default](.env.default)):

- **TRAJECTOIRE_SNBC_SHEET_ID**: Identifiant du Google spreadsheet utilisé pour le calcul de la trajectoire.
- **TRAJECTOIRE_SNBC_XLSX_ID**: Identifiant du Xlsx original utilisé pour le calcul de la trajectoire (stocké sur le drive)
- **TRAJECTOIRE_SNBC_RESULT_FOLDER_ID**: Identifiant du dossier Google Drive dans lequel les spreadsheets des trajectoires calculées doivent être sauvés (un fichier par EPCI). A noter qu'il existe **un dossier par environnement** (dev, preprod, prod).
- **GCLOUD_SERVICE_ACCOUNT_KEY**: contenu au format json du fichier de clé de compte de service permettant l'utilisation des api Google Drive et Google Spreadsheet.
- **SUPABASE_JWT_SECRET**: clé de signature des tokens jwt. Utilisé pour vérifier la signature des tokens.

Ces variables d'environnement sont définies:

- pour **TRAJECTOIRE_SNBC_SHEET_ID**, **TRAJECTOIRE_SNBC_XLSX_ID** et **TRAJECTOIRE_SNBC_RESULT_FOLDER_ID** dans les [variables d'environnement de Github](https://github.com/incubateur-ademe/territoires-en-transitions/settings/environments/1431973268/edit) utilisées pour configurer le [déploiement Koyeb](https://app.koyeb.com/services/c7001069-ca11-4fd7-86c6-7feb45b9b68d/settings). Les identifiants peuvent également être récupérés à partir du drive de `territoiresentransitions`.
- pour  **GCLOUD_SERVICE_ACCOUNT_KEY**, **SUPABASE_JWT_SECRET** et **SUPABASE_SERVICE_ROLE_KEY** dans le [gestionnaire de secret de Koyeb](https://app.koyeb.com/secrets)

## Scripts disponibles

```bash

# Lance en développement avec rechargement automatique lorsqu'un fichier est modifié
$ npm run start:dev

# Lance avec le mode production
$ npm run start:prod

# Lance les tests
$ npm run test
```