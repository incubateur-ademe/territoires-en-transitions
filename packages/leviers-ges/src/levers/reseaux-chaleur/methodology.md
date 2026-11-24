# Décarbonation des réseaux de chaleur

Identifiant : `reseaux_chaleur`. Niveaux : région, département, EPCI. Aucune question ouverte ; les interprétations ci-dessous sont encodées dans les données.

## Formule

```
Émissions évitées (tCO2e/an) = p × Σ_réseau  FE_réseau × Q_réseau
```

| Terme | Sens | Unité |
|---|---|---|
| `p` | « % réduction du facteur d'émission du réseau de chaleur », saisi, entre 0 et 1 | fraction |
| `FE_réseau` | contenu CO2 du réseau, hors ACV | kgCO2e/kWh |
| `Q_réseau` | livraisons annuelles du réseau | MWh |

`FE (kg/kWh) × Q (MWh) × 1 000 kWh/MWh ÷ 1 000 kg/t` : le produit `FE × Q` est déjà en tonnes. La somme porte sur les réseaux dont la commune d'implantation est dans le territoire.

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `emissionFactorReductionFraction` | fraction | 0 à 1 ; au-delà de 1 le facteur deviendrait négatif, la requête est refusée |

Aucune constante : les facteurs d'émission sont des données.

## Données

`data/reseaux-chaleur/networks.csv`, construit par `pnpm build:data:reseaux-chaleur` (`src/dataset-builders/reseaux-chaleur/`) à partir des deux sources versionnées dans `data/reseaux-chaleur/sources/`, dont les empreintes sont dans le manifeste : 852 réseaux.

| Choix | Détail |
|---|---|
| Livraisons | SDES, jeu communal « Données locales de consommation de chaleur et de froid », colonne `CONSOTOT`, année 2024, à la place de la bibliothèque FEDENE que cite le tableur (`DonneesTerritoires!G29`, derrière un formulaire) |
| Réseaux | tous ceux du fichier, chaleur et froid (27 réseaux de froid, 418 577,63 MWh, hors réseaux sous secret), car `DonneesTerritoires!A29` dit « Livraisons de chaleur (et froid) » |
| Territoire d'un réseau | sa commune d'implantation, comme le SDES ; un réseau est imputé tout entier à ce territoire, même s'il dessert d'autres communes |
| Arrondissements | un réseau rattaché à un arrondissement de Paris (75101 à 75120), Lyon (69381 à 69389) ou Marseille (13201 à 13216) est rapporté à la commune (75056, 69123, 13055), comme les autres jeux du projet. Sans cela, le réseau parisien 7501C (3 783 313 MWh) serait dans aucun territoire |
| Facteur | contenu CO2 non ACV de France Chaleur Urbaine (`DonneesReference!K51` : « Ne pas prendre la donnée ACV ») ; repli sur le contenu CO2 du SDES pour les 4 réseaux de chaleur absents de France Chaleur Urbaine ou sans valeur |
| Unité du facteur | kg par kWh (le tableur écrit « g éq. CO2/kWh », voir `formula-corrections.md`) |
| Secret | les 140 réseaux dont les livraisons valent « secret » sont exclus |

Total de contrôle du manifeste : 27 733 931,728493 MWh sur les 852 réseaux.

## Cas de test

| Entrée | Résultat |
|---|---|
| 1 000 MWh à 0,1 kgCO2e/kWh, `p` = 0,5 | 50 tCO2e |
| 1 000 MWh à 0,1 et 2 000 MWh à 0,05, `p` = 1 | 200 tCO2e |
| `p` = 0 | 0 |
| national à 100 %, 851 réseaux de commune connue | 2 335 479,16 tCO2e |
| région 84 (Auvergne-Rhône-Alpes), 100 % | 249 184,94 tCO2e |
| région 11 (Île-de-France), 100 % | 1 209 445,92 tCO2e |
| département 75 (Paris), 100 % | 564 296,56 tCO2e |
| Métropole du Grand Paris (EPCI 200054781), 100 % | 943 808,57 tCO2e |
| chacun des 26 codes région, 109 départements et 1 255 EPCI | somme de ses réseaux, calculée à part sans l'index des territoires |
| somme des estimations par niveau | national, à 0,005 t près par territoire |

Le facteur moyen pondéré par les livraisons est de 0,0842 kgCO2e/kWh sur les 852 réseaux.

## Limites

| Limite | Effet chiffré |
|---|---|
| Réseau dont la commune est absente de la géographie actuelle | 1 réseau, 2515C à Goux-les-Usiers (25282, commune fusionnée), facteur nul : aucun effet |
| Livraisons sous secret | 140 réseaux exclus (1,4 % de la production de chaleur) |
| Deux sources de contenu CO2 | pour 259 réseaux de chaleur sur 821 l'écart dépasse 0,001 kgCO2e/kWh entre le SDES et France Chaleur Urbaine (29,9 % de l'énergie) ; France Chaleur Urbaine est retenue |
| Réseaux non recensés | l'identification des réseaux n'est pas exhaustive (réseaux privés) |
| Un seul millésime | 2024 ; 2025 est publié au SDES |
