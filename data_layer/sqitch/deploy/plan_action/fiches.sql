-- Deploy tet:plan_action/fiches to pg

BEGIN;

alter table fiche_action_pilote
    drop constraint fiche_action_pilote_fiche_id_user_id_tag_id_key;

alter table fiche_action_pilote
    add constraint one_user_per_fiche unique (fiche_id, user_id);

alter table fiche_action_pilote
    add constraint one_tag_per_fiche unique (fiche_id, tag_id);

COMMIT;
