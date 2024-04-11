-- Deploy tet:plan_action/fiches to pg
BEGIN;

alter table fiche_action_pilote
    drop constraint one_user_per_fiche;

alter table fiche_action_pilote
    drop constraint one_tag_per_fiche;

alter table fiche_action_pilote
    add constraint fiche_action_pilote_fiche_id_user_id_tag_id_key unique (fiche_id, user_id, tag_id);

COMMIT;
