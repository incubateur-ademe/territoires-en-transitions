create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

select has_table('question_thematique');
select has_table('question');
select has_table('question_choix');
select has_table('question_action');
select has_function('business_upsert_questions');


insert into question_thematique
values ('mobilites', 'Mobilités')
on conflict do nothing;

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

-- fix me broken test
select results_eq('select count(*)::int as count from question;',
                  'select 1::int as count;',
                  'One question should be inserted');

select results_eq('select count(*)::int as count from question_choix;',
                  'select 2::int as count;',
                  'Two choix should be inserted');

select results_eq('select count(*)::int as count from question_action;',
                  'select 1::int as count;',
                  'One question to action relation should be inserted');
rollback;

