# leviers-ges

Les formules du tableur ADEME PlanET V1 (21 leviers de décarbonation) sous forme de fonctions TypeScript. Une requête par levier, en retour les tonnes de CO2e évitées par an pour une région, un département ou un EPCI.

Les 21 leviers sont calculés à un niveau au moins.

Le paquet n'est pas publié (`private: true`). Node ≥ 24 et pnpm.

## Utilisation

```ts
import { createCsvDataSource, createEstimator } from './src/index.ts'

const estimate = createEstimator(createCsvDataSource('./data'))
```

`estimate` est la seule fonction à appeler, pour tous les leviers. Elle renvoie un `Result` de `neverthrow` : jamais d'exception.

### Un levier sans territoire

```ts
const result = estimate({
  id: 'haies',
  parameters: { hedgeKmCreatedPerYear: '100' },
})
```

`result.value.reduction.toFixed()` vaut `'117'` (tCO2e par an).

### Un levier par territoire

```ts
const result = estimate({
  id: 'transport_marchandises_report_modal',
  territory: { level: 'region', code: '84' },
  parameters: { roadToRailFraction: '0.1', roadToWaterwayFraction: '0.05' },
})
```

`result.value.reduction.toFixed()` vaut `'248249.26'`. `result.value.appliedAssumptions` liste les hypothèses appliquées, chacune avec sa valeur, sa source et sa limite. `result.value.status` vaut `no_open_question` (aucune question ouverte à ce niveau) ou `workaround` (niveau calculé par un contournement documenté dans `methodology.md`). `result.value.limits` liste les limites du levier (`limit`, `effect`), reprises du tableau « Limites » de son `methodology.md`. `result.value.datasets` liste les jeux de `data/` lus par le calcul, chacun avec sa source (périmètre compris), son millésime et sa date de récupération, tels que le manifeste les donne.

### Un niveau non calculé

```ts
const result = estimate({
  id: 'transport_marchandises_efficacite',
  territory: { level: 'epci', code: '200046977' },
  parameters: { ecodrivingApplicationFraction: '0.1', loadFactorIncrease: '0.1' },
})
```

`result.error` vaut `{ kind: 'level_not_computed', lever: 'transport_marchandises_efficacite', level: 'epci' }`.

### Une requête invalide

```ts
const result = estimate({ id: 'haies', parameters: { hedgeKmCreatedPerYear: 'abc' } })
```

`result.error` vaut `{ kind: 'invalid_request', issues: [{ parameter: 'parameters.hedgeKmCreatedPerYear', message: 'must be a decimal number' }] }`.

## Règles de la requête

- `id` : l'identifiant du levier. `territory` : `{ level: 'region' | 'departement' | 'epci', code }`, absent pour `haies` et `pratiques_stockantes`.
- `territory.code` : texte (`'84'`, `'69'`, `'2A'`, SIREN de l'EPCI `'200046977'`).
- Types et bornes des valeurs : voir « Types et bornes » plus bas.
- Un schéma refuse toute clé inconnue : `wasteReductionFraction` n'existe pas, `dechets_sobriete` prend `storageReductionFraction` et `incinerationReductionFraction`.
- `reduction` est un `BigNumber` arrondi à deux décimales.
- `level_not_computed`, `missing_data` (territoire sans donnée, par exemple l'outre-mer) et `invalid_request` sont les erreurs de l'estimation. Les types sont exportés (`EstimationError`, `DataSourceError`).

## Les leviers

Le détail d'un levier (formule, constantes sourcées, données, limites, cas de test) est dans son `src/levers/<dossier>/methodology.md`.

| `id` | Niveaux calculés |
|---|---|
| `batiments_machines_agricoles`, `reseaux_chaleur`, `dechets_mode_de_traitement`, `dechets_sobriete`, `produits_bois`, `fertilisation_azotee` | région, département, EPCI |
| `transport_personnes_sobriete_deplacements`, `transport_personnes_report_modal`, `transport_personnes_efficacite`, `transport_personnes_electrification` | région, département, EPCI |
| `elevage_durable` | région, département |
| `residentiel_sobriete`, `residentiel_changement_systeme_chauffage`, `residentiel_renovation` | région, département, EPCI (hors outre-mer) |
| `occupation_des_sols` | région, département, EPCI |
| `transport_marchandises_sobriete_logistique`, `transport_marchandises_report_modal`, `transport_marchandises_efficacite`, `transport_marchandises_electrification` | région |
| `haies`, `pratiques_stockantes` | sans territoire |

Tous les paramètres sont de la forme `parameters: { … }`. Une « fraction » va de 0 à 1 (`'0.1'` = 10 %). Un paramètre est obligatoire sauf mention « facultatif ».

## Référence des paramètres

### Types et bornes

Toute valeur numérique se passe en texte décimal (`'0.1'`, `'-2'`) ou en nombre fini. Sont refusés : l'écriture scientifique (`'1e2'`), la virgule (`'1,5'`), les espaces, le vide, `NaN` et `Infinity`. Le type d'un paramètre est l'un de ceux-ci :

| Type | Bornes | Exemple |
|---|---|---|
| fraction | de 0 à 1 inclus | `'0.1'` pour 10 % |
| variation relative | aucune (négative admise) | `'-0.1'` pour −10 % |
| variation relative positive | 0 ou plus, sans plafond | `'0.2'` pour +20 % |
| kilomètres | aucune (négatif admis) | `'100'` |
| tonnes.kilomètres | 0 ou plus | `'5000000'` |
| répartition | quatre fractions dont la somme vaut exactement 1 | voir l'élevage |

### Agriculture et bois

| `id` | Paramètre | Type | Sens |
|---|---|---|---|
| `batiments_machines_agricoles` | `electricityReductionFraction`, `naturalGasReductionFraction`, `petroleumProductsReductionFraction`, `heatReductionFraction` | fraction | baisse de chaque vecteur d'énergie. Les quatre sont obligatoires : un vecteur qu'on ne réduit pas se saisit à `'0'` |
| `fertilisation_azotee` | `nitrogenReductionFraction` | fraction | baisse de la masse d'azote livrée |
| `haies` | `hedgeKmCreatedPerYear` | kilomètres | haies créées par an ; négatif = arrachage net, réduction négative |
| `pratiques_stockantes` | `intermediateCropsHectares`, `permanentVineyardGrassingHectares`, `winterIntercropVineyardHectares`, `agroforestryHectares`, `temporaryGrasslandExtensionHectares` | hectares, à partir de 0 | surface d'application de chaque pratique stockante. Les cinq sont obligatoires : une pratique non appliquée se saisit à `'0'` |
| `occupation_des_sols` | `afforestationHectaresPerYear`, `wetlandDevelopmentHectaresPerYear`, `desealingHectaresPerYear`, `horizonYears` | hectares par an, années | rythmes d'afforestation (prairies), de développement de zones humides (prairies et cultures) et de désimperméabilisation (sols artificiels), non négatifs ; horizon de temps en années, strictement positif |
| `produits_bois` | `woodProductionIncrease` | variation relative | variation de la production de produits bois, une seule valeur pour le bois d'œuvre et le bois d'industrie ; une valeur supérieure à 1 est admise |

### Élevage durable

`parameters.animals` associe à chaque type d'animal que la requête change un objet de trois champs. Au moins un type est obligatoire ; un type absent ne change pas et n'apporte rien.

| Champ | Type | Sens |
|---|---|---|
| `headcountReductionFraction` | fraction | cheptel en moins (obligatoire) |
| `entericEmissionReductionFraction` | fraction | baisse du facteur de fermentation entérique (facultatif, `'0'` par défaut) |
| `targetManureShares` | répartition | répartition visée des déjections : `liquid` (lisier), `solid` (fumier), `pasture` (pâture), `anaerobicDigestion` (méthanisation), chacune une fraction, somme exactement égale à 1 (obligatoire) |

Les onze types, avec la répartition actuelle supposée par le tableur (lisier / fumier / pâture, méthanisation à 0) :

| Type | Animal | Lisier | Fumier | Pâture | Lisier admis | Méthanisation admise |
|---|---|---|---|---|---|---|
| `dairyCows` | vaches laitières | 41 % | 20 % | 39 % | oui | oui |
| `otherCattle` | autres bovins | 27 % | 30 % | 43 % | oui | oui |
| `sows` | truies | 88 % | 10 % | 2 % | oui | oui |
| `otherPigs` | autres porcins | 93 % | 6 % | 1 % | oui | oui |
| `goats` | caprins | 0 % | 88 % | 12 % | non | non |
| `sheep` | ovins | 0 % | 26 % | 74 % | non | non |
| `horses` | chevaux | 0 % | 42 % | 58 % | non | non |
| `mulesAndDonkeys` | mules et ânes | 0 % | 42 % | 58 % | non | non |
| `layingHens` | poules pondeuses | 3 % | 90 % | 7 % | oui | non |
| `broilers` | poulets | 3 % | 90 % | 7 % | oui | non |
| `otherPoultry` | autres volailles | 3 % | 90 % | 7 % | oui | non |

Une répartition qui met du lisier sur un type « non », ou de la méthanisation hors bovins et porcins, est refusée.

```ts
const result = estimate({
  id: 'elevage_durable',
  territory: { level: 'region', code: '53' },
  parameters: {
    animals: {
      dairyCows: {
        headcountReductionFraction: '0.1',
        entericEmissionReductionFraction: '0.05',
        targetManureShares: { liquid: '0.2', solid: '0.3', pasture: '0.4', anaerobicDigestion: '0.1' },
      },
      sheep: {
        headcountReductionFraction: '0.2',
        targetManureShares: { liquid: '0', solid: '0.26', pasture: '0.74', anaerobicDigestion: '0' },
      },
    },
  },
})
```

`result.value.reduction.toFixed()` vaut `'747377.9'`. Un lisier sur des caprins donne `{ kind: 'invalid_request', issues: [{ parameter: 'parameters.animals.goats.targetManureShares.liquid', message: 'liquid manure is not an available management mode for goats' }] }`.

### Résidentiel et réseaux de chaleur

| `id` | Paramètre | Type | Sens |
|---|---|---|---|
| `residentiel_sobriete` | `householdsApplyingSobrietyFraction` | fraction | ménages qui appliquent la sobriété |
| | `consumptionReductionFraction` | fraction | baisse de leur consommation (pas de valeur par défaut) |
| `residentiel_renovation` | `renovatedParcFraction` | fraction | part du parc de logements rénovée (maisons et appartements d'avant 1971 ; la même pour tous) |
| `residentiel_changement_systeme_chauffage` | `targetElectricityShareFraction`, `targetNaturalGasShareFraction`, `targetFuelOilShareFraction`, `targetWoodShareFraction`, `targetHeatNetworkShareFraction` | fraction, facultatif | part cible de chaque vecteur dans l'énergie utile de chauffage et d'ECS ; une part non précisée garde sa proportion actuelle et partage ce que les autres laissent (sans aucune part, la cible est le mix actuel) ; les parts données ne dépassent pas 100 % et, les cinq données, font 100 % ; le GPL n'est pas modifié |
| `reseaux_chaleur` | `emissionFactorReductionFraction` | fraction | baisse du facteur d'émission des réseaux ; au-delà de 1 la requête est refusée |

### Transport de personnes

`railShareFraction` (fraction, facultatif) est la part du ferré dans le transport en commun. Sans lui, 82 % en Île-de-France et 24 % ailleurs, valeur renvoyée dans `appliedAssumptions.railShare`.

| `id` | Paramètre | Type | Sens |
|---|---|---|---|
| `transport_personnes_sobriete_deplacements` | `commutingDistanceReductionFraction` | fraction | baisse des distances domicile-travail (voiture et transport en commun) |
| | `railShareFraction` | fraction, facultatif | |
| `transport_personnes_report_modal` | `carToPublicTransportFraction` | fraction | passagers.km en voiture reportés vers le transport en commun |
| | `carToActiveModesFraction` | fraction | passagers.km en voiture reportés vers les modes actifs ; la somme des deux reports depuis la voiture ne dépasse pas 1 |
| | `publicTransportToActiveModesFraction` | fraction | passagers.km en transport en commun reportés vers les modes actifs |
| | `railShareFraction` | fraction, facultatif | |
| `transport_personnes_efficacite` | `carEcodrivingApplicationFraction`, `busEcodrivingApplicationFraction` | fraction | part d'application de l'écoconduite (voitures, bus et cars) |
| | `carPassengerIncrease`, `busPassengerIncrease` | variation relative positive | hausse du nombre de passagers par véhicule |
| | `railShareFraction` | fraction, facultatif | |
| `transport_personnes_electrification` | `carElectrificationFraction` | fraction | parc de voitures à électrifier ; plafonnée à la part thermique du parc, valeur renvoyée dans `appliedAssumptions` quand le plafond joue |
| | `busElectrificationFraction` | fraction | idem pour le parc de bus et cars |
| | `railShareFraction` | fraction, facultatif | |

### Transport de marchandises

| `id` | Paramètre | Type | Sens |
|---|---|---|---|
| `transport_marchandises_sobriete_logistique` | `roadFreightReductionFraction` | fraction | baisse des tonnes.kilomètres routières |
| `transport_marchandises_report_modal` | `roadToRailFraction`, `roadToWaterwayFraction` | fraction | t.km routières reportées vers le ferroviaire et le fluvial ; la somme ne dépasse pas 1 |
| | `cyclologisticTonneKilometres` | tonnes.kilomètres, facultatif | t.km reportées vers la cyclologistique (`'0'` par défaut) |
| `transport_marchandises_efficacite` | `ecodrivingApplicationFraction` | fraction | part d'application de l'écoconduite |
| | `loadFactorIncrease` | variation relative positive | hausse du chargement |
| `transport_marchandises_electrification` | `additionalElectrifiedFleetFraction` | fraction | points de parc de poids lourds électrifiés en plus ; plafonnée à la part thermique du parc de la région |

### Déchets

| `id` | Paramètre | Type | Sens |
|---|---|---|---|
| `dechets_mode_de_traitement` | `storageToIncinerationFraction` | fraction | tonnes stockées envoyées vers l'incinération |
| | `storageToMaterialRecoveryFraction` | fraction | tonnes stockées envoyées vers la valorisation ; la somme des deux ne dépasse pas 1 |
| | `incinerationToMaterialRecoveryFraction` | fraction | tonnes incinérées avec récupération envoyées vers la valorisation |
| `dechets_sobriete` | `storageReductionFraction` | fraction | baisse des tonnes stockées |
| | `incinerationReductionFraction` | fraction | baisse des tonnes incinérées avec récupération |

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint, dont les règles de calcul scientifique et de couches |
| `pnpm test:coverage` | vitest, seuil de 100 % sur `src/` |
| `pnpm build` | `dist/` |
| `pnpm build:data:<jeu>` | reconstruit un jeu de `data/` depuis ses sources versionnées |

## Pour aller plus loin

- `AGENTS.md` : l'architecture, les règles de code et comment ajouter un levier.
- `docs/methodology/` : conventions de calcul, hypothèses nommées, corrections de formule, `points-a-arbitrer.md` (état de chaque levier par niveau, ce qui débloquerait les niveaux non calculés et ce qui affinerait les calculs).
