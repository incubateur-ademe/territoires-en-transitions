-- Deploy tet:evaluation/drop_client_scores_dependances to pg

BEGIN;

-- client_scores, pre_audit_scores et post_audit_scores ne sont plus écrites
-- (remplacées par score_snapshot) : on retire tout ce qui les lit encore.

-- 1. CRM : la synchro Airtable de crm_usages est désactivée en production.
drop view public.crm_usages;
drop materialized view stats.crm_usages;

-- 2. Fonctions de refresh appelées par pg_cron.
CREATE OR REPLACE FUNCTION stats.refresh_stats_locales() RETURNS void
  LANGUAGE plpgsql
AS
$$
BEGIN
  refresh materialized view stats.locales_collectivite_actives_et_total_par_type;
  refresh materialized view stats.evolution_nombre_fiches;
  refresh materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;
  refresh materialized view stats.locales_evolution_nombre_fiches;
END
$$;

CREATE OR REPLACE FUNCTION stats.refresh_views() RETURNS void
AS
$$
BEGIN
  refresh materialized view stats.collectivite;
  refresh materialized view stats.collectivite_utilisateur;
  refresh materialized view stats.collectivite_referentiel;
  refresh materialized view stats.collectivite_labellisation;
  refresh materialized view stats.collectivite_plan_action;
  refresh materialized view stats.collectivite_action_statut;
  refresh materialized view stats.evolution_activation;
  refresh materialized view stats.rattachement;
  refresh materialized view stats.utilisateur;
  refresh materialized view stats.evolution_utilisateur;
  refresh materialized view stats.connection;
  refresh materialized view stats.evolution_connection;
  refresh materialized view stats.carte_collectivite_active;
  refresh materialized view stats.evolution_total_activation_par_type;
  refresh materialized view stats.collectivite_actives_et_total_par_type;
  refresh materialized view stats.evolution_nombre_utilisateur_par_collectivite;

  -- Removed: stats.carte_epci_par_departement

  refresh materialized view stats.evolution_collectivite_avec_minimum_fiches;
  refresh materialized view stats.evolution_indicateur_referentiel;
  refresh materialized view stats.evolution_resultat_indicateur_referentiel;
  refresh materialized view stats.evolution_resultat_indicateur_personnalise;
  refresh materialized view stats.engagement_collectivite;
  refresh materialized view stats.evolution_nombre_fiches;
  refresh materialized view stats.evolution_nombre_plans;

  -- Removed: stats.evolution_nombre_labellisations
END ;
$$ language plpgsql security definer;

create or replace function stats.refresh_views_crm() returns void
    security definer
    language plpgsql
as
$$
begin
    refresh materialized view stats.crm_indicateurs;
    refresh materialized view stats.crm_plans;
end ;
$$;

select cron.unschedule(jobid) from cron.job where jobname = 'refresh_stats_completude';

-- 3. Vues et fonctions qui lisent les anciennes tables de scores.
drop materialized view public.stats_tranche_completude;
drop materialized view stats.pourcentage_completude;
drop materialized view stats.locales_pourcentage_completude;
drop view public.retool_completude;
drop function labellisation.critere_action(integer);

-- 4. La suppression d'une collectivité test ne vise plus les anciennes tables de scores.
create or replace function delete_collectivite_test(collectivite_id integer) returns void
  security definer
  language plpgsql
as
$$
begin

  if not is_service_role() then
    perform set_config('response.status', '401', true);
    raise 'Seul le service role peut supprimer une collectivité test';
  end if;
  if(select count(*)=0 from collectivite where id = delete_collectivite_test.collectivite_id and type = 'test') then
    perform set_config('response.status', '401', true);
    raise 'La collectivité test % n''existe pas', delete_collectivite_test.collectivite_id ;
  end if;

  -- Documents
  delete from annexe where annexe.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from preuve_audit where preuve_audit.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from preuve_complementaire where preuve_complementaire.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from preuve_labellisation where preuve_labellisation.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from preuve_rapport where preuve_rapport.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from preuve_reglementaire where preuve_reglementaire.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from labellisation.bibliotheque_fichier where bibliotheque_fichier.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from collectivite_bucket where collectivite_bucket.collectivite_id = delete_collectivite_test.collectivite_id;


  -- Labellisation
  delete from labellisation.action_audit_state where action_audit_state.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from audit_auditeur where audit_id in (
    select id
    from labellisation.audit
    where audit.collectivite_id = delete_collectivite_test.collectivite_id
  );
  delete from labellisation where labellisation.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from labellisation.audit where audit.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from labellisation.demande where demande.collectivite_id = delete_collectivite_test.collectivite_id;


  -- Référentiel
  delete from action_discussion where action_discussion.collectivite_id = delete_collectivite_test.collectivite_id; -- action_discussion_commentaire on cascade
  delete from action_statut where action_statut.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from action_commentaire where action_commentaire.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Plan action
  perform delete_axe_all(axe.id)
  from axe
  where axe.parent is null
    and axe.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from fiche_action where fiche_action.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Indicateur
  delete from indicateur_valeur where indicateur_valeur.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from indicateur_definition where indicateur_definition.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Tags
  delete from personne_tag where personne_tag.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from service_tag where service_tag.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from financeur_tag where financeur_tag.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from partenaire_tag where partenaire_tag.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from structure_tag where structure_tag.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Personnalisation
  delete from reponse_binaire where reponse_binaire.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from reponse_choix where reponse_choix.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from reponse_proportion where reponse_proportion.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from justification where justification.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from justification_ajustement where justification_ajustement.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from personnalisation_consequence where personnalisation_consequence.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Droits
  delete from private_utilisateur_droit where private_utilisateur_droit.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from private_collectivite_membre where private_collectivite_membre.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Usages
  delete from usage where usage.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from visite where visite.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Collectivite
  delete from cot where cot.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from collectivite_test where collectivite_test.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from collectivite where id = delete_collectivite_test.collectivite_id;
end;
$$;

COMMIT;
