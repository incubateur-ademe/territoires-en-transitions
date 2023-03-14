-- Deploy tet:plan_action to pg

BEGIN;

create function peut_lire_la_fiche(fiche_id integer) returns boolean as $$
begin
    return can_read_acces_restreint((select fa.collectivite_id from fiche_action fa where fa.id = fiche_id limit 1));
end;
$$language plpgsql;

-- fiche_action
alter policy allow_read on fiche_action using(peut_lire_la_fiche(id));
-- axe
alter policy allow_read on axe using(can_read_acces_restreint(collectivite_id));
alter policy allow_read on fiche_action_axe using(peut_lire_la_fiche(fiche_id));
-- financeur
alter policy allow_read on financeur_tag using(can_read_acces_restreint(collectivite_id));
alter policy allow_read on fiche_action_financeur_tag using(peut_lire_la_fiche(fiche_id));
-- service
alter policy allow_read on service_tag using(can_read_acces_restreint(collectivite_id));
alter policy allow_read on fiche_action_service_tag using(peut_lire_la_fiche(fiche_id));
-- partenaire
alter policy allow_read on partenaire_tag using(can_read_acces_restreint(collectivite_id));
alter policy allow_read on fiche_action_partenaire_tag using(peut_lire_la_fiche(fiche_id));
-- pilote
alter policy allow_read on personne_tag using(can_read_acces_restreint(collectivite_id));
alter policy allow_read on fiche_action_pilote using(peut_lire_la_fiche(fiche_id));
-- referent
alter policy allow_read on fiche_action_referent using(peut_lire_la_fiche(fiche_id));
-- thematique
alter policy allow_read on fiche_action_thematique using(peut_lire_la_fiche(fiche_id));
-- sous-thematique
alter policy allow_read on fiche_action_sous_thematique using(peut_lire_la_fiche(fiche_id));
-- structure
alter policy allow_read on structure_tag using(can_read_acces_restreint(collectivite_id));
alter policy allow_read on fiche_action_structure_tag using(peut_lire_la_fiche(fiche_id));
-- annexe
alter policy allow_read on annexe using(can_read_acces_restreint(collectivite_id));
alter policy allow_read on fiche_action_annexe using(peut_lire_la_fiche(fiche_id));
-- indicateur
alter policy allow_read on fiche_action_indicateur using(peut_lire_la_fiche(fiche_id));
-- action
alter policy allow_read on fiche_action_action using(peut_lire_la_fiche(fiche_id));

COMMIT;
