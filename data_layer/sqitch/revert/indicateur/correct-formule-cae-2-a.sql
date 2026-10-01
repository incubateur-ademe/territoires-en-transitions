-- Revert tet:indicateur/correct-formule-cae-2-a from pg

BEGIN;

-- Correction de données conservée lors d'un revert : réintroduire la référence
-- inexistante cae_2.lpcaet casserait à nouveau le catalogue. Aucun schéma ni
-- aucune observation n'a été modifié par ce changement.

COMMIT;
