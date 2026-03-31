-- Revert tet:referentiel/drop-action-historique-triggers from pg

BEGIN;

-- Recreate functions (latest version from historique_modified_by.sql)
CREATE OR REPLACE FUNCTION historique.save_action_statut() RETURNS trigger AS $$
DECLARE
    updated integer;
BEGIN
    UPDATE historique.action_statut
    SET avancement          = new.avancement,
        avancement_detaille = new.avancement_detaille,
        modified_at         = new.modified_at,
        concerne            = new.concerne
    WHERE id IN (SELECT id
                 FROM historique.action_statut
                 WHERE collectivite_id = new.collectivite_id
                   AND action_id = new.action_id
                   AND modified_by = COALESCE(auth.uid(), new.modified_by)
                   AND modified_at > new.modified_at - interval '1 hour'
                 ORDER BY modified_at DESC
                 LIMIT 1)
    RETURNING id INTO updated;

    IF updated IS NULL THEN
        INSERT INTO historique.action_statut
        VALUES (default,
                new.collectivite_id,
                new.action_id,
                new.avancement,
                old.avancement,
                new.avancement_detaille,
                old.avancement_detaille,
                new.concerne,
                old.concerne,
                COALESCE(auth.uid(), new.modified_by),
                old.modified_by,
                new.modified_at,
                old.modified_at);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION historique.save_action_precision() RETURNS trigger AS $$
DECLARE
    updated integer;
BEGIN
    UPDATE historique.action_precision
    SET precision   = new.commentaire,
        modified_at = new.modified_at
    WHERE id IN (SELECT id
                 FROM historique.action_precision
                 WHERE collectivite_id = new.collectivite_id
                   AND action_id = new.action_id
                   AND modified_by = COALESCE(auth.uid(), new.modified_by)
                   AND modified_at > new.modified_at - interval '1 hour'
                 ORDER BY modified_at DESC
                 LIMIT 1)
    RETURNING id INTO updated;

    IF updated IS NULL THEN
        INSERT INTO historique.action_precision
        VALUES (default,
                new.collectivite_id,
                new.action_id,
                new.commentaire,
                old.commentaire,
                COALESCE(auth.uid(), new.modified_by),
                old.modified_by,
                new.modified_at,
                old.modified_at);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
CREATE TRIGGER save_history
    AFTER INSERT OR UPDATE ON action_statut
    FOR EACH ROW
    EXECUTE PROCEDURE historique.save_action_statut();

CREATE TRIGGER save_history
    AFTER INSERT OR UPDATE ON action_commentaire
    FOR EACH ROW
    EXECUTE PROCEDURE historique.save_action_precision();

create function
    private.move_action_data(a action_id, b action_id)
    returns void
as
$$
update action_statut
set action_id = b
where action_id = a;

update action_commentaire
set action_id = b
where action_id = a;

$$ language sql;
comment on function private.move_action_data is
    'Déplace le contenu d''une action vers une autre.';

COMMIT;
