-- Deploy tet:plan_action to pg

BEGIN;

-- fiche_action
alter policy allow_read on fiche_action using(is_authenticated());
-- axe
alter policy allow_read on axe using(is_authenticated());
alter policy allow_read on fiche_action_axe using(is_authenticated());
-- financeur
alter policy allow_read on financeur_tag using(is_authenticated());
alter policy allow_read on fiche_action_financeur_tag using(is_authenticated());
-- service
alter policy allow_read on service_tag using(is_authenticated());
alter policy allow_read on fiche_action_service_tag using(is_authenticated());
-- partenaire
alter policy allow_read on partenaire_tag using(is_authenticated());
alter policy allow_read on fiche_action_partenaire_tag using(is_authenticated());
-- pilote
alter policy allow_read on personne_tag using(is_authenticated());
alter policy allow_read on fiche_action_pilote using(is_authenticated());
-- referent
alter policy allow_read on fiche_action_referent using(is_authenticated());
-- thematique
alter policy allow_read on fiche_action_thematique using(is_authenticated());
-- sous-thematique
alter policy allow_read on fiche_action_sous_thematique using(is_authenticated());
-- structure
alter policy allow_read on structure_tag using(is_authenticated());
alter policy allow_read on fiche_action_structure_tag using(is_authenticated());
-- annexe
alter policy allow_read on annexe using(is_authenticated());
alter policy allow_read on fiche_action_annexe using(is_authenticated());
-- indicateur
alter policy allow_read on fiche_action_indicateur using(is_authenticated());
-- action
alter policy allow_read on fiche_action_action using(is_authenticated());

drop function peut_lire_la_fiche;

COMMIT;
