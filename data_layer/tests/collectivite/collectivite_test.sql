begin;

select plan(2);

-- Création collectivité test
insert into collectivite_test (nom) values ('testsql');
select ok((select count(*) = 1 from collectivite_test where nom = 'testsql'));

-- Ajout données
insert into action_commentaire(collectivite_id, action_id, commentaire, modified_by)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'eci_2.1', 'commentaire', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
-- action_statut
insert into action_statut (collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'eci_1.1.1.1', 'fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
-- score
select evaluation.update_late_collectivite_scores(20);
-- labellisation
insert into labellisation (collectivite_id, referentiel, obtenue_le, etoiles, score_realise, score_programme)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'eci', now(), 1, 1.0, 1.0);
-- preuve_complementaire
alter table preuve_complementaire disable trigger modified_by;
insert into preuve_complementaire(collectivite_id, fichier_id, url, action_id, modified_by)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), null, '', 'eci_2.1', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
alter table preuve_complementaire enable trigger modified_by;
-- preuve_rapport
alter table preuve_rapport disable trigger modified_by;
insert into preuve_rapport(collectivite_id, fichier_id, url, date, modified_by)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), null, '', now(), '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
alter table preuve_rapport enable trigger modified_by;
-- preuve_reglementaire
alter table preuve_reglementaire disable trigger modified_by;
insert into preuve_reglementaire(collectivite_id, fichier_id, url, preuve_id, modified_by)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), null, '', 'CEP', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
alter table preuve_reglementaire enable trigger modified_by;
-- fichier
insert into storage.objects (bucket_id, name, owner, metadata)
select bucket_id,
       'e9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9',
       '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
       jsonb_build_object('size', 34, 'mimetype', '*/*', 'cacheControl', 'no-cache')
from collectivite_bucket cb
where cb.collectivite_id = (select collectivite_id from collectivite_test where nom = 'testsql' limit 1);
insert into storage.objects (bucket_id, name, owner, metadata)
select bucket_id,
       'e9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b8',
       '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
       jsonb_build_object('size', 34, 'mimetype', '*/*', 'cacheControl', 'no-cache')
from collectivite_bucket cb
where cb.collectivite_id = (select collectivite_id from collectivite_test where nom = 'testsql' limit 1);

insert into labellisation.bibliotheque_fichier(collectivite_id, hash, filename)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1),
        'e9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9',
        'yo.pdf');

-- COMMENTAIRE --
-- action_discussion -> discussion_id
insert into action_discussion (id, collectivite_id, action_id, created_by)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'eci_2.1', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
-- action_discussion_commentaire
insert into action_discussion_commentaire(id, discussion_id, message, created_by)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'commentaire', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');

-- INDICATEUR --
-- indicateur_resultat
-- TODO à changer
/*insert into indicateur_resultat(modified_at, valeur, annee, collectivite_id, indicateur_id)
values (now(), 1.0, 2020, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'eci_5');
-- indicateur_objectif
insert into indicateur_objectif(modified_at, valeur, annee, collectivite_id, indicateur_id)
values (now(), 1.0, 2020, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'eci_5');
--indicateur_objectif_commentaire
alter table indicateur_objectif_commentaire disable trigger modified_by;
insert into indicateur_objectif_commentaire (collectivite_id, indicateur_id, annee, commentaire, modified_by, modified_at)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'eci_5', 2020, 'test', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', now());
alter table indicateur_objectif_commentaire enable trigger modified_by;
-- indicateur_resultat_commentaire
insert into indicateur_resultat_commentaire(collectivite_id, indicateur_id, commentaire, modified_by, modified_at)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'eci_5', 'test', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', now());
-- indicateur_resultat_import
insert into indicateur_resultat_import(collectivite_id, indicateur_id, annee, valeur, source, source_id, modified_at)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'eci_5', 2020, 1.0, 'source', 'cerema', now());
-- indicateur_personnalise_definition (2ème valeur pour insert un nouveau indicateur_personnalise_objectif)
insert into indicateur_personnalise_definition(id, collectivite_id, titre, description, unite, commentaire, modified_by)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'titre', 'description', 'unite', 'commentaire', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'titre', 'description', 'unite', 'commentaire', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
-- indicateur_personnalise_objectif
insert into indicateur_personnalise_objectif (modified_at, valeur, annee, collectivite_id, indicateur_id)
values (now(), 1.0, 2020, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- indicateur_personnalise_resultat
insert into indicateur_personnalise_resultat(modified_at, valeur, annee, collectivite_id, indicateur_id)
values (now(), 1.0, 2020, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- indicateur_perso_objectif_commentaire
alter table indicateur_perso_objectif_commentaire disable trigger modified_by;
insert into indicateur_perso_objectif_commentaire(collectivite_id, indicateur_id, annee, commentaire, modified_by, modified_at)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 2020, 'test', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', now());
alter table indicateur_perso_objectif_commentaire enable trigger modified_by;
alter table indicateur_perso_resultat_commentaire disable trigger modified_by;
insert into indicateur_perso_resultat_commentaire(collectivite_id, indicateur_id, annee, commentaire, modified_by, modified_at)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 2020, 'test', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', now());
alter table indicateur_perso_resultat_commentaire enable trigger modified_by;*/

-- PLAN ACTION --
-- fiche_action -> fiche_id (2ème valeur pour les inserts des tables liées)
insert into fiche_action (id, collectivite_id)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1)),
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1)),
       -- fiche_action -> fiche_une
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10+1, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1)),
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10+3, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1)),
       -- fiche_action -> fiche_deux
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10+2, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1)),
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10+4, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- axe -> axe_id (2ème valeur pour un nouveau insert de fiche_action_axe)
insert into axe (id, collectivite_id, nom)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'plan'),
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'plan');
-- fiche_action_axe
insert into fiche_action_axe(fiche_id, axe_id) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- financeur_tag -> financeur_tag_id (2ème valeur pour un nouveau insert de fiche_action_financeur_tag)
insert into financeur_tag (id, nom, collectivite_id)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'financeur', (select collectivite_id from collectivite_test where nom = 'testsql' limit 1)),
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10, 'financeur_', (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- fiche_action_financeur_tag
insert into fiche_action_financeur_tag(fiche_id, financeur_tag_id, montant_ttc) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 100);
-- partenaire_tag -> partenaire_tag_id (2ème valeur pour un nouveau insert de fiche_action_partenaire_tag)
insert into partenaire_tag (id, nom, collectivite_id)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'partenaire', (select collectivite_id from collectivite_test where nom = 'testsql' limit 1)),
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10, 'partenaire_', (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- fiche_action_partenaire_tag
insert into fiche_action_partenaire_tag (fiche_id, partenaire_tag_id) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- service_tag -> service_tag_id (2ème valeur pour un nouveau insert de fiche_action_service_tag)
insert into service_tag (id, nom, collectivite_id)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'service', (select collectivite_id from collectivite_test where nom = 'testsql' limit 1)),
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10, 'service_', (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- fiche_action_service_tag
insert into fiche_action_service_tag (fiche_id, service_tag_id) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- structure_tag -> structure_tag_id (2ème valeur pour un nouveau insert de fiche_action_structure_tag)
insert into structure_tag (id, nom, collectivite_id)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'structure', (select collectivite_id from collectivite_test where nom = 'testsql' limit 1)),
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10, 'structure_', (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- fiche_action_structure_tag
insert into fiche_action_structure_tag (fiche_id, structure_tag_id) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- personne_tag (2ème valeur pour un nouveau insert de fiche_action_pilote et fiche_action_referent)
insert into personne_tag (id, nom, collectivite_id)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'personne', (select collectivite_id from collectivite_test where nom = 'testsql' limit 1)),
       ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10, 'personne_', (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- fiche_action_pilote
insert into fiche_action_pilote(fiche_id, user_id, tag_id) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), null, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- fiche_action_referent
insert into fiche_action_referent(fiche_id, user_id, tag_id) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), null, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- annexe
insert into annexe (collectivite_id, fichier_id, url, fiche_id, modified_by)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), null, '', (select collectivite_id from collectivite_test where nom = 'testsql' limit 1), '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
-- fiche_action_action
insert into fiche_action_action (fiche_id, action_id) values((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'eci_2.1');
-- fiche_action_indicateur
--insert into fiche_action_indicateur(fiche_id, indicateur_id, indicateur_personnalise_id)
--values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), null, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1));
-- fiche_action_lien
insert into fiche_action_lien(fiche_une, fiche_deux) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10+1, (select collectivite_id from collectivite_test where nom = 'testsql' limit 1)*10+2);
-- fiche_action_thematique
insert into fiche_action_thematique(fiche_id, thematique_id) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 5);
-- fiche_action_sous_thematique
insert into fiche_action_sous_thematique(fiche_id, thematique_id) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 44);
-- PERSONNALISATION
-- reponse_binaire
insert into reponse_binaire(collectivite_id, question_id, reponse) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'dechets_1', true);
-- reponse_choix
insert into reponse_choix(collectivite_id, question_id, reponse) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'EP_1', 'EP_1_b');
-- reponse_proportion
insert into reponse_proportion(collectivite_id, question_id, reponse) values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'habitat_2', 1.0);
-- justification
alter table justification disable trigger modified_by;
insert into justification(collectivite_id, question_id, texte, modified_at, modified_by)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), 'dechets_1', 'texte', now(), '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
alter table justification enable trigger modified_by;

insert into cot(collectivite_id, actif, signataire)
values ((select collectivite_id from collectivite_test where nom = 'testsql' limit 1), true, null);

-- Suppression collectivité test
select test.identify_as_service_role();
select delete_collectivite_test((
    select collectivite_id from collectivite_test where nom = 'testsql' limit 1
));
select ok((select count(*) = 0 from collectivite_test where nom = 'testsql'));

rollback;
