# leviers-ges

Les formules du tableur ADEME PlanET V1 (21 leviers de décarbonation) deviennent des fonctions pures TypeScript. On envoie une requête par levier, on reçoit les tonnes de CO2e évitées par an, pour une région, un département ou un EPCI. Le tableur fait foi : toute interprétation nouvelle se signale, elle ne se fait pas en silence.

Node ≥ 24, pnpm, TypeScript strict, `bignumber.js` pour tout calcul, aucune base de données (CSV en mémoire).

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint, dont les règles de calcul scientifique et de couches |
| `pnpm test:coverage` | vitest, seuil de 100 % sur `src/` |
| `pnpm build` | `dist/` (sans les constructeurs de données) |
| `pnpm build:limits` | régénère `src/domain/lever-limits.ts` depuis les tableaux « Limites » des `methodology.md` (un test échoue si le fichier est périmé) |
| `pnpm build:data:reseaux-chaleur` | reconstruit `data/reseaux-chaleur/networks.csv` depuis ses sources |
| `pnpm build:data:dechets` | reconstruit `data/dechets/` (flux de traitement et facteurs d'émission) depuis ses sources |
| `pnpm build:data:fertilisation-azotee` | reconstruit `data/fertilisation-azotee/` (azote livré par région et par département) depuis ses sources |
| `pnpm build:data:elevage-durable` | reconstruit `data/elevage-durable/` (effectifs d'animaux par région et département) depuis ses sources |
| `pnpm build:data:transport-marchandises` | reconstruit `data/transport-marchandises/` (tonnes.kilomètres et parc de poids lourds par région) depuis ses sources |
| `pnpm build:data:occupation-des-sols` | reconstruit `data/occupation-des-sols/` (surfaces des types de sol et facteurs de conversion par EPCI, département et région) depuis ses sources |
| `pnpm build:data:batiments-machines-agricoles` | reconstruit `data/batiments-machines-agricoles/` (consommations d'énergie de l'agriculture par région, département et EPCI) depuis ses sources |
| `pnpm build:data:produits-bois` | reconstruit `data/produits-bois/` (récolte de bois par région et département, surfaces de forêt par EPCI-département) depuis ses sources |
| `pnpm build:data:residentiel-sobriete` | reconstruit `data/residentiel-sobriete/` (consommation résidentielle d'énergie par région, département et EPCI, réseaux de chaleur) depuis ses sources |
| `pnpm build:data:residentiel-logements` | reconstruit `data/residentiel-logements/` (m² des résidences principales par EPCI-département et département, selon le type, le combustible et la période de construction) depuis la source communale versionnée ; `… extract <zip INSEE RP2022>` régénère cette source |

Une PR passe les quatre premières.

## Où chercher quoi

| Dossier | Contenu |
|---|---|
| `src/levers/<levier>/` | tout un levier : requête, calcul pur, lecture des données, `estimate`, tests, `methodology.md` |
| `src/estimator/` | `createEstimator(dataSource)` : valide la requête (seul endroit où l'inconnu entre), vérifie que le niveau est calculé, choisit le levier par son `id` |
| `src/application/` | aides partagées : contexte d'estimation (`getCommunesOf`, `getRegionByCommune`, `getDepartementByCommune`), erreurs, index des territoires, lecture de la consommation résidentielle (`residential-consumption/`, partagée par `residentiel_sobriete` et `residentiel_changement_systeme_chauffage`) |
| `src/domain/` | noyau : `BigNumber`, unités brandées, territoires, registre `LEVERS` (21 leviers × 3 niveaux), port `DataSource` |
| `src/infrastructure/csv/` | adaptateur CSV : manifeste, empreintes sha256, contrôles au chargement |
| `src/dataset-builders/` | scripts TypeScript qui reconstruisent un jeu de `data/` depuis ses sources |
| `src/testing/` | aides de test, dont `createTemporaryCsvDataSource` |
| `data/<jeu>/` | CSV et `manifest.json` (source, empreinte, unités, totaux de contrôle) |
| `eslint-rules/` | règle locale `constant-has-source` et son test |
| `docs/methodology/` | ce qui concerne plusieurs leviers : `conventions.md`, `assumptions.md`, `formula-corrections.md`, `points-a-arbitrer.md` |
| `docs/revue-de-code.md` | ce que le relecteur juge et que le lint ne vérifie pas |

## Les leviers

Chacun a son `src/levers/<id>/methodology.md` : sa formule, ses entrées, ses constantes sourcées, ses données et leurs limites, ses cas de test chiffrés. Pour comprendre un levier, c'est le premier fichier à lire.

| `id` | État | Pour creuser |
|---|---|---|
| `batiments_machines_agricoles` | fait | `src/levers/batiments-machines-agricoles/methodology.md` |
| `dechets_mode_de_traitement` | fait | `src/levers/dechets-mode-de-traitement/methodology.md` |
| `dechets_sobriete` | fait | `src/levers/dechets-sobriete/methodology.md` |
| `elevage_durable` | fait | `src/levers/elevage-durable/methodology.md` |
| `fertilisation_azotee` | fait | `src/levers/fertilisation-azotee/methodology.md` |
| `haies` | fait | `src/levers/haies/methodology.md` |
| `occupation_des_sols` | fait | `src/levers/occupation-des-sols/methodology.md` |
| `pratiques_stockantes` | fait | `src/levers/pratiques-stockantes/methodology.md` |
| `produits_bois` | fait | `src/levers/produits-bois/methodology.md` |
| `reseaux_chaleur` | fait | `src/levers/reseaux-chaleur/methodology.md` |
| `residentiel_changement_systeme_chauffage` | fait (approximation SDES) | `src/levers/residentiel-changement-systeme-chauffage/methodology.md` |
| `residentiel_renovation` | fait (approximation SDES) | `src/levers/residentiel-renovation/methodology.md` |
| `residentiel_sobriete` | fait | `src/levers/residentiel-sobriete/methodology.md` |
| `transport_marchandises_efficacite` | fait | `src/levers/transport-marchandises-efficacite/methodology.md` |
| `transport_marchandises_electrification` | fait | `src/levers/transport-marchandises-electrification/methodology.md` |
| `transport_marchandises_report_modal` | fait | `src/levers/transport-marchandises-report-modal/methodology.md` |
| `transport_marchandises_sobriete_logistique` | fait | `src/levers/transport-marchandises-sobriete-logistique/methodology.md` |
| `transport_personnes_efficacite` | fait | `src/levers/transport-personnes-efficacite/methodology.md` |
| `transport_personnes_electrification` | fait | `src/levers/transport-personnes-electrification/methodology.md` |
| `transport_personnes_report_modal` | fait | `src/levers/transport-personnes-report-modal/methodology.md` |
| `transport_personnes_sobriete_deplacements` | fait | `src/levers/transport-personnes-sobriete-deplacements/methodology.md` |

Les fiches d'analyse (une par levier, figées) vivent hors de ce dépôt. Une question ouverte devient une hypothèse nommée avec son contournement dans `docs/methodology/assumptions.md` ; une formule corrigée par rapport au tableur est dans `docs/methodology/formula-corrections.md`.

## Règles à connaître avant de modifier

- Aucune valeur en `number` dans une formule : `BigNumber`, construit depuis un texte (`quantity`, `toBig`). Une opération `BigNumber` par expression, chaque composante nommée.
- Zéro commentaire, sauf `// Source :` au-dessus de chaque constante en majuscules, qui cite le document, la page ou la cellule. Un choix sans source le dit : « choix de conception, non validé ».
- Un levier ne s'importe que par son `index.ts`, qui n'expose que `estimate`, le schéma de sa requête et le type de son entrée. Un levier n'importe pas un autre levier.
- L'inconnu s'arrête à `src/estimator/` : la requête y est validée une seule fois (`parse-request.ts`). `estimate` d'un levier reçoit une requête déjà typée et ne valide rien.
- `calculate-*.ts` est pur : il reçoit des valeurs, jamais une source de données.
- Imports relatifs en `.ts`. Scripts en TypeScript, pas de Python.
- Une PR : un seul type de changement, un test rouge avant un correctif, une liste « À arbitrer » dans la description, reportée dans `docs/methodology/points-a-arbitrer.md` ; un test vérifie que chaque levier implémenté y est nommé, que sa ligne d'icônes (✅ ❓ ❌) reprend le registre `LEVERS` et que chaque niveau `not_computed` y a sa raison. Les choix, limites et errata d'un `methodology.md` y sont consolidés.

Le détail est dans `docs/methodology/conventions.md` (calcul, unités, données) et `docs/revue-de-code.md`.

## Ajouter un levier

1. Créer `src/levers/<id>/` avec `<id>-request.ts` (schéma `zod`), `calculate-<…>.ts`, `estimate.ts`, `index.ts` et les tests.
2. Brancher le levier dans `src/estimator/` : son schéma dans la `discriminatedUnion` de `parse-request.ts`, puis l'union `RequestInput` et le `match` de `estimate.ts`. Le compilateur refuse un levier oublié.
3. S'il lit des données : un dossier `data/<jeu>/` avec manifeste, sources versionnées et constructeur dans `src/dataset-builders/`. Se tester avec `createTemporaryCsvDataSource`.
4. Écrire `src/levers/<id>/methodology.md` : formule, entrées, constantes avec leur source, données, cas de test chiffrés, limites.
5. Reporter dans `docs/methodology/` les hypothèses nommées et les corrections de formule qui concernent le levier.
