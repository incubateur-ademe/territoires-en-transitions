-- Revert tet:plan_action/tags from pg

BEGIN;

alter table fiche_action_referent
    drop constraint fiche_action_referent_tag_id_fkey;
alter table fiche_action_referent
    add foreign key (tag_id)
        references personne_tag (id);

alter table fiche_action_pilote
    drop constraint fiche_action_pilote_tag_id_fkey;
alter table fiche_action_pilote
    add foreign key (tag_id)
        references personne_tag (id);


alter table fiche_action_financeur_tag
    drop constraint fiche_action_financeur_tag_financeur_tag_id_fkey;
alter table fiche_action_financeur_tag
    add foreign key (financeur_tag_id)
        references financeur_tag (id);


alter table fiche_action_partenaire_tag
    drop constraint fiche_action_partenaire_tag_partenaire_tag_id_fkey;
alter table fiche_action_partenaire_tag
    add foreign key (partenaire_tag_id) references partenaire_tag;


alter table fiche_action_service_tag
    drop constraint fiche_action_service_tag_service_tag_id_fkey;
alter table fiche_action_service_tag
    add foreign key (service_tag_id) references service_tag;


alter table fiche_action_structure_tag
    drop constraint fiche_action_structure_tag_structure_tag_id_fkey;
alter table fiche_action_structure_tag
    add foreign key (structure_tag_id) references structure_tag;

COMMIT;
