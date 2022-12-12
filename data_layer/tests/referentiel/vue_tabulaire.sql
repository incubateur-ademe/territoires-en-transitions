begin;
select plan(2);
select test_enable_fake_score_generation();

truncate action_statut;
truncate client_scores;

create temporary table statut_sequence
(
    collectivite_id     integer    not null,
    action_id           action_id  not null,
    avancement          avancement not null,
    avancement_detaille numeric[] default null,
    concerne            boolean   default true
) on commit drop;

create function
    insert_sequence()
    returns void
begin
    atomic
    insert into action_statut (collectivite_id, action_id, avancement, avancement_detaille, concerne)
    select s.*
    from statut_sequence s
    on conflict (collectivite_id, action_id) do update set avancement = excluded.avancement;
end;

select test.identify_as('yolo@dodo.com');

insert into statut_sequence
values (2, 'eci_1.1.1.1', 'fait', null),
       (2, 'eci_1.1.2.1', 'programme', null),
       (2, 'eci_1.1.3.1', 'pas_fait', null),
       (2, 'eci_1.1.4.1', 'detaille', '{ 0.2, 0.7, 0.1}'),

       -- les actions réglementaires qui comptent pour zéro points.
       (2, 'eci_2.1.0', 'fait', null),
       (2, 'eci_2.2.0', 'programme', null),
       (2, 'eci_2.3.0', 'pas_fait', null),
       (2, 'eci_2.4.0', 'detaille', '{ 0.2, 0.7, 0.1}')
;
select insert_sequence();

-- teste la vue action_statuts dont les statuts sont _récupérés_ de la table action_statut.
select bag_eq(
               'select s.avancement, s.avancement_detaille from action_statuts s join statut_sequence using (action_id) where s.collectivite_id = 2;',
               'select avancement, avancement_detaille from statut_sequence;',
               'Les statuts de la vue devraient être les même que ceux insérés'
           );

-- teste la fonction private.collectivite_scores dont les statuts sont _reconstitués_ à partir des scores.
--- on teste ici toute la chaîne
--- insertion de statuts -> faux calcul de score -> conversion en action_score -> conversion en tabular_score
select bag_eq(
               'select action_id, fn.avancement from private.collectivite_scores(2, ''eci'') fn join statut_sequence using (action_id);',
               'select action_id, avancement from statut_sequence;',
               'Les scores de la collectivité devraient correspondre aux statuts insérés.'
           );

rollback;
