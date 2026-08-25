begin;
select plan(14);

create temp table ctx (
    dreal_id integer,
    epci_id integer,
    demarche_id integer,
    demande_id integer
) on commit drop;

with d as (
    insert into collectivite (nom, type, region_code)
    values ('DREAL test pgTAP', 'dreal', '93')
    returning id
)
insert into ctx (dreal_id) select id from d;

update ctx set epci_id = (select id from collectivite where type = 'epci' limit 1);

with dem as (
    insert into demarche (collectivite_id, type, titre)
    select epci_id, 'pcaet', 'Démarche PCAET test' from ctx
    returning id
)
update ctx set demarche_id = (select id from dem);

select throws_ok(
    $$ insert into demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source)
       select demarche_id, epci_id, 'seed' from ctx $$,
    'P0001',
    null,
    'une demande d''avis visant un epci est refusée'
);

select lives_ok(
    $$ insert into demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source)
       select demarche_id, dreal_id, 'seed' from ctx $$,
    'une demande d''avis visant une dreal est acceptée'
);

update ctx set demande_id = (select id from demarche_pcaet_demande_avis limit 1);

select throws_ok(
    $$ delete from demarche where id = (select demarche_id from ctx) $$,
    '23503',
    null,
    'supprimer une démarche instruite est refusé'
);

select throws_ok(
    $$ insert into demarche_pcaet_demande_avis (instructeur_collectivite_id, source)
       select dreal_id, 'seed' from ctx $$,
    '23502',
    null,
    'une demande d''avis sans démarche est refusée'
);

select throws_ok(
    $$ update demarche_pcaet_demande_avis
       set instructeur_collectivite_id = (select epci_id from ctx)
       where id = (select demande_id from ctx) $$,
    'P0001',
    null,
    'rediriger une demande d''avis vers un epci est refusé'
);

select throws_ok(
    $$ insert into demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source)
       select demarche_id, dreal_id, 'seed' from ctx $$,
    '23505',
    null,
    'une seconde demande pour la même (démarche, instructrice) est refusée'
);

select throws_ok(
    $$ insert into demarche_pcaet_avis (demande_avis_id, emetteur_collectivite_id, au_titre_de, sens)
       select demande_id, epci_id, 'prefet_region', 'favorable' from ctx $$,
    'P0001',
    null,
    'un avis émis par un epci est refusé'
);

select lives_ok(
    $$ insert into demarche_pcaet_avis (demande_avis_id, emetteur_collectivite_id, au_titre_de, sens)
       select demande_id, dreal_id, 'prefet_region', 'favorable' from ctx $$,
    'un avis brouillon (sans PJ) émis par une dreal est accepté'
);

select throws_ok(
    $$ insert into demarche_pcaet_avis (demande_avis_id, emetteur_collectivite_id, au_titre_de, sens)
       select demande_id, dreal_id, 'prefet_region', 'defavorable' from ctx $$,
    '23505',
    null,
    'un second avis au même titre sur la même demande est refusé'
);

select lives_ok(
    $$ insert into demarche_pcaet_avis (demande_avis_id, emetteur_collectivite_id, au_titre_de, sens)
       select demande_id, dreal_id, 'autorite_environnementale', 'favorable' from ctx $$,
    'un avis à l''autre titre sur la même demande est accepté'
);

select throws_ok(
    $$ update demarche_pcaet_avis set valide_le = now() where fichier_ref is null $$,
    '23514',
    null,
    'valider un avis sans PJ est refusé'
);

select is(
    (select bool_and(relrowsecurity) from pg_class
     where oid in ('public.demarche_pcaet_demande_avis'::regclass,
                   'public.demarche_pcaet_avis'::regclass)),
    true,
    'le RLS est activé sur les deux tables du module'
);

select is(
    (select count(*)::int from pg_policies
     where schemaname = 'public'
       and tablename in ('demarche_pcaet_demande_avis', 'demarche_pcaet_avis')),
    0,
    'aucune policy n''expose les tables du module'
);

set local role authenticated;
select is_empty(
    'select * from demarche_pcaet_demande_avis',
    'le rôle API authenticated ne lit aucune demande d''avis'
);
reset role;

select * from finish();
rollback;
