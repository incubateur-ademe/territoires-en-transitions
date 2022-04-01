create extension if not exists pgtap with schema extensions;

begin;

select plan(5);

select has_table('personnalisation');
select has_table('personnalisation_regle');
select has_function('business_upsert_personnalisations');

-- override is_service_role to run business_upsert_personnalisations as service.
create or replace function is_service_role() returns bool as
$$
select True;
$$ language sql stable;

-- insert a personnalisation
do
$$
    declare
        personnalisation json;
    begin
        personnalisation = '
        {
          "action_id": "eci_1",
          "titre": "Yolo ?",
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
        }
        '::json;
        perform business_upsert_personnalisations(array [personnalisation]);
    end
$$ language plpgsql;


select results_eq('select titre from personnalisation where action_id = ''eci_1'';',
                  'select ''Yolo ?''',
                  'Personnalisation Yolo should be present');

select results_eq('select count(*)::int as count from personnalisation_regle where action_id = ''eci_1'';',
                  'select 2::int as count;',
                  'Two règles should be present');
rollback;

