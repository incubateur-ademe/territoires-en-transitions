-- Deploy tet:evaluation/score_service to pg

BEGIN;

create or replace view evaluation.service_regles
as
select action_id,
       jsonb_agg(jsonb_build_object('type', pr.type, 'formule', formule)) as regles
from personnalisation_regle pr
where ("action_id" like 'cae_%' or "action_id" like 'eci_%')
group by action_id;
comment on view evaluation.service_regles
    is 'Les règles qui s''appliquent aux actions au format JSON, inclues dans les payload envoyées au service.';

COMMIT;
