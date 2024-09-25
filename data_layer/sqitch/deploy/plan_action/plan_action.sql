-- Deploy tet:plan_action to pg

BEGIN;

ALTER TYPE fiche_action_statuts ADD VALUE IF NOT EXISTS 'Bloqué';
ALTER TYPE fiche_action_statuts ADD VALUE IF NOT EXISTS 'En retard';
ALTER TYPE fiche_action_statuts ADD VALUE IF NOT EXISTS 'A discuter';

COMMIT;
