-- Deploy tet:plan_action/fiche_note to pg

BEGIN;

create table public.fiche_action_note
(
    fiche_id integer references fiche_action not null,
    date_note date not null,
    note text not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_by uuid default auth.uid() references auth.users not null,
    created_by uuid default auth.uid() references auth.users not null,
    primary key (fiche_id, date_note)
);

comment on table public.fiche_action_note is
    'Notes de suivi annuel et points de vigilance associés à une fiche action';

alter table public.fiche_action_note enable row level security;
create policy allow_read on public.fiche_action_note for select using(peut_lire_la_fiche(fiche_id));
create policy allow_insert on public.fiche_action_note for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on public.fiche_action_note for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on public.fiche_action_note for delete using(peut_modifier_la_fiche(fiche_id));

COMMIT;
