-- Revert tet:indicateur/correct-dates-historiques from pg

BEGIN;
SET LOCAL TIME ZONE 'UTC';
SET LOCAL DateStyle = 'ISO, YMD';
SET LOCAL lock_timeout = '5s';

DO $restore$
DECLARE
    archived record;
    trigger_state record;
    column_names text;
    restored_columns text;
    schema_columns text[];
BEGIN
    IF to_regclass('private.indicateur_valeur_date_repair') IS NULL THEN
        RETURN;
    END IF;
    LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;
    LOCK TABLE private.indicateur_valeur_date_repair IN SHARE ROW EXCLUSIVE MODE;
    PERFORM v.id FROM public.indicateur_valeur v
        JOIN private.indicateur_valeur_date_repair a ON a.valeur_id = v.id
        FOR UPDATE OF v;

    SELECT array_agg(attname::text ORDER BY attname),
           string_agg(format('%I', attname), ', ' ORDER BY attnum),
           string_agg(format('restored.%I', attname), ', ' ORDER BY attnum)
    INTO schema_columns, column_names, restored_columns
    FROM pg_attribute WHERE attrelid = 'public.indicateur_valeur'::regclass
        AND attnum > 0 AND NOT attisdropped;

    -- Revenir d'abord sur les migrations de schéma plus récentes. Restaurer une
    -- ancienne image dans un autre contrat risquerait de perdre des colonnes.
    IF EXISTS (
        SELECT 1 FROM private.indicateur_valeur_date_repair a
        WHERE ARRAY(SELECT jsonb_object_keys(a.avant) ORDER BY 1) IS DISTINCT FROM schema_columns
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Le schéma des observations a changé : revenir sur les migrations suivantes avant cette réparation';
    END IF;

    IF EXISTS (
        SELECT 1 FROM private.indicateur_valeur_date_repair a
        LEFT JOIN public.indicateur_valeur v ON v.id = a.valeur_id
        WHERE CASE WHEN a.apres IS NULL THEN v.id IS NOT NULL
                   ELSE to_jsonb(v) IS DISTINCT FROM a.apres END
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Une observation a changé depuis la réparation : restauration refusée';
    END IF;

    IF EXISTS (
        SELECT 1 FROM private.indicateur_valeur_date_repair a
        JOIN public.indicateur_valeur v ON v.id <> a.valeur_id
            AND v.indicateur_id = (a.avant->>'indicateur_id')::integer
            AND v.collectivite_id = (a.avant->>'collectivite_id')::integer
            AND v.metadonnee_id IS NOT DISTINCT FROM (a.avant->>'metadonnee_id')::integer
            AND v.date_valeur = (a.avant->>'date_valeur')::date
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23505',
            MESSAGE = 'Une autre observation occupe la date initiale : restauration refusée';
    END IF;

    -- Seuls les deux triggers de métadonnées sont suspendus, sous verrou, dans
    -- cette transaction. Les FK et les autres contraintes restent actives.
    CREATE TEMP TABLE indicateur_date_repair_triggers ON COMMIT DROP AS
    SELECT tgname, tgenabled FROM pg_trigger
    WHERE tgrelid = 'public.indicateur_valeur'::regclass
      AND NOT tgisinternal AND tgname IN ('modified_at', 'modified_by');
    FOR trigger_state IN SELECT * FROM indicateur_date_repair_triggers LOOP
        EXECUTE format('ALTER TABLE public.indicateur_valeur DISABLE TRIGGER %I', trigger_state.tgname);
    END LOOP;

    FOR archived IN SELECT * FROM private.indicateur_valeur_date_repair ORDER BY valeur_id LOOP
        IF archived.apres IS NULL THEN
            INSERT INTO public.indicateur_valeur
            SELECT (jsonb_populate_record(NULL::public.indicateur_valeur, archived.avant)).*;
        ELSE
            EXECUTE format(
                'UPDATE public.indicateur_valeur SET (%s) = (SELECT %s FROM jsonb_populate_record(NULL::public.indicateur_valeur, $1) restored) WHERE id = $2',
                column_names, restored_columns
            ) USING archived.avant, archived.valeur_id;
        END IF;
    END LOOP;

    IF EXISTS (
        SELECT 1 FROM private.indicateur_valeur_date_repair a
        LEFT JOIN public.indicateur_valeur v ON v.id = a.valeur_id
        WHERE to_jsonb(v) IS DISTINCT FROM a.avant
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'La restauration ne correspond pas à l’archive';
    END IF;

    FOR trigger_state IN SELECT * FROM indicateur_date_repair_triggers LOOP
        EXECUTE format('ALTER TABLE public.indicateur_valeur %s TRIGGER %I',
            CASE trigger_state.tgenabled WHEN 'A' THEN 'ENABLE ALWAYS'
                WHEN 'R' THEN 'ENABLE REPLICA' WHEN 'D' THEN 'DISABLE' ELSE 'ENABLE' END,
            trigger_state.tgname);
    END LOOP;
    DROP TABLE private.indicateur_valeur_date_repair;
END;
$restore$;

COMMIT;
