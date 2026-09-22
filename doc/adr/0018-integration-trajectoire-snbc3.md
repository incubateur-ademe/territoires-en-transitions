# 18. Intégration de la trajectoire SNBC3 territorialisée

**Date :** 2026-09-10
**Statut :** Proposition

## Contexte

### Le fonctionnement actuel (SNBC2)

Le calcul de la trajectoire SNBC affiché dans TeT
(`apps/backend/src/indicateurs/trajectoires/`) repose sur un **classeur de calcul
distant** :

1. le backend rassemble les données d'entrée de la collectivité depuis sa propre
   base (émissions GES, séquestration, consommations finales) ;
2. `TrajectoiresSpreadsheetService` **copie un modèle Google Sheets**
   (`TRAJECTOIRE_SNBC_SHEET_ID`) dans un dossier de résultats — *un classeur par
   EPCI* — via `SheetService` ;
3. il écrit le SIREN et les valeurs d'entrée dans des cellules fixes, laisse les
   formules du Sheet recalculer ;
4. il relit les cellules de résultat (trajectoire 2015→2050 par secteur) et les
   `upsert` comme valeurs d'indicateur (`source` dédiée) ;
5. le classeur sert aussi de fichier téléchargeable ; `TrajectoiresXlsxService`
   produit en parallèle une variante `.xlsx` (`xlsx-template`,
   `TRAJECTOIRE_SNBC_XLSX_ID`).

Le calcul de masse est piloté par une file BullMQ (`compute-trajectoire`,
`apps/tools`) avec **backoff de 30 s « due to spreadsheet rate limiting »**,
chunks de 10 collectivités, 3 tentatives. Le moteur de calcul est donc un Google
Sheet, et son débit est déjà identifié comme un point de friction dans le code.

### Ce qui change avec la SNBC3

Une nouvelle méthodologie et un nouvel outil existent dans le dépôt autonome
[`snbc3`](https://github.com/incubateur-ademe/…) *(à compléter)* : un pipeline
Python qui (a) consolide une dizaine de sources publiques en une base
d'indicateurs par EPCI, (b) **territorialise la trajectoire nationale SNBC3** et
(c) produit un tableur Excel autonome équivalent au Google Sheet actuel.

La différence structurelle est déterminante :

| | SNBC2 (TeT actuel) | SNBC3 (`snbc3`) |
|---|---|---|
| Approche | **bottom-up** : la collectivité fournit son inventaire, le classeur calcule une trajectoire « part équitable » | **top-down** : trajectoire nationale désagrégée par pivots EPCI, puis recalage sur l'observé (OREC / CITEPA IGT) en année de référence |
| Personnalisation | par collectivité, à la demande | **déjà pré-calculée pour les ~1 232 EPCI** dans `resultats_territorialises.parquet` (≈ 2,4 M lignes, 64 sous-secteurs, 2020→2050) |
| Moteur au runtime | nécessaire (1 collectivité = 1 calcul) | **inutile pour la trajectoire de référence** ; nécessaire seulement pour rejouer le calcul avec des données locales forcées |

**Conséquence : pour la trajectoire SNBC3 de référence, TeT n'a besoin d'aucun
moteur de calcul.** Ingérer une table suffit. Toute la machinerie Sheets (copie
par EPCI, rate limiting, file d'attente, retries) peut être retirée du chemin
critique.

## Besoin

- Afficher la trajectoire SNBC3 territorialisée pour chaque collectivité, sans
  dépendre d'un classeur distant ni de son débit.
- Conserver la possibilité de fournir le résultat en fichier téléchargeable.
- Garder la maîtrise méthodologique (validation climat, suivi des anomalies des
  données DGEC provisoires) là où elle est aujourd'hui : dans l'équipe qui
  produit `snbc3`.
- Ne pas alourdir le monorepo TeT (pnpm / nx / Node) d'une toolchain Python.
- Statuer sur la localisation du code : monorepo TeT ou dépôt autonome.

## Décision

### 1. Coupler par la donnée, pas par le code — `snbc3` reste un dépôt autonome

`snbc3` est traité comme un **fournisseur de données amont**, au même titre
qu'INSEE ou l'OREC. Le point d'intégration est un **artefact publié et versionné**
(`resultats_territorialises`, dont le dictionnaire de données
`docs/resultats_territorialises.md` fournit déjà le contrat), pas un couplage de
code ni un sous-projet du monorepo.

Motifs :

- **Cadences différentes** : millésime de données annuel vs développement produit
  continu.
- **Toolchains incompatibles** : Python / `uv` / Excel-COM (`xlwings`, non
  conteneurisable sous Linux) vs pnpm / nx / Node 24.
- **Compétences et revue différentes** : méthodologie bas-carbone et data
  engineering vs full-stack produit.
- **`snbc3` a une valeur hors TeT** : l'Excel autonome est distribué directement
  aux territoires, des scripts de comparaison avec les territoires pilotes
  existent, etc.
- L'intégrer au monorepo imposerait une CI Python à tous les contributeurs TeT
  qui n'y toucheront jamais.

### 2. Ingérer l'artefact comme une nouvelle source d'indicateur

TeT ajoute un **importeur** (TypeScript), sur le modèle de `import-indicateurs`
ou des connecteurs de `apps/tools` (sirene, airtable, connect…) :

- `snbc3` publie `resultats_territorialises` (parquet + éventuel export CSV /
  table) dans un stockage S3-compatible ou un bucket Supabase, avec un numéro de
  millésime.
- Un job (cron `apps/tools` ou commande `import-indicateurs`) télécharge
  l'artefact et `upsert` les valeurs comme source `SNBC3`.
- Le chemin Google Sheets (`TrajectoiresSpreadsheetService`) est **retiré du
  calcul de la trajectoire de référence** : plus de copie de classeur par EPCI,
  plus de file `compute-trajectoire` sous contrainte de rate limiting, résultats
  immédiats.

### 3. Générer le fichier téléchargeable côté TeT

Le fichier remis à l'utilisateur est reconstruit en TypeScript à partir des
données ingérées, avec `xlsx-template` (déjà une dépendance). Le web produit ne
dépend plus de `xlwings` / COM Excel. L'Excel autonome de `snbc3` reste un
livrable séparé, pour la distribution directe aux territoires.

### 4. Portage TS de la seule formule finale — conditionnel

**Si** le produit confirme le besoin d'un SNBC3 *interactif* par collectivité
(rejouer le calcul avec des données d'inventaire forcées, ce que permet l'Excel
dynamique), alors porter **uniquement** `pipeline/territorialize.py` (~800 lignes,
formule fermée : `national × pivot × corrections_dju × correction_démo`, puis
recalage sectoriel) dans `packages/domain`, à côté du code domaine « trajectoires »
existant.

Ce portage est alimenté par des **tables de référence publiées par `snbc3`** :
pivots par EPCI, trajectoire nationale retraitée, indicateurs de recalage. Les
~2 500 lignes d'extracteurs de sources (`sources/`, `pipeline/aggregate.py` :
interpolation IDW Météo-France, parsing INSEE, secret statistique, jointures COG
multi-millésimes) **ne sont pas portées** — faible valeur, fort risque de bugs,
et l'intrant « trajectoire nationale retraitée » restera de toute façon un
tableur produit à la main par l'expert.

### Facteurs de décision

#### Positifs

- Supprime Google Sheets du chemin critique : plus de rate limiting, plus de
  backoff 30 s, plus de classeur par EPCI, résultats instantanés.
- Séparation nette des responsabilités : `snbc3` = modélisation, TeT = produit.
- Zéro réécriture du pipeline Python mûr (tests unitaires, checks de cohérence
  nationale, registre d'anomalies DGEC).
- Rafraîchissement annuel = republier l'artefact + réingérer.
- Réutilise des patterns TeT existants (import-indicateurs, cron `apps/tools`,
  sources d'indicateur).

#### Négatifs

- Deux dépôts à coordonner : il faut geler et versionner un contrat de sortie.
- Quelqu'un doit *posséder* la CI de publication de `snbc3` (millésime annuel).
- Perte de l'interactivité « je force mes propres données » pour la SNBC3 tant
  que le point 4 n'est pas réalisé — à valider avec le produit (la logique
  top-down de la SNBC3 n'a pas le même sens que le bottom-up de la SNBC2).
- Risque de double implémentation de la formule (batch Python + runtime TS) si le
  point 4 est réalisé — mitigé en gardant `snbc3` comme référence et en
  réutilisant ses jeux de tests de convergence.

## Conséquences

### Positives

- Le calcul de la trajectoire de référence devient une simple lecture de table.
- La file `compute-trajectoire` et la dépendance à l'API Google Sheets peuvent
  être retirées (ou réduites au strict SNBC2 pendant la transition).
- Le monorepo TeT reste mono-langage.

### Négatives

- Nouvelle dépendance opérationnelle : disponibilité de l'artefact `snbc3`.
- L'ajout d'un indicateur ou d'un sous-secteur SNBC3 nécessite un aller-retour
  avec le dépôt `snbc3` (pas un simple PR TeT).
- Migration à mener : deux méthodologies (SNBC2 / SNBC3) coexistent le temps de la
  bascule.

## Trajectoire de mise en œuvre

1. **`snbc3`** : figer le contrat de sortie de `resultats_territorialises`,
   ajouter une CI qui publie l'artefact versionné.
2. **TeT** : importeur ingérant l'artefact comme source `SNBC3` ; retirer le
   chemin Sheets du calcul de référence.
3. Garder le chemin SNBC2 / Google Sheets vivant pendant la transition.
4. Générer le fichier téléchargeable en TS depuis les données ingérées.
5. **Conditionnel** : si le besoin interactif est confirmé, porter
   `territorialize.py` dans `packages/domain`, nourri par les tables de référence
   `snbc3`.

## Alternatives considérées

### Embarquer le pipeline Python dans le monorepo TeT

Ajouter `snbc3` comme app/container du monorepo, invoqué par un cron.

Rejeté :

- Fardeau polyglotte réel (toolchain Python, images Docker, CI, scan de
  dépendances, onboarding) pour un code que personne côté produit ne modifiera.
- Le `standalone_tool` exige Excel + COM : impossible à conteneuriser sous Linux,
  cette partie ne migre pas quoi qu'il arrive.
- Le pipeline est un batch offline (télécharge ~10 sources externes) : le plier
  dans une app requête/réponse est un contresens.

### Réécrire toute la territorialisation (extracteurs inclus) en TypeScript

Rejeté : les extracteurs de sources représentent l'essentiel du volume et de la
complexité (interpolation spatiale, parsing de fichiers INSEE, gestion des
millésimes COG) pour une valeur produit nulle. Risque de régression élevé, et
l'intrant « trajectoire nationale retraitée » resterait un tableur manuel.

### Continuer avec un Google Sheet SNBC3

Rejeté : reconduit le rate limiting, la file d'attente et la copie de classeur
par EPCI, alors que la SNBC3 est entièrement pré-calculable.

## Architecture cible

```
┌─────────────────────────────┐        ┌────────────────────────────────────┐
│   Dépôt snbc3 (Python/uv)   │        │       Territoires en Transition     │
│                             │        │                                    │
│  extract → dju → aggregate  │        │  apps/tools (cron) ou               │
│      → territorialize       │        │  import-indicateurs                 │
│           │                 │        │        │                           │
│           ▼                 │  S3 /  │        ▼                           │
│  resultats_territorialises  │ ─────► │  importeur SNBC3 (TS)              │
│  .parquet  (millésime N)    │ bucket │        │                           │
│  + dictionnaire de données  │        │        ▼                           │
│                             │        │  indicateur_valeur (source SNBC3) │
│  standalone_tool/*.xlsx     │        │        │                           │
│  (distribution directe      │        │        ▼                           │
│   territoires, hors TeT)    │        │  UI Trajectoire  +  export .xlsx   │
│                             │        │       (xlsx-template, côté TeT)     │
└─────────────────────────────┘        └────────────────────────────────────┘

        [conditionnel] packages/domain : portage TS de territorialize.py,
        alimenté par les tables de référence publiées par snbc3
        (pivots EPCI, trajectoire nationale, recalage)
```

## Fichiers concernés (TeT)

| Fichier | Rôle |
|---|---|
| `apps/backend/src/indicateurs/trajectoires/trajectoires-spreadsheet.service.ts` | Chemin Google Sheets — à retirer du calcul de référence |
| `apps/backend/src/indicateurs/trajectoires/trajectoires-xlsx.service.ts` | Export `.xlsx` — à réorienter vers les données ingérées |
| `apps/tools/src/indicateurs/trajectoires/cron-compute-trajectoire.service.ts` | File `compute-trajectoire` — à retirer (SNBC3) ou restreindre (SNBC2) |
| `apps/backend/src/indicateurs/import-indicateurs/` | Modèle pour l'importeur SNBC3 |
| `packages/domain/src/indicateurs/trajectoires/` | Emplacement du portage TS conditionnel |
