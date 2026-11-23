-- Plan PCAET en cours sur la collectivité 1, rattaché à la démarche du seed
-- 25 : de quoi tester l'onglet « Suivi » du plan, et surtout le bloc
-- « Indicateurs et objectifs », sans rien saisir.
--
-- Chaque indicateur porte un cas à vérifier :
--   cae_1.a  GES               favori, progresse vers un objectif à la baisse
--   cae_3.a  ENR               favori, progresse vers un objectif à la hausse
--   cae_22   réseaux de chaleur favori, lié à un axe et non à une fiche
--   cae_2.a  conso. finale     stagne loin de son objectif
--   cae_6.a  déchets           régresse : s'éloigne de son objectif
--   cae_46   transports en commun dépasse son objectif 2030
--   bornes   indicateur personnalisé, progresse vite
--   cae_1.c  GES résidentiel   open data seul (RARE, seed 25) et objectif
--   cae_44   voirie cyclable   résultats sans objectif
--   cae_60   bio en cantine    objectif sans résultat
--   cae_59   SAU bio           aucune valeur
--   cae_41   part modale       confidentiel : dernier résultat masqué en visite
--   cae_7    valorisation      porté par une fiche restreinte seulement
--
-- Les objectifs suivent les trois horizons du dépôt (2030, 2036, 2050) : le
-- sélecteur d'horizon du bloc a de quoi changer l'objectif retenu.

do $$
declare
    yolo constant uuid := '17440546-f389-4d4f-bfdb-b0c94a1bd0f9';
    plan_id integer;
    axe_sobriete integer;
    axe_batiments integer;
    axe_mobilites integer;
    axe_enr integer;
    axe_dechets integer;
    axe_alimentation integer;
    bornes_id integer;
    fiche_ecoles integer;
    fiche_transports integer;
    fiche_bornes integer;
    fiche_solaire integer;
    fiche_chaleur integer;
    fiche_biodechets integer;
    fiche_eco_organismes integer;
    fiche_pistes integer;
    fiche_cantines integer;
begin
    if exists (
        select 1 from public.axe
        where collectivite_id = 1 and parent is null and nom = 'PCAET 2026-2031'
    ) then
        return;
    end if;

    -- Plan et axes
    insert into public.axe (nom, collectivite_id, parent, modified_by, type,
                            date_debut, date_fin)
    values ('PCAET 2026-2031', 1, null, yolo, 4, '2026-01-01', '2031-12-31')
    returning id into plan_id;
    update public.axe set plan = plan_id where id = plan_id;

    insert into public.axe (nom, collectivite_id, parent, plan, modified_by)
    values ('1 - Sobriété et efficacité énergétique', 1, plan_id, plan_id, yolo)
    returning id into axe_sobriete;
    insert into public.axe (nom, collectivite_id, parent, plan, modified_by)
    values ('1.1 - Bâtiments publics et logements', 1, axe_sobriete, plan_id, yolo)
    returning id into axe_batiments;
    insert into public.axe (nom, collectivite_id, parent, plan, modified_by)
    values ('1.2 - Mobilités décarbonées', 1, axe_sobriete, plan_id, yolo)
    returning id into axe_mobilites;
    insert into public.axe (nom, collectivite_id, parent, plan, modified_by)
    values ('2 - Énergies renouvelables locales', 1, plan_id, plan_id, yolo)
    returning id into axe_enr;
    insert into public.axe (nom, collectivite_id, parent, plan, modified_by)
    values ('3 - Déchets et économie circulaire', 1, plan_id, plan_id, yolo)
    returning id into axe_dechets;
    insert into public.axe (nom, collectivite_id, parent, plan, modified_by)
    values ('4 - Agriculture et alimentation durables', 1, plan_id, plan_id, yolo)
    returning id into axe_alimentation;

    insert into public.demarche_plan_action (demarche_id, plan_action_id, created_by)
    select d.id, plan_id, yolo
    from public.demarche d
    where d.collectivite_id = 1 and d.type = 'pcaet'
    on conflict do nothing;

    -- Fiches, statuts et jauges variés pour les autres blocs du suivi
    alter table public.fiche_action disable trigger save_history;
    insert into public.fiche_action (titre, collectivite_id, statut, jauge, restreint, created_by, modified_by)
    values ('Rénover les écoles et gymnases communautaires', 1, 'En cours', 40, false, yolo, yolo)
    returning id into fiche_ecoles;
    insert into public.fiche_action (titre, collectivite_id, statut, jauge, restreint, created_by, modified_by)
    values ('Renforcer l''offre de transports en commun et de covoiturage', 1, 'En cours', 60, false, yolo, yolo)
    returning id into fiche_transports;
    insert into public.fiche_action (titre, collectivite_id, statut, jauge, restreint, created_by, modified_by)
    values ('Déployer les bornes de recharge publiques', 1, 'Réalisé', 100, false, yolo, yolo)
    returning id into fiche_bornes;
    insert into public.fiche_action (titre, collectivite_id, statut, jauge, restreint, created_by, modified_by)
    values ('Cadastre solaire et centrales villageoises', 1, 'En cours', 30, false, yolo, yolo)
    returning id into fiche_solaire;
    insert into public.fiche_action (titre, collectivite_id, statut, jauge, restreint, created_by, modified_by)
    values ('Étendre le réseau de chaleur bois', 1, 'À venir', 0, false, yolo, yolo)
    returning id into fiche_chaleur;
    insert into public.fiche_action (titre, collectivite_id, statut, jauge, restreint, created_by, modified_by)
    values ('Généraliser le tri à la source des biodéchets', 1, 'En retard', 20, false, yolo, yolo)
    returning id into fiche_biodechets;
    insert into public.fiche_action (titre, collectivite_id, statut, jauge, restreint, created_by, modified_by)
    values ('Négocier les contributions des éco-organismes', 1, 'En cours', 50, true, yolo, yolo)
    returning id into fiche_eco_organismes;
    insert into public.fiche_action (titre, collectivite_id, statut, jauge, restreint, created_by, modified_by)
    values ('Aménager les pistes cyclables structurantes', 1, 'En cours', 70, false, yolo, yolo)
    returning id into fiche_pistes;
    insert into public.fiche_action (titre, collectivite_id, statut, jauge, restreint, created_by, modified_by)
    values ('Introduire des produits bio et locaux dans les cantines', 1, 'A discuter', 10, false, yolo, yolo)
    returning id into fiche_cantines;
    alter table public.fiche_action enable trigger save_history;

    insert into public.fiche_action_axe (fiche_id, axe_id, created_by)
    values (fiche_ecoles, axe_batiments, yolo),
           (fiche_transports, axe_mobilites, yolo),
           (fiche_bornes, axe_mobilites, yolo),
           (fiche_solaire, axe_enr, yolo),
           (fiche_chaleur, axe_enr, yolo),
           (fiche_biodechets, axe_dechets, yolo),
           (fiche_eco_organismes, axe_dechets, yolo),
           (fiche_pistes, axe_mobilites, yolo),
           (fiche_cantines, axe_alimentation, yolo);

    -- Indicateur personnalisé
    insert into public.indicateur_definition (titre, unite, collectivite_id, precision, created_by, modified_by)
    values ('Bornes de recharge publiques', 'bornes', 1, 0, yolo, yolo)
    returning id into bornes_id;

    -- Indicateurs des fiches et des axes
    create temporary table seed_indicateur on commit drop as
    select identifiant_referentiel as identifiant, id
    from public.indicateur_definition
    where identifiant_referentiel is not null
    union all
    select 'bornes', bornes_id;

    insert into public.fiche_action_indicateur (fiche_id, indicateur_id, created_by)
    select f.fiche_id, i.id, yolo
    from (values (fiche_ecoles, 'cae_1.a'),
                 (fiche_ecoles, 'cae_2.a'),
                 (fiche_transports, 'cae_46'),
                 (fiche_transports, 'cae_41'),
                 (fiche_bornes, 'bornes'),
                 (fiche_bornes, 'cae_1.a'),
                 (fiche_solaire, 'cae_3.a'),
                 (fiche_biodechets, 'cae_6.a'),
                 (fiche_eco_organismes, 'cae_7'),
                 (fiche_pistes, 'cae_44'),
                 (fiche_pistes, 'cae_1.c'),
                 (fiche_cantines, 'cae_60'),
                 (fiche_cantines, 'cae_59')) as f (fiche_id, identifiant)
    join seed_indicateur i using (identifiant)
    on conflict do nothing;

    insert into public.axe_indicateur (axe_id, indicateur_id, created_by)
    select axe_enr, d.id, yolo
    from public.indicateur_definition d
    where d.identifiant_referentiel = 'cae_22'
    on conflict do nothing;

    -- Résultats et objectifs saisis par la collectivité
    insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur,
                                          periodicite, resultat, objectif)
    select i.id, 1, make_date(v.annee, 1, 1), 'annuelle',
           v.resultat, v.objectif
    from (values
        -- progresse à la baisse
        ('cae_1.a', 2015, 230, null), ('cae_1.a', 2017, 222, null),
        ('cae_1.a', 2019, 210, null), ('cae_1.a', 2021, 199, null),
        ('cae_1.a', 2023, 188, null), ('cae_1.a', 2024, 182, null),
        ('cae_1.a', 2030, null, 150), ('cae_1.a', 2036, null, 125),
        ('cae_1.a', 2050, null, 80),
        -- progresse à la hausse
        ('cae_3.a', 2016, 40, null), ('cae_3.a', 2018, 52, null),
        ('cae_3.a', 2020, 61, null), ('cae_3.a', 2022, 75, null),
        ('cae_3.a', 2024, 88, null),
        ('cae_3.a', 2030, null, 140), ('cae_3.a', 2036, null, 180),
        ('cae_3.a', 2050, null, 260),
        -- lié à un axe, progresse
        ('cae_22', 2019, 45, null), ('cae_22', 2022, 52, null),
        ('cae_22', 2024, 58, null),
        ('cae_22', 2030, null, 70), ('cae_22', 2050, null, 90),
        -- stagne
        ('cae_2.a', 2015, 590, null), ('cae_2.a', 2018, 588, null),
        ('cae_2.a', 2021, 592, null), ('cae_2.a', 2023, 589, null),
        ('cae_2.a', 2024, 590, null),
        ('cae_2.a', 2030, null, 480), ('cae_2.a', 2036, null, 420),
        ('cae_2.a', 2050, null, 300),
        -- régresse
        ('cae_6.a', 2019, 560, null), ('cae_6.a', 2021, 575, null),
        ('cae_6.a', 2023, 590, null), ('cae_6.a', 2024, 602, null),
        ('cae_6.a', 2030, null, 500),
        -- dépasse son objectif
        ('cae_46', 2018, 60, null), ('cae_46', 2020, 52, null),
        ('cae_46', 2022, 70, null), ('cae_46', 2024, 84, null),
        ('cae_46', 2030, null, 80), ('cae_46', 2036, null, 95),
        -- indicateur personnalisé
        ('bornes', 2021, 12, null), ('bornes', 2022, 25, null),
        ('bornes', 2023, 41, null), ('bornes', 2024, 63, null),
        ('bornes', 2030, null, 120),
        -- open data seul : objectif sans résultat saisi
        ('cae_1.c', 2030, null, 22), ('cae_1.c', 2050, null, 12),
        -- résultats sans objectif
        ('cae_44', 2020, 12, null), ('cae_44', 2022, 15, null),
        ('cae_44', 2024, 19, null),
        -- objectif sans résultat
        ('cae_60', 2030, null, 50),
        -- confidentiel
        ('cae_41', 2021, 18, null), ('cae_41', 2023, 21, null),
        ('cae_41', 2024, 23, null), ('cae_41', 2030, null, 35),
        -- fiche restreinte
        ('cae_7', 2020, 38, null), ('cae_7', 2023, 41, null),
        ('cae_7', 2030, null, 55)
    ) as v (identifiant, annee, resultat, objectif)
    join seed_indicateur i using (identifiant)
    on conflict do nothing;

    -- Favoris et confidentialité
    insert into public.indicateur_collectivite (collectivite_id, indicateur_id, favoris, confidentiel)
    select 1, d.id, d.identifiant_referentiel in ('cae_1.a', 'cae_3.a', 'cae_22'),
           d.identifiant_referentiel = 'cae_41'
    from public.indicateur_definition d
    where d.identifiant_referentiel in ('cae_1.a', 'cae_3.a', 'cae_22', 'cae_41')
    on conflict (collectivite_id, indicateur_id)
        do update set favoris = excluded.favoris, confidentiel = excluded.confidentiel;
end;
$$;
