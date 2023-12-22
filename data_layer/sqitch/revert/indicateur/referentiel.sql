-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

drop trigger modified_by on indicateur_resultat;
alter table indicateur_resultat drop column modified_by;
select audit.disable_tracking('public.indicateur_resultat'::regclass);

drop trigger modified_by on indicateur_objectif;
alter table indicateur_objectif drop column modified_by;
select audit.disable_tracking('public.indicateur_objectif'::regclass);

COMMIT;
