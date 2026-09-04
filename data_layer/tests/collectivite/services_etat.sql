begin;
select plan(7);

-- Le périmètre d'un service de l'État se tient en base et pas seulement dans le
-- code : une DR ADEME par région, et un service national sans territoire.
--
-- Les codes de région sont pris à deux lettres : les dix-huit codes réels sont
-- numériques et tous occupés depuis l'import des services
-- (collectivite/service_etat_import), qui pose une DR ADEME sur chacun.

select lives_ok(
    $$ insert into collectivite (nom, type, region_code)
       values ('DR ADEME test pgTAP', 'dr_ademe', 'ZA') $$,
    'une dr ademe se crée sur sa région'
);

select throws_ok(
    $$ insert into collectivite (nom, type, region_code)
       values ('DR ADEME test pgTAP bis', 'dr_ademe', 'ZA') $$,
    '23505',
    null,
    'une seconde dr ademe sur la même région est refusée'
);

select lives_ok(
    $$ insert into collectivite (nom, type, region_code)
       values ('DR ADEME test pgTAP ailleurs', 'dr_ademe', 'ZB') $$,
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
       values ('Service national régional', 'service_national', 'ZA') $$,
    '23514',
    null,
    'un service national rattaché à une région est refusé : voir tout exclut d''avoir un territoire'
);

select throws_ok(
    $$ insert into collectivite (nom, type, departement_code)
       values ('Service national départemental', 'service_national', 'ZZZ') $$,
    '23514',
    null,
    'et pas davantage à un département'
);

select * from finish();
rollback;
