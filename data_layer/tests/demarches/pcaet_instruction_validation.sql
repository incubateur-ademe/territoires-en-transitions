begin;
select plan(7);

create temp table ctx (
    dreal_id integer,
    epci_id integer,
    demarche_id integer,
    demande_id integer
) on commit drop;

with d as (
    insert into collectivite (nom, type, region_code)
    values ('DREAL test validation pgTAP', 'dreal', '94')
    returning id
)
insert into ctx (dreal_id) select id from d;

update ctx set epci_id = (
    select id from collectivite
    where type = 'epci'
      and id not in (
        select collectivite_id from demarche
        where type = 'pcaet'
          and status in ('en_elaboration', 'transmis_pour_avis')
      )
    limit 1
);

with dem as (
    insert into demarche (collectivite_id, type, titre)
    select epci_id, 'pcaet', 'Démarche PCAET test validation' from ctx
    returning id
)
update ctx set demarche_id = (select id from dem);

with da as (
    insert into demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source)
    select demarche_id, dreal_id, 'seed' from ctx
    returning id
)
update ctx set demande_id = (select id from da);

select lives_ok(
    $$ insert into demarche_pcaet_instruction_validation (demande_avis_id, partie)
       select demande_id, 'documents' from ctx $$,
    'valider la partie documents est accepté'
);

select throws_ok(
    $$ insert into demarche_pcaet_instruction_validation (demande_avis_id, partie)
       select demande_id, 'documents' from ctx $$,
    '23505',
    null,
    'valider deux fois la même partie est refusé'
);

select throws_ok(
    $$ insert into demarche_pcaet_instruction_validation (demande_avis_id, partie)
       select demande_id, 'contenu_libre' from ctx $$,
    '23514',
    null,
    'une partie hors des trois du parcours est refusée'
);

select lives_ok(
    $$ insert into demarche_pcaet_instruction_validation (demande_avis_id, partie)
       select demande_id, 'diagnostic' from ctx $$,
    'valider une autre partie de la même demande est accepté'
);

select is(
    (select count(*)::int from demarche_pcaet_instruction_validation
     where demande_avis_id = (select demande_id from ctx)),
    2,
    'la demande porte deux validations'
);

select lives_ok(
    $$ delete from demarche_pcaet_demande_avis where id = (select demande_id from ctx) $$,
    'supprimer la demande emporte ses validations (cascade)'
);

select is(
    (select count(*)::int from demarche_pcaet_instruction_validation
     where demande_avis_id = (select demande_id from ctx)),
    0,
    'les validations ont suivi la demande'
);

select * from finish();
rollback;
