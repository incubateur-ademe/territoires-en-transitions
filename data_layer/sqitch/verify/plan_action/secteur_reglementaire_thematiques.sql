-- Verify tet:plan_action/secteur_reglementaire_thematiques on pg

BEGIN;

DO
$$
    BEGIN
        ASSERT (
            SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
            FROM pg_enum
            WHERE enumtypid = 'public.secteur_reglementaire'::regtype
        ) = ARRAY [
            'residentiel', 'tertiaire', 'transport_routier', 'autres_transports',
            'agriculture', 'dechets', 'industrie_hors_branche_energie', 'branche_energie',
            'amenagement', 'biodiversite', 'eau', 'foret_et_sols', 'economie', 'sante', 'risques_naturels'
        ], 'L enum secteur_reglementaire doit porter les 8 secteurs R. 229-52 puis les 7 thematiques';
    END
$$;

ROLLBACK;
