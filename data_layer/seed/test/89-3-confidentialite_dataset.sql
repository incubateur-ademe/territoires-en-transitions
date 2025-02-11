-- Fonction qui créé un utilisateur test pour les tests CRUD
create or replace function private.confidentialite_init_test_create_user(
    collectivite_id integer,
    profil confidentialite_profil
) returns void as
$$
declare
    id uuid;
    prenom text;
    nom text;
    email text;
    demande labellisation.demande;
begin
    if (profil = 'public') then
        return;
    end if;
    id = gen_random_uuid();
    prenom = 'prenom';
    nom = profil;
    if(profil in ('lecture','edition','admin','auditeur')) then
        nom = concat(nom, '_', collectivite_id);
    end if;
    email = concat(prenom, '@', nom, '.com');
    perform test_create_user(id, prenom, nom, email);
    update utilisateur_verifie set verifie = true where user_id = id;
    case
        when profil = 'connecte' then
            update utilisateur_verifie set verifie = false where user_id = id;
        when profil = 'support' then
            update utilisateur_support set support = true where user_id = id;
        when profil = 'lecture' then
            perform test_attach_user(id, collectivite_id, 'lecture');
        when profil = 'edition' then
            perform test_attach_user(id, collectivite_id, 'edition');
        when profil = 'admin' then
            perform test_attach_user(id, collectivite_id, 'admin');
        when profil = 'auditeur' then
            perform test_set_auditeur(
                    (select demande_id
                     from labellisation.current_audit(collectivite_id, 'eci')),
                    id);
        else
        end case;
    if profil in ('lecture', 'edition', 'admin') then
        insert into private_collectivite_membre (user_id, collectivite_id, fonction)
        values (id, collectivite_id, 'conseiller'::membre_fonction);
    end if;
end;
$$ language plpgsql security definer;
comment on function private.confidentialite_init_test_create_user
    is 'Fonction qui créé un utilisateur test pour les tests CRUD';

-- Fonction qui génère des données pour une collectivité donnée
create or replace function private.confidentialite_init_test_collectivite(
    collectivite_id integer,
    en_audit boolean,
    restreint boolean
)returns void as
$$
declare
    colid integer;
    current_audit labellisation.audit;
    current_audit_cae labellisation.audit;
begin
    colid = collectivite_id;
    -- LABELLISATION --
    -- demande & audit
    select *
    into current_audit
    from labellisation.current_audit(colid, 'eci');
    if current_audit.demande_id is null
    then
        with demande as (
            insert into labellisation.demande (collectivite_id, referentiel, etoiles, sujet)
                values (colid, 'eci', null, 'cot')
                returning id),
             audit as (
                 update labellisation.audit
                     set demande_id = demande.id
                     from demande
                     where audit.id = current_audit.id
                     returning *)
        select audit.*
        from audit
        into current_audit;
    end if;
    if en_audit then
        update labellisation.audit set date_debut = now() where id = current_audit.id;
        -- action_audit_state
        insert into labellisation.action_audit_state (audit_id, action_id, collectivite_id, modified_by)
        values (current_audit.id, 'eci_2.1', colid, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    end if;
    if restreint then
        perform test_changer_acces_restreint_collectivite(collectivite_id, true);
    end if;

    select *
    into current_audit_cae
    from labellisation.current_audit(colid, 'cae');
    if current_audit_cae.demande_id is null
    then
        with demande as (
            insert into labellisation.demande (collectivite_id, referentiel, etoiles, sujet)
                values (colid, 'cae', null, 'cot')
                returning id),
             audit as (
                 update labellisation.audit
                     set demande_id = demande.id
                     from demande
                     where audit.id = current_audit_cae.id
                     returning *)
        select audit.*
        from audit
        into current_audit_cae;
    end if;

    -- REFERENTIEL --
    -- action_commentaire
    insert into action_commentaire(collectivite_id, action_id, commentaire, modified_by)
    values (colid, 'eci_2.1', 'commentaire', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    -- action_statut
    insert into action_statut (collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
    values (colid, 'eci_1.1.1.1', 'fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    -- score
    perform evaluation.update_late_collectivite_scores(20);
    -- pre_audit_scores
    insert into  pre_audit_scores (collectivite_id, referentiel, scores, modified_at, payload_timestamp, audit_id)
    values (colid, 'eci', '[
      {
        "concerne": true,
        "action_id": "eci_2.1.2.2",
        "desactive": false,
        "point_fait": 0.0,
        "point_pas_fait": 0.0,
        "point_potentiel": 0.5,
        "point_programme": 0.0,
        "point_referentiel": 0.5,
        "total_taches_count": 1,
        "point_non_renseigne": 0.5,
        "point_potentiel_perso": null,
        "completed_taches_count": 0,
        "fait_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_concerne_taches_avancement": 0
      },
      {
        "concerne": true,
        "action_id": "eci_2.1.1.1",
        "desactive": false,
        "point_fait": 0.0,
        "point_pas_fait": 0.0,
        "point_potentiel": 0.225,
        "point_programme": 0.0,
        "point_referentiel": 0.225,
        "total_taches_count": 1,
        "point_non_renseigne": 0.225,
        "point_potentiel_perso": null,
        "completed_taches_count": 0,
        "fait_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_concerne_taches_avancement": 0
      },
      {
        "concerne": true,
        "action_id": "eci_1.2.1.1",
        "desactive": false,
        "point_fait": 0.0,
        "point_pas_fait": 0.0,
        "point_potentiel": 0.5,
        "point_programme": 0.0,
        "point_referentiel": 0.3,
        "total_taches_count": 1,
        "point_non_renseigne": 0.5,
        "point_potentiel_perso": null,
        "completed_taches_count": 0,
        "fait_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_concerne_taches_avancement": 0
      },
      {
        "concerne": true,
        "action_id": "eci_1.1.1.1",
        "desactive": false,
        "point_fait": 0.0,
        "point_pas_fait": 0.0,
        "point_potentiel": 0.8,
        "point_programme": 0.0,
        "point_referentiel": 0.8,
        "total_taches_count": 1,
        "point_non_renseigne": 0.8,
        "point_potentiel_perso": null,
        "completed_taches_count": 0,
        "fait_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_concerne_taches_avancement": 0
      },
      {
        "concerne": true,
        "action_id": "eci",
        "desactive": false,
        "point_fait": 0.0,
        "point_pas_fait": 0.0,
        "point_potentiel": 500.0,
        "point_programme": 0.0,
        "point_referentiel": 500.0,
        "total_taches_count": 274,
        "point_non_renseigne": 500.0,
        "point_potentiel_perso": null,
        "completed_taches_count": 9,
        "fait_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_concerne_taches_avancement": 9}
    ]', '2023-07-10 15:38:33.762349 +00:00', '2023-07-10 15:38:33.290872 +00:00', current_audit.id);
    -- post_audit_scores
    insert into  post_audit_scores (collectivite_id, referentiel, scores, modified_at, payload_timestamp, audit_id)
    values (colid, 'eci', '[
      {
        "concerne": true,
        "action_id": "eci_2.1.2.2",
        "desactive": false,
        "point_fait": 0.0,
        "point_pas_fait": 0.0,
        "point_potentiel": 1.0,
        "point_programme": 0.0,
        "point_referentiel": 1.0,
        "total_taches_count": 1,
        "point_non_renseigne": 1.0,
        "point_potentiel_perso": null,
        "completed_taches_count": 0,
        "fait_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_concerne_taches_avancement": 0
      },
      {
        "concerne": true,
        "action_id": "eci_2.1.1.1",
        "desactive": false,
        "point_fait": 0.0,
        "point_pas_fait": 0.0,
        "point_potentiel": 0.571,
        "point_programme": 0.0,
        "point_referentiel": 0.571,
        "total_taches_count": 1,
        "point_non_renseigne": 0.571,
        "point_potentiel_perso": null,
        "completed_taches_count": 0,
        "fait_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_concerne_taches_avancement": 0
      },
      {
        "concerne": true,
        "action_id": "eci_1.2.1.1",
        "desactive": false,
        "point_fait": 0.0,
        "point_pas_fait": 0.0,
        "point_potentiel": 1.0,
        "point_programme": 0.0,
        "point_referentiel": 0.6,
        "total_taches_count": 1,
        "point_non_renseigne": 1.0,
        "point_potentiel_perso": null,
        "completed_taches_count": 0,
        "fait_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_concerne_taches_avancement": 0
      },
      {
        "concerne": true,
        "action_id": "eci_1.1.1.1",
        "desactive": false,
        "point_fait": 0.0,
        "point_pas_fait": 0.0,
        "point_potentiel": 2.0,
        "point_programme": 0.0,
        "point_referentiel": 2.0,
        "total_taches_count": 1,
        "point_non_renseigne": 2.0,
        "point_potentiel_perso": null,
        "completed_taches_count": 0,
        "fait_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_concerne_taches_avancement": 0
      },
      {
        "concerne": true,
        "action_id": "eci_5.2.2.4",
        "desactive": false,
        "point_fait": 0.0,
        "point_pas_fait": 0.0,
        "point_potentiel": 1.714,
        "point_programme": 0.0,
        "point_referentiel": 1.714,
        "total_taches_count": 1,
        "point_non_renseigne": 1.714,
        "point_potentiel_perso": null,
        "completed_taches_count": 0,
        "fait_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_concerne_taches_avancement": 0
      },
      {
        "concerne": true,
        "action_id": "eci",
        "desactive": false,
        "point_fait": 0.0,
        "point_pas_fait": 0.0,
        "point_potentiel": 500.0,
        "point_programme": 0.0,
        "point_referentiel": 500.0,
        "total_taches_count": 274,
        "point_non_renseigne": 500.0,
        "point_potentiel_perso": null,
        "completed_taches_count": 9,
        "fait_taches_avancement": 0,
        "pas_fait_taches_avancement": 0,
        "programme_taches_avancement": 0,
        "pas_concerne_taches_avancement": 9}
    ]', '2023-07-10 15:38:33.762349 +00:00', '2023-07-10 15:38:33.290872 +00:00', current_audit.id);
    -- labellisation
    insert into labellisation (collectivite_id, referentiel, obtenue_le, etoiles, score_realise, score_programme)
    values (colid, 'eci', now(), 1, 1.0, 1.0);


    -- PREUVE --
    if en_audit then
        insert into preuve_audit(collectivite_id, fichier_id, url, audit_id, modified_by)
        values (colid,
                null,
                '',
                (select id from labellisation.audit where id = current_audit.id),
                '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    end if;
    -- preuve_complementaire
    alter table preuve_complementaire disable trigger modified_by;
    insert into preuve_complementaire(collectivite_id, fichier_id, url, action_id, modified_by)
    values (colid, null, '', 'eci_2.1', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    alter table preuve_complementaire enable trigger modified_by;
    -- preuve_labellisation
    alter table preuve_labellisation disable trigger modified_by;
    insert into preuve_labellisation(collectivite_id, fichier_id, url, demande_id, modified_by)
    values (colid, null, '', current_audit.demande_id, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    alter table preuve_labellisation enable trigger modified_by;
    -- preuve_rapport
    alter table preuve_rapport disable trigger modified_by;
    insert into preuve_rapport(collectivite_id, fichier_id, url, date, modified_by)
    values (colid, null, '', now(), '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    alter table preuve_rapport enable trigger modified_by;
    -- preuve_reglementaire
    alter table preuve_reglementaire disable trigger modified_by;
    insert into preuve_reglementaire(collectivite_id, fichier_id, url, preuve_id, modified_by)
    values (colid, null, '', 'CEP', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    alter table preuve_reglementaire enable trigger modified_by;
    -- fichier
    insert into storage.objects (bucket_id, name, owner, metadata)
    select bucket_id,
           'e9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9',
           '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
           jsonb_build_object('size', 34, 'mimetype', '*/*', 'cacheControl', 'no-cache')
    from collectivite_bucket cb
    where cb.collectivite_id = colid;
    insert into storage.objects (bucket_id, name, owner, metadata)
    select bucket_id,
           'e9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b8',
           '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
           jsonb_build_object('size', 34, 'mimetype', '*/*', 'cacheControl', 'no-cache')
    from collectivite_bucket cb
    where cb.collectivite_id = colid;

    insert into labellisation.bibliotheque_fichier(collectivite_id, hash, filename)
    values (colid,
            'e9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9',
            'yo.pdf');

    -- COMMENTAIRE --
    -- action_discussion -> discussion_id
    insert into action_discussion (id, collectivite_id, action_id, created_by)
    values (colid, colid, 'eci_2.1', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    -- action_discussion_commentaire
    insert into action_discussion_commentaire(id, discussion_id, message, created_by)
    values (colid, colid, 'commentaire', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');

    -- INDICATEUR --
    -- indicateur_resultat
    insert into indicateur_resultat(modified_at, valeur, annee, collectivite_id, indicateur_id)
    values (now(), 1.0, 2020, colid, 'eci_5');
    -- indicateur_objectif
    insert into indicateur_objectif(modified_at, valeur, annee, collectivite_id, indicateur_id)
    values (now(), 1.0, 2020, colid, 'eci_5');
    --indicateur_objectif_commentaire
    alter table indicateur_objectif_commentaire disable trigger modified_by;
    insert into indicateur_objectif_commentaire (collectivite_id, indicateur_id, annee, commentaire, modified_by, modified_at)
    values (colid, 'eci_5', 2020, 'test', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', now());
    alter table indicateur_objectif_commentaire enable trigger modified_by;
    -- indicateur_resultat_commentaire
    insert into indicateur_resultat_commentaire(collectivite_id, indicateur_id, commentaire, modified_by, modified_at)
    values (colid, 'eci_5', 'test', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', now());
    -- indicateur_resultat_import
    insert into indicateur_resultat_import(collectivite_id, indicateur_id, annee, valeur, source, source_id, modified_at)
    values (colid, 'eci_5', 2020, 1.0, 'source', 'citepa', now());
    -- indicateur_personnalise_definition (2ème valeur pour insert un nouveau indicateur_personnalise_objectif)
    insert into indicateur_personnalise_definition(id, collectivite_id, titre, description, unite, commentaire, modified_by)
    values (colid, colid, 'titre', 'description', 'unite', 'commentaire', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
           (colid*10, colid, 'titre', 'description', 'unite', 'commentaire', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    -- indicateur_personnalise_objectif
    insert into indicateur_personnalise_objectif (modified_at, valeur, annee, collectivite_id, indicateur_id)
    values (now(), 1.0, 2020, colid, colid);
    -- indicateur_personnalise_resultat
    insert into indicateur_personnalise_resultat(modified_at, valeur, annee, collectivite_id, indicateur_id)
    values (now(), 1.0, 2020, colid, colid);
    -- indicateur_perso_objectif_commentaire
    alter table indicateur_perso_objectif_commentaire disable trigger modified_by;
    insert into indicateur_perso_objectif_commentaire(collectivite_id, indicateur_id, annee, commentaire, modified_by, modified_at)
    values (colid, colid, 2020, 'test', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', now());
    alter table indicateur_perso_objectif_commentaire enable trigger modified_by;
    alter table indicateur_perso_resultat_commentaire disable trigger modified_by;
    insert into indicateur_perso_resultat_commentaire(collectivite_id, indicateur_id, annee, commentaire, modified_by, modified_at)
    values (colid, colid, 2020, 'test', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', now());
    alter table indicateur_perso_resultat_commentaire enable trigger modified_by;
    insert into indicateur_artificialisation(collectivite_id, total, activite, habitat, mixte, routiere, ferroviaire, inconnue)
    values (colid, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
    on conflict do nothing;
    -- Suite indicateur après plan action

    -- PLAN ACTION --
    -- fiche_action -> fiche_id (2ème valeur pour les inserts des tables liées)
    insert into fiche_action (id, collectivite_id)
    values (colid, colid),
           (colid*10, colid),
           -- fiche_action -> fiche_une
           (colid*10+1, colid),
           (colid*10+3, colid),
           -- fiche_action -> fiche_deux
           (colid*10+2, colid),
           (colid*10+4, colid);
    -- axe -> axe_id (2ème valeur pour un nouveau insert de fiche_action_axe)
    insert into axe (id, collectivite_id, nom, type)
    values (colid, colid, 'plan', 1),
           (colid*10, colid, 'plan', 1);
    -- fiche_action_axe
    insert into fiche_action_axe(fiche_id, axe_id) values (colid, colid);
    -- financeur_tag -> financeur_tag_id (2ème valeur pour un nouveau insert de fiche_action_financeur_tag)
    insert into financeur_tag (id, nom, collectivite_id)
    values (colid, 'financeur', colid),
           (colid*10, 'financeur_', colid);
    -- fiche_action_financeur_tag
    insert into fiche_action_financeur_tag(fiche_id, financeur_tag_id, montant_ttc) values (colid, colid, 100);
    -- partenaire_tag -> partenaire_tag_id (2ème valeur pour un nouveau insert de fiche_action_partenaire_tag)
    insert into partenaire_tag (id, nom, collectivite_id)
    values (colid, 'partenaire', colid),
           (colid*10, 'partenaire_', colid);
    -- fiche_action_partenaire_tag
    insert into fiche_action_partenaire_tag (fiche_id, partenaire_tag_id) values (colid, colid);
    -- service_tag -> service_tag_id (2ème valeur pour un nouveau insert de fiche_action_service_tag)
    insert into service_tag (id, nom, collectivite_id)
    values (colid, 'service', colid),
           (colid*10, 'service_', colid);
    -- fiche_action_service_tag
    insert into fiche_action_service_tag (fiche_id, service_tag_id) values (colid, colid);
    -- structure_tag -> structure_tag_id (2ème valeur pour un nouveau insert de fiche_action_structure_tag)
    insert into structure_tag (id, nom, collectivite_id)
    values (colid, 'structure', colid),
           (colid*10, 'structure_', colid);
    -- fiche_action_structure_tag
    insert into fiche_action_structure_tag (fiche_id, structure_tag_id) values (colid, colid);
    -- personne_tag (2ème valeur pour un nouveau insert de fiche_action_pilote et fiche_action_referent)
    insert into personne_tag (id, nom, collectivite_id)
    values (colid, 'personne', colid),
           (colid*10, 'personne_', colid);
    -- fiche_action_pilote
    insert into fiche_action_pilote(fiche_id, user_id, tag_id) values (colid, null, colid);
    -- fiche_action_referent
    insert into fiche_action_referent(fiche_id, user_id, tag_id) values (colid, null, colid);
    -- annexe
    insert into annexe (collectivite_id, fichier_id, url, fiche_id, modified_by)
    values (colid, null, '', colid, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    -- fiche_action_action
    insert into fiche_action_action (fiche_id, action_id) values(colid, 'eci_2.1');
    -- fiche_action_indicateur
    insert into fiche_action_indicateur(fiche_id, indicateur_id, indicateur_personnalise_id)
    values (colid, null, colid);
    insert into fiche_action_indicateur(fiche_id, indicateur_id, indicateur_personnalise_id)
    values (colid, 'eci_5', null);
    insert into fiche_action_indicateur(fiche_id, indicateur_id, indicateur_personnalise_id)
    values (colid*10, 'eci_5', null);
    -- fiche_action_lien
    insert into fiche_action_lien(fiche_une, fiche_deux) values (colid*10+1, colid*10+2);
    -- fiche_action_thematique
    insert into fiche_action_thematique(fiche_id, thematique_id) values (colid, 5);
    -- fiche_action_sous_thematique
    insert into fiche_action_sous_thematique(fiche_id, thematique_id) values (colid, 44);

    -- PERSONNALISATION
    -- reponse_binaire
    insert into reponse_binaire(collectivite_id, question_id, reponse) values (colid, 'dechets_1', true);
    -- reponse_choix
    insert into reponse_choix(collectivite_id, question_id, reponse) values (colid, 'EP_1', 'EP_1_b');
    -- reponse_proportion
    insert into reponse_proportion(collectivite_id, question_id, reponse) values (colid, 'habitat_2', 1.0);
    -- justification
    alter table justification disable trigger modified_by;
    insert into justification(collectivite_id, question_id, texte, modified_at, modified_by)
    values (colid, 'dechets_1', 'texte', now(), '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    alter table justification enable trigger modified_by;
    -- justification_ajustement
    alter table justification_ajustement disable trigger modified_by;
    insert into justification_ajustement (collectivite_id, action_id, texte, modified_at, modified_by)
    values (colid, 'eci_2.1','texte', now(), '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    alter table justification_ajustement enable trigger modified_by;

    -- INDICATEURS 2
-- indicateur_pilote
    alter table indicateur_pilote disable trigger rewrite_indicateur_id;
    insert into indicateur_pilote (indicateur_id, collectivite_id, user_id, tag_id)
    values ('eci_5', colid, null, colid);
    alter table indicateur_pilote enable trigger rewrite_indicateur_id;
    -- indicateur_service_tag
    insert into indicateur_service_tag(indicateur_id, collectivite_id, service_tag_id)
    values ('eci_5', colid, colid);
    -- indicateur_personnalise_thematique
    insert into indicateur_personnalise_thematique (indicateur_id, thematique_id)
    values (colid, 5);
    -- indicateur_confidentiel
    insert into indicateur_confidentiel (indicateur_id, indicateur_perso_id, collectivite_id)
    values ('eci_7', null, colid);

    -- AUTRE
    -- cot
    insert into cot(collectivite_id, actif, signataire)
    values (colid, true, null);
    -- geojson
    insert into stats.epci_geojson (siren, raison_sociale, nature_juridique, geojson)
    select e.siren as siren, e.nom as raison_sociale, e.nature as nature_juridique,
           '{}' as geojson
    from epci e
    where e.collectivite_id = colid
    on conflict do nothing;
    insert into stats.commune_geojson (insee, libelle, geojson)
    select c.code as insee, c.nom as libelle,
           '{}' as geojson
    from commune c
    where c.collectivite_id = colid
    on conflict do nothing ;
    insert into stats.region_geojson (insee, libelle, geojson)
    values ('76', 'Occitanie', '{}')
    on conflict do nothing ;
end;
$$language plpgsql security definer;
comment on function private.confidentialite_init_test_collectivite
    is 'Fonction qui génère des données pour une collectivité donnée';


-- Fonction qui créé un jeu de données pour les tests CRUD
create or replace function confidentialite_init_test()
    returns void as
$$
declare
    profils confidentialite_profil[];
    profil confidentialite_profil;
    demande labellisation.demande;
    id uuid;
begin
    -- Génère des données pour chaque collectivité de test
    -- Collectivité A (500)
    perform private.confidentialite_init_test_collectivite(500, false, false);
    -- Collectivité B en audit (501)
    perform private.confidentialite_init_test_collectivite(501, true, false);
    -- Collectivité C en audit et restreinte (502)
    perform private.confidentialite_init_test_collectivite(502, true, true);
    -- Collectivité test
    perform test_create_collectivite('coltest');

    -- Crée des utilisateurs pour chaque profil et les rattaches aux collectivités de test
    profils = '{public, connecte, verifie, support,
               lecture, edition, admin, auditeur}';
    foreach profil in array profils
        loop
            if(profil in ('lecture','edition','admin','auditeur')) then
                perform private.confidentialite_init_test_create_user(500, profil);
                perform private.confidentialite_init_test_create_user(501, profil);
                perform private.confidentialite_init_test_create_user(502, profil);
            else
                perform private.confidentialite_init_test_create_user(0, profil);
            end if;
        end loop;
    -- Créer un utilisateur autre que l'admin peut manipuler
    id = '83110e7a-44be-4d8a-a5ab-37cf46989d9e';
    perform test_create_user(id, 'prenom', 'nom', 'prenom.nom@mail.fr');
    perform test_attach_user(id, 500, 'lecture');
    perform test_attach_user(id, 501, 'lecture');
    perform test_attach_user(id, 502, 'lecture');
    insert into private_collectivite_membre (user_id, collectivite_id, fonction)
    values (id, 500, 'partenaire'::membre_fonction),
           (id, 501, 'partenaire'::membre_fonction),
           (id, 502, 'partenaire'::membre_fonction);
end;
$$language plpgsql security definer;
comment on function private.confidentialite_init_test_collectivite
    is 'Fonction qui créé un jeu de données pour les tests CRUD';

