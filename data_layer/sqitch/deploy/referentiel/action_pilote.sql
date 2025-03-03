-- Deploy tet:referentiel/action_pilote to pg

BEGIN;

CREATE TABLE "public"."action_pilote" (
    "collectivite_id" integer NOT NULL,
    "action_id" action_id NOT NULL,
    "user_id" uuid,
    "tag_id" integer,
    FOREIGN KEY ("collectivite_id")
        REFERENCES "public"."collectivite"("id"),
    FOREIGN KEY ("action_id")
        REFERENCES "public"."action_relation"("id"),
    FOREIGN KEY ("user_id")
        REFERENCES "public"."dcp"("user_id")
        ON DELETE CASCADE,
    FOREIGN KEY ("tag_id")
        REFERENCES "public"."personne_tag"("id")
        ON DELETE CASCADE,
    CONSTRAINT "either_user_or_tag_not_null"
        CHECK (user_id IS NOT NULL OR tag_id IS NOT NULL),
    CONSTRAINT "one_user_per_action"
        UNIQUE (collectivite_id, action_id, user_id),
    CONSTRAINT "one_tag_per_action"
        UNIQUE (collectivite_id, action_id, tag_id)
);

COMMENT ON TABLE "public"."action_pilote"
    IS 'In référentiel, we keep "action" as a technical name, but use "mesure" in the UI.';

CREATE POLICY allow_read
    ON "public"."action_pilote"
    FOR SELECT
    USING (can_read_acces_restreint(collectivite_id));

CREATE POLICY allow_insert
    ON "public"."action_pilote"
    FOR INSERT
    WITH CHECK (have_edition_acces(collectivite_id));

CREATE POLICY allow_update
    ON "public"."action_pilote"
    FOR UPDATE
    USING (have_edition_acces(collectivite_id));

CREATE POLICY allow_delete
    ON "public"."action_pilote"
    FOR DELETE
    USING (have_edition_acces(collectivite_id));

COMMIT;
