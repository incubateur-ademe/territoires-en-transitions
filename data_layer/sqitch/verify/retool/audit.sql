-- Verify tet:retool/audit on pg

BEGIN;

select has_function_privilege('retool_patch_demande(integer, labellisation.sujet_demande, labellisation.etoile)', 'execute');

ROLLBACK;
