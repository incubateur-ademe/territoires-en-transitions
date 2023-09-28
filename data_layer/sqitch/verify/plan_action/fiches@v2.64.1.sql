-- Verify tet:plan_action/fiches on pg

BEGIN;

select plans,
       titre,
       id,
       statut,
       collectivite_id,
       pilotes,
       modified_at,
       date_fin_provisoire,
       niveau_priorite
from private.fiche_resume
where false;

ROLLBACK;