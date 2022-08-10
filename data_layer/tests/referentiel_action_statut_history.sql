begin;
select plan(2);

drop trigger if exists set_modified_at_action_statut_update on action_statut;

truncate action_statut;
truncate history.action_statut;
select test.identify_as('yolo@dodo.com');

insert into action_statut(collectivite_id, action_id, avancement, concerne, modified_at)
values (1, 'cae_1.1.1.1.1', 'fait', true, '2022-09-09');


select test.identify_as('yili@didi.com');
insert into action_statut(collectivite_id, action_id, avancement, concerne, modified_at)
values (1, 'cae_1.1.1.1.1', 'programme', true, '2022-09-10')
on conflict (collectivite_id, action_id)
    do update set avancement  = excluded.avancement,
                  modified_by = excluded.modified_by,
                  modified_at = excluded.modified_at;

select ok((select count(*) = 2 from history.action_statut));


select *
into expected_history
from historical_action_statut
where false;
insert into expected_history (tache_id, action_id, tache_identifiant, tache_nom, action_identifiant, action_nom,
                              collectivite_id, avancement, previous_avancement, avancement_detaille,
                              previous_avancement_detaille, concerne, previous_concerne, modified_by_id, modified_at, modified_by_nom)
values ('cae_1.1.1.1.1', 'cae_1.1.1', '1.1.1.1.1',
        'Formaliser une vision et des engagements dans une décision de politique générale (délibération)', '1.1.1',
        'Définir la vision, les objectifs et la stratégie Climat-Air-Énergie', 1, 'programme', 'fait', null, null, true,
        true, '3f407fc6-3634-45ff-a988-301e9088096a', '2022-09-10 00:00:00.000000 +00:00', 'Yili Didi'),
       ('cae_1.1.1.1.1', 'cae_1.1.1', '1.1.1.1.1',
        'Formaliser une vision et des engagements dans une décision de politique générale (délibération)', '1.1.1',
        'Définir la vision, les objectifs et la stratégie Climat-Air-Énergie', 1, 'fait', null, null, null, true, null,
        '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', '2022-09-09 00:00:00.000000 +00:00', 'Yolo Dodo');

select set_eq('select * from historical_action_statut',
              'select * from expected_history',
              'L''historique doit être égale à la version prévue.');

rollback;
