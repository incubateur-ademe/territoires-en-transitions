# Import Banatic 2025

Scripts d'import des données du référentiel Banatic 2025 dans la base de données.

## Prérequis

1. Les migrations Sqitch `referentiel/banatic_2025` et `referentiel/banatic_2025_perimetre` doivent être déployées.
2. Les fichiers CSV source Banatic 2025 (téléchargés depuis le dossier "Tech" dans le drive TeT).
3. Le backend doit être compilé (`pnpm run build:backend`) pour résoudre les imports `@tet/backend/*`.

## Fichiers CSV source

Placez les fichiers dans un répertoire (par défaut `~/Downloads/source_banatic_2025/`) :

| Fichier | Contenu |
|---------|---------|
| `1_code_banatic_2025.csv` | Référentiel des codes compétences 2025 (code + intitulé) |
| `2_interco_competences_banatic.csv` | Compétences par groupement (une ligne par EPCI, colonnes OUI/NON) |
| `3_transfert_code_<CODE>.csv` | Transferts de compétence (un fichier par code compétence) |
| `4_banatic_retrocompatibilite.csv` | Table de correspondance Banatic 2021 → 2025 |

Le périmètre des EPCI (étape 3bis) n'utilise pas un fichier du drive Tech mais le CSV
**déjà versionné** dans le repo :
`apps/backend/src/collectivites/import-collectivite-relations/perimetre-epci-a-fp.csv`
(dataset data.gouv « base nationale sur les intercommunalités », une ligne par
EPCI/commune, séparateur `;`). Pour le rafraîchir :
`https://www.data.gouv.fr/api/1/datasets/r/6e05c448-62cc-4470-aa0f-4f31adea0bc4`.

## Ordre d'exécution

Les scripts doivent être exécutés **dans l'ordre** (chaque étape dépend de la précédente).

```bash
export SUPABASE_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
SOURCE_DIR=[source_dir]
```

### 1. Codes compétences 2025

Peuple la table `banatic_2025_competence` (référentiel).

```bash
tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-codes/index.ts \
  "$SOURCE_DIR/1_code_banatic_2025.csv"
```

### 2. Correspondance 2021 → 2025

Peuple la table `banatic_2021_2025_crosswalk`.
Les codes 2021 absents de `banatic_2025_competence` sont ignorés.

```bash
tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-crosswalk/index.ts \
  "$SOURCE_DIR/4_banatic_retrocompatibilite.csv"
```

### 3. Compétences par collectivité

Peuple la table `collectivite_banatic_2025_competence`.
Crée les collectivités manquantes si nécessaire.

```bash
tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-collectivite-competences/index.ts \
  "$SOURCE_DIR/2_interco_competences_banatic.csv"
```

### 3bis. Périmètre des EPCI

Peuple la table `collectivite_banatic_2025_perimetre` (nombre de communes membres
par EPCI, dénominateur pour l'inférence de délégation totale d'une compétence).
Comptage des communes **distinctes** par SIREN d'EPCI, **sans filtre de population**
(la colonne `nb_membres` du CSV sert seulement de contrôle : un écart est loggé,
le recomptage fait foi). Requiert les collectivités créées à l'étape 3 ;
indépendant de l'étape 4.

```bash
tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-perimetre/index.ts \
  apps/backend/src/collectivites/import-collectivite-relations/perimetre-epci-a-fp.csv
```

### 4. Transferts de compétences

Peuple la table `collectivite_banatic_2025_transfert` pour un code compétence donné
(`nature_transfert` + `nb_communes_transferees`).
À exécuter une fois par fichier de transfert disponible. Indépendant de l'étape 3bis.

```bash
tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-transferts/index.ts \
  1510 "$SOURCE_DIR/3_transfert_code_1510.csv"
```

## Seed (environnement de développement)

Les fichiers de seed pour ces tables se trouvent dans `data_layer/seed/` :

| Fichier | Table |
|---------|-------|
| `content/21-banatic_2025_competence.sql` | `banatic_2025_competence` |
| `content/22-banatic_2021_2025_crosswalk.sql` | `banatic_2021_2025_crosswalk` |
| `imports/07-banatic_2025_competence_par_collectivite.sql` | `collectivite_banatic_2025_competence` |
| `imports/08-banatic_2025_transfert_par_collectivite.sql` | `collectivite_banatic_2025_transfert` |


## Tables

| Table | Description |
|-------|-------------|
| `banatic_2025_competence` | Référentiel des compétences (code 4 chiffres + intitulé) |
| `banatic_2021_2025_crosswalk` | Correspondance codes 2021 → 2025 (one_to_one, split, no_equivalent) |
| `collectivite_banatic_2025_competence` | Compétences exercées par collectivité |
| `collectivite_banatic_2025_transfert` | Transferts de compétences vers groupements intermédiaires (+ `nb_communes_transferees`) |
| `collectivite_banatic_2025_perimetre` | Nombre de communes membres par EPCI (dénominateur délégation totale) |
