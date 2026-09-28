-- Revert tet:evaluation/drop_client_scores_triggers from pg

BEGIN;

create table public.client_scores_update
(
    collectivite_id integer references collectivite not null,
    referentiel     referentiel                     not null,
    modified_at     timestamp with time zone        not null,
    primary key (collectivite_id, referentiel)
);
comment on table public.client_scores_update
    is 'Permet au client d''écouter les changement de scores et de minimiser la payload.';

alter table public.client_scores_update enable row level security;
create policy allow_read
    on public.client_scores_update for select
    using (true);
alter publication supabase_realtime add table public.client_scores_update;

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
  delete from post_audit_scores where post_audit_scores.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from pre_audit_scores where pre_audit_scores.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from labellisation where labellisation.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from labellisation.audit where audit.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from labellisation.demande where demande.collectivite_id = delete_collectivite_test.collectivite_id;


  -- Référentiel
  delete from action_discussion where action_discussion.collectivite_id = delete_collectivite_test.collectivite_id; -- action_discussion_commentaire on cascade
  delete from action_statut where action_statut.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from action_commentaire where action_commentaire.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from client_scores where client_scores.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from client_scores_update where client_scores_update.collectivite_id = delete_collectivite_test.collectivite_id;

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

create function evaluation.after_scores_write() returns trigger as
$$
begin
insert into client_scores_update(collectivite_id, referentiel, modified_at)
values (new.collectivite_id, new.referentiel, new.modified_at)
on conflict (collectivite_id, referentiel) do update set modified_at = excluded.modified_at;
return new;
end
$$ language plpgsql security definer;

create trigger on_write
    after insert or update
    on public.client_scores
    for each row
execute procedure evaluation.after_scores_write();

create trigger check_payload_timestamp
    before insert or update
    on public.client_scores
    for each row
execute procedure prevent_older_results();

create trigger modified_at
    before insert or update
    on public.client_scores
    for each row
execute procedure update_modified_at();

COMMIT;
