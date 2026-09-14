-- Verify tet:indicateur/periodicite on pg

BEGIN;

DO $$
BEGIN
    -- Le changement contractuel suivant retire le défaut de compatibilité :
    -- cette vérification historique doit donc accepter les deux états.
    ASSERT (
        SELECT column_default = '''annuelle''::text' OR column_default IS NULL
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'indicateur_definition'
          AND column_name = 'periodicite'
          AND data_type = 'text'
    ), 'indicateur_definition.periodicite doit exister et être de type text';

    ASSERT to_regclass('migration.indicateur_valeur_periodicite_audit') IS NOT NULL,
        'La table d''audit des dates historiques doit exister';

    ASSERT to_regclass('public.indicateur_periodicite') IS NOT NULL,
        'Le catalogue des périodicités doit exister';

    ASSERT NOT EXISTS (
        SELECT 1
        FROM (VALUES
            ('annuelle', 'mois', 12, DATE '2000-01-01'),
            ('mensuelle', 'mois', 1, DATE '2000-01-01')
        ) AS attendue(code, unite_calendaire, nombre_unites, date_ancrage)
        LEFT JOIN public.indicateur_periodicite effective
          USING (code, unite_calendaire, nombre_unites, date_ancrage)
        WHERE effective.code IS NULL
    ), 'Le catalogue doit conserver les politiques annuelle et mensuelle livrées';

    ASSERT to_regprocedure(
        'public.indicateur_date_debut_periode(text,date)'
    ) IS NOT NULL, 'La fonction canonique des périodes doit exister';

    ASSERT to_regprocedure(
        'migration.verifier_retrait_periodicite_indicateur()'
    ) IS NOT NULL, 'Le garde anti-perte du downgrade doit exister';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'indicateur_definition_periodicite_fkey'
          AND conrelid = 'public.indicateur_definition'::regclass
          AND contype = 'f'
    ), 'La clé étrangère vers le catalogue doit protéger la colonne pendant la transition';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'indicateur_periodicite_date_ancrage_supported_check'
          AND conrelid = 'public.indicateur_periodicite'::regclass
          AND contype = 'c'
    ), 'Les ancrages du catalogue doivent rester dans le calendrier partagé avec le domaine';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'indicateur_periodicite_mois_valides_check'
          AND conrelid = 'public.indicateur_periodicite'::regclass
          AND contype = 'c'
    ), 'Les politiques mensuelles doivent partager les règles d''alignement du domaine';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'empecher_modification_periodicite'
          AND tgrelid = 'public.indicateur_periodicite'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
    ), 'Toute politique de périodicité publiée doit être immuable';

    ASSERT (
        SELECT relrowsecurity
        FROM pg_class
        WHERE oid = 'public.indicateur_periodicite'::regclass
    ), 'Le catalogue public doit activer RLS';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'indicateur_periodicite'
          AND policyname = 'indicateur_periodicite_allow_read'
          AND cmd = 'SELECT'
    ), 'Le catalogue doit exposer uniquement une politique de lecture';

    ASSERT has_table_privilege(
        'anon', 'public.indicateur_periodicite', 'SELECT'
    ) AND has_table_privilege(
        'authenticated', 'public.indicateur_periodicite', 'SELECT'
    ) AND has_table_privilege(
        'service_role', 'public.indicateur_periodicite', 'SELECT'
    ), 'Les rôles API doivent pouvoir lire le catalogue';

    ASSERT NOT has_table_privilege(
        'anon', 'public.indicateur_periodicite', 'INSERT'
    ) AND NOT has_table_privilege(
        'anon', 'public.indicateur_periodicite', 'UPDATE'
    ) AND NOT has_table_privilege(
        'anon', 'public.indicateur_periodicite', 'DELETE'
    ) AND NOT has_table_privilege(
        'authenticated', 'public.indicateur_periodicite', 'INSERT'
    ) AND NOT has_table_privilege(
        'authenticated', 'public.indicateur_periodicite', 'UPDATE'
    ) AND NOT has_table_privilege(
        'authenticated', 'public.indicateur_periodicite', 'DELETE'
    ) AND NOT has_table_privilege(
        'service_role', 'public.indicateur_periodicite', 'INSERT'
    ) AND NOT has_table_privilege(
        'service_role', 'public.indicateur_periodicite', 'UPDATE'
    ) AND NOT has_table_privilege(
        'service_role', 'public.indicateur_periodicite', 'DELETE'
    ), 'Les rôles API ne doivent jamais modifier le catalogue';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'empecher_changement_periodicite_indicateur'
          AND tgrelid = 'public.indicateur_definition'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
    ), 'La périodicité du catalogue ne réinterprète pas les valeurs existantes';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'verrouiller_graphe_calcul_indicateur_valeur'
          AND tgrelid = 'public.indicateur_valeur'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
          AND tgtype::integer = 30
          AND tgfoid =
              'public.verrouiller_graphe_calcul_indicateur_partage()'::regprocedure
    ), 'Les écritures de valeurs doivent partager le verrou du graphe avant les lignes';

    ASSERT (
        SELECT count(*) = 2
        FROM pg_trigger
        WHERE tgname IN (
            'verrouiller_graphe_calcul_indicateur_definition',
            'verrouiller_graphe_calcul_indicateur_definition_update'
        )
          AND tgrelid = 'public.indicateur_definition'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
          AND tgfoid =
              'public.verrouiller_graphe_calcul_indicateur_exclusif()'::regprocedure
          AND (
              (
                  tgname = 'verrouiller_graphe_calcul_indicateur_definition'
                  AND tgtype::integer = 14
              )
              OR (
                  tgname = 'verrouiller_graphe_calcul_indicateur_definition_update'
                  AND tgtype::integer = 18
                  AND (
                      SELECT array_agg(attribute.attname ORDER BY attribute.attname)
                      FROM unnest(tgattr::smallint[]) AS updated(attnum)
                      JOIN pg_attribute attribute
                        ON attribute.attrelid = pg_trigger.tgrelid
                       AND attribute.attnum = updated.attnum
                  ) = ARRAY[
                      'collectivite_id',
                      'id',
                      'identifiant_referentiel',
                      'periodicite',
                      'periodicite_mode',
                      'valeur_calcule'
                  ]::name[]
              )
          )
    ), 'Les mutations du graphe doivent prendre le verrou exclusif avant les lignes';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'verifier_periodicite_groupe_indicateur'
          AND tgrelid = 'public.indicateur_groupe'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
    ), 'Les agrégations parent/enfant doivent conserver une périodicité homogène';

    ASSERT to_regprocedure(
        'public.indicateurs_gaz_effet_serre(site_labellisation)'
    ) IS NOT NULL
    AND position(
        'iri.periodicite'
        IN pg_get_functiondef(
            'public.indicateurs_gaz_effet_serre(site_labellisation)'::regprocedure
        )
    ) > 0,
        'La fonction publique des GES doit transporter la périodicité';

    -- Le changement suivant remplace le trigger compatible qui normalise et
    -- audite par le trigger strict. L'un des deux doit toujours fermer la
    -- fenêtre de course entre l'audit et les écritures.
    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgrelid = 'public.indicateur_valeur'::regclass
          AND tgname IN (
              'auditer_et_normaliser_date_indicateur_en_transition',
              'verifier_date_valeur_selon_periodicite'
          )
          AND tgenabled = 'O'
          AND NOT tgisinternal
    ), 'Les écritures de valeurs doivent être auditées en transition ou strictement validées';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'assainir_audit_periodicite_indicateur'
          AND tgrelid = 'public.indicateur_valeur'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
    ), 'Le cycle de vie d''une ligne doit invalider son audit devenu obsolète';
END $$;

ROLLBACK;
