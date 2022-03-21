create extension if not exists pgtap with schema extensions;

begin;

select plan(7);

select has_table('reponse_choix');
select has_table('reponse_binaire');
select has_table('reponse_proportion');
select has_function('save_reponse');

do
$$
    declare
        reponse json;
    begin
        reponse = '{
          "question_id": "energie_1",
          "collectivite_id": 1,
          "reponse": 0.6
        }'::json;
        perform save_reponse(reponse);
    end
$$ language plpgsql;
select results_eq('select reponse from reponse_proportion where collectivite_id = 1 and question_id = ''energie_1'';',
                  'select 0.6::double precision as reponse',
                  'Reponse proportion should exist');



do
$$
    declare
        reponse json;
    begin
        reponse = '{
          "question_id": "dechets_1",
          "collectivite_id": 1,
          "reponse": true
        }'::json;
        perform save_reponse(reponse);
    end
$$ language plpgsql;
select results_eq('select reponse from reponse_binaire where collectivite_id = 1 and question_id = ''dechets_1'';',
                  'select true as reponse',
                  'Reponse binaire should exist');



do
$$
    declare
        reponse json;
    begin
        reponse = '{
          "question_id": "mobilite_1",
          "collectivite_id": 1,
          "reponse": "mobilite_1_b"
        }'::json;
        perform save_reponse(reponse);
    end
$$ language plpgsql;
select results_eq('select reponse from reponse_choix where collectivite_id = 1 and question_id = ''mobilite_1'';',
                  'select ''mobilite_1_b''::choix_id as reponse',
                  'Reponse binaire should exist');

rollback;

