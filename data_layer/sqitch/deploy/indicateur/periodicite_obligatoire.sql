-- Deploy tet:indicateur/periodicite_obligatoire to pg
-- requires: indicateur/periodicite

BEGIN;

-- Le contract n'est pas un déploiement ordinaire : il ne devient sûr qu'une
-- fois l'application compatible déployée et les anciennes instances drainées.
-- Cette confirmation de session n'est ni une autorisation ni un feature flag.
-- Seuls les chemins de bootstrap jetable et le workflow contractuel protégé
-- la positionnent pour le processus Sqitch qui franchit cette frontière.
DO $$
BEGIN
    IF current_setting(
        'tet.periodicite_contract_confirmed',
        true
    ) IS DISTINCT FROM 'on' THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'Le contract de périodicité requiert une confirmation explicite après déploiement de l''application compatible';
    END IF;
END $$;

-- Rejoue l'audit sous verrou pour couvrir la fenêtre de compatibilité entre
-- les deux changements, puis installe la validation stricte avant de libérer
-- les écritures.
-- Une écriture canonique verrouille d'abord sa définition FOR SHARE, puis
-- écrit dans indicateur_valeur. La migration suit ce même ordre : elle ne
-- doit pas conserver le verrou des valeurs en attendant une définition déjà
-- tenue par un writer. Les anciennes écritures qui prenaient la valeur en
-- premier sont drainées avant cette étape contractuelle.
SELECT pg_advisory_xact_lock(
    hashtextextended('indicateur-calculation-graph', 0)
);
LOCK TABLE public.indicateur_definition IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE public.indicateur_definition DISABLE TRIGGER modified_at;
ALTER TABLE public.indicateur_definition DISABLE TRIGGER modified_by;
UPDATE public.indicateur_definition
SET periodicite = 'annuelle'
WHERE periodicite IS NULL;
ALTER TABLE public.indicateur_definition ENABLE TRIGGER modified_by;
ALTER TABLE public.indicateur_definition ENABLE TRIGGER modified_at;
ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_at;
ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_by;
SELECT migration.auditer_et_normaliser_dates_indicateur();
ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_by;
ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_at;
DROP FUNCTION migration.auditer_et_normaliser_dates_indicateur();

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.indicateur_definition definition
        LEFT JOIN public.indicateur_periodicite periodicite
          ON periodicite.code = definition.periodicite
        WHERE definition.periodicite IS NULL
           OR periodicite.code IS NULL
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Toutes les définitions doivent être classifiées avant de rendre la périodicité obligatoire';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM migration.indicateur_valeur_periodicite_audit
        WHERE statut = 'conflit'
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Les conflits de dates historiques doivent être remédiés à partir de migration.indicateur_valeur_periodicite_audit avant de verrouiller la périodicité';
    END IF;
END $$;

-- Toute écriture de la fenêtre de transition a déjà persisté son audit
-- dans sa propre transaction. Sous les verrous ci-dessus, on peut maintenant
-- remplacer sans intervalle le trigger de normalisation par le refus strict.
DROP TRIGGER auditer_et_normaliser_date_indicateur_en_transition
    ON public.indicateur_valeur;
DROP FUNCTION migration.auditer_et_normaliser_date_indicateur_en_transition();

ALTER TABLE public.indicateur_definition
    -- L'ancien défaut n'était qu'une façade de compatibilité pour les
    -- instances applicatives antérieures. L'état contractuel échoue fermé :
    -- tout nouveau producteur doit choisir explicitement une périodicité.
    ALTER COLUMN periodicite DROP DEFAULT,
    ALTER COLUMN periodicite SET NOT NULL;

COMMENT ON COLUMN public.indicateur_definition.periodicite IS
    'Cadence recommandée ou imposée par la définition et référencée dans public.indicateur_periodicite.';

CREATE FUNCTION public.verifier_date_valeur_selon_periodicite()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
DECLARE
    definition_periodicite text;
BEGIN
    -- FOR SHARE sérialise l'écriture avec un éventuel changement de maille de
    -- la définition. Un UPDATE de la définition et cet INSERT/UPDATE ne
    -- peuvent donc pas valider chacun un état devenu obsolète.
    SELECT NEW.periodicite
    INTO definition_periodicite
    FROM public.indicateur_definition definition
    WHERE definition.id = NEW.indicateur_id
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '23503',
            MESSAGE = format('La définition de l''indicateur %s n''existe pas', NEW.indicateur_id);
    END IF;

    IF NEW.date_valeur <> public.indicateur_date_debut_periode(
        definition_periodicite,
        NEW.date_valeur
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'La date %s n''est pas le début canonique d''une période %s pour l''indicateur %s',
                NEW.date_valeur,
                definition_periodicite,
                NEW.indicateur_id
            );
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.verifier_date_valeur_selon_periodicite() IS
    'Refuse toute date différente du début canonique calculé par la politique SQL de la périodicité.';

CREATE TRIGGER verifier_date_valeur_selon_periodicite
    BEFORE INSERT OR UPDATE OF indicateur_id, periodicite, date_valeur
    ON public.indicateur_valeur
    FOR EACH ROW
    EXECUTE FUNCTION public.verifier_date_valeur_selon_periodicite();

-- Les clients compatibles incluent désormais la cadence dans chaque conflit.
DROP INDEX public.unique_indicateur_valeur_utilisateur;
DROP INDEX public.unique_indicateur_valeur_importee;

COMMIT;
