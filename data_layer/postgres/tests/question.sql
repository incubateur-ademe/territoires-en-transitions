create extension if not exists pgtap with schema extensions;

begin;

select plan(10);

select has_table('question_thematique');
select has_table('question');
select has_table('question_choix');
select has_table('question_action');
select has_function('business_upsert_questions');


-- override is_service_role to run business_upsert_questions as service.
create or replace function is_service_role() returns bool as
$$
select True;
$$ language sql stable;

-- insert a personnalisation
do
$$
    declare
        question json;
    begin
        question = '{
          "id": "question_1",
          "formulation": "Est-ce que la collectivité est compétente en voirie ?",
          "description": "Une petite description",
          "ordonnancement": 0,
          "types_collectivites_concernees": [
            "commune"
          ],
          "thematique_id": "mobilite",
          "action_ids": [
            "eci_1"
          ],
          "type": "choix",
          "choix": [
            {
              "id": "question_a",
              "formulation": "Oui",
              "ordonnancement": 0
            },
            {
              "id": "question_b",
              "formulation": "Non",
              "ordonnancement": 1
            }
          ]
        }'::json;
        perform business_upsert_questions(array [question]);
    end

$$ language plpgsql;

-- test insertions
select results_eq('select description from question where id = ''question_1'';',
                  'select ''Une petite description'';',
                  'One question should be inserted');

select results_eq('select count(*)::int as count from question_choix where question_id = ''question_1'';',
                  'select 2::int as count;',
                  'Two choix should be inserted');

select results_eq('select count(*)::int as count from question_action where question_id = ''question_1'';',
                  'select 1::int as count;',
                  'One question to action relation should be inserted');

-- test views
select results_eq('select description from question_display where id = ''question_1'' and collectivite_id = 1;',
                  'select ''Une petite description'';',
                  'Question should be in question_display');

select ok((select have_questions from action_definition_summary where id = 'eci_1'),
          'Action eci_1 of action_definition_summary should have_questions');

rollback;

