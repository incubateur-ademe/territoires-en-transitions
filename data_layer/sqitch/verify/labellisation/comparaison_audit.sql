-- Verify tet:labellisation/comparaison_audit on pg

BEGIN;

select collectivite_id, referentiel, scores, modified_at, payload_timestamp, audit_id
    from pre_audit_scores
        where false;

ROLLBACK;
