-- Deploy tet:plan_action to pg

BEGIN;

drop view bibliotheque_annexe;

drop function private.ajouter_annexe;

alter table annexe
    drop column fiche_id;


create table fiche_action_annexe
(
    fiche_id integer references fiche_action not null,
    annexe_id integer references annexe not null,
    primary key (fiche_id, annexe_id)
);
alter table fiche_action_annexe enable row level security;
create policy allow_read on fiche_action_annexe for select using(is_authenticated());
create policy allow_insert on fiche_action_annexe for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_annexe for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_annexe for delete using(peut_modifier_la_fiche(fiche_id));

COMMIT;
