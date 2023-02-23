-- Deploy tet:plan_action to pg

BEGIN;

create or replace function peut_lire_la_fiche(fiche_id integer) returns boolean as $$
begin
    return have_lecture_access_with_restreint((select fa.collectivite_id from fiche_action fa where fa.id = fiche_id limit 1));
end;
$$language plpgsql security definer;

-- fiche_action
alter policy allow_read on fiche_action using(peut_lire_la_fiche(id));
-- axe
alter policy allow_read on axe using(have_lecture_access_with_restreint(collectivite_id));
alter policy allow_read on fiche_action_axe using(peut_lire_la_fiche(fiche_id));
-- financeur
alter policy allow_read on financeur_tag using(have_lecture_access_with_restreint(collectivite_id));
alter policy allow_read on fiche_action_financeur_tag using(peut_lire_la_fiche(fiche_id));
-- service
alter policy allow_read on service_tag using(have_lecture_access_with_restreint(collectivite_id));
alter policy allow_read on fiche_action_service_tag using(peut_lire_la_fiche(fiche_id));
-- partenaire
alter policy allow_read on partenaire_tag using(have_lecture_access_with_restreint(collectivite_id));
alter policy allow_read on fiche_action_partenaire_tag using(peut_lire_la_fiche(fiche_id));
-- pilote
alter policy allow_read on personne_tag using(have_lecture_access_with_restreint(collectivite_id));
alter policy allow_read on fiche_action_pilote using(peut_lire_la_fiche(fiche_id));
-- referent
alter policy allow_read on fiche_action_referent using(peut_lire_la_fiche(fiche_id));
-- thematique
alter policy allow_read on fiche_action_thematique using(peut_lire_la_fiche(fiche_id));
-- sous-thematique
alter policy allow_read on fiche_action_sous_thematique using(peut_lire_la_fiche(fiche_id));
-- structure
alter policy allow_read on structure_tag using(have_lecture_access_with_restreint(collectivite_id));
alter policy allow_read on fiche_action_structure_tag using(peut_lire_la_fiche(fiche_id));
-- annexe
alter policy allow_read on annexe using(have_lecture_access_with_restreint(collectivite_id));
alter policy allow_read on fiche_action_annexe using(peut_lire_la_fiche(fiche_id));
-- indicateur
alter policy allow_read on fiche_action_indicateur using(peut_lire_la_fiche(fiche_id));
-- action
alter policy allow_read on fiche_action_action using(peut_lire_la_fiche(fiche_id));
-- fiches_action
alter view fiches_action set (security_invoker = on);
-- plan_action
alter view plan_action set (security_invoker = on);
-- plan_action_chemin
alter view plan_action_chemin set (security_invoker = on);
-- plan_action_profondeur
alter view plan_action_profondeur set (security_invoker = on);

COMMIT;
