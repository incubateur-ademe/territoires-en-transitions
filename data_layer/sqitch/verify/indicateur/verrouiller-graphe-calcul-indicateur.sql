-- Verify tet:indicateur/verrouiller-graphe-calcul-indicateur on pg
BEGIN;
DO $$
BEGIN
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
                      'valeur_calcule'
                  ]::name[]
              )
          )
    ), 'Les mutations du graphe doivent prendre le verrou exclusif avant les lignes';

END $$;

-- Exercise the statement triggers through direct SQL, including an empty write.
-- The key and modes must match IndicateurDefinitionLockRepository exactly.
SAVEPOINT valeur_write;
UPDATE public.indicateur_valeur SET resultat = resultat WHERE false;
DO $$
DECLARE graph_key bigint := hashtextextended('indicateur-calculation-graph', 0);
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM pg_locks
        WHERE pid = pg_backend_pid() AND locktype = 'advisory'
          AND classid = ((graph_key >> 32) & 4294967295)::oid
          AND objid = (graph_key & 4294967295)::oid
          AND objsubid = 1 AND mode = 'ShareLock' AND granted
    ), 'Une écriture SQL de valeur doit prendre le même verrou partagé que le backend';
END $$;
ROLLBACK TO SAVEPOINT valeur_write;

UPDATE public.indicateur_definition SET valeur_calcule = valeur_calcule WHERE false;
DO $$
DECLARE graph_key bigint := hashtextextended('indicateur-calculation-graph', 0);
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM pg_locks
        WHERE pid = pg_backend_pid() AND locktype = 'advisory'
          AND classid = ((graph_key >> 32) & 4294967295)::oid
          AND objid = (graph_key & 4294967295)::oid
          AND objsubid = 1 AND mode = 'ExclusiveLock' AND granted
    ), 'Une écriture SQL de formule doit prendre le même verrou exclusif que le backend';
END $$;
ROLLBACK;
