-- Deploy tet:plan_action/fiches to pg

BEGIN;

-- Supprime les computed field associés à la vue `fiche_actions`
-- qui étaient utilisés pour les filtres du tableau de bord.
-- (à la place on filtre désormais directement sur la table `fiche_action`)

DROP FUNCTION IF EXISTS public.collectivite_service_tag(public.collectivite);

DROP FUNCTION IF EXISTS public.collectivite_structure_tag(public.collectivite);

DROP FUNCTION IF EXISTS public.collectivite_personne_tag(public.collectivite);

DROP FUNCTION IF EXISTS public.collectivite_axe(public.collectivite);


-- Ajoute la foreign key de `financeur_tag` vers `collectivite` si elle n'existe pas.

ALTER TABLE "public"."financeur_tag"
DROP CONSTRAINT IF EXISTS "financeur_tag_collectivite_id_fkey";

ALTER TABLE "public"."financeur_tag" 
ADD CONSTRAINT "financeur_tag_collectivite_id_fkey"
FOREIGN KEY ("collectivite_id") 
REFERENCES "public"."collectivite" ("id") 
ON UPDATE CASCADE
ON DELETE RESTRICT;


-- Ajoute la foreign key de `personne_tag` vers `collectivite` si elle n'existe pas.

ALTER TABLE "public"."personne_tag"
DROP CONSTRAINT IF EXISTS "personne_tag_collectivite_id_fkey";

ALTER TABLE "public"."personne_tag" 
ADD CONSTRAINT "personne_tag_collectivite_id_fkey"
FOREIGN KEY ("collectivite_id") 
REFERENCES "public"."collectivite" ("id") 
ON UPDATE CASCADE
ON DELETE RESTRICT;


-- Ajoute la foreign key de `service_tag` vers `collectivite` si elle n'existe pas.

ALTER TABLE "public"."service_tag"
DROP CONSTRAINT IF EXISTS "service_tag_collectivite_id_fkey";

ALTER TABLE "public"."service_tag" 
ADD CONSTRAINT "service_tag_collectivite_id_fkey"
FOREIGN KEY ("collectivite_id") 
REFERENCES "public"."collectivite" ("id") 
ON UPDATE CASCADE
ON DELETE RESTRICT;


COMMIT;

