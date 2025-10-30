-- Revert tet:plan_action/drop_create_fiche from pg

BEGIN;

CREATE OR REPLACE FUNCTION public.create_fiche(collectivite_id integer, axe_id integer DEFAULT NULL::integer, action_id action_id DEFAULT NULL::character varying, indicateur_id integer DEFAULT NULL::integer)
 RETURNS fiche_resume
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    new_fiche_id int;
    resume       fiche_resume;
begin
    if not have_edition_acces(create_fiche.collectivite_id) and not is_service_role()
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    insert into fiche_action (collectivite_id, titre)
    values (create_fiche.collectivite_id, '')
    returning id into new_fiche_id;

    if create_fiche.axe_id is not null
    then
        insert into fiche_action_axe (fiche_id, axe_id)
        values (new_fiche_id, create_fiche.axe_id);
    end if;

    if create_fiche.action_id is not null
    then
        insert into fiche_action_action (fiche_id, action_id)
        values (new_fiche_id, create_fiche.action_id);
    end if;

    if create_fiche.indicateur_id is not null
    then
        insert into fiche_action_indicateur (fiche_id, indicateur_id)
        values (new_fiche_id, create_fiche.indicateur_id);
    end if;

    select * from fiche_resume where id = new_fiche_id limit 1 into resume;
    return resume;
end;
$function$
;

COMMENT ON FUNCTION public.create_fiche(int4, int4, action_id, int4) IS 'Crée une nouvelle fiche action dans un axe, une action ou un indicateur.';

-- Permissions
ALTER FUNCTION public.create_fiche(int4, int4, action_id, int4) OWNER TO postgres;
GRANT ALL ON FUNCTION public.create_fiche(int4, int4, action_id, int4) TO public;
GRANT ALL ON FUNCTION public.create_fiche(int4, int4, action_id, int4) TO postgres;
GRANT ALL ON FUNCTION public.create_fiche(int4, int4, action_id, int4) TO anon;
GRANT ALL ON FUNCTION public.create_fiche(int4, int4, action_id, int4) TO authenticated;
GRANT ALL ON FUNCTION public.create_fiche(int4, int4, action_id, int4) TO service_role;

COMMIT;
