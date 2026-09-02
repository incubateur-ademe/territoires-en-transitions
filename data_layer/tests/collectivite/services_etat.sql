begin;
select plan(7);

-- Le périmètre d'un service de l'État se tient en base et pas seulement dans le
-- code : une DR ADEME par région, et un service national sans territoire.

select lives_ok(
    $$ insert into collectivite (nom, type, region_code)
       values ('DR ADEME Grand Est test pgTAP', 'dr_ademe', '44') $$,
    'une dr ademe se crée sur sa région'
);

select throws_ok(
    $$ insert into collectivite (nom, type, region_code)
       values ('DR ADEME Grand Est bis', 'dr_ademe', '44') $$,
    '23505',
    null,
    'une seconde dr ademe sur la même région est refusée'
);

select lives_ok(
    $$ insert into collectivite (nom, type, region_code)
       values ('DR ADEME Bretagne test pgTAP', 'dr_ademe', '53') $$,
    'une dr ademe sur une autre région est acceptée'
);

select lives_ok(
    $$ insert into collectivite (nom, type)
       values ('DGEC test pgTAP', 'service_national') $$,
    'un service national se crée sans code géographique'
);

-- Le point de la famille : la DGEC n'est pas seule de son espèce.
select lives_ok(
    $$ insert into collectivite (nom, type)
       values ('ADEME nationale test pgTAP', 'service_national') $$,
    'un second service national coexiste avec le premier'
);

select throws_ok(
    $$ insert into collectivite (nom, type, region_code)
       values ('Service national régional', 'service_national', '44') $$,
    '23514',
    null,
    'un service national rattaché à une région est refusé : voir tout exclut d''avoir un territoire'
);

select throws_ok(
    $$ insert into collectivite (nom, type, departement_code)
       values ('Service national départemental', 'service_national', '01') $$,
    '23514',
    null,
    'et pas davantage à un département'
);

select * from finish();
rollback;
