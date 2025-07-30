CREATE OR REPLACE FUNCTION delete_navigation_plans(collectivite_id integer)
RETURNS TABLE (
    id integer,
    nom text,
    fiches integer[],
    ancestors integer[],
    depth integer,
    sort_path text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT can_read_acces_restreint(collectivite_id) THEN
        PERFORM set_config('response.status', '403', true);
        RAISE 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    END IF;

    RETURN QUERY
        SELECT flat.*
        FROM axe a
        JOIN flat_axes(a.id, 1) flat ON TRUE
        WHERE a.collectivite_id = collectivite_id
          AND a.parent IS NULL
        ORDER BY naturalsort(sort_path);
END
$$;
