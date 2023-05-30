-- Deploy tet:labellisation/audit to pg
BEGIN;

create or replace function labellisation.current_audit(col integer, ref referentiel)
    returns labellisation.audit
    security definer
as
$$
    # variable_conflict use_column
declare
    found labellisation.audit;
begin
    select *
    into found
    from labellisation.audit a
    where a.collectivite_id = current_audit.col
      and a.referentiel = current_audit.ref
      and now() <@ tstzrange(date_debut, date_fin)
      -- les audits avec une date de début sont prioritaires sur ceux avec une plage infinie,
      -- ces derniers comprenant toujours `now()`.
    order by date_debut desc nulls last
    limit 1;

    if found is null
    then
        insert
        into labellisation.audit (collectivite_id, referentiel, demande_id, date_debut, date_fin)
        select current_audit.col,
               current_audit.ref,
               null,
               null,
               null
        returning * into found;
    end if;

    return found;
end;
$$ language plpgsql;

COMMIT;
