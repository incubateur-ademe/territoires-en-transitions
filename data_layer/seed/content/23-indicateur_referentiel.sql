do $$
    begin
        insert into public.categorie_tag (collectivite_id, nom, visible, created_at, created_by)
        values (null, 'clef', true, now(), null),
               (null, 'eci', true, now(), null),
               (null, 'cae', true, now(), null),
               (null, 'pcaet', true, now(), null),
               (null, 'crte', true, now(), null),
               (null, 'resultat', false, now(), null),
               (null, 'impact', false, now(), null),
               (null, 'prioritaire', true, now(), null);

        create temporary table indicateur_def
        (
            modified_at timestamptz,
            id indicateur_id,
            identifiant text,
            valeur_indicateur indicateur_id,
            nom text,
            description text,
            unite text,
            participation_score boolean,
            selection boolean,
            titre_long text,
            parent indicateur_id,
            source text,
            type indicateur_referentiel_type,
            thematiques old_indicateur_thematique[],
            programmes indicateur_programme[],
            sans_valeur boolean
        );

        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'crte_4.1', '4.1', null, 'Surface Agricole Utile totale', '<p><strong>Définition:</strong>
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
', 'ha', false, true, 'Surface Agricole Utile totale du territoire', null, null, null, '{urbanisme_et_amenagement}',
                '{crte}', false);


        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'crte_6.1', '6.1', null, 'Linéaire d’aménagements cyclables sécurisés', '<p><strong>Définition:</strong>
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
', 'km', false, true, 'Linéaire d’aménagements cyclables sécurisés', null, null, null, '{mobilite_et_transport}',
                '{crte}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_24', '24', null,
                'Consommation d''énergies fossiles / consommation d''énergies renouvelables', '<p>MWh d''énergie fossile consommée sur le territoire/MWh d''énergie renouvelable consommée sur le territoire.</p>
<p>Cet indicateur complète l''indicateur &quot;Part des sources d''énergies renouvelables (ENR) locales (%)&quot; pour établir une vision sur la part des ENR locales dans le mix énergétique.</p>
<p>Cet indicateur est à considérer car la production d''énergie génère la consommation de ressources naturelles sur le terrioire et en-dehors du territoire de la collectivité.</p>
<p>Les observatoires climat-air-énergie peuvent fournir la donnée. Cet indicateur peut aussi être suivi dans le cadre du PCAET.</p>
', '%', false, false, 'Proportion d''énergie fossile consommé par rapport aux énergies renouvelables consommées (%)',
                null, null, null, '{energie_et_climat}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'crte_9.1', '9.1', null, 'Part des cours d’eau en bon état écologique (%)', '<p><strong>Définition:</strong>
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
', '%', false, false, 'Part des cours d’eau en bon état écologique (%)', null, null, 'impact', '{eau_assainissement}',
                '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_9', '9', null, 'Mode de transport des DMA', '<p>Mode de transport à faible impact : véhicules électriques, mobilité douce ou active, équipements utilisant la voie fluviale, la voie ferroviaire.</p>
<p>Tonnes de DMA transportés par les équipements de transport à faible impact / Tonnes de DMA transportés</p>
<p>Le rapport annuel sur les déchets peut être la source de cet indicateur.</p>
', '%', false, false, 'Part des déchets ménagers et assimilés bénéficiant d''un mode de transport à faible impact (%)',
                null, null, null, '{eci_dechets}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'crte_12.1', '12.1', null, 'Fragmentation des milieux naturels', '<p><strong>Définition:</strong>
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
', 'km²', false, true, 'Indicateur de fragmentation des milieux naturels', null, null, null,
                '{urbanisme_et_amenagement}', '{crte}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_12', '12', null,
                'Animation de filières pour la prise en charge des déchets', '<p>La collectivité définit le périmètre des filières pertinent pour le territoire. L''animation sous-entend des actions allant de soutien au dialogue jusqu''à l''accompagnement d''action pour améliorer la dynamique déchets des acteurs économiques (prévention, amélioration de tri, de collecte et de valorisation, etc.)</p>
<p>La source de cet indicateur sur le suivi interne en lien avec les services ou partenaires concernés.</p>
', 'nombre', false, false,
                'Nombre de filières animés par la collectivité ou ses partenaires pour la prise en charge des déchets (BTP, DAE…) (nombre)',
                null, null, null, '{strategie_orga_interne}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_2.j', '2.j', null, 'Consommation énergétique - déchets', '', 'GWh',
                false, false, 'Consommation énergétique des déchets', 'cae_2.a', null, null, '{}', '{cae,pcaet}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'crte_7.1', '7.1', null, 'Zones à risque naturel', '<p><strong>Définition:</strong>
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
', '%', false, true, 'Population située dans une zone à risque naturel élevé', null, null, null,
                '{nature_environnement_air}', '{crte}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_1', '1', null, 'Budget Économie Circulaire', '<p>La collectivité définit le périmètre de sa politique Economie Circulaire transversale avec d''autres politiques et stratégies.</p>
<p>La méthodologie &quot;Evaluation climat des budgets des collectivités territoriales&quot; peut être utilisée pour définir le périmetre du budget Economie Circualire.</p>
<p>Le budget Economie Circulaire peut inclure : https://www.i4ce.org/go_project/cadre-evaluation-climat-budget-collectivites/</p>
<ul>
<li>
<p>les salaires (ou part des salaires) des salariés travaillant sur l''Economie Circulaire,</p>
</li>
<li>
<p>le coût des formations sur l''Economie Circulaire,</p>
</li>
<li>
<p>les soutien financier et non-financier des acteurs du territoires et leurs projets pour l''Economie Circulaire,</p>
</li>
<li>
<p>le financement d''évènements consacrés à l''Economie Circulaire,</p>
</li>
<li>
<p>le financement des projets propres à la collectivité</p>
</li>
</ul>
<p>-etc.</p>
<p>Le budget peut inclure des instruments financiers mobilisant des financement public d''autres institutions, voire des financements privés.</p>
<p>Les collectivités utilisant la comptabilité analytique peuvent créer un compte analytique associé.</p>
', '%', false, false, 'Part du budget consacrée à la politique Economie Circulaire dans le budget global', null, '<p>Budget de la collectivité</p>
', null, '{strategie_orga_interne}', '{eci}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_28', '28', null,
                'Activité de réemploi et/ou de réutilisation dans l''activité économique', '<p>Nombre d''entreprises de réemploi et/ou de réutilisation / nombre total d''entreprises sur le territoire</p>
<p>L''indicateur peut être renseigné via l''
<a href="https://www.sinoe.org/filtres/index/thematique#table-annuaire">
Annuaire SINOE Structures du réemploi et/ou de réutilisation
</a>
ou en utilisant le SIRENE des entreprises.</p>
', '%', false, false, 'Proportion de l''activité de réemploi et/ou de réutilisation dans l''activité économique (%)',
                null, null, null, '{activites_economiques}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_15', '15', null,
                'Biens ou constructions temporaires issus du réemploi ou réutilisation ou recyclage', '<p>Données de suivi des objectifs de la loi AGEC articles 56 et 58 (décret n° 2021-254 du 9 mars 2021).</p>
<p>Objectif de 20 % d''achats reconditionnés.</p>
<p>Le service Achats ou Comptabilité peut fournir les valeurs de de cet indicateur.</p>
', '%', false, false,
                'Part de biens ou de constructions temporaires acquis annuellement par la collectivité issus du réemploi ou de la réutilisation ou intégrant des matières recyclées (%)',
                null, null, null, '{eci_dechets}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_7', '7', null, 'Réutilisation, recyclage et valorisation des DMA', '<p>Poids des DMA envoyés pour la réutilisation, le recyclage ou la valorisation / Poids des DMA produits sur le territoire.</p>
<p>Il est possible de détailler cet indicateur par voie de valorisation si un suivi plus fin est souhaité. Exemples : DMA envoyés vers les recycleries, les usines de compostage, la méthanisation, etc, via les indicateurs personnalisés.</p>
<p>Les sources utiles pour renseigner cet indicateur sont :</p>
<ul>
<li>
<p>Enquête collecte de l''ADEME (sur les zones couvertes en fonction des années).</p>
</li>
<li>
<p>Suivi interne de la collectivité.</p>
</li>
</ul>
', '%', false, false,
                'Part des déchets ménagers et assimilés envoyée pour la réutilisation, le recyclage et la valorisation organique ou énergétique (%)',
                null, null, null, '{eci_dechets}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_27', '27', null, 'Économie d''eau potable', '<p>Mesure de consommation d''eau sur le territoire de l''Année N / Mesure de consommation d''eau sur le territoire de l''Année N-X (périodicité définie par la collectivité).</p>
<p>Cet indicateur est pertinent si la collectivité choisit l''eau comme un enjeu fort pour le territoire et y associe des actions. Le choix de la périodicité permet de suivre l''impact d''une action ou d''une série d''actions.</p>
<p>Le gestionnaire du réseau d''eau portable peut fournir les données de cet indicateur.</p>
', '%', false, false, 'Part d''eau potable économisée (%)', null, null, null, '{eau_assainissement}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_13', '13', null,
                'Mise en place de boucles locales d''économie circulaire', '<p>Une boucle locale d’économie circulaire vise à conserver le plus longtemps possible dans l’économie (locale) la valeur d’un produit, de ses composants ou des matières (des ressources). Ainsi on limite la génération de déchets et  développe plusieurs échanges de produits ou matière dans le cycle de vie ou de la chaine de valeur notamment via le partage, la réparation, le réemploi, la réutilisation, la rénovation, la refabrication et le recyclage.</p>
<p>Une boucle locale d''économie circulaire respecte la hiérarchie des valorisations/traitement des déchets.</p>
<p>Elle contribue au développement d’activité économique (durable, faible en carbone et réduction de l’utilisation des ressources naturelles) et d’emplois locaux (ou de proximité).</p>
<p>L''indicateur prend en compte les boucles locales opérationnelles mises en place depuis 4 ans.</p>
', 'nombre', false, false,
                'Nombre de boucles locales d''économie circulaire mises en place dans les 4 dernières années', null, '<p>Suivi interne en lien avec les services ou partenaires concernés</p>
', null, '{eci_dechets}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_18', '18', null, 'Synergies d''EIT opérationnelles sur le territoire', '<p>Une synergie est considérée comme opérationnelle à partir d''au moins un échange matière réalisé ou d''un service de mutualisation utilisé par au moins deux entités.</p>
<p>Un suivi interne peut être réalisé. Les données du réseau SYNAPSE: https://www.economiecirculaire.org/eit/h/le-reseau-synapse.html peuvent également être utilisées.</p>
', 'nombre', false, false,
                'Nombre de synergies d''Ecologie Industrielle et Territoriale (EIT) opérationnelles sur le territoire (nombre)',
                null, null, null, '{eci_dechets}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_29', '29', null,
                'Activité de l''allongement de la durée d''usage dans l''activité économique', '<p>Nombre d''entreprises ayant un code NAF associé à la réparation (véhicules compris) / nombre total d''entreprises sur le territoire.</p>
<p>Les codes NAF/prodfre/SIREN et sources de données sont identifiés dans la liste &quot;Pilier Allongement de la durée d''usage&quot; - Méthodologie de quantification de l’emploi dans l’économie circulaire - P. 44 - 45. https://www.statistiques.developpement-durable.gouv.fr/sites/default/files/2018-10/document-travail-29-methodologie-quantification-emploi-ecocirculaire-fevrier2017.pdf</p>
<p>Les données sont disponibles via le Système national d''identification et du répertoire des entreprises et de leurs établissements (SIRENE), mais un traitement de données est nécessaire.</p>
', '%', false, true, 'Proportion de l''activité de l''allongement de la durée d''usage dans l''activité économique (%)',
                null, null, 'impact', '{activites_economiques}', '{eci}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_37', '37', null, 'Budget gestion des déchets', '<p>Voir la méthode de calcul de la matrice des coûts.</p>
<p>Méthodologie sur SINOE Déchets : https://www.sinoe.org/thematiques/consult/ss-theme/25</p>
', 'euros/habitant', false, false, 'Dépense annuelle consacrée à la gestion des déchets (€/habitant)', null, null, null,
                '{strategie_orga_interne}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_21', '21', null,
                'Gaspillage alimentaire dans la restauration collective publique', '<p>Quantité de déchets alimentaires produits par la restauration collective publique du territoire (d''après l''enquête INSEE sur les déchets non-dangereux en restauration collective) / nombre de repas servis par  la restauration collective publique du territoire. Objectif légal AGEC et Climat et Résilience.</p>
', 'g/repas servi', false, false,
                'Gaspillage alimentaire de la restauration collective sous la compétence de la collectivité (g/repas servi)',
                null, '<p>Les restaurants collectifs dont la collectivité a la charge</p>
', null, '{activites_economiques}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_11', '11', null,
                'Emissions de gaz à effet de serre - collecte des DMA', '<p>Méthode de calcul:</p>
<p>Étape 1 : Constitution d’un catalogue de facteurs d’efficacité énergétique et de facteurs d’émissions</p>
<p>Étape 2 : Établissement d’hypothèses sur les distances parcourues</p>
<p>Étape 3 : Calcul des émissions de la collecte DMA</p>
<p>Cette méthode peut s''appliquer au calcul d''un indicateur d''émission du transport de touts les déchets du territoire en y ajoutant :</p>
<p>Étape 3 : Calcul des émissions de chaque filière</p>
<p>Étape 4 : Consolidation des résultats de calcul pour l’ensemble des déchets transportés</p>
<p>Voir la méthodologie détaillée et données dans l''étude &quot;TRANSPORT ET LOGISTIQUE DES DECHETS: ENJEUX ET EVOLUTIONS DU TRANSPORT ET DE LA LOGISTIQUE DES DECHETS&quot;, 2014, ADEME</p>
<p>Pour le calcul de cet indicateur, le suivi interne du kilométrage parcouru par les véhicule de collecte, ainsi que les fiches techniques des véhicules pour les émissions, peuvent être nécessaires.</p>
', 'teq CO2/tonne de déchets', false, false,
                'Emissions GES de la collecte des déchets ménagers et assimilés sur le territoire (teq CO2/tonne de déchets)',
                null, null, null, '{energie_et_climat}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_34', '34', null,
                'Entreprises ou établissements sensibilisées ou accompagnées sur l''EFC', '<p>Pour le périmetre de l''économie de la fonctionnalité et de la coopération - Panorama national et pistes d''action pour l''économie de la fonctionnalité et de la coopération (https://librairie.ademe.fr/changement-climatique-et-energie/23-panorama-national-et-pistes-d-action-pour-l-economie-de-la-fonctionnalite.html)</p>
<p>Un suivi interne, ou par les acteurs d''animation en économie de la fonctionnalité et de coopération, est nécessaire pour compléter cet indicateur.</p>
', 'nombre d''entreprises et d''établissements', false, false,
                'Nombre d''entreprises ou établissements sensibilisées ou accompagnées sur les questions de l''économie de la fonctionnalité et de la coopération (EFC)',
                null, null, null, '{eci_dechets}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_36', '36', null,
                'Financement des projets de recherche, d''innovation ou d''expérimentation', '<p>[Total des budgets de projets Economie Circulaire soutenus par la collectivité]-[Total d''aide financière apportée aux projets Economie Circulaire par la collectivité] / [Total d''aide financière apportée aux projets Economie Circulaire par la collectivité]</p>
<p>Les conventions de financement peuvent être une source des données de cet indicateur.</p>
', 'euros', false, false,
                'Effet de levier d''accompagnement financier des projets de recherche, d''innovation et d''expérimentation en matière d''Economie Circulaire (1€ public pour X€ privé)',
                null, null, null, '{strategie_orga_interne}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_22', '22', null,
                'Réduction du gaspillage alimentaire dans la restauration collective publique', '<p>Nombre restaurants collectifs engagés dans une démarche de réduction du gaspillage alimentaire / Nombre de restaurants collectifs total. Pour affiner son action la collectivité peut choisir de distinguer le type d''établissement (écoles, EPHAD, hôpital, etc.).</p>
', 'nombre', false, false,
                'Part des restaurants collectifs sous la compétence de la collectivité engagée dans une démarche de réduction du gaspillage alimentaire (%)',
                null, '<p>Les restaurants collectifs dont la collectivité a la charge</p>
', null, '{activites_economiques}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_32', '32', null,
                'Couverture de la population par la Tarification Incitative', '<p>% de la population de la collectivité couverte par la TI</p>
', '%', false, false, 'Part de la population de la collectivité couverte par la Tarification Incitative', null, null,
                null, '{eci_dechets}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_33', '33', null, 'Actions de la collectivité en EFC', '<p>Pour le périmetre de l''économie de la fonctionnalité et de la coopération - Panorama national et pistes d''action pour l''économie de la fonctionnalité (disponible sur https://librairie.ademe.fr/changement-climatique-et-energie/23-panorama-national-et-pistes-d-action-pour-l-economie-de-la-fonctionnalite.html)</p>
<p>Les actions : actions de sensibilisation, les commandes publiques, les projets coopératifs, actions collectives.</p>
<p>Un suivi interne est nécessaire pour compléter cet indicateur.</p>
', 'nombre d''actions', false, false,
                'Nombre d''actions de la collectivité en économie de la fonctionnalité et de la coopération', null, null, null,
                '{eci_dechets}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_3', '3', null, 'Formation Économie Circulaire', '<p>Nombre de formations en Economie Circulaire / Nombre total de formations suivis par les agents *100</p>
<p>L''indicateur peut être renseigné en consultant le plan de formation de la collectivité.</p>
', '%', false, false, 'Part de formations Economie Circulaire dans le programme de formation de la collectivité (%)',
                null, null, null, '{strategie_orga_interne}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_25', '25', null,
                'Rapport entre production et consommation d''énergie renouvelable', '<p>MWh d''énergies renouvelables consommés sur le territoire / MWh d''énergies renouvelables produits sur le territoire *100</p>
<p>Cet indicateur est à considérer car la production d''énergie génère la consommation de ressources naturelles sur le terrioire et en-dehors du territoire de la collectivité.</p>
<p>Les observatoires climat-air-énergie peuvent fournir la donnée. Cet indicateur peut aussi être suivi dans le cadre du PCAET.</p>
', '%', false, false, 'Part des sources d''énergie renouvelable (ENR) locales (%)', null, null, null,
                '{energie_et_climat}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_9.b', '9.b', null,
                'Part des nouveaux logements collectifs et individuels groupés', '', '%', false, true,
                'Part des nouveaux logements collectifs et individuels groupés dans les logements autorisés dans l’année', null,
                null, null, '{urbanisme_et_amenagement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_2', '2', null,
                'Services de la collectivité formés à l''Economie Circulaire', '<p>Nombre de services avec au moins un salarié actuellement présent dans son poste ayant été formé à l''Economie Circulaire dans les 4 dernières années/ Nombre de services de la collectivité * 100.</p>
<p>Les services incluent toutes les thématiques et secteurs, y compris fonctions support.</p>
<p>L''indicateur peut être renseigné en utilisant les attestations de formations Economie Circulaire et l''organigramme de la collectivité.</p>
', '%', false, false, 'Part des services de la collectivité formés à l''Economie Circulaire (%)', null, null, null,
                '{strategie_orga_interne}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_35', '35', null,
                'Accompagnement des projets de recherche, d''innovation ou d''expérimentation', '<p>Les projets peuvent porter sur des sujets techniques, technologiques, organisationnels ou de modèles d''affires. Si la collectivité souhaite aller plus loin dans le suivi, elle peut prendre en compte l''ampleur des projets (budgets, nombre de partenaires, etc.)</p>
<p>Un suivi interne est nécessaire pour compléter cet indicateur.</p>
', 'nombre de projets', false, false,
                'Nombre de projets de recherche, d''innovation ou d''expérimentation accompagnés financièrement ou non-financièrement par la collectivité',
                null, null, null, '{strategie_orga_interne}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_17', '17', null,
                'Formation à l''écoconception des entreprises et des établissements', '<p>Nombre d''entreprises et d''établissements ayant été formées à l''écoconception / Nombre d''entreprises et d''établissements sur le territoire</p>
<p>L''une des sources est la liste des stagiaires des formations fournis par les organismes d''enseignement</p>
', '%', false, false,
                'Part d''entreprises et d''établissements ayant été formées à l''écoconception durant les 4 dernières années (%)',
                null, null, null, '{eci_dechets}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_19', '19', null, 'Entreprises engagées dans les synergie d''EIT', '<p>Une synergie est considérée comme opérationnelle à partir d''au moins un échange matière réalisé ou d''un service de mutualisation utilisé par au moins deux entités.</p>
<p>Un suivi interne peut être réalisé. Les données du réseau SYNAPSE: https://www.economiecirculaire.org/eit/h/le-reseau-synapse.html peuvent également être utilisées.</p>
', 'nombre d''entreprises', false, false,
                'Nombre d''entreprises engagées dans les synergie d''Ecologie Industrielle et Territoriale', null, null, null,
                '{eci_dechets}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_10', '10', null,
                'Emissions de gaz à effet de serre - Installations de Stockage de Déchets Non-Dangereux', '<p>Equivalent en tonnes de CO2 par an émis par l''ISDND / volume de déchets entrants en tonnes</p>
<p>Le gestionnaire des installations peut être la source de cet indicateur.</p>
', 'teq CO2/tonne de déchets entrant', false, false,
                'Emissions GES des Installations de Stockage de Déchets Non-Dangereux (teq CO2/tonne de déchets entrant)', null,
                null, null, '{energie_et_climat}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_30', '30', null,
                'Co-construction d''action Économie circulaire dans les compétences de la collectivité', '<p>% des compétences obligatoires et facultatives exercées par la collectivité (mobilité, urbanisme, etc.) pour lesquelles l’équipe Economie Circulaire a co-construit au moins une action favorisant l’Economie Circulaire dans les 4 dernières années</p>
', '%', false, false,
                'Part des compétences obligatoires et facultatives exercées par la collectivité pour lesquelles l’équipe Economie Circulaire a co-construit au moins une action favorisant l’Economie Circulaire dans les 4 dernières années',
                null, null, null, '{strategie_orga_interne}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_31', '31', null,
                'Co-conception des stratégies ou politiques de la collectivité avec prisme ECi', '', '%', false, false,
                'Part des stratégies ou des politiques dans lesquelles l’équipe Economie Circulaire a été associée pour leur conception',
                null, null, null, '{strategie_orga_interne}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_26', '26', null, 'Perte en eau du réseau (%)', '<p>Volume d''eau consommée sur le territoire/ volume d''eau dirigée vers le territoire</p>
', '%', false, true, 'Taux de fuite des réseaux d’eau du territoire', null, '<p>Gestionnaire du réseau d''eau potable</p>
', null, '{eau_assainissement}', '{eci}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_20', '20', null,
                'Alimentation sous signe de qualité dans la restauration collective publique', '<p>Produits alimentaires (T ou kg) achetés sous signe de qualité (AOP, IGP, STG, Agriculture Biologique) / Volume glogal de produits alimentaires achetés (T ou kg).</p>
<p>Signes de qualité : https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/Signe-de-qualite</p>
<p>Objectif légal Egalim.</p>
<p>Les sources possibles sont :</p>
<ul>
<li>
<p>Suivi auprès des restaurants collectifs dont la collectivité a la charge,</p>
</li>
<li>
<p>Tableaux de suivi des approvisionnements (obligation légale).</p>
</li>
</ul>
', '%', false, false,
                'Part de l’alimentation sous signe de qualité en restauration collective sous la compétence de la collectivité (%)',
                null, null, null, '{activites_economiques}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_8', '8', null, 'Mise en décharge des DMA', '<p>Poids de déchets envoyés en décharge / Poids de déchets produits sur le territoire</p>
<p>L''indicateur peut être complété grâce à l''enquête collecte de l''ADEME (sur les zones couvertes en fonction des années).</p>
', '%', false, false, 'Taux de mise en décharge des déchets ménagers et assimilés (%)', null, null, null,
                '{eci_dechets}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_21.a', '21.a', null, 'Consommation d''eau dans les bâtiments publics', '<p>L''objectif est de mesurer l''impact des mesures de limitation des consommations d''eau au fil des ans dans les bâtiments de la collectivités (hors piscine).</p>
', 'l/m²', false, false, 'Consommation moyenne d''eau dans les bâtiments de la collectivité (l/m²)', null, null,
                'impact', '{eau_assainissement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_17.a', '17.a', null,
                'Production d''électricité renouvelable - patrimoine collectivité', '<p>L''indicateur mesure la production d''électricité d''origine renouvelable (installations financées en totalité ou en majorité par la collectivité et de sa compétence : éolien, photovoltaïque, hydraulique, marémotrice, géothermie haute température, électricité issue de l''incinération des déchets à hauteur de 50%, cogénération biomasse/biogaz...).</p>
', 'MWh', false, true, 'Production d''électricité renouvelable - patrimoine collectivité', null, null, null,
                '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_17.b', '17.b', null,
                'Taux de production d''électricité renouvelable - patrimoine collectivité', '<p>L''indicateur mesure le rapport de la production d''électricité d''origine renouvelable (installations financées en totalité ou en majorité par la collectivité et de sa compétence : éolien, photovoltaïque, hydraulique, marémotrice, géothermie haute température, électricité issue de l''incinération des déchets à hauteur de 50%, cogénération biomasse/biogaz...) sur la consommation totale d''électricité des bâtiments et équipements communaux (y compris l''éclairage public et les services industriels de la compétence de la collectivité) en énergie finale. Le patrimoine en DSP est inclus si possible.</p>
', '%', true, true, 'Taux de production d''électricité renouvelable - patrimoine collectivité', null, null, null,
                '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_56', '56', null, 'Dossiers « Habiter mieux » déposés à l’Anah', '<p>L’indicateur mesure le nombre de dossier déposés chaque année auprès de l’ANAH dans le cadre du programme Habiter mieux. Ce programme vise les propriétaires occupants (sous conditions de ressources) et les propriétaires bailleurs.</p>
', 'Nombre de dossiers', false, false, 'Nombre de dossiers « Habiter mieux » déposés à l’Anah sur le territoire', null,
                null, null, '{solidarite_lien_social}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_7', '7', null, 'Recyclage des déchets', '<p>Il s’agit de la part (en poids) des déchets ménagers et assimilés (DMA) orientés vers le recyclage matière et organique. Le recyclage consiste en toute opération de valorisation par laquelle les déchets, y compris organiques, sont retraités en substances, matières ou produits pour resservir à leur fonction initiale ou à d’autres fins (définition du code de l’environnement). La valorisation énergétique n''est pas prise en compte ici.</p>
<p>NB : On mesure les déchets « orientés vers le recyclage », les refus de tri ne sont donc pas déduits. Ne sont pas considérés ici comme « orientés vers le recyclage » les déchets entrant dans des installations de tri mécanobiologique. Pour ces derniers, seuls les flux sortant orientés vers la valorisation organique (compostage ou méthanisation) ou vers le recyclage matière (métaux récupérés) sont à intégrer dans les flux « orientés vers le recyclage ». Les mâchefers valorisés ainsi que les métaux récupérés sur mâchefers ne sont pas intégrés.</p>
', '%', true, true,
                'Part des déchets ménagers et assimilés orientés vers le recyclage matière et organique à par an (%)', null,
                null, 'impact', '{eci_dechets}', '{cae,clef}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_52', '52', null,
                'Part du budget coopération décentralisée climat, air, énergie', '<p>L''indicateur mesure le montant des subventions ou investissements consentis pour les projets de coopération décentralisée, en lien avec le climat, l’air et l’énergie, rapporté au budget total (investissement et fonctionnement) de la collectivité. Pour information, l''aide publique au développement en France est estimée à 0,38% du RNB en 2017, toutes thématiques confondues (santé, éducation, alimentaire, eau, climat...). Lors du sommet du millénaire de 2000, l''objectif fixé par la commission européenne était d''atteindre 0,7 % du RNB en 2015.</p>
', '%', true, false,
                'Part du budget consacré à des projets de coopération décentralisée en lien avec le climat, l’air ou l’énergie',
                null, null, null, '{strategie_orga_interne}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_54', '54', null, 'Manifestations et actions sur climat, air, énergie', '<p>Il s''agit du nombre de manifestions/actions de communication menées sur le thème de l''énergie et du climat. L''évaluation est différenciée selon la taille de la collectivité. Cet indicateur fait partie d''un ensemble (indicateurs qualitatifs et quantitatifs).</p>
<p>Valeur limite : 2 (&lt; 3 000 hab) ; 5 (&gt; 3 000 hab) ; 10 (&gt; 50 000 hab)</p>
<p>Les actions importantes peuvent être comptées comme équivalentes à deux actions.</p>
', 'Nombre', true, true, 'Nombre de manifestations/actions sur le climat, l''air et l''énergie par an', null, null,
                null, '{strategie_orga_interne}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_31', '31', null, 'Consommation d''eau des espaces verts', '<p>L''objectif est de mesurer les efforts de la collectivité en matière de limitation des consommations d''eau pour l''arrosage de ses espaces verts. Le volume annuel d''eau est divisé par la surface d''espaces verts gérés par la collectivité. L''unité de l''indicateur est en m³ /m². Les espaces verts sont entendus au sens large, à savoir : parcs et jardins, espaces sportifs végétalisés, ronds-points ou accotement enherbées de la compétence de la collectivité.</p>
', 'm³/m²', false, false, 'Consommation annuelle d''eau pour l''arrosage des espaces verts', null, null, null,
                '{urbanisme_et_amenagement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_30', '30', null, 'Consommation d''engrais des espaces verts', '<p>L''objectif est de mesurer les efforts de la collectivité en matière de limitation des engrais sur ses espaces verts. La quantité annuelle d''engrais apportée est divisée par la surface d''espaces verts gérés par la collectivité.</p>
<p>La collectivité peut suivre un autre indicateur en fonction des produits employés et du calcul de la collectivité : unité d''azote/m2,litre/m2, euros/m2... (à créer dans les indicateurs personnalisés et à relier à cet indicateur)</p>
', 'kg/m2', false, false, 'Consommation annuelle d''engrais pour les espaces verts', null, null, null,
                '{urbanisme_et_amenagement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_2.a', '2.a', null, 'Consommation énergétique territoriale', '<p>Cet indicateur estime la consommation énergétique finale annuelle du territoire, selon les exigences réglementaires des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial).</p>
<p>L''indicateur est exprimé en GWh.</p>
', 'GWh', false, true, 'Consommation énergétique finale du territoire (GWh)', null, null, null, '{energie_et_climat}',
                '{cae,pcaet,clef}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_45', '45', null, 'Stationnement vélo', '<p>L''indicateur mesure le nombre de places de stationnement vélo pour 100 habitants : arceaux sur l’espace public, consignes ou boxes à vélos, stationnements vélos en gare, en parking automobiles... Attention, les stationnements de type râtelier vélo ou « pince-roues » sur l’espace public, qui ne permettent pas une accroche sécuritaire, ne sont pas pris en compte.</p>
<ul>
<li>
<p>Valeurs limites : 2 (commune) et 1 (EPCI)</p>
</li>
<li>
<p>Valeurs cibles : 4 (communes) et 2 (EPCI)</p>
</li>
</ul>
<p>Pour les collectivités rurales, se focaliser sur la présence d’abris et de stationnements proposés aux endroits clés (centres bourgs, autour des écoles et pôles d’activités, lieux publics de rencontre, commerces, etc).</p>
', 'nombre de places', true, true, 'Nombre de places de stationnement vélo, hors pince-roues pour 100 habitants', null,
                null, null, '{mobilite_et_transport}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_61', '61', null,
                'Consommation de viande dans la restauration collective publique', '<p>L’indicateur mesure le ratio moyen de viande par repas : la quantité totale annuelle de viande achetée dans la restauration collectivité publique (maîtrisée par la collectivité) est divisée par le nombre de repas servi sur l’année.</p>
', 'g/repas', false, false, 'Quantité moyenne de viande par repas dans la restauration collective publique', null, null,
                null, '{activites_economiques}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_58', '58', null,
                'Emissions de polluants atmosphériques du secteur agricole', '<p>Indicateur exigé dans la règlementation PCAET (diagnostic). Arrêté du 4 août 2016 relatif au plan climat-air-énergie territorial. Ramené à l’hectare pour comparaison.</p>
<p>Le NH3 est suivi en priorité. Pour les quelques territoires où le NH3 ne serait pas le polluant majoritaire du secteur agricole, et où le suivi d''un autre polluant serait plus pertinent pour la collectivité, l''indiquer en commentaire.</p>
', 'tonne/ha', false, false, 'Emissions directes de polluants atmosphériques du secteur agriculture par ha', null, null,
                null, '{nature_environnement_air}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_63.a', '63.a', null, 'Séquestration de CO2 dans les sols et la forêt', '<p>L''indicateur suit une estimation de la séquestration nette de dioxyde de carbone, identifiant au moins les sols agricoles et la forêt, en tenant compte des changements d’affectation des terres (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial).</p>
', 'teq CO2', false, true, 'Séquestration nette de dioxyde de carbone dans les sols et la forêt', null, null, null,
                '{urbanisme_et_amenagement}', '{cae,pcaet,clef}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_9.a', '9.a', null,
                'Part des surfaces construites ou réhabilitées sur des sites en reconversion', '', '%', false, true,
                'Part des nouvelles surfaces construites ou réhabilitées sur des sites en reconversion par rapport aux nouvelles surfaces construites en extension',
                null, null, null, '{urbanisme_et_amenagement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_9.c', '9.c', null, 'Part du foncier en friche', '', '%', false, true,
                'Part du foncier en friche', null, null, null, '{urbanisme_et_amenagement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_20', '20', null, 'Consommation de l’éclairage public', '<p>L’indicateur est en énergie finale et inclut les consommations pour la signalisation et l’éclairage du mobilier urbain (ex : abri-bus).</p>
<p>Pour les EPCI, l’indicateur n’est renseigné que si la compétence a été transférée totalement (pas uniquement sur les zones communautaires).</p>
<ul>
<li>
<p>Valeur limite : 90 kWh/hab (énergie finale, d''après données enquête ADEME-AITF-EDF-GDF « Energie et patrimoine communal 2012 », pour les villes moyennes)</p>
</li>
<li>
<p>Valeur cible : 60 kWh/hab (énergie finale, d''après les meilleures scores obtenues par des collectivités Territoire Engagé Climat-Air-Energie)</p>
</li>
</ul>
', 'kWh/hab.an', true, true, 'Consommation énergétique de l’éclairage public par habitant', null, null, null,
                '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_27', '27', null,
                'Mix énergétique des régies et SEM fournisseur d''électricité', '<p>Les SEM et régies peuvent, en plus de leur propre production d’énergies renouvelables, acheter de l''électricité renouvelable ou verte (labellisée) pour compléter leur offre. Les objectifs fixés (production et achat) sont basés sur les objectifs 2030 de la loi de transition énergétique.</p>
<p>Valeur cible : 40% (Métropole) / 100% (DOM)</p>
', '%', true, false, 'Mix énergétique proposé par les régies et SEM fournisseur d''électricité (%)', null, null, null,
                '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_34', '34', null,
                'Valorisation énergétique du biogaz des centres de stockage des déchets', '<p>L''indicateur mesure la part de biogaz valorisé par le centre de stockage des déchets.</p>
<ul>
<li>
<p>Valeur limite: 75% (fixée par le seuil de valorisation permettant la modulation de la TGAP)</p>
</li>
<li>
<p>Valeur cible : 100%</p>
</li>
</ul>
', '%', true, false, 'Taux de valorisation énergétique du biogaz des centres de stockage des déchets', null, null, null,
                '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_40', '40', null, 'Consommation annuelle d''énergie des véhicules', '<p>L''indicateur mesure la consommation d''énergie en kWh (gazole, essence, GPL, GNV, électricité, biogaz, agro-carburants...) des véhicules de type &quot;véhicule particulier&quot; pour le fonctionnement de la collectivité.</p>
<p>Facteurs de conversion simplifiés : gazole et essence 10 kWh/L, GPL 7 kWh/L, GNV 11 kWh/m3.</p>
<p>L''indicateur est ensuite divisé par le nombre d''agents et/ou par kilomètre effectué pour faciliter les comparaisons avec d''autres collectivités.</p>
', 'kWh/an', false, false,
                'Consommation annuelle d''énergie des véhicules de type "véhicule particulier" pour le fonctionnement de la collectivité',
                null, null, null, '{mobilite_et_transport}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_38', '38', null, 'Part modale des déplacements intermodaux', '<p>Cet indicateur peut remplacer l''indicateur sur les parts modales des transports en commun, si ce dernier n''est pas adapté à sa situation (milieu rural notamment).</p>
<p>Il peut également s’agir de la part de déplacements intermodaux réalisés par les habitants du territoire, c’est-à-dire la part de déplacements mécanisés (tout mode hors marche-a-pied)  composés d''au moins deux trajets effectués à l’aide de plusieurs modes mécanisés. Pour obtenir la totalité des points, la valeur collectée doit témoigner d''une bonne performance de la collectivité par rapport à des valeurs de références nationales ou locales.</p>
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
<p>Si cet indicateur n''est pas non plus le plus pertinent, alors la collectivité peut mesurer par un autre indicateur la progression d''un moyen de transport alternatif à la voiture individuelle, mieux adapté à sa situation : co-voiturage, transport à la demande..., en créant un indicateur personnalisé et en le liant à cet indicateur.</p>
', '%', true, false, 'Part modale des déplacements intermodaux', null, null, null, '{mobilite_et_transport}', '{cae}',
                false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_8', '8', null, 'Rénovation énergétique des logements', '<p>L''indicateur mesure le nombre annuel de logements rénovés via les dispositifs de subventionnement et d’accompagnement dont la collectivité est partenaire, ramené au nombre de logements du territoire (pour 100 logements).</p>
<p>Pour rappel l’objectif national du plan de rénovation énergétique de l’habitat est de 500 000 logements rénovés par an, soit 1,4 logements rénovés pour 100 logements existants (36,1 millions de logements en 2020 selon l’INSEE).</p>
', 'nombre logements rénovés/100 logements existants', false, false,
                'Nombre de logements rénovés énergétiquement (nombre logements rénovés/100 logements existants)', null, null,
                null, '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_59', '59', null, 'Surface agricole utile en agriculture biologique', '<p>L''indicateur mesure le pourcentage % de SAU en agriculture biologique (certifié ou en conversion) par rapport à la SAU totale. L''agriculture à haute valeur environnementale de niveau 3 (HVE) ou raisonnée (ou niveau 2 de certification environnementale selon les décrets et arrêtés du 20 et 21 juin 2011) ne sont pas prises en compte.</p>
<p>Pour la France métropole, la valeur limite est basée sur la valeur moyenne française des surfaces labellisées AB en 2016 (5,7% - Agence bio) et la valeur cible est basée sur l’objectif 2020 fixé dans la loi Grenelle I (20%).</p>
', '%', true, true, 'Part de surface agricole certifiée agriculture biologique', null, null, null,
                '{urbanisme_et_amenagement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_51', '51', null, 'Achats publics avec considération environnementale', '<p>Part des marchés (en nombre) intégrant des clauses environnementales dans les spécifications techniques ou les critères d’attribution en augmentation</p>
', '%', false, true, 'Part de contrats d''achats publics comportant au moins une considération environnementale', null,
                null, null, '{strategie_orga_interne}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_29', '29', null, 'Consommation énergétique des stations d''épuration', '<p>L''indicateur de consommation énergétique des STEP (station d''épuration) s''exprime en kWh/kg de DBO5 (demande biologique en oxygène mesuré à 5 jours) éliminés, plus fiables que les indicateurs en kWh/m3 d''eau traité. La composition des eaux entrantes influe en effet sur les consommations énergétiques de la station sans pour autant refléter ses performances. L''énergie est mesurée en énergie finale. Dans le cas d''une moyenne entre plusieurs STEP, pondérer selon les équivalents habitants.</p>
<ul>
<li>
<p>Valeur limite :  BA 4,  SBR 5, BRM  7</p>
</li>
<li>
<p>Valeur cible : BA 2, SBR 3, BRM 4</p>
</li>
</ul>
<p>avec BA - boues activées / SBR - réacteur biologique séquencé / BM - bioréacteur à membranes</p>
', 'kWh/kgDBO5 éliminé', true, false, 'Consommation énergétique des stations d''épuration par an', null, null, 'impact',
                '{eau_assainissement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_2.k', '2.k', null,
                'Consommation énergétique - industrie hors branche énergie', '', 'GWh', false, false,
                'Consommation énergétique de l''industrie hors branche énergie', 'cae_2.a', null, null, '{}', '{cae,pcaet}',
                false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_63.b', '63.b', null, 'Séquestration de la forêt', '', 'teq CO2',
                false, false, 'Séquestration de la forêt', 'cae_63.a', null, null, '{}', '{cae,pcaet}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_47', '47', null,
                'Maillage du territoire par les transports en commun', '<p>L''indicateur a pour objectif de mesurer le maillage du territoire par les transports en commun. L''indicateur est basé sur une moyenne tous modes de TC confondus.</p>
<p>D''autres indicateurs peuvent être utilisés pour suivre le maillage du territoire les transports en commun: nb arrêts/hab, km de réseau/hab ou par ha de territoire, % de population desservie dans un rayon de 300-500 mètres... Il est possible de créer ces autres indicateurs dans les indicateurs personnalisés et de les lier à cet indicateur pour en faciliter le suivi.</p>
', 'Nombre d''arrêts/km', false, false, 'Nombre moyen d''arrêts par km du réseau de transport en commun', null, null,
                null, '{mobilite_et_transport}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_53', '53', null, 'Part du budget coopération climat, air, énergie', '<p>L''indicateur mesure le montant des dépenses engagées pour les projets de coopération significatifs et multi-acteurs par an sur le climat, l’air et l’énergie (hors coopération décentralisée), rapporté au budget total (investissement et fonctionnement) de la collectivité.</p>
', '%', false, false,
                'Part du budget dédié aux projets de coopération significatifs et multi-acteurs sur le climat, l’air et l’énergie',
                null, null, null, '{strategie_orga_interne}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_43', '43', null, 'Part de voiries « apaisées »', '<p>L’indicateur mesure la part des voiries où un dispositif règlementaire permet l’apaisement de la circulation (réduction des vitesses en dessous de 50 km/heures ou limitation de la circulation) par rapport au linéaire total de voirie de la collectivité. Les dispositifs pris en compte sont les zones de rencontre, les zones 30, les aires piétonnes, les zones de circulation restreinte.</p>
', '%', false, false, 'Part de voiries « apaisées » (%)', null, null, null, '{mobilite_et_transport}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_26', '26', null, 'Puissance photovoltaïque installée', '<p>L''installation de panneaux solaires photovoltaïques est possible dans toutes les collectivités. Un indicateur en puissance installée plutôt qu''en production permet de ne pas prendre en compte les différences d''ensoleillement des territoires. Les valeurs cibles sont établies à partir des données collectées dans le cadre des démarches Territoire Engagé Climat-Air-Energie.</p>
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
', 'Wc/hab', true, true, 'Puissance photovoltaïque installée sur le territoire (Wc/hab)', null, null, null,
                '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_28.a', '28.a', null,
                'Consommation énergétique du système d''alimentation en eau potable', '<p>Le système d''alimentation en eau potable (captage/traitement/distribution) est très dépendant de l''état de la ressource en eau sur le territoire. L''évaluation des effets se fait donc de manière relative, sur plusieurs années, en étant vigilant sur les conditions climatiques de l''année étudiée. L''indicateur peut être en kWh/hab.</p>
', 'kWh/hab', false, false,
                'Consommation énergétique du système d''alimentation en eau potable (captage/traitement/distribution)', null,
                null, null, '{eau_assainissement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_24.b', '24.b', null,
                'Taux de production d''énergie renouvelable chaleur/froid', '<p>Cet indicateur mesure la production de chaleur et de rafraichissement  renouvelable sur le territoire (initiative publique et privée), divisée par les consommations totales de chaleur et de froid du territoire (en énergie finale). Les énergies renouvelables prise en compte sont celles citées selon les filières citées dans le Décret n° 2016-849 du 28 juin 2016  relatif au plan climat-air-énergie territorial :  biomasse  solide,  pompes  à  chaleur,  géothermie,  solaire  thermique,  biogaz.</p>
<p>Par convention, 50% de la chaleur produite par l’incinération des déchets est considérée issue de déchets urbains renouvelables (source DGEC, dans ses bilans). Les pompes à chaleur prise en compte sont les pompes à chaleur eau/eau, sol/eau, sol/sol  avec une efficacité énergétique ≥ 126 % (PAC basse température) et une efficacité énergétique ≥ 111 % (PAC moyenne ou haute température) (exigences du crédit d’impôt pour la transition énergétique 2018).</p>
<p>La cogénération à partir d''énergie fossile n''est pas prise en compte.</p>
<p>Pour connaître cet indicateur, la collectivité doit avoir effectué un bilan de ses consommations et production d''ENR tel que décrit à l''action 1.1.2 - Réaliser le diagnostic Climat-Air-Energie du territoire</p>
<p>Valeur cible : 38% en Métropole, 75% dans les DOM</p>
', 'en %', true, true,
                'Taux de production d''énergie renouvelable pour la chaleur et le rafraîchissement sur le territoire', null,
                null, null, '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_41', '41', null,
                'Part modale des déplacements alternatifs à la voiture individuelle des agents de la collectivité', '<p>Via une enquête réalisée auprès des agents, l’indicateur mesure la part modale (en nombre de déplacements) cumulée des déplacements alternatifs à la voiture individuelle (somme des parts modales marche, vélo, transport en commun, co-voiturage) dans les déplacements domicile-travail des agents. L’indicateur est décliné si possible également en kilomètres parcourus.</p>
', '%', false, false,
                'Part modale des déplacements alternatifs à la voiture individuelle pour les déplacements domicile-travail des agents de la collectivité',
                null, null, null, '{mobilite_et_transport}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_23', '23', null,
                'Couverture des besoins de chaleur du territoire par les réseaux de chaleur ENR&R', '<p>Cet indicateur est le ratio entre la consommation d''énergie pour le chauffage assurée par le(s) réseau(x) de chaleur alimenté(s) en énergie renouvelable et de récupération (ENR&amp;R) et la consommation totale d''énergie pour le chauffage du territoire (pour le résidentiel et le tertiaire, donc hors industrie).</p>
<p>Les réseaux de chaleur 100% fossiles ne sont pas donc pris en compte ici.</p>
<p>La valeur limite (10%) est basée sur le taux moyen de couverture des besoins de chaleur par les réseaux de chaleur en Europe (source : AMORCE).</p>
', '%', true, true,
                'Taux de couverture des besoins de chaleur du territoire (résidentiel et tertiaire) par les réseaux de chaleur ENR&R',
                null, null, null, '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_48', '48', null, 'Ressources humaines dédiées climat-air-énergie', '<p>L’indicateur mesure le nombre de personnes en équivalent temps plein dédiées à la mise en œuvre de la politique climat-air-énergie. Pour être comptabilisé à 100%, l’intitulé du poste doit clairement se référer à cette politique (e : chargé de mission énergie, plan climat, mobilité douce…) ; pour des postes mixtes (ex : chargé de mission bâtiments), le poste ne doit pas être compté entièrement dans l’indicateur, mais uniquement l’estimation du % des tâches en lien avec la politique climat-air-énergie. Le personnel externe (prestataires) ne doit pas être pris en compte. Pour faciliter la comparaison, le nombre d’ETP est ramené au nombre total d''ETP de la collectivité.</p>
', '%', false, false, 'Part d''ETP de la collectivité dédié à la mise en œuvre de la politique climat, air et énergie',
                null, null, null, '{strategie_orga_interne}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_63.c', '63.c', null,
                'Séquestration dans les terres agricoles et les prairies', '', 'teq CO2', false, false,
                'Séquestration dans les terres agricoles et les prairies', 'cae_63.a', null, null, '{}', '{cae,pcaet}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_49.a', '49.a', null, 'Budget climat-air-énergie', '<p>L''indicateur suit et totalise les budgets annuels associés aux actions les plus clairement identifiables de la politique climat-air-énergie de la collectivité, en fonctionnement et en investissement. L''indicateur doit exister et être suivi annuellement pour être valorisé. Pour faciliter la comparaison au fil du temps et entre collectivités, le budget est rapporté au nombre d''habitant et la décomposition suivante peut être utilisée :</p>
<ul>
<li>
<p>études/expertises concernant la maîtrise de l’énergie et la baisse des émissions de GES dans les différents secteurs consommateurs et émetteurs, les énergies renouvelables, l''adaptation au changement climatique, la qualité de l''air</p>
</li>
<li>
<p>politique cyclable (études, infrastructures et services)</p>
</li>
<li>
<p>actions communication/sensibilisation climat-air-énergie</p>
</li>
<li>
<p>subventions octroyées par la collectivité aux particuliers et autres acteurs privés dans le domaine énergétique et climatique. La part financée par la collectivité dans des subventions partenariales est prise en compte.</p>
</li>
<li>
<p>projets de coopération climat-air-énergie</p>
</li>
<li>
<p>travaux de rénovation énergétique du patrimoine public</p>
</li>
<li>
<p>installations d''énergie renouvelable</p>
</li>
</ul>
<p>A noter : Dans une approche véritablement transversale et intégrée, l''ensemble des budgets des différents services contribuent à la politique climat-air-énergie, mais dans une proportion difficilement quantifiable. Les budgets associés aux services déchets/eau/assainissement/transports publics/voirie, sont notamment associés à cette politique, mais répondent à des objectifs plus larges.</p>
', 'euros', false, false, 'Budget associé à la politique climat-air-énergie', null, null, null,
                '{strategie_orga_interne}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_57', '57', null, 'Hébergements labellisés Ecolabel européen', '<p>Nombre d''hébergements labellisés Ecolabel Européen / Total d''hébergements touristiques sur le territoire</p>
<p>Il est possible de suivre le nombre d’hébergements labellisés Ecolabel Européen dans un indicateur personnalisé.</p>
', '%', false, false, 'Taux d’hébergements labellisés Ecolabel européen', null, null, null, '{activites_economiques}',
                '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_25.b', '25.b', null, 'Taux de production d''électricité renouvelable', '<p>Cet indicateur mesure la production d''électricité renouvelable sur le territoire, par la collectivité, ses partenaires et les particuliers, rapporté à la consommation totale d''électricité du territoire (énergie finale). Les énergies renouvelables considérées sont celles citées dans le décret Décret n° 2016-849 du 28 juin 2016  relatif au plan climat-air-énergie territorial  (éolien  terrestre,  solaire  photovoltaïque,  solaire  thermodynamique,  hydraulique,  biomasse  solide, biogaz,  géothermie). L''électricité produite par cogénération via incinération des déchets en mélange compte pour 50% comme une énergie renouvelable (biomasse solide). La cogénération à partir d''énergie fossile n''est pas prise en compte.</p>
<p>La collectivité doit avoir effectué un bilan de ses consommations et productions d''ENR tel que décrit à l''action 1.1.2 - Réaliser le diagnostic Climat-Air-Energie du territoire</p>
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
', '%', true, true, 'Taux de production d''électricité renouvelable sur le territoire', null, null, null,
                '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_28.b', '28.b', null,
                'Rendement du système d''alimentation en eau potable', '<p>Le système d''alimentation en eau potable est très dépendant de l''état de la ressource en eau sur le territoire. L''évaluation des effets se fait donc de manière relative, sur plusieurs années, en étant vigilant sur les conditions climatiques de l''année étudiée. L''indicateur est en m3 brut/m3 vendu pour mesurer les pertes (la cible étant dans ce cas de se rapprocher de 1).</p>
', 'm3 brut/m3 vendu', true, true,
                'Rendement du système d''alimentation en eau potable (captage/traitement/distribution)', null, null, null,
                '{eau_assainissement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_3.a', '3.a', null, 'Production d’énergie renouvelable du territoire', '<p>Cet indicateur mesure la production d’énergie renouvelable totale sur le territoire, selon les exigences réglementaires des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial), c''est à dire incluant les filières de production:</p>
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
', 'MWh', false, true, 'Quantité totale d''énergies renouvelables et de récupération produites par an (MWh)', null,
                null, null, '{energie_et_climat}', '{clef,cae,pcaet}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_3.b', '3.b', null,
                'Production d’énergie renouvelable / consommation énergétique', '<p>Cet indicateur mesure la production d’énergie renouvelable totale sur le territoire ramené à la consommation énergétique globale du territoire.</p>
', '%', false, false,
                'Production d’énergie renouvelable globale du territoire par rapport à la consommation énergétique globale',
                null, null, null, '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_16.a', '16.a', null,
                'Consommation de chaleur/froid ENR&R - patrimoine collectivité', '<p>Pour les bâtiments et équipements publics, l''indicateur mesure  la consommation de chaleur/rafraichissement issue d’energie renouvelable et de récupération. Le patrimoine en DSP est inclus si possible ainsi que les services publics eau/assainissement/déchets lorsqu''ils sont de la compétence de la collectivité.</p>
<p>Pour les collectivités compétentes, la récupération de chaleur des UIOM ainsi que sur les eaux usées/épurées peut ainsi être prise en compte pour la part autoconsommée sur place (bâtiments de la collectivité et process). Les pompes à chaleur prise en compte sont les pompes à chaleur eau/eau, sol/eau, sol/sol avec une efficacité énergétique ≥ 126 % (PAC basse température) et une efficacité énergétique ≥ 111 % (PAC moyenne ou haute température).</p>
<p>Pour les bâtiments publics desservis par des réseaux de chaleur, le taux d’EnR&amp;R du réseau est défini réglementairement et s’apprécie au regard du bulletin officiel des impôts vis-a-vis de la TVA réduite (BOI-TVA-LIQ-30 chapitre 2.140). La co-génération fossile n’est pas prise en compte.</p>
', 'MWh', false, true,
                'Consommation de chaleur/rafraichissement renouvelable et de récupération - patrimoine collectivité', null,
                null, null, '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_21.b', '21.b', null,
                'Consommation d''eau - bâtiments d''enseignement et crèches', '', 'l/m²', true, false,
                'Consommation moyenne d''eau dans les bâtiments "enseignement/crèche" de la collectivité (l/m²)', 'cae_21.a',
                null, 'impact', '{eau_assainissement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_21.c', '21.c', null, 'Consommation d''eau - bâtiments administratifs',
                '', 'l/m²', true, false,
                'Consommation moyenne d''eau dans les bâtiments "administration" de la collectivité (l/m²)', 'cae_21.a', null,
                'impact', '{eau_assainissement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_21.d', '21.d', null,
                'Consommation d''eau - bâtiments culturels et sportifs', '', 'l/m²', true, false,
                'Consommation moyenne d''eau dans les bâtiments "culture/sport" de la collectivité (l/m²)', 'cae_21.a', null,
                'impact', '{eau_assainissement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_16.b', '16.b', null,
                'Couverture des besoins en chaleur et froid par les ENR&R - patrimoine collectivité', '<p>Pour les bâtiments et équipements publics, l''indicateur mesure le rapport de la consommation de chaleur/rafraichissement issue d’energie renouvelable et de récupération sur la consommation totale d''énergie pour les usages thermiques (chauffage, eau chaude sanitaire, climatisation-rafraichissement) en énergie finale. Le patrimoine en DSP est inclus si possible. Les consommations thermiques des services publics eau/assainissement/déchets sont prises en compte lorsqu''ils sont de la compétence de la collectivité. Pour les collectivités compétentes, la récupération de chaleur des UIOM ainsi que sur les eaux usées/épurées peut ainsi être prise en compte pour la part autoconsommée sur place (bâtiments de la collectivité et process).</p>
<p>Les pompes à chaleur prise en compte sont les pompes à chaleur eau/eau, sol/eau, sol/sol  avec une efficacité énergétique ≥ 126 % (PAC basse température) et une efficacité énergétique ≥ 111 % (PAC moyenne ou haute température).</p>
<p>Pour les bâtiments publics desservis par des réseaux de chaleur, le taux d’EnR&amp;R du réseau est défini réglementairement et s’apprécie au regard du bulletin officiel des impôts vis-a-vis de la TVA réduite (BOI-TVA-LIQ-30 chapitre 2.140). La co-génération fossile n’est pas prise en compte.</p>
', '%', true, true,
                'Taux de couverture des besoins en chaleur et rafraichissement par les énergies renouvelables et de récupération (ENR&R) - patrimoine collectivité',
                null, null, null, '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_13.a', '13.a', null, 'Budget énergie', '<p>L''indicateur mesure les dépenses d’énergie payées directement par la collectivité, c’est-à-dire celles payées par la collectivité aux fournisseurs et aux exploitants (uniquement le poste combustibles P1 dans ce dernier cas) pour le patrimoine bâti, l’éclairage public et les carburants des véhicules.</p>
<p>Rapportées au nombre d''habitants, pour les communes, les valeurs peuvent-être comparées avec des valeurs de références tirées de l''enquête ADEME, 2019 &quot;Dépenses énergétiques des collectivités locales&quot;.</p>
', 'euros', false, false, 'Dépenses énergétiques de la collectivité (euros)', null, null, null,
                '{strategie_orga_interne}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_44', '44', null, 'Pistes cyclables', '<p>L''indicateur mesure le kilométrage de voiries aménagées (pistes le long de la voirie, bandes cyclables et couloirs bus autorisés aux vélos, les zones 30, les aires piétonnes…) sur le kilométrage total de voirie. Les aménagements à double-sens compte pour 1, les sens unique pour 0,5 ; les aménagements hors voirie ne sont pas pris en compte (voies vertes, pistes ne suivant pas le tracé de la voirie, allées de parcs, ...). Les valeurs de références sont basées sur un traitement des données du Club des villes et territoires cyclables, dans le cadre de l’Observatoire des mobilités actives, enquête 2015-2016.</p>
<ul>
<li>
<p>Valeurs limites :  25% ou 1 km/1000 hab (ville) et 20% ou 0,8 km/1000 hab (EPCI)</p>
</li>
<li>
<p>Valeurs cibles (objectifs) :  50% ou 2 km/1000 hab (ville) et 40% ou 1,5 km/1000 hab (EPCI)</p>
</li>
</ul>
<p>Un indicateur en km/1000 habitants peut être utilisé : il est à construire dans les indicateurs personnalisés.</p>
', '%', true, true, 'Part de voiries aménagées pour les cycles', null, null, null, '{mobilite_et_transport}', '{cae}',
                false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_10', '10', null, 'Surfaces agricoles et naturelles', '<p>Il s''agit de la mesure de la consommation ou de la réintroduction d''espaces naturels et agricoles au fil des ans grâce au suivi des surfaces réservées à ces usages dans les PLU, mesuré en pourcentage de la surface totale de la collectivité (ha cumulé des zones N et A/ha total). Ces surfaces sont non imperméabilisées, capteuses de CO2, productrices de ressources alimentaires, énergétiques et de biodiversité.</p>
', '%', false, false, 'Part des surfaces agricoles et naturelles (%)', null, null, null, '{urbanisme_et_amenagement}',
                '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_18', '18', null, 'Achat d’électricité renouvelable', '<p>L''indicateur mesure le rapport entre les achats d''électricité renouvelable et le montant total des achats d''électricité de la collectivité pour les bâtiments et équipements de la collectivité (y compris services publics eaux, assainissement, déchets et éclairage public s’ils sont de la compétence de la collectivité) (en kWh ou MWh). La cible est de 100%</p>
', '%', true, true, 'Part des achats d’électricité renouvelable de la collectivité', null, null, null,
                '{strategie_orga_interne}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_14.a', '14.a', null, 'Consommation énergétique des bâtiments publics', '<p>L''indicateur mesure la consommation énergétique totale (toute énergie, tout usage) du patrimoine bâti à la charge directe de la commune, en énergie finale. Les piscines et patinoires, si elles sont à la charge de la collectivité sont prises en compte, mais pas les services publics eau, assainissement, déchets, ni l''éclairage public.</p>
', 'MWh', false, true, 'Consommation d''énergie finale des bâtiments publics (MWh)', null, null, null,
                '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_6.a', '6.a', null, 'Production de déchets', '<p>Les déchets ménagers et assimilés comprennent les ordures ménagères résiduelles, les collectes sélectives et les déchets collectés en déchèteries (y compris déchets et gravats), soit la totalité des déchets des ménages et des non-ménagés pris en charge par le service public.</p>
<p>Les déchets produits par les services municipaux (déchets de l’assainissement collectif, déchets de nettoyage des rues, de marché, …) ne relèvent pas de ce périmètre.</p>
<p>Le calcul ne considère que les services de collecte opérationnels, c''est-à-dire ceux qui ont fonctionné au moins une journée au cours de l''année de référence du calcul et les déchèteries opérationnelles, c''est-à-dire des déchèteries qui ont été ouvertes au moins une journée au cours de l''année de référence du calcul.</p>
<p>La valeur limite est issue des chiffres-clés déchets de l’ADEME, édition 2016, basé sur l’enquête Collecte 2013 et la valeur cible des 47 territoires pionniers en France.</p>
<ul>
<li>
<p>Valeur limite : 573 kg/hab.an</p>
</li>
<li>
<p>Valeur cible : 480 kg/hab.an</p>
</li>
</ul>
', 'kg/hab', true, true, 'Production de déchets ménagers et assimilés (avec déblais et gravats)', null, null, null,
                '{eci_dechets}', '{cae,clef}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_11', '11', null, 'Surface annuelle artificialisée', '<p>L’indicateur mesure les surfaces artificialisées chaque année a minima par l’habitat et les activités, et dans la mesure du possible également pour les autres motifs (infrastructures routières, etc.). Si l’indicateur n’est pas disponible annuellement, il s’agit de la moyenne annuelle sur une période plus large, établi à l’occasion de l’élaboration ou de la révision du PLU ou du SCOT (évaluation règlementaire de la consommation d''espaces naturels, agricoles et forestiers).</p>
', 'ha/an', false, true, 'Artificialisation des espaces naturels, agricoles, forestiers (ha)', null, null, null,
                '{urbanisme_et_amenagement}', '{cae,clef}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_2.e', '2.e', null, 'Consommation énergétique - résidentiel', '',
                'GWh', false, false, 'Consommation énergétique du résidentiel', 'cae_2.a', null, null, '{}', '{cae,pcaet}',
                false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_2.f', '2.f', null, 'Consommation énergétique - tertiaire', '', 'GWh',
                false, false, 'Consommation énergétique du tertiaire', 'cae_2.a', null, null, '{}', '{cae,pcaet}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_63.d', '63.d', null, 'Séquestration dans les autres sols', '',
                'teq CO2', false, false, 'Séquestration dans les autres sols', 'cae_63.a', null, null, '{}', '{cae,pcaet}',
                false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_32', '32', null, 'Rendement énergétique UIOM', '<p>Le rendement de l''UIOM (unité d''incinération des ordures ménagères) est calculé selon la formule permettant la modulation du taux de la TGAP (arrêté du 7 décembre 2016 modifiant l''arrêté du 20 septembre 2002 relatif aux installations d''incinération et de coïncinération de déchets non dangereux et aux installations incinérant des déchets d''activités de soins à risques infectieux). Le niveau de performance énergétique choisi comme valeur cible est celui utilisé à l''article 266 nonies du code des douanes pour bénéficier d’une TGAP réduite.</p>
<ul>
<li>Valeur limite et cible : 65%</li>
</ul>
', '%', true, false,
                'Rendement énergétique de l''Unité d''incinération des ordures ménagères - valorisation énergétique électricité et chaleur',
                null, null, null, '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_1.a', '1.a', null, 'Émissions de gaz à effet de serre', '<p>Émissions de gaz à effet de serre globales annuelles du territoire exprimées en tonnes équivalent CO2.</p>
<p>L''indicateur, issu d''un diagnostic d''émissions de gaz à effet de serre mesure la quantité totale d''émissions annuelle des différents secteurs d''activités et des habitants du territoire, selon les exigences réglementaires des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial).</p>
<p>A savoir : les  émissions  directes  produites par l''ensemble des secteurs résidentiel, tertiaire, transport routier, autres transports, agriculture, déchets, industrie hors branche énergie, branche énergie (hors production d''électricité, de chaleur et de froid pour les émissions de gaz à effet de serre, dont les émissions correspondantes sont comptabilisées au stade de la consommation).</p>
<p>Il ne s''agit pas du bilan GES &quot;Patrimoine et compétences&quot;.</p>
<p>Pour rappel, objectifs nationaux : division par 4 (-75 %) des émissions de gaz à effet de serre d’ici 2050 par rapport à 1990 (loi POPE) et étape intermédiaire de -40% entre 1990 et 2030 (loi de transition énergétique).</p>
', 'teq CO2', false, false, 'Quantité de gaz à effet de serre émis par les activités et les habitants', null, null,
                null, '{energie_et_climat}', '{clef,cae,pcaet}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_60', '60', null,
                'Produits biologiques dans la restauration collective publique', '<p>L’indicateur mesure la part des achats (en euros) labellisés « agriculture biologique » dans les achats totaux d’alimentation de la restauration collective publique (maîtrisée par la collectivité).  Pour la France métropole, la valeur limite est basée sur la part nationale des achats biologiques dans la restauration collective à caractère social en 2015 (3,2% - Agence Bio) et la valeur cible sur l’objectif 2022 du projet de loi pour l’équilibre des relations commerciales dans le secteur agricole et alimentaire et une alimentation saine et durable (20%).</p>
', '%', true, false, 'Part de produits biologiques dans la restauration collective publique par an', null, null,
                'impact', '{activites_economiques}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_42', '42', null, 'Stationnement public voiture', '<p>L''indicateur mesure le nombre de places de stationnement public pour les voitures par habitant (stationnements publics gratuit ou payant, sur voirie ou dans des ouvrages, exploité en régie par la collectivité –commune ou EPCI- ou délégué). Si le périmètre suivi est partiel, l’indiquer en commentaire.</p>
', 'nombre de places', false, false, 'Nombre de places de stationnement public pour les voitures par habitant', null,
                null, null, '{mobilite_et_transport}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_62', '62', null, 'Part de surface forestière certifiée', '<p>L''indicateur mesure le % de surfaces forestières certifiées FSC (Forest Stewardship Council) ou PEFC (Programme de reconnaissance des certifications forestières) par rapport à la surface forestière totale.</p>
', '%', true, true, 'Part de la surface forestière certifiée FSC ou PEFC', null, null, null,
                '{urbanisme_et_amenagement}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_22', '22', null,
                'Energie renouvelable et de récupération des réseaux de chaleur', '<p>Il s''agit de mesurer la part d''énergie renouvelable et de récupération (ENR&amp;R) du réseau de chaleur de la collectivité. La méthodologie de calcul doit être conforme à celle élaborée par le SNCU, reprise réglementairement dans le cadre de l''instruction fiscale ou le classement du réseau de chaleur. En présence de plusieurs réseaux de chaleur, une moyenne doit être réalisée.</p>
<p>La valeur cible est fixée à 75%.</p>
', '%', true, true, 'Taux d''énergie renouvelable et de récupération (ENR&R) des réseaux de chaleur sur le territoire',
                null, null, null, '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_12', '12', null, 'Diagnostic énergétique des bâtiments publics', '<p>L''indicateur mesure la part de bâtiments publics (de préférence en surface, et par défaut en nombre) ayant fait l''objet d''un diagnostic énergétique (à minima de type DPE, et de préférence un audit énergétique plus poussé). Le périmètre des bâtiments pris en compte est le plus large possible : celui dont elle est propriétaire ou celui dont elle est locataire ; les diagnostics pouvant être portés et financés par le propriétaire ou l''utilisateur. Si le suivi est effectué conjointement au niveau communal et intercommunal, l''indicateur peut-être décomposé en deux volets : part de bâtiments communaux ayant fait l''objet d''un diagnostic énergétique et part de bâtiments intercommunaux ayant fait l''objet d''un diagnostic énergétique.</p>
', '%', false, true, 'Part de bâtiments publics ayant fait l''objet d''un diagnostic énergétique', null, null, null,
                '{energie_et_climat}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_55', '55', null, 'Ménages demandeurs et bénéficiaires du FSL', '<p>L’indicateur mesure annuellement le nombre de ménages demandeurs et bénéficiaires du fond de solidarité logement (FSL) pour l’aide au paiement des factures d’énergie sur le territoire. Il peut être obtenu auprès des Conseils Départementaux qui gèrent ce fond (indicateur suivi au niveau national par l’office national de la précarité énergétique).</p>
', 'Nombre de ménages', false, false,
                'Nombre de ménages demandeurs et bénéficiaires du FSL pour l’aide au paiement des factures d’énergie sur le territoire',
                null, null, null, '{solidarite_lien_social}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_50', '50', null, 'Valorisation des CEE', '<p>Les kWhcumac valorisés chaque année par la collectivité sont calculés selon les modalités règlementaires du dispositif des certificats d''économie d''énergie. Il s''agit de ceux dont la rente revient à la collectivité.</p>
', 'kWhcumac valorisé/an', false, false, 'Valorisation des CEE', null, null, null, '{strategie_orga_interne}', '{cae}',
                false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_46', '46', null, 'Fréquentation des transports en commun', '<p>Il s''agit du nombre moyen de voyages en transport en commun effectué chaque année par un habitant.</p>
<ul>
<li>
<p>Valeur limite : 32 (&lt;100 000 hab) et 64 (&gt;100 000 hab)</p>
</li>
<li>
<p>Valeur cible : 114 (&lt;100 000 hab) et 160 (&gt;100 000 hab)</p>
</li>
</ul>
<p>Source de l''indicateur : CEREMA - Transports collectifs urbains de province, 2017</p>
', 'nombre de voyages/hab', true, true, 'Fréquentation des transports en commun par habitant', null, null, null,
                '{mobilite_et_transport}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_40.a', '40.a', null,
                'Consommation annuelle d''énergie des véhicules par agent', '', 'kWh/an.employé', false, false,
                'Consommation annuelle d''énergie des véhicules de la collectivité (kWh/an.employé)', 'cae_40', null, null,
                '{mobilite_et_transport}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_4.d', '4.d', null, 'Emissions de COV', '', 'tonnes', false, true,
                'Quantité totale d''émissions de Composés organiques volatils non méthaniques', 'emission_polluants_atmo', null,
                null, '{nature_environnement_air}', '{clef,cae,pcaet}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_33', '33', null, 'Valorisation énergétique des biodéchets', '<p>L''indicateur mesure l''électricité et la chaleur (en kWh) produite à partir de biodéchets pour l''ensemble du territoire (ménages et activités économiques, agricoles...).</p>
<p>A défaut, il est possible de suivre via un indicateur personnalisé (à relier à cet indicateur) le tonnage des biodéchets collectés de manière séparative. Pour information, le ratio moyen de déchets alimentaires collectés par l’ensemble des collectivités en France en 2015 est de 63 kg/habitant desservi (étude suivi technico-économique biodéchets, Ademe, 2017) :</p>
<ul>
<li>
<p>46 kg/habitant desservi pour la collecte de déchets alimentaires seuls;</p>
</li>
<li>
<p>99 kg/habitant desservi pour la collecte de déchets alimentaires et déchets verts.</p>
</li>
</ul>
', 'kWh', true, false, 'Energie produite par la valorisation des biodéchets', null, null, null, '{energie_et_climat}',
                '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_65', '65', null, 'Consultations sur climat, air, énergie', '<p>Nombre d''heures de consultations et de conseil sur l''énergie et la construction pour 100 hab / an</p>
<ul>
<li>
<p>Valeur limite = 10 min /100 hab</p>
</li>
<li>
<p>Valeur cible = 60 min / 100 hab</p>
</li>
</ul>
', 'Nombre d''heures', true, true,
                'Nombre d''heures de consultations et de conseils sur la thématique climat air énergie pour 100 hab / an', null,
                null, null, '{strategie_orga_interne}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'modes_de_deplacement', null, null, 'Modes de déplacement', '<p>La part modale est une part modale en nombre de déplacements.</p>
<p>Les valeurs limites et cibles des différentes parts modales sont données à titre indicatif : il faut également juger de l''évolution de la part modale au fil du temps et des caractéristiques du territoire. À défaut de posséder les parts modales issues d''une enquête ménages, les collectivités peuvent utiliser les données INSEE donnant les parts modales des déplacements domicile-travail pour la population active (tableau NAV2A ou NAV2B).</p>
', '%', false, true,
                'Part des personnes utilisant un mode de déplacement par rapport à l''ensemble des personnes qui se déplacent',
                null, null, null, '{mobilite_et_transport}', '{cae}', true);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'plans_de_deplacement', null, null, 'Couverture des Plans de déplacements', '<p>L''indicateur comptabilise le nombre d''habitants couverts par un Plan de Déplacements sur le territoire et le rapporte à la population du territoire. Ce chiffre doit être en augmentation chaque année. Des valeurs indicatives limites et cibles sont données, basées sur des données ADEME et les meilleurs scores des collectivités du programme Territoire Engagé.</p>
', '%', false, true, 'Couverture des Plans de déplacements', null, null, null, '{mobilite_et_transport}', '{cae}',
                true);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'emission_polluants_atmo', null, null,
                'Émissions de polluants atmosphériques', '<p>Ces indicateurs estiment les émissions annuelles des six polluants atmosphériques exigés dans le contenu réglementaire des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial) : oxydes d’azote (NOx), les particules PM 10 et PM 2,5 et les composés organiques volatils (COV), tels que définis au I de l’article R. 221-1 du même code, ainsi que le dioxyde de soufre (SO2) et l’ammoniac (NH3).</p>
<p>Les données peuvent être fournies notamment par les associations agréées pour la surveillance de la qualité de l''air (AASQA).</p>
', 'tonnes', false, true, 'Quantité totale d''émissions de polluants atmosphériques', null, null, null,
                '{nature_environnement_air}', '{clef,cae,crte}', true);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_9', '9', null, 'Compacité des formes urbaines', '<p>Les trois indicateurs permettent d''évaluer la compacité des formes urbaines. Il est conseillé de suivre celui qui a le plus de sens pour la collectivité, si elle ne dispose pas des informations pour renseigner les 3.</p>
<ul>
<li>
<p>Rapport annuel entre nouvelle surface construite ou réhabilitée sur des sites en reconversion (sites déjà urbanisés : friches industrielles, dents creuses, habitat insalubre...) / nouvelle surface construite en extension (en limite d''urbanisation ou sur des espaces naturels ou agricoles). La comptabilisation se fait sur la base des permis de construire. Pour une agglomération, le ratio de 2 (soit 1/3 en extension et 2/3 en renouvellement) est une bonne performance ; pour une ville-centre les objectifs visés pourront être plus élevés.</p>
</li>
<li>
<p>Nombre de nouveaux logements collectifs et individuels groupés / nb total de logements autorisés dans l’année (disponibles dans la base SITADEL) la valeur moyenne des régions françaises est indiquée pour information (45 %).</p>
</li>
<li>
<p>Part du foncier en friche : L’indicateur permet d’identifier et caractériser les gisements fonciers locaux qualifiés comme étant « en friche ». Les enjeux sont d’effectuer une veille foncière, d’anticiper la formation de friches et d’étudier la mutabilité des espaces en friche. Compacité des formes urbaines</p>
</li>
</ul>
', '%', false, true, 'Compacité des formes urbaines', null, null, null, '{urbanisme_et_amenagement}', '{cae}', true);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'crte_4.2', '4.2', 'cae_59',
                'Surface agricole utile en agriculture biologique', '<p><strong>Définition:</strong>
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
', '%', false, false, 'Part de la surface agricole utile en agriculture biologique', null, null, null,
                '{urbanisme_et_amenagement}', '{crte}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_39', '39', null, 'Plan de déplacements Entreprise ou Administration', '<p>L''indicateur comptabilise le nombre d''employés couverts par un Plan de Déplacements Entreprise (PDE) et Administration (PDA) sur le territoire et le rapporte à la population active du territoire. Ce chiffre doit être en augmentation chaque année. Des valeurs indicatives limites et cibles sont données, basées sur des données ADEME (enquête nationale 2009 et Poitou-Charentes 2012) et les meilleurs scores des collectivités Territoire Engagé.</p>
', '%', true, true, 'Part de la population active couverte par un Plan de déplacements Entreprise ou Administration',
                'plans_de_deplacement', null, null, '{mobilite_et_transport}', '{cae}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_7.b', '7.b', null, 'Recyclage des déchets du BTP', '<p>Recyclage des déchets du BTP : a minima ceux produits par les chantiers de la collectivité, mais dans l''idéal, ceux produits par toute la filière BTP locale.</p>
<p>L''objectif est de dépasser 70% de valorisation des déchets du BTP (objectif que l’Europe a fixé dans la directive-cadre déchets).</p>
', '%', false, false, 'Recyclage des déchets du BTP par an (%)', 'cae_7', null, 'impact', '{eci_dechets}', '{cae}',
                false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'cae_2.g', '2.g', null, 'Consommation énergétique - transport routier', '',
                'GWh', false, false, 'Consommation énergétique du transport routier', 'cae_2.a', null, null, '{}',
                '{cae,pcaet}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'crte_10.1', '10.1', 'cae_6.a',
                'Collecte annuelle de déchets ménagers et assimilés avec gravats', '<p><strong>Définition:</strong>
Tonnage total de déchets ménagers et assimilés (DMA), y compris gravats, collectés annuellement sur le territoire, rapportée au nombre d’habitants.</p>
<p><strong>Modalités de calcul:</strong>
Le résultat est obtenu par cumul des tonnages collectés par les déchèteries opérationnelles, c''est-à-dire des déchèteries qui ont été ouvertes au moins une journée au cours de l''année de référence du calcul</p>
<p>et celui des collectes opérationnelles, c''est-à-dire les services de collecte qui ont fonctionné au moins une journée au cours de l''année de référence du calcul.</p>
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
<p>Augmenter la quantité de déchets ménagers et assimilés faisant l''objet d''une préparation en vue de la réutilisation ou d''un recyclage afin d’atteindre 55 % en 2025, 60 % en 2030 et 65 % en 2035;</p>
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
', 'kg/hab', false, false, 'Quantité de déchets ménagers et assimilés (avec déblais et gravats) produits par an', null,
                null, null, '{eci_dechets}', '{crte}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'crte_10.2', '10.2', null,
                'Collecte annuelle de déchets ménagers et assimilés hors gravats', '<p><strong>Définition:</strong>
Tonnage total de déchets ménagers et assimilés (DMA), hors gravats, collectés annuellement sur le territoire, rapportée au nombre d’habitants.</p>
<p><strong>Modalités de calcul:</strong>
Le résultat est obtenu par cumul des tonnages collectés par les déchèteries opérationnelles, c''est-à-dire des déchèteries qui ont été ouvertes au moins une journée au cours de l''année de référence du calcul et celui des collectes opérationnelles, c''est-à-dire les services de collecte qui ont fonctionné au moins une journée au cours de l''année de référence du calcul.</p>
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
<p>Augmenter la quantité de déchets ménagers et assimilés faisant l''objet d''une préparation en vue de la réutilisation ou d''un recyclage afin d’atteindre 55 % en 2025, 60 % en 2030 et 65 % en 2035;</p>
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
', 'kg/hab', false, false, 'Quantité de déchets ménagers et assimilés (hors gravats) produits par an', 'crte_10.1',
                null, null, '{eci_dechets}', '{crte}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'eci_14', '14', 'cae_51',
                'Achats publics avec considération environnementale', '<p>% de contrat en nombre ou % de contrat en montant (au choix). Les contrat sur une année civile sont pris en compte.</p>
<p>Voir la notion de la concidération environnementale au PNAAPD 2021-2025 - objectif 100% des marchés comportent une considération environnementale.</p>
<p>La donnée peut être fournie par le service Achats ou Comptabilité</p>
', '%', false, false, 'Part de contrats d''achats publics comportant au moins une considération environnementale', null,
                null, null, '{strategie_orga_interne}', '{}', false);
        insert into indicateur_def (modified_at, id, identifiant, valeur_indicateur, nom, description, unite,
                                    participation_score, selection, titre_long, parent, source, type, thematiques,
                                    programmes, sans_valeur)
        values ('2023-08-10 08:29:55.609245 +00:00', 'crte_2.1', '2.1', 'cae_2.a', 'Consommation énergétique finale annuelle', '<p><strong>Définition:</strong>
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
', 'GWh', false, false, 'Quantité d''énergie consommée par les activités et les habitants par an', null, null, null,
                '{energie_et_climat}', '{crte}', false);


        insert into public.indicateur_definition
        (identifiant_referentiel, titre, titre_long, unite, participation_score,
         sans_valeur_utilisateur, modified_at, created_at, description)
        select id as identifiant_referentiel, nom as titre, titre_long, unite, participation_score,
               sans_valeur as sans_valeur_utilisateur, modified_at, modified_at as created_at, description
        from indicateur_def;

        insert into public.indicateur_thematique (indicateur_id, thematique_id)
        select pid.id, t.id
        from (select id, unnest(thematiques) as thematique from indicateur_def) aid
        join public.indicateur_definition pid on aid.id = pid.identifiant_referentiel
        join public.thematique t on t.md_id = aid.thematique;

        insert into public.indicateur_categorie_tag (categorie_tag_id, indicateur_id)
        select *
        from (
             select (select c.id from categorie_tag c where c.nom = aid.programme::text limit 1) as categorie_tag_id,
                    pid.id as indicateur_id
             from (select id, unnest(programmes) as programme from indicateur_def) aid
             join public.indicateur_definition pid on aid.id = pid.identifiant_referentiel
             ) r
        where r.categorie_tag_id is not null;

        insert into public.indicateur_categorie_tag (categorie_tag_id, indicateur_id)
        select *
        from (
        select (select categorie_tag.id
                from categorie_tag
                where categorie_tag.nom = aid.type::text limit 1) as categorie_tag_id,
               pid.id as indicateur_id
        from indicateur_def aid
        join public.indicateur_definition pid on aid.id = pid.identifiant_referentiel
        where aid.type is not null ) r
        where r.categorie_tag_id is not null;

        insert into public.indicateur_categorie_tag (categorie_tag_id, indicateur_id)
        select *
        from (
             select (
                    select categorie_tag.id
                    from categorie_tag
                    where categorie_tag.nom = 'prioritaire'
                    limit 1
                    )      as categorie_tag_id,
                    pid.id as indicateur_id
             from indicateur_def aid
             join public.indicateur_definition pid on aid.id = pid.identifiant_referentiel
             where aid.selection = true
             ) r
        where r.categorie_tag_id is not null;

        insert into public.indicateur_groupe (parent, enfant)
        select parent.id, enfant.id
        from indicateur_def aid
        join public.indicateur_definition enfant on aid.id = enfant.identifiant_referentiel
        join public.indicateur_definition parent on aid.parent = parent.identifiant_referentiel
        where aid.parent is not null;
    end $$;
