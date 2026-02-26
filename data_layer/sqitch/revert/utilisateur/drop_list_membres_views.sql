-- Revert tet:utilisateur/drop_list_membres_views from pg

BEGIN;

-- Restore collectivite_membres (from droits_v2@v2.101.0)
CREATE OR REPLACE FUNCTION collectivite_membres(id integer)
    RETURNS TABLE(user_id text, prenom text, nom text, email text, telephone text, niveau_acces niveau_acces, fonction membre_fonction, details_fonction text, champ_intervention referentiel[])
    SECURITY DEFINER
    LANGUAGE sql
AS
$$
WITH droits_dcp_membre AS (
    SELECT d.user_id,
           p.prenom,
           p.nom,
           p.email,
           p.telephone,
           d.niveau_acces,
           m.fonction,
           m.details_fonction,
           m.champ_intervention
    FROM private_utilisateur_droit d
    LEFT JOIN utilisateur.dcp_display p ON p.user_id = d.user_id
    LEFT JOIN private_collectivite_membre m
        ON m.user_id = d.user_id AND m.collectivite_id = d.collectivite_id
    WHERE d.collectivite_id = collectivite_membres.id
      AND d.active
),
invitations AS (
    SELECT null::uuid             AS user_id,
           null                   AS prenom,
           null                   AS nom,
           i.email,
           null                   AS telephone,
           i.niveau::niveau_acces AS niveau_acces,
           null::membre_fonction  AS fonction,
           null                   AS details_fonction,
           null::referentiel[]    AS champ_intervention
    FROM utilisateur.invitation i
    WHERE i.collectivite_id = collectivite_membres.id
      AND i.pending
),
merged AS (
    SELECT * FROM droits_dcp_membre
    WHERE is_authenticated()
    UNION
    SELECT * FROM invitations
    WHERE have_edition_acces(collectivite_membres.id)
)
SELECT * FROM merged
WHERE est_verifie() OR have_lecture_acces(collectivite_membres.id)
ORDER BY CASE fonction
             WHEN 'referent' THEN 1
             WHEN 'technique' THEN 2
             WHEN 'politique' THEN 3
             WHEN 'conseiller' THEN 4
             ELSE 5
         END,
         nom,
         prenom;
$$;

COMMENT ON FUNCTION collectivite_membres IS
    'Les informations de tous les membres d''une collectivité étant donné son id.';

-- Restore update_collectivite_membre_details_fonction (from membre@v2.7.0)
CREATE OR REPLACE FUNCTION update_collectivite_membre_details_fonction(collectivite_id integer, membre_id uuid, details_fonction text)
    RETURNS json
AS
$$
DECLARE
    invitation_id uuid;
BEGIN
    IF have_admin_acces(update_collectivite_membre_details_fonction.collectivite_id)
        OR auth.uid() = membre_id
    THEN
        IF membre_id IN (SELECT user_id
                         FROM private_collectivite_membre pcm
                         WHERE pcm.collectivite_id = update_collectivite_membre_details_fonction.collectivite_id)
        THEN
            UPDATE private_collectivite_membre
            SET details_fonction = update_collectivite_membre_details_fonction.details_fonction
            WHERE user_id = membre_id
              AND private_collectivite_membre.collectivite_id =
                  update_collectivite_membre_details_fonction.collectivite_id;
        ELSE
            INSERT INTO private_collectivite_membre(collectivite_id, user_id, details_fonction)
            VALUES (update_collectivite_membre_details_fonction.collectivite_id, membre_id,
                    update_collectivite_membre_details_fonction.details_fonction);
        END IF;
        RETURN json_build_object('message', 'Le détail de la fonction du membre a été mise à jour.');
    ELSE
        PERFORM set_config('response.status', '401', true);
        RETURN json_build_object('error', 'Vous n''avez pas les droits pour modifier la fonction de ce membre.');
    END IF;
END
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_collectivite_membre_details_fonction IS
    'Met à jour le champs details_fonction d''un membre s''il est autorisé à le faire';

-- Restore update_collectivite_membre_fonction (from membre@v2.7.0)
CREATE OR REPLACE FUNCTION update_collectivite_membre_fonction(collectivite_id integer, membre_id uuid, fonction membre_fonction)
    RETURNS json
AS
$$
DECLARE
    invitation_id uuid;
BEGIN
    IF have_admin_acces(update_collectivite_membre_fonction.collectivite_id)
        OR auth.uid() = membre_id
    THEN
        IF membre_id IN (SELECT user_id
                         FROM private_collectivite_membre pcm
                         WHERE pcm.collectivite_id = update_collectivite_membre_fonction.collectivite_id)
        THEN
            UPDATE private_collectivite_membre
            SET fonction = update_collectivite_membre_fonction.fonction
            WHERE user_id = membre_id
              AND private_collectivite_membre.collectivite_id = update_collectivite_membre_fonction.collectivite_id;
        ELSE
            INSERT INTO private_collectivite_membre(collectivite_id, user_id, fonction)
            VALUES (update_collectivite_membre_fonction.collectivite_id, membre_id,
                    update_collectivite_membre_fonction.fonction);
        END IF;
        RETURN json_build_object('message', 'La fonction du membre a été mise à jour.');
    ELSE
        PERFORM set_config('response.status', '403', true);
        RETURN json_build_object('error', 'Vous n''avez pas les droits pour modifier la fonction de ce membre.');
    END IF;
END
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_collectivite_membre_fonction IS
    'Met à jour le champs fonction d''un membre s''il est autorisé à le faire';

-- Restore update_collectivite_membre_niveau_acces (from membre@v3.4.0)
CREATE OR REPLACE FUNCTION update_collectivite_membre_niveau_acces(collectivite_id integer, membre_id uuid, niveau_acces niveau_acces)
    RETURNS json
AS
$$
DECLARE
    invitation_id uuid;
BEGIN
    IF have_admin_acces(update_collectivite_membre_niveau_acces.collectivite_id)
    THEN
        IF membre_id IN (SELECT user_id
                         FROM private_utilisateur_droit pud
                         WHERE pud.collectivite_id = update_collectivite_membre_niveau_acces.collectivite_id)
        THEN
            UPDATE private_utilisateur_droit
            SET niveau_acces = update_collectivite_membre_niveau_acces.niveau_acces,
                modified_at  = now()
            WHERE user_id = membre_id
              AND private_utilisateur_droit.collectivite_id = update_collectivite_membre_niveau_acces.collectivite_id;
        ELSE
            PERFORM set_config('response.status', '401', true);
            RETURN json_build_object('error', 'Cet utilisateur n''est pas membre de la collectivité.');
        END IF;
        RETURN json_build_object('message', 'Le niveau d''acces du membre a été mise à jour.');
    ELSE
        PERFORM set_config('response.status', '401', true);
        RETURN json_build_object('error',
                                 'Vous n''avez pas les droits admin, vous ne pouvez pas éditer le niveau d''acces de ce membre.');
    END IF;
END
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_collectivite_membre_niveau_acces IS
    'Met à jour le niveau d''acces d''un membre si l''utilisateur connecté est admin';

-- Restore update_collectivite_membre_champ_intervention (from membre@v2.7.0)
CREATE OR REPLACE FUNCTION update_collectivite_membre_champ_intervention(collectivite_id integer, membre_id uuid, champ_intervention referentiel[])
    RETURNS json
AS
$$
DECLARE
    invitation_id uuid;
BEGIN
    IF have_admin_acces(update_collectivite_membre_champ_intervention.collectivite_id)
        OR auth.uid() = membre_id
    THEN
        IF membre_id IN (SELECT user_id
                         FROM private_collectivite_membre pcm
                         WHERE pcm.collectivite_id = update_collectivite_membre_champ_intervention.collectivite_id)
        THEN
            UPDATE private_collectivite_membre
            SET champ_intervention = update_collectivite_membre_champ_intervention.champ_intervention
            WHERE user_id = membre_id
              AND private_collectivite_membre.collectivite_id =
                  update_collectivite_membre_champ_intervention.collectivite_id;
        ELSE
            INSERT INTO private_collectivite_membre(collectivite_id, user_id, champ_intervention)
            VALUES (update_collectivite_membre_champ_intervention.collectivite_id, membre_id,
                    update_collectivite_membre_champ_intervention.champ_intervention);
        END IF;
        RETURN json_build_object('message', 'Le champ d''intervention du membre a été mise à jour.');
    ELSE
        PERFORM set_config('response.status', '403', true);
        RETURN json_build_object('error',
                                 'Vous n''avez pas les droits pour modifier le champ d''intervention de ce membre.');
    END IF;
END
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_collectivite_membre_champ_intervention IS
    'Met à jour le champ d''intervention d''un membre s''il est autorisé à le faire';

-- Restore remove_membre_from_collectivite (from membre.sql)
CREATE OR REPLACE FUNCTION remove_membre_from_collectivite(collectivite_id integer, email text)
    RETURNS json
AS
$$
DECLARE
    found_user_id uuid;
BEGIN
    IF is_authenticated()
    THEN
        SELECT u.id INTO found_user_id FROM auth.users u WHERE u.email = remove_membre_from_collectivite.email;
        IF have_admin_acces(remove_membre_from_collectivite.collectivite_id)
            OR auth.uid() = found_user_id
        THEN
            IF found_user_id IN (SELECT user_id
                                 FROM private_utilisateur_droit pud
                                 WHERE pud.collectivite_id = remove_membre_from_collectivite.collectivite_id)
            THEN
                UPDATE private_utilisateur_droit
                SET active      = false,
                    modified_at = now()
                WHERE user_id = found_user_id
                  AND private_utilisateur_droit.collectivite_id = remove_membre_from_collectivite.collectivite_id;

                DELETE FROM private_collectivite_membre pcm
                WHERE pcm.collectivite_id = remove_membre_from_collectivite.collectivite_id
                  AND pcm.user_id = found_user_id;

                RETURN json_build_object('message', 'Les accès de l''utilisateur ont été supprimés.');

            ELSIF remove_membre_from_collectivite.email IN (SELECT i.email
                                                           FROM utilisateur.invitation i
                                                           WHERE i.collectivite_id = remove_membre_from_collectivite.collectivite_id
                                                             AND pending)
            THEN
                UPDATE utilisateur.invitation i
                SET active = false
                WHERE i.email = remove_membre_from_collectivite.email
                  AND i.collectivite_id = remove_membre_from_collectivite.collectivite_id;
                RETURN json_build_object('message', 'L''invitation à été supprimée.');

            END IF;

            RETURN json_build_object('error', 'Cet utilisateur n''est pas membre de la collectivité.');
        ELSE
            PERFORM set_config('response.status', '401', true);
            RETURN json_build_object('error',
                                     'Vous n''avez pas les droits admin, vous ne pouvez pas retirer les droits d''accès d''un utilisateur');
        END IF;
    END IF;
    PERFORM set_config('response.status', '401', true);
END
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION remove_membre_from_collectivite IS
    'Supprime les accès d''un membre si l''utilisateur connecté est admin';

COMMIT;
