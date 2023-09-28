-- Deploy tet:plan_action/fiches to pg

BEGIN;

drop function fiche_resume(fiche_action_action);

create or replace function fiche_resume(fiche_action_action fiche_action_action) returns SETOF private.fiche_resume
    rows 1
    language sql
    stable
    security definer
begin
    atomic
    select fr.plans,
           fr.titre,
           fr.id,
           fr.statut,
           fr.collectivite_id,
           fr.pilotes,
           fr.modified_at,
           fr.date_fin_provisoire,
           fr.niveau_priorite
    from private.fiche_resume as fr
    where fr.id = fiche_action_action.fiche_id
      and can_read_acces_restreint(fr.collectivite_id);
end;


COMMIT;
