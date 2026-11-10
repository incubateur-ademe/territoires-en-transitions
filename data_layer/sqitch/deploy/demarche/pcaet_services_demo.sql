-- Deploy tet:demarche/pcaet_services_demo to pg
-- requires: demarche/pcaet_plan_chaleur_froid_inclusion

BEGIN;

-- Services instructeurs fictifs du mode démo : la transmission d'une démarche
-- de démonstration les saisit à la place des vrais services de la région.
-- Sans code région ni département, aucune vraie transmission ne peut les
-- viser ; sans membre, aucun annuaire ne les montre.
INSERT INTO public.collectivite (nom, type)
SELECT service.nom, service.type
FROM (VALUES ('DREAL (démonstration)', 'dreal'),
             ('Région (démonstration)', 'region')) AS service (nom, type)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.collectivite AS existante
    WHERE existante.nom = service.nom
      AND existante.type = service.type
);

COMMIT;
