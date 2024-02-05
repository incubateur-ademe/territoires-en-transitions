-- Verify tet:plan_action/fiches on pg

BEGIN;

select plans,
       titre,
       id,
       statut,
       collectivite_id,
       pilotes,
       modified_at,
       date_fin_provisoire,
       niveau_priorite,
       restreint,
       amelioration_continue
from fiche_resume
where false;

select has_function_privilege('create_fiche(int,int,action_id,indicateur_id,int)','execute');
select has_function_privilege('fiche_resume(fiche_action_action)','execute');
select has_function_privilege('fiche_resume(fiche_action_indicateur)','execute');
select has_function_privilege('filter_fiches_action(integer,boolean,integer[],boolean,personne[],boolean,personne[],boolean,fiche_action_niveaux_priorite[],boolean,fiche_action_statuts[],boolean,integer,integer,boolean,timestamp with time zone,timestamp with time zone,fiche_action_echeances,integer)','execute');

ROLLBACK;
