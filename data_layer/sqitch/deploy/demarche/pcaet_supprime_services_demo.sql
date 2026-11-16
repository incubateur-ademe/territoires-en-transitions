-- Deploy tet:demarche/pcaet_supprime_services_demo to pg
-- requires: demarche/pcaet_supra_plusieurs_depots_en_cours

-- Le mode démo du dépôt PCAET saisissait, à la place des vrais services, deux
-- services fictifs que le backend créait à la première transmission de démo :
-- « DREAL (démonstration) » et « Région (démonstration) », sans territoire. La
-- transmission de démo saisit désormais les services qui couvrent la
-- collectivité de test : ces deux lignes n'ont plus d'usage.
--
-- Leurs saisines partent avec elles, avis compris (cascade) : elles ne portent
-- que sur des dossiers de collectivités de test. Les rapports d'instruction de
-- démo rangés dans leur bibliothèque, le lien vers leur bucket et d'éventuels
-- droits d'accès n'ont pas de cascade : ils sont supprimés avant la ligne.
--
-- Sur une base où ils n'ont jamais été créés, le change ne fait rien.

BEGIN;

CREATE TEMPORARY TABLE service_demo ON COMMIT DROP AS
SELECT id
FROM public.collectivite
WHERE region_code IS NULL
  AND departement_code IS NULL
  AND (nom, type::text) IN (
      ('DREAL (démonstration)', 'dreal'),
      ('Région (démonstration)', 'region')
  );

DELETE FROM public.demarche_pcaet_demande_avis
WHERE instructeur_collectivite_id IN (SELECT id FROM service_demo);

DELETE FROM labellisation.bibliotheque_fichier
WHERE collectivite_id IN (SELECT id FROM service_demo);

DELETE FROM public.collectivite_bucket
WHERE collectivite_id IN (SELECT id FROM service_demo);

DELETE FROM public.private_utilisateur_droit
WHERE collectivite_id IN (SELECT id FROM service_demo);

DELETE FROM public.collectivite
WHERE id IN (SELECT id FROM service_demo);

COMMIT;
