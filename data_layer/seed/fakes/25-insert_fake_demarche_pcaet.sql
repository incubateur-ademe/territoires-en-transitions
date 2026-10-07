-- Démarche PCAET de démonstration sur la collectivité 1, avec un diagnostic
-- adossé à des valeurs réelles : l'écran « Compléter le diagnostic et les
-- objectifs » a de la matière crédible sans saisie manuelle.
--
-- Les valeurs de référence sont celles d'un EPCI réellement couvert par les
-- observatoires (CC Maine Saosnois), relevées sur les identifiants du
-- référentiel PCAET. Elles gardent leurs ordres de grandeur et leurs trous : le
-- profil est dominé par l'agriculture, « Autres transports » n'est pas
-- inventorié, la séquestration porte un poste négatif, et les polluants ne sont
-- ventilés que sur trois secteurs.

insert into public.demarche (collectivite_id, type, titre, description, status,
                            obligation, launched_at, created_by)
select 1,
       'pcaet',
       'PCAET réglementaire',
       'Démarche de démonstration : diagnostic renseigné, programme d''actions et pièces encore à compléter.',
       'en_elaboration',
       'obligatoire',
       '2026-01-15',
       '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
where not exists (
    select 1 from public.demarche where collectivite_id = 1 and type = 'pcaet'
);

-- Sans pilote à compte utilisateur, tout éditeur est autorisé (guard
-- `estPilote`). En nommer un rapproche le seed d'un dossier réel.
insert into public.demarche_pilote (demarche_id, user_id, created_by)
select d.id, dcp.user_id, dcp.user_id
from public.demarche d
join public.dcp dcp on dcp.user_id = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
where d.collectivite_id = 1
  and d.type = 'pcaet'
on conflict do nothing;

-- Atmo est créée par le pipeline d'import des données ouvertes, hors sqitch :
-- sans elle, le topic des polluants n'aurait aucune valeur de référence.
insert into public.indicateur_source (id, libelle, ordre_affichage)
values ('atmo', 'Atmo', 1)
on conflict do nothing;

-- Identifiants explicites via max(id)+1 (idempotent / ordre de seed stable).
-- La séquence est resynchronisée en fin de fichier pour les inserts `default`
-- des tests e2e (sinon collision avec les ids seedés).
insert into public.indicateur_source_metadonnee (id, source_id, date_version, diffuseur)
select coalesce(max(id), 0) + 1, 'atmo', '2025-12-31'::timestamptz, 'Atmo France'
from public.indicateur_source_metadonnee
where not exists (
    select 1 from public.indicateur_source_metadonnee where source_id = 'atmo'
);

-- L'année de comptabilisation est dérivée des valeurs saisies (2018 ci-dessous).
-- Les années 2019/2021 du RARE apparaissent comme colonnes dès qu'une saisie
-- les porte ; les références open data restent affichées à côté.

-- Valeurs de référence relevées sur la CC Maine Saosnois. Aucune ne se
-- substitue à la saisie : elles s'affichent à côté, avec leur source.
with reference (referentiel_id, source_id, annee, resultat) as (
    values
           ('cae_1.a', 'rare', 2018, 208.360),
           ('cae_1.a', 'rare', 2019, 205.170),
           ('cae_1.a', 'rare', 2021, 195.180),
           ('cae_1.c', 'rare', 2018, 27.420),
           ('cae_1.c', 'rare', 2019, 27.130),
           ('cae_1.c', 'rare', 2021, 25.870),
           ('cae_1.d', 'rare', 2018, 10.510),
           ('cae_1.d', 'rare', 2019, 11.410),
           ('cae_1.d', 'rare', 2021, 12.820),
           ('cae_1.e', 'rare', 2018, 32.980),
           ('cae_1.e', 'rare', 2019, 32.390),
           ('cae_1.e', 'rare', 2021, 30.400),
           ('cae_1.g', 'rare', 2018, 127.200),
           ('cae_1.g', 'rare', 2019, 123.520),
           ('cae_1.g', 'rare', 2021, 116.800),
           ('cae_1.h', 'rare', 2018, 1.380),
           ('cae_1.h', 'rare', 2019, 1.340),
           ('cae_1.h', 'rare', 2021, 1.130),
           ('cae_1.i', 'rare', 2018, 8.700),
           ('cae_1.i', 'rare', 2019, 9.210),
           ('cae_1.i', 'rare', 2021, 8.000),
           ('cae_1.j', 'rare', 2018, 0.170),
           ('cae_1.j', 'rare', 2019, 0.170),
           ('cae_1.j', 'rare', 2021, 0.160),
           ('cae_2.a', 'rare', 2018, 575.180),
           ('cae_2.a', 'rare', 2019, 580.420),
           ('cae_2.a', 'rare', 2021, 586.060),
           ('cae_2.e', 'rare', 2018, 225.890),
           ('cae_2.e', 'rare', 2019, 229.250),
           ('cae_2.e', 'rare', 2021, 236.330),
           ('cae_2.f', 'rare', 2018, 64.310),
           ('cae_2.f', 'rare', 2019, 68.460),
           ('cae_2.f', 'rare', 2021, 78.230),
           ('cae_2.g', 'rare', 2018, 128.550),
           ('cae_2.g', 'rare', 2019, 126.830),
           ('cae_2.g', 'rare', 2021, 119.950),
           ('cae_2.i', 'rare', 2018, 52.020),
           ('cae_2.i', 'rare', 2019, 50.430),
           ('cae_2.i', 'rare', 2021, 56.110),
           ('cae_2.k', 'rare', 2018, 104.410),
           ('cae_2.k', 'rare', 2019, 105.450),
           ('cae_2.k', 'rare', 2021, 95.440),
           ('cae_3.a', 'rare', 2018, 63939.160),
           ('cae_3.a', 'rare', 2019, 76383.860),
           ('cae_3.a', 'rare', 2021, 89299.420),
           ('cae_3.aa', 'rare', 2018, 2037.250),
           ('cae_3.aa', 'rare', 2019, 1927.270),
           ('cae_3.aa', 'rare', 2021, 6126.010),
           ('cae_3.ab', 'rare', 2018, 0.000),
           ('cae_3.ab', 'rare', 2019, 0.000),
           ('cae_3.ab', 'rare', 2021, 0.000),
           ('cae_3.ac', 'rare', 2018, 4601.670),
           ('cae_3.ac', 'rare', 2019, 4397.140),
           ('cae_3.ac', 'rare', 2021, 4856.780),
           ('cae_3.ad', 'rare', 2018, 0.000),
           ('cae_3.ad', 'rare', 2019, 9073.500),
           ('cae_3.ad', 'rare', 2021, 8141.980),
           ('cae_3.ae', 'rare', 2018, 0.000),
           ('cae_3.ae', 'rare', 2019, 0.000),
           ('cae_3.ae', 'rare', 2021, 0.000),
           ('cae_3.af', 'rare', 2018, 1752.000),
           ('cae_3.af', 'rare', 2019, 1752.000),
           ('cae_3.af', 'rare', 2021, 3981.260),
           ('cae_3.ag', 'rare', 2018, 43826.420),
           ('cae_3.ag', 'rare', 2019, 46066.330),
           ('cae_3.ag', 'rare', 2021, 45729.530),
           ('cae_3.ah', 'rare', 2018, 0.000),
           ('cae_3.ah', 'rare', 2019, 0.000),
           ('cae_3.ah', 'rare', 2021, 0.000),
           ('cae_3.ai', 'rare', 2018, 1169.940),
           ('cae_3.ai', 'rare', 2019, 1437.690),
           ('cae_3.ai', 'rare', 2021, 1477.860),
           ('cae_3.aj', 'rare', 2018, 384.510),
           ('cae_3.aj', 'rare', 2019, 388.360),
           ('cae_3.aj', 'rare', 2021, 394.160),
           ('cae_3.am', 'rare', 2018, 62.730),
           ('cae_3.am', 'rare', 2019, 62.920),
           ('cae_3.am', 'rare', 2021, 63.130),
           ('cae_3.an', 'rare', 2018, 54.750),
           ('cae_3.an', 'rare', 2019, 68.800),
           ('cae_3.an', 'rare', 2021, 90.110),
           ('cae_3.ao', 'rare', 2018, 0.000),
           ('cae_3.ao', 'rare', 2019, 0.000),
           ('cae_3.ao', 'rare', 2021, 0.000),
           ('cae_3.c', 'rare', 2018, 0.000),
           ('cae_3.c', 'rare', 2019, 0.000),
           ('cae_3.c', 'rare', 2021, 4582.000),
           ('cae_4.a', 'atmo', 2018, 253.510),
           ('cae_4.ac', 'atmo', 2018, 67.440),
           ('cae_4.ag', 'atmo', 2018, 108.770),
           ('cae_4.ah', 'atmo', 2018, 0.000),
           ('cae_4.b', 'atmo', 2018, 278.540),
           ('cae_4.bc', 'atmo', 2018, 163.290),
           ('cae_4.bg', 'atmo', 2018, 8.590),
           ('cae_4.bh', 'atmo', 2018, 0.000),
           ('cae_4.c', 'atmo', 2018, 139.090),
           ('cae_4.cc', 'atmo', 2018, 34.490),
           ('cae_4.cg', 'atmo', 2018, 6.740),
           ('cae_4.ch', 'atmo', 2018, 0.000),
           ('cae_4.d', 'atmo', 2018, 370.730),
           ('cae_4.dc', 'atmo', 2018, 46.480),
           ('cae_4.dg', 'atmo', 2018, 11.050),
           ('cae_4.dh', 'atmo', 2018, 0.000),
           ('cae_4.e', 'atmo', 2018, 13.430),
           ('cae_4.ec', 'atmo', 2018, 0.250),
           ('cae_4.eg', 'atmo', 2018, 0.080),
           ('cae_4.eh', 'atmo', 2018, 0.000),
           ('cae_4.f', 'atmo', 2018, 1205.150),
           ('cae_4.fc', 'atmo', 2018, 1180.620),
           ('cae_4.fg', 'atmo', 2018, 1.290),
           ('cae_4.fh', 'atmo', 2018, 0.000),
           ('cae_63.a', 'aldo', 2018, 32.710),
           ('cae_63.b', 'aldo', 2018, 31.817),
           ('cae_63.c', 'aldo', 2018, 0.000),
           ('cae_63.d', 'aldo', 2018, -0.060),
           ('cae_63.e', 'aldo', 2018, 0.950)
),
millesime as (
    select distinct on (source_id) source_id, id
    from public.indicateur_source_metadonnee
    order by source_id, date_version desc
)
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur,
                                      metadonnee_id, resultat)
select d.id, 1, make_date(r.annee, 1, 1), m.id, r.resultat
from reference r
join public.indicateur_definition d on d.identifiant_referentiel = r.referentiel_id
join millesime m on m.source_id = r.source_id
on conflict do nothing;

-- Source dédiée au dépôt PCAET + métadonnée liée à la démarche de démo.
insert into public.indicateur_source (id, libelle, ordre_affichage)
values ('pcaet-collectivite', 'PCAET collectivité', null)
on conflict do nothing;

insert into public.indicateur_source_metadonnee (id, source_id, date_version, diffuseur)
select coalesce(max(id), 0) + 1, 'pcaet-collectivite', '2026-01-15'::timestamptz, 'Territoires en Transitions'
from public.indicateur_source_metadonnee
where not exists (
    select 1 from public.indicateur_source_metadonnee where source_id = 'pcaet-collectivite'
);

insert into public.demarche_pcaet_source_metadonnee (demarche_id, collectivite_id, metadonnee_id)
select d.id, 1, m.id
from public.demarche d
cross join lateral (
    select id from public.indicateur_source_metadonnee
    where source_id = 'pcaet-collectivite'
    order by id desc
    limit 1
) m
where d.collectivite_id = 1
  and d.type = 'pcaet'
on conflict do nothing;

-- Saisie PCAET : part de l'inventaire observatoire sur 2018. Les lignes
-- requises non couvertes reçoivent une valeur du même ordre.
with polluant (label, lettre, referentiel_id) as (
    values ('NOx', 'a', 'cae_4.a'), ('PM10', 'b', 'cae_4.b'), ('PM2.5', 'c', 'cae_4.c'),
           ('COVNM', 'd', 'cae_4.d'), ('SO2', 'e', 'cae_4.e'), ('NH3', 'f', 'cae_4.f')
),
secteur_polluant (label, lettre) as (
    values ('Résidentiel', 'a'), ('Tertiaire', 'b'), ('Transport routier', 'g'),
           ('Autres transports', 'h'), ('Agriculture', 'c'), ('Déchets', 'd'),
           ('Industrie hors branche énergie', 'e'), ('Branche énergie', 'f'),
           ('Chantiers', 'i')
),
requis (referentiel_id, topic_code) as (
    values
        ('cae_1.c', 'profil_energie_climat'), ('cae_1.d', 'profil_energie_climat'),
        ('cae_1.e', 'profil_energie_climat'), ('cae_1.f', 'profil_energie_climat'),
        ('cae_1.g', 'profil_energie_climat'), ('cae_1.h', 'profil_energie_climat'),
        ('cae_1.i', 'profil_energie_climat'), ('cae_1.j', 'profil_energie_climat'),
        ('cae_2.e', 'consommation_energetique'), ('cae_2.f', 'consommation_energetique'),
        ('cae_2.g', 'consommation_energetique'), ('cae_2.h', 'consommation_energetique'),
        ('cae_2.i', 'consommation_energetique'), ('cae_2.j', 'consommation_energetique'),
        ('cae_2.k', 'consommation_energetique'), ('cae_2.l_pcaet', 'consommation_energetique'),
        ('cae_63.b', 'sequestration'), ('cae_63.c', 'sequestration')
    union all
    select p.referentiel_id, 'polluants_atmospheriques' from polluant p
    union all
    select 'cae_4.' || p.lettre || s.lettre, 'polluants_atmospheriques'
    from polluant p
    cross join secteur_polluant s
),
ligne as (
    select r.topic_code,
           d.id as indicateur_id,
           iv.resultat as inventaire,
           avg(iv.resultat) filter (where iv.resultat is not null)
               over (partition by r.topic_code) as moyenne_topic
    from requis r
    join public.indicateur_definition d on d.identifiant_referentiel = r.referentiel_id
    left join public.indicateur_valeur iv
           on iv.indicateur_id = d.id
          and iv.collectivite_id = 1
          and iv.date_valeur = '2018-01-01'
          and iv.metadonnee_id is not null
),
saisie as (
    select topic_code,
           indicateur_id,
           coalesce(inventaire, round((moyenne_topic * 0.2)::numeric, 2)) as resultat
    from ligne
),
meta as (
    select metadonnee_id
    from public.demarche_pcaet_source_metadonnee
    where collectivite_id = 1
    limit 1
)
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur,
                                      metadonnee_id, resultat)
select saisie.indicateur_id, 1, '2018-01-01'::date, meta.metadonnee_id, saisie.resultat
from saisie
cross join meta
where saisie.resultat is not null
on conflict do nothing;

-- Objectifs aux trois horizons réglementaires.
with horizon (annee, baisse, hausse) as (
    values (2030, 0.80, 1.40),
           (2036, 0.68, 1.70),
           (2050, 0.45, 2.40)
),
meta as (
    select metadonnee_id
    from public.demarche_pcaet_source_metadonnee
    where collectivite_id = 1
    limit 1
),
saisie_2018 as (
    select iv.indicateur_id, iv.resultat, d.identifiant_referentiel
    from public.indicateur_valeur iv
    join public.indicateur_definition d on d.id = iv.indicateur_id
    join meta on meta.metadonnee_id = iv.metadonnee_id
    where iv.collectivite_id = 1
      and iv.date_valeur = '2018-01-01'
      and iv.resultat is not null
      and d.identifiant_referentiel not like 'cae_63.%'
)
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur,
                                      metadonnee_id, objectif)
select s.indicateur_id,
       1,
       make_date(horizon.annee, 1, 1),
       meta.metadonnee_id,
       round((s.resultat * case when s.identifiant_referentiel like 'cae_3.%'
                                then horizon.hausse
                                else horizon.baisse end)::numeric, 2)
from saisie_2018 s
cross join horizon
cross join meta
on conflict do nothing;

-- Aligne la séquence après les inserts à id explicite (atmo + pcaet-collectivite).
select setval(
    pg_get_serial_sequence('public.indicateur_source_metadonnee', 'id'),
    (select coalesce(max(id), 1) from public.indicateur_source_metadonnee)
);
