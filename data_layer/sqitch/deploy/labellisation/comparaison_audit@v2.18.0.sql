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
    from labellisation.current_audit(collectivite_scores_pre_audit.collectivite_id,
                                     collectivite_scores_pre_audit.referentiel) ca
             join pre_audit_scores pas on pas.audit_id = ca.id
             join private.convert_client_scores(pas.scores) ccc on true
             join private.to_tabular_score(ccc) sc on true;
end;

COMMIT;
