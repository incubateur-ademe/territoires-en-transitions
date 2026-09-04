begin;
select plan(9);

-- Ce que l'import des services de l'État garantit une fois joué : les quatre
-- familles peuplées, chacune avec son SIREN et son NIC, et un second passage sans
-- doublon ni renommage.
--
-- Le test ne recharge pas `09-service_etat.sql` : ce fichier porte son propre
-- `commit`, qui refermerait la transaction du test. Il vérifie les invariants sur
-- la base seedée, et la forme des requêtes qui les tiennent. La rejouabilité de
-- bout en bout se contrôle en repassant le fichier avec psql (cf. le README de
-- data_layer/seed/sources/service-etat).
--
-- « SIREN renseigné » sert de marqueur de l'import : les services créés par les
-- tests e2e n'en portent pas, ce qui rend ces comptes stables.

select is(
    (select count(*) from collectivite where type = 'dreal' and siren is not null)::int,
    18,
    'une DREAL par région, les dix-huit avec leur SIREN'
);

select is(
    (select count(*) from collectivite where type = 'ddt' and siren is not null)::int,
    92,
    'quatre-vingt-douze DDT : les quatre-vingt-seize départements métropolitains moins les quatre absorbés par la DRIEAT'
);

select is(
    (select count(*) from collectivite where type = 'dr_ademe' and siren is not null)::int,
    18,
    'une DR ADEME par région'
);

select is(
    (select count(*) from collectivite where type = 'service_national' and siren is not null)::int,
    2,
    'deux services nationaux : la DGEC et l''ADEME'
);

-- Le NIC est ce qui distingue deux services partageant un SIREN — sans lui, le
-- rattachement automatique par ProConnect ne peut pas trancher entre les
-- dix-huit DR ADEME.
select is(
    (select count(*) from collectivite
     where type in ('dreal', 'ddt', 'dr_ademe', 'service_national', 'region')
       and siren is not null and nic is null)::int,
    0,
    'aucun service ni conseil régional n''a de SIREN sans NIC'
);

select is(
    (select count(*) from collectivite where type = 'region' and siren is not null)::int,
    18,
    'les dix-huit conseils régionaux ont gagné leur SIREN'
);

-- La DR ADEME Océan Indien couvre La Réunion et Mayotte : deux lignes, même
-- SIRET. L'index ne portant que sur la région, la base l'accepte — et rien
-- n'impose l'unicité de `siren` sur `collectivite`.
select is(
    (select count(distinct region_code) from collectivite
     where type = 'dr_ademe' and siren = '385290309' and nic = '00397')::int,
    2,
    'une même DR ADEME peut couvrir deux régions avec un seul SIRET'
);

-- L'appariement se fait sur la famille et le code géographique, jamais sur le
-- nom : un service déjà nommé en base garde son nom et ne fait que gagner son
-- identité SIRENE. C'est ce qui préserve la DREAL Pays de la Loire créée à la
-- main en production.
insert into collectivite (nom, type, region_code)
values ('DREAL témoin', 'dreal', 'ZD');

insert into collectivite (nom, type, region_code, siren, nic)
values ('Dénomination officielle interminable', 'dreal', 'ZD', '130006109', '00057')
on conflict (type, region_code) where type = 'dreal'
do update set siren = excluded.siren,
              nic   = excluded.nic;

select is(
    (select nom || ' / ' || siren || ' / ' || nic from collectivite
     where type = 'dreal' and region_code = 'ZD'),
    'DREAL témoin / 130006109 / 00057',
    'un second passage renseigne le SIREN et le NIC sans renommer le service'
);

-- Aucun test de comportement ne couvrait l'unicité des DDT, seulement
-- l'existence de son index dans le `verify` sqitch.
select throws_ok(
    $$ insert into collectivite (nom, type, departement_code, region_code)
       values ('DDT en doublon', 'ddt', '01', '84') $$,
    '23505',
    null,
    'une seconde DDT sur le même département est refusée'
);

select * from finish();
rollback;
