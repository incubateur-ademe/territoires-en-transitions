# Import de la typologie SINOE

Rattache les communes et EPCI à leur typologie SINOE (ADEME) : urbain, mixte,
rural, touristique…

- Peuple la table `typologie_sinoe`.
- Renseigne `collectivite.sinoe_id` :
  - communes : appariées par `commune_code` ;
  - EPCI : appariés par `siren` (colonne `SIRET` du CSV, tronquée à 9 chiffres).

## Prérequis

La migration Sqitch `collectivite/typologie_sinoe` doit être déployée.

## Fichiers source

Les CSV SINOE (ex. `TYPOLOGIE_COMMUNES_2024.csv`, `TYPOLOGIE_EPCI_2024.csv`) sont
archivés dans le drive TeT, pas dans le dépôt. Séparateur `;`, avec les colonnes :

- communes : `code_commune`, `code_typologie`, …
- EPCI : `SIRET` (SIREN ou SIRET), `code_typologie`, …

Le type de chaque fichier est détecté d'après ses colonnes d'en-tête ; un fichier
non reconnu arrête le script avant toute écriture.

## Lancement

Au moins un fichier est requis, dans n'importe quel ordre :

```bash
SUPABASE_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  tsx apps/tools/src/migrations/sinoe/import-typologie-sinoe.ts \
    TYPOLOGIE_COMMUNES_2024.csv TYPOLOGIE_EPCI_2024.csv
```

Le script est idempotent. Il liste les codes commune / SIREN du CSV absents de
la base (affichés s'ils sont au plus 50, sinon seul le nombre est donné).
