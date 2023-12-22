-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

alter table indicateur_resultat add modified_by uuid;
select private.add_modified_by_trigger('public', 'indicateur_resultat');
select audit.enable_tracking('public.indicateur_resultat'::regclass);

alter table indicateur_objectif add modified_by uuid;
select private.add_modified_by_trigger('public', 'indicateur_objectif');
select audit.enable_tracking('public.indicateur_objectif'::regclass);

COMMIT;
