-- Deploy tet:labellisation/comparaison_audit to pg

BEGIN;

create or replace function
    private.collectivite_scores_pre_audit(
    collectivite_id integer,
    referentiel referentiel
)
    returns setof tabular_score
begin
    atomic
    select sc.*
    from pre_audit_scores
             join private.convert_client_scores(pre_audit_scores.scores) ccc on true
             join private.to_tabular_score(ccc) sc on true
    where pre_audit_scores.collectivite_id = collectivite_scores_pre_audit.collectivite_id
      and pre_audit_scores.referentiel = collectivite_scores_pre_audit.referentiel;
end;

COMMIT;
