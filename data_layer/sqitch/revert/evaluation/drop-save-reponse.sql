-- Revert tet:evaluation/drop-save-reponse from pg

BEGIN;

CREATE OR REPLACE FUNCTION public.save_reponse(jsonarg json)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
    qt                  question_type;
    arg_question_id     question_id;
    arg_collectivite_id integer;
    arg_reponse         text;
begin
    select $1 ->> 'question_id' into arg_question_id;
    select $1 ->> 'collectivite_id' into arg_collectivite_id;
    select $1 ->> 'reponse' into arg_reponse;

    if have_lecture_acces(arg_collectivite_id) or private.est_auditeur(arg_collectivite_id) then
        select type
        into qt
        from question
        where id = arg_question_id;

        if qt = 'binaire'
        then
            insert into reponse_binaire (collectivite_id, question_id, reponse)
            select arg_collectivite_id, arg_question_id, arg_reponse::boolean
            on conflict (collectivite_id, question_id) do update
                set reponse = arg_reponse::boolean;
        elsif qt = 'proportion'
        then
            insert into reponse_proportion(collectivite_id, question_id, reponse)
            select arg_collectivite_id, arg_question_id, arg_reponse::double precision
            on conflict (collectivite_id, question_id) do update
                set reponse = arg_reponse::double precision;
        elsif qt = 'choix'
        then
            insert into reponse_choix(collectivite_id, question_id, reponse)
            select arg_collectivite_id, arg_question_id, arg_reponse::choix_id
            on conflict (collectivite_id, question_id) do update
                set reponse = arg_reponse::choix_id;
        else
            raise exception 'La question % n''existe pas', arg_question_id;
        end if;
    else
        perform set_config('response.status', '401', true);
        raise 'Accès non autorisé.';
    end if;
end
$function$
;

COMMIT;
