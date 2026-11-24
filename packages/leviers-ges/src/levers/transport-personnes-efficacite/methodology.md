# Transport de personnes, efficacité énergétique

Identifiant : `transport_personnes_efficacite`. Niveaux : région, département et EPCI. Aucune question ouverte côté ADEME ; les interprétations ci-dessous sont encodées dans les données et le code, et chacune est listée dans « Choix faits ». Les valeurs par défaut et les exclusions que le calcul applique sont renvoyées dans `appliedAssumptions`, avec leur source et leur limite. Métropole seule : l'outre-mer est absent des données et renvoie `missing_data`.

## Formule

```
baisse_m = 1 − 1 / (1 + p_m) × (1 − a_m × 10 %)

Émissions évitées (tCO2e/an) = Σ_m  baisse_m × PK_m × 52,14 × FE_m ÷ T_m ÷ 1 000

m : voiture, bus et car
PK_voiture = passagers.km hebdomadaires domicile-travail en voiture
PK_bus = passagers.km hebdomadaires en transport en commun × (1 − part du ferré)
```

| Terme | Sens | Unité |
|---|---|---|
| `a_m` | « % Application de l'éco conduite voyageurs », saisi, entre 0 et 1 | fraction |
| `p_m` | « % Augmentation nombre de voyageurs par véhicule », saisi, 0 ou plus | variation relative |
| `PK_m` | passagers.km hebdomadaires du mode, 50 % côté résidence et 50 % côté travail | passagers.km par semaine |
| `FE_m` | facteur d'émission moyen du parc du mode | kgCO2e par véhicule.km |
| `T_m` | taux de remplissage : 1,4 passager par voiture, 10 par bus | passagers par véhicule |
| part du ferré | part des passagers.km de transport en commun en ferré, saisie ou par défaut | fraction |

Le tableur ne fournit pas la cellule « Formule » (elle ne contient que « Réduction GES = ») : la formule est lue dans les formes de la feuille `TrsptPers_Efficacité`. Deux écarts avec le dessin sont corrigés, voir `docs/methodology/formula-corrections.md` : le facteur est divisé par le taux de remplissage (correction 1), et les deux gains se multiplient au lieu de s'additionner (correction 2).

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `carEcodrivingApplicationFraction` | fraction | 0 à 1 |
| `busEcodrivingApplicationFraction` | fraction | 0 à 1 |
| `carPassengerIncrease` | variation relative | 0 ou plus |
| `busPassengerIncrease` | variation relative | 0 ou plus |
| `railShareFraction` | fraction | 0 à 1, facultative |

Les quatre premières sont obligatoires : le tableur les laisse vides, et la colonne « valeur de référence de la SNBC 3 » est vide. La part du ferré est facultative (voir choix 5).

## Constantes

| Constante | Valeur | Source |
|---|---|---|
| Semaines par an | 52,14 | formule dessinée dans les formes de la feuille `TrsptPers_Efficacité` |
| Potentiel de baisse par écoconduite | 10 % | documentation fonctionnelle, 7.3.4.3 (p. 61) : identique pour les TC routiers et les VP, 10 % par défaut (enquête IPSOS) ; le tableur donne « ~15% » (`DonneesReference!D29`), la documentation l'emporte ; valeur confirmée par l'équipe le 2026-11-19 |
| Taux de remplissage des voitures | 1,4 passager | Base Carbone (documentation générale v23.11, p. 173) : courte distance, ENTD 2008 ; documentation fonctionnelle PlanET, pp. 58 et 60 ; le tableur donne 1,165 (`DonneesReference!D26`, SDES, motif « Professionnel »), la documentation l'emporte |
| Taux de remplissage des bus | 10 passagers | `DonneesReference!D28` |
| Part du ferré par défaut | 82 % en Île-de-France, 24 % ailleurs | SDES, Bilan annuel des transports 2024, figures F1-4 et F2-1 |

## Données

| Jeu | Contenu | Niveau |
|---|---|---|
| `transport-personnes/regions` | passagers.km par semaine, facteurs d'émission du parc, parts exclues, véhicules classés | région |
| `transport-personnes/departements` | idem | département |
| `transport-personnes/epcis` | idem | EPCI |

Construction des jeux : `pnpm build:data:transport-personnes`, depuis les deux sources versionnées de `data/transport-personnes/sources/` (trajets Insee-SDES 2022 et parc SDES 2025). Le détail des colonnes est dans `data/transport-personnes/manifest.json`.

La part du ferré par défaut dépend de la région : un territoire dont toutes les communes sont en Île-de-France (code région 11) prend 82 %, les autres 24 %.

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Un seul potentiel d'écoconduite, 10 %, pour les voitures et pour les bus et cars | la documentation (p. 61) donne une valeur identique pour les TC routiers et les VP, le tableur une seule (`DonneesReference!D29`) pour deux paramètres |
| 2 | Facteur du bus : la valeur basse de OMINEA 2024 (0,0805 kgCO2e/passager.km pour le diesel) contre 0,0874 pour Base Empreinte | choix de conception, non validé ; renvoyé dans `appliedAssumptions.busEmissionFactor` |
| 3 | Les carburants sans facteur sont exclus de la moyenne du parc : « autre » pour les voitures, « essence » et « autre » pour les bus | la part exclue est renvoyée dans `carFleetUnclassifiedShare` et `busFleetUnclassifiedShare` quand elle n'est pas nulle |
| 4 | Un territoire sans voiture ou sans bus classé prend la moyenne nationale | renvoyé dans `nationalCarEmissionFactor` et `nationalBusEmissionFactor` |
| 5 | La part du ferré a une valeur par défaut, 82 % en Île-de-France et 24 % ailleurs | le tableur la donne à titre indicatif seulement (84 % et 23 % en 2023, `TrsptPers_Efficacité!G23`) ; renvoyée dans `appliedAssumptions.railShare` quand elle n'est pas saisie |
| 6 | Passagers.km du transport en commun routier = transport en commun × (1 − part du ferré) | `DonneesTerritoires!D14` |
| 7 | Les passagers.km comptent pour moitié côté résidence et pour moitié côté travail | `TrsptPers_SobriétéDéplacements!B13` |
| 8 | Les facteurs d'émission des voitures viennent d'un calcul d'essai sur OMINEA v23.1, non reproduit dans le dépôt | voir la PR des données ; essence 171,1, diesel 163,6, gaz 231,5, électrique 13,345 g/véh.km |
| 9 | Les hausses de passagers n'ont pas de plafond | le tableur n'en pose pas |

## Cas de test chiffrés

| Entrée | Résultat |
|---|---|
| voitures seules, 1 000 passagers.km par semaine à 0,083214285714285714285714285714 kgCO2e/passager.km, écoconduite à 100 % | 0,433879 tCO2e |
| idem, écoconduite à 50 % et 10 % de passagers en plus | 0,591654 tCO2e (baisse de 13,6 %, 14,1 % si les gains s'additionnaient) |
| voitures seules, écoconduite à 0 % et 100 % de passagers en plus | 2,169396 tCO2e |
| bus seuls, 1 000 passagers.km par semaine dont 60 % en ferré, 0,8 kgCO2e/véh.km, écoconduite à 100 % | 0,166848 tCO2e |
| idem, écoconduite à 50 % et 20 % de passagers en plus | 0,3476 tCO2e |
| tout le transport en commun en ferré | 0 tCO2e |
| région 84, jeu de test, hors Île-de-France | 750,89 tCO2e |
| région 84, jeu de test, voiture à 100 % et +10 %, bus à 50 % et +20 % | 1 449,31 tCO2e |
| région 11, jeu de test, Île-de-France | 508,96 tCO2e |
| région 84, données réelles, 100 % d'écoconduite | 175 864,6 tCO2e |
| région 53 (Bretagne) | 81 921,01 tCO2e |
| région 11 (Île-de-France) | 166 551,32 tCO2e |
| département 69 | 37 017,5 tCO2e |
| département 75 | 16 793,87 tCO2e |
| EPCI 200046977 | 25 367,61 tCO2e |
| région 84, 50 % d'écoconduite et 10 % de passagers en plus | 239 815,36 tCO2e |

Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Limites

| Limite | Effet |
|---|---|
| Hexagone et moins de 100 km | 772 644 actifs métropolitains qui se déplacent sont hors champ de la base, ainsi que les DOM ; millésime 2022, « Annuelle sans garantie » |
| Potentiel d'écoconduite | une moyenne (10 %) : le résultat lui est proportionnel ; la documentation cite jusqu'à 23 % pour une berline compacte essence |
| Deux-roues motorisés | sans terme : 1,4 % des passagers.km ; hors périmètre selon la documentation fonctionnelle (p. 58) |
| Parc de bus et cars immatriculé au siège | trois communes portent 17,7 % du parc métropolitain ; 276 des 1 243 EPCI n'ont aucun bus ni car classé et 11 aucune voiture : ils prennent la moyenne nationale |
| Part du ferré par défaut | une valeur par groupe de régions : un territoire avec un grand métro hors Île-de-France (Lyon, Marseille, Lille) a une part ferrée plus haute, et ses bus sont surévalués |
| Territoire à cheval ou commune sans région | un territoire dont les communes ne sont pas toutes en Île-de-France prend 24 %, y compris un EPCI à cheval sur l'Île-de-France et une autre région (l'EPCI 247800550 : 32 communes en région 11 et 4 en région 24, il prend 24 % alors que 89 % de ses communes sont franciliennes) |
| Facteur des voitures | les voitures sont comptées avec le facteur du parc, pas celui du trajet |
| Outre-mer | absent des données |

## Errata à remonter à l'ADEME

| Constat | Cellule |
|---|---|
| Le texte dit que la baisse totale est une somme, le dessin la calcule comme un produit | `TrsptPers_Efficacité!B13` |
| Le dessin multiplie les FE par le taux de remplissage ; la cellule des onglets voisins dit de diviser | `TrsptPers_SobriétéDéplacements!B15` |
| Deux paramètres distincts portent la même abréviation, « % Application de l'éco conduite voyageurs » (voitures, conducteurs de transport en commun) ; de même « % Augmentation nombre de voyageurs par véhicule » | `ParametreDeterminants!B30:B33` |
| La formule a deux potentiels d'écoconduite ; une seule ligne, dont la valeur est dans la colonne des commentaires | `DonneesReference!D29` |
| La ligne « Taux de remplissage moyen des VP autres trajets » est listée et la formule ne l'utilise pas | `TrsptPers_Efficacité!A37` |
