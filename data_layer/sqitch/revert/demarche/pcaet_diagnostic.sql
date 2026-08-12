-- Revert tet:demarche/pcaet_diagnostic from pg

BEGIN;

DROP TABLE IF EXISTS public.demarche_pcaet_diagnostic_snapshot CASCADE;
DROP TABLE IF EXISTS public.demarche_pcaet_diagnostic_state CASCADE;
DROP TABLE IF EXISTS public.demarche_pcaet_topic_row CASCADE;
DROP TABLE IF EXISTS public.demarche_pcaet_topic CASCADE;

COMMIT;
