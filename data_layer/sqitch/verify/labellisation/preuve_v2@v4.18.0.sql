-- Verify tet:labellisation/preuve_v2 on pg

BEGIN;

select preuve_type, id, collectivite_id, fichier, lien, commentaire, created_at, created_by, created_by_nom,
       action, preuve_reglementaire, demande, rapport, audit
from preuve
where false;

ROLLBACK;
