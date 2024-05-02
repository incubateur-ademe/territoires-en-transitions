-- Deploy tet:indicateur/personnalise to pg

BEGIN;

create policy allow_delete
    on indicateur_personnalise_definition for delete
    using (have_edition_acces(collectivite_id));

-- Cascade delete on table fiche_action_indicateur

ALTER TABLE "public"."fiche_action_indicateur" 
    DROP CONSTRAINT "fiche_action_indicateur_indicateur_personnalise_id_fkey";

ALTER TABLE "public"."fiche_action_indicateur" 
    ADD FOREIGN KEY ("indicateur_personnalise_id") 
    REFERENCES "public"."indicateur_personnalise_definition" ("id") 
    ON DELETE CASCADE;

-- Cascade delete on table indicateur_confidentiel

ALTER TABLE "public"."indicateur_confidentiel" 
    DROP CONSTRAINT "indicateur_confidentiel_indicateur_perso_id_fkey";

ALTER TABLE "public"."indicateur_confidentiel" 
    ADD FOREIGN KEY ("indicateur_perso_id") 
    REFERENCES "public"."indicateur_personnalise_definition" ("id") 
    ON DELETE CASCADE;

-- Cascade delete on table indicateur_perso_objectif_commentaire

ALTER TABLE "public"."indicateur_perso_objectif_commentaire" 
    DROP CONSTRAINT "indicateur_perso_objectif_commentaire_indicateur_id_fkey";

ALTER TABLE "public"."indicateur_perso_objectif_commentaire" 
    ADD FOREIGN KEY ("indicateur_id") 
    REFERENCES "public"."indicateur_personnalise_definition" ("id") 
    ON DELETE CASCADE;

-- Cascade delete on table indicateur_perso_resultat_commentaire

ALTER TABLE "public"."indicateur_perso_resultat_commentaire" 
    DROP CONSTRAINT "indicateur_perso_resultat_commentaire_indicateur_id_fkey";

ALTER TABLE "public"."indicateur_perso_resultat_commentaire" 
    ADD FOREIGN KEY ("indicateur_id") 
    REFERENCES "public"."indicateur_personnalise_definition" ("id") 
    ON DELETE CASCADE;

-- Cascade delete on table indicateur_personnalise_objectif

ALTER TABLE "public"."indicateur_personnalise_objectif" 
    DROP CONSTRAINT "indicateur_personnalise_objectif_indicateur_id_fkey";

ALTER TABLE "public"."indicateur_personnalise_objectif" 
    ADD FOREIGN KEY ("indicateur_id") 
    REFERENCES "public"."indicateur_personnalise_definition" ("id") 
    ON DELETE CASCADE;

-- Cascade delete on table indicateur_personnalise_resultat

ALTER TABLE "public"."indicateur_personnalise_resultat" 
    DROP CONSTRAINT "indicateur_personnalise_resultat_indicateur_id_fkey";

ALTER TABLE "public"."indicateur_personnalise_resultat" 
    ADD FOREIGN KEY ("indicateur_id") 
    REFERENCES "public"."indicateur_personnalise_definition" ("id") 
    ON DELETE CASCADE;

-- Cascade delete on table indicateur_personnalise_thematique

ALTER TABLE "public"."indicateur_personnalise_thematique" 
    DROP CONSTRAINT "indicateur_personnalise_thematique_indicateur_id_fkey";

ALTER TABLE "public"."indicateur_personnalise_thematique" 
    ADD FOREIGN KEY ("indicateur_id") 
    REFERENCES "public"."indicateur_personnalise_definition" ("id") 
    ON DELETE CASCADE;

-- Cascade delete on table indicateur_pilote

ALTER TABLE "public"."indicateur_pilote" 
    DROP CONSTRAINT "indicateur_pilote_indicateur_personnalise_definition_id_fk";

ALTER TABLE "public"."indicateur_pilote" 
    ADD FOREIGN KEY ("indicateur_perso_id") 
    REFERENCES "public"."indicateur_personnalise_definition" ("id") 
    ON DELETE CASCADE;

-- Cascade delete on table indicateur_service_tag

ALTER TABLE "public"."indicateur_service_tag" 
    DROP CONSTRAINT "indicateur_service_tag_indicateur_personnalise_definition_id_fk";

ALTER TABLE "public"."indicateur_service_tag" 
    ADD FOREIGN KEY ("indicateur_perso_id") 
    REFERENCES "public"."indicateur_personnalise_definition" ("id") 
    ON DELETE CASCADE;

COMMIT;
