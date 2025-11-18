-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

create or replace function can_read_acces_restreint(collectivite_id integer) returns boolean as
$$
begin
    return (select case
                       when (select access_restreint
                             from collectivite
                             where id = can_read_acces_restreint.collectivite_id
                             limit 1)
                           then have_lecture_acces(can_read_acces_restreint.collectivite_id)
                           or est_support()
                           or private.est_auditeur(collectivite_id)
                       else est_verifie() end);

end;
$$ language plpgsql security definer;
comment on function can_read_acces_restreint
    is 'Vrai si l''utilisateur a accès en lecture à la collectivité en prenant en compte la restriction access_restreint';

create function est_auditeur_action(collectivite_id integer, action_id action_id) returns boolean as
$$
begin
    return (with referentiel_ as (select referentiel
                                  from action_relation
                                  where id = action_id)
            select est_auditeur(collectivite_id, referentiel_.referentiel)
            from referentiel_);
end;
$$ language plpgsql security definer;
comment on function est_auditeur_action
    is 'Vrai si l''utilisateur est un auditeur sur la collectivité et le référentiel de l''action';

create function est_auditeur_discussion(discussion_id integer) returns boolean as
$$
begin
    return (with discussion_ as (select collectivite_id, action_id
                                 from action_discussion
                                 where id = discussion_id)
            select est_auditeur_action(discussion_.collectivite_id, discussion_.action_id)
            from discussion_);
end;
$$ language plpgsql security definer;
comment on function est_auditeur_discussion
    is 'Vrai si l''utilisateur est un auditeur sur la collectivité et le référentiel de la discussion';

create function est_auditeur_audit(audit_id integer) returns boolean as
$$
begin
    return (with audit_ as (select collectivite_id, referentiel
                            from labellisation.audit
                            where id = audit_id)
            select est_auditeur(audit_.collectivite_id, audit_.referentiel)
            from audit_);
end;
$$ language plpgsql security definer;
comment on function est_auditeur_audit
    is 'Vrai si l''utilisateur est un auditeur sur la collectivité et le référentiel de la discussion';

create function est_auditeur_demande(demande_id integer) returns boolean as
$$
begin
    return (with demande_ as (select collectivite_id, referentiel
                              from labellisation.demande
                              where id = demande_id)
            select est_auditeur(demande_.collectivite_id, demande_.referentiel)
            from demande_);
end;
$$ language plpgsql security definer;
comment on function est_auditeur_demande
    is 'Vrai si l''utilisateur est un auditeur sur la collectivité et le référentiel de la discussion';

create or replace function have_discussion_lecture_acces(id integer) returns boolean as
$$
begin
    return (with discussion_ as (select collectivite_id
                                 from action_discussion
                                 where action_discussion.id = have_discussion_lecture_acces.id)
            select have_lecture_acces(discussion_.collectivite_id)
            from discussion_);
end;
$$ language plpgsql security definer;
comment on function have_discussion_lecture_acces
    is 'Vrai si l''utilisateur est lecteur sur la collectivité de la discussion';

create function have_discussion_admin_acces(discussion_id integer) returns boolean as
$$
begin
    return (with discussion_ as (select collectivite_id
                                 from action_discussion
                                 where id = discussion_id)
            select have_admin_acces(discussion_.collectivite_id)
            from discussion_);
end;
$$ language plpgsql security definer;
comment on function have_discussion_admin_acces
    is 'Vrai si l''utilisateur est admin sur la collectivité de la discussion';


-- Table action_commentaire
alter policy allow_read on action_commentaire using (est_verifie());
alter policy allow_insert on action_commentaire with check (
        have_edition_acces(collectivite_id) or est_auditeur_action(collectivite_id, action_id));
alter policy allow_update on action_commentaire using (
        have_edition_acces(collectivite_id) or est_auditeur_action(collectivite_id, action_id));

-- Table action_computed_points
alter policy allow_read on action_computed_points using (est_verifie());

-- Table action_definition
alter policy allow_read on action_definition using (est_verifie());

-- Table action_discussion
alter policy allow_read on action_discussion using (
        have_lecture_acces(collectivite_id) or est_auditeur_action(collectivite_id, action_id));
alter policy allow_insert on action_discussion with check (
        have_lecture_acces(collectivite_id) or est_auditeur_action(collectivite_id, action_id));
alter policy allow_update on action_discussion using (
        have_lecture_acces(collectivite_id) or est_auditeur_action(collectivite_id, action_id));
alter policy allow_delete on action_discussion using (
        have_lecture_acces(collectivite_id) or est_auditeur_action(collectivite_id, action_id));

-- Table action_discussion_commentaire
alter table action_discussion_commentaire
    drop constraint action_discussion_commentaire_discussion_id_fkey;
alter table action_discussion_commentaire
    add foreign key (discussion_id)
        references action_discussion (id)
        on delete cascade;
alter policy allow_read on action_discussion_commentaire using (
        have_discussion_lecture_acces(discussion_id) or est_auditeur_discussion(discussion_id));
alter policy allow_insert on action_discussion_commentaire with check (
        have_discussion_lecture_acces(discussion_id) or est_auditeur_discussion(discussion_id));
alter policy allow_update on action_discussion_commentaire using (created_by = auth.uid());
alter policy allow_delete on action_discussion_commentaire using (
    have_discussion_admin_acces(discussion_id) or created_by = auth.uid());

-- Table action_relation
alter policy allow_read on action_relation using (est_verifie());

-- Table action_statut TODO en audit ou pas
alter policy allow_read on action_statut using (est_verifie());
alter policy allow_insert on action_statut with check (
        have_edition_acces(collectivite_id) or est_auditeur_action(collectivite_id, action_id));
alter policy allow_update on action_statut using (
        have_edition_acces(collectivite_id) or est_auditeur_action(collectivite_id, action_id));

-- Table audit_auditeur
alter policy allow_read on audit_auditeur using (est_verifie());
drop policy allow_insert on audit_auditeur;
drop policy allow_update on audit_auditeur;

-- Table client_scores
drop policy allow_read on client_scores;
create policy allow_read on client_scores for select using (est_verifie());

-- Table client_scores_update
alter policy allow_read on client_scores_update using (est_verifie());

-- Table collectivite
drop policy collectivite_read_for_all on collectivite;
create policy allow_read on collectivite for select using (is_authenticated());

-- Table collectivite_bucket
drop policy allow_read on collectivite_bucket;
create policy allow_read on collectivite_bucket for select using (can_read_acces_restreint(collectivite_id));

-- Table collectivite_test
drop policy collectivite_test_read_for_all on collectivite_test;
create policy allow_read on collectivite_test for select using (is_authenticated());

-- Table commune
drop policy commune_read_for_all on commune;
create policy allow_read on commune for select using (is_authenticated());

-- Table cot
drop policy allow_read_for_all on cot;
create policy allow_read on cot for select using (is_authenticated());

-- Table dcp
drop policy if exists own_dcp_only on dcp;
create policy allow_insert on dcp for insert with check (user_id = auth.uid());
create policy allow_read on dcp for select using (user_id = auth.uid());
create policy allow_update on dcp for update using (user_id = auth.uid());
create policy allow_delete on dcp for delete using (user_id = auth.uid());


-- Table epci
drop policy epci_read_for_all on epci;
create policy allow_read on epci for select using (is_authenticated());

-- Table fiche_action_axe
alter table fiche_action_axe
    drop constraint fiche_action_axe_axe_id_fkey;
alter table fiche_action_axe
    add foreign key (axe_id)
        references axe (id)
        on delete cascade;

-- Table fiche_action_import_csv
alter policy allow_read on fiche_action_import_csv using (is_service_role());
alter policy allow_insert on fiche_action_import_csv with check (is_service_role());
alter policy allow_update on fiche_action_import_csv using (is_service_role());
alter policy allow_delete on fiche_action_import_csv using (is_service_role());

-- Table fiche_action_lien
drop policy allow_read on fiche_action_lien;
create policy allow_read on fiche_action_lien for select
    using (peut_lire_la_fiche(fiche_une) AND peut_lire_la_fiche(fiche_deux));

-- Table filtre_intervalle
drop policy allow_read on filtre_intervalle;
create policy allow_read on filtre_intervalle for select using (is_authenticated());

-- Table indicateur_action
alter policy allow_read on indicateur_action using (is_authenticated());

-- Table indicateur_resultat_commentaire
alter policy allow_insert on indicateur_resultat_commentaire with check (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));
alter policy allow_update on indicateur_resultat_commentaire using (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));

-- Table indicateur_definition
alter policy allow_read on indicateur_definition using (is_authenticated());

-- Table indicateur_objectif
alter policy allow_insert on indicateur_objectif with check (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));
alter policy allow_update on indicateur_objectif using (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));

-- Table indicateur_parent
drop policy allow_read on indicateur_parent;

-- Table indicateur_personnalise_definition
alter table indicateur_personnalise_definition
    alter column collectivite_id set not null;

-- Table indicateur_resultat
alter policy allow_insert on indicateur_resultat with check (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));
alter policy allow_update on indicateur_resultat using (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));

-- Table indicateur_terristory_json
drop policy allow_insert on indicateur_terristory_json;

-- Table justification
alter policy allow_read on justification using (est_verifie());
alter policy allow_insert on justification with check (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));
alter policy allow_update on justification using (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));

-- Table labellisation
alter policy allow_read on labellisation using (est_verifie());

-- Table labellisation_action_critere
drop policy critere_read_for_all on labellisation_action_critere;
create policy allow_read on labellisation_action_critere for select using (est_verifie());

-- Table labellisation_calendrier
drop policy if exists read_for_all on labellisation_calendrier;
create policy allow_read on labellisation_calendrier for select using (est_verifie());

-- Table labellisation_fichier_critere
drop policy critere_fichier_read_for_all on labellisation_fichier_critere;
create policy allow_read on labellisation_fichier_critere for select using (est_verifie());

-- Table personnalisation
drop policy allow_read_for_all on personnalisation;
create policy allow_read on personnalisation for select using (is_authenticated());

-- Table personnalisation_consequence
drop policy allow_read on personnalisation_consequence;
create policy allow_read on personnalisation_consequence for select using (is_authenticated());

-- Table personnalisation_regle
drop policy allow_read_for_all on personnalisation_regle;
create policy allow_read on personnalisation_regle for select using (is_authenticated());

-- Table post_audit_scores
alter policy allow_read on post_audit_scores using (is_authenticated());

-- Table pre_audit_scores
alter policy allow_read on pre_audit_scores using (is_authenticated());

-- Table preuve_audit
alter policy allow_read on preuve_audit using (can_read_acces_restreint(collectivite_id));
alter policy allow_insert on preuve_audit with check (
    have_edition_acces(collectivite_id) or est_auditeur_audit(audit_id));
alter policy allow_update on preuve_audit using (
    have_edition_acces(collectivite_id) or est_auditeur_audit(audit_id));
alter policy allow_delete on preuve_audit using (
    have_edition_acces(collectivite_id) or est_auditeur_audit(audit_id));

-- Table preuve_complementaire
alter policy allow_read on preuve_complementaire using (can_read_acces_restreint(collectivite_id));
alter policy allow_insert on preuve_complementaire with check (
        have_edition_acces(collectivite_id) or est_auditeur_action(collectivite_id, action_id));
alter policy allow_update on preuve_complementaire using (
        have_edition_acces(collectivite_id) or est_auditeur_action(collectivite_id, action_id));
alter policy allow_delete on preuve_complementaire using (
        have_edition_acces(collectivite_id) or est_auditeur_action(collectivite_id, action_id));

-- Table preuve_labellisation
alter policy allow_read on preuve_labellisation using (can_read_acces_restreint(collectivite_id));
alter policy allow_insert on preuve_labellisation with check (
        have_edition_acces(collectivite_id) or est_auditeur_demande(demande_id));
alter policy allow_update on preuve_labellisation using (
        have_edition_acces(collectivite_id) or est_auditeur_demande(demande_id));
alter policy allow_delete on preuve_labellisation using (
        have_edition_acces(collectivite_id) or est_auditeur_demande(demande_id));

-- Table preuve_rapport
alter policy allow_read on preuve_rapport using (can_read_acces_restreint(collectivite_id));
alter policy allow_insert on preuve_rapport with check (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));
alter policy allow_update on preuve_rapport using (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));
alter policy allow_delete on preuve_rapport using (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));

-- Table preuve_reglementaire
alter policy allow_read on preuve_reglementaire using (can_read_acces_restreint(collectivite_id));
alter policy allow_insert on preuve_reglementaire with check (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));
alter policy allow_update on preuve_reglementaire using (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));
alter policy allow_delete on preuve_reglementaire using (
        have_edition_acces(collectivite_id) or private.est_auditeur(collectivite_id));

-- Table private_collectivite_membre
alter policy allow_read on private_collectivite_membre using (
        have_lecture_acces(collectivite_id) or private.est_auditeur(collectivite_id) or est_support());

-- Table private_utilisateur_droit
drop policy allow_update on private_utilisateur_droit;
alter policy allow_read on private_utilisateur_droit using (est_verifie());

-- Table question
drop policy allow_read_for_all on question;
create policy allow_read on question for select using (is_authenticated());

-- Table question_action
drop policy allow_read_for_all on question_action;
create policy allow_read on question_action for select using (is_authenticated());

-- Table question_choix
drop policy allow_read_for_all on question_choix;
create policy allow_read on question_choix for select using (is_authenticated());

-- Table question_thematique
drop policy allow_read_for_all on question_thematique;
create policy allow_read on question_thematique for select using (is_authenticated());

-- Table reponse_binaire
alter policy allow_read on reponse_binaire using (est_verifie());
alter policy allow_insert on reponse_binaire with check (
        have_lecture_acces(collectivite_id) or private.est_auditeur(collectivite_id));
alter policy allow_update on reponse_binaire using (
        have_lecture_acces(collectivite_id) or private.est_auditeur(collectivite_id));

-- Table reponse_choix
alter policy allow_read on reponse_choix using (est_verifie());
alter policy allow_insert on reponse_choix with check (
        have_lecture_acces(collectivite_id) or private.est_auditeur(collectivite_id));
alter policy allow_update on reponse_choix using (
        have_lecture_acces(collectivite_id) or private.est_auditeur(collectivite_id));

-- Table reponse_proportion
alter policy allow_read on reponse_proportion using (est_verifie());
alter policy allow_insert on reponse_proportion with check (
        have_lecture_acces(collectivite_id) or private.est_auditeur(collectivite_id));
alter policy allow_update on reponse_proportion using (
        have_lecture_acces(collectivite_id) or private.est_auditeur(collectivite_id));

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

-- Fonction action_down_to_tache
create or replace function action_down_to_tache(referentiel referentiel, identifiant text) returns SETOF action_definition_summary
    language plpgsql
as
$$
declare
    referentiel_action_depth integer;
begin
    if action_down_to_tache.referentiel = 'cae'
    then
        select 3 into referentiel_action_depth;
    else
        select 2 into referentiel_action_depth;
    end if;
    return query
        select *
        from action_definition_summary
        where action_definition_summary.referentiel = action_down_to_tache.referentiel
          and action_definition_summary.identifiant like action_down_to_tache.identifiant || '%'
          and action_definition_summary.depth >= referentiel_action_depth - 1
          and est_verifie();
end
$$;

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

-- Fonction action_preuve
create or replace function action_preuve(id action_id, OUT id action_id, OUT preuve text) returns record
    stable
    language sql
as
$$
select action_definition.action_id, action_definition.preuve
from action_definition
where action_definition.action_id = action_preuve.id
  and est_verifie()
$$;

-- Fonction action_reduction_potentiel
create or replace function action_reduction_potentiel(id action_id, OUT id action_id, OUT reduction_potentiel text) returns record
    stable
    language sql
as
$$
select action_definition.action_id, action_definition.reduction_potentiel
from action_definition
where action_definition.action_id = action_reduction_potentiel.id
  and est_verifie()
$$;

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

-- Fonction add_bibliotheque_fichier
create or replace function add_bibliotheque_fichier(collectivite_id integer, hash character varying, filename text) returns bibliotheque_fichier
    security definer
    language plpgsql
as
$$
declare
    inserted     integer;
    return_value bibliotheque_fichier;
begin
    if have_edition_acces(add_bibliotheque_fichier.collectivite_id) or
       private.est_auditeur(add_bibliotheque_fichier.collectivite_id)
    then
        if (select count(o.id) > 0
            from storage.objects o
                     join collectivite_bucket cb on o.bucket_id = cb.bucket_id
            where cb.collectivite_id = add_bibliotheque_fichier.collectivite_id
              and o.name = add_bibliotheque_fichier.hash) is not null
        then
            insert into labellisation.bibliotheque_fichier(collectivite_id, hash, filename)
            values (add_bibliotheque_fichier.collectivite_id,
                    add_bibliotheque_fichier.hash,
                    add_bibliotheque_fichier.filename)
            returning id into inserted;

            select *
            from bibliotheque_fichier bf
            where bf.id = inserted
            into return_value;

            perform set_config('response.status', '201', true);
            return return_value;
        else
            perform set_config('response.status', '404', true);
            return null;
        end if;
    else
        perform set_config('response.status', '403', true);
        return null;
    end if;
end;
$$;

-- Fonction ajouter_fiche_action_dans_un_axe
create or replace function ajouter_fiche_action_dans_un_axe(fiche_id integer, axe_id integer) returns void
    language plpgsql
as
$$
begin
    if peut_modifier_la_fiche(fiche_id) then
        insert into fiche_action_axe
        values (ajouter_fiche_action_dans_un_axe.fiche_id, ajouter_fiche_action_dans_un_axe.axe_id);
    else
        perform set_config('response.status', '403', true);
    end if;

end;
$$;

-- Fonction business_*
drop function business_insert_actions;
drop function business_update_actions;
drop function business_upsert_indicateurs;

-- Fonction claim_collectivite
create or replace function claim_collectivite(id integer) returns json
    security definer
    language plpgsql
as
$$
declare
    collectivite_already_claimed bool;
    claimed_collectivite_id      integer;
begin

    if not is_authenticated() then
        perform set_config('response.status', '401', true);
        return json_build_object('message', 'Vous n''êtes pas connecté.');
    end if;

    select id into claimed_collectivite_id;

    -- compute collectivite_already_claimed, which is true if a droit exist for claimed collectivite
    select claimed_collectivite_id in (select collectivite_id
                                       from private_utilisateur_droit
                                       where active)
    into collectivite_already_claimed;

    if not collectivite_already_claimed
    then
        -- current user can claim collectivite as its own
        -- create a droit for current user on collectivite
        insert
        into private_utilisateur_droit(user_id, collectivite_id, niveau_acces, active)
        values (auth.uid(), claimed_collectivite_id, 'admin', true);
        -- return a success message
        perform set_config('response.status', '200', true);
        return json_build_object('message', 'Vous êtes administrateur de la collectivité.');
    else
        -- current user cannot claim the collectivite
        -- return an error with a reason
        perform set_config('response.status', '409', true);
        return json_build_object('message', 'La collectivité dispose déjà d''un administrateur.');
    end if;
end
$$;

-- Fonction collectivite_membres
create or replace function collectivite_membres(id integer)
    returns TABLE
            (
                user_id            text,
                prenom             text,
                nom                text,
                email              text,
                telephone          text,
                niveau_acces       niveau_acces,
                fonction           membre_fonction,
                details_fonction   text,
                champ_intervention referentiel[]
            )
    security definer
    language sql
as
$$
with droits_dcp_membre as
         (select d.user_id,
                 p.prenom,
                 p.nom,
                 p.email,
                 p.telephone,
                 d.niveau_acces,
                 m.fonction,
                 m.details_fonction,
                 m.champ_intervention
          from private_utilisateur_droit d
                   left join utilisateur.dcp_display p on p.user_id = d.user_id
                   left join private_collectivite_membre m
                             on m.user_id = d.user_id and m.collectivite_id = d.collectivite_id
          where d.collectivite_id = collectivite_membres.id
            and d.active),
     invitations as (select null::uuid             as user_id,
                            null                   as prenom,
                            null                   as nom,
                            i.email,
                            null                   as telephone,
                            i.niveau::niveau_acces as niveau_acces,
                            null::membre_fonction  as fonction,
                            null                   as details_fonction,
                            null::referentiel[]    as champ_intervention
                     from utilisateur.invitation i
                     where i.collectivite_id = collectivite_membres.id
                       and i.pending),
     merged as (select *
                from droits_dcp_membre
                where is_authenticated() -- limit dcp listing to user with an account.
                union
                select *
                from invitations
                where have_edition_acces(collectivite_membres.id) -- do not show invitations to those who cannot invite.
     )
select *
from merged
where est_verifie()
order by case fonction
             when 'referent' then 1
             when 'technique' then 2
             when 'politique' then 3
             when 'conseiller' then 4
             else 5
             end,
         nom,
         prenom;
$$;

-- Fonction enlever_fiche_action_d_un_axe
create or replace function enlever_fiche_action_d_un_axe(fiche_id integer, axe_id integer) returns void
    language plpgsql
as
$$
begin
    if peut_modifier_la_fiche(fiche_id)
    then
        delete
        from fiche_action_axe
        where fiche_action_axe.fiche_id = enlever_fiche_action_d_un_axe.fiche_id
          and fiche_action_axe.axe_id = enlever_fiche_action_d_un_axe.axe_id;
    else
        perform set_config('response.status', '403', true);
    end if;
end;
$$;

-- Fonction est_auditeur
create or replace function est_auditeur(collectivite integer, referentiel referentiel) returns boolean
    language sql
BEGIN
    ATOMIC
    SELECT COALESCE(bool_or((auth.uid() = aa.auditeur)), false) AS "coalesce"
    FROM (labellisation.active_audit(est_auditeur.collectivite, est_auditeur.referentiel) ca(id, collectivite_id,
                                                                                             referentiel, demande_id,
                                                                                             date_debut, date_fin,
                                                                                             valide)
        JOIN audit_auditeur aa ON ((ca.id = aa.audit_id)))
    where is_authenticated();
END;

-- Fonction evaluation.evaluation_payload
create or replace function evaluation.evaluation_payload(collectivite_id integer, referentiel referentiel,
                                                         OUT referentiel jsonb, OUT statuts jsonb,
                                                         OUT consequences jsonb) returns record
    stable
    security definer
    language sql
as
$$
with statuts as (select s.data
                 from evaluation.service_statuts s
                 where s.referentiel = evaluation_payload.referentiel
                   and s.collectivite_id = evaluation_payload.collectivite_id),
     consequences as ( -- on ne garde que les conséquences du référentiel concerné
         select jsonb_object_agg(tuple.key, tuple.value) as filtered
         from personnalisation_consequence pc
                  join jsonb_each(pc.consequences) tuple on true
                  join action_relation ar on tuple.key = ar.id
         where pc.collectivite_id = evaluation_payload.collectivite_id
           and ar.referentiel = evaluation_payload.referentiel)
select r.data                                    as referentiel,
       coalesce(s.data, to_jsonb('{}'::jsonb[])) as statuts,
       coalesce(c.filtered, '{}'::jsonb)         as consequences
from evaluation.service_referentiel as r
         left join statuts s on true
         left join consequences c on true
where r.referentiel = evaluation_payload.referentiel
$$;

-- Fonction delete_axe_all
create or replace function delete_axe_all(axe_id integer) returns void
    language plpgsql
as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    facs         fiche_action[];
    fac          fiche_action;
begin
    if have_edition_acces((select collectivite_id from axe where id = delete_axe_all.axe_id)) then
        for pa_enfant_id in select pa.id from axe pa where pa.parent = delete_axe_all.axe_id
            loop
                execute delete_axe_all(pa_enfant_id);
            end loop;
        select array_agg(fa.*)
        from fiche_action fa
                 join fiche_action_axe faa on fa.id = faa.fiche_id
        where faa.axe_id = delete_axe_all.axe_id
        into facs;
        if facs is not null then
            foreach fac in array facs
                loop
                    if (select count(*) > 1 from fiche_action_axe where fiche_id = fac.id) then
                        delete
                        from fiche_action_axe
                        where fiche_action_axe.fiche_id = fac.id
                          and fiche_action_axe.axe_id = delete_axe_all.axe_id;
                    else
                        delete
                        from fiche_action
                        where id = fac.id;
                    end if;

                end loop;
        end if;
        delete from axe where id = delete_axe_all.axe_id;
    else
        perform set_config('response.status', '401', true);
    end if;
end;
$$;

-- Fonction fiche_resume
create or replace function fiche_resume(fiche_action_action fiche_action_action) returns SETOF fiche_resume
    rows 1
    language sql
BEGIN
    ATOMIC
    SELECT fiche_resume.plans,
           fiche_resume.titre,
           fiche_resume.id,
           fiche_resume.statut,
           fiche_resume.collectivite_id,
           fiche_resume.pilotes,
           fiche_resume.modified_at
    FROM fiche_resume
    WHERE (fiche_resume.id = ($1).fiche_id)
      and can_read_acces_restreint(fiche_resume.collectivite_id);
END;

-- Fonction fiche_resume
create or replace function fiche_resume(fiche_action_indicateur fiche_action_indicateur) returns SETOF fiche_resume
    rows 1
    language sql
BEGIN
    ATOMIC
    SELECT fiche_resume.plans,
           fiche_resume.titre,
           fiche_resume.id,
           fiche_resume.statut,
           fiche_resume.collectivite_id,
           fiche_resume.pilotes,
           fiche_resume.modified_at
    FROM fiche_resume
    WHERE (fiche_resume.id = ($1).fiche_id)
      and can_read_acces_restreint(fiche_resume.collectivite_id);
END;

-- Fonction have_one_of_niveaux_acces
drop function if exists have_one_of_niveaux_acces;

-- Fonction is_agent_of
drop function if exists is_agent_of;

-- Fonction labellisation_cloturer_audit
create or replace function labellisation_cloturer_audit(audit_id integer,
                                                        date_fin timestamp with time zone DEFAULT CURRENT_TIMESTAMP) returns labellisation.audit
    security definer
    language plpgsql
as
$$
declare
    audit labellisation.audit;
begin
    -- si l'utilisateur n'est pas le service role ou l'auditeur
    if not is_service_role() and not est_auditeur_audit(audit_id)
    then -- alors on renvoie un code 403
        perform set_config('response.status', '403', true);
        raise 'Seul l''auditeur et le service role peut clôturer l''audit.';
    end if;

    update labellisation.audit
    set date_fin = labellisation_cloturer_audit.date_fin
    where id = audit_id
    returning * into audit;

    return audit;
end;
$$;

-- Fonction labellisation_demande
create or replace function labellisation_demande(collectivite_id integer, referentiel referentiel) returns labellisation.demande
    security definer
    language plpgsql
as
$$
declare
    current_audit audit;
    found         labellisation.demande;
begin

    if est_verifie() or is_service_role() then
        select *
        into current_audit
        from labellisation.current_audit(labellisation_demande.collectivite_id, labellisation_demande.referentiel);

        if current_audit.demande_id is null
        then
            with demande as (
                insert into labellisation.demande (collectivite_id, referentiel, etoiles, sujet)
                    values (labellisation_demande.collectivite_id, labellisation_demande.referentiel, null, 'cot')
                    returning id),
                 audit as (
                     update audit
                         set demande_id = demande.id
                         from demande
                         where audit.id = current_audit.id
                         returning *)
            select audit.*
            from audit
            into current_audit;
        end if;

        select *
        into found
        from labellisation.demande
        where id = current_audit.demande_id;

        return found;
    else
        perform set_config('response.status', '401', true);
        raise 'Accès non autorisé.';
    end if;
end;
$$;

-- Fonction labellisation_parcours
create or replace function
    labellisation_parcours(collectivite_id integer)
    returns table
            (
                referentiel     referentiel,
                etoiles         labellisation.etoile,
                completude_ok   boolean,
                critere_score   jsonb,
                criteres_action jsonb,
                rempli          boolean, -- critère fichier rempli
                calendrier      text,
                demande         jsonb,   -- labellisation.demande
                labellisation   jsonb,   -- labellisation
                audit           jsonb    -- audit
            )
    security definer
begin
    atomic
    with etoiles as (select *
                     from labellisation.etoiles(labellisation_parcours.collectivite_id)),
         all_critere as (select *
                         from labellisation.critere_action(labellisation_parcours.collectivite_id)),
         -- les critères pour l'étoile visée et les précédentes.
         current_critere as (select c.*
                             from all_critere c
                                      join etoiles e
                                           on e.referentiel = c.referentiel and e.etoile_objectif >= c.etoiles),
         criteres as (select *
                      from (select c.referentiel,
                                   bool_and(c.atteint) as atteints,
                                   jsonb_agg(
                                           jsonb_build_object(
                                                   'formulation', formulation,
                                                   'prio', c.prio,
                                                   'action_id', c.action_id,
                                                   'rempli', c.atteint,
                                                   'etoile', c.etoiles,
                                                   'action_identifiant', ad.identifiant,
                                                   'statut_ou_score',
                                                   case
                                                       when c.min_score_realise = 100 and c.min_score_programme is null
                                                           then 'Fait'
                                                       when c.min_score_realise = 100 and c.min_score_programme = 100
                                                           then 'Programmé ou fait'
                                                       when c.min_score_realise is not null and c.min_score_programme is null
                                                           then c.min_score_realise || '% fait minimum'
                                                       else c.min_score_realise || '% fait minimum ou ' ||
                                                            c.min_score_programme || '% programmé minimum'
                                                       end
                                               )
                                       )               as liste
                            from current_critere c
                                     join action_definition ad on c.action_id = ad.action_id
                            group by c.referentiel) ral)
    select e.referentiel,
           e.etoile_objectif,
           rs.complet                                                as completude_ok,

           jsonb_build_object(
                   'score_a_realiser', cs.score_a_realiser,
                   'score_fait', cs.score_fait,
                   'atteint', cs.atteint,
                   'etoiles', cs.etoile_objectif)                    as critere_score,

           criteres.liste                                            as criteres_action,
           criteres.atteints
               and cs.atteint
               -- Pas de document nécessaire pour une demande par une collectivité cot
               and (case when cot is not null then true else cf.atteint end) as rempli,
           calendrier.information,

           to_jsonb(demande),
           to_jsonb(labellisation),
           to_jsonb(audit)

    from etoiles as e
             join criteres on criteres.referentiel = e.referentiel
             left join labellisation.referentiel_score(labellisation_parcours.collectivite_id) rs
                       on rs.referentiel = e.referentiel
             left join labellisation.critere_score_global(labellisation_parcours.collectivite_id) cs
                       on cs.referentiel = e.referentiel
             left join labellisation.critere_fichier(labellisation_parcours.collectivite_id) cf
                       on cf.referentiel = e.referentiel
             left join labellisation_calendrier calendrier
                       on calendrier.referentiel = e.referentiel
             left join cot
                       on cot.collectivite_id = labellisation_parcours.collectivite_id

             left join lateral (select d.id,
                                       d.en_cours,
                                       d.collectivite_id,
                                       d.referentiel,
                                       d.etoiles,
                                       d.date,
                                       d.sujet
                                from labellisation_demande(labellisation_parcours.collectivite_id,
                                                           e.referentiel) d) demande on true

             left join lateral (select a.id,
                                       a.collectivite_id,
                                       a.referentiel,
                                       a.demande_id,
                                       a.date_debut,
                                       a.date_fin,
                                       a.valide
                                from labellisation.current_audit(labellisation_parcours.collectivite_id,
                                                                 e.referentiel) a) audit on true

             left join lateral (select l.id,
                                       l.collectivite_id,
                                       l.referentiel,
                                       l.obtenue_le,
                                       l.annee,
                                       l.etoiles,
                                       l.score_realise,
                                       l.score_programme
                                from labellisation l
                                where l.collectivite_id = labellisation_parcours.collectivite_id
                                  and l.referentiel = e.referentiel
                                order by l.obtenue_le desc
                                limit 1) labellisation on true
    where est_verifie()
        or is_service_role();
end;

-- Fonction labellisation_submit_demande
create or replace function labellisation_submit_demande(collectivite_id integer, referentiel referentiel,
                                                        sujet labellisation.sujet_demande,
                                                        etoiles labellisation.etoile DEFAULT NULL::labellisation.etoile) returns labellisation.demande
    security definer
    language plpgsql
as
$$
declare
    demande labellisation.demande;
begin
    if have_edition_acces(labellisation_submit_demande.collectivite_id) or is_service_role() then
        if not ((labellisation_submit_demande.sujet = 'cot' and labellisation_submit_demande.etoiles is not null)
            or (labellisation_submit_demande.sujet != 'cot' and labellisation_submit_demande.etoiles is null))
        then
            select *
            from labellisation_demande(
                    labellisation_submit_demande.collectivite_id,
                    labellisation_submit_demande.referentiel
                )
            into demande;

            update labellisation.demande ld
            set etoiles   = labellisation_submit_demande.etoiles,
                sujet     = labellisation_submit_demande.sujet,
                en_cours  = false,
                demandeur = auth.uid()
            where ld.id = demande.id
            returning * into demande;

            return demande;
        else
            raise exception 'Seulement si le sujet de la demande est "cot", étoiles devrait être null.';
        end if;
    else
        perform set_config('response.status', '401', true);
        raise 'Accès non autorisé.';
    end if;
end ;
$$;

-- Fonction naturalsort
create or replace function naturalsort(text text) returns bytea
    immutable
    strict
    language sql
as
$$
select string_agg(convert_to(coalesce(r[2],
                                      length(length(r[1])::text) || length(r[1])::text || r[1]),
                             'SQL_ASCII'), '\x00')
from regexp_matches($1, '0*([0-9]+)|([^0-9]+)', 'g') r;
$$;

-- Fonction personnes_collectivite
create or replace function personnes_collectivite(collectivite_id integer) returns SETOF personne
    language sql
as
$$
select *
from (select pt.nom,
             pt.collectivite_id,
             pt.id      as tag_id,
             null::uuid as user_id
      from personne_tag pt
      where pt.collectivite_id = personnes_collectivite.collectivite_id
      union
      select concat(cm.prenom, ' ', cm.nom) as nom,
             personnes_collectivite.collectivite_id,
             null::integer                  as tag_id,
             cm.user_id::uuid               as user_id
      from collectivite_membres(personnes_collectivite.collectivite_id) cm) req
where can_read_acces_restreint(req.collectivite_id);
$$;

-- Fonction plan_action
create or replace function plan_action(id integer) returns jsonb
    stable
    security definer
    language plpgsql
as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    pa_axe       axe; -- Axe courant
    id_loop      integer; -- Indice pour parcourir une boucle
    enfants      jsonb[]; -- Plans d'actions enfants du plan d'action courant;
    fiches       jsonb; -- Fiches actions du plan d'action courant
    to_return    jsonb; -- JSON retournant le plan d'action courant, ses fiches et ses enfants
begin
    fiches = to_jsonb((select array_agg(ff.*)
                       from (select *
                             from fiche_resume fa
                                      join fiche_action_axe fapa on fa.id = fapa.fiche_id
                             where fapa.axe_id = plan_action.id
                             order by naturalsort(lower(fa.titre))) ff));
    select * from axe where axe.id = plan_action.id limit 1 into pa_axe;
    if can_read_acces_restreint(pa_axe.collectivite_id) then
        id_loop = 1;
        for pa_enfant_id in
            select pa.id
            from axe pa
            where pa.parent = plan_action.id
            order by naturalsort(lower(pa.nom))
            loop
                enfants[id_loop] = plan_action(pa_enfant_id);
                id_loop = id_loop + 1;
            end loop;

        to_return = jsonb_build_object('axe', pa_axe,
                                       'fiches', fiches,
                                       'enfants', enfants);
        return to_return;
    else
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;
end;
$$;

-- Fonction plan_action_profondeur
create or replace function plan_action_profondeur(id integer, profondeur integer) returns jsonb
    stable
    security definer
    language plpgsql
as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    pa_axe       axe; -- Axe courant
    id_loop      integer; -- Indice pour parcourir une boucle
    enfants      jsonb[]; -- Plans d'actions enfants du plan d'action courant;
    to_return    jsonb; -- JSON retournant le plan d'action courant, ses fiches et ses enfants
begin
    select * from axe where axe.id = plan_action_profondeur.id limit 1 into pa_axe;
    if can_read_acces_restreint(pa_axe.collectivite_id) then
        id_loop = 1;
        for pa_enfant_id in
            select pa.id
            from axe pa
            where pa.parent = plan_action_profondeur.id
            order by naturalsort(lower(pa.nom))
            loop
                enfants[id_loop] = plan_action_profondeur(pa_enfant_id, profondeur + 1);
                id_loop = id_loop + 1;
            end loop;

        to_return = jsonb_build_object('axe', pa_axe,
                                       'profondeur', plan_action_profondeur.profondeur,
                                       'enfants', enfants);
        return to_return;
    else
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;
end;
$$;

-- Fonction plan_action_tableau_de_bord
create or replace function plan_action_tableau_de_bord(collectivite_id integer, plan_id integer DEFAULT NULL::integer,
                                                       sans_plan boolean DEFAULT false) returns plan_action_tableau_de_bord
    security definer
    language sql
as
$$
with fiches as (select distinct fa.*,
                                case
                                    when fa.statut not in ('À venir', 'En cours', 'En pause')
                                        then 'NC'
                                    when fa.amelioration_continue
                                        then 'Action en amélioration continue'
                                    when fa.date_fin_provisoire is null
                                        then 'Date de fin non renseignée'
                                    when fa.date_fin_provisoire < now()
                                        then 'Échéance dépassée'
                                    when fa.date_fin_provisoire < (now() + interval '3 months')
                                        then 'Échéance dans moins de trois mois'
                                    when fa.date_fin_provisoire < (now() + interval '1 year')
                                        then 'Échéance entre trois mois et 1 an'
                                    else 'Échéance dans plus d’un an'
                                    end as echeance
                from fiche_action fa
                         left join fiche_action_axe faa on faa.fiche_id = fa.id
                         left join plan_action_chemin pac on faa.axe_id = pac.axe_id
                where case
                          when plan_action_tableau_de_bord.plan_id is not null
                              then pac.plan_id = plan_action_tableau_de_bord.plan_id
                          when sans_plan
                              then faa is null
                          else true
                    end
                  and fa.collectivite_id = plan_action_tableau_de_bord.collectivite_id
                  and can_read_acces_restreint(fa.collectivite_id)),
     personnes as (select *
                   from personnes_collectivite(plan_action_tableau_de_bord.collectivite_id))
select case
           when can_read_acces_restreint(plan_action_tableau_de_bord.collectivite_id) then
               plan_action_tableau_de_bord.collectivite_id end as collectivite_id,
       case
           when can_read_acces_restreint(plan_action_tableau_de_bord.collectivite_id) then
               plan_action_tableau_de_bord.plan_id end         as plan_id,
       (select array_agg((t.*)::graphique_tranche) as statuts
        from (select coalesce(statut::text, 'NC') as id, count(*) as value
              from fiches
              group by coalesce(statut::text, 'NC')) t),
       (select array_agg((t.*)::graphique_tranche) as pilotes
        from (select coalesce(p.nom, 'NC') as id, count(f.*) as value
              from fiches f
                       left join fiche_action_pilote fap on fap.fiche_id = f.id
                       left join personnes p on fap.user_id = p.user_id or fap.tag_id = p.tag_id
              group by coalesce(p.nom, 'NC')) t),
       (select array_agg((t.*)::graphique_tranche) as referents
        from (select coalesce(p.nom, 'NC') as id, count(f.*) as value
              from fiches f
                       left join fiche_action_referent far on far.fiche_id = f.id
                       left join personnes p on far.user_id = p.user_id or far.tag_id = p.tag_id
              group by coalesce(p.nom, 'NC')) t),
       (select array_agg((t.*)::graphique_tranche) as priorites
        from (select coalesce(niveau_priorite::text, 'NC') as id, count(*) as value
              from fiches
              group by coalesce(niveau_priorite::text, 'NC')) t),
       (select array_agg((t.*)::graphique_tranche) as echeances
        from (select echeance as id, count(*) as value
              from fiches
              where echeance <> 'NC'
              group by echeance) t)
$$;

-- Fonction plans_action_collectivite
create or replace function plans_action_collectivite(collectivite_id integer) returns SETOF axe
    language sql
as
$$
select axe.*
from axe
where axe.collectivite_id = plans_action_collectivite.collectivite_id
  and axe.parent is null
  and can_read_acces_restreint(plans_action_collectivite.collectivite_id);
$$;

-- Fonction quit_collectivite
drop function quit_collectivite;

-- Fonction referent_contact
drop function referent_contact;

-- Fonction referent_contacts
create or replace function referent_contacts(id integer)
    returns TABLE
            (
                prenom text,
                nom    text,
                email  text
            )
    security definer
    language sql
as
$$
select p.prenom, p.nom, p.email
from private_utilisateur_droit d
         join dcp p on p.user_id = d.user_id
where d.collectivite_id = referent_contacts.id
  and d.active
  and niveau_acces = 'admin'
  and is_authenticated()
$$;

-- Fonction referentiel_down_to_action
create or replace function referentiel_down_to_action(referentiel referentiel) returns SETOF action_definition_summary
    language plpgsql
as
$$
declare
    referentiel_action_depth integer;
begin
    if referentiel_down_to_action.referentiel = 'cae'
    then
        select 3 into referentiel_action_depth;
    else
        select 2 into referentiel_action_depth;
    end if;
    return query
        select *
        from action_definition_summary
        where action_definition_summary.referentiel = referentiel_down_to_action.referentiel
          and action_definition_summary.depth <= referentiel_action_depth
          and est_verifie();
end;
$$;

-- Fonction retool_plan_action_hebdo
create or replace view retool_plan_action_hebdo
            (collectivite_id, nom, date_range, nb_plans, nb_fiches, contributeurs, day) as
WITH weeks AS (SELECT day.day
               FROM generate_series('2023-01-02'::date::timestamp with time zone, now(), '7 days'::interval) day(day)),
     collectivites_by_weeks AS (SELECT nc.collectivite_id,
                                       nc.nom,
                                       w.day
                                FROM named_collectivite nc
                                         LEFT JOIN LATERAL ( SELECT weeks.day
                                                             FROM weeks) w ON true
                                ORDER BY nc.collectivite_id),
     plans AS (SELECT cw.collectivite_id,
                      cw.day,
                      count(p_1.id)                 AS nb_plans,
                      array_agg(DISTINCT dcp.email) AS contributeurs
               FROM collectivites_by_weeks cw
                        LEFT JOIN (SELECT axe.modified_at,
                                          axe.id,
                                          axe.nom,
                                          axe.collectivite_id,
                                          axe.parent,
                                          axe.created_at,
                                          axe.modified_by
                                   FROM axe
                                   WHERE axe.parent IS NULL) p_1
                                  ON p_1.collectivite_id = cw.collectivite_id AND p_1.created_at >= cw.day AND
                                     p_1.created_at < (cw.day + '7 days'::interval)
                        LEFT JOIN (SELECT dcp_1.user_id,
                                          dcp_1.nom,
                                          dcp_1.prenom,
                                          dcp_1.email,
                                          dcp_1.limited,
                                          dcp_1.deleted,
                                          dcp_1.created_at,
                                          dcp_1.modified_at,
                                          dcp_1.telephone
                                   FROM dcp dcp_1
                                   WHERE dcp_1.limited = false
                                     AND dcp_1.deleted = false) dcp ON p_1.modified_by = dcp.user_id
               GROUP BY cw.collectivite_id, cw.day),
     fiches AS (SELECT cw.collectivite_id,
                       cw.day,
                       count(f_1.id)                 AS nb_fiches,
                       array_agg(DISTINCT dcp.email) AS contributeurs
                FROM collectivites_by_weeks cw
                         LEFT JOIN fiche_action f_1
                                   ON f_1.collectivite_id = cw.collectivite_id AND f_1.created_at >= cw.day AND
                                      f_1.created_at < (cw.day + '7 days'::interval)
                         LEFT JOIN (SELECT dcp_1.user_id,
                                           dcp_1.nom,
                                           dcp_1.prenom,
                                           dcp_1.email,
                                           dcp_1.limited,
                                           dcp_1.deleted,
                                           dcp_1.created_at,
                                           dcp_1.modified_at,
                                           dcp_1.telephone
                                    FROM dcp dcp_1
                                    WHERE dcp_1.limited = false
                                      AND dcp_1.deleted = false) dcp ON f_1.modified_by = dcp.user_id
                GROUP BY cw.collectivite_id, cw.day)
SELECT c.collectivite_id,
       c.nom,
       concat(c.day::date, ' - ', (c.day + '6 days'::interval day)::date)  AS date_range,
       p.nb_plans,
       f.nb_fiches,
       (SELECT array_remove(array_agg(DISTINCT val.val), NULL::text) AS array_remove
        FROM unnest(array_cat(p.contributeurs, f.contributeurs)) val(val)) AS contributeurs,
       c.day
FROM collectivites_by_weeks c
         JOIN plans p ON c.collectivite_id = p.collectivite_id AND c.day = p.day
         JOIN fiches f ON c.collectivite_id = f.collectivite_id AND c.day = f.day
WHERE (p.nb_plans <> 0 OR f.nb_fiches <> 0)
  AND is_service_role()
ORDER BY c.day DESC, c.collectivite_id;

-- Fonction save_reponse
create or replace function save_reponse(jsonarg json) returns void
    language plpgsql
as
$$
declare
    qt                  question_type;
    arg_question_id     question_id;
    arg_collectivite_id integer;
    arg_reponse         text;
begin
    select $1 ->> 'question_id' into arg_question_id;
    select $1 ->> 'collectivite_id' into arg_collectivite_id;
    select $1 ->> 'reponse' into arg_reponse;

    if have_lecture_acces(arg_collectivite_id) or private.est_auditeur(arg_collectivite_id) then
        select type
        into qt
        from question
        where id = arg_question_id;

        if qt = 'binaire'
        then
            insert into reponse_binaire (collectivite_id, question_id, reponse)
            select arg_collectivite_id, arg_question_id, arg_reponse::boolean
            on conflict (collectivite_id, question_id) do update
                set reponse = arg_reponse::boolean;
        elsif qt = 'proportion'
        then
            insert into reponse_proportion(collectivite_id, question_id, reponse)
            select arg_collectivite_id, arg_question_id, arg_reponse::double precision
            on conflict (collectivite_id, question_id) do update
                set reponse = arg_reponse::double precision;
        elsif qt = 'choix'
        then
            insert into reponse_choix(collectivite_id, question_id, reponse)
            select arg_collectivite_id, arg_question_id, arg_reponse::choix_id
            on conflict (collectivite_id, question_id) do update
                set reponse = arg_reponse::choix_id;
        else
            raise exception 'La question % n''existe pas', arg_question_id;
        end if;
    else
        perform set_config('response.status', '401', true);
        raise 'Accès non autorisé.';
    end if;
end
$$;


-- Fonction update_bibliotheque_fichier_filename
create or replace function update_bibliotheque_fichier_filename(collectivite_id integer, hash character varying, filename text) returns void
    security definer
    language plpgsql
as
$$
begin
    if have_lecture_acces(update_bibliotheque_fichier_filename.collectivite_id) or
       private.est_auditeur(update_bibliotheque_fichier_filename.collectivite_id)
    then
        update labellisation.bibliotheque_fichier
        set filename = update_bibliotheque_fichier_filename.filename
        where labellisation.bibliotheque_fichier.hash = update_bibliotheque_fichier_filename.hash
          and labellisation.bibliotheque_fichier.collectivite_id = update_bibliotheque_fichier_filename.collectivite_id;

        perform set_config('response.status', '201', true);
    else
        perform set_config('response.status', '403', true);
    end if;
end;
$$;

-- Fonction upsert_axe
create or replace function upsert_axe(nom text, collectivite_id integer, parent integer) returns integer
    language plpgsql
as
$$
declare
    existing_axe_id integer;
    axe_id          integer;
begin
    if have_edition_acces(collectivite_id) then
        select a.id
        from axe a
        where a.nom = trim(upsert_axe.nom)
          and a.collectivite_id = upsert_axe.collectivite_id
          and ((a.parent is null and upsert_axe.parent is null)
            or (a.parent = upsert_axe.parent))
        limit 1
        into existing_axe_id;
        if existing_axe_id is null then
            insert into axe (nom, collectivite_id, parent)
            values (trim(upsert_axe.nom), upsert_axe.collectivite_id, parent)
            returning id into axe_id;
        else
            axe_id = existing_axe_id;
        end if;
        return axe_id;
    else
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en edition sur la collectivité.';
    end if;
end;
$$;

-- Vue action_audit_state
create or replace view action_audit_state
            (action_id, state_id, statut, avis, ordre_du_jour, audit_id, collectivite_id, referentiel) as
WITH action AS (SELECT ar_1.action_id
                FROM private.action_hierarchy ar_1
                WHERE ar_1.type = 'action'::action_type)
SELECT ar.action_id,
       aas.id AS state_id,
       aas.statut,
       aas.avis,
       aas.ordre_du_jour,
       a.id   AS audit_id,
       a.collectivite_id,
       a.referentiel
FROM action ar
         LEFT JOIN labellisation.action_audit_state aas ON ar.action_id::text = aas.action_id::text
         JOIN labellisation.audit a ON aas.audit_id = a.id
where have_lecture_acces(a.collectivite_id)
   or est_support()
   or est_auditeur(a.collectivite_id, a.referentiel);

-- Vue action_discussion_feed
create or replace view action_discussion_feed
            (id, collectivite_id, action_id, created_by, created_at, modified_at, status, commentaires) as
WITH nom_commentaire AS (SELECT adc.id,
                                adc.created_by,
                                adc.created_at,
                                adc.discussion_id,
                                adc.message,
                                utilisateur.modified_by_nom(adc.created_by) AS created_by_nom
                         FROM action_discussion_commentaire adc)
SELECT ad.id,
       ad.collectivite_id,
       ad.action_id,
       ad.created_by,
       ad.created_at,
       ad.modified_at,
       ad.status,
       c.commentaires
FROM action_discussion ad
         LEFT JOIN LATERAL ( SELECT array_agg(to_jsonb(nc.*)) AS commentaires
                             FROM nom_commentaire nc
                             WHERE nc.discussion_id = ad.id) c ON true
where have_lecture_acces(ad.collectivite_id)
   or est_support()
   or est_auditeur_action(ad.collectivite_id, ad.action_id);

-- Vue action_statuts
create or replace view action_statuts
            (collectivite_id, action_id, referentiel, type, descendants, ascendants, depth, have_children, identifiant,
             nom, description, have_exemples, have_preuve, have_ressources, have_reduction_potentiel,
             have_perimetre_evaluation, have_contexte, phase, score_realise, score_programme,
             score_realise_plus_programme, score_pas_fait, score_non_renseigne, points_restants, points_realises,
             points_programmes, points_max_personnalises, points_max_referentiel, concerne, desactive, avancement,
             avancement_detaille, avancement_descendants, non_concerne)
as
SELECT c.id                                             AS collectivite_id,
       d.action_id,
       client_scores.referentiel,
       d.type,
       d.descendants,
       d.ascendants,
       d.depth,
       d.have_children,
       d.identifiant,
       d.nom,
       d.description,
       d.have_exemples,
       d.have_preuve,
       d.have_ressources,
       d.have_reduction_potentiel,
       d.have_perimetre_evaluation,
       d.have_contexte,
       d.phase,
       sc.score_realise,
       sc.score_programme,
       sc.score_realise_plus_programme,
       sc.score_pas_fait,
       sc.score_non_renseigne,
       sc.points_restants,
       sc.points_realises,
       sc.points_programmes,
       sc.points_max_personnalises,
       sc.points_max_referentiel,
       sc.concerne,
       sc.desactive,
       s.avancement,
       s.avancement_detaille,
       cs.avancements                                   AS avancement_descendants,
       COALESCE(NOT s.concerne, cs.non_concerne, false) AS non_concerne
FROM collectivite c
         JOIN client_scores ON client_scores.collectivite_id = c.id
         JOIN LATERAL private.convert_client_scores(client_scores.scores) ccc(referentiel, action_id, concerne,
                                                                              desactive, point_fait, point_pas_fait,
                                                                              point_potentiel, point_programme,
                                                                              point_referentiel, total_taches_count,
                                                                              point_non_renseigne,
                                                                              point_potentiel_perso,
                                                                              completed_taches_count,
                                                                              fait_taches_avancement,
                                                                              pas_fait_taches_avancement,
                                                                              programme_taches_avancement,
                                                                              pas_concerne_taches_avancement) ON true
         JOIN LATERAL private.to_tabular_score(ccc.*) sc(referentiel, action_id, score_realise, score_programme,
                                                         score_realise_plus_programme, score_pas_fait,
                                                         score_non_renseigne, points_restants, points_realises,
                                                         points_programmes, points_max_personnalises,
                                                         points_max_referentiel, avancement, concerne, desactive)
              ON true
         JOIN action_referentiel d ON sc.action_id::text = d.action_id::text
         LEFT JOIN action_statut s ON c.id = s.collectivite_id AND s.action_id::text = d.action_id::text
         LEFT JOIN LATERAL ( SELECT CASE
                                        WHEN NOT d.have_children THEN '{}'::avancement[]
                                        WHEN ccc.point_non_renseigne = ccc.point_potentiel
                                            THEN '{non_renseigne}'::avancement[]
                                        WHEN ccc.point_non_renseigne > 0.0::double precision THEN
                                                '{non_renseigne}'::avancement[] ||
                                                array_agg(DISTINCT statut.avancement) FILTER (WHERE statut.concerne)
                                        ELSE array_agg(DISTINCT statut.avancement) FILTER (WHERE statut.concerne)
                                        END                       AS avancements,
                                    NOT bool_and(statut.concerne) AS non_concerne
                             FROM action_statut statut
                             WHERE c.id = statut.collectivite_id
                               AND (statut.action_id::text = ANY (d.leaves::text[]))) cs ON true
where est_verifie()
ORDER BY c.id, (naturalsort(d.identifiant));

-- Vue audit
create or replace view audit (id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide) as
SELECT audit.id,
       audit.collectivite_id,
       audit.referentiel,
       audit.demande_id,
       audit.date_debut,
       audit.date_fin,
       audit.valide
FROM labellisation.audit
where is_authenticated()
   or is_service_role();

-- Vue audit_en_cours
create or replace view audit_en_cours (id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide) as
SELECT a.id,
       a.collectivite_id,
       a.referentiel,
       a.demande_id,
       a.date_debut,
       a.date_fin,
       a.valide
FROM labellisation.audit a
WHERE (a.date_fin IS NULL AND now() >= a.date_debut
    OR a.date_fin IS NOT NULL AND now() >= a.date_debut AND now() <= a.date_fin)
  and est_verifie();

-- Vue auditeurs
create or replace view auditeurs(collectivite_id, audit_id, referentiel, noms) as
WITH ref AS (SELECT unnest(enum_range(NULL::referentiel)) AS referentiel)
SELECT c.id                                                                AS collectivite_id,
       a.id                                                                AS audit_id,
       a.referentiel,
       jsonb_agg(jsonb_build_object('nom', dcp.nom, 'prenom', dcp.prenom)) AS noms
FROM collectivite c
         JOIN ref ON true
         JOIN LATERAL labellisation.current_audit(c.id, ref.referentiel) a(id, collectivite_id, referentiel, demande_id, date_debut, date_fin)
              ON true
         JOIN audit_auditeur aa ON aa.audit_id = a.id
         JOIN utilisateur.dcp_display dcp ON aa.auditeur = dcp.user_id
WHERE est_verifie()
GROUP BY c.id, a.id, a.referentiel;

-- Vue audits
create or replace view audits(collectivite_id, referentiel, audit, demande, is_cot) as
WITH ref AS (SELECT unnest(enum_range(NULL::referentiel)) AS referentiel)
SELECT c.id                       AS collectivite_id,
       ref.referentiel,
       a.audit,
       d.*::labellisation.demande AS demande,
       COALESCE(cot.actif, false) AS is_cot
FROM collectivite c
         JOIN ref ON true
         LEFT JOIN LATERAL ( SELECT labellisation.current_audit(c.id, ref.referentiel) AS audit) a ON true
         LEFT JOIN labellisation.demande d ON d.id = (a.audit).demande_id
         LEFT JOIN cot ON c.id = cot.collectivite_id
where est_verifie();

-- Vue axe_descendants
create or replace view axe_descendants(axe_id, descendants, parents, depth) as
WITH RECURSIVE
    parents AS (SELECT axe.id,
                       axe.collectivite_id,
                       ARRAY []::integer[] AS parents,
                       0                   AS depth
                FROM axe
                WHERE axe.parent IS NULL
                UNION ALL
                SELECT a.id,
                       a.collectivite_id,
                       parents_1.parents || a.parent,
                       parents_1.depth + 1
                FROM parents parents_1
                         JOIN axe a ON a.parent = parents_1.id),
    descendants AS (SELECT a.id,
                           array_agg(p.id) AS descendants
                    FROM axe a
                             JOIN parents p ON a.id = ANY (p.parents)
                    GROUP BY a.id)
SELECT parents.id AS axe_id,
       descendants.descendants,
       parents.parents,
       parents.depth
FROM parents
         LEFT JOIN descendants USING (id)
where can_read_acces_restreint(parents.collectivite_id);

-- Vue bibliotheque_fichier
create or replace view bibliotheque_fichier(id, collectivite_id, hash, filename, bucket_id, file_id, filesize) as
SELECT bf.id,
       bf.collectivite_id,
       bf.hash,
       bf.filename,
       o.bucket_id,
       o.id                                   AS file_id,
       (o.metadata ->> 'size'::text)::integer AS filesize
FROM labellisation.bibliotheque_fichier bf
         JOIN collectivite_bucket cb ON cb.collectivite_id = bf.collectivite_id
         JOIN storage.objects o ON o.name = bf.hash::text AND o.bucket_id = cb.bucket_id
where can_read_acces_restreint(bf.collectivite_id);

-- Vue business_action_children
drop view if exists business_action_children;
-- Vue business_action_statut
drop view if exists business_action_statut;
-- Vue business_reponse
drop view if exists business_reponse;

-- Vue client_action_statut
create or replace view client_action_statut(collectivite_id, modified_by, action_id, avancement, concerne) as
SELECT action_statut.collectivite_id,
       action_statut.modified_by,
       action_statut.action_id,
       action_statut.avancement,
       action_statut.concerne
FROM action_statut
where est_verifie();

-- Vue comparaison_scores_audit
create or replace view comparaison_scores_audit(collectivite_id, referentiel, action_id, courant, pre_audit) as
WITH ref AS (SELECT unnest(enum_range(NULL::referentiel)) AS referentiel)
SELECT c.id                   AS collectivite_id,
       sc.referentiel,
       (sc.courant).action_id AS action_id,
       sc.courant,
       sc.pre_audit
FROM collectivite c
         JOIN ref ON true
         JOIN LATERAL private.collectivite_score_comparaison(c.id, ref.referentiel) sc(referentiel, courant, pre_audit)
              ON true
where have_lecture_acces(c.id)
   or est_support()
   or est_auditeur(c.id, sc.referentiel)
ORDER BY c.id, sc.referentiel, (naturalsort((sc.courant).action_id::text));

-- Vue departement
create or replace view departement(code, libelle, region_code) as
SELECT departement.code,
       departement.libelle,
       departement.region_code
FROM imports.departement
where is_authenticated()
ORDER BY departement.code;

-- Vue fiche_action_personne_pilote
create or replace view fiche_action_personne_pilote(collectivite_id, nom, user_id, tag_id) as
SELECT t.collectivite_id,
       t.nom,
       NULL::uuid AS user_id,
       t.id       AS tag_id
FROM personne_tag t
WHERE can_read_acces_restreint(t.collectivite_id)
UNION ALL
SELECT m.collectivite_id,
       (dcp.nom || ' '::text) || dcp.prenom AS nom,
       m.user_id,
       NULL::integer                        AS tag_id
FROM private_collectivite_membre m
         JOIN utilisateur.dcp_display dcp ON dcp.user_id = m.user_id
WHERE can_read_acces_restreint(m.collectivite_id);

-- Vue fiche_action_personne_referente
create or replace view fiche_action_personne_referente(collectivite_id, nom, user_id, tag_id) as
SELECT t.collectivite_id,
       t.nom,
       NULL::uuid AS user_id,
       t.id       AS tag_id
FROM personne_tag t
WHERE can_read_acces_restreint(t.collectivite_id)
UNION ALL
SELECT m.collectivite_id,
       (dcp.nom || ' '::text) || dcp.prenom AS nom,
       m.user_id,
       NULL::integer                        AS tag_id
FROM private_collectivite_membre m
         JOIN utilisateur.dcp_display dcp ON dcp.user_id = m.user_id
WHERE can_read_acces_restreint(m.collectivite_id);

-- Vue fiches_liees_par_fiche
create or replace view fiches_liees_par_fiche(fiche_id, fiche_liee_id) as
SELECT fal.fiche_une  AS fiche_id,
       fal.fiche_deux AS fiche_liee_id
FROM fiche_action_lien fal
         join fiche_action fa on fal.fiche_une = fa.id
where can_read_acces_restreint(fa.collectivite_id)
UNION
SELECT fal.fiche_deux AS fiche_id,
       fal.fiche_une  AS fiche_liee_id
FROM fiche_action_lien fal
         join fiche_action fa on fal.fiche_deux = fa.id
where can_read_acces_restreint(fa.collectivite_id);

-- Vue historique
create or replace view historique
            (type, collectivite_id, modified_by_id, previous_modified_by_id, modified_at, previous_modified_at,
             action_id, avancement, previous_avancement, avancement_detaille, previous_avancement_detaille, concerne,
             previous_concerne, precision, previous_precision, question_id, question_type, reponse, previous_reponse,
             justification, previous_justification, modified_by_nom, tache_identifiant, tache_nom, action_identifiant,
             action_nom, question_formulation, thematique_id, thematique_nom, action_ids)
as
SELECT 'action_statut'::text                                                  AS type,
       s.collectivite_id,
       COALESCE(s.modified_by, '99999999-9999-9999-9999-999999999999'::uuid)  AS modified_by_id,
       s.previous_modified_by                                                 AS previous_modified_by_id,
       s.modified_at,
       s.previous_modified_at,
       s.action_id,
       s.avancement,
       COALESCE(s.previous_avancement, 'non_renseigne'::avancement)           AS previous_avancement,
       s.avancement_detaille,
       s.previous_avancement_detaille,
       s.concerne,
       s.previous_concerne,
       NULL::text                                                             AS "precision",
       NULL::text                                                             AS previous_precision,
       NULL::character varying::question_id                                   AS question_id,
       NULL::question_type                                                    AS question_type,
       NULL::jsonb                                                            AS reponse,
       NULL::jsonb                                                            AS previous_reponse,
       NULL::text                                                             AS justification,
       NULL::text                                                             AS previous_justification,
       (SELECT utilisateur.modified_by_nom(s.modified_by) AS modified_by_nom) AS modified_by_nom,
       td.identifiant                                                         AS tache_identifiant,
       td.nom                                                                 AS tache_nom,
       ad.identifiant                                                         AS action_identifiant,
       ad.nom                                                                 AS action_nom,
       NULL::text                                                             AS question_formulation,
       NULL::character varying(30)                                            AS thematique_id,
       NULL::text                                                             AS thematique_nom,
       ARRAY [s.action_id]                                                    AS action_ids
FROM historique.action_statut s
         LEFT JOIN private.action_node ah ON (s.action_id::text = ANY (ah.descendants::text[])) AND ah.type = 'action'::action_type
         LEFT JOIN action_definition ad ON ah.action_id::text = ad.action_id::text
         LEFT JOIN action_definition td ON s.action_id::text = td.action_id::text
WHERE have_lecture_acces(s.collectivite_id)
   or est_support()
   or est_auditeur_action(s.collectivite_id, s.action_id)
UNION ALL
SELECT 'action_precision'::text                                               AS type,
       p.collectivite_id,
       COALESCE(p.modified_by, '99999999-9999-9999-9999-999999999999'::uuid)  AS modified_by_id,
       p.previous_modified_by                                                 AS previous_modified_by_id,
       p.modified_at,
       p.previous_modified_at,
       p.action_id,
       NULL::avancement                                                       AS avancement,
       NULL::avancement                                                       AS previous_avancement,
       NULL::numeric[]                                                        AS avancement_detaille,
       NULL::numeric[]                                                        AS previous_avancement_detaille,
       NULL::boolean                                                          AS concerne,
       NULL::boolean                                                          AS previous_concerne,
       p."precision",
       p.previous_precision,
       NULL::character varying                                                AS question_id,
       NULL::question_type                                                    AS question_type,
       NULL::jsonb                                                            AS reponse,
       NULL::jsonb                                                            AS previous_reponse,
       NULL::text                                                             AS justification,
       NULL::text                                                             AS previous_justification,
       (SELECT utilisateur.modified_by_nom(p.modified_by) AS modified_by_nom) AS modified_by_nom,
       td.identifiant                                                         AS tache_identifiant,
       td.nom                                                                 AS tache_nom,
       ad.identifiant                                                         AS action_identifiant,
       ad.nom                                                                 AS action_nom,
       NULL::text                                                             AS question_formulation,
       NULL::character varying                                                AS thematique_id,
       NULL::text                                                             AS thematique_nom,
       ARRAY [p.action_id]                                                    AS action_ids
FROM historique.action_precision p
         LEFT JOIN private.action_node ah ON (p.action_id::text = ANY (ah.descendants::text[])) AND ah.type = 'action'::action_type
         LEFT JOIN action_definition ad ON ah.action_id::text = ad.action_id::text
         LEFT JOIN action_definition td ON p.action_id::text = td.action_id::text
WHERE have_lecture_acces(p.collectivite_id)
   or est_support()
   or est_auditeur_action(p.collectivite_id, p.action_id)
UNION ALL
SELECT 'reponse'::text                                                        AS type,
       r.collectivite_id,
       COALESCE(r.modified_by, '99999999-9999-9999-9999-999999999999'::uuid)  AS modified_by_id,
       r.previous_modified_by                                                 AS previous_modified_by_id,
       r.modified_at,
       r.previous_modified_at,
       NULL::character varying                                                AS action_id,
       NULL::avancement                                                       AS avancement,
       NULL::avancement                                                       AS previous_avancement,
       NULL::numeric[]                                                        AS avancement_detaille,
       NULL::numeric[]                                                        AS previous_avancement_detaille,
       NULL::boolean                                                          AS concerne,
       NULL::boolean                                                          AS previous_concerne,
       NULL::text                                                             AS "precision",
       NULL::text                                                             AS previous_precision,
       r.question_id,
       r.question_type,
       r.reponse,
       r.previous_reponse,
       (SELECT h.texte
        FROM historique.justification h
        WHERE h.collectivite_id = r.collectivite_id
          AND h.question_id::text = r.question_id::text
          AND h.modified_at <= r.modified_at
        ORDER BY h.modified_at DESC
        LIMIT 1)                                                              AS justification,
       NULL::text                                                             AS previous_justification,
       (SELECT utilisateur.modified_by_nom(r.modified_by) AS modified_by_nom) AS modified_by_nom,
       NULL::text                                                             AS tache_identifiant,
       NULL::text                                                             AS tache_nom,
       NULL::text                                                             AS action_identifiant,
       NULL::text                                                             AS action_nom,
       q.formulation                                                          AS question_formulation,
       q.thematique_id,
       qt.nom                                                                 AS thematique_nom,
       (SELECT array_agg(question_action.action_id) AS array_agg
        FROM question_action
        WHERE question_action.question_id::text = r.question_id::text
        GROUP BY question_action.question_id)                                 AS action_ids
FROM historique.reponse_display r
         LEFT JOIN question q ON r.question_id::text = q.id::text
         LEFT JOIN question_thematique qt ON q.thematique_id::text = qt.id::text
WHERE have_lecture_acces(r.collectivite_id)
   or est_support()
   or private.est_auditeur(r.collectivite_id)
UNION ALL
SELECT 'justification'::text                                                  AS type,
       j.collectivite_id,
       COALESCE(j.modified_by, '99999999-9999-9999-9999-999999999999'::uuid)  AS modified_by_id,
       j.previous_modified_by                                                 AS previous_modified_by_id,
       j.modified_at,
       j.previous_modified_at,
       NULL::character varying                                                AS action_id,
       NULL::avancement                                                       AS avancement,
       NULL::avancement                                                       AS previous_avancement,
       NULL::numeric[]                                                        AS avancement_detaille,
       NULL::numeric[]                                                        AS previous_avancement_detaille,
       NULL::boolean                                                          AS concerne,
       NULL::boolean                                                          AS previous_concerne,
       NULL::text                                                             AS "precision",
       NULL::text                                                             AS previous_precision,
       j.question_id,
       q.type                                                                 AS question_type,
       (SELECT h.reponse
        FROM historique.reponse_display h
        WHERE h.modified_at <= j.modified_at
          AND h.collectivite_id = j.collectivite_id
          AND h.question_id::text = j.question_id::text
        ORDER BY h.modified_at DESC
        LIMIT 1)                                                              AS reponse,
       NULL::jsonb                                                            AS previous_reponse,
       j.texte                                                                AS justification,
       j.previous_texte                                                       AS previous_justification,
       (SELECT utilisateur.modified_by_nom(j.modified_by) AS modified_by_nom) AS modified_by_nom,
       NULL::text                                                             AS tache_identifiant,
       NULL::text                                                             AS tache_nom,
       NULL::text                                                             AS action_identifiant,
       NULL::text                                                             AS action_nom,
       q.formulation                                                          AS question_formulation,
       q.thematique_id,
       qt.nom                                                                 AS thematique_nom,
       (SELECT array_agg(question_action.action_id) AS array_agg
        FROM question_action
        WHERE question_action.question_id::text = j.question_id::text
        GROUP BY question_action.question_id)                                 AS action_ids
FROM historique.justification j
         LEFT JOIN question q ON q.id::text = j.question_id::text
         LEFT JOIN question_thematique qt ON q.thematique_id::text = qt.id::text
WHERE have_lecture_acces(j.collectivite_id)
   or est_support()
   or private.est_auditeur(j.collectivite_id);

-- Vue indicateurs_collectivite
create or replace view indicateurs_collectivite as
select null                         as indicateur_id,
       ipd.id                       as indicateur_personnalise_id,
       ipd.titre                    as nom,
       ipd.description,
       ipd.unite,
       null::indicateur_programme[] as programmes,
       ipd.collectivite_id
from indicateur_personnalise_definition ipd
where can_read_acces_restreint(ipd.collectivite_id)
union
select id.id  as tag_id,
       null   as indicateur_personnalise_id,
       id.nom as nom,
       id.description,
       id.unite,
       id.programmes,
       null   as collectivite_id
from indicateur_definition id;
comment on view indicateurs_collectivite is 'Liste les indicateurs (globaux et personnalisés) d''une collectivite';

-- Vue mes_collectivites
create or replace view mes_collectivites(collectivite_id, nom, niveau_acces, est_auditeur) as
SELECT collectivite_niveau_acces.collectivite_id,
       collectivite_niveau_acces.nom,
       collectivite_niveau_acces.niveau_acces,
       collectivite_niveau_acces.est_auditeur
FROM collectivite_niveau_acces
WHERE collectivite_niveau_acces.niveau_acces IS NOT NULL
   or collectivite_niveau_acces.est_auditeur
ORDER BY (unaccent(collectivite_niveau_acces.nom::text));

-- Vue ongoing_maintenance
create or replace view ongoing_maintenance(now, begins_at, ends_at) as
SELECT now() AS now,
       maintenance.begins_at,
       maintenance.ends_at
FROM maintenance
WHERE now() < maintenance.ends_at
  AND now() > maintenance.begins_at
ORDER BY maintenance.ends_at DESC
LIMIT 1;

-- Vue plan_action
create or replace view plan_action(collectivite_id, id, plan) as
SELECT a.collectivite_id,
       a.id,
       plan_action(a.id) AS plan
FROM axe a
WHERE a.parent IS NULL
  and can_read_acces_restreint(a.collectivite_id);

-- plan_action_chemin
create or replace view plan_action_chemin(plan_id, axe_id, collectivite_id, chemin) as
WITH RECURSIVE chemin_plan_action AS (SELECT axe.id        AS axe_id,
                                             axe.collectivite_id,
                                             axe.nom,
                                             axe.parent,
                                             ARRAY [axe.*] AS chemin
                                      FROM axe
                                      WHERE axe.parent IS NULL
                                      UNION ALL
                                      SELECT a.id AS axe_id,
                                             a.collectivite_id,
                                             a.nom,
                                             a.parent,
                                             p.chemin || a.*
                                      FROM axe a
                                               JOIN chemin_plan_action p ON a.parent = p.axe_id)
SELECT chemin_plan_action.chemin[1].id AS plan_id,
       chemin_plan_action.axe_id,
       chemin_plan_action.collectivite_id,
       chemin_plan_action.chemin
FROM chemin_plan_action
where can_read_acces_restreint(chemin_plan_action.collectivite_id);

-- Vue plan_action_profondeur
create or replace view plan_action_profondeur(collectivite_id, id, plan) as
SELECT a.collectivite_id,
       a.id,
       plan_action_profondeur(a.id, 0) AS plan
FROM axe a
WHERE a.parent IS NULL
  and can_read_acces_restreint(a.collectivite_id);

-- Vue preuve
create or replace view preuve
            (preuve_type, id, collectivite_id, fichier, lien, commentaire, created_at, created_by, created_by_nom,
             action, preuve_reglementaire, demande, rapport, audit)
as
SELECT 'complementaire'::preuve_type               AS preuve_type,
       pc.id,
       pc.collectivite_id,
       fs.snippet                                  AS fichier,
       pc.lien,
       pc.commentaire,
       pc.modified_at                              AS created_at,
       pc.modified_by                              AS created_by,
       utilisateur.modified_by_nom(pc.modified_by) AS created_by_nom,
       snippet.snippet                             AS action,
       NULL::jsonb                                 AS preuve_reglementaire,
       NULL::jsonb                                 AS demande,
       NULL::jsonb                                 AS rapport,
       NULL::jsonb                                 AS audit
FROM preuve_complementaire pc
         LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = pc.fichier_id
         LEFT JOIN labellisation.action_snippet snippet
                   ON snippet.action_id::text = pc.action_id::text AND snippet.collectivite_id = pc.collectivite_id
WHERE can_read_acces_restreint(pc.collectivite_id)
UNION ALL
SELECT 'reglementaire'::preuve_type                AS preuve_type,
       pr.id,
       c.id                                        AS collectivite_id,
       fs.snippet                                  AS fichier,
       pr.lien,
       pr.commentaire,
       pr.modified_at                              AS created_at,
       pr.modified_by                              AS created_by,
       utilisateur.modified_by_nom(pr.modified_by) AS created_by_nom,
       snippet.snippet                             AS action,
       to_jsonb(prd.*)                             AS preuve_reglementaire,
       NULL::jsonb                                 AS demande,
       NULL::jsonb                                 AS rapport,
       NULL::jsonb                                 AS audit
FROM collectivite c
         LEFT JOIN preuve_reglementaire_definition prd ON true
         LEFT JOIN preuve_reglementaire pr ON prd.id::text = pr.preuve_id::text AND c.id = pr.collectivite_id
         LEFT JOIN preuve_action pa ON prd.id::text = pa.preuve_id::text
         LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = pr.fichier_id
         LEFT JOIN labellisation.action_snippet snippet
                   ON snippet.action_id::text = pa.action_id::text AND snippet.collectivite_id = c.id
WHERE can_read_acces_restreint(c.id)
UNION ALL
SELECT 'labellisation'::preuve_type               AS preuve_type,
       p.id,
       d.collectivite_id,
       fs.snippet                                 AS fichier,
       p.lien,
       p.commentaire,
       p.modified_at                              AS created_at,
       p.modified_by                              AS created_by,
       utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
       NULL::jsonb                                AS action,
       NULL::jsonb                                AS preuve_reglementaire,
       to_jsonb(d.*)                              AS demande,
       NULL::jsonb                                AS rapport,
       NULL::jsonb                                AS audit
FROM labellisation.demande d
         JOIN preuve_labellisation p ON p.demande_id = d.id
         LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id
WHERE can_read_acces_restreint(d.collectivite_id)
UNION ALL
SELECT 'rapport'::preuve_type                     AS preuve_type,
       p.id,
       p.collectivite_id,
       fs.snippet                                 AS fichier,
       p.lien,
       p.commentaire,
       p.modified_at                              AS created_at,
       p.modified_by                              AS created_by,
       utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
       NULL::jsonb                                AS action,
       NULL::jsonb                                AS preuve_reglementaire,
       NULL::jsonb                                AS demande,
       to_jsonb(p.*)                              AS rapport,
       NULL::jsonb                                AS audit
FROM preuve_rapport p
         LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id
WHERE can_read_acces_restreint(p.collectivite_id)
UNION ALL
SELECT 'audit'::preuve_type                       AS preuve_type,
       p.id,
       a.collectivite_id,
       fs.snippet                                 AS fichier,
       p.lien,
       p.commentaire,
       p.modified_at                              AS created_at,
       p.modified_by                              AS created_by,
       utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
       NULL::jsonb                                AS action,
       NULL::jsonb                                AS preuve_reglementaire,
       CASE
           WHEN d.id IS NOT NULL THEN to_jsonb(d.*)
           ELSE NULL::jsonb
           END                                    AS demande,
       NULL::jsonb                                AS rapport,
       to_jsonb(a.*)                              AS audit
FROM audit a
         JOIN preuve_audit p ON p.audit_id = a.id
         LEFT JOIN labellisation.demande d ON a.demande_id = d.id
         LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id
WHERE can_read_acces_restreint(a.collectivite_id);

-- Vue question_display
create or replace view question_display
            (id, action_ids, collectivite_id, thematique_id, type, thematique_nom, description,
             types_collectivites_concernees, formulation, ordonnancement, choix, population, localisation)
as
WITH actions AS (SELECT question_action.question_id,
                        array_agg(question_action.action_id) AS action_ids
                 FROM question_action
                 GROUP BY question_action.question_id),
     q AS (SELECT q_1.id,
                  a.action_ids,
                  q_1.thematique_id,
                  q_1.type,
                  t.nom   AS thematique_nom,
                  q_1.description,
                  q_1.types_collectivites_concernees,
                  q_1.formulation,
                  q_1.ordonnancement,
                  cx.json AS choix
           FROM question q_1
                    JOIN question_thematique t ON t.id::text = q_1.thematique_id::text
                    JOIN actions a ON q_1.id::text = a.question_id::text
                    LEFT JOIN LATERAL ( SELECT array_agg(json_build_object('id', c.id, 'label', c.formulation,
                                                                           'ordonnancement', c.ordonnancement)) AS json
                                        FROM question_choix c
                                        WHERE c.question_id::text = q_1.id::text) cx ON true)
SELECT q.id,
       q.action_ids,
       i.id AS collectivite_id,
       q.thematique_id,
       q.type,
       q.thematique_nom,
       q.description,
       q.types_collectivites_concernees,
       q.formulation,
       q.ordonnancement,
       q.choix,
       i.population,
       i.localisation
FROM q
         JOIN collectivite_identite i
              ON q.types_collectivites_concernees && i.type OR q.types_collectivites_concernees IS NULL
where est_verifie();

-- Vue question_engine
drop view if exists question_engine;

-- Vue question_thematique_completude
create or replace view question_thematique_completude(collectivite_id, id, nom, referentiels, completude) as
WITH any_reponse AS (SELECT q.id                                                                 AS question_id,
                            q.thematique_id,
                            COALESCE(rb.collectivite_id, rp.collectivite_id, rc.collectivite_id) AS collectivite_id
                     FROM question q
                              LEFT JOIN reponse_binaire rb ON rb.question_id::text = q.id::text
                              LEFT JOIN reponse_proportion rp ON rp.question_id::text = q.id::text
                              LEFT JOIN reponse_choix rc ON rc.question_id::text = q.id::text),
     reponse_thematique_count AS (SELECT ar.thematique_id,
                                         ar.collectivite_id,
                                         count(*) AS count
                                  FROM any_reponse ar
                                  GROUP BY ar.thematique_id, ar.collectivite_id)
SELECT c.id    AS collectivite_id,
       qtd.id,
       qtd.nom,
       qtd.referentiels,
       CASE
           WHEN rtc.count = private.question_count_for_thematique(c.id, rtc.thematique_id) THEN 'complete'::thematique_completude
           ELSE 'a_completer'::thematique_completude
           END AS completude
FROM collectivite c
         LEFT JOIN question_thematique qt ON true
         LEFT JOIN reponse_thematique_count rtc ON rtc.thematique_id::text = qt.id::text AND rtc.collectivite_id = c.id
         LEFT JOIN question_thematique_display qtd ON qtd.id::text = qt.id::text
WHERE qtd.referentiels IS NOT NULL
  and est_verifie()
ORDER BY (
             CASE
                 WHEN qtd.id::text = 'identite'::text THEN '0'::text
                 ELSE qtd.nom
                 END);

-- Vue question_thematique_display
create or replace view question_thematique_display(id, nom, referentiels) as
WITH qt AS (SELECT qa.action_id,
                   q.thematique_id
            FROM question_action qa
                     JOIN question q ON qa.question_id::text = q.id::text),
     qr AS (SELECT qt.thematique_id,
                   array_agg(DISTINCT r.referentiel) AS referentiels
            FROM qt
                     JOIN action_relation r ON r.id::text = qt.action_id::text
            GROUP BY qt.thematique_id)
SELECT t.id,
       t.nom,
       qr.referentiels
FROM question_thematique t
         LEFT JOIN qr ON qr.thematique_id::text = t.id::text
where est_verifie();

-- Vue region
create or replace view region(code, libelle) as
SELECT region.code,
       region.libelle
FROM imports.region
where is_authenticated()
ORDER BY (unaccent(region.libelle::text));

-- Vue reponse_display
create or replace view reponse_display(collectivite_id, question_id, reponse, justification) as
SELECT r.collectivite_id,
       q.id                                              AS question_id,
       json_build_object('question_id', q.id, 'collectivite_id', r.collectivite_id, 'type', q.type, 'reponse',
                         r.reponse)                      AS reponse,
       (SELECT j.texte
        FROM justification j
        WHERE j.collectivite_id = r.collectivite_id
          AND j.question_id::text = r.question_id::text) AS justification
FROM reponse_binaire r
         JOIN question q ON r.question_id::text = q.id::text
WHERE est_verifie()
UNION ALL
SELECT r.collectivite_id,
       q.id                                              AS question_id,
       json_build_object('question_id', q.id, 'collectivite_id', r.collectivite_id, 'type', q.type, 'reponse',
                         r.reponse)                      AS reponse,
       (SELECT j.texte
        FROM justification j
        WHERE j.collectivite_id = r.collectivite_id
          AND j.question_id::text = r.question_id::text) AS justification
FROM reponse_proportion r
         JOIN question q ON r.question_id::text = q.id::text
WHERE est_verifie()
UNION ALL
SELECT r.collectivite_id,
       q.id                                              AS question_id,
       json_build_object('question_id', q.id, 'collectivite_id', r.collectivite_id, 'type', q.type, 'reponse',
                         r.reponse)                      AS reponse,
       (SELECT j.texte
        FROM justification j
        WHERE j.collectivite_id = r.collectivite_id
          AND j.question_id::text = r.question_id::text) AS justification
FROM reponse_choix r
         JOIN question q ON r.question_id::text = q.id::text
WHERE est_verifie();


-- Vue suivi_audit
create or replace view suivi_audit
            (collectivite_id, referentiel, action_id, have_children, type, statut, statuts, avis, ordre_du_jour,
             ordres_du_jour)
as
SELECT c.id                                           AS collectivite_id,
       ah.referentiel,
       ah.action_id,
       ah.have_children,
       ah.type,
       COALESCE(s.statut, 'non_audite'::audit_statut) AS statut,
       cs.statuts,
       s.avis,
       s.ordre_du_jour,
       cs.ordres_du_jour
FROM collectivite c
         JOIN private.action_hierarchy ah ON true
         LEFT JOIN action_audit_state s ON s.action_id::text = ah.action_id::text AND s.collectivite_id = c.id
         LEFT JOIN LATERAL ( SELECT CASE
                                        WHEN s.statut IS NULL THEN COALESCE(array_agg(DISTINCT aas.statut),
                                                                            '{non_audite}'::audit_statut[])
                                        ELSE '{}'::audit_statut[]
                                        END AS statuts,
                                    CASE
                                        WHEN s.statut IS NULL
                                            THEN COALESCE(array_agg(DISTINCT aas.ordre_du_jour), '{f}'::boolean[])
                                        ELSE '{}'::boolean[]
                                        END AS ordres_du_jour
                             FROM action_audit_state aas
                                      JOIN private.action_hierarchy iah ON iah.action_id::text = aas.action_id::text
                             WHERE aas.collectivite_id = c.id
                               AND iah.type = 'action'::action_type
                               AND (aas.action_id::text = ANY (ah.descendants::text[]))) cs ON true
WHERE (ah.type = 'axe'::action_type
    OR ah.type = 'sous-axe'::action_type
    OR ah.type = 'action'::action_type)
  and (have_lecture_acces(c.id)
    or est_support()
    or est_auditeur_action(c.id, ah.action_id))
ORDER BY (naturalsort(ah.action_id::text));

COMMIT;
