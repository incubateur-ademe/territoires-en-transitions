-- Verify tet:evaluation/question_display on pg

BEGIN;

select id,
       action_ids,
       collectivite_id,
       thematique_id,
       type,
       thematique_nom,
       description,
       types_collectivites_concernees,
       formulation,
       ordonnancement,
       choix,
       population,
       localisation
from question_display
where false;

ROLLBACK;
