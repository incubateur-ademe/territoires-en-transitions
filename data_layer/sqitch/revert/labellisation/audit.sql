-- Deploy tet:labellisation/audit to pg
BEGIN;

drop view audits;
drop trigger on_audit_update on audit;
drop function labellisation.update_audit;

create or replace function labellisation.current_audit(col integer, ref referentiel)
    returns audit as
$$
select *
from audit a
where a.collectivite_id = col
  and a.referentiel = ref
  and (
        (a.date_fin is null and now() >= a.date_debut)
        or (a.date_fin is not null and now() between a.date_debut and a.date_fin)
    )
order by date_debut desc
limit 1
$$ language sql;

drop view audit_en_cours;

COMMIT;
