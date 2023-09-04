-- Deploy tet:plan_action/fiches to pg

BEGIN;

create or replace function fiche_resume(fiche_action_action fiche_action_action) returns SETOF fiche_resume
    rows 1
    language sql
    stable
begin
    atomic
    select fr.plans,
           fr.titre,
           fr.id,
           fr.statut,
           fr.collectivite_id,
           fr.pilotes,
           fr.modified_at
    from private.fiche_resume as fr
    where fr.id = fiche_action_action.fiche_id
      and can_read_acces_restreint(fr.collectivite_id);
end;

create or replace function fiche_resume(fiche_action_indicateur fiche_action_indicateur) returns SETOF fiche_resume
    rows 1
    language sql
    stable
begin
    atomic
    select fr.plans,
           fr.titre,
           fr.id,
           fr.statut,
           fr.collectivite_id,
           fr.pilotes,
           fr.modified_at
    from private.fiche_resume as fr
    where fr.id = fiche_action_indicateur.fiche_id
      and can_read_acces_restreint(fr.collectivite_id);
end;

COMMIT;
