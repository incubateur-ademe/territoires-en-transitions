-- Deploy tet:referentiel/action_service to pg

BEGIN;

CREATE TABLE "public"."action_service" (
    "collectivite_id" integer NOT NULL,
    "action_id" action_id NOT NULL,
    "service_tag_id" integer NOT NULL,
    FOREIGN KEY ("collectivite_id")
        REFERENCES "public"."collectivite"("id"),
    FOREIGN KEY ("action_id")
        REFERENCES "public"."action_relation"("id"),
    FOREIGN KEY ("service_tag_id")
        REFERENCES "public"."service_tag"("id")
        ON DELETE CASCADE,
    PRIMARY KEY ("collectivite_id", "action_id", "service_tag_id")
);

COMMENT ON TABLE "public"."action_service"
    IS 'In référentiel, we keep "action" as a technical name, but use "mesure" in the UI.';

CREATE POLICY allow_read
    ON "public"."action_service"
    FOR SELECT
    USING (can_read_acces_restreint(collectivite_id));

CREATE POLICY allow_insert
    ON "public"."action_service"
    FOR INSERT
    WITH CHECK (have_edition_acces(collectivite_id));

CREATE POLICY allow_update
    ON "public"."action_service"
    FOR UPDATE
    USING (have_edition_acces(collectivite_id));

CREATE POLICY allow_delete
    ON "public"."action_service"
    FOR DELETE
    USING (have_edition_acces(collectivite_id));

COMMIT;

