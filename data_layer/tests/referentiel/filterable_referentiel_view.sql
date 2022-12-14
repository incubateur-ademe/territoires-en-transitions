begin;
select plan(7);
select has_view('action_statuts');
select test.disable_evaluation_api();

truncate action_statut;
truncate client_scores;

-- insert des faux scores pour cae
insert into client_scores (collectivite_id, referentiel, scores, modified_at, payload_timestamp)
select 1, 'cae', fake, now(), now()
from test_generate_fake_scores(1, 'cae', '{}') as  fake;


select set_eq(
               'select distinct type from action_statuts where collectivite_id = 1 and depth >= 3;',
               'select unnest(''{action, tache, sous-action}''::action_type[])',
               'Quand les actions sont filtrées avec depth >=3 seuls les types action, tache, sous-action devraient être dans les résultats'
           );

select test_enable_fake_score_generation();

insert into action_statut(collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
values (1, 'cae_1.1.1.1.1', 'fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
       (1, 'cae_1.1.1.1.2', 'pas_fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');

select results_eq(
               'select avancement_descendants from action_statuts where collectivite_id = 1 and action_id = ''cae''',
               'select ''{non_renseigne,fait,pas_fait}''::avancement[]',
               'L''avancement des descendant de cae devraient contenir non renseigné et l''avancement'
           );

select results_eq(
               'select avancement_descendants from action_statuts where collectivite_id = 1 and action_id = ''cae_1.1.1.1''',
               'select ''{fait,pas_fait}''::avancement[]',
               'L''avancement de cae_1.1.1.1 devrait contenir son avancement ainsi que celui de ces enfants.'
           );

select results_eq(
               'select avancement_descendants from action_statuts '
                   'where collectivite_id = 1 and action_id = ''cae_1.1.1.1.1''',
               'select ''{}''::avancement[]',
               'L''avancement de cae_1.1.1.1.1 ne devrait pas contenir des descendant car c''est une tâche.'
           );


insert into action_statut(collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
values (1, 'eci_1.1.1.1', 'pas_fait', null, false, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9')
;

select ok((select not non_concerne
           from action_statuts
           where collectivite_id = 1
             and action_id = 'eci_1.1.2'),
          'Non concerne devrait être faux quand il n''y a pas d''enfant non concerné.');

select ok((select non_concerne
           from action_statuts
           where collectivite_id = 1
             and action_id = 'eci_1.1.1'),
          'Non concerne devrait être vrai quand les enfants sont non-concerne.');

rollback;
