begin;
select plan(6);

-- Ce que la table des périmètres secondaires garantit : une ligne porte un seul
-- code géographique, sa source est déclarée, et une collectivité ne couvre pas
-- deux fois le même territoire.
--
-- Le sujet est un EPCI et non un service de l'État : la table ne leur est pas
-- réservée — un EPCI qui chevauche plusieurs départements en relève tout autant —
-- et surtout `epci` ne porte aucun index unique sur le code de région, ce qui
-- évite de disputer aux dix-huit régions réelles un code de test.

insert into collectivite (nom, type, region_code, departement_code)
values ('EPCI témoin des périmètres', 'epci', 'Z9', 'Z99');

create temporary view sujet as
select id from collectivite where type = 'epci' and region_code = 'Z9';

select lives_ok(
    $$ insert into collectivite_perimetre_secondaire (collectivite_id, region_code, source)
       select id, 'Z8', 'banatic' from sujet $$,
    'une région secondaire s''ajoute'
);

select throws_ok(
    $$ insert into collectivite_perimetre_secondaire (collectivite_id, region_code, departement_code, source)
       select id, 'Z7', 'Z98', 'banatic' from sujet $$,
    '23514',
    null,
    'une ligne ne porte pas à la fois une région et un département'
);

select throws_ok(
    $$ insert into collectivite_perimetre_secondaire (collectivite_id, source)
       select id, 'banatic' from sujet $$,
    '23514',
    null,
    'une ligne sans aucun code géographique est refusée'
);

select throws_ok(
    $$ insert into collectivite_perimetre_secondaire (collectivite_id, region_code, source)
       select id, 'Z6', 'a_la_main' from sujet $$,
    '23514',
    null,
    'une source inconnue est refusée : chaque producteur ne remplace que ses lignes'
);

select throws_ok(
    $$ insert into collectivite_perimetre_secondaire (collectivite_id, region_code, source)
       select id, 'Z8', 'import_service_etat' from sujet $$,
    '23505',
    null,
    'la même région ne se déclare pas deux fois, même sous une autre source'
);

-- La collectivité emporte ses périmètres. Son bucket de stockage, posé par le
-- trigger `after_collectivite_write`, retient la suppression (clé étrangère sans
-- action) et part d'abord — c'est aussi ce que fait le nettoyage des fixtures.
delete from collectivite_bucket where collectivite_id in (select id from sujet);
delete from collectivite where id in (select id from sujet);

select is(
    (select count(*) from collectivite_perimetre_secondaire p
     where not exists (select 1 from collectivite c where c.id = p.collectivite_id))::int,
    0,
    'la suppression d''une collectivité emporte ses périmètres secondaires'
);

select * from finish();
rollback;
