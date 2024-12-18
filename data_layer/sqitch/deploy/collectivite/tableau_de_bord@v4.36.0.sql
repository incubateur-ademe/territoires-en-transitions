-- Deploy tet:collectivite/tableau_de_bord_filtre to pg

BEGIN;


CREATE TABLE "public"."tableau_de_bord_module" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "collectivite_id" int4 NOT NULL,
    "user_id" uuid,
    "titre" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "type" varchar NOT NULL,
    "options" jsonb NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "modified_at" timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY ("collectivite_id") 
        REFERENCES "public"."collectivite"("id") 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    FOREIGN KEY ("user_id") 
        REFERENCES "public"."dcp"("user_id")
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- Crée un index unique sur slug, user_id, collectivite
CREATE UNIQUE INDEX 
    ON "public"."tableau_de_bord_module" 
    (slug, user_id, collectivite_id);

-- RLS
alter table public.tableau_de_bord_module enable row level security;

create policy allow_read
    on public.tableau_de_bord_module
    for select to "authenticated" 
    using (
        have_lecture_acces(collectivite_id)
    );

create policy allow_insert
    on public.tableau_de_bord_module
    for insert to "authenticated"
    with check (
        have_edition_acces(collectivite_id)
    );

create policy allow_update
    on public.tableau_de_bord_module
    for update to "authenticated" 
    using (
        have_edition_acces(collectivite_id) 
        and (
            user_id = auth.uid() or user_id is null 
        )
    );

-- Add the moddatetime extension to the database
create extension if not exists "moddatetime" with schema "extensions";

-- Automatically update modified_at column when row is updated
CREATE TRIGGER on_tableau_de_bord_module_modified
    BEFORE UPDATE ON public.tableau_de_bord_module
    FOR EACH ROW
    EXECUTE PROCEDURE moddatetime (modified_at);



COMMIT;
