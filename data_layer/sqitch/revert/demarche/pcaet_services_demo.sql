-- Revert tet:demarche/pcaet_services_demo from pg

BEGIN;

-- Les saisines de démo tombent avec leurs services ; les avis suivent en
-- cascade depuis leur demande.
DELETE FROM public.demarche_pcaet_demande_avis AS demande
USING public.collectivite AS service
WHERE demande.instructeur_collectivite_id = service.id
  AND (service.nom, service.type) IN (('DREAL (démonstration)', 'dreal'),
                                      ('Région (démonstration)', 'region'));

DELETE FROM labellisation.bibliotheque_fichier AS fichier
USING public.collectivite AS service
WHERE fichier.collectivite_id = service.id
  AND (service.nom, service.type) IN (('DREAL (démonstration)', 'dreal'),
                                      ('Région (démonstration)', 'region'));

-- Le bucket de stockage reste, orphelin, comme pour delete_collectivite_test.
DELETE FROM public.collectivite_bucket AS bucket
USING public.collectivite AS service
WHERE bucket.collectivite_id = service.id
  AND (service.nom, service.type) IN (('DREAL (démonstration)', 'dreal'),
                                      ('Région (démonstration)', 'region'));

DELETE FROM public.collectivite
WHERE (nom, type) IN (('DREAL (démonstration)', 'dreal'),
                      ('Région (démonstration)', 'region'));

COMMIT;
