-- Deploy tet:labellisation/preuve_v2 to pg

BEGIN;

create or replace function
    preuve_count(collectivite_id integer, action_id action_id)
    returns integer
as
$$
begin
    if not is_authenticated()
    then
        perform set_config('response.status', '403', true);
    end if;
    return (select (select count(*)
                    from preuve_action pa
                             left join preuve_reglementaire pr using (preuve_id)
                    where (pa.action_id in
                           (select unnest(descendants)
                            from private.action_hierarchy ah
                            where ah.action_id = preuve_count.action_id)
                        or pa.action_id = preuve_count.action_id)
                      and pr.collectivite_id = preuve_count.collectivite_id) +
                   (select count(*)
                    from preuve_complementaire pc
                    where pc.collectivite_id = preuve_count.collectivite_id
                      and (pc.action_id in
                           (select unnest(descendants)
                            from private.action_hierarchy ah
                            where ah.action_id = preuve_count.action_id)
                        or pc.action_id = preuve_count.action_id)));
end;
$$ language plpgsql security definer;

COMMIT;
