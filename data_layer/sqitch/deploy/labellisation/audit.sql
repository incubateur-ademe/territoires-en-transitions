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
        -- si l'audit n'existe pas.
    then
        insert
        into labellisation.audit (collectivite_id, referentiel, demande_id, date_debut, date_fin)
        select current_audit.col,
               current_audit.ref,
               null,
               null,
               null
        on conflict do nothing
        returning * into found; -- null en cas de conflit
    end if;

    if found is null
        -- l'audit n'existait pas et n'a pas pu être créé
        -- car il vient d'être créé dans un autre appel
    then
        select *
        into found
        from labellisation.audit a
        where a.collectivite_id = current_audit.col
          and a.referentiel = current_audit.ref
          and now() <@ tstzrange(date_debut, date_fin)
        order by date_debut desc nulls last
        limit 1;
    end if;

    return found;
end;
$$ language plpgsql;

COMMIT;
