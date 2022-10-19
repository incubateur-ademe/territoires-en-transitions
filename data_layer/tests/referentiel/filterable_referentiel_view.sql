begin;
select plan(7);
select has_view('action_statuts');
select test.disable_evaluation_api();

truncate action_statut;
truncate client_scores;
-- fixme: tests are ran as if no scores where written, we should write fake scores using utilities from labellisation.

select set_eq(
               'select distinct type from action_statuts where collectivite_id = 1 and depth >= 3;',
               'select unnest(''{action, tache, sous-action}''::action_type[])',
               'When action statuts are filtered by depth >=3 only action, tache, sous-action should be in the results'
           );

insert into action_statut(collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
values (1, 'cae_1.1.1.1.1', 'fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
       (1, 'cae_1.1.1.1.2', 'pas_fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9')
;

select results_eq(
               'select avancement_descendants from action_statuts where collectivite_id = 1 and action_id = ''cae''',
               'select ''{fait,pas_fait}''::avancement[]',
               'Avancement of cae descendants should contain both non renseigné and avancement from data'
           );

select results_eq(
               'select avancement_descendants from action_statuts where collectivite_id = 1 and action_id = ''cae_1.1.1.1''',
               'select ''{fait,pas_fait}''::avancement[]',
               'Avancement of cae_1.1.1.1 should contain avancement from data as all of its children have avancements'
           );

select results_eq(
               'select avancement_descendants from action_statuts '
                   'where collectivite_id = 1 and action_id = ''cae_1.1.1.1.1''',
               'select ''{}''::avancement[]',
               'Avancement of cae_1.1.1.1.1 should have no descendants avancement at all as it is a leaf.'
           );


insert into action_statut(collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
values (1, 'eci_1.1.1.1', 'pas_fait', null, false, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9')
;

select ok((select not non_concerne
           from action_statuts
           where collectivite_id = 1
             and action_id = 'eci_1.1.2'),
          'Non concerne should be false when there is no descendent data');

select ok((select non_concerne
           from action_statuts
           where collectivite_id = 1
             and action_id = 'eci_1.1.1'),
          'Non concerne should be true when a child is non concerne');

rollback;
