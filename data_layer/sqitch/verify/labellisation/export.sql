-- Verify tet:labellisation/export on pg

BEGIN;

select collectivite,
       region,
       cot,
       signataire,
       realise_eci,
       programme_eci,
       points_eci,
       date_cloture_eci,
       realise_cae,
       programme_cae,
       points_cae,
       date_cloture_cae
from labellisation.export_score_audit
where false;

select collectivite,
       region,
       cot,
       signataire,
       realise_eci,
       programme_eci,
       points_eci,
       date_cloture_eci,
       realise_cae,
       programme_cae,
       points_cae,
       date_cloture_cae
from public.export_score_audit
where false;

ROLLBACK;
