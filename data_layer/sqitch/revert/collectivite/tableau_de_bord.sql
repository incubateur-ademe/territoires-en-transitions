-- Revert tet:collectivite/tableau_de_bord_filtre from pg

BEGIN;

-- Drop the trigger
DROP TRIGGER IF EXISTS "on_tableau_de_bord_module_modified" 
    ON "public"."tableau_de_bord_module";

-- Remove the moddatetime extension from the database
DROP EXTENSION IF EXISTS "moddatetime";

-- Drop the table
DROP TABLE "public"."tableau_de_bord_module";

COMMIT;
