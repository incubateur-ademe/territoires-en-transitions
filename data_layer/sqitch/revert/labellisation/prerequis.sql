-- Revert tet:labellisation/prerequis from pg

BEGIN;

drop table labellisation.demande;
drop function labellisation.critere_action(collectivite_id integer);
drop function labellisation.critere_score_global(collectivite_id integer);
drop function labellisation.etoiles(collectivite_id integer);
drop function labellisation.referentiel_score(collectivite_id integer);
drop table labellisation_calendrier;
drop table labellisation_fichier_critere;
drop table labellisation_action_critere;
drop table labellisation.etoile_meta;
drop type labellisation.etoile;

COMMIT;
