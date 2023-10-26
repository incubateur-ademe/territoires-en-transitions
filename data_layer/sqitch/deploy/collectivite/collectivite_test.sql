-- Deploy tet:collectivite/collectivite_test to pg

BEGIN;


create or replace function delete_collectivite_test(collectivite_id integer) returns void
    language plpgsql
    security definer
as
$$
begin

    if not is_service_role() then
        perform set_config('response.status', '401', true);
        raise 'Seul le service role peut supprimer une collectivité test';
    end if;
    if(select count(*)=0 from collectivite_test where collectivite_test.collectivite_id = delete_collectivite_test.collectivite_id) then
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
    delete from indicateur_resultat_commentaire where indicateur_resultat_commentaire.collectivite_id = delete_collectivite_test.collectivite_id;
    delete from indicateur_objectif_commentaire where indicateur_objectif_commentaire.collectivite_id = delete_collectivite_test.collectivite_id;
    delete from indicateur_resultat where indicateur_resultat.collectivite_id = delete_collectivite_test.collectivite_id;
    delete from indicateur_resultat_import where indicateur_resultat_import.collectivite_id = delete_collectivite_test.collectivite_id;
    delete from indicateur_objectif where indicateur_objectif.collectivite_id = delete_collectivite_test.collectivite_id;
    delete from indicateur_personnalise_resultat where indicateur_personnalise_resultat.collectivite_id = delete_collectivite_test.collectivite_id;
    delete from indicateur_perso_resultat_commentaire where indicateur_perso_resultat_commentaire.collectivite_id = delete_collectivite_test.collectivite_id;
    delete from indicateur_perso_objectif_commentaire where indicateur_perso_objectif_commentaire.collectivite_id = delete_collectivite_test.collectivite_id;
    delete from indicateur_personnalise_resultat where indicateur_personnalise_resultat.collectivite_id = delete_collectivite_test.collectivite_id;
    delete from indicateur_personnalise_objectif where indicateur_personnalise_objectif.collectivite_id = delete_collectivite_test.collectivite_id;
    delete from indicateur_personnalise_definition where indicateur_personnalise_definition.collectivite_id = delete_collectivite_test.collectivite_id;

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
