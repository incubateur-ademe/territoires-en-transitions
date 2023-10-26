-- Deploy tet:plan_action to pg

BEGIN;

create or replace function delete_axe_all(axe_id integer) returns void
    language plpgsql
    security definer
as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    facs         fiche_action[];
    fac          fiche_action;
begin
    if have_edition_acces((select collectivite_id from axe where id = delete_axe_all.axe_id))
           or is_service_role() then
        for pa_enfant_id in select pa.id from axe pa where pa.parent = delete_axe_all.axe_id
            loop
                execute delete_axe_all(pa_enfant_id);
            end loop;
        select array_agg(fa.*)
        from fiche_action fa
                 join fiche_action_axe faa on fa.id = faa.fiche_id
        where faa.axe_id = delete_axe_all.axe_id
        into facs;
        if facs is not null then
            foreach fac in array facs
                loop
                    if (select count(*) > 1 from fiche_action_axe where fiche_id = fac.id) then
                        delete
                        from fiche_action_axe
                        where fiche_action_axe.fiche_id = fac.id
                          and fiche_action_axe.axe_id = delete_axe_all.axe_id;
                    else
                        delete
                        from fiche_action
                        where id = fac.id;
                    end if;

                end loop;
        end if;
        delete from axe where id = delete_axe_all.axe_id;
    else
        perform set_config('response.status', '401', true);
        raise 'L''utilisateur n''a pas les droits en édition sur la collectivité du plan';
    end if;
end;
$$;

COMMIT;
