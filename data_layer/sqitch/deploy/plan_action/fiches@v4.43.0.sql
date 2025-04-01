-- Deploy tet:plan_action/fiches to pg

BEGIN;

create policy allow_read on fiche_action_effet_attendu for select using (peut_lire_la_fiche(fiche_id));
create policy allow_insert on fiche_action_effet_attendu for insert with check (peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_effet_attendu for update using (peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_effet_attendu for delete using (peut_modifier_la_fiche(fiche_id));

COMMIT;

