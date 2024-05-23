select test.create_copy('public', 'indicateur_valeur');
select test.create_copy('public', 'indicateur_definition');
select test.create_copy('public', 'categorie_tag');
select test.create_copy('public', 'indicateur_categorie_tag');
select test.create_copy('public', 'indicateur_groupe');
select test.create_copy('public', 'indicateur_source');
select test.create_copy('public', 'indicateur_source_metadonnee');

create or replace function
    test_reset_indicateurs()
    returns void
as
$$
begin
    perform test.reset_from_copy('public', 'indicateur_source');
    perform test.reset_from_copy('public', 'indicateur_source_metadonnee');
    perform test.reset_from_copy('public', 'indicateur_definition');
    perform test.reset_from_copy('public', 'indicateur_valeur');
    perform test.reset_from_copy('public', 'categorie_tag');
    perform test.reset_from_copy('public', 'indicateur_categorie_tag');
    perform test.reset_from_copy('public', 'indicateur_groupe');
    truncate indicateur_collectivite cascade;
end;
$$ language plpgsql;
comment on function test_reset_indicateurs is
    'Reset les indicateurs persos et référentiels.';
