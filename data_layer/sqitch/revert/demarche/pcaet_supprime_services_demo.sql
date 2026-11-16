-- Revert tet:demarche/pcaet_supprime_services_demo from pg

-- Rien à rétablir : les services de démo n'étaient pas posés par une migration
-- mais créés à la volée par le backend, qui ne les crée plus. Leurs saisines
-- portaient sur des dossiers de test.

BEGIN;

COMMIT;
