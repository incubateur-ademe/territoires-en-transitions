-- Verify tet:labellisation/export on pg

BEGIN;

select
       collectivite_id,
       collectivite,
       region,
       cot,
       signataire,
       action_id,
       realise,
       programme,
       points,
       date_cloture
from labellisation.export_score_audit_par_action
where false;

select
    collectivite_id,
    collectivite,
    region,
    cot,
    signataire,
    action_id,
    realise,
    programme,
    points,
    date_cloture
from public.export_score_audit_par_action
where false;

ROLLBACK;
