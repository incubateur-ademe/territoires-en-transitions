import type { LeverId } from './lever-registry.ts'

type LeverLimit = {
  readonly limit: string
  readonly effect: string
}

// Source : tableaux « Limites » des methodology.md de chaque levier, générés par pnpm build:limits ; ne pas modifier à la main
const LEVER_LIMITS: Readonly<Record<LeverId, readonly LeverLimit[]>> = {
  "fertilisation_azotee": [
    {
      "limit": "Livré n'est pas épandu",
      "effect": "les livraisons sont comptées au département du distributeur : Paris reçoit 21 824 t d'azote pour 1 ha de SAU, les Hauts-de-Seine 10 658 t pour 5 ha, contre 84 765 t pour 446 392 ha en Eure-et-Loir ; limite assumée par le tableur"
    },
    {
      "limit": "Deux campagnes seulement",
      "effect": "les valeurs bougent d'une campagne à l'autre : Nouvelle-Aquitaine 211 529 t en 2022-2023 révisée puis 220 836 t en 2023-2024, Provence-Alpes-Côte d'Azur 23 761 t puis 21 219 t"
    },
    {
      "limit": "Campagne 2022-2023 déduite",
      "effect": "la campagne précédente est déduite d'une évolution publiée arrondie à 0,1 % ; elle diffère de la valeur publiée en 2022-2023 (Île-de-France 63 044 t contre 57 386 t)"
    },
    {
      "limit": "Corse départementale",
      "effect": "2A et 2B sans résultat ; la région 94 est calculée (201 t en 2023-2024, 164,5 t en moyenne) ; le code 20 de la Corse n'est pas réparti"
    },
    {
      "limit": "Somme des départements et des régions",
      "effect": "1 807 072 t (94 départements) contre 1 807 283 t pour les 13 régions, moyenne des deux campagnes ; la Corse départementale et le code 99 sont écartés"
    },
    {
      "limit": "Incertitude du facteur",
      "effect": "400 % dans la Base Empreinte"
    },
    {
      "limit": "Ventilation à l'EPCI",
      "effect": "proxy : l'azote du département réparti par la SAU hors bio, alors qu'il est livré où est le distributeur ; SAU de 2020 contre bio de 2024 ; Paris et Hauts-de-Seine (bio supérieure à la SAU) ne reçoivent aucune part à l'EPCI"
    },
    {
      "limit": "EPCI sans résultat",
      "effect": "50 couples EPCI-département sous secret statistique, dont celui de la Métropole du Grand Paris dans le département 91 ; la Corse (2A, 2B) n'a pas de livraison"
    },
    {
      "limit": "Métropole seulement",
      "effect": "pas de calcul pour les départements d'outre-mer"
    },
    {
      "limit": "Leviers du secteur",
      "effect": "les leviers de l'agriculture s'additionnent sans interaction (feuille `SG Agriculture`)"
    }
  ],
  "elevage_durable": [
    {
      "limit": "Constantes de 2013",
      "effect": "voir choix 5"
    },
    {
      "limit": "Méthanisation initiale à 0",
      "effect": "l'OMINEA 2026 estime la part initiale à 9,5 % des truies et 9,8 % des autres porcins en 2024 (UE) ; l'effet d'un passage à la méthanisation peut être surestimé"
    },
    {
      "limit": "Effectifs au siège de l'exploitation",
      "effect": "un élevage sur deux départements est compté au siège"
    },
    {
      "limit": "Vaches laitières estimées",
      "effect": "21 départements sous secret reçoivent une estimation de cartostat dont la méthode n'est pas décrite ; 91 et 93 sans valeur"
    },
    {
      "limit": "Secret statistique",
      "effect": "une catégorie sous secret compte pour zéro, y compris quand son parent est publié : 0,2 % des volailles des régions et jusqu'à 1,3 % de celles de 53 départements"
    },
    {
      "limit": "Zones pédoclimatiques",
      "effect": "non prises en compte (`ElevageDurable!B15`)"
    },
    {
      "limit": "Un seul millésime",
      "effect": "2020"
    },
    {
      "limit": "Pas d'interaction entre animaux",
      "effect": "les réductions s'additionnent (feuille `SG Agriculture`)"
    }
  ],
  "batiments_machines_agricoles": [
    {
      "limit": "Pêche comprise",
      "effect": "le secteur du SDES est « agriculture/sylviculture/pêche » ; la pêche pèse 9,0 % des produits pétroliers de métropole (22 % en Bretagne) et reste dans la formule, comme dans le tableur"
    },
    {
      "limit": "Territoire sans réseau de chaleur",
      "effect": "sa contribution de chaleur est nulle (décision du 2026-10-08, à arbitrer avec l'ADEME) ; la chaleur agricole ne concerne que 15 communes"
    },
    {
      "limit": "Trois séries d'énergie",
      "effect": "régionale, IRIS et EPCI ne se réconcilient pas (gaz local supérieur au gaz régional PCS, écart DROM de 38 125,283 MWh d'électricité) : on ne les additionne ni ne les compare. Pour les produits pétroliers, la somme des 96 départements retrouve les 13 régions (11 783 476,04 tCO2e) ; la somme des EPCI est inférieure de 105 tCO2e, cause non établie"
    },
    {
      "limit": "Gaz : PCS ou PCI",
      "effect": "le jeu local ne le dit pas ; les facteurs OMINEA sont par GJ PCI ; l'écart de 10 % porte sur 3,0 % de l'énergie du secteur"
    },
    {
      "limit": "Secret statistique",
      "effect": "électricité : 38 % des lignes IRIS sous secret ; gaz : 66 % ; les lignes secrètes comptent pour 0"
    },
    {
      "limit": "Ventilation par la SAU",
      "effect": "la part de SAU s'écarte de la part de gazole non routier de 3,0 points en médiane et 11,6 au 90e centile ; indicatif"
    },
    {
      "limit": "Territoire sans SAU",
      "effect": "à tout niveau, ses produits pétroliers et sa chaleur sont nuls et seuls l'électricité et le gaz comptent, sans signal dans le résultat ; c'est le cas d'une région sans SAU (testé sur un jeu fictif : les 13 régions de métropole ont une SAU) et d'un département ou d'un EPCI urbain sans commune agricole"
    },
    {
      "limit": "Communes de la SAU absentes de la géographie",
      "effect": "aucune aujourd'hui, un test fixe ce nombre à 0 ; si un millésime futur en ajoutait, elles seraient écartées sans erreur et n'entreraient dans aucune part ni dans la SAU de leur région (choix de conception, non validé), et ce test casserait"
    },
    {
      "limit": "Communes de la géographie sans ligne de SAU",
      "effect": "1 384 (dont 94 d'outre-mer) : lues comme une SAU nulle, cohérent avec les totaux régionaux (manifeste de `surface-agricole-utile`)"
    },
    {
      "limit": "Facteur du gazole pour tous les produits pétroliers",
      "effect": "appliqué aussi à l'essence ; OMINEA donne 72,48 pour l'essence des engins agricoles, soit 2,7 % de moins, et pas de facteur 2024 pour le fioul domestique de ces engins"
    },
    {
      "limit": "Élevage",
      "effect": "la fiche élevage (02) n'est pas vérifiée contre le dessin du classeur"
    }
  ],
  "haies": [
    {
      "limit": "Rabais régionaux absents",
      "effect": "hors Grand-Ouest, le stockage est surestimé (rabais de 5 à 50 %, plus 10 % de risque de non-permanence)"
    }
  ],
  "pratiques_stockantes": [
    {
      "limit": "Surfaces d'application non définies",
      "effect": "la surface maximale de chaque pratique dépend de la pratique (prairies, vergers, vignes ou cultures) et n'est pas définie ; une saisie supérieure à la surface du territoire n'est pas refusée"
    },
    {
      "limit": "Valeurs moyennes potentielles",
      "effect": "les facteurs sont des moyennes potentielles : les pratiques ne sont pas toujours simples à mettre en œuvre et n'atteindront pas toujours le stock espéré (documentation, p. 73)"
    },
    {
      "limit": "Pratiques écartées",
      "effect": "labour occasionnel (controverse scientifique), bandes enherbées (potentiel négligeable), intensification modérée des prairies permanentes peu productives (impacts indirects négatifs), p. 72"
    },
    {
      "limit": "Surfaces d'ALDO",
      "effect": "la documentation les donne comme données de territoire (prairies, cultures, vergers, vignes ; Corine Land Cover 2018) ; ce levier ne les lit pas"
    }
  ],
  "occupation_des_sols": [
    {
      "limit": "Facteurs de la région et du département",
      "effect": "moyenne pondérée des communes, non la valeur d'une zone majoritaire ; à l'EPCI les facteurs sont ceux d'ALDO, qu'on ne sait pas reconstruire depuis ceux des communes : un territoire et ses EPCI n'ont pas des facteurs cohérents entre eux"
    },
    {
      "limit": "Unité des facteurs",
      "effect": "ALDO annonce « tC/ha/an » dans sa présentation et nomme ses colonnes `tCO2e_ha-1` ; le CGDD a tranché pour un flux annuel (question 2) : zones humides de 101 à 324 tCO2e/ha/an selon l'EPCI, lues comme un flux annuel"
    },
    {
      "limit": "Premier ordre de grandeur",
      "effect": "« une version simplifiée de ce que propose l'outil ALDO » (documentation, p. 73) : trois stratégies seulement, le déstockage à date est laissé au scénario global"
    },
    {
      "limit": "Répartition au prorata",
      "effect": "les surfaces à afforester ou à transformer sont choisies au prorata des surfaces existantes, comme l'indique le tableur ; la collectivité peut les répartir autrement"
    },
    {
      "limit": "Zone pédoclimatique",
      "effect": "prise en compte par les facteurs de l'EPCI, qui mélangent celles de ses communes ; plus le territoire est grand, plus c'est grossier (documentation, p. 75)"
    },
    {
      "limit": "Millésime",
      "effect": "surfaces issues de Corine Land Cover, mises à jour à fréquence variable"
    },
    {
      "limit": "Pas de borne de surface",
      "effect": "un rythme et un horizon qui dépassent les surfaces disponibles sont acceptés"
    }
  ],
  "produits_bois": [
    {
      "limit": "Bois d'industrie absent de la source",
      "effect": "2A, 2B, 75, 93 et 94 (et la Corse en région) comptent 0 : la source ne dit pas zéro ou secret ; l'écart avec le total national est de 3 milliers de m³ sur 10 311"
    },
    {
      "limit": "Régions et départements non réconciliés",
      "effect": "la somme des départements s'écarte de 3 milliers de m³ du national (arrondis de la source) ; les régions retombent exactement sur le national"
    },
    {
      "limit": "Une seule année",
      "effect": "2022, dernier millésime de la récolte ; 2024 existe pour les tC des produits bois"
    },
    {
      "limit": "EPCI du millésime ALDO",
      "effect": "18 EPCI de métropole du référentiel `territoires` n'ont pas de forêt dans ALDO : `missing_data` ; la forêt de 27 EPCI d'ALDO absents du référentiel (environ 1,5 %) n'est attribuée à aucun EPCI demandé"
    },
    {
      "limit": "Forêt, pas production",
      "effect": "la ventilation à l'EPCI suppose la récolte proportionnelle à la surface de forêt (tous peuplements, sans distinguer feuillus et conifères)"
    },
    {
      "limit": "Proxy",
      "effect": "la part départementale de la récolte en m³ tient lieu de part de la production de produits bois en tC"
    },
    {
      "limit": "Sortie de stock invariante",
      "effect": "la formule ignore l'effet de la hausse sur la sortie de stock des produits"
    },
    {
      "limit": "Hausse sans borne",
      "effect": "une hausse négative donne un stockage négatif, une hausse supérieure à 100 % est acceptée, comme dans le tableur"
    },
    {
      "limit": "Récolte nationale nulle",
      "effect": "non gérée : une récolte nationale à 0 dans `constants.csv` donnerait un résultat infini, sans erreur ; la donnée versionnée vaut 19 975 et 10 311"
    }
  ],
  "residentiel_renovation": [
    {
      "limit": "Consommation par m² moyenne nationale",
      "effect": "un département plus ou moins chauffé que la France, ou des logements plus ou moins énergivores, sont mal estimés ; les moyennes nationales sont, en énergie finale pour le chauffage et l'ECS : électricité 63 kWh/m², gaz 100, fioul 130, bois 177, chaleur 132"
    },
    {
      "limit": "Appartements d'après 1971",
      "effect": "non comptés : le total est sous-estimé"
    },
    {
      "limit": "Régions, départements et EPCI",
      "effect": "les totaux diffèrent d'environ 1 % (4,48, 4,52 et 4,53 MtCO2e à 50 % du parc) : les consommations viennent de trois jeux différents (bilan régional, IRIS départemental, SDES à l'EPCI), la part éligible du même parc INSEE ; comme `residentiel_sobriete`"
    },
    {
      "limit": "EPCI sans surface de logements",
      "effect": "la consommation de l'EPCI, lue en amont, échoue déjà en `missing_data` ; le levier ne le vérifie pas une seconde fois"
    },
    {
      "limit": "Logements déjà rénovés",
      "effect": "les consommations moyennes embarquent des logements déjà rénovés et le parc « disponible » à rénover n'est pas déduit : les gains sont sous-estimés (tableur, `B15`)"
    },
    {
      "limit": "Constructions postérieures au recensement",
      "effect": "non comptées (documentation, p. 54)"
    },
    {
      "limit": "Effets rebond",
      "effect": "non pris en compte (documentation, 7.2.2.6)"
    },
    {
      "limit": "Bois",
      "effect": "absent des données du territoire"
    },
    {
      "limit": "Outre-mer",
      "effect": "23 EPCI refusés (`missing_data`) faute de parc de logements"
    }
  ],
  "residentiel_changement_systeme_chauffage": [
    {
      "limit": "Part nationale du chauffage",
      "effect": "un département qui chauffe moins ou plus que la moyenne nationale est mal estimé ; Ille-et-Vilaine : 2,93 TWh de chauffage et d'ECS (électricité, gaz, fioul) sur 4,41 TWh tous usages"
    },
    {
      "limit": "Bois",
      "effect": "absent des données du territoire : un passage au bois supprime des émissions sans en retirer d'énergie du bois existant"
    },
    {
      "limit": "GPL",
      "effect": "53,2 % de sa consommation sert au chauffage et à l'ECS ; il n'est pas modifiable"
    },
    {
      "limit": "Territoire sans réseau de chaleur",
      "effect": "facteur nul : un EPCI sans réseau qui vise du réseau de chaleur évite des émissions sans coût ; la somme des EPCI dépasse de 6,8 % celle des départements"
    },
    {
      "limit": "Pompes à chaleur",
      "effect": "la part de chauffage de l'électricité inclut les PAC, la cible est lue à 100 % : le gain d'une PAC (COP) n'est pas compté"
    },
    {
      "limit": "Résultat négatif",
      "effect": "une cible plus émettrice que l'actuel donne une réduction négative, sans plancher (gaz vers fioul : −20,73 tCO2e pour 1 000 MWh)"
    },
    {
      "limit": "Effets rebond",
      "effect": "non pris en compte (documentation, 7.2.3.6)"
    },
    {
      "limit": "Outre-mer",
      "effect": "23 EPCI refusés (`missing_data`) faute de parc de logements"
    }
  ],
  "residentiel_sobriete": [
    {
      "limit": "SDES et non CEREN",
      "effect": "le CEREN donne des consommations à climat normal, le SDES des consommations constatées ; l'électricité IRIS dépasse le bilan de 3,5 % (152,9 contre 147,8 TWh en métropole), le gaz IRIS vaut 101,7 TWh contre 100,2 au bilan en PCI"
    },
    {
      "limit": "Départements et régions",
      "effect": "la somme des 96 départements dépasse celle des 13 régions de 0,9 % (37,13 contre 36,79 MtCO2e à 100 %), parce que l'électricité et le gaz départementaux viennent du jeu IRIS et ceux des régions du bilan : on ne les additionne ni ne les compare"
    },
    {
      "limit": "Ventes de FOD et de GPL",
      "effect": "tous clients, unité non publiée, GPL carburant compris ; en 2024 le FOD de la Haute-Corse (110 570) vaut 27 fois celui de la Corse-du-Sud (4 027), et la répartition suit les ventes telles que publiées"
    },
    {
      "limit": "Secret statistique",
      "effect": "électricité : 1 330 lignes IRIS sur 50 786 (2,6 %) ; gaz : 1 283 sur 24 291 (5,3 %) ; chaleur : 140 réseaux sur 992 (14 %) ; les lignes secrètes comptent pour 0"
    },
    {
      "limit": "Chaleur à la commune du réseau",
      "effect": "la chaleur n'est pas attribuée à la commune des clients ; un département servi par un réseau implanté dans un autre n'en reçoit pas la chaleur"
    },
    {
      "limit": "Chaleur : bilan et réseaux",
      "effect": "la chaleur d'une région vient du bilan (14,7 TWh en métropole) et son facteur des réseaux hors secret (13,7 TWh)"
    },
    {
      "limit": "Départements sans réseau",
      "effect": "4 départements n'ont aucun réseau hors secret : leur chaleur et son facteur valent 0"
    },
    {
      "limit": "Outre-mer",
      "effect": "absent des données énergétiques ; 23 EPCI d'outre-mer sont refusés faute de parc de logements"
    },
    {
      "limit": "EPCI : consommation par m² uniforme",
      "effect": "le fioul et le GPL d'un EPCI valent sa part des m² du département : un EPCI plus chauffé au fioul par m² que son département est sous-estimé"
    },
    {
      "limit": "EPCI et départements",
      "effect": "la somme des 1 232 EPCI dépasse de 0,015 % celle des 96 départements (37,139 contre 37,133 MtCO2e)"
    },
    {
      "limit": "Jeux IRIS agrégés hors dépôt",
      "effect": "`sdes-electricite-iris-…-par-departement.csv` et `sdes-gaz-iris-…-par-departement.csv` sont des extraits déjà sommés par département ; le jeu IRIS résidentiel complet n'est pas versionné"
    }
  ],
  "transport_personnes_sobriete_deplacements": [
    {
      "limit": "Hexagone et moins de 100 km",
      "effect": "mêmes limites que le levier d'efficacité : millésime 2022, DOM absents"
    },
    {
      "limit": "Domicile-travail seul",
      "effect": "les autres motifs de déplacement ne sont pas comptés"
    },
    {
      "limit": "Combustion du ferré continental",
      "effect": "nulle dans la Base Empreinte (TER 2022, élément 43255) alors que le TER moyen compte des TER diesel ; la documentation fonctionnelle reconnaît cette limite (p. 58) : si leur combustion comptait, le facteur continental monterait et le résultat aussi"
    },
    {
      "limit": "Un seul facteur pour tout le ferré",
      "effect": "un territoire avec métro ou tram a son propre facteur, souvent plus bas"
    },
    {
      "limit": "Part du ferré par défaut",
      "effect": "une valeur par groupe de régions, voir le levier d'efficacité"
    },
    {
      "limit": "EPCI sans bus ni car immatriculé",
      "effect": "273 EPCI ont des passagers.km de transport en commun et aucun bus classé : leur part routière est chiffrée au facteur national du parc de bus, signalé dans `appliedAssumptions` ; saisir `railShareFraction` si le réseau est surtout ferré"
    },
    {
      "limit": "Facteur des voitures",
      "effect": "facteur du parc, pas celui du trajet"
    },
    {
      "limit": "Deux-roues motorisés",
      "effect": "sans terme ; hors périmètre selon la documentation fonctionnelle (p. 58)"
    }
  ],
  "transport_personnes_report_modal": [
    {
      "limit": "Hexagone et moins de 100 km",
      "effect": "mêmes limites que le levier d'efficacité : millésime 2022, DOM absents"
    },
    {
      "limit": "Domicile-travail seul",
      "effect": "les autres motifs de déplacement ne sont pas comptés ; `DonneesReference!D27`, le taux de remplissage des autres trajets, n'est pas utilisé"
    },
    {
      "limit": "Capacité du réseau",
      "effect": "le report n'ajoute pas de véhicule-km : aucun effet de saturation du transport en commun ni d'offre supplémentaire"
    },
    {
      "limit": "Combustion du ferré continental",
      "effect": "nulle dans la Base Empreinte (TER 2022, élément 43255) alors que le TER moyen compte des TER diesel ; la documentation fonctionnelle reconnaît cette limite (p. 58) : si leur combustion comptait, le facteur continental monterait et le gain du report vers les transports en commun baisserait"
    },
    {
      "limit": "Un seul facteur pour tout le ferré",
      "effect": "un territoire avec métro ou tram a son propre facteur, souvent plus bas"
    },
    {
      "limit": "Part du ferré par défaut",
      "effect": "une valeur par groupe de régions, voir le levier d'efficacité"
    },
    {
      "limit": "Distance des trajets reportés",
      "effect": "les modes actifs ne couvrent pas les mêmes distances que la voiture : la fraction porte sur les passagers.km, pas sur les trajets"
    },
    {
      "limit": "Facteur des voitures",
      "effect": "facteur du parc, pas celui du trajet"
    }
  ],
  "transport_personnes_efficacite": [
    {
      "limit": "Hexagone et moins de 100 km",
      "effect": "772 644 actifs métropolitains qui se déplacent sont hors champ de la base, ainsi que les DOM ; millésime 2022, « Annuelle sans garantie »"
    },
    {
      "limit": "Potentiel d'écoconduite",
      "effect": "une moyenne (10 %) : le résultat lui est proportionnel ; la documentation cite jusqu'à 23 % pour une berline compacte essence"
    },
    {
      "limit": "Deux-roues motorisés",
      "effect": "sans terme : 1,4 % des passagers.km ; hors périmètre selon la documentation fonctionnelle (p. 58)"
    },
    {
      "limit": "Parc de bus et cars immatriculé au siège",
      "effect": "trois communes portent 17,7 % du parc métropolitain ; 276 des 1 243 EPCI n'ont aucun bus ni car classé et 11 aucune voiture : ils prennent la moyenne nationale"
    },
    {
      "limit": "Part du ferré par défaut",
      "effect": "une valeur par groupe de régions : un territoire avec un grand métro hors Île-de-France (Lyon, Marseille, Lille) a une part ferrée plus haute, et ses bus sont surévalués"
    },
    {
      "limit": "Territoire à cheval ou commune sans région",
      "effect": "un territoire dont les communes ne sont pas toutes en Île-de-France prend 24 %, y compris un EPCI à cheval sur l'Île-de-France et une autre région (l'EPCI 247800550 : 32 communes en région 11 et 4 en région 24, il prend 24 % alors que 89 % de ses communes sont franciliennes)"
    },
    {
      "limit": "Facteur des voitures",
      "effect": "les voitures sont comptées avec le facteur du parc, pas celui du trajet"
    },
    {
      "limit": "Outre-mer",
      "effect": "absent des données"
    }
  ],
  "transport_personnes_electrification": [
    {
      "limit": "Hexagone et moins de 100 km",
      "effect": "mêmes limites que le levier d'efficacité : millésime 2022, DOM absents, « Annuelle sans garantie »"
    },
    {
      "limit": "Facteur électrique amont seul",
      "effect": "un bus ou une voiture électrique est compté à un facteur unique, quel que soit le mix du territoire"
    },
    {
      "limit": "Parc de bus et cars immatriculé au siège",
      "effect": "trois communes portent 17,7 % du parc métropolitain : la part thermique d'un EPCI peut être très éloignée de la réalité des trajets"
    },
    {
      "limit": "Part du ferré par défaut",
      "effect": "une valeur par groupe de régions, voir le levier d'efficacité"
    },
    {
      "limit": "Voiture et bus déjà électriques",
      "effect": "leur part est écartée par le plafond : on ne peut pas électrifier deux fois"
    },
    {
      "limit": "Territoire sans parc",
      "effect": "276 des 1 243 EPCI n'ont aucun bus ni car immatriculé, 11 aucune voiture : leur part thermique est nulle et le résultat de ce mode est nul, signalé dans `appliedAssumptions` par une limite propre"
    },
    {
      "limit": "Périmètre des trajets",
      "effect": "seuls les trajets domicile-travail de moins de 100 km comptent, alors que la part saisie porte sur le parc entier"
    },
    {
      "limit": "Taux de remplissage des voitures",
      "effect": "1,4 est la valeur « courte distance » de la Base Carbone (ENTD 2008), rapprochée du domicile-travail, valeur validée par l'équipe le 2026-11-19 ; partagé avec l'efficacité"
    },
    {
      "limit": "Deux-roues motorisés",
      "effect": "sans terme ; hors périmètre selon la documentation fonctionnelle (p. 58)"
    }
  ],
  "transport_marchandises_sobriete_logistique": [
    {
      "limit": "Parc immatriculé, pas circulant",
      "effect": "le jeu localise un véhicule à l'adresse de la carte grise : le parc d'une région n'est pas celui qui y roule"
    },
    {
      "limit": "Vignettes sans correspondance",
      "effect": "3 à 14 % des poids lourds diesel d'une région sont « Non classé » ou sans vignette 1 à 5 et sont écartés de la moyenne"
    },
    {
      "limit": "Biodiesel",
      "effect": "2 485 poids lourds au niveau national sont dans le parc mais pas dans la moyenne diesel"
    },
    {
      "limit": "CO2 seul",
      "effect": "CH4 et N2O ajoutent environ 1,7 % au facteur thermique"
    },
    {
      "limit": "T.km non rattachées",
      "effect": "6,7 milliards de t.km à région « non précisé » et celles des DOM ne vont dans aucune des 13 régions"
    },
    {
      "limit": "Un seul facteur électrique",
      "effect": "il sert à tous les poids lourds, dont ceux de plus de 7,5 t"
    },
    {
      "limit": "Pas de département ni d'EPCI",
      "effect": "le tableur les déclare hors périmètre"
    },
    {
      "limit": "Millésime",
      "effect": "t.km 2024, parc 2024 (révisable), OMINEA 2024"
    }
  ],
  "transport_marchandises_report_modal": [
    {
      "limit": "Coefficients d'une analyse non publiée",
      "effect": "0,8064 (1 − 1,21 × 0,16), 1,0164 (1,21 × 0,84), 0,8176 (1 − 1,14 × 0,16) et 0,9576 (1,14 × 0,84) viennent d'une analyse interne ADEME du programme REMOVE, non publiée (documentation fonctionnelle, pp. 64-65)"
    },
    {
      "limit": "Périmètres de facteurs différents",
      "effect": "fluvial : combustion seule ; ferroviaire : combustion et amont ; thermique routier : émissions directes OMINEA"
    },
    {
      "limit": "Barges",
      "effect": "344 barges non motorisées (32 % des 1 088 bateaux, Tableau 9 du rapport ADEME-VNF 2019 repris par `FE_fluvial!B18:B23`) reçoivent les facteurs des automoteurs ; les 348 pousseurs (`FE_fluvial!B23`, `C23`) sont comptés comme barges de 5 937,5 t"
    },
    {
      "limit": "Cyclologistique sans effet positif",
      "effect": "le paramètre retire des t.km de la base et ne crédite rien"
    },
    {
      "limit": "Résultat négatif possible",
      "effect": "si le mode reporté émet plus que la route évitée, ou si la cyclologistique dépasse les t.km ; aucune alerte renvoyée"
    },
    {
      "limit": "Un seul facteur ferroviaire et fluvial",
      "effect": "pour toutes les régions"
    },
    {
      "limit": "Limites des données",
      "effect": "celles de `transport_marchandises_sobriete_logistique`"
    }
  ],
  "transport_marchandises_efficacite": [
    {
      "limit": "Potentiel moyen",
      "effect": "le guide EVE de l'ADEME pour le transport de marchandises donne un gain initial de 5 à 15 % (10 % en moyenne, comme la valeur retenue), qui s'estompe : 6 % la première année, 2 % les deux suivantes, 3 % en moyenne sur trois ans"
    },
    {
      "limit": "Un seul potentiel pour tous les poids lourds",
      "effect": "le guide EVE distingue des gains par type d'activité (travaux publics et trajets urbains plus élevés)"
    },
    {
      "limit": "Hausse du chargement sans plafond",
      "effect": "200 % de chargement en plus donnent une baisse de plus de 66 % avant écoconduite"
    },
    {
      "limit": "Limites des données",
      "effect": "celles de `transport_marchandises_sobriete_logistique`"
    }
  ],
  "transport_marchandises_electrification": [
    {
      "limit": "Un seul facteur électrique",
      "effect": "il sert aussi aux poids lourds de plus de 7,5 t"
    },
    {
      "limit": "Hydrogène traité comme l'électrique",
      "effect": "`FE_transports!A19` regroupe électrique, hydrogène et autres ZE"
    },
    {
      "limit": "Facteur électrique ancien",
      "effect": "validité avril 2021, incertitude 70 %"
    },
    {
      "limit": "Résultat négatif possible",
      "effect": "si le facteur électrique dépassait le thermique ; aucune alerte renvoyée"
    },
    {
      "limit": "Limites des données",
      "effect": "celles de `transport_marchandises_sobriete_logistique`"
    }
  ],
  "dechets_mode_de_traitement": [
    {
      "limit": "Sites, pas déchets du territoire",
      "effect": "les tonnes traitées par région vont de 0,41 à 7,39 fois les tonnes collectées (SINOE 2021) ; à l'EPCI, 911 EPCI sur 1 255 n'hébergent aucun site et ont un résultat nul"
    },
    {
      "limit": "Terres et pierres sans facteur",
      "effect": "le code 20 02 02 pèse 3 046 657,96 t de stockage (28,2 %) et n'a pas de facteur : ignoré ; région 84 : 51 700,6 t ignorées, Île-de-France : 2 527 010,76 t"
    },
    {
      "limit": "Incinération sans récupération",
      "effect": "1 207 376 t en D10 contre 61 517 t dans SINOE 2021 (19,6 fois) ; ces tonnes sont comptées avec le stockage"
    },
    {
      "limit": "Récupération d'énergie non créditée",
      "effect": "`ChangementModeTraitement!B13` : le facteur de l'incinération avec récupération ne compte pas d'émission évitée ; limite assumée par le tableur"
    },
    {
      "limit": "Valorisation matière à zéro",
      "effect": "le recyclage, le compostage et la méthanisation n'émettent rien dans la formule"
    },
    {
      "limit": "Facteurs d'une famille voisine",
      "effect": "23 codes sur 35 reprennent le facteur de la famille DIS ou OMR"
    },
    {
      "limit": "Un seul millésime",
      "effect": "2022 ; 2023 et 2024 sont publiés"
    },
    {
      "limit": "Même fraction pour tous les types",
      "effect": "pas de taux par type de déchet"
    },
    {
      "limit": "20 01 36",
      "effect": "0,4 t d'équipements électriques sans facteur, ignorées"
    }
  ],
  "dechets_sobriete": [
    {
      "limit": "Réduction à la source",
      "effect": "la sobriété retire des tonnes au mode de traitement actuel du territoire ; elle ne dit pas où vont les déchets évités"
    },
    {
      "limit": "Deux leviers cumulés",
      "effect": "`Scénario global Déchets` calcule les tonnes après sobriété (« Tonne initial × % réduction des déchets ») puis les répartit selon les parts d'après le changement de mode ; chaque levier se calcule ici seul sur les tonnes initiales. Avec un seul pourcentage `r`, la somme des deux leviers diffère du cumul de `r` × (résultat du changement de mode) : elle le surestime quand le changement de mode évite des émissions, le sous-estime quand il en ajoute (plastique). Le cumul du tableur n'a qu'un « % réduction des déchets » : il ne coïncide avec les deux pourcentages de cette feuille que si `r_s = r_i`"
    }
  ],
  "reseaux_chaleur": [
    {
      "limit": "Réseau dont la commune est absente de la géographie actuelle",
      "effect": "1 réseau, 2515C à Goux-les-Usiers (25282, commune fusionnée), facteur nul : aucun effet"
    },
    {
      "limit": "Livraisons sous secret",
      "effect": "140 réseaux exclus (1,4 % de la production de chaleur)"
    },
    {
      "limit": "Deux sources de contenu CO2",
      "effect": "pour 259 réseaux de chaleur sur 821 l'écart dépasse 0,001 kgCO2e/kWh entre le SDES et France Chaleur Urbaine (29,9 % de l'énergie) ; France Chaleur Urbaine est retenue"
    },
    {
      "limit": "Réseaux non recensés",
      "effect": "l'identification des réseaux n'est pas exhaustive (réseaux privés)"
    },
    {
      "limit": "Un seul millésime",
      "effect": "2024 ; 2025 est publié au SDES"
    }
  ]
}

export { LEVER_LIMITS }
export type { LeverLimit }
