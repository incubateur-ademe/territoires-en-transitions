-- Revert tet:plan_action/fiches from pg

BEGIN;

-- Cascade on fiche_action_note.fiche_id
ALTER TABLE fiche_action_note
DROP CONSTRAINT fiche_action_note_fiche_id_fkey;

ALTER TABLE fiche_action_note
ADD CONSTRAINT fiche_action_note_fiche_id_fkey
FOREIGN KEY (fiche_id)
REFERENCES fiche_action(id)
;

-- Cascade on fiche_action_note.created_by
ALTER TABLE fiche_action_note
DROP CONSTRAINT fiche_action_note_created_by_fkey;

ALTER TABLE fiche_action_note
ADD CONSTRAINT fiche_action_note_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES auth.users(id)
;

-- Cascade on fiche_action_note.modified_by
ALTER TABLE fiche_action_note
DROP CONSTRAINT fiche_action_note_modified_by_fkey;

ALTER TABLE fiche_action_note
ADD CONSTRAINT fiche_action_note_modified_by_fkey
FOREIGN KEY (modified_by)
REFERENCES auth.users(id)
;

-- Cascade on fiche_action_libre_tag.created_by
ALTER TABLE fiche_action_libre_tag
DROP CONSTRAINT fiche_action_libre_tag_created_by_fkey;

ALTER TABLE fiche_action_libre_tag
ADD CONSTRAINT fiche_action_libre_tag_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES auth.users(id)
;

-- Cascade on fiche_action_libre_tag.libre_tag_id
ALTER TABLE fiche_action_libre_tag
DROP CONSTRAINT fiche_action_libre_tag_libre_tag_id_fkey;

ALTER TABLE fiche_action_libre_tag
ADD CONSTRAINT fiche_action_libre_tag_libre_tag_id_fkey
FOREIGN KEY (libre_tag_id)
REFERENCES public.libre_tag(id)
;

-- Cascade on fiche_action_partenaire_tag.partenaire_tag_id
ALTER TABLE fiche_action_partenaire_tag
DROP CONSTRAINT fiche_action_partenaire_tag_partenaire_tag_id_fkey;

ALTER TABLE fiche_action_partenaire_tag
ADD CONSTRAINT fiche_action_partenaire_tag_partenaire_tag_id_fkey
FOREIGN KEY (partenaire_tag_id)
REFERENCES public.partenaire_tag(id)
;

-- Cascade on fiche_action_service_tag.fiche_id
ALTER TABLE fiche_action_service_tag
DROP CONSTRAINT fiche_action_service_tag_fiche_id_fkey;

ALTER TABLE fiche_action_service_tag
ADD CONSTRAINT fiche_action_service_tag_fiche_id_fkey
FOREIGN KEY (fiche_id)
REFERENCES public.fiche_action(id)
;

-- Cascade on fiche_action_structure_tag.fiche_id
ALTER TABLE fiche_action_structure_tag
DROP CONSTRAINT fiche_action_structure_tag_fiche_id_fkey;

ALTER TABLE fiche_action_structure_tag
ADD CONSTRAINT fiche_action_structure_tag_fiche_id_fkey
FOREIGN KEY (fiche_id)
REFERENCES public.fiche_action(id)
;

COMMIT;
