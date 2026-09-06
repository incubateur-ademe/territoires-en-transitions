BEGIN;

SELECT plan(61);

CREATE TEMPORARY TABLE test_collectivite_periodicite AS
WITH collectivite AS (
    INSERT INTO public.collectivite (nom, type)
    VALUES ('Collectivité périodicité indicateur', 'epci')
    RETURNING id
)
SELECT id AS collectivite_id
FROM collectivite;

CREATE TEMPORARY TABLE test_indicateur_periodicite AS
WITH indicateurs AS (
    INSERT INTO public.indicateur_definition
        (collectivite_id, identifiant_referentiel, titre, unite, periodicite)
    SELECT collectivite.collectivite_id,
           donnees.referentiel_id,
           donnees.code,
           'kWh',
           donnees.periodicite
    FROM test_collectivite_periodicite collectivite
    CROSS JOIN (VALUES
        ('test-annuel', NULL, 'annuelle'),
        ('test-audit-reaffectation', NULL, 'annuelle'),
        ('test-a-convertir-en-mensuel', NULL, 'annuelle')
    ) AS donnees(code, referentiel_id, periodicite)
    RETURNING id, titre, periodicite
)
SELECT id, titre AS code, periodicite
FROM indicateurs;

CREATE TEMPORARY TABLE test_indicateur_emt_periodicite AS
WITH indicateurs AS (
    INSERT INTO public.indicateur_definition
        (identifiant_referentiel, titre, unite, periodicite)
    VALUES
        ('test_emt_annuel_pg_tap', 'test-emt-annuel', 'kWh', 'annuelle'),
        ('test_emt_mensuel_pg_tap', 'test-emt-mensuel', 'kWh', 'annuelle')
    RETURNING id, titre
)
SELECT id, titre AS code
FROM indicateurs;

SELECT ok(
    to_regprocedure(
        'public.import_indicateur_emt_valeurs(integer,jsonb)'
    ) IS NOT NULL,
    'La frontière transactionnelle de l''import EMT est déployée'
);

SELECT ok(
    has_function_privilege(
        'service_role',
        'public.import_indicateur_emt_valeurs(integer,jsonb)',
        'EXECUTE'
    )
    AND NOT has_function_privilege(
        'anon',
        'public.import_indicateur_emt_valeurs(integer,jsonb)',
        'EXECUTE'
    )
    AND NOT has_function_privilege(
        'authenticated',
        'public.import_indicateur_emt_valeurs(integer,jsonb)',
        'EXECUTE'
    ),
    'Seul le rôle de service peut appeler la RPC EMT'
);

SELECT lives_ok(
    format(
        $$ SELECT public.import_indicateur_emt_valeurs(
               %s,
               jsonb_build_array(jsonb_build_object(
                   'indicateur_id', %s,
                   'periodicite', 'annuelle',
                   'date_debut', '2031-01-01',
                   'resultat', 0,
                   'commentaire', 'commentaire initial'
               ))
           ) $$,
        (SELECT collectivite_id FROM test_collectivite_periodicite),
        (SELECT id FROM test_indicateur_emt_periodicite WHERE code = 'test-emt-annuel')
    ),
    'La RPC EMT accepte une valeur annuelle canonique, y compris zéro'
);

SELECT is(
    (
        SELECT resultat
        FROM public.indicateur_valeur
        WHERE indicateur_id = (
            SELECT id
            FROM test_indicateur_emt_periodicite
            WHERE code = 'test-emt-annuel'
        )
          AND date_valeur = DATE '2031-01-01'
    ),
    0::double precision,
    'La valeur zéro de l''import EMT n''est pas assimilée à une absence'
);

SELECT lives_ok(
    format(
        $$ SELECT public.import_indicateur_emt_valeurs(
               %s,
               jsonb_build_array(jsonb_build_object(
                   'indicateur_id', %s,
                   'periodicite', 'annuelle',
                   'date_debut', '2031-01-01',
                   'resultat', 99,
                   'commentaire', 'nouveau commentaire'
               ))
           ) $$,
        (SELECT collectivite_id FROM test_collectivite_periodicite),
        (SELECT id FROM test_indicateur_emt_periodicite WHERE code = 'test-emt-annuel')
    ),
    'Un second import EMT traite la ligne existante sans la remplacer'
);

SELECT is(
    (
        SELECT resultat
        FROM public.indicateur_valeur
        WHERE indicateur_id = (
            SELECT id
            FROM test_indicateur_emt_periodicite
            WHERE code = 'test-emt-annuel'
        )
          AND date_valeur = DATE '2031-01-01'
    ),
    0::double precision,
    'Un import EMT ne remplace pas un résultat manuel existant'
);

SELECT is(
    (
        SELECT resultat_commentaire
        FROM public.indicateur_valeur
        WHERE indicateur_id = (
            SELECT id
            FROM test_indicateur_emt_periodicite
            WHERE code = 'test-emt-annuel'
        )
          AND date_valeur = DATE '2031-01-01'
    ),
    E'nouveau commentaire\n---\ncommentaire initial',
    'Un import EMT préserve l''historique des commentaires'
);

UPDATE public.indicateur_definition
SET periodicite = 'mensuelle'
WHERE id = (
    SELECT id
    FROM test_indicateur_emt_periodicite
    WHERE code = 'test-emt-mensuel'
);

SELECT throws_ok(
    format(
        $$ SELECT public.import_indicateur_emt_valeurs(
               %s,
               jsonb_build_array(jsonb_build_object(
                   'indicateur_id', %s,
                   'periodicite', 'annuelle',
                   'date_debut', '2031-01-01',
                   'resultat', 1,
                   'commentaire', NULL
               ))
           ) $$,
        (SELECT collectivite_id FROM test_collectivite_periodicite),
        (SELECT id FROM test_indicateur_emt_periodicite WHERE code = 'test-emt-mensuel')
    ),
    23514,
    NULL,
    'La RPC EMT refuse une définition devenue mensuelle'
);

SELECT is_empty(
    $$ SELECT 1
       FROM public.indicateur_valeur
       WHERE indicateur_id = (
           SELECT id
           FROM test_indicateur_emt_periodicite
           WHERE code = 'test-emt-mensuel'
       ) $$,
    'Le refus d''une définition mensuelle ne laisse aucune valeur EMT'
);

SELECT throws_ok(
    format(
        $$ SELECT public.import_indicateur_emt_valeurs(
               %s,
               jsonb_build_array(
                   jsonb_build_object(
                       'indicateur_id', %s,
                       'periodicite', 'annuelle',
                       'date_debut', '2032-01-01',
                       'resultat', 12
                   ),
                   jsonb_build_object(
                       'indicateur_id', %s,
                       'periodicite', 'annuelle',
                       'date_debut', '2032-01-01',
                       'resultat', 24
                   )
               )
           ) $$,
        (SELECT collectivite_id FROM test_collectivite_periodicite),
        (SELECT id FROM test_indicateur_emt_periodicite WHERE code = 'test-emt-annuel'),
        (SELECT id FROM test_indicateur_emt_periodicite WHERE code = 'test-emt-mensuel')
    ),
    23514,
    NULL,
    'Une cadence invalide annule le lot EMT complet'
);

SELECT is_empty(
    $$ SELECT 1
       FROM public.indicateur_valeur
       WHERE indicateur_id = (
           SELECT id
           FROM test_indicateur_emt_periodicite
           WHERE code = 'test-emt-annuel'
       )
         AND date_valeur = DATE '2032-01-01' $$,
    'Une erreur tardive ne laisse pas la première valeur du lot'
);

UPDATE public.indicateur_definition
SET periodicite = 'annuelle'
WHERE id = (
    SELECT id
    FROM test_indicateur_emt_periodicite
    WHERE code = 'test-emt-mensuel'
);

SELECT is(
    public.import_indicateur_emt_valeurs(
        (SELECT collectivite_id FROM test_collectivite_periodicite),
        jsonb_build_array(
            jsonb_build_object(
                'indicateur_id', (
                    SELECT id
                    FROM test_indicateur_emt_periodicite
                    WHERE code = 'test-emt-annuel'
                ),
                'periodicite', 'annuelle',
                'date_debut', '2033-01-01',
                'resultat', 1
            ),
            jsonb_build_object(
                'indicateur_id', (
                    SELECT id
                    FROM test_indicateur_emt_periodicite
                    WHERE code = 'test-emt-mensuel'
                ),
                'periodicite', 'annuelle',
                'date_debut', '2033-01-01',
                'resultat', 2
            )
        )
    ),
    2,
    'La RPC retourne le nombre d''écritures effectives du lot'
);

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_definition
               (collectivite_id, titre, unite, periodicite)
           VALUES (%s, 'test-periodicite-absente', 'kWh', NULL) $$,
        (SELECT collectivite_id FROM test_collectivite_periodicite)
    ),
    'Une ancienne création avec périodicité NULL reste acceptée pendant expand'
);

SELECT is(
    (SELECT count(*)::integer FROM public.indicateur_periodicite),
    2,
    'Le catalogue ne livre que les politiques annuelle et mensuelle'
);

SELECT ok(
    has_table_privilege('anon', 'public.indicateur_periodicite', 'SELECT'),
    'Le rôle anonyme peut lire le catalogue'
);

SELECT ok(
    has_table_privilege('authenticated', 'public.indicateur_periodicite', 'SELECT'),
    'Le rôle authentifié peut lire le catalogue'
);

SELECT ok(
    NOT has_table_privilege('anon', 'public.indicateur_periodicite', 'INSERT')
    AND NOT has_table_privilege('anon', 'public.indicateur_periodicite', 'UPDATE')
    AND NOT has_table_privilege('anon', 'public.indicateur_periodicite', 'DELETE'),
    'Le rôle anonyme ne peut pas modifier le catalogue'
);

SELECT ok(
    NOT has_table_privilege('authenticated', 'public.indicateur_periodicite', 'INSERT')
    AND NOT has_table_privilege('authenticated', 'public.indicateur_periodicite', 'UPDATE')
    AND NOT has_table_privilege('authenticated', 'public.indicateur_periodicite', 'DELETE'),
    'Le rôle authentifié ne peut pas modifier le catalogue'
);

SELECT ok(
    has_table_privilege('service_role', 'public.indicateur_periodicite', 'SELECT')
    AND NOT has_table_privilege('service_role', 'public.indicateur_periodicite', 'INSERT')
    AND NOT has_table_privilege('service_role', 'public.indicateur_periodicite', 'UPDATE')
    AND NOT has_table_privilege('service_role', 'public.indicateur_periodicite', 'DELETE'),
    'Le rôle de service peut lire le catalogue sans pouvoir le modifier'
);

SELECT ok(
    EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'verrouiller_graphe_calcul_indicateur_valeur'
          AND tgrelid = 'public.indicateur_valeur'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
          AND tgtype::integer = 30
          AND tgfoid =
              'public.verrouiller_graphe_calcul_indicateur_partage()'::regprocedure
    ),
    'Les écritures de valeurs prennent le bon verrou partagé BEFORE STATEMENT sur tous les événements'
);

SELECT is(
    (
        SELECT count(*)::integer
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
                      'valeur_calcule'
                  ]::name[]
              )
          )
    ),
    2,
    'Les mutations du graphe prennent le bon verrou exclusif BEFORE STATEMENT avec un masque exhaustif'
);

SELECT is(
    public.indicateur_date_debut_periode('annuelle', DATE '2028-04-03'),
    DATE '2028-01-01',
    'La politique SQL annuelle calcule le début canonique sans branche dans le consommateur'
);

SELECT is(
    public.indicateur_date_debut_periode('mensuelle', DATE '2028-04-03'),
    DATE '2028-04-01',
    'La politique SQL mensuelle calcule le début canonique sans branche dans le consommateur'
);

SELECT is(
    public.indicateur_date_debut_periode('annuelle', DATE '1999-12-31'),
    DATE '1999-01-01',
    'La politique SQL annuelle reste alignée avant sa date d''ancrage'
);

SELECT is(
    public.indicateur_date_debut_periode('mensuelle', DATE '1999-12-31'),
    DATE '1999-12-01',
    'La politique SQL mensuelle reste alignée avant sa date d''ancrage'
);

SELECT ok(
    position(
        'id.periodicite'
        IN pg_get_functiondef(
            'public.indicateurs_gaz_effet_serre(site_labellisation)'::regprocedure
        )
    ) > 0,
    'La projection publique des GES transporte explicitement la périodicité'
);

SELECT throws_ok(
    $$ SELECT public.indicateur_date_debut_periode('inconnue', DATE '2028-04-03') $$,
    23514,
    NULL,
    'Une politique inconnue est refusée sans fallback implicite'
);

SELECT throws_ok(
    $$ SELECT public.indicateur_date_debut_periode('annuelle', DATE '10000-01-01') $$,
    23514,
    NULL,
    'Une date postérieure au calendrier du value object est refusée en base'
);

SELECT throws_ok(
    $$ SELECT public.indicateur_date_debut_periode('annuelle', DATE '0001-01-01 BC') $$,
    23514,
    NULL,
    'Une date antérieure au calendrier du value object est refusée en base'
);

SELECT throws_ok(
    $$ INSERT INTO public.indicateur_periodicite
           (code, unite_calendaire, nombre_unites, date_ancrage)
       VALUES ('ancrage-hors-bornes', 'jour', 1, DATE '10000-01-01') $$,
    23514,
    NULL,
    'Une politique ne peut pas introduire un ancrage hors du calendrier partagé'
);

SELECT throws_ok(
    $$ INSERT INTO public.indicateur_periodicite
           (code, unite_calendaire, nombre_unites, date_ancrage)
       VALUES ('ancrage-mensuel-invalide', 'mois', 3, DATE '2000-01-02') $$,
    23514,
    NULL,
    'Une politique fondée sur les mois commence le premier jour et utilise un pas divisant l''année'
);

SELECT throws_ok(
    $$ UPDATE public.indicateur_periodicite
       SET nombre_unites = 6
       WHERE code = 'annuelle' $$,
    23514,
    NULL,
    'La description d''une cadence utilisée est immuable'
);

INSERT INTO public.indicateur_periodicite
    (code, unite_calendaire, nombre_unites, date_ancrage)
VALUES ('politique-immuable-test', 'jour', 2, DATE '2000-01-01');

SELECT throws_ok(
    $$ UPDATE public.indicateur_periodicite
       SET nombre_unites = 3
       WHERE code = 'politique-immuable-test' $$,
    23514,
    NULL,
    'Même une politique inutilisée ne peut pas changer de sens'
);

SELECT throws_ok(
    $$ DELETE FROM public.indicateur_periodicite
       WHERE code = 'politique-immuable-test' $$,
    23514,
    NULL,
    'Une politique publiée ne peut pas être supprimée'
);

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_valeur
               (indicateur_id, collectivite_id, date_valeur, resultat)
           VALUES (%s, %s, DATE '2027-01-01', 1) $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel'),
        (SELECT collectivite_id FROM test_collectivite_periodicite)
    ),
    'Une valeur annuelle au 1er janvier est acceptée directement en base'
);

SELECT lives_ok(
    $$ SELECT migration.verifier_retrait_periodicite_indicateur() $$,
    'Le downgrade reste possible tant que toutes les définitions sont annuelles'
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
SELECT valeur.id,
       valeur.indicateur_id,
       valeur.collectivite_id,
       valeur.metadonnee_id,
       'annuelle',
       DATE '2027-06-01',
       valeur.date_valeur,
       'normalisee'
FROM public.indicateur_valeur valeur
WHERE valeur.indicateur_id = (
    SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel'
);

SELECT lives_ok(
    format(
        $$ UPDATE public.indicateur_valeur
           SET indicateur_id = %s
           WHERE indicateur_id = %s;
           UPDATE public.indicateur_valeur
           SET indicateur_id = %s
           WHERE indicateur_id = %s $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-audit-reaffectation'),
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel'),
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel'),
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-audit-reaffectation')
    ),
    'Une ligne normalisée peut être réaffectée puis replacée sur sa définition initiale'
);

SELECT is_empty(
    $$ SELECT 1
       FROM migration.indicateur_valeur_periodicite_audit audit
       JOIN public.indicateur_valeur valeur ON valeur.id = audit.valeur_id
       WHERE valeur.indicateur_id = (
           SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel'
       ) $$,
    'La première réaffectation invalide définitivement son ancien audit de normalisation'
);

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_valeur
               (indicateur_id, collectivite_id, date_valeur, resultat)
           VALUES (%s, %s, DATE '2028-04-03', 2) $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel'),
        (SELECT collectivite_id FROM test_collectivite_periodicite)
    ),
    'Une ancienne date annuelle est normalisée pendant la transition'
);

SELECT lives_ok(
    format(
        $$ UPDATE public.indicateur_valeur
           SET date_valeur = DATE '2027-02-01'
           WHERE indicateur_id = %s AND date_valeur = DATE '2027-01-01' $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel')
    ),
    'Une modification annuelle historique reste compatible pendant la transition'
);

SELECT throws_ok(
    format(
        $$ UPDATE public.indicateur_definition
           SET periodicite = 'mensuelle'
           WHERE id = %s $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel')
    ),
    23514,
    NULL,
    'La périodicité ne change plus après la première valeur'
);

SELECT lives_ok(
    format(
        $$ UPDATE public.indicateur_definition
           SET periodicite = 'annuelle'
           WHERE id = %s $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel')
    ),
    'Réécrire la même périodicité reste autorisé'
);

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%s, %s) $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-audit-reaffectation'),
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel')
    ),
    'Un groupe de définitions annuelles homogènes est accepté'
);

SELECT throws_ok(
    format(
        $$ UPDATE public.indicateur_definition
           SET periodicite = 'mensuelle'
           WHERE id = %s $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel')
    ),
    23514,
    NULL,
    'Une définition liée ne peut pas rendre son groupe hétérogène'
);

SELECT lives_ok(
    format(
        $$ DELETE FROM public.indicateur_groupe
           WHERE parent = %1$s AND enfant = %2$s;
           UPDATE public.indicateur_definition
           SET periodicite = 'mensuelle'
           WHERE id IN (%1$s, %2$s);
           INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%1$s, %2$s);
           DELETE FROM public.indicateur_groupe
           WHERE parent = %1$s AND enfant = %2$s;
           UPDATE public.indicateur_definition
           SET periodicite = 'annuelle'
           WHERE id IN (%1$s, %2$s);
           INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%1$s, %2$s) $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-audit-reaffectation'),
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel')
    ),
    'Un import peut remplacer atomiquement un graphe homogène sans état intermédiaire invalide'
);

DELETE FROM public.indicateur_groupe
WHERE parent = (
    SELECT id FROM test_indicateur_periodicite WHERE code = 'test-audit-reaffectation'
)
  AND enfant = (
    SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel'
  );

SELECT lives_ok(
    format(
        $$ UPDATE public.indicateur_definition
           SET periodicite = 'mensuelle'
           WHERE id = %s $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel')
    ),
    'Une définition sans valeur peut encore changer de périodicité'
);

SELECT throws_ok(
    format(
        $$ INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%s, %s) $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-audit-reaffectation'),
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel')
    ),
    23514,
    NULL,
    'Un groupe ne peut pas agréger des définitions de périodicités différentes'
);

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_valeur
               (indicateur_id, collectivite_id, date_valeur, resultat)
           VALUES (%s, %s, DATE '2027-01-01', 10) $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel'),
        (SELECT collectivite_id FROM test_collectivite_periodicite)
    ),
    'Le premier jour de janvier est accepté pour un indicateur mensuel'
);

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_valeur
               (indicateur_id, collectivite_id, date_valeur, resultat)
           VALUES (%s, %s, DATE '2027-02-01', 20) $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel'),
        (SELECT collectivite_id FROM test_collectivite_periodicite)
    ),
    'Le premier jour de février est accepté pour un indicateur mensuel'
);

SELECT throws_ok(
    $$ SELECT migration.verifier_retrait_periodicite_indicateur() $$,
    23514,
    NULL,
    'Le downgrade refuse de perdre le sens d''une définition mensuelle'
);

SELECT is(
    (
        SELECT count(*)::integer
        FROM public.indicateur_valeur
        WHERE indicateur_id = (
            SELECT id
            FROM test_indicateur_periodicite
            WHERE code = 'test-a-convertir-en-mensuel'
        )
    ),
    2,
    'Janvier et février restent deux valeurs indépendantes'
);

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_valeur
               (indicateur_id, collectivite_id, date_valeur, resultat)
           VALUES (%s, %s, DATE '2027-03-02', 30) $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel'),
        (SELECT collectivite_id FROM test_collectivite_periodicite)
    ),
    'Une date mensuelle est normalisée pendant la transition'
);

SELECT throws_ok(
    format(
        $$ UPDATE public.indicateur_definition
           SET periodicite = 'annuelle'
           WHERE id = %s $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel')
    ),
    23514,
    NULL,
    'Une définition mensuelle alimentée ne peut pas devenir annuelle'
);

SELECT throws_ok(
    format(
        $$ UPDATE public.indicateur_valeur
           SET indicateur_id = %s
           WHERE indicateur_id = %s
             AND date_valeur = DATE '2027-02-01' $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel'),
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel')
    ),
    23505,
    NULL,
    'Un déplacement qui entrerait en collision après normalisation est refusé'
);

SELECT is_empty(
    $$
        SELECT valeur.id
        FROM public.indicateur_valeur valeur
        JOIN public.indicateur_definition definition
          ON definition.id = valeur.indicateur_id
        LEFT JOIN migration.indicateur_valeur_periodicite_audit audit
          ON audit.valeur_id = valeur.id
         AND audit.statut = 'conflit'
        WHERE valeur.date_valeur <> public.indicateur_date_debut_periode(
            definition.periodicite,
            valeur.date_valeur
        )
          AND audit.valeur_id IS NULL
    $$,
    'Aucune date non canonique ne peut échapper à l''audit historique'
);

SELECT is_empty(
    $$
        SELECT valeur_id
        FROM migration.indicateur_valeur_periodicite_audit
        WHERE statut = 'conflit'
    $$,
    'La périodicité obligatoire ne laisse aucun conflit historique non remédié'
);

SELECT is(
    (SELECT is_nullable FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'indicateur_definition'
       AND column_name = 'periodicite'),
    'YES',
    'La phase expand conserve la colonne nullable pour les anciens writers'
);

SELECT lives_ok(
    $$ INSERT INTO public.indicateur_definition (titre, unite)
       VALUES ('test-ancien-writer-periodicite', 'kWh') $$,
    'Une ancienne création de définition sans périodicité reste acceptée'
);

SELECT is(
    (SELECT periodicite FROM public.indicateur_definition
     WHERE titre = 'test-ancien-writer-periodicite'),
    'annuelle',
    'Le défaut annuel classe explicitement les anciennes créations'
);

SELECT is(
    (SELECT date_valeur FROM public.indicateur_valeur
     WHERE indicateur_id = (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel')
       AND resultat = 2),
    DATE '2028-01-01',
    'Une date historique annuelle est persistée au début canonique de sa période'
);

SELECT is(
    (SELECT date_valeur FROM public.indicateur_valeur
     WHERE indicateur_id = (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-a-convertir-en-mensuel')
       AND resultat = 30),
    DATE '2027-03-01',
    'Une date historique mensuelle est persistée au début canonique de sa période'
);

ROLLBACK;
