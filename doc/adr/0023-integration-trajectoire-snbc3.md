# 23. Intégration de la trajectoire SNBC3 territorialisée

**Date :** 2026-10-12
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
`snbc3` *(lien à compléter)* : un pipeline Python qui (a) consolide une dizaine
de sources publiques en une base d'indicateurs par EPCI, (b) **territorialise la
trajectoire nationale SNBC3** et (c) produit un tableur Excel autonome
équivalent au Google Sheet actuel.

La différence structurelle est déterminante :

| | SNBC2 (TeT actuel) | SNBC3 (`snbc3`) |
|---|---|---|
| Approche | **bottom-up** : la collectivité fournit son inventaire, le classeur calcule une trajectoire « part équitable » | **top-down** : trajectoire nationale désagrégée par pivots EPCI, puis recalage sur l'observé (OREC / CITEPA IGT) en année de référence |
| Personnalisation | par collectivité, à la demande | **déjà pré-calculée pour ~1 260 territoires** (EPCI, EPT de la Métropole du Grand Paris et Paris) dans `resultats_territorialises.parquet` (≈ 2,6 M lignes, 66 sous-secteurs, 2020→2050) |
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

TeT ajoute un **import** TypeScript dans le backend, exposé par une mutation
tRPC réservée au service role et appelée à la main à chaque nouveau millésime
(pas de cron) :

- `snbc3` publie `resultats_territorialises` (parquet) et les autres fichiers de
  livrables associés (xlsx standalone avec toutes les données et pdf de méthodo
  versionnée) sous forme de commit dans son dépôt. La date du commit est utilisée 
  comme millésime.
- La mutation, appelée à la main par un admin, reçoit l'id du commit (l'URL du
  dépôt est définie en constante). Elle télécharge le parquet du commit
  (`hyparquet`, JS pur), le rattache aux collectivités par SIREN (par code
  commune pour Paris), applique une table de
  correspondance (codes SNBC3 → indicateurs TeT non calculés) et `upsert` les
  valeurs comme source `snbc3` via le service des valeurs. Les totaux restent
  calculés par les formules d'indicateurs existantes, d'où le passage obligé par
  le backend.
- L'import est idempotent. La source `snbc3` n'a qu'**un seul millésime en
  base** : une métadonnée unique, créée au premier import, puis mise à jour
  (date et commit) à chaque import. Les valeurs sont mises à jour en place, ce
  qui conserve leurs identifiants, et celles qui ne sont plus produites sont
  supprimées. L'historique des millésimes reste dans le dépôt `snbc3` : pour
  revenir en arrière, on réimporte un ancien commit.
- L'import stocke aussi le xlsx standalone du commit, qui sert à l'export
  (§3).
- À la généralisation (§4), le chemin Google Sheets
  (`TrajectoiresSpreadsheetService`) est **retiré du calcul de la trajectoire de
  référence** : plus de copie de classeur par EPCI, plus de file
  `compute-trajectoire` sous contrainte de rate limiting, résultats immédiats.

### 3. Générer le fichier téléchargeable côté TeT

Le fichier remis à l'utilisateur est adapté pour sa collectivité (en TypeScript)
à partir du xlsx standalone stocké à l'import. Le territoire est sélectionné dans
l'onglet `Territoire` : son libellé, lu dans la liste masquée du classeur, est
écrit dans la première ligne de la sélection, comme le fait déjà
`snbc3/api/excel_export.py`. Le classeur est recalculé à l'ouverture. Ainsi, dès
l'ouverture, le fichier est adapté au territoire qui l'a téléchargé. Le fichier
est modifié directement en XML, pour conserver les graphiques.
L'app ne dépend pas de `xlwings` / COM Excel. TeT sert aussi le classeur tel
qu'il est publié, sans sélection imposée, comme outil Excel. `snbc3` reste libre
de le distribuer directement aux territoires.

### 4. Ouvrir progressivement, derrière un feature flag

Les experts métier doivent vérifier les données en prod avant l'ouverture à
tous, et plusieurs livraisons de données peuvent précéder le feu vert. La
lecture de la SNBC3 est donc placée derrière un feature flag PostHog
(`is-trajectoire-snbc3-enabled`), ouvert d'abord aux experts, puis à des
collectivités, puis à tous :

- l'import a lieu en prod dès qu'un commit de publication est disponible, puis
  à chaque nouvelle livraison. Les valeurs `snbc3` ne sont servies qu'aux
  utilisateurs qui ont le flag ;
- le chemin SNBC3 s'ajoute à côté du chemin SNBC2, sans rien retirer. Sans le
  flag, rien ne change, calcul SNBC2 compris ;
- la **généralisation** retire le flag et l'ancien chemin, arrête le calcul
  SNBC2 et fait passer le score indicatif sur la SNBC3. Le score indicatif ne
  suit pas le flag : il alimente des scores persistés, partagés par toute la
  collectivité.

### 5. Portage TS de la seule formule finale — conditionnel

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
- Réutilise des patterns TeT existants (mutation service role, service des
  valeurs et ses formules, sources d'indicateur).

#### Négatifs

- Deux dépôts à coordonner : il faut geler et versionner un contrat de sortie.
- Quelqu'un doit *posséder* la CI de publication de `snbc3` (millésime annuel).
- Perte de l'interactivité « je force mes propres données » pour la SNBC3 tant
  que le point 5 n'est pas réalisé — à valider avec le produit (la logique
  top-down de la SNBC3 n'a pas le même sens que le bottom-up de la SNBC2).
- Risque de double implémentation de la formule (batch Python + runtime TS) si le
  point 5 est réalisé — mitigé en gardant `snbc3` comme référence et en
  réutilisant ses jeux de tests de convergence.

## Conséquences

### Positives

- Le calcul de la trajectoire de référence devient une simple lecture de table.
- La file `compute-trajectoire` est retirée à la généralisation. La dépendance à l'API
  Google Sheets disparaît avec le retrait de la SNBC2 ; d'ici là, le code est
  conservé mais n'est plus appelé.
- Le monorepo TeT reste mono-langage.

### Négatives

- Nouvelle dépendance opérationnelle : disponibilité de l'artefact `snbc3`.
- Le rafraîchissement d'un millésime est une opération manuelle en prod (appel
  de la mutation avec le jeton service role), documentée dans le dossier de
  l'import.
- L'ajout d'un indicateur ou d'un sous-secteur SNBC3 nécessite un aller-retour
  avec le dépôt `snbc3` (pas un simple PR TeT).
- Migration à mener : deux chemins (SNBC2 / SNBC3) coexistent dans le code
  pendant l'ouverture progressive, puis deux séries de données pendant la
  transition.
- Les données de chaque livraison remplacent les précédentes, sans historique
  dans TeT.

## Trajectoire de mise en œuvre

1. **`snbc3`** : figer le contrat de sortie de `resultats_territorialises`,
   ajouter une CI qui publie l'artefact versionné.
2. **TeT** : import (§2), puis lecture et export derrière le feature flag,
   ouverture progressive et généralisation (§3 et §4). Pendant la transition qui
   suit la généralisation, les valeurs SNBC2 restent en base et affichées, et le
   code Sheets est conservé jusqu'au retrait de la SNBC2.
   
   référence. Pendant la transition qui suit, les valeurs SNBC2 restent en base
   et affichées ; leur calcul est arrêté, et le code Sheets est conservé jusqu'au
   retrait de la SNBC2.
3. **Conditionnel** : si le besoin interactif est confirmé, porter
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
│   Dépôt snbc3 (Python/uv)   │        │       Territoires en Transition    │
│                             │        │                                    │
│  extract → dju → aggregate  │        │  mutation tRPC                     │
│      → territorialize       │        │  (appel manuel, service role)      │
│           │                 │        │        │                           │
│           ▼                 │ commit │        ▼                           │
│  resultats_territorialises  │ ─────► │  import SNBC3 (TS)                 │
│  .parquet                   │  daté  │     │                    │         │
│  + dictionnaire de données  │   =    │     ▼                    ▼         │
│  + xlsx standalone généré   │ millé- │  indicateur_valeur   bucket xlsx   │
│  + PDF de méthodologie      │ sime   │  (source snbc3)      standalone    │
│                             │        │     │                    │         │
│                             │        │     ▼                    ▼         │
│                             │        │  UI Trajectoire     export .xlsx   │
│                             │        │  (feature flag)     (patch XML)    │
└─────────────────────────────┘        └────────────────────────────────────┘

        [conditionnel] packages/domain : portage TS de territorialize.py,
        alimenté par les tables de référence publiées par snbc3
        (pivots EPCI, trajectoire nationale, recalage)
```

## Fichiers concernés (TeT)

| Fichier | Rôle |
|---|---|
| `apps/backend/src/indicateurs/trajectoires/trajectoires-spreadsheet.service.ts` | Chemin Google Sheets — à retirer du calcul de référence |
| `apps/backend/src/indicateurs/trajectoires/trajectoires-xlsx.service.ts` | Export `.xlsx` SNBC2 — remplacé par un nouvel export SNBC3, supprimé avec la SNBC2 |
| `apps/backend/src/indicateurs/valeurs/list-indicateur-valeurs/list-indicateur-valeurs.service.ts` | Masquage des valeurs `snbc3` sans le feature flag |
| `apps/tools/src/indicateurs/trajectoires/cron-compute-trajectoire.service.ts` | File `compute-trajectoire` — retirée à la généralisation SNBC3 |
| `apps/backend/src/collectivites/import-perimetres-epci/` | Modèle de la mutation service role |
| `apps/backend/src/indicateurs/valeurs/compute-indicateur-valeurs/` | Recalcul des totaux par formule, déclenché par l'upsert |
| `packages/domain/src/indicateurs/trajectoires/` | Emplacement du portage TS conditionnel |
