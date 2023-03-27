-- Deploy tet:labellisation/comparaison_audit to pg

BEGIN;

alter table pre_audit_scores
    drop constraint pre_audit_scores_audit_id_fkey,
    add constraint pre_audit_scores_audit_id_fkey foreign key (audit_id) references audit;

COMMIT;
