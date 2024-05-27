-- Deploy tet:collectivite/tableau_de_bord_filtre to pg

BEGIN;


CREATE TABLE "public"."tableau_de_bord_module" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "collectivite_id" int4 NOT NULL,
    "user_id" uuid,
    "titre" varchar NOT NULL,
    "type" varchar NOT NULL,
    "options" jsonb NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "modified_at" timestamptz DEFAULT now(),
    CONSTRAINT "public_tableau_de_bord_module_collectivite_id_fkey" 
        FOREIGN KEY ("collectivite_id") 
        REFERENCES "public"."commune"("id") 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT "public_tableau_de_bord_module_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "public"."dcp"("user_id")
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- RLS
alter table public.tableau_de_bord_module enable row level security;
create policy allow_read
    on public.tableau_de_bord_module
    using (true);

-- Add the moddatetime extension to the database
create extension if not exists "moddatetime" with schema "extensions";

-- Automatically update modified_at column when row is updated
CREATE TRIGGER on_tableau_de_bord_module_modified
    BEFORE UPDATE ON public.tableau_de_bord_module
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime (modified_at);



COMMIT;
