begin;
select plan(13);
select test.disable_evaluation_api();

select has_view('question_thematique_completude');
select has_column('question_thematique_completude', 'collectivite_id');
select has_column('question_thematique_completude', 'id');
select has_column('question_thematique_completude', 'nom');
select has_column('question_thematique_completude', 'referentiels');
select has_column('question_thematique_completude', 'completude');

truncate reponse_binaire;
truncate reponse_proportion;
truncate reponse_choix;

select ok((select count(*) = 0
           from question_thematique_completude
           where referentiels is null),
          'No `referentiels` should be null`.'
           );

select ok((select bool_or(completude != 'complete')
           from question_thematique_completude
           where collectivite_id = 1),
          'No thematique should be `complete`.'
           );

select ok((select bool_and(completude = 'a_completer')
           from question_thematique_completude
           where collectivite_id = 1),
          'All thematiques should be `à completer`'
           );

select ok((select id = 'identite'
           from question_thematique_completude
           where collectivite_id = 1
           limit 1),
          'Thematique `identite` should be first.'
           );

select ok((select bool_and(type = 'binaire' or type = 'proportion')
           from question
           where thematique_id = 'dechets'),
          'For testing question `dechets` should either `binaire` or `proportion`'
           );


-- Insert all réponses for déchets
insert into reponse_binaire
select now(), 1, q.id, true
from question q
where q.thematique_id = 'dechets'
  and type = 'binaire'
  and (types_collectivites_concernees @> '{commune}' or types_collectivites_concernees is null);

insert into reponse_proportion
select now(), 1, q.id, 1.0
from question q
where q.thematique_id = 'dechets'
  and type = 'proportion'
  and (types_collectivites_concernees @> '{commune}' or types_collectivites_concernees is null);

select ok((select completude = 'complete'
           from question_thematique_completude
           where collectivite_id = 1
             and id = 'dechets'),
          'Thematique `déchets` should be `complete`.'
           );

select ok((select bool_and(completude = 'a_completer')
           from question_thematique_completude
           where collectivite_id = 1
             and id != 'dechets'),
          'Thematiques other than `déchets` should be `à completer`.'
           );

rollback;
