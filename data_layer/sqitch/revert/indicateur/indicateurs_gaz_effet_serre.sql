-- Revert tet:indicateur/indicateurs_gaz_effet_serre from pg

BEGIN;

DROP function public.indicateurs_gaz_effet_serre(site_labellisation);

create function public.indicateurs_gaz_effet_serre(site_labellisation) returns SETOF indicateur_valeur[]
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT COALESCE(
               (
               SELECT array_agg(iri.*) AS array_agg
               FROM indicateur_valeur iri
               JOIN indicateur_definition id on iri.indicateur_id = id.id
               WHERE iri.collectivite_id = ($1).collectivite_id AND
                   iri.metadonnee_id is not null AND
                   id.identifiant_referentiel::text = ANY (
                       ARRAY[
                           'cae_1.g'::character varying,
                           'cae_1.f'::character varying,
                           'cae_1.h'::character varying,
                           'cae_1.j'::character varying,
                           'cae_1.i'::character varying,
                           'cae_1.c'::character varying,
                           'cae_1.e'::character varying,
                           'cae_1.d'::character varying,
                           'cae_1.a'::character varying
                           ]::text[])
               ),
               '{}'::indicateur_valeur[]
       ) AS "coalesce";
END;
comment on function indicateurs_gaz_effet_serre(site_labellisation) is 'Indicateurs gaz à effet de serre.';

COMMIT;
