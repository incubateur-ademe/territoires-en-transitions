begin;
select plan(27);

-- Enlève les triggers pour tester le debounce - sinon les modified_at sont toujours égaux à now().
drop trigger set_modified_at_before_reponse_proportion_update on reponse_proportion;
drop trigger set_modified_at_before_reponse_choix_update on reponse_choix;
drop trigger set_modified_at_before_reponse_binaire_update on reponse_binaire;

-- Fonction utilitaire pour upsert des réponses de tout type.
create function test.upsert_reponse(
    type question_type,
    collectivite_id integer,
    question_id question_id,
    reponse anyelement,
    modified_at timestamptz
) returns void
as
$$
begin
    -- on utilise execute pour permettre le polymorphisme.
    execute format(
            'insert into %I (collectivite_id, question_id, reponse, modified_at) '
                'values (%L, %L, %L, %L) '
                '  on conflict (collectivite_id, question_id)'
                '     do update set reponse     = excluded.reponse,'
                '                   modified_at = excluded.modified_at;',
            'reponse_' || type,
            collectivite_id,
            question_id,
            reponse,
            modified_at
        );
end;
$$ language plpgsql;

-- Les séquences des réponses à sauvegarder.
create table test.sequence_proportion
(
    question_id question_id,
    reponse     float,
    modified_at timestamptz
);
create table test.sequence_choix
(
    question_id question_id,
    reponse     choix_id,
    modified_at timestamptz
);
create table test.sequence_binaire
(
    question_id question_id,
    reponse     bool,
    modified_at timestamptz
);


-- Supprime les données avant un scénario.
create function
    test.clear()
    returns void
as
$$
truncate reponse_proportion;
truncate reponse_choix;
truncate reponse_binaire;
truncate test.sequence_proportion;
truncate test.sequence_choix;
truncate test.sequence_binaire;
select test_clear_history();
$$ language sql;


-- Scenario : Yolo met à jour des réponses
select test.clear();
select test.identify_as('yolo@dodo.com');

-- Réponses de type proportion
--- On définit la séquence
insert into test.sequence_proportion
values -- un jour à quelques minutes d'intervalle
       ('dev_eco_2', 0.1, '2022-09-10 06:02 +0'),
       ('dev_eco_2', 0.2, '2022-09-10 06:03 +0'),
       ('dev_eco_2', 0.3, '2022-09-10 06:04 +0'),
       -- puis le lendemain
       ('dev_eco_2', 0.8, '2022-09-11 08:00 +0');

--- On joue la séquence.
select test.upsert_reponse('proportion', 1, question_id, reponse, modified_at)
from test.sequence_proportion;

--- On vérifie l'état.
select results_eq(
           -- les réponses
               'select question_id, reponse, modified_at from reponse_proportion;',
           -- la réponse la plus récente de la séquence
               'select question_id, reponse, modified_at from test.sequence_proportion order by modified_at desc limit 1;',
               'Les réponses devraient contenir uniquement la réponse la plus récente.'
           );

select bag_eq(
           -- la vue historique des réponses
               'select question_id, reponse, modified_at, modified_by from historique.reponse_proportion_display;',
           -- les deux réponses les plus récentes de la séquence
               'select question_id, reponse, modified_at, auth.uid() from test.sequence_proportion order by modified_at desc limit 2;',
               'L''historique devrait contenir uniquement les deux dernières réponses.'
           );

select results_eq(
           -- la vue historique
               'select previous_reponse, reponse, previous_modified_by, modified_by
                from historique.reponse_proportion_display',
           -- une query fenêtrée
               'select lag(reponse) over w     as previous_reponse,
                       reponse,
                       lag(modified_by) over w as previous_modified_by,
                       modified_by             as modified_by
               from historique.reponse_proportion
                    -- la fenêtre des deux lignes adjacentes de la plus ancienne à la plus récente.
                   window w as (order by modified_at rows between 1 preceding and current row)
               order by modified_at desc;',
               'La vue historique devrait être égale à la query fenêtrée sur l''historique.'
           );


--- On vérifie que la vue historique des réponses.
select bag_eq(
               'select collectivite_id,
                      question_id,
                      to_jsonb(reponse) as reponse,
                      to_jsonb(previous_reponse) as previous_reponse,
                      modified_at,
                      previous_modified_at,
                      modified_by,
                      previous_modified_by
               from historique.reponse_proportion_display;',
               'select collectivite_id,
                      question_id,
                      reponse,
                      previous_reponse,
                      modified_at,
                      previous_modified_at,
                      modified_by,
                      previous_modified_by
               from historique.reponse_display where question_type = ''proportion'';',
               'La vue historique des réponses devrait contenir l''historique des réponses de type *proportion*');


-- Réponses de type choix
--- On définit la séquence
insert into test.sequence_choix
values -- un jour à quelques minutes d'intervalle
       ('voirie_1', 'voirie_1_a', '2022-09-11 06:02 +0'),
       ('voirie_1', null, '2022-09-11 06:03 +0'),
       ('voirie_1', 'voirie_1_b', '2022-09-11 06:04 +0'),
       -- puis le lendemain
       ('voirie_1', 'voirie_1_c', '2022-09-12 08:00 +0');

--- On joue la séquence.
select test.upsert_reponse('choix', 1, question_id, reponse, modified_at)
from test.sequence_choix;

--- On vérifie l'état.
select results_eq(
           -- les réponses
               'select question_id, reponse, modified_at from reponse_choix;',
           -- la réponse la plus récente de la séquence
               'select question_id, reponse, modified_at from test.sequence_choix order by modified_at desc limit 1;',
               'Les réponses devraient contenir uniquement la réponse la plus récente.'
           );

select bag_eq(
           -- la vue historique des réponses
               'select question_id, reponse, modified_at, modified_by from historique.reponse_choix_display;',
           -- les deux réponses les plus récentes de la séquence
               'select question_id, reponse, modified_at, auth.uid() from test.sequence_choix order by modified_at desc limit 2;',
               'L''historique devrait contenir uniquement les deux dernières réponses.'
           );

select results_eq(
           -- la vue historique
               'select previous_reponse, reponse, previous_modified_by, modified_by
                from historique.reponse_choix_display',
           -- une query fenêtrée
               'select lag(reponse) over w     as previous_reponse,
                       reponse,
                       lag(modified_by) over w as previous_modified_by,
                       modified_by             as modified_by
               from historique.reponse_choix_display
                    -- la fenêtre des deux lignes adjacentes de la plus ancienne à la plus récente.
                   window w as (order by modified_at rows between 1 preceding and current row)
               order by modified_at desc;',
               'La vue historique devrait être égale à la query fenêtrée sur l''historique.'
           );

--- On vérifie que la vue historique des réponses.
select bag_eq(
               'select collectivite_id,
                      question_id,
                      reponse,
                      previous_reponse,
                      modified_at,
                      previous_modified_at,
                      modified_by,
                      previous_modified_by
               from historique.reponse_display where question_type = ''choix'';',
               'select collectivite_id,
                      h.question_id,
                      to_jsonb(c.formulation) as reponse,
                      to_jsonb(pc.formulation) as previous_reponse,
                      modified_at,
                      previous_modified_at,
                      modified_by,
                      previous_modified_by
               from historique.reponse_choix_display h
               left join question_choix c on c.id = h.reponse
               left join question_choix pc on pc.id = h.previous_reponse;',
               'La vue historique des réponses devrait contenir l''historique des réponses de type *choix* avec les formulations');


-- Réponses de type binaire (oui/non)
--- On définit la séquence
insert into test.sequence_binaire
values -- un jour à quelques minutes d'intervalle
       ('dechets_1', true, '2022-09-13 06:02 +0'),
       ('dechets_1', false, '2022-09-13 06:03 +0'),
       ('dechets_1', true, '2022-09-13 06:04 +0'),
       -- puis le lendemain
       ('dechets_1', false, '2022-09-14 08:00 +0');

--- On joue la séquence.
select test.upsert_reponse('binaire', 1, question_id, reponse, modified_at)
from test.sequence_binaire;

--- On vérifie l'état.
select results_eq(
           -- les réponses
               'select question_id, reponse, modified_at from reponse_binaire;',
           -- la réponse la plus récente de la séquence
               'select question_id, reponse, modified_at from test.sequence_binaire order by modified_at desc limit 1;',
               'Les réponses devraient contenir uniquement la réponse la plus récente.'
           );

select bag_eq(
           -- la vue historique des réponses
               'select question_id, reponse, modified_at, modified_by from historique.reponse_binaire_display;',
           -- les deux réponses les plus récentes de la séquence
               'select question_id, reponse, modified_at, auth.uid() from test.sequence_binaire order by modified_at desc limit 2;',
               'L''historique devrait contenir uniquement les deux dernières réponses.'
           );

select results_eq(
           -- la vue historique
               'select previous_reponse, reponse, previous_modified_by, modified_by
                from historique.reponse_binaire_display',
           -- une query fenêtrée
               'select lag(reponse) over w     as previous_reponse,
                       reponse,
                       lag(modified_by) over w as previous_modified_by,
                       modified_by             as modified_by
               from historique.reponse_binaire_display
                    -- la fenêtre des deux lignes adjacentes de la plus ancienne à la plus récente.
                   window w as (order by modified_at rows between 1 preceding and current row)
               order by modified_at desc;',
               'La vue historique devrait être égale à la query fenêtrée sur l''historique.'
           );

--- On vérifie que la vue historique des réponses.
select bag_eq(
               'select collectivite_id,
                      question_id,
                      to_jsonb(reponse) as reponse,
                      to_jsonb(previous_reponse) as previous_reponse,
                      modified_at,
                      previous_modified_at,
                      modified_by,
                      previous_modified_by
               from historique.reponse_binaire_display;',
               'select collectivite_id,
                      question_id,
                      reponse,
                      previous_reponse,
                      modified_at,
                      previous_modified_at,
                      modified_by,
                      previous_modified_by
               from historique.reponse_display where question_type = ''binaire'';',
               'La vue historique des réponses devrait contenir l''historique des réponses de type *binaire*');

-- On vérifie la vue historique utilisée par le client.
select bag_eq(
           -- la vue de historique de la collectivité
               'select question_type,
                      collectivite_id,
                      question_id,
                      reponse,
                      previous_reponse,
                      modified_at,
                      previous_modified_at,
                      modified_by_id,
                      previous_modified_by_id
               from historique
               where type = ''reponse'';',
           -- la vue de l'historique des réponses
               'select question_type,
                      collectivite_id,
                      question_id,
                      reponse,
                      previous_reponse,
                      modified_at,
                      previous_modified_at,
                      modified_by,
                      previous_modified_by
               from historique.reponse_display ;',
               'L''historique global devrait contenir l''historique des réponses.'
           );


-- Scenario : Yolo puis Yili mettent à jour des réponses de type proportion.
select test.clear();
insert into test.sequence_proportion
values -- à quelques minutes d'intervalle
       ('voirie_1', 0.1, '2022-09-10 06:02 +0'),
       ('voirie_1', 0.2, '2022-09-10 06:03 +0'),
       ('voirie_1', 0.4, '2022-09-10 06:04 +0'),
       ('voirie_1', 0.5, '2022-09-10 06:05 +0');

-- Yolo réponds deux fois.
select test.identify_as('yolo@dodo.com');
select test.upsert_reponse('proportion', 1, question_id, reponse, modified_at)
from test.sequence_proportion
limit 2;

-- Puis Yili réponds deux fois.
select test.identify_as('yili@didi.com');
select test.upsert_reponse('proportion', 1, question_id, reponse, modified_at)
from test.sequence_proportion
limit 2 offset 2;

-- On vérifie les résultats.
select ok((select count(*) = 1 from reponse_proportion), 'Il devrait y avoir une seule réponse.');
select ok((select count(*) = 2 from historique.reponse_proportion), 'Il devrait y avoir deux réponses historisées.');
select isnt((select modified_by from historique.reponse_proportion limit 1),
            (select modified_by from historique.reponse_proportion limit 1 offset 1),
            'Les deux réponses historisées devraient avoir des `modified_by` différents.');
select is((select array_agg(modified_by_nom) from historique),
          (select array ['Yili Didi', 'Yolo Dodo']),
          'La vue client devrait lister une modification par Yili suivie d''une par Yolo');


-- Scenario : Yolo puis Yili mettent à jour des réponses de type choix.
select test.clear();
insert into test.sequence_choix
values -- à quelques minutes d'intervalle
       ('voirie_1', 'voirie_1_a', '2022-09-10 06:02 +0'),
       ('voirie_1', null, '2022-09-10 06:03 +0'),
       ('voirie_1', 'voirie_1_b', '2022-09-10 06:04 +0'),
       ('voirie_1', 'voirie_1_b', '2022-09-10 06:05 +0');


-- Yolo réponds deux fois.
select test.identify_as('yolo@dodo.com');
select test.upsert_reponse('choix', 1, question_id, reponse, modified_at)
from test.sequence_choix
limit 2;

-- Puis Yili réponds deux fois.
select test.identify_as('yili@didi.com');
select test.upsert_reponse('choix', 1, question_id, reponse, modified_at)
from test.sequence_choix
limit 2 offset 2;

-- On vérifie les résultats.
select ok((select count(*) = 1 from reponse_choix), 'Il devrait y avoir une seule réponse.');
select ok((select count(*) = 2 from historique.reponse_choix), 'Il devrait y avoir deux réponses historisées.');
select isnt((select modified_by from historique.reponse_choix limit 1),
            (select modified_by from historique.reponse_choix limit 1 offset 1),
            'Les deux réponses historisées devraient avoir des `modified_by` différents.');
select is((select array_agg(modified_by_nom) from historique),
          (select array ['Yili Didi', 'Yolo Dodo']),
          'La vue client devrait lister une modification par Yili suivie d''une par Yolo');


-- Scenario : Yolo puis Yili mettent à jour des réponses de type binaire (oui/non).
select test.clear();
insert into test.sequence_binaire
values -- à quelques minutes d'intervalle
       ('dechets_1', false, '2022-09-10 06:02 +0'),
       ('dechets_1', null, '2022-09-10 06:03 +0'),
       ('dechets_1', false, '2022-09-10 06:04 +0'),
       ('dechets_1', true, '2022-09-10 06:05 +0');


-- Yolo réponds deux fois.
select test.identify_as('yolo@dodo.com');
select test.upsert_reponse('binaire', 1, question_id, reponse, modified_at)
from test.sequence_binaire
limit 2;

-- Puis Yili réponds deux fois.
select test.identify_as('yili@didi.com');
select test.upsert_reponse('binaire', 1, question_id, reponse, modified_at)
from test.sequence_binaire
limit 2 offset 2;

-- On vérifie les résultats.
select ok((select count(*) = 1 from reponse_binaire), 'Il devrait y avoir une seule réponse.');
select ok((select count(*) = 2 from historique.reponse_binaire), 'Il devrait y avoir deux réponses historisées.');
select isnt((select modified_by from historique.reponse_binaire limit 1),
            (select modified_by from historique.reponse_binaire limit 1 offset 1),
            'Les deux réponses historisées devraient avoir des `modified_by` différents.');
select is((select array_agg(modified_by_nom) from historique),
          (select array ['Yili Didi', 'Yolo Dodo']),
          'La vue client devrait lister une modification par Yili suivie d''une par Yolo');


-- Scénario Yolo mets à jour plusieurs réponses de même type.
select test.clear();
select test.identify_as('yolo@dodo.com');

--- On définit la séquence
insert into test.sequence_binaire
values -- un jour à quelques minutes d'intervalle
       ('AOD_elec', false, '2022-09-13 06:02 +0'),
       ('AOD_gaz', false, '2022-09-13 06:03 +0'),
       ('AOD_chaleur', true, '2022-09-13 06:04 +0');

--- On joue la séquence.
select test.upsert_reponse('binaire', 1, question_id, reponse, modified_at)
from test.sequence_binaire;

--- On vérifie l'historique
select bag_eq(
               'select modified_at, collectivite_id, question_id, to_jsonb(reponse) from reponse_binaire;',
               'select modified_at, collectivite_id, question_id, reponse from historique.reponse_display;',
               'Toutes les réponses devraient être dans l''historique'
           );


-- Scénario Yolo réponds à une question qui concerne plusieurs actions.
select test.clear();
select test.identify_as('yolo@dodo.com');

insert into test.sequence_proportion
values ('habitat_2', 0.1, '2022-09-10 06:02 +0');

select test.upsert_reponse('proportion', 1, question_id, reponse, modified_at)
from test.sequence_proportion;

select bag_eq(
               'select unnest(action_ids) as action_id from historique where type = ''reponse'';',
               'select action_id from test.sequence_proportion s join question_action qa on qa.question_id = s.question_id;',
               'Les ids actions de la réponse historisée devraient être les mêmes que ceux liés à la question.'
           );

rollback;
