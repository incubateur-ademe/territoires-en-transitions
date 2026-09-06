-- Deploy tet:indicateur/periodicite to pg
-- requires: indicateur/referentiel
-- requires: indicateur/indicateurs_gaz_effet_serre
-- requires: demarche/pcaet_diagnostic_drop_referentiel_tables
-- requires: migration_schema

BEGIN;

-- Fige d'abord les définitions puis leurs valeurs. Cet ordre laisse finir une
-- ancienne suppression de définition et sa cascade avant que la migration ne
-- détienne le verrou de la table de valeurs.
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

-- Une périodicité est une description de cadence immuable, et non une série
-- de branches recopiées dans chaque consommateur. Les deux périodicités
-- livrées utilisent la même famille calendaire fondée sur le mois.
CREATE TABLE public.indicateur_periodicite
(
    code               text     PRIMARY KEY,
    unite_calendaire   text     NOT NULL
        CHECK (unite_calendaire IN ('mois', 'semaine', 'jour')),
    nombre_unites      integer  NOT NULL CHECK (nombre_unites > 0),
    date_ancrage       date     NOT NULL
        CONSTRAINT indicateur_periodicite_date_ancrage_supported_check
        CHECK (date_ancrage BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'),
    CONSTRAINT indicateur_periodicite_mois_valides_check
        CHECK (
            unite_calendaire <> 'mois'
            OR (
                EXTRACT(DAY FROM date_ancrage) = 1
                AND MOD(12, nombre_unites) = 0
            )
        )
);

COMMENT ON TABLE public.indicateur_periodicite IS
    'Catalogue en lecture seule des cadences applicables aux indicateurs. Une politique publiée est immuable ; changer son sens exige un nouveau code.';
COMMENT ON COLUMN public.indicateur_periodicite.date_ancrage IS
    'Début d''une période de référence utilisé pour aligner toutes les occurrences de la cadence.';

INSERT INTO public.indicateur_periodicite
    (code, unite_calendaire, nombre_unites, date_ancrage)
VALUES
    ('annuelle', 'mois', 12, DATE '2000-01-01'),
    ('mensuelle', 'mois', 1, DATE '2000-01-01');

-- Catalogue public en lecture, mais administré uniquement par migration. Sans
-- cette frontière un client REST pourrait ajouter une cadence inconnue du
-- registre TypeScript ou modifier une ligne pas encore utilisée.
ALTER TABLE public.indicateur_periodicite ENABLE ROW LEVEL SECURITY;
CREATE POLICY indicateur_periodicite_allow_read
    ON public.indicateur_periodicite
    FOR SELECT
    USING (true);
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON public.indicateur_periodicite
    FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.indicateur_periodicite
    TO anon, authenticated, service_role;

-- Unique implémentation SQL de l'arithmétique des cadences. Ajouter une
-- cadence utilisant une famille existante ne requiert qu'une ligne de
-- catalogue ; une nouvelle famille est ajoutée ici et nulle part ailleurs.
CREATE FUNCTION public.indicateur_date_debut_periode(
    periodicite_code text,
    date_a_classer date
)
    RETURNS date
    LANGUAGE plpgsql
    STABLE
    STRICT
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
DECLARE
    periodicite public.indicateur_periodicite%ROWTYPE;
    ecart_unites integer;
    index_periode integer;
    date_debut date;
BEGIN
    -- Garde la base et le value object TypeScript sur le même domaine de
    -- dates. Sans cette borne, PostgreSQL accepterait des dates impossibles à
    -- hydrater par l'application (années à cinq chiffres ou dates av. J.-C.).
    IF date_a_classer NOT BETWEEN DATE '0001-01-01' AND DATE '9999-12-31' THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'Date hors du calendrier pris en charge pour les périodes d''indicateur : %s',
                date_a_classer
            );
    END IF;

    SELECT catalogue.*
    INTO periodicite
    FROM public.indicateur_periodicite catalogue
    WHERE catalogue.code = periodicite_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format('Périodicité d''indicateur inconnue : %s', periodicite_code);
    END IF;

    IF periodicite.unite_calendaire = 'mois' THEN
        ecart_unites :=
            (EXTRACT(YEAR FROM date_a_classer)::integer * 12
             + EXTRACT(MONTH FROM date_a_classer)::integer)
            - (EXTRACT(YEAR FROM periodicite.date_ancrage)::integer * 12
               + EXTRACT(MONTH FROM periodicite.date_ancrage)::integer);
        index_periode :=
            floor(ecart_unites::numeric / periodicite.nombre_unites)::integer;
        date_debut := (
            date_trunc('month', periodicite.date_ancrage)::date
            + index_periode * periodicite.nombre_unites * INTERVAL '1 month'
        )::date;
    ELSIF periodicite.unite_calendaire = 'semaine' THEN
        ecart_unites := date_a_classer - periodicite.date_ancrage;
        index_periode :=
            floor(ecart_unites::numeric / (periodicite.nombre_unites * 7))::integer;
        date_debut := periodicite.date_ancrage
            + index_periode * periodicite.nombre_unites * 7;
    ELSIF periodicite.unite_calendaire = 'jour' THEN
        ecart_unites := date_a_classer - periodicite.date_ancrage;
        index_periode :=
            floor(ecart_unites::numeric / periodicite.nombre_unites)::integer;
        date_debut := periodicite.date_ancrage
            + index_periode * periodicite.nombre_unites;
    ELSE
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'Unité calendaire non prise en charge pour la périodicité %s',
                periodicite_code
            );
    END IF;

    IF date_debut NOT BETWEEN DATE '0001-01-01' AND DATE '9999-12-31' THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'Début de période hors du calendrier pris en charge : %s',
                date_debut
            );
    END IF;

    RETURN date_debut;
END;
$$;

COMMENT ON FUNCTION public.indicateur_date_debut_periode(text, date) IS
    'Retourne le début canonique de la période contenant une date, selon le catalogue des périodicités.';

-- La colonne reste nullable pendant cette première étape de déploiement
-- progressif. La clé étrangère remplace une liste de valeurs codée en dur.
ALTER TABLE public.indicateur_definition
    ADD COLUMN periodicite text DEFAULT 'annuelle',
    ADD CONSTRAINT indicateur_definition_periodicite_fkey
        FOREIGN KEY (periodicite)
        REFERENCES public.indicateur_periodicite(code);

-- Les définitions historiques ont été conçues et exposées comme annuelles. La
-- classification ne se déduit jamais des dates déjà saisies.
UPDATE public.indicateur_definition
SET periodicite = 'annuelle'
WHERE periodicite IS NULL;

-- La fonction publique doit transporter la cadence avec chaque valeur. Elle
-- ne projette pas elle-même une période sur une année : le consommateur peut
-- ainsi appliquer explicitement sa capacité (annuelle aujourd'hui) et échouer
-- fermé si une cadence incompatible lui parvient.
CREATE OR REPLACE FUNCTION public.indicateurs_gaz_effet_serre(site_labellisation)
    RETURNS jsonb
    SECURITY DEFINER
    LANGUAGE sql
BEGIN ATOMIC
SELECT to_jsonb(array_agg(d))
FROM (
    SELECT iri.date_valeur,
           iri.resultat,
           id.identifiant_referentiel AS identifiant,
           id.periodicite,
           src.libelle AS source
    FROM indicateur_valeur iri
    JOIN indicateur_definition id ON iri.indicateur_id = id.id
    JOIN indicateur_source_metadonnee ism ON ism.id = iri.metadonnee_id
    JOIN indicateur_source src ON src.id = ism.source_id
    WHERE iri.collectivite_id = ($1).collectivite_id
      AND iri.metadonnee_id IS NOT NULL
      AND iri.resultat IS NOT NULL
      AND src.id IN ('citepa')
      AND id.identifiant_referentiel::text = ANY (
          ARRAY [
              'cae_1.g'::character varying,
              'cae_1.f'::character varying,
              'cae_1.h'::character varying,
              'cae_1.j'::character varying,
              'cae_1.i'::character varying,
              'cae_1.c'::character varying,
              'cae_1.e'::character varying,
              'cae_1.d'::character varying,
              'cae_1.a'::character varying
          ]::text[]
      )
) d;
END;

-- Le schéma historique ne sait représenter qu'une cadence annuelle. Ce garde
-- partagé par les reverts du reporting et du catalogue empêche un downgrade
-- partiel ou une perte silencieuse dès qu'une autre cadence est utilisée.
CREATE FUNCTION migration.verifier_retrait_periodicite_indicateur()
    RETURNS void
    LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.indicateur_definition
        WHERE COALESCE(periodicite, 'annuelle') <> 'annuelle'
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Impossible de retirer la périodicité tant que des définitions non annuelles existent ; effectuer d''abord une migration métier explicite';
    END IF;
END;
$$;

COMMENT ON FUNCTION migration.verifier_retrait_periodicite_indicateur() IS
    'Refuse un retour au schéma annuel lorsque celui-ci perdrait le sens de définitions non annuelles.';

-- Une politique publiée ne change jamais de sens, qu'elle soit déjà utilisée
-- ou non. Toute évolution ajoute un nouveau code par migration ; cette règle
-- inconditionnelle ferme aussi la course avec une attribution concurrente.
CREATE FUNCTION public.empecher_modification_periodicite()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
BEGIN
    RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = format(
            'La politique de périodicité %s est immuable ; créer un nouveau code',
            OLD.code
        );
END;
$$;

CREATE TRIGGER empecher_modification_periodicite
    BEFORE UPDATE OR DELETE
    ON public.indicateur_periodicite
    FOR EACH ROW
    EXECUTE FUNCTION public.empecher_modification_periodicite();

-- Conserve la date d'origine de chaque valeur non canonique. Les groupes qui
-- convergeraient vers la même période sont seulement audités : les fusionner
-- automatiquement ferait perdre une information métier sans règle explicite.
CREATE TABLE migration.indicateur_valeur_periodicite_audit
(
    valeur_id             integer PRIMARY KEY,
    indicateur_id         integer NOT NULL,
    collectivite_id       integer NOT NULL,
    metadonnee_id         integer,
    periodicite           text NOT NULL,
    date_valeur_avant     date NOT NULL,
    date_valeur_canonique date NOT NULL,
    statut                text NOT NULL
        CHECK (statut IN ('normalisee', 'conflit')),
    audited_at            timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE migration.indicateur_valeur_periodicite_audit IS
    'Audit réversible des dates non canoniques rencontrées lors de la migration de périodicité. Les conflits exigent une remédiation métier explicite.';

-- Cette fonction est rejouée par l'étape de verrouillage afin de couvrir les
-- écritures effectuées par une ancienne version entre les deux changements.
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
                COALESCE(definition.periodicite, 'annuelle'),
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
               COALESCE(definition.periodicite, 'annuelle') AS periodicite,
               valeur.date_valeur AS date_valeur_avant,
               public.indicateur_date_debut_periode(
                   COALESCE(definition.periodicite, 'annuelle'),
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

ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_at;
ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_by;
SELECT migration.auditer_et_normaliser_dates_indicateur();
ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_by;
ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_at;

-- Les valeurs peuvent être écrites concurremment, mais leur calcul doit voir
-- un graphe de formules et de périodicités stable. Les triggers statement-level
-- prennent le verrou avant tout verrou de ligne, y compris pour un writer SQL
-- qui ne passe pas par les repositories applicatifs.
CREATE FUNCTION public.verrouiller_graphe_calcul_indicateur_partage()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock_shared(
        hashtextextended('indicateur-calculation-graph', 0)
    );
    RETURN NULL;
END;
$$;

CREATE FUNCTION public.verrouiller_graphe_calcul_indicateur_exclusif()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(
        hashtextextended('indicateur-calculation-graph', 0)
    );
    RETURN NULL;
END;
$$;

CREATE TRIGGER verrouiller_graphe_calcul_indicateur_valeur
    BEFORE INSERT OR UPDATE OR DELETE
    ON public.indicateur_valeur
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.verrouiller_graphe_calcul_indicateur_partage();

CREATE TRIGGER verrouiller_graphe_calcul_indicateur_definition
    BEFORE INSERT OR DELETE
    ON public.indicateur_definition
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.verrouiller_graphe_calcul_indicateur_exclusif();

CREATE TRIGGER verrouiller_graphe_calcul_indicateur_definition_update
    BEFORE UPDATE OF id, collectivite_id, identifiant_referentiel,
                     valeur_calcule, periodicite
    ON public.indicateur_definition
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.verrouiller_graphe_calcul_indicateur_exclusif();

REVOKE EXECUTE
    ON FUNCTION public.verrouiller_graphe_calcul_indicateur_partage(),
                public.verrouiller_graphe_calcul_indicateur_exclusif()
    FROM PUBLIC, anon, authenticated, service_role;

-- À partir de cet instant, un audit normalisé ne reste réversible que tant
-- que la ligne représente la même occurrence métier. Ce trigger est créé
-- après la normalisation initiale et reste actif pendant les phases expand et
-- contract. Son nom le fait exécuter avant le trigger d'audit transitoire.
CREATE FUNCTION migration.assainir_audit_periodicite_indicateur()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        DELETE FROM migration.indicateur_valeur_periodicite_audit
        WHERE valeur_id = OLD.id;
        RETURN OLD;
    END IF;

    IF TG_OP = 'INSERT' THEN
        DELETE FROM migration.indicateur_valeur_periodicite_audit
        WHERE valeur_id = NEW.id;
        RETURN NEW;
    END IF;

    DELETE FROM migration.indicateur_valeur_periodicite_audit audit
    WHERE audit.valeur_id = NEW.id
      AND (
          audit.indicateur_id IS DISTINCT FROM NEW.indicateur_id
          OR audit.collectivite_id IS DISTINCT FROM NEW.collectivite_id
          OR audit.metadonnee_id IS DISTINCT FROM NEW.metadonnee_id
          OR audit.date_valeur_canonique IS DISTINCT FROM NEW.date_valeur
      );
    RETURN NEW;
END;
$$;

CREATE TRIGGER assainir_audit_periodicite_indicateur
    BEFORE INSERT OR UPDATE OF indicateur_id, collectivite_id, date_valeur, metadonnee_id OR DELETE
    ON public.indicateur_valeur
    FOR EACH ROW
    EXECUTE FUNCTION migration.assainir_audit_periodicite_indicateur();

-- Pendant la fenêtre de déploiement, l'ancienne application peut encore
-- envoyer une date annuelle quelconque. Le trigger l'audite et la normalise
-- seulement en l'absence de collision.
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
    SELECT COALESCE(definition.periodicite, 'annuelle')
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
    BEFORE INSERT OR UPDATE OF indicateur_id, collectivite_id, date_valeur, metadonnee_id
    ON public.indicateur_valeur
    FOR EACH ROW
    EXECUTE FUNCTION migration.auditer_et_normaliser_date_indicateur_en_transition();

-- L'immuabilité de la cadence ne dépend pas de NOT NULL : l'installer dès
-- l'étape compatible ferme aussi la course avec l'écriture d'une valeur.
CREATE FUNCTION public.empecher_changement_periodicite_indicateur()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
BEGIN
    IF COALESCE(OLD.periodicite, 'annuelle')
           IS DISTINCT FROM COALESCE(NEW.periodicite, 'annuelle') THEN
      IF EXISTS (
           SELECT 1
           FROM public.indicateur_valeur valeur
           WHERE valeur.indicateur_id = OLD.id
       ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'La périodicité de l''indicateur %s ne peut plus changer après sa première valeur',
                OLD.id
            );
      END IF;

      IF EXISTS (
          SELECT 1
          FROM public.indicateur_groupe groupe
          JOIN public.indicateur_definition autre_definition
            ON autre_definition.id = CASE
                WHEN groupe.parent = OLD.id THEN groupe.enfant
                ELSE groupe.parent
            END
          WHERE OLD.id IN (groupe.parent, groupe.enfant)
            AND autre_definition.id <> OLD.id
            AND COALESCE(autre_definition.periodicite, 'annuelle')
                IS DISTINCT FROM COALESCE(NEW.periodicite, 'annuelle')
      ) THEN
          RAISE EXCEPTION USING
              ERRCODE = '23514',
              MESSAGE = format(
                  'La périodicité de l''indicateur %s doit rester identique à celle de son groupe',
                  OLD.id
              );
      END IF;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.empecher_changement_periodicite_indicateur() IS
    'Interdit de réinterpréter les valeurs existantes en changeant la périodicité de leur définition.';

CREATE TRIGGER empecher_changement_periodicite_indicateur
    BEFORE UPDATE OF periodicite
    ON public.indicateur_definition
    FOR EACH ROW
    EXECUTE FUNCTION public.empecher_changement_periodicite_indicateur();

-- Un groupe est une agrégation, pas une règle implicite de conversion. Les
-- deux définitions sont verrouillées dans l'ordre de leur identifiant afin
-- de sérialiser ce contrôle avec une modification concurrente de cadence.
CREATE FUNCTION public.verifier_periodicite_groupe_indicateur()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
DECLARE
    periodicite_parent text;
    periodicite_enfant text;
BEGIN
    PERFORM 1
    FROM public.indicateur_definition definition
    WHERE definition.id IN (NEW.parent, NEW.enfant)
    ORDER BY definition.id
    FOR SHARE;

    SELECT parent.periodicite, enfant.periodicite
    INTO periodicite_parent, periodicite_enfant
    FROM public.indicateur_definition parent
    CROSS JOIN public.indicateur_definition enfant
    WHERE parent.id = NEW.parent
      AND enfant.id = NEW.enfant;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '23503',
            MESSAGE = 'Les deux définitions du groupe doivent exister';
    END IF;

    IF COALESCE(periodicite_parent, 'annuelle')
           IS DISTINCT FROM COALESCE(periodicite_enfant, 'annuelle') THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'Le parent %s et l''enfant %s d''un groupe doivent avoir la même périodicité',
                NEW.parent,
                NEW.enfant
            );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER verifier_periodicite_groupe_indicateur
    BEFORE INSERT OR UPDATE OF parent, enfant
    ON public.indicateur_groupe
    FOR EACH ROW
    EXECUTE FUNCTION public.verifier_periodicite_groupe_indicateur();

COMMENT ON COLUMN public.indicateur_definition.periodicite IS
    'Cadence en cours de classification, référencée dans public.indicateur_periodicite.';

COMMIT;
