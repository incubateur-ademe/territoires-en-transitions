# Transport de personnes, report modal

Identifiant : `transport_personnes_report_modal`. Niveaux : région, département et EPCI. Une hypothèse nommée de `docs/methodology/assumptions.md` s'applique (`railElectricityUpstreamShare`) ; les valeurs par défaut que le calcul applique sont renvoyées dans `appliedAssumptions`, avec leur source et leur limite. Métropole seule : l'outre-mer est absent des données et renvoie `missing_data`.

## Formule

```
Émissions évitées (tCO2e/an) =
  PK_voiture × 52,14 ÷ 1 000
  × ( r_TC × (FE_voiture − FE_TC) + r_actifs × (FE_voiture − 0) )
  + PK_TC × 52,14 ÷ 1 000 × r_TC→actifs × (FE_TC − 0)

FE_voiture = facteur du parc de voitures ÷ 1,4
FE_TC = part du ferré × FE_ferré + (1 − part du ferré) × facteur du parc de bus ÷ 10
```

| Terme | Sens | Unité |
|---|---|---|
| `r_TC` | « Pourcentage de report modal de la voiture vers les transports en commun (proportion des km en voiture) », saisi | fraction des passagers.km en voiture |
| `r_actifs` | « Pourcentage de report modal de la voiture vers les modes actifs », saisi ; leur facteur est nul | fraction des passagers.km en voiture |
| `r_TC→actifs` | report modal des transports en commun vers les modes actifs, saisi ; leur facteur est nul | fraction des passagers.km en transport en commun |
| `PK_TC` | passagers.km hebdomadaires domicile-travail en transport en commun, 50 % côté résidence et 50 % côté travail | passagers.km par semaine |
| `PK_voiture` | passagers.km hebdomadaires domicile-travail en voiture, 50 % côté résidence et 50 % côté travail | passagers.km par semaine |
| `FE_voiture` | facteur du parc de voitures par passager.km | kgCO2e par passager.km |
| `FE_TC` | facteur du transport en commun, moyenne pondérée du ferré et du bus | kgCO2e par passager.km |
| `FE_ferré` | 0,0154346 (0,0229 × 67,4 %) en France continentale, 0,187 en Corse | kgCO2e par passager.km |
| part du ferré | part des passagers.km de transport en commun en ferré, saisie ou par défaut | fraction |

La formule est lue dans les formes de la feuille `TrsptPers_ReportModal` ; la cellule « Formule » ne contient que « Réduction GES = ». L'écart de la correction 1 de `docs/methodology/formula-corrections.md` s'applique : le facteur est divisé par le taux de remplissage, il n'est pas multiplié. La dernière ligne, dessinée hors de l'accolade avec les passagers.km en voiture, est lue comme le report des transports en commun vers les modes actifs, sur les passagers.km en transport en commun, comme l'indique Laurent (CGDD) : « la première boîte devrait être les passagers.km parcourus en TC ».

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `carToPublicTransportFraction` | fraction des passagers.km en voiture | 0 à 1 |
| `carToActiveModesFraction` | fraction des passagers.km en voiture | 0 à 1 |
| `publicTransportToActiveModesFraction` | fraction des passagers.km en transport en commun | 0 à 1 |
| `railShareFraction` | fraction | 0 à 1, facultative |

Les trois reports sont obligatoires. Les deux reports depuis la voiture ne dépassent pas 1 ensemble, celui des transports en commun vers les modes actifs porte sur une autre base et ne s'y ajoute pas : le tableur dit « Le report modal total doit être inférieur à 100% » (`ParametreDeterminants`, lignes 34 et 35). La requête est refusée sinon ; une somme égale à 100 % est acceptée (le tableur dit « inférieur », strict ou large n'est pas tranché).

## Constantes

| Constante | Valeur | Source |
|---|---|---|
| Semaines par an | 52,14 | formule dessinée dans les formes de la feuille |
| Taux de remplissage des voitures | 1,4 passager | Base Carbone (documentation générale v23.11, p. 173) : courte distance, ENTD 2008 ; documentation fonctionnelle PlanET, pp. 58 et 60 ; le tableur donne 1,165 (`DonneesReference!D26`), la documentation l'emporte |
| Taux de remplissage des bus | 10 passagers | `DonneesReference!D28` |
| Facteur du ferré, France continentale | 0,0154346 kgCO2e/passager.km | `DonneesReference!D37` et G37 ; Base Empreinte, TER 2022 (élément 43255) : amont de l'électricité 0,0229 × 67,4 % (documentation fonctionnelle PlanET, p. 65), fabrication (0,00479) non comptée, poste combustion nul |
| Facteur du ferré, Corse | 0,187 kgCO2e/passager.km | Base Empreinte, train de voyageurs de Corse |
| Part du ferré par défaut | 82 % en Île-de-France, 24 % ailleurs | `ParametreDeterminants` ligne 38 (le tableur donne 84 % et 23 % en 2023, à titre indicatif) ; SDES, Bilan annuel des transports 2024 |

## Données

Les jeux `transport-personnes/regions`, `departements` et `epcis` du levier d'efficacité : passagers.km en voiture, facteurs d'émission du parc de voitures et de bus. Le levier lit aussi les passagers.km de transport en commun, pour le report des transports en commun vers les modes actifs ; le report de la voiture ajoute des voyageurs au réseau existant sans modifier cette base.

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Le facteur du ferré est l'amont de l'électricité × 67,4 %, sans la fabrication | hypothèse nommée `railElectricityUpstreamShare`, résolue par la documentation fonctionnelle (p. 65) ; le tableur disait « une partie du poste amont à déterminer » ; renvoyé dans `appliedAssumptions.railEmissionFactor` |
| 2 | Un territoire dont toutes les communes sont en Corse prend le facteur corse, les autres le facteur continental | `DonneesReference!D37` ; un territoire à cheval sur la Corse et une autre région, ou sans commune connue, prend le facteur continental : choix de conception, non validé |
| 3 | La dernière ligne dessinée est le report des transports en commun vers les modes actifs, sur les passagers.km en transport en commun | réponse de Laurent (CGDD) au document du 29 octobre 2026 ; le tableur et la documentation fonctionnelle (p. 60) la dessinent avec les passagers.km en voiture |
| 4 | Le report des transports en commun vers les modes actifs porte sur les passagers.km en transport en commun initiaux, sans enchaîner avec le report de la voiture vers les transports en commun | choix de conception, non validé |
| 5 | Un seul facteur de bus : la moyenne du parc, en kgCO2e par véhicule.km ÷ 10, sans distinguer diesel, gaz et électrique | cohérent avec le levier d'efficacité |
| 6 | Le facteur du transport en commun pondère le ferré et le bus avec la part du ferré, la même qui sert à l'efficacité | `ParametreDeterminants` ligne 38 ; part par défaut renvoyée dans `appliedAssumptions.railShare` |
| 7 | Le résultat peut être négatif si le transport en commun émet plus que la voiture : en Corse, dès que la part du ferré saisie dépasse 33,8 % (région 94, 100 % vers les transports en commun et 100 % de ferré : −37 359,43 tCO2e) | aucune borne dans le tableur ; aucune alerte renvoyée |
| 8 | Les passagers.km comptent pour moitié côté résidence et pour moitié côté travail | `TrsptPers_ReportModal!B13` |

## Cas de test chiffrés

| Entrée | Résultat |
|---|---|
| voitures seules, 1 000 passagers.km par semaine à 0,1 kgCO2e/passager.km, tout vers les modes actifs | 4,338793 tCO2e |
| idem, tout vers les transports en commun, 60 % de ferré à 0,02 et bus à 0,08 | 2,044633 tCO2e |
| idem, moitié vers chaque | 3,191713 tCO2e |
| transport en commun plus émetteur que la voiture (0,0233 contre 0,08), tout reporté | −3,303441 tCO2e |
| 1 000 passagers.km par semaine en transport en commun à 0,044 kgCO2e/passager.km, tous reportés vers les modes actifs | 2,29416 tCO2e |
| région 84, jeu de test, 10 % vers les transports en commun et 5 % vers les modes actifs | 314,49 tCO2e |
| région 11, jeu de test | 509,75 tCO2e |
| région 94, jeu de test, ferré corse | 99,8 tCO2e |
| région 84, données réelles | 160 112,86 tCO2e |
| région 53 (Bretagne) | 76 633,85 tCO2e |
| région 11 (Île-de-France) | 192 241,31 tCO2e |
| région 94 (Corse) | 3 596,96 tCO2e |
| département 69 | 31 540,35 tCO2e |
| département 75 | 15 358,91 tCO2e |
| département 2A | 1 684,01 tCO2e |
| EPCI 200046977 | 20 926,73 tCO2e |
| région 84, données réelles, 60 % de ferré saisi | 191 896,56 tCO2e |
| région 84, données réelles, 20 % des passagers.km de transport en commun reportés en plus | 180 824,85 tCO2e |
| région 11, données réelles, 20 % des passagers.km de transport en commun reportés en plus | 254 048,11 tCO2e |

Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Limites

| Limite | Effet |
|---|---|
| Hexagone et moins de 100 km | mêmes limites que le levier d'efficacité : millésime 2022, DOM absents |
| Domicile-travail seul | les autres motifs de déplacement ne sont pas comptés ; `DonneesReference!D27`, le taux de remplissage des autres trajets, n'est pas utilisé |
| Capacité du réseau | le report n'ajoute pas de véhicule-km : aucun effet de saturation du transport en commun ni d'offre supplémentaire |
| Combustion du ferré continental | nulle dans la Base Empreinte (TER 2022, élément 43255) alors que le TER moyen compte des TER diesel ; la documentation fonctionnelle reconnaît cette limite (p. 58) : si leur combustion comptait, le facteur continental monterait et le gain du report vers les transports en commun baisserait |
| Un seul facteur pour tout le ferré | un territoire avec métro ou tram a son propre facteur, souvent plus bas |
| Part du ferré par défaut | une valeur par groupe de régions, voir le levier d'efficacité |
| Distance des trajets reportés | les modes actifs ne couvrent pas les mêmes distances que la voiture : la fraction porte sur les passagers.km, pas sur les trajets |
| Facteur des voitures | facteur du parc, pas celui du trajet |
