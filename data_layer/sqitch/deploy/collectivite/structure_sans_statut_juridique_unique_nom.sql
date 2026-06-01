-- Deploy tet:collectivite/structure_sans_statut_juridique_unique_nom to pg

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS collectivite_structure_sans_statut_juridique_unique_nom
  ON collectivite (type, lower(nom))
  WHERE type = 'structure_sans_statut_juridique';

COMMIT;
