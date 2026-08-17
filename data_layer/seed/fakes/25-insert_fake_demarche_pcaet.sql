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

-- Les métadonnées seedées portent des identifiants explicites sans avancer la
-- séquence (cf. 15-insert_fake_indicateurs.sql) : `nextval` collisionnerait.
insert into public.indicateur_source_metadonnee (id, source_id, date_version, diffuseur)
select coalesce(max(id), 0) + 1, 'atmo', '2025-12-31'::timestamptz, 'Atmo France'
from public.indicateur_source_metadonnee
where not exists (
    select 1 from public.indicateur_source_metadonnee where source_id = 'atmo'
);

-- Années retenues par la collectivité. 2018 est la seule année couverte par les
-- trois observatoires à la fois : les inventaires ont plusieurs années de
-- retard, et le RARE va plus loin que l'Atmo ou l'ALDO. Le profil et la
-- consommation reçoivent donc les colonnes que le RARE sait remplir.
insert into public.demarche_pcaet_diagnostic_state (demarche_id, topic_id, reference_year, extra_years)
select d.id,
       t.id,
       2018,
       case t.code
           when 'profil_energie_climat' then array[2019, 2021]
           when 'consommation_energetique' then array[2021]
           else array[]::integer[]
       end
from public.demarche d
cross join public.demarche_pcaet_topic t
where d.collectivite_id = 1
  and d.type = 'pcaet'
  and t.kind = 'indicateurs'
on conflict do nothing;

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

-- Saisie de la collectivité : elle part de l'inventaire de l'observatoire sur
-- l'année de comptabilisation. Les lignes requises que l'observatoire ne couvre
-- pas reçoivent une valeur du même ordre, faute de quoi le dossier de démo ne
-- serait jamais transmissible.
with ligne as (
    select t.code                                as topic_code,
           d.id                                  as indicateur_id,
           r.requis,
           iv.resultat                           as inventaire,
           avg(iv.resultat) filter (where iv.resultat is not null)
               over (partition by t.code)        as moyenne_topic
    from public.demarche_pcaet_topic t
    join public.demarche_pcaet_topic_row r on r.topic_id = t.id
    join public.indicateur_definition d on d.identifiant_referentiel = r.referentiel_id
    left join public.indicateur_valeur iv
           on iv.indicateur_id = d.id
          and iv.collectivite_id = 1
          and iv.date_valeur = '2018-01-01'
          and iv.metadonnee_id is not null
    where t.kind = 'indicateurs'
),
saisie as (
    select topic_code,
           indicateur_id,
           coalesce(
               inventaire,
               case when requis then round((moyenne_topic * 0.2)::numeric, 2) end
           ) as resultat
    from ligne
)
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur,
                                      metadonnee_id, resultat)
select indicateur_id, 1, '2018-01-01'::date, null, resultat
from saisie
where resultat is not null
on conflict do nothing;

-- Objectifs aux trois horizons réglementaires : baisse pour les émissions et la
-- consommation, hausse pour les énergies renouvelables. La séquestration reste
-- sans objectif, pour garder à l'écran une étape visiblement à compléter.
with horizon (annee, baisse, hausse) as (
    values (2030, 0.80, 1.40),
           (2036, 0.68, 1.70),
           (2050, 0.45, 2.40)
)
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur,
                                      metadonnee_id, objectif)
select iv.indicateur_id,
       1,
       make_date(horizon.annee, 1, 1),
       null,
       round((iv.resultat * case when t.code = 'enr' then horizon.hausse
                                 else horizon.baisse end)::numeric, 2)
from public.demarche_pcaet_topic t
join public.demarche_pcaet_topic_row r on r.topic_id = t.id
join public.indicateur_definition d on d.identifiant_referentiel = r.referentiel_id
join public.indicateur_valeur iv
     on iv.indicateur_id = d.id
    and iv.collectivite_id = 1
    and iv.date_valeur = '2018-01-01'
    and iv.metadonnee_id is null
cross join horizon
where t.kind = 'indicateurs'
  and t.code <> 'sequestration'
  and iv.resultat is not null
on conflict do nothing;
