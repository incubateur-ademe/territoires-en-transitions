begin;
select plan(18);

-- Codes de région à deux lettres : les dix-huit codes réels sont numériques et
-- tous occupés par l'import des services (collectivite/service_etat_import), qui
-- pose une DREAL et une DR ADEME sur chacun.

create temp table ctx (
    dreal_id integer,
    dr_ademe_id integer,
    national_id integer,
    epci_id integer,
    demarche_id integer,
    demande_id integer
) on commit drop;

with d as (
    insert into collectivite (nom, type, region_code)
    values ('DREAL test pgTAP', 'dreal', 'ZC')
    returning id
)
insert into ctx (dreal_id) select id from d;

with a as (
    insert into collectivite (nom, type, region_code)
    values ('DR ADEME test pgTAP', 'dr_ademe', 'ZC')
    returning id
)
update ctx set dr_ademe_id = (select id from a);

with n as (
    insert into collectivite (nom, type)
    values ('Service national test pgTAP', 'service_national')
    returning id
)
update ctx set national_id = (select id from n);

-- Un EPCI qui ne porte aucune démarche PCAET : `demarche_active_unique` en
-- interdit une seconde, et le seed en pose déjà sur des collectivités de test.
-- L'`order by` rend le choix reproductible, là où `limit 1` seul dépendait de
-- l'ordre physique des lignes.
update ctx set epci_id = (
    select c.id from collectivite c
    where c.type = 'epci'
      and not exists (
          select 1 from demarche d
          where d.collectivite_id = c.id and d.type = 'pcaet'
      )
    order by c.id
    limit 1
);

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

-- Les familles en lecture seule entrent dans la transmission, jamais parmi les
-- émetteurs d'avis.
select lives_ok(
    $$ insert into demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source)
       select demarche_id, dr_ademe_id, 'seed' from ctx $$,
    'une demande d''avis visant une dr ademe est acceptée'
);

select lives_ok(
    $$ insert into demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source)
       select demarche_id, national_id, 'seed' from ctx $$,
    'une demande d''avis visant un service national est acceptée'
);

select throws_ok(
    $$ insert into demarche_pcaet_avis (demande_avis_id, emetteur_collectivite_id, au_titre_de, sens)
       select d.id, ctx.dr_ademe_id, 'prefet_region', 'favorable'
       from ctx join demarche_pcaet_demande_avis d
         on d.demarche_id = ctx.demarche_id
        and d.instructeur_collectivite_id = ctx.dr_ademe_id $$,
    'P0001',
    null,
    'un avis émis par une dr ademe est refusé'
);

select throws_ok(
    $$ insert into demarche_pcaet_avis (demande_avis_id, emetteur_collectivite_id, au_titre_de, sens)
       select d.id, ctx.national_id, 'prefet_region', 'favorable'
       from ctx join demarche_pcaet_demande_avis d
         on d.demarche_id = ctx.demarche_id
        and d.instructeur_collectivite_id = ctx.national_id $$,
    'P0001',
    null,
    'un avis émis par un service national est refusé'
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
