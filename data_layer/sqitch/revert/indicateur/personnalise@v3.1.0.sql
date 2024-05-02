-- Deploy tet:indicateur/personnalise to pg

BEGIN;

drop trigger modified_by on indicateur_personnalise_resultat;
alter table indicateur_personnalise_resultat drop column modified_by;
select audit.disable_tracking('public.indicateur_personnalise_resultat'::regclass);

drop trigger modified_by on indicateur_personnalise_objectif;
alter table indicateur_personnalise_objectif drop column modified_by;
select audit.disable_tracking('public.indicateur_personnalise_objectif'::regclass);

COMMIT;
