-- Deploy tet:indicateur/personnalise to pg

BEGIN;

alter table indicateur_personnalise_resultat add modified_by uuid;
select private.add_modified_by_trigger('public', 'indicateur_personnalise_resultat');
select audit.enable_tracking('public.indicateur_personnalise_resultat'::regclass);

alter table indicateur_personnalise_objectif add modified_by uuid;
select private.add_modified_by_trigger('public', 'indicateur_personnalise_objectif');
select audit.enable_tracking('public.indicateur_personnalise_objectif'::regclass);

COMMIT;
