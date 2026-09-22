-- Deploy tet:indicateur/add_non_suivi_to_indicateur_collectivite to pg

BEGIN;

ALTER TABLE indicateur_collectivite
ADD COLUMN non_suivi boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN indicateur_collectivite.non_suivi IS 'Si true, la collectivité ne suit pas cet indicateur (utilisé notamment par le calcul du score indicatif).';

COMMIT;
