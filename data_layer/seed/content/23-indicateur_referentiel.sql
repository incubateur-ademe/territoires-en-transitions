
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_18', 'cae', '18', null, 'Part des achats d’électricité renouvelable de la collectivité (%)', '<p>L&#x27;indicateur mesure le rapport entre les achats d&#x27;électricité renouvelable et le montant total des achats d&#x27;électricité de la collectivité pour les bâtiments et équipements de la collectivité (y compris services publics eaux, assainissement, déchets et éclairage public s’ils sont de la compétence de la collectivité) (en kWh ou MWh). La cible est de 100%</p>
', '%', false, 'Part des achats d’électricité renouvelable de la collectivité (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_6.1', 'crte', '6.1', null, 'Linéaire d’aménagements cyclables sécurisés', '<p><strong>Définition:</strong>
Longueur des voies de pistes cyclables en site propre ou voies vertes sur le territoire.</p>
<p><strong>Modalités de calcul:</strong>
Somme des longueurs de voies cyclables en site propre et voies vertes.</p>
<p>Les voies cyclables qui existent de chaque côté de la même route doivent être comptées séparément et il convient de multiplier par 2 la longueur des pistes bi-directionnelles</p>
<p><strong>Sources:</strong></p>
<a href="https://amenagements-cyclables.fr/">
Aménagements cyclables
</a>
<a href="https://transport.data.gouv.fr/datasets/amenagements-cyclables-france-metropolitaine/">
Transport data.gouv.fr
</a>
 DREAL / DDTM
<p><strong>Périodicité:</strong>
Infra-annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre le changement climatique</p>
<p><strong>Politique publique:</strong>
Mobilité</p>
<p><strong>Objectif stratégique:</strong>
Décarboner la mobilité</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: LOM:</p>
<ul>
<li>Tripler la part modale du vélo d’ici 2024 (de 3 % à 9 % des déplacements quotidiens)</li>
</ul>
', 'km', false, 'Linéaire d’aménagements cyclables sécurisés', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_15', 'eci', '15', null, 'Part de biens ou de constructions temporaires acquis annuellement par la collectivité issus du réemploi ou de la réutilisation ou intégrant des matières recyclées (%)', '<p>Données de suivi des objectifs de la loi AGEC articles 56 et 58 (décret n° 2021-254 du 9 mars 2021).</p>
<p>Objectif de 20 % d&#x27;achats reconditionnés.</p>
', '%', false, 'Part de biens ou de constructions temporaires acquis annuellement par la collectivité issus du réemploi ou de la réutilisation ou intégrant des matières recyclées (%)', null, '<p>Service Achats ou Comptabilité</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_3.1', 'crte', '3.1', null, 'Production annuelle d’ENR du territoire hors hydroélectrique (MWh / an)', '<p><strong>Définition:</strong>
Production annuelle d’énergie renouvelable sur le territoire toutes sources confondues et selon les exigences réglementaires des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial), c&#x27;est à dire incluant les filières de production d’électricité (éolien terrestre, solaire photovoltaïque, solaire thermodynamique, biomasse solide, biogaz, géothermie), de chaleur (biomasse solide, pompes à chaleur, géothermie, solaire thermique, biogaz), de biométhane et de biocarburants.</p>
<p>La production d’électricité d’origine hydraulique est suivie à part pour éviter l’effet statistique écrasant des grandes installations hydroélectriques par rapport aux autres ENR.</p>
<p><strong>Modalités de calcul:</strong>
Somme de la production d’énergie renouvelable par filière et par type d’énergie (électricité, chaleur, biométhane et biocarburants) :</p>
<p>ELECTRICITÉ</p>
<p>• éolien terrestre</p>
<p>• solaire photovoltaïque et thermodynamique</p>
<p>• biomasse solide</p>
<p>• biogaz</p>
<p>• géothermie</p>
<p>Hors hydroélectrique</p>
<p>CHALEUR</p>
<p>• biomasse solide</p>
<p>• pompes à chaleur</p>
<p>• géothermie</p>
<p>• solaire thermique</p>
<p>• biogaz</p>
<p>BIOMETHANE / BIOCARBURANTS</p>
<p>Par convention, 50 % de la chaleur produite par l’incinération des déchets est considérée issue de déchets urbains renouvelables (source DGEC, dans ses bilans).</p>
<p>L&#x27;électricité produite par cogénération via incinération des déchets en mélange compte pour 50% comme une énergie renouvelable (biomasse solide).</p>
<p>Les pompes à chaleur prise en compte sont les pompes à chaleur eau/eau, sol/eau, sol/sol avec une efficacité énergétique ≥ 126 % (PAC basse température) et une efficacité énergétique ≥ 111 % (PAC moyenne ou haute température) (exigences du crédit d’impôt pour la transition énergétique 2018). La cogénération à partir d&#x27;énergie fossile n&#x27;est pas prise en compte.</p>
<p>La production annuelle d’énergie hydroélectrique sur le territoire est comptabilisée à part.</p>
<p><strong>Sources:</strong>
Observatoires régionaux de l’énergie, du climat et de l’air</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre le changement climatique</p>
<p><strong>Politique publique:</strong>
Transition énergétique</p>
<p><strong>Objectif stratégique:</strong>
Augmenter la production d’énergie renouvelable</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Programmation pluriannuelle de l’énergie (PPE):</p>
<ul>
<li>
<p>Production de biogaz à hauteur de 24 à 32 TWh en 2028 (4 à 6 fois la production de 2017)</p>
</li>
<li>
<p>Production de chaleur renouvelable : 196 TWh en 2023 ; 218 à 247 TWh en 2028</p>
</li>
<li>
<p>Capacités de production d’électricité renouvelables installées: 73,5 GW en 2023, soit + 50 % par rapport à 2017 ; 101 à 113 GW en 2028, soit x2 par rapport à 2017</p>
</li>
</ul>
', 'MWh', false, 'Production annuelle d’ENR du territoire hors hydroélectrique (MWh / an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_7', 'eci', '7', null, 'Part des DMA envoyée pour la réutilisation, le recyclage et la valorisation organique ou énergétique (%)', '<p>Poids des DMA envoyés pour la réutilisation, le recyclage ou la valorisation / Poids des DMA produits sur le territoire.</p>
<p>Il est possible de détailler cet indicateur par voie de valorisation si un suivi plus fin est souhaité. Exemples : DMA envoyés vers les recycleries, les usines de compostage, la méthanisation, etc.</p>
', '%', false, 'Part des DMA envoyée pour la réutilisation, le recyclage et la valorisation organique ou énergétique (%)', null, '<p>Enquête collecte de l&#x27;ADEME (sur les zones couvertes en fonction des années). Suivi interne de la collectivité.</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_3.2', 'crte', '3.2', null, 'Production annuelle d’énergie hydroélectrique du territoire (MWh / an)', '<p><strong>Définition:</strong>
Production annuelle d’énergie renouvelable sur le territoire toutes sources confondues et selon les exigences réglementaires des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial), c&#x27;est à dire incluant les filières de production d’électricité (éolien terrestre, solaire photovoltaïque, solaire thermodynamique, biomasse solide, biogaz, géothermie), de chaleur (biomasse solide, pompes à chaleur, géothermie, solaire thermique, biogaz), de biométhane et de biocarburants.</p>
<p>La production d’électricité d’origine hydraulique est suivie à part pour éviter l’effet statistique écrasant des grandes installations hydroélectriques par rapport aux autres ENR.</p>
<p><strong>Modalités de calcul:</strong>
Somme de la production d’énergie renouvelable par filière et par type d’énergie (électricité, chaleur, biométhane et biocarburants) :</p>
<p>ELECTRICITÉ</p>
<p>• éolien terrestre</p>
<p>• solaire photovoltaïque et thermodynamique</p>
<p>• biomasse solide</p>
<p>• biogaz</p>
<p>• géothermie</p>
<p>Hors hydroélectrique</p>
<p>CHALEUR</p>
<p>• biomasse solide</p>
<p>• pompes à chaleur</p>
<p>• géothermie</p>
<p>• solaire thermique</p>
<p>• biogaz</p>
<p>BIOMETHANE / BIOCARBURANTS</p>
<p>Par convention, 50 % de la chaleur produite par l’incinération des déchets est considérée issue de déchets urbains renouvelables (source DGEC, dans ses bilans).</p>
<p>L&#x27;électricité produite par cogénération via incinération des déchets en mélange compte pour 50 % comme une énergie renouvelable (biomasse solide).</p>
<p>Les pompes à chaleur prise en compte sont les pompes à chaleur eau/eau, sol/eau, sol/sol avec une efficacité énergétique ≥ 126 % (PAC basse température) et une efficacité énergétique ≥ 111 % (PAC moyenne ou haute température) (exigences du crédit d’impôt pour la transition énergétique 2018). La cogénération à partir d&#x27;énergie fossile n&#x27;est pas prise en compte.</p>
<p>La production annuelle d’énergie hydroélectrique sur le territoire est comptabilisée à part.</p>
<p><strong>Sources:</strong>
Observatoires régionaux de l’énergie, du climat et de l’air</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre le changement climatique</p>
<p><strong>Politique publique:</strong>
Transition énergétique</p>
<p><strong>Objectif stratégique:</strong>
Augmenter la production d’énergie renouvelable</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Programmation pluriannuelle de l’énergie (PPE):</p>
<ul>
<li>
<p>Production de biogaz à hauteur de 24 à 32 TWh en 2028 (4 à 6 fois la production de 2017)</p>
</li>
<li>
<p>Production de chaleur renouvelable : 196 TWh en 2023 ; 218 à 247 TWh en 2028</p>
</li>
<li>
<p>Capacités de production d’électricité renouvelables installées: 73,5 GW en 2023, soit + 50 % par rapport à 2017 ; 101 à 113 GW en 2028, soit x2 par rapport à 2017</p>
</li>
</ul>
', 'MWh', false, 'Production annuelle d’énergie hydroélectrique du territoire (MWh / an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_6.d', 'cae', '6.d', null, 'Production de déchets occasionnels (kg/hab)', '<p>Composante de l&#x27;indicateur 6a:</p>
<p>Production de déchets ménagers et assimilés (avec déblais et gravats) par habitant (kg/hab.an)</p>
<p>: encombrants, déchets verts, déblais et gravats…</p>
', 'kg/hab', false, 'Production de déchets occasionnels (kg/hab)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_5.1', 'crte', '5.1', null, 'Part modale des modes actifs et transports en commun dans les déplacements domicile-travail', '<p><strong>Définition:</strong>
Proportion des déplacements domicile-travail effectués selon un mode de déplacement actif, i.e faisant appel à l’énergie musculaire telle que la marche à pied et le vélo, mais aussi la trottinette, les rollers, etc ; ou en transport en commun.</p>
<p><strong>Modalités de calcul:</strong>
La part des transports en commun et en mode actif dans les déplacements domicile-travail doit être calculée en divisant le nombre de trajet domicile travail effectué sur le territoire en utilisant les transports en commun ou les modes actifs en tant que principal moyen pour se rendre au travail (numérateur), par tous les trajets pour se rendre au travail, quel que soit le mode (dénominateur). Le résultat doit être ensuite multiplié par 100 et exprimé en pourcentage.</p>
<p>Dans le cas où plusieurs modes sont utilisés, l’indicateur doit refléter le principal mode de déplacement, en fonction soit de la durée du trajet avec le mode en question, soit de la distance parcourue en utilisant ce mode.</p>
<p><strong>Sources:</strong>
INSEE (Recensement population - déplacement domicile-travail) - données communales à agréger</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre le changement climatique</p>
<p><strong>Politique publique:</strong>
Mobilité</p>
<p><strong>Objectif stratégique:</strong>
Décarboner la mobilité</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: SNBC : 0 émission liées à la mobilité en 2050.</p>
<p>Loi d’orientation des mobilités (LOM):</p>
<ul>
<li>Réduire de 37,5 % les émissions de CO2 liées à la mobilité en 2030 - interdiction de la vente de voitures utilisant des énergies fossiles carbonées d&#x27;ici 2040 - Tripler la part modale du vélo d’ici 2024 (de 3 % à 9 % des déplacements quotidiens)</li>
</ul>
', '%', false, 'Part modale des modes actifs et transports en commun dans les déplacements domicile-travail', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_9.1', 'crte', '9.1', null, 'Part des cours d’eau en bon état écologique (%)', '<p><strong>Définition:</strong>
Proportion des cours d’eau de surface dont l’état écologique est bon ou très bon</p>
<p><strong>Modalités de calcul:</strong>
Nombre de masses d’eau en bon état et très bon état écologique comprises dans le territoire sur le nombre total de masses d’eau du territoire. (Une masse d’eau est comprise dans le territoire si plus de 1 % de la masse d’eau est dans le territoire)</p>
<p><strong>Sources:</strong>
Données de la dernière évaluation de l’état des eaux DCE publiée sur le site internet de l’agence de l’eau (Données masse d’eau par masse d’eau).</p>
<p><strong>Périodicité:</strong>
L’évaluation de l’état des eaux est publiée tous les 6 ans lors de l’état des lieux DCE du bassin</p>
<p><strong>Objectif environnemental associé:</strong>
Gestion de la ressource en eau</p>
<p><strong>Politique publique:</strong>
Eau</p>
<p><strong>Objectif stratégique:</strong>
Restaurer les milieux aquatiques</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Directive-cadre sur l’eau</p>
', '%', false, 'Part des cours d’eau en bon état écologique (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_27', 'eci', '27', null, 'Part d''eau potable économisée (%)', '<p>Mesure de consommation d&#x27;eau sur le territoire de l&#x27;Année N / Mesure de consommation d&#x27;eau sur le territoire de l&#x27;Année N-X (périodicité définie par la collectivité).</p>
<p>Cet indicateur est pertinent si la collectivité choisit l&#x27;eau comme un enjeu fort pour le territoire et y associe des actions. Le choix de la périodicité permet de suivre l&#x27;impact d&#x27;une action ou d&#x27;une série d&#x27;actions.</p>
', '%', false, 'Part d''eau potable économisée (%)', null, '<p>Gestionnaire du réseau d&#x27;eau portable</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_8.1', 'crte', '8.1', null, 'Taux de fuite des réseaux d’eau du territoire (%)', '<p><strong>Définition:</strong>
Il s’agit du ratio entre, d’une part le volume consommé autorisé augmenté des volumes vendus en gros à d’autres services publics d’eau potable et, d’autre part le volume produit augmenté des volumes achetés en gros à d’autres services publics d’eau potable.</p>
<p><strong>Modalités de calcul:</strong>
Rapport entre le volume d&#x27;eau introduit dans le réseau de distribution et le volume d&#x27;eau consommé, soit 100 - (Volume comptabilisé domestique + Volume comptabilisé non domestique (facultatif) + Volume consommé sans comptage (facultatif) + Volume de service (facultatif) + Volume vendu à d&#x27;autres services d&#x27;eau potable (exporté) ) /( Volume produit + Volume acheté à d&#x27;autres services d&#x27;eau potable (importé) ) x 100/</p>
<a href="https://www.services.eaufrance.fr/docs/indicateurs/P104.3_fiche.pdf">
Voir fiche détaillée
</a>
<p><strong>Sources:</strong>
Observatoire des données sur les services publics d&#x27;eau et d&#x27;assainissement (SISPEA) – indicateur P 104.3</p>
<p>Voir en lien avec les agences de l’eau.</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Gestion de la ressource en eau</p>
<p><strong>Politique publique:</strong>
Eau</p>
<p><strong>Objectif stratégique:</strong>
Réduire les consommations d’eau</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Le décret 2012-97 du 27 janvier 2012 issu de l’engagement 111 du Grenelle de l’Environnement définit un rendement seuil dont le calcul est adapté à chaque situation.</p>
<p><strong>Données de référence:</strong></p>
<a href="https://www.services.eaufrance.fr/docs/synthese/rapports/Rapport_Sispea_2017_VF.pdf">
Voir dernier rapport SISPEA
</a>
<p>Le volume de pertes en eau par fuite sur le réseau (qui inclut la partie des branchements avant compteur) est de l&#x27;ordre de 20 % du volume introduit dans le réseau de distribution (c’est-à-dire la somme des volumes produits et volumes importés).</p>
', '%', false, 'Taux de fuite des réseaux d’eau du territoire (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_12.1', 'crte', '12.1', null, 'Indicateur de fragmentation des milieux naturels (km²)', '<p><strong>Définition:</strong>
L’indicateur de fragmentation des espaces naturels mobilise la méthode de la taille effective de maille (méthode CUT ou CBC).</p>
<p>Cette méthode qualifie la fragmentation du paysage et se base sur la probabilité que deux points choisis au hasard sur un territoire ne soient pas séparés par une barrière (route ou zone urbanisée par exemple), ce qui peut être interprété comme la possibilité que deux animaux de la même espèce puissent se rencontrer sur le territoire sans avoir à franchir un obstacle. La valeur de l’indicateur diminue avec un nombre croissant de barrières sur le territoire.</p>
<p><strong>Modalités de calcul:</strong>
Somme des carrés des surfaces de l’ensemble des patchs du territoire d’étude (c’est-à-dire des morceaux d’espaces naturels non fragmentés) rapporté à la surface totale du territoire d’étude.</p>
<p><strong>Sources:</strong>
base de données sur l’occupation des sols pour identifier les espaces naturels et les éléments fragmentant : CORINE Land Cover)</p>
<p>à croiser avec la BD Carto de l’IGN pour les autres éléments fragmentant (routes, voies ferrées, canaux…)</p>
<p>Mise à disposition par le CEREMA – sous réserve</p>
<p><strong>Périodicité:</strong>
CORINE Land Cover : Tous les 6 ans environ.</p>
<p>(D’autres base de données d’occupation des sols à fréquence de mise à jour plus élevée pourraient être utilisées, comme OSO par exemple)</p>
<p>BD Carto de l’IGN : mise à jour régulièrement et quasiment en continu</p>
<p><strong>Objectif environnemental associé:</strong>
Biodiversité, protection des espaces naturels, agricoles et forestiers, protection des espèces.</p>
<p><strong>Politique publique:</strong>
Préservation de la biodiversité, Trame verte et bleue</p>
<p><strong>Objectif stratégique:</strong>
Restaurer et renforcer la biodiversité végétale et animale via les continuités écologiques</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Action 39 du Plan biodiversité de 2018 : Viser la résorption de 20 des principaux points noirs (obstacles aux continuités écologiques) identifiés dans les schémas régionaux de cohérence écologique (SRADDET maintenant)</p>
', 'km²', false, 'Indicateur de fragmentation des milieux naturels (km²)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_12', 'eci', '12', null, 'Nombre de filières animés par la collectivité ou ses partenaires pour la prise en charge des déchets (BTP, DAE…) (nombre)', '<p>La collectivité définit le périmètre des filières pertinent pour le territoire. L&#x27;animation sous-entend des actions allant de soutien au dialogue jusqu&#x27;à l&#x27;accompagnement d&#x27;action pour améliorer la dynamique déchets des acteurs économiques (prévention, amélioration de tri, de collecte et de valorisation, etc.)</p>
', 'nombre', false, 'Nombre de filières animés par la collectivité ou ses partenaires pour la prise en charge des déchets (BTP, DAE…) (nombre)', null, '<p>Suivi interne en lien avec les services ou partenaires concernés</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_9', 'eci', '9', null, 'Part de DMA bénéficiant d''un mode de transport à faible impact (%)', '<p>Mode de transport à faible impact : véhicules électriques, mobilité douce ou active, équipements utilisant la voie fluviale, la voie ferroviaire.</p>
<p>Tonnes de DMA transportés par les équipements de transport à faible impact / Tonnes de DMA transportés</p>
', '%', false, 'Part de DMA bénéficiant d''un mode de transport à faible impact (%)', null, '<p>Rapport annuel déchets</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_7.1', 'crte', '7.1', null, 'Population située dans une zone à risque naturel élevé', '<p><strong>Définition:</strong>
Part de la population dans une zone à risque naturel fort ou très fort.</p>
<p><strong>Modalités de calcul:</strong>
Part, dans la population totale du territoire, de la population résidant dans une zone classée à risque naturel fort ou très fort, au sens notamment des plans de prévention des risques, des cartes TRI (territoires à risques importants d’inondations) et des porter à connaissance.</p>
<p>Les risques naturels pris en compte sont :</p>
<ul>
<li>
<p>Les inondations, y compris par submersion marine</p>
</li>
<li>
<p>Les mouvements de terrain, ce qui englobe les cavités souterraines, les glissements de terrain et les éboulements rocheux</p>
</li>
</ul>
<p><strong>Sources:</strong>
Fichiers fonciers du Cerema accessibles sur le site datafoncier.cerema.fr (informations à la parcelle sur la population d’un territoire) à croiser avec Fichiers des zones d’aléas forts et très forts des cartographies de PPR, TRI, PAC - disponibles auprès des DDT</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Adaptation au changement climatique</p>
<p><strong>Politique publique:</strong>
Prévention des risques</p>
<p><strong>Objectif stratégique:</strong>
Réduire la vulnérabilité vis-à-vis de ces risques naturels ou a minima veiller à ne pas l’accroître, faire émerger des opportunités</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Baisse de la vulnérabilité, ou a minima pas d’accroissement de la vulnérabilité du territoire</p>
<p><strong>Objectif opérationnel local fixé par les documents de référence (SRADDET, PCAET, etc.):</strong>
Voir les PGRI et SLGRI</p>
', '%', false, 'Population située dans une zone à risque naturel élevé', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_24', 'eci', '24', null, 'Proportion d''énergie fossile consommé par rapport aux énergies renouvelables consommées (%)', '<p>MWh d&#x27;énergie fossile consommée sur le territoire/MWh d&#x27;énergie renouvelable consommée sur le territoire.</p>
<p>Cet indicateur complète l&#x27;indicateur &quot;Part des sources d&#x27;énergies renouvelables (ENR) locales (%)&quot; pour établir une vision sur la part des ENR locales dans le mix énergétique.</p>
<p>Cet indicateur est à concidérer car la production d&#x27;énergie génère la consommation de ressources naturelles sur le terrioire et en-déhors du territoire de la collectivité.</p>
', '%', false, 'Proportion d''énergie fossile consommé par rapport aux énergies renouvelables consommées (%)', null, '<p>Observatoires énergie, PCAET</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_1', 'eci', '1', null, 'Part du budget consacrée à la politique Economie Circulaire dans le budget global (%)', '<p>La collectivité définit le périmètre de sa politique Economie Circulaire transversale avec d&#x27;autres politiques et stratégies.</p>
<p>La méthodologie &quot;Evaluation climat des budgets des collectivités territoriales&quot; peut être utilisée pour définir le périmetre du budget Economie Circualire.</p>
<p>Le budget Economie Circulaire peut inclure : https://www.i4ce.org/go_project/cadre-evaluation-climat-budget-collectivites/</p>
<ul>
<li>
<p>les salaires (ou part des salaires) des salariés travaillant sur l&#x27;Economie Circulaire,</p>
</li>
<li>
<p>le coût des formations sur l&#x27;Economie Circulaire,</p>
</li>
<li>
<p>les soutien financier et non-financier des acteurs du territoires et leurs projets pour l&#x27;Economie Circulaire,</p>
</li>
<li>
<p>le financement d&#x27;évènements consacrés à l&#x27;Economie Circulaire,</p>
</li>
<li>
<p>le financement des projets propres à la collectivité</p>
</li>
</ul>
<p>-etc.</p>
<p>Le budget peut inclure des instruments financiers mobilisant des financement public d&#x27;autres institutions, voire des financements privés.</p>
<p>Les collectivités utilisant la comptabilité analytique peuvent créer un compte analytique associé.</p>
', '%', false, 'Part du budget consacrée à la politique Economie Circulaire dans le budget global (%)', null, '<p>Budget de la collectivité</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_28', 'eci', '28', null, 'Proportion de l''activité de réemploi et/ou de réutilisation dans l''activité économique (%)', '<p>Nombre d&#x27;entreprises de réemploi et/ou de réutilisation (ex. SINOE Structures du réemploi et/ou de réutilisation) / nombre total d&#x27;entreprises sur le territoire</p>
', '%', false, 'Proportion de l''activité de réemploi et/ou de réutilisation dans l''activité économique (%)', null, '<ul>
<li>
<a href="https://www.sinoe.org/filtres/index/thematique#table-annuaire">
Annuaire SINOE Structures du réemploi et/ou de réutilisation
</a>
</li>
<li>SIRENE</li>
</ul>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_6', 'eci', '6', null, 'Part de déchets soumis à la collecte séparée dans les Ordures Ménagers et Assimilés (OMR) et la benne tout venant déchetterie (%)', '<p>Poids de déchets soumis à la collecte séparée (d&#x27;après le règlement de collecte) dans les OMR  et de la benne tout-venant des déchèteries / Poids des OMR et de la benne tout venant des déchèteries.</p>
<p>Méthode d&#x27;échantillonnage : https://www.sinoe.org/contrib/ademe/carademe/pages/guide_OMCS_echant1.php</p>
', '%', false, 'Part de déchets soumis à la collecte séparée dans les Ordures Ménagers et Assimilés (OMR) et la benne tout venant déchetterie (%)', null, '<p>Echantillonnage des OMR et benne tour venant de déchetterie</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_23', 'eci', '23', null, 'Ratio d''évolution de terres artificialisés vs. terres agricoles et/ou naturelles et/ou forestières (%)', '<p>Nombre d&#x27;hectares artificialisés total / Nombre d&#x27;hectares des terres agricoles, naturelles et forestières.</p>
<p>Dans la logique du Zéro Artificialisation Net.</p>
', '%', false, 'Ratio d''évolution de terres artificialisés vs. terres agricoles et/ou naturelles et/ou forestières (%)', null, '<p>Suivi Urbanisme</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_13', 'eci', '13', null, 'Nombre de boucles locales d''économie circulaire mises en place dans les 4 dernières années  (nombre)', '<p>Une boucle locale d’économie circulaire vise à conserver le plus longtemps possible dans l’économie (locale) la valeur d’un produit, de ses composants ou des matières (des ressources). Ainsi on limite la génération de déchets et  développe plusieurs échanges de produits ou matière dans le cycle de vie ou de la chaine de valeur notamment via le partage, la réparation, le réemploi, la réutilisation, la rénovation, la refabrication et le recyclage.</p>
<p>Une boucle locale d&#x27;économie circulaire respecte la hiérarchie des valorisations/traitement des déchets.</p>
<p>Elle contribue au développement d’activité économique (durable, faible en carbone et réduction de l’utilisation des ressources naturelles) et d’emplois locaux (ou de proximité).</p>
<p>L&#x27;indicateur prend en compte les boucles locales opérationnelles mises en place depuis 4 ans.</p>
', 'nombre', false, 'Nombre de boucles locales d''économie circulaire mises en place dans les 4 dernières années  (nombre)', null, '<p>Suivi interne en lien avec les services ou partenaires concernés</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_21.c', 'cae', '21.c', null, 'Consommation moyenne d''eau dans les bâtiments "administration" (l/m².an)', '<p>Composante de l&#x27;indicateur 21a:</p>
<p>Consommation moyenne d&#x27;eau dans les bâtiments de la collectivité (l/m².an).</p>
', 'l/m².an', false, 'Consommation moyenne d''eau dans les bâtiments "administration" (l/m².an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_29', 'eci', '29', null, 'Proportion de l''activité de l''allongement de la durée d''usage dans l''activité économique (%)', '<p>Nombre d&#x27;entreprises ayant un code NAF associé à la réparation (véhicules compris) / nombre total d&#x27;entreprises sur le territoire.</p>
<p>Les codes NAF/prodfre/SIREN et sources de données sont identifiés dans la liste &quot;Pilier Allongement de la durée</p>
<p>d&#x27;usage&quot; - Méthodologie de quantification de l’emploi dans l’économie circulaire - P. 44 - 45. https://www.statistiques.developpement-durable.gouv.fr/sites/default/files/2018-10/document-travail-29-methodologie-quantification-emploi-ecocirculaire-fevrier2017.pdf</p>
', '%', false, 'Proportion de l''activité de l''allongement de la durée d''usage dans l''activité économique (%)', null, '<p>SIRENE. Actuellement un traitement de données nécessaire.</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_37', 'eci', '37', null, 'Dépense annuelle consacrée à la gestion des déchets (€/habitant)', '<p>Voir la méthode de calcul de la matrice des coûts. Méthodologie sur SINOE Déchets : https://www.sinoe.org/thematiques/consult/ss-theme/25</p>
', 'euros/habitant', false, 'Dépense annuelle consacrée à la gestion des déchets (€/habitant)', null, '<p>Matrice des coûts</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_21', 'eci', '21', null, 'Gaspillage alimentaire de la restauration collective sous la compétence de la collectivité (g/repas servi)', '<p>Quantité de déchets alimentaires produits par la restauration collective publique du territoire (d&#x27;après l&#x27;enquête INSEE sur les déchets non-dangereux en restauration collective) / nombre de repas servis par  la restauration collective publique du territoire. Objectif légal AGEC et Climat et Résilience.</p>
', 'g/repas servi', false, 'Gaspillage alimentaire de la restauration collective sous la compétence de la collectivité (g/repas servi)', null, '<p>Les restaurants collectifs dont la collectivité a la charge</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_11', 'eci', '11', null, 'Emissions GES de la collecte des DMA sur le territoire (eqtCO2/tonne de déchets)', '<p>Méthode de calcul:</p>
<p>Étape 1 : Constitution d’un catalogue de facteurs d’efficacité énergétique et de facteurs d’émissions</p>
<p>Étape 2 : Établissement d’hypothèses sur les distances parcourues</p>
<p>Étape 3 : Calcul des émissions de la collecte DMA</p>
<p>Cette méthode peut s&#x27;appliquer au calcul d&#x27;un indicateur d&#x27;émission du transport de touts les déchets du territoire en y ajoutant :</p>
<p>Étape 3 : Calcul des émissions de chaque filière</p>
<p>Étape 4 : Consolidation des résultats de calcul pour l’ensemble des déchets transportés</p>
<p>Voir la méthodologie détaillée et données dans l&#x27;étude &quot;TRANSPORT ET LOGISTIQUE DES DECHETS: ENJEUX ET EVOLUTIONS DU TRANSPORT ET DE LA LOGISTIQUE DES DECHETS&quot;, 2014, ADEME</p>
', 'eqtCO2', false, 'Emissions GES de la collecte des DMA sur le territoire (eqtCO2/tonne de déchets)', null, '<p>Suivi interne du kilométrage parcouru par les véhicule de collecte. Fiches techniques des véhicules pour les émissions.</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_34', 'eci', '34', null, 'Nombre d''entreprises ou établissements sensibilisées ou accompagnées sur les questions de l''économie de la fonctionnalité et de la coopération (nombre)', '<p>Pour le périmetre de l&#x27;économie de la fonctionnalité et de la coopération - Panorama national et pistes d&#x27;action pour l&#x27;économie de la fonctionnalité et de la coopération (https://librairie.ademe.fr/changement-climatique-et-energie/23-panorama-national-et-pistes-d-action-pour-l-economie-de-la-fonctionnalite.html)</p>
', 'nombre d''entreprises et d''établissements', false, 'Nombre d''entreprises ou établissements sensibilisées ou accompagnées sur les questions de l''économie de la fonctionnalité et de la coopération (nombre)', null, '<p>Suivi interne ou suivi par les acteurs d&#x27;animation en économie de la fonctionnalité et de coopération</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_36', 'eci', '36', null, 'Effet de levier d''accompagnement financier des projets de recherche, d''innovation et d''expérimentation en matière d''Economie Circulaire  (1€ public pour X € privé)', '<p>[Total des budgets de projets Economie Circulaire soutenus par la collectivité]-[Total d&#x27;aide financière apportée aux projets Economie Circulaire par la collectivité] / [Total d&#x27;aide financière apportée aux projets Economie Circulaire par la collectivité]</p>
', 'Euros', false, 'Effet de levier d''accompagnement financier des projets de recherche, d''innovation et d''expérimentation en matière d''Economie Circulaire  (1€ public pour X € privé)', null, '<p>Conventions de financement</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_22', 'eci', '22', null, 'Part des restaurants collectifs sous la compétence de la collectivité engagée dans une démarche de réduction du gaspillage alimentaire (%)', '<p>Nombre restaurants collectifs engagés dans une démarche de réduction du gaspillage alimentaire / Nombre de restaurants collectifs total. Pour affiner son action la collectivité peut choisir de distinguer le type d&#x27;établissement (écoles, EPHAD, hôpital, etc.).</p>
', 'nombre', false, 'Part des restaurants collectifs sous la compétence de la collectivité engagée dans une démarche de réduction du gaspillage alimentaire (%)', null, '<p>Les restaurants collectifs dont la collectivité a la charge</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_32', 'eci', '32', null, 'Part de la population de la collectivité couverte par la Tarification Incitative', '<p>% de la population de la collectivité couverte par la TI</p>
', '%', false, 'Part de la population de la collectivité couverte par la Tarification Incitative', null, '', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_33', 'eci', '33', null, 'Nombre d''actions de la collectivité en économie de la fonctionnalité et de la coopération (nombre)', '<p>Pour le périmetre de l&#x27;économie de la fonctionnalité et de la coopération - Panorama national et pistes d&#x27;action pour l&#x27;économie de la fonctionnalité (https://librairie.ademe.fr/changement-climatique-et-energie/23-panorama-national-et-pistes-d-action-pour-l-economie-de-la-fonctionnalite.html)</p>
<p>Les actions : actions de sencibilisation, les commandes publiques, les projets coopératifs, actions collectives.</p>
', 'nombre d''actions', false, 'Nombre d''actions de la collectivité en économie de la fonctionnalité et de la coopération (nombre)', null, '<p>Suivi interne</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_3', 'eci', '3', null, 'Part de formations Economie Circulaire dans le programme de formation de la collectivité (nombre)', '<p>Nombre de formations en Economie Circulaire / Nombre total de formations suivis par les agents *100</p>
', 'nombre', false, 'Part de formations Economie Circulaire dans le programme de formation de la collectivité (nombre)', null, '<p>Plan de formation</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_25', 'eci', '25', null, 'Part des sources d''énergie renouvelable (ENR) locales (%)', '<p>MWh d&#x27;énergies renouvelables consommés sur le territoire / MWh d&#x27;énergies renouvelables produits sur le territoire *100</p>
<p>Cet indicateur est à concidérer car la production d&#x27;énergie génère la consommation de ressources naturelles sur le terrioire et en-déhors du territoire de la collectivité.</p>
', '%', false, 'Part des sources d''énergie renouvelable (ENR) locales (%)', null, '<p>Observatoires énergie, PCAET</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_21.d', 'cae', '21.d', null, 'Consommation moyenne d''eau dans les bâtiments"culture/sport" (l/m².an)', '<p>Composante de l&#x27;indicateur 21a:</p>
<p>Consommation moyenne d&#x27;eau dans les bâtiments de la collectivité (l/m².an).</p>
', 'l/m².an', false, 'Consommation moyenne d''eau dans les bâtiments"culture/sport" (l/m².an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_14', 'eci', '14', null, 'Pourcentage de contrat d''achats publiques de la collectivité comportant au moins une considération environnementale (%)', '<p>% de contrat en nombre ou % de contrat en montant (au choix). Les contrat sur une année civile sont pris en compte.</p>
<p>Voir la notion de la concidération environnementale au PNAAPD 2021-2025 - objectif 100% des marchés comportent une considération environnementale.</p>
', '% de contrat en nombre ou % de contrat en montant (au choix)', false, 'Pourcentage de contrat d''achats publiques de la collectivité comportant au moins une considération environnementale (%)', null, '<p>Service Achats ou Comptabilité</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_18', 'eci', '18', null, 'Nombre de synergies d''Ecologie Industrielle et Territoriale (EIT) opérationnelles sur le territoire (nombre)', '<p>Synergie est considérée comme opérationnelle à partir d&#x27;au moins un échange matière réalisé ou d&#x27;un service de mutualisation utilisé par au moins deux entités</p>
', 'nombre', false, 'Nombre de synergies d''Ecologie Industrielle et Territoriale (EIT) opérationnelles sur le territoire (nombre)', null, '<p>Suivi interne.</p>
<p>Données du réseau SYNAPSE: https://www.economiecirculaire.org/eit/h/le-reseau-synapse.html</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_2', 'eci', '2', null, 'Part des services de la collectivité formés à l''Economie Circulaire (%)', '<p>Nombre de services avec au moins un salarié actuellement présent dans son poste ayant été formé à l&#x27;Economie Circulaire dans les 4 dernières années/ Nombre de services de la collectivité * 100. Les services incluent toutes les thématiques et secteurs, y compris fonctions support.</p>
', '%', false, 'Part des services de la collectivité formés à l''Economie Circulaire (%)', null, '<p>Attestations de formations Economie Circulaire. Organigramme de la collectivité.</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_35', 'eci', '35', null, 'Nombre de projets de recherche, d''innovation ou d''expérimentation accompagnés financièrement ou non-financièrement par la collectivité (nombre)', '<p>Les projets peuvent porter sur des sujets techniques, technologiques, organisationnels ou de modèles d&#x27;affires. Si la collectivité souhaite aller plus loin dans le suivi, elle peut prendre en compte l&#x27;ampleur des projets (budgets, nombre de partenaires, etc.)</p>
', 'nombre de projets', false, 'Nombre de projets de recherche, d''innovation ou d''expérimentation accompagnés financièrement ou non-financièrement par la collectivité (nombre)', null, '<p>Suivi interne</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_17', 'eci', '17', null, 'Part d''entreprises et d''établissements ayant été formées à l''écoconception durant les 4 dernières années (%)', '<p>Nombre d&#x27;entreprises et d&#x27;établissements ayant été formées à l&#x27;écoconception / Nombre d&#x27;entreprises et d&#x27;établissements sur le territoire</p>
', '%', false, 'Part d''entreprises et d''établissements ayant été formées à l''écoconception durant les 4 dernières années (%)', null, '<p>Liste des stagiaires des formations fournis par les organismes d&#x27;enseignement</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_19', 'eci', '19', null, 'Nombre d''entreprises engagées dans les synergie d''EIT (nombre)', '<p>Synergie est considérée comme opérationnelle à partir d&#x27;au moins un échange matière réalisé ou d&#x27;un service de mutualisation utilisé par au moins deux entités.</p>
', 'nombre d''entreprises', false, 'Nombre d''entreprises engagées dans les synergie d''EIT (nombre)', null, '<p>Suivi interne.</p>
<p>Données du réseau SYNAPSE: https://www.economiecirculaire.org/eit/h/le-reseau-synapse.html</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_10', 'eci', '10', null, 'Emissions GES des Installations de Stockage de Déchets Non-Dangereux (ISDND) (eqtCO2/tonne de déchets entrant)', '<p>Equivalent en tonnes de CO2 par an emis par l&#x27;ISDND / volume de déchets entrants en tonnes</p>
', 'eqtCO2/tonne de déchets entrant', false, 'Emissions GES des Installations de Stockage de Déchets Non-Dangereux (ISDND) (eqtCO2/tonne de déchets entrant)', null, '<p>Gestionnaire des installations</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_30', 'eci', '30', null, 'Part des compétences obligatoires et facultatives exercées par la collectivité (mobilité, urbanisme, etc.) pour lesquelles l’équipe Economie Circulaire a co-construit au moins une action favorisant l’Economie Circulaire dans les 4 dernières années', '<p>% des compétences obligatoires et facultatives exercées par la collectivité (mobilité, urbanisme, etc.) pour lesquelles l’équipe Economie Circulaire a co-construit au moins une action favorisant l’Economie Circulaire dans les 4 dernières années</p>
', '%', false, 'Part des compétences obligatoires et facultatives exercées par la collectivité (mobilité, urbanisme, etc.) pour lesquelles l’équipe Economie Circulaire a co-construit au moins une action favorisant l’Economie Circulaire dans les 4 dernières années', null, '', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_31', 'eci', '31', null, 'Part des stratégies ou des politiques dans lesquelles l’équipe Economie Circulaire a été associée pour leur conception', '<p>% des stratégies ou des politiques dans lesquelles l’équipe Economie Circulaire a été associée pour leur conception</p>
', '%', false, 'Part des stratégies ou des politiques dans lesquelles l’équipe Economie Circulaire a été associée pour leur conception', null, '', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_26', 'eci', '26', null, 'Perte en eau du réseau (%)', '<p>Volume d&#x27;eau consommée sur le territoire/ volume d&#x27;eau dirigée vers le territoire</p>
', '%', false, 'Perte en eau du réseau (%)', null, '<p>Gestionnaire du réseau d&#x27;eau potable</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_20', 'eci', '20', null, 'Part de l’alimentation sous signe de qualité en restauration collective sous la compétence de la collectivité (%)', '<p>Produits alimentaires (tn ou kg) achetés sous signe de qualité (AOP, IGP, STG, Agriculture Biologique) / Volume glogal de produits alimentaires achetés (tn ou kg).</p>
<p>Signes de qualité : https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/Signe-de-qualite</p>
<p>Objectif légal Egalim.</p>
', '%', false, 'Part de l’alimentation sous signe de qualité en restauration collective sous la compétence de la collectivité (%)', null, '<p>Suivi auprès des restaurants collectifs dont la collectivité a la charge. Tableaux de suivi des approvisionnements (obligation légale).</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'eci_8', 'eci', '8', null, 'Taux de mise en décharge de DMA (%)', '<p>Poids de déchets envoyés en décharge / Poids de déchets produits sur le territoire</p>
', '%', false, 'Taux de mise en décharge de DMA (%)', null, '<p>Enquête collecte de l&#x27;ADEME (sur les zones couvertes en fonction des années)</p>
', null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_21.a', 'cae', '21.a', null, 'Consommation moyenne d''eau dans les bâtiments de la collectivité (l/m².an)', '<p>L&#x27;objectif est de mesurer l&#x27;impact des mesures de limitation des consommations d&#x27;eau au fil des ans dans les bâtiments de la collectivités (hors piscine).</p>
<p>Des valeurs moyennes comparatives pour 3 catégories de bâtiments (dans la catégorie &quot;culture/sport&quot;, les piscines ne sont pas comptées) sont proposées pour aider le conseiller à situer la collectivité (regroupement effectué à partir de valeurs recueillies via Display, 2012).</p>
', 'l/m².an', false, 'Consommation moyenne d''eau dans les bâtiments de la collectivité (l/m².an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_21.b', 'cae', '21.b', null, 'Consommation moyenne d''eau dans les bâtiments "enseignement/crèche" (l/m².an)', '<p>Composante de l&#x27;indicateur 21a:</p>
<p>Consommation moyenne d&#x27;eau dans les bâtiments de la collectivité (l/m².an).</p>
', 'l/m².an', false, 'Consommation moyenne d''eau dans les bâtiments "enseignement/crèche" (l/m².an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_17.a', 'cae', '17.a', null, 'Production d''électricité renouvelable - patrimoine collectivité (MWh)', '<p>L&#x27;indicateur mesure la production d&#x27;électricité d&#x27;origine renouvelable (installations financées en totalité ou en majorité par la collectivité et de sa compétence : éolien, photovoltaïque, hydraulique, marémotrice, géothermie haute température, électricité issue de l&#x27;incinération des déchets à hauteur de 50%, cogénération biomasse/biogaz...).</p>
', 'MWh', false, 'Production d''électricité renouvelable - patrimoine collectivité (MWh)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_17.b', 'cae', '17.b', null, 'Taux de production d''électricité renouvelable  - patrimoine collectivité (%)', '<p>Déclinaison de l&#x27;indicateur 17a:</p>
<p>Production d&#x27;électricité renouvelable - patrimoine collectivité (MWh)</p>
<ul>
<li>L&#x27;indicateur mesure le rapport de la production d&#x27;électricité d&#x27;origine renouvelable (installations financées en totalité ou en majorité par la collectivité et de sa compétence : éolien, photovoltaïque, hydraulique, marémotrice, géothermie haute température, électricité issue de l&#x27;incinération des déchets à hauteur de 50%, cogénération biomasse/biogaz...) sur la consommation totale d&#x27;électricité des bâtiments et équipements communaux (y compris l&#x27;éclairage public et les services industriels de la compétence de la collectivité) en énergie finale. Le patrimoine en DSP est inclus si possible.</li>
</ul>
', '%', false, 'Taux de production d''électricité renouvelable  - patrimoine collectivité (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_39', 'cae', '39', null, 'Part de la population active couverte par un PDE/PDA (%)', '<p>L&#x27;indicateur comptabilise le nombre d&#x27;employés couverts par un Plan de Déplacements Entreprise (PDE) et Administration (PDA) sur le territoire et le rapporte à la population active du territoire. Ce chiffre doit être en augmentation chaque année. Des valeurs indicatives limites et cibles sont données, basées sur des données ADEME (enquête nationale 2009 et Poitou-Charentes 2012) et les meilleurs scores des collectivités Cit&#x27;ergie.</p>
', '%', false, 'Part de la population active couverte par un PDE/PDA (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_56', 'cae', '56', null, 'Nombre de dossiers « Habiter mieux » déposés à l’Anah sur le territoire', '<p>L’indicateur mesure le nombre de dossier déposés chaque année auprès de l’ANAH dans le cadre du programme Habiter mieux. Ce programme vise les propriétaires occupants (sous conditions de ressources) et les propriétaires bailleurs.</p>
', 'Non trouvé', false, 'Nombre de dossiers « Habiter mieux » déposés à l’Anah sur le territoire', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_2.k', 'cae', '2.k', null, 'Consommation énergétique de l''industrie hors branche énergie', '<p>Décomposition par secteur réglementaire de l&#x27;indicateur global 2a:</p>
<p>Consommation énergétique globale annuelle du territoire (GWh).</p>
', 'GWh', false, 'Consommation énergétique de l''industrie hors branche énergie', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_7', 'cae', '7', null, 'Recyclage matière et organique des déchets ménagers et assimilés (%)', '<p>Il s’agit de la part (en poids) des déchets ménagers et assimilés (DMA, cf. définition ci-dessus) orientés vers le recyclage matière et organique. Le recyclage consiste en toute opération de valorisation par laquelle les déchets, y compris organiques, sont retraités en substances, matières ou produits pour resservir à leur fonction initiale ou à d’autres fins (définition du code de l’environnement). La valorisation énergétique n&#x27;est pas prise en compte ici.</p>
<p>NB : On mesure les déchets « orientés vers le recyclage », les refus de tri ne sont donc pas déduits. Ne sont pas considérés ici comme « orientés vers le recyclage » les déchets entrant dans des installations de tri mécanobiologique. Pour ces derniers, seuls les flux sortant orientés vers la valorisation organique (compostage ou méthanisation) ou vers le recyclage matière (métaux récupérés) sont à intégrer dans les flux « orientés vers le recyclage ». Les mâchefers valorisés ainsi que les métaux récupérés sur mâchefers ne sont pas intégrés.</p>
', '%', false, 'Recyclage matière et organique des déchets ménagers et assimilés (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_52', 'cae', '52', null, 'Part du budget consacré à des projets de coopération décentralisée en lien avec le climat, l’air ou l’énergie (%)', '<p>L&#x27;indicateur mesure le montant des subventions ou investissements consentis pour les projets de coopération décentralisée, en lien avec le climat, l’air et l’énergie, rapporté au budget total (investissement et fonctionnement) de la collectivité. Pour information, l&#x27;aide publique au développement en France est estimée à 0,38% du RNB en 2017, toutes thématiques confondues (santé, éducation, alimentaire, eau, climat...). Lors du sommet du millénaire de 2000, l&#x27;objectif fixé par la commission européenne était d&#x27;atteindre 0,7 % du RNB en 2015.</p>
', '%', false, 'Part du budget consacré à des projets de coopération décentralisée en lien avec le climat, l’air ou l’énergie (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_54', 'cae', '54', null, 'Nombre de manifestations/actions par an sur le climat l''air et l''énergie', '<p>Il s&#x27;agit du nombre de manifestions/actions de communication menées sur le thème de l&#x27;énergie et du climat. L&#x27;évaluation est différenciée selon la taille de la collectivité. Cet indicateur fait partie d&#x27;un ensemble (indicateurs qualitatifs et quantitatifs).</p>
<p>Valeur limite : 2 (&lt; 3 000 hab) ; 5 (&gt; 3 000 hab) ; 10 (&gt; 50 000 hab)</p>
<p>Les actions importantes peuvent être comptées comme équivalentes à deux actions.</p>
', 'Non trouvé', false, 'Nombre de manifestations/actions par an sur le climat l''air et l''énergie', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_31', 'cae', '31', null, 'Quantité annuelle d''eau/m2 d''espaces verts', '<p>L&#x27;objectif est de mesurer les efforts de la collectivité en matière de limitation des consommations d&#x27;eau pour l&#x27;arrosage de ses espaces verts. Le volume annuel d&#x27;eau est divisé par la surface d&#x27;espaces verts gérés par la collectivité. L&#x27;unité de l&#x27;indicateur est en m3/m2. Les espaces verts sont entendus au sens large, à savoir : parcs et jardins, espaces sportifs végétalisés, ronds-points ou accotement enherbées de la compétence de la collectivité.</p>
', 'Non trouvé', false, 'Quantité annuelle d''eau/m2 d''espaces verts', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_30', 'cae', '30', null, 'Quantité annuelle d''engrais/m2 d''espaces verts', '<p>L&#x27;objectif est de mesurer les efforts de la collectivité en matière de limitation des engrais sur ses espaces verts. La quantité annuelle d&#x27;engrais apportée est divisée par la surface d&#x27;espaces verts gérés par la collectivité. L&#x27;unité de l&#x27;indicateur est fixé selon les possibilités de la collectivité et les produits employés : unité d&#x27;azote/m2, kg/m2, litre/m2, euros/m2...</p>
', 'Non trouvé', false, 'Quantité annuelle d''engrais/m2 d''espaces verts', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_2.a', 'cae', '2.a', null, 'Consommation énergétique globale annuelle du territoire', '<p>Cet indicateur estime la consommation énergétique finale annuelle du territoire, selon les exigences réglementaires des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial).</p>
<p>L&#x27;indicateur est exprimé en GWh.</p>
', 'GWh', false, 'Quantité d''énergie consommée par les activités et les habitants par an', null, null, null, '{energie_et_climat}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_2.b', 'cae', '2.b', null, 'Consommation énergétique annuelle du territoire par habitant', '<p>Pour faciliter les comparaisons, l’indicateur est ramené au nombre d’habitants (population municipale selon l’INSEE). Préciser l&#x27;année de référence en commentaire. L&#x27;évaluation est basée sur l&#x27;évolution de l&#x27;indicateur.</p>
', 'MWh/hab.an', false, 'Consommation énergétique annuelle du territoire par habitant', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_2.c', 'cae', '2.c', null, 'Consommation énergétique annuelle du territoire pour la chaleur et le rafraîchissement', '<p>Décomposition par usage de l&#x27;indicateur 2a:</p>
<p>Consommation énergétique globale annuelle du territoire (GWh)</p>
<ul>
<li>utile aux calculs des taux de production ENR (dénominateur).</li>
</ul>
', 'GWh', false, 'Consommation énergétique annuelle du territoire pour la chaleur et le rafraîchissement', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_2.d', 'cae', '2.d', null, 'Consommation énergétique annuelle du territoire pour l''électricité', '<p>Décomposition par usage de l&#x27;indicateur 2a:</p>
<p>Consommation énergétique globale annuelle du territoire (GWh)</p>
<ul>
<li>utile aux calculs des taux de production ENR (dénominateur).</li>
</ul>
', 'GWh', false, 'Consommation énergétique annuelle du territoire pour l''électricité', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_2.e', 'cae', '2.e', null, 'Consommation énergétique du résidentiel', '<p>Décomposition par secteur réglementaire de l&#x27;indicateur global 2a:</p>
<p>Consommation énergétique globale annuelle du territoire (GWh).</p>
', 'GWh', false, 'Consommation énergétique du résidentiel', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_2.f', 'cae', '2.f', null, 'Consommation énergétique du tertiaire', '<p>Décomposition par secteur réglementaire de l&#x27;indicateur global 2a:</p>
<p>Consommation énergétique globale annuelle du territoire (GWh).</p>
', 'GWh', false, 'Consommation énergétique du tertiaire', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_2.g', 'cae', '2.g', null, 'Consommation énergétique  du transport routier', '<p>Décomposition par secteur réglementaire de l&#x27;indicateur global 2a:</p>
<p>Consommation énergétique globale annuelle du territoire (GWh).</p>
', 'GWh', false, 'Consommation énergétique  du transport routier', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_2.h', 'cae', '2.h', null, 'Consommation énergétique du secteur "autres transports"', '<p>Décomposition par secteur réglementaire de l&#x27;indicateur global 2a:</p>
<p>Consommation énergétique globale annuelle du territoire (GWh).</p>
', 'GWh', false, 'Consommation énergétique du secteur "autres transports"', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_2.i', 'cae', '2.i', null, 'Consommation énergétique de l''agriculture', '<p>Décomposition par secteur réglementaire de l&#x27;indicateur global 2a:</p>
<p>Consommation énergétique globale annuelle du territoire (GWh).</p>
', 'GWh', false, 'Consommation énergétique de l''agriculture', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_2.j', 'cae', '2.j', null, 'Consommation énergétique des déchets', '<p>Décomposition par secteur réglementaire de l&#x27;indicateur global 2a:</p>
<p>Consommation énergétique globale annuelle du territoire (GWh).</p>
', 'GWh', false, 'Consommation énergétique des déchets', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_45', 'cae', '45', null, 'Nombre de places de stationnement vélo, hors pince-roues (nb / 100 habitants)', '<p>L&#x27;indicateur mesure le nombre de places de stationnement vélo pour 100 habitants : arceaux sur l’espace public, consignes ou boxes à vélos, stationnements vélos en gare, en parking automobiles... Attention, les stationnements de type râtelier vélo ou « pince-roues » sur l’espace public, qui ne permettent pas une accroche sécuritaire, ne sont pas pris en compte.</p>
<ul>
<li>
<p>Valeurs limites : 2 (commune) et 1 (EPCI)</p>
</li>
<li>
<p>Valeurs cibles : 4 (communes) et 2 (EPCI)</p>
</li>
<li>
<p>ATTENTION: pour les collectivités rurales, se focaliser sur la présence d’abris et de stationnements proposés aux endroits clés (centres bourgs, autour des écoles et pôles d’activités, lieux publics de rencontre, commerces, etc).</p>
</li>
</ul>
', 'nb / 100 habitants', false, 'Nombre de places de stationnement vélo, hors pince-roues (nb / 100 habitants)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_61', 'cae', '61', null, 'Quantité moyenne de viande par repas dans la restauration collective publique (g/repas)', '<p>L’indicateur mesure le ratio moyen de viande par repas : la quantité totale annuelle de viande achetée dans la restauration collectivité publique (maîtrisée par la collectivité) est divisée par le nombre de repas servi sur l’année.</p>
', 'g/repas', false, 'Quantité moyenne de viande par repas dans la restauration collective publique (g/repas)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_58', 'cae', '58', null, 'Emissions directes de polluants atmosphériques du secteur agriculture par ha (tonne/ha)', '<p>Indicateur exigé dans la règlementation PCAET (diagnostic). Arrêté du 4 août 2016 relatif au plan climat-air-énergie territorial. Ramené à l’hectare pour comparaison.</p>
', 'tonne/ha', false, 'Emissions directes de polluants atmosphériques du secteur agriculture par ha (tonne/ha)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_63.a', 'cae', '63.a', null, 'Séquestration nette de dioxyde de carbone des sols et de la forêt (teq CO2)', '<p>L&#x27;indicateur suit une estimation de la séquestration nette de dioxyde de carbone, identifiant au moins les sols agricoles et la forêt, en tenant compte des changements d’affectation des terres (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial).</p>
', 'teq CO2', false, 'Séquestration nette de dioxyde de carbone des sols et de la forêt (teq CO2)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_63.b', 'cae', '63.b', null, 'Séquestration de la forêt  (teq CO2)', '<p>Composante de l&#x27;indicateur 63a:</p>
<p>Séquestration nette de dioxyde de carbone des sols et de la forêt (teq CO2)</p>
', 'teq CO2', false, 'Séquestration de la forêt  (teq CO2)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_63.c', 'cae', '63.c', null, 'Séquestration dans les terres agricoles et les prairies (teq CO2)', '<p>Composante de l&#x27;indicateur 63a:</p>
<p>Séquestration nette de dioxyde de carbone des sols et de la forêt (teq CO2)</p>
', 'teq CO2', false, 'Séquestration dans les terres agricoles et les prairies (teq CO2)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_63.d', 'cae', '63.d', null, 'Séquestration dans les autres sols (teq CO2)', '<p>Composante de l&#x27;indicateur 63a:</p>
<p>Séquestration nette de dioxyde de carbone des sols et de la forêt (teq CO2)</p>
', 'teq CO2', false, 'Séquestration dans les autres sols (teq CO2)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_15.a_dom', 'cae', '15.a-dom', null, 'Part de bâtiments >=701 kWhep/m².an (calcul DPE ou équivalent) (DOM)', '<p>Dans les DOM, l&#x27;indicateur mesure la part (en surface -à défaut en nombre) de bâtiments dont la collectivité est propriétaire  (ou mis à disposition avec transfert des droits patrimoniaux) dont la consommation d&#x27;énergie primaire est supérieure ou égale à 701 kWhep/m². Les modalités de calcul sont celles du Diagnostic de Performance Energétique s&#x27;il existe dans le DOM concerné ou toute démarche équivalente. Les piscines/patinoires sont exclues.</p>
', 'calcul DPE ou équivalent', false, 'Part de bâtiments >=701 kWhep/m².an (calcul DPE ou équivalent) (DOM)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_9', 'cae', '9', null, 'Compacité des formes urbaines', '<p>Trois indicateurs au choix :</p>
<ul>
<li>
<p>Rapport annuel entre nouvelle surface construite ou réhabilitée sur des sites en reconversion (sites déjà urbanisés : friches industrielles, dents creuses, habitat insalubre...) / nouvelle surface construite en extension (en limite d&#x27;urbanisation ou sur des espaces naturels ou agricoles). La comptabilisation se fait sur la base des permis de construire. Pour une agglomération, le ratio de 2 (soit 1/3 en extension et 2/3 en renouvellement) est une bonne performance ; pour une ville-centre les objectifs visés pourront être plus élevés.</p>
</li>
<li>
<p>Nombre de nouveaux logements collectifs et individuels groupés / nb total de logements autorisés dans l’année (disponibles dans la base SITADEL) la valeur moyenne des régions françaises est indiquée pour information (45%).</p>
</li>
<li>
<p>Part du foncier en friche : L’indicateur permet d’identifier et caractériser les gisements fonciers locaux qualifiés comme étant « en friche ». Les enjeux sont d’effectuer une veille foncière, d’anticiper la formation de friches et d’étudier la mutabilité des espaces en friche. Compacité des formes urbaines</p>
</li>
</ul>
', 'Non trouvé', false, 'Compacité des formes urbaines', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_20', 'cae', '20', null, 'Consommation de l’éclairage public  (kWh/hab.an)', '<p>L’indicateur est en énergie finale et inclut les consommations pour la signalisation et l’éclairage du mobilier urbain (ex : abri-bus). La valeur limite est inspirée (valeur moyenne arrondie) de l’enquête ADEME-AITF-EDF-GDF « Energie et patrimoine communal 2012 », en énergie finale. La valeur cible correspond aux meilleures scores obtenues par des collectivités Cit’ergie.</p>
<p>Pour les EPCI, l’indicateur n’est renseigné que si la compétence a été transférée totalement (pas uniquement sur les zones communautaires).</p>
<ul>
<li>
<p>Valeur limite : 90 kWh/hab (énergie finale, d&#x27;après données enquête AITF 2012, pour les villes moyennes)</p>
</li>
<li>
<p>Valeur cible : 60 kWh/hab</p>
</li>
</ul>
', 'kWh/hab.an', false, 'Consommation de l’éclairage public  (kWh/hab.an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_27', 'cae', '27', null, 'Mix énergétique proposé par les régies et SEM fournisseur d''électricité (%)', '<p>Les SEM et régies peuvent, en plus de leur propre production d’énergies renouvelables, acheter de l&#x27;électricité renouvelable ou verte (labellisée) pour compléter leur offre. Les objectifs fixés (production et achat) sont basés sur les objectifs 2030 de la loi de transition énergétique.</p>
<p>Valeur cible :</p>
<ul>
<li>
<p>40% (Métropole)  ;</p>
</li>
<li>
<p>100% (DOM)</p>
</li>
</ul>
', '%', false, 'Mix énergétique proposé par les régies et SEM fournisseur d''électricité (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_34', 'cae', '34', null, 'Taux de valorisation énergétique du biogaz des centres de stockage des déchets (en %)', '<p>L&#x27;indicateur mesure la part de biogaz valorisé par le centre de stockage des déchets.</p>
<ul>
<li>
<p>Valeur limite: 75% (fixée par le seuil de valorisation permettant la modulation de la TGAP)</p>
</li>
<li>
<p>Valeur cible : 100%</p>
</li>
</ul>
', 'en %', false, 'Taux de valorisation énergétique du biogaz des centres de stockage des déchets (en %)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_40.a', 'cae', '40.a', null, 'Consommation annuelle d''énergie des véhicules (VP) de la collectivité (kWh/an.employé)', '<p>L&#x27;indicateur mesure la consommation d&#x27;énergie en kWh (gazole, essence, GPL, GNV, électricité, biogaz, agro-carburants...) des véhicules de type &quot;véhicule particulier&quot; pour le fonctionnement de la collectivité, divisé par le nombre d&#x27;agents et/ou par kilomètre effectué. Facteurs de conversion simplifiés : gazole et essence 10 kWh/L, GPL 7 kWh/L, GNV 11 kWh/m3.</p>
', 'VP', false, 'Consommation annuelle d''énergie des véhicules (VP) de la collectivité (kWh/an.employé)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_40.b', 'cae', '40.b', null, 'Consommation annuelle d''énergie des véhicules (VP) de la collectivité (kWh/an.km)', '<p>déclinaison par kilomètre de l&#x27;indicateur 40a:</p>
<p>Consommation annuelle d&#x27;énergie des véhicules (VP) de la collectivité (kWh/an.employé)</p>
', 'VP', false, 'Consommation annuelle d''énergie des véhicules (VP) de la collectivité (kWh/an.km)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_38', 'cae', '38', null, 'Indicateur alternatif à la part modale TC (à définir par la collectivité et son conseiller le cas échéant)', '<p>En remplacement de l&#x27;indicateur sur les parts modales des transports en commun, la collectivité peut mesurer par un autre indicateur la progression d&#x27;un moyen de transport alternatif à la voiture individuelle, mieux adapté à sa situation (milieu rural notamment) : co-voiturage, transport à la demande... Il peut également s’agir de la part de déplacements intermodaux réalisés par les habitants du territoire, c’est-à-dire la part de déplacements mécanisés (tout mode hors marche-a-pied)  composés d&#x27;au moins deux trajets effectués à l’aide de plusieurs modes mécanisés. Pour obtenir la totalité des points, la valeur collectée doit témoigner d&#x27;une bonne performance de la collectivité par rapport à des valeurs de références nationales ou locales. A préciser en commentaires.</p>
<p>A titre indicatif,  [valeur limite ; valeur cible] pour la part de déplacements intermodaux:</p>
<ul>
<li>
<p>Pour les collectivités &gt; 800 000 hab: [4% ; 12%]</p>
</li>
<li>
<p>Pour les collectivités &gt; 300 000 hab :  [2% : 6%]</p>
</li>
<li>
<p>Pour les collectivités &gt; 50 000 hab : [0,5% ; 2%]</p>
</li>
<li>
<p>Pour les collectivités &lt;50 000 hab : [0,25% ; 1,2%]</p>
</li>
</ul>
<p>(source : analyse de rapport d’études et de recherches sur l’intermodalité, CEREMA – IFSTTAR, 2015 et 2016, tendances observées depuis 1985 dans le cadre des EMD)</p>
', 'à définir par la collectivité et son conseiller le cas échéant', false, 'Indicateur alternatif à la part modale TC (à définir par la collectivité et son conseiller le cas échéant)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_15.a', 'cae', '15.a', null, 'Part de bâtiments publics de classe F ou G selon le DPE pour l''énergie (ou équivalent)', '<p>En France métropolitaine, l&#x27;indicateur mesure la part (en surface -à défaut en nombre) de bâtiments, soumis ou non à l&#x27;obligation de réalisation du DPE,  dont la collectivité est propriétaire (ou mis à disposition avec transferts des droits patrimoniaux) compris dans les classes F et G selon le DPE pour l&#x27;énergie. Le patrimoine en DSP est inclus si possible.  Sont exclus de cet indicateur les bâtiments qui doivent garantir des conditions de températures, d&#x27;hygrométrie ou de qualité de l&#x27;air nécessitant des règles particulières (notamment piscines et patinoires) ou destinés à rester ouverts sur l&#x27;extérieur. Les classes de performance et les modalités de calcul sont celles du Diagnostic de Performance Energétique, telles qu&#x27;elles sont définies dans l&#x27;arrêté du 7 décembre 2007 relatif à l&#x27;affichage du DPE dans les bâtiments publics en France métropolitaine (énergie primaire et distinction de 3 catégories de bâtiments). Toute démarche équivalente pourra être prise en compte. L&#x27;indicateur permet de mesurer l&#x27;effort de la collectivité pour la rénovation de ces bâtiments les plus émetteurs. L&#x27;objectif est de ne plus avoir de patrimoine dans ces classes (valeur limite : 10%).</p>
', 'ou équivalent', false, 'Part de bâtiments publics de classe F ou G selon le DPE pour l''énergie (ou équivalent)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_15.b', 'cae', '15.b', null, 'Part de bâtiments publics de classe A ou B selon le DPE pour l''énergie (ou équivalent)', '<p>En France métropolitaire, l&#x27;indicateur mesure la part (en surface -à défaut en nombre) de bâtiments, soumis ou non à l&#x27;obligation de réalisation du DPE,  dont la collectivité est propriétaire (ou mis à disposition avec transferts des droits patrimoniaux) compris dans les classes A et B selon le DPE pour l&#x27;énergie. Le patrimoine en DSP est inclus si possible.  Sont exclus de cet indicateur les bâtiments qui doivent garantir des conditions de températures, d&#x27;hygrométrie ou de qualité de l&#x27;air nécessitant des règles particulières (notamment piscines et patinoires) ou destinés à rester ouverts sur l&#x27;extérieur. Les classes de performance et les modalités de calcul sont celles du Diagnostic de Performance Energétique, telles qu&#x27;elles sont définies dans l&#x27;arrêté du 7 décembre 2007 relatif à l&#x27;affichage du DPE dans les bâtiments publics en France métropolitaine (énergie primaire et distinction de 3 catégories de bâtiments). Toute démarche équivalente pourra être prise en compte. La cible est d&#x27;atteindre 30% du parc dans les classes A et B (mais valorisation progressive à partir de 0%).</p>
', 'ou équivalent', false, 'Part de bâtiments publics de classe A ou B selon le DPE pour l''énergie (ou équivalent)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_15.b_dom', 'cae', '15.b-dom', null, 'Part de bâtiments =<100 kWhep/m².an (calcul DPE ou équivalent) (DOM)', '<p>Dans les DOM, l&#x27;indicateur mesure la part (en surface -à défaut en nombre) de bâtiments dont la collectivité est propriétaire  (ou mis à disposition avec transfert des droits patrimoniaux) dont la consommation d&#x27;énergie primaire est inférieure ou égale à 100 kWhep/m². Les modalités de calcul sont celles du Diagnostic de Performance Energétique s&#x27;il existe dans le DOM concerné ou toute démarche équivalente. Les piscines/patinoires sont exclues.</p>
', 'calcul DPE ou équivalent', false, 'Part de bâtiments =<100 kWhep/m².an (calcul DPE ou équivalent) (DOM)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_8', 'cae', '8', null, 'Nombre de logements rénovés énergétiquement (nb logements rénovés/100 logements existants)', '<p>L&#x27;indicateur mesure le nombre annuel de logements rénovés via les dispositifs de subventionnement et d’accompagnement dont la collectivité est partenaire, ramené au nombre de logements du territoire (pour 100 logements). Pour rappel l’objectif national du plan de rénovation énergétique de l’habitat est de 500 000 logements rénovés par an en 2017, soit 1,4 logements rénovés pour 100 logements existants (35,425 millions de logements en 2016 selon l’INSEE).</p>
', 'nb logements rénovés/100 logements existants', false, 'Nombre de logements rénovés énergétiquement (nb logements rénovés/100 logements existants)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_36', 'cae', '36', null, 'Part modale vélo', '<p>La part modale est une part modale en nombre de déplacements.</p>
<p>Les valeurs limites et cibles sont données à titre indicatif pour le conseiller, qui doit également juger de l&#x27;évolution de la part modale au fil du temps et selon le territoire. En France, la moyenne est de 3%, les meilleures collectivités françaises atteignent 10% des déplacements. En Allemagne les parts modales atteignent 25% dans plusieurs villes. A défaut de posséder les parts modales issues d&#x27;une enquête ménages, les collectivités peuvent utiliser les données INSEE donnant les parts modales des déplacements domicile-travail pour la population active (tableau NAV2A ou NAV2B).</p>
', 'Non trouvé', false, 'Part modale vélo', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_59', 'cae', '59', null, 'Part de surface agricole certifiée agriculture biologique ou en conversion et haute valeur environnementale (%)', '<p>L&#x27;indicateur mesure le pourcentage % de SAU impliquée dans une démarche de certification environnementale (par rapport à la SAU totale) : agriculture biologique (certifiée et en conversion) et haute valeur environnementale (HVE). L&#x27;agriculture raisonnée (ou niveau 2 de certification environnementale selon les décrets et arrêtés du 20 et 21 juin 2011) n&#x27;est pas prise en compte. Pour la France métropole, la valeur limite est basée sur la valeur moyenne française des surfaces labellisées AB en 2016 (5,7% - Agence bio) et la valeur cible est basée sur l’objectif 2020 fixé dans la loi Grenelle I (20%).</p>
', '%', false, 'Part de surface agricole certifiée agriculture biologique ou en conversion et haute valeur environnementale (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_51', 'cae', '51', null, 'Part des marchés intégrant des clauses environnementales (%)', '<p>Part des marchés (en nombre) intégrant des clauses environnementales dans les spécifications techniques ou les critères d’attribution en augmentation</p>
', '%', false, 'Part des marchés intégrant des clauses environnementales (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_29', 'cae', '29', null, 'Consommation énergétique des STEP kWh/kgDBO5 éliminé', '<p>L&#x27;indicateur de consommation énergétique des STEP (station d&#x27;épuration) s&#x27;exprime en kWh/kg de DBO5 (demande biologique en oxygène mesuré à 5 jours) éliminés, plus fiables que les indicateurs en kWh/m3 d&#x27;eau traité. La composition des eaux entrantes influe en effet sur les consommations énergétiques de la station sans pour autant refléter ses performances. Le privilège est donc donné à cet indicateur, qui se situe habituellement se situe, selon la filière, autour des valeurs suivantes : BA (boues activées) entre 2 et 4, SBR (réacteur biologique séquencé) autour de 4 et BRM (bioréacteur à membranes) autour de 5 (dires d&#x27;experts). L&#x27;énergie est mesurée en énergie finale. Dans le cas d&#x27;une moyenne entre plusieurs STEP, pondérer selon les équivalents habitants.</p>
<ul>
<li>
<p>Valeur limite : BA 4, SBR 5, BRM 7</p>
</li>
<li>
<p>Valeur cible : BA 2, SBR 3, BRM 4</p>
</li>
</ul>
', 'Non trouvé', false, 'Consommation énergétique des STEP kWh/kgDBO5 éliminé', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_47', 'cae', '47', null, 'Maillage du territoire par le réseau TC', '<p>L&#x27;indicateur a pour objectif de mesurer le maillage du territoire par les TC : nombre moyen d&#x27;arrêts par km du réseau de transport en commun, nb arrêts/hab, km de réseau/hab ou par ha de territoire, % de population desservie dans un rayon de 300-500 mètres... L&#x27;indicateur est basé sur une moyenne tous modes de TC confondus.</p>
', 'Non trouvé', false, 'Maillage du territoire par le réseau TC', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_53', 'cae', '53', null, 'Part du budget consacré aux projets de coopération significatifs et multi-acteurs par an sur le climat, l’air et l’énergie (%)', '<p>L&#x27;indicateur mesure le montant des dépenses engagées pour les projets de coopération significatifs et multi-acteurs par an sur le climat, l’air et l’énergie (hors coopération décentralisée), rapporté au budget total (investissement et fonctionnement) de la collectivité.</p>
', '%', false, 'Part du budget consacré aux projets de coopération significatifs et multi-acteurs par an sur le climat, l’air et l’énergie (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_43', 'cae', '43', null, 'Part de voiries « apaisées » (%)', '<p>L’indicateur mesure la part des voiries où un dispositif règlementaire permet l’apaisement de la circulation (réduction des vitesses en dessous de 50 km/heures ou limitation de la circulation) par rapport au linéaire total de voirie de la collectivité. Les dispositifs pris en compte sont les zones de rencontre, les zones 30, les aires piétonnes, les zones de circulation restreinte.</p>
', '%', false, 'Part de voiries « apaisées » (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_26', 'cae', '26', null, 'Puissance photovoltaïque installée sur le territoire (Wc/hab)', '<p>L&#x27;installation de panneaux solaires photovoltaïques est possible dans toutes les collectivités. Un indicateur en puissance installée plutôt qu&#x27;en production permet de ne pas prendre en compte les différences d&#x27;ensoleillement des territoires. Les valeurs cibles sont établies à partir des données collectées dans le cadre des démarches Cit&#x27;ergie.</p>
<p>Les valeurs cibles sont les suivantes :</p>
<ul>
<li>
<p>pour les collectivités &gt; 100 000 habitants : 20 Wc/hab (Métropole) / 60 Wc/hab (DOM-ROM)</p>
</li>
<li>
<p>pour les collectivités &gt; 50 000 habitants : 40 Wc/hab (Métropole) - 120 Wc/hab (DOM-ROM)</p>
</li>
<li>
<p>pour les collectivités &lt; 50 000 habitants : 60 Wc/hab (Métropole) - 180 Wc/hab (DOM-ROM)</p>
</li>
</ul>
', 'Wc/hab', false, 'Puissance photovoltaïque installée sur le territoire (Wc/hab)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_24.a', 'cae', '24.a', null, 'Production de chaleur/froid renouvelable  (MWh)', '<p>Cet indicateur mesure la production de chaleur et de rafraichissement  renouvelable sur le territoire (initiative publique et privée). Les énergies renouvelables prise en compte sont celles citées selon les filières citées dans le Décret n° 2016-849 du 28 juin 2016  relatif au plan climat-air-énergie territorial :  biomasse  solide,  pompes  à  chaleur,  géothermie,  solaire  thermique,  biogaz.</p>
<p>Par convention, 50% de la chaleur produite par l’incinération des déchets est considérée issue de déchets urbains renouvelables (source DGEC, dans ses bilans). Les pompes à chaleur prise en compte sont les pompes à chaleur eau/eau, sol/eau, sol/sol  avec une efficacité énergétique ≥ 126 % (PAC basse température) et une efficacité énergétique ≥ 111 % (PAC moyenne ou haute température) (exigences du crédit d’impôt pour la transition énergétique 2018).</p>
<ul>
<li>ATTENTION: La cogénération à partir d&#x27;énergie fossile n&#x27;est pas prise en compte.</li>
</ul>
', 'MWh', false, 'Production de chaleur/froid renouvelable  (MWh)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_24.b', 'cae', '24.b', null, 'Taux de production d''énergie renouvelable pour la chaleur et le rafraîchissement sur le territoire (en %)', '<p>Cet indicateur mesure la production de chaleur et de rafraichissement  renouvelable sur le territoire (initiative publique et privée), divisée par les consommations totales de chaleur et de froid du territoire (en énergie finale). Les énergies renouvelables prise en compte sont celles citées selon les filières citées dans le Décret n° 2016-849 du 28 juin 2016  relatif au plan climat-air-énergie territorial :  biomasse  solide,  pompes  à  chaleur,  géothermie,  solaire  thermique,  biogaz. Par convention, 50% de la chaleur produite par l’incinération des déchets est considérée issue de déchets urbains renouvelables (source DGEC, dans ses bilans). Les pompes à chaleur prise en compte sont les pompes à chaleur eau/eau, sol/eau, sol/sol  avec une efficacité énergétique ≥ 126 % (PAC basse température) et une efficacité énergétique ≥ 111 % (PAC moyenne ou haute température) (exigences du crédit d’impôt pour la transition énergétique 2018). La cogénération à partir d&#x27;énergie fossile n&#x27;est pas prise en compte.</p>
<p>Pour connaître cet indicateur, la collectivité doit avoir effectué un bilan de ses consommations et production d&#x27;ENR tel que décrit à l&#x27;action 1.1.2:</p>
<p>Réaliser le diagnostic Climat-Air-Energie du territoire</p>
<ul>
<li></li>
</ul>
<ul>
<li>Valeur cible : 38% en Métropole, 75% dans les DOM</li>
</ul>
', 'en %', false, 'Taux de production d''énergie renouvelable pour la chaleur et le rafraîchissement sur le territoire (en %)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_41', 'cae', '41', null, 'Part modale des déplacements alternatifs à la voiture individuelle pour les déplacements  domicile-travail des agents de la collectivité (%)', '<p>Via une enquête réalisée auprès des agents, l’indicateur mesure la part modale (en nombre de déplacements) cumulée des déplacements alternatifs à la voiture individuelle (somme des parts modales marche, vélo, transport en commun, co-voiturage) dans les déplacements domicile-travail des agents. L’indicateur est décliné si possible également en kilomètres parcourus.</p>
', '%', false, 'Part modale des déplacements alternatifs à la voiture individuelle pour les déplacements  domicile-travail des agents de la collectivité (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_35', 'cae', '35', null, 'Part modale piéton', '<p>La part modale est une part modale en nombre de déplacements.</p>
<p>Les valeurs limites et cibles (selon le nombre d&#x27;habitants, limite de 15-25%, cible de 25-35%) sont données à titre indicatif pour le conseiller, qui doit également juger de l&#x27;évolution de la part modale au fil du temps et des caractéristiques du territoire (ville centre dense favorisant la marche ou territoire étendu d&#x27;une agglomération...). A défaut de posséder les parts modales issues d&#x27;une enquête ménages, les collectivités peuvent utiliser les données INSEE donnant les parts modales des déplacements domicile-travail pour la population active (tableau NAV2A ou NAV2B).</p>
', 'Non trouvé', false, 'Part modale piéton', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_23', 'cae', '23', null, 'Taux de couverture des besoins de chaleur du territoire (résidentiel et tertiaire) par les réseaux de chaleur ENR&R (en %)', '<p>Cet indicateur est le ratio entre la consommation d&#x27;énergie pour le chauffage assurée par le(s) réseau(x) de chaleur ENR&amp;R et la consommation totale d&#x27;énergie pour le chauffage du territoire (pour le résidentiel et le tertiaire, donc hors industrie).</p>
<p>La valeur limite (10%) est basée sur le taux moyen de couverture des besoins de chaleur par les réseaux de chaleur en Europe (source : AMORCE).</p>
<ul>
<li>ATTENTION: Les réseaux de chaleur 100% fossiles ne sont pas pris en compte ici.</li>
</ul>
', 'résidentiel et tertiaire', false, 'Taux de couverture des besoins de chaleur du territoire (résidentiel et tertiaire) par les réseaux de chaleur ENR&R (en %)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_19.a_hors_dom', 'cae', '19.a-hors-dom', null, 'Part de bâtiments de classe F ou G selon le DPE pour les GES (ou équivalent) (hors DOM)', '<p>En France métropolitaine, l&#x27;indicateur mesure la part (en surface -à défaut en nombre) de bâtiments, soumis ou non à l&#x27;obligation de réalisation du DPE,  dont la collectivité est propriétaire (ou mis à disposition avec transferts des droits patrimoniaux) compris dans les classes F et G selon le DPE pour les GES. Le patrimoine en DSP est inclus si possible.  Sont exclus de cet indicateur les bâtiments qui doivent garantir des conditions de températures, d&#x27;hygrométrie ou de qualité de l&#x27;air nécessitant des règles particulières (notamment piscines et patinoires) ou destinés à rester ouverts sur l&#x27;extérieur. Les classes de performance et les modalités de calcul sont celles du Diagnostic de Performance Energétique, telles qu&#x27;elles sont définies dans l&#x27;arrêté du 7 décembre 2007 relatif à l&#x27;affichage du DPE dans les bâtiments publics en France métropolitaine (énergie primaire et distinction de 3 catégories de bâtiments). Toute démarche équivalente pourra être prise en compte. L&#x27;indicateur permet de mesurer l&#x27;effort de la collectivité pour la rénovation de ces bâtiments les plus émetteurs. L&#x27;objectif est de ne plus avoir de patrimoine dans ces classes (valeur limite : 10%).</p>
', 'ou équivalent', false, 'Part de bâtiments de classe F ou G selon le DPE pour les GES (ou équivalent) (hors DOM)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_19.b_hors_dom', 'cae', '19.b-hors-dom', null, 'Part de bâtiments de classe A ou B selon le DPE pour les GES (ou équivalent)  (hors DOM)', '<p>En France métropolitaine, l&#x27;indicateur mesure la part (en surface -à défaut en nombre) de bâtiments, soumis ou non à l&#x27;obligation de réalisation du DPE, dont la collectivité est propriétaire (ou mis à disposition avec transferts des droits patrimoniaux) compris dans les classes A et B selon le DPE pour les GES. Le patrimoine en DSP est inclus si possible.  Sont exclus de cet indicateur les bâtiments qui doivent garantir des conditions de températures, d&#x27;hygrométrie ou de qualité de l&#x27;air nécessitant des règles particulières (notamment piscines et patinoires) ou destinés à rester ouverts sur l&#x27;extérieur. Les classes de performance et les modalités de calcul sont celles du Diagnostic de Performance Energétique, telles qu&#x27;elles sont définies dans l&#x27;arrêté du 7 décembre 2007 relatif à l&#x27;affichage du DPE dans les bâtiments publics en France métropolitaine (énergie primaire et distinction de 3 catégories de bâtiments). Toute démarche équivalente pourra être prise en compte. La cible est d&#x27;atteindre 30% du parc dans les classes A et B (mais valorisation progressive à partir de 0%).</p>
', 'ou équivalent', false, 'Part de bâtiments de classe A ou B selon le DPE pour les GES (ou équivalent)  (hors DOM)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_49.a', 'cae', '49.a', null, 'Budget associé à la politique climat-air-énergie (euros/hab.an)', '<p>L&#x27;indicateur suit et totalise les budgets annuels associés aux actions les plus clairement identifiables de la politique climat-air-énergie de la collectivité, en fonctionnement et en investissement. L&#x27;indicateur doit exister et être suivi annuellement pour être valorisé (pas de valeur limite ou cible). Pour faciliter la comparaison au fil du temps et entre collectivités, le budget est rapporté au nombre d&#x27;habitant et la décomposition suivante peut être utilisée :</p>
<ul>
<li>
<p>études/expertises concernant la maîtrise de l’énergie et la baisse des émissions de GES dans les différents secteurs consommateurs et émetteurs, les énergies renouvelables, l&#x27;adaptation au changement climatique, la qualité de l&#x27;air</p>
</li>
<li>
<p>politique cyclable (études, infrastructures et services)</p>
</li>
<li>
<p>actions communication/sensibilisation climat-air-énergie</p>
</li>
<li>
<p>subventions climat-air-énergie</p>
</li>
<li>
<p>projets de coopération climat-air-énergie</p>
</li>
<li>
<p>travaux de rénovation énergétique du patrimoine public</p>
</li>
<li>
<p>installations d&#x27;énergie renouvelable</p>
</li>
</ul>
<p>A noter : Dans une approche véritablement transversale et intégrée, l&#x27;ensemble des budgets des différents services contribuent à la politique climat-air-énergie, mais dans une proportion difficilement quantifiable.  Les budgets associés aux services déchets/eau/assainissement/transports publics/voirie, sont notamment associés à cette politique, mais répondent à des objectifs plus larges.</p>
', 'euros/hab.an', false, 'Budget associé à la politique climat-air-énergie (euros/hab.an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_49.b', 'cae', '49.b', null, 'Budget études/expertises MDE/ENR/qualité de l''air/adaptation au changement climatique (euros)', '<p>Composante de l&#x27;indicateur 49a:</p>
<p>Budget associé à la politique climat-air-énergie (euros/hab.an)</p>
', 'euros', false, 'Budget études/expertises MDE/ENR/qualité de l''air/adaptation au changement climatique (euros)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_49.c', 'cae', '49.c', null, 'Budget actions communication/sensibilisation climat-air-énergie (euros)', '<p>Composante de l&#x27;indicateur 49a:</p>
<p>Budget associé à la politique climat-air-énergie (euros/hab.an)</p>
', 'euros', false, 'Budget actions communication/sensibilisation climat-air-énergie (euros)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_49.d', 'cae', '49.d', null, 'Montant des aides financières accordées aux particuliers et acteurs privés (euros)', '<p>Composante de l&#x27;indicateur 49a:</p>
<p>Budget associé à la politique climat-air-énergie (euros/hab.an)</p>
<ul>
<li>Il s&#x27;agit du montant des subventions octroyées par la collectivité aux particuliers et autres acteurs privés dans le domaine énergétique et climatique. La part financée par la collectivité dans des subventions partenariales est prise en compte.</li>
</ul>
', 'euros', false, 'Montant des aides financières accordées aux particuliers et acteurs privés (euros)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_49.d.hab', 'cae', '49.d-hab', null, 'Montant des aides financières accordées aux particuliers et acteurs privés (euros/hab.an)', '<p>Déclinaison par habitant.</p>
', 'euros/hab.an', false, 'Montant des aides financières accordées aux particuliers et acteurs privés (euros/hab.an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_49.e', 'cae', '49.e', null, 'Budget projets de coopération (euros)', '<p>Composante de l&#x27;indicateur 49a:</p>
<p>Budget associé à la politique climat-air-énergie (euros/hab.an)</p>
', 'euros', false, 'Budget projets de coopération (euros)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_49.f', 'cae', '49.f', null, 'Budget politique cyclable (euros)', '<p>Composante de l&#x27;indicateur 49a:</p>
<p>Budget associé à la politique climat-air-énergie (euros/hab.an).</p>
<p>L’indicateur mesure le budget global dédié par la collectivité au développement de la pratique cyclable sur son territoire : études, infrastructures et services.</p>
', 'euros', false, 'Budget politique cyclable (euros)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_49.f-hab', 'cae', '49.f-hab', null, 'Budget politique cyclable (euros/hab.an)', '<p>Déclinaison par habitant.  Pour les collectivités compétentes en la matière, des valeurs de références ramenées au nombre d&#x27;habitants sont données à titre indicatif : valeur limite 5 euros/hab.an, valeur cible 10 euros/hab.an (source observatoire des mobilités actives, ADEME 2016)</p>
', 'euros/hab.an', false, 'Budget politique cyclable (euros/hab.an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_49.g', 'cae', '49.g', null, 'Budget travaux rénovation énergétique patrimoine public (euros)', '<p>Composante de l&#x27;indicateur 49a:</p>
<p>Budget associé à la politique climat-air-énergie (euros/hab.an)</p>
', 'euros', false, 'Budget travaux rénovation énergétique patrimoine public (euros)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_49.h', 'cae', '49.h', null, 'Budget installations ENR publiques (euros)', '<p>Composante de l&#x27;indicateur 49a:</p>
<p>Budget associé à la politique climat-air-énergie (euros/hab.an)</p>
', 'euros', false, 'Budget installations ENR publiques (euros)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_57', 'cae', '57', null, 'Taux d’hébergements labellisés Ecolabel européen (ou équivalent)', '<p>Nombre d&#x27;hébergements labellisés Ecolabel Européen / Total d&#x27;hébergements touristiques sur le territoire</p>
<p>(Indicateur complémentaire : Nombre d’hébergements labellisés Ecolabel Européen)</p>
', 'ou équivalent', false, 'Taux d’hébergements labellisés Ecolabel européen (ou équivalent)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_25.a', 'cae', '25.a', null, 'Production d''électricité renouvelable  (MWh)', '<p>Cet indicateur mesure la production d&#x27;électricité renouvelable sur le territoire (initiative publique et privée). Les énergies renouvelables prise en compte sont celles citées selon les filières citées dans le Décret n° 2016-849 du 28 juin 2016  relatif au plan climat-air-énergie territorial :  éolien terrestre, solaire PV, solaire thermodynamique, hydraulique, biomasse solide, biogaz, géothermie.</p>
', 'MWh', false, 'Production d''électricité renouvelable  (MWh)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_25.b', 'cae', '25.b', null, 'Taux de production d''électricité renouvelable sur le territoire (%)', '<p>Cet indicateur mesure la production d&#x27;électricité renouvelable sur le territoire, par la collectivité, ses partenaires et les particuliers, rapporté à la consommation totale d&#x27;électricité du territoire (énergie finale). Les énergies renouvelables considérées sont celles citées dans le décret Décret n° 2016-849 du 28 juin 2016  relatif au plan climat-air-énergie territorial  (éolien  terrestre,  solaire  photovoltaïque,  solaire  thermodynamique,  hydraulique,  biomasse  solide, biogaz,  géothermie). L&#x27;électricité produite par cogénération via incinération des déchets en mélange compte pour 50% comme une énergie renouvelable (biomasse solide). La cogénération à partir d&#x27;énergie fossile n&#x27;est pas prise en compte.</p>
<p>La collectivité doit avoir effectué un bilan de ses consommations et productions d&#x27;ENR tel que décrit à l&#x27;action 1.1.2:</p>
<p>Réaliser le diagnostic Climat-Air-Energie du territoire</p>
<ul>
<li></li>
</ul>
<ul>
<li>
<p>Valeur cible pour les territoires sans potentiel éolien et hydraulique : 16%</p>
</li>
<li>
<p>Valeur cible pour les territoires à fort potentiel : 40%</p>
</li>
<li>
<p>Valeur cible pour les DOM : 75%</p>
</li>
</ul>
', '%', false, 'Taux de production d''électricité renouvelable sur le territoire (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_4.a', 'cae', '4.a', null, 'Emissions annuelles de Nox (tonnes)', '<p>Ces indicateurs estiment les émissions annuelles des six polluants atmosphériques exigés dans le contenu réglementaire des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial) : oxydes d’azote (NOx), les particules PM 10 et PM 2,5 et les composés organiques volatils (COV), tels que définis au I de l’article R. 221-1 du même code, ainsi que le dioxyde de soufre (SO2 ) et l’ammoniac (NH3). Préciser l&#x27;année de référence en commentaire. Les données peuvent être fournies notamment par les associations agrées pour la surveillance de la qualité de l&#x27;air (AASQA). L&#x27;évaluation est basée sur l&#x27;évolution de l&#x27;indicateur.</p>
', 'tonnes', false, 'Emissions annuelles de Nox (tonnes)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_4.b', 'cae', '4.b', null, 'Emissions annuelles de PM10 (tonnes)', '<p>Ces indicateurs estiment les émissions annuelles des six polluants atmosphériques exigés dans le contenu réglementaire des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial) : oxydes d’azote (NOx), les particules PM 10 et PM 2,5 et les composés organiques volatils (COV), tels que définis au I de l’article R. 221-1 du même code, ainsi que le dioxyde de soufre (SO2 ) et l’ammoniac (NH3). Préciser l&#x27;année de référence en commentaire. Les données peuvent être fournies notamment par les associations agrées pour la surveillance de la qualité de l&#x27;air (AASQA). L&#x27;évaluation est basée sur l&#x27;évolution de l&#x27;indicateur.</p>
', 'tonnes', false, 'Emissions annuelles de PM10 (tonnes)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_4.c', 'cae', '4.c', null, 'Emissions annuelles de PM2,5 (tonnes)', '<p>Ces indicateurs estiment les émissions annuelles des six polluants atmosphériques exigés dans le contenu réglementaire des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial) : oxydes d’azote (NOx), les particules PM 10 et PM 2,5 et les composés organiques volatils (COV), tels que définis au I de l’article R. 221-1 du même code, ainsi que le dioxyde de soufre (SO2 ) et l’ammoniac (NH3). Préciser l&#x27;année de référence en commentaire. Les données peuvent être fournies notamment par les associations agrées pour la surveillance de la qualité de l&#x27;air (AASQA). L&#x27;évaluation est basée sur l&#x27;évolution de l&#x27;indicateur.</p>
', 'tonnes', false, 'Emissions annuelles de PM2,5 (tonnes)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_4.d', 'cae', '4.d', null, 'Emissions annuelles de COV (tonnes)', '<p>Ces indicateurs estiment les émissions annuelles des six polluants atmosphériques exigés dans le contenu réglementaire des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial) : oxydes d’azote (NOx), les particules PM 10 et PM 2,5 et les composés organiques volatils (COV), tels que définis au I de l’article R. 221-1 du même code, ainsi que le dioxyde de soufre (SO2 ) et l’ammoniac (NH3). Préciser l&#x27;année de référence en commentaire. Les données peuvent être fournies notamment par les associations agrées pour la surveillance de la qualité de l&#x27;air (AASQA). L&#x27;évaluation est basée sur l&#x27;évolution de l&#x27;indicateur.</p>
', 'tonnes', false, 'Emissions annuelles de COV (tonnes)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_4.e', 'cae', '4.e', null, 'Emissions annuelles de SO2  (tonnes)', '<p>Ces indicateurs estiment les émissions annuelles des six polluants atmosphériques exigés dans le contenu réglementaire des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial) : oxydes d’azote (NOx), les particules PM 10 et PM 2,5 et les composés organiques volatils (COV), tels que définis au I de l’article R. 221-1 du même code, ainsi que le dioxyde de soufre (SO2 ) et l’ammoniac (NH3). Préciser l&#x27;année de référence en commentaire. Les données peuvent être fournies notamment par les associations agrées pour la surveillance de la qualité de l&#x27;air (AASQA). L&#x27;évaluation est basée sur l&#x27;évolution de l&#x27;indicateur.</p>
', 'tonnes', false, 'Emissions annuelles de SO2  (tonnes)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_4.f', 'cae', '4.f', null, 'Emissions annuelles de NH3 (tonnes)', '<p>Ces indicateurs estiment les émissions annuelles des six polluants atmosphériques exigés dans le contenu réglementaire des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial) : oxydes d’azote (NOx), les particules PM 10 et PM 2,5 et les composés organiques volatils (COV), tels que définis au I de l’article R. 221-1 du même code, ainsi que le dioxyde de soufre (SO2 ) et l’ammoniac (NH3). Préciser l&#x27;année de référence en commentaire. Les données peuvent être fournies notamment par les associations agrées pour la surveillance de la qualité de l&#x27;air (AASQA). L&#x27;évaluation est basée sur l&#x27;évolution de l&#x27;indicateur.</p>
', 'tonnes', false, 'Emissions annuelles de NH3 (tonnes)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_37', 'cae', '37', null, 'Part modale TC', '<p>La part modale est une part modale en nombre de déplacements.</p>
<p>Il s’agit (si possible) des transports en commun en général : bus urbain, car interurbain, tram, métro, train..., pas uniquement les TCU (transport collectif urbain). La rentabilité économique du système est prise en compte dans la réduction de potentiel. Les valeurs limites et cibles (début de valorisation entre 5 et 10% selon les infrastructures en place, cible &gt;20% -région parisienne) sont données à titre indicatif pour le conseiller, qui doit également juger de l&#x27;évolution de la part modale au fil du temps et de l&#x27;offre TC sur le territoire. A défaut de posséder les parts modales issues d&#x27;une enquête ménages, les collectivités peuvent utiliser les données INSEE donnant les parts modales des déplacements domicile-travail  pour la population active (tableau NAV2A ou NAV2B).</p>
', 'Non trouvé', false, 'Part modale TC', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_28.a', 'cae', '28.a', null, 'Consommation énergétique du système d''alimentation en eau potable (captage/traitement/distribution) en kWh/hab', '<p>Le système d&#x27;alimentation en eau potable est très dépendant de l&#x27;état de la ressource en eau sur le territoire. L&#x27;évaluation des effets se fait donc de manière relative, sur plusieurs années, en étant vigilant sur les conditions climatiques de l&#x27;année étudiée. L&#x27;indicateur peut être en kWh/hab.</p>
', 'captage/traitement/distribution', false, 'Consommation énergétique du système d''alimentation en eau potable (captage/traitement/distribution) en kWh/hab', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_28.b', 'cae', '28.b', null, 'Rendement du système d''alimentation en eau potable (captage/traitement/distribution) en m3 brut/m3 vendu', '<p>Le système d&#x27;alimentation en eau potable est très dépendant de l&#x27;état de la ressource en eau sur le territoire. L&#x27;évaluation des effets se fait donc de manière relative, sur plusieurs années, en étant vigilant sur les conditions climatiques de l&#x27;année étudiée. L&#x27;indicateur est en m3 brut/m3 vendu pour mesurer les pertes (la cible étant dans ce cas de se rapprocher de 1).</p>
', 'captage/traitement/distribution', false, 'Rendement du système d''alimentation en eau potable (captage/traitement/distribution) en m3 brut/m3 vendu', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_3.a', 'cae', '3.a', null, 'Production d’énergie renouvelable globale du territoire', '<p>Cet indicateur mesure la production d’énergie renouvelable totale sur le territoire, selon les exigences réglementaires des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial), c&#x27;est à dire incluant les filières de production:</p>
<ul>
<li>
<p>d’électricité: éolien  terrestre, solaire  photovoltaïque, solaire  thermodynamique,  hydraulique,  biomasse  solide, biogaz, géothermie</p>
</li>
<li>
<p>de  chaleur: biomasse  solide,  pompes  à  chaleur,  géothermie,  solaire  thermique,  biogaz</p>
</li>
<li>
<p>de biométhane et de biocarburants.</p>
</li>
</ul>
', 'MWh', false, 'Quantité totale d''énergies renouvelables et de récupération produites par an', null, null, null, '{energie_et_climat}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_3.b', 'cae', '3.b', null, 'Production d’énergie renouvelable globale du territoire', '<p>Déclinaison en % de la consommation énergétique du territoire de l&#x27;indicateur 3a:</p>
<p>Production d’énergie renouvelable globale du territoire (MWh).</p>
', '% de la consommation', false, 'Production d’énergie renouvelable globale du territoire', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_16.a', 'cae', '16.a', null, 'Consommation de chaleur/rafraichissement renouvelable et de récupération - patrimoine collectivité   (MWh)', '<p>Pour les bâtiments et équipements publics, l&#x27;indicateur mesure  la consommation de chaleur/rafraichissement issue d’energie renouvelable et de récupération. Le patrimoine en DSP est inclus si possible ainsi que les services publics eau/assainissement/déchets lorsqu&#x27;ils sont de la compétence de la collectivité.</p>
<p>Pour les collectivités compétentes, la récupération de chaleur des UIOM ainsi que sur les eaux usées/épurées peut ainsi être prise en compte pour la part autoconsommée sur place (bâtiments de la collectivité et process). Les pompes à chaleur prise en compte sont les pompes à chaleur eau/eau, sol/eau, sol/sol avec une efficacité énergétique ≥ 126 % (PAC basse température) et une efficacité énergétique ≥ 111 % (PAC moyenne ou haute température).</p>
<p>Pour les bâtiments publics desservis par des réseaux de chaleur, le taux d’EnR&amp;R du réseau est défini réglementairement et s’apprécie au regard du bulletin officiel des impôts vis-a-vis de la TVA réduite (BOI-TVA-LIQ-30 chapitre 2.140). La co-génération fossile n’est pas prise en compte.</p>
', 'MWh', false, 'Consommation de chaleur/rafraichissement renouvelable et de récupération - patrimoine collectivité   (MWh)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_16.b', 'cae', '16.b', null, 'Taux de couverture par les énergies renouvelables et de récupération des besoins en chaleur et rafraichissement - patrimoine collectivité (%)', '<p>Déclinaison de l&#x27;indicateur 16a:</p>
<p>Consommation de chaleur/rafraichissement renouvelable et de récupération - patrimoine collectivité   (MWh)</p>
<ul>
<li>Pour les bâtiments et équipements publics, l&#x27;indicateur mesure le rapport de la consommation de chaleur/rafraichissement issue d’energie renouvelable et de récupération sur la consommation totale d&#x27;énergie pour les usages thermiques (chauffage, eau chaude sanitaire, climatisation-rafraichissement) en énergie finale. Le patrimoine en DSP est inclus si possible. Les consommations thermiques des services publics eau/assainissement/déchets sont prises en compte lorsqu&#x27;ils sont de la compétence de la collectivité. Pour les collectivités compétentes, la récupération de chaleur des UIOM ainsi que sur les eaux usées/épurées peut ainsi être prise en compte pour la part autoconsommée sur place (bâtiments de la collectivité et process).</li>
</ul>
<p>Les pompes à chaleur prise en compte sont les pompes à chaleur eau/eau, sol/eau, sol/sol  avec une efficacité énergétique ≥ 126 % (PAC basse température) et une efficacité énergétique ≥ 111 % (PAC moyenne ou haute température).</p>
<p>Pour les bâtiments publics desservis par des réseaux de chaleur, le taux d’EnR&amp;R du réseau est défini réglementairement et s’apprécie au regard du bulletin officiel des impôts vis-a-vis de la TVA réduite (BOI-TVA-LIQ-30 chapitre 2.140). La co-génération fossile n’est pas prise en compte.</p>
', '%', false, 'Taux de couverture par les énergies renouvelables et de récupération des besoins en chaleur et rafraichissement - patrimoine collectivité (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_13.a', 'cae', '13.a', null, 'Dépenses énergétiques de la collectivité (euros)', '<p>L&#x27;indicateur mesure les dépenses d’énergie payées directement par la collectivité, c’est-à-dire celles payées par la collectivité aux fournisseurs et aux exploitants (uniquement le poste combustibles P1 dans ce dernier cas) pour le patrimoine bâti, l’éclairage public et les carburants des véhicules.</p>
<p>Les trois postes de dépenses sont également suivis indépendamment.</p>
<p>Rapportées au nombre d&#x27;habitants, pour les communes, les valeurs peuvent-être comparées avec des valeurs de références  tirées de l&#x27;enquête ADEME-AITF-EDF-GDF &quot;Energie et patrimoine communal 2012&quot;.</p>
', 'euros', false, 'Dépenses énergétiques de la collectivité (euros)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_13.b', 'cae', '13.b', null, 'Dépenses  énergétiques - bâtiments (euros)', '<p>Composante de l&#x27;indicateur de dépenses énergétiques de la collectivités pour les bâtiments</p>
<p>L&#x27;indicateur mesure les dépenses d’énergie payées directement par la collectivité, c’est-à-dire celles payées par la collectivité aux fournisseurs et aux exploitants (uniquement le poste combustibles P1 dans ce dernier cas) pour les bâtiments (patrimoine bâti)</p>
', 'euros', false, 'Dépenses  énergétiques - bâtiments (euros)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_13.c', 'cae', '13.c', null, 'Dépenses énergétiques - véhicules (euros)', '<p>Composante de l&#x27;indicateur de dépenses énergétiques de la collectivité pour les carburants des véhicules</p>
<p>L&#x27;indicateur mesure les dépenses d’énergie payées directement par la collectivité, c’est-à-dire celles payées par la collectivité aux fournisseurs et aux exploitants (uniquement le poste combustibles P1 dans ce dernier cas) pour les carburants des véhicules</p>
', 'euros', false, 'Dépenses énergétiques - véhicules (euros)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_13.d', 'cae', '13.d', null, 'Dépenses énergétiques - éclairage public  (euros)', '<p>Composante de l&#x27;indicateur de dépenses énergétiques de la collectivité pour l&#x27;éclairage public</p>
<p>L&#x27;indicateur mesure les dépenses d’énergie payées directement par la collectivité, c’est-à-dire celles payées par la collectivité aux fournisseurs et aux exploitants (uniquement le poste combustibles P1 dans ce dernier cas)  pour l&#x27;éclairage public</p>
', 'euros', false, 'Dépenses énergétiques - éclairage public  (euros)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_44', 'cae', '44', null, 'Part de voiries aménagées pour les cycles (%  Ou à défaut km/1000hab)', '<p>L&#x27;indicateur mesure le kilométrage de voiries aménagées (pistes le long de la voirie, bandes cyclables et couloirs bus autorisés aux vélos, les zones 30, les aires piétonnes…) sur le kilométrage total de voirie. Les aménagements à double-sens compte pour 1, les sens unique pour 0,5 ; les aménagements hors voirie ne sont pas pris en compte (voies vertes, pistes ne suivant pas le tracé de la voirie, allées de parcs, ...). A défaut, un indicateur en km/1000 habitants pourra être utilisé. Les valeurs de références sont basées sur un traitement des données du Club des villes et territoires cyclables, dans le cadre de l’Observatoire des mobilités actives, enquête 2015-2016.</p>
<ul>
<li>
<p>Valeurs limites :  25% ou 1 km/1000 hab (ville) et 20% ou 0,8 km/1000 hab(EPCI)</p>
</li>
<li>
<p>Valeurs cibles (objectifs) :  50% ou 2 km/1000 hab  (ville) et 40% ou 1,5 km/1000 hab (EPCI)</p>
</li>
</ul>
', '%  Ou à défaut km/1000hab', false, 'Part de voiries aménagées pour les cycles (%  Ou à défaut km/1000hab)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_10', 'cae', '10', null, 'Part des surfaces agricoles et naturelles (%)', '<p>Il s&#x27;agit de la mesure de la consommation ou de la réintroduction d&#x27;espaces naturels et agricoles au fil des ans grâce au suivi des surfaces réservées à ces usages dans les PLU, mesuré en pourcentage de la surface totale de la collectivité (ha cumulé des zones N et A/ha total). Ces surfaces sont non imperméabilisées, capteuses de CO2, productrices de ressources alimentaires, énergétiques, et de biodiversité. La valeur obtenue doit être comparée avec l&#x27;indicateur issu de la précédente version du document d&#x27;urbanisme de la collectivité.</p>
', '%', false, 'Part des surfaces agricoles et naturelles (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_4.1', 'crte', '4.1', null, 'Surface Agricole Utile totale du territoire (ha)', '<p><strong>Définition:</strong>
Surface Agricole Utile (SAU) totale du territoire</p>
<p><strong>Modalités de calcul:</strong>
Somme des surfaces agricoles utiles (SAU) du territoire</p>
<p><strong>Sources:</strong>
<a href="https://www.agencebio.org/vos-outils/les-chiffres-cles/">Agence bio</a> DRAAF/DDTM</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre le changement climatique; Gestion de la ressource en eau; Biodiversité</p>
<p><strong>Politique publique:</strong>
Agriculture et alimentation durable</p>
<p><strong>Objectif stratégique:</strong>
Développement de l’agriculture biologique</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Stratégie “De la Ferme à la Fourchette” (F2F) UE ; Plan ambition bio - Loi Egalim :</p>
<ul>
<li>15 % de SAU affectée à l’agriculture biologique au 31/12/2022 ; 30 % en 2030</li>
</ul>
', 'ha', false, 'Surface Agricole Utile totale du territoire (ha)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_14.a', 'cae', '14.a', null, 'Consommation d''énergie finale des bâtiments publics (MWh)', '<p>L&#x27;indicateur mesure la consommation énergétique totale (toute énergie, tout usage) du patrimoine bâti à la charge directe de la commune, en énergie finale. Les piscines et patinoires, si elles sont à la charge de la collectivité sont prises en compte, mais pas les services publics eau, assainissement, déchets, ni l&#x27;éclairage public.</p>
', 'MWh', false, 'Consommation d''énergie finale des bâtiments publics (MWh)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_14.b', 'cae', '14.b', null, 'Consommation d''énergie finale des bâtiments publics (rapporté au nb d''habitant, en kWh/hab)', '<p>L&#x27;indicateur mesure la consommation énergétique totale (toute énergie, tout usage) du patrimoine bâti à la charge directe de la commune, en énergie finale, rapportée par habitant et comparée à la valeur moyenne française (tirée de l&#x27;enquête ADEME-AITF-EDF-GDF &quot;Energie et patrimoine communal 2012&quot;) selon la taille de la collectivité. Les piscines et patinoires, si elles sont à la charge de la collectivité sont prises en compte, mais pas les services publics eau, assainissement, déchets, ni l&#x27;éclairage public. Pour les EPCI, l&#x27;indicateur en kWh/m².an est plus pertinent.</p>
', 'rapporté au nb d''habitant, en kWh/hab', false, 'Consommation d''énergie finale des bâtiments publics (rapporté au nb d''habitant, en kWh/hab)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_14.c', 'cae', '14.c', null, 'Consommation d''énergie finale des bâtiments publics (rapporté à la surface du patrimoine, en kWh/m²)', '<p>L&#x27;indicateur mesure la consommation énergétique totale (toute énergie, tout usage) du patrimoine bâti à la charge directe de la commune, en énergie finale, rapportée par rapport à la surface. Les piscines et patinoires, si elles sont à la charge de la collectivité sont prises en compte, mais pas les services publics eau, assainissement, déchets, ni l&#x27;éclairage public.</p>
', 'rapporté à la surface du patrimoine, en kWh/m²', false, 'Consommation d''énergie finale des bâtiments publics (rapporté à la surface du patrimoine, en kWh/m²)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_6.a', 'cae', '6.a', null, 'Production de déchets', '<p>Les déchets ménagers et assimilés comprennent les ordures ménagères résiduelles, les collectes sélectives et les déchets collectés en déchèteries (y compris déchets et gravats), soit la totalité des déchets des ménages et des non-ménagés pris en charge par le service public.</p>
<p>Les déchets produits par les services municipaux (déchets de l’assainissement collectif, déchets de nettoyage des rues, de marché, …) ne relèvent pas de ce périmètre.</p>
<p>Le calcul ne considère que les services de collecte opérationnels, c&#x27;est-à-dire ceux qui ont fonctionné au moins une journée au cours de l&#x27;année de référence du calcul et les déchèteries opérationnelles, c&#x27;est-à-dire des déchèteries qui ont été ouvertes au moins une journée au cours de l&#x27;année de référence du calcul.</p>
<p>La valeur limite est issue des chiffres-clés déchets de l’ADEME, édition 2016, basé sur l’enquête Collecte 2013 et la valeur cible des 47 territoires pionniers en France.</p>
<ul>
<li>
<p>Valeur limite : 573 kg/hab.an</p>
</li>
<li>
<p>Valeur cible : 480 kg/hab.an</p>
</li>
</ul>
', 'kg/habitant.an', true, 'Production de déchets ménagers et assimilés (avec déblais et gravats)', null, null, null, '{eci_dechets}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_6.b', 'cae', '6.b', null, 'Production Ordures ménagères résiduelles (kg/hab)', '<p>Composante de l&#x27;indicateur 6a:</p>
<p>Production de déchets ménagers et assimilés (avec déblais et gravats) par habitant (kg/hab.an)</p>
<ul>
<li>L&#x27;indicateur concerne uniquement les ordures ménagères résiduelles, c’est-à-dire les déchets collectés en mélange (poubelles ordinaires). La valeur limite est issue des chiffres-clés déchets de l’ADEME, édition 2016, basé sur l’enquête Collecte 2013 et la valeur cible des 47 territoires pionniers en France.</li>
</ul>
<ul>
<li>
<p>Valeur limite : 265 kg/hab.an</p>
</li>
<li>
<p>Valeur cible : 120 kg/hab.an</p>
</li>
</ul>
', 'kg/hab', false, 'Production Ordures ménagères résiduelles (kg/hab)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_6.c', 'cae', '6.c', null, 'Production de déchets collectés sélectivement, soit en porte-à-porte, soit en apport volontaire (kg/hab)', '<p>Composante de l&#x27;indicateur 6a:</p>
<p>Production de déchets ménagers et assimilés (avec déblais et gravats) par habitant (kg/hab.an)</p>
<p>: emballages, déchets fermentescibles, verre…</p>
', 'kg/hab', false, 'Production de déchets collectés sélectivement, soit en porte-à-porte, soit en apport volontaire (kg/hab)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_11', 'cae', '11', null, 'Surface annuelle artificialisée (ha/an)', '<p>L’indicateur mesure les surfaces artificialisées chaque année a minima par l’habitat et les activités, et dans la mesure du possible également pour les autres motifs (infrastructures routières, etc.). Si l’indicateur n’est pas disponible annuellement, il s’agit de la moyenne annuelle sur une période plus large, établi à l’occasion de l’élaboration ou de la révision du PLU ou du SCOT (évaluation règlementaire de la consommation d&#x27;espaces naturels, agricoles et forestiers).</p>
', 'ha/an', false, 'Surface annuelle artificialisée (ha/an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_48', 'cae', '48', null, 'Part d''ETP de la collectivité  dédié à la mise en œuvre de la politique climat air énergie ( %)', '<p>L’indicateur mesure le nombre de personnes en équivalent temps plein dédiées à la mise en œuvre de la politique climat-air-énergie. Pour être comptabilisé à 100%, l’intitulé du poste doit clairement se référer à cette politique (e : chargé de mission énergie, plan climat, mobilité douce…) ; pour des postes mixtes (ex : chargé de mission bâtiments), le poste ne doit pas être compté entièrement dans l’indicateur, mais uniquement l’estimation du % des tâches en lien avec la politique climat-air-énergie. Le personnel externe (prestataires) ne doit pas être pris en compte. Pour faciliter la comparaison, le nombre d’ETP est ramené au nombre total d&#x27;ETP de la collectivité.</p>
', '%', false, 'Part d''ETP de la collectivité  dédié à la mise en œuvre de la politique climat air énergie ( %)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_32', 'cae', '32', null, 'Rendement énergétique UIOM en % (valorisation énergétique électricité et chaleur)', '<p>Le rendement de l&#x27;UIOM (unité d&#x27;incinération des ordures ménagères) est calculé selon la formule permettant la modulation du taux de la TGAP (arrêté du 7 décembre 2016 modifiant l&#x27;arrêté du 20 septembre 2002 relatif aux installations d&#x27;incinération et de coïncinération de déchets non dangereux et aux installations incinérant des déchets d&#x27;activités de soins à risques infectieux). Le niveau de performance énergétique choisi comme valeur cible est celui utilisé à l&#x27;article 266 nonies du code des douanes pour bénéficier d’une TGAP réduite.</p>
<ul>
<li>Valeur limite et cible : 65%</li>
</ul>
', 'valorisation énergétique électricité et chaleur', false, 'Rendement énergétique UIOM en % (valorisation énergétique électricité et chaleur)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_5', 'cae', '5', null, 'Part modale de la voiture (en nombre de déplacements)', '<p>L&#x27;objectif de cet indicateur est de juger de l&#x27;impact des mesures de planification des déplacements sur l&#x27;utilisation de la voiture sur le territoire, via le suivi de la part modale de la voiture (nombre de déplacements en voiture/nombre de déplacements). Pour information, des valeurs limites et cibles indicatives de parts modales sont données, basées sur les moyennes nationales et les meilleurs scores atteints par des collectivités Cit&#x27;ergie. Mais le conseiller doit apprécier les efforts de la collectivité, en fonction du contexte territorial, et les progrès réalisés sur l&#x27;indicateur.</p>
<ul>
<li>
<p>Valeur limite : 65 % (ville dans une aire urbaine) / 75% (EPCI ou ville hors aire urbaine)</p>
</li>
<li>
<p>Valeur cible : 40 % (ville dans une aire urbaine) / 50 % (EPCI ou ville hors aire urbaine)</p>
</li>
</ul>
', 'en nombre de déplacements', false, 'Part modale de la voiture (en nombre de déplacements)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_1.a', 'cae', '1.a', null, 'Émissions de gaz à effet de serre', '<p>Émissions de gaz à effet de serre globales annuelles du territoire exprimées en tonnes équivalent CO2.</p>
<p>L&#x27;indicateur, issu d&#x27;un diagnostic d&#x27;émissions de gaz à effet de serre mesure la quantité totale d&#x27;émissions annuelle des différents secteurs d&#x27;activités et des habitants du territoire, selon les exigences réglementaires des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial).</p>
<p>A savoir : les  émissions  directes  produites par l&#x27;ensemble des secteurs résidentiel, tertiaire, transport routier, autres transports, agriculture, déchets, industrie hors branche énergie, branche énergie (hors production d&#x27;électricité, de chaleur et de froid pour les émissions de gaz à effet de serre, dont les émissions correspondantes sont comptabilisées au stade de la consommation).</p>
<p>Il ne s&#x27;agit pas du bilan GES &quot;Patrimoine et compétences&quot;.</p>
', 'teq CO2', false, 'Quantité de gaz à effet de serre émis par les activités et les habitants tous les ans', null, null, null, '{energie_et_climat}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_60', 'cae', '60', null, 'Part de produits biologiques dans la restauration collective publique (%)', '<p>L’indicateur mesure la part des achats (en euros) labellisés « agriculture biologique » dans les achats totaux d’alimentation de la restauration collective publique (maîtrisée par la collectivité).  Pour la France métropole, la valeur limite est basée sur la part nationale des achats biologiques dans la restauration collective à caractère social en 2015 (3,2% - Agence Bio) et la valeur cible sur l’objectif 2022 du projet de loi pour l’équilibre des relations commerciales dans le secteur agricole et alimentaire et une alimentation saine et durable (20%).</p>
', '%', false, 'Part de produits biologiques dans la restauration collective publique (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_42', 'cae', '42', null, 'Nombre de places de stationnement public pour les voitures par habitant (nb/hab)', '<p>L&#x27;indicateur mesure le nombre de places de stationnement public pour les voitures par habitant (stationnements publics gratuit ou payant, sur voirie ou dans des ouvrages, exploité en régie par la collectivité –commune ou EPCI- ou délégué). Si le périmètre suivi est partiel, l’indiquer en commentaire.</p>
', 'nb/hab', false, 'Nombre de places de stationnement public pour les voitures par habitant (nb/hab)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_62', 'cae', '62', null, 'Part de surface forestière certifiée (%)', '<p>L&#x27;indicateur mesure le % de surfaces forestières certifiées FSC ou PEFC (par rapport à la surface forestière totale). Les objectifs sont basés sur les valeurs moyennes françaises et des dires d&#x27;experts  ADEME.</p>
', '%', false, 'Part de surface forestière certifiée (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_22', 'cae', '22', null, 'Taux d''énergie renouvelable et de récupération (ENR&R) des réseaux de chaleur sur le territoire (en %)', '<p>Il s&#x27;agit de mesurer la part d&#x27;énergie renouvelable et de récupération (ENR&amp;R) du réseau de chaleur de la collectivité. La méthodologie de calcul doit être conforme à celle élaborée par le SNCU, reprise réglementairement dans le cadre de l&#x27;instruction fiscale ou le classement du réseau de chaleur. En présence de plusieurs réseaux de chaleur, une moyenne doit être réalisée. La valeur cible est fixée à 75%.</p>
', 'ENR&R', false, 'Taux d''énergie renouvelable et de récupération (ENR&R) des réseaux de chaleur sur le territoire (en %)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_2.1.hab', 'crte', '2.1.hab', 'cae_2.b', 'Consommation énergétique finale annuelle (MWh/hab)', '<p><strong>Définition:</strong>
Consommation énergétique finale du territoire, tous types (électricité, gaz naturel, biogaz, pétrole, charbon-bois, charbon-combustion minérale fossile) et tous secteurs (industrie, agriculture, résidentiel-tertiaire, énergie, déchets, transport) confondus, totale et par habitant</p>
<p><strong>Modalités de calcul:</strong>
Somme des consommations réelles d’énergie des utilisateurs finaux sur le territoire, y compris les consommations d’électricité et de chaleur qui sont des énergies secondaires.</p>
<p>Pour la consommation par habitant, rapporter la consommation d’énergie totale du territoire à la population statistique au sens de l’INSEE</p>
<p><strong>Sources:</strong>
Observatoires régionaux de l’énergie, du climat et de l’air</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre le changement climatique</p>
<p><strong>Politique publique:</strong>
Transition énergétique</p>
<p><strong>Objectif stratégique:</strong>
Réduire la consommation finale d’énergie</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Programmation pluriannuelle de l’énergie (PPE)</p>
<ul>
<li>
<p>Baisse de la consommation finale d’énergie de 16,5 % en 2028 par rapport à 2012 (soit 15,4 % par rapport à 2018)</p>
</li>
<li>
<p>Baisse de 20 % de la consommation primaire d’énergies fossiles en 2023 et de 35 % en 2028 par rapport à 2012</p>
</li>
</ul>
', 'MWh/hab', false, 'Consommation énergétique finale annuelle (MWh/hab)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_13.1', 'crte', '13.1', 'cae_11', 'Artificialisation des espaces naturels, agricoles, forestiers (ha)', '<p><strong>Définition:</strong>
Consommation annuelle d’espaces naturels, agricoles ou forestiers par des opérations d’aménagement pouvant entraîner une imperméabilisation partielle ou totale, afin de les affecter notamment à des fonctions urbaines ou de transport (habitat, activités, commerces, infrastructures, équipements publics…)</p>
<p><strong>Modalités de calcul:</strong>
Somme des consommations annuelles d’espaces NAF sur les communes du territoire</p>
<p><strong>Sources:</strong></p>
<a href="https://artificialisation.biodiversitetousvivants.fr/bases-donnees/les-fichiers-fonciers">
Fichiers fonciers - données fiscales retraitées par le CEREMA
</a>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Biodiversité, protection des espaces naturels, agricoles et forestiers</p>
<p><strong>Politique publique:</strong>
Lutte contre l’artificialisation des sols</p>
<p><strong>Objectif stratégique:</strong>
Réduire le rythme d’artificialisation des sols</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Plan national biodiversité : zéro artificialisation nette</p>
<p>Loi de finances pour 2021 : diviser par deux le rythme d’artificialisation des sols d’ici 2030</p>
', 'ha', false, 'Artificialisation des espaces naturels, agricoles, forestiers (ha)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_11.1-SO2', 'crte', '11.1-SO2', 'cae_4.e', 'Emissions annuelles de SO2 du territoire (tonnes)', '<p><strong>Définition:</strong>
Suivi annuel de la qualité de l’air au regard des émissions de polluants que sont les SO2, NOX, COVNM, PM2,5, et NH3.</p>
<p><strong>Modalités de calcul:</strong>
Calcul à effectuer selon la méthode PCIT définie au niveau national.</p>
<p><strong>Sources:</strong>
observatoires régionaux de l’énergie, du climat et de l’air</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre les pollutions</p>
<p><strong>Politique publique:</strong>
Prévention des risques et santé environnementale</p>
<p><strong>Objectif stratégique:</strong>
Réduire les émissions de polluants atmosphériques</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Plan national de réduction des émissions polluantes (décret n°2017-949 du 10 mai 2017): réduction des polluants par rapport aux émissions de 2005</p>
<ul>
<li>
<p>SO2 (objectifs : 2020 = -55% / 2025 = -66% / 2030 = -77%)</p>
</li>
<li>
<p>Nox (2020 = -50% /2025 = -60% / 2030 = -69%)</p>
</li>
<li>
<p>COVNM (2020 = -43% / 2025 = -47% /2030 = -52%)</p>
</li>
<li>
<p>PM2,5 (2020 = -27% /2025 = -42% /2030 = -57%)</p>
</li>
<li>
<p>NH3 (2020 = -4% /2025 = -8% / 2030 = -13%)</p>
</li>
</ul>
', 'tonnes', false, 'Emissions annuelles de SO2 du territoire (tonnes)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_11.1-NOx', 'crte', '11.1-NOx', 'cae_4.a', 'Emissions annuelles de NOx du territoire (tonnes)', '<p><strong>Définition:</strong>
Suivi annuel de la qualité de l’air au regard des émissions de polluants que sont les SO2, NOX, COVNM, PM2,5, et NH3.</p>
<p><strong>Modalités de calcul:</strong>
Calcul à effectuer selon la méthode PCIT définie au niveau national.</p>
<p><strong>Sources:</strong>
observatoires régionaux de l’énergie, du climat et de l’air</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre les pollutions</p>
<p><strong>Politique publique:</strong>
Prévention des risques et santé environnementale</p>
<p><strong>Objectif stratégique:</strong>
Réduire les émissions de polluants atmosphériques</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Plan national de réduction des émissions polluantes (décret n°2017-949 du 10 mai 2017): réduction des polluants par rapport aux émissions de 2005</p>
<ul>
<li>
<p>SO2 (objectifs : 2020 = -55% / 2025 = -66% / 2030 = -77%)</p>
</li>
<li>
<p>Nox (2020 = -50% /2025 = -60% / 2030 = -69%)</p>
</li>
<li>
<p>COVNM (2020 = -43% / 2025 = -47% /2030 = -52%)</p>
</li>
<li>
<p>PM2,5 (2020 = -27% /2025 = -42% /2030 = -57%)</p>
</li>
<li>
<p>NH3 (2020 = -4% /2025 = -8% / 2030 = -13%)</p>
</li>
</ul>
', 'tonnes', false, 'Emissions annuelles de NOx du territoire (tonnes)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_11.1-COVNM', 'crte', '11.1-COVNM', 'cae_4.d', 'Emissions annuelles de COVNM du territoire (tonnes)', '<p><strong>Définition:</strong>
Suivi annuel de la qualité de l’air au regard des émissions de polluants que sont les SO2, NOX, COVNM, PM2,5, et NH3.</p>
<p><strong>Modalités de calcul:</strong>
Calcul à effectuer selon la méthode PCIT définie au niveau national.</p>
<p><strong>Sources:</strong>
observatoires régionaux de l’énergie, du climat et de l’air</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre les pollutions</p>
<p><strong>Politique publique:</strong>
Prévention des risques et santé environnementale</p>
<p><strong>Objectif stratégique:</strong>
Réduire les émissions de polluants atmosphériques</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Plan national de réduction des émissions polluantes (décret n°2017-949 du 10 mai 2017): réduction des polluants par rapport aux émissions de 2005</p>
<ul>
<li>
<p>SO2 (objectifs : 2020 = -55% / 2025 = -66% / 2030 = -77%)</p>
</li>
<li>
<p>Nox (2020 = -50% /2025 = -60% / 2030 = -69%)</p>
</li>
<li>
<p>COVNM (2020 = -43% / 2025 = -47% /2030 = -52%)</p>
</li>
<li>
<p>PM2,5 (2020 = -27% /2025 = -42% /2030 = -57%)</p>
</li>
<li>
<p>NH3 (2020 = -4% /2025 = -8% / 2030 = -13%)</p>
</li>
</ul>
', 'tonnes', false, 'Emissions annuelles de COVNM du territoire (tonnes)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_11.1-PM', 'crte', '11.1-PM', 'cae_4.c', 'Emissions annuelles de PM2,5 du territoire (tonnes)', '<p><strong>Définition:</strong>
Suivi annuel de la qualité de l’air au regard des émissions de polluants que sont les SO2, NOX, COVNM, PM2,5, et NH3.</p>
<p><strong>Modalités de calcul:</strong>
Calcul à effectuer selon la méthode PCIT définie au niveau national.</p>
<p><strong>Sources:</strong>
observatoires régionaux de l’énergie, du climat et de l’air</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre les pollutions</p>
<p><strong>Politique publique:</strong>
Prévention des risques et santé environnementale</p>
<p><strong>Objectif stratégique:</strong>
Réduire les émissions de polluants atmosphériques</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Plan national de réduction des émissions polluantes (décret n°2017-949 du 10 mai 2017): réduction des polluants par rapport aux émissions de 2005</p>
<ul>
<li>
<p>SO2 (objectifs : 2020 = -55% / 2025 = -66% / 2030 = -77%)</p>
</li>
<li>
<p>Nox (2020 = -50% /2025 = -60% / 2030 = -69%)</p>
</li>
<li>
<p>COVNM (2020 = -43% / 2025 = -47% /2030 = -52%)</p>
</li>
<li>
<p>PM2,5 (2020 = -27% /2025 = -42% /2030 = -57%)</p>
</li>
<li>
<p>NH3 (2020 = -4% /2025 = -8% / 2030 = -13%)</p>
</li>
</ul>
', 'tonnes', false, 'Emissions annuelles de PM2,5 du territoire (tonnes)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_11.1-NH3', 'crte', '11.1-NH3', 'cae_4.f', 'Emissions annuelles de NH3 du territoire (tonnes)', '<p><strong>Définition:</strong>
Suivi annuel de la qualité de l’air au regard des émissions de polluants que sont les SO2, NOX, COVNM, PM2,5, et NH3.</p>
<p><strong>Modalités de calcul:</strong>
Calcul à effectuer selon la méthode PCIT définie au niveau national.</p>
<p><strong>Sources:</strong>
observatoires régionaux de l’énergie, du climat et de l’air</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre les pollutions</p>
<p><strong>Politique publique:</strong>
Prévention des risques et santé environnementale</p>
<p><strong>Objectif stratégique:</strong>
Réduire les émissions de polluants atmosphériques</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Plan national de réduction des émissions polluantes (décret n°2017-949 du 10 mai 2017): réduction des polluants par rapport aux émissions de 2005</p>
<ul>
<li>
<p>SO2 (objectifs : 2020 = -55% / 2025 = -66% / 2030 = -77%)</p>
</li>
<li>
<p>Nox (2020 = -50% /2025 = -60% / 2030 = -69%)</p>
</li>
<li>
<p>COVNM (2020 = -43% / 2025 = -47% /2030 = -52%)</p>
</li>
<li>
<p>PM2,5 (2020 = -27% /2025 = -42% /2030 = -57%)</p>
</li>
<li>
<p>NH3 (2020 = -4% /2025 = -8% / 2030 = -13%)</p>
</li>
</ul>
', 'tonnes', false, 'Emissions annuelles de NH3 du territoire (tonnes)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_1.1', 'crte', '1.1', 'cae_1.a', 'Emissions de GES annuelles du territoire (TeqCO2 / an)', '<p><strong>Définition:</strong>
Émissions de gaz à effet de serre totales sur le territoire</p>
<p><strong>Modalités de calcul:</strong>
Pour définir les émissions de GES, se référer à l’outil Bilan GES Territoire de l’Ademe en privilégiant l’approche globale :
<a href="https://www.bilans-ges.ademe.fr/fr/accueil/contenu/index/page/Bilan%2BGES%2BTerritoires/siGras/0">
Bilan GES
</a>
ou une méthode équivalente.</p>
<p><strong>Sources:</strong>
Observatoires régionaux de l’énergie, du climat et de l’air</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre le changement climatique</p>
<p><strong>Politique publique:</strong>
Limitation du changement climatique</p>
<p><strong>Objectif stratégique:</strong>
Réduire les émissions de gaz à effet de serre (GES)</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Stratégie Nationale Bas Carbone (SNBC) :</p>
<ul>
<li>
<p>Valeur cible à 1,1 teqCO2/hab d’ici 2050</p>
</li>
<li>
<p>40 % émissions GES globales en 2030 / -75 % en 2050 (par rapport à 1990)</p>
</li>
<li>
<p>35 % émissions GES du secteur industriel en 2030 / 80 % en 2050 (par rapport à 1990)</p>
</li>
<li>
<p>50 % émissions GES du secteur agricole en 2050 (par rapport à 2015)</p>
</li>
<li>
<p>0 GES liées à la production d’énergie en 2050</p>
</li>
<li>
<p>0 GES liées au secteur du bâtiment en 2050 (100 % de bâtiments neutres)</p>
</li>
</ul>
<p><strong>Données de référence:</strong>
Préciser si possible les moyennes nationale et/ou locale, le cas échéant contextualisées (territoire urbain/rural/autre) pour permettre au territoire de mieux se situer. Voir le rapport 2020 du Haut Conseil pour le Climat (données 2017), en particulier les pages 73 et suivantes :</p>
<ul>
<li>6,9 teqCO2/hab au niveau national</li>
</ul>
', 'teq CO2', false, 'Emissions de GES annuelles du territoire (TeqCO2 / an)', null, null, null, '{}');

insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_12', 'cae', '12', null, 'Part de bâtiments publics ayant fait l''objet d''un diagnostic énergétique', '<p>L&#x27;indicateur mesure la part de bâtiments publics (de préférence en surface, et par défaut en nombre) ayant fait l&#x27;objet d&#x27;un diagnostic énergétique (à minima de type DPE, et de préférence un audit énergétique plus poussé). Le périmètre des bâtiments pris en compte est le plus large possible : celui dont elle est propriétaire ou celui dont elle est locataire ; les diagnostics pouvant être portés et financés par le propriétaire ou l&#x27;utilisateur. Si le suivi est effectué conjointement au niveau communal et intercommunal, l&#x27;indicateur peut-être décomposé en deux volets : part de bâtiments communaux ayant fait l&#x27;objet d&#x27;un diagnostic énergétique et part de bâtiments intercommunaux ayant fait l&#x27;objet d&#x27;un diagnostic énergétique.</p>
', 'Non trouvé', false, 'Part de bâtiments publics ayant fait l''objet d''un diagnostic énergétique', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_64', 'cae', '64', null, 'Part d''établissements scolaires couverts par un PDES ou un pédibus/vélobus', '<p>L&#x27;indicateur comptabilise le nombre d&#x27;établissement scolaires (écoles primaires, collèges, lycées) couverts par un Plan de Déplacements Etablissements Scolaires ou un pédibus/vélobus (pour les écoles primaires principalement) sur le territoire et le rapporte au nombre total d&#x27;établissements scolaires. Ce chiffre doit être en augmentation chaque année. Des valeurs indicatives limites (10%) et cibles (30%) sont données, basées sur des données ADEME et les meilleurs scores des collectivités Cit&#x27;ergie.</p>
', 'Non trouvé', false, 'Part d''établissements scolaires couverts par un PDES ou un pédibus/vélobus', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_55', 'cae', '55', null, 'Nombre de ménages demandeurs et bénéficiaires du FSL pour l’aide au paiement des factures d’énergie sur le territoire', '<p>L’indicateur mesure annuellement le nombre de ménages demandeurs et bénéficiaires du fond de solidarité logement (FSL) pour l’aide au paiement des factures d’énergie sur le territoire. Il peut être obtenu auprès des Conseils Départementaux qui gèrent ce fond (indicateur suivi au niveau national par l’office national de la précarité énergétique).</p>
', 'Non trouvé', false, 'Nombre de ménages demandeurs et bénéficiaires du FSL pour l’aide au paiement des factures d’énergie sur le territoire', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_50', 'cae', '50', null, 'Valorisation des CEE (kWhcumac  valorisé/an)', '<p>Les kWhcumac valorisés chaque année par la collectivité sont calculés selon les modalités règlementaires du dispositif des certificats d&#x27;économie d&#x27;énergie. Il s&#x27;agit de ceux dont la rente revient à la collectivité.</p>
', 'kWhcumac  valorisé/an', false, 'Valorisation des CEE (kWhcumac  valorisé/an)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_46', 'cae', '46', null, 'Fréquentation des TC (voyages/hab)', '<p>Il s&#x27;agit du nombre moyen de voyages en transport en commun effectué chaque année par un habitant. Source de l&#x27;indicateur : L&#x27;année 2007 des transports urbains, GART – Enquête annuelle sur les transports urbains (CERTU-DGITMGART-UTP) sur 192 réseaux.</p>
<ul>
<li>
<p>Valeur limite : 32 (&lt;100 000 hab) et 64 (&gt;100 000 hab)</p>
</li>
<li>
<p>Valeur cible : 114 (&lt;100 000 hab) et 140 (&gt;100 000 hab)</p>
</li>
</ul>
', 'voyages/hab', false, 'Fréquentation des TC (voyages/hab)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_33', 'cae', '33', null, 'Energie produite par la valorisation des biodéchets en kWh/an (à défaut kg/hab.an de biodéchets collectés de manière séparative -méthanisation et/ou compostage)', '<p>L&#x27;indicateur mesure l&#x27;électricité et la chaleur (en kWh) produite à partir de biodéchets pour l&#x27;ensemble du territoire (ménages et activités économiques, agricoles...). A défaut, l&#x27;indicateur indique le tonnage des biodéchets collectés de manière séparative. Pour information, le ratio moyen de déchets alimentaires collectés par l’ensemble des collectivités en France en 2015 est de 63 kg/habitant desservi (étude suivi technico-économique biodéchets, Ademe, 2017) :</p>
<ul>
<li>
<p>46 kg/habitant desservi pour la collecte de déchets alimentaires seuls;</p>
</li>
<li>
<p>99 kg/habitant desservi pour la collecte de déchets alimentaires et déchets verts.</p>
</li>
</ul>
', 'à défaut kg/hab.an de biodéchets collectés de manière séparative -méthanisation et/ou compostage-', false, 'Energie produite par la valorisation des biodéchets en kWh/an (à défaut kg/hab.an de biodéchets collectés de manière séparative -méthanisation et/ou compostage)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_65', 'cae', '65', null, 'Nombre d''heures de consultations et de conseils sur la thématique climat air énergie pour 100 hab / an', '<p>Nombre d&#x27;heures de consultations et de conseil sur l&#x27;énergie et la construction pour 100 hab / an</p>
<ul>
<li>
<p>Valeur limite = 10 min /100 hab</p>
</li>
<li>
<p>Valeur cible = 60 min / 100 hab</p>
</li>
</ul>
', 'Non trouvé', false, 'Nombre d''heures de consultations et de conseils sur la thématique climat air énergie pour 100 hab / an', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_4.2', 'crte', '4.2', 'cae_59', 'Part de la surface agricole utile en agriculture biologique (%)', '<p><strong>Définition:</strong>
Part des surfaces d’exploitations agricoles certifiée agriculture biologique (AB) ou en conversion dans le total des SAU du territoire</p>
<p><strong>Modalités de calcul:</strong>
Somme des surfaces (en SAU) exploitées selon le label agriculture biologique (certifiée ou en conversion) rapportée au total des SAU du territoire</p>
<p><strong>Sources:</strong>
<a href="https://www.agencebio.org/vos-outils/les-chiffres-cles/">Agence bio</a> DRAAF/DDTM</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre le changement climatique; Gestion de la ressource en eau; Biodiversité</p>
<p><strong>Politique publique:</strong>
Agriculture et alimentation durable</p>
<p><strong>Objectif stratégique:</strong>
Développement de l’agriculture biologique</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Stratégie “De la Ferme à la Fourchette” (F2F) UE ; Plan ambition bio - Loi Egalim :</p>
<ul>
<li>15 % de SAU affectée à l’agriculture biologique au 31/12/2022 ; 30 % en 2030</li>
</ul>
', '%', false, 'Part de la surface agricole utile en agriculture biologique (%)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_10.1', 'crte', '10.1', 'cae_6.a', 'Collecte annuelle de déchets ménagers et assimilés avec gravats', '<p><strong>Définition:</strong>
Tonnage total de déchets ménagers et assimilés (DMA), y compris gravats, collectés annuellement sur le territoire, rapportée au nombre d’habitants.</p>
<p><strong>Modalités de calcul:</strong>
Le résultat est obtenu par cumul des tonnages collectés par les déchèteries opérationnelles, c&#x27;est-à-dire des déchèteries qui ont été ouvertes au moins une journée au cours de l&#x27;année de référence du calcul</p>
<p>et celui des collectes opérationnelles, c&#x27;est-à-dire les services de collecte qui ont fonctionné au moins une journée au cours de l&#x27;année de référence du calcul.</p>
<p>Pour la production par habitant, la production totale du territoire est rapportée à la population légale au sens de l’INSEE.</p>
<p><strong>Sources:</strong></p>
<a href="https://www.sinoe.org/#access-evitement">
Base SINOE Ademe
</a>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Economie circulaire, déchets et prévention des risques technologiques</p>
<p><strong>Politique publique:</strong>
Economie circulaire et circuits courts</p>
<p><strong>Objectif stratégique:</strong>
Réduire la production de déchets</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Feuille de route et loi anti-gaspillage pour une économie circulaire:</p>
<ul>
<li>
<p>Réduire de 15 % de quantités de déchets ménagers et assimilés produits par habitant en 2030 par rapport à 2010;</p>
</li>
<li>
<p>Augmenter le réemploi et la réutilisation en vue d’atteindre l’équivalent de 5 % du tonnage des déchets ménagers en 2030;</p>
</li>
<li>
<p>Augmenter la quantité de déchets ménagers et assimilés faisant l&#x27;objet d&#x27;une préparation en vue de la réutilisation ou d&#x27;un recyclage afin d’atteindre 55 % en 2025, 60 % en 2030 et 65 % en 2035;</p>
</li>
<li>
<p>Réduire le gaspillage alimentaire de 50% d’ici 2025, par rapport à 2015, dans la distribution alimentaire et la restauration collective, et de 50 % d’ici 2030, par rapport à 2015, dans la consommation, la production, la transformation et la restauration commerciale;</p>
</li>
<li>
<p>Réduire de 30 % les déchets non dangereux et non inertes mis en décharge en 2020 par rapport à 2010; et de 50 % en 2025;</p>
</li>
<li>
<p>Réduire les quantités de déchets ménagers et assimilés mis en décharge à 10 % des quantités de déchets ménagers et assimilés produits en 2035.</p>
</li>
</ul>
<p><strong>Données de référence:</strong>
Au niveau national, la production de DMA est de 581kg/hab en 2017. Hors gravats, la production de DMA est de 526kg/hab. (Source : Ademe, janvier 2021 : La collecte des déchets par le service public en France - Résultats 2017)</p>
', 'kg/hab', false, 'Collecte annuelle de déchets ménagers et assimilés avec gravats', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_10.2', 'crte', '10.2', 'cae_6.a', 'Collecte annuelle de déchets ménagers et assimilés hors gravats (kg/hab)', '<p><strong>Définition:</strong>
Tonnage total de déchets ménagers et assimilés (DMA), hors gravats, collectés annuellement sur le territoire, rapportée au nombre d’habitants.</p>
<p><strong>Modalités de calcul:</strong>
Le résultat est obtenu par cumul des tonnages collectés par les déchèteries opérationnelles, c&#x27;est-à-dire des déchèteries qui ont été ouvertes au moins une journée au cours de l&#x27;année de référence du calcul et celui des collectes opérationnelles, c&#x27;est-à-dire les services de collecte qui ont fonctionné au moins une journée au cours de l&#x27;année de référence du calcul.</p>
<p>Pour la production par habitant, la production totale du territoire est rapportée à la population légale au sens de l’INSEE.</p>
<p><strong>Sources:</strong></p>
<a href="https://www.sinoe.org/#access-evitement">
Base SINOE Ademe
</a>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Economie circulaire, déchets et prévention des risques technologiques</p>
<p><strong>Politique publique:</strong>
Economie circulaire et circuits courts</p>
<p><strong>Objectif stratégique:</strong>
Réduire la production de déchets</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Feuille de route et loi anti-gaspillage pour une économie circulaire:</p>
<ul>
<li>
<p>Réduire de 15 % de quantités de déchets ménagers et assimilés produits par habitant en 2030 par rapport à 2010;</p>
</li>
<li>
<p>Augmenter le réemploi et la réutilisation en vue d’atteindre l’équivalent de 5 % du tonnage des déchets ménagers en 2030;</p>
</li>
<li>
<p>Augmenter la quantité de déchets ménagers et assimilés faisant l&#x27;objet d&#x27;une préparation en vue de la réutilisation ou d&#x27;un recyclage afin d’atteindre 55 % en 2025, 60 % en 2030 et 65 % en 2035;</p>
</li>
<li>
<p>Réduire le gaspillage alimentaire de 50 % d’ici 2025, par rapport à 2015, dans la distribution alimentaire et la restauration collective, et de 50 % d’ici 2030, par rapport à 2015, dans la consommation, la production, la transformation et la restauration commerciale;</p>
</li>
<li>
<p>Réduire de 30 % les déchets non dangereux et non inertes mis en décharge en 2020 par rapport à 2010; et de 50 % en 2025;</p>
</li>
<li>
<p>Réduire les quantités de déchets ménagers et assimilés mis en décharge à 10 % des quantités de déchets ménagers et assimilés produits en 2035.</p>
</li>
</ul>
<p><strong>Données de référence:</strong>
Au niveau national, la production de DMA est de 581kg/hab en 2017. Hors gravats, la production de DMA est de 526kg/hab. (Source : Ademe, janvier 2021 : La collecte des déchets par le service public en France - Résultats 2017)</p>
', 'kg/hab', false, 'Collecte annuelle de déchets ménagers et assimilés hors gravats (kg/hab)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_2.1', 'crte', '2.1', 'cae_2.a', 'Consommation énergétique finale annuelle (GWh)', '<p><strong>Définition:</strong>
Consommation énergétique finale du territoire, tous types (électricité, gaz naturel, biogaz, pétrole, charbon-bois, charbon-combustion minérale fossile) et tous secteurs (industrie, agriculture, résidentiel-tertiaire, énergie, déchets, transport) confondus, totale</p>
<p><strong>Modalités de calcul:</strong>
Somme des consommations réelles d’énergie des utilisateurs finaux sur le territoire, y compris les consommations d’électricité et de chaleur qui sont des énergies secondaires.</p>
<p><strong>Sources:</strong>
Observatoires régionaux de l’énergie, du climat et de l’air</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre le changement climatique</p>
<p><strong>Politique publique:</strong>
Transition énergétique</p>
<p><strong>Objectif stratégique:</strong>
Réduire la consommation finale d’énergie</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Programmation pluriannuelle de l’énergie (PPE)</p>
<ul>
<li>
<p>Baisse de la consommation finale d’énergie de 16,5 % en 2028 par rapport à 2012 (soit 15,4 % par rapport à 2018)</p>
</li>
<li>
<p>Baisse de 20 % de la consommation primaire d’énergies fossiles en 2023 et de 35 % en 2028 par rapport à 2012</p>
</li>
</ul>
<p><strong>Données de référence:</strong>
Préciser si possible les moyennes nationale et/ou locale, le cas échéant contextualisées (territoire urbain/rural/autre) pour permettre au territoire de mieux se situer.</p>
', 'GWh', false, 'Consommation énergétique finale annuelle (GWh)', null, null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_1.h', 'cae', '1.h', null, 'Emissions de gaz à effet de serre des déchets', '<p>Émissions de gaz à effet de serre globales annuelles du territoire exprimées en tonnes équivalent CO2 pour le secteur des déchets.</p>
<p>Décomposition par secteur réglementaire de l&#x27;indicateur global</p>
<p>Émissions de gaz à effet de serre globales annuelles du territoire (teq CO2)</p>
', 'teq CO2', false, 'Emissions de gaz à effet de serre des déchets', 'cae_1.a', null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_1.i', 'cae', '1.i', null, 'Emissions de gaz à effet de serre de l''industrie hors branche énergie', '<p>Émissions de gaz à effet de serre globales annuelles du territoire exprimées en tonnes équivalent CO2 pour le secteur de l&#x27;industrie hors branche énergie.</p>
<p>Décomposition par secteur réglementaire de l&#x27;indicateur global</p>
<p>Émissions de gaz à effet de serre globales annuelles du territoire (teq CO2)</p>
', 'teq CO2', false, 'Emissions de gaz à effet de serre de l''industrie hors branche énergie', 'cae_1.a', null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_1.j', 'cae', '1.j', null, 'Emissions de gaz à effet de serre de l''industrie branche énergie', '<p>Émissions de gaz à effet de serre globales annuelles du territoire exprimées en tonnes équivalent CO2 pour le secteur de l&#x27;industrie branche énergie (hors production d&#x27;électricité, de chaleur et de froid pour les émissions de gaz à effet de serre, dont les émissions correspondantes sont comptabilisées au stade de la consommation).</p>
<p>Décomposition par secteur réglementaire de l&#x27;indicateur global</p>
<p>Émissions de gaz à effet de serre globales annuelles du territoire (teq CO2)</p>
', 'teq CO2', false, 'Emissions de gaz à effet de serre de l''industrie branche énergie', 'cae_1.a', null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_1.b', 'cae', '1.b', null, 'Emissions de gaz à effet de serre par habitant', '<p>Émissions de gaz à effet de serre globales annuelles du territoire exprimées en tonnes équivalent CO2 par habitant.</p>
<p>Pour faciliter les comparaisons, l’indicateur est ramené au nombre d’habitants (population municipale selon l’INSEE).</p>
<p>Pour rappel, objectifs nationaux : division par 4 (-75 %) des émissions de gaz à effet de serre d’ici 2050 par rapport à 1990 (loi POPE) et étape intermédiaire de -40% entre 1990 et 2030 (loi de transition énergétique).</p>
<p>L&#x27;évaluation est basée sur l&#x27;évolution de l&#x27;indicateur.</p>
', 'teq CO2/hab', false, 'Emissions de gaz à effet de serre par habitant', 'cae_1.a', null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_1.c', 'cae', '1.c', null, 'Emissions de gaz à effet de serre du résidentiel', '<p>Émissions de gaz à effet de serre globales annuelles du territoire exprimées en tonnes équivalent CO2 pour le secteur résidentiel.</p>
<p>Décomposition par secteur réglementaire de l&#x27;indicateur global</p>
<p>Émissions de gaz à effet de serre globales annuelles du territoire (teq CO2)</p>
', 'teq CO2', false, 'Emissions de gaz à effet de serre du résidentiel', 'cae_1.a', null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_1.d', 'cae', '1.d', null, 'Emissions de gaz à effet de serre du tertiaire', '<p>Émissions de gaz à effet de serre globales annuelles du territoire exprimées en tonnes équivalent CO2 pour le secteur tertiaire.</p>
<p>Décomposition par secteur réglementaire de l&#x27;indicateur global</p>
<p>Émissions de gaz à effet de serre globales annuelles du territoire (teq CO2)</p>
', 'teq CO2', false, 'Emissions de gaz à effet de serre du tertiaire', 'cae_1.a', null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_1.e', 'cae', '1.e', null, 'Emissions de gaz à effet de serre du transport routier', '<p>Émissions de gaz à effet de serre globales annuelles du territoire exprimées en tonnes équivalent CO2 pour le secteur du transport routier.</p>
<p>Décomposition par secteur réglementaire de l&#x27;indicateur global</p>
<p>Émissions de gaz à effet de serre globales annuelles du territoire (teq CO2)</p>
', 'teq CO2', false, 'Emissions de gaz à effet de serre du transport routier', 'cae_1.a', null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_1.f', 'cae', '1.f', null, 'Emissions de gaz à effet de serre de secteurs "autres transports"', '<p>Émissions de gaz à effet de serre globales annuelles du territoire exprimées en tonnes équivalent CO2 pour le secteur des autres transport (hors routier).</p>
<p>Décomposition par secteur réglementaire de l&#x27;indicateur global</p>
<p>Émissions de gaz à effet de serre globales annuelles du territoire (teq CO2)</p>
', 'teq CO2', false, 'Emissions de gaz à effet de serre de secteurs "autres transports"', 'cae_1.a', null, null, '{}');
insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'cae_1.g', 'cae', '1.g', null, 'Emissions de gaz à effet de serre de l''agriculture', '<p>Émissions de gaz à effet de serre globales annuelles du territoire exprimées en tonnes équivalent CO2 pour le secteur de l&#x27;agriculture.</p>
<p>Décomposition par secteur réglementaire de l&#x27;indicateur global</p>
<p>Émissions de gaz à effet de serre globales annuelles du territoire (teq CO2)</p>
', 'teq CO2', false, 'Emissions de gaz à effet de serre de l''agriculture', 'cae_1.a', null, null, '{}');

insert into public.indicateur_definition (modified_at, id, groupe, identifiant, valeur_indicateur, nom, description, unite, participation_score, titre_long, parent, source, type, thematiques) values ('2023-06-20 10:12:11.742525 +00:00', 'crte_1.2', 'crte', '1.2', 'cae_1.b', 'Emissions de GES annuelles par habitant (TeqCO2 / an / hab)', '<p><strong>Définition:</strong>
Émissions de gaz à effet de serre totales sur le territoire rapportées au nombre d’habitant</p>
<p><strong>Modalités de calcul:</strong>
Pour définir les émissions de GES, se référer à l’outil Bilan GES Territoire de l’Ademe en privilégiant l’approche globale :
<a href="https://www.bilans-ges.ademe.fr/fr/accueil/contenu/index/page/Bilan%2BGES%2BTerritoires/siGras/0">
Bilan GES
</a>
ou une méthode équivalente.</p>
<p><strong>Sources:</strong>
Observatoires régionaux de l’énergie, du climat et de l’air</p>
<p><strong>Périodicité:</strong>
Annuelle</p>
<p><strong>Objectif environnemental associé:</strong>
Lutte contre le changement climatique</p>
<p><strong>Politique publique:</strong>
Limitation du changement climatique</p>
<p><strong>Objectif stratégique:</strong>
Réduire les émissions de gaz à effet de serre (GES)</p>
<p><strong>Objectif opérationnel national fixé par les documents de référence</strong>
: Stratégie Nationale Bas Carbone (SNBC) :</p>
<ul>
<li>
<p>Valeur cible à 1,1 teqCO2/hab d’ici 2050</p>
</li>
<li>
<p>40 % émissions GES globales en 2030 / -75 % en 2050 (par rapport à 1990)</p>
</li>
<li>
<p>35 % émissions GES du secteur industriel en 2030 / 80 % en 2050 (par rapport à 1990)</p>
</li>
<li>
<p>50% émissions GES du secteur agricole en 2050 (par rapport à 2015)</p>
</li>
<li>
<p>0 GES liées à la production d’énergie en 2050</p>
</li>
<li>
<p>0 GES liées au secteur du bâtiment en 2050 (100 % de bâtiments neutres)</p>
</li>
</ul>
<p><strong>Données de référence:</strong>
Préciser si possible les moyennes nationale et/ou locale, le cas échéant contextualisées (territoire urbain/rural/autre) pour permettre au territoire de mieux se situer. Voir le rapport 2020 du Haut Conseil pour le Climat (données 2017), en particulier les pages 73 et suivantes :</p>
<ul>
<li>6,9 teqCO2/hab au niveau national</li>
</ul>
', 'teq CO2/hab', false, 'Emissions de GES annuelles par habitant (TeqCO2 / an / hab)', null, null, null, '{}');



