-- Revert tet:evaluation/drop-reponse-historique-triggers from pg

BEGIN;

CREATE TRIGGER set_modified_at_before_reponse_choix_update
    BEFORE UPDATE
    ON reponse_choix
    FOR EACH ROW
EXECUTE PROCEDURE update_modified_at();

CREATE TRIGGER set_modified_at_before_reponse_binaire_update
    BEFORE UPDATE
    ON reponse_binaire
    FOR EACH ROW
EXECUTE PROCEDURE update_modified_at();

CREATE TRIGGER set_modified_at_before_reponse_proportion_update
    BEFORE UPDATE
    ON reponse_proportion
    FOR EACH ROW
EXECUTE PROCEDURE update_modified_at();

CREATE OR REPLACE FUNCTION historique.save_reponse_binaire()
    RETURNS trigger
AS
$$
DECLARE
    updated integer;
BEGIN
    UPDATE historique.reponse_binaire
    SET reponse     = new.reponse,
        modified_at = new.modified_at
    WHERE id IN (SELECT id
                 FROM historique.reponse_binaire
                 WHERE collectivite_id = new.collectivite_id
                   AND question_id = new.question_id
                   AND modified_by = auth.uid()
                   AND modified_at > new.modified_at - interval '1 hour'
                 ORDER BY modified_by DESC
                 LIMIT 1)
    RETURNING id INTO updated;

    IF updated IS NULL THEN
        INSERT INTO historique.reponse_binaire (collectivite_id,
                                                question_id,
                                                reponse,
                                                previous_reponse,
                                                modified_by,
                                                modified_at)
        VALUES (new.collectivite_id,
                new.question_id,
                new.reponse,
                old.reponse,
                auth.uid(),
                new.modified_at);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION historique.save_reponse_choix()
    RETURNS trigger
AS
$$
DECLARE
    updated integer;
BEGIN
    UPDATE historique.reponse_choix
    SET reponse     = new.reponse,
        modified_at = new.modified_at
    WHERE id IN (SELECT id
                 FROM historique.reponse_choix
                 WHERE collectivite_id = new.collectivite_id
                   AND question_id = new.question_id
                   AND modified_by = auth.uid()
                   AND modified_at > new.modified_at - interval '1 hour'
                 ORDER BY modified_by DESC
                 LIMIT 1)
    RETURNING id INTO updated;

    IF updated IS NULL THEN
        INSERT INTO historique.reponse_choix (collectivite_id,
                                              question_id,
                                              reponse,
                                              previous_reponse,
                                              modified_by,
                                              modified_at)
        VALUES (new.collectivite_id,
                new.question_id,
                new.reponse,
                old.reponse,
                auth.uid(),
                new.modified_at);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION historique.save_reponse_proportion()
    RETURNS trigger
AS
$$
DECLARE
    updated integer;
BEGIN
    UPDATE historique.reponse_proportion
    SET reponse     = new.reponse,
        modified_at = new.modified_at
    WHERE id IN (SELECT id
                 FROM historique.reponse_proportion
                 WHERE collectivite_id = new.collectivite_id
                   AND question_id = new.question_id
                   AND modified_by = auth.uid()
                   AND modified_at > new.modified_at - interval '1 hour'
                 ORDER BY modified_by DESC
                 LIMIT 1)
    RETURNING id INTO updated;

    IF updated IS NULL THEN
        INSERT INTO historique.reponse_proportion (collectivite_id,
                                                   question_id,
                                                   reponse,
                                                   previous_reponse,
                                                   modified_by,
                                                   modified_at)
        VALUES (new.collectivite_id,
                new.question_id,
                new.reponse,
                old.reponse,
                auth.uid(),
                new.modified_at);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION historique.save_justification()
    RETURNS trigger
AS
$$
DECLARE
    updated integer;
BEGIN
    UPDATE historique.justification
    SET texte       = new.texte,
        modified_at = new.modified_at
    WHERE id IN (SELECT id
                 FROM historique.justification
                 WHERE collectivite_id = new.collectivite_id
                   AND question_id = new.question_id
                   AND modified_by = new.modified_by
                   AND modified_at > new.modified_at - interval '1 hour'
                 ORDER BY modified_by DESC
                 LIMIT 1)
    RETURNING id INTO updated;

    IF updated IS NULL THEN
        INSERT INTO historique.justification (collectivite_id,
                                              question_id,
                                              modified_by,
                                              previous_modified_by,
                                              modified_at,
                                              previous_modified_at,
                                              texte,
                                              previous_texte)
        VALUES (new.collectivite_id,
                new.question_id,
                auth.uid(),
                old.modified_by,
                new.modified_at,
                old.modified_at,
                new.texte,
                old.texte);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER save_history
    AFTER INSERT OR UPDATE
    ON reponse_binaire
    FOR EACH ROW
EXECUTE PROCEDURE historique.save_reponse_binaire();

CREATE TRIGGER save_history
    AFTER INSERT OR UPDATE
    ON reponse_choix
    FOR EACH ROW
EXECUTE PROCEDURE historique.save_reponse_choix();

CREATE TRIGGER save_history
    AFTER INSERT OR UPDATE
    ON reponse_proportion
    FOR EACH ROW
EXECUTE PROCEDURE historique.save_reponse_proportion();

CREATE TRIGGER save_history
    AFTER INSERT OR UPDATE
    ON justification
    FOR EACH ROW
EXECUTE PROCEDURE historique.save_justification();

COMMIT;
