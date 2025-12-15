-- Ajoute les fonctionnalités pour tester les plans et indicateurs

select test.create_copy('public', 'fiche_action');
select test.create_copy('public', 'axe');
select test.create_copy('public', 'fiche_action_axe');
select test.create_copy('public', 'thematique');
select test.create_copy('public', 'fiche_action_thematique');
select test.create_copy('public', 'sous_thematique');
select test.create_copy('public', 'fiche_action_sous_thematique');
select test.create_copy('public', 'partenaire_tag');
select test.create_copy('public', 'fiche_action_partenaire_tag');
select test.create_copy('public', 'structure_tag');
select test.create_copy('public', 'fiche_action_structure_tag');
select test.create_copy('public', 'personne_tag');
select test.create_copy('public', 'fiche_action_pilote');
select test.create_copy('public', 'fiche_action_referent');
select test.create_copy('public', 'fiche_action_action');
select test.create_copy('public', 'service_tag');
select test.create_copy('public', 'fiche_action_service_tag');
select test.create_copy('public', 'financeur_tag');
select test.create_copy('public', 'fiche_action_financeur_tag');

select test.create_copy('public', 'indicateur_valeur');
select test.create_copy('public', 'indicateur_definition');
select test.create_copy('public', 'indicateur_action');
select test.create_copy('public', 'categorie_tag');
select test.create_copy('public', 'indicateur_categorie_tag');
select test.create_copy('public', 'indicateur_thematique');
select test.create_copy('public', 'indicateur_sous_thematique');
select test.create_copy('public', 'indicateur_groupe');
select test.create_copy('public', 'indicateur_source');
select test.create_copy('public', 'indicateur_source_metadonnee');
select test.create_copy('public', 'indicateur_collectivite');
select test.create_copy('public', 'indicateur_pilote');
select test.create_copy('public', 'indicateur_service_tag');

select test.create_copy('public', 'fiche_action_indicateur');


create or replace function
    test_reset_plan_action()
    returns void
as
$$
begin

alter table fiche_action disable trigger save_history;
perform test.reset_from_copy('public', 'fiche_action');
alter table fiche_action enable trigger save_history;
perform test.reset_from_copy('public', 'thematique');
perform test.reset_from_copy('public', 'fiche_action_thematique');
perform test.reset_from_copy('public', 'sous_thematique');
perform test.reset_from_copy('public', 'fiche_action_sous_thematique');
alter table axe disable trigger axe_modifie_plan;
perform test.reset_from_copy('public', 'axe');
alter table axe enable trigger axe_modifie_plan;
perform test.reset_from_copy('public', 'fiche_action_axe');
perform test.reset_from_copy('public', 'partenaire_tag');
perform test.reset_from_copy('public', 'fiche_action_partenaire_tag');
perform test.reset_from_copy('public', 'structure_tag');
perform test.reset_from_copy('public', 'fiche_action_structure_tag');
perform test.reset_from_copy('public', 'personne_tag');
perform test.reset_from_copy('public', 'fiche_action_pilote');
perform test.reset_from_copy('public', 'fiche_action_referent');
perform test.reset_from_copy('public', 'fiche_action_action');
perform test.reset_from_copy('public', 'service_tag');
perform test.reset_from_copy('public', 'fiche_action_service_tag');
perform test.reset_from_copy('public', 'financeur_tag');
perform test.reset_from_copy('public', 'fiche_action_financeur_tag');

perform test.reset_from_copy('public', 'indicateur_source');
perform test.reset_from_copy('public', 'indicateur_source_metadonnee');
perform test.reset_from_copy('public', 'indicateur_definition');
perform test.reset_from_copy('public', 'indicateur_action');
perform test.reset_from_copy('public', 'indicateur_valeur');
perform test.reset_from_copy('public', 'categorie_tag');
perform test.reset_from_copy('public', 'indicateur_categorie_tag');
perform test.reset_from_copy('public', 'indicateur_thematique');
perform test.reset_from_copy('public', 'indicateur_sous_thematique');
perform test.reset_from_copy('public', 'indicateur_groupe');
perform test.reset_from_copy('public', 'indicateur_collectivite');
perform test.reset_from_copy('public', 'indicateur_pilote');
perform test.reset_from_copy('public', 'indicateur_service_tag');

perform test.reset_from_copy('public', 'fiche_action_indicateur');

truncate annexe cascade;

end $$ language plpgsql security definer;
comment on function test_reset_plan_action is
    'Reinitialise les plans d''actions et les indicateurs.';

-- Laisse les deux fonctions pour ne pas impacter le front
create or replace function
    test_reset_indicateurs()
    returns void
as
$$
begin
    perform test_reset_plan_action();
end;
$$ language plpgsql;
comment on function test_reset_indicateurs is
    'Reinitialise les plans d''actions et les indicateurs.';
