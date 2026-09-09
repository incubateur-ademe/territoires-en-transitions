-- Verify tet:indicateur/periodicite_obligatoire on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT is_nullable = 'NO' AND column_default IS NULL
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'indicateur_definition'
          AND column_name = 'periodicite'
    ), 'indicateur_definition.periodicite doit être obligatoire et sans défaut implicite';

    ASSERT NOT EXISTS (
        SELECT 1
        FROM public.indicateur_definition definition
        LEFT JOIN public.indicateur_periodicite periodicite
          ON periodicite.code = definition.periodicite
        WHERE periodicite.code IS NULL
    ), 'Toute définition doit référencer une périodicité du catalogue';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'indicateur_definition_periodicite_fkey'
          AND conrelid = 'public.indicateur_definition'::regclass
          AND contype = 'f'
    ), 'La clé étrangère de periodicite doit exister';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'verifier_date_valeur_selon_periodicite'
          AND tgrelid = 'public.indicateur_valeur'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
    ), 'Le trigger de validation des dates doit être actif';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'assainir_audit_periodicite_indicateur'
          AND tgrelid = 'public.indicateur_valeur'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
    ), 'Un changement d''identité doit invalider l''audit historique de la ligne';

    ASSERT NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'auditer_et_normaliser_date_indicateur_en_transition'
          AND tgrelid = 'public.indicateur_valeur'::regclass
          AND NOT tgisinternal
    ), 'Le trigger de transition doit avoir été remplacé par la validation stricte';

    ASSERT to_regprocedure('migration.auditer_et_normaliser_dates_indicateur()') IS NULL,
        'La fonction d''audit par lot ne doit subsister que dans l''état de transition';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'empecher_changement_periodicite_indicateur'
          AND tgrelid = 'public.indicateur_definition'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
    ), 'Le trigger d''immutabilité de la périodicité doit être actif';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'verifier_periodicite_groupe_indicateur'
          AND tgrelid = 'public.indicateur_groupe'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
    ), 'Le trigger d''homogénéité des groupes doit être actif';

    ASSERT NOT EXISTS (
        SELECT 1
        FROM migration.indicateur_valeur_periodicite_audit
        WHERE statut = 'conflit'
    ), 'Aucun conflit historique non remédié ne doit subsister';

    -- Les conflits historiques ont dû être remédiés avant le verrouillage et
    -- toutes les écritures postérieures sont contrôlées par le trigger.
    ASSERT NOT EXISTS (
        SELECT 1
        FROM public.indicateur_valeur valeur
        JOIN public.indicateur_definition definition
          ON definition.id = valeur.indicateur_id
        WHERE valeur.date_valeur <> public.indicateur_date_debut_periode(
            valeur.periodicite,
            valeur.date_valeur
        )
    ), 'Toutes les dates doivent être canoniques une fois la périodicité verrouillée';
END $$;

ROLLBACK;
