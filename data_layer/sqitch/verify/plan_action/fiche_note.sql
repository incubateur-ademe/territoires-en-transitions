-- Verify tet:plan_action/fiche_note on pg

BEGIN;

select
    id,
    fiche_id,
    date_note,
    note,
    modified_at,
    created_at,
    modified_by,
    created_by
from fiche_action_note
where false;

ROLLBACK;
