select test.create_copy('public', 'indicateur_perso_objectif_commentaire');
select test.create_copy('public', 'indicateur_perso_resultat_commentaire');
select test.create_copy('public', 'indicateur_personnalise_definition');
select test.create_copy('public', 'indicateur_personnalise_objectif');
select test.create_copy('public', 'indicateur_personnalise_resultat');
select test.create_copy('public', 'indicateur_resultat');
select test.create_copy('public', 'indicateur_resultat_commentaire');
select test.create_copy('public', 'indicateur_objectif');
select test.create_copy('public', 'indicateur_objectif_commentaire');
select test.create_copy('public', 'indicateur_resultat_import');

create function
    test_reset_indicateurs()
    returns void
as
$$
begin
    perform test.reset_from_copy('public', 'indicateur_perso_objectif_commentaire');
    perform test.reset_from_copy('public', 'indicateur_perso_resultat_commentaire');
    perform test.reset_from_copy('public', 'indicateur_personnalise_definition');
    perform test.reset_from_copy('public', 'indicateur_personnalise_objectif');
    perform test.reset_from_copy('public', 'indicateur_personnalise_resultat');
    perform test.reset_from_copy('public', 'indicateur_resultat');
    perform test.reset_from_copy('public', 'indicateur_resultat_commentaire');
    perform test.reset_from_copy('public', 'indicateur_objectif');
    perform test.reset_from_copy('public', 'indicateur_objectif_commentaire');
    perform test.reset_from_copy('public', 'indicateur_resultat_import');
end;
$$ language plpgsql;
comment on function test_reset_indicateurs is
    'Reset les indicateurs persos et référentiels.';
