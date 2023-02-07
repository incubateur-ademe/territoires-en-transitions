-- Deploy tet:labellisation/comparaison_audit to pg

BEGIN;

create function supprimer_score_avant_audit() returns trigger as
$$
begin
    delete
    from pre_audit_scores
    where audit_id = old.id;
    return old;
end
$$ security definer language plpgsql;

create trigger supprimer_score_avant_audit
    before delete
    on audit
    for each row
execute procedure supprimer_score_avant_audit();

COMMIT;
