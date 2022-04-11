begin;
select plan(11);

select has_view('question_thematique_completude');
select has_column('question_thematique_completude', 'collectivite_id');
select has_column('question_thematique_completude', 'id');
select has_column('question_thematique_completude', 'nom');
select has_column('question_thematique_completude', 'referentiels');
select has_column('question_thematique_completude', 'completude');

truncate reponse_binaire;
truncate reponse_proportion;
truncate reponse_choix;

select is_empty(
               'select * from question_thematique_completude where collectivite_id = 1 and completude = ''complete'';',
               'No thematique should be `complete`.'
           );

select results_eq(
               'select * from question_thematique_completude where collectivite_id = 1 and completude = ''a_completer'';',
               'select * from question_thematique_completude where collectivite_id = 1',
               'All thematiques should be `à completer`'
           );

select results_eq(
               'select * from question where id = ''dechets'' and type = ''binaire'';',
               'select * from question where id = ''dechets'';',
               'All questions `dechets` should be of type `binaire` for the test to work.'
           );

-- Insert all réponses for déchets
insert into reponse_binaire
select now(), 1, q.id, true
from question q
where q.thematique_id = 'dechets';

select ok(
               (select completude = 'complete'
                from question_thematique_completude
                where collectivite_id = 1
                  and id = 'dechets'),
               'Thematique `déchets` should be `complete`.'
           );

select ok(
               (select bool_and(completude = 'a_completer')
                from question_thematique_completude
                where collectivite_id = 1
                  and id != 'dechets'),
               'Thematiques other than `déchets` should be `à completer`.'
           );
rollback;
