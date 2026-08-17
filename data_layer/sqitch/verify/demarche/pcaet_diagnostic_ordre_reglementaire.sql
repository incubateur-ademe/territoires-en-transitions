-- Verify tet:demarche/pcaet_diagnostic_ordre_reglementaire on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT array_agg(code ORDER BY display_order)
        FROM public.demarche_pcaet_topic
    ) = array['profil_energie_climat', 'polluants_atmospheriques', 'sequestration',
              'consommation_energetique', 'enr', 'vulnerabilite_territoire'],
        'Les topics du diagnostic doivent suivre l''ordre demandé par le ministère';

    ASSERT (
        SELECT label = 'Émissions GES' FROM public.demarche_pcaet_topic
        WHERE code = 'profil_energie_climat'
    ), 'Le topic profil_energie_climat doit s''intituler « Émissions GES »';
END $$;

ROLLBACK;
