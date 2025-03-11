-- Deploy tet:labellisation/import to pg

BEGIN;

CREATE TABLE IF NOT EXISTS imports.labellisation (
	siren_insee text NULL,
	ville_unique text NULL,
	nom_court text NULL,
	niveau_label text NULL,
	annee int4 NULL,
	score text NULL,
	score_realise text NULL,
	referentiel public.referentiel NULL
);

COMMIT;
