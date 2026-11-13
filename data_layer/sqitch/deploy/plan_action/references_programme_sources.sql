-- Deploy tet:plan_action/references_programme_sources to pg
-- requires: plan_action/plan_action
-- requires: indicateur/fusion
-- requires: private_schema
-- requires: utils/auth

BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE FUNCTION private.are_plan_reference_codes_valid(codes text[])
    RETURNS boolean
    LANGUAGE sql
    IMMUTABLE
    STRICT
    PARALLEL SAFE
    SET search_path = pg_catalog
AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM unnest(codes) AS code
        WHERE code IS NULL OR code !~ '[^[:space:]]'
    );
$$;

ALTER TABLE public.axe
    ADD COLUMN reference_programme text,
    ADD COLUMN reference_code text,
    ADD COLUMN engagements_codes text[],
    ADD COLUMN indicateur_source_metadonnee_id integer,
    ADD CONSTRAINT axe_reference_check CHECK (
        (reference_programme IS NULL AND reference_code IS NULL AND engagements_codes IS NULL)
        OR
        (reference_programme IS NOT NULL AND reference_programme ~ '[^[:space:]]'
            AND (
                (parent IS NULL AND reference_code IS NULL AND engagements_codes IS NOT NULL)
                OR
                (parent IS NOT NULL AND reference_code IS NOT NULL
                    AND reference_code ~ '[^[:space:]]' AND engagements_codes IS NULL)
            ))
    ),
    ADD CONSTRAINT axe_engagements_codes_check CHECK (
        engagements_codes IS NULL OR private.are_plan_reference_codes_valid(engagements_codes)
    ),
    ADD CONSTRAINT axe_indicateur_source_root_check CHECK (
        parent IS NULL OR indicateur_source_metadonnee_id IS NULL
    ),
    ADD CONSTRAINT axe_indicateur_source_metadonnee_id_key
        UNIQUE (indicateur_source_metadonnee_id),
    ADD CONSTRAINT axe_indicateur_source_metadonnee_id_fkey
        FOREIGN KEY (indicateur_source_metadonnee_id)
        REFERENCES public.indicateur_source_metadonnee(id) ON DELETE RESTRICT;

ALTER TABLE public.fiche_action
    ADD COLUMN reference_programme text,
    ADD COLUMN reference_kind text,
    ADD COLUMN reference_code text,
    ADD COLUMN reference_parent_code text,
    ADD CONSTRAINT fiche_action_reference_check CHECK (
        (reference_programme IS NULL AND reference_kind IS NULL
            AND reference_code IS NULL AND reference_parent_code IS NULL)
        OR
        (reference_programme IS NOT NULL AND reference_programme ~ '[^[:space:]]'
            AND reference_kind IS NOT NULL
            AND reference_kind IN ('action', 'sous_action', 'indicateur_booleen', 'engagement')
            AND reference_code IS NOT NULL AND reference_code ~ '[^[:space:]]'
            AND (
                (reference_kind = 'sous_action' AND reference_parent_code IS NOT NULL
                    AND reference_parent_code ~ '[^[:space:]]')
                OR (reference_kind <> 'sous_action' AND reference_parent_code IS NULL)
            ))
    );

COMMENT ON COLUMN public.axe.reference_programme IS
    'Programme de référence du plan ou de l''axe, attribué par les services internes ; indépendant du titre.';
COMMENT ON COLUMN public.axe.reference_code IS
    'Identité métier de l''axe ou du sous-axe dans le programme ; NULL sur la racine et les axes libres.';
COMMENT ON COLUMN public.axe.engagements_codes IS
    'Sélection explicite des engagements sur la racine ; distincte des axes créés. Un tableau vide représente une sélection vide.';
COMMENT ON COLUMN public.axe.indicateur_source_metadonnee_id IS
    'Métadonnée exacte des valeurs propres au plan, réservée à cette racine. Supprimer le plan conserve la métadonnée et les valeurs.';
COMMENT ON COLUMN public.fiche_action.reference_programme IS
    'Programme de référence de la fiche, attribué par les services internes ; une fiche liée par URL conserve sa référence.';
COMMENT ON COLUMN public.fiche_action.reference_kind IS
    'Nature de l''identité métier dans le programme : action, sous_action, indicateur_booleen ou engagement.';
COMMENT ON COLUMN public.fiche_action.reference_code IS
    'Identité métier de la fiche dans le programme, conservée après renommage et déplacement.';
COMMENT ON COLUMN public.fiche_action.reference_parent_code IS
    'Code de l''action catalogue parente au moment de l''import ; conservé après déplacement de la fiche ou mise à jour du catalogue. NULL pour les autres références.';

CREATE FUNCTION private.protect_plan_reference_fields()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = pg_catalog
AS $$
DECLARE
    field_name text;
    new_fields jsonb;
    old_fields jsonb;
BEGIN
    -- La métadonnée ne porte pas de collectivité : la racine en est le propriétaire.
    IF TG_TABLE_NAME = 'axe' AND TG_OP = 'UPDATE' THEN
        IF OLD.indicateur_source_metadonnee_id IS NOT NULL
            AND NEW.collectivite_id IS DISTINCT FROM OLD.collectivite_id THEN
            RAISE EXCEPTION 'La collectivité d''un plan portant une source ne peut pas être modifiée'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    -- current_user seul devient le propriétaire de la fonction dans une RPC SECURITY DEFINER.
    IF current_user IN ('anon', 'authenticated')
        OR current_setting('role', true) IN ('anon', 'authenticated')
        OR auth.role() IN ('anon', 'authenticated') THEN
        new_fields := to_jsonb(NEW);
        old_fields := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;

        FOREACH field_name IN ARRAY TG_ARGV LOOP
            IF (new_fields ->> field_name) IS DISTINCT FROM (old_fields ->> field_name) THEN
                RAISE EXCEPTION 'L''attribution des références et sources est réservée aux services internes'
                    USING ERRCODE = '42501';
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER axe_protect_reference_fields
    BEFORE INSERT OR UPDATE ON public.axe
    FOR EACH ROW EXECUTE FUNCTION private.protect_plan_reference_fields(
        'reference_programme', 'reference_code', 'engagements_codes', 'indicateur_source_metadonnee_id'
    );

CREATE TRIGGER fiche_action_protect_reference_fields
    BEFORE INSERT OR UPDATE ON public.fiche_action
    FOR EACH ROW EXECUTE FUNCTION private.protect_plan_reference_fields(
        'reference_programme', 'reference_kind', 'reference_code', 'reference_parent_code'
    );

COMMIT;
