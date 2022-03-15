create extension if not exists pgtap with schema extensions;

begin;

select plan(5);

select has_table('personnalisation');
select has_table('personnalisation_regle');
select has_function('business_upsert_personnalisations');

do
$$
    declare
        personnalisation json;
    begin
        personnalisation = '{
          "action_id": "eci_1.1.1",
          "titre": "Yoloo",
          "description": "....",
          "regles": [
            {
              "formule": "yo(lo)",
              "type": "reduction",
              "description": "yolo"
            },
            {
              "formule": "yo(no)",
              "type": "desactivation",
              "description": "yono"
            }
          ]
        }'::json;
        perform business_upsert_personnalisations(array [personnalisation]);
    end

$$ language plpgsql;


select results_eq('select count(*)::int as count from personnalisation;',
                  'select 1::int as count;',
                  'One personnalisation should  be inserted');

select results_eq('select count(*)::int as count from personnalisation_regle;',
                  'select 2::int as count;',
                  'Two règles should be inserted');
rollback;

