-- Deploy tet:plan_action/fiches to pg

BEGIN;

create function
    fiche_resume(fiche_action_action)
    returns setof fiche_resume
    rows 1
begin
    atomic
    select * from fiche_resume where id = $1.fiche_id;
end;
comment on function fiche_resume is
    'Permet de lier une fiche action à une action.';

COMMIT;
