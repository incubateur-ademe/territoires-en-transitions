-- Deploy tet:indicateur/indicateurs_gaz_effet_serre to pg
BEGIN;
DROP function public.indicateurs_gaz_effet_serre(site_labellisation);
create or replace function public.indicateurs_gaz_effet_serre(site_labellisation) returns jsonb security definer language sql BEGIN ATOMIC
SELECT to_jsonb(array_agg(d))
from (
        SELECT iri.date_valeur,
            iri.resultat,
            id.identifiant_referentiel as identifiant,
            src.libelle as source
        FROM indicateur_valeur iri
            JOIN indicateur_definition id on iri.indicateur_id = id.id
            JOIN indicateur_source_metadonnee ism on ism.id = iri.metadonnee_id
            JOIN indicateur_source src on src.id = ism.source_id
        WHERE iri.collectivite_id = ($1).collectivite_id
            AND iri.metadonnee_id is not null
            AND id.identifiant_referentiel::text = ANY (
                ARRAY [
                'cae_1.g'::character varying,
                'cae_1.f'::character varying,
                'cae_1.h'::character varying,
                'cae_1.j'::character varying,
                'cae_1.i'::character varying,
                'cae_1.c'::character varying,
                'cae_1.e'::character varying,
                'cae_1.d'::character varying,
                'cae_1.a'::character varying
                ]::text []
            )
    ) d;
END;
comment on function indicateurs_gaz_effet_serre(site_labellisation) is 'Indicateurs gaz à effet de serre.';
COMMIT;
