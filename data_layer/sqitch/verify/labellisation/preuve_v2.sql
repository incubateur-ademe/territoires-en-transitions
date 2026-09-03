-- Verify tet:labellisation/preuve_v2 on pg

BEGIN;


select id, collectivite_id, hash, filename, confidentiel
from labellisation.bibliotheque_fichier
where false;

select id, collectivite_id, hash, filename, bucket_id, file_id, filesize, confidentiel
from bibliotheque_fichier
where false;

select id, snippet
from labellisation.bibliotheque_fichier_snippet
where false;

select preuve_type, id, collectivite_id, fichier, lien, commentaire, created_at, created_by, created_by_nom,
       action, preuve_reglementaire, demande, rapport, audit
from preuve
where false;

select id, collectivite_id, plan_ids, fiche_id, fichier, lien, commentaire, created_at, created_by, created_by_nom
from bibliotheque_annexe
where false;

select collectivite_id, nom, referentiel, action, preuve_type, fichier, lien, created_at
from retool_preuves
where false;


ROLLBACK;
