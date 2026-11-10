-- Revert tet:plan_action/type_electrification from pg

BEGIN;

-- Conserver ce type et son ID : il peut préexister au déploiement ou être
-- référencé par des plans. Le retrait du code n'impose pas sa suppression.

COMMIT;
