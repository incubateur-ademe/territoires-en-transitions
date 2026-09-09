-- Revert tet:indicateur/periodicite_obligatoire from pg

BEGIN;

SELECT pg_advisory_xact_lock(
    hashtextextended('indicateur-calculation-graph', 0)
);
LOCK TABLE public.indicateur_definition IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN ACCESS EXCLUSIVE MODE;

SELECT migration.verifier_retrait_periodicite_indicateur();
CREATE UNIQUE INDEX unique_indicateur_valeur_utilisateur
    ON public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur)
    WHERE metadonnee_id IS NULL;
CREATE UNIQUE INDEX unique_indicateur_valeur_importee
    ON public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id)
    WHERE metadonnee_id IS NOT NULL;

DROP TRIGGER verifier_date_valeur_selon_periodicite
    ON public.indicateur_valeur;
DROP FUNCTION public.verifier_date_valeur_selon_periodicite();

ALTER TABLE public.indicateur_definition
    ALTER COLUMN periodicite DROP NOT NULL,
    ALTER COLUMN periodicite SET DEFAULT 'annuelle';

-- Restaure exactement l'état de transition du changement précédent afin
-- qu'un nouveau déploiement puisse rejouer l'audit avant le verrouillage.
CREATE FUNCTION migration.auditer_et_normaliser_dates_indicateur()
    RETURNS void
    LANGUAGE plpgsql
AS $$
BEGIN
    -- Une ligne peut avoir été supprimée ou réaffectée depuis son audit. Dans
    -- ce cas l'audit ne décrit plus son identité métier et ne doit jamais être
    -- rejoué sur le nouveau tuple qui aurait réutilisé le même identifiant.
    DELETE FROM migration.indicateur_valeur_periodicite_audit audit
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.indicateur_valeur valeur
        WHERE valeur.id = audit.valeur_id
          AND valeur.indicateur_id = audit.indicateur_id
          AND valeur.collectivite_id = audit.collectivite_id
          AND valeur.metadonnee_id IS NOT DISTINCT FROM audit.metadonnee_id
    );

    DELETE FROM migration.indicateur_valeur_periodicite_audit audit
    WHERE audit.statut = 'conflit'
      AND NOT EXISTS (
          SELECT 1
          FROM public.indicateur_valeur valeur
          JOIN public.indicateur_definition definition
            ON definition.id = valeur.indicateur_id
          WHERE valeur.id = audit.valeur_id
            AND valeur.date_valeur <> public.indicateur_date_debut_periode(
                valeur.periodicite,
                valeur.date_valeur
            )
      );

    INSERT INTO migration.indicateur_valeur_periodicite_audit
        (valeur_id,
         indicateur_id,
         collectivite_id,
         metadonnee_id,
         periodicite,
         date_valeur_avant,
         date_valeur_canonique,
         statut)
    WITH valeurs_avec_date_canonique AS (
        SELECT valeur.id AS valeur_id,
               valeur.indicateur_id,
               valeur.collectivite_id,
               valeur.metadonnee_id,
               valeur.periodicite AS periodicite,
               valeur.date_valeur AS date_valeur_avant,
               public.indicateur_date_debut_periode(
                   valeur.periodicite,
                   valeur.date_valeur
               ) AS date_valeur_canonique
        FROM public.indicateur_valeur valeur
        JOIN public.indicateur_definition definition
          ON definition.id = valeur.indicateur_id
    ),
    valeurs_non_canoniques AS (
        SELECT *
        FROM valeurs_avec_date_canonique
        WHERE date_valeur_avant <> date_valeur_canonique
    )
    SELECT valeur.valeur_id,
           valeur.indicateur_id,
           valeur.collectivite_id,
           valeur.metadonnee_id,
           valeur.periodicite,
           valeur.date_valeur_avant,
           valeur.date_valeur_canonique,
           CASE WHEN EXISTS (
               SELECT 1
               FROM public.indicateur_valeur autre
               WHERE autre.id <> valeur.valeur_id
                 AND autre.indicateur_id = valeur.indicateur_id
                 AND autre.periodicite = valeur.periodicite
                 AND autre.collectivite_id = valeur.collectivite_id
                 AND autre.metadonnee_id IS NOT DISTINCT FROM valeur.metadonnee_id
                 AND public.indicateur_date_debut_periode(
                         valeur.periodicite,
                         autre.date_valeur
                     ) = valeur.date_valeur_canonique
           ) THEN 'conflit' ELSE 'normalisee' END
    FROM valeurs_non_canoniques valeur
    ON CONFLICT (valeur_id) DO UPDATE
    SET indicateur_id = EXCLUDED.indicateur_id,
        collectivite_id = EXCLUDED.collectivite_id,
        metadonnee_id = EXCLUDED.metadonnee_id,
        periodicite = EXCLUDED.periodicite,
        date_valeur_avant = EXCLUDED.date_valeur_avant,
        date_valeur_canonique = EXCLUDED.date_valeur_canonique,
        statut = EXCLUDED.statut,
        audited_at = CURRENT_TIMESTAMP;

    UPDATE public.indicateur_valeur valeur
    SET date_valeur = audit.date_valeur_canonique
    FROM migration.indicateur_valeur_periodicite_audit audit
    WHERE audit.valeur_id = valeur.id
      AND audit.statut = 'normalisee'
      AND valeur.indicateur_id = audit.indicateur_id
      AND valeur.collectivite_id = audit.collectivite_id
      AND valeur.metadonnee_id IS NOT DISTINCT FROM audit.metadonnee_id
      AND valeur.date_valeur = audit.date_valeur_avant;
END;
$$;

CREATE FUNCTION migration.auditer_et_normaliser_date_indicateur_en_transition()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
DECLARE
    definition_periodicite text;
    date_canonique date;
    statut_audit text;
BEGIN
    SELECT NEW.periodicite
    INTO definition_periodicite
    FROM public.indicateur_definition definition
    WHERE definition.id = NEW.indicateur_id
    FOR SHARE;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Un audit est attaché au tuple métier, pas seulement à l'identifiant
    -- technique de la ligne. Une réaffectation canonique ne passe pas par la
    -- normalisation ci-dessous : supprimer ici son ancien audit évite qu'un
    -- futur rejeu de la migration ne le lui applique.
    DELETE FROM migration.indicateur_valeur_periodicite_audit audit
    WHERE audit.valeur_id = NEW.id
      AND (
          audit.indicateur_id IS DISTINCT FROM NEW.indicateur_id
          OR audit.collectivite_id IS DISTINCT FROM NEW.collectivite_id
          OR audit.metadonnee_id IS DISTINCT FROM NEW.metadonnee_id
      );

    date_canonique := public.indicateur_date_debut_periode(
        definition_periodicite,
        NEW.date_valeur
    );

    -- Même espace de verrou que les repositories applicatifs. Le verrou est
    -- pris aussi pour une date déjà canonique : deux anciennes écritures de
    -- la même période ne peuvent ainsi observer simultanément une clé métier
    -- encore absente, puis se normaliser l'une sur l'autre.
    PERFORM pg_advisory_xact_lock(
        hashtextextended(
            format(
                'indicateur-valeur:%s:%s',
                NEW.collectivite_id,
                to_char(date_canonique, 'YYYY-MM-DD')
            ),
            0
        )
    );

    IF NEW.date_valeur = date_canonique THEN
        -- Un conflit corrigé explicitement n'est plus à remédier. Conserver en
        -- revanche les audits normalisés du même tuple pour rendre possible
        -- le revert de l'étape d'expansion.
        DELETE FROM migration.indicateur_valeur_periodicite_audit audit
        WHERE audit.valeur_id = NEW.id
          AND audit.statut = 'conflit';
        RETURN NEW;
    END IF;

    statut_audit := CASE WHEN EXISTS (
        SELECT 1
        FROM public.indicateur_valeur autre
        WHERE autre.id <> NEW.id
          AND autre.indicateur_id = NEW.indicateur_id
          AND autre.periodicite = NEW.periodicite
          AND autre.collectivite_id = NEW.collectivite_id
          AND autre.metadonnee_id IS NOT DISTINCT FROM NEW.metadonnee_id
          AND public.indicateur_date_debut_periode(
                  definition_periodicite,
                  autre.date_valeur
              ) = date_canonique
    ) THEN 'conflit' ELSE 'normalisee' END;

    -- Après l'audit initial, ne jamais laisser une ancienne instance créer
    -- une nouvelle ligne que l'application canonique ne saurait hydrater. Un
    -- conflit demande une décision métier ; l'écriture est donc atomiquement
    -- refusée au lieu de persister une date ambiguë.
    IF statut_audit = 'conflit' THEN
        RAISE EXCEPTION USING
            ERRCODE = '23505',
            MESSAGE = format(
                'La date %s entre en conflit avec une période %s existante pour l''indicateur %s',
                NEW.date_valeur,
                date_canonique,
                NEW.indicateur_id
            );
    END IF;

    INSERT INTO migration.indicateur_valeur_periodicite_audit
        (valeur_id,
         indicateur_id,
         collectivite_id,
         metadonnee_id,
         periodicite,
         date_valeur_avant,
         date_valeur_canonique,
         statut)
    VALUES
        (NEW.id,
         NEW.indicateur_id,
         NEW.collectivite_id,
         NEW.metadonnee_id,
         definition_periodicite,
         NEW.date_valeur,
         date_canonique,
         statut_audit)
    ON CONFLICT (valeur_id) DO UPDATE
    SET indicateur_id = EXCLUDED.indicateur_id,
        collectivite_id = EXCLUDED.collectivite_id,
        metadonnee_id = EXCLUDED.metadonnee_id,
        periodicite = EXCLUDED.periodicite,
        date_valeur_avant = EXCLUDED.date_valeur_avant,
        date_valeur_canonique = EXCLUDED.date_valeur_canonique,
        statut = EXCLUDED.statut,
        audited_at = CURRENT_TIMESTAMP;

    IF statut_audit = 'normalisee' THEN
        NEW.date_valeur := date_canonique;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER auditer_et_normaliser_date_indicateur_en_transition
    BEFORE INSERT OR UPDATE OF indicateur_id, collectivite_id, periodicite, date_valeur, metadonnee_id
    ON public.indicateur_valeur
    FOR EACH ROW
    EXECUTE FUNCTION migration.auditer_et_normaliser_date_indicateur_en_transition();

COMMENT ON COLUMN public.indicateur_definition.periodicite IS
    'Cadence en cours de classification, référencée dans public.indicateur_periodicite.';

COMMIT;
