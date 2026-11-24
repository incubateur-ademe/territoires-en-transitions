# Déchets, changement de mode de traitement

Identifiant : `dechets_mode_de_traitement`. Niveaux : région, département et EPCI. Une hypothèse nommée de `docs/methodology/assumptions.md` s'applique (`wasteScope`) ; elle est renvoyée dans `appliedAssumptions`, avec les tonnes ignorées faute de facteur quand il y en a (`wasteTonnesWithoutEmissionFactor`). Les tonnes sont celles des sites de traitement situés dans le territoire, pas celles que le territoire produit : un territoire sans site a un résultat nul quels que soient les pourcentages.

## Formule

```
Émissions évitées (tCO2e/an) =
  Σ_type [ p_si × (FE_stockage − FE_incinération) × T_stockage
         + p_iv × (FE_incinération − 0) × T_incinération
         + p_sv × (FE_stockage − 0) × T_stockage ] ÷ 1 000
```

| Terme | Sens | Unité |
|---|---|---|
| `p_si` | « % déchets stockés vers incinérés », saisi | fraction des tonnes stockées |
| `p_iv` | « % déchets incinérés vers valorisation », saisi | fraction des tonnes incinérées avec récupération |
| `p_sv` | « % déchets stockés vers valorisation », saisi | fraction des tonnes stockées |
| `T_stockage` | tonnes stockées, ou incinérées sans récupération d'énergie, du type de déchet | tonnes par an |
| `T_incinération` | tonnes incinérées avec récupération d'énergie du type de déchet | tonnes par an |
| `FE_stockage`, `FE_incinération` | « FE Stockage type de déchet », « FE Incinération type de déchet » | kgCO2e par tonne |
| `0` | facteur de la valorisation matière | kgCO2e par tonne |

La formule est lue dans les formes de la feuille `ChangementModeTraitement` ; la cellule « Formule » ne contient que « Réduction GES = ». Σ porte sur « chaque type de déchet ». Le facteur nul de la valorisation matière est celui du tableur (`B13` : « La méthode ne prend pas en compte d'émissions associées au recyclage, à la méthanisation ou au compostage »). Le résultat du tableur est en kgCO2e ; il est divisé par 1 000.

## Entrées

| Entrée | Unité | Bornes |
|---|---|---|
| `storageToIncinerationFraction` | fraction des tonnes stockées | 0 à 1 |
| `storageToMaterialRecoveryFraction` | fraction des tonnes stockées | 0 à 1 |
| `incinerationToMaterialRecoveryFraction` | fraction des tonnes incinérées avec récupération | 0 à 1 |

Les trois sont obligatoires, sans valeur par défaut ni valeur de la SNBC 3 (`ParametreDeterminants!H52:I54` sont vides). La somme des deux parts du stockage ne dépasse pas 1 : le Scénario global calcule « 1 − stockés vers incinérés − stockés vers valorisation ». La requête est refusée sinon.

Chaque pourcentage s'applique « sans distinction à l'ensemble des DM ou par type de déchets » (`ParametreDeterminants!D52:D54`) : la même fraction pour tous les types.

## Constantes

Les facteurs de la feuille `FE_déchets` (Base Empreinte de l'ADEME), en kgCO2e par tonne, sont dans `data/dechets/emission-factors.csv`.

| Famille | Codes du chapitre 20 | Stockage | Incinération |
|---|---|---|---|
| Carton | 20 01 01 | 950 | 120 |
| Verre | 20 01 02 | 41 | 130 |
| Déchets putrescibles | 20 01 08, 20 01 25, 20 02 01, 20 03 02 | 692 | 45 |
| Textiles | 20 01 10, 20 01 11 | 1 890 | 400 |
| Bois | 20 01 38 | 714 | 69 |
| Plastique PE | 20 01 39 | 41 | 2 769 |
| Acier | 20 01 40 | 41 | 135 |
| Ordures ménagères résiduelles | 20 01 99, 20 02 03, 20 03 01, 20 03 03, 20 03 04, 20 03 07, 20 03 99 | 412 | 374 |
| Déchets dangereux (DIS) | 16 codes, de 20 01 13 à 20 03 06 | 128 | 844 |
| Déchets dangereux (DAS) | 20 01 31 | absent | 943 |

Huit codes n'ont aucun facteur (20 01 33 à 20 01 36, 20 01 42 à 20 01 44, 20 02 02). 23 des 35 codes avec facteur reprennent celui de la famille DIS ou OMR (colonne « Notes de correspondance » du tableur).

## Données

| Jeu | Contenu | Source |
|---|---|---|
| `dechets/treatment-flows` | tonnes par an, par commune du site, code de déchet et mode de traitement | IREP 2022 de Géorisques, restitution du registre BDREP : déchets non dangereux du chapitre 20 |
| `dechets/emission-factors` | facteurs de stockage et d'incinération par code de déchet | feuille `FE_déchets` du tableur |

Modes : stockage = opérations D1 et D5 (dépôt sur ou dans le sol, mise en décharge) et D10 (incinération à terre, comptée avec le stockage comme le dit `DonneesReference!A49`) ; incinération avec récupération = R1. Les autres opérations (R3, R12, R13, D13, D12…) ne sont pas un mode de départ. Les 1 105 flux totalisent 10 805 952,18 t de stockage et 11 752 749,177 t d'incinération avec récupération. Le jeu se reconstruit avec `pnpm build:data:dechets`.

## Choix faits

| # | Choix | Source ou statut |
|---|---|---|
| 1 | Les tonnes sont celles des sites de traitement situés dans le territoire | hypothèse nommée `wasteScope` ; `DonneesTerritoires!L21` contre `ChangementModeTraitement!A25` ; renvoyé dans `appliedAssumptions.wasteScope` ; confirmée par Laurent (CGDD) et par la documentation fonctionnelle (p. 68) |
| 2 | Les trois « Tonnes de DM type de déchet » de la forme sont lues comme les tonnes du mode de départ du terme : stockage pour les termes 1 et 3, incinération avec récupération pour le terme 2 | la forme écrit trois fois le même libellé ; `Scénario global Déchets` applique chaque pourcentage à la fraction du mode de départ ; choix de conception, non validé |
| 3 | D1, D5 et D10 sont le stockage, R1 l'incinération avec récupération | `DonneesReference!A49:A50` ; correspondance avec les codes d'opération : choix de conception, non validé |
| 4 | Un terme dont un facteur nécessaire manque n'est pas calculé : le terme 1 demande les deux facteurs, les termes 2 et 3 un seul | « Pas de FE disponible » dans `FE_déchets` ; les tonnes ignorées sont renvoyées dans `appliedAssumptions.wasteTonnesWithoutEmissionFactor` |
| 5 | Les arrondissements de Paris, Lyon et Marseille sont rapportés à leur commune | même choix que les réseaux de chaleur ; choix de conception, non validé |
| 6 | Le résultat peut être négatif quand l'incinération émet plus que le stockage (plastique : 41 contre 2 769) | aucune borne dans le tableur ; aucune alerte renvoyée |
| 7 | La somme des deux parts du stockage ne dépasse pas 100 % : la requête est refusée au-delà | déduction du Scénario global (« 1 − … − … »), absente de `ParametreDeterminants` ; choix de conception, non validé |
| 8 | La correction 4 de `docs/methodology/formula-corrections.md` (« 1 − % » dans le Scénario global) ne concerne pas ce levier : il calcule son propre changement, pas l'enchaînement avec la sobriété | `Scénario global Déchets` hors périmètre |

## Cas de test chiffrés

| Entrée | Résultat |
|---|---|
| 100 t stockées et 200 t incinérées d'OMR (400 et 100 kgCO2e/t), 50 % du stockage vers l'incinération, 25 % vers la valorisation, 10 % de l'incinération vers la valorisation | 27 tCO2e (15 + 2 + 10) |
| idem, 50 % du stockage vers l'incinération seul | 15 tCO2e |
| idem, 10 % de l'incinération vers la valorisation seul | 2 tCO2e |
| idem, 25 % du stockage vers la valorisation seul | 10 tCO2e |
| plastique (41 et 2 769 kgCO2e/t), 100 t stockées, tout vers l'incinération | −272,8 tCO2e |
| région 84, jeu de test (150 t stockées, 200 t incinérées, 1 000 t de terres sans facteur), 50 %, 25 % et 10 % | 39,5 tCO2e |
| région 84, données réelles, 30 % (stockage vers incinération), 10 % (stockage vers valorisation) et 5 % (incinération vers valorisation) | 60 211,95 tCO2e |
| région 53 (Bretagne) | 15 138,26 tCO2e |
| région 11 (Île-de-France) | 108 274,73 tCO2e |
| région 94 (Corse) | 3 594,68 tCO2e |
| département 69 | 8 758,1 tCO2e |
| département 75 | 0 tCO2e (aucun site) |
| département 2A | 443,94 tCO2e |
| EPCI 200046977 | 7 222 tCO2e |
| EPCI 200000438 (aucun site) | 0 tCO2e |

Les valeurs sur données réelles sont recalculées hors du dépôt (Python, `Decimal`) à partir des CSV.

## Limites

| Limite | Effet |
|---|---|
| Sites, pas déchets du territoire | les tonnes traitées par région vont de 0,41 à 7,39 fois les tonnes collectées (SINOE 2021) ; à l'EPCI, 911 EPCI sur 1 255 n'hébergent aucun site et ont un résultat nul |
| Terres et pierres sans facteur | le code 20 02 02 pèse 3 046 657,96 t de stockage (28,2 %) et n'a pas de facteur : ignoré ; région 84 : 51 700,6 t ignorées, Île-de-France : 2 527 010,76 t |
| Incinération sans récupération | 1 207 376 t en D10 contre 61 517 t dans SINOE 2021 (19,6 fois) ; ces tonnes sont comptées avec le stockage |
| Récupération d'énergie non créditée | `ChangementModeTraitement!B13` : le facteur de l'incinération avec récupération ne compte pas d'émission évitée ; limite assumée par le tableur |
| Valorisation matière à zéro | le recyclage, le compostage et la méthanisation n'émettent rien dans la formule |
| Facteurs d'une famille voisine | 23 codes sur 35 reprennent le facteur de la famille DIS ou OMR |
| Un seul millésime | 2022 ; 2023 et 2024 sont publiés |
| Même fraction pour tous les types | pas de taux par type de déchet |
| 20 01 36 | 0,4 t d'équipements électriques sans facteur, ignorées |
