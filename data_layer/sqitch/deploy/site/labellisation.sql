-- Deploy tet:site/labellisation to pg

BEGIN;

create function
    labellisations(site_labellisation)
    returns setof labellisation[]
    rows 1
begin
    atomic
    select array_agg(l) from labellisation l where collectivite_id = $1.collectivite_id;
end;
comment on function labellisations(site_labellisation) is
    'Permet de lier une collectivité à ses données de labellisation historique.';


create function
    indicateurs_gaz_effet_serre(site_labellisation)
    returns setof indicateur_resultat_import[]
    rows 1
begin
    atomic
    select array_agg(iri)
    from indicateur_resultat_import iri
    where iri.collectivite_id = $1.collectivite_id
      and iri.indicateur_id in
          ('cae_1.g', 'cae_1.f', 'cae_1.h', 'cae_1.j', 'cae_1.i', 'cae_1.c', 'cae_1.e', 'cae_1.d', 'cae_1.a');
end;
comment on function indicateurs_gaz_effet_serre(site_labellisation) is
    'Permet de lier une collectivité à ses indicateurs gaz à effet de serre.';

COMMIT;
