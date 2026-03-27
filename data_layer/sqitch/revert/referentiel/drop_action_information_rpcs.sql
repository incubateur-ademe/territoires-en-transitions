-- Revert tet:referentiel/drop_action_information_rpcs from pg
-- Corps des fonctions : dernière version dans deploy/utilisateur/droits_v2@v2.52.0.sql
-- Commentaires : deploy/referentiel/vues@v1.14.0.sql

BEGIN;

-- Fonction action_contexte
create or replace function action_contexte(id action_id, OUT id action_id, OUT contexte text) returns record
    stable
    language sql
as
$$
select action_definition.action_id, action_definition.contexte
from action_definition
where action_definition.action_id = action_contexte.id
  and est_verifie()
$$;

comment on function action_contexte is 'Returns action "contexte" text';

-- Fonction action_exemples
create or replace function action_exemples(id action_id, OUT id action_id, OUT exemples text) returns record
    stable
    language sql
as
$$
select action_definition.action_id, action_definition.exemples
from action_definition
where action_definition.action_id = action_exemples.id
  and est_verifie();
$$;

comment on function action_exemples is 'Returns action "exemples" text';

-- Fonction action_perimetre_evaluation
create or replace function action_perimetre_evaluation(id action_id, OUT id action_id, OUT perimetre_evaluation text) returns record
    stable
    language sql
as
$$
select action_definition.action_id, action_definition.perimetre_evaluation
from action_definition
where action_definition.action_id = action_perimetre_evaluation.id
  and est_verifie()
$$;

comment on function action_perimetre_evaluation is 'Returns action "perimetre_evaluation" text';

-- Fonction action_ressources
create or replace function action_ressources(id action_id, OUT id action_id, OUT ressources text) returns record
    stable
    language sql
as
$$
select action_definition.action_id, action_definition.ressources
from action_definition
where action_definition.action_id = action_ressources.id
  and est_verifie()
$$;

comment on function action_ressources is 'Returns action "ressources" text';

COMMIT;
