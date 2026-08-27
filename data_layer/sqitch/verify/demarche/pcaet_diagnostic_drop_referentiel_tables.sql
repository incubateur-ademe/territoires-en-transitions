-- Verify tet:demarche/pcaet_diagnostic_drop_referentiel_tables

DO $$
BEGIN
    ASSERT NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
            'demarche_pcaet_topic',
            'demarche_pcaet_topic_row',
            'demarche_pcaet_diagnostic_state',
            'demarche_pcaet_diagnostic_snapshot'
          )
    ), 'Les tables référentiel / état / snapshot du diagnostic PCAET doivent être supprimées';
END $$;
