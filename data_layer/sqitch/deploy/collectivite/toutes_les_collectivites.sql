-- Deploy tet:collectivite/toutes_les_collectivites to pg
-- requires: collectivite/imports
-- requires: collectivite/collectivite
-- requires: evaluation/referentiel_progress

BEGIN;

create function
    active(collectivite)
    returns bool
    language sql
    stable
begin
    atomic
    return exists (select * from private_utilisateur_droit pud where collectivite_id = $1.id and active);
end;
comment on function active(collectivite) is 'Vrai si la collectivité à un utilisateur actif';

drop function plan_action_type(axe);
create function
    plan_action_type(axe)
    returns setof plan_action_type
    language sql
    stable
begin
    atomic
    select t from plan_action_type t where t.id = $1.type;
end;
comment on function plan_action_type(axe) is
    'Le type du plan.';

create function
    collectivite_card(axe)
    returns collectivite_card
    language sql
    stable
begin
    atomic
    select card from collectivite_card card where card.collectivite_id = $1.collectivite_id;
end;
comment on function collectivite_card(axe) is
    'Le type du plan.';

COMMIT;
